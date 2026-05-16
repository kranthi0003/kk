import React, { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, AccumulativeShadows, RandomizedLight, Html, Float, RoundedBox, SoftShadows } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================
// WORKSPACE — A 3D interactive desk scene
// Items glow violet on hover and open site sections on click.
// ============================================================

const VIOLET = '#a78bfa'
const MAGENTA = '#ec4899'
const CORAL = '#f97316'

const HOTSPOTS = [
  { id: 'about',     label: 'Talk to me',         hint: 'NPC sitting in chair', pos: [0.6, 0, 1.2] },
  { id: 'guestbook', label: 'Drop a sticky note', hint: 'on the back wall',     pos: [0.0, 0, -1.8] },
  { id: 'fitness',   label: 'Transformation HQ',  hint: 'pick up the dumbbell', pos: [-1.7, 0, 1.4] },
  { id: 'stranger',  label: 'Stranger chat',      hint: 'wear the headphones',  pos: [-0.6, 0, -0.65] },
  // Live items (not navigable — info only)
  { id: 'projects',  label: 'Live GitHub feed',   hint: 'the monitor',          pos: [-0.05, 0, -0.5] },
  { id: 'clock',     label: 'Live IST clock',     hint: 'on the wall',          pos: [2.0, 0, -2.0] },
  // Secrets (hidden — only id-tagged once found)
  { id: 'secret-trophy',  label: '🏆 trophy',     hint: 'examine the shelf',    pos: [2.0, 0, -2.3] },
]

