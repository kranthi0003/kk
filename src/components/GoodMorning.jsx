import React, { useEffect, useState, useRef } from 'react'

// Hidden /#/gm Friday good morning page for Chaitra
// Drag the sun up to wake it. Weekend energy unleashed.
export default function GoodMorning({ onBack }) {
  const [sunY, setSunY] = useState(0)         // 0 = at horizon, 1 = full up
  const [awake, setAwake] = useState(false)   // true once sun reaches top
  const [dragging, setDragging] = useState(false)
  const [emojis, setEmojis] = useState([])    // celebratory burst
  const [taps, setTaps] = useState(0)         // sun taps after wake
  const containerRef = useRef(null)
  const sunRef = useRef(null)
  const startYRef = useRef(0)
  const startSunYRef = useRef(0)

  // Drag handlers
  const onPointerDown = (e) => {
    e.preventDefault()
    setDragging(true)
    startYRef.current = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    startSunYRef.current = sunY
  }

  const onPointerMove = (e) => {
    if (!dragging || !containerRef.current) return
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    const rect = containerRef.current.getBoundingClientRect()
    const delta = (startYRef.current - clientY) / (rect.height * 0.6)
    const next = Math.max(0, Math.min(1, startSunYRef.current + delta))
    setSunY(next)
    if (next >= 0.95 && !awake) {
      setAwake(true)
      burstEmojis(40, true)
    }
  }

  const onPointerUp = () => {
    if (!dragging) return
    setDragging(false)
    if (!awake) {
      // Auto-snap back if not raised enough
      if (sunY < 0.95) {
        const interval = setInterval(() => {
          setSunY(s => {
            if (s <= 0.01) { clearInterval(interval); return 0 }
            return s - 0.04
          })
        }, 16)
      }
    }
  }

  useEffect(() => {
    if (!dragging) return
    window.addEventListener('mousemove', onPointerMove)
    window.addEventListener('mouseup', onPointerUp)
    window.addEventListener('touchmove', onPointerMove, { passive: false })
    window.addEventListener('touchend', onPointerUp)
    return () => {
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('mouseup', onPointerUp)
      window.removeEventListener('touchmove', onPointerMove)
      window.removeEventListener('touchend', onPointerUp)
    }
  })

  const burstEmojis = (count = 12, big = false) => {
    const pool = big
      ? ['☀️', '🌞', '🎉', '🥳', '✨', '🌈', '💛', '🌻', '🍹', '🎊', '🌅', '🦋']
      : ['☀️', '✨', '🌻', '💛', '🌈']
    const next = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      emoji: pool[Math.floor(Math.random() * pool.length)],
      x: 30 + Math.random() * 40,
      drift: (Math.random() - 0.5) * 80,
      size: 24 + Math.random() * 24,
      duration: 2.5 + Math.random() * 2,
    }))
    setEmojis(prev => [...prev, ...next])
    setTimeout(() => {
      setEmojis(prev => prev.filter(e => !next.find(n => n.id === e.id)))
    }, 5000)
  }

  // Tap the sun after waking → more bursts
  const tapSun = () => {
    if (!awake) return
    setTaps(t => t + 1)
    burstEmojis(12)
  }

  // Sky/scene colors animate based on sunY
  const t = awake ? 1 : sunY  // animate fully when awake
  const sky = {
    backgroundImage: `linear-gradient(180deg,
      ${interpolateColor('#1a1730', '#7ec0ff', t * 0.6)} 0%,
      ${interpolateColor('#3a2a4a', '#ffd6a5', t * 0.7)} 50%,
      ${interpolateColor('#5e3a40', '#ffe9d2', t * 0.9)} 100%)`,
  }

  // Sun position: bottom 5% (asleep) → top 18% (awake)
  const sunBottom = 5 + sunY * 70   // % from bottom
  const sunOpacity = 0.4 + sunY * 0.6

  return (
    <div ref={containerRef} className="min-h-screen relative overflow-hidden select-none" style={sky}>
      {/* Stars (visible only when sun is low) */}
      {!awake && (
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-500" style={{ opacity: 1 - sunY }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{
              left: `${(i * 17 + 5) % 100}%`,
              top: `${(i * 11 + 3) % 60}%`,
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              boxShadow: '0 0 4px rgba(255,255,255,0.8)',
              animation: `twinkle ${2 + (i % 4)}s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
        </div>
      )}

      {/* Clouds — slide in as sun rises */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute text-6xl sm:text-7xl" style={{
          top: '15%',
          left: `${-30 + sunY * 30}%`,
          opacity: sunY * 0.7,
          transition: 'opacity 0.3s',
        }}>☁️</div>
        <div className="absolute text-5xl sm:text-6xl" style={{
          top: '28%',
          right: `${-30 + sunY * 50}%`,
          opacity: sunY * 0.6,
          transition: 'opacity 0.3s',
        }}>☁️</div>
        <div className="absolute text-4xl sm:text-5xl" style={{
          top: '8%',
          left: `${40 + sunY * 10}%`,
          opacity: sunY * 0.5,
          transition: 'opacity 0.3s',
        }}>☁️</div>
      </div>

      {/* Birds when awake */}
      {awake && (
        <>
          <div className="absolute text-3xl pointer-events-none" style={{
            top: '20%',
            left: '60%',
            animation: 'flyAcross 12s linear infinite',
          }}>🐦</div>
          <div className="absolute text-2xl pointer-events-none" style={{
            top: '32%',
            left: '40%',
            animation: 'flyAcross 15s linear infinite 3s',
          }}>🕊️</div>
        </>
      )}

      {/* Mountains silhouette */}
      <svg className="absolute bottom-0 left-0 right-0 w-full pointer-events-none" viewBox="0 0 1200 200" preserveAspectRatio="none" style={{ height: '25vh' }}>
        <path d="M0,200 L0,120 L150,40 L280,100 L420,30 L580,90 L720,20 L880,70 L1050,50 L1200,90 L1200,200 Z"
          fill={awake ? 'rgba(74, 50, 80, 0.65)' : 'rgba(20, 14, 32, 0.85)'}
          style={{ transition: 'fill 0.6s ease-out' }}
        />
      </svg>

      {/* Sun (draggable) */}
      <div
        ref={sunRef}
        onMouseDown={onPointerDown}
        onTouchStart={onPointerDown}
        onClick={tapSun}
        className="absolute left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing touch-none"
        style={{
          bottom: `${sunBottom}%`,
          transition: dragging ? 'none' : 'bottom 0.4s cubic-bezier(0.3, 1.5, 0.5, 1)',
          opacity: sunOpacity,
        }}
      >
        <div
          className="relative rounded-full flex items-center justify-center text-4xl sm:text-5xl"
          style={{
            width: '120px',
            height: '120px',
            background: 'radial-gradient(circle at 35% 35%, #fff7a8 0%, #ffd86b 30%, #ff9a3c 75%, #ff7a59 100%)',
            boxShadow: awake
              ? '0 0 80px 30px rgba(255, 200, 100, 0.55), 0 0 160px 60px rgba(255, 165, 80, 0.3)'
              : '0 0 30px 10px rgba(255, 200, 100, 0.3)',
            transform: `scale(${awake ? 1.1 : 0.9 + sunY * 0.2})`,
            transition: 'box-shadow 0.5s, transform 0.4s',
            animation: awake ? 'sunSpin 30s linear infinite' : 'none',
          }}
        >
          {awake ? (taps > 0 ? '🥳' : '😎') : (sunY > 0.4 ? '😊' : '😴')}
        </div>
      </div>

      {/* Floating emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {emojis.map(e => (
          <div key={e.id} className="absolute" style={{
            left: `${e.x}%`,
            bottom: '20%',
            fontSize: `${e.size}px`,
            animation: `floatUpAndOut ${e.duration}s ease-out forwards`,
            '--drift': `${e.drift}px`,
          }}>
            {e.emoji}
          </div>
        ))}
      </div>

      {/* Back button */}
      {onBack && (
        <button onClick={onBack} className="absolute top-5 left-5 text-white/40 hover:text-white/90 text-xs font-mono tracking-wider bg-black/30 backdrop-blur px-3 py-1.5 rounded-full border border-white/10 transition-colors z-20">
          ← back
        </button>
      )}

      {/* Top bar — date / weekend pill */}
      <div className="absolute top-5 right-5 z-20">
        <div className="px-3 py-1.5 rounded-full bg-black/30 backdrop-blur text-white/80 text-xs font-medium border border-white/10 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Friday · weekend incoming
        </div>
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 top-0 z-10 flex flex-col items-center px-6 pt-20 pointer-events-none">
        <div className="text-center max-w-2xl">
          {/* Header tag */}
          <div className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.4em] text-white/60 mb-3">
            ✦ for chaitra ✦
          </div>

          {/* Big greeting */}
          <h1
            className="leading-[1] tracking-tight mb-4"
            style={{
              fontSize: 'clamp(2.5rem, 8vw, 5rem)',
              fontWeight: 700,
              color: awake ? '#fff' : '#fff8dc',
              textShadow: awake
                ? '0 4px 30px rgba(255,200,120,0.6), 0 2px 6px rgba(0,0,0,0.4)'
                : '0 2px 12px rgba(0,0,0,0.5)',
              transition: 'color 0.5s, text-shadow 0.5s',
            }}
          >
            {awake ? 'Good Morning!' : 'pssst...'}
          </h1>

          <h2
            className="text-lg sm:text-2xl text-white/85 mb-6"
            style={{ fontWeight: 500, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}
          >
            {awake ? (
              <>Happy <span style={{ color: '#ffd86b' }}>Friday</span>, Chaitra 🍹</>
            ) : (
              <>the sun is sleeping. wake it up?</>
            )}
          </h2>

          {/* Hint */}
          {!awake && (
            <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur border border-white/20 text-white/70 text-xs sm:text-sm font-medium pointer-events-auto">
              <span className="text-base">👇</span>
              drag the sleepy sun UP to the sky
            </div>
          )}

          {/* Awake message */}
          {awake && (
            <div className="mt-2 space-y-3 animate-fade-in-up">
              <p className="text-white/85 text-base sm:text-lg max-w-md mx-auto leading-relaxed" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.35)' }}>
                Weekend is <em className="text-amber-200">right there</em>.
                Coffee. Sun. Friends. Maybe pelli sambaram somewhere. 😄
              </p>
              <div className="pt-1 text-xs text-white/60 font-mono pointer-events-auto">
                {taps === 0 && <span>↑ tap the sun for vibes</span>}
                {taps > 0 && taps < 5 && <span>✦ {taps} vibe{taps === 1 ? '' : 's'} unleashed</span>}
                {taps >= 5 && taps < 10 && <span>🔥 {taps} vibes — you're on a roll</span>}
                {taps >= 10 && <span>💫 {taps} vibes — okay easy chaitra, save some for saturday</span>}
              </div>
            </div>
          )}

          {/* Signature once awake */}
          {awake && (
            <div className="mt-12 text-right max-w-md mx-auto pointer-events-auto">
              <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '16px', color: 'rgba(255,255,255,0.85)' }}>
                — Kranthi
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes floatUpAndOut {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0;
          }
          15% { opacity: 1; }
          100% {
            transform: translate(var(--drift), -90vh) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes sunSpin {
          to { transform: rotate(360deg) scale(1.1); }
        }
        @keyframes flyAcross {
          from { transform: translateX(0); }
          to { transform: translateX(-120vw); }
        }
      `}</style>
    </div>
  )
}

// linear interpolate between two hex colors at t (0..1)
function interpolateColor(c1, c2, t) {
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16)
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r}, ${g}, ${b})`
}
