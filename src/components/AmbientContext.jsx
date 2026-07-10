import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'

// The ambient-audio ENGINE, provided ABOVE the router so it survives route
// changes and keeps playing in the background no matter which page the visitor
// is on. The visible control (AmbientPlayer) is a thin consumer of this context
// and lives in the navbar. Tracks are embedded via the official YouTube IFrame
// API (licensing/ads handled by YouTube). Auto-advances through the list, loops.

export const TRACKS = [
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

const AmbientContext = createContext(null)
export const useAmbient = () => useContext(AmbientContext)

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

export function AmbientProvider({ children }) {
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
  const [vol, setVolState] = useState(() => {
    const v = parseInt(localStorage.getItem('ambient_vol') || String(DEFAULT_VOL), 10)
    return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : DEFAULT_VOL
  })

  const idxRef = useRef(idx)
  idxRef.current = idx
  const autoStartedRef = useRef(false)

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

  const setVol = useCallback((v) => {
    const nv = Math.min(100, Math.max(0, v | 0))
    setVolState(nv)
    localStorage.setItem('ambient_vol', String(nv))
    try { playerRef.current && playerRef.current.setVolume(nv) } catch {}
  }, [])

  const play = useCallback(() => {
    const p = playerRef.current; if (!p) return
    try { p.playVideo() } catch {}
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

  const next = useCallback(() => step(1), [step])
  const prev = useCallback(() => step(-1), [step])

  // External toggle (e.g. from the Tools menu).
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

  const value = {
    built, playing, everPlayed, idx, vol,
    track: TRACKS[idx],
    toggle, next, prev, setVol,
  }

  return (
    <AmbientContext.Provider value={value}>
      {/* Hidden audio-only player — lives above the router, so it persists
          across every route and keeps playing in the background. */}
      <div aria-hidden="true" style={{ position: 'fixed', left: -9999, bottom: -9999, width: 1, height: 1, opacity: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div ref={hostRef} />
      </div>
      {children}
    </AmbientContext.Provider>
  )
}
