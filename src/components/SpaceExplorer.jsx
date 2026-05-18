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
  // Comets
  halley: 554.4,   // Db5 — streaking
  halebopp: 466.2, // Bb4 — grand
  neowise: 493.9,  // B4 — bright
  // Stars
  'alpha-centauri': 523.3, // C5
  sirius: 1046.5,  // C6 — brilliant
  betelgeuse: 130.8,// C3 — deep rumble
  polaris: 659.3,  // E5 — guiding
  // Probes
  voyager1: 349.2, // F4 — pioneering
  voyager2: 311.1, // Eb4 — explorer
  jwst: 587.3,     // D5 — golden
  iss: 440,        // A4 — home
  // Deep sky
  andromeda: 196,   // G3 — vast
  'orion-nebula': 233.1, // Bb3 — warm
  'crab-nebula': 277.2,  // Db4 — pulsing
  pillars: 207.7,  // Ab3 — grand
}

// ─── Programmatic space drone + Web Audio UI sound palette ──
class SpaceAudio {
  constructor() {
    this.ctx = null
    this.master = null
    this.musicNodes = []
    this.muted = false
    this.started = false
    this.sparkleTimer = null
    this.MASTER_VOL = 0.85
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

    // ─── Deep space drone — richer harmonic stack ───────────
    const droneFreqs = [55, 82.4, 110, 138.6, 165, 220]
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
        color={highlighted ? '#ffffff' : '#cbd5e1'}
        transparent
        opacity={highlighted ? 0.7 : 0.3}
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
                  {planet.isComet && <span className="text-[8px] font-mono tracking-[0.2em] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300/70 border border-amber-500/20">COMET</span>}
                  {planet.isStar && <span className="text-[8px] font-mono tracking-[0.2em] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300/70 border border-yellow-500/20">STAR</span>}
                  {planet.isProbe && <span className="text-[8px] font-mono tracking-[0.2em] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300/70 border border-emerald-500/20">SPACECRAFT</span>}
                  {planet.isDeepSky && <span className="text-[8px] font-mono tracking-[0.2em] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300/70 border border-pink-500/20">DEEP SKY</span>}
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
                { k: (planet.isMoon || planet.isStar || planet.isProbe) ? 'Distance' : planet.isComet ? 'Orbit' : 'From Sun', v: stats.distance },
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

// ─── Multi-layer star field (gives depth as you zoom out) ────
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

// ─── Kuiper Belt (icy debris ring beyond Neptune) ────────────
function KuiperBelt() {
  const ref = useRef()
  const { positions, colors } = useMemo(() => {
    const count = 2500
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const innerR = 100
    const outerR = 200
    for (let i = 0; i < count; i++) {
      const r = innerR + Math.random() * (outerR - innerR)
      const theta = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 3.5
      pos[i * 3] = Math.cos(theta) * r
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = Math.sin(theta) * r
      // Icy blue-white colors with variation
      const t = Math.random()
      col[i * 3] = 0.55 + t * 0.35     // R
      col[i * 3 + 1] = 0.6 + t * 0.35  // G
      col[i * 3 + 2] = 0.75 + t * 0.25 // B
    }
    return { positions: pos, colors: col }
  }, [])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.003
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.12} vertexColors transparent opacity={0.45} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ─── Oort Cloud hint (distant spherical shell of faint particles) ─
function OortCloud() {
  const ref = useRef()
  const positions = useMemo(() => {
    const count = 2000
    const pos = new Float32Array(count * 3)
    const innerR = 400
    const outerR = 600
    for (let i = 0; i < count; i++) {
      // Spherical distribution (not just a ring)
      const r = innerR + Math.random() * (outerR - innerR)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.cos(phi)
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    return pos
  }, [])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.001
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.3} color="#8090b0" transparent opacity={0.15} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

// ─── Comet data ──────────────────────────────────────────────
const COMETS = [
  { id: 'halley', name: "Halley's Comet", color: '#a0d8ff', tailColor: '#60b0ff',
    orbit: 85, perihelion: 6, eccentricity: 0.967, inclination: 2.84, speed: 0.018,
    tagline: 'The most famous comet',
    facts: ['Visible from Earth every 75-79 years — last appeared in 1986','Named after Edmond Halley who predicted its return in 1705','Nucleus is only 15 km long but produces a tail millions of km long','Recorded by humans since at least 240 BCE','Featured in the Bayeux Tapestry depicting the Battle of Hastings (1066)','Next visible from Earth in 2061','Orbits the Sun in the opposite direction to the planets (retrograde)'],
    stats: { diameter: '11×8 km', day: '52 hours', year: '75.3 Earth years', moons: 0, distance: '0.59–35 AU' }},
  { id: 'halebopp', name: 'Hale-Bopp', color: '#e0d0ff', tailColor: '#b090ff',
    orbit: 120, perihelion: 8, eccentricity: 0.995, inclination: 1.57, speed: 0.008,
    tagline: 'The Great Comet of 1997',
    facts: ['Visible to the naked eye for a record 18 months','Nucleus is unusually large: ~40 km across','One of the most widely observed comets of the 20th century','Orbital period is approximately 2,520 years','Has both a blue ion tail and a white dust tail','Discovered independently by Alan Hale and Thomas Bopp in 1995','10× more active than Halley at similar distances from the Sun'],
    stats: { diameter: '~40 km', day: '11.3 hours', year: '~2,520 years', moons: 0, distance: '0.91–370 AU' }},
  { id: 'neowise', name: 'NEOWISE', color: '#ffe0a0', tailColor: '#ffb050',
    orbit: 100, perihelion: 5, eccentricity: 0.999, inclination: 2.22, speed: 0.012,
    tagline: 'Pandemic sky visitor',
    facts: ['Discovered in March 2020 by NASA\'s NEOWISE space telescope','Became the brightest comet visible from the Northern Hemisphere since Hale-Bopp','Visible to the naked eye throughout July 2020 during the COVID-19 pandemic','Orbital period is approximately 6,766 years','Has a sodium tail in addition to the usual dust and ion tails','Nucleus is about 5 km across','Won\'t return to the inner solar system until around the year 8786'],
    stats: { diameter: '~5 km', day: '7.6 hours', year: '~6,766 years', moons: 0, distance: '0.29–630 AU' }},
]

// ─── Comet with glowing ion tail ─────────────────────────────
function Comet({ comet, onSelect, onHover, hovered, selected }) {
  const groupRef = useRef()
  const tailRef = useRef()
  const angleRef = useRef(Math.random() * Math.PI * 2)
  const isActive = selected === comet.id || hovered === comet.id

  const orbit = useMemo(() => {
    const a = (comet.orbit + comet.perihelion) / 2
    const c = (comet.orbit - comet.perihelion) / 2
    const e = c / a
    const b = a * Math.sqrt(1 - e * e)
    return { a, b, c, e }
  }, [comet])

  const tailPositions = useMemo(() => new Float32Array(60 * 3), [])
  const tailOpacities = useMemo(() => new Float32Array(60), [])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    angleRef.current += comet.speed * delta

    const lx = Math.cos(angleRef.current) * orbit.a - orbit.c
    const lz = Math.sin(angleRef.current) * orbit.b
    const cosInc = Math.cos(comet.inclination)
    const sinInc = Math.sin(comet.inclination)
    const x = lx
    const y = lz * sinInc
    const z = lz * cosInc

    groupRef.current.position.set(x, y, z)

    // Tail: always points AWAY from the Sun (origin)
    if (tailRef.current) {
      const dist = Math.sqrt(x * x + y * y + z * z)
      const dx = x / dist, dy = y / dist, dz = z / dist
      const tailLen = Math.max(3, 15 * (1 / (dist * 0.05 + 0.5)))
      for (let i = 0; i < 60; i++) {
        const t = i / 59
        tailPositions[i * 3] = dx * t * tailLen + (Math.random() - 0.5) * t * 0.5
        tailPositions[i * 3 + 1] = dy * t * tailLen + (Math.random() - 0.5) * t * 0.3
        tailPositions[i * 3 + 2] = dz * t * tailLen + (Math.random() - 0.5) * t * 0.5
        tailOpacities[i] = 1 - t
      }
      tailRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <group ref={groupRef}>
      {/* Comet nucleus */}
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect({ ...comet, isComet: true }) }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(comet.id); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = 'default' }}
      >
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color={comet.color} />
      </mesh>
      {/* Coma glow */}
      <mesh>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshBasicMaterial color={comet.color} transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Ion tail */}
      <points ref={tailRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[tailPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.15} color={comet.tailColor} transparent opacity={0.6} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>
      {/* Label */}
      <Html
        position={[0, 1.2, 0]}
        center
        distanceFactor={50}
        style={{ pointerEvents: 'none', opacity: isActive ? 1 : 0.5, transition: 'opacity 0.3s' }}
      >
        <div className="flex flex-col items-center gap-0.5 whitespace-nowrap">
          <span className="text-[9px] font-medium tracking-[0.12em] drop-shadow-lg" style={{ color: comet.color }}>
            ☄ {comet.name}
          </span>
        </div>
      </Html>
    </group>
  )
}

