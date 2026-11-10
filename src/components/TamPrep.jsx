import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { TAM_PAYLOAD as PAYLOAD } from '../lib/tamPayload'

/* ------------------------------------------------------------------ *
 * #/tam — a private, password-protected study guide.
 *
 * The guide ships encrypted (PBKDF2-SHA256 → AES-GCM-256, the scheme the
 * other private pages use) and decrypts only in the browser with the
 * password. Every word of the guide lives in the payload, so this file is
 * a generic renderer: modules made of blocks such as cards, tables, a team
 * map, scenario drills, timed question practice, flashcards and checklists.
 * Edit the content with scripts/private-payload.mjs (decrypt → edit →
 * encrypt). The payload is { meta, modules: [{ id, label, title, blocks }] }.
 * Optional extras, also from the payload: meta.mark (a small SVG mark),
 * module.group (navigation group labels) and meta.intro (an encrypted clip
 * that plays after unlock and has to be watched to the end).
 *
 * Progress stays in localStorage on this device: ids and booleans only,
 * never the guide's text and never the password.
 * ------------------------------------------------------------------ */

const enc = new TextEncoder()
const dec = new TextDecoder()
const b64 = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
const STORE = 'tam_prep_v1'

async function unlock(passphrase) {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64(PAYLOAD.salt), iterations: PAYLOAD.iter || 200000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(PAYLOAD.iv) }, key, b64(PAYLOAD.ct))
  const data = JSON.parse(dec.decode(plaintext))
  const modules = (Array.isArray(data.modules) ? data.modules : [])
    .filter((m) => m && m.id)
    .map((m) => ({ ...m, blocks: Array.isArray(m.blocks) ? m.blocks : [] }))
  return { meta: data.meta || {}, modules }
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null')
    if (saved && typeof saved === 'object') {
      return {
        mod: typeof saved.mod === 'string' ? saved.mod : '',
        done: saved.done && typeof saved.done === 'object' ? saved.done : {},
      }
    }
  } catch {}
  return { mod: '', done: {} }
}

// Optional intro clip (meta.intro). The file in public/ is AES-GCM encrypted
// with a random key that exists only inside the payload: 12-byte IV, then
// ciphertext and tag.
async function openClip(clip) {
  const res = await fetch(`${import.meta.env.BASE_URL}${String(clip.src).replace(/^\/+/, '')}`)
  if (!res.ok) throw new Error(`Clip request failed: ${res.status}`)
  const bytes = new Uint8Array(await res.arrayBuffer())
  const key = await crypto.subtle.importKey('raw', b64(clip.key), 'AES-GCM', false, ['decrypt'])
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(0, 12) }, key, bytes.subarray(12))
  return URL.createObjectURL(new Blob([plain], { type: clip.type || 'video/mp4' }))
}

// One shared <video>. Calling play() on it inside the unlock tap is the user
// gesture Safari and iOS need before the clip may later play with sound.
let player = null
function getPlayer() {
  if (!player && typeof document !== 'undefined') {
    player = document.createElement('video')
    player.playsInline = true
    player.setAttribute('playsinline', '')
    player.preload = 'auto'
  }
  return player
}
function primePlayer() {
  const v = getPlayer()
  if (!v || v.getAttribute('src')) return
  try { Promise.resolve(v.play()).catch(() => {}) } catch {}
}
function releasePlayer(url) {
  const v = player
  if (!v || v.getAttribute('src') !== url) return
  v.pause()
  v.removeAttribute('src')
  v.load()
}

