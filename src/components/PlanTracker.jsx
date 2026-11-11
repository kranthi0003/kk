import React, { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react'
import { PLAN_PAYLOAD as PAYLOAD } from '../lib/planPayload'

/* ------------------------------------------------------------------ *
 * A private, password-protected planner and tracker.
 *
 * The plan ships encrypted (PBKDF2-SHA256 → AES-GCM-256, the scheme the
 * other private pages use) and decrypts only in the browser. Every word of
 * the plan lives in the payload, so this file is a generic renderer: a dated
 * week-by-week plan, a daily log with hours, milestones, a practice log with
 * targets, timed drills, written entries and self-scores.
 *
 * Progress is saved in localStorage on this device, AES-GCM encrypted with a
 * random key that exists only inside the payload — nothing readable is
 * stored, and changing the page password keeps progress readable as long as
 * the payload keeps its key. Backups are the same ciphertext as a file.
 * "Keep this device unlocked" stores the derived, non-extractable key in
 * IndexedDB; locking forgets it.
 * ------------------------------------------------------------------ */

const enc = new TextEncoder()
const dec = new TextDecoder()
const fromB64 = (value) => Uint8Array.from(atob(value), (c) => c.charCodeAt(0))
function toB64(bytes) {
  let out = ''
  for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  return btoa(out)
}
const STORE = 'pt_state_v1'
const PREV = 'pt_state_v1_prev'
const BLOCKS = ['am', 'pm', 'x']
const DAY_MS = 86400000
const pad = (n) => String(n).padStart(2, '0')
const list = (v) => (Array.isArray(v) ? v : v ? [v] : [])
const sum = (xs) => xs.reduce((a, b) => a + (Number(b) || 0), 0)
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4)
const fill = (text, vars) => String(text || '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''))
const smooth = () => (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth')
const dayWord = (w, n) => (n === 1 ? w.streakDay : w.streakDays)
const fmtH = (h) => `${Math.round((Number(h) || 0) * 10) / 10} h`

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
  if (!stateKey || !Array.isArray(data.weeks) || !data.weeks.length || !data.schedule) throw new Error('Unexpected content')
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
    try { req = indexedDB.open('pt-vault', 1) } catch { resolve(null); return }
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

// Calendar maths on whole UTC days, so DST never shifts a date.
const dnum = (iso) => { const [y, m, d] = String(iso).split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / DAY_MS) }
const diso = (n) => new Date(n * DAY_MS).toISOString().slice(0, 10)
const localIso = (t = new Date()) => `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
const wdOf = (n) => (new Date(n * DAY_MS).getUTCDay() + 6) % 7
const isIso = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(dnum(v))
const fmtDay = (n, opts) => new Date(n * DAY_MS).toLocaleDateString('en-GB', { timeZone: 'UTC', ...opts })
const fmtRange = (a, b) => {
  const sameMonth = fmtDay(a, { month: 'short' }) === fmtDay(b, { month: 'short' })
  return sameMonth ? `${fmtDay(a, { day: 'numeric' })}–${fmtDay(b, { day: 'numeric', month: 'short' })}` : `${fmtDay(a, { day: 'numeric', month: 'short' })} – ${fmtDay(b, { day: 'numeric', month: 'short' })}`
}

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

const blank = () => ({ v: 1, days: {}, weeks: {}, ms: {}, sk: {}, skHist: [], stories: {}, dr: {}, custom: [], prac: [], setup: {}, view: 'today' })
function normalise(raw) {
  const b = blank()
  if (!raw || typeof raw !== 'object') return b
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {})
  const arr = (v) => (Array.isArray(v) ? v : [])
  return {
    ...b, ...raw,
    days: obj(raw.days), weeks: obj(raw.weeks), ms: obj(raw.ms), sk: obj(raw.sk), skHist: arr(raw.skHist), stories: obj(raw.stories),
    dr: obj(raw.dr), custom: arr(raw.custom), prac: arr(raw.prac), setup: obj(raw.setup),
    start: isIso(raw.start) ? raw.start : undefined,
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

const empty = (v) => v === undefined || v === null || v === '' || v === false || v === 0
  || (typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length)
function patchIn(s, branch, id, patch) {
  const next = { ...((s[branch] || {})[id] || {}), ...patch }
  for (const k of Object.keys(next)) if (empty(next[k])) delete next[k]
  const b = { ...(s[branch] || {}) }
  if (Object.keys(next).length) b[id] = next
  else delete b[id]
  return { ...s, [branch]: b }
}
const tidy = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => !empty(v)))

// Interface words. Neutral defaults, overridable from the payload's words.
const UI = {
  back: 'Back to site', lock: 'Lock', backup: 'Backup', sections: 'Sections', opening: 'Opening…',
  saved: 'Saved on this device', saving: 'Saving…', saveError: 'Not saved — browser storage is full or blocked',
  today: 'Today', thisWeek: 'This week', firstWeek: 'First week', week: 'Week', weeks: 'Weeks', day: 'Day', of: 'of',
  prevDay: 'Previous day', nextDay: 'Next day', jumpToday: 'Jump to today', planDay: 'Plan day',
  st_done: 'Done', st_partial: 'Partial', st_missed: 'Missed', st_rest: 'Rest', st_open: 'Not logged yet', st_future: 'Coming up', st_out: 'Outside the plan',
  done: 'Done', markDone: 'Mark done', less: 'Less', more: 'More', hoursFor: 'Hours for',
  restDay: 'Rest day', restHint: 'A planned break — no hours expected.', notes: 'Notes', notesPh: 'What you did, what got in the way…',
  output: 'Output to record', sayIt: 'Say it aloud', openWeek: 'Open the full week', writeReview: 'Write the weekly review',
  deliverable: 'Deliverable', checkpoint: 'Checkpoint', evidence: 'Evidence link', evidencePh: 'https://…',
  trackDesign: 'System design / engineering', trackCoding: 'Coding / data', trackProject: 'AI / project work',
  lighter: 'Lighter week', now: 'Now', overdue: 'Behind', complete: 'Complete',
  days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  daysShort: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  dayPlan: 'Day by day', reading: 'Read', problems: 'Practice problems', dsa: 'Coding', sql: 'SQL', log: 'Log it', logged: 'Logged ✓',
  review: 'Weekly review', wins: 'Wins', gaps: 'Gaps', next: 'Next week', weekNotes: 'Notes',
  start: 'Start', pause: 'Pause', resume: 'Resume', reset: 'Reset', timeUp: "Time's up — wrap up in one line.",
  due: 'Due now', nothingDue: 'Nothing due. Keep the rhythm going.',
  dueReview: 'Week {n} review isn’t written yet.', dueSkills: 'Skills were last scored {d} days ago — re-score every two weeks.',
  dueSkillsFirst: 'Score your skills for the first time.', dueWeeks: '{k} past week(s) still have an unticked deliverable or checkpoint: {list}.',
  dueMs: '{name} was due by week {n}.', dueBackup: 'Download a fresh backup — it’s been over a week.', dueBackupFirst: 'Download your first backup.',
  goThere: 'Open', saveBackup: 'Download',
  totals: 'So far', hoursLogged: 'Hours logged', plannedToDate: 'planned to date', planTotal: 'in the whole plan',
  streak: 'Streak', streakDay: 'day', streakDays: 'days', best: 'best', weeksDone: 'Weeks complete', msDone: 'Milestones done',
  storiesReady: 'Stories ready', skillsAtTarget: 'Skills at target', dayCounts: 'Days',
  pace: 'pace', ahead: 'ahead', behind: 'behind', onPace: 'on pace', expected: 'expected by now',
  startsIn: 'Starts {date}', daysToGo: '{n} days to go', dayToGo: '1 day to go', startsToday: 'Starts today',
  glance: 'The plan at a glance', glanceWeeks: 'weeks', glanceHours: 'planned hours', glanceProblems: 'suggested problems',
  glanceMilestones: 'milestones', glanceStories: 'stories', glanceDrills: 'drill prompts',
  weekOfPlan: 'Week {w} of {W} · day {d} of {D}', finished: 'All {W} weeks are behind you. Keep the reps going.',
  heat: 'Every planned day', legend: 'Legend', hoursByWeek: 'Hours by week', consistency: 'Consistency', planned: 'planned', logged2: 'logged',
  status: 'Status', tasks: 'Tasks', stack: 'Stack', risks: 'Notes / risks', weeksTag: 'Weeks {a}–{b}', weekTag: 'Week {a}',
  allTicked: 'All tasks ticked — mark it done', upcoming: 'Starts week {n}', inWindow: 'In its window', lateBy: 'Past its window',
  addEntry: 'Add an entry', kind: 'Kind', titleF: 'Title', link: 'Link', date: 'Date', add: 'Add', mistake: 'I made a mistake worth remembering', why: 'What went wrong',
  all: 'All', needsPm: 'Needs post-mortem', errorLog: 'Error log', noEntries: 'Nothing here yet.', postMortem: 'Post-mortem',
  delete: 'Delete', confirmDelete: 'Tap again to delete', includesRuns: 'includes {n} drill runs', reviewedOf: '{a} of {b} with a full post-mortem',
  practised: 'practised', lastRun: 'Last: {d}', avg: 'avg', covered: '{a} of {b} covered', rating: 'Self-rating', saveRun: 'Save this run',
  runNote: 'What to improve', addDrill: 'Add your own prompt', prompt: 'Prompt', coversF: 'A strong answer covers (comma-separated)', category: 'Category',
  words: 'words', aim: 'aim for 250–300', hint: 'What to show',
  target: 'Target', current: 'Current', confidence: 'Confidence', lastReviewed: 'Last reviewed {d}', atTarget: 'At target', toGo: '{n} to go',
  evidenceF: 'Latest evidence', gapF: 'Gap / next action', proof: 'Proof of learning',
  saveScores: 'Save today’s scores to history', scoresSaved: 'Scores saved for {d}.', rescoreDue: 'Re-score due', history: 'History',
  verified: 'Verified', reported: 'Reported', unknown: 'Unconfirmed', sources: 'Sources',
  startDate: 'Plan start date', startHint: 'Week 1 starts on the Monday of the date you pick.', resetStart: 'Use the original date',
  backupTitle: 'Backup', backupHint: 'Progress lives only in this browser. A backup file is encrypted with the same key, so only this page can read it.',
  lastBackup: 'Last backup: {d}', never: 'never', restore: 'Restore from a backup file', restored: 'Restored the backup from {d}.', undo: 'Undo',
  undone: 'Restore undone.', restoreBad: 'That file isn’t a backup from this page.', restoreWrongKey: 'That backup was made with a different key and can’t be opened here.',
  backupDone: 'Backup downloaded. Keep it somewhere safe.', undoFail: 'Nothing to undo.',
  device: 'This device', keepUnlocked: 'Keep this device unlocked', keepHint: 'Opens without the password on this browser until you press Lock.',
  orphan: 'Saved progress on this device couldn’t be opened with this plan’s key, so it was set aside untouched. Restore a backup file to continue where you left off.',
  setupDone: 'set up', dismiss: 'Dismiss',
  gateTitle: 'Private planner', gateLead: 'Enter your password to open your plan.', password: 'Password', show: 'Show', hide: 'Hide',
  open: 'Open', gateNote: 'Encrypted. Your password never leaves this browser.', wrong: "That password didn't match. Try again.",
  broken: "This page couldn't be opened. Please reload and try again in a current browser.",
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

// A small mark drawn from the payload (meta.mark: { viewBox, paths }).
function Mark({ mark, className }) {
  const paths = list(mark?.paths)
  if (!paths.length) return null
  return (
    <svg className={className ? `pt-mark ${className}` : 'pt-mark'} viewBox={mark.viewBox || '0 0 24 24'} aria-hidden="true" focusable="false">
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.fill || (p.stroke ? 'none' : 'currentColor')} stroke={p.stroke} strokeWidth={p.width}
          strokeLinecap={p.stroke ? 'round' : undefined} strokeLinejoin={p.stroke ? 'round' : undefined} />
      ))}
    </svg>
  )
}

function Check({ on, onChange, children, className }) {
  return (
    <button type="button" role="checkbox" aria-checked={!!on} className={`pt-check${on ? ' is-on' : ''}${className ? ` ${className}` : ''}`} onClick={() => onChange(!on)}>
      <span className="pt-check-box" aria-hidden="true">{on ? '✓' : ''}</span>
      <span className="pt-check-label">{children}</span>
    </button>
  )
}

function Seg({ value, options, onChange, label, className }) {
  return (
    <div className={`pt-seg${className ? ` ${className}` : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} data-tone={o.tone}
          className={value === o.id ? 'is-on' : undefined} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  )
}

// Text that commits to the tracker shortly after typing stops (and on blur),
// so a keystroke doesn't re-render and re-encrypt everything.
function Field({ value, onCommit, multiline, rows = 3, label, placeholder, type = 'text', hideLabel, className, inputMode }) {
  const id = useId()
  const [v, setV] = useState(value ?? '')
  const timer = useRef(null)
  const latest = useRef(value ?? '')
  const commit = useRef(onCommit)
  const focused = useRef(false)
  commit.current = onCommit
  useEffect(() => {
    if (!focused.current && timer.current === null) { setV(value ?? ''); latest.current = value ?? '' }
  }, [value])
  useEffect(() => () => { if (timer.current !== null) { clearTimeout(timer.current); commit.current(latest.current) } }, [])
  const flush = () => {
    if (timer.current === null) return
    clearTimeout(timer.current)
    timer.current = null
    commit.current(latest.current)
  }
  const change = (event) => {
    const next = event.target.value
    setV(next)
    latest.current = next
    if (timer.current !== null) clearTimeout(timer.current)
    timer.current = setTimeout(() => { timer.current = null; commit.current(latest.current) }, 450)
  }
  const props = {
    id, value: v, placeholder, onChange: change,
    onFocus: () => { focused.current = true },
    onBlur: () => { focused.current = false; flush() },
  }
  return (
    <label className={`pt-field${className ? ` ${className}` : ''}`} htmlFor={id}>
      <span className={hideLabel ? 'pt-sr' : 'pt-field-label'}>{label}</span>
      {multiline ? <textarea rows={rows} {...props} /> : <input type={type} inputMode={inputMode} autoComplete="off" {...props} />}
    </label>
  )
}

function Hours({ value, planned, onChange, label }) {
  const w = useW()
  const v = Number(value) || 0
  const full = v >= planned && planned > 0
  return (
    <div className="pt-hours" role="group" aria-label={`${w.hoursFor} ${label}`}>
      <button type="button" className="pt-step" aria-label={`${w.less}: ${label}`} disabled={v <= 0} onClick={() => onChange(clamp(v - 0.5, 0, 12))}>−</button>
      <output aria-live="polite">{fmtH(v)}</output>
      <button type="button" className="pt-step" aria-label={`${w.more}: ${label}`} disabled={v >= 12} onClick={() => onChange(clamp(v + 0.5, 0, 12))}>+</button>
      <button type="button" className={`pt-hours-done${full ? ' is-on' : ''}`} aria-pressed={full} onClick={() => onChange(full ? 0 : planned)}>
        {full ? `✓ ${w.done}` : w.markDone}
      </button>
    </div>
  )
}

