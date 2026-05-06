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
  // Remove all theme classes
  THEMES.forEach(t => document.documentElement.classList.remove(`theme-${t.id}`))
  // Apply new theme (skip default — it uses base CSS)
  if (id !== 'default') {
    document.documentElement.classList.add(`theme-${id}`)
    // Ensure dark mode for themed modes (except vintage)
    if (id !== 'vintage') document.documentElement.classList.add('dark')
  }
  localStorage.setItem('site_theme_mode', id)
}

function getCurrentTheme() {
  return localStorage.getItem('site_theme_mode') || 'default'
}

export default function ThemeModePicker() {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(getCurrentTheme)

  useEffect(() => {
    const handler = () => setOpen(o => !o)
    window.addEventListener('toggle-theme-modes', handler)
    return () => window.removeEventListener('toggle-theme-modes', handler)
  }, [])

  // Apply saved theme on mount
  useEffect(() => {
    const saved = getCurrentTheme()
    if (saved !== 'default') applyTheme(saved)
  }, [])

  const selectTheme = (id) => {
    setActive(id)
    applyTheme(id)
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-md" onClick={() => setOpen(false)} />
      <div className="fixed top-[10%] left-1/2 -translate-x-1/2 z-[151] w-[440px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        style={{ background: 'rgba(18,18,24,0.95)', animation: 'theme-in 0.25s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-white text-base font-semibold">🎨 Theme Modes</h2>
            <p className="text-[11px] text-white/30 mt-0.5">Change the entire site vibe</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Theme grid */}
        <div className="p-4 grid grid-cols-2 gap-2">
          {THEMES.map(t => {
            const isActive = active === t.id
            return (
              <button
                key={t.id}
                onClick={() => selectTheme(t.id)}
                className={`relative flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? 'border-white/30 bg-white/10 shadow-lg'
                    : 'border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10'
                }`}
              >
                {/* Color dot */}
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: t.color + '20' }}>
                  {t.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{t.name}</p>
                  <p className="text-[10px] text-white/30">{t.desc}</p>
                </div>
                {isActive && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: t.color }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 border-t border-white/5 text-center">
          <span className="text-[10px] text-white/20">Saved in localStorage · persists across visits</span>
        </div>
      </div>

      <style>{`
        @keyframes theme-in {
          from { opacity: 0; transform: translateX(-50%) scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}