const smooth = () => (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth')
const pad = (n) => String(n).padStart(2, '0')
const list = (value) => (Array.isArray(value) ? value : value ? [value] : [])

// Interface words. Neutral defaults, overridable from the payload's meta.words.
const UI = {
  module: 'Module', min: 'min', markDone: 'Mark this module done', isDone: 'Module done ✓',
  next: 'Next', prev: 'Previous', backToStart: 'Back to the start', back: 'Back to site', lock: 'Lock page',
  practised: 'practised', markPractised: 'Mark as practised', isPractised: 'Practised ✓',
  start: 'Start', pause: 'Pause', resume: 'Resume', reset: 'Reset', timeUp: "Time's up — wrap up in one line.",
  randomStart: 'Give me a question', randomNext: 'Another question', reveal: 'Reveal guidance', hide: 'Hide guidance',
  probe: 'What they are probing', shape: 'Answer shape', story: 'Story to use', follow: 'Likely follow-up',
  scenario: 'Scenario', testing: 'What this tests', ask: 'What do you do first?',
  best: 'Strong', okay: 'Partly right', risky: 'Risky', why: 'Why the other options land differently',
  showAnswer: 'Show a strong answer', hideAnswer: 'Hide the strong answer', approach: 'A strong approach',
  say: 'Say it like this', avoid: 'Avoid', followups: 'Expect these follow-ups',
  ready: 'Story ready', instead: 'Instead of', try: 'Try', shortlist: 'Shortlist', shortlisted: 'Shortlisted ★',
  flip: 'Show answer', unflip: 'Show question', known: 'I know this', isKnown: 'Known ✓', shuffle: 'Shuffle',
  onlyUnknown: 'Only cards I am still learning', allKnown: 'Every card is marked known. Turn the filter off to review.',
  cardOf: 'Card', of: 'of', total: 'Total',
  reelLabel: 'Intro video', reelSkip: 'Skip', reelGo: 'Continue', reelAgain: 'Watch again', reelReplay: 'Replay intro',
  reelSound: 'Tap for sound', reelPlay: 'Tap to play', reelLoading: 'Loading…', reelMute: 'Mute', reelUnmute: 'Unmute',
  reelHold: 'Watch to the end to continue',
}
const Words = createContext(UI)
const useW = () => useContext(Words)

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
const Points = ({ items, className }) => (list(items).length > 0
  ? <ul className={className || 'tp-points'}>{list(items).map((t, i) => <li key={i}><Inline text={t} /></li>)}</ul>
  : null)

function Head({ b, aside }) {
  return (
    <div className="tp-head">
      <div>
        {b.kicker && <p className="tp-eyebrow">{b.kicker}</p>}
        {b.title && <h3 className="tp-h3">{b.title}</h3>}
      </div>
      {aside}
      {b.intro && <p className="tp-intro"><Inline text={b.intro} /></p>}
    </div>
  )
}

const Note = ({ text }) => (text ? <p className="tp-note"><Inline text={text} /></p> : null)

function TextBlock({ b }) {
  return (
    <section className="tp-block">
      <Head b={b} />
      <div className="tp-prose"><Paras items={b.body} /></div>
      <Points items={b.points} />
      <Note text={b.note} />
    </section>
  )
}

function Callout({ b }) {
  return (
    <aside className="tp-callout" data-tone={b.tone || 'key'}>
      {b.title && <p className="tp-callout-t">{b.title}</p>}
      <Paras items={b.body} />
      <Points items={b.points} />
    </aside>
  )
}

function Cards({ b }) {
  return (
    <section className="tp-block">
      <Head b={b} />
      <ul className="tp-cards" data-cols={b.cols || 2}>
        {list(b.items).map((it, i) => (
          <li key={i} className="tp-card" data-tone={i % 5}>
            {it.tag && <span className="tp-tag">{it.tag}</span>}
            <h4>{it.icon && <span className="tp-card-i" aria-hidden="true">{it.icon}</span>}<span>{it.title}</span></h4>
            {it.body && <p><Inline text={it.body} /></p>}
            <Points items={it.points} />
          </li>
        ))}
      </ul>
      <Note text={b.note} />
    </section>
  )
}

function Table({ b }) {
  const legend = list(b.legend)
  const tone = (value) => legend.findIndex((l) => l.code === value)
  const cell = (value) => {
    const t = tone(value)
    return t >= 0 ? <span className="tp-chip" data-tone={t} title={legend[t].label}>{value}</span> : <Inline text={value} />
  }
  return (
    <section className="tp-block">
      <Head b={b} />
      <div className="tp-table-wrap" role="region" aria-label={b.title || 'Table'} tabIndex={0}>
        <table className={legend.length ? 'tp-table is-matrix' : 'tp-table'}>
          <thead><tr>{list(b.head).map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
          <tbody>
            {list(b.rows).map((row, r) => (
              <tr key={r}>
                {list(row).map((value, i) => (i === 0
                  ? <th key={i} scope="row"><Inline text={value} /></th>
                  : <td key={i}>{cell(value)}</td>))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {legend.length > 0 && (
        <p className="tp-legend">
          {legend.map((l, i) => <span key={l.code}><span className="tp-chip" data-tone={i}>{l.code}</span>{l.label}</span>)}
        </p>
      )}
      <Note text={b.note} />
    </section>
  )
}

function Terms({ b }) {
  return (
    <section className="tp-block">
      <Head b={b} />
      <dl className="tp-terms">
        {list(b.items).map((it, i) => (
          <div key={i}><dt><Inline text={it.term} /></dt><dd><Inline text={it.text} /></dd></div>
        ))}
      </dl>
      <Note text={b.note} />
    </section>
  )
}

function Code({ b }) {
  return (
    <section className="tp-block">
      <Head b={b} />
      <pre className="tp-code" tabIndex={0}><code>{b.text}</code></pre>
      <Note text={b.note} />
    </section>
  )
}

function Sources({ b }) {
  return (
    <section className="tp-block tp-sources">
      <Head b={b} />
      <ul>
        {list(b.items).map((it, i) => (
          <li key={i}>
            <a href={it.url} target="_blank" rel="noopener noreferrer">{it.label}<span aria-hidden="true"> ↗</span></a>
            {it.note && <small><Inline text={it.note} /></small>}
          </li>
        ))}
      </ul>
      <Note text={b.note} />
    </section>
  )
}

function Steps({ b }) {
  return (
    <section className="tp-block">
      <Head b={b} />
      <ol className="tp-steps">
        {list(b.items).map((it, i) => (
          <li key={i} data-tone={i % 5}>
            <span className="tp-step-n" aria-hidden="true">{it.n || pad(i + 1)}</span>
            <div>
              {it.when && <span className="tp-when">{it.when}</span>}
              <h4>{it.title}</h4>
              {it.body && <p><Inline text={it.body} /></p>}
              <Points items={it.points} />
            </div>
          </li>
        ))}
      </ol>
      <Note text={b.note} />
    </section>
  )
}

function Agenda({ b }) {
  const w = useW()
  const items = list(b.items)
  const total = items.reduce((sum, it) => sum + (Number(it.min) || 0), 0)
  return (
    <section className="tp-block">
      <Head b={b} />
      <div className="tp-agenda-bar" aria-hidden="true">
        {items.map((it, i) => (
          <span key={i} data-tone={i % 5} style={{ flexGrow: Number(it.min) || 1 }}>{it.min}′</span>
        ))}
      </div>
      <ol className="tp-agenda">
        {items.map((it, i) => (
          <li key={i} data-tone={i % 5}>
            <span className="tp-agenda-min">{it.min} {w.min}</span>
            <div><h4>{it.title}</h4>{it.body && <p><Inline text={it.body} /></p>}<Points items={it.points} /></div>
          </li>
        ))}
      </ol>
      <p className="tp-note">{w.total}: {total} {w.min}{b.note ? ' · ' : ''}<Inline text={b.note} /></p>
    </section>
  )
}

function Phrases({ b }) {
  const w = useW()
  return (
    <section className="tp-block">
      <Head b={b} />
      <ul className="tp-phrases">
        {list(b.items).map((it, i) => (
          <li key={i}>
            <p className="tp-not"><span className="tp-k">{w.instead}</span><Inline text={it.not} /></p>
            <p className="tp-yes"><span className="tp-k">{w.try}</span><Inline text={it.say} /></p>
          </li>
        ))}
      </ul>
      <Note text={b.note} />
    </section>
  )
}

// The account team around the customer: pick a role to see how to partner with it.
function TeamMap({ b }) {
  const nodes = list(b.nodes)
  const [selected, setSelected] = useState(nodes[0]?.id || '')
  const active = nodes.find((n) => n.id === selected) || nodes[0]
  const spots = useMemo(() => nodes.map((_, i) => {
    const angle = -Math.PI / 2 + (i / Math.max(1, nodes.length)) * Math.PI * 2
    return { x: 50 + 40 * Math.cos(angle), y: 50 + 39 * Math.sin(angle) }
  }), [nodes.length])
  return (
    <section className="tp-block">
      <Head b={b} />
      <div className="tp-map">
        <svg className="tp-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {spots.map((p, i) => (
            <line key={i} x1="50" y1="50" x2={p.x} y2={p.y} className={nodes[i].id === active?.id ? 'is-on' : undefined} />
          ))}
        </svg>
        <div className="tp-map-center">
          <strong>{b.center?.title}</strong>
          {b.center?.body && <span><Inline text={b.center.body} /></span>}
        </div>
        {nodes.map((n, i) => (
          <button key={n.id} type="button" className={n.self ? 'tp-map-node is-self' : 'tp-map-node'} data-tone={i % 5}
            style={{ left: `${spots[i].x}%`, top: `${spots[i].y}%` }}
            aria-pressed={n.id === active?.id} onClick={() => setSelected(n.id)}>
            <span className="tp-map-short">{n.short}</span>
            <span className="tp-map-title">{n.title}</span>
          </button>
        ))}
      </div>
      {active && (
        <div className="tp-map-detail" aria-live="polite">
          <p className="tp-eyebrow">{active.short}</p>
          <h4>{active.title}</h4>
          {active.lead && <p className="tp-map-lead"><Inline text={active.lead} /></p>}
          <dl>
            {list(active.facets).map((f, i) => (
              <div key={i}><dt>{f.k}</dt><dd><Inline text={f.v} /></dd></div>
            ))}
          </dl>
        </div>
      )}
      <Note text={b.note} />
    </section>
  )
}

function Timer({ seconds = 120 }) {
  const w = useW()
  const full = seconds * 1000
  const [left, setLeft] = useState(full)
  const [running, setRunning] = useState(false)
  const leftRef = useRef(full)
  leftRef.current = left
  useEffect(() => {
    if (!running) return undefined
    const end = Date.now() + leftRef.current
    const t = setInterval(() => {
      const rest = Math.max(0, end - Date.now())
      setLeft(rest)
      if (rest === 0) setRunning(false)
    }, 200)
    return () => clearInterval(t)
  }, [running])
  const s = Math.ceil(left / 1000)
  return (
    <div className={left === 0 ? 'tp-timer is-up' : 'tp-timer'}>
      <span className="tp-timer-v" role="timer">{Math.floor(s / 60)}:{pad(s % 60)}</span>
      <button type="button" onClick={() => setRunning((r) => !r)} disabled={left === 0}>
        {running ? w.pause : left < full ? w.resume : w.start}
      </button>
      <button type="button" onClick={() => { setRunning(false); setLeft(full) }}>{w.reset}</button>
      <span className="tp-timer-msg" aria-live="polite">{left === 0 ? w.timeUp : ''}</span>
    </div>
  )
}

function DoneToggle({ on, onToggle, label, onLabel }) {
  return (
    <button type="button" className={on ? 'tp-toggle is-on' : 'tp-toggle'} aria-pressed={!!on} onClick={onToggle}>
      {on ? onLabel : label}
    </button>
  )
}

function QGuide({ q }) {
  const w = useW()
  return (
    <div className="tp-qguide">
      {q.probe && <p><span className="tp-k">{w.probe}</span><Inline text={q.probe} /></p>}
      {list(q.shape).length > 0 && (
        <>
          <p className="tp-k">{w.shape}</p>
          <ol>{list(q.shape).map((t, i) => <li key={i}><Inline text={t} /></li>)}</ol>
        </>
      )}
      {q.story && <p><span className="tp-k">{w.story}</span><Inline text={q.story} /></p>}
      {q.follow && <p><span className="tp-k">{w.follow}</span><Inline text={q.follow} /></p>}
    </div>
  )
}

function Questions({ b, done, toggle }) {
  const w = useW()
  const groups = list(b.groups)
  const all = groups.flatMap((g) => list(g.items))
  const [pick, setPick] = useState(null)
  const [show, setShow] = useState(false)
  const practised = all.filter((q) => done[`q:${q.id}`]).length
  const draw = () => {
    const fresh = all.filter((q) => !done[`q:${q.id}`] && q.id !== pick?.id)
    const pool = fresh.length ? fresh : all.filter((q) => q.id !== pick?.id)
    if (!pool.length) return
    setPick(pool[Math.floor(Math.random() * pool.length)])
    setShow(false)
  }
  return (
    <section className="tp-block">
      <Head b={b} aside={<span className="tp-pill">{practised} / {all.length} {w.practised}</span>} />
      <div className="tp-practice">
        <div className="tp-practice-top">
          {b.practiceNote && <p><Inline text={b.practiceNote} /></p>}
          <button type="button" className="tp-primary" onClick={draw}>{pick ? w.randomNext : w.randomStart}</button>
        </div>
        {pick && (
          <div className="tp-practice-card">
            <p className="tp-practice-q"><Inline text={pick.q} /></p>
            <Timer key={pick.id} seconds={b.seconds || 120} />
            <div className="tp-row">
              <button type="button" className="tp-secondary" aria-expanded={show} onClick={() => setShow((s) => !s)}>{show ? w.hide : w.reveal}</button>
              <DoneToggle on={done[`q:${pick.id}`]} onToggle={() => toggle(`q:${pick.id}`)} label={w.markPractised} onLabel={w.isPractised} />
            </div>
            {show && <QGuide q={pick} />}
          </div>
        )}
      </div>
      {groups.map((g, gi) => (
        <div key={gi} className="tp-qgroup">
          <h4 className="tp-qgroup-t">{g.title}</h4>
          {g.note && <p className="tp-note"><Inline text={g.note} /></p>}
          <div className="tp-qlist">
            {list(g.items).map((q) => (
              <details key={q.id} className={done[`q:${q.id}`] ? 'is-done' : undefined}>
                <summary><span className="tp-q-dot" aria-hidden="true" /><span><Inline text={q.q} /></span></summary>
                <div>
                  <QGuide q={q} />
                  <DoneToggle on={done[`q:${q.id}`]} onToggle={() => toggle(`q:${q.id}`)} label={w.markPractised} onLabel={w.isPractised} />
                </div>
              </details>
            ))}
          </div>
        </div>
      ))}
      <Note text={b.note} />
    </section>
  )
}

function ScenarioAnswer({ a }) {
  const w = useW()
  if (!a) return null
  return (
    <div className="tp-answer">
      {list(a.steps).length > 0 && (
        <>
          <p className="tp-k">{w.approach}</p>
          <ol className="tp-answer-steps">
            {list(a.steps).map((st, i) => (
              <li key={i}><strong>{st.title}</strong>{st.body && <span><Inline text={st.body} /></span>}</li>
            ))}
          </ol>
        </>
      )}
      {a.say && <blockquote className="tp-say"><p className="tp-k">{w.say}</p><Paras items={a.say} /></blockquote>}
      {list(a.avoid).length > 0 && <div className="tp-avoid"><p className="tp-k">{w.avoid}</p><Points items={a.avoid} /></div>}
      {list(a.follow).length > 0 && <div className="tp-follow"><p className="tp-k">{w.followups}</p><Points items={a.follow} /></div>}
    </div>
  )
}

function Scenarios({ b, done, toggle }) {
  const w = useW()
  const items = list(b.items)
  const [index, setIndex] = useState(0)
  const [choice, setChoice] = useState({})
  const [open, setOpen] = useState({})
  const topRef = useRef(null)
  const s = items[index]
  if (!s) return null
  const picked = choice[s.id]
  const choices = list(s.choices)
  const practised = items.filter((x) => done[`s:${x.id}`]).length
  const go = (i) => {
    setIndex(i)
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: smooth(), block: 'start' }))
  }
  return (
    <section className="tp-block">
      <Head b={b} aside={<span className="tp-pill">{practised} / {items.length} {w.practised}</span>} />
      <div className="tp-deck-pick" ref={topRef}>
        {items.map((x, i) => (
          <button key={x.id} type="button" aria-pressed={i === index} aria-label={`${w.scenario} ${i + 1}: ${x.title}`}
            className={done[`s:${x.id}`] ? 'is-done' : undefined} onClick={() => go(i)}>{pad(i + 1)}</button>
        ))}
      </div>
      <article className="tp-scn">
        <p className="tp-scn-n">{w.scenario} {index + 1} {w.of} {items.length}</p>
        <h4>{s.title}</h4>
        {list(s.tags).length > 0 && <p className="tp-tags">{list(s.tags).map((t) => <span key={t}>{t}</span>)}</p>}
        <div className="tp-scn-setup"><Paras items={s.setup} /></div>
        {s.testing && <p className="tp-scn-test"><span className="tp-k">{w.testing}</span><Inline text={s.testing} /></p>}
        {choices.length > 0 && (
          <fieldset className="tp-choices">
            <legend>{s.ask || w.ask}</legend>
            {choices.map((c, i) => (
              <button key={i} type="button" aria-pressed={picked === i}
                className={`tp-choice${picked === i ? ' is-chosen' : ''}${picked !== undefined ? ` v-${c.verdict}` : ''}`}
                onClick={() => setChoice((m) => ({ ...m, [s.id]: i }))}>
                <span className="tp-choice-l" aria-hidden="true">{String.fromCharCode(65 + i)}</span>
                <span className="tp-choice-t"><Inline text={c.text} /></span>
                {picked !== undefined && <span className="tp-verdict">{w[c.verdict] || c.verdict}</span>}
              </button>
            ))}
          </fieldset>
        )}
        {picked !== undefined && choices[picked] && (
          <div className={`tp-feedback v-${choices[picked].verdict}`} role="status">
            <strong>{w[choices[picked].verdict] || choices[picked].verdict}.</strong> <Inline text={choices[picked].why} />
          </div>
        )}
        {picked !== undefined && choices.length > 1 && (
          <details className="tp-others">
            <summary>{w.why}</summary>
            <ul>
              {choices.map((c, i) => (i === picked ? null : (
                <li key={i} className={`v-${c.verdict}`}><strong>{String.fromCharCode(65 + i)} · {w[c.verdict] || c.verdict}.</strong> <Inline text={c.why} /></li>
              )))}
            </ul>
          </details>
        )}
        <div className="tp-row">
          <button type="button" className="tp-secondary" aria-expanded={!!open[s.id]}
            onClick={() => setOpen((m) => ({ ...m, [s.id]: !m[s.id] }))}>{open[s.id] ? w.hideAnswer : w.showAnswer}</button>
          <DoneToggle on={done[`s:${s.id}`]} onToggle={() => toggle(`s:${s.id}`)} label={w.markPractised} onLabel={w.isPractised} />
        </div>
        {open[s.id] && <ScenarioAnswer a={s.answer} />}
        <div className="tp-deck-nav">
          <button type="button" disabled={index === 0} onClick={() => go(index - 1)}>← {w.prev}</button>
          <button type="button" disabled={index === items.length - 1} onClick={() => go(index + 1)}>{w.next} →</button>
        </div>
      </article>
      <Note text={b.note} />
    </section>
  )
}

function Stories({ b, done, toggle }) {
  const w = useW()
  const items = list(b.items)
  const ready = items.filter((s) => done[`st:${s.id}`]).length
  return (
    <section className="tp-block">
      <Head b={b} aside={<span className="tp-pill">{ready} / {items.length}</span>} />
      <ul className="tp-stories">
        {items.map((s, i) => {
          const on = !!done[`st:${s.id}`]
          return (
            <li key={s.id} className={on ? 'tp-story is-ready' : 'tp-story'} data-tone={i % 5}>
              <div className="tp-story-h"><span className="tp-story-n">{pad(i + 1)}</span><h4>{s.title}</h4></div>
              {list(s.proves).length > 0 && <p className="tp-tags">{list(s.proves).map((p) => <span key={p}>{p}</span>)}</p>}
              {s.body && <p><Inline text={s.body} /></p>}
              <Points items={s.prompts} />
              {s.tip && <p className="tp-note"><Inline text={s.tip} /></p>}
              <label className="tp-tick">
                <input type="checkbox" checked={on} onChange={() => toggle(`st:${s.id}`)} />
                <span>{w.ready}</span>
              </label>
            </li>
          )
        })}
      </ul>
      <Note text={b.note} />
    </section>
  )
}

function Checklist({ b, done, toggle }) {
  const items = list(b.items)
  const n = items.filter((it) => done[`c:${it.id}`]).length
  return (
    <section className="tp-block">
      <Head b={b} aside={<span className={n === items.length && n > 0 ? 'tp-pill is-full' : 'tp-pill'}>{n} / {items.length}</span>} />
      <ul className="tp-checks">
        {items.map((it) => {
          const on = !!done[`c:${it.id}`]
          return (
            <li key={it.id}>
              <label className={on ? 'is-done' : undefined}>
                <input type="checkbox" checked={on} onChange={() => toggle(`c:${it.id}`)} />
                <span><Inline text={it.text} />{it.note && <small><Inline text={it.note} /></small>}</span>
              </label>
            </li>
          )
        })}
      </ul>
      <Note text={b.note} />
    </section>
  )
}

function Asks({ b, done, toggle }) {
  const w = useW()
  const items = list(b.items)
  const n = items.filter((it) => done[`a:${it.id}`]).length
  return (
    <section className="tp-block">
      <Head b={b} aside={<span className="tp-pill">★ {n}</span>} />
      <ul className="tp-asks">
        {items.map((it) => {
          const on = !!done[`a:${it.id}`]
          return (
            <li key={it.id} className={on ? 'is-on' : undefined}>
              <div>
                {it.to && <span className="tp-tag">{it.to}</span>}
                <p className="tp-ask-q"><Inline text={it.q} /></p>
                {it.why && <p className="tp-ask-why"><Inline text={it.why} /></p>}
              </div>
              <DoneToggle on={on} onToggle={() => toggle(`a:${it.id}`)} label={w.shortlist} onLabel={w.shortlisted} />
            </li>
          )
        })}
      </ul>
      <Note text={b.note} />
    </section>
  )
}