// ─── Distant Stars (labeled points in deep space) ────────────
const STARS = [
  { id: 'alpha-centauri', name: 'Alpha Centauri', color: '#fff8e0', size: 3,
    position: [600, 300, 200], brightness: 1.0,
    tagline: 'Our nearest neighbor',
    facts: ['Closest star system to Earth at 4.37 light-years away','Actually a triple star system: Alpha Centauri A, B, and Proxima Centauri','Proxima Centauri has a confirmed exoplanet in the habitable zone (Proxima b)','Alpha Centauri A is similar to our Sun in size and brightness','Visible only from the Southern Hemisphere','Would take about 6,300 years to reach with current spacecraft','Part of the constellation Centaurus'],
    stats: { diameter: '1.22× Sun', day: '22 Earth days', year: '80 years (A+B orbit)', moons: 0, distance: '4.37 light-years' }},
  { id: 'sirius', name: 'Sirius', color: '#c8d8ff', size: 4,
    position: [-550, 150, -400], brightness: 1.2,
    tagline: 'The Dog Star',
    facts: ['Brightest star in Earth\'s night sky (apparent magnitude -1.46)','Located 8.6 light-years from Earth','Actually a binary system: Sirius A and the white dwarf Sirius B','25× more luminous than our Sun','Known since antiquity — the ancient Egyptians based their calendar on it','Name comes from the Greek word "Seirios" meaning "glowing" or "scorching"','Sirius B was one of the first white dwarfs ever discovered'],
    stats: { diameter: '1.71× Sun', day: '5.4 Earth days', year: 'Binary orbit: 50 years', moons: 0, distance: '8.6 light-years' }},
  { id: 'betelgeuse', name: 'Betelgeuse', color: '#ff6030', size: 8,
    position: [350, -300, 700], brightness: 0.9,
    tagline: 'The dying red giant',
    facts: ['A red supergiant nearing the end of its life — will explode as a supernova','If placed at our Sun, its surface would extend past Jupiter\'s orbit','About 700 light-years from Earth in the constellation Orion','Dramatically dimmed in 2019-2020 (the "Great Dimming") — caused by a dust cloud','When it goes supernova, it will briefly outshine the full Moon','One of the largest stars visible to the naked eye','Only about 10 million years old despite its massive size'],
    stats: { diameter: '~1,000× Sun', day: '~36 years', year: 'N/A', moons: 0, distance: '~700 light-years' }},
  { id: 'polaris', name: 'Polaris', color: '#f0f0ff', size: 3.5,
    position: [0, 800, -100], brightness: 0.8,
    tagline: 'The North Star',
    facts: ['Currently Earth\'s North Star — less than 1° from the celestial north pole','Actually a triple star system: Polaris A, Ab, and B','A Cepheid variable star that pulsates in brightness every ~4 days','About 433 light-years from Earth','Has guided navigators for centuries across oceans and deserts','Polaris A is a yellow supergiant about 45× the diameter of our Sun','Won\'t always be the North Star — Earth\'s axis precesses over 26,000 years'],
    stats: { diameter: '45× Sun', day: '~120 days', year: 'Pulsation: 3.97 days', moons: 0, distance: '~433 light-years' }},
]

