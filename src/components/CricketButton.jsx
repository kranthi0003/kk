import React, { useEffect, useState } from 'react'

/* ------------------------------------------------------------------ *
 * The cricket button — third in the rail, under the Sidecar and F1.
 *
 * The first version of this was a photoreal red leather ball. It was the
 * only skeuomorphic thing in the rail, and worse, it was hardcoded red —
 * so it ignored the site hue the colour picker sets and clashed the moment
 * the theme moved off red. This follows the Sidecar instead: a flat disc
 * built from theme tokens with a stroked line icon, so it recolours with
 * everything else.
 *
 * Stumps rather than a ball, because a ball inside a round button is just
 * a circle in a circle. Nothing else in the world looks like stumps.
 *
 * It fetches cricket-now.json — a couple of hundred bytes written by the
 * same generator as the page — purely for the tooltip and for a green pip
 * when a series is actually being played. The full cricket.json is ~50KB
 * and has no business loading on the landing page. If the request never
 * lands the button is unaffected.
 * ------------------------------------------------------------------ */

const CACHE_KEY = 'cricket_now'
const CACHE_TTL = 3600000 // an hour, matching the other buttons

// Three stumps with the bails resting across them. The bails are a separate
// group so they can be knocked askew on hover. The gap over the middle stump
// is what makes them two bails instead of one long line.
function Stumps({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <g className="ckbtn-stumps">
        <path d="M7.2 9.6v10.8" />
        <path d="M12 9.6v10.8" />
        <path d="M16.8 9.6v10.8" />
      </g>
      {/* Thinner than the stumps, with a real gap over the middle one —
          otherwise the three caps and the bail merge into a single bar. */}
      <g className="ckbtn-bails" strokeWidth="1.5">
        <path d="M6.6 6.9h3.9" />
        <path d="M13.5 6.9h3.9" />
      </g>
    </svg>
  )
}

export default function CricketButton() {
  const [now, setNow] = useState(null)
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
        setNow(cached.now)
        return
      }
    } catch {}

    let alive = true
    fetch(`${import.meta.env.BASE_URL}cricket-now.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (!alive) return
        setNow(d)
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ now: d, ts: Date.now() }))
        } catch {}
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [ready])

  const tour = now?.tour || null
  const title = !tour
    ? 'Cricket — rankings, tours and results'
    : tour.status === 'live'
      ? `Cricket — on now: ${tour.name}`
      : `Cricket — next up: ${tour.name}`

  // Only when something is actually being played.
  const playing = !!now?.live

  return (
    <a
      href="#/cricket"
      aria-label={title}
      title={title}
      className="group ckbtn fixed top-52 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
    >
      {playing && (
        <span
          className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background animate-pulse z-10"
          style={{ background: '#35B96C' }}
          aria-hidden="true"
        />
      )}

      <Stumps className="ckbtn-icon w-7 h-7" />

      <style>{`
        .ckbtn {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          color: var(--color-accent);
          box-shadow: 0 8px 24px -6px rgba(0,0,0,.45);
          transition: transform .2s ease, box-shadow .25s ease, border-color .25s ease;
        }
        .ckbtn-bails {
          transform-origin: 12px 6.9px;
          transition: transform .45s cubic-bezier(.22,.61,.36,1);
        }
        .ckbtn:hover {
          border-color: color-mix(in oklab, var(--color-accent) 55%, transparent);
          box-shadow: 0 10px 26px -6px color-mix(in oklab, var(--color-accent) 45%, transparent);
        }
        /* Bowled: the bails get clipped off the top. */
        .ckbtn:hover .ckbtn-bails { transform: translate(1.5px, -2.4px) rotate(12deg); }
        @media (prefers-reduced-motion: reduce) {
          .ckbtn-bails { transition: none; }
          .ckbtn:hover .ckbtn-bails { transform: none; }
        }
      `}</style>
    </a>
  )
}
