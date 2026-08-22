import React, { useEffect, useState } from 'react'

/* ------------------------------------------------------------------ *
 * #/stocks — the handful of tickers worth a glance.
 *
 * Same source and key as the navbar ticker: Finnhub's /quote endpoint,
 * with the key injected at build time from a GitHub Actions secret. It's
 * never committed, which means this page cannot be checked against live
 * data in a local build — the key simply isn't there. So it fails loudly
 * rather than silently: with no key it says so, instead of rendering an
 * empty grid that looks like a market holiday.
 *
 * One request per symbol. Finnhub's free tier allows 60 a minute and
 * this is nine, so a visitor is nowhere near the ceiling even reloading
 * repeatedly — but it still refreshes on a timer rather than on every
 * render, and pauses while the tab is hidden.
 * ------------------------------------------------------------------ */

const KEY = import.meta.env.VITE_FINNHUB_API_KEY
const UP = '#3fb950'
const DOWN = '#f85149'

// His employer first, then the rest of the infrastructure he actually
// works on top of, then the two that move the whole market's mood.
const SYMBOLS = [
  { s: 'MSFT', n: 'Microsoft', note: 'employer — GitHub' },
  { s: 'NVDA', n: 'NVIDIA' },
  { s: 'AMZN', n: 'Amazon', note: 'ex — AWS, 2021–25' },
  { s: 'GOOGL', n: 'Alphabet' },
  { s: 'AAPL', n: 'Apple' },
  { s: 'META', n: 'Meta' },
  { s: 'NET', n: 'Cloudflare' },
  { s: 'DDOG', n: 'Datadog' },
  { s: 'CRWD', n: 'CrowdStrike' },
]

const money = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function Row({ q }) {
  const up = q.dp >= 0
  const c = up ? UP : DOWN
  return (
    <div
      className="flex items-baseline gap-3 px-4 py-3 rounded-xl"
      style={{ background: 'color-mix(in oklab, var(--color-card) 55%, transparent)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}
    >
      <div className="min-w-0">
        <p className="text-[13px] font-mono font-medium text-foreground">{q.s}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {q.n}{q.note ? <span style={{ opacity: 0.7 }}> · {q.note}</span> : null}
        </p>
      </div>
      <div className="ml-auto text-right">
        <p className="text-[14px] font-mono tabular-nums text-foreground">${money(q.c)}</p>
        <p className="text-[11.5px] font-mono tabular-nums" style={{ color: c }}>
          {up ? '▲' : '▼'} {up ? '+' : ''}{q.dp.toFixed(2)}%
        </p>
      </div>
    </div>
  )
}

export default function StocksPage({ onBack }) {
  const [rows, setRows] = useState(undefined) // undefined = loading, null = failed
  const [at, setAt] = useState(null)

  useEffect(() => {
    if (!KEY) { setRows(null); return }
    let alive = true

    const load = async () => {
      const out = await Promise.all(SYMBOLS.map(async (m) => {
        try {
          const r = await fetch(`https://finnhub.io/api/v1/quote?symbol=${m.s}&token=${KEY}`, { cache: 'no-store' })
          if (!r.ok) return null
          const d = await r.json()
          // Finnhub answers 200 with zeroes for a symbol it doesn't know,
          // so a price of 0 means "no data", not "worthless".
          if (!d || typeof d.c !== 'number' || d.c <= 0) return null
          return { ...m, c: d.c, dp: typeof d.dp === 'number' ? d.dp : 0 }
        } catch { return null }
      }))
      if (!alive) return
      const ok = out.filter(Boolean)
      setRows(ok.length ? ok : null)
      setAt(new Date())
    }

    load()
    const t = setInterval(() => { if (!document.hidden) load() }, 60000)
    const onVis = () => { if (!document.hidden) load() }
    document.addEventListener('visibilitychange', onVis)
    return () => { alive = false; clearInterval(t); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-5 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between gap-4">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          {at && (
            <span className="text-[11px] font-mono text-muted-foreground tabular-nums">
              {at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        <header className="mt-8 sm:mt-12">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em]" style={{ color: '#5FBF8F' }}>Markets</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Stocks</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground max-w-prose">
            The companies whose infrastructure I work on, work for, or used to.
          </p>
        </header>

        {rows === undefined && (
          <p className="mt-10 text-[13px] font-mono text-muted-foreground animate-pulse">checking the tape…</p>
        )}

        {rows === null && (
          <p className="mt-10 text-[13.5px] leading-relaxed text-muted-foreground">
            {KEY
              ? "Quotes didn't load. Finnhub rate-limits heavily on the free tier, so this usually clears on its own."
              : 'No market data key is configured for this build, so there are no quotes to show.'}
          </p>
        )}

        {Array.isArray(rows) && (
          <>
            <div className="mt-8 grid sm:grid-cols-2 gap-3">
              {rows.map((q) => <Row key={q.s} q={q} />)}
            </div>
            <p className="mt-8 text-[12px] text-muted-foreground">
              Finnhub · delayed, and refreshed once a minute while this tab is open.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
