// Reliability Lab — data + math layer.
//
// Everything here runs in the browser with no backend. We pull real signals:
//   • the site's own CI/CD history from the public GitHub Actions API
//   • Core Web Vitals measured for the current visit (web-vitals)
//   • Navigation/Resource Timing for this page load
//   • live latency by pinging a same-origin asset
// …and turn them into the kind of numbers an SRE actually watches: the DORA
// Four Keys, Core Web Vitals ratings, SLOs with error budgets, and an incident
// timeline. Results are cached/persisted in localStorage so trends build up.

import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals'

export const REPO = 'kranthi0003/kranthi-kiran-site'
const RUNS_URL = `https://api.github.com/repos/${REPO}/actions/runs?per_page=100`
const DEPLOY_WORKFLOW = 'Build and Deploy' // the workflow that builds + ships to gh-pages
const RUNS_CACHE_KEY = 'rel:runs:v1'
const RUNS_TTL_MS = 10 * 60 * 1000 // 10 min — be gentle with the 60/hr unauth budget
const VITALS_KEY = 'rel:vitals:v1'
const LAT_KEY = 'rel:latency:v1'

const now = () => Date.now()
const parse = (t) => (t ? new Date(t).getTime() : null)

/* ------------------------------------------------------------------ *
 * GitHub Actions — fetch recent workflow runs (cached)
 * ------------------------------------------------------------------ */

function readCache(key, ttl) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { ts, data } = JSON.parse(raw)
    if (ttl && now() - ts > ttl) return null
    return data
  } catch { return null }
}
function writeCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ ts: now(), data })) } catch { /* ignore */ }
}

// Fetch two pages (~200 most recent runs) for solid stats while staying light.
export async function fetchRuns({ force = false } = {}) {
  if (!force) {
    const cached = readCache(RUNS_CACHE_KEY, RUNS_TTL_MS)
    if (cached) return { runs: cached, cached: true }
  }
  const pages = [1, 2]
  const all = []
  for (const page of pages) {
    const res = await fetch(`${RUNS_URL}&page=${page}`, { headers: { Accept: 'application/vnd.github+json' } })
    if (!res.ok) {
      if (res.status === 403) throw new Error('rate-limited')
      throw new Error(`github ${res.status}`)
    }
    const json = await res.json()
    const runs = json.workflow_runs || []
    all.push(...runs)
    if (runs.length < 100) break
  }
  const slim = all.map(r => ({
    id: r.id,
    name: r.name,
    event: r.event,
    status: r.status,
    conclusion: r.conclusion,
    created_at: r.created_at,
    run_started_at: r.run_started_at || r.created_at,
    updated_at: r.updated_at,
    commit_ts: r.head_commit?.timestamp || null,
    title: r.display_title || r.head_commit?.message?.split('\n')[0] || '',
    url: r.html_url,
    sha: (r.head_sha || '').slice(0, 7),
  }))
  writeCache(RUNS_CACHE_KEY, slim)
  return { runs: slim, cached: false }
}

// Just the production deploys (the "Build and Deploy" workflow), newest first.
export function deployRuns(runs) {
  let list = runs.filter(r => r.name === DEPLOY_WORKFLOW && r.status === 'completed')
  if (list.length === 0) list = runs.filter(r => /deploy/i.test(r.name) && r.status === 'completed')
  return list.sort((a, b) => parse(b.created_at) - parse(a.created_at))
}

/* ------------------------------------------------------------------ *
 * DORA Four Keys (computed from the real deploy history)
 * ------------------------------------------------------------------ */

