import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls, Html, Stars } from '@react-three/drei'
import * as THREE from 'three'

/* ══════════════════════════════════════════════════════════════
   NASA EYES-STYLE SOLAR SYSTEM with real planet textures
   Each real planet maps to a portfolio section
   ══════════════════════════════════════════════════════════════ */

const TEX = (name) => `${import.meta.env.BASE_URL || '/'}textures/planets/${name}`

// Real planet data with NASA facts
const PLANETS = [
  {
    id: 'mercury', name: 'Mercury',
    orbit: 14, eccentricity: 0.21, inclination: 0.12,
    size: 1.2, speed: 0.16, tilt: 0.03,
    texture: 'mercury.jpg', color: '#a8a29e', atmosphere: null,
    moons: 0, ring: null,
    tagline: 'Swift messenger of the gods',
    facts: [
      'Smallest planet in our solar system — only slightly larger than Earth\'s Moon',
      'A year on Mercury (one orbit) takes just 88 Earth days',
      'A single day on Mercury (one rotation) takes 59 Earth days',
      'Temperatures swing from -180°C at night to 430°C during the day',
      'Has no atmosphere to retain heat or burn up incoming meteoroids',
      'Surface is covered in craters, very similar to our Moon',
      'Most eccentric orbit of all the planets (e = 0.205)',
    ],
    stats: { diameter: '4,879 km', day: '59 Earth days', year: '88 Earth days', moons: 0, distance: '57.9M km from Sun' },
  },
  {
    id: 'venus', name: 'Venus',
    orbit: 20, eccentricity: 0.007, inclination: 0.06,
    size: 1.5, speed: 0.12, tilt: 0.04,
    texture: 'venus.jpg', color: '#e9d8a6', atmosphere: '#fde68a',
    moons: 0, ring: null,
    tagline: 'Earth\'s scorching twin',
    facts: [
      'Hottest planet in our solar system at 465°C, despite being farther than Mercury',
      'Atmosphere is 96% CO₂, with crushing pressure 92× that of Earth',
      'Rotates BACKWARDS compared to most planets (retrograde rotation)',
      'A day on Venus is longer than its year — 243 vs 225 Earth days',
      'Shrouded in thick sulfuric acid clouds that reflect sunlight',
      'Often called Earth\'s "sister planet" because of similar size',
      'Brightest natural object in our night sky after the Moon',
    ],
    stats: { diameter: '12,104 km', day: '243 Earth days', year: '225 Earth days', moons: 0, distance: '108.2M km from Sun' },
  },
  {
    id: 'earth', name: 'Earth',
    orbit: 28, eccentricity: 0.017, inclination: 0.0,
    size: 1.6, speed: 0.10, tilt: 0.41,
    texture: 'earth.jpg', clouds: 'earth_clouds.jpg',
    bump: 'earth_bump.jpg', specular: 'earth_spec.jpg', night: 'earth_night.jpg',
    color: '#60a5fa', atmosphere: '#3b82f6',
    moons: 1, ring: null,
    tagline: 'The pale blue dot',
    facts: [
      'Only known planet with life — over 8.7 million species',
      '71% of Earth\'s surface is covered by water (oceans, lakes, ice)',
      'Atmosphere is 78% nitrogen and 21% oxygen — perfect for life',
      'Has a single natural satellite, the Moon, which stabilizes our axis',
      'Magnetic field protects us from harmful solar radiation',
      'Earth\'s core temperature rivals the surface of the Sun (~6000°C)',
      'Spins at 1,670 km/h at the equator — you don\'t feel it because everything moves with you',
    ],
    stats: { diameter: '12,742 km', day: '24 hours', year: '365.25 days', moons: 1, distance: '149.6M km from Sun' },
  },
  {
    id: 'mars', name: 'Mars',
    orbit: 36, eccentricity: 0.093, inclination: 0.032,
    size: 1.3, speed: 0.08, tilt: 0.44,
    texture: 'mars.jpg', bump: 'mars_bump.jpg',
    color: '#e85d3f', atmosphere: '#fb923c',
    moons: 2, ring: null,
    tagline: 'The red planet',
    facts: [
      'Home to Olympus Mons — the largest volcano in the solar system (3× height of Everest)',
      'Hosts the deepest canyon known: Valles Marineris is 4,000 km long, 7 km deep',
      'Red color comes from iron oxide (rust) on its surface',
      'Has two tiny moons: Phobos and Deimos (both possibly captured asteroids)',
      'Days are similar to Earth: 24 hours 37 minutes',
      'Polar ice caps made of water and frozen CO₂ (dry ice)',
      'NASA\'s Perseverance and Curiosity rovers are still exploring it',
    ],
    stats: { diameter: '6,779 km', day: '24h 37m', year: '687 Earth days', moons: 2, distance: '227.9M km from Sun' },
  },
  {
    id: 'jupiter', name: 'Jupiter',
    orbit: 50, eccentricity: 0.048, inclination: 0.022,
    size: 3.5, speed: 0.045, tilt: 0.05,
    texture: 'jupiter.jpg', color: '#fcd34d', atmosphere: '#f59e0b',
    moons: 4, ring: null,
    tagline: 'King of the planets',
    facts: [
      'Largest planet in our solar system — could fit 1,300 Earths inside',
      'The Great Red Spot is a storm that\'s been raging for at least 350 years',
      'Has 95 known moons — including Ganymede, the largest moon in the solar system',
      'Spins so fast that one day lasts just under 10 hours',
      'Acts as our solar system\'s "vacuum cleaner" — its gravity deflects asteroids',
      'Made mostly of hydrogen and helium, like a tiny star that failed to ignite',
      'Has a faint ring system, only discovered in 1979',
    ],
    stats: { diameter: '139,820 km', day: '9h 55m', year: '11.9 Earth years', moons: 95, distance: '778.5M km from Sun' },
  },
  {
    id: 'saturn', name: 'Saturn',
    orbit: 65, eccentricity: 0.056, inclination: 0.043,
    size: 3.0, speed: 0.030, tilt: 0.47,
    texture: 'saturn.jpg', color: '#fde68a', atmosphere: '#facc15',
    moons: 3, ring: { texture: 'saturn_ring.png', inner: 1.5, outer: 2.6 },
    tagline: 'The ringed jewel',
    facts: [
      'Famous for its stunning ring system made of ice and rock particles',
      'Rings extend 280,000 km wide but are only 10 meters thick in places',
      'Has 146 known moons — including Titan, larger than Mercury',
      'Density so low it would float in water (if you found a big enough bathtub)',
      'Has hexagonal storms at its north pole — a 30,000 km wide jet stream',
      'Winds can reach 1,800 km/h, nine times faster than Earth hurricanes',
      'Titan has lakes of liquid methane and a thick nitrogen atmosphere',
    ],
    stats: { diameter: '116,460 km', day: '10h 33m', year: '29.5 Earth years', moons: 146, distance: '1.43B km from Sun' },
  },
  {
    id: 'uranus', name: 'Uranus',
    orbit: 80, eccentricity: 0.046, inclination: 0.013,
    size: 2.0, speed: 0.020, tilt: 1.71,
    texture: 'uranus.jpg', color: '#a5f3fc', atmosphere: '#67e8f9',
    moons: 1, ring: { color: '#a5f3fc', inner: 1.4, outer: 1.55 },
    tagline: 'The sideways planet',
    facts: [
      'Rotates on its side — axial tilt is 98° (essentially rolling around the Sun)',
      'Each pole experiences 42 years of continuous sunlight, then 42 years of darkness',
      'Coldest planetary atmosphere in the solar system: -224°C',
      'Has 13 faint rings made of dark dust and ice',
      'Blue-green color from methane in the atmosphere absorbing red light',
      'Discovered in 1781 by William Herschel — the first planet found with a telescope',
      'Has 27 known moons, all named after Shakespeare and Pope characters',
    ],
    stats: { diameter: '50,724 km', day: '17h 14m', year: '84 Earth years', moons: 27, distance: '2.87B km from Sun' },
  },
  {
    id: 'neptune', name: 'Neptune',
    orbit: 95, eccentricity: 0.009, inclination: 0.030,
    size: 1.9, speed: 0.012, tilt: 0.49,
    texture: 'neptune.jpg', color: '#60a5fa', atmosphere: '#3b82f6',
    moons: 1, ring: null,
    tagline: 'The windy ice giant',
    facts: [
      'Farthest planet from the Sun — at 4.5 billion km away',
      'Has the fastest winds in the solar system: up to 2,100 km/h (supersonic)',
      'Discovered by mathematics before observation — predicted by gravity equations in 1846',
      'Takes 165 Earth years to orbit the Sun once',
      'Deep blue color from methane absorbing red wavelengths',
      'Has 14 moons — Triton orbits backwards and may be a captured Kuiper Belt object',
      'Only one spacecraft has ever visited: Voyager 2 in 1989',
    ],
    stats: { diameter: '49,244 km', day: '16h 6m', year: '165 Earth years', moons: 14, distance: '4.5B km from Sun' },
  },
]

