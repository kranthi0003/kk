import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAmbient } from './AmbientContext'

/* ------------------------------------------------------------------ *
 * #/walle — a good-luck note for Amrutha's talk at the Tech Summit,
 * delivered by one small trash-compacting robot.
 *
 * She loves WALL·E, so the note is something she does rather than
 * something she reads. Three actions, each one his:
 *
 *   1. He runs on sunlight. Hold the sun and he unfolds out of his
 *      cube, looks around, and says her name.
 *   2. He keeps the good things he finds. Tap the heap and he digs out
 *      a plant in a boot, and presents it the only way he knows: ta-da.
 *   3. What he wants most is to hold someone's hand. Hold his, and the
 *      message arrives.
 *
 * Everything is drawn from scratch in SVG and every sound is synthesised
 * in the browser. Nothing is taken from the film — no frames, no sound
 * effects, no music — so this stays a fan's homage, not a copy.
 *
 * Private and unlisted, shared directly by link. Not in nav. First name
 * only, like the other personal notes on this site. The date and topic
 * of the talk are not on the page because they were not known when it
 * was written, and nothing here should be invented.
 * ------------------------------------------------------------------ */

const CHARGE_MS = 1900
const HAND_MS = 1500

// Robot syllables: [start Hz, end Hz, seconds]. "Am-ru-tha", then "ta-da".
const NAME_CHIRP = [[440, 610, 0.13], [650, 520, 0.12], [540, 840, 0.26]]
const TADA_CHIRP = [[560, 560, 0.12], [700, 1000, 0.3]]

// One-shot motions, played with the Web Animations API on inner groups so
// they never fight the CSS poses on the groups around them.
const LOOK = [
  { transform: 'rotate(0deg)' },
  { transform: 'rotate(-9deg)', offset: 0.22 },
  { transform: 'rotate(-9deg)', offset: 0.4 },
  { transform: 'rotate(8deg)', offset: 0.62 },
  { transform: 'rotate(8deg)', offset: 0.78 },
  { transform: 'rotate(0deg)' },
]
const HOP = [
  { transform: 'translateY(0)' },
  { transform: 'translateY(-7px)', offset: 0.35 },
  { transform: 'translateY(0)', offset: 0.7 },
  { transform: 'translateY(-3px)', offset: 0.85 },
  { transform: 'translateY(0)' },
]
const WIGGLE = [
  { transform: 'rotate(0deg)' },
  { transform: 'rotate(-3deg)' },
  { transform: 'rotate(3deg)' },
  { transform: 'rotate(-2deg)' },
  { transform: 'rotate(0deg)' },
]
const SHAKE = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-3px)' },
  { transform: 'translateX(3px)' },
  { transform: 'translateX(-2px)' },
  { transform: 'translateX(0)' },
]
const DIG_ARM = [
  { transform: 'rotate(0deg)' },
  { transform: 'rotate(36deg)', offset: 0.38 },
  { transform: 'rotate(30deg)', offset: 0.55 },
  { transform: 'rotate(38deg)', offset: 0.7 },
  { transform: 'rotate(0deg)' },
]
const DIG_BEAM = [
  { transform: 'scaleX(1)' },
  { transform: 'scaleX(2.05)', offset: 0.38 },
  { transform: 'scaleX(1.8)', offset: 0.55 },
  { transform: 'scaleX(2.1)', offset: 0.7 },
  { transform: 'scaleX(1)' },
]
const DIG_HAND = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(32px)', offset: 0.38 },
  { transform: 'translateX(24px)', offset: 0.55 },
  { transform: 'translateX(33px)', offset: 0.7 },
  { transform: 'translateX(0)' },
]
const DIG_LEAN = [
  { transform: 'rotate(0deg)' },
  { transform: 'rotate(3deg)', offset: 0.4 },
  { transform: 'rotate(2deg)', offset: 0.6 },
  { transform: 'rotate(0deg)' },
]

const BIT_COLS = ['#8d939a', '#b5652b', '#3f7f86', '#d6ae62', '#6b4a32', '#a7aeb5']

// Positions in the robot's own drawing units (viewBox 0 0 260 300).
const HAND_TIP = { x: -14, y: 193 } // his left fingertips, arm out
const ORB_FROM = -46 // where her light starts…
const ORB_TO = -20 // …and how close it gets before they touch
const ORB_Y = 194

/* ------------------------------------------------------------------ *
 * Sound. All synthesised, nothing sampled. Web Audio follows the
 * phone's silent switch on iOS, so a muted phone stays muted.
 * ------------------------------------------------------------------ */
function createSfx() {
  const AC = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null
  let ctx = null
  let out = null
  let muted = false
  let hum = null
  let crackle = 0
  let noiseBuf = null

  const get = () => {
    if (!AC || muted) return null
    if (!ctx) {
      try {
        ctx = new AC()
        out = ctx.createGain()
        out.gain.value = 0.6
        out.connect(ctx.destination)
      } catch {
        ctx = null
        return null
      }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    return ctx
  }

  const noise = (c) => {
    if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf
    const len = Math.floor(c.sampleRate * 1.5)
    noiseBuf = c.createBuffer(1, len, c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    return noiseBuf
  }

  const tone = ({ type = 'sine', f0, f1 = f0, at = 0, dur = 0.2, vol = 0.06, attack = 0.008, lp = 0 }) => {
    const c = get()
    if (!c) return
    const t = c.currentTime + at
    const o = c.createOscillator()
    o.type = type
    o.frequency.setValueAtTime(f0, t)
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.85)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    let src = o
    if (lp) {
      const f = c.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = lp
      o.connect(f)
      src = f
    }
    src.connect(g)
    g.connect(out)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  const burst = ({ at = 0, dur = 0.08, vol = 0.1, type = 'bandpass', freq = 1400, q = 1 }) => {
    const c = get()
    if (!c) return
    const t = c.currentTime + at
    const s = c.createBufferSource()
    s.buffer = noise(c)
    const f = c.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    f.Q.value = q
    const g = c.createGain()
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    s.connect(f)
    f.connect(g)
    g.connect(out)
    s.start(t, Math.random() * 1.2)
    s.stop(t + dur + 0.02)
  }

  const humStop = () => {
    if (!hum) return
    const h = hum
    hum = null
    if (!ctx) return
    const t = ctx.currentTime
    try {
      h.g.gain.cancelScheduledValues(t)
      h.g.gain.setTargetAtTime(0.0001, t, 0.05)
      h.o.stop(t + 0.3)
      h.o2.stop(t + 0.3)
    } catch {}
  }

  const crackleStop = () => {
    if (crackle) clearInterval(crackle)
    crackle = 0
  }

  return {
    unlock() {
      get()
    },
    setMuted(m) {
      muted = m
      if (m) {
        humStop()
        crackleStop()
      }
      if (out) out.gain.value = m ? 0 : 0.6
    },
    // The charging hum climbs with the charge, so holding longer sounds
    // like it is getting somewhere.
    humStart() {
      const c = get()
      if (!c || hum) return
      const t = c.currentTime
      const o = c.createOscillator()
      o.type = 'sawtooth'
      o.frequency.value = 70
      const o2 = c.createOscillator()
      o2.type = 'sine'
      o2.frequency.value = 150
      const f = c.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = 480
      f.Q.value = 3
      const g = c.createGain()
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.045, t + 0.12)
      o.connect(f)
      o2.connect(f)
      f.connect(g)
      g.connect(out)
      o.start(t)
      o2.start(t)
      hum = { o, o2, f, g }
    },
    humSet(p) {
      if (!hum || !ctx) return
      const t = ctx.currentTime
      hum.o.frequency.setTargetAtTime(70 + p * 120, t, 0.06)
      hum.o2.frequency.setTargetAtTime(150 + p * 380, t, 0.06)
      hum.f.frequency.setTargetAtTime(480 + p * 1800, t, 0.06)
    },
    humStop,
    // A rising four-note arpeggio for "fully charged".
    chime() {
      ;[[784, 0], [1046.5, 0.08], [1318.5, 0.16], [1568, 0.26]].forEach(([f, at]) => {
        tone({ f0: f, at, dur: 1.2, vol: 0.055, attack: 0.012 })
        tone({ f0: f * 2, at, dur: 0.45, vol: 0.012, attack: 0.005 })
      })
    },
    chirp(seq) {
      let at = 0
      for (const [a, b, d] of seq) {
        tone({ type: 'square', f0: a, f1: b, at, dur: d, vol: 0.035, lp: 1700 })
        tone({ type: 'triangle', f0: a * 2, f1: b * 2, at, dur: d, vol: 0.018 })
        at += d + 0.05
      }
    },
    pop() {
      tone({ f0: 380, f1: 920, dur: 0.18, vol: 0.06 })
    },
    clank() {
      burst({ dur: 0.1, vol: 0.18, freq: 700 + Math.random() * 700, q: 1.6 })
      tone({ type: 'triangle', f0: 1500 + Math.random() * 900, f1: 1300, at: 0.01, dur: 0.18, vol: 0.03 })
      burst({ at: 0.09, dur: 0.06, vol: 0.07, freq: 2400, q: 2 })
    },
    crackleStart() {
      if (crackle || !get()) return
      crackle = setInterval(() => {
        if (Math.random() < 0.65) {
          burst({
            dur: 0.02 + Math.random() * 0.025,
            vol: 0.035 + Math.random() * 0.05,
            type: 'highpass',
            freq: 2800 + Math.random() * 2000,
            q: 0.8,
          })
        }
      }, 45)
    },
    crackleStop,
    bloom() {
      ;[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
        tone({ f0: f, at: i * 0.07, dur: 2.6, vol: 0.032, attack: 0.15 })
      )
      burst({ dur: 1.1, vol: 0.05, type: 'lowpass', freq: 1200, q: 0.5 })
    },
    close() {
      humStop()
      crackleStop()
      const c = ctx
      ctx = null
      out = null
      noiseBuf = null
      try {
        const r = c && c.close()
        if (r && r.catch) r.catch(() => {})
      } catch {}
    },
  }
}

/* ------------------------------------------------------------------ *
 * The city: towers of compacted cubes, the way he leaves them. Each
 * tower is a stack of slightly misaligned blocks, which is what gives
 * the skyline its ragged edge. Seeded, so it is the same every visit.
 * ------------------------------------------------------------------ */
function makeRand(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function skyline(seed, { count, minH, maxH, minW, maxW, start, gap }) {
  const r = makeRand(seed)
  let x = start
  let d = ''
  for (let i = 0; i < count; i++) {
    const w = minW + r() * (maxW - minW)
    const h = minH + r() * (maxH - minH)
    const top = 600 - h
    let y = 600
    while (y > top + 2) {
      const bh = Math.max(10, Math.min(w * (0.36 + r() * 0.34), y - top))
      const bw = w * (0.86 + r() * 0.2)
      const bx = x + (w - bw) / 2 + (r() - 0.5) * w * 0.14
      d += `M${bx.toFixed(1)} ${y.toFixed(1)}h${bw.toFixed(1)}v${(-bh - 0.6).toFixed(1)}h${(-bw).toFixed(1)}z`
      y -= bh
    }
    x += w * (gap[0] + r() * (gap[1] - gap[0]))
  }
  return d
}

const FAR = skyline(7, { count: 24, minH: 150, maxH: 360, minW: 54, maxW: 104, start: -60, gap: [0.7, 1.4] })
const NEAR = skyline(19, { count: 15, minH: 70, maxH: 240, minW: 80, maxW: 150, start: -40, gap: [0.9, 1.9] })

// Fixed pseudo-random scatter, so the sky is identical on every visit.
const STARS = Array.from({ length: 56 }, (_, i) => {
  const rx = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1
  const ry = Math.abs(Math.sin(i * 78.233) * 12345.6789) % 1
  return {
    left: (rx * 98 + 1).toFixed(2) + '%',
    top: (ry * 60 + 1).toFixed(2) + '%',
    size: (1 + (i % 3) * 0.6).toFixed(1) + 'px',
    delay: ((i * 0.61) % 6).toFixed(2) + 's',
    dur: (3.4 + (i % 5) * 1.1).toFixed(1) + 's',
    op: (0.35 + (i % 4) * 0.17).toFixed(2),
  }
})

const DUST = Array.from({ length: 18 }, (_, i) => {
  const r = Math.abs(Math.sin(i * 45.164) * 9631.71) % 1
  return {
    top: (30 + r * 55).toFixed(1) + '%',
    size: (1.5 + (i % 4) * 0.8).toFixed(1) + 'px',
    delay: (-((i * 1.9) % 24)).toFixed(1) + 's',
    dur: (16 + (i % 6) * 2.5).toFixed(1) + 's',
  }
})

// The sun on his chest gauge.
const RAYS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4
  return {
    x1: 82 + Math.cos(a) * 6.4,
    y1: 152 + Math.sin(a) * 6.4,
    x2: 82 + Math.cos(a) * 8.6,
    y2: 152 + Math.sin(a) * 8.6,
  }
})

