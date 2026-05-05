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
        <div className="absolute right-0 top-12 animate-fade-in-up rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-border/30 z-50">
          <iframe
            src="https://open.spotify.com/embed/playlist/37i9dQZF1DX0ieekvzt1Ic?utm_source=generator&theme=0"
            width="300"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify"
            className="rounded-2xl"
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
        <div className="absolute right-0 top-12 animate-fade-in-up z-50">
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
    <div className="w-[280px] rounded-2xl border border-border/30 bg-card shadow-2xl shadow-black/20 overflow-hidden">
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

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center text-accent-foreground font-heading font-bold text-sm">
            KK
          </div>
          <span className="font-heading font-semibold text-lg text-foreground hidden sm:inline">
            {isCompact ? 'KK' : 'Kranthi Kiran'}
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(link => {
            const isActive = activeSection === link.href.slice(1)
            return (
              <a
                key={link.href}
                href={link.href}
                className={`relative px-3 py-1.5 rounded-lg font-body text-sm font-medium transition-all duration-200 ${
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
          <div className="w-px h-5 bg-border/50 mx-2" />
          <div className="flex items-center gap-1">
            <NavWallet />
            <NavSpotify />
            <ThemeToggle onRapidClick={onSecretTrigger} />
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <NavWallet />
          <NavSpotify />
          <ThemeToggle onRapidClick={onSecretTrigger} />
          <button
            onClick={() => setMobileOpen(o => !o)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
          <div className="px-6 py-4 flex flex-col gap-1">
            {navLinks.map(link => {
              const isActive = activeSection === link.href.slice(1)
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-3 py-2.5 rounded-lg font-body text-base font-medium transition-colors ${
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
