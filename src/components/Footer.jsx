import React from 'react'
import { SystemStatusPill } from './SystemStatus'

const links = [
  { label: 'GitHub', href: 'https://github.com/kranthi0003', icon: '🐙' },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/akkiran003', icon: '💼' },
  { label: 'X', href: 'https://x.com/kranthikiran03', icon: '𝕏' },
  { label: 'Email', href: 'mailto:kranthikiranakkumahanthi@gmail.com', icon: '✉️' },
]

export default function Footer() {
  return (
    <footer className="py-12 mt-10">
      <div className="site-container">
        <div className="surface-card rounded-[1.75rem] px-5 py-6 sm:px-7 flex flex-col sm:flex-row items-center justify-between gap-6">

          {/* Left — branding */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-accent text-accent-foreground flex items-center justify-center font-heading font-semibold text-sm shadow-lg shadow-accent/20">
              KK
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Kranthi Kiran</p>
              <p className="text-[11px] text-muted-foreground">Cloud reliability · GitHub</p>
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
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title={l.label}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right — meta */}
          <div className="text-center sm:text-right">
            <div className="flex sm:justify-end mb-1.5">
              <SystemStatusPill />
            </div>
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
