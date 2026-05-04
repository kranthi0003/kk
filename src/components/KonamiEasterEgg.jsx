import { useState, useEffect, useCallback, useRef } from 'react'

export default function MatrixEasterEgg({ triggerCount }) {
  const canvasRef = useRef(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (triggerCount >= 5 && !active) setActive(true)
  }, [triggerCount, active])

  const startMatrix = useCallback((canvas) => {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン01'
    const fontSize = 14
    const cols = Math.floor(canvas.width / fontSize)
    const drops = Array(cols).fill(1)

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#0f0'
      ctx.font = `${fontSize}px JetBrains Mono, monospace`

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillStyle = Math.random() > 0.98 ? '#fff' : `hsl(120, 100%, ${30 + Math.random() * 40}%)`
        ctx.fillText(char, i * fontSize, drops[i] * fontSize)
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
    }

    const interval = setInterval(draw, 40)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!active) return
    const cleanup = startMatrix(canvasRef.current)
    const timer = setTimeout(() => {
      setActive(false)
    }, 5000)
    return () => { cleanup?.(); clearTimeout(timer) }
  }, [active, startMatrix])

  if (!active) return null

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="font-mono text-green-400 text-lg sm:text-2xl tracking-widest animate-pulse drop-shadow-[0_0_20px_rgba(0,255,0,0.5)]">
          you broke the matrix
        </p>
      </div>
    </div>
  )
}