function DistantStar({ star, onSelect, onHover, hovered, selected }) {
  const meshRef = useRef()
  const glowRef = useRef()
  const isActive = selected === star.id || hovered === star.id

  useFrame((_, delta) => {
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(Date.now() * 0.002) * 0.08)
    }
  })

  return (
    <group position={star.position}>
      {/* Star core */}
      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); onSelect({ ...star, isStar: true }) }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(star.id); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = 'default' }}
      >
        <sphereGeometry args={[star.size, 16, 16]} />
        <meshBasicMaterial color={star.color} />
      </mesh>
      {/* Glow */}
      <mesh ref={glowRef} scale={2.5}>
        <sphereGeometry args={[star.size, 16, 16]} />
        <meshBasicMaterial color={star.color} transparent opacity={isActive ? 0.25 : 0.12} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Cross-shaped lens flare */}
      <sprite scale={[star.size * 8, star.size * 0.3, 1]}>
        <spriteMaterial color={star.color} transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <sprite scale={[star.size * 0.3, star.size * 8, 1]}>
        <spriteMaterial color={star.color} transparent opacity={0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {/* Label */}
      <Html
        position={[0, star.size * 3, 0]}
        center
        distanceFactor={600}
        style={{ pointerEvents: 'none', opacity: isActive ? 1 : 0.5, transition: 'opacity 0.3s' }}
      >
        <div className="flex flex-col items-center gap-0.5 whitespace-nowrap">
          <span className="text-[9px] font-medium tracking-[0.12em] drop-shadow-lg" style={{ color: star.color }}>
            ✦ {star.name}
          </span>
          <span className="text-[7px] tracking-[0.1em] text-white/25">{star.stats.distance}</span>
        </div>
      </Html>
    </group>
  )
}

