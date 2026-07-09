import React, { useEffect, useRef, useState, useCallback } from 'react'

// A quiet ambient "radio" — a small, opt-in background-music player that fits
// the site's calm theme. It never autoplays with sound (browsers block that,
// and forcing audio would break the calm); the first click starts it. Tracks
// are embedded via the official YouTube IFrame API, so licensing/ads are
// handled by YouTube. Auto-advances through the list and loops.

const TRACKS = [
  { id: 'wmLGG5DYDWQ', title: 'Late Night Drive', by: 'Cigarettes After Sex mix' },
  { id: 'vx4kLgnFexo', title: 'My Love Mine All Mine', by: 'Mitski' },
  { id: 'DOT1LmQbFFA', title: 'Weightless',       by: 'Martin Garrix & Arijit Singh' },
  { id: 'NgsWGfUlwJI', title: 'Glimpse of Us',     by: 'Joji' },
  { id: 'gJLVTKhTnog', title: 'Husn',              by: 'Anuv Jain' },
  { id: 'VF-FGf_ZZiI', title: 'Bad Habit',         by: 'Steve Lacy' },
  { id: 'MiAoetOXKcY', title: 'Say Yes to Heaven', by: 'Lana Del Rey' },
  { id: 'myh5xtfUG-I', title: 'double take',       by: 'dhruv' },
  { id: 'Il7Nv270zNk', title: 'cold/mess',         by: 'Prateek Kuhad' },
  { id: 'GCdwKhTtNNw', title: 'Sweater Weather',   by: 'The Neighbourhood' },
  { id: 'MJyKN-8UncM', title: 'Shayad',            by: 'Arijit Singh' },
  { id: 'uzS3WG6__G4', title: 'Pink + White',      by: 'Frank Ocean' },
  { id: 'LDY_XyxBu8A', title: 'Snooze',            by: 'SZA' },
  { id: 'cW8VLC9nnTo', title: 'What Was I Made For?', by: 'Billie Eilish' },
  { id: 'sElE_BfQ67s', title: 'Apocalypse',        by: 'Cigarettes After Sex' },
]

const DEFAULT_VOL = 28

// Load the YouTube IFrame API once, shared across the app.
function useYouTubeAPI() {
  const [ready, setReady] = useState(() => !!(window.YT && window.YT.Player))
  useEffect(() => {
    if (window.YT && window.YT.Player) { setReady(true); return }
    if (!document.getElementById('yt-iframe-api')) {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { try { prev && prev() } catch {} }
      const s = document.createElement('script')
      s.id = 'yt-iframe-api'
      s.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(s)
    }
    const t = setInterval(() => {
      if (window.YT && window.YT.Player) { setReady(true); clearInterval(t) }
    }, 300)
    return () => clearInterval(t)
  }, [])
  return ready
}

