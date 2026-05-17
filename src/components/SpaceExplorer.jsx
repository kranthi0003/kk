import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls, Html, Stars } from '@react-three/drei'
import * as THREE from 'three'

/* ══════════════════════════════════════════════════════════════
   NASA EYES-STYLE SOLAR SYSTEM with real planet textures
   Each real planet maps to a portfolio section
   ══════════════════════════════════════════════════════════════ */

const TEX = (name) => `${import.meta.env.BASE_URL || '/'}textures/planets/${name}`

const PLANETS = [
  {
    id: 'about', name: 'Mercury', section: 'Kranthi',
    orbit: 14, size: 1.2, speed: 0.16, tilt: 0.03,
    texture: 'mercury.jpg', color: '#a8a29e', atmosphere: null,
    moons: 0, ring: null,
    desc: 'Closest to the sun — personal info, bio, and everything about Kranthi.',
    detail: 'Diameter: 4,879 km · Orbital period: 88 days',
  },
  {
    id: 'workspace', name: 'Venus', section: 'Station Alpha',
    orbit: 20, size: 1.5, speed: 0.12, tilt: 0.04,
    texture: 'venus.jpg', color: '#e9d8a6', atmosphere: '#fde68a',
    moons: 0, ring: null,
    desc: 'Veiled in clouds — the interactive 3D desk workspace.',
    detail: 'Diameter: 12,104 km · Orbital period: 225 days',
  },
  {
    id: 'experience', name: 'Earth', section: 'Experia',
    orbit: 28, size: 1.6, speed: 0.10, tilt: 0.41,
    texture: 'earth.jpg', clouds: 'earth_clouds.jpg', color: '#60a5fa', atmosphere: '#3b82f6',
    moons: 1, ring: null,
    desc: 'Our home — professional experience timeline and career journey.',
    detail: 'Diameter: 12,742 km · Orbital period: 365 days',
  },
  {
    id: 'tech', name: 'Mars', section: 'Techyon',
    orbit: 36, size: 1.3, speed: 0.08, tilt: 0.44,
    texture: 'mars.jpg', color: '#e85d3f', atmosphere: '#fb923c',
    moons: 2, ring: null,
    desc: 'The red planet — tech stack, tools, languages, frameworks.',
    detail: 'Diameter: 6,779 km · Orbital period: 687 days',
  },
  {
    id: 'projects', name: 'Jupiter', section: 'Projectis',
    orbit: 50, size: 3.5, speed: 0.045, tilt: 0.05,
    texture: 'jupiter.jpg', color: '#fcd34d', atmosphere: '#f59e0b',
    moons: 4, ring: null,
    desc: 'The largest — portfolio of projects built and contributed to.',
    detail: 'Diameter: 139,820 km · Orbital period: 12 years',
  },
  {
    id: 'travel', name: 'Saturn', section: 'Wanderer',
    orbit: 65, size: 3.0, speed: 0.030, tilt: 0.47,
    texture: 'saturn.jpg', color: '#fde68a', atmosphere: '#facc15',
    moons: 3, ring: { texture: 'saturn_ring.png', inner: 1.5, outer: 2.6 },
    desc: 'The ringed wanderer — travel map and adventures around the world.',
    detail: 'Diameter: 116,460 km · Orbital period: 29 years',
  },
  {
    id: 'connect', name: 'Uranus', section: 'Signalis',
    orbit: 80, size: 2.0, speed: 0.020, tilt: 1.71,
    texture: 'uranus.jpg', color: '#a5f3fc', atmosphere: '#67e8f9',
    moons: 1, ring: { color: '#a5f3fc', inner: 1.4, outer: 1.55 },
    desc: 'The tilted one — get in touch, contact form and social links.',
    detail: 'Diameter: 50,724 km · Orbital period: 84 years',
  },
  {
    id: 'guestbook', name: 'Neptune', section: 'Beacon Prime',
    orbit: 95, size: 1.9, speed: 0.012, tilt: 0.49,
    texture: 'neptune.jpg', color: '#60a5fa', atmosphere: '#3b82f6',
    moons: 1, ring: null,
    desc: 'The farthest blue — leave a message in the guestbook.',
    detail: 'Diameter: 49,244 km · Orbital period: 165 years',
  },
]

