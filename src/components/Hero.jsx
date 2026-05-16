import React from 'react'
import profile from '../../assets/profile.png'
import satellite from '../../assets/satellite-collage.png'
import TypingText from './TypingText'

export default function Hero({ onResumeClick }) {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-16 md:pt-20 overflow-hidden">
      {/* Satellite backdrop — subtle band */}
      <div className="absolute inset-x-0 top-14 md:top-14 h-[28%] md:h-[32%] z-0 overflow-hidden pointer-events-none">
        <img
          src={satellite}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center opacity-[0.07] dark:opacity-[0.14]"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute inset-y-0 left-0 w-10 sm:w-20 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute inset-y-0 right-0 w-10 sm:w-20 bg-gradient-to-l from-background to-transparent" />
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-6 md:py-8 lg:py-12 text-center w-full">
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

        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          <button
            onClick={() => { window.location.hash = '#/collab'; window.location.reload() }}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border/70 bg-card/40 backdrop-blur text-sm font-medium text-foreground hover:border-accent/50 hover:bg-accent/5 transition-colors"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
            </span>
            Open Collab — code &amp; battle live
            <span className="text-muted-foreground group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>
      </div>
    </section>
  )
}

