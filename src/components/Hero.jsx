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

          {/* LEFT RAIL — engineered cards */}
          <div className="hidden lg:flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <TerminalCard tint="var(--chart-1)" />
            <TechRadarCard tint="var(--chart-2)" />
            <BookshelfCard tint="var(--chart-3)" />
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

          {/* RIGHT RAIL — engineered cards */}
          <div className="hidden lg:flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <RecentShipsCard tint="var(--chart-2)" />
            <UptimeCard tint="var(--chart-1)" />
            <CollabCard tint="var(--chart-3)" />
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

// 3D tilt + lift + colored glow follow-cursor wrapper
function TiltCard({ tint, delay = 0, className = '', as: As = 'div', children, ...rest }) {
  const ref = React.useRef(null)
  const handleMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    const rx = (0.5 - y) * 6
    const ry = (x - 0.5) * 8
    el.style.transform = `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`
    el.style.setProperty('--mx', `${x * 100}%`)
    el.style.setProperty('--my', `${y * 100}%`)
  }
  const handleLeave = () => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(700px) rotateX(0) rotateY(0) translateY(0)'
  }
  return (
    <As
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`hero-card-tilt rounded-xl p-4 relative overflow-hidden ${className}`}
      style={{
        ...cardShell(tint),
        backgroundImage: `radial-gradient(180px circle at var(--mx, 50%) var(--my, 0%), color-mix(in oklab, ${tint} 28%, transparent), transparent 70%), radial-gradient(ellipse 100% 60% at 50% 0%, color-mix(in oklab, ${tint} 14%, transparent) 0%, transparent 70%)`,
        animationDelay: `${delay}s`,
      }}
      {...rest}
    >
      <span className="hero-card-shimmer" aria-hidden="true" style={{ '--shimmer-delay': `${delay}s` }} />
      {children}
    </As>
  )
}

