import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAmbient } from './AmbientContext'
import { SEVEN_AM_PAYLOAD as PAYLOAD } from '../lib/sevenAmPayload'

/* ------------------------------------------------------------------ *
 * #/7am/<key> — a small private note that opens only from its link.
 *
 * The words ship encrypted (PBKDF2-SHA256 → AES-GCM-256, the scheme the
 * other private pages use). The key is the last part of the link. It
 * sits in the URL fragment, so it never reaches a server, and it is not
 * in the repo. Without it the page stays a closed note.
 *
 * Every word lives in the payload. This file draws a terminal that types
 * out scripted commands, a small chat with multiple-choice prompts (each
 * choice runs its own script), a card to reveal, and a closing card.
 * Edit with scripts/private-payload.mjs (decrypt → edit → encrypt).
 * ------------------------------------------------------------------ */

const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function unlock(pass) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64(PAYLOAD.salt), iterations: PAYLOAD.iter || 200000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt'],
  )
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(PAYLOAD.iv) }, key, b64(PAYLOAD.ct))
  return JSON.parse(new TextDecoder().decode(pt))
}

// In memory only, keyed by the link it came from.
let cached = null

// The key may be a short word, so allow three characters and up, and
// read it in lower case so a capital letter typed by hand still works.
const readKey = () => ((/^#\/7am\/([A-Za-z0-9_-]{3,})\/?$/i.exec(window.location.hash || '') || [])[1] || '').toLowerCase()

const FONTS_ID = 'am-fonts'
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Gaegu:wght@700&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap'

const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* ------------------------------------------------------------------ *
 * Sound. Synthesised and soft. Nothing is created until the first tap
 * or key press, so the page never asks the browser for audio on load.
 * Web Audio follows the phone's silent switch on iOS.
 * ------------------------------------------------------------------ */
function createSfx() {
  const AC = window.AudioContext || window.webkitAudioContext
  let ctx = null
  let out = null
  let muted = false

  const get = () => {
    if (!AC || muted) return null
    if (!ctx) {
      try {
        ctx = new AC()
        out = ctx.createGain()
        out.gain.value = 0.55
        out.connect(ctx.destination)
      } catch {
        ctx = null
        return null
      }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    return ctx
  }

  const tone = ({ type = 'sine', f0, f1 = f0, at = 0, dur = 0.25, vol = 0.05, attack = 0.01 }) => {
    const c = get()
    if (!c) return
    const t = c.currentTime + at
    const o = c.createOscillator()
    o.type = type
    o.frequency.setValueAtTime(f0, t)
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g)
    g.connect(out)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  return {
    setMuted(m) { muted = m },
    key() { tone({ type: 'square', f0: 1700 + Math.random() * 500, dur: 0.022, vol: 0.005 }) },
    enter() { tone({ f0: 620, dur: 0.07, vol: 0.018 }) },
    good() {
      tone({ f0: 880, dur: 0.16, vol: 0.035 })
      tone({ f0: 1318.5, dur: 0.34, vol: 0.035, at: 0.1 })
    },
    bonk() { tone({ type: 'triangle', f0: 260, f1: 150, dur: 0.3, vol: 0.05 }) },
    reveal() {
      ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone({ type: 'triangle', f0: f, dur: 1.7, vol: 0.034, attack: 0.05, at: i * 0.12 }))
    },
    yay() {
      ;[784, 987.8, 1174.7, 1568, 1975.5].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.5, vol: 0.03, at: i * 0.08 }))
      tone({ f0: 2093, dur: 0.9, vol: 0.02, at: 0.45 })
    },
    close() { try { ctx?.close() } catch {} },
  }
}

/* ---------------------------- time --------------------------------- */

