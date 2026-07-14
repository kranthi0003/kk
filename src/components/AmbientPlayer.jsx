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
  const { built, playing, everPlayed, track, vol, loop, toggle, next, prev, setVol, toggleLoop } = amb

  return (
    <>
      <style>{`
        @keyframes amb-ring { 0%,100%{transform:scale(1);opacity:.55} 50%{transform:scale(1.5);opacity:0} }
        @keyframes amb-eq1 { 0%,100%{height:4px} 50%{height:13px} }
        @keyframes amb-eq2 { 0%,100%{height:11px} 50%{height:5px} }
        @keyframes amb-eq3 { 0%,100%{height:6px} 50%{height:14px} }
        @keyframes amb-eq4 { 0%,100%{height:13px} 50%{height:7px} }
      `}</style>

      <div
        className="relative flex items-center flex-shrink-0"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        {/* soft divider from the name — calm separation, no box */}
        <span aria-hidden="true" className="hidden sm:block flex-shrink-0 mr-3" style={{ width: 1, height: 22, background: 'var(--color-border)', opacity: 0.5 }} />

        {/* Vibrant "now playing" chip. Shows dancing equalizer bars by default;
            reveals the play/pause icon on hover so it's clearly a control. */}
        <button
          onClick={toggle}
          disabled={!built}
          title={built ? (playing ? 'Pause music' : 'Play music') : 'Loading…'}
          aria-label={playing ? 'Pause music' : 'Play music'}
          className="relative flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
          style={{ width: 32, height: 32, borderRadius: 999,
            background: playing
              ? 'color-mix(in oklab, var(--color-accent) 22%, transparent)'
              : 'color-mix(in oklab, var(--color-accent) 12%, transparent)',
            color: 'var(--color-accent)',
            boxShadow: playing ? '0 0 12px -2px color-mix(in oklab, var(--color-accent) 55%, transparent)' : 'none' }}
        >
          {!everPlayed && !prefersReduced && (
            <span aria-hidden="true" className="absolute rounded-full" style={{ inset: -1, border: '1.5px solid var(--color-accent)', animation: 'amb-ring 2.4s ease-out infinite' }} />
          )}
          {hover ? (
            // On hover: the actual play/pause control
            playing ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}><path d="M8 5v14l11-7z" /></svg>
            )
          ) : (
            // Default: vibrant equalizer bars (dancing when playing, resting when paused)
            <span className="flex items-end gap-[2px]" style={{ height: 15 }} aria-hidden="true">
              {[1, 2, 3, 4].map((n) => (
                <span key={n} style={{
                  width: 2.5, borderRadius: 2, background: 'currentColor',
                  height: playing ? undefined : 4,
                  opacity: playing ? 1 : 0.55,
                  animation: (playing && !prefersReduced) ? `amb-eq${n} ${0.9 + n * 0.12}s ease-in-out infinite` : 'none',
                }} />
              ))}
            </span>
          )}
        </button>

        {/* Open the full music library / playlists page */}
        <button
          onClick={() => { window.location.hash = '#/music' }}
          title="Open music library"
          aria-label="Open music library"
          className="flex-shrink-0 flex items-center justify-center ml-1.5 text-muted-foreground/70 hover:text-foreground transition-colors"
          style={{ width: 26, height: 30 }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
          </svg>
        </button>

        {/* Label — open, no box; also a hit target */}
        <div onClick={toggle} className="hidden sm:flex flex-col justify-center cursor-pointer select-none min-w-0 ml-2.5">
          <span className="text-[11.5px] font-medium leading-tight truncate" style={{ color: 'var(--color-foreground)', maxWidth: 132 }}>{playing ? track.title : 'Play music'}</span>
          <span className="text-[9.5px] leading-tight truncate text-muted-foreground" style={{ maxWidth: 132 }}>{playing ? track.by : 'ambient radio'}</span>
        </div>

        {/* Hover-reveal (desktop): prev / next / volume — open, no box */}
        <div
          className="hidden md:flex items-center transition-all duration-300 ease-out overflow-hidden"
          style={{ maxWidth: hover ? 180 : 0, opacity: hover ? 1 : 0 }}
        >
          <button onClick={prev} title="Previous track" aria-label="Previous track"
            className="flex-shrink-0 flex items-center justify-center hover:text-foreground text-muted-foreground/70 transition-colors ml-1.5" style={{ width: 22, height: 30 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
          </button>
          <button onClick={next} title="Next track" aria-label="Next track"
            className="flex-shrink-0 flex items-center justify-center hover:text-foreground text-muted-foreground/70 transition-colors" style={{ width: 22, height: 30 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zm-2.5 6L5 6v12z"/></svg>
          </button>
          <button onClick={toggleLoop} title={loop ? 'Loop: on (repeat this song)' : 'Loop: off'} aria-label="Toggle loop" aria-pressed={loop}
            className="relative flex-shrink-0 flex items-center justify-center transition-colors ml-0.5"
            style={{ width: 22, height: 30, color: loop ? 'var(--color-accent)' : undefined }}>
            <span className={loop ? '' : 'text-muted-foreground/70 hover:text-foreground'} style={{ display: 'inline-flex' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                <path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
              </svg>
            </span>
            {loop && <span aria-hidden="true" className="absolute rounded-full" style={{ width: 3, height: 3, background: 'var(--color-accent)', bottom: 3, left: '50%', transform: 'translateX(-50%)' }} />}
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
