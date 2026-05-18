import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
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
    namedMoons: [
      { id: 'io', name: 'Io', color: '#f0c040', size: 0.35, orbitR: 2.8, speed: 1.2, tagline: 'The volcanic furnace',
        facts: ['Most volcanically active body in the solar system — over 400 active volcanoes','Tidal heating from Jupiter stretches and squeezes Io, generating extreme heat','Surface is painted with sulfur and sulfur dioxide frost','Eruptions shoot plumes 500 km above the surface','Has a thin atmosphere of sulfur dioxide','Orbits Jupiter every 1.77 Earth days','Named after a priestess in Greek mythology loved by Zeus'],
        stats: { diameter: '3,643 km', day: '1.77 Earth days', year: 'Orbits Jupiter in 1.77 days', moons: 0, distance: '421,700 km from Jupiter' }},
      { id: 'europa', name: 'Europa', color: '#c8daf0', size: 0.30, orbitR: 3.8, speed: 0.9, tagline: 'The ice ocean world',
        facts: ['Surface is a shell of ice covering a global liquid water ocean','May have more water than all of Earth\'s oceans combined','One of the best candidates for extraterrestrial life in the solar system','Surface is one of the smoothest in the solar system','Crisscrossed with reddish-brown "linea" fractures','NASA\'s Europa Clipper mission launched 2024 to investigate','Ice shell estimated to be 15-25 km thick'],
        stats: { diameter: '3,122 km', day: '3.55 Earth days', year: 'Orbits Jupiter in 3.55 days', moons: 0, distance: '671,100 km from Jupiter' }},
      { id: 'ganymede', name: 'Ganymede', color: '#b0a890', size: 0.42, orbitR: 5.0, speed: 0.65, tagline: 'The giant moon',
        facts: ['Largest moon in the entire solar system — bigger than Mercury','Only moon known to have its own magnetic field','Has a subsurface ocean sandwiched between ice layers','Surface shows both old cratered terrain and younger grooved terrain','Has a thin oxygen atmosphere','Discovered by Galileo Galilei in 1610','Diameter is 5,268 km — 8% larger than Mercury'],
        stats: { diameter: '5,268 km', day: '7.15 Earth days', year: 'Orbits Jupiter in 7.15 days', moons: 0, distance: '1.07M km from Jupiter' }},
      { id: 'callisto', name: 'Callisto', color: '#706050', size: 0.38, orbitR: 6.2, speed: 0.5, tagline: 'The ancient one',
        facts: ['Most heavily cratered body in the solar system','Surface hasn\'t changed significantly in 4 billion years','May have a subsurface ocean beneath 200 km of ice','Farthest of the four Galilean moons from Jupiter','Considered a prime site for a future human base near Jupiter','Has a very thin atmosphere of carbon dioxide','Surface is a mix of ice and dark, rocky material'],
        stats: { diameter: '4,821 km', day: '16.69 Earth days', year: 'Orbits Jupiter in 16.69 days', moons: 0, distance: '1.88M km from Jupiter' }},
    ],
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
    namedMoons: [
      { id: 'titan', name: 'Titan', color: '#d4a050', size: 0.40, orbitR: 4.5, speed: 0.6, tagline: 'The methane world',
        facts: ['Second-largest moon in the solar system — larger than Mercury','Only moon with a dense atmosphere (1.5× Earth\'s surface pressure)','Has lakes and seas of liquid methane and ethane on its surface','Rain falls as liquid methane in a hydrological cycle like Earth\'s water','Huygens probe landed on Titan in 2005 — most distant landing ever','Atmosphere is 95% nitrogen with methane and hydrogen','Surface temperature is -179°C'],
        stats: { diameter: '5,150 km', day: '15.95 Earth days', year: 'Orbits Saturn in 15.95 days', moons: 0, distance: '1.22M km from Saturn' }},
      { id: 'enceladus', name: 'Enceladus', color: '#f0f0ff', size: 0.22, orbitR: 3.2, speed: 0.95, tagline: 'The ice geyser',
        facts: ['Shoots geysers of water ice from cracks near its south pole','Has a global subsurface ocean under an ice shell','Geysers contain organic molecules — possible ingredients for life','One of the most reflective bodies in the solar system (albedo ~0.99)','Only 504 km across — small enough to fit inside the UK','Feeds material into Saturn\'s E ring','Cassini spacecraft flew through its plumes to sample them'],
        stats: { diameter: '504 km', day: '1.37 Earth days', year: 'Orbits Saturn in 1.37 days', moons: 0, distance: '238,000 km from Saturn' }},
    ],
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
    namedMoons: [
      { id: 'miranda', name: 'Miranda', color: '#a0a0b0', size: 0.18, orbitR: 2.6, speed: 1.1, tagline: 'The Frankenstein moon',
        facts: ['Has some of the most extreme terrain in the solar system','Features Verona Rupes — a 20 km cliff, the tallest known in the solar system','Surface looks stitched together from mismatched pieces','May have been shattered and reassembled by a massive impact','Only 472 km in diameter — one of the smallest rounded moons','Named after the heroine of Shakespeare\'s The Tempest','Visited by Voyager 2 in 1986'],
        stats: { diameter: '472 km', day: '1.41 Earth days', year: 'Orbits Uranus in 1.41 days', moons: 0, distance: '129,900 km from Uranus' }},
      { id: 'titania', name: 'Titania', color: '#c0b8c0', size: 0.28, orbitR: 3.8, speed: 0.7, tagline: 'The ice queen',
        facts: ['Largest moon of Uranus — 1,578 km in diameter','Named after the queen of the fairies in A Midsummer Night\'s Dream','Surface has enormous canyons and fault scarps stretching 1,500 km','May have a thin subsurface ocean under a mantle of ice','Composed of roughly half water ice and half rock','Has a very thin carbon dioxide atmosphere','Discovered by William Herschel in 1787'],
        stats: { diameter: '1,578 km', day: '8.71 Earth days', year: 'Orbits Uranus in 8.71 days', moons: 0, distance: '435,900 km from Uranus' }},
    ],
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
    namedMoons: [
      { id: 'triton', name: 'Triton', color: '#90b0c0', size: 0.30, orbitR: 3.2, speed: 0.8, tagline: 'The captured wanderer',
        facts: ['Only large moon in the solar system with a retrograde orbit','Almost certainly a captured Kuiper Belt object','Has active geysers that shoot nitrogen gas 8 km high','Surface temperature is -235°C — one of the coldest in the solar system','Has a thin nitrogen atmosphere','Surface is mostly frozen nitrogen, with water and CO₂ ice','Slowly spiraling inward — will eventually be torn apart by Neptune\'s gravity'],
        stats: { diameter: '2,707 km', day: '5.88 Earth days', year: 'Orbits Neptune in 5.88 days', moons: 0, distance: '354,800 km from Neptune' }},
    ],
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
  // ─── Dwarf Planets ──────────────────────────────────────────
  {
    id: 'ceres', name: 'Ceres',
    orbit: 18, eccentricity: 0.076, inclination: 0.18,
    size: 0.6, speed: 0.13, tilt: 0.07,
    texture: null, color: '#9ca3af', atmosphere: null,
    moons: 0, ring: null, isDwarf: true,
    tagline: 'Queen of the asteroid belt',
    facts: [
      'Largest object in the asteroid belt — 940 km in diameter',
      'First asteroid ever discovered, by Giuseppe Piazzi in 1801',
      'Reclassified as a dwarf planet in 2006 alongside Pluto',
      'Has bright spots (Occator Crater) — salt deposits from subsurface brine',
      'May have a subsurface ocean of liquid water',
      'NASA\'s Dawn spacecraft orbited Ceres from 2015 to 2018',
      'Contains about one-third of the asteroid belt\'s total mass',
    ],
    stats: { diameter: '940 km', day: '9h 4m', year: '4.6 Earth years', moons: 0, distance: '413.7M km from Sun' },
  },
  {
    id: 'pluto', name: 'Pluto',
    orbit: 110, eccentricity: 0.25, inclination: 0.30,
    size: 0.8, speed: 0.006, tilt: 2.14,
    texture: 'pluto.jpg', color: '#d4a574', atmosphere: '#c2956e',
    moons: 5, ring: null, isDwarf: true,
    tagline: 'The beloved dwarf planet',
    facts: [
      'Reclassified from planet to dwarf planet in 2006 by the IAU',
      'Has a giant heart-shaped nitrogen glacier called Tombaugh Regio',
      'Its largest moon Charon is so large they orbit each other (binary system)',
      'Surface temperature is around -230°C (43 K)',
      'Orbit is so eccentric it sometimes comes closer to the Sun than Neptune',
      'Has a thin atmosphere of nitrogen, methane, and carbon monoxide',
      'NASA\'s New Horizons flew past Pluto in 2015, revealing stunning detail',
    ],
    stats: { diameter: '2,377 km', day: '6.4 Earth days', year: '248 Earth years', moons: 5, distance: '5.9B km from Sun' },
  },
  {
    id: 'haumea', name: 'Haumea',
    orbit: 120, eccentricity: 0.19, inclination: 0.49,
    size: 0.65, speed: 0.005, tilt: 0.0,
    texture: null, color: '#e2e8f0', atmosphere: null,
    moons: 2, ring: null, isDwarf: true,
    tagline: 'The egg-shaped world',
    facts: [
      'Shaped like an elongated egg due to its incredibly fast rotation',
      'Spins once every 3.9 hours — fastest rotation of any known large body',
      'Named after the Hawaiian goddess of fertility and childbirth',
      'Has two small moons: Hiʻiaka and Namaka (both named after Haumea\'s daughters)',
      'Surface is covered in crystalline water ice',
      'Has a faint ring system discovered in 2017',
      'Located in the Kuiper Belt, beyond Neptune',
    ],
    stats: { diameter: '~1,560 km', day: '3.9 hours', year: '284 Earth years', moons: 2, distance: '6.5B km from Sun' },
  },
  {
    id: 'makemake', name: 'Makemake',
    orbit: 130, eccentricity: 0.16, inclination: 0.50,
    size: 0.7, speed: 0.0045, tilt: 0.0,
    texture: null, color: '#f5deb3', atmosphere: null,
    moons: 1, ring: null, isDwarf: true,
    tagline: 'The Easter Island world',
    facts: [
      'Discovered on Easter 2005 — named after the Rapa Nui creator god',
      'Second-brightest Kuiper Belt object after Pluto (visible with a large amateur telescope)',
      'Surface is covered in frozen methane, ethane, and nitrogen',
      'Has one known moon: MK2 (nicknamed "MK2"), discovered in 2016',
      'No known atmosphere — extremely cold and airless',
      'Reddish-brown color similar to Pluto from tholins (complex organic molecules)',
      'Takes 306 Earth years to orbit the Sun once',
    ],
    stats: { diameter: '~1,430 km', day: '22.8 hours', year: '306 Earth years', moons: 1, distance: '6.8B km from Sun' },
  },
  {
    id: 'eris', name: 'Eris',
    orbit: 145, eccentricity: 0.44, inclination: 0.77,
    size: 0.75, speed: 0.003, tilt: 0.0,
    texture: null, color: '#f1f5f9', atmosphere: null,
    moons: 1, ring: null, isDwarf: true,
    tagline: 'The planet killer',
    facts: [
      'Discovery of Eris in 2005 directly triggered Pluto\'s reclassification',
      'Most massive known dwarf planet — 27% more massive than Pluto',
      'Named after the Greek goddess of discord (fitting, given the controversy)',
      'Has one moon: Dysnomia, named after Eris\'s daughter, the spirit of lawlessness',
      'Most distant known dwarf planet — up to 97 AU from the Sun',
      'Takes 558 years to orbit the Sun once',
      'Surface is one of the most reflective in the solar system (like fresh snow)',
    ],
    stats: { diameter: '2,326 km', day: '25.9 hours', year: '558 Earth years', moons: 1, distance: '10.1B km from Sun' },
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
  ceres: 440,      // A4 — neutral
  pluto: 174.6,    // F3 — far away
  haumea: 164.8,   // E3 — distant hum
  makemake: 155.6, // Eb3 — eerie
  eris: 146.8,     // D3 — deepest
  // Named moons
  io: 784,         // G5 — fiery
  europa: 740,     // F#5 — icy crystal
  ganymede: 659.3, // E5 — grand
  callisto: 622.3, // Eb5 — ancient
  titan: 349.2,    // F4 — deep hum
  enceladus: 415.3,// Ab4 — crystalline
  miranda: 277.2,  // Db4 — mysterious
  titania: 293.7,  // D4 — regal
  triton: 220,     // A3 — far & cold
}

