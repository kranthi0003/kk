import React, { useEffect, useState } from 'react'

// Hidden ATB for Chaitra — silly, fun, playful
export default function AllTheBest({ onBack }) {
  const [mounted, setMounted] = useState(false)
  const [bounceClick, setBounceClick] = useState(0)

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
        background: 'linear-gradient(135deg, #ffd6e8 0%, #ffe8b8 25%, #b8e6ff 60%, #d4b8ff 100%)',
      }}
    >
      {/* Wavy pastel blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{
          top: '-10%', left: '-5%', width: '50%', height: '50%',
          background: 'rgba(255, 180, 220, 0.5)',
          filter: 'blur(60px)',
          animation: 'wiggle 10s ease-in-out infinite',
        }} />
        <div className="absolute rounded-full" style={{
          bottom: '-10%', right: '-5%', width: '55%', height: '55%',
          background: 'rgba(180, 220, 255, 0.5)',
          filter: 'blur(70px)',
          animation: 'wiggle 12s ease-in-out infinite 2s',
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
          className="px-4 py-1.5 rounded-full text-xs font-bold tracking-widest text-white"
          style={{
            background: 'linear-gradient(90deg, #ff4d8d, #b347ff)',
            boxShadow: '0 0 20px rgba(255,77,141,0.5), 0 4px 0 rgba(0,0,0,0.15)',
            textShadow: '1px 1px 0 rgba(0,0,0,0.2)',
          }}
        >
          🎯 GO CHAITRA GO 🎯
        </div>
      </div>

      {/* THE STICKY NOTE CARD */}
      <div
        className="relative z-10 max-w-md w-full"
        style={{
          transition: 'opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.5, 1.5, 0.5, 1)',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'rotate(-1.5deg) scale(1)' : 'rotate(-1.5deg) scale(0.7) translateY(40px)',
        }}
        onClick={() => setBounceClick(c => c + 1)}
      >
        {/* Tape strips at corners */}
        <div className="absolute -top-3 left-8 w-16 h-6 bg-yellow-200/80 rotate-[-12deg] z-20 shadow-sm" />
        <div className="absolute -top-3 right-8 w-16 h-6 bg-yellow-200/80 rotate-[8deg] z-20 shadow-sm" />

        {/* The sticky note */}
        <div
          key={bounceClick}
          className="relative rounded-2xl p-8 sm:p-10 cursor-pointer"
          style={{
            background: 'linear-gradient(180deg, #fffdf2 0%, #fff8e1 100%)',
            border: '3px solid #1a1a1a',
            boxShadow: '8px 8px 0 #1a1a1a, 16px 16px 40px rgba(0,0,0,0.2)',
            animation: bounceClick > 0 ? 'cardBounce 0.4s ease-out' : 'none',
          }}
        >
          {/* Tiny tag */}
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-pink-600 mb-3 text-center">
            ☆ for chaitra ☆
          </div>

          {/* Big wobbly heading */}
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

          {/* Squiggly divider */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <span className="text-2xl" style={{ animation: 'wobble 2s ease-in-out infinite' }}>🍀</span>
            <span className="text-base">~</span>
            <span className="text-2xl" style={{ animation: 'wobble 2s ease-in-out infinite 0.3s' }}>💻</span>
            <span className="text-base">~</span>
            <span className="text-2xl" style={{ animation: 'wobble 2s ease-in-out infinite 0.6s' }}>✨</span>
          </div>

          {/* Message — handwritten feel */}
          <div
            className="space-y-3 text-center text-gray-800 leading-relaxed"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '17px' }}
          >
            <p>
              Baaga raayu. Iyna nuv thop le senior... easy ga rasesthav.
            </p>
            <p>
              Exam ipoyaka passed ani msg chey... poyna kuda cheyu, kalsi edudham. Na actions exam etu pothadhi 😄
            </p>
            <p className="text-pink-700 font-bold pt-2 text-lg">
              See you on the other side. 👋
            </p>
          </div>

          {/* Signature */}
          <div className="mt-8 flex items-end justify-end">
            <div
              className="text-gray-800"
              style={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontStyle: 'italic',
                fontSize: '20px',
                fontWeight: 600,
                textDecoration: 'underline',
                textDecorationColor: '#ff4d8d',
                textDecorationThickness: '2px',
                textUnderlineOffset: '4px',
              }}
            >
              — Kranthi
            </div>
          </div>

          {/* Tiny click hint */}
          <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-mono text-gray-600 whitespace-nowrap">
            ↑ tap me!
          </div>
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
      `}</style>
    </div>
  )
}