function Flashcards({ b, done, toggle }) {
  const w = useW()
  const cards = list(b.cards)
  const [order, setOrder] = useState(() => cards.map((_, i) => i))
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [onlyUnknown, setOnlyUnknown] = useState(false)
  const deck = order.filter((i) => cards[i] && (!onlyUnknown || !done[`f:${cards[i].id}`]))
  const at = deck.length ? Math.min(pos, deck.length - 1) : -1
  const card = at >= 0 ? cards[deck[at]] : null
  const known = cards.filter((c) => done[`f:${c.id}`]).length
  const move = (step) => {
    if (!deck.length) return
    setPos((at + step + deck.length) % deck.length)
    setFlipped(false)
  }
  const shuffle = () => {
    const next = [...order]
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[next[i], next[j]] = [next[j], next[i]]
    }
    setOrder(next)
    setPos(0)
    setFlipped(false)
  }
  return (
    <section className="tp-block">
      <Head b={b} aside={<span className="tp-pill">{known} / {cards.length}</span>} />
      <div className="tp-flash">
        {card ? (
          <>
            <button type="button" className={flipped ? 'tp-flash-card is-back' : 'tp-flash-card'} onClick={() => setFlipped((f) => !f)}
              aria-label={flipped ? w.unflip : w.flip}>
              <span className="tp-flash-n">{w.cardOf} {at + 1} {w.of} {deck.length}</span>
              <span className="tp-flash-face" aria-live="polite"><Inline text={flipped ? card.back : card.front} /></span>
              <span className="tp-flash-hint">{flipped ? w.unflip : w.flip}</span>
            </button>
            <div className="tp-flash-controls">
              <button type="button" onClick={() => move(-1)}>← {w.prev}</button>
              <DoneToggle on={done[`f:${card.id}`]} onToggle={() => toggle(`f:${card.id}`)} label={w.known} onLabel={w.isKnown} />
              <button type="button" onClick={() => move(1)}>{w.next} →</button>
            </div>
          </>
        ) : (
          <p className="tp-note">{w.allKnown}</p>
        )}
        <div className="tp-flash-opts">
          <button type="button" onClick={shuffle}>{w.shuffle}</button>
          <label><input type="checkbox" checked={onlyUnknown} onChange={() => { setOnlyUnknown((v) => !v); setPos(0); setFlipped(false) }} /> {w.onlyUnknown}</label>
        </div>
      </div>
      <Note text={b.note} />
    </section>
  )
}

function Block({ b, done, toggle }) {
  switch (b.type) {
    case 'text': return <TextBlock b={b} />
    case 'callout': return <Callout b={b} />
    case 'cards': return <Cards b={b} />
    case 'table': return <Table b={b} />
    case 'terms': return <Terms b={b} />
    case 'code': return <Code b={b} />
    case 'sources': return <Sources b={b} />
    case 'steps': return <Steps b={b} />
    case 'agenda': return <Agenda b={b} />
    case 'phrases': return <Phrases b={b} />
    case 'map': return <TeamMap b={b} />
    case 'questions': return <Questions b={b} done={done} toggle={toggle} />
    case 'scenarios': return <Scenarios b={b} done={done} toggle={toggle} />
    case 'stories': return <Stories b={b} done={done} toggle={toggle} />
    case 'checklist': return <Checklist b={b} done={done} toggle={toggle} />
    case 'asks': return <Asks b={b} done={done} toggle={toggle} />
    case 'flash': return <Flashcards b={b} done={done} toggle={toggle} />
    default: return null
  }
}

// How much of the practice is done, across every module.
function tally(modules, done) {
  const t = { s: [0, 0], q: [0, 0], st: [0, 0], f: [0, 0] }
  const count = (kind, id) => { t[kind][1] += 1; if (done[`${kind}:${id}`]) t[kind][0] += 1 }
  for (const m of modules) {
    for (const b of m.blocks) {
      if (b.type === 'scenarios') list(b.items).forEach((x) => count('s', x.id))
      if (b.type === 'questions') list(b.groups).forEach((g) => list(g.items).forEach((x) => count('q', x.id)))
      if (b.type === 'stories') list(b.items).forEach((x) => count('st', x.id))
      if (b.type === 'flash') list(b.cards).forEach((x) => count('f', x.id))
    }
  }
  return t
}

const BURST = Array.from({ length: 28 }, (_, i) => {
  const angle = (i / 28) * Math.PI * 2
  const reach = 110 + ((i * 53) % 90)
  return {
    '--x': `${Math.round(Math.cos(angle) * reach * 1.5)}px`,
    '--y': `${Math.round(Math.sin(angle) * reach * 0.9 - 30)}px`,
    '--r': `${((i * 67) % 540) - 270}deg`,
    '--d': `${(i % 7) * 35}ms`,
    '--c': ['#00ed64', '#71f6ba', '#016bf8', '#b45af2', '#ffc010'][i % 5],
  }
})
const clock = (n) => `${Math.floor(n / 60)}:${pad(n % 60)}`

// A small brand mark drawn from the payload (meta.mark: { viewBox, paths }).
function Mark({ mark, className }) {
  const paths = list(mark?.paths)
  if (!paths.length) return null
  return (
    <svg className={className ? `tp-mark ${className}` : 'tp-mark'} viewBox={mark.viewBox || '0 0 24 24'} aria-hidden="true" focusable="false">
      {paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.fill || (p.stroke ? 'none' : 'currentColor')} stroke={p.stroke} strokeWidth={p.width} strokeLinecap={p.stroke ? 'round' : undefined} />
      ))}
    </svg>
  )
}

// Full-screen intro: the clip, a caption beneath it, then on into the guide.
// When `required`, there is no way past it until the clip has played to the
// end: no skip, no Escape, and seeking ahead snaps back to the furthest point
// watched. If the clip can't load at all, the guide opens rather than locking
// her out. It tries to play with sound; if the browser refuses, it plays muted
// with a "tap for sound" button and restarts from the top the first time sound
// comes on, so nothing is missed.
function Reel({ clip, media, mark, required, onClose }) {
  const w = useW()
  const box = useRef(null)
  const slot = useRef(null)
  const actions = useRef(null)
  const heard = useRef(false)
  const closing = useRef(false)
  const run = useRef(0)
  const furthest = useRef(0)
  const [passed, setPassed] = useState(!required)
  const [s, setS] = useState({ playing: false, muted: false, blocked: false, ended: false, failed: false, progress: 0, left: 0 })
  const [leaving, setLeaving] = useState(false)
  const ready = media.status === 'ready'
  const failed = media.status === 'error' || s.failed
  const free = passed || failed
  const passedRef = useRef(passed)
  passedRef.current = passed
  const freeRef = useRef(free)
  freeRef.current = free

  const close = useCallback(() => {
    if (closing.current || !freeRef.current) return
    closing.current = true
    getPlayer()?.pause()
    setLeaving(true)
    window.setTimeout(onClose, smooth() === 'smooth' ? 360 : 0)
  }, [onClose])

  const start = (v) => {
    const token = ++run.current
    setS((p) => ({ ...p, ended: false, blocked: false }))
    v.muted = false
    Promise.resolve(v.play())
      .then(() => { if (token === run.current && !v.muted) heard.current = true })
      .catch((err) => {
        if (token !== run.current || err?.name !== 'NotAllowedError') return
        v.muted = true
        Promise.resolve(v.play()).catch((again) => {
          if (token === run.current && again?.name === 'NotAllowedError') setS((p) => ({ ...p, blocked: true }))
        })
      })
  }

  useEffect(() => {
    const root = document.documentElement
    const before = root.style.overflow
    root.style.overflow = 'hidden'
    box.current?.focus({ preventScroll: true })
    const onKey = (event) => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => {
      root.style.overflow = before
      window.removeEventListener('keydown', onKey)
    }
  }, [close])

  useLayoutEffect(() => {
    const v = getPlayer()
    const host = slot.current
    if (!ready || !v || !host) return undefined
    v.className = 'tp-reel-video'
    v.setAttribute('aria-label', clip.label || w.reelLabel)
    v.disablePictureInPicture = true
    v.playbackRate = 1
    host.appendChild(v)
    const sync = () => {
      const gap = v.currentTime - furthest.current
      if (!v.seeking && gap > 0 && gap < 3) furthest.current = v.currentTime
      setS((p) => ({
        ...p,
        playing: !v.paused && !v.ended,
        muted: v.muted,
        progress: v.duration ? Math.min(1, v.currentTime / v.duration) : 0,
        left: v.duration ? Math.max(0, Math.ceil(v.duration - v.currentTime)) : 0,
      }))
    }
    const hold = () => {
      if (!passedRef.current && v.currentTime > furthest.current + 1) {
        try { v.currentTime = furthest.current } catch {}
      }
    }
    const steady = () => { if (!passedRef.current && v.playbackRate !== 1) v.playbackRate = 1 }
    const end = () => {
      if (!passedRef.current && v.duration && furthest.current < v.duration - 2) {
        hold()
        Promise.resolve(v.play()).catch(() => {})
        return
      }
      passedRef.current = true
      setPassed(true)
      setS((p) => ({ ...p, playing: false, ended: true, progress: 1, left: 0 }))
    }
    const fail = () => setS((p) => ({ ...p, failed: true }))
    const events = ['play', 'playing', 'pause', 'timeupdate', 'volumechange', 'durationchange']
    events.forEach((name) => v.addEventListener(name, sync))
    v.addEventListener('seeking', hold)
    v.addEventListener('ratechange', steady)
    v.addEventListener('ended', end)
    v.addEventListener('error', fail)
    if (v.getAttribute('src') !== media.url) v.src = media.url
    try { v.currentTime = 0 } catch {}
    furthest.current = 0
    start(v)
    return () => {
      run.current += 1
      events.forEach((name) => v.removeEventListener(name, sync))
      v.removeEventListener('seeking', hold)
      v.removeEventListener('ratechange', steady)
      v.removeEventListener('ended', end)
      v.removeEventListener('error', fail)
      v.pause()
      v.remove()
    }
  }, [ready, media.url]) // eslint-disable-line react-hooks/exhaustive-deps

  const done = s.ended || failed
  useEffect(() => {
    if (done) actions.current?.scrollIntoView({ block: 'nearest', behavior: smooth() })
  }, [done])

  const unmute = () => {
    const v = getPlayer()
    if (!v) return
    v.muted = false
    if (!heard.current) {
      try { v.currentTime = 0 } catch {}
      heard.current = true
    }
    setS((p) => ({ ...p, blocked: false, ended: false }))
    Promise.resolve(v.play()).catch(() => {})
  }
  const toggleMute = () => {
    const v = getPlayer()
    if (!v) return
    if (v.muted) unmute()
    else v.muted = true
  }
  const replay = () => {
    const v = getPlayer()
    if (!v) return
    try { v.currentTime = 0 } catch {}
    heard.current = true
    start(v)
  }
  const tap = () => {
    const v = getPlayer()
    if (!v || !ready) return
    if (s.ended) return replay()
    if (v.muted || s.blocked) return unmute()
    if (v.paused) Promise.resolve(v.play()).catch(() => {})
    else v.pause()
  }

  // Caption words; **word** marks the ones that get the highlight.
  let hi = false
  const caption = String(clip.caption || '').split(/\s+/).filter(Boolean).map((token) => {
    const opens = token.startsWith('**')
    const closes = token.indexOf('**', opens ? 2 : 0) !== -1
    const on = hi || opens
    hi = on && !closes
    return { word: token.replace(/\*\*/g, ''), on }
  })
  return (
    <div ref={box} className={`tp-reel${leaving ? ' is-leaving' : ''}${s.ended ? ' is-ended' : ''}`}
      role="dialog" aria-modal="true" aria-label={clip.label || w.reelLabel} tabIndex={-1}>
      <div className="tp-reel-sky" aria-hidden="true" />
      {mark && <Mark mark={mark} className="tp-reel-watermark" />}
      <div className="tp-reel-top">
        <span className="tp-reel-brand">{mark && <Mark mark={mark} />}{clip.kicker}</span>
        {!free
          ? (
            <span className="tp-reel-hold">
              <span aria-hidden="true">🔒</span>{clip.hold || w.reelHold}{ready && s.left > 0 && <b>{clock(s.left)}</b>}
            </span>
          )
          : !s.ended && <button type="button" className="tp-reel-ghost" onClick={close}>{clip.skip || w.reelSkip} <span aria-hidden="true">→</span></button>}
      </div>
      <div className="tp-reel-stage">
        {!failed && (
          <div className="tp-reel-frame" data-state={media.status}>
            <div className="tp-reel-slot" ref={slot} onClick={tap} />
            {!ready && <span className="tp-reel-wait" role="status">{w.reelLoading}</span>}
            {ready && !s.ended && (s.blocked || s.muted) && (
              <button type="button" className="tp-reel-chip" onClick={unmute}>
                <span aria-hidden="true">{s.blocked ? '▶' : '🔊'}</span> {s.blocked ? (clip.play || w.reelPlay) : (clip.sound || w.reelSound)}
              </button>
            )}
            {ready && !s.ended && !s.blocked && !s.muted && !s.playing && s.progress > 0 && (
              <button type="button" className="tp-reel-chip" onClick={tap} aria-label={w.resume}><span aria-hidden="true">▶</span></button>
            )}
            {ready && !s.blocked && (
              <button type="button" className="tp-reel-mute" onClick={toggleMute}
                aria-label={s.muted ? w.reelUnmute : w.reelMute} aria-pressed={!s.muted}>
                <span aria-hidden="true">{s.muted ? '🔇' : '🔊'}</span>
              </button>
            )}
            <span className="tp-reel-progress" aria-hidden="true"><i style={{ transform: `scaleX(${s.progress})` }} /></span>
          </div>
        )}
        <div className="tp-reel-copy">
          {s.ended && <span className="tp-reel-burst" aria-hidden="true">{BURST.map((style, i) => <i key={i} style={style} />)}</span>}
          <p className="tp-reel-caption">
            {caption.map((c, i) => (
              <React.Fragment key={i}>{i > 0 && ' '}<span className={c.on ? 'is-hi' : undefined} style={{ '--i': i }}>{c.word}</span></React.Fragment>
            ))}
          </p>
          {clip.from && <p className="tp-reel-from">{clip.from}</p>}
          {clip.code && (
            <div className="tp-reel-shell">
              <p><span className="tp-reel-prompt" aria-hidden="true">&gt;</span>{clip.code}{!s.ended && <span className="tp-reel-cursor" aria-hidden="true" />}</p>
              {s.ended && clip.result && <p className="tp-reel-out">{clip.result}</p>}
            </div>
          )}
          <div ref={actions} className={done ? 'tp-reel-actions is-on' : 'tp-reel-actions'}>
            {s.ended && <button type="button" className="tp-reel-ghost" onClick={replay}><span aria-hidden="true">↺</span> {clip.again || w.reelAgain}</button>}
            <button type="button" className="tp-reel-go" onClick={close}>{clip.go || w.reelGo} <span aria-hidden="true">→</span></button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Gate({ onBack, onUnlock }) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const submit = async (event) => {
    event.preventDefault()
    if (busy) return
    primePlayer()
    setBusy(true)
    setError('')
    let data
    try {
      data = await unlock(password)
    } catch (reason) {
      setError(reason?.name === 'OperationError'
        ? "That password didn't match. Try again."
        : "This page couldn't be opened. Please reload and try again in a current browser.")
      setBusy(false)
      inputRef.current?.focus()
      inputRef.current?.select()
      return
    }
    setPassword('')
    setBusy(false)
    onUnlock(data)
  }

  return (
    <main className="tp-root tp-locked">
      <style>{CSS}</style>
      <div className="tp-lock-card">
        <div className="tp-gate-mark" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="20" cy="20" r="14" />
            <path d="M20 6v4M20 30v4M6 20h4M30 20h4M25 15l-3.5 7.5L14 26l3.5-7.5z" />
          </svg>
        </div>
        <p className="tp-eyebrow">One more conversation. You are ready for it.</p>
        <h1>Your prep room</h1>
        <p>Everything for the next round is inside.<br />Enter your password to begin.</p>
        <form className="tp-gate-form" onSubmit={submit}>
          <label htmlFor="tp-password">Password</label>
          <div className="tp-password-field">
            <input id="tp-password" ref={inputRef} type={show ? 'text' : 'password'}
              autoComplete="current-password" autoCapitalize="off" autoCorrect="off" spellCheck={false}
              value={password} onChange={(event) => { setPassword(event.target.value); setError('') }}
              required readOnly={busy} aria-invalid={!!error} aria-describedby={error ? 'tp-gate-error' : undefined} />
            <button type="button" disabled={busy} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}
              onClick={() => { setShow((value) => !value); inputRef.current?.focus() }}>{show ? 'Hide' : 'Show'}</button>
          </div>
          <button type="submit" className="tp-primary" disabled={busy}>{busy ? 'Opening…' : 'Open the guide'}</button>
          <div className="tp-gate-error" id="tp-gate-error" role="alert">{error}</div>
        </form>
        <small className="tp-gate-note">Encrypted content. Your password never leaves this browser.</small>
        <button type="button" className="tp-back" onClick={onBack}>Back to site</button>
      </div>
    </main>
  )
}

