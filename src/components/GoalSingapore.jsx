import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { SINGAPORE_PAYLOAD as PAYLOAD } from '../lib/singaporePayload'

/* ------------------------------------------------------------------ *
 * #/singapore (also #/goal-singapore) — a private goal page.
 *
 * Same lock as #/vegas and #/europe: the content ships encrypted
 * (PBKDF2-SHA256 → AES-GCM-256) and only decrypts in the browser with
 * the passphrase. Every word of the plan, section titles included, lives
 * inside the payload, so this file is a generic renderer and says
 * nothing on its own. Edit the content with scripts/private-payload.mjs
 * (decrypt → edit → encrypt). The payload is { meta, tabs: [{ id, label,
 * blocks }] }; an older { meta, blocks } payload renders as one tab.
 *
 * Ticks, the target date and the open tab stay in localStorage: per
 * device, ids and booleans only, never the text.
 * ------------------------------------------------------------------ */

const ITER = PAYLOAD.iter || 200000
const b64ToU8 = (b) => Uint8Array.from(atob(b), (c) => c.charCodeAt(0))
const enc = new TextEncoder()
const dec = new TextDecoder()

async function unlock(pass) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64ToU8(PAYLOAD.salt), iterations: ITER, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt'],
  )
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToU8(PAYLOAD.iv) }, key, b64ToU8(PAYLOAD.ct))
  const obj = JSON.parse(dec.decode(pt))
  const list = (b) => (Array.isArray(b) ? b : [])
  const tabs = Array.isArray(obj.tabs) && obj.tabs.length
    ? obj.tabs.map((t, i) => ({ id: String(t.id || `tab${i}`), label: t.label || `Part ${i + 1}`, blocks: list(t.blocks) }))
    : [{ id: 'plan', label: 'Plan', blocks: list(obj.blocks) }]
  return { meta: obj.meta || {}, tabs }
}

// In-memory only, so coming back within the same page load stays
// unlocked and a full reload asks again.
let cached = null

const KEY = 'sg_goal_v1'
function loadProgress() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (v && typeof v === 'object') {
      return {
        done: v.done && typeof v.done === 'object' ? v.done : {},
        target: typeof v.target === 'string' ? v.target : '',
        tab: typeof v.tab === 'string' ? v.tab : '',
      }
    }
  } catch {}
  return { done: {}, target: '', tab: '' }
}
const saveProgress = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)) } catch {} }

function daysUntil(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '')
  if (!m) return null
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - today) / 864e5)
}
function countdown(n) {
  if (n > 1) return `${n.toLocaleString('en-GB')} days to go`
  if (n === 1) return 'Tomorrow'
  if (n === 0) return 'Today'
  return `${Math.abs(n).toLocaleString('en-GB')} day${n === -1 ? '' : 's'} past`
}

// **bold** and [label](https://…) — all the formatting the payload needs.
function Inline({ text }) {
  if (!text) return null
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g
  const out = []
  let last = 0
  let m
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(m[1]
      ? <strong key={m.index}>{m[1]}</strong>
      : <a key={m.index} href={m[3]} target="_blank" rel="noopener noreferrer">{m[2]}</a>)
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return <>{out}</>
}

/* ---------------------------- the art ----------------------------- */

const GROUND = 220
// [x, width, top] — the business district on the left, a pair on the right.
const TOWERS = [
  [8, 44, 150], [58, 30, 118], [94, 50, 164], [150, 24, 92], [180, 58, 138],
  [244, 32, 66], [282, 46, 116], [334, 28, 148], [368, 54, 100], [428, 34, 134],
  [468, 48, 158], [522, 30, 124], [556, 26, 192], [1108, 40, 160], [1154, 46, 134],
]
const MBS = [706, 762, 818]
const TREES = [[904, 178], [928, 166], [950, 182]]
const FLYER = { cx: 1040, cy: 146, r: 56 }

// Seeded, so the same windows are lit on every visit.
function seeded(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}
function litWindows() {
  const r = seeded(7)
  const out = []
  for (const [x, w, top] of TOWERS) {
    for (let y = top + 8; y < GROUND - 8; y += 9) {
      for (let wx = x + 5; wx < x + w - 6; wx += 8) {
        if (r() < 0.2) out.push({ x: wx, y, tw: r() < 0.16, d: +(r() * 7).toFixed(2) })
      }
    }
  }
  return out
}

