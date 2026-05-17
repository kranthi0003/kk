import React, { Suspense, useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import StarField from './StarField'
import SpaceHUD from './SpaceHUD'

// ─── Celestial object definitions ──────────────────────────────
const OBJECTS = [
  { id: 'about',      z: -120,  label: 'Planet Kranthi',      sector: 'KRANTHI SECTOR',  color: '#a78bfa', size: 6,  type: 'planet',  icon: '🪐' },
  { id: 'workspace',  z: -300,  label: 'Space Station Alpha',  sector: 'ALPHA STATION',   color: '#60a5fa', size: 4,  type: 'station', icon: '🛸' },
  { id: 'experience', z: -500,  label: 'Nebula Experia',       sector: 'EXPERIA NEBULA',  color: '#f472b6', size: 8,  type: 'nebula',  icon: '🌀' },
  { id: 'tech',       z: -720,  label: 'Asteroid Belt Ξ',      sector: 'TECH BELT',       color: '#34d399', size: 5,  type: 'belt',    icon: '⚡' },
  { id: 'projects',   z: -960,  label: 'Project Planet',       sector: 'PROJECT ORBIT',   color: '#fbbf24', size: 7,  type: 'planet',  icon: '🌍' },
  { id: 'travel',     z: -1200, label: "Wanderer's Comet",     sector: 'WANDERER ZONE',   color: '#38bdf8', size: 5,  type: 'comet',   icon: '☄️' },
  { id: 'connect',    z: -1450, label: 'Signal Station',       sector: 'SIGNAL REACH',    color: '#c084fc', size: 4,  type: 'station', icon: '📡' },
  { id: 'guestbook',  z: -1700, label: 'Ancient Beacon',       sector: 'BEACON DEEP',     color: '#fb923c', size: 5,  type: 'beacon',  icon: '📜' },
]

const DOCK_DISTANCE = 40
const MAX_SPEED = 100
const ACCEL = 60
const DECEL = 40
const IDLE_DRIFT = 0.5

// ─── Web Audio engine ──────────────────────────────────────────
class SpaceAudio {
  constructor() {
    this.ctx = null
    this.engineOsc = null
    this.engineGain = null
    this.warpOsc = null
    this.warpGain = null
    this.noiseNode = null
    this.noiseGain = null
    this.started = false
  }

  init() {
    if (this.started) return
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)()

      // Engine hum — low drone
      this.engineOsc = this.ctx.createOscillator()
      this.engineOsc.type = 'sawtooth'
      this.engineOsc.frequency.value = 40
      this.engineGain = this.ctx.createGain()
      this.engineGain.gain.value = 0.03
      const engineFilter = this.ctx.createBiquadFilter()
      engineFilter.type = 'lowpass'
      engineFilter.frequency.value = 120
      this.engineOsc.connect(engineFilter)
      engineFilter.connect(this.engineGain)
      this.engineGain.connect(this.ctx.destination)
      this.engineOsc.start()

      // Warp whoosh — higher pitch oscillator
      this.warpOsc = this.ctx.createOscillator()
      this.warpOsc.type = 'sine'
      this.warpOsc.frequency.value = 80
      this.warpGain = this.ctx.createGain()
      this.warpGain.gain.value = 0
      const warpFilter = this.ctx.createBiquadFilter()
      warpFilter.type = 'bandpass'
      warpFilter.frequency.value = 200
      warpFilter.Q.value = 2
      this.warpOsc.connect(warpFilter)
      warpFilter.connect(this.warpGain)
      this.warpGain.connect(this.ctx.destination)
      this.warpOsc.start()

      // Space ambience — filtered noise
      const bufferSize = this.ctx.sampleRate * 2
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3
      this.noiseNode = this.ctx.createBufferSource()
      this.noiseNode.buffer = noiseBuffer
      this.noiseNode.loop = true
      this.noiseGain = this.ctx.createGain()
      this.noiseGain.gain.value = 0.008
      const noiseFilter = this.ctx.createBiquadFilter()
      noiseFilter.type = 'lowpass'
      noiseFilter.frequency.value = 300
      this.noiseNode.connect(noiseFilter)
      noiseFilter.connect(this.noiseGain)
      this.noiseGain.connect(this.ctx.destination)
      this.noiseNode.start()

      this.started = true
    } catch (e) {
      // Audio not supported
    }
  }

  update(speed) {
    if (!this.started || !this.ctx) return
    const t = this.ctx.currentTime
    const speedPct = speed / MAX_SPEED

    // Engine pitch and volume rise with speed
    this.engineOsc.frequency.setTargetAtTime(40 + speedPct * 60, t, 0.1)
    this.engineGain.gain.setTargetAtTime(0.03 + speedPct * 0.06, t, 0.1)

    // Warp sound fades in above 30% speed
    const warpVol = speedPct > 0.3 ? (speedPct - 0.3) * 0.12 : 0
    this.warpOsc.frequency.setTargetAtTime(80 + speedPct * 200, t, 0.15)
    this.warpGain.gain.setTargetAtTime(warpVol, t, 0.15)
  }

  destroy() {
    if (this.ctx) {
      this.ctx.close().catch(() => {})
      this.started = false
    }
  }
}

