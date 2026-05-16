import React, { useEffect, useState } from 'react'

// ============================================================
// SubPage shell — used by all routed sub-pages
// Provides: animated entry, back button, max-width container
// ============================================================

export default function SubPage({ title, eyebrow, children, accent = '#a78bfa' }) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80)
    return () => clearTimeout(t)
  }, [])

  const back = () => {
    window.location.hash = ''
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0612' }}>
      {/* Top bar */}
      <div className="sticky top-0 z-30 backdrop-blur-xl border-b"
        style={{
          background: 'rgba(10, 6, 18, 0.75)',
          borderBottomColor: `color-mix(in oklab, ${accent} 22%, rgba(255,255,255,0.06))`,
        }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-3">
          <button onClick={back} className="flex items-center gap-2.5 text-white/70 hover:text-white transition-colors group">
            <span className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:border-white/60 group-hover:bg-white/5 transition-all">
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </span>
            <span className="font-mono text-[11px] tracking-widest hidden sm:inline">BACK</span>
          </button>
          <div className="flex items-center gap-2 font-mono text-[12px] tracking-widest text-white/90">
            <span>KRANTHI</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
            <span>COM</span>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* Body */}
      <div
        className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-12"
        style={{
          opacity: entered ? 1 : 0,
          transform: entered ? 'translateY(0)' : 'translateY(40px)',
          transition: 'opacity 0.9s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {/* Eyebrow + title */}
        {(title || eyebrow) && (
          <div className="mb-12">
            {eyebrow && (
              <p className="font-mono text-[11px] uppercase tracking-[0.25em] mb-4" style={{ color: accent }}>
                {eyebrow}
              </p>
            )}
            {title && (
              <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white uppercase leading-[1.02]">
                {title}
              </h1>
            )}
          </div>
        )}

        {children}
      </div>

      <div className="border-t border-white/5 py-6 text-center">
        <span className="text-[10px] text-white/30 font-mono tracking-widest">KRANTHIKIRAN.COM · 2026</span>
      </div>
    </div>
  )
}
