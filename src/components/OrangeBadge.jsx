import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// #/orangebadge — Amrutha’s five-year Amaversary at Amazon.
//
// Unlisted and not in the nav, like her other pages: shared directly by link.
// She taps her Day 1 blue badge on a reader, it flips to the orange five-year
// badge, and the rest of the page opens: the struggle, two doors, the numbers,
// five years in five lines, a few Leadership Principles to flip, and a note.
//
// Counts use local calendar days, so they are right wherever she opens it.

const NAME = 'Amrutha'
const JOINED = [2021, 10, 15] // 15 November 2021, a Monday (months are 0-based)

// re:Invent start dates (Las Vegas, late November or early December).
const REINVENT = ['2021-11-29', '2022-11-28', '2023-11-27', '2024-12-02', '2025-12-01', '2026-11-30']

const LINES = [
  'The escalation that lands at 11 pm and needs an answer by 11:05.',
  'The Sev-2 that wasn’t yours, right up until it was.',
  'The doc you rewrote four times, then watched a whole room read in silence.',
  'Customers who need you now, in whatever time zone ‘now’ happens to be.',
  'Sixteen Leadership Principles, and a reason to need every one of them before lunch.',
]

const NOPE = [
  'Nice try. In five years, you never once took this door.',
  'Still no. You’ve walked straight past it {days} times.',
  'It’s been locked from your side since 2021.',
]

const YEARS = [
  ['Year one', 'Nov 2021 – Nov 2022', 'A blue badge, a new laptop and four hundred acronyms to learn by Friday.'],
  ['Year two', 'Nov 2022 – Nov 2023', 'A guy in Hyderabad started sending you ‘work questions’. (Mostly work questions.)'],
  ['Year three', 'Nov 2023 – Nov 2024', 'You stopped asking ‘Can I?’ and started saying ‘I’ve got it.’'],
  ['Year four', 'Nov 2024 – Nov 2025', 'People started asking for you by name.'],
  ['Year five', 'Nov 2025 – Nov 2026', 'A Tech Summit stage, a talk with your name on it, and an orange badge.'],
]

const LPS = [
  ['Customer Obsession', 'Your customers get the version of you that never logs off. (Please log off sometimes.)'],
  ['Ownership', '‘That’s not my team’ has never once come out of your mouth.'],
  ['Dive Deep', 'You don’t stop at the dashboard. You read the logs.'],
  ['Have Backbone; Disagree and Commit', 'You’ll say the hard thing in the room, then make it work outside it.'],
  ['Learn and Be Curious', 'Five years in, and still the first to try the new thing.'],
  ['Deliver Results', 'Whatever the week threw at you, you delivered anyway.'],
]

const CONFETTI = Array.from({ length: 36 }, (_, i) => {
  const a = (i / 36) * Math.PI * 2 + (i % 3) * 0.21
  const r = 120 + ((i * 47) % 100)
  return {
    dx: Math.round(Math.cos(a) * r),
    dy: Math.round(Math.sin(a) * r * 0.8 - 50 + ((i * 29) % 50)),
    rot: ((i * 83) % 360) - 180,
    w: 6 + (i % 3) * 3,
    h: 9 + (i % 4) * 3,
    c: ['#ff9900', '#ffb547', '#ffd59a', '#f08300', '#ffffff', '#2b8cf0'][i % 6],
    delay: (i % 6) * 22,
  }
})

const DAY_MS = 86400000
const dnum = (y, m, d) => Math.round(Date.UTC(y, m, d) / DAY_MS)
const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return dnum(y, m - 1, d) }
const todayNum = () => { const t = new Date(); return dnum(t.getFullYear(), t.getMonth(), t.getDate()) }
const fmt = (n) => n.toLocaleString('en-GB')
const longDate = (n) => new Date(n * DAY_MS).toLocaleDateString('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'long' })
const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const calm = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function useCounts() {
  const [today, setToday] = useState(todayNum)
  useEffect(() => {
    const tick = () => setToday(todayNum())
    const id = setInterval(tick, 60000)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick) }
  }, [])
  return useMemo(() => {
    const start = dnum(...JOINED)
    const days = Math.max(0, today - start)
    // Day numbers count from Thursday 1 January 1970, so (n + 4) % 7 is the weekday.
    const firstMonday = start + ((8 - ((start + 4) % 7)) % 7)
    const mondays = today < firstMonday ? 0 : Math.floor((today - firstMonday) / 7) + 1
    const starts = REINVENT.map(fromIso)
    const reinvents = starts.filter((n) => n >= start && n <= today).length
    const next = starts.find((n) => n > today)
    return { today, days, dayOf: days + 1, mondays, reinvents, next }
  }, [today])
}

// A badge reader's two short beeps. The context is created inside the tap so
// browsers allow it to play; the tones are scheduled for when the badge lands.
function beep(delay) {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return
  try {
    const ctx = new AC()
    const t0 = ctx.currentTime + delay
    for (const [at, hz] of [[0, 1320], [0.12, 1760]]) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = hz
      gain.gain.setValueAtTime(0.0001, t0 + at)
      gain.gain.exponentialRampToValueAtTime(0.05, t0 + at + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + at + 0.09)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t0 + at)
      osc.stop(t0 + at + 0.1)
    }
    setTimeout(() => { try { ctx.close() } catch { /* already closed */ } }, (delay + 0.6) * 1000)
  } catch { /* sound is only a nicety */ }
}

