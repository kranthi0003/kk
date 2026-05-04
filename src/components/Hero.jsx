import React from 'react'
import profile from '../../assets/profile.png'
import satellite from '../../assets/satellite-collage.png'
import TypingText from './TypingText'

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Satellite backdrop — covers top half */}
      <div className="absolute inset-x-0 top-0 h-1/2 z-0">
        <img
          src={satellite}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center"
        />
        {/* Hard cut: gradient fades satellite into page background at bottom edge */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
        {/* Subtle side fades */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background/80 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background/80 to-transparent" />
        {/* Dark overlay so text stays readable */}
        <div className="absolute inset-0 bg-background/40 dark:bg-background/60" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        {/* Profile Photo — sits at the split point */}
        <div className="mb-8 animate-fade-in-up">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-gradient-to-br from-accent/20 to-primary/10 rounded-full blur-2xl" />
            <img
              src={profile}
              alt="Kranthi Kiran"
              className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full object-cover shadow-2xl ring-4 ring-white/30 dark:ring-border/50 animate-float mx-auto"
            />
          </div>
        </div>

        <h1 className="font-heading font-bold text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Hey, I'm{' '}
          <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent animate-gradient">
            Kranthi
          </span>
        </h1>
        <h2 className="font-heading text-2xl sm:text-3xl text-accent mb-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
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
          <a
            href="assets/Kranthi_Resume.pdf"
            download
            className="px-6 py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover-lift shadow-lg transition-all"
          >
            Download Resume
          </a>
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
