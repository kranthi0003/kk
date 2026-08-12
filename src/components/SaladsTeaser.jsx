import React, { useEffect, useState } from 'react'

// Homepage "In the kitchen" section — a teaser for #/salads.
//
// The salad data is a small payload that nothing above the fold needs, so the
// fetch is deferred to browser idle time rather than competing with the hero.
// If it fails the section renders nothing rather than putting a broken box on
// the homepage.
//
// The featured salad rotates by the day so the section isn't static, but it is
// derived from the date rather than random — the same salad all day, not a
// different one on every re-render.

const dayIndex = () => {
  const now = new Date()
  const start = Date.UTC(now.getUTCFullYear(), 0, 0)
  return Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - start) / 86400000)
}

const DIET_LABEL = { vegan: 'Vegan', vegetarian: 'Vegetarian', seafood: 'Seafood', meat: 'Meat' }

export default function SaladsTeaser() {
  const [data, setData] = useState(undefined) // undefined=loading, null=failed

  useEffect(() => {
    let alive = true
    const load = () => {
      fetch(`${import.meta.env.BASE_URL}salads.json`)
        .then(r => { if (!r.ok) throw new Error('bad'); return r.json() })
        .then(d => {
          if (!alive) return
          if (!d?.salads?.length) throw new Error('empty')
          setData(d)
        })
        .catch(() => { if (alive) setData(null) })
    }
    const idle = typeof window.requestIdleCallback === 'function'
    const id = idle ? window.requestIdleCallback(load, { timeout: 2000 }) : window.setTimeout(load, 250)
    return () => {
      alive = false
      if (idle) window.cancelIdleCallback(id)
      else window.clearTimeout(id)
    }
  }, [])

  const go = () => { window.location.hash = '#/salads' }

  // A failed fetch removes the section entirely — it is a nice-to-have, and an
  // error card on the homepage would cost more than the section is worth.
  if (data === null) return null

  const all = data?.salads || []
  const start = all.length ? dayIndex() % all.length : 0
  const rotated = all.length ? [...all.slice(start), ...all.slice(0, start)] : []
  const featured = rotated[0]
  const more = rotated.slice(1, 5)

  return (
    <section className="py-20 sm:py-28 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-baseline justify-between gap-4 mb-6">
          <p className="text-[11px] font-mono uppercase tracking-[0.28em]" style={{ color: 'var(--color-brand)' }}>
            In the kitchen
          </p>
          {all.length > 0 && (
            <button onClick={go} className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
              All {all.length} salads →
            </button>
          )}
        </div>

        {!data ? (
          // Skeleton sized like the real thing so the page doesn't jump.
          <div aria-hidden="true">
            <div className="rounded-2xl mb-4 animate-pulse" style={{ height: 232, background: 'color-mix(in oklab, var(--color-card) 55%, transparent)', border: '1px solid var(--color-border)' }} />
            <div className="rounded-2xl animate-pulse" style={{ height: 216, background: 'color-mix(in oklab, var(--color-card) 40%, transparent)', border: '1px solid var(--color-border)' }} />
          </div>
        ) : (
          <>
            <button
              onClick={go}
              className="hover-lift group block w-full text-left rounded-2xl overflow-hidden mb-4"
              style={{
                background: 'color-mix(in oklab, var(--color-card) 55%, transparent)',
                border: '1px solid var(--color-border)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'color-mix(in oklab, var(--color-brand) 38%, transparent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
            >
              <div className="flex items-stretch">
                <img
                  src={featured.thumb}
                  alt=""
                  loading="lazy"
                  width="128"
                  height="128"
                  className="w-28 sm:w-36 object-cover flex-shrink-0"
                  style={{ background: 'color-mix(in oklab, var(--color-foreground) 8%, transparent)' }}
                />
                <div className="p-5 sm:p-7 min-w-0 flex-1">
                  <div className="text-[11px] font-mono uppercase tracking-[0.28em] mb-2.5" style={{ color: 'var(--color-brand)' }}>
                    Today's pick
                  </div>
                  <h3 className="font-heading text-[clamp(1.15rem,3vw,1.6rem)] leading-tight mb-2" style={{ fontWeight: 500 }}>
                    {featured.name}
                  </h3>
                  <p className="text-[13px] text-muted-foreground">
                    {[featured.cuisine, DIET_LABEL[featured.diet]].filter(Boolean).join(' · ')}
                    {' · '}{featured.ingredients.length} ingredients
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium" style={{ color: 'var(--color-brand)' }}>
                    See what's in it
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                </div>
              </div>
            </button>

            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)', background: 'color-mix(in oklab, var(--color-card) 40%, transparent)' }}>
              {more.map((s, i) => (
                <button
                  key={s.id}
                  onClick={go}
                  className="group w-full text-left flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
                  style={{ borderTop: i ? '1px solid color-mix(in oklab, var(--color-border) 60%, transparent)' : 'none' }}
                >
                  <img src={s.thumb} alt="" loading="lazy" width="36" height="36" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-medium text-foreground truncate group-hover:text-accent transition-colors">{s.name}</div>
                    <div className="text-[11.5px] text-muted-foreground truncate mt-0.5">
                      {[s.cuisine, DIET_LABEL[s.diet]].filter(Boolean).join(' \u00b7 ')} {'\u00b7'} {s.ingredients.length} ingredients
                    </div>
                  </div>
                  <svg className="w-4 h-4 flex-shrink-0 text-muted-foreground/50 group-hover:text-accent group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
