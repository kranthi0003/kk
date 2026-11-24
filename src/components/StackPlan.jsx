import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'
import { STACK_PAYLOAD as PAYLOAD } from '../lib/stackPayload'

/* ------------------------------------------------------------------ *
 * A private, password-protected long-term plan and ledger.
 *
 * The plan ships encrypted (PBKDF2-SHA256 → AES-GCM-256, the scheme the
 * other private pages use) and decrypts only in the browser. Every word and
 * number of the plan lives in the payload, so this file is a generic
 * renderer: a monthly contribution schedule with regular step-ups,
 * projection scenarios with a stress test, buying rules keyed to the
 * distance from a running high, a ledger with first-in-first-out cost basis
 * and yearly tax estimates, and checklists.
 *
 * Records are saved in localStorage on this device, AES-GCM encrypted with a
 * random key that exists only inside the payload, so nothing readable is
 * stored. Backups are the same ciphertext as a file; the CSV export is made
 * only when asked for. The optional price feed is named in the payload and
 * fetched only after unlocking. "Keep this device unlocked" stores the
 * derived, non-extractable key in IndexedDB; locking forgets it.
 * ------------------------------------------------------------------ */

const enc = new TextEncoder()
const dec = new TextDecoder()
const fromB64 = (value) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0))
function toB64(bytes) {
  let out = ''
  for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  return btoa(out)
}
const STORE = 'sk_state_v1'
const PREV = 'sk_state_v1_prev'
const DAY_MS = 86400000
const EPS = 1e-9
const pad = (n) => String(n).padStart(2, '0')
const list = (v) => (Array.isArray(v) ? v : v ? [v] : [])
const num = (v, d = 0) => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace(/[,\s_]/g, ''))
  return Number.isFinite(n) ? n : d
}
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
const fill = (text, vars) => String(text || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''))
const smooth = () => (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth')
const pick = (obj, path) => String(path || '').split('.').filter(Boolean).reduce((o, k) => (o == null ? o : o[k]), Array.isArray(obj) ? obj[0] : obj)

async function deriveKey(passphrase) {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromB64(PAYLOAD.salt), iterations: PAYLOAD.iter || 200000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt'],
  )
}

async function openPayload(key) {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(PAYLOAD.iv) }, key, fromB64(PAYLOAD.ct))
  const { stateKey, ...data } = JSON.parse(dec.decode(plain))
  if (!stateKey || !data.meta || !data.plan || !Array.isArray(data.views) || !data.views.length) throw new Error('Unexpected content')
  const sealKey = await crypto.subtle.importKey('raw', fromB64(stateKey), 'AES-GCM', false, ['encrypt', 'decrypt'])
  return { data, sealKey }
}

async function seal(key, value) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(value))))
  return { v: 1, iv: toB64(iv), ct: toB64(ct) }
}

async function unseal(key, box) {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(box.iv) }, key, fromB64(box.ct))
  return JSON.parse(dec.decode(plain))
}

// The remembered key lives in IndexedDB as a non-extractable CryptoKey.
function vault(mode, act) {
  return new Promise((resolve) => {
    let req
    try { req = indexedDB.open('sk-vault', 1) } catch { resolve(null); return }
    req.onupgradeneeded = () => req.result.createObjectStore('keys')
    req.onerror = () => resolve(null)
    req.onblocked = () => resolve(null)
    req.onsuccess = () => {
      const db = req.result
      try {
        const tx = db.transaction('keys', mode)
        const r = act(tx.objectStore('keys'))
        tx.oncomplete = () => { db.close(); resolve(mode === 'readonly' ? r.result ?? null : true) }
        tx.onabort = () => { db.close(); resolve(null) }
      } catch { db.close(); resolve(null) }
    }
  })
}
const recallKey = () => Promise.race([vault('readonly', (s) => s.get('k')), new Promise((r) => setTimeout(() => r(null), 1500))])
const rememberKey = (key) => vault('readwrite', (s) => s.put(key, 'k'))
const forgetKey = () => vault('readwrite', (s) => s.delete('k'))

// ── Dates (calendar maths on whole UTC days and on month indexes) ─────────
const localIso = (t = new Date()) => `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
const utc = (iso) => Date.parse(`${iso}T00:00:00Z`)
const isIso = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(utc(v))
const isYm = (v) => typeof v === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(v)
const ymOf = (iso) => String(iso).slice(0, 7)
const ymIndex = (ym) => Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1
const ymFrom = (i) => `${Math.floor(i / 12)}-${pad((i % 12) + 1)}`
const ymAdd = (ym, n) => ymFrom(ymIndex(ym) + n)
const fmtYm = (ym, month = 'short') => new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1))
  .toLocaleDateString('en-GB', { month, year: 'numeric', timeZone: 'UTC' })
const fmtDate = (iso, opts) => (isIso(iso) ? new Date(utc(iso)).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', ...opts }) : '')
const daysBetween = (a, b) => Math.round((utc(b) - utc(a)) / DAY_MS)
const fyOf = (iso, startMonth = 4) => { const y = Number(iso.slice(0, 4)); return Number(iso.slice(5, 7)) >= startMonth ? y : y - 1 }

function useToday() {
  const [today, setToday] = useState(localIso)
  useEffect(() => {
    const tick = () => setToday((t) => { const now = localIso(); return now === t ? t : now })
    const id = setInterval(tick, 60000)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); window.removeEventListener('focus', tick) }
  }, [])
  return today
}

// ── Number formats ───────────────────────────────────────────────────────
const fmts = new Map()
function nf(locale, opts) {
  const k = `${locale}|${JSON.stringify(opts)}`
  if (!fmts.has(k)) fmts.set(k, new Intl.NumberFormat(locale, opts))
  return fmts.get(k)
}
function money(n, c, { compact = false, cents = false, always = false } = {}) {
  if (!Number.isFinite(n) || !c) return '—'
  const abs = Math.abs(n)
  const opts = { style: 'currency', currency: c.code, minimumFractionDigits: 0, maximumFractionDigits: cents || abs < 100 ? 2 : 0 }
  if (compact && abs >= (always ? 1000 : c.compactFrom || 10000)) Object.assign(opts, { notation: 'compact', maximumFractionDigits: abs >= 1e6 && abs < 1e9 ? 2 : 1 })
  try { return nf(c.locale || 'en-US', opts).format(n) } catch { return `${c.sym || ''}${Math.round(n)}` }
}
const signed = (n, c, o) => (Math.abs(n) < 0.005 ? money(0, c, o) : `${n > 0 ? '+' : '−'}${money(Math.abs(n), c, o)}`)
const qty = (n, dp = 8) => (Number.isFinite(n) ? nf('en-US', { minimumFractionDigits: 0, maximumFractionDigits: dp }).format(Math.abs(n) < 1e-12 ? 0 : n) : '—')
const pct = (x, dp = 1) => (Number.isFinite(x) ? `${(x * 100).toFixed(dp).replace(/\.0+$/, '')}%` : '—')

// ── Plan maths ───────────────────────────────────────────────────────────
// Plan settings come from the payload; anything saved in st.plan overrides.
function planOf(data, st) {
  const d = data.plan || {}
  const o = (st && st.plan) || {}
  const v = (k, dflt = 0) => {
    const x = o[k]
    return x !== undefined && x !== null && x !== '' && Number.isFinite(Number(x)) ? Number(x) : num(d[k], dflt)
  }
  return {
    start: isYm(o.start) ? o.start : isYm(d.start) ? d.start : ymOf(localIso()),
    years: Math.max(1, Math.round(num(d.years, 10))),
    openBase: Math.max(0, v('openBase')), openUnits: Math.max(0, v('openUnits')),
    monthly: Math.max(0, v('monthly')), step: v('step'), every: clamp(Math.round(v('every', 12)), 1, 120), cap: Math.max(0, v('cap')),
    target: Math.max(0, v('target')), threshold: Math.max(0, v('threshold')), capMonths: Math.max(0, v('capMonths', 6)),
    surcharge: Math.max(0, v('surcharge')),
    tax: num(d.tax?.rate) * (1 + Math.max(0, v('surcharge'))) * (1 + num(d.tax?.cess)),
  }
}

// The monthly amount for month k (0 = the first plan month): stepped up every
// `every` months, never past `cap` when one is set.
const monthlyAt = (p, k) => {
  const m = num(p.monthly) * Math.pow(1 + num(p.step), Math.floor(Math.max(0, k) / Math.max(1, p.every || 12)))
  return p.cap > 0 ? Math.min(p.cap, m) : m
}
function plannedThrough(p, k) {
  let s = 0
  for (let i = 0; i <= Math.min(k, p.years * 12 - 1); i++) s += monthlyAt(p, i)
  return s
}

// Grows `open` and the contributions at the monthly rate equivalent to `rate`
// a year. Money lands at each month's end and `extra` at each year's end.
// With `run` longer than `years`, nothing new goes in after `years`.
function simulate({ open = 0, monthly = 0, step = 0, every = 12, cap = 0, years = 1, run, rate = 0, extra = 0 }) {
  const i = Math.pow(1 + rate, 1 / 12) - 1
  const total = Math.max(years, run || 0)
  const P = { monthly, step, every, cap }
  let v = open
  let paid = open
  const pts = [{ v, paid }]
  for (let k = 0; k < total * 12; k++) {
    const m = k < years * 12 ? monthlyAt(P, k) : 0
    v = v * (1 + i) + m
    paid += m
    if ((k + 1) % 12 === 0) {
      if (k < years * 12) { v += extra; paid += extra }
      pts.push({ v, paid })
    }
  }
  return pts
}
const finalOf = (a) => { const pts = simulate(a); return pts[pts.length - 1] }
function bisect(f, target, lo, hi) {
  for (let n = 0; n < 90; n++) {
    const mid = (lo + hi) / 2
    if (f(mid) < target) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}
// The yearly rate that reaches `target`; 0 when contributions alone do, NaN when out of reach.
function rateNeeded(a, target) {
  if (finalOf({ ...a, rate: 0 }).v >= target) return 0
  if (finalOf({ ...a, rate: 5 }).v < target) return NaN
  return bisect((r) => finalOf({ ...a, rate: r }).v, target, 0, 5)
}
function monthlyNeeded(a, target) {
  const f = (m) => finalOf({ ...a, monthly: m }).v
  if (f(1e7) < target) return NaN
  return bisect(f, target, 0, 1e7)
}
function crossYear(a, target, max = 40) {
  const pts = simulate({ ...a, run: max })
  const y = pts.findIndex((q) => q.v >= target)
  return y < 0 ? null : y
}

// The same plan with an optional one-off fall at the start of `crash.year`
// and an optional glide path ({ planYear: share kept in the asset }). At the
// start of each glide year, anything above the target share is sold, with
// after-tax proceeds moving to a safer bucket growing at `safe`. With
// `redirect`, new money from the first glide year goes to that bucket while
// the asset is above target, so less has to be sold. `net` is after exit tax.
function stress({ a, crash, glide, tax, safe, redirect }) {
  const i = Math.pow(1 + a.rate, 1 / 12) - 1
  const j = Math.pow(1 + safe, 1 / 12) - 1
  const first = glide && Object.keys(glide).length ? Math.min(...Object.keys(glide).map(Number)) : Infinity
  let keep = 1
  let x = a.open
  let xc = a.open
  let s = 0
  let sc = 0
  const add = (m, y) => {
    if (redirect && y >= first && x > keep * (x + s)) { s += m; sc += m } else { x += m; xc += m }
  }
  for (let y = 1; y <= a.years; y++) {
    if (glide && glide[y] !== undefined) keep = glide[y]
    if (y >= first && x > 0 && x > keep * (x + s)) {
      const sell = x - keep * (x + s)
      const t = sell * Math.max(0, 1 - xc / x) * tax
      xc *= 1 - sell / x
      x -= sell
      s += sell - t
      sc += sell - t
    }
    if (crash && crash.year === y) x *= 1 - crash.drop
    for (let k = 0; k < 12; k++) {
      x *= 1 + i
      s *= 1 + j
      add(monthlyAt(a, (y - 1) * 12 + k), y)
    }
    if (a.extra) add(a.extra, y)
  }
  const gross = x + s
  return { gross, net: gross - Math.max(0, x - xc) * tax - Math.max(0, s - sc) * tax, safe: s }
}

// Buying rules by distance from the high: the row a drawdown falls in.
const zoneOf = (ladder, dd) => list(ladder).reduce((z, r, i) => (dd >= num(r.from) - EPS ? i : z), 0)
// Reserve tranches still armed up to the current zone, taken in order.
function deployPlan(ladder, zone, reserve, used = {}) {
  let left = Math.max(0, reserve)
  let total = 0
  const steps = []
  for (let i = 1; i <= zone && i < list(ladder).length; i++) {
    if (used[i]) continue
    const amt = left * clamp(num(ladder[i].deploy), 0, 1)
    steps.push({ i, amt })
    total += amt
    left -= amt
  }
  return { total, steps }
}
function splitFor(p, ladder, zone, reserve, monthly) {
  const row = list(ladder)[zone] || {}
  let core = num(row.core, 1)
  let res = num(row.reserve, 0)
  const cap = p.capMonths * monthly
  const capped = res > 0 && cap > 0 && reserve >= cap - 0.5
  if (capped) { core += res; res = 0 }
  return { core: monthly * core, res: monthly * res, capped, cap }
}

// ── Ledger maths ─────────────────────────────────────────────────────────
// Entries: buy, sell, out (exchange → own wallet), in (wallet → exchange) and
// res (cash set aside for the reserve). Amounts are in the base or local
// currency with the local-per-base rate of the day, so both are always known.
const KINDS = ['buy', 'sell', 'out', 'in', 'res']
function cleanEntry(e) {
  return {
    id: String(e.id || uid()), k: KINDS.includes(e.k) ? e.k : 'buy', d: isIso(e.d) ? e.d : localIso(),
    u: Math.max(0, num(e.u)), c: e.c === 'base' ? 'base' : 'local', a: num(e.a), f: Math.max(0, num(e.f)), x: Math.max(0, num(e.x)),
    r: e.k === 'buy' && !!e.r, t: Math.max(0, num(e.t)), nf: Math.max(0, num(e.nf)), v: String(e.v || '').slice(0, 80), n: String(e.n || '').slice(0, 300),
  }
}
const inBase = (e, amt) => (e.c === 'base' ? amt : e.x > 0 ? amt / e.x : 0)
const inLocal = (e, amt) => (e.c === 'local' ? amt : amt * e.x)

function book(entries, { tax, start, fyStart }) {
  const sorted = entries.map((e, i) => ({ e, i })).sort((a, b) => (a.e.d < b.e.d ? -1 : a.e.d > b.e.d ? 1 : a.i - b.i)).map((o) => o.e)
  const lots = []
  const months = {}
  const fys = {}
  const sells = {}
  const problems = []
  const startIdx = ymIndex(start)
  let units = 0
  let cold = 0
  let reserve = 0
  let investB = 0
  let investL = 0
  let contrib = 0
  let openB = 0
  let openU = 0
  const take = (q) => {
    let need = q
    let b = 0
    let l = 0
    while (need > EPS && lots.length) {
      const lot = lots[0]
      const part = Math.min(need, lot.u)
      const share = part / lot.u
      b += lot.b * share
      l += lot.l * share
      lot.u -= part
      lot.b -= lot.b * share
      lot.l -= lot.l * share
      need -= part
      if (lot.u <= EPS) lots.shift()
    }
    return { b, l }
  }
  for (const e of sorted) {
    const ym = ymOf(e.d)
    const mo = months[ym] || (months[ym] = { core: 0, res: 0, dep: 0, sold: 0, bought: 0 })
    const pre = ymIndex(ym) < startIdx
    if (e.k === 'buy') {
      const cb = inBase(e, e.a + e.f)
      const cl = inLocal(e, e.a + e.f)
      units += e.u
      lots.push({ u: e.u, b: cb, l: cl })
      investB += cb
      investL += cl
      mo.bought += e.u
      if (e.r) { reserve -= cb; mo.dep += cb } else {
        mo.core += cb
        if (pre) { openB += cb; openU += e.u } else contrib += cb
      }
    } else if (e.k === 'res') {
      const rb = inBase(e, e.a)
      reserve += rb
      mo.res += rb
      if (pre) openB += rb
      else contrib += rb
    } else if (e.k === 'sell') {
      const q = Math.min(e.u, Math.max(0, units - cold))
      if (e.u - q > EPS) problems.push({ id: e.id, d: e.d, k: 'oversell' })
      const cost = take(q)
      units -= q
      const share = e.u > 0 ? q / e.u : 0
      const proceedsL = inLocal(e, e.a) * share
      const gainL = proceedsL - cost.l
      const taxL = gainL > 0 ? gainL * tax : 0
      const fy = fyOf(e.d, fyStart)
      const Y = fys[fy] || (fys[fy] = { fy, units: 0, proceeds: 0, cost: 0, gains: 0, losses: 0, tax: 0, tds: 0, n: 0 })
      Y.units += q
      Y.proceeds += proceedsL
      Y.cost += cost.l
      if (gainL > 0) Y.gains += gainL
      else Y.losses -= gainL
      Y.tax += taxL
      Y.tds += e.t
      Y.n += 1
      sells[e.id] = { q, proceedsL, costL: cost.l, gainL, taxL, gainB: inBase(e, e.a) * share - cost.b, fy }
      mo.sold += inBase(e, e.a) * share
    } else if (e.k === 'out' || e.k === 'in') {
      const from = e.k === 'out' ? Math.max(0, units - cold) : Math.max(0, cold)
      const q = Math.min(e.u, from)
      if (e.u - q > EPS) problems.push({ id: e.id, d: e.d, k: 'overmove' })
      const fee = Math.min(e.nf, q)
      take(fee)
      units -= fee
      cold += e.k === 'out' ? q - fee : -q
    }
  }
  if (reserve < -0.5) problems.push({ id: '', d: '', k: 'reserve' })
  const basisB = lots.reduce((s, l) => s + l.b, 0)
  const basisL = lots.reduce((s, l) => s + l.l, 0)
  units = Math.max(0, units)
  cold = clamp(cold, 0, units)
  return {
    units, cold, exch: Math.max(0, units - cold), reserve, investB, investL, basisB, basisL, contrib, openB, openU, months,
    fys: Object.values(fys).sort((a, b) => b.fy - a.fy), sells, problems, count: entries.length,
  }
}

// ── Saved state ──────────────────────────────────────────────────────────
const blank = () => ({ v: 1, entries: [], ticks: {}, plan: {}, proj: {}, cycle: null, quote: null, manual: null, feedOff: false, view: 'today' })
function normalise(raw) {
  const b = blank()
  if (!raw || typeof raw !== 'object') return b
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})
  return {
    ...b, ...raw,
    entries: list(raw.entries).filter((e) => e && typeof e === 'object').map(cleanEntry),
    ticks: obj(raw.ticks), plan: obj(raw.plan), proj: obj(raw.proj),
    cycle: raw.cycle && typeof raw.cycle === 'object' ? { high: num(raw.cycle.high), at: String(raw.cycle.at || ''), used: obj(raw.cycle.used) } : null,
    quote: raw.quote && num(raw.quote.price) > 0 ? raw.quote : null,
    manual: raw.manual && num(raw.manual.price) > 0 ? raw.manual : null,
    feedOff: !!raw.feedOff,
  }
}

async function loadState(key) {
  let raw = null
  try { raw = localStorage.getItem(STORE) } catch {}
  if (!raw) return { st: blank(), orphan: false }
  try {
    return { st: normalise(await unseal(key, JSON.parse(raw))), orphan: false }
  } catch {
    // Unreadable with this key: keep it aside instead of overwriting it.
    try { localStorage.setItem(`${STORE}_orphan_${Date.now()}`, raw); localStorage.removeItem(STORE) } catch {}
    return { st: blank(), orphan: true }
  }
}

// Interface words. Neutral defaults, overridable from the payload's words.
const UI = {
  back: 'Back to site', lock: 'Lock', backup: 'Backup', sections: 'Sections', opening: 'Opening…', dismiss: 'Dismiss', undo: 'Undo',
  saved: 'Saved on this device', saving: 'Saving…', saveError: 'Not saved — browser storage is full or blocked',
  delete: 'Delete', confirmDelete: 'Tap again to delete', edit: 'Edit', cancel: 'Cancel', save: 'Save entry', update: 'Save changes', open: 'Open',
  price: 'Price', fromHigh: 'Below the high', highLine: 'High {p} on {d}', fxLine: '{r} per {b}', refresh: 'Refresh', refreshing: 'Refreshing…',
  src_live: 'Live · {t}', src_cached: 'Saved price · {t}', src_seed: 'Reference price · {t}', src_manual: 'Your price · {t}', feedFailed: 'Live price unavailable.',
  thisMonth: 'This month', monthOf: 'Month {k} of {K}', yearOf: 'year {y} of {Y}', startsOn: 'The plan starts in {m}.', planDone: 'The plan ran its course in {m}.',
  target: 'Target', core: 'Buy', toReserve: 'Set aside', weekly: '≈ {a} a week', loggedOf: '{a} of {b} logged', leftToGo: '{a} to go', monthDone: 'Done for this month ✓',
  logBuy: 'Log a buy', logReserve: 'Log cash set aside', capped: 'The reserve is full ({cap}), so this month it all goes in.', steppedUp: 'Stepped up this month, from {a}.',
  reserve: 'Reserve', reserveCap: 'Full at {cap} (the excess goes straight in)', armed: 'Waiting', fired: 'Triggered', usedOn: 'Deployed {d}', markUsed: 'Mark deployed',
  unmark: 'Undo', levelAt: 'at {p}', deployPart: 'deploys {p} of what’s left', deployNow: 'Deploy about {a} from the reserve now.', reserveEmpty: 'Nothing set aside yet.',
  holdings: 'Holdings', valueNow: 'Value now', invested: 'Invested', basis: 'Cost basis', avgCost: 'Average cost', unrealised: 'Unrealised', onExchange: 'On the exchange',
  cold: 'In your own wallet', moveNow: '{a} is on the exchange, over your {t} limit. Move it to your own wallet.', holdingsEmpty: 'No entries yet. Start by logging what you already hold.',
  pace: 'On plan?', contributed: 'Put in since the start', plannedToDate: 'Planned so far', ahead: '{a} ahead of plan', behind: '{a} behind plan', onPlan: 'Right on plan',
  pending: 'On plan, with this month still to go', monthsHit: 'Months on target', beforePlan: 'Before the plan', planOpening: 'plan assumed {a}',
  next: 'Coming up', stepUp: 'Step-up to {a} a month', review: 'Yearly review', lastBackup: 'Last backup', never: 'never', inDays: 'in {n} days', today: 'today',
  due: 'Due now', nothingDue: 'Nothing due. Stay the course.',
  dueBuy: 'Log this month’s contribution: {a} to go.', dueDeploy: 'A reserve trigger fired: deploy about {a}.', dueCold: 'Move {a} from the exchange to your own wallet.',
  dueBackup: 'Download a fresh backup; the last one is over 30 days old.', dueBackupFirst: 'Download your first backup.', dueReview: 'Do the yearly review for year {y}.',
  dueProblems: 'The ledger has {n} entry problem(s) to fix.',
  units: 'Units', small: 'small units', kind: 'Type', date: 'Date', amount: 'Amount', fee: 'Fee', rate: 'Rate', venue: 'Where', note: 'Note',
  kind_buy: 'Buy', kind_sell: 'Sell', kind_out: 'To own wallet', kind_in: 'To exchange', kind_res: 'Cash set aside',
  amount_buy: 'Amount paid', amount_sell: 'Amount received', amount_res: 'Amount set aside', currency: 'Currency', fromReserve: 'Paid from the reserve',
  fromReserveHint: 'Tick when this buy used reserve cash, not this month’s contribution.', tds: 'Tax deducted at source', tdsHint: 'Usually {p} of the sale: about {a}.',
  netFee: 'Network fee (units)', netFeeHint: 'Taken from the amount moved.', venueHint: 'Exchange or wallet', notePh: 'Transaction ID, order number…',
  rateHint: 'Filled in with today’s rate. Use the rate on the day for older entries.', unitPrice: 'Works out at {b} ({l}) per unit.',
  addEntry: 'Add an entry', editEntry: 'Edit entry', savedEntry: 'Saved.', ledger: 'Entries', showAll: 'Show all {n} months', showLess: 'Show recent months only',
  noEntries: 'Nothing logged yet.', monthTotal: '{a} put in', fromRes: 'reserve', sellGain: 'Gain {g} · est. tax {t}', sellLoss: 'Loss {g} (not deductible)',
  errDate: 'Pick a valid date.', errFuture: 'That date is in the future.', errUnits: 'Enter the units, more than zero.', errAmount: 'Enter the amount, more than zero.',
  errRes: 'Enter an amount (negative to take cash back out).', errRate: 'Enter the exchange rate, more than zero.', errFee: 'The network fee must be less than the amount moved.',
  prob_oversell: 'Sells more than was on the exchange that day', prob_overmove: 'Moves more than was held there that day', prob_reserve: 'Reserve buys add up to more than the cash set aside',
  problems: 'Problems', bars: 'Monthly contributions', barsNote: 'Bars: what you put in. Line: the plan.', barsLabel: '{m}: {a} put in, plan {b}',
  taxYears: 'Tax years', fy: 'FY {a}–{b}', sold: 'Sold', proceeds: 'Proceeds', costFifo: 'Cost (first in, first out)', gains: 'Taxable gains', estTax: 'Estimated tax',
  tdsPaid: 'Tax deducted', taxNote: 'Estimate only: each sale is taxed on its own, losses aren’t set off, and surcharge isn’t included.',
  export: 'Export', csv: 'Download CSV', csvHint: 'Every entry with both currencies, cost basis and estimated tax, for your records or your accountant.',
  backupTitle: 'Backup', backupHint: 'Records live only in this browser. A backup file is encrypted with the same key, so only this page can read it.',
  lastBackupOn: 'Last backup: {d}', restore: 'Restore from a backup file', restored: 'Restored the backup from {d}.', undone: 'Restore undone.',
  restoreBad: 'That file isn’t a backup from this page.', restoreWrongKey: 'That backup was made with a different key and can’t be opened here.',
  backupDone: 'Backup downloaded. Keep it somewhere safe.', undoFail: 'Nothing to undo.',
  orphan: 'Saved records on this device couldn’t be opened with this plan’s key, so they were set aside untouched. Restore a backup file to continue.',
  numbers: 'Your numbers', openAmt: 'Starting amount', monthly: 'Monthly amount', step: 'Step-up', every: 'Every (months)', cap: 'Monthly ceiling', capHint: 'Blank for none',
  years: 'Years', extra: 'Extra each year', targetAmt: 'Target', useHoldings: 'Use today’s holdings ({a})', resetNumbers: 'Back to the plan’s numbers',
  scale: 'Scale', linear: 'Linear', log: 'Log', paidIn: 'Put in', yourRate: 'Your rate', chartTitle: 'Projected value by year', chartKeys: 'Use the arrow keys to read the values year by year.',
  asTable: 'Show the numbers', now: 'Now', year: 'Year', scenario: 'Scenario', endValue: 'Value at the end', multiple: 'Multiple', afterTax: 'After tax', crosses: 'Reaches target',
  never2: 'Not within {n} years', crossNote: 'Assumes nothing new goes in after the plan’s last year.', needRate: 'Growth needed for {t} in {n} years', alone: 'Contributions alone get there',
  outOfReach: 'Out of reach', needMonthly: 'Starting monthly amount needed', atRate: 'at {r}', levers: 'Levers', lever: 'Change', leverValue: 'Value at {r}', leverPaid: 'You put in',
  stress: 'Stress test', crashYear: 'Fall in plan year', crashDrop: 'Size of the fall', hold: 'Hold everything', glide: 'Follow the glide path', noCrash: 'No fall', withCrash: 'With the fall',
  stressNote: 'After-tax values at the end of the plan.', lever_x2: 'Double the monthly amount', lever_cap: 'Stop step-ups at {a} a month', lever_extra: 'Add {a} at each year’s end',
  lever_years: 'Keep going {n} more years', lever_less: 'Step up {p} instead',
  schedule: 'Year by year', months: 'Months', perMonth: 'Monthly', yearTotal: 'In that year', soFar: 'Put in so far', valueAt: 'At {r}',
  zone: 'Zone', distance: 'Below the high', levelToday: 'Price level', split: 'Monthly split', action: 'Reserve', buyAll: 'All in', keep: 'Kept in the asset', moved: 'Moved to safety',
  planYears: 'Plan years', forYear: 'For plan year {y}', of: 'of',
  settings: 'Settings', planSettings: 'Plan numbers', startMonth: 'First month', openUnits: 'Units held at the start', threshold: 'Move to own wallet above',
  reserveMonths: 'Reserve full at (months of contributions)', surcharge: 'Surcharge band', taxNow: 'tax on gains {t}', defaults: 'Back to the plan’s defaults', feed: 'Live price', feedOn: 'Fetch the live price after unlocking',
  feedHint: 'Asks a public price service; nothing about you or this plan is sent.', manualPrice: 'Your price', manualRate: 'Your exchange rate', manualHint: 'Used when the live price is off or unavailable.',
  clear: 'Clear', device: 'This device', keepUnlocked: 'Keep this device unlocked', keepHint: 'Opens without the password on this browser until you press Lock.',
  gateTitle: 'Private ledger', gateLead: 'Enter your password to open it.', password: 'Password', show: 'Show', hide: 'Hide', openBtn: 'Open',
  gateNote: 'Encrypted. Your password never leaves this browser.', wrong: "That password didn't match. Try again.",
  broken: "This page couldn't be opened. Please reload and try again in a current browser.", verified: 'Verified', estimate: 'Estimate', checked: 'Checked {d}',
}
const Words = createContext(UI)
const useW = () => useContext(Words)
const Ctx = createContext(null)
const useT = () => useContext(Ctx)

// **bold**, `code` and [label](https://…) — all the formatting the payload needs.
function Inline({ text }) {
  if (text === undefined || text === null || text === '') return null
  const source = String(text)
  const re = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g
  const out = []
  let last = 0
  let m
  while ((m = re.exec(source))) {
    if (m.index > last) out.push(source.slice(last, m.index))
    if (m[1]) out.push(<strong key={m.index}>{m[1]}</strong>)
    else if (m[2]) out.push(<code key={m.index}>{m[2]}</code>)
    else out.push(<a key={m.index} href={m[4]} target="_blank" rel="noopener noreferrer">{m[3]}</a>)
    last = re.lastIndex
  }
  if (last < source.length) out.push(source.slice(last))
  return <>{out}</>
}
const Paras = ({ items }) => list(items).map((t, i) => <p key={i}><Inline text={t} /></p>)
const Points = ({ items }) => (list(items).length ? <ul className="sk-points">{list(items).map((t, i) => <li key={i}><Inline text={t} /></li>)}</ul> : null)

// A small mark drawn from the payload (meta.mark: { viewBox, paths }).
function Mark({ mark, className }) {
  const paths = list(mark?.paths)
  if (!paths.length) return null
  return (
    <svg className={className ? `sk-mark ${className}` : 'sk-mark'} viewBox={mark.viewBox || '0 0 24 24'} aria-hidden="true" focusable="false">
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.fill || (p.stroke ? 'none' : 'currentColor')} stroke={p.stroke} strokeWidth={p.width}
          strokeLinecap={p.stroke ? 'round' : undefined} strokeLinejoin={p.stroke ? 'round' : undefined} />
      ))}
    </svg>
  )
}

function Check({ on, onChange, children, className }) {
  return (
    <button type="button" role="checkbox" aria-checked={!!on} className={`sk-check${on ? ' is-on' : ''}${className ? ` ${className}` : ''}`} onClick={() => onChange(!on)}>
      <span className="sk-check-box" aria-hidden="true">{on ? '✓' : ''}</span>
      <span className="sk-check-label">{children}</span>
    </button>
  )
}

function Seg({ value, options, onChange, label, className }) {
  return (
    <div className={`sk-seg${className ? ` ${className}` : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} aria-label={o.aria}
          className={value === o.id ? 'is-on' : undefined} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  )
}

