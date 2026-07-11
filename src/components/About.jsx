import React, { useState, useEffect } from 'react'
import profile from '../../assets/profile.png'

// GitHub-style contribution heatmap (live data)
function GitHubHeatmap() {
  const [weeks, setWeeks] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = sessionStorage.getItem('gh_heatmap2')
    if (cached) {
      try {
        const d = JSON.parse(cached)
        if (Date.now() - d.ts < 600000) { setWeeks(d.weeks); setTotal(d.total); setLoading(false); return }
      } catch {}
    }
    fetch('https://github-contributions-api.jogruber.de/v4/kranthi0003?y=last')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        const days = data.contributions || []
        const grouped = []
        let week = []
        const firstDay = new Date(days[0]?.date)
        const startPad = firstDay.getDay()
        for (let i = 0; i < startPad; i++) week.push(null)
        days.forEach(d => {
          week.push(d)
          if (week.length === 7) { grouped.push(week); week = [] }
        })
        if (week.length) { while (week.length < 7) week.push(null); grouped.push(week) }
        setWeeks(grouped)
        setTotal(data.total?.lastYear || 0)
        sessionStorage.setItem('gh_heatmap2', JSON.stringify({ ts: Date.now(), weeks: grouped, total: data.total?.lastYear || 0 }))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-6">
      <div className="w-4 h-4 border-2 border-muted-foreground/20 border-t-green-500 rounded-full animate-spin" />
    </div>
  )

  const levelColors = ['bg-[#161b22]', 'bg-[#0e4429]', 'bg-[#006d32]', 'bg-[#26a641]', 'bg-[#39d353]']
  const levelColorsLight = ['bg-[#ebedf0]', 'bg-[#9be9a8]', 'bg-[#40c463]', 'bg-[#30a14e]', 'bg-[#216e39]']
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const colors = isDark ? levelColors : levelColorsLight

  return (
    <div>
      <div className="flex gap-[3px] overflow-hidden">
        {weeks.slice(-Math.floor((weeks.length > 26 ? 26 : weeks.length))).map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px] flex-shrink-0">
            {week.map((day, di) => (
              <div
                key={di}
                className={`w-[13px] h-[13px] rounded-sm ${day ? colors[day.level] || colors[0] : 'bg-transparent'}`}
                title={day ? `${day.date}: ${day.count} contributions` : ''}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-muted-foreground/50 font-mono">{total} contributions in the last year</p>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-muted-foreground/40">Less</span>
          {colors.map((c, i) => <div key={i} className={`w-[10px] h-[10px] rounded-sm ${c}`} />)}
          <span className="text-[9px] text-muted-foreground/40">More</span>
        </div>
      </div>
    </div>
  )
}

// Stat number with a soft brand glow (static — always correct, never stuck)
function StatNumber({ target, suffix }) {
  return (
    <span className="tabular-nums font-bold" style={{ color: 'var(--color-brand)', textShadow: '0 0 18px color-mix(in oklab, var(--color-brand) 45%, transparent)' }}>
      {target}{suffix}
    </span>
  )
}

const STATS = [
  { target: 5, suffix: '+', label: 'Years in tech' },
  { target: 7, suffix: '', label: 'Certifications' },
  { target: 100, suffix: '+', label: 'Enterprise clients' },
]

const CARD = 'transition-transform duration-300 hover:-translate-y-1'
const tintStyle = (pct = 6) => ({
  border: '1px solid color-mix(in oklab, var(--color-border) 50%, transparent)',
  background: `linear-gradient(150deg, color-mix(in oklab, var(--color-brand) ${pct}%, var(--color-card)), var(--color-card) 70%)`,
})

function BentoClockCard() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])
  const ist = new Date(time.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const hours = ist.getHours().toString().padStart(2, '0')
  const mins = ist.getMinutes().toString().padStart(2, '0')
  const secs = ist.getSeconds().toString().padStart(2, '0')
  const isDay = ist.getHours() >= 6 && ist.getHours() < 19

  return (
    <div className={`col-span-2 sm:col-span-1 rounded-2xl p-5 flex flex-col justify-between ${CARD}`} style={tintStyle(7)}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Vizag, India</p>
        <span className="text-base">{isDay ? '☀️' : '🌙'}</span>
      </div>
      <div className="flex-1 flex items-center justify-center py-3">
        <p className="font-mono text-4xl font-bold tracking-tight">
          <span className="text-foreground">{hours}</span>
          <span className="animate-pulse" style={{ color: 'var(--color-brand)' }}>:</span>
          <span className="text-foreground">{mins}</span>
          <span className="text-muted-foreground/40 text-lg ml-1">{secs}</span>
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <p className="text-[11px] text-green-500 font-medium">Available for work</p>
      </div>
    </div>
  )
}

