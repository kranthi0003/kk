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

          {/* LEFT RAIL — substantive cards */}
          <div className="hidden lg:flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <NowBuildingCard
              tint="var(--chart-1)"
              project="Developer Experience Tooling"
              role="Cloud Infrastructure · GitHub"
              summary="Internal tools and platform work that help engineering teams ship faster and operate with confidence."
              tags={['Go', 'TypeScript', 'K8s']}
            />
            <ImpactCard
              tint="var(--chart-2)"
              items={[
                { stat: '99.9%', label: 'Reliability across services I own and operate' },
                { stat: '6+ yrs', label: 'Production cloud infrastructure experience' },
                { stat: '50+', label: 'Open-source contributions across repos' },
              ]}
            />
            <FocusCard
              tint="var(--chart-3)"
              areas={[
                { name: 'Distributed Systems', level: 90 },
                { name: 'Cloud Infrastructure', level: 95 },
                { name: 'Developer Tooling', level: 85 },
                { name: 'Observability', level: 80 },
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

          {/* RIGHT RAIL — substantive cards */}
          <div className="hidden lg:flex flex-col gap-3 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <FeaturedProjectCard
              tint="var(--chart-2)"
              title="kranthikiran.com"
              role="This site · Built in public"
              summary="A live playground portfolio with collab editor, AI terminal, dev toolkit, and more — built end-to-end."
              stats={[
                { label: 'Stack', value: 'React · Vite' },
                { label: 'Features', value: '12+' },
                { label: 'Source', value: 'Open' },
              ]}
              href="https://github.com/kranthi0003/kranthi-kiran-site"
            />
            <WritingCard
              tint="var(--chart-1)"
              posts={[
                { title: 'Designing for operability: lessons from production', date: 'May 2026', read: '8 min' },
                { title: 'Why Bash is still the right tool for ops', date: 'Mar 2026', read: '6 min' },
                { title: 'Building developer tools people actually use', date: 'Feb 2026', read: '10 min' },
              ]}
            />
            <AvailabilityCard
              tint="var(--chart-3)"
              status="Open to chat"
              channels={[
                { name: 'Email', value: 'hello@kranthikiran.com', href: 'mailto:hello@kranthikiran.com' },
                { name: 'LinkedIn', value: '/in/kranthikiran3', href: 'https://linkedin.com/in/kranthikiran3' },
                { name: 'GitHub', value: '@kranthi0003', href: 'https://github.com/kranthi0003' },
              ]}
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


function NowBuildingCard({ tint, project, role, summary, tags }) {
  return (
    <TiltCard tint={tint} delay={0}>
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: tint }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: tint }} />
        </span>
        <p className="text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: `color-mix(in oklab, ${tint} 70%, var(--color-muted-foreground))` }}>
          Now building
        </p>
      </div>
      <p className="text-sm font-semibold text-foreground leading-tight">{project}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{role}</p>
      <p className="text-[12px] text-foreground/80 mt-2 leading-snug">{summary}</p>
      <div className="flex flex-wrap gap-1 mt-2.5">
        {tags.map((t, i) => (
          <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium"
            style={{
              background: `color-mix(in oklab, ${tint} 12%, transparent)`,
              color: `color-mix(in oklab, ${tint} 80%, white)`,
              boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${tint} 28%, transparent)`,
            }}>
            {t}
          </span>
        ))}
      </div>
    </TiltCard>
  )
}

function ImpactCard({ tint, items }) {
  return (
    <TiltCard tint={tint} delay={0.3}>
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold mb-3" style={{ color: `color-mix(in oklab, ${tint} 70%, var(--color-muted-foreground))` }}>
        Recent impact
      </p>
      <div className="space-y-2.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="font-heading text-lg font-bold leading-none tabular-nums flex-shrink-0 min-w-[56px]"
              style={{ background: `linear-gradient(135deg, ${tint}, color-mix(in oklab, ${tint} 55%, white))`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {it.stat}
            </span>
            <p className="text-[11.5px] text-foreground/80 leading-snug">{it.label}</p>
          </div>
        ))}
      </div>
    </TiltCard>
  )
}

function FocusCard({ tint, areas }) {
  return (
    <TiltCard tint={tint} delay={0.6}>
      <p className="text-[10px] uppercase tracking-[0.12em] font-semibold mb-3" style={{ color: `color-mix(in oklab, ${tint} 70%, var(--color-muted-foreground))` }}>
        Areas of depth
      </p>
      <div className="space-y-2">
        {areas.map((a, i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11.5px] font-medium text-foreground/90">{a.name}</span>
              <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{a.level}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'color-mix(in oklab, var(--color-border) 60%, transparent)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${a.level}%`,
                  background: `linear-gradient(90deg, color-mix(in oklab, ${tint} 50%, transparent), ${tint})`,
                  boxShadow: `0 0 6px color-mix(in oklab, ${tint} 60%, transparent)`,
                }} />
            </div>
          </div>
        ))}
      </div>
    </TiltCard>
  )
}