// A number box that commits shortly after typing stops, on Enter and on blur.
// `scale` shows fractions as percentages (0.1 ↔ 10). Blank commits null.
function NumField({ label, value, onCommit, prefix, suffix, min, max, scale = 1, hint, placeholder, className }) {
  const id = useId()
  const hintId = useId()
  const shown = (v) => (v === undefined || v === null || v === '' ? '' : String(Math.round(Number(v) * scale * 1e8) / 1e8))
  const [v, setV] = useState(() => shown(value))
  const timer = useRef(null)
  const focused = useRef(false)
  const latest = useRef(v)
  const commitRef = useRef(onCommit)
  commitRef.current = onCommit
  useEffect(() => {
    if (!focused.current && timer.current === null) { const s = shown(value); setV(s); latest.current = s }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  const commit = (text) => {
    const t = String(text).trim()
    if (t === '') { commitRef.current(null); return }
    let n = num(t, NaN)
    if (!Number.isFinite(n)) return
    if (min !== undefined) n = Math.max(min, n)
    if (max !== undefined) n = Math.min(max, n)
    commitRef.current(n / scale)
  }
  useEffect(() => () => { if (timer.current !== null) { clearTimeout(timer.current); commit(latest.current) } }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const flush = () => {
    if (timer.current !== null) { clearTimeout(timer.current); timer.current = null }
    commit(latest.current)
  }
  return (
    <div className={`sk-field${className ? ` ${className}` : ''}`}>
      <label className="sk-field-label" htmlFor={id}>{label}</label>
      <span className="sk-num">
        {prefix && <span className="sk-affix" aria-hidden="true">{prefix}</span>}
        <input id={id} type="text" inputMode="decimal" autoComplete="off" value={v} placeholder={placeholder} aria-describedby={hint ? hintId : undefined}
          onFocus={() => { focused.current = true }}
          onBlur={() => { focused.current = false; flush(); setV(shown(num(latest.current, NaN) / scale)) }}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); flush() } }}
          onChange={(e) => {
            const next = e.target.value
            setV(next)
            latest.current = next
            if (timer.current !== null) clearTimeout(timer.current)
            timer.current = setTimeout(() => { timer.current = null; commit(latest.current) }, 450)
          }} />
        {suffix && <span className="sk-affix" aria-hidden="true">{suffix}</span>}
      </span>
      {hint && <small className="sk-hint" id={hintId}><Inline text={hint} /></small>}
    </div>
  )
}

// Two taps to delete, so a stray tap can't lose anything.
function DeleteButton({ onDelete, label }) {
  const w = useW()
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return undefined
    const t = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button type="button" className={armed ? 'sk-mini is-danger' : 'sk-mini'} aria-label={armed ? w.confirmDelete : label ? `${w.delete}: ${label}` : w.delete}
      onClick={() => (armed ? onDelete() : setArmed(true))}>{armed ? w.confirmDelete : w.delete}</button>
  )
}

const Bar = ({ value, max, tone, label }) => {
  const m = Math.max(0, num(max))
  const v = clamp(num(value), 0, m)
  return (
    <div className="sk-bar" data-tone={tone} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={Number(m.toFixed(4))} aria-valuenow={Number(v.toFixed(4))}>
      <span style={{ width: `${m ? (v / m) * 100 : 0}%` }} />
    </div>
  )
}

function Head({ b, extra, headingRef }) {
  if (!b.title && !b.kicker && !extra) return b.intro ? <p className="sk-intro"><Inline text={b.intro} /></p> : null
  return (
    <>
      <header className="sk-head">
        <div className="sk-head-text">
          {b.kicker && <p className="sk-kicker">{b.kicker}</p>}
          {b.title && <h2 ref={headingRef} tabIndex={headingRef ? -1 : undefined}>{b.title}</h2>}
        </div>
        {extra}
      </header>
      {b.intro && <p className="sk-intro"><Inline text={b.intro} /></p>}
    </>
  )
}

// A scrollable table region that keyboard users can reach.
function TableWrap({ label, children }) {
  return <div className="sk-table-wrap" role="region" aria-label={label} tabIndex={0}>{children}</div>
}

// ── Content blocks from the payload ──────────────────────────────────────
function Checklist({ b }) {
  const { st, update, yearNow } = useT()
  const w = useW()
  const per = b.per === 'year'
  const key = (id) => (per ? `${b.id}:${yearNow}:${id}` : `${b.id}:${id}`)
  const items = list(b.items)
  const done = items.filter((it) => st.ticks[key(it.id)]).length
  const toggle = (id, on) => update((s) => {
    const ticks = { ...s.ticks }
    if (on) ticks[key(id)] = localIso()
    else delete ticks[key(id)]
    return { ...s, ticks }
  })
  return (
    <section className="sk-card">
      <Head b={b} extra={<span className={done === items.length && items.length ? 'sk-pill is-good' : 'sk-pill'}>{done} / {items.length}</span>} />
      {per && <p className="sk-sub">{fill(w.forYear, { y: yearNow })}</p>}
      <ul className="sk-checks">
        {items.map((it) => (
          <li key={it.id}>
            <Check on={!!st.ticks[key(it.id)]} onChange={(on) => toggle(it.id, on)}>{it.text}</Check>
            {it.note && <p className="sk-check-note"><Inline text={it.note} /></p>}
          </li>
        ))}
      </ul>
    </section>
  )
}

