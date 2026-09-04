import React, { useCallback, useEffect, useRef, useState } from 'react'

/* ------------------------------------------------------------------ *
 * #/congrats — ask first, then celebrate either way.
 *
 * Two buttons, one question, and no wrong answer. Pass gets the loud
 * version; fail gets the quieter one, which is the whole point of the
 * page — the person who tried and missed is the one who actually needs
 * to hear something.
 *
 * The failed answer is deliberately not a consolation prize dressed up
 * as a win. It says the true thing plainly: most people never enter the
 * room at all. Overselling it ("you basically passed!") would be
 * transparent and would make the page feel like it was managing them.
 *
 * The word "fail" appears on the button and nowhere afterwards. Naming
 * it once is honest; repeating it is unkind.
 *
 * Nothing is stored and nothing is sent. The answer lives in component
 * state for as long as the page is open, and a reload starts over.
 * ------------------------------------------------------------------ */

const PASS = ['#F5C451', '#EFA93C', '#E8734A', '#5FBF8F', '#7FB3E8']
const TRIED = ['#7FB3E8', '#8FD9C4', '#B79BE8']

// Rotated so the page isn't identical on a second visit, and so a
// screenshot of it isn't the whole thing.
const PASS_LINES = [
  'You did the thing.',
  'That is a pass.',
  'Well done, genuinely.',
]
const TRIED_LINES = [
  'You showed up.',
  'You entered the room.',
  'You put your name down.',
]

const pick = (a) => a[(Math.random() * a.length) | 0]

