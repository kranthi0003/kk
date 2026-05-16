import React, { useState, useEffect, useRef } from 'react'

/* Provisionr-style theme toggle.
   - Uses the View Transitions API for a circular reveal animation
   - Falls back to a regular toggle on browsers without support */
export default function ThemeToggle({ onRapidClick }) {
  const btnRef = useRef(null)
  const clickTimesRef = useRef([])

  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme')
      if (stored) return stored === 'dark'
      return true
    }
    return true
  })

  // Keep <html class="dark"> in sync (without animation — that's handled in click handler)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const handleClick = () => {
    const now = Date.now()
    clickTimesRef.current = [...clickTimesRef.current.filter(t => now - t < 2000), now]
    if (clickTimesRef.current.length >= 5) {
      clickTimesRef.current = []
      onRapidClick?.()
    }

    const next = !dark

    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDark(next)
      return
    }

    const rect = btnRef.current?.getBoundingClientRect()
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    const transition = document.startViewTransition(() => {
      document.documentElement.classList.toggle('dark', next)
      setDark(next)
    })

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 650,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)'
        }
      )
    }).catch(() => {})
  }

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      className="pr-toggle relative inline-flex items-center justify-center w-9 h-9 rounded-md text-[color:var(--color-foreground)] hover:text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/10 transition-colors"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Crescent moon (visible in dark) */}
      <svg
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round"
        className={`absolute inset-0 m-auto w-[18px] h-[18px] transition-all duration-300 ease-out ${dark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
      {/* Sun (visible in light) */}
      <svg
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round"
        className={`absolute inset-0 m-auto w-[18px] h-[18px] transition-all duration-300 ease-out ${dark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    </button>
  )
}
