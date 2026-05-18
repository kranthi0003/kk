import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Audio Engine (looping drone that speeds up with travel) ──
class WarpAudio {
  constructor() {
    this.ctx = null
    this.master = null
    this.oscillators = []
    this.started = false
    this.playbackRate = 1
    this.noiseSource = null
    this.noiseGain = null
    this.bassGain = null
  }

  init() {
    if (this.ctx) return
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.5
    this.master.connect(this.ctx.destination)
  }

  start() {
    if (!this.ctx || this.started) return
    this.started = true
    const now = this.ctx.currentTime

    // Deep bass drone (looping feel)
    const bassFreqs = [55, 82.5, 110]
    bassFreqs.forEach(f => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      gain.gain.value = 0
      gain.gain.linearRampToValueAtTime(0.07, now + 2)
      osc.connect(gain).connect(this.master)
      osc.start(now)
      this.oscillators.push({ osc, gain, baseFreq: f })
    })

    // Mid pad with filter sweep
    const pad = this.ctx.createOscillator()
    const padFilter = this.ctx.createBiquadFilter()
    const padGain = this.ctx.createGain()
    pad.type = 'sawtooth'
    pad.frequency.value = 165
    padFilter.type = 'lowpass'
    padFilter.frequency.value = 300
    padFilter.Q.value = 6
    padGain.gain.value = 0
    padGain.gain.linearRampToValueAtTime(0.025, now + 3)
    pad.connect(padFilter).connect(padGain).connect(this.master)
    pad.start(now)
    this.oscillators.push({ osc: pad, gain: padGain, baseFreq: 165 })

    // LFO for filter sweep
    const lfo = this.ctx.createOscillator()
    const lfoGain = this.ctx.createGain()
    lfo.frequency.value = 0.15
    lfoGain.gain.value = 150
    lfo.connect(lfoGain).connect(padFilter.frequency)
    lfo.start(now)

    // Warp noise (white noise through bandpass for rushing wind feel)
    const bufferSize = this.ctx.sampleRate * 2
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1
    this.noiseSource = this.ctx.createBufferSource()
    this.noiseSource.buffer = noiseBuffer
    this.noiseSource.loop = true
    const noiseFilter = this.ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 800
    noiseFilter.Q.value = 1.5
    this.noiseGain = this.ctx.createGain()
    this.noiseGain.gain.value = 0.02
    this.noiseSource.connect(noiseFilter).connect(this.noiseGain).connect(this.master)
    this.noiseSource.start(now)
  }

  setSpeed(speed) {
    if (!this.ctx || !this.started) return
    this.playbackRate = speed
    const now = this.ctx.currentTime
    // Pitch up oscillators with speed
    this.oscillators.forEach(({ osc, baseFreq }) => {
      osc.frequency.linearRampToValueAtTime(baseFreq * (0.8 + speed * 0.2), now + 0.1)
    })
    // Increase noise volume with speed (rushing wind)
    if (this.noiseGain) {
      this.noiseGain.gain.linearRampToValueAtTime(0.02 + (speed - 1) * 0.04, now + 0.1)
    }
    // Increase master slightly
    if (this.master) {
      this.master.gain.linearRampToValueAtTime(0.5 + (speed - 1) * 0.1, now + 0.1)
    }
  }

  stop() {
    this.oscillators.forEach(({ osc }) => { try { osc.stop() } catch(e){} })
    if (this.noiseSource) try { this.noiseSource.stop() } catch(e){}
    this.started = false
    this.oscillators = []
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

// ─── Scene ──────────────────────────────────────────────────
function WarpScene({ speedRef }) {
  return (
    <>
      <color attach="background" args={['#050508']} />
      <fog attach="fog" args={['#050508', 40, 80]} />
      <WarpParticles speedRef={speedRef} />
      <WarpStreaks speedRef={speedRef} />
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
  const animRef = useRef(null)

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
        speedRef.current = Math.min(speedRef.current + 0.03, 5)
      } else {
        speedRef.current = Math.max(speedRef.current - 0.04, 1)
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
    <div className="fixed inset-0 bg-[#050508] z-50 select-none cursor-crosshair"
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

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-5 pointer-events-auto">
          <div className="font-mono text-white/50 text-xs tracking-[0.2em]">
            @kranthi · LAB
          </div>
          <div className="font-mono text-white/50 text-xs tracking-[0.2em]">
            ASTRO DITHER
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-6 py-5">
          {/* Timer - bottom left */}
          <div className="font-mono text-white/60 text-sm tracking-widest">
            {displayTime}
          </div>
          {/* Speed indicator - bottom right */}
          <div className="font-mono text-white/40 text-xs tracking-wider flex items-center gap-3">
            <span className="text-white/20">HOLD FOR SPEED</span>
            <span className="text-white/50">|</span>
            <span className="text-white/60">{displaySpeed.toFixed(2)}x</span>
          </div>
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={(e) => { e.stopPropagation(); onBack?.() }}
        className="absolute top-5 left-6 text-white/20 hover:text-white/50 text-xs font-mono tracking-wider transition-colors pointer-events-auto z-10"
        style={{ display: 'none' }}
      >
        ← BACK
      </button>
    </div>
  )
}
