import React, { useEffect, useMemo, useState } from 'react'

/* ------------------------------------------------------------------ *
 * #/jobs — openings at product companies worth working for.
 *
 * The list is built at deploy time by scripts/gen-jobs.mjs, which reads
 * forty public job boards across Greenhouse, Ashby and Lever. That is
 * about 15 MB of JSON between them, so doing it here would be absurd;
 * what ships is one file of roughly 40 KB over the wire, and the daily
 * deploy keeps it current.
 *
 * Because it is a snapshot rather than a live query, the page says when
 * it was taken. A jobs board that quietly shows week-old postings as if
 * they were current is worse than one that admits its age.
 *
 * The keys are single letters because at 1,300 roles the field names
 * were a quarter of the file:
 *   t title · c company · g sector · l location · f role family
 *   u url · d posted date · m team · r remote · s senior · n openings
 * ------------------------------------------------------------------ */

const FAMILY = {
  sre: 'SRE',
  infra: 'Infrastructure',
  security: 'Security',
  ml: 'AI / ML',
  data: 'Data',
  mobile: 'Mobile',
  frontend: 'Frontend',
  backend: 'Backend',
  eng: 'Software',
}

const FAMILY_TINT = {
  sre: '#5FBF8F',
  infra: '#7FB3E8',
  security: '#E88F8F',
  ml: '#B79BE8',
  data: '#E8C05F',
  mobile: '#8FD9C4',
  frontend: '#E8A3C8',
  backend: '#93C2E6',
  eng: '#A9B4C4',
}

const DAY = 864e5

function ago(d) {
  if (!d) return ''
  const days = Math.floor((Date.now() - Date.parse(d)) / DAY)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function Chip({ on, onClick, children, tint }) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-full text-[11.5px] font-medium whitespace-nowrap transition-colors"
      style={
        on
          ? { background: tint || 'var(--color-accent)', color: 'var(--color-background)' }
          : {
              background: 'color-mix(in oklab, var(--color-card) 60%, transparent)',
              color: 'var(--color-muted-foreground)',
              boxShadow: 'inset 0 0 0 1px var(--color-border)',
            }
      }
    >
      {children}
    </button>
  )
}

function Row({ j }) {
  const tint = FAMILY_TINT[j.f] || 'var(--color-accent)'
  const fresh = j.d && Date.now() - Date.parse(j.d) < 7 * DAY
  return (
    <a
      href={j.u}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 px-4 py-3 rounded-xl transition-colors"
      style={{
        background: 'color-mix(in oklab, var(--color-card) 55%, transparent)',
        boxShadow: 'inset 0 0 0 1px var(--color-border)',
      }}
    >
      <span
        className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: tint }}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-medium text-foreground leading-snug group-hover:opacity-80 transition-opacity">
          {j.t}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted-foreground">
          <span className="font-medium" style={{ color: tint }}>{j.c}</span>
          {j.l && <span>· {j.l}</span>}
          {j.m && <span>· {j.m}</span>}
          {j.r ? <span>· remote</span> : null}
          {j.n ? <span>· {j.n} openings</span> : null}
        </span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[11px] font-mono text-muted-foreground tabular-nums whitespace-nowrap">
          {ago(j.d)}
        </span>
        {fresh && (
          <span className="mt-1 inline-block px-1.5 py-0.5 rounded text-[9.5px] font-mono uppercase tracking-wide"
                style={{ background: 'color-mix(in oklab, var(--color-accent) 18%, transparent)', color: 'var(--color-accent)' }}>
            new
          </span>
        )}
      </span>
    </a>
  )
}

const PAGE = 40

