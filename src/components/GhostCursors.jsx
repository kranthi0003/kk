import React, { useEffect, useRef, useState } from 'react'
import { onCursor, sendCursor, onPresenceSync, getPresenceState, getVisitorId } from './VisitorTracker'

// Broadcast cadence. 10Hz is plenty once the receiving end interpolates —
// pushing 60Hz down the wire would burn through the realtime quota for a
// difference nobody can see.
const SEND_MS = 100
// A ghost fades out if we haven't heard from it in this long. Covers the case
// where someone closes the tab without a clean presence leave.
const STALE_MS = 8000
// Ignore sub-pixel jitter from trackpads.
const MIN_MOVE_PX = 3
// How fast a ghost catches up to its last known position, per frame.
const EASE = 0.18
// Never render more than this many ghosts, so a busy moment stays readable.
const MAX_GHOSTS = 6
// How far from the viewport edge an off-screen ghost parks itself.
const EDGE_PAD = 28

// Stable colour per visitor, derived from the id so both ends agree without
// having to negotiate anything.
function hueFor(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h % 360
}

function labelFor(id) {
  const entry = getPresenceState()[id]?.[0]
  if (!entry) return null
  const city = entry.city && entry.city !== '—' ? entry.city : null
  const country = entry.country && entry.country !== '—' ? entry.country : null
  return city || country || null
}

