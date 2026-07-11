import React, { useState, useEffect } from 'react'

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

export default function About() {
  return (
    <section id="about" className="py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="font-mono text-xs text-accent uppercase tracking-[0.2em] mb-3">About</p>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl" style={{ fontWeight: 500 }}>A bit about me</h2>
          <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-xl mx-auto">
            Where I am, what I'm into, and what I keep coming back to.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-[minmax(150px,auto)]">

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
