import React from 'react'
import profile from '../../assets/profile.png'
import TypingText from './TypingText'

export default function Hero() {
  return (
    <section id="home" className="min-h-screen flex items-center pt-16">
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        {/* Profile Photo */}
        <div className="mb-8 animate-fade-in-up">
          <div className="relative inline-block">
            <div className="absolute -inset-4 bg-gradient-to-br from-accent/20 to-primary/10 rounded-full blur-2xl" />
            <img
              src={profile}
              alt="Kranthi Kiran"
              className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full object-cover shadow-2xl ring-4 ring-border/50 animate-float mx-auto"
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
        <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          I break things, fix them, and make them faster ⚡ 4+ years wrangling servers at Amazon, Couchbase,
          and GitHub. Big fan of making slow things go brrr and building infra that doesn't page me at 3am.
        </p>
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