export default function CongratsPage({ onBack }) {
  const [answer, setAnswer] = useState(null)     // null | 'pass' | 'tried'
  const [line, setLine] = useState('')
  const burstRef = useRef(null)

  // Confetti as plain DOM nodes that remove themselves on animationend —
  // same approach as the All the best card. A canvas would mean another
  // thing to size, layer and tear down for a handful of pieces.
  const fire = useCallback((count, palette, xvw = 50, yvh = 30) => {
    const host = burstRef.current
    if (!host) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span')
      s.className = 'cg-piece'
      if (Math.random() > 0.82) {
        // aria-hidden on each piece, not just the container: the sparkle
        // is real text content, and a screen reader walking the page
        // would otherwise read out a line of star characters.
        s.setAttribute('aria-hidden', 'true')
        s.textContent = '✦'
        s.style.color = palette[(Math.random() * palette.length) | 0]
        s.style.fontSize = 10 + Math.random() * 12 + 'px'
      } else {
        s.classList.add('cg-paper')
        s.style.background = palette[(Math.random() * palette.length) | 0]
        s.style.width = 5 + Math.random() * 6 + 'px'
        s.style.height = 8 + Math.random() * 7 + 'px'
      }
      s.style.left = xvw + (Math.random() * 16 - 8) + 'vw'
      s.style.top = yvh + 'vh'
      s.style.setProperty('--dx', (Math.random() * 2 - 1) * 32 + 'vw')
      s.style.setProperty('--dy', -(26 + Math.random() * 42) + 'vh')
      s.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg')
      s.style.animationDelay = Math.random() * 0.14 + 's'
      s.style.animationDuration = 1.7 + Math.random() * 1.3 + 's'
      host.appendChild(s)
      s.addEventListener('animationend', () => s.remove(), { once: true })
    }
  }, [])

  const answerPass = useCallback(() => {
    setAnswer('pass')
    setLine(pick(PASS_LINES))
    fire(80, PASS, 50, 26)
    setTimeout(() => fire(45, PASS, 24, 18), 200)
    setTimeout(() => fire(45, PASS, 76, 18), 380)
  }, [fire])

  // Deliberately gentler: a handful of pieces rather than a shower. The
  // same fanfare for both answers would read as the page not listening.
  const answerTried = useCallback(() => {
    setAnswer('tried')
    setLine(pick(TRIED_LINES))
    fire(26, TRIED, 50, 30)
  }, [fire])

  const again = () => { setAnswer(null); setLine('') }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && answer) again() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answer])

  const tint = answer === 'pass' ? '#F5C451' : '#7FB3E8'

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Confetti sits above the content but takes no clicks. */}
      <div ref={burstRef} className="fixed inset-0 z-20 pointer-events-none" aria-hidden="true" />

      {/* A soft wash behind everything, tinted by the answer. */}
      <div
        className="fixed inset-0 pointer-events-none transition-opacity duration-700"
        aria-hidden="true"
        style={{
          opacity: answer ? 1 : 0.55,
          background: `radial-gradient(60% 45% at 50% 22%, color-mix(in oklab, ${tint} 14%, transparent) 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 mx-auto max-w-2xl px-5 sm:px-6 py-8 sm:py-12">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="min-h-[68vh] flex flex-col justify-center">

          {/* ---- the question ---- */}
          {!answer && (
            <div className="cg-in text-center">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                Before anything else
              </p>
              <h1 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-tight">
                How did it go?
              </h1>
              <p className="mt-3 text-[14.5px] text-muted-foreground">
                Either answer is fine. Pick one.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={answerPass}
                  className="px-6 py-3 rounded-full text-[14.5px] font-semibold transition-transform hover:scale-[1.03]"
                  style={{ background: '#F5C451', color: '#1a1a1a' }}
                >
                  I passed
                </button>
                <button
                  onClick={answerTried}
                  className="px-6 py-3 rounded-full text-[14.5px] font-medium text-foreground transition-colors hover:bg-white/5"
                  style={{ boxShadow: 'inset 0 0 0 1px var(--color-border)' }}
                >
                  I didn’t
                </button>
              </div>
            </div>
          )}

          {/* ---- passed ---- */}
          {answer === 'pass' && (
            <div className="cg-in text-center">
              <div className="mx-auto grid place-items-center w-16 h-16 rounded-full"
                   style={{ background: 'color-mix(in oklab, #F5C451 18%, transparent)', boxShadow: 'inset 0 0 0 1.5px color-mix(in oklab, #F5C451 55%, transparent)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F5C451" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>

              <p className="mt-6 text-[11px] font-mono uppercase tracking-[0.2em]" style={{ color: '#F5C451' }}>
                {line}
              </p>
              <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">Congratulations</h1>

              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground max-w-md mx-auto">
                Nobody sees the part that got you here — the evenings that went nowhere, the
                things you gave up to make room for it. The result is one line. The work
                behind it was months.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground max-w-md mx-auto">
                Take the day. It is yours.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => fire(50, PASS, 50, 34)}
                  className="px-5 py-2.5 rounded-full text-[13.5px] font-medium transition-transform hover:scale-[1.03]"
                  style={{ background: '#F5C451', color: '#1a1a1a' }}
                >
                  More of that
                </button>
                <button onClick={again} className="px-5 py-2.5 rounded-full text-[13.5px] text-muted-foreground hover:text-foreground transition-colors"
                        style={{ boxShadow: 'inset 0 0 0 1px var(--color-border)' }}>
                  Back to the question
                </button>
              </div>
            </div>
          )}

          {/* ---- tried ---- */}
          {answer === 'tried' && (
            <div className="cg-in text-center">
              <div className="mx-auto grid place-items-center w-16 h-16 rounded-full"
                   style={{ background: 'color-mix(in oklab, #7FB3E8 16%, transparent)', boxShadow: 'inset 0 0 0 1.5px color-mix(in oklab, #7FB3E8 50%, transparent)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7FB3E8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20V9M12 9l-5 4M12 9l5 4" />
                  <circle cx="12" cy="5" r="2.2" />
                </svg>
              </div>

              <p className="mt-6 text-[11px] font-mono uppercase tracking-[0.2em]" style={{ color: '#7FB3E8' }}>
                {line}
              </p>
              <h1 className="mt-3 text-4xl sm:text-5xl font-semibold tracking-tight">
                Congratulations anyway
              </h1>

              <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground max-w-md mx-auto">
                Most people never get this far. They talk about it, plan to start next month,
                and never put their name down. You did — and you found out where you stand,
                which is more than anyone who stayed home knows about themselves.
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground max-w-md mx-auto">
                This one goes in the column marked <span className="text-foreground">not yet</span>.
                You already know most of the material and exactly which parts caught you out.
                That is a much shorter run at it the second time.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => fire(22, TRIED, 50, 34)}
                  className="px-5 py-2.5 rounded-full text-[13.5px] font-medium text-foreground transition-colors hover:bg-white/5"
                  style={{ boxShadow: 'inset 0 0 0 1px color-mix(in oklab, #7FB3E8 45%, var(--color-border))' }}
                >
                  Alright then
                </button>
                <button onClick={again} className="px-5 py-2.5 rounded-full text-[13.5px] text-muted-foreground hover:text-foreground transition-colors"
                        style={{ boxShadow: 'inset 0 0 0 1px var(--color-border)' }}>
                  Back to the question
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
