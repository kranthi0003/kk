import React, { useState, useRef, useEffect, useCallback } from 'react'

// "The Reset" — a tiny, wholesome aim-and-shoot mini-game for someone who had a
// rough day. A tomato cannon, and a FICTIONAL corporate-stress gremlin that
// wanders and dodges (it can absolutely escape your shot). Never a real person.
// Private/unlisted (#/splat). Interaction + sound + surprise over text.

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
const INTRO_LINES = ['Hey.', 'Heard today was… a lot.', 'No advice. No quotes.', 'Just tomatoes. 🍅']

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

// ---- the fictional corporate-stress gremlin ------------------------------
// Cute enough to be fun, clearly a villain: horns, sly fang, angry brows,
// tiny cape, corporate necktie + ID badge.
function Villain({ mood, flinch, defeated }) {
  const smug = mood === 'smug', dizzy = mood === 'dizzy' || defeated
  const px = smug ? 4 : 0
  return (
    <svg viewBox="0 0 200 220" width="150" height="165" className="bd-villain" aria-hidden="true"
      style={{ transform: defeated ? 'rotate(96deg) translate(22px, 18px)' : flinch ? 'rotate(-7deg) scale(0.96)' : 'none', transition: defeated ? 'transform .8s cubic-bezier(.5,1.5,.5,1)' : 'transform .16s ease' }}>
      <defs>
        <linearGradient id="bdBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b6bd6" /><stop offset="100%" stopColor="#5b3fa0" />
        </linearGradient>
      </defs>
      {/* cape */}
      <path d="M58 128c-18 22-22 56-12 80 24-10 32-32 32-32zM142 128c18 22 22 56 12 80-24-10-32-32-32-32z" fill="#3a2568" />
      {/* horns */}
      <path d="M64 40c-8-12-10-22-6-30 8 6 16 16 18 26z" fill="#f0d9a8" stroke="#c9ab72" strokeWidth="2" strokeLinejoin="round" />
      <path d="M136 40c8-12 10-22 6-30-8 6-16 16-18 26z" fill="#f0d9a8" stroke="#c9ab72" strokeWidth="2" strokeLinejoin="round" />
      {/* torso */}
      <path d="M100 128c-28 0-44 18-44 44v34h88v-34c0-26-16-44-44-44z" fill="url(#bdBody)" stroke="#442d80" strokeWidth="3" />
      {/* arms */}
      <ellipse cx="42" cy="172" rx="11" ry="17" fill="#7355c4" stroke="#442d80" strokeWidth="2.5" transform={flinch ? 'rotate(-22 42 172)' : ''} />
      <ellipse cx="158" cy="172" rx="11" ry="17" fill="#7355c4" stroke="#442d80" strokeWidth="2.5" transform={flinch ? 'rotate(22 158 172)' : ''} />
      {/* shirt collar + necktie */}
      <path d="M100 130L83 137L92 158L100 143z" fill="#f2f5f7" />
      <path d="M100 130L117 137L108 158L100 143z" fill="#f2f5f7" />
      <path d="M94 140h12l-6 9z" fill="#bb3327" />
      <path d="M100 149l-7 8 7 30 7-30z" fill="#e2483a" />
      {/* id badge */}
      <rect x="122" y="168" width="20" height="26" rx="3" fill="#f2f5f7" stroke="#442d80" strokeWidth="1.6" />
      <rect x="126" y="173" width="12" height="3.5" rx="1.7" fill="#a9b6c2" />
      <circle cx="132" cy="185" r="4" fill="#c6d0d9" />
      {/* head */}
      <ellipse cx="100" cy="80" rx="57" ry="53" fill="url(#bdBody)" stroke="#442d80" strokeWidth="3" />
      {/* eyes */}
      {dizzy ? (
        <>
          <path d="M70 70l16 16M86 70l-16 16" stroke="#2a1a52" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M114 70l16 16M130 70l-16 16" stroke="#2a1a52" strokeWidth="4.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <ellipse cx="78" cy="78" rx="15" ry="16" fill="#fff" />
          <ellipse cx="122" cy="78" rx="15" ry="16" fill="#fff" />
          <circle cx={78 + px} cy="81" r="7" fill="#2a1a52" />
          <circle cx={122 + px} cy="81" r="7" fill="#2a1a52" />
          <circle cx={80.5 + px} cy="78" r="2.4" fill="#fff" />
          <circle cx={124.5 + px} cy="78" r="2.4" fill="#fff" />
          {/* angry villain brows */}
          <path d="M60 56L86 66" stroke="#33205e" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M140 56L114 66" stroke="#33205e" strokeWidth="5.5" strokeLinecap="round" />
        </>
      )}
      {/* mouth */}
      {defeated ? (
        <path d="M84 104q16 12 32 0" fill="none" stroke="#2a1a52" strokeWidth="4" strokeLinecap="round" />
      ) : flinch ? (
        <ellipse cx="100" cy="106" rx="11" ry="13" fill="#2a1a52" />
      ) : smug ? (
        <>
          <path d="M76 100Q100 126 124 100Q100 110 76 100" fill="#2a1a52" />
          <path d="M105 103h7l-3.5 9z" fill="#fff" />
        </>
      ) : (
        <path d="M82 110q18 -13 36 0" fill="none" stroke="#2a1a52" strokeWidth="4.5" strokeLinecap="round" />
      )}
    </svg>
  )
}

