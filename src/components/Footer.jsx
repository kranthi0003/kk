import React from 'react'

const links = [
  { label: 'GitHub', href: 'https://github.com/kranthi0003', icon: '🐙' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/akkiran003', icon: '💼' },
  { label: 'X', href: 'https://x.com/kranthikiran03', icon: '𝕏' },
  { label: 'Email', href: 'mailto:kranthikiranakkumahanthi@gmail.com', icon: '✉️' },
]

export default function Footer() {
  return (
    <footer className="py-10 border-t border-border/20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          
          {/* Left — branding */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-accent-foreground font-heading font-bold text-xs">
              KK
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Kranthi Kiran</p>
              <p className="text-[10px] text-muted-foreground font-mono">SE-III @ GitHub</p>
            </div>
          </div>

          {/* Center — social links */}
          <div className="flex items-center gap-4">
            {links.map(l => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                title={l.label}
              >
                {l.icon}
              </a>
            ))}
          </div>

          {/* Right — meta */}
          <div className="text-center sm:text-right">
            <p className="text-[10px] font-mono text-muted-foreground/50">
              © {new Date().getFullYear()} · Built with React + Tailwind + Vite
            </p>
            <p className="text-[9px] font-mono text-muted-foreground/30 mt-0.5">
              AI by Groq · Globe by Three.js · Hosted on GitHub Pages
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