function useCountUp(target, duration = 1400) {
  const [n, setN] = React.useState(0)
  React.useEffect(() => {
    const start = performance.now()
    let raf
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(target * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return n
}



/* ─────────── TerminalCard ─────────── */
function TerminalCard({ tint }) {
  const lines = React.useMemo(() => ([
    { kind: 'cmd', text: 'whoami' },
    { kind: 'out', text: 'kranthi · cloud engineer' },
    { kind: 'cmd', text: 'cat ~/about.txt' },
    { kind: 'out', text: 'Building reliable cloud infrastructure' },
    { kind: 'out', text: 'and developer tooling at GitHub.' },
    { kind: 'cmd', text: 'echo $LOCATION' },
    { kind: 'out', text: 'Hyderabad, IN · UTC+05:30' },
    { kind: 'cmd', text: 'ls projects/' },
    { kind: 'out', text: 'dev-toolkit  collab-editor  this-site/' },
    { kind: 'cmd', text: '' },
  ]), [])
  const [shown, setShown] = React.useState(0)
  React.useEffect(() => {
    if (shown >= lines.length) return
    const t = setTimeout(() => setShown((s) => s + 1), shown === 0 ? 600 : (lines[shown - 1]?.kind === 'cmd' ? 350 : 220))
    return () => clearTimeout(t)
  }, [shown, lines])
  return (
    <TiltCard tint={tint} delay={0}>
      <div className="flex items-center gap-1.5 mb-2 -mt-1 -mx-1">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <span className="ml-2 text-[10px] font-mono text-muted-foreground">kranthi@portfolio:~</span>
      </div>
      <div className="font-mono text-[11px] leading-[1.55] space-y-0.5 min-h-[170px]">
        {lines.slice(0, shown).map((ln, i) => (
          <div key={i} className="flex gap-1.5">
            {ln.kind === 'cmd' ? (
              <>
                <span style={{ color: tint }}>$</span>
                <span className="text-foreground">{ln.text}</span>
                {i === shown - 1 && <span className="inline-block w-1.5 h-3 bg-foreground/70 ml-0.5 animate-pulse" />}
              </>
            ) : (
              <span className="text-muted-foreground pl-3">{ln.text}</span>
            )}
          </div>
        ))}
      </div>
    </TiltCard>
  )
}

/* ─────────── TechRadarCard ─────────── */
function TechRadarCard({ tint }) {
  const techs = React.useMemo(() => ([
    { name: 'Go',         q: 0, r: 0.30, color: '#00ADD8' },
    { name: 'TypeScript', q: 0, r: 0.55, color: '#3178C6' },
    { name: 'K8s',        q: 0, r: 0.40, color: '#326CE5' },
    { name: 'Terraform',  q: 1, r: 0.32, color: '#7B42BC' },
    { name: 'Rust',       q: 1, r: 0.58, color: '#DEA584' },
    { name: 'eBPF',       q: 1, r: 0.75, color: '#FFB400' },
    { name: 'OpenTel',    q: 2, r: 0.45, color: '#425CC7' },
    { name: 'Pulumi',     q: 2, r: 0.65, color: '#8A3FFC' },
    { name: 'Helm',       q: 3, r: 0.50, color: '#0F1689' },
    { name: 'Argo',       q: 3, r: 0.35, color: '#EF7B4D' },
  ]), [])
  const labels = ['Adopt', 'Trial', 'Assess', 'Hold']
  const cx = 80, cy = 75, R = 65
  const angleFor = (q, idx, total) => {
    // q=0 top-right, q=1 bottom-right, q=2 bottom-left, q=3 top-left
    const base = [-Math.PI/2 + Math.PI/8, Math.PI/2 - Math.PI/8, Math.PI/2 + Math.PI/8, -Math.PI/2 - Math.PI/8]
    return base[q] + (idx / Math.max(1,total)) * (Math.PI/4 - 0.15)
  }
  const [hover, setHover] = React.useState(null)
  // group by quadrant for stable index
  const grouped = [0,1,2,3].map(q => techs.filter(t => t.q === q))
  return (
    <TiltCard tint={tint} delay={0.3}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: `color-mix(in oklab, ${tint} 70%, var(--color-muted-foreground))` }}>
          Tech radar
        </p>
        <span className="text-[10px] font-mono text-muted-foreground">{hover ? hover.name : 'hover →'}</span>
      </div>
      <div className="relative -mx-1 -mb-1">
        <svg viewBox="0 0 160 150" className="w-full h-[150px]">
          {/* concentric rings */}
          {[0.25, 0.5, 0.75, 1].map((p, i) => (
            <circle key={i} cx={cx} cy={cy} r={R * p} fill="none" stroke="color-mix(in oklab, var(--color-border) 70%, transparent)" strokeWidth="0.5" strokeDasharray={i === 3 ? '0' : '2 2'} />
          ))}
          {/* quadrant dividers */}
          <line x1={cx} y1={cy - R} x2={cx} y2={cy + R} stroke="color-mix(in oklab, var(--color-border) 70%, transparent)" strokeWidth="0.5" />
          <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke="color-mix(in oklab, var(--color-border) 70%, transparent)" strokeWidth="0.5" />
          {/* quadrant labels */}
          <text x={cx + R - 2} y={cy - R + 8} textAnchor="end" fontSize="7" fill="color-mix(in oklab, var(--color-muted-foreground) 80%, transparent)">{labels[0]}</text>
          <text x={cx + R - 2} y={cy + R - 2} textAnchor="end" fontSize="7" fill="color-mix(in oklab, var(--color-muted-foreground) 80%, transparent)">{labels[1]}</text>
          <text x={cx - R + 2} y={cy + R - 2} textAnchor="start" fontSize="7" fill="color-mix(in oklab, var(--color-muted-foreground) 80%, transparent)">{labels[2]}</text>
          <text x={cx - R + 2} y={cy - R + 8} textAnchor="start" fontSize="7" fill="color-mix(in oklab, var(--color-muted-foreground) 80%, transparent)">{labels[3]}</text>
          {/* dots */}
          {grouped.map((arr, q) => arr.map((t, i) => {
            const ang = angleFor(q, i, arr.length)
            const x = cx + Math.cos(ang) * t.r * R
            const y = cy + Math.sin(ang) * t.r * R
            const isHover = hover && hover.name === t.name
            return (
              <g key={t.name} style={{ cursor: 'pointer' }} onMouseEnter={() => setHover(t)} onMouseLeave={() => setHover(null)}>
                <circle cx={x} cy={y} r={isHover ? 4 : 3} fill={t.color} stroke="var(--color-background)" strokeWidth="0.8" style={{ transition: 'r 0.15s', filter: isHover ? `drop-shadow(0 0 6px ${t.color})` : 'none' }} />
              </g>
            )
          }))}
        </svg>
      </div>
    </TiltCard>
  )
}

/* ─────────── BookshelfCard ─────────── */
function BookshelfCard({ tint }) {
  const books = [
    { title: 'Designing Data-Intensive Apps', author: 'Kleppmann', color: '#8B5CF6' },
    { title: 'The Pragmatic Programmer', author: 'Hunt, Thomas', color: '#EC4899' },
    { title: 'Staff Engineer', author: 'Larson', color: '#F59E0B' },
    { title: 'Site Reliability Engineering', author: 'Google', color: '#10B981' },
  ]
  return (
    <TiltCard tint={tint} delay={0.6}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: `color-mix(in oklab, ${tint} 70%, var(--color-muted-foreground))` }}>
          Bookshelf
        </p>
        <span className="text-[10px] font-mono text-muted-foreground">{books.length} current</span>
      </div>
      <div className="flex items-end gap-1 h-[68px] mb-2">
        {books.map((b, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm relative group cursor-pointer transition-all hover:-translate-y-1"
            style={{
              height: `${72 + (i % 3) * 8}%`,
              background: `linear-gradient(180deg, ${b.color}, color-mix(in oklab, ${b.color} 50%, black))`,
              boxShadow: `inset 1px 0 0 rgba(255,255,255,0.18), inset -1px 0 0 rgba(0,0,0,0.3)`,
            }}
            title={`${b.title} — ${b.author}`}
          >
            <span
              className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white/90 px-0.5 leading-tight text-center"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {b.title.split(' ').slice(0, 3).join(' ')}
            </span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-foreground/80 leading-snug">
        <span className="text-muted-foreground">Currently:</span> <span className="font-medium">{books[0].title}</span>
      </p>
    </TiltCard>
  )
}

/* ─────────── RecentShipsCard ─────────── */
function RecentShipsCard({ tint }) {
  const ships = [
    { name: 'kranthikiran.com', desc: 'Site redesign — provisionr violet theme', when: '2h ago', kind: 'feat' },
    { name: 'collab-editor', desc: 'Multiplayer code rooms with Y.js', when: '3d', kind: 'feat' },
    { name: 'dev-toolkit', desc: 'JSON / Base64 / JWT / SQL formatters', when: '1w', kind: 'feat' },
    { name: 'transformation-hq', desc: 'Universal text encoder / converter', when: '2w', kind: 'feat' },
  ]
  const kindColor = (k) => k === 'feat' ? tint : 'var(--chart-3)'
  return (
    <TiltCard tint={tint} delay={0.15}>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: `color-mix(in oklab, ${tint} 70%, var(--color-muted-foreground))` }}>
          Recently shipped
        </p>
        <span className="text-[10px] font-mono text-muted-foreground">on this site</span>
      </div>
      <div className="space-y-2">
        {ships.map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: kindColor(s.kind), boxShadow: `0 0 6px ${kindColor(s.kind)}` }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[12px] font-mono font-semibold text-foreground truncate">{s.name}</p>
                <span className="text-[10px] text-muted-foreground tabular-nums flex-shrink-0">{s.when}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </TiltCard>
  )
}