const median = (arr) => {
  if (!arr.length) return null
  const s = [...arr].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

export function computeDORA(runs) {
  const deploys = deployRuns(runs)
  const completed = deploys
  const success = completed.filter(r => r.conclusion === 'success')
  const failed = completed.filter(r => r.conclusion === 'failure')

  // Window for frequency: span of the deploy history we actually have.
  const newest = completed.length ? parse(completed[0].created_at) : now()
  const oldest = completed.length ? parse(completed[completed.length - 1].created_at) : now()
  const spanDays = Math.max((newest - oldest) / 86400000, 1)
  const perWeek = (success.length / spanDays) * 7

  // Lead time for changes: commit timestamp → deploy finished (successful runs).
  const leadTimes = success
    .map(r => (r.commit_ts && r.updated_at ? parse(r.updated_at) - parse(r.commit_ts) : null))
    .filter(v => v != null && v >= 0)
  const leadMs = median(leadTimes)

  // Change failure rate.
  const cfr = completed.length ? failed.length / completed.length : 0

  // MTTR: for each failure, time until the next successful deploy after it.
  const chrono = [...completed].sort((a, b) => parse(a.created_at) - parse(b.created_at))
  const recoveries = []
  for (let i = 0; i < chrono.length; i++) {
    if (chrono[i].conclusion !== 'failure') continue
    for (let j = i + 1; j < chrono.length; j++) {
      if (chrono[j].conclusion === 'success') {
        recoveries.push(parse(chrono[j].updated_at) - parse(chrono[i].created_at))
        break
      }
    }
  }
  const mttrMs = median(recoveries)

  // Run durations (successful), for the duration trend.
  const durations = success
    .map(r => parse(r.updated_at) - parse(r.run_started_at))
    .filter(v => v >= 0)

  return {
    deployCount: completed.length,
    successCount: success.length,
    failCount: failed.length,
    spanDays,
    perWeek,
    perDay: perWeek / 7,
    leadMs,
    cfr,
    mttrMs,
    durations,
    medianDurationMs: median(durations),
    deploys: completed,
  }
}

// DORA performance tiers (Elite / High / Medium / Low) per the Four Keys research.
export function doraTiers(d) {
  const freqTier =
    d.perDay >= 1 ? 'Elite' : d.perWeek >= 1 ? 'High' : d.perWeek >= 0.23 ? 'Medium' : 'Low'
  const lead = d.leadMs
  const leadTier =
    lead == null ? '—' : lead < 3600e3 ? 'Elite' : lead < 7 * 864e5 ? 'High' : lead < 30 * 864e5 ? 'Medium' : 'Low'
  const cfrTier = d.cfr <= 0.15 ? 'Elite' : d.cfr <= 0.30 ? 'High' : d.cfr <= 0.45 ? 'Medium' : 'Low'
  const mttr = d.mttrMs
  const mttrTier =
    mttr == null ? '—' : mttr < 3600e3 ? 'Elite' : mttr < 864e5 ? 'High' : mttr < 7 * 864e5 ? 'Medium' : 'Low'
  return { freqTier, leadTier, cfrTier, mttrTier }
}

// Deploys per day for the last `days` days (for the frequency bar chart).
export function deployFrequencySeries(runs, days = 14) {
  const deploys = deployRuns(runs).filter(r => r.conclusion === 'success')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const buckets = Array.from({ length: days }, (_, i) => {
    const day = new Date(today); day.setDate(today.getDate() - (days - 1 - i))
    return { day, count: 0, label: day.toLocaleDateString(undefined, { weekday: 'short' }) }
  })
  const start = buckets[0].day.getTime()
  deploys.forEach(r => {
    const t = parse(r.created_at)
    if (t < start) return
    const idx = Math.floor((t - start) / 86400000)
    if (idx >= 0 && idx < days) buckets[idx].count++
  })
  return buckets
}

// Incidents = failed deploy runs, newest first, with recovery time if known.
export function incidents(runs) {
  const chrono = deployRuns(runs).sort((a, b) => parse(a.created_at) - parse(b.created_at))
  const out = []
  for (let i = 0; i < chrono.length; i++) {
    if (chrono[i].conclusion !== 'failure') continue
    let recoveredMs = null
    for (let j = i + 1; j < chrono.length; j++) {
      if (chrono[j].conclusion === 'success') { recoveredMs = parse(chrono[j].updated_at) - parse(chrono[i].created_at); break }
    }
    out.push({ ...chrono[i], recoveredMs })
  }
  return out.reverse()
}

/* ------------------------------------------------------------------ *
 * Core Web Vitals (this visit) + rolling session history
 * ------------------------------------------------------------------ */

// Google's "good / needs-improvement / poor" thresholds.
export const CWV_THRESHOLDS = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
}
export function rate(metric, value) {
  const t = CWV_THRESHOLDS[metric]
  if (!t || value == null) return 'unknown'
  if (value <= t[0]) return 'good'
  if (value <= t[1]) return 'needs-improvement'
  return 'poor'
}

