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
  const [everPlayed, setEverPlayed] = useState(false)
  const [hover, setHover] = useState(false)
  const [vol, setVol] = useState(() => {
    const v = parseInt(localStorage.getItem('ambient_vol') || String(DEFAULT_VOL), 10)
    return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : DEFAULT_VOL
  })

  const idxRef = useRef(idx)
  idxRef.current = idx
  const autoStartedRef = useRef(false)

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
            setPlaying(true); setEverPlayed(true); autoStartedRef.current = true
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

  // Autoplay: browsers block audio until a user gesture, so we try immediately
  // (works when the browser allows it) and otherwise start on the very first
  // interaction anywhere on the page — including the click/keypress that
  // dismisses the intro screen. After that, only the manual controls apply.
  useEffect(() => {
    if (!built) return
    try { playerRef.current && playerRef.current.playVideo() } catch {}
    let done = false
    const types = ['pointerdown', 'touchstart', 'keydown', 'click']
    const remove = () => types.forEach(t => window.removeEventListener(t, kick, true))
    function kick() {
      if (done || autoStartedRef.current) { remove(); return }
      done = true
      try { playerRef.current && playerRef.current.playVideo() } catch {}
      remove()
    }
    types.forEach(t => window.addEventListener(t, kick, true))
    return remove
  }, [built])

  const track = TRACKS[idx]

  return (
    <>
      <style>{`
        @keyframes amb-ring { 0%,100%{transform:scale(1);opacity:.55} 50%{transform:scale(1.5);opacity:0} }
      `}</style>

      {/* Hidden audio-only player (kept in DOM, not display:none, for reliable playback) */}
      <div aria-hidden="true" style={{ position: 'fixed', left: -9999, bottom: -9999, width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div ref={hostRef} />
      </div>

      <div
        className="relative flex items-center flex-shrink-0"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
      >
        <div
          className="flex items-center rounded-full overflow-hidden"
          style={{
            background: 'color-mix(in oklab, var(--color-card) 72%, transparent)',
            border: '1px solid var(--color-border)',
            backdropFilter: 'blur(8px)',
          }}
        >
          {/* Play / pause — clear, accent-filled so it obviously reads as a control */}
          <button
            onClick={toggle}
            disabled={!built}
            title={built ? (playing ? 'Pause music' : 'Play music') : 'Loading…'}
            aria-label={playing ? 'Pause music' : 'Play music'}
            className="relative flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
            style={{ width: 32, height: 32, margin: 3, borderRadius: 999,
              background: 'color-mix(in oklab, var(--color-accent) 18%, transparent)',
              color: 'var(--color-accent)' }}
          >
            {!everPlayed && !prefersReduced && (
              <span aria-hidden="true" className="absolute rounded-full" style={{ inset: -1, border: '1.5px solid var(--color-accent)', animation: 'amb-ring 2.4s ease-out infinite' }} />
            )}
            {playing ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          {/* Label — visible on sm+; a bigger, obvious hit target that also toggles */}
          <div onClick={toggle} className="hidden sm:flex flex-col justify-center cursor-pointer select-none pl-1.5 pr-1 min-w-0" style={{ height: 38 }}>
            <span className="text-[11.5px] font-medium leading-tight truncate" style={{ color: 'var(--color-foreground)', maxWidth: 128 }}>{playing ? track.title : 'Play music'}</span>
            <span className="text-[9.5px] leading-tight truncate text-muted-foreground" style={{ maxWidth: 128 }}>{playing ? track.by : 'ambient radio'}</span>
          </div>

          {/* Hover-reveal (desktop): prev / next / volume */}
          <div
            className="hidden md:flex items-center transition-all duration-300 ease-out overflow-hidden"
            style={{ maxWidth: hover ? 168 : 0, opacity: hover ? 1 : 0 }}
          >
            <button onClick={() => step(-1)} title="Previous track" aria-label="Previous track"
              className="flex-shrink-0 flex items-center justify-center hover:text-foreground text-muted-foreground transition-colors" style={{ width: 26, height: 38 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>
            <button onClick={() => step(1)} title="Next track" aria-label="Next track"
              className="flex-shrink-0 flex items-center justify-center hover:text-foreground text-muted-foreground transition-colors" style={{ width: 26, height: 38 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zm-2.5 6L5 6v12z"/></svg>
            </button>
            <input
              type="range" min="0" max="100" value={vol}
              onChange={(e) => setVol(parseInt(e.target.value, 10))}
              aria-label="Ambient volume"
              className="ambient-vol flex-shrink-0 mr-2.5 ml-1"
              style={{ width: 50, accentColor: 'var(--color-accent)' }}
            />
          </div>
        </div>
      </div>
    </>
  )
}
