import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ─── Audio Engine (pitch DROPS as you approach — time dilation) ──
class BlackHoleAudio {
  constructor() {
    this.ctx = null
    this.master = null
    this.started = false
    this.element = null
    this.lowpass = null
  }

  init() {
    if (this.ctx) return
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.7
    this.lowpass = this.ctx.createBiquadFilter()
    this.lowpass.type = 'lowpass'
    this.lowpass.frequency.value = 22000
    this.lowpass.Q.value = 0.7
    this.lowpass.connect(this.master).connect(this.ctx.destination)
  }

  async start() {
    if (!this.ctx || this.started) return
    this.started = true
    this.element = new Audio('/audio/loop.mp3')
    this.element.loop = true
    this.element.crossOrigin = 'anonymous'
    this.element.volume = 1

    const source = this.ctx.createMediaElementSource(this.element)
    source.connect(this.lowpass)

    try { await this.element.play() } catch(e) { console.warn('Audio play blocked:', e) }
  }

  // approach: 0 (far away) to 1 (at event horizon)
  setApproach(approach) {
    if (!this.element || !this.ctx) return
    // Time dilation: playback rate DROPS as you approach (0.3x at horizon)
    this.element.playbackRate = Math.max(0.3, 1 - approach * 0.7)
    // Muffle high frequencies near horizon (sound bends/distorts)
    const cutoff = Math.max(400, 22000 * (1 - approach * 0.95))
    this.lowpass.frequency.linearRampToValueAtTime(cutoff, this.ctx.currentTime + 0.1)
    // Volume rises slightly
    this.master.gain.linearRampToValueAtTime(0.7 + approach * 0.2, this.ctx.currentTime + 0.1)
  }

  stop() {
    if (this.element) { this.element.pause(); this.element = null }
    this.started = false
  }
}

const bhAudio = new BlackHoleAudio()

// ─── Accretion Disk (glowing ring around the black hole) ─────
function AccretionDisk({ approachRef }) {
  const ref = useRef()

  const { geometry, material } = useMemo(() => {
    const g = new THREE.RingGeometry(2.2, 8, 256, 4)

    const m = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uApproach: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vRadius;
        void main() {
          vUv = uv;
          vRadius = length(position.xy);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uApproach;
        varying vec2 vUv;
        varying float vRadius;

        // Simple noise
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1, 0));
          float c = hash(i + vec2(0, 1));
          float d = hash(i + vec2(1, 1));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }

        void main() {
          // Spiral pattern - angle + log(radius) creates spiral arms
          float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
          float r = vRadius / 8.0;

          // Doppler effect — front side hotter, back side cooler
          float doppler = 0.5 + 0.5 * cos(angle);

          // Rotating turbulence
          float spiral = sin(angle * 4.0 + log(r + 0.1) * 8.0 - uTime * 2.0);
          float turb = noise(vec2(angle * 4.0 - uTime, log(r + 0.1) * 6.0)) * 0.6;

          // Inner edge: bright white-hot, outer: deep red
          float innerHeat = smoothstep(1.0, 0.0, r);
          vec3 hotCore = mix(vec3(1.0, 0.95, 0.8), vec3(1.0, 0.5, 0.1), 1.0 - innerHeat);
          vec3 outerCool = vec3(0.6, 0.1, 0.05);
          vec3 col = mix(outerCool, hotCore, innerHeat);

          // Doppler boost
          col *= 0.5 + doppler * 1.2;

          // Brightness modulation by spiral + turbulence
          float bright = (0.5 + spiral * 0.3 + turb) * (1.0 + innerHeat * 2.0);

          // Fade at outer + inner edges
          float edgeFade = smoothstep(0.0, 0.15, vUv.x) * smoothstep(1.0, 0.85, vUv.x);

          // Approach intensifies
          bright *= 1.0 + uApproach * 1.5;

          gl_FragColor = vec4(col * bright * edgeFade, edgeFade * 0.95);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })

    return { geometry: g, material: m }
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return
    material.uniforms.uTime.value += delta
    material.uniforms.uApproach.value = approachRef.current
    ref.current.rotation.z += delta * 0.05
  })

  return (
    <mesh ref={ref} geometry={geometry} material={material} rotation={[Math.PI / 2 - 0.25, 0, 0]} />
  )
}

