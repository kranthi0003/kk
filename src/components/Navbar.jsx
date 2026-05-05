import React, { useState, useEffect, useRef } from 'react'
import ThemeToggle from './ThemeToggle'

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
        const res = await fetch('https://kranthikiran.com', { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
        const latency = Math.round(performance.now() - start)
        
        // Gather page metrics
        const perf = performance.getEntriesByType('navigation')[0] || {}
        const resources = performance.getEntriesByType('resource')
        const totalSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
        
        setMetrics({
          status: 'up',
          latency,
          domLoad: Math.round(perf.domContentLoadedEventEnd - perf.startTime) || null,
          fullLoad: Math.round(perf.loadEventEnd - perf.startTime) || null,
          resources: resources.length,
          totalSize: (totalSize / 1024).toFixed(0),
          ttfb: Math.round(perf.responseStart - perf.startTime) || null,
          checkedAt: new Date(),
        })
      } catch {
        setMetrics({ status: 'down', latency: null, checkedAt: new Date() })
      }
    }
    check()
    const i = setInterval(check, 60000)
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
      >
        <span className={`block w-4 h-4 rounded-full border-2 ${
          !metrics ? 'border-yellow-400 bg-yellow-400/20 animate-pulse' :
          isUp ? 'border-green-400 bg-green-400/20' : 'border-red-400 bg-red-400/20'
        }`} />
      </button>
      {open && (
        <div className="fixed right-4 left-4 sm:left-auto sm:absolute sm:right-0 top-16 sm:top-12 animate-fade-in-up z-50">
          <div className="w-full sm:w-[280px] rounded-2xl border border-border/30 bg-card shadow-2xl shadow-black/20 overflow-hidden">
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

            {/* Metrics grid */}
            {metrics && isUp && (
              <div className="p-3 grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-[8px] text-muted-foreground font-mono uppercase">Response</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metrics.latency}<span className="text-[9px] text-muted-foreground">ms</span></p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-[8px] text-muted-foreground font-mono uppercase">TTFB</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metrics.ttfb || '—'}<span className="text-[9px] text-muted-foreground">ms</span></p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-[8px] text-muted-foreground font-mono uppercase">DOM Ready</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metrics.domLoad || '—'}<span className="text-[9px] text-muted-foreground">ms</span></p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-[8px] text-muted-foreground font-mono uppercase">Full Load</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metrics.fullLoad || '—'}<span className="text-[9px] text-muted-foreground">ms</span></p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-[8px] text-muted-foreground font-mono uppercase">Resources</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metrics.resources}</p>
                </div>
                <div className="p-2 rounded-lg bg-muted/30">
                  <p className="text-[8px] text-muted-foreground font-mono uppercase">Transfer</p>
                  <p className="text-sm font-mono font-bold text-foreground">{metrics.totalSize}<span className="text-[9px] text-muted-foreground">KB</span></p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="px-4 py-2 bg-muted/10 border-t border-border/10 text-center">
              <span className="text-[9px] font-mono text-muted-foreground">
                checked {metrics?.checkedAt ? metrics.checkedAt.toLocaleTimeString() : '...'} • auto-refreshes 60s
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
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
          ? 'bg-background/80 backdrop-blur-xl shadow-lg border-b border-border/50'
          : 'bg-transparent'
      }`}
      role="navigation"
      aria-label="Main navigation"
      ref={navRef}
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center">
        {/* Left — Logo */}
        <a href="#home" className="flex items-center gap-2.5 group flex-shrink-0 mr-auto">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-accent-foreground font-heading font-bold text-sm">
            KK
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

        {/* Right — Icons (desktop) */}
        <div className="hidden lg:flex items-center gap-2 ml-auto">
          <NavStatus />
          <NavWallet />
          <NavSpotify />
          <ThemeToggle onRapidClick={onSecretTrigger} />
        </div>

        {/* Tablet (md-lg) — compact links + icons */}
        <div className="hidden md:flex lg:hidden items-center gap-1 ml-auto">
          {navLinks.map(link => {
            const isActive = activeSection === link.href.slice(1)
            return (
              <a
                key={link.href}
                href={link.href}
                className={`relative px-2 py-1.5 rounded-lg font-body text-xs font-medium transition-all duration-200 whitespace-nowrap ${
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
          <div className="w-px h-5 bg-border/50 mx-1.5" />
          <div className="flex items-center gap-1.5">
            <NavStatus />
            <NavWallet />
            <NavSpotify />
            <ThemeToggle onRapidClick={onSecretTrigger} />
          </div>
        </div>

        {/* Mobile — icons + hamburger */}
        <div className="flex md:hidden items-center gap-2 ml-auto">
          <NavStatus />
          <NavWallet />
          <NavSpotify />
          <ThemeToggle onRapidClick={onSecretTrigger} />
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
        </div>
      )}
    </nav>
  )
}
