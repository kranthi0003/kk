import React, { Suspense, lazy, useEffect, useState, useCallback } from 'react'
import profile from '../../assets/profile.png'
import TypingText from './TypingText'

const SpaceBackground = lazy(() => import('./SpaceBackground'))

export default function Hero({ onResumeClick }) {
  // phase: 'intro' (full content visible) → 'cosmos' (content fades, universe blooms)
  const [phase, setPhase] = useState('intro')
  const isIntro = phase === 'intro'

  // Scroll-driven: transition based ONLY on scroll position
  // Going down past threshold → cosmos. Coming back to top → intro again.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y > 80) setPhase('cosmos')
      else if (y < 10) setPhase('intro')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // initial check
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleExploreUniverse = useCallback(() => {
    window.location.hash = '#/space'
    window.location.reload()
  }, [])

  return (
    <section id="home" className="relative min-h-screen flex items-center pt-16 md:pt-20 overflow-hidden">
      {/* 3D Solar System background — full-bleed */}
      <Suspense fallback={null}>
        <div className="absolute inset-0 z-0">
          <SpaceBackground />
        </div>
      </Suspense>

      {/* Dim overlay — strong during intro, transparent after */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none transition-opacity duration-[1800ms] ease-out"
        style={{
          opacity: isIntro ? 1 : 0,
          background:
            'radial-gradient(ellipse at 30% 50%, rgba(2,0,12,0.78) 0%, rgba(2,0,12,0.55) 40%, rgba(2,0,12,0.3) 75%, transparent 100%)',
        }}
      />

      {/* ═════════ INTRO PHASE: hero content ═════════ */}
      <div
        className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 md:py-8 lg:py-12 transition-all duration-[1500ms] ease-out"
        style={{
          opacity: isIntro ? 1 : 0,
          transform: isIntro ? 'translateY(0) scale(1)' : 'translateY(-30px) scale(0.95)',
          pointerEvents: isIntro ? 'auto' : 'none',
        }}
      >
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center">
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Profile — animates toward top-left navbar position when cosmos phase */}
            <div className="mb-5 md:mb-6 animate-fade-in-up flex lg:justify-start justify-center">
              <div className="relative inline-block">
                <div className="absolute -inset-4 rounded-full blur-3xl"
                     style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.45) 0%, rgba(139,92,246,0.2) 40%, transparent 70%)' }} />
                <div className="relative p-[2px] rounded-full"
                     style={{ background: 'conic-gradient(from 0deg, #a78bfa, #ec4899, #60a5fa, #a78bfa)' }}>
                  <img
                    src={profile}
                    alt="Kranthi Kiran"
                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full object-cover border-[3px] border-black/80"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-md text-xs font-medium text-violet-100/90"
                style={{
                  background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(96,165,250,0.08))',
                  border: '1px solid rgba(167,139,250,0.3)',
                  boxShadow: '0 0 20px -8px rgba(167,139,250,0.4)',
                }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                Currently at GitHub · Microsoft
              </span>
            </div>

            <h1
              className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-4 animate-fade-in-up text-white drop-shadow-[0_0_30px_rgba(167,139,250,0.3)]"
              style={{ animationDelay: '0.2s', fontWeight: 600 }}
            >
              Hey, I'm{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #c4b5fd 0%, #f0abfc 35%, #93c5fd 70%, #c4b5fd 100%)',
                  filter: 'drop-shadow(0 0 20px rgba(196,181,253,0.5))',
                }}
              >
                Kranthi
              </span>
            </h1>

            <h2
              className="font-heading text-lg sm:text-xl md:text-2xl mb-5 animate-fade-in-up text-violet-200/80"
              style={{ animationDelay: '0.3s', fontWeight: 500 }}
            >
              <TypingText
                phrases={['Cloud Engineer', 'Infrastructure Builder', 'Distributed Systems Nerd', 'GitHub Engineer']}
                typingSpeed={120}
                deletingSpeed={60}
                pauseDuration={2500}
              />
            </h2>

            <p className="font-body text-base md:text-lg text-white/70 max-w-xl mx-auto lg:mx-0 mb-8 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.4s' }}>
              I build reliable infrastructure, tame distributed systems,
              and craft tools that make engineering teams more productive.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <button
                onClick={onResumeClick}
                data-resume-btn
                className="group px-5 py-2.5 rounded-lg font-medium text-sm text-white transition-all hover:scale-[1.03]"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 50%, #c084fc 100%)',
                  boxShadow: '0 0 25px -5px rgba(139,92,246,0.6), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                View Resume
              </button>
              <a
                href="#connect"
                className="px-5 py-2.5 rounded-lg font-medium text-sm text-violet-100 transition-all hover:scale-[1.03]"
                style={{
                  background: 'rgba(167,139,250,0.08)',
                  border: '1px solid rgba(167,139,250,0.35)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                Get in Touch →
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
              <button
                onClick={() => { window.location.hash = '#/collab'; window.location.reload() }}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-violet-100 transition-all hover:scale-[1.03]"
                style={{
                  background: 'rgba(96,165,250,0.1)',
                  border: '1px solid rgba(96,165,250,0.3)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 0 15px -6px rgba(96,165,250,0.4)',
                }}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-400" />
                </span>
                Collab — code &amp; battle
                <span className="text-violet-300/60 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
              <button
                onClick={() => { window.location.hash = '#/stranger'; window.location.reload() }}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-pink-100 transition-all hover:scale-[1.03]"
                style={{
                  background: 'rgba(236,72,153,0.12)',
                  border: '1px solid rgba(236,72,153,0.35)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 0 18px -6px rgba(236,72,153,0.5)',
                }}
              >
                <span className="px-1 py-px rounded text-[8.5px] font-bold uppercase tracking-wider text-white"
                  style={{ background: 'rgba(236,72,153,0.4)' }}>
                  New
                </span>
                Stranger Chat
                <span className="text-pink-300/60 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>

            {/* Scroll hint */}
            <div className="mt-10 text-[10px] font-mono tracking-[0.3em] text-violet-300/40 animate-pulse">
              ↓ SCROLL TO EXPLORE THE COSMOS
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-5">
            <div className="text-right pr-4 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
              <div className="text-[10px] font-mono tracking-[0.4em] text-violet-300/40 mb-1">↘ LIVE SOLAR SYSTEM</div>
              <div className="text-xs text-white/30">Watch planets orbit · click 🪐 below to explore</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═════════ COSMOS PHASE: minimal CTA in center ═════════ */}
      <div
        className="absolute inset-0 z-10 flex items-center justify-center px-6 transition-all duration-[1500ms] ease-out pointer-events-none"
        style={{
          opacity: isIntro ? 0 : 1,
          transform: isIntro ? 'translateY(30px) scale(0.92)' : 'translateY(0) scale(1)',
        }}
      >
        <div className="text-center max-w-2xl pointer-events-auto">
          {/* Tiny label */}
          <div className="text-[10px] font-mono tracking-[0.5em] text-violet-300/50 mb-3">
            ─── WELCOME TO MY UNIVERSE ───
          </div>

          {/* Big title */}
          <h2
            className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight mb-5 text-white"
            style={{ fontWeight: 600 }}
          >
            Built by{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(135deg, #c4b5fd 0%, #f0abfc 50%, #93c5fd 100%)',
                filter: 'drop-shadow(0 0 25px rgba(196,181,253,0.6))',
              }}
            >
              Kranthi
            </span>
          </h2>

          <p className="text-sm md:text-base text-white/60 mb-7 max-w-md mx-auto leading-relaxed">
            Eight planets. One sun. Click below to fly through the solar system, learn fascinating facts, and explore.
          </p>

          {/* Primary CTA — explore the universe */}
          <button
            onClick={handleExploreUniverse}
            className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full font-medium text-base text-white transition-all hover:scale-[1.05]"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #60a5fa 100%)',
              boxShadow: '0 0 40px -5px rgba(139,92,246,0.7), 0 0 80px -20px rgba(236,72,153,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
            }}
          >
            <span className="text-xl">🪐</span>
            <span>Explore the Universe</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Secondary: continue scrolling */}
          <div className="mt-6">
            <button
              onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              className="text-[11px] font-mono tracking-[0.3em] text-violet-300/40 hover:text-violet-300/80 transition-colors"
            >
              ↓ OR SCROLL TO SEE MY WORK
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