const REFLECTIONS = [
  { t: 'How we spend our days is, of course, how we spend our lives.', by: 'Annie Dillard' },
  { t: 'You could leave life right now. Let that determine what you do.', by: 'Marcus Aurelius' },
  { t: 'I wanted to live deep and suck out all the marrow of life.', by: 'Henry David Thoreau' },
]

function BentoReflectionCard() {
  const [i, setI] = useState(0)
  const [show, setShow] = useState(true)
  useEffect(() => {
    const id = setInterval(() => {
      setShow(false)
      setTimeout(() => { setI(n => (n + 1) % REFLECTIONS.length); setShow(true) }, 500)
    }, 7500)
    return () => clearInterval(id)
  }, [])
  const r = REFLECTIONS[i]
  return (
    <div className={`col-span-2 rounded-2xl overflow-hidden flex flex-col justify-center px-6 py-5 relative ${CARD}`} style={tintStyle(10)}>
      <span aria-hidden="true" className="absolute top-2 left-4 font-serif text-5xl leading-none select-none" style={{ color: 'color-mix(in oklab, var(--color-brand) 22%, transparent)' }}>“</span>
      <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-3">Reflection</p>
      <div style={{ opacity: show ? 1 : 0, transform: show ? 'none' : 'translateY(6px)', transition: 'opacity .5s ease, transform .5s ease' }}>
        <p className="font-serif italic text-foreground/90 leading-snug" style={{ fontSize: 'clamp(1.1rem, 2.1vw, 1.5rem)' }}>{r.t}</p>
        <p className="font-serif text-[12px] tracking-[0.14em] text-muted-foreground/60 mt-4">— {r.by}</p>
      </div>
    </div>
  )
}

const CURRENTLY = [
  { icon: '💼', text: <>Keeping systems reliable at <span className="font-semibold" style={{ color: 'var(--color-brand)' }}>GitHub</span></> },
  { icon: '🏔️', text: <>Chasing weekend summits &amp; trails</> },
  { icon: '🎧', text: <>The ambient radio on this site</> },
  { icon: '🎮', text: <>Valorant — ranked grind</> },
]

const SOCIALS = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/akkiran003/', d: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  { label: 'GitHub', href: 'https://github.com/kranthi0003', d: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12' },
  { label: 'X', href: 'https://x.com/kranthikiran03', d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
  { label: 'Email', href: 'mailto:kranthikiranakkumahanthi@gmail.com', mail: true },
]

