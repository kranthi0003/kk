import { useEffect, useState } from 'react'

const cls = (...a) => a.filter(Boolean).join(' ')

const SERVICES = [
  { id: 'github',     name: 'GitHub',     url: 'https://www.githubstatus.com/api/v2/status.json',     site: 'https://www.githubstatus.com' },
  { id: 'npm',        name: 'npm',        url: 'https://status.npmjs.org/api/v2/status.json',         site: 'https://status.npmjs.org' },
  { id: 'cloudflare', name: 'Cloudflare', url: 'https://www.cloudflarestatus.com/api/v2/status.json', site: 'https://www.cloudflarestatus.com' },
  { id: 'vercel',     name: 'Vercel',     url: 'https://www.vercel-status.com/api/v2/status.json',    site: 'https://www.vercel-status.com' },
  { id: 'netlify',    name: 'Netlify',    url: 'https://www.netlifystatus.com/api/v2/status.json',    site: 'https://www.netlifystatus.com' },
  { id: 'openai',     name: 'OpenAI',     url: 'https://status.openai.com/api/v2/status.json',        site: 'https://status.openai.com' },
  { id: 'stripe',     name: 'Stripe',     url: 'https://status.stripe.com/api/v2/status.json',        site: 'https://status.stripe.com' },
  { id: 'anthropic',  name: 'Anthropic',  url: 'https://status.anthropic.com/api/v2/status.json',     site: 'https://status.anthropic.com' },
]

const INDICATOR = {
  none: { label: 'Operational', color: 'bg-green-500' },
  minor: { label: 'Minor issue', color: 'bg-yellow-500' },
  major: { label: 'Major issue', color: 'bg-orange-500' },
  critical: { label: 'Outage', color: 'bg-red-500' },
}

export default function ServiceStatus() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState({})
  const [busy, setBusy] = useState(false)
  const [lastFetch, setLastFetch] = useState(null)

  async function refresh() {
    setBusy(true)
    const next = {}
    await Promise.all(SERVICES.map(async s => {
      try {
        const r = await fetch(s.url)
        const j = await r.json()
        next[s.id] = { indicator: j.status?.indicator || 'unknown', description: j.status?.description || 'Unknown' }
      } catch { next[s.id] = { indicator: 'unknown', description: 'Fetch failed' } }
    }))
    setData(next); setBusy(false); setLastFetch(new Date())
  }

  useEffect(() => {
    const toggle = () => setOpen(o => !o)
    window.addEventListener('toggle-service-status', toggle)
    return () => window.removeEventListener('toggle-service-status', toggle)
  }, [])

  useEffect(() => {
    if (!open) return
    if (!lastFetch) refresh()
    const esc = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [open])

  if (!open) return null

  const upCount = Object.values(data).filter(d => d.indicator === 'none').length
  const total = SERVICES.length

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
      <div className="w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl bg-background border border-border shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-base">🟢</span>
            <h2 className="text-sm font-semibold">Service Status</h2>
            {Object.keys(data).length > 0 && (
              <span className="text-[10px] text-foreground/50 ml-1">{upCount}/{total} operational</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={refresh} disabled={busy} className="text-[10px] text-foreground/60 hover:text-foreground disabled:opacity-50">
              {busy ? 'Refreshing...' : '↻ Refresh'}
            </button>
            <button onClick={() => setOpen(false)} className="text-foreground/50 hover:text-foreground transition-colors text-lg leading-none">×</button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {SERVICES.map(s => {
            const d = data[s.id]
            const ind = INDICATOR[d?.indicator] || { label: d?.description || 'Loading...', color: 'bg-foreground/20' }
            return (
              <a key={s.id} href={s.site} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/60 transition-colors px-3 py-2.5">
                <span className={cls('inline-block w-2.5 h-2.5 rounded-full flex-shrink-0', ind.color, d?.indicator && d.indicator !== 'none' ? 'animate-pulse' : '')} />
                <span className="text-sm font-medium flex-1">{s.name}</span>
                <span className="text-[11px] text-foreground/60">{d ? ind.label : '...'}</span>
                <svg className="w-3 h-3 text-foreground/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </a>
            )
          })}
          {lastFetch && (
            <div className="text-[10px] text-foreground/40 text-center pt-2">
              Last checked {lastFetch.toLocaleTimeString()} · Click any service for details
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
