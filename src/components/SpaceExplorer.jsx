import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber'
import { OrbitControls, Stars, Line, shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

/* ══════════════════════════════════════════════════════════════
   NASA EYES-STYLE SOLAR SYSTEM
   Cinematic camera fly-to, realistic sun glow, procedural planet
   surfaces, atmosphere halos, smooth animations
   ══════════════════════════════════════════════════════════════ */

// ─── Planet data ─────────────────────────────────────────────
const PLANETS = [
  {
    id: 'about', label: 'Kranthi', orbit: 14, size: 1.6, speed: 0.12,
    color: '#c4b5fd', surface: '#8b5cf6', atmosphere: '#a78bfa',
    tilt: 0.15, ring: false, moons: 0,
    desc: 'Personal info, bio, and everything about Kranthi.',
    detail: 'Orbit Period: 88 days · Rotation: 59 days',
  },
  {
    id: 'workspace', label: 'Station Alpha', orbit: 22, size: 1.3, speed: 0.09,
    color: '#93c5fd', surface: '#3b82f6', atmosphere: '#60a5fa',
    tilt: 0.03, ring: false, moons: 1,
    desc: 'Interactive 3D desk workspace with tools and links.',
    detail: 'Orbit Period: 225 days · Rotation: 243 days',
  },
  {
    id: 'experience', label: 'Experia', orbit: 30, size: 2.0, speed: 0.07,
    color: '#fda4af', surface: '#e11d48', atmosphere: '#f472b6',
    tilt: 0.41, ring: true, moons: 2,
    desc: 'Professional experience timeline and career journey.',
    detail: 'Orbit Period: 365 days · Rotation: 24 hours',
  },
  {
    id: 'tech', label: 'Techyon', orbit: 40, size: 1.4, speed: 0.055,
    color: '#6ee7b7', surface: '#059669', atmosphere: '#34d399',
    tilt: 0.12, ring: false, moons: 1,
    desc: 'Tech stack, tools, languages, and frameworks.',
    detail: 'Orbit Period: 687 days · Rotation: 24.6 hours',
  },
  {
    id: 'projects', label: 'Projectis', orbit: 55, size: 3.0, speed: 0.035,
    color: '#fcd34d', surface: '#d97706', atmosphere: '#fbbf24',
    tilt: 0.22, ring: true, moons: 3,
    desc: 'Portfolio of projects built and contributed to.',
    detail: 'Orbit Period: 12 years · Rotation: 10 hours',
  },
  {
    id: 'travel', label: 'Wanderer', orbit: 68, size: 1.8, speed: 0.022,
    color: '#7dd3fc', surface: '#0284c7', atmosphere: '#38bdf8',
    tilt: 0.46, ring: true, moons: 2,
    desc: 'Travel map and adventures around the world.',
    detail: 'Orbit Period: 29 years · Rotation: 10.7 hours',
  },
  {
    id: 'connect', label: 'Signalis', orbit: 82, size: 1.2, speed: 0.014,
    color: '#c4b5fd', surface: '#7c3aed', atmosphere: '#a78bfa',
    tilt: 1.71, ring: false, moons: 1,
    desc: 'Get in touch — contact form and social links.',
    detail: 'Orbit Period: 84 years · Rotation: 17.2 hours',
  },
  {
    id: 'guestbook', label: 'Beacon Prime', orbit: 95, size: 1.3, speed: 0.009,
    color: '#fdba74', surface: '#ea580c', atmosphere: '#fb923c',
    tilt: 0.49, ring: false, moons: 0,
    desc: 'Leave a message in the guestbook.',
    detail: 'Orbit Period: 165 years · Rotation: 16 hours',
  },
]

// ─── Custom sun glow shader ──────────────────────────────────
const SunGlowMaterial = shaderMaterial(
  { time: 0, color: new THREE.Color('#ff8800') },
  /* vertex */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* fragment */ `
    uniform float time;
    uniform vec3 color;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
      float pulse = 1.0 + sin(time * 0.8) * 0.15;
      gl_FragColor = vec4(color, intensity * 0.6 * pulse);
    }
  `
)
extend({ SunGlowMaterial })

// ─── Atmosphere shader ───────────────────────────────────────
const AtmosphereMaterial = shaderMaterial(
  { color: new THREE.Color('#4488ff'), intensity: 1.0 },
  /* vertex */ `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* fragment */ `
    uniform vec3 color;
    uniform float intensity;
    varying vec3 vNormal;
    void main() {
      float rim = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
      gl_FragColor = vec4(color, rim * intensity * 0.7);
    }
  `
)
extend({ AtmosphereMaterial })

// ─── Procedural planet texture ───────────────────────────────
function usePlanetTexture(surface, color, size) {
  return useMemo(() => {
    const res = size > 2 ? 256 : 128
    const canvas = document.createElement('canvas')
    canvas.width = res
    canvas.height = res
    const ctx = canvas.getContext('2d')
    const c1 = new THREE.Color(surface)
    const c2 = new THREE.Color(color)

    for (let y = 0; y < res; y++) {
      for (let x = 0; x < res; x++) {
        const nx = x / res - 0.5
        const ny = y / res - 0.5
        const n = (Math.sin(nx * 30 + ny * 20) * 0.5 + 0.5) *
                  (Math.cos(ny * 25 - nx * 15) * 0.5 + 0.5)
        const blend = n * 0.6 + 0.2
        const r = Math.floor((c1.r * blend + c2.r * (1 - blend)) * 255)
        const g = Math.floor((c1.g * blend + c2.g * (1 - blend)) * 255)
        const b = Math.floor((c1.b * blend + c2.b * (1 - blend)) * 255)
        ctx.fillStyle = `rgb(${r},${g},${b})`
        ctx.fillRect(x, y, 1, 1)
      }
    }

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    return tex
  }, [surface, color, size])
}

// ─── Sun ─────────────────────────────────────────────────────
function Sun() {
  const meshRef = useRef()
  const glowRef = useRef()
  const glowRef2 = useRef()
  const raysRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (meshRef.current) meshRef.current.rotation.y = t * 0.05
    if (glowRef.current) glowRef.current.material.uniforms.time.value = t
    if (glowRef2.current) glowRef2.current.material.uniforms.time.value = t
    if (raysRef.current) {
      raysRef.current.rotation.z = t * 0.02
      raysRef.current.scale.setScalar(1 + Math.sin(t * 0.3) * 0.08)
    }
  })

  return (
    <group>
      {/* Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[4, 64, 64]} />
        <meshBasicMaterial color="#fff5d0" toneMapped={false} />
      </mesh>

      {/* Inner glow */}
      <mesh ref={glowRef} scale={1.3}>
        <sphereGeometry args={[4, 32, 32]} />
        <sunGlowMaterial transparent side={THREE.BackSide} depthWrite={false} color="#ffaa00" />
      </mesh>

      {/* Outer glow */}
      <mesh ref={glowRef2} scale={2.2}>
        <sphereGeometry args={[4, 32, 32]} />
        <sunGlowMaterial transparent side={THREE.BackSide} depthWrite={false} color="#ff6600" />
      </mesh>

      {/* God rays - sprite planes */}
      <group ref={raysRef}>
        {[0, 60, 120].map((angle, i) => (
          <mesh key={i} rotation-z={THREE.MathUtils.degToRad(angle)}>
            <planeGeometry args={[0.5, 22]} />
            <meshBasicMaterial color="#ffcc44" transparent opacity={0.03} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        ))}
      </group>

      <pointLight intensity={3} color="#fff8e7" distance={250} decay={0.3} />
      <pointLight intensity={0.8} color="#ffaa44" distance={350} decay={0.8} />
    </group>
  )
}

// ─── Orbit path (dashed line like NASA Eyes) ─────────────────
function OrbitPath({ radius, highlighted }) {
  const points = useMemo(() => {
    const pts = []
    const segments = 128
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius))
    }
    return pts
  }, [radius])

  return (
    <Line
      points={points}
      color={highlighted ? '#ffffff' : '#334155'}
      lineWidth={highlighted ? 1.2 : 0.5}
      transparent
      opacity={highlighted ? 0.5 : 0.15}
    />
  )
}

// ─── Planet component ────────────────────────────────────────
function Planet({ planet, onSelect, selected, hovered, onHover, planetPositions }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const angleRef = useRef(Math.random() * Math.PI * 2)
  const texture = usePlanetTexture(planet.surface, planet.color, planet.size)
  const isActive = selected === planet.id || hovered === planet.id

  useFrame((_, delta) => {
    if (!groupRef.current) return
    angleRef.current += planet.speed * delta
    const x = Math.cos(angleRef.current) * planet.orbit
    const z = Math.sin(angleRef.current) * planet.orbit
    groupRef.current.position.set(x, 0, z)
    if (meshRef.current) meshRef.current.rotation.y += 0.008

    if (planetPositions) planetPositions.current[planet.id] = { x, y: 0, z }
  })

  return (
    <group ref={groupRef}>
      {/* Planet body */}
      <mesh
        ref={meshRef}
        rotation-z={planet.tilt}
        onClick={(e) => { e.stopPropagation(); onSelect(planet) }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(planet.id); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = 'default' }}
      >
        <sphereGeometry args={[planet.size, 48, 48]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.7}
          metalness={0.1}
          emissive={planet.surface}
          emissiveIntensity={isActive ? 0.3 : 0.05}
        />
      </mesh>

      {/* Atmosphere halo */}
      <mesh scale={1.15}>
        <sphereGeometry args={[planet.size, 32, 32]} />
        <atmosphereMaterial
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          color={planet.atmosphere}
          intensity={isActive ? 1.5 : 0.6}
        />
      </mesh>

      {/* Selection ring */}
      {isActive && (
        <mesh rotation-x={Math.PI / 2}>
          <ringGeometry args={[planet.size * 1.8, planet.size * 1.85, 64]} />
          <meshBasicMaterial color={planet.color} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}

      {/* Rings */}
      {planet.ring && (
        <mesh rotation-x={Math.PI / 2.3 + planet.tilt * 0.5}>
          <ringGeometry args={[planet.size * 1.4, planet.size * 2.3, 80]} />
          <meshBasicMaterial
            color={planet.color}
            transparent
            opacity={0.2}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Moons */}
      {Array.from({ length: planet.moons }, (_, i) => (
        <MoonObj key={i} parentSize={planet.size} index={i} color={planet.color} />
      ))}
    </group>
  )
}

// ─── Moon ────────────────────────────────────────────────────
function MoonObj({ parentSize, index, color }) {
  const ref = useRef()
  const moonOrbit = parentSize * 2.8 + index * 1.5
  const moonSpeed = 0.4 + index * 0.2
  const angleRef = useRef(index * 2.1)

  useFrame((_, delta) => {
    if (!ref.current) return
    angleRef.current += moonSpeed * delta
    ref.current.position.set(
      Math.cos(angleRef.current) * moonOrbit,
      Math.sin(angleRef.current * 0.3) * 0.3,
      Math.sin(angleRef.current) * moonOrbit,
    )
  })

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.25, 16, 16]} />
      <meshStandardMaterial color="#999" roughness={0.9} emissive={color} emissiveIntensity={0.05} />
    </mesh>
  )
}

// ─── Camera controller with fly-to ──────────────────────────
function CameraController({ target, controlsRef }) {
  const { camera } = useThree()
  const targetPos = useRef(new THREE.Vector3(0, 40, 60))
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0))
  const isFlying = useRef(false)

  useEffect(() => {
    if (target) {
      const offset = new THREE.Vector3(target.x + 8, 6, target.z + 12)
      targetPos.current.copy(offset)
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
    const currentTarget = controlsRef.current.target
    currentTarget.lerp(targetLookAt.current, 0.035)
    controlsRef.current.update()

    if (camera.position.distanceTo(targetPos.current) < 0.5) {
      isFlying.current = false
    }
  })

  return null
}

// ─── Loading screen (NASA-style) ─────────────────────────────
function LoadingScreen({ progress }) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center font-mono">
      <div className="flex flex-col items-center gap-6">
        {/* NASA-style logo area */}
        <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
        </div>
        <div className="text-[11px] tracking-[0.6em] text-white/40 uppercase">
          Eyes on Kranthi's Universe
        </div>
        <div className="w-64 h-[2px] bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500/60 to-amber-300/60 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-[9px] tracking-[0.3em] text-white/20">INITIALIZING SOLAR SYSTEM</div>
      </div>
    </div>
  )
}

// ─── Info drawer (NASA Eyes-style bottom panel) ──────────────
function InfoDrawer({ planet, onClose, onExplore }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (planet) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [planet])

  if (!planet) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 pointer-events-auto transition-all duration-500 ease-out"
      style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="bg-black/85 backdrop-blur-2xl border border-white/8 rounded-t-2xl overflow-hidden">
          {/* Accent line */}
          <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${planet.color}, transparent)` }} />

          <div className="p-6 flex items-start gap-6">
            {/* Planet icon */}
            <div
              className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center"
              style={{
                background: `radial-gradient(circle at 35% 35%, ${planet.color}40, ${planet.surface}20)`,
                boxShadow: `0 0 30px ${planet.color}20`,
              }}
            >
              <div className="w-8 h-8 rounded-full" style={{ background: `radial-gradient(circle at 40% 35%, ${planet.color}, ${planet.surface})` }} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-semibold text-white/90">{planet.label}</h2>
                <span className="text-[9px] font-mono tracking-[0.3em] px-2 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/5">
                  {planet.id.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-white/40 mb-2 leading-relaxed">{planet.desc}</p>
              <div className="text-[10px] font-mono text-white/20 tracking-wider">{planet.detail}</div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={() => onExplore(planet.id)}
                className="px-5 py-2 rounded-lg text-xs font-medium tracking-wider transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${planet.color}30, ${planet.surface}20)`,
                  border: `1px solid ${planet.color}30`,
                  color: planet.color,
                }}
              >
                EXPLORE →
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg text-xs text-white/30 hover:text-white/60 hover:bg-white/5 transition-all"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Planet label overlay (screen-space, like NASA) ──────────
function PlanetLabels({ planets, selected, hovered, onSelect, planetPositions }) {
  const { camera, size } = useThree()
  const labelsRef = useRef({})

  useFrame(() => {
    if (!planetPositions.current) return
    PLANETS.forEach(p => {
      const pos = planetPositions.current[p.id]
      if (!pos || !labelsRef.current[p.id]) return
      const vec = new THREE.Vector3(pos.x, pos.y + p.size + 1.5, pos.z)
      vec.project(camera)
      const x = (vec.x * 0.5 + 0.5) * size.width
      const y = -(vec.y * 0.5 - 0.5) * size.height
      const el = labelsRef.current[p.id]
      const dist = camera.position.distanceTo(new THREE.Vector3(pos.x, pos.y, pos.z))
      const visible = vec.z < 1 && dist < 120
      el.style.transform = `translate(-50%, -100%) translate(${x}px, ${y}px)`
      el.style.opacity = visible ? (selected === p.id || hovered === p.id ? '1' : '0.5') : '0'
    })
  })

  return (
    <div className="fixed inset-0 pointer-events-none z-20" style={{ overflow: 'hidden' }}>
      {PLANETS.map(p => (
        <div
          key={p.id}
          ref={el => { if (el) labelsRef.current[p.id] = el }}
          className="absolute top-0 left-0 pointer-events-auto cursor-pointer transition-opacity duration-300"
          onClick={() => onSelect(p)}
          style={{ opacity: 0 }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span
              className="text-[10px] font-medium tracking-[0.15em] drop-shadow-lg"
              style={{ color: p.color }}
            >
              {p.label}
            </span>
            <div className="w-[1px] h-3" style={{ background: `${p.color}40` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Scene wrapper (for label access to Three context) ───────
function Scene({ selected, hovered, onSelect, onHover, planetPositions, controlsRef }) {
  const cameraTarget = useMemo(() => {
    if (!selected) return null
    const pos = planetPositions.current?.[selected.id]
    return pos || null
  }, [selected, planetPositions])

  return (
    <>
      <color attach="background" args={['#020008']} />
      <ambientLight intensity={0.04} />
      <Stars radius={300} depth={150} count={8000} factor={3} saturation={0} fade speed={0.3} />

      <Sun />

      {PLANETS.map(p => (
        <OrbitPath key={`orbit-${p.id}`} radius={p.orbit} highlighted={selected?.id === p.id || hovered === p.id} />
      ))}
      {PLANETS.map(p => (
        <Planet
          key={p.id}
          planet={p}
          onSelect={onSelect}
          selected={selected?.id}
          hovered={hovered}
          onHover={onHover}
          planetPositions={planetPositions}
        />
      ))}

      <PlanetLabels
        planets={PLANETS}
        selected={selected?.id}
        hovered={hovered}
        onSelect={onSelect}
        planetPositions={planetPositions}
      />

      <CameraController target={cameraTarget} controlsRef={controlsRef} />

      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        minDistance={8}
        maxDistance={180}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2}
        autoRotate
        autoRotateSpeed={0.08}
        dampingFactor={0.06}
        enableDamping
        zoomSpeed={0.8}
        rotateSpeed={0.5}
      />
    </>
  )
}

// ─── Top toolbar (NASA Eyes style) ───────────────────────────
function TopBar({ onHome }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-4 pointer-events-auto">
          <button
            onClick={onHome}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 transition-all group"
          >
            <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-[10px] font-medium tracking-[0.15em] text-white/40 group-hover:text-white/70 transition-colors">
              HOME
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[10px] font-mono tracking-[0.4em] text-white/15 hidden sm:block">
            KRANTHI'S UNIVERSE
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400/60 animate-pulse" title="Live" />
        </div>
      </div>
    </div>
  )
}

// ─── Bottom nav strip (NASA Eyes style planet selector) ──────
function NavStrip({ planets, selected, onSelect }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
      <div className="flex justify-center pb-4 px-4 pointer-events-auto">
        <div className="flex items-center gap-[2px] p-1 rounded-xl bg-black/50 backdrop-blur-xl border border-white/5">
          {/* Sun button */}
          <button
            onClick={() => onSelect(null)}
            className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all ${!selected ? 'bg-amber-500/10' : 'hover:bg-white/5'}`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${!selected ? 'bg-amber-400' : 'bg-amber-400/40'} transition-colors`} />
            <span className={`text-[7px] font-mono tracking-wider ${!selected ? 'text-amber-300/70' : 'text-white/20'}`}>SUN</span>
          </button>

          <div className="w-px h-6 bg-white/5" />

          {planets.map(p => {
            const isSelected = selected?.id === p.id
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-lg transition-all ${isSelected ? 'bg-white/8' : 'hover:bg-white/5'}`}
                title={p.label}
              >
                <div
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    background: isSelected ? p.color : `${p.color}50`,
                    boxShadow: isSelected ? `0 0 8px ${p.color}40` : 'none',
                  }}
                />
                <span className={`text-[7px] font-mono tracking-wider transition-colors ${isSelected ? 'text-white/60' : 'text-white/15'}`}>
                  {p.label.slice(0, 4).toUpperCase()}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────
export default function SpaceExplorer() {
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)
  const [ready, setReady] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const controlsRef = useRef()
  const planetPositions = useRef({})

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100 }
        return prev + Math.random() * 15
      })
    }, 200)
    return () => clearInterval(interval)
  }, [])

  const handleSelect = useCallback((planet) => {
    setSelected(prev => {
      if (!planet) return null
      return prev?.id === planet.id ? null : planet
    })
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

  const handleHome = useCallback(() => {
    window.location.hash = ''
    window.location.reload()
  }, [])

  return (
    <div className="fixed inset-0 bg-black text-white select-none">
      {!ready && <LoadingScreen progress={Math.min(loadProgress, 100)} />}

      <Canvas
        camera={{ position: [0, 40, 60], fov: 45, near: 0.1, far: 600 }}
        dpr={window.innerWidth < 768 ? 1 : [1, 1.5]}
        onCreated={() => setTimeout(() => setReady(true), 600)}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <Scene
          selected={selected}
          hovered={hovered}
          onSelect={handleSelect}
          onHover={setHovered}
          planetPositions={planetPositions}
          controlsRef={controlsRef}
        />
      </Canvas>

      <TopBar onHome={handleHome} />

      {ready && <NavStrip planets={PLANETS} selected={selected} onSelect={handleSelect} />}

      <InfoDrawer planet={selected} onClose={() => setSelected(null)} onExplore={handleExplore} />

      {ready && !selected && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="text-[9px] font-mono tracking-[0.4em] text-white/15 animate-pulse">
            SELECT A PLANET TO EXPLORE
          </div>
        </div>
      )}
    </div>
  )
}
