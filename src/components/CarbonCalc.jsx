import React, { useState, useEffect } from 'react'

// Average page size stats (HTTP Archive 2024)
const AVG_PAGE_KB = 2400
const ENERGY_PER_GB = 0.81 // kWh per GB transferred (Shift Project)
const CO2_PER_KWH = 0.442 // kg CO2 per kWh (global avg grid intensity)
const TREES_PER_KG_CO2_YEAR = 21.77 // kg CO2 absorbed per tree per year

function gradeCarbon(grams) {
  if (grams < 0.2) return { grade: 'A+', color: 'text-green-400', bg: 'bg-green-500', msg: 'Cleaner than 95% of websites' }
  if (grams < 0.5) return { grade: 'A', color: 'text-green-400', bg: 'bg-green-500', msg: 'Cleaner than 80% of websites' }
  if (grams < 1.0) return { grade: 'B', color: 'text-emerald-400', bg: 'bg-emerald-500', msg: 'Better than average' }
  if (grams < 1.5) return { grade: 'C', color: 'text-yellow-400', bg: 'bg-yellow-500', msg: 'About average' }
  if (grams < 2.5) return { grade: 'D', color: 'text-orange-400', bg: 'bg-orange-500', msg: 'Dirtier than average' }
  return { grade: 'F', color: 'text-red-400', bg: 'bg-red-500', msg: 'Very carbon heavy' }
}

