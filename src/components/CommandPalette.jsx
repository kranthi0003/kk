import React, { useState, useEffect, useRef, useMemo } from 'react'

const ACTIONS = [
  // Navigate — all site sections
  { id: 'home', label: 'Home', desc: 'Go to top / hero', section: 'Navigate', icon: '🏠', action: () => scrollTo('home'), keywords: 'top hero start landing intro welcome banner' },
  { id: 'experience', label: 'Experience', desc: 'Work history & career', section: 'Navigate', icon: '💼', action: () => scrollTo('experience'), keywords: 'work career jobs amazon groww couchbase github microsoft companies employment history resume timeline' },
  { id: 'techstack', label: 'Skills & Certifications', desc: 'Tech stack & credentials', section: 'Navigate', icon: '🛠️', action: () => scrollTo('techstack'), keywords: 'tech stack tools skills certifications credentials certificates aws azure kubernetes docker java python react node javascript typescript go rust' },
  { id: 'about', label: 'About', desc: 'Bio, Spotify, clock, Instagram', section: 'Navigate', icon: '👤', action: () => scrollTo('about'), keywords: 'bio me info profile personal about bento grid spotify clock instagram quote stats currently' },
  { id: 'terminal', label: 'Terminal', desc: 'AI shell translator & games', section: 'Navigate', icon: '💻', action: () => scrollTo('terminal'), keywords: 'cli shell ai terminal command translate linux bash zsh powershell architecture diagram design system' },
  { id: 'projects', label: 'Projects', desc: 'Things I built', section: 'Navigate', icon: '🚀', action: () => scrollTo('projects'), keywords: 'work built apps portfolio deploydiff cronexplain strangerchat sketchgate rate limiter' },
  { id: 'travel', label: 'Travel Map', desc: '3D interactive globe', section: 'Navigate', icon: '🌍', action: () => scrollTo('travel'), keywords: 'globe map cities travel world countries visited places 3d earth geography' },
  { id: 'connect', label: 'Connect', desc: 'Contact form & socials', section: 'Navigate', icon: '📬', action: () => scrollTo('connect'), keywords: 'contact email hire reach out message form social connect touch' },
  { id: 'guestbook', label: 'Guestbook', desc: 'Leave a message', section: 'Navigate', icon: '📝', action: () => scrollTo('guestbook'), keywords: 'messages notes sign guestbook visitor wall comment feedback' },

  // Navbar features — toggleable panels
  { id: 'bitcoin-wallet', label: 'Bitcoin Wallet', desc: 'Open BTC wallet tracker', section: 'Features', icon: '₿', action: () => {
    document.querySelector('[data-wallet-btn]')?.click()
  }, keywords: 'bitcoin btc crypto wallet blockchain cryptocurrency money balance satoshi ethereum web3 finance' },
  { id: 'spotify-player', label: 'Spotify Player', desc: 'Now playing / embed', section: 'Features', icon: '🎵', action: () => {
    document.querySelector('[data-spotify-btn]')?.click()
  }, keywords: 'spotify music player song playing listening audio playlist track album' },
  { id: 'status-monitor', label: 'Status Monitor', desc: 'Site health & ECG heartbeat', section: 'Features', icon: '💚', action: () => {
    document.querySelector('[data-status-btn]')?.click()
  }, keywords: 'status monitor health heartbeat ecg uptime latency performance ping fcp metrics memory' },
  { id: 'ai-chatbot', label: 'AI Chatbot', desc: 'Ask anything about Kranthi', section: 'Features', icon: '🤖', action: () => {
    document.querySelector('[data-chatbot-btn]')?.click()
  }, keywords: 'ai chatbot bot assistant ask question help chat llm groq llama artificial intelligence conversation' },
  { id: 'boot-replay', label: 'Replay Boot Sequence', desc: 'Watch the neofetch intro again', section: 'Features', icon: '🖥️', action: () => {
    sessionStorage.removeItem('boot_seen')
    window.location.reload()
  }, keywords: 'boot loader startup intro neofetch terminal loading animation sequence replay reboot' },
  { id: 'matrix-easter', label: 'Matrix Easter Egg', desc: 'Konami code → matrix rain', section: 'Features', icon: '🟢', action: () => {
    window.dispatchEvent(new CustomEvent('trigger-matrix'))
  }, keywords: 'matrix easter egg konami code hidden secret rain animation green neo' },

  // Quick Info
  { id: 'who', label: 'SE-III at GitHub | Microsoft', desc: 'Current role', section: 'Quick Info', icon: '👋', action: () => scrollTo('home'), keywords: 'who kranthi role what does he do software engineer title position job designation' },
  { id: 'location', label: 'Visakhapatnam, India', desc: 'Location', section: 'Quick Info', icon: '📍', action: () => scrollTo('about'), keywords: 'where location city country vizag andhra pradesh india address based' },
  { id: 'email-info', label: 'Copy Email', desc: 'kranthikiranakkumahanthi@gmail.com', section: 'Quick Info', icon: '✉️', action: () => { navigator.clipboard.writeText('kranthikiranakkumahanthi@gmail.com'); }, keywords: 'email address copy contact gmail mail' },
  { id: 'exp-years', label: '4+ Years Experience', desc: 'Amazon → Groww → Couchbase → GitHub', section: 'Quick Info', icon: '📊', action: () => scrollTo('experience'), keywords: 'experience years companies worked sde swe engineer total how long' },
  { id: 'education', label: 'GITAM University', desc: 'B.Tech Computer Science', section: 'Quick Info', icon: '🎓', action: () => scrollTo('about'), keywords: 'education college university degree btech computer science gitam school study' },

  // Actions
  { id: 'theme', label: 'Toggle Theme', desc: 'Switch dark/light mode', section: 'Actions', icon: '🌓', action: () => {
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light')
  }, keywords: 'dark light mode switch theme toggle night day appearance color scheme' },
  { id: 'resume', label: 'Open Resume', desc: 'View CV / PDF', section: 'Actions', icon: '📄', action: 'resume', keywords: 'resume cv pdf download curriculum vitae document hire' },
  { id: 'top', label: 'Scroll to Top', desc: 'Back to start', section: 'Actions', icon: '⬆️', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }), keywords: 'top start beginning scroll up back' },
  { id: 'share', label: 'Copy Site Link', desc: 'kranthikiran.com', section: 'Actions', icon: '🔗', action: () => { navigator.clipboard.writeText('https://kranthikiran.com'); }, keywords: 'share copy link url website clipboard send' },
  { id: 'print', label: 'Print Page', desc: 'Save as PDF', section: 'Actions', icon: '🖨️', action: () => window.print(), keywords: 'print save pdf export page' },

  // Terminal AI features
  { id: 'shell-translate', label: 'Shell Translator', desc: 'English → shell commands', section: 'AI Tools', icon: '🔄', action: () => { scrollTo('terminal'); setTimeout(() => typeInTerminal('list all docker containers'), 500) }, keywords: 'shell translate command english natural language linux bash terminal ai convert' },
  { id: 'arch-diagram', label: 'Architecture Diagrams', desc: 'Type "design twitter" in terminal', section: 'AI Tools', icon: '📐', action: () => { scrollTo('terminal'); setTimeout(() => typeInTerminal('design twitter'), 500) }, keywords: 'architecture diagram design system twitter uber netflix spotify ascii draw generate' },

  // Games
  { id: 'g-snake', label: 'Snake', desc: 'Classic snake game', section: 'Games', icon: '🐍', action: () => { scrollTo('terminal'); setTimeout(() => typeInTerminal('play snake'), 500) }, keywords: 'snake game play arcade retro classic fun' },
  { id: 'g-ttt', label: 'Tic-Tac-Toe', desc: 'X vs O', section: 'Games', icon: '❌', action: () => { scrollTo('terminal'); setTimeout(() => typeInTerminal('play ttt'), 500) }, keywords: 'tictactoe tic tac toe game play noughts crosses xo' },
  { id: 'g-wordle', label: 'Wordle', desc: 'Guess the tech word', section: 'Games', icon: '🟩', action: () => { scrollTo('terminal'); setTimeout(() => typeInTerminal('play wordle'), 500) }, keywords: 'wordle guess word game play puzzle daily letters' },
  { id: 'g-memory', label: 'Memory', desc: 'Match the emoji cards', section: 'Games', icon: '🃏', action: () => { scrollTo('terminal'); setTimeout(() => typeInTerminal('play memory'), 500) }, keywords: 'memory match game play cards pairs flip concentration brain' },

  // Links
  { id: 'github', label: 'GitHub', desc: '@kranthi0003', section: 'Links', icon: '🐙', action: () => window.open('https://github.com/kranthi0003', '_blank'), keywords: 'github code repos repositories open source contributions profile' },
  { id: 'linkedin', label: 'LinkedIn', desc: 'akkiran003', section: 'Links', icon: '💼', action: () => window.open('https://linkedin.com/in/akkiran003', '_blank'), keywords: 'linkedin profile professional network career social connect' },
  { id: 'twitter', label: 'X / Twitter', desc: '@kranthikiran03', section: 'Links', icon: '𝕏', action: () => window.open('https://x.com/kranthikiran03', '_blank'), keywords: 'twitter x social media tweets posts feed' },
  { id: 'instagram', label: 'Instagram', desc: '@kranthikiran03', section: 'Links', icon: '📸', action: () => window.open('https://instagram.com/kranthikiran03', '_blank'), keywords: 'instagram insta photos stories reels social media pictures' },
  { id: 'email-link', label: 'Send Email', desc: 'Open mail client', section: 'Links', icon: '✉️', action: () => window.open('mailto:kranthikiranakkumahanthi@gmail.com'), keywords: 'email send message mail compose write letter' },
  { id: 'p-deploydiff', label: 'DeployDiff', desc: 'Smart deployment diffing tool', section: 'Projects', icon: '🔀', action: () => window.open('https://github.com/kranthi0003', '_blank'), keywords: 'deploydiff deploy diff deployment compare changes project wip' },
  { id: 'p-cronexplain', label: 'CronExplain', desc: 'Cron expression explainer', section: 'Projects', icon: '⏰', action: () => window.open('https://github.com/kranthi0003', '_blank'), keywords: 'cronexplain cron job schedule timer expression explain project wip' },
  { id: 'p-strangerchat', label: 'StrangerChat', desc: 'Anonymous chat app', section: 'Projects', icon: '💬', action: () => window.open('https://github.com/kranthi0003/StrangerChat', '_blank'), keywords: 'strangerchat stranger chat anonymous messaging app omegle random talk' },
  { id: 'p-sketchgate', label: 'SketchGate', desc: 'Rate limiter library', section: 'Projects', icon: '⚡', action: () => window.open('https://github.com/kranthi0003/SketchGate', '_blank'), keywords: 'sketchgate sketch gate rate limiter throttle api library project' },
  { id: 'p-site', label: 'Portfolio Source', desc: 'This site\'s GitHub repo', section: 'Projects', icon: '🌐', action: () => window.open('https://github.com/kranthi0003/kranthi-kiran-site', '_blank'), keywords: 'source code portfolio site repo repository this website open source' },
]