function Skyline({ className, mono = false }) {
  const uid = useId().replace(/:/g, '')
  const wins = useMemo(() => (mono ? [] : litWindows()), [mono])
  const bld = mono ? 'currentColor' : `url(#${uid}-b)`
  const city = (
    <g>
      {TOWERS.map(([x, w, top]) => <rect key={x} x={x} y={top} width={w} height={GROUND - top} fill={bld} />)}
      <rect x={380} y={88} width={30} height={14} fill={bld} />
      <path d="M259 66V42" stroke={mono ? 'currentColor' : '#1a2338'} strokeWidth="2" />
      {/* ArtScience Museum */}
      <path d="M594 220C597 210 601 202 607 195L617 210C621 199 629 190 639 184L641 205C647 196 655 190 665 188L659 209C663 212 665 216 667 220Z" fill={bld} />
      {/* Marina Bay Sands */}
      <rect x={690} y={206} width={200} height={14} fill={bld} />
      {MBS.map((x) => <path key={x} d={`M${x} 84H${x + 32}V220H${x - 9}Q${x - 1} 168 ${x} 84Z`} fill={bld} />)}
      <path d="M694 84L698 74H872Q884 74 890 79L886 84Z" fill={bld} />
      {!mono && MBS.map((x) => (
        <path key={`b${x}`} d={Array.from({ length: 18 }, (_, i) => `M${x + 2} ${92 + i * 7}h28`).join('')}
          stroke="#ffc56b" strokeOpacity=".2" strokeWidth="1.1" />
      ))}
      {/* Gardens by the Bay */}
      {TREES.map(([cx, top]) => (
        <g key={cx}>
          <path d={`M${cx - 3} 220L${cx - 1.5} ${top + 8}H${cx + 1.5}L${cx + 3} 220Z`} fill={bld} />
          <path d={`M${cx - 15} ${top}H${cx + 15}L${cx + 3} ${top + 10}H${cx - 3}Z`} fill={bld} />
          {!mono && <path d={`M${cx - 15} ${top}H${cx + 15}`} stroke="#c4a1ff" strokeOpacity=".7" strokeWidth="1.4" />}
        </g>
      ))}
      {/* Singapore Flyer */}
      <path d={`M${FLYER.cx} ${FLYER.cy}L${FLYER.cx - 22} 220M${FLYER.cx} ${FLYER.cy}L${FLYER.cx + 22} 220`}
        stroke={mono ? 'currentColor' : '#141c30'} strokeWidth="4" />
      <circle cx={FLYER.cx} cy={FLYER.cy} r={FLYER.r} fill="none" stroke={mono ? 'currentColor' : '#2a3552'} strokeWidth="2.2" />
      {!mono && Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2
        return <path key={`s${i}`} d={`M${FLYER.cx} ${FLYER.cy}L${(FLYER.cx + FLYER.r * Math.cos(a)).toFixed(1)} ${(FLYER.cy + FLYER.r * Math.sin(a)).toFixed(1)}`} stroke="#1c2540" strokeWidth=".8" />
      })}
      {!mono && Array.from({ length: 28 }, (_, i) => {
        const a = (i / 28) * Math.PI * 2
        return <circle key={`c${i}`} cx={(FLYER.cx + FLYER.r * Math.cos(a)).toFixed(1)} cy={(FLYER.cy + FLYER.r * Math.sin(a)).toFixed(1)} r="1.9" fill="#ffc56b" fillOpacity=".75" />
      })}
      <rect x={990} y={204} width={110} height={16} fill={bld} />
      {wins.map((w, i) => (
        <rect key={i} className={w.tw ? 'sg-win tw' : 'sg-win'} x={w.x} y={w.y} width="3" height="4"
          style={w.tw ? { animationDelay: `${w.d}s` } : undefined} />
      ))}
    </g>
  )

  return (
    <svg className={className} viewBox="0 0 1200 260" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      {!mono && (
        <defs>
          <linearGradient id={`${uid}-b`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#151d32" />
            <stop offset="1" stopColor="#0a0f1c" />
          </linearGradient>
          <linearGradient id={`${uid}-w`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0f1629" />
            <stop offset="1" stopColor="#070b14" />
          </linearGradient>
          <linearGradient id={`${uid}-f`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".55" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id={`${uid}-m`}>
            <rect x="0" y={GROUND} width="1200" height="40" fill={`url(#${uid}-f)`} />
          </mask>
        </defs>
      )}
      {!mono && <rect x="0" y={GROUND} width="1200" height="40" fill={`url(#${uid}-w)`} />}
      {city}
      {!mono && (
        <>
          <g mask={`url(#${uid}-m)`} opacity=".5">
            <g transform={`translate(0 ${GROUND * 2}) scale(1 -1)`}>{city}</g>
          </g>
          <path d="M700 230h46M770 236h30M812 243h40M1010 232h36M1052 240h22M612 238h24M150 234h40M300 244h28"
            stroke="#ffc56b" strokeOpacity=".22" strokeWidth="1.2" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

function starPoints(cx, cy, r) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? r * 0.42 : r
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`)
  }
  return pts.join(' ')
}
// A crescent with five stars inside its curve.
function crescent(uid, cx, cy, r, color) {
  const ring = (n) => Array.from({ length: 5 }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    return <polygon key={`${n}${i}`} points={starPoints(cx + r * 0.82 + r * 0.4 * Math.cos(a), cy + r * 0.4 * Math.sin(a), r * 0.13)} fill={color} />
  })
  return (
    <>
      <mask id={uid}>
        <rect x={cx - r * 2} y={cy - r * 2} width={r * 5} height={r * 4} fill="#fff" />
        <circle cx={cx + r * 0.36} cy={cy - r * 0.05} r={r * 0.88} fill="#000" />
      </mask>
      <circle cx={cx} cy={cy} r={r} fill={color} mask={`url(#${uid})`} />
      {ring('s')}
    </>
  )
}

function Moon({ className }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      {crescent(`${uid}-c`, 26, 32, 21, '#fff')}
    </svg>
  )
}

function Flag({ className }) {
  const uid = useId().replace(/:/g, '')
  return (
    <svg className={className} viewBox="0 0 90 60" aria-hidden="true" focusable="false">
      <clipPath id={`${uid}-r`}><rect width="90" height="60" rx="6" /></clipPath>
      <g clipPath={`url(#${uid}-r)`}>
        <rect width="90" height="30" fill="#ef3340" />
        <rect y="30" width="90" height="30" fill="#f4f5f8" />
        {crescent(`${uid}-c`, 18, 15, 9, '#fff')}
      </g>
    </svg>
  )
}

const Tick = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
)
const BackIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
)
const LockIcon = ({ className, style }) => (
  <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
)

/* ---------------------------- the blocks -------------------------- */

function Head({ b, aside }) {
  return (
    <div className="sg-head">
      <div>
        {b.kicker && <p className="sg-k">{b.kicker}</p>}
        {b.title && <h2 className="sg-h2">{b.title}</h2>}
      </div>
      {aside}
    </div>
  )
}

function Road({ b, prog, toggle, setTarget }) {
  const dateId = useId()
  const items = b.items || []
  const done = items.filter((it) => prog.done[it.id]).length
  const next = items.find((it) => !prog.done[it.id])?.id
  const days = daysUntil(prog.target)
  return (
    <section className="sg-sec">
      <Head b={b} />
      {b.intro && <p className="sg-intro"><Inline text={b.intro} /></p>}
      <div className="sg-card sg-road">
        <div className="sg-road-top">
          <p className="sg-count"><b>{done}</b><span>of {items.length} done</span></p>
          <div className="sg-date">
            <label htmlFor={dateId}>{b.targetLabel || 'Target date'}</label>
            <input id={dateId} type="date" value={prog.target} onChange={(e) => setTarget(e.target.value)} />
            {days !== null && <span className="sg-days">{countdown(days)}</span>}
          </div>
        </div>
        <div className="sg-track" role="progressbar" aria-label="Progress" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={done}>
          <span style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} />
        </div>
        <ol className="sg-steps">
          {items.map((it, i) => {
            const on = !!prog.done[it.id]
            return (
              <li key={it.id} className={on ? 'is-done' : undefined}>
                <label className="sg-step">
                  <input type="checkbox" className="sg-cb" checked={on} onChange={() => toggle(it.id)} />
                  <span className="sg-dot" aria-hidden="true">{on ? <Tick /> : i + 1}</span>
                  <span className="sg-step-t"><Inline text={it.text} /></span>
                  {it.id === next && <span className="sg-next">Next</span>}
                </label>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

function Stat({ b }) {
  return (
    <section className="sg-sec">
      <div className="sg-card sg-stat">
        {b.kicker && <p className="sg-k">{b.kicker}</p>}
        <p className="sg-stat-v">{b.value}</p>
        <p className="sg-stat-u">{b.unit}{b.sub && <span> · {b.sub}</span>}</p>
        {b.body && <p className="sg-stat-b"><Inline text={b.body} /></p>}
        {b.note && <p className="sg-stat-n"><Inline text={b.note} /></p>}
      </div>
    </section>
  )
}

const plain = (t) => String(t || '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')

// Every id that can be ticked in a block, for the progress counts.
function tickables(b) {
  switch (b.type) {
    case 'road':
    case 'checklist': return (b.items || []).map((it) => it.id).filter(Boolean)
    case 'resources': return (b.groups || []).flatMap((g) => (g.items || []).map((it) => it.id)).filter(Boolean)
    case 'folds': return (b.items || []).flatMap((c) => (c.ticks || []).map((it) => it.id)).filter(Boolean)
    default: return []
  }
}

const k = (n) => `${Math.round(n * 10) / 10}k`

// r.range is [low, high] in thousands. Every word around it, and the mark
// it is measured against, come from the block's `scale` in the payload.
function RangeLine({ r, scale = {} }) {
  const range = Array.isArray(r.range) && r.range.length === 2 ? r.range : null
  let mark = null
  if (range && scale.mark) {
    mark = range[0] >= scale.mark ? ['ok', scale.above]
      : range[1] >= scale.mark ? ['mid', scale.within]
        : ['low', scale.below]
    if (!mark[1]) mark = null
  }
  const head = range
    ? <span className="sg-rl-a"><b>{scale.prefix || ''}{k(range[0])}–{k(range[1])}</b>{scale.suffix ? ` ${scale.suffix}` : ''}</span>
    : scale.none ? <span className="sg-rl-a">{scale.none}</span> : null
  return (
    <span className="sg-rl">
      {(head || mark) && <span className="sg-rl-row">{head}{mark && <span className={`sg-v ${mark[0]}`}>{mark[1]}</span>}</span>}
      {r.req && <span className="sg-rl-b">{scale.req ? `${scale.req} ` : ''}{r.req}</span>}
    </span>
  )
}

// A tickable row. With a link, the box and the link are separate targets:
// the title opens the resource, the box marks it done.
function CheckRow({ it, on, toggle }) {
  if (!it.url) {
    return (
      <li>
        <label className="sg-check">
          <span className="sg-hit">
            <input type="checkbox" className="sg-cb" checked={on} onChange={() => toggle(it.id)} />
            <span className="sg-box" aria-hidden="true"><Tick /></span>
          </span>
          <span className="sg-check-t">
            <Inline text={it.text} />
            {it.note && <small><Inline text={it.note} /></small>}
          </span>
        </label>
      </li>
    )
  }
  return (
    <li className={on ? 'sg-res is-done' : 'sg-res'}>
      <label className="sg-hit">
        <input type="checkbox" className="sg-cb" checked={on} onChange={() => toggle(it.id)} aria-label={`Done: ${plain(it.text)}`} />
        <span className="sg-box" aria-hidden="true"><Tick /></span>
      </label>
      <span className="sg-check-t">
        <a className="sg-res-a" href={it.url} target="_blank" rel="noopener noreferrer">
          {plain(it.text)}<span className="sg-ext" aria-hidden="true">{'\u00a0'}↗</span>
        </a>
        {it.note && <small><Inline text={it.note} /></small>}
      </span>
    </li>
  )
}

function Checklist({ b, prog, toggle }) {
  const items = b.items || []
  const done = items.filter((it) => prog.done[it.id]).length
  const full = items.length > 0 && done === items.length
  return (
    <section className="sg-sec">
      <Head b={b} aside={<span className={full ? 'sg-pill full' : 'sg-pill'}>{done} / {items.length}</span>} />
      {b.intro && <p className="sg-intro"><Inline text={b.intro} /></p>}
      <ul className="sg-card sg-checks">
        {items.map((it) => <CheckRow key={it.id} it={it} on={!!prog.done[it.id]} toggle={toggle} />)}
      </ul>
      {b.footer && <p className="sg-aside"><Inline text={b.footer} /></p>}
    </section>
  )
}

function Progress({ b, blocks, prog, jump }) {
  const parts = blocks.map((x, i) => ({ i, x, ids: tickables(x) })).filter((p) => p.ids.length)
  const all = parts.flatMap((p) => p.ids)
  const done = all.filter((id) => prog.done[id]).length
  const pct = (d, n) => `${n ? (d / n) * 100 : 0}%`
  return (
    <section className="sg-sec">
      <Head b={b} />
      {b.intro && <p className="sg-intro"><Inline text={b.intro} /></p>}
      <div className="sg-card sg-prog">
        <p className="sg-count"><b>{done}</b><span>of {all.length} done</span></p>
        <div className="sg-track" role="progressbar" aria-label="Progress" aria-valuemin={0} aria-valuemax={all.length} aria-valuenow={done}>
          <span style={{ width: pct(done, all.length) }} />
        </div>
        <ul className="sg-parts">
          {parts.map((p) => {
            const d = p.ids.filter((id) => prog.done[id]).length
            return (
              <li key={p.i}>
                <button type="button" className="sg-part" onClick={() => jump(p.i)}>
                  <span className="sg-part-l">{p.x.short || p.x.kicker || p.x.title}</span>
                  <span className="sg-part-bar" aria-hidden="true"><span style={{ width: pct(d, p.ids.length) }} /></span>
                  <span className="sg-part-n">{d}/{p.ids.length}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

const Chevron = () => (
  <svg className="sg-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
)

// Collapsible cards: a heading, rows with a range line, link pills and
// tickable items. The words between them come from the block's `words`.
function Folds({ b, prog, toggle }) {
  const items = b.items || []
  const w = b.words || {}
  const [open, setOpen] = useState(() => (items[0] ? { [items[0].id]: true } : {}))
  return (
    <section className="sg-sec">
      <Head b={b} />
      {b.intro && <p className="sg-intro"><Inline text={b.intro} /></p>}
      <ul className="sg-folds">
        {items.map((c) => {
          const ids = (c.ticks || []).map((p) => p.id)
          const d = ids.filter((id) => prog.done[id]).length
          const rows = c.rows || []
          return (
            <li key={c.id}>
              <details className="sg-card sg-fold" open={!!open[c.id]}
                onToggle={(e) => { const o = e.currentTarget.open; setOpen((s) => (!!s[c.id] === o ? s : { ...s, [c.id]: o })) }}>
                <summary>
                  <span className="sg-fold-h">
                    <span className="sg-fold-n">{c.name}</span>
                    {c.tag && <span className={c.best ? 'sg-tag best' : 'sg-tag'}>{c.tag}</span>}
                    <Chevron />
                  </span>
                  {c.line && <span className="sg-fold-line"><Inline text={c.line} /></span>}
                  <span className="sg-fold-meta">
                    {rows.length}{rows.length === 1 ? (w.one ? ` ${w.one}` : '') : (w.many ? ` ${w.many}` : '')}
                    {ids.length > 0 && <> · {w.ticks ? `${w.ticks} ` : ''}<b className={d === ids.length ? 'full' : undefined}>{d}/{ids.length}</b></>}
                  </span>
                </summary>
                <div className="sg-fold-body">
                  {rows.length > 0 && (
                    <>
                      {w.rowsHead && <p className="sg-sub">{w.rowsHead}</p>}
                      <ul className="sg-fold-rows">
                        {rows.map((r, i) => (
                          <li key={i}>
                            {r.url
                              ? <a className="sg-row-t" href={r.url} target="_blank" rel="noopener noreferrer">{r.title}<span className="sg-ext" aria-hidden="true">{'\u00a0'}↗</span></a>
                              : <span className="sg-row-t">{r.title}</span>}
                            <RangeLine r={r} scale={b.scale} />
                            {r.note && <span className="sg-row-n"><Inline text={r.note} /></span>}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {Array.isArray(c.links) && c.links.length > 0 && (
                    <p className="sg-fold-links">
                      {c.links.map((l, i) => (
                        <a key={i} className="sg-linkpill" href={l.url} target="_blank" rel="noopener noreferrer">{l.label}<span aria-hidden="true">↗</span></a>
                      ))}
                    </p>
                  )}
                  {ids.length > 0 && (
                    <>
                      {w.ticksHead && <p className="sg-sub">{w.ticksHead}</p>}
                      <ul className="sg-checks sg-flat">
                        {(c.ticks || []).map((it) => <CheckRow key={it.id} it={it} on={!!prog.done[it.id]} toggle={toggle} />)}
                      </ul>
                    </>
                  )}
                </div>
              </details>
            </li>
          )
        })}
      </ul>
      {b.note && <p className="sg-note"><Inline text={b.note} /></p>}
    </section>
  )
}

function Tiles({ b }) {
  return (
    <section className="sg-sec">
      <Head b={b} />
      {b.intro && <p className="sg-intro"><Inline text={b.intro} /></p>}
      <ul className="sg-tiles">
        {(b.items || []).map((it, i) => (
          <li key={i}>
            <a className="sg-card sg-tile" href={it.url} target="_blank" rel="noopener noreferrer">
              <span className="sg-tile-k">{it.name}</span>
              <span className="sg-row-t">{it.title}<span className="sg-ext" aria-hidden="true">{'\u00a0'}↗</span></span>
              <RangeLine r={it} scale={b.scale} />
              {it.note && <span className="sg-row-n"><Inline text={it.note} /></span>}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Resources({ b, prog, toggle }) {
  const ids = tickables(b)
  const done = ids.filter((id) => prog.done[id]).length
  const full = ids.length > 0 && done === ids.length
  return (
    <section className="sg-sec">
      <Head b={b} aside={ids.length > 0 && <span className={full ? 'sg-pill full' : 'sg-pill'}>{done} / {ids.length}</span>} />
      {b.intro && <p className="sg-intro"><Inline text={b.intro} /></p>}
      {(b.groups || []).map((g, gi) => (
        <div key={gi} className="sg-group">
          {g.title && <p className="sg-sub">{g.title}</p>}
          <ul className="sg-card sg-checks">
            {(g.items || []).map((it) => <CheckRow key={it.id} it={it} on={!!prog.done[it.id]} toggle={toggle} />)}
          </ul>
        </div>
      ))}
      {b.note && <p className="sg-note"><Inline text={b.note} /></p>}
    </section>
  )
}

function Cards({ b }) {
  return (
    <section className="sg-sec">
      <Head b={b} />
      <ul className="sg-cards">
        {(b.items || []).map((it, i) => (
          <li key={i} className="sg-card sg-cardi">
            {it.icon && <span className="sg-cardi-i" aria-hidden="true">{it.icon}</span>}
            <h3>{it.title}</h3>
            <p><Inline text={it.body} /></p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Roles({ b }) {
  return (
    <section className="sg-sec">
      <Head b={b} />
      <ul className="sg-roles">
        {(b.items || []).map((it, i) => (
          <li key={i}>
            <a className="sg-card sg-role" href={it.url} target="_blank" rel="noopener noreferrer">
              <span className="sg-role-h">
                <span className="sg-role-t">{it.title}</span>
                {it.tag && <span className={it.best ? 'sg-tag best' : 'sg-tag'}>{it.tag}</span>}
              </span>
              {(it.points || []).map((p, j) => <span key={j} className="sg-role-p"><Inline text={p} /></span>)}
              <span className="sg-role-go">View posting <span aria-hidden="true">↗</span></span>
            </a>
          </li>
        ))}
      </ul>
      {b.note && <p className="sg-note"><Inline text={b.note} /></p>}
    </section>
  )
}

function Steps({ b }) {
  return (
    <section className="sg-sec">
      <Head b={b} />
      <ol className="sg-tl">
        {(b.items || []).map((it, i) => (
          <li key={i}>
            {it.when && <span className="sg-when">{it.when}</span>}
            <h3>{it.title}</h3>
            <ul>{(it.points || []).map((p, j) => <li key={j}><Inline text={p} /></li>)}</ul>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Grid({ b }) {
  return (
    <section className="sg-sec">
      <Head b={b} />
      <dl className="sg-grid">
        {(b.items || []).map((it, i) => (
          <div key={i} className="sg-card sg-cell">
            <dt>{it.k}</dt>
            <dd className="v">{it.v}</dd>
            {it.sub && <dd className="s">{it.sub}</dd>}
          </div>
        ))}
      </dl>
      {b.note && <p className="sg-note"><Inline text={b.note} /></p>}
    </section>
  )
}

function List({ b }) {
  return (
    <section className="sg-sec">
      <Head b={b} />
      <ul className="sg-warn">
        {(b.items || []).map((t, i) => <li key={i} className="sg-card"><Inline text={t} /></li>)}
      </ul>
    </section>
  )
}

function Rule({ b }) {
  return (
    <section className="sg-sec">
      <figure className="sg-rule">
        <Flag className="sg-flag" />
        {b.kicker && <figcaption className="sg-k">{b.kicker}</figcaption>}
        <blockquote><Inline text={b.text} /></blockquote>
      </figure>
    </section>
  )
}

function Sources({ b }) {
  return (
    <section className="sg-sec sg-sources">
      <Head b={b} />
      <ul>
        {(b.items || []).map((it, i) => (
          <li key={i}><a href={it.url} target="_blank" rel="noopener noreferrer">{it.label}</a></li>
        ))}
      </ul>
      {b.note && <p className="sg-note"><Inline text={b.note} /></p>}
    </section>
  )
}

/* ----------------------------- the page --------------------------- */

function Plan({ data, onBack }) {
  const { meta, tabs } = data
  const [prog, setProg] = useState(loadProgress)
  const topRef = useRef(null)
  const mainRef = useRef(null)
  const tabRefs = useRef([])
  useEffect(() => { saveProgress(prog) }, [prog])
  useEffect(() => { window.scrollTo(0, 0) }, [])

  const active = tabs.find((t) => t.id === prog.tab) || tabs[0]
  const toggle = (id) => setProg((p) => ({ ...p, done: { ...p.done, [id]: !p.done[id] } }))
  const setTarget = (target) => setProg((p) => ({ ...p, target }))
  const lines = Array.isArray(meta.lines) ? meta.lines : meta.line ? [meta.line] : []
  const smooth = () => (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth')

  // Bring the start of the content up under the bar: a new tab should
  // never open half-way down, or below the hero out of sight.
  const showContent = () => requestAnimationFrame(() => {
    const el = mainRef.current
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - (topRef.current?.offsetHeight || 0)
    window.scrollTo({ top: Math.max(0, top), behavior: smooth() })
  })
  const pick = (id) => {
    if (id !== active.id) setProg((p) => ({ ...p, tab: id }))
    showContent()
  }
  const onTabKey = (e) => {
    const i = tabs.findIndex((t) => t.id === active.id)
    const n = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key]
    if (n === undefined) return
    e.preventDefault()
    pick(tabs[n].id)
    tabRefs.current[n]?.focus()
  }
  // Sections are reached with buttons, not #anchors: the hash is the route.
  const jump = (i) => document.getElementById(`sg-${active.id}-${i}`)?.scrollIntoView({ behavior: smooth(), block: 'start' })

  const block = (b, i) => {
    switch (b.type) {
      case 'road': return <Road b={b} prog={prog} toggle={toggle} setTarget={setTarget} />
      case 'stat': return <Stat b={b} />
      case 'checklist': return <Checklist b={b} prog={prog} toggle={toggle} />
      case 'cards': return <Cards b={b} />
      case 'roles': return <Roles b={b} />
      case 'steps': return <Steps b={b} />
      case 'grid': return <Grid b={b} />
      case 'list': return <List b={b} />
      case 'rule': return <Rule b={b} />
      case 'sources': return <Sources b={b} />
      case 'progress': return <Progress b={b} blocks={active.blocks} prog={prog} jump={jump} />
      case 'folds': return <Folds b={b} prog={prog} toggle={toggle} />
      case 'tiles': return <Tiles b={b} />
      case 'resources': return <Resources b={b} prog={prog} toggle={toggle} />
      default: return null
    }
  }
  const multi = tabs.length > 1

  return (
    <div className="sg-root">
      <style>{CSS}</style>
      <div className="sg-top" ref={topRef}>
        <div className={multi ? 'sg-top-in has-tabs' : 'sg-top-in'}>
          <button type="button" className="sg-back" onClick={onBack}>
            <BackIcon /><span>Back to site</span>
          </button>
          {multi && (
            <div className="sg-tabs" role="tablist" aria-label="Sections" onKeyDown={onTabKey}>
              {tabs.map((t, i) => {
                const on = t.id === active.id
                return (
                  <button key={t.id} ref={(el) => { tabRefs.current[i] = el }} type="button" role="tab"
                    id={`sg-tab-${t.id}`} aria-selected={on} aria-controls="sg-panel" tabIndex={on ? 0 : -1}
                    className={on ? 'sg-tab on' : 'sg-tab'} onClick={() => pick(t.id)}>
                    {t.label}
                  </button>
                )
              })}
            </div>
          )}
          <span className="sg-mono">{meta.bar || 'Private'}</span>
        </div>
      </div>

      <header className="sg-hero">
        <div className="sg-sky" aria-hidden="true" />
        <div className="sg-stars" aria-hidden="true" />
        <Moon className="sg-moon" />
        <div className="sg-hero-in">
          {meta.kicker && <p className="sg-kick">{meta.kicker}</p>}
          <h1 className="sg-title">{meta.title}</h1>
          {lines.length > 0 && (
            <p className="sg-lines">{lines.map((l, i) => <span key={i}><Inline text={l} /></span>)}</p>
          )}
          {Array.isArray(meta.chips) && meta.chips.length > 0 && (
            <ul className="sg-chips">
              {meta.chips.map((c, i) => (
                <li key={i} className="sg-chip"><span className="sg-chip-k">{c.k}</span><span className="sg-chip-v">{c.v}</span></li>
              ))}
            </ul>
          )}
        </div>
        <Skyline className="sg-city" />
      </header>

      <main className="sg-main" ref={mainRef} id="sg-panel"
        {...(multi ? { role: 'tabpanel', 'aria-labelledby': `sg-tab-${active.id}` } : {})}>
        {active.blocks.map((b, i) => (
          <div key={`${active.id}-${i}`} id={`sg-${active.id}-${i}`} className="sg-anchor">{block(b, i)}</div>
        ))}
        <p className="sg-end"><LockIcon className="sg-end-i" />Encrypted · decrypts only in this browser</p>
      </main>
    </div>
  )
}

function Gate({ onBack, onUnlock }) {
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onBack?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBack])

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setError(''); setBusy(true)
    try {
      onUnlock(await unlock(pw))
    } catch {
      setBusy(false)
      setError('Wrong passphrase — try again.')
      setShake(true); setTimeout(() => setShake(false), 450)
      inputRef.current?.select()
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-6">
      <style>{CSS}</style>
      <div className="pr-backdrop-base" aria-hidden="true" />
      <div className="pr-backdrop-glow" aria-hidden="true" />
      <div className="pr-backdrop-noise" aria-hidden="true" />
      <div className="sg-gate-city" aria-hidden="true"><Skyline className="sg-gate-svg" mono /></div>

      <button type="button" onClick={onBack}
        className="absolute top-5 left-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
        <span className="w-4 h-4 inline-flex"><BackIcon /></span>
        Back
      </button>

      <main
        className={`relative z-10 w-full max-w-[400px] rounded-2xl p-8 sm:p-10 text-center ${shake ? 'animate-shake' : ''}`}
        style={{
          background: 'color-mix(in oklab, var(--color-card) 78%, transparent)',
          border: '1px solid var(--color-border)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 24px 70px rgba(0,0,0,.5)',
        }}
      >
        <div className="mx-auto mb-5 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'color-mix(in oklab, var(--color-accent) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--color-accent) 30%, transparent)' }}>
          <LockIcon className="w-5 h-5" style={{ color: 'var(--color-accent)' }} />
        </div>

        <h1 className="font-heading text-[1.6rem] mb-2" style={{ fontWeight: 500 }}>This page is private</h1>
        <p className="text-sm text-muted-foreground mb-7 leading-relaxed">A goal in progress. Enter the passphrase to continue.</p>

        <form onSubmit={submit} autoComplete="off" className="flex flex-col gap-3">
          <div className="relative">
            <input
              ref={inputRef}
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Passphrase"
              autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck="false"
              aria-label="Passphrase"
              className="w-full rounded-xl py-3 pl-3.5 pr-11 text-[15px] font-mono outline-none transition-all"
              style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-foreground)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in oklab, var(--color-accent) 22%, transparent)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
            />
            <button type="button" onClick={() => { setShow((s) => !s); inputRef.current?.focus() }}
              aria-label="Show or hide passphrase"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors">
              {show ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4 4M9.4 4.2A10.6 10.6 0 0 1 12 4c6 0 10 8 10 8a18.5 18.5 0 0 1-2.6 3.4M6.3 6.3A18.6 18.6 0 0 0 2 12s4 8 10 8a10.6 10.6 0 0 0 3-.4" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          </div>

          <button type="submit" disabled={busy}
            className="rounded-xl py-3 text-[15px] font-semibold transition-all disabled:opacity-60 disabled:cursor-wait"
            style={{ background: 'var(--color-accent)', color: 'var(--color-accent-foreground)' }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}
          >
            {busy ? 'Unlocking…' : 'Unlock'}
          </button>

          <div className="text-[13px] min-h-[18px]" style={{ color: '#ef6b6b' }} role="alert">{error}</div>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/70 mt-5">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" /></svg>
          End-to-end encrypted · decrypts only in your browser
        </div>
      </main>
    </div>
  )
}

export default function GoalSingapore({ onBack }) {
  const [data, setData] = useState(cached)
  const back = onBack || (() => { window.location.hash = '' })
  if (!data) return <Gate onBack={back} onUnlock={(d) => { cached = d; setData(d) }} />
  return <Plan data={data} onBack={back} />
}

/* ----------------------------- styles ----------------------------- */

const CSS = `
body:has(.sg-root) { background: #070b14 !important; background-image: none !important; }
.sg-root {
  --ink: #070b14; --line: rgba(255,255,255,.09); --card: rgba(255,255,255,.035);
  --text: #eef1f7; --soft: #b4bccb; --dim: #8f99ad;
  --red: #ff5a69; --flag: #ef3340; --gold: #ffc56b;
  position: relative; min-height: 100vh; min-height: 100dvh; overflow-x: clip;
  background: var(--ink); color: var(--text); color-scheme: dark;
  font-family: 'Sora', system-ui, sans-serif; -webkit-font-smoothing: antialiased;
}
.sg-root :focus-visible { outline: 2px solid var(--red); outline-offset: 3px; border-radius: 6px; }
.sg-root strong { color: #fff; font-weight: 600; }
.sg-root p a:not([class]), .sg-root li > a:not([class]) { color: #fff; text-decoration: underline; text-decoration-color: rgba(255,90,105,.6); text-underline-offset: 3px; }

.sg-top { position: sticky; top: 0; z-index: 30; border-bottom: 1px solid var(--line);
  background: rgba(7,11,20,.74); backdrop-filter: blur(14px) saturate(1.2); -webkit-backdrop-filter: blur(14px) saturate(1.2); }
.sg-top-in { max-width: 48rem; margin: 0 auto; padding: .7rem 1.25rem; display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
.sg-back { display: inline-flex; align-items: center; gap: .45rem; padding: .3rem .2rem; border: 0; background: none; cursor: pointer;
  font: inherit; font-size: .875rem; color: var(--soft); transition: color .2s; }
.sg-back:hover { color: var(--text); }
.sg-back svg { width: 1rem; height: 1rem; transition: transform .2s; }
.sg-back:hover svg { transform: translateX(-2px); }
.sg-mono { font: 500 11px/1 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .22em; text-transform: uppercase; color: var(--dim); }

.sg-hero { position: relative; isolation: isolate; overflow: hidden; text-align: center; }
.sg-sky { position: absolute; inset: 0; z-index: -2; background:
  radial-gradient(90% 55% at 50% 100%, rgba(239,51,64,.22), transparent 62%),
  radial-gradient(60% 40% at 72% 92%, rgba(255,197,107,.12), transparent 60%),
  linear-gradient(180deg, #070b14 0%, #0a1020 40%, #161530 78%, #23173a 100%); }
.sg-stars { position: absolute; inset: 0; z-index: -1; opacity: .6; animation: sg-twinkle 9s ease-in-out infinite;
  background-image:
    radial-gradient(1px 1px at 8% 12%, #fff, transparent 60%), radial-gradient(1px 1px at 22% 30%, #fff, transparent 60%),
    radial-gradient(1.4px 1.4px at 35% 8%, #fff, transparent 60%), radial-gradient(1px 1px at 47% 24%, #fff, transparent 60%),
    radial-gradient(1px 1px at 61% 14%, #fff, transparent 60%), radial-gradient(1.4px 1.4px at 74% 33%, #fff, transparent 60%),
    radial-gradient(1px 1px at 88% 10%, #fff, transparent 60%), radial-gradient(1px 1px at 95% 40%, #fff, transparent 60%),
    radial-gradient(1px 1px at 14% 46%, #fff, transparent 60%), radial-gradient(1px 1px at 55% 42%, #fff, transparent 60%);
  background-size: 560px 380px; }
.sg-moon { position: absolute; top: 1.25rem; right: max(1rem, calc(50% - 23rem)); width: 3.25rem; height: 3.25rem; opacity: .92;
  filter: drop-shadow(0 0 14px rgba(255,255,255,.2)); }
.sg-hero-in { max-width: 48rem; margin: 0 auto; padding: 3.5rem 1.25rem 0; }
.sg-kick { margin: 0; padding-left: .34em; font: 600 11px/1 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .34em; text-transform: uppercase; color: var(--red); }
.sg-title { margin: .55rem 0 0; font-family: 'Newsreader', Georgia, serif; font-weight: 500; font-size: clamp(3.4rem, 15vw, 7rem);
  line-height: .95; letter-spacing: -.03em; color: #fff; text-shadow: 0 6px 40px rgba(239,51,64,.28); }
.sg-lines { margin: 1.1rem 0 0; font-family: 'Newsreader', Georgia, serif; font-style: italic; font-size: clamp(1.15rem, 4.6vw, 1.5rem); line-height: 1.45; color: #e2e6ef; }
.sg-lines span { display: block; }
.sg-chips { list-style: none; margin: 1.6rem auto 0; padding: 0; max-width: 34rem; display: flex; flex-wrap: wrap; justify-content: center; gap: .5rem; }
.sg-chip { display: flex; flex-direction: column; align-items: center; gap: .25rem; padding: .45rem .8rem; border-radius: .8rem;
  border: 1px solid rgba(255,90,105,.3); background: rgba(255,90,105,.08); }
.sg-chip-k { font: 500 9.5px/1.2 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .1em; text-transform: uppercase; color: var(--soft); }
.sg-chip-v { font-size: 13px; font-weight: 600; color: #fff; white-space: nowrap; }
.sg-city { display: block; width: 100%; height: clamp(150px, 24vw, 240px); margin-top: 1.75rem; }
.sg-win { fill: var(--gold); opacity: .78; }
.sg-win.tw { animation: sg-win 7s ease-in-out infinite; }
@keyframes sg-win { 0%, 100% { opacity: .85 } 45% { opacity: .15 } 55% { opacity: .2 } }
@keyframes sg-twinkle { 0%, 100% { opacity: .6 } 50% { opacity: .35 } }

.sg-main { max-width: 48rem; margin: 0 auto; padding: .5rem 1.25rem 4.5rem; }
.sg-sec { margin-top: 3.25rem; }
.sg-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; }
.sg-k { margin: 0; font: 600 10.5px/1 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .26em; text-transform: uppercase; color: var(--red); }
.sg-h2 { margin: .5rem 0 0; font-family: 'Newsreader', Georgia, serif; font-weight: 500; font-size: clamp(1.65rem, 6.4vw, 2.2rem);
  line-height: 1.12; letter-spacing: -.015em; color: #fff; }
.sg-intro { margin: .6rem 0 0; font-size: .9rem; line-height: 1.6; color: var(--soft); }
.sg-note { margin: .8rem 0 0; font-size: .82rem; line-height: 1.55; color: var(--dim); }
.sg-aside { margin: .8rem 0 0; font-size: .88rem; line-height: 1.55; color: var(--soft); font-style: italic; }
.sg-card { border: 1px solid var(--line); background: var(--card); border-radius: 1.1rem; }
.sg-cb { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

.sg-road { margin-top: 1rem; padding: 1.1rem 1.1rem .5rem; }
.sg-road-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem 1rem; }
.sg-count { margin: 0; display: flex; align-items: baseline; gap: .5rem; font-size: .9rem; color: var(--soft); }
.sg-count b { font-family: 'Newsreader', Georgia, serif; font-weight: 500; font-size: 2.4rem; line-height: 1; color: #fff; }
.sg-date { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; font-size: .8rem; color: var(--soft); }
.sg-date input { font: inherit; font-size: .85rem; color: var(--text); background: rgba(255,255,255,.05); border: 1px solid var(--line);
  border-radius: .6rem; padding: .35rem .55rem; color-scheme: dark; min-height: 2.1rem; }
.sg-days { font-weight: 600; color: var(--gold); }
.sg-track { margin: 1rem 0 .35rem; height: 6px; border-radius: 99px; background: rgba(255,255,255,.07); overflow: hidden; }
.sg-track span { display: block; height: 100%; border-radius: inherit; transition: width .5s cubic-bezier(.2,.8,.2,1);
  background: linear-gradient(90deg, var(--flag), var(--red) 60%, var(--gold)); }
.sg-steps { list-style: none; margin: .35rem 0 0; padding: 0; }
.sg-steps > li { position: relative; }
.sg-steps > li:not(:last-child)::after { content: ''; position: absolute; left: calc(.15rem + 1.05rem - 1px); top: 2.65rem; bottom: -.4rem;
  width: 2px; border-radius: 2px; background: rgba(255,255,255,.08); }
.sg-steps > li.is-done:not(:last-child)::after { background: rgba(255,90,105,.45); }
.sg-step { display: flex; align-items: center; gap: .8rem; padding: .55rem .15rem; cursor: pointer; }
.sg-dot { flex: none; width: 2.1rem; height: 2.1rem; border-radius: 50%; display: grid; place-items: center;
  border: 1.5px solid rgba(255,255,255,.2); color: var(--dim); font: 600 12px/1 'JetBrains Mono', ui-monospace, monospace;
  transition: background .25s, border-color .25s, color .25s; }
.sg-dot svg { width: 1rem; height: 1rem; }
.sg-step:hover .sg-dot { border-color: rgba(255,90,105,.65); }
.sg-cb:checked + .sg-dot { background: var(--flag); border-color: var(--flag); color: #fff; }
.sg-cb:focus-visible + .sg-dot, .sg-cb:focus-visible + .sg-box { outline: 2px solid var(--red); outline-offset: 3px; }
.sg-step-t { flex: 1; min-width: 0; font-size: .95rem; line-height: 1.45; color: var(--text); }
.is-done .sg-step-t { color: var(--soft); }
.sg-next { flex: none; padding: .3rem .5rem; border-radius: 99px; background: var(--gold); color: #1b1205;
  font: 600 10px/1 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; }

.sg-stat { position: relative; overflow: hidden; padding: 1.4rem 1.3rem 1.3rem; border-color: rgba(255,90,105,.32);
  background: radial-gradient(120% 90% at 0% 0%, rgba(239,51,64,.16), transparent 60%), var(--card); }
.sg-stat-v { margin: .7rem 0 0; font-family: 'Newsreader', Georgia, serif; font-weight: 500; font-size: clamp(3rem, 14vw, 4.75rem);
  line-height: 1; letter-spacing: -.02em; color: var(--gold); font-variant-numeric: lining-nums; }
.sg-stat-u { margin: .5rem 0 0; font-size: 1rem; color: #fff; }
.sg-stat-u span { color: var(--soft); }
.sg-stat-b { margin: .9rem 0 0; font-size: .95rem; line-height: 1.65; color: var(--text); }
.sg-stat-n { margin: .7rem 0 0; font-size: .82rem; line-height: 1.55; color: var(--dim); }

.sg-pill { flex: none; padding: .4rem .6rem; border-radius: 99px; border: 1px solid var(--line); color: var(--text);
  font: 600 11px/1 'JetBrains Mono', ui-monospace, monospace; }
.sg-pill.full { background: var(--gold); border-color: var(--gold); color: #1b1205; }
.sg-checks { list-style: none; margin: 1rem 0 0; padding: .35rem; }
.sg-checks > li { position: relative; }
.sg-check { display: flex; align-items: flex-start; gap: .1rem; padding: .15rem .25rem; border-radius: .8rem; cursor: pointer; transition: background .2s; }
.sg-check:hover { background: rgba(255,255,255,.03); }
.sg-hit { flex: none; display: grid; place-items: center; width: 2.75rem; height: 2.75rem; border-radius: .7rem; cursor: pointer; }
.sg-box { flex: none; width: 1.3rem; height: 1.3rem; border-radius: .4rem; display: grid; place-items: center;
  border: 1.5px solid rgba(255,255,255,.24); color: transparent; transition: background .2s, border-color .2s, color .2s; }
.sg-box svg { width: .85rem; height: .85rem; }
.sg-cb:checked + .sg-box { background: var(--flag); border-color: var(--flag); color: #fff; }
.sg-check-t { flex: 1; min-width: 0; padding: .62rem .45rem .62rem 0; font-size: .95rem; line-height: 1.5; color: var(--text); }
.sg-check-t small { display: block; margin-top: .2rem; font-size: .8rem; line-height: 1.5; color: var(--dim); }
.sg-check:hover .sg-box, .sg-hit:hover .sg-box { border-color: rgba(255,90,105,.65); }
.sg-res { display: flex; align-items: flex-start; gap: .1rem; padding: .15rem .25rem; }
.sg-res-a { color: #fff; text-decoration: underline; text-decoration-color: rgba(255,255,255,.28); text-underline-offset: 3px; }
.sg-res-a:hover { text-decoration-color: var(--red); }
.sg-res.is-done .sg-res-a, .sg-check:has(.sg-cb:checked) .sg-check-t { color: var(--soft); }
.sg-ext { color: var(--red); font-weight: 600; }

.sg-cards { list-style: none; margin: 1rem 0 0; padding: 0; display: grid; gap: .75rem; grid-template-columns: 1fr; }
@media (min-width: 640px) { .sg-cards { grid-template-columns: 1fr 1fr; } }
.sg-cardi { padding: 1.1rem 1.15rem 1.2rem; }
.sg-cardi-i { display: block; font-size: 1.35rem; line-height: 1; }
.sg-cardi h3 { margin: .75rem 0 0; font-family: 'Newsreader', Georgia, serif; font-weight: 500; font-size: 1.25rem; line-height: 1.2; color: #fff; }
.sg-cardi p { margin: .4rem 0 0; font-size: .88rem; line-height: 1.6; color: var(--soft); }

.sg-roles { list-style: none; margin: 1rem 0 0; padding: 0; display: grid; gap: .75rem; }
.sg-role { display: block; padding: 1rem 1.1rem; text-decoration: none; color: inherit; transition: border-color .2s, background .2s; }
.sg-role:hover { border-color: rgba(255,90,105,.45); background: rgba(255,90,105,.05); }
.sg-role-h { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
.sg-role-t { font-size: 1rem; font-weight: 600; color: #fff; }
.sg-tag { flex: none; padding: .35rem .5rem; border-radius: 99px; border: 1px solid var(--line); color: var(--soft);
  font: 600 10px/1 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }
.sg-tag.best { background: var(--gold); border-color: var(--gold); color: #1b1205; }
.sg-role-p { display: block; margin-top: .45rem; font-size: .88rem; line-height: 1.55; color: var(--soft); }
.sg-role-go { display: inline-block; margin-top: .65rem; font-size: .8rem; font-weight: 600; color: var(--red); }

.sg-tl { list-style: none; margin: 1.2rem 0 0; padding: 0; }
.sg-tl > li { position: relative; padding: 0 0 1.7rem 1.8rem; }
.sg-tl > li:last-child { padding-bottom: 0; }
.sg-tl > li::before { content: ''; position: absolute; left: .3rem; top: .1rem; width: .75rem; height: .75rem; border-radius: 50%;
  background: var(--ink); border: 2px solid var(--red); }
.sg-tl > li:not(:last-child)::after { content: ''; position: absolute; left: calc(.3rem + .375rem - 1px); top: 1.05rem; bottom: .15rem;
  width: 2px; background: linear-gradient(rgba(255,90,105,.5), rgba(255,90,105,.08)); }
.sg-when { display: block; font: 600 10px/1.2 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .16em; text-transform: uppercase; color: var(--gold); }
.sg-tl h3 { margin: .45rem 0 0; font-family: 'Newsreader', Georgia, serif; font-weight: 500; font-size: 1.3rem; line-height: 1.25; color: #fff; }
.sg-tl ul { list-style: none; margin: .6rem 0 0; padding: 0; display: grid; gap: .45rem; }
.sg-tl ul li { position: relative; padding-left: 1rem; font-size: .9rem; line-height: 1.6; color: var(--soft); }
.sg-tl ul li::before { content: ''; position: absolute; left: 0; top: .62em; width: .35rem; height: .35rem; border-radius: 50%; background: rgba(255,255,255,.3); }

.sg-grid { margin: 1rem 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; }
@media (min-width: 640px) { .sg-grid { grid-template-columns: repeat(3, 1fr); } }
.sg-cell { margin: 0; padding: .9rem .95rem 1rem; }
.sg-cell dt { font: 500 10px/1.3 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .1em; text-transform: uppercase; color: var(--dim); }
.sg-cell dd { margin: 0; }
.sg-cell .v { margin-top: .45rem; font-family: 'Newsreader', Georgia, serif; font-weight: 500; font-size: clamp(1.25rem, 5vw, 1.6rem); line-height: 1.1; color: #fff; }
.sg-cell .s { margin-top: .35rem; font-size: .76rem; line-height: 1.45; color: var(--soft); }

.sg-warn { list-style: none; margin: 1rem 0 0; padding: 0; display: grid; gap: .6rem; }
.sg-warn > li { position: relative; padding: .8rem 1rem .8rem 2.4rem; font-size: .92rem; line-height: 1.55; color: var(--text); }
.sg-warn > li::before { content: ''; position: absolute; left: 1.05rem; top: 1.2rem; width: .45rem; height: .45rem; border-radius: 1px;
  background: var(--red); transform: rotate(45deg); }

.sg-rule { margin: 0; padding: 1.9rem 1.4rem 2rem; text-align: center; border-radius: 1.25rem; border: 1px solid rgba(255,90,105,.35);
  background: radial-gradient(100% 120% at 50% 0%, rgba(239,51,64,.18), transparent 70%), var(--card); }
.sg-flag { display: block; width: 3rem; height: 2rem; margin: 0 auto 1rem; filter: drop-shadow(0 4px 14px rgba(239,51,64,.35)); }
.sg-rule blockquote { margin: .8rem auto 0; max-width: 34rem; font-family: 'Newsreader', Georgia, serif; font-style: italic;
  font-size: clamp(1.25rem, 5vw, 1.6rem); line-height: 1.45; color: #fff; }

.sg-sources ul { list-style: none; margin: .9rem 0 0; padding: 0; display: grid; gap: .15rem; }
.sg-root .sg-sources li a { display: inline-block; padding: .3rem 0; font-size: .86rem; line-height: 1.45; color: var(--soft);
  text-decoration: underline; text-decoration-color: rgba(255,255,255,.22); text-underline-offset: 3px; }
.sg-root .sg-sources li a:hover { color: #fff; text-decoration-color: var(--red); }

.sg-end { margin: 3rem 0 0; display: flex; align-items: center; justify-content: center; gap: .45rem;
  font: 500 11px/1 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .06em; color: var(--dim); }
.sg-end-i { width: .8rem; height: .8rem; }

.sg-gate-city { position: fixed; left: 0; right: 0; bottom: 0; aspect-ratio: 1200 / 260; max-height: 34vh; z-index: 0; pointer-events: none;
  color: var(--color-foreground); opacity: .07; }
.sg-gate-svg { display: block; width: 100%; height: 100%; }

/* tabs */
.sg-top-in.has-tabs { display: grid; grid-template-columns: auto 1fr; padding-top: .5rem; padding-bottom: .5rem; }
.sg-top-in.has-tabs .sg-mono { display: none; }
.sg-tabs { justify-self: end; display: inline-flex; gap: .2rem; padding: .18rem; border-radius: 99px;
  border: 1px solid var(--line); background: rgba(255,255,255,.035); }
.sg-tab { min-width: 4.6rem; min-height: 2.15rem; padding: .3rem 1rem; border: 1px solid transparent; border-radius: 99px; background: none;
  cursor: pointer; font: 500 .86rem/1 'Sora', system-ui, sans-serif; color: var(--soft); transition: background .2s, color .2s, border-color .2s; }
.sg-tab:hover { color: var(--text); }
.sg-tab.on { background: rgba(255,90,105,.16); border-color: rgba(255,90,105,.55); color: #fff; font-weight: 600; }
@media (min-width: 720px) {
  .sg-top-in.has-tabs { grid-template-columns: 1fr auto 1fr; }
  .sg-top-in.has-tabs .sg-tabs { justify-self: center; }
  .sg-top-in.has-tabs .sg-mono { display: block; justify-self: end; }
}
.sg-anchor { scroll-margin-top: 4.5rem; }

/* progress */
.sg-prog { margin-top: 1rem; padding: 1.1rem 1.1rem .8rem; }
.sg-parts { list-style: none; margin: .8rem 0 0; padding: 0; display: grid; gap: .1rem; }
.sg-part { width: 100%; display: grid; grid-template-columns: 6.2rem 1fr 2.8rem; align-items: center; gap: .75rem; min-height: 2.6rem;
  padding: .45rem .4rem; border: 0; border-radius: .6rem; background: none; cursor: pointer; font: inherit; color: var(--text); text-align: left; }
.sg-part:hover { background: rgba(255,255,255,.04); }
.sg-part-l { font-size: .88rem; }
.sg-part-bar { height: 4px; border-radius: 99px; background: rgba(255,255,255,.08); overflow: hidden; }
.sg-part-bar span { display: block; height: 100%; border-radius: inherit; background: var(--red); transition: width .4s; }
.sg-part-n { font: 600 11px/1 'JetBrains Mono', ui-monospace, monospace; color: var(--soft); text-align: right; }

/* folds */
.sg-folds { list-style: none; margin: 1rem 0 0; padding: 0; display: grid; gap: .7rem; }
.sg-fold > summary { list-style: none; cursor: pointer; display: grid; gap: .4rem; padding: 1rem 1.1rem 1.05rem; border-radius: inherit; }
.sg-fold > summary::-webkit-details-marker { display: none; }
.sg-fold > summary:hover { background: rgba(255,255,255,.025); }
.sg-fold[open] > summary { border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
.sg-fold-h { display: flex; align-items: center; gap: .6rem; }
.sg-fold-n { font-family: 'Newsreader', Georgia, serif; font-weight: 500; font-size: 1.45rem; line-height: 1.1; color: #fff; }
.sg-chev { flex: none; width: 1.15rem; height: 1.15rem; margin-left: auto; color: var(--soft); transition: transform .25s; }
.sg-fold[open] .sg-chev { transform: rotate(180deg); }
.sg-fold-line { font-size: .9rem; line-height: 1.5; color: var(--soft); }
.sg-fold-meta { font: 500 11px/1.3 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .04em; color: var(--dim); }
.sg-fold-meta b { font-weight: 600; color: var(--text); }
.sg-fold-meta b.full { color: var(--gold); }
.sg-fold-body { padding: .1rem 1.1rem 1rem; border-top: 1px solid var(--line); }
.sg-sub { margin: 1.15rem 0 .55rem; font: 600 10px/1.2 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .16em; text-transform: uppercase; color: var(--gold); }
.sg-sub + .sg-checks { margin-top: 0; }
.sg-fold-rows { list-style: none; margin: 0; padding: 0; display: grid; gap: .55rem; }
.sg-fold-rows > li { display: grid; gap: .32rem; padding: .75rem .85rem; border-radius: .8rem; border: 1px solid var(--line); background: rgba(255,255,255,.025); }
.sg-row-t { font-size: .95rem; font-weight: 600; line-height: 1.4; color: #fff; text-decoration: none; }
a.sg-row-t:hover { text-decoration: underline; text-decoration-color: var(--red); text-underline-offset: 3px; }
.sg-row-n { font-size: .82rem; line-height: 1.5; color: var(--dim); }
.sg-rl { display: grid; gap: .3rem; font-size: .82rem; line-height: 1.45; color: var(--soft); }
.sg-rl-row { display: flex; flex-wrap: wrap; align-items: center; gap: .35rem .55rem; }
.sg-rl-a b { font-weight: 600; color: var(--gold); }
.sg-v { padding: .24rem .45rem; border-radius: 99px; border: 1px solid; font: 600 10px/1 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .03em; white-space: nowrap; }
.sg-v.ok { color: #7ee2ae; border-color: rgba(95,212,154,.4); background: rgba(95,212,154,.1); }
.sg-v.mid { color: var(--gold); border-color: rgba(255,197,107,.4); background: rgba(255,197,107,.08); }
.sg-v.low { color: #ff8a95; border-color: rgba(255,90,105,.4); background: rgba(255,90,105,.08); }
.sg-fold-links { margin: .9rem 0 0; display: flex; flex-wrap: wrap; gap: .5rem; }
.sg-linkpill { display: inline-flex; align-items: center; gap: .3rem; min-height: 2.3rem; padding: .35rem .85rem; border-radius: 99px;
  border: 1px solid rgba(255,90,105,.45); color: #fff; font-size: .82rem; font-weight: 600; text-decoration: none; transition: background .2s; }
.sg-linkpill:hover { background: rgba(255,90,105,.1); }
.sg-checks.sg-flat { margin: 0; padding: 0; }

/* tiles */
.sg-tiles { list-style: none; margin: 1rem 0 0; padding: 0; display: grid; gap: .6rem; grid-template-columns: 1fr; }
@media (min-width: 640px) { .sg-tiles { grid-template-columns: 1fr 1fr; } }
.sg-tiles > li { display: grid; }
.sg-tile { display: grid; align-content: start; gap: .32rem; padding: .9rem 1rem; color: inherit; text-decoration: none; transition: border-color .2s, background .2s; }
.sg-tile:hover { border-color: rgba(255,90,105,.45); background: rgba(255,90,105,.05); }
.sg-tile-k { font: 600 10px/1.2 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .14em; text-transform: uppercase; color: var(--red); }

@media (prefers-reduced-motion: reduce) {
  .sg-root *, .sg-root *::before, .sg-root *::after { animation: none !important; transition: none !important; }
}
`
