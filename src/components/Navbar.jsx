import React, { useState, useEffect, useRef } from 'react'
import Heartbeat from './Heartbeat'

const SpotifyIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
  </svg>
)

function NavSpotify() {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`p-2 rounded-full transition-colors duration-200 ${
          open ? 'bg-green-500/15 text-green-500' : 'bg-muted hover:bg-border text-muted-foreground hover:text-green-500'
        }`}
        aria-label="Toggle music player"
        data-spotify-btn
      >
        <SpotifyIcon />
      </button>
      {open && (
        <div className="fixed right-4 left-4 sm:left-auto sm:absolute sm:right-0 top-16 sm:top-12 animate-fade-in-up z-50 sm:min-w-[300px]">
          <iframe
            src="https://open.spotify.com/embed/playlist/37i9dQZF1DX0ieekvzt1Ic?utm_source=generator&theme=0"
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify"
            className="rounded-2xl border border-border/30 shadow-2xl shadow-black/20"
            style={{ minWidth: '280px' }}
          />
        </div>
      )}
    </div>
  )
}

function NavWallet() {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`p-2 rounded-full transition-colors duration-200 ${
          open ? 'bg-accent/15 text-accent' : 'bg-muted hover:bg-border text-muted-foreground hover:text-accent'
        }`}
        aria-label="View Bitcoin wallet"
        data-wallet-btn
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      </button>
      {open && (
        <div className="fixed right-4 left-4 sm:left-auto sm:absolute sm:right-0 top-16 sm:top-12 animate-fade-in-up z-50">
          <WalletDropdown />
        </div>
      )}
    </div>
  )
}