export default function GhostCursors() {
  const layerRef = useRef(null)
  const ghosts = useRef(new Map())
  const rafRef = useRef(null)
  const othersRef = useRef(0)
  const docHeightRef = useRef(1)
  const [enabled, setEnabled] = useState(() => localStorage.getItem('ghosts_off') !== '1')

  useEffect(() => {
    if (!enabled) return

    const layer = layerRef.current
    if (!layer) return

    const measure = () => {
      docHeightRef.current = Math.max(document.documentElement.scrollHeight, 1)
    }
    measure()

    // ---- receiving ----------------------------------------------------
    const spawn = (id) => {
      const el = document.createElement('div')
      el.style.cssText = 'position:absolute;top:0;left:0;will-change:transform;transition:opacity .3s'
      el.style.opacity = '0'
      const h = hueFor(id)
      const arrow = document.createElement('div')
      arrow.innerHTML =
        `<svg width="18" height="22" viewBox="0 0 18 22" fill="none" style="display:block;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))">` +
        `<path d="M1 1l14.5 8.6-6.4 1.3-2.7 6.1L1 1z" fill="hsl(${h} 85% 62%)" stroke="rgba(0,0,0,.35)" stroke-width="1" stroke-linejoin="round"/>` +
        `</svg>`
      const pill = document.createElement('div')
      pill.style.cssText =
        `margin:3px 0 0 12px;padding:2px 7px;border-radius:999px;font:500 10px/1.4 ui-monospace,monospace;` +
        `white-space:nowrap;color:#fff;background:hsl(${h} 70% 40% / .92);backdrop-filter:blur(4px)`
      el.appendChild(arrow)
      el.appendChild(pill)
      layer.appendChild(el)
      const ghost = {
        el, arrow, pill,
        x: 0.5, y: 0.5, tx: 0.5, ty: 0.5,
        last: Date.now(),
        seeded: false,
        label: null,
        edge: null,
      }
      ghosts.current.set(id, ghost)
      return ghost
    }

    const offCursor = onCursor((p) => {
      if (typeof p.x !== 'number' || typeof p.y !== 'number') return
      let g = ghosts.current.get(p.id)
      if (!g) {
        if (ghosts.current.size >= MAX_GHOSTS) return
        g = spawn(p.id)
      }
      g.tx = p.x
      g.ty = p.y
      g.last = Date.now()
      // Jump to the first known position instead of sliding in from the middle.
      if (!g.seeded) { g.x = p.x; g.y = p.y; g.seeded = true }
      const label = labelFor(p.id)
      if (label && label !== g.label) {
        g.label = label
        g.pill.textContent = label
      }
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick)
    })

    function tick() {
      const now = Date.now()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const docH = docHeightRef.current
      const scrollY = window.scrollY

      for (const [id, g] of ghosts.current) {
        if (now - g.last > STALE_MS) {
          g.el.remove()
          ghosts.current.delete(id)
          continue
        }
        g.x += (g.tx - g.x) * EASE
        g.y += (g.ty - g.y) * EASE

        // Keep the label from spilling off the right edge.
        const px = Math.min(g.x * vw, vw - 120)
        // y is a fraction of the whole document, so it survives different
        // scroll positions. It is only approximate across breakpoints, where
        // the page is a different height — close enough to land in the same
        // section, which is the point.
        const py = g.y * docH - scrollY

        // This page is ~9700px tall against a ~720px viewport, so two people
        // are rarely looking at the same slice of it. Rather than vanish —
        // which reads as broken — an off-screen ghost pins to the nearest
        // edge as a quiet "someone is reading further down".
        let edge = null
        let drawY = py
        if (py < EDGE_PAD) { edge = 'up'; drawY = EDGE_PAD }
        else if (py > vh - EDGE_PAD) { edge = 'down'; drawY = vh - EDGE_PAD }

        if (edge !== g.edge) {
          g.edge = edge
          g.arrow.style.display = edge ? 'none' : 'block'
          g.pill.style.margin = edge ? '0' : '3px 0 0 12px'
          g.el.style.opacity = edge ? '0.45' : '1'
        }
        if (edge && g.label) {
          const mark = edge === 'up' ? '↑ ' : '↓ '
          if (g.pill.textContent !== mark + g.label) g.pill.textContent = mark + g.label
        } else if (!edge && g.label && g.pill.textContent !== g.label) {
          g.pill.textContent = g.label
        }
        if (g.el.style.opacity === '0') g.el.style.opacity = edge ? '0.45' : '1'
        g.el.style.transform = `translate3d(${px}px, ${drawY}px, 0)`
      }

      if (ghosts.current.size > 0) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
      }
    }

    // ---- sending ------------------------------------------------------
    // Touch devices have no pointer to share, but they can still watch.
    const canSend = !window.matchMedia('(pointer: coarse)').matches
    let lastSent = 0
    let lastX = -999
    let lastY = -999

    const onMove = (e) => {
      // The single most important cost control: if nobody else is here,
      // say nothing at all. Most of the time this site has one visitor.
      if (othersRef.current < 1) return
      if (document.hidden) return
      const now = Date.now()
      if (now - lastSent < SEND_MS) return
      if (Math.abs(e.clientX - lastX) < MIN_MOVE_PX && Math.abs(e.clientY - lastY) < MIN_MOVE_PX) return
      lastSent = now
      lastX = e.clientX
      lastY = e.clientY
      sendCursor({
        id: getVisitorId(),
        x: +(e.clientX / window.innerWidth).toFixed(4),
        y: +((window.scrollY + e.clientY) / docHeightRef.current).toFixed(4),
      })
    }

    const syncOthers = () => {
      othersRef.current = Math.max(0, Object.keys(getPresenceState()).length - 1)
      measure()
    }
    const offPresence = onPresenceSync(syncOthers)
    syncOthers()

    // Browsers pause requestAnimationFrame on a hidden tab, so while you are
    // away nothing ticks — which also means departed ghosts never get reaped
    // and could hold the MAX_GHOSTS slots. Sweep them on the way back in.
    const onVisibility = () => {
      if (document.hidden) return
      const now = Date.now()
      for (const [id, g] of ghosts.current) {
        if (now - g.last > STALE_MS) {
          g.el.remove()
          ghosts.current.delete(id)
        }
      }
      measure()
      if (ghosts.current.size > 0 && !rafRef.current) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    if (canSend) window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('resize', measure)
    const measureTimer = setInterval(measure, 5000)

    return () => {
      offCursor()
      offPresence()
      document.removeEventListener('visibilitychange', onVisibility)
      if (canSend) window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', measure)
      clearInterval(measureTimer)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      ghosts.current.forEach(g => g.el.remove())
      ghosts.current.clear()
    }
  }, [enabled])

  useEffect(() => {
    const onToggle = () => {
      setEnabled(prev => {
        const next = !prev
        localStorage.setItem('ghosts_off', next ? '0' : '1')
        return next
      })
    }
    window.addEventListener('toggle-ghosts', onToggle)
    return () => window.removeEventListener('toggle-ghosts', onToggle)
  }, [])

  if (!enabled) return null

  return <div ref={layerRef} className="fixed inset-0 pointer-events-none z-[60]" aria-hidden="true" />
}
