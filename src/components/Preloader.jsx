import React, { useEffect, useState } from 'react'

// ============================================================
// PRELOADER — steven.com-style staged intro animation
// Stages: 1) name draws in 2) circle expands 3) reveal site
// Runs once per session (sessionStorage)
// ============================================================

export default function Preloader({ onDone }) {
  const [stage, setStage] = useState(0) // 0 idle, 1 name, 2 circle expand, 3 done

  useEffect(() => {
    // Skip preloader if already shown this session
    if (sessionStorage.getItem('intro_shown')) {
      setStage(3)
      onDone?.()
      return
    }
    sessionStorage.setItem('intro_shown', '1')

    const t1 = setTimeout(() => setStage(1), 200)   // start name draw
    const t2 = setTimeout(() => setStage(2), 1600)  // circle expand
    const t3 = setTimeout(() => { setStage(3); onDone?.() }, 2600)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  if (stage === 3) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
      style={{
        background: '#0a0612',
        animation: stage === 2 ? 'preloader-out 1s cubic-bezier(0.7, 0, 0.3, 1) forwards' : undefined,
      }}
    >
      {/* Circle that expands at the end */}
      <div
        className="absolute"
        style={{
          width: '80vmax', height: '80vmax', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.4) 0%, transparent 60%)',
          transform: stage === 2 ? 'scale(3)' : 'scale(0)',
          opacity: stage === 2 ? 1 : 0,
          transition: 'transform 1s cubic-bezier(0.7, 0, 0.3, 1), opacity 0.6s',
        }}
      />

      {/* Logo + name in center */}
      <div className="relative flex flex-col items-center gap-5">
        {/* KK Logo — gradient violet→magenta square */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center font-heading font-bold text-2xl text-white"
          style={{
            background: 'linear-gradient(135deg, oklch(60% 0.22 290), oklch(60% 0.25 320))',
            boxShadow: '0 8px 32px -4px oklch(60% 0.22 290), inset 0 1px 0 rgba(255,255,255,0.2)',
            transform: stage >= 1 ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(-90deg)',
            opacity: stage >= 1 ? 1 : 0,
            transition: 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s',
          }}
        >
          KK
        </div>

        {/* Name — letters fade in staggered */}
        <div className="overflow-hidden">
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold tracking-tight"
            style={{ color: 'white' }}>
            {'Kranthi Kiran'.split('').map((c, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  whiteSpace: c === ' ' ? 'pre' : 'normal',
                  transform: stage >= 1 ? 'translateY(0)' : 'translateY(110%)',
                  opacity: stage >= 1 ? 1 : 0,
                  transition: `transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) ${0.25 + i * 0.03}s, opacity 0.5s ${0.25 + i * 0.03}s`,
                }}
              >
                {c}
              </span>
            ))}
          </h1>
        </div>

        {/* Subtitle */}
        <p
          className="text-[11px] font-mono uppercase tracking-[0.3em] text-white/60"
          style={{
            transform: stage >= 1 ? 'translateY(0)' : 'translateY(10px)',
            opacity: stage >= 1 ? 1 : 0,
            transition: 'transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) 0.8s, opacity 0.5s 0.8s',
          }}
        >
          Cloud Engineer · Builder
        </p>
      </div>

      <style>{`
        @keyframes preloader-out {
          to { opacity: 0; transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}
