import React, { useEffect, useState } from 'react'
import MiniThemeToggle from './MiniThemeToggle'
import CenterSphere from './CenterSphere'

// ============================================================
// HERO V2 — steven.com-style single hero with central rotating
// ring + sub-route navigation. No scroll. Each ring slice routes.
// ============================================================

// Side links — small chip nav for sections not on the rings (Travel/Tech/Guestbook)
const SIDE_LINKS = [
  { id: 'travel',     label: 'TRAVEL',     href: '#/travel' },
  { id: 'tech',       label: 'TECH STACK', href: '#/tech' },
  { id: 'guestbook',  label: 'GUESTBOOK',  href: '#/guestbook' },
]

export default function HeroV2({ onResumeClick }) {
  const [time, setTime] = useState(() => fmt(new Date()))

  useEffect(() => {
    document.body.classList.add('is-hero')
    return () => document.body.classList.remove('is-hero')
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTime(fmt(new Date())), 1000 * 30)
    return () => clearInterval(id)
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

          {/* SVG aperture lens — concentric clickable ring sections */}
          <CenterSphere />
        </div>
      </div>

      {/* Side links — sections that don't fit on the rings */}
      <div className="absolute left-6 sm:left-10 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3">
        {SIDE_LINKS.map((it) => (
          <button
            key={it.id}
            onClick={() => nav(it.href)}
            className="font-mono text-[10px] tracking-[3px] text-white/60 hover:text-white transition-colors text-left group"
          >
            <span className="inline-block w-4 border-t border-white/30 group-hover:border-white/80 mr-2 align-middle transition-colors" />
            {it.label}
          </button>
        ))}
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

      {/* Hint — top right under MENU */}
      <div className="absolute top-16 right-6 sm:right-10 z-20 pointer-events-none">
        <p className="font-mono text-[10px] tracking-widest text-white/40 text-right">
          HOVER A RING · CLICK TO ENTER
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
