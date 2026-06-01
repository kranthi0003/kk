import React, { useEffect, useState } from 'react'

// Hidden ATB for Chaitra — silly, fun, playful
export default function AllTheBest({ onBack }) {
  const [mounted, setMounted] = useState(false)
  const [bounceClick, setBounceClick] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [rolling, setRolling] = useState(false)

  const handleCardClick = () => {
    if (rolling) return
    setRolling(true)
    setBounceClick(c => c + 1)
    // Swap content near the end when card is settling face-up
    setTimeout(() => setFlipped(f => !f), 950)
    setTimeout(() => setRolling(false), 1300)
  }

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Raining emoji setup
  const rainEmojis = ['🍀', '💻', '✨', '🎯', '☕', '📚', '💪', '🔥', '⭐', '🎈', '💖', '🎉']
  const rainItems = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    emoji: rainEmojis[i % rainEmojis.length],
    left: (i * 4.3 + 5) % 95,
    delay: (i * 0.4) % 8,
    duration: 8 + (i % 5) * 1.5,
    size: 18 + (i % 4) * 6,
  }))

  // Corner stickers
  const stickers = [
    { emoji: '💻', top: '8%', left: '6%', rot: -15, delay: 0, size: 56 },
    { emoji: '🍀', top: '12%', right: '8%', rot: 18, delay: 0.6, size: 52 },
    { emoji: '✨', bottom: '14%', left: '7%', rot: -8, delay: 1.2, size: 48 },
    { emoji: '☕', bottom: '10%', right: '6%', rot: 12, delay: 0.3, size: 52 },
    { emoji: '🎯', top: '40%', left: '4%', rot: -22, delay: 0.9, size: 44 },
    { emoji: '💪', top: '50%', right: '4%', rot: 20, delay: 1.5, size: 44 },
  ]

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-12"
      style={{
        background: 'linear-gradient(135deg, #ffe4ec 0%, #ffd7c4 25%, #fff0db 50%, #d8ecd9 75%, #e4d4f0 100%)',
      }}
    >
      {/* Wavy pastel blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{
          top: '-10%', left: '-5%', width: '50%', height: '50%',
          background: 'rgba(232, 165, 184, 0.45)',
          filter: 'blur(70px)',
          animation: 'wiggle 10s ease-in-out infinite',
        }} />
        <div className="absolute rounded-full" style={{
          bottom: '-10%', right: '-5%', width: '55%', height: '55%',
          background: 'rgba(216, 197, 232, 0.5)',
          filter: 'blur(80px)',
          animation: 'wiggle 12s ease-in-out infinite 2s',
        }} />
        <div className="absolute rounded-full" style={{
          top: '40%', right: '20%', width: '35%', height: '35%',
          background: 'rgba(200, 224, 204, 0.45)',
          filter: 'blur(70px)',
          animation: 'wiggle 14s ease-in-out infinite 4s',
        }} />
      </div>

      {/* Polka dots overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 2px, transparent 2px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Raining emojis */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {rainItems.map((it) => (
          <div
            key={it.id}
            className="absolute select-none"
            style={{
              left: `${it.left}%`,
              top: '-10%',
              fontSize: `${it.size}px`,
              animation: `rain ${it.duration}s linear ${it.delay}s infinite`,
            }}
          >
            {it.emoji}
          </div>
        ))}
      </div>

      {/* Corner stickers — wobbling */}
      <div className="absolute inset-0 pointer-events-none">
        {stickers.map((s, i) => (
          <div
            key={i}
            className="absolute select-none"
            style={{
              top: s.top, left: s.left, right: s.right, bottom: s.bottom,
              fontSize: `${s.size}px`,
              transform: `rotate(${s.rot}deg)`,
              animation: `wobble 3.5s ease-in-out ${s.delay}s infinite`,
              filter: 'drop-shadow(2px 4px 0 rgba(0,0,0,0.1))',
            }}
          >
            {s.emoji}
          </div>
        ))}
      </div>

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-gray-700 hover:text-black text-xs font-bold tracking-wider transition-colors z-30 bg-white/70 backdrop-blur px-3 py-1.5 rounded-full border-2 border-black/10"
        >
          ← back
        </button>
      )}

      {/* Neon tag — top */}
      <div
        className="absolute top-10 left-1/2 -translate-x-1/2 z-20"
        style={{
          animation: 'tagBounce 2s ease-in-out infinite',
        }}
      >
        <div
          className="px-4 py-1.5 rounded-full text-xs font-bold tracking-widest text-gray-800 border-2 border-black/15"
          style={{
          background: 'linear-gradient(135deg, #ffe4ec 0%, #ffd7c4 35%, #fff0db 70%, #d8ecd9 100%)',
            boxShadow: '0 4px 0 rgba(0,0,0,0.10), 0 8px 16px rgba(232,165,184,0.30)',
          }}
        >
          🎯 GO CHAITRA GO 🎯
        </div>
      </div>

      {/* THE STICKY NOTE CARD */}
      <div
        className="relative z-10 max-w-md w-full"
        style={{
          perspective: '1500px',
          transition: 'opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.5, 1.5, 0.5, 1)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'rotate(-1.5deg) scale(1)' : 'rotate(-1.5deg) scale(0.7) translateY(40px)',
        }}
      >
        {/* Tape strips at corners — sage */}
        <div className="absolute -top-3 left-8 w-16 h-6 rotate-[-12deg] z-20 shadow-sm" style={{ background: 'rgba(184, 215, 188, 0.85)' }} />
        <div className="absolute -top-3 right-8 w-16 h-6 rotate-[8deg] z-20 shadow-sm" style={{ background: 'rgba(184, 215, 188, 0.85)' }} />

        {/* The sticky note */}
        <div
          key={bounceClick}
          onClick={handleCardClick}
          className="relative rounded-2xl p-8 sm:p-10 cursor-pointer"
          style={{
            background: 'linear-gradient(180deg, #fffaf3 0%, #fff2e6 100%)',
            border: '3px solid #3a2a2e',
            boxShadow: '8px 8px 0 #3a2a2e, 16px 16px 40px rgba(58,42,46,0.20)',
            animation: rolling ? 'diceRoll 1.3s cubic-bezier(0.3, 0.0, 0.2, 1)' : 'none',
            transformStyle: 'preserve-3d',
          }}
        >
          {!flipped ? (
            <>
              {/* ─── FRONT: the original note ─── */}
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-600 mb-3 text-center">
                ☆ for chaitra ☆
              </div>

              <h1
                className="text-center leading-[0.95] tracking-tight mb-6"
                style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: 'clamp(2.5rem, 9vw, 4.5rem)',
                  fontWeight: 800,
                  fontStyle: 'italic',
                  color: '#1a1a1a',
                  textShadow: '4px 4px 0 #ff8fb0, 8px 8px 0 #b347ff',
                  animation: 'headWobble 4s ease-in-out infinite',
                }}
              >
                All the<br />best!
              </h1>

              <div className="flex items-center justify-center gap-2 mb-5">
                <span className="text-2xl" style={{ animation: 'wobble 2s ease-in-out infinite' }}>🍀</span>
                <span className="text-base">~</span>
                <span className="text-2xl" style={{ animation: 'wobble 2s ease-in-out infinite 0.3s' }}>💻</span>
                <span className="text-base">~</span>
                <span className="text-2xl" style={{ animation: 'wobble 2s ease-in-out infinite 0.6s' }}>✨</span>
              </div>

              <div
                className="space-y-3 text-center leading-relaxed"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '17px', color: '#3a2a2e' }}
              >
                <p>
                  Baaga raayu. Iyna nuv thop le senior... easy ga rasesthav.
                </p>
                <p>
                  Exam ipoyaka passed ani msg chey... poyna kuda cheyu, kalsi edudham. Na actions exam etu pothadhi 😄
                </p>
                <p className="font-bold pt-2 text-lg" style={{ color: '#c97086' }}>
                  See you on the other side. 👋
                </p>
              </div>

              <div className="mt-8 flex items-end justify-end">
                <div
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontStyle: 'italic',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#3a2a2e',
                    textDecoration: 'underline',
                    textDecorationColor: '#c97086',
                    textDecorationThickness: '2px',
                    textUnderlineOffset: '4px',
                  }}
                >
                  — Kranthi
                </div>
              </div>

              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-mono text-gray-600 whitespace-nowrap">
                ↑ tap me!
              </div>
            </>
          ) : (
            <>
              {/* ─── BACK: the cheeky message after dice roll ─── */}
              <div className="text-center py-6">
                <div className="text-6xl mb-4" style={{ animation: 'wobble 1.5s ease-in-out infinite' }}>
                  🎲
                </div>

                <h2
                  className="leading-tight tracking-tight mb-6"
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 'clamp(1.6rem, 5vw, 2.4rem)',
                    fontWeight: 800,
                    fontStyle: 'italic',
                    color: '#3a2a2e',
                    textShadow: '3px 3px 0 #ffd8a8',
                  }}
                >
                  heheh.. em ledhu gaani..
                </h2>

                <p
                  className="font-bold"
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
                    color: '#3a2a2e',
                  }}
                >
                  poyi exam rasko, byeee 👋
                </p>

                <div className="mt-8 text-3xl flex justify-center gap-3">
                  <span style={{ animation: 'wobble 2s ease-in-out infinite' }}>🍀</span>
                  <span style={{ animation: 'wobble 2s ease-in-out infinite 0.3s' }}>✨</span>
                  <span style={{ animation: 'wobble 2s ease-in-out infinite 0.6s' }}>💪</span>
                </div>

                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-mono text-gray-600 whitespace-nowrap">
                  ↑ tap to flip back
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes rain {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          90% { opacity: 0.9; }
          100% { transform: translateY(110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes wobble {
          0%, 100% { transform: rotate(var(--rot, 0deg)) translateY(0); }
          25% { transform: rotate(calc(var(--rot, 0deg) + 5deg)) translateY(-4px); }
          50% { transform: rotate(var(--rot, 0deg)) translateY(0); }
          75% { transform: rotate(calc(var(--rot, 0deg) - 5deg)) translateY(-2px); }
        }
        @keyframes wiggle {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(10%, 8%) scale(1.1); }
        }
        @keyframes tagBounce {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
        }
        @keyframes headWobble {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(1deg); }
        }
        @keyframes cardBounce {
          0% { transform: scale(1); }
          40% { transform: scale(1.04); }
          100% { transform: scale(1); }
        }
        @keyframes diceRoll {
          0%   { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(1); }
          15%  { transform: rotateX(180deg) rotateY(360deg) rotateZ(45deg) scale(0.92); }
          30%  { transform: rotateX(360deg) rotateY(720deg) rotateZ(120deg) scale(0.85); }
          45%  { transform: rotateX(540deg) rotateY(1080deg) rotateZ(220deg) scale(0.78); }
          60%  { transform: rotateX(720deg) rotateY(1440deg) rotateZ(310deg) scale(0.82); }
          75%  { transform: rotateX(900deg) rotateY(1800deg) rotateZ(380deg) scale(0.9); }
          90%  { transform: rotateX(1080deg) rotateY(2160deg) rotateZ(360deg) scale(0.97); }
          100% { transform: rotateX(1080deg) rotateY(2160deg) rotateZ(360deg) scale(1); }
        }
      `}</style>
    </div>
  )
}
