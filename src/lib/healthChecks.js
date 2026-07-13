// ============================================================
// Site self–health checks. Everything the portfolio depends on at
// runtime is probed live from the visitor's browser (this is a static
// site on GitHub Pages — there is no server cron), grouped by the
// feature it powers so an incident reads like a real status page.
//
// Each check returns { ok, slow, ms, detail }. Groups roll up to a
// status with primary/fallback awareness (e.g. Weather is only "down"
// when BOTH its sources fail; "degraded" when just the primary is out).
// ============================================================

const SLOW_MS = 2500 // over this = 🟡 slow (reachable but sluggish)
const TIMEOUT_MS = 9000 // give up on a probe after this

// Race a probe against a timeout so one dead endpoint can't hang the panel.
function withTimeout(promise, ms = TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)),
  ])
}

// A JSON/GET probe that counts any HTTP response as "reachable". For most
// of these a 200 is expected; we still surface non-ok as down.
async function httpProbe(url, { headers, method = 'GET', okStatuses } = {}) {
  const t = performance.now()
  const res = await withTimeout(fetch(url, { method, headers, cache: 'no-store' }))
  const ms = Math.round(performance.now() - t)
  const ok = okStatuses ? okStatuses.includes(res.status) : res.ok
  return { ok, ms, slow: ms > SLOW_MS, detail: ok ? `${res.status} · ${ms}ms` : `HTTP ${res.status}` }
}

// An <img> reachability probe (for hosts that block fetch/CORS, e.g. YouTube).
function imgProbe(url) {
  return new Promise(resolve => {
    const t = performance.now()
    const img = new Image()
    const done = (ok) => {
      const ms = Math.round(performance.now() - t)
      resolve({ ok, ms, slow: ms > SLOW_MS, detail: ok ? `${ms}ms` : 'unreachable' })
    }
    img.onload = () => done(true)
    img.onerror = () => done(false)
    const to = setTimeout(() => done(false), TIMEOUT_MS)
    img.onload = () => { clearTimeout(to); done(true) }
    img.onerror = () => { clearTimeout(to); done(false) }
    img.src = `${url}${url.includes('?') ? '&' : '?'}cb=${Date.now()}`
  })
}

const SB = 'https://urfmdrhuagbgvghjolvf.supabase.co'
const SB_KEY = 'sb_publishable_GB-5ytPAF6UkOuLpOaCHPw_6p3GrwSz'
const GH_USER = 'kranthi0003'
const BTC_ADDR = 'bc1quaunu4xa0jgeh446jlx2mchlv4gda9tj0dqz9e'

// The chatbot backend: an empty-messages POST is rejected by Groq with a
// validation error — which proves the whole proxy→Groq path is live
// without spending a single token. Any HTTP response = up.
async function groqProbe() {
  const t = performance.now()
  const res = await withTimeout(fetch(`${SB}/functions/v1/groq-proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SB_KEY}` },
    body: JSON.stringify({ messages: [], max_tokens: 1 }),
  }))
  const ms = Math.round(performance.now() - t)
  // Reachable is what matters here (400/422 = up and validating input).
  return { ok: res.status > 0, ms, slow: ms > SLOW_MS, detail: `reached · ${ms}ms` }
}

// The resume is a hashed Vite asset; import it so we probe the real URL.
import resumeUrl from '../../assets/Kranthi_Resume.pdf'

