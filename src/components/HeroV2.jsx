import React, { useEffect, useState } from 'react'
import MiniThemeToggle from './MiniThemeToggle'
import CenterSphere from './CenterSphere'

// ============================================================
// HERO V2 — steven.com-style single hero with central rotating
// ring + sub-route navigation. No scroll. Each ring slice routes.
// ============================================================

// All extras live inside the 4 sub-pages now (Workspace/Tech inside Work,
// Travel inside Experience, Guestbook inside Connect, Resume inside About).

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