// Inject deterministic orbital rotation (longitude of ascending node) per planet
PLANETS.forEach((p, i) => {
  // Spread orbit rotations to make starting positions feel natural & non-aligned
  p.orbitRotation = (i * 0.7 + i * i * 0.13) % (Math.PI * 2)
})

// Per-planet musical pitch (in Hz). Inner planets = higher, outer = lower
const PLANET_NOTES = {
  mercury: 880,    // A5 — quick & bright
  venus: 698.5,    // F5 — warm
  earth: 587.3,    // D5 — home note
  mars: 523.3,     // C5 — red & strong
  jupiter: 392,    // G4 — massive
  saturn: 329.6,   // E4 — graceful
  uranus: 261.6,   // C4 — cold
  neptune: 196,    // G3 — deep & distant
}

// ─── Web Audio: rich ambient theme + UI sound palette ────────
class SpaceAudio {
  constructor() {
    this.ctx = null
    this.master = null
    this.musicNodes = []
    this.muted = false
    this.started = false
    this.sparkleTimer = null
    this.MASTER_VOL = 0.85 // overall volume (was 0.5)
  }

  init() {
    if (this.ctx) return
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.0
    // Gentle compressor for headroom
    const comp = this.ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.knee.value = 12
    comp.ratio.value = 3
    comp.attack.value = 0.01
    comp.release.value = 0.2
    this.master.connect(comp).connect(this.ctx.destination)
  }