export default function Workspace({ onBack, embedded = false }) {
  const [hovered, setHovered] = useState(null)
  const [hint, setHint] = useState(embedded ? 'Drag to look · click items · or Play for game mode' : 'Click PLAY to enter the room')
  const [isDay, setIsDay] = useState(false)
  const [gameMode, setGameMode] = useState(false)
  const [near, setNear] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)

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
    // Interactions are now self-contained — no more routing to other sections
    if (id === 'about')      { setChatOpen(true); return }
    if (id === 'guestbook')  { setShowStickyForm(true); return }
    if (id === 'fitness')    { window.location.hash = '#/transformation'; window.location.reload(); return }
    if (id === 'stranger')   { window.location.hash = '#/stranger'; window.location.reload(); return }
    // Secrets
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
        {/* Floating controls top-right */}
        <div className="absolute top-3 right-3 z-20 flex gap-2">
          <button
            onClick={() => setGameMode(g => !g)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all"
            style={{
              background: gameMode
                ? 'linear-gradient(135deg, oklch(70% 0.22 145), oklch(65% 0.22 165))'
                : 'linear-gradient(135deg, color-mix(in oklab, var(--chart-1) 32%, transparent), color-mix(in oklab, var(--chart-2) 32%, transparent))',
              color: 'white',
              boxShadow: gameMode ? '0 0 16px -4px oklch(70% 0.22 145)' : '0 0 16px -4px color-mix(in oklab, var(--chart-1) 60%, transparent)',
            }}>
            {gameMode ? '⏸ Exit' : '▶ Play'}
          </button>
          <button
            onClick={() => setIsDay(d => !d)}
            className="flex items-center justify-center w-9 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-all"
            style={{
              background: isDay ? 'color-mix(in oklab, oklch(75% 0.18 60) 18%, transparent)' : 'color-mix(in oklab, var(--chart-1) 12%, transparent)',
              boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${isDay ? 'oklch(75% 0.18 60)' : 'var(--chart-1)'} 40%, transparent)`,
            }}>
            {isDay ? '☀️' : '🌙'}
          </button>
        </div>

        <Canvas
          shadows
          camera={{ position: [3.2, 2.2, 4.0], fov: 45 }}
          gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1, outputColorSpace: THREE.SRGBColorSpace }}
          dpr={[1, 2]}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <color attach="background" args={[isDay ? '#1a1830' : '#0a0612']} />
          <fog attach="fog" args={[isDay ? '#1a1830' : '#0a0612', 8, 18]} />
          <Suspense fallback={null}>
            <Scene onHover={setHovered} onClick={nav} hovered={hovered} isDay={isDay} gameMode={gameMode} onNear={setNear} />
            <Environment preset={isDay ? 'apartment' : 'night'} environmentIntensity={isDay ? 0.7 : 0.35} background={false} />
          </Suspense>
          <OrbitControls
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

        {gameMode && (
          <div className="absolute top-3 left-3 pointer-events-none">
            <div className="px-3 py-2 rounded-xl backdrop-blur-xl"
              style={{ background: 'color-mix(in oklab, var(--color-card) 80%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 30%, transparent)' }}>
              <div className="space-y-0.5 text-[10px] text-muted-foreground font-mono">
                <p><kbd className="px-1 rounded bg-foreground/10 text-foreground">W A S D</kbd> move</p>
                <p><kbd className="px-1 rounded bg-foreground/10 text-foreground">E</kbd> interact · <kbd className="px-1 rounded bg-foreground/10 text-foreground">Esc</kbd> exit</p>
              </div>
            </div>
          </div>
        )}

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
          <StickyNoteForm
            onClose={() => setShowStickyForm(false)}
          />
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
          <button onClick={onBack || (() => { window.location.hash = ''; window.location.reload() })}
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
          gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1, outputColorSpace: THREE.SRGBColorSpace }}
          dpr={[1, 2]}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          <color attach="background" args={[isDay ? '#1a1830' : '#0a0612']} />
          <fog attach="fog" args={[isDay ? '#1a1830' : '#0a0612', 8, 18]} />

          <Suspense fallback={null}>
            <Scene
              onHover={setHovered} onClick={nav} hovered={hovered} isDay={isDay}
              gameMode={gameMode} onNear={setNear}
            />
            <Environment preset={isDay ? 'apartment' : 'night'} environmentIntensity={isDay ? 0.7 : 0.35} background={false} />
          </Suspense>

          <OrbitControls
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
                  { label: '📖 Read my About', go: () => { setChatOpen(false); sessionStorage.setItem('scrollTo', 'about'); window.location.hash = ''; window.location.reload() } },
                  { label: '💼 Experience',    go: () => { setChatOpen(false); sessionStorage.setItem('scrollTo', 'experience'); window.location.hash = ''; window.location.reload() } },
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
      <SoftShadows size={28} samples={12} focus={0.6} />

      {/* Lighting — soft area + accent */}
      <hemisphereLight args={[isDay ? '#e9d8c8' : '#5a3a8a', isDay ? '#4a3a55' : '#1a0f22', isDay ? 0.55 : 0.35]} />
      <ambientLight intensity={isDay ? 0.25 : 0.18} />
      <directionalLight
        position={[5, 7, 3]}
        intensity={isDay ? 1.4 : 0.5}
        color={isDay ? '#ffe6c0' : '#c4b5fd'}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0002}
        shadow-radius={6}
      >
        <orthographicCamera attach="shadow-camera" args={[-5, 5, 5, -5, 0.1, 20]} />
      </directionalLight>
      {!isDay && (
        <>
          <pointLight position={[-3, 2, -1]} intensity={0.45} color="#8b5cf6" distance={6} decay={2} />
          <pointLight position={[2, 1.5, 2]} intensity={0.3} color="#ec4899" distance={6} decay={2} />
        </>
      )}
      <pointLight position={[1.3, 1.5, -0.4]} intensity={isDay ? 0.3 : 1.0} color="#ffb066" distance={3.5} decay={2} castShadow shadow-mapSize={[512, 512]} />

      {/* Floor — dark wood with subtle sheen */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshPhysicalMaterial
          color={isDay ? '#2a2335' : '#13101c'}
          roughness={0.7} metalness={0.0}
          clearcoat={0.3} clearcoatRoughness={0.8}
        />
      </mesh>
      <ContactShadows position={[0, 0.002, 0]} opacity={0.65} scale={10} blur={3.2} far={4} resolution={1024} />

      {/* Rug under desk */}
      <mesh position={[0, 0.005, 0.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.5, 2.2]} />
        <meshStandardMaterial color="#2d1838" roughness={1} />
      </mesh>

      {/* Back wall + side wall — slight texture */}
      <mesh position={[0, 2, -2.6]} receiveShadow>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color={isDay ? '#2a2538' : '#19142a'} roughness={0.92} />
      </mesh>
      <mesh position={[-2.6, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color={isDay ? '#252035' : '#161028'} roughness={0.92} />
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

      {/* === CHAIR === */}
      <Chair position={[0.0, 0, 1.7]} />

      {/* === MONITOR on stand — also routes to projects === */}
      <Hotspot id="projects" position={[-0.05, 1.05, -0.5]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <Monitor />
      </Hotspot>

      {/* === LAPTOP — decorative (monitor is the live one) === */}
      <group position={[-1.05, 0.76, 0.25]} rotation={[0, 0.35, 0]}>
        <Laptop />
      </group>

      {/* === MECHANICAL KEYBOARD — decorative === */}
      <group position={[-0.05, 0.78, 0.45]}>
        <Keyboard />
      </group>

      {/* === MOUSE === */}
      <mesh position={[0.75, 0.79, 0.45]} castShadow>
        <RoundedBox args={[0.12, 0.04, 0.18]} radius={0.02}>
          <meshStandardMaterial color="#0e0a1a" metalness={0.5} roughness={0.4} />
        </RoundedBox>
      </mesh>

      {/* === DESK LAMP === */}
      <DeskLamp position={[1.3, 0.77, -0.5]} isDay={isDay} />

      {/* === PHONE — decorative === */}
      <group position={[1.05, 0.78, -0.05]} rotation={[0, -0.5, 0]}>
        <Phone />
      </group>

      {/* === COFFEE MUG — decorative === */}
      <group position={[0.95, 0.91, 0.4]}>
        <CoffeeMug />
      </group>

      {/* === NOTEBOOK & PEN === */}
      <Notebook position={[-1.05, 0.78, -0.5]} />

      {/* === STACK OF BOOKS === */}
      <BookStack position={[-1.4, 0.78, -0.4]} />

      {/* === SLEEPING CAT === */}
      <Cat position={[0.6, 0.78, -0.55]} />

      {/* === PICTURE FRAME — decorative === */}
      <group position={[-1.6, 2.0, -2.55]}>
        <PictureFrame />
      </group>

      {/* === GUESTBOOK WALL (replaces whiteboard) === */}
      <Hotspot id="guestbook" position={[0.2, 2.0, -2.55]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <GuestbookWall />
      </Hotspot>

      {/* === TRAVEL POSTER — decorative === */}
      <group position={[1.7, 2.0, -2.55]}>
        <TravelPoster />
      </group>

      {/* === DUMBBELL (fitness) on the floor === */}
      <Hotspot id="fitness" position={[-1.7, 0.18, 1.4]} rotation={[0, 0.3, 0]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <Dumbbell />
      </Hotspot>

      {/* === HEADPHONES on desk (stranger chat) === */}
      <Hotspot id="stranger" position={[-0.6, 0.84, -0.65]} rotation={[0, 0.5, 0]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <Headphones />
      </Hotspot>

      {/* === PLANT on floor === */}
      <Plant position={[2.0, 0, -1.7]} />

      {/* === SHELF on back wall with mini items === */}
      <Shelf position={[2.0, 2.3, -2.55]} onHover={onHover} onClick={onClick} hovered={hovered} />

      {/* === CLOCK on wall === */}
      <Clock position={[2.0, 3.1, -2.55]} />

      {/* === STICKY NOTES on monitor === */}
      <StickyNotes position={[0.85, 1.4, -0.5]} />

      {/* === FLOATING PARTICLES === */}
      {!isDay && <Particles count={50} />}

      {/* === NPC (sitting "me") + Player + interaction hotzones === */}
      <Hotspot id="about" position={[0.0, 0, 1.7]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <NPC visible={true} />
      </Hotspot>
      {gameMode && <Player onNear={onNear} hotspots={HOTSPOTS} />}
    </group>
  )
}

// ─── Window with day/night sky ──────────────────────────────────────
function Window({ position, isDay }) {
  return (
    <group position={position} rotation={[0, Math.PI / 2, 0]}>
      {/* Frame */}
      <RoundedBox args={[2.0, 1.6, 0.08]} radius={0.02}>
        <meshStandardMaterial color="#1a1326" />
      </RoundedBox>
      {/* Cross frame */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.04, 1.5, 0.02]} />
        <meshStandardMaterial color="#0c0712" />
      </mesh>
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[1.9, 0.04, 0.02]} />
        <meshStandardMaterial color="#0c0712" />
      </mesh>
      {/* Sky behind */}
      <mesh position={[0, 0, -0.04]}>
        <planeGeometry args={[1.9, 1.5]} />
        <meshBasicMaterial color={isDay ? '#ffd089' : '#1a0a40'} toneMapped={false} />
      </mesh>
      {/* Sun / moon */}
      <mesh position={[0.4, 0.3, -0.03]}>
        <circleGeometry args={[0.18, 32]} />
        <meshBasicMaterial color={isDay ? '#fff4b0' : '#e0d8ff'} toneMapped={false} />
      </mesh>
      {/* "Stars" at night */}
      {!isDay && Array.from({ length: 12 }).map((_, i) => {
        const x = (Math.random() - 0.5) * 1.8
        const y = (Math.random() - 0.5) * 1.4
        return (
          <mesh key={i} position={[x, y, -0.03]}>
            <circleGeometry args={[0.008, 8]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        )
      })}
      {/* City silhouette at bottom */}
      <mesh position={[0, -0.6, -0.02]}>
        <planeGeometry args={[1.9, 0.4]} />
        <meshBasicMaterial color="#0a0612" toneMapped={false} />
      </mesh>
      {/* Tiny lit windows in silhouette */}
      {Array.from({ length: 14 }).map((_, i) => (
        <mesh key={i} position={[-0.9 + i * 0.14, -0.55 + (i % 3) * 0.05, -0.015]}>
          <planeGeometry args={[0.025, 0.04]} />
          <meshBasicMaterial color={isDay ? '#3a2a55' : '#ffd16a'} toneMapped={false} />
        </mesh>
      ))}
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
        <div style={{ color: '#a78bfa', fontFamily: 'ui-monospace, monospace', fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap' }}>
          ● github.com/kranthi0003 — live
        </div>
      </Html>
      {/* Scrolling commits */}
      <group position={[-0.7, 0, 0.045]} ref={linesRef}>
        {commits.map((c, i) => (
          <Html key={i} position={[0, 0.3 - i * 0.06, 0]} transform occlude scale={0.03} rotation={[0, 0, 0]}>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 16, whiteSpace: 'nowrap', display: 'flex', gap: 8 }}>
              <span style={{ color: '#ec4899' }}>$</span>
              <span style={{ color: '#94a3b8' }}>{c.repo}</span>
              <span style={{ color: '#e2e8f0' }}>{c.msg}</span>
            </div>
          </Html>
        ))}
        {commits.length === 0 && (
          [0.22, 0.13, 0.04, -0.05, -0.14, -0.23].map((y, i) => (
            <mesh key={i} position={[0, y, 0]}>
              <planeGeometry args={[0.5 - (i % 3) * 0.08, 0.022]} />
              <meshBasicMaterial color={i % 3 === 0 ? MAGENTA : '#c4b5fd'} toneMapped={false} />
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
            <meshBasicMaterial color={i % 3 === 0 ? MAGENTA : '#c4b5fd'} toneMapped={false} />
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
        <meshBasicMaterial color="#ec4899" toneMapped={false} />
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
          <meshBasicMaterial color="#c4b5fd" transparent opacity={0.7} toneMapped={false} />
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
          <meshBasicMaterial color="#7c3aed" toneMapped={false} />
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
          <meshBasicMaterial color="#c4b5fd" />
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
    <group position={position} rotation={[0, Math.PI, 0]}>
      {/* Seat */}
      <RoundedBox args={[0.7, 0.08, 0.65]} radius={0.02} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial color="#1a1326" roughness={0.7} />
      </RoundedBox>
      {/* Back */}
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

// ─── Wall clock with live time ──────────────────────────────────────
function Clock({ position }) {
  const minRef = useRef()
  const hrRef  = useRef()
  useFrame(() => {
    const now = new Date()
    const m = now.getMinutes() + now.getSeconds() / 60
    const h = (now.getHours() % 12) + m / 60
    if (minRef.current) minRef.current.rotation.z = -(m / 60) * Math.PI * 2
    if (hrRef.current)  hrRef.current.rotation.z = -(h / 12) * Math.PI * 2
  })
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.04, 32]} />
        <meshStandardMaterial color="#1a1326" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.022]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.16, 32]} />
        <meshBasicMaterial color="#f4f1e8" />
      </mesh>
      {/* hour ticks */}
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0.025]}>
            <planeGeometry args={[0.01, 0.02]} />
            <meshBasicMaterial color="#1a1326" />
          </mesh>
        )
      })}
      {/* Hour hand */}
      <mesh ref={hrRef} position={[0, 0, 0.026]}>
        <planeGeometry args={[0.012, 0.16]} />
        <meshBasicMaterial color="#1a1326" />
      </mesh>
      {/* Minute hand */}
      <mesh ref={minRef} position={[0, 0, 0.027]}>
        <planeGeometry args={[0.008, 0.22]} />
        <meshBasicMaterial color={VIOLET} toneMapped={false} />
      </mesh>
      {/* Center pin */}
      <mesh position={[0, 0, 0.028]}>
        <circleGeometry args={[0.012, 16]} />
        <meshBasicMaterial color={VIOLET} toneMapped={false} />
      </mesh>
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

// ─── Hotspot wrapper: highlights on hover, clickable ────────────────
function Hotspot({ id, position, rotation, children, onHover, onClick, hovered }) {
  const ref = useRef()
  const isHover = hovered === id

  useFrame((_, dt) => {
    if (ref.current) {
      const target = isHover ? 1.06 : 1
      const cur = ref.current.scale.x
      const next = cur + (target - cur) * dt * 10
      ref.current.scale.setScalar(next)
    }
  })

  return (
    <group
      position={position}
      rotation={rotation}
      ref={ref}
      onPointerOver={(e) => { e.stopPropagation(); onHover(id); document.body.style.cursor = 'pointer' }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(null); document.body.style.cursor = 'auto' }}
      onClick={(e) => { e.stopPropagation(); onClick(id) }}
    >
      {children}
      {/* glow ring */}
      {isHover && (
        <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.35, 0.42, 32]} />
          <meshBasicMaterial color={VIOLET} transparent opacity={0.5} toneMapped={false} />
        </mesh>
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
  const legLRef   = useRef()
  const legRRef   = useRef()
  const armLRef   = useRef()
  const armRRef   = useRef()
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
    // Walk-cycle animation
    const t = state.clock.elapsedTime * 8 * (speed.current > 0.1 ? speed.current : 1)
    if (speed.current > 0.1) {
      const swing = Math.sin(t) * 0.5
      if (legLRef.current) legLRef.current.rotation.x =  swing
      if (legRRef.current) legRRef.current.rotation.x = -swing
      if (armLRef.current) armLRef.current.rotation.x = -swing * 0.7
      if (armRRef.current) armRRef.current.rotation.x =  swing * 0.7
      playerRef.current.position.y = 0.01 + Math.abs(Math.sin(t)) * 0.04
    } else {
      if (legLRef.current) legLRef.current.rotation.x *= 0.85
      if (legRRef.current) legRRef.current.rotation.x *= 0.85
      if (armLRef.current) armLRef.current.rotation.x *= 0.85
      if (armRRef.current) armRRef.current.rotation.x *= 0.85
      playerRef.current.position.y = 0
    }

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
      {/* Body */}
      <RoundedBox args={[0.34, 0.5, 0.22]} radius={0.05} position={[0, 0.6, 0]} castShadow>
        <meshStandardMaterial color="#8b5cf6" roughness={0.5} />
      </RoundedBox>
      {/* Head */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshStandardMaterial color="#fdbae0" roughness={0.6} />
      </mesh>
      {/* Hair cap */}
      <mesh position={[0, 1.13, 0]} castShadow>
        <sphereGeometry args={[0.17, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1a1326" roughness={0.7} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.05, 1.06, 0.14]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#0a0612" />
      </mesh>
      <mesh position={[0.05, 1.06, 0.14]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#0a0612" />
      </mesh>
      {/* Arms */}
      <group ref={armLRef} position={[-0.21, 0.78, 0]}>
        <RoundedBox args={[0.08, 0.4, 0.1]} radius={0.03} position={[0, -0.2, 0]} castShadow>
          <meshStandardMaterial color="#7c3aed" />
        </RoundedBox>
      </group>
      <group ref={armRRef} position={[0.21, 0.78, 0]}>
        <RoundedBox args={[0.08, 0.4, 0.1]} radius={0.03} position={[0, -0.2, 0]} castShadow>
          <meshStandardMaterial color="#7c3aed" />
        </RoundedBox>
      </group>
      {/* Legs */}
      <group ref={legLRef} position={[-0.09, 0.34, 0]}>
        <RoundedBox args={[0.1, 0.4, 0.1]} radius={0.03} position={[0, -0.2, 0]} castShadow>
          <meshStandardMaterial color="#1c1530" />
        </RoundedBox>
      </group>
      <group ref={legRRef} position={[0.09, 0.34, 0]}>
        <RoundedBox args={[0.1, 0.4, 0.1]} radius={0.03} position={[0, -0.2, 0]} castShadow>
          <meshStandardMaterial color="#1c1530" />
        </RoundedBox>
      </group>
      {/* Player nameplate */}
      <Html position={[0, 1.5, 0]} center distanceFactor={6}>
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

// ─── NPC "Me" sitting at desk ──────────────────────────────────────
function NPC({ position }) {
  const headRef = useRef()
  const armRef  = useRef()
  useFrame((state) => {
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.15
    }
    if (armRef.current) {
      armRef.current.rotation.z = -0.4 + Math.sin(state.clock.elapsedTime * 3) * 0.08
    }
  })
  return (
    <group position={position}>
      {/* Body sitting — y 0.7 = seat height */}
      <RoundedBox args={[0.34, 0.5, 0.22]} radius={0.05} position={[0, 0.95, 0.1]} castShadow>
        <meshStandardMaterial color="#0e0a1a" roughness={0.6} />
      </RoundedBox>
      {/* Head */}
      <mesh position={[0, 1.4, 0.1]} ref={headRef} castShadow>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshStandardMaterial color="#fdbae0" roughness={0.6} />
      </mesh>
      {/* Hair cap */}
      <mesh position={[0, 1.48, 0.1]} castShadow>
        <sphereGeometry args={[0.17, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#1a1326" roughness={0.7} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.05, 1.41, 0.24]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#0a0612" />
      </mesh>
      <mesh position={[0.05, 1.41, 0.24]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#0a0612" />
      </mesh>
      {/* Glasses */}
      <mesh position={[-0.05, 1.41, 0.25]}>
        <ringGeometry args={[0.024, 0.032, 16]} />
        <meshBasicMaterial color="#c4b5fd" />
      </mesh>
      <mesh position={[0.05, 1.41, 0.25]}>
        <ringGeometry args={[0.024, 0.032, 16]} />
        <meshBasicMaterial color="#c4b5fd" />
      </mesh>
      {/* Arms reaching forward to "type" */}
      <group ref={armRef} position={[-0.18, 1.1, 0.2]}>
        <RoundedBox args={[0.08, 0.32, 0.1]} radius={0.03} position={[0, -0.16, 0.0]} rotation={[-0.6, 0, 0]} castShadow>
          <meshStandardMaterial color="#0e0a1a" />
        </RoundedBox>
      </group>
      <group position={[0.18, 1.1, 0.2]}>
        <RoundedBox args={[0.08, 0.32, 0.1]} radius={0.03} position={[0, -0.16, 0.0]} rotation={[-0.6, 0, 0]} castShadow>
          <meshStandardMaterial color="#0e0a1a" />
        </RoundedBox>
      </group>
      {/* Legs hanging from chair */}
      <RoundedBox args={[0.1, 0.4, 0.1]} radius={0.03} position={[-0.09, 0.5, 0.0]} castShadow>
        <meshStandardMaterial color="#1c1530" />
      </RoundedBox>
      <RoundedBox args={[0.1, 0.4, 0.1]} radius={0.03} position={[0.09, 0.5, 0.0]} castShadow>
        <meshStandardMaterial color="#1c1530" />
      </RoundedBox>
      {/* Nameplate */}
      <Html position={[0, 1.85, 0.1]} center distanceFactor={6}>
        <div style={{
          padding: '2px 8px',
          borderRadius: 8,
          background: 'rgba(236, 72, 153, 0.85)',
          color: 'white',
          fontSize: 11,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          fontFamily: 'system-ui',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}>Kranthi · click to talk</div>
      </Html>
    </group>
  )
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

  const colors = ['#fde047', '#f97316', '#ec4899', '#a78bfa', '#22c55e', '#3b82f6']
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
              className="w-full bg-background border border-border/40 rounded-md px-3 py-2 text-xs outline-none focus:border-violet-500/60 mb-2"
            />
            <textarea
              placeholder="Hello from… / Loved the site / Drop a thought…" maxLength={80} rows={3}
              value={message} onChange={e => setMessage(e.target.value)}
              className="w-full bg-background border border-border/40 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500/60 resize-none mb-2"
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