export default function AmbientPlayer() {
  const apiReady = useYouTubeAPI()
  const playerRef = useRef(null)
  const hostRef = useRef(null)
  const [built, setBuilt] = useState(false)

  const [idx, setIdx] = useState(() => {
    const n = parseInt(localStorage.getItem('ambient_idx') || '0', 10)
    return Number.isFinite(n) && n >= 0 && n < TRACKS.length ? n : 0
  })
  const [playing, setPlaying] = useState(false)
  const [hover, setHover] = useState(false)
  const [vol, setVol] = useState(() => {
    const v = parseInt(localStorage.getItem('ambient_vol') || String(DEFAULT_VOL), 10)
    return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : DEFAULT_VOL
  })

  const idxRef = useRef(idx)
  idxRef.current = idx

  const prefersReduced = typeof window !== 'undefined' &&
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Build the player once the API is ready.
  useEffect(() => {
    if (!apiReady || !hostRef.current || playerRef.current) return
    playerRef.current = new window.YT.Player(hostRef.current, {
      videoId: TRACKS[idxRef.current].id,
      playerVars: {
        autoplay: 0, controls: 0, disablekb: 1, fs: 0,
        modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3,
      },
      events: {
        onReady: (e) => { try { e.target.setVolume(vol) } catch {}; setBuilt(true) },
        onStateChange: (e) => {
          const YT = window.YT
          if (e.data === YT.PlayerState.ENDED) {
            const next = (idxRef.current + 1) % TRACKS.length
            setIdx(next)
            try { e.target.loadVideoById(TRACKS[next].id) } catch {}
          } else if (e.data === YT.PlayerState.PLAYING) {
            setPlaying(true)
          } else if (e.data === YT.PlayerState.PAUSED) {
            setPlaying(false)
          }
        },
      },
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiReady])

  useEffect(() => { localStorage.setItem('ambient_idx', String(idx)) }, [idx])
  useEffect(() => {
    localStorage.setItem('ambient_vol', String(vol))
    try { playerRef.current && playerRef.current.setVolume(vol) } catch {}
  }, [vol])

  const play = useCallback((i) => {
    const p = playerRef.current; if (!p) return
    try {
      if (typeof i === 'number' && i !== idxRef.current) { setIdx(i); p.loadVideoById(TRACKS[i].id) }
      else { p.playVideo() }
    } catch {}
  }, [])

  const toggle = useCallback(() => {
    const p = playerRef.current; if (!p) return
    if (playing) { try { p.pauseVideo() } catch {} }
    else { play() }
  }, [playing, play])

  const step = useCallback((dir) => {
    const next = (idxRef.current + dir + TRACKS.length) % TRACKS.length
    setIdx(next)
    const p = playerRef.current
    try { p && p.loadVideoById(TRACKS[next].id) } catch {}
  }, [])

  // Listen for an external toggle (e.g. from the Tools menu).
  useEffect(() => {
    const h = () => toggle()
    window.addEventListener('toggle-ambient', h)
    return () => window.removeEventListener('toggle-ambient', h)
  }, [toggle])

  const open = playing || hover
  const track = TRACKS[idx]

  return (
    <>
      <style>{`
        @keyframes amb-ring { 0%,100%{transform:scale(1);opacity:.5} 50%{transform:scale(1.35);opacity:0} }
        @keyframes amb-bar1 { 0%,100%{height:5px} 50%{height:15px} }
        @keyframes amb-bar2 { 0%,100%{height:12px} 50%{height:6px} }
        @keyframes amb-bar3 { 0%,100%{height:8px} 50%{height:16px} }
      `}</style>

      {/* Hidden audio-only player (kept in DOM, not display:none, for reliable playback) */}
      <div aria-hidden="true" style={{ position: 'fixed', left: -9999, bottom: -9999, width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div ref={hostRef} />
      </div>

      <div
        className="fixed z-40 flex items-center"
        style={{ bottom: '7rem', left: '1.5rem' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div
          className="flex items-center rounded-full overflow-hidden"
          style={{
            background: 'color-mix(in oklab, var(--color-card) 80%, transparent)',
            border: '1px solid var(--color-border)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 6px 22px -8px rgba(0,0,0,0.5)',
          }}
        >
          {/* Play / pause — always visible */}
          <button
            onClick={toggle}
            disabled={!built}
            title={built ? (playing ? 'Pause ambient sound' : 'Play ambient sound') : 'Loading…'}
            aria-label={playing ? 'Pause ambient sound' : 'Play ambient sound'}
            className="relative flex items-center justify-center flex-shrink-0 transition-colors"
            style={{ width: 42, height: 42, color: 'var(--color-foreground)' }}
          >
            {/* breathing ring when playing */}
            {playing && !prefersReduced && (
              <span aria-hidden="true" className="absolute rounded-full" style={{
                width: 42, height: 42,
                border: '1.5px solid var(--color-accent)',
                animation: 'amb-ring 3.2s ease-out infinite',
              }} />
            )}
            {playing ? (
              // little equalizer
              <span className="flex items-end gap-[2px]" style={{ height: 16 }} aria-hidden="true">
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width: 3, borderRadius: 2, background: 'var(--color-accent)',
                    height: 8,
                    animation: prefersReduced ? 'none' : `amb-bar${i+1} 1s ease-in-out ${i*0.15}s infinite`,
                  }} />
                ))}
              </span>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
              </svg>
            )}
          </button>

          {/* Expanding controls */}
          <div
            className="flex items-center transition-all duration-300 ease-out"
            style={{ maxWidth: open ? 320 : 0, opacity: open ? 1 : 0 }}
          >
            <button onClick={() => step(-1)} title="Previous track" aria-label="Previous track"
              className="flex-shrink-0 flex items-center justify-center hover:text-foreground text-muted-foreground transition-colors"
              style={{ width: 30, height: 42 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>

            <div className="min-w-0 px-1" style={{ width: 148 }}>
              <div className="text-[12px] font-medium leading-tight truncate" style={{ color: 'var(--color-foreground)' }}>{track.title}</div>
              <div className="text-[10px] leading-tight truncate text-muted-foreground">{track.by}</div>
            </div>

            <button onClick={() => step(1)} title="Next track" aria-label="Next track"
              className="flex-shrink-0 flex items-center justify-center hover:text-foreground text-muted-foreground transition-colors"
              style={{ width: 30, height: 42 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zm-2.5 6L5 6v12z"/></svg>
            </button>

            <input
              type="range" min="0" max="100" value={vol}
              onChange={(e) => setVol(parseInt(e.target.value, 10))}
              aria-label="Ambient volume"
              className="ambient-vol flex-shrink-0 mr-3 ml-1"
              style={{ width: 56, accentColor: 'var(--color-accent)' }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
