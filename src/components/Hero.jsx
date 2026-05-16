import React from 'react'
import profile from '../../assets/profile.png'
import satellite from '../../assets/satellite-collage.png'
import TypingText from './TypingText'

function useNow(intervalMs = 1000) {
  const [now, setNow] = React.useState(() => new Date())
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

export default function Hero({ onResumeClick }) {
  return (
    <section id="home" className="relative min-h-screen flex items-center pt-16 md:pt-20 overflow-hidden">
      {/* Satellite backdrop — subtle band */}
      <div className="absolute inset-x-0 top-14 md:top-14 h-[28%] md:h-[32%] z-0 overflow-hidden pointer-events-none">
        <img
          src={satellite}
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-center opacity-[0.07] dark:opacity-[0.14]"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute inset-y-0 left-0 w-10 sm:w-20 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute inset-y-0 right-0 w-10 sm:w-20 bg-gradient-to-l from-background to-transparent" />
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6 md:py-8 lg:py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-10 items-center">

          {/* LEFT RAIL — varied cards */}
          <div className="hidden lg:flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <BigStatCard
              tint="var(--chart-1)"
              value="5+"
              unit="yrs"
              label="Building cloud infra"
              sub="GitHub · Microsoft · prior startups"
            />
            <ClockCard
              tint="var(--chart-2)"
              label="My local time"
              city="Hyderabad, IN"
            />
            <StackChipsCard
              tint="var(--chart-3)"
              label="Stack of choice"
              chips={[
                { name: 'Go', color: '#00ADD8' },
                { name: 'TypeScript', color: '#3178C6' },
                { name: 'Kubernetes', color: '#326CE5' },
                { name: 'Terraform', color: '#7B42BC' },
                { name: 'AWS', color: '#FF9900' },
                { name: 'Azure', color: '#0078D4' },
              ]}
            />
          </div>

          {/* CENTER — main hero content */}
          <div className="text-center w-full max-w-2xl mx-auto">
            <div className="mb-5 md:mb-7 animate-fade-in-up">
              <div className="relative inline-block">
                <div className="absolute -inset-3 bg-accent/20 rounded-full blur-2xl" />
                <div className="relative p-[2px] rounded-full bg-gradient-to-br from-accent/70 via-accent/30 to-accent/70">
                  <img
                    src={profile}
                    alt="Kranthi Kiran"
                    className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full object-cover mx-auto border-[3px] border-background"
                  />
                </div>
              </div>
            </div>

            <div className="mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/60 bg-card/30 backdrop-blur text-xs font-medium text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Currently at GitHub · Microsoft
              </span>
            </div>

            <h1
              className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-4 animate-fade-in-up"
              style={{ animationDelay: '0.2s', fontWeight: 600 }}
            >
              Hey, I'm <span className="text-gradient-violet">Kranthi</span>
            </h1>

            <h2
              className="font-heading text-lg sm:text-xl md:text-2xl text-muted-foreground mb-5 animate-fade-in-up"
              style={{ animationDelay: '0.3s', fontWeight: 500 }}
            >
              <TypingText
                phrases={['Cloud Engineer', 'Infrastructure Builder', 'Distributed Systems Nerd', 'GitHub Engineer']}
                typingSpeed={120}
                deletingSpeed={60}
                pauseDuration={2500}
              />
            </h2>

            <p className="font-body text-base md:text-lg text-muted-foreground/90 max-w-2xl mx-auto mb-8 animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.4s' }}>
              I build reliable infrastructure, tame distributed systems,
              and craft tools that make engineering teams more productive.
            </p>

            <div className="flex flex-wrap gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <button
                onClick={onResumeClick}
                data-resume-btn
                className="px-5 py-2.5 rounded-md bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity"
              >
                View Resume
              </button>
              <a
                href="#connect"
                className="px-5 py-2.5 rounded-md border border-border/80 text-foreground font-medium text-sm hover:bg-muted/40 transition-colors"
              >
                Get in Touch →
              </a>
            </div>

            <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
              <button
                onClick={() => { window.location.hash = '#/collab'; window.location.reload() }}
                className="group inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border/70 bg-card/40 backdrop-blur text-sm font-medium text-foreground hover:border-accent/50 hover:bg-accent/5 transition-colors"
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
                </span>
                Open Collab — code &amp; battle live
                <span className="text-muted-foreground group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>
          </div>

          {/* RIGHT RAIL — varied cards */}
          <div className="hidden lg:flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <GitHubCard
              tint="var(--chart-2)"
              user="kranthi0003"
            />
            <ActivityCard
              tint="var(--chart-1)"
              label="Coding activity"
            />
            <QuoteCard
              tint="var(--chart-3)"
              quote="Ship boring infra. Save the magic for the product."
            />
          </div>

        </div>
      </div>
    </section>
  )
}

function cardShell(tint) {
  return {
    background: 'var(--color-card)',
    backgroundImage: `radial-gradient(ellipse 100% 60% at 50% 0%, color-mix(in oklab, ${tint} 14%, transparent) 0%, transparent 70%)`,
    boxShadow: `inset 0 1px 0 0 rgba(255,255,255,0.06), inset 0 0 0 1px color-mix(in oklab, ${tint} 22%, var(--color-border)), 0 4px 14px -4px color-mix(in oklab, ${tint} 25%, transparent)`,
  }
}

function BigStatCard({ tint, value, unit, label, sub }) {
  return (
    <div className="rounded-xl p-4" style={cardShell(tint)}>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="font-heading text-4xl font-bold leading-none" style={{ background: `linear-gradient(135deg, ${tint}, color-mix(in oklab, ${tint} 60%, white))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {value}
        </span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{unit}</span>
      </div>
      <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
    </div>
  )
}

function ClockCard({ tint, label, city }) {
  const now = useNow(1000)
  const time = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  const date = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short' })
  return (
    <div className="rounded-xl p-4" style={cardShell(tint)}>
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold mb-2" style={{ color: `color-mix(in oklab, ${tint} 70%, var(--color-muted-foreground))` }}>{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xl font-bold text-foreground tabular-nums tracking-tight">{time}</span>
        <span className="text-[10px] font-mono text-muted-foreground">IST</span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5">
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
        {city} · {date}
      </p>
    </div>
  )
}

function StackChipsCard({ tint, label, chips }) {
  return (
    <div className="rounded-xl p-4" style={cardShell(tint)}>
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold mb-2.5" style={{ color: `color-mix(in oklab, ${tint} 70%, var(--color-muted-foreground))` }}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold"
            style={{
              background: `color-mix(in oklab, ${c.color} 14%, transparent)`,
              color: c.color,
              boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${c.color} 35%, transparent)`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
            {c.name}
          </span>
        ))}
      </div>
    </div>
  )
}

