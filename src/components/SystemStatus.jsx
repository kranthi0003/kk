import { useEffect, useRef, useState, useCallback } from 'react'
import { GROUPS, runAllChecks, rollupGroup, overallStatus, STATUS_META } from '../lib/healthChecks'

const DOT = { ok: '#22c55e', slow: '#f59e0b', down: '#ef4444', checking: '#94a3b8', degraded: '#f59e0b' }
const CHECK_LABEL = { ok: 'Operational', slow: 'Slow', down: 'Down', checking: 'Checking…' }

// ============================================================
// SYSTEM STATUS — a live, honest status page for the site.
// Runs every dependency check in the visitor's browser, shows an
// incident banner when something's off, and a statuspage-style panel.
// The footer pill talks to this via window events (no double-run).
// ============================================================
export default function SystemStatus() {
  const [results, setResults] = useState({})
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [lastRun, setLastRun] = useState(null)
  const [running, setRunning] = useState(false)
  const [history, setHistory] = useState({}) // per-check rolling latency samples
  const prevOverall = useRef(null)
  const runningRef = useRef(false)
  const lastRunAt = useRef(0)

  const groupStatus = {}
  for (const g of GROUPS) groupStatus[g.id] = rollupGroup(results, g)
  const overall = overallStatus(groupStatus)

  const run = useCallback(async () => {
    if (runningRef.current) return // don't overlap an in-flight run
    runningRef.current = true
    setRunning(true)
    const final = await runAllChecks(partial => setResults({ ...partial }))
    // append this run's latency to each check's rolling history (null = down)
    setHistory(prev => {
      const next = { ...prev }
      for (const g of GROUPS) for (const c of g.checks) {
        const ms = final[c.id]?.status === 'down' ? null : (final[c.id]?.ms ?? null)
        next[c.id] = (next[c.id] || []).concat(ms).slice(-24)
      }
      return next
    })
    lastRunAt.current = Date.now()
    setLastRun(new Date())
    setRunning(false)
    runningRef.current = false
  }, [])

  // Run on mount, then auto re-run every 3 min while the tab is visible
  // (paused when hidden). Also refresh when returning to a stale tab.
  useEffect(() => {
    run()
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') run()
    }, 180000)
    const onVis = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastRunAt.current > 90000) run()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [run])

  // Broadcast overall status for the footer pill; re-show banner if it worsens.
  useEffect(() => {
    if (overall === 'checking') return
    window.dispatchEvent(new CustomEvent('system-status-change', { detail: { overall } }))
    if (prevOverall.current && prevOverall.current !== overall && overall !== 'operational') {
      setDismissed(false) // status changed for the worse → surface it again
    }
    prevOverall.current = overall
  }, [overall])

  // Bridge with the footer pill / other openers.
  useEffect(() => {
    const onOpen = () => setOpen(true)
    const onReq = () => window.dispatchEvent(new CustomEvent('system-status-change', { detail: { overall: prevOverall.current || 'checking' } }))
    window.addEventListener('system-status-open', onOpen)
    window.addEventListener('system-status-request', onReq)
    return () => { window.removeEventListener('system-status-open', onOpen); window.removeEventListener('system-status-request', onReq) }
  }, [])

  const affected = GROUPS.filter(g => groupStatus[g.id] === 'down' || groupStatus[g.id] === 'degraded')
  const showBanner = !dismissed && (overall === 'outage' || overall === 'degraded') && affected.length > 0
  const bannerColor = overall === 'outage' ? '#ef4444' : '#f59e0b'
  const bannerText = overall === 'outage'
    ? `${affected.map(g => g.label).join(', ')} ${affected.length > 1 ? 'are' : 'is'} down`
    : `${affected.map(g => g.label).join(', ')} ${affected.length > 1 ? 'are' : 'is'} degraded`

  return (
    <>
      {/* Incident banner — only when something is off */}
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-[1000] flex items-center justify-center gap-3 px-4 py-2 text-[12px] font-medium text-white shadow-lg"
          style={{ background: bannerColor }}>
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-white/70 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <b>{overall === 'outage' ? 'Incident' : 'Degraded'}:</b> {bannerText}
          </span>
          <button onClick={() => setOpen(true)} className="underline underline-offset-2 hover:opacity-80">View status</button>
          <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="ml-1 text-white/70 hover:text-white font-bold">✕</button>
        </div>
      )}

      {open && (
        <StatusPanel
          onClose={() => setOpen(false)}
          results={results} groupStatus={groupStatus} overall={overall} history={history}
          lastRun={lastRun} running={running} onRerun={run}
        />
      )}
    </>
  )
}

