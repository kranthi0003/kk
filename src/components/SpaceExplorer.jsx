import React, { useRef, useState, useCallback, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, Stars } from '@react-three/drei'
import * as THREE from 'three'

// ─── Planet definitions (portfolio sections as orbiting planets) ─
const PLANETS = [
  { id: 'about',      label: 'Kranthi',      orbit: 12, size: 1.8, speed: 0.15,  color: '#a78bfa', emissive: '#7c3aed', tilt: 0.2,  ring: false, icon: '🪐', moons: 0 },
  { id: 'workspace',  label: 'Station Alpha', orbit: 20, size: 1.2, speed: 0.12,  color: '#60a5fa', emissive: '#2563eb', tilt: 0.05, ring: false, icon: '🛸', moons: 1 },
  { id: 'experience', label: 'Experia',       orbit: 28, size: 2.2, speed: 0.09,  color: '#f472b6', emissive: '#db2777', tilt: 0.4,  ring: true,  icon: '🌀', moons: 2 },
  { id: 'tech',       label: 'Techyon',       orbit: 37, size: 1.5, speed: 0.07,  color: '#34d399', emissive: '#059669', tilt: 0.15, ring: false, icon: '⚡', moons: 1 },
  { id: 'projects',   label: 'Projectis',     orbit: 47, size: 2.8, speed: 0.05,  color: '#fbbf24', emissive: '#d97706', tilt: 0.3,  ring: true,  icon: '🌍', moons: 3 },
  { id: 'travel',     label: 'Wanderer',      orbit: 58, size: 1.4, speed: 0.035, color: '#38bdf8', emissive: '#0284c7', tilt: 0.1,  ring: false, icon: '☄️', moons: 0 },
  { id: 'connect',    label: 'Signalis',      orbit: 68, size: 1.0, speed: 0.025, color: '#c084fc', emissive: '#9333ea', tilt: 0.25, ring: false, icon: '📡', moons: 1 },
  { id: 'guestbook',  label: 'Beacon Prime',  orbit: 78, size: 1.3, speed: 0.018, color: '#fb923c', emissive: '#ea580c', tilt: 0.35, ring: false, icon: '📜', moons: 0 },
]

// ─── Sun ───────────────────────────────────────────────────────
function Sun() {
  const ref = useRef()
  const coronaRef = useRef()

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y += 0.002
    if (coronaRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05
      coronaRef.current.scale.setScalar(pulse)
    }
  })

  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[4, 64, 64]} />
        <meshBasicMaterial color="#ffd700" toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[4.5, 32, 32]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.3} side={THREE.BackSide} />
      </mesh>
      <mesh ref={coronaRef}>
        <sphereGeometry args={[6, 32, 32]} />
        <meshBasicMaterial color="#ff8800" transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[8, 16, 16]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.03} side={THREE.BackSide} />
      </mesh>
      <pointLight intensity={2} color="#fff5e0" distance={200} decay={0.5} />
      <pointLight intensity={0.5} color="#ffaa44" distance={300} decay={1} />
    </group>
  )
}

