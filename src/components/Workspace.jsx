import React, { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
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
  { id: 'projects',  label: 'Open projects',     hint: 'click the laptop' },
  { id: 'about',     label: 'About me',          hint: 'click the coffee mug' },
  { id: 'tech',      label: 'Tech stack',        hint: 'click the whiteboard' },
  { id: 'travel',    label: 'Where I\'ve been',  hint: 'click the poster' },
  { id: 'connect',   label: 'Contact',           hint: 'click the phone' },
  { id: 'terminal',  label: 'Terminal',          hint: 'click the keyboard' },
  { id: 'fitness',   label: 'Transformation HQ', hint: 'click the dumbbell' },
  { id: 'stranger',  label: 'Stranger chat',     hint: 'click the headphones' },
]

export default function Workspace({ onBack }) {
  const [hovered, setHovered] = useState(null)
  const [hint, setHint] = useState('Drag to look around · scroll to zoom')

  const nav = (id) => {
    if (id === 'fitness')  { window.location.hash = '#/transformation'; window.location.reload(); return }
    if (id === 'stranger') { window.location.hash = '#/stranger'; window.location.reload(); return }
    if (id === 'terminal') { window.location.hash = ''; window.location.reload(); setTimeout(() => document.getElementById('terminal')?.scrollIntoView({ behavior: 'smooth' }), 100); return }
    // Default: navigate back home + scroll to section
    window.location.hash = ''
    sessionStorage.setItem('scrollTo', id)
    window.location.reload()
  }

  useEffect(() => {
    if (hovered) {
      const item = HOTSPOTS.find(h => h.id === hovered)
      setHint(item ? `→ ${item.label}` : '')
    } else {
      setHint('Drag to look around · scroll to zoom')
    }
  }, [hovered])

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
              <span className="text-lg">🖥</span>
              <span>My <span className="text-gradient-violet">Workspace</span></span>
            </h1>
            <p className="text-[10.5px] text-muted-foreground hidden sm:block tracking-wide">Click anything that glows · drag to look around</p>
          </div>
          <div className="w-20 sm:w-28 flex-shrink-0" />
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
          <color attach="background" args={['#0a0612']} />
          <fog attach="fog" args={['#0a0612', 8, 18]} />

          <Suspense fallback={null}>
            <Scene onHover={setHovered} onClick={nav} hovered={hovered} />
            <Environment preset="city" environmentIntensity={0.25} />
          </Suspense>

          <OrbitControls
            target={[0, 0.9, 0]}
            enablePan={false}
            minDistance={3.5}
            maxDistance={8}
            minPolarAngle={Math.PI / 5}
            maxPolarAngle={Math.PI / 2.2}
            autoRotate
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
      </div>
    </div>
  )
}

