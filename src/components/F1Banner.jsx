import React, { useEffect, useState } from 'react'

/* ------------------------------------------------------------------ *
 * A small F1 banner that sits under the Sidecar button on the hero.
 *
 * The Formula 1 wordmark is a registered trademark set in a proprietary
 * typeface, so this is a hand-drawn racing italic instead — heavy, slanted,
 * with trailing speed bars. Same energy, nothing borrowed, and no extra
 * webfont to download.
 *
 * It shares the Sidecar's `f1_next` sessionStorage cache, so whichever of
 * the two loads first pays for the request and the other one is instant.
 * If the fetch fails the banner still stands; it just drops the countdown.
 * ------------------------------------------------------------------ */

const CACHE_KEY = 'f1_next'
const CACHE_TTL = 3600000 // an hour, matching the Sidecar

const FLAGS = {
  Netherlands: '🇳🇱', Italy: '🇮🇹', Monaco: '🇲🇨', Spain: '🇪🇸', UK: '🇬🇧',
  Austria: '🇦🇹', Hungary: '🇭🇺', Belgium: '🇧🇪', Azerbaijan: '🇦🇿', Singapore: '🇸🇬',
  USA: '🇺🇸', Mexico: '🇲🇽', Brazil: '🇧🇷', Qatar: '🇶🇦', UAE: '🇦🇪', Japan: '🇯🇵',
  China: '🇨🇳', Bahrain: '🇧🇭', 'Saudi Arabia': '🇸🇦', Australia: '🇦🇺', Canada: '🇨🇦',
  France: '🇫🇷', Portugal: '🇵🇹', Germany: '🇩🇪',
}

// Hand-drawn italic "F1" with three trailing speed bars.
function F1Mark({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 68 26" fill="none" aria-hidden="true">
      <g transform="translate(6.5,0) skewX(-14)">
        <path d="M0 0H19V7H8V10.5H15V16.5H8V26H0Z" fill="currentColor" />
        <path d="M23 7.5L31 0H38V26H30V7.5Z" fill="currentColor" />
        <rect x="43" y="0" width="5" height="26" fill="#E10600" />
        <rect x="51" y="0" width="3.75" height="26" fill="#E10600" opacity=".62" />
        <rect x="58" y="0" width="2.5" height="26" fill="#E10600" opacity=".34" />
      </g>
    </svg>
  )
}

export default function F1Banner() {
  const [race, setRace] = useState(undefined) // undefined = loading, null = no data
  const [onHero, setOnHero] = useState(true)
  const [ready, setReady] = useState(false)

  // Only while the hero is on screen — the Sidecar button stays pinned all the
  // way down the page, but a banner that did the same would just be nagging.
  useEffect(() => {
    const hero = document.getElementById('home')
    if (!hero) return
    const io = new IntersectionObserver(([e]) => setOnHero(e.intersectionRatio > 0.25), {
      threshold: [0, 0.25, 0.5],
    })
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  // Let the landing page paint before spending a request on this.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 900)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null')
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setRace(cached.race)
        return
      }
    } catch {}

    let alive = true
    fetch('https://api.jolpi.ca/ergast/f1/current/next.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (!alive) return
        const r = d?.MRData?.RaceTable?.Races?.[0] || null
        setRace(r)
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ race: r, ts: Date.now() })) } catch {}
      })
      .catch(() => alive && setRace(null))
    return () => { alive = false }
  }, [ready])

  const loc = race?.Circuit?.Location || {}
  const start = race?.date ? new Date(`${race.date}T${race.time || '12:00:00Z'}`).getTime() : null
  const days = start ? Math.max(0, Math.ceil((start - Date.now()) / 86400000)) : null

  // The countdown is a bonus, not the point — while it loads, or if the API is
  // down, the banner still says something true rather than sitting blank.
  const eyebrow = race ? 'Next race' : 'Formula 1'
  const sub = race
    ? `${FLAGS[loc.country] || '🏁'} ${loc.locality || race.raceName}${days != null ? ` · ${days === 0 ? 'today' : `${days}d`}` : ''}`
    : 'Standings & calendar'

  return (
    <a
      href="#/f1"
      className="f1b"
      data-on={onHero ? '1' : '0'}
      aria-label="Formula 1 — the season, the standings and the calendar"
    >
      <span className="f1b-kerb" aria-hidden="true" />
      <F1Mark className="f1b-mark" />
      <span className="f1b-rule" aria-hidden="true" />
      <span className="f1b-text">
        <span className="f1b-eyebrow">{eyebrow}</span>
        <span className="f1b-sub">{sub}</span>
      </span>

      <style>{`
        .f1b {
          position: fixed; top: 8.75rem; right: 1.5rem; z-index: 40;
          display: flex; align-items: center; gap: .6rem;
          padding: .5rem .8rem .5rem .75rem;
          border-radius: .7rem; overflow: hidden;
          background: #0A0A0C; color: #fff;
          border: 1px solid rgba(255,255,255,.14);
          box-shadow: 0 10px 28px -12px rgba(0,0,0,.75);
          text-decoration: none;
          transition: opacity .45s ease, transform .45s cubic-bezier(.22,.61,.36,1), border-color .25s ease, box-shadow .25s ease;
        }
        .f1b[data-on="0"] { opacity: 0; transform: translateY(-8px); pointer-events: none; }
        .f1b[data-on="1"] { opacity: 1; transform: none; }
        .f1b:hover { border-color: #E10600; box-shadow: 0 14px 32px -12px rgba(225,6,0,.55); }

        .f1b-kerb {
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: repeating-linear-gradient(135deg, #E10600 0 7px, #fff 7px 14px);
          opacity: .9;
        }
        .f1b-mark { width: 3rem; height: 1.15rem; flex-shrink: 0; }
        .f1b-rule { width: 1px; align-self: stretch; margin: .1rem 0; background: rgba(255,255,255,.16); }
        .f1b-text { display: flex; flex-direction: column; gap: .1rem; min-width: 0; }
        .f1b-eyebrow {
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 8.5px; letter-spacing: .2em; text-transform: uppercase;
          color: rgba(255,255,255,.5); line-height: 1;
        }
        .f1b-sub {
          font-size: 11.5px; line-height: 1.25; white-space: nowrap;
          max-width: 11rem; overflow: hidden; text-overflow: ellipsis;
          color: rgba(255,255,255,.9);
        }

        /* Under the Sidecar button on small screens too, just tighter. */
        @media (max-width: 480px) {
          .f1b { right: 1.25rem; padding: .45rem .65rem; gap: .5rem; }
          .f1b-sub { max-width: 8.5rem; font-size: 11px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .f1b { transition: opacity .2s linear; }
          .f1b[data-on="0"] { transform: none; }
        }
      `}</style>
    </a>
  )
}