// ─── Space Probes & Missions ─────────────────────────────────
const PROBES = [
  { id: 'voyager1', name: 'Voyager 1', color: '#e0d0b0', symbol: '🛰',
    position: [250, 30, -180],
    tagline: 'The farthest human-made object',
    facts: ['Launched September 5, 1977 — still transmitting after 47+ years','Most distant human-made object at 24+ billion km from Earth','Entered interstellar space in August 2012','Carries the Golden Record with sounds and images of Earth for alien civilizations','Powered by plutonium-238 radioisotope thermoelectric generators','Took the famous "Pale Blue Dot" photo of Earth from 6 billion km away','Communicates at 160 bits per second — slower than a 1980s modem'],
    stats: { diameter: '3.7m dish', day: 'N/A', year: 'Launched 1977', moons: 0, distance: '24+ billion km' }},
  { id: 'voyager2', name: 'Voyager 2', color: '#b0c0e0', symbol: '🛰',
    position: [-220, -40, 230],
    tagline: 'The grand tour spacecraft',
    facts: ['Only spacecraft to have visited all four giant planets','Launched August 20, 1977 — 16 days before Voyager 1','Entered interstellar space in November 2018','Only spacecraft to visit Uranus (1986) and Neptune (1989)','Still communicating with Earth from 20+ billion km away','Also carries a Golden Record identical to Voyager 1','NASA briefly lost contact in 2023 after a wrong command tilted its antenna'],
    stats: { diameter: '3.7m dish', day: 'N/A', year: 'Launched 1977', moons: 0, distance: '20+ billion km' }},
  { id: 'jwst', name: 'James Webb', color: '#ffd700', symbol: '🔭',
    position: [50, 8, 42],
    tagline: 'The golden eye',
    facts: ['Most powerful space telescope ever built — 100× more sensitive than Hubble','Orbits the L2 Lagrange point, 1.5 million km from Earth','Primary mirror is 6.5 meters across, made of 18 gold-coated beryllium segments','Sunshield is the size of a tennis court, keeps instruments at -233°C','Can see galaxies forming just 200 million years after the Big Bang','Cost $10 billion and took 25 years to build','Launched December 25, 2021 on an Ariane 5 rocket'],
    stats: { diameter: '6.5m mirror', day: 'N/A', year: 'Launched 2021', moons: 0, distance: '1.5M km from Earth' }},
  { id: 'iss', name: 'ISS', color: '#ffffff', symbol: '🏠',
    position: [29, 2.2, 28.5],
    tagline: 'Humanity\'s home in space',
    facts: ['Orbits Earth at 408 km altitude, completing one orbit every 90 minutes','Continuously inhabited since November 2, 2000','Size of a football field (109m × 73m)','Has been visited by 270+ people from 21 countries','Travels at 28,000 km/h — fast enough to go from NYC to LA in 10 minutes','Cost over $150 billion — most expensive structure ever built','Crew sees 16 sunrises and sunsets every 24 hours'],
    stats: { diameter: '109 × 73 m', day: '90 min orbit', year: 'Since 2000', moons: 0, distance: '408 km altitude' }},
]