function Block({ b }) {
  const w = useW()
  switch (b.type) {
    case 'text':
      return <section className="sk-card"><Head b={b} /><div className="sk-prose"><Paras items={b.body} /><Points items={b.points} /></div></section>
    case 'callout':
      return (
        <aside className="sk-callout" data-tone={b.tone || 'key'}>
          {b.title && <p className="sk-callout-title">{b.title}</p>}
          <div className="sk-prose"><Paras items={b.body} /><Points items={b.points} /></div>
        </aside>
      )
    case 'cards':
      return (
        <section className="sk-card">
          <Head b={b} />
          <div className="sk-cards" data-cols={b.cols || 3}>
            {list(b.items).map((it, i) => (
              <article key={i} className="sk-mini-card" data-tone={it.tone}>
                {it.tag && <p className="sk-tag">{it.tag}</p>}
                {it.title && <h3>{it.title}</h3>}
                <div className="sk-prose"><Paras items={it.body} /><Points items={it.points} /></div>
              </article>
            ))}
          </div>
          {b.note && <p className="sk-note"><Inline text={b.note} /></p>}
        </section>
      )
    case 'table':
      return (
        <section className="sk-card">
          <Head b={b} />
          <TableWrap label={b.title || w.schedule}>
            <table className="sk-table">
              <thead><tr>{list(b.head).map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
              <tbody>{list(b.rows).map((r, i) => <tr key={i}>{list(r).map((c, j) => (j === 0 ? <th key={j} scope="row"><Inline text={c} /></th> : <td key={j}><Inline text={c} /></td>))}</tr>)}</tbody>
            </table>
          </TableWrap>
          {b.note && <p className="sk-note"><Inline text={b.note} /></p>}
        </section>
      )
    case 'steps':
      return (
        <section className="sk-card">
          <Head b={b} />
          <ol className="sk-steps">
            {list(b.items).map((it, i) => (
              <li key={i}>
                {it.when && <p className="sk-when">{it.when}</p>}
                {it.title && <h3>{it.title}</h3>}
                <div className="sk-prose"><Paras items={it.body} /><Points items={it.points} /></div>
              </li>
            ))}
          </ol>
        </section>
      )
    case 'checklist':
      return <Checklist b={b} />
    case 'facts':
      return (
        <section className="sk-card">
          <Head b={b} />
          <dl className="sk-facts">
            {list(b.items).map((it, i) => (
              <div key={i}>
                <dt>{it.k}{it.tag && <span className={`sk-chip is-${it.tag}`}>{w[it.tag] || it.tag}</span>}</dt>
                <dd><Inline text={it.v} />{it.src && <> <a href={it.src} target="_blank" rel="noopener noreferrer" className="sk-src">{it.srcLabel || 'Source'}</a></>}</dd>
              </div>
            ))}
          </dl>
          {b.asOf && <p className="sk-note">{fill(w.checked, { d: fmtDate(b.asOf) })}</p>}
        </section>
      )
    case 'sources':
      return (
        <section className="sk-card">
          <Head b={b} />
          <ul className="sk-sources">
            {list(b.items).map((it, i) => (
              <li key={i}><a href={it.url} target="_blank" rel="noopener noreferrer">{it.label}</a>{it.note && <span><Inline text={it.note} /></span>}</li>
            ))}
          </ul>
        </section>
      )
    default: {
      const Live = LIVE_BLOCKS[b.type]
      return Live ? <Live b={b} /> : null
    }
  }
}
const Blocks = ({ items }) => list(items).map((b, i) => <Block key={`${b.type}-${i}`} b={b} />)

// ── Charts ───────────────────────────────────────────────────────────────
function useWidth(ref, fallback = 640) {
  const [w, setW] = useState(fallback)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const set = () => setW(Math.max(240, Math.round(el.clientWidth)))
    set()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', set)
      return () => window.removeEventListener('resize', set)
    }
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return w
}

function niceTicks(max, count = 5) {
  if (!(max > 0)) return [0, 1]
  const raw = max / count
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw - EPS)
  const out = [0]
  while (out[out.length - 1] < max - EPS) out.push(Number((out[out.length - 1] + step).toPrecision(12)))
  return out
}
function logTicks(min, max) {
  const all = []
  for (let e = Math.floor(Math.log10(min)) - 1; e <= Math.ceil(Math.log10(max)) + 1; e++) for (const m of [1, 2, 5]) all.push(m * Math.pow(10, e))
  const lo = [...all].reverse().find((t) => t <= min * (1 + EPS)) || all[0]
  const hi = all.find((t) => t >= max * (1 - EPS)) || all[all.length - 1]
  return all.filter((t) => t >= lo && t <= hi)
}

// Lines by year with a hover/arrow-key readout; `series`: [{ id, label, tone, dash, values }].
function LineChart({ series, labels, target, targetLabel, fmt, title, log }) {
  const w = useW()
  const box = useRef(null)
  const W = useWidth(box)
  const [at, setAt] = useState(null)
  const descId = useId()
  const n = labels.length
  const narrow = W < 520
  const H = narrow ? 250 : 320
  const padL = narrow ? 52 : 66
  const padR = 14
  const padT = 14
  const padB = 30
  const iw = Math.max(20, W - padL - padR)
  const ih = H - padT - padB
  const vals = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v) && v > 0)
  const top = Math.max(1, target || 0, ...vals)
  let ticks
  let y
  if (log) {
    ticks = logTicks(Math.max(1, Math.min(...vals, target || Infinity)), top * 1.02)
    const lo = ticks[0]
    const L = Math.log10(lo)
    const R = Math.log10(ticks[ticks.length - 1])
    y = (v) => padT + (1 - (Math.log10(Math.max(v, lo)) - L) / (R - L || 1)) * ih
  } else {
    ticks = niceTicks(top * 1.04)
    const hi = ticks[ticks.length - 1]
    y = (v) => padT + (1 - Math.max(0, v) / hi) * ih
  }
  const x = (i) => padL + (n > 1 ? (i / (n - 1)) * iw : iw / 2)
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / (narrow ? 40 : 48)))))
  const path = (vs) => vs.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const move = (clientX) => {
    const r = box.current?.getBoundingClientRect()
    if (!r || n < 2) return
    setAt(clamp(Math.round(((clientX - r.left - padL) / iw) * (n - 1)), 0, n - 1))
  }
  const key = (e) => {
    const go = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    if (go) { e.preventDefault(); setAt((a) => clamp(a === null ? (go > 0 ? 0 : n - 1) : a + go, 0, n - 1)) } else if (e.key === 'Home') { e.preventDefault(); setAt(0) } else if (e.key === 'End') { e.preventDefault(); setAt(n - 1) } else if (e.key === 'Escape') setAt(null)
  }
  const readout = at === null ? '' : `${labels[at]}: ${series.map((s) => `${s.label} ${fmt(s.values[at])}`).join(', ')}`
  return (
    <div className="sk-chart" ref={box}>
      <div className="sk-plot" tabIndex={0} role="group" aria-label={title} aria-describedby={descId}
        onPointerMove={(e) => move(e.clientX)} onPointerDown={(e) => move(e.clientX)} onPointerLeave={() => setAt(null)} onKeyDown={key} onBlur={() => setAt(null)}>
        <svg width={W} height={H} aria-hidden="true" focusable="false">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="sk-gridline" />
              <text x={padL - 8} y={y(t)} className="sk-axis" textAnchor="end" dominantBaseline="middle">{fmt(t, true)}</text>
            </g>
          ))}
          {labels.map((l, i) => (i % every === 0 || i === n - 1) && (i === n - 1 || n - 1 - i >= every / 2) && (
            <text key={i} x={x(i)} y={H - 10} className="sk-axis" textAnchor="middle">{l}</text>
          ))}
          {target > 0 && (
            <g>
              <line x1={padL} x2={W - padR} y1={y(target)} y2={y(target)} className="sk-target" />
              <text x={padL + 6} y={y(target) - 6} className="sk-axis sk-axis-target" textAnchor="start">{targetLabel}</text>
            </g>
          )}
          {series.map((s) => <path key={s.id} d={path(s.values)} className="sk-line" data-tone={s.tone} strokeDasharray={s.dash ? '5 5' : undefined} />)}
          {at !== null && (
            <g>
              <line x1={x(at)} x2={x(at)} y1={padT} y2={H - padB} className="sk-rule" />
              {series.map((s) => <circle key={s.id} cx={x(at)} cy={y(s.values[at])} r={4} className="sk-dot" data-tone={s.tone} />)}
            </g>
          )}
        </svg>
        {at !== null && (
          <div className="sk-tip" style={{ left: clamp(x(at), 96, W - 96) }}>
            <b>{labels[at]}</b>
            {series.map((s) => <span key={s.id} data-tone={s.tone}><i aria-hidden="true" />{s.label}<em>{fmt(s.values[at])}</em></span>)}
          </div>
        )}
      </div>
      <p id={descId} className="sk-sr">{w.chartKeys}</p>
      <p className="sk-sr" aria-live="polite">{readout}</p>
    </div>
  )
}

// Monthly bars (what went in) against a stepped line (the plan).
function MonthBars({ rows, fmt, label }) {
  const w = useW()
  const box = useRef(null)
  const W = useWidth(box)
  const H = 190
  const padL = 56
  const padR = 8
  const padT = 10
  const padB = 26
  const iw = Math.max(20, W - padL - padR)
  const ih = H - padT - padB
  const ticks = niceTicks(Math.max(1, ...rows.map((r) => Math.max(r.got, r.plan))) * 1.08, 4)
  const hi = ticks[ticks.length - 1]
  const bw = iw / Math.max(1, rows.length)
  const y = (v) => padT + (1 - Math.max(0, v) / hi) * ih
  const plan = rows.map((r, i) => `${i ? 'L' : 'M'}${(padL + i * bw).toFixed(1)},${y(r.plan).toFixed(1)}H${(padL + (i + 1) * bw).toFixed(1)}`).join('')
  return (
    <div className="sk-chart" ref={box}>
      <svg width={W} height={H} role="img" aria-label={label}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} className="sk-gridline" />
            <text x={padL - 8} y={y(t)} className="sk-axis" textAnchor="end" dominantBaseline="middle">{fmt(t, true)}</text>
          </g>
        ))}
        {rows.map((r, i) => (
          <g key={r.ym}>
            <rect x={padL + i * bw + bw * 0.18} y={y(r.got)} width={bw * 0.64} height={Math.max(0, H - padB - y(r.got))} rx={3}
              className={r.got >= r.plan - 0.5 && r.plan > 0 ? 'sk-barfill is-hit' : 'sk-barfill'}>
              <title>{fill(w.barsLabel, { m: fmtYm(r.ym, 'long'), a: fmt(r.got), b: fmt(r.plan) })}</title>
            </rect>
            <text x={padL + (i + 0.5) * bw} y={H - 8} className="sk-axis" textAnchor="middle">{fmtYm(r.ym, 'short').slice(0, 3)}</text>
          </g>
        ))}
        <path d={plan} className="sk-planline" />
      </svg>
    </div>
  )
}

