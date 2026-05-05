import React, { useState, useEffect, useRef } from 'react'

const BOOT_SEQUENCE = [
  { text: '[    0.000000] Linux version 6.8.0-kranthi (gcc 13.2.0) #1 SMP PREEMPT', delay: 0, color: '#fff' },
  { text: '[    0.000000] Command line: BOOT_IMAGE=/vmlinuz root=/dev/sda1', delay: 200, color: '#aaa' },
  { text: '[    0.012451] BIOS-provided physical RAM map:', delay: 400, color: '#aaa' },
  { text: '[    0.012455]  BIOS-e820: [mem 0x0000000000000000-0x000000000009ffff] usable', delay: 500, color: '#aaa' },
  { text: '[    0.034221] CPU: Intel(R) Cloud Engineer @ 4.0GHz', delay: 700, color: '#fff' },
  { text: '[    0.034225] x86/fpu: Supporting XSAVE feature', delay: 800, color: '#aaa' },
  { text: '[    0.089102] Memory: 16384MB available', delay: 1000, color: '#fff' },
  { text: '', delay: 1200 },
  { text: '  * Starting system services...', delay: 1400, color: '#0f0' },
  { text: '  [ OK ] Started networking.service', delay: 1700, color: '#0f0' },
  { text: '  [ OK ] Started sshd.service', delay: 1900, color: '#0f0' },
  { text: '  [ OK ] Started docker.service', delay: 2100, color: '#0f0' },
  { text: '  [ OK ] Started kubelet.service', delay: 2300, color: '#0f0' },
  { text: '', delay: 2500 },
  { text: '  * Mounting drives...', delay: 2600, color: '#f90' },
  { text: '  /dev/sda1  /github       ext4  [SE-III]          mounted', delay: 2800, color: '#aaa' },
  { text: '  /dev/sda2  /couchbase    ext4  [SE-II]           mounted', delay: 3000, color: '#aaa' },
  { text: '  /dev/sda3  /groww        ext4  [PSE-II]          mounted', delay: 3200, color: '#aaa' },
  { text: '  /dev/sda4  /amazon       ext4  [Cloud Eng]       mounted', delay: 3400, color: '#aaa' },
  { text: '', delay: 3600 },
  { text: '  * Loading modules...', delay: 3700, color: '#f90' },
  { text: '  [mod] python java ruby bash docker k8s terraform aws', delay: 3900, color: '#aaa' },
  { text: '  [mod] postgresql couchbase redis prometheus grafana', delay: 4100, color: '#aaa' },
  { text: '', delay: 4300 },
  { text: '  * Establishing connections...', delay: 4400, color: '#f90' },
  { text: '  [net] github.com           authenticated ✓', delay: 4600, color: '#0f0' },
  { text: '  [net] linkedin.com         connected ✓', delay: 4800, color: '#0f0' },
  { text: '  [net] bitcoin mainnet      wallet synced ✓', delay: 5000, color: '#0f0' },
  { text: '', delay: 5200 },
  { text: 'kranthi@portfolio:~$ ./start.sh', delay: 5400, color: '#fff' },
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
    }, 5600)

    // Complete
    const doneTimer = setTimeout(() => {
      if (!skipRef.current) {
        setPhase('done')
        sessionStorage.setItem('boot_seen', '1')
        setTimeout(() => onComplete(), 600)
      }
    }, 6800)

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
        background: '#2c001e',
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
            <div className="w-full max-w-md h-4 border border-orange-500/50 rounded-sm overflow-hidden">
              <div
                className="h-full transition-all duration-100"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #e95420, #c34113)',
                  boxShadow: '0 0 10px #e95420',
                }}
              />
            </div>
            <div className="text-orange-400 text-[10px] mt-1 font-mono">{progress}%</div>
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
