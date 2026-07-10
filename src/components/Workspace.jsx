import React, { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, Html, Float, RoundedBox, SoftShadows, useGLTF, useAnimations } from '@react-three/drei'

import * as THREE from 'three'

// ============================================================
// WORKSPACE — A 3D interactive desk scene
// Items glow violet on hover and open site sections on click.
// ============================================================

const VIOLET = '#58a6ff'
const MAGENTA = '#3fb950'
const CORAL = '#f97316'

// ─── Theme constants (was a 4-level inception system; flattened to one) ──
const THEME = {
  title: 'Reality',
  place: 'Hyderabad · May 2026',
  caption: 'The cloud engineer at his desk. Right now.',
  bgNight: '#08040f', bgDay: '#1a1830',
  wallA: '#110d22', wallB: '#0e0a1e',
  floor: '#0c0814',
  accent: '#0969da', accent2: '#3fb950',
  npcShirt: '#0550ae',
  monitorContent: 'code',
}

const HOTSPOTS = [
  // Site routes — clickable scene objects map to sub-pages
  { id: 'projects',   label: 'My work',           hint: 'click the monitor',    pos: [-0.05, 0, -0.5] },
  { id: 'experience', label: 'Experience',        hint: 'open the notebook',    pos: [-1.05, 0, -0.4] },
  { id: 'connect',    label: 'Connect with me',   hint: 'pick up the phone',    pos: [1.05, 0, -0.05] },
  { id: 'tech',       label: 'Tech stack',        hint: 'check the book stack', pos: [-1.4, 0, -0.4] },
  { id: 'travel',     label: 'Places I\'ve been', hint: 'the travel poster',    pos: [1.7, 0, -2.5] },
  { id: 'photos',     label: 'About me',          hint: 'the picture frame',    pos: [-1.6, 0, -2.5] },
  // In-scene interactions (no route change)
  { id: 'about',      label: 'Say hi',             hint: 'NPC in chair',         pos: [0.6, 0, 1.2] },
  { id: 'guestbook',  label: 'Drop a sticky note', hint: 'on the back wall',     pos: [0.0, 0, -1.8] },
  { id: 'fitness',    label: 'Transformation HQ',  hint: 'pick up the dumbbell', pos: [-1.7, 0, 1.4] },
  { id: 'stranger',   label: 'Stranger chat',      hint: 'wear the headphones',  pos: [-0.6, 0, -0.65] },
  // Info-only
  { id: 'clock',      label: 'Live IST clock',     hint: 'on the wall',          pos: [2.0, 0, -2.0] },
  // Secrets (hidden)
  { id: 'secret-trophy',  label: '🏆 trophy',     hint: 'examine the shelf',    pos: [2.0, 0, -2.3] },
]

