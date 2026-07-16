import React, { useState, useEffect, useRef } from 'react'
import { isMatrixOn, setMatrix, onMatrixChange } from '../lib/matrix'

/* Matrix Mode toggle — flips the whole site into green-on-black digital-rain
   mode. Uses the View Transitions API for a circular reveal (same delight as
   the light/dark toggle); falls back to an instant switch. */
export default function MatrixToggle() {
  const btnRef = useRef(null)
  const [on, setOn] = useState(isMatrixOn)

  // Stay in sync if toggled from the other (desktop/mobile) instance.
  useEffect(() => onMatrixChange(setOn), [])

  const handleClick = () => {
    const next = !on

    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMatrix(next); setOn(next)
      return
    }

    const rect = btnRef.current?.getBoundingClientRect()
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

    const transition = document.startViewTransition(() => { setMatrix(next); setOn(next) })
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: 700, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
      )
    }).catch(() => {})
  }

  return (
    <button
      ref={btnRef}
      onClick={handleClick}
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-md transition-colors ${
        on
          ? 'text-[#22ff88] hover:bg-[#22ff88]/10'
          : 'text-[color:var(--color-foreground)] hover:text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/10'
      }`}
      style={on ? { filter: 'drop-shadow(0 0 4px rgba(34,255,136,0.7))' } : undefined}
      aria-pressed={on}
      aria-label={on ? 'Exit Matrix mode' : 'Enter Matrix mode'}
      title={on ? 'Exit the Matrix' : 'Enter the Matrix'}
    >
      {/* Falling-code streams */}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
        strokeLinecap="round" className="w-[18px] h-[18px]">
        <path d="M6 3v7" />
        <path d="M6 13v1.5" opacity="0.55" />
        <path d="M12 3v4" opacity="0.55" />
        <path d="M12 10v9" />
        <path d="M18 3v11" />
        <path d="M18 17v1.5" opacity="0.55" />
      </svg>
    </button>
  )
}