// ─── Scene ───────────────────────────────────────────────────────────
function Scene({ onHover, onClick, hovered }) {
  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 3]} intensity={0.8} castShadow shadow-mapSize={[2048, 2048]}>
        <orthographicCamera attach="shadow-camera" args={[-5, 5, 5, -5]} />
      </directionalLight>
      <pointLight position={[-3, 2, -1]} intensity={0.4} color={VIOLET} />
      <pointLight position={[2, 1.5, 2]} intensity={0.3} color={MAGENTA} />

      {/* Floor */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#15101e" roughness={0.95} metalness={0.05} />
      </mesh>
      <ContactShadows position={[0, 0.001, 0]} opacity={0.5} scale={10} blur={2.5} far={4} />

      {/* Back wall */}
      <mesh position={[0, 2, -2.6]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#1a1326" roughness={0.85} />
      </mesh>
      <mesh position={[-2.6, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial color="#180f24" roughness={0.85} />
      </mesh>

      {/* Desk */}
      <RoundedBox args={[3.2, 0.12, 1.6]} radius={0.04} position={[0, 0.7, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#2a1d3f" roughness={0.4} metalness={0.2} />
      </RoundedBox>
      {/* Desk legs */}
      {[[-1.45, 0.35, -0.7], [1.45, 0.35, -0.7], [-1.45, 0.35, 0.7], [1.45, 0.35, 0.7]].map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <boxGeometry args={[0.08, 0.7, 0.08]} />
          <meshStandardMaterial color="#0c0712" metalness={0.4} roughness={0.5} />
        </mesh>
      ))}

      {/* === ITEMS === */}

      {/* Laptop — projects */}
      <Hotspot id="projects" position={[-0.6, 0.76, 0.1]} rotation={[0, 0.4, 0]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <group>
          {/* base */}
          <RoundedBox args={[1.1, 0.04, 0.75]} radius={0.02}>
            <meshStandardMaterial color="#1c1530" metalness={0.7} roughness={0.3} />
          </RoundedBox>
          {/* screen */}
          <group position={[0, 0.39, -0.35]} rotation={[-0.35, 0, 0]}>
            <RoundedBox args={[1.1, 0.74, 0.03]} radius={0.02}>
              <meshStandardMaterial color="#0c0814" metalness={0.6} roughness={0.4} />
            </RoundedBox>
            <mesh position={[0, 0, 0.018]}>
              <planeGeometry args={[1.04, 0.66]} />
              <meshStandardMaterial color={VIOLET} emissive={VIOLET} emissiveIntensity={0.65} toneMapped={false} />
            </mesh>
            {/* Fake code lines on screen */}
            {[0.22, 0.13, 0.04, -0.05, -0.14, -0.23].map((y, i) => (
              <mesh key={i} position={[-0.32 + (i % 2) * 0.05, y, 0.02]}>
                <planeGeometry args={[0.4 - (i % 3) * 0.06, 0.018]} />
                <meshBasicMaterial color={i % 3 === 0 ? MAGENTA : '#c4b5fd'} toneMapped={false} />
              </mesh>
            ))}
          </group>
        </group>
      </Hotspot>

      {/* Coffee mug — about */}
      <Hotspot id="about" position={[0.85, 0.91, 0.35]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <group>
          <mesh castShadow>
            <cylinderGeometry args={[0.13, 0.11, 0.22, 24]} />
            <meshStandardMaterial color="#1c1530" roughness={0.5} />
          </mesh>
          {/* coffee surface */}
          <mesh position={[0, 0.105, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 0.01, 24]} />
            <meshStandardMaterial color="#3a2818" emissive="#231410" emissiveIntensity={0.15} />
          </mesh>
          {/* handle */}
          <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.06, 0.018, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#1c1530" roughness={0.5} />
          </mesh>
          {/* steam */}
          <Float speed={2} floatIntensity={0.5}>
            <mesh position={[0, 0.4, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
            </mesh>
          </Float>
        </group>
      </Hotspot>

      {/* Mechanical keyboard — terminal */}
      <Hotspot id="terminal" position={[0.4, 0.78, 0.5]} rotation={[0, -0.1, 0]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <group>
          <RoundedBox args={[1.0, 0.06, 0.36]} radius={0.015}>
            <meshStandardMaterial color="#0e0a1a" metalness={0.4} roughness={0.5} />
          </RoundedBox>
          {/* keys grid */}
          {Array.from({ length: 5 }).map((_, row) =>
            Array.from({ length: 14 }).map((_, col) => (
              <mesh key={`${row}-${col}`} position={[-0.43 + col * 0.066, 0.04, -0.13 + row * 0.06]} castShadow>
                <boxGeometry args={[0.054, 0.03, 0.05]} />
                <meshStandardMaterial color="#1f152e" roughness={0.6} />
              </mesh>
            ))
          )}
          {/* glow under keyboard */}
          <mesh position={[0, -0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.05, 0.42]} />
            <meshBasicMaterial color={VIOLET} transparent opacity={0.2} />
          </mesh>
        </group>
      </Hotspot>

      {/* Phone — contact */}
      <Hotspot id="connect" position={[1.25, 0.78, -0.3]} rotation={[0, -0.5, 0]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <group>
          <RoundedBox args={[0.3, 0.02, 0.62]} radius={0.035}>
            <meshStandardMaterial color="#1c1530" metalness={0.7} roughness={0.3} />
          </RoundedBox>
          {/* screen */}
          <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.26, 0.55]} />
            <meshStandardMaterial color={MAGENTA} emissive={MAGENTA} emissiveIntensity={0.5} toneMapped={false} />
          </mesh>
          {/* camera dot */}
          <mesh position={[0, 0.012, -0.26]}>
            <circleGeometry args={[0.012, 16]} />
            <meshBasicMaterial color="#000" />
          </mesh>
        </group>
      </Hotspot>

      {/* Whiteboard — tech stack */}
      <Hotspot id="tech" position={[-1.3, 1.9, -2.55]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <group>
          <RoundedBox args={[1.4, 0.9, 0.04]} radius={0.02}>
            <meshStandardMaterial color="#f4f1e8" roughness={0.8} />
          </RoundedBox>
          {/* fake diagram lines */}
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
          {/* boxes */}
          {[[-0.4, 0.2], [0.5, 0.2], [-0.2, -0.1], [0.5, -0.2]].map((p, i) => (
            <mesh key={i} position={[p[0], p[1], 0.025]}>
              <planeGeometry args={[0.14, 0.08]} />
              <meshBasicMaterial color={i % 2 === 0 ? VIOLET : MAGENTA} toneMapped={false} />
            </mesh>
          ))}
        </group>
      </Hotspot>

      {/* Travel poster — travel */}
      <Hotspot id="travel" position={[1.4, 1.85, -2.55]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <group>
          <RoundedBox args={[0.9, 1.2, 0.04]} radius={0.02}>
            <meshStandardMaterial color="#1c1530" />
          </RoundedBox>
          {/* "map" — a glowing globe outline */}
          <mesh position={[0, 0.1, 0.025]}>
            <ringGeometry args={[0.22, 0.25, 32]} />
            <meshBasicMaterial color={CORAL} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.1, 0.026]}>
            <circleGeometry args={[0.22, 32]} />
            <meshBasicMaterial color="#1c1530" />
          </mesh>
          {/* "pins" */}
          {[[-0.1, 0.15], [0.05, 0.05], [0.12, 0.18], [-0.05, 0.02]].map((p, i) => (
            <mesh key={i} position={[p[0], p[1], 0.03]}>
              <circleGeometry args={[0.014, 12]} />
              <meshBasicMaterial color={CORAL} toneMapped={false} />
            </mesh>
          ))}
          {/* poster text mock */}
          {[-0.35, -0.42, -0.49].map((y, i) => (
            <mesh key={i} position={[0, y, 0.025]}>
              <planeGeometry args={[0.6 - i * 0.1, 0.02]} />
              <meshBasicMaterial color="#c4b5fd" />
            </mesh>
          ))}
        </group>
      </Hotspot>

      {/* Dumbbell — fitness */}
      <Hotspot id="fitness" position={[-1.3, 0.78, 0.5]} rotation={[0, 0.3, 0]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <group rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.025, 0.025, 0.6, 12]} />
            <meshStandardMaterial color="#3a2a55" metalness={0.8} roughness={0.2} />
          </mesh>
          {[-0.3, 0.3].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} castShadow>
              <cylinderGeometry args={[0.11, 0.11, 0.16, 16]} />
              <meshStandardMaterial color="#1a1326" metalness={0.4} roughness={0.5} />
            </mesh>
          ))}
        </group>
      </Hotspot>

      {/* Headphones — stranger chat */}
      <Hotspot id="stranger" position={[-1.0, 0.85, -0.45]} rotation={[0, 0.5, 0]} onHover={onHover} onClick={onClick} hovered={hovered}>
        <group>
          {/* band */}
          <mesh castShadow>
            <torusGeometry args={[0.18, 0.025, 12, 24, Math.PI]} />
            <meshStandardMaterial color="#1c1530" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* cups */}
          {[-0.18, 0.18].map((x, i) => (
            <mesh key={i} position={[x, -0.04, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.08, 0.07, 18]} />
              <meshStandardMaterial color="#0e0a1a" metalness={0.6} roughness={0.3} />
            </mesh>
          ))}
          {/* glowing earcup */}
          <mesh position={[0.18, -0.04, 0.04]}>
            <ringGeometry args={[0.04, 0.06, 24]} />
            <meshBasicMaterial color={MAGENTA} toneMapped={false} />
          </mesh>
        </group>
      </Hotspot>

      {/* Plant — decoration */}
      <group position={[1.6, 0.76, -0.85]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.16, 16]} />
          <meshStandardMaterial color="#3a2a55" roughness={0.7} />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh key={i} position={[Math.cos(a) * 0.08, 0.25, Math.sin(a) * 0.08]} rotation={[0, a, 0.4]}>
              <coneGeometry args={[0.04, 0.32, 6]} />
              <meshStandardMaterial color="#22c55e" />
            </mesh>
          )
        })}
      </group>

      {/* Floating particles */}
      <Particles count={40} />
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
