import React, { useState, useEffect } from 'react'

// A quiet, full-width interstitial — a single reflective line with room to
// breathe. Pass either a single quote via children/by, or a `quotes` array
// ([{ t, by }]) to slowly crossfade through several, one at a time.
export default function Reflection({ children, by, quotes, interval = 7000 }) {
  const rotating = Array.isArray(quotes) && quotes.length > 0
  const [i, setI] = useState(0)
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (!rotating || quotes.length < 2) return
    const id = setInterval(() => {
      setShow(false)
      setTimeout(() => { setI(n => (n + 1) % quotes.length); setShow(true) }, 900)
    }, interval)
    return () => clearInterval(id)
  }, [rotating, quotes, interval])

  const text = rotating ? quotes[i].t : children
  const author = rotating ? quotes[i].by : by

  return (
    <section className="py-24 sm:py-32 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <span
          aria-hidden="true"
          className="block w-px h-10 mx-auto mb-10"
          style={{ background: 'linear-gradient(to bottom, transparent, color-mix(in oklab, var(--color-border) 90%, transparent))' }}
        />
        <div
          className="flex flex-col items-center justify-center"
          style={{
            minHeight: '3.4em',
            opacity: show ? 1 : 0,
            transform: show ? 'none' : 'translateY(8px)',
            transition: 'opacity .9s ease, transform .9s ease',
          }}
        >
          <p
            className="font-serif italic text-muted-foreground/70 leading-relaxed"
            style={{ fontSize: 'clamp(1.05rem, 2.6vw, 1.6rem)' }}
          >
            {text}
          </p>
          {author && (
            <p className="font-serif text-muted-foreground/40 text-xs md:text-sm tracking-[0.2em] mt-6">
              {author}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
