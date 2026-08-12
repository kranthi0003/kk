import React, { useEffect, useMemo, useState } from 'react'

// The salads page (#/salads).
//
// Data comes from public/salads.json, assembled at build time by
// scripts/gen-salads.mjs. Ingredients are published in full because an
// ingredient list is a statement of fact; the method belongs to whoever wrote
// the recipe, so each salad links out to its source instead of reprinting it.

const ACCENT = '#4ade80'

function Chip({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
      style={active
        ? { background: ACCENT, color: '#052e16' }
        : { background: 'color-mix(in oklab, var(--color-foreground) 6%, transparent)', color: 'var(--color-muted-foreground)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}
    >
      {children}
      {count != null && <span className="ml-1.5 opacity-60 tabular-nums">{count}</span>}
    </button>
  )
}

function SaladCard({ salad, open, onToggle }) {
  const { name, cuisine, category, ingredients, source, sourceHost, video, thumb, photo } = salad

  return (
    <article
      className="rounded-2xl overflow-hidden transition-shadow"
      style={{ border: '1px solid var(--color-border)', background: 'color-mix(in oklab, var(--color-card) 55%, transparent)' }}
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-center gap-3.5 p-3 text-left transition-colors hover:bg-foreground/5"
      >
        <img
          src={open && photo ? photo : thumb}
          alt=""
          loading="lazy"
          width="64"
          height="64"
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          style={{ background: 'color-mix(in oklab, var(--color-foreground) 8%, transparent)' }}
        />
        <span className="flex-1 min-w-0">
          <span className="block text-[14px] font-semibold leading-snug">{name}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            {cuisine && (
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: `color-mix(in oklab, ${ACCENT} 16%, transparent)`, color: `color-mix(in oklab, ${ACCENT} 70%, var(--color-foreground))` }}>
                {cuisine}
              </span>
            )}
            {category && (
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: 'color-mix(in oklab, var(--color-foreground) 7%, transparent)', color: 'var(--color-muted-foreground)' }}>
                {category}
              </span>
            )}
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {ingredients.length} ingredients
            </span>
          </span>
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0 text-muted-foreground transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="px-3 pb-3.5 -mt-0.5">
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 mb-3.5 pt-2.5"
            style={{ borderTop: '1px solid color-mix(in oklab, var(--color-border) 70%, transparent)' }}>
            {ingredients.map((ing, i) => (
              <li key={`${ing.item}-${i}`} className="flex items-baseline gap-2 py-1">
                <span aria-hidden="true" className="w-1 h-1 rounded-full flex-shrink-0 translate-y-[-2px]" style={{ background: ACCENT }} />
                <span className="text-[13px] leading-snug">{ing.item}</span>
                {ing.qty && (
                  <span className="ml-auto text-[11.5px] font-mono text-muted-foreground text-right flex-shrink-0 pl-2">{ing.qty}</span>
                )}
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-2">
            {source && (
              <a
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 rounded-lg transition-transform hover:scale-[1.02]"
                style={{ background: ACCENT, color: '#052e16' }}
              >
                Method at {sourceHost} ↗
              </a>
            )}
            {video && (
              <a
                href={video}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-foreground/5"
                style={{ color: 'var(--color-muted-foreground)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}
              >
                Watch ↗
              </a>
            )}
          </div>
        </div>
      )}
    </article>
  )
}

export default function SaladsPage({ onBack }) {
  const [data, setData] = useState(undefined) // undefined=loading, null=error
  const [diet, setDiet] = useState('all')
  const [cuisine, setCuisine] = useState('all')
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}salads.json`)
      .then(r => { if (!r.ok) throw new Error('bad'); return r.json() })
      .then(d => {
        if (!alive) return
        if (!d?.salads?.length) throw new Error('empty')
        setData(d)
      })
      .catch(() => { if (alive) setData(null) })
    return () => { alive = false }
  }, [])

  const salads = data?.salads || []

  const cuisines = useMemo(
    () => [...new Set(salads.map(s => s.cuisine).filter(Boolean))].sort(),
    [salads]
  )

  const dietCounts = useMemo(() => {
    const c = { vegetarian: 0, vegan: 0, seafood: 0, meat: 0 }
    for (const s of salads) if (s.diet && c[s.diet] != null) c[s.diet]++
    return c
  }, [salads])

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return salads.filter(s => {
      if (diet !== 'all' && s.diet !== diet) return false
      if (cuisine !== 'all' && s.cuisine !== cuisine) return false
      if (!needle) return true
      // Searching ingredients is the point: "what can I make with fennel?"
      return s.name.toLowerCase().includes(needle)
        || s.ingredients.some(i => i.item.toLowerCase().includes(needle))
    })
  }, [salads, diet, cuisine, q])

  return (
    <div className="min-h-screen text-foreground" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back
          </button>
          {data && (
            <span className="text-[11px] font-mono text-muted-foreground/60 tabular-nums">{salads.length} salads</span>
          )}
        </div>

        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Salads</h1>
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            A shelf of salads worth making, from{' '}
            <a href="https://www.themealdb.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">TheMealDB</a>.
            Every ingredient is listed here so you can see what you're in for. The method stays with the
            cook who wrote it — each one links straight to the original.
          </p>
        </header>

        {data === undefined && (
          <div className="h-40 flex items-center justify-center">
            <span className="text-xs font-mono text-muted-foreground animate-pulse">tossing…</span>
          </div>
        )}

        {data === null && (
          <div className="text-center py-12 rounded-2xl" style={{ border: '1px solid var(--color-border)' }}>
            <p className="text-[14px] text-muted-foreground mb-3">Couldn't load the salads right now.</p>
            <a href="https://www.themealdb.com/" target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium" style={{ color: ACCENT }}>
              Browse TheMealDB ↗
            </a>
          </div>
        )}

        {data && (
          <>
            <div className="mb-4">
              <input
                type="search"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search a salad or an ingredient…"
                aria-label="Search salads by name or ingredient"
                className="w-full text-[14px] px-4 py-2.5 rounded-xl outline-none transition-shadow focus:shadow-md"
                style={{ background: 'color-mix(in oklab, var(--color-card) 55%, transparent)', border: '1px solid var(--color-border)', color: 'var(--color-foreground)' }}
              />
            </div>

            <div className="flex flex-wrap gap-1.5 mb-2.5">
              <Chip active={diet === 'all'} onClick={() => setDiet('all')} count={salads.length}>All</Chip>
              <Chip active={diet === 'vegetarian'} onClick={() => setDiet('vegetarian')} count={dietCounts.vegetarian}>Vegetarian</Chip>
              {dietCounts.vegan > 0 && <Chip active={diet === 'vegan'} onClick={() => setDiet('vegan')} count={dietCounts.vegan}>Vegan</Chip>}
              <Chip active={diet === 'seafood'} onClick={() => setDiet('seafood')} count={dietCounts.seafood}>Seafood</Chip>
              <Chip active={diet === 'meat'} onClick={() => setDiet('meat')} count={dietCounts.meat}>Meat</Chip>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-5">
              <Chip active={cuisine === 'all'} onClick={() => setCuisine('all')}>Every cuisine</Chip>
              {cuisines.map(c => (
                <Chip key={c} active={cuisine === c} onClick={() => setCuisine(c)}>{c}</Chip>
              ))}
            </div>

            {shown.length === 0 ? (
              <p className="text-center text-[14px] text-muted-foreground py-12">
                Nothing matches that. <button onClick={() => { setQ(''); setDiet('all'); setCuisine('all') }} className="underline underline-offset-2 hover:text-foreground">Clear the filters</button>.
              </p>
            ) : (
              <div className="space-y-2.5">
                {shown.map(s => (
                  <SaladCard
                    key={s.id}
                    salad={s}
                    open={openId === s.id}
                    onToggle={() => setOpenId(id => (id === s.id ? null : s.id))}
                  />
                ))}
              </div>
            )}

            <p className="text-[11px] text-muted-foreground/70 mt-8 text-center leading-relaxed">
              Recipe data from TheMealDB · every method links to the publisher who wrote it
            </p>
          </>
        )}
      </div>
    </div>
  )
}