/* ------------------------------------------------------------------ *
 * The drawing. One coordinate space, viewBox 0 0 260 300, ground at
 * y = 296. He is drawn facing us; the right-hand parts are the left-hand
 * ones mirrored about x = 130.
 * ------------------------------------------------------------------ */
const TREAD = 'M36 212 L64 212 Q68 212 68.5 216 L73 291 Q73 296 68 296 L24 296 Q19 296 19.5 291 L31 216 Q31.5 212 36 212 Z'
const GROOVES = [222, 231, 240, 249, 258, 267, 276, 285, 294]
const EYE = 'M118 34 L87 27 Q76 25 76 36 L77 68 Q78 78 88 78 L118 78 Q126 78 126 70 L126 42 Q126 35 118 34 Z'
const MIRROR = 'translate(260 0) scale(-1 1)'

function Tread() {
  return (
    <g>
      <path d={TREAD} fill="#3f3b35" stroke="#24221e" strokeWidth="2" />
      <g clipPath="url(#wl-treadclip)" stroke="#2a2723" strokeWidth="3.2">
        {GROOVES.map((y) => (
          <line key={y} x1="10" y1={y} x2="80" y2={y} />
        ))}
      </g>
      <rect x="33" y="207" width="34" height="9" rx="3.5" fill="#5d5850" stroke="#2a2723" strokeWidth="1.5" />
    </g>
  )
}

// One binocular eye. The top lid blinks; the bottom lid rises into a
// crescent when he is happy.
function Eye() {
  return (
    <g>
      <path d={EYE} fill="url(#wl-eyeg)" stroke="#7f796f" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="101" cy="54" r="19.5" fill="#6d6860" />
      <circle cx="101" cy="54" r="16" fill="url(#wl-lens)" />
      <circle cx="101" cy="54" r="9.5" fill="none" stroke="#5c6880" strokeWidth="2.2" />
      <circle cx="101" cy="54" r="5" fill="#07090c" />
      <circle cx="95" cy="48" r="3.8" fill="#fff" opacity=".92" />
      <circle cx="107" cy="60" r="1.8" fill="#fff" opacity=".55" />
      <g clipPath="url(#wl-lensclip)">
        <rect className="wl-lid" x="82" y="36" width="38" height="37" fill="#c9c3b8" />
        <ellipse className="wl-lidb" cx="101" cy="84" rx="24" ry="14" fill="#c9c3b8" />
      </g>
    </g>
  )
}

function HandL() {
  return (
    <g>
      <rect x="12" y="191" width="22" height="29" rx="6" fill="#9c978d" stroke="#57524a" strokeWidth="2" />
      <rect x="14" y="189.5" width="18" height="6" rx="2" fill="#77726a" />
      <line x1="23" y1="205" x2="23" y2="219" stroke="#57524a" strokeWidth="1.8" strokeLinecap="round" />
      <rect x="31" y="200" width="7" height="12" rx="3" fill="#8c877d" stroke="#57524a" strokeWidth="1.6" />
    </g>
  )
}

function BeamL() {
  return (
    <rect x="30" y="189" width="31" height="14" rx="3" fill="#8c877d" stroke="#57524a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
  )
}

// An old boot with a seedling in it. Drawn around its own bottom-centre,
// so the same drawing can sit in his hand or on the ground.
function Boot() {
  return (
    <g>
      <rect x="-27" y="-5" width="57" height="5" rx="2" fill="#3a2416" />
      <path d="M-24 -4 L-24 -18 Q-24 -22 -19 -22 L8 -22 Q22 -21 27 -12 Q29 -8 28 -4 Z" fill="#7d4b2b" stroke="#4b2a17" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M-13 -52 L9 -52 L10 -20 L-15 -20 Z" fill="#86522f" stroke="#4b2a17" strokeWidth="1.6" strokeLinejoin="round" />
      <g stroke="#e2d3b0" strokeWidth="1.5" strokeLinecap="round">
        <line x1="-9" y1="-45" x2="5" y2="-41" />
        <line x1="-9" y1="-41" x2="5" y2="-45" />
        <line x1="-9" y1="-35" x2="5" y2="-31" />
        <line x1="-9" y1="-31" x2="5" y2="-35" />
      </g>
      <path d="M-20 -15 Q-9 -18 3 -16" fill="none" stroke="#fff" strokeOpacity=".2" strokeWidth="2" strokeLinecap="round" />
      <rect x="-15" y="-56" width="26" height="6" rx="2" fill="#6e4124" stroke="#4b2a17" strokeWidth="1.4" />
      <path d="M-2 -54 C-2 -61 -1 -68 -2 -77" fill="none" stroke="#4e9a4c" strokeWidth="2.4" strokeLinecap="round" />
      <path className="wl-leaf wl-leaf-3" d="M-2 -63 C3 -68 10 -68 13 -63 C9 -59 3 -59 -2 -63 Z" fill="#86cf73" stroke="#4e9a4c" strokeWidth="1" />
      <path className="wl-leaf wl-leaf-1" d="M-2 -74 C-8 -82 -17 -82 -21 -76 C-15 -70 -7 -70 -2 -74 Z" fill="#7cc66b" stroke="#4e9a4c" strokeWidth="1" />
      <path className="wl-leaf wl-leaf-2" d="M-2 -76 C4 -85 13 -86 18 -80 C12 -73 4 -72 -2 -76 Z" fill="#8fd67a" stroke="#4e9a4c" strokeWidth="1" />
      <ellipse cx="-2" cy="-55" rx="11" ry="3.2" fill="#3d281a" />
    </g>
  )
}

// The one he was waiting for. She only appears once her hand is in his.
function Eve() {
  return (
    <g className="wl-eve">
      <ellipse className="wl-eve-hover" cx="-80" cy="291" rx="28" ry="5" fill="#8fd8ff" />
      <ellipse cx="-114" cy="212" rx="8" ry="31" transform="rotate(7 -114 212)" fill="url(#wl-eveg)" stroke="#b6c1d0" strokeWidth="1" />
      <path d="M-80 168 C-56 168 -46 186 -47 206 C-48 232 -62 262 -80 262 C-98 262 -112 232 -113 206 C-114 186 -104 168 -80 168 Z" fill="url(#wl-eveg)" stroke="#b6c1d0" strokeWidth="1" />
      <path d="M-101 182 Q-93 173 -81 172" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".85" />
      <ellipse cx="-33" cy="189" rx="22" ry="7.5" transform="rotate(13.4 -33 189)" fill="url(#wl-eveg)" stroke="#b6c1d0" strokeWidth="1" />
      <g className="wl-eve-head">
        <ellipse cx="-80" cy="142" rx="30" ry="20" fill="url(#wl-eveg)" stroke="#b6c1d0" strokeWidth="1" />
        <ellipse cx="-78" cy="144" rx="24" ry="14" fill="#0a0d13" />
        <path d="M-96 139 Q-89 132 -77 132" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="2" strokeLinecap="round" />
        <g filter="url(#wl-glow)" stroke="#6fd6ff" strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M-91 148 Q-86 140 -81 148" />
          <path d="M-75 148 Q-70 140 -65 148" />
        </g>
      </g>
    </g>
  )
}