// Subscribe to web-vitals; calls onUpdate({LCP, INP, CLS, FCP, TTFB}) as they arrive.
// We also seed from the Performance API up front so FCP/LCP/TTFB appear even in
// environments where buffered observers don't replay past entries; web-vitals
// then refines each value with its more precise measurement.
export function collectVitals(onUpdate) {
  const state = {}
  try {
    const paint = performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')
    if (paint) state.FCP = paint.startTime
    const nav = performance.getEntriesByType('navigation')[0]
    if (nav) state.TTFB = Math.max(Math.round(nav.responseStart - nav.startTime), 0)
    const lcp = performance.getEntriesByType('largest-contentful-paint')
    if (lcp && lcp.length) state.LCP = lcp[lcp.length - 1].startTime
  } catch { /* Performance API gaps — web-vitals will fill in */ }
  const push = (m) => { state[m.name] = m.value; onUpdate({ ...state }) }
  onLCP(push); onINP(push); onCLS(push); onFCP(push); onTTFB(push)
  if (Object.keys(state).length) onUpdate({ ...state })
  return state
}

// Persist a session's vitals snapshot for the trend view (keep last 20).
export function saveVitalsSnapshot(vitals) {
  try {
    const hist = JSON.parse(localStorage.getItem(VITALS_KEY) || '[]')
    hist.push({ ts: now(), ...vitals })
    localStorage.setItem(VITALS_KEY, JSON.stringify(hist.slice(-20)))
  } catch { /* ignore */ }
}
export function loadVitalsHistory() {
  try { return JSON.parse(localStorage.getItem(VITALS_KEY) || '[]') } catch { return [] }
}

/* ------------------------------------------------------------------ *
 * Navigation / Resource timing for this page load
 * ------------------------------------------------------------------ */

export function navTiming() {
  const nav = performance.getEntriesByType('navigation')[0]
  if (!nav) return null
  const seg = (a, b) => Math.max(Math.round(nav[b] - nav[a]), 0)
  return {
    dns: seg('domainLookupStart', 'domainLookupEnd'),
    tcp: seg('connectStart', 'connectEnd'),
    tls: nav.secureConnectionStart ? seg('secureConnectionStart', 'connectEnd') : 0,
    ttfb: Math.round(nav.responseStart - nav.startTime),
    download: seg('responseStart', 'responseEnd'),
    domInteractive: Math.round(nav.domInteractive - nav.startTime),
    domComplete: Math.round(nav.domComplete - nav.startTime),
    load: Math.round(nav.loadEventEnd - nav.startTime),
  }
}

export function pageWeight() {
  const res = performance.getEntriesByType('resource')
  const sum = (arr) => Math.round(arr.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024)
  const byType = (pred) => res.filter(pred)
  const js = byType(r => r.initiatorType === 'script')
  const css = byType(r => r.initiatorType === 'link' || /\.css(\?|$)/.test(r.name))
  const img = byType(r => r.initiatorType === 'img' || /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(r.name))
  const font = byType(r => /\.(woff2?|ttf|otf|eot)(\?|$)/i.test(r.name))
  return {
    totalKB: sum(res),
    jsKB: sum(js), jsCount: js.length,
    cssKB: sum(css), cssCount: css.length,
    imgKB: sum(img), imgCount: img.length,
    fontKB: sum(font), fontCount: font.length,
    requests: res.length,
  }
}

/* ------------------------------------------------------------------ *
 * Live latency pinger (same-origin asset, cache-busted)
 * ------------------------------------------------------------------ */