function useInView(ref) {
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || seen) return undefined
    if (!('IntersectionObserver' in window)) { setSeen(true); return undefined }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect() }
    }, { rootMargin: '0px 0px -12% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, seen])
  return seen
}

function useCountUp(target, run) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!run) return undefined
    if (calm()) { setV(target); return undefined }
    let raf
    let t0
    const step = (t) => {
      if (t0 === undefined) t0 = t
      const p = Math.min(1, (t - t0) / 1200)
      setV(Math.round(target * (1 - (1 - p) ** 3)))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, run])
  return v
}

function Badge({ orange }) {
  return (
    <div
      className="ob-badge"
      role="img"
      aria-label={orange ? `${NAME}’s orange five-year Amazon badge` : `${NAME}’s blue Amazon badge from Day 1, 15 November 2021`}
    >
      <div className="ob-card">
        <div className="ob-face is-blue" aria-hidden="true">
          <span className="ob-slot" />
          <div className="ob-inner">
            <span className="ob-org">AMAZONIAN</span>
            <span className="ob-photo">A</span>
            <span className="ob-name">{NAME}</span>
            <span className="ob-meta">Day 1 · 15 Nov 2021</span>
            <span className="ob-code" />
            <span className="ob-tag">BLUE BADGE</span>
          </div>
        </div>
        <div className="ob-face is-orange" aria-hidden="true">
          <span className="ob-slot" />
          <div className="ob-inner">
            <span className="ob-org">AMAZONIAN</span>
            <span className="ob-photo">A</span>
            <span className="ob-name">{NAME}</span>
            <span className="ob-ribbon">5 YEARS</span>
            <span className="ob-meta">Amaversary · 15 Nov 2026</span>
            <span className="ob-code" />
            <span className="ob-tag">ORANGE BADGE</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Confetti() {
  return (
    <div className="ob-confetti" aria-hidden="true">
      {CONFETTI.map((p, i) => (
        <i
          key={i}
          style={{ '--dx': `${p.dx}px`, '--dy': `${p.dy}px`, '--rot': `${p.rot}deg`, width: p.w, height: p.h, background: p.c, animationDelay: `${p.delay}ms` }}
        />
      ))}
    </div>
  )
}

function Head({ id, eyebrow, title, lead }) {
  return (
    <div className="ob-head" data-reveal>
      <p className="ob-eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {lead && <p className="ob-sub">{lead}</p>}
    </div>
  )
}

function Struggle() {
  return (
    <section className="ob-sec ob-struggle" id="ob-struggle" aria-labelledby="ob-struggle-title">
      <p className="ob-eyebrow" data-reveal>Let’s be honest</p>
      <h2 id="ob-struggle-title" data-reveal>We all know the struggle.</h2>
      <ul className="ob-montage">
        {LINES.map((t, i) => <li key={t} data-reveal style={{ '--d': i % 2 }}>{t}</li>)}
      </ul>
      <p className="ob-big" data-reveal>It’s difficult. Nobody there pretends it isn’t.</p>
      <p className="ob-hard" data-reveal>Yet you chose the hard.</p>
      <p className="ob-small" data-reveal>Not once. Every day, for five years.</p>
    </section>
  )
}

function Doors({ days }) {
  const [open, setOpen] = useState(false)
  const [nope, setNope] = useState(-1)
  const tryEasy = () => setNope((n) => n + 1)
  return (
    <section className="ob-sec" aria-labelledby="ob-doors-title">
      <Head id="ob-doors-title" eyebrow="Every morning" title="Two doors." lead="One of them is easy. Open the one you always open." />
      <div className="ob-doors" data-reveal>
        <button
          type="button"
          className={`ob-door is-easy${nope >= 0 ? ` is-nope-${nope % 2}` : ''}`}
          onClick={tryEasy}
          aria-describedby="ob-door-note"
        >
          <span className="ob-leaf">
            <span className="ob-dtitle">The easy way</span>
            <span className="ob-dnote">Coast a little. Nobody would blame you.</span>
            <span className="ob-knob" aria-hidden="true" />
          </span>
        </button>
        <button
          type="button"
          className={`ob-door is-hard${open ? ' is-open' : ''}`}
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="ob-choice"
        >
          <span className="ob-light" aria-hidden="true">Day 1</span>
          <span className="ob-leaf">
            <span className="ob-dtitle">The hard way</span>
            <span className="ob-dnote">Own it. Dive deep. Deliver.</span>
            <span className="ob-knob" aria-hidden="true" />
          </span>
        </button>
      </div>
      <p id="ob-door-note" className="ob-nope" aria-live="polite">
        {nope >= 0 ? NOPE[nope % NOPE.length].replace('{days}', fmt(days)) : ''}
      </p>
      <div id="ob-choice" className="ob-choice" aria-live="polite">
        {open && (
          <>
            <p className="ob-choice-big">You chose the hard.</p>
            <p>Same door, every morning, for {fmt(days)} days.</p>
            <p className="ob-choice-small">Amazon would call it a two-way door: you could have walked back out any day. You never did.</p>
          </>
        )}
      </div>
    </section>
  )
}

function Stat({ n, label, line, run, i }) {
  const v = useCountUp(n, run)
  return (
    <li className="ob-stat" data-reveal style={{ '--d': i }}>
      <b aria-hidden="true">{fmt(v)}</b>
      <span className="ob-sr">{fmt(n)}</span>
      <span className="ob-stat-label">{label}</span>
      <small>{line}</small>
    </li>
  )
}

function Numbers({ counts }) {
  const ref = useRef(null)
  const seen = useInView(ref)
  const soon = counts.next !== undefined && counts.next - counts.today <= 45
  const nextLine = soon ? ` Number ${WORDS[counts.reinvents + 1] || counts.reinvents + 1} starts ${longDate(counts.next)}.` : ''
  const items = [
    [counts.days, 'days', 'Every one of them Day 1.'],
    [counts.mondays, 'Mondays', 'Day 1 was one of them. Of course it was.'],
    [counts.reinvents, counts.reinvents === 1 ? 're:Invent' : 're:Invents', `The week AWS launches everything and every customer has a question.${nextLine}`],
    [16, 'Leadership Principles', 'Lived, not memorised.'],
    [1, 'summit stage', 'And you were on it.'],
    [1, 'orange badge', 'Earned. Not given.'],
  ]
  return (
    <section className="ob-sec" aria-labelledby="ob-numbers-title">
      <Head id="ob-numbers-title" eyebrow="Five years, counted" title="By the numbers." />
      <ul className="ob-stats" ref={ref}>
        {items.map(([n, label, line], i) => <Stat key={label} n={n} label={label} line={line} run={seen} i={i} />)}
      </ul>
    </section>
  )
}

function Years() {
  return (
    <section className="ob-sec" aria-labelledby="ob-years-title">
      <Head id="ob-years-title" eyebrow="Five years, five lines" title="How it went." />
      <ol className="ob-years">
        {YEARS.map(([k, when, line], i) => (
          <li
            key={k}
            className="ob-year"
            data-reveal
            style={{ '--dot': `color-mix(in oklab, #2b8cf0 ${100 - i * 25}%, #ff9900)` }}
          >
            <p className="ob-year-k">{k} <span>{when}</span></p>
            <p className="ob-year-line">{line}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Principles() {
  const [on, setOn] = useState(() => new Set())
  const [said, setSaid] = useState('')
  const flip = (i) => {
    const next = new Set(on)
    if (next.has(i)) next.delete(i)
    else { next.add(i); setSaid(`${LPS[i][0]}: ${LPS[i][1]}`) }
    setOn(next)
  }
  const done = on.size === LPS.length
  return (
    <section className="ob-sec" aria-labelledby="ob-lps-title">
      <Head id="ob-lps-title" eyebrow="The principles" title="The way you actually live them." lead="Tap a badge to flip it." />
      <ul className="ob-lps">
        {LPS.map(([name, line], i) => {
          const isOn = on.has(i)
          return (
            <li key={name} data-reveal style={{ '--d': i % 3 }}>
              <button type="button" className={`ob-lp${isOn ? ' is-on' : ''}`} aria-pressed={isOn} onClick={() => flip(i)}>
                <span className="ob-lp-in">
                  <span className="ob-lp-face ob-lp-front" aria-hidden={isOn}>
                    <span className="ob-lp-tag">Leadership Principle</span>
                    <span className="ob-lp-name">{name}</span>
                    <span className="ob-lp-hint">Tap to flip</span>
                  </span>
                  <span className="ob-lp-face ob-lp-back" aria-hidden={!isOn}>
                    <span className="ob-lp-line">{line}</span>
                    <span className="ob-lp-small">{name}</span>
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className={`ob-lp-status${done ? ' is-done' : ''}`} aria-live="polite">
        {done ? 'Six down, ten to go. You’ve got those covered too.' : `${on.size} of ${LPS.length} flipped`}
      </p>
      <p className="ob-sr" aria-live="polite">{said}</p>
    </section>
  )
}

function Letter({ dayOf }) {
  return (
    <section className="ob-sec" aria-labelledby="ob-letter-title">
      <Head id="ob-letter-title" eyebrow="One last thing" title="From me." />
      <article className="ob-letter" data-reveal>
        <p className="ob-to">{NAME},</p>
        <p>I wore the blue badge too, so I won’t pretend any of this was easy. I know the late escalations, the weeks when on-call and life are the same thing, and the docs that get rewritten long after everyone else has logged off.</p>
        <p>I got there eight months before you, and I left with my badge still blue. You stayed. You learnt the place, you owned your corner of it, and you got better every single year, without losing the kindness that makes people want to work with you.</p>
        <p>That’s what the orange badge really means. Not five years served. Five years chosen.</p>
        <p>Somewhere inside a company of more than a million people, I found you there. So I’ll always owe the place one.</p>
        <p>I’m so proud of you. Happy Amaversary.</p>
        <p className="ob-sign">Kiran</p>
      </article>
      <p className="ob-dayline" data-reveal>Today is <b>Day {fmt(dayOf)}</b>. At Amazon, it’s still Day 1.</p>
    </section>
  )
}

export default function OrangeBadge({ onBack }) {
  const counts = useCounts()
  const [phase, setPhase] = useState('blue') // blue → tap → orange
  const [opened, setOpened] = useState(false)
  const [burst, setBurst] = useState(0)
  const timers = useRef([])
  const rootRef = useRef(null)

  useEffect(() => {
    const prev = document.title
    document.title = `Happy Amaversary, ${NAME}`
    const pending = timers.current
    return () => { document.title = prev; pending.forEach(clearTimeout) }
  }, [])

  // Sections rise in as they scroll into view. Without an observer, or with
  // reduced motion, everything simply shows.
  useEffect(() => {
    if (!opened) return undefined
    const els = [...rootRef.current.querySelectorAll('[data-reveal]:not(.is-in)')]
    if (!('IntersectionObserver' in window) || calm()) { els.forEach((el) => el.classList.add('is-in')); return undefined }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
    }, { rootMargin: '0px 0px -10% 0px' })
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [opened])

  const badgeIn = useCallback(() => {
    if (phase === 'tap') return
    timers.current.forEach(clearTimeout)
    timers.current = []
    const later = (fn, ms) => { timers.current.push(setTimeout(fn, ms)) }
    const still = calm()
    const play = (offset) => {
      beep((offset + (still ? 0 : 380)) / 1000)
      if (still) { later(() => { setPhase('orange'); setOpened(true) }, offset); return }
      later(() => setPhase('tap'), offset)
      later(() => { try { navigator.vibrate?.(30) } catch { /* no haptics */ } }, offset + 380)
      later(() => { setPhase('orange'); setBurst((b) => b + 1) }, offset + 640)
      later(() => setOpened(true), offset + 1400)
    }
    if (phase === 'orange') { setPhase('blue'); play(still ? 500 : 800) } else play(0)
  }, [phase])

  const keepGoing = () => {
    document.getElementById('ob-struggle')?.scrollIntoView({ behavior: calm() ? 'instant' : 'smooth', block: 'start' })
  }

  const orange = phase === 'orange'
  return (
    <main ref={rootRef} className={`ob-root is-${phase}`}>
      <style>{CSS}</style>
      <button type="button" className="ob-back" onClick={onBack}>
        <span aria-hidden="true">←</span> Back
      </button>

      <header className="ob-hero">
        <div className="ob-stage">
          <div className="ob-swing">
            <div className="ob-dip">
              <div className="ob-strap" aria-hidden="true"><span>{'DAY 1 · '.repeat(10)}</span></div>
              <div className="ob-clip" aria-hidden="true" />
              <Badge orange={orange} />
            </div>
          </div>
          {burst > 0 && <Confetti key={burst} />}
          <button
            type="button"
            className="ob-reader"
            onClick={badgeIn}
            aria-disabled={phase === 'tap'}
            aria-describedby="ob-hero-copy"
          >
            <span className="ob-pad" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M8.5 8.5a5 5 0 0 1 0 7" /><path d="M12 6a8.5 8.5 0 0 1 0 12" /><path d="M15.5 3.5a12 12 0 0 1 0 17" />
              </svg>
            </span>
            <span className="ob-rtext">
              <b>{orange ? 'Access granted' : phase === 'tap' ? 'Reading…' : 'Tap to badge in'}</b>
              <small>{orange ? 'Tap to badge in again' : 'Hold your badge to the reader'}</small>
            </span>
            <span className="ob-led" aria-hidden="true" />
          </button>
        </div>

        <div className="ob-copy" id="ob-hero-copy" aria-live="polite">
          <p className="ob-eyebrow">{orange ? 'Happy Amaversary · 15 November 2026' : '15 November 2021'}</p>
          <h1 className="ob-title">
            {orange ? <>Blue to <em>orange.</em></> : 'Five years ago, they handed you a blue badge.'}
          </h1>
          <p className="ob-lead">
            {orange
              ? `Five years at Amazon, ${NAME}. Not one of them easy. Every one of them yours.`
              : 'Tap it on the reader. Something’s changed since then.'}
          </p>
          {opened && (
            <button type="button" className="ob-cue" onClick={keepGoing}>
              Keep going <span aria-hidden="true">↓</span>
            </button>
          )}
        </div>
      </header>

      {opened && (
        <div className="ob-main">
          <Struggle />
          <Doors days={counts.days} />
          <Numbers counts={counts} />
          <Years />
          <Principles />
          <Letter dayOf={counts.dayOf} />
          <footer className="ob-foot">kranthikiran.com · unlisted</footer>
        </div>
      )}
    </main>
  )
}

const CSS = `
.ob-root {
  --ob-ink: #eef2f6; --ob-muted: #a9b5c2; --ob-line: rgba(255,255,255,.1);
  --ob-orange: #ff9900; --ob-orange-hi: #ffb547; --ob-orange-ink: #ffc773;
  --bw: 236px; --strap: 120px;
  position: relative; min-height: 100vh; overflow-x: clip; color: var(--ob-ink);
  background:
    radial-gradient(900px 520px at 72% -6%, rgba(43,140,240,.18), transparent 62%),
    linear-gradient(180deg, #0d1319 0%, #111a23 48%, #0d1319 100%);
  font-family: 'Sora', system-ui, -apple-system, sans-serif; font-size: 16px; line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
.ob-root::before {
  content: ''; position: absolute; inset: 0 0 auto; height: 1000px; pointer-events: none;
  background: radial-gradient(900px 560px at 72% -6%, rgba(255,153,0,.24), transparent 62%);
  opacity: 0; transition: opacity 1.4s ease;
}
.ob-root.is-orange::before { opacity: 1; }
.ob-root *, .ob-root *::before, .ob-root *::after { box-sizing: border-box; }
.ob-root :focus-visible { outline: 3px solid var(--ob-orange-ink); outline-offset: 3px; box-shadow: none; }
.ob-root h1, .ob-root h2 { font-family: 'Newsreader', Georgia, serif; font-weight: 500; letter-spacing: -0.02em; margin: 0; color: #fff; }
.ob-root p { margin: 0; }
.ob-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.ob-back {
  position: absolute; top: 18px; left: 18px; z-index: 5; display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px; border-radius: 999px; border: 1px solid var(--ob-line); background: rgba(13,19,25,.6);
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); color: var(--ob-muted); font: 500 13px/1 'Sora', sans-serif; cursor: pointer;
}
.ob-back:hover { color: #fff; border-color: rgba(255,255,255,.25); }

.ob-hero {
  position: relative; max-width: 1100px; margin: 0 auto; padding: 0 32px; min-height: 100vh; min-height: 100svh;
  display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr); gap: 32px; align-items: center;
}
.ob-copy { grid-column: 1; grid-row: 1; padding: 80px 0; max-width: 540px; }
.ob-stage { grid-column: 2; grid-row: 1; align-self: start; position: relative; display: flex; flex-direction: column; align-items: center; padding-bottom: 40px; }
.ob-eyebrow { margin: 0 0 14px !important; font: 600 12px/1.4 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .18em; text-transform: uppercase; color: var(--ob-orange-ink); }
.ob-title { font-size: clamp(36px, 5.4vw, 64px); line-height: 1.04; }
.ob-title em { font-style: italic; font-weight: 400; color: var(--ob-orange); }
.ob-lead { margin-top: 18px !important; font-size: clamp(16px, 1.6vw, 19px); color: #c9d3dd; max-width: 34ch; }
.ob-cue {
  margin-top: 28px; display: inline-flex; align-items: center; gap: 10px; padding: 12px 20px; border: 0; border-radius: 999px;
  background: var(--ob-orange); color: #1b1205; font: 600 14px/1 'Sora', sans-serif; cursor: pointer;
  box-shadow: 0 10px 30px -10px rgba(255,153,0,.6); animation: ob-rise .6s both;
}
.ob-cue:hover { background: var(--ob-orange-hi); }

.ob-swing { display: flex; flex-direction: column; align-items: center; transform-origin: 50% 0; animation: ob-sway 5s ease-in-out infinite alternate; }
.ob-dip { display: flex; flex-direction: column; align-items: center; transition: transform .32s cubic-bezier(.3,.6,.3,1); }
.ob-root.is-tap .ob-dip { transform: translateY(26px); }
.ob-strap {
  width: 28px; height: var(--strap); overflow: hidden; display: flex; justify-content: center;
  background: linear-gradient(90deg, rgba(255,255,255,.07), transparent 35%, transparent 65%, rgba(0,0,0,.3)), #1d2a38;
  border-inline: 1px solid rgba(255,255,255,.06); transition: background-color .8s;
}
.ob-root.is-orange .ob-strap { background-color: #2c2215; }
.ob-strap span { writing-mode: vertical-rl; font: 700 9px/28px 'JetBrains Mono', monospace; letter-spacing: .32em; color: rgba(255,199,115,.55); white-space: nowrap; }
.ob-clip { position: relative; z-index: 2; width: 30px; height: 20px; margin-top: -1px; border-radius: 4px 4px 8px 8px; background: linear-gradient(180deg, #d9dfe5, #8d98a3); box-shadow: inset 0 -2px 0 rgba(0,0,0,.25), 0 2px 4px rgba(0,0,0,.4); }
.ob-badge { position: relative; isolation: isolate; width: var(--bw); aspect-ratio: 236 / 350; margin-top: -8px; perspective: 1100px; }
.ob-badge::before {
  content: ''; position: absolute; inset: -60px; z-index: -1; border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255,153,0,.5), transparent); opacity: 0; transition: opacity 1s .35s;
}
.ob-root.is-orange .ob-badge::before { opacity: 1; }
.ob-card { position: absolute; inset: 0; transform-style: preserve-3d; transition: transform 1s cubic-bezier(.2,.75,.25,1); }
.ob-root.is-orange .ob-card { transform: rotateY(180deg); }
.ob-face {
  position: absolute; inset: 0; border-radius: 22px; -webkit-backface-visibility: hidden; backface-visibility: hidden;
  box-shadow: 0 34px 60px -24px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.4), inset 0 -2px 0 rgba(0,0,0,.18);
}
.ob-face.is-blue { background: linear-gradient(155deg, #4aa3ff 0%, #1f74d6 55%, #175fb3 100%); }
.ob-face.is-orange { background: linear-gradient(155deg, #ffbf4d 0%, #ff9900 50%, #ec7f00 100%); transform: rotateY(180deg); }
.ob-slot { position: absolute; top: 11px; left: 50%; width: 48px; height: 9px; margin-left: -24px; border-radius: 6px; background: rgba(0,0,0,.32); box-shadow: inset 0 1px 2px rgba(0,0,0,.5); }
.ob-inner {
  position: absolute; inset: 30px 12px 12px; border-radius: 14px; background: #fbfcfd; color: #17212b; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; text-align: center; padding: 14px 14px 12px;
}
.ob-org { font: 700 10px/1 'JetBrains Mono', monospace; letter-spacing: .3em; color: #1b5fae; }
.ob-face.is-orange .ob-org { color: #9a4a00; }
.ob-photo {
  margin-top: 14px; width: 86px; height: 86px; border-radius: 50%; display: grid; place-items: center;
  font: 500 42px/1 'Newsreader', Georgia, serif; color: #fff; box-shadow: inset 0 -4px 10px rgba(0,0,0,.18);
  background: radial-gradient(circle at 35% 30%, #74b9ff, #1f6fd1 75%);
}
.ob-face.is-orange .ob-photo { background: radial-gradient(circle at 35% 30%, #ffcf7a, #e57c00 75%); }
.ob-name { margin-top: 12px; font: 700 23px/1.1 'Sora', sans-serif; letter-spacing: -0.015em; }
.ob-meta { margin-top: 6px; font-size: 11.5px; color: #4b5866; }
.ob-ribbon { margin-top: 10px; padding: 4px 12px; border-radius: 999px; background: #ff9900; color: #1b1205; font: 800 12.5px/1.2 'Sora', sans-serif; letter-spacing: .1em; }
.ob-code {
  margin-top: auto; width: 100%; height: 24px; opacity: .8;
  background: repeating-linear-gradient(90deg, #17212b 0 2px, transparent 2px 4px, #17212b 4px 5px, transparent 5px 8px, #17212b 8px 11px, transparent 11px 13px);
}
.ob-tag { margin-top: 7px; font: 700 9px/1 'JetBrains Mono', monospace; letter-spacing: .24em; color: #4b5866; }

.ob-reader {
  position: relative; margin-top: 30px; display: flex; align-items: center; gap: 14px; min-width: 260px;
  padding: 12px 18px 12px 12px; border-radius: 18px; border: 1px solid rgba(255,255,255,.12);
  background: linear-gradient(180deg, #1c2631, #121a22); color: var(--ob-ink); text-align: left; cursor: pointer;
  box-shadow: 0 16px 34px -16px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.06); transition: border-color .3s, transform .2s;
}
.ob-reader:hover { border-color: rgba(255,199,115,.5); }
.ob-reader:active { transform: scale(.98); }
.ob-reader[aria-disabled="true"] { cursor: progress; }
.ob-reader::after { content: ''; position: absolute; inset: -6px; border-radius: 22px; border: 2px solid rgba(255,153,0,.55); opacity: 0; pointer-events: none; }
.ob-root.is-blue .ob-reader::after { animation: ob-ping 2.2s ease-out infinite; }
.ob-pad { flex: none; width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; background: #0b1117; color: #93a3b4; transition: color .6s; }
.ob-root.is-orange .ob-pad { color: var(--ob-orange-ink); }
.ob-pad svg { width: 24px; height: 24px; }
.ob-rtext { display: grid; gap: 3px; flex: 1; }
.ob-rtext b { font-weight: 600; font-size: 15px; }
.ob-rtext small { font-size: 12.5px; color: var(--ob-muted); }
.ob-led { flex: none; width: 10px; height: 10px; border-radius: 50%; background: #f5a524; box-shadow: 0 0 10px rgba(245,165,36,.8); animation: ob-blink 1.4s ease-in-out infinite; }
.ob-root.is-tap .ob-led { animation-duration: .22s; }
.ob-root.is-orange .ob-led { background: #3ddc84; box-shadow: 0 0 12px rgba(61,220,132,.9); animation: none; }

.ob-confetti { position: absolute; left: 50%; top: calc(var(--strap) + 12px + var(--bw) * .74); width: 0; height: 0; z-index: 3; pointer-events: none; }
.ob-confetti i { position: absolute; left: 0; top: 0; border-radius: 2px; opacity: 0; animation: ob-pop 1.7s cubic-bezier(.12,.7,.3,1) forwards; }

.ob-main { position: relative; max-width: 880px; margin: 0 auto; padding: 30px 24px 50px; }
.ob-sec { padding: 72px 0; }
.ob-head { margin-bottom: 30px; }
.ob-head h2 { font-size: clamp(34px, 5vw, 52px); line-height: 1.06; }
.ob-sub { margin-top: 12px !important; color: #c2ccd6; font-size: 17px; max-width: 46ch; }
.ob-root [data-reveal] { opacity: 0; transform: translateY(18px); transition: opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1); transition-delay: calc(var(--d, 0) * 80ms); }
.ob-root [data-reveal].is-in { opacity: 1; transform: none; }

.ob-struggle h2 { font-size: clamp(38px, 6vw, 64px); line-height: 1.04; }
.ob-montage { list-style: none; margin: 34px 0 0; padding: 0; display: grid; gap: 18px; }
.ob-montage li { position: relative; padding-left: 28px; font-family: 'Newsreader', Georgia, serif; font-size: clamp(21px, 2.7vw, 28px); line-height: 1.32; color: #d9e0e7; }
.ob-montage li::before { content: ''; position: absolute; left: 0; top: .66em; width: 14px; height: 2px; border-radius: 2px; background: var(--ob-orange); }
.ob-big { margin-top: 50px !important; font-family: 'Newsreader', Georgia, serif; font-size: clamp(30px, 4.4vw, 46px); line-height: 1.12; color: #fff; }
.ob-hard { margin-top: 22px !important; font-family: 'Newsreader', Georgia, serif; font-style: italic; font-weight: 400; font-size: clamp(46px, 9vw, 96px); line-height: 1; letter-spacing: -0.025em; color: var(--ob-orange); text-wrap: balance; }
.ob-small { margin-top: 18px !important; font-size: 17px; color: var(--ob-muted); }

.ob-doors { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; max-width: 580px; }
.ob-door {
  position: relative; display: block; width: 100%; height: 320px; padding: 0; border: 2px solid rgba(255,255,255,.14);
  border-radius: 18px 18px 8px 8px; background: #090d12; color: inherit; text-align: left; cursor: pointer; perspective: 1100px;
}
.ob-door.is-hard {
  border-color: rgba(255,153,0,.45);
  background: radial-gradient(120% 80% at 50% 60%, rgba(255,170,40,.95), rgba(255,140,0,.4) 45%, rgba(255,120,0,.08) 75%), #120c05;
}
.ob-light { position: absolute; inset: 0; display: grid; place-items: center; font: 700 13px/1 'JetBrains Mono', monospace; letter-spacing: .24em; text-transform: uppercase; color: #2a1600; }
.ob-leaf {
  position: absolute; inset: 7px; border-radius: 12px 12px 5px 5px; display: flex; flex-direction: column; justify-content: flex-end; gap: 6px;
  padding: 20px 18px; transform-origin: 0 50%; transition: transform 1s cubic-bezier(.3,.7,.2,1), box-shadow 1s, filter 1s;
  background: linear-gradient(180deg, #223040, #18222d); box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); backface-visibility: hidden;
}
.ob-door.is-hard .ob-leaf { background: linear-gradient(180deg, #33261a, #20170d); box-shadow: inset 0 0 0 1px rgba(255,153,0,.3); }
.ob-door.is-hard:not(.is-open):hover .ob-leaf { transform: rotateY(9deg); }
.ob-door.is-open .ob-leaf { transform: rotateY(76deg); filter: brightness(.6); box-shadow: inset 0 0 0 1px rgba(255,153,0,.3), inset -30px 0 40px -16px rgba(0,0,0,.6); }
.ob-knob { position: absolute; right: 16px; top: 50%; width: 12px; height: 12px; border-radius: 50%; background: linear-gradient(#e4e9ee, #8f9aa5); }
.ob-dtitle { font-family: 'Newsreader', Georgia, serif; font-size: 25px; line-height: 1.1; color: #fff; }
.ob-dnote { font-size: 13.5px; line-height: 1.45; color: var(--ob-muted); }
.ob-door.is-hard .ob-dnote { color: #ecd1a6; }
.ob-door.is-nope-0 { animation: ob-shake-a .5s; }
.ob-door.is-nope-1 { animation: ob-shake-b .5s; }
.ob-nope { min-height: 1.6em; margin-top: 16px !important; font-size: 15px; color: #ecd1a6; }
.ob-choice { margin-top: 18px; }
.ob-choice > * { animation: ob-rise .7s both; }
.ob-choice > :nth-child(2) { animation-delay: .25s; }
.ob-choice > :nth-child(3) { animation-delay: .5s; }
.ob-choice-big { font-family: 'Newsreader', Georgia, serif; font-style: italic; font-weight: 400; font-size: clamp(36px, 5.4vw, 54px); line-height: 1.05; color: var(--ob-orange); }
.ob-choice p + p { margin-top: 12px; font-size: 17px; color: #d6dee6; max-width: 48ch; }
.ob-choice .ob-choice-small { font-size: 15px; color: var(--ob-muted); }

.ob-stats { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.ob-stat { padding: 20px; border: 1px solid var(--ob-line); border-radius: 18px; background: rgba(255,255,255,.025); }
.ob-stat b { display: block; font: 700 clamp(34px, 5vw, 48px)/1 'Sora', sans-serif; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: var(--ob-orange); }
.ob-stat-label { display: block; margin-top: 8px; font-weight: 600; }
.ob-stat small { display: block; margin-top: 6px; font-size: 13.5px; line-height: 1.45; color: var(--ob-muted); }

.ob-years { list-style: none; margin: 0; padding: 0 0 0 36px; position: relative; display: grid; gap: 30px; }
.ob-years::before { content: ''; position: absolute; left: 8px; top: 8px; bottom: 8px; width: 2px; border-radius: 2px; background: linear-gradient(180deg, #2b8cf0, #ff9900); }
.ob-year { position: relative; }
.ob-year::before { content: ''; position: absolute; left: -36px; top: 2px; width: 18px; height: 18px; border-radius: 50%; background: #0d1319; border: 3px solid var(--dot); }
.ob-year:last-child::before { background: var(--dot); box-shadow: 0 0 0 6px rgba(255,153,0,.18); }
.ob-year-k { display: flex; flex-wrap: wrap; gap: 4px 12px; align-items: baseline; font: 600 12px/1.5 'JetBrains Mono', monospace; letter-spacing: .14em; text-transform: uppercase; color: var(--ob-orange-ink); }
.ob-year-k span { letter-spacing: .06em; color: var(--ob-muted); }
.ob-year-line { margin-top: 8px !important; font-family: 'Newsreader', Georgia, serif; font-size: clamp(20px, 2.6vw, 26px); line-height: 1.32; color: #e3e9ef; }

.ob-lps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.ob-lp { display: block; width: 100%; padding: 0; border: 0; border-radius: 18px; background: none; color: inherit; text-align: left; cursor: pointer; perspective: 1000px; }
.ob-lp-in { display: grid; transform-style: preserve-3d; transition: transform .75s cubic-bezier(.2,.7,.2,1); }
.ob-lp.is-on .ob-lp-in { transform: rotateY(180deg); }
.ob-lp-face {
  grid-area: 1 / 1; min-height: 172px; border-radius: 18px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 14px;
  -webkit-backface-visibility: hidden; backface-visibility: hidden;
}
.ob-lp-front { background: linear-gradient(160deg, #1d2834, #141c25); border: 1px solid rgba(255,255,255,.1); transition: border-color .3s; }
.ob-lp:hover .ob-lp-front { border-color: rgba(255,199,115,.45); }
.ob-lp-back { transform: rotateY(180deg); background: linear-gradient(155deg, #ffbf4d, #ff9900 55%, #f08800); color: #1b1205; }
.ob-lp-tag { font: 600 10.5px/1.3 'JetBrains Mono', monospace; letter-spacing: .16em; text-transform: uppercase; color: var(--ob-orange-ink); }
.ob-lp-name { font-family: 'Newsreader', Georgia, serif; font-size: 22px; line-height: 1.15; color: #fff; }
.ob-lp-hint { font-size: 12.5px; color: var(--ob-muted); }
.ob-lp-line { font-size: 15px; line-height: 1.45; font-weight: 500; }
.ob-lp-small { font: 600 10.5px/1.3 'JetBrains Mono', monospace; letter-spacing: .12em; text-transform: uppercase; color: #5a3200; }
.ob-lp-status { margin-top: 18px !important; font-size: 15px; color: var(--ob-muted); }
.ob-lp-status.is-done { color: var(--ob-orange-ink); font-weight: 600; }

.ob-letter {
  position: relative; overflow: hidden; padding: clamp(26px, 5vw, 52px); border-radius: 24px; background: #fbf5ec; color: #2b2219;
  font-family: 'Newsreader', Georgia, serif; font-size: clamp(18px, 2.1vw, 20.5px); line-height: 1.72; box-shadow: 0 40px 80px -40px rgba(0,0,0,.85);
}
.ob-letter::before { content: ''; position: absolute; inset: 0 0 auto; height: 6px; background: linear-gradient(90deg, #2b8cf0, #ff9900 45%); }
.ob-letter p + p { margin-top: 1em; }
.ob-to { font-style: italic; font-size: 1.15em; }
.ob-sign { margin-top: 1.4em !important; font-style: italic; font-size: 1.5em; color: #9a4a00; }
.ob-dayline { margin-top: 28px !important; text-align: center; font: 500 14px/1.6 'JetBrains Mono', monospace; color: var(--ob-muted); }
.ob-dayline b { font-weight: 600; color: var(--ob-orange-ink); }
.ob-foot { padding: 34px 0 10px; text-align: center; font: 500 12px/1 'JetBrains Mono', monospace; color: #8794a1; }

@keyframes ob-sway { from { transform: rotate(-1.4deg); } to { transform: rotate(1.4deg); } }
@keyframes ob-blink { 50% { opacity: .35; } }
@keyframes ob-ping { 0% { opacity: .9; transform: scale(.96); } 100% { opacity: 0; transform: scale(1.12); } }
@keyframes ob-pop {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(.3) rotate(0); }
  55% { opacity: 1; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); }
  100% { opacity: 0; transform: translate(var(--dx), calc(var(--dy) + 110px)) rotate(calc(var(--rot) * 2)); }
}
@keyframes ob-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes ob-shake-a { 20% { transform: translateX(-9px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(3px); } }
@keyframes ob-shake-b { 20% { transform: translateX(-9px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(3px); } }

@media (max-width: 760px) {
  .ob-root { --bw: 204px; --strap: 64px; }
  .ob-hero { grid-template-columns: minmax(0, 1fr); min-height: auto; padding: 0 20px; gap: 0; }
  .ob-stage { grid-column: 1; grid-row: 1; padding-bottom: 6px; }
  .ob-copy { grid-column: 1; grid-row: 2; padding: 26px 0 48px; margin: 0 auto; text-align: center; }
  .ob-lead { margin-inline: auto; }
  .ob-inner { inset: 28px 10px 10px; padding: 12px 12px 10px; }
  .ob-photo { width: 70px; height: 70px; margin-top: 10px; font-size: 34px; }
  .ob-name { margin-top: 10px; font-size: 20px; }
  .ob-reader { margin-top: 24px; min-width: 0; width: min(100%, 300px); }
  .ob-main { padding: 0 20px 40px; }
  .ob-sec { padding: 56px 0; }
  .ob-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .ob-stat { padding: 16px; }
  .ob-lps { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .ob-door { height: 250px; }
  .ob-leaf { padding: 16px 14px; }
  .ob-dtitle { font-size: 20px; }
}
@media (max-width: 420px) {
  .ob-lps { grid-template-columns: minmax(0, 1fr); }
  .ob-lp-face { min-height: 128px; }
  .ob-stat b { font-size: 30px; }
}
@media (prefers-reduced-motion: reduce) {
  .ob-swing, .ob-led, .ob-root.is-blue .ob-reader::after, .ob-cue, .ob-choice > *, .ob-door.is-nope-0, .ob-door.is-nope-1 { animation: none !important; }
  .ob-confetti { display: none; }
  .ob-card, .ob-dip, .ob-leaf, .ob-lp-in, .ob-root::before, .ob-badge::before { transition: none !important; }
  .ob-root [data-reveal] { opacity: 1; transform: none; transition: none; }
}
`