function Timer({ minutes = 15 }) {
  const w = useW()
  const full = minutes * 60000
  const [left, setLeft] = useState(full)
  const [running, setRunning] = useState(false)
  const leftRef = useRef(full)
  leftRef.current = left
  useEffect(() => { setRunning(false); setLeft(full) }, [full])
  useEffect(() => {
    if (!running) return undefined
    const end = Date.now() + leftRef.current
    const t = setInterval(() => {
      const rest = Math.max(0, end - Date.now())
      setLeft(rest)
      if (rest === 0) setRunning(false)
    }, 250)
    return () => clearInterval(t)
  }, [running])
  const s = Math.ceil(left / 1000)
  return (
    <div className={left === 0 ? 'pt-timer is-up' : 'pt-timer'}>
      <span className="pt-timer-v" role="timer">{Math.floor(s / 60)}:{pad(s % 60)}</span>
      <button type="button" onClick={() => setRunning((r) => !r)} disabled={left === 0}>{running ? w.pause : left < full ? w.resume : w.start}</button>
      <button type="button" onClick={() => { setRunning(false); setLeft(full) }}>{w.reset}</button>
      <span className="pt-timer-msg" aria-live="polite">{left === 0 ? w.timeUp : ''}</span>
    </div>
  )
}

const Bar = ({ value, max, tone, label }) => (
  <div className="pt-bar" data-tone={tone} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max || 0} aria-valuenow={Math.min(value, max || 0)}>
    <span style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }} />
  </div>
)

function Ring({ value, max, label, children }) {
  return (
    <div className="pt-ring" style={{ '--pt-p': `${max ? (value / max) * 360 : 0}deg` }} role="progressbar"
      aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <span>{children}</span>
    </div>
  )
}

function Spark({ points, max = 5 }) {
  if (points.length < 2) return null
  const W = 120
  const H = 30
  const xy = points.map((p, i) => `${(i * W) / (points.length - 1)},${H - 3 - ((p - 1) / (max - 1)) * (H - 6)}`)
  return <svg className="pt-spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true"><polyline points={xy.join(' ')} /></svg>
}

function StatusChip({ status }) {
  const w = useW()
  return <span className={`pt-status is-${status}`}>{w[`st_${status}`]}</span>
}

// Two taps to delete, so a stray tap can't lose anything.
function DeleteButton({ onDelete }) {
  const w = useW()
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return undefined
    const t = setTimeout(() => setArmed(false), 4000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button type="button" className={armed ? 'pt-mini is-danger' : 'pt-mini'} onClick={() => (armed ? onDelete() : setArmed(true))}>
      {armed ? w.confirmDelete : w.delete}
    </button>
  )
}

// ── Plan model ──────────────────────────────────────────────────────────

const planModel = (startIso, W) => { const s = dnum(startIso); return { s, e: s + W * 7 - 1, W, D: W * 7 } }
const phaseOf = (data, n) => data.phases.find((p) => n >= p.from && n <= p.to)
const weekDone = (st, n) => { const r = st.weeks[n] || {}; return !!(r.d && r.c) }
const lastId = (items) => list(items)[list(items).length - 1]?.id
const currentWeek = (m, n) => (n < m.s ? 0 : n > m.e ? m.W + 1 : Math.floor((n - m.s) / 7) + 1)

function dayInfo(data, m, days, n, todayN) {
  const iso = diso(n)
  const i = n - m.s
  const inPlan = i >= 0 && n <= m.e
  const wd = wdOf(n)
  const sched = data.schedule.days[wd] || {}
  const plan = inPlan ? sched.plan || {} : {}
  const log = days[iso] || {}
  const full = sum(Object.values(plan))
  const actual = sum(BLOCKS.map((k) => log[k]))
  const status = !inPlan ? 'out'
    : log.rest ? 'rest'
      : full > 0 && actual >= full ? 'done'
        : actual > 0 ? 'partial'
          : n < todayN ? 'missed'
            : n === todayN ? 'open' : 'future'
  return { n, iso, i, inPlan, w: inPlan ? Math.floor(i / 7) + 1 : 0, wd, sched, plan, log, full, planned: log.rest ? 0 : full, actual, status }
}

// Hours and statuses are worked out from what was logged, never typed in.
function computeStats(data, m, days, todayN) {
  const per = Array.from({ length: m.W }, () => ({ planned: 0, actual: 0, toDate: 0, done: 0, partial: 0, missed: 0, rest: 0 }))
  const all = []
  const counts = { done: 0, partial: 0, missed: 0, rest: 0 }
  let planned = 0
  let toDate = 0
  let actualToDate = 0
  let run = 0
  let best = 0
  for (let n = m.s; n <= m.e; n++) {
    const d = dayInfo(data, m, days, n, todayN)
    const wk = per[d.w - 1]
    all.push(d)
    wk.planned += d.planned
    wk.actual += d.actual
    planned += d.planned
    if (n > todayN) continue
    wk.toDate += d.planned
    toDate += d.planned
    actualToDate += d.actual
    if (d.status in counts) { counts[d.status] += 1; wk[d.status] += 1 }
    if (d.status === 'done' || d.status === 'partial') { run += 1; best = Math.max(best, run) } else if (d.status === 'missed') run = 0
  }
  return { per, days: all, counts, planned, toDate, actualToDate, streak: run, best }
}

function topicFor(data, week, wd, k) {
  if (!week) return ''
  if (wd < 5) return list(k === 'am' ? week.am : week.pm)[wd] || ''
  if (wd === 5) return week.sat || ''
  return k === 'x' ? week.sun || '' : data.schedule.review || ''
}
const trackFor = (data, k, wd) => (k === 'pm' && wd === 6 ? data.schedule.tracks?.review : data.schedule.tracks?.[k]) || ''

function practiceCounts(data, st) {
  const pmIds = list(data.practice?.pm).map((f) => f.id)
  const out = {}
  for (const k of list(data.practice?.kinds)) out[k.id] = { all: 0, reviewed: 0, runs: 0 }
  for (const p of st.prac) {
    const c = out[p.k]
    if (!c) continue
    c.all += 1
    if (pmIds.every((f) => String(p[f] || '').trim())) c.reviewed += 1
  }
  // Drill runs count towards the practice area their category feeds.
  const feeds = Object.fromEntries(list(data.drills?.cats).filter((c) => c.counts).map((c) => [c.id, c.counts]))
  const catOf = Object.fromEntries([...list(data.drills?.list), ...st.custom].map((d) => [d.id, d.cat]))
  for (const [id, runs] of Object.entries(st.dr)) {
    const k = feeds[catOf[id]]
    if (k && out[k]) out[k].runs += list(runs).length
  }
  return out
}
const countFor = (kind, c) => (c ? (kind.needsPm ? c.reviewed : c.all) + c.runs : 0)

function reminders({ data, m, st, todayN }, w) {
  const out = []
  const started = todayN >= m.s
  const cw = Math.min(currentWeek(m, todayN), m.W)
  if (started) {
    const last = wdOf(todayN) === 6 ? cw : cw - 1
    const r = st.weeks[last] || {}
    if (last >= 1 && !r.wins && !r.gaps && !r.next) out.push({ id: 'review', t: fill(w.dueReview, { n: last }), view: 'plan', opts: { week: last } })
    if (!st.skAt) out.push({ id: 'skills', t: w.dueSkillsFirst, view: 'scores' })
    else if (todayN - dnum(st.skAt) >= 14) out.push({ id: 'skills', t: fill(w.dueSkills, { d: todayN - dnum(st.skAt) }), view: 'scores' })
    const behind = []
    for (let n = 1; n < cw; n++) if (!weekDone(st, n)) behind.push(n)
    if (behind.length) out.push({ id: 'weeks', t: fill(w.dueWeeks, { k: behind.length, list: behind.slice(0, 5).join(', ') + (behind.length > 5 ? '…' : '') }), view: 'plan', opts: { week: behind[0] } })
    const doneId = lastId(data.projects.statuses)
    for (const p of data.projects.list) {
      for (const x of p.milestones) {
        if (cw > x.to && st.ms[x.id]?.st !== doneId) out.push({ id: `ms-${x.id}`, t: fill(w.dueMs, { name: `${p.short}: ${x.name}`, n: x.to }), view: 'build' })
      }
    }
  }
  const dirty = st.changedAt && (!st.backupAt || st.changedAt > st.backupAt)
  if (dirty && (!st.backupAt || Date.now() - st.backupAt > 7 * DAY_MS)) out.push({ id: 'backup', t: st.backupAt ? w.dueBackup : w.dueBackupFirst, action: 'backup' })
  return out
}

// ── Today ───────────────────────────────────────────────────────────────