function useNow(every) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), every)
    return () => clearInterval(t)
  }, [every])
  return now
}

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`
function until(ms) {
  const mins = Math.floor(ms / 60000)
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d >= 1) return `${plural(d, 'day')} ${plural(h, 'hr')}`
  if (h >= 1) return `${plural(h, 'hr')} ${m} min`
  return `${m} min ${Math.floor(ms / 1000) % 60} sec`
}

/* --------------------------- confetti ------------------------------ */

const BITS = ['#00ed64', '#3ccf7d', '#9ff0c0', '#ffd36b', '#ff8fab', '#ff6f91']
function burst(host, count = 80) {
  if (!host || reducedMotion()) return
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span')
    const kind = Math.random()
    if (kind < 0.55) {
      s.className = 'am-bit leaf'
      s.style.background = BITS[(Math.random() * 3) | 0]
    } else if (kind < 0.85) {
      s.className = 'am-bit heart'
      s.textContent = '♥'
      s.style.color = BITS[4 + ((Math.random() * 2) | 0)]
    } else {
      s.className = 'am-bit spark'
      s.textContent = '✦'
      s.style.color = BITS[3]
    }
    s.style.left = `${4 + Math.random() * 92}%`
    s.style.setProperty('--x', `${(Math.random() - 0.5) * 170}px`)
    s.style.setProperty('--r', `${(Math.random() - 0.5) * 720}deg`)
    s.style.setProperty('--d', `${2.6 + Math.random() * 2.4}s`)
    s.style.animationDelay = `${Math.random() * 0.7}s`
    s.addEventListener('animationend', () => s.remove())
    host.appendChild(s)
  }
}

/* ------------------------- highlighting ---------------------------- *
 * Colours a line the way a shell prints values: strings, numbers and
 * literals, wrapped ids like Name('…'), and keys. An unclosed string stays plain, so a
 * half-typed command never flickers.
 * ------------------------------------------------------------------- */
const TOKEN = /([A-Z]\w*\('[^']*'\)|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b(?:true|false|null|Infinity)\b|\b\d+(?:\.\d+)?\b|[A-Za-z_$][\w$]*(?=:))/g
function Hl({ text }) {
  const out = []
  let last = 0
  let m
  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const t = m[0]
    const cls = t[0] === '"' || t[0] === "'" ? 'am-t-s' : /^[A-Z]\w*\(/.test(t) ? 'am-t-o' : /^(true|false|null|Infinity|\d)/.test(t) ? 'am-t-n' : 'am-t-k'
    out.push(<span key={m.index} className={cls}>{t}</span>)
    last = TOKEN.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return <>{out}</>
}

/* --------------------------- the terminal -------------------------- *
 * run(ops) queues steps and resolves when they've all played:
 *   { cmd, prompt? }  typed out character by character
 *   { out: [...], kind? }  printed line by line ('out' | 'info' | 'err')
 *   { pause: ms }
 * skip() plays whatever is queued instantly. Reduced motion always does.
 * ------------------------------------------------------------------- */
let lineId = 0

function useTerminal(getSfx) {
  const [lines, setLines] = useState([])
  const [busy, setBusy] = useState(false)
  const queue = useRef([])
  const timer = useRef(null)
  const fast = useRef(false)
  const running = useRef(false)
  const waiters = useRef([])
  const sfx = useRef(getSfx)
  sfx.current = getSfx

  const finish = () => {
    running.current = false
    fast.current = false
    setBusy(false)
    const w = waiters.current
    waiters.current = []
    w.forEach((f) => f())
  }

  const step = useCallback(() => {
    const op = queue.current.shift()
    if (!op) { finish(); return }
    const quick = () => fast.current || reducedMotion()
    if (op.cmd != null) {
      const id = ++lineId
      const text = op.cmd
      setLines((ls) => [...ls, { id, kind: 'cmd', prompt: op.prompt, text: quick() ? text : '', typing: !quick() }])
      if (quick()) { timer.current = setTimeout(step, 0); return }
      let i = 0
      const type = () => {
        if (quick()) {
          setLines((ls) => ls.map((l) => (l.id === id ? { ...l, text, typing: false } : l)))
          timer.current = setTimeout(step, 0)
          return
        }
        i = Math.min(text.length, i + 1 + (Math.random() < 0.35 ? 1 : 0))
        const done = i >= text.length
        setLines((ls) => ls.map((l) => (l.id === id ? { ...l, text: text.slice(0, i), typing: !done } : l)))
        if (i % 2 === 0) sfx.current()?.key()
        if (done) {
          sfx.current()?.enter()
          timer.current = setTimeout(step, 300)
        } else {
          timer.current = setTimeout(type, 18 + Math.random() * 34)
        }
      }
      timer.current = setTimeout(type, 240)
    } else if (op.out) {
      const rows = op.out
      let j = 0
      const show = () => {
        const take = quick() ? rows.length - j : 1
        const chunk = rows.slice(j, j + take)
        j += take
        setLines((ls) => [...ls, ...chunk.map((t) => ({ id: ++lineId, kind: op.kind || 'out', text: t }))])
        if (j >= rows.length) timer.current = setTimeout(step, quick() ? 0 : 280)
        else timer.current = setTimeout(show, 45)
      }
      show()
    } else if (op.pause) {
      timer.current = setTimeout(step, quick() ? 0 : op.pause)
    } else {
      step()
    }
  }, [])

  const run = useCallback((ops) => new Promise((resolve) => {
    queue.current.push(...(ops || []))
    waiters.current.push(resolve)
    if (!running.current) {
      running.current = true
      setBusy(true)
      step()
    }
  }), [step])

  const skip = useCallback(() => { if (running.current) fast.current = true }, [])

  // Pending runs are dropped, not resolved, so nothing waiting on them
  // fires after a restart or an unmount.
  const reset = useCallback(() => {
    clearTimeout(timer.current)
    queue.current = []
    waiters.current = []
    running.current = false
    fast.current = false
    setBusy(false)
    setLines([])
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])
  return { lines, busy, run, skip, reset }
}

function Terminal({ title, prompt, skipLabel, lines, busy, onSkip }) {
  const body = useRef(null)
  useEffect(() => {
    const el = body.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines, busy])
  return (
    <div className={busy ? 'am-con is-busy' : 'am-con'}>
      <div className="am-con-bar">
        <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
        <span className="am-con-title">{title}</span>
        {busy && skipLabel && <button type="button" className="am-con-skip" onClick={onSkip}>{skipLabel}</button>}
      </div>
      <div className="am-con-body" ref={body} role="log" aria-label={title} onClick={busy ? onSkip : undefined}>
        {lines.map((l) => (
          <p key={l.id} className={`am-l am-l-${l.kind}`}>
            {l.kind === 'cmd' && <span className="am-pr">{l.prompt || prompt}</span>}
            {l.kind === 'cmd' || l.kind === 'out' ? <Hl text={l.text} /> : l.text}
            {l.typing && <span className="am-caret" aria-hidden="true" />}
          </p>
        ))}
        {!busy && (
          <p className="am-l am-l-cmd" aria-hidden="true"><span className="am-pr">{prompt}</span><span className="am-caret idle" /></p>
        )}
      </div>
    </div>
  )
}

/* ---------------------------- characters --------------------------- */

function Leaf({ happy, className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="am-leaf-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3dff8f" /><stop offset="1" stopColor="#00a85a" />
        </linearGradient>
      </defs>
      <path d="M32 61 V44" stroke="#0b5d3b" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 46 C 13 38 9 17 32 3 C 55 17 51 38 32 46 Z" fill="url(#am-leaf-g)" stroke="#0b5d3b" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M32 42 C 31 32 31 20 32 9" fill="none" stroke="#0b5d3b" strokeWidth="1.4" opacity=".3" />
      {happy ? (
        <path d="M23.5 25 q3 -4 6 0 M34.5 25 q3 -4 6 0" fill="none" stroke="#062a1c" strokeWidth="2.2" strokeLinecap="round" />
      ) : (
        <>
          <circle cx="26.5" cy="24.5" r="2.5" fill="#062a1c" /><circle cx="37.5" cy="24.5" r="2.5" fill="#062a1c" />
          <circle cx="27.3" cy="23.7" r=".8" fill="#fff" /><circle cx="38.3" cy="23.7" r=".8" fill="#fff" />
        </>
      )}
      <path d="M28 30.5 q4 4 8 0" fill="none" stroke="#062a1c" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="22.5" cy="29.5" rx={happy ? 3.6 : 3} ry="1.9" fill="#ff8fab" opacity=".9" />
      <ellipse cx="41.5" cy="29.5" rx={happy ? 3.6 : 3} ry="1.9" fill="#ff8fab" opacity=".9" />
    </svg>
  )
}

const Dots = () => <span className="am-dots" aria-hidden="true"><i /><i /><i /></span>

const BackArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
)

function Closed({ opening, onBack }) {
  return (
    <div className="am-root am-closed">
      <style>{CSS}</style>
      <div className="am-closed-card">
        <Leaf className="am-closed-leaf" />
        {opening
          ? <p className="am-closed-t" role="status">Opening…</p>
          : <p className="am-closed-t">This little page opens from the link it came in.</p>}
        <button type="button" className="am-ghost" onClick={onBack}><BackArrow /> Back to site</button>
      </div>
    </div>
  )
}

function Title({ text }) {
  const i = (text || '').lastIndexOf(', ')
  if (i < 0) return <h1 className="am-title">{text}</h1>
  return <h1 className="am-title">{text.slice(0, i + 1)} <span className="am-title-name">{text.slice(i + 2)}</span></h1>
}

// "Something, Name" sets the name on a line of its own.
function Split({ text }) {
  const i = (text || '').lastIndexOf(', ')
  if (i < 0) return text || null
  return <>{text.slice(0, i + 1)}<br /><span className="am-final-name">{text.slice(i + 2)}</span></>
}

/* ------------------------------ page ------------------------------- *
 * boot → intro → (ask → running → react) × n → eval → reveal → done
 * ------------------------------------------------------------------- */

function Practice({ data, onBack }) {
  const { meta = {}, console: shell = {}, boot = [], intro = {}, questions = [], reveal = {}, final = {}, end = {} } = data
  const [phase, setPhase] = useState('boot')
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState(-1)
  const [accepted, setAccepted] = useState(false)
  const [muted, setMuted] = useState(false)
  const [round, setRound] = useState(0)
  const armed = useRef(false)
  const sfxRef = useRef(null)
  const mutedRef = useRef(muted)
  mutedRef.current = muted
  const getSfx = useCallback(() => {
    if (!armed.current) return null
    if (!sfxRef.current) sfxRef.current = createSfx()
    sfxRef.current.setMuted(mutedRef.current)
    return sfxRef.current
  }, [])
  const term = useTerminal(getSfx)
  const conRef = useRef(null)
  const chatRef = useRef(null)
  const revealRef = useRef(null)
  const finalRef = useRef(null)
  const firstOpt = useRef(null)
  const nextBtn = useRef(null)
  const confetti = useRef(null)
  const timers = useRef([])
  const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)) }
  const now = useNow(1000)

  useEffect(() => {
    const arm = () => { armed.current = true }
    window.addEventListener('pointerdown', arm, true)
    window.addEventListener('keydown', arm, true)
    return () => {
      window.removeEventListener('pointerdown', arm, true)
      window.removeEventListener('keydown', arm, true)
    }
  }, [])
  useEffect(() => () => { timers.current.forEach(clearTimeout); sfxRef.current?.close() }, [])
  useEffect(() => { sfxRef.current?.setMuted(muted) }, [muted])
  useEffect(() => { window.scrollTo(0, 0) }, [])

  // The opening script plays on load and again on every restart.
  useEffect(() => {
    let live = true
    term.run(boot).then(() => { if (live) setPhase('intro') })
    return () => { live = false; term.reset() }
  }, [round]) // eslint-disable-line react-hooks/exhaustive-deps

  const smooth = () => (reducedMotion() ? 'auto' : 'smooth')
  const bring = (ref, block = 'start') => ref.current?.scrollIntoView({ behavior: smooth(), block })
  const q = questions[qi]
  const opt = q && picked >= 0 ? q.options[picked] : null

  const start = () => {
    setQi(0); setPicked(-1); setPhase('ask')
    later(() => { bring(conRef); firstOpt.current?.focus({ preventScroll: true }) }, 60)
  }
  const choose = (i) => {
    if (phase !== 'ask' || !q) return
    const o = q.options[i]
    setPicked(i)
    setPhase('running')
    // On a phone the terminal sits above the choices: bring it up so the
    // query is seen running, then bring the reply and the next step down.
    const top = conRef.current?.getBoundingClientRect().top ?? 0
    if (top < 0 || top > window.innerHeight * 0.35) bring(conRef)
    term.run([{ cmd: o.q }, { out: o.out || [], kind: o.kind }]).then(() => {
      getSfx()?.[o.kind === 'err' ? 'bonk' : 'good']()
      setPhase('react')
      later(() => {
        nextBtn.current?.scrollIntoView({ behavior: smooth(), block: 'nearest' })
        nextBtn.current?.focus({ preventScroll: true })
      }, 80)
    })
  }
  const next = () => {
    if (qi < questions.length - 1) {
      setQi(qi + 1); setPicked(-1); setPhase('ask')
      later(() => { bring(chatRef, 'nearest'); firstOpt.current?.focus({ preventScroll: true }) }, 60)
      return
    }
    setPhase('eval')
    term.run(data.eval || []).then(() => {
      setPhase('reveal')
      getSfx()?.reveal()
      later(() => { bring(revealRef); revealRef.current?.focus({ preventScroll: true }) }, 80)
    })
  }
  const accept = () => {
    if (accepted) return
    setAccepted(true)
    getSfx()?.yay()
    burst(confetti.current)
    term.run(reveal.after || []).then(() => {
      setPhase('done')
      later(() => { bring(finalRef); finalRef.current?.focus({ preventScroll: true }) }, 900)
    })
  }
  const again = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setQi(0); setPicked(-1); setAccepted(false); setPhase('boot')
    setRound((r) => r + 1)
    window.scrollTo({ top: 0, behavior: smooth() })
  }

  const target = Date.parse(meta.when || '')
  const diff = target - now
  const win = (meta.windowMin || 90) * 60000
  const when = Number.isNaN(target) ? '' : diff > 0 ? `${until(diff)} ${meta.toGo || ''}`.trim() : diff > -win ? meta.during : meta.after
  const asking = phase === 'ask' || phase === 'running' || phase === 'react'
  const revealed = phase === 'reveal' || phase === 'done'

  return (
    <div className="am-root">
      <style>{CSS}</style>
      <div className="am-confetti" ref={confetti} aria-hidden="true" />

      <div className="am-top">
        <button type="button" className="am-back" onClick={onBack}><BackArrow /><span>Back to site</span></button>
        <button type="button" className="am-mute" aria-pressed={!muted} onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Sound off' : 'Sound on'} title={muted ? 'Sound off' : 'Sound on'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5L6 9H3v6h3l5 4V5z" />
            {muted ? <path d="M22 9l-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
          </svg>
        </button>
      </div>

      <main className="am-main">
        <header className="am-hero">
          <p className="am-chips">
            {meta.kicker && <span className="am-chip">{meta.kicker}</span>}
            {when && <span className="am-chip am-count"><i aria-hidden="true" />{when}</span>}
          </p>
          <Title text={meta.title} />
          {meta.sub && <p className="am-sub">{meta.sub}</p>}
        </header>

        <section className="am-sec" ref={conRef}>
          <Terminal title={shell.title} prompt={shell.prompt} skipLabel={shell.skip}
            lines={term.lines} busy={term.busy} onSkip={term.skip} />
        </section>

        {!revealed && (
          <section className="am-chat" ref={chatRef}>
            <div className="am-who">
              <Leaf happy={phase === 'react' && opt?.kind !== 'err'} className={phase === 'react' ? 'am-leafy hop' : 'am-leafy'} />
              <div>
                <p className="am-who-n">{intro.name}</p>
                <p className="am-who-r">{asking && q ? q.label : intro.role}</p>
              </div>
            </div>
            <div aria-live="polite">
              {(phase === 'boot' || phase === 'eval') && <p className="am-bubble"><Dots /></p>}
              {phase === 'intro' && <p className="am-bubble">{intro.say}</p>}
              {asking && q && <p className="am-bubble" key={`ask-${qi}`}>{q.ask}</p>}
            </div>
            {phase === 'intro' && (
              <button type="button" className="am-primary" onClick={start}>{intro.start}</button>
            )}
            {asking && q && (
              <ul className="am-opts">
                {q.options.map((o, i) => (
                  <li key={`${qi}-${i}`}>
                    <button type="button" ref={i === 0 ? firstOpt : undefined}
                      className={picked === i ? 'am-opt on' : 'am-opt'}
                      disabled={phase !== 'ask' && picked !== i}
                      aria-disabled={phase !== 'ask' || undefined}
                      aria-pressed={picked === i}
                      onClick={() => choose(i)}>
                      <span className="am-opt-run" aria-hidden="true">▶</span>
                      <code><Hl text={o.q} /></code>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div aria-live="polite">
              {phase === 'react' && opt && (
                <p className={opt.kind === 'err' ? 'am-bubble am-react err' : 'am-bubble am-react'}>{opt.say}</p>
              )}
            </div>
            {phase === 'react' && (
              <button type="button" ref={nextBtn} className="am-primary" onClick={next}>
                {qi < questions.length - 1 ? data.next : data.finish}
              </button>
            )}
          </section>
        )}

        {revealed && (
          <article className={accepted ? 'am-letter is-signed' : 'am-letter'} ref={revealRef} tabIndex={-1}>
            <div className="am-letter-band"><Leaf className="am-letter-leaf" happy /><span>{reveal.band}</span></div>
            <div className="am-letter-body">
              <span className="am-stamp">{accepted ? reveal.stampDone : reveal.stamp}</span>
              <h2 className="am-letter-t">{reveal.title}</h2>
              {reveal.intro && <p className="am-letter-i">{reveal.intro}</p>}
              <dl className="am-letter-rows">
                {(reveal.rows || []).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
              </dl>
              {reveal.note && <p className="am-letter-note">{reveal.note}</p>}
              {reveal.sign && <p className="am-letter-sign">{reveal.sign}</p>}
              {accepted
                ? <p className="am-accepted" role="status">{reveal.stampDone}</p>
                : <button type="button" className="am-primary am-accept" onClick={accept}>{reveal.accept}</button>}
            </div>
          </article>
        )}

        {phase === 'done' && (
          <article className="am-final" ref={finalRef} tabIndex={-1}>
            {final.kicker && <p className="am-final-k">{final.kicker}</p>}
            {final.title && <h2 className="am-final-t"><Split text={final.title} /></h2>}
            {(final.lines || []).map((l, i) => <p key={i} className="am-final-p">{l}</p>)}
            {final.closer && <p className="am-final-c">{final.closer}</p>}
            {Array.isArray(final.sign) && <p className="am-final-s">{final.sign.map((s, i) => <span key={i}>{s}</span>)}</p>}
          </article>
        )}

        <footer className="am-end">
          {phase === 'done' && end.again && <button type="button" className="am-ghost" onClick={again}>{end.again}</button>}
          {end.note && <p className="am-end-note">{end.note}</p>}
        </footer>
      </main>
    </div>
  )
}

export default function SevenAM({ onBack }) {
  const key = readKey()
  const [data, setData] = useState(() => (cached && cached.key === key ? cached.data : null))
  const [failed, setFailed] = useState(false)
  const setSuppressed = useAmbient()?.setSuppressed
  const back = onBack || (() => { window.location.hash = '' })

  useEffect(() => {
    setSuppressed?.(true)
    return () => setSuppressed?.(false)
  }, [setSuppressed])

  useEffect(() => {
    if (document.getElementById(FONTS_ID)) return
    const l = document.createElement('link')
    l.id = FONTS_ID
    l.rel = 'stylesheet'
    l.href = FONTS_HREF
    document.head.appendChild(l)
  }, [])

  useEffect(() => {
    if (!key || (data && cached?.key === key)) return
    let live = true
    setFailed(false)
    unlock(key)
      .then((d) => { if (!live) return; cached = { key, data: d }; setData(d) })
      .catch(() => { if (live) setFailed(true) })
    return () => { live = false }
  }, [key, data])

  if (data && cached?.key === key) return <Practice data={data} onBack={back} />
  return <Closed opening={!!key && !failed} onBack={back} />
}

/* ----------------------------- styles ------------------------------ */

const ROUND = `'Fredoka', 'Nunito', system-ui, sans-serif`
const MONO = `'JetBrains Mono', ui-monospace, monospace`
const CSS = `
body:has(.am-root) { background: #001e2b !important; background-image: none !important; }
.am-root {
  --bg: #001e2b; --deep: #00141c; --panel: #062a36; --line: #12404d;
  --text: #e8f3ef; --soft: #b8cdc6; --dim: #93ada5; --green: #00ed64; --forest: #00684a;
  position: relative; min-height: 100vh; min-height: 100dvh; overflow-x: clip; color-scheme: dark;
  background:
    radial-gradient(80% 50% at 50% -10%, rgba(0,237,100,.16), rgba(0,237,100,0) 70%),
    radial-gradient(circle at 1px 1px, rgba(255,255,255,.055) 1px, transparent 1.3px) 0 0 / 22px 22px,
    var(--bg);
  color: var(--text); font-family: 'Nunito', system-ui, sans-serif; -webkit-font-smoothing: antialiased;
}
.am-root :focus-visible { outline: 3px solid var(--green); outline-offset: 3px; border-radius: 12px; }

.am-top { position: relative; z-index: 2; max-width: 40rem; margin: 0 auto; padding: .9rem 1.1rem 0; display: flex; align-items: center; justify-content: space-between; }
.am-back { display: inline-flex; align-items: center; gap: .4rem; min-height: 2.6rem; padding: .35rem .8rem .35rem .55rem; border: 0; border-radius: 99px;
  background: rgba(255,255,255,.05); color: var(--soft); font: 600 .92rem 'Nunito', system-ui, sans-serif; cursor: pointer; transition: background .2s, color .2s; }
.am-back:hover, .am-mute:hover { color: var(--text); background: rgba(255,255,255,.1); }
.am-back svg, .am-ghost svg { width: 1rem; height: 1rem; }
.am-mute { width: 2.6rem; height: 2.6rem; display: grid; place-items: center; border: 0; border-radius: 50%; background: rgba(255,255,255,.05); color: var(--soft); cursor: pointer; }
.am-mute svg { width: 1.15rem; height: 1.15rem; }

.am-main { position: relative; z-index: 1; max-width: 38rem; margin: 0 auto; padding: 1.2rem 1.1rem 4rem; }
.am-hero { text-align: center; }
.am-chips { margin: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: .45rem; }
.am-chip { display: inline-flex; align-items: center; gap: .45rem; padding: .42rem .85rem; border-radius: 99px;
  border: 1.5px solid rgba(159,240,192,.4); background: rgba(159,240,192,.07); color: #c3f8da; font: 600 .84rem/1.25 ${ROUND}; }
.am-count { border-color: rgba(0,237,100,.5); background: rgba(0,237,100,.1); color: #b8f5cf; }
.am-count i { flex: none; width: .5rem; height: .5rem; border-radius: 50%; background: var(--green); animation: am-ping 2s infinite; }
.am-title { margin: .9rem 0 0; font: 700 clamp(2.5rem, 12vw, 3.8rem)/1.04 ${ROUND}; letter-spacing: -.01em; color: #fff; text-wrap: balance; }
.am-title-name { display: inline-block; padding-bottom: .06em; background: linear-gradient(100deg, #00ed64, #9ff0c0 55%, #ff8fab);
  -webkit-background-clip: text; background-clip: text; color: transparent; }
.am-sub { margin: .8rem auto 0; max-width: 29rem; font-size: 1.05rem; line-height: 1.6; color: var(--soft); }

.am-sec { margin-top: 1.5rem; scroll-margin-top: .8rem; }
.am-con { border-radius: 16px; overflow: hidden; background: var(--deep); border: 1.5px solid var(--line);
  box-shadow: 0 24px 60px -28px rgba(0,0,0,.85), 0 0 0 5px rgba(0,237,100,.04); }
.am-con-bar { display: flex; align-items: center; gap: .4rem; min-height: 2.6rem; padding: .3rem .5rem .3rem .85rem; background: #052733; border-bottom: 1px solid var(--line); }
.am-con-bar i { flex: none; width: .62rem; height: .62rem; border-radius: 50%; background: #ff6b6b; }
.am-con-bar i:nth-child(2) { background: #ffd36b; }
.am-con-bar i:nth-child(3) { background: #00ed64; }
.am-con-title { flex: 1; min-width: 0; margin-left: .45rem; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font: 500 .76rem ${MONO}; color: var(--dim); }
.am-con-skip { flex: none; min-height: 2rem; padding: .2rem .75rem; border-radius: 99px; border: 1px solid #1f5563; background: rgba(255,255,255,.04);
  color: var(--soft); font: 700 .76rem 'Nunito', system-ui, sans-serif; cursor: pointer; }
.am-con-skip:hover { color: #fff; border-color: rgba(0,237,100,.5); }
.am-con-body { height: clamp(13rem, 34vh, 21rem); overflow-y: auto; overscroll-behavior: contain; padding: .8rem .95rem 1rem; font: 500 .8rem/1.6 ${MONO}; color: var(--text); }
.am-con.is-busy .am-con-body { cursor: pointer; }
.am-l { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.am-l-cmd { margin-top: .45rem; color: #f2f7f5; }
.am-l-cmd:first-child { margin-top: 0; }
.am-l-info { color: var(--dim); }
.am-l-err { color: #ff8f8f; }
.am-pr { margin-right: .6ch; color: var(--green); font-weight: 700; }
.am-t-s { color: #7ee2a8; } .am-t-n { color: #f5c26b; } .am-t-o { color: #c9bbff; } .am-t-k { color: #cfe3dc; }
.am-caret { display: inline-block; width: .55em; height: 1.05em; margin-left: 2px; vertical-align: -.17em; background: var(--green); animation: am-blink 1s steps(1) infinite; }

.am-chat { margin-top: 1.1rem; padding: 1rem 1rem 1.15rem; border-radius: 20px; background: var(--panel); border: 1.5px solid var(--line); scroll-margin-top: .8rem; }
.am-who { display: flex; align-items: center; gap: .7rem; }
.am-leafy { flex: none; width: 3rem; height: 3rem; filter: drop-shadow(0 4px 10px rgba(0,237,100,.28)); transform-origin: 50% 100%; }
.am-leafy.hop { animation: am-hop .7s cubic-bezier(.3,1.6,.5,1); }
.am-who-n { margin: 0; font: 700 1.08rem/1.2 ${ROUND}; color: #fff; }
.am-who-r { margin: .15rem 0 0; font: 600 .76rem/1.35 ${MONO}; color: #9ff0c0; }
.am-bubble { margin: .8rem 0 0; padding: .8rem .95rem; border-radius: 4px 16px 16px 16px; background: #0d3a47; color: var(--text); font-size: 1.02rem; line-height: 1.55; animation: am-in .4s ease both; }
.am-react { border: 1px solid rgba(0,237,100,.38); background: rgba(0,237,100,.11); color: #e2faee; }
.am-react.err { border-color: rgba(255,143,171,.45); background: rgba(255,143,171,.11); color: #ffe6ec; }
.am-opts { list-style: none; margin: .9rem 0 0; padding: 0; display: grid; gap: .5rem; }
.am-opt { width: 100%; display: flex; align-items: flex-start; gap: .65rem; padding: .7rem .8rem; border-radius: 12px; border: 1.5px solid #1b4b57; background: var(--deep);
  color: var(--text); text-align: left; cursor: pointer; transition: border-color .2s, background .2s, transform .15s, opacity .2s; }
.am-opt code { font: 500 .8rem/1.55 ${MONO}; white-space: pre-wrap; overflow-wrap: anywhere; }
.am-opt-run { flex: none; display: grid; place-items: center; width: 1.45rem; height: 1.45rem; margin-top: .05rem; border-radius: 50%; background: rgba(0,237,100,.15); color: var(--green); font-size: .6rem; }
.am-opt:hover:not(:disabled):not([aria-disabled="true"]) { border-color: rgba(0,237,100,.6); background: #01232f; }
.am-opt:active:not(:disabled):not([aria-disabled="true"]) { transform: scale(.99); }
.am-opt.on { border-color: var(--green); background: rgba(0,237,100,.08); }
.am-opt.on .am-opt-run { background: var(--green); color: #001e2b; }
.am-opt:disabled { opacity: .42; cursor: default; }
.am-opt[aria-disabled="true"] { cursor: default; }
.am-primary { margin-top: .9rem; display: inline-flex; align-items: center; justify-content: center; gap: .45rem; min-height: 2.9rem; padding: .55rem 1.35rem; border: 0; border-radius: 99px;
  background: var(--green); color: #001e2b; font: 700 1.02rem/1 ${ROUND}; cursor: pointer; box-shadow: 0 10px 26px -10px rgba(0,237,100,.75); transition: transform .15s, filter .2s; animation: am-in .4s ease both; }
.am-primary:hover { filter: brightness(1.07); }
.am-primary:active { transform: scale(.98); }
.am-dots { display: inline-flex; gap: .3rem; padding: .25rem 0; }
.am-dots i { width: .45rem; height: .45rem; border-radius: 50%; background: #9ff0c0; animation: am-dot 1.2s ease-in-out infinite; }
.am-dots i:nth-child(2) { animation-delay: .15s; }
.am-dots i:nth-child(3) { animation-delay: .3s; }

.am-letter { position: relative; margin-top: 1.6rem; border-radius: 22px; overflow: hidden; background: #fffaf1; color: #1f2a28; scroll-margin-top: .8rem;
  box-shadow: 0 30px 80px -30px rgba(0,237,100,.45); animation: am-pop .8s cubic-bezier(.2,.9,.3,1.2) both; }
.am-letter:focus, .am-final:focus { outline: none; }
.am-letter:focus-visible, .am-final:focus-visible { outline: 3px solid var(--green); outline-offset: 4px; }
.am-letter-band { display: flex; align-items: center; gap: .55rem; padding: .65rem 1.1rem; background: #00684a; color: #fff; font: 700 .84rem/1 ${ROUND}; letter-spacing: .14em; text-transform: uppercase; }
.am-letter-leaf { flex: none; width: 1.9rem; height: 1.9rem; }
.am-letter-body { position: relative; padding: 1.35rem 1.25rem 1.4rem; }
.am-stamp { position: absolute; top: 1.05rem; right: .95rem; padding: .32rem .6rem; border: 3px solid #d63a6c; border-radius: 10px; background: rgba(255,143,171,.1);
  color: #c22d5e; font: 700 .82rem/1 ${ROUND}; letter-spacing: .1em; text-transform: uppercase; transform: rotate(9deg); animation: am-stamp .6s cubic-bezier(.3,1.6,.5,1) .55s both; }
.am-letter.is-signed .am-stamp { animation-name: am-stamp-again; animation-delay: 0s; }
.am-letter-t { margin: 0; padding-right: 6.4rem; font: 700 clamp(1.4rem, 6vw, 2.15rem)/1.1 ${ROUND}; color: #12201d; }
.am-letter-i { margin: .6rem 0 0; font-size: .98rem; line-height: 1.55; color: #4a5a55; }
.am-letter-rows { margin: 1.1rem 0 0; border-top: 1px dashed #d8d2c4; }
.am-letter-rows > div { display: grid; grid-template-columns: 6.2rem 1fr; gap: .8rem; padding: .62rem 0; border-bottom: 1px dashed #d8d2c4; }
.am-letter-rows dt { padding-top: .14rem; font: 800 .7rem/1.5 'Nunito', system-ui, sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #5b6b66; }
.am-letter-rows dd { margin: 0; font-size: .99rem; font-weight: 600; line-height: 1.45; color: #1f2a28; }
.am-letter-note { margin: 1.05rem 0 0; padding: .75rem .9rem; border-radius: 12px; background: #fff0f4; color: #8a2448; font-weight: 700; line-height: 1.5; }
.am-letter-sign { margin: 1rem 0 0; text-align: right; font: 700 1.4rem/1.1 'Gaegu', 'Nunito', system-ui, sans-serif; color: #00684a; }
.am-accept { width: 100%; margin-top: 1.1rem; }
.am-accepted { margin: 1.1rem 0 0; text-align: center; font: 700 1.08rem ${ROUND}; color: #00684a; }

.am-final { margin-top: 1.6rem; padding: 1.9rem 1.35rem 1.8rem; border-radius: 24px; text-align: center; scroll-margin-top: .8rem;
  background: radial-gradient(120% 90% at 50% 0%, #00684a 0%, #023430 72%); color: #e9fbf1;
  box-shadow: 0 30px 80px -30px rgba(0,237,100,.5); animation: am-pop .8s cubic-bezier(.2,.9,.3,1.2) both; }
.am-final-k { margin: 0; font: 700 .78rem/1 ${ROUND}; letter-spacing: .2em; text-transform: uppercase; color: #d2fbe3; }
.am-final-t { margin: .6rem 0 .8rem; font: 700 clamp(2rem, 9vw, 2.7rem)/1.06 ${ROUND}; color: #fff; }
.am-final-name { color: #ffd1dc; }
.am-final-p { margin: .7rem auto 0; max-width: 27rem; font-size: 1.06rem; line-height: 1.7; color: #d6f3e4; }
.am-final-c { margin: 1.3rem 0 0; font: 600 1.28rem/1.35 ${ROUND}; color: #00ed64; }
.am-final-s { margin: 1.15rem 0 0; display: grid; gap: .12rem; font: 700 1.35rem/1.15 'Gaegu', 'Nunito', system-ui, sans-serif; color: #ffd1dc; }
.am-final-s span:last-child { font-size: 1.75rem; color: #ffb3c7; }

.am-end { margin-top: 2.4rem; display: grid; justify-items: center; gap: .85rem; text-align: center; }
.am-ghost { display: inline-flex; align-items: center; gap: .45rem; min-height: 2.7rem; padding: .45rem 1.15rem; border-radius: 99px;
  border: 1.5px solid rgba(255,255,255,.2); background: rgba(255,255,255,.04); color: var(--text); font: 600 .96rem ${ROUND}; cursor: pointer; }
.am-ghost:hover { background: rgba(255,255,255,.09); }
.am-end-note { margin: 0; font-size: .84rem; color: var(--dim); }

.am-closed { display: grid; place-items: center; padding: 1.5rem; }
.am-closed-card { max-width: 22rem; display: grid; justify-items: center; gap: 1rem; text-align: center; }
.am-closed-leaf { width: 4.5rem; height: 4.5rem; animation: am-float 4s ease-in-out infinite; }
.am-closed-t { margin: 0; font: 600 1.15rem/1.45 ${ROUND}; color: var(--soft); }

.am-confetti { position: fixed; inset: 0; z-index: 50; overflow: hidden; pointer-events: none; }
.am-bit { position: absolute; top: -2rem; animation: am-fall var(--d, 3s) cubic-bezier(.25,.6,.4,1) both; will-change: transform; }
.am-bit.leaf { width: .7rem; height: .7rem; border-radius: 0 80% 0 80%; }
.am-bit.heart, .am-bit.spark { font-size: 1rem; line-height: 1; }

@keyframes am-blink { 50% { opacity: 0 } }
@keyframes am-ping { 0% { box-shadow: 0 0 0 0 rgba(0,237,100,.55) } 80%, 100% { box-shadow: 0 0 0 8px rgba(0,237,100,0) } }
@keyframes am-in { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes am-pop { from { opacity: 0; transform: translateY(26px) scale(.97) } to { opacity: 1; transform: none } }
@keyframes am-hop { 0% { transform: translateY(0) } 35% { transform: translateY(-9px) scale(1.04, .96) } 70% { transform: translateY(0) scale(.97, 1.03) } 100% { transform: none } }
@keyframes am-dot { 0%, 100% { transform: translateY(0); opacity: .5 } 50% { transform: translateY(-4px); opacity: 1 } }
@keyframes am-stamp { from { opacity: 0; transform: rotate(9deg) scale(1.8) } to { opacity: 1; transform: rotate(9deg) scale(1) } }
@keyframes am-stamp-again { from { opacity: .4; transform: rotate(-4deg) scale(1.6) } to { opacity: 1; transform: rotate(9deg) scale(1) } }
@keyframes am-float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
@keyframes am-fall { from { transform: translate3d(0, 0, 0) rotate(0deg) } to { transform: translate3d(var(--x), 112vh, 0) rotate(var(--r)) } }

@media (prefers-reduced-motion: reduce) {
  .am-root *, .am-root *::before, .am-root *::after { animation: none !important; transition: none !important; }
  .am-confetti { display: none; }
}
`
