import React, { useEffect, useRef, useState } from 'react'

export default function Heartbeat() {
  const canvasRef = useRef()
  const pointsRef = useRef([])
  const [stats, setStats] = useState({ latency: null, status: 'checking' })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId
    let beatPhase = 0

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2
      canvas.height = canvas.offsetHeight * 2
      ctx.scale(2, 2)
    }
    resize()
    window.addEventListener('resize', resize)

    // Ping site every 3s
    const ping = async () => {
      const start = performance.now()
      try {
        await fetch('https://kranthikiran.com', { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
        const latency = Math.round(performance.now() - start)
        setStats({ latency, status: 'alive' })
        // Add a heartbeat spike based on latency
        addBeat(latency)
      } catch {
        setStats(s => ({ ...s, status: 'down' }))
      }
    }
    ping()
    const pingInterval = setInterval(ping, 3000)

    const addBeat = (latency) => {
      // Normalize latency to spike height (faster = taller spike)
      const spike = Math.max(0.3, Math.min(1, 1 - (latency / 500)))
      beatPhase = spike
    }

    // Animation loop
    const W = () => canvas.offsetWidth
    const H = () => canvas.offsetHeight
    const points = pointsRef.current

    const draw = () => {
      const w = W()
      const h = H()
      ctx.clearRect(0, 0, w, h)

      // Add new point
      const midY = h / 2
      let y = midY

      // ECG-style waveform
      if (beatPhase > 0) {
        // P wave
        if (beatPhase > 0.8) y = midY - 8
        // QRS complex (the big spike)
        else if (beatPhase > 0.6) y = midY - (h * 0.35 * beatPhase)
        else if (beatPhase > 0.5) y = midY + (h * 0.15)
        // T wave
        else if (beatPhase > 0.3) y = midY - 6
        beatPhase -= 0.02
        if (beatPhase < 0) beatPhase = 0
      }

      points.push(y)
      if (points.length > w / 1.5) points.shift()

      // Draw line
      ctx.beginPath()
      ctx.strokeStyle = stats.status === 'alive' ? '#10b981' : '#ef4444'
      ctx.lineWidth = 1.5
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      // Glow
      ctx.shadowColor = stats.status === 'alive' ? '#10b981' : '#ef4444'
      ctx.shadowBlur = 6

      for (let i = 0; i < points.length; i++) {
        const x = (i / points.length) * w
        if (i === 0) ctx.moveTo(x, points[i])
        else ctx.lineTo(x, points[i])
      }
      ctx.stroke()
      ctx.shadowBlur = 0

      // Leading dot
      if (points.length > 0) {
        const lastX = w
        const lastY = points[points.length - 1]
        ctx.beginPath()
        ctx.arc(lastX, lastY, 3, 0, Math.PI * 2)
        ctx.fillStyle = stats.status === 'alive' ? '#10b981' : '#ef4444'
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      clearInterval(pingInterval)
      window.removeEventListener('resize', resize)
    }
  }, [stats.status])

  return (
    <div className="w-full relative">
      <canvas
        ref={canvasRef}
        className="w-full h-12 opacity-60"
      />
      <div className="absolute top-0 right-0 flex items-center gap-2 px-2 py-1">
        <span className={`text-[9px] font-mono ${stats.status === 'alive' ? 'text-green-500' : 'text-red-500'}`}>
          {stats.latency ? `${stats.latency}ms` : '···'}
        </span>
      </div>
    </div>
  )
}
