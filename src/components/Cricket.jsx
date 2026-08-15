import React, { useEffect, useMemo, useState } from 'react'

/* ------------------------------------------------------------------ *
 * #/cricket — the rankings, the tours and what was played this week.
 *
 * Everything on this page is built at deploy time by scripts/gen-cricket.mjs
 * and shipped as cricket.json, so the page paints complete and needs no key,
 * no proxy and no third-party script at runtime. The two sources are the
 * ICC ranking tables and the season tour list on Wikipedia, and Cricsheet's
 * ball-by-ball archive for results. Both are credited at the foot.
 *
 * It leans India-first because that is who I watch: India's place in all
 * three formats leads the page, and an India series is what gets promoted
 * to the top when one is on.
 *
 * The palette is a cricket ball rather than the site accent — dark leather
 * red with white stitching for the dividers, turf green for the live
 * markers, saffron to pick India out of a table.
 * ------------------------------------------------------------------ */

const FORMATS = [
  { key: 'test', label: 'Test' },
  { key: 'odi', label: 'ODI' },
  { key: 't20i', label: 'T20I' },
]

const ME = 'India'

const day = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

const daysUntil = (iso) =>
  Math.ceil((new Date(`${iso}T00:00:00Z`).getTime() - Date.now()) / 86400000)

