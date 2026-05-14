import { useEffect, useRef, useState } from 'react'

// ─── helpers ────────────────────────────────────────────────────────────────
const cls = (...a) => a.filter(Boolean).join(' ')

function copy(text) {
  try { navigator.clipboard.writeText(text) } catch {}
}

function prettyJSON(v) {
  try { return JSON.stringify(typeof v === 'string' ? JSON.parse(v) : v, null, 2) }
  catch { return String(v) }
}

// ─── API Playground ─────────────────────────────────────────────────────────
function APITab() {
  const [method, setMethod] = useState('GET')
  const [url, setUrl] = useState('https://api.github.com/users/kranthi0003')
  const [headers, setHeaders] = useState('{\n  "Accept": "application/json"\n}')
  const [body, setBody] = useState('')
  const [resp, setResp] = useState(null)
  const [busy, setBusy] = useState(false)

  async function run() {
    setBusy(true); setResp(null)
    const start = performance.now()
    try {
      let hdrs = {}
      try { hdrs = headers.trim() ? JSON.parse(headers) : {} } catch { throw new Error('Headers must be valid JSON') }
      const opts = { method, headers: hdrs }
      if (method !== 'GET' && method !== 'HEAD' && body.trim()) opts.body = body
      const r = await fetch(url, opts)
      const text = await r.text()
      const ms = Math.round(performance.now() - start)
      setResp({ ok: r.ok, status: r.status, statusText: r.statusText, ms, headers: Object.fromEntries(r.headers), body: text })
    } catch (e) {
      setResp({ error: e.message })
    } finally { setBusy(false) }
  }

  const statusColor = resp?.status ? (resp.status < 300 ? 'text-green-500' : resp.status < 400 ? 'text-blue-500' : resp.status < 500 ? 'text-amber-500' : 'text-red-500') : ''

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <select value={method} onChange={e => setMethod(e.target.value)} className="px-2 py-2 text-xs rounded bg-muted border border-border font-mono">
          {['GET','POST','PUT','PATCH','DELETE','HEAD'].map(m => <option key={m}>{m}</option>)}
        </select>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://api.example.com/..." className="flex-1 px-3 py-2 text-xs rounded bg-muted border border-border font-mono" />
        <button onClick={run} disabled={busy} className="px-4 py-2 text-xs rounded bg-[var(--color-accent)] text-white font-medium disabled:opacity-50">
          {busy ? '...' : 'Send'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-foreground/50 mb-1">Headers (JSON)</div>
          <textarea value={headers} onChange={e => setHeaders(e.target.value)} rows={5} className="w-full px-2 py-1.5 text-[11px] rounded bg-muted border border-border font-mono resize-none" />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-foreground/50 mb-1">Body</div>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} placeholder={method === 'GET' ? '(no body for GET)' : '{ "key": "value" }'} className="w-full px-2 py-1.5 text-[11px] rounded bg-muted border border-border font-mono resize-none" />
        </div>
      </div>
      {resp && (
        <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
          {resp.error ? (
            <div className="text-xs text-red-500 font-mono">⚠ {resp.error}<div className="mt-1 text-foreground/50 text-[10px]">CORS may block browser requests. Try a CORS-friendly API.</div></div>
          ) : (
            <>
              <div className="flex items-center gap-3 text-xs">
                <span className={cls('font-mono font-bold', statusColor)}>{resp.status} {resp.statusText}</span>
                <span className="text-foreground/60">{resp.ms}ms</span>
                <button onClick={() => copy(resp.body)} className="ml-auto text-[10px] text-foreground/60 hover:text-foreground">Copy body</button>
              </div>
              <pre className="text-[10px] font-mono bg-background/50 rounded p-2 max-h-64 overflow-auto whitespace-pre-wrap break-all">{prettyJSON(resp.body)}</pre>
            </>
          )}
        </div>
      )}
      <div className="text-[10px] text-foreground/40">Runs in your browser. CORS rules apply — many APIs will refuse cross-origin calls.</div>
    </div>
  )
}

