import React from 'react'

/* ------------------------------------------------------------------ *
 * The shell every page-in-progress uses.
 *
 * The alternative was four pages that each say "coming soon" and nothing
 * else, which is a worse lie than an empty route: it looks finished and
 * isn't. This says plainly what the page is for, what it will show, and
 * what is actually blocking it — so the page is useful to read even
 * before it has any data in it.
 *
 * When a page gets its data, it stops importing this and becomes a real
 * component. Nothing here is meant to survive.
 * ------------------------------------------------------------------ */

export default function WipPage({
  onBack,
  eyebrow,
  title,
  tint = 'var(--color-accent)',
  intro,
  planned = [],
  blocked = null,
  source = null,
  children,
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 sm:px-6 py-8 sm:py-12">

        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-mono"
            style={{
              color: '#E0A33C',
              background: 'rgba(224,163,60,0.10)',
              boxShadow: 'inset 0 0 0 1px rgba(224,163,60,0.32)',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: 999, background: '#E0A33C' }} />
            work in progress
          </span>
        </div>

        <header className="mt-8 sm:mt-12">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em]" style={{ color: tint }}>
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">{title}</h1>
          {intro && (
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground max-w-prose">
              {intro}
            </p>
          )}
        </header>

        {children}

        {planned.length > 0 && (
          <section className="mt-10">
            <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
              What goes here
            </h2>
            <ul className="mt-4 space-y-3">
              {planned.map((p) => (
                <li
                  key={p.title}
                  className="rounded-xl px-4 py-3.5"
                  style={{
                    background: 'color-mix(in oklab, var(--color-card) 60%, transparent)',
                    boxShadow: 'inset 0 0 0 1px var(--color-border)',
                  }}
                >
                  <p className="text-[14px] font-medium">{p.title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{p.note}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {blocked && (
          <section
            className="mt-8 rounded-xl px-4 py-3.5"
            style={{
              background: 'rgba(224,163,60,0.07)',
              boxShadow: 'inset 0 0 0 1px rgba(224,163,60,0.24)',
            }}
          >
            <p className="text-[11px] font-mono uppercase tracking-[0.16em]" style={{ color: '#E0A33C' }}>
              What's holding it up
            </p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{blocked}</p>
          </section>
        )}

        {source && (
          <p className="mt-8 text-[12px] text-muted-foreground">{source}</p>
        )}
      </div>
    </div>
  )
}