// ─── Orbit ring ────────────────────────────────────────────────
function OrbitRing({ radius, highlighted }) {
  return (
    <mesh rotation-x={Math.PI / 2}>
      <ringGeometry args={[radius - 0.03, radius + 0.03, 128]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={highlighted ? 0.15 : 0.04} side={THREE.DoubleSide} />
    </mesh>
  )
}

// ─── Planet ────────────────────────────────────────────────────
function Planet({ planet, onSelect, selected, hovered, onHover }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const angleRef = useRef(Math.random() * Math.PI * 2)

  useFrame((state, delta) => {
    if (!groupRef.current) return
    angleRef.current += planet.speed * delta
    const x = Math.cos(angleRef.current) * planet.orbit
    const z = Math.sin(angleRef.current) * planet.orbit
    groupRef.current.position.set(x, 0, z)
    if (meshRef.current) meshRef.current.rotation.y += 0.01
  })

  const isActive = selected === planet.id || hovered === planet.id

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        rotation-z={planet.tilt}
        onClick={(e) => { e.stopPropagation(); onSelect(planet) }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(planet.id); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = 'default' }}
      >
        <sphereGeometry args={[planet.size, 32, 32]} />
        <meshStandardMaterial
          color={planet.color}
          emissive={planet.emissive}
          emissiveIntensity={isActive ? 0.5 : 0.15}
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>

      {planet.ring && (
        <mesh rotation-x={Math.PI / 2.5 + planet.tilt}>
          <ringGeometry args={[planet.size * 1.5, planet.size * 2.2, 64]} />
          <meshStandardMaterial color={planet.color} transparent opacity={0.35} side={THREE.DoubleSide} />
        </mesh>
      )}

      <mesh>
        <sphereGeometry args={[planet.size * (isActive ? 2 : 1.5), 16, 16]} />
        <meshBasicMaterial color={planet.color} transparent opacity={isActive ? 0.12 : 0.04} side={THREE.BackSide} />
      </mesh>

      {Array.from({ length: planet.moons }, (_, i) => (
        <MoonObj key={i} parentSize={planet.size} index={i} />
      ))}

      <Html position={[0, planet.size + 1.5, 0]} center distanceFactor={120}
        style={{ pointerEvents: 'none', opacity: isActive ? 1 : 0.5, transition: 'opacity 0.3s' }}>
        <div className="text-center whitespace-nowrap">
          <div className="text-[10px] font-mono tracking-[0.2em]" style={{ color: planet.color }}>
            {planet.label}
          </div>
        </div>
      </Html>
    </group>
  )
}

// ─── Moon ──────────────────────────────────────────────────────
function MoonObj({ parentSize, index }) {
  const ref = useRef()
  const moonOrbit = parentSize * 2.5 + index * 1.2
  const moonSpeed = 0.5 + index * 0.3
  const angleRef = useRef(index * 2.1)

  useFrame((_, delta) => {
    if (!ref.current) return
    angleRef.current += moonSpeed * delta
    ref.current.position.set(Math.cos(angleRef.current) * moonOrbit, 0, Math.sin(angleRef.current) * moonOrbit)
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial color="#aaaaaa" roughness={0.9} />
    </mesh>
  )
}

// ─── Planet info panel (right side) ────────────────────────────
function PlanetPanel({ planet, onClose, onExplore }) {
  if (!planet) return null

  const descriptions = {
    about: 'Personal info, bio, and everything about Kranthi.',
    workspace: 'Interactive 3D desk workspace with tools and links.',
    experience: 'Professional experience timeline and career journey.',
    tech: 'Tech stack, tools, languages, and frameworks.',
    projects: 'Portfolio of projects built and contributed to.',
    travel: 'Travel map and adventures around the world.',
    connect: 'Get in touch — contact form and social links.',
    guestbook: 'Leave a message in the guestbook.',
  }

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 z-40 pointer-events-auto">
      <div className="h-full bg-black/80 backdrop-blur-xl border-l border-white/10 p-6 flex flex-col">
        <button onClick={onClose} className="self-end text-white/30 hover:text-white/70 text-xl mb-4 transition-colors">✕</button>
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{planet.icon}</div>
          <h2 className="text-xl font-bold" style={{ color: planet.color }}>{planet.label}</h2>
          <div className="text-[10px] font-mono tracking-[0.3em] text-white/30 mt-1">
            ORBIT: {planet.orbit} AU · SIZE: {planet.size.toFixed(1)}
          </div>
        </div>
        <div className="h-px bg-white/10 mb-4" />
        <div className="flex-1 text-white/50 text-sm leading-relaxed">
          <p className="mb-4">{descriptions[planet.id]}</p>
        </div>
        <button
          onClick={() => onExplore(planet.id)}
          className="w-full py-3 rounded-xl text-sm font-mono tracking-wider transition-all"
          style={{
            background: `linear-gradient(135deg, ${planet.color}20, ${planet.color}10)`,
            border: `1px solid ${planet.color}40`,
            color: planet.color,
          }}
        >
          EXPLORE {planet.label.toUpperCase()} →
        </button>
      </div>
    </div>
  )
}

