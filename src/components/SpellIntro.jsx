import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'

// The Marauder's Map phrase reveals what was hidden, and Alohomora opens what
// was locked — between them they say "this page is about to open" without a
// word of explanation.
const WHISPER = 'I solemnly swear that I am up to no good'
const INCANTATION = 'Alohomora'
const LETTERS = INCANTATION.split('')

// Timing. The wand traces a letter at a time, rests a beat on the finished
// word, then the charm breaks and the light washes the screen away.
const LETTER_MS = 165
const WHISPER_IN_MS = 450
const TRACE_START_MS = 1900
const TRACE_END_MS = TRACE_START_MS + LETTERS.length * LETTER_MS
const BURST_MS = TRACE_END_MS + 700
const EXIT_MS = BURST_MS + 300
const FADE_MS = 950
// Let an impatient visitor out, but not before the first letter has landed.
const SKIP_ENABLED_MS = 900

const prefersReducedMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

export default function SpellIntro() {
  // Decide synchronously on first render so the opaque backdrop paints
  // immediately — no flash of the site before the intro appears.
  const shouldShow = () => {
    try {
      const forceShow = /(?:[?&]intro=1)|(?:#intro)/.test(window.location.search + window.location.hash)
      if (forceShow) return true
      return !sessionStorage.getItem('spell_intro_seen')
    } catch { return true }
  }

  const [show, setShow]         = useState(shouldShow)
  const [tick, setTick]         = useState(-1)
  const [whisper, setWhisper]   = useState(false)
  const [burst, setBurst]       = useState(false)
  const [exiting, setExiting]   = useState(false)
  const [wand, setWand]         = useState(null)
  const [sparks, setSparks]     = useState([])

  const canExitRef  = useRef(false)
  const doneRef     = useRef(false)
  const letterRefs  = useRef([])
  const sparkIdRef  = useRef(0)
  const sparkTimersRef = useRef([])
  const calmRef     = useRef(false)

  if (calmRef.current === false) calmRef.current = prefersReducedMotion()
  const calm = calmRef.current

  const exit = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setExiting(true)
    setTimeout(() => {
      setShow(false)
      try { sessionStorage.setItem('spell_intro_seen', '1') } catch {}
    }, FADE_MS)
  }, [])

  useEffect(() => {
    if (!show) return

    // Lock scroll while the intro is up
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // A calm visitor gets the same beats, just without the long dwell.
    const scale = calm ? 0.35 : 1
    const at = (ms, fn) => setTimeout(fn, ms * scale)

    const timers = [
      at(WHISPER_IN_MS, () => setWhisper(true)),
      ...LETTERS.map((_, i) => at(TRACE_START_MS + i * LETTER_MS, () => setTick(i))),
      at(BURST_MS, () => setBurst(true)),
      at(EXIT_MS, () => exit()),
      setTimeout(() => { canExitRef.current = true }, SKIP_ENABLED_MS * scale),
    ]

    return () => {
      document.body.style.overflow = prevOverflow
      timers.forEach(clearTimeout)
    }
  }, [show, exit, calm])

  // Park the wand light at the trailing edge of the newest letter. Measuring
  // on every tick rather than once means a late webfont swap can't leave the
  // light stranded mid-word.
  useLayoutEffect(() => {
    if (tick < 0) return
    const el = letterRefs.current[tick]
    if (!el) return
    const x = el.offsetLeft + el.offsetWidth
    const y = el.offsetTop + el.offsetHeight * 0.52
    setWand({ x, y })

    if (calm) return
    // Throw a few sparks off the tip each time it finishes a letter.
    const born = Array.from({ length: 5 }, () => {
      const angle = Math.random() * Math.PI * 2
      const dist = 18 + Math.random() * 46
      return {
        id: sparkIdRef.current++,
        x,
        y,
        dx: `${Math.cos(angle) * dist}px`,
        // Bias downward so they fall like embers rather than float off.
        dy: `${Math.sin(angle) * dist * 0.6 + 26}px`,
        dur: 620 + Math.random() * 520,
        size: 1.5 + Math.random() * 2,
      }
    })
    setSparks(s => [...s, ...born])
    const t = setTimeout(() => {
      const ids = new Set(born.map(b => b.id))
      setSparks(s => s.filter(p => !ids.has(p.id)))
    }, 1200)
    // Deliberately not cleared on tick change: this effect re-runs on every
    // letter, and cancelling here would kill the previous batch's reaper and
    // leave dead sparks in the tree. Unmount clears them all instead.
    sparkTimersRef.current.push(t)
  }, [tick, calm])

  useEffect(() => () => sparkTimersRef.current.forEach(clearTimeout), [])

  useEffect(() => {
    const onKey = () => { if (canExitRef.current) exit() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exit])

  if (!show) return null

  return (
    <div
      onClick={() => { if (canExitRef.current) exit() }}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        background: 'radial-gradient(ellipse 120% 120% at 50% 38%, #17130e 0%, #0d0b09 55%, #070606 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
        opacity: exiting ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease`,
        cursor: 'default',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes si-breathe {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.5; transform: translate(-50%, -50%) scale(1.12); }
        }
        @keyframes si-tip {
          0%, 100% { opacity: 0.85; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 1;    transform: translate(-50%, -50%) scale(1.25); }
        }
        @keyframes si-spark {
          0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) scale(0.25); }
        }
        @keyframes si-mote {
          0%   { opacity: 0; transform: translateY(12px); }
          35%  { opacity: 0.55; }
          100% { opacity: 0; transform: translateY(-72px); }
        }
        @keyframes si-burst {
          0%   { opacity: 0;    transform: translate(-50%, -50%) scale(0.2); }
          35%  { opacity: 0.95; }
          100% { opacity: 0;    transform: translate(-50%, -50%) scale(3.4); }
        }
        @keyframes si-progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .si-anim { animation: none !important; }
        }
      `}</style>

      {/* Warm candlelight pooled behind the word */}
      <div aria-hidden="true" className="si-anim" style={{
        position: 'absolute', top: '46%', left: '50%',
        width: 'min(78vw, 660px)', height: 'min(78vw, 660px)',
        pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(214,160,74,0.16), transparent 70%)',
        filter: 'blur(10px)',
        animation: 'si-breathe 8s ease-in-out infinite',
      }} />

      {/* Drifting motes of dust in the candlelight */}
      {!calm && Array.from({ length: 14 }).map((_, i) => (
        <div key={i} aria-hidden="true" className="si-anim" style={{
          position: 'absolute',
          left: `${8 + (i * 6.3) % 84}%`,
          top: `${34 + (i * 11) % 40}%`,
          width: 2, height: 2, borderRadius: '50%',
          background: 'rgba(240,206,140,0.75)',
          pointerEvents: 'none',
          animation: `si-mote ${7 + (i % 5)}s ease-in-out ${i * 0.55}s infinite`,
        }} />
      ))}

      {/* Vignette to settle the edges */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.62) 100%)',
      }} />

      <div style={{ textAlign: 'center', position: 'relative', maxWidth: '100%' }}>

        {/* The whisper, before the wand is even raised */}
        <p style={{
          fontFamily: "'Newsreader', Georgia, 'Times New Roman', serif",
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: 'clamp(0.68rem, 2.6vw, 0.95rem)',
          color: 'rgba(238,226,203,0.42)',
          letterSpacing: '0.08em',
          lineHeight: 1.6,
          maxWidth: '30ch',
          margin: '0 auto 1.6rem',
          opacity: whisper ? 1 : 0,
          filter: whisper ? 'blur(0)' : 'blur(5px)',
          transform: whisper ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 1.4s ease, transform 1.4s ease, filter 1.4s ease',
        }}>
          {WHISPER}
        </p>

        {/* The incantation, traced letter by letter */}
        <div style={{ position: 'relative', display: 'inline-block', padding: '0 0.35em' }}>
          <h1 style={{
            fontFamily: "'Cinzel', 'Newsreader', Georgia, serif",
            fontWeight: 600,
            fontSize: 'clamp(1.9rem, 10.5vw, 4.6rem)',
            letterSpacing: 'clamp(0.02em, 0.6vw, 0.07em)',
            lineHeight: 1.25,
            margin: 0,
            whiteSpace: 'nowrap',
            color: 'rgb(255, 208, 130)',
          }}>
            {LETTERS.map((ch, i) => {
              const lit = tick >= i
              return (
                <span
                  key={i}
                  ref={el => { letterRefs.current[i] = el }}
                  style={{
                    display: 'inline-block',
                    opacity: lit ? 1 : 0,
                    transform: lit ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.94)',
                    filter: lit ? 'blur(0)' : 'blur(8px)',
                    transition: 'opacity 620ms ease, transform 620ms ease, filter 620ms ease, text-shadow 700ms ease',
                    textShadow: lit
                      ? (burst
                        ? '0 0 10px rgba(255,238,205,0.98), 0 0 34px rgba(255,190,96,0.9), 0 0 76px rgba(255,150,45,0.6)'
                        : '0 0 8px rgba(255,226,175,0.7), 0 0 24px rgba(255,178,80,0.5), 0 0 54px rgba(230,140,40,0.3)')
                      : 'none',
                  }}
                >
                  {ch}
                </span>
              )
            })}
          </h1>

          {/* The wand tip, riding the end of what's been written */}
          {wand && !burst && (
            <div aria-hidden="true" className="si-anim" style={{
              position: 'absolute',
              left: wand.x, top: wand.y,
              width: 9, height: 9, borderRadius: '50%',
              pointerEvents: 'none',
              background: 'radial-gradient(circle, #fff8e7 0%, #ffd489 45%, rgba(255,168,60,0) 72%)',
              boxShadow: '0 0 12px rgba(255,224,160,0.95), 0 0 30px rgba(255,168,60,0.7)',
              animation: 'si-tip 900ms ease-in-out infinite',
            }} />
          )}

          {/* Embers thrown off as each letter finishes */}
          {sparks.map(p => (
            <div key={p.id} aria-hidden="true" style={{
              position: 'absolute',
              left: p.x, top: p.y,
              width: p.size, height: p.size, borderRadius: '50%',
              pointerEvents: 'none',
              background: 'rgba(255,214,150,0.95)',
              boxShadow: '0 0 6px rgba(255,190,110,0.9)',
              '--dx': p.dx,
              '--dy': p.dy,
              animation: `si-spark ${p.dur}ms ease-out forwards`,
            }} />
          ))}
        </div>
      </div>

      {/* The charm breaking — light floods out and takes the screen with it */}
      {burst && (
        <div aria-hidden="true" className="si-anim" style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 'min(80vw, 620px)', height: 'min(80vw, 620px)',
          borderRadius: '50%',
          pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(255,246,225,0.95) 0%, rgba(255,196,110,0.55) 35%, rgba(255,160,60,0) 70%)',
          animation: 'si-burst 900ms ease-out forwards',
        }} />
      )}

      {/* Pacing hairline */}
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: '2.6rem', left: '50%', transform: 'translateX(-50%)',
        width: '150px', height: '1px',
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
        opacity: burst ? 0 : 0.9,
        transition: 'opacity 600ms ease',
      }}>
        <div className="si-anim" style={{
          width: '100%', height: '100%',
          transformOrigin: 'left',
          background: 'linear-gradient(to right, transparent, rgba(240,190,110,0.65))',
          animation: `si-progress ${EXIT_MS * (calm ? 0.35 : 1)}ms linear forwards`,
        }} />
      </div>
    </div>
  )
}