function SpaceProbe({ probe, onSelect, onHover, hovered, selected }) {
  const ref = useRef()
  const isActive = selected === probe.id || hovered === probe.id

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.003
    }
  })

  // Different models per probe type
  const isISS = probe.id === 'iss'
  const isJWST = probe.id === 'jwst'
  const isVoyager = probe.id.startsWith('voyager')

  return (
    <group position={probe.position}>
      <group
        ref={ref}
        onClick={(e) => { e.stopPropagation(); onSelect({ ...probe, isProbe: true }) }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(probe.id); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = 'default' }}
      >
        {isISS ? (
          // ISS — truss + modules + solar panels
          <group scale={0.6}>
            {/* Main truss */}
            <mesh>
              <boxGeometry args={[4, 0.15, 0.15]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.3} />
            </mesh>
            {/* Habitat modules */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 1.2, 8]} rotation={[0, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#e8e0d8" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0.5, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.8, 8]} />
              <meshStandardMaterial color="#d0d8e0" metalness={0.6} roughness={0.4} />
            </mesh>
            {/* Solar panels (4 pairs) */}
            {[-1.5, -0.7, 0.7, 1.5].map((x, i) => (
              <group key={i} position={[x, 0, 0]}>
                <mesh position={[0, 0, 0.6]}>
                  <boxGeometry args={[0.5, 0.02, 0.9]} />
                  <meshStandardMaterial color="#1a237e" metalness={0.3} roughness={0.6} emissive="#1a237e" emissiveIntensity={0.1} />
                </mesh>
                <mesh position={[0, 0, -0.6]}>
                  <boxGeometry args={[0.5, 0.02, 0.9]} />
                  <meshStandardMaterial color="#1a237e" metalness={0.3} roughness={0.6} emissive="#1a237e" emissiveIntensity={0.1} />
                </mesh>
              </group>
            ))}
          </group>
        ) : isJWST ? (
          // JWST — hexagonal mirror + sunshield
          <group scale={0.8}>
            {/* Primary mirror (hexagonal arrangement) */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const rad = (angle * Math.PI) / 180
              const x = Math.cos(rad) * 0.5
              const y = Math.sin(rad) * 0.5
              return (
                <mesh key={i} position={[x, y, 0]} rotation={[0, 0, rad]}>
                  <circleGeometry args={[0.35, 6]} />
                  <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.1} side={THREE.DoubleSide} />
                </mesh>
              )
            })}
            {/* Center mirror */}
            <mesh>
              <circleGeometry args={[0.35, 6]} />
              <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.1} side={THREE.DoubleSide} />
            </mesh>
            {/* Sunshield layers */}
            <mesh position={[0, 0, -0.4]} rotation={[0, 0, Math.PI / 6]}>
              <planeGeometry args={[2.5, 1.3]} />
              <meshStandardMaterial color="#c0b090" metalness={0.2} roughness={0.8} transparent opacity={0.7} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, 0, -0.5]}>
              <planeGeometry args={[2.8, 1.5]} />
              <meshStandardMaterial color="#a09070" metalness={0.2} roughness={0.8} transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ) : isVoyager ? (
          // Voyager — bus + dish + boom + RTG
          <group scale={0.5}>
            {/* Main bus (10-sided prism) */}
            <mesh>
              <cylinderGeometry args={[0.4, 0.4, 0.3, 10]} />
              <meshStandardMaterial color="#d0c8b8" metalness={0.7} roughness={0.3} />
            </mesh>
            {/* High-gain antenna dish */}
            <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.9, 0.4, 32, 1, true]} />
              <meshStandardMaterial color="#e8e8e8" metalness={0.8} roughness={0.2} side={THREE.DoubleSide} />
            </mesh>
            {/* Magnetometer boom */}
            <mesh position={[1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, 3, 4]} />
              <meshStandardMaterial color="#808080" metalness={0.9} roughness={0.2} />
            </mesh>
            {/* RTG (power source) */}
            <mesh position={[-0.8, -0.2, 0]} rotation={[0, 0, -Math.PI / 4]}>
              <cylinderGeometry args={[0.08, 0.08, 0.8, 8]} />
              <meshStandardMaterial color="#303030" metalness={0.9} roughness={0.4} />
            </mesh>
            {/* Science boom */}
            <mesh position={[0, -0.3, 0.8]} rotation={[Math.PI / 3, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 1.5, 4]} />
              <meshStandardMaterial color="#808080" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        ) : (
          // Generic satellite fallback
          <group scale={0.6}>
            <mesh>
              <boxGeometry args={[0.6, 0.6, 0.8]} />
              <meshStandardMaterial color={probe.color} metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[1, 0, 0]}>
              <boxGeometry args={[1.2, 0.05, 0.6]} />
              <meshStandardMaterial color="#1a237e" metalness={0.3} roughness={0.5} />
            </mesh>
            <mesh position={[-1, 0, 0]}>
              <boxGeometry args={[1.2, 0.05, 0.6]} />
              <meshStandardMaterial color="#1a237e" metalness={0.3} roughness={0.5} />
            </mesh>
          </group>
        )}
      </group>
      {/* Signal pulse */}
      {isActive && (
        <mesh scale={3}>
          <ringGeometry args={[1.5, 1.6, 32]} />
          <meshBasicMaterial color={probe.color} transparent opacity={0.3} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      {/* Label */}
      <Html
        position={[0, 4, 0]}
        center
        distanceFactor={200}
        style={{ pointerEvents: 'none', opacity: isActive ? 1 : 0.45, transition: 'opacity 0.3s' }}
      >
        <div className="flex flex-col items-center gap-0.5 whitespace-nowrap">
          <span className="text-[8px] font-medium tracking-[0.1em] drop-shadow-lg" style={{ color: probe.color }}>
            {probe.symbol} {probe.name}
          </span>
        </div>
      </Html>
    </group>
  )
}

