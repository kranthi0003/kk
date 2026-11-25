import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { BITCOIN_PLAN as PLAN } from '../lib/bitcoinPlan'
import { fetchBtcWallet } from '../lib/btcWallet'

/* ------------------------------------------------------------------ *
 * #/bitcoin — a 13-year Bitcoin plan and ledger, opened from the Bitcoin
 * icon in the navbar.
 *
 * Every word and number comes from src/lib/bitcoinPlan.js; this file renders
 * it: a monthly contribution schedule with step-ups, projections with a
 * stress test, buying rules keyed to the distance from the all-time high,
 * the cold-storage wallet read live from the chain, a ledger with
 * first-in-first-out cost basis and yearly tax estimates, and checklists.
 *
 * Ledger entries stay in this browser's localStorage and in backup files the
 * visitor downloads; nothing is sent anywhere. Prices come from the public
 * feed named in the plan file.
 *
 * Until 24 Nov 2026 the page was password-protected and saved its records
 * encrypted. Those records can be brought over once with the old password;
 * src/lib/stackPayload.js (the old encrypted plan, which holds their key) is
 * loaded only for that.
 * ------------------------------------------------------------------ */

const enc = new TextEncoder()
const dec = new TextDecoder()
const fromB64 = (value) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0))
const STORE = 'btc_ledger_v1'
const PREV = 'btc_ledger_v1_prev'
const LEGACY = 'sk_state_v1'
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

// ── Records from the password-protected version ──────────────────────────
// They were AES-GCM sealed with a random key kept inside the old encrypted
// plan, so opening them needs the old password once (or the unlock key the
// old page remembered in IndexedDB when "Keep this device unlocked" was on).
const oldPlan = () => import('../lib/stackPayload').then((m) => m.STACK_PAYLOAD)
async function oldStateKey(key, P) {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(P.iv) }, key, fromB64(P.ct))
  const { stateKey } = JSON.parse(dec.decode(plain))
  if (!stateKey) throw new Error('No key in the old plan')
  return stateKey
}
async function oldKeyFromPassword(passphrase) {
  const P = await oldPlan()
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromB64(P.salt), iterations: P.iter || 200000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt'],
  )
  return oldStateKey(key, P)
}
async function openSealed(stateKey, box) {
  const key = await crypto.subtle.importKey('raw', fromB64(stateKey), 'AES-GCM', false, ['decrypt'])
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(box.iv) }, key, fromB64(box.ct))
  return JSON.parse(dec.decode(plain))
}
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
async function oldKeyRemembered() {
  const key = await Promise.race([vault('readonly', (s) => s.get('k')), new Promise((r) => setTimeout(() => r(null), 1500))])
  if (!key) return ''
  try { return await oldStateKey(key, await oldPlan()) } catch { return '' }
}
const forgetOldKey = () => vault('readwrite', (s) => s.delete('k'))
const hasOld = () => { try { return !!localStorage.getItem(LEGACY) } catch { return false } }

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
// The starting stack. The plan file can list it as on-chain lots, each costed
// at the price when it arrived; entering the actual total paid in Settings
// scales every lot's cost to match. Otherwise it is one lot from the starting
// units and amount.
function openingOf(data, d, o, v, openBase) {
  const sum = (xs, k) => xs.reduce((t, x) => t + x[k], 0)
  const chain = list(d.openLots).filter((x) => x && isIso(x.d) && num(x.u) > 0)
    .map((x) => ({ d: x.d, u: num(x.u), p: num(x.p), b: Math.max(0, num(x.b)), l: Math.max(0, num(x.l)), tx: typeof x.tx === 'string' ? x.tx : '' }))
    .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0))
  if (chain.length) {
    const est = sum(chain, 'l')
    const costSet = o.openLocal !== undefined && o.openLocal !== null && o.openLocal !== '' && Number.isFinite(Number(o.openLocal))
    const paid = costSet ? Math.max(0, Number(o.openLocal)) : est
    const k = est > 0 ? paid / est : 1
    const off = o.openOff === true || o.openUnits === 0
    return {
      onChain: true, costSet, openOff: off, openCount: chain.length, openUnits: sum(chain, 'u'), openLocal: paid, openLocalEst: est, openWhere: 'wallet',
      openLots: off ? [] : chain.map((x) => ({ ...x, b: x.b * k, l: x.l * k, src: costSet ? 'entered' : 'estimate' })),
    }
  }
  const u = Math.max(0, v('openUnits'))
  const l = Math.max(0, v('openLocal', openBase * num(data.meta?.seed?.fx, 1)))
  return {
    onChain: false, costSet: false, openOff: false, openCount: 0, openUnits: u, openLocal: l, openLocalEst: l,
    openWhere: (o.openWhere || d.openWhere) === 'wallet' ? 'wallet' : 'exchange',
    openLots: u > EPS ? [{ d: '', u, p: 0, b: openBase, l, tx: '', src: 'settings' }] : [],
  }
}

// Plan settings come from the plan file; anything saved in st.plan overrides.
function planOf(data, st) {
  const d = data.plan || {}
  const o = (st && st.plan) || {}
  const v = (k, dflt = 0) => {
    const x = o[k]
    return x !== undefined && x !== null && x !== '' && Number.isFinite(Number(x)) ? Number(x) : num(d[k], dflt)
  }
  const openBase = Math.max(0, v('openBase'))
  const open = openingOf(data, d, o, v, openBase)
  return {
    start: isYm(o.start) ? o.start : isYm(d.start) ? d.start : ymOf(localIso()),
    years: Math.max(1, Math.round(num(d.years, 10))),
    openBase, ...open, openCost: open.openLots.reduce((t, x) => t + x.b, 0),
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
function crossYear(a, target, max = 40) {
  const pts = simulate({ ...a, run: max })
  const y = pts.findIndex((q) => q.v >= target)
  return y < 0 ? null : y
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
// The starting stack from the plan settings is the first, oldest lot.
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

function book(entries, { tax, start, fyStart, opening }) {
  const sorted = entries.map((e, i) => ({ e, i })).sort((a, b) => (a.e.d < b.e.d ? -1 : a.e.d > b.e.d ? 1 : a.i - b.i)).map((o) => o.e)
  const lots = []
  const months = {}
  const fys = {}
  const sells = {}
  const problems = []
  const startIdx = ymIndex(start)
  const first = opening ? list(opening.lots).filter((x) => x && x.u > EPS) : []
  const open = first.length ? {
    u: first.reduce((t, x) => t + x.u, 0), b: first.reduce((t, x) => t + x.b, 0), l: first.reduce((t, x) => t + x.l, 0), where: opening.where, lots: first,
  } : null
  let units = open ? open.u : 0
  let cold = open && open.where === 'wallet' ? open.u : 0
  let reserve = 0
  let investB = open ? open.b : 0
  let investL = open ? open.l : 0
  let contrib = 0
  let since = 0
  for (const x of first) lots.push({ u: x.u, b: x.b, l: x.l })
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
        contrib += cb
        if (!pre) since += cb
      }
    } else if (e.k === 'res') {
      const rb = inBase(e, e.a)
      reserve += rb
      mo.res += rb
      contrib += rb
      if (!pre) since += rb
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
    units, cold, exch: Math.max(0, units - cold), reserve, investB, investL, basisB, basisL, contrib, since, months,
    open, putIn: (open ? open.b : 0) + contrib,
    fys: Object.values(fys).sort((a, b) => b.fy - a.fy), sells, problems, count: entries.length, has: entries.length > 0 || !!open,
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
    oldKey: typeof raw.oldKey === 'string' ? raw.oldKey : undefined,
  }
}

// Records brought over from the password-protected version join today's:
// entries and ticks are combined, and settings already made here win.
function mergeStates(cur, old) {
  const ids = new Set(cur.entries.map((e) => e.id))
  const some = (o) => o && Object.keys(o).length > 0
  return {
    ...old, ...cur,
    entries: [...old.entries.filter((e) => !ids.has(e.id)), ...cur.entries],
    ticks: { ...old.ticks, ...cur.ticks },
    plan: some(cur.plan) ? cur.plan : old.plan,
    proj: some(cur.proj) ? cur.proj : old.proj,
    cycle: cur.cycle || old.cycle,
    backupAt: Math.max(num(cur.backupAt), num(old.backupAt)) || undefined,
  }
}

function loadState() {
  let raw = null
  try { raw = localStorage.getItem(STORE) } catch {}
  if (!raw) return { st: blank(), orphan: false }
  try {
    return { st: normalise(JSON.parse(raw)), orphan: false }
  } catch {
    // Unreadable: keep it aside instead of overwriting it.
    try { localStorage.setItem(`${STORE}_orphan_${Date.now()}`, raw); localStorage.removeItem(STORE) } catch {}
    return { st: blank(), orphan: true }
  }
}

// Interface words. Defaults, overridable from the plan file's words.
const UI = {
  back: 'Back to site', backup: 'Backup', sections: 'Sections', opening: 'Opening…', dismiss: 'Dismiss', undo: 'Undo',
  saved: 'Saved on this device', saveError: 'Not saved — browser storage is full or blocked',
  delete: 'Delete', confirmDelete: 'Tap again to delete', edit: 'Edit', cancel: 'Cancel', save: 'Save entry', update: 'Save changes', open: 'Open',
  price: 'Price', highLine: 'High {p} on {d}', fxLine: '{r} per {b}', refresh: 'Refresh', refreshing: 'Refreshing…',
  src_live: 'Live · {t}', src_cached: 'Saved price · {t}', src_seed: 'Reference price · {t}', src_manual: 'Your price · {t}', feedFailed: 'Live price unavailable.',
  thisMonth: 'This month', monthOf: 'Month {k} of {K}', yearOf: 'year {y} of {Y}', startsOn: 'The plan starts in {m}.', planDone: 'The plan ran its course in {m}.',
  core: 'Buy', toReserve: 'Set aside', weekly: '{a} a week', firstMonthOn: '{m} · first month', loggedOf: '{a} of {b} logged', leftToGo: '{a} to go', monthDone: 'Done for this month ✓',
  logBuy: 'Log a buy', logReserve: 'Log cash set aside',
  reserve: 'Reserve', reserveCap: 'Full at {cap} (the excess goes straight in)', armed: 'Waiting', fired: 'Triggered', usedOn: 'Deployed {d}', markUsed: 'Mark deployed',
  unmark: 'Undo', levelAt: 'at {p}', deployPart: 'deploys {p} of what’s left', deployNow: 'Deploy about {a} from the reserve now.', reserveEmpty: 'Nothing set aside yet.',
  yourStack: 'Your stack', putIn: 'Put in', avgShort: 'Avg cost', plannedSoFar: 'plan: {a}', gainLoss: 'Gain / loss', toTarget: 'Of the target', ofTarget: 'of {a}',
  startsShort: 'Starts {m}', finished: 'Finished',
  youAreHere: 'Month {k} of {K}', high: 'High', day24: '24h', sparkLabel: 'Price over the past year, from {a} to {b} now; the high was {h}.',
  startStack: 'Starting stack',
  fromSettings: 'from Settings', editInSettings: 'Edit in Settings',
  startHint: 'Counted everywhere. If you log the original purchases in the ledger, set the starting stack to 0 in Settings.',
  received: 'Received', openChain: '{n} transactions · cost {a}', view: 'View', viewTx: 'View the transaction of {d}',
  ledgerCostNote: 'Each is costed at Bitcoin’s price when it arrived. If you know what you actually paid, enter it in Settings.',
  ledgerCostEntered: 'Costs are scaled to the total you entered in Settings.',
  openAmtHint: 'The stack’s value when the plan began; projections grow from here.',
  openLocalChainHint: 'Estimated from the price when each transaction arrived. Enter what you actually paid to use that instead.',
  countStart: 'Count the starting stack: {u} {c} from {n} transactions', countStartHint: 'Switch this off if you log those purchases in the ledger yourself.',
  openLocal: 'Starting stack cost', openLocalHint: 'What you paid for it in total, for tax records.', openWhere: 'Starting stack is held',
  valueNow: 'Value now', onExchange: 'On the exchange',
  cold: 'In your own wallet',
  never: 'never',
  due: 'Due now',
  dueBuy: 'Log this month’s contribution: {a} to go.', dueDeploy: 'A reserve trigger fired: deploy about {a}.', dueCold: 'Move {a} from the exchange to your own wallet.',
  dueBackup: 'Download a fresh backup; the last one is over 30 days old.', dueBackupFirst: 'Download your first backup.', dueReview: 'Do the yearly review for year {y}.',
  dueProblems: 'The ledger has {n} entry problem(s) to fix.',
  units: 'Units', kind: 'Type', date: 'Date', amount: 'Amount', fee: 'Fee', rate: 'Rate', venue: 'Where', note: 'Note',
  kind_buy: 'Buy', kind_sell: 'Sell', kind_out: 'To own wallet', kind_in: 'To exchange', kind_res: 'Cash set aside',
  amount_buy: 'Amount paid', amount_sell: 'Amount received', amount_res: 'Amount set aside', currency: 'Currency', fromReserve: 'Paid from the reserve',
  tds: 'Tax deducted at source', tdsHint: 'Usually {p} of the sale: about {a}.',
  netFee: 'Network fee (units)', netFeeHint: 'Taken from the amount moved.', venueHint: 'Exchange or wallet', notePh: 'Transaction ID, order number…',
  rateHint: 'Today’s rate. Change it for older entries.', unitPrice: 'Works out at {b} ({l}) per unit.',
  addEntry: 'Add an entry', editEntry: 'Edit entry', savedEntry: 'Saved.', ledger: 'Entries', showAll: 'Show all {n} months', showLess: 'Show recent months only',
  noEntries: 'Nothing logged yet.', monthTotal: '{a} put in', fromRes: 'reserve', sellGain: 'Gain {g} · est. tax {t}', sellLoss: 'Loss {g} (not deductible)',
  errDate: 'Pick a valid date.', errFuture: 'That date is in the future.', errUnits: 'Enter the units, more than zero.', errAmount: 'Enter the amount, more than zero.',
  errRes: 'Enter an amount (negative to take cash back out).', errRate: 'Enter the exchange rate, more than zero.', errFee: 'The network fee must be less than the amount moved.',
  prob_oversell: 'Sells more than was on the exchange that day', prob_overmove: 'Moves more than was held there that day', prob_reserve: 'Reserve buys add up to more than the cash set aside',
  problems: 'Problems',
  taxYears: 'Tax years', fy: 'FY {a}–{b}', sold: 'Sold', proceeds: 'Proceeds', costFifo: 'Cost (first in, first out)', gains: 'Taxable gains', estTax: 'Estimated tax',
  tdsPaid: 'Tax deducted', taxNote: 'Estimate at {t}; losses aren’t set off. Set your surcharge band in Plan → Settings.',
  csv: 'Download CSV',
  backupTitle: 'Backup and export', backupHint: 'Entries live only in this browser; a backup restores them anywhere.',
  lastBackupOn: 'Last backup: {d}', restore: 'Restore from a backup file', restored: 'Restored the backup from {d}.', undone: 'Restore undone.',
  restoreBad: 'That file isn’t a backup from this page.', restoreWrongKey: 'That backup couldn’t be opened.',
  backupDone: 'Backup downloaded. Keep it somewhere safe.', undoFail: 'Nothing to undo.',
  orphan: 'Saved records on this device couldn’t be read, so they were set aside untouched. Restore a backup file to continue.',
  numbers: 'Your numbers', openAmt: 'Starting amount', monthly: 'Monthly amount', step: 'Step-up', every: 'Every (months)', cap: 'Monthly ceiling', capHint: 'Blank for none',
  years: 'Years', targetAmt: 'Target', resetNumbers: 'Back to the plan’s numbers',
  scale: 'Scale', linear: 'Linear', log: 'Log', paidIn: 'Put in', chartTitle: 'Projected value by year', chartKeys: 'Use the arrow keys to read the values year by year.',
  asTable: 'Show the numbers', now: 'Now', year: 'Year', scenario: 'Scenario', endValue: 'Value at the end', afterTax: 'After tax',
  never2: 'Not within {n} years', alone: 'Contributions alone get there',
  outOfReach: 'Out of reach',
  schedule: 'Year by year', months: 'Months', perMonth: 'Monthly', yearTotal: 'In that year', soFar: 'Put in so far',
  zone: 'Zone', distance: 'Below the high', levelToday: 'Price level', split: 'Monthly split', action: 'Reserve', buyAll: 'All in',
  forYear: 'For plan year {y}',
  settings: 'Settings', planSettings: 'Plan numbers', startMonth: 'First month', openUnits: 'Units held at the start', threshold: 'Move to own wallet above',
  reserveMonths: 'Reserve full at (months of contributions)', surcharge: 'Surcharge band', taxNow: 'tax on gains {t}', defaults: 'Back to the plan’s defaults', feed: 'Live price', feedOn: 'Fetch the live price',
  manualPrice: 'Your price', manualRate: 'Your exchange rate', manualHint: 'Used when the live price is off or unavailable.',
  wallet: 'Cold storage wallet', walletLive: 'Live', walletLoading: 'Loading…', walletOffline: 'Offline', walletStale: 'Last known',
  walletDown: 'Couldn’t reach the blockchain just now. It tries again every few minutes.',
  walletTxs: '{n} transactions', copyAddress: 'Copy the address {a}', copy: 'Copy', copied: 'Copied ✓', qrLabel: 'QR code for the wallet address',
  walletDiffers: 'The chain shows {c}; the ledger has {l} in your own wallet ({d}). Log any moves to match.',
  onChain: 'On-chain right now: {u} {c} in cold storage.', onChainOk: 'Matches the blockchain',
  migrateTitle: 'Bring over your earlier records', oldPassword: 'Old page password', migrateBtn: 'Bring them over', migrateLater: 'Not now',
  migrateLead: 'Entries saved while this page was password-protected are still encrypted on this device. Enter that old password once to move them here.',
  migrateWrong: "That password didn't open them. Try again.", migrateBroken: "They couldn't be opened here. Try again in a current browser.",
  migrated: 'Brought over {n} earlier entries.',
  restoreOld: 'That backup is from the password-protected version. Bring your earlier records over first, then restore it.',
  nextStep: 'Next step-up: {a} a month from {m}.', onExchangeNow: 'Also {u} {c} on the exchange.',
  planTitle: 'The plan', glanceMonthly: 'Monthly', stepEvery: '+{p} every {n} months', putInBy: 'Put in by {m}', overYears: 'over {n} years',
  needFor: 'Growth needed for {t}', aYear: 'a year', costOf: 'cost {a}', byYear: 'In {y}', needLine: 'a year gets you to {t} by {y}.',
  growth: 'Growth', reaches: 'Reaches {t}', growNote: 'Scenarios, not forecasts. After tax takes {t} of the gain, and “Reaches” assumes nothing new goes in after {y}.',
  settingsHint: 'Plan numbers, tax band and live price',
  pulse: 'Market today', updatedAt: 'Updated {t}', cryptoMarket: 'Crypto market', in24h: '{c} in 24h', btcShare: 'Bitcoin’s share', ofAllCrypto: 'of all crypto',
  upToday: 'Up in 24h', nOfM: '{a} of {b}', inTop: 'coins in the top 250', btcBeat: 'Bitcoin beat', ofCoins: '{p} of coins', btcIn24h: 'Bitcoin {c} in 24h',
  moves: 'Biggest moves', movesHint: 'Top 250 coins with real trading. Stablecoins and tokenized assets are left out.', period: 'Period', goingUp: 'Up', goingDown: 'Down',
  noneUp: 'Nothing is up over this period.', noneDown: 'Nothing is down over this period.',
  attention: 'Getting attention', attentionHint: 'Most searched on CoinGecko in the last 24 hours.',
  busiest: 'Busiest trading', busiestHint: 'Traded the most in 24 hours for their size.', traded: '{a} traded',
  whoBuys: 'Who’s buying Bitcoin', holderKind: 'Holders', companies: 'Companies', governments: 'Governments', buyingSince: 'Added the most since {d}:',
  noBuyers: 'No one in the top 30 has added any since then.', holdersLater: 'The biggest holders today. Check back in a day or two to see who’s adding.',
  holder: 'Holder', ofSupply: 'Of all Bitcoin', addedSince: 'Since {d}', newHolder: 'New', holdersTotal: '{k} hold {u} BTC, {p} of all Bitcoin.',
  costVs: 'Your average cost is {a}; {n}’s is {b}.', loadingMarket: 'Loading…', marketFailed: 'Couldn’t load this right now. Try Refresh in a minute.',
  trackerOff: 'Live prices are off in Settings, so the tracker is paused.', trackerNote: 'For watching only. The plan stays Bitcoin only.',
}
const Words = createContext(UI)
const useW = () => useContext(Words)
const Ctx = createContext(null)
const useT = () => useContext(Ctx)

// **bold**, `code` and [label](https://…) — all the formatting the plan file needs.
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

// A small mark drawn from the plan file (meta.mark: { viewBox, paths }).
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

// ── Content blocks from the plan file ────────────────────────────────────
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
    <section className="sk-card" id={b.id ? `sk-check-${b.id}` : undefined}>
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
    case 'list':
      return (
        <section className="sk-card">
          <Head b={b} />
          <ul className="sk-list">
            {list(b.items).map((it, i) => (
              <li key={i} data-tone={it.tone}>{it.tag && <span className="sk-tag">{it.tag}</span>}<span><Inline text={it.text} /></span></li>
            ))}
          </ul>
        </section>
      )
    case 'checklist':
      return <Checklist b={b} />
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
  const areaId = svgId(useId())
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
          <defs>
            <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: 'rgba(247,147,26,.26)' }} /><stop offset="1" style={{ stopColor: 'rgba(247,147,26,0)' }} />
            </linearGradient>
          </defs>
          {series.filter((s) => s.fill).map((s) => <path key={`a-${s.id}`} d={`${path(s.values)}L${x(n - 1).toFixed(1)},${H - padB}L${x(0).toFixed(1)},${H - padB}Z`} fill={`url(#${areaId})`} />)}
          {series.map((s) => (
            <path key={s.id} d={path(s.values)} className={s.dash ? 'sk-line' : 'sk-line sk-draw'} data-tone={s.tone} pathLength={s.dash ? undefined : 1} strokeDasharray={s.dash ? '5 5' : undefined} />
          ))}
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

