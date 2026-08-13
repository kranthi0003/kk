import React, { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_CHROMA, DEFAULT_HUE, PRESETS, isDiscoOn, paintTheme, readTheme, resetTheme, saveTheme, setDisco, swatch } from '../lib/theme'
import { setMatrix } from '../lib/matrix'

/* Theme control.
   The sphere shows the current site colour. Hovering it (or clicking, for
   touch) opens a hue wheel — dragging around the ring repaints the entire
   site live, because every colour token in index.css is derived from
   --site-hue. Light/dark lives inside the popover and keeps the original
   View Transitions circular reveal.

   Lightness is fixed per token in CSS, so no choice on this wheel can make
   the site unreadable; the hue only decides *which* colour, never how dark. */

const RING = 132        // wheel diameter
const THICKNESS = 20    // ring thickness
const KNOB_R = (RING - THICKNESS) / 2

// The ring runs clockwise from 12 o'clock, matching conic-gradient's default
// start angle, so the maths and the paint agree.
const hueToXY = (hue) => ({
  x: RING / 2 + KNOB_R * Math.sin((hue * Math.PI) / 180),
  y: RING / 2 - KNOB_R * Math.cos((hue * Math.PI) / 180),
})

const CONIC = Array.from({ length: 13 }, (_, i) => {
  const h = i * 30
  return `oklch(65% 0.19 ${h}) ${h}deg`
}).join(', ')

