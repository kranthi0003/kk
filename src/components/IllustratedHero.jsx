import React, { useEffect, useRef, useState } from 'react'

/**
 * IllustratedHero — gkoberger-style scene with clickable hover-pop hotspots.
 *
 * USAGE:
 *  1. Drop the final illustration as `src` below (PNG/SVG, transparent bg recommended).
 *  2. Tweak each hotspot's { top, left, width, height } in PERCENT of the image box
 *     so the rectangle covers exactly the object in the artwork.
 *  3. Set `kind: 'section' | 'url' | 'event'` and the matching target.
 *
 * Hotspots are invisible by default. On hover they pop (scale + lift), show a tinted ring
 * and a label tag. Click triggers the action.
 */

const IMG_SRC = '/hero-illustration.png' // place artwork in `public/hero-illustration.png`

// Hotspot rectangles are expressed in percent of the image-box width/height.
// Adjust these once the real illustration is in place.
const HOTSPOTS = [
  { key: 'projects', label: 'My Projects',     top: 4,  left: 12, width: 28, height: 28, kind: 'section', target: 'projects', tint: 'violet' },
  { key: 'monitor',  label: 'Travel Map',      top: 4,  left: 56, width: 32, height: 36, kind: 'section', target: 'travel',   tint: 'coral'  },
  { key: 'owl',      label: 'About Me',        top: 30, left: 16, width: 14, height: 30, kind: 'section', target: 'about',    tint: 'magenta'},
  { key: 'laptop',   label: 'Experience',      top: 48, left: 36, width: 28, height: 28, kind: 'section', target: 'experience', tint: 'violet' },
  { key: 'books',    label: 'Reading',         top: 58, left: 2,  width: 16, height: 26, kind: 'section', target: 'reading',  tint: 'coral'  },
  { key: 'mug',      label: 'Guestbook',       top: 60, left: 24, width: 8,  height: 18, kind: 'section', target: 'guestbook', tint: 'magenta' },
  { key: 'headphones', label: 'Spotify',       top: 70, left: 16, width: 10, height: 14, kind: 'event',   target: 'open-spotify', tint: 'violet' },
  { key: 'camera',   label: 'Photos',          top: 58, left: 68, width: 12, height: 16, kind: 'section', target: 'travel',   tint: 'coral'  },
  { key: 'octocat',  label: 'GitHub',          top: 56, left: 82, width: 12, height: 22, kind: 'url',     target: 'https://github.com/kranthi0003', tint: 'magenta' },
  { key: 'map',      label: 'Where I am',      top: 74, left: 70, width: 22, height: 18, kind: 'section', target: 'travel',   tint: 'violet' },
]

const tintRing = {
  violet:  'ring-violet-400/70  bg-violet-500/10',
  magenta: 'ring-pink-400/70    bg-pink-500/10',
  coral:   'ring-orange-400/70  bg-orange-500/10',
}
const tintLabel = {
  violet:  'bg-violet-500 text-white',
  magenta: 'bg-pink-500   text-white',
  coral:   'bg-orange-500 text-white',
}

function Hotspot({ spot, onActivate }) {
  const cls = `absolute group cursor-pointer transition-transform duration-300 ease-out
    hover:-translate-y-1 hover:scale-[1.04] focus-visible:scale-[1.04]
    focus:outline-none`
  const ringCls = `absolute inset-0 rounded-xl ring-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${tintRing[spot.tint] || tintRing.violet}`
  const labelCls = `absolute left-1/2 -translate-x-1/2 -top-7 px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${tintLabel[spot.tint] || tintLabel.violet}`
  const style = {
    top: `${spot.top}%`,
    left: `${spot.left}%`,
    width: `${spot.width}%`,
    height: `${spot.height}%`,
  }
  return (
    <button
      type="button"
      className={cls}
      style={style}
      onClick={() => onActivate(spot)}
      aria-label={spot.label}
      title={spot.label}
    >
      <span className={ringCls} />
      <span className={labelCls}>{spot.label}</span>
    </button>
  )
}

export default function IllustratedHero() {
  const [imgError, setImgError] = useState(false)

  const onActivate = (spot) => {
    if (spot.kind === 'section') {
      const el = document.getElementById(spot.target)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (spot.kind === 'url') {
      window.open(spot.target, '_blank', 'noopener,noreferrer')
    } else if (spot.kind === 'event') {
      window.dispatchEvent(new CustomEvent(spot.target))
    }
  }

  return (
    <section id="home" className="relative pt-[var(--header-height)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Greeting */}
        <div className="text-center mb-6 sm:mb-10">
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Currently at GitHub · Microsoft
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Hey, I'm <span className="text-gradient-violet">Kranthi</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
            Hover the scene below — every item is a doorway into a different part of my world.
          </p>
        </div>

        {/* Illustration with hotspots */}
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-border/40 bg-gradient-to-br from-violet-500/5 via-pink-500/5 to-orange-500/5">
          {!imgError ? (
            <img
              src={IMG_SRC}
              alt="Kranthi's workspace illustration"
              className="absolute inset-0 w-full h-full object-contain select-none"
              draggable={false}
              onError={() => setImgError(true)}
            />
          ) : (
            <PlaceholderScene />
          )}
          {HOTSPOTS.map(spot => (
            <Hotspot key={spot.key} spot={spot} onActivate={onActivate} />
          ))}
        </div>

        {/* Helper text under the scene */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground/60 uppercase tracking-wider">
          {HOTSPOTS.map(s => (
            <button
              key={s.key}
              onClick={() => onActivate(s)}
              className="hover:text-foreground transition-colors"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

// Placeholder rendered until /hero-illustration.png is dropped in /public.
function PlaceholderScene() {
  return (
    <div className="absolute inset-0 grid grid-cols-5 grid-rows-3 gap-3 p-6">
      {['📝 Projects', '🖥️ Travel', '🦉 About', '📚 Reading', '☕ Guestbook',
        '🎧 Spotify', '💻 Experience', '📷 Photos', '🐙 GitHub', '🗺️ Map',
        '📌', '✏️', '🎨', '💡', '🚀'].map((emoji, i) => (
        <div key={i} className="flex items-center justify-center text-3xl sm:text-5xl opacity-30 select-none">
          {emoji}
        </div>
      ))}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <p className="px-4 py-2 rounded-xl bg-background/80 backdrop-blur border border-border text-sm text-muted-foreground">
          Drop your artwork at <code className="font-mono text-foreground">public/hero-illustration.png</code>
        </p>
      </div>
    </div>
  )
}