export const GROUPS = [
  {
    id: 'site', label: 'Website', critical: true,
    blurb: 'The site itself and its deployed assets',
    checks: [
      { id: 'home', label: 'Homepage', run: () => httpProbe('/', { method: 'HEAD' }) },
      { id: 'resume', label: 'Résumé PDF', run: () => httpProbe(resumeUrl, { method: 'HEAD' }) },
    ],
  },
  {
    id: 'weather', label: 'Weather widget', critical: true,
    blurb: 'Hyperlocal weather with a global fallback',
    checks: [
      { id: 'wu', label: 'Weather Union', primary: true, run: () => httpProbe('https://www.weatherunion.com/gw/weather/external/v0/get_weather_data?latitude=17.385&longitude=78.4867', { headers: { 'x-zomato-api-key': 'f2351e34deca7c8c7260e77793c3517a' } }) },
      { id: 'openmeteo', label: 'Open-Meteo (fallback)', fallback: true, run: () => httpProbe('https://api.open-meteo.com/v1/forecast?latitude=17.38&longitude=78.48&current=temperature_2m') },
    ],
  },
  {
    id: 'btc', label: 'Bitcoin ticker', critical: true,
    blurb: 'Live BTC price on the wallet + dashboard',
    checks: [
      { id: 'coinbase', label: 'Coinbase', primary: true, run: () => httpProbe('https://api.exchange.coinbase.com/products/BTC-USD/ticker') },
      { id: 'binance', label: 'Binance (fallback)', fallback: true, run: () => httpProbe('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT') },
    ],
  },
  {
    id: 'chatbot', label: 'AI chatbot', critical: true,
    blurb: 'The "Ask Kranthi" assistant backend',
    checks: [
      { id: 'groq', label: 'Groq proxy', run: groqProbe },
      { id: 'supabase', label: 'Supabase edge', run: () => httpProbe(`${SB}/auth/v1/health`, { headers: { apikey: SB_KEY } }) },
    ],
  },
  {
    id: 'crypto', label: 'Crypto dashboard', critical: false,
    blurb: 'Market, mempool and on-chain data',
    checks: [
      { id: 'coingecko', label: 'CoinGecko', run: () => httpProbe('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd') },
      { id: 'chain', label: 'blockchain.info', run: () => httpProbe(`https://blockchain.info/rawaddr/${BTC_ADDR}?limit=0&cors=true`) },
      { id: 'mempool', label: 'mempool.space', run: () => httpProbe('https://mempool.space/api/v1/fees/recommended') },
      { id: 'fng', label: 'Fear & Greed', run: () => httpProbe('https://api.alternative.me/fng/?limit=1') },
    ],
  },
  {
    id: 'github', label: 'GitHub activity', critical: false,
    blurb: 'Live repos, commits and contribution graph',
    checks: [
      { id: 'ghapi', label: 'GitHub API', run: () => httpProbe(`https://api.github.com/users/${GH_USER}`) },
      { id: 'contrib', label: 'Contributions graph', run: () => httpProbe(`https://github-contributions-api.jogruber.de/v4/${GH_USER}?y=last`) },
    ],
  },
  {
    id: 'media', label: 'Media', critical: false,
    blurb: 'Video reels and imagery',
    checks: [
      { id: 'yt', label: 'YouTube', run: () => imgProbe('https://i.ytimg.com/vi/PQnS87AnnR0/hqdefault.jpg') },
      { id: 'reel', label: 'Lock-In reel', run: () => httpProbe('/lockin-intro.mp4', { method: 'HEAD' }) },
      { id: 'poster', label: 'Reel poster', run: () => httpProbe('/lockin-intro-poster.jpg', { method: 'HEAD' }) },
    ],
  },
  {
    id: 'widgets', label: 'Content widgets', critical: false,
    blurb: 'Blog feed, Hacker News and geocoding',
    checks: [
      { id: 'devto', label: 'dev.to', run: () => httpProbe('https://dev.to/api/articles?per_page=1&top=1') },
      { id: 'hn', label: 'Hacker News', run: () => httpProbe('https://hacker-news.firebaseio.com/v0/topstories.json') },
      { id: 'geo', label: 'Geocoding', run: () => httpProbe('https://nominatim.openstreetmap.org/reverse?lat=17.38&lon=78.48&format=json') },
    ],
  },
]

// Roll a group up to 'ok' | 'degraded' | 'down', respecting fallbacks.
export function rollupGroup(results, group) {
  const rs = group.checks.map(c => results[c.id]).filter(Boolean)
  if (!rs.length || rs.some(r => r.status === 'checking')) return 'checking'
  const isDown = (c) => results[c.id]?.status === 'down'
  const hasPrimary = group.checks.some(c => c.primary)
  const hasFallback = group.checks.some(c => c.fallback)

  if (hasPrimary && hasFallback) {
    // primary/fallback pair: down only if BOTH out; degraded if either out
    const primaryDown = group.checks.filter(c => c.primary).every(isDown)
    const fallbackDown = group.checks.filter(c => c.fallback).every(isDown)
    if (primaryDown && fallbackDown) return 'down'
    if (primaryDown || fallbackDown) return 'degraded'
  } else {
    const downCount = group.checks.filter(isDown).length
    if (downCount === group.checks.length) return 'down'
    if (downCount > 0) return 'degraded'
  }
  if (rs.some(r => r.status === 'slow')) return 'degraded'
  return 'ok'
}

// Overall banner state from all group rollups.
export function overallStatus(groupStatuses) {
  const vals = Object.entries(groupStatuses)
  if (!vals.length || vals.some(([, s]) => s === 'checking')) return 'checking'
  const criticalDown = GROUPS.some(g => g.critical && groupStatuses[g.id] === 'down')
  const anyDown = vals.some(([, s]) => s === 'down')
  const anyDegraded = vals.some(([, s]) => s === 'degraded')
  if (criticalDown) return 'outage'
  if (anyDown || anyDegraded) return 'degraded'
  return 'operational'
}

// Run one check into a normalized result record.
async function runOne(check) {
  try {
    const r = await check.run()
    return { status: r.ok ? (r.slow ? 'slow' : 'ok') : 'down', ms: r.ms ?? null, detail: r.detail || '' }
  } catch (e) {
    return { status: 'down', ms: null, detail: e.message === 'timeout' ? 'timed out' : 'unreachable' }
  }
}

// Run every check in parallel; onUpdate streams partial results in as
// each probe lands so the panel fills progressively.
export async function runAllChecks(onUpdate) {
  const results = {}
  const all = []
  for (const g of GROUPS) {
    for (const c of g.checks) {
      results[c.id] = { status: 'checking', ms: null, detail: '' }
      all.push(
        runOne(c).then(res => { results[c.id] = res; onUpdate && onUpdate({ ...results }) })
      )
    }
  }
  onUpdate && onUpdate({ ...results })
  await Promise.all(all)
  return results
}

export const STATUS_META = {
  operational: { label: 'All systems operational', color: '#22c55e', dot: '#22c55e' },
  degraded: { label: 'Degraded performance', color: '#f59e0b', dot: '#f59e0b' },
  outage: { label: 'Major outage', color: '#ef4444', dot: '#ef4444' },
  checking: { label: 'Running checks…', color: '#94a3b8', dot: '#94a3b8' },
}
