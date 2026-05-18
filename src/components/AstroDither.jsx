import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Audio Engine (procedural drone + analyzer for reactivity) ──
class AstroAudio {
  constructor() {
    this.ctx = null
    this.analyser = null
    this.dataArray = null
    this.master = null
    this.nodes = []
    this.started = false
  }

  init() {
    if (this.ctx) return
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.6
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 256
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    this.master.connect(this.analyser)
    this.analyser.connect(this.ctx.destination)
  }

  start() {
    if (!this.ctx || this.started) return
    this.started = true
    const now = this.ctx.currentTime

    // Deep bass drone
    const bassFreqs = [40, 60, 80]
    bassFreqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = f
      osc.detune.value = (Math.random() - 0.5) * 6
      gain.gain.value = 0
      gain.gain.linearRampToValueAtTime(0.08, now + 3)
      osc.connect(gain).connect(this.master)
      osc.start(now)
      this.nodes.push(osc, gain)
    })

    // Mid atmosphere pad
    const padOsc = this.ctx.createOscillator()
    const padFilter = this.ctx.createBiquadFilter()
    const padGain = this.ctx.createGain()
    padOsc.type = 'sawtooth'
    padOsc.frequency.value = 110
    padFilter.type = 'lowpass'
    padFilter.frequency.value = 400
    padFilter.Q.value = 4
    padGain.gain.value = 0
    padGain.gain.linearRampToValueAtTime(0.03, now + 5)
    padOsc.connect(padFilter).connect(padGain).connect(this.master)
    padOsc.start(now)
    // LFO on filter
    const lfo = this.ctx.createOscillator()
    const lfoGain = this.ctx.createGain()
    lfo.frequency.value = 0.1
    lfoGain.gain.value = 200
    lfo.connect(lfoGain).connect(padFilter.frequency)
    lfo.start(now)
    this.nodes.push(padOsc, lfo, padGain)

    // High shimmer
    const shimmer = this.ctx.createOscillator()
    const shimGain = this.ctx.createGain()
    shimmer.type = 'sine'
    shimmer.frequency.value = 880
    shimGain.gain.value = 0
    shimGain.gain.linearRampToValueAtTime(0.01, now + 6)
    shimmer.connect(shimGain).connect(this.master)
    shimmer.start(now)
    this.nodes.push(shimmer, shimGain)
  }

  getFrequencyData() {
    if (!this.analyser) return 0
    this.analyser.getByteFrequencyData(this.dataArray)
    let sum = 0
    for (let i = 0; i < this.dataArray.length; i++) sum += this.dataArray[i]
    return sum / (this.dataArray.length * 255) // normalized 0-1
  }

  getBass() {
    if (!this.analyser) return 0
    this.analyser.getByteFrequencyData(this.dataArray)
    let sum = 0
    for (let i = 0; i < 8; i++) sum += this.dataArray[i]
    return sum / (8 * 255)
  }
}

const astroAudio = new AstroAudio()