function DayCard({ n, onPick }) {
  const { data, m, todayN, stats, update, go } = useT()
  const w = useW()
  const head = useId()
  const d = stats.days[n - m.s]
  if (!d) return null
  const week = data.weeks[d.w - 1]
  const phase = phaseOf(data, d.w)
  const blocks = BLOCKS.filter((k) => d.plan[k])
  const set = (patch) => update((s) => patchIn(s, 'days', d.iso, patch))
  const dayName = fmtDay(n, { weekday: 'long' })
  return (
    <section className="pt-card pt-day" aria-labelledby={head}>
      <header className="pt-day-head">
        <button type="button" className="pt-arrow" aria-label={w.prevDay} disabled={n <= m.s} onClick={() => onPick(n - 1)}>‹</button>
        <div className="pt-day-title">
          <p className="pt-eyebrow">{n === todayN ? w.today : w.planDay} · {w.week} {d.w}</p>
          <h2 id={head}>{fmtDay(n, { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
          <p className="pt-muted">{phase?.name} · {w.day} {d.i + 1} {w.of} {m.D}</p>
        </div>
        <button type="button" className="pt-arrow" aria-label={w.nextDay} disabled={n >= m.e} onClick={() => onPick(n + 1)}>›</button>
      </header>
      <div className="pt-day-status">
        <StatusChip status={d.status} />
        <span className="pt-day-h">{fmtH(d.actual)} / {fmtH(d.full)}</span>
        {n !== todayN && todayN >= m.s && todayN <= m.e && (
          <button type="button" className="pt-link" onClick={() => onPick(todayN)}>{w.jumpToday}</button>
        )}
      </div>
      {week?.lighter && week.note && <p className="pt-note is-light"><b>{w.lighter}.</b> {week.note}</p>}
      <ul className="pt-blocks">
        {blocks.map((k) => (
          <li key={k} className={(Number(d.log[k]) || 0) >= d.plan[k] ? 'pt-block is-done' : 'pt-block'}>
            <div className="pt-block-head">
              <span className="pt-block-name">{data.schedule.blocks?.[k]}</span>
              <span className="pt-block-plan">{fmtH(d.plan[k])} · {trackFor(data, k, d.wd)}</span>
            </div>
            <p className="pt-block-topic"><Inline text={topicFor(data, week, d.wd, k)} /></p>
            {d.wd === 6 && k === 'pm' && week?.say && <p className="pt-say"><span>{w.sayIt}</span>“{week.say}”</p>}
            <Hours value={d.log[k]} planned={d.plan[k]} onChange={(h) => set({ [k]: h })} label={`${data.schedule.blocks?.[k]}, ${dayName}`} />
          </li>
        ))}
      </ul>
      {d.sched.out && <p className="pt-out"><span>{w.output}</span>{d.sched.out}</p>}
      <div className="pt-day-foot">
        <Check on={!!d.log.rest} onChange={(v) => set({ rest: v ? 1 : 0 })}>
          {w.restDay}<small>{w.restHint}</small>
        </Check>
        <Field key={d.iso} multiline rows={2} label={w.notes} placeholder={w.notesPh} value={d.log.note} onCommit={(v) => set({ note: v.trim() ? v : '' })} />
        {d.wd === 6 && <button type="button" className="pt-link" onClick={() => go('plan', { week: d.w, review: 1 })}>{w.writeReview} →</button>}
      </div>
    </section>
  )
}

function WeekCard({ n, preview, onPickDay, selected }) {
  const { data, m, stats, st, update, go } = useT()
  const w = useW()
  const week = data.weeks[n - 1]
  if (!week) return null
  const per = stats.per[n - 1]
  const rec = st.weeks[n] || {}
  const s0 = m.s + (n - 1) * 7
  const set = (patch) => update((s) => patchIn(s, 'weeks', String(n), patch))
  return (
    <section className="pt-card pt-weekcard">
      <p className="pt-eyebrow">{preview ? w.firstWeek : w.thisWeek} · {w.week} {n} · {fmtRange(s0, s0 + 6)}</p>
      <h2>{week.focus}</h2>
      {week.lighter && <p className="pt-tag is-light">{w.lighter}</p>}
      <dl className="pt-tracks">
        <div><dt>{w.trackDesign}</dt><dd>{week.design}</dd></div>
        <div><dt>{w.trackCoding}</dt><dd>{week.coding}</dd></div>
        <div><dt>{w.trackProject}</dt><dd>{week.project}</dd></div>
      </dl>
      {!preview && (
        <>
          <div className="pt-checks">
            <Check on={rec.d} onChange={(v) => set({ d: v ? 1 : 0 })}><b>{w.deliverable}:</b> {week.deliverable}</Check>
            <Check on={rec.c} onChange={(v) => set({ c: v ? 1 : 0 })}><b>{w.checkpoint}:</b> {week.checkpoint}</Check>
          </div>
          <div className="pt-week-hours">
            <span>{fmtH(per.actual)} <small>{w.of} {fmtH(per.planned)}</small></span>
            <Bar value={per.actual} max={per.planned} label={w.hoursLogged} />
          </div>
          <ol className="pt-dots">
            {Array.from({ length: 7 }, (_, i) => {
              const d = stats.days[s0 - m.s + i]
              return (
                <li key={i}>
                  <button type="button" className={`pt-dot is-${d.status}${selected === d.n ? ' is-sel' : ''}`}
                    aria-label={`${w.days[i]} ${fmtDay(d.n, { day: 'numeric', month: 'short' })}: ${w[`st_${d.status}`]}`}
                    aria-pressed={selected === d.n} onClick={() => onPickDay?.(d.n)}>{w.daysShort[i]}</button>
                </li>
              )
            })}
          </ol>
        </>
      )}
      <button type="button" className="pt-secondary" onClick={() => go('plan', { week: n })}>{w.openWeek} →</button>
    </section>
  )
}

function DueCard() {
  const ctx = useT()
  const w = useW()
  const items = reminders(ctx, w)
  return (
    <section className="pt-card pt-due">
      <h2>{w.due}{items.length > 0 && <span className="pt-count-chip">{items.length}</span>}</h2>
      {items.length ? (
        <ul>
          {items.map((it) => (
            <li key={it.id}>
              <span><Inline text={it.t} /></span>
              {it.action === 'backup'
                ? <button type="button" className="pt-mini is-blue" onClick={ctx.backup}>{w.saveBackup}</button>
                : <button type="button" className="pt-mini" onClick={() => ctx.go(it.view, it.opts)}>{w.goThere}</button>}
            </li>
          ))}
        </ul>
      ) : <p className="pt-muted">{w.nothingDue}</p>}
    </section>
  )
}

const Tile = ({ label, value, unit, sub, bar, tone }) => (
  <div className="pt-tile" data-tone={tone}>
    <span className="pt-tile-label">{label}</span>
    <span className="pt-tile-value">{value}{unit && <small> {unit}</small>}</span>
    {bar && <Bar value={bar[0]} max={bar[1]} label={label} tone={tone} />}
    {sub && <span className="pt-tile-sub">{sub}</span>}
  </div>
)

function paceNote(w, count, target, m, todayN) {
  if (todayN < m.s) return { text: '', tone: undefined }
  const expected = Math.round((target * clamp((todayN - m.s + 1) / 7, 0, m.W)) / m.W)
  const diff = count - expected
  const head = diff > 0 ? `${diff} ${w.ahead}` : diff < 0 ? `${-diff} ${w.behind}` : w.onPace
  return { text: `${head} · ${expected} ${w.expected}`, tone: diff < 0 ? 'warn' : 'ok' }
}

function Totals() {
  const { data, m, stats, st, todayN } = useT()
  const w = useW()
  const pc = practiceCounts(data, st)
  const weeksN = data.weeks.filter((wk) => weekDone(st, wk.n)).length
  const ms = data.projects.list.flatMap((p) => p.milestones)
  const msDone = ms.filter((x) => st.ms[x.id]?.st === lastId(data.projects.statuses)).length
  const ready = data.stories.list.filter((x) => st.stories[x.id]?.status === lastId(data.stories.statuses)).length
  const atTarget = data.skills.list.filter((x) => (st.sk[x.id]?.cur || 0) >= x.target).length
  const c = stats.counts
  return (
    <section className="pt-card pt-totals">
      <h2>{w.totals}</h2>
      <div className="pt-tiles">
        <Tile label={w.hoursLogged} value={fmtH(stats.actualToDate)} bar={[stats.actualToDate, stats.toDate]}
          sub={`${fmtH(stats.toDate)} ${w.plannedToDate} · ${fmtH(stats.planned)} ${w.planTotal}`} />
        <Tile label={w.streak} value={stats.streak} unit={dayWord(w, stats.streak)} sub={`${w.best} ${stats.best}`} />
        <Tile label={w.dayCounts} value={c.done} unit={w.st_done.toLowerCase()}
          sub={`${c.partial} ${w.st_partial.toLowerCase()} · ${c.missed} ${w.st_missed.toLowerCase()} · ${c.rest} ${w.st_rest.toLowerCase()}`} />
        <Tile label={w.weeksDone} value={weeksN} unit={`/ ${m.W}`} bar={[weeksN, m.W]} />
        <Tile label={w.msDone} value={msDone} unit={`/ ${ms.length}`} bar={[msDone, ms.length]} />
        {list(data.practice?.kinds).map((k) => {
          const n = countFor(k, pc[k.id])
          const pace = paceNote(w, n, k.target, m, todayN)
          return <Tile key={k.id} label={k.label} value={n} unit={`/ ${k.target}`} bar={[n, k.target]} tone={pace.tone} sub={pace.text} />
        })}
        <Tile label={w.storiesReady} value={ready} unit={`/ ${data.stories.list.length}`} bar={[ready, data.stories.list.length]} />
        <Tile label={w.skillsAtTarget} value={atTarget} unit={`/ ${data.skills.list.length}`} bar={[atTarget, data.skills.list.length]} />
      </div>
    </section>
  )
}

function Countdown() {
  const { data, m, todayN, stats } = useT()
  const w = useW()
  const left = m.s - todayN
  const problems = new Set(data.weeks.flatMap((wk) => [...list(wk.dsa), ...list(wk.sql)].map((p) => p.s))).size
  return (
    <section className="pt-card pt-countdown">
      <p className="pt-eyebrow">{fill(w.startsIn, { date: fmtDay(m.s, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) })}</p>
      <p className="pt-count">{left === 1 ? w.dayToGo : fill(w.daysToGo, { n: left })}</p>
      {data.meta.subtitle && <p className="pt-lead"><Inline text={data.meta.subtitle} /></p>}
      <h3>{w.glance}</h3>
      <ul className="pt-glance">
        <li><b>{m.W}</b>{w.glanceWeeks}</li>
        <li><b>{stats.planned}</b>{w.glanceHours}</li>
        <li><b>{problems}</b>{w.glanceProblems}</li>
        <li><b>{data.projects.list.flatMap((p) => p.milestones).length}</b>{w.glanceMilestones}</li>
        <li><b>{data.stories.list.length}</b>{w.glanceStories}</li>
        <li><b>{data.drills.list.length}</b>{w.glanceDrills}</li>
      </ul>
    </section>
  )
}

function SetupCard() {
  const { data, st, update } = useT()
  const items = list(data.setup?.items)
  if (!items.length) return null
  const doneN = items.filter((it) => st.setup[it.id]).length
  const toggle = (id, v) => update((s) => {
    const setup = { ...s.setup }
    if (v) setup[id] = 1
    else delete setup[id]
    return { ...s, setup }
  })
  return (
    <section className="pt-card pt-setup">
      <h2>{data.setup.title}<span className="pt-count-chip">{doneN}/{items.length}</span></h2>
      <Bar value={doneN} max={items.length} label={data.setup.title} />
      <ul className="pt-checklist">
        {items.map((it) => <li key={it.id}><Check on={st.setup[it.id]} onChange={(v) => toggle(it.id, v)}><Inline text={it.t} /></Check></li>)}
      </ul>
    </section>
  )
}

function TodayView() {
  const { m, todayN, st, data } = useT()
  const w = useW()
  const pre = todayN < m.s
  const post = todayN > m.e
  const anchor = clamp(todayN, m.s, m.e)
  const [sel, setSel] = useState(anchor)
  useEffect(() => { setSel(anchor) }, [anchor])
  if (pre) {
    return (
      <div className="pt-grid2">
        <div className="pt-col"><Countdown /><SetupCard /></div>
        <div className="pt-col"><WeekCard n={1} preview /><DueCard /></div>
      </div>
    )
  }
  const selWeek = Math.floor((sel - m.s) / 7) + 1
  const setupLeft = list(data.setup?.items).some((it) => !st.setup[it.id])
  return (
    <>
      {post && <p className="pt-banner is-good">{fill(w.finished, { W: m.W })}</p>}
      <div className="pt-grid2">
        <div className="pt-col"><DayCard n={sel} onPick={setSel} />{currentWeek(m, todayN) === 1 && setupLeft && <SetupCard />}</div>
        <div className="pt-col"><WeekCard n={selWeek} onPickDay={setSel} selected={sel} /><DueCard /></div>
      </div>
      <Totals />
    </>
  )
}

// ── The weeks ───────────────────────────────────────────────────────────

function ProblemList({ items, kind, title }) {
  const { data, st, update, todayN } = useT()
  const w = useW()
  const have = new Set(st.prac.map((p) => p.u))
  const urlOf = (slug) => fill(data.practice?.problemUrl, { s: slug })
  const add = (p, u) => update((s) => ({ ...s, prac: [{ id: uid(), d: diso(todayN), k: kind, t: p.t, u }, ...s.prac] }))
  return (
    <div className="pt-probs">
      <h4>{title}</h4>
      <ul>
        {items.map((p) => {
          const u = urlOf(p.s)
          const has = have.has(u)
          return (
            <li key={p.s}>
              <a href={u} target="_blank" rel="noopener noreferrer">{p.t}</a>
              <span className={`pt-diff is-${String(p.d).toLowerCase()}`}>{p.d}</span>
              <button type="button" className={has ? 'pt-mini is-on' : 'pt-mini'} disabled={has} onClick={() => add(p, u)}>{has ? w.logged : w.log}</button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function WeekDetail({ n, id }) {
  const { data, m, st, update, stats } = useT()
  const w = useW()
  const wk = data.weeks[n - 1]
  const rec = st.weeks[n] || {}
  const set = (patch) => update((s) => patchIn(s, 'weeks', String(n), patch))
  const text = (k) => (v) => set({ [k]: v.trim() ? v : '' })
  const s0 = m.s + (n - 1) * 7
  return (
    <div className="pt-weekdetail" id={id}>
      {wk.lighter && wk.note && <p className="pt-note is-light"><b>{w.lighter}.</b> {wk.note}</p>}
      <dl className="pt-tracks is-row">
        <div><dt>{w.trackDesign}</dt><dd>{wk.design}</dd></div>
        <div><dt>{w.trackCoding}</dt><dd>{wk.coding}</dd></div>
        <div><dt>{w.trackProject}</dt><dd>{wk.project}</dd></div>
      </dl>
      <div className="pt-checks">
        <Check on={rec.d} onChange={(v) => set({ d: v ? 1 : 0 })}><b>{w.deliverable}:</b> {wk.deliverable}</Check>
        <Check on={rec.c} onChange={(v) => set({ c: v ? 1 : 0 })}><b>{w.checkpoint}:</b> {wk.checkpoint}</Check>
      </div>
      <Field label={w.evidence} placeholder={w.evidencePh} value={rec.ev} onCommit={(v) => set({ ev: v.trim() })} type="url" inputMode="url" />
      <h3>{w.dayPlan}</h3>
      <ol className="pt-daylist">
        {data.schedule.days.map((sd, i) => {
          const d = stats.days[s0 - m.s + i]
          return (
            <li key={i} className={`pt-dayrow is-${d.status}`}>
              <div className="pt-dayrow-head">
                <b>{w.days[i]}</b><span>{fmtDay(d.n, { day: 'numeric', month: 'short' })}</span><StatusChip status={d.status} />
              </div>
              <ul>
                {BLOCKS.filter((k) => sd.plan?.[k]).map((k) => (
                  <li key={k}>
                    <span className="pt-dayrow-k">{data.schedule.blocks?.[k]} · {fmtH(sd.plan[k])}</span>
                    <Inline text={topicFor(data, wk, i, k)} />
                  </li>
                ))}
              </ul>
              {sd.out && <p className="pt-dayrow-out">{w.output}: {sd.out}</p>}
            </li>
          )
        })}
      </ol>
      <div className="pt-saybox">
        <p className="pt-say"><span>{w.sayIt}</span>“{wk.say}”</p>
        <Timer minutes={15} />
      </div>
      {(list(wk.dsa).length > 0 || list(wk.sql).length > 0) && (
        <>
          <h3>{w.problems}</h3>
          <div className="pt-probs-cols">
            {list(wk.dsa).length > 0 && <ProblemList items={wk.dsa} kind="dsa" title={w.dsa} />}
            {list(wk.sql).length > 0 && <ProblemList items={wk.sql} kind="sql" title={w.sql} />}
          </div>
        </>
      )}
      {list(wk.read).length > 0 && (
        <>
          <h3>{w.reading}</h3>
          <ul className="pt-links">{wk.read.map((r) => <li key={r.u}><a href={r.u} target="_blank" rel="noopener noreferrer">{r.t}</a></li>)}</ul>
        </>
      )}
      <h3 id={`pt-review-${n}`} className="pt-anchor">{w.review}</h3>
      <div className="pt-review">
        <Field multiline rows={3} label={w.wins} value={rec.wins} onCommit={text('wins')} />
        <Field multiline rows={3} label={w.gaps} value={rec.gaps} onCommit={text('gaps')} />
        <Field multiline rows={3} label={w.next} value={rec.next} onCommit={text('next')} />
      </div>
    </div>
  )
}

function PlanView({ focus, nonce }) {
  const { data, m, todayN, stats, st } = useT()
  const w = useW()
  const cw = currentWeek(m, todayN)
  const [open, setOpen] = useState(focus?.week || clamp(cw, 1, m.W))
  const rows = useRef({})
  useEffect(() => {
    if (!focus?.week) return undefined
    setOpen(focus.week)
    const t = setTimeout(() => {
      const el = focus.review ? document.getElementById(`pt-review-${focus.week}`) : rows.current[focus.week]
      el?.scrollIntoView({ behavior: smooth(), block: 'start' })
    }, 80)
    return () => clearTimeout(t)
  }, [focus?.week, focus?.review, nonce])
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: smooth(), block: 'start' })
  return (
    <div className="pt-plan">
      <div className="pt-phases">
        {data.phases.map((p) => {
          const total = p.to - p.from + 1
          const doneN = data.weeks.filter((wk) => wk.n >= p.from && wk.n <= p.to && weekDone(st, wk.n)).length
          return (
            <button key={p.id} type="button" className={cw >= p.from && cw <= p.to ? 'pt-phase-chip is-now' : 'pt-phase-chip'} onClick={() => jump(`pt-phase-${p.id}`)}>
              <span className="pt-phase-name">{p.name}</span>
              <span className="pt-phase-weeks">{w.weeks} {p.from}–{p.to} · {doneN}/{total}</span>
              <Bar value={doneN} max={total} label={p.name} />
            </button>
          )
        })}
      </div>
      {data.phases.map((p) => (
        <section key={p.id} className="pt-phase" id={`pt-phase-${p.id}`}>
          <header className="pt-phase-head">
            <p className="pt-eyebrow">{w.weeks} {p.from}–{p.to} · {fmtRange(m.s + (p.from - 1) * 7, m.s + p.to * 7 - 1)}</p>
            <h2>{p.name}</h2>
            <p className="pt-muted">{p.blurb}</p>
          </header>
          <ol className="pt-weeks">
            {data.weeks.filter((wk) => wk.n >= p.from && wk.n <= p.to).map((wk) => {
              const s0 = m.s + (wk.n - 1) * 7
              const per = stats.per[wk.n - 1]
              const complete = weekDone(st, wk.n)
              const isNow = wk.n === cw
              const isOpen = open === wk.n
              return (
                <li key={wk.n} ref={(el) => { rows.current[wk.n] = el }} className={isOpen ? 'pt-weekitem is-open' : 'pt-weekitem'}>
                  <button type="button" className="pt-weekrow" aria-expanded={isOpen} aria-controls={`pt-week-${wk.n}`} onClick={() => setOpen(isOpen ? 0 : wk.n)}>
                    <span className={`pt-weekno${complete ? ' is-done' : isNow ? ' is-now' : ''}`}>{complete ? '✓' : wk.n}</span>
                    <span className="pt-weekrow-main">
                      <span className="pt-weekrow-title">{wk.focus}</span>
                      <span className="pt-weekrow-sub">{fmtRange(s0, s0 + 6)} · {wk.deliverable}</span>
                    </span>
                    <span className="pt-weekrow-tags">
                      {isNow && <span className="pt-tag is-now">{w.now}</span>}
                      {wk.lighter && <span className="pt-tag is-light">{w.lighter}</span>}
                      {!complete && wk.n < cw && <span className="pt-tag is-warn">{w.overdue}</span>}
                      {complete && <span className="pt-tag is-good">{w.complete}</span>}
                    </span>
                    <span className="pt-weekrow-h">{fmtH(per.actual)}<small> / {per.planned}</small></span>
                    <span className="pt-chev" aria-hidden="true">▾</span>
                  </button>
                  {isOpen && <WeekDetail n={wk.n} id={`pt-week-${wk.n}`} />}
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}

// ── Log ─────────────────────────────────────────────────────────────────

const heatLevel = (d) => {
  if (d.status === 'done') return d.actual >= d.full * 1.5 ? 4 : 3
  if (d.status === 'partial') return d.actual >= d.full / 2 ? 2 : 1
  return 0
}

function LogView() {
  const { m, todayN, stats } = useT()
  const w = useW()
  const [sel, setSel] = useState(clamp(todayN, m.s, m.e))
  const c = stats.counts
  const judged = c.done + c.partial + c.missed
  const maxWeek = Math.max(1, ...stats.per.map((p) => Math.max(p.planned, p.actual)))
  return (
    <>
      <section className="pt-card pt-heatcard">
        <h2>{w.heat}</h2>
        <div className="pt-heat-scroll">
          <div className="pt-heat" style={{ '--pt-cols': m.W }}>
            <span aria-hidden="true" />
            {Array.from({ length: m.W }, (_, i) => <span key={`w${i}`} className="pt-heat-wk" aria-hidden="true">{i + 1}</span>)}
            {w.daysShort.map((label, r) => (
              <React.Fragment key={r}>
                <span className="pt-heat-dl" aria-hidden="true">{label}</span>
                {Array.from({ length: m.W }, (_, col) => {
                  const d = stats.days[col * 7 + r]
                  return (
                    <button key={col} type="button" data-l={heatLevel(d)} aria-pressed={d.n === sel}
                      className={`pt-cell is-${d.status}${d.n === todayN ? ' is-today' : ''}${d.n === sel ? ' is-sel' : ''}`}
                      aria-label={`${fmtDay(d.n, { weekday: 'short', day: 'numeric', month: 'short' })}: ${w[`st_${d.status}`]}, ${fmtH(d.actual)}`}
                      onClick={() => setSel(d.n)} />
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
        <ul className="pt-legend" aria-label={w.legend}>
          {['done', 'partial', 'missed', 'rest', 'future'].map((k) => (
            <li key={k}><span className={`pt-cell is-${k}`} data-l={k === 'done' ? 3 : k === 'partial' ? 2 : 0} aria-hidden="true" />{w[`st_${k}`]}</li>
          ))}
        </ul>
        <div className="pt-tiles is-compact">
          <Tile label={w.hoursLogged} value={fmtH(stats.actualToDate)} sub={`${fmtH(stats.toDate)} ${w.plannedToDate}`} />
          <Tile label={w.consistency} value={judged ? `${Math.round(((c.done + c.partial) / judged) * 100)}%` : '—'}
            sub={`${c.done} ${w.st_done.toLowerCase()} · ${c.partial} ${w.st_partial.toLowerCase()} · ${c.missed} ${w.st_missed.toLowerCase()} · ${c.rest} ${w.st_rest.toLowerCase()}`} />
          <Tile label={w.streak} value={stats.streak} unit={dayWord(w, stats.streak)} sub={`${w.best} ${stats.best}`} />
        </div>
      </section>
      <div className="pt-grid2">
        <div className="pt-col"><DayCard n={sel} onPick={setSel} /></div>
        <div className="pt-col">
          <section className="pt-card">
            <h2>{w.hoursByWeek}</h2>
            <ol className="pt-bars">
              {stats.per.map((p, i) => (
                <li key={i}>
                  <span className="pt-bars-n">{i + 1}</span>
                  <span className="pt-bars-track" aria-hidden="true">
                    <span className="pt-bars-plan" style={{ width: `${(p.planned / maxWeek) * 100}%` }} />
                    <span className="pt-bars-act" style={{ width: `${(p.actual / maxWeek) * 100}%` }} />
                  </span>
                  <span className="pt-bars-v">{fmtH(p.actual)} <small>/ {p.planned}</small></span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  )
}

// ── Projects ────────────────────────────────────────────────────────────

const safeUrl = (u) => (/^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '')

function Milestone({ x, cw }) {
  const { data, st, update } = useT()
  const w = useW()
  const statuses = data.projects.statuses
  const first = statuses[0]?.id
  const doneId = lastId(statuses)
  const rec = st.ms[x.id] || {}
  const status = rec.st || first
  const tone = statuses.find((s) => s.id === status)?.tone
  const ticks = rec.t || {}
  const tickedN = x.tasks.filter((_, i) => ticks[i]).length
  const set = (patch) => update((s) => patchIn(s, 'ms', x.id, patch))
  const tick = (i, v) => update((s) => {
    const cur = s.ms[x.id] || {}
    const t = { ...(cur.t || {}) }
    if (v) t[i] = 1
    else delete t[i]
    // Ticking the first task moves "not started" on to the next status.
    const next = v && (!cur.st || cur.st === first) ? statuses[1]?.id : cur.st
    return patchIn(s, 'ms', x.id, { t, st: next === first ? '' : next })
  })
  const due = cw < x.from ? { t: fill(w.upcoming, { n: x.from }), tone: 'future' }
    : cw <= x.to ? { t: w.inWindow, tone: 'now' } : { t: w.lateBy, tone: 'warn' }
  return (
    <article className="pt-ms" data-tone={tone}>
      <header className="pt-ms-head">
        <h3>{x.name}</h3>
        <span className="pt-tag">{x.from === x.to ? fill(w.weekTag, { a: x.from }) : fill(w.weeksTag, { a: x.from, b: x.to })}</span>
        {status !== doneId && cw > 0 && <span className={`pt-tag is-${due.tone}`}>{due.t}</span>}
      </header>
      <Seg value={status} label={`${w.status}: ${x.name}`} options={statuses} onChange={(v) => set({ st: v === first ? '' : v })} />
      <p className="pt-muted">{w.tasks}: {tickedN}/{x.tasks.length}</p>
      <ul className="pt-checklist">
        {x.tasks.map((t, i) => <li key={i}><Check on={ticks[i]} onChange={(v) => tick(i, v)}>{t}</Check></li>)}
      </ul>
      {tickedN === x.tasks.length && status !== doneId && (
        <button type="button" className="pt-mini is-blue" onClick={() => set({ st: doneId })}>{w.allTicked}</button>
      )}
      <div className="pt-chips" aria-label={w.stack}>{x.stack.map((s) => <span key={s} className="pt-chip">{s}</span>)}</div>
      <Field label={w.evidence} placeholder={w.evidencePh} value={rec.ev} type="url" inputMode="url" onCommit={(v) => set({ ev: v.trim() })} />
      <Field multiline rows={2} label={w.risks} value={rec.note} onCommit={(v) => set({ note: v.trim() ? v : '' })} />
    </article>
  )
}

function ProjectsView() {
  const { data, m, todayN, st } = useT()
  const w = useW()
  const cw = currentWeek(m, todayN)
  const all = data.projects.list.flatMap((p) => p.milestones)
  const doneN = all.filter((x) => st.ms[x.id]?.st === lastId(data.projects.statuses)).length
  return (
    <>
      <section className="pt-card pt-intro">
        <div className="pt-intro-row">
          <h2>{w.msDone}</h2>
          <span className="pt-big">{doneN}<small> / {all.length}</small></span>
        </div>
        <Bar value={doneN} max={all.length} label={w.msDone} />
        {data.projects.note && <p className="pt-muted"><Inline text={data.projects.note} /></p>}
      </section>
      {data.projects.list.map((p) => (
        <section key={p.id} className="pt-card pt-project">
          <header className="pt-project-head">
            <p className="pt-eyebrow">{p.short}</p>
            <h2>{p.name}</h2>
            {p.blurb && <p className="pt-muted"><Inline text={p.blurb} /></p>}
          </header>
          <div className="pt-ms-list">{p.milestones.map((x) => <Milestone key={x.id} x={x} cw={cw} />)}</div>
        </section>
      ))}
    </>
  )
}

// ── Practice log ────────────────────────────────────────────────────────

function AddPractice() {
  const { data, update, todayN } = useT()
  const w = useW()
  const kinds = list(data.practice?.kinds)
  const fields = list(data.practice?.pm)
  const fresh = (k) => ({ k: k || kinds[0]?.id || '', t: '', u: '', d: diso(todayN), err: false, why: '', ...Object.fromEntries(fields.map((f) => [f.id, ''])) })
  const [f, setF] = useState(() => fresh())
  const set = (key) => (event) => { const value = event.target.value; setF((x) => ({ ...x, [key]: value })) }
  const submit = (event) => {
    event.preventDefault()
    if (!f.t.trim()) return
    const entry = tidy({
      id: uid(), k: f.k, t: f.t.trim(), u: safeUrl(f.u), d: isIso(f.d) ? f.d : diso(todayN), err: f.err ? 1 : 0, why: f.err ? f.why.trim() : '',
      ...Object.fromEntries(fields.map((x) => [x.id, f[x.id].trim()])),
    })
    update((s) => ({ ...s, prac: [entry, ...s.prac] }))
    setF(fresh(f.k))
  }
  return (
    <section className="pt-card pt-add">
      <h2>{w.addEntry}</h2>
      <form onSubmit={submit} className="pt-form">
        <Seg value={f.k} label={w.kind} options={kinds.map((k) => ({ id: k.id, label: k.label }))} onChange={(k) => setF((x) => ({ ...x, k }))} />
        <div className="pt-form-row">
          <label className="pt-field"><span className="pt-field-label">{w.titleF}</span><input required value={f.t} onChange={set('t')} autoComplete="off" /></label>
          <label className="pt-field is-narrow"><span className="pt-field-label">{w.date}</span><input type="date" value={f.d} onChange={set('d')} /></label>
        </div>
        <label className="pt-field"><span className="pt-field-label">{w.link}</span><input type="url" inputMode="url" placeholder={w.evidencePh} value={f.u} onChange={set('u')} /></label>
        <fieldset className="pt-pm">
          <legend>{w.postMortem}</legend>
          {fields.map((x) => (
            <label key={x.id} className="pt-field"><span className="pt-field-label">{x.label}</span><textarea rows={2} value={f[x.id]} onChange={set(x.id)} /></label>
          ))}
        </fieldset>
        <Check on={f.err} onChange={(v) => setF((x) => ({ ...x, err: v }))}>{w.mistake}</Check>
        {f.err && <label className="pt-field"><span className="pt-field-label">{w.why}</span><textarea rows={2} value={f.why} onChange={set('why')} /></label>}
        <button type="submit" className="pt-primary" disabled={!f.t.trim()}>{w.add}</button>
      </form>
    </section>
  )
}

function PracticeEntry({ p }) {
  const { data, update } = useT()
  const w = useW()
  const [open, setOpen] = useState(false)
  const kind = list(data.practice?.kinds).find((k) => k.id === p.k)
  const fields = list(data.practice?.pm)
  const filled = fields.filter((f) => String(p[f.id] || '').trim()).length
  const patch = (obj) => update((s) => ({ ...s, prac: s.prac.map((x) => (x.id === p.id ? tidy({ ...x, ...obj }) : x)) }))
  const remove = () => update((s) => ({ ...s, prac: s.prac.filter((x) => x.id !== p.id) }))
  const link = safeUrl(p.u)
  return (
    <li className={p.err ? 'pt-entry is-err' : 'pt-entry'}>
      <button type="button" className="pt-entry-row" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="pt-tag">{kind?.label || p.k}</span>
        <span className="pt-entry-title">{p.t}</span>
        <span className="pt-entry-meta">
          {isIso(p.d) ? fmtDay(dnum(p.d), { day: 'numeric', month: 'short' }) : ''}
          {kind?.needsPm ? ` · ${w.postMortem} ${filled}/${fields.length}` : ''}
          {p.err ? ` · ${w.errorLog}` : ''}
        </span>
        <span className="pt-chev" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="pt-entry-body">
          {link && <a href={link} target="_blank" rel="noopener noreferrer" className="pt-link">{link}</a>}
          {fields.map((f) => <Field key={f.id} multiline rows={2} label={f.label} value={p[f.id]} onCommit={(v) => patch({ [f.id]: v.trim() })} />)}
          <Check on={!!p.err} onChange={(v) => patch({ err: v ? 1 : 0 })}>{w.mistake}</Check>
          {p.err ? <Field multiline rows={2} label={w.why} value={p.why} onCommit={(v) => patch({ why: v.trim() })} /> : null}
          <DeleteButton onDelete={remove} />
        </div>
      )}
    </li>
  )
}

function PracticeView() {
  const { data, st, m, todayN } = useT()
  const w = useW()
  const kinds = list(data.practice?.kinds)
  const pmIds = list(data.practice?.pm).map((f) => f.id)
  const pc = practiceCounts(data, st)
  const [filter, setFilter] = useState('all')
  const needsPm = (p) => kinds.find((k) => k.id === p.k)?.needsPm && !pmIds.every((f) => String(p[f] || '').trim())
  const pmCount = st.prac.filter(needsPm).length
  const errCount = st.prac.filter((p) => p.err).length
  const shown = st.prac
    .filter((p) => (filter === 'all' ? true : filter === 'pm' ? needsPm(p) : filter === 'err' ? p.err : p.k === filter))
    .slice()
    .sort((a, b) => String(b.d || '').localeCompare(String(a.d || '')))
  return (
    <>
      <section className="pt-card">
        {data.practice?.note && <p className="pt-muted"><Inline text={data.practice.note} /></p>}
        <div className="pt-tiles">
          {kinds.map((k) => {
            const c = pc[k.id]
            const n = countFor(k, c)
            const pace = paceNote(w, n, k.target, m, todayN)
            const extra = k.needsPm ? fill(w.reviewedOf, { a: c.reviewed, b: c.all }) : c.runs ? fill(w.includesRuns, { n: c.runs }) : ''
            return <Tile key={k.id} label={k.label} value={n} unit={`/ ${k.target}`} bar={[n, k.target]} tone={pace.tone} sub={[pace.text, extra].filter(Boolean).join(' · ')} />
          })}
        </div>
      </section>
      <AddPractice />
      <section className="pt-card">
        <Seg className="pt-filter" value={filter} label={w.kind} onChange={setFilter} options={[
          { id: 'all', label: `${w.all} (${st.prac.length})` },
          ...kinds.map((k) => ({ id: k.id, label: k.label })),
          { id: 'pm', label: `${w.needsPm} (${pmCount})` },
          { id: 'err', label: `${w.errorLog} (${errCount})` },
        ]} />
        {shown.length ? <ul className="pt-entries">{shown.map((p) => <PracticeEntry key={p.id} p={p} />)}</ul> : <p className="pt-muted">{w.noEntries}</p>}
      </section>
    </>
  )
}

// ── Drills ──────────────────────────────────────────────────────────────

function DrillCard({ d }) {
  const { data, st, update, todayN } = useT()
  const w = useW()
  const cat = list(data.drills?.cats).find((c) => c.id === d.cat)
  const runs = list(st.dr[d.id])
  const covers = list(d.covers)
  const [ticks, setTicks] = useState({})
  const [rating, setRating] = useState(null)
  const [note, setNote] = useState('')
  const covered = covers.filter((c) => ticks[c]).length
  const avg = runs.length ? (sum(runs.map((r) => r.r)) / runs.length).toFixed(1) : null
  const save = () => {
    if (!rating) return
    const run = tidy({ d: diso(todayN), r: rating, c: covered, of: covers.length, n: note.trim() })
    update((s) => ({ ...s, dr: { ...s.dr, [d.id]: [run, ...list(s.dr[d.id])].slice(0, 60) } }))
    setTicks({})
    setRating(null)
    setNote('')
  }
  const removeCustom = () => update((s) => {
    const dr = { ...s.dr }
    delete dr[d.id]
    return { ...s, custom: s.custom.filter((c) => c.id !== d.id), dr }
  })
  return (
    <article className="pt-card pt-drill">
      <header className="pt-drill-head">
        <span className="pt-tag">{cat?.label || d.cat}</span>
        {runs.length > 0 && (
          <span className="pt-muted">
            {runs.length} {w.practised} · {fill(w.lastRun, { d: fmtDay(dnum(runs[0].d), { day: 'numeric', month: 'short' }) })} · {w.avg} {avg}/5
          </span>
        )}
      </header>
      <p className="pt-drill-q">{d.prompt}</p>
      <Timer minutes={d.mins || cat?.mins || 15} />
      {covers.length > 0 && (
        <div className="pt-covers">
          <div className="pt-chips">
            {covers.map((c) => (
              <button key={c} type="button" aria-pressed={!!ticks[c]} className={ticks[c] ? 'pt-chip is-on' : 'pt-chip'}
                onClick={() => setTicks((t) => ({ ...t, [c]: !t[c] }))}>{ticks[c] ? '✓ ' : ''}{c}</button>
            ))}
          </div>
          <p className="pt-muted">{fill(w.covered, { a: covered, b: covers.length })}</p>
        </div>
      )}
      <div className="pt-drill-log">
        <div>
          <span className="pt-field-label">{w.rating}</span>
          <Seg value={rating} label={`${w.rating}: ${d.prompt}`} options={[1, 2, 3, 4, 5].map((n) => ({ id: n, label: String(n) }))} onChange={setRating} />
        </div>
        <label className="pt-field"><span className="pt-field-label">{w.runNote}</span><input value={note} onChange={(e) => setNote(e.target.value)} autoComplete="off" /></label>
        <button type="button" className="pt-primary" disabled={!rating} onClick={save}>{w.saveRun}</button>
      </div>
      {runs.length > 0 && (
        <ol className="pt-runs">
          {runs.slice(0, 5).map((r, i) => (
            <li key={i}>
              <b>{r.r}/5</b> {fmtDay(dnum(r.d), { day: 'numeric', month: 'short' })}
              {r.of ? ` · ${fill(w.covered, { a: r.c || 0, b: r.of })}` : ''}{r.n ? ` · ${r.n}` : ''}
            </li>
          ))}
        </ol>
      )}
      {d.custom && <DeleteButton onDelete={removeCustom} />}
    </article>
  )
}

function AddDrill() {
  const { data, update } = useT()
  const w = useW()
  const cats = list(data.drills?.cats)
  const [cat, setCat] = useState(cats[0]?.id)
  const [prompt, setPrompt] = useState('')
  const [covers, setCovers] = useState('')
  const submit = (event) => {
    event.preventDefault()
    if (!prompt.trim()) return
    const item = {
      id: `c-${uid()}`, cat, prompt: prompt.trim(),
      covers: covers.split(',').map((s) => s.trim()).filter(Boolean),
      mins: cats.find((c) => c.id === cat)?.mins,
    }
    update((s) => ({ ...s, custom: [...s.custom, item] }))
    setPrompt('')
    setCovers('')
  }
  return (
    <section className="pt-card pt-add">
      <h2>{w.addDrill}</h2>
      <form className="pt-form" onSubmit={submit}>
        <Seg value={cat} label={w.category} options={cats.map((c) => ({ id: c.id, label: c.label }))} onChange={setCat} />
        <label className="pt-field"><span className="pt-field-label">{w.prompt}</span><textarea rows={2} required value={prompt} onChange={(e) => setPrompt(e.target.value)} /></label>
        <label className="pt-field"><span className="pt-field-label">{w.coversF}</span><input value={covers} onChange={(e) => setCovers(e.target.value)} autoComplete="off" /></label>
        <button type="submit" className="pt-primary" disabled={!prompt.trim()}>{w.add}</button>
      </form>
    </section>
  )
}

function DrillsView() {
  const { data, st } = useT()
  const w = useW()
  const cats = list(data.drills?.cats)
  const [cat, setCat] = useState('all')
  const all = [...list(data.drills?.list), ...st.custom.map((c) => ({ ...c, custom: true }))]
  const shown = cat === 'all' ? all : all.filter((d) => d.cat === cat)
  return (
    <>
      <section className="pt-card">
        {data.drills?.note && <p className="pt-muted"><Inline text={data.drills.note} /></p>}
        <Seg className="pt-filter" value={cat} label={w.category} onChange={setCat}
          options={[{ id: 'all', label: `${w.all} (${all.length})` }, ...cats.map((c) => ({ id: c.id, label: c.label }))]} />
      </section>
      <div className="pt-drills">{shown.map((d) => <DrillCard key={d.id} d={d} />)}</div>
      <AddDrill />
    </>
  )
}

// ── Stories ─────────────────────────────────────────────────────────────

const wordCount = (text) => String(text || '').trim().match(/\S+/g)?.length || 0

function StoryCard({ story, open, onToggle }) {
  const { data, st, update } = useT()
  const w = useW()
  const statuses = data.stories.statuses
  const first = statuses[0]?.id
  const rec = st.stories[story.id] || {}
  const status = rec.status || first
  const current = statuses.find((s) => s.id === status)
  const fields = list(data.stories.fields)
  const wordsN = fields.filter((f) => !f.short).reduce((a, f) => a + wordCount(rec[f.id]), 0)
  const set = (patch) => update((s) => patchIn(s, 'stories', story.id, patch))
  // Writing anything moves a story from its first status to the second.
  const commitField = (id) => (v) => update((s) => {
    const cur = s.stories[story.id] || {}
    const patch = { [id]: v.trim() ? v : '' }
    if (v.trim() && (!cur.status || cur.status === first)) patch.status = statuses[1]?.id
    return patchIn(s, 'stories', story.id, patch)
  })
  return (
    <li className={open ? 'pt-story is-open' : 'pt-story'}>
      <button type="button" className="pt-story-row" aria-expanded={open} onClick={onToggle}>
        <span className="pt-story-name">{story.name}</span>
        <span className="pt-tag" data-tone={current?.tone}>{current?.label}</span>
        <span className="pt-story-words">{wordsN} {w.words}</span>
        <span className="pt-chev" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="pt-story-body">
          {story.hint && <p className="pt-note"><b>{w.hint}:</b> {story.hint}</p>}
          <Seg value={status} label={`${w.status}: ${story.name}`} options={statuses} onChange={(v) => set({ status: v === first ? '' : v })} />
          <div className="pt-story-fields">
            {fields.map((f) => (
              <Field key={f.id} multiline={!f.short} rows={f.rows || 3} label={f.label} value={rec[f.id]}
                onCommit={commitField(f.id)} className={f.short ? 'is-short' : undefined} />
            ))}
          </div>
          <div className="pt-story-foot">
            <span className="pt-muted">{wordsN} {w.words} · {w.aim}</span>
            <Timer minutes={2} />
          </div>
        </div>
      )}
    </li>
  )
}

function StoriesView() {
  const { data, st } = useT()
  const [open, setOpen] = useState(null)
  const statuses = data.stories.statuses
  const counts = statuses.map((s) => ({ ...s, n: data.stories.list.filter((x) => (st.stories[x.id]?.status || statuses[0].id) === s.id).length }))
  return (
    <>
      <section className="pt-card pt-intro">
        <div className="pt-statusbar">{counts.map((c) => <span key={c.id} className="pt-tag" data-tone={c.tone}>{c.label}: {c.n}</span>)}</div>
        {data.stories.note && <p className="pt-muted"><Inline text={data.stories.note} /></p>}
      </section>
      <ul className="pt-stories">
        {data.stories.list.map((s) => <StoryCard key={s.id} story={s} open={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} />)}
      </ul>
    </>
  )
}

// ── Skills ──────────────────────────────────────────────────────────────

function SkillRow({ sk }) {
  const { data, st, update, todayN } = useT()
  const w = useW()
  const rec = st.sk[sk.id] || {}
  const hist = st.skHist.map((h) => h.s?.[sk.id]).filter(Boolean)
  const set = (patch) => update((s) => patchIn(s, 'sk', sk.id, patch))
  const ok = (rec.cur || 0) >= sk.target
  return (
    <article className="pt-card pt-skill" data-ok={ok ? '1' : undefined}>
      <header className="pt-skill-head">
        <h3>{sk.name}</h3>
        <span className="pt-tag">{w.target} {sk.target}</span>
        {rec.cur ? <span className={ok ? 'pt-tag is-good' : 'pt-tag is-warn'}>{ok ? w.atTarget : fill(w.toGo, { n: sk.target - rec.cur })}</span> : null}
      </header>
      <div className="pt-skill-scores">
        <div>
          <span className="pt-field-label">{w.current}</span>
          <Seg value={rec.cur} label={`${w.current}: ${sk.name}`} onChange={(v) => set({ cur: v, at: diso(todayN) })}
            options={[1, 2, 3, 4, 5].map((n) => ({ id: n, label: String(n), tone: n >= sk.target ? 'good' : undefined }))} />
        </div>
        <div>
          <span className="pt-field-label">{w.confidence}</span>
          <Seg value={rec.conf} label={`${w.confidence}: ${sk.name}`} options={list(data.skills.conf)} onChange={(v) => set({ conf: v })} />
        </div>
        {hist.length > 1 && <div className="pt-skill-hist"><span className="pt-field-label">{w.history}</span><Spark points={hist} /></div>}
      </div>
      <div className="pt-two">
        <Field multiline rows={2} label={w.evidenceF} value={rec.ev} onCommit={(v) => set({ ev: v.trim() ? v : '' })} />
        <Field multiline rows={2} label={w.gapF} value={rec.gap} onCommit={(v) => set({ gap: v.trim() ? v : '' })} />
      </div>
      {rec.at && <p className="pt-muted">{fill(w.lastReviewed, { d: fmtDay(dnum(rec.at), { day: 'numeric', month: 'short', year: 'numeric' }) })}</p>}
    </article>
  )
}

function SkillsView() {
  const { data, st, update, todayN, m } = useT()
  const w = useW()
  const [flash, setFlash] = useState('')
  const total = data.skills.list.length
  const scored = data.skills.list.filter((x) => st.sk[x.id]?.cur).length
  const atTarget = data.skills.list.filter((x) => (st.sk[x.id]?.cur || 0) >= x.target).length
  const due = todayN >= m.s && (!st.skAt || todayN - dnum(st.skAt) >= 14)
  const snapshot = () => {
    const day = diso(todayN)
    update((s) => ({
      ...s,
      skAt: day,
      skHist: [...s.skHist.filter((h) => h.d !== day), { d: day, s: Object.fromEntries(Object.entries(s.sk).filter(([, v]) => v.cur).map(([k, v]) => [k, v.cur])) }].slice(-80),
    }))
    setFlash(fill(w.scoresSaved, { d: fmtDay(todayN, { day: 'numeric', month: 'long' }) }))
  }
  return (
    <>
      <section className="pt-card pt-intro">
        <div className="pt-intro-row">
          <h2>{w.skillsAtTarget}</h2>
          <span className="pt-big">{atTarget}<small> / {total}</small></span>
        </div>
        <Bar value={atTarget} max={total} label={w.skillsAtTarget} />
        {data.skills.scale && <p className="pt-muted"><Inline text={data.skills.scale} /></p>}
        {due && <p className="pt-note is-warn"><b>{w.rescoreDue}.</b> {st.skAt ? fill(w.dueSkills, { d: todayN - dnum(st.skAt) }) : w.dueSkillsFirst}</p>}
        <div className="pt-row">
          <button type="button" className="pt-primary" disabled={!scored} onClick={snapshot}>{w.saveScores}</button>
          {st.skAt && <span className="pt-muted">{fill(w.lastReviewed, { d: fmtDay(dnum(st.skAt), { day: 'numeric', month: 'short' }) })}</span>}
        </div>
        <p className="pt-muted" role="status">{flash}</p>
      </section>
      <div className="pt-skills">{data.skills.list.map((sk) => <SkillRow key={sk.id} sk={sk} />)}</div>
    </>
  )
}

// ── Notes ───────────────────────────────────────────────────────────────

function Rhythm() {
  const { data } = useT()
  const w = useW()
  const s = data.schedule
  return (
    <>
      <div className="pt-table-scroll">
        <table className="pt-table">
          <thead>
            <tr><th scope="col">{w.day}</th><th scope="col">{s.blocks?.am}</th><th scope="col">{s.blocks?.pm}</th><th scope="col">{s.blocks?.x}</th><th scope="col">{w.output}</th></tr>
          </thead>
          <tbody>
            {s.days.map((d) => (
              <tr key={d.d}>
                <th scope="row">{d.d}<small>{fmtH(sum(Object.values(d.plan || {})))}</small></th>
                <td>{d.am || '—'}</td><td>{d.pm || '—'}</td><td>{d.x || '—'}</td><td>{d.out}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="pt-list">{list(s.rules).map((r, i) => <li key={i}><Inline text={r} /></li>)}</ul>
    </>
  )
}

function Facts({ sec }) {
  const w = useW()
  const tone = { verified: 'good', reported: 'warn' }
  return (
    <ul className="pt-facts">
      {list(sec.items).map((f, i) => (
        <li key={i}>
          <span className={`pt-tag is-${tone[f.tag] || 'light'}`}>{w[f.tag] || f.tag}</span>
          <p><Inline text={f.t} /></p>
          {list(f.src).length > 0 && (
            <p className="pt-src">
              {w.sources}: {f.src.map((s, j) => (
                <React.Fragment key={s.u}>{j ? ' · ' : ''}<a href={s.u} target="_blank" rel="noopener noreferrer">{s.t}</a></React.Fragment>
              ))}
            </p>
          )}
        </li>
      ))}
    </ul>
  )
}

function Resources() {
  const { data } = useT()
  const w = useW()
  return (
    <ul className="pt-res">
      {list(data.resources).map((r) => (
        <li key={r.area}>
          <div className="pt-res-head"><h3>{r.area}</h3>{r.pri && <span className="pt-tag">{r.pri}</span>}</div>
          <p className="pt-res-links">
            {list(r.links).map((l, j) => (
              <React.Fragment key={l.u}>{j ? ' · ' : ''}<a href={l.u} target="_blank" rel="noopener noreferrer">{l.t}</a></React.Fragment>
            ))}
          </p>
          <p>{r.how}</p>
          <p className="pt-muted"><b>{w.proof}:</b> {r.proof}</p>
        </li>
      ))}
    </ul>
  )
}

function Settings() {
  const { data, st, setStart, backup, restore, keep, setKeep, lock } = useT()
  const w = useW()
  const fileRef = useRef(null)
  const start = st.start || data.meta.start
  return (
    <div className="pt-settings">
      <div className="pt-setting">
        <label className="pt-field is-narrow">
          <span className="pt-field-label">{w.startDate}</span>
          <input type="date" value={start} onChange={(e) => { if (isIso(e.target.value)) setStart(e.target.value) }} />
        </label>
        <p className="pt-muted">{w.startHint} {fmtDay(dnum(start), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.</p>
        {st.start && <button type="button" className="pt-mini" onClick={() => setStart(null)}>{w.resetStart}</button>}
      </div>
      <div className="pt-setting">
        <h3>{w.backupTitle}</h3>
        <p className="pt-muted">{w.backupHint}</p>
        <p className="pt-muted">{fill(w.lastBackup, { d: st.backupAt ? new Date(st.backupAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : w.never })}</p>
        <div className="pt-row">
          <button type="button" className="pt-primary" onClick={backup}>{w.saveBackup}</button>
          <button type="button" className="pt-secondary" onClick={() => fileRef.current?.click()}>{w.restore}</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) restore(f) }} />
        </div>
      </div>
      <div className="pt-setting">
        <h3>{w.device}</h3>
        <Check on={keep} onChange={setKeep}>{w.keepUnlocked}<small>{w.keepHint}</small></Check>
        <button type="button" className="pt-secondary" onClick={lock}>{w.lock}</button>
      </div>
    </div>
  )
}

function NotesView({ focus, nonce }) {
  const { data } = useT()
  const w = useW()
  const jump = (id) => document.getElementById(`pt-note-${id}`)?.scrollIntoView({ behavior: smooth(), block: 'start' })
  useEffect(() => {
    if (!focus?.section) return undefined
    const t = setTimeout(() => jump(focus.section), 80)
    return () => clearTimeout(t)
  }, [focus?.section, nonce])
  const body = (sec) => {
    switch (sec.kind) {
      case 'kv': return <dl className="pt-kv">{list(sec.rows).map((r) => <div key={r.k}><dt>{r.k}</dt><dd><Inline text={r.v} /></dd></div>)}</dl>
      case 'steps': return <ol className="pt-steps">{list(sec.items).map((t, i) => <li key={i}><Inline text={t} /></li>)}</ol>
      case 'list': return <ul className="pt-list">{list(sec.items).map((t, i) => <li key={i}><Inline text={t} /></li>)}</ul>
      case 'rhythm': return <Rhythm />
      case 'facts': return <Facts sec={sec} />
      case 'resources': return <Resources />
      case 'settings': return <Settings />
      default: return null
    }
  }
  return (
    <>
      <nav className="pt-toc" aria-label={w.sections}>
        {list(data.notes).map((s) => <button key={s.id} type="button" className="pt-chip" onClick={() => jump(s.id)}>{s.title}</button>)}
      </nav>
      {list(data.notes).map((sec) => (
        <section key={sec.id} className="pt-card pt-notesec" id={`pt-note-${sec.id}`}>
          <header className="pt-card-head"><h2>{sec.title}</h2>{sec.asOf && <span className="pt-muted">{sec.asOf}</span>}</header>
          {body(sec)}
        </section>
      ))}
    </>
  )
}

// ── Shell ───────────────────────────────────────────────────────────────

const VIEWS = { today: TodayView, plan: PlanView, log: LogView, build: ProjectsView, reps: PracticeView, drills: DrillsView, entries: StoriesView, scores: SkillsView, notes: NotesView }

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

function Tracker({ data, sealKey, payKey, remembered, onLock, onBack }) {
  const words = useMemo(() => ({ ...UI, ...(data.words || {}) }), [data])
  const views = useMemo(() => list(data.views).filter((v) => VIEWS[v.id]), [data])
  const [st, setSt] = useState(null)
  const [orphan, setOrphan] = useState(false)
  const [flash, setFlash] = useState(null)
  const [nav, setNav] = useState({ view: 'today', opts: null, t: 0 })
  const [keep, setKeepState] = useState(!!remembered)
  const today = useToday()
  const todayN = dnum(today)
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
  const start = st?.start || data.meta.start
  const m = useMemo(() => planModel(start, data.weeks.length), [start, data.weeks.length])
  const days = st?.days
  const stats = useMemo(() => (days ? computeStats(data, m, days, todayN) : null), [data, m, days, todayN])

  const go = useCallback((view, opts) => {
    setNav({ view, opts: opts || null, t: Date.now() })
    setSt((s) => (s && s.view !== view ? { ...s, view } : s))
    const band = bandRef.current
    const top = document.querySelector('.pt-top')?.offsetHeight || 0
    if (band) {
      const y = band.offsetTop + band.offsetHeight - top
      if (window.scrollY > y) window.scrollTo({ top: Math.max(0, y), behavior: 'instant' })
    }
  }, [])

  const backup = useCallback(async () => {
    const cur = stRef.current
    if (!cur) return
    const at = Date.now()
    try {
      const box = await seal(sealKey, { ...cur, backupAt: at })
      const file = new Blob([JSON.stringify({ kind: 'planner-backup', v: 1, at: new Date(at).toISOString(), ...box })], { type: 'application/json' })
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = `planner-backup-${localIso()}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      setSt((s) => (s ? { ...s, backupAt: at } : s))
      setFlash({ t: words.backupDone })
    } catch {
      setFlash({ t: words.saveError, err: true })
    }
  }, [sealKey, words])

  const restore = useCallback(async (file) => {
    try {
      const box = JSON.parse(await file.text())
      if (!box || box.kind !== 'planner-backup' || !box.iv || !box.ct) throw new Error('format')
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

  const setStart = useCallback((iso) => update((s) => {
    if (!iso) return { ...s, start: undefined }
    const n = dnum(iso)
    const monday = diso(n - wdOf(n))
    return { ...s, start: monday === data.meta.start ? undefined : monday }
  }), [update, data.meta.start])

  const setKeep = useCallback(async (v) => {
    setKeepState(v)
    if (v) { if (!(await rememberKey(payKey))) setKeepState(false) } else await forgetKey()
  }, [payKey])

  // Let any field mid-edit commit before leaving.
  const leave = (fn) => () => { document.activeElement?.blur?.(); setTimeout(fn, 80) }
  const lock = leave(onLock)

  if (!st || !stats) {
    return <main className="pt-root pt-locked"><style>{CSS}</style><p className="pt-opening" role="status">{words.opening}</p></main>
  }

  const ctx = { data, st, update, m, todayN, stats, go, backup, restore, undoRestore, setStart, keep, setKeep, lock }
  const dueN = reminders(ctx, words).length
  const cw = currentWeek(m, todayN)
  const weeksN = data.weeks.filter((wk) => weekDone(st, wk.n)).length
  const heroLine = todayN < m.s
    ? `${fill(words.startsIn, { date: fmtDay(m.s, { weekday: 'long', day: 'numeric', month: 'long' }) })} · ${m.s - todayN === 1 ? words.dayToGo : fill(words.daysToGo, { n: m.s - todayN })}`
    : todayN > m.e ? fill(words.finished, { W: m.W })
      : `${fill(words.weekOfPlan, { w: cw, W: m.W, d: todayN - m.s + 1, D: m.D })} · ${phaseOf(data, cw)?.name || ''}`
  const saveText = saving === 'error' ? words.saveError : saving === 'saving' ? words.saving : words.saved
  const View = VIEWS[nav.view] || TodayView

  return (
    <Words.Provider value={words}>
      <Ctx.Provider value={ctx}>
        <div className="pt-root">
          <style>{CSS}</style>
          <header className="pt-top">
            <div className="pt-wrap pt-top-inner">
              <button type="button" className="pt-back" onClick={leave(onBack)} aria-label={words.back}>
                <span aria-hidden="true">←</span><span className="pt-hide-sm">{words.back}</span>
              </button>
              {data.meta.bar && <span className="pt-top-mark"><Mark mark={data.meta.mark} />{data.meta.bar}</span>}
              <div className="pt-top-actions">
                <span className={`pt-save is-${saving}`} role="status" title={saveText}>
                  <span className="pt-save-dot" aria-hidden="true" /><span className="pt-save-text">{saveText}</span>
                </span>
                <button type="button" className="pt-ghost" onClick={backup}>{words.backup}</button>
                <button type="button" className="pt-ghost" onClick={lock}>{words.lock}</button>
              </div>
            </div>
          </header>
          <div className="pt-band" ref={bandRef}>
            <div className="pt-wrap pt-hero">
              <div className="pt-hero-copy">
                {data.meta.kicker && <p className="pt-kicker"><Mark mark={data.meta.mark} />{data.meta.kicker}</p>}
                <h1 ref={headingRef} tabIndex={-1}>{data.meta.title}</h1>
                <p className="pt-hero-line">{heroLine}</p>
              </div>
              <div className="pt-hero-side">
                <Ring value={weeksN} max={m.W} label={words.weeksDone}><b>{weeksN}</b><small>/ {m.W}</small></Ring>
                <dl className="pt-hero-stats">
                  <div><dt>{words.weeksDone}</dt><dd>{weeksN} / {m.W}</dd></div>
                  <div><dt>{words.hoursLogged}</dt><dd>{fmtH(stats.actualToDate)}</dd></div>
                  <div><dt>{words.streak}</dt><dd>{stats.streak} {dayWord(words, stats.streak)}</dd></div>
                </dl>
              </div>
            </div>
          </div>
          <nav className="pt-nav" aria-label={words.sections}>
            <div className="pt-wrap pt-nav-inner">
              {views.map((v) => (
                <button key={v.id} type="button" aria-current={nav.view === v.id ? 'page' : undefined} onClick={() => go(v.id)}>
                  {v.label}
                  {v.id === 'today' && dueN > 0 && <span className="pt-nav-dot" aria-label={`${dueN} ${words.due}`}>{dueN}</span>}
                </button>
              ))}
            </div>
          </nav>
          <main className="pt-wrap pt-main">
            {orphan && (
              <div className="pt-banner is-warn">
                <p>{words.orphan}</p>
                <button type="button" className="pt-mini" onClick={() => go('notes', { section: 'settings' })}>{words.restore}</button>
                <button type="button" className="pt-mini" onClick={() => setOrphan(false)}>{words.dismiss}</button>
              </div>
            )}
            {flash && (
              <div className={flash.err ? 'pt-banner is-warn' : 'pt-banner is-good'} role="status">
                <p>{flash.t}</p>
                {flash.undo && <button type="button" className="pt-mini" onClick={undoRestore}>{words.undo}</button>}
                <button type="button" className="pt-mini" onClick={() => setFlash(null)}>{words.dismiss}</button>
              </div>
            )}
            <View focus={nav.opts} nonce={nav.t} />
          </main>
          {data.meta.footer && <footer className="pt-footer"><Mark mark={data.meta.mark} /><p><Inline text={data.meta.footer} /></p></footer>}
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
    <main className="pt-root pt-locked">
      <style>{CSS}</style>
      <div className="pt-lock-card">
        <div className="pt-lock-icon" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="7" y="9" width="26" height="24" rx="5" /><path d="M7 16h26M14 5v7M26 5v7M13 23l4 4 9-9" />
          </svg>
        </div>
        <h1>{w.gateTitle}</h1>
        <p>{w.gateLead}</p>
        <form className="pt-gate-form" onSubmit={submit}>
          <label htmlFor="pt-password">{w.password}</label>
          <div className="pt-password">
            <input id="pt-password" ref={inputRef} type={show ? 'text' : 'password'} autoComplete="current-password" autoCapitalize="off"
              autoCorrect="off" spellCheck={false} value={password} required readOnly={busy} aria-invalid={!!error}
              aria-describedby={error ? 'pt-gate-error' : undefined} onChange={(e) => { setPassword(e.target.value); setError('') }} />
            <button type="button" disabled={busy} aria-pressed={show} aria-label={show ? w.hide : w.show}
              onClick={() => { setShow((v) => !v); inputRef.current?.focus() }}>{show ? w.hide : w.show}</button>
          </div>
          <Check on={keep} onChange={setKeep}>{w.keepUnlocked}<small>{w.keepHint}</small></Check>
          <button type="submit" className="pt-primary" disabled={busy || !password}>{busy ? w.opening : w.open}</button>
          <div className="pt-gate-error" id="pt-gate-error" role="alert">{error}</div>
        </form>
        <small className="pt-gate-note">{w.gateNote}</small>
        <button type="button" className="pt-back" onClick={onBack}>{w.back}</button>
      </div>
    </main>
  )
}

export default function PlanTracker({ onBack }) {
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
  if (checking) return <main className="pt-root pt-locked"><style>{CSS}</style><p className="pt-opening" role="status">{UI.opening}</p></main>
  if (!opened) return <Gate onBack={onBack} onOpen={setOpened} />
  return <Tracker {...opened} onLock={lock} onBack={onBack} />
}

const CSS = `
.pt-root {
  --pt-bg: #f1f4f7; --pt-card: #fff; --pt-ink: #1c2b33; --pt-ink2: #465a69; --pt-ink3: #67788a;
  --pt-line: #dee3e9; --pt-line2: #cbd2d9; --pt-blue: #0064e0; --pt-blue2: #0082fb; --pt-blue-d: #0050b3;
  --pt-blue-soft: #e8f1ff; --pt-green: #1b7f3b; --pt-green-soft: #e3f4e8; --pt-amber: #8a5300; --pt-amber-soft: #fff1d0;
  --pt-red: #c42b1c; --pt-red-soft: #fde7e4; --pt-grey-soft: #eef1f4; --pt-r: 16px;
  --pt-shadow: 0 1px 2px rgba(28,43,51,.06), 0 6px 20px rgba(28,43,51,.05);
  min-height: 100vh; background: var(--pt-bg); color: var(--pt-ink);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 15px; line-height: 1.5; letter-spacing: -0.005em; -webkit-font-smoothing: antialiased;
}
.pt-root *, .pt-root *::before, .pt-root *::after { box-sizing: border-box; }
.pt-root h1, .pt-root h2, .pt-root h3, .pt-root h4 { font-family: inherit; color: var(--pt-ink); letter-spacing: -0.02em; margin: 0; }
.pt-root h1 { font-size: clamp(26px, 4.2vw, 40px); line-height: 1.12; font-weight: 800; }
.pt-root h2 { font-size: 19px; line-height: 1.3; font-weight: 750; }
.pt-root h3 { font-size: 16px; line-height: 1.35; font-weight: 700; }
.pt-root h4 { font-size: 12.5px; font-weight: 750; text-transform: uppercase; letter-spacing: .06em; color: var(--pt-ink3); }
.pt-root p { margin: 0; }
.pt-root a { color: var(--pt-blue); text-decoration: none; font-weight: 600; overflow-wrap: anywhere; }
.pt-root a:hover { text-decoration: underline; }
.pt-root code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .86em; background: var(--pt-grey-soft); color: #0b3d75; padding: .08em .36em; border-radius: 6px; overflow-wrap: anywhere; }
:where(.pt-root) button { font: inherit; color: inherit; cursor: pointer; }
:where(.pt-root) button:disabled { cursor: default; }
.pt-root :focus-visible { outline: 3px solid var(--pt-blue2); outline-offset: 2px; box-shadow: none; }
.pt-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.pt-wrap { width: 100%; max-width: 1160px; margin: 0 auto; padding: 0 20px; }

.pt-top { position: sticky; top: 0; z-index: 30; background: rgba(255,255,255,.94); backdrop-filter: saturate(1.4) blur(12px); -webkit-backdrop-filter: saturate(1.4) blur(12px); border-bottom: 1px solid var(--pt-line); }
.pt-top-inner { display: flex; align-items: center; gap: 12px; height: 56px; }
.pt-back { display: inline-flex; align-items: center; gap: 8px; background: none; border: 0; padding: 8px 10px; border-radius: 999px; font-weight: 650; color: var(--pt-ink2); }
.pt-back:hover { background: var(--pt-grey-soft); }
.pt-top-mark { display: inline-flex; align-items: center; gap: 8px; font-weight: 800; letter-spacing: -0.01em; }
.pt-top-mark .pt-mark { width: 30px; height: 15px; color: var(--pt-blue); }
.pt-top-actions { margin-left: auto; display: flex; align-items: center; gap: 8px; }
.pt-save { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--pt-ink3); margin-right: 4px; }
.pt-save-dot { width: 8px; height: 8px; border-radius: 50%; background: #31a24c; flex: none; }
.pt-save.is-saving .pt-save-dot { background: var(--pt-blue2); animation: pt-pulse 1s infinite; }
.pt-save.is-error { color: var(--pt-red); font-weight: 650; }
.pt-save.is-error .pt-save-dot { background: var(--pt-red); }
.pt-ghost { background: var(--pt-card); border: 1px solid var(--pt-line2); border-radius: 999px; padding: 6px 14px; font-weight: 650; font-size: 14px; }
.pt-ghost:hover { background: var(--pt-grey-soft); }

.pt-band { color: #fff; background: radial-gradient(1100px 380px at 88% -20%, rgba(255,255,255,.2), transparent 60%), linear-gradient(118deg, #004fc4 0%, #0064e0 42%, #0082fb 100%); }
.pt-hero { display: flex; gap: 28px; align-items: center; justify-content: space-between; padding-top: 34px; padding-bottom: 38px; }
.pt-hero-copy { min-width: 0; }
.pt-band h1 { color: #fff; max-width: 24ch; }
.pt-kicker { display: inline-flex; align-items: center; gap: 10px; font-weight: 750; font-size: 12.5px; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.9); margin-bottom: 10px !important; }
.pt-kicker .pt-mark { width: 34px; height: 17px; color: #fff; flex: none; }
.pt-hero-line { margin-top: 10px !important; font-size: 16px; color: rgba(255,255,255,.94); font-weight: 550; }
.pt-hero-side { display: flex; align-items: center; gap: 20px; flex: none; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.24); border-radius: 20px; padding: 16px 20px; }
.pt-ring { --pt-p: 0deg; position: relative; width: 88px; height: 88px; display: grid; place-items: center; flex: none; }
.pt-ring::before { content: ''; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(#fff var(--pt-p), rgba(255,255,255,.25) 0);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 8px)); mask: radial-gradient(farthest-side, transparent calc(100% - 9px), #000 calc(100% - 8px)); }
.pt-ring > span { position: relative; text-align: center; line-height: 1; }
.pt-ring b { display: block; font-size: 26px; font-weight: 850; }
.pt-ring small { font-size: 12px; opacity: .85; }
.pt-hero-stats { display: grid; gap: 6px; margin: 0; min-width: 170px; }
.pt-hero-stats div { display: flex; justify-content: space-between; gap: 18px; font-size: 14px; }
.pt-hero-stats dt { color: rgba(255,255,255,.82); }
.pt-hero-stats dd { margin: 0; font-weight: 750; font-variant-numeric: tabular-nums; }

.pt-nav { position: sticky; top: 57px; z-index: 25; background: rgba(241,244,247,.95); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid var(--pt-line); }
.pt-nav-inner { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; padding-top: 9px; padding-bottom: 9px; }
.pt-nav-inner::-webkit-scrollbar { display: none; }
.pt-nav button { flex: none; border: 0; background: transparent; padding: 8px 14px; border-radius: 999px; font-weight: 650; color: var(--pt-ink2); display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.pt-nav button:hover { background: #e2e8ee; }
.pt-nav button[aria-current="page"] { background: var(--pt-blue); color: #fff; }
.pt-nav-dot { min-width: 18px; height: 18px; padding: 0 5px; border-radius: 999px; background: #e41e3f; color: #fff; font-size: 11px; font-weight: 800; display: inline-grid; place-items: center; }

.pt-main { padding-top: 22px; padding-bottom: 56px; display: grid; gap: 18px; }
.pt-grid2 { display: grid; gap: 18px; grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); align-items: start; }
.pt-col { display: grid; gap: 18px; min-width: 0; }
.pt-card { background: var(--pt-card); border: 1px solid var(--pt-line); border-radius: var(--pt-r); box-shadow: var(--pt-shadow); padding: 20px; display: grid; gap: 14px; min-width: 0; align-content: start; }
.pt-card > h2 { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pt-card-head { display: flex; align-items: baseline; justify-content: space-between; gap: 6px 12px; flex-wrap: wrap; }
.pt-eyebrow { font-size: 12px; font-weight: 750; letter-spacing: .07em; text-transform: uppercase; color: var(--pt-blue); }
.pt-muted { color: var(--pt-ink3); font-size: 14px; }
.pt-lead { font-size: 16px; color: var(--pt-ink2); }
.pt-count-chip { font-size: 12px; font-weight: 750; background: var(--pt-blue-soft); color: var(--pt-blue-d); border-radius: 999px; padding: 2px 9px; letter-spacing: 0; }
.pt-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.pt-two { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); }

.pt-primary { background: var(--pt-blue); color: #fff; border: 0; border-radius: 999px; padding: 10px 18px; font-weight: 700; justify-self: start; }
.pt-primary:hover:not(:disabled) { background: #0057c2; }
.pt-primary:disabled { background: #b4c1ce; }
.pt-secondary { background: #e6ebf0; border: 0; border-radius: 999px; padding: 9px 16px; font-weight: 650; justify-self: start; }
.pt-secondary:hover { background: #d9e0e7; }
.pt-mini { background: var(--pt-card); border: 1px solid var(--pt-line2); border-radius: 999px; padding: 4px 11px; font-size: 13px; font-weight: 650; white-space: nowrap; justify-self: start; }
.pt-mini:hover:not(:disabled) { background: var(--pt-grey-soft); }
.pt-mini.is-on { background: var(--pt-green-soft); border-color: transparent; color: var(--pt-green); }
.pt-mini.is-blue { background: var(--pt-blue); border-color: var(--pt-blue); color: #fff; }
.pt-mini.is-danger { background: var(--pt-red); border-color: var(--pt-red); color: #fff; }
.pt-link { background: none; border: 0; padding: 0; color: var(--pt-blue) !important; font-weight: 650; justify-self: start; }
.pt-link:hover { text-decoration: underline; }
.pt-arrow { width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--pt-line2); background: var(--pt-card); font-size: 22px; line-height: 1; display: grid; place-items: center; flex: none; padding: 0 0 3px; }
.pt-arrow:hover:not(:disabled) { background: var(--pt-grey-soft); }
.pt-arrow:disabled { opacity: .35; }

.pt-tag { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; padding: 3px 9px; border-radius: 999px; background: var(--pt-grey-soft); color: var(--pt-ink2); white-space: nowrap; }
.pt-tag.is-now, .pt-tag[data-tone="active"] { background: var(--pt-blue-soft); color: var(--pt-blue-d); }
.pt-tag.is-good, .pt-tag[data-tone="good"] { background: var(--pt-green-soft); color: var(--pt-green); }
.pt-tag.is-warn, .pt-tag[data-tone="warn"] { background: var(--pt-amber-soft); color: var(--pt-amber); }
.pt-tag.is-light { background: #dff4f1; color: #0b5d55; }
.pt-tag.is-future { color: var(--pt-ink3); }
.pt-status { font-size: 12.5px; font-weight: 750; padding: 4px 10px; border-radius: 999px; background: var(--pt-grey-soft); color: var(--pt-ink3); white-space: nowrap; }
.pt-status.is-done { background: var(--pt-green-soft); color: var(--pt-green); }
.pt-status.is-partial { background: var(--pt-amber-soft); color: var(--pt-amber); }
.pt-status.is-missed { background: var(--pt-red-soft); color: var(--pt-red); }
.pt-status.is-rest { color: var(--pt-ink2); }
.pt-status.is-open { background: var(--pt-blue-soft); color: var(--pt-blue-d); }
.pt-check { display: flex; align-items: flex-start; gap: 10px; background: none; border: 0; padding: 5px 0; text-align: left; width: 100%; }
.pt-check-box { flex: none; width: 22px; height: 22px; border-radius: 7px; border: 2px solid var(--pt-line2); background: #fff; display: grid; place-items: center; font-size: 13px; font-weight: 900; color: #fff; margin-top: 1px; transition: background .15s, border-color .15s; }
.pt-check:hover .pt-check-box { border-color: var(--pt-blue); }
.pt-check.is-on .pt-check-box { background: var(--pt-blue); border-color: var(--pt-blue); }
.pt-check-label { display: block; min-width: 0; }
.pt-check-label small { display: block; color: var(--pt-ink3); font-size: 13px; }
.pt-check.is-on .pt-check-label { color: var(--pt-ink2); }
.pt-checks { display: grid; gap: 4px; }
.pt-checklist { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px; }

.pt-seg { display: flex; flex-wrap: wrap; gap: 6px; }
.pt-seg button { border: 1px solid var(--pt-line2); background: var(--pt-card); border-radius: 999px; padding: 6px 13px; font-size: 13.5px; font-weight: 650; color: var(--pt-ink2); min-width: 40px; }
.pt-seg button:hover { border-color: var(--pt-blue); }
.pt-seg button.is-on { background: var(--pt-blue); border-color: var(--pt-blue); color: #fff; }
.pt-seg button.is-on[data-tone="good"] { background: #1b7f3b; border-color: #1b7f3b; }
.pt-seg button.is-on[data-tone="warn"] { background: #b26a00; border-color: #b26a00; }
.pt-seg button.is-on[data-tone="idle"] { background: var(--pt-ink2); border-color: var(--pt-ink2); }

.pt-field { display: grid; gap: 6px; min-width: 0; }
.pt-field-label { font-size: 13px; font-weight: 700; color: var(--pt-ink2); }
.pt-field input, .pt-field textarea { width: 100%; font: inherit; font-size: 16px; color: var(--pt-ink); background: #f7f9fb; border: 1px solid var(--pt-line2); border-radius: 12px; padding: 9px 12px; }
.pt-field textarea { resize: vertical; min-height: 46px; line-height: 1.45; }
.pt-field input:focus, .pt-field textarea:focus, .pt-field input:focus-visible, .pt-field textarea:focus-visible { outline: none; border-color: var(--pt-blue); background: #fff; box-shadow: 0 0 0 3px rgba(0,100,224,.18); }
.pt-field.is-narrow { max-width: 230px; }
.pt-form { display: grid; gap: 14px; }
.pt-form-row { display: grid; gap: 12px; grid-template-columns: minmax(0, 1fr) 200px; }
.pt-pm { border: 1px dashed var(--pt-line2); border-radius: 14px; padding: 10px 14px 14px; margin: 0; display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)); }
.pt-pm legend { font-size: 13px; font-weight: 750; color: var(--pt-ink2); padding: 0 6px; }

.pt-hours { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pt-step { width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--pt-line2); background: var(--pt-card); font-size: 19px; font-weight: 700; display: grid; place-items: center; padding: 0; }
.pt-step:hover:not(:disabled) { background: var(--pt-grey-soft); }
.pt-step:disabled { opacity: .35; }
.pt-hours output { min-width: 50px; text-align: center; font-weight: 800; font-variant-numeric: tabular-nums; }
.pt-hours-done { margin-left: auto; border: 1px solid var(--pt-blue); color: var(--pt-blue) !important; background: var(--pt-card); border-radius: 999px; padding: 7px 16px; font-weight: 750; }
.pt-hours-done:hover { background: var(--pt-blue-soft); }
.pt-hours-done.is-on { background: var(--pt-green-soft); color: var(--pt-green) !important; border-color: transparent; }

.pt-timer { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pt-timer-v { font-variant-numeric: tabular-nums; font-weight: 800; font-size: 18px; min-width: 60px; }
.pt-timer button { border: 1px solid var(--pt-line2); background: var(--pt-card); border-radius: 999px; padding: 5px 12px; font-size: 13px; font-weight: 650; }
.pt-timer button:hover:not(:disabled) { background: var(--pt-grey-soft); }
.pt-timer.is-up .pt-timer-v, .pt-timer-msg { color: var(--pt-red); }
.pt-timer-msg { font-size: 13px; font-weight: 650; }

.pt-bar { height: 8px; border-radius: 999px; background: #e3e8ee; overflow: hidden; }
.pt-bar > span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--pt-blue), var(--pt-blue2)); transition: width .35s ease; }
.pt-bar[data-tone="warn"] > span { background: linear-gradient(90deg, #d38b00, #f7b928); }

.pt-day-head { display: flex; align-items: center; gap: 12px; }
.pt-day-title { flex: 1; min-width: 0; text-align: center; display: grid; gap: 2px; }
.pt-day-title h2 { font-size: 22px; }
.pt-day-status { display: flex; align-items: center; justify-content: center; gap: 10px; flex-wrap: wrap; }
.pt-day-h { font-weight: 750; font-variant-numeric: tabular-nums; color: var(--pt-ink2); }
.pt-blocks { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.pt-block { border: 1px solid var(--pt-line); border-radius: 14px; padding: 14px; display: grid; gap: 10px; background: #fbfcfd; }
.pt-block.is-done { background: #f3faf5; border-color: #cfe9d7; }
.pt-block-head { display: flex; align-items: baseline; justify-content: space-between; gap: 4px 10px; flex-wrap: wrap; }
.pt-block-name { font-weight: 800; }
.pt-block-plan { font-size: 13px; color: var(--pt-ink3); font-weight: 600; }
.pt-say { background: var(--pt-blue-soft); border-radius: 12px; padding: 10px 12px; color: #0b3d75; font-weight: 600; }
.pt-say span { display: block; font-size: 11.5px; letter-spacing: .07em; text-transform: uppercase; font-weight: 800; color: var(--pt-blue); margin-bottom: 2px; }
.pt-out { font-size: 14px; color: var(--pt-ink2); }
.pt-out span { font-weight: 750; margin-right: 6px; color: var(--pt-ink); }
.pt-day-foot { display: grid; gap: 12px; border-top: 1px solid var(--pt-line); padding-top: 14px; }
.pt-note { border-radius: 12px; padding: 10px 12px; background: var(--pt-grey-soft); color: var(--pt-ink2); font-size: 14px; }
.pt-note.is-light { background: #dff4f1; color: #0b5d55; }
.pt-note.is-warn { background: var(--pt-amber-soft); color: #6b4100; }

.pt-tracks { display: grid; gap: 10px; margin: 0; }
.pt-tracks div { display: grid; gap: 2px; }
.pt-tracks dt { font-size: 12px; font-weight: 750; letter-spacing: .05em; text-transform: uppercase; color: var(--pt-ink3); }
.pt-tracks dd { margin: 0; }
.pt-tracks.is-row { grid-template-columns: repeat(auto-fit, minmax(min(200px, 100%), 1fr)); }
.pt-weekcard .pt-tag { justify-self: start; }
.pt-week-hours { display: grid; gap: 6px; }
.pt-week-hours span { font-weight: 800; }
.pt-week-hours small { font-weight: 600; color: var(--pt-ink3); }
.pt-dots { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; }
.pt-dot { width: 100%; height: 40px; border-radius: 12px; border: 1px solid var(--pt-line2); background: var(--pt-card); font-weight: 750; font-size: 13px; color: var(--pt-ink2); padding: 0; }
.pt-dot.is-done { background: var(--pt-blue); border-color: var(--pt-blue); color: #fff; }
.pt-dot.is-partial { background: #ffe39b; border-color: #f2c14e; color: #5c3b00; }
.pt-dot.is-missed { background: var(--pt-red-soft); border-color: #f0b1a8; color: var(--pt-red); }
.pt-dot.is-rest { background: repeating-linear-gradient(45deg, #e5eaef 0 4px, #f6f8fa 4px 8px); }
.pt-dot.is-open { border: 2px solid var(--pt-blue); color: var(--pt-blue); }
.pt-dot.is-sel { box-shadow: 0 0 0 3px rgba(0,100,224,.32); }
.pt-due ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.pt-due li { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; border-radius: 12px; background: #fbfcfd; border: 1px solid var(--pt-line); font-size: 14px; }

.pt-tiles { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(min(190px, 100%), 1fr)); }
.pt-tiles.is-compact { grid-template-columns: repeat(auto-fill, minmax(min(170px, 100%), 1fr)); }
.pt-tile { border: 1px solid var(--pt-line); border-radius: 14px; padding: 14px; display: grid; gap: 6px; align-content: start; background: #fbfcfd; }
.pt-tile-label { font-size: 12px; font-weight: 750; color: var(--pt-ink3); text-transform: uppercase; letter-spacing: .05em; }
.pt-tile-value { font-size: 26px; font-weight: 800; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; line-height: 1.15; }
.pt-tile-value small { font-size: 14px; font-weight: 650; color: var(--pt-ink3); letter-spacing: 0; }
.pt-tile-sub { font-size: 12.5px; color: var(--pt-ink3); }
.pt-tile[data-tone="warn"] .pt-tile-sub { color: var(--pt-amber); font-weight: 650; }
.pt-countdown { background: linear-gradient(180deg, #fff, #f3f8ff); }
.pt-count { font-size: clamp(34px, 6vw, 50px); font-weight: 850; letter-spacing: -0.03em; color: var(--pt-blue); line-height: 1.05; }
.pt-glance { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.pt-glance li { border: 1px solid var(--pt-line); border-radius: 12px; padding: 10px 12px; display: grid; font-size: 13px; color: var(--pt-ink3); background: #fff; }
.pt-glance b { font-size: 22px; color: var(--pt-ink); font-weight: 800; }
.pt-plan { display: grid; gap: 20px; }
.pt-phases { display: grid; grid-template-columns: repeat(6, minmax(150px, 1fr)); gap: 10px; overflow-x: auto; padding: 2px 2px 6px; }
.pt-phase-chip { text-align: left; border: 1px solid var(--pt-line); background: var(--pt-card); border-radius: 14px; padding: 12px; display: grid; gap: 6px; box-shadow: var(--pt-shadow); }
.pt-phase-chip:hover { border-color: #b9d3f5; }
.pt-phase-chip.is-now { border-color: var(--pt-blue); box-shadow: 0 0 0 2px rgba(0,100,224,.16); }
.pt-phase-name { font-weight: 800; }
.pt-phase-weeks { font-size: 12.5px; color: var(--pt-ink3); font-weight: 600; }
.pt-phase { display: grid; gap: 12px; scroll-margin-top: 124px; }
.pt-phase-head { display: grid; gap: 4px; padding: 4px 4px 0; }
.pt-weeks { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.pt-weekitem { background: var(--pt-card); border: 1px solid var(--pt-line); border-radius: var(--pt-r); box-shadow: var(--pt-shadow); scroll-margin-top: 124px; overflow: hidden; }
.pt-weekitem.is-open { border-color: #b9d3f5; }
.pt-weekrow { width: 100%; display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto auto; align-items: center; gap: 14px; padding: 14px 16px; background: none; border: 0; text-align: left; }
.pt-weekrow:hover { background: #fafbfd; }
.pt-weekno { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; font-weight: 800; background: var(--pt-grey-soft); color: var(--pt-ink2); }
.pt-weekno.is-now { background: var(--pt-blue); color: #fff; }
.pt-weekno.is-done { background: var(--pt-green-soft); color: var(--pt-green); }
.pt-weekrow-main { display: grid; gap: 2px; min-width: 0; }
.pt-weekrow-title { font-weight: 750; }
.pt-weekrow-sub { font-size: 13px; color: var(--pt-ink3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pt-weekrow-tags { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.pt-weekrow-h { font-weight: 750; font-variant-numeric: tabular-nums; font-size: 14px; white-space: nowrap; }
.pt-weekrow-h small, .pt-bars-v small { color: var(--pt-ink3); font-weight: 600; }
.pt-chev { color: var(--pt-ink3); transition: transform .2s; }
[aria-expanded="true"] > .pt-chev { transform: rotate(180deg); }
.pt-weekdetail { border-top: 1px solid var(--pt-line); padding: 18px 16px 20px; display: grid; gap: 16px; }
.pt-weekdetail h3 { margin-top: 4px; }
.pt-daylist { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr)); }
.pt-dayrow { border: 1px solid var(--pt-line); border-radius: 12px; padding: 12px; display: grid; gap: 8px; align-content: start; }
.pt-dayrow-head { display: flex; align-items: center; gap: 10px; }
.pt-dayrow-head span { color: var(--pt-ink3); font-size: 13px; }
.pt-dayrow-head .pt-status { margin-left: auto; }
.pt-dayrow ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.pt-dayrow li { display: grid; gap: 2px; }
.pt-dayrow-k { font-size: 11.5px; font-weight: 750; color: var(--pt-ink3); text-transform: uppercase; letter-spacing: .04em; }
.pt-dayrow-out { font-size: 13px; color: var(--pt-ink3); }
.pt-saybox { display: grid; gap: 10px; }
.pt-probs-cols { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); }
.pt-probs ul { list-style: none; margin: 8px 0 0; padding: 0; display: grid; }
.pt-probs li { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px solid #eef1f4; }
.pt-probs li a { flex: 1; min-width: 0; }
.pt-diff { font-size: 11.5px; font-weight: 750; padding: 2px 8px; border-radius: 999px; background: var(--pt-grey-soft); }
.pt-diff.is-easy { background: var(--pt-green-soft); color: var(--pt-green); }
.pt-diff.is-medium { background: var(--pt-amber-soft); color: var(--pt-amber); }
.pt-diff.is-hard { background: var(--pt-red-soft); color: var(--pt-red); }
.pt-links { margin: 0; padding-left: 18px; display: grid; gap: 6px; }
.pt-review { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)); }
.pt-anchor { scroll-margin-top: 130px; }

.pt-heat-scroll { overflow-x: auto; padding: 4px 2px 6px; }
.pt-heat { display: grid; grid-template-columns: 18px repeat(var(--pt-cols), minmax(16px, 1fr)); gap: 4px; min-width: 560px; align-items: center; }
.pt-heat-wk { font-size: 10.5px; color: var(--pt-ink3); text-align: center; font-weight: 650; }
.pt-heat-dl { font-size: 11px; color: var(--pt-ink3); font-weight: 700; }
.pt-cell { aspect-ratio: 1; width: 100%; border-radius: 4px; border: 1px solid transparent; background: #e9eef3; padding: 0; }
.pt-cell.is-future { background: #fff; border: 1px dashed #d2d9e0; }
.pt-cell.is-missed { background: #f7cfc8; }
.pt-cell.is-rest { background: repeating-linear-gradient(45deg, #dce3ea 0 3px, #f3f5f8 3px 6px); }
.pt-cell.is-open { background: #fff; border: 2px solid var(--pt-blue); }
.pt-cell[data-l="1"] { background: #ffe7a6; }
.pt-cell[data-l="2"] { background: #ffd056; }
.pt-cell[data-l="3"] { background: #3d8ff5; }
.pt-cell[data-l="4"] { background: #004fc4; }
.pt-cell.is-today { box-shadow: 0 0 0 2px var(--pt-ink); }
.pt-cell.is-sel { outline: 2px solid var(--pt-blue2); outline-offset: 2px; }
.pt-legend { list-style: none; margin: 0; padding: 0; display: flex; gap: 8px 16px; flex-wrap: wrap; font-size: 12.5px; color: var(--pt-ink3); }
.pt-legend li { display: inline-flex; align-items: center; gap: 6px; }
.pt-legend .pt-cell { width: 14px; height: 14px; display: inline-block; }
.pt-bars { list-style: none; margin: 0; padding: 0; display: grid; gap: 5px; }
.pt-bars li { display: grid; grid-template-columns: 22px minmax(0, 1fr) 76px; align-items: center; gap: 8px; font-size: 12.5px; }
.pt-bars-n { color: var(--pt-ink3); font-weight: 700; text-align: right; }
.pt-bars-track { position: relative; height: 10px; border-radius: 999px; background: #f1f4f7; }
.pt-bars-plan, .pt-bars-act { position: absolute; top: 0; bottom: 0; left: 0; border-radius: inherit; }
.pt-bars-plan { background: #d9e1e9; }
.pt-bars-act { background: linear-gradient(90deg, var(--pt-blue), var(--pt-blue2)); }
.pt-bars-v { font-variant-numeric: tabular-nums; font-weight: 700; text-align: right; }

.pt-intro-row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.pt-big { font-size: 30px; font-weight: 850; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.pt-big small { font-size: 15px; color: var(--pt-ink3); font-weight: 650; }
.pt-project-head { display: grid; gap: 4px; }
.pt-ms-list { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); }
.pt-ms { border: 1px solid var(--pt-line); border-top: 4px solid var(--pt-line2); border-radius: 14px; padding: 16px; display: grid; gap: 10px; align-content: start; background: #fbfcfd; }
.pt-ms[data-tone="active"] { border-top-color: var(--pt-blue); }
.pt-ms[data-tone="warn"] { border-top-color: #f7b928; }
.pt-ms[data-tone="good"] { border-top-color: #31a24c; background: #f5fbf7; }
.pt-ms-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pt-ms-head h3 { flex: 1 1 100%; }
.pt-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.pt-chip { font-size: 12.5px; font-weight: 650; padding: 4px 10px; border-radius: 999px; background: var(--pt-grey-soft); color: var(--pt-ink2); border: 1px solid transparent; }
button.pt-chip:hover { border-color: var(--pt-blue); }
.pt-chip.is-on { background: var(--pt-blue-soft); color: var(--pt-blue-d); border-color: #b9d3f5; }

.pt-entries { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.pt-entry { border: 1px solid var(--pt-line); border-radius: 12px; background: #fbfcfd; }
.pt-entry.is-err { border-left: 4px solid #f7b928; }
.pt-entry-row { width: 100%; display: grid; grid-template-columns: auto minmax(0, 1fr) auto auto; gap: 10px; align-items: center; padding: 10px 12px; border: 0; background: none; text-align: left; }
.pt-entry-title { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pt-entry-meta { font-size: 12.5px; color: var(--pt-ink3); white-space: nowrap; }
.pt-entry-body { padding: 4px 12px 14px; display: grid; gap: 10px; }
.pt-drills { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(min(330px, 100%), 1fr)); }
.pt-drill-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.pt-drill-q { font-size: 17px; font-weight: 700; line-height: 1.4; }
.pt-covers { display: grid; gap: 6px; }
.pt-drill-log { display: grid; gap: 10px; border-top: 1px solid var(--pt-line); padding-top: 12px; }
.pt-drill-log > div { display: grid; gap: 6px; }
.pt-runs { margin: 0; padding-left: 18px; font-size: 13.5px; color: var(--pt-ink2); display: grid; gap: 4px; }
.pt-statusbar { display: flex; gap: 8px; flex-wrap: wrap; }
.pt-stories { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.pt-story { background: var(--pt-card); border: 1px solid var(--pt-line); border-radius: var(--pt-r); box-shadow: var(--pt-shadow); overflow: hidden; }
.pt-story-row { width: 100%; display: grid; grid-template-columns: minmax(0, 1fr) auto auto auto; gap: 12px; align-items: center; padding: 14px 16px; background: none; border: 0; text-align: left; }
.pt-story-name { font-weight: 750; }
.pt-story-words { font-size: 13px; color: var(--pt-ink3); white-space: nowrap; }
.pt-story-body { border-top: 1px solid var(--pt-line); padding: 16px; display: grid; gap: 14px; }
.pt-story-fields { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); }
.pt-story-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.pt-skills { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr)); }
.pt-skill[data-ok] { border-color: #cfe9d7; }
.pt-skill-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pt-skill-head h3 { flex: 1 1 100%; }
.pt-skill-scores { display: grid; gap: 10px; }
.pt-skill-scores > div { display: grid; gap: 6px; }
.pt-spark { width: 150px; height: 32px; }
.pt-spark polyline { fill: none; stroke: var(--pt-blue); stroke-width: 2.5; stroke-linejoin: round; vector-effect: non-scaling-stroke; }

.pt-toc { display: flex; gap: 8px; flex-wrap: wrap; }
.pt-notesec { scroll-margin-top: 124px; }
.pt-kv { margin: 0; display: grid; gap: 12px; }
.pt-kv div { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 12px; }
.pt-kv dt { font-weight: 750; color: var(--pt-ink2); }
.pt-kv dd { margin: 0; }
.pt-steps, .pt-list { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
.pt-table-scroll { overflow-x: auto; }
.pt-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 680px; }
.pt-table th, .pt-table td { text-align: left; padding: 10px; border-bottom: 1px solid var(--pt-line); vertical-align: top; }
.pt-table thead th { font-size: 12px; text-transform: uppercase; letter-spacing: .05em; color: var(--pt-ink3); }
.pt-table tbody th small { display: block; font-weight: 600; color: var(--pt-ink3); }
.pt-facts { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.pt-facts li { display: grid; gap: 6px; justify-items: start; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--pt-line); background: #fbfcfd; }
.pt-src { font-size: 13px; color: var(--pt-ink3); }
.pt-res { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); }
.pt-res li { border: 1px solid var(--pt-line); border-radius: 12px; padding: 12px 14px; display: grid; gap: 6px; align-content: start; background: #fbfcfd; }
.pt-res-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.pt-settings { display: grid; gap: 18px; }
.pt-setting { display: grid; gap: 8px; padding-bottom: 18px; border-bottom: 1px solid var(--pt-line); }
.pt-setting:last-child { border-bottom: 0; padding-bottom: 0; }
.pt-banner { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 12px 16px; border-radius: 14px; background: var(--pt-blue-soft); color: #0b3d75; font-weight: 600; }
.pt-banner p { flex: 1 1 260px; }
.pt-banner.is-good { background: var(--pt-green-soft); color: #145c2c; }
.pt-banner.is-warn { background: var(--pt-amber-soft); color: #6b4100; }
.pt-footer { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 8px 20px 44px; color: var(--pt-ink3); font-size: 14px; text-align: center; }
.pt-footer .pt-mark { width: 28px; height: 14px; color: var(--pt-blue); flex: none; }

.pt-locked { display: grid; place-items: center; padding: 24px 16px; background: radial-gradient(900px 520px at 50% -10%, #d7e7ff, transparent 70%), var(--pt-bg); }
.pt-opening { color: var(--pt-ink3); font-weight: 650; }
.pt-lock-card { width: min(420px, 100%); background: #fff; border: 1px solid var(--pt-line); border-radius: 22px; box-shadow: 0 24px 60px -24px rgba(28,43,51,.3); padding: 30px 26px 24px; display: grid; gap: 12px; text-align: center; }
.pt-lock-icon { width: 58px; height: 58px; margin: 0 auto 4px; border-radius: 18px; display: grid; place-items: center; color: #fff; background: linear-gradient(135deg, #0064e0, #0082fb); }
.pt-lock-icon svg { width: 30px; height: 30px; }
.pt-lock-card h1 { font-size: 26px; }
.pt-lock-card > p { color: var(--pt-ink2); }
.pt-gate-form { display: grid; gap: 12px; text-align: left; margin-top: 6px; }
.pt-gate-form > label { font-size: 13px; font-weight: 700; color: var(--pt-ink2); }
.pt-password { display: flex; border: 1px solid var(--pt-line2); border-radius: 12px; background: #f7f9fb; overflow: hidden; }
.pt-password:focus-within { border-color: var(--pt-blue); box-shadow: 0 0 0 3px rgba(0,100,224,.18); background: #fff; }
.pt-password input { flex: 1; min-width: 0; border: 0; background: transparent; padding: 11px 12px; font: inherit; font-size: 16px; color: var(--pt-ink); }
.pt-password input:focus, .pt-password input:focus-visible { outline: none; box-shadow: none; }
.pt-password button { border: 0; background: none; padding: 0 14px; font-weight: 700; color: var(--pt-blue); }
.pt-gate-form .pt-primary { justify-self: stretch; padding: 12px 18px; }
.pt-gate-error { min-height: 1.4em; color: var(--pt-red); font-size: 14px; font-weight: 650; }
.pt-gate-note { color: var(--pt-ink3); font-size: 12.5px; }
.pt-lock-card .pt-back { justify-self: center; }

@keyframes pt-pulse { 50% { opacity: .35; } }
@media (max-width: 900px) {
  .pt-grid2 { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 720px) {
  .pt-weekrow { grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: "no main chev" "no tags tags"; row-gap: 6px; }
  .pt-weekno { grid-area: no; }
  .pt-weekrow-main { grid-area: main; }
  .pt-weekrow > .pt-chev { grid-area: chev; }
  .pt-weekrow-tags { grid-area: tags; justify-content: flex-start; }
  .pt-weekrow-tags:empty { display: none; }
  .pt-weekrow-h { display: none; }
}
@media (max-width: 640px) {
  .pt-wrap { padding: 0 14px; }
  .pt-hide-sm, .pt-top-mark { display: none; }
  .pt-save-text { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .pt-hero { flex-direction: column; align-items: stretch; padding-top: 22px; padding-bottom: 24px; gap: 16px; }
  .pt-hero-side { padding: 12px 14px; gap: 14px; }
  .pt-ring { width: 72px; height: 72px; }
  .pt-ring b { font-size: 22px; }
  .pt-hero-stats { min-width: 0; flex: 1; }
  .pt-card { padding: 16px; }
  .pt-main { padding-top: 16px; gap: 14px; }
  .pt-form-row { grid-template-columns: minmax(0, 1fr); }
  .pt-glance { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pt-tiles, .pt-tiles.is-compact { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .pt-tile { padding: 12px; }
  .pt-tile-value { font-size: 22px; }
  .pt-kv div { grid-template-columns: minmax(0, 1fr); gap: 2px; }
  .pt-entry-row { grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: "tag title chev" "tag meta chev"; row-gap: 2px; }
  .pt-entry-row > .pt-tag { grid-area: tag; }
  .pt-entry-title { grid-area: title; }
  .pt-entry-meta { grid-area: meta; white-space: normal; }
  .pt-entry-row > .pt-chev { grid-area: chev; }
  .pt-story-row { grid-template-columns: minmax(0, 1fr) auto auto; }
  .pt-story-words { display: none; }
  .pt-hours-done { margin-left: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .pt-root *, .pt-root *::before, .pt-root *::after { transition: none !important; animation: none !important; }
}`
