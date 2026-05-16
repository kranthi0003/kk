import React, { useEffect, useState } from 'react'

// ============================================================
// CURSOR FOLLOWER — soft glow dot that trails the mouse
// Steven.com-style polish
// ============================================================

export default function CursorFollower() {
  const [pos, setPos] = useState({ x: -100, y: -100 })
  const [hovering, setHovering] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only enable on devices with hover (skip touch)
    if (typeof window === 'undefined' || !window.matchMedia('(hover: hover)').matches) return

    setVisible(true)
    let raf
    let target = { x: -100, y: -100 }
    let cur = { x: -100, y: -100 }

    const onMove = (e) => {
      target.x = e.clientX
      target.y = e.clientY
      // Detect interactive elements under cursor
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const hovered = !!el?.closest('a, button, input, textarea, select, [role="button"], canvas')
      setHovering(hovered)
    }

    const tick = () => {
      cur.x += (target.x - cur.x) * 0.18
      cur.y += (target.y - cur.y) * 0.18
      setPos({ x: cur.x, y: cur.y })
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(tick)
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [])

  if (!visible) return null

  return (
    <>
      {/* Outer ring */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: hovering ? 56 : 28,
          height: hovering ? 56 : 28,
          borderRadius: '50%',
          border: '1.5px solid rgba(167, 139, 250, 0.7)',
          background: hovering ? 'rgba(167, 139, 250, 0.08)' : 'transparent',
          pointerEvents: 'none',
          transform: `translate(${pos.x - (hovering ? 28 : 14)}px, ${pos.y - (hovering ? 28 : 14)}px)`,
          transition: 'width 0.25s, height 0.25s, background 0.25s',
          zIndex: 9999,
          mixBlendMode: 'difference',
        }}
      />
      {/* Inner dot */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0, left: 0,
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: '#a78bfa',
          pointerEvents: 'none',
          transform: `translate(${pos.x - 2}px, ${pos.y - 2}px)`,
          zIndex: 9999,
          boxShadow: '0 0 8px rgba(167, 139, 250, 0.8)',
        }}
      />
    </>
  )
}
