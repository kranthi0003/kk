import React, { useEffect, useState } from 'react'

// A compact, live MSFT share-price ticker for the navbar. Real data from
// Finnhub's /quote endpoint (CORS-friendly). The API key is injected at build
// time from a GitHub Actions secret (VITE_FINNHUB_API_KEY) — never committed.
// Fail-soft: if the key is absent, the ticker simply doesn't render.
const KEY = import.meta.env.VITE_FINNHUB_API_KEY
const SYMBOL = 'MSFT'
const UP = '#3fb950'   // GitHub green
const DOWN = '#f85149' // GitHub red

export default function StockTicker() {
  const [q, setQ] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!KEY) return
    let alive = true
    const load = async () => {
      try {
        const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${SYMBOL}&token=${KEY}`, { cache: 'no-store' })
        if (!r.ok) throw new Error('bad status')
        const d = await r.json()
        if (!alive) return
        if (d && typeof d.c === 'number' && d.c > 0) { setQ(d); setFailed(false) }
        else throw new Error('no price')
      } catch {
        if (alive) setFailed(true)
      }
    }
    load()
    // Finnhub free tier is 60 req/min — polling once a minute is plenty.
    const timer = setInterval(() => { if (!document.hidden) load() }, 60000)
    const onVis = () => { if (!document.hidden) load() }
    document.addEventListener('visibilitychange', onVis)
    return () => { alive = false; clearInterval(timer); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  if (!KEY) return null                      // no key baked in → stay hidden
  if (failed && !q) return null              // couldn't load and nothing cached → hide

  const loading = !q
  const up = q ? q.d >= 0 : true
  const color = up ? UP : DOWN

  return (
    <a
      href={`https://finance.yahoo.com/quote/${SYMBOL}`}
      target="_blank"
      rel="noopener noreferrer"
      title={q ? `Microsoft (MSFT) — $${q.c.toFixed(2)}, ${up ? '+' : ''}${q.d.toFixed(2)} (${up ? '+' : ''}${q.dp.toFixed(2)}%) today` : 'Microsoft (MSFT)'}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono transition-colors hover:bg-muted"
      style={{ border: '1px solid var(--color-border)' }}
      aria-label="Microsoft share price"
    >
      <span className="font-semibold text-foreground tracking-tight">MSFT</span>
      {loading ? (
        <span className="text-muted-foreground animate-pulse">···</span>
      ) : (
        <>
          <span className="text-foreground tabular-nums">${q.c.toFixed(2)}</span>
          <span className="tabular-nums inline-flex items-center gap-0.5" style={{ color }}>
            <span aria-hidden="true" style={{ fontSize: '8px' }}>{up ? '▲' : '▼'}</span>
            {Math.abs(q.dp).toFixed(2)}%
          </span>
        </>
      )}
    </a>
  )
}