export default function TamPrep({ onBack }) {
  const [content, setContent] = useState(null)
  const [prog, setProg] = useState(loadProgress)
  const [reel, setReel] = useState('')
  const [media, setMedia] = useState({ status: 'idle', url: '' })
  const reelOpen = useRef(false)
  reelOpen.current = !!reel
  const headingRef = useRef(null)
  const moduleRef = useRef(null)
  const moduleHeadingRef = useRef(null)
  const intro = content?.meta?.intro
  const clip = intro?.src && intro?.key ? intro : null

  useEffect(() => {
    try { localStorage.setItem(STORE, JSON.stringify(prog)) } catch {}
  }, [prog])

  useEffect(() => {
    if (!content) return
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (!reelOpen.current) headingRef.current?.focus({ preventScroll: true })
  }, [content])

  useEffect(() => {
    if (!clip) {
      setMedia({ status: 'idle', url: '' })
      return undefined
    }
    let alive = true
    let url = ''
    setMedia({ status: 'loading', url: '' })
    openClip(clip)
      .then((made) => {
        url = made
        if (alive) setMedia({ status: 'ready', url: made })
        else URL.revokeObjectURL(made)
      })
      .catch(() => { if (alive) setMedia({ status: 'error', url: '' }) })
    return () => {
      alive = false
      if (url) {
        releasePlayer(url)
        URL.revokeObjectURL(url)
      }
    }
  }, [clip])

  const closeReel = useCallback(() => {
    setReel('')
    requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }))
  }, [])

  const modules = content?.modules || []
  const words = useMemo(() => ({ ...UI, ...(content?.meta?.words || {}) }), [content])
  const stats = useMemo(() => tally(modules, prog.done), [modules, prog.done])

  // Every unlock starts with the intro, and it has to be watched through.
  const opened = (data) => {
    setContent(data)
    setReel(data.meta?.intro?.src && data.meta?.intro?.key ? 'required' : '')
  }

  if (!content) return <Gate onBack={onBack} onUnlock={opened} />

  const { meta } = content
  const index = Math.max(0, modules.findIndex((m) => m.id === prog.mod))
  const active = modules[index]
  const doneCount = modules.filter((m) => prog.done[`m:${m.id}`]).length
  const toggle = (key) => setProg((p) => ({ ...p, done: { ...p.done, [key]: !p.done[key] } }))
  const pick = (id) => {
    setProg((p) => ({ ...p, mod: id }))
    requestAnimationFrame(() => {
      moduleRef.current?.scrollIntoView({ behavior: smooth(), block: 'start' })
      moduleHeadingRef.current?.focus({ preventScroll: true })
    })
  }
  const next = modules[index + 1]
  const statLabels = meta.stats || {}
  const statRows = ['s', 'q', 'st', 'f'].filter((k) => stats[k][1] > 0 && statLabels[k])

  return (
    <Words.Provider value={words}>
      <main className="tp-root">
        <style>{CSS}</style>
        <div className="tp-band">
          <header className="tp-top">
            <button type="button" className="tp-back" onClick={onBack}><span aria-hidden="true">←</span> {words.back}</button>
            <div className="tp-top-actions">
              {meta.bar && <span className="tp-top-note"><Mark mark={meta.mark} />{meta.bar}</span>}
              {clip && (
                <button type="button" className="tp-lock-action" onClick={() => setReel('replay')}>
                  <span aria-hidden="true">▶</span> {clip.replay || words.reelReplay}
                </button>
              )}
              <button type="button" className="tp-lock-action" onClick={() => { setReel(''); setContent(null) }}>{words.lock}</button>
            </div>
          </header>
          <div className="tp-wrap">
            <header className="tp-hero">
              <div className="tp-hero-copy">
                {meta.kicker && <p className="tp-eyebrow"><Mark mark={meta.mark} />{meta.kicker}</p>}
                <h1 ref={headingRef} tabIndex={-1}>{meta.title}</h1>
                {meta.subtitle && <p className="tp-subtitle"><Inline text={meta.subtitle} /></p>}
                {meta.note && <p className="tp-hero-note"><Inline text={meta.note} /></p>}
                {list(meta.chips).length > 0 && (
                  <dl className="tp-chips">
                    {list(meta.chips).map((c, i) => <div key={i}><dt>{c.k}</dt><dd><Inline text={c.v} /></dd></div>)}
                  </dl>
                )}
              </div>
              <aside className="tp-progress-card">
                {meta.progressLabel && <p className="tp-eyebrow">{meta.progressLabel}</p>}
                <div className="tp-ring" style={{ '--tp-progress': `${modules.length ? (doneCount / modules.length) * 360 : 0}deg` }}
                  role="progressbar" aria-label={meta.progressLabel || 'Progress'} aria-valuemin={0} aria-valuemax={modules.length} aria-valuenow={doneCount}>
                  <span>{doneCount}<small>/ {modules.length}</small></span>
                </div>
                <h2>{doneCount === modules.length && modules.length ? meta.progressDone : meta.progressTitle}</h2>
                {statRows.length > 0 && (
                  <ul className="tp-stats">
                    {statRows.map((k) => (
                      <li key={k}><span>{statLabels[k]}</span><b>{stats[k][0]}<small> / {stats[k][1]}</small></b></li>
                    ))}
                  </ul>
                )}
                {meta.progressNote && <p className="tp-progress-note"><Inline text={meta.progressNote} /></p>}
              </aside>
            </header>
          </div>
        </div>
        <div className="tp-wrap">
          <nav className="tp-nav" aria-label={meta.navLabel || 'Modules'}>
            {modules.map((m, i) => (
              <React.Fragment key={m.id}>
                {m.group && m.group !== modules[i - 1]?.group && <span className="tp-nav-group" aria-hidden="true">{m.group}</span>}
                <button type="button" aria-current={i === index ? 'true' : undefined}
                  className={prog.done[`m:${m.id}`] ? 'is-done' : undefined} onClick={() => pick(m.id)}>
                  <span className="tp-nav-n">{prog.done[`m:${m.id}`] ? '✓' : pad(i + 1)}</span>{m.label || m.title}
                </button>
              </React.Fragment>
            ))}
          </nav>

          {active && (
            <article className="tp-module" ref={moduleRef} key={active.id} data-tone={index % 5}>
              <header className="tp-module-head">
                <p className="tp-eyebrow">
                  {words.module} {index + 1} {words.of} {modules.length}{active.group ? ` · ${active.group}` : ''}{active.minutes ? ` · ${active.minutes} ${words.min}` : ''}
                </p>
                <h2 ref={moduleHeadingRef} tabIndex={-1}>{active.title}</h2>
                {active.lead && <p className="tp-lead"><Inline text={active.lead} /></p>}
              </header>
              {active.blocks.map((b, i) => <Block key={`${active.id}-${i}`} b={b} done={prog.done} toggle={toggle} />)}
              <footer className="tp-module-foot">
                <DoneToggle on={prog.done[`m:${active.id}`]} onToggle={() => toggle(`m:${active.id}`)} label={words.markDone} onLabel={words.isDone} />
                {next
                  ? <button type="button" className="tp-primary" onClick={() => pick(next.id)}>{words.next}: {next.label || next.title} <span aria-hidden="true">→</span></button>
                  : <button type="button" className="tp-secondary" onClick={() => pick(modules[0].id)}>{words.backToStart}</button>}
              </footer>
            </article>
          )}
        </div>
        {meta.footer && <footer className="tp-footer"><Mark mark={meta.mark} /><p><Inline text={meta.footer} /></p></footer>}
        {reel && clip && <Reel clip={clip} media={media} mark={meta.mark} required={reel === 'required'} onClose={closeReel} />}
      </main>
    </Words.Provider>
  )
}

