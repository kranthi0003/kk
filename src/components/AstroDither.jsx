import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Audio Engine (MP3 loop that speeds up with travel) ──────
class WarpAudio {
  constructor() {
    this.ctx = null
    this.source = null
    this.audioBuffer = null
    this.master = null
    this.started = false
    this.element = null
  }

  init() {
    if (this.ctx) return
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.7
    this.master.connect(this.ctx.destination)
  }

  async start() {
    if (!this.ctx || this.started) return
    this.started = true

    // Use HTML Audio element for looping MP3 with playbackRate control
    this.element = new Audio('/audio/loop.mp3')
    this.element.loop = true
    this.element.crossOrigin = 'anonymous'
    this.element.volume = 1

    // Connect through Web Audio for potential effects
    const source = this.ctx.createMediaElementSource(this.element)
    source.connect(this.master)

    try { await this.element.play() } catch(e) { console.warn('Audio play blocked:', e) }
  }

  setSpeed(speed) {
    if (!this.element) return
    // Speed up playback rate (clamp to reasonable range)
    this.element.playbackRate = Math.min(speed, 16)
    // Also increase volume slightly at higher speeds
    if (this.master) {
      const now = this.ctx.currentTime
      this.master.gain.linearRampToValueAtTime(0.7 + (speed - 1) * 0.08, now + 0.1)
    }
  }

  stop() {
    if (this.element) {
      this.element.pause()
      this.element = null
    }
    this.started = false
  }
}

const warpAudio = new WarpAudio()

// ─── Warp tunnel particles (flying toward camera) ────────────
function WarpParticles({ speedRef }) {
  const meshRef = useRef()
  const count = 1500
  const tunnel_length = 80

  // Each particle: position, velocity, color, shape type, size
  const particleData = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const velocities = new Float32Array(count)
    const shapes = new Float32Array(count) // 0=square, 1=cross, 2=circle, 3=diamond

    const palette = [
      [1, 0.3, 0.6],    // pink
      [0.7, 0.4, 1],    // purple
      [0.3, 0.8, 1],    // cyan
      [1, 0.8, 0.2],    // gold
      [0.2, 1, 0.5],    // green
      [1, 0.5, 0.2],    // orange
      [0.5, 0.5, 1],    // lavender
      [1, 1, 1],        // white
    ]

    for (let i = 0; i < count; i++) {
      // Distribute in a cylinder around camera path
      const angle = Math.random() * Math.PI * 2
      const radius = 2 + Math.random() * 25
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = Math.sin(angle) * radius
      positions[i * 3 + 2] = -Math.random() * tunnel_length

      velocities[i] = 0.5 + Math.random() * 0.5
      sizes[i] = 0.1 + Math.random() * 0.4

      const col = palette[Math.floor(Math.random() * palette.length)]
      colors[i * 3] = col[0]
      colors[i * 3 + 1] = col[1]
      colors[i * 3 + 2] = col[2]

      shapes[i] = Math.floor(Math.random() * 4)
    }
    return { positions, colors, sizes, velocities, shapes }
  }, [])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uSpeed: { value: 1 },
  }), [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const geo = meshRef.current.geometry
    const posArr = geo.attributes.position.array
    const velArr = particleData.velocities
    const speed = speedRef.current

    for (let i = 0; i < count; i++) {
      // Move toward camera (positive Z)
      posArr[i * 3 + 2] += velArr[i] * speed * delta * 30

      // Reset particles that pass camera
      if (posArr[i * 3 + 2] > 10) {
        const angle = Math.random() * Math.PI * 2
        const radius = 2 + Math.random() * 25
        posArr[i * 3] = Math.cos(angle) * radius
        posArr[i * 3 + 1] = Math.sin(angle) * radius
        posArr[i * 3 + 2] = -tunnel_length - Math.random() * 20
      }
    }
    geo.attributes.position.needsUpdate = true
  })

  const vertexShader = `
    attribute float aSize;
    attribute float aShape;
    attribute vec3 aColor;
    varying vec3 vColor;
    varying float vShape;
    varying float vDepth;

    void main() {
      vColor = aColor;
      vShape = aShape;
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      vDepth = -mvPos.z;
      gl_Position = projectionMatrix * mvPos;
      // Size gets bigger as particles approach (perspective)
      gl_PointSize = aSize * (300.0 / -mvPos.z);
      gl_PointSize = clamp(gl_PointSize, 1.0, 64.0);
    }
  `

  const fragmentShader = `
    varying vec3 vColor;
    varying float vShape;
    varying float vDepth;

    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float shape = floor(vShape + 0.5);
      float alpha = 0.0;

      if (shape < 0.5) {
        // Square
        float s = max(abs(uv.x), abs(uv.y));
        alpha = step(s, 0.35);
      } else if (shape < 1.5) {
        // Cross
        float cx = step(abs(uv.x), 0.12) * step(abs(uv.y), 0.4);
        float cy = step(abs(uv.y), 0.12) * step(abs(uv.x), 0.4);
        alpha = max(cx, cy);
      } else if (shape < 2.5) {
        // Circle
        alpha = step(length(uv), 0.3);
      } else {
        // Diamond
        alpha = step(abs(uv.x) + abs(uv.y), 0.35);
      }

      if (alpha < 0.1) discard;

      // Fade with depth
      float depthFade = smoothstep(80.0, 5.0, vDepth);
      // Motion blur tail (stretch color for speed feel)
      vec3 col = vColor * (0.7 + depthFade * 0.5);

      gl_FragColor = vec4(col, alpha * depthFade);
    }
  `

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={particleData.positions} itemSize={3} />
        <bufferAttribute attach="attributes-aSize" count={count} array={particleData.sizes} itemSize={1} />
        <bufferAttribute attach="attributes-aShape" count={count} array={particleData.shapes} itemSize={1} />
        <bufferAttribute attach="attributes-aColor" count={count} array={particleData.colors} itemSize={3} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ─── Streak lines (motion streaks for warp feel) ─────────────
