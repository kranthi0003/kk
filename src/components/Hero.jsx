import React, { Suspense, lazy, useEffect, useState, useCallback } from 'react'
import profile from '../../assets/profile.png'
import TypingText from './TypingText'

const SpaceBackground = lazy(() => import('./SpaceBackground'))

export default function Hero({ onResumeClick }) {
  // phase: 'intro' (full content visible) → 'cosmos' (content fades, universe blooms)
  const [phase, setPhase] = useState('intro')
  const isIntro = phase === 'intro'

  // Scroll-driven: going down past threshold → cosmos. Back to top → intro again.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y > 80) setPhase('cosmos')
      else if (y < 10) setPhase('intro')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
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

      {/* Dim overlay — strong during intro so original content reads clean,
          transparent in cosmos phase so the universe shines through */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none transition-opacity duration-[1500ms] ease-out"
        style={{
          opacity: isIntro ? 1 : 0,
          background: 'var(--background)',
        }}
      />

      {/* ═════════ INTRO PHASE: original centered hero content ═════════ */}
      <div
        className="relative z-10 max-w-5xl mx-auto px-6 py-6 md:py-8 lg:py-12 text-center w-full transition-all duration-[1200ms] ease-out"
        style={{
          opacity: isIntro ? 1 : 0,
          transform: isIntro ? 'translateY(0) scale(1)' : 'translateY(-24px) scale(0.96)',
          pointerEvents: isIntro ? 'auto' : 'none',
        }}
      >
        {/* Profile */}
        <div className="mb-5 md:mb-7 animate-fade-in-up">
          <div className="relative inline-block">
            <div className="absolute -inset-3 bg-accent/20 rounded-full blur-2xl" />
            <div className="relative p-[2px] rounded-full bg-gradient-to-br from-accent/70 via-accent/30 to-accent/70">
              <img
                src={profile}
                alt="Kranthi Kiran"
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full object-cover mx-auto border-[3px] border-background"
              />
            </div>
          </div>
        </div>

        <div className="mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-card/30 backdrop-blur text-xs font-medium text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Currently at GitHub · Microsoft
          </span>
        </div>

        <h1
          className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-4 animate-fade-in-up"
          style={{ animationDelay: '0.2s', fontWeight: 600 }}
        >
          Hey, I'm <span className="text-gradient-violet">Kranthi</span>
        </h1>

        <h2
          className="font-heading text-lg sm:text-xl md:text-2xl text-muted-foreground mb-5 animate-fade-in-up"
          style={{ animationDelay: '0.3s', fontWeight: 500 }}
        >
          <TypingText
            phrases={['Cloud Engineer', 'Infrastructure Builder', 'Distributed Systems Nerd', 'GitHub Engineer']}
            typingSpeed={120}
            deletingSpeed={60}
            pauseDuration={2500}
          />
        </h2>

        <p className="font-body text-base md:text-lg text-muted-foreground/90 max-w-2xl mx-auto mb-8 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.4s' }}>
          I build reliable infrastructure, tame distributed systems,
          and craft tools that make engineering teams more productive.
        </p>

        <div className="flex flex-wrap gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <button
            onClick={onResumeClick}
            data-resume-btn
            className="px-5 py-2.5 rounded-md bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            View Resume
          </button>
          <a
            href="#connect"
            className="px-5 py-2.5 rounded-md border border-border/80 text-foreground font-medium text-sm hover:bg-muted/40 transition-colors"
          >
            Get in Touch →
          </a>
        </div>

        <div className="mt-7 flex flex-wrap gap-2 justify-center animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          <button
            onClick={() => { window.location.hash = '#/collab'; window.location.reload() }}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/70 bg-card/40 backdrop-blur text-[12px] font-medium text-foreground hover:border-accent/50 hover:bg-accent/5 transition-colors"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
            </span>
            Collab — code &amp; battle
            <span className="text-muted-foreground group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
          <button
            onClick={() => { window.location.hash = '#/stranger'; window.location.reload() }}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium text-foreground transition-all"
            style={{
              background: 'color-mix(in oklab, var(--chart-2) 12%, transparent)',
              boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-2) 35%, transparent), 0 0 18px -6px color-mix(in oklab, var(--chart-2) 45%, transparent)',
            }}
          >
            <span className="px-1 py-px rounded text-[8.5px] font-bold uppercase tracking-wider"
              style={{ background: 'color-mix(in oklab, var(--chart-2) 35%, transparent)', color: 'oklch(95% 0.05 320)' }}>
              New
            </span>
            Stranger Chat
            <span className="text-muted-foreground group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>

        {/* Scroll hint */}
        <div className="mt-10 text-[10px] font-mono tracking-[0.3em] text-muted-foreground/50 animate-pulse">
          ↓ SCROLL TO ENTER THE COSMOS
        </div>
      </div>

      {/* ═════════ COSMOS PHASE: universe + explore CTA ═════════ */}
      <div
        className="absolute inset-0 z-10 flex items-center justify-center px-6 transition-all duration-[1500ms] ease-out pointer-events-none"
        style={{
          opacity: isIntro ? 0 : 1,
          transform: isIntro ? 'translateY(30px) scale(0.92)' : 'translateY(0) scale(1)',
        }}
      >
        <div className="text-center max-w-2xl pointer-events-auto">
          <div className="text-[10px] font-mono tracking-[0.5em] text-violet-300/50 mb-3">
            ─── WELCOME TO MY UNIVERSE ───
          </div>

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