/* ─────────── UptimeCard ─────────── */
function UptimeCard({ tint }) {
  // 30 bars representing 30-day uptime; mostly green w/ one degraded
  const bars = React.useMemo(() => {
    const arr = []
    for (let i = 0; i < 30; i++) {
      const r = Math.abs(Math.sin((i + 5) * 1.7))
      arr.push(r > 0.92 ? 'degraded' : 'up')
    }
    return arr
  }, [])
  return (
    <TiltCard tint={tint} delay={0.45}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <p className="text-[11px] font-semibold text-foreground">Site is operational</p>
        </div>
        <span className="text-[10px] font-mono text-emerald-500 tabular-nums">99.92%</span>
      </div>
      <div className="flex items-end gap-[2px] h-7">
        {bars.map((s, i) => (
          <span
            key={i}
            className="flex-1 rounded-sm"
            style={{
              height: '100%',
              background: s === 'up'
                ? `linear-gradient(180deg, color-mix(in oklab, ${tint} 35%, transparent), color-mix(in oklab, ${tint} 75%, transparent))`
                : 'linear-gradient(180deg, rgba(245,158,11,0.4), rgba(245,158,11,0.8))',
              boxShadow: s === 'up' ? `inset 0 -1px 0 color-mix(in oklab, ${tint} 50%, transparent)` : 'inset 0 -1px 0 rgba(245,158,11,0.6)',
            }}
            title={`Day ${30-i} · ${s}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground font-mono">
        <span>30 days ago</span>
        <span>today</span>
      </div>
    </TiltCard>
  )
}

/* ─────────── CollabCard ─────────── */
function CollabCard({ tint }) {
  const offers = [
    { icon: '◇', label: 'IC engineering roles', desc: 'Cloud, infra, dev tooling' },
    { icon: '◇', label: 'Short consults', desc: 'Architecture review, audit' },
    { icon: '◇', label: 'OSS collaboration', desc: 'Tools & libraries' },
  ]
  return (
    <TiltCard tint={tint} delay={0.75}>
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold mb-2.5" style={{ color: `color-mix(in oklab, ${tint} 70%, var(--color-muted-foreground))` }}>
        Let's work together
      </p>
      <div className="space-y-2 mb-3">
        {offers.map((o, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-base leading-none mt-0.5" style={{ color: tint }}>{o.icon}</span>
            <div className="min-w-0">
              <p className="text-[12px] font-medium text-foreground leading-tight">{o.label}</p>
              <p className="text-[10.5px] text-muted-foreground">{o.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <a
        href="#connect"
        className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md text-[11px] font-semibold transition-all"
        style={{
          background: `color-mix(in oklab, ${tint} 16%, transparent)`,
          color: `color-mix(in oklab, ${tint} 85%, white)`,
          boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${tint} 35%, transparent)`,
        }}
      >
        Get in touch
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
      </a>
    </TiltCard>
  )
}
