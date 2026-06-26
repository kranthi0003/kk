import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  fetchRuns, computeDORA, doraTiers, deployFrequencySeries, incidents,
  collectVitals, saveVitalsSnapshot, rate, CWV_THRESHOLDS,
  navTiming, pageWeight, pingLatency, loadLatencyHistory, pushLatency,
  computeSLOs, fmtDuration, fmtRelTime, fmtMetric, fmtPct, REPO,
} from '../lib/reliability'

/* ------------------------------------------------------------------ *
 * Shared bits
 * ------------------------------------------------------------------ */

const GOOD = '#67c98c'
const WARN = '#e3a857'
const BAD = '#ef6b6b'
const tierColor = (t) => (t === 'Elite' ? GOOD : t === 'High' ? '#4ec9c9' : t === 'Medium' ? WARN : t === 'Low' ? BAD : 'var(--color-muted-foreground)')
const rateColor = (r) => (r === 'good' ? GOOD : r === 'needs-improvement' ? WARN : r === 'poor' ? BAD : 'var(--color-muted-foreground)')

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'performance', label: 'Performance' },
  { id: 'deploys', label: 'Deploys · DORA' },
  { id: 'slos', label: 'SLOs' },
  { id: 'incidents', label: 'Incidents' },
]

function Card({ title, sub, children, accent, className = '' }) {
  return (
    <section
      className={`rounded-2xl p-4 sm:p-5 ${className}`}
      style={{
        background: 'color-mix(in oklab, var(--color-card) 70%, transparent)',
        border: '1px solid var(--color-border)',
        borderTop: accent ? `3px solid ${accent}` : '1px solid var(--color-border)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {title && (
        <div className="mb-3">
          <h3 className="font-heading text-[1.05rem]" style={{ fontWeight: 500 }}>{title}</h3>
          {sub && <p className="text-[12px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      )}
      {children}
    </section>
  )
}

function Stat({ label, value, sub, color }) {
  return (
    <div className="rounded-xl px-3.5 py-3" style={{ background: 'color-mix(in oklab, var(--color-background) 55%, transparent)', border: '1px solid var(--color-border)' }}>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground/80">{label}</div>
      <div className="text-2xl font-mono mt-1 tabular-nums" style={{ color: color || 'var(--color-foreground)' }}>{value}</div>
      {sub && <div className="text-[11.5px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  )
}

function TierBadge({ tier }) {
  const c = tierColor(tier)
  return (
    <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ background: `color-mix(in oklab, ${c} 16%, transparent)`, color: c, border: `1px solid color-mix(in oklab, ${c} 34%, transparent)` }}>
      {tier}
    </span>
  )
}

// Tiny SVG line chart.
function Sparkline({ data, color = 'var(--color-accent)', height = 40, fill = true }) {
  const vals = data.filter(v => v != null)
  if (vals.length < 2) return <div className="text-[11px] text-muted-foreground/60 py-2">collecting…</div>
  const w = 100, h = height
  const min = Math.min(...vals), max = Math.max(...vals)
  const span = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = v == null ? h : h - ((v - min) / span) * (h - 6) - 3
    return [x, y]
  })
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${w},${h} L0,${h} Z`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      {fill && <path d={area} fill={color} opacity="0.12" />}
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Vertical bar chart for small series.
function Bars({ data, color = 'var(--color-accent)', height = 64 }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
          <div className="w-full rounded-t transition-all" title={`${d.label}: ${d.count}`}
            style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count ? 3 : 1, background: d.count ? color : 'var(--color-border)', opacity: d.count ? 1 : 0.5 }} />
          <div className="text-[9px] text-muted-foreground/70 mt-1 truncate w-full text-center">{d.label}</div>
        </div>
      ))}
    </div>
  )
}

// Donut for a single percentage.
function Donut({ ratio, color = GOOD, size = 96, label }) {
  const r = (size - 14) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(ratio, 1))
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-border)" strokeWidth="7" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset .6s ease' }} />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-mono tabular-nums" style={{ color }}>{(pct * 100).toFixed(1)}%</div>
        {label && <div className="text-[10px] text-muted-foreground">{label}</div>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Tabs
 * ------------------------------------------------------------------ */

function OverviewTab({ status, dora, tiers, vitals, latency }) {
  const latVals = latency.map(p => p.ms)
  const lastLat = [...latVals].reverse().find(v => v != null)
  const avgLat = latVals.filter(v => v != null)
  const avg = avgLat.length ? Math.round(avgLat.reduce((a, b) => a + b, 0) / avgLat.length) : null
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Deploys tracked" value={dora.deployCount || '—'} sub={`over ${dora.spanDays?.toFixed(0)} days`} />
        <Stat label="Deploy success" value={dora.deployCount ? fmtPct(dora.successCount / dora.deployCount, 0) : '—'} sub={`${dora.successCount}/${dora.deployCount} green`} color={GOOD} />
        <Stat label="LCP (this visit)" value={fmtMetric('LCP', vitals.LCP)} sub={vitals.LCP != null ? rate('LCP', vitals.LCP) : 'measuring…'} color={vitals.LCP != null ? rateColor(rate('LCP', vitals.LCP)) : undefined} />
        <Stat label="Live latency" value={lastLat != null ? `${lastLat}ms` : '—'} sub={avg != null ? `avg ${avg}ms this session` : 'pinging…'} color={GOOD} />
      </div>

      <Card title="Live latency" sub="Round-trip to a same-origin asset, sampled every few seconds" accent="var(--color-accent)">
        <Sparkline data={latVals} />
        <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
          <span>{latency.length} samples</span>
          <span>min {avgLat.length ? Math.min(...avgLat) : '—'}ms · max {avgLat.length ? Math.max(...avgLat) : '—'}ms</span>
        </div>
      </Card>

      <Card title="DORA at a glance" sub="The Four Keys, computed live from this site's own deploy pipeline" accent={GOOD}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <DoraKey label="Deploy frequency" value={dora.perDay >= 1 ? `${dora.perDay.toFixed(1)}/day` : `${dora.perWeek.toFixed(1)}/wk`} tier={tiers.freqTier} />
          <DoraKey label="Lead time" value={fmtDuration(dora.leadMs)} tier={tiers.leadTier} />
          <DoraKey label="Change fail rate" value={fmtPct(dora.cfr, 1)} tier={tiers.cfrTier} />
          <DoraKey label="Time to restore" value={dora.mttrMs == null ? 'n/a' : fmtDuration(dora.mttrMs)} tier={tiers.mttrTier} />
        </div>
      </Card>
    </div>
  )
}

function DoraKey({ label, value, tier }) {
  return (
    <div className="rounded-xl px-3.5 py-3" style={{ background: 'color-mix(in oklab, var(--color-background) 55%, transparent)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground/80">{label}</span>
        <TierBadge tier={tier} />
      </div>
      <div className="text-xl font-mono mt-1.5 tabular-nums">{value}</div>
    </div>
  )
}

function RatingRow({ metric, value }) {
  const [good, ni] = CWV_THRESHOLDS[metric]
  const r = value == null ? 'unknown' : rate(metric, value)
  const c = rateColor(r)
  // position of marker on a scale that ends at ~1.6x the needs-improvement bound
  const scaleMax = ni * 1.6
  const pos = value == null ? 0 : Math.min((value / scaleMax) * 100, 100)
  return (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-medium">{metric}</span>
        <span className="text-sm font-mono tabular-nums" style={{ color: c }}>{fmtMetric(metric, value)}{value != null && <span className="text-[11px] ml-1.5 text-muted-foreground">{r}</span>}</span>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
        <div className="absolute inset-y-0 left-0" style={{ width: `${(good / scaleMax) * 100}%`, background: `color-mix(in oklab, ${GOOD} 55%, transparent)` }} />
        <div className="absolute inset-y-0" style={{ left: `${(good / scaleMax) * 100}%`, width: `${((ni - good) / scaleMax) * 100}%`, background: `color-mix(in oklab, ${WARN} 55%, transparent)` }} />
        <div className="absolute inset-y-0" style={{ left: `${(ni / scaleMax) * 100}%`, right: 0, background: `color-mix(in oklab, ${BAD} 55%, transparent)` }} />
        {value != null && <div className="absolute top-1/2 -translate-y-1/2 w-1 h-3.5 rounded-full" style={{ left: `calc(${pos}% - 2px)`, background: 'var(--color-foreground)', boxShadow: '0 0 0 2px var(--color-background)' }} />}
      </div>
    </div>
  )
}

function PerformanceTab({ vitals, nav, weight }) {
  const segs = nav ? [
    { k: 'DNS', v: nav.dns }, { k: 'TCP', v: nav.tcp }, { k: 'TLS', v: nav.tls },
    { k: 'TTFB', v: nav.ttfb }, { k: 'Download', v: nav.download },
    { k: 'DOM', v: Math.max(nav.domInteractive - nav.ttfb - nav.download, 0) },
  ] : []
  const segTotal = segs.reduce((s, x) => s + x.v, 0) || 1
  const segColors = ['#7aa2f7', '#7dcfff', '#9ece6a', 'var(--color-accent)', '#bb9af7', '#e0af68']
  const w = weight
  const wRows = w ? [
    { k: 'JavaScript', kb: w.jsKB, n: w.jsCount, c: '#e0af68' },
    { k: 'CSS', kb: w.cssKB, n: w.cssCount, c: '#7dcfff' },
    { k: 'Images', kb: w.imgKB, n: w.imgCount, c: '#9ece6a' },
    { k: 'Fonts', kb: w.fontKB, n: w.fontCount, c: '#bb9af7' },
  ] : []
  const wMax = Math.max(...wRows.map(r => r.kb), 1)
  return (
    <div className="space-y-4">
      <Card title="Core Web Vitals" sub="Measured for your current visit · Google's good / needs-improvement / poor bands" accent={vitals.LCP != null ? rateColor(rate('LCP', vitals.LCP)) : 'var(--color-accent)'}>
        {['LCP', 'INP', 'CLS', 'FCP', 'TTFB'].map(m => <RatingRow key={m} metric={m} value={vitals[m]} />)}
        <p className="text-[11px] text-muted-foreground mt-2">INP needs an interaction (scroll, tap) to register. These are real field values from your browser, not lab numbers.</p>
      </Card>

      {nav && (
        <Card title="Page load waterfall" sub={`This page reached interactive in ${nav.domInteractive}ms · fully loaded ${nav.load}ms`}>
          <div className="flex h-7 rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
            {segs.map((s, i) => s.v > 0 && (
              <div key={s.k} title={`${s.k}: ${s.v}ms`} style={{ width: `${(s.v / segTotal) * 100}%`, background: segColors[i] }} />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {segs.map((s, i) => (
              <div key={s.k} className="flex items-center gap-1.5 text-[11.5px]">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: segColors[i] }} />
                <span className="text-muted-foreground">{s.k}</span>
                <span className="font-mono tabular-nums">{s.v}ms</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {w && (
        <Card title="Page weight" sub={`${w.totalKB} KB transferred across ${w.requests} requests`}>
          <div className="space-y-2.5">
            {wRows.map(r => (
              <div key={r.k}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span>{r.k} <span className="text-muted-foreground">· {r.n}</span></span>
                  <span className="font-mono tabular-nums">{r.kb} KB</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${(r.kb / wMax) * 100}%`, background: r.c }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function DeploysTab({ dora, tiers, freq, runs }) {
  const durSeries = dora.durations.slice(0, 30).reverse()
  const recent = dora.deploys.slice(0, 8)
  return (
    <div className="space-y-4">
      <Card title="DORA Four Keys" sub="Industry benchmark metrics, computed from this site's real CI/CD history" accent={GOOD}>
        <div className="grid sm:grid-cols-2 gap-3">
          <DoraDetail label="Deployment frequency" value={dora.perDay >= 1 ? `${dora.perDay.toFixed(1)} / day` : `${dora.perWeek.toFixed(1)} / week`} tier={tiers.freqTier} note={`${dora.successCount} deploys in ${dora.spanDays.toFixed(0)} days`} />
          <DoraDetail label="Lead time for changes" value={fmtDuration(dora.leadMs)} tier={tiers.leadTier} note="commit → live, median" />
          <DoraDetail label="Change failure rate" value={fmtPct(dora.cfr, 1)} tier={tiers.cfrTier} note={`${dora.failCount} failed of ${dora.deployCount}`} />
          <DoraDetail label="Time to restore service" value={dora.mttrMs == null ? 'n/a' : fmtDuration(dora.mttrMs)} tier={tiers.mttrTier} note={dora.mttrMs == null ? 'no failures to recover from' : 'failure → next green, median'} />
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Deploys per day" sub="Last 14 days">
          <Bars data={freq} color="var(--color-accent)" />
        </Card>
        <Card title="Build duration" sub={`Median ${fmtDuration(dora.medianDurationMs)} · last ${durSeries.length} builds`}>
          <Sparkline data={durSeries.map(ms => ms / 1000)} color={GOOD} height={56} />
          <div className="text-[11px] text-muted-foreground mt-1">seconds per successful build, oldest → newest</div>
        </Card>
      </div>

      <Card title="Recent deploys" sub={`Workflow "Build and Deploy" · ${REPO}`}>
        <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
          {recent.map(r => (
            <li key={r.id} className="flex items-center gap-3 py-2.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.conclusion === 'success' ? GOOD : BAD }} />
              <div className="flex-1 min-w-0">
                <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-sm truncate hover:underline block" style={{ color: 'var(--color-foreground)' }}>{r.title || 'deploy'}</a>
                <span className="text-[11px] text-muted-foreground font-mono">{r.sha} · {fmtRelTime(r.created_at)}</span>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-muted-foreground flex-shrink-0">{fmtDuration(new Date(r.updated_at) - new Date(r.run_started_at))}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

function DoraDetail({ label, value, tier, note }) {
  return (
    <div className="rounded-xl px-4 py-3.5" style={{ background: 'color-mix(in oklab, var(--color-background) 55%, transparent)', border: '1px solid var(--color-border)' }}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[12px] text-muted-foreground">{label}</span>
        <TierBadge tier={tier} />
      </div>
      <div className="text-2xl font-mono tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{note}</div>
    </div>
  )
}

function SLOsTab({ slos }) {
  return (
    <div className="space-y-4">
      <Card title="Service level objectives" sub="Targets with live error budgets — green means we're within budget">
        <div className="space-y-4">
          {slos.map(s => {
            const c = s.measuring ? 'var(--color-muted-foreground)' : (s.met ? GOOD : (s.budgetUsed >= 1 ? BAD : WARN))
            return (
              <div key={s.id}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <div>
                    <span className="text-sm font-medium">{s.name}</span>
                    <span className="text-[11px] text-muted-foreground ml-2">target {fmtPct(s.target, 1)}</span>
                  </div>
                  <span className="text-sm font-mono tabular-nums" style={{ color: c }}>{s.measuring ? '—' : fmtPct(s.actual, 2)}</span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(s.budgetUsed * 100, 100)}%`, background: c, transition: 'width .6s ease' }} />
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground mt-1">
                  <span>{s.detail}</span>
                  <span>{s.measuring ? 'warming up' : (s.budgetUsed >= 1 ? 'budget exhausted' : `${Math.round(s.budgetUsed * 100)}% of error budget used`)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
      <p className="text-[11.5px] text-muted-foreground px-1">
        Error budget = how much unreliability a target allows. An availability SLO of 99.9% permits ~0.1% failure;
        the bar shows how much of that budget the live numbers have consumed.
      </p>
    </div>
  )
}

function IncidentsTab({ list }) {
  if (!list.length) {
    return (
      <Card accent={GOOD}>
        <div className="text-center py-10">
          <div className="mx-auto mb-3 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `color-mix(in oklab, ${GOOD} 14%, transparent)`, border: `1px solid color-mix(in oklab, ${GOOD} 32%, transparent)` }}>
            <svg className="w-6 h-6" style={{ color: GOOD }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" /></svg>
          </div>
          <h3 className="font-heading text-lg" style={{ fontWeight: 500 }}>No deploy incidents</h3>
          <p className="text-sm text-muted-foreground mt-1">A clean record across every tracked deploy. The quiet kind of infrastructure.</p>
        </div>
      </Card>
    )
  }
  return (
    <Card title="Incident timeline" sub="Failed deploys and how long they took to recover">
      <ul className="space-y-3">
        {list.map(inc => (
          <li key={inc.id} className="flex gap-3">
            <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1.5" style={{ background: BAD }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <a href={inc.url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline truncate" style={{ color: 'var(--color-foreground)' }}>{inc.title || 'Deploy failed'}</a>
                <span className="text-[11px] text-muted-foreground flex-shrink-0">{fmtRelTime(inc.created_at)}</span>
              </div>
              <div className="text-[11.5px] text-muted-foreground font-mono mt-0.5">
                {inc.sha} · {inc.recoveredMs != null ? `recovered in ${fmtDuration(inc.recoveredMs)}` : 'recovery pending'}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

export default function ReliabilityLab({ onBack }) {
  const [tab, setTab] = useState('overview')
  const [runs, setRuns] = useState(null)
  const [runsErr, setRunsErr] = useState('')
  const [vitals, setVitals] = useState({})
  const [latency, setLatency] = useState(() => loadLatencyHistory())
  const [nav, setNav] = useState(() => navTiming())
  const [weight, setWeight] = useState(() => pageWeight())
  const savedRef = useRef(false)

  // Fetch the real CI/CD history.
  useEffect(() => {
    let alive = true
    fetchRuns()
      .then(({ runs }) => { if (alive) setRuns(runs) })
      .catch(err => { if (alive) setRunsErr(err.message === 'rate-limited' ? 'GitHub API rate limit reached — try again shortly.' : 'Could not reach the GitHub API.') })
    return () => { alive = false }
  }, [])

  // Collect Core Web Vitals for this visit.
  useEffect(() => {
    collectVitals(setVitals)
  }, [])

  // Re-read navigation/resource timing once the page has fully loaded so the
  // waterfall and page weight reflect the complete load, not a mid-load snapshot.
  useEffect(() => {
    const recompute = () => { setNav(navTiming()); setWeight(pageWeight()) }
    if (document.readyState === 'complete') recompute()
    else window.addEventListener('load', recompute, { once: true })
    const t = setTimeout(recompute, 1500)
    return () => { clearTimeout(t); window.removeEventListener('load', recompute) }
  }, [])

  // Persist a vitals snapshot once the key metrics have arrived.
  useEffect(() => {
    if (!savedRef.current && vitals.LCP != null && vitals.FCP != null) {
      savedRef.current = true
      saveVitalsSnapshot(vitals)
    }
  }, [vitals])

  // Live latency pinger. The first probe is a throwaway warm-up (a cold-start
  // failure shouldn't count against availability), matching real monitors.
  useEffect(() => {
    let alive = true
    let warmed = false
    const tick = async () => {
      const ms = await pingLatency()
      if (!alive) return
      if (!warmed) { warmed = true; if (ms == null) return }
      setLatency(pushLatency(ms))
    }
    tick()
    const iv = setInterval(tick, 4000)
    return () => { alive = false; clearInterval(iv) }
  }, [])

  const dora = useMemo(() => computeDORA(runs || []), [runs])
  const tiers = useMemo(() => doraTiers(dora), [dora])
  const freq = useMemo(() => deployFrequencySeries(runs || [], 14), [runs])
  const incList = useMemo(() => incidents(runs || []), [runs])
  const slos = useMemo(() => computeSLOs({ dora, latency, vitals }), [dora, latency, vitals])

  // Overall status banner.
  const lastPings = latency.slice(-5).map(p => p.ms)
  const pingOk = lastPings.length === 0 || lastPings.some(v => v != null)
  const deployOk = !runs || dora.deployCount === 0 || dora.successCount === dora.deployCount || (dora.deploys[0]?.conclusion === 'success')
  const lcpOk = vitals.LCP == null || rate('LCP', vitals.LCP) !== 'poor'
  const allOk = pingOk && deployOk && lcpOk
  const statusColor = allOk ? GOOD : WARN

  return (
    <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: 'var(--color-background)' }}>
      <div className="pr-backdrop-glow" aria-hidden="true" />
      <div className="pr-backdrop-noise" aria-hidden="true" />

      {/* Header */}
      <header className="flex-shrink-0 relative z-10" style={{ borderBottom: '1px solid var(--color-border)', background: 'color-mix(in oklab, var(--color-card) 80%, transparent)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
        <div className="max-w-5xl mx-auto px-3 sm:px-5 pt-3">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
              <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              <span className="hidden sm:inline">Back to site</span>
            </button>
            <div className="flex-1 min-w-0 text-center">
              <h1 className="font-heading text-base sm:text-lg tracking-tight" style={{ fontWeight: 500 }}>Reliability Lab</h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: statusColor }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: statusColor }} />
              </span>
              <span className="text-[12px] font-medium hidden sm:inline" style={{ color: statusColor }}>{allOk ? 'All systems operational' : 'Degraded'}</span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground text-center mt-0.5 mb-2 hidden sm:block">Real observability for this very site — deploy pipeline, performance, SLOs. No mock data.</p>

          {/* Tabs */}
          <div className="overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
            <div className="flex gap-1 min-w-fit pb-2">
              {TABS.map(t => {
                const active = tab === t.id
                return (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className="px-3 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-all"
                    style={active ? { background: 'color-mix(in oklab, var(--color-accent) 16%, transparent)', color: 'var(--color-foreground)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 38%, transparent)' } : { color: 'var(--color-muted-foreground)' }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-foreground)' }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-muted-foreground)' }}>
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto relative z-10">
        <div className="max-w-5xl mx-auto px-3 sm:px-5 py-5 pb-24">
          {runsErr && tab !== 'performance' && (
            <div className="mb-4 rounded-xl px-4 py-3 text-[12.5px]" style={{ background: `color-mix(in oklab, ${WARN} 10%, transparent)`, border: `1px solid color-mix(in oklab, ${WARN} 30%, transparent)`, color: 'var(--color-foreground)' }}>
              {runsErr} Performance metrics below are unaffected.
            </div>
          )}
          {tab === 'overview' && <OverviewTab status={allOk} dora={dora} tiers={tiers} vitals={vitals} latency={latency} />}
          {tab === 'performance' && <PerformanceTab vitals={vitals} nav={nav} weight={weight} />}
          {tab === 'deploys' && <DeploysTab dora={dora} tiers={tiers} freq={freq} runs={runs} />}
          {tab === 'slos' && <SLOsTab slos={slos} />}
          {tab === 'incidents' && <IncidentsTab list={incList} />}
        </div>
      </div>
    </div>
  )
}