function StatusPanel({ onClose, results, groupStatus, overall, history, lastRun, running, onRerun }) {
  const meta = STATUS_META[overall] || STATUS_META.checking
  return (
    <div className="fixed inset-0 z-[1001] flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up my-4"
        style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 py-4" style={{ background: `color-mix(in oklab, ${meta.color} 12%, transparent)`, borderBottom: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                {overall !== 'operational' && <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: meta.dot, opacity: 0.6 }} />}
                <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: meta.dot }} />
              </span>
              <h2 className="text-[15px] font-semibold text-foreground">{meta.label}</h2>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">System status · checked live from your browser</p>
        </div>

        {/* Groups */}
        <div className="max-h-[60vh] overflow-y-auto px-5 py-3">
          {GROUPS.map((g, gi) => {
            const gs = groupStatus[g.id] || 'checking'
            return (
              <div key={g.id} className="py-3" style={gi > 0 ? { borderTop: '1px solid var(--color-border)' } : undefined}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: DOT[gs] || DOT.checking }} />
                    <span className="text-[13px] font-semibold text-foreground">{g.label}</span>
                    {g.critical && <span className="text-[9px] font-mono uppercase tracking-wide text-muted-foreground/70 border rounded px-1" style={{ borderColor: 'var(--color-border)' }}>core</span>}
                  </div>
                  <span className="text-[11px] font-medium capitalize" style={{ color: DOT[gs] || DOT.checking }}>
                    {gs === 'ok' ? 'Operational' : gs === 'degraded' ? 'Degraded' : gs === 'down' ? 'Down' : '…'}
                  </span>
                </div>
                <div className="mt-2 ml-4 space-y-1">
                  {g.checks.map(c => {
                    const r = results[c.id] || { status: 'checking' }
                    return (
                      <div key={c.id} className="flex items-center justify-between gap-2 text-[11.5px]">
                        <span className="flex items-center gap-1.5 text-muted-foreground min-w-0 flex-shrink">
                          <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: DOT[r.status] || DOT.checking }} />
                          <span className="truncate">{c.label}</span>
                        </span>
                        <span className="flex items-center gap-2 flex-shrink-0">
                          <Sparkline data={history?.[c.id]} />
                          <span className="font-mono tabular-nums text-right" style={{ color: r.status === 'down' ? DOT.down : 'var(--color-muted-foreground)', minWidth: '4.5rem' }}>
                            {r.status === 'checking' ? '···' : r.detail || CHECK_LABEL[r.status]}
                          </span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border)', background: 'color-mix(in oklab, var(--color-muted) 40%, transparent)' }}>
          <span className="text-[10.5px] text-muted-foreground font-mono">
            {lastRun ? `Updated ${lastRun.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · auto every 3m` : 'Checking…'}
          </span>
          <button onClick={onRerun} disabled={running}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
            style={{ background: 'color-mix(in oklab, var(--color-accent) 16%, transparent)', color: 'var(--color-accent)' }}>
            {running ? 'Checking…' : '↻ Re-run checks'}
          </button>
        </div>
      </div>
    </div>
  )
}

// A tiny latency sparkline from a check's rolling samples (null = down).
function Sparkline({ data }) {
  const W = 46, H = 14
  const pts = (data || []).slice(-16)
  const nums = pts.filter(v => typeof v === 'number')
  if (nums.length < 2) return <span className="inline-block flex-shrink-0" style={{ width: W }} />
  const min = Math.min(...nums), max = Math.max(...nums)
  const range = max - min || 1
  const n = pts.length
  const x = (i) => (n === 1 ? 0 : (i / (n - 1)) * (W - 2)) + 1
  const y = (v) => H - 1 - ((v - min) / range) * (H - 2)
  let d = '', pen = false
  pts.forEach((v, i) => {
    if (typeof v === 'number') { d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)} `; pen = true }
    else pen = false // break the line where a sample was down
  })
  const last = pts[n - 1]
  return (
    <svg width={W} height={H} className="flex-shrink-0 text-muted-foreground/60" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
      {typeof last === 'number' && <circle cx={x(n - 1)} cy={y(last)} r="1.5" fill="var(--color-accent)" />}
      {pts.map((v, i) => v === null ? <circle key={i} cx={x(i)} cy={H - 2} r="1.1" fill="#ef4444" /> : null)}
    </svg>
  )
}

// A tiny status pill for the footer. Subscribes to the SystemStatus
// broadcast; clicking opens the panel. No checks run here.
export function SystemStatusPill() {
  const [overall, setOverall] = useState('checking')
  useEffect(() => {
    const onChange = (e) => setOverall(e.detail?.overall || 'checking')
    window.addEventListener('system-status-change', onChange)
    window.dispatchEvent(new CustomEvent('system-status-request'))
    return () => window.removeEventListener('system-status-change', onChange)
  }, [])
  const meta = STATUS_META[overall] || STATUS_META.checking
  return (
    <button onClick={() => window.dispatchEvent(new CustomEvent('system-status-open'))}
      className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      title="View system status">
      <span className="relative flex h-2 w-2">
        {overall !== 'operational' && overall !== 'checking' && <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: meta.dot, opacity: 0.6 }} />}
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: meta.dot }} />
      </span>
      {meta.label}
    </button>
  )
}

// A subtle navbar indicator that appears ONLY during an active incident
// (degraded = amber, outage = red). Clicking opens the status panel.
export function SystemStatusDot() {
  const [overall, setOverall] = useState('checking')
  useEffect(() => {
    const onChange = (e) => setOverall(e.detail?.overall || 'checking')
    window.addEventListener('system-status-change', onChange)
    window.dispatchEvent(new CustomEvent('system-status-request'))
    return () => window.removeEventListener('system-status-change', onChange)
  }, [])
  if (overall !== 'degraded' && overall !== 'outage') return null
  const color = overall === 'outage' ? '#ef4444' : '#f59e0b'
  return (
    <button onClick={() => window.dispatchEvent(new CustomEvent('system-status-open'))}
      title={overall === 'outage' ? 'Service incident — view status' : 'Degraded performance — view status'}
      aria-label="Service status incident"
      className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: color, opacity: 0.6 }} />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: color }} />
      </span>
    </button>
  )
}
