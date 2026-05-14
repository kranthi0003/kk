import { useEffect, useState } from 'react'

// ─── cron parsing (same logic as before, scoped here) ───────────────────────
function parseField(s, min, max, names) {
  const out = new Set()
  for (const part of s.split(',')) {
    let p = part.trim()
    if (!p) continue
    let step = 1
    if (p.includes('/')) {
      const [a, b] = p.split('/')
      step = parseInt(b, 10) || 1
      p = a
    }
    let lo, hi
    if (p === '*') { lo = min; hi = max }
    else if (p.includes('-')) {
      const [a, b] = p.split('-').map(x => names ? (names.indexOf(x.toLowerCase()) === -1 ? parseInt(x, 10) : names.indexOf(x.toLowerCase())) : parseInt(x, 10))
      lo = a; hi = b
    } else {
      const v = names && names.indexOf(p.toLowerCase()) !== -1 ? names.indexOf(p.toLowerCase()) : parseInt(p, 10)
      lo = v; hi = v
    }
    if (isNaN(lo) || isNaN(hi) || lo < min || hi > max || lo > hi) throw new Error(`Invalid field: ${part}`)
    for (let i = lo; i <= hi; i += step) out.add(i)
  }
  return [...out].sort((a, b) => a - b)
}

const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
const DOWS = ['sun','mon','tue','wed','thu','fri','sat']

function parseCron(expr) {
  const fields = expr.trim().split(/\s+/)
  if (fields.length !== 5) throw new Error('Cron must have 5 fields: minute hour day-of-month month day-of-week')
  const [m, h, dom, mon, dow] = fields
  return {
    minute: parseField(m, 0, 59),
    hour: parseField(h, 0, 23),
    dom: parseField(dom, 1, 31),
    month: parseField(mon, 1, 12, MONTHS),
    dow: parseField(dow.replace(/7/g, '0'), 0, 6, DOWS),
    domAny: dom.trim() === '*',
    dowAny: dow.trim() === '*',
  }
}

function nextRuns(expr, count = 5, useUTC = false) {
  const p = parseCron(expr)
  const out = []
  const d = new Date()
  d.setSeconds(0, 0)
  d.setMinutes(d.getMinutes() + 1)
  let safety = 366 * 24 * 60
  while (out.length < count && safety-- > 0) {
    const mo = (useUTC ? d.getUTCMonth() : d.getMonth()) + 1
    const dm = useUTC ? d.getUTCDate() : d.getDate()
    const dw = useUTC ? d.getUTCDay() : d.getDay()
    const hr = useUTC ? d.getUTCHours() : d.getHours()
    const mi = useUTC ? d.getUTCMinutes() : d.getMinutes()
    const monthOk = p.month.includes(mo)
    const hourOk = p.hour.includes(hr)
    const minOk = p.minute.includes(mi)
    const domHit = p.dom.includes(dm)
    const dowHit = p.dow.includes(dw)
    const dayOk = (p.domAny && p.dowAny) ? true
      : p.domAny ? dowHit
      : p.dowAny ? domHit
      : (domHit || dowHit)
    if (monthOk && dayOk && hourOk && minOk) out.push(new Date(d))
    d.setMinutes(d.getMinutes() + 1)
  }
  return out
}

function describe(expr) {
  const map = {
    '* * * * *': 'Every minute',
    '0 * * * *': 'Every hour, on the hour',
    '*/5 * * * *': 'Every 5 minutes',
    '*/15 * * * *': 'Every 15 minutes',
    '*/30 * * * *': 'Every 30 minutes',
    '0 0 * * *': 'Every day at midnight',
    '0 12 * * *': 'Every day at noon',
    '0 9 * * 1-5': 'Weekdays at 9:00 AM',
    '0 0 * * 0': 'Every Sunday at midnight',
    '0 0 1 * *': 'First day of every month',
    '0 0 1 1 *': 'New Year at midnight',
    '*/10 * * * *': 'Every 10 minutes',
  }
  return map[expr.trim()] || null
}

function copy(text) { try { navigator.clipboard.writeText(text) } catch {} }

const PRESETS = [
  ['*/15 * * * *', 'Every 15 min'],
  ['0 * * * *', 'Hourly'],
  ['0 */6 * * *', 'Every 6 hours'],
  ['0 9 * * 1-5', 'Weekdays 9am'],
  ['0 0 * * 0', 'Sunday midnight'],
  ['0 0 1 * *', 'Monthly'],
  ['0 2 * * *', 'Daily 2am'],
  ['*/30 * * * *', 'Every 30 min'],
]