function GitHubCard({ tint, user }) {
  return (
    <a href={`https://github.com/${user}`} target="_blank" rel="noopener noreferrer" className="block rounded-xl p-4 transition-transform hover:-translate-y-0.5" style={cardShell(tint)}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `color-mix(in oklab, ${tint} 18%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${tint} 35%, transparent)` }}>
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" style={{ color: tint }}>
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">@{user}</p>
          <p className="text-[11px] text-muted-foreground">50+ repos · 200+ stars</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/40">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Repos</p>
          <p className="text-sm font-bold text-foreground">52</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Stars</p>
          <p className="text-sm font-bold text-foreground">214</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">PRs</p>
          <p className="text-sm font-bold text-foreground">900+</p>
        </div>
      </div>
    </a>
  )
}

function ActivityCard({ tint, label }) {
  // Generate a stable pseudo-random 7-week heatmap (5 levels)
  const cells = React.useMemo(() => {
    const seed = 17
    const arr = []
    for (let i = 0; i < 49; i++) {
      const v = Math.abs(Math.sin((i + seed) * 1.3)) // 0..1
      const level = v > 0.85 ? 4 : v > 0.65 ? 3 : v > 0.45 ? 2 : v > 0.2 ? 1 : 0
      arr.push(level)
    }
    return arr
  }, [])
  return (
    <div className="rounded-xl p-4" style={cardShell(tint)}>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: `color-mix(in oklab, ${tint} 70%, var(--color-muted-foreground))` }}>{label}</p>
        <span className="text-[10px] font-mono text-muted-foreground">last 7w</span>
      </div>
      <div className="grid grid-rows-7 grid-flow-col gap-[3px]">
        {cells.map((lvl, i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-[2px]"
            style={{
              background: lvl === 0
                ? 'color-mix(in oklab, var(--color-border) 60%, transparent)'
                : `color-mix(in oklab, ${tint} ${15 + lvl * 18}%, transparent)`,
              boxShadow: lvl > 0 ? `inset 0 0 0 1px color-mix(in oklab, ${tint} ${20 + lvl * 15}%, transparent)` : 'none',
            }}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-2.5">Commits across personal &amp; work repos</p>
    </div>
  )
}

function QuoteCard({ tint, quote }) {
  return (
    <div className="rounded-xl p-4 relative" style={cardShell(tint)}>
      <span className="absolute top-1.5 left-2 font-heading text-4xl leading-none opacity-30" style={{ color: tint }}>"</span>
      <p className="font-heading italic text-sm leading-snug text-foreground pl-5 pr-1 pt-1">
        {quote}
      </p>
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-right mt-2.5" style={{ color: `color-mix(in oklab, ${tint} 70%, var(--color-muted-foreground))` }}>
        — my engineering rule
      </p>
    </div>
  )
}