// ── Price ────────────────────────────────────────────────────────────────
// Fetches the payload's public price feed after unlocking; refreshes while
// the tab is visible. Nothing about the plan or the visitor is sent.
function useQuote(feed, enabled) {
  const [q, setQ] = useState({ status: 'off' })
  const busy = useRef(false)
  const alive = useRef(true)
  useEffect(() => () => { alive.current = false }, [])
  const load = useCallback(async () => {
    if (!enabled || !feed?.url || busy.current) return
    busy.current = true
    setQ((p) => ({ ...p, status: p.price ? 'refreshing' : 'loading' }))
    const get = async (url) => {
      const ctl = new AbortController()
      const t = setTimeout(() => ctl.abort(), 12000)
      try {
        const r = await fetch(url, { signal: ctl.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' })
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return await r.json()
      } finally { clearTimeout(t) }
    }
    try {
      const [a, b] = await Promise.all([get(feed.url), feed.localUrl ? get(feed.localUrl).catch(() => null) : Promise.resolve(null)])
      const price = num(pick(a, feed.price))
      if (!(price > 0)) throw new Error('No price')
      const local = b ? num(pick(b, feed.local)) : 0
      if (alive.current) {
        setQ({ status: 'live', price, high: num(pick(a, feed.high)), highAt: String(pick(a, feed.highAt) || '').slice(0, 10), local, fx: local > 0 ? local / price : 0, at: Date.now() })
      }
    } catch {
      if (alive.current) setQ((p) => ({ ...p, status: 'error' }))
    } finally {
      busy.current = false
    }
  }, [enabled, feed])
  useEffect(() => {
    if (!enabled || !feed?.url) { setQ({ status: 'off' }); return undefined }
    load()
    const id = setInterval(() => { if (document.visibilityState === 'visible') load() }, Math.max(60, num(feed.every, 180)) * 1000)
    return () => clearInterval(id)
  }, [enabled, feed, load])
  return [q, load]
}

// The price to use right now: live, else your own, else the last saved one,
// else the payload's reference. The high is the best one known.
function quoteOf(live, st, seed = {}) {
  const has = num(live.price) > 0
  const manual = st.manual
  const cached = st.quote
  let q
  if (has && live.status !== 'error') q = { src: 'live', price: live.price, local: live.local, fx: live.fx, at: live.at }
  else if (manual) q = { src: 'manual', price: num(manual.price), fx: num(manual.fx), at: num(manual.at) }
  else if (has) q = { src: 'cached', price: live.price, local: live.local, fx: live.fx, at: live.at }
  else if (cached) q = { src: 'cached', price: num(cached.price), local: num(cached.local), fx: num(cached.fx), at: num(cached.at) }
  else q = { src: 'seed', price: num(seed.price), local: num(seed.local), fx: num(seed.fx), at: utc(seed.at) || 0 }
  if (!(q.fx > 0)) q.fx = num(live.fx) || num(cached?.fx) || num(seed.fx) || 1
  if (!(q.local > 0)) q.local = q.price * q.fx
  const high = [
    { v: num(seed.high), at: seed.highAt },
    { v: num(live.high), at: live.highAt },
    { v: num(cached?.high), at: cached?.highAt },
    { v: num(st.cycle?.high), at: st.cycle?.at },
  ].reduce((a, b) => (b.v > a.v ? b : a), { v: 0, at: '' })
  return { ...q, high: high.v, highAt: high.at || '', dd: high.v > 0 ? clamp(1 - q.price / high.v, 0, 1) : 0, failed: live.status === 'error' }
}

const reviewOf = (data) => Object.values(data.sections || {}).flat().find((b) => b && b.type === 'checklist' && b.per === 'year')

function dueItems({ data, st, p, bk, qt, zone, today, w }) {
  const base = data.meta.cur.base
  const out = []
  const ym = ymOf(today)
  const k = ymIndex(ym) - ymIndex(p.start)
  const K = p.years * 12
  if (k >= 0 && k < K) {
    const target = monthlyAt(p, k)
    const m = bk.months[ym] || {}
    const got = (m.core || 0) + (m.res || 0)
    if (got < target - 0.5) out.push({ id: 'buy', text: fill(w.dueBuy, { a: money(target - got, base) }), view: 'log', opts: { add: 'buy' } })
  }
  const dep = deployPlan(data.plan.ladder, zone, bk.reserve, st.cycle?.used || {})
  if (dep.total >= 1) out.push({ id: 'deploy', text: fill(w.dueDeploy, { a: money(dep.total, base) }), view: 'log', opts: { add: 'buy', reserve: true } })
  const exchV = bk.exch * qt.price
  if (p.threshold > 0 && exchV >= p.threshold) out.push({ id: 'cold', text: fill(w.dueCold, { a: money(exchV, base) }), view: 'log', opts: { add: 'out' } })
  if (bk.problems.length) out.push({ id: 'problems', text: fill(w.dueProblems, { n: bk.problems.length }), view: 'log' })
  const review = reviewOf(data)
  if (review && k >= 12 && k < K + 2 && k % 12 <= 1) {
    const y = Math.min(p.years, Math.floor(k / 12) + 1)
    if (list(review.items).some((it) => !st.ticks[`${review.id}:${y}:${it.id}`])) out.push({ id: 'review', text: fill(w.dueReview, { y }), view: 'rules' })
  }
  if (bk.count && (!st.backupAt || Date.now() - st.backupAt > 30 * DAY_MS)) {
    out.push({ id: 'backup', text: st.backupAt ? w.dueBackup : w.dueBackupFirst, view: 'notes', opts: { section: 'backup' } })
  }
  return out
}

// ── This month ───────────────────────────────────────────────────────────
const monthIndex = (p, today) => ymIndex(ymOf(today)) - ymIndex(p.start)

function MonthCard() {
  const { data, p, bk, qt, zone, today, go, B, L } = useT()
  const w = useW()
  const ym = ymOf(today)
  const k = monthIndex(p, today)
  const K = p.years * 12
  const ladder = list(data.plan.ladder)
  const row = ladder[zone] || {}
  if (k >= K) {
    return <section className="sk-card sk-span-all"><Head b={{ title: w.thisMonth }} /><p className="sk-lead">{fill(w.planDone, { m: fmtYm(ymAdd(p.start, K - 1), 'long') })}</p></section>
  }
  const target = monthlyAt(p, Math.max(0, k))
  const split = splitFor(p, ladder, zone, bk.reserve, target)
  const m = bk.months[ym] || {}
  const got = k >= 0 ? (m.core || 0) + (m.res || 0) : 0
  const stepped = k > 0 && monthlyAt(p, k - 1) < target - 0.005
  const kicker = k < 0 ? fill(w.startsOn, { m: fmtYm(p.start, 'long') })
    : `${fmtYm(ym, 'long')} · ${fill(w.monthOf, { k: k + 1, K })}, ${fill(w.yearOf, { y: Math.floor(k / 12) + 1, Y: p.years })}`
  return (
    <section className="sk-card sk-span-all sk-month">
      <Head b={{ kicker, title: w.thisMonth }} extra={<span className="sk-zone-chip" data-zone={zone}>{row.label}</span>} />
      <div className="sk-month-grid">
        <div className="sk-stat is-big"><span>{w.target}</span><b>{B(target)}</b><small>≈ {L(target * qt.fx)}</small></div>
        <div className="sk-stat"><span>{w.core}</span><b>{B(split.core)}</b><small>{fill(w.weekly, { a: B((split.core * 12) / 52) })}</small></div>
        <div className="sk-stat"><span>{w.toReserve}</span><b>{B(split.res)}</b><small>{split.capped ? fill(w.capped, { cap: B(split.cap) }) : pct(target ? split.res / target : 0, 0)}</small></div>
      </div>
      {stepped && <p className="sk-note">{fill(w.steppedUp, { a: B(monthlyAt(p, k - 1)) })}</p>}
      {k >= 0 && (
        <>
          <Bar value={got} max={target} tone={got >= target - 0.5 ? 'good' : 'accent'} label={w.thisMonth} />
          <p className="sk-progress-line">{got >= target - 0.5 ? w.monthDone : `${fill(w.loggedOf, { a: B(got), b: B(target) })} · ${fill(w.leftToGo, { a: B(target - got) })}`}</p>
        </>
      )}
      {row.note && <p className="sk-zone-note"><Inline text={row.note} /></p>}
      <div className="sk-actions">
        <button type="button" className="sk-primary" onClick={() => go('log', { add: 'buy' })}>{w.logBuy}</button>
        {split.res > 0 && <button type="button" className="sk-secondary" onClick={() => go('log', { add: 'res' })}>{w.logReserve}</button>}
      </div>
    </section>
  )
}

function DueCard() {
  const { due, go } = useT()
  const w = useW()
  return (
    <section className="sk-card">
      <Head b={{ title: w.due }} extra={due.length ? <span className="sk-pill is-warn">{due.length}</span> : null} />
      {due.length ? (
        <ul className="sk-due">
          {due.map((d) => <li key={d.id}><span>{d.text}</span><button type="button" className="sk-mini" onClick={() => go(d.view, d.opts)}>{w.open}</button></li>)}
        </ul>
      ) : <p className="sk-sub">{w.nothingDue}</p>}
    </section>
  )
}

function ReserveCard() {
  const { data, p, bk, qt, zone, st, update, today, B } = useT()
  const w = useW()
  const ladder = list(data.plan.ladder)
  const used = st.cycle?.used || {}
  const monthly = monthlyAt(p, clamp(monthIndex(p, today), 0, p.years * 12 - 1))
  const dep = deployPlan(ladder, zone, bk.reserve, used)
  const mark = (i, on) => update((s) => {
    const c = s.cycle || { high: qt.high, at: qt.highAt, used: {} }
    const u = { ...(c.used || {}) }
    if (on) u[i] = today
    else delete u[i]
    return { ...s, cycle: { ...c, used: u } }
  })
  return (
    <section className="sk-card">
      <Head b={{ title: w.reserve }} extra={<b className="sk-figure">{B(bk.reserve)}</b>} />
      <p className="sk-sub">{bk.reserve > 0.5 ? fill(w.reserveCap, { cap: B(p.capMonths * monthly) }) : w.reserveEmpty}</p>
      <ol className="sk-triggers">
        {ladder.slice(1).map((r, idx) => {
          const i = idx + 1
          const hit = zone >= i
          const on = used[i]
          return (
            <li key={i} data-state={on ? 'used' : hit ? 'fired' : 'armed'}>
              <span className="sk-trig-at">−{pct(num(r.from), 0)}</span>
              <span className="sk-trig-body">
                <b>{fill(w.levelAt, { p: B(qt.high * (1 - num(r.from))) })}</b>
                <small>{fill(w.deployPart, { p: pct(num(r.deploy), 0) })}</small>
              </span>
              <span className="sk-trig-state">{on ? fill(w.usedOn, { d: fmtDate(on) }) : hit ? w.fired : w.armed}</span>
              {hit && <button type="button" className="sk-mini" onClick={() => mark(i, !on)}>{on ? w.unmark : w.markUsed}</button>}
            </li>
          )
        })}
      </ol>
      {dep.total >= 1 && <p className="sk-callout-line">{fill(w.deployNow, { a: B(dep.total) })}</p>}
    </section>
  )
}

function HoldingsCard() {
  const { data, p, bk, qt, go, B, L, base } = useT()
  const w = useW()
  const unit = data.meta.unit || {}
  if (!bk.count) {
    return (
      <section className="sk-card">
        <Head b={{ title: w.holdings }} />
        <p className="sk-sub">{w.holdingsEmpty}</p>
        <div className="sk-actions"><button type="button" className="sk-primary" onClick={() => go('log', { add: 'buy' })}>{w.logBuy}</button></div>
      </section>
    )
  }
  const value = bk.units * qt.price
  const pl = value - bk.basisB
  const exchV = bk.exch * qt.price
  return (
    <section className="sk-card">
      <Head b={{ title: w.holdings }} />
      <p className="sk-units"><b>{qty(bk.units, unit.dp ?? 8)}</b> {unit.code}{unit.per ? <small> · {qty(Math.round(bk.units * unit.per), 0)} {unit.small || w.small}</small> : null}</p>
      <dl className="sk-dl">
        <div><dt>{w.valueNow}</dt><dd>{B(value)} <small>{L(bk.units * qt.local)}</small></dd></div>
        <div><dt>{w.basis}</dt><dd>{B(bk.basisB)} <small>{L(bk.basisL)}</small></dd></div>
        <div><dt>{w.unrealised}</dt><dd className={pl >= 0 ? 'is-up' : 'is-down'}>{signed(pl, base)} <small>{bk.basisB > 0 ? pct(pl / bk.basisB) : ''}</small></dd></div>
        <div><dt>{w.avgCost}</dt><dd>{bk.units > EPS ? B(bk.basisB / bk.units) : '—'}</dd></div>
      </dl>
      <div className="sk-split">
        <div><span>{w.onExchange}</span><b>{qty(bk.exch, 8)}</b></div>
        <div><span>{w.cold}</span><b>{qty(bk.cold, 8)}</b></div>
      </div>
      <Bar value={bk.cold} max={bk.units || 1} tone="good" label={w.cold} />
      {p.threshold > 0 && exchV >= p.threshold && <p className="sk-callout-line">{fill(w.moveNow, { a: B(exchV), t: B(p.threshold) })}</p>}
      {w.valueNote && <p className="sk-note"><Inline text={w.valueNote} /></p>}
    </section>
  )
}

function PaceCard() {
  const { p, bk, today, B } = useT()
  const w = useW()
  const k = monthIndex(p, today)
  const K = p.years * 12
  const past = clamp(k, 0, K)
  const before = past > 0 ? plannedThrough(p, past - 1) : 0
  const thisT = k >= 0 && k < K ? monthlyAt(p, k) : 0
  const goal = before + thisT
  let hit = 0
  for (let i = 0; i < past; i++) {
    const m = bk.months[ymAdd(p.start, i)] || {}
    if ((m.core || 0) + (m.res || 0) >= monthlyAt(p, i) - 0.5) hit += 1
  }
  let tone = 'good'
  let status = w.onPlan
  if (bk.contrib > goal + 0.5) status = fill(w.ahead, { a: B(bk.contrib - goal) })
  else if (bk.contrib < before - 0.5) { tone = 'warn'; status = fill(w.behind, { a: B(before - bk.contrib) }) } else if (bk.contrib < goal - 0.5) { tone = 'accent'; status = w.pending }
  return (
    <section className="sk-card">
      <Head b={{ title: w.pace }} />
      <p className={`sk-pace is-${tone}`}>{status}</p>
      <Bar value={bk.contrib} max={goal || 1} tone={tone} label={w.pace} />
      <dl className="sk-dl">
        <div><dt>{w.contributed}</dt><dd>{B(bk.contrib)}</dd></div>
        <div><dt>{w.plannedToDate}</dt><dd>{B(goal)}</dd></div>
        <div><dt>{w.monthsHit}</dt><dd>{hit} / {past}</dd></div>
        <div><dt>{w.beforePlan}</dt><dd>{qty(bk.openU, 8)} · {B(bk.openB)} <small>{fill(w.planOpening, { a: B(p.openBase) })}</small></dd></div>
      </dl>
    </section>
  )
}

function ComingCard() {
  const { data, p, st, today, B } = useT()
  const w = useW()
  const k = monthIndex(p, today)
  const K = p.years * 12
  const rows = []
  const nextStep = k < 0 ? p.every : (Math.floor(k / p.every) + 1) * p.every
  if (nextStep < K && monthlyAt(p, nextStep) > monthlyAt(p, nextStep - 1) + 0.005) {
    rows.push({ when: fmtYm(ymAdd(p.start, nextStep), 'long'), what: fill(w.stepUp, { a: B(monthlyAt(p, nextStep)) }) })
  }
  const nextReview = Math.max(12, (Math.floor(Math.max(k, 0) / 12) + 1) * 12)
  if (nextReview < K) rows.push({ when: fmtYm(ymAdd(p.start, nextReview), 'long'), what: w.review })
  list(data.plan.events).filter((e) => isIso(e.d) && e.d >= today).sort((a, b) => (a.d < b.d ? -1 : 1)).slice(0, 2).forEach((e) => {
    rows.push({ when: e.approx ? fmtYm(ymOf(e.d), 'long') : fmtDate(e.d), what: e.label, n: daysBetween(today, e.d), approx: e.approx })
  })
  rows.push({ when: w.lastBackup, what: st.backupAt ? fmtDate(localIso(new Date(st.backupAt))) : w.never })
  return (
    <section className="sk-card">
      <Head b={{ title: w.next }} />
      <ul className="sk-next">
        {rows.map((r, i) => (
          <li key={i}><span>{r.when}</span><b>{r.what}</b>{r.n !== undefined && <small>{r.n === 0 ? w.today : `${r.approx ? '~' : ''}${fill(w.inDays, { n: r.n })}`}</small>}</li>
        ))}
      </ul>
    </section>
  )
}

function TodayView() {
  const { data } = useT()
  return (
    <div className="sk-grid">
      <MonthCard />
      <DueCard />
      <ReserveCard />
      <HoldingsCard />
      <PaceCard />
      <ComingCard />
      {list(data.sections?.today).length > 0 && <div className="sk-span-all sk-stack"><Blocks items={data.sections.today} /></div>}
    </div>
  )
}

// ── Plan blocks that work from the live numbers ─────────────────────────
const planArgs = (p) => ({ open: p.openBase, monthly: p.monthly, step: p.step, every: p.every, cap: p.cap, years: p.years })

function ScheduleTable({ b }) {
  const { data, p, today, qt, B, L } = useT()
  const w = useW()
  const scen = list(data.plan.scenarios)
  const paths = scen.map((s) => simulate({ ...planArgs(p), rate: num(s.rate) }))
  const k = monthIndex(p, today)
  const cur = k >= 0 && k < p.years * 12 ? Math.floor(k / 12) + 1 : 0
  let cum = p.openBase
  const rows = []
  for (let y = 1; y <= p.years; y++) {
    const ms = Array.from({ length: 12 }, (_, i) => monthlyAt(p, (y - 1) * 12 + i))
    const total = ms.reduce((s, v) => s + v, 0)
    cum += total
    rows.push({ y, from: ymAdd(p.start, (y - 1) * 12), to: ymAdd(p.start, y * 12 - 1), lo: ms[0], hi: ms[11], total, cum, vals: paths.map((pt) => pt[y].v) })
  }
  return (
    <section className="sk-card">
      <Head b={{ kicker: b.kicker, title: b.title || w.schedule, intro: b.intro }} />
      <TableWrap label={b.title || w.schedule}>
        <table className="sk-table is-num">
          <thead>
            <tr>
              <th scope="col">{w.year}</th><th scope="col">{w.months}</th><th scope="col">{w.perMonth}</th><th scope="col">{w.yearTotal}</th><th scope="col">{w.soFar}</th>
              {scen.map((s) => <th key={s.id} scope="col">{fill(w.valueAt, { r: pct(num(s.rate), 0) })}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.y} className={r.y === cur ? 'is-now' : undefined} aria-current={r.y === cur ? 'true' : undefined}>
                <th scope="row">{r.y}</th>
                <td>{fmtYm(r.from)} – {fmtYm(r.to)}</td>
                <td>
                  {Math.abs(r.hi - r.lo) < 0.5 ? B(r.lo) : `${B(r.lo)} → ${B(r.hi)}`}
                  <small>≈ {L(r.lo * qt.fx, { compact: true })}{Math.abs(r.hi - r.lo) < 0.5 ? '' : ` → ${L(r.hi * qt.fx, { compact: true })}`}</small>
                </td>
                <td>{B(r.total)}</td>
                <td>{B(r.cum)}</td>
                {r.vals.map((v, i) => <td key={i}>{B(v, { compact: true })}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      {b.note && <p className="sk-note"><Inline text={b.note} /></p>}
    </section>
  )
}

function LadderTable({ b }) {
  const { data, qt, zone, B } = useT()
  const w = useW()
  const ladder = list(data.plan.ladder)
  return (
    <section className="sk-card">
      <Head b={{ kicker: b.kicker, title: b.title || w.zone, intro: b.intro }} />
      <TableWrap label={b.title || w.zone}>
        <table className="sk-table">
          <thead><tr><th scope="col">{w.zone}</th><th scope="col">{w.distance}</th><th scope="col">{w.levelToday}</th><th scope="col">{w.split}</th><th scope="col">{w.action}</th></tr></thead>
          <tbody>
            {ladder.map((r, i) => {
              const from = num(r.from)
              const to = ladder[i + 1] ? num(ladder[i + 1].from) : null
              return (
                <tr key={i} className={i === zone ? 'is-now' : undefined} aria-current={i === zone ? 'true' : undefined}>
                  <th scope="row">{r.label}</th>
                  <td>{to === null ? `${pct(from, 0)}+` : `${pct(from, 0)}–${pct(to, 0)}`}</td>
                  <td>{to === null ? `≤ ${B(qt.high * (1 - from))}` : `${B(qt.high * (1 - to))} – ${B(qt.high * (1 - from))}`}</td>
                  <td>{num(r.reserve) > 0 ? `${pct(num(r.core), 0)} / ${pct(num(r.reserve), 0)}` : w.buyAll}</td>
                  <td><Inline text={r.action || (num(r.deploy) > 0 ? fill(w.deployPart, { p: pct(num(r.deploy), 0) }) : '—')} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </TableWrap>
      {b.note && <p className="sk-note"><Inline text={b.note} /></p>}
    </section>
  )
}

function GlideTable({ b }) {
  const { data, p } = useT()
  const w = useW()
  const g = list(data.plan.glide)
  return (
    <section className="sk-card">
      <Head b={{ kicker: b.kicker, title: b.title || w.glide, intro: b.intro }} />
      <TableWrap label={b.title || w.glide}>
        <table className="sk-table is-num">
          <thead><tr><th scope="col">{w.year}</th><th scope="col">{w.months}</th><th scope="col">{w.keep}</th><th scope="col">{w.moved}</th></tr></thead>
          <tbody>
            {g.map((r) => (
              <tr key={r.year}>
                <th scope="row">{r.year}</th>
                <td>{fmtYm(ymAdd(p.start, (r.year - 1) * 12))} – {fmtYm(ymAdd(p.start, r.year * 12 - 1))}</td>
                <td>{pct(num(r.keep), 0)}</td>
                <td>{pct(1 - num(r.keep), 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      {b.note && <p className="sk-note"><Inline text={b.note} /></p>}
    </section>
  )
}

function PhasesBlock({ b }) {
  const { data, p, today } = useT()
  const w = useW()
  const k = monthIndex(p, today)
  const cur = k >= 0 ? Math.floor(k / 12) + 1 : 0
  return (
    <section className="sk-card">
      <Head b={{ kicker: b.kicker, title: b.title, intro: b.intro }} />
      <ol className="sk-steps is-phases">
        {list(data.phases).map((ph) => (
          <li key={ph.id} className={cur >= ph.from && cur <= ph.to ? 'is-now' : undefined}>
            <p className="sk-when">{w.planYears} {ph.from}–{ph.to} · {fmtYm(ymAdd(p.start, (ph.from - 1) * 12))} – {fmtYm(ymAdd(p.start, ph.to * 12 - 1))}</p>
            <h3>{ph.name}</h3>
            <div className="sk-prose"><Paras items={ph.body} /><Points items={ph.points} /></div>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ── Projections ──────────────────────────────────────────────────────────
const endYear = (p, y) => String(Number(ymAdd(p.start, y * 12 - 1).slice(0, 4)))

function GrowView() {
  const { data, st, update, p, bk, qt, B, base } = useT()
  const w = useW()
  const scen = list(data.plan.scenarios)
  const pr = st.proj || {}
  const val = (k, d) => (pr[k] !== undefined && pr[k] !== null && Number.isFinite(Number(pr[k])) ? Number(pr[k]) : d)
  const a = {
    open: Math.max(0, val('open', p.openBase)), monthly: Math.max(0, val('monthly', p.monthly)), step: val('step', p.step),
    every: clamp(Math.round(val('every', p.every)), 1, 120), cap: Math.max(0, val('cap', p.cap)), years: clamp(Math.round(val('years', p.years)), 1, 40),
    extra: Math.max(0, val('extra', 0)),
  }
  const target = Math.max(0, val('target', p.target))
  const custom = val('rate', NaN)
  const set = (k) => (v) => update((s) => {
    const proj = { ...(s.proj || {}) }
    if (v === null || v === undefined || (typeof v === 'number' && !Number.isFinite(v))) delete proj[k]
    else proj[k] = v
    return { ...s, proj }
  })
  const tax = p.tax
  const lines = scen.map((s) => ({ id: s.id, label: s.label, tone: s.tone, rate: num(s.rate) }))
  if (Number.isFinite(custom)) lines.push({ id: 'custom', label: `${w.yourRate} (${pct(custom)})`, tone: 'custom', rate: custom })
  const runs = lines.map((l) => ({ ...l, pts: simulate({ ...a, rate: l.rate }) }))
  const paid = simulate({ ...a, rate: 0 }).map((q) => q.paid)
  const labels = Array.from({ length: a.years + 1 }, (_, y) => (y === 0 ? w.now : endYear(p, y)))
  const fmt = (v, axis) => money(v, base, { compact: !!axis, always: !!axis })
  const series = [...runs.map((r) => ({ id: r.id, label: r.label, tone: r.tone, values: r.pts.map((q) => q.v) })), { id: 'paid', label: w.paidIn, tone: 'paid', dash: true, values: paid }]
  const main = scen.find((s) => s.main) || scen[Math.floor(scen.length / 2)] || { rate: 0.2 }
  const r0 = num(main.rate)
  const lv = data.plan.levers || {}
  const levers = [
    { label: w.lever_x2, a: { ...a, monthly: a.monthly * 2 } },
    lv.cap > 0 && { label: fill(w.lever_cap, { a: B(lv.cap) }), a: { ...a, cap: a.cap > 0 ? Math.min(a.cap, lv.cap) : lv.cap } },
    lv.step > 0 && { label: fill(w.lever_less, { p: pct(lv.step) }), a: { ...a, step: lv.step } },
    lv.extra > 0 && { label: fill(w.lever_extra, { a: B(lv.extra) }), a: { ...a, extra: a.extra + lv.extra } },
    lv.years > 0 && { label: fill(w.lever_years, { n: lv.years }), a: { ...a, years: a.years + lv.years } },
  ].filter(Boolean)
  const need = rateNeeded(a, target)
  const holdings = bk.units * qt.price
  return (
    <div className="sk-stack">
      <section className="sk-card">
        <Head b={{ title: w.numbers }} extra={Object.keys(pr).some((k) => !['log', 'sScen', 'sYear', 'sDrop'].includes(k)) ? (
          <button type="button" className="sk-mini" onClick={() => update((s) => ({ ...s, proj: { log: s.proj?.log } }))}>{w.resetNumbers}</button>
        ) : null} />
        <div className="sk-form-grid">
          <NumField label={w.openAmt} value={a.open} onCommit={set('open')} prefix={base.sym} min={0} />
          <NumField label={w.monthly} value={a.monthly} onCommit={set('monthly')} prefix={base.sym} min={0} />
          <NumField label={w.step} value={a.step} onCommit={set('step')} suffix="%" scale={100} min={-50} max={200} />
          <NumField label={w.every} value={a.every} onCommit={set('every')} min={1} max={120} />
          <NumField label={w.cap} value={a.cap || ''} onCommit={set('cap')} prefix={base.sym} min={0} placeholder={w.capHint} />
          <NumField label={w.years} value={a.years} onCommit={set('years')} min={1} max={40} />
          <NumField label={w.extra} value={a.extra || ''} onCommit={set('extra')} prefix={base.sym} min={0} placeholder="0" />
          <NumField label={w.targetAmt} value={target} onCommit={set('target')} prefix={base.sym} min={0} />
          <NumField label={w.yourRate} value={Number.isFinite(custom) ? custom : ''} onCommit={set('rate')} suffix="%" scale={100} min={-90} max={300} placeholder="—" />
        </div>
        {bk.count > 0 && holdings > 0 && (
          <button type="button" className="sk-mini" onClick={() => set('open')(Math.round(holdings))}>{fill(w.useHoldings, { a: B(holdings) })}</button>
        )}
      </section>

      <section className="sk-card">
        <Head b={{ title: w.chartTitle }} extra={<Seg label={w.scale} value={pr.log ? 'log' : 'lin'} onChange={(v) => set('log')(v === 'log' ? 1 : null)}
          options={[{ id: 'lin', label: w.linear }, { id: 'log', label: w.log }]} />} />
        <ul className="sk-legend">{series.map((s) => <li key={s.id} data-tone={s.tone}><i aria-hidden="true" />{s.label}</li>)}{target > 0 && <li data-tone="target"><i aria-hidden="true" />{w.targetAmt} {B(target, { compact: true })}</li>}</ul>
        <LineChart series={series} labels={labels} target={target} targetLabel={B(target, { compact: true })} fmt={fmt} title={w.chartTitle} log={!!pr.log} />
        <details className="sk-details">
          <summary>{w.asTable}</summary>
          <TableWrap label={w.chartTitle}>
            <table className="sk-table is-num">
              <thead><tr><th scope="col">{w.year}</th>{series.map((s) => <th key={s.id} scope="col">{s.label}</th>)}</tr></thead>
              <tbody>{labels.map((l, y) => <tr key={y}><th scope="row">{l}</th>{series.map((s) => <td key={s.id}>{B(s.values[y])}</td>)}</tr>)}</tbody>
            </table>
          </TableWrap>
        </details>
      </section>

      <section className="sk-card">
        <Head b={{ title: w.endValue }} />
        <TableWrap label={w.endValue}>
          <table className="sk-table is-num">
            <thead><tr><th scope="col">{w.scenario}</th><th scope="col">{w.rate}</th><th scope="col">{w.endValue}</th><th scope="col">{w.paidIn}</th><th scope="col">{w.multiple}</th><th scope="col">{w.afterTax}</th><th scope="col">{w.crosses}</th></tr></thead>
            <tbody>
              {runs.map((r) => {
                const end = r.pts[a.years]
                const cross = target > 0 ? crossYear({ ...a, rate: r.rate }, target, 40) : null
                return (
                  <tr key={r.id}>
                    <th scope="row"><span className="sk-swatch" data-tone={r.tone} aria-hidden="true" />{r.label}</th>
                    <td>{pct(r.rate)}</td>
                    <td>{B(end.v)}</td>
                    <td>{B(end.paid)}</td>
                    <td>{end.paid > 0 ? `${(end.v / end.paid).toFixed(2)}×` : '—'}</td>
                    <td>{B(end.v - Math.max(0, end.v - end.paid) * tax)}</td>
                    <td>{cross === null ? fill(w.never2, { n: 40 }) : `${endYear(p, cross)} (${w.year.toLowerCase()} ${cross})`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableWrap>
        <p className="sk-note">{w.crossNote} {fill(data.words?.taxLine || '', { t: pct(tax) })}</p>
      </section>

      <section className="sk-card">
        <Head b={{ title: fill(w.needRate, { t: B(target, { compact: true }), n: a.years }) }} />
        <p className="sk-big-line">{Number.isNaN(need) ? w.outOfReach : need === 0 ? w.alone : pct(need)}</p>
        <TableWrap label={w.needMonthly}>
          <table className="sk-table is-num">
            <thead><tr><th scope="col">{w.scenario}</th><th scope="col">{w.needMonthly}</th></tr></thead>
            <tbody>
              {lines.map((l) => {
                const m = monthlyNeeded({ ...a, rate: l.rate }, target)
                return <tr key={l.id}><th scope="row">{l.label} · {pct(l.rate)}</th><td>{Number.isNaN(m) ? w.outOfReach : B(m)}</td></tr>
              })}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="sk-card">
        <Head b={{ title: w.levers, intro: fill(data.words?.leversIntro || '', { r: pct(r0) }) }} />
        <TableWrap label={w.levers}>
          <table className="sk-table is-num">
            <thead><tr><th scope="col">{w.lever}</th><th scope="col">{fill(w.leverValue, { r: pct(r0) })}</th><th scope="col">{w.leverPaid}</th><th scope="col">{w.crosses}</th></tr></thead>
            <tbody>
              {[{ label: data.words?.leverBase || w.numbers, a }, ...levers].map((l, i) => {
                const end = finalOf({ ...l.a, rate: r0 })
                const cross = target > 0 ? crossYear({ ...l.a, rate: r0 }, target, 40) : null
                return (
                  <tr key={i} className={i === 0 ? 'is-now' : undefined}>
                    <th scope="row">{l.label}</th>
                    <td>{B(end.v)}</td>
                    <td>{B(end.paid)}</td>
                    <td>{cross === null ? fill(w.never2, { n: 40 }) : endYear(p, cross)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <StressCard a={a} lines={lines} main={main} />
      <Blocks items={data.sections?.grow} />
    </div>
  )
}

function StressCard({ a, lines, main }) {
  const { data, st, update, p, B } = useT()
  const w = useW()
  const pr = st.proj || {}
  const set = (k, v) => update((s) => ({ ...s, proj: { ...(s.proj || {}), [k]: v } }))
  const sc = lines.find((l) => l.id === pr.sScen) || lines.find((l) => l.id === main.id) || lines[0]
  const drops = list(data.plan.stress?.drops).length ? list(data.plan.stress.drops) : [0.5, 0.7, 0.8]
  const drop = drops.includes(pr.sDrop) ? pr.sDrop : drops[Math.min(1, drops.length - 1)]
  const year = clamp(Math.round(num(pr.sYear, a.years)), 1, a.years)
  const shift = a.years - p.years
  const glide = Object.fromEntries(list(data.plan.glide).map((g) => [num(g.year) + shift, num(g.keep)]).filter(([y]) => y >= 1 && y <= a.years))
  const tax = p.tax
  const safe = num(data.plan.safeRate)
  const run = (crash, gl) => stress({ a: { ...a, rate: sc.rate }, crash, glide: gl, tax, safe, redirect: !!data.plan.glideRedirect }).net
  const crash = { year, drop }
  const cells = [
    [run(null, null), run(crash, null)],
    [run(null, glide), run(crash, glide)],
  ]
  const yearId = useId()
  return (
    <section className="sk-card">
      <Head b={{ title: w.stress, intro: data.words?.stressIntro }} />
      <div className="sk-stress-controls">
        <Seg label={w.scenario} value={sc.id} onChange={(v) => set('sScen', v)} options={lines.map((l) => ({ id: l.id, label: pct(l.rate, 0), aria: l.label }))} />
        <Seg label={w.crashDrop} value={drop} onChange={(v) => set('sDrop', v)} options={drops.map((d) => ({ id: d, label: `−${pct(d, 0)}` }))} />
        <div className="sk-range">
          <label htmlFor={yearId}>{w.crashYear}: <b>{year}</b> <small>({fmtYm(ymAdd(p.start, (year - 1) * 12))})</small></label>
          <input id={yearId} type="range" min={1} max={a.years} step={1} value={year} onChange={(e) => set('sYear', Number(e.target.value))} />
        </div>
      </div>
      <TableWrap label={w.stress}>
        <table className="sk-table is-num sk-stress">
          <thead><tr><th scope="col"><span className="sk-sr">{w.scenario}</span></th><th scope="col">{w.noCrash}</th><th scope="col">{w.withCrash}</th></tr></thead>
          <tbody>
            {[w.hold, w.glide].map((label, i) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{B(cells[i][0])}</td>
                <td>{B(cells[i][1])} <small className="is-down">{cells[i][0] > 0 ? `−${pct(1 - cells[i][1] / cells[i][0], 0)}` : ''}</small></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <p className="sk-note">{w.stressNote}</p>
    </section>
  )
}

const LIVE_BLOCKS = { schedule: ScheduleTable, ladder: LadderTable, glide: GlideTable, phases: PhasesBlock }

// ── Ledger ───────────────────────────────────────────────────────────────
const UNIT_KINDS = ['buy', 'sell', 'out', 'in']
const MONEY_KINDS = ['buy', 'sell', 'res']

function EntryForm({ initial, preset, onDone }) {
  const { data, qt, update, B, L, today } = useT()
  const w = useW()
  const cur = data.meta.cur
  const tdsRate = num(data.plan.tax?.tds)
  const firstRef = useRef(null)
  const errId = useId()
  const fresh = useCallback(() => ({
    k: preset?.add || 'buy', d: today, u: '', c: cur.entry === 'base' ? 'base' : 'local', a: '', f: '', x: qt.fx ? String(Math.round(qt.fx * 100) / 100) : '',
    r: !!preset?.reserve, t: '', nf: '', v: '', n: '',
  }), [preset, today, cur.entry, qt.fx])
  const [f, setF] = useState(() => (initial ? {
    ...initial, u: initial.u ? String(initial.u) : '', a: initial.a ? String(initial.a) : '', f: initial.f ? String(initial.f) : '', x: initial.x ? String(initial.x) : '',
    t: initial.t ? String(initial.t) : '', nf: initial.nf ? String(initial.nf) : '',
  } : fresh()))
  const [err, setErr] = useState('')
  useEffect(() => { if (preset?.focus) firstRef.current?.focus() }, [preset])
  const set = (k) => (e) => { const v = e && e.target ? e.target.value : e; setF((s) => ({ ...s, [k]: v })); setErr('') }
  const unitsOn = UNIT_KINDS.includes(f.k)
  const moneyOn = MONEY_KINDS.includes(f.k)
  const move = f.k === 'out' || f.k === 'in'
  const sym = f.c === 'base' ? cur.base.sym : cur.local.sym
  const u = num(f.u, NaN)
  const a = num(f.a, NaN)
  const x = num(f.x, NaN)
  const preview = unitsOn && moneyOn && u > 0 && a > 0 && x > 0
    ? fill(w.unitPrice, { b: B(f.c === 'base' ? a / u : a / x / u), l: L(f.c === 'local' ? a / u : (a * x) / u) }) : ''
  const submit = (e) => {
    e.preventDefault()
    const fee = num(f.f, 0)
    const tds = num(f.t, 0)
    const nfee = num(f.nf, 0)
    let msg = ''
    if (!isIso(f.d)) msg = w.errDate
    else if (f.d > localIso()) msg = w.errFuture
    else if (unitsOn && !(u > 0)) msg = w.errUnits
    else if (f.k === 'res' && !(Number.isFinite(a) && a !== 0)) msg = w.errRes
    else if (moneyOn && f.k !== 'res' && !(a > 0)) msg = w.errAmount
    else if (moneyOn && !(x > 0)) msg = w.errRate
    else if (move && nfee >= u) msg = w.errFee
    if (msg) { setErr(msg); return }
    const entry = cleanEntry({
      id: initial?.id || uid(), k: f.k, d: f.d, u: unitsOn ? u : 0, c: f.c, a: moneyOn ? a : 0, f: f.k === 'buy' || f.k === 'sell' ? fee : 0,
      x: moneyOn ? x : 0, r: f.k === 'buy' && f.r, t: f.k === 'sell' ? tds : 0, nf: move ? nfee : 0, v: f.v.trim(), n: f.n.trim(),
    })
    update((s) => ({ ...s, entries: initial ? s.entries.map((o) => (o.id === entry.id ? entry : o)) : [...s.entries, entry] }))
    if (initial) { onDone?.(); return }
    setF((s) => ({ ...fresh(), k: s.k, c: s.c, x: s.x, v: s.v }))
    setErr('')
    onDone?.(entry)
  }
  const id = useId()
  return (
    <form className="sk-entry-form" onSubmit={submit} noValidate aria-describedby={err ? errId : undefined}>
      <Seg label={w.kind} value={f.k} onChange={set('k')} className="is-wrap" options={KINDS.map((k) => ({ id: k, label: w[`kind_${k}`] }))} />
      <div className="sk-form-grid">
        <div className="sk-field">
          <label className="sk-field-label" htmlFor={`${id}-d`}>{w.date}</label>
          <input ref={firstRef} id={`${id}-d`} type="date" value={f.d} max={localIso()} onChange={set('d')} required />
        </div>
        {unitsOn && (
          <div className="sk-field">
            <label className="sk-field-label" htmlFor={`${id}-u`}>{w.units} ({data.meta.unit?.code})</label>
            <input id={`${id}-u`} type="text" inputMode="decimal" autoComplete="off" value={f.u} onChange={set('u')} placeholder="0.00000000" />
          </div>
        )}
        {moneyOn && (
          <div className="sk-field">
            <span className="sk-field-label" id={`${id}-cl`}>{w.currency}</span>
            <Seg label={w.currency} value={f.c} onChange={set('c')} options={[{ id: 'local', label: `${cur.local.sym} ${cur.local.code}` }, { id: 'base', label: `${cur.base.sym} ${cur.base.code}` }]} />
          </div>
        )}
        {moneyOn && (
          <div className="sk-field">
            <label className="sk-field-label" htmlFor={`${id}-a`}>{w[`amount_${f.k}`] || w.amount}</label>
            <span className="sk-num"><span className="sk-affix" aria-hidden="true">{sym}</span>
              <input id={`${id}-a`} type="text" inputMode="decimal" autoComplete="off" value={f.a} onChange={set('a')} /></span>
          </div>
        )}
        {(f.k === 'buy' || f.k === 'sell') && (
          <div className="sk-field">
            <label className="sk-field-label" htmlFor={`${id}-f`}>{w.fee}</label>
            <span className="sk-num"><span className="sk-affix" aria-hidden="true">{sym}</span>
              <input id={`${id}-f`} type="text" inputMode="decimal" autoComplete="off" value={f.f} onChange={set('f')} placeholder="0" /></span>
          </div>
        )}
        {moneyOn && (
          <div className="sk-field">
            <label className="sk-field-label" htmlFor={`${id}-x`}>{w.rate} ({fill(w.fxLine, { r: cur.local.sym, b: cur.base.sym })})</label>
            <input id={`${id}-x`} type="text" inputMode="decimal" autoComplete="off" value={f.x} onChange={set('x')} aria-describedby={`${id}-xh`} />
            <small className="sk-hint" id={`${id}-xh`}>{w.rateHint}</small>
          </div>
        )}
        {f.k === 'sell' && (
          <div className="sk-field">
            <label className="sk-field-label" htmlFor={`${id}-t`}>{w.tds} ({cur.local.sym})</label>
            <input id={`${id}-t`} type="text" inputMode="decimal" autoComplete="off" value={f.t} onChange={set('t')} aria-describedby={`${id}-th`} placeholder="0" />
            <small className="sk-hint" id={`${id}-th`}>{a > 0 && x > 0 ? fill(w.tdsHint, { p: pct(tdsRate), a: L((f.c === 'local' ? a : a * x) * tdsRate) }) : ''}</small>
          </div>
        )}
        {move && (
          <div className="sk-field">
            <label className="sk-field-label" htmlFor={`${id}-nf`}>{w.netFee}</label>
            <input id={`${id}-nf`} type="text" inputMode="decimal" autoComplete="off" value={f.nf} onChange={set('nf')} aria-describedby={`${id}-nfh`} placeholder="0" />
            <small className="sk-hint" id={`${id}-nfh`}>{w.netFeeHint}</small>
          </div>
        )}
        <div className="sk-field">
          <label className="sk-field-label" htmlFor={`${id}-v`}>{w.venue}</label>
          <input id={`${id}-v`} type="text" autoComplete="off" value={f.v} onChange={set('v')} placeholder={w.venueHint} maxLength={80} />
        </div>
        <div className="sk-field sk-span-2">
          <label className="sk-field-label" htmlFor={`${id}-n`}>{w.note}</label>
          <input id={`${id}-n`} type="text" autoComplete="off" value={f.n} onChange={set('n')} placeholder={w.notePh} maxLength={300} />
        </div>
      </div>
      {f.k === 'buy' && (
        <div className="sk-reserve-tick">
          <Check on={f.r} onChange={(v) => setF((s) => ({ ...s, r: v }))}>{w.fromReserve}</Check>
          <small className="sk-hint">{w.fromReserveHint}</small>
        </div>
      )}
      {preview && <p className="sk-note">{preview}</p>}
      <div className="sk-form-error" id={errId} role="alert">{err}</div>
      <div className="sk-actions">
        <button type="submit" className="sk-primary">{initial ? w.update : w.save}</button>
        {initial && <button type="button" className="sk-secondary" onClick={() => onDone?.()}>{w.cancel}</button>}
      </div>
    </form>
  )
}

function EntryRow({ e, onEdit }) {
  const { data, bk, update, B, L } = useT()
  const w = useW()
  const unit = data.meta.unit || {}
  const sell = bk.sells[e.id]
  const sign = e.k === 'buy' ? '+' : e.k === 'sell' ? '−' : ''
  const amount = MONEY_KINDS.includes(e.k)
    ? (e.c === 'base' ? B(e.a) : L(e.a)) + (e.f ? ` + ${e.c === 'base' ? B(e.f) : L(e.f)} ${w.fee.toLowerCase()}` : '') : ''
  const price = (e.k === 'buy' || e.k === 'sell') && e.u > 0 ? (e.c === 'base' ? B(e.a / e.u) : L(e.a / e.u)) : ''
  return (
    <li className="sk-entry" data-kind={e.k}>
      <span className="sk-entry-kind">{w[`kind_${e.k}`]}{e.r && <em>{w.fromRes}</em>}</span>
      <span className="sk-entry-main">
        <b>{UNIT_KINDS.includes(e.k) ? `${sign}${qty(e.u, unit.dp ?? 8)} ${unit.code}` : amount}</b>
        <small>
          {fmtDate(e.d)}
          {UNIT_KINDS.includes(e.k) && amount ? ` · ${amount}` : ''}
          {price ? ` · @ ${price}` : ''}
          {e.nf ? ` · ${w.netFee.toLowerCase()} ${qty(e.nf, 8)}` : ''}
          {e.t ? ` · ${w.tds.toLowerCase()} ${L(e.t)}` : ''}
          {e.v ? ` · ${e.v}` : ''}
        </small>
        {sell && <small className={sell.gainL >= 0 ? 'is-up' : 'is-down'}>{sell.gainL >= 0 ? fill(w.sellGain, { g: L(sell.gainL), t: L(sell.taxL) }) : fill(w.sellLoss, { g: L(-sell.gainL) })}</small>}
        {e.n && <small className="sk-entry-note">{e.n}</small>}
      </span>
      <span className="sk-entry-actions">
        <button type="button" className="sk-mini" onClick={() => onEdit(e)} aria-label={`${w.edit}: ${w[`kind_${e.k}`]} ${fmtDate(e.d)}`}>{w.edit}</button>
        <DeleteButton label={`${w[`kind_${e.k}`]} ${fmtDate(e.d)}`} onDelete={() => update((s) => ({ ...s, entries: s.entries.filter((o) => o.id !== e.id) }))} />
      </span>
    </li>
  )
}

const csvCell = (v, text) => {
  let s = v === undefined || v === null ? '' : String(v)
  if (text && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
function toCsv(entries, bk, data) {
  const fyStart = num(data.plan.tax?.fyStart, 4)
  const head = ['date', 'type', 'units', 'currency', 'amount', 'fee', 'rate_local_per_base', 'amount_base', 'amount_local', 'price_base', 'price_local',
    'from_reserve', 'network_fee_units', 'tax_deducted_local', 'where', 'note', 'tax_year', 'cost_local_fifo', 'gain_local', 'est_tax_local']
  const cur = data.meta.cur
  const rows = [...entries].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0)).map((e) => {
    const s = bk.sells[e.id]
    const m = MONEY_KINDS.includes(e.k)
    const fy = fyOf(e.d, fyStart)
    return [
      e.d, e.k, UNIT_KINDS.includes(e.k) ? e.u : '', m ? (e.c === 'base' ? cur.base.code : cur.local.code) : '', m ? e.a : '', e.f || '', m ? e.x : '',
      m ? inBase(e, e.a).toFixed(2) : '', m ? inLocal(e, e.a).toFixed(2) : '',
      m && e.u > 0 ? (inBase(e, e.a) / e.u).toFixed(2) : '', m && e.u > 0 ? (inLocal(e, e.a) / e.u).toFixed(2) : '',
      e.r ? 'yes' : '', e.nf || '', e.t || '', csvCell(e.v, true), csvCell(e.n, true), `${fy}-${String((fy + 1) % 100).padStart(2, '0')}`,
      s ? s.costL.toFixed(2) : '', s ? s.gainL.toFixed(2) : '', s ? s.taxL.toFixed(2) : '',
    ].map((v, i) => (i === 14 || i === 15 ? v : csvCell(v))).join(',')
  })
  return [head.join(','), ...rows].join('\r\n')
}
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

function LedgerView({ focus, nonce }) {
  const { data, st, p, bk, today, B, L } = useT()
  const w = useW()
  const [editing, setEditing] = useState(null)
  const [all, setAll] = useState(false)
  const [saved, setSaved] = useState(false)
  const formRef = useRef(null)
  const preset = useMemo(() => (focus?.add ? { add: focus.add, reserve: !!focus.reserve, focus: true, t: nonce } : null), [focus, nonce])
  useEffect(() => {
    if (!focus?.add) return
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: smooth(), block: 'start' }))
  }, [focus, nonce])
  useEffect(() => {
    if (!saved) return undefined
    const t = setTimeout(() => setSaved(false), 2500)
    return () => clearTimeout(t)
  }, [saved])
  const groups = useMemo(() => {
    const by = {}
    for (const e of st.entries) (by[ymOf(e.d)] ||= []).push(e)
    return Object.keys(by).sort().reverse().map((ym) => ({ ym, items: by[ym].sort((a, b) => (a.d < b.d ? 1 : a.d > b.d ? -1 : 0)) }))
  }, [st.entries])
  const shown = all ? groups : groups.slice(0, 6)
  const k = monthIndex(p, today)
  const endIdx = clamp(k, 0, p.years * 12 - 1)
  const bars = Array.from({ length: 12 }, (_, i) => endIdx - 11 + i).filter((i) => i >= 0).map((i) => {
    const ym = ymAdd(p.start, i)
    const m = bk.months[ym] || {}
    return { ym, got: (m.core || 0) + (m.res || 0), plan: monthlyAt(p, i) }
  })
  const unit = data.meta.unit || {}
  const fyLabel = (y) => fill(w.fy, { a: y, b: String((y + 1) % 100).padStart(2, '0') })
  return (
    <div className="sk-stack">
      {bk.count > 0 && (
        <div className="sk-tiles">
          <div className="sk-tile"><span>{w.units}</span><b>{qty(bk.units, unit.dp ?? 8)}</b><small>{unit.code}</small></div>
          <div className="sk-tile"><span>{w.invested}</span><b>{B(bk.investB)}</b><small>{L(bk.investL)}</small></div>
          <div className="sk-tile"><span>{w.avgCost}</span><b>{bk.units > EPS ? B(bk.basisB / bk.units) : '—'}</b><small>{bk.units > EPS ? L(bk.basisL / bk.units) : ''}</small></div>
          <div className="sk-tile"><span>{w.reserve}</span><b>{B(bk.reserve)}</b><small>{w.contributed}: {B(bk.contrib)}</small></div>
        </div>
      )}

      <section className="sk-card" ref={formRef}>
        <Head b={{ title: editing ? w.editEntry : w.addEntry }} extra={saved ? <span className="sk-pill is-good" role="status">{w.savedEntry}</span> : null} />
        {editing
          ? <EntryForm key={`edit-${editing.id}`} initial={editing} onDone={() => setEditing(null)} />
          : <EntryForm key={`new-${preset?.t || 0}`} preset={preset} onDone={() => setSaved(true)} />}
      </section>

      {bk.problems.length > 0 && (
        <aside className="sk-callout" data-tone="warn">
          <p className="sk-callout-title">{w.problems}</p>
          <ul className="sk-points">{bk.problems.map((pr, i) => <li key={i}>{pr.d ? `${fmtDate(pr.d)}: ` : ''}{w[`prob_${pr.k}`]}</li>)}</ul>
        </aside>
      )}

      {bars.length > 0 && (
        <section className="sk-card">
          <Head b={{ title: w.bars, intro: w.barsNote }} />
          <MonthBars rows={bars} fmt={(v, axis) => money(v, data.meta.cur.base, { compact: !!axis, always: !!axis })} label={bars.map((r) => fill(w.barsLabel, { m: fmtYm(r.ym, 'long'), a: B(r.got), b: B(r.plan) })).join('. ')} />
        </section>
      )}

      <section className="sk-card">
        <Head b={{ title: w.ledger }} />
        {!groups.length && <p className="sk-sub">{w.noEntries}</p>}
        {shown.map((g) => {
          const m = bk.months[g.ym] || {}
          return (
            <div key={g.ym} className="sk-month-group">
              <h3>{fmtYm(g.ym, 'long')}<small>{fill(w.monthTotal, { a: B((m.core || 0) + (m.res || 0)) })}</small></h3>
              <ul className="sk-entries">{g.items.map((e) => <EntryRow key={e.id} e={e} onEdit={(x) => { setEditing(x); requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: smooth(), block: 'start' })) }} />)}</ul>
            </div>
          )
        })}
        {groups.length > 6 && <button type="button" className="sk-mini" onClick={() => setAll((v) => !v)}>{all ? w.showLess : fill(w.showAll, { n: groups.length })}</button>}
      </section>

      {bk.fys.length > 0 && (
        <section className="sk-card">
          <Head b={{ title: w.taxYears }} />
          <TableWrap label={w.taxYears}>
            <table className="sk-table is-num">
              <thead><tr><th scope="col">{w.year}</th><th scope="col">{w.sold}</th><th scope="col">{w.proceeds}</th><th scope="col">{w.costFifo}</th><th scope="col">{w.gains}</th><th scope="col">{w.estTax}</th><th scope="col">{w.tdsPaid}</th></tr></thead>
              <tbody>
                {bk.fys.map((y) => (
                  <tr key={y.fy}><th scope="row">{fyLabel(y.fy)}</th><td>{qty(y.units, 8)}</td><td>{L(y.proceeds)}</td><td>{L(y.cost)}</td><td>{L(y.gains)}</td><td>{L(y.tax)}</td><td>{L(y.tds)}</td></tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <p className="sk-note">{w.taxNote}</p>
        </section>
      )}

      <section className="sk-card">
        <Head b={{ title: w.export, intro: w.csvHint }} />
        <div className="sk-actions">
          <button type="button" className="sk-secondary" disabled={!bk.count}
            onClick={() => download(`${data.meta.csv || 'ledger'}-${localIso()}.csv`, `\ufeff${toCsv(st.entries, bk, data)}`, 'text/csv;charset=utf-8')}>{w.csv}</button>
        </div>
      </section>
    </div>
  )
}

// ── Rules, notes and settings ────────────────────────────────────────────
function Settings() {
  const { data, st, update, p, qt, keep, setKeep, backup, restore, lock, base } = useT()
  const w = useW()
  const fileRef = useRef(null)
  const startId = useId()
  const setPlan = (k) => (v) => update((s) => {
    const plan = { ...(s.plan || {}) }
    if (v === null || v === undefined || v === '') delete plan[k]
    else plan[k] = v
    return { ...s, plan }
  })
  return (
    <>
      <section className="sk-card">
        <Head b={{ title: w.planSettings }} extra={Object.keys(st.plan || {}).length ? <button type="button" className="sk-mini" onClick={() => update((s) => ({ ...s, plan: {} }))}>{w.defaults}</button> : null} />
        <div className="sk-form-grid">
          <div className="sk-field">
            <label className="sk-field-label" htmlFor={startId}>{w.startMonth}</label>
            <input id={startId} type="month" value={p.start} onChange={(e) => setPlan('start')(isYm(e.target.value) && e.target.value !== data.plan.start ? e.target.value : null)} />
          </div>
          <NumField label={w.openAmt} value={p.openBase} onCommit={setPlan('openBase')} prefix={base.sym} min={0} />
          <NumField label={w.openUnits} value={p.openUnits} onCommit={setPlan('openUnits')} min={0} />
          <NumField label={w.monthly} value={p.monthly} onCommit={setPlan('monthly')} prefix={base.sym} min={0} />
          <NumField label={w.step} value={p.step} onCommit={setPlan('step')} suffix="%" scale={100} min={-50} max={200} />
          <NumField label={w.every} value={p.every} onCommit={setPlan('every')} min={1} max={120} />
          <NumField label={w.cap} value={p.cap || ''} onCommit={setPlan('cap')} prefix={base.sym} min={0} placeholder={w.capHint} />
          <NumField label={w.targetAmt} value={p.target} onCommit={setPlan('target')} prefix={base.sym} min={0} />
          <NumField label={w.threshold} value={p.threshold} onCommit={setPlan('threshold')} prefix={base.sym} min={0} />
          <NumField label={w.reserveMonths} value={p.capMonths} onCommit={setPlan('capMonths')} min={0} max={60} />
        </div>
        {list(data.plan.tax?.bands).length > 0 && (
          <div className="sk-field">
            <span className="sk-field-label">{w.surcharge} · {fill(w.taxNow, { t: pct(p.tax) })}</span>
            <Seg label={w.surcharge} className="is-wrap" value={p.surcharge} onChange={(v) => setPlan('surcharge')(v === num(data.plan.surcharge) ? null : v)}
              options={list(data.plan.tax.bands).map((b) => ({ id: num(b.v), label: b.label }))} />
          </div>
        )}
      </section>

      <section className="sk-card">
        <Head b={{ title: w.feed }} />
        <Check on={!st.feedOff} onChange={(on) => update((s) => ({ ...s, feedOff: !on }))}>{w.feedOn}</Check>
        <p className="sk-hint">{w.feedHint}</p>
        <div className="sk-form-grid">
          <NumField label={w.manualPrice} value={st.manual?.price ?? ''} prefix={base.sym} min={0} hint={w.manualHint}
            onCommit={(v) => update((s) => ({ ...s, manual: v > 0 ? { price: v, fx: num(s.manual?.fx) || qt.fx, at: Date.now() } : null }))} />
          {st.manual && (
            <NumField label={`${w.manualRate} (${fill(w.fxLine, { r: data.meta.cur.local.sym, b: base.sym })})`} value={st.manual.fx} min={0}
              onCommit={(v) => update((s) => (s.manual ? { ...s, manual: { ...s.manual, fx: v > 0 ? v : qt.fx, at: Date.now() } } : s))} />
          )}
        </div>
      </section>

      <section className="sk-card" id="sk-backup">
        <Head b={{ title: w.backupTitle, intro: w.backupHint }} />
        <p className="sk-sub">{fill(w.lastBackupOn, { d: st.backupAt ? new Date(st.backupAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : w.never })}</p>
        <div className="sk-actions">
          <button type="button" className="sk-primary" onClick={backup}>{w.backup}</button>
          <button type="button" className="sk-secondary" onClick={() => fileRef.current?.click()}>{w.restore}</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) restore(f) }} />
        </div>
      </section>

      <section className="sk-card">
        <Head b={{ title: w.device }} />
        <Check on={keep} onChange={setKeep}>{w.keepUnlocked}</Check>
        <p className="sk-hint">{w.keepHint}</p>
        <div className="sk-actions"><button type="button" className="sk-secondary" onClick={lock}>{w.lock}</button></div>
      </section>
    </>
  )
}

function PlanView() {
  const { data } = useT()
  return <div className="sk-stack"><Blocks items={data.sections?.plan} /></div>
}
function RulesView() {
  const { data } = useT()
  return <div className="sk-stack"><Blocks items={data.sections?.rules} /></div>
}
function NotesView({ focus, nonce }) {
  const { data } = useT()
  useEffect(() => {
    if (focus?.section !== 'backup') return
    requestAnimationFrame(() => document.getElementById('sk-backup')?.scrollIntoView({ behavior: smooth(), block: 'start' }))
  }, [focus, nonce])
  return <div className="sk-stack"><Blocks items={data.sections?.notes} /><Settings /></div>
}

// ── Shell ────────────────────────────────────────────────────────────────
const VIEWS = { today: TodayView, plan: PlanView, grow: GrowView, log: LedgerView, rules: RulesView, notes: NotesView }

// Encrypts and writes the newest state; changes made mid-write are picked up
// by the same loop, so nothing is lost and writes never overlap.
function useSaver(key, st) {
  const [status, setStatus] = useState('saved')
  const latest = useRef(null)
  const running = useRef(false)
  const seen = useRef(null)
  useEffect(() => {
    if (!st) return
    if (seen.current === null) { seen.current = st; return }
    if (seen.current === st) return
    seen.current = st
    latest.current = st
    setStatus('saving')
    if (running.current) return
    running.current = true
    ;(async () => {
      let ok = true
      while (latest.current) {
        const snap = latest.current
        latest.current = null
        try {
          localStorage.setItem(STORE, JSON.stringify(await seal(key, snap)))
          ok = true
        } catch { ok = false }
      }
      running.current = false
      setStatus(ok ? 'saved' : 'error')
    })()
  }, [key, st])
  return status
}

function QuoteCard() {
  const { data, qt, zone, refresh, live, feedOn, B, L } = useT()
  const w = useW()
  const unit = data.meta.unit || {}
  const row = list(data.plan.ladder)[zone] || {}
  const t = qt.at ? new Date(qt.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
  const busy = live.status === 'loading' || live.status === 'refreshing'
  return (
    <aside className="sk-quote" aria-label={`${unit.code || ''} ${w.price}`}>
      <p className="sk-kicker">{unit.code} · {w.price}</p>
      <p className="sk-quote-price">{B(qt.price)}</p>
      <p className="sk-quote-local">{L(qt.local)}<span> · {fill(w.fxLine, { r: L(qt.fx, { cents: true }), b: `${data.meta.cur.base.sym}1` })}</span></p>
      <div className="sk-dd">
        <div className="sk-dd-top"><span>{w.fromHigh}</span><b>−{pct(qt.dd)}</b></div>
        <Bar value={qt.dd * 100} max={100} tone="accent" label={w.fromHigh} />
        <small>{fill(w.highLine, { p: B(qt.high), d: fmtDate(qt.highAt) })}</small>
      </div>
      <p className="sk-zone-chip" data-zone={zone}>{row.label}</p>
      <p className="sk-quote-meta">
        <span>{fill(w[`src_${qt.src}`], { t })}{qt.failed ? ` · ${w.feedFailed}` : ''}</span>
        {feedOn && <button type="button" className="sk-mini" onClick={refresh} disabled={busy}>{busy ? w.refreshing : w.refresh}</button>}
      </p>
    </aside>
  )
}

function Tracker({ data, sealKey, payKey, remembered, onLock, onBack }) {
  const words = useMemo(() => ({ ...UI, ...(data.words || {}) }), [data])
  const views = useMemo(() => list(data.views).filter((v) => VIEWS[v.id]), [data])
  const [st, setSt] = useState(null)
  const [orphan, setOrphan] = useState(false)
  const [flash, setFlash] = useState(null)
  const [nav, setNav] = useState({ view: 'today', opts: null, t: 0 })
  const [keep, setKeepState] = useState(!!remembered)
  const today = useToday()
  const stRef = useRef(null)
  const headingRef = useRef(null)
  const bandRef = useRef(null)
  stRef.current = st

  useEffect(() => {
    let alive = true
    loadState(sealKey).then(({ st: loaded, orphan: lost }) => {
      if (!alive) return
      setSt(loaded)
      setOrphan(lost)
      setNav({ view: VIEWS[loaded.view] ? loaded.view : 'today', opts: null, t: 0 })
    })
    return () => { alive = false }
  }, [sealKey])

  const ready = !!st
  useEffect(() => {
    if (!ready) return
    window.scrollTo({ top: 0, behavior: 'instant' })
    headingRef.current?.focus({ preventScroll: true })
  }, [ready])

  useEffect(() => {
    if (!flash || flash.undo) return undefined
    const t = setTimeout(() => setFlash(null), 8000)
    return () => clearTimeout(t)
  }, [flash])

  const saving = useSaver(sealKey, st)
  const update = useCallback((fn) => setSt((s) => (s ? { ...fn(s), changedAt: Date.now() } : s)), [])
  const feedOn = !!(st && !st.feedOff && data.meta.feed?.url)
  const [live, refresh] = useQuote(data.meta.feed, feedOn)
  const planSaved = st?.plan
  const p = useMemo(() => (st ? planOf(data, st) : null), [data, planSaved]) // eslint-disable-line react-hooks/exhaustive-deps
  const entries = st?.entries
  const bk = useMemo(() => (entries && p ? book(entries, { tax: p.tax, start: p.start, fyStart: num(data.plan.tax?.fyStart, 4) }) : null), [entries, p, data])
  const qt = useMemo(() => (st ? quoteOf(live, st, data.meta.seed) : null), [live, st?.manual, st?.quote, st?.cycle, data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep a recent live price for opening offline, at most every 30 minutes.
  useEffect(() => {
    if (!ready || live.status !== 'live') return
    setSt((s) => {
      if (!s || (s.quote && live.at - num(s.quote.at) < 30 * 60000)) return s
      return { ...s, quote: { price: live.price, local: live.local, fx: live.fx, high: live.high, highAt: live.highAt, at: live.at } }
    })
  }, [live, ready])
  // A new high starts a new cycle, which re-arms the reserve triggers.
  useEffect(() => {
    const h = num(live.high)
    if (!ready || live.status !== 'live' || !(h > 0)) return
    setSt((s) => (!s || (s.cycle && h <= num(s.cycle.high) + EPS) ? s : { ...s, cycle: { high: h, at: live.highAt || localIso(), used: {} } }))
  }, [live, ready])

  const go = useCallback((view, opts) => {
    setNav({ view, opts: opts || null, t: Date.now() })
    setSt((s) => (s && s.view !== view ? { ...s, view } : s))
    const band = bandRef.current
    const top = document.querySelector('.sk-top')?.offsetHeight || 0
    if (band) {
      const y = band.offsetTop + band.offsetHeight - top
      if (window.scrollY > y || opts) window.scrollTo({ top: Math.max(0, y), behavior: 'instant' })
    }
  }, [])

  const backup = useCallback(async () => {
    const cur = stRef.current
    if (!cur) return
    const at = Date.now()
    try {
      const box = await seal(sealKey, { ...cur, backupAt: at })
      download(`ledger-backup-${localIso()}.json`, JSON.stringify({ kind: 'ledger-backup', v: 1, at: new Date(at).toISOString(), ...box }), 'application/json')
      setSt((s) => (s ? { ...s, backupAt: at } : s))
      setFlash({ t: words.backupDone })
    } catch {
      setFlash({ t: words.saveError, err: true })
    }
  }, [sealKey, words])

  const restore = useCallback(async (file) => {
    try {
      const box = JSON.parse(await file.text())
      if (!box || box.kind !== 'ledger-backup' || !box.iv || !box.ct) throw new Error('format')
      const next = normalise(await unseal(sealKey, box))
      try { localStorage.setItem(PREV, JSON.stringify(await seal(sealKey, stRef.current))) } catch {}
      setSt({ ...next, changedAt: Date.now() })
      setOrphan(false)
      const when = Number.isNaN(Date.parse(box.at)) ? '' : new Date(box.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
      setFlash({ t: fill(words.restored, { d: when }), undo: true })
    } catch (reason) {
      setFlash({ t: reason?.name === 'OperationError' ? words.restoreWrongKey : words.restoreBad, err: true })
    }
  }, [sealKey, words])

  const undoRestore = useCallback(async () => {
    try {
      const prev = normalise(await unseal(sealKey, JSON.parse(localStorage.getItem(PREV) || 'null')))
      setSt({ ...prev, changedAt: Date.now() })
      localStorage.removeItem(PREV)
      setFlash({ t: words.undone })
    } catch {
      setFlash({ t: words.undoFail, err: true })
    }
  }, [sealKey, words])

  const setKeep = useCallback(async (v) => {
    setKeepState(v)
    if (v) { if (!(await rememberKey(payKey))) setKeepState(false) } else await forgetKey()
  }, [payKey])

  // Let any field mid-edit commit before leaving.
  const leave = (fn) => () => { document.activeElement?.blur?.(); setTimeout(fn, 80) }
  const lock = leave(onLock)

  if (!st || !p || !bk || !qt) {
    return <main className="sk-root sk-locked"><style>{CSS}</style><p className="sk-opening" role="status">{words.opening}</p></main>
  }

  const cur = data.meta.cur
  const B = (n, o) => money(n, cur.base, o)
  const L = (n, o) => money(n, cur.local, o)
  const zone = zoneOf(data.plan.ladder, qt.dd)
  const k = monthIndex(p, today)
  const K = p.years * 12
  const yearNow = clamp(Math.floor(Math.max(0, k) / 12) + 1, 1, p.years)
  const base = { data, st, update, p, bk, qt, zone, today, go, refresh, live, feedOn, B, L, base: cur.base, local: cur.local, yearNow, keep, setKeep, backup, restore, lock }
  const due = dueItems({ ...base, w: words })
  const ctx = { ...base, due }
  const phase = list(data.phases).find((ph) => yearNow >= ph.from && yearNow <= ph.to)
  const heroLine = k < 0 ? fill(words.startsOn, { m: fmtYm(p.start, 'long') })
    : k >= K ? fill(words.planDone, { m: fmtYm(ymAdd(p.start, K - 1), 'long') })
      : `${fill(words.monthOf, { k: k + 1, K })}, ${fill(words.yearOf, { y: yearNow, Y: p.years })}${phase ? ` · ${phase.name}` : ''}`
  const saveText = saving === 'error' ? words.saveError : saving === 'saving' ? words.saving : words.saved
  const View = VIEWS[nav.view] || TodayView
  const theme = data.meta.theme || {}
  const style = Object.fromEntries(Object.entries(theme).filter(([n, v]) => /^[a-z0-9-]+$/i.test(n) && typeof v === 'string').map(([n, v]) => [`--sk-${n}`, v]))

  return (
    <Words.Provider value={words}>
      <Ctx.Provider value={ctx}>
        <div className="sk-root" style={style}>
          <style>{CSS}</style>
          <header className="sk-top">
            <div className="sk-wrap sk-top-inner">
              <button type="button" className="sk-back" onClick={leave(onBack)} aria-label={words.back}>
                <span aria-hidden="true">←</span><span className="sk-hide-sm">{words.back}</span>
              </button>
              {data.meta.bar && <span className="sk-top-mark"><Mark mark={data.meta.mark} />{data.meta.bar}</span>}
              <div className="sk-top-actions">
                <span className={`sk-save is-${saving}`} role="status" title={saveText}>
                  <span className="sk-save-dot" aria-hidden="true" /><span className="sk-save-text">{saveText}</span>
                </span>
                <button type="button" className="sk-ghost" onClick={backup}>{words.backup}</button>
                <button type="button" className="sk-ghost" onClick={lock}>{words.lock}</button>
              </div>
            </div>
          </header>
          <div className="sk-band" ref={bandRef}>
            <div className="sk-wrap sk-hero">
              <div className="sk-hero-copy">
                {data.meta.kicker && <p className="sk-kicker"><Mark mark={data.meta.mark} />{data.meta.kicker}</p>}
                <h1 ref={headingRef} tabIndex={-1}>{data.meta.title}</h1>
                <p className="sk-hero-line">{heroLine}</p>
                {data.meta.subtitle && <p className="sk-subtitle"><Inline text={data.meta.subtitle} /></p>}
                {list(data.meta.chips).length > 0 && (
                  <dl className="sk-chips">{list(data.meta.chips).map((c, i) => <div key={i}><dt>{c.k}</dt><dd><Inline text={c.v} /></dd></div>)}</dl>
                )}
              </div>
              <QuoteCard />
            </div>
          </div>
          <nav className="sk-nav" aria-label={words.sections}>
            <div className="sk-wrap sk-nav-inner">
              {views.map((v) => (
                <button key={v.id} type="button" aria-current={nav.view === v.id ? 'page' : undefined} onClick={() => go(v.id)}>
                  {v.label}
                  {v.id === 'today' && due.length > 0 && <span className="sk-nav-dot" aria-label={`${due.length} ${words.due}`}>{due.length}</span>}
                </button>
              ))}
            </div>
          </nav>
          <main className="sk-wrap sk-main">
            {orphan && (
              <div className="sk-banner is-warn">
                <p>{words.orphan}</p>
                <button type="button" className="sk-mini" onClick={() => go('notes', { section: 'backup' })}>{words.restore}</button>
                <button type="button" className="sk-mini" onClick={() => setOrphan(false)}>{words.dismiss}</button>
              </div>
            )}
            {flash && (
              <div className={flash.err ? 'sk-banner is-warn' : 'sk-banner is-good'} role="status">
                <p>{flash.t}</p>
                {flash.undo && <button type="button" className="sk-mini" onClick={undoRestore}>{words.undo}</button>}
                <button type="button" className="sk-mini" onClick={() => setFlash(null)}>{words.dismiss}</button>
              </div>
            )}
            <View focus={nav.opts} nonce={nav.t} />
          </main>
          {data.meta.footer && <footer className="sk-footer"><Mark mark={data.meta.mark} /><p><Inline text={data.meta.footer} /></p></footer>}
        </div>
      </Ctx.Provider>
    </Words.Provider>
  )
}

function Gate({ onBack, onOpen }) {
  const w = UI
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [keep, setKeep] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  useEffect(() => {
    if (window.matchMedia?.('(pointer: fine)').matches) inputRef.current?.focus()
  }, [])
  const submit = async (event) => {
    event.preventDefault()
    if (busy || !password) return
    setBusy(true)
    setError('')
    try {
      const key = await deriveKey(password)
      const opened = await openPayload(key)
      const kept = keep ? !!(await rememberKey(key)) : false
      setPassword('')
      onOpen({ ...opened, payKey: key, remembered: kept })
    } catch (reason) {
      setError(reason?.name === 'OperationError' ? w.wrong : w.broken)
      setBusy(false)
      requestAnimationFrame(() => { inputRef.current?.focus(); inputRef.current?.select() })
    }
  }
  return (
    <main className="sk-root sk-locked">
      <style>{CSS}</style>
      <div className="sk-lock-card">
        <div className="sk-lock-icon" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="8" y="17" width="24" height="17" rx="4" /><path d="M13 17v-4a7 7 0 0 1 14 0v4M20 24v4" />
          </svg>
        </div>
        <h1>{w.gateTitle}</h1>
        <p>{w.gateLead}</p>
        <form className="sk-gate-form" onSubmit={submit}>
          <label htmlFor="sk-password">{w.password}</label>
          <div className="sk-password">
            <input id="sk-password" ref={inputRef} type={show ? 'text' : 'password'} autoComplete="current-password" autoCapitalize="off"
              autoCorrect="off" spellCheck={false} value={password} required readOnly={busy} aria-invalid={!!error}
              aria-describedby={error ? 'sk-gate-error' : undefined} onChange={(e) => { setPassword(e.target.value); setError('') }} />
            <button type="button" disabled={busy} aria-pressed={show} aria-label={show ? w.hide : w.show}
              onClick={() => { setShow((v) => !v); inputRef.current?.focus() }}>{show ? w.hide : w.show}</button>
          </div>
          <Check on={keep} onChange={setKeep}>{w.keepUnlocked}<small>{w.keepHint}</small></Check>
          <button type="submit" className="sk-primary" disabled={busy || !password}>{busy ? w.opening : w.openBtn}</button>
          <div className="sk-gate-error" id="sk-gate-error" role="alert">{error}</div>
        </form>
        <small className="sk-gate-note">{w.gateNote}</small>
        <button type="button" className="sk-back" onClick={onBack}>{w.back}</button>
      </div>
    </main>
  )
}

export default function StackPlan({ onBack }) {
  const [opened, setOpened] = useState(null)
  const [checking, setChecking] = useState(true)
  useEffect(() => {
    let alive = true
    ;(async () => {
      const key = await recallKey()
      if (key) {
        try {
          const o = await openPayload(key)
          if (alive) setOpened({ ...o, payKey: key, remembered: true })
        } catch {
          await forgetKey()
        }
      }
      if (alive) setChecking(false)
    })()
    return () => { alive = false }
  }, [])
  const lock = useCallback(async () => { await forgetKey(); setOpened(null) }, [])
  if (checking) return <main className="sk-root sk-locked"><style>{CSS}</style><p className="sk-opening" role="status">{UI.opening}</p></main>
  if (!opened) return <Gate onBack={onBack} onOpen={setOpened} />
  return <Tracker {...opened} onLock={lock} onBack={onBack} />
}

const CSS = `
.sk-root {
  color-scheme: dark;
  --sk-bg: #0b0c0f; --sk-card: #13151a; --sk-raised: #191c22; --sk-hover: #20242b; --sk-field: #0e1013;
  --sk-ink: #eef0f3; --sk-ink2: #c3c8d0; --sk-ink3: #9aa2ad; --sk-line: #252930; --sk-line2: #353b45;
  --sk-accent: #f7931a; --sk-accent2: #ffb35c; --sk-accent-ink: #1a1105; --sk-accent-soft: rgba(247,147,26,.13); --sk-accent-line: rgba(247,147,26,.45);
  --sk-green: #45d18f; --sk-green-soft: rgba(69,209,143,.13); --sk-red: #ff8a80; --sk-red-soft: rgba(255,138,128,.13);
  --sk-blue: #8abcff; --sk-violet: #c7a0ff; --sk-amber: #ffd27a; --sk-r: 16px;
  --sk-shadow: 0 1px 2px rgba(0,0,0,.4), 0 10px 28px rgba(0,0,0,.25);
  min-height: 100vh; background: var(--sk-bg); color: var(--sk-ink);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 15px; line-height: 1.5; letter-spacing: -0.005em; -webkit-font-smoothing: antialiased; font-variant-numeric: tabular-nums;
}
body:has(.sk-root) { background: #0b0c0f !important; background-image: none !important; }
.sk-root h1, .sk-root h2, .sk-root h3 { font-family: inherit; color: var(--sk-ink); letter-spacing: -0.02em; margin: 0; }
.sk-root p { margin: 0; }
:where(.sk-root) button { font: inherit; color: inherit; cursor: pointer; }
:where(.sk-root) button:disabled { cursor: default; opacity: .55; }
.sk-root :focus-visible { outline: 3px solid var(--sk-accent2); outline-offset: 2px; box-shadow: none; }
.sk-root a { color: var(--sk-accent2); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
.sk-root code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; background: var(--sk-raised); padding: 1px 5px; border-radius: 5px; }
.sk-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; }
.sk-wrap { width: 100%; max-width: 1140px; margin: 0 auto; padding: 0 20px; box-sizing: border-box; }
.sk-root [data-tone="low"] { --tone: #8abcff; } .sk-root [data-tone="mid"] { --tone: #f7931a; } .sk-root [data-tone="high"] { --tone: #45d18f; }
.sk-root [data-tone="custom"] { --tone: #c7a0ff; } .sk-root [data-tone="paid"] { --tone: #9aa2ad; } .sk-root [data-tone="target"] { --tone: #ff8a80; }

.sk-top { position: sticky; top: 0; z-index: 30; background: rgba(11,12,15,.88); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); border-bottom: 1px solid var(--sk-line); }
.sk-top-inner { display: flex; align-items: center; gap: 12px; min-height: 56px; }
.sk-back { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 6px 10px; border: 0; border-radius: 10px; background: transparent; color: var(--sk-ink2); font-weight: 600; }
.sk-back:hover { background: var(--sk-hover); color: var(--sk-ink); }
.sk-top-mark { display: inline-flex; align-items: center; gap: 8px; font-weight: 750; }
.sk-top-mark .sk-mark { width: 20px; height: 20px; }
.sk-top-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.sk-save { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--sk-ink3); }
.sk-save-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--sk-green); }
.sk-save.is-saving .sk-save-dot { background: var(--sk-amber); }
.sk-save.is-error { color: var(--sk-red); }
.sk-save.is-error .sk-save-dot { background: var(--sk-red); }
.sk-ghost { min-height: 36px; padding: 6px 14px; border: 1px solid var(--sk-line2); border-radius: 999px; background: transparent; font-weight: 650; font-size: 13.5px; }
.sk-ghost:hover { background: var(--sk-hover); }

.sk-band { background: radial-gradient(900px 420px at 88% -20%, rgba(247,147,26,.2), transparent 70%), radial-gradient(700px 380px at 0% 0%, rgba(138,188,255,.07), transparent 70%), var(--sk-bg); border-bottom: 1px solid var(--sk-line); }
.sk-hero { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 28px; padding-top: 34px; padding-bottom: 30px; align-items: start; }
.sk-kicker { display: flex; align-items: center; gap: 8px; color: var(--sk-accent2); font-size: 12px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
.sk-hero-copy > .sk-kicker { margin-bottom: 10px; }
.sk-kicker .sk-mark { width: 18px; height: 18px; flex: none; }
.sk-hero h1 { font-size: clamp(30px, 4.4vw, 46px); line-height: 1.06; font-weight: 800; letter-spacing: -0.03em; outline: none; text-wrap: balance; }
.sk-hero-line { margin-top: 10px !important; color: var(--sk-ink2); font-weight: 650; }
.sk-subtitle { margin-top: 12px !important; color: var(--sk-ink2); max-width: 680px; font-size: 16px; line-height: 1.6; }
.sk-chips { display: flex; flex-wrap: wrap; gap: 8px; margin: 18px 0 0; }
.sk-chips div { padding: 8px 12px; border: 1px solid var(--sk-line2); border-radius: 12px; background: rgba(255,255,255,.02); }
.sk-chips dt { font-size: 11px; letter-spacing: .08em; text-transform: uppercase; color: var(--sk-ink3); font-weight: 750; }
.sk-chips dd { margin: 2px 0 0; font-weight: 650; }
.sk-quote { background: var(--sk-card); border: 1px solid var(--sk-line2); border-radius: var(--sk-r); padding: 18px; box-shadow: var(--sk-shadow); display: grid; gap: 10px; }
.sk-quote-price { font-size: 34px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; }
.sk-quote-local { color: var(--sk-ink2); font-weight: 650; }
.sk-quote-local span { color: var(--sk-ink3); font-weight: 500; }
.sk-dd { display: grid; gap: 6px; }
.sk-dd-top { display: flex; justify-content: space-between; font-size: 13px; color: var(--sk-ink2); }
.sk-dd-top b { color: var(--sk-accent2); font-size: 15px; }
.sk-dd small { color: var(--sk-ink3); font-size: 12.5px; }
.sk-zone-chip { justify-self: start; display: inline-flex; align-items: center; padding: 5px 11px; border-radius: 999px; font-size: 12.5px; font-weight: 750; background: var(--sk-accent-soft); color: var(--sk-accent2); border: 1px solid var(--sk-accent-line); }
.sk-zone-chip[data-zone="0"] { background: rgba(138,188,255,.12); color: var(--sk-blue); border-color: rgba(138,188,255,.4); }
.sk-zone-chip[data-zone="3"] { background: var(--sk-green-soft); color: var(--sk-green); border-color: rgba(69,209,143,.45); }
.sk-quote-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; color: var(--sk-ink3); }

.sk-nav { position: sticky; top: 57px; z-index: 20; background: rgba(11,12,15,.92); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); border-bottom: 1px solid var(--sk-line); }
.sk-nav-inner { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; }
.sk-nav-inner::-webkit-scrollbar { display: none; }
.sk-nav button { position: relative; flex: none; display: inline-flex; align-items: center; gap: 7px; min-height: 48px; padding: 0 14px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--sk-ink3); font-weight: 650; font-size: 14px; }
.sk-nav button:hover { color: var(--sk-ink); }
.sk-nav button[aria-current="page"] { color: var(--sk-ink); border-bottom-color: var(--sk-accent); }
.sk-nav-dot { min-width: 19px; height: 19px; padding: 0 5px; border-radius: 999px; background: var(--sk-accent); color: var(--sk-accent-ink); font-size: 11.5px; font-weight: 800; display: inline-grid; place-items: center; box-sizing: border-box; }

.sk-main { padding-top: 22px; padding-bottom: 60px; }
.sk-stack { display: grid; gap: 16px; min-width: 0; }
.sk-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start; }
.sk-span-all { grid-column: 1 / -1; }
.sk-card { background: var(--sk-card); border: 1px solid var(--sk-line); border-radius: var(--sk-r); padding: 20px; box-shadow: var(--sk-shadow); display: grid; gap: 12px; min-width: 0; }
.sk-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px 12px; flex-wrap: wrap; }
.sk-head-text { display: grid; gap: 4px; min-width: 0; }
.sk-head h2 { font-size: 19px; line-height: 1.3; font-weight: 770; outline: none; }
.sk-intro { color: var(--sk-ink2); }
.sk-sub { color: var(--sk-ink3); font-size: 14px; }
.sk-note { color: var(--sk-ink3); font-size: 13px; line-height: 1.55; }
.sk-lead { color: var(--sk-ink2); font-size: 16px; }
.sk-prose { display: grid; gap: 8px; color: var(--sk-ink2); }
.sk-prose strong { color: var(--sk-ink); }
.sk-points { margin: 0; padding-left: 20px; display: grid; gap: 6px; color: var(--sk-ink2); }
.sk-points li::marker { color: var(--sk-accent); }
.sk-pill { display: inline-flex; align-items: center; min-height: 26px; padding: 2px 10px; border-radius: 999px; background: var(--sk-raised); border: 1px solid var(--sk-line2); font-size: 12.5px; font-weight: 750; color: var(--sk-ink2); box-sizing: border-box; }
.sk-pill.is-good { background: var(--sk-green-soft); color: var(--sk-green); border-color: rgba(69,209,143,.4); }
.sk-pill.is-warn { background: var(--sk-accent-soft); color: var(--sk-accent2); border-color: var(--sk-accent-line); }
.sk-figure { font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }

.sk-primary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 10px 18px; border: 0; border-radius: 999px; background: var(--sk-accent); color: var(--sk-accent-ink); font-weight: 750; }
.sk-primary:hover:not(:disabled) { background: var(--sk-accent2); }
.sk-secondary { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 10px 18px; border: 1px solid var(--sk-line2); border-radius: 999px; background: var(--sk-raised); font-weight: 650; }
.sk-secondary:hover:not(:disabled) { background: var(--sk-hover); }
.sk-mini { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; padding: 5px 12px; border: 1px solid var(--sk-line2); border-radius: 999px; background: transparent; font-size: 13px; font-weight: 650; color: var(--sk-ink2); justify-self: start; white-space: nowrap; }
.sk-mini:hover:not(:disabled) { background: var(--sk-hover); color: var(--sk-ink); }
.sk-mini.is-danger { border-color: var(--sk-red); color: var(--sk-red); background: var(--sk-red-soft); }
.sk-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.sk-bar { height: 8px; border-radius: 999px; background: var(--sk-raised); overflow: hidden; }
.sk-bar span { display: block; height: 100%; border-radius: inherit; background: var(--sk-accent); transition: width .4s ease; }
.sk-bar[data-tone="good"] span { background: var(--sk-green); }
.sk-bar[data-tone="warn"] span { background: var(--sk-red); }

.sk-month-grid { display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 12px; }
.sk-stat { display: grid; gap: 3px; padding: 14px; border-radius: 12px; background: var(--sk-raised); border: 1px solid var(--sk-line); align-content: start; }
.sk-stat span { font-size: 12px; font-weight: 750; letter-spacing: .06em; text-transform: uppercase; color: var(--sk-ink3); }
.sk-stat b { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
.sk-stat.is-big b { font-size: 32px; color: var(--sk-accent2); }
.sk-stat small { color: var(--sk-ink3); font-size: 13px; }
.sk-progress-line { font-size: 14px; color: var(--sk-ink2); font-weight: 650; }
.sk-zone-note { padding: 12px 14px; border-radius: 12px; background: var(--sk-accent-soft); border: 1px solid var(--sk-accent-line); font-size: 14px; }
.sk-due { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.sk-due li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; border-radius: 12px; background: var(--sk-raised); border: 1px solid var(--sk-line); font-size: 14px; }
.sk-triggers { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.sk-triggers li { display: grid; grid-template-columns: 56px minmax(0, 1fr) auto; align-items: center; gap: 6px 12px; padding: 10px 12px; border-radius: 12px; background: var(--sk-raised); border: 1px solid var(--sk-line); }
.sk-triggers li .sk-mini { grid-column: 2 / -1; }
.sk-trig-at { font-weight: 800; font-size: 16px; color: var(--sk-ink2); }
.sk-trig-body { display: grid; min-width: 0; }
.sk-trig-body small { color: var(--sk-ink3); font-size: 12.5px; }
.sk-trig-state { font-size: 12.5px; font-weight: 750; color: var(--sk-ink3); text-align: right; }
.sk-triggers li[data-state="fired"] { border-color: var(--sk-accent-line); background: var(--sk-accent-soft); }
.sk-triggers li[data-state="fired"] .sk-trig-at, .sk-triggers li[data-state="fired"] .sk-trig-state { color: var(--sk-accent2); }
.sk-triggers li[data-state="used"] .sk-trig-state { color: var(--sk-green); }
.sk-callout-line { padding: 10px 12px; border-radius: 12px; background: var(--sk-accent-soft); border: 1px solid var(--sk-accent-line); font-size: 14px; font-weight: 650; }
.sk-units { color: var(--sk-ink2); }
.sk-units b { font-size: 26px; color: var(--sk-ink); font-weight: 800; letter-spacing: -0.02em; }
.sk-units small { color: var(--sk-ink3); }
.sk-dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; margin: 0; }
.sk-dl dt { font-size: 12px; color: var(--sk-ink3); font-weight: 650; }
.sk-dl dd { margin: 2px 0 0; font-weight: 700; }
.sk-dl dd small { display: block; font-weight: 500; color: var(--sk-ink3); font-size: 12.5px; }
.sk-root .is-up { color: var(--sk-green); }
.sk-root .is-down { color: var(--sk-red); }
.sk-split { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--sk-ink3); }
.sk-split div { display: grid; }
.sk-split b { color: var(--sk-ink); font-size: 14px; }
.sk-split div:last-child { text-align: right; }
.sk-pace { font-size: 18px; font-weight: 770; }
.sk-pace.is-good { color: var(--sk-green); }
.sk-pace.is-warn { color: var(--sk-red); }
.sk-pace.is-accent { color: var(--sk-accent2); }
.sk-next { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.sk-next li { display: grid; grid-template-columns: 130px minmax(0, 1fr) auto; gap: 10px; align-items: baseline; padding-bottom: 10px; border-bottom: 1px solid var(--sk-line); }
.sk-next li:last-child { border-bottom: 0; padding-bottom: 0; }
.sk-next span { color: var(--sk-ink3); font-size: 13px; }
.sk-next b { font-weight: 650; }
.sk-next small { color: var(--sk-accent2); font-size: 12.5px; font-weight: 750; white-space: nowrap; }

.sk-table-wrap { overflow-x: auto; border: 1px solid var(--sk-line); border-radius: 12px; }
.sk-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.sk-table th, .sk-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--sk-line); vertical-align: top; }
.sk-table thead th { background: var(--sk-raised); font-size: 12px; letter-spacing: .05em; text-transform: uppercase; color: var(--sk-ink3); font-weight: 750; white-space: nowrap; }
.sk-table tbody th { font-weight: 700; color: var(--sk-ink); }
.sk-table td { color: var(--sk-ink2); }
.sk-table tr:last-child > * { border-bottom: 0; }
.sk-table.is-num td, .sk-table.is-num thead th:not(:first-child) { text-align: right; white-space: nowrap; }
.sk-table td small { display: block; color: var(--sk-ink3); font-size: 12px; }
.sk-table tr.is-now > * { background: var(--sk-accent-soft); }
.sk-table tr.is-now > th { color: var(--sk-accent2); }
.sk-swatch { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 8px; background: var(--tone, var(--sk-ink3)); }

.sk-chart { position: relative; width: 100%; min-width: 0; }
.sk-plot { position: relative; touch-action: pan-y; border-radius: 10px; }
.sk-chart svg { display: block; overflow: visible; }
.sk-gridline { stroke: var(--sk-line); stroke-width: 1; }
.sk-axis { fill: var(--sk-ink3); font-size: 11.5px; font-family: inherit; }
.sk-axis-target { fill: var(--sk-red); font-weight: 700; }
.sk-target { stroke: var(--sk-red); stroke-width: 1.5; stroke-dasharray: 2 5; }
.sk-rule { stroke: var(--sk-ink3); stroke-width: 1; stroke-dasharray: 3 3; }
.sk-line { fill: none; stroke: var(--tone, var(--sk-accent)); stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round; }
.sk-dot { fill: var(--sk-card); stroke: var(--tone, var(--sk-accent)); stroke-width: 2.5; }
.sk-tip { position: absolute; top: 4px; transform: translateX(-50%); min-width: 180px; display: grid; gap: 3px; padding: 10px 12px; border-radius: 12px; background: rgba(19,21,26,.97); border: 1px solid var(--sk-line2); box-shadow: var(--sk-shadow); font-size: 12.5px; pointer-events: none; }
.sk-tip span { display: grid; grid-template-columns: 10px 1fr auto; align-items: center; gap: 8px; color: var(--sk-ink2); }
.sk-tip i, .sk-legend i { display: inline-block; width: 10px; height: 3px; border-radius: 2px; background: var(--tone); }
.sk-tip em { font-style: normal; font-weight: 750; color: var(--sk-ink); }
.sk-legend { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px 16px; font-size: 13px; color: var(--sk-ink2); }
.sk-legend li { display: inline-flex; align-items: center; gap: 7px; }
.sk-legend i { width: 16px; }
.sk-legend li[data-tone="paid"] i { background: repeating-linear-gradient(90deg, var(--tone) 0 5px, transparent 5px 9px); }
.sk-legend li[data-tone="target"] i { background: repeating-linear-gradient(90deg, var(--tone) 0 2px, transparent 2px 6px); }
.sk-barfill { fill: rgba(247,147,26,.5); }
.sk-barfill.is-hit { fill: var(--sk-accent); }
.sk-planline { fill: none; stroke: var(--sk-ink); stroke-width: 2; stroke-dasharray: 4 3; }
.sk-details summary { cursor: pointer; color: var(--sk-ink2); font-weight: 650; font-size: 14px; padding: 4px 0; }
.sk-details[open] summary { margin-bottom: 10px; }
.sk-big-line { font-size: 34px; font-weight: 800; color: var(--sk-accent2); letter-spacing: -0.02em; }

.sk-form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px 14px; }
.sk-field { display: grid; gap: 6px; align-content: start; min-width: 0; }
.sk-span-2 { grid-column: span 2; }
.sk-field-label { font-size: 12.5px; font-weight: 750; color: var(--sk-ink2); }
.sk-field > input, .sk-num { width: 100%; box-sizing: border-box; min-height: 44px; border: 1px solid var(--sk-line2); border-radius: 10px; background: var(--sk-field); color: var(--sk-ink); font: inherit; font-size: 15px; }
.sk-field > input { padding: 9px 12px; }
.sk-num { display: flex; align-items: center; overflow: hidden; }
.sk-num input { flex: 1; min-width: 0; min-height: 42px; padding: 9px 12px; border: 0; background: transparent; color: var(--sk-ink); font: inherit; font-size: 15px; }
.sk-affix { padding-left: 12px; color: var(--sk-ink3); font-weight: 650; }
.sk-num input + .sk-affix { padding: 0 12px 0 0; }
.sk-field > input:focus, .sk-field > input:focus-visible, .sk-num:focus-within { outline: none; border-color: var(--sk-accent); box-shadow: 0 0 0 3px rgba(247,147,26,.28); }
.sk-num input:focus, .sk-num input:focus-visible { outline: none; box-shadow: none; }
.sk-root input[type="date"], .sk-root input[type="month"] { color-scheme: dark; }
.sk-hint { color: var(--sk-ink3); font-size: 12.5px; }
.sk-form-error { color: var(--sk-red); font-weight: 650; font-size: 14px; }
.sk-form-error:empty { display: none; }
.sk-entry-form { display: grid; gap: 14px; }
.sk-reserve-tick { display: grid; gap: 2px; }
.sk-reserve-tick .sk-hint { padding-left: 42px; }
.sk-stress-controls { display: flex; flex-wrap: wrap; gap: 12px 16px; align-items: center; }
.sk-range { display: grid; gap: 6px; min-width: 220px; flex: 1; }
.sk-range label { font-size: 13px; color: var(--sk-ink2); font-weight: 650; }
.sk-range small { color: var(--sk-ink3); font-weight: 500; }
.sk-range input { accent-color: var(--sk-accent); width: 100%; min-height: 28px; }
.sk-seg { display: inline-flex; flex: none; flex-wrap: nowrap; gap: 4px; padding: 4px; border-radius: 999px; background: var(--sk-field); border: 1px solid var(--sk-line2); justify-self: start; }
.sk-seg.is-wrap { flex: initial; flex-wrap: wrap; border-radius: 14px; }
.sk-seg button { min-height: 36px; padding: 5px 12px; border: 0; border-radius: 999px; background: transparent; color: var(--sk-ink2); font-size: 13.5px; font-weight: 650; }
.sk-seg button.is-on { background: var(--sk-accent); color: var(--sk-accent-ink); }
.sk-seg button:not(.is-on):hover { background: var(--sk-hover); color: var(--sk-ink); }
.sk-check { display: flex; align-items: flex-start; gap: 10px; width: 100%; min-height: 40px; padding: 8px 10px; border: 0; border-radius: 10px; background: transparent; text-align: left; color: var(--sk-ink); }
.sk-check:hover { background: var(--sk-hover); }
.sk-check-box { flex: none; width: 22px; height: 22px; margin-top: 1px; display: grid; place-items: center; border: 2px solid var(--sk-ink3); border-radius: 6px; font-size: 13px; font-weight: 900; color: var(--sk-accent-ink); box-sizing: border-box; }
.sk-check.is-on .sk-check-box { background: var(--sk-accent); border-color: var(--sk-accent); }
.sk-check-label { display: grid; gap: 2px; }
.sk-check-label small { color: var(--sk-ink3); font-size: 12.5px; }
.sk-check.is-on .sk-check-label { color: var(--sk-ink2); }
.sk-checks { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.sk-check-note { margin: -4px 0 6px 42px !important; color: var(--sk-ink3); font-size: 13px; }

.sk-tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.sk-tile { display: grid; gap: 2px; padding: 14px 16px; border-radius: var(--sk-r); background: var(--sk-card); border: 1px solid var(--sk-line); min-width: 0; }
.sk-tile span { font-size: 12px; font-weight: 750; color: var(--sk-ink3); text-transform: uppercase; letter-spacing: .06em; }
.sk-tile b { font-size: 20px; font-weight: 800; letter-spacing: -0.02em; overflow-wrap: anywhere; }
.sk-tile small { color: var(--sk-ink3); font-size: 12.5px; }
.sk-month-group { display: grid; gap: 8px; }
.sk-month-group + .sk-month-group { margin-top: 10px; }
.sk-month-group h3 { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; font-size: 15px; font-weight: 770; }
.sk-month-group h3 small { color: var(--sk-ink3); font-weight: 650; font-size: 13px; }
.sk-entries { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.sk-entry { display: grid; grid-template-columns: 116px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 10px 12px; border-radius: 12px; background: var(--sk-raised); border: 1px solid var(--sk-line); }
.sk-entry-kind { font-size: 12.5px; font-weight: 770; color: var(--sk-ink2); display: grid; gap: 2px; }
.sk-entry-kind em { font-style: normal; color: var(--sk-accent2); font-size: 11.5px; text-transform: uppercase; letter-spacing: .06em; }
.sk-entry[data-kind="buy"] .sk-entry-kind { color: var(--sk-green); }
.sk-entry[data-kind="sell"] .sk-entry-kind { color: var(--sk-red); }
.sk-entry-main { display: grid; gap: 2px; min-width: 0; }
.sk-entry-main b { font-weight: 750; }
.sk-entry-main small { color: var(--sk-ink3); font-size: 12.5px; overflow-wrap: anywhere; }
.sk-entry-actions { display: flex; gap: 6px; }

.sk-callout { padding: 16px 18px; border-radius: var(--sk-r); border: 1px solid var(--sk-line2); border-left: 4px solid var(--sk-accent); background: var(--sk-card); display: grid; gap: 8px; }
.sk-callout[data-tone="key"] { background: linear-gradient(90deg, var(--sk-accent-soft), transparent 70%), var(--sk-card); }
.sk-callout[data-tone="warn"] { border-left-color: var(--sk-red); background: linear-gradient(90deg, var(--sk-red-soft), transparent 60%), var(--sk-card); }
.sk-callout[data-tone="good"] { border-left-color: var(--sk-green); }
.sk-callout[data-tone="tip"] { border-left-color: var(--sk-blue); }
.sk-callout-title { font-weight: 780; font-size: 15.5px; color: var(--sk-ink); }
.sk-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.sk-cards[data-cols="2"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.sk-cards[data-cols="4"] { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.sk-mini-card { display: grid; gap: 8px; align-content: start; padding: 14px 16px; border-radius: 14px; background: var(--sk-raised); border: 1px solid var(--sk-line); min-width: 0; }
.sk-mini-card h3 { font-size: 16px; font-weight: 770; }
.sk-tag { font-size: 11.5px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--sk-accent2); }
.sk-mini-card[data-tone="warn"] .sk-tag { color: var(--sk-red); }
.sk-mini-card[data-tone="good"] .sk-tag { color: var(--sk-green); }
.sk-steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.sk-steps > li { padding: 14px 16px; border-radius: 14px; background: var(--sk-raised); border: 1px solid var(--sk-line); display: grid; gap: 6px; }
.sk-steps > li.is-now { border-color: var(--sk-accent-line); box-shadow: inset 3px 0 0 var(--sk-accent); }
.sk-when { font-size: 12px; font-weight: 750; letter-spacing: .06em; text-transform: uppercase; color: var(--sk-accent2); }
.sk-steps h3 { font-size: 17px; font-weight: 770; }
.sk-facts { margin: 0; display: grid; }
.sk-facts > div { display: grid; grid-template-columns: minmax(160px, 260px) minmax(0, 1fr); gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--sk-line); }
.sk-facts > div:last-child { border-bottom: 0; }
.sk-facts dt { font-weight: 700; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.sk-facts dd { margin: 0; color: var(--sk-ink2); }
.sk-chip { font-size: 10.5px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; padding: 2px 7px; border-radius: 999px; border: 1px solid var(--sk-line2); color: var(--sk-ink3); }
.sk-chip.is-verified { color: var(--sk-green); border-color: rgba(69,209,143,.4); }
.sk-chip.is-estimate { color: var(--sk-amber); border-color: rgba(255,210,122,.4); }
.sk-src { font-size: 13px; white-space: nowrap; }
.sk-sources { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.sk-sources li { display: grid; gap: 2px; }
.sk-sources span { color: var(--sk-ink3); font-size: 13px; }
.sk-banner { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 12px 14px; margin-bottom: 16px; border-radius: 12px; border: 1px solid var(--sk-line2); background: var(--sk-card); }
.sk-banner p { flex: 1 1 240px; }
.sk-banner.is-warn { border-color: rgba(255,138,128,.5); background: var(--sk-red-soft); }
.sk-banner.is-good { border-color: rgba(69,209,143,.45); background: var(--sk-green-soft); }
.sk-footer { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 26px 20px 40px; color: var(--sk-ink3); font-size: 13px; border-top: 1px solid var(--sk-line); text-align: center; }
.sk-footer .sk-mark { width: 18px; height: 18px; flex: none; }

.sk-locked { display: grid; place-items: center; padding: 24px 16px; background: radial-gradient(900px 520px at 50% -10%, rgba(247,147,26,.2), transparent 70%), var(--sk-bg); }
.sk-opening { color: var(--sk-ink3); font-size: 14px; }
.sk-lock-card { width: min(420px, 100%); box-sizing: border-box; display: grid; gap: 14px; padding: 28px 24px; border-radius: 20px; background: var(--sk-card); border: 1px solid var(--sk-line2); box-shadow: var(--sk-shadow); text-align: center; }
.sk-lock-icon { width: 56px; height: 56px; margin: 0 auto; display: grid; place-items: center; border-radius: 16px; background: var(--sk-accent-soft); color: var(--sk-accent2); }
.sk-lock-icon svg { width: 30px; height: 30px; }
.sk-lock-card h1 { font-size: 26px; font-weight: 800; }
.sk-lock-card > p { color: var(--sk-ink2); }
.sk-gate-form { display: grid; gap: 12px; text-align: left; }
.sk-gate-form > label { font-size: 13px; font-weight: 750; color: var(--sk-ink2); }
.sk-password { display: flex; border: 1px solid var(--sk-line2); border-radius: 12px; background: var(--sk-field); overflow: hidden; }
.sk-password:focus-within { border-color: var(--sk-accent); box-shadow: 0 0 0 3px rgba(247,147,26,.28); }
.sk-password input { flex: 1; min-width: 0; min-height: 46px; padding: 10px 14px; border: 0; background: transparent; color: var(--sk-ink); font: inherit; font-size: 16px; }
.sk-password input:focus, .sk-password input:focus-visible { outline: none; box-shadow: none; }
.sk-password button { min-width: 64px; border: 0; border-left: 1px solid var(--sk-line2); background: transparent; padding: 0 14px; font-weight: 650; color: var(--sk-ink2); }
.sk-gate-error { color: var(--sk-red); font-weight: 650; font-size: 14px; }
.sk-gate-error:empty { display: none; }
.sk-gate-note { color: var(--sk-ink3); font-size: 12.5px; }
.sk-lock-card .sk-back { justify-self: center; }

@media (max-width: 960px) {
  .sk-hero { grid-template-columns: 1fr; }
  .sk-cards, .sk-cards[data-cols="4"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sk-tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 720px) {
  .sk-wrap { padding: 0 14px; }
  .sk-grid { grid-template-columns: minmax(0, 1fr); }
  .sk-month-grid { grid-template-columns: 1fr 1fr; }
  .sk-month-grid .is-big { grid-column: 1 / -1; }
  .sk-cards, .sk-cards[data-cols="2"], .sk-cards[data-cols="4"] { grid-template-columns: minmax(0, 1fr); }
  .sk-card { padding: 16px; }
  .sk-hide-sm, .sk-save-text { display: none; }
  .sk-entry { grid-template-columns: minmax(0, 1fr); gap: 6px; }
  .sk-entry-kind { grid-auto-flow: column; justify-content: start; gap: 8px; }
  .sk-facts > div { grid-template-columns: minmax(0, 1fr); gap: 4px; }
  .sk-next li { grid-template-columns: minmax(0, 1fr) auto; }
  .sk-next li span { grid-column: 1 / -1; }
  .sk-span-2 { grid-column: auto; }
  .sk-hero { padding-top: 24px; padding-bottom: 22px; }
}
@media (max-width: 420px) {
  .sk-tiles { gap: 8px; }
  .sk-dl { grid-template-columns: minmax(0, 1fr); }
  .sk-top-mark { display: none; }
  .sk-triggers li { grid-template-columns: 48px minmax(0, 1fr); }
  .sk-trig-state { grid-column: 2; text-align: left; }
}
@media (prefers-reduced-motion: reduce) {
  .sk-root *, .sk-root *::before, .sk-root *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}
`
