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
 * ------------------------------------------------------------------ */

// An eighth note. Deliberately not a vinyl disc: a circle inside a circular
// button reads as a ring, which is the same mistake the cricket button was
// written to avoid.
function Note({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* stem and flag */}
      <path d="M10 18V5.4l8-1.9v5.2" />
      <path d="M10 8.6l8-1.9" strokeWidth="1.5" />
      {/* the note head, offset left so it hangs off the stem properly */}
      <ellipse className="msbtn-head" cx="7.6" cy="18" rx="2.6" ry="2.2" />
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
      className="group msbtn fixed top-[17rem] right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
    >
      {playing && (
        <span
          className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background animate-pulse z-10"
          style={{ background: '#35B96C' }}
          aria-hidden="true"
        />
      )}

      <Note className="msbtn-icon w-6 h-6" />

      <style>{`
        .msbtn {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          color: var(--color-accent);
          box-shadow: 0 8px 24px -6px rgba(0,0,0,.45);
          transition: transform .2s ease, box-shadow .25s ease, border-color .25s ease;
        }
        .msbtn:hover {
          border-color: color-mix(in oklab, var(--color-accent) 55%, transparent);
          box-shadow: 0 10px 26px -6px color-mix(in oklab, var(--color-accent) 45%, transparent);
        }
        /* The note lifts a step on hover, the way it would on a stave. */
        .msbtn-icon { transition: transform .35s cubic-bezier(.22,.61,.36,1); }
        .msbtn:hover .msbtn-icon { transform: translateY(-1.5px); }
        @media (prefers-reduced-motion: reduce) {
          .msbtn-icon { transition: none; }
          .msbtn:hover .msbtn-icon { transform: none; }
        }
      `}</style>
    </a>
  )
}
