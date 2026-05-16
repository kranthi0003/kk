import React, { useEffect, useState, Suspense, lazy } from 'react'
import MiniThemeToggle from './MiniThemeToggle'

const CenterSphere = lazy(() => import('./CenterSphere'))

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

      {/* Central ring system — 3D WebGL sphere with HTML labels around */}
      <div className="flex-1 flex items-center justify-center relative px-6">
        <div className="relative" style={{ width: 'min(72vmin, 640px)', height: 'min(72vmin, 640px)' }}>

          {/* 3D Sphere takes full container */}
          <Suspense fallback={null}>
            <CenterSphere />
          </Suspense>

          {/* HTML labels positioned around the sphere — outside the canvas */}
          {RING_ITEMS.map((it) => {
            const liveAngle = (it.angle + angle) % 360
            const rad = (liveAngle - 90) * Math.PI / 180
            const r = 50 // % from center → outside the lens
            const x = 50 + Math.cos(rad) * r
            const y = 50 + Math.sin(rad) * r
            return (
              <button
                key={it.id}
                onMouseEnter={() => setHovered(it.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => nav(it.href)}
                className="absolute -translate-x-1/2 -translate-y-1/2 font-heading font-bold text-[10px] sm:text-[11px] tracking-[3px] transition-all whitespace-nowrap px-3 py-1.5 rounded-full"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  color: hovered === it.id ? '#fff' : 'rgba(255,255,255,0.85)',
                  background: hovered === it.id ? 'rgba(167,139,250,0.18)' : 'transparent',
                  boxShadow: hovered === it.id ? 'inset 0 0 0 1px rgba(167,139,250,0.55), 0 0 24px -8px rgba(167,139,250,0.7)' : 'none',
                  textShadow: '0 1px 8px rgba(0,0,0,0.8)',
                  transform: `translate(-50%, -50%)`,
                }}
                title={it.label}
              >
                {it.label}
              </button>
            )
          })}
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

      {/* Bottom-right: theme toggle (steven.com slide-pill) */}
      <div className="absolute bottom-8 right-6 sm:right-10 z-20">
        <MiniThemeToggle />
      </div>
    </section>
  )
}

function fmt(d) {
  const ist = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  return ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}
