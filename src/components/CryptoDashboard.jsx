import React, { useEffect, useMemo, useRef, useState } from 'react'

const BTC_ADDR = 'bc1quaunu4xa0jgeh446jlx2mchlv4gda9tj0dqz9e'
const HALVING_BLOCK = 1050000 // next halving target (after 840k in 2024)
const BLOCKS_PER_HOUR = 6

const COINS = [
  { id: 'bitcoin', sym: 'BTC', icon: '₿' },
  { id: 'ethereum', sym: 'ETH', icon: 'Ξ' },
  { id: 'solana', sym: 'SOL', icon: '◎' },
  { id: 'binancecoin', sym: 'BNB', icon: '🅱' },
  { id: 'ripple', sym: 'XRP', icon: '✕' },
  { id: 'cardano', sym: 'ADA', icon: '₳' },
]

function fmtUSD(n, max = 2) {
  if (n == null || isNaN(n)) return '—'
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (n >= 1) return `$${n.toLocaleString('en-US', { maximumFractionDigits: max })}`
  return `$${n.toFixed(4)}`
}
function fmtNum(n) { return n != null ? n.toLocaleString('en-US') : '—' }

function Sparkline({ data, color = '#60a5fa' }) {
  if (!data || data.length < 2) return null
  const w = 80, h = 24
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FearGreedGauge({ value, label }) {
  // semicircle gauge 0-100
  const v = Math.max(0, Math.min(100, value || 0))
  const angle = (v / 100) * 180 - 90 // -90..90
  const r = 70
  const cx = 90, cy = 80
  const segments = [
    { color: '#ef4444', label: 'Extreme Fear' },
    { color: '#f97316', label: 'Fear' },
    { color: '#eab308', label: 'Neutral' },
    { color: '#84cc16', label: 'Greed' },
    { color: '#22c55e', label: 'Extreme Greed' },
  ]
  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="100" viewBox="0 0 180 100">
        {segments.map((s, i) => {
          const startA = (i / 5) * 180 - 90
          const endA = ((i + 1) / 5) * 180 - 90
          const x1 = cx + r * Math.cos((startA * Math.PI) / 180)
          const y1 = cy + r * Math.sin((startA * Math.PI) / 180)
          const x2 = cx + r * Math.cos((endA * Math.PI) / 180)
          const y2 = cy + r * Math.sin((endA * Math.PI) / 180)
          return <path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`} stroke={s.color} strokeWidth="14" fill="none" strokeLinecap="butt" opacity="0.85" />
        })}
        {/* needle */}
        <line
          x1={cx} y1={cy}
          x2={cx + (r - 8) * Math.cos((angle * Math.PI) / 180)}
          y2={cy + (r - 8) * Math.sin((angle * Math.PI) / 180)}
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          style={{ transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
        <circle cx={cx} cy={cy} r="5" fill="currentColor" />
      </svg>
      <div className="text-center -mt-2">
        <div className="text-4xl font-bold font-mono">{v}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">{label || '—'}</div>
      </div>
    </div>
  )
}

// A live BTC price strip that ticks every ~2s while the dashboard is open.
// Polls Coinbase (falls back to Binance) — both are CORS-enabled and USD.
// The dashboard unmounts when closed, so this interval only runs while open;
// it also pauses while the browser tab is hidden.
function LiveTicker({ fallback }) {
  const [price, setPrice] = useState(fallback ?? null)
  const [dir, setDir] = useState('flat')
  const [pop, setPop] = useState(0)
  const prev = useRef(fallback ?? null)
  const openPrice = useRef(fallback ?? null)

  useEffect(() => {
    let alive = true
    const getPrice = async () => {
      try {
        const r = await fetch('https://api.exchange.coinbase.com/products/BTC-USD/ticker')
        if (r.ok) { const j = await r.json(); const p = parseFloat(j.price); if (Number.isFinite(p)) return p }
      } catch {}
      try {
        const r = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT')
        if (r.ok) { const j = await r.json(); const p = parseFloat(j.price); if (Number.isFinite(p)) return p }
      } catch {}
      return null
    }
    const tick = async () => {
      if (typeof document !== 'undefined' && document.hidden) return
      const p = await getPrice()
      if (!alive || p == null) return
      if (openPrice.current == null) openPrice.current = p
      const pr = prev.current
      if (pr != null && p !== pr) { setDir(p > pr ? 'up' : 'down'); setPop(k => k + 1) }
      prev.current = p
      setPrice(p)
    }
    tick()
    const id = setInterval(tick, 2000)
    const onVis = () => { if (!document.hidden) tick() }
    document.addEventListener('visibilitychange', onVis)
    return () => { alive = false; clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  const up = dir === 'up', down = dir === 'down'
  const arrowCol = up ? '#22c55e' : down ? '#ef4444' : 'var(--color-muted-foreground)'
  const delta = price != null && openPrice.current != null ? price - openPrice.current : 0
  const pct = openPrice.current ? (delta / openPrice.current) * 100 : 0
  const deltaCol = delta > 0 ? '#22c55e' : delta < 0 ? '#ef4444' : 'var(--color-muted-foreground)'
  const fmt = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="flex items-center gap-2.5 px-5 py-2 border-b border-border/30 bg-background/60 overflow-hidden">
      <style>{`
        @keyframes ckTick { 0%{transform:translateY(5px);opacity:.4;background:color-mix(in oklab, var(--tc, transparent) 24%, transparent)} 100%{transform:translateY(0);opacity:1;background:transparent} }
        .ck-tick { display:inline-block; animation: ckTick .34s ease-out; }
        @media (prefers-reduced-motion: reduce){ .ck-tick { animation: none } }
      `}</style>
      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex-shrink-0">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/70 animate-ping" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
        </span>
        Live
      </span>
      <span className="text-[10.5px] font-mono text-muted-foreground flex-shrink-0 hidden sm:inline">BTC/USD</span>
      <span key={pop} className="ck-tick font-mono font-bold text-[15px] tabular-nums px-1 rounded text-foreground"
        style={{ '--tc': up ? '#22c55e' : down ? '#ef4444' : 'transparent' }}>
        ${price != null ? fmt(price) : '—'}
      </span>
      <span className="text-[12px] flex-shrink-0 w-3" style={{ color: arrowCol }}>{up ? '▲' : down ? '▼' : ''}</span>
      <span className="ml-auto text-[11px] font-mono tabular-nums flex-shrink-0" style={{ color: deltaCol }}>
        {delta >= 0 ? '+' : ''}{fmt(delta)} <span className="opacity-80">({pct >= 0 ? '+' : ''}{pct.toFixed(2)}%)</span>
      </span>
    </div>
  )
}

export default function CryptoDashboard() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('markets')

  // Markets
  const [markets, setMarkets] = useState([])
  const [marketsLoading, setMarketsLoading] = useState(false)
  // Sentiment
  const [fng, setFng] = useState(null)
  // Network
  const [tipHeight, setTipHeight] = useState(null)
  const [fees, setFees] = useState(null)
  const [mempool, setMempool] = useState(null)
  const [hashrate, setHashrate] = useState(null)
  // Wallet
  const [wallet, setWallet] = useState(null)
  const [btcPrice, setBtcPrice] = useState(null)
  const [copied, setCopied] = useState(false)
  // HODL removed

  useEffect(() => {
    const handler = () => setOpen(o => !o)
    window.addEventListener('toggle-crypto-dash', handler)
    return () => window.removeEventListener('toggle-crypto-dash', handler)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Lazy-load each tab's data on first view
  useEffect(() => {
    if (!open) return
    if (tab === 'markets' && markets.length === 0) loadMarkets()
    if (tab === 'sentiment' && !fng) loadFng()
    if (tab === 'network' && tipHeight == null) loadNetwork()
    if (tab === 'wallet' && !wallet) loadWallet()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab])

  const loadMarkets = async () => {
    setMarketsLoading(true)
    try {
      const ids = COINS.map(c => c.id).join(',')
      const r = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&sparkline=true&price_change_percentage=24h`)
      const data = await r.json()
      setMarkets(data)
    } catch (e) { /* ignore */ }
    setMarketsLoading(false)
  }
  const loadFng = async () => {
    try {
      const r = await fetch('https://api.alternative.me/fng/?limit=1')
      const d = await r.json()
      const item = d?.data?.[0]
      if (item) setFng({ value: Number(item.value), label: item.value_classification, ts: Number(item.timestamp) * 1000 })
    } catch (e) { setFng({ value: 50, label: 'Neutral', ts: Date.now() }) }
  }
  const loadNetwork = async () => {
    try {
      const [h, f, m, hr] = await Promise.all([
        fetch('https://mempool.space/api/blocks/tip/height').then(r => r.text()),
        fetch('https://mempool.space/api/v1/fees/recommended').then(r => r.json()),
        fetch('https://mempool.space/api/mempool').then(r => r.json()),
        fetch('https://mempool.space/api/v1/mining/hashrate/1d').then(r => r.json()).catch(() => null),
      ])
      setTipHeight(Number(h))
      setFees(f)
      setMempool(m)
      if (hr?.currentHashrate) setHashrate(hr.currentHashrate)
    } catch (e) { /* ignore */ }
  }
  const loadWallet = async () => {
    try {
      const [w, p] = await Promise.all([
        fetch(`https://blockchain.info/rawaddr/${BTC_ADDR}?limit=0&cors=true`).then(r => r.json()),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd').then(r => r.json()),
      ])
      setWallet(w); setBtcPrice(p.bitcoin.usd)
    } catch (e) { setWallet({ final_balance: 0, n_tx: 0 }); setBtcPrice(97000) }
  }

  // HODL removed



  // Halving countdown
  const halving = useMemo(() => {
    if (tipHeight == null) return null
    const remaining = HALVING_BLOCK - tipHeight
    const hours = remaining / BLOCKS_PER_HOUR
    const days = Math.floor(hours / 24)
    const eta = new Date(Date.now() + hours * 3600 * 1000)
    return { remaining, days, eta, progress: ((tipHeight - 840000) / (HALVING_BLOCK - 840000)) * 100 }
  }, [tipHeight])

  if (!open) return null

  const tabs = [
    { id: 'markets', label: 'Markets', icon: '📊' },
    { id: 'sentiment', label: 'Sentiment', icon: '🌡️' },
    { id: 'network', label: 'Network', icon: '⛓️' },
    { id: 'wallet', label: 'Wallet', icon: '₿' },
    { id: 'tip', label: 'Tip Me', icon: '⚡' },
  ]

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="fixed top-[5%] left-1/2 -translate-x-1/2 z-[151] w-[640px] max-w-[calc(100vw-2rem)] max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-border/40 bg-card flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40 bg-gradient-to-r from-accent/10 via-card to-primary/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-accent-foreground text-lg shadow-lg">
            ₿
          </div>
          <div className="flex-1">
            <h2 className="font-heading text-base font-bold">Crypto Dashboard</h2>
            <p className="text-[10px] text-muted-foreground font-mono">live markets · mempool · sentiment</p>
          </div>
          <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors text-lg">✕</button>
        </div>

        {/* Live ticker */}
        <LiveTicker fallback={btcPrice} />

        {/* Tabs */}
        <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border/30 bg-background overflow-x-auto scrollbar-hide">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all ${
                tab === t.id ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'markets' && (
            <div>
              {marketsLoading && markets.length === 0 && <div className="text-center py-12 text-sm text-muted-foreground">loading markets…</div>}
              <div className="space-y-2">
                {markets.map(m => {
                  const change = m.price_change_percentage_24h_in_currency ?? m.price_change_percentage_24h ?? 0
                  const up = change >= 0
                  const meta = COINS.find(c => c.id === m.id)
                  return (
                    <a key={m.id} href={`https://www.coingecko.com/en/coins/${m.id}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/40 border border-border/30 hover:border-accent/40 transition-all group">
                      <img src={m.image} alt="" className="w-9 h-9 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-sm">{m.symbol.toUpperCase()}</span>
                          <span className="text-[10px] text-muted-foreground truncate">{m.name}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">mcap {fmtUSD(m.market_cap)}</div>
                      </div>
                      <div className="hidden sm:block opacity-60 group-hover:opacity-100 transition-opacity">
                        <Sparkline data={m.sparkline_in_7d?.price} color={up ? '#22c55e' : '#ef4444'} />
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-mono text-sm font-bold">{fmtUSD(m.current_price)}</div>
                        <div className={`text-[11px] font-mono font-semibold ${up ? 'text-green-500' : 'text-red-500'}`}>
                          {up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
              <p className="text-[9px] text-muted-foreground/60 text-center mt-3 font-mono">data · coingecko · 7d sparkline</p>
            </div>
          )}

          {tab === 'sentiment' && (
            <div className="py-4">
              {!fng && <div className="text-center py-12 text-sm text-muted-foreground">loading sentiment…</div>}
              {fng && (
                <>
                  <FearGreedGauge value={fng.value} label={fng.label} />
                  <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">scale</p>
                      <p className="text-xs font-mono">0–100</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">updated</p>
                      <p className="text-xs font-mono">{new Date(fng.ts).toLocaleDateString()}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">source</p>
                      <p className="text-xs font-mono">alternative.me</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-5 leading-relaxed text-center">
                    Market sentiment from social media, volatility, dominance, volume & trends.
                    Extreme fear = potential buying opportunity. Extreme greed = market may be due correction.
                  </p>
                </>
              )}
            </div>
          )}

          {tab === 'network' && (
            <div className="space-y-4">
              {tipHeight == null && <div className="text-center py-12 text-sm text-muted-foreground">loading mempool…</div>}
              {tipHeight != null && (
                <>
                  {/* Halving countdown */}
                  {halving && (
                    <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/30">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-[10px] text-accent uppercase tracking-widest font-bold">⏳ Next Halving</p>
                          <p className="text-xl font-bold font-mono mt-0.5">~{halving.days} days</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground font-mono">block {HALVING_BLOCK.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{halving.remaining.toLocaleString()} blocks left</p>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-accent to-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, halving.progress))}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground/70 font-mono mt-2">est. {halving.eta.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · block reward 3.125 → 1.5625 BTC</p>
                    </div>
                  )}

                  {/* Mempool stats grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Tip Height</p>
                      <p className="text-base font-bold font-mono">#{fmtNum(tipHeight)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Unconfirmed Tx</p>
                      <p className="text-base font-bold font-mono">{fmtNum(mempool?.count)}</p>
                    </div>
                    {hashrate != null && (
                      <div className="p-3 rounded-xl bg-muted/20 border border-border/30 col-span-2">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Network Hashrate</p>
                        <p className="text-base font-bold font-mono">{(hashrate / 1e18).toFixed(2)} EH/s</p>
                      </div>
                    )}
                  </div>

                  {/* Fee tiers */}
                  {fees && (
                    <div className="p-4 rounded-xl bg-muted/20 border border-border/30">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-3">⚡ Recommended Fees (sat/vB)</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { k: 'Slow', v: fees.economyFee || fees.hourFee, c: 'text-green-500' },
                          { k: 'Avg', v: fees.halfHourFee, c: 'text-yellow-500' },
                          { k: 'Fast', v: fees.fastestFee, c: 'text-red-500' },
                        ].map(t => (
                          <div key={t.k} className="text-center p-2 rounded-lg bg-card border border-border/30">
                            <p className="text-[9px] text-muted-foreground uppercase mb-1">{t.k}</p>
                            <p className={`text-lg font-bold font-mono ${t.c}`}>{t.v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-[9px] text-muted-foreground/60 text-center font-mono">data · mempool.space</p>
                </>
              )}
            </div>
          )}

          {tab === 'wallet' && (
            <div className="space-y-4">
              {!wallet && <div className="text-center py-12 text-sm text-muted-foreground">loading wallet…</div>}
              {wallet && (
                <>
                  <div className="p-5 rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 border border-accent/20 text-center">
                    <p className="text-[10px] text-accent font-mono uppercase tracking-widest mb-1">my wallet</p>
                    <p className="text-3xl font-bold font-mono">${((wallet.final_balance / 1e8) * (btcPrice || 0)).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{(wallet.final_balance / 1e8).toFixed(8)} BTC</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">txns</p>
                      <p className="text-sm font-bold font-mono">{wallet.n_tx || 0}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">total in</p>
                      <p className="text-sm font-bold font-mono">{((wallet.total_received || 0) / 1e8).toFixed(4)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/30">
                      <p className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">total out</p>
                      <p className="text-sm font-bold font-mono">{((wallet.total_sent || 0) / 1e8).toFixed(4)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(BTC_ADDR); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs font-mono hover:bg-muted/50 transition-all"
                  >
                    <span className="truncate text-muted-foreground">{BTC_ADDR}</span>
                    <span className="text-accent ml-2 flex-shrink-0">{copied ? '✓ copied' : 'copy'}</span>
                  </button>
                  <div className="flex gap-2">
                    <a href={`https://mempool.space/address/${BTC_ADDR}`} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-2 rounded-lg bg-muted/30 border border-border/30 text-xs font-mono hover:bg-muted/50 transition-all">mempool ↗</a>
                    <a href={`https://platform.arkhamintelligence.com/explorer/address/${BTC_ADDR}`} target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-2 rounded-lg bg-accent text-accent-foreground text-xs font-mono hover:opacity-90 transition-all">arkham ↗</a>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'tip' && (
            <div className="space-y-4 text-center">
              <div>
                <p className="text-[10px] text-accent font-mono uppercase tracking-widest">⚡ Tip Jar</p>
                <h3 className="font-heading font-bold text-base mt-1">Send sats my way</h3>
                <p className="text-xs text-muted-foreground mt-1">If something here was useful — coffee in BTC ☕</p>
              </div>
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-2xl shadow-lg">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=0&data=${encodeURIComponent(`bitcoin:${BTC_ADDR}`)}`}
                    alt="BTC QR"
                    className="w-[200px] h-[200px]"
                  />
                </div>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(BTC_ADDR); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs font-mono hover:bg-muted/50 transition-all"
              >
                <span className="truncate text-muted-foreground">{BTC_ADDR}</span>
                <span className="text-accent ml-2 flex-shrink-0">{copied ? '✓ copied' : 'copy'}</span>
              </button>
              <div className="grid grid-cols-3 gap-2 pt-2">
                {[1000, 5000, 21000].map(sat => (
                  <a key={sat} href={`bitcoin:${BTC_ADDR}?amount=${(sat / 1e8).toFixed(8)}`}
                    className="p-3 rounded-xl bg-muted/20 hover:bg-accent/10 border border-border/30 hover:border-accent/40 transition-all">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">tip</p>
                    <p className="text-sm font-bold font-mono mt-0.5">{sat.toLocaleString()} sats</p>
                  </a>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/60 font-mono">tap a button on mobile to open your BTC wallet</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2 border-t border-border/40 bg-background flex items-center justify-between text-[10px] text-muted-foreground font-mono">
          <span>esc to close</span>
          <span>data · coingecko · mempool.space · alternative.me</span>
        </div>
      </div>
    </>
  )
}
