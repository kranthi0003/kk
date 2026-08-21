import React, { useEffect, useMemo, useState } from 'react'

/* ------------------------------------------------------------------ *
 * #/movies — what's coming out.
 *
 * movies.json has been generated on every deploy for a while and only
 * the Sidecar's small card ever read it. This is the page it was always
 * carrying enough data for: 14 upcoming Indian films with posters,
 * release dates, directors and IMDb ids.
 *
 * The one honest wrinkle in the data is that only some films have a
 * confirmed day. The rest are announced for a year with no date. The
 * page keeps those apart rather than inventing a date to sort by —
 * "dated" and "announced" are genuinely different states and collapsing
 * them would be a small lie told for the sake of a tidy list.
 * ------------------------------------------------------------------ */

const TINT = '#D9A05B'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const LANG_TINT = {
  Hindi: '#D9A05B',
  Telugu: '#7FB5A2',
  Tamil: '#C98F9B',
  Kannada: '#9AA8D8',
  Malayalam: '#B3A17E',
  Indian: '#9E9E9E',
}

const parse = (d) => {
  if (!d) return null
  const t = new Date(d + 'T00:00:00Z')
  return Number.isNaN(t.getTime()) ? null : t
}

const fmt = (d) => {
  const t = parse(d)
  if (!t) return null
  return `${t.getUTCDate()} ${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`
}

// Whole days from today, in UTC, so a film released this morning reads
// as today rather than as yesterday.
function daysAway(d) {
  const t = parse(d)
  if (!t) return null
  const now = new Date()
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return Math.round((t.getTime() - today) / 86400000)
}

function countdown(d) {
  const n = daysAway(d)
  if (n == null) return null
  if (n < 0) return 'out now'
  if (n === 0) return 'today'
  if (n === 1) return 'tomorrow'
  if (n < 31) return `in ${n} days`
  const m = Math.round(n / 30.44)
  return m <= 1 ? 'in a month' : `in ${m} months`
}

function Poster({ film }) {
  const [failed, setFailed] = useState(false)
  const tint = LANG_TINT[film.lang] || TINT

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{
        aspectRatio: '2 / 3',
        background: 'color-mix(in oklab, var(--color-card) 70%, transparent)',
        boxShadow: 'inset 0 0 0 1px var(--color-border)',
      }}
    >
      {film.poster && !failed ? (
        <img
          src={film.poster}
          alt={`${film.title} poster`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        // Wikipedia occasionally drops a thumbnail. Say so rather than
        // leaving a broken image icon.
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-3 text-center">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--color-border)' }} aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 9h18M8 4v5M16 4v5" />
          </svg>
          <span className="text-[10.5px] text-muted-foreground">no poster</span>
        </div>
      )}

      <span
        className="absolute top-2 left-2 rounded-full px-2 py-0.5 text-[9.5px] font-mono"
        style={{ color: tint, background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(6px)' }}
      >
        {film.lang || 'Indian'}
      </span>
    </div>
  )
}

function FilmCard({ film }) {
  const when = fmt(film.date)
  const soon = countdown(film.date)
  const tint = LANG_TINT[film.lang] || TINT
  const href = film.imdb ? `https://www.imdb.com/title/${film.imdb}/` : film.url

  const body = (
    <>
      <Poster film={film} />
      <div className="mt-2.5">
        <p className="text-[13.5px] font-medium leading-snug">{film.title}</p>
        {film.by && (
          <p className="mt-0.5 text-[12px] text-muted-foreground truncate">{film.by}</p>
        )}
        <p className="mt-1 text-[11.5px] font-mono tabular-nums" style={{ color: tint }}>
          {when || 'date not announced'}
          {soon && <span className="text-muted-foreground"> · {soon}</span>}
        </p>
      </div>
    </>
  )

  if (!href) return <div className="group">{body}</div>

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block transition-transform hover:-translate-y-0.5"
      title={`${film.title} — open on ${film.imdb ? 'IMDb' : 'Wikipedia'}`}
    >
      {body}
    </a>
  )
}