function WarpStreaks({ speedRef }) {
  const ref = useRef()
  const count = 200

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 6) // 2 points per line
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 3 + Math.random() * 20
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius
      const z = -Math.random() * 60
      // Start point
      pos[i * 6] = x
      pos[i * 6 + 1] = y
      pos[i * 6 + 2] = z
      // End point (slightly behind)
      pos[i * 6 + 3] = x
      pos[i * 6 + 4] = y
      pos[i * 6 + 5] = z - 1.5
    }
    return pos
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return
    const arr = ref.current.geometry.attributes.position.array
    const speed = speedRef.current

    for (let i = 0; i < count; i++) {
      const moveZ = speed * delta * 35
      arr[i * 6 + 2] += moveZ
      arr[i * 6 + 5] += moveZ

      if (arr[i * 6 + 2] > 10) {
        const angle = Math.random() * Math.PI * 2
        const radius = 3 + Math.random() * 20
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        const z = -60 - Math.random() * 10
        arr[i * 6] = x
        arr[i * 6 + 1] = y
        arr[i * 6 + 2] = z
        arr[i * 6 + 3] = x
        arr[i * 6 + 4] = y
        arr[i * 6 + 5] = z - 1.5 * speed
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count * 2} array={positions} itemSize={3} />
      </bufferGeometry>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.15} />
    </lineSegments>
  )
}

