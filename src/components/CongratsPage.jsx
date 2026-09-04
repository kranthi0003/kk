import React, { useCallback, useEffect, useRef, useState } from 'react'

/* ------------------------------------------------------------------ *
 * #/claude — ask how it went, then celebrate either answer.
 *
 * This one is made to be sent to somebody, so it is built like a card
 * rather than a page: warm paper instead of the site's dark, a serif
 * that behaves at large sizes, and one thing on screen at a time. It
 * should survive being screenshotted.
 *
 * Both answers are congratulations. Pass gets the loud version; the
 * other gets the quieter one, which is the actual reason the page
 * exists — the person who tried and missed is the one who needs to hear
 * something.
 *
 * The failed answer is deliberately not a consolation prize dressed up
 * as a win. It says the true thing plainly: most people never enter the
 * room at all. Overselling it would be transparent, and would make the
 * page feel like it was managing them.
 *
 * The word "fail" appears on the button and nowhere afterwards. Naming
 * it once is honest; repeating it is unkind.
 *
 * Nothing is stored and nothing is sent. The answer lives in component
 * state for as long as the page is open, and a reload starts over.
 * ------------------------------------------------------------------ */

const INK = '#413634'        // body — 10.4:1 on this paper
const INK_SOFT = '#6b5b57'
const GOLD = '#B4761C'       // decorative only — 3.6:1, fine for rules and icons
const BLUE = '#5C7FA8'       // decorative only — 3.9:1

// The eyebrow is 10.5px, so it is "small text" and needs 4.5:1 on the paper.
// The decorative golds above measure 3.6 and 3.9, so text gets its own shade.
const GOLD_TEXT = '#8A5A12'  // 5.6:1
const BLUE_TEXT = '#3F5F86'  // 6.2:1

const GOLD_BITS = ['#E8B84B', '#D9A03C', '#C9821F', '#EBCE86', '#F2DFAE']
const BLUE_BITS = ['#8FAECD', '#A9C4DC', '#C3D5E6', '#B9C8DE']

const PASS_LINES = ['You did the thing.', 'That is a pass.', 'Well done, genuinely.']
const TRIED_LINES = ['You showed up.', 'You entered the room.', 'You put your name down.']

const pick = (a) => a[(Math.random() * a.length) | 0]