  startTheme() {
    if (!this.ctx || this.started) return
    this.started = true
    const now = this.ctx.currentTime

    // ─── Deep space drone — richer harmonic stack ───────────
    const droneFreqs = [55, 82.4, 110, 138.6, 165, 220] // A1, E2, A2, C#3, E3, A3 (A minor 7 voicing)
    droneFreqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const filter = this.ctx.createBiquadFilter()
      osc.type = ['sine', 'triangle', 'sine'][i % 3]
      osc.frequency.value = f
      osc.detune.value = (Math.random() - 0.5) * 8
      filter.type = 'lowpass'
      filter.frequency.value = 700 + i * 80
      filter.Q.value = 2
      gain.gain.value = 0
      osc.connect(filter).connect(gain).connect(this.master)
      osc.start(now)
      gain.gain.exponentialRampToValueAtTime(0.07 + i * 0.008, now + 4 + i * 0.4)
      // LFO modulation
      const lfo = this.ctx.createOscillator()
      const lfoGain = this.ctx.createGain()
      lfo.frequency.value = 0.05 + i * 0.025
      lfoGain.gain.value = 3 + i * 0.5
      lfo.connect(lfoGain).connect(osc.frequency)
      lfo.start(now)
      this.musicNodes.push(osc, lfo, gain)
    })

    // ─── Shimmer pad with filter sweep ──────────────────────
    const shimmerOsc = this.ctx.createOscillator()
    const shimmerGain = this.ctx.createGain()
    const shimmerFilter = this.ctx.createBiquadFilter()
    shimmerOsc.type = 'sawtooth'
    shimmerOsc.frequency.value = 880
    shimmerFilter.type = 'lowpass'
    shimmerFilter.frequency.value = 1200
    shimmerFilter.Q.value = 8
    shimmerGain.gain.value = 0
    shimmerOsc.connect(shimmerFilter).connect(shimmerGain).connect(this.master)
    shimmerOsc.start(now)
    shimmerGain.gain.exponentialRampToValueAtTime(0.015, now + 6)
    const sweepLfo = this.ctx.createOscillator()
    const sweepGain = this.ctx.createGain()
    sweepLfo.frequency.value = 0.04
    sweepGain.gain.value = 800
    sweepLfo.connect(sweepGain).connect(shimmerFilter.frequency)
    sweepLfo.start(now)
    this.musicNodes.push(shimmerOsc, sweepLfo, shimmerGain)

    // ─── Solar wind — filtered noise bed ────────────────────
    const windBuf = this.ctx.createBuffer(1, this.ctx.sampleRate * 4, this.ctx.sampleRate)
    const wd = windBuf.getChannelData(0)
    for (let i = 0; i < wd.length; i++) wd[i] = (Math.random() * 2 - 1) * 0.4
    const wind = this.ctx.createBufferSource()
    wind.buffer = windBuf
    wind.loop = true
    const windFilter = this.ctx.createBiquadFilter()
    windFilter.type = 'bandpass'
    windFilter.frequency.value = 600
    windFilter.Q.value = 1.5
    const windGain = this.ctx.createGain()
    windGain.gain.value = 0
    wind.connect(windFilter).connect(windGain).connect(this.master)
    wind.start(now)
    windGain.gain.exponentialRampToValueAtTime(0.025, now + 8)
    // Slow wind modulation
    const windLfo = this.ctx.createOscillator()
    const windLfoGain = this.ctx.createGain()
    windLfo.frequency.value = 0.08
    windLfoGain.gain.value = 200
    windLfo.connect(windLfoGain).connect(windFilter.frequency)
    windLfo.start(now)
    this.musicNodes.push(wind, windLfo, windGain)

    // Fade master in
    this.master.gain.linearRampToValueAtTime(this.muted ? 0 : this.MASTER_VOL, now + 3)

    // Ambient sparkles every 4-10s
    this._scheduleSparkle()
  }

  _scheduleSparkle() {
    if (this.sparkleTimer) clearTimeout(this.sparkleTimer)
    const next = 4000 + Math.random() * 6000
    this.sparkleTimer = setTimeout(() => {
      this.sparkle()
      this._scheduleSparkle()
    }, next)
  }

  // ─── Random pentatonic sparkle (ambient twinkle) ───────────
  sparkle() {
    if (!this.ctx || this.muted) return
    const now = this.ctx.currentTime
    // Pentatonic scale notes (A minor)
    const notes = [880, 988, 1175, 1319, 1568, 1760, 1975, 2349]
    const f = notes[Math.floor(Math.random() * notes.length)]
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = f
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.06, now + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5)
    osc.connect(gain).connect(this.master)
    osc.start(now)
    osc.stop(now + 1.6)
  }

  // ─── Soft UI click ─────────────────────────────────────────
  click() {
    if (!this.ctx || this.muted) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(1400, now)
    osc.frequency.exponentialRampToValueAtTime(500, now + 0.08)
    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
    osc.connect(gain).connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.14)
  }

  // ─── Hover blip ────────────────────────────────────────────
  hover() {
    if (!this.ctx || this.muted) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 1000
    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
    osc.connect(gain).connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.07)
  }

  // ─── Whoosh on planet select (filtered noise burst) ────────
  whoosh() {
    if (!this.ctx || this.muted) return
    const now = this.ctx.currentTime
    const bufferSize = this.ctx.sampleRate * 0.8
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      const env = 1 - i / bufferSize
      data[i] = (Math.random() * 2 - 1) * env
    }
    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(150, now)
    filter.frequency.exponentialRampToValueAtTime(2500, now + 0.6)
    filter.Q.value = 6
    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7)
    noise.connect(filter).connect(gain).connect(this.ctx.destination)
    noise.start(now)
    noise.stop(now + 0.7)
  }

  // ─── Planet selection chime — pitched per planet ───────────
  planetChime(planetId) {
    if (!this.ctx || this.muted) return
    const now = this.ctx.currentTime
    const baseFreq = PLANET_NOTES[planetId] || 440

    // Two-note arpeggio: root + perfect fifth
    const notes = [baseFreq, baseFreq * 1.5]
    notes.forEach((f, i) => {
      const start = now + i * 0.12
      const osc = this.ctx.createOscillator()
      const osc2 = this.ctx.createOscillator() // harmonic
      const gain = this.ctx.createGain()
      const filter = this.ctx.createBiquadFilter()
      osc.type = 'sine'
      osc2.type = 'triangle'
      osc.frequency.value = f
      osc2.frequency.value = f * 2
      filter.type = 'lowpass'
      filter.frequency.value = 3000
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 1.2)
      osc.connect(filter)
      osc2.connect(filter)
      filter.connect(gain).connect(this.ctx.destination)
      osc.start(start)
      osc2.start(start)
      osc.stop(start + 1.3)
      osc2.stop(start + 1.3)
    })
  }

  // ─── Fact reveal — soft "ping" ─────────────────────────────
  ping() {
    if (!this.ctx || this.muted) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const osc2 = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc2.type = 'sine'
    osc.frequency.value = 1760
    osc2.frequency.value = 2637 // perfect fifth
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.15, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    osc.connect(gain)
    osc2.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start(now)
    osc2.start(now)
    osc.stop(now + 0.55)
    osc2.stop(now + 0.55)
  }

  // ─── Close drawer — descending sweep ───────────────────────
  close() {
    if (!this.ctx || this.muted) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(600, now)
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.15)
    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
    osc.connect(gain).connect(this.ctx.destination)
    osc.start(now)
    osc.stop(now + 0.22)
  }

  setMuted(muted) {
    this.muted = muted
    if (this.master) {
      const now = this.ctx.currentTime
      this.master.gain.cancelScheduledValues(now)
      this.master.gain.linearRampToValueAtTime(muted ? 0 : this.MASTER_VOL, now + 0.3)
    }
  }
}