// ─── Earth at origin ───────────────────────────────────────────
function Earth() {
  const earthRef = useRef()
  const cloudsRef = useRef()

  useFrame(() => {
    if (earthRef.current) earthRef.current.rotation.y += 0.001
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.0015
  })

  return (
    <group position={[15, -5, -30]}>
      {/* Earth sphere */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[8, 64, 64]} />
        <meshStandardMaterial
          color="#1a6dff"
          roughness={0.8}
          metalness={0.1}
          emissive="#0a2a6b"
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* Land patches (simplified) */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[8.15, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          roughness={1}
        />
      </mesh>
      {/* Atmosphere glow */}
      <mesh>
        <sphereGeometry args={[9.5, 32, 32]} />
        <meshBasicMaterial color="#4da6ff" transparent opacity={0.06} side={THREE.BackSide} />
      </mesh>
      {/* Moon */}
      <mesh position={[18, 4, -5]}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial color="#c0c0c0" roughness={0.9} />
      </mesh>
      {/* Label */}
      <Html position={[0, 11, 0]} center distanceFactor={80} style={{ pointerEvents: 'none' }}>
        <div className="text-[10px] font-mono tracking-[0.3em] text-blue-300/40">EARTH · HOME</div>
      </Html>
    </group>
  )
}

// ─── Flight controller ─────────────────────────────────────────
function FlightController({ holding, speed, setSpeed, setShipZ, setDistance, setSector, setDockTarget, docked, setNearObject }) {
  const { camera } = useThree()
  const shipZ = useRef(0)
  const currentSpeed = useRef(IDLE_DRIFT)

  useFrame((_, delta) => {
    if (docked) return
    const dt = Math.min(delta, 0.05)

    if (holding) {
      currentSpeed.current = Math.min(currentSpeed.current + ACCEL * dt, MAX_SPEED)
    } else {
      currentSpeed.current = Math.max(currentSpeed.current - DECEL * dt, IDLE_DRIFT)
    }

    setSpeed(currentSpeed.current)
    shipZ.current -= currentSpeed.current * dt
    setShipZ(shipZ.current)
    setDistance(Math.abs(shipZ.current))

    camera.position.z = shipZ.current
    camera.fov = THREE.MathUtils.lerp(camera.fov, holding ? 85 : 60, dt * 3)
    camera.updateProjectionMatrix()

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
    const inRange = dist < 200
    if (inRange !== visible) setVisible(inRange)
    if (!inRange) return

    groupRef.current.rotation.y += 0.003
    if (obj.type === 'planet') groupRef.current.rotation.x = 0.15

    if (glowRef.current) {
      const proximity = Math.max(0, 1 - dist / DOCK_DISTANCE)
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15 * proximity
      glowRef.current.scale.setScalar(pulse * (1 + proximity * 0.3))
      glowRef.current.material.opacity = 0.1 + proximity * 0.25
    }
  })

  if (!visible) return null

  return (
    <group position={[0, 0, obj.z]} ref={groupRef}>
      {obj.type === 'planet' && (
        <>
          <mesh onClick={() => onDock(obj)}>
            <sphereGeometry args={[obj.size, 32, 32]} />
            <meshStandardMaterial color={obj.color} roughness={0.6} metalness={0.2} />
          </mesh>
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
      <mesh ref={glowRef}>
        <sphereGeometry args={[obj.size * 2.5, 16, 16]} />
        <meshBasicMaterial color={obj.color} transparent opacity={0.08} side={THREE.BackSide} />
      </mesh>
      <Html position={[0, obj.size + 2, 0]} center distanceFactor={80} style={{ pointerEvents: 'none' }}>
        <div className="text-center whitespace-nowrap">
          <div className="text-xs font-mono tracking-widest text-white/50">{obj.label}</div>
        </div>
      </Html>
    </group>
  )
}

// ─── Nebula fog patches ────────────────────────────────────────
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

// ─── Right sidebar — nearby objects radar ──────────────────────
function ObjectRadar({ shipZ, onNavigate }) {
  // Sort objects by distance from ship, show nearest first
  const sorted = useMemo(() => {
    return [...OBJECTS]
      .map(obj => ({ ...obj, dist: Math.abs(shipZ - obj.z), ahead: obj.z < shipZ }))
      .sort((a, b) => a.dist - b.dist)
  }, [shipZ])

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 pointer-events-auto font-mono w-52">
      <div className="text-[9px] tracking-[0.3em] text-white/20 mb-3 text-right">NEARBY OBJECTS</div>
      <div className="space-y-1.5 max-h-[60vh] overflow-y-auto scrollbar-hide">
        {sorted.map(obj => {
          const isClose = obj.dist < DOCK_DISTANCE
          const isNear = obj.dist < 200
          const distLabel = obj.dist < 1 ? 'HERE' : obj.dist < 100 ? `${obj.dist.toFixed(0)} ly` : `${(obj.dist / 1).toFixed(0)} ly`
          const direction = obj.ahead ? '↓' : '↑'

          return (
            <button
              key={obj.id}
              onClick={() => onNavigate(obj)}
              className={`
                w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-300
                ${isClose
                  ? 'bg-white/10 border border-white/20 shadow-lg shadow-blue-500/10'
                  : isNear
                    ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]'
                    : 'bg-transparent border border-transparent opacity-40 hover:opacity-60'
                }
              `}
            >
              <span className="text-base flex-shrink-0">{obj.icon}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-[11px] truncate ${isClose ? 'text-white' : 'text-white/50'}`}>
                  {obj.label}
                </div>
                <div className="text-[9px] text-white/25 flex items-center gap-1">
                  <span>{distLabel}</span>
                  {!isClose && <span className="text-white/15">{direction}</span>}
                  {isClose && <span className="text-blue-400 animate-pulse ml-1">● DOCK</span>}
                </div>
              </div>
              {/* Distance bar */}
              <div className="w-8 h-0.5 bg-white/5 rounded-full overflow-hidden flex-shrink-0">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(5, 100 - (obj.dist / 20))}%`,
                    backgroundColor: obj.color,
                    opacity: isNear ? 0.6 : 0.2,
                  }}
                />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Dock overlay ──────────────────────────────────────────────
function DockOverlay({ object, onLaunch }) {
  if (!object) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center" onClick={(e) => e.target === e.currentTarget && onLaunch()}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-y-auto mx-4">
        <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[10px] font-mono tracking-[0.3em] text-white/30 mb-1">{object.sector}</div>
              <h2 className="text-2xl font-bold text-white">{object.icon} {object.label}</h2>
            </div>
            <button
              onClick={onLaunch}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all text-sm font-mono tracking-wider"
            >
              LAUNCH ↗
            </button>
          </div>
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
  const [sector, setSector] = useState('EARTH ORBIT')
  const [dockTarget, setDockTarget] = useState(null)
  const [nearObject, setNearObject] = useState(null)
  const [docked, setDocked] = useState(null)
  const [ready, setReady] = useState(false)
  const [audioStarted, setAudioStarted] = useState(false)
  const audioRef = useRef(null)

  // Init audio on first interaction
  const startAudio = useCallback(() => {
    if (!audioRef.current) audioRef.current = new SpaceAudio()
    if (!audioStarted) {
      audioRef.current.init()
      setAudioStarted(true)
    }
  }, [audioStarted])

  // Update audio with speed
  useEffect(() => {
    if (audioRef.current) audioRef.current.update(speed)
  }, [speed])

  // Cleanup audio
  useEffect(() => {
    return () => { if (audioRef.current) audioRef.current.destroy() }
  }, [])

  const handleDock = useCallback((obj) => {
    if (Math.abs(shipZ - obj.z) < DOCK_DISTANCE) {
      setDocked(obj)
    }
  }, [shipZ])

  const handleLaunch = useCallback(() => {
    setDocked(null)
  }, [])

  const handleDown = useCallback(() => {
    startAudio()
    if (!docked) setHolding(true)
  }, [docked, startAudio])

  const handleUp = useCallback(() => setHolding(false), [])

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
        <pointLight position={[20, 0, -30]} intensity={0.3} color="#fbbf24" />

        {/* Earth at origin */}
        <Earth />

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

      {/* Right sidebar radar */}
      {ready && !docked && (
        <ObjectRadar shipZ={shipZ} onNavigate={(obj) => handleDock(obj)} />
      )}

      {/* Dock overlay */}
      <DockOverlay object={docked} onLaunch={handleLaunch} />

      {/* Entry prompt */}
      {ready && distance < 5 && !docked && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="flex flex-col items-center gap-2">
            <div className="text-[11px] font-mono tracking-[0.3em] text-white/30 animate-pulse">
              CLICK & HOLD TO LEAVE EARTH
            </div>
            {!audioStarted && (
              <div className="text-[9px] font-mono tracking-[0.2em] text-white/20">
                🔊 CLICK TO ENABLE AUDIO
              </div>
            )}
          </div>
        </div>
      )}

      {/* Back to site button */}
      <button
        onClick={() => { window.location.hash = ''; window.location.reload() }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/10 transition-all text-[10px] font-mono tracking-[0.2em] pointer-events-auto"
      >
        ← RETURN TO SITE
      </button>
    </div>
  )
}
