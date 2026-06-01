import React, { useEffect, useState } from 'react'

// Hidden ATB page for Chaitra — simple content, beautiful UI
export default function AllTheBest({ onBack }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="min-h-screen relative overflow-hidden flex items-center justify-center px-6 py-12"
      style={{
        background: '#0a0612',
      }}
    >
      {/* Aurora-style soft animated glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute rounded-full"
          style={{
            top: '-10%', left: '-10%', width: '60%', height: '60%',
            background: 'radial-gradient(circle, rgba(244,114,182,0.35) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'auroraA 14s ease-in-out infinite',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: '-10%', right: '-10%', width: '70%', height: '70%',
            background: 'radial-gradient(circle, rgba(167,139,250,0.30) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'auroraB 16s ease-in-out infinite 2s',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: '30%', right: '20%', width: '40%', height: '40%',
            background: 'radial-gradient(circle, rgba(251,191,36,0.20) 0%, transparent 70%)',
            filter: 'blur(80px)',
            animation: 'auroraC 18s ease-in-out infinite 4s',
          }}
        />
      </div>

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />

      {/* Tiny floating sparkles */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${10 + (i * 7) % 80}%`,
              top: `${15 + (i * 11) % 70}%`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              background: 'rgba(255,255,255,0.7)',
              boxShadow: '0 0 8px rgba(255,255,255,0.7)',
              animation: `twinkle ${3 + (i % 4)}s ease-in-out ${i * 0.3}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-white/30 hover:text-white/80 text-xs font-mono tracking-wider transition-colors z-20"
        >
          ← back
        </button>
      )}

      {/* Main card */}
      <div
        className="relative z-10 max-w-lg w-full transition-all duration-[1200ms] ease-out"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.96)',
        }}
      >
        {/* Glass card */}
        <div
          className="relative rounded-3xl p-10 sm:p-14"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.10)',
          }}
        >
          {/* Tiny header */}
          <div
            className="text-[10px] font-mono uppercase tracking-[0.5em] text-white/50 mb-6 text-center"
            style={{
              transition: 'opacity 0.6s ease-out 0.3s, transform 0.6s ease-out 0.3s',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(8px)',
            }}
          >
            for chaitra
          </div>

          {/* Big gradient heading */}
          <h1
            className="text-center font-heading leading-[1] tracking-tight mb-8"
            style={{
              fontSize: 'clamp(3rem, 10vw, 5.5rem)',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 25%, #c4b5fd 50%, #93c5fd 75%, #fde68a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              backgroundSize: '200% 200%',
              animation: 'shimmer 8s ease-in-out infinite',
              filter: 'drop-shadow(0 0 40px rgba(244,114,182,0.3))',
              transition: 'opacity 0.8s ease-out 0.4s, transform 0.8s ease-out 0.4s',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            }}
          >
            All the
            <br />
            best.
          </h1>

          {/* Divider */}
          <div
            className="flex items-center justify-center gap-2 mb-7"
            style={{
              transition: 'opacity 0.6s ease-out 0.6s',
              opacity: mounted ? 1 : 0,
            }}
          >
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/30" />
            <div className="w-1 h-1 rounded-full bg-white/40" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/30" />
          </div>

          {/* Simple message */}
          <div
            className="space-y-4 text-center text-white/80 text-base sm:text-lg leading-relaxed font-light"
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
            <p className="text-white pt-1">
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
              className="text-white/80"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '15px' }}
            >
              — Kranthi
            </div>
          </div>
        </div>

        {/* Tiny note under card */}
        <div
          className="text-center mt-6 text-[10px] font-mono tracking-[0.3em] text-white/25"
          style={{
            transition: 'opacity 0.6s ease-out 1.2s',
            opacity: mounted ? 1 : 0,
          }}
        >
          ───
        </div>
      </div>

      <style>{`
        @keyframes auroraA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(15%, 10%) scale(1.15); }
        }
        @keyframes auroraB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-15%, -10%) scale(1.2); }
        }
        @keyframes auroraC {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-10%, 15%) scale(1.1); }
        }
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
      `}</style>
    </div>
  )
}