// The heap he digs in. The two leaves peeking out of the top, and the
// glint above them, are the clue.
function PileArt() {
  return (
    <g>
      <path className="wl-mound" d="M228 296 C238 262 262 226 296 210 C326 204 352 238 374 296 Z" fill="url(#wl-moundg)" />
      <circle cx="336" cy="266" r="13" fill="none" stroke="#2b2826" strokeWidth="7" />
      <circle cx="336" cy="266" r="4.5" fill="#57534d" />
      <rect x="350" y="277" width="18" height="18" rx="1.5" fill="#8a7650" stroke="#5a4a30" strokeWidth="1.4" />
      <path d="M352 283h14M352 289h14" stroke="#6d5c3c" strokeWidth="1.2" />
      <g className="wl-pi wl-pi-a">
        <g transform="rotate(-8 263 259)">
          <rect x="252" y="250" width="22" height="19" rx="2" fill="#a06e3f" stroke="#5a3a1e" strokeWidth="1.5" />
          <path d="M254 253 L271 266" stroke="#5a3a1e" strokeWidth="1.3" />
        </g>
      </g>
      <path className="wl-pi wl-pi-b" d="M280 232 l4 -6 l4 6 l4 -6 l4 6 l4 -6" fill="none" stroke="#a7aeb5" strokeWidth="2" strokeLinejoin="round" />
      <g className="wl-pi wl-pi-c">
        <g transform="rotate(14 314 244)">
          <rect x="308" y="236" width="12" height="17" rx="2" fill="#3f7f86" stroke="#23484c" strokeWidth="1.4" />
          <ellipse cx="314" cy="236.5" rx="6" ry="2" fill="#5ea3aa" />
        </g>
      </g>
      <g className="wl-pi wl-pi-d">
        <rect x="266" y="214" width="48" height="7" rx="3.5" fill="#8d9398" stroke="#5b6166" strokeWidth="1.4" transform="rotate(-14 290 217.5)" />
      </g>
      <g className="wl-pi wl-pi-e">
        <path d="M290 207 C287 201 282 200 279 203 C283 207 287 208 290 207 Z" fill="#7cc66b" stroke="#4e9a4c" strokeWidth=".8" />
        <path d="M290 207 C293 200 298 199 301 202 C297 207 293 208 290 207 Z" fill="#8fd67a" stroke="#4e9a4c" strokeWidth=".8" />
        <path className="wl-glint" d="M302 184 Q303 193 312 194 Q303 195 302 204 Q301 195 292 194 Q301 193 302 184 Z" fill="#fff6d8" />
      </g>
    </g>
  )
}

const SunIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <circle cx="12" cy="12" r="4.4" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
        const r = (a * Math.PI) / 180
        return <line key={a} x1={12 + Math.cos(r) * 7.4} y1={12 + Math.sin(r) * 7.4} x2={12 + Math.cos(r) * 10} y2={12 + Math.sin(r) * 10} />
      })}
    </g>
  </svg>
)

const DigIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M11 3 Q12 10.5 19 11.5 Q12 12.5 11 20 Q10 12.5 3 11.5 Q10 10.5 11 3 Z" fill="currentColor" />
    <path d="M19 2.5 Q19.4 5 21.5 5.4 Q19.4 5.8 19 8.3 Q18.6 5.8 16.5 5.4 Q18.6 5 19 2.5 Z" fill="currentColor" />
  </svg>
)

const HandIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 13V6.6a1.4 1.4 0 0 1 2.8 0V12" />
    <path d="M10.8 11.5V5.2a1.4 1.4 0 0 1 2.8 0v6.3" />
    <path d="M13.6 11.6V6.4a1.4 1.4 0 0 1 2.8 0v7.2c0 4-2.5 6.9-6.2 6.9-2.5 0-4-1.2-5.3-3.2l-2-3.4a1.4 1.4 0 0 1 2.3-1.6L8 15" />
  </svg>
)

const SoundIcon = ({ off }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="18" height="18">
    <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" />
    {off ? (
      <path d="M16 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    ) : (
      <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    )}
  </svg>
)

/* ------------------------------------------------------------------ *
 * The scene. Phases, in order:
 *   off → (hold) → waking → dig → (tap ×3) → tada → reach → (hold)
 *   → spark → done
 * Remounted with a new key to replay, so every timer, pose and
 * animation starts clean.
 * ------------------------------------------------------------------ */