export default function About() {
  return (
    <section id="about" className="py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="font-mono text-xs text-accent uppercase tracking-[0.2em] mb-3">About</p>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl" style={{ fontWeight: 500 }}>A bit about me</h2>
          <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-xl mx-auto">
            The engineer, the traveller, and the guy who thinks a little too much about living well.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[minmax(150px,auto)]">

          {/* ── Bio hero — full width ── */}
          <div className="col-span-2 sm:col-span-4 rounded-2xl relative overflow-hidden p-6 sm:p-8"
            style={{ background: 'linear-gradient(135deg, color-mix(in oklab, var(--color-brand) 15%, var(--color-card)) 0%, var(--color-card) 55%)', border: '1px solid color-mix(in oklab, var(--color-brand) 28%, transparent)' }}>
            <div aria-hidden="true" className="absolute -top-20 -right-10 w-60 h-60 rounded-full blur-3xl pointer-events-none" style={{ background: 'color-mix(in oklab, var(--color-brand) 22%, transparent)' }} />
            <div className="relative flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {/* Photo */}
              <div className="flex-shrink-0 rounded-2xl p-[3px]" style={{ background: 'linear-gradient(160deg, var(--color-brand), color-mix(in oklab, var(--color-brand) 20%, transparent))', boxShadow: '0 14px 40px -14px color-mix(in oklab, var(--color-brand) 55%, transparent)' }}>
                <img src={profile} alt="Kranthi Kiran" className="w-28 h-32 sm:w-32 sm:h-36 object-cover rounded-[14px] block" />
              </div>
              {/* Text */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <h3 className="font-heading font-bold text-xl sm:text-2xl">Kranthi Kiran</h3>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: 'color-mix(in oklab, #22c55e 15%, transparent)', color: '#22c55e' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Open to interesting work
                  </span>
                </div>
                <p className="text-sm font-medium mt-1" style={{ color: 'var(--color-brand)' }}>Support Engineer III · GitHub</p>
                <p className="text-[11px] text-muted-foreground">prev Amazon · Couchbase &nbsp;·&nbsp; from Visakhapatnam 🌊</p>
                <p className="text-sm text-foreground/85 leading-relaxed mt-3 max-w-2xl">
                  I keep large-scale systems boringly reliable at GitHub — five years spent making computers talk to
                  each other without drama. I care about the same thing in code and in life: small, intentional
                  choices, made consistently. Off the clock you'll find me on a Himalayan trail, temple-hopping across
                  South India, or deep in a Valorant ranked grind.
                </p>
                {/* Stats */}
                <div className="flex gap-6 sm:gap-8 mt-5 justify-center sm:justify-start">
                  {STATS.map(s => (
                    <div key={s.label}>
                      <p className="text-2xl sm:text-3xl leading-none"><StatNumber target={s.target} suffix={s.suffix} /></p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1.5">{s.label}</p>
                    </div>
                  ))}
                </div>
                {/* Socials */}
                <div className="flex gap-2.5 mt-5 justify-center sm:justify-start">
                  {SOCIALS.map(s => (
                    <a key={s.label} href={s.href} target={s.mail ? undefined : '_blank'} rel="noopener noreferrer" aria-label={s.label}
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-white transition-all"
                      style={{ border: '1px solid color-mix(in oklab, var(--color-border) 55%, transparent)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-brand)'; e.currentTarget.style.borderColor = 'var(--color-brand)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'color-mix(in oklab, var(--color-border) 55%, transparent)' }}>
                      {s.mail ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d={s.d} /></svg>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Currently ── */}
          <div className={`col-span-2 sm:col-span-1 rounded-2xl p-5 flex flex-col ${CARD}`} style={tintStyle(6)}>
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-3">Currently</p>
            <div className="space-y-2.5 flex-1 flex flex-col justify-center">
              {CURRENTLY.map((c, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-sm">{c.icon}</span>
                  <p className="text-[11.5px] text-foreground/90 leading-tight">{c.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Vizag clock ── */}
          <BentoClockCard />

          {/* ── Reflection ── */}
          <BentoReflectionCard />

          {/* ── GitHub contributions — full width ── */}
          <div className={`col-span-2 sm:col-span-4 rounded-2xl p-4 flex flex-col justify-center overflow-hidden ${CARD}`} style={tintStyle(5)}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest">GitHub Contributions</p>
              <a href="https://github.com/kranthi0003" target="_blank" rel="noopener noreferrer" className="text-[10px] hover:underline" style={{ color: 'var(--color-brand)' }}>@kranthi0003</a>
            </div>
            <GitHubHeatmap />
          </div>

        </div>
      </div>
    </section>
  )
}