// Measure round-trip to a tiny same-origin asset. Returns ms or null on failure.
export async function pingLatency() {
  const asset = `${import.meta.env.BASE_URL || '/'}favicon.svg?_=${now()}`
  const start = performance.now()
  try {
    await fetch(asset, { method: 'GET', cache: 'no-store' })
    return Math.round(performance.now() - start)
  } catch {
    return null
  }
}

export function loadLatencyHistory() {
  try { return JSON.parse(localStorage.getItem(LAT_KEY) || '[]') } catch { return [] }
}
export function pushLatency(ms) {
  try {
    const hist = loadLatencyHistory()
    hist.push({ ts: now(), ms })
    const trimmed = hist.slice(-120)
    localStorage.setItem(LAT_KEY, JSON.stringify(trimmed))
    return trimmed
  } catch { return [] }
}

/* ------------------------------------------------------------------ *
 * SLOs + error budgets (computed from the real signals above)
 * ------------------------------------------------------------------ */

export function computeSLOs({ dora, latency, vitals }) {
  const slos = []

  // Availability — from recent live pings (a warm-up probe is excluded).
  const total = latency.length
  const ok = latency.filter(p => p.ms != null).length
  const avail = total ? ok / total : 1
  const measuring = total < 10
  slos.push({
    id: 'availability',
    name: 'Availability',
    target: 0.999,
    actual: avail,
    unit: '%',
    measuring,
    detail: measuring ? 'warming up — gathering live checks…' : `${ok}/${total} recent live checks succeeded`,
  })

  // Performance — % of LCP samples in the "good" band (this + prior sessions).
  const hist = loadVitalsHistory()
  const lcps = hist.map(h => h.LCP).filter(v => v != null)
  if (vitals.LCP != null) lcps.push(vitals.LCP)
  const goodLcp = lcps.filter(v => v <= CWV_THRESHOLDS.LCP[0]).length
  const lcpRatio = lcps.length ? goodLcp / lcps.length : 1
  slos.push({
    id: 'lcp',
    name: 'LCP under 2.5s',
    target: 0.95,
    actual: lcpRatio,
    unit: '%',
    measuring: lcps.length === 0,
    detail: lcps.length ? `${goodLcp}/${lcps.length} sessions in the "good" band` : 'warming up — measuring LCP…',
  })

  // Deploy success — from the real Actions history.
  const dep = dora.deployCount || 0
  const depRatio = dep ? dora.successCount / dep : 1
  slos.push({
    id: 'deploy',
    name: 'Deploy success',
    target: 0.95,
    actual: depRatio,
    unit: '%',
    measuring: dep === 0,
    detail: dep ? `${dora.successCount}/${dep} deploys succeeded` : 'loading deploy history…',
  })

  return slos.map(s => {
    const allowedFail = 1 - s.target
    const actualFail = 1 - s.actual
    const budgetUsed = s.measuring ? 0 : (allowedFail > 0 ? Math.min(actualFail / allowedFail, 1.5) : 0)
    return { ...s, met: s.measuring ? true : s.actual >= s.target, budgetUsed }
  })
}

/* ------------------------------------------------------------------ *
 * Formatting helpers
 * ------------------------------------------------------------------ */

export function fmtDuration(ms) {
  if (ms == null) return '—'
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(s < 10 ? 1 : 0)}s`
  const m = s / 60
  if (m < 60) return `${m.toFixed(m < 10 ? 1 : 0)}m`
  const h = m / 60
  if (h < 24) return `${h.toFixed(h < 10 ? 1 : 0)}h`
  return `${(h / 24).toFixed(1)}d`
}

export function fmtRelTime(tsOrIso) {
  const t = typeof tsOrIso === 'number' ? tsOrIso : parse(tsOrIso)
  if (!t) return '—'
  const diff = now() - t
  const s = Math.round(diff / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  return `${d}d ago`
}

export function fmtMetric(metric, value) {
  if (value == null) return '—'
  if (metric === 'CLS') return value.toFixed(3)
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`
  return `${Math.round(value)}ms`
}

export function fmtPct(ratio, digits = 1) {
  if (ratio == null) return '—'
  return `${(ratio * 100).toFixed(digits)}%`
}
