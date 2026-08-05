import React, { useState, useRef, useEffect, useCallback } from 'react'

// A tiny, private story + mini-game. Three little scenes, a tomato cannon,
// and a goodnight. The villains are entirely fictional — they stand in for
// rudeness in general, never a real person.

const TARGET_HITS = 8
const AMMO = ['🍅', '🥚', '🍅']
const GRAVITY = 0.00055   // px per ms^2
const SPEED = 1.15        // px per ms

const TAUNTS = [
  "Let's circle back.", 'Quick sync?', 'Per my last email…', 'Can you do EOD?',
  "Let's take this offline.", 'Low-hanging fruit!', 'Move the needle!',
  'Just a small ask…', 'Ping me on this.', "Let's align.", 'Boil the ocean!',
  'Circle back Monday?', 'Double-click on that.', 'Synergy!',
]
const REACTIONS = ['Ow!', 'Hey!', 'Not the tie!', 'Rude!', "That's… fair.", 'Okay, ow.', 'I deserve that.', 'Unprofessional!', 'Oof!', 'My badge!']
const DODGES = ['Missed me!', 'Too slow!', 'Nice try!', 'Whoosh!', 'Gotta run — meeting!', 'Can’t catch me!']

const SCENES = [
  { title: 'There’s a girl who really loves life.', sub: 'Laughs too loud. Turns ordinary days into something.' },
  { title: 'But every good story has villains.', sub: 'The rude ones. The loud ones. The ones who forget to be kind.' },
  { title: 'So what does she do about them?', sub: 'Simple.' },
]

// ---- tiny WebAudio synth (lazy, gesture-initialised) ---------------------
function makeAudio() {
  let ctx = null
  const ensure = () => { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)() } catch {} } return ctx }
  const noise = (dur) => {
    const c = ensure(); if (!c) return null
    const b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate)
    const d = b.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    const s = c.createBufferSource(); s.buffer = b; return s
  }
  return {
    resume() { const c = ensure(); if (c && c.state === 'suspended') c.resume() },
    fire() {
      const c = ensure(); if (!c) return
      const o = c.createOscillator(); o.type = 'square'
      o.frequency.setValueAtTime(120, c.currentTime); o.frequency.exponentialRampToValueAtTime(420, c.currentTime + 0.09)
      const g = c.createGain(); g.gain.setValueAtTime(0.1, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.12)
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.13)
    },
    splat() {
      const c = ensure(); if (!c) return
      const s = noise(0.16)
      if (s) {
        const f = c.createBiquadFilter(); f.type = 'lowpass'
        f.frequency.setValueAtTime(1600, c.currentTime); f.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.15)
        const g = c.createGain(); g.gain.setValueAtTime(0.35, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.16)
        s.connect(f); f.connect(g); g.connect(c.destination); s.start()
      }
      const o = c.createOscillator(); o.type = 'sine'
      o.frequency.setValueAtTime(190, c.currentTime); o.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.14)
      const og = c.createGain(); og.gain.setValueAtTime(0.25, c.currentTime); og.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15)
      o.connect(og); og.connect(c.destination); o.start(); o.stop(c.currentTime + 0.16)
    },
    miss() {
      const c = ensure(); if (!c) return
      const s = noise(0.09); if (!s) return
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400
      const g = c.createGain(); g.gain.setValueAtTime(0.1, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.09)
      s.connect(f); f.connect(g); g.connect(c.destination); s.start()
    },
    dodge() {
      const c = ensure(); if (!c) return
      const o = c.createOscillator(); o.type = 'sine'
      o.frequency.setValueAtTime(300, c.currentTime); o.frequency.exponentialRampToValueAtTime(900, c.currentTime + 0.18)
      const g = c.createGain(); g.gain.setValueAtTime(0.07, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.2)
      o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + 0.21)
    },
    win() {
      const c = ensure(); if (!c) return
      ;[523.25, 659.25, 783.99, 1046.5].forEach((n, i) => {
        const o = c.createOscillator(); o.type = 'triangle'; o.frequency.value = n
        const g = c.createGain(); const t = c.currentTime + i * 0.12
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.04); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
        o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + 0.5)
      })
    },
  }
}

