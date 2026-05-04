import React from 'react'
import profile from '../../assets/profile.png'
import TypingText from './TypingText'

export default function Hero() {
  return (
    <section id="home" className="min-h-screen flex items-center pt-16">
      <div className="max-w-6xl mx-auto px-6 py-20 flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
        {/* Text */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl leading-tight mb-6 animate-fade-in-up">
            Hey, I'm{' '}
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent animate-gradient">
              Kranthi
            </span>
          </h1>
          <h2 className="font-heading text-2xl sm:text-3xl text-accent mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <TypingText
              phrases={['Cloud Engineer', 'Infrastructure Builder', 'Distributed Systems Nerd', 'GitHub Engineer']}
              typingSpeed={120}
              deletingSpeed={60}
              pauseDuration={2500}
            />
          </h2>
          <p className="font-body text-lg text-muted-foreground max-w-xl mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            I break things, fix them, and make them faster ⚡ 4+ years wrangling servers at Amazon, Couchbase,
            and GitHub. Big fan of making slow things go brrr and building infra that doesn't page me at 3am.
          </p>
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
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

        {/* Profile Image */}
        <div className="flex-shrink-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-accent/20 to-primary/10 rounded-full blur-2xl" />
            <img
              src={profile}
              alt="Kranthi Kiran"
              className="relative w-56 h-56 sm:w-72 sm:h-72 lg:w-80 lg:h-80 rounded-full object-cover shadow-2xl ring-4 ring-border/50 animate-float"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