export default function ThemeToggle({ onRapidClick }) {
  const btnRef = useRef(null)
  const wrapRef = useRef(null)
  const ringRef = useRef(null)
  const clickTimesRef = useRef([])
  const draggingRef = useRef(false)
  const closeTimer = useRef(null)

  const [open, setOpen] = useState(false)
  const [disco, setDiscoState] = useState(isDiscoOn)
  const [{ hue, chroma }, setTheme] = useState(() => readTheme())
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem('theme')
    return stored ? stored === 'dark' : true
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  // Close on outside click or Escape, but never mid-drag.
  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      if (draggingRef.current) return
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current) }, [])

  // The two ThemeToggle instances (desktop + mobile) must agree.
  useEffect(() => {
    const onDisco = (e) => setDiscoState(!!e.detail?.on)
    window.addEventListener('site-disco-change', onDisco)
    return () => window.removeEventListener('site-disco-change', onDisco)
  }, [])

  const toggleDisco = () => {
    const next = !disco
    // Matrix mode pins literal green tokens that outrank the hue, so disco
    // would silently do nothing while it's on. Stand it down.
    if (next) setMatrix(false)
    setDisco(next)
    setDiscoState(next)
  }

  const hoverOpen = () => {
    if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null }
    if (window.matchMedia('(hover: hover)').matches) setOpen(true)
  }
  // A short grace period so the pointer can cross the gap to the popover.
  const hoverClose = () => {
    if (draggingRef.current) return
    if (!window.matchMedia('(hover: hover)').matches) return
    closeTimer.current = setTimeout(() => setOpen(false), 260)
  }

  const toggleDark = () => {
    const next = !dark
    if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDark(next)
      return
    }
    const rect = btnRef.current?.getBoundingClientRect()
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

    const transition = document.startViewTransition(() => {
      document.documentElement.classList.toggle('dark', next)
      setDark(next)
    })
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: 650, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' }
      )
    }).catch(() => {})
  }

  // Kept from the original toggle: five quick clicks is an easter egg.
  // The prop was never actually passed by any caller, so fall back to the
  // same window event the command palette uses.
  const onSphereClick = () => {
    const now = Date.now()
    clickTimesRef.current = [...clickTimesRef.current.filter(t => now - t < 2000), now]
    if (clickTimesRef.current.length >= 5) {
      clickTimesRef.current = []
      if (onRapidClick) onRapidClick()
      else window.dispatchEvent(new Event('trigger-matrix'))
      return
    }
    setOpen(o => !o)
  }

  const hueFromEvent = useCallback((e) => {
    const r = ringRef.current?.getBoundingClientRect()
    if (!r) return null
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    return (Math.round((Math.atan2(dy, dx) * 180) / Math.PI + 90) + 360) % 360
  }, [])

  const startDrag = (e) => {
    e.preventDefault()
    // Touching the wheel means taking manual control back off the disco.
    if (disco) { setDisco(false); setDiscoState(false) }
    draggingRef.current = true
    const h = hueFromEvent(e)
    if (h !== null) { setTheme(t => ({ ...t, hue: h })); paintTheme(h, chroma) }

    const move = (ev) => {
      const nh = hueFromEvent(ev)
      if (nh !== null) { setTheme(t => ({ ...t, hue: nh })); paintTheme(nh, chroma) }
    }
    const up = (ev) => {
      draggingRef.current = false
      const nh = hueFromEvent(ev)
      saveTheme(nh === null ? hue : nh, chroma)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const onVibrancy = (e) => {
    const c = Number(e.target.value)
    setTheme(t => ({ ...t, chroma: c }))
    paintTheme(hue, c)
  }

  const pick = (p) => {
    if (disco) { setDisco(false); setDiscoState(false) }
    setTheme({ hue: p.hue, chroma: p.chroma }); saveTheme(p.hue, p.chroma)
  }
  const reset = () => {
    if (disco) { setDisco(false); setDiscoState(false) }
    setTheme({ hue: DEFAULT_HUE, chroma: DEFAULT_CHROMA }); resetTheme()
  }

  const knob = hueToXY(hue)
  const isDefault = hue === DEFAULT_HUE && chroma === DEFAULT_CHROMA && !disco

  return (
    <div ref={wrapRef} className="relative" onMouseEnter={hoverOpen} onMouseLeave={hoverClose}>
      <button
        ref={btnRef}
        onClick={onSphereClick}
        aria-label="Site colour and appearance"
        aria-expanded={open}
        title="Site colour"
        className="pr-toggle relative inline-flex items-center justify-center w-9 h-9 rounded-md transition-colors"
      >
        {/* The sphere — a live swatch of the current site colour. */}
        <span
          className="block w-[19px] h-[19px] rounded-full transition-transform duration-300"
          style={{
            background: 'radial-gradient(circle at 32% 28%, color-mix(in oklab, var(--color-brand) 55%, white), var(--color-brand) 62%, color-mix(in oklab, var(--color-brand) 72%, black))',
            boxShadow: open
              ? '0 0 0 2px color-mix(in oklab, var(--color-brand) 45%, transparent), 0 2px 8px -2px color-mix(in oklab, var(--color-brand) 70%, transparent)'
              : '0 1px 4px -1px color-mix(in oklab, var(--color-brand) 60%, transparent)',
            transform: open ? 'scale(1.08)' : 'scale(1)',
          }}
        />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 rounded-2xl z-50 animate-fade-in-up p-4"
          style={{
            width: 224,
            background: 'var(--color-card)',
            boxShadow: 'inset 0 0 0 1px var(--color-border), 0 20px 50px -12px rgba(0,0,0,0.6)',
          }}
        >
          {/* Hue wheel */}
          <div className="flex justify-center mb-3">
            <div
              ref={ringRef}
              onPointerDown={startDrag}
              role="slider"
              tabIndex={0}
              aria-label="Site colour hue"
              aria-valuemin={0}
              aria-valuemax={359}
              aria-valuenow={hue}
              onKeyDown={(e) => {
                if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
                e.preventDefault()
                const nh = (hue + (e.key === 'ArrowRight' ? 5 : -5) + 360) % 360
                setTheme(t => ({ ...t, hue: nh }))
                saveTheme(nh, chroma)
              }}
              className="relative cursor-pointer touch-none select-none rounded-full"
              style={{ width: RING, height: RING }}
            >
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(${CONIC})`,
                  WebkitMask: `radial-gradient(circle, transparent ${RING / 2 - THICKNESS}px, #000 ${RING / 2 - THICKNESS + 1}px)`,
                  mask: `radial-gradient(circle, transparent ${RING / 2 - THICKNESS}px, #000 ${RING / 2 - THICKNESS + 1}px)`,
                }}
              />
              {/* Knob */}
              <span
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: knob.x, top: knob.y,
                  width: 16, height: 16, transform: 'translate(-50%, -50%)',
                  background: swatch(hue, chroma, dark),
                  opacity: disco ? 0.3 : 1,
                  boxShadow: '0 0 0 2.5px var(--color-card), 0 0 0 4px color-mix(in oklab, var(--color-foreground) 35%, transparent)',
                }}
              />
              {/* Light/dark switch, centred inside the wheel */}
              <button
                onClick={toggleDark}
                aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={dark ? 'Light mode' : 'Dark mode'}
                className="absolute inset-0 m-auto flex items-center justify-center rounded-full transition-colors hover:bg-muted/50"
                style={{ width: RING - THICKNESS * 2 - 10, height: RING - THICKNESS * 2 - 10 }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-foreground">
                  {dark
                    ? <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    : <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>}
                </svg>
              </button>
            </div>
          </div>

          {/* Vibrancy */}
          <label className="block mb-3">
            <span className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] font-semibold text-muted-foreground mb-1.5">
              Vibrancy
              <span className="tabular-nums font-mono normal-case tracking-normal opacity-70">{chroma.toFixed(2)}x</span>
            </span>
            <input
              type="range" min="0" max="2" step="0.05" value={chroma}
              onChange={onVibrancy}
              onPointerUp={() => saveTheme(hue, chroma)}
              aria-label="Colour vibrancy"
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(90deg, var(--color-muted), ${swatch(hue, 1.6, dark)})`, accentColor: 'var(--color-brand)' }}
            />
          </label>

          {/* Presets */}
          <div className="grid grid-cols-8 gap-1 mb-3">
            {PRESETS.map(p => (
              <button
                key={p.name}
                onClick={() => pick(p)}
                title={p.name}
                aria-label={p.name}
                className="w-[18px] h-[18px] rounded-full transition-transform hover:scale-110"
                style={{
                  background: swatch(p.hue, p.chroma, dark),
                  boxShadow: hue === p.hue
                    ? '0 0 0 2px var(--color-card), 0 0 0 3.5px var(--color-brand)'
                    : 'inset 0 0 0 1px color-mix(in oklab, var(--color-foreground) 18%, transparent)',
                }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground/70 tabular-nums">
              {disco ? 'disco' : `hue ${hue}\u00b0`}
            </span>
            <button
              onClick={reset}
              disabled={isDefault}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-35 disabled:cursor-default"
            >
              Reset
            </button>
          </div>

          {/* YOLO — hands the hue over to a CSS animation until you take it back. */}
          <button
            onClick={toggleDisco}
            aria-pressed={disco}
            title={disco ? 'Stop the disco' : 'Full disco mode'}
            className="mt-3 w-full rounded-xl py-2 text-[11px] font-bold uppercase tracking-[0.22em] transition-transform hover:scale-[1.02] active:scale-[0.99]"
            style={disco ? {
              color: 'oklch(18% 0 0)',
              backgroundImage: 'linear-gradient(90deg, oklch(75% 0.2 0), oklch(78% 0.2 60), oklch(78% 0.2 140), oklch(75% 0.2 220), oklch(72% 0.2 300), oklch(75% 0.2 360))',
            } : {
              color: 'var(--color-foreground)',
              backgroundImage: 'none',
              boxShadow: 'inset 0 0 0 1px var(--color-border)',
            }}
          >
            {disco ? 'Disco on \u00b7 stop' : 'YOLO'}
          </button>
        </div>
      )}
    </div>
  )
}