export default function CarbonCalc() {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const handler = () => setOpen(o => !o)
    window.addEventListener('toggle-carbon-calc', handler)
    return () => window.removeEventListener('toggle-carbon-calc', handler)
  }, [])

  const analyze = async () => {
    if (!url.trim()) return
    setLoading(true)
    setResult(null)
    setError(null)

    let cleanUrl = url.trim()
    if (!cleanUrl.startsWith('http')) cleanUrl = 'https://' + cleanUrl

    try {
      // Use Website Carbon API
      const hostname = new URL(cleanUrl).hostname
      const res = await fetch(`https://api.websitecarbon.com/site?url=${encodeURIComponent(cleanUrl)}`)

      if (res.ok) {
        const data = await res.json()
        if (data.cleanerThan !== undefined) {
          const grams = data.statistics?.co2?.grid?.grams || 0
          const energy = data.statistics?.energy || 0
          const bytes = data.bytes || 0
          const green = data.green || false

          setResult({
            url: hostname,
            co2Grams: grams,
            cleanerThan: Math.round((data.cleanerThan || 0) * 100),
            energy: energy,
            sizeKB: Math.round(bytes / 1024),
            green,
            grade: gradeCarbon(grams),
            yearlyKg: ((grams / 1000) * 10000).toFixed(2), // 10k monthly views
            trees: Math.ceil(((grams / 1000) * 10000 * 12) / TREES_PER_KG_CO2_YEAR),
          })
        } else {
          throw new Error('No data')
        }
      } else {
        // Fallback: estimate from page size
        throw new Error('API error')
      }
    } catch {
      // Fallback estimation based on URL fetch
      try {
        // Estimate using typical page weights
        const sizeKB = url.includes('kranthikiran.com') ? 680 : AVG_PAGE_KB
        const sizeGB = sizeKB / (1024 * 1024)
        const energy = sizeGB * ENERGY_PER_GB
        const co2Grams = energy * CO2_PER_KWH * 1000

        setResult({
          url: new URL(url.startsWith('http') ? url : 'https://' + url).hostname,
          co2Grams: parseFloat(co2Grams.toFixed(2)),
          cleanerThan: co2Grams < 1.0 ? 70 : co2Grams < 1.5 ? 50 : 30,
          energy,
          sizeKB,
          green: false,
          grade: gradeCarbon(co2Grams),
          yearlyKg: ((co2Grams / 1000) * 10000).toFixed(2),
          trees: Math.ceil(((co2Grams / 1000) * 10000 * 12) / TREES_PER_KG_CO2_YEAR),
          estimated: true,
        })
      } catch {
        setError('Could not analyze this URL. Check the format.')
      }
    }
    setLoading(false)
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-md" onClick={() => setOpen(false)} />
      <div className="fixed top-[5%] left-1/2 -translate-x-1/2 z-[151] w-[480px] max-w-[calc(100vw-2rem)] max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
        style={{ background: 'rgba(18,18,24,0.95)', animation: 'carbon-in 0.25s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white text-base font-semibold">🌍 Website Carbon Calculator</h2>
            <p className="text-[11px] text-white/30 mt-0.5">How much CO₂ does a website produce per visit?</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex gap-2">
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && analyze()}
              placeholder="Enter a website URL..."
              className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 outline-none focus:border-white/20"
            />
            <button onClick={analyze} disabled={loading || !url.trim()}
              className="px-4 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-40">
              {loading ? '...' : '🔍 Scan'}
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className="text-[10px] text-white/20">Try:</span>
            {['kranthikiran.com', 'google.com', 'github.com', 'amazon.com'].map(s => (
              <button key={s} onClick={() => setUrl(s)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">
          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="text-4xl">🌱</span>
              <p className="text-sm text-white/20">Enter a URL to calculate its carbon footprint</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-6 h-6 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
              <p className="text-sm text-white/30">Analyzing carbon footprint...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <span className="text-2xl">⚠️</span>
              <p className="text-sm text-white/40 mt-2">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Grade */}
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl ${result.grade.bg}/20 mb-2`}>
                  <span className={`text-4xl font-bold ${result.grade.color}`}>{result.grade.grade}</span>
                </div>
                <p className="text-sm text-white/70 font-medium">{result.url}</p>
                <p className={`text-xs ${result.grade.color} mt-1`}>{result.grade.msg}</p>
                {result.estimated && (
                  <p className="text-[10px] text-white/20 mt-1">* Estimated based on typical page sizes</p>
                )}
              </div>

              {/* CO2 stat */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-white font-mono">{result.co2Grams}g</p>
                <p className="text-xs text-white/40 mt-1">CO₂ per page visit</p>
                <div className="w-full bg-white/5 rounded-full h-2 mt-3 overflow-hidden">
                  <div className={`h-full rounded-full ${result.grade.bg}`} style={{ width: `${result.cleanerThan}%`, transition: 'width 1s ease-out' }} />
                </div>
                <p className="text-[10px] text-white/30 mt-1.5">Cleaner than {result.cleanerThan}% of websites tested</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2">
                <StatCard label="Page Size" value={`${result.sizeKB} KB`} icon="📦" />
                <StatCard label="Green Hosting" value={result.green ? '✅ Yes' : '❌ No'} icon="⚡" />
                <StatCard label="Yearly CO₂" value={`${result.yearlyKg} kg`} sub="@ 10k views/mo" icon="📊" />
                <StatCard label="Trees Needed" value={`${result.trees} 🌳`} sub="to offset yearly" icon="🌲" />
              </div>

              {/* Fun comparisons */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <p className="text-[11px] text-white/30 font-semibold mb-2 uppercase tracking-wider">Equivalent to...</p>
                <div className="space-y-1.5 text-xs text-white/50">
                  <p>☕ {(result.co2Grams * 10000 / 21).toFixed(0)} cups of tea per year (10k views)</p>
                  <p>🚗 {(result.yearlyKg * 12 / 0.21).toFixed(0)} km driven in a car per year</p>
                  <p>💡 {(result.yearlyKg * 12 / 0.042).toFixed(0)} hours of a lightbulb per year</p>
                  <p>📱 {(result.co2Grams * 10000 / 8).toFixed(0)} smartphone charges per year</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 border-t border-white/5 text-center flex-shrink-0">
          <span className="text-[10px] text-white/20">Data from Website Carbon API · Methodology by The Shift Project</span>
        </div>
      </div>

      <style>{`
        @keyframes carbon-in {
          from { opacity: 0; transform: translateX(-50%) scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
      <p className="text-[10px] text-white/30 mb-1">{icon} {label}</p>
      <p className="text-sm font-bold text-white font-mono">{value}</p>
      {sub && <p className="text-[9px] text-white/20 mt-0.5">{sub}</p>}
    </div>
  )
}