const ADMIN_PASSWORD = 'kk2026'

// Admin-only actions — only visible when admin mode is active
const ADMIN_ACTIONS = [
  { id: 'visitor-dashboard', label: 'Visitor Dashboard', desc: 'Live geo tracking (Admin)', section: '🔒 Admin', icon: '👀', action: () => {
    window.dispatchEvent(new CustomEvent('toggle-admin-dashboard'))
  }, keywords: 'visitors live online users viewing count presence realtime people analytics dashboard admin geo location' },
  { id: 'admin-guestbook', label: 'Guestbook Admin', desc: 'Delete messages (Admin)', section: '🔒 Admin', icon: '🗑️', action: () => {
    scrollTo('guestbook')
  }, keywords: 'guestbook admin delete remove messages moderate' },
  { id: 'admin-logout', label: 'Logout Admin', desc: 'Exit admin mode', section: '🔒 Admin', icon: '🔓', action: 'admin-logout', keywords: 'logout admin exit lock sign out' },
]

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

function typeInTerminal(cmd) {
  const input = document.querySelector('#terminal input')
  if (input) {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    nativeInputValueSetter.call(input, cmd)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.form?.requestSubmit()
  }
}

export default function CommandPalette({ onResumeClick }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const [copied, setCopied] = useState(null)
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('admin_mode') === 'true')
  const inputRef = useRef()
  const listRef = useRef()

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(o => !o)
        setQuery('')
        setSelected(0)
      }
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

  const allActions = useMemo(() => {
    return isAdmin ? [...ACTIONS, ...ADMIN_ACTIONS] : ACTIONS
  }, [isAdmin])

  const filtered = useMemo(() => {
    // Check for admin password
    if (query.toLowerCase() === ADMIN_PASSWORD) return []
    if (!query) return allActions
    const q = query.toLowerCase()
    return allActions.filter(a =>
      a.label.toLowerCase().includes(q) ||
      a.desc.toLowerCase().includes(q) ||
      a.section.toLowerCase().includes(q) ||
      a.id.includes(q) ||
      (a.keywords && a.keywords.includes(q))
    )
  }, [query, allActions])

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

  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.querySelector(`[data-idx="${selected}"]`)
      if (el) el.scrollIntoView({ block: 'nearest' })
    }
  }, [selected])

  const execute = (action) => {
    // Handle admin logout
    if (action.action === 'admin-logout') {
      setIsAdmin(false)
      sessionStorage.removeItem('admin_mode')
      setOpen(false)
      setQuery('')
      return
    }
    // Show "Copied!" feedback for copy actions
    if (action.id === 'email-info' || action.id === 'share') {
      if (typeof action.action === 'function') action.action()
      setCopied(action.id)
      setTimeout(() => { setCopied(null); setOpen(false); setQuery('') }, 800)
      return
    }
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
    else if (e.key === 'Enter') {
      // Check for admin password
      if (query.toLowerCase() === ADMIN_PASSWORD) {
        setIsAdmin(true)
        sessionStorage.setItem('admin_mode', 'true')
        setQuery('')
        return
      }
      if (flatList[selected]) execute(flatList[selected])
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop — macOS-style translucent overlay */}
      <div
        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-xl transition-opacity duration-200"
        onClick={() => setOpen(false)}
      />

      {/* Spotlight container */}
      <div className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[101] w-[680px] max-w-[calc(100vw-2rem)]"
        style={{ animation: 'spotlight-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>

        {/* Frosted glass card */}
        <div className="rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-black/10 dark:border-white/10 bg-white/82 dark:bg-[rgba(30,30,35,0.88)]"
          style={{
            backdropFilter: 'blur(60px) saturate(180%)',
            WebkitBackdropFilter: 'blur(60px) saturate(180%)',
          }}>

          {/* Search bar */}
          <div className="flex items-center gap-4 px-5 py-4">
            <svg className="w-6 h-6 text-muted-foreground/60 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search actions, pages, links..."
              className="flex-1 bg-transparent text-lg font-light text-foreground placeholder:text-muted-foreground/40 outline-none"
              spellCheck={false}
            />
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-500/15 text-green-500 border border-green-500/20">
                  🔓 Admin
                </span>
              )}
              <kbd className="hidden sm:inline-flex h-6 min-w-[24px] items-center justify-center rounded-md text-[11px] font-medium bg-black/5 dark:bg-white/10 text-muted-foreground/60 px-1.5">esc</kbd>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-black/8 dark:bg-white/8" />

          {/* Results */}
          <div ref={listRef} className="max-h-[380px] overflow-y-auto overscroll-contain py-1.5"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,0,0,0.15) transparent' }}>
            {flatList.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                {query.toLowerCase() === ADMIN_PASSWORD ? (
                  <>
                    <span className="text-3xl">🔐</span>
                    <p className="text-sm text-muted-foreground/50">Press <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[11px] font-mono">↵</kbd> to unlock admin mode</p>
                  </>
                ) : (
                  <>
                    <span className="text-3xl opacity-40">🔍</span>
                    <p className="text-sm text-muted-foreground/50">No results for "{query}"</p>
                  </>
                )}
              </div>
            )}
            {Object.entries(grouped).map(([section, items]) => (
              <div key={section} className="mb-1">
                <p className="px-5 pt-3 pb-1.5 text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-widest">{section}</p>
                {items.map((item) => {
                  const idx = flatList.indexOf(item)
                  const isSelected = idx === selected
                  const isCopied = copied === item.id
                  return (
                    <button
                      key={item.id}
                      data-idx={idx}
                      onClick={() => execute(item)}
                      onMouseEnter={() => setSelected(idx)}
                      className={`group w-full flex items-center gap-3.5 px-4 mx-1.5 py-2.5 rounded-xl text-left transition-all duration-150 ${
                        isSelected
                          ? 'bg-blue-500 dark:bg-blue-500 text-white shadow-sm'
                          : 'text-foreground hover:bg-black/4 dark:hover:bg-white/5'
                      }`}
                      style={{ width: 'calc(100% - 12px)' }}
                    >
                      {/* Icon circle */}
                      <span className={`flex items-center justify-center w-8 h-8 rounded-lg text-base flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-white/20'
                          : 'bg-black/5 dark:bg-white/8'
                      }`}>
                        {item.icon}
                      </span>

                      {/* Label + desc */}
                      <div className="flex-1 min-w-0">
                        <span className={`text-[14px] font-medium block truncate ${isSelected ? 'text-white' : 'text-foreground'}`}>
                          {item.label}
                        </span>
                        <span className={`text-[12px] block truncate ${isSelected ? 'text-white/70' : 'text-muted-foreground/50'}`}>
                          {item.desc}
                        </span>
                      </div>

                      {/* Right side hints */}
                      {isCopied ? (
                        <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-green-500'}`}>Copied!</span>
                      ) : isSelected ? (
                        <kbd className="text-[11px] font-mono text-white/50 bg-white/15 rounded-md px-1.5 py-0.5">↵</kbd>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Footer bar */}
          <div className="h-px bg-black/8 dark:bg-white/8" />
          <div className="px-5 py-2.5 flex items-center gap-5 text-[11px] text-muted-foreground/40">
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded text-[10px] bg-black/5 dark:bg-white/8 px-1">↑</kbd>
              <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded text-[10px] bg-black/5 dark:bg-white/8 px-1">↓</kbd>
              <span className="ml-0.5">navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded text-[10px] bg-black/5 dark:bg-white/8 px-1">↵</kbd>
              <span className="ml-0.5">open</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded text-[10px] bg-black/5 dark:bg-white/8 px-1">esc</kbd>
              <span className="ml-0.5">close</span>
            </span>
            <span className="ml-auto opacity-60">⌘K or /</span>
          </div>
        </div>
      </div>

      {/* Spotlight animation + dark mode override */}
      <style>{`
        @keyframes spotlight-in {
          from { opacity: 0; transform: translateX(-50%) scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}