export default function JobsPage({ onBack }) {
  const [data, setData] = useState(undefined) // undefined loading, null failed
  const [q, setQ] = useState('')
  const [fam, setFam] = useState('all')
  const [co, setCo] = useState('all')
  const [remote, setRemote] = useState(false)
  const [recent, setRecent] = useState(false)
  const [show, setShow] = useState(PAGE)

  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}jobs.json`, { cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error('bad status'); return r.json() })
      .then((d) => { if (alive) setData(d && Array.isArray(d.jobs) ? d : null) })
      .catch(() => { if (alive) setData(null) })
    return () => { alive = false }
  }, [])

  const jobs = data?.jobs
  const filtered = useMemo(() => {
    if (!jobs) return []
    const needle = q.trim().toLowerCase()
    const cutoff = Date.now() - 14 * DAY
    return jobs.filter((j) => {
      if (fam !== 'all' && j.f !== fam) return false
      if (co !== 'all' && j.c !== co) return false
      if (remote && !j.r) return false
      if (recent && (!j.d || Date.parse(j.d) < cutoff)) return false
      if (needle) {
        const hay = `${j.t} ${j.c} ${j.l} ${j.m || ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [jobs, q, fam, co, remote, recent])

  // Families and companies that actually appear, so no filter can be
  // chosen that returns nothing at all.
  const fams = useMemo(() => {
    if (!jobs) return []
    const n = {}
    jobs.forEach((j) => { n[j.f] = (n[j.f] || 0) + 1 })
    return Object.entries(n).sort((a, b) => b[1] - a[1])
  }, [jobs])

  useEffect(() => { setShow(PAGE) }, [q, fam, co, remote, recent])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 sm:px-6 py-8 sm:py-12">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <header className="mt-8 sm:mt-12">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em]" style={{ color: '#5FBF8F' }}>Hiring</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Jobs</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground max-w-prose">
            Engineering roles at product companies, read straight from their own job boards.
            {data && <> {data.total} open across {data.companies.length} companies, {data.fresh} posted in the last month.</>}
          </p>
        </header>

        {data === undefined && (
          <p className="mt-10 text-[13px] font-mono text-muted-foreground animate-pulse">reading the boards…</p>
        )}

        {data === null && (
          <p className="mt-10 text-[13.5px] leading-relaxed text-muted-foreground">
            The list didn’t load. It’s a static file built with the site, so this is usually a
            transient network problem rather than anything being down.
          </p>
        )}

        {data && (
          <>
            <div className="mt-8 space-y-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search title, company, location…"
                className="w-full px-3.5 py-2.5 rounded-xl text-[13.5px] bg-transparent text-foreground placeholder:text-muted-foreground/60 outline-none"
                style={{ boxShadow: 'inset 0 0 0 1px var(--color-border)' }}
              />

              <div className="flex flex-wrap gap-1.5">
                <Chip on={fam === 'all'} onClick={() => setFam('all')}>All roles</Chip>
                {fams.map(([f, n]) => (
                  <Chip key={f} on={fam === f} tint={FAMILY_TINT[f]} onClick={() => setFam(fam === f ? 'all' : f)}>
                    {FAMILY[f] || f} <span className="opacity-60">{n}</span>
                  </Chip>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 items-center">
                <Chip on={remote} onClick={() => setRemote((v) => !v)}>Remote</Chip>
                <Chip on={recent} onClick={() => setRecent((v) => !v)}>Last 14 days</Chip>
                <select
                  value={co}
                  onChange={(e) => setCo(e.target.value)}
                  className="px-2.5 py-1 rounded-full text-[11.5px] bg-transparent text-muted-foreground outline-none"
                  style={{ boxShadow: 'inset 0 0 0 1px var(--color-border)' }}
                >
                  <option value="all">All companies</option>
                  {data.companies.map((c) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="mt-5 text-[12px] font-mono text-muted-foreground tabular-nums">
              {filtered.length} {filtered.length === 1 ? 'role' : 'roles'}
            </p>

            <div className="mt-3 space-y-2">
              {filtered.slice(0, show).map((j, i) => <Row key={`${j.u}-${i}`} j={j} />)}
            </div>

            {filtered.length === 0 && (
              <p className="mt-6 text-[13.5px] text-muted-foreground">
                Nothing matches that. Try clearing a filter.
              </p>
            )}

            {show < filtered.length && (
              <button
                onClick={() => setShow((s) => s + PAGE)}
                className="mt-5 w-full py-2.5 rounded-xl text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                style={{ boxShadow: 'inset 0 0 0 1px var(--color-border)' }}
              >
                Show {Math.min(PAGE, filtered.length - show)} more
              </button>
            )}

            <p className="mt-8 text-[12px] leading-relaxed text-muted-foreground">
              Read from Greenhouse, Ashby and Lever job boards
              {data.generated && <> · snapshot taken {ago(data.generated.slice(0, 10))}, refreshed daily</>}.
              Roles are grouped by title, so one entry can cover several offices. Applying goes to the
              company’s own board — nothing is collected here.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