// ─── Cockpit frame (fixed to camera, like you're inside a ship) ──
function Cockpit({ speedRef }) {
  const ref = useRef()

  useFrame((_, delta) => {
    if (!ref.current) return
    // Subtle vibration at high speed
    const speed = speedRef.current
    const shake = (speed - 1) * 0.001
    ref.current.position.x = (Math.random() - 0.5) * shake
    ref.current.position.y = (Math.random() - 0.5) * shake
  })

  return (
    <group ref={ref} position={[0, 0, 3.5]}>
      {/* Main cockpit frame - angular edges */}
      {/* Top bar */}
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[4.5, 0.06, 0.1]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      {/* Bottom bar */}
      <mesh position={[0, -1.6, 0]}>
        <boxGeometry args={[4.5, 0.08, 0.1]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      {/* Left pillar */}
      <mesh position={[-2.2, 0, 0]} rotation={[0, 0, 0.05]}>
        <boxGeometry args={[0.06, 3.6, 0.1]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      {/* Right pillar */}
      <mesh position={[2.2, 0, 0]} rotation={[0, 0, -0.05]}>
        <boxGeometry args={[0.06, 3.6, 0.1]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>

      {/* Dashboard / control panel at bottom */}
      <mesh position={[0, -1.9, 0.3]} rotation={[-0.4, 0, 0]}>
        <boxGeometry args={[3.5, 0.8, 0.05]} />
        <meshBasicMaterial color="#0d0d1a" />
      </mesh>
      {/* Dashboard glow indicators */}
      <mesh position={[-0.8, -1.75, 0.2]} rotation={[-0.4, 0, 0]}>
        <circleGeometry args={[0.03, 8]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>
      <mesh position={[-0.5, -1.75, 0.2]} rotation={[-0.4, 0, 0]}>
        <circleGeometry args={[0.03, 8]} />
        <meshBasicMaterial color="#00ff88" />
      </mesh>
      <mesh position={[0.5, -1.75, 0.2]} rotation={[-0.4, 0, 0]}>
        <circleGeometry args={[0.025, 8]} />
        <meshBasicMaterial color="#ff4444" />
      </mesh>
      <mesh position={[0.8, -1.75, 0.2]} rotation={[-0.4, 0, 0]}>
        <circleGeometry args={[0.03, 8]} />
        <meshBasicMaterial color="#4488ff" />
      </mesh>

      {/* Crosshair / HUD center reticle */}
      <mesh position={[0, 0, -0.5]}>
        <ringGeometry args={[0.08, 0.1, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
      </mesh>
      {/* Reticle ticks */}
      <mesh position={[0, 0.15, -0.5]}>
        <boxGeometry args={[0.005, 0.06, 0.001]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
      </mesh>
      <mesh position={[0, -0.15, -0.5]}>
        <boxGeometry args={[0.005, 0.06, 0.001]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
      </mesh>
      <mesh position={[0.15, 0, -0.5]}>
        <boxGeometry args={[0.06, 0.005, 0.001]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
      </mesh>
      <mesh position={[-0.15, 0, -0.5]}>
        <boxGeometry args={[0.06, 0.005, 0.001]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} />
      </mesh>
    </group>
  )
}

// ─── Camera dynamics (FOV pulse + banking based on speed) ────
function CameraDynamics({ speedRef }) {
  const { camera } = useThree()
  const bankRef = useRef(0)

  useFrame((state, delta) => {
    const speed = speedRef.current
    // FOV grows with speed (tunnel-vision feel)
    const targetFov = 75 + (speed - 1) * 1.8 // up to ~109 at 20x
    camera.fov += (targetFov - camera.fov) * 0.05
    camera.updateProjectionMatrix()

    // Subtle banking — gentle roll that increases with speed
    bankRef.current += delta * 0.3
    const targetRoll = Math.sin(bankRef.current * 0.4) * 0.02 * (speed - 0.5)
    camera.rotation.z += (targetRoll - camera.rotation.z) * 0.04

    // Mild head bob / drift
    const drift = (speed - 1) * 0.015
    camera.position.x = Math.sin(state.clock.elapsedTime * 0.6) * drift
    camera.position.y = Math.cos(state.clock.elapsedTime * 0.5) * drift * 0.8
  })

  return null
}

// ─── Scene ──────────────────────────────────────────────────
function WarpScene({ speedRef }) {
  return (
    <>
      <color attach="background" args={['#050508']} />
      <fog attach="fog" args={['#050508', 40, 80]} />
      <WarpParticles speedRef={speedRef} />
      <WarpStreaks speedRef={speedRef} />
      <Cockpit speedRef={speedRef} />
      <CameraDynamics speedRef={speedRef} />
    </>
  )
}

// ─── Main AstroDither Page ──────────────────────────────────
export default function AstroDither({ onBack }) {
  const [entered, setEntered] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [displayTime, setDisplayTime] = useState('00:00:000')
  const [displaySpeed, setDisplaySpeed] = useState(1)
  const speedRef = useRef(1)
  const holdingRef = useRef(false)

  const handleEnter = useCallback(() => {
    warpAudio.init()
    warpAudio.start()
    setEntered(true)
    setStartTime(Date.now())
  }, [])

  // Timer with milliseconds
  useEffect(() => {
    if (!startTime) return
    let raf
    const tick = () => {
      const elapsed = Date.now() - startTime
      const mins = String(Math.floor(elapsed / 60000)).padStart(2, '0')
      const secs = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0')
      const ms = String(elapsed % 1000).padStart(3, '0')
      setDisplayTime(`${mins}:${secs}:${ms}`)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [startTime])

  // Speed ramp (smooth acceleration on hold)
  useEffect(() => {
    if (!entered) return
    let raf
    const update = () => {
      if (holdingRef.current) {
        // Parabolic: acceleration slows as speed increases
        const remaining = (20 - speedRef.current) / 19
        speedRef.current = Math.min(speedRef.current + 0.08 * remaining, 20)
      } else {
        speedRef.current = Math.max(speedRef.current - 0.06, 1)
      }
      setDisplaySpeed(speedRef.current)
      warpAudio.setSpeed(speedRef.current)
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [entered])

  const handlePointerDown = useCallback(() => {
    holdingRef.current = true
  }, [])

  const handlePointerUp = useCallback(() => {
    holdingRef.current = false
  }, [])

  // Entry screen
  if (!entered) {
    return (
      <div className="fixed inset-0 bg-[#050508] flex flex-col items-center justify-center z-50 cursor-pointer"
           onClick={handleEnter}>
        <div className="absolute top-6 left-6">
          <button onClick={(e) => { e.stopPropagation(); onBack?.() }}
                  className="text-white/30 hover:text-white/60 text-xs font-mono tracking-wider transition-colors">
            ← BACK
          </button>
        </div>
        <div className="text-center">
          <h1 className="text-white/80 text-2xl sm:text-4xl font-mono tracking-[0.3em] mb-8">
            ASTRO DITHER
          </h1>
          <div className="text-white/30 text-xs font-mono tracking-[0.2em] animate-pulse border border-white/10 px-6 py-3">
            CLICK TO ENTER
          </div>
        </div>
        <div className="absolute bottom-8 text-white/15 text-[9px] font-mono tracking-[0.15em]">
          A warp travel experiment · audio enabled
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-50 select-none cursor-crosshair overflow-hidden"
         onPointerDown={handlePointerDown}
         onPointerUp={handlePointerUp}
         onPointerLeave={handlePointerUp}>

      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{ antialias: false, alpha: false }}
      >
        <WarpScene speedRef={speedRef} />
      </Canvas>

      {/* Cinematic letterbox bars (2.35:1) */}
      <div className="absolute top-0 left-0 right-0 bg-black pointer-events-none z-20"
           style={{ height: '8vh', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }} />
      <div className="absolute bottom-0 left-0 right-0 bg-black pointer-events-none z-20"
           style={{ height: '8vh', boxShadow: '0 -4px 20px rgba(0,0,0,0.6)' }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-10"
           style={{
             background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.75) 100%)',
           }} />

      {/* Chromatic aberration overlay (subtle color fringes) */}
      <div className="absolute inset-0 pointer-events-none z-10 mix-blend-screen opacity-30"
           style={{
             background: 'radial-gradient(ellipse at 35% 50%, rgba(255,0,80,0.04) 0%, transparent 60%), radial-gradient(ellipse at 65% 50%, rgba(0,180,255,0.04) 0%, transparent 60%)',
           }} />

      {/* Film grain overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.08] mix-blend-overlay"
           style={{
             backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
             animation: 'grain 0.5s steps(4) infinite',
           }} />

      {/* Speed-reactive flash at high warp (white pulse) */}
      <div className="absolute inset-0 pointer-events-none z-10"
           style={{
             background: 'rgba(255,255,255,0.05)',
             opacity: Math.max(0, (displaySpeed - 10) / 20),
             transition: 'opacity 0.3s',
           }} />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-30">
        {/* Top bar — inside letterbox */}
        <div className="flex items-center justify-between px-6 pt-2 pointer-events-auto" style={{ height: '8vh' }}>
          <div className="font-mono text-white/60 text-[10px] tracking-[0.3em] flex items-center gap-3">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            REC · @kranthi · LAB
          </div>
          <div className="font-mono text-white/50 text-[10px] tracking-[0.3em]">
            ASTRO DITHER · WARP DRIVE
          </div>
        </div>

        {/* Bottom bar — inside letterbox */}
        <div className="flex items-center justify-between px-6 pb-2 pointer-events-auto" style={{ height: '8vh' }}>
          {/* Timer - bottom left */}
          <div className="font-mono text-white/70 text-sm tracking-widest">
            {displayTime}
          </div>
          {/* Speed indicator - bottom right */}
          <div className="font-mono text-white/40 text-xs tracking-wider flex items-center gap-3">
            <span className="text-white/30 text-[9px]">HOLD FOR SPEED</span>
            <span className="text-white/40">|</span>
            <span className="text-white/80 text-sm tabular-nums" style={{
              textShadow: displaySpeed > 5 ? `0 0 ${(displaySpeed - 5) * 2}px rgba(255,255,255,0.6)` : 'none'
            }}>{displaySpeed.toFixed(2)}x</span>
          </div>
        </div>
      </div>

      {/* Back button — top left corner over letterbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onBack?.() }}
        className="absolute top-4 right-6 text-white/40 hover:text-white/80 text-[10px] font-mono tracking-[0.2em] transition-colors pointer-events-auto z-30"
      >
        ← EXIT
      </button>

      <style>{`
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-2%, 1%); }
          50% { transform: translate(1%, -1%); }
          75% { transform: translate(-1%, 2%); }
        }
      `}</style>
    </div>
  )
}
