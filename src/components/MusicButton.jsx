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
 * The rim is a spectrum, and it only turns while something is actually
 * playing. That keeps the button honest: the motion is the state, not
 * decoration, and a still ring means a silent radio.
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
      className={'group msbtn rail-btn shadow-lg' + (playing ? ' is-playing' : '')}
      style={{ '--rail-i': 3 }}
    >
      {playing && (
        <span
          className="rail-pip animate-pulse"
          style={{ background: '#35B96C' }}
          aria-hidden="true"
        />
      )}

      {/* The spectrum rim. It spins only while the radio is playing. */}
      <svg className="msbtn-rim rail-rim" viewBox="0 0 54 54" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="msbtn-spec" x1="0" y1="0" x2="54" y2="54" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FF8A3D" />
            <stop offset=".34" stopColor="#FF3D77" />
            <stop offset=".68" stopColor="#8A5CFF" />
            <stop offset="1" stopColor="#31D0F5" />
          </linearGradient>
        </defs>
        <circle cx="27" cy="27" r="24.6" stroke="url(#msbtn-spec)" strokeWidth="3.4" strokeLinecap="round" strokeDasharray="118 36" />
      </svg>

      <Note className="msbtn-icon rail-ico" />

      <style>{`
        .msbtn {
          background: radial-gradient(circle at 32% 26%, #34204F 0%, #1B1030 52%, #0E0819 100%);
          color: #FFFFFF;
          box-shadow: 0 8px 24px -6px rgba(90,40,160,.5);
        }
        .msbtn:hover { box-shadow: 0 10px 26px -6px rgba(255,61,119,.5); }
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
