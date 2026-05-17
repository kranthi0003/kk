import React, { Suspense, useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import StarField from './StarField'
import SpaceHUD from './SpaceHUD'

// ─── Celestial object definitions ──────────────────────────────
const OBJECTS = [
  { id: 'about',      z: -80,   label: 'Planet Kranthi',     sector: 'KRANTHI SECTOR',    color: '#a78bfa', size: 6,  type: 'planet'  },
  { id: 'workspace',  z: -250,  label: 'Space Station Alpha', sector: 'ALPHA STATION',     color: '#60a5fa', size: 4,  type: 'station' },
  { id: 'experience', z: -450,  label: 'Nebula Experia',     sector: 'EXPERIA NEBULA',    color: '#f472b6', size: 8,  type: 'nebula'  },
  { id: 'tech',       z: -650,  label: 'Asteroid Belt Ξ',    sector: 'TECH BELT',         color: '#34d399', size: 5,  type: 'belt'    },
  { id: 'projects',   z: -900,  label: 'Project Planet',     sector: 'PROJECT ORBIT',     color: '#fbbf24', size: 7,  type: 'planet'  },
  { id: 'travel',     z: -1150, label: "Wanderer's Comet",   sector: 'WANDERER ZONE',     color: '#38bdf8', size: 5,  type: 'comet'   },
  { id: 'connect',    z: -1400, label: 'Signal Station',     sector: 'SIGNAL REACH',      color: '#c084fc', size: 4,  type: 'station' },
  { id: 'guestbook',  z: -1650, label: 'Ancient Beacon',     sector: 'BEACON DEEP',       color: '#fb923c', size: 5,  type: 'beacon'  },
]

const DOCK_DISTANCE = 40
const MAX_SPEED = 100
const ACCEL = 60    // units/s² when holding
const DECEL = 40    // units/s² when released
const IDLE_DRIFT = 0.5

// ─── Flight controller (runs inside Canvas) ────────────────────
function FlightController({ holding, speed, setSpeed, setShipZ, setDistance, setSector, setDockTarget, docked, setNearObject }) {
  const { camera } = useThree()
  const shipZ = useRef(0)
  const currentSpeed = useRef(IDLE_DRIFT)

  useFrame((_, delta) => {
    if (docked) return

    const dt = Math.min(delta, 0.05)

    // Accelerate / decelerate
    if (holding) {
      currentSpeed.current = Math.min(currentSpeed.current + ACCEL * dt, MAX_SPEED)
    } else {
      currentSpeed.current = Math.max(currentSpeed.current - DECEL * dt, IDLE_DRIFT)
    }

    setSpeed(currentSpeed.current)

    // Move ship forward (negative Z)
    shipZ.current -= currentSpeed.current * dt
    setShipZ(shipZ.current)
    setDistance(Math.abs(shipZ.current))

    // Update camera
    camera.position.z = shipZ.current
    camera.fov = THREE.MathUtils.lerp(camera.fov, holding ? 85 : 60, dt * 3)
    camera.updateProjectionMatrix()

    // Check proximity to celestial objects
    let nearest = null
    let nearestDist = Infinity
    let currentSector = 'DEEP SPACE'

    for (const obj of OBJECTS) {
      const dist = Math.abs(shipZ.current - obj.z)
      if (dist < 150) currentSector = obj.sector
      if (dist < DOCK_DISTANCE && dist < nearestDist) {
        nearest = obj
        nearestDist = dist
      }
    }

    setSector(currentSector)
    setDockTarget(nearest?.label || null)
    setNearObject(nearest)
  })

  return null
}

// ─── Celestial Object 3D mesh ──────────────────────────────────
function CelestialBody({ obj, shipZ, onDock }) {
  const groupRef = useRef()
  const glowRef = useRef()
  const [visible, setVisible] = useState(false)

  useFrame((state) => {
    if (!groupRef.current) return
    const dist = Math.abs(shipZ - obj.z)

    // Only render when within range
    const inRange = dist < 200
    if (inRange !== visible) setVisible(inRange)
    if (!inRange) return

    // Slow rotation
    groupRef.current.rotation.y += 0.003
    if (obj.type === 'planet') groupRef.current.rotation.x = 0.15

    // Glow pulse when near
    if (glowRef.current) {
      const proximity = Math.max(0, 1 - dist / DOCK_DISTANCE)
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15 * proximity
      glowRef.current.scale.setScalar(pulse * (1 + proximity * 0.3))
      glowRef.current.material.opacity = 0.1 + proximity * 0.25
    }
  })

  if (!visible) return null

  const color = new THREE.Color(obj.color)

  return (
    <group position={[0, 0, obj.z]} ref={groupRef}>
      {/* Main body */}
      {obj.type === 'planet' && (
        <>
          <mesh onClick={() => onDock(obj)}>
            <sphereGeometry args={[obj.size, 32, 32]} />
            <meshStandardMaterial color={obj.color} roughness={0.6} metalness={0.2} />
          </mesh>
          {/* Ring */}
          <mesh rotation-x={Math.PI / 3}>
            <torusGeometry args={[obj.size * 1.6, 0.3, 16, 64]} />
            <meshStandardMaterial color={obj.color} transparent opacity={0.4} />
          </mesh>
        </>
      )}

      {obj.type === 'station' && (
        <mesh onClick={() => onDock(obj)}>
          <octahedronGeometry args={[obj.size, 1]} />
          <meshStandardMaterial color={obj.color} roughness={0.3} metalness={0.7} wireframe />
        </mesh>
      )}

      {obj.type === 'nebula' && (
        <mesh onClick={() => onDock(obj)} scale={[2, 1.2, 1.5]}>
          <sphereGeometry args={[obj.size, 16, 16]} />
          <meshStandardMaterial color={obj.color} transparent opacity={0.3} emissive={obj.color} emissiveIntensity={0.5} />
        </mesh>
      )}

      {obj.type === 'belt' && (
        <group onClick={() => onDock(obj)}>
          {Array.from({ length: 20 }, (_, i) => {
            const angle = (i / 20) * Math.PI * 2
            const r = obj.size * 2 + Math.random() * 3
            return (
              <mesh key={i} position={[Math.cos(angle) * r, (Math.random() - 0.5) * 2, Math.sin(angle) * r]}>
                <dodecahedronGeometry args={[0.3 + Math.random() * 0.5, 0]} />
                <meshStandardMaterial color={obj.color} roughness={0.8} />
              </mesh>
            )
          })}
        </group>
      )}

      {obj.type === 'comet' && (
        <group onClick={() => onDock(obj)}>
          <mesh>
            <sphereGeometry args={[obj.size * 0.6, 16, 16]} />
            <meshStandardMaterial color={obj.color} emissive={obj.color} emissiveIntensity={0.3} />
          </mesh>
          {/* Tail */}
          <mesh position={[0, 0, obj.size * 2]} rotation-x={Math.PI / 2}>
            <coneGeometry args={[obj.size * 0.8, obj.size * 4, 8]} />
            <meshStandardMaterial color={obj.color} transparent opacity={0.15} />
          </mesh>
        </group>
      )}

      {obj.type === 'beacon' && (
        <mesh onClick={() => onDock(obj)}>
          <icosahedronGeometry args={[obj.size, 0]} />
          <meshStandardMaterial color={obj.color} emissive={obj.color} emissiveIntensity={0.6} wireframe />
        </mesh>
      )}

      {/* Glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[obj.size * 2.5, 16, 16]} />
        <meshBasicMaterial color={obj.color} transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>

      {/* Label */}
      <Html position={[0, obj.size + 2, 0]} center distanceFactor={80} style={{ pointerEvents: 'none' }}>
        <div className="text-center whitespace-nowrap">
          <div className="text-xs font-mono tracking-widest text-white/50">{obj.label}</div>
        </div>
      </Html>
    </group>
  )
}

// ─── Ambient nebula fog patches ────────────────────────────────
function NebulaFog() {
  const patches = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      pos: [(Math.random() - 0.5) * 100, (Math.random() - 0.5) * 60, -i * 120 - 50],
      color: ['#a78bfa', '#f472b6', '#60a5fa', '#34d399', '#fbbf24'][i % 5],
      scale: 30 + Math.random() * 40,
    }))
  , [])

  return patches.map((p, i) => (
    <mesh key={i} position={p.pos}>
      <sphereGeometry args={[p.scale, 8, 8]} />
      <meshBasicMaterial color={p.color} transparent opacity={0.02} side={THREE.BackSide} />
    </mesh>
  ))
}

