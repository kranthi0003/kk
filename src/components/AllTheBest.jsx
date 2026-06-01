import React, { useEffect, useState } from 'react'

// Hidden good luck page for Chaitra — accessible only at #/atb
export default function AllTheBest({ onBack }) {
  const [mounted, setMounted] = useState(false)
  const [confetti, setConfetti] = useState([])

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    // Generate floating particles
    const particles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 4 + Math.random() * 8,
      delay: Math.random() * 4,
      duration: 8 + Math.random() * 8,
      emoji: ['✨', '🌟', '🍀', '🐙', '⌨️'][Math.floor(Math.random() * 5)],
    }))
    setConfetti(particles)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at top, #1a2540 0%, #0a0e1a 60%, #050810 100%)',
      }}
    >
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {confetti.map((p) => (
          <div
            key={p.id}
            className="absolute select-none"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: `${p.size + 8}px`,
              opacity: 0.6,
              animation: `floatUp ${p.duration}s ease-in-out ${p.delay}s infinite`,
            }}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      {/* Soft glow blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '10%', left: '10%', width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(255,180,120,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'breathe 8s ease-in-out infinite',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '10%', right: '10%', width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(120,180,255,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'breathe 10s ease-in-out infinite 2s',
        }}
      />

      {/* Back button (subtle, top-left) */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 text-white/30 hover:text-white/60 text-xs font-mono tracking-wider transition-colors z-20"
        >
          ← home
        </button>
      )}

      {/* Main content card */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <div
          className="max-w-2xl w-full transition-all duration-1000 ease-out"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
          }}
        >
          {/* Tiny header */}
          <div className="text-center mb-8">
            <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/40 mb-2">
              ◇ A note for ◇
            </div>
            <h2
              className="font-heading text-3xl sm:text-4xl text-white/90 tracking-wide"
              style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
            >
              Chaitra
            </h2>
          </div>

          {/* The card */}
          <div
            className="relative rounded-2xl p-8 sm:p-12 backdrop-blur-sm"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 20px 60px -20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            {/* Big "ALL THE BEST" */}
            <div className="text-center mb-8">
              <h1
                className="font-heading tracking-tight leading-none"
                style={{
                  fontSize: 'clamp(2.5rem, 8vw, 5rem)',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #ffd89b 0%, #ffb86c 30%, #ff79c6 60%, #8be9fd 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'drop-shadow(0 0 30px rgba(255,180,120,0.3))',
                  animation: 'shimmer 6s ease-in-out infinite',
                  backgroundSize: '200% 200%',
                }}
              >
                All The Best
              </h1>
              <div className="text-white/60 text-base sm:text-lg mt-2 font-light tracking-wide">
                GitHub Admin exam — you've got this. 🍀
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="text-white/30 text-xs">{`</>`}</div>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>

            {/* Personal message */}
            <div className="space-y-5 text-white/75 text-base sm:text-lg leading-relaxed font-light">
              <p>
                Hey Chaitra,
              </p>
              <p>
                Today's the day. <span className="text-white">GitHub Admin exam</span> — and you are
                <em className="text-amber-200/90"> more than ready</em> for this.
              </p>
              <p>
                You've put in the hours. You know your way around orgs, teams, audit logs, SAML, SSO, branch protection,
                Actions, packages, enterprise settings — the whole stack. The exam is just a formal way of telling
                you what you already know.
              </p>
              <p>
                When you hit a question that feels tricky — <span className="text-white">pause, breathe, read it once more</span>.
                The answer is usually in the question. Trust the process, eliminate the obviously wrong ones, and go with your gut.
              </p>
              <p>
                And remember — even if anything goes sideways, it's just a retake. Nothing about today changes who you are or
                how good you are at what you do.
              </p>
              <p className="text-white font-medium text-lg sm:text-xl pt-2">
                Now go pass that exam. Then come back and tell me all about it. 🎯
              </p>
            </div>

            {/* Quick reminders */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-mono text-white/40">
              <div className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-center">read twice</div>
              <div className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-center">flag &amp; move on</div>
              <div className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-center">trust your gut</div>
              <div className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-center">breathe</div>
              <div className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-center">hydrate</div>
              <div className="px-2 py-1.5 rounded border border-white/10 bg-white/[0.02] text-center">finish strong</div>
            </div>

            {/* Signature */}
            <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="text-white/40 font-mono tracking-wider">
                rooting for you,
              </div>
              <div
                className="text-white/70"
                style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '14px' }}
              >
                — Kranthi
              </div>
            </div>
          </div>

          {/* Small note below */}
          <div className="text-center mt-6 text-white/30 text-[10px] font-mono tracking-widest">
            ───── made with care ─────
          </div>
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.5; }
          25% { transform: translateY(-20px) translateX(5px); opacity: 0.9; }
          50% { transform: translateY(-10px) translateX(-5px); opacity: 0.6; }
          75% { transform: translateY(-30px) translateX(8px); opacity: 0.8; }
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
}
