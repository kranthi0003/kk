import React, { useEffect, useState } from 'react'
import profile from '../../assets/profile.png'
import ThemeToggle from './ThemeToggle'

// ============================================================
// HERO V2 — steven.com-style single hero with central rotating
// ring + sub-route navigation. No scroll. Each ring slice routes.
// ============================================================

const RING_ITEMS = [
  { id: 'workspace',  label: 'WORKSPACE',  angle: 0,    href: '#/workspace' },
  { id: 'projects',   label: 'PROJECTS',   angle: 51,   href: '#/projects' },
  { id: 'experience', label: 'EXPERIENCE', angle: 102,  href: '#/experience' },
  { id: 'travel',     label: 'TRAVEL',     angle: 153,  href: '#/travel' },
  { id: 'connect',    label: 'CONNECT',    angle: 204,  href: '#/connect' },
  { id: 'tech',       label: 'TECH STACK', angle: 255,  href: '#/tech' },
  { id: 'guestbook',  label: 'GUESTBOOK',  angle: 306,  href: '#/guestbook' },
]

export default function HeroV2({ onResumeClick }) {
  const [time, setTime] = useState(() => fmt(new Date()))
  const [hovered, setHovered] = useState(null)
  const [angle, setAngle] = useState(0)

  useEffect(() => {
    document.body.classList.add('is-hero')
    return () => document.body.classList.remove('is-hero')
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTime(fmt(new Date())), 1000 * 30)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    let raf
    const tick = () => {
      setAngle((a) => (a + 0.05) % 360)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const nav = (href) => {
    if (href.startsWith('#/')) {
      window.location.hash = href.slice(1)
      window.location.reload()
    }
  }

  return (
    <section id="home" className="relative h-screen w-full overflow-hidden flex flex-col"
      style={{ background: '#0a0612' }}>

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-2 font-mono text-[12px] tracking-widest text-white/90">
          <span>KRANTHI</span>
          <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
          <span>COM</span>
        </div>
        <div className="font-mono text-[12px] tracking-widest text-white/60">
          ( HYD )&nbsp;&nbsp;{time}
        </div>
        <button
          className="font-mono text-[12px] tracking-widest text-white/90 hover:text-white transition-colors"
          onClick={() => document.querySelector('[data-chatbot-btn]')?.click()}
        >
          MENU
        </button>
      </div>

      {/* Central ring system */}
      <div className="flex-1 flex items-center justify-center relative px-6">
        <div className="relative" style={{ width: 'min(62vmin, 560px)', height: 'min(62vmin, 560px)' }}>

          {/* Outer ring track */}
          <svg viewBox="-200 -200 400 400" className="absolute inset-0 w-full h-full">
            <defs>
              <radialGradient id="ring-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#1a1330" />
                <stop offset="60%" stopColor="#0e0820" />
                <stop offset="100%" stopColor="#050208" />
              </radialGradient>
            </defs>

            {/* Outer dark gradient disc */}
            <circle cx="0" cy="0" r="200" fill="url(#ring-grad)" />

            {/* Concentric rings — dial look */}
            <circle cx="0" cy="0" r="195" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <circle cx="0" cy="0" r="165" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.6" />
            <circle cx="0" cy="0" r="110" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
            <circle cx="0" cy="0" r="80"  fill="none" stroke="rgba(167,139,250,0.18)" strokeWidth="1" />

            {/* Outer ring labels — each tangent to circle, never upside down */}
            <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: 'center', transformBox: 'fill-box' }}>
              {RING_ITEMS.map((it) => {
                // Position at angle; rotate text along tangent (perpendicular to radius)
                // To keep text upright on the bottom half, flip it 180°
                const a = it.angle - 90 // -90 so 0 = top
                const onBottomHalf = a > 0 && a < 180
                const textRotation = onBottomHalf ? a + 90 + 180 : a + 90
                return (
                  <text
                    key={it.id}
                    fontFamily="Orbitron, monospace"
                    fontSize="11"
                    fontWeight="700"
                    letterSpacing="3"
                    fill={hovered === it.id ? '#fff' : 'rgba(255,255,255,0.75)'}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${a}) translate(0 -180) rotate(${onBottomHalf ? 180 : 0})`}
                  >
                    {it.label}
                  </text>
                )
              })}
            </g>

            {/* Mid track ticks rotating opposite */}
            <g style={{ transform: `rotate(${-angle * 1.5}deg)`, transformOrigin: 'center', transformBox: 'fill-box' }}>
              {Array.from({ length: 60 }).map((_, i) => {
                const a = (i / 60) * Math.PI * 2
                const inner = 140, outer = 155
                return (
                  <line key={i}
                    x1={Math.cos(a) * inner} y1={Math.sin(a) * inner}
                    x2={Math.cos(a) * outer} y2={Math.sin(a) * outer}
                    stroke={i % 5 === 0 ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.15)'}
                    strokeWidth={i % 5 === 0 ? 1 : 0.5}
                  />
                )
              })}
            </g>

            {/* Subtle indicator marks */}
            <g opacity="0.5">
              <path d="M 0 -175 L -4 -168 L 4 -168 Z" fill="rgba(255,255,255,0.4)" />
              <path d="M 0 175 L -4 168 L 4 168 Z" fill="rgba(255,255,255,0.4)" />
            </g>
          </svg>

          {/* Clickable hotspots overlay — positioned at each ring slot */}
          {RING_ITEMS.map((it) => {
            // Position around ring (initial angle accounts for ring rotation)
            const liveAngle = (it.angle + angle) % 360
            const rad = (liveAngle - 90) * Math.PI / 180
            const r = 50 // % from center
            const x = 50 + Math.cos(rad) * r
            const y = 50 + Math.sin(rad) * r
            return (
              <button
                key={it.id}
                onMouseEnter={() => setHovered(it.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => nav(it.href)}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full hover:bg-white/5 transition-colors"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                }}
                title={it.label}
              />
            )
          })}

          {/* Center profile orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden"
              style={{
                boxShadow: '0 0 40px -8px rgba(167, 139, 250, 0.6), inset 0 0 0 3px rgba(255,255,255,0.1)',
              }}>
              <img src={profile} alt="Kranthi" className="w-full h-full object-cover" />
              {/* Subtle glass overlay */}
              <div className="absolute inset-0 rounded-full"
                style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15), transparent 60%)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom-left: tagline + 'About Us' style link */}
      <div className="absolute bottom-8 left-6 sm:left-10 max-w-sm z-20">
        <h1 className="font-heading text-[26px] sm:text-[34px] leading-[1.05] font-bold tracking-tight text-white uppercase">
          The cloud engineer<br />building at GitHub.
        </h1>
        <button
          onClick={onResumeClick}
          className="mt-5 inline-flex items-center gap-2 group"
        >
          <span className="font-mono text-[11px] tracking-widest text-white/70 group-hover:text-white transition-colors">
            About me
          </span>
          <span className="w-7 h-7 rounded-full border border-white/30 flex items-center justify-center group-hover:border-white/70 group-hover:bg-white/5 transition-all">
            <svg className="w-3 h-3 text-white/70 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button>
      </div>

      {/* Hover hint — top right under MENU */}
      <div className="absolute top-16 right-6 sm:right-10 z-20 pointer-events-none">
        <p className="font-mono text-[10px] tracking-widest text-white/40 text-right transition-opacity"
          style={{ opacity: hovered ? 1 : 0.5 }}>
          {hovered ? `→ ${RING_ITEMS.find(i => i.id === hovered)?.label}` : 'HOVER THE DIAL'}
        </p>
      </div>

      {/* Bottom-right: theme toggle */}
      <div className="absolute bottom-8 right-6 sm:right-10 z-20">
        <ThemeToggle />
      </div>
    </section>
  )
}

function fmt(d) {
  const ist = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  return ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}
