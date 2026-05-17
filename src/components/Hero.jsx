import React, { Suspense, lazy } from 'react'
import profile from '../../assets/profile.png'
import TypingText from './TypingText'

const SpaceBackground = lazy(() => import('./SpaceBackground'))

export default function Hero({ onResumeClick }) {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-16 md:pt-20 overflow-hidden">
      {/* 3D Solar System background — full-bleed behind hero */}
      <Suspense fallback={null}>
        <div className="absolute inset-0 z-0">
          <SpaceBackground />
        </div>
      </Suspense>

      {/* Soft fade-to-black on the LEFT half (desktop) so text reads clearly without blocking the universe */}
      <div className="absolute inset-y-0 left-0 w-full lg:w-[58%] z-[1] pointer-events-none hidden lg:block"
        style={{
          background: 'linear-gradient(to right, rgba(2,0,12,0.85) 0%, rgba(2,0,12,0.6) 50%, transparent 100%)',
        }}
      />
      {/* Mobile: full subtle vignette so centered content still reads */}
      <div className="absolute inset-0 z-[1] pointer-events-none lg:hidden"
        style={{ background: 'radial-gradient(ellipse at center, rgba(2,0,12,0.4) 30%, transparent 80%)' }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 md:py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-center">
          {/* Content column — left on desktop, centered on mobile */}
          <div className="lg:col-span-7 text-center lg:text-left">
            {/* Profile — purple cosmic ring */}
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

            {/* Status badge */}
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

            {/* Headline */}
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

            <p className="font-body text-base md:text-lg text-white/70 max-w-xl lg:max-w-xl mx-auto lg:mx-0 mb-8 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.4s' }}>
              I build reliable infrastructure, tame distributed systems,
              and craft tools that make engineering teams more productive.
            </p>

            {/* Primary CTAs */}
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

            {/* Secondary action chips */}
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
              <button
                onClick={() => { window.location.hash = '#/space'; window.location.reload() }}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-amber-100 transition-all hover:scale-[1.03]"
                style={{
                  background: 'rgba(251,191,36,0.1)',
                  border: '1px solid rgba(251,191,36,0.35)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 0 18px -6px rgba(251,191,36,0.5)',
                }}
              >
                <span>🪐</span>
                Explore the Solar System
                <span className="text-amber-300/60 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>
          </div>

          {/* Right column — empty on desktop, just lets the solar system breathe */}
          <div className="hidden lg:block lg:col-span-5">
            {/* Caption hint over the solar system */}
            <div className="text-right pr-4 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
              <div className="text-[10px] font-mono tracking-[0.4em] text-violet-300/40 mb-1">↘ LIVE SOLAR SYSTEM</div>
              <div className="text-xs text-white/30">Watch planets orbit · click 🪐 above to explore</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

