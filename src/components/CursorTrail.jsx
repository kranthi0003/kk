import { useEffect, useRef } from 'react'

// A glowing "comet" cursor trail: a bright sparkle rides the pointer and leaves
// a soft light ribbon that fades behind it. Mounted globally (main.jsx) so it
// works on every route. Desktop only (skips touch / coarse pointers) and fully
// disabled under prefers-reduced-motion. Purely decorative — pointer-events:none
// so it never intercepts clicks. Adapts to Matrix mode (green) automatically.
export default function CursorTrail() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const finePointer = window.matchMedia('(pointer: fine)').matches
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!finePointer || reduced) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let w = 0, h = 0
    const resize = () => {
      w = window.innerWidth; h = window.innerHeight
      canvas.width = Math.floor(w * dpr); canvas.height = Math.floor(h * dpr)
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const DECAY = 0.05        // life lost per frame → ~20-frame tail
    const MAX = 60
    const points = []          // { x, y, life }  (oldest → newest)
    let last = null            // last recorded position (to skip micro-jitter)
    let raf = 0

    const palette = () => document.documentElement.classList.contains('matrix')
      ? { core: '#e4fff0', glow: '80, 255, 150' }   // matrix green
      : { core: '#eaf2ff', glow: '150, 185, 255' }  // moonlight blue

    const onMove = (e) => {
      const x = e.clientX, y = e.clientY
      if (last && Math.hypot(x - last.x, y - last.y) < 2) { last = { x, y }; return }
      last = { x, y }
      points.push({ x, y, life: 1 })
      if (points.length > MAX) points.shift()
    }

    const drawSparkle = (x, y, size, core, glow) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.fillStyle = core
      ctx.shadowBlur = 14
      ctx.shadowColor = `rgba(${glow}, 0.9)`
      ctx.beginPath()
      ctx.moveTo(0, -size)
      ctx.quadraticCurveTo(0, 0, size, 0)
      ctx.quadraticCurveTo(0, 0, 0, size)
      ctx.quadraticCurveTo(0, 0, -size, 0)
      ctx.quadraticCurveTo(0, 0, 0, -size)
      ctx.fill()
      ctx.restore()
    }

    const frame = () => {
      ctx.clearRect(0, 0, w, h)

      // Age + prune.
      for (const p of points) p.life -= DECAY
      while (points.length && points[0].life <= 0) points.shift()

      if (points.length > 1) {
        const { core, glow } = palette()
        ctx.globalCompositeOperation = 'lighter'
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        for (let i = 1; i < points.length; i++) {
          const a = points[i - 1], b = points[i]
          const t = b.life                       // 1 near head → 0 at tail
          ctx.strokeStyle = `rgba(${glow}, ${t * t * 0.55})`
          ctx.lineWidth = 0.5 + t * t * 6
          ctx.shadowBlur = 10 * t
          ctx.shadowColor = `rgba(${glow}, 0.8)`
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
        const head = points[points.length - 1]
        drawSparkle(head.x, head.y, 4.5, core, glow)
        ctx.globalCompositeOperation = 'source-over'
        ctx.shadowBlur = 0
      }
      raf = requestAnimationFrame(frame)
    }

    const onVis = () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; points.length = 0 }
      else if (!raf) raf = requestAnimationFrame(frame)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVis)
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none' }}
    />
  )
}
