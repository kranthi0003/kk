import React, { useEffect, useState } from 'react'

/* ------------------------------------------------------------------ *
 * The F1 button — sits under the Sidecar and matches it and the chat
 * trigger: 48px, round, soft shadow, lifts on hover.
 *
 * It is F1 red rather than the site accent on purpose. The Sidecar
 * button already owns the accent colour, and two identical circles
 * stacked on top of each other would read as one control split in two.
 *
 * The Formula 1 wordmark is a registered trademark set in a proprietary
 * typeface, so the glyphs here are hand-drawn — a heavy racing italic.
 * Nothing borrowed, and no extra webfont to download.
 *
 * The next race is only used for the tooltip and for a small dot on
 * race weekends, so the request is deferred and shares the Sidecar's
 * `f1_next` cache. If it never resolves the button is unaffected.
 * ------------------------------------------------------------------ */

const CACHE_KEY = 'f1_next'
const CACHE_TTL = 3600000 // an hour, matching the Sidecar

// Hand-drawn racing italic "F1" with three trailing speed bars.
//
// The bars are wider and further apart than the wide banner's were. The
// original set was tuned to look right at 48px and turned into a red smudge
// once it came down to button size, so this set is drawn for the small end.
function F1Mark({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 70 26" fill="none" aria-hidden="true">
      <g transform="translate(6.5,0) skewX(-14)">
        <path d="M0 0H19V7H8V10.5H15V16.5H8V26H0Z" fill="#fff" />
        <path d="M23 7.5L31 0H38V26H30V7.5Z" fill="#fff" />
        <rect x="43" y="0" width="6" height="26" fill="#E10600" />
        <rect x="52" y="0" width="5" height="26" fill="#E10600" opacity=".6" />
        <rect x="60" y="0" width="4" height="26" fill="#E10600" opacity=".32" />
      </g>
    </svg>
  )
}

export default function F1Button() {
  const [race, setRace] = useState(null)
  const [ready, setReady] = useState(false)

  // The landing page has enough to do on first paint.
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1500)
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
      .catch(() => {})
    return () => { alive = false }
  }, [ready])

  const start = race?.date ? new Date(`${race.date}T${race.time || '12:00:00Z'}`).getTime() : null
  const days = start ? Math.max(0, Math.ceil((start - Date.now()) / 86400000)) : null

  const when = days == null ? '' : days === 0 ? ' — today' : days === 1 ? ' — tomorrow' : ` — in ${days} days`
  const title = race
    ? `Formula 1 — next up: ${race.raceName}${when}`
    : 'Formula 1 — the season, the standings and the calendar'

  // Only in the last few days before lights out, so it stays meaningful.
  const raceWeek = days != null && days <= 3

  return (
    <a
      href="#/f1"
      aria-label={title}
      title={title}
      className="group f1btn rail-btn shadow-lg"
      style={{ '--rail-i': 0 }}
    >
      {raceWeek && (
        <span
          className="rail-pip animate-pulse"
          style={{ background: '#E10600' }}
          aria-hidden="true"
        />
      )}

      {/* A finish line wrapped around the rim. The band is white with the
          squares punched out of it — a black-on-dark chequer just disappears
          into the page and reads as a dashed border. Two rows offset by one
          square is what makes it a flag rather than a dotted line. */}
      <svg className="f1btn-ring rail-rim" viewBox="0 0 54 54" fill="none" aria-hidden="true">
        <circle cx="27" cy="27" r="24.5" stroke="#fff" strokeWidth="4.4" />
        <circle cx="27" cy="27" r="25.6" stroke="#0A0A0C" strokeWidth="2.2" strokeDasharray="8.042 8.042" transform="rotate(-90 27 27)" />
        <circle cx="27" cy="27" r="23.4" stroke="#0A0A0C" strokeWidth="2.2" strokeDasharray="7.351 7.351" strokeDashoffset="7.351" transform="rotate(-90 27 27)" />
      </svg>

      <F1Mark className="f1btn-mark transition-transform group-hover:translate-x-0.5" />

      <style>{`
        .f1btn {
          background: #0A0A0C;
          box-shadow: 0 8px 24px -6px rgba(0,0,0,.75);
          transition: transform .2s ease, box-shadow .25s ease;
        }
        /* The mark is a share of the button so it scales with the rail. */
        .f1btn-mark { width: 82%; }
        .f1btn-ring { transition: transform .5s cubic-bezier(.22,.61,.36,1); }
        .f1btn:hover { box-shadow: 0 10px 26px -6px rgba(225,6,0,.5); }
        .f1btn:hover .f1btn-ring { transform: rotate(27deg); }
        @media (prefers-reduced-motion: reduce) {
          .f1btn-ring { transition: none; }
          .f1btn:hover .f1btn-ring { transform: none; }
        }
      `}</style>
    </a>
  )
}
