import React from 'react'
import profile from '../../assets/profile.png'
import satellite from '../../assets/satellite-collage.png'
import TypingText from './TypingText'

export default function Hero({ onResumeClick }) {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-24 md:pt-28 overflow-hidden">
      {/* Satellite backdrop — starts below both navbar lines */}
      <div className="absolute inset-x-0 top-24 md:top-28 h-[30%] md:h-[35%] z-0 overflow-hidden">
        <img
          src={satellite}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center opacity-10 dark:opacity-20"
        />
        {/* Gradient fade at bottom edge */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        {/* Side fades */}
        <div className="absolute inset-y-0 left-0 w-10 sm:w-20 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute inset-y-0 right-0 w-10 sm:w-20 bg-gradient-to-l from-background to-transparent" />
        {/* Top fade so it blends with navbar area */}
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-6 md:py-8 lg:py-12 text-center w-full">
        {/* Profile Photo — sits at the split point */}
        <div className="mb-3 md:mb-5 lg:mb-6 animate-fade-in-up">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-gradient-to-br from-accent/30 to-primary/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative p-1 rounded-full bg-gradient-to-br from-accent via-primary to-accent animate-float">
              <img
                src={profile}
                alt="Kranthi Kiran"
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 2xl:w-40 2xl:h-40 rounded-full object-cover shadow-2xl mx-auto border-4 border-background"
              />
            </div>
          </div>
        </div>

        <h1 className="font-heading font-bold text-3xl sm:text-4xl md:text-4xl lg:text-5xl 2xl:text-6xl leading-tight mb-2 md:mb-3 lg:mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Hey, I'm{' '}
          <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent animate-gradient">
            Kranthi
          </span>
        </h1>
        <h2 className="font-heading text-base sm:text-lg md:text-xl lg:text-2xl text-accent mb-3 md:mb-4 lg:mb-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <TypingText
            phrases={['Cloud Engineer', 'Infrastructure Builder', 'Distributed Systems Nerd', 'GitHub Engineer']}
            typingSpeed={120}
            deletingSpeed={60}
            pauseDuration={2500}
          />
        </h2>
        <p className="font-body text-sm md:text-base text-muted-foreground max-w-2xl mx-auto mb-3 md:mb-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          I love building reliable infrastructure, taming distributed systems,
          and crafting tools that make engineering teams more productive.
        </p>
        <div className="flex items-center justify-center gap-2 mb-4 md:mb-5 lg:mb-6 animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground">Currently at</span>
          <span className="font-semibold text-xs sm:text-sm bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            GitHub | Microsoft
          </span>
        </div>
        <div className="flex flex-wrap gap-3 md:gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <button
            onClick={onResumeClick}
            data-resume-btn
            className="px-5 py-2.5 md:px-6 md:py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm md:text-base hover-lift shadow-lg transition-all"
          >
            View Resume
          </button>
          <a
            href="#connect"
            className="px-5 py-2.5 md:px-6 md:py-3 rounded-xl border-2 border-primary text-primary font-semibold text-sm md:text-base hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all hover-lift"
          >
            Get in Touch
          </a>
        </div>

        {/* Code features CTA */}
        <div className="mt-4 md:mt-5 lg:mt-6 flex flex-wrap gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          <button
            onClick={() => { window.location.hash = '#/collab'; window.location.reload() }}
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 md:px-6 md:py-3 rounded-2xl bg-foreground text-background font-bold text-xs md:text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            <span>👥</span>
            <span>Open Collab — Code &amp; Battle</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
            <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold shadow-md animate-pulse">LIVE</span>
          </button>
        </div>
        <p className="text-[10px] md:text-xs text-muted-foreground/40 mt-2 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>collaborate live, or race a friend in 1v1 battle mode — all in your browser</p>
      </div>
    </section>
  )
}