function Scene({ sfx, reduced, onReplay }) {
  const rootRef = useRef(null)
  const botRef = useRef(null)
  const fxRef = useRef(null)
  const flashRef = useRef(null)
  const finalRef = useRef(null)
  const upperInRef = useRef(null)
  const headLookRef = useRef(null)
  const armRInRef = useRef(null)
  const beamRRef = useRef(null)
  const handRRef = useRef(null)
  const pileRef = useRef(null)
  const orbRef = useRef(null)
  const haloRef = useRef(null)
  const arcRefs = useRef([])

  const [phase, setPhase] = useState('off')
  const [started, setStarted] = useState(false)
  const [nearly, setNearly] = useState(false)
  const [bars, setBars] = useState(0)
  const [digs, setDigs] = useState(0)
  const [bubble, setBubble] = useState(null)
  const [holding, setHolding] = useState(false)

  const timers = useRef([])
  const hold = useRef({ active: false, kind: null, p: 0, raf: 0, last: 0, arcAt: 0 })
  const digBusy = useRef(false)
  const digsRef = useRef(0)
  const barsRef = useRef(0)
  const nearlyRef = useRef(false)

  // Waits shrink under reduced motion, but never below the time a line
  // needs to be read — those pass their own reduced value.
  const later = (fn, ms, rms) => {
    timers.current.push(setTimeout(fn, reduced ? (rms ?? Math.round(ms * 0.35)) : ms))
  }
  const play = (el, frames, opts) => (!reduced && el && el.animate ? el.animate(frames, opts) : null)
  const setVar = (k, v) => rootRef.current?.style.setProperty(k, String(v))

  useEffect(() => {
    const h = hold.current
    const t = timers.current
    return () => {
      t.forEach(clearTimeout)
      cancelAnimationFrame(h.raf)
      h.active = false
      sfx.humStop()
      sfx.crackleStop()
    }
  }, [sfx])

  // DOM-spawned particles, the same approach as the confetti on
  // #/allthebest: plain nodes that remove themselves when they land.
  const spawn = (n, make) => {
    const host = fxRef.current
    if (!host || reduced) return
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span')
      make(s)
      s.setAttribute('aria-hidden', 'true')
      host.appendChild(s)
      s.addEventListener('animationend', () => s.remove(), { once: true })
    }
  }

  const spawnBits = () =>
    spawn(7, (s) => {
      const size = 4 + Math.random() * 7
      s.className = 'wl-bit'
      s.style.width = size + 'px'
      s.style.height = (Math.random() > 0.5 ? size : size * 0.45) + 'px'
      s.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px'
      s.style.background = BIT_COLS[(Math.random() * BIT_COLS.length) | 0]
      s.style.left = 94 + Math.random() * 14 + '%'
      s.style.top = 74 + Math.random() * 6 + '%'
      s.style.setProperty('--dx', (Math.random() * 2 - 0.5) * 50 + 'px')
      s.style.setProperty('--dy', -(30 + Math.random() * 60) + 'px')
      s.style.setProperty('--rot', Math.random() * 720 - 360 + 'deg')
    })

  const motes = () =>
    spawn(16, (s) => {
      s.className = 'wl-mote'
      s.style.left = -9 + Math.random() * 7 + '%'
      s.style.top = 61 + Math.random() * 6 + '%'
      s.style.setProperty('--dx', (Math.random() * 2 - 1) * 70 + 'px')
      s.style.setProperty('--dy', -(90 + Math.random() * 220) + 'px')
      s.style.animationDelay = Math.random() * 0.5 + 's'
      s.style.animationDuration = 1.8 + Math.random() * 1.6 + 's'
    })

  const flash = () => {
    const el = flashRef.current
    const bot = botRef.current
    const root = rootRef.current
    if (!el || !bot || !root || reduced) return
    const b = bot.getBoundingClientRect()
    const r = root.getBoundingClientRect()
    el.style.setProperty('--fx', b.left - r.left + b.width * (-16 / 260) + 'px')
    el.style.setProperty('--fy', b.top - r.top + b.height * (ORB_Y / 300) + 'px')
    el.classList.remove('is-on')
    void el.offsetWidth
    el.classList.add('is-on')
  }

  // Her light drifts toward his hand as she holds, with a little
  // lightning between them. Written straight to the DOM — this runs
  // every frame and does not need React.
  const drawArcs = (p, force) => {
    const h = hold.current
    const now = performance.now()
    if (!force && now - h.arcAt < 50) return
    h.arcAt = now
    const gx = ORB_FROM + (ORB_TO - ORB_FROM) * p
    orbRef.current?.setAttribute('cx', gx.toFixed(1))
    orbRef.current?.setAttribute('r', (7 + p * 8).toFixed(1))
    haloRef.current?.setAttribute('cx', gx.toFixed(1))
    haloRef.current?.setAttribute('r', (15 + p * 16).toFixed(1))
    arcRefs.current.forEach((el, k) => {
      if (!el) return
      const pts = []
      for (let i = 0; i <= 6; i++) {
        const t = i / 6
        const x = HAND_TIP.x + (gx - HAND_TIP.x) * t
        const y = HAND_TIP.y + (ORB_Y - HAND_TIP.y) * t
        const j = i === 0 || i === 6 ? 0 : (Math.random() * 2 - 1) * (2.5 + k * 1.5)
        pts.push(`${x.toFixed(1)},${(y + j).toFixed(1)}`)
      }
      el.setAttribute('points', pts.join(' '))
    })
  }

  const progress = (kind, p) => {
    if (kind === 'charge') {
      setVar('--c', p.toFixed(4))
      sfx.humSet(p)
      const b = p >= 1 ? 3 : p >= 0.68 ? 2 : p >= 0.34 ? 1 : 0
      if (b !== barsRef.current) {
        barsRef.current = b
        setBars(b)
      }
      if (!nearlyRef.current && p >= 0.6) {
        nearlyRef.current = true
        setNearly(true)
      }
    } else {
      setVar('--h', p.toFixed(4))
      drawArcs(p)
    }
  }

  /* ---------------- act 1: the sun ---------------- */
  const charged = () => {
    setVar('--c', 1)
    barsRef.current = 3
    setBars(3)
    sfx.chime()
    setPhase('waking')
    later(() => play(headLookRef.current, LOOK, { duration: 1500, easing: 'ease-in-out' }), 1750, 300)
    later(() => {
      setBubble('Am-ru-tha!')
      sfx.chirp(NAME_CHIRP)
      play(upperInRef.current, HOP, { duration: 650, easing: 'ease-out' })
    }, 2600, 500)
    later(() => setBubble(null), 4500, 2400)
    later(() => setPhase('dig'), 4600, 2500)
  }

  /* ---------------- act 2: the heap ---------------- */
  const found = () => {
    setPhase('tada')
    sfx.pop()
    later(() => {
      setBubble('Ta-da!')
      sfx.chirp(TADA_CHIRP)
      play(upperInRef.current, HOP, { duration: 650, easing: 'ease-out' })
    }, 560, 200)
    later(() => setBubble(null), 2700, 2200)
    later(() => setPhase('reach'), 3000, 2400)
  }

  const dig = () => {
    if (phase !== 'dig' || digBusy.current) return
    sfx.unlock()
    digBusy.current = true
    const n = digsRef.current + 1
    digsRef.current = n
    const o = { duration: 780, easing: 'cubic-bezier(.4,0,.3,1)' }
    play(armRInRef.current, DIG_ARM, o)
    play(beamRRef.current, DIG_BEAM, o)
    play(handRRef.current, DIG_HAND, o)
    play(upperInRef.current, DIG_LEAN, o)
    later(() => {
      sfx.clank()
      spawnBits()
      play(pileRef.current, SHAKE, { duration: 340 })
      setDigs(n)
    }, 300, 0)
    later(() => {
      digBusy.current = false
      if (n >= 3) found()
    }, 820, 200)
  }

  /* ---------------- act 3: his hand ---------------- */
  const held = () => {
    setVar('--h', 1)
    sfx.bloom()
    flash()
    motes()
    setPhase('spark')
    later(() => play(upperInRef.current, WIGGLE, { duration: 900, easing: 'ease-in-out' }), 500, 0)
    later(() => setPhase('done'), 1500, 300)
  }

  /* ---------------- press and hold ---------------- */
  // A quick tap still nudges the charge along, so nobody who taps
  // instead of holding is ever stuck.
  const holdEnd = (completed = false) => {
    const h = hold.current
    if (!h.active) return
    h.active = false
    cancelAnimationFrame(h.raf)
    setHolding(false)
    if (h.kind === 'charge') sfx.humStop()
    else sfx.crackleStop()
    if (completed) {
      const kind = h.kind
      h.p = 0
      h.kind = null
      if (kind === 'charge') charged()
      else held()
    }
  }

  const holdStart = (kind) => {
    const h = hold.current
    if (h.active) return
    if (kind === 'charge' ? phase !== 'off' : phase !== 'reach') return
    sfx.unlock()
    if (h.kind !== kind) {
      h.kind = kind
      h.p = 0
    }
    h.active = true
    h.last = 0
    setHolding(true)
    if (kind === 'charge') {
      setStarted(true)
      sfx.humStart()
    } else {
      sfx.crackleStart()
      drawArcs(h.p, true)
    }
    h.p = Math.min(0.999, h.p + 0.03)
    progress(kind, h.p)
    const dur = kind === 'charge' ? CHARGE_MS : HAND_MS
    const step = (t) => {
      if (!h.active) return
      const dt = h.last ? Math.min(64, t - h.last) : 16
      h.last = t
      h.p = Math.min(1, h.p + dt / dur)
      progress(kind, h.p)
      if (h.p >= 1) {
        holdEnd(true)
        return
      }
      h.raf = requestAnimationFrame(step)
    }
    h.raf = requestAnimationFrame(step)
  }

  // Letting go of the window mid-hold should not leave him humming.
  const endRef = useRef(null)
  endRef.current = () => holdEnd(false)
  useEffect(() => {
    const stop = () => endRef.current?.()
    const vis = () => {
      if (document.visibilityState === 'hidden') stop()
    }
    window.addEventListener('blur', stop)
    document.addEventListener('visibilitychange', vis)
    return () => {
      window.removeEventListener('blur', stop)
      document.removeEventListener('visibilitychange', vis)
    }
  }, [])

  // Screen readers land on the message when it arrives.
  useEffect(() => {
    if (phase === 'done') finalRef.current?.focus({ preventScroll: true })
  }, [phase])

  const holdProps = (kind) => ({
    onPointerDown: (e) => {
      if (e.button > 0) return
      e.preventDefault()
      try {
        e.currentTarget.setPointerCapture(e.pointerId)
      } catch {}
      holdStart(kind)
    },
    onPointerUp: () => holdEnd(),
    onPointerCancel: () => holdEnd(),
    onLostPointerCapture: () => holdEnd(),
    onKeyDown: (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return
      e.preventDefault()
      if (!e.repeat) holdStart(kind)
    },
    onKeyUp: (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return
      e.preventDefault()
      holdEnd()
    },
    onBlur: () => holdEnd(),
  })

  const on = phase !== 'off'
  const mode = phase === 'off' || phase === 'waking' ? 'charge' : phase === 'dig' || phase === 'tada' ? 'dig' : 'hand'
  const busy = phase === 'waking' || phase === 'tada' || phase === 'spark'
  const reach = phase === 'reach' || phase === 'spark' || phase === 'done'
  const night = phase === 'spark' || phase === 'done'

  const cls = [
    'wl-scene',
    on ? 'wl-on' : 'wl-off',
    phase === 'off' && started && 'is-charging',
    phase === 'waking' && 'is-waking',
    phase === 'dig' && 'is-dig',
    phase === 'tada' && 'is-tada has-boot',
    reach && 'has-gboot is-reach',
    night && 'is-eve is-happy is-night',
    phase === 'done' && 'is-done',
    holding && 'is-holding',
  ]
    .filter(Boolean)
    .join(' ')

  const caption =
    phase === 'off'
      ? 'He’s been asleep all night. He runs on sunlight.'
      : phase === 'waking'
        ? 'Good morning, WALL·E.'
        : phase === 'dig'
          ? digs === 0
            ? 'He’s found something in that heap, and it’s for you. Help him dig it out.'
            : digs === 1
              ? 'Keep going.'
              : digs === 2
                ? 'One more.'
                : 'There it is…'
          : 'That’s his whole talk — one word and a plant in a boot. Yours is going to be even better.'

  const label =
    phase === 'off'
      ? started
        ? nearly
          ? 'Almost there…'
          : 'Keep holding'
        : 'Hold to charge him'
      : phase === 'waking'
        ? 'Fully charged'
        : phase === 'dig'
          ? 'Tap to help him dig'
          : phase === 'tada'
            ? 'Found it'
            : phase === 'reach'
              ? 'Hold his hand'
              : 'Holding on'

  const actProps = busy ? {} : mode === 'dig' ? { onClick: dig } : holdProps(mode)
  const noMenu = (e) => e.preventDefault()

  return (
    <div ref={rootRef} className={cls}>
      <div className="wl-sky wl-sky-dawn" aria-hidden="true" />
      <div className="wl-sky wl-sky-day" aria-hidden="true" />
      <div className="wl-sky wl-sky-night" aria-hidden="true" />
      <div className="wl-stars" aria-hidden="true">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="wl-star"
            style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay, animationDuration: s.dur, '--op': s.op }}
          />
        ))}
      </div>
      <div className="wl-sun" aria-hidden="true">
        <span className="wl-rays" />
      </div>
      <div className="wl-skyline" aria-hidden="true">
        <svg viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" focusable="false">
          <path className="wl-far" d={FAR} />
          <path className="wl-near" d={NEAR} />
        </svg>
        <div className="wl-haze" />
      </div>
      <div className="wl-ground" aria-hidden="true">
        <span className="wl-ground-day" />
        <span className="wl-ground-night" />
      </div>
      <div className="wl-dust" aria-hidden="true">
        {DUST.map((d, i) => (
          <span key={i} style={{ top: d.top, width: d.size, height: d.size, animationDelay: d.delay, animationDuration: d.dur }} />
        ))}
      </div>

      <div className="wl-actors">
        <div ref={botRef} className="wl-bot">
          <svg className="wl-svg" viewBox="0 0 260 300" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="wl-bodyg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#f3c455" />
                <stop offset=".55" stopColor="#e4a93c" />
                <stop offset="1" stopColor="#c98c27" />
              </linearGradient>
              <linearGradient id="wl-eyeg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#e7e3db" />
                <stop offset="1" stopColor="#b3ada2" />
              </linearGradient>
              <radialGradient id="wl-lens" cx=".4" cy=".35" r=".75">
                <stop offset="0" stopColor="#4d5870" />
                <stop offset=".45" stopColor="#1d222c" />
                <stop offset="1" stopColor="#0a0c10" />
              </radialGradient>
              <linearGradient id="wl-panelg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#3a5687" />
                <stop offset="1" stopColor="#1b2640" />
              </linearGradient>
              <linearGradient id="wl-moundg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#8a6446" />
                <stop offset="1" stopColor="#4d3523" />
              </linearGradient>
              <radialGradient id="wl-eveg" cx=".36" cy=".3" r=".8">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset=".6" stopColor="#eef2f7" />
                <stop offset="1" stopColor="#c3cdda" />
              </radialGradient>
              <radialGradient id="wl-orbg">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset=".35" stopColor="#c4ecff" />
                <stop offset="1" stopColor="#7fd4ff" stopOpacity="0" />
              </radialGradient>
              {/* User-space region: a bounding-box one would collapse on
                  the nearly-flat lightning lines and hide them. */}
              <filter id="wl-glow" filterUnits="userSpaceOnUse" x="-220" y="-60" width="700" height="420">
                <feGaussianBlur stdDeviation="2.2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <clipPath id="wl-treadclip">
                <path d={TREAD} />
              </clipPath>
              <clipPath id="wl-lensclip">
                <circle cx="101" cy="54" r="16.4" />
              </clipPath>
              <clipPath id="wl-panelclip">
                <rect x="72" y="88" width="116" height="34" rx="3" />
              </clipPath>
            </defs>

            <ellipse className="wl-shadow" cx="130" cy="297" rx="118" ry="7" />
            <Eve />

            <g className="wl-treads">
              <g className="wl-tread-l">
                <Tread />
              </g>
              <g className="wl-tread-r">
                <g transform={MIRROR}>
                  <Tread />
                </g>
              </g>
            </g>
            <rect x="68" y="252" width="124" height="34" rx="5" fill="#2f2c28" />

            <g className="wl-upper">
              <g ref={upperInRef} className="wl-upper-in">
                {/* Solar panel: lifts while he charges, folds away after. */}
                <g className="wl-panel">
                  <rect x="72" y="88" width="116" height="34" rx="3" fill="url(#wl-panelg)" stroke="#4b4f57" strokeWidth="2" />
                  <g stroke="#6b86b8" strokeOpacity=".6" strokeWidth="1.2">
                    <line x1="110.7" y1="89" x2="110.7" y2="121" />
                    <line x1="149.3" y1="89" x2="149.3" y2="121" />
                    <line x1="73" y1="105" x2="187" y2="105" />
                  </g>
                  <g clipPath="url(#wl-panelclip)">
                    <g transform="skewX(-20)">
                      <rect className="wl-panel-glint" x="0" y="80" width="18" height="50" fill="#fff" opacity=".35" />
                    </g>
                  </g>
                </g>

                {/* Neck and eyes sit behind the body, so folding him down
                    hides them inside it. */}
                <g className="wl-headpose">
                  <g ref={headLookRef} className="wl-headlook">
                    <g className="wl-headidle">
                      <rect x="125" y="74" width="10" height="56" rx="2" fill="#5f5a52" stroke="#3d3a35" strokeWidth="1.5" />
                      <circle cx="130" cy="101" r="7.5" fill="#75716a" stroke="#46423c" strokeWidth="2" />
                      <g transform="translate(130 101) scale(1.12) translate(-130 -101)">
                        <rect x="112" y="66" width="36" height="12" rx="4" fill="#706b63" stroke="#46423c" strokeWidth="2" />
                        <Eye />
                        <g transform={MIRROR}>
                          <Eye />
                        </g>
                      </g>
                    </g>
                  </g>
                </g>

                <g className="wl-body">
                  <rect x="56" y="124" width="148" height="140" rx="8" fill="url(#wl-bodyg)" stroke="#8e6119" strokeWidth="2.5" />
                  <rect x="57" y="128" width="10" height="134" rx="4" fill="#000" opacity=".08" />
                  <rect x="193" y="128" width="10" height="134" rx="4" fill="#000" opacity=".14" />
                  <ellipse cx="76" cy="252" rx="13" ry="5" fill="#8a4a1a" opacity=".3" />
                  <ellipse cx="192" cy="236" rx="6" ry="9" fill="#8a4a1a" opacity=".22" />
                  <path d="M174 164 q2 10 -1 18" fill="none" stroke="#8a4a1a" strokeOpacity=".28" strokeWidth="3" strokeLinecap="round" />
                  <rect x="108" y="172" width="84" height="80" rx="5" fill="#000" fillOpacity=".05" stroke="#9a6a1c" strokeWidth="2.4" />
                  <rect x="120" y="168" width="12" height="7" rx="2" fill="#9a6a1c" />
                  <rect x="168" y="168" width="12" height="7" rx="2" fill="#9a6a1c" />
                  <rect x="136" y="238" width="28" height="6" rx="3" fill="#8e6119" />
                  {[[114, 178], [186, 178], [114, 246], [186, 246]].map(([x, y]) => (
                    <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="#9a6a1c" />
                  ))}
                  <path d="M150 204 q6 -3 12 0" fill="none" stroke="#b07a22" strokeOpacity=".5" strokeWidth="1.6" strokeLinecap="round" />
                  <g stroke="#96661c" strokeWidth="3" strokeLinecap="round">
                    <line x1="160" y1="146" x2="190" y2="146" />
                    <line x1="160" y1="153" x2="190" y2="153" />
                    <line x1="160" y1="160" x2="190" y2="160" />
                  </g>
                  {/* The charge gauge: a sun, and three bars that fill. */}
                  <rect x="68" y="140" width="28" height="66" rx="4" fill="#2a251b" stroke="#17140e" strokeWidth="2" />
                  <g className={`wl-sunicon${started ? ' is-lit' : ''}`}>
                    <circle cx="82" cy="152" r="4.2" />
                    {RAYS.map((r, i) => (
                      <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
                    ))}
                  </g>
                  {[0, 1, 2].map((i) => (
                    <rect key={i} className={`wl-bar${bars > i ? ' is-lit' : ''}`} x="73" y={190 - i * 13} width="18" height="9" rx="1.6" />
                  ))}
                  <circle cx="82" cy="224" r="5" fill="#c8432f" stroke="#7d2417" strokeWidth="1.5" />
                  <circle cx="80.5" cy="222.5" r="1.6" fill="#ffb3a3" />
                  <rect x="52" y="118" width="156" height="12" rx="4" fill="#c98f2a" stroke="#8e6119" strokeWidth="2" />
                </g>

                <g className="wl-arm wl-arm-l">
                  <g className="wl-beam wl-beam-l">
                    <BeamL />
                  </g>
                  <g className="wl-hand wl-hand-l">
                    <HandL />
                  </g>
                  <circle cx="58" cy="196" r="7.5" fill="#6e6a61" stroke="#46423c" strokeWidth="2" />
                </g>

                <g className="wl-arm wl-arm-r">
                  <g ref={armRInRef} className="wl-arm-in-r">
                    <g ref={beamRRef} className="wl-beam wl-beam-r">
                      <g transform={MIRROR}>
                        <BeamL />
                      </g>
                    </g>
                    <g ref={handRRef} className="wl-hand wl-hand-r">
                      <g className="wl-held">
                        <g transform="translate(238 252)">
                          <Boot />
                        </g>
                      </g>
                      <g transform={MIRROR}>
                        <HandL />
                      </g>
                    </g>
                    <circle cx="202" cy="196" r="7.5" fill="#6e6a61" stroke="#46423c" strokeWidth="2" />
                  </g>
                </g>
              </g>
            </g>

            {/* Set down in front of him once he has shown it off. */}
            <g transform="translate(160 296)">
              <g className="wl-gboot">
                <Boot />
              </g>
            </g>

            <g ref={pileRef} className={`wl-pile${digs >= 1 ? ' d1' : ''}${digs >= 2 ? ' d2' : ''}${digs >= 3 ? ' d3' : ''}`}>
              <PileArt />
            </g>

            <g className="wl-fx">
              <circle ref={haloRef} className="wl-halo" cx={ORB_FROM} cy={ORB_Y} r="15" fill="url(#wl-orbg)" />
              <circle ref={orbRef} className="wl-orb" cx={ORB_FROM} cy={ORB_Y} r="7" fill="url(#wl-orbg)" />
              <g className="wl-arcs" filter="url(#wl-glow)" fill="none" stroke="#e2f6ff" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
                {[0, 1, 2].map((i) => (
                  <polyline
                    key={i}
                    ref={(el) => {
                      arcRefs.current[i] = el
                    }}
                    points={`${HAND_TIP.x},${HAND_TIP.y} ${HAND_TIP.x},${HAND_TIP.y}`}
                  />
                ))}
              </g>
            </g>
          </svg>

          {bubble && (
            <div key={bubble} className="wl-bubble" aria-hidden="true">
              {bubble}
            </div>
          )}
          {phase === 'dig' && <button type="button" className="wl-spot wl-pilespot" onClick={dig} aria-label="Dig in the heap" />}
          {phase === 'reach' && (
            <button type="button" className="wl-spot wl-handspot" aria-label="Hold his hand" onContextMenu={noMenu} {...holdProps('hand')} />
          )}
          <div ref={fxRef} className="wl-fxhost" aria-hidden="true" />
        </div>
      </div>

      <header className="wl-copy">
        {phase === 'done' ? (
          <div className="wl-final">
            <p className="wl-f-eyebrow wl-in" style={{ animationDelay: '0.1s' }}>
              <span aria-hidden="true">✓ </span>Message delivered
            </p>
            <h1 ref={finalRef} tabIndex={-1} className="wl-f-title">
              The stage is yours, Amrutha.
            </h1>
            <p className="wl-f-line wl-in" style={{ animationDelay: '1s' }}>
              All the best for your talk at the Tech Summit.
            </p>
            <p className="wl-f-line wl-f-soft wl-in" style={{ animationDelay: '1.7s' }}>
              If the room feels big, pretend your “Gadidha” is sitting in the front row. Be you and win BIG!
            </p>
            <p className="wl-f-te wl-in" style={{ animationDelay: '2.5s' }}>
              Adaragottey!
            </p>
          </div>
        ) : (
          <div className={`wl-acts${phase === 'spark' ? ' is-leaving' : ''}`}>
            <p className="wl-eyebrow">For Amrutha</p>
            <h1 className="wl-title">Someone small has a message for you.</h1>
            <p key={caption} className="wl-caption">
              {caption}
            </p>
          </div>
        )}
        <p className="wl-sr" aria-live="polite">
          {phase === 'done' ? '' : caption}
          {bubble ? ` He says: ${bubble}` : ''}
        </p>
      </header>

      <div className="wl-dock">
        {phase === 'done' ? (
          <div className="wl-dock-in wl-in" style={{ animationDelay: '3.1s' }}>
            <p className="wl-foot">Tech Summit · AWS · fully charged, and rooting for you</p>
            <button type="button" className="wl-replay" onClick={onReplay}>
              Watch it again
            </button>
          </div>
        ) : (
          <div className={`wl-dock-in${phase === 'spark' ? ' is-leaving' : ''}`}>
            <button
              type="button"
              className={`wl-act wl-act-${mode}`}
              aria-disabled={busy || undefined}
              aria-label={label}
              onContextMenu={noMenu}
              {...actProps}
            >
              <svg className="wl-ring" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
                <circle className="wl-ring-bg" cx="60" cy="60" r="56" />
                <circle className="wl-ring-fg" cx="60" cy="60" r="56" pathLength="100" />
              </svg>
              <span className="wl-act-disc">{mode === 'charge' ? <SunIcon /> : mode === 'dig' ? <DigIcon /> : <HandIcon />}</span>
            </button>
            <p className="wl-act-label" aria-hidden="true">
              {label}
            </p>
            {mode === 'dig' && (
              <div className="wl-dots" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <i key={i} className={digs > i ? 'on' : ''} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div ref={flashRef} className="wl-flash" aria-hidden="true" />
    </div>
  )
}

export default function WallE({ onBack }) {
  const [run, setRun] = useState(0)
  const [muted, setMuted] = useState(false)
  const sfx = useMemo(() => createSfx(), [])
  const reduced = useMemo(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  )

  // The site radio would talk over him. Hold it while we're here and
  // hand it back on the way out, like #/her does.
  const setSuppressed = useAmbient()?.setSuppressed
  useEffect(() => {
    setSuppressed?.(true)
    return () => setSuppressed?.(false)
  }, [setSuppressed])

  useEffect(() => () => sfx.close(), [sfx])
  useEffect(() => {
    sfx.setMuted(muted)
  }, [sfx, muted])

  const replay = useCallback(() => setRun((r) => r + 1), [])

  return (
    <div className="wl-root">
      <style>{WL_STYLE}</style>
      <Scene key={run} sfx={sfx} reduced={reduced} onReplay={replay} />
      <button type="button" onClick={onBack} className="wl-chip wl-back" title="Back">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="wl-chip-t">Back</span>
      </button>
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        className="wl-chip wl-sound"
        aria-pressed={!muted}
        aria-label="Sound"
        title={muted ? 'Sound off' : 'Sound on'}
      >
        <SoundIcon off={muted} />
        <span className="wl-chip-t">{muted ? 'Sound off' : 'Sound on'}</span>
      </button>
    </div>
  )
}

const WL_STYLE = `
  .wl-root {
    position: fixed; inset: 0; z-index: 300;
    overflow-x: hidden; overflow-y: auto; overscroll-behavior: contain;
    background: #1d1626; color: #fff2de;
    -webkit-tap-highlight-color: transparent;
  }
  .wl-scene {
    --c: 0; --h: 0;
    --ground: clamp(150px, 27vh, 250px);
    --rw: clamp(150px, min(44vw, 30vh), 270px);
    position: relative; width: 100%;
    height: 100vh; height: 100dvh; min-height: 560px;
    overflow: hidden;
    font-family: 'Sora', system-ui, sans-serif;
    -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
  }

  /* ---------- sky: pre-dawn, then his smoggy amber day, then night ---------- */
  .wl-sky { position: absolute; inset: 0; pointer-events: none; }
  .wl-sky-dawn { background: linear-gradient(180deg, #211a30 0%, #3a2840 30%, #67404a 58%, #9e5e4d 80%, #bf7c52 100%); }
  .wl-sky-day {
    opacity: var(--c);
    background:
      radial-gradient(60% 40% at 68% 82%, rgba(255,214,140,.55) 0%, rgba(255,190,110,0) 70%),
      linear-gradient(180deg, #48291f 0%, #74412a 26%, #ad6636 52%, #d8914f 76%, #ecb067 100%);
  }
  .wl-sky-night {
    opacity: 0; transition: opacity 1.8s ease;
    background:
      radial-gradient(80% 40% at 50% 100%, rgba(120,90,170,.35) 0%, transparent 70%),
      linear-gradient(180deg, #04060f 0%, #0a1027 38%, #141a3d 66%, #2a2550 100%);
  }
  .is-night .wl-sky-night { opacity: 1; }

  .wl-stars { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity 2.4s ease .5s; }
  .is-night .wl-stars { opacity: 1; }
  .wl-star { position: absolute; border-radius: 50%; background: #e8efff; opacity: var(--op); animation: wlTwinkle 4s ease-in-out infinite; }

  .wl-sun {
    position: absolute; left: 74%; bottom: calc(var(--ground) + 9vh);
    width: min(30vmin, 240px); aspect-ratio: 1; border-radius: 50%; pointer-events: none;
    transform: translate(-50%, calc((1 - var(--c)) * 26vh));
    opacity: calc(.4 + var(--c) * .6);
    background: radial-gradient(circle, #fffaf0 0 15%, #ffe6b0 23%, rgba(255,205,130,.6) 37%, rgba(255,170,90,.18) 55%, rgba(255,160,80,0) 70%);
  }
  .wl-rays {
    position: absolute; inset: -70%; border-radius: 50%;
    background: repeating-conic-gradient(from 0deg, rgba(255,226,170,.16) 0deg 5deg, transparent 5deg 16deg);
    -webkit-mask-image: radial-gradient(circle, #000 18%, transparent 66%);
    mask-image: radial-gradient(circle, #000 18%, transparent 66%);
    opacity: calc(var(--c) * .85);
    animation: wlSpin 80s linear infinite;
  }
  .is-night .wl-sun { opacity: 0; transform: translate(-50%, 26vh); transition: opacity 1.4s ease, transform 1.8s ease; }

  .wl-skyline { position: absolute; left: 0; right: 0; bottom: calc(var(--ground) - 1px); height: 44vh; pointer-events: none; }
  .wl-skyline svg { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  /* The towers warm with the sky. color-mix follows --c every frame; the
     plain fill before it is the fallback where color-mix is missing. */
  .wl-far { fill: #4a2f42; fill: color-mix(in srgb, #b4805e calc(var(--c) * 100%), #4a2f42); opacity: .92; }
  .wl-near { fill: #2e1e2b; fill: color-mix(in srgb, #744832 calc(var(--c) * 100%), #2e1e2b); }
  .is-night .wl-far { fill: #161c40; transition: fill 1.8s ease; }
  .is-night .wl-near { fill: #0b1029; transition: fill 1.8s ease; }
  .wl-haze { position: absolute; left: 0; right: 0; bottom: 0; height: 45%; background: linear-gradient(to top, rgba(236,170,100,.5), rgba(236,170,100,0)); opacity: var(--c); }
  .is-night .wl-haze { opacity: 0; transition: opacity 1.2s ease; }

  .wl-ground {
    position: absolute; left: 0; right: 0; bottom: 0; height: var(--ground); pointer-events: none;
    background: linear-gradient(180deg, #4a2f37 0%, #34212a 45%, #241820 100%);
  }
  .wl-ground > span { position: absolute; inset: 0; }
  .wl-ground-day {
    opacity: var(--c);
    background:
      radial-gradient(60% 30% at 50% 0%, rgba(255,220,160,.25), transparent 70%),
      linear-gradient(180deg, #9a6638 0%, #7c4d2b 32%, #5a361f 100%);
  }
  .wl-ground-night {
    opacity: 0; transition: opacity 1.8s ease;
    background:
      radial-gradient(50% 30% at 42% 0%, rgba(140,200,255,.12), transparent 70%),
      linear-gradient(180deg, #1c1934 0%, #12101f 50%, #0b0a14 100%);
  }
  .is-night .wl-ground-night { opacity: 1; }
  .wl-ground::after {
    content: ''; position: absolute; inset: 0;
    background:
      radial-gradient(28% 18% at 18% 38%, rgba(0,0,0,.14), transparent 70%),
      radial-gradient(22% 16% at 84% 62%, rgba(0,0,0,.12), transparent 70%),
      radial-gradient(30% 14% at 60% 86%, rgba(0,0,0,.1), transparent 70%);
  }
  .wl-ground::before {
    content: ''; position: absolute; left: 0; right: 0; top: 0; height: 2px; z-index: 1;
    background: linear-gradient(90deg, transparent, rgba(255,226,180,.35), transparent);
    opacity: calc(.3 + var(--c) * .7);
  }
  .is-night .wl-ground::before { opacity: .25; }

  .wl-dust { position: absolute; inset: 0; pointer-events: none; overflow: hidden; transition: opacity 1s ease; }
  .is-night .wl-dust { opacity: 0; }
  .wl-dust span { position: absolute; left: -4vw; border-radius: 50%; background: #f6d7a8; opacity: 0; animation: wlDrift 20s linear infinite; }

  /* ---------- the actors ---------- */
  .wl-actors {
    position: absolute; left: 50%; bottom: calc(var(--ground) - 16px); width: var(--rw); z-index: 3;
    transform: translateX(-50%);
    transition: transform 1.3s cubic-bezier(.45,.05,.3,1);
  }
  /* Make room on his left for her. */
  .is-reach .wl-actors { transform: translateX(calc(-50% + var(--rw) * .17)); }
  .wl-bot { position: relative; width: 100%; aspect-ratio: 260 / 300; }
  .is-charging .wl-bot { filter: drop-shadow(0 0 calc(var(--c) * 16px) rgba(255,196,92,.5)); }
  .wl-svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }

  /* Every origin below is in the robot's drawing units. */
  .wl-svg g, .wl-svg rect, .wl-svg path, .wl-svg ellipse { transform-box: view-box; }

  .wl-shadow { fill: #1a0f08; opacity: .3; transform-origin: 130px 297px; transition: transform .6s ease; }
  .wl-off .wl-shadow { transform: scaleX(.74); }

  .wl-treads { transform-origin: 130px 296px; transition: transform .55s cubic-bezier(.3,1.25,.5,1); }
  .wl-off .wl-treads { transform: scaleY(.56); }
  .wl-tread-l, .wl-tread-r { transition: transform .55s cubic-bezier(.3,1.25,.5,1); }
  .wl-off .wl-tread-l { transform: translateX(20px); }
  .wl-off .wl-tread-r { transform: translateX(-20px); }

  .wl-upper { transition: transform .62s cubic-bezier(.3,1.35,.5,1); }
  .is-waking .wl-upper { transition-delay: .12s; }
  .wl-off .wl-upper { transform: translateY(32px); }
  .wl-upper-in { transform-origin: 130px 296px; }

  .wl-panel { transform-origin: 130px 122px; transform: scaleY(0); transition: transform .3s ease; }
  .is-charging .wl-panel { transform: scaleY(1); transition: transform .45s cubic-bezier(.3,1.4,.5,1); }
  .wl-panel-glint { animation: wlGlintX 2.4s ease-in-out infinite; }

  .wl-headpose { transition: transform .7s cubic-bezier(.3,1.45,.5,1); }
  .is-waking .wl-headpose { transition-delay: .78s; }
  .wl-off .wl-headpose { transform: translateY(108px); }
  .wl-headlook, .wl-headidle { transform-origin: 130px 112px; }
  .wl-on .wl-headidle { animation: wlIdle 7s ease-in-out 4s infinite; }

  .wl-lid { transform-origin: 101px 36px; transform: scaleY(1); }
  .wl-on .wl-lid { animation: wlOpen .32s ease-out 1.45s both, wlBlink 5.4s ease-in-out 3.4s infinite; }
  .wl-lidb { transition: transform .5s ease; }
  .is-happy .wl-lidb { transform: translateY(-12px); }

  .wl-sunicon { fill: #5b4e24; stroke: #5b4e24; stroke-width: 1.6; stroke-linecap: round; transition: fill .3s, stroke .3s; }
  .wl-sunicon.is-lit { fill: #ffd54a; stroke: #ffd54a; }
  .wl-bar { fill: #463c20; transition: fill .2s; }
  .wl-bar.is-lit { fill: #ffd84d; filter: url(#wl-glow); }

  .wl-arm { transition: transform .55s cubic-bezier(.3,1.3,.5,1), opacity .35s ease; }
  .is-waking .wl-arm { transition-delay: .5s; }
  .wl-arm-l { transform-origin: 58px 196px; }
  .wl-arm-r, .wl-arm-in-r { transform-origin: 202px 196px; }
  .wl-off .wl-arm-l { transform: translateX(26px) scale(.8); opacity: 0; }
  .wl-off .wl-arm-r { transform: translateX(-26px) scale(.8); opacity: 0; }
  .is-tada .wl-arm-l { transform: translate(0, -44px) rotate(58deg); }
  .is-tada .wl-arm-r { transform: translate(0, -44px) rotate(-58deg); }
  .is-reach .wl-arm-l { transform: rotate(10deg); transition-duration: .8s; }
  .wl-beam-l { transform-origin: 60px 196px; transition: transform .8s cubic-bezier(.3,1.2,.5,1); }
  .wl-beam-r { transform-origin: 200px 196px; }
  .is-reach .wl-beam-l { transform: scaleX(1.87); }
  .wl-hand-l { transition: transform .8s cubic-bezier(.3,1.2,.5,1); }
  .is-reach .wl-hand-l { transform: translateX(-26px); }

  /* The boot in his hand pops in, then counter-rotates as the arm goes
     up so it stays upright. It vanishes the instant it is set down. */
  .wl-held { transform-origin: 237px 206px; opacity: 0; transform: scale(.3); }
  .has-boot .wl-held { opacity: 1; transform: none; transition: opacity .2s ease, transform .4s cubic-bezier(.3,1.5,.5,1); }
  .is-tada .wl-held { transform: rotate(58deg); transition: opacity .2s ease, transform .55s cubic-bezier(.3,1.3,.5,1); }

  .wl-leaf { transform: scale(0); transition: transform .5s cubic-bezier(.3,1.6,.5,1); }
  .wl-leaf-1 { transform-origin: -2px -74px; }
  .wl-leaf-2 { transform-origin: -2px -76px; }
  .wl-leaf-3 { transform-origin: -2px -63px; }
  .is-tada .wl-held .wl-leaf-1 { transform: none; transition-delay: .7s; }
  .is-tada .wl-held .wl-leaf-2 { transform: none; transition-delay: .9s; }
  .wl-gboot .wl-leaf-1, .wl-gboot .wl-leaf-2 { transform: none; }
  .is-done .wl-gboot .wl-leaf-3 { transform: none; transition-delay: 1.6s; }

  /* Starts exactly where the raised boot is, then travels to the ground. */
  .wl-gboot { opacity: 0; transform: translate(70px, -122px); }
  .has-gboot .wl-gboot { opacity: 1; transform: none; transition: transform .75s cubic-bezier(.45,.05,.35,1), opacity .12s ease; }

  .wl-eve { opacity: 0; transform-origin: -14px 194px; transform: scale(.35); }
  .is-eve .wl-eve { opacity: 1; transform: none; transition: opacity .9s ease .1s, transform 1.1s cubic-bezier(.2,.9,.3,1.12) .1s; }
  .wl-eve-head { transform-origin: -80px 142px; }
  .is-eve .wl-eve-head { animation: wlFloat 3.6s ease-in-out 1.6s infinite; }
  .wl-eve-hover { opacity: .35; transform-origin: -80px 291px; animation: wlHover 3.6s ease-in-out infinite; }

  .wl-mound { transform-origin: 300px 296px; transition: transform .45s cubic-bezier(.3,1.3,.5,1); }
  .wl-pile.d1 .wl-mound { transform: scaleY(.93); }
  .wl-pile.d2 .wl-mound { transform: scaleY(.86); }
  .wl-pile.d3 .wl-mound { transform: scaleY(.8); }
  .wl-pi { transition: opacity .25s ease, transform .45s ease; }
  .wl-pile.d1 .wl-pi-a, .wl-pile.d1 .wl-pi-b, .wl-pile.d2 .wl-pi-c, .wl-pile.d2 .wl-pi-d, .wl-pile.d3 .wl-pi-e { opacity: 0; }
  .wl-pile.d1 .wl-pi-e { transform: translateY(6px); }
  .wl-pile.d2 .wl-pi-e { transform: translateY(12px); }
  .wl-glint { transform-origin: 302px 194px; animation: wlGlint 2.2s ease-in-out infinite; }
  .is-night .wl-pile { opacity: .75; transition: opacity 1.6s ease; }

  .wl-fx { opacity: 0; transition: opacity .5s ease; }
  .is-reach .wl-fx { opacity: 1; }
  .is-eve .wl-fx { opacity: 0; transition: opacity .7s ease .3s; }
  .wl-halo { opacity: .45; }
  .wl-svg .wl-orb { transform-box: fill-box; transform-origin: center; }
  .is-reach:not(.is-holding):not(.is-eve) .wl-orb { animation: wlPulse 1.6s ease-in-out infinite; }
  .wl-arcs { opacity: 0; transition: opacity .15s; }
  .is-holding .wl-arcs { opacity: 1; }

  /* ---------- overlays on the robot ---------- */
  .wl-bubble {
    position: absolute; left: 58%; bottom: 93%; z-index: 4;
    padding: 9px 15px 10px; border-radius: 18px;
    background: #fff6e6; color: #2b1a0d;
    font: 700 clamp(15px, 1.2vw + 9px, 19px)/1 'Sora', system-ui, sans-serif; letter-spacing: .02em;
    white-space: nowrap; box-shadow: 0 10px 28px rgba(30,12,4,.3);
    transform-origin: 12% 100%;
    animation: wlPop .45s cubic-bezier(.3,1.6,.5,1) both;
  }
  .wl-bubble::after {
    content: ''; position: absolute; left: 16px; bottom: -6px; width: 13px; height: 13px;
    background: #fff6e6; transform: rotate(45deg); border-radius: 2px;
  }
  .wl-spot {
    position: absolute; z-index: 3; border: 0; padding: 0; margin: 0;
    background: transparent; cursor: pointer; border-radius: 16px;
    touch-action: none; -webkit-user-select: none; user-select: none;
  }
  .wl-spot:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(255,236,200,.85); }
  .wl-pilespot { left: 88%; top: 64%; width: 55%; height: 36%; }
  .wl-handspot { left: -11.5%; top: 64.7%; width: 72px; height: 72px; transform: translate(-50%, -50%); border-radius: 50%; }
  .wl-handspot::before {
    content: ''; position: absolute; inset: 12px; border-radius: 50%;
    border: 2px solid rgba(143,220,255,.75);
    animation: wlRing 1.8s ease-out infinite;
  }
  .is-holding .wl-handspot::before { animation: none; opacity: 0; }
  .wl-fxhost { position: absolute; inset: 0; pointer-events: none; z-index: 4; overflow: visible; }
  .wl-bit { position: absolute; will-change: transform, opacity; animation: wlBit .9s cubic-bezier(.2,.7,.3,1) forwards; }
  .wl-mote {
    position: absolute; width: 4px; height: 4px; border-radius: 50%;
    background: #e6f7ff; box-shadow: 0 0 8px #8fd8ff, 0 0 2px #fff;
    opacity: 0; will-change: transform, opacity;
    animation: wlMote 2.6s ease-out forwards;
  }
  .wl-flash {
    position: absolute; inset: 0; z-index: 7; pointer-events: none; opacity: 0;
    background: radial-gradient(circle at var(--fx, 50%) var(--fy, 62%), rgba(235,248,255,.95) 0%, rgba(160,220,255,.45) 14%, rgba(120,190,255,0) 42%);
  }
  .wl-flash.is-on { animation: wlFlash 1.2s ease-out forwards; }

  /* ---------- words ---------- */
  .wl-copy { position: absolute; left: 0; right: 0; top: clamp(64px, 9vh, 92px); padding: 0 22px; text-align: center; z-index: 5; pointer-events: none; }
  .wl-acts.is-leaving, .wl-dock-in.is-leaving { animation: wlLeave .5s ease forwards; }
  .wl-eyebrow {
    margin: 0 0 12px;
    font: 500 11px/1.4 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .32em; text-transform: uppercase;
    color: #f2cf9c;
  }
  .wl-title {
    margin: 0 auto; max-width: 17ch;
    font-family: 'Newsreader', Georgia, serif; font-weight: 500;
    font-size: clamp(1.55rem, 5.4vw, 2.75rem); line-height: 1.12;
    color: #fff3e2; text-wrap: balance; text-shadow: 0 2px 22px rgba(20,8,4,.35);
  }
  .wl-caption {
    margin: 14px auto 0; max-width: 29rem;
    font-size: clamp(.95rem, 2.4vw, 1.1rem); line-height: 1.55;
    color: #f7e3c6; text-wrap: pretty; text-shadow: 0 1px 14px rgba(30,12,6,.5);
    animation: wlUp .6s cubic-bezier(.22,.61,.36,1) both;
  }
  .wl-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

  .wl-final { max-width: 46rem; margin: 0 auto; }
  .wl-in { opacity: 0; animation: wlUp .9s cubic-bezier(.22,.61,.36,1) forwards; }
  .wl-f-eyebrow {
    margin: 0 0 14px;
    font: 500 11px/1.4 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .3em; text-transform: uppercase;
    color: #93dcff;
  }
  .wl-f-title {
    margin: 0 auto 14px; max-width: 30ch; outline: none;
    font-family: 'Newsreader', Georgia, serif; font-weight: 500;
    font-size: clamp(1.9rem, 6.6vw, 3.3rem); line-height: 1.08; text-wrap: balance;
    background: linear-gradient(100deg, #fff7e8 0%, #ffe2a6 30%, #ffffff 52%, #cfeeff 76%, #fff7e8 100%);
    background-size: 220% auto;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    opacity: 0;
    animation: wlUp .9s cubic-bezier(.22,.61,.36,1) .35s forwards, wlShine 6s linear 1.6s infinite;
  }
  .wl-f-line { margin: 0 auto; max-width: 38rem; font-size: clamp(1rem, 2.6vw, 1.18rem); line-height: 1.55; color: #eef2ff; text-wrap: pretty; }
  .wl-f-soft { margin-top: 6px; color: #c9d4f0; }
  .wl-f-te {
    margin: 14px 0 0;
    font-family: 'Newsreader', Georgia, serif; font-style: italic;
    font-size: clamp(1.45rem, 4.4vw, 2.05rem); line-height: 1.2;
    color: #ffd36b; text-shadow: 0 0 24px rgba(255,200,90,.35);
  }

  /* ---------- the one button ---------- */
  .wl-dock {
    position: absolute; left: 0; right: 0; bottom: 0; height: var(--ground); z-index: 6;
    display: flex; align-items: center; justify-content: center;
    padding: 26px 16px 18px;
  }
  .wl-dock-in { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .wl-act {
    position: relative; width: 84px; height: 84px; border-radius: 50%;
    border: 0; padding: 0; margin: 0; background: transparent; cursor: pointer;
    touch-action: none; -webkit-user-select: none; user-select: none; outline: none;
    transition: transform .2s ease, opacity .3s ease;
  }
  .wl-act:focus-visible { box-shadow: 0 0 0 3px rgba(255,236,200,.85); }
  .wl-act[aria-disabled="true"] { cursor: default; opacity: .72; }
  .is-holding .wl-act { transform: scale(.95); }
  .wl-ring { position: absolute; inset: -8px; width: calc(100% + 16px); height: calc(100% + 16px); transform: rotate(-90deg); overflow: visible; }
  .wl-ring-bg { fill: none; stroke: rgba(255,240,215,.18); stroke-width: 5; }
  .wl-ring-fg {
    fill: none; stroke: #ffd36b; stroke-width: 5; stroke-linecap: round;
    stroke-dasharray: 100; stroke-dashoffset: calc(100 - var(--p, 0) * 100);
  }
  .wl-act-charge { --p: var(--c); }
  .wl-act-hand { --p: var(--h); }
  .wl-act-hand .wl-ring-fg { stroke: #8fdcff; }
  .wl-act-dig .wl-ring { display: none; }
  .wl-act-disc {
    position: absolute; inset: 4px; border-radius: 50%;
    display: grid; place-items: center; color: #4a2a0c;
    background: radial-gradient(circle at 35% 30%, #fff1c4, #ffd36b 45%, #f29a32 100%);
    box-shadow: 0 8px 26px rgba(255,170,70,.35), inset 0 -6px 14px rgba(160,70,10,.35), inset 0 3px 8px rgba(255,255,255,.55);
  }
  .wl-act:not([aria-disabled="true"]) .wl-act-disc { animation: wlBreathe 2.6s ease-in-out infinite; }
  .is-holding .wl-act .wl-act-disc { animation: none; }
  .wl-act-dig .wl-act-disc {
    color: #3b230f;
    background: radial-gradient(circle at 35% 30%, #fbe7c8, #e0b47a 50%, #b07a44 100%);
    box-shadow: 0 8px 24px rgba(120,70,30,.35), inset 0 -6px 14px rgba(90,50,20,.35), inset 0 3px 8px rgba(255,255,255,.5);
  }
  .wl-act-hand .wl-act-disc {
    color: #0b2a3d;
    background: radial-gradient(circle at 35% 30%, #ffffff, #c8eeff 45%, #7fd0ff 100%);
    box-shadow: 0 8px 26px rgba(110,200,255,.35), inset 0 -6px 14px rgba(40,120,180,.3), inset 0 3px 8px rgba(255,255,255,.6);
  }
  .wl-act-disc svg { width: 38px; height: 38px; }
  .wl-act-label { margin: 6px 0 0; font: 600 14px/1.3 'Sora', system-ui, sans-serif; color: #fff0d8; letter-spacing: .01em; }
  .wl-dots { display: flex; gap: 8px; }
  .wl-dots i { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,240,215,.25); transition: background .25s; }
  .wl-dots i.on { background: #ffd36b; }

  .wl-foot {
    margin: 0 0 6px; text-align: center;
    font: 500 10px/1.6 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .24em; text-transform: uppercase;
    color: #a9b4d6;
  }
  .wl-replay {
    min-height: 44px; padding: 0 22px; border-radius: 999px; cursor: pointer;
    font: 600 14px/1 'Sora', system-ui, sans-serif; color: #e8eeff;
    background: rgba(255,255,255,.06); border: 1px solid rgba(200,215,255,.28);
    transition: background .2s ease, transform .2s ease;
  }
  .wl-replay:hover { background: rgba(255,255,255,.12); transform: translateY(-1px); }
  .wl-replay:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(200,225,255,.7); }

  /* ---------- corner chips ---------- */
  .wl-chip {
    position: fixed; top: 16px; z-index: 20;
    display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 14px;
    border-radius: 999px; cursor: pointer;
    font: 500 14px/1 'Sora', system-ui, sans-serif; color: #fbe9cf;
    background: rgba(20,12,10,.35); border: 1px solid rgba(255,226,180,.22);
    -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
    transition: transform .2s ease;
  }
  .wl-chip::after { content: ''; position: absolute; inset: -4px; }
  .wl-chip:hover { transform: scale(1.04); }
  .wl-chip:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(255,236,200,.7); }
  .wl-back { left: 16px; }
  .wl-sound { right: 16px; padding: 0 12px; }
  @media (max-width: 639px) { .wl-chip-t { display: none; } .wl-chip { width: 40px; padding: 0; justify-content: center; } }

  /* Short screens: tighten the message and stand the two of them a
     little smaller, so the last line never lands on his head. */
  @media (max-height: 820px) {
    .wl-copy { top: 60px; }
    .wl-f-eyebrow { margin-bottom: 10px; }
    .wl-f-title { font-size: clamp(1.7rem, 6vw, 2.6rem); margin-bottom: 10px; }
    .wl-f-line { font-size: clamp(.95rem, 2.4vw, 1.08rem); line-height: 1.5; }
    .wl-f-te { margin-top: 10px; font-size: clamp(1.3rem, 4vw, 1.8rem); }
    .wl-bot { transition: transform 1.3s cubic-bezier(.45,.05,.3,1); transform-origin: 50% 100%; }
    .is-done .wl-bot { transform: scale(.88); }
  }

  /* ---------- motion ---------- */
  @keyframes wlTwinkle { 0%, 100% { opacity: calc(var(--op) * .3); } 50% { opacity: var(--op); } }
  @keyframes wlSpin { to { transform: rotate(360deg); } }
  @keyframes wlDrift {
    0% { transform: translate(0, 0); opacity: 0; } 10% { opacity: .55; }
    50% { transform: translate(55vw, -2vh); } 90% { opacity: .4; }
    100% { transform: translate(110vw, 1vh); opacity: 0; }
  }
  @keyframes wlGlintX { 0% { transform: translateX(10px); opacity: 0; } 20% { opacity: 1; } 60%, 100% { transform: translateX(230px); opacity: 0; } }
  @keyframes wlIdle { 0%, 70%, 100% { transform: rotate(0deg); } 78% { transform: rotate(-4deg); } 88% { transform: rotate(3deg); } }
  @keyframes wlOpen { from { transform: scaleY(1); } to { transform: scaleY(0); } }
  @keyframes wlBlink { 0%, 90%, 97%, 100% { transform: scaleY(0); } 93.5% { transform: scaleY(1); } }
  @keyframes wlFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
  @keyframes wlHover { 0%, 100% { transform: scaleX(1); opacity: .35; } 50% { transform: scaleX(.85); opacity: .22; } }
  @keyframes wlGlint { 0%, 100% { transform: scale(.45) rotate(0deg); opacity: .35; } 50% { transform: scale(1.1) rotate(45deg); opacity: 1; } }
  @keyframes wlPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.25); } }
  @keyframes wlPop { from { opacity: 0; transform: scale(.4); } to { opacity: 1; transform: none; } }
  @keyframes wlUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  @keyframes wlLeave { to { opacity: 0; transform: translateY(-8px); } }
  @keyframes wlShine { to { background-position: 220% center; } }
  @keyframes wlBreathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  @keyframes wlRing { 0% { transform: scale(.7); opacity: .9; } 100% { transform: scale(1.5); opacity: 0; } }
  @keyframes wlBit {
    0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
    45% { transform: translate(calc(var(--dx) * .6), var(--dy)) rotate(calc(var(--rot) * .5)); opacity: 1; }
    100% { transform: translate(var(--dx), calc(var(--dy) * -0.4)) rotate(var(--rot)); opacity: 0; }
  }
  @keyframes wlMote {
    0% { opacity: 0; transform: translate(0, 0) scale(.6); } 15% { opacity: 1; }
    100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1); }
  }
  @keyframes wlFlash { 0% { opacity: 0; } 12% { opacity: 1; } 100% { opacity: 0; } }

  /* Reduced motion: every step still happens and every word still
     arrives, it just stops moving to get there. */
  @media (prefers-reduced-motion: reduce) {
    .wl-scene *, .wl-scene *::before, .wl-scene *::after { transition-duration: .01ms !important; transition-delay: 0s !important; }
    .wl-rays, .wl-glint, .wl-panel-glint, .wl-eve-head, .wl-eve-hover, .wl-headidle,
    .wl-act-disc, .wl-handspot::before, .wl-orb { animation: none !important; }
    .wl-dust { display: none; }
    .wl-star { animation: none; opacity: var(--op); }
    .wl-on .wl-lid { animation: none; transform: scaleY(0); }
    .wl-in, .wl-caption, .wl-bubble, .wl-acts.is-leaving, .wl-dock-in.is-leaving { animation: none; opacity: 1; transform: none; }
    .wl-acts.is-leaving, .wl-dock-in.is-leaving { opacity: 0; }
    .wl-f-title { animation: none; opacity: 1; }
  }
`
