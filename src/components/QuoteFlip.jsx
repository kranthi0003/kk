import React, { useState, useRef, useEffect, useCallback } from 'react'

// A quiet interstitial that hides a surprise: it reads like one of the site's
// reflective quotes, but tap it and the line "decodes" (Matrix-style) into an
// original dev/cloud joke. Tap again and it flips back to a fresh quote —
// alternating between the two. This is the site's one "quotes × memes" moment,
// replacing a pair of plain quote interstitials.

const QUOTES = [
  { t: 'You only live once, but if you do it right, once is enough.', by: 'Mae West' },
  { t: 'Life is either a daring adventure, or nothing at all.', by: 'Helen Keller' },
  { t: 'As long as you live, keep learning how to live.', by: 'Seneca' },
  { t: 'Love many things, for therein lies the true strength.', by: 'Vincent van Gogh' },
  { t: "Life moves pretty fast. If you don't stop and look around once in a while, you could miss it.", by: "Ferris Bueller" },
]

// Original phrasings of classic programmer-humor tropes — no copyrighted lines.
const JOKES = [
  { t: "I don't always test my code — but when I do, I do it in production.", tag: 'ops wisdom', emo: '🫠' },
  { t: 'Two hard things in computer science: cache invalidation, naming things, and off-by-one errors.', tag: 'certified truth', emo: '🧠' },
  { t: "It's not a bug. It's an undocumented feature.", tag: 'every PR description', emo: '🐛' },
  { t: 'My code works and I have no idea why. My code breaks and I have no idea why.', tag: 'daily standup', emo: '🙃' },
  { t: 'Prod is just staging with confidence.', tag: 'a cloud engineer', emo: '☁️' },
  { t: 'git commit -m "final" → "final-FINAL" → "final-for-real-2".', tag: 'a tragedy in 3 acts', emo: '🗂️' },
  { t: 'I turned it off and on again — but at scale.', tag: 'incident report', emo: '🔌' },
  { t: 'To understand recursion, you must first understand recursion.', tag: 'see also: recursion', emo: '🔁' },
  { t: 'Weeks of coding can save you hours of planning.', tag: 'lesson unlearned', emo: '⏳' },
  { t: '99 little bugs in the code. Patch one around… 127 little bugs in the code.', tag: 'the changelog', emo: '🎶' },
]

const SCRAMBLE = '01<>/\\|=+*—ｱｲｳｴｵｶｷｸｹｺﾊﾋﾌﾍﾎ'
const DECODE_FRAMES = 14

export default function QuoteFlip() {
  const [mode, setMode] = useState('quote')     // 'quote' | 'joke'
  const [qi, setQi] = useState(() => (Math.random() * QUOTES.length) | 0)
  const [ji, setJi] = useState(() => (Math.random() * JOKES.length) | 0)
  const [display, setDisplay] = useState(QUOTES[0].t)
  const [decoding, setDecoding] = useState(false)
  const [hintSeen, setHintSeen] = useState(false)
  const timerRef = useRef(null)

  // Seed the first line once mounted (keeps SSR-ish first paint stable).
  useEffect(() => { setDisplay(QUOTES[qi].t) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => clearInterval(timerRef.current), [])

  const isJoke = mode === 'joke'
  const current = isJoke ? JOKES[ji] : QUOTES[qi]

  const revealTo = useCallback((finalText) => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    clearInterval(timerRef.current)
    if (reduced) { setDisplay(finalText); setDecoding(false); return }
    setDecoding(true)
    const total = finalText.length
    let frame = 0
    timerRef.current = setInterval(() => {
      frame++
      const locked = Math.floor((frame / DECODE_FRAMES) * total)
      let out = ''
      for (let i = 0; i < total; i++) {
        const c = finalText[i]
        out += (i < locked || c === ' ') ? c : SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0]
      }
      setDisplay(out)
      if (locked >= total) { clearInterval(timerRef.current); setDisplay(finalText); setDecoding(false) }
    }, 26)
  }, [])

  const flip = useCallback(() => {
    setHintSeen(true)
    if (isJoke) {
      // joke → next quote
      const n = (qi + 1) % QUOTES.length
      setQi(n); setMode('quote'); revealTo(QUOTES[n].t)
    } else {
      // quote → next joke
      const n = (ji + 1) % JOKES.length
      setJi(n); setMode('joke'); revealTo(JOKES[n].t)
    }
  }, [isJoke, qi, ji, revealTo])

  const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip() } }

  return (
    <section className="py-24 sm:py-32 px-6">
      <div
        role="button"
        tabIndex={0}
        onClick={flip}
        onKeyDown={onKey}
        aria-label="Tap to flip between a quote and a joke"
        className="group max-w-2xl mx-auto text-center cursor-pointer select-none outline-none"
      >
        <span
          aria-hidden="true"
          className="block w-px h-10 mx-auto mb-10 transition-all duration-500"
          style={{ background: 'linear-gradient(to bottom, transparent, color-mix(in oklab, var(--color-border) 90%, transparent))' }}
        />

        <div
          className="relative flex flex-col items-center justify-center rounded-2xl px-4 sm:px-8 py-6 transition-all duration-500"
          style={{
            minHeight: '4.2em',
            background: isJoke ? 'color-mix(in oklab, var(--color-accent) 9%, transparent)' : 'transparent',
            boxShadow: isJoke ? 'inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 22%, transparent)' : 'none',
          }}
        >
          {isJoke && (
            <span className="text-3xl sm:text-4xl mb-3 block transition-transform duration-500 group-hover:scale-110" aria-hidden="true">
              {current.emo}
            </span>
          )}
          <p
            className={isJoke
              ? 'font-medium text-foreground leading-snug'
              : 'font-serif italic text-muted-foreground/70 leading-relaxed'}
            style={{
              fontSize: 'clamp(1.05rem, 2.6vw, 1.6rem)',
              fontVariantLigatures: decoding ? 'none' : undefined,
            }}
          >
            {display}
          </p>

          <p
            className={`mt-6 text-xs md:text-sm tracking-[0.2em] transition-colors ${
              isJoke ? 'font-mono uppercase' : 'font-serif'
            }`}
            style={{ color: isJoke ? 'color-mix(in oklab, var(--color-accent) 85%, var(--color-foreground))' : 'color-mix(in oklab, var(--color-muted-foreground) 55%, transparent)' }}
          >
            {isJoke ? `// ${current.tag}` : `— ${current.by}`}
          </p>
        </div>

        {/* Discoverability hint — quiet, fades once they've flipped. */}
        <span
          className={`mt-6 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/40 transition-opacity duration-500 ${
            hintSeen ? 'opacity-0' : 'opacity-100 group-hover:text-muted-foreground/70'
          }`}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11.5V6a2 2 0 0 1 4 0v5" /><path d="M13 11V4.5a2 2 0 0 1 4 0V13" />
            <path d="M17 11.5a2 2 0 0 1 4 0V16a6 6 0 0 1-6 6h-2a7 7 0 0 1-5-2l-3.5-3.6a2 2 0 0 1 3-2.6l1.5 1.4V6a2 2 0 0 1 4 0v5" />
          </svg>
          tap me
        </span>
      </div>
    </section>
  )
}
