import { useState, useEffect, useCallback, useRef } from 'react'

export default function MatrixEasterEgg({ active, onComplete }) {
  const canvasRef = useRef(null)
  const [phase, setPhase] = useState('idle') // idle → rain → reveal
  const intervalRef = useRef(null)

  // Start matrix when activated
  useEffect(() => {
    if (active && phase === 'idle') setPhase('rain')
  }, [active, phase])

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
      ctx.font = `${fontSize}px JetBrains Mono, monospace`

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        ctx.fillStyle = Math.random() > 0.98 ? '#fff' : `hsl(120, 100%, ${30 + Math.random() * 40}%)`
        ctx.fillText(char, i * fontSize, drops[i] * fontSize)
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0
        drops[i]++
      }
    }

    intervalRef.current = setInterval(draw, 40)
  }, [])

  // Rain phase: run for 3s, then show reveal
  useEffect(() => {
    if (phase !== 'rain') return
    startMatrix(canvasRef.current)

    const timer = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setPhase('reveal')
    }, 3000)

    return () => {
      clearTimeout(timer)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [phase, startMatrix])

  const handleClose = () => {
    setPhase('idle')
    onComplete?.()
  }

  if (phase === 'idle') return null

  return (
    <div className="fixed inset-0 z-[100]" onClick={phase === 'reveal' ? handleClose : undefined}>
      {/* Canvas for matrix rain */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* Reveal phase — secret card */}
      {phase === 'reveal' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
             onClick={(e) => e.stopPropagation()}>
          <div className="bg-[#0d1117] border border-green-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-green-500/10 animate-fade-in-up">
            <div className="text-center mb-6">
              <p className="font-mono text-green-400 text-xs tracking-widest uppercase mb-2">access granted</p>
              <h3 className="font-heading text-white text-2xl font-bold mb-1">You found the secret 🔓</h3>
              <p className="text-gray-400 text-sm">Here's my direct line — skip the formalities.</p>
            </div>

            <div className="space-y-3">
              <a href="mailto:kranthi.kiran@outlook.com?subject=Found%20your%20easter%20egg!"
                 className="flex items-center gap-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-xl px-4 py-3 transition-all group">
                <span className="text-xl">📧</span>
                <div>
                  <p className="text-green-400 font-mono text-sm group-hover:text-green-300">kranthi.kiran@outlook.com</p>
                  <p className="text-gray-500 text-xs">Direct email — mention the easter egg!</p>
                </div>
              </a>

              <a href="tel:+919398857319"
                 className="flex items-center gap-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl px-4 py-3 transition-all group">
                <span className="text-xl">📱</span>
                <div>
                  <p className="text-blue-400 font-mono text-sm group-hover:text-blue-300">+91 93988 57319</p>
                  <p className="text-gray-500 text-xs">Call or WhatsApp me directly</p>
                </div>
              </a>

              <a href="https://x.com/kranthikiran03" target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-3 bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/20 rounded-xl px-4 py-3 transition-all group">
                <span className="text-xl">𝕏</span>
                <div>
                  <p className="text-gray-300 font-mono text-sm group-hover:text-white">@kranthikiran03</p>
                  <p className="text-gray-500 text-xs">DM me on X</p>
                </div>
              </a>
            </div>

            <button
              onClick={handleClose}
              className="mt-6 w-full py-2.5 rounded-xl bg-green-500/20 hover:bg-green-500/30 text-green-400 font-mono text-sm border border-green-500/20 transition-all"
            >
              close_connection()
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
