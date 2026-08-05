import React, { useEffect, useRef, useState } from 'react'

// "The Sidecar" — a slide-in drawer of lifestyle cards ("things I follow").
// Opens from the right via a round arrow button in the navbar. Built to grow:
// each card is a self-contained component; add more to CARDS over time.

const FLAGS = {
  Australia: '🇦🇺', Bahrain: '🇧🇭', 'Saudi Arabia': '🇸🇦', Japan: '🇯🇵', China: '🇨🇳',
  USA: '🇺🇸', 'United States': '🇺🇸', Italy: '🇮🇹', Monaco: '🇲🇨', Spain: '🇪🇸',
  Canada: '🇨🇦', Austria: '🇦🇹', UK: '🇬🇧', 'United Kingdom': '🇬🇧', Hungary: '🇭🇺',
  Belgium: '🇧🇪', Netherlands: '🇳🇱', Azerbaijan: '🇦🇿', Singapore: '🇸🇬', Mexico: '🇲🇽',
  Brazil: '🇧🇷', 'United Arab Emirates': '🇦🇪', UAE: '🇦🇪', Qatar: '🇶🇦', France: '🇫🇷',
  Germany: '🇩🇪', Portugal: '🇵🇹', Turkey: '🇹🇷',
}

function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!target) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [target])
  if (!target) return null
  const diff = target - now
  if (diff <= 0) return { live: true }
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff % 86400000) / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return { d, h, m, s }
}

function F1Card() {
  const [race, setRace] = useState(undefined) // undefined=loading, null=error/none

  useEffect(() => {
    const cached = sessionStorage.getItem('f1_next')
    if (cached) {
      try {
        const p = JSON.parse(cached)
        if (Date.now() - p.ts < 3600000) { setRace(p.race); return }
      } catch {}
    }
    let alive = true
    fetch('https://api.jolpi.ca/ergast/f1/current/next.json', { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error('bad'); return r.json() })
      .then(d => {
        if (!alive) return
        const r = d?.MRData?.RaceTable?.Races?.[0] || null
        setRace(r)
        sessionStorage.setItem('f1_next', JSON.stringify({ race: r, ts: Date.now() }))
      })
      .catch(() => { if (alive) setRace(null) })
    return () => { alive = false }
  }, [])

  const target = race && race.date
    ? new Date(`${race.date}T${race.time || '12:00:00Z'}`).getTime()
    : null
  const cd = useCountdown(target)

  const shell = (children) => (
    <section className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)', background: 'color-mix(in oklab, var(--color-card) 60%, transparent)' }}>
      <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: 'color-mix(in oklab, var(--color-border) 70%, transparent)', background: 'linear-gradient(180deg, color-mix(in oklab, #e10600 12%, transparent), transparent)' }}>
        <span aria-hidden="true">🏎️</span>
        <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">Formula 1 · Next Race</span>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )

  if (race === undefined) return shell(<div className="h-20 flex items-center justify-center"><span className="text-xs font-mono text-muted-foreground animate-pulse">loading grid…</span></div>)
  if (race === null) return shell(
    <div className="text-center py-2">
      <p className="text-[13px] text-muted-foreground mb-2">Couldn’t load the schedule right now.</p>
      <a href="https://www.formula1.com/en/racing/2026.html" target="_blank" rel="noopener noreferrer" className="text-[12px] font-medium" style={{ color: 'var(--color-accent)' }}>Full calendar ↗</a>
    </div>
  )

  const loc = race.Circuit?.Location || {}
  const flag = FLAGS[loc.country] || '🏁'
  const localWhen = target
    ? new Date(target).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : null

  return shell(
    <>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-heading text-[1.15rem] leading-tight" style={{ fontWeight: 600 }}>{race.raceName}</h3>
        <span className="flex-shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: 'color-mix(in oklab, var(--color-accent) 14%, transparent)', color: 'var(--color-accent)' }}>R{race.round}</span>
      </div>
      <p className="text-[12.5px] text-muted-foreground mt-1">
        {flag} {race.Circuit?.circuitName}{loc.locality ? ` · ${loc.locality}` : ''}
      </p>

      {/* Countdown */}
      <div className="mt-3.5 rounded-xl px-3 py-2.5" style={{ background: 'color-mix(in oklab, var(--color-foreground) 5%, transparent)' }}>
        {cd?.live ? (
          <div className="text-center text-[13px] font-semibold" style={{ color: '#e10600' }}>🟢 Lights out — race under way</div>
        ) : cd ? (
          <div className="flex items-center justify-center gap-3 font-mono tabular-nums">
            {[['d', cd.d], ['h', cd.h], ['m', cd.m], ['s', cd.s]].map(([u, v]) => (
              <div key={u} className="text-center">
                <div className="text-[1.35rem] font-bold leading-none text-foreground">{String(v).padStart(2, '0')}</div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1">{u}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className="text-[11.5px] text-muted-foreground">{localWhen ? `${localWhen} · your time` : ''}</span>
        {race.url && (
          <a href={race.url} target="_blank" rel="noopener noreferrer" className="text-[12px] font-medium inline-flex items-center gap-1" style={{ color: 'var(--color-accent)' }}>
            Details ↗
          </a>
        )}
      </div>
    </>
  )
}

// The card stack — append here as new cards are built.
const CARDS = [F1Card]

export default function Sidecar() {
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(false) // drives the slide animation

  useEffect(() => {
    if (!open) return
    const raf = requestAnimationFrame(() => setShown(true))
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const close = () => {
    setShown(false)
    setTimeout(() => setOpen(false), 300)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open the Sidecar"
        title="The Sidecar — things I follow"
        className="group fixed top-20 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
        style={{ background: 'var(--color-accent)', color: 'var(--color-accent-foreground)', boxShadow: '0 8px 24px -6px color-mix(in oklab, var(--color-accent) 55%, transparent)' }}
      >
        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 17l-5-5 5-5" /><path d="M18 17l-5-5 5-5" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-[1200]" role="dialog" aria-modal="true" aria-label="The Sidecar">
          {/* Backdrop */}
          <div
            onClick={close}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)', opacity: shown ? 1 : 0, transition: 'opacity .3s ease' }}
          />
          {/* Panel */}
          <div
            className="absolute top-0 right-0 h-full w-[380px] max-w-[calc(100vw-2rem)] flex flex-col"
            style={{
              background: 'color-mix(in oklab, var(--color-card) 94%, transparent)',
              borderLeft: '1px solid var(--color-border)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '-24px 0 60px -20px rgba(0,0,0,0.6)',
              transform: shown ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform .34s cubic-bezier(.22,1,.36,1)',
            }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 flex items-start justify-between flex-shrink-0">
              <div>
                <h2 className="font-heading text-[1.35rem] leading-tight" style={{ fontWeight: 600 }}>The Sidecar</h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">Things I follow, off the clock.</p>
              </div>
              <button onClick={close} aria-label="Close" className="text-muted-foreground/60 hover:text-foreground transition-colors p-1 -mr-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
              {CARDS.map((Card, i) => <Card key={i} />)}
              <p className="text-[11px] text-center text-muted-foreground/50 font-mono pt-2">more cards coming — standings, releases, shows…</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
