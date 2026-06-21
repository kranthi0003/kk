import React from 'react'
import profile from '../../assets/profile.png'
import TypingText from './TypingText'

export default function Hero({ onResumeClick }) {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-16 md:pt-20 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-6 md:py-10 lg:py-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-10 lg:gap-16 items-center">

          {/* ─── LEFT: Portrait + socials ─── */}
          <div className="flex flex-col items-center lg:items-start animate-fade-in-up">
            <div className="relative">
              <img
                src={profile}
                alt="Kranthi Kiran"
                className="w-[280px] h-[340px] sm:w-[320px] sm:h-[380px] lg:w-[340px] lg:h-[420px] object-cover rounded-2xl shadow-xl"
              />
              <div className="absolute bottom-3 left-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-background/95 backdrop-blur text-xs font-medium text-foreground shadow-md border border-border/40">
                  Kranthi
                </span>
              </div>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-5 mt-5 text-muted-foreground">
              <a href="https://linkedin.com/in/kranthi0003" target="_blank" rel="noopener noreferrer"
                 aria-label="LinkedIn"
                 className="hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a href="https://github.com/kranthi0003" target="_blank" rel="noopener noreferrer"
                 aria-label="GitHub"
                 className="hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
              </a>
              <a href="https://twitter.com/kranthikiran003" target="_blank" rel="noopener noreferrer"
                 aria-label="Twitter"
                 className="hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
            </div>
          </div>

          {/* ─── RIGHT: name, role, description, CTAs ─── */}
          <div className="text-center lg:text-left">
            {/* Status pill */}
            <div className="mb-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-card/30 backdrop-blur text-xs font-medium text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Currently at GitHub · Microsoft
              </span>
            </div>

            <h1
              className="font-heading text-5xl sm:text-6xl lg:text-7xl mb-3 animate-fade-in-up"
              style={{
                animationDelay: '0.2s',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                lineHeight: 1.08,
              }}
            >
              Hey, I'm Kranthi
            </h1>

            <h2
              className="font-heading text-xl sm:text-2xl lg:text-3xl mb-6 animate-fade-in-up"
              style={{ animationDelay: '0.3s', fontWeight: 400, fontStyle: 'italic', color: 'var(--color-accent)' }}
            >
              <TypingText
                phrases={['Cloud engineer', 'Distributed systems', 'Builder of quiet, reliable things', 'Forever a student']}
                typingSpeed={120}
                deletingSpeed={60}
                pauseDuration={2600}
              />
            </h2>

            <p className="font-body text-base md:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.4s' }}>
              I build the quiet infrastructure beneath things that can't afford to fail.
              To me, reliability is a craft — patient, unglamorous, and quietly human.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start items-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <a href="#connect" className="btn-primary">
                Work Together
                <span className="btn-arrow-circle">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </a>
              <a href="#projects" className="btn-secondary">
                Projects
                <span className="btn-arrow-circle">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </a>
              <button onClick={onResumeClick} data-resume-btn className="btn-outline">
                Resume
              </button>
            </div>

            {/* Secondary pills */}
            <div className="mt-7 flex flex-wrap gap-2 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
              <button
                onClick={() => { window.location.hash = '#/collab'; window.location.reload() }}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/70 bg-card/40 backdrop-blur text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-accent/40 transition-colors"
              >
                Collab — code &amp; battle
                <span className="opacity-50 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
              <button
                onClick={() => { window.location.hash = '#/stranger'; window.location.reload() }}
                className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/70 bg-card/40 backdrop-blur text-[12px] font-medium text-muted-foreground hover:text-foreground hover:border-accent/40 transition-colors"
              >
                Stranger Chat
                <span className="opacity-50 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scroll down arrow */}
        <div className="flex justify-center mt-14 lg:mt-16 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
          <a href="#about" aria-label="scroll down" className="text-muted-foreground/60 hover:text-foreground transition-colors">
            <svg className="w-6 h-6 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
