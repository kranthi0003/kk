import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/* ------------------------------------------------------------------ *
 * #/f1 — a cinematic hero over the live championship.
 *
 * The film is AMD's Radeon PRO x Blender showcase for the Mercedes-AMG
 * Petronas F1 Team, cut to the footage between two black frames so it loops
 * without seams (the original opens on a partner card and closes on credit
 * cards, both of which would flash on every pass) and re-encoded to 1280x720
 * so the page costs ~4.8MB instead of ~21MB. It is credited in full at the
 * foot of the page.
 *
 * Data is hybrid on purpose: f1.json ships with the build so the page is
 * useful the instant it paints, then the standings are re-fetched live and
 * swapped in, so a race that ran between nightly deploys still shows up.
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
const teamColor = (id) => TEAM_COLOR[id] || 'var(--color-muted-foreground)'

const API = 'https://api.jolpi.ca/ergast/f1'

const pad = (n) => String(n).padStart(2, '0')

function fmtRaceDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
function fmtRaceTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

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
        transition: `opacity .85s cubic-bezier(.22,.61,.36,1) ${delay}s, transform .85s cubic-bezier(.22,.61,.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

// Counts down to a fixed instant. Ticks once a second and stops itself once
// the race has started, so a finished season leaves no interval running.
function useCountdown(iso) {
  const target = useMemo(() => (iso ? new Date(iso).getTime() : null), [iso])
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!target) return
    if (target - Date.now() <= 0) return
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

const SectionTitle = ({ children, note }) => (
  <div className="flex items-baseline justify-between gap-4 mb-5">
    <h2 className="font-heading text-[clamp(1.35rem,3.4vw,1.9rem)]" style={{ fontWeight: 500 }}>
      {children}
    </h2>
    {note && <span className="text-[11px] font-mono text-muted-foreground/60 shrink-0">{note}</span>}
  </div>
)

const Shell = ({ children }) => (
  <section className="max-w-3xl mx-auto px-5 sm:px-6 py-12 sm:py-16">{children}</section>
)

function StandingsRow({ pos, color, name, sub, points, wins, highlight }) {
  return (
    <div
      className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg"
      style={{
        background: highlight ? 'color-mix(in oklab, var(--color-card) 75%, transparent)' : 'transparent',
        border: `1px solid ${highlight ? 'var(--color-border)' : 'transparent'}`,
      }}
    >
      <span className="w-6 shrink-0 text-[13px] font-mono tabular-nums text-muted-foreground/70">{pos}</span>
      <span className="w-[3px] h-7 rounded-full shrink-0" style={{ background: color }} />
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-medium leading-tight truncate">{name}</span>
        {sub && <span className="block text-[11.5px] text-muted-foreground/70 truncate">{sub}</span>}
      </span>
      {wins > 0 && (
        <span className="text-[11px] font-mono text-muted-foreground/60 shrink-0 hidden sm:inline">
          {wins}W
        </span>
      )}
      <span className="text-[14px] font-mono tabular-nums shrink-0 w-12 text-right">{points}</span>
    </div>
  )
}

export default function F1({ onBack }) {
  const [data, setData] = useState(undefined) // undefined = loading, null = failed
  const [live, setLive] = useState(false)
  const [muted, setMuted] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [reduced, setReduced] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = (e) => setReduced(e.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

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
    const season = data.season
    Promise.all([
      fetch(`${API}/${season}/driverstandings/?format=json`).then((r) => r.json()),
      fetch(`${API}/${season}/constructorstandings/?format=json`).then((r) => r.json()),
    ])
      .then(([d, c]) => {
        if (!alive) return
        const dl = d.MRData.StandingsTable.StandingsLists[0]
        const cl = c.MRData.StandingsTable.StandingsLists[0]
        if (!dl?.DriverStandings?.length) return
        const drivers = dl.DriverStandings.map((s) => ({
          pos: Number(s.position),
          points: Number(s.points),
          wins: Number(s.wins),
          code: s.Driver.code || s.Driver.familyName.slice(0, 3).toUpperCase(),
          first: s.Driver.givenName,
          last: s.Driver.familyName,
          team: s.Constructors[s.Constructors.length - 1]?.name || '',
          teamId: s.Constructors[s.Constructors.length - 1]?.constructorId || '',
        }))
        const constructors = (cl?.ConstructorStandings || []).map((s) => ({
          pos: Number(s.position),
          points: Number(s.points),
          wins: Number(s.wins),
          name: s.Constructor.name,
          teamId: s.Constructor.constructorId,
        }))
        setData((prev) => ({ ...prev, drivers, constructors, round: Number(dl.round) || prev.round }))
        setLive(true)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [data?.season])

  // Autoplay is only allowed while muted, and even then some browsers refuse.
  // Track the real state instead of assuming it worked.
  useEffect(() => {
    const v = videoRef.current
    if (!v || reduced) return
    const p = v.play()
    if (p?.catch) p.catch(() => setPlaying(false))
  }, [reduced, data])

  const toggleSound = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    const next = !v.muted
    v.muted = next
    setMuted(next)
    if (!next && v.paused) v.play().catch(() => {})
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

  const scrollDown = useCallback(() => {
    document.getElementById('f1-details')?.scrollIntoView({
      behavior: reduced ? 'auto' : 'smooth',
      block: 'start',
    })
  }, [reduced])

  const base = import.meta.env.BASE_URL

  return (
    <div className="relative min-h-screen">
      <button
        onClick={onBack}
        title="Back"
        className="fixed top-4 left-4 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white/80 hover:text-white transition-colors"
        style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)' }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Back</span>
      </button>

      {/* Hero — the film sits behind everything and the page scrolls over it. */}
      <div className="relative h-[100svh] min-h-[520px] overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          src={`${base}f1/hero.mp4`}
          poster={`${base}f1/poster.jpg`}
          muted={muted}
          loop
          playsInline
          preload="auto"
          autoPlay={!reduced}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        {/* Keeps the type legible over bright frames without washing the film out. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.18) 32%, rgba(0,0,0,0.45) 72%, var(--color-background) 100%)' }}
        />

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-5">
          <div className="f1-in">
            <div className="text-[11px] font-mono uppercase tracking-[0.32em] text-white/60 mb-4">
              {data?.season || ''} Season{data?.round ? ` · Round ${data.round}` : ''}
            </div>
            <h1
              className="font-heading text-white leading-[0.95] mb-5"
              style={{ fontWeight: 500, fontSize: 'clamp(3rem,13vw,7rem)' }}
            >
              Formula 1
            </h1>
            <p className="max-w-md mx-auto text-[clamp(0.95rem,2.4vw,1.1rem)] leading-relaxed text-white/70">
              Eight world titles, a hybrid era, and a grid that still argues about it.
              The championship as it stands tonight.
            </p>
          </div>

          <button
            onClick={scrollDown}
            className="f1-cue absolute bottom-9 inline-flex flex-col items-center gap-2 text-white/55 hover:text-white/90 transition-colors"
            aria-label="Scroll to the championship"
          >
            <span className="text-[10px] font-mono uppercase tracking-[0.28em]">The standings</span>
            <svg className="w-5 h-5 f1-bob" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>

        <div className="absolute bottom-5 right-5 z-10 flex gap-2">
          <button
            onClick={togglePlay}
            className="w-9 h-9 rounded-full inline-flex items-center justify-center text-white/80 hover:text-white transition-colors"
            style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)' }}
            aria-label={playing ? 'Pause the film' : 'Play the film'}
          >
            {playing ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
            )}
          </button>
          <button
            onClick={toggleSound}
            className="w-9 h-9 rounded-full inline-flex items-center justify-center text-white/80 hover:text-white transition-colors"
            style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.16)', backdropFilter: 'blur(8px)' }}
            aria-label={muted ? 'Unmute the film' : 'Mute the film'}
          >
            {muted ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H3v6h3l5 4V5z" /><path strokeLinecap="round" d="M17 9l4 6m0-6l-4 6" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H3v6h3l5 4V5z" /><path strokeLinecap="round" d="M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Details */}
      <div id="f1-details" className="relative z-10 bg-background">
        {data === undefined && (
          <Shell>
            <div className="h-32 flex items-center justify-center">
              <span className="text-[13px] text-muted-foreground">Warming the tyres…</span>
            </div>
          </Shell>
        )}

        {data === null && (
          <Shell>
            <div className="h-32 flex items-center justify-center text-center">
              <span className="text-[13px] text-muted-foreground">
                Couldn&rsquo;t load the championship right now.
              </span>
            </div>
          </Shell>
        )}

        {data && (
          <>
            {nextRace && (
              <Shell>
                <Reveal>
                  <div
                    className="rounded-2xl p-6 sm:p-8"
                    style={{
                      background: 'color-mix(in oklab, var(--color-card) 62%, transparent)',
                      border: '1px solid var(--color-border)',
                      borderLeft: '3px solid var(--color-brand)',
                    }}
                  >
                    <div className="text-[10.5px] font-mono uppercase tracking-[0.24em] text-muted-foreground/70 mb-3">
                      Next up · Round {nextRace.round}
                    </div>
                    <h2 className="font-heading text-[clamp(1.5rem,4.4vw,2.3rem)] leading-tight mb-1.5" style={{ fontWeight: 500 }}>
                      {nextRace.name}
                    </h2>
                    <p className="text-[13.5px] text-muted-foreground mb-6">
                      {nextRace.circuit} · {nextRace.locality}, {nextRace.country}
                      <span className="mx-1.5 text-muted-foreground/40">·</span>
                      {fmtRaceDate(nextRace.start)}, {fmtRaceTime(nextRace.start)}
                    </p>
                    {countdown && !countdown.past && (
                      <div className="flex gap-2.5 sm:gap-4">
                        {[
                          ['Days', countdown.d],
                          ['Hrs', pad(countdown.h)],
                          ['Min', pad(countdown.m)],
                          ['Sec', pad(countdown.s)],
                        ].map(([label, v]) => (
                          <div key={label} className="flex-1 text-center rounded-xl py-3" style={{ background: 'color-mix(in oklab, var(--color-muted) 45%, transparent)' }}>
                            <div className="font-mono tabular-nums text-[clamp(1.3rem,5vw,2rem)] leading-none">{v}</div>
                            <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/60 mt-1.5">{label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {countdown?.past && (
                      <p className="text-[13px] text-muted-foreground">Lights out.</p>
                    )}
                  </div>
                </Reveal>
              </Shell>
            )}

            <Shell>
              <Reveal>
                <SectionTitle note={live ? 'live' : `after round ${data.round}`}>Drivers</SectionTitle>
                <div className="space-y-1">
                  {data.drivers.map((d) => (
                    <StandingsRow
                      key={`${d.code}-${d.pos}`}
                      pos={d.pos}
                      color={teamColor(d.teamId)}
                      name={`${d.first} ${d.last}`}
                      sub={d.team}
                      points={d.points}
                      wins={d.wins}
                      highlight={d.pos === 1}
                    />
                  ))}
                </div>
              </Reveal>
            </Shell>

            <Shell>
              <Reveal>
                <SectionTitle note={`${data.constructors.length} teams`}>Constructors</SectionTitle>
                <div className="space-y-1">
                  {data.constructors.map((c) => (
                    <StandingsRow
                      key={c.teamId}
                      pos={c.pos}
                      color={teamColor(c.teamId)}
                      name={c.name}
                      points={c.points}
                      wins={c.wins}
                      highlight={c.pos === 1}
                    />
                  ))}
                </div>
              </Reveal>
            </Shell>

            {data.lastRace && (
              <Shell>
                <Reveal>
                  <SectionTitle note={fmtRaceDate(data.lastRace.date)}>
                    Last time out
                  </SectionTitle>
                  <p className="text-[13.5px] text-muted-foreground -mt-3 mb-5">
                    {data.lastRace.name} · {data.lastRace.circuit}
                  </p>
                  <div className="space-y-1">
                    {data.lastRace.podium.map((p) => (
                      <StandingsRow
                        key={p.code}
                        pos={p.pos}
                        color={teamColor(p.teamId)}
                        name={`${p.first} ${p.last}`}
                        sub={`${p.team} · ${p.time}`}
                        points={p.points}
                        wins={0}
                        highlight={p.pos === 1}
                      />
                    ))}
                  </div>
                  {data.lastRace.fastestLap && (
                    <p className="text-[12px] font-mono text-muted-foreground/60 mt-3.5">
                      Fastest lap — {data.lastRace.fastestLap.driver} {data.lastRace.fastestLap.time}
                    </p>
                  )}
                </Reveal>
              </Shell>
            )}

            <Shell>
              <Reveal>
                <SectionTitle note={`${data.races.length} rounds`}>The season</SectionTitle>
                <div className="space-y-1">
                  {data.races.map((r) => {
                    const done = new Date(r.start).getTime() < Date.now()
                    const isNext = nextRace && r.round === nextRace.round
                    return (
                      <div
                        key={r.round}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg"
                        style={{
                          background: isNext ? 'color-mix(in oklab, var(--color-card) 75%, transparent)' : 'transparent',
                          border: `1px solid ${isNext ? 'var(--color-border)' : 'transparent'}`,
                          opacity: done ? 0.45 : 1,
                        }}
                      >
                        <span className="w-6 shrink-0 text-[13px] font-mono tabular-nums text-muted-foreground/70">
                          {r.round}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14.5px] leading-tight truncate">{r.name}</span>
                          <span className="block text-[11.5px] text-muted-foreground/70 truncate">
                            {r.locality}, {r.country}
                          </span>
                        </span>
                        <span className="text-[12px] font-mono text-muted-foreground/70 shrink-0">
                          {fmtRaceDate(r.start)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </Reveal>
            </Shell>

            <Shell>
              <Reveal>
                <div className="border-t border-border pt-6 space-y-3">
                  <p className="text-[12px] leading-relaxed text-muted-foreground/70">
                    Film: <span className="text-foreground/80">AMD Radeon PRO × Blender</span> for the
                    Mercedes-AMG Petronas F1 Team, marking eight consecutive constructors&rsquo; titles
                    (2014–2021). Rendered with Blender on an AMD Radeon PRO W6800. All rights belong to
                    their owners; it is used here as a fan tribute, trimmed and re-encoded for the web.
                  </p>
                  <p className="text-[12px] leading-relaxed text-muted-foreground/70">
                    Timing and standings from{' '}
                    <a
                      href="https://api.jolpi.ca/ergast/f1/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-foreground transition-colors"
                    >
                      Jolpica-F1
                    </a>
                    , the community successor to Ergast. Not affiliated with Formula 1, the FIA, or any team.
                  </p>
                  {data.generated && (
                    <p className="text-[11px] font-mono text-muted-foreground/50">
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

      <style>{`
        .f1-in { animation: f1In 1.5s cubic-bezier(.22,.61,.36,1) both; }
        @keyframes f1In {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Waits for the film to fade up from black before inviting a scroll. */
        .f1-cue { animation: f1Cue 1.1s ease-out 2.1s both; }
        @keyframes f1Cue { from { opacity: 0; } to { opacity: 1; } }
        .f1-bob { animation: f1Bob 2.4s ease-in-out infinite; }
        @keyframes f1Bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(5px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .f1-in, .f1-cue { animation-duration: .01ms; animation-delay: 0s; }
          .f1-bob { animation: none; }
        }
      `}</style>
    </div>
  )
}