// ─── Galaxies & Nebulae (ethereal deep-sky markers) ──────────
const DEEP_SKY = [
  { id: 'andromeda', name: 'Andromeda Galaxy', color: '#c8b8ff', size: 40,
    position: [800, 200, -500],
    tagline: 'Our nearest spiral galaxy',
    facts: ['Nearest large galaxy to the Milky Way at 2.537 million light-years','Contains roughly 1 trillion stars — more than twice the Milky Way','On a collision course with the Milky Way — they\'ll merge in about 4.5 billion years','Visible to the naked eye as a faint smudge on dark nights','Also known as Messier 31 (M31)','Spans 220,000 light-years across — larger than our Milky Way','Has at least 26 known satellite galaxies orbiting it'],
    stats: { diameter: '220,000 ly', day: 'N/A', year: 'N/A', moons: 0, distance: '2.537M light-years' }},
  { id: 'orion-nebula', name: 'Orion Nebula', color: '#ff8090', size: 25,
    position: [-700, -200, 600],
    tagline: 'The stellar nursery',
    facts: ['One of the brightest nebulae — visible to the naked eye','Located 1,344 light-years from Earth in the "sword" of Orion','An active star-forming region — new stars are being born inside it','About 24 light-years across','Contains the Trapezium Cluster — four hot, young stars at its core','Also known as Messier 42 (M42)','Approximately 2 million years old'],
    stats: { diameter: '24 light-years', day: 'N/A', year: 'N/A', moons: 0, distance: '1,344 light-years' }},
  { id: 'crab-nebula', name: 'Crab Nebula', color: '#60d0ff', size: 20,
    position: [500, 600, 700],
    tagline: 'The supernova remnant',
    facts: ['Remnant of a supernova observed by Chinese astronomers in 1054 AD','Contains a pulsar spinning 30 times per second at its center','Located 6,523 light-years from Earth in the constellation Taurus','About 11 light-years across and still expanding','The pulsar emits pulses of radiation from gamma rays to radio waves','Also known as Messier 1 (M1) — the first object in Messier\'s catalog','The supernova was bright enough to be visible in daylight for 23 days'],
    stats: { diameter: '11 light-years', day: 'Pulsar: 33ms', year: 'Age: ~970 years', moons: 0, distance: '6,523 light-years' }},
  { id: 'pillars', name: 'Pillars of Creation', color: '#b0a080', size: 30,
    position: [-600, 400, -900],
    tagline: 'Cosmic cathedral',
    facts: ['Iconic columns of gas and dust in the Eagle Nebula (M16)','Located 6,500-7,000 light-years from Earth','The tallest pillar is about 4 light-years long — roughly the distance to Alpha Centauri','Famously photographed by Hubble in 1995 and again by JWST in 2022','Stars are actively forming inside the pillars','Ultraviolet light from nearby hot stars is slowly eroding them away','May have already been destroyed by a supernova — we won\'t see it for 1,000 years'],
    stats: { diameter: '~5 ly tall', day: 'N/A', year: 'N/A', moons: 0, distance: '~7,000 light-years' }},
]