// ─── Dock overlay (shows section content) ──────────────────────
function DockOverlay({ object, onLaunch }) {
  if (!object) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={(e) => e.target === e.currentTarget && onLaunch()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4">
        <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] font-mono tracking-[0.3em] text-white/30 mb-1">{object.sector}</div>
              <h2 className="text-2xl font-bold text-white">{object.label}</h2>
            </div>
            <button
              onClick={onLaunch}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-mono tracking-wider"
            >
              LAUNCH ↗
            </button>
          </div>

          {/* Placeholder content — will be replaced with actual sections */}
          <div className="text-white/60 text-sm leading-relaxed">
            <p className="mb-4">Docked at {object.label}. Section content for <strong>{object.id}</strong> will appear here.</p>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-white/20 text-xs">
                  Content {i}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Loading screen ────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center gap-4 font-mono">
      <div className="text-[10px] tracking-[0.5em] text-white/30 animate-pulse">INITIALIZING WARP DRIVE</div>
      <div className="w-48 h-0.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-blue-400/50 rounded-full animate-[loading_2s_ease-in-out_infinite]"
          style={{ width: '60%' }} />
      </div>
    </div>
  )
}

// ─── Main SpaceExplorer ────────────────────────────────────────
export default function SpaceExplorer() {
  const [holding, setHolding] = useState(false)
  const [speed, setSpeed] = useState(IDLE_DRIFT)
  const [shipZ, setShipZ] = useState(0)
  const [distance, setDistance] = useState(0)
  const [sector, setSector] = useState('DEEP SPACE')
  const [dockTarget, setDockTarget] = useState(null)
  const [nearObject, setNearObject] = useState(null)
  const [docked, setDocked] = useState(null)
  const [ready, setReady] = useState(false)

  const handleDock = useCallback((obj) => {
    if (Math.abs(shipZ - obj.z) < DOCK_DISTANCE) {
      setDocked(obj)
    }
  }, [shipZ])

  const handleLaunch = useCallback(() => {
    setDocked(null)
  }, [])

  // Mouse / touch handlers for speed control
  const handleDown = useCallback(() => { if (!docked) setHolding(true) }, [docked])
  const handleUp = useCallback(() => setHolding(false), [])

  // Click to dock when near an object (and not holding for speed)
  const handleClick = useCallback(() => {
    if (nearObject && !holding) {
      handleDock(nearObject)
    }
  }, [nearObject, holding, handleDock])

  useEffect(() => {
    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchend', handleUp)
    return () => {
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchend', handleUp)
    }
  }, [handleUp])

  return (
    <div className="fixed inset-0 bg-black text-white cursor-crosshair"
      onMouseDown={handleDown}
      onTouchStart={handleDown}
    >
      {!ready && <LoadingScreen />}

      <Canvas
        camera={{ position: [0, 0, 0], fov: 60, near: 0.1, far: 3000 }}
        dpr={window.innerWidth < 768 ? 1 : [1, 1.5]}
        onCreated={() => setTimeout(() => setReady(true), 500)}
        gl={{ antialias: false, alpha: false }}
        style={{ background: '#000' }}
      >
        <color attach="background" args={['#000005']} />
        <fog attach="fog" args={['#000010', 100, 600]} />

        <ambientLight intensity={0.15} />
        <pointLight position={[0, 20, 0]} intensity={0.5} color="#60a5fa" />

        <FlightController
          holding={holding}
          speed={speed}
          setSpeed={setSpeed}
          setShipZ={setShipZ}
          setDistance={setDistance}
          setSector={setSector}
          setDockTarget={setDockTarget}
          docked={docked}
          setNearObject={setNearObject}
        />

        <StarField speed={speed} shipZ={shipZ} />
        <NebulaFog />

        {OBJECTS.map(obj => (
          <CelestialBody key={obj.id} obj={obj} shipZ={shipZ} onDock={handleDock} />
        ))}
      </Canvas>

      <SpaceHUD speed={speed} distance={distance} sector={sector} dockTarget={dockTarget} />

      {/* Dock overlay */}
      <DockOverlay object={docked} onLaunch={handleLaunch} />

      {/* Entry prompt */}
      {ready && distance < 5 && !docked && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-pulse">
          <div className="text-[11px] font-mono tracking-[0.3em] text-white/30">
            CLICK & HOLD TO EXPLORE THE UNIVERSE
          </div>
        </div>
      )}
    </div>
  )
}
