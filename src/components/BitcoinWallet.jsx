import React, { useState, useEffect } from 'react'

const ADDR = 'bc1quaunu4xa0jgeh446jlx2mchlv4gda9tj0dqz9e'
const SHORT = ADDR.slice(0, 6) + '···' + ADDR.slice(-4)
const ARKHAM_URL = `https://platform.arkhamintelligence.com/explorer/address/${ADDR}`
const MEMPOOL_URL = `https://mempool.space/address/${ADDR}`

export default function BitcoinWallet() {
  const [data, setData] = useState(null)
  const [btcPrice, setBtcPrice] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const cached = sessionStorage.getItem('btc_wallet')
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.ts < 300000) {
        setData(parsed.data)
        setBtcPrice(parsed.price)
        return
      }
    }

    Promise.all([
      fetch(`https://blockchain.info/rawaddr/${ADDR}?limit=0&cors=true`).then(r => r.json()),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd').then(r => r.json()),
    ]).then(([wallet, price]) => {
      setData(wallet)
      setBtcPrice(price.bitcoin.usd)
      sessionStorage.setItem('btc_wallet', JSON.stringify({ data: wallet, price: price.bitcoin.usd, ts: Date.now() }))
    }).catch(() => {
      setData({ final_balance: 2697427, n_tx: 8, total_received: 2697427 })
      setBtcPrice(97000)
    })
  }, [])

  const balanceBTC = data ? (data.final_balance / 1e8).toFixed(8) : '···'
  const balanceUSD = data && btcPrice ? ((data.final_balance / 1e8) * btcPrice).toFixed(2) : '···'
  const txCount = data?.n_tx || '···'

  const handleCopy = () => {
    navigator.clipboard.writeText(ADDR)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="lg:col-span-2 rounded-2xl border border-border/20 shadow-lg overflow-hidden min-h-[350px] sm:h-[420px] flex flex-col bg-card relative">
      {/* Phantom-style gradient glow at top */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-accent/10 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative px-5 pt-5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-accent/20">
            <span className="text-accent-foreground text-sm font-bold">₿</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Bitcoin</p>
            <p className="text-[10px] text-muted-foreground font-mono">BTC · Native SegWit</p>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/50 hover:bg-muted text-[10px] font-mono text-muted-foreground hover:text-foreground transition-all"
        >
          {copied ? '✓' : SHORT}
        </button>
      </div>

      {/* Balance — centered, Phantom-style */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-5 -mt-2">
        <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-2">Total Balance</p>
        <p className="text-3xl sm:text-4xl font-bold font-mono text-foreground tracking-tight">
          ${balanceUSD}
        </p>
        <p className="text-sm text-muted-foreground font-mono mt-1">
          {balanceBTC} <span className="text-accent">BTC</span>
        </p>

        {/* Mini stat pills */}
        <div className="flex gap-2 mt-5">
          <div className="px-3 py-1.5 rounded-full bg-muted/50 border border-border/20">
            <p className="text-[10px] font-mono text-muted-foreground">
              <span className="text-foreground font-semibold">{txCount}</span> txns
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-muted/50 border border-border/20">
            <p className="text-[10px] font-mono text-muted-foreground">
              <span className="text-foreground font-semibold">9</span> UTXOs
            </p>
          </div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="relative px-5 pb-5 flex gap-2">
        <a
          href={MEMPOOL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-muted/50 border border-border/20 text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-border/40 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Activity
        </a>
        <a
          href={ARKHAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-accent text-accent-foreground text-[11px] font-mono font-medium hover:opacity-90 transition-all shadow-md shadow-accent/20"
        >
          View on Arkham ↗
        </a>
      </div>
    </div>
  )
}
