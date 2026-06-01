import React, { useEffect, useState, useRef } from 'react'

// Hidden ATB page for Chaitra — premium UI with cursor spotlight, animated border, parallax
export default function AllTheBest({ onBack }) {
  const [mounted, setMounted] = useState(false)
  const cardRef = useRef(null)
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  const onMouseMove = (e) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setMouse({ x, y })
    // Subtle parallax tilt
    setTilt({ rx: (0.5 - y) * 4, ry: (x - 0.5) * 4 })
  }

  const onMouseLeave = () => {
    setMouse({ x: 0.5, y: 0.5 })
    setTilt({ rx: 0, ry: 0 })
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-12"
      style={{
        background: '#070310',
      }}
    >
      {/* ─── Mesh gradient background (multi-layer aurora) ─── */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            top: '-20%', left: '-15%', width: '70%', height: '70%',
            background: 'radial-gradient(circle, rgba(244,114,182,0.40) 0%, transparent 65%)',
            filter: 'blur(100px)',
            animation: 'auroraA 18s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: '-20%', right: '-15%', width: '80%', height: '80%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.40) 0%, transparent 65%)',
            filter: 'blur(110px)',
            animation: 'auroraB 22s ease-in-out infinite 3s',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: '20%', right: '20%', width: '50%', height: '50%',
            background: 'radial-gradient(circle, rgba(56,189,248,0.25) 0%, transparent 70%)',
            filter: 'blur(90px)',
            animation: 'auroraC 20s ease-in-out infinite 5s',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: '20%', left: '15%', width: '45%', height: '45%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.22) 0%, transparent 70%)',
            filter: 'blur(90px)',
            animation: 'auroraD 24s ease-in-out infinite 7s',
          }}
        />
      </div>

      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          maskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 35%, transparent 80%)',
        }}
      />

      {/* Floating sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${5 + (i * 13) % 90}%`,
              top: `${8 + (i * 17) % 84}%`,
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              background: 'rgba(255,255,255,0.85)',
              boxShadow: `0 0 ${6 + (i % 4) * 2}px rgba(255,255,255,0.8)`,
              animation: `twinkle ${3 + (i % 5) * 0.7}s ease-in-out ${i * 0.25}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-white/30 hover:text-white/80 text-xs font-mono tracking-wider transition-colors z-30"
        >
          ← back
        </button>
      )}

      {/* ─── Main card with animated border + parallax + spotlight ─── */}
      <div
        className="relative z-10 max-w-lg w-full"
        style={{
          perspective: '1500px',
          transition: 'opacity 1.2s ease-out, transform 1.2s ease-out',
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.96)',
        }}
      >
        {/* Animated conic gradient border (rotating) */}
        <div
          className="absolute -inset-px rounded-3xl pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(244,114,182,0.6) 20%, transparent 40%, rgba(139,92,246,0.6) 60%, transparent 80%, rgba(56,189,248,0.6) 100%)',
            animation: 'spin 8s linear infinite',
            opacity: 0.5,
          }}
        />

        {/* Outer glow */}
        <div
          className="absolute -inset-8 rounded-[2rem] pointer-events-none"
          style={{
            background: 'radial-gradient(circle at center, rgba(244,114,182,0.15) 0%, rgba(139,92,246,0.10) 40%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* The actual card */}
        <div
          ref={cardRef}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          className="relative rounded-3xl p-10 sm:p-14 overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(20,15,40,0.85) 0%, rgba(15,10,30,0.92) 100%)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 40px 100px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.10)',
            transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transition: 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Cursor spotlight */}
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{
              background: `radial-gradient(600px circle at ${mouse.x * 100}% ${mouse.y * 100}%, rgba(255,255,255,0.06) 0%, transparent 40%)`,
              transition: 'background 0.1s ease-out',
            }}
          />

          {/* Tiny header */}
          <div
            className="text-[10px] font-mono uppercase tracking-[0.5em] text-white/45 mb-6 text-center"
            style={{
              transition: 'opacity 0.6s ease-out 0.3s, transform 0.6s ease-out 0.3s',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            for chaitra
          </div>

          {/* Heading with halo glow */}
          <div className="relative mb-8">
            {/* Halo behind text */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(244,114,182,0.25) 0%, transparent 60%)',
                filter: 'blur(30px)',
              }}
            />
            <h1
              className="relative text-center font-heading leading-[1] tracking-tight"
              style={{
                fontSize: 'clamp(3rem, 11vw, 6rem)',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 20%, #c4b5fd 45%, #93c5fd 70%, #fde68a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                backgroundSize: '250% 250%',
                animation: 'shimmer 7s ease-in-out infinite',
                filter: 'drop-shadow(0 4px 20px rgba(244,114,182,0.4))',
                transition: 'opacity 0.8s ease-out 0.4s, transform 0.8s ease-out 0.4s',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(12px)',
              }}
            >
              All the
              <br />
              best.
            </h1>
          </div>

          {/* Divider */}
          <div
            className="flex items-center justify-center gap-2 mb-7"
            style={{
              transition: 'opacity 0.6s ease-out 0.6s',
              opacity: mounted ? 1 : 0,
            }}
          >
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/30" />
            <div className="w-1.5 h-1.5 rounded-full bg-pink-400/60" style={{ boxShadow: '0 0 8px rgba(244,114,182,0.7)' }} />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/30" />
          </div>

          {/* Message */}
          <div
            className="space-y-4 text-center text-white/85 text-base sm:text-lg leading-relaxed font-light"
            style={{
              transition: 'opacity 0.6s ease-out 0.7s, transform 0.6s ease-out 0.7s',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(10px)',
            }}
          >
            <p>
              Baaga raayu. Iyna nuv thop le senior... easy ga rasesthav.
            </p>
            <p>
              Exam ipoyaka passed ani msg chey... poyna kuda cheyu, kalsi edudham. Na actions exam etu pothadhi 😄
            </p>
            <p className="text-white pt-1 font-normal">
              See you on the other side.
            </p>
          </div>

          {/* Signature */}
          <div
            className="mt-10 pt-6 border-t border-white/[0.08] flex items-center justify-end"
            style={{
              transition: 'opacity 0.6s ease-out 1s',
              opacity: mounted ? 1 : 0,
            }}
          >
            <div
              className="text-white/85"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '16px' }}
            >
              — Kranthi
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes auroraA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(18%, 12%) scale(1.18); }
        }
        @keyframes auroraB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-18%, -12%) scale(1.22); }
        }
        @keyframes auroraC {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-12%, 18%) scale(1.15); }
        }
        @keyframes auroraD {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15%, -10%) scale(1.12); }
        }
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