function FeaturedProjectCard({ tint, title, role, summary, stats, href }) {
  return (
    <TiltCard tint={tint} delay={0.15} as="a" href={href} target="_blank" rel="noopener noreferrer" className="block">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: `color-mix(in oklab, ${tint} 70%, var(--color-muted-foreground))` }}>
          Featured project
        </p>
        <svg className="w-3 h-3 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H8M17 7v9"/></svg>
      </div>
      <p className="font-mono text-base font-bold text-foreground leading-tight">{title}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{role}</p>
      <p className="text-[12px] text-foreground/80 mt-2 leading-snug">{summary}</p>
      <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-border/40">
        {stats.map((s, i) => (
          <div key={i}>
            <p className="text-[9.5px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="text-[12px] font-bold text-foreground tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>
    </TiltCard>
  )
}

function WritingCard({ tint, posts }) {
  return (
    <TiltCard tint={tint} delay={0.45}>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: `color-mix(in oklab, ${tint} 70%, var(--color-muted-foreground))` }}>
          Recent writing
        </p>
        <span className="text-[10px] font-mono text-muted-foreground">{posts.length} posts</span>
      </div>
      <div className="space-y-2">
        {posts.map((p, i) => (
          <div key={i} className="group cursor-pointer">
            <p className="text-[12px] font-medium text-foreground/90 leading-snug group-hover:text-foreground transition-colors">
              {p.title}
            </p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
              <span>{p.date}</span>
              <span style={{ color: `color-mix(in oklab, ${tint} 50%, transparent)` }}>·</span>
              <span>{p.read} read</span>
            </div>
          </div>
        ))}
      </div>
    </TiltCard>
  )
}

function AvailabilityCard({ tint, status, channels }) {
  const [copied, setCopied] = React.useState(null)
  const copy = (e, val) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard?.writeText(val)
    setCopied(val)
    setTimeout(() => setCopied(null), 1500)
  }
  return (
    <TiltCard tint={tint} delay={0.75}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <p className="text-[11px] font-semibold text-foreground">{status}</p>
      </div>
      <p className="text-[11px] text-muted-foreground mb-2.5 leading-snug">
        Open to interesting infra problems, IC roles, and short consults.
      </p>
      <div className="space-y-1.5">
        {channels.map((c, i) => (
          <a
            key={i}
            href={c.href}
            target={c.href.startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-2 px-2 py-1 rounded-md transition-colors hover:bg-foreground/5"
          >
            <span className="text-[10px] uppercase tracking-wider font-semibold flex-shrink-0"
              style={{ color: `color-mix(in oklab, ${tint} 70%, var(--color-muted-foreground))` }}>
              {c.name}
            </span>
            <span className="text-[11px] font-mono text-foreground/80 truncate">{c.value}</span>
            {c.href.startsWith('mailto') && (
              <button
                onClick={(e) => copy(e, c.value.replace('mailto:', ''))}
                className="flex-shrink-0 text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded transition-colors"
                style={{
                  background: `color-mix(in oklab, ${tint} 14%, transparent)`,
                  color: `color-mix(in oklab, ${tint} 80%, white)`,
                }}
              >
                {copied === c.value ? '✓' : 'copy'}
              </button>
            )}
          </a>
        ))}
      </div>
    </TiltCard>
  )
}
