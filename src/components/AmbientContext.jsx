import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'

// The ambient-audio ENGINE, provided ABOVE the router so it survives route
// changes and keeps playing in the background no matter which page the visitor
// is on. The visible control (AmbientPlayer) is a thin consumer of this context
// and lives in the navbar. Tracks are embedded via the official YouTube IFrame
// API (licensing/ads handled by YouTube). Auto-advances through the list, loops.

export const TRACKS = [
  { id: 'DOT1LmQbFFA', title: 'Weightless',       by: 'Martin Garrix & Arijit Singh' },
  { id: 'JgDNFQ2RaLQ', title: 'Sapphire',         by: 'Ed Sheeran' },
  { id: 'WWEs82u37Mw', title: 'Lose My Mind',     by: 'Don Toliver, Doja Cat' },
  { id: 'GCdwKhTtNNw', title: 'Sweater Weather',   by: 'The Neighbourhood' },
  { id: 'nyuo9-OjNNg', title: 'I Wanna Be Yours',  by: 'Arctic Monkeys' },
  { id: 'o_1aF54DO60', title: 'Young and Beautiful', by: 'Lana Del Rey' },
  { id: 'K3Qzzggn--s', title: 'Slow Dancing in the Dark', by: 'Joji' },
  { id: 'pQsF3pzOc54', title: 'Chamber of Reflection', by: 'Mac DeMarco' },
  { id: 'sElE_BfQ67s', title: 'Apocalypse',        by: 'Cigarettes After Sex' },
  { id: 'Ip6cw8gfHHI', title: 'Here With Me',      by: 'd4vd' },
  { id: 'cW8VLC9nnTo', title: 'What Was I Made For?', by: 'Billie Eilish' },
  { id: '6BYIKEH0RCQ', title: 'Liggi',             by: 'Ritviz' },
  { id: 'VF-FGf_ZZiI', title: 'Bad Habit',         by: 'Steve Lacy' },
  { id: '6JHu3b-pbh8', title: 'Thinkin Bout You',  by: 'Frank Ocean' },
  { id: 'myh5xtfUG-I', title: 'double take',       by: 'dhruv' },
  { id: 'LDY_XyxBu8A', title: 'Snooze',            by: 'SZA' },
  { id: 'uPD0QOGTmMI', title: 'Die For You',       by: 'The Weeknd' },
  { id: 'lSD_L-xic9o', title: 'From the Start',    by: 'Laufey' },
  { id: 'uzS3WG6__G4', title: 'Pink + White',      by: 'Frank Ocean' },
  { id: 'sBzrzS1Ag_g', title: 'The Less I Know the Better', by: 'Tame Impala' },
  { id: 'MiAoetOXKcY', title: 'Say Yes to Heaven', by: 'Lana Del Rey' },
  { id: 'vx4kLgnFexo', title: 'My Love Mine All Mine', by: 'Mitski' },
  { id: 'vA86QFrXoho', title: 'Alag Aasmaan',      by: 'Anuv Jain' },
  { id: 'NgsWGfUlwJI', title: 'Glimpse of Us',     by: 'Joji' },
  { id: '5-rbSNzU_b8', title: 'Sunsetz',           by: 'Cigarettes After Sex' },
  { id: 'Qn8F_u0vBNI', title: 'No One Noticed',    by: 'The Marías' },
  { id: 'L9HYJbe9Y18', title: 'Bags',              by: 'Clairo' },
  { id: 'Il7Nv270zNk', title: 'cold/mess',         by: 'Prateek Kuhad' },
  { id: 'aMX2JOzKoDY', title: 'seasons',           by: 'wave to earth' },
  { id: 'wmLGG5DYDWQ', title: 'Late Night Drive', by: 'Cigarettes After Sex mix' },
  { id: 'gJLVTKhTnog', title: 'Husn',              by: 'Anuv Jain' },
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

  // Always begin at track 0 (Weightless) on a fresh page load, so the site
  // consistently opens with that song. Navigation is reload-free, so the live
  // position is kept in memory across pages anyway.
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [everPlayed, setEverPlayed] = useState(false)
  const [loop, setLoopState] = useState(() => localStorage.getItem('ambient_loop') === '1')
  const [suppressed, setSuppressedState] = useState(false)
  const suppressedRef = useRef(false)
  const [vol, setVolState] = useState(() => {
    const v = parseInt(localStorage.getItem('ambient_vol') || String(DEFAULT_VOL), 10)
    return Number.isFinite(v) ? Math.min(100, Math.max(0, v)) : DEFAULT_VOL
  })

  const idxRef = useRef(idx)
  idxRef.current = idx
  const loopRef = useRef(loop)
  loopRef.current = loop
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
            // Loop mode: replay the same track. Otherwise advance to the next.
            if (loopRef.current) {
              try { e.target.seekTo(0, true); e.target.playVideo() } catch {}
            } else {
              const next = (idxRef.current + 1) % TRACKS.length
              setIdx(next)
              try { e.target.loadVideoById(TRACKS[next].id) } catch {}
            }
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

  const setVol = useCallback((v) => {
    const nv = Math.min(100, Math.max(0, v | 0))
    setVolState(nv)
    localStorage.setItem('ambient_vol', String(nv))
    try { playerRef.current && playerRef.current.setVolume(nv) } catch {}
  }, [])

  const play = useCallback(() => {
    if (suppressedRef.current) return
    const p = playerRef.current; if (!p) return
    try { p.playVideo() } catch {}
  }, [])

  // Pages like the Lock-In / gym experience call this to silence the ambient
  // radio while they're open (so it never clashes with the intro reel or the
  // gym playlist), then release it when they unmount.
  const setSuppressed = useCallback((v) => {
    suppressedRef.current = !!v
    setSuppressedState(!!v)
    if (v) { const p = playerRef.current; try { p && p.pauseVideo() } catch {} }
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

  const toggleLoop = useCallback(() => {
    setLoopState(v => {
      const nv = !v
      loopRef.current = nv
      localStorage.setItem('ambient_loop', nv ? '1' : '0')
      return nv
    })
  }, [])

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
    if (!suppressedRef.current) { try { playerRef.current && playerRef.current.playVideo() } catch {} }
    let done = false
    const types = ['pointerdown', 'touchstart', 'keydown', 'click']
    const remove = () => types.forEach(t => window.removeEventListener(t, kick, true))
    function kick() {
      if (done || autoStartedRef.current) { remove(); return }
      if (suppressedRef.current) return // stay armed, but don't start while a page has silenced us
      done = true
      try { playerRef.current && playerRef.current.playVideo() } catch {}
      remove()
    }
    types.forEach(t => window.addEventListener(t, kick, true))
    return remove
  }, [built])

  const value = {
    built, playing, everPlayed, idx, vol, suppressed, loop,
    track: TRACKS[idx],
    toggle, next, prev, setVol, play, setSuppressed, toggleLoop,
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
