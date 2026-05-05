import React, { useState, useEffect } from 'react'

function getMetrics() {
  const perf = performance.getEntriesByType('navigation')[0] || {}
  const fcp = performance.getEntriesByType('paint').find(e => e.name === 'first-contentful-paint')
  const resources = performance.getEntriesByType('resource')
  const totalKB = Math.round(resources.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024)
  const jsFiles = resources.filter(r => r.initiatorType === 'script')
  const cssFiles = resources.filter(r => r.initiatorType === 'link' || r.name?.endsWith('.css'))
  const imgFiles = resources.filter(r => r.initiatorType === 'img')
  const mem = performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null

  return {
    fcp: fcp ? Math.round(fcp.startTime) : null,
    domReady: Math.round(perf.domContentLoadedEventEnd - perf.startTime) || null,
    fullLoad: Math.round(perf.loadEventEnd - perf.startTime) || null,
    ttfb: Math.round(perf.responseStart - perf.startTime) || null,
    resources: resources.length,
    totalKB,
    jsCount: jsFiles.length,
    jsKB: Math.round(jsFiles.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024),
    cssCount: cssFiles.length,
    imgCount: imgFiles.length,
    memMB: mem,
  }
}

function grade(fcp) {
  if (!fcp) return { label: '—', color: 'text-muted-foreground' }
  if (fcp < 1000) return { label: 'A+', color: 'text-green-500' }
  if (fcp < 1800) return { label: 'A', color: 'text-green-400' }
  if (fcp < 2500) return { label: 'B', color: 'text-yellow-400' }
  if (fcp < 4000) return { label: 'C', color: 'text-orange-400' }
  return { label: 'D', color: 'text-red-400' }
}

function Bar({ label, value, max, unit, color }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-white/40 w-20 text-right font-mono">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, transition: 'width 0.8s ease-out' }} />
      </div>
      <span className="text-[12px] text-white/70 w-16 font-mono">{value}{unit}</span>
    </div>
  )
}

export default function SpeedTest() {
  const [open, setOpen] = useState(false)
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    const handler = () => setOpen(o => !o)
    window.addEventListener('toggle-speed-test', handler)
    return () => window.removeEventListener('toggle-speed-test', handler)
  }, [])

  useEffect(() => {
    if (open) setMetrics(getMetrics())
  }, [open])

  if (!open || !metrics) return null

  const g = grade(metrics.fcp)

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-md" onClick={() => setOpen(false)} />
      <div className="fixed top-[12%] left-1/2 -translate-x-1/2 z-[151] w-[420px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        style={{ background: 'rgba(18,18,24,0.95)', animation: 'spotlight-in 0.2s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header with grade */}
        <div className="px-6 py-5 text-center border-b border-white/5">
          <div className={`text-5xl font-bold ${g.color} mb-1`}>{g.label}</div>
          <p className="text-xs text-white/30">Performance Grade</p>
        </div>

        {/* Metrics bars */}
        <div className="px-6 py-5 space-y-3">
          <Bar label="FCP" value={metrics.fcp || 0} max={3000} unit="ms" color="bg-green-500" />
          <Bar label="TTFB" value={metrics.ttfb || 0} max={1000} unit="ms" color="bg-blue-500" />
          <Bar label="DOM Ready" value={metrics.domReady || 0} max={3000} unit="ms" color="bg-cyan-500" />
          <Bar label="Full Load" value={metrics.fullLoad || 0} max={5000} unit="ms" color="bg-purple-500" />
          <Bar label="Transfer" value={metrics.totalKB} max={2000} unit="KB" color="bg-amber-500" />
        </div>

        {/* Stats grid */}
        <div className="px-6 pb-5 grid grid-cols-3 gap-3">
          <StatBox label="Resources" value={metrics.resources} />
          <StatBox label="JS Files" value={`${metrics.jsCount} (${metrics.jsKB}KB)`} />
          <StatBox label="Images" value={metrics.imgCount} />
          <StatBox label="CSS Files" value={metrics.cssCount} />
          <StatBox label="Heap" value={metrics.memMB ? `${metrics.memMB}MB` : '—'} />
          <StatBox label="Total Size" value={`${metrics.totalKB}KB`} />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[10px] text-white/20 font-mono">Performance API</span>
          <button onClick={() => setOpen(false)} className="text-[11px] text-white/30 hover:text-white/60 transition-colors">Close</button>
        </div>
      </div>
      <style>{`
        @keyframes spotlight-in {
          from { opacity: 0; transform: translateX(-50%) scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2 text-center">
      <p className="text-[13px] font-mono text-white/70">{value}</p>
      <p className="text-[9px] text-white/25 uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}
