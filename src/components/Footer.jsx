import React from 'react'

const links = [
  { label: 'GitHub', href: 'https://github.com/kranthi0003', icon: '🐙' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/akkiran003', icon: '💼' },
  { label: 'X', href: 'https://x.com/kranthikiran03', icon: '𝕏' },
  { label: 'Email', href: 'mailto:kranthikiranakkumahanthi@gmail.com', icon: '✉️' },
]

export default function Footer() {
  return (
    <footer className="py-10 border-t border-border/60 mt-10">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">

          {/* Left — branding */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-heading font-semibold text-xs">
              KK
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Kranthi Kiran</p>
              <p className="text-[11px] text-muted-foreground">SE-III · GitHub</p>
            </div>
          </div>

          {/* Center — social links */}
          <div className="flex items-center gap-2">
            {links.map(l => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                title={l.label}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right — meta */}
          <div className="text-center sm:text-right">
            <p className="text-[11px] text-muted-foreground/70">
              © {new Date().getFullYear()} · React + Tailwind + Vite
            </p>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">
              AI by Groq · Globe by Three.js · GitHub Pages
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