const audio = new SpaceAudio()

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

// ─── Orbit path (elliptical, with longitude rotation + inclination tilt) ──────
function OrbitPath({ planet, highlighted }) {
  const points = useMemo(() => {
    const segments = 256
    const a = planet.orbit // semi-major axis
    const b = a * Math.sqrt(1 - planet.eccentricity * planet.eccentricity) // semi-minor
    const pts = []
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(angle) * a, 0, Math.sin(angle) * b))
    }
    return pts
  }, [planet.orbit, planet.eccentricity])

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry().setFromPoints(points)
    return g
  }, [points])

  return (
    <line geometry={geometry} rotation={[planet.inclination, planet.orbitRotation || 0, 0]}>
      <lineBasicMaterial
        color={highlighted ? '#ffffff' : '#475569'}
        transparent
        opacity={highlighted ? 0.5 : 0.18}
      />
    </line>
  )
}

// ─── Planet (elliptical Kepler orbit with inclination) ───────
function Planet({ planet, onSelect, selected, hovered, onHover, planetPositions }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const cloudsRef = useRef()
  const angleRef = useRef(Math.random() * Math.PI * 2)
  const isActive = selected === planet.id || hovered === planet.id

  const planetTex = useLoader(THREE.TextureLoader, TEX(planet.texture))
  const cloudsTex = planet.clouds ? useLoader(THREE.TextureLoader, TEX(planet.clouds)) : null
  const ringTex = planet.ring?.texture ? useLoader(THREE.TextureLoader, TEX(planet.ring.texture)) : null
  const bumpTex = planet.bump ? useLoader(THREE.TextureLoader, TEX(planet.bump)) : null
  const specTex = planet.specular ? useLoader(THREE.TextureLoader, TEX(planet.specular)) : null
  const nightTex = planet.night ? useLoader(THREE.TextureLoader, TEX(planet.night)) : null

  // Orbit parameters (memoized)
  const orbit = useMemo(() => {
    const a = planet.orbit
    const b = a * Math.sqrt(1 - planet.eccentricity * planet.eccentricity)
    const cosRot = Math.cos(planet.orbitRotation || 0)
    const sinRot = Math.sin(planet.orbitRotation || 0)
    const cosInc = Math.cos(planet.inclination)
    const sinInc = Math.sin(planet.inclination)
    return { a, b, cosRot, sinRot, cosInc, sinInc }
  }, [planet.orbit, planet.eccentricity, planet.inclination, planet.orbitRotation])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    angleRef.current += planet.speed * delta

    // Elliptical orbit in local plane
    const lx = Math.cos(angleRef.current) * orbit.a
    const lz = Math.sin(angleRef.current) * orbit.b

    // Rotate orbit around Y
    const rx = lx * orbit.cosRot - lz * orbit.sinRot
    const rz = lx * orbit.sinRot + lz * orbit.cosRot

    // Apply orbital inclination (tilt around X axis of orbit plane)
    const x = rx
    const y = rz * orbit.sinInc
    const z = rz * orbit.cosInc

    groupRef.current.position.set(x, y, z)
    if (meshRef.current) meshRef.current.rotation.y += 0.008
    if (cloudsRef.current) cloudsRef.current.rotation.y += 0.012
    if (planetPositions) planetPositions.current[planet.id] = { x, y, z }
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
          {specTex ? (
            /* Earth: phong with specular for ocean reflectivity + bump + night-side city lights */
            <meshPhongMaterial
              map={planetTex}
              bumpMap={bumpTex}
              bumpScale={0.05}
              specularMap={specTex}
              specular={new THREE.Color('#222222')}
              shininess={20}
              emissiveMap={nightTex}
              emissive={new THREE.Color('#ffd27f')}
              emissiveIntensity={1.2}
            />
          ) : bumpTex ? (
            /* Mars/Moon: bump-mapped surface relief */
            <meshStandardMaterial
              map={planetTex}
              bumpMap={bumpTex}
              bumpScale={0.04}
              roughness={0.95}
              metalness={0.0}
            />
          ) : (
            <meshStandardMaterial map={planetTex} roughness={0.85} metalness={0.05} />
          )}
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
          <div className="w-[1px] h-2" style={{ background: `${planet.color}40` }} />
        </div>
      </Html>
    </group>
  )
}

