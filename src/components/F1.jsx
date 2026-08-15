import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/* ------------------------------------------------------------------ *
 * #/f1 — the film first, then the championship.
 *
 * The page opens on the film and nothing else: no title, no scrolling, no
 * standings. "Formula 1" fades up over the closing seconds, and only when
 * the film finishes does the rest of the page unlock. There is a skip for
 * anyone who has seen it, and several escape hatches so a video that fails
 * to load can never trap someone on a blank screen.
 *
 * The film is AMD's Radeon PRO x Blender showcase for the Mercedes-AMG
 * Petronas F1 Team, cut between two pure-black frames so it loops without a
 * seam once the page is open, and re-encoded to 1280x720 (21.9MB -> 4.8MB).
 * It is credited in full at the foot of the page.
 *
 * Data is hybrid: f1.json ships with the build so the page is useful the
 * instant it paints, then the standings are re-fetched live and swapped in.
 * ------------------------------------------------------------------ */

// Decorative accents only — close to each team's familiar colour, not an
// attempt at an official livery reference.
const TEAM_COLOR = {
  mercedes: '#00D7B6',
  ferrari: '#E8002D',
  mclaren: '#FF8000',
  red_bull: '#3671C6',
  rb: '#6692FF',
  alpine: '#00A1E8',
  haas: '#B6BABD',
  audi: '#BB0A30',
  williams: '#64C4FF',
  aston_martin: '#229971',
  cadillac: '#C6A664',
}
const teamColor = (id) => TEAM_COLOR[id] || '#8A8A96'

const API = 'https://api.jolpi.ca/ergast/f1'
const TITLE_LEAD = 6.5 // seconds before the end that the title starts to appear
const FILM_TIMEOUT = 9000 // if the film hasn't started by now, open the page anyway