// ─── Dither shader material ─────────────────────────────────
const DitherShader = {
  vertexShader: `
    uniform float uTime;
    uniform float uAudio;
    uniform float uSpeed;
    uniform vec2 uMouse;
    
    attribute float aRandom;
    varying float vRandom;
    varying vec3 vPosition;
    varying float vDist;
    
    void main() {
      vRandom = aRandom;
      vec3 pos = position;
      
      // Mouse influence
      float mouseDist = length(pos.xy - uMouse * 3.0);
      float mouseInfluence = smoothstep(2.0, 0.0, mouseDist);
      
      // Fluid-like displacement
      float wave = sin(pos.x * 2.0 + uTime * 0.5 * uSpeed) * cos(pos.y * 1.5 + uTime * 0.3 * uSpeed);
      pos.z += wave * 0.3 * (1.0 + uAudio * 2.0);
      pos.x += sin(uTime * 0.2 + pos.y * 3.0) * 0.1 * uSpeed;
      pos.y += cos(uTime * 0.15 + pos.x * 2.5) * 0.08 * uSpeed;
      
      // Mouse repulsion
      pos.xy += normalize(pos.xy - uMouse * 3.0) * mouseInfluence * 0.5;
      
      // Audio pulse
      pos *= 1.0 + uAudio * 0.15;
      
      vPosition = pos;
      vDist = mouseDist;
      
      vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
      gl_Position = projectionMatrix * mvPos;
      gl_PointSize = (3.0 + aRandom * 2.0 + mouseInfluence * 4.0) * (1.0 / -mvPos.z) * 80.0;
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uAudio;
    
    varying float vRandom;
    varying vec3 vPosition;
    varying float vDist;
    
    // Dithering pattern (Bayer 4x4)
    float dither4x4(vec2 pos) {
      int x = int(mod(pos.x, 4.0));
      int y = int(mod(pos.y, 4.0));
      int index = x + y * 4;
      float limit = 0.0;
      if (index == 0) limit = 0.0625;
      else if (index == 1) limit = 0.5625;
      else if (index == 2) limit = 0.1875;
      else if (index == 3) limit = 0.6875;
      else if (index == 4) limit = 0.8125;
      else if (index == 5) limit = 0.3125;
      else if (index == 6) limit = 0.9375;
      else if (index == 7) limit = 0.4375;
      else if (index == 8) limit = 0.25;
      else if (index == 9) limit = 0.75;
      else if (index == 10) limit = 0.125;
      else if (index == 11) limit = 0.625;
      else if (index == 12) limit = 1.0;
      else if (index == 13) limit = 0.5;
      else if (index == 14) limit = 0.875;
      else limit = 0.375;
      return limit;
    }
    
    void main() {
      // Circular point
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);
      if (dist > 0.5) discard;
      
      // Base color — cool blue/purple palette
      vec3 color = mix(
        vec3(0.2, 0.4, 1.0),
        vec3(0.8, 0.3, 1.0),
        vRandom
      );
      
      // Add warmth based on audio
      color = mix(color, vec3(1.0, 0.6, 0.2), uAudio * 0.4);
      
      // Dithering
      float dith = dither4x4(gl_FragCoord.xy);
      float brightness = 1.0 - dist * 1.5;
      brightness = step(dith * 0.6, brightness);
      
      // Edge glow
      float glow = smoothstep(0.5, 0.2, dist);
      
      gl_FragColor = vec4(color * brightness * glow, glow * 0.9);
    }
  `
}

// ─── Particle fluid system ──────────────────────────────────
function FluidParticles({ speed }) {
  const ref = useRef()
  const mouseRef = useRef(new THREE.Vector2(0, 0))
  const count = 8000

  const { positions, randoms } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const rand = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      // Sphere distribution
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 1.5 + Math.random() * 1.5
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
      rand[i] = Math.random()
    }
    return { positions: pos, randoms: rand }
  }, [])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAudio: { value: 0 },
    uSpeed: { value: 1 },
    uMouse: { value: new THREE.Vector2(0, 0) },
  }), [])

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useFrame((state, delta) => {
    if (!ref.current) return
    const mat = ref.current.material
    mat.uniforms.uTime.value += delta * speed
    mat.uniforms.uAudio.value = astroAudio.getBass()
    mat.uniforms.uSpeed.value += (speed - mat.uniforms.uSpeed.value) * 0.05
    mat.uniforms.uMouse.value.lerp(mouseRef.current, 0.08)

    // Slow auto-rotation
    ref.current.rotation.y += delta * 0.05 * speed
    ref.current.rotation.x += delta * 0.02 * speed
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={DitherShader.vertexShader}
        fragmentShader={DitherShader.fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ─── Background particles (ambient depth) ───────────────────
function BackgroundDust() {
  const ref = useRef()
  const count = 3000

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return pos
  }, [])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.01
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#4060ff" transparent opacity={0.3} sizeAttenuation depthWrite={false} />
    </points>
  )
}

// ─── Scene ──────────────────────────────────────────────────
function AstroScene({ speed }) {
  return (
    <>
      <color attach="background" args={['#050508']} />
      <FluidParticles speed={speed} />
      <BackgroundDust />
    </>
  )
}