function CronTab() {
  const [expr, setExpr] = useState('0 9 * * 1-5')
  const [out, setOut] = useState(null)
  const [err, setErr] = useState('')
  const [useUTC, setUseUTC] = useState(false)
  const [copied, setCopied] = useState(null)

  useEffect(() => {
    setErr(''); setOut(null)
    if (!expr.trim()) return
    try {
      const runs = nextRuns(expr, 5, useUTC)
      setOut({ desc: describe(expr), runs })
    } catch (e) { setErr(e.message) }
  }, [expr, useUTC])

  const actionsYAML = `on:
  schedule:
    - cron: '${expr}'`

  const doCopy = (label, text) => { copy(text); setCopied(label); setTimeout(() => setCopied(null), 1500) }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-foreground/50 mb-1.5">Cron expression</div>
        <input value={expr} onChange={e => setExpr(e.target.value)} placeholder="0 9 * * 1-5" className="w-full px-3 py-2.5 text-sm rounded-lg bg-muted border border-border font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40" />
        <div className="text-[10px] text-foreground/40 mt-1 font-mono">minute hour day-of-month month day-of-week</div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-foreground/50 mb-1.5">Presets</div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(([v, l]) => (
            <button key={v} onClick={() => setExpr(v)} className={`px-2.5 py-1 text-[11px] rounded-full border transition-colors ${expr === v ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]' : 'bg-muted/60 hover:bg-muted border-border'}`}>{l}</button>
          ))}
        </div>
      </div>

      {err && <div className="text-xs text-red-500 font-mono bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">⚠ {err}</div>}

      {out && (
        <>
          {out.desc && (
            <div className="rounded-lg bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/20 px-3 py-2">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-accent)] mb-0.5">Means</div>
              <div className="text-sm">{out.desc}</div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] uppercase tracking-wider text-foreground/50">Next 5 runs</div>
              <div className="flex items-center gap-1 text-[10px] bg-muted rounded-full p-0.5">
                <button onClick={() => setUseUTC(false)} className={`px-2 py-0.5 rounded-full ${!useUTC ? 'bg-background text-foreground' : 'text-foreground/50'}`}>Local</button>
                <button onClick={() => setUseUTC(true)} className={`px-2 py-0.5 rounded-full ${useUTC ? 'bg-background text-foreground' : 'text-foreground/50'}`}>UTC</button>
              </div>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 divide-y divide-border">
              {out.runs.map((d, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 text-xs font-mono">
                  <span className="text-foreground/40 w-4">{i + 1}.</span>
                  <span className="flex-1">{useUTC ? d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC' : d.toLocaleString()}</span>
                  <span className="text-foreground/40 text-[10px]">{d.toLocaleDateString(undefined, { weekday: 'short', timeZone: useUTC ? 'UTC' : undefined })}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] text-foreground/40 mt-1">GitHub Actions schedules use <span className="font-mono">UTC</span> — toggle above to preview.</div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-[10px] uppercase tracking-wider text-foreground/50">GitHub Actions YAML</div>
              <button onClick={() => doCopy('yaml', actionsYAML)} className="text-[10px] text-[var(--color-accent)] hover:underline">
                {copied === 'yaml' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre className="text-[11px] font-mono bg-muted/50 border border-border rounded-lg p-3 overflow-x-auto"><code>{actionsYAML}</code></pre>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => doCopy('expr', expr)} className="text-xs px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors">
              {copied === 'expr' ? '✓ Copied' : 'Copy expression'}
            </button>
            <a href={`https://crontab.guru/#${encodeURIComponent(expr.replace(/ /g, '_'))}`} target="_blank" rel="noreferrer" className="text-xs px-3 py-2 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors text-center">
              Open in crontab.guru ↗
            </a>
          </div>
        </>
      )}
    </div>
  )
}

const TABS = [
  { id: 'cron', label: 'Cron', icon: '⏱', render: () => <CronTab /> },
]

export default function ActionsTools() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('cron')

  useEffect(() => {
    const toggle = () => setOpen(o => !o)
    window.addEventListener('toggle-actions-tools', toggle)
    return () => window.removeEventListener('toggle-actions-tools', toggle)
  }, [])

  useEffect(() => {
    if (!open) return
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open])

  if (!open) return null

  const active = TABS.find(t => t.id === tab) || TABS[0]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
      <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-background border border-border shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[var(--color-accent)]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.111.82-.261.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
            <h2 className="text-sm font-semibold">Actions</h2>
          </div>
          <button onClick={() => setOpen(false)} className="text-foreground/50 hover:text-foreground transition-colors text-lg leading-none">×</button>
        </div>

        {TABS.length > 1 && (
          <div className="flex border-b border-border bg-muted/30">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${tab === t.id ? 'text-foreground border-b-2 border-[var(--color-accent)]' : 'text-foreground/50 hover:text-foreground/80'}`}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {active.render()}
        </div>
      </div>
    </div>
  )
}
