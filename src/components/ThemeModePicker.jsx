import React, { useState, useEffect } from 'react'

const THEMES = [
  { id: 'default', name: 'Default', desc: 'Clean blue', color: '#60a5fa', icon: '💎' },
  { id: 'fightclub', name: 'Fight Club', desc: 'Gritty, raw, red', color: '#dc2626', icon: '🥊' },
  { id: 'f1', name: 'F1 Racing', desc: 'Carbon, neon red', color: '#e10600', icon: '🏎️' },
  { id: 'cyberpunk', name: 'Cyberpunk', desc: 'Neon purple/cyan', color: '#00f0ff', icon: '🌆' },
  { id: 'vintage', name: 'Vintage', desc: 'Sepia, warm paper', color: '#b8860b', icon: '📜' },
  { id: 'ocean', name: 'Ocean', desc: 'Deep blue, calm', color: '#06b6d4', icon: '🌊' },
  { id: 'dracula', name: 'Dracula', desc: 'Purple dark theme', color: '#bd93f9', icon: '🧛' },
]

function applyTheme(id) {
  THEMES.forEach(t => document.documentElement.classList.remove(`theme-${t.id}`))
  if (id !== 'default') {
    document.documentElement.classList.add(`theme-${id}`)
    if (id !== 'vintage') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }
  localStorage.setItem('site_theme_mode', id)
}

function getCurrentTheme() {
  return localStorage.getItem('site_theme_mode') || 'default'
}

// Apply saved theme on load
const saved = getCurrentTheme()
if (saved !== 'default') {
  THEMES.forEach(t => document.documentElement.classList.remove(`theme-${t.id}`))
  document.documentElement.classList.add(`theme-${saved}`)
  if (saved !== 'vintage') document.documentElement.classList.add('dark')
}

export default function ThemeModePicker() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(getCurrentTheme)

  useEffect(() => {
    const handler = () => setOpen(o => !o)
    window.addEventListener('toggle-theme-modes', handler)
    return () => window.removeEventListener('toggle-theme-modes', handler)
  }, [])

  const selectTheme = (id) => {
    setActive(id)
    applyTheme(id)
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed right-4 left-4 sm:left-auto sm:right-4 top-16 sm:top-14 z-50 animate-fade-in-up sm:w-[260px]">
      <div className="rounded-2xl border border-border/30 bg-card shadow-2xl shadow-black/20 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-border/20">
          <span className="text-xs font-semibold text-foreground">🎨 Theme Mode</span>
        </div>

        {/* Theme list */}
        <div className="py-1 max-h-[360px] overflow-y-auto">
          {THEMES.map(t => {
            const isActive = active === t.id
            return (
              <button
                key={t.id}
                onClick={() => selectTheme(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  isActive ? 'bg-accent/10' : 'hover:bg-muted/50'
                }`}
              >
                <span className="text-base">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-medium ${isActive ? 'text-accent' : 'text-foreground'}`}>{t.name}</p>
                  <p className="text-[10px] text-muted-foreground/50">{t.desc}</p>
                </div>
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: t.color }} />
                {isActive && (
                  <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
