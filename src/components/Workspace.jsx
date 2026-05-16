import React, { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Html, Float, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================
// WORKSPACE — A 3D interactive desk scene
// Items glow violet on hover and open site sections on click.
// ============================================================

const VIOLET = '#a78bfa'
const MAGENTA = '#ec4899'
const CORAL = '#f97316'

const HOTSPOTS = [
  { id: 'projects',  label: 'Open projects',     hint: 'walk to the laptop',     pos: [-1.05, 0, 0.25] },
  { id: 'about',     label: 'About me',          hint: 'talk to me at the desk', pos: [0.6, 0, 1.2] },
  { id: 'tech',      label: 'Tech stack',        hint: 'walk to the whiteboard', pos: [0.2, 0, -2.0] },
  { id: 'travel',    label: 'Where I\'ve been',  hint: 'walk to the poster',     pos: [1.7, 0, -2.0] },
  { id: 'connect',   label: 'Contact',           hint: 'pick up the phone',      pos: [1.05, 0, -0.05] },
  { id: 'terminal',  label: 'Terminal',          hint: 'use the keyboard',       pos: [-0.05, 0, 0.45] },
  { id: 'fitness',   label: 'Transformation HQ', hint: 'pick up the dumbbell',   pos: [-1.7, 0, 1.4] },
  { id: 'stranger',  label: 'Stranger chat',     hint: 'wear the headphones',    pos: [-0.6, 0, -0.65] },
]

export default function Workspace({ onBack }) {
  const [hovered, setHovered] = useState(null)
  const [hint, setHint] = useState('Click PLAY to enter the room')
  const [isDay, setIsDay] = useState(false)
  const [gameMode, setGameMode] = useState(false) // false = orbit/click, true = WASD walk
  const [near, setNear] = useState(null)          // hotspot id player is near
  const [chatOpen, setChatOpen] = useState(false) // "me" NPC dialog

  const nav = (id) => {
    if (id === 'fitness')  { window.location.hash = '#/transformation'; window.location.reload(); return }
    if (id === 'stranger') { window.location.hash = '#/stranger'; window.location.reload(); return }
    if (id === 'terminal') { window.location.hash = ''; window.location.reload(); setTimeout(() => document.getElementById('terminal')?.scrollIntoView({ behavior: 'smooth' }), 100); return }
    if (id === 'about' && gameMode) { setChatOpen(true); return }
    window.location.hash = ''
    sessionStorage.setItem('scrollTo', id)
    window.location.reload()
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
          gl={{ antialias: true, alpha: true }}
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
            <Environment preset={isDay ? 'sunset' : 'city'} environmentIntensity={isDay ? 0.5 : 0.25} />
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
      {/* Lighting */}
      <ambientLight intensity={isDay ? 0.6 : 0.35} />
      <directionalLight
        position={[5, 8, 3]}
        intensity={isDay ? 1.2 : 0.45}
        color={isDay ? '#fff4e0' : '#c4b5fd'}
        castShadow
        shadow-mapSize={[2048, 2048]}
      >
        <orthographicCamera attach="shadow-camera" args={[-5, 5, 5, -5]} />
      </directionalLight>
      {!isDay && (
        <>
          <pointLight position={[-3, 2, -1]} intensity={0.5} color={VIOLET} />
          <pointLight position={[2, 1.5, 2]} intensity={0.35} color={MAGENTA} />
        </>
      )}
      {/* Desk lamp warm glow (always-on) */}
      <pointLight position={[1.3, 1.5, -0.4]} intensity={isDay ? 0.25 : 0.9} color="#ffb066" distance={3} decay={2} />

      {/* Floor */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color={isDay ? '#2a223a' : '#15101e'} roughness={0.95} metalness={0.05} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.5} scale={10} blur={2.5} far={4} />

      {/* Rug under desk */}
      <mesh position={[0, 0.005, 0.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.5, 2.2]} />
        <meshStandardMaterial color="#3a1f4a" roughness={1} />
      </mesh>

      {/* Back wall + side wall */}
      <mesh position={[0, 2, -2.6]} receiveShadow>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color={isDay ? '#26203a' : '#1a1326'} roughness={0.85} />
      </mesh>
      <mesh position={[-2.6, 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color={isDay ? '#221b34' : '#180f24'} roughness={0.85} />
      </mesh>

      {/* === WINDOW on the side wall === */}
      <Window position={[-2.58, 2.1, -1.0]} isDay={isDay} />

      {/* === DESK === */}
      <RoundedBox args={[3.2, 0.12, 1.6]} radius={0.04} position={[0, 0.7, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#2a1d3f" roughness={0.4} metalness={0.2} />
      </RoundedBox>
      {[[-1.45, 0.35, -0.7], [1.45, 0.35, -0.7], [-1.45, 0.35, 0.7], [1.45, 0.35, 0.7]].map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.08, 0.7, 0.08]} />
          <meshStandardMaterial color="#0c0712" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}

      {/* === CHAIR === */}
      <Chair position={[0.0, 0, 1.7]} />

      {/* === MONITOR on stand — also routes to projects === */}
      <Hotspot id="projects" position={[-0.05, 1.05, -0.5]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <Monitor />
      </Hotspot>

      {/* === LAPTOP (also projects) === */}
      <Hotspot id="projects" position={[-1.05, 0.76, 0.25]} rotation={[0, 0.35, 0]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <Laptop />
      </Hotspot>

      {/* === MECHANICAL KEYBOARD === */}
      <Hotspot id="terminal" position={[-0.05, 0.78, 0.45]} rotation={[0, 0, 0]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <Keyboard />
      </Hotspot>

      {/* === MOUSE === */}
      <mesh position={[0.75, 0.79, 0.45]} castShadow>
        <RoundedBox args={[0.12, 0.04, 0.18]} radius={0.02}>
          <meshStandardMaterial color="#0e0a1a" metalness={0.5} roughness={0.4} />
        </RoundedBox>
      </mesh>

      {/* === DESK LAMP === */}
      <DeskLamp position={[1.3, 0.77, -0.5]} isDay={isDay} />

      {/* === COFFEE MUG === */}
      <Hotspot id="about" position={[0.95, 0.91, 0.4]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <CoffeeMug />
      </Hotspot>

      {/* === PHONE === */}
      <Hotspot id="connect" position={[1.05, 0.78, -0.05]} rotation={[0, -0.5, 0]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <Phone />
      </Hotspot>

      {/* === NOTEBOOK & PEN === */}
      <Notebook position={[-1.05, 0.78, -0.5]} />

      {/* === STACK OF BOOKS === */}
      <BookStack position={[-1.4, 0.78, -0.4]} />

      {/* === SLEEPING CAT === */}
      <Cat position={[0.6, 0.78, -0.55]} />

      {/* === PICTURE FRAME on back wall (about → click frame too) === */}
      <Hotspot id="about" position={[-1.6, 2.0, -2.55]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <PictureFrame />
      </Hotspot>

      {/* === WHITEBOARD === */}
      <Hotspot id="tech" position={[0.2, 2.0, -2.55]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <Whiteboard />
      </Hotspot>

      {/* === TRAVEL POSTER === */}
      <Hotspot id="travel" position={[1.7, 2.0, -2.55]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <TravelPoster />
      </Hotspot>

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
      <Shelf position={[2.0, 2.3, -2.55]} />

      {/* === CLOCK on wall === */}
      <Clock position={[2.0, 3.1, -2.55]} />

      {/* === STICKY NOTES on monitor === */}
      <StickyNotes position={[0.85, 1.4, -0.5]} />

      {/* === FLOATING PARTICLES === */}
      {!isDay && <Particles count={50} />}

      {/* === NPC (sitting "me") + Player + interaction hotzones === */}
      <NPC position={[0.0, 0, 1.7]} visible={true} />
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

// ─── Monitor on a stand with scrolling code ─────────────────────────
function Monitor() {
  const linesRef = useRef()
  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.position.y = -((state.clock.elapsedTime * 0.15) % 1) * 0.8 + 0.4
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
        <meshBasicMaterial color={VIOLET} toneMapped={false} />
      </mesh>
      {/* Code lines (scroll) */}
      <group position={[-0.62, 0, 0.04]} ref={linesRef}>
        {Array.from({ length: 14 }).map((_, i) => (
          <mesh key={i} position={[0.1 + (i % 3) * 0.05, 0.4 - i * 0.07, 0]}>
            <planeGeometry args={[0.5 - (i % 4) * 0.08, 0.022]} />
            <meshBasicMaterial color={i % 4 === 0 ? MAGENTA : i % 4 === 1 ? CORAL : '#c4b5fd'} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* Logo at bottom */}
      <mesh position={[0, -0.55, 0]}>
        <planeGeometry args={[0.06, 0.06]} />
        <meshBasicMaterial color="#c4b5fd" toneMapped={false} />
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
function Shelf({ position }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[1.0, 0.04, 0.2]} />
        <meshStandardMaterial color="#2a1d3f" roughness={0.6} />
      </mesh>
      {/* Mini items on shelf */}
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
      {/* A trophy */}
      <mesh position={[0.1, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.12, 12]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.1, 0.04, 0]} castShadow>
        <boxGeometry args={[0.08, 0.04, 0.06]} />
        <meshStandardMaterial color="#1a1326" />
      </mesh>
      {/* A small cube */}
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
