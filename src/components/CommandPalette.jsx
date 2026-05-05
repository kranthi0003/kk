import React, { useState, useEffect, useRef, useMemo } from 'react'

const ACTIONS = [
  // Sections
  { id: 'home', label: 'Go to Home', section: 'Navigate', icon: '🏠', action: () => scrollTo('home') },
  { id: 'terminal', label: 'Go to Terminal', section: 'Navigate', icon: '💻', action: () => scrollTo('terminal') },
  { id: 'experience', label: 'Go to Experience', section: 'Navigate', icon: '💼', action: () => scrollTo('experience') },
  { id: 'techstack', label: 'Go to Tech Stack', section: 'Navigate', icon: '🛠️', action: () => scrollTo('techstack') },
  { id: 'certs', label: 'Go to Certifications', section: 'Navigate', icon: '🎓', action: () => scrollTo('certifications') },
  { id: 'about', label: 'Go to About', section: 'Navigate', icon: '👤', action: () => scrollTo('about') },
  { id: 'projects', label: 'Go to Projects', section: 'Navigate', icon: '🚀', action: () => scrollTo('projects') },
  { id: 'travel', label: 'Go to Travel Map', section: 'Navigate', icon: '🌍', action: () => scrollTo('travel') },
  { id: 'connect', label: 'Go to Connect', section: 'Navigate', icon: '📬', action: () => scrollTo('connect') },
  { id: 'guestbook', label: 'Go to Guestbook', section: 'Navigate', icon: '📝', action: () => scrollTo('guestbook') },

  // Actions
  { id: 'theme', label: 'Toggle Dark/Light Mode', section: 'Actions', icon: '🌓', action: () => {
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  }},
  { id: 'resume', label: 'Open Resume', section: 'Actions', icon: '📄', action: 'resume' },
  { id: 'top', label: 'Scroll to Top', section: 'Actions', icon: '⬆️', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
  { id: 'bottom', label: 'Scroll to Bottom', section: 'Actions', icon: '⬇️', action: () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }) },

  // Links
  { id: 'github', label: 'GitHub Profile', section: 'Links', icon: '🐙', action: () => window.open('https://github.com/kranthi0003', '_blank') },
  { id: 'linkedin', label: 'LinkedIn Profile', section: 'Links', icon: '💼', action: () => window.open('https://linkedin.com/in/akkiran003', '_blank') },
  { id: 'twitter', label: 'X / Twitter', section: 'Links', icon: '𝕏', action: () => window.open('https://x.com/kranthikiran03', '_blank') },
  { id: 'email', label: 'Send Email', section: 'Links', icon: '✉️', action: () => window.open('mailto:kranthikiranakkumahanthi@gmail.com') },

  // Projects
  { id: 'p-sketchgate', label: 'SketchGate — Rate Limiter', section: 'Projects', icon: '⚡', action: () => window.open('https://github.com/kranthi0003/SketchGate', '_blank') },
  { id: 'p-site', label: 'Portfolio Source Code', section: 'Projects', icon: '🌐', action: () => window.open('https://github.com/kranthi0003/kranthi-kiran-site', '_blank') },
]

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

export default function CommandPalette({ onResumeClick }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef()
  const listRef = useRef()

  // Open with Cmd+K / Ctrl+K / "/" key
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
        setQuery('')
        setSelected(0)
      }
      // "/" key opens palette — only when not in any editable element
      if (e.key === '/' && !open) {
        const tag = e.target.tagName
        const editable = e.target.isContentEditable
        if (!editable && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
          e.preventDefault()
          setOpen(true)
          setQuery('')
          setSelected(0)
        }
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const filtered = useMemo(() => {
    if (!query) return ACTIONS
    const q = query.toLowerCase()
    return ACTIONS.filter(a =>
      a.label.toLowerCase().includes(q) ||
      a.section.toLowerCase().includes(q) ||
      a.id.includes(q)
    )
  }, [query])

  // Group by section
  const grouped = useMemo(() => {
    const map = {}
    filtered.forEach(a => {
      if (!map[a.section]) map[a.section] = []
      map[a.section].push(a)
    })
    return map
  }, [filtered])

  const flatList = filtered

  useEffect(() => { setSelected(0) }, [query])

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${selected}"]`)
      if (el) el.scrollIntoView({ block: 'nearest' })
    }
  }, [selected])

  const execute = (action) => {
    setOpen(false)
    setQuery('')
    if (action.action === 'resume') {
      onResumeClick?.()
    } else if (typeof action.action === 'function') {
      action.action()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, flatList.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    else if (e.key === 'Enter' && flatList[selected]) { execute(flatList[selected]) }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Palette */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[101] w-[520px] max-w-[calc(100vw-2rem)] rounded-xl border border-border/40 bg-card shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/20">
          <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or jump to..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
          />
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-muted/50 text-muted-foreground border border-border/30">ESC</kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[320px] overflow-y-auto py-2">
          {flatList.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No results found</p>
          )}
          {Object.entries(grouped).map(([section, items]) => (
            <div key={section}>
              <p className="px-4 pt-2 pb-1 text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wider">{section}</p>
              {items.map((item) => {
                const idx = flatList.indexOf(item)
                return (
                  <button
                    key={item.id}
                    data-idx={idx}
                    onClick={() => execute(item)}
                    onMouseEnter={() => setSelected(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      idx === selected ? 'bg-accent/10 text-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span className="text-sm w-5 text-center flex-shrink-0">{item.icon}</span>
                    <span className="text-sm flex-1">{item.label}</span>
                    {idx === selected && (
                      <kbd className="text-[10px] font-mono text-muted-foreground/50">↵</kbd>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-border/20 flex items-center gap-4 text-[10px] font-mono text-muted-foreground/40">
          <span>↑↓ navigate</span>
          <span>↵ select</span>
          <span>esc close</span>
          <span className="ml-auto">Press / or ⌘K</span>
        </div>
      </div>
    </>
  )
}