// ─── Moon (uses moon texture + bump) ─────────────────────────
function MoonObj({ parentSize, index }) {
  const ref = useRef()
  const moonOrbit = parentSize * 2.5 + index * 1.4
  const moonSpeed = 0.4 + index * 0.2
  const angleRef = useRef(index * 2.1)
  const tex = useLoader(THREE.TextureLoader, TEX('moon.jpg'))
  const bump = useLoader(THREE.TextureLoader, TEX('moon_bump.jpg'))

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
      <meshStandardMaterial map={tex} bumpMap={bump} bumpScale={0.02} roughness={0.95} />
    </mesh>
  )
}

// ─── Camera fly-to + follow ─────────────────────────────────
function CameraController({ targetId, planetPositions, controlsRef }) {
  const { camera } = useThree()
  const overviewPos = useMemo(() => new THREE.Vector3(0, 40, 60), [])
  const overviewLook = useMemo(() => new THREE.Vector3(0, 0, 0), [])
  const tmpTarget = useRef(new THREE.Vector3())
  const tmpLook = useRef(new THREE.Vector3())
  const prevTargetId = useRef(null)
  const wasFollowing = useRef(false)

  useFrame(() => {
    if (!controlsRef.current) return

    // Detect transition
    const justChanged = prevTargetId.current !== targetId
    prevTargetId.current = targetId

    if (targetId) {
      const pos = planetPositions.current[targetId]
      if (!pos) return

      // Camera offset relative to planet (so we orbit it nicely)
      const planetSize = (PLANETS.find(p => p.id === targetId)?.size || 1.5)
      const offsetDist = planetSize * 6 + 4
      tmpTarget.current.set(pos.x + offsetDist * 0.6, planetSize * 2.5, pos.z + offsetDist)
      tmpLook.current.set(pos.x, pos.y, pos.z)

      // Smooth follow — lerp every frame so camera tracks the moving planet
      const lerpRate = wasFollowing.current ? 0.08 : 0.045
      camera.position.lerp(tmpTarget.current, lerpRate)
      controlsRef.current.target.lerp(tmpLook.current, lerpRate)
      controlsRef.current.update()

      // Once close, treat as "following"
      if (camera.position.distanceTo(tmpTarget.current) < 2) wasFollowing.current = true
    } else {
      // Back to overview
      if (justChanged) wasFollowing.current = false
      camera.position.lerp(overviewPos, 0.035)
      controlsRef.current.target.lerp(overviewLook, 0.035)
      controlsRef.current.update()
    }
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

// ─── Info drawer (planet facts explorer) ─────────────────────
function InfoDrawer({ planet, onClose, onPlay }) {
  const [visible, setVisible] = useState(false)
  const [factIndex, setFactIndex] = useState(0)

  useEffect(() => {
    if (planet) {
      requestAnimationFrame(() => setVisible(true))
      setFactIndex(0)
    } else {
      setVisible(false)
    }
  }, [planet])

  if (!planet) return null

  const nextFact = () => {
    onPlay?.()
    setFactIndex(i => (i + 1) % planet.facts.length)
  }

  const stats = planet.stats || {}

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 pointer-events-auto transition-all duration-500 ease-out"
      style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="bg-black/85 backdrop-blur-2xl border border-white/10 rounded-t-2xl overflow-hidden">
          {/* Accent line */}
          <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${planet.color}, transparent)` }} />

          <div className="p-6">
            {/* Header */}
            <div className="flex items-start gap-5 mb-5">
              <div
                className="w-14 h-14 rounded-full flex-shrink-0"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${planet.color}, ${planet.color}40)`,
                  boxShadow: `0 0 25px ${planet.color}40`,
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h2 className="text-2xl font-semibold text-white/95 tracking-tight">{planet.name}</h2>
                  <span className="text-[10px] font-mono tracking-[0.3em] text-white/40 italic">{planet.tagline}</span>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/30 hover:text-white/70 transition-colors text-lg"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
              {[
                { k: 'Diameter', v: stats.diameter },
                { k: 'Day', v: stats.day },
                { k: 'Year', v: stats.year },
                { k: 'Moons', v: stats.moons },
                { k: 'From Sun', v: stats.distance },
              ].map(s => (
                <div key={s.k} className="bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                  <div className="text-[8px] font-mono tracking-[0.2em] text-white/30 mb-1">{s.k.toUpperCase()}</div>
                  <div className="text-[11px] font-medium text-white/80 leading-tight">{s.v}</div>
                </div>
              ))}
            </div>

            {/* Fact card */}
            <div
              className="rounded-xl p-4 mb-4 border transition-all"
              style={{
                background: `linear-gradient(135deg, ${planet.color}15, transparent)`,
                borderColor: `${planet.color}20`,
              }}
            >
              <div className="flex items-start gap-3">
                <div className="text-[8px] font-mono tracking-[0.3em] mt-0.5 flex-shrink-0" style={{ color: planet.color }}>
                  FACT {String(factIndex + 1).padStart(2, '0')}/{String(planet.facts.length).padStart(2, '0')}
                </div>
              </div>
              <p className="text-sm text-white/85 leading-relaxed mt-2 font-light">
                {planet.facts[factIndex]}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={nextFact}
                className="flex-1 py-2.5 rounded-lg text-xs font-medium tracking-wider transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${planet.color}30, ${planet.color}10)`,
                  border: `1px solid ${planet.color}40`,
                  color: planet.color,
                }}
              >
                NEXT FACT
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <a
                href={`https://science.nasa.gov/${planet.name.toLowerCase()}/`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onPlay}
                className="px-4 py-2.5 rounded-lg text-xs text-white/40 hover:text-white/80 hover:bg-white/5 border border-white/10 transition-all"
                title="Learn more on NASA.gov"
              >
                NASA ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Milky Way skybox + cosmic dust ──────────────────────────
function Nebula() {
  const dustRef = useRef()
  const milkyway = useLoader(THREE.TextureLoader, TEX('milkyway.jpg'))

  const dustPositions = useMemo(() => {
    const arr = new Float32Array(2000 * 3)
    for (let i = 0; i < 2000; i++) {
      const r = 150 + Math.random() * 200
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.5
      arr[i * 3 + 2] = r * Math.cos(phi)
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    if (dustRef.current) dustRef.current.rotation.y += delta * 0.005
  })

  return (
    <>
      {/* Real Milky Way skybox from solarsystemscope.com */}
      <mesh rotation-y={Math.PI * 0.3}>
        <sphereGeometry args={[450, 64, 64]} />
        <meshBasicMaterial map={milkyway} side={THREE.BackSide} depthWrite={false} />
      </mesh>

      {/* Cosmic dust */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.6} color="#ffffff" transparent opacity={0.5} sizeAttenuation depthWrite={false} />
      </points>
    </>
  )
}

// ─── Asteroid Belt (between Mars and Jupiter) ────────────────
function AsteroidBelt() {
  const ref = useRef()
  const { positions, scales } = useMemo(() => {
    const count = 1500
    const pos = new Float32Array(count * 3)
    const sc = new Float32Array(count)
    const innerR = 41
    const outerR = 47
    for (let i = 0; i < count; i++) {
      const r = innerR + Math.random() * (outerR - innerR)
      const theta = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 1.2
      pos[i * 3] = Math.cos(theta) * r
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = Math.sin(theta) * r
      sc[i] = 0.05 + Math.random() * 0.15
    }
    return { positions: pos, scales: sc }
  }, [])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.015
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.18} color="#8b7355" transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  )
}

