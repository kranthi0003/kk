import React, { useEffect, useState } from 'react'

/* ------------------------------------------------------------------ *
 * The cricket button — third in the rail, under the Sidecar and F1.
 *
 * This went dark-disc-and-thin-stroke for a while, to recolour with the
 * site hue. It was the right instinct and the wrong result: next to the
 * F1 button it read as switched off. So it's a cricket ball again — but
 * flat, not the photoreal leather of the first attempt. The seam is the
 * rim rather than a line across a sphere, which sidesteps the circle-in-
 * a-circle problem that sent us to stumps in the first place.
 *
 * The red is deliberately fixed rather than themed, on the same grounds
 * as the F1 button beside it: a cricket ball is red the way a chequered
 * flag is black and white. It is an identity, not a decoration.
 *
 * It is not, however, a saturated disc. A pillarbox-red circle sat on
 * top of a page whose surfaces are near-neutral and read as a sticker.
 * The red now tints the site's own card colour and carries the stumps
 * and the seam, which is enough to say cricket without shouting.
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
      className="group ckbtn rail-btn rail-tint"
      style={{ '--rail-i': 2, '--tint': '#E4737C' }}
    >
      {playing && (
        <span
          className="rail-pip animate-pulse"
          style={{ background: '#35B96C' }}
          aria-hidden="true"
        />
      )}

      {/* The seam, wrapped around the rim: a solid line with the stitches
          sitting across it. Two offset rows of dashes is what reads as
          stitching rather than as a dotted border. */}
      <svg className="ckbtn-seam rail-rim" viewBox="0 0 54 54" fill="none" aria-hidden="true">
        <circle cx="27" cy="27" r="24.6" stroke="currentColor" strokeWidth="1.3" opacity=".45" />
        <circle cx="27" cy="27" r="24.6" stroke="currentColor" strokeWidth="3.4" strokeDasharray="2.6 5.2" opacity=".95" />
      </svg>

      <Stumps className="ckbtn-icon rail-ico" />

      <style>{`

        .ckbtn-bails {
          transform-origin: 12px 6.9px;
          transition: transform .45s cubic-bezier(.22,.61,.36,1);
        }
        .ckbtn-seam { transition: transform .55s cubic-bezier(.22,.61,.36,1); }
        /* The ball turns, the way it does off the seam. */
        .ckbtn:hover .ckbtn-seam { transform: rotate(38deg); }
        /* Bowled: the bails get clipped off the top. */
        .ckbtn:hover .ckbtn-bails { transform: translate(1.5px, -2.4px) rotate(12deg); }
        @media (prefers-reduced-motion: reduce) {
          .ckbtn-bails, .ckbtn-seam { transition: none; }
          .ckbtn:hover .ckbtn-bails, .ckbtn:hover .ckbtn-seam { transform: none; }
        }
      `}</style>
    </a>
  )
}