// ─── Event Horizon (the black sphere with Einstein ring) ─────
function EventHorizon({ approachRef }) {
  const ringRef = useRef()
  const ringMatRef = useRef()

  useFrame(() => {
    if (ringMatRef.current) {
      ringMatRef.current.opacity = 0.5 + approachRef.current * 0.4
    }
  })

  return (
    <group>
      {/* The black hole itself - pure black sphere */}
      <mesh>
        <sphereGeometry args={[2, 64, 64]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Einstein ring — gravitational lensing of light around horizon */}
      <mesh ref={ringRef}>
        <ringGeometry args={[2.0, 2.25, 128]} />
        <meshBasicMaterial
          ref={ringMatRef}
          color="#ffcc66"
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Outer glow ring (photon sphere) */}
      <mesh>
        <ringGeometry args={[2.25, 2.6, 128]} />
        <meshBasicMaterial
          color="#ff8844"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// ─── Spiraling particles getting sucked into the black hole ──
function InfallingParticles({ approachRef }) {
  const ref = useRef()
  const count = 3000

  const data = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const angles = new Float32Array(count)
    const radii = new Float32Array(count)
    const heights = new Float32Array(count)
    const speeds = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      angles[i] = Math.random() * Math.PI * 2
      radii[i] = 3 + Math.random() * 25
      heights[i] = (Math.random() - 0.5) * 1.5
      speeds[i] = 0.3 + Math.random() * 0.5
      sizes[i] = 0.05 + Math.random() * 0.15

      // Inner: white-hot; outer: orange/red
      const heat = 1 - (radii[i] - 3) / 25
      colors[i * 3] = 1
      colors[i * 3 + 1] = 0.5 + heat * 0.4
      colors[i * 3 + 2] = 0.1 + heat * 0.6
    }
    return { positions, angles, radii, heights, speeds, colors, sizes }
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array
    const approach = approachRef.current
    // Things accelerate as you approach
    const spinMul = 1 + approach * 4
    const inflowMul = 1 + approach * 3

    for (let i = 0; i < count; i++) {
      // Orbital angular velocity increases as radius decreases (Keplerian-ish)
      const angVel = data.speeds[i] * (8 / Math.max(data.radii[i], 2)) * spinMul
      data.angles[i] += angVel * delta

      // Slow inward drift (accretion)
      data.radii[i] -= delta * 0.4 * inflowMul * (1 / Math.max(data.radii[i] / 10, 0.3))
      // Vertical squeeze toward disk plane
      data.heights[i] *= (1 - delta * 0.5 * inflowMul)

      // Reset when consumed
      if (data.radii[i] < 2.4) {
        data.angles[i] = Math.random() * Math.PI * 2
        data.radii[i] = 22 + Math.random() * 8
        data.heights[i] = (Math.random() - 0.5) * 1.5
      }

      pos[i * 3] = Math.cos(data.angles[i]) * data.radii[i]
      pos[i * 3 + 1] = data.heights[i]
      pos[i * 3 + 2] = Math.sin(data.angles[i]) * data.radii[i]
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref} rotation={[-0.25, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={data.positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={data.colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={count} array={data.sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.18}
        sizeAttenuation
        transparent
        opacity={0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ─── Distant background stars ───────────────────────────────
function BackgroundStars() {
  const ref = useRef()
  const count = 2000

  const positions = useMemo(() => {
    const p = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      // Spherical distribution far away
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 60 + Math.random() * 40
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      p[i * 3 + 2] = r * Math.cos(phi)
    }
    return p
  }, [])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.005
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="#ffffff" transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  )
}

// ─── Camera approach (moves toward black hole when holding) ──
function CameraApproach({ approachRef, distanceRef }) {
  const { camera } = useThree()

  useFrame((state, delta) => {
    const approach = approachRef.current
    // Distance from black hole (1.0 far → 0.05 right at horizon)
    const targetDistance = 18 - approach * 14 // 18 → 4 units away
    distanceRef.current += (targetDistance - distanceRef.current) * 0.04

    // Position camera looking at origin from slightly above the disk
    const tilt = 0.2 + approach * 0.15
    camera.position.x = 0
    camera.position.y = distanceRef.current * Math.sin(tilt)
    camera.position.z = distanceRef.current * Math.cos(tilt)
    camera.lookAt(0, 0, 0)

    // Gentle shake at deep approach (gravitational stress)
    if (approach > 0.5) {
      const shake = (approach - 0.5) * 0.1
      camera.position.x += (Math.random() - 0.5) * shake
      camera.position.y += (Math.random() - 0.5) * shake
    }

    // FOV pulses outward at deep approach (tunneling toward singularity)
    const targetFov = 60 + approach * 25
    camera.fov += (targetFov - camera.fov) * 0.05
    camera.updateProjectionMatrix()
  })

  return null
}

// ─── Scene ──────────────────────────────────────────────────
function BlackHoleScene({ approachRef, distanceRef }) {
  return (
    <>
      <color attach="background" args={['#000000']} />
      <BackgroundStars />
      <EventHorizon approachRef={approachRef} />
      <AccretionDisk approachRef={approachRef} />
      <InfallingParticles approachRef={approachRef} />
      <CameraApproach approachRef={approachRef} distanceRef={distanceRef} />
    </>
  )
}

// ─── Main page ──────────────────────────────────────────────
export default function AstroDither({ onBack }) {
  const [entered, setEntered] = useState(false)
  const [startTime, setStartTime] = useState(null)
  const [displayTime, setDisplayTime] = useState('00:00:000')
  const [displayApproach, setDisplayApproach] = useState(0)
  const [displayDilation, setDisplayDilation] = useState(1)
  const [consumed, setConsumed] = useState(false)
  const approachRef = useRef(0)
  const distanceRef = useRef(18)
  const holdingRef = useRef(false)

  const handleEnter = useCallback(() => {
    bhAudio.init()
    bhAudio.start()
    setEntered(true)
    setStartTime(Date.now())
  }, [])

  // ─── Singularity event trigger ──────────────────────────────
  const consumedAtRef = useRef(null)

  // Approach ramp
  useEffect(() => {
    if (!entered) return
    let raf
    const update = () => {
      if (consumed) {
        raf = requestAnimationFrame(update)
        return
      }
      if (holdingRef.current) {
        // Slower than before, takes ~10-12s to hit 100%, eases out near horizon
        const remaining = 1 - approachRef.current
        approachRef.current = Math.min(approachRef.current + 0.012 * remaining + 0.0015, 0.995)
      } else {
        approachRef.current = Math.max(approachRef.current - 0.013, 0)
      }
      setDisplayApproach(approachRef.current)
      bhAudio.setApproach(approachRef.current)

      // Trigger singularity at 99%+ sustained for 600ms
      if (approachRef.current >= 0.99) {
        if (!consumedAtRef.current) consumedAtRef.current = performance.now()
        else if (performance.now() - consumedAtRef.current > 600) {
          setConsumed(true)
          holdingRef.current = false
          // Reset after 8 seconds
          setTimeout(() => {
            approachRef.current = 0
            consumedAtRef.current = null
            setConsumed(false)
          }, 8000)
        }
      } else {
        consumedAtRef.current = null
      }
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [entered, consumed])

  // Timer (with time dilation — clock slows as you approach)
  useEffect(() => {
    if (!startTime) return
    let raf
    let dilatedElapsed = 0
    let lastReal = performance.now()
    const tick = (now) => {
      const dt = now - lastReal
      lastReal = now
      // Dilation factor: 1.0 (normal) → 0.1 (near horizon, time crawls)
      const dilation = Math.max(0.1, 1 - approachRef.current * 0.9)
      dilatedElapsed += dt * dilation
      setDisplayDilation(dilation)

      const elapsed = Math.floor(dilatedElapsed)
      const mins = String(Math.floor(elapsed / 60000)).padStart(2, '0')
      const secs = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0')
      const ms = String(elapsed % 1000).padStart(3, '0')
      setDisplayTime(`${mins}:${secs}:${ms}`)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [startTime])

  // Approach ramp
  useEffect(() => {
    if (!entered) return
    let raf
    const update = () => {
      raf = requestAnimationFrame(update)
    }
    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [entered])

  const handlePointerDown = useCallback(() => { if (!consumed) holdingRef.current = true }, [consumed])
  const handlePointerUp = useCallback(() => { holdingRef.current = false }, [])

  // Entry screen
  if (!entered) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-50 cursor-pointer"
           onClick={handleEnter}>
        <div className="absolute top-6 left-6">
          <button onClick={(e) => { e.stopPropagation(); onBack?.() }}
                  className="text-white/30 hover:text-white/60 text-xs font-mono tracking-wider transition-colors">
            ← BACK
          </button>
        </div>
        <div className="text-center">
          <h1 className="text-white/80 text-2xl sm:text-4xl font-mono tracking-[0.3em] mb-8">
            EVENT HORIZON
          </h1>
          <div className="text-white/30 text-xs font-mono tracking-[0.2em] mb-6 max-w-md">
            You are about to approach a supermassive black hole.<br/>
            Hold to fall in. Release to pull back.<br/>
            Time will slow as you near the singularity.
          </div>
          <div className="text-white/40 text-xs font-mono tracking-[0.2em] animate-pulse border border-white/10 px-6 py-3 inline-block">
            CLICK TO BEGIN DESCENT
          </div>
        </div>
        <div className="absolute bottom-8 text-white/15 text-[9px] font-mono tracking-[0.15em]">
          Schwarzschild radius · accretion disk · time dilation
        </div>
      </div>
    )
  }

  // Redshift intensity: blue at far → red at horizon
  const redshift = displayApproach
  const redshiftOverlay = `radial-gradient(ellipse at center, rgba(255,${Math.floor(150 - redshift * 100)},${Math.floor(80 - redshift * 60)},${redshift * 0.18}) 0%, transparent 70%)`

  return (
    <div className="fixed inset-0 bg-black z-50 select-none cursor-crosshair overflow-hidden"
         onPointerDown={handlePointerDown}
         onPointerUp={handlePointerUp}
         onPointerLeave={handlePointerUp}>

      <Canvas
        camera={{ position: [0, 4, 18], fov: 60, near: 0.1, far: 200 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
      >
        <BlackHoleScene approachRef={approachRef} distanceRef={distanceRef} />
      </Canvas>

      {/* Letterbox bars */}
      <div className="absolute top-0 left-0 right-0 bg-black pointer-events-none z-20"
           style={{ height: '8vh', boxShadow: '0 4px 20px rgba(0,0,0,0.6)' }} />
      <div className="absolute bottom-0 left-0 right-0 bg-black pointer-events-none z-20"
           style={{ height: '8vh', boxShadow: '0 -4px 20px rgba(0,0,0,0.6)' }} />

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none z-10"
           style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.85) 100%)' }} />

      {/* Redshift overlay */}
      <div className="absolute inset-0 pointer-events-none z-10"
           style={{ background: redshiftOverlay, transition: 'background 0.3s' }} />

      {/* Gravitational lens distortion fringe at deep approach */}
      {displayApproach > 0.5 && (
        <div className="absolute inset-0 pointer-events-none z-10 mix-blend-screen"
             style={{
               background: `radial-gradient(circle at 50% 50%, transparent ${30 - displayApproach * 15}%, rgba(255,180,80,${(displayApproach - 0.5) * 0.4}) ${35 - displayApproach * 15}%, transparent ${40 - displayApproach * 10}%)`,
               opacity: (displayApproach - 0.5) * 2,
             }} />
      )}

      {/* Film grain */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.07] mix-blend-overlay"
           style={{
             backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
             animation: 'grain 0.5s steps(4) infinite',
           }} />

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-30">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-2 pointer-events-auto" style={{ height: '8vh' }}>
          <div className="font-mono text-white/60 text-[10px] tracking-[0.3em] flex items-center gap-3">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            REC · @kranthi · LAB
          </div>
          <div className="font-mono text-white/50 text-[10px] tracking-[0.3em]">
            EVENT HORIZON · BLACK HOLE PROBE
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-6 pb-2 pointer-events-auto" style={{ height: '8vh' }}>
          <div className="flex flex-col gap-0.5">
            <div className="font-mono text-white/70 text-sm tracking-widest">{displayTime}</div>
            <div className="font-mono text-white/30 text-[9px] tracking-wider">
              TIME DILATION · {displayDilation.toFixed(2)}x
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <div className="font-mono text-white/40 text-xs tracking-wider flex items-center gap-3">
              <span className="text-white/30 text-[9px]">HOLD TO APPROACH</span>
              <span className="text-white/40">|</span>
              <span className="text-white/80 text-sm tabular-nums" style={{
                textShadow: displayApproach > 0.5 ? `0 0 ${displayApproach * 20}px rgba(255,180,80,0.8)` : 'none'
              }}>{(displayApproach * 100).toFixed(0)}%</span>
            </div>
            <div className="font-mono text-white/30 text-[9px] tracking-wider">
              GRAVITY WELL DEPTH
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onBack?.() }}
        className="absolute top-4 right-6 text-white/40 hover:text-white/80 text-[10px] font-mono tracking-[0.2em] transition-colors pointer-events-auto z-30">
        ← EXIT
      </button>

      {/* Singularity event overlay */}
      {consumed && (
        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center"
             style={{ animation: 'singularity 8s ease-in-out forwards' }}>
          <div className="absolute inset-0 bg-white" style={{ animation: 'flash 0.6s ease-out' }} />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at center, rgba(255,200,100,0.4) 0%, rgba(0,0,0,0.95) 60%)',
            animation: 'pulse-deep 8s ease-in-out',
          }} />
          <div className="relative text-center px-8" style={{ animation: 'fadeInMsg 8s ease-in-out' }}>
            <div className="font-mono text-white/40 text-[10px] tracking-[0.5em] mb-6">
              ▸ EVENT HORIZON CROSSED ▸
            </div>
            <h2 className="font-mono text-white text-2xl sm:text-4xl tracking-[0.2em] mb-6"
                style={{ textShadow: '0 0 30px rgba(255,180,80,0.6)' }}>
              YOU ARE THE SINGULARITY
            </h2>
            <div className="font-mono text-white/50 text-xs tracking-[0.15em] max-w-md mx-auto leading-relaxed">
              Spacetime has collapsed.<br/>
              All information you carried is now stored on a 2D surface<br/>
              area equal to your former volume.<br/>
              <span className="text-white/30">— holographic principle, 1993</span>
            </div>
            <div className="mt-8 font-mono text-white/30 text-[9px] tracking-[0.3em] animate-pulse">
              REINITIALIZING IN COSMIC TIME...
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-2%, 1%); }
          50% { transform: translate(1%, -1%); }
          75% { transform: translate(-1%, 2%); }
        }
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes singularity {
          0% { opacity: 0; }
          5% { opacity: 1; }
          90% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes pulse-deep {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes fadeInMsg {
          0% { opacity: 0; transform: scale(0.9); }
          15% { opacity: 1; transform: scale(1); }
          85% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}
