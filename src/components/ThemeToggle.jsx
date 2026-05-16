import React, { useState, useEffect } from 'react'

/* Provisionr-style animated sun ⇄ moon toggle.
   Two stacked SVG glyphs — opacity + rotation cross-fade. */
export default function ThemeToggle({ onRapidClick }) {
  const clickTimesRef = React.useRef([])

  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme')
      if (stored) return stored === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const handleClick = () => {
    setDark(d => !d)
    const now = Date.now()
    clickTimesRef.current = [...clickTimesRef.current.filter(t => now - t < 2000), now]
    if (clickTimesRef.current.length >= 5) {
      clickTimesRef.current = []
      onRapidClick?.()
    }
  }

  return (
    <button
      onClick={handleClick}
      className="pr-toggle relative inline-flex items-center justify-center w-9 h-9 rounded-md border border-[color:var(--color-border)] hover:bg-[color:var(--color-accent)]/10 transition-colors overflow-hidden"
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <svg
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        className={`absolute inset-0 m-auto w-[18px] h-[18px] transition-all duration-500 ease-out ${dark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'}`}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      <svg
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
        className={`absolute inset-0 m-auto w-[18px] h-[18px] transition-all duration-500 ease-out ${dark ? 'opacity-0 -rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  )
}
