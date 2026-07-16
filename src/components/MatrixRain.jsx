import { useEffect, useRef, useState } from 'react'
import { isMatrixOn, onMatrixChange } from '../lib/matrix'

// The famous "digital rain". Mounted once, globally (in main.jsx), so it
// persists across every route. Only paints while Matrix Mode is on. Sits at
// z-index -2: above the black-green base backdrop, behind all page content.
export default function MatrixRain() {
  const [on, setOn] = useState(isMatrixOn)
  const canvasRef = useRef(null)

  // Follow the global toggle.
  useEffect(() => onMatrixChange(setOn), [])

  useEffect(() => {
    if (!on) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Half-width katakana (the real Matrix glyphs) + latin + digits.
    const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789:.=*+<>ABCDEFZ'
    const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0]

    const FONT = 16
    let width = 0, height = 0, cols = 0
    let drops = []          // y-position (in rows) per column
    let speeds = []         // fall speed per column
    let raf = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    function setup() {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      cols = Math.ceil(width / FONT)
      drops = Array.from({ length: cols }, () => Math.random() * -50)
      speeds = Array.from({ length: cols }, () => 0.4 + Math.random() * 0.85)
      // Start from a clean black so the first frames aren't a grey wash.
      ctx.fillStyle = '#050806'
      ctx.fillRect(0, 0, width, height)
    }

    function draw() {
      // Translucent black fade → leaves fading trails behind each drop.
      ctx.fillStyle = 'rgba(5, 8, 6, 0.09)'
      ctx.fillRect(0, 0, width, height)
      ctx.font = `${FONT}px 'JetBrains Mono', ui-monospace, monospace`
      ctx.textBaseline = 'top'

      for (let i = 0; i < cols; i++) {
        const x = i * FONT
        const y = drops[i] * FONT
        const ch = pick()
        if (y > 0) {
          // Bright, near-white leading glyph; softer phosphor green tail.
          if (Math.random() > 0.975) {
            ctx.fillStyle = 'rgba(198, 255, 214, 0.95)'
          } else {
            const g = 150 + ((Math.random() * 90) | 0)
            ctx.fillStyle = `rgba(0, ${g}, 70, 0.85)`
          }
          ctx.fillText(ch, x, y)
        }
        drops[i] += speeds[i]
        // Recycle the column once it falls off-screen (staggered).
        if (y > height && Math.random() > 0.965) {
          drops[i] = Math.random() * -20
          speeds[i] = 0.4 + Math.random() * 0.85
        }
      }
    }

    function frame() { draw(); raf = requestAnimationFrame(frame) }

    setup()
    if (reduced) {
      // A few frames for a static, textured field — no perpetual motion.
      for (let k = 0; k < 60; k++) draw()
    } else {
      raf = requestAnimationFrame(frame)
    }

    const onResize = () => { cancelAnimationFrame(raf); raf = 0; setup(); if (!reduced) raf = requestAnimationFrame(frame) }
    const onVis = () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0 }
      else if (!reduced && !raf) raf = requestAnimationFrame(frame)
    }
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [on])

  if (!on) return null
  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true"
        style={{ position: 'fixed', inset: 0, zIndex: -2, pointerEvents: 'none' }} />
      <div className="matrix-scanlines" aria-hidden="true" />
    </>
  )
}