// ── Price ────────────────────────────────────────────────────────────────
// Fetches the plan's public price feed; refreshes while the tab is visible. Nothing about the plan or the visitor is sent.
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
        setQ({
          status: 'live', price, high: num(pick(a, feed.high)), highAt: String(pick(a, feed.highAt) || '').slice(0, 10), local, fx: local > 0 ? local / price : 0,
          change: feed.change ? num(pick(a, feed.change), NaN) : NaN, at: Date.now(),
        })
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
// else the plan's reference. The high is the best one known.
function quoteOf(live, st, seed = {}) {
  const has = num(live.price) > 0
  const manual = st.manual
  const cached = st.quote
  let q
  if (has && live.status !== 'error') q = { src: 'live', price: live.price, local: live.local, fx: live.fx, at: live.at, change: live.change }
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
    if (list(review.items).some((it) => !st.ticks[`${review.id}:${y}:${it.id}`])) out.push({ id: 'review', text: fill(w.dueReview, { y }), view: 'plan', opts: { section: 'review' } })
  }
  if (bk.count && (!st.backupAt || Date.now() - st.backupAt > 30 * DAY_MS)) {
    out.push({ id: 'backup', text: st.backupAt ? w.dueBackup : w.dueBackupFirst, view: 'log', opts: { section: 'backup' } })
  }
  return out
}

// ── Visual pieces ───────────────────────────────────────────────────────
const reduced = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const svgId = (id) => id.replace(/[^a-zA-Z0-9_-]/g, '')

