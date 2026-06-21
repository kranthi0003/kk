import { useState, useEffect, useCallback, useRef } from 'react'

const QUOTE = 'Who were you before the world told you who you are?'

// Reveal cadence tuned to a comfortable on-screen English reading pace for a
// common Indian reader (~140 wpm → ~430 ms/word) so each word can be read as it
// lands. (ESL on-screen reading averages ~100–160 wpm.)
const WORD_MS = 430

const WORDS = QUOTE.split(' ')
const SLOTS = WORDS.map((text, i) => ({ text, time: i * WORD_MS }))
const LAST_WORD_MS = SLOTS.length * WORD_MS
// A beat after the line lands, the author credit fades in.
const ATTRIBUTION_MS = LAST_WORD_MS + 800
// After the line + credit rest, auto-route into the site.
const HOLD_MS = LAST_WORD_MS + 2900
// Allow an optional click / keypress to skip ahead once the reveal has begun.
const SKIP_ENABLED_MS = 1000

export default function QuoteIntro() {
  const [show, setShow]           = useState(false)
  const [entered, setEntered]     = useState(false)
  const [tick, setTick]           = useState(-1)
  const [showAttrib, setShowAttrib] = useState(false)
  const [exiting, setExiting]     = useState(false)

  const canExitRef = useRef(false)
  const doneRef    = useRef(false)

  const exit = useCallback(() => {
    if (doneRef.current) return
    doneRef.current = true
    setExiting(true)
    setTimeout(() => {
      setShow(false)
      sessionStorage.setItem('quote_intro_seen', '1')
    }, 950)
  }, [])

  useEffect(() => {
    const forceShow = /(?:[?&]intro=1)|(?:#intro)/.test(window.location.search + window.location.hash)
    if (!forceShow && sessionStorage.getItem('quote_intro_seen')) return

    setShow(true)
    const enterTimer = setTimeout(() => setEntered(true), 30)

    // Schedule each word's reveal
    const wordTimers = SLOTS.map((slot, idx) =>
      setTimeout(() => setTick(idx), slot.time)
    )

    const t1 = setTimeout(() => { canExitRef.current = true }, SKIP_ENABLED_MS)
    const t2 = setTimeout(() => exit(), HOLD_MS)
    const t3 = setTimeout(() => setShowAttrib(true), ATTRIBUTION_MS)

    return () => {
      clearTimeout(enterTimer)
      wordTimers.forEach(clearTimeout)
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [exit])

  useEffect(() => {
    const onKey = () => { if (canExitRef.current) exit() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [exit])

  if (!show) return null

  const lineComplete = tick >= SLOTS.length - 1

  return (
    <div
      onClick={() => { if (canExitRef.current) exit() }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        background: 'radial-gradient(ellipse 120% 120% at 50% 32%, #14161d 0%, #0c0d12 55%, #08090c 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        opacity: (entered && !exiting) ? 1 : 0,
        transition: 'opacity 1.1s ease',
        cursor: 'default',
      }}
    >
      <style>{`
        @keyframes qi-breathe {
          0%, 100% { opacity: 0.32; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.55; transform: translate(-50%, -50%) scale(1.14); }
        }
        @keyframes qi-progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>

      {/* Ambient breathing glow */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '42%', left: '50%',
        width: 'min(70vw, 620px)', height: 'min(70vw, 620px)',
        pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(126,146,196,0.18), transparent 70%)',
        filter: 'blur(8px)',
        animation: 'qi-breathe 8s ease-in-out infinite',
      }} />

      {/* Soft vignette to settle the edges */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.55) 100%)',
      }} />

      <div style={{ maxWidth: 'none', width: 'auto', textAlign: 'center', position: 'relative' }}>

        {/* Quote text */}
        <p style={{
          fontFamily: "'Newsreader', Georgia, 'Times New Roman', serif",
          fontSize: 'clamp(0.78rem, 3.7vw, 2rem)',
          fontWeight: 300,
          color: 'rgba(236,238,245,0.92)',
          lineHeight: 1.7,
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
          margin: 0,
          textShadow: '0 1px 36px rgba(150,170,212,0.12)',
        }}>
          {SLOTS.map((slot, idx) => {
            const isVisible = tick >= idx
            return (
              <span
                key={idx}
                style={{
                  display: 'inline-block',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                  filter: isVisible ? 'blur(0)' : 'blur(7px)',
                  transition: 'opacity 0.9s ease, transform 0.9s ease, filter 0.9s ease',
                  marginRight: '0.28em',
                }}
              >
                {slot.text}
              </span>
            )
          })}
        </p>

        {/* Attribution */}
        <p style={{
          fontFamily: "'Newsreader', Georgia, 'Times New Roman', serif",
          fontStyle: 'italic',
          fontSize: 'clamp(0.72rem, 1.5vw, 0.9rem)',
          color: 'rgba(236,238,245,0.34)',
          letterSpacing: '0.14em',
          marginTop: '2rem',
          marginBottom: 0,
          opacity: showAttrib ? 1 : 0,
          transform: showAttrib ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 1.1s ease, transform 1.1s ease',
        }}>
          — Anonymous
        </p>
      </div>

      {/* Gentle pacing hairline */}
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: '2.6rem', left: '50%', transform: 'translateX(-50%)',
        width: '150px', height: '1px',
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
        opacity: lineComplete ? 1 : 0.5,
        transition: 'opacity 1s ease',
      }}>
        <div style={{
          width: '100%', height: '100%',
          transformOrigin: 'left',
          background: 'linear-gradient(to right, transparent, rgba(150,170,212,0.6))',
          animation: `qi-progress ${HOLD_MS}ms linear forwards`,
        }} />
      </div>
    </div>
  )
}
