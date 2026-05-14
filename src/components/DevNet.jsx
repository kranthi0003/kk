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

        </div>
      </div>
    </div>
  )
}