// Big numbers count up to their value (straight to it when motion is reduced).
function useCountUp(value, ms = 900) {
  const [shown, setShown] = useState(() => (reduced() ? value : 0))
  const from = useRef(reduced() ? value : 0)
  useEffect(() => {
    const start = from.current
    from.current = value
    if (!Number.isFinite(value) || reduced() || Math.abs(value - start) < 1e-12) { setShown(value); return undefined }
    let raf = 0
    const t0 = performance.now()
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / ms)
      setShown(start + (value - start) * (1 - Math.pow(1 - k, 3)))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return shown
}

// Dec start → Nov end: phases, halvings and where today sits.
function Journey() {
  const { data, p, today } = useT()
  const w = useW()
  const K = p.years * 12
  const k = monthIndex(p, today)
  const pos = clamp((k + (Number(today.slice(8, 10)) - 1) / 30) / K, 0, 1)
  const at = (iso) => (ymIndex(ymOf(iso)) - ymIndex(p.start) + (Number(iso.slice(8, 10)) - 1) / 30) / K
  const phases = list(data.phases).map((ph, i) => ({
    ...ph, i, a: ((ph.from - 1) * 12) / K, b: (ph.to * 12) / K,
    y0: ymAdd(p.start, (ph.from - 1) * 12).slice(0, 4), y1: ymAdd(p.start, ph.to * 12 - 1).slice(0, 4),
  }))
  const events = list(data.plan.events).filter((e) => isIso(e.d)).map((e) => ({ ...e, x: at(e.d) })).filter((e) => e.x > 0 && e.x < 1)
  const align = (x) => (x < 0.12 ? 'start' : x > 0.88 ? 'end' : 'mid')
  const nowLabel = k < 0 ? fill(w.startsShort, { m: fmtYm(p.start) }) : k >= K ? w.finished : fill(w.youAreHere, { k: k + 1, K })
  const aria = [nowLabel, ...phases.map((ph) => `${ph.name} ${ph.y0}–${ph.y1}`), ...events.map((e) => `${e.short || e.label} ${e.d.slice(0, 4)}`)].join('. ')
  return (
    <div className="sk-journey" role="img" aria-label={aria}>
      <div className="sk-journey-track" aria-hidden="true">
        {phases.map((ph) => <span key={ph.id} className="sk-journey-seg" data-phase={ph.i} style={{ left: `${ph.a * 100}%`, width: `${(ph.b - ph.a) * 100}%` }} />)}
        <span className="sk-journey-fill" style={{ width: `${pos * 100}%` }} />
        {events.map((e) => <i key={e.d} className="sk-journey-event" style={{ left: `${e.x * 100}%` }} />)}
        <span className="sk-journey-now" data-align={align(pos)} style={{ left: `${pos * 100}%` }}><em>{nowLabel}</em></span>
      </div>
      <div className="sk-journey-events" aria-hidden="true">
        {events.map((e) => <span key={e.d} data-align={align(e.x)} style={{ left: `${e.x * 100}%` }}>{e.short || e.label} {e.d.slice(0, 4)}</span>)}
      </div>
      <div className="sk-journey-phases" aria-hidden="true">
        {phases.map((ph) => (
          <span key={ph.id} data-phase={ph.i} style={{ left: `${ph.a * 100}%`, width: `${(ph.b - ph.a) * 100}%` }}><b>{ph.name}</b><small>{ph.y0}–{ph.y1}</small></span>
        ))}
      </div>
    </div>
  )
}

// The past year of prices with the high and the buying-rule levels.
function useHistory(feed, enabled) {
  const [h, setH] = useState([])
  useEffect(() => {
    if (!enabled || !feed?.historyUrl) { setH([]); return undefined }
    let alive = true
    const ctl = new AbortController()
    const t = setTimeout(() => ctl.abort(), 15000)
    fetch(feed.historyUrl, { signal: ctl.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((j) => {
        const pts = list(pick(j, feed.history)).map((q) => [num(q?.[0]), num(q?.[1])]).filter(([a, b]) => a > 0 && b > 0)
        if (alive) setH(pts)
      })
      .catch(() => { if (alive) setH([]) })
      .finally(() => clearTimeout(t))
    return () => { alive = false; ctl.abort(); clearTimeout(t) }
  }, [enabled, feed])
  return h
}

function PriceSpark({ points, price, high, levels, fmt, label }) {
  const w = useW()
  const box = useRef(null)
  const W = useWidth(box, 300)
  const gid = svgId(useId())
  const H = 136
  const padT = 16
  const padB = 20
  const PW = Math.max(140, W - 54)
  const pts = points.slice()
  if (price > 0) pts.push([Math.max(Date.now(), pts[pts.length - 1][0] + 1), price])
  const vals = pts.map((q) => q[1])
  const lo = Math.min(...vals, ...levels.map((l) => l.v)) * 0.95
  const hi = Math.max(...vals, high) * 1.04
  const t0 = pts[0][0]
  const t1 = pts[pts.length - 1][0]
  const x = (tt) => ((tt - t0) / (t1 - t0 || 1)) * (PW - 8)
  const y = (v) => padT + (1 - (v - lo) / (hi - lo || 1)) * (H - padT - padB)
  const line = pts.map((q, i) => `${i ? 'L' : 'M'}${x(q[0]).toFixed(1)},${y(q[1]).toFixed(1)}`).join('')
  const area = `${line}L${x(t1).toFixed(1)},${H - padB}L0,${H - padB}Z`
  const last = pts[pts.length - 1]
  const month = (tt) => new Date(tt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
  return (
    <div className="sk-spark" ref={box}>
      <svg width={W} height={H} role="img" aria-label={label}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'rgba(247,147,26,.42)' }} /><stop offset="1" style={{ stopColor: 'rgba(247,147,26,0)' }} />
          </linearGradient>
        </defs>
        <line x1={0} x2={PW} y1={y(high)} y2={y(high)} className="sk-spark-high" />
        <text x={2} y={y(high) - 5} className="sk-spark-label is-high">{w.high} {fmt(high, true)}</text>
        {levels.map((l) => (
          <g key={l.k}>
            <line x1={0} x2={PW} y1={y(l.v)} y2={y(l.v)} className="sk-spark-level" />
            <text x={PW + 8} y={y(l.v) - 2} className="sk-spark-label is-level"><tspan>{l.k}</tspan><tspan x={PW + 8} dy="11" className="is-price">{fmt(l.v, true)}</tspan></text>
          </g>
        ))}
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} className="sk-spark-line" pathLength="1" />
        <circle cx={x(last[0])} cy={y(last[1])} r={9} className="sk-spark-pulse" />
        <circle cx={x(last[0])} cy={y(last[1])} r={4} className="sk-spark-now" />
        <text x={0} y={H - 5} className="sk-spark-axis">{month(t0)}</text>
        <text x={PW - 4} y={H - 5} textAnchor="end" className="sk-spark-axis">{w.now}</text>
      </svg>
    </div>
  )
}

const NAV_ICONS = {
  today: 'M4 8h16M5 5h14v15H5zM9 3v4M15 3v4M8.5 12.5h3v3h-3z',
  plan: 'M3.5 6.5l5.5-2 6 2 5.5-2v13l-5.5 2-6-2-5.5 2zM9 4.5v13M15 6.5v13',
  grow: 'M4 19.5h16M6 15.5l4-5 3.5 3 5.5-7.5M15 6h4v4',
  log: 'M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01',
  coins: 'M3 12h4l3-8 4 16 3-8h4',
}

// ── This month ───────────────────────────────────────────────────────────
const monthIndex = (p, today) => ymIndex(ymOf(today)) - ymIndex(p.start)
// What should have gone in by month k: whatever went in before the plan began
// (the starting stack and any earlier buys), plus the plan's contributions.
const before = (bk) => bk.putIn - bk.since
const plannedTo = (p, k, bk) => before(bk) + (k > 0 ? plannedThrough(p, Math.min(k, p.years * 12) - 1) : 0) + (k >= 0 && k < p.years * 12 ? monthlyAt(p, k) : 0)

function StackStrip() {
  const { data, p, bk, qt, today, wallet, B, L, base } = useT()
  const w = useW()
  const unit = data.meta.unit || {}
  const k = monthIndex(p, today)
  const value = bk.units * qt.price
  const gain = value - bk.basisB
  const units = useCountUp(bk.units)
  const shown = useCountUp(value)
  const chain = Number.isFinite(wallet.units)
  const chainOk = chain && Math.abs(wallet.units - bk.cold) < 5e-9
  return (
    <section className="sk-stackstrip" aria-label={w.yourStack}>
      <div className="sk-stack-top">
        <p className="sk-kicker">{w.yourStack}</p>
        {chainOk && <span className="sk-chain-ok"><i aria-hidden="true">✓</i>{w.onChainOk}</span>}
      </div>
      <p className="sk-stack-units"><b>{qty(units, unit.dp ?? 8)}</b><span>{unit.code}</span></p>
      <dl className="sk-stack-metrics">
        <div><dt>{w.valueNow}</dt><dd>{B(shown)}<small>{L(bk.units * qt.local)}</small></dd></div>
        <div><dt>{w.putIn}</dt><dd>{B(bk.putIn)}<small>{fill(w.plannedSoFar, { a: B(plannedTo(p, k, bk)) })}</small></dd></div>
        <div><dt>{w.avgShort}</dt><dd>{bk.units > EPS ? B(bk.basisB / bk.units) : '—'}<small>{bk.units > EPS ? L(bk.basisL / bk.units) : ''}</small></dd></div>
        <div><dt>{w.gainLoss}</dt><dd className={gain >= 0 ? 'is-up' : 'is-down'}>{signed(gain, base)}<small>{bk.basisB > 0 ? `${gain < 0 ? '−' : '+'}${pct(Math.abs(gain) / bk.basisB)}` : '—'}</small></dd></div>
        <div><dt>{w.toTarget}</dt><dd>{pct(p.target > 0 ? value / p.target : 0, 2)}<small>{fill(w.ofTarget, { a: B(p.target, { compact: true }) })}</small></dd></div>
      </dl>
      {chain && !chainOk && <p className="sk-stack-note">{fill(w.onChain, { u: qty(wallet.units, 8), c: unit.code || '' })}</p>}
    </section>
  )
}

function PriceCard() {
  const { data, qt, zone, refresh, live, feedOn, hist, B, L } = useT()
  const w = useW()
  const unit = data.meta.unit || {}
  const ladder = list(data.plan.ladder)
  const row = ladder[zone] || {}
  const t = qt.at ? new Date(qt.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
  const busy = live.status === 'loading' || live.status === 'refreshing'
  const levels = ladder.slice(1).map((r) => ({ k: `−${pct(num(r.from), 0)}`, v: qt.high * (1 - num(r.from)) }))
  const price = useCountUp(qt.price)
  const short = (v, axis) => money(v, data.meta.cur.base, { compact: !!axis, always: !!axis })
  return (
    <aside className="sk-price" aria-label={`${unit.code || ''} ${w.price}`}>
      <div className="sk-price-top">
        <p className="sk-kicker"><Mark mark={data.meta.mark} />{unit.code} · {w.price}</p>
        {Number.isFinite(qt.change) && (
          <span className={qt.change >= 0 ? 'sk-change is-up' : 'sk-change is-down'}>
            <span aria-hidden="true">{qt.change >= 0 ? '▲' : '▼'}</span> {pct(Math.abs(qt.change) / 100)} <small>{w.day24}</small>
          </span>
        )}
      </div>
      <p className="sk-price-big">{B(price)}</p>
      <p className="sk-price-local">{L(qt.local)}</p>
      {hist.length > 2 && (
        <PriceSpark points={hist} price={qt.price} high={qt.high} levels={levels} fmt={short}
          label={fill(w.sparkLabel, { a: B(hist[0][1]), b: B(qt.price), h: B(qt.high) })} />
      )}
      <div className="sk-price-zone">
        <span className="sk-zone-chip" data-zone={zone}>{row.label}</span>
        <span className="sk-price-dd"><b>−{pct(qt.dd)}</b> <small>{fill(w.highLine, { p: B(qt.high), d: fmtDate(qt.highAt) })}</small></span>
      </div>
      <p className="sk-price-meta">
        <span>{fill(w[`src_${qt.src}`], { t })}{qt.failed ? ` · ${w.feedFailed}` : ''}</span>
        {feedOn && <button type="button" className="sk-mini" onClick={refresh} disabled={busy}>{busy ? w.refreshing : w.refresh}</button>}
      </p>
    </aside>
  )
}

function MonthCard() {
  const { data, p, bk, qt, zone, today, go, due, B, L } = useT()
  const w = useW()
  const ym = ymOf(today)
  const k = monthIndex(p, today)
  const K = p.years * 12
  const ladder = list(data.plan.ladder)
  const row = ladder[zone] || {}
  if (k >= K) {
    return <section className="sk-card sk-month"><Head b={{ title: w.thisMonth }} /><p className="sk-lead">{fill(w.planDone, { m: fmtYm(ymAdd(p.start, K - 1), 'long') })}</p></section>
  }
  const target = monthlyAt(p, Math.max(0, k))
  const split = splitFor(p, ladder, zone, bk.reserve, target)
  const m = bk.months[ym] || {}
  const got = k >= 0 ? (m.core || 0) + (m.res || 0) : 0
  const done = k >= 0 && got >= target - 0.5
  const kicker = k < 0 ? fill(w.firstMonthOn, { m: fmtYm(p.start, 'long') }) : `${fmtYm(ym, 'long')} · ${fill(w.monthOf, { k: k + 1, K })}`
  const weekly = fill(w.weekly, { a: B((split.core * 12) / 52) })
  const nextAt = k < 0 ? p.every : (Math.floor(k / p.every) + 1) * p.every
  const next = nextAt < K && monthlyAt(p, nextAt) > target + 0.005 ? { a: B(monthlyAt(p, nextAt)), m: fmtYm(ymAdd(p.start, nextAt), 'long') } : null
  const todo = due.filter((d) => d.id !== 'buy')
  return (
    <section className="sk-card sk-month">
      <Head b={{ kicker, title: w.thisMonth }} extra={<span className="sk-zone-chip" data-zone={zone}>{row.label}</span>} />
      <p className="sk-month-target"><b>{B(target)}</b><small>≈ {L(target * qt.fx)}{split.res > 0 ? '' : ` · ${weekly}`}</small></p>
      {k >= 0 && (
        <div className="sk-month-progress">
          <Bar value={got} max={target} tone={done ? 'good' : undefined} label={w.thisMonth} />
          <p className="sk-progress-line">{done ? w.monthDone : `${fill(w.loggedOf, { a: B(got), b: B(target) })} · ${fill(w.leftToGo, { a: B(target - got) })}`}</p>
        </div>
      )}
      {split.res > 0 && (
        <dl className="sk-month-split">
          <div><dt><i className="is-core" aria-hidden="true" />{w.core}</dt><dd>{B(split.core)} <small>{weekly}</small></dd></div>
          <div><dt><i className="is-res" aria-hidden="true" />{w.toReserve}</dt><dd>{B(split.res)}</dd></div>
        </dl>
      )}
      {row.note && <p className="sk-zone-note" data-zone={zone}><Inline text={row.note} /></p>}
      {todo.length > 0 && (
        <ul className="sk-due">
          {todo.map((d) => <li key={d.id} data-kind={d.id}><span>{d.text}</span><button type="button" className="sk-mini" onClick={() => go(d.view, d.opts)}>{w.open}</button></li>)}
        </ul>
      )}
      <div className="sk-actions">
        <button type="button" className="sk-primary" onClick={() => go('log', { add: 'buy' })}>{w.logBuy}</button>
        {split.res > 0 && <button type="button" className="sk-secondary" onClick={() => go('log', { add: 'res' })}>{w.logReserve}</button>}
      </div>
      {next && <p className="sk-note">{fill(w.nextStep, next)}</p>}
    </section>
  )
}

function ReserveCard() {
  const { data, p, bk, qt, zone, st, update, today, B } = useT()
  const w = useW()
  const ladder = list(data.plan.ladder)
  const used = st.cycle?.used || {}
  const monthly = monthlyAt(p, clamp(monthIndex(p, today), 0, p.years * 12 - 1))
  const cap = p.capMonths * monthly
  const dep = deployPlan(ladder, zone, bk.reserve, used)
  if (bk.reserve <= 0.5 && dep.total < 1 && splitFor(p, ladder, zone, bk.reserve, monthly).res <= 0) return null
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
      <Bar value={Math.max(0, bk.reserve)} max={cap || 1} tone="gold" label={fill(w.reserveCap, { cap: B(cap) })} />
      <p className="sk-sub">{bk.reserve > 0.5 ? fill(w.reserveCap, { cap: B(cap) }) : w.reserveEmpty}</p>
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

function TodayView() {
  return (
    <div className="sk-grid">
      <MonthCard />
      <WalletCard />
      <ReserveCard />
    </div>
  )
}

// ── Plan blocks that work from the live numbers ─────────────────────────
const planArgs = (p) => ({ open: p.openBase, monthly: p.monthly, step: p.step, every: p.every, cap: p.cap, years: p.years })

function ScheduleTable({ b }) {
  const { p, bk, today, B } = useT()
  const w = useW()
  const k = monthIndex(p, today)
  const cur = k >= 0 && k < p.years * 12 ? Math.floor(k / 12) + 1 : 0
  let cum = before(bk)
  const rows = []
  for (let y = 1; y <= p.years; y++) {
    const ms = Array.from({ length: 12 }, (_, i) => monthlyAt(p, (y - 1) * 12 + i))
    const total = ms.reduce((s, v) => s + v, 0)
    cum += total
    rows.push({ y, from: ymAdd(p.start, (y - 1) * 12), to: ymAdd(p.start, y * 12 - 1), lo: ms[0], hi: ms[11], total, cum })
  }
  return (
    <section className="sk-card">
      <Head b={{ kicker: b.kicker, title: b.title || w.schedule, intro: b.intro }} />
      <TableWrap label={b.title || w.schedule}>
        <table className="sk-table is-num">
          <thead>
            <tr><th scope="col">{w.year}</th><th scope="col">{w.months}</th><th scope="col">{w.perMonth}</th><th scope="col">{w.yearTotal}</th><th scope="col">{w.soFar}</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.y} className={r.y === cur ? 'is-now' : undefined} aria-current={r.y === cur ? 'true' : undefined}>
                <th scope="row">{r.y}</th>
                <td>{fmtYm(r.from)} – {fmtYm(r.to)}</td>
                <td>{Math.abs(r.hi - r.lo) < 0.5 ? B(r.lo) : `${B(r.lo)} → ${B(r.hi)}`}</td>
                <td>{B(r.total)}</td>
                <td>{B(r.cum)}</td>
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

// ── Projections ──────────────────────────────────────────────────────────
const endYear = (p, y) => String(Number(ymAdd(p.start, y * 12 - 1).slice(0, 4)))

function GrowView() {
  const { data, st, update, p, B, base } = useT()
  const w = useW()
  const scen = list(data.plan.scenarios)
  const pr = st.proj || {}
  const val = (k, d) => (pr[k] !== undefined && pr[k] !== null && Number.isFinite(Number(pr[k])) ? Number(pr[k]) : d)
  const a = {
    open: Math.max(0, val('open', p.openBase)), monthly: Math.max(0, val('monthly', p.monthly)), step: val('step', p.step),
    every: clamp(Math.round(val('every', p.every)), 1, 120), cap: p.cap, years: clamp(Math.round(val('years', p.years)), 1, 40), extra: 0,
  }
  const target = p.target
  const set = (k) => (v) => update((s) => {
    const proj = { ...(s.proj || {}) }
    if (v === null || v === undefined || (typeof v === 'number' && !Number.isFinite(v))) delete proj[k]
    else proj[k] = v
    return { ...s, proj }
  })
  const runs = scen.map((s) => ({ id: s.id, label: s.label, tone: s.tone, main: !!s.main, rate: num(s.rate), pts: simulate({ ...a, rate: num(s.rate) }) }))
  const paid = simulate({ ...a, rate: 0 }).map((q) => q.paid)
  const labels = Array.from({ length: a.years + 1 }, (_, y) => (y === 0 ? w.now : endYear(p, y)))
  const fmt = (v, axis) => money(v, base, { compact: !!axis, always: !!axis })
  const series = [...runs.map((r) => ({ id: r.id, label: r.label, tone: r.tone, fill: r.main, values: r.pts.map((q) => q.v) })), { id: 'paid', label: w.paidIn, tone: 'paid', dash: true, values: paid }]
  const need = rateNeeded(a, target)
  const goal = B(target, { compact: true })
  const changed = ['open', 'monthly', 'step', 'every', 'years'].some((k) => pr[k] !== undefined && pr[k] !== null)
  return (
    <div className="sk-stack">
      <section className="sk-card">
        <Head b={{ title: w.numbers }} extra={changed ? (
          <button type="button" className="sk-mini" onClick={() => update((s) => ({ ...s, proj: { log: s.proj?.log } }))}>{w.resetNumbers}</button>
        ) : null} />
        <div className="sk-form-grid">
          <NumField label={w.openAmt} value={a.open} onCommit={set('open')} prefix={base.sym} min={0} />
          <NumField label={w.monthly} value={a.monthly} onCommit={set('monthly')} prefix={base.sym} min={0} />
          <NumField label={w.step} value={a.step} onCommit={set('step')} suffix="%" scale={100} min={-50} max={200} />
          <NumField label={w.every} value={a.every} onCommit={set('every')} min={1} max={120} />
          <NumField label={w.years} value={a.years} onCommit={set('years')} min={1} max={40} />
        </div>
      </section>

      <section className="sk-card">
        <Head b={{ title: w.chartTitle }} extra={<Seg label={w.scale} value={pr.log ? 'log' : 'lin'} onChange={(v) => set('log')(v === 'log' ? 1 : null)}
          options={[{ id: 'lin', label: w.linear }, { id: 'log', label: w.log }]} />} />
        <ul className="sk-legend">{series.map((s) => <li key={s.id} data-tone={s.tone}><i aria-hidden="true" />{s.label}</li>)}{target > 0 && <li data-tone="target"><i aria-hidden="true" />{w.targetAmt} {goal}</li>}</ul>
        <LineChart series={series} labels={labels} target={target} targetLabel={goal} fmt={fmt} title={w.chartTitle} log={!!pr.log} />
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
        <Head b={{ title: fill(w.byYear, { y: endYear(p, a.years) }) }} />
        <p className="sk-need">
          {Number.isFinite(need) && need > 0
            ? <><b>{pct(need)}</b> {fill(w.needLine, { t: goal, y: endYear(p, a.years) })}</>
            : <b>{Number.isNaN(need) ? w.outOfReach : w.alone}</b>}
        </p>
        <TableWrap label={fill(w.byYear, { y: endYear(p, a.years) })}>
          <table className="sk-table is-num">
            <thead><tr><th scope="col">{w.scenario}</th><th scope="col">{w.growth}</th><th scope="col">{w.endValue}</th><th scope="col">{w.afterTax}</th><th scope="col">{fill(w.reaches, { t: goal })}</th></tr></thead>
            <tbody>
              {runs.map((r) => {
                const end = r.pts[a.years]
                const cross = target > 0 ? crossYear({ ...a, rate: r.rate }, target, 40) : null
                return (
                  <tr key={r.id}>
                    <th scope="row"><span className="sk-swatch" data-tone={r.tone} aria-hidden="true" />{r.label}</th>
                    <td>{pct(r.rate)}</td>
                    <td>{B(end.v)}</td>
                    <td>{B(end.v - Math.max(0, end.v - end.paid) * p.tax)}</td>
                    <td>{cross === null ? fill(w.never2, { n: 40 }) : endYear(p, cross)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </TableWrap>
        <p className="sk-note">{fill(w.growNote, { t: pct(p.tax), y: endYear(p, a.years) })}</p>
      </section>
    </div>
  )
}

// The plan in four numbers, under the 13-year timeline.
function GlanceCard({ b }) {
  const { data, p, bk, B } = useT()
  const w = useW()
  const unit = data.meta.unit || {}
  const K = p.years * 12
  const need = rateNeeded(planArgs(p), p.target)
  return (
    <section className="sk-card">
      <Head b={{ kicker: b.kicker, title: b.title || w.planTitle, intro: b.intro }} />
      <Journey />
      <dl className="sk-glance">
        <div><dt>{w.glanceMonthly}</dt><dd>{B(monthlyAt(p, 0))} → {B(monthlyAt(p, K - 1))}<small>{fill(w.stepEvery, { p: pct(p.step, 0), n: p.every })}</small></dd></div>
        <div><dt>{fill(w.putInBy, { m: fmtYm(ymAdd(p.start, K - 1)) })}</dt><dd>{B(before(bk) + plannedThrough(p, K - 1))}<small>{fill(w.overYears, { n: p.years })}</small></dd></div>
        <div><dt>{fill(w.needFor, { t: B(p.target, { compact: true }) })}</dt><dd>{Number.isNaN(need) ? w.outOfReach : need === 0 ? w.alone : pct(need)}<small>{Number.isFinite(need) && need > 0 ? w.aYear : ''}</small></dd></div>
        <div><dt>{w.startStack}</dt><dd>{bk.open ? `${qty(bk.open.u, 4)} ${unit.code || ''}` : '—'}<small>{bk.open ? fill(w.costOf, { a: B(bk.open.b) }) : ''}</small></dd></div>
      </dl>
    </section>
  )
}

const LIVE_BLOCKS = { schedule: ScheduleTable, ladder: LadderTable, glance: GlanceCard }

// ── Coin tracker ─────────────────────────────────────────────────────────
// Live market data from the public feeds in meta.market, fetched only while
// the tab is open and kept in this browser for a few minutes between visits.
const MARKET_KEY = 'btc_market_v1'
const HOLDERS_KEY = 'btc_holders_v1'
const pause = (ms) => new Promise((r) => setTimeout(r, ms))
const readJson = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch { return null } }
const writeJson = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
const https = (u) => (typeof u === 'string' && /^https:\/\//.test(u) ? u : '')
async function getJson(url) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), 15000)
  try {
    const r = await fetch(url, { signal: ctl.signal, cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return await r.json()
  } finally { clearTimeout(t) }
}
function holdersOf(j, key) {
  const rows = list(j?.[key]).filter((c) => c && c.name && num(c.total_holdings) > 0)
    .map((c) => ({ n: String(c.name), c: String(c.country || ''), h: num(c.total_holdings), e: num(c.total_entry_value_usd), pct: num(c.percentage_of_total_supply, NaN) }))
  return { total: num(j?.total_holdings), dom: num(j?.market_cap_dominance, NaN), list: rows.sort((a, b) => b.h - a.h).slice(0, 30) }
}
// Only the fields the tab shows, so the saved copy stays small.
const MARKET_PARTS = {
  markets: (j) => list(j).filter((c) => c && c.id).map((c) => ({
    id: String(c.id), s: String(c.symbol || '').toUpperCase(), n: String(c.name || c.id), img: https(c.image), p: num(c.current_price, NaN), mc: num(c.market_cap), r: num(c.market_cap_rank), v: num(c.total_volume),
    h1: num(c.price_change_percentage_1h_in_currency, NaN), d1: num(c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h, NaN), w1: num(c.price_change_percentage_7d_in_currency, NaN),
  })),
  trending: (j) => list(j?.coins).map((x) => x?.item).filter((c) => c && c.id).map((c) => ({
    id: String(c.id), s: String(c.symbol || '').toUpperCase(), n: String(c.name || c.id), img: https(c.small || c.thumb), r: num(c.market_cap_rank), p: num(c.data?.price, NaN),
    d1: num(c.data?.price_change_percentage_24h?.usd, NaN), spark: https(c.data?.sparkline),
  })),
  global: (j) => ({ mc: num(j?.data?.total_market_cap?.usd), ch: num(j?.data?.market_cap_change_percentage_24h_usd, NaN), btc: num(j?.data?.market_cap_percentage?.btc, NaN) }),
  companies: (j) => holdersOf(j, 'companies'),
  governments: (j) => holdersOf(j, 'governments'),
}
function useMarket(cfg, enabled) {
  const [m, setM] = useState(() => readJson(MARKET_KEY))
  const [busy, setBusy] = useState(false)
  const running = useRef(false)
  const alive = useRef(true)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const load = useCallback(async () => {
    if (!enabled || !cfg || running.current) return
    running.current = true
    setBusy(true)
    const prev = readJson(MARKET_KEY) || {}
    const data = { ...(prev.data || {}) }
    const failed = []
    const keys = Object.keys(MARKET_PARTS).filter((k) => cfg[k])
    for (const [i, k] of keys.entries()) {
      if (i) await pause(600)
      if (!alive.current) break
      try { data[k] = MARKET_PARTS[k](await getJson(cfg[k])) } catch { failed.push(k) }
    }
    const next = { at: failed.length < keys.length ? Date.now() : num(prev.at), data, failed }
    writeJson(MARKET_KEY, next)
    running.current = false
    if (alive.current) { setM(next); setBusy(false) }
  }, [cfg, enabled])
  useEffect(() => {
    if (!enabled || !cfg) return undefined
    const every = Math.max(60, num(cfg.every, 300)) * 1000
    if (!(Date.now() - num(readJson(MARKET_KEY)?.at) < every)) load()
    const id = setInterval(() => { if (document.visibilityState === 'visible') load() }, every)
    return () => clearInterval(id)
  }, [enabled, cfg, load])
  return [m, busy, load]
}

// Coins worth comparing: enough trading, and not stablecoins or tokenized
// stocks, gold or funds, which only follow what they track.
const NOT_COINS = /tokeni[sz]ed|\bgold\b|\bstocks?\b|\bfund\b|\bvault\b|treasur|t-?bill|\bcredit\b|\bclo\b|wrapped|bridged|\bstaked\b|restaked/i
function marketCoins(rows, cfg) {
  const minVol = num(cfg?.minVolume, 5e6)
  return list(rows).filter((c) => c.mc > 0 && c.v >= minVol && Number.isFinite(c.p)
    && !(Math.abs(c.p - 1) < 0.05 && Math.abs(num(c.d1)) < 2) && !(/usd|eur/i.test(c.s) && c.p > 0.8 && c.p < 1.3)
    && !NOT_COINS.test(c.n) && !/^pc\d+$/i.test(c.s))
}
// The oldest snapshot of each holders list from the past month, for "added since".
function useHolderBases(m, today) {
  const [bases, setBases] = useState({})
  useEffect(() => {
    const store = readJson(HOLDERS_KEY) || {}
    const next = { ...store }
    const out = {}
    for (const kind of ['companies', 'governments']) {
      const rows = list(m?.data?.[kind]?.list)
      const hist = list(store[kind]).filter((x) => x && isIso(x.d) && x.h && typeof x.h === 'object' && x.d <= today && (utc(today) - utc(x.d)) / DAY_MS <= 31)
      out[kind] = hist.find((x) => x.d < today) || null
      if (rows.length && !hist.some((x) => x.d === today)) hist.push({ d: today, h: Object.fromEntries(rows.map((r) => [r.n, r.h])) })
      next[kind] = hist.slice(-32)
    }
    writeJson(HOLDERS_KEY, next)
    setBases(out)
  }, [m, today])
  return bases
}

const usdShort = (n) => (n > 0 ? nf('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: n >= 1e12 ? 2 : 1 }).format(n) : '—')
function coinPrice(p) {
  if (!Number.isFinite(p)) return '—'
  const o = p >= 1000 ? { maximumFractionDigits: 0 } : p >= 1 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumSignificantDigits: 4 }
  return nf('en-US', { style: 'currency', currency: 'USD', ...o }).format(p)
}
const signPct = (x) => (Number.isFinite(x) ? `${x >= 0 ? '+' : '−'}${pct(Math.abs(x) / 100)}` : '—')
const Chg = ({ v }) => <span className={`sk-chg ${v >= 0 ? 'is-up' : 'is-down'}`}>{signPct(v)}</span>

function CoinRow({ c, rank, change, spark, extra }) {
  const { data } = useT()
  const url = data.meta.market?.coinUrl
  const href = url ? fill(url, { id: encodeURIComponent(c.id) }) : ''
  return (
    <li className={c.id === 'bitcoin' ? 'sk-coin is-btc' : 'sk-coin'}>
      {rank !== undefined && <span className="sk-coin-rank">{rank}</span>}
      {c.img ? <img className="sk-coin-ico" src={c.img} alt="" width="22" height="22" loading="lazy" decoding="async" referrerPolicy="no-referrer" /> : <span className="sk-coin-ico" aria-hidden="true" />}
      <span className="sk-coin-name">
        {href ? <a href={href} target="_blank" rel="noopener noreferrer">{c.n}</a> : <b>{c.n}</b>}
        <small>{c.s}{c.r ? ` · #${c.r}` : ''}</small>
      </span>
      {spark ? <img className="sk-coin-spark" src={spark} alt="" width="64" height="22" loading="lazy" decoding="async" referrerPolicy="no-referrer" /> : null}
      <span className="sk-coin-price">{coinPrice(c.p)}</span>
      {extra ?? <Chg v={change} />}
    </li>
  )
}
function MarketEmpty({ m, busy, part }) {
  const w = useW()
  return <p className="sk-sub">{busy && !m?.data?.[part] ? w.loadingMarket : w.marketFailed}</p>
}

function PulseCard({ m, busy, load, coins }) {
  const w = useW()
  const g = m?.data?.global
  const btc = list(m?.data?.markets).find((c) => c.id === 'bitcoin')
  const up = coins.filter((c) => c.d1 > 0).length
  const others = coins.filter((c) => c.id !== 'bitcoin' && Number.isFinite(c.d1))
  const beat = btc && others.length ? others.filter((c) => c.d1 < btc.d1).length / others.length : NaN
  const at = num(m?.at)
  const t = at ? new Date(at).toLocaleString('en-GB', localIso(new Date(at)) === localIso() ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <section className="sk-card">
      <Head b={{ title: w.pulse }} extra={(
        <span className="sk-pulse-meta">
          {t && <span>{fill(w.updatedAt, { t })}</span>}
          <button type="button" className="sk-mini" onClick={load} disabled={busy}>{busy ? w.refreshing : w.refresh}</button>
        </span>
      )} />
      <dl className="sk-glance">
        <div><dt>{w.cryptoMarket}</dt><dd>{usdShort(num(g?.mc))}<small>{Number.isFinite(g?.ch) ? fill(w.in24h, { c: signPct(g.ch) }) : ''}</small></dd></div>
        <div><dt>{w.btcShare}</dt><dd>{Number.isFinite(g?.btc) ? pct(g.btc / 100) : '—'}<small>{w.ofAllCrypto}</small></dd></div>
        <div><dt>{w.upToday}</dt><dd>{coins.length ? fill(w.nOfM, { a: up, b: coins.length }) : '—'}<small>{w.inTop}</small></dd></div>
        <div><dt>{w.btcBeat}</dt><dd>{Number.isFinite(beat) ? fill(w.ofCoins, { p: pct(beat, 0) }) : '—'}<small>{btc ? fill(w.btcIn24h, { c: signPct(btc.d1) }) : ''}</small></dd></div>
      </dl>
    </section>
  )
}

const PERIODS = [{ id: 'h1', label: '1h' }, { id: 'd1', label: '24h' }, { id: 'w1', label: '7d' }]
function MovesCard({ m, busy, coins }) {
  const w = useW()
  const [per, setPer] = useState('d1')
  const sorted = coins.filter((c) => Number.isFinite(c[per])).sort((a, b) => b[per] - a[per])
  const up = sorted.filter((c) => c[per] > 0).slice(0, 5)
  const down = sorted.filter((c) => c[per] < 0).slice(-5).reverse()
  const side = (rows, label, tone, none) => (
    <div>
      <h3 className={tone}>{label}</h3>
      {rows.length ? <ul className="sk-coins">{rows.map((c) => <CoinRow key={c.id} c={c} change={c[per]} />)}</ul> : <p className="sk-sub">{none}</p>}
    </div>
  )
  return (
    <section className="sk-card">
      <Head b={{ title: w.moves, intro: w.movesHint }} extra={<Seg label={w.period} value={per} onChange={setPer} options={PERIODS} />} />
      {sorted.length ? <div className="sk-moves">{side(up, w.goingUp, 'is-up', w.noneUp)}{side(down, w.goingDown, 'is-down', w.noneDown)}</div> : <MarketEmpty m={m} busy={busy} part="markets" />}
    </section>
  )
}

function AttentionCard({ m, busy }) {
  const w = useW()
  const rows = list(m?.data?.trending).slice(0, 10)
  return (
    <section className="sk-card">
      <Head b={{ title: w.attention, intro: w.attentionHint }} />
      {rows.length ? <ol className="sk-coins">{rows.map((c, i) => <CoinRow key={c.id} c={c} rank={i + 1} change={c.d1} spark={c.spark} />)}</ol> : <MarketEmpty m={m} busy={busy} part="trending" />}
    </section>
  )
}

function BusyCard({ m, busy, coins }) {
  const w = useW()
  const rows = coins.map((c) => ({ ...c, turn: c.v / c.mc })).sort((a, b) => b.turn - a.turn).slice(0, 6)
  return (
    <section className="sk-card">
      <Head b={{ title: w.busiest, intro: w.busiestHint }} />
      {rows.length ? (
        <ul className="sk-coins">
          {rows.map((c) => <CoinRow key={c.id} c={c} extra={<span className="sk-coin-turn"><b>{pct(c.turn, 0)}</b><small>{fill(w.traded, { a: usdShort(c.v) })}</small></span>} />)}
        </ul>
      ) : <MarketEmpty m={m} busy={busy} part="markets" />}
    </section>
  )
}

function HoldersCard({ m, busy, bases }) {
  const { bk, B } = useT()
  const w = useW()
  const [kind, setKind] = useState('companies')
  const part = m?.data?.[kind]
  const all = list(part?.list)
  const rows = all.slice(0, 10)
  const base = bases[kind]
  const added = (r) => (base && Number.isFinite(base.h?.[r.n]) ? r.h - base.h[r.n] : NaN)
  const buyers = base ? all.map((r) => ({ ...r, d: added(r) })).filter((r) => r.d >= 0.5).sort((a, b) => b.d - a.d).slice(0, 3) : []
  const lead = kind === 'companies' ? all.find((r) => r.e > 0) : null
  return (
    <section className="sk-card">
      <Head b={{ title: w.whoBuys }} extra={<Seg label={w.holderKind} value={kind} onChange={setKind} options={[{ id: 'companies', label: w.companies }, { id: 'governments', label: w.governments }]} />} />
      {base ? (
        <p className="sk-buying">
          <span>{fill(w.buyingSince, { d: fmtDate(base.d) })}</span>
          {buyers.length ? buyers.map((r) => <b key={r.n}>{r.n} <em className="is-up">+{qty(r.d, 0)}</em></b>) : <i>{w.noBuyers}</i>}
        </p>
      ) : rows.length > 0 && <p className="sk-sub">{w.holdersLater}</p>}
      {rows.length ? (
        <>
          <TableWrap label={w.whoBuys}>
            <table className="sk-table is-num sk-holders">
              <thead><tr><th scope="col">{w.holder}</th><th scope="col">{w.units}</th><th scope="col" className="sk-hide-sm">{w.ofSupply}</th>{kind === 'companies' && <th scope="col">{w.avgShort}</th>}{base && <th scope="col">{fill(w.addedSince, { d: fmtDate(base.d, { year: undefined }) })}</th>}</tr></thead>
              <tbody>
                {rows.map((r) => {
                  const d = added(r)
                  return (
                    <tr key={r.n}>
                      <th scope="row">{r.n}{r.c && <small>{r.c}</small>}</th>
                      <td>{qty(r.h, 0)}</td>
                      <td className="sk-hide-sm">{Number.isFinite(r.pct) ? pct(r.pct / 100, 2) : '—'}</td>
                      {kind === 'companies' && <td>{r.e > 0 ? B(r.e / r.h) : '—'}</td>}
                      {base && <td>{Number.isFinite(d) ? (Math.abs(d) >= 0.5 ? <span className={d > 0 ? 'is-up' : 'is-down'}>{d > 0 ? '+' : '−'}{qty(Math.abs(d), 0)}</span> : '0') : w.newHolder}</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </TableWrap>
          <p className="sk-note">
            {fill(w.holdersTotal, { k: kind === 'companies' ? w.companies : w.governments, u: qty(part.total, 0), p: Number.isFinite(part.dom) ? pct(part.dom / 100) : '—' })}
            {lead && bk.units > EPS ? ` ${fill(w.costVs, { a: B(bk.basisB / bk.units), n: lead.n, b: B(lead.e / lead.h) })}` : ''}
          </p>
        </>
      ) : <MarketEmpty m={m} busy={busy} part={kind} />}
    </section>
  )
}

function TrackerView() {
  const { data, st, today, go } = useT()
  const w = useW()
  const cfg = data.meta.market
  const on = !!cfg && !st.feedOff
  const [m, busy, load] = useMarket(cfg, on)
  const coins = useMemo(() => marketCoins(m?.data?.markets, cfg), [m, cfg])
  const bases = useHolderBases(m, today)
  if (!cfg) return null
  if (!on) {
    return (
      <div className="sk-stack">
        <section className="sk-card">
          <Head b={{ title: w.pulse }} />
          <p className="sk-sub">{w.trackerOff}</p>
          <div className="sk-actions"><button type="button" className="sk-mini" onClick={() => go('plan', { section: 'settings' })}>{w.editInSettings}</button></div>
        </section>
      </div>
    )
  }
  return (
    <div className="sk-stack">
      <PulseCard m={m} busy={busy} load={load} coins={coins} />
      <MovesCard m={m} busy={busy} coins={coins} />
      <div className="sk-grid">
        <AttentionCard m={m} busy={busy} />
        <BusyCard m={m} busy={busy} coins={coins} />
      </div>
      <HoldersCard m={m} busy={busy} bases={bases} />
      <p className="sk-note sk-tracker-note">{w.trackerNote}</p>
    </div>
  )
}

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
  const o = bk.open
  const why = {
    estimate: 'cost estimated at the price in the hour it arrived',
    entered: 'cost scaled to the total entered in Settings',
    settings: 'starting stack from plan settings; log the original purchases for tax records',
  }
  const first = o ? o.lots.map((x) => [
    x.d, 'opening', x.u, cur.base.code, x.b.toFixed(2), '', x.b > 0 ? (x.l / x.b).toFixed(4) : '', x.b.toFixed(2), x.l.toFixed(2),
    (x.b / x.u).toFixed(2), (x.l / x.u).toFixed(2), '', '', '', o.where,
    csvCell(x.tx ? `on-chain transaction ${x.tx}; ${why[x.src]}` : why.settings, true), '', '', '', '',
  ].map((v, i) => (i === 15 ? v : csvCell(v))).join(',')) : []
  return [head.join(','), ...first, ...rows].join('\r\n')
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
  const { data, st, p, bk, go, backup, restore, B, L } = useT()
  const w = useW()
  const [editing, setEditing] = useState(null)
  const [all, setAll] = useState(false)
  const [saved, setSaved] = useState(false)
  const formRef = useRef(null)
  const fileRef = useRef(null)
  const preset = useMemo(() => (focus?.add ? { add: focus.add, reserve: !!focus.reserve, focus: true, t: nonce } : null), [focus, nonce])
  useEffect(() => {
    const el = focus?.add ? formRef.current : focus?.section === 'backup' ? document.getElementById('sk-backup') : null
    if (el) requestAnimationFrame(() => el.scrollIntoView({ behavior: smooth(), block: 'start' }))
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
  const unit = data.meta.unit || {}
  const fyLabel = (y) => fill(w.fy, { a: y, b: String((y + 1) % 100).padStart(2, '0') })
  const toSettings = () => go('plan', { section: 'settings' })
  return (
    <div className="sk-stack">
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
        {bk.open && p.onChain && (
          <details className="sk-open-group">
            <summary><span>{w.startStack}</span><small>{fill(w.openChain, { n: bk.open.lots.length, a: B(bk.open.b) })}</small></summary>
            <ul className="sk-entries">
              {[...bk.open.lots].reverse().map((x) => (
                <li key={x.tx || x.d} className="sk-entry" data-kind="open">
                  <span className="sk-entry-kind">{w.received}</span>
                  <span className="sk-entry-main">
                    <b>+{qty(x.u, unit.dp ?? 8)} {unit.code}</b>
                    <small>{fmtDate(x.d)} · {B(x.b)} · {L(x.l)} · @ {B(p.costSet || !x.p ? x.b / x.u : x.p)}</small>
                  </span>
                  <span className="sk-entry-actions">
                    {x.tx && data.meta.wallet?.txUrl && (
                      <a className="sk-mini" href={fill(data.meta.wallet.txUrl, { t: x.tx })} target="_blank" rel="noopener noreferrer"
                        aria-label={fill(w.viewTx, { d: fmtDate(x.d) })}>{w.view} ↗</a>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <div className="sk-open-foot">
              <p className="sk-note">{p.costSet ? w.ledgerCostEntered : <Inline text={w.ledgerCostNote} />}</p>
              <button type="button" className="sk-mini" onClick={toSettings}>{w.editInSettings}</button>
            </div>
          </details>
        )}
        {bk.open && !p.onChain && (
          <div className="sk-month-group">
            <h3>{w.startStack}<small>{w.fromSettings}</small></h3>
            <ul className="sk-entries">
              <li className="sk-entry" data-kind="open">
                <span className="sk-entry-kind">{w.startStack}</span>
                <span className="sk-entry-main">
                  <b>+{qty(bk.open.u, unit.dp ?? 8)} {unit.code}</b>
                  <small>{B(bk.open.b)} · {L(bk.open.l)} · {bk.open.where === 'wallet' ? w.cold : w.onExchange}</small>
                  <small className="sk-entry-note">{w.startHint}</small>
                </span>
                <span className="sk-entry-actions"><button type="button" className="sk-mini" onClick={toSettings}>{w.editInSettings}</button></span>
              </li>
            </ul>
          </div>
        )}
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
          <p className="sk-note">{fill(w.taxNote, { t: pct(p.tax) })}</p>
        </section>
      )}

      <section className="sk-card" id="sk-backup">
        <Head b={{ title: w.backupTitle }} />
        <p className="sk-sub">{w.backupHint} {fill(w.lastBackupOn, { d: st.backupAt ? new Date(st.backupAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : w.never })}</p>
        <div className="sk-actions">
          <button type="button" className="sk-primary" onClick={backup}>{w.backup}</button>
          <button type="button" className="sk-secondary" onClick={() => fileRef.current?.click()}>{w.restore}</button>
          <button type="button" className="sk-secondary" disabled={!bk.has}
            onClick={() => download(`${data.meta.csv || 'ledger'}-${localIso()}.csv`, `\ufeff${toCsv(st.entries, bk, data)}`, 'text/csv;charset=utf-8')}>{w.csv}</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) restore(f) }} />
        </div>
      </section>
    </div>
  )
}

// ── Plan and settings ────────────────────────────────────────────────────
function Settings({ focus, nonce }) {
  const { data, st, update, p, qt, base } = useT()
  const w = useW()
  const startId = useId()
  const [open, setOpen] = useState(focus?.section === 'settings')
  useEffect(() => { if (focus?.section === 'settings') setOpen(true) }, [focus, nonce])
  const setPlan = (k) => (v) => update((s) => {
    const plan = { ...(s.plan || {}) }
    if (v === null || v === undefined || v === '') delete plan[k]
    else plan[k] = v
    return { ...s, plan }
  })
  return (
    <section className="sk-card" id="sk-settings">
      <details className="sk-disclose" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary><h2>{w.settings}</h2><small>{w.settingsHint}</small></summary>
        <div className="sk-disclose-body">
          <div className="sk-head">
            <h3>{w.planSettings}</h3>
            {Object.keys(st.plan || {}).length > 0 && <button type="button" className="sk-mini" onClick={() => update((s) => ({ ...s, plan: {} }))}>{w.defaults}</button>}
          </div>
          <div className="sk-form-grid">
            <div className="sk-field">
              <label className="sk-field-label" htmlFor={startId}>{w.startMonth}</label>
              <input id={startId} type="month" value={p.start} onChange={(e) => setPlan('start')(isYm(e.target.value) && e.target.value !== data.plan.start ? e.target.value : null)} />
            </div>
            <NumField label={w.openAmt} value={p.openBase} onCommit={setPlan('openBase')} prefix={base.sym} min={0} hint={p.onChain ? w.openAmtHint : undefined} />
            {p.onChain ? (
              <NumField label={w.openLocal} value={Math.round(p.openLocal)} prefix={data.meta.cur.local.sym} min={0} hint={w.openLocalChainHint}
                onCommit={(v) => setPlan('openLocal')(v === null || Math.abs(v - p.openLocalEst) < 0.5 ? null : v)} />
            ) : (
              <>
                <NumField label={w.openUnits} value={p.openUnits} onCommit={setPlan('openUnits')} min={0} />
                <NumField label={w.openLocal} value={Math.round(p.openLocal)} onCommit={setPlan('openLocal')} prefix={data.meta.cur.local.sym} min={0} hint={w.openLocalHint} />
                <div className="sk-field">
                  <span className="sk-field-label">{w.openWhere}</span>
                  <Seg label={w.openWhere} value={p.openWhere} onChange={(v) => setPlan('openWhere')(v === (data.plan.openWhere || 'exchange') ? null : v)}
                    options={[{ id: 'exchange', label: w.onExchange }, { id: 'wallet', label: w.cold }]} />
                </div>
              </>
            )}
            <NumField label={w.monthly} value={p.monthly} onCommit={setPlan('monthly')} prefix={base.sym} min={0} />
            <NumField label={w.step} value={p.step} onCommit={setPlan('step')} suffix="%" scale={100} min={-50} max={200} />
            <NumField label={w.every} value={p.every} onCommit={setPlan('every')} min={1} max={120} />
            <NumField label={w.cap} value={p.cap || ''} onCommit={setPlan('cap')} prefix={base.sym} min={0} placeholder={w.capHint} />
            <NumField label={w.targetAmt} value={p.target} onCommit={setPlan('target')} prefix={base.sym} min={0} />
            <NumField label={w.threshold} value={p.threshold} onCommit={setPlan('threshold')} prefix={base.sym} min={0} />
            <NumField label={w.reserveMonths} value={p.capMonths} onCommit={setPlan('capMonths')} min={0} max={60} />
          </div>
          {p.onChain && (
            <div className="sk-field">
              <Check on={!p.openOff} onChange={(on) => update((s) => {
                const plan = { ...(s.plan || {}) }
                delete plan.openUnits
                if (on) delete plan.openOff
                else plan.openOff = true
                return { ...s, plan }
              })}>{fill(w.countStart, { u: qty(p.openUnits, 8), c: data.meta.unit?.code || '', n: p.openCount })}</Check>
              <small className="sk-hint">{w.countStartHint}</small>
            </div>
          )}
          {list(data.plan.tax?.bands).length > 0 && (
            <div className="sk-field">
              <span className="sk-field-label">{w.surcharge} · {fill(w.taxNow, { t: pct(p.tax) })}</span>
              <Seg label={w.surcharge} className="is-wrap" value={p.surcharge} onChange={(v) => setPlan('surcharge')(v === num(data.plan.surcharge) ? null : v)}
                options={list(data.plan.tax.bands).map((b) => ({ id: num(b.v), label: b.label }))} />
            </div>
          )}
          <h3>{w.feed}</h3>
          <Check on={!st.feedOff} onChange={(on) => update((s) => ({ ...s, feedOff: !on }))}>{w.feedOn}</Check>
          <div className="sk-form-grid">
            <NumField label={w.manualPrice} value={st.manual?.price ?? ''} prefix={base.sym} min={0} hint={w.manualHint}
              onCommit={(v) => update((s) => ({ ...s, manual: v > 0 ? { price: v, fx: num(s.manual?.fx) || qt.fx, at: Date.now() } : null }))} />
            {st.manual && (
              <NumField label={`${w.manualRate} (${fill(w.fxLine, { r: data.meta.cur.local.sym, b: base.sym })})`} value={st.manual.fx} min={0}
                onCommit={(v) => update((s) => (s.manual ? { ...s, manual: { ...s.manual, fx: v > 0 ? v : qt.fx, at: Date.now() } } : s))} />
            )}
          </div>
        </div>
      </details>
    </section>
  )
}

function PlanView({ focus, nonce }) {
  const { data } = useT()
  useEffect(() => {
    const review = reviewOf(data)
    const id = focus?.section === 'settings' ? 'sk-settings' : focus?.section === 'review' && review ? `sk-check-${review.id}` : ''
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: smooth(), block: 'start' }))
  }, [focus, nonce, data])
  return <div className="sk-stack"><Blocks items={data.sections?.plan} /><Settings focus={focus} nonce={nonce} /></div>
}
// ── Shell ────────────────────────────────────────────────────────────────
const VIEWS = { today: TodayView, log: LedgerView, grow: GrowView, plan: PlanView, coins: TrackerView }

// Writes the newest state to this browser whenever it changes.
function useSaver(st) {
  const [status, setStatus] = useState('saved')
  const seen = useRef(null)
  useEffect(() => {
    if (!st) return
    if (seen.current === null) { seen.current = st; return }
    if (seen.current === st) return
    seen.current = st
    try { localStorage.setItem(STORE, JSON.stringify(st)); setStatus('saved') } catch { setStatus('error') }
  }, [st])
  return status
}

// The cold-storage wallet's balance, straight from the chain.
function useWallet(cfg) {
  const address = cfg?.address
  const [w, setW] = useState({ status: address ? 'loading' : 'off' })
  useEffect(() => {
    if (!address) { setW({ status: 'off' }); return undefined }
    let alive = true
    const load = async () => {
      try {
        const d = await fetchBtcWallet(address)
        if (alive) setW({ status: 'live', units: d.final_balance / 1e8, n: d.n_tx, at: Date.now() })
      } catch {
        if (alive) setW((p) => ({ ...p, status: Number.isFinite(p.units) ? 'stale' : 'error' }))
      }
    }
    load()
    const id = setInterval(() => { if (document.visibilityState === 'visible') load() }, 300000)
    return () => { alive = false; clearInterval(id) }
  }, [address])
  return w
}

function WalletCard() {
  const { data, wallet, bk, qt, B, L } = useT()
  const w = useW()
  const [copied, setCopied] = useState(false)
  const cfg = data.meta.wallet
  if (!cfg?.address) return null
  const a = cfg.address
  const units = wallet.units
  const known = Number.isFinite(units)
  const diff = known ? units - bk.cold : NaN
  const copy = async () => {
    try { await navigator.clipboard.writeText(a); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch {}
  }
  const loading = wallet.status === 'loading'
  const state = wallet.status === 'live' ? w.walletLive : loading ? w.walletLoading : wallet.status === 'stale' ? w.walletStale : w.walletOffline
  return (
    <section className="sk-card sk-wallet">
      <Head b={{ title: w.wallet }} extra={<span className={`sk-live is-${wallet.status}`}><i aria-hidden="true" />{state}</span>} />
      <div className="sk-wallet-body">
        <div className="sk-qr"><QRCodeSVG value={`bitcoin:${a}`} title={w.qrLabel} size={112} level="M" bgColor="#ffffff" fgColor="#0b0b0b" /></div>
        <div className="sk-wallet-main">
          <p className="sk-units"><b>{known ? qty(units, 8) : loading ? '…' : '—'}</b> {data.meta.unit?.code}</p>
          <p className="sk-sub">{known ? `${B(units * qt.price)} · ${L(units * qt.local)}` : loading ? w.walletLoading : w.walletDown}{wallet.n ? ` · ${fill(w.walletTxs, { n: wallet.n })}` : ''}</p>
          <button type="button" className="sk-address" onClick={copy} aria-label={fill(w.copyAddress, { a })}>
            <code>{a.slice(0, 12)}…{a.slice(-8)}</code><span>{copied ? w.copied : w.copy}</span>
          </button>
          <div className="sk-actions">
            {list(cfg.explorers).map((x) => <a key={x.label} className="sk-mini" href={fill(x.url, { a })} target="_blank" rel="noopener noreferrer">{x.label} ↗</a>)}
          </div>
        </div>
      </div>
      {known && Math.abs(diff) >= 5e-9 && (
        <p className="sk-reconcile is-off">{fill(w.walletDiffers, { c: qty(units, 8), l: qty(bk.cold, 8), d: `${diff > 0 ? '+' : '−'}${qty(Math.abs(diff), 8)}` })}</p>
      )}
      {bk.exch > EPS && <p className="sk-note">{fill(w.onExchangeNow, { u: qty(bk.exch, 8), c: data.meta.unit?.code || '' })}</p>}
    </section>
  )
}

// Asks once for the old password to bring over records saved while the page
// was password-protected.
function OldRecords({ onOpen, onLater }) {
  const w = useW()
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const id = useId()
  const submit = async (e) => {
    e.preventDefault()
    if (busy || !pass) return
    setBusy(true)
    setErr('')
    try {
      await onOpen(await oldKeyFromPassword(pass))
    } catch (reason) {
      setErr(reason?.name === 'OperationError' ? w.migrateWrong : w.migrateBroken)
      setBusy(false)
    }
  }
  return (
    <form className="sk-banner is-gold sk-migrate" onSubmit={submit} aria-describedby={`${id}-lead`}>
      <div className="sk-migrate-copy">
        <p className="sk-callout-title">{w.migrateTitle}</p>
        <p id={`${id}-lead`}>{w.migrateLead}</p>
      </div>
      <div className="sk-migrate-form">
        <label className="sk-sr" htmlFor={`${id}-p`}>{w.oldPassword}</label>
        <span className="sk-num">
          <input id={`${id}-p`} type="password" autoComplete="current-password" placeholder={w.oldPassword} value={pass}
            onChange={(e) => { setPass(e.target.value); setErr('') }} aria-invalid={!!err} aria-describedby={err ? `${id}-e` : undefined} readOnly={busy} />
        </span>
        <button type="submit" className="sk-primary" disabled={busy || !pass}>{busy ? w.opening : w.migrateBtn}</button>
        <button type="button" className="sk-mini" onClick={onLater}>{w.migrateLater}</button>
      </div>
      {err && <p className="sk-form-error" id={`${id}-e`} role="alert">{err}</p>}
    </form>
  )
}

function Tracker({ data, onBack }) {
  const words = useMemo(() => ({ ...UI, ...(data.words || {}) }), [data])
  const views = useMemo(() => list(data.views).filter((v) => VIEWS[v.id]), [data])
  const [boot] = useState(loadState)
  const [st, setSt] = useState(boot.st)
  const [orphan, setOrphan] = useState(boot.orphan)
  const [flash, setFlash] = useState(null)
  const [nav, setNav] = useState(() => ({ view: VIEWS[boot.st.view] ? boot.st.view : 'today', opts: null, t: 0 }))
  const [old, setOld] = useState(hasOld)
  const today = useToday()
  const stRef = useRef(st)
  const headingRef = useRef(null)
  const bandRef = useRef(null)
  stRef.current = st

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    if (!flash || flash.undo) return undefined
    const t = setTimeout(() => setFlash(null), 8000)
    return () => clearTimeout(t)
  }, [flash])

  const saving = useSaver(st)
  const update = useCallback((fn) => setSt((s) => (s ? { ...fn(s), changedAt: Date.now() } : s)), [])
  const feedOn = !!(st && !st.feedOff && data.meta.feed?.url)
  const [live, refresh] = useQuote(data.meta.feed, feedOn)
  const hist = useHistory(data.meta.feed, feedOn)
  const wallet = useWallet(data.meta.wallet)
  const planSaved = st?.plan
  const p = useMemo(() => (st ? planOf(data, st) : null), [data, planSaved]) // eslint-disable-line react-hooks/exhaustive-deps
  const entries = st?.entries
  const bk = useMemo(() => (entries && p ? book(entries, {
    tax: p.tax, start: p.start, fyStart: num(data.plan.tax?.fyStart, 4),
    opening: { lots: p.openLots, where: p.openWhere },
  }) : null), [entries, p, data])
  const qt = useMemo(() => (st ? quoteOf(live, st, data.meta.seed) : null), [live, st?.manual, st?.quote, st?.cycle, data]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keep a recent live price for opening offline, at most every 30 minutes.
  useEffect(() => {
    if (live.status !== 'live') return
    setSt((s) => {
      if (!s || (s.quote && live.at - num(s.quote.at) < 30 * 60000)) return s
      return { ...s, quote: { price: live.price, local: live.local, fx: live.fx, high: live.high, highAt: live.highAt, at: live.at } }
    })
  }, [live])
  // A new high starts a new cycle, which re-arms the reserve triggers.
  useEffect(() => {
    const h = num(live.high)
    if (live.status !== 'live' || !(h > 0)) return
    setSt((s) => (!s || (s.cycle && h <= num(s.cycle.high) + EPS) ? s : { ...s, cycle: { high: h, at: live.highAt || localIso(), used: {} } }))
  }, [live])

  // Records from the password-protected version join these; the original
  // stays aside on this device, untouched, as a fallback.
  const bringOver = useCallback(async (oldKey) => {
    const box = JSON.parse(localStorage.getItem(LEGACY) || 'null')
    if (!box || !box.iv || !box.ct) { setOld(false); return }
    const earlier = normalise(await openSealed(oldKey, box))
    setSt((s) => ({ ...mergeStates(s || blank(), earlier), oldKey, changedAt: Date.now() }))
    try { localStorage.setItem(`${LEGACY}_moved`, JSON.stringify(box)); localStorage.removeItem(LEGACY) } catch {}
    forgetOldKey()
    setOld(false)
    setFlash({ t: fill(words.migrated, { n: earlier.entries.length }) })
  }, [words])
  useEffect(() => {
    if (!old) return undefined
    let alive = true
    oldKeyRemembered().then((k) => { if (alive && k) bringOver(k).catch(() => {}) })
    return () => { alive = false }
  }, [old, bringOver])

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

  const backup = useCallback(() => {
    const cur = stRef.current
    if (!cur) return
    const at = Date.now()
    try {
      const { oldKey, ...state } = cur
      download(`${data.meta.csv || 'ledger'}-backup-${localIso()}.json`, JSON.stringify({ kind: 'ledger-backup', v: 2, at: new Date(at).toISOString(), state: { ...state, backupAt: at } }), 'application/json')
      setSt((s) => (s ? { ...s, backupAt: at } : s))
      setFlash({ t: words.backupDone })
    } catch {
      setFlash({ t: words.saveError, err: true })
    }
  }, [data, words])

  const restore = useCallback(async (file) => {
    try {
      const box = JSON.parse(await file.text())
      if (!box || box.kind !== 'ledger-backup') throw new Error('format')
      let next
      if (box.state && typeof box.state === 'object') next = normalise(box.state)
      else if (box.iv && box.ct) {
        // A backup from the password-protected version.
        const key = stRef.current?.oldKey
        if (!key) { setFlash({ t: words.restoreOld, err: true }); return }
        next = normalise(await openSealed(key, box))
      } else throw new Error('format')
      try { localStorage.setItem(PREV, JSON.stringify(stRef.current)) } catch {}
      setSt({ ...next, oldKey: stRef.current?.oldKey, changedAt: Date.now() })
      setOrphan(false)
      const when = Number.isNaN(Date.parse(box.at)) ? '' : new Date(box.at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
      setFlash({ t: fill(words.restored, { d: when }), undo: true })
    } catch (reason) {
      setFlash({ t: reason?.name === 'OperationError' ? words.restoreWrongKey : words.restoreBad, err: true })
    }
  }, [words])

  const undoRestore = useCallback(() => {
    try {
      const prev = normalise(JSON.parse(localStorage.getItem(PREV) || 'null'))
      setSt({ ...prev, changedAt: Date.now() })
      localStorage.removeItem(PREV)
      setFlash({ t: words.undone })
    } catch {
      setFlash({ t: words.undoFail, err: true })
    }
  }, [words])

  // Let any field mid-edit commit before leaving.
  const leave = (fn) => () => { document.activeElement?.blur?.(); setTimeout(fn, 80) }

  if (!st || !p || !bk || !qt) return <main className="sk-root"><style>{CSS}</style><p className="sk-opening" role="status">{words.opening}</p></main>

  const cur = data.meta.cur
  const B = (n, o) => money(n, cur.base, o)
  const L = (n, o) => money(n, cur.local, o)
  const zone = zoneOf(data.plan.ladder, qt.dd)
  const k = monthIndex(p, today)
  const K = p.years * 12
  const yearNow = clamp(Math.floor(Math.max(0, k) / 12) + 1, 1, p.years)
  const base = { data, st, update, p, bk, qt, zone, today, go, refresh, live, feedOn, hist, wallet, B, L, base: cur.base, local: cur.local, yearNow, backup, restore }
  const due = dueItems({ ...base, w: words })
  const ctx = { ...base, due }
  const phase = list(data.phases).find((ph) => yearNow >= ph.from && yearNow <= ph.to)
  const heroLine = k < 0 ? fill(words.startsOn, { m: fmtYm(p.start, 'long') })
    : k >= K ? fill(words.planDone, { m: fmtYm(ymAdd(p.start, K - 1), 'long') })
      : `${fill(words.monthOf, { k: k + 1, K })}, ${fill(words.yearOf, { y: yearNow, Y: p.years })}${phase ? ` · ${phase.name}` : ''}`
  const saveText = saving === 'error' ? words.saveError : words.saved
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
                <StackStrip />
              </div>
              <PriceCard />
            </div>
          </div>
          <nav className="sk-nav" aria-label={words.sections}>
            <div className="sk-wrap sk-nav-inner">
              {views.map((v) => (
                <button key={v.id} type="button" aria-current={nav.view === v.id ? 'page' : undefined} onClick={() => go(v.id)}>
                  {NAV_ICONS[v.id] && <svg className="sk-nav-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={NAV_ICONS[v.id]} /></svg>}
                  {v.label}
                  {v.id === 'today' && due.length > 0 && <span className="sk-nav-dot" aria-label={`${due.length} ${words.due}`}>{due.length}</span>}
                </button>
              ))}
            </div>
          </nav>
          <main className="sk-wrap sk-main">
            {old && <OldRecords onOpen={bringOver} onLater={() => setOld(false)} />}
            {orphan && (
              <div className="sk-banner is-warn">
                <p>{words.orphan}</p>
                <button type="button" className="sk-mini" onClick={() => go('log', { section: 'backup' })}>{words.restore}</button>
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
            <View key={nav.view} focus={nav.opts} nonce={nav.t} />
          </main>
          {data.meta.footer && <footer className="sk-footer"><Mark mark={data.meta.mark} /><p><Inline text={data.meta.footer} /></p></footer>}
        </div>
      </Ctx.Provider>
    </Words.Provider>
  )
}

export default function BitcoinPlan({ onBack }) {
  return <Tracker data={PLAN} onBack={onBack} />
}

const CSS = `
.sk-root {
  color-scheme: dark; position: relative; isolation: isolate;
  --sk-bg: #07080b; --sk-card: rgba(16,18,23,.84); --sk-solid: #111318; --sk-raised: rgba(255,255,255,.035); --sk-raised2: #181b21; --sk-hover: rgba(255,255,255,.06); --sk-field: #0b0d11;
  --sk-ink: #f2f3f5; --sk-ink2: #c7cbd2; --sk-ink3: #9ba2ac; --sk-line: rgba(255,255,255,.08); --sk-line2: rgba(255,255,255,.15);
  --sk-accent: #f7931a; --sk-accent2: #ffb35c; --sk-gold: #ffd27a; --sk-accent-ink: #1a1105; --sk-accent-soft: rgba(247,147,26,.12); --sk-accent-line: rgba(247,147,26,.42);
  --sk-green: #45d18f; --sk-green-soft: rgba(69,209,143,.13); --sk-red: #ff8a80; --sk-red-soft: rgba(255,138,128,.13);
  --sk-blue: #8abcff; --sk-violet: #b69cff; --sk-teal: #47d1c1; --sk-amber: #ffd27a; --sk-r: 20px;
  --sk-display: 'Sora', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --sk-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  --sk-shadow: inset 0 1px 0 rgba(255,255,255,.05), 0 24px 48px -32px rgba(0,0,0,.95);
  min-height: 100vh; background: var(--sk-bg); color: var(--sk-ink);
  font-family: var(--sk-display); font-size: 14.5px; line-height: 1.55; letter-spacing: -0.01em; -webkit-font-smoothing: antialiased; font-variant-numeric: tabular-nums;
}
.sk-root::before { content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none; background: radial-gradient(900px 480px at 85% -10%, rgba(247,147,26,.1), transparent 60%); }
body:has(.sk-root) { background: #07080b !important; background-image: none !important; }
.sk-root h1, .sk-root h2, .sk-root h3 { font-family: var(--sk-display); color: var(--sk-ink); letter-spacing: -0.025em; margin: 0; }
.sk-root p { margin: 0; }
:where(.sk-root) button { font: inherit; color: inherit; cursor: pointer; }
:where(.sk-root) button:disabled { cursor: default; opacity: .55; }
.sk-root :focus-visible { outline: 3px solid var(--sk-accent2); outline-offset: 2px; box-shadow: none; }
.sk-root a { color: var(--sk-accent2); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
.sk-root code { font-family: var(--sk-mono); font-size: .88em; background: var(--sk-raised2); padding: 1px 5px; border-radius: 5px; }
.sk-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; }
.sk-wrap { width: 100%; max-width: 1160px; margin: 0 auto; padding: 0 22px; box-sizing: border-box; }
.sk-root [data-tone="low"] { --tone: #8abcff; } .sk-root [data-tone="mid"] { --tone: #f7931a; } .sk-root [data-tone="high"] { --tone: #45d18f; }
.sk-root [data-tone="custom"] { --tone: #b69cff; } .sk-root [data-tone="paid"] { --tone: #9ba2ac; } .sk-root [data-tone="target"] { --tone: #ff8a80; }
.sk-kicker { display: flex; align-items: center; gap: 8px; color: var(--sk-accent2); font: 600 11.5px/1.3 var(--sk-mono); letter-spacing: .14em; text-transform: uppercase; }
.sk-kicker .sk-mark { width: 18px; height: 18px; flex: none; }

.sk-top { position: sticky; top: 0; z-index: 30; background: rgba(7,8,11,.74); -webkit-backdrop-filter: saturate(150%) blur(14px); backdrop-filter: saturate(150%) blur(14px); border-bottom: 1px solid var(--sk-line); }
.sk-top-inner { display: flex; align-items: center; gap: 12px; min-height: 56px; }
.sk-back { display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 6px 10px; border: 0; border-radius: 10px; background: transparent; color: var(--sk-ink2); font-weight: 600; }
.sk-back:hover { background: var(--sk-hover); color: var(--sk-ink); }
.sk-top-mark { display: inline-flex; align-items: center; gap: 8px; font-weight: 750; letter-spacing: -0.01em; }
.sk-top-mark .sk-mark { width: 20px; height: 20px; }
.sk-top-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.sk-save { display: inline-flex; align-items: center; gap: 7px; font: 500 11.5px var(--sk-mono); color: var(--sk-ink3); }
.sk-save-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--sk-green); }
.sk-save.is-saving .sk-save-dot { background: var(--sk-amber); }
.sk-save.is-error { color: var(--sk-red); }
.sk-save.is-error .sk-save-dot { background: var(--sk-red); }
.sk-ghost { min-height: 36px; padding: 6px 15px; border: 1px solid var(--sk-line2); border-radius: 999px; background: rgba(255,255,255,.02); font-weight: 650; font-size: 13.5px; }
.sk-ghost:hover { background: var(--sk-hover); border-color: var(--sk-accent-line); }

.sk-band { position: relative; border-bottom: 1px solid var(--sk-line); }
.sk-hero { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 32px; padding-top: 36px; padding-bottom: 34px; align-items: start; }
.sk-hero-copy > .sk-kicker { margin-bottom: 12px; }
.sk-root .sk-hero h1:focus-visible { outline: none; }
.sk-hero h1 { font-size: clamp(34px, 5vw, 58px); line-height: 1.02; font-weight: 800; letter-spacing: -0.04em; outline: none; text-wrap: balance; color: #fff; }
.sk-hero-line { margin-top: 12px !important; display: inline-flex; align-items: center; gap: 8px; padding: 5px 12px 5px 10px; border-radius: 999px; background: var(--sk-accent-soft); border: 1px solid var(--sk-accent-line); color: var(--sk-accent2); font: 600 12.5px var(--sk-mono); }
.sk-hero-line::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--sk-accent); animation: sk-blink 2.4s ease-in-out infinite; }
.sk-subtitle { margin-top: 14px !important; color: var(--sk-ink2); max-width: 640px; font-size: 15.5px; line-height: 1.65; }

.sk-stackstrip { margin-top: 22px; display: grid; gap: 4px; padding: 20px 24px; border-radius: var(--sk-r); border: 1px solid var(--sk-accent-line); background: var(--sk-solid); box-shadow: var(--sk-shadow); container-type: inline-size; }
.sk-stack-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.sk-stack-units { display: flex; align-items: baseline; gap: 10px; margin-top: 6px !important; }
.sk-stack-units b { font-size: clamp(32px, 4vw, 44px); line-height: 1; font-weight: 800; letter-spacing: -0.035em; }
.sk-stack-units span { font: 700 15px var(--sk-mono); color: var(--sk-accent2); }
.sk-stack-metrics, .sk-glance { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 18px; margin: 14px 0 0; padding-top: 14px; border-top: 1px solid var(--sk-line); }
.sk-stack-metrics > div:last-child:nth-child(odd) { grid-column: 1 / -1; }
.sk-stack-metrics dt, .sk-glance dt { font: 600 10.5px var(--sk-mono); letter-spacing: .12em; text-transform: uppercase; color: var(--sk-ink3); }
.sk-stack-metrics dd, .sk-glance dd { margin: 4px 0 0; font-weight: 750; font-size: 17px; letter-spacing: -0.02em; }
.sk-stack-metrics dd small, .sk-glance dd small { display: block; margin-top: 1px; font-weight: 500; font-size: 12px; color: var(--sk-ink3); letter-spacing: 0; }
@container (min-width: 420px) { .sk-stack-metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); } .sk-stack-metrics > div:last-child:nth-child(odd) { grid-column: auto; } }
@container (min-width: 600px) { .sk-stack-metrics { grid-template-columns: repeat(5, minmax(0, 1fr)); } }
.sk-glance { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 6px; }
.sk-stack-note { margin-top: 10px !important; font-size: 12.5px; color: var(--sk-ink3); }

.sk-journey { position: relative; display: grid; gap: 8px; padding-top: 30px; }
.sk-journey-track { position: relative; height: 12px; border-radius: 999px; background: rgba(255,255,255,.05); }
.sk-journey-seg { position: absolute; top: 0; bottom: 0; background: color-mix(in oklab, var(--ph) 20%, transparent); }
.sk-journey-seg[data-phase="0"] { border-radius: 999px 0 0 999px; }
.sk-journey-seg:last-of-type { border-radius: 0 999px 999px 0; }
.sk-root [data-phase="0"] { --ph: #f7931a; } .sk-root [data-phase="1"] { --ph: #ffd27a; } .sk-root [data-phase="2"] { --ph: #47d1c1; }
.sk-journey-fill { position: absolute; left: 0; top: 0; bottom: 0; min-width: 12px; border-radius: 999px; background: linear-gradient(90deg, #f7931a, #ffd27a); }
.sk-journey-event { position: absolute; top: 50%; width: 9px; height: 9px; background: #0b0c10; border: 2px solid var(--sk-gold); border-radius: 2px; transform: translate(-50%, -50%) rotate(45deg); }
.sk-journey-now { position: absolute; top: 50%; width: 20px; height: 20px; box-sizing: border-box; border-radius: 50%; background: #fff; border: 5px solid var(--sk-accent); transform: translate(-50%, -50%); box-shadow: 0 0 0 6px rgba(247,147,26,.2), 0 0 22px rgba(247,147,26,.7); }
.sk-journey-now em { position: absolute; bottom: calc(100% + 9px); left: 50%; transform: translateX(-50%); white-space: nowrap; font: 700 11px var(--sk-mono); font-style: normal; padding: 3px 9px; border-radius: 999px; background: var(--sk-accent); color: var(--sk-accent-ink); }
.sk-journey-now[data-align="start"] em { left: -8px; transform: none; }
.sk-journey-now[data-align="end"] em { left: auto; right: -8px; transform: none; }
.sk-journey-events { position: relative; height: 16px; }
.sk-journey-events span { position: absolute; top: 0; transform: translateX(-50%); white-space: nowrap; font: 600 10.5px var(--sk-mono); color: var(--sk-gold); }
.sk-journey-events span[data-align="start"] { transform: none; }
.sk-journey-events span[data-align="end"] { transform: translateX(-100%); }
.sk-journey-phases { position: relative; height: 38px; margin-top: 2px; }
.sk-journey-phases span { position: absolute; top: 0; display: grid; gap: 1px; padding-left: 9px; border-left: 2px solid var(--ph); box-sizing: border-box; overflow: hidden; }
.sk-journey-phases b { font-size: 13px; font-weight: 750; color: var(--ph); white-space: nowrap; }
.sk-journey-phases small { font: 500 10.5px var(--sk-mono); color: var(--sk-ink3); white-space: nowrap; }

.sk-price { position: relative; display: grid; gap: 12px; padding: 20px; border-radius: var(--sk-r); border: 1px solid var(--sk-line2); min-width: 0; background: var(--sk-solid); box-shadow: var(--sk-shadow); }
.sk-price-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.sk-price-big { font-size: 44px; line-height: 1; font-weight: 800; letter-spacing: -0.04em; }
.sk-price-local { color: var(--sk-ink2); font-weight: 650; font-size: 14px; }
.sk-price-local span { color: var(--sk-ink3); font-weight: 500; }
.sk-change { display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 999px; font: 700 11.5px var(--sk-mono); white-space: nowrap; }
.sk-change small { font-weight: 500; opacity: .8; }
.sk-change.is-up { background: var(--sk-green-soft); color: var(--sk-green); }
.sk-change.is-down { background: var(--sk-red-soft); color: var(--sk-red); }
.sk-spark { position: relative; width: 100%; min-width: 0; margin: 2px 0; }
.sk-spark svg { display: block; overflow: visible; }
.sk-spark-line { fill: none; stroke: var(--sk-accent); stroke-width: 2.2; stroke-linejoin: round; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; animation: sk-draw 1.6s cubic-bezier(.3,.7,.2,1) .2s forwards; }
.sk-spark-high { stroke: rgba(255,255,255,.4); stroke-dasharray: 2 4; }
.sk-spark-level { stroke: rgba(247,147,26,.4); stroke-dasharray: 3 5; }
.sk-spark-label { fill: var(--sk-ink3); font: 600 10px var(--sk-mono); }
.sk-spark-label.is-high { fill: var(--sk-ink2); }
.sk-spark-label.is-level { fill: var(--sk-accent2); font-weight: 700; }
.sk-spark-label .is-price { fill: var(--sk-ink3); font-weight: 500; }
.sk-spark-axis { fill: var(--sk-ink3); font: 500 10px var(--sk-mono); }
.sk-spark-now { fill: #fff; stroke: var(--sk-accent); stroke-width: 3; }
.sk-spark-pulse { fill: rgba(247,147,26,.4); transform-box: fill-box; transform-origin: center; animation: sk-pulse 2.2s ease-out infinite; }
.sk-root [data-zone="0"] { --zc: #8abcff; } .sk-root [data-zone="1"] { --zc: #ffd27a; } .sk-root [data-zone="2"] { --zc: #f7931a; } .sk-root [data-zone="3"] { --zc: #45d18f; }
.sk-price-zone { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.sk-price-dd b { font: 800 16px var(--sk-display); color: var(--sk-accent2); }
.sk-price-dd small { display: block; text-align: right; color: var(--sk-ink3); font-size: 11.5px; }
.sk-price-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; font: 500 11px var(--sk-mono); color: var(--sk-ink3); padding-top: 10px; border-top: 1px solid var(--sk-line); }
.sk-zone-chip { justify-self: start; display: inline-flex; align-items: center; gap: 7px; padding: 5px 11px; border-radius: 999px; font: 700 11.5px var(--sk-mono); color: var(--zc, var(--sk-accent2)); background: color-mix(in oklab, var(--zc, #f7931a) 14%, transparent); border: 1px solid color-mix(in oklab, var(--zc, #f7931a) 45%, transparent); white-space: nowrap; }
.sk-zone-chip::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--zc, var(--sk-accent)); }

.sk-nav { position: sticky; top: 57px; z-index: 20; background: rgba(7,8,11,.8); -webkit-backdrop-filter: saturate(150%) blur(14px); backdrop-filter: saturate(150%) blur(14px); border-bottom: 1px solid var(--sk-line); }
.sk-nav-inner { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding-top: 9px; padding-bottom: 9px; }
.sk-nav-inner::-webkit-scrollbar { display: none; }
.sk-nav button { flex: none; display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 15px; border: 1px solid transparent; border-radius: 999px; background: transparent; color: var(--sk-ink3); font-weight: 650; font-size: 14px; transition: color .15s, background .15s, border-color .15s; }
.sk-nav button:hover { color: var(--sk-ink); background: var(--sk-hover); }
.sk-nav button[aria-current="page"] { color: var(--sk-ink); background: linear-gradient(180deg, rgba(247,147,26,.24), rgba(247,147,26,.08)); border-color: var(--sk-accent-line); }
.sk-nav-ico { width: 17px; height: 17px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.sk-nav button[aria-current="page"] .sk-nav-ico { stroke: var(--sk-accent2); }
.sk-nav-dot { min-width: 19px; height: 19px; padding: 0 5px; border-radius: 999px; background: var(--sk-accent); color: var(--sk-accent-ink); font: 800 11px var(--sk-mono); display: inline-grid; place-items: center; box-sizing: border-box; }

.sk-main { padding-top: 26px; padding-bottom: 70px; }
.sk-stack { display: grid; gap: 18px; min-width: 0; }
.sk-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; align-items: start; }
.sk-main > .sk-grid > *, .sk-main > .sk-stack > * { animation: sk-rise .55s cubic-bezier(.2,.8,.2,1) both; }
.sk-main > * > :nth-child(2) { animation-delay: .05s; } .sk-main > * > :nth-child(3) { animation-delay: .1s; } .sk-main > * > :nth-child(4) { animation-delay: .15s; }
.sk-main > * > :nth-child(5) { animation-delay: .2s; } .sk-main > * > :nth-child(6) { animation-delay: .25s; } .sk-main > * > :nth-child(n+7) { animation-delay: .3s; }
.sk-card { position: relative; display: grid; gap: 14px; min-width: 0; padding: 22px; border-radius: var(--sk-r); border: 1px solid var(--sk-line);
  background: linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.012) 45%), var(--sk-card); box-shadow: var(--sk-shadow); }
.sk-card[id] { scroll-margin-top: 128px; }
.sk-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px 12px; flex-wrap: wrap; }
.sk-head-text { display: grid; gap: 6px; min-width: 0; }
.sk-head h2 { font-size: 19px; line-height: 1.3; font-weight: 750; outline: none; }
.sk-intro { color: var(--sk-ink2); }
.sk-sub { color: var(--sk-ink3); font-size: 14px; }
.sk-note { color: var(--sk-ink3); font-size: 13px; line-height: 1.55; }
.sk-open-foot { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin-top: 12px; }
.sk-open-foot .sk-note { flex: 1 1 260px; margin: 0; }
.sk-lead { color: var(--sk-ink2); font-size: 16px; }
.sk-prose { display: grid; gap: 9px; color: var(--sk-ink2); }
.sk-prose strong { color: var(--sk-ink); }
.sk-points { margin: 0; padding-left: 20px; display: grid; gap: 7px; color: var(--sk-ink2); }
.sk-points li::marker { color: var(--sk-accent); }
.sk-pill { display: inline-flex; align-items: center; min-height: 26px; padding: 2px 10px; border-radius: 999px; background: var(--sk-raised2); border: 1px solid var(--sk-line2); font: 700 12px var(--sk-mono); color: var(--sk-ink2); box-sizing: border-box; }
.sk-pill.is-good { background: var(--sk-green-soft); color: var(--sk-green); border-color: rgba(69,209,143,.4); }
.sk-pill.is-warn { background: var(--sk-accent-soft); color: var(--sk-accent2); border-color: var(--sk-accent-line); }
.sk-figure { font-size: 24px; font-weight: 800; letter-spacing: -0.03em; }

.sk-primary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 10px 20px; border: 0; border-radius: 999px; font-weight: 750;
  background: linear-gradient(135deg, #ffb35c, #f7931a 55%, #e9800c); color: var(--sk-accent-ink); box-shadow: 0 10px 26px -10px rgba(247,147,26,.8), inset 0 1px 0 rgba(255,255,255,.35); transition: transform .15s, box-shadow .15s; }
.sk-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 30px -10px rgba(247,147,26,.9), inset 0 1px 0 rgba(255,255,255,.35); }
.sk-secondary { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 10px 18px; border: 1px solid var(--sk-line2); border-radius: 999px; background: rgba(255,255,255,.04); font-weight: 650; }
.sk-secondary:hover:not(:disabled) { background: var(--sk-hover); border-color: var(--sk-accent-line); }
.sk-mini { display: inline-flex; align-items: center; justify-content: center; min-height: 34px; padding: 5px 13px; border: 1px solid var(--sk-line2); border-radius: 999px; background: rgba(255,255,255,.02); font-size: 13px; font-weight: 650; color: var(--sk-ink2); justify-self: start; white-space: nowrap; }
.sk-mini:hover:not(:disabled) { background: var(--sk-hover); color: var(--sk-ink); border-color: var(--sk-accent-line); }
.sk-mini.is-danger { border-color: var(--sk-red); color: var(--sk-red); background: var(--sk-red-soft); }
.sk-actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.sk-bar { height: 10px; border-radius: 999px; background: rgba(255,255,255,.07); overflow: hidden; }
.sk-bar span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #f7931a, #ffb35c); transition: width .6s cubic-bezier(.2,.8,.2,1); }
.sk-bar[data-tone="good"] span { background: linear-gradient(90deg, #2fb57a, #45d18f); }
.sk-bar[data-tone="warn"] span { background: linear-gradient(90deg, #e25d52, #ff8a80); box-shadow: none; }
.sk-bar[data-tone="gold"] span { background: linear-gradient(90deg, #ffb35c, #ffd27a); }

.sk-month { border-color: var(--sk-accent-line); }
.sk-month-target { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; }
.sk-month-split dt { font: 600 10.5px var(--sk-mono); letter-spacing: .12em; text-transform: uppercase; color: var(--sk-ink3); }
.sk-month-target b { font-size: 40px; line-height: 1.05; font-weight: 800; letter-spacing: -0.04em; color: var(--sk-accent2); }
.sk-month-target small { color: var(--sk-ink3); font-size: 13.5px; }
.sk-month-progress { display: grid; gap: 8px; }
.sk-month-split i.is-core { background: linear-gradient(90deg, #f7931a, #ffb35c); }
.sk-month-split i.is-res { background: var(--sk-blue); }
.sk-month-split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 18px; margin: 0; }
.sk-month-split dt { display: flex; align-items: center; gap: 7px; }
.sk-month-split i { width: 10px; height: 10px; border-radius: 3px; flex: none; }
.sk-month-split dd { margin: 3px 0 0; font-weight: 750; font-size: 19px; letter-spacing: -0.02em; }
.sk-month-split dd + dd { margin-top: 0; }
.sk-month-split dd small { font-size: 12.5px; color: var(--sk-ink3); font-weight: 500; letter-spacing: 0; }
.sk-progress-line { font-size: 13.5px; color: var(--sk-ink2); font-weight: 650; }
.sk-zone-note { padding: 13px 15px; border-radius: 14px; background: color-mix(in oklab, var(--zc, #f7931a) 10%, transparent); border: 1px solid color-mix(in oklab, var(--zc, #f7931a) 35%, transparent); font-size: 14px; color: var(--sk-ink2); }
.sk-zone-note strong { color: var(--sk-ink); }
.sk-legend [data-part="exch"] i { background: var(--sk-accent); }
.sk-legend [data-part="cold"] i { background: var(--sk-green); }

.sk-due { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.sk-due li { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 11px 12px 11px 14px; border-radius: 14px; background: var(--sk-raised); border: 1px solid var(--sk-line); border-left: 3px solid var(--sk-accent); font-size: 14px; }
.sk-due li[data-kind="backup"] { border-left-color: var(--sk-blue); }
.sk-due li[data-kind="problems"] { border-left-color: var(--sk-red); }
.sk-due li[data-kind="cold"] { border-left-color: var(--sk-green); }
.sk-triggers { position: relative; list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.sk-triggers::before { content: ""; position: absolute; left: 27px; top: 22px; bottom: 22px; width: 2px; border-radius: 2px; background: linear-gradient(var(--sk-accent), rgba(255,255,255,.08)); }
.sk-triggers li { position: relative; display: grid; grid-template-columns: 56px minmax(0, 1fr) auto; align-items: center; gap: 4px 12px; padding: 6px 0; }
.sk-triggers li .sk-mini { grid-column: 2 / -1; }
.sk-trig-at { position: relative; z-index: 1; justify-self: center; display: grid; place-items: center; width: 46px; height: 46px; border-radius: 50%; background: #121419; border: 2px solid rgba(255,255,255,.16); font: 700 12px var(--sk-mono); color: var(--sk-ink2); }
.sk-trig-body { display: grid; min-width: 0; }
.sk-trig-body b { font-weight: 700; }
.sk-trig-body small { color: var(--sk-ink3); font-size: 12.5px; }
.sk-trig-state { font: 700 11px var(--sk-mono); letter-spacing: .04em; text-transform: uppercase; color: var(--sk-ink3); text-align: right; }
.sk-triggers li[data-state="fired"] .sk-trig-at { border-color: var(--sk-accent); background: var(--sk-accent); color: var(--sk-accent-ink); box-shadow: 0 0 20px rgba(247,147,26,.6); }
.sk-triggers li[data-state="fired"] .sk-trig-state { color: var(--sk-accent2); }
.sk-triggers li[data-state="used"] .sk-trig-at { border-color: var(--sk-green); background: var(--sk-green-soft); color: var(--sk-green); }
.sk-triggers li[data-state="used"] .sk-trig-state { color: var(--sk-green); }
.sk-callout-line { padding: 11px 13px; border-radius: 14px; background: var(--sk-accent-soft); border: 1px solid var(--sk-accent-line); font-size: 14px; font-weight: 650; }
.sk-units { color: var(--sk-ink2); }
.sk-units b { font-size: 30px; color: var(--sk-ink); font-weight: 800; letter-spacing: -0.035em; }
.sk-root .is-up { color: var(--sk-green); }
.sk-root .is-down { color: var(--sk-red); }

.sk-table-wrap { overflow-x: auto; border: 1px solid var(--sk-line); border-radius: 14px; background: rgba(0,0,0,.15); }
.sk-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.sk-table th, .sk-table td { padding: 11px 13px; text-align: left; border-bottom: 1px solid var(--sk-line); vertical-align: top; }
.sk-table thead th { background: rgba(255,255,255,.035); font: 600 10.5px var(--sk-mono); letter-spacing: .1em; text-transform: uppercase; color: var(--sk-ink3); white-space: nowrap; }
.sk-table tbody th { font-weight: 700; color: var(--sk-ink); }
.sk-table td { color: var(--sk-ink2); }
.sk-table tr:last-child > * { border-bottom: 0; }
.sk-table tbody tr:hover > * { background: rgba(255,255,255,.025); }
.sk-table.is-num td, .sk-table.is-num thead th:not(:first-child) { text-align: right; white-space: nowrap; }
.sk-table td small, .sk-table th small { display: block; color: var(--sk-ink3); font-size: 12px; font-weight: 500; }
.sk-table tr.is-now > * { background: var(--sk-accent-soft); }
.sk-table tr.is-now > th { color: var(--sk-accent2); box-shadow: inset 3px 0 0 var(--sk-accent); }
.sk-swatch { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 8px; background: var(--tone, var(--sk-ink3)); }

.sk-chart { position: relative; width: 100%; min-width: 0; }
.sk-plot { position: relative; touch-action: pan-y; border-radius: 10px; }
.sk-chart svg { display: block; overflow: visible; }
.sk-gridline { stroke: rgba(255,255,255,.07); stroke-width: 1; }
.sk-axis { fill: var(--sk-ink3); font: 500 11px var(--sk-mono); }
.sk-axis-target { fill: var(--sk-red); font-weight: 700; }
.sk-target { stroke: var(--sk-red); stroke-width: 1.5; stroke-dasharray: 2 5; }
.sk-rule { stroke: var(--sk-ink3); stroke-width: 1; stroke-dasharray: 3 3; }
.sk-line { fill: none; stroke: var(--tone, var(--sk-accent)); stroke-width: 2.6; stroke-linejoin: round; stroke-linecap: round; }
.sk-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: sk-draw 1.4s cubic-bezier(.3,.7,.2,1) .15s forwards; }
.sk-dot { fill: var(--sk-solid); stroke: var(--tone, var(--sk-accent)); stroke-width: 2.5; }
.sk-tip { position: absolute; top: 4px; transform: translateX(-50%); min-width: 190px; display: grid; gap: 4px; padding: 11px 13px; border-radius: 14px; background: rgba(14,16,21,.96); border: 1px solid var(--sk-line2); box-shadow: 0 20px 40px -20px #000; font-size: 12.5px; pointer-events: none; }
.sk-tip b { font: 700 12px var(--sk-mono); color: var(--sk-accent2); }
.sk-tip span { display: grid; grid-template-columns: 10px 1fr auto; align-items: center; gap: 8px; color: var(--sk-ink2); }
.sk-tip i, .sk-legend i { display: inline-block; width: 10px; height: 3px; border-radius: 2px; background: var(--tone); }
.sk-tip em { font-style: normal; font-weight: 750; color: var(--sk-ink); }
.sk-legend { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px 16px; font-size: 13px; color: var(--sk-ink2); }
.sk-legend li { display: inline-flex; align-items: center; gap: 7px; }
.sk-legend i { width: 16px; }
.sk-legend.is-tight { display: grid; gap: 6px; }
.sk-legend.is-tight li { gap: 8px; }
.sk-legend.is-tight i { width: 10px; height: 10px; border-radius: 3px; }
.sk-legend.is-tight b { margin-left: auto; padding-left: 8px; font-weight: 700; color: var(--sk-ink); }
.sk-legend li[data-tone="paid"] i { background: repeating-linear-gradient(90deg, var(--tone) 0 5px, transparent 5px 9px); }
.sk-legend li[data-tone="target"] i { background: repeating-linear-gradient(90deg, var(--tone) 0 2px, transparent 2px 6px); }
.sk-details summary { cursor: pointer; color: var(--sk-ink2); font-weight: 650; font-size: 14px; padding: 4px 0; }
.sk-details[open] summary { margin-bottom: 10px; }

.sk-form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px 14px; }
.sk-field { display: grid; gap: 6px; align-content: start; min-width: 0; }
.sk-span-2 { grid-column: span 2; }
.sk-field-label { font-size: 12.5px; font-weight: 700; color: var(--sk-ink2); }
.sk-field > input, .sk-num { width: 100%; box-sizing: border-box; min-height: 44px; border: 1px solid var(--sk-line2); border-radius: 12px; background: var(--sk-field); color: var(--sk-ink); font: inherit; font-size: 15px; }
.sk-field > input { padding: 9px 12px; }
.sk-num { display: flex; align-items: center; overflow: hidden; }
.sk-num input { flex: 1; min-width: 0; min-height: 42px; padding: 9px 12px; border: 0; background: transparent; color: var(--sk-ink); font: inherit; font-size: 15px; }
.sk-affix { padding-left: 12px; color: var(--sk-ink3); font-weight: 650; }
.sk-num input + .sk-affix { padding: 0 12px 0 0; }
.sk-field > input:focus, .sk-field > input:focus-visible, .sk-num:focus-within { outline: none; border-color: var(--sk-accent); box-shadow: 0 0 0 3px rgba(247,147,26,.28); }
.sk-num input:focus, .sk-num input:focus-visible { outline: none; box-shadow: none; }
.sk-root input[type="date"], .sk-root input[type="month"] { color-scheme: dark; }
.sk-num input[type="password"] { letter-spacing: .1em; }
.sk-hint { color: var(--sk-ink3); font-size: 12.5px; }
.sk-form-error { color: var(--sk-red); font-weight: 650; font-size: 14px; }
.sk-form-error:empty { display: none; }
.sk-entry-form { display: grid; gap: 14px; }
.sk-reserve-tick { display: grid; gap: 2px; }
.sk-seg { display: inline-flex; flex: none; flex-wrap: nowrap; gap: 4px; padding: 4px; border-radius: 999px; background: var(--sk-field); border: 1px solid var(--sk-line2); justify-self: start; }
.sk-seg.is-wrap { flex: initial; flex-wrap: wrap; border-radius: 16px; }
.sk-seg button { min-height: 36px; padding: 5px 13px; border: 0; border-radius: 999px; background: transparent; color: var(--sk-ink2); font-size: 13.5px; font-weight: 650; }
.sk-seg button.is-on { background: linear-gradient(135deg, #ffb35c, #f7931a); color: var(--sk-accent-ink); }
.sk-seg button:not(.is-on):hover { background: var(--sk-hover); color: var(--sk-ink); }
.sk-check { display: flex; align-items: flex-start; gap: 10px; width: 100%; min-height: 40px; padding: 8px 10px; border: 0; border-radius: 12px; background: transparent; text-align: left; color: var(--sk-ink); }
.sk-check:hover { background: var(--sk-hover); }
.sk-check-box { flex: none; width: 22px; height: 22px; margin-top: 1px; display: grid; place-items: center; border: 2px solid var(--sk-ink3); border-radius: 7px; font-size: 13px; font-weight: 900; color: var(--sk-accent-ink); box-sizing: border-box; transition: background .15s, border-color .15s; }
.sk-check.is-on .sk-check-box { background: linear-gradient(135deg, #ffb35c, #f7931a); border-color: var(--sk-accent); }
.sk-check-label { display: grid; gap: 2px; }
.sk-check-label small { color: var(--sk-ink3); font-size: 12.5px; }
.sk-check.is-on .sk-check-label { color: var(--sk-ink2); }
.sk-checks { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }
.sk-check-note { margin: -4px 0 6px 42px !important; color: var(--sk-ink3); font-size: 13px; }

.sk-month-group { display: grid; gap: 8px; }
.sk-month-group + .sk-month-group { margin-top: 12px; }
.sk-month-group h3 { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; font-size: 15px; font-weight: 750; }
.sk-month-group h3 small { color: var(--sk-ink3); font: 600 11.5px var(--sk-mono); }
.sk-entries { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.sk-entry { --k: var(--sk-ink3); display: grid; grid-template-columns: 128px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 11px 13px; border-radius: 14px; background: var(--sk-raised); border: 1px solid var(--sk-line); }
.sk-entry[data-kind="buy"] { --k: var(--sk-green); } .sk-entry[data-kind="sell"] { --k: var(--sk-red); } .sk-entry[data-kind="out"] { --k: var(--sk-teal); }
.sk-entry[data-kind="in"] { --k: var(--sk-blue); } .sk-entry[data-kind="res"] { --k: var(--sk-gold); } .sk-entry[data-kind="open"] { --k: var(--sk-accent); border-color: var(--sk-accent-line); background: var(--sk-accent-soft); }
.sk-entry-kind { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; font-size: 12.5px; font-weight: 750; color: var(--k); }
.sk-entry-kind::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--k); }
.sk-entry-kind em { font-style: normal; color: var(--sk-accent2); font: 700 10px var(--sk-mono); text-transform: uppercase; letter-spacing: .08em; }
.sk-entry-main { display: grid; gap: 2px; min-width: 0; }
.sk-entry-main b { font-weight: 750; }
.sk-entry-main small { color: var(--sk-ink3); font-size: 12.5px; overflow-wrap: anywhere; }
.sk-entry-actions { display: flex; gap: 6px; }

.sk-callout { padding: 17px 19px; border-radius: var(--sk-r); border: 1px solid var(--sk-line2); border-left: 4px solid var(--sk-accent); background: var(--sk-card); display: grid; gap: 8px; box-shadow: var(--sk-shadow); }
.sk-callout[data-tone="key"] { background: linear-gradient(90deg, rgba(247,147,26,.14), transparent 70%), var(--sk-card); }
.sk-callout[data-tone="warn"] { border-left-color: var(--sk-red); background: linear-gradient(90deg, var(--sk-red-soft), transparent 60%), var(--sk-card); }
.sk-callout[data-tone="good"] { border-left-color: var(--sk-green); }
.sk-callout[data-tone="tip"] { border-left-color: var(--sk-blue); background: linear-gradient(90deg, rgba(138,188,255,.1), transparent 60%), var(--sk-card); }
.sk-callout-title { font-weight: 780; font-size: 15.5px; color: var(--sk-ink); }
.sk-tag { font: 700 10.5px var(--sk-mono); letter-spacing: .12em; text-transform: uppercase; color: var(--sk-accent2); }
.sk-list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 26px; }
.sk-list li { display: grid; grid-template-columns: 74px minmax(0, 1fr); gap: 10px; align-items: baseline; padding: 11px 0; border-top: 1px solid var(--sk-line); color: var(--sk-ink2); }
.sk-list li[data-tone="warn"] .sk-tag { color: var(--sk-red); }
.sk-list li[data-tone="good"] .sk-tag { color: var(--sk-green); }
.sk-need { color: var(--sk-ink2); }
.sk-need b { margin-right: 6px; font-size: 32px; font-weight: 800; letter-spacing: -0.04em; color: var(--sk-accent2); }
.sk-open-group, .sk-disclose { border-radius: 14px; }
.sk-pulse-meta { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; font: 500 11.5px var(--sk-mono); color: var(--sk-ink3); }
.sk-coins { list-style: none; margin: 0; padding: 0; display: grid; }
.sk-coin { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-top: 1px solid var(--sk-line); }
.sk-coins > .sk-coin:first-child { border-top: 0; }
.sk-coin-rank { flex: none; width: 18px; text-align: right; font: 600 11.5px var(--sk-mono); color: var(--sk-ink3); }
.sk-coin-ico { flex: none; width: 22px; height: 22px; border-radius: 50%; background: var(--sk-raised2); object-fit: cover; }
.sk-coin-name { flex: 1; min-width: 0; display: grid; }
.sk-coin-name a, .sk-coin-name b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 700; }
.sk-root .sk-coin-name a { color: var(--sk-ink); text-decoration-color: rgba(255,255,255,.22); }
.sk-root .sk-coin-name a:hover { text-decoration-color: currentColor; }
.sk-root .sk-coin.is-btc .sk-coin-name a, .sk-coin.is-btc .sk-coin-name b { color: var(--sk-accent2); }
.sk-coin-name small { font: 500 11px var(--sk-mono); color: var(--sk-ink3); }
.sk-coin-spark { flex: none; width: 64px; height: 22px; }
.sk-coin-price { flex: none; min-width: 76px; text-align: right; font-size: 13.5px; font-weight: 650; color: var(--sk-ink2); }
.sk-chg { flex: none; min-width: 64px; text-align: right; font: 700 12.5px var(--sk-mono); }
.sk-chg.is-up, .sk-moves h3.is-up { color: var(--sk-green); }
.sk-chg.is-down, .sk-moves h3.is-down { color: var(--sk-red); }
.sk-coin-turn { flex: none; min-width: 76px; display: grid; justify-items: end; }
.sk-coin-turn b { font: 700 13px var(--sk-mono); color: var(--sk-accent2); }
.sk-coin-turn small { font-size: 11.5px; color: var(--sk-ink3); }
.sk-moves { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 30px; }
.sk-moves h3 { margin-bottom: 4px; font: 700 11px var(--sk-mono); letter-spacing: .12em; text-transform: uppercase; }
.sk-buying { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; padding: 11px 13px; border-radius: 12px; background: var(--sk-green-soft); border: 1px solid rgba(69,209,143,.3); font-size: 14px; color: var(--sk-ink2); }
.sk-buying b { color: var(--sk-ink); font-weight: 700; }
.sk-buying em { font: 700 12.5px var(--sk-mono); font-style: normal; }
.sk-buying i { font-style: normal; color: var(--sk-ink3); }
.sk-tracker-note { text-align: center; }
.sk-holders tbody th { min-width: 9em; }
.sk-open-group { margin-top: 12px; border: 1px solid var(--sk-accent-line); background: var(--sk-accent-soft); }
.sk-open-group > summary, .sk-disclose > summary { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 12px; cursor: pointer; list-style: none; }
.sk-open-group > summary { padding: 13px 15px; font-weight: 750; }
.sk-open-group > summary::-webkit-details-marker, .sk-disclose > summary::-webkit-details-marker { display: none; }
.sk-open-group > summary::before, .sk-disclose > summary::before { content: ""; width: 7px; height: 7px; margin-right: 2px; border-right: 2px solid var(--sk-ink3); border-bottom: 2px solid var(--sk-ink3); transform: translateY(-2px) rotate(-45deg); transition: transform .15s; }
.sk-open-group[open] > summary::before, .sk-disclose[open] > summary::before { transform: translateY(-3px) rotate(45deg); }
.sk-open-group > summary small, .sk-disclose > summary small { margin-left: auto; color: var(--sk-ink3); font: 600 11.5px var(--sk-mono); }
.sk-open-group .sk-entries { padding: 0 10px; }
.sk-open-group .sk-entry[data-kind="open"] { background: rgba(7,8,11,.35); border-color: var(--sk-line); }
.sk-open-group .sk-open-foot { margin: 0; padding: 12px 15px 14px; }
.sk-disclose > summary h2 { font-size: 19px; line-height: 1.3; font-weight: 750; }
.sk-disclose-body { display: grid; gap: 14px; margin-top: 16px; }
.sk-disclose-body h3 { font-size: 15px; font-weight: 750; }
.sk-banner { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 12px 14px; margin-bottom: 16px; border-radius: 14px; border: 1px solid var(--sk-line2); background: var(--sk-card); }
.sk-banner p { flex: 1 1 240px; }
.sk-banner.is-warn { border-color: rgba(255,138,128,.5); background: var(--sk-red-soft); }
.sk-banner.is-good { border-color: rgba(69,209,143,.45); background: var(--sk-green-soft); }
.sk-footer { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 26px 20px 40px; color: var(--sk-ink3); font-size: 13px; border-top: 1px solid var(--sk-line); text-align: center; }
.sk-footer .sk-mark { width: 18px; height: 18px; flex: none; }

.sk-opening { padding: 40px 20px; color: var(--sk-ink3); font: 500 13px var(--sk-mono); }
.sk-wallet-body { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 18px; align-items: center; }
.sk-qr { padding: 8px; border-radius: 14px; background: #fff; line-height: 0; box-shadow: 0 10px 24px -12px rgba(0,0,0,.8); }
.sk-wallet-main { display: grid; gap: 8px; min-width: 0; }
.sk-address { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; min-height: 40px; padding: 7px 12px; border: 1px solid var(--sk-line2); border-radius: 12px; background: var(--sk-field); text-align: left; }
.sk-address code { padding: 0; background: none; color: var(--sk-ink2); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sk-address span { flex: none; font: 700 11.5px var(--sk-mono); color: var(--sk-accent2); }
.sk-address:hover { border-color: var(--sk-accent-line); }
.sk-root a.sk-mini { color: var(--sk-ink2); text-decoration: none; }
.sk-root a.sk-mini:hover { color: var(--sk-ink); }
.sk-chain-ok { display: inline-flex; align-items: center; gap: 5px; margin-left: 4px; padding: 1px 9px 1px 7px; border-radius: 999px; font: 600 11px var(--sk-mono); color: var(--sk-green); background: var(--sk-green-soft); border: 1px solid rgba(69,209,143,.35); white-space: nowrap; vertical-align: 1px; }
.sk-chain-ok i { font-style: normal; }
.sk-live { display: inline-flex; align-items: center; gap: 7px; padding: 4px 10px; border-radius: 999px; font: 700 11px var(--sk-mono); color: var(--sk-ink3); border: 1px solid var(--sk-line2); }
.sk-live i { width: 7px; height: 7px; border-radius: 50%; background: var(--sk-ink3); }
.sk-live.is-live { color: var(--sk-green); border-color: rgba(69,209,143,.4); background: var(--sk-green-soft); }
.sk-live.is-live i { background: var(--sk-green); box-shadow: 0 0 8px var(--sk-green); animation: sk-blink 2.4s ease-in-out infinite; }
.sk-reconcile { padding: 10px 12px; border-radius: 12px; font-size: 13.5px; border: 1px solid var(--sk-line); }
.sk-reconcile.is-off { color: var(--sk-amber); background: rgba(255,210,122,.08); border-color: rgba(255,210,122,.35); }
.sk-banner.is-gold { border-color: var(--sk-accent-line); background: linear-gradient(90deg, rgba(247,147,26,.16), rgba(247,147,26,.04)); }
.sk-migrate { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px 18px; align-items: center; padding: 16px 18px; }
.sk-migrate-copy { display: grid; gap: 4px; }
.sk-migrate-copy p:last-child { color: var(--sk-ink2); font-size: 14px; }
.sk-migrate-form { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.sk-migrate-form .sk-num { width: 220px; }
.sk-migrate .sk-form-error { grid-column: 1 / -1; }

@keyframes sk-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes sk-draw { to { stroke-dashoffset: 0; } }
@keyframes sk-pulse { from { transform: scale(.5); opacity: .9; } to { transform: scale(2.3); opacity: 0; } }
@keyframes sk-blink { 50% { opacity: .35; } }

@media (max-width: 1000px) {
  .sk-hero { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 760px) {
  .sk-wrap { padding: 0 14px; }
  .sk-grid { grid-template-columns: minmax(0, 1fr); }
  .sk-hero { padding-top: 26px; gap: 22px; }
  .sk-stackstrip { padding: 18px; }
  .sk-glance { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sk-list { grid-template-columns: minmax(0, 1fr); }
  .sk-moves { grid-template-columns: minmax(0, 1fr); }
  .sk-coin-spark { display: none; }
  .sk-card { padding: 18px; }
  .sk-hide-sm, .sk-save-text { display: none; }
  .sk-entry { grid-template-columns: minmax(0, 1fr); gap: 6px; }
  .sk-span-2 { grid-column: auto; }
  .sk-journey-phases b { font-size: 12px; }
  .sk-journey-phases small, .sk-journey-events span { font-size: 9.5px; }
  .sk-price-big { font-size: 38px; }
  .sk-migrate { grid-template-columns: minmax(0, 1fr); }
  .sk-migrate-form .sk-num { width: 100%; }
}
@media (max-width: 420px) {
  .sk-top-mark { display: none; }
  .sk-triggers li { grid-template-columns: 52px minmax(0, 1fr); }
  .sk-trig-state { grid-column: 2; text-align: left; }
  .sk-month-split { grid-template-columns: minmax(0, 1fr); }
  .sk-wallet-body { grid-template-columns: minmax(0, 1fr); justify-items: start; }
}
@media (max-width: 360px) {
  .sk-coin-price { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .sk-root *, .sk-root *::before, .sk-root *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
  .sk-draw, .sk-spark-line { stroke-dasharray: none !important; stroke-dashoffset: 0 !important; }
}
`