// ---- our hero ------------------------------------------------------------
function Girl({ pose = 'joy', style }) {
  const joy = pose === 'joy', ready = pose === 'ready'
  return (
    <svg viewBox="0 0 200 230" className="bd-girl" style={style} aria-hidden="true">
      {/* ponytail + bow */}
      <path d="M140 52c16-6 32 2 38 16 7 16 1 34-10 45-6 6-14 3-13-5 2-14 3-26-2-36-4-9-12-12-13-20z" fill="#4a3355" />
      <path d="M141 47l-14-9 2 18z" fill="#ff8fa8" />
      <path d="M141 47l15-8-3 18z" fill="#ff8fa8" />
      <circle cx="141" cy="47" r="6" fill="#ffb3c4" />

      <rect x="92" y="112" width="16" height="24" rx="7" fill="#f0b489" />

      {/* arms */}
      {joy ? (
        <>
          <path d="M68 144c-14-7-24-24-27-42" stroke="#ffd9b8" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M132 144c14-7 24-24 27-42" stroke="#ffd9b8" strokeWidth="14" strokeLinecap="round" fill="none" />
        </>
      ) : ready ? (
        <>
          <path d="M72 146c-10 11-14 27-13 44" stroke="#ffd9b8" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M134 144c14-7 22-22 24-38" stroke="#ffd9b8" strokeWidth="14" strokeLinecap="round" fill="none" />
          {/* the tomato */}
          <circle cx="161" cy="96" r="12" fill="#e2483a" stroke="#b8362a" strokeWidth="2" />
          <path d="M155 87q6-6 12 0q-6 3-12 0z" fill="#4caf6d" />
        </>
      ) : (
        <>
          <path d="M72 146c-10 11-14 27-13 44" stroke="#ffd9b8" strokeWidth="14" strokeLinecap="round" fill="none" />
          <path d="M128 146c10 11 14 27 13 44" stroke="#ffd9b8" strokeWidth="14" strokeLinecap="round" fill="none" />
        </>
      )}

      {/* top */}
      <path d="M100 128c-21 0-33 14-33 36v33c0 8 4 12 12 12h42c8 0 12-4 12-12v-33c0-22-12-36-33-36z" fill="#f47a68" />
      <path d="M100 128c-8 0-13 3-13 3l13 14 13-14s-5-3-13-3z" fill="#ffe3d0" opacity=".5" />

      {/* face + fringe */}
      <ellipse cx="100" cy="80" rx="44" ry="43" fill="#ffd9b8" />
      <path d="M56 78c-4-32 18-52 44-52s48 20 44 52c-3-10-6-18-10-23-10 6-24 9-38 7-12-2-20-6-25-11-6 6-11 15-15 27z" fill="#4a3355" />

      {/* eyes */}
      {joy ? (
        <>
          <path d="M73 84q9-12 18 0" stroke="#4a3355" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M109 84q9-12 18 0" stroke="#4a3355" strokeWidth="4.5" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="82" cy="82" rx="10.5" ry="12.5" fill="#fff" />
          <ellipse cx="118" cy="82" rx="10.5" ry="12.5" fill="#fff" />
          <circle cx="82" cy="83" r="7" fill="#3d2b2b" />
          <circle cx="118" cy="83" r="7" fill="#3d2b2b" />
          <circle cx="79.5" cy="79" r="3.2" fill="#fff" />
          <circle cx="115.5" cy="79" r="3.2" fill="#fff" />
          <circle cx="84.5" cy="87" r="1.6" fill="#fff" opacity=".8" />
          <circle cx="120.5" cy="87" r="1.6" fill="#fff" opacity=".8" />
          <path d={ready ? 'M71 71q11-7 22-2' : 'M72 68q11-5 21-1'} stroke="#4a3355" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d={ready ? 'M129 71q-11-7-22-2' : 'M128 68q-11-5-21-1'} stroke="#4a3355" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* blush */}
      <ellipse cx="66" cy="94" rx="8" ry="5.5" fill="#ff9aa0" opacity=".65" />
      <ellipse cx="134" cy="94" rx="8" ry="5.5" fill="#ff9aa0" opacity=".65" />

      {/* mouth */}
      {joy ? (
        <>
          <path d="M89 96q11 17 22 0z" fill="#c25b5b" />
          <path d="M93 104q7 5 14 0z" fill="#ff9aa0" />
        </>
      ) : ready ? (
        <path d="M93 99q8 8 15 -2" stroke="#c25b5b" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M92 99q8 5 16 0" stroke="#c25b5b" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      )}
    </svg>
  )
}

// ---- the fictional villain ----------------------------------------------
// Cute enough to be fun, clearly a villain: horns, sly fang, angry brows,
// tiny cape, necktie + ID badge.
function Villain({ face, flinch, defeated, w = 150 }) {
  const smug = face === 'smug', dizzy = face === 'dizzy' || defeated
  const px = smug ? 4 : 0
  // the top hat tips when he's hit and slides right off when he's done
  const hat = defeated ? 'rotate(-40 100 50) translate(-30 -14)' : flinch ? 'rotate(-11 100 50) translate(-5 -9)' : ''
  return (
    <svg viewBox="0 0 200 220" width={w} height={w * 1.1} className="bd-villain" aria-hidden="true"
      style={{ transform: defeated ? 'rotate(96deg) translate(22px, 18px)' : flinch ? 'rotate(-7deg) scale(0.96)' : 'none', transition: defeated ? 'transform .8s cubic-bezier(.5,1.5,.5,1)' : 'transform .16s ease' }}>
      <defs>
        <linearGradient id="bdBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b6bd6" /><stop offset="100%" stopColor="#5b3fa0" />
        </linearGradient>
      </defs>

      {/* cape, with the classic red lining */}
      <path d="M70 132c-28 12-44 42-42 78 12 3 22 1 22 1 2-30 10-54 26-71z" fill="#2a2145" />
      <path d="M130 132c28 12 44 42 42 78-12 3-22 1-22 1-2-30-10-54-26-71z" fill="#2a2145" />
      <path d="M70 132c-10 18-14 44-13 74l9 1c0-30 4-54 14-70z" fill="#c0392b" />
      <path d="M130 132c10 18 14 44 13 74l-9 1c0-30-4-54-14-70z" fill="#c0392b" />

      {/* arms */}
      <ellipse cx="52" cy="176" rx="10" ry="16" fill="#7355c4" stroke="#33265e" strokeWidth="2.5" transform={flinch ? 'rotate(-24 52 176)' : ''} />
      <ellipse cx="148" cy="176" rx="10" ry="16" fill="#7355c4" stroke="#33265e" strokeWidth="2.5" transform={flinch ? 'rotate(24 148 176)' : ''} />

      {/* body + cravat */}
      <path d="M100 134c-24 0-38 16-38 40v34h76v-34c0-24-14-40-38-40z" fill="url(#bdBody)" stroke="#33265e" strokeWidth="3" />
      <path d="M100 136l-15 6 9 19 6-13 6 13 9-19z" fill="#f2f5f7" />
      <circle cx="100" cy="162" r="5" fill="#c0392b" />

      {/* head */}
      <ellipse cx="100" cy="94" rx="45" ry="43" fill="#d3c6ea" stroke="#33265e" strokeWidth="3" />

      {/* top hat */}
      <g transform={hat} style={{ transition: 'transform .3s cubic-bezier(.5,1.4,.5,1)' }}>
        <ellipse cx="100" cy="53" rx="60" ry="12" fill="#1c1b2e" />
        <rect x="66" y="4" width="68" height="46" rx="5" fill="#1c1b2e" />
        <rect x="66" y="35" width="68" height="11" fill="#c0392b" />
      </g>

      {/* eyes */}
      {dizzy ? (
        <>
          <path d="M72 74l18 18M90 74l-18 18" stroke="#2a1a52" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M112 74l18 18M130 74l-18 18" stroke="#2a1a52" strokeWidth="4.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="82" cy="83" rx="14" ry="15" fill="#fff" />
          <ellipse cx="122" cy="83" rx="14" ry="15" fill="#fff" />
          <circle cx={82 + px} cy="86" r="6.5" fill="#2a1a52" />
          <circle cx={122 + px} cy="86" r="6.5" fill="#2a1a52" />
          <circle cx={84.5 + px} cy="83" r="2.2" fill="#fff" />
          <circle cx={124.5 + px} cy="83" r="2.2" fill="#fff" />
          <path d="M63 64L94 74" stroke="#1c1b2e" strokeWidth="6" strokeLinecap="round" />
          <path d="M137 64L106 74" stroke="#1c1b2e" strokeWidth="6" strokeLinecap="round" />
        </>
      )}

      {/* monocle — pops out of his eye once he's had enough */}
      <path d="M140 92q9 16 3 28" stroke="#e8c96a" strokeWidth="2" fill="none" />
      <circle cx={dizzy ? 146 : 122} cy={dizzy ? 124 : 83} r={dizzy ? 12 : 19} fill="none" stroke="#e8c96a" strokeWidth="3"
        style={{ transition: 'all .35s cubic-bezier(.5,1.4,.5,1)' }} />

      {/* nose */}
      <path d="M97 96q-4 8 3 9" stroke="#a98fd6" strokeWidth="3.4" fill="none" strokeLinecap="round" />

      {/* handlebar moustache */}
      <path d="M100 112C88 105 68 106 59 113c-6 5-3 14 4 12 5-2 4-8-1-7" stroke="#1c1b2e" strokeWidth="6.5" fill="none" strokeLinecap="round" />
      <path d="M100 112c12-7 32-6 41 1 6 5 3 14-4 12-5-2-4-8 1-7" stroke="#1c1b2e" strokeWidth="6.5" fill="none" strokeLinecap="round" />

      {/* mouth */}
      {defeated ? (
        <path d="M86 130q14 -11 28 0" fill="none" stroke="#2a1a52" strokeWidth="4" strokeLinecap="round" />
      ) : flinch ? (
        <ellipse cx="100" cy="127" rx="10" ry="11" fill="#2a1a52" />
      ) : smug ? (
        <>
          <path d="M86 124Q100 137 116 123Q100 130 86 124" fill="#2a1a52" />
          <path d="M105 126h6l-3 7z" fill="#fff" />
        </>
      ) : (
        <path d="M85 131q15 -12 30 0" fill="none" stroke="#2a1a52" strokeWidth="4.5" strokeLinecap="round" />
      )}
    </svg>
  )
}

export default function Splat({ onBack }) {
  const [phase, setPhase] = useState('story')  // story | game | win
  const [scene, setScene] = useState(0)
  const [hits, setHits] = useState(0)
  const [shots, setShots] = useState(0)
  const [combo, setCombo] = useState(0)
  const [flinch, setFlinch] = useState(false)
  const [defeated, setDefeated] = useState(false)
  const [bubble, setBubble] = useState({ text: TAUNTS[0], kind: 'taunt' })
  const [muted, setMuted] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [vs, setVs] = useState(1)   // character scale, for small screens

  const arenaRef = useRef(null)
  const villainRef = useRef(null)
  const cannonRef = useRef(null)
  const audioRef = useRef(null)
  const comboTimer = useRef(null)
  const mutedRef = useRef(false); mutedRef.current = muted
  const defeatedRef = useRef(false); defeatedRef.current = defeated

  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const g = useRef({ x: 0, y: 0, vx: 0.18, bob: 0, projs: [], raf: 0, last: 0, dodgeCd: 0, dashMs: 0, dashVx: 0, hits: 0, aim: -Math.PI / 2, w: 0, h: 0, vs: 1 })

  const audio = () => { if (!audioRef.current) audioRef.current = makeAudio(); return audioRef.current }
  const play = (k) => { if (mutedRef.current) return; const a = audio(); a.resume(); a[k] && a[k]() }

  const face = defeated ? 'dizzy' : hits >= TARGET_HITS - 2 ? 'dizzy' : hits >= TARGET_HITS * 0.4 ? 'annoyed' : 'smug'

  // Keep characters a sensible size on phones.
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth
      const v = w < 380 ? 0.58 : w < 520 ? 0.68 : w < 760 ? 0.82 : 1
      g.current.vs = v; setVs(v)
    }
    calc()
    window.addEventListener('resize', calc)
    window.addEventListener('orientationchange', calc)
    return () => { window.removeEventListener('resize', calc); window.removeEventListener('orientationchange', calc) }
  }, [])

  // Story advances only on tap — no timer, so each beat can be read at any pace

  // ---- effects -----------------------------------------------------------
  const spawnSplat = useCallback((x, y, emoji, big) => {
    const arena = arenaRef.current; if (!arena) return
    const color = emoji === '🥚' ? '240, 205, 100' : '215, 60, 45'
    const stain = document.createElement('span')
    stain.className = 'bd-stain'
    stain.style.left = x + 'px'; stain.style.top = y + 'px'
    stain.style.setProperty('--c', color)
    stain.style.setProperty('--s', (big ? 54 : 34) + Math.random() * 30 + 'px')
    arena.appendChild(stain)
    const all = arena.querySelectorAll('.bd-stain')
    if (all.length > 16) all[0].remove()
    if (reduced) return
    for (let i = 0; i < (big ? 11 : 5); i++) {
      const p = document.createElement('span')
      p.className = 'bd-p'
      p.style.left = x + 'px'; p.style.top = y + 'px'
      p.style.background = `rgba(${color},.95)`
      const a = Math.random() * Math.PI * 2, d = 26 + Math.random() * (big ? 78 : 44)
      p.style.setProperty('--dx', Math.cos(a) * d + 'px')
      p.style.setProperty('--dy', Math.sin(a) * d + 'px')
      p.style.width = p.style.height = 4 + Math.random() * 8 + 'px'
      arena.appendChild(p)
      p.addEventListener('animationend', () => p.remove(), { once: true })
    }
  }, [reduced])

  const triggerWin = useCallback(() => {
    setDefeated(true)
    setBubble({ text: '…fine. You win.', kind: 'reaction' })
    play('win')
    const arena = arenaRef.current
    if (arena && !reduced) {
      const C = ['#f6c453', '#e8654f', '#5bd6a0', '#6aa8ff', '#c58bf2', '#ff8fb1']
      for (let i = 0; i < 80; i++) {
        const s = document.createElement('span')
        s.className = 'bd-confetti'
        s.style.left = 8 + Math.random() * 84 + 'vw'
        s.style.background = C[(Math.random() * C.length) | 0]
        s.style.setProperty('--dx', (Math.random() * 2 - 1) * 26 + 'vw')
        s.style.setProperty('--rot', Math.random() * 720 - 360 + 'deg')
        s.style.animationDelay = Math.random() * 0.3 + 's'
        s.style.animationDuration = 2 + Math.random() * 1.6 + 's'
        arena.appendChild(s)
        s.addEventListener('animationend', () => s.remove(), { once: true })
      }
    }
    setTimeout(() => setPhase('win'), 1700)
  }, [reduced])

  // ---- game loop ---------------------------------------------------------
  useEffect(() => {
    if (phase !== 'game') return
    const arena = arenaRef.current; if (!arena) return
    const s = g.current
    const rect = arena.getBoundingClientRect()
    s.w = rect.width; s.h = rect.height
    s.x = rect.width / 2
    s.y = Math.min(Math.max(150 * s.vs, rect.height * 0.32), rect.height - 190)
    s.projs = []; s.last = 0; s.dodgeCd = 0; s.dashMs = 0; s.dashVx = 0; s.vx = 0.18

    const onResize = () => {
      const r = arena.getBoundingClientRect(); s.w = r.width; s.h = r.height
      s.y = Math.min(Math.max(150 * s.vs, r.height * 0.32), r.height - 190)
      s.x = Math.min(Math.max(s.x, 40 + 76 * s.vs), r.width - (40 + 76 * s.vs))
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)

    const step = (ts) => {
      s.raf = requestAnimationFrame(step)
      if (!s.last) s.last = ts
      const dt = Math.min(48, ts - s.last); s.last = ts
      const level = s.hits / TARGET_HITS
      const pad = 40 + 76 * s.vs

      if (!defeatedRef.current) {
        const boost = 1 + level * 1.4
        if (s.dashMs > 0) {
          s.x += s.dashVx * dt   // mid-escape: it bolts sideways
          s.dashMs -= dt
        } else {
          s.x += s.vx * boost * dt
          if (Math.random() < 0.004 + level * 0.006) s.vx *= -1
        }
        if (s.x < pad) { s.x = pad; s.vx = Math.abs(s.vx); s.dashVx = Math.abs(s.dashVx) }
        if (s.x > s.w - pad) { s.x = s.w - pad; s.vx = -Math.abs(s.vx); s.dashVx = -Math.abs(s.dashVx) }
        s.bob += dt * 0.003
        if (s.dodgeCd > 0) s.dodgeCd -= dt
      }

      const vy = Math.sin(s.bob) * 16 * s.vs
      if (villainRef.current) villainRef.current.style.transform = `translate(${s.x}px, ${s.y + vy}px) translate(-50%,-50%)`

      for (let i = s.projs.length - 1; i >= 0; i--) {
        const p = s.projs[i]
        p.vy += GRAVITY * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rot += dt * 0.9
        p.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%,-50%) rotate(${p.rot}deg)`

        // dodge — if a shot is closing in, it may bolt sideways and escape
        if (!defeatedRef.current && s.dodgeCd <= 0 && s.dashMs <= 0) {
          const dx = s.x - p.x, dy = (s.y + vy) - p.y
          const dist = Math.hypot(dx, dy)
          const closing = (p.vx * dx + p.vy * dy) > 0
          if (closing && dist < 215 && dist > 78 && Math.random() < 0.07 + level * 0.05) {
            s.dashVx = (dx >= 0 ? 1 : -1) * 0.85
            s.dashMs = 300
            s.dodgeCd = 1500
            setBubble({ text: DODGES[(Math.random() * DODGES.length) | 0], kind: 'dodge' })
            play('dodge')
          }
        }

        const hitR = Math.max(50, 62 * s.vs)
        if (!defeatedRef.current && Math.hypot(p.x - s.x, p.y - (s.y + vy)) < hitR) {
          p.el.remove(); s.projs.splice(i, 1)
          spawnSplat(p.x, p.y, p.emoji, true)
          play('splat')
          if (!reduced) { arena.classList.remove('bd-shake'); void arena.offsetWidth; arena.classList.add('bd-shake') }
          setFlinch(true); setTimeout(() => setFlinch(false), 190)
          setBubble({ text: REACTIONS[(Math.random() * REACTIONS.length) | 0], kind: 'reaction' })
          setCombo(c => c + 1)
          clearTimeout(comboTimer.current); comboTimer.current = setTimeout(() => setCombo(0), 1600)
          // knockback — and it gets a little quicker each time it's hit
          s.dashMs = 0
          s.vx = (p.vx > 0 ? 1 : -1) * (0.18 + level * 0.14)
          s.hits += 1
          setHits(s.hits)
          if (s.hits >= TARGET_HITS) triggerWin()
          continue
        }

        if (p.y > s.h + 60 || p.x < -80 || p.x > s.w + 80 || p.y < -400) {
          if (p.y > s.h - 40 && p.x > 0 && p.x < s.w) { spawnSplat(p.x, Math.min(p.y, s.h - 12), p.emoji, false); play('miss') }
          p.el.remove(); s.projs.splice(i, 1)
        }
      }
    }
    s.raf = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(s.raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
      s.projs.forEach(p => p.el.remove()); s.projs = []
    }
  }, [phase, spawnSplat, triggerWin, reduced])

  // ---- aiming + firing ---------------------------------------------------
  const aimAt = useCallback((clientX, clientY) => {
    const arena = arenaRef.current, cannon = cannonRef.current
    if (!arena || !cannon) return null
    const ar = arena.getBoundingClientRect()
    const cx = ar.width / 2, cy = ar.height - 46
    const ang = Math.atan2((clientY - ar.top) - cy, (clientX - ar.left) - cx)
    const clamped = Math.max(-Math.PI * 0.94, Math.min(-Math.PI * 0.06, ang))
    g.current.aim = clamped
    cannon.style.transform = `rotate(${clamped + Math.PI / 2}rad)`
    return { cx, cy, ang: clamped }
  }, [])

  const fire = useCallback((clientX, clientY) => {
    if (phase !== 'game' || defeatedRef.current) return
    const arena = arenaRef.current; if (!arena) return
    const a = aimAt(clientX, clientY); if (!a) return
    setShowHint(false); setShots(n => n + 1)
    play('fire')
    const emoji = AMMO[(g.current.projs.length + Math.floor(Math.random() * 3)) % AMMO.length]
    const el = document.createElement('div')
    el.className = 'bd-proj'; el.textContent = emoji
    el.style.fontSize = Math.max(22, 30 * g.current.vs) + 'px'
    arena.appendChild(el)
    const p = {
      el, emoji, rot: 0,
      x: a.cx + Math.cos(a.ang) * 46,
      y: a.cy + Math.sin(a.ang) * 46,
      vx: Math.cos(a.ang) * SPEED,
      vy: Math.sin(a.ang) * SPEED,
    }
    el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%,-50%)`
    g.current.projs.push(p)
    const c = cannonRef.current
    if (c && !reduced) { c.classList.remove('bd-recoil'); void c.offsetWidth; c.classList.add('bd-recoil') }
  }, [phase, aimAt, reduced])

  useEffect(() => {
    if (phase !== 'game' || defeated) return
    const id = setInterval(() => setBubble({ text: TAUNTS[(Math.random() * TAUNTS.length) | 0], kind: 'taunt' }), 2800)
    return () => clearInterval(id)
  }, [phase, defeated])

  const startGame = () => { audio().resume(); setPhase('game') }

  const reset = () => {
    const s = g.current
    s.hits = 0; s.projs.forEach(p => p.el.remove()); s.projs = []
    setHits(0); setShots(0); setCombo(0); setDefeated(false); setFlinch(false)
    setBubble({ text: TAUNTS[(Math.random() * TAUNTS.length) | 0], kind: 'taunt' })
    setShowHint(true); setPhase('game')
    const arena = arenaRef.current
    if (arena) arena.querySelectorAll('.bd-stain,.bd-p,.bd-confetti,.bd-proj').forEach(n => n.remove())
  }

  const pct = Math.min(100, Math.round((hits / TARGET_HITS) * 100))
  const accuracy = shots ? Math.round((hits / shots) * 100) : 0
  const vw = 150 * vs, vh = 165 * vs

  return (
    <div className="fixed inset-0 z-[400] overflow-hidden select-none bd-root"
      style={{ background: phase === 'win' ? 'radial-gradient(120% 100% at 50% 0%, #101a3a, #070b1c 70%)' : 'radial-gradient(120% 120% at 50% 20%, #26314f, #121a2e 75%)' }}>
      <style>{STYLE}</style>
      <div className="bd-bg" />

      <button onClick={onBack} title="Back" className="fixed top-4 left-4 z-30 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-white/70 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(8px)' }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        <span className="hidden sm:inline">Back</span>
      </button>
      <button onClick={() => setMuted(m => !m)} aria-label={muted ? 'Unmute' : 'Mute'} title={muted ? 'Unmute' : 'Mute'} className="fixed top-4 right-4 z-30 w-10 h-10 rounded-full inline-flex items-center justify-center text-white/70 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(8px)' }}>
        {muted
          ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" /></svg>
          : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" /></svg>}
      </button>

      {/* STORY */}
      {phase === 'story' && (
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-5 text-center bd-story"
          onClick={() => { if (scene < SCENES.length - 1) setScene(s => s + 1) }}>

          <div key={scene} className="bd-scene flex flex-col items-center w-full">
            <div className="flex items-end justify-center gap-1 sm:gap-3" style={{ minHeight: 'min(34vh, 230px)' }}>
              {scene === 0 && (
                <div className="relative">
                  <Girl pose="joy" style={{ width: 'clamp(120px, 34vw, 178px)', height: 'auto' }} />
                  {['✨', '💛', '✨', '🎈'].map((s, i) => (
                    <span key={i} className="bd-spark absolute" style={{ left: `${[-22, 96, 8, 78][i]}%`, top: `${[6, 16, -10, -4][i]}%`, animationDelay: `${i * 0.45}s`, fontSize: 'clamp(15px,4vw,22px)' }}>{s}</span>
                  ))}
                </div>
              )}
              {scene === 1 && (
                <>
                  <Girl pose="watch" style={{ width: 'clamp(86px, 24vw, 128px)', height: 'auto', opacity: 0.95 }} />
                  <div className="flex items-end -space-x-2 sm:-space-x-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="bd-creep" style={{ animationDelay: `${0.15 + i * 0.28}s`, filter: `hue-rotate(${i * 42}deg)` }}>
                        <Villain face="smug" w={[62, 78, 58][i]} />
                      </div>
                    ))}
                  </div>
                </>
              )}
              {scene === 2 && (
                <div className="bd-pop">
                  <Girl pose="ready" style={{ width: 'clamp(124px, 34vw, 180px)', height: 'auto' }} />
                </div>
              )}
            </div>

            <p className="font-heading text-white leading-snug mt-5 max-w-[22rem] bd-line" style={{ fontSize: 'clamp(1.25rem,5.4vw,2rem)', animationDelay: '.25s' }}>{SCENES[scene].title}</p>
            <p className="text-white/55 leading-relaxed mt-2.5 max-w-[21rem] bd-line" style={{ fontSize: 'clamp(.9rem,3.6vw,1.05rem)', animationDelay: '1.15s' }}>{SCENES[scene].sub}</p>
          </div>

          {scene === SCENES.length - 1 ? (
            <button onClick={(e) => { e.stopPropagation(); startGame() }}
              className="bd-pop mt-7 rounded-full px-8 py-3.5 text-[15px] font-semibold transition-transform active:scale-95"
              style={{ background: '#e8654f', color: '#fff', boxShadow: '0 10px 30px -8px rgba(232,101,79,.6)', animationDelay: '1.85s' }}>
              Play 🍅
            </button>
          ) : (
            <button key={'cont' + scene} onClick={(e) => { e.stopPropagation(); setScene(s => s + 1) }}
              className="bd-line mt-7 rounded-full px-7 py-3 text-[14px] font-medium text-white/70 transition-all active:scale-95 hover:text-white"
              style={{ background: 'rgba(255,255,255,.07)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.16)', animationDelay: '1.85s' }}>
              Continue <span aria-hidden="true" style={{ marginLeft: 4 }}>→</span>
            </button>
          )}

          <div className="absolute bottom-6 flex gap-1.5">
            {SCENES.map((_, i) => (
              <span key={i} className="rounded-full transition-all" style={{ width: i === scene ? 18 : 6, height: 6, background: i === scene ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.2)' }} />
            ))}
          </div>
        </div>
      )}

      {/* GAME */}
      {phase === 'game' && (
        <div ref={arenaRef}
          onPointerMove={(e) => aimAt(e.clientX, e.clientY)}
          onPointerDown={(e) => fire(e.clientX, e.clientY)}
          className="relative z-10 h-full w-full overflow-hidden bd-arena">

          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[min(360px,78vw)] z-20 pointer-events-none">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-white/60 mb-1.5">
              <span>Peace restored</span><span>{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.14)' }}>
              <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f6c453,#e8654f)' }} />
            </div>
            {shots > 0 && <div className="text-center text-[10px] font-mono text-white/35 mt-1.5">{hits}/{shots} hits · {accuracy}% aim</div>}
          </div>

          {/* the villain — box is exactly the sprite, so the hitbox matches */}
          <div ref={villainRef} className="absolute top-0 left-0 pointer-events-none z-10" style={{ willChange: 'transform' }}>
            <div className="relative" style={{ width: vw, height: vh }}>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5">
                <div className={`bd-bubble ${bubble.kind === 'reaction' ? 'bd-bubble-hit' : bubble.kind === 'dodge' ? 'bd-bubble-dodge' : ''}`}>{bubble.text}</div>
              </div>
              <div className={flinch ? 'bd-flinch' : ''}><Villain face={face} flinch={flinch} defeated={defeated} w={vw} /></div>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-center whitespace-nowrap">
                <div className="text-white/85 font-heading text-[12px] font-semibold tracking-wide">THE VILLAIN</div>
                <div className="text-white/35 text-[9px] font-mono uppercase tracking-[.2em]">certified nuisance</div>
              </div>
            </div>
          </div>

          {combo > 1 && !defeated && (
            <div key={combo} className="bd-combo absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none font-heading font-bold text-white" style={{ top: '15%', fontSize: 'clamp(1.4rem,5vw,2.4rem)' }}>x{combo}!</div>
          )}

          <div className="absolute bottom-0 left-0 right-0 h-24 z-[15] pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,.35))' }} />
          <div className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none" style={{ bottom: '10px' }}>
            <div ref={cannonRef} className="bd-cannon" style={{ transformOrigin: '50% 78%' }}>
              <svg viewBox="0 0 60 76" width={Math.max(46, 54 * vs)} height={Math.max(58, 68 * vs)} aria-hidden="true">
                <rect x="23" y="2" width="14" height="44" rx="7" fill="#6b7a90" stroke="#3d4757" strokeWidth="2.5" />
                <rect x="25.5" y="6" width="9" height="12" rx="4.5" fill="#8b9aae" />
                <ellipse cx="30" cy="56" rx="20" ry="16" fill="#4e5a6d" stroke="#333c4a" strokeWidth="2.5" />
                <circle cx="30" cy="56" r="7" fill="#e8654f" />
              </svg>
            </div>
          </div>

          {showHint && (
            <div className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none text-white/50 font-mono animate-pulse text-center px-4" style={{ bottom: '108px', fontSize: 'clamp(11px,3.2vw,13px)' }}>
              <span className="hidden sm:inline">aim with your mouse · click to fire 🍅</span>
              <span className="sm:hidden">tap where you want to throw 🍅</span>
              <br /><span className="text-white/30" style={{ fontSize: '.85em' }}>(he dodges — lead your shot)</span>
            </div>
          )}
        </div>
      )}

      {/* GOODNIGHT */}
      {phase === 'win' && (
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
          <div className="bd-stars" aria-hidden="true" />
          <div className="bd-moon mb-4" style={{ fontSize: 'clamp(2.6rem,11vw,3.75rem)' }} aria-hidden="true">🌙</div>
          <h1 className="bd-in font-heading font-bold text-white leading-none mb-4" style={{ fontSize: 'clamp(2.4rem,11vw,5rem)', animationDelay: '.05s', opacity: 0 }}>You won.</h1>
          <p className="bd-in text-white/80 leading-relaxed max-w-md" style={{ fontSize: 'clamp(.98rem,4vw,1.25rem)', animationDelay: '.35s', opacity: 0 }}>
            The world’s unfair sometimes. When it is — throw a tomato at it, and take your calm back.
          </p>
          {shots > 0 && <p className="bd-in text-white/30 text-[12px] font-mono mt-3" style={{ animationDelay: '.5s', opacity: 0 }}>{hits} hits · {shots} shots · {accuracy}% aim</p>}
          <p className="bd-in font-heading italic text-white/55 mt-6" style={{ fontSize: 'clamp(1.05rem,4.4vw,1.4rem)', animationDelay: '.75s', opacity: 0 }}>
            Goodnight. Ciao.
          </p>
          <div className="bd-in flex flex-wrap items-center justify-center gap-3 mt-9" style={{ animationDelay: '1.05s', opacity: 0 }}>
            <button onClick={reset} className="rounded-full px-5 py-3 text-[14px] font-semibold transition-transform active:scale-95" style={{ background: '#e8654f', color: '#fff' }}>Again 🍅</button>
            <button onClick={onBack} className="rounded-full px-5 py-3 text-[14px] font-medium text-white/70 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,.08)' }}>I feel lighter →</button>
          </div>
        </div>
      )}
    </div>
  )
}

