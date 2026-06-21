import { useState, useEffect, useCallback, useRef } from 'react'

const PART1 = "You don't want what you want because of who you are..."
const PART2 = "You want what you want because the people you want to be have them."
const ATTRIBUTION = '— René Girard'

const WORD_MS = 210 // delay between each word

function buildSlots() {
  const slots = []
  let t = 0
  PART1.split(' ').forEach(w => {
    slots.push({ type: 'word', text: w, time: t })
    t += WORD_MS
  })
  // Longer pause between sentences — let the first idea land
  slots.push({ type: 'break', time: t })
  t += 900
  PART2.split(' ').forEach(w => {
    slots.push({ type: 'word', text: w, time: t })
    t += WORD_MS
  })
  return slots
}

const SLOTS = buildSlots()
const LAST_WORD_MS = SLOTS[SLOTS.length - 1].time + WORD_MS
const ATTRIBUTION_MS = LAST_WORD_MS + 700
const PROMPT_MS = ATTRIBUTION_MS + 1600
const AUTO_EXIT_MS = PROMPT_MS + 7000

export default function QuoteIntro() {
  const [show, setShow]           = useState(false)
  const [tick, setTick]           = useState(-1)
  const [showAttrib, setShowAttrib] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
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
    if (sessionStorage.getItem('quote_intro_seen')) return

    setShow(true)

    // Schedule each word/break slot
    const wordTimers = SLOTS.map((slot, idx) =>
      setTimeout(() => setTick(idx), slot.time)
    )

    const t1 = setTimeout(() => setShowAttrib(true), ATTRIBUTION_MS)
    const t2 = setTimeout(() => { setShowPrompt(true); canExitRef.current = true }, PROMPT_MS)
    const t3 = setTimeout(() => exit(), AUTO_EXIT_MS)

    return () => {
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

  return (
    <div
      onClick={() => { if (canExitRef.current) exit() }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.95s ease',
        cursor: 'default',
      }}
    >
      {/* Subtle vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)',
      }} />

      <div style={{ maxWidth: '640px', width: '100%', textAlign: 'center', position: 'relative' }}>

        {/* Quote text */}
        <p style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 'clamp(1rem, 2.4vw, 1.35rem)',
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 2,
          letterSpacing: '0.015em',
          margin: 0,
        }}>
          {SLOTS.map((slot, idx) => {
            const isVisible = tick >= idx

            if (slot.type === 'break') {
              return (
                <span
                  key={idx}
                  style={{ display: 'block', height: '0.55em' }}
                  aria-hidden="true"
                />
              )
            }

            return (
              <span
                key={idx}
                style={{
                  display: 'inline-block',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(7px)',
                  transition: 'opacity 0.55s ease, transform 0.55s ease',
                  marginRight: '0.3em',
                  // Slightly different shade for second sentence — barely noticeable
                  color: idx > SLOTS.findIndex(s => s.type === 'break')
                    ? 'rgba(255,255,255,0.78)'
                    : 'rgba(255,255,255,0.88)',
                }}
              >
                {slot.text}
              </span>
            )
          })}
        </p>

        {/* Attribution */}
        <p style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 'clamp(0.7rem, 1.4vw, 0.85rem)',
          color: 'rgba(255,255,255,0.28)',
          fontStyle: 'italic',
          letterSpacing: '0.1em',
          marginTop: '2.2rem',
          marginBottom: 0,
          opacity: showAttrib ? 1 : 0,
          transform: showAttrib ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 1s ease, transform 1s ease',
        }}>
          {ATTRIBUTION}
        </p>
      </div>

      {/* Enter prompt */}
      <div style={{
        position: 'absolute',
        bottom: '2.2rem',
        left: '50%',
        transform: 'translateX(-50%)',
        opacity: showPrompt ? 1 : 0,
        transition: 'opacity 1.2s ease',
        pointerEvents: 'none',
      }}>
        <span style={{
          fontFamily: 'ui-monospace, "JetBrains Mono", "Courier New", monospace',
          fontSize: '0.6rem',
          color: 'rgba(255,255,255,0.18)',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
        }}>
          tap anywhere to enter
        </span>
      </div>
    </div>
  )
}