// ─── Timer display ──────────────────────────────────────────
function Timer({ startTime }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const hrs = String(Math.floor(elapsed / 3600)).padStart(2, '0')
  const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0')
  const secs = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="font-mono text-white/60 text-4xl sm:text-6xl tracking-widest select-none">
      <span>{hrs}</span>
      <span className="mx-1 animate-pulse">:</span>
      <span>{mins}</span>
      <span className="mx-1 animate-pulse">:</span>
      <span>{secs}</span>
    </div>
  )
}

// ─── Main AstroDither Page ──────────────────────────────────
export default function AstroDither({ onBack }) {
  const [entered, setEntered] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [speed, setSpeed] = useState(1)
  const [holding, setHolding] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  const handleEnter = useCallback(() => {
    astroAudio.init()
    astroAudio.start()
    setEntered(true)
    setStartTime(Date.now())
  }, [])

  const handlePointerDown = useCallback(() => {
    setHolding(true)
    setSpeed(3)
  }, [])

  const handlePointerUp = useCallback(() => {
    setHolding(false)
    setSpeed(1)
  }, [])

  const handleClick = useCallback(() => {
    if (!holding) {
      setSpeed(s => s === 1 ? 2 : 1)
    }
  }, [holding])

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
            [:: CLICK TO ENTER + ENABLE AUDIO ::]
          </div>
        </div>
        <div className="absolute bottom-8 text-white/15 text-[9px] font-mono tracking-[0.15em]">
          A WebGL particle experiment
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#050508] z-50 select-none"
         onPointerDown={handlePointerDown}
         onPointerUp={handlePointerUp}
         onPointerLeave={handlePointerUp}>
      
      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: false }}
      >
        <AstroScene speed={speed} />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-5 pointer-events-auto">
          <button onClick={(e) => { e.stopPropagation(); onBack?.() }}
                  className="text-white/30 hover:text-white/60 text-xs font-mono tracking-wider transition-colors">
            ← BACK
          </button>
          <div className="text-white/40 text-[10px] font-mono tracking-[0.3em]">
            ASTRO DITHER
          </div>
          <button onClick={(e) => { e.stopPropagation(); setShowInfo(!showInfo) }}
                  className="text-white/30 hover:text-white/60 text-xs font-mono transition-colors">
            {showInfo ? 'CLOSE' : 'INFO'}
          </button>
        </div>

        {/* Center timer */}
        <div className="flex-1 flex items-center justify-center">
          <Timer startTime={startTime} />
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-6 py-5">
          <div className="text-white/20 text-[9px] font-mono tracking-[0.15em]">
            HOLD FOR SPEED · CLICK FOR SPEED
          </div>
          <div className="text-white/30 text-xs font-mono">
            {speed.toFixed(2)}x
          </div>
        </div>
      </div>

      {/* Speed indicator ring */}
      {speed > 1 && (
        <div className="absolute inset-0 pointer-events-none border-2 border-white/5 rounded-none animate-pulse" />
      )}

      {/* Info panel */}
      {showInfo && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto z-10"
             onClick={() => setShowInfo(false)}>
          <div className="max-w-md text-center px-8" onClick={e => e.stopPropagation()}>
            <h2 className="text-white/80 font-mono text-lg tracking-[0.2em] mb-6">ASTRO DITHER</h2>
            <p className="text-white/40 text-sm font-mono leading-relaxed mb-4">
              An audio-reactive WebGL particle experiment. 8,000 particles form a fluid sphere 
              that responds to your mouse movement and the procedural audio drone.
            </p>
            <p className="text-white/30 text-xs font-mono leading-relaxed mb-6">
              Custom dithering shader • Fluid displacement • Audio reactivity • 
              Mouse interaction • Additive blending
            </p>
            <div className="text-white/15 text-[9px] font-mono tracking-wider">
              [signal. lost. beauty. found. digital. chaos.]
            </div>
            <button onClick={() => setShowInfo(false)}
                    className="mt-8 text-white/30 hover:text-white/60 text-xs font-mono tracking-wider border border-white/10 px-4 py-2 transition-colors">
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
