import React from 'react'
import TypingText from './TypingText'

export default function Hero() {
  return (
    <section id="home" className="min-h-[60vh] flex items-center pt-16">
      <div className="max-w-6xl mx-auto px-6 py-20 text-center">
        <p className="font-mono text-sm text-accent mb-4 animate-fade-in-up">
          Welcome to my portfolio
        </p>
        <h1 className="font-heading font-bold text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          Hey, I'm{' '}
          <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent animate-gradient">
            Kranthi
          </span>
        </h1>
        <h2 className="font-heading text-2xl sm:text-3xl text-accent mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <TypingText
            phrases={['Cloud Engineer', 'Infrastructure Builder', 'Distributed Systems Nerd', 'GitHub Engineer']}
            typingSpeed={120}
            deletingSpeed={60}
            pauseDuration={2500}
          />
        </h2>
        <div className="flex flex-wrap gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <a
            href="#about"
            className="px-6 py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover-lift shadow-lg transition-all"
          >
            Learn More
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
