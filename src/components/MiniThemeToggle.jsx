import React, { useState, useEffect, useRef } from 'react'

// ============================================================
// MiniThemeToggle — steven.com-style slide-pill toggle
// Dark dot slides left/right inside a horizontal pill
// ============================================================

export default function MiniThemeToggle() {
  const btnRef = useRef(null)
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return true
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const handleClick = () => {
    const next = !dark
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDark(next)
      return
    }
    const rect = btnRef.current?.getBoundingClientRect()
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
    const maxR = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    document.documentElement.style.setProperty('--reveal-x', `${x}px`)
    document.documentElement.style.setProperty('--reveal-y', `${y}px`)
    document.documentElement.style.setProperty('--reveal-r', `${maxR}px`)
    const t = document.startViewTransition(() => setDark(next))
    t.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxR}px at ${x}px ${y}px)`] },
        { duration: 700, easing: 'cubic-bezier(0.7, 0, 0.3, 1)', pseudoElement: '::view-transition-new(root)' }
      )
    })
  }

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative inline-flex items-center w-14 h-7 rounded-full transition-colors"
      style={{
        background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)',
        boxShadow: dark
          ? 'inset 0 0 0 1px rgba(255,255,255,0.15)'
          : 'inset 0 0 0 1px rgba(0,0,0,0.15)',
      }}
    >
      {/* Track icons (sun left, moon right — purely decorative) */}
      <svg className="absolute left-1.5 w-3 h-3 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke={dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.55)'} strokeWidth="2.2">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      <svg className="absolute right-1.5 w-3 h-3 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke={dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.35)'} strokeWidth="2.2">
        <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
      </svg>
      {/* Sliding dot — on the right when dark, left when light */}
      <span
        className="absolute top-0.5 w-6 h-6 rounded-full transition-transform duration-300"
        style={{
          left: 2,
          transform: dark ? 'translateX(28px)' : 'translateX(0px)',
          background: dark ? '#ffffff' : '#1a1326',
          boxShadow: dark
            ? '0 1px 4px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.06)'
            : '0 1px 4px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)',
        }}
      />
    </button>
  )
}
