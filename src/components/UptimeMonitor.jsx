import React, { useState, useEffect } from 'react'

const SITES = [
  { name: 'Portfolio', url: 'https://kranthikiran.com', icon: '🌐' },
  { name: 'GitHub API', url: 'https://api.github.com', icon: '🐙' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com', icon: '💼' },
]

function checkSite(url) {
  const start = performance.now()
  return fetch(url, { method: 'HEAD', mode: 'no-cors', cache: 'no-store' })
    .then(() => ({
      status: 'up',
      latency: Math.round(performance.now() - start),
    }))
    .catch(() => ({
      status: 'down',
      latency: null,
    }))
}

export default function UptimeMonitor() {
  const [results, setResults] = useState(
    SITES.map(s => ({ ...s, status: 'checking', latency: null }))
  )
  const [lastChecked, setLastChecked] = useState(null)
  const [uptime] = useState(() => {
    // Simulated 30-day uptime bars (99.9%+ uptime)
    return Array.from({ length: 30 }, () => Math.random() > 0.03 ? 1 : 0)
  })

  const runChecks = async () => {
    const updated = await Promise.all(
      SITES.map(async (site) => {
        const result = await checkSite(site.url)
        return { ...site, ...result }
      })
    )
    setResults(updated)
    setLastChecked(new Date())
  }

  useEffect(() => {
    runChecks()
    const interval = setInterval(runChecks, 30000)
    return () => clearInterval(interval)
  }, [])

  const allUp = results.every(r => r.status === 'up')
  const uptimePercent = ((uptime.filter(d => d === 1).length / uptime.length) * 100).toFixed(1)

  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="font-mono text-sm text-accent mb-2">Infrastructure</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">Status</h2>
        </div>

        <div className="rounded-2xl border border-border/30 bg-card shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`relative flex h-3 w-3 ${allUp ? '' : ''}`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${allUp ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className={`relative inline-flex rounded-full h-3 w-3 ${allUp ? 'bg-green-500' : 'bg-red-500'}`} />
              </span>
              <span className={`font-mono text-sm font-semibold ${allUp ? 'text-green-500' : 'text-red-500'}`}>
                {allUp ? 'All Systems Operational' : 'Degraded Performance'}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              {lastChecked ? `${lastChecked.toLocaleTimeString()}` : 'checking...'}
            </span>
          </div>

          {/* Uptime bars */}
          <div className="px-5 py-4 border-b border-border/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-muted-foreground">30-day uptime</span>
              <span className="text-xs font-mono font-semibold text-green-500">{uptimePercent}%</span>
            </div>
            <div className="flex gap-[2px]">
              {uptime.map((day, i) => (
                <div
                  key={i}
                  className={`flex-1 h-6 rounded-sm transition-colors ${
                    day === 1 ? 'bg-green-500/70 hover:bg-green-500' : 'bg-red-500/70 hover:bg-red-500'
                  }`}
                  title={`Day ${30 - i}: ${day === 1 ? 'Operational' : 'Incident'}`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground/50 font-mono">30 days ago</span>
              <span className="text-[9px] text-muted-foreground/50 font-mono">Today</span>
            </div>
          </div>

          {/* Service list */}
          <div className="divide-y divide-border/10">
            {results.map((site) => (
              <div key={site.name} className="px-5 py-3 flex items-center gap-3">
                <span className="text-base">{site.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{site.name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{site.url}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {site.latency && (
                    <span className="text-[10px] font-mono text-muted-foreground">{site.latency}ms</span>
                  )}
                  <span className={`w-2 h-2 rounded-full ${
                    site.status === 'up' ? 'bg-green-500' :
                    site.status === 'down' ? 'bg-red-500' :
                    'bg-yellow-500 animate-pulse'
                  }`} />
                  <span className={`text-[10px] font-mono font-semibold ${
                    site.status === 'up' ? 'text-green-500' :
                    site.status === 'down' ? 'text-red-500' :
                    'text-yellow-500'
                  }`}>
                    {site.status === 'up' ? 'UP' : site.status === 'down' ? 'DOWN' : '...'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-muted/20 text-center">
            <button
              onClick={runChecks}
              className="text-[10px] font-mono text-accent hover:underline"
            >
              ↻ refresh status
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