export default function MoviesPage({ onBack }) {
  const [data, setData] = useState(undefined) // undefined = loading, null = failed
  const [lang, setLang] = useState('all')

  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}movies.json`)
      .then((r) => { if (!r.ok) throw new Error('bad'); return r.json() })
      .then((d) => {
        if (!alive) return
        if (!d?.films?.length) throw new Error('empty')
        setData(d)
      })
      .catch(() => { if (alive) setData(null) })
    return () => { alive = false }
  }, [])

  const films = data?.films || []

  const langs = useMemo(() => {
    const c = new Map()
    films.forEach((f) => c.set(f.lang || 'Indian', (c.get(f.lang || 'Indian') || 0) + 1))
    return [...c.entries()].sort((a, b) => b[1] - a[1])
  }, [films])

  const shown = useMemo(
    () => (lang === 'all' ? films : films.filter((f) => (f.lang || 'Indian') === lang)),
    [films, lang]
  )

  // Dated films sort by date. Undated ones aren't given a fake date to
  // sort by — they're a separate list.
  const dated = useMemo(
    () => shown.filter((f) => parse(f.date)).sort((a, b) => parse(a.date) - parse(b.date)),
    [shown]
  )
  const undated = useMemo(() => shown.filter((f) => !parse(f.date)), [shown])

  const next = dated.find((f) => (daysAway(f.date) ?? -1) >= 0)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-5 sm:px-6 py-8 sm:py-12">

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
          {films.length > 0 && (
            <span className="text-[12px] font-mono text-muted-foreground tabular-nums">
              {films.length} films
            </span>
          )}
        </div>

        <header className="mt-8 sm:mt-12">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em]" style={{ color: TINT }}>
            Coming out
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Films</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground max-w-prose">
            Indian films with a release still ahead of them.
            {next && (
              <> Next up is <span className="text-foreground font-medium">{next.title}</span>, {countdown(next.date)}.</>
            )}
          </p>
        </header>

        {data === undefined && (
          <p className="mt-10 text-[13px] font-mono text-muted-foreground animate-pulse">loading…</p>
        )}

        {data === null && (
          <p className="mt-10 text-[13px] text-muted-foreground">
            The film list didn't load. It's generated at deploy time, so this is usually temporary.
          </p>
        )}

        {films.length > 0 && (
          <>
            <div className="mt-8 flex flex-wrap gap-2">
              <Chip active={lang === 'all'} onClick={() => setLang('all')} count={films.length}>All</Chip>
              {langs.map(([l, n]) => (
                <Chip key={l} active={lang === l} onClick={() => setLang(l)} count={n} tint={LANG_TINT[l]}>
                  {l}
                </Chip>
              ))}
            </div>

            {dated.length > 0 && (
              <section className="mt-8">
                <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  Dated
                </h2>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {dated.map((f) => <FilmCard key={f.title + f.date} film={f} />)}
                </div>
              </section>
            )}

            {undated.length > 0 && (
              <section className="mt-10">
                <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
                  Announced, no date yet
                </h2>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                  {undated.map((f) => <FilmCard key={f.title} film={f} />)}
                </div>
              </section>
            )}

            {shown.length === 0 && (
              <p className="mt-8 text-[13px] text-muted-foreground">Nothing in {lang}.</p>
            )}

            <p className="mt-12 text-[12px] text-muted-foreground">
              {data.source || 'Wikipedia + Wikidata'}
              {data.generated && <> · refreshed {fmt(String(data.generated).slice(0, 10))}</>}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function Chip({ active, onClick, children, count, tint }) {
  const c = tint || TINT
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className="text-[12px] font-medium px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
      style={active
        ? { background: c, color: '#14100B' }
        : { background: 'color-mix(in oklab, var(--color-foreground) 6%, transparent)', color: 'var(--color-muted-foreground)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}
    >
      {children}
      {count != null && <span className="ml-1.5 opacity-60 tabular-nums">{count}</span>}
    </button>
  )
}