export default function BadDay({ onBack }) {
  const [phase, setPhase] = useState('intro')  // intro | game | win
  const [hits, setHits] = useState(0)
  const [shots, setShots] = useState(0)
  const [combo, setCombo] = useState(0)
  const [flinch, setFlinch] = useState(false)
  const [defeated, setDefeated] = useState(false)
  const [bubble, setBubble] = useState({ text: TAUNTS[0], kind: 'taunt' })
  const [muted, setMuted] = useState(false)
  const [showHint, setShowHint] = useState(true)

  const arenaRef = useRef(null)
  const villainRef = useRef(null)   // wrapper div the loop moves
  const cannonRef = useRef(null)
  const audioRef = useRef(null)
  const comboTimer = useRef(null)
  const mutedRef = useRef(false); mutedRef.current = muted
  const defeatedRef = useRef(false); defeatedRef.current = defeated

  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Mutable game world (never triggers re-render).
  const g = useRef({ x: 0, y: 0, vx: 0.18, bob: 0, dir: 1, projs: [], raf: 0, last: 0, dodgeCd: 0, dashMs: 0, dashVx: 0, hits: 0, aim: -Math.PI / 2, w: 0, h: 0 })

  const audio = () => { if (!audioRef.current) audioRef.current = makeAudio(); return audioRef.current }
  const play = (k) => { if (mutedRef.current) return; const a = audio(); a.resume(); a[k] && a[k]() }

  const mood = defeated ? 'dizzy' : hits >= TARGET_HITS - 2 ? 'dizzy' : hits >= TARGET_HITS * 0.4 ? 'annoyed' : 'smug'

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
    s.x = rect.width / 2; s.y = Math.max(205, rect.height * 0.33)
    s.projs = []; s.last = 0; s.dodgeCd = 0; s.dashMs = 0; s.dashVx = 0; s.vx = 0.18

    const onResize = () => { const r = arena.getBoundingClientRect(); s.w = r.width; s.h = r.height }
    window.addEventListener('resize', onResize)

    const step = (ts) => {
      s.raf = requestAnimationFrame(step)
      if (!s.last) s.last = ts
      const dt = Math.min(48, ts - s.last); s.last = ts
      const level = s.hits / TARGET_HITS

      if (!defeatedRef.current) {
        // wander — faster and twitchier as it takes hits
        const boost = 1 + level * 1.4
        if (s.dashMs > 0) {
          s.x += s.dashVx * dt   // mid-escape: it bolts sideways
          s.dashMs -= dt
        } else {
          s.x += s.vx * boost * dt
          // occasional direction change so it isn't predictable
          if (Math.random() < 0.004 + level * 0.006) s.vx *= -1
        }
        const pad = 90
        if (s.x < pad) { s.x = pad; s.vx = Math.abs(s.vx); s.dashVx = Math.abs(s.dashVx) }
        if (s.x > s.w - pad) { s.x = s.w - pad; s.vx = -Math.abs(s.vx); s.dashVx = -Math.abs(s.dashVx) }
        s.bob += dt * 0.003
        if (s.dodgeCd > 0) s.dodgeCd -= dt
      }

      const vy = Math.sin(s.bob) * 16
      if (villainRef.current) villainRef.current.style.transform = `translate(${s.x}px, ${s.y + vy}px) translate(-50%,-50%)`

      // projectiles
      for (let i = s.projs.length - 1; i >= 0; i--) {
        const p = s.projs[i]
        p.vy += GRAVITY * dt
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.rot += dt * 0.9
        p.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%,-50%) rotate(${p.rot}deg)`

        // dodge — if a shot is closing in, the gremlin may bolt sideways and escape it
        if (!defeatedRef.current && s.dodgeCd <= 0 && s.dashMs <= 0) {
          const dx = s.x - p.x, dy = (s.y + vy) - p.y      // projectile -> villain
          const dist = Math.hypot(dx, dy)
          const closing = (p.vx * dx + p.vy * dy) > 0       // actually heading at it
          if (closing && dist < 215 && dist > 78 && Math.random() < 0.07 + level * 0.05) {
            s.dashVx = (dx >= 0 ? 1 : -1) * 0.85            // sprint away from the shot
            s.dashMs = 300
            s.dodgeCd = 1500
            setBubble({ text: DODGES[(Math.random() * DODGES.length) | 0], kind: 'dodge' })
            play('dodge')
          }
        }

        // hit test
        const hitR = 62
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

        // out of bounds → miss
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
    // clamp so it always fires upward-ish
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
    // recoil
    const c = cannonRef.current
    if (c && !reduced) { c.classList.remove('bd-recoil'); void c.offsetWidth; c.classList.add('bd-recoil') }
  }, [phase, aimAt, reduced])

  // Cycle taunts
  useEffect(() => {
    if (phase !== 'game' || defeated) return
    const id = setInterval(() => setBubble({ text: TAUNTS[(Math.random() * TAUNTS.length) | 0], kind: 'taunt' }), 2800)
    return () => clearInterval(id)
  }, [phase, defeated])

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

  return (
    <div className="fixed inset-0 z-[400] overflow-hidden select-none"
      style={{ background: phase === 'win' ? 'radial-gradient(120% 100% at 50% 0%, #101a3a, #070b1c 70%)' : 'radial-gradient(120% 120% at 50% 20%, #26314f, #121a2e 75%)' }}>
      <style>{STYLE}</style>
      <div className="bd-bg" />

      <button onClick={onBack} title="Back" className="fixed top-4 left-4 z-30 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-white/70 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(8px)' }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        <span className="hidden sm:inline">Back</span>
      </button>
      <button onClick={() => setMuted(m => !m)} aria-label={muted ? 'Unmute' : 'Mute'} title={muted ? 'Unmute' : 'Mute'} className="fixed top-4 right-4 z-30 w-9 h-9 rounded-full inline-flex items-center justify-center text-white/70 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,.08)', backdropFilter: 'blur(8px)' }}>
        {muted
          ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" /></svg>
          : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5 6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" /></svg>}
      </button>

      {/* INTRO */}
      {phase === 'intro' && (
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
          {INTRO_LINES.map((l, i) => (
            <p key={i} className="bd-in font-heading text-white leading-tight" style={{ fontSize: i === INTRO_LINES.length - 1 ? 'clamp(1.6rem,5vw,2.6rem)' : 'clamp(1.3rem,4vw,2rem)', animationDelay: `${0.3 + i * 0.7}s`, marginBottom: '.4rem', opacity: 0 }}>{l}</p>
          ))}
          <button onClick={() => { audio().resume(); setPhase('game') }} className="bd-in mt-8 rounded-full px-7 py-3.5 text-[15px] font-semibold transition-transform hover:scale-105 active:scale-95" style={{ animationDelay: `${0.3 + INTRO_LINES.length * 0.7 + 0.3}s`, opacity: 0, background: '#e8654f', color: '#fff', boxShadow: '0 10px 30px -8px rgba(232,101,79,.6)' }}>
            Load the cannon 🍅
          </button>
          <p className="bd-in text-white/35 text-[12px] mt-6" style={{ animationDelay: `${0.3 + INTRO_LINES.length * 0.7 + 0.6}s`, opacity: 0 }}>built this for you, after a long day.</p>
        </div>
      )}

      {/* GAME */}
      {phase === 'game' && (
        <div ref={arenaRef}
          onPointerMove={(e) => aimAt(e.clientX, e.clientY)}
          onPointerDown={(e) => fire(e.clientX, e.clientY)}
          className="relative z-10 h-full w-full overflow-hidden bd-arena">

          {/* HUD */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[min(360px,80vw)] z-20 pointer-events-none">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-white/60 mb-1.5">
              <span>Peace restored</span><span>{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.14)' }}>
              <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#f6c453,#e8654f)' }} />
            </div>
            {shots > 0 && <div className="text-center text-[10px] font-mono text-white/35 mt-1.5">{hits}/{shots} hits · {accuracy}% aim</div>}
          </div>

          {/* villain (moved by the loop) — box is exactly the villain, so the
              hitbox in the game loop lines up with what you see */}
          <div ref={villainRef} className="absolute top-0 left-0 pointer-events-none z-10" style={{ willChange: 'transform' }}>
            <div className="relative" style={{ width: 150, height: 165 }}>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5">
                <div className={`bd-bubble ${bubble.kind === 'reaction' ? 'bd-bubble-hit' : bubble.kind === 'dodge' ? 'bd-bubble-dodge' : ''}`}>{bubble.text}</div>
              </div>
              <div className={flinch ? 'bd-flinch' : ''}><Villain mood={mood} flinch={flinch} defeated={defeated} /></div>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 text-center whitespace-nowrap">
                <div className="text-white/85 font-heading text-[13px] font-semibold tracking-wide">THE BAD DAY</div>
                <div className="text-white/35 text-[9px] font-mono uppercase tracking-[.2em]">certified nuisance</div>
              </div>
            </div>
          </div>

          {/* combo */}
          {combo > 1 && !defeated && (
            <div key={combo} className="bd-combo absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none font-heading font-bold text-white" style={{ top: '16%', fontSize: 'clamp(1.4rem,5vw,2.4rem)' }}>x{combo}!</div>
          )}

          {/* ground + cannon */}
          <div className="absolute bottom-0 left-0 right-0 h-24 z-[15] pointer-events-none" style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,.35))' }} />
          <div className="absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none" style={{ bottom: '10px' }}>
            <div ref={cannonRef} className="bd-cannon" style={{ transformOrigin: '50% 78%' }}>
              <svg viewBox="0 0 60 76" width="54" height="68" aria-hidden="true">
                <rect x="23" y="2" width="14" height="44" rx="7" fill="#6b7a90" stroke="#3d4757" strokeWidth="2.5" />
                <rect x="25.5" y="6" width="9" height="12" rx="4.5" fill="#8b9aae" />
                <ellipse cx="30" cy="56" rx="20" ry="16" fill="#4e5a6d" stroke="#333c4a" strokeWidth="2.5" />
                <circle cx="30" cy="56" r="7" fill="#e8654f" />
              </svg>
            </div>
            <div className="text-center text-[9px] font-mono uppercase tracking-[.18em] text-white/30 mt-0.5">tomato cannon</div>
          </div>

          {showHint && (
            <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-white/50 text-[13px] font-mono animate-pulse text-center">
              aim with your mouse · click to fire 🍅<br /><span className="text-white/30 text-[11px]">(he dodges — lead your shot)</span>
            </div>
          )}
        </div>
      )}

      {/* WIN */}
      {phase === 'win' && (
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
          <div className="bd-stars" aria-hidden="true" />
          <div className="bd-moon text-6xl mb-4" aria-hidden="true">🌙</div>
          <h1 className="bd-in font-heading font-bold text-white leading-none mb-4" style={{ fontSize: 'clamp(2.6rem,10vw,5rem)', animationDelay: '.05s', opacity: 0 }}>You won.</h1>
          <p className="bd-in text-white/80 leading-relaxed max-w-md" style={{ fontSize: 'clamp(1rem,2.6vw,1.25rem)', animationDelay: '.35s', opacity: 0 }}>
            The world’s unfair sometimes. When it is — throw a tomato at it, and take your calm back.
          </p>
          {shots > 0 && <p className="bd-in text-white/30 text-[12px] font-mono mt-3" style={{ animationDelay: '.5s', opacity: 0 }}>{hits} hits · {shots} shots · {accuracy}% aim</p>}
          <p className="bd-in font-heading italic text-white/55 mt-5" style={{ fontSize: 'clamp(1.05rem,2.8vw,1.35rem)', animationDelay: '.7s', opacity: 0 }}>
            Today was hard. Tomorrow’s a clean page.<br />Go rest. 🌙
          </p>
          <div className="bd-in flex items-center gap-3 mt-9" style={{ animationDelay: '1.05s', opacity: 0 }}>
            <button onClick={reset} className="rounded-full px-5 py-2.5 text-[14px] font-semibold transition-transform hover:scale-105 active:scale-95" style={{ background: '#e8654f', color: '#fff' }}>Again 🍅</button>
            <button onClick={onBack} className="rounded-full px-5 py-2.5 text-[14px] font-medium text-white/70 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,.08)' }}>I feel lighter →</button>
          </div>
        </div>
      )}
    </div>
  )
}

const STYLE = `
  .bd-bg { position:absolute; inset:0; z-index:0; pointer-events:none; opacity:.55;
    background: radial-gradient(50% 40% at 20% 15%, rgba(120,150,255,.18), transparent 60%),
                radial-gradient(50% 40% at 85% 20%, rgba(255,140,110,.15), transparent 60%); }
  .bd-arena { cursor: crosshair; touch-action: manipulation; }
  @keyframes bdIn { from{opacity:0; transform:translateY(14px)} to{opacity:1; transform:none} }
  .bd-in { animation: bdIn .7s cubic-bezier(.22,.61,.36,1) forwards; }

  .bd-villain { display:block; filter: drop-shadow(0 12px 22px rgba(0,0,0,.45)); }
  .bd-flinch { animation: bdFlinch .19s ease; }
  @keyframes bdFlinch { 0%{transform:translateX(0)} 30%{transform:translateX(-9px)} 70%{transform:translateX(9px)} 100%{transform:translateX(0)} }

  .bd-bubble { max-width:210px; margin-bottom:8px; padding:6px 12px; border-radius:14px; background:#fff; color:#26314f;
    font-size:13px; font-weight:600; position:relative; white-space:nowrap; box-shadow:0 8px 22px -8px rgba(0,0,0,.5); animation: bdBub .3s ease; }
  .bd-bubble::after { content:''; position:absolute; bottom:-5px; left:50%; transform:translateX(-50%) rotate(45deg); width:11px; height:11px; background:inherit; }
  .bd-bubble-hit { background:#ffe08a; color:#7a4a10; animation: bdPop .3s ease; }
  .bd-bubble-dodge { background:#bfe3ff; color:#134b70; }
  @keyframes bdBub { from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:none} }
  @keyframes bdPop { 0%{transform:scale(.85)} 60%{transform:scale(1.12)} 100%{transform:scale(1)} }

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
    .bd-in { animation:none; opacity:1 !important; }
    .bd-flinch,.bd-shake,.bd-combo,.bd-moon,.bd-stars,.bd-recoil { animation:none; }
  }
`
