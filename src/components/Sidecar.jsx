import React, { useEffect, useMemo, useState } from 'react'

// "The Sidecar" — a slide-in drawer, opened from the round button in the rail.
//
// It used to hold the next F1 race, the F1 championship table and upcoming
// Indian films. All three were fine cards, and all three became redundant:
// #/f1 now covers the race and the standings in far more depth, and
// #/movies reads the very same movies.json this drawer was reading. A
// drawer that repeats the pages beside it is just a second place to keep
// the same thing correct.
//
// So it holds what the rest of the site doesn't. Each card had to clear one
// bar — nothing else here already answers this:
//
//   Money      no currency anywhere on the site, and the distance between
//              a dollar and a rupee is a daily fact of working for an
//              American company from India.
//   Timezones  About has a clock, but a clock tells you his time, not
//              whether the people he works with are awake.
//   New repos  GitHubStats and the heatmap are his own profile; what the
//              rest of GitHub is starring is a different question.
//
// Ruled out after checking, because the site already has them: cloud
// status (ServiceStatus watches GitHub, npm, Cloudflare, OpenAI, Stripe and
// more), tech news (the navbar feed), crypto (wallet, dashboard, ticker),
// weather (removed on purpose), and anything F1, cricket, film, music or
// food — all of which have their own pages now.

