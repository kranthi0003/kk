import React from 'react'
import { useAmbient } from './AmbientContext'

/* ------------------------------------------------------------------ *
 * The music button — fourth in the rail, under the Sidecar, F1 and
 * cricket.
 *
 * #/music has existed for a while but nothing on the site pointed at it,
 * so the only way to reach it was to already know the URL. This is the
 * door.
 *
 * Unlike the cricket button it doesn't fetch anything for its live pip.
 * The site-wide radio is already running in context, so whether music is
 * playing is a fact we hold in memory — asking the network would be both
 * slower and less accurate.
 *
 * The rim only turns while something is actually playing. That keeps the
 * button honest: the motion is the state, not decoration, and a still
 * rim means a silent radio. It was a four-stop rainbow for a while,
 * which was louder than anything else on the page; it's now a single
 * soft violet, and the movement does the work the colour was doing.
 * ------------------------------------------------------------------ */

// A beamed pair of notes, drawn as solid shapes rather than thin strokes —
// a hairline icon is what made this button read as switched off next to F1.
// Deliberately not a vinyl disc: a circle inside a circular button reads as
// a ring, the same mistake the cricket button was written to avoid.
function Note({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* the beam joining the two stems */}
      <path d="M8.9 3.7l11.2-2.5v3.9L8.9 7.6z" fill="currentColor" />
      {/* stems */}
      <rect x="8.9" y="3.7" width="1.9" height="13.4" fill="currentColor" />
      <rect x="18.2" y="1.6" width="1.9" height="13.4" fill="currentColor" />
      {/* heads, sitting off the left of each stem */}
      <ellipse cx="6.4" cy="17.4" rx="3.4" ry="2.7" transform="rotate(-16 6.4 17.4)" fill="currentColor" />
      <ellipse cx="15.7" cy="15.3" rx="3.4" ry="2.7" transform="rotate(-16 15.7 15.3)" fill="currentColor" />
    </svg>
  )
}

export default function MusicButton() {
  const ambient = useAmbient()
  const playing = !!ambient?.playing && !ambient?.suppressed
  const track = ambient?.track

  const title = playing && track?.title
    ? `Music — playing: ${track.title}`
    : 'Music — the radio, and build your own playlists'

  return (
    <a
      href="#/music"
      aria-label={title}
      title={title}
      className={'group msbtn rail-btn rail-tint' + (playing ? ' is-playing' : '')}
      style={{ '--rail-i': 2, '--tint': '#B79BEE' }}
    >
      {playing && (
        <span
          className="rail-pip animate-pulse"
          style={{ background: '#35B96C' }}
          aria-hidden="true"
        />
      )}

      {/* A broken rim, so there's something to see turning. It spins only
          while the radio is playing. */}
      <svg className="msbtn-rim rail-rim" viewBox="0 0 54 54" fill="none" aria-hidden="true">
        <circle cx="27" cy="27" r="24.6" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeDasharray="30 14" opacity=".9" />
      </svg>

      <Note className="msbtn-icon rail-ico" />

      <style>{`
        .msbtn-rim { transition: transform .55s cubic-bezier(.22,.61,.36,1); }
        .msbtn:hover .msbtn-rim { transform: rotate(34deg); }
        /* Turning = playing. A still rim means the radio is off. */
        .msbtn.is-playing .msbtn-rim { animation: msbtnSpin 5.5s linear infinite; }
        .msbtn.is-playing:hover .msbtn-rim { transform: none; }
        @keyframes msbtnSpin { to { transform: rotate(360deg); } }
        /* The notes lift a step on hover, the way they would on a stave. */
        .msbtn-icon { transition: transform .35s cubic-bezier(.22,.61,.36,1); }
        .msbtn:hover .msbtn-icon { transform: translateY(-1.5px); }
        @media (prefers-reduced-motion: reduce) {
          .msbtn-icon, .msbtn-rim { transition: none; }
          .msbtn.is-playing .msbtn-rim { animation: none; }
          .msbtn:hover .msbtn-icon, .msbtn:hover .msbtn-rim { transform: none; }
        }
      `}</style>
    </a>
  )
}
