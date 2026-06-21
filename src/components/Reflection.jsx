import React from 'react'

// A quiet, full-width interstitial — a single reflective line with room to breathe.
export default function Reflection({ children, by }) {
  return (
    <section className="py-24 sm:py-32 px-6">
      <div className="max-w-2xl mx-auto text-center">
        <span
          aria-hidden="true"
          className="block w-px h-10 mx-auto mb-10"
          style={{ background: 'linear-gradient(to bottom, transparent, color-mix(in oklab, var(--color-border) 90%, transparent))' }}
        />
        <p
          className="font-serif italic text-muted-foreground/70 leading-relaxed"
          style={{ fontSize: 'clamp(1.05rem, 2.6vw, 1.6rem)' }}
        >
          {children}
        </p>
        {by && (
          <p className="font-serif text-muted-foreground/40 text-xs md:text-sm tracking-[0.2em] mt-6">
            {by}
          </p>
        )}
      </div>
    </section>
  )
}