const pad = (n) => String(n).padStart(2, '0')
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
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
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        // Content descends into place rather than rising, so it reads as the
        // page settling down over the film.
        transform: shown ? 'translateY(0)' : 'translateY(-26px)',
        transition: `opacity .8s cubic-bezier(.22,.61,.36,1) ${delay}s, transform .8s cubic-bezier(.22,.61,.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

// Counts down to a fixed instant. Stops itself once the race has started, so
// a finished season leaves no interval running.
function useCountdown(iso) {
  const target = useMemo(() => (iso ? new Date(iso).getTime() : null), [iso])
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!target || target - Date.now() <= 0) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [target])
  if (!target) return null
  const ms = target - now
  if (ms <= 0) return { past: true, d: 0, h: 0, m: 0, s: 0 }
  return {
    past: false,
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms / 3600000) % 24),
    m: Math.floor((ms / 60000) % 60),
    s: Math.floor((ms / 1000) % 60),
  }
}

const Kerb = () => <div className="f1-kerb" aria-hidden="true" />

const Shell = ({ children, id }) => (
  <section id={id} className="max-w-3xl mx-auto px-5 sm:px-6 py-7 sm:py-9">
    {children}
  </section>
)

const SectionTitle = ({ children, note }) => (
  <div className="flex items-baseline justify-between gap-4 mb-5">
    <h2 className="f1-h2">
      <span className="f1-tick" aria-hidden="true" />
      {children}
    </h2>
    {note && <span className="f1-note shrink-0">{note}</span>}
  </div>
)

// A standings row with the points drawn as a bar behind the name, so the size
// of a lead is visible rather than something you work out from two numbers.
function Row({ pos, color, name, sub, points, wins, pct, lead }) {
  return (
    <div className={`f1-row${lead ? ' f1-row-lead' : ''}`}>
      <span className="f1-bar" style={{ width: `${pct}%`, background: color }} aria-hidden="true" />
      <span className="f1-pos">{pos}</span>
      <span className="f1-stripe" style={{ background: color }} aria-hidden="true" />
      <span className="min-w-0 flex-1 relative">
        <span className="block text-[14.5px] font-medium leading-tight truncate">{name}</span>
        {sub && <span className="f1-sub block truncate">{sub}</span>}
      </span>
      {wins > 0 && <span className="f1-wins">{wins}W</span>}
      <span className="f1-pts">{points}</span>
    </div>
  )
}

export default function F1({ onBack }) {
  const [data, setData] = useState(undefined) // undefined = loading, null = failed
  const [live, setLive] = useState(false)
  const [stage, setStage] = useState('film') // 'film' -> 'open'
  const [titleIn, setTitleIn] = useState(false)
  const [canSkip, setCanSkip] = useState(false)
  const [muted, setMuted] = useState(false)
  const [needsGesture, setNeedsGesture] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [reduced, setReduced] = useState(false)
  const videoRef = useRef(null)

  const openPage = useCallback(() => {
    setStage((s) => {
      if (s === 'open') return s
      const v = videoRef.current
      if (v) {
        // From here the film is wallpaper, so let it run round again.
        v.loop = true
        if (v.ended) {
          v.currentTime = 0
          v.play().catch(() => {})
        }
      }
      return 'open'
    })
    setTitleIn(true)
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = (m) => {
      setReduced(m)
      // Someone who has asked for less motion should not be held behind a
      // 39-second film.
      if (m) openPage()
    }
    apply(mq.matches)
    const on = (e) => apply(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [openPage])

  // Ship-with-the-build data first.
  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}f1.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => alive && setData(j))
      .catch(() => alive && setData(null))
    return () => {
      alive = false
    }
  }, [])

  // Then quietly upgrade the standings to whatever is live right now. A
  // failure here is silent by design: the snapshot is already on screen.
  useEffect(() => {
    if (!data?.season) return
    let alive = true
    Promise.all([
      fetch(`${API}/${data.season}/driverstandings/?format=json`).then((r) => r.json()),
      fetch(`${API}/${data.season}/constructorstandings/?format=json`).then((r) => r.json()),
    ])
      .then(([d, c]) => {
        if (!alive) return
        const dl = d.MRData.StandingsTable.StandingsLists[0]
        const cl = c.MRData.StandingsTable.StandingsLists[0]
        if (!dl?.DriverStandings?.length) return
        setData((prev) => ({
          ...prev,
          round: Number(dl.round) || prev.round,
          drivers: dl.DriverStandings.map((s) => ({
            pos: Number(s.position),
            points: Number(s.points),
            wins: Number(s.wins),
            code: s.Driver.code || s.Driver.familyName.slice(0, 3).toUpperCase(),
            first: s.Driver.givenName,
            last: s.Driver.familyName,
            team: s.Constructors[s.Constructors.length - 1]?.name || '',
            teamId: s.Constructors[s.Constructors.length - 1]?.constructorId || '',
          })),
          constructors: (cl?.ConstructorStandings || []).map((s) => ({
            pos: Number(s.position),
            points: Number(s.points),
            wins: Number(s.wins),
            name: s.Constructor.name,
            teamId: s.Constructor.constructorId,
          })),
        }))
        setLive(true)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [data?.season])

  // Start the film with sound. Browsers only allow that when the visitor has
  // already earned it on this site, so a refusal is expected rather than an
  // error: fall back to muted playback and offer sound on the first touch.
  useEffect(() => {
    const v = videoRef.current
    if (!v || reduced) return
    v.volume = 1
    v.muted = false
    v.play()
      .then(() => setMuted(false))
      .catch(() => {
        v.muted = true
        setMuted(true)
        setNeedsGesture(true)
        v.play().catch(() => openPage()) // can't play at all — don't trap anyone
      })
  }, [reduced, openPage])

  // Any first interaction anywhere is enough to turn the sound on.
  useEffect(() => {
    if (!needsGesture) return
    const on = () => {
      const v = videoRef.current
      if (v) {
        v.muted = false
        v.volume = 1
        v.play().catch(() => {})
        setMuted(false)
      }
      setNeedsGesture(false)
    }
    window.addEventListener('pointerdown', on, { once: true })
    window.addEventListener('keydown', on, { once: true })
    return () => {
      window.removeEventListener('pointerdown', on)
      window.removeEventListener('keydown', on)
    }
  }, [needsGesture])

  // Hold the page still while the film runs.
  useEffect(() => {
    if (stage !== 'film') return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.scrollTo(0, 0)
    return () => {
      document.body.style.overflow = prev
    }
  }, [stage])

  // Offer a way past the film, and never let a broken video hold the page shut.
  useEffect(() => {
    if (stage !== 'film') return
    const skip = setTimeout(() => setCanSkip(true), 3500)
    const bail = setTimeout(() => {
      const v = videoRef.current
      if (!v || v.paused || v.currentTime === 0) openPage()
    }, FILM_TIMEOUT)
    return () => {
      clearTimeout(skip)
      clearTimeout(bail)
    }
  }, [stage, openPage])

  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v?.duration || Number.isNaN(v.duration)) return
    if (v.currentTime >= v.duration - TITLE_LEAD) setTitleIn(true)
  }, [])

  const toggleSound = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    if (!v.muted) v.volume = 1
    setMuted(v.muted)
    setNeedsGesture(false)
    if (v.paused) v.play().catch(() => {})
  }, [])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }, [])

  const nextRace = useMemo(() => {
    if (!data?.races) return null
    const now = Date.now()
    return data.races.find((r) => new Date(r.start).getTime() > now) || null
  }, [data])

  const countdown = useCountdown(nextRace?.start)

  const done = useMemo(
    () => (data?.races || []).filter((r) => new Date(r.start).getTime() < Date.now()),
    [data]
  )

  // Two drivers per team, ordered by points — the intra-team scrap.
  const teammates = useMemo(() => {
    if (!data?.drivers) return []
    const by = new Map()
    for (const d of data.drivers) {
      if (!d.teamId) continue
      if (!by.has(d.teamId)) by.set(d.teamId, [])
      by.get(d.teamId).push(d)
    }
    return [...by.entries()]
      .map(([teamId, list]) => {
        const two = [...list].sort((a, b) => b.points - a.points).slice(0, 2)
        return two.length === 2
          ? { teamId, team: two[0].team, a: two[0], b: two[1], total: two[0].points + two[1].points }
          : null
      })
      .filter(Boolean)
      .sort((x, y) => y.total - x.total)
  }, [data])

  const title = data?.drivers?.length >= 2 ? { p1: data.drivers[0], p2: data.drivers[1] } : null
  const roundsLeft = data?.races ? data.races.length - done.length : 0
  const maxD = data?.drivers?.[0]?.points || 1
  const maxC = data?.constructors?.[0]?.points || 1
  const base = import.meta.env.BASE_URL

  return (
    <div className="f1-root">
      <button onClick={onBack} title="Back" className="f1-back">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* The film */}
      <div className="f1-hero">
        <video
          ref={videoRef}
          className="f1-video"
          src={`${base}f1/hero.mp4`}
          poster={`${base}f1/poster.jpg`}
          playsInline
          preload="auto"
          autoPlay={!reduced}
          onTimeUpdate={onTimeUpdate}
          onEnded={openPage}
          onError={openPage}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        <div className="f1-scrim" aria-hidden="true" />

        <div className="f1-hero-inner">
          <div className={`f1-title${titleIn ? ' f1-title-in' : ''}`}>
            <div className="f1-eyebrow">
              {data?.season || ''} Season{data?.round ? ` · Round ${data.round}` : ''}
            </div>
            <h1 className="f1-h1">
              Formula&nbsp;1
              <span className="f1-h1-kerb" aria-hidden="true" />
            </h1>
            <p className="f1-lede">
              Eight world titles, a hybrid era, and a grid that still argues about it.
              The championship as it stands tonight.
            </p>
          </div>

          {stage === 'open' && (
            <button
              onClick={() =>
                document.getElementById('f1-details')?.scrollIntoView({
                  behavior: reduced ? 'auto' : 'smooth',
                  block: 'start',
                })
              }
              className="f1-cue"
              aria-label="Scroll to the championship"
            >
              <span className="f1-cue-text">The standings</span>
              <svg className="w-5 h-5 f1-bob" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          )}
        </div>

        {needsGesture && stage === 'film' && (
          <button onClick={toggleSound} className="f1-sound-prompt">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H3v6h3l5 4V5z" />
              <path strokeLinecap="round" d="M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" />
            </svg>
            Tap for sound
          </button>
        )}

        {stage === 'film' && canSkip && (
          <button onClick={openPage} className="f1-skip">
            Skip the film
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}

        <div className="f1-controls">
          <button onClick={togglePlay} className="f1-ctl" aria-label={playing ? 'Pause the film' : 'Play the film'}>
            {playing ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
            )}
          </button>
          <button onClick={toggleSound} className={`f1-ctl${muted ? '' : ' f1-ctl-on'}`} aria-label={muted ? 'Unmute the film' : 'Mute the film'}>
            {muted ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H3v6h3l5 4V5z" /><path strokeLinecap="round" d="M17 9l4 6m0-6l-4 6" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H3v6h3l5 4V5z" /><path strokeLinecap="round" d="M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Everything below only exists once the film has had its say. */}
      {stage === 'open' && (
        <div id="f1-details" className="f1-details">
          <Kerb />

          {data === undefined && <Shell><div className="f1-state">Warming the tyres…</div></Shell>}
          {data === null && <Shell><div className="f1-state">Couldn&rsquo;t load the championship right now.</div></Shell>}

          {data && (
            <>
              {/* Season pulse */}
              <Shell>
                <Reveal>
                  <div className="f1-pulse">
                    <div className="f1-pulse-head">
                      <span className="f1-pulse-round">Round <b>{done.length}</b> of {data.races.length}</span>
                      <span className="f1-note">{roundsLeft} to go</span>
                    </div>
                    <div className="f1-track" role="img" aria-label={`${done.length} of ${data.races.length} rounds complete`}>
                      <span className="f1-track-fill" style={{ width: `${(done.length / data.races.length) * 100}%` }} />
                    </div>
                    <div className="f1-pulse-grid">
                      <div><b>{data.drivers.reduce((n, d) => n + d.wins, 0)}</b><span>races won</span></div>
                      <div><b>{new Set(done.map((r) => r.winner?.last).filter(Boolean)).size}</b><span>winners</span></div>
                      <div><b>{new Set(data.races.map((r) => r.country)).size}</b><span>countries</span></div>
                      <div><b>{data.constructors.length}</b><span>teams</span></div>
                    </div>
                  </div>
                </Reveal>
              </Shell>

              {/* Next race */}
              {nextRace && (
                <Shell>
                  <Reveal>
                    <div className="f1-next">
                      <div className="f1-next-tag">Next up · Round {nextRace.round}</div>
                      <h2 className="f1-next-name">{nextRace.name}</h2>
                      <p className="f1-next-where">
                        {nextRace.circuit} · {nextRace.locality}, {nextRace.country}
                        <span className="f1-dot">·</span>
                        {fmtDate(nextRace.start)}, {fmtTime(nextRace.start)}
                      </p>
                      {countdown && !countdown.past && (
                        <div className="f1-clock">
                          {[['Days', countdown.d], ['Hrs', pad(countdown.h)], ['Min', pad(countdown.m)], ['Sec', pad(countdown.s)]].map(([l, v]) => (
                            <div key={l} className="f1-clock-cell">
                              <div className="f1-clock-num">{v}</div>
                              <div className="f1-clock-lab">{l}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {countdown?.past && <p className="f1-sub">Lights out.</p>}
                    </div>
                  </Reveal>
                </Shell>
              )}

              {/* Title race */}
              {title && (
                <Shell>
                  <Reveal>
                    <SectionTitle note={`${roundsLeft} rounds left`}>The title race</SectionTitle>
                    <div className="f1-duel">
                      <div className="f1-duel-side">
                        <span className="f1-duel-pos">P1</span>
                        <span className="f1-duel-name" style={{ color: teamColor(title.p1.teamId) }}>{title.p1.last}</span>
                        <span className="f1-duel-pts">{title.p1.points}</span>
                        <span className="f1-sub">{title.p1.team}</span>
                      </div>
                      <div className="f1-duel-gap">
                        <b>{title.p1.points - title.p2.points}</b>
                        <span>points</span>
                      </div>
                      <div className="f1-duel-side">
                        <span className="f1-duel-pos">P2</span>
                        <span className="f1-duel-name" style={{ color: teamColor(title.p2.teamId) }}>{title.p2.last}</span>
                        <span className="f1-duel-pts">{title.p2.points}</span>
                        <span className="f1-sub">{title.p2.team}</span>
                      </div>
                    </div>
                  </Reveal>
                </Shell>
              )}

              <Kerb />

              {/* Drivers */}
              <Shell>
                <Reveal>
                  <SectionTitle note={live ? 'live' : `after round ${data.round}`}>Drivers</SectionTitle>
                  <div className="space-y-1">
                    {data.drivers.map((d) => (
                      <Row
                        key={`${d.code}-${d.pos}`}
                        pos={d.pos}
                        color={teamColor(d.teamId)}
                        name={`${d.first} ${d.last}`}
                        sub={d.team}
                        points={d.points}
                        wins={d.wins}
                        pct={(d.points / maxD) * 100}
                        lead={d.pos === 1}
                      />
                    ))}
                  </div>
                </Reveal>
              </Shell>

              {/* Constructors */}
              <Shell>
                <Reveal>
                  <SectionTitle note={`${data.constructors.length} teams`}>Constructors</SectionTitle>
                  <div className="space-y-1">
                    {data.constructors.map((c) => (
                      <Row
                        key={c.teamId}
                        pos={c.pos}
                        color={teamColor(c.teamId)}
                        name={c.name}
                        points={c.points}
                        wins={c.wins}
                        pct={(c.points / maxC) * 100}
                        lead={c.pos === 1}
                      />
                    ))}
                  </div>
                </Reveal>
              </Shell>

              {/* Teammates */}
              {teammates.length > 0 && (
                <Shell>
                  <Reveal>
                    <SectionTitle note="points split">Teammates</SectionTitle>
                    <div className="space-y-2.5">
                      {teammates.map((t) => {
                        // A team on zero points has no split to show — a half-full
                        // bar would imply a share that doesn't exist.
                        const share = t.total > 0 ? (t.a.points / t.total) * 100 : 0
                        return (
                          <div key={t.teamId} className="f1-mate">
                            <div className="f1-mate-head">
                              <span className="f1-mate-team" style={{ color: teamColor(t.teamId) }}>{t.team}</span>
                              <span className="f1-note">{t.total} pts</span>
                            </div>
                            <div className="f1-mate-bar">
                              <span className="f1-mate-fill" style={{ width: `${share}%`, background: teamColor(t.teamId) }} />
                            </div>
                            <div className="f1-mate-feet">
                              <span>{t.a.last} <b>{t.a.points}</b></span>
                              <span><b>{t.b.points}</b> {t.b.last}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </Reveal>
                </Shell>
              )}

              <Kerb />

              {/* Season so far */}
              {done.some((r) => r.winner) && (
                <Shell>
                  <Reveal>
                    <SectionTitle note="winner · pole">The season so far</SectionTitle>
                    <div className="space-y-1">
                      {done.filter((r) => r.winner).map((r) => (
                        <div key={r.round} className="f1-past">
                          <span className="f1-pos">{r.round}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14px] leading-tight truncate">{r.name}</span>
                            <span className="f1-sub block truncate">
                              <b style={{ color: teamColor(r.winner.teamId) }}>{r.winner.last}</b>
                              <span className="f1-dot">·</span>
                              {r.winner.team}
                            </span>
                          </span>
                          {r.pole && (
                            <span className="f1-pole" title={`Pole: ${r.pole.last} ${r.pole.time}`}>
                              <span className="f1-pole-tag">P</span>
                              {r.pole.last}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </Reveal>
                </Shell>
              )}

              {/* Last time out */}
              {data.lastRace && (
                <Shell>
                  <Reveal>
                    <SectionTitle note={fmtDate(data.lastRace.date)}>Last time out</SectionTitle>
                    <p className="f1-sub -mt-3 mb-4">{data.lastRace.name} · {data.lastRace.circuit}</p>
                    <div className="space-y-1">
                      {data.lastRace.podium.map((p) => (
                        <Row
                          key={p.code}
                          pos={p.pos}
                          color={teamColor(p.teamId)}
                          name={`${p.first} ${p.last}`}
                          sub={`${p.team} · ${p.time}`}
                          points={p.points}
                          wins={0}
                          pct={(p.points / (data.lastRace.podium[0].points || 1)) * 100}
                          lead={p.pos === 1}
                        />
                      ))}
                    </div>
                    {data.lastRace.fastestLap && (
                      <p className="f1-note mt-3.5">
                        Fastest lap — {data.lastRace.fastestLap.driver} {data.lastRace.fastestLap.time}
                      </p>
                    )}
                  </Reveal>
                </Shell>
              )}

              {/* Calendar */}
              <Shell>
                <Reveal>
                  <SectionTitle note={`${data.races.length} rounds`}>The calendar</SectionTitle>
                  <div className="space-y-1">
                    {data.races.map((r) => {
                      const past = new Date(r.start).getTime() < Date.now()
                      const isNext = nextRace && r.round === nextRace.round
                      return (
                        <div key={r.round} className={`f1-cal${past ? ' f1-cal-past' : ''}${isNext ? ' f1-cal-next' : ''}`}>
                          <span className="f1-pos">{r.round}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[14.5px] leading-tight truncate">{r.name}</span>
                            <span className="f1-sub block truncate">{r.locality}, {r.country}</span>
                          </span>
                          <span className="f1-cal-date">{fmtDate(r.start)}</span>
                        </div>
                      )
                    })}
                  </div>
                </Reveal>
              </Shell>

              <Kerb />

              {/* Credits */}
              <Shell>
                <Reveal>
                  <div className="f1-credits">
                    <p>
                      Film: <b>AMD Radeon PRO × Blender</b> for the Mercedes-AMG Petronas F1 Team,
                      marking eight consecutive constructors&rsquo; titles (2014–2021). Rendered with
                      Blender on an AMD Radeon PRO W6800. All rights belong to their owners; it is used
                      here as a fan tribute, trimmed and re-encoded for the web.
                    </p>
                    <p>
                      Timing and standings from{' '}
                      <a href="https://api.jolpi.ca/ergast/f1/" target="_blank" rel="noopener noreferrer">Jolpica-F1</a>,
                      the community successor to Ergast. Not affiliated with Formula 1, the FIA, or any team.
                    </p>
                    {data.generated && (
                      <p className="f1-note">
                        Snapshot {new Date(data.generated).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {live ? ' · standings refreshed live' : ''}
                      </p>
                    )}
                  </div>
                </Reveal>
              </Shell>
            </>
          )}
        </div>
      )}

      <style>{`
        .f1-root {
          --f1-red: #E10600;
          --f1-bg: #0A0A0C;
          --f1-card: #14141A;
          --f1-line: #26262F;
          --f1-fg: #F3F3F6;
          --f1-dim: #9A9AA6;
          position: relative;
          min-height: 100vh;
          background: var(--f1-bg);
          color: var(--f1-fg);
        }

        /* Hero */
        .f1-hero { position: relative; height: 100svh; min-height: 520px; overflow: hidden; }
        .f1-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .f1-scrim {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(120% 80% at 50% 60%, transparent 35%, rgba(0,0,0,.55) 100%),
            linear-gradient(180deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.1) 30%, rgba(0,0,0,.45) 72%, var(--f1-bg) 100%);
        }
        .f1-hero-inner {
          position: relative; z-index: 2; height: 100%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 0 1.25rem;
        }

        /* The title is absent until the film is nearly done. */
        .f1-title {
          opacity: 0; transform: translateY(-14px) scale(.985); filter: blur(6px);
          transition: opacity 1.9s cubic-bezier(.22,.61,.36,1), transform 1.9s cubic-bezier(.22,.61,.36,1), filter 1.9s ease;
          pointer-events: none;
        }
        .f1-title-in { opacity: 1; transform: none; filter: none; }

        .f1-eyebrow {
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 11px; letter-spacing: .32em; text-transform: uppercase;
          color: rgba(255,255,255,.6); margin-bottom: .9rem;
        }
        .f1-h1 {
          position: relative; display: inline-block;
          font-weight: 500; font-size: clamp(3rem, 13vw, 7rem); line-height: .95; color: #fff;
          margin-bottom: 1.15rem; text-shadow: 0 2px 40px rgba(0,0,0,.5);
        }
        .f1-h1-kerb {
          display: block; height: 4px; margin-top: .55rem; border-radius: 2px;
          background: repeating-linear-gradient(135deg, var(--f1-red) 0 10px, #fff 10px 20px);
          transform: scaleX(0); transform-origin: left center;
          transition: transform 1.4s cubic-bezier(.22,.61,.36,1) .5s;
        }
        .f1-title-in .f1-h1-kerb { transform: scaleX(1); }
        .f1-lede {
          max-width: 30rem; margin: 0 auto;
          font-size: clamp(.95rem, 2.4vw, 1.1rem); line-height: 1.65; color: rgba(255,255,255,.72);
        }

        .f1-cue {
          position: absolute; bottom: 2.25rem; display: inline-flex; flex-direction: column;
          align-items: center; gap: .5rem; color: rgba(255,255,255,.55);
          animation: f1Fade 1s ease-out both; transition: color .2s;
        }
        .f1-cue:hover { color: rgba(255,255,255,.92); }
        .f1-cue-text { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .28em; text-transform: uppercase; }
        @keyframes f1Fade { from { opacity: 0 } to { opacity: 1 } }
        .f1-bob { animation: f1Bob 2.4s ease-in-out infinite; }
        @keyframes f1Bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(5px) } }

        .f1-back {
          position: fixed; top: 1rem; left: 1rem; z-index: 40;
          display: inline-flex; align-items: center; gap: .375rem;
          padding: .375rem .75rem; border-radius: .5rem; font-size: .875rem;
          color: rgba(255,255,255,.8); background: rgba(0,0,0,.5);
          border: 1px solid rgba(255,255,255,.16); backdrop-filter: blur(8px);
          transition: color .2s, border-color .2s;
        }
        .f1-back:hover { color: #fff; border-color: var(--f1-red); }

        .f1-controls { position: absolute; bottom: 1.25rem; right: 1.25rem; z-index: 3; display: flex; gap: .5rem; }
        .f1-ctl {
          width: 2.25rem; height: 2.25rem; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,.82); background: rgba(0,0,0,.5);
          border: 1px solid rgba(255,255,255,.16); backdrop-filter: blur(8px);
          transition: color .2s, border-color .2s;
        }
        .f1-ctl:hover { color: #fff; border-color: var(--f1-red); }
        .f1-ctl-on { border-color: var(--f1-red); color: #fff; }

        .f1-skip {
          position: absolute; bottom: 1.35rem; left: 50%; transform: translateX(-50%); z-index: 3;
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .45rem .85rem; border-radius: 999px;
          font-family: ui-monospace, monospace; font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase;
          color: rgba(255,255,255,.6); background: rgba(0,0,0,.45);
          border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(8px);
          animation: f1Fade .7s ease-out both; transition: color .2s, border-color .2s;
        }
        .f1-skip:hover { color: #fff; border-color: var(--f1-red); }

        .f1-sound-prompt {
          position: absolute; top: 1rem; right: 1.25rem; z-index: 3;
          display: inline-flex; align-items: center; gap: .45rem;
          padding: .5rem .9rem; border-radius: 999px; font-size: 12.5px;
          color: #fff; background: rgba(225,6,0,.9); border: 1px solid rgba(255,255,255,.25);
          animation: f1Pulse 2s ease-in-out infinite;
        }
        @keyframes f1Pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(225,6,0,.5) } 50% { box-shadow: 0 0 0 10px rgba(225,6,0,0) } }

        /* Details */
        .f1-details { position: relative; z-index: 2; background: var(--f1-bg); }
        .f1-state { height: 8rem; display: flex; align-items: center; justify-content: center; color: var(--f1-dim); font-size: 13px; }
        .f1-kerb { height: 6px; background: repeating-linear-gradient(135deg, var(--f1-red) 0 14px, #fff 14px 28px); opacity: .85; }

        .f1-h2 { display: flex; align-items: center; gap: .6rem; font-weight: 500; font-size: clamp(1.35rem, 3.4vw, 1.9rem); }
        .f1-tick { width: 4px; height: 1.15em; border-radius: 2px; background: var(--f1-red); flex-shrink: 0; }
        .f1-note { font-family: ui-monospace, monospace; font-size: 11px; color: var(--f1-dim); opacity: .85; }
        .f1-sub { font-size: 11.5px; color: var(--f1-dim); }
        .f1-dot { margin: 0 .4rem; opacity: .45; }

        /* Rows */
        .f1-row {
          position: relative; display: flex; align-items: center; gap: .75rem;
          padding: .625rem .875rem; border-radius: .5rem;
          border: 1px solid transparent; overflow: hidden;
        }
        .f1-row-lead { background: var(--f1-card); border-color: var(--f1-line); }
        .f1-bar { position: absolute; left: 0; top: 0; bottom: 0; opacity: .11; transition: width .8s cubic-bezier(.22,.61,.36,1); }
        .f1-pos { position: relative; width: 1.5rem; flex-shrink: 0; font-family: ui-monospace, monospace; font-variant-numeric: tabular-nums; font-size: 13px; color: var(--f1-dim); }
        .f1-stripe { position: relative; width: 3px; height: 1.75rem; border-radius: 999px; flex-shrink: 0; }
        .f1-wins { position: relative; font-family: ui-monospace, monospace; font-size: 11px; color: var(--f1-dim); flex-shrink: 0; }
        .f1-pts { position: relative; width: 3rem; text-align: right; font-family: ui-monospace, monospace; font-variant-numeric: tabular-nums; font-size: 14px; flex-shrink: 0; }
        @media (max-width: 639px) { .f1-wins { display: none } }

        /* Season pulse */
        .f1-pulse { border: 1px solid var(--f1-line); border-radius: 1rem; padding: 1.25rem 1.35rem; background: var(--f1-card); }
        .f1-pulse-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: .7rem; }
        .f1-pulse-round { font-size: 13.5px; color: var(--f1-dim); }
        .f1-pulse-round b { color: var(--f1-fg); font-size: 16px; }
        .f1-track { height: 6px; border-radius: 999px; background: rgba(255,255,255,.08); overflow: hidden; }
        .f1-track-fill { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--f1-red), #FF4B45); transition: width 1s cubic-bezier(.22,.61,.36,1); }
        .f1-pulse-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; margin-top: 1.1rem; }
        .f1-pulse-grid div { text-align: center; }
        .f1-pulse-grid b { display: block; font-family: ui-monospace, monospace; font-size: clamp(1.05rem, 4vw, 1.4rem); }
        .f1-pulse-grid span { display: block; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--f1-dim); margin-top: .2rem; }

        /* Next race */
        .f1-next { border: 1px solid var(--f1-line); border-left: 3px solid var(--f1-red); border-radius: 1rem; padding: 1.5rem 1.5rem 1.6rem; background: var(--f1-card); }
        .f1-next-tag { font-family: ui-monospace, monospace; font-size: 10.5px; letter-spacing: .24em; text-transform: uppercase; color: var(--f1-red); margin-bottom: .7rem; }
        .f1-next-name { font-weight: 500; font-size: clamp(1.5rem, 4.4vw, 2.3rem); line-height: 1.15; margin-bottom: .35rem; }
        .f1-next-where { font-size: 13.5px; color: var(--f1-dim); margin-bottom: 1.35rem; }
        .f1-clock { display: flex; gap: .625rem; }
        .f1-clock-cell { flex: 1; text-align: center; border-radius: .75rem; padding: .7rem .25rem; background: rgba(255,255,255,.05); border: 1px solid var(--f1-line); }
        .f1-clock-num { font-family: ui-monospace, monospace; font-variant-numeric: tabular-nums; font-size: clamp(1.3rem, 5vw, 2rem); line-height: 1; }
        .f1-clock-lab { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: var(--f1-dim); margin-top: .4rem; }

        /* Title race */
        .f1-duel { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: .75rem; border: 1px solid var(--f1-line); border-radius: 1rem; padding: 1.25rem 1rem; background: var(--f1-card); }
        .f1-duel-side { display: flex; flex-direction: column; align-items: center; text-align: center; gap: .15rem; min-width: 0; }
        .f1-duel-pos { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .2em; color: var(--f1-dim); }
        .f1-duel-name { font-size: clamp(1rem, 3.6vw, 1.3rem); font-weight: 600; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
        .f1-duel-pts { font-family: ui-monospace, monospace; font-size: clamp(1.4rem, 5vw, 2rem); line-height: 1.1; }
        .f1-duel-gap { text-align: center; padding: 0 .5rem; border-left: 1px solid var(--f1-line); border-right: 1px solid var(--f1-line); }
        .f1-duel-gap b { display: block; font-family: ui-monospace, monospace; font-size: clamp(1.2rem, 4.5vw, 1.7rem); color: var(--f1-red); }
        .f1-duel-gap span { font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--f1-dim); }

        /* Teammates */
        .f1-mate { border: 1px solid var(--f1-line); border-radius: .75rem; padding: .8rem .9rem; background: var(--f1-card); }
        .f1-mate-head { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; margin-bottom: .55rem; }
        .f1-mate-team { font-size: 13.5px; font-weight: 600; }
        .f1-mate-bar { height: 7px; border-radius: 999px; background: rgba(255,255,255,.09); overflow: hidden; }
        .f1-mate-fill { display: block; height: 100%; border-radius: 999px; transition: width .9s cubic-bezier(.22,.61,.36,1); }
        .f1-mate-feet { display: flex; justify-content: space-between; gap: .75rem; margin-top: .45rem; font-size: 12px; color: var(--f1-dim); }
        .f1-mate-feet b { color: var(--f1-fg); font-family: ui-monospace, monospace; }

        /* Season so far */
        .f1-past { display: flex; align-items: center; gap: .75rem; padding: .55rem .875rem; border-radius: .5rem; border: 1px solid transparent; }
        .f1-past:hover { border-color: var(--f1-line); background: var(--f1-card); }
        .f1-pole { display: inline-flex; align-items: center; gap: .35rem; flex-shrink: 0; font-size: 11.5px; color: var(--f1-dim); }
        .f1-pole-tag { display: inline-grid; place-items: center; width: 1.05rem; height: 1.05rem; border-radius: 3px; background: var(--f1-red); color: #fff; font-size: 9px; font-weight: 700; }
        @media (max-width: 479px) { .f1-pole { display: none } }

        /* Calendar */
        .f1-cal { display: flex; align-items: center; gap: .75rem; padding: .625rem .875rem; border-radius: .5rem; border: 1px solid transparent; }
        .f1-cal-past { opacity: .42; }
        .f1-cal-next { background: var(--f1-card); border-color: var(--f1-red); }
        .f1-cal-date { flex-shrink: 0; font-family: ui-monospace, monospace; font-size: 12px; color: var(--f1-dim); }

        /* Credits */
        .f1-credits { border-top: 1px solid var(--f1-line); padding-top: 1.5rem; display: flex; flex-direction: column; gap: .75rem; }
        .f1-credits p { font-size: 12px; line-height: 1.7; color: var(--f1-dim); }
        .f1-credits b { color: rgba(243,243,246,.85); font-weight: 600; }
        .f1-credits a { color: var(--f1-red); text-decoration: underline; text-underline-offset: 2px; }

        @media (prefers-reduced-motion: reduce) {
          .f1-title { transition: none; opacity: 1; transform: none; filter: none; }
          .f1-h1-kerb { transition: none; transform: scaleX(1); }
          .f1-bob, .f1-sound-prompt { animation: none; }
          .f1-bar, .f1-track-fill, .f1-mate-fill { transition: none; }
        }
      `}</style>
    </div>
  )
}