function Reveal({ children, className = '', delay = 0 }) {
  const ref = React.useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -6% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={`ck-reveal${shown ? ' ck-in' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

const Seam = () => <div className="ck-seam" aria-hidden="true" />

const Shell = ({ children, id }) => (
  <section id={id} className="max-w-3xl mx-auto px-5 sm:px-6 py-7 sm:py-9">
    {children}
  </section>
)

const SectionTitle = ({ children, note }) => (
  <div className="flex items-baseline justify-between gap-4 mb-5">
    <h2 className="ck-h2">
      <span className="ck-tick" aria-hidden="true" />
      {children}
    </h2>
    {note && <span className="ck-note shrink-0">{note}</span>}
  </div>
)

// The scoreline a tour has produced so far, format by format. A series score
// only counts decided matches, so an unplayed or drawn game shows as the
// scheduled count in brackets rather than silently going missing.
function Formats({ formats, compact }) {
  const live = FORMATS.filter((f) => formats?.[f.key])
  if (!live.length) return null
  return (
    <div className={`ck-formats${compact ? ' ck-formats-sm' : ''}`}>
      {live.map((f) => {
        const v = formats[f.key]
        return (
          <span key={f.key} className="ck-fmt">
            <span className="ck-fmt-k">{f.label}</span>
            <span className="ck-fmt-v">{v.result || `${v.matches} to play`}</span>
          </span>
        )
      })}
    </div>
  )
}

function TourCard({ tour, featured }) {
  const away = daysUntil(tour.start)
  const when =
    tour.status === 'live'
      ? 'On now'
      : away <= 0
        ? 'Under way'
        : away === 1
          ? 'Starts tomorrow'
          : `Starts in ${away} days`

  return (
    <div className={`ck-tour${featured ? ' ck-tour-big' : ''}`}>
      <div className="ck-tour-top">
        <span className={`ck-tag${tour.status === 'live' ? ' ck-tag-live' : ''}`}>
          {tour.status === 'live' && <span className="ck-pip" aria-hidden="true" />}
          {when}
        </span>
        <span className="ck-note">
          {day(tour.start)} – {day(tour.ends)}
        </span>
      </div>
      <h3 className="ck-tour-name">
        <span className={tour.away === 'IND' ? 'ck-me' : ''}>{tour.awayName}</span>
        <span className="ck-vs">in</span>
        <span className={tour.home === 'IND' ? 'ck-me' : ''}>{tour.homeName}</span>
      </h3>
      <Formats formats={tour.formats} compact={!featured} />
    </div>
  )
}

function RankTable({ rows }) {
  const top = rows?.[0]?.rating || 1
  return (
    <div className="ck-rank">
      {(rows || []).map((r) => {
        const me = r.team === ME
        return (
          <div key={r.code + r.pos} className={`ck-row${me ? ' ck-row-me' : ''}`}>
            <span
              className="ck-bar"
              style={{ width: `${Math.max(4, (r.rating / top) * 100)}%` }}
              aria-hidden="true"
            />
            <span className="ck-pos">{r.pos}</span>
            <span className="min-w-0 flex-1 relative">
              <span className="block text-[14.5px] font-medium leading-tight truncate">
                {r.team}
              </span>
              <span className="ck-sub block truncate">{r.matches} matches</span>
            </span>
            <span className="ck-rating">{r.rating}</span>
          </div>
        )
      })}
    </div>
  )
}

function Result({ m }) {
  const line = m.winner
    ? `${m.winner} won by ${m.margin}`
    : m.margin || 'No result'
  return (
    <div className="ck-res">
      <div className="ck-res-head">
        <span className="ck-res-teams">
          <span className={m.teams[0] === ME ? 'ck-me' : ''}>{m.teams[0]}</span>
          <span className="ck-vs">v</span>
          <span className={m.teams[1] === ME ? 'ck-me' : ''}>{m.teams[1]}</span>
        </span>
        <span className="ck-note shrink-0">
          {m.type}
          {m.gender === 'female' ? ' W' : ''} · {day(m.date)}
        </span>
      </div>
      <div className="ck-res-line">{line}</div>
      {(m.event || m.city) && (
        <div className="ck-sub truncate">
          {[m.event, m.city].filter(Boolean).join(' · ')}
        </div>
      )}
    </div>
  )
}

export default function Cricket({ onBack }) {
  const [data, setData] = useState(undefined) // undefined = loading, null = failed
  const [format, setFormat] = useState('odi')
  const [scope, setScope] = useState(null) // 'india' | 'intl' | 'all'
  const [more, setMore] = useState(false)

  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}cricket.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => alive && setData(d))
      .catch(() => alive && setData(null))
    return () => {
      alive = false
    }
  }, [])

  // India first if there is anything to show, otherwise straight to the wider
  // international list — an empty default panel would look broken.
  useEffect(() => {
    if (!data || scope) return
    const hasIndia = (data.recent || []).some((m) => m.teams.includes(ME))
    setScope(hasIndia ? 'india' : 'intl')
  }, [data, scope])

  // India's line across the three formats is the headline, so it is worth
  // resolving once rather than searching three tables in the markup.
  const mine = useMemo(() => {
    if (!data) return []
    return FORMATS.map((f) => ({
      ...f,
      row: (data.rankings?.[f.key] || []).find((r) => r.team === ME) || null,
    }))
  }, [data])

  const live = useMemo(
    () => (data?.tours || []).filter((t) => t.status === 'live'),
    [data]
  )
  const upcoming = useMemo(
    () => (data?.tours || []).filter((t) => t.status === 'upcoming'),
    [data]
  )
  const done = useMemo(
    () => (data?.tours || []).filter((t) => t.status === 'done').reverse(),
    [data]
  )

  // An India series outranks everything else for the top slot.
  const featured = useMemo(() => {
    const pool = live.length ? live : upcoming
    return pool.find((t) => t.home === 'IND' || t.away === 'IND') || pool[0] || null
  }, [live, upcoming])

  const rest = useMemo(
    () => (live.length ? live : upcoming).filter((t) => t !== featured),
    [live, upcoming, featured]
  )

  const results = useMemo(() => {
    const all = data?.recent || []
    if (scope === 'all') return all
    if (scope === 'intl') return all.filter((m) => m.international)
    return all.filter((m) => m.teams.includes(ME))
  }, [data, scope])

  const shown = more ? results : results.slice(0, 8)

  return (
    <div className="ck-root">
      <button onClick={onBack} title="Back" className="ck-back">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Back</span>
      </button>

      <header className="ck-hero">
        <div className="max-w-3xl mx-auto px-5 sm:px-6">
          <h1 className="ck-h1">Cricket</h1>
          <p className="ck-lede">
            Where India stand, what&rsquo;s being played, and how the last few
            weeks finished.
          </p>

          {data && (
            <div className="ck-mine">
              {mine.map(({ key, label, row }) => (
                <div key={key} className="ck-mine-cell">
                  <span className="ck-mine-fmt">{label}</span>
                  {row ? (
                    <>
                      <span className="ck-mine-pos">
                        <b>{row.pos}</b>
                        <i>{row.pos === 1 ? 'st' : row.pos === 2 ? 'nd' : row.pos === 3 ? 'rd' : 'th'}</i>
                      </span>
                      <span className="ck-mine-rat">{row.rating} pts</span>
                    </>
                  ) : (
                    <span className="ck-mine-rat">—</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      <Seam />

      {data === undefined && (
        <Shell>
          <div className="ck-state">Taking guard…</div>
        </Shell>
      )}
      {data === null && (
        <Shell>
          <div className="ck-state">Couldn&rsquo;t load the cricket right now.</div>
        </Shell>
      )}

      {data && (
        <>
          {featured && (
            <Shell>
              <Reveal>
                <SectionTitle note={live.length ? `${live.length} on` : 'next'}>
                  {live.length ? 'Out in the middle' : 'Next up'}
                </SectionTitle>
                <TourCard tour={featured} featured />
                {rest.length > 0 && (
                  <div className="ck-tour-grid">
                    {rest.slice(0, 4).map((t) => (
                      <TourCard key={t.name + t.start} tour={t} />
                    ))}
                  </div>
                )}
              </Reveal>
            </Shell>
          )}

          <Shell>
            <Reveal>
              <SectionTitle note="ICC ratings">Rankings</SectionTitle>
              <div className="ck-tabs" role="tablist">
                {FORMATS.map((f) => (
                  <button
                    key={f.key}
                    role="tab"
                    aria-selected={format === f.key}
                    onClick={() => setFormat(f.key)}
                    className={`ck-tab${format === f.key ? ' ck-tab-on' : ''}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <RankTable rows={data.rankings?.[format]} />
            </Reveal>
          </Shell>

          <Shell>
            <Reveal>
              <SectionTitle note={`${results.length} matches`}>
                Recently played
              </SectionTitle>
              <div className="ck-switch">
                {[
                  { k: 'india', label: 'India' },
                  { k: 'intl', label: 'Internationals' },
                  { k: 'all', label: 'Everything' },
                ].map((s) => (
                  <button
                    key={s.k}
                    onClick={() => {
                      setScope(s.k)
                      setMore(false)
                    }}
                    className={`ck-chip${scope === s.k ? ' ck-chip-on' : ''}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="ck-res-list">
                {shown.map((m, i) => (
                  <Result key={`${m.date}-${m.teams.join('-')}-${i}`} m={m} />
                ))}
              </div>
              {results.length > shown.length && (
                <button onClick={() => setMore(true)} className="ck-more">
                  Show {results.length - shown.length} more
                </button>
              )}
            </Reveal>
          </Shell>

          {done.length > 0 && (
            <Shell>
              <Reveal>
                <SectionTitle note={`${data.season} season`}>
                  Tours already done
                </SectionTitle>
                <div className="ck-past">
                  {done.map((t) => (
                    <div key={t.name + t.start} className="ck-past-row">
                      <span className="ck-past-date">{day(t.start)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] truncate">
                          <span className={t.away === 'IND' ? 'ck-me' : ''}>
                            {t.awayName}
                          </span>{' '}
                          in{' '}
                          <span className={t.home === 'IND' ? 'ck-me' : ''}>
                            {t.homeName}
                          </span>
                        </span>
                        <Formats formats={t.formats} compact />
                      </span>
                    </div>
                  ))}
                </div>
              </Reveal>
            </Shell>
          )}

          <Seam />

          <Shell>
            <div className="ck-foot">
              <p>
                Rankings and the tour calendar come from Wikipedia; results come
                from Cricsheet&rsquo;s ball-by-ball archive. Built with the site,
                not fetched live — so the numbers are current as of the last
                deploy.
              </p>
              <p className="ck-foot-links">
                {(data.sources || []).map((s) => (
                  <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                    {s.name}
                  </a>
                ))}
              </p>
              {data.generated && (
                <p className="ck-note">
                  Updated {day(data.generated.slice(0, 10))}
                </p>
              )}
            </div>
          </Shell>
        </>
      )}

      <style>{`
        .ck-root {
          --ck-bg: #07110C;
          --ck-card: #0E1A13;
          --ck-line: #1D3327;
          --ck-fg: #F0F5F1;
          --ck-dim: #8CA396;
          --ck-turf: #35B96C;
          --ck-ball: #A11E1E;
          --ck-india: #FF9A3C;
          position: relative;
          min-height: 100vh;
          background: var(--ck-bg);
          color: var(--ck-fg);
        }
        .ck-back {
          position: fixed; top: 1rem; left: 1rem; z-index: 40;
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .5rem .7rem; border-radius: 9999px;
          font-size: 12px; letter-spacing: .02em;
          color: var(--ck-dim);
          background: rgba(7,17,12,.72);
          border: 1px solid var(--ck-line);
          backdrop-filter: blur(8px);
          transition: color .2s ease, border-color .2s ease;
        }
        .ck-back:hover { color: #fff; border-color: var(--ck-turf); }

        .ck-hero {
          padding: 5.5rem 0 2.25rem;
          background:
            radial-gradient(120% 80% at 50% 0%, rgba(53,185,108,.14) 0%, transparent 62%),
            var(--ck-bg);
        }
        .ck-h1 {
          font-size: clamp(2.6rem, 11vw, 4.6rem);
          font-weight: 600; letter-spacing: -.035em; line-height: .95;
        }
        .ck-lede {
          margin-top: .85rem; max-width: 34rem;
          font-size: 14px; line-height: 1.6; color: var(--ck-dim);
        }
        .ck-mine {
          margin-top: 1.6rem;
          display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: .5rem;
        }
        .ck-mine-cell {
          padding: .7rem .8rem; border-radius: .7rem;
          background: var(--ck-card); border: 1px solid var(--ck-line);
        }
        .ck-mine-fmt {
          display: block; font-family: ui-monospace, monospace;
          font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase;
          color: var(--ck-dim);
        }
        .ck-mine-pos { display: block; margin-top: .25rem; color: var(--ck-india); }
        .ck-mine-pos b { font-size: 1.55rem; font-weight: 600; letter-spacing: -.02em; }
        .ck-mine-pos i { font-style: normal; font-size: .8rem; margin-left: .1rem; }
        .ck-mine-rat {
          display: block; font-family: ui-monospace, monospace;
          font-size: 11px; color: var(--ck-dim);
        }

        /* The mown outfield with a painted crease along the top. The first
           version of this was a red band with white stitching — meant as a
           ball seam, but a thin red-and-white striped bar is a racing kerb
           no matter what you call it, and it dragged the F1 page onto this
           one. Green on green with a crease line can only be cricket. */
        .ck-seam {
          height: 14px;
          border-top: 1px solid rgba(240,245,241,.5);
          background:
            repeating-linear-gradient(90deg,
              rgba(255,255,255,.06) 0 16px,
              rgba(0,0,0,.11) 30px 46px,
              rgba(255,255,255,.06) 60px),
            linear-gradient(180deg, rgba(53,185,108,.22), rgba(53,185,108,0));
        }

        .ck-state {
          height: 8rem; display: flex; align-items: center; justify-content: center;
          color: var(--ck-dim); font-size: 13px;
        }
        .ck-h2 {
          display: flex; align-items: center; gap: .6rem;
          font-weight: 500; font-size: clamp(1.35rem, 3.4vw, 1.9rem);
        }
        .ck-tick {
          width: 4px; height: 1.15em; border-radius: 2px;
          background: var(--ck-turf); flex-shrink: 0;
        }
        .ck-note { font-family: ui-monospace, monospace; font-size: 11px; color: var(--ck-dim); opacity: .9; }
        .ck-sub { font-size: 11.5px; color: var(--ck-dim); }
        .ck-me { color: var(--ck-india); }
        .ck-vs { margin: 0 .4rem; color: var(--ck-dim); font-size: .82em; }

        .ck-tour {
          padding: .95rem 1rem; border-radius: .85rem;
          background: var(--ck-card); border: 1px solid var(--ck-line);
        }
        .ck-tour-big { padding: 1.15rem 1.2rem; }
        .ck-tour-top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .ck-tour-name {
          margin-top: .5rem;
          font-size: clamp(1.05rem, 3.6vw, 1.4rem); font-weight: 500; letter-spacing: -.01em;
        }
        .ck-tour-grid {
          margin-top: .6rem;
          display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: .6rem;
        }
        .ck-tag {
          display: inline-flex; align-items: center; gap: .4rem;
          font-family: ui-monospace, monospace; font-size: 10.5px;
          letter-spacing: .07em; text-transform: uppercase; color: var(--ck-dim);
        }
        .ck-tag-live { color: var(--ck-turf); }
        .ck-pip {
          width: 6px; height: 6px; border-radius: 9999px;
          background: var(--ck-turf); animation: ck-pulse 1.8s ease-in-out infinite;
        }
        @keyframes ck-pulse { 0%,100% { opacity: 1 } 50% { opacity: .25 } }

        .ck-formats { margin-top: .7rem; display: flex; flex-wrap: wrap; gap: .4rem; }
        .ck-fmt {
          display: inline-flex; align-items: baseline; gap: .35rem;
          padding: .25rem .5rem; border-radius: .4rem;
          background: rgba(255,255,255,.04); border: 1px solid var(--ck-line);
        }
        .ck-fmt-k {
          font-family: ui-monospace, monospace; font-size: 9.5px;
          letter-spacing: .07em; text-transform: uppercase; color: var(--ck-dim);
        }
        .ck-fmt-v { font-size: 12.5px; }
        .ck-formats-sm .ck-fmt-v { font-size: 11.5px; }
        .ck-formats-sm { margin-top: .45rem; }

        .ck-tabs { display: flex; gap: .35rem; margin-bottom: .75rem; }
        .ck-tab {
          padding: .35rem .8rem; border-radius: 9999px;
          font-size: 12px; color: var(--ck-dim);
          border: 1px solid var(--ck-line); background: transparent;
          transition: color .18s ease, border-color .18s ease, background .18s ease;
        }
        .ck-tab:hover { color: var(--ck-fg); }
        .ck-tab-on { color: #061009; background: var(--ck-turf); border-color: var(--ck-turf); }

        .ck-rank { display: flex; flex-direction: column; gap: .3rem; }
        .ck-row {
          position: relative; overflow: hidden;
          display: flex; align-items: center; gap: .7rem;
          padding: .55rem .7rem; border-radius: .55rem;
          border: 1px solid transparent;
        }
        .ck-row-me { background: var(--ck-card); border-color: var(--ck-line); }
        .ck-bar {
          position: absolute; left: 0; top: 0; bottom: 0;
          background: var(--ck-turf); opacity: .12;
        }
        .ck-row-me .ck-bar { background: var(--ck-india); opacity: .16; }
        .ck-pos {
          position: relative; width: 1.4rem; flex-shrink: 0;
          font-family: ui-monospace, monospace; font-size: 12px; color: var(--ck-dim);
        }
        .ck-rating {
          position: relative; font-family: ui-monospace, monospace;
          font-size: 14px; font-weight: 600;
        }
        .ck-row-me .ck-rating { color: var(--ck-india); }

        .ck-switch { display: flex; gap: .35rem; margin-bottom: .75rem; }
        .ck-chip {
          padding: .3rem .7rem; border-radius: 9999px;
          font-size: 11.5px; color: var(--ck-dim);
          border: 1px solid var(--ck-line); background: transparent;
          transition: color .18s ease, border-color .18s ease;
        }
        .ck-chip:hover { color: var(--ck-fg); }
        .ck-chip-on { color: var(--ck-fg); border-color: var(--ck-turf); }

        .ck-res-list { display: flex; flex-direction: column; gap: .4rem; }
        .ck-res {
          padding: .6rem .75rem; border-radius: .6rem;
          background: var(--ck-card); border: 1px solid var(--ck-line);
        }
        .ck-res-head { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; }
        .ck-res-teams { font-size: 13.5px; font-weight: 500; min-width: 0; }
        .ck-res-line { margin-top: .15rem; font-size: 12.5px; color: var(--ck-turf); }
        .ck-more {
          margin-top: .7rem; width: 100%;
          padding: .5rem; border-radius: .55rem;
          font-size: 12px; color: var(--ck-dim);
          border: 1px dashed var(--ck-line); background: transparent;
          transition: color .18s ease, border-color .18s ease;
        }
        .ck-more:hover { color: var(--ck-fg); border-color: var(--ck-turf); }

        .ck-past { display: flex; flex-direction: column; }
        .ck-past-row {
          display: flex; align-items: flex-start; gap: .8rem;
          padding: .6rem 0; border-bottom: 1px solid var(--ck-line);
        }
        .ck-past-row:last-child { border-bottom: 0; }
        .ck-past-date {
          width: 3.6rem; flex-shrink: 0; padding-top: .1rem;
          font-family: ui-monospace, monospace; font-size: 11px; color: var(--ck-dim);
        }

        .ck-foot { font-size: 12px; color: var(--ck-dim); line-height: 1.65; }
        .ck-foot-links { margin-top: .5rem; display: flex; flex-wrap: wrap; gap: .9rem; }
        .ck-foot-links a { color: var(--ck-dim); text-decoration: underline; text-underline-offset: 3px; }
        .ck-foot-links a:hover { color: var(--ck-turf); }

        .ck-reveal {
          opacity: 0; transform: translateY(14px);
          transition: opacity .6s ease, transform .6s cubic-bezier(.22,.61,.36,1);
        }
        .ck-in { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) {
          .ck-reveal { opacity: 1; transform: none; transition: none; }
          .ck-pip { animation: none; }
        }
      `}</style>
    </div>
  )
}
