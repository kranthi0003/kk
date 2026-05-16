import React, { useEffect, useState } from 'react'

// ============================================================
// HeroNav — minimal nav overlay rendered on top of the Workspace
// canvas. Routes to the main sub-pages. Lives only on the root
// route so it doesn't interfere when you're inside a sub-page.
// ============================================================

const LINKS = [
  { label: 'Work',       href: '#/projects' },
  { label: 'Experience', href: '#/experience' },
  { label: 'Connect',    href: '#/connect' },
  { label: 'About',      href: '#/about' },
]

function go(href, e) {
  if (e) e.preventDefault()
  window.location.hash = href.slice(1)
  window.location.reload()
}

function fmtIST(d) {
  const ist = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  return ist.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function HeroNav() {
  const [time, setTime] = useState(() => fmtIST(new Date()))
  useEffect(() => {
    const id = setInterval(() => setTime(fmtIST(new Date())), 1000 * 30)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="fixed top-0 inset-x-0 z-[80] pointer-events-none">
      <div className="flex items-center justify-between px-6 sm:px-10 pt-5 gap-4">
        <a
          href="#/"
          onClick={(e) => go('#/', e)}
          className="pointer-events-auto font-mono text-[12px] tracking-widest text-white/90 hover:text-white transition-colors"
        >
          KRANTHI · COM
        </a>
        <div className="pointer-events-none hidden sm:flex font-mono text-[11px] tracking-widest text-white/55">
          (&nbsp;HYD&nbsp;)&nbsp;&nbsp;{time}
        </div>
        <nav className="pointer-events-auto flex items-center gap-1 px-2 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/10">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => go(l.href, e)}
              className="font-mono text-[11px] tracking-widest uppercase px-3 py-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}