const CSS = `
body:has(.tp-root) { background:#f9fbfa !important; background-image:none !important; }
body:has(.tp-locked) { background:#001e2b !important; }
.tp-root {
  --tp-bg:#f9fbfa; --tp-card:#fff; --tp-line:#e8edeb; --tp-line-2:#c1c7c6;
  --tp-text:#001e2b; --tp-soft:#3d4f58; --tp-muted:#5c6c75;
  --tp-accent:#00684a; --tp-accent-soft:#e3fcf7; --tp-bright:#00ed64; --tp-mint:#71f6ba;
  --tp-slate:#001e2b; --tp-slate-2:#112733; --tp-link:#016bf8;
  --tp-plum:#5e0c9e; --tp-plum-soft:#f9ebff; --tp-plum-line:#f1d4fd;
  --tp-sans:Sora, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --tp-serif:Newsreader, "Iowan Old Style", Georgia, "Times New Roman", serif;
  --tp-mono:"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  --t-bg:#e3fcf7; --t-fg:#00684a; --t-line:#c0fae6; --t-mid:#00ed64;
  min-height:100vh; color:var(--tp-text); color-scheme:light; font-size:16px; line-height:1.65;
  background:var(--tp-bg); font-family:var(--tp-sans);
}
.tp-root [data-tone="0"] { --t-bg:#e3fcf7; --t-fg:#00684a; --t-line:#c0fae6; --t-mid:#00ed64; }
.tp-root [data-tone="1"] { --t-bg:#e1f7ff; --t-fg:#083c90; --t-line:#c3e7fe; --t-mid:#016bf8; }
.tp-root [data-tone="2"] { --t-bg:#f9ebff; --t-fg:#5e0c9e; --t-line:#f1d4fd; --t-mid:#b45af2; }
.tp-root [data-tone="3"] { --t-bg:#fef7db; --t-fg:#944f01; --t-line:#ffec9e; --t-mid:#ffc010; }
.tp-root [data-tone="4"] { --t-bg:#eef3f2; --t-fg:#023430; --t-line:#dbe4e1; --t-mid:#00a35c; }
.tp-root *, .tp-root *::before, .tp-root *::after { box-sizing:border-box; }
.tp-root :focus-visible { outline:3px solid #0498ec; outline-offset:3px; border-radius:6px; }
.tp-root button, .tp-root input { font:inherit; }
.tp-root p { margin:0; }
.tp-root h1, .tp-root h2, .tp-root h3, .tp-root h4 { margin:0; color:var(--tp-text); }
.tp-root h3, .tp-root h4 { font-family:var(--tp-sans); }
.tp-root a { color:var(--tp-link); text-underline-offset:3px; }
.tp-root strong { color:var(--tp-text); font-weight:650; }
.tp-root code { padding:1px 5px; border:1px solid var(--tp-line); border-radius:4px; background:#f9fbfa; color:#1c2d38; font:.86em var(--tp-mono); overflow-wrap:anywhere; }
.tp-mark { display:block; flex:none; width:auto; height:1em; }
.tp-band { position:relative; isolation:isolate; overflow:hidden; color:#c1c7c6;
  background:radial-gradient(60% 90% at 88% 0%, rgba(0,237,100,.17), transparent 62%), radial-gradient(55% 80% at 0% 100%, rgba(1,107,248,.15), transparent 62%), linear-gradient(180deg,#001e2b,#00253a); }
.tp-band::before { content:""; position:absolute; inset:0; z-index:-1; pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.045) 1px, transparent 1px); background-size:44px 44px;
  -webkit-mask-image:radial-gradient(75% 85% at 75% 20%, #000 15%, transparent 72%); mask-image:radial-gradient(75% 85% at 75% 20%, #000 15%, transparent 72%); }
.tp-band h1, .tp-band h2, .tp-band strong { color:#fff; }
.tp-band a { color:var(--tp-mint); }
.tp-band code { border-color:rgba(255,255,255,.14); background:rgba(255,255,255,.07); color:#e3fcf7; }
.tp-top { min-height:68px; padding:8px clamp(18px,5vw,72px); display:flex; align-items:center; justify-content:space-between; gap:16px; border-bottom:1px solid rgba(255,255,255,.08); }
.tp-back { display:inline-flex; align-items:center; gap:9px; min-height:44px; padding:9px 0; border:0; background:transparent; color:#c1c7c6; cursor:pointer; font-size:13px; }
.tp-back:hover { color:var(--tp-bright); }
.tp-back span { color:var(--tp-bright); font-size:18px; }
.tp-top-actions { display:flex; align-items:center; gap:12px; }
.tp-top-note { display:inline-flex; align-items:center; gap:9px; color:#889397; font:600 11px var(--tp-mono); letter-spacing:.14em; text-transform:uppercase; }
.tp-top-note .tp-mark { height:22px; }
.tp-lock-action { display:inline-flex; align-items:center; gap:7px; min-height:44px; padding:7px 14px; border:1px solid rgba(0,237,100,.45); border-radius:999px; background:rgba(0,237,100,.06); color:#e3fcf7; cursor:pointer; font-size:12.5px; font-weight:600; }
.tp-lock-action:hover { background:rgba(0,237,100,.16); }
.tp-lock-action span { color:var(--tp-bright); font-size:10px; }
.tp-wrap { width:min(100% - 40px, 1120px); margin:0 auto; }
.tp-eyebrow { margin:0 0 14px !important; color:var(--t-fg); font:600 11px var(--tp-mono); letter-spacing:.12em; text-transform:uppercase; }
.tp-hero { padding:clamp(40px,6vw,80px) 0 clamp(44px,6vw,76px); display:grid; grid-template-columns:minmax(0,1.75fr) minmax(250px,1fr); gap:clamp(24px,5vw,64px); align-items:center; }
.tp-hero .tp-eyebrow { display:flex; align-items:center; gap:10px; color:var(--tp-bright); }
.tp-hero .tp-eyebrow .tp-mark { height:24px; }
.tp-hero h1 { font-family:var(--tp-serif); font-size:clamp(44px,6.6vw,82px); font-weight:400; line-height:1; letter-spacing:-.025em; outline:none; }
.tp-subtitle { max-width:660px; margin-top:22px !important; color:#c1c7c6; font-size:clamp(16.5px,1.9vw,20px); line-height:1.6; }
.tp-hero-note { max-width:620px; margin-top:14px !important; color:#889397; font-size:14.5px; line-height:1.75; }
.tp-chips { display:flex; flex-wrap:wrap; gap:10px; margin:26px 0 0; }
.tp-chips > div { min-width:0; padding:10px 14px; border:1px solid rgba(255,255,255,.1); border-radius:10px; background:rgba(255,255,255,.04); }
.tp-chips dt { color:var(--tp-bright); font:600 10px var(--tp-mono); letter-spacing:.12em; text-transform:uppercase; }
.tp-chips dd { margin:3px 0 0; color:#fff; font-size:14px; font-weight:500; line-height:1.45; }
.tp-progress-card { position:relative; padding:26px 22px; border:1px solid rgba(0,237,100,.22); border-radius:20px; background:linear-gradient(160deg,rgba(0,237,100,.09),rgba(255,255,255,.02) 70%); box-shadow:0 24px 60px rgba(0,0,0,.28); text-align:center; }
.tp-progress-card .tp-eyebrow { color:var(--tp-bright); }
.tp-ring { width:108px; height:108px; margin:0 auto 18px; padding:7px; border-radius:50%; display:grid; place-items:center; background:conic-gradient(var(--tp-bright) var(--tp-progress), rgba(255,255,255,.12) 0); }
.tp-ring > span { width:100%; height:100%; padding-top:20px; border-radius:50%; background:#001e2b; color:#fff; display:flex; align-items:baseline; justify-content:center; gap:5px; font:500 36px var(--tp-serif); }
.tp-ring small { color:#889397; font:500 13px var(--tp-sans); }
.tp-progress-card h2 { font-family:var(--tp-serif); font-size:26px; font-weight:400; line-height:1.2; letter-spacing:-.01em; }
.tp-stats { list-style:none; margin:16px 0 0; padding:0; display:grid; gap:6px; text-align:left; }
.tp-stats li { display:flex; justify-content:space-between; gap:12px; padding:8px 12px; border-radius:8px; background:rgba(255,255,255,.05); color:#c1c7c6; font-size:13px; }
.tp-stats b { color:var(--tp-bright); font-family:var(--tp-mono); font-weight:600; white-space:nowrap; }
.tp-stats small { color:#889397; font-weight:400; }
.tp-progress-note { margin-top:14px !important; color:#889397; font-size:12.5px; line-height:1.6; }
.tp-nav { position:sticky; top:0; z-index:5; display:flex; align-items:center; gap:8px; overflow-x:auto; margin-top:20px; padding:12px 0; background:rgba(249,251,250,.94); -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px); border-bottom:1px solid var(--tp-line); scrollbar-width:thin; }
.tp-nav-group { flex:0 0 auto; padding:0 2px 0 14px; color:var(--tp-muted); font:600 10.5px var(--tp-mono); letter-spacing:.14em; text-transform:uppercase; white-space:nowrap; }
.tp-nav-group:first-child { padding-left:0; }
.tp-nav button { flex:0 0 auto; display:inline-flex; align-items:center; gap:8px; min-height:44px; padding:7px 14px 7px 7px; border:1px solid var(--tp-line); border-radius:999px; background:#fff; color:var(--tp-soft); cursor:pointer; font-size:13px; font-weight:500; white-space:nowrap; }
.tp-nav button:hover { border-color:var(--tp-accent); color:var(--tp-text); }
.tp-nav-n { display:grid; place-items:center; width:28px; height:28px; border-radius:50%; background:#f1f5f4; color:var(--tp-soft); font:600 11px var(--tp-mono); }
.tp-nav button.is-done .tp-nav-n { background:#c0fae6; color:var(--tp-accent); }
.tp-nav button[aria-current="true"] { background:var(--tp-slate); border-color:var(--tp-slate); color:#fff; }
.tp-nav button[aria-current="true"] .tp-nav-n { background:var(--tp-bright); color:var(--tp-slate); }
.tp-module { scroll-margin-top:80px; margin:22px 0 40px; padding:clamp(22px,4vw,48px); border:1px solid var(--tp-line); border-radius:24px; background:var(--tp-card); box-shadow:0 1px 2px rgba(0,30,43,.04), 0 14px 36px rgba(0,30,43,.06); }
.tp-module-head .tp-eyebrow { display:inline-block; padding:6px 10px; border-radius:6px; background:var(--t-bg); }
.tp-module-head h2 { font-family:var(--tp-serif); font-size:clamp(32px,4.4vw,52px); font-weight:400; line-height:1.08; letter-spacing:-.02em; outline:none; }
.tp-lead { max-width:820px; margin-top:16px !important; color:var(--tp-soft); font-size:17px; line-height:1.8; }
.tp-module-foot { display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px; margin-top:44px; padding-top:24px; border-top:1px solid var(--tp-line); }
.tp-block { margin-top:44px; }
.tp-head { display:flex; flex-wrap:wrap; align-items:flex-end; justify-content:space-between; gap:6px 16px; }
.tp-head > div { min-width:0; }
.tp-head .tp-eyebrow { margin-bottom:8px !important; }
.tp-h3 { font-size:clamp(20px,2.4vw,25px); font-weight:600; line-height:1.3; letter-spacing:-.02em; }
.tp-intro { flex:1 0 100%; max-width:820px; margin-top:10px !important; color:var(--tp-soft); font-size:15.5px; line-height:1.8; }
.tp-pill { display:inline-flex; align-items:center; gap:4px; padding:5px 11px; border-radius:999px; background:var(--tp-accent-soft); color:var(--tp-accent); font:600 12px var(--tp-mono); white-space:nowrap; }
.tp-pill.is-full { background:var(--tp-accent); color:#fff; }
.tp-note { margin-top:14px !important; color:var(--tp-muted); font-size:13.5px; line-height:1.7; }
.tp-prose { max-width:840px; margin-top:14px; display:grid; gap:12px; color:var(--tp-soft); font-size:16px; line-height:1.85; }
.tp-points { margin:14px 0 0; padding-left:20px; display:grid; gap:7px; color:var(--tp-soft); font-size:15px; line-height:1.75; }
.tp-points li::marker { color:var(--tp-accent); }
.tp-callout { margin-top:32px; padding:20px 22px; display:grid; gap:8px; border:1px solid var(--c-line); border-left:4px solid var(--c-bar); border-radius:12px; background:var(--c-bg); color:var(--tp-text); font-size:15.5px; line-height:1.75; }
.tp-callout[data-tone="key"] { --c-bg:#e3fcf7; --c-line:#c0fae6; --c-bar:#00a35c; --c-t:#00684a; }
.tp-callout[data-tone="tip"] { --c-bg:#e1f7ff; --c-line:#c3e7fe; --c-bar:#016bf8; --c-t:#083c90; }
.tp-callout[data-tone="warn"] { --c-bg:#ffeae5; --c-line:#ffcdc7; --c-bar:#db3030; --c-t:#970606; }
.tp-callout[data-tone="quote"] { --c-bg:#f9ebff; --c-line:#f1d4fd; --c-bar:#b45af2; --c-t:#5e0c9e; }
.tp-callout-t { color:var(--c-t); font-weight:650; }
.tp-callout .tp-points { margin-top:2px; color:var(--tp-text); }
.tp-cards { list-style:none; margin:18px 0 0; padding:0; display:grid; gap:12px; grid-template-columns:repeat(2,minmax(0,1fr)); }
.tp-cards[data-cols="3"] { grid-template-columns:repeat(3,minmax(0,1fr)); }
.tp-cards[data-cols="1"] { grid-template-columns:1fr; }
.tp-card { min-width:0; padding:20px; border:1px solid var(--tp-line); border-top:3px solid var(--t-mid); border-radius:14px; background:linear-gradient(180deg,var(--t-bg),#fff 96px); }
.tp-card h4 { display:flex; gap:10px; align-items:baseline; color:var(--tp-text); font-size:16.5px; font-weight:600; line-height:1.35; letter-spacing:-.01em; }
.tp-card-i { flex:0 0 auto; font-size:18px; }
.tp-card p { margin-top:8px !important; color:var(--tp-soft); font-size:14.5px; line-height:1.75; }
.tp-card .tp-points { gap:5px; font-size:14px; }
.tp-tag { display:inline-block; margin-bottom:10px; padding:3px 8px; border:1px solid var(--t-line); border-radius:4px; background:#fff; color:var(--t-fg); font:600 10.5px var(--tp-mono); letter-spacing:.06em; text-transform:uppercase; }
.tp-table-wrap { max-width:100%; margin-top:18px; overflow-x:auto; border:1px solid var(--tp-line); border-radius:12px; background:#fff; }
.tp-table { width:100%; min-width:680px; border-collapse:collapse; text-align:left; font-size:14px; line-height:1.65; }
.tp-table th, .tp-table td { padding:12px 14px; vertical-align:top; border-bottom:1px solid var(--tp-line); overflow-wrap:anywhere; }
.tp-table thead th { border-bottom-color:var(--tp-line-2); background:#f9fbfa; color:var(--tp-text); font:600 11.5px var(--tp-mono); letter-spacing:.06em; text-transform:uppercase; }
.tp-table tbody th { width:22%; color:var(--tp-text); font-weight:600; }
.tp-table tbody tr:nth-child(even) { background:#fbfcfc; }
.tp-table tbody tr:last-child > * { border-bottom:0; }
.tp-table td { color:var(--tp-soft); }
.tp-table.is-matrix td { text-align:center; vertical-align:middle; }
.tp-chip { display:inline-grid; place-items:center; min-width:30px; height:26px; padding:0 8px; border:1px solid var(--t-line); border-radius:6px; background:var(--t-bg); color:var(--t-fg); font:600 12px var(--tp-mono); }
.tp-legend { display:flex; flex-wrap:wrap; gap:8px 18px; margin-top:12px !important; color:var(--tp-muted); font-size:13px; }
.tp-legend > span { display:inline-flex; align-items:center; gap:8px; }
.tp-terms { margin:18px 0 0; display:grid; gap:10px; }
.tp-terms > div { display:grid; grid-template-columns:minmax(150px,.8fr) 2.2fr; gap:16px; padding:15px 18px; border:1px solid var(--tp-line); border-radius:12px; background:#fff; }
.tp-terms dt { color:var(--tp-accent); font-size:14.5px; font-weight:600; line-height:1.6; }
.tp-terms dd { margin:0; color:var(--tp-soft); font-size:14.5px; line-height:1.75; }
.tp-code { max-width:100%; margin:16px 0 0; padding:18px 20px; overflow:auto; border:1px solid var(--tp-slate-2); border-radius:12px; background:var(--tp-slate); box-shadow:inset 3px 0 0 var(--tp-bright); color:#e8edeb; font:13px/1.75 var(--tp-mono); }
.tp-code code { padding:0; border:0; background:none; color:inherit; font:inherit; white-space:pre; overflow-wrap:normal; }
.tp-sources ul { list-style:none; margin:16px 0 0; padding:0; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
.tp-sources li { min-width:0; padding:12px 14px; display:grid; gap:4px; border:1px solid var(--tp-line); border-radius:10px; background:#fff; }
.tp-sources a { color:var(--tp-link); font-size:14px; font-weight:600; text-decoration:none; overflow-wrap:anywhere; }
.tp-sources a:hover { text-decoration:underline; }
.tp-sources small { color:var(--tp-muted); font-size:12.5px; line-height:1.5; }
.tp-steps { list-style:none; margin:18px 0 0; padding:0; display:grid; gap:10px; }
.tp-steps > li { display:grid; grid-template-columns:44px minmax(0,1fr); gap:14px; padding:16px 18px; border:1px solid var(--tp-line); border-left:3px solid var(--t-mid); border-radius:12px; background:#fff; }
.tp-step-n { display:grid; place-items:center; width:40px; height:40px; border-radius:8px; background:var(--t-bg); color:var(--t-fg); font:600 12px var(--tp-mono); }
.tp-steps h4 { font-size:16px; font-weight:600; line-height:1.4; }
.tp-steps p { margin-top:6px !important; color:var(--tp-soft); font-size:14.5px; line-height:1.75; }
.tp-steps .tp-points { margin-top:8px; font-size:14px; }
.tp-when { display:inline-block; margin-bottom:6px; color:var(--t-fg); font:600 11px var(--tp-mono); letter-spacing:.08em; text-transform:uppercase; }
.tp-agenda-bar { display:flex; gap:4px; height:34px; margin-top:18px; }
.tp-agenda-bar span { flex-basis:0; min-width:28px; display:grid; place-items:center; border:1px solid var(--t-line); border-radius:6px; background:var(--t-bg); color:var(--t-fg); font:600 11px var(--tp-mono); }
.tp-agenda { list-style:none; margin:14px 0 0; padding:0; display:grid; gap:8px; }
.tp-agenda > li { display:grid; grid-template-columns:76px minmax(0,1fr); gap:14px; padding:14px 16px; border:1px solid var(--tp-line); border-left:4px solid var(--t-mid); border-radius:10px; background:#fff; }
.tp-agenda-min { padding-top:2px; color:var(--t-fg); font:600 13px var(--tp-mono); }
.tp-agenda h4 { font-size:15.5px; font-weight:600; }
.tp-agenda p { margin-top:4px !important; color:var(--tp-soft); font-size:14px; line-height:1.7; }
.tp-agenda .tp-points { margin-top:6px; font-size:14px; }
.tp-phrases { list-style:none; margin:16px 0 0; padding:0; display:grid; gap:10px; }
.tp-phrases li { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.tp-not, .tp-yes { padding:14px 16px; border-radius:12px; font-size:14.5px; line-height:1.7; }
.tp-not { border:1px solid var(--tp-line); background:#f9fbfa; color:var(--tp-muted); }
.tp-yes { border:1px solid #c0fae6; background:#e3fcf7; color:#023430; }
.tp-k { display:block; margin-bottom:4px; color:var(--tp-muted); font:600 10.5px var(--tp-mono); letter-spacing:.1em; text-transform:uppercase; font-style:normal; }
.tp-yes .tp-k { color:var(--tp-accent); }
.tp-map { position:relative; height:500px; margin-top:20px; overflow:hidden; border:1px solid var(--tp-line); border-radius:20px; background:radial-gradient(circle at 50% 50%, #e3fcf7 0, #fff 62%); }
.tp-map-lines { position:absolute; inset:0; width:100%; height:100%; }
.tp-map-lines line { stroke:#c1c7c6; stroke-width:1.5; stroke-dasharray:4 5; vector-effect:non-scaling-stroke; }
.tp-map-lines line.is-on { stroke:var(--tp-accent); stroke-width:2.5; stroke-dasharray:none; }
.tp-map-center { position:absolute; left:50%; top:50%; width:min(230px,34%); padding:16px; display:grid; gap:4px; transform:translate(-50%,-50%); border-radius:18px; background:var(--tp-slate); color:#e3fcf7; text-align:center; box-shadow:0 0 0 5px rgba(0,237,100,.2), 0 14px 30px rgba(0,30,43,.25); }
.tp-map-center strong { color:#fff; font-size:16px; }
.tp-map-center span { color:#c1c7c6; font-size:12.5px; line-height:1.5; }
.tp-map-node { position:absolute; width:156px; min-height:58px; padding:9px 12px; display:grid; gap:2px; transform:translate(-50%,-50%); border:1px solid var(--t-line); border-radius:12px; background:var(--t-bg); color:var(--t-fg); text-align:center; cursor:pointer; transition:transform .15s, box-shadow .15s; }
.tp-map-node:hover { transform:translate(-50%,-50%) scale(1.04); }
.tp-map-node[aria-pressed="true"] { border-color:var(--t-fg); background:#fff; box-shadow:0 0 0 3px var(--t-line), 0 10px 22px rgba(0,30,43,.12); }
.tp-map-node.is-self { border-width:2px; border-style:dashed; }
.tp-map-short { font:600 11px var(--tp-mono); letter-spacing:.08em; text-transform:uppercase; }
.tp-map-title { color:var(--tp-text); font-size:13px; font-weight:500; line-height:1.35; }
.tp-map-detail { margin-top:14px; padding:22px; border:1px solid var(--tp-line); border-radius:16px; background:#fff; }
.tp-map-detail .tp-eyebrow { margin-bottom:6px !important; color:var(--tp-accent); }
.tp-map-detail h4 { font-size:20px; font-weight:600; letter-spacing:-.015em; }
.tp-map-lead { margin-top:8px !important; color:var(--tp-soft); font-size:15px; line-height:1.75; }
.tp-map-detail dl { margin:14px 0 0; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
.tp-map-detail dl > div { min-width:0; padding:14px 16px; border:1px solid var(--tp-line); border-radius:10px; background:#f9fbfa; }
.tp-map-detail dt { color:var(--tp-accent); font:600 10.5px var(--tp-mono); letter-spacing:.1em; text-transform:uppercase; }
.tp-map-detail dd { margin:6px 0 0; color:var(--tp-soft); font-size:14px; line-height:1.7; }
.tp-primary, .tp-secondary { display:inline-flex; align-items:center; justify-content:center; gap:10px; min-height:46px; padding:10px 18px; border-radius:6px; cursor:pointer; font-size:14px; font-weight:600; text-align:left; transition:background .15s, box-shadow .15s; }
.tp-primary { border:1px solid #00593f; background:var(--tp-accent); color:#fff; }
.tp-primary:hover:not(:disabled) { background:#00593f; box-shadow:0 0 0 3px #c0fae6; }
.tp-secondary { border:1px solid #889397; background:#fff; color:var(--tp-text); }
.tp-secondary:hover { box-shadow:0 0 0 3px var(--tp-line); }
.tp-primary:disabled { opacity:.6; cursor:wait; }
.tp-toggle { min-height:44px; padding:8px 14px; border:1px dashed #00a35c; border-radius:999px; background:transparent; color:var(--tp-accent); cursor:pointer; font-size:13px; font-weight:600; }
.tp-toggle.is-on { border-style:solid; border-color:var(--tp-accent); background:var(--tp-accent); color:#fff; }
.tp-row { display:flex; flex-wrap:wrap; align-items:center; gap:10px; margin-top:16px; }
.tp-practice { margin-top:18px; padding:20px; border:1px solid var(--tp-line); border-radius:18px; background:linear-gradient(160deg,#e3fcf7,#fff 60%); }
.tp-practice-top { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:12px; }
.tp-practice-top p { max-width:620px; color:var(--tp-soft); font-size:14.5px; line-height:1.7; }
.tp-practice-card { margin-top:16px; padding:20px; border:1px solid var(--tp-line); border-radius:14px; background:#fff; }
.tp-practice-q { font-size:clamp(18px,2.2vw,22px); font-weight:600; line-height:1.45; letter-spacing:-.015em; }
.tp-timer { display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin-top:14px; }
.tp-timer-v { min-width:84px; padding:6px 12px; border-radius:6px; background:var(--tp-slate); color:var(--tp-bright); font:600 20px var(--tp-mono); font-variant-numeric:tabular-nums; text-align:center; }
.tp-timer.is-up .tp-timer-v { background:#db3030; color:#fff; }
.tp-timer button, .tp-deck-nav button, .tp-flash-controls > button, .tp-flash-opts button { min-height:44px; padding:8px 14px; border:1px solid var(--tp-line-2); border-radius:6px; background:#fff; color:var(--tp-soft); cursor:pointer; font-size:13px; }
.tp-timer button:disabled, .tp-deck-nav button:disabled { opacity:.45; cursor:not-allowed; }
.tp-timer-msg { color:#970606; font-size:13px; font-weight:600; }
.tp-qguide { display:grid; gap:10px; margin-top:16px; padding:16px 18px; border:1px solid #c3e7fe; border-radius:12px; background:#f1fbff; color:var(--tp-soft); font-size:14.5px; line-height:1.75; }
.tp-qguide ol { margin:0; padding-left:20px; display:grid; gap:4px; }
.tp-qgroup { margin-top:26px; }
.tp-qgroup-t { color:var(--tp-plum) !important; font-size:15px; font-weight:600; letter-spacing:.01em; }
.tp-qlist { display:grid; gap:8px; margin-top:10px; }
.tp-qlist details { border:1px solid var(--tp-line); border-radius:12px; background:#fff; }
.tp-qlist details[open] { border-color:#71f6ba; box-shadow:0 0 0 3px #e3fcf7; }
.tp-qlist summary { display:flex; align-items:baseline; gap:12px; padding:14px 16px; color:var(--tp-text); cursor:pointer; list-style:none; font-size:15px; line-height:1.6; }
.tp-qlist summary::-webkit-details-marker { display:none; }
.tp-qlist summary::after { content:"+"; margin-left:auto; padding-left:8px; color:var(--tp-accent); font-size:18px; line-height:1; }
.tp-qlist details[open] summary::after { content:"−"; }
.tp-q-dot { flex:0 0 auto; width:10px; height:10px; border:2px solid #00a35c; border-radius:50%; transform:translateY(1px); }
.tp-qlist details.is-done .tp-q-dot { border-color:var(--tp-accent); background:var(--tp-accent); }
.tp-qlist details > div { padding:0 16px 16px; display:grid; gap:12px; justify-items:start; }
.tp-qlist .tp-qguide { width:100%; margin-top:0; }
.tp-deck-pick { display:flex; flex-wrap:wrap; gap:6px; margin-top:18px; scroll-margin-top:80px; }
.tp-deck-pick button { min-width:44px; min-height:44px; border:1px solid var(--tp-line-2); border-radius:8px; background:#fff; color:var(--tp-soft); cursor:pointer; font:600 12.5px var(--tp-mono); }
.tp-deck-pick button.is-done { border-color:#71f6ba; background:#e3fcf7; color:var(--tp-accent); }
.tp-deck-pick button[aria-pressed="true"] { border-color:var(--tp-slate); background:var(--tp-slate); color:var(--tp-bright); }
.tp-scn { margin-top:14px; padding:clamp(18px,3vw,28px); border:1px solid var(--tp-plum-line); border-radius:18px; background:linear-gradient(180deg,var(--tp-plum-soft),#fff 140px); }
.tp-scn-n { color:var(--tp-plum); font:600 11px var(--tp-mono); letter-spacing:.1em; text-transform:uppercase; }
.tp-scn h4 { margin-top:8px; font-family:var(--tp-serif); font-size:clamp(22px,2.8vw,28px); font-weight:500; line-height:1.25; letter-spacing:-.01em; }
.tp-tags { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px !important; }
.tp-tags span { padding:3px 9px; border:1px solid var(--tp-plum-line); border-radius:4px; background:#fff; color:var(--tp-plum); font-size:12px; font-weight:600; }
.tp-story .tp-tags span { border-color:var(--t-line); color:var(--t-fg); }
.tp-scn-setup { display:grid; gap:10px; margin-top:14px; color:var(--tp-text); font-size:15.5px; line-height:1.8; }
.tp-scn-test { margin-top:14px !important; padding:12px 14px; border:1px solid #ffec9e; border-radius:10px; background:#fef7db; color:#4c2100; font-size:14px; line-height:1.7; }
.tp-scn-test .tp-k { color:#944f01; }
.tp-choices { min-width:0; margin:18px 0 0; padding:0; display:grid; gap:8px; border:0; }
.tp-choices legend { margin-bottom:10px; color:var(--tp-text); font-size:15px; font-weight:600; }
.tp-choice { width:100%; display:grid; grid-template-columns:32px minmax(0,1fr) auto; gap:12px; align-items:start; padding:13px 14px; border:1px solid var(--tp-line-2); border-radius:10px; background:#fff; color:var(--tp-text); text-align:left; cursor:pointer; font-size:14.5px; line-height:1.6; }
.tp-choice:hover { border-color:#b45af2; }
.tp-choice.is-chosen { border-width:2px; border-color:var(--tp-plum); }
.tp-choice-l { display:grid; place-items:center; width:30px; height:30px; border-radius:6px; background:var(--tp-plum-soft); color:var(--tp-plum); font:600 12px var(--tp-mono); }
.tp-verdict { align-self:center; padding:3px 9px; border-radius:4px; font:600 10.5px var(--tp-mono); letter-spacing:.06em; text-transform:uppercase; white-space:nowrap; }
.tp-choice.v-best .tp-verdict, .tp-feedback.v-best { background:#e3fcf7; color:var(--tp-accent); }
.tp-choice.v-okay .tp-verdict, .tp-feedback.v-okay { background:#fef7db; color:#944f01; }
.tp-choice.v-risky .tp-verdict, .tp-feedback.v-risky { background:#ffeae5; color:#970606; }
.tp-feedback { margin-top:12px; padding:14px 16px; border-radius:12px; font-size:14.5px; line-height:1.75; }
.tp-feedback strong { color:inherit; }
.tp-others { margin-top:10px; border:1px solid var(--tp-line); border-radius:12px; background:#f9fbfa; }
.tp-others summary { padding:12px 14px; color:var(--tp-soft); cursor:pointer; font-size:14px; font-weight:600; }
.tp-others ul { margin:0; padding:0 16px 14px 34px; display:grid; gap:8px; color:var(--tp-soft); font-size:14px; line-height:1.7; }
.tp-answer { margin-top:16px; padding:20px; display:grid; gap:14px; border:1px solid #c0fae6; border-radius:14px; background:#fff; }
.tp-answer-steps { margin:0; padding-left:22px; display:grid; gap:10px; }
.tp-answer-steps li { color:var(--tp-soft); font-size:14.5px; line-height:1.75; }
.tp-answer-steps li::marker { color:var(--tp-accent); font-weight:700; }
.tp-answer-steps strong { display:block; }
.tp-say { margin:0; padding:16px 18px; display:grid; gap:8px; border-left:4px solid var(--tp-bright); border-radius:0 12px 12px 0; background:#e3fcf7; color:#023430; font-family:var(--tp-serif); font-size:17px; font-style:italic; line-height:1.65; }
.tp-say .tp-k { color:var(--tp-accent); }
.tp-avoid .tp-points li::marker { color:#db3030; }
.tp-answer .tp-points { margin-top:4px; }
.tp-deck-nav { display:flex; justify-content:space-between; gap:10px; margin-top:22px; padding-top:16px; border-top:1px solid var(--tp-line); }
.tp-stories { list-style:none; margin:18px 0 0; padding:0; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
.tp-story { min-width:0; padding:20px; display:grid; gap:10px; align-content:start; border:1px solid var(--tp-line); border-top:3px solid var(--t-mid); border-radius:14px; background:linear-gradient(180deg,var(--t-bg),#fff 96px); }
.tp-story.is-ready { box-shadow:inset 0 0 0 2px var(--tp-accent); }
.tp-story-h { display:flex; align-items:baseline; gap:12px; }
.tp-story-n { color:var(--t-fg); font:600 12px var(--tp-mono); }
.tp-story h4 { font-size:16.5px; font-weight:600; line-height:1.4; }
.tp-story p { color:var(--tp-soft); font-size:14.5px; line-height:1.75; }
.tp-story .tp-points { margin-top:0; font-size:14px; }
.tp-story .tp-note { margin-top:0 !important; }
.tp-tick { display:inline-flex; align-items:center; gap:10px; min-height:44px; color:var(--tp-accent); cursor:pointer; font-size:14px; font-weight:600; }
.tp-tick input, .tp-checks input { width:20px; height:20px; accent-color:var(--tp-accent); }
.tp-checks { list-style:none; margin:16px 0 0; padding:0; display:grid; gap:8px; }
.tp-checks label { display:grid; grid-template-columns:22px minmax(0,1fr); gap:12px; align-items:start; padding:14px 16px; border:1px solid var(--tp-line); border-radius:12px; background:#fff; color:var(--tp-text); cursor:pointer; font-size:15px; line-height:1.65; }
.tp-checks input { margin:3px 0 0; }
.tp-checks small { display:block; margin-top:3px; color:var(--tp-muted); font-size:13.5px; line-height:1.6; }
.tp-checks label.is-done { border-color:#71f6ba; background:#e3fcf7; }
.tp-checks label.is-done > span { color:#023430; }
.tp-asks { list-style:none; margin:16px 0 0; padding:0; display:grid; gap:8px; }
.tp-asks li { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:14px; align-items:center; padding:16px 18px; border:1px solid var(--tp-line); border-radius:12px; background:#fff; }
.tp-asks li.is-on { border-color:#71f6ba; background:#e3fcf7; }
.tp-asks .tp-tag { --t-fg:#5e0c9e; --t-line:#f1d4fd; margin-bottom:6px; }
.tp-ask-q { color:var(--tp-text); font-size:15.5px; font-weight:600; line-height:1.6; }
.tp-ask-why { margin-top:4px !important; color:var(--tp-muted); font-size:13.5px; line-height:1.65; }
.tp-flash { display:grid; gap:12px; margin-top:18px; }
.tp-flash-card { position:relative; min-height:220px; padding:36px 26px 22px; display:grid; align-content:center; gap:14px; border:1px solid var(--tp-slate-2); border-radius:18px; background:radial-gradient(80% 90% at 100% 0%, rgba(0,237,100,.16), transparent 60%), var(--tp-slate); color:#fff; text-align:center; cursor:pointer; font-size:clamp(17px,2.1vw,21px); line-height:1.55; box-shadow:0 16px 40px rgba(0,30,43,.16); }
.tp-flash-card strong { color:var(--tp-mint); }
.tp-flash-card code { border-color:rgba(255,255,255,.14); background:rgba(255,255,255,.07); color:#e3fcf7; }
.tp-flash-card.is-back { border-color:#c0fae6; background:linear-gradient(160deg,#e3fcf7,#fff); color:var(--tp-text); font-size:16px; line-height:1.75; text-align:left; box-shadow:none; }
.tp-flash-card.is-back strong { color:var(--tp-text); }
.tp-flash-card.is-back code { border-color:var(--tp-line); background:#f9fbfa; color:#1c2d38; }
.tp-flash-n { position:absolute; top:14px; left:18px; color:#889397; font:600 11px var(--tp-mono); letter-spacing:.1em; text-transform:uppercase; }
.tp-flash-card.is-back .tp-flash-n { color:var(--tp-muted); }
.tp-flash-face { display:block; }
.tp-flash-hint { color:var(--tp-bright); font-size:12.5px; font-weight:600; text-align:center; }
.tp-flash-card.is-back .tp-flash-hint { color:var(--tp-accent); }
.tp-flash-controls { display:flex; flex-wrap:wrap; justify-content:space-between; gap:10px; }
.tp-flash-opts { display:flex; flex-wrap:wrap; align-items:center; gap:14px; color:var(--tp-soft); font-size:13.5px; }
.tp-flash-opts label { display:inline-flex; align-items:center; gap:8px; min-height:44px; cursor:pointer; }
.tp-flash-opts input { width:18px; height:18px; accent-color:var(--tp-accent); }
.tp-footer { margin-top:8px; padding:40px 24px 52px; display:grid; justify-items:center; gap:14px; background:var(--tp-slate); color:#889397; font:12.5px/1.7 var(--tp-mono); text-align:center; }
.tp-footer .tp-mark { height:30px; }
.tp-footer strong { color:#fff; }
.tp-root.tp-locked { position:relative; isolation:isolate; display:grid; place-items:center; padding:24px; color:#c1c7c6;
  background:radial-gradient(55% 60% at 85% 0%, rgba(0,237,100,.18), transparent 62%), radial-gradient(50% 55% at 0% 100%, rgba(1,107,248,.16), transparent 62%), #001e2b; }
.tp-root.tp-locked::before { content:""; position:absolute; inset:0; z-index:-1; pointer-events:none;
  background-image:linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px); background-size:44px 44px;
  -webkit-mask-image:radial-gradient(70% 70% at 50% 40%, #000 20%, transparent 75%); mask-image:radial-gradient(70% 70% at 50% 40%, #000 20%, transparent 75%); }
.tp-locked :focus-visible { outline-color:var(--tp-bright); }
.tp-lock-card { width:min(100%,440px); padding:36px; border:1px solid rgba(255,255,255,.1); border-radius:22px; background:rgba(17,39,51,.86); -webkit-backdrop-filter:blur(10px); backdrop-filter:blur(10px); box-shadow:0 30px 80px rgba(0,0,0,.45); color:#c1c7c6; line-height:1.7; text-align:center; }
.tp-gate-mark { width:68px; height:68px; margin:0 auto 22px; display:grid; place-items:center; border:1px solid rgba(0,237,100,.3); border-radius:18px; background:rgba(0,237,100,.1); color:var(--tp-bright); transform:rotate(-5deg); }
.tp-gate-mark svg { width:40px; height:40px; }
.tp-lock-card .tp-eyebrow { margin:0 0 10px !important; color:var(--tp-bright); font-size:10px; line-height:1.7; }
.tp-lock-card h1 { margin-bottom:10px; color:#fff; font-family:var(--tp-serif); font-size:clamp(36px,7vw,48px); font-weight:400; line-height:1.05; letter-spacing:-.02em; }
.tp-gate-form { display:grid; gap:10px; margin-top:24px; text-align:left; }
.tp-gate-form label { color:#e8edeb; font-size:13px; font-weight:600; }
.tp-password-field { display:flex; overflow:hidden; border:1px solid #3d4f58; border-radius:6px; background:#001e2b; }
.tp-password-field:focus-within { border-color:var(--tp-bright); outline:2px solid rgba(0,237,100,.45); outline-offset:2px; }
.tp-password-field input { flex:1; min-width:0; min-height:48px; padding:10px 14px; border:0; outline:0; background:transparent; color:#fff; font-size:16px; }
.tp-password-field input:focus-visible { outline:0; }
.tp-password-field button { min-width:64px; border:0; border-left:1px solid #3d4f58; background:var(--tp-slate-2); color:var(--tp-bright); cursor:pointer; font-size:13px; font-weight:600; }
.tp-gate-form .tp-primary { width:100%; margin-top:4px; justify-content:center; border-color:var(--tp-bright); background:var(--tp-bright); color:var(--tp-slate); font-weight:700; }
.tp-gate-form .tp-primary:hover:not(:disabled) { background:#00d65a; box-shadow:0 0 0 3px rgba(0,237,100,.28); }
.tp-gate-error { min-height:22px; color:#ff6960; font-size:13px; }
.tp-gate-note { display:block; margin-top:6px; color:#889397; font-size:12px; }
.tp-lock-card .tp-back { margin-top:8px; }
@media (max-width:900px) {
  .tp-hero { grid-template-columns:1fr; }
  .tp-cards[data-cols="3"] { grid-template-columns:repeat(2,minmax(0,1fr)); }
}
@media (max-width:720px) {
  .tp-wrap { width:min(100% - 24px, 1120px); }
  .tp-top { padding:6px 14px; }
  .tp-top-note { display:none; }
  .tp-top-actions { gap:8px; }
  .tp-lock-action { padding:7px 12px; }
  .tp-module { padding:22px 16px; border-radius:18px; }
  .tp-cards, .tp-cards[data-cols="3"], .tp-stories, .tp-sources ul, .tp-map-detail dl { grid-template-columns:1fr; }
  .tp-terms > div { grid-template-columns:1fr; gap:6px; }
  .tp-phrases li { grid-template-columns:1fr; }
  .tp-agenda > li { grid-template-columns:1fr; gap:4px; }
  .tp-agenda-bar span { min-width:22px; font-size:10px; }
  .tp-choice { grid-template-columns:30px minmax(0,1fr); }
  .tp-choice .tp-verdict { grid-column:2; justify-self:start; }
  .tp-asks li { grid-template-columns:1fr; }
  .tp-map { height:auto; padding:12px; display:grid; grid-template-columns:1fr 1fr; gap:8px; background:#f9fbfa; }
  .tp-map-lines { display:none; }
  .tp-map-center { position:static; width:auto; grid-column:1 / -1; transform:none; }
  .tp-map-node, .tp-map-node:hover { position:static; width:auto; transform:none; }
}
@media (max-width:400px) {
  .tp-top .tp-back { font-size:0; gap:0; }
  .tp-top .tp-back span { font-size:20px; }
}
@media (prefers-reduced-motion:reduce) {
  .tp-root *, .tp-root *::before, .tp-root *::after { transition:none !important; animation:none !important; scroll-behavior:auto !important; }
}

/* Intro clip overlay */
.tp-reel { position:fixed; inset:0; z-index:1200; display:flex; flex-direction:column; overflow:auto; overscroll-behavior:contain; color:#fff; outline:none;
  background:radial-gradient(90% 60% at 50% -10%, rgba(0,237,100,.22), transparent 62%), radial-gradient(60% 50% at 100% 100%, rgba(1,107,248,.18), transparent 62%), radial-gradient(60% 50% at 0% 100%, rgba(180,90,242,.13), transparent 62%), #001e2b;
  animation:tp-reel-in .5s ease both; }
.tp-reel.is-leaving { animation:tp-reel-out .36s ease forwards; }
.tp-reel-sky { position:absolute; inset:0; pointer-events:none; animation:tp-reel-breathe 6s ease-in-out infinite alternate;
  background-image:linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px); background-size:44px 44px;
  -webkit-mask-image:radial-gradient(60% 55% at 50% 40%, #000 10%, transparent 75%); mask-image:radial-gradient(60% 55% at 50% 40%, #000 10%, transparent 75%); }
.tp-reel-watermark { position:absolute; right:-4vmin; bottom:-6vmin; height:72vmin; opacity:.07; pointer-events:none; }
.tp-reel-top { position:relative; z-index:2; display:flex; align-items:center; justify-content:space-between; gap:12px; min-height:64px; padding:12px clamp(14px,4vw,32px) 0; }
.tp-reel-brand { display:inline-flex; align-items:center; gap:10px; min-width:0; color:#e3fcf7; font:600 11px var(--tp-mono); letter-spacing:.14em; text-transform:uppercase; }
.tp-reel-brand .tp-mark { height:26px; }
.tp-reel-hold { display:inline-flex; align-items:center; gap:8px; min-height:40px; padding:7px 14px; border:1px solid rgba(0,237,100,.38); border-radius:999px; background:rgba(0,237,100,.08); color:#e3fcf7; font-size:12.5px; font-weight:600; white-space:nowrap; }
.tp-reel-hold b { min-width:34px; color:var(--tp-bright); font:600 13px var(--tp-mono); font-variant-numeric:tabular-nums; text-align:right; }
.tp-reel-stage { position:relative; flex:1 0 auto; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:clamp(14px,2.4vh,24px); padding:4px 18px 30px; }
.tp-reel-frame { position:relative; flex:none; height:min(54vh, 620px, 150vw); aspect-ratio:9 / 16; overflow:hidden; border:1px solid rgba(0,237,100,.35); border-radius:22px; background:#000f15;
  box-shadow:0 0 0 6px rgba(0,237,100,.06), 0 30px 80px -20px rgba(0,0,0,.85), 0 0 90px -12px rgba(0,237,100,.35);
  animation:tp-reel-rise .7s cubic-bezier(.2,.8,.2,1) both; }
@supports (height:1dvh) { .tp-reel-frame { height:min(54dvh, 620px, 150vw); } }
.tp-reel-slot { position:absolute; inset:0; cursor:pointer; }
.tp-reel-video { display:block; width:100%; height:100%; object-fit:cover; background:#000f15; }
.tp-reel-wait { position:absolute; inset:0; display:grid; place-items:center; color:rgba(227,252,247,.75); font:600 11px var(--tp-mono); letter-spacing:.16em; text-transform:uppercase;
  background:linear-gradient(110deg, rgba(0,237,100,.03) 30%, rgba(0,237,100,.1) 50%, rgba(0,237,100,.03) 70%) 0 0 / 220% 100%; animation:tp-reel-shimmer 1.4s linear infinite; }
.tp-reel-chip { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); display:inline-flex; align-items:center; gap:8px; min-height:46px; padding:10px 18px; white-space:nowrap;
  border:1px solid rgba(0,237,100,.55); border-radius:999px; background:rgba(0,30,43,.72); -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px);
  color:#fff; cursor:pointer; font-size:14px; font-weight:700; animation:tp-reel-pulse 1.8s ease-in-out infinite; }
.tp-reel-mute { position:absolute; right:10px; bottom:14px; display:grid; place-items:center; width:42px; height:42px; border:1px solid rgba(255,255,255,.28); border-radius:999px;
  background:rgba(0,30,43,.55); -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px); color:#fff; cursor:pointer; font-size:16px; }
.tp-reel-progress { position:absolute; left:0; right:0; bottom:0; height:4px; background:rgba(255,255,255,.14); pointer-events:none; }
.tp-reel-progress i { display:block; height:100%; transform-origin:left center; background:linear-gradient(90deg, #00a35c, #00ed64); transition:transform .25s linear; }
.tp-reel-copy { position:relative; display:flex; flex-direction:column; align-items:center; gap:8px; max-width:min(92vw, 660px); text-align:center; }
.tp-reel-caption { margin:0; font-family:var(--tp-serif); font-size:clamp(34px, 5.8vw, 62px); font-weight:500; line-height:1.04; letter-spacing:-.02em; text-wrap:balance; }
.tp-reel-caption span { display:inline-block; padding-bottom:.06em; color:#fff; text-shadow:0 2px 30px rgba(0,237,100,.18);
  animation:tp-reel-word .7s cubic-bezier(.2,.8,.2,1) both; animation-delay:calc(450ms + var(--i) * 140ms); }
.tp-reel-caption span.is-hi { padding-right:.06em; color:transparent; font-style:italic; text-shadow:none; -webkit-background-clip:text; background-clip:text;
  background-image:linear-gradient(100deg, #00ed64 0%, #71f6ba 45%, #c0fae6 70%, #00ed64 100%); background-size:220% auto; background-position:0% 50%; }
.tp-reel.is-ended .tp-reel-caption { animation:tp-reel-pop .6s cubic-bezier(.2,.9,.3,1.4) both; }
.tp-reel.is-ended .tp-reel-caption span.is-hi { animation:tp-reel-shine 2.8s ease-in-out infinite; }
.tp-reel-from { margin:0; color:#c1c7c6; font:italic 400 17px var(--tp-serif); animation:tp-reel-in .8s ease 1.3s both; }
.tp-reel-shell { width:min(100%, 560px); margin-top:6px; padding:10px 14px; display:grid; gap:4px; border:1px solid rgba(255,255,255,.1); border-radius:8px; background:rgba(0,0,0,.28); color:#e8edeb; font:12.5px/1.6 var(--tp-mono); text-align:left; overflow-wrap:anywhere; animation:tp-reel-in .8s ease 1.6s both; }
.tp-reel-prompt { margin-right:8px; color:var(--tp-bright); }
.tp-reel-cursor { display:inline-block; width:.6em; height:1.1em; margin-left:4px; vertical-align:-.2em; background:var(--tp-bright); animation:tp-reel-blink 1s steps(1) infinite; }
.tp-reel-out { color:var(--tp-mint); animation:tp-reel-in .5s ease both; }
.tp-reel-actions { display:flex; flex-wrap:wrap; justify-content:center; gap:10px; min-height:50px; margin-top:12px; scroll-margin-bottom:24px; opacity:0; visibility:hidden; transform:translateY(8px);
  transition:opacity .4s ease, transform .4s ease, visibility 0s linear .4s; }
.tp-reel-actions.is-on { opacity:1; visibility:visible; transform:none; transition:opacity .4s ease, transform .4s ease; }
.tp-reel-go { display:inline-flex; align-items:center; gap:10px; min-height:50px; padding:12px 26px; border:0; border-radius:8px; background:var(--tp-bright); color:var(--tp-slate);
  cursor:pointer; font-size:16px; font-weight:700; box-shadow:0 10px 30px -8px rgba(0,237,100,.65); transition:transform .15s, background .15s; }
.tp-reel-go:hover { background:#00d65a; transform:translateY(-1px); }
.tp-reel-ghost { display:inline-flex; align-items:center; gap:8px; min-height:44px; padding:9px 16px; border:1px solid rgba(255,255,255,.3); border-radius:8px;
  background:rgba(255,255,255,.06); -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px); color:#fff; cursor:pointer; font-size:13px; font-weight:600; }
.tp-reel-ghost:hover { background:rgba(255,255,255,.14); }
.tp-reel button:focus-visible { outline:3px solid var(--tp-bright); outline-offset:3px; }
.tp-reel-burst { position:absolute; left:50%; top:22%; width:0; height:0; pointer-events:none; }
.tp-reel-burst i { position:absolute; left:0; top:0; width:8px; height:14px; border-radius:2px; background:var(--c); opacity:0;
  animation:tp-reel-burst 1.6s cubic-bezier(.15,.7,.3,1) both; animation-delay:var(--d); }
@keyframes tp-reel-in { from { opacity:0; } to { opacity:1; } }
@keyframes tp-reel-out { to { opacity:0; transform:scale(1.02); } }
@keyframes tp-reel-rise { from { opacity:0; transform:translateY(18px) scale(.97); } to { opacity:1; transform:none; } }
@keyframes tp-reel-word { from { opacity:0; transform:translateY(.45em) scale(.96); filter:blur(6px); } to { opacity:1; transform:none; filter:none; } }
@keyframes tp-reel-shine { 0%, 100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
@keyframes tp-reel-pop { 0% { transform:scale(1); } 40% { transform:scale(1.07); } 100% { transform:scale(1); } }
@keyframes tp-reel-pulse { 0%, 100% { box-shadow:0 0 0 0 rgba(0,237,100,.4); } 50% { box-shadow:0 0 0 12px rgba(0,237,100,0); } }
@keyframes tp-reel-shimmer { to { background-position:-220% 0; } }
@keyframes tp-reel-breathe { from { opacity:.55; } to { opacity:1; } }
@keyframes tp-reel-blink { 50% { opacity:0; } }
@keyframes tp-reel-burst {
  0% { opacity:1; transform:translate(-50%,-50%) scale(.4) rotate(0deg); }
  70% { opacity:1; }
  100% { opacity:0; transform:translate(calc(-50% + var(--x)), calc(-50% + var(--y) + 90px)) scale(1) rotate(var(--r)); }
}
@media (max-height:700px) {
  .tp-reel-frame { height:min(50vh, 640px, 150vw); }
  @supports (height:1dvh) { .tp-reel-frame { height:min(50dvh, 640px, 150vw); } }
  .tp-reel-caption { font-size:clamp(30px, 5vw, 48px); }
}
@media (orientation:landscape) and (max-height:520px) {
  .tp-reel-top { position:absolute; top:0; left:0; right:0; }
  .tp-reel-stage { flex-direction:row; gap:clamp(18px,4vw,40px); padding:58px 24px 14px; }
  .tp-reel-frame { height:min(78vh, 640px); }
  .tp-reel-copy { align-items:flex-start; max-width:50vw; text-align:left; }
  .tp-reel-actions { justify-content:flex-start; }
  .tp-reel-caption { font-size:clamp(26px, 4.4vw, 40px); }
  @supports (height:1dvh) { .tp-reel-frame { height:min(78dvh, 640px); } }
}
@media (prefers-reduced-motion:reduce) {
  .tp-reel-burst { display:none; }
}
`
