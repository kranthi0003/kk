import React, { useEffect, useState } from 'react'

/* ------------------------------------------------------------------ *
 * The cricket button — third in the rail, under the Sidecar and F1.
 *
 * The control is already a circle, so it may as well be the ball: red
 * leather with the seam stitched across it. That gets the subject across
 * without a label, and it reads as clearly at 48px as the chequered ring
 * does on the F1 button next to it.
 *
 * It fetches cricket-now.json — a couple of hundred bytes written by the
 * same generator as the page — purely for the tooltip and for a green pip
 * when a series is actually being played. The full cricket.json is ~50KB
 * and has no business loading on the landing page. If the request never
 * lands the button is unaffected.
 * ------------------------------------------------------------------ */

const CACHE_KEY = 'cricket_now'
const CACHE_TTL = 3600000 // an hour, matching the other buttons

// A cricket ball: leather with a light source top-left, and the seam bowed
// across the face. Two faint guide lines with a dashed line between them is
// what makes it stitching rather than a stripe.
function Ball({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="ckb" cx="34%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#C8332C" />
          <stop offset="55%" stopColor="#9E1F1C" />
          <stop offset="100%" stopColor="#5E100F" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#ckb)" />
      <g stroke="#F6EFE4" fill="none" strokeLinecap="round">
        <path d="M16.5 3.4C25 12 25 36 16.5 44.6" strokeWidth="1" opacity=".45" />
        <path d="M23.5 3.4C32 12 32 36 23.5 44.6" strokeWidth="1" opacity=".45" />
        <path
          d="M20 3.2C28.6 12 28.6 36 20 44.8"
          strokeWidth="2.4"
          strokeDasharray="1.5 3.6"
          opacity=".95"
        />
      </g>
      {/* The sheen on the polished side, which is what the seam divides. */}
      <ellipse cx="15" cy="15" rx="9" ry="7" fill="#fff" opacity=".1" transform="rotate(-28 15 15)" />
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
      className="group ckbtn fixed top-[12.5rem] right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
    >
      {playing && (
        <span
          className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background animate-pulse z-10"
          style={{ background: '#35B96C' }}
          aria-hidden="true"
        />
      )}

      <Ball className="ckbtn-ball w-12 h-12" />

      <style>{`
        .ckbtn {
          background: #5E100F;
          box-shadow: 0 8px 24px -6px rgba(0,0,0,.75);
          transition: transform .2s ease, box-shadow .25s ease;
        }
        .ckbtn-ball {
          transition: transform .6s cubic-bezier(.22,.61,.36,1);
        }
        .ckbtn:hover { box-shadow: 0 10px 26px -6px rgba(161,30,30,.55); }
        .ckbtn:hover .ckbtn-ball { transform: rotate(38deg); }
        @media (prefers-reduced-motion: reduce) {
          .ckbtn-ball { transition: none; }
          .ckbtn:hover .ckbtn-ball { transform: none; }
        }
      `}</style>
    </a>
  )
}