export default function CongratsPage({ onBack }) {
  const [answer, setAnswer] = useState(null)   // null | 'pass' | 'tried'
  const [line, setLine] = useState('')
  const burstRef = useRef(null)

  /* Confetti as plain DOM nodes that remove themselves on animationend.
     A canvas would be another thing to size, layer and tear down for a
     couple of hundred pieces that live under two seconds. */
  const fire = useCallback((count, palette, xvw = 50, yvh = 30) => {
    const host = burstRef.current
    if (!host) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span')
      s.className = 'cg-piece'
      // aria-hidden on each piece, not just the container: the sparkle is
      // a real character, and a screen reader walking the page would
      // otherwise read out a line of stars between the sentences.
      s.setAttribute('aria-hidden', 'true')
      const roll = Math.random()
      if (roll > 0.86) {
        s.textContent = '✦'
        s.style.color = palette[(Math.random() * palette.length) | 0]
        s.style.fontSize = 9 + Math.random() * 11 + 'px'
      } else if (roll > 0.72) {
        s.classList.add('cg-round')
        s.style.background = palette[(Math.random() * palette.length) | 0]
        const d = 4 + Math.random() * 5
        s.style.width = d + 'px'
        s.style.height = d + 'px'
      } else {
        s.classList.add('cg-paper')
        s.style.background = palette[(Math.random() * palette.length) | 0]
        s.style.width = 5 + Math.random() * 5 + 'px'
        s.style.height = 8 + Math.random() * 7 + 'px'
      }
      s.style.left = xvw + (Math.random() * 18 - 9) + 'vw'
      s.style.top = yvh + 'vh'
      s.style.setProperty('--dx', (Math.random() * 2 - 1) * 34 + 'vw')
      s.style.setProperty('--dy', -(24 + Math.random() * 44) + 'vh')
      s.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg')
      s.style.animationDelay = Math.random() * 0.16 + 's'
      s.style.animationDuration = 1.8 + Math.random() * 1.4 + 's'
      host.appendChild(s)
      s.addEventListener('animationend', () => s.remove(), { once: true })
    }
  }, [])

  const answerPass = useCallback(() => {
    setAnswer('pass')
    setLine(pick(PASS_LINES))
    fire(80, GOLD_BITS, 50, 28)
    setTimeout(() => fire(45, GOLD_BITS, 22, 20), 200)
    setTimeout(() => fire(45, GOLD_BITS, 78, 20), 380)
  }, [fire])

  // Deliberately gentler — a handful rather than a shower. The same
  // fanfare for both answers would read as the page not listening.
  const answerTried = useCallback(() => {
    setAnswer('tried')
    setLine(pick(TRIED_LINES))
    fire(26, BLUE_BITS, 50, 32)
  }, [fire])

  const again = () => { setAnswer(null); setLine('') }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && answer) again() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answer])

  const tint = answer === 'tried' ? BLUE : GOLD

  return (
    <div className="cg-root min-h-screen relative overflow-hidden" data-mood={answer || 'ask'}>
      <style>{CG_STYLE}</style>

      {/* Confetti above the card but taking no clicks. */}
      <div ref={burstRef} className="fixed inset-0 z-30 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-2xl px-5 sm:px-6 py-7">
        <button onClick={onBack} className="cg-back inline-flex items-center gap-2 text-[13px]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="min-h-[76vh] flex flex-col justify-center">
          <div className="cg-card">

            {/* ---- the question ---- */}
            {!answer && (
              <div className="cg-in text-center">
                <span className="cg-eyebrow">Before anything else</span>
                <h1 className="cg-h1 mt-4">How did it go?</h1>
                <p className="cg-sub mt-4">Either answer is fine. Pick one.</p>

                <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={answerPass} className="cg-btn cg-btn-gold">I passed</button>
                  <button onClick={answerTried} className="cg-btn cg-btn-ghost">I didn’t</button>
                </div>
              </div>
            )}

            {/* ---- passed ---- */}
            {answer === 'pass' && (
              <div className="cg-in text-center">
                <div className="cg-medal" style={{ '--c': GOLD }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>

                <span className="cg-eyebrow mt-6 block" style={{ color: GOLD_TEXT }}>{line}</span>
                <h1 className="cg-h1 cg-h1-big mt-3">Congratulations</h1>

                <p className="cg-body mt-6">
                  Nobody sees the part that got you here — the evenings that went nowhere, the
                  things you put off to make room for it. The result is one line. The work
                  behind it was months.
                </p>
                <p className="cg-body mt-3.5">Take the day. It’s yours.</p>

                <div className="mt-9 flex flex-wrap gap-3 justify-center">
                  <button onClick={() => fire(55, GOLD_BITS, 50, 34)} className="cg-btn cg-btn-gold">More of that</button>
                  <button onClick={again} className="cg-btn cg-btn-quiet">Back to the question</button>
                </div>
              </div>
            )}

            {/* ---- tried ---- */}
            {answer === 'tried' && (
              <div className="cg-in text-center">
                <div className="cg-medal" style={{ '--c': BLUE }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20.5V9.5M12 9.5l-4.6 3.8M12 9.5l4.6 3.8" />
                    <circle cx="12" cy="5" r="2.2" />
                  </svg>
                </div>

                <span className="cg-eyebrow mt-6 block" style={{ color: BLUE_TEXT }}>{line}</span>
                <h1 className="cg-h1 cg-h1-big mt-3">Congratulations anyway</h1>

                <p className="cg-body mt-6">
                  Most people never get this far. They talk about it, plan to start next month,
                  and never put their name down. You did — and you found out exactly where you
                  stand, which is more than anyone who stayed home knows about themselves.
                </p>
                <p className="cg-body mt-3.5">
                  This one goes in the column marked <em className="cg-em">not yet</em>. You already
                  know most of it, and you know precisely which parts caught you out. That’s a much
                  shorter run at it the second time.
                </p>

                <div className="mt-9 flex flex-wrap gap-3 justify-center">
                  <button onClick={() => fire(24, BLUE_BITS, 50, 34)} className="cg-btn cg-btn-blue">Alright then</button>
                  <button onClick={again} className="cg-btn cg-btn-quiet">Back to the question</button>
                </div>
              </div>
            )}
          </div>

          {answer && (
            <p className="cg-sig cg-in" style={{ '--c': tint }}>— Kranthi</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* Scoped to .cg-root so none of this can reach the rest of the site. */
const CG_STYLE = `
  /* Warm paper rather than a screen. The colour is pushed to the edges so
     the middle, where every line of text sits, stays bright and readable.
     The washes shift with the answer — gold when it went well, a cooler
     blue when it didn't — which does more for the mood than any amount of
     copy would. */
  .cg-root {
    color: ${INK};
    -webkit-font-smoothing: antialiased;
    transition: background 1.1s cubic-bezier(0.22, 0.61, 0.36, 1);
    background:
      radial-gradient(46% 30% at 50% -4%,  rgba(246,213,160,0.50) 0%, transparent 70%),
      radial-gradient(40% 30% at -8% 20%,  rgba(252,214,180,0.42) 0%, transparent 72%),
      radial-gradient(42% 32% at 108% 42%, rgba(238,200,178,0.34) 0%, transparent 72%),
      radial-gradient(46% 30% at -6% 88%,  rgba(240,222,190,0.34) 0%, transparent 72%),
      linear-gradient(176deg, #fffdfa 0%, #fdf8f1 54%, #fbf3ea 100%);
  }
  .cg-root[data-mood='pass'] {
    background:
      radial-gradient(52% 34% at 50% -6%,  rgba(245,199,106,0.60) 0%, transparent 70%),
      radial-gradient(40% 30% at -8% 20%,  rgba(250,206,150,0.48) 0%, transparent 72%),
      radial-gradient(42% 32% at 108% 40%, rgba(243,190,140,0.40) 0%, transparent 72%),
      radial-gradient(46% 30% at -6% 88%,  rgba(244,218,168,0.40) 0%, transparent 72%),
      linear-gradient(176deg, #fffdf7 0%, #fdf6e9 54%, #faf0e0 100%);
  }
  .cg-root[data-mood='tried'] {
    background:
      radial-gradient(50% 32% at 50% -5%,  rgba(178,203,228,0.52) 0%, transparent 70%),
      radial-gradient(40% 30% at -8% 20%,  rgba(198,214,234,0.42) 0%, transparent 72%),
      radial-gradient(42% 32% at 108% 42%, rgba(206,200,232,0.34) 0%, transparent 72%),
      radial-gradient(46% 30% at -6% 88%,  rgba(196,218,224,0.34) 0%, transparent 72%),
      linear-gradient(176deg, #fdfdff 0%, #f7f9fd 54%, #f2f6fb 100%);
  }

  .cg-back {
    color: ${INK_SOFT};
    transition: color .2s ease;
  }
  .cg-back:hover { color: ${INK}; }

  /* The card is the object being sent, so it gets real depth — a long
     soft shadow rather than a border, which is what separates "a card"
     from "a div with a line round it". */
  .cg-card {
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.9);
    border-radius: 1.5rem;
    padding: 3rem 1.75rem;
    box-shadow:
      0 1px 2px rgba(120,90,70,0.05),
      0 12px 28px -8px rgba(120,90,70,0.13),
      0 40px 80px -32px rgba(120,90,70,0.22);
  }
  @media (min-width: 640px) {
    .cg-card { padding: 3.75rem 3rem; }
  }

  .cg-eyebrow {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10.5px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: ${INK_SOFT};
  }

  .cg-h1 {
    font-family: var(--font-heading, Georgia, 'Times New Roman', serif);
    font-weight: 600;
    letter-spacing: -0.018em;
    line-height: 1.04;
    font-size: clamp(2.1rem, 7vw, 3rem);
    color: #241d1c;
  }
  .cg-h1-big { font-size: clamp(2.3rem, 8.4vw, 3.6rem); }

  .cg-sub { font-size: 15px; color: ${INK_SOFT}; }

  .cg-body {
    font-size: 15.5px;
    line-height: 1.72;
    color: ${INK};
    max-width: 30rem;
    margin-left: auto;
    margin-right: auto;
  }
  .cg-em { font-style: italic; color: #241d1c; }

  .cg-medal {
    width: 4.25rem;
    height: 4.25rem;
    margin: 0 auto;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: color-mix(in oklab, var(--c) 12%, #fff);
    box-shadow:
      inset 0 0 0 1.5px color-mix(in oklab, var(--c) 34%, transparent),
      0 8px 22px -8px color-mix(in oklab, var(--c) 50%, transparent);
    animation: cgPop .62s cubic-bezier(0.2, 1.3, 0.4, 1) both;
  }
  @keyframes cgPop {
    from { transform: scale(0.6); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }

  .cg-btn {
    padding: 0.8rem 1.6rem;
    border-radius: 999px;
    font-size: 14.5px;
    font-weight: 600;
    transition: transform .18s cubic-bezier(0.2, 1, 0.3, 1), box-shadow .22s ease, background .22s ease;
  }
  .cg-btn:hover { transform: translateY(-1.5px); }
  .cg-btn:active { transform: translateY(0); }

  .cg-btn-gold {
    background: linear-gradient(168deg, #F0C154 0%, #DDA33A 100%);
    color: #3d2a08;
    box-shadow: 0 2px 4px rgba(160,120,40,0.18), 0 10px 22px -8px rgba(160,120,40,0.5);
  }
  .cg-btn-gold:hover { box-shadow: 0 3px 6px rgba(160,120,40,0.2), 0 16px 30px -10px rgba(160,120,40,0.58); }

  .cg-btn-blue {
    background: linear-gradient(168deg, #96B6D6 0%, #7C9CC0 100%);
    color: #142334;
    box-shadow: 0 2px 4px rgba(70,100,140,0.16), 0 10px 22px -8px rgba(70,100,140,0.44);
  }

  .cg-btn-ghost {
    background: rgba(255,255,255,0.7);
    color: ${INK};
    box-shadow: inset 0 0 0 1px rgba(120,90,70,0.2), 0 4px 12px -6px rgba(120,90,70,0.2);
  }
  .cg-btn-ghost:hover { background: #fff; }

  .cg-btn-quiet {
    background: transparent;
    color: ${INK_SOFT};
    font-weight: 500;
    box-shadow: inset 0 0 0 1px rgba(120,90,70,0.16);
  }
  .cg-btn-quiet:hover { color: ${INK}; background: rgba(255,255,255,0.55); }

  .cg-sig {
    margin: 1.75rem auto 0;
    text-align: center;
    font-family: var(--font-heading, Georgia, serif);
    font-style: italic;
    font-size: 14px;
    color: color-mix(in oklab, var(--c) 62%, ${INK_SOFT});
  }

  /* ---- confetti ---- */
  .cg-piece {
    position: absolute;
    will-change: transform, opacity;
    animation-name: cgFall;
    animation-timing-function: cubic-bezier(0.16, 0.9, 0.36, 1);
    animation-fill-mode: forwards;
    pointer-events: none;
  }
  .cg-paper { border-radius: 1px; }
  .cg-round { border-radius: 999px; }

  @keyframes cgFall {
    0%   { transform: translate3d(0,0,0) rotate(0deg); opacity: 1; }
    100% { transform: translate3d(var(--dx,0), var(--dy,-40vh), 0) rotate(var(--rot,360deg)); opacity: 0; }
  }

  .cg-in { animation: cgIn .55s cubic-bezier(0.16, 1, 0.3, 1) both; }
  @keyframes cgIn {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .cg-piece { display: none; }
    .cg-in, .cg-medal { animation: none; }
    .cg-root { transition: none; }
    .cg-btn:hover { transform: none; }
  }
`
