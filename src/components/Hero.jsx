import React from 'react'
import profile from '../../assets/profile.png'
import satellite from '../../assets/satellite-collage.png'
import TypingText from './TypingText'

export default function Hero({ onResumeClick }) {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-28 overflow-hidden">
      {/* Satellite backdrop — starts below both navbar lines */}
      <div className="absolute inset-x-0 top-28 h-[35%] z-0 overflow-hidden">
        <img
          src={satellite}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center opacity-20 dark:opacity-20"
        />
        {/* Gradient fade at bottom edge */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        {/* Side fades */}
        <div className="absolute inset-y-0 left-0 w-10 sm:w-20 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute inset-y-0 right-0 w-10 sm:w-20 bg-gradient-to-l from-background to-transparent" />
        {/* Top fade so it blends with navbar area */}
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        {/* Profile Photo — sits at the split point */}
        <div className="mb-8 animate-fade-in-up">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-gradient-to-br from-accent/30 to-primary/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative p-1 rounded-full bg-gradient-to-br from-accent via-primary to-accent animate-float">
              <img
                src={profile}
                alt="Kranthi Kiran"
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full object-cover shadow-2xl mx-auto border-4 border-background"
              />
            </div>
          </div>
        </div>

        <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-7xl leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Hey, I'm{' '}
          <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent animate-gradient">
            Kranthi
          </span>
        </h1>
        <h2 className="font-heading text-xl sm:text-2xl lg:text-3xl text-accent mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <TypingText
            phrases={['Cloud Engineer', 'Infrastructure Builder', 'Distributed Systems Nerd', 'GitHub Engineer']}
            typingSpeed={120}
            deletingSpeed={60}
            pauseDuration={2500}
          />
        </h2>
        <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto mb-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          I love building reliable infrastructure, taming distributed systems,
          and crafting tools that make engineering teams more productive.
        </p>
        <div className="flex items-center justify-center gap-2 mb-8 animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-sm text-muted-foreground">Currently at</span>
          <span className="font-semibold text-sm bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            GitHub | Microsoft
          </span>
        </div>
        <div className="flex flex-wrap gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <button
            onClick={onResumeClick}
            data-resume-btn
            className="px-6 py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover-lift shadow-lg transition-all"
          >
            View Resume
          </button>
          <a
            href="#connect"
            className="px-6 py-3 rounded-xl border-2 border-primary text-primary font-semibold hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all hover-lift"
          >
            Get in Touch
          </a>
        </div>
      </div>
    </section>
  )
}
