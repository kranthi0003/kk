import { useEffect, useRef } from 'react'

// Famous equations & identities — written with real Unicode math glyphs so they
// read like a mathematician's margin notes. Kept faint and slow so the layer
// stays "lowkey" behind the calm site.
const EQUATIONS = [
  'e^(iπ) + 1 = 0',
  'a² + b² = c²',
  'E = mc²',
  '∇·E = ρ/ε₀',
  '∇×B = μ₀J + μ₀ε₀ ∂E/∂t',
  'i ℏ ∂ψ/∂t = Ĥψ',
  'Δx · Δp ≥ ℏ/2',
  'ζ(s) = Σ 1/nˢ',
  'Σ 1/n² = π²/6',
  'φ = (1 + √5) / 2',
  'σ² = Σ(xᵢ − μ)² / N',
  'P(A|B) = P(B|A)·P(A) / P(B)',
  'H = −Σ pᵢ log pᵢ',
  'x = (−b ± √(b² − 4ac)) / 2a',
  'lim (1 + 1/n)ⁿ = e',
  '∫ eˣ dx = eˣ + C',
  '∂u/∂t + (u·∇)u = ν∇²u − ∇p/ρ',
  'dS ≥ 0',
  'f(x) = Σ aₙ xⁿ',
  '∮ B·dl = μ₀ I',
  'π ≈ 3.14159…',
  'cos²θ + sin²θ = 1',
]

export default function MathBackdrop() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let eqs = []
    let drops = []
    let raf = 0
    let t = 0

    const isDark = () => document.documentElement.classList.contains('dark')
    const ink = (a) => (isDark() ? `rgba(150,170,212,${a})` : `rgba(38,52,86,${a})`)

    const pick = () => EQUATIONS[(Math.random() * EQUATIONS.length) | 0]

    function spawnEq(seed = false) {
      return {
        text: pick(),
        x: Math.random() * width,
        y: seed ? Math.random() * height : height + 30,
        size: 13 + Math.random() * 13,
        vy: 0.07 + Math.random() * 0.15,            // slow upward drift
        baseAlpha: 0.05 + Math.random() * 0.07,
        phase: Math.random() * Math.PI * 2,
      }
    }

    function spawnDrop(i, total) {
      return {
        x: (i + 0.5) * (width / total) + (Math.random() * 24 - 12),
        y: Math.random() * height,
        speed: 0.25 + Math.random() * 0.45,         // calm fall
        size: 11 + Math.random() * 4,
        digit: ((Math.random() * 10) | 0).toString(),
        alpha: 0.04 + Math.random() * 0.05,
      }
    }

    function setup() {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const eqCount = Math.max(7, Math.min(15, Math.round(width / 120)))
      eqs = Array.from({ length: eqCount }, () => spawnEq(true))

      const colCount = Math.max(4, Math.min(12, Math.round(width / 160)))
      drops = Array.from({ length: colCount }, (_, i) => spawnDrop(i, colCount))
    }

    function draw() {
      ctx.clearRect(0, 0, width, height)

      // Calm digit rain (mono)
      ctx.textBaseline = 'middle'
      for (const d of drops) {
        ctx.font = `${d.size}px 'JetBrains Mono', ui-monospace, monospace`
        ctx.fillStyle = ink(d.alpha)
        ctx.fillText(d.digit, d.x, d.y)
        d.y += d.speed
        if ((t & 31) === 0 && Math.random() < 0.4) d.digit = ((Math.random() * 10) | 0).toString()
        if (d.y > height + 16) {
          d.y = -16
          d.x = Math.random() * width
          d.digit = ((Math.random() * 10) | 0).toString()
        }
      }

      // Drifting equations (italic serif — margin-note feel)
      ctx.textBaseline = 'alphabetic'
      for (const e of eqs) {
        const flicker = 0.72 + 0.28 * Math.sin(t * 0.012 + e.phase)
        ctx.font = `italic ${e.size}px 'Newsreader', Georgia, serif`
        ctx.fillStyle = ink(e.baseAlpha * flicker)
        ctx.fillText(e.text, e.x, e.y)
        e.y -= e.vy
        if (e.y < -30) Object.assign(e, spawnEq(false))
      }
    }

    function frame() {
      t += 1
      draw()
      raf = requestAnimationFrame(frame)
    }

    setup()
    if (reduced) {
      draw() // single static frame, no motion
    } else {
      raf = requestAnimationFrame(frame)
    }

    // Re-render crisply once the web fonts are ready
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (reduced) draw() }).catch(() => {})
    }

    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = 0
      setup()
      if (reduced) draw()
      else raf = requestAnimationFrame(frame)
    }
    const onVis = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf)
        raf = 0
      } else if (!reduced && !raf) {
        raf = requestAnimationFrame(frame)
      }
    }

    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none' }}
    />
  )
}