export default function Workspace({ onBack, embedded = false }) {
  const [hovered, setHovered] = useState(null)
  const [hint, setHint] = useState(embedded ? 'Drag to look · click items · or Play for game mode' : 'Click PLAY to enter the room')
  const [isDay, setIsDay] = useState(() => {
    const now = new Date()
    const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const h = ist.getHours()
    return h >= 6 && h < 18
  })

  // Re-evaluate day/night every 5 min (covers sunrise/sunset transitions)
  useEffect(() => {
    const tick = () => {
      const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
      const h = ist.getHours()
      setIsDay(h >= 6 && h < 18)
    }
    const id = setInterval(tick, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])
  const [gameMode, setGameMode] = useState(false)
  const [near, setNear] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)
  const controlsRef = useRef()

  const [secretFound, setSecretFound] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ws:secrets') || '[]') } catch { return [] }
  })
  const [showStickyForm, setShowStickyForm] = useState(false)

  const markSecret = (id) => {
    if (secretFound.includes(id)) return
    const next = [...secretFound, id]
    setSecretFound(next)
    localStorage.setItem('ws:secrets', JSON.stringify(next))
  }

  const nav = (id) => {
    // Site sub-page routes
    if (id === 'projects')   { window.location.hash = '#/projects'; return }
    if (id === 'experience') { window.location.hash = '#/experience'; return }
    if (id === 'connect')    { window.location.hash = '#/connect'; return }
    if (id === 'tech')       { window.location.hash = '#/tech'; return }
    if (id === 'travel')     { window.location.hash = '#/travel'; return }
    if (id === 'photos')     { window.location.hash = '#/about'; return }
    if (id === 'fitness')    { window.location.hash = '#/transformation'; return }
    if (id === 'stranger')   { window.location.hash = '#/stranger'; return }
    // In-scene interactions
    if (id === 'about')      { setChatOpen(true); return }
    if (id === 'guestbook')  { setShowStickyForm(true); return }
    // Easter eggs
    if (id === 'secret-konami') { markSecret('konami'); window.dispatchEvent(new CustomEvent('trigger-matrix')); return }
    if (id === 'secret-drawer') { markSecret('drawer'); window.open('https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M', '_blank'); return }
    if (id === 'secret-trophy') { markSecret('trophy'); alert('🏆 Achievement: Explored the entire workspace!') }
  }

  useEffect(() => {
    if (gameMode) {
      if (near) {
        const item = HOTSPOTS.find(h => h.id === near)
        setHint(item ? `[E] ${item.label}` : '')
      } else {
        setHint('WASD or arrows to move · E to interact')
      }
    } else if (hovered) {
      const item = HOTSPOTS.find(h => h.id === hovered)
      setHint(item ? `→ ${item.label}` : '')
    } else {
      setHint('Drag to look · click items · or hit PLAY')
    }
  }, [hovered, near, gameMode])

  // Keyboard E to interact in game mode
  useEffect(() => {
    if (!gameMode) return
    const onKey = (e) => {
      if (e.key.toLowerCase() === 'e' && near) {
        nav(near)
      }
      if (e.key === 'Escape') {
        setGameMode(false)
        setChatOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameMode, near])

  // Konami code easter egg
  useEffect(() => {
    const sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
    let idx = 0
    const onKey = (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (k === sequence[idx].toLowerCase() || k === sequence[idx]) {
        idx++
        if (idx >= sequence.length) {
          idx = 0
          markSecret('konami')
          window.dispatchEvent(new CustomEvent('trigger-matrix'))
        }
      } else {
        idx = 0
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Embedded mode: no top bar, fills parent, includes floating Play/Day buttons
  if (embedded) {
    return (
      <div className="relative w-full h-full">
        <Canvas
          shadows
          camera={{ position: [3.2, 2.2, 4.0], fov: 45 }}
          gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3, outputColorSpace: THREE.SRGBColorSpace }}
          dpr={window.innerWidth < 768 ? 1 : [1, 2]}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <color attach="background" args={[isDay ? THEME.bgDay : THEME.bgNight]} />
          <fog attach="fog" args={[isDay ? THEME.bgDay : THEME.bgNight, 8, 18]} />
          <Suspense fallback={null}>
            <Scene onHover={setHovered} onClick={nav} hovered={hovered} isDay={isDay} gameMode={gameMode} onNear={setNear} />
            <Environment preset={isDay ? 'apartment' : 'city'} environmentIntensity={isDay ? 1.0 : 0.8} background={false} />
          </Suspense>
          <OrbitControls
            ref={controlsRef}
            target={[0, 0.9, 0]} enablePan={false} enabled={!gameMode}
            minDistance={3.5} maxDistance={8}
            minPolarAngle={Math.PI / 5} maxPolarAngle={Math.PI / 2.2}
            autoRotate={!gameMode} autoRotateSpeed={0.4}
          />
        </Canvas>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="px-3 py-1 rounded-full backdrop-blur-xl text-[11px] font-mono text-foreground/90"
            style={{ background: 'color-mix(in oklab, var(--color-card) 70%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 28%, transparent)' }}>
            {hint}
          </div>
        </div>

        {chatOpen && (
          <div className="absolute inset-0 flex items-end justify-center pb-6 px-4 pointer-events-none z-50">
            <div className="max-w-lg w-full pointer-events-auto bg-card pr-tint-violet p-4 animate-fade-in-up" style={{ backdropFilter: 'blur(8px)' }}>
              <div className="flex items-start gap-3 mb-2">
                <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold"
                  style={{ background: 'linear-gradient(135deg, oklch(60% 0.22 290), oklch(60% 0.25 320))', color: 'white' }}>K</div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-foreground">Kranthi</p>
                  <p className="text-[10px] text-muted-foreground">at his desk</p>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
              </div>
              <p className="text-[12.5px] text-foreground/90 leading-relaxed mb-3">
                Hey 👋 thanks for stopping by. I'm a cloud engineer building infra and developer tooling at GitHub/Microsoft. Click an option:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '🤖 Chat with AI me', go: () => { setChatOpen(false); document.querySelector('[data-chatbot-btn]')?.click() } },
                  { label: '📖 About', go: () => { setChatOpen(false); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }) } },
                  { label: '💼 Experience', go: () => { setChatOpen(false); document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth' }) } },
                  { label: '✉️  Email', go: () => window.open('mailto:kranthikiranakkumahanthi@gmail.com', '_blank') },
                ].map((c, i) => (
                  <button key={i} onClick={c.go} className="px-3 py-2 rounded-md text-[12px] font-medium text-foreground text-left transition-all"
                    style={{ background: 'color-mix(in oklab, var(--chart-1) 10%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 28%, transparent)' }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showStickyForm && (
          <StickyNoteForm onClose={() => setShowStickyForm(false)} />
        )}

        {secretFound.length > 0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="px-2.5 py-1 rounded-full text-[10.5px] font-mono"
              style={{ background: 'color-mix(in oklab, oklch(75% 0.18 60) 20%, var(--color-card))', color: 'oklch(75% 0.18 60)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, oklch(75% 0.18 60) 45%, transparent)' }}>
              🏆 {secretFound.length}/3 secrets found
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-30 thq-nav-surface backdrop-blur-xl border-b"
        style={{ borderBottomColor: 'color-mix(in oklab, var(--chart-1) 22%, var(--color-border))' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button onClick={onBack || (() => { window.location.hash = '' })}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm group">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'color-mix(in oklab, var(--chart-1) 8%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 22%, transparent)' }}>
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </span>
            <span className="hidden sm:inline">Back to site</span>
          </button>
          <div className="text-center flex-1 min-w-0">
            <h1 className="font-heading text-foreground text-base sm:text-lg font-semibold flex items-center justify-center gap-2 tracking-tight">
              <span className="text-lg">🎮</span>
              <span>My <span className="text-gradient-violet">Workspace</span></span>
            </h1>
            <p className="text-[10.5px] text-muted-foreground hidden sm:block tracking-wide">
              {gameMode ? 'WASD to walk · E to interact · ESC to exit' : 'Click items · or hit PLAY for game mode'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setGameMode(g => !g)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all"
              style={{
                background: gameMode
                  ? 'linear-gradient(135deg, oklch(70% 0.22 145), oklch(65% 0.22 165))'
                  : 'linear-gradient(135deg, color-mix(in oklab, var(--chart-1) 32%, transparent), color-mix(in oklab, var(--chart-2) 32%, transparent))',
                color: 'white',
                boxShadow: gameMode
                  ? '0 0 16px -4px oklch(70% 0.22 145)'
                  : '0 0 16px -4px color-mix(in oklab, var(--chart-1) 60%, transparent)',
              }}
            >
              {gameMode ? '⏸ Exit' : '▶ Play'}
            </button>
            <button
              onClick={() => setIsDay(d => !d)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all"
              style={{
                background: isDay ? 'color-mix(in oklab, oklch(75% 0.18 60) 18%, transparent)' : 'color-mix(in oklab, var(--chart-1) 12%, transparent)',
                color: 'var(--color-foreground)',
                boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${isDay ? 'oklch(75% 0.18 60)' : 'var(--chart-1)'} 40%, transparent)`,
              }}
              title={isDay ? 'Switch to night' : 'Switch to day'}
            >
              <span>{isDay ? '☀️' : '🌙'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scene */}
      <div className="flex-1 relative" style={{ minHeight: 'calc(100vh - 65px)' }}>
        <Canvas
          shadows
          camera={{ position: [3.2, 2.2, 4.0], fov: 45 }}
          gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.3, outputColorSpace: THREE.SRGBColorSpace }}
          dpr={window.innerWidth < 768 ? 1 : [1, 2]}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <color attach="background" args={[isDay ? THEME.bgDay : THEME.bgNight]} />
          <fog attach="fog" args={[isDay ? THEME.bgDay : THEME.bgNight, 8, 18]} />

          <Suspense fallback={null}>
            <Scene
              onHover={setHovered} onClick={nav} hovered={hovered} isDay={isDay}
              gameMode={gameMode} onNear={setNear}
            />
            <Environment preset={isDay ? 'apartment' : 'city'} environmentIntensity={isDay ? 1.0 : 0.8} background={false} />
          </Suspense>

          <OrbitControls
            ref={controlsRef}
            target={[0, 0.9, 0]}
            enablePan={false}
            enabled={!gameMode}
            minDistance={3.5}
            maxDistance={8}
            minPolarAngle={Math.PI / 5}
            maxPolarAngle={Math.PI / 2.2}
            autoRotate={!gameMode}
            autoRotateSpeed={0.4}
          />
        </Canvas>

        {/* Hint pill */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-full backdrop-blur-xl text-[12px] font-mono text-foreground/90"
            style={{ background: 'color-mix(in oklab, var(--color-card) 70%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 28%, transparent), 0 4px 24px -8px color-mix(in oklab, var(--chart-1) 50%, transparent)' }}>
            {hint}
          </div>
        </div>

        {/* Legend grid */}
        <div className="absolute bottom-6 right-6 hidden md:block">
          <div className="px-3 py-2.5 rounded-xl backdrop-blur-xl"
            style={{ background: 'color-mix(in oklab, var(--color-card) 80%, transparent)', boxShadow: 'inset 0 0 0 1px var(--color-border), 0 12px 32px -8px rgba(0,0,0,0.6)' }}>
            <p className="text-[9.5px] uppercase tracking-[0.12em] font-semibold mb-1.5"
              style={{ color: 'color-mix(in oklab, var(--chart-1) 70%, var(--color-muted-foreground))' }}>
              What's here
            </p>
            <ul className="space-y-0.5">
              {HOTSPOTS.map(h => (
                <li key={h.id} className="text-[10.5px] text-muted-foreground flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full" style={{ background: VIOLET }} />
                  <span className="font-medium text-foreground/90">{h.label}</span>
                  <span className="text-muted-foreground/60">· {h.hint}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Game-mode HUD overlays */}
        {gameMode && (
          <>
            {/* Mini-map / controls hint */}
            <div className="absolute top-4 left-4 pointer-events-none">
              <div className="px-3 py-2 rounded-xl backdrop-blur-xl"
                style={{ background: 'color-mix(in oklab, var(--color-card) 80%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 30%, transparent)' }}>
                <p className="text-[9.5px] uppercase tracking-[0.12em] font-semibold mb-1.5"
                  style={{ color: 'color-mix(in oklab, var(--chart-1) 70%, var(--color-muted-foreground))' }}>
                  Controls
                </p>
                <div className="space-y-0.5 text-[10.5px] text-muted-foreground font-mono">
                  <p><kbd className="px-1 rounded bg-foreground/10 text-foreground">W A S D</kbd> · move</p>
                  <p><kbd className="px-1 rounded bg-foreground/10 text-foreground">E</kbd> · interact</p>
                  <p><kbd className="px-1 rounded bg-foreground/10 text-foreground">Shift</kbd> · run</p>
                  <p><kbd className="px-1 rounded bg-foreground/10 text-foreground">Esc</kbd> · exit</p>
                </div>
              </div>
            </div>

            {/* Center reticle */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-1 h-1 rounded-full bg-white/40" />
            </div>
          </>
        )}

        {/* "Talk to me" NPC dialog */}
        {chatOpen && (
          <div className="absolute inset-0 flex items-end justify-center pb-20 px-6 pointer-events-none z-50">
            <div className="max-w-lg w-full pointer-events-auto bg-card pr-tint-violet p-5 animate-fade-in-up"
              style={{ backdropFilter: 'blur(8px)' }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-lg"
                  style={{ background: 'linear-gradient(135deg, oklch(60% 0.22 290), oklch(60% 0.25 320))', color: 'white' }}>
                  K
                </div>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold text-foreground">Kranthi</p>
                  <p className="text-[10px] text-muted-foreground">at his desk</p>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                Hey 👋 thanks for stopping by. I'm a cloud engineer building infra and developer tooling at GitHub/Microsoft. Look around — every item on the desk opens part of my site. Click an option:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '📖 Read my About', go: () => { setChatOpen(false); sessionStorage.setItem('scrollTo', 'about'); window.location.hash = '' } },
                  { label: '💼 Experience',    go: () => { setChatOpen(false); sessionStorage.setItem('scrollTo', 'experience'); window.location.hash = '' } },
                  { label: '✉️  Send email',   go: () => window.open('mailto:kranthikiranakkumahanthi@gmail.com', '_blank') },
                  { label: '🔍 Show LinkedIn', go: () => window.open('https://linkedin.com/in/kranthikiran3', '_blank') },
                ].map((c, i) => (
                  <button key={i} onClick={c.go}
                    className="px-3 py-2 rounded-md text-[12px] font-medium text-foreground text-left transition-all"
                    style={{
                      background: 'color-mix(in oklab, var(--chart-1) 10%, transparent)',
                      boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 28%, transparent)',
                    }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Scene ───────────────────────────────────────────────────────────
function Scene({ onHover, onClick, hovered, isDay, gameMode, onNear }) {
  return (
    <group>
      <SoftShadows size={20} samples={10} focus={0.7} />

      {/* IBL environment — adds realistic reflections to metals/glass.
          Switches preset by time of day. background={false} keeps the
          existing scene backdrop while still lighting materials. */}
      <Environment preset={isDay ? 'sunset' : 'city'} background={false} />

      {/* Lighting — vibrant gamer-style with strong color accents */}
      <hemisphereLight args={[isDay ? '#fff0d8' : '#b88dff', isDay ? '#5a4a65' : '#1a0f2e', isDay ? 0.7 : 0.65]} />
      <ambientLight intensity={isDay ? 0.5 : 0.35} />
      {/* Key light */}
      <directionalLight
        position={[5, 7, 3]}
        intensity={isDay ? 1.6 : 0.8}
        color={isDay ? '#ffe6c0' : '#c4b5ff'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-radius={6}
      >
        <orthographicCamera attach="shadow-camera" args={[-5, 5, 5, -5, 0.1, 20]} />
      </directionalLight>
      {/* Rim / kick light from behind for separation */}
      <directionalLight position={[-3, 4, -4]} intensity={isDay ? 0.3 : 0.6} color={isDay ? '#ff9a6f' : '#ff3e9d'} />
      {/* Accent point lights — always on for gamer vibe */}
      <pointLight position={[-3, 1.5, -1]} intensity={isDay ? 0.3 : 0.9} color="#0969da" distance={7} decay={2} />
      <pointLight position={[2.5, 1.5, 2]} intensity={isDay ? 0.2 : 0.7} color="#3fb950" distance={7} decay={2} />
      <pointLight position={[0, 0.2, 3]} intensity={isDay ? 0.15 : 0.5} color="#06b6d4" distance={6} decay={2} />
      {!isDay && (
        <>
          {/* Monitor screen bleed onto desk */}
          <pointLight position={[-0.05, 1.05, -0.3]} intensity={1.0} color="#58a6ff" distance={3} decay={2} />
          {/* Back wall wash — purple */}
          <pointLight position={[0, 2.5, -2.4]} intensity={0.6} color="#0550ae" distance={5} decay={2} />
          {/* Side wall wash — magenta */}
          <pointLight position={[-2.4, 2, -0.5]} intensity={0.4} color="#3fb950" distance={5} decay={2} />
        </>
      )}
      {/* Desk lamp warm pool — no shadow to avoid flicker */}
      <pointLight position={[1.3, 1.5, -0.4]} intensity={isDay ? 0.3 : 1.2} color="#ffb066" distance={3.5} decay={2} />

      {/* Floor — plain matte surface */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial
          color={THEME.floor}
          roughness={0.95}
          metalness={0.0}
        />
      </mesh>

      {/* Back + side walls */}
      <mesh position={[0, 2, -2.6]} receiveShadow>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color={THEME.wallA} roughness={0.92} />
      </mesh>
      <mesh position={[-2.6, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color={THEME.wallB} roughness={0.92} />
      </mesh>

      {/* === WINDOW on the side wall === */}
      <Window position={[-2.58, 2.1, -1.0]} isDay={isDay} />

      {/* === DESK === walnut PBR */}
      <RoundedBox args={[3.2, 0.12, 1.6]} radius={0.04} position={[0, 0.7, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial
          color="#2a1a14"
          roughness={0.55} metalness={0.05}
          clearcoat={0.4} clearcoatRoughness={0.45}
          sheen={0.3} sheenColor="#5a3a2a"
        />
      </RoundedBox>
      {[[-1.45, 0.35, -0.7], [1.45, 0.35, -0.7], [-1.45, 0.35, 0.7], [1.45, 0.35, 0.7]].map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.08, 0.7, 0.08]} />
          <meshStandardMaterial color="#0a0610" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}

      {/* === LED STRIP — under desk edges, gamer accent glow === */}
      <mesh position={[0, 0.65, 0.79]}>
        <boxGeometry args={[3.0, 0.02, 0.02]} />
        <meshBasicMaterial color="#0969da" />
      </mesh>
      <pointLight position={[0, 0.5, 0.8]} intensity={isDay ? 0.2 : 0.8} color="#0969da" distance={2.5} decay={2} />
      <mesh position={[0, 0.65, -0.79]}>
        <boxGeometry args={[3.0, 0.02, 0.02]} />
        <meshBasicMaterial color="#3fb950" />
      </mesh>
      <pointLight position={[0, 0.5, -0.8]} intensity={isDay ? 0.1 : 0.5} color="#3fb950" distance={2} decay={2} />
      <mesh position={[-1.59, 0.65, 0]}>
        <boxGeometry args={[0.02, 0.02, 1.5]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>
      <mesh position={[1.59, 0.65, 0]}>
        <boxGeometry args={[0.02, 0.02, 1.5]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>

      {/* === NEON WALL ACCENTS === */}
      <mesh position={[-2.2, 2.2, -2.58]}>
        <boxGeometry args={[0.03, 1.8, 0.03]} />
        <meshBasicMaterial color="#0969da" />
      </mesh>
      <pointLight position={[-2.2, 2.2, -2.5]} intensity={isDay ? 0.1 : 0.4} color="#0969da" distance={3} decay={2} />
      <mesh position={[2.2, 2.2, -2.58]}>
        <boxGeometry args={[0.03, 1.8, 0.03]} />
        <meshBasicMaterial color="#3fb950" />
      </mesh>
      <pointLight position={[2.2, 2.2, -2.5]} intensity={isDay ? 0.1 : 0.4} color="#3fb950" distance={3} decay={2} />
      <mesh position={[-2.58, 3.2, -1.0]}>
        <boxGeometry args={[0.03, 0.03, 2.4]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>
      <pointLight position={[-2.5, 3.2, -1.0]} intensity={isDay ? 0.05 : 0.3} color="#06b6d4" distance={3} decay={2} />

      {/* === CHAIR === */}
      <Chair position={[0.0, 0, 0.9]} />

      {/* === NPC sitting on the chair === */}
      <Hotspot id="about" position={[0.0, 0, 0.9]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <NPC />
      </Hotspot>

      {/* === MONITOR === click → Work / Projects (centered, back row) */}
      <Hotspot id="projects" position={[0.0, 1.05, -0.55]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <Monitor />
      </Hotspot>

      {/* === DESK LAMP === back-right corner, out of the way === */}
      <DeskLamp position={[1.35, 0.77, -0.55]} isDay={isDay} />

      {/* === COFFEE MUG — decorative, back-left corner === */}
      <group position={[-1.35, 0.91, -0.5]}>
        <CoffeeMug />
      </group>

      {/* === OCTOCAT — GitHub mascot, front-right of desk (visible) === */}
      <group position={[0.75, 0.79, 0.2]}>
        <Octocat />
      </group>

      {/* === SLEEPING CAT — decorative, back row behind monitor === */}
      <Cat position={[0.75, 0.78, -0.5]} />

      {/* === MIDDLE ROW (z ≈ 0): keyboard + mouse === */}
      <group position={[0.0, 0.78, 0.15]}>
        <Keyboard />
      </group>
      <mesh position={[0.55, 0.79, 0.15]} castShadow>
        <RoundedBox args={[0.12, 0.04, 0.18]} radius={0.02}>
          <meshStandardMaterial color="#0e0a1a" metalness={0.5} roughness={0.4} />
        </RoundedBox>
      </mesh>

      {/* === LAPTOP — decorative, far left middle row === */}
      <group position={[-1.05, 0.76, 0.1]} rotation={[0, 0.4, 0]}>
        <Laptop />
      </group>

      {/* === FRONT ROW (z ≈ 0.45-0.55): clickable items spread out === */}

      {/* Notebook → Experience (far left front) */}
      <Hotspot id="experience" position={[-1.15, 0.78, 0.5]} rotation={[0, 0.3, 0]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <Notebook position={[0, 0, 0]} />
      </Hotspot>

      {/* Books → Tech Stack (mid-left front) */}
      <Hotspot id="tech" position={[-0.6, 0.78, 0.5]} rotation={[0, -0.1, 0]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <BookStack position={[0, 0, 0]} />
      </Hotspot>

      {/* Headphones → Stranger chat (right of keyboard) */}
      <Hotspot id="stranger" position={[1.0, 0.84, 0.4]} rotation={[0, -0.4, 0]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <Headphones />
      </Hotspot>

      {/* Phone → Connect (far right front) */}
      <Hotspot id="connect" position={[1.3, 0.78, 0.5]} rotation={[0, -0.6, 0]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <Phone />
      </Hotspot>

      {/* === WALL ITEMS === back wall === */}

      {/* === PICTURE FRAME === click → About === */}
      <Hotspot id="photos" position={[-1.7, 2.0, -2.55]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <PictureFrame />
      </Hotspot>

      {/* === GUESTBOOK WALL === */}
      <Hotspot id="guestbook" position={[0.0, 2.0, -2.55]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <GuestbookWall />
      </Hotspot>

      {/* === TRAVEL POSTER === click → Travel === */}
      <Hotspot id="travel" position={[1.7, 2.0, -2.55]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <TravelPoster />
      </Hotspot>

      {/* === DUMBBELL (fitness) on the floor === */}
      <Hotspot id="fitness" position={[-1.7, 0.18, 1.4]} rotation={[0, 0.3, 0]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <Dumbbell />
      </Hotspot>

      {/* === PLANT on floor === */}
      <Plant position={[2.0, 0, -1.7]} />

      {/* === SHELF on back wall with mini items === */}
      <Shelf position={[2.0, 2.3, -2.55]} onHover={onHover} onClick={onClick} hovered={hovered} />

      {/* === WALL CLOCK — back wall, between Guestbook and Travel poster === */}
      <Clock position={[0.85, 2.85, -2.55]} />

      {/* === STICKY NOTES on monitor === */}
      <StickyNotes position={[0.85, 1.4, -0.5]} />

      {/* === FLOATING PARTICLES === */}

      {gameMode && <Player onNear={onNear} hotspots={HOTSPOTS} />}
    </group>
  )
}

// ─── Window with day/night sky + 2×2 social link board ──────────────
function Window({ position, isDay }) {
  const PANELS = [
    { label: 'GitHub', color: '#6e40c9', emoji: '🐙', url: 'https://github.com/kranthi0003', sub: '@kranthi0003' },
    { label: 'LinkedIn', color: '#0a66c2', emoji: '💼', url: 'https://linkedin.com/in/akkiran003', sub: '/in/akkiran003' },
    { label: 'Instagram', color: '#e1306c', emoji: '📸', url: 'https://instagram.com/kranthi.kiran', sub: '@kranthi.kiran' },
    { label: 'X · Twitter', color: '#ffffff', emoji: '𝕏', url: 'https://x.com/kranthikiran03', sub: '@kranthikiran03' },
  ]
  const handleClick = (p) => {
    if (p.url) window.open(p.url, '_blank', 'noopener')
  }
  return (
    <group position={position} rotation={[0, Math.PI / 2, 0]}>
      {/* Outer frame */}
      <RoundedBox args={[2.0, 1.6, 0.08]} radius={0.02}>
        <meshStandardMaterial color="#1a1326" />
      </RoundedBox>
      {/* Cross frame dividers */}
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[0.05, 1.5, 0.02]} />
        <meshStandardMaterial color="#0c0712" />
      </mesh>
      <mesh position={[0, 0, 0.05]}>
        <boxGeometry args={[1.9, 0.05, 0.02]} />
        <meshStandardMaterial color="#0c0712" />
      </mesh>
      {/* 2×2 social link panels */}
      {PANELS.map((p, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const px = -0.47 + col * 0.94
        const py = 0.38 - row * 0.76
        return (
          <group key={i} position={[px, py, 0.045]}
            onClick={(e) => { e.stopPropagation(); handleClick(p) }}
            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { document.body.style.cursor = 'default' }}
          >
            {/* Panel background */}
            <mesh>
              <planeGeometry args={[0.88, 0.68]} />
              <meshBasicMaterial color={p.color} transparent opacity={0.3} toneMapped={false} />
            </mesh>
            {/* Clickable hit area */}
            <mesh visible={false}>
              <planeGeometry args={[0.88, 0.68]} />
              <meshBasicMaterial />
            </mesh>
            {/* Text overlay */}
            <Html position={[0, 0, 0.01]} center transform occlude scale={0.06}
              style={{ pointerEvents: 'none', whiteSpace: 'nowrap', userSelect: 'none' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '4px' }}>{p.emoji}</div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: 'white', letterSpacing: '0.12em', textTransform: 'uppercase', textShadow: '0 2px 8px rgba(0,0,0,1)' }}>
                  {p.label}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.8)', marginTop: '4px', fontFamily: 'monospace', textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}>
                  {p.sub}
                </div>
              </div>
            </Html>
            {/* Glow */}
            <pointLight position={[0, 0, 0.25]} intensity={isDay ? 0.15 : 0.4} color={p.color} distance={2} decay={2} />
          </group>
        )
      })}
    </group>
  )
}

// ─── Monitor — fetches real GitHub commits from kranthi0003 ─────────
function Monitor() {
  const linesRef = useRef()
  const [commits, setCommits] = React.useState([])

  React.useEffect(() => {
    let cancelled = false
    fetch('https://api.github.com/users/kranthi0003/events/public?per_page=30')
      .then(r => r.ok ? r.json() : [])
      .then(events => {
        if (cancelled) return
        const msgs = []
        events.forEach(ev => {
          if (ev.type === 'PushEvent' && ev.payload?.commits) {
            ev.payload.commits.slice(0, 3).forEach(c => {
              msgs.push({ msg: c.message.split('\n')[0].slice(0, 50), repo: ev.repo.name.split('/').pop() })
            })
          } else if (ev.type === 'PullRequestEvent' && ev.payload?.pull_request) {
            msgs.push({ msg: `PR: ${ev.payload.pull_request.title.slice(0, 45)}`, repo: ev.repo.name.split('/').pop() })
          } else if (ev.type === 'CreateEvent') {
            msgs.push({ msg: `+ ${ev.payload.ref_type}`, repo: ev.repo.name.split('/').pop() })
          }
        })
        setCommits(msgs.slice(0, 18))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useFrame((state) => {
    if (linesRef.current) {
      const total = Math.max(1, commits.length)
      linesRef.current.position.y = -((state.clock.elapsedTime * 0.08) % 1) * (total * 0.05) + 0.4
    }
  })

  return (
    <group>
      {/* Stand */}
      <mesh position={[0, -0.45, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.04, 16]} />
        <meshStandardMaterial color="#1a1326" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.2, 0]} castShadow>
        <boxGeometry args={[0.06, 0.5, 0.06]} />
        <meshStandardMaterial color="#1a1326" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Bezel */}
      <RoundedBox args={[1.6, 0.95, 0.06]} radius={0.02}>
        <meshStandardMaterial color="#0c0814" metalness={0.7} roughness={0.3} />
      </RoundedBox>
      {/* Screen */}
      <mesh position={[0, 0, 0.035]}>
        <planeGeometry args={[1.52, 0.87]} />
        <meshBasicMaterial color="#1a0d3a" toneMapped={false} />
      </mesh>
      {/* Title bar */}
      <mesh position={[0, 0.38, 0.04]}>
        <planeGeometry args={[1.52, 0.12]} />
        <meshBasicMaterial color="#0c0712" toneMapped={false} />
      </mesh>
      <Html position={[-0.7, 0.38, 0.05]} transform occlude scale={0.04} rotation={[0, 0, 0]}>
        <div style={{ color: '#58a6ff', fontFamily: 'ui-monospace, monospace', fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap' }}>
          ● github.com/kranthi0003 — live
        </div>
      </Html>
      {/* Scrolling commits */}
      <group position={[-0.7, 0, 0.045]} ref={linesRef}>
        {commits.map((c, i) => (
          <Html key={i} position={[0, 0.3 - i * 0.06, 0]} transform occlude scale={0.03} rotation={[0, 0, 0]}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 16, whiteSpace: 'nowrap', display: 'flex', gap: 8 }}>
              <span style={{ color: '#3fb950' }}>$</span>
              <span style={{ color: '#94a3b8' }}>{c.repo}</span>
              <span style={{ color: '#e2e8f0' }}>{c.msg}</span>
            </div>
          </Html>
        ))}
        {commits.length === 0 && (
          [0.22, 0.13, 0.04, -0.05, -0.14, -0.23].map((y, i) => (
            <mesh key={i} position={[0, y, 0]}>
              <planeGeometry args={[0.5 - (i % 3) * 0.08, 0.022]} />
              <meshBasicMaterial color={i % 3 === 0 ? MAGENTA : '#79c0ff'} toneMapped={false} />
            </mesh>
          ))
        )}
      </group>
      {/* Status dot bottom */}
      <mesh position={[0, -0.4, 0.04]}>
        <circleGeometry args={[0.012, 16]} />
        <meshBasicMaterial color="#22c55e" toneMapped={false} />
      </mesh>
    </group>
  )
}

// ─── Laptop ─────────────────────────────────────────────────────────
function Laptop() {
  return (
    <group>
      <RoundedBox args={[1.0, 0.04, 0.7]} radius={0.02}>
        <meshStandardMaterial color="#1c1530" metalness={0.7} roughness={0.3} />
      </RoundedBox>
      {/* Trackpad */}
      <mesh position={[0, 0.025, 0.2]}>
        <planeGeometry args={[0.42, 0.22]} />
        <meshStandardMaterial color="#0c0712" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Mini keys */}
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 12 }).map((_, col) => (
          <mesh key={`${row}-${col}`} position={[-0.42 + col * 0.07, 0.024, -0.22 + row * 0.05]}>
            <boxGeometry args={[0.055, 0.005, 0.04]} />
            <meshStandardMaterial color="#1a1326" />
          </mesh>
        ))
      )}
      {/* Screen */}
      <group position={[0, 0.36, -0.32]} rotation={[-0.35, 0, 0]}>
        <RoundedBox args={[1.0, 0.7, 0.03]} radius={0.02}>
          <meshStandardMaterial color="#0c0814" metalness={0.6} roughness={0.4} />
        </RoundedBox>
        <mesh position={[0, 0, 0.018]}>
          <planeGeometry args={[0.94, 0.62]} />
          <meshBasicMaterial color={VIOLET} toneMapped={false} />
        </mesh>
        {[0.22, 0.13, 0.04, -0.05, -0.14, -0.23].map((y, i) => (
          <mesh key={i} position={[-0.28 + (i % 2) * 0.05, y, 0.02]}>
            <planeGeometry args={[0.38 - (i % 3) * 0.06, 0.018]} />
            <meshBasicMaterial color={i % 3 === 0 ? MAGENTA : '#79c0ff'} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// ─── Keyboard ──────────────────────────────────────────────────────
function Keyboard() {
  return (
    <group>
      <RoundedBox args={[1.0, 0.06, 0.36]} radius={0.015}>
        <meshStandardMaterial color="#0e0a1a" metalness={0.4} roughness={0.5} />
      </RoundedBox>
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 14 }).map((_, col) => (
          <mesh key={`${row}-${col}`} position={[-0.43 + col * 0.066, 0.04, -0.13 + row * 0.06]} castShadow>
            <boxGeometry args={[0.054, 0.03, 0.05]} />
            <meshStandardMaterial color="#1f152e" roughness={0.6} />
          </mesh>
        ))
      )}
      <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.05, 0.42]} />
        <meshBasicMaterial color={VIOLET} transparent opacity={0.25} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ─── Coffee mug ────────────────────────────────────────────────────
function CoffeeMug() {
  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.13, 0.11, 0.22, 24]} />
        <meshStandardMaterial color="#1c1530" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.105, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.01, 24]} />
        <meshStandardMaterial color="#3a2818" emissive="#231410" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.06, 0.018, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#1c1530" roughness={0.5} />
      </mesh>
      <Float speed={2} floatIntensity={0.5}>
        <mesh position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
        </mesh>
      </Float>
    </group>
  )
}

// ─── Phone ─────────────────────────────────────────────────────────
function Phone() {
  return (
    <group>
      <RoundedBox args={[0.3, 0.02, 0.62]} radius={0.035}>
        <meshStandardMaterial color="#1c1530" metalness={0.7} roughness={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.26, 0.55]} />
        <meshBasicMaterial color={MAGENTA} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.012, -0.26]}>
        <circleGeometry args={[0.012, 16]} />
        <meshBasicMaterial color="#000" />
      </mesh>
    </group>
  )
}

// ─── Desk lamp ─────────────────────────────────────────────────────
function DeskLamp({ position, isDay }) {
  return (
    <group position={position}>
      {/* Base */}
      <mesh castShadow>
        <cylinderGeometry args={[0.14, 0.16, 0.04, 18]} />
        <meshStandardMaterial color="#1a1326" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Arm */}
      <mesh position={[0, 0.35, 0]} rotation={[0, 0, 0.2]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.7, 12]} />
        <meshStandardMaterial color="#1a1326" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Joint */}
      <mesh position={[0.14, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color="#0c0712" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Head */}
      <mesh position={[0.4, 0.6, 0]} rotation={[0, 0, -0.6]} castShadow>
        <coneGeometry args={[0.16, 0.22, 18, 1, true]} />
        <meshStandardMaterial color="#2a1d3f" metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Bulb glow */}
      <mesh position={[0.4, 0.55, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={isDay ? '#fff4b0' : '#ffd16a'} toneMapped={false} />
      </mesh>
      {/* Light cone visualization */}
      <mesh position={[0.5, 0.2, 0]} rotation={[0, 0, -0.6]}>
        <coneGeometry args={[0.5, 0.8, 16, 1, true]} />
        <meshBasicMaterial color="#ffd16a" transparent opacity={isDay ? 0.06 : 0.18} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ─── Notebook + pen ────────────────────────────────────────────────
function Notebook({ position }) {
  return (
    <group position={position} rotation={[0, 0.2, 0]}>
      <RoundedBox args={[0.38, 0.025, 0.5]} radius={0.01} castShadow>
        <meshStandardMaterial color="#3a2a55" roughness={0.7} />
      </RoundedBox>
      <mesh position={[-0.15, 0.014, 0]}>
        <planeGeometry args={[0.02, 0.48]} />
        <meshBasicMaterial color="#3fb950" toneMapped={false} />
      </mesh>
      {/* Pen */}
      <mesh position={[0.18, 0.025, 0.1]} rotation={[0, 0.3, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.3, 8]} />
        <meshStandardMaterial color={VIOLET} metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ─── Book stack ─────────────────────────────────────────────────────
function BookStack({ position }) {
  const books = [
    { w: 0.4, d: 0.28, h: 0.04, color: '#8B5CF6' },
    { w: 0.36, d: 0.26, h: 0.045, color: '#EC4899' },
    { w: 0.38, d: 0.27, h: 0.04, color: '#F59E0B' },
    { w: 0.34, d: 0.25, h: 0.05, color: '#10B981' },
  ]
  let y = 0
  return (
    <group position={position} rotation={[0, -0.1, 0]}>
      {books.map((b, i) => {
        const item = (
          <RoundedBox key={i} args={[b.w, b.h, b.d]} radius={0.005} position={[0, y, 0]} castShadow>
            <meshStandardMaterial color={b.color} roughness={0.7} />
          </RoundedBox>
        )
        y += b.h
        return item
      })}
    </group>
  )
}

// ─── Sleeping cat ───────────────────────────────────────────────────
function Cat({ position }) {
  const breathRef = useRef()
  useFrame((state) => {
    if (breathRef.current) {
      breathRef.current.scale.y = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.04
    }
  })
  return (
    <group position={position} rotation={[0, -0.3, 0]}>
      {/* Body */}
      <group ref={breathRef}>
        <mesh castShadow>
          <sphereGeometry args={[0.15, 16, 12]} />
          <meshStandardMaterial color="#1a1326" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0, 0.15]} scale={[1, 0.9, 1.4]} castShadow>
          <sphereGeometry args={[0.13, 16, 12]} />
          <meshStandardMaterial color="#1a1326" roughness={0.9} />
        </mesh>
      </group>
      {/* Head */}
      <mesh position={[-0.18, 0.05, 0.05]} castShadow>
        <sphereGeometry args={[0.1, 16, 12]} />
        <meshStandardMaterial color="#1a1326" roughness={0.9} />
      </mesh>
      {/* Ears */}
      <mesh position={[-0.24, 0.13, 0]} rotation={[0, 0, 0.3]} castShadow>
        <coneGeometry args={[0.04, 0.08, 6]} />
        <meshStandardMaterial color="#1a1326" />
      </mesh>
      <mesh position={[-0.13, 0.13, 0]} rotation={[0, 0, -0.3]} castShadow>
        <coneGeometry args={[0.04, 0.08, 6]} />
        <meshStandardMaterial color="#1a1326" />
      </mesh>
      {/* Tail wrapped */}
      <mesh position={[0.18, 0, -0.05]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.08, 0.025, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#1a1326" />
      </mesh>
      {/* "ZZZ" floating */}
      <Float speed={1.5} floatIntensity={0.6}>
        <mesh position={[-0.05, 0.3, 0.1]}>
          <planeGeometry args={[0.05, 0.06]} />
          <meshBasicMaterial color="#79c0ff" transparent opacity={0.7} toneMapped={false} />
        </mesh>
      </Float>
    </group>
  )
}

// ─── Picture frame ─────────────────────────────────────────────────
function PictureFrame() {
  return (
    <group>
      <RoundedBox args={[0.8, 0.6, 0.04]} radius={0.015}>
        <meshStandardMaterial color="#3a2a55" />
      </RoundedBox>
      {/* Inner mat */}
      <mesh position={[0, 0, 0.025]}>
        <planeGeometry args={[0.7, 0.5]} />
        <meshBasicMaterial color="#0c0814" />
      </mesh>
      {/* "Photo" — gradient placeholder */}
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[0.6, 0.4]} />
        <meshBasicMaterial color={VIOLET} toneMapped={false} />
      </mesh>
      <mesh position={[-0.15, 0.05, 0.027]}>
        <circleGeometry args={[0.08, 24]} />
        <meshBasicMaterial color="#fdbae0" toneMapped={false} />
      </mesh>
      <mesh position={[0.1, -0.08, 0.027]}>
        <planeGeometry args={[0.3, 0.15]} />
        <meshBasicMaterial color={MAGENTA} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ─── Octocat (GitHub mascot) — purple, 6 little tentacles + cat face ──
function Octocat() {
  const ref = useRef()
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime
      ref.current.position.y = 0.06 + Math.abs(Math.sin(t * 1.2)) * 0.015
      ref.current.rotation.y = Math.sin(t * 0.5) * 0.15
    }
  })
  const PURPLE = '#7e57c2'
  return (
    <group ref={ref}>
      {/* Body */}
      <mesh castShadow>
        <sphereGeometry args={[0.085, 24, 18]} />
        <meshStandardMaterial color={PURPLE} roughness={0.45} metalness={0.05} />
      </mesh>
      {/* Cat ears */}
      <mesh position={[-0.045, 0.07, 0.04]} rotation={[0.3, 0, -0.4]} castShadow>
        <coneGeometry args={[0.022, 0.05, 8]} />
        <meshStandardMaterial color={PURPLE} roughness={0.5} />
      </mesh>
      <mesh position={[0.045, 0.07, 0.04]} rotation={[0.3, 0, 0.4]} castShadow>
        <coneGeometry args={[0.022, 0.05, 8]} />
        <meshStandardMaterial color={PURPLE} roughness={0.5} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.025, 0.02, 0.08]}>
        <sphereGeometry args={[0.012, 10, 8]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
      <mesh position={[0.025, 0.02, 0.08]}>
        <sphereGeometry args={[0.012, 10, 8]} />
        <meshBasicMaterial color="#fff" />
      </mesh>
      <mesh position={[-0.025, 0.02, 0.088]}>
        <sphereGeometry args={[0.006, 8, 6]} />
        <meshBasicMaterial color="#0a0612" />
      </mesh>
      <mesh position={[0.025, 0.02, 0.088]}>
        <sphereGeometry args={[0.006, 8, 6]} />
        <meshBasicMaterial color="#0a0612" />
      </mesh>
      {/* Smile */}
      <mesh position={[0, -0.02, 0.084]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.015, 0.0025, 6, 8, Math.PI]} />
        <meshBasicMaterial color="#0a0612" />
      </mesh>
      {/* 6 tentacles around the bottom */}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2
        const x = Math.cos(a) * 0.07
        const z = Math.sin(a) * 0.07
        return (
          <mesh key={i} position={[x, -0.075, z]} rotation={[Math.PI / 2 - 0.4, 0, -a]} castShadow>
            <capsuleGeometry args={[0.012, 0.06, 4, 8]} />
            <meshStandardMaterial color={PURPLE} roughness={0.55} />
          </mesh>
        )
      })}
    </group>
  )
}

// ─── Whiteboard ────────────────────────────────────────────────────
function Whiteboard() {
  return (
    <group>
      <RoundedBox args={[1.4, 0.9, 0.04]} radius={0.02}>
        <meshStandardMaterial color="#f4f1e8" roughness={0.8} />
      </RoundedBox>
      {[
        [-0.4, 0.2, 0.5, 0.2],
        [-0.4, 0, 0.2, 0],
        [-0.2, 0.1, -0.2, -0.1],
        [0.1, -0.2, 0.5, -0.2],
      ].map((line, i) => (
        <mesh key={i} position={[(line[0]+line[2])/2, (line[1]+line[3])/2, 0.025]}>
          <planeGeometry args={[Math.hypot(line[2]-line[0], line[3]-line[1]), 0.012]} />
          <meshBasicMaterial color="#0550ae" toneMapped={false} />
        </mesh>
      ))}
      {[[-0.4, 0.2], [0.5, 0.2], [-0.2, -0.1], [0.5, -0.2]].map((p, i) => (
        <mesh key={i} position={[p[0], p[1], 0.025]}>
          <planeGeometry args={[0.14, 0.08]} />
          <meshBasicMaterial color={i % 2 === 0 ? VIOLET : MAGENTA} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Travel poster ─────────────────────────────────────────────────
function TravelPoster() {
  return (
    <group>
      <RoundedBox args={[0.9, 1.2, 0.04]} radius={0.02}>
        <meshStandardMaterial color="#1c1530" />
      </RoundedBox>
      <mesh position={[0, 0.1, 0.025]}>
        <ringGeometry args={[0.22, 0.25, 32]} />
        <meshBasicMaterial color={CORAL} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.1, 0.026]}>
        <circleGeometry args={[0.22, 32]} />
        <meshBasicMaterial color="#1c1530" />
      </mesh>
      {[[-0.1, 0.15], [0.05, 0.05], [0.12, 0.18], [-0.05, 0.02]].map((p, i) => (
        <mesh key={i} position={[p[0], p[1], 0.03]}>
          <circleGeometry args={[0.014, 12]} />
          <meshBasicMaterial color={CORAL} toneMapped={false} />
        </mesh>
      ))}
      {[-0.35, -0.42, -0.49].map((y, i) => (
        <mesh key={i} position={[0, y, 0.025]}>
          <planeGeometry args={[0.6 - i * 0.1, 0.02]} />
          <meshBasicMaterial color="#79c0ff" />
        </mesh>
      ))}
    </group>
  )
}

// ─── Dumbbell ──────────────────────────────────────────────────────
function Dumbbell() {
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 12]} />
        <meshStandardMaterial color="#3a2a55" metalness={0.8} roughness={0.2} />
      </mesh>
      {[-0.35, 0.35].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.13, 0.18, 16]} />
          <meshStandardMaterial color="#1a1326" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Headphones ────────────────────────────────────────────────────
function Headphones() {
  return (
    <group>
      <mesh castShadow>
        <torusGeometry args={[0.18, 0.025, 12, 24, Math.PI]} />
        <meshStandardMaterial color="#1c1530" metalness={0.5} roughness={0.4} />
      </mesh>
      {[-0.18, 0.18].map((x, i) => (
        <mesh key={i} position={[x, -0.04, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.07, 18]} />
          <meshStandardMaterial color="#0e0a1a" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0.18, -0.04, 0.04]}>
        <ringGeometry args={[0.04, 0.06, 24]} />
        <meshBasicMaterial color={MAGENTA} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ─── Chair ─────────────────────────────────────────────────────────
function Chair({ position }) {
  return (
    <group position={position}>
      {/* Seat */}
      <RoundedBox args={[0.7, 0.08, 0.65]} radius={0.02} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial color="#1a1326" roughness={0.7} />
      </RoundedBox>
      {/* Back — behind the seat (away from desk, positive z) */}
      <RoundedBox args={[0.7, 0.9, 0.08]} radius={0.04} position={[0, 0.9, 0.3]} castShadow>
        <meshStandardMaterial color="#1a1326" roughness={0.7} />
      </RoundedBox>
      {/* Pillar */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.5, 12]} />
        <meshStandardMaterial color="#0c0712" metalness={0.6} />
      </mesh>
      {/* 5-star base */}
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.18, 0.02, Math.sin(a) * 0.18]} rotation={[0, -a, 0]} castShadow>
            <boxGeometry args={[0.36, 0.04, 0.06]} />
            <meshStandardMaterial color="#0c0712" metalness={0.6} />
          </mesh>
        )
      })}
      {/* Wheels */}
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.34, 0.025, Math.sin(a) * 0.34]} castShadow>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color="#0c0712" />
          </mesh>
        )
      })}
    </group>
  )
}

// ─── Plant ─────────────────────────────────────────────────────────
function Plant({ position }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.18, 0.14, 0.28, 16]} />
        <meshStandardMaterial color="#3a2a55" roughness={0.7} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.1, 0.45, Math.sin(a) * 0.1]} rotation={[0, a, 0.4]} castShadow>
            <coneGeometry args={[0.06, 0.45, 6]} />
            <meshStandardMaterial color="#22c55e" />
          </mesh>
        )
      })}
    </group>
  )
}

// ─── Shelf on wall ──────────────────────────────────────────────────
function Shelf({ position, onHover, onClick, hovered }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.0, 0.04, 0.2]} />
        <meshStandardMaterial color="#2a1d3f" roughness={0.6} />
      </mesh>
      <mesh position={[-0.35, 0.1, 0]} castShadow>
        <boxGeometry args={[0.05, 0.16, 0.04]} />
        <meshStandardMaterial color="#8B5CF6" />
      </mesh>
      <mesh position={[-0.27, 0.09, 0]} castShadow>
        <boxGeometry args={[0.04, 0.14, 0.04]} />
        <meshStandardMaterial color="#EC4899" />
      </mesh>
      <mesh position={[-0.2, 0.1, 0]} castShadow>
        <boxGeometry args={[0.05, 0.16, 0.04]} />
        <meshStandardMaterial color="#F59E0B" />
      </mesh>
      {/* Secret trophy — clickable */}
      <Hotspot id="secret-trophy" position={[0.1, 0.08, 0]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.06, 0.12, 12]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.3} emissive="#fbbf24" emissiveIntensity={0.2} />
        </mesh>
        <mesh position={[0, -0.06, 0]} castShadow>
          <boxGeometry args={[0.08, 0.04, 0.06]} />
          <meshStandardMaterial color="#1a1326" />
        </mesh>
      </Hotspot>
      <mesh position={[0.35, 0.08, 0]} castShadow rotation={[0, 0.3, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshStandardMaterial color="#10B981" />
      </mesh>
    </group>
  )
}

// ─── Wall clock with live IST time ──────────────────────────────────
function Clock({ position, rotation = [0, 0, 0] }) {
  const minRef = useRef()
  const hrRef  = useRef()
  const secRef = useRef()
  useFrame(() => {
    const ist = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const s = ist.getSeconds()
    const m = ist.getMinutes() + s / 60
    const h = (ist.getHours() % 12) + m / 60
    if (secRef.current) secRef.current.rotation.z = -(s / 60) * Math.PI * 2
    if (minRef.current) minRef.current.rotation.z = -(m / 60) * Math.PI * 2
    if (hrRef.current)  hrRef.current.rotation.z = -(h / 12) * Math.PI * 2
  })
  return (
    <group position={position} rotation={rotation}>
      {/* Body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.05, 32]} />
        <meshStandardMaterial color="#1a1326" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Face */}
      <mesh position={[0, 0, 0.028]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.28, 32]} />
        <meshBasicMaterial color="#f4f1e8" />
      </mesh>
      {/* Hour ticks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2
        const major = i % 3 === 0
        return (
          <mesh key={i} position={[Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0.032]}>
            <planeGeometry args={[major ? 0.02 : 0.012, major ? 0.04 : 0.025]} />
            <meshBasicMaterial color="#1a1326" />
          </mesh>
        )
      })}
      {/* Hour hand */}
      <mesh ref={hrRef} position={[0, 0, 0.034]}>
        <planeGeometry args={[0.02, 0.22]} />
        <meshBasicMaterial color="#1a1326" />
      </mesh>
      {/* Minute hand */}
      <mesh ref={minRef} position={[0, 0, 0.036]}>
        <planeGeometry args={[0.014, 0.32]} />
        <meshBasicMaterial color="#333" />
      </mesh>
      {/* Second hand */}
      <mesh ref={secRef} position={[0, 0, 0.038]}>
        <planeGeometry args={[0.005, 0.34]} />
        <meshBasicMaterial color={MAGENTA} toneMapped={false} />
      </mesh>
      {/* Center pin */}
      <mesh position={[0, 0, 0.04]}>
        <circleGeometry args={[0.018, 16]} />
        <meshBasicMaterial color={VIOLET} toneMapped={false} />
      </mesh>
      {/* "IST" label */}
      <Html position={[0, -0.12, 0.035]} center transform occlude scale={0.03}
        style={{ pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{ fontSize: '8px', fontWeight: 800, color: '#1a1326', letterSpacing: '0.15em', fontFamily: 'monospace' }}>
          IST
        </div>
      </Html>
    </group>
  )
}

// ─── Sticky notes ───────────────────────────────────────────────────
function StickyNotes({ position }) {
  return (
    <group position={position}>
      <mesh rotation={[0, 0, 0.1]} castShadow>
        <planeGeometry args={[0.18, 0.18]} />
        <meshBasicMaterial color="#fde047" toneMapped={false} />
      </mesh>
      <mesh position={[-0.05, -0.13, 0.001]} rotation={[0, 0, -0.15]} castShadow>
        <planeGeometry args={[0.15, 0.15]} />
        <meshBasicMaterial color="#f97316" toneMapped={false} />
      </mesh>
    </group>
  )
}

// Map hotspot ID -> world position. Kept for future scripted moves but
// the live camera-focus loop was unstable (hover->cam->hover ping-pong)
// so CameraFocus is no longer mounted.
const FOCUS_POS = {
  projects:   [-0.05, 1.20, -0.5],
  experience: [-1.05, 0.85, -0.5],
  connect:    [1.05, 0.85, -0.05],
  tech:       [-1.4, 0.85, -0.4],
  travel:     [1.7, 2.0, -2.55],
  photos:     [-1.6, 2.0, -2.55],
  fitness:    [-1.7, 0.4, 1.4],
  stranger:   [-0.6, 0.95, -0.65],
  about:      [0.0, 1.0, 0.9],
  guestbook:  [0.2, 2.0, -2.55],
  'secret-trophy': [2.0, 2.5, -2.55],
}
const HOTSPOT_LABELS = {
  projects:   { text: 'MY WORK',     emoji: '🖥️' },
  experience: { text: 'EXPERIENCE',  emoji: '📓' },
  connect:    { text: 'CONNECT',     emoji: '📱' },
  tech:       { text: 'TECH STACK',  emoji: '📚' },
  travel:     { text: 'TRAVEL',      emoji: '🌴' },
  photos:     { text: 'ABOUT ME',    emoji: '🖼️' },
  fitness:    { text: 'GYM',         emoji: '🏋️' },
  stranger:   { text: 'STRANGER CHAT', emoji: '🎧' },
  about:      { text: 'SAY HI',      emoji: '💬' },
  guestbook:  { text: 'GUESTBOOK',   emoji: '📝' },
  'secret-trophy': { text: 'TROPHY', emoji: '🏆' },
}

function Hotspot({ id, position, rotation, children, onHover, onClick, hovered }) {
  const ref = useRef()
  const popRef = useRef(0) // 0 = idle, 1 = just clicked
  const isHover = hovered === id
  const label = HOTSPOT_LABELS[id]

  useFrame((_, dt) => {
    if (!ref.current) return
    // Click pop decay
    if (popRef.current > 0) popRef.current = Math.max(0, popRef.current - dt * 2.4)
    const hoverScale = isHover ? 1.03 : 1
    const popScale = 1 + popRef.current * 0.12
    const target = hoverScale * popScale
    const cur = ref.current.scale.x
    const next = cur + (target - cur) * dt * 10
    ref.current.scale.setScalar(next)
  })

  const handleClick = (e) => {
    e.stopPropagation()
    popRef.current = 1 // trigger pop
    // Small delay so the pop is visible before route change
    setTimeout(() => onClick(id), 180)
  }

  return (
    <group
      position={position}
      rotation={rotation}
      ref={ref}
      onPointerOver={(e) => { e.stopPropagation(); onHover(id); document.body.style.cursor = 'pointer' }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(null); document.body.style.cursor = 'auto' }}
      onClick={handleClick}
    >
      {children}
      {/* Glow ring */}
      {isHover && (
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.42, 32]} />
          <meshBasicMaterial color={VIOLET} transparent opacity={0.5} toneMapped={false} />
        </mesh>
      )}
      {/* Floating label tag */}
      {isHover && label && (
        <Html
          center
          position={[0, 0.5, 0]}
          distanceFactor={6}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, rgba(9,105,218,0.95), rgba(63,185,80,0.95))',
            color: 'white',
            padding: '6px 12px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            fontFamily: 'ui-monospace, monospace',
            whiteSpace: 'nowrap',
            boxShadow: '0 8px 24px -6px rgba(9,105,218,0.7), inset 0 0 0 1px rgba(255,255,255,0.2)',
            transform: 'translateY(-4px)',
            animation: 'hs-pop 220ms cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <span style={{ marginRight: 6 }}>{label.emoji}</span>
            {label.text}
            <span style={{ marginLeft: 8, opacity: 0.8 }}>↗</span>
          </div>
        </Html>
      )}
    </group>
  )
}

// ─── Floating dust particles ────────────────────────────────────────
function Particles({ count = 30 }) {
  const points = useRef()
  const positions = React.useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 6
      arr[i * 3 + 1] = Math.random() * 3 + 0.5
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.04
      const arr = points.current.geometry.attributes.position.array
      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] += Math.sin(state.clock.elapsedTime + i) * 0.0008
      }
      points.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={VIOLET} size={0.03} sizeAttenuation transparent opacity={0.7} />
    </points>
  )
}

// ─── Player character (low-poly) with WASD controls + camera follow ─
function Player({ onNear, hotspots }) {
  const playerRef = useRef()
  const keys      = useRef({})
  const facing    = useRef(0)
  const speed     = useRef(0)
  const lastNear  = useRef(null)

  useEffect(() => {
    const down = (e) => { keys.current[e.key.toLowerCase()] = true }
    const up   = (e) => { keys.current[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useFrame((state, dt) => {
    if (!playerRef.current) return
    const k = keys.current
    const run = k['shift']
    const v = run ? 3.0 : 1.6
    let dx = 0, dz = 0
    if (k['w'] || k['arrowup'])    dz -= 1
    if (k['s'] || k['arrowdown'])  dz += 1
    if (k['a'] || k['arrowleft'])  dx -= 1
    if (k['d'] || k['arrowright']) dx += 1
    const moving = dx !== 0 || dz !== 0
    if (moving) {
      const len = Math.hypot(dx, dz)
      dx /= len; dz /= len
      playerRef.current.position.x += dx * v * dt
      playerRef.current.position.z += dz * v * dt
      facing.current = Math.atan2(dx, dz)
      playerRef.current.rotation.y = facing.current
      speed.current = run ? 2 : 1
    } else {
      speed.current *= 0.9
    }
    // Soft bounds
    const p = playerRef.current.position
    p.x = Math.max(-2.4, Math.min(2.4, p.x))
    p.z = Math.max(-1.8, Math.min(2.5, p.z))

    // Find nearest hotspot within radius
    let nearest = null, bestD = 0.9
    for (const h of hotspots) {
      const dx2 = h.pos[0] - p.x, dz2 = h.pos[2] - p.z
      const d = Math.hypot(dx2, dz2)
      if (d < bestD) { bestD = d; nearest = h.id }
    }
    if (nearest !== lastNear.current) {
      lastNear.current = nearest
      onNear(nearest)
    }

    // Camera follow (third-person, behind & above)
    const cam = state.camera
    const camTargetX = p.x - Math.sin(facing.current) * 3.0
    const camTargetZ = p.z - Math.cos(facing.current) * 3.0
    const camTargetY = 2.0
    cam.position.x += (camTargetX - cam.position.x) * 0.08
    cam.position.y += (camTargetY - cam.position.y) * 0.08
    cam.position.z += (camTargetZ - cam.position.z) * 0.08
    cam.lookAt(p.x, p.y + 0.8, p.z)
  })

  return (
    <group ref={playerRef} position={[1.5, 0, 2.0]}>
      <RiggedSoldier speed={speed} />
      {/* Player nameplate */}
      <Html position={[0, 2.0, 0]} center distanceFactor={6} occlude>
        <div style={{
          padding: '2px 8px',
          borderRadius: 8,
          background: 'rgba(139, 92, 246, 0.85)',
          color: 'white',
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          fontFamily: 'system-ui',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>You</div>
      </Html>
    </group>
  )
}

// ─── Mixamo-style rigged Soldier (Three.js example asset, CC0-equivalent)
// Loaded from public/models/soldier.glb. 3 baked anims: Idle, Walk, Run.
// Driven by a `speed` ref so the parent Player can pick the right clip
// without re-rendering this component every frame.
const SOLDIER_URL = `${import.meta.env.BASE_URL || '/'}models/soldier.glb`

function RiggedSoldier({ speed }) {
  const group = useRef()
  const { scene, animations } = useGLTF(SOLDIER_URL)
  const cloned = React.useMemo(() => {
    // Clone so multiple instances don't share skeleton
    const s = scene.clone(true)
    s.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = true
        // The default model is a soldier in green; tint slightly toward our palette
        if (o.material && o.material.color) {
          o.material = o.material.clone()
        }
      }
    })
    return s
  }, [scene])
  const { actions, names } = useAnimations(animations, group)
  const currentRef = useRef(null)

  // Idle by default, swap when speed crosses thresholds
  useFrame(() => {
    if (!actions || names.length === 0) return
    const s = speed?.current ?? 0
    let want
    if (s > 1.4) want = 'Run'
    else if (s > 0.15) want = 'Walk'
    else want = 'Idle'
    if (!actions[want]) want = names[0]
    if (currentRef.current !== want) {
      const next = actions[want]
      const prev = currentRef.current ? actions[currentRef.current] : null
      next?.reset().fadeIn(0.25).play()
      if (prev) prev.fadeOut(0.25)
      currentRef.current = want
    }
  })

  return (
    <group ref={group}>
      {/* Soldier model is ~1.8m tall; our procedural figure was ~1.1m. Scale + ground it. */}
      <primitive object={cloned} scale={0.62} position={[0, 0, 0]} rotation={[0, Math.PI, 0]} />
    </group>
  )
}

useGLTF.preload(SOLDIER_URL)

// ─── NPC: Stylized boy character — IST-hour driven activity ──────────
function NPC() {
  const headRef = useRef()
  const armLRef = useRef()
  const armRRef = useRef()
  const bodyRef = useRef()

  const [activity, setActivity] = React.useState(() => getActivity())
  React.useEffect(() => {
    const id = setInterval(() => setActivity(getActivity()), 60_000)
    return () => clearInterval(id)
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    switch (activity.id) {
      case "sleep":
        if (bodyRef.current) bodyRef.current.scale.y = 1 + Math.sin(t * 0.6) * 0.015
        armLRef.current.rotation.x = 0.05
        armRRef.current.rotation.x = 0.05
        headRef.current.rotation.x = 0
        headRef.current.rotation.y = 0
        break
      case "work":
      case "coffee":
        // Typing — arms forward & slightly down
        armLRef.current.rotation.x = 1.55 + Math.sin(t * 9) * 0.05
        armRRef.current.rotation.x = 1.55 + Math.sin(t * 9 + 1.2) * 0.05
        headRef.current.rotation.x = 0.18 + Math.sin(t * 0.5) * 0.04
        headRef.current.rotation.y = Math.sin(t * 0.3) * 0.08
        break
      case "lunch":
        armLRef.current.rotation.x = 0.5
        armRRef.current.rotation.x = 2.4 + Math.abs(Math.sin(t * 0.7)) * 0.3
        headRef.current.rotation.x = 0.1 + Math.sin(t * 0.7) * 0.08
        break
      case "gym":
        const lift = Math.abs(Math.sin(t * 2.5))
        armLRef.current.rotation.x = 2.7 + lift * 0.4
        armRRef.current.rotation.x = 2.7 + lift * 0.4
        headRef.current.rotation.x = -0.05
        if (bodyRef.current) bodyRef.current.scale.y = 1 + Math.sin(t * 5) * 0.02
        break
      case "ps5":
        armLRef.current.rotation.x = 1.95 + Math.sin(t * 6) * 0.03
        armRRef.current.rotation.x = 1.95 + Math.sin(t * 6 + 0.5) * 0.03
        headRef.current.rotation.x = 0.15
        break
      default:
        armLRef.current.rotation.x = 0.3
        armRRef.current.rotation.x = 0.3
        headRef.current.rotation.x = 0
    }
  })

  // Polished stylized palette (Animal-Crossing-ish but for a 20s Indian guy)
  const SKIN = "#c2895f"
  const SKIN_SHADE = "#9a6840"
  const HAIR = "#0f0708"
  const SHIRT = THEME.npcShirt || "#0550ae"      // violet tee, themed by dream level
  const SHIRT_DARK = "#5b21b6"
  const PANTS = "#1e293b"      // dark jeans
  const SHOES = "#0f1218"

  const sitting = activity.id !== "gym" && activity.id !== "sleep"
  const sleeping = activity.id === "sleep"

  const hipsY = sleeping ? 0.4 : (sitting ? 0.58 : 0.85)
  const bodyRotX = sleeping ? -Math.PI / 2.2 : 0
  const bodyZ = sleeping ? 0.25 : 0

  return (
    <group>
      <group ref={bodyRef} position={[0, hipsY, bodyZ]} rotation={[bodyRotX, 0, 0]}>
        {/* Hips — wider base, narrower torso for athletic young-male silhouette */}
        <RoundedBox args={[0.34, 0.12, 0.24]} radius={0.05} position={[0, 0, 0]} castShadow>
          <meshStandardMaterial color={PANTS} roughness={0.75} />
        </RoundedBox>

        {/* Torso — slightly tapered V-shape */}
        <group position={[0, 0.25, 0]}>
          {/* Mid torso */}
          <RoundedBox args={[0.36, 0.36, 0.22]} radius={0.08} castShadow>
            <meshStandardMaterial color={SHIRT} roughness={0.7} />
          </RoundedBox>
          {/* Upper chest — slightly wider */}
          <RoundedBox args={[0.4, 0.16, 0.22]} radius={0.08} position={[0, 0.16, 0]} castShadow>
            <meshStandardMaterial color={SHIRT} roughness={0.7} />
          </RoundedBox>
          {/* T-shirt graphic */}
          <mesh position={[0, 0.02, 0.115]}>
            <circleGeometry args={[0.03, 16]} />
            <meshStandardMaterial color={SHIRT_DARK} />
          </mesh>
          {/* Shirt collar */}
          <mesh position={[0, 0.27, 0.105]}>
            <torusGeometry args={[0.06, 0.012, 8, 12, Math.PI]} />
            <meshStandardMaterial color={SHIRT_DARK} />
          </mesh>
        </group>

        {/* Neck */}
        <mesh position={[0, 0.51, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.05, 0.07, 12]} />
          <meshStandardMaterial color={SKIN_SHADE} roughness={0.7} />
        </mesh>

        {/* === HEAD === */}
        <group ref={headRef} position={[0, 0.66, 0]}>
          {/* Slightly oval head (taller than wide) */}
          <mesh castShadow>
            <sphereGeometry args={[0.135, 32, 24]} />
            <meshStandardMaterial color={SKIN} roughness={0.55} />
          </mesh>
          {/* Jaw shading bump for cheek volume */}
          <mesh position={[0, -0.05, 0.04]} scale={[1.05, 0.8, 1]} castShadow>
            <sphereGeometry args={[0.12, 20, 14]} />
            <meshStandardMaterial color={SKIN} roughness={0.6} />
          </mesh>

          {/* Hair — fuller, modern fade style */}
          <mesh position={[0, 0.04, -0.005]} castShadow>
            <sphereGeometry args={[0.145, 28, 20, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
            <meshStandardMaterial color={HAIR} roughness={0.85} />
          </mesh>
          {/* Hair front fringe */}
          <mesh position={[0.04, 0.08, -0.1]} rotation={[0.3, -0.3, 0]} castShadow>
            <sphereGeometry args={[0.06, 12, 8]} />
            <meshStandardMaterial color={HAIR} roughness={0.85} />
          </mesh>
          {/* Sideburns */}
          <mesh position={[-0.12, -0.02, 0.01]} castShadow>
            <sphereGeometry args={[0.035, 12, 8]} />
            <meshStandardMaterial color={HAIR} />
          </mesh>
          <mesh position={[0.12, -0.02, 0.01]} castShadow>
            <sphereGeometry args={[0.035, 12, 8]} />
            <meshStandardMaterial color={HAIR} />
          </mesh>

          {/* Ears */}
          <mesh position={[-0.135, -0.005, 0]} rotation={[0, 0, 0.1]}>
            <sphereGeometry args={[0.024, 12, 8]} />
            <meshStandardMaterial color={SKIN} />
          </mesh>
          <mesh position={[0.135, -0.005, 0]} rotation={[0, 0, -0.1]}>
            <sphereGeometry args={[0.024, 12, 8]} />
            <meshStandardMaterial color={SKIN} />
          </mesh>

          {/* === FACE (faces -z) === */}
          {/* Eyebrows */}
          <mesh position={[-0.045, 0.04, -0.12]} rotation={[0, 0, -0.08]}>
            <boxGeometry args={[0.035, 0.008, 0.005]} />
            <meshStandardMaterial color={HAIR} />
          </mesh>
          <mesh position={[0.045, 0.04, -0.12]} rotation={[0, 0, 0.08]}>
            <boxGeometry args={[0.035, 0.008, 0.005]} />
            <meshStandardMaterial color={HAIR} />
          </mesh>
          {/* Eyes — simple dots for stylized look */}
          <mesh position={[-0.045, 0.01, -0.125]}>
            <sphereGeometry args={[0.014, 12, 8]} />
            <meshStandardMaterial color={sleeping ? SKIN_SHADE : "#1a0e0a"} />
          </mesh>
          <mesh position={[0.045, 0.01, -0.125]}>
            <sphereGeometry args={[0.014, 12, 8]} />
            <meshStandardMaterial color={sleeping ? SKIN_SHADE : "#1a0e0a"} />
          </mesh>
          {/* Glasses */}
          <mesh position={[-0.045, 0.01, -0.13]} rotation={[0, Math.PI, 0]}>
            <ringGeometry args={[0.022, 0.028, 18]} />
            <meshBasicMaterial color="#1a0e0a" />
          </mesh>
          <mesh position={[0.045, 0.01, -0.13]} rotation={[0, Math.PI, 0]}>
            <ringGeometry args={[0.022, 0.028, 18]} />
            <meshBasicMaterial color="#1a0e0a" />
          </mesh>
          <mesh position={[0, 0.01, -0.13]}>
            <boxGeometry args={[0.018, 0.004, 0.004]} />
            <meshStandardMaterial color="#1a0e0a" />
          </mesh>
          {/* Nose */}
          <mesh position={[0, -0.012, -0.13]} castShadow>
            <coneGeometry args={[0.018, 0.04, 8]} rotation={[Math.PI/2, 0, 0]} />
            <meshStandardMaterial color={SKIN} />
          </mesh>
          {/* Mouth */}
          <mesh position={[0, -0.065, -0.125]}>
            <boxGeometry args={[0.038, 0.006, 0.004]} />
            <meshStandardMaterial color="#5a2818" />
          </mesh>
          {/* Beard stubble */}
          <mesh position={[0, -0.06, -0.06]} rotation={[Math.PI, 0, 0]} castShadow>
            <sphereGeometry args={[0.095, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.32]} />
            <meshStandardMaterial color="#2a1410" roughness={1} transparent opacity={0.45} />
          </mesh>
        </group>

        {/* === ARMS (rotate around shoulder) === */}
        <group ref={armLRef} position={[-0.22, 0.42, 0]}>
          {/* Upper arm */}
          <RoundedBox args={[0.085, 0.22, 0.1]} radius={0.04} position={[0, -0.11, 0]} castShadow>
            <meshStandardMaterial color={SHIRT} />
          </RoundedBox>
          {/* Forearm — skin colored (short sleeve t-shirt) */}
          <RoundedBox args={[0.07, 0.22, 0.085]} radius={0.035} position={[0, -0.32, 0]} castShadow>
            <meshStandardMaterial color={SKIN} />
          </RoundedBox>
          {/* Hand */}
          <mesh position={[0, -0.45, 0]} castShadow>
            <sphereGeometry args={[0.045, 14, 10]} />
            <meshStandardMaterial color={SKIN} />
          </mesh>
        </group>
        <group ref={armRRef} position={[0.22, 0.42, 0]}>
          <RoundedBox args={[0.085, 0.22, 0.1]} radius={0.04} position={[0, -0.11, 0]} castShadow>
            <meshStandardMaterial color={SHIRT} />
          </RoundedBox>
          <RoundedBox args={[0.07, 0.22, 0.085]} radius={0.035} position={[0, -0.32, 0]} castShadow>
            <meshStandardMaterial color={SKIN} />
          </RoundedBox>
          <mesh position={[0, -0.45, 0]} castShadow>
            <sphereGeometry args={[0.045, 14, 10]} />
            <meshStandardMaterial color={SKIN} />
          </mesh>
        </group>

        {/* === LEGS === */}
        {sitting && (
          <>
            <group position={[-0.085, -0.05, 0]}>
              {/* Thigh forward */}
              <RoundedBox args={[0.115, 0.12, 0.36]} radius={0.05} position={[0, 0, -0.18]} castShadow>
                <meshStandardMaterial color={PANTS} />
              </RoundedBox>
              {/* Shin down */}
              <RoundedBox args={[0.1, 0.4, 0.1]} radius={0.04} position={[0, -0.26, -0.36]} castShadow>
                <meshStandardMaterial color={PANTS} />
              </RoundedBox>
              {/* Sneaker */}
              <RoundedBox args={[0.12, 0.06, 0.2]} radius={0.025} position={[0, -0.48, -0.42]} castShadow>
                <meshStandardMaterial color={SHOES} />
              </RoundedBox>
              <mesh position={[0, -0.45, -0.32]}>
                <boxGeometry args={[0.12, 0.015, 0.04]} />
                <meshBasicMaterial color={"#58a6ff"} toneMapped={false} />
              </mesh>
            </group>
            <group position={[0.085, -0.05, 0]}>
              <RoundedBox args={[0.115, 0.12, 0.36]} radius={0.05} position={[0, 0, -0.18]} castShadow>
                <meshStandardMaterial color={PANTS} />
              </RoundedBox>
              <RoundedBox args={[0.1, 0.4, 0.1]} radius={0.04} position={[0, -0.26, -0.36]} castShadow>
                <meshStandardMaterial color={PANTS} />
              </RoundedBox>
              <RoundedBox args={[0.12, 0.06, 0.2]} radius={0.025} position={[0, -0.48, -0.42]} castShadow>
                <meshStandardMaterial color={SHOES} />
              </RoundedBox>
              <mesh position={[0, -0.45, -0.32]}>
                <boxGeometry args={[0.12, 0.015, 0.04]} />
                <meshBasicMaterial color={"#58a6ff"} toneMapped={false} />
              </mesh>
            </group>
          </>
        )}
        {activity.id === "gym" && (
          <>
            <RoundedBox args={[0.115, 0.45, 0.12]} radius={0.04} position={[-0.085, -0.3, 0]} castShadow>
              <meshStandardMaterial color={PANTS} />
            </RoundedBox>
            <RoundedBox args={[0.115, 0.45, 0.12]} radius={0.04} position={[0.085, -0.3, 0]} castShadow>
              <meshStandardMaterial color={PANTS} />
            </RoundedBox>
            <RoundedBox args={[0.13, 0.06, 0.2]} radius={0.025} position={[-0.085, -0.55, 0.04]} castShadow>
              <meshStandardMaterial color={SHOES} />
            </RoundedBox>
            <RoundedBox args={[0.13, 0.06, 0.2]} radius={0.025} position={[0.085, -0.55, 0.04]} castShadow>
              <meshStandardMaterial color={SHOES} />
            </RoundedBox>
          </>
        )}
        {sleeping && (
          <>
            <RoundedBox args={[0.115, 0.7, 0.12]} radius={0.04} position={[-0.085, -0.4, 0]} castShadow>
              <meshStandardMaterial color={PANTS} />
            </RoundedBox>
            <RoundedBox args={[0.115, 0.7, 0.12]} radius={0.04} position={[0.085, -0.4, 0]} castShadow>
              <meshStandardMaterial color={PANTS} />
            </RoundedBox>
          </>
        )}
      </group>

      {/* Activity props */}
      {sleeping && (
        <Float speed={1.2} floatIntensity={0.5}>
          <Html position={[0.25, 0.8, 0.1]} center distanceFactor={6} occlude>
            <div style={{ fontSize: 18, color: "#79c0ff", opacity: 0.85 }}>💤</div>
          </Html>
        </Float>
      )}
      {activity.id === "lunch" && (
        <mesh position={[0, 0.82, -0.45]} castShadow>
          <boxGeometry args={[0.25, 0.04, 0.18]} />
          <meshStandardMaterial color="#fbbf24" />
        </mesh>
      )}
      {activity.id === "gym" && (
        <group position={[0, 1.4, 0]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.5, 12]} />
            <meshStandardMaterial color="#3a2a55" metalness={0.8} />
          </mesh>
          {[-0.25, 0.25].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.09, 0.1, 16]} />
              <meshStandardMaterial color="#1a1326" />
            </mesh>
          ))}
        </group>
      )}
      {activity.id === "ps5" && (
        <mesh position={[0, 0.85, -0.3]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.18, 0.04, 0.08]} />
          <meshStandardMaterial color="#0c0712" metalness={0.6} />
        </mesh>
      )}

      {/* Status pill */}
      <Html position={[0, sleeping ? 0.85 : (activity.id === "gym" ? 1.7 : 1.55), 0]} center distanceFactor={6} occlude>
        <div style={{
          padding: "3px 10px",
          borderRadius: 10,
          background: activity.color,
          color: "white",
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: "nowrap",
          fontFamily: "system-ui",
          boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}>
          <span>{activity.icon}</span>
          <span>{activity.label}</span>
        </div>
      </Html>
    </group>
  )
}

// Compute current activity based on IST hour
function getActivity() {
  const now = new Date()
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const h = ist.getHours()
  const dow = ist.getDay() // 0=Sun, 6=Sat

  // Weekend schedule
  if (dow === 0 || dow === 6) {
    if (h < 9)  return { id: 'sleep',   label: 'Sleeping in',      icon: '💤', color: 'rgba(91, 70, 130, 0.9)' }
    if (h < 12) return { id: 'coffee',  label: 'Lazy morning ☕',  icon: '☀️', color: 'rgba(245, 158, 11, 0.9)' }
    if (h < 14) return { id: 'lunch',   label: 'Brunch',           icon: '🍳', color: 'rgba(34, 197, 94, 0.9)' }
    if (h < 18) return { id: 'gym',     label: 'Out · cricket / beach', icon: '🌴', color: 'rgba(236, 72, 153, 0.9)' }
    if (h < 22) return { id: 'ps5',     label: 'PS5 / chill',      icon: '🎮', color: 'rgba(59, 130, 246, 0.9)' }
    return            { id: 'sleep',   label: 'Winding down',     icon: '🌙', color: 'rgba(91, 70, 130, 0.9)' }
  }

  // Weekday schedule
  if (h < 7)  return { id: 'sleep',  label: 'Sleeping',          icon: '💤', color: 'rgba(91, 70, 130, 0.9)' }
  if (h < 9)  return { id: 'coffee', label: 'Morning coffee ☕', icon: '☀️', color: 'rgba(245, 158, 11, 0.9)' }
  if (h < 13) return { id: 'work',   label: 'Deep work',          icon: '💻', color: 'rgba(139, 92, 246, 0.9)' }
  if (h < 14) return { id: 'lunch',  label: 'Lunch break',        icon: '🍱', color: 'rgba(34, 197, 94, 0.9)' }
  if (h < 19) return { id: 'work',   label: 'Coding',             icon: '💻', color: 'rgba(139, 92, 246, 0.9)' }
  if (h < 21) return { id: 'gym',    label: 'At the gym',         icon: '🏋️', color: 'rgba(236, 72, 153, 0.9)' }
  return            { id: 'ps5',    label: 'PS5 time',           icon: '🎮', color: 'rgba(59, 130, 246, 0.9)' }
}

// ─── GuestbookWall — fetches notes from Supabase, displays as sticky notes ─
function GuestbookWall() {
  const [notes, setNotes] = React.useState([])
  React.useEffect(() => {
    // Lazy import supabase to avoid circular
    import('../lib/supabase').then(({ default: supabase }) => {
      supabase.from('guestbook')
        .select('id,name,message,created_at')
        .order('created_at', { ascending: false })
        .limit(15)
        .then(({ data }) => {
          if (data) setNotes(data)
        })
      // Subscribe to inserts for live updates
      const ch = supabase.channel('workspace-guestbook')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guestbook' }, (payload) => {
          setNotes(n => [payload.new, ...n].slice(0, 15))
        })
        .subscribe()
      return () => { supabase.removeChannel(ch) }
    })
  }, [])

  const colors = ['#fde047', '#f97316', '#3fb950', '#58a6ff', '#22c55e', '#3b82f6']
  // 5x3 grid layout
  const positions = []
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      positions.push([-0.55 + col * 0.28, 0.32 - row * 0.32, 0])
    }
  }

  return (
    <group>
      {/* Corkboard backing */}
      <RoundedBox args={[1.6, 1.1, 0.04]} radius={0.02}>
        <meshStandardMaterial color="#3a2a18" roughness={0.95} />
      </RoundedBox>
      {/* Title strip */}
      <mesh position={[0, 0.62, 0.025]}>
        <planeGeometry args={[1.5, 0.1]} />
        <meshBasicMaterial color="#1a1326" />
      </mesh>
      <Html position={[0, 0.62, 0.03]} transform occlude scale={0.05}>
        <div style={{ color: '#fde047', fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, whiteSpace: 'nowrap' }}>
          📌 Guestbook · drop a note
        </div>
      </Html>
      {/* Sticky notes */}
      {notes.slice(0, 15).map((n, i) => {
        if (!positions[i]) return null
        const [x, y, z] = positions[i]
        const rot = ((i * 13) % 7 - 3) * 0.05 // small varied tilt
        const color = colors[i % colors.length]
        return (
          <group key={n.id || i} position={[x, y, z + 0.025]} rotation={[0, 0, rot]}>
            <mesh castShadow>
              <planeGeometry args={[0.24, 0.24]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
            {/* pin */}
            <mesh position={[0, 0.1, 0.005]}>
              <circleGeometry args={[0.012, 12]} />
              <meshBasicMaterial color="#ef4444" toneMapped={false} />
            </mesh>
            <Html position={[0, 0, 0.005]} transform occlude scale={0.025} center>
              <div style={{ width: 200, padding: 8, color: '#1a1326', fontFamily: 'ui-rounded, system-ui', fontSize: 14, lineHeight: 1.2, textAlign: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 10, marginBottom: 2 }}>— {n.name?.slice(0, 14) || 'anon'}</div>
                <div style={{ fontSize: 11 }}>{(n.message || '').slice(0, 80)}</div>
              </div>
            </Html>
          </group>
        )
      })}
      {/* Empty state */}
      {notes.length === 0 && (
        <Html position={[0, 0, 0.03]} transform occlude scale={0.04} center>
          <div style={{ color: '#94a3b8', fontFamily: 'ui-monospace, monospace', fontSize: 13, fontStyle: 'italic' }}>
            no notes yet — be the first 👋
          </div>
        </Html>
      )}
    </group>
  )
}

// ─── Sticky note form (overlay) ──────────────────────────────────────
function StickyNoteForm({ onClose }) {
  const [name, setName]       = React.useState(() => localStorage.getItem('ws:name') || '')
  const [message, setMessage] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [done, setDone]       = React.useState(false)
  const [error, setError]     = React.useState('')

  const submit = async () => {
    const n = name.trim().slice(0, 24)
    const m = message.trim().slice(0, 80)
    if (!m) { setError('Write something first'); return }
    setSubmitting(true)
    setError('')
    try {
      const { default: supabase } = await import('../lib/supabase')
      const { error: err } = await supabase.from('guestbook').insert({ name: n || 'anon', message: m })
      if (err) throw err
      localStorage.setItem('ws:name', n)
      setDone(true)
      setTimeout(onClose, 1500)
    } catch (e) {
      setError(e.message || 'Failed to post')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center px-4 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative max-w-md w-full bg-card pr-tint-magenta p-5 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 mb-3">
          <div className="text-2xl">📌</div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Drop a sticky note</p>
            <p className="text-[11px] text-muted-foreground">Goes up on the cork board for everyone</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
        </div>

        {done ? (
          <div className="py-4 text-center">
            <div className="text-3xl mb-2">✓</div>
            <p className="text-sm font-semibold text-foreground">Posted to the wall!</p>
            <p className="text-[11px] text-muted-foreground mt-1">Look at the cork board</p>
          </div>
        ) : (
          <>
            <input
              type="text" placeholder="Your name (or leave blank for anon)" maxLength={24}
              value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-background border border-border/40 rounded-md px-3 py-2 text-xs outline-none focus:border-blue-500/60 mb-2"
            />
            <textarea
              placeholder="Hello from… / Loved the site / Drop a thought…" maxLength={80} rows={3}
              value={message} onChange={e => setMessage(e.target.value)}
              className="w-full bg-background border border-border/40 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500/60 resize-none mb-2"
            />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] text-muted-foreground">{message.length}/80</span>
              {error && <span className="text-[10px] text-red-400">{error}</span>}
            </div>
            <button
              onClick={submit} disabled={submitting || !message.trim()}
              className="w-full py-2 rounded-md text-sm font-semibold transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, oklch(60% 0.22 290), oklch(60% 0.25 320))',
                color: 'white',
                boxShadow: '0 4px 20px -4px color-mix(in oklab, var(--chart-1) 60%, transparent)',
              }}>
              {submitting ? 'Pinning…' : 'Pin to wall'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

