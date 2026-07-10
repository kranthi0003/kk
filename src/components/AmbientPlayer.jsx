import React, { useState } from 'react'
import { useAmbient } from './AmbientContext'

// The visible ambient control — a calm, loose play/pause that lives in the
// navbar next to the name. All the audio logic lives in AmbientProvider
// (AmbientContext), which sits above the router so playback persists across
// every page; this component only reflects that state and sends commands.

export default function AmbientPlayer() {
  const amb = useAmbient()
  const [hover, setHover] = useState(false)
  const prefersReduced = typeof window !== 'undefined' &&
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!amb) return null
  const { built, playing, everPlayed, track, vol, toggle, next, prev, setVol } = amb

  return (
    <>
      <style>{`
        @keyframes amb-ring { 0%,100%{transform:scale(1);opacity:.55} 50%{transform:scale(1.5);opacity:0} }
      `}</style>

      <div
        className="relative flex items-center flex-shrink-0"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* soft divider from the name — calm separation, no box */}
        <span aria-hidden="true" className="hidden sm:block flex-shrink-0 mr-3" style={{ width: 1, height: 22, background: 'var(--color-border)', opacity: 0.5 }} />

        {/* Play / pause — a light ghost circle: airy, but still obviously a control */}
        <button
          onClick={toggle}
          disabled={!built}
          title={built ? (playing ? 'Pause music' : 'Play music') : 'Loading…'}
          aria-label={playing ? 'Pause music' : 'Play music'}
          className="relative flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
          style={{ width: 30, height: 30, borderRadius: 999,
            background: 'color-mix(in oklab, var(--color-accent) 11%, transparent)',
            color: 'var(--color-accent)' }}
        >
          {!everPlayed && !prefersReduced && (
            <span aria-hidden="true" className="absolute rounded-full" style={{ inset: -1, border: '1.5px solid var(--color-accent)', animation: 'amb-ring 2.4s ease-out infinite' }} />
          )}
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>

        {/* Label — open, no box; also a hit target */}
        <div onClick={toggle} className="hidden sm:flex flex-col justify-center cursor-pointer select-none min-w-0 ml-2.5">
          <span className="text-[11.5px] font-medium leading-tight truncate" style={{ color: 'var(--color-foreground)', maxWidth: 132 }}>{playing ? track.title : 'Play music'}</span>
          <span className="text-[9.5px] leading-tight truncate text-muted-foreground" style={{ maxWidth: 132 }}>{playing ? track.by : 'ambient radio'}</span>
        </div>

        {/* Hover-reveal (desktop): prev / next / volume — open, no box */}
        <div
          className="hidden md:flex items-center transition-all duration-300 ease-out overflow-hidden"
          style={{ maxWidth: hover ? 150 : 0, opacity: hover ? 1 : 0 }}
        >
          <button onClick={prev} title="Previous track" aria-label="Previous track"
            className="flex-shrink-0 flex items-center justify-center hover:text-foreground text-muted-foreground/70 transition-colors ml-1.5" style={{ width: 22, height: 30 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button onClick={next} title="Next track" aria-label="Next track"
            className="flex-shrink-0 flex items-center justify-center hover:text-foreground text-muted-foreground/70 transition-colors" style={{ width: 22, height: 30 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zm-2.5 6L5 6v12z"/></svg>
          </button>
          <input
            type="range" min="0" max="100" value={vol}
            onChange={(e) => setVol(parseInt(e.target.value, 10))}
            aria-label="Ambient volume"
            className="ambient-vol flex-shrink-0 ml-1.5"
            style={{ width: 46, accentColor: 'var(--color-accent)' }}
          />
        </div>
      </div>
    </>
  )
}