// ─── DNS Inspector ──────────────────────────────────────────────────────────
function DNSTab() {
  const [domain, setDomain] = useState('github.com')
  const [results, setResults] = useState(null)
  const [busy, setBusy] = useState(false)
  const TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS']

  async function lookup() {
    if (!domain.trim()) return
    setBusy(true); setResults(null)
    try {
      const out = {}
      await Promise.all(TYPES.map(async t => {
        try {
          const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain.trim())}&type=${t}`, {
            headers: { Accept: 'application/dns-json' }
          })
          const j = await r.json()
          out[t] = (j.Answer || []).map(a => ({ data: a.data, ttl: a.TTL }))
        } catch { out[t] = [] }
      }))
      setResults(out)
    } finally { setBusy(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()} placeholder="example.com" className="flex-1 px-3 py-2 text-xs rounded bg-muted border border-border font-mono" />
        <button onClick={lookup} disabled={busy} className="px-4 py-2 text-xs rounded bg-[var(--color-accent)] text-white font-medium disabled:opacity-50">
          {busy ? '...' : 'Lookup'}
        </button>
      </div>
      {results && (
        <div className="space-y-2">
          {TYPES.map(t => (
            <div key={t} className="rounded-lg border border-border bg-muted/30 p-2.5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold text-[var(--color-accent)] w-12">{t}</span>
                <span className="text-[10px] text-foreground/50">{results[t]?.length || 0} record{results[t]?.length === 1 ? '' : 's'}</span>
              </div>
              {results[t]?.length ? (
                <div className="space-y-0.5">
                  {results[t].map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="flex-1 break-all">{r.data}</span>
                      <span className="text-foreground/40 text-[10px]">TTL {r.ttl}s</span>
                      <button onClick={() => copy(r.data)} className="text-foreground/40 hover:text-foreground text-[10px]">⎘</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-foreground/30 font-mono">—</div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="text-[10px] text-foreground/40">Resolved via Cloudflare DNS-over-HTTPS (1.1.1.1).</div>
    </div>
  )
}

// ─── Cron Parser ────────────────────────────────────────────────────────────
function parseField(s, min, max, names) {
  // returns sorted unique array of allowed values
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
      const [a, b] = p.split('-').map(x => names ? names.indexOf(x.toLowerCase()) === -1 ? parseInt(x, 10) : names.indexOf(x.toLowerCase()) : parseInt(x, 10))
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

function nextRuns(expr, count = 5) {
  const p = parseCron(expr)
  const out = []
  const d = new Date()
  d.setSeconds(0, 0)
  d.setMinutes(d.getMinutes() + 1)
  let safety = 366 * 24 * 60
  while (out.length < count && safety-- > 0) {
    const mo = d.getMonth() + 1, dm = d.getDate(), dw = d.getDay(), hr = d.getHours(), mi = d.getMinutes()
    const monthOk = p.month.includes(mo)
    const hourOk = p.hour.includes(hr)
    const minOk = p.minute.includes(mi)
    const domHit = p.dom.includes(dm)
    const dowHit = p.dow.includes(dw)
    // standard cron: if both dom and dow are restricted, match if EITHER hits
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
  // tiny human-readable for common patterns
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
  }
  return map[expr.trim()] || null
}

function CronTab() {
  const [expr, setExpr] = useState('*/15 9-17 * * 1-5')
  const [out, setOut] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    setErr(''); setOut(null)
    if (!expr.trim()) return
    try {
      const runs = nextRuns(expr, 5)
      setOut({ desc: describe(expr), runs })
    } catch (e) { setErr(e.message) }
  }, [expr])

  const PRESETS = [
    ['* * * * *', 'Every minute'],
    ['*/15 * * * *', 'Every 15 min'],
    ['0 * * * *', 'Hourly'],
    ['0 9 * * 1-5', 'Weekdays 9am'],
    ['0 0 * * 0', 'Sunday midnight'],
    ['0 0 1 * *', 'Monthly'],
  ]

  return (
    <div className="space-y-3">
      <input value={expr} onChange={e => setExpr(e.target.value)} placeholder="*/15 9-17 * * 1-5" className="w-full px-3 py-2 text-sm rounded bg-muted border border-border font-mono" />
      <div className="flex flex-wrap gap-1">
        {PRESETS.map(([v, l]) => (
          <button key={v} onClick={() => setExpr(v)} className="px-2 py-1 text-[10px] rounded bg-muted/60 hover:bg-muted border border-border">{l}</button>
        ))}
      </div>
      {err && <div className="text-xs text-red-500 font-mono">⚠ {err}</div>}
      {out && (
        <>
          {out.desc && <div className="text-xs text-foreground/70"><span className="text-[10px] uppercase tracking-wider text-foreground/40 mr-2">Means</span>{out.desc}</div>}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-foreground/50 mb-1.5">Next 5 runs (your local time)</div>
            <div className="space-y-1">
              {out.runs.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-foreground/40 w-4">{i + 1}.</span>
                  <span>{d.toLocaleString()}</span>
                  <span className="text-foreground/40 text-[10px] ml-auto">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <div className="text-[10px] text-foreground/40">5-field cron: <span className="font-mono">minute hour day-of-month month day-of-week</span></div>
    </div>
  )
}

// ─── Modal shell ────────────────────────────────────────────────────────────
export default function DevNet() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('api')
  const ref = useRef(null)

  useEffect(() => {
    const toggle = () => setOpen(o => !o)
    window.addEventListener('toggle-dev-net', toggle)
    return () => window.removeEventListener('toggle-dev-net', toggle)
  }, [])

  useEffect(() => {
    if (!open) return
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open])

  if (!open) return null

  const tabs = [
    { id: 'api', label: 'API', icon: '⚡' },
    { id: 'dns', label: 'DNS', icon: '🌐' },
    { id: 'cron', label: 'Cron', icon: '⏱' },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
      <div ref={ref} className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-background border border-border shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-base">🛠</span>
            <h2 className="text-sm font-semibold">Network DevTools</h2>
          </div>
          <button onClick={() => setOpen(false)} className="text-foreground/50 hover:text-foreground transition-colors text-lg leading-none">×</button>
        </div>
        <div className="flex border-b border-border bg-muted/30">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={cls('flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5', tab === t.id ? 'text-foreground border-b-2 border-[var(--color-accent)]' : 'text-foreground/50 hover:text-foreground/80')}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'api' && <APITab />}
          {tab === 'dns' && <DNSTab />}
          {tab === 'cron' && <CronTab />}
        </div>
      </div>
    </div>
  )
}