// ─── Scene ───────────────────────────────────────────────────
function Scene({ selected, hovered, onSelect, onHover, planetPositions, controlsRef }) {
  return (
    <>
      <color attach="background" args={['#000003']} />
      <ambientLight intensity={0.08} />
      <Nebula />
      <Stars radius={250} depth={100} count={12000} factor={4} saturation={0.2} fade speed={0.4} />
      <Sun />
      <AsteroidBelt />
      {PLANETS.map(p => (
        <OrbitPath key={`orbit-${p.id}`} planet={p} highlighted={selected?.id === p.id || hovered === p.id} />
      ))}
      {PLANETS.map(p => (
        <Planet key={p.id} planet={p} onSelect={onSelect} selected={selected?.id} hovered={hovered} onHover={onHover} planetPositions={planetPositions} />
      ))}
      <CameraController targetId={selected?.id || null} planetPositions={planetPositions} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        enablePan
        enableZoom
        enableRotate
        minDistance={4}
        maxDistance={200}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2}
        autoRotate={!selected}
        autoRotateSpeed={0.08}
        dampingFactor={0.06}
        enableDamping
        zoomSpeed={0.8}
        rotateSpeed={0.5}
      />
    </>
  )
}

// ─── Top bar ─────────────────────────────────────────────────
function TopBar({ onHome, muted, onToggleMute, audioStarted }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
      <div className="flex items-center justify-between px-5 py-3">
        <button onClick={onHome} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 transition-all group pointer-events-auto">
          <svg className="w-3.5 h-3.5 text-white/40 group-hover:text-white/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-[10px] font-medium tracking-[0.15em] text-white/40 group-hover:text-white/70 transition-colors">HOME</span>
        </button>
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="text-[10px] font-mono tracking-[0.4em] text-white/15 hidden sm:block">KRANTHI'S UNIVERSE</div>
          <button
            onClick={onToggleMute}
            disabled={!audioStarted}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${audioStarted ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-white/2 border-white/5 opacity-30 cursor-not-allowed'}`}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted || !audioStarted ? (
              <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-emerald-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>
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
  const [muted, setMuted] = useState(false)
  const [audioStarted, setAudioStarted] = useState(false)
  const controlsRef = useRef()
  const planetPositions = useRef({})

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadProgress(prev => { if (prev >= 100) { clearInterval(interval); return 100 } return prev + Math.random() * 12 })
    }, 200)
    return () => clearInterval(interval)
  }, [])

  // Initialize audio on first user interaction (browsers require user gesture)
  useEffect(() => {
    const startAudio = () => {
      if (audioStarted) return
      audio.init()
      audio.startTheme()
      setAudioStarted(true)
    }
    window.addEventListener('click', startAudio, { once: true })
    window.addEventListener('keydown', startAudio, { once: true })
    return () => {
      window.removeEventListener('click', startAudio)
      window.removeEventListener('keydown', startAudio)
    }
  }, [audioStarted])

  const handleSelect = useCallback((planet) => {
    if (planet) {
      audio.whoosh()
      // Stagger the chime so it plays after the whoosh starts
      setTimeout(() => audio.planetChime(planet.id), 150)
    } else {
      audio.close()
    }
    setSelected(prev => { if (!planet) return null; return prev?.id === planet.id ? null : planet })
  }, [])

  const handleHover = useCallback((id) => {
    if (id && id !== hovered) audio.hover()
    setHovered(id)
  }, [hovered])

  const handleHome = useCallback(() => {
    audio.click()
    window.location.hash = ''
    window.location.reload()
  }, [])

  const toggleMute = useCallback(() => {
    setMuted(m => {
      const next = !m
      audio.setMuted(next)
      return next
    })
  }, [])

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
          <Scene selected={selected} hovered={hovered} onSelect={handleSelect} onHover={handleHover} planetPositions={planetPositions} controlsRef={controlsRef} />
        </React.Suspense>
      </Canvas>

      <TopBar onHome={handleHome} muted={muted} onToggleMute={toggleMute} audioStarted={audioStarted} />
      {ready && <NavStrip planets={PLANETS} selected={selected} onSelect={handleSelect} />}
      <InfoDrawer planet={selected} onClose={() => { audio.close(); setSelected(null) }} onPlay={() => audio.ping()} />

      {ready && !selected && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="text-[9px] font-mono tracking-[0.4em] text-white/15 animate-pulse">SELECT A PLANET TO EXPLORE</div>
        </div>
      )}

      {ready && !audioStarted && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-amber-500/20 text-[10px] font-mono tracking-[0.3em] text-amber-300/60 animate-pulse">
            🔊 CLICK TO ENABLE AUDIO
          </div>
        </div>
      )}
    </div>
  )
}
