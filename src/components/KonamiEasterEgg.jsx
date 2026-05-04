import { useState, useEffect, useCallback } from 'react'

const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']

export default function KonamiEasterEgg() {
  const [input, setInput] = useState([])
  const [activated, setActivated] = useState(false)
  const [particles, setParticles] = useState([])

  const spawnConfetti = useCallback(() => {
    const colors = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff6fff','#00d2ff','#ff9a00','#a855f7']
    const items = Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.8,
      size: Math.random() * 8 + 4,
      drift: (Math.random() - 0.5) * 200,
      rotation: Math.random() * 720,
      duration: Math.random() * 1.5 + 2,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }))
    setParticles(items)
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      if (activated) return
      setInput(prev => {
        const next = [...prev, e.key].slice(-KONAMI.length)
        if (next.length === KONAMI.length && next.every((k, i) => k === KONAMI[i])) {
          setActivated(true)
        }
        return next
      })
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [activated])

  useEffect(() => {
    if (!activated) return
    spawnConfetti()

    // Add retro mode class
    document.documentElement.classList.add('retro-mode')

    const timer = setTimeout(() => {
      setActivated(false)
      setParticles([])
      document.documentElement.classList.remove('retro-mode')
    }, 6000)

    return () => {
      clearTimeout(timer)
      document.documentElement.classList.remove('retro-mode')
    }
  }, [activated, spawnConfetti])

  if (!activated) return null

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Confetti */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
            '--rotation': `${p.rotation}deg`,
          }}
        >
          <div
            style={{
              width: p.size,
              height: p.shape === 'rect' ? p.size * 0.6 : p.size,
              backgroundColor: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
            }}
          />
        </div>
      ))}

      {/* Achievement banner */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 animate-achievement-pop">
        <div className="bg-black/90 backdrop-blur-xl border border-accent/50 rounded-2xl px-8 py-5 text-center shadow-2xl shadow-accent/20">
          <div className="text-3xl mb-1">🎮</div>
          <p className="font-mono text-accent text-sm tracking-widest uppercase mb-1">Achievement Unlocked</p>
          <p className="font-heading text-white text-lg font-bold">You found the secret! 🚀</p>
          <p className="font-mono text-white/50 text-xs mt-2">↑↑↓↓←→←→BA</p>
        </div>
      </div>
    </div>
  )
}