const STYLE = `
  .bd-root { overscroll-behavior: none; -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }
  .bd-bg { position:absolute; inset:0; z-index:0; pointer-events:none; opacity:.55;
    background: radial-gradient(50% 40% at 20% 15%, rgba(120,150,255,.18), transparent 60%),
                radial-gradient(50% 40% at 85% 20%, rgba(255,140,110,.15), transparent 60%); }
  .bd-arena { cursor: crosshair; touch-action: none; }
  .bd-story { cursor: pointer; touch-action: manipulation; }
  .bd-girl { display:block; filter: drop-shadow(0 14px 26px rgba(0,0,0,.4)); }

  @keyframes bdIn { from{opacity:0; transform:translateY(14px)} to{opacity:1; transform:none} }
  .bd-in { animation: bdIn .7s cubic-bezier(.22,.61,.36,1) forwards; }
  .bd-scene { animation: bdIn .9s cubic-bezier(.22,.61,.36,1); }
  @keyframes bdLine { from{opacity:0; transform:translateY(10px)} to{opacity:1; transform:none} }
  .bd-line { animation: bdLine .85s cubic-bezier(.22,.61,.36,1) both; }
  @keyframes bdPopIn { 0%{opacity:0; transform:scale(.82)} 60%{transform:scale(1.05)} 100%{opacity:1; transform:scale(1)} }
  .bd-pop { animation: bdPopIn .55s cubic-bezier(.22,.61,.36,1) both; }
  @keyframes bdCreep { from{opacity:0; transform:translateX(46px)} to{opacity:1; transform:none} }
  .bd-creep { animation: bdCreep .9s cubic-bezier(.22,.61,.36,1) both; }
  @keyframes bdSpark { 0%,100%{opacity:.25; transform:translateY(4px) scale(.9)} 50%{opacity:1; transform:translateY(-8px) scale(1.08)} }
  .bd-spark { animation: bdSpark 2.6s ease-in-out infinite; }

  .bd-villain { display:block; filter: drop-shadow(0 12px 22px rgba(0,0,0,.45)); }
  .bd-flinch { animation: bdFlinch .19s ease; }
  @keyframes bdFlinch { 0%{transform:translateX(0)} 30%{transform:translateX(-9px)} 70%{transform:translateX(9px)} 100%{transform:translateX(0)} }

  .bd-bubble { max-width:210px; padding:6px 12px; border-radius:14px; background:#fff; color:#26314f;
    font-size:13px; font-weight:600; position:relative; white-space:nowrap; box-shadow:0 8px 22px -8px rgba(0,0,0,.5); animation: bdBub .3s ease; }
  .bd-bubble::after { content:''; position:absolute; bottom:-5px; left:50%; transform:translateX(-50%) rotate(45deg); width:11px; height:11px; background:inherit; }
  .bd-bubble-hit { background:#ffe08a; color:#7a4a10; animation: bdPop .3s ease; }
  .bd-bubble-dodge { background:#bfe3ff; color:#134b70; }
  @keyframes bdBub { from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }
  @keyframes bdPop { 0%{transform:scale(.85)} 60%{transform:scale(1.12)} 100%{transform:scale(1)} }
  @media (max-width: 520px) { .bd-bubble { font-size:11.5px; padding:5px 10px; max-width:64vw; } }

  .bd-proj { position:absolute; top:0; left:0; z-index:25; font-size:30px; pointer-events:none; will-change:transform;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,.4)); }
  .bd-stain { position:absolute; z-index:6; width:var(--s); height:var(--s); margin-left:calc(var(--s)/-2); margin-top:calc(var(--s)/-2);
    border-radius:50%; pointer-events:none; background: radial-gradient(circle, rgba(var(--c),.85), rgba(var(--c),.35) 60%, transparent 72%); animation: bdStain .3s ease-out; }
  @keyframes bdStain { from{transform:scale(.2); opacity:0} to{transform:scale(1); opacity:1} }
  .bd-p { position:absolute; z-index:26; border-radius:50%; pointer-events:none; will-change:transform,opacity; animation: bdP .7s ease-out forwards; }
  @keyframes bdP { 0%{transform:translate(0,0) scale(1); opacity:1} 100%{transform:translate(var(--dx),calc(var(--dy) + 40px)) scale(.4); opacity:0} }

  .bd-cannon { filter: drop-shadow(0 6px 12px rgba(0,0,0,.5)); transition: transform .06s linear; }
  .bd-recoil { animation: bdRecoil .16s ease; }
  @keyframes bdRecoil { 0%{filter:brightness(1)} 40%{filter:brightness(1.5)} 100%{filter:brightness(1)} }

  .bd-shake { animation: bdShake .3s ease; }
  @keyframes bdShake { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-6px,3px)} 40%{transform:translate(6px,-3px)} 60%{transform:translate(-4px,2px)} 80%{transform:translate(4px,-2px)} }

  .bd-combo { animation: bdCombo .7s ease-out forwards; text-shadow:0 4px 14px rgba(246,196,83,.5); }
  @keyframes bdCombo { 0%{opacity:0; transform:translate(-50%,10px) scale(.6)} 30%{opacity:1; transform:translate(-50%,0) scale(1.1)} 100%{opacity:0; transform:translate(-50%,-30px) scale(1)} }

  .bd-confetti { position:absolute; top:-5vh; z-index:40; width:9px; height:14px; border-radius:2px; pointer-events:none; will-change:transform,opacity; animation: bdConf linear forwards; }
  @keyframes bdConf { 0%{opacity:0; transform:translateY(0) rotate(0)} 10%{opacity:1} 100%{opacity:0; transform:translate(var(--dx),110vh) rotate(var(--rot))} }

  .bd-moon { animation: bdFloat 3s ease-in-out infinite; }
  @keyframes bdFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  .bd-stars { position:absolute; inset:0; z-index:-1; pointer-events:none;
    background-image: radial-gradient(1.5px 1.5px at 20% 30%, #fff, transparent), radial-gradient(1.5px 1.5px at 70% 20%, #fff, transparent), radial-gradient(1px 1px at 40% 60%, #cfe, transparent), radial-gradient(1.5px 1.5px at 85% 70%, #fff, transparent), radial-gradient(1px 1px at 55% 80%, #fff, transparent), radial-gradient(1px 1px at 12% 75%, #fff, transparent);
    background-size: 300px 300px; opacity:.5; animation: bdTwinkle 5s ease-in-out infinite; }
  @keyframes bdTwinkle { 0%,100%{opacity:.35} 50%{opacity:.6} }

  @media (prefers-reduced-motion: reduce) {
    .bd-in,.bd-scene,.bd-pop,.bd-creep,.bd-line { animation:none; opacity:1 !important; }
    .bd-flinch,.bd-shake,.bd-combo,.bd-moon,.bd-stars,.bd-recoil,.bd-spark { animation:none; }
  }
`