// Shared card chrome so every Sidecar card reads as one family.
function Shell({ icon, title, tint, right, children }) {
  return (
    <section className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)', background: 'color-mix(in oklab, var(--color-card) 60%, transparent)' }}>
      <div className="px-4 py-2.5 flex items-center gap-2 border-b" style={{ borderColor: 'color-mix(in oklab, var(--color-border) 70%, transparent)', background: `linear-gradient(180deg, color-mix(in oklab, ${tint} 12%, transparent), transparent)` }}>
        <span aria-hidden="true">{icon}</span>
        <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground">{title}</span>
        {right ? <span className="ml-auto">{right}</span> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

const Loading = ({ label }) => (
  <div className="h-16 flex items-center justify-center">
    <span className="text-xs font-mono text-muted-foreground animate-pulse">{label}</span>
  </div>
)

const Failed = ({ label }) => (
  <p className="text-[12.5px] text-muted-foreground leading-relaxed">{label}</p>
)

/* ------------------------------------------------------------------ *
 * Money — what a dollar, a euro and a pound are worth in rupees.
 *
 * Frankfurter republishes the European Central Bank's daily reference
 * rates: no key, no attribution requirement, CORS open. It moves once a
 * working day, so this is a benchmark rather than a live market price —
 * which the card says, because quoting a stale number as though it were
 * live is how a site stops being trusted.
 * ------------------------------------------------------------------ */

const MONEY_CACHE = 'sidecar_fx'
const MONEY_TTL = 3600000 // an hour; the source only moves once a day

function MoneyCard() {
  const [data, setData] = useState(undefined)

  useEffect(() => {
    try {
      const c = JSON.parse(sessionStorage.getItem(MONEY_CACHE) || 'null')
      if (c && Date.now() - c.ts < MONEY_TTL) { setData(c.d); return }
    } catch {}

    let alive = true
    fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR,EUR,GBP')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        if (!alive) return
        const usdInr = j?.rates?.INR
        if (!usdInr) throw new Error('no rate')
        // Everything is quoted against USD; the interesting direction is
        // the other way round, so EUR and GBP convert through it.
        const d = {
          date: j.date,
          rows: [
            { code: 'USD', flag: '🇺🇸', inr: usdInr },
            { code: 'EUR', flag: '🇪🇺', inr: j.rates.EUR ? usdInr / j.rates.EUR : null },
            { code: 'GBP', flag: '🇬🇧', inr: j.rates.GBP ? usdInr / j.rates.GBP : null },
          ].filter((r) => r.inr),
        }
        setData(d)
        try { sessionStorage.setItem(MONEY_CACHE, JSON.stringify({ d, ts: Date.now() })) } catch {}
      })
      .catch(() => { if (alive) setData(null) })
    return () => { alive = false }
  }, [])

  const shell = (children, right) => (
    <Shell icon="💱" title="Money · Rupee" tint="#5FBF8F" right={right}>{children}</Shell>
  )

  if (data === undefined) return shell(<Loading label="checking rates…" />)
  if (data === null) return shell(<Failed label="Rates didn’t load. The European Central Bank publishes once a working day; try again shortly." />)

  return shell(
    <>
      <div className="space-y-2">
        {data.rows.map((r) => (
          <div key={r.code} className="flex items-baseline gap-2.5">
            <span aria-hidden="true">{r.flag}</span>
            <span className="text-[12px] font-mono text-muted-foreground w-8">{r.code}</span>
            <span className="text-[15px] font-mono font-medium tabular-nums text-foreground">
              ₹{r.inr.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10.5px] text-muted-foreground leading-relaxed">
        European Central Bank reference rates — a daily benchmark, not a live market price.
      </p>
    </>,
    <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{data.date}</span>
  )
}

/* ------------------------------------------------------------------ *
 * Timezones — whether the people he works with are awake.
 *
 * No API and no clock drift to manage: Intl does the whole job from the
 * browser's own timezone database, including whichever side of a
 * daylight-saving change today happens to fall on. Hardcoding "IST is PT
 * plus twelve and a half hours" would be wrong twice a year.
 * ------------------------------------------------------------------ */

const ZONES = [
  { label: 'Vizag', tz: 'Asia/Kolkata', me: true },
  { label: 'London', tz: 'Europe/London' },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'Seattle', tz: 'America/Los_Angeles' },
]

// Roughly awake and reachable — not office hours. The useful question is
// "would a message land now, or wait until morning".
const AWAKE_FROM = 9
const AWAKE_TO = 21

function TimezoneCard() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    // On the half-minute, not the second: nothing here shows seconds, so
    // a per-second timer would be a wasted wake-up on every device.
    const id = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  const rows = useMemo(() => ZONES.map((z) => {
    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: z.tz, hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(now)
    const day = new Intl.DateTimeFormat('en-GB', { timeZone: z.tz, weekday: 'short' }).format(now)
    const hour = parseInt(time.slice(0, 2), 10)
    const weekend = day === 'Sat' || day === 'Sun'
    return { ...z, time, day, awake: hour >= AWAKE_FROM && hour < AWAKE_TO, weekend }
  }), [now])

  const others = rows.filter((r) => !r.me)
  const reachable = others.filter((r) => r.awake && !r.weekend).length

  return (
    <Shell
      icon="🕒"
      title="Timezones · Who’s up"
      tint="#7FA8D8"
      right={<span className="text-[10px] font-mono text-muted-foreground">{reachable}/{others.length} awake</span>}
    >
      <div className="space-y-2">
        {rows.map((z) => (
          <div key={z.tz} className="flex items-center gap-2.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: z.awake && !z.weekend ? '#35B96C' : 'color-mix(in oklab, var(--color-foreground) 22%, transparent)' }}
              aria-hidden="true"
            />
            <span className={'text-[12.5px] ' + (z.me ? 'text-foreground font-medium' : 'text-muted-foreground')}>
              {z.label}{z.me ? ' · him' : ''}
            </span>
            <span className="ml-auto text-[13px] font-mono tabular-nums text-foreground">{z.time}</span>
            <span className="text-[10.5px] font-mono text-muted-foreground w-7 text-right">{z.day}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10.5px] text-muted-foreground leading-relaxed">
        Green is 9am–9pm on a weekday — likely to reply today.
      </p>
    </Shell>
  )
}

/* ------------------------------------------------------------------ *
 * New repos — what the rest of GitHub started starring this month.
 *
 * The trending page has no API, so this asks the documented search API
 * for repositories created in the last 30 days, most-starred first. Close
 * enough, and an endpoint rather than a scrape.
 *
 * Anonymous search allows 10 requests a minute counted per IP, so one
 * visitor is nowhere near the limit — but it is cached for the session
 * anyway, because opening and closing a drawer should not spend anyone’s
 * quota.
 * ------------------------------------------------------------------ */

const REPO_CACHE = 'sidecar_new_repos'
const REPO_TTL = 21600000 // six hours

const compact = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : String(n))

function NewReposCard() {
  const [data, setData] = useState(undefined)

  useEffect(() => {
    try {
      const c = JSON.parse(sessionStorage.getItem(REPO_CACHE) || 'null')
      if (c && Date.now() - c.ts < REPO_TTL) { setData(c.d); return }
    } catch {}

    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
    let alive = true
    fetch(`https://api.github.com/search/repositories?q=created:>${since}&sort=stars&order=desc&per_page=5`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => {
        if (!alive) return
        const d = (j.items || []).slice(0, 5).map((r) => ({
          name: r.full_name, url: r.html_url, stars: r.stargazers_count,
          lang: r.language, desc: r.description,
        }))
        if (!d.length) throw new Error('empty')
        setData(d)
        try { sessionStorage.setItem(REPO_CACHE, JSON.stringify({ d, ts: Date.now() })) } catch {}
      })
      .catch(() => { if (alive) setData(null) })
    return () => { alive = false }
  }, [])

  const shell = (children) => (
    <Shell icon="⭐" title="GitHub · New this month" tint="#C9A227">{children}</Shell>
  )

  if (data === undefined) return shell(<Loading label="asking GitHub…" />)
  if (data === null) return shell(<Failed label="GitHub’s search API didn’t answer. It rate-limits anonymous requests, so this usually clears on its own." />)

  return shell(
    <>
      <ul className="space-y-2.5">
        {data.map((r) => (
          <li key={r.name}>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="group block" title={r.desc || r.name}>
              <div className="flex items-baseline gap-2">
                <span className="text-[12.5px] font-medium text-foreground truncate group-hover:underline">{r.name}</span>
                <span className="ml-auto text-[11px] font-mono tabular-nums shrink-0" style={{ color: '#C9A227' }}>
                  ★{compact(r.stars)}
                </span>
              </div>
              {r.lang && <span className="text-[10.5px] font-mono text-muted-foreground">{r.lang}</span>}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10.5px] text-muted-foreground leading-relaxed">
        Repositories created in the last 30 days, most-starred first.
      </p>
    </>
  )
}

/* ------------------------------------------------------------------ *
 * Hacker News — the front page, four stories deep.
 *
 * The site's news feed reads Medium and Reddit and nothing else, so the
 * one place most engineers actually check every morning was missing.
 *
 * The API has no batch endpoint: the top-stories call returns 500 bare
 * ids and each story is a separate request. That's five requests for
 * four stories, which is why this caches for half an hour — the front
 * page doesn't turn over faster than that anyway.
 * ------------------------------------------------------------------ */

const HN_CACHE = 'sidecar_hn'
const HN_TTL = 1800000 // half an hour

function HackerNewsCard() {
  const [data, setData] = useState(undefined)

  useEffect(() => {
    try {
      const c = JSON.parse(sessionStorage.getItem(HN_CACHE) || 'null')
      if (c && Date.now() - c.ts < HN_TTL) { setData(c.d); return }
    } catch {}

    let alive = true
    fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((ids) => Promise.all(
        (ids || []).slice(0, 4).map((id) =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then((r) => r.json())
        )
      ))
      .then((items) => {
        if (!alive) return
        const d = (items || []).filter(Boolean).map((s) => ({
          id: s.id,
          title: s.title,
          // Ask HN and similar have no url of their own; point at the
          // discussion instead of rendering a dead link.
          url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
          host: s.url ? (() => { try { return new URL(s.url).hostname.replace(/^www\./, '') } catch { return null } })() : null,
          score: s.score || 0,
          comments: s.descendants || 0,
        }))
        if (!d.length) throw new Error('empty')
        setData(d)
        try { sessionStorage.setItem(HN_CACHE, JSON.stringify({ d, ts: Date.now() })) } catch {}
      })
      .catch(() => { if (alive) setData(null) })
    return () => { alive = false }
  }, [])

  const shell = (children) => (
    <Shell icon="📰" title="Hacker News · Front page" tint="#FF6600">{children}</Shell>
  )

  if (data === undefined) return shell(<Loading label="reading the front page…" />)
  if (data === null) return shell(<Failed label="Hacker News didn't answer. Its API is a single Firebase instance and does occasionally stall." />)

  return shell(
    <ul className="space-y-2.5">
      {data.map((s) => (
        <li key={s.id}>
          <a href={s.url} target="_blank" rel="noopener noreferrer" className="group block" title={s.title}>
            <p className="text-[12.5px] leading-snug text-foreground group-hover:underline line-clamp-2">
              {s.title}
            </p>
            <p className="mt-0.5 text-[10.5px] font-mono text-muted-foreground tabular-nums">
              {s.score} points · {s.comments} comments{s.host ? ` · ${s.host}` : ''}
            </p>
          </a>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ *
 * Releases — the version numbers of the things he actually runs.
 *
 * "Is there a new Kubernetes yet" is a question an infrastructure
 * engineer asks constantly and no page here answered. Five repositories,
 * one request each, in parallel.
 *
 * golang/go is deliberately absent: it publishes tags rather than
 * releases, so releases/latest returns 404 for it and it would have sat
 * there permanently blank.
 * ------------------------------------------------------------------ */

const RELEASE_CACHE = 'sidecar_releases'
const RELEASE_TTL = 21600000 // six hours

const TOOLS = [
  { repo: 'kubernetes/kubernetes', name: 'Kubernetes' },
  { repo: 'hashicorp/terraform', name: 'Terraform' },
  { repo: 'helm/helm', name: 'Helm' },
  { repo: 'nodejs/node', name: 'Node' },
  { repo: 'grafana/grafana', name: 'Grafana' },
]

function daysAgo(iso) {
  if (!iso) return null
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d < 0) return null
  if (d === 0) return 'today'
  if (d === 1) return 'yesterday'
  if (d < 30) return `${d}d ago`
  const m = Math.round(d / 30.44)
  return m <= 1 ? '1mo ago' : `${m}mo ago`
}

function ReleasesCard() {
  const [data, setData] = useState(undefined)

  useEffect(() => {
    try {
      const c = JSON.parse(sessionStorage.getItem(RELEASE_CACHE) || 'null')
      if (c && Date.now() - c.ts < RELEASE_TTL) { setData(c.d); return }
    } catch {}

    let alive = true
    Promise.all(TOOLS.map((t) =>
      fetch(`https://api.github.com/repos/${t.repo}/releases/latest`, {
        headers: { Accept: 'application/vnd.github+json' },
      })
        .then((r) => (r.ok ? r.json() : null))
        // One tool being unreachable shouldn't empty the whole card.
        .catch(() => null)
        .then((j) => (j && j.tag_name ? {
          name: t.name,
          repo: t.repo,
          tag: j.tag_name.replace(/^([a-z-]+-)?v?/i, 'v'),
          when: daysAgo(j.published_at),
          url: j.html_url,
        } : null))
    ))
      .then((rows) => {
        if (!alive) return
        const d = rows.filter(Boolean)
        if (!d.length) throw new Error('empty')
        setData(d)
        try { sessionStorage.setItem(RELEASE_CACHE, JSON.stringify({ d, ts: Date.now() })) } catch {}
      })
      .catch(() => { if (alive) setData(null) })
    return () => { alive = false }
  }, [])

  const shell = (children, right) => (
    <Shell icon="📦" title="Releases · What's current" tint="#8B7FD8" right={right}>{children}</Shell>
  )

  if (data === undefined) return shell(<Loading label="checking versions…" />)
  if (data === null) return shell(<Failed label="GitHub didn't answer. It rate-limits anonymous requests, so this usually clears on its own." />)

  return shell(
    <div className="space-y-2">
      {data.map((t) => (
        <a
          key={t.repo}
          href={t.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-baseline gap-2.5"
          title={`${t.repo} — release notes`}
        >
          <span className="text-[12.5px] text-muted-foreground group-hover:text-foreground transition-colors">{t.name}</span>
          <span className="ml-auto text-[12.5px] font-mono tabular-nums text-foreground">{t.tag}</span>
          {t.when && <span className="text-[10px] font-mono text-muted-foreground w-14 text-right">{t.when}</span>}
        </a>
      ))}
    </div>,
    <span className="text-[10px] font-mono text-muted-foreground">{data.length} tools</span>
  )
}

// Glanceable first (a number each), then the two reading lists, then the
// repo list — which is the longest and so sits at the bottom.
const CARDS = [MoneyCard, TimezoneCard, HackerNewsCard, ReleasesCard, NewReposCard]

// Every card reads its sessionStorage entry before it fetches, so a refresh has
// to clear these first or the remount just replays the same cached payload.
const CARD_CACHE_KEYS = [MONEY_CACHE, REPO_CACHE, HN_CACHE, RELEASE_CACHE]

export default function Sidecar() {
  const [open, setOpen] = useState(false)
  const [shown, setShown] = useState(false) // drives the slide animation
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const refresh = () => {
    if (refreshing) return
    try { CARD_CACHE_KEYS.forEach(k => sessionStorage.removeItem(k)) } catch {}
    setRefreshKey(k => k + 1)
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 700)
  }

  useEffect(() => {
    if (!open) return
    // Flip into the shown state on the next frame. requestAnimationFrame can be
    // starved (background tab, throttled webview), which would leave the drawer
    // parked off-screen while the page is already scroll-locked — so race it
    // against a timer and take whichever lands first.
    const raf = requestAnimationFrame(() => setShown(true))
    const kick = setTimeout(() => setShown(true), 50)
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(kick)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
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
        title="The Sidecar — rates, timezones and what GitHub is starring"
        className="group rail-btn rail-tint sdbtn"
        style={{ '--rail-i': 0, '--tint': 'var(--color-accent)' }}
      >
        {/* A rim of ticks, like a dial — the Sidecar is the drawer of
            things being followed, so it reads as a gauge. Solid band with
            the ticks punched out of it, the way the F1 chequer is built;
            a plain dashed stroke reads as a dotted border instead. */}
        <svg className="sdbtn-rim rail-rim" viewBox="0 0 54 54" fill="none" aria-hidden="true">
          <circle cx="27" cy="27" r="24.6" stroke="currentColor" strokeWidth="3.4" opacity=".9" />
          <circle cx="27" cy="27" r="24.6" stroke="var(--rail-disc)" strokeWidth="2.2" strokeDasharray="1.5 3.6" />
        </svg>
        <svg className="rail-ico transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M11 17l-5-5 5-5" /><path d="M18 17l-5-5 5-5" />
        </svg>
        <style>{`
          .sdbtn-rim { transition: transform .55s cubic-bezier(.22,.61,.36,1); }
          .sdbtn:hover .sdbtn-rim { transform: rotate(-20deg); }
          @media (prefers-reduced-motion: reduce) {
            .sdbtn-rim { transition: none; }
            .sdbtn:hover .sdbtn-rim { transform: none; }
          }
        `}</style>
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
                <p className="text-[12px] text-muted-foreground mt-0.5">Small things worth a glance.</p>
              </div>
              <div className="flex items-center gap-0.5 -mr-1">
                <button
                  onClick={refresh}
                  disabled={refreshing}
                  aria-label="Refresh cards"
                  title="Refresh"
                  className="text-muted-foreground/60 hover:text-foreground transition-colors p-1 disabled:opacity-50"
                >
                  <svg
                    className={`w-[18px] h-[18px] ${refreshing ? 'animate-spin' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    strokeLinecap="round" strokeLinejoin="round"
                  >
                    <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                    <polyline points="21 3 21 9 15 9" />
                  </svg>
                </button>
                <button onClick={close} aria-label="Close" className="text-muted-foreground/60 hover:text-foreground transition-colors p-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
              {CARDS.map((Card, i) => <Card key={`${refreshKey}-${i}`} />)}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