function WalletDropdown() {
  const [data, setData] = useState(null)
  const [btcPrice, setBtcPrice] = useState(null)
  const [copied, setCopied] = useState(false)
  const ADDR = 'bc1quaunu4xa0jgeh446jlx2mchlv4gda9tj0dqz9e'

  useEffect(() => {
    const cached = sessionStorage.getItem('btc_wallet')
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.ts < 300000) { setData(parsed.data); setBtcPrice(parsed.price); return }
    }
    Promise.all([
      fetch(`https://blockchain.info/rawaddr/${ADDR}?limit=0&cors=true`).then(r => r.json()),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd').then(r => r.json()),
    ]).then(([w, p]) => {
      setData(w); setBtcPrice(p.bitcoin.usd)
      sessionStorage.setItem('btc_wallet', JSON.stringify({ data: w, price: p.bitcoin.usd, ts: Date.now() }))
    }).catch(() => { setData({ final_balance: 2697427, n_tx: 8 }); setBtcPrice(97000) })
  }, [])

  const btc = data ? (data.final_balance / 1e8).toFixed(8) : '···'
  const usd = data && btcPrice ? ((data.final_balance / 1e8) * btcPrice).toFixed(2) : '···'

  return (
    <div className="w-full sm:w-[280px] rounded-2xl border border-border/30 bg-card shadow-2xl shadow-black/20 overflow-hidden">
      <div className="p-4 border-b border-border/20 flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
          <span className="text-accent-foreground text-[10px] font-bold">₿</span>
        </div>
        <span className="text-xs font-semibold">Bitcoin Wallet</span>
        <span className="ml-auto text-[9px] font-mono text-muted-foreground">{data?.n_tx || '·'} txns</span>
      </div>
      <div className="p-4 text-center">
        <p className="text-2xl font-bold font-mono">${usd}</p>
        <p className="text-xs text-muted-foreground font-mono mt-0.5">{btc} BTC</p>
      </div>
      <div className="px-4 pb-3">
        <button
          onClick={() => { navigator.clipboard.writeText(ADDR); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 border border-border/20 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-all"
        >
          <span>{ADDR.slice(0, 8)}···{ADDR.slice(-4)}</span>
          <span className="text-accent">{copied ? '✓' : 'copy'}</span>
        </button>
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <a href={`https://mempool.space/address/${ADDR}`} target="_blank" rel="noopener noreferrer"
          className="flex-1 text-center py-2 rounded-lg bg-muted/50 border border-border/20 text-[10px] font-mono text-muted-foreground hover:text-foreground transition-all">
          Activity ↗
        </a>
        <a href={`https://platform.arkhamintelligence.com/explorer/address/${ADDR}`} target="_blank" rel="noopener noreferrer"
          className="flex-1 text-center py-2 rounded-lg bg-accent text-accent-foreground text-[10px] font-mono hover:opacity-90 transition-all">
          Arkham ↗
        </a>
      </div>
    </div>
  )
}

function NavStatus() {
  const [open, setOpen] = useState(false)
  const [metrics, setMetrics] = useState(null)
  const ref = useRef()

  useEffect(() => {
    const check = async () => {
      const start = performance.now()
      try {
        await fetch('https://kranthikiran.com', { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
        const latency = Math.round(performance.now() - start)
        
        // Gather real page metrics
        const perf = performance.getEntriesByType('navigation')[0] || {}
        const resources = performance.getEntriesByType('resource')
        const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
        const jsCount = resources.filter(r => r.initiatorType === 'script').length
        const cssCount = resources.filter(r => r.initiatorType === 'link' || r.name?.endsWith('.css')).length
        const imgCount = resources.filter(r => r.initiatorType === 'img').length
        
        // Memory (Chrome only)
        const mem = performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(0) : null
        
        // FCP
        const paintEntries = performance.getEntriesByType('paint')
        const fcp = paintEntries.find(e => e.name === 'first-contentful-paint')
        
        setMetrics({
          status: 'up',
          latency,
          domLoad: Math.round(perf.domContentLoadedEventEnd - perf.startTime) || null,
          fullLoad: Math.round(perf.loadEventEnd - perf.startTime) || null,
          resources: resources.length,
          totalSize: totalSize > 0 ? (totalSize / 1024).toFixed(0) : Math.round(performance.getEntriesByType('resource').reduce((s, r) => s + (r.encodedBodySize || 0), 0) / 1024),
          ttfb: Math.round(perf.responseStart - perf.startTime) || null,
          fcp: fcp ? Math.round(fcp.startTime) : null,
          jsCount,
          cssCount,
          imgCount,
          memMB: mem,
          checkedAt: new Date(),
        })
      } catch {
        setMetrics({ status: 'down', latency: null, checkedAt: new Date() })
      }
    }
    // Delay first check so page fully loads
    setTimeout(check, 750)
    const i = setInterval(check, 750)
    return () => clearInterval(i)
  }, [])

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const isUp = metrics?.status === 'up'

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 rounded-full bg-muted hover:bg-border transition-colors duration-200 relative"
        aria-label="Site status"
        data-status-btn
      >
        <span className={`block w-4 h-4 rounded-full border-2 ${
          !metrics ? 'border-yellow-400 bg-yellow-400/20 animate-pulse' :
          isUp ? 'border-green-400 bg-green-400/20' : 'border-red-400 bg-red-400/20'
        }`} />
      </button>
      {open && (
        <div className="fixed right-4 left-4 sm:left-auto sm:absolute sm:right-0 top-16 sm:top-12 animate-fade-in-up z-50">
          <div className="w-full sm:w-[320px] rounded-2xl border border-border/30 bg-card shadow-2xl shadow-black/20 overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-border/20 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isUp ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isUp ? 'bg-green-500' : 'bg-red-500'}`} />
              </span>
              <span className="text-[10px] font-mono font-semibold text-foreground">kranthikiran.com</span>
              <span className={`ml-auto text-[9px] font-mono font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                {isUp ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            {/* ECG Heartbeat */}
            {metrics && isUp && (
              <div className="px-3 border-b border-border/10">
                <Heartbeat />
              </div>
            )}

            {/* Metrics grid */}
            {metrics && isUp && (
              <div className="p-3 grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-[7px] text-muted-foreground font-mono uppercase">Response</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metrics.latency}<span className="text-[8px] text-muted-foreground">ms</span></p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-[7px] text-muted-foreground font-mono uppercase">TTFB</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metrics.ttfb || '—'}<span className="text-[8px] text-muted-foreground">ms</span></p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-[7px] text-muted-foreground font-mono uppercase">FCP</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metrics.fcp || '—'}<span className="text-[8px] text-muted-foreground">ms</span></p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-[7px] text-muted-foreground font-mono uppercase">DOM Ready</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metrics.domLoad || '—'}<span className="text-[8px] text-muted-foreground">ms</span></p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-[7px] text-muted-foreground font-mono uppercase">Full Load</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metrics.fullLoad || '—'}<span className="text-[8px] text-muted-foreground">ms</span></p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-[7px] text-muted-foreground font-mono uppercase">Transfer</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metrics.totalSize}<span className="text-[8px] text-muted-foreground">KB</span></p>
                </div>
                <div className="col-span-3 pt-1 flex items-center justify-between text-[8px] font-mono text-muted-foreground/60">
                  <span>{metrics.resources} resources ({metrics.jsCount} js · {metrics.cssCount} css · {metrics.imgCount} img)</span>
                  {metrics.memMB && <span>{metrics.memMB}MB heap</span>}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-2 bg-muted/10 border-t border-border/10 text-center">
              <span className="text-[9px] font-mono text-muted-foreground">
                checked {metrics?.checkedAt ? metrics.checkedAt.toLocaleTimeString() : '...'} • live · 0.75s
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Changelog dropdown — shows latest 4 commits
function NavChangelog() {
  const [open, setOpen] = useState(false)
  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(true)
  const ref = useRef()

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  useEffect(() => {
    if (!open) return
    try {
      const cached = JSON.parse(sessionStorage.getItem('nav_changelog'))
      if (cached && Date.now() - cached.ts < 300000) {
        setCommits(cached.data)
        setLoading(false)
        return
      }
    } catch {}
    fetch('https://api.github.com/repos/kranthi0003/kranthi-kiran-site/commits?per_page=4&sha=main')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setCommits(data)
        sessionStorage.setItem('nav_changelog', JSON.stringify({ ts: Date.now(), data }))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [open])

  const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s/60)}m ago`
    if (s < 86400) return `${Math.floor(s/3600)}h ago`
    return `${Math.floor(s/86400)}d ago`
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`p-2 rounded-full transition-colors duration-200 ${
          open ? 'bg-accent/15 text-accent' : 'bg-muted hover:bg-border text-muted-foreground hover:text-foreground'
        }`}
        title="What's New"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {open && (
        <div className="fixed right-4 left-4 sm:left-auto sm:absolute sm:right-0 top-16 sm:top-12 animate-fade-in-up z-50">
          <div className="w-full sm:w-[320px] rounded-2xl border border-border/30 bg-card shadow-2xl shadow-black/20 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/20">
              <span className="text-xs font-semibold text-foreground">What's New</span>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="w-4 h-4 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin" />
                </div>
              ) : commits.map((c, i) => (
                <a key={c.sha} href={c.html_url} target="_blank" rel="noopener noreferrer"
                  className="flex gap-2.5 px-4 py-2.5 border-b border-border/10 hover:bg-muted/30 transition-colors">
                  <div className="mt-1.5 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-muted-foreground/50">{timeAgo(c.commit.author.date)}</p>
                    <p className="text-xs text-foreground/80 leading-snug line-clamp-2">{c.commit.message.split('\n')[0]}</p>
                  </div>
                </a>
              ))}
            </div>
            <button
              onClick={() => { setOpen(false); window.dispatchEvent(new CustomEvent('toggle-changelog')) }}
              className="w-full px-4 py-2.5 text-[11px] text-muted-foreground/50 hover:text-foreground transition-colors border-t border-border/20 text-center"
            >
              View full changelog →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Games quick-launch dropdown
function NavGames() {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const games = [
    { name: 'Snake', icon: '🐍', cmd: 'play snake', desc: 'Classic arcade' },
    { name: 'Tic-Tac-Toe', icon: '❌', cmd: 'play ttt', desc: 'X vs O' },
    { name: 'Wordle', icon: '🟩', cmd: 'play wordle', desc: 'Guess the word' },
    { name: 'Memory', icon: '🃏', cmd: 'play memory', desc: 'Match pairs' },
  ]

  const launch = (cmd) => {
    setOpen(false)
    const el = document.getElementById('terminal')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
    setTimeout(() => {
      const input = document.querySelector('#terminal input')
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
        setter.call(input, cmd)
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.form?.requestSubmit()
      }
    }, 500)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`p-2 rounded-full transition-colors duration-200 ${
          open ? 'bg-purple-500/15 text-purple-500' : 'bg-muted hover:bg-border text-muted-foreground hover:text-foreground'
        }`}
        title="Games"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {open && (
        <div className="fixed right-4 left-4 sm:left-auto sm:absolute sm:right-0 top-16 sm:top-12 animate-fade-in-up z-50">
          <div className="w-full sm:w-[220px] rounded-2xl border border-border/30 bg-card shadow-2xl shadow-black/20 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/20">
              <span className="text-xs font-semibold text-foreground">Quick Play</span>
            </div>
            {games.map(g => (
              <button key={g.cmd} onClick={() => launch(g.cmd)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 transition-colors text-left border-b border-border/10 last:border-0">
                <span className="text-base">{g.icon}</span>
                <div>
                  <p className="text-xs font-medium text-foreground">{g.name}</p>
                  <p className="text-[10px] text-muted-foreground/50">{g.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Resume quick button
function NavResume({ onResumeClick }) {
  return (
    <button
      onClick={onResumeClick}
      className="p-2 rounded-full bg-muted hover:bg-border text-muted-foreground hover:text-foreground transition-colors duration-200"
      title="Resume / CV"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </button>
  )
}

// AI Chat quick button
function NavAIChat() {
  return (
    <button
      onClick={() => document.querySelector('[data-chatbot-btn]')?.click()}
      className="p-2 rounded-full bg-muted hover:bg-border text-muted-foreground hover:text-foreground transition-colors duration-200"
      title="AI Chatbot"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    </button>
  )
}

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Experience', href: '#experience' },
  { label: 'About', href: '#about' },
  { label: 'Projects', href: '#projects' },
  { label: 'Travel', href: '#travel' },
  { label: 'Connect', href: '#connect' },
]

export default function Navbar({ onSecretTrigger, onResumeClick }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [isCompact, setIsCompact] = useState(false)
  const navRef = useRef()

  // Track scroll and active section
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)

      // Find which section is currently in view
      const sections = navLinks.map(l => l.href.slice(1))
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i])
        if (el && el.getBoundingClientRect().top <= 150) {
          setActiveSection(sections[i])
          break
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Check if nav links overflow — switch to compact mode
  useEffect(() => {
    const check = () => setIsCompact(window.innerWidth < 1080 && window.innerWidth >= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-background/80 backdrop-blur-xl shadow-lg border-b border-black/5 dark:border-white/5'
          : 'bg-transparent'
      }`}
      role="navigation"
      aria-label="Main navigation"
      ref={navRef}
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center">
        {/* Left — Logo */}
        <a href="#home" className="flex items-center gap-2.5 group flex-shrink-0 mr-auto">
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-accent-foreground font-heading font-bold text-sm">
            KK
            <span className="absolute -top-1.5 -right-2 px-1 py-0 rounded text-[7px] font-bold uppercase tracking-wider bg-yellow-500 text-black leading-tight">β</span>
          </div>
          <span className="font-heading font-semibold text-lg text-foreground hidden sm:inline">
            {isCompact ? 'KK' : 'Kranthi Kiran'}
          </span>
        </a>

        {/* Center — Nav links (desktop) */}
        <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navLinks.map(link => {
            const isActive = activeSection === link.href.slice(1)
            return (
              <a
                key={link.href}
                href={link.href}
                className={`relative px-3 py-1.5 rounded-lg font-body text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'text-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                )}
              </a>
            )
          })}
        </div>

        {/* Right — Icons (desktop) — original set */}
        <div className="hidden lg:flex items-center gap-2 ml-auto">
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border/40 text-muted-foreground hover:text-foreground hover:border-border/60 hover:bg-muted/60 transition-all"
            title="Search (⌘K or /)"
          >
            <svg className="w-4 h-4 opacity-50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-[12px] opacity-40">Type</span>
            <kbd className="inline-flex items-center justify-center h-5 w-5 rounded border border-border/50 bg-background/60 text-[11px] font-mono text-muted-foreground/60">/</kbd>
            <span className="text-[12px] opacity-40">to search</span>
          </button>
          <NavWallet />
          <NavSpotify />
          <NavStatus />
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-theme-modes'))}
            className="p-2 rounded-full bg-muted hover:bg-border text-muted-foreground hover:text-foreground transition-colors"
            title="Theme Modes"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
            </svg>
          </button>
        </div>


        {/* Mobile — icons + hamburger */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          <NavWallet />
          <NavSpotify />
          <NavStatus />
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('toggle-theme-modes'))}
            className="p-2 rounded-full bg-muted hover:bg-border text-muted-foreground hover:text-foreground transition-colors"
            title="Theme Modes"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
            </svg>
          </button>
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Line 2 — Action bar (desktop only) */}
      <div className="hidden lg:block bg-background/90 backdrop-blur-xl border-t border-black/5 dark:border-t-white/5 border-b border-b-black/10 dark:border-b-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-9 flex items-center">
          {/* Left group — core actions */}
          <div className="flex items-center gap-0.5">
            <IconBtn icon={<CalcIcon />} tip="Dev Toolkit" onClick={() => window.dispatchEvent(new CustomEvent('toggle-dev-calc'))} />
            <IconBtn icon={<CodeIcon />} tip="Source Code" onClick={() => window.dispatchEvent(new CustomEvent('toggle-code-browser'))} />
            <IconBtn icon={<ClockIcon />} tip="Changelog" onClick={() => window.dispatchEvent(new CustomEvent('toggle-changelog'))} />
            <IconBtn icon={<ChatIcon />} tip="AI Chat" onClick={() => document.querySelector('[data-chatbot-btn]')?.click()} />
            <IconBtn icon={<QRIcon />} tip="QR vCard" onClick={() => window.dispatchEvent(new CustomEvent('toggle-qr-vcard'))} />
            <IconBtn icon={<MemeIcon />} tip="AI Meme Generator" onClick={() => window.dispatchEvent(new CustomEvent('toggle-meme-gen'))} />
            <IconBtn icon={<BattleIcon />} tip="Code Battle" onClick={() => { window.location.hash = '#/battle' }} />
          </div>

          <div className="flex-1" />

          {/* Right group — tools */}
          <div className="flex items-center gap-0.5">
            <IconBtn icon={<ReadIcon />} tip="Reading Mode" onClick={() => document.body.classList.toggle('reading-mode')} />
            <IconBtn icon={<SpeedIcon />} tip="Speed Test" onClick={() => window.dispatchEvent(new CustomEvent('toggle-speed-test'))} />
            <IconBtn icon={<CameraIcon />} tip="Share Card" onClick={() => window.dispatchEvent(new CustomEvent('toggle-share-card'))} />
            <IconBtn icon={<LeafIcon />} tip="Carbon Calculator" onClick={() => window.dispatchEvent(new CustomEvent('toggle-carbon-calc'))} />
            <IconBtn icon={<RupeeIcon />} tip="Salary Calculator" onClick={() => window.dispatchEvent(new CustomEvent('toggle-salary-calc'))} />
            <IconBtn icon={<MailIcon />} tip="Hire Me" onClick={() => {
              const subject = encodeURIComponent('Interested in hiring Kranthi Kiran')
              const body = encodeURIComponent(`Hi Kranthi,\n\nI came across your portfolio and I'm impressed with your work.\n\nRole: [Position]\nCompany: [Company Name]\nLocation: [Remote/Hybrid/Office]\n\nWould love to connect!\n\nBest regards,\n[Your Name]`)
              window.open(`mailto:kranthikiranakkumahanthi@gmail.com?subject=${subject}&body=${body}`)
            }} />
            <IconBtn icon={<LiveChatIcon />} tip="Live Chat" onClick={() => window.dispatchEvent(new CustomEvent('toggle-live-chat'))} />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border">
          <div className="px-6 py-3 flex flex-col gap-0.5">
            {navLinks.map(link => {
              const isActive = activeSection === link.href.slice(1)
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 rounded-lg font-body text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-accent bg-accent/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {link.label}
                </a>
              )
            })}
          </div>
          {/* Action grid */}
          <div className="px-6 pt-2 pb-4 border-t border-border/20">
            <p className="text-[10px] text-muted-foreground/40 uppercase tracking-wider mb-2 font-semibold">Quick Actions</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { icon: '🧮', label: 'Dev Tools', action: () => window.dispatchEvent(new CustomEvent('toggle-dev-calc')) },
                { icon: '📂', label: 'Source', action: () => window.dispatchEvent(new CustomEvent('toggle-code-browser')) },
                { icon: '📋', label: 'Changelog', action: () => window.dispatchEvent(new CustomEvent('toggle-changelog')) },
                { icon: '🤖', label: 'AI Chat', action: () => document.querySelector('[data-chatbot-btn]')?.click() },
                { icon: '📱', label: 'QR Card', action: () => window.dispatchEvent(new CustomEvent('toggle-qr-vcard')) },
                { icon: '😂', label: 'Meme Gen', action: () => window.dispatchEvent(new CustomEvent('toggle-meme-gen')) },
                { icon: '📖', label: 'Read Mode', action: () => document.body.classList.toggle('reading-mode') },
                { icon: '⚡', label: 'Speed', action: () => window.dispatchEvent(new CustomEvent('toggle-speed-test')) },
                { icon: '📸', label: 'Share Card', action: () => window.dispatchEvent(new CustomEvent('toggle-share-card')) },
                { icon: '🌍', label: 'Carbon', action: () => window.dispatchEvent(new CustomEvent('toggle-carbon-calc')) },
                { icon: '💰', label: 'Salary', action: () => window.dispatchEvent(new CustomEvent('toggle-salary-calc')) },
                { icon: '✉️', label: 'Hire Me', action: () => { const s = encodeURIComponent('Interested in hiring Kranthi Kiran'); const b = encodeURIComponent('Hi Kranthi,\n\nI saw your portfolio.\n\nRole: [Position]\nCompany: [Company]\n\nBest,\n[Name]'); window.open(`mailto:kranthikiranakkumahanthi@gmail.com?subject=${s}&body=${b}`) } },
                { icon: '💬', label: 'Live Chat', action: () => window.dispatchEvent(new CustomEvent('toggle-live-chat')) },
                { icon: '🎨', label: 'Themes', action: () => window.dispatchEvent(new CustomEvent('toggle-theme-modes')) },
                { icon: '⚔️', label: 'Battle', action: () => { window.location.hash = '#/battle' } },
              ].map(a => (
                <button key={a.label} onClick={() => { a.action(); setMobileOpen(false) }}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors">
                  <span className="text-lg">{a.icon}</span>
                  <span className="text-[9px] text-muted-foreground/60 font-medium">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

// Icon-only button with custom tooltip on hover
function IconBtn({ icon, tip, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative p-2.5 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-all duration-150 [&_svg]:w-5 [&_svg]:h-5"
    >
      {icon}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2.5 py-1 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[11px] font-medium whitespace-nowrap opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 shadow-lg z-50">
        {tip}
      </span>
    </button>
  )
}

function TechBadge({ children }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/40 text-muted-foreground/40 border border-border/20">
      {children}
    </span>
  )
}

const ClockIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const ChatIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
  </svg>
)
const GameIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const ResumeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)
const QRIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM17 14h1m-1 3h1m-4-3h1m3 3h1" />
  </svg>
)
const DiceIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0 1.232-.046 2.453-.138 3.662a4.006 4.006 0 01-3.7 3.7 48.678 48.678 0 01-7.324 0 4.006 4.006 0 01-3.7-3.7c-.017-.22-.032-.441-.046-.662M19.5 12l-3-9m3 9h-3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125h.872M4.5 12l3-9m-3 9h3.375c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H4.628" />
  </svg>
)
const ReadIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
)
const SpeedIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
)
const CameraIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
  </svg>
)
const MailIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
)
const MemeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
  </svg>
)
const PaletteIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
  </svg>
)
const BattleIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>
)
const CalcIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>
)
const CodeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
  </svg>
)
const LeafIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-8-7.5-8-12a8 8 0 0116 0c0 4.5-4 8-8 12z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 13V7" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 10l3-3 3 3" />
  </svg>
)
const RupeeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h12M6 8h12M14 8c0 4-8 8-8 8m4-8c0 4 8 8 8 8" />
  </svg>
)
const LiveChatIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
  </svg>
)

function SocialLink({ href, title, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground/40 hover:text-foreground transition-colors" title={title}>
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">{children}</svg>
    </a>
  )
}