// ─── Ambient MP3 loop + Web Audio UI sound palette ───────────
const AMBIENT_LOOP_PATH = `${import.meta.env.BASE_URL || '/'}audio/loop.mp3`

class SpaceAudio {
  constructor() {
    this.ctx = null
    this.master = null
    this.muted = false
    this.started = false
    this.sparkleTimer = null
    this.ambientElement = null
    this.ambientSource = null
    this.MASTER_VOL = 0.55
  }

  init() {
    if (this.ctx) return
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.master.gain.value = 0.0
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

    // ─── Ambient MP3 loop via HTMLAudioElement → Web Audio ───
    this.ambientElement = new Audio(AMBIENT_LOOP_PATH)
    this.ambientElement.loop = true
    this.ambientElement.crossOrigin = 'anonymous'
    this.ambientSource = this.ctx.createMediaElementSource(this.ambientElement)
    this.ambientSource.connect(this.master)
    this.ambientElement.play().catch(() => {})

    // Fade master in over 4 seconds
    this.master.gain.linearRampToValueAtTime(this.muted ? 0 : this.MASTER_VOL, now + 4)

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

  // For textureless dwarf planets, load a 1x1 dummy — the material won't use it
  const texPath = planet.texture ? TEX(planet.texture) : TEX('sun.jpg')
  const hasTexture = !!planet.texture
  const planetTex = useLoader(THREE.TextureLoader, texPath)
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
          {!hasTexture ? (
            /* Dwarf planets without textures: solid color with roughness */
            <meshStandardMaterial color={planet.color} roughness={0.9} metalness={0.05} />
          ) : specTex ? (
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

        {/* Subtle Fresnel-style atmosphere rim (much smaller, faces camera only) */}
        {planet.atmosphere && (
          <mesh scale={1.04}>
            <sphereGeometry args={[planet.size, 48, 48]} />
            <meshBasicMaterial
              color={planet.atmosphere}
              transparent
              opacity={isActive ? 0.08 : 0.035}
              side={THREE.BackSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
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

      {/* Named Moons (clickable with facts) */}
      {planet.namedMoons?.map(moon => (
        <NamedMoon key={moon.id} moon={moon} parentSize={planet.size} onSelect={onSelect} onHover={onHover} hovered={hovered} selected={selected} />
      ))}
      {/* Generic moons (planets without named moon data) */}
      {!planet.namedMoons && Array.from({ length: planet.moons }, (_, i) => (
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

// ─── Named Moon (orbits parent planet, clickable with facts) ─
function NamedMoon({ moon, parentSize, onSelect, onHover, hovered, selected }) {
  const ref = useRef()
  const meshRef = useRef()
  const angleRef = useRef(Math.random() * Math.PI * 2)
  const isActive = selected === moon.id || hovered === moon.id

  useFrame((_, delta) => {
    if (!ref.current) return
    angleRef.current += moon.speed * delta
    const orbitR = parentSize * moon.orbitR
    ref.current.position.set(
      Math.cos(angleRef.current) * orbitR,
      Math.sin(angleRef.current * 0.4) * 0.3,
      Math.sin(angleRef.current) * orbitR,
    )
    if (meshRef.current) meshRef.current.rotation.y += 0.015
  })

  return (
    <group ref={ref}>
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect({ ...moon, isMoon: true }) }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(moon.id); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = 'default' }}
      >
        <sphereGeometry args={[moon.size, 32, 32]} />
        <meshStandardMaterial color={moon.color} roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Glow when active */}
      {isActive && (
        <mesh scale={1.3}>
          <sphereGeometry args={[moon.size, 24, 24]} />
          <meshBasicMaterial color={moon.color} transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}
      {/* Label */}
      <Html
        position={[0, moon.size + 0.6, 0]}
        center
        distanceFactor={30}
        style={{ pointerEvents: 'none', opacity: isActive ? 1 : 0.4, transition: 'opacity 0.3s' }}
      >
        <div className="flex flex-col items-center gap-0.5 whitespace-nowrap">
          <span className="text-[8px] font-medium tracking-[0.12em] drop-shadow-lg" style={{ color: moon.color }}>
            {moon.name}
          </span>
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
  const isReturning = useRef(false) // one-shot return-to-overview animation

  useFrame(() => {
    if (!controlsRef.current) return

    const justChanged = prevTargetId.current !== targetId
    if (justChanged) {
      // Transition detected
      if (!targetId) {
        // Just deselected — start a one-shot return-to-overview animation
        isReturning.current = true
      }
      wasFollowing.current = false
      prevTargetId.current = targetId
    }

    if (targetId) {
      // Following a planet — track its current position every frame
      const pos = planetPositions.current[targetId]
      if (!pos) return

      const planetSize = (PLANETS.find(p => p.id === targetId)?.size || 1.5)
      const offsetDist = planetSize * 6 + 4
      tmpTarget.current.set(pos.x + offsetDist * 0.6, planetSize * 2.5, pos.z + offsetDist)
      tmpLook.current.set(pos.x, pos.y, pos.z)

      const lerpRate = wasFollowing.current ? 0.08 : 0.045
      camera.position.lerp(tmpTarget.current, lerpRate)
      controlsRef.current.target.lerp(tmpLook.current, lerpRate)
      controlsRef.current.update()

      if (camera.position.distanceTo(tmpTarget.current) < 2) wasFollowing.current = true
    } else if (isReturning.current) {
      // One-shot fly back to overview (only after deselect)
      camera.position.lerp(overviewPos, 0.04)
      controlsRef.current.target.lerp(overviewLook, 0.04)
      controlsRef.current.update()

      // Stop animating once we're close enough — user is now free to roam
      if (camera.position.distanceTo(overviewPos) < 1.5) {
        isReturning.current = false
      }
    }
    // Otherwise: do nothing — let OrbitControls handle the user's input freely
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
                  {planet.isDwarf && <span className="text-[8px] font-mono tracking-[0.2em] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300/70 border border-violet-500/20">DWARF PLANET</span>}
                  {planet.isMoon && <span className="text-[8px] font-mono tracking-[0.2em] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300/70 border border-cyan-500/20">MOON</span>}
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
                { k: planet.isMoon ? 'Distance' : 'From Sun', v: stats.distance },
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

// ─── Milky Way skybox (no extra dust layer — would create a visible sphere boundary on zoom-out) ──
function Nebula() {
  const milkyway = useLoader(THREE.TextureLoader, TEX('milkyway.jpg'))

  return (
    <mesh rotation-y={Math.PI * 0.3}>
      <sphereGeometry args={[1500, 64, 64]} />
      <meshBasicMaterial map={milkyway} side={THREE.BackSide} depthWrite={false} />
    </mesh>
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
        minDistance={2}
        maxDistance={600}
        /* No polar restriction — full 360° vertical (can fly under the system) */
        autoRotate={false}
        dampingFactor={0.08}
        enableDamping
        zoomSpeed={0.6}
        rotateSpeed={0.6}
        panSpeed={0.8}
        /* Smooth zoom-to-cursor */
        zoomToCursor
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
  const mainPlanets = planets.filter(p => !p.isDwarf)
  const dwarfPlanets = planets.filter(p => p.isDwarf)
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none">
      <div className="flex justify-center pb-4 px-4 pointer-events-auto">
        <div className="flex items-center gap-[2px] p-1 rounded-xl bg-black/50 backdrop-blur-xl border border-white/5 max-w-full overflow-x-auto">
          <button onClick={() => onSelect(null)} className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all flex-shrink-0 ${!selected ? 'bg-amber-500/10' : 'hover:bg-white/5'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${!selected ? 'bg-amber-400' : 'bg-amber-400/40'}`} />
            <span className={`text-[7px] font-mono tracking-wider ${!selected ? 'text-amber-300/70' : 'text-white/20'}`}>SUN</span>
          </button>
          <div className="w-px h-6 bg-white/5" />
          {mainPlanets.map(p => {
            const isSelected = selected?.id === p.id
            return (
              <button key={p.id} onClick={() => onSelect(p)} className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-lg transition-all flex-shrink-0 ${isSelected ? 'bg-white/8' : 'hover:bg-white/5'}`} title={p.name}>
                <div className="w-2 h-2 rounded-full transition-all" style={{ background: isSelected ? p.color : `${p.color}50`, boxShadow: isSelected ? `0 0 8px ${p.color}40` : 'none' }} />
                <span className={`text-[7px] font-mono tracking-wider ${isSelected ? 'text-white/70' : 'text-white/20'}`}>{p.name.slice(0, 4).toUpperCase()}</span>
              </button>
            )
          })}
          {dwarfPlanets.length > 0 && <>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-[5px] font-mono text-white/10 tracking-wider px-1 flex-shrink-0">DWARF</div>
            {dwarfPlanets.map(p => {
              const isSelected = selected?.id === p.id
              return (
                <button key={p.id} onClick={() => onSelect(p)} className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-all flex-shrink-0 ${isSelected ? 'bg-white/8' : 'hover:bg-white/5'}`} title={p.name}>
                  <div className="w-1.5 h-1.5 rounded-full transition-all" style={{ background: isSelected ? p.color : `${p.color}50`, boxShadow: isSelected ? `0 0 6px ${p.color}40` : 'none' }} />
                  <span className={`text-[6px] font-mono tracking-wider ${isSelected ? 'text-white/70' : 'text-white/15'}`}>{p.name.slice(0, 4).toUpperCase()}</span>
                </button>
              )
            })}
          </>}
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
        camera={{ position: [0, 40, 60], fov: 45, near: 0.1, far: 2500 }}
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