function DeepSkyObject({ obj, onSelect, onHover, hovered, selected }) {
  const ref = useRef()
  const isActive = selected === obj.id || hovered === obj.id

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.z += 0.001
      const pulse = 1 + Math.sin(Date.now() * 0.001) * 0.05
      ref.current.scale.setScalar(pulse)
    }
  })

  return (
    <group position={obj.position}>
      {/* Ethereal nebula sprite */}
      <sprite
        ref={ref}
        scale={[obj.size * 6, obj.size * 6, 1]}
        onClick={(e) => { e.stopPropagation(); onSelect({ ...obj, isDeepSky: true }) }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(obj.id); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { onHover(null); document.body.style.cursor = 'default' }}
      >
        <spriteMaterial color={obj.color} transparent opacity={isActive ? 0.35 : 0.15} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {/* Core glow */}
      <sprite scale={[obj.size * 2, obj.size * 2, 1]}>
        <spriteMaterial color={obj.color} transparent opacity={isActive ? 0.5 : 0.25} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {/* Label */}
      <Html
        position={[0, obj.size * 4, 0]}
        center
        distanceFactor={1200}
        style={{ pointerEvents: 'none', opacity: isActive ? 1 : 0.5, transition: 'opacity 0.3s' }}
      >
        <div className="flex flex-col items-center gap-0.5 whitespace-nowrap">
          <span className="text-[9px] font-medium tracking-[0.12em] drop-shadow-lg" style={{ color: obj.color }}>
            ✧ {obj.name}
          </span>
          <span className="text-[7px] tracking-[0.1em] text-white/25">{obj.stats.distance}</span>
        </div>
      </Html>
    </group>
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
      <KuiperBelt />
      <OortCloud />
      {COMETS.map(c => (
        <Comet key={c.id} comet={c} onSelect={onSelect} onHover={onHover} hovered={hovered} selected={selected?.id} />
      ))}
      {STARS.map(s => (
        <DistantStar key={s.id} star={s} onSelect={onSelect} onHover={onHover} hovered={hovered} selected={selected?.id} />
      ))}
      {PROBES.map(p => (
        <SpaceProbe key={p.id} probe={p} onSelect={onSelect} onHover={onHover} hovered={hovered} selected={selected?.id} />
      ))}
      {DEEP_SKY.map(d => (
        <DeepSkyObject key={d.id} obj={d} onSelect={onSelect} onHover={onHover} hovered={hovered} selected={selected?.id} />
      ))}
      {PLANETS.filter(p => p.inclination < 0.35).map(p => (
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
          <div className="text-[9px] font-mono tracking-[0.4em] text-white/15 animate-pulse">ZOOM OUT TO TRAVEL THE UNIVERSE · CLICK TO EXPLORE</div>
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
