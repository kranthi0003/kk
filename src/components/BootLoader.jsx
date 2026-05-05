import React, { useState, useEffect, useRef } from 'react'

const BOOT_SEQUENCE = [
  { text: 'KRANTHI BIOS v4.2.1 (c) 2021-2026', delay: 0, color: '#fff' },
  { text: 'Initializing system...', delay: 400, color: '#aaa' },
  { text: '', delay: 600 },
  { text: 'CPU: Kranthi Kiran @ 4+ GHz (Cloud-Optimized)', delay: 800, color: '#0f0' },
  { text: 'RAM: Mass amounts of masala chai loaded', delay: 1100, color: '#0f0' },
  { text: 'GPU: Satellite imagery renderer v3.0', delay: 1400, color: '#0f0' },
  { text: '', delay: 1600 },
  { text: 'Detecting drives...', delay: 1800, color: '#aaa' },
  { text: '  C:\\ GitHub      [SE-III]        ████████ OK', delay: 2100, color: '#0f0' },
  { text: '  D:\\ Couchbase   [SE-II]         ████████ OK', delay: 2300, color: '#0f0' },
  { text: '  E:\\ Groww       [PSE-II]        ████████ OK', delay: 2500, color: '#0f0' },
  { text: '  F:\\ Amazon      [Cloud Eng]     ████████ OK', delay: 2700, color: '#0f0' },
  { text: '', delay: 2900 },
  { text: 'Loading skills into memory...', delay: 3100, color: '#aaa' },
  { text: '  Python ✓  Java ✓  Ruby ✓  Bash ✓  Docker ✓  K8s ✓', delay: 3400, color: '#ff0' },
  { text: '  AWS ✓  Azure ✓  Terraform ✓  Prometheus ✓  Grafana ✓', delay: 3600, color: '#ff0' },
  { text: '', delay: 3800 },
  { text: 'Establishing connections...', delay: 4000, color: '#aaa' },
  { text: '  GitHub.com      ✓ authenticated', delay: 4200, color: '#0f0' },
  { text: '  LinkedIn        ✓ 500+ connections', delay: 4400, color: '#0f0' },
  { text: '  Bitcoin Network ✓ wallet synced', delay: 4600, color: '#f90' },
  { text: '', delay: 4800 },
  { text: 'All systems operational. Starting portfolio...', delay: 5000, color: '#fff' },
  { text: '', delay: 5200 },
]

export default function BootLoader({ onComplete }) {
  const [lines, setLines] = useState([])
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('boot') // boot → loading → done
  const containerRef = useRef()
  const skipRef = useRef(false)

  useEffect(() => {
    // Skip if already seen this session
    if (sessionStorage.getItem('boot_seen')) {
      onComplete()
      return
    }

    const timers = BOOT_SEQUENCE.map((line, i) =>
      setTimeout(() => {
        if (skipRef.current) return
        setLines(prev => [...prev, line])
      }, line.delay)
    )

    // Progress bar
    const progTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(progTimer); return 100 }
        return prev + 2
      })
    }, 100)

    // Switch to loading bar phase
    const loadTimer = setTimeout(() => {
      if (!skipRef.current) setPhase('loading')
    }, 5400)

    // Complete
    const doneTimer = setTimeout(() => {
      if (!skipRef.current) {
        setPhase('done')
        sessionStorage.setItem('boot_seen', '1')
        setTimeout(() => onComplete(), 600)
      }
    }, 6200)

    return () => {
      timers.forEach(clearTimeout)
      clearInterval(progTimer)
      clearTimeout(loadTimer)
      clearTimeout(doneTimer)
    }
  }, [onComplete])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [lines])

  const handleSkip = () => {
    skipRef.current = true
    sessionStorage.setItem('boot_seen', '1')
    onComplete()
  }

  if (phase === 'done') return null

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{
        background: '#0a0a0a',
        fontFamily: '"JetBrains Mono", "Courier New", monospace',
        imageRendering: 'pixelated',
      }}
    >
      {/* CRT scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)',
        }}
      />
      {/* CRT flicker */}
      <div className="absolute inset-0 pointer-events-none z-10 animate-pulse opacity-[0.02] bg-white" />

      {/* Terminal content */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-8 pb-20"
      >
        {lines.map((line, i) => (
          <div
            key={i}
            className="text-xs sm:text-sm leading-relaxed"
            style={{ color: line.color || '#aaa' }}
          >
            {line.text || '\u00A0'}
          </div>
        ))}

        {phase === 'loading' && (
          <div className="mt-4">
            <div className="text-white text-xs sm:text-sm mb-2">
              Loading kranthikiran.com...
            </div>
            <div className="w-full max-w-md h-4 border border-green-500/50 rounded-sm overflow-hidden">
              <div
                className="h-full transition-all duration-100"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #0f0, #0a0)',
                  boxShadow: '0 0 10px #0f0',
                }}
              />
            </div>
            <div className="text-green-400 text-[10px] mt-1 font-mono">{progress}%</div>
          </div>
        )}
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute bottom-6 right-6 text-[11px] text-gray-600 hover:text-gray-400 font-mono transition-colors z-20"
      >
        press to skip →
      </button>
    </div>
  )
}