// ─── Sun (real texture) ─────────────────────────────────────
function Sun() {
  const meshRef = useRef()
  const coronaRef = useRef()
  const outerRef = useRef()
  const tex = useLoader(THREE.TextureLoader, TEX('sun.jpg'))

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) meshRef.current.rotation.y = t * 0.05
    if (coronaRef.current) coronaRef.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.06)
    if (outerRef.current) outerRef.current.scale.setScalar(1 + Math.sin(t * 0.3) * 0.04)
  })

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[4, 64, 64]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh ref={coronaRef}>
        <sphereGeometry args={[5, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.18} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[7, 32, 32]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.08} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh ref={outerRef}>
        <sphereGeometry args={[10, 24, 24]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.03} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <pointLight intensity={3} color="#fff8e7" distance={250} decay={0.3} />
      <pointLight intensity={0.8} color="#ffaa44" distance={350} decay={0.8} />
    </group>
  )
}

// ─── Orbit path ──────────────────────────────────────────────
function OrbitPath({ radius, highlighted }) {
  return (
    <mesh rotation-x={Math.PI / 2}>
      <ringGeometry args={[radius - 0.04, radius + 0.04, 180]} />
      <meshBasicMaterial color={highlighted ? '#ffffff' : '#475569'} transparent opacity={highlighted ? 0.4 : 0.1} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

// ─── Planet ──────────────────────────────────────────────────
function Planet({ planet, onSelect, selected, hovered, onHover, planetPositions }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const cloudsRef = useRef()
  const angleRef = useRef(Math.random() * Math.PI * 2)
  const isActive = selected === planet.id || hovered === planet.id

  const planetTex = useLoader(THREE.TextureLoader, TEX(planet.texture))
  const cloudsTex = planet.clouds ? useLoader(THREE.TextureLoader, TEX(planet.clouds)) : null
  const ringTex = planet.ring?.texture ? useLoader(THREE.TextureLoader, TEX(planet.ring.texture)) : null

  useFrame((_, delta) => {
    if (!groupRef.current) return
    angleRef.current += planet.speed * delta
    const x = Math.cos(angleRef.current) * planet.orbit
    const z = Math.sin(angleRef.current) * planet.orbit
    groupRef.current.position.set(x, 0, z)
    if (meshRef.current) meshRef.current.rotation.y += 0.008
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.012
    if (planetPositions) planetPositions.current[planet.id] = { x, y: 0, z }
  })

  return (
    <group ref={groupRef}>
      <group rotation-z={planet.tilt}>
        {/* Planet body */}
        <mesh
          ref={meshRef}
          onClick={(e) => { e.stopPropagation(); onSelect(planet) }}
          onPointerOver={(e) => { e.stopPropagation(); onHover(planet.id); document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { onHover(null); document.body.style.cursor = 'default' }}
        >
          <sphereGeometry args={[planet.size, 64, 64]} />
          <meshStandardMaterial map={planetTex} roughness={0.85} metalness={0.05} />
        </mesh>

        {/* Cloud layer (Earth) */}
        {cloudsTex && (
          <mesh ref={cloudsRef} scale={1.015}>
            <sphereGeometry args={[planet.size, 48, 48]} />
            <meshStandardMaterial map={cloudsTex} transparent opacity={0.4} depthWrite={false} />
          </mesh>
        )}

        {/* Atmosphere halo */}
        {planet.atmosphere && (
          <mesh scale={1.15}>
            <sphereGeometry args={[planet.size, 32, 32]} />
            <meshBasicMaterial color={planet.atmosphere} transparent opacity={isActive ? 0.22 : 0.1} side={THREE.BackSide} depthWrite={false} />
          </mesh>
        )}

        {/* Ring (textured for Saturn, solid for Uranus) */}
        {planet.ring && (
          <mesh rotation-x={Math.PI / 2}>
            <ringGeometry args={[planet.size * planet.ring.inner, planet.size * planet.ring.outer, 96]} />
            {ringTex ? (
              <meshBasicMaterial map={ringTex} transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
            ) : (
              <meshBasicMaterial color={planet.ring.color || planet.color} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
            )}
          </mesh>
        )}
      </group>

      {/* Selection indicator (outside tilt group, stays flat) */}
      {isActive && (
        <mesh rotation-x={Math.PI / 2}>
          <ringGeometry args={[planet.size * 1.95, planet.size * 2.0, 64]} />
          <meshBasicMaterial color={planet.color} transparent opacity={0.5} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {/* Moons */}
      {Array.from({ length: planet.moons }, (_, i) => (
        <MoonObj key={i} parentSize={planet.size} index={i} />
      ))}

      {/* Label */}
      <Html
        position={[0, planet.size + 1.5, 0]}
        center
        distanceFactor={70}
        style={{ pointerEvents: 'none', opacity: isActive ? 1 : 0.5, transition: 'opacity 0.3s' }}
      >
        <div className="flex flex-col items-center gap-0.5 whitespace-nowrap">
          <span className="text-[11px] font-medium tracking-[0.15em] drop-shadow-lg" style={{ color: planet.color }}>
            {planet.name}
          </span>
          <span className="text-[7px] font-mono tracking-[0.3em] text-white/40">{planet.section.toUpperCase()}</span>
          <div className="w-[1px] h-2" style={{ background: `${planet.color}40` }} />
        </div>
      </Html>
    </group>
  )
}

// ─── Moon (uses moon texture) ────────────────────────────────
function MoonObj({ parentSize, index }) {
  const ref = useRef()
  const moonOrbit = parentSize * 2.5 + index * 1.4
  const moonSpeed = 0.4 + index * 0.2
  const angleRef = useRef(index * 2.1)
  const tex = useLoader(THREE.TextureLoader, TEX('moon.jpg'))

  useFrame((_, delta) => {
    if (!ref.current) return
    angleRef.current += moonSpeed * delta
    ref.current.position.set(
      Math.cos(angleRef.current) * moonOrbit,
      Math.sin(angleRef.current * 0.3) * 0.3,
      Math.sin(angleRef.current) * moonOrbit,
    )
    ref.current.rotation.y += 0.01
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.22 + index * 0.05, 24, 24]} />
      <meshStandardMaterial map={tex} roughness={0.95} />
    </mesh>
  )
}

// ─── Camera fly-to ──────────────────────────────────────────
function CameraController({ target, controlsRef }) {
  const { camera } = useThree()
  const targetPos = useRef(new THREE.Vector3(0, 40, 60))
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const isFlying = useRef(false)

  useEffect(() => {
    if (target) {
      targetPos.current.set(target.x + 6, 4, target.z + 10)
      targetLookAt.current.set(target.x, 0, target.z)
      isFlying.current = true
    } else {
      targetPos.current.set(0, 40, 60)
      targetLookAt.current.set(0, 0, 0)
      isFlying.current = true
    }
  }, [target])

  useFrame(() => {
    if (!isFlying.current || !controlsRef.current) return
    camera.position.lerp(targetPos.current, 0.035)
    controlsRef.current.target.lerp(targetLookAt.current, 0.035)
    controlsRef.current.update()
    if (camera.position.distanceTo(targetPos.current) < 0.5) isFlying.current = false
  })

  return null
}

// ─── Loading screen ──────────────────────────────────────────
function LoadingScreen({ progress }) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-mono">
      <div className="flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
        </div>
        <div className="text-[11px] tracking-[0.6em] text-white/40 uppercase">Eyes on Kranthi's Universe</div>
        <div className="w-64 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500/60 to-amber-300/60 rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-[9px] tracking-[0.3em] text-white/20">LOADING PLANET TEXTURES</div>
      </div>
    </div>
  )
}

// ─── Info drawer ─────────────────────────────────────────────
function InfoDrawer({ planet, onClose, onExplore }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (planet) requestAnimationFrame(() => setVisible(true))
    else setVisible(false)
  }, [planet])
  if (!planet) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-auto transition-all duration-500 ease-out" style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}>
      <div className="mx-auto max-w-3xl">
        <div className="bg-black/85 backdrop-blur-2xl border border-white/8 rounded-t-2xl overflow-hidden">
          <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${planet.color}, transparent)` }} />
          <div className="p-6 flex items-start gap-6">
            <div className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: `radial-gradient(circle at 35% 35%, ${planet.color}40, ${planet.color}10)`, boxShadow: `0 0 30px ${planet.color}20` }}>
              <div className="w-8 h-8 rounded-full" style={{ background: `radial-gradient(circle at 40% 35%, ${planet.color}, ${planet.color}80)` }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-semibold text-white/90">{planet.name}</h2>
                <span className="text-[9px] font-mono tracking-[0.3em] px-2 py-0.5 rounded-full bg-white/5 text-white/40 border border-white/5">{planet.section.toUpperCase()}</span>
              </div>
              <p className="text-sm text-white/40 mb-2 leading-relaxed">{planet.desc}</p>
              <div className="text-[10px] font-mono text-white/20 tracking-wider">{planet.detail}</div>
            </div>
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button onClick={() => onExplore(planet.id)} className="px-5 py-2 rounded-lg text-xs font-medium tracking-wider transition-all hover:scale-105" style={{ background: `linear-gradient(135deg, ${planet.color}30, ${planet.color}10)`, border: `1px solid ${planet.color}30`, color: planet.color }}>
                EXPLORE →
              </button>
              <button onClick={onClose} className="px-5 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-all">CLOSE</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Scene ───────────────────────────────────────────────────
function Scene({ selected, hovered, onSelect, onHover, planetPositions, controlsRef }) {
  const cameraTarget = useMemo(() => {
    if (!selected) return null
    return planetPositions.current[selected.id] || null
  }, [selected, planetPositions])

  return (
    <>
      <color attach="background" args={['#020008']} />
      <ambientLight intensity={0.06} />
      <Stars radius={300} depth={150} count={8000} factor={3} saturation={0} fade speed={0.3} />
      <Sun />
      {PLANETS.map(p => (
        <OrbitPath key={`orbit-${p.id}`} radius={p.orbit} highlighted={selected?.id === p.id || hovered === p.id} />
      ))}
      {PLANETS.map(p => (
        <Planet key={p.id} planet={p} onSelect={onSelect} selected={selected?.id} hovered={hovered} onHover={onHover} planetPositions={planetPositions} />
      ))}
      <CameraController target={cameraTarget} controlsRef={controlsRef} />
      <OrbitControls ref={controlsRef} enablePan enableZoom enableRotate minDistance={6} maxDistance={200} minPolarAngle={0.1} maxPolarAngle={Math.PI / 2} autoRotate autoRotateSpeed={0.08} dampingFactor={0.06} enableDamping zoomSpeed={0.8} rotateSpeed={0.5} />
    </>
  )
}

// ─── Top bar ─────────────────────────────────────────────────
function TopBar({ onHome }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
      <div className="flex items-center justify-between px-5 py-3">
        <button onClick={onHome} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 transition-all group pointer-events-auto">
          <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-[10px] font-medium tracking-[0.15em] text-white/40 group-hover:text-white/70 transition-colors">HOME</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-mono tracking-[0.4em] text-white/15 hidden sm:block">KRANTHI'S UNIVERSE</div>
          <div className="w-2 h-2 rounded-full bg-emerald-400/60 animate-pulse" title="Live" />
        </div>
      </div>
    </div>
  )
}

// ─── Bottom nav strip ────────────────────────────────────────
function NavStrip({ planets, selected, onSelect }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
      <div className="flex justify-center pb-4 px-4 pointer-events-auto">
        <div className="flex items-center gap-[2px] p-1 rounded-xl bg-black/50 backdrop-blur-xl border border-white/5 max-w-full overflow-x-auto">
          <button onClick={() => onSelect(null)} className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all flex-shrink-0 ${!selected ? 'bg-amber-500/10' : 'hover:bg-white/5'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${!selected ? 'bg-amber-400' : 'bg-amber-400/40'}`} />
            <span className={`text-[7px] font-mono tracking-wider ${!selected ? 'text-amber-300/70' : 'text-white/20'}`}>SUN</span>
          </button>
          <div className="w-px h-6 bg-white/5" />
          {planets.map(p => {
            const isSelected = selected?.id === p.id
            return (
              <button key={p.id} onClick={() => onSelect(p)} className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-lg transition-all flex-shrink-0 ${isSelected ? 'bg-white/8' : 'hover:bg-white/5'}`} title={`${p.name} — ${p.section}`}>
                <div className="w-2 h-2 rounded-full transition-all" style={{ background: isSelected ? p.color : `${p.color}50`, boxShadow: isSelected ? `0 0 8px ${p.color}40` : 'none' }} />
                <span className={`text-[7px] font-mono tracking-wider ${isSelected ? 'text-white/70' : 'text-white/20'}`}>{p.name.slice(0, 4).toUpperCase()}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────
export default function SpaceExplorer() {
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [ready, setReady] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const controlsRef = useRef()
  const planetPositions = useRef({})

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadProgress(prev => { if (prev >= 100) { clearInterval(interval); return 100 } return prev + Math.random() * 12 })
    }, 200)
    return () => clearInterval(interval)
  }, [])

  const handleSelect = useCallback((planet) => {
    setSelected(prev => { if (!planet) return null; return prev?.id === planet.id ? null : planet })
  }, [])

  const handleExplore = useCallback((sectionId) => {
    const routeMap = { about: '#about', workspace: '#/workspace', experience: '#experience', tech: '#tech', projects: '#projects', travel: '#travel', connect: '#connect', guestbook: '#guestbook' }
    window.location.hash = routeMap[sectionId] || `#${sectionId}`
    window.location.reload()
  }, [])

  const handleHome = useCallback(() => { window.location.hash = ''; window.location.reload() }, [])

  return (
    <div className="fixed inset-0 bg-black text-white select-none">
      {!ready && <LoadingScreen progress={Math.min(loadProgress, 100)} />}

      <Canvas
        camera={{ position: [0, 40, 60], fov: 45, near: 0.1, far: 600 }}
        dpr={window.innerWidth < 768 ? 1 : [1, 1.5]}
        onCreated={() => setTimeout(() => setReady(true), 800)}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <React.Suspense fallback={null}>
          <Scene selected={selected} hovered={hovered} onSelect={handleSelect} onHover={setHovered} planetPositions={planetPositions} controlsRef={controlsRef} />
        </React.Suspense>
      </Canvas>

      <TopBar onHome={handleHome} />
      {ready && <NavStrip planets={PLANETS} selected={selected} onSelect={handleSelect} />}
      <InfoDrawer planet={selected} onClose={() => setSelected(null)} onExplore={handleExplore} />

      {ready && !selected && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="text-[9px] font-mono tracking-[0.4em] text-white/15 animate-pulse">SELECT A PLANET TO EXPLORE</div>
        </div>
      )}
    </div>
  )
}