// ─── Bottom planet bar ─────────────────────────────────────────
function PlanetBar({ selected, onSelect }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/10">
        {PLANETS.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg transition-all ${selected === p.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
            title={p.label}
          >
            <span className="text-sm">{p.icon}</span>
            <span className={`text-[8px] font-mono tracking-wider ${selected === p.id ? 'text-white/70' : 'text-white/25'}`}>
              {p.label.slice(0, 5).toUpperCase()}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Loading screen ────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-4 font-mono">
      <div className="text-[10px] tracking-[0.5em] text-white/30 animate-pulse">LOADING SOLAR SYSTEM</div>
      <div className="w-48 h-0.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-yellow-400/50 rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: '60%' }} />
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────
export default function SpaceExplorer() {
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [ready, setReady] = useState(false)

  const handleSelect = useCallback((planet) => {
    setSelected(prev => prev?.id === planet.id ? null : planet)
  }, [])

  const handleExplore = useCallback((sectionId) => {
    const routeMap = {
      about: '#about', workspace: '#/workspace', experience: '#experience',
      tech: '#tech', projects: '#projects', travel: '#travel',
      connect: '#connect', guestbook: '#guestbook',
    }
    window.location.hash = routeMap[sectionId] || `#${sectionId}`
    window.location.reload()
  }, [])

  return (
    <div className="fixed inset-0 bg-black text-white">
      {!ready && <LoadingScreen />}

      <Canvas
        camera={{ position: [0, 50, 70], fov: 50, near: 0.1, far: 500 }}
        dpr={window.innerWidth < 768 ? 1 : [1, 1.5]}
        onCreated={() => setTimeout(() => setReady(true), 400)}
        gl={{ antialias: true, alpha: false }}
        style={{ background: '#000' }}
      >
        <color attach="background" args={['#020010']} />
        <ambientLight intensity={0.08} />
        <Stars radius={200} depth={100} count={6000} factor={3} saturation={0.1} fade speed={0.5} />
        <Sun />
        {PLANETS.map(p => (
          <OrbitRing key={`orbit-${p.id}`} radius={p.orbit} highlighted={selected?.id === p.id || hovered === p.id} />
        ))}
        {PLANETS.map(p => (
          <Planet key={p.id} planet={p} onSelect={handleSelect} selected={selected?.id} hovered={hovered} onHover={setHovered} />
        ))}
        <OrbitControls
          enablePan enableZoom enableRotate
          minDistance={10} maxDistance={150}
          minPolarAngle={0.2} maxPolarAngle={Math.PI / 2.2}
          autoRotate autoRotateSpeed={0.15}
          dampingFactor={0.05} enableDamping
        />
      </Canvas>

      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 pointer-events-none">
        <button
          onClick={() => { window.location.hash = ''; window.location.reload() }}
          className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-all text-[10px] font-mono tracking-[0.2em] pointer-events-auto"
        >
          ← RETURN TO SITE
        </button>
        <div className="text-[10px] font-mono tracking-[0.4em] text-white/20">KRANTHI'S UNIVERSE</div>
      </div>

      {ready && <PlanetBar selected={selected?.id} onSelect={handleSelect} />}

      <PlanetPanel planet={selected} onClose={() => setSelected(null)} onExplore={handleExplore} />

      {ready && !selected && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="text-[10px] font-mono tracking-[0.3em] text-white/20 animate-pulse">
            CLICK A PLANET TO EXPLORE
          </div>
        </div>
      )}
    </div>
  )
}
