import React, { useState, useEffect, useRef } from 'react'

function getSystemInfo() {
  const nav = navigator
  const ua = nav.userAgent
  const mem = nav.deviceMemory || '?'
  const cores = nav.hardwareConcurrency || '?'
  const platform = nav.platform || 'Unknown'
  const lang = nav.language || 'en'
  const online = nav.onLine ? 'connected' : 'offline'
  const connection = nav.connection || {}
  const downlink = connection.downlink ? `${connection.downlink} Mbps` : 'unknown'
  const effectiveType = connection.effectiveType || 'unknown'
  const screen = window.screen
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
  const touch = 'ontouchstart' in window ? 'yes' : 'no'
  const gpu = (() => {
    try {
      const c = document.createElement('canvas')
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl')
      if (!gl) return 'Unknown'
      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'WebGL supported'
    } catch { return 'Unknown' }
  })()

  // Detect browser
  let browser = 'Unknown'
  if (ua.includes('Firefox/')) browser = 'Firefox ' + ua.split('Firefox/')[1].split(' ')[0]
  else if (ua.includes('Edg/')) browser = 'Edge ' + ua.split('Edg/')[1].split(' ')[0]
  else if (ua.includes('Chrome/')) browser = 'Chrome ' + ua.split('Chrome/')[1].split(' ')[0]
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari ' + (ua.split('Version/')[1]?.split(' ')[0] || '')

  // Detect OS
  let os = platform
  if (ua.includes('Mac OS X')) os = 'macOS ' + (ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/)?.[1]?.replace(/_/g, '.') || '')
  else if (ua.includes('Windows NT')) os = 'Windows ' + ({ '10.0': '10/11', '6.3': '8.1', '6.2': '8', '6.1': '7' }[ua.match(/Windows NT (\d+\.\d+)/)?.[1]] || '')
  else if (ua.includes('Android')) os = 'Android ' + (ua.match(/Android (\d+\.?\d*)/)?.[1] || '')
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS ' + (ua.match(/OS (\d+_\d+)/)?.[1]?.replace('_', '.') || '')
  else if (ua.includes('Linux')) os = 'Linux'

  return { browser, os, cores, mem, gpu, screen, lang, tz, online, downlink, effectiveType, touch }
}

function buildBootSequence() {
  const sys = getSystemInfo()
  return [
    { text: `[    0.000000] Linux version 6.8.0-kranthi (gcc 13.2.0) #1 SMP PREEMPT`, delay: 0, color: '#fff' },
    { text: `[    0.000000] Command line: BOOT_IMAGE=/vmlinuz root=/dev/sda1`, delay: 200, color: '#aaa' },
    { text: `[    0.012451] BIOS-provided physical RAM map:`, delay: 400, color: '#aaa' },
    { text: `[    0.034221] CPU: ${sys.cores} cores detected`, delay: 600, color: '#fff' },
    { text: `[    0.034225] Memory: ${sys.mem !== '?' ? sys.mem + ' GB' : 'detected'} available`, delay: 800, color: '#fff' },
    { text: `[    0.041102] GPU: ${sys.gpu}`, delay: 1000, color: '#fff' },
    { text: `[    0.058330] OS: ${sys.os}`, delay: 1200, color: '#fff' },
    { text: `[    0.058335] Browser: ${sys.browser}`, delay: 1400, color: '#fff' },
    { text: '', delay: 1600 },
    { text: `  * Detecting environment...`, delay: 1700, color: '#f90' },
    { text: `  [ OK ] Display: ${sys.screen.width}×${sys.screen.height} @ ${window.devicePixelRatio || 1}x`, delay: 1900, color: '#0f0' },
    { text: `  [ OK ] Locale: ${sys.lang} • Timezone: ${sys.tz}`, delay: 2100, color: '#0f0' },
    { text: `  [ OK ] Network: ${sys.online} • ${sys.effectiveType} (${sys.downlink})`, delay: 2300, color: '#0f0' },
    { text: `  [ OK ] Touch: ${sys.touch === 'yes' ? 'touchscreen detected' : 'pointer device'}`, delay: 2500, color: '#0f0' },
    { text: '', delay: 2700 },
    { text: `  * Starting services...`, delay: 2800, color: '#f90' },
    { text: `  [ OK ] Started docker.service`, delay: 3000, color: '#0f0' },
    { text: `  [ OK ] Started kubelet.service`, delay: 3200, color: '#0f0' },
    { text: `  [ OK ] Started sshd.service`, delay: 3400, color: '#0f0' },
    { text: '', delay: 3500 },
    { text: `  * Mounting experience...`, delay: 3600, color: '#f90' },
    { text: `  /dev/sda1  /github       ext4  [SE-III]          mounted`, delay: 3800, color: '#aaa' },
    { text: `  /dev/sda2  /couchbase    ext4  [SE-II]           mounted`, delay: 4000, color: '#aaa' },
    { text: `  /dev/sda3  /groww        ext4  [PSE-II]          mounted`, delay: 4200, color: '#aaa' },
    { text: `  /dev/sda4  /amazon       ext4  [Cloud Eng]       mounted`, delay: 4400, color: '#aaa' },
    { text: '', delay: 4600 },
    { text: `  * Loading modules...`, delay: 4700, color: '#f90' },
    { text: `  [mod] python java ruby bash docker k8s terraform aws`, delay: 4900, color: '#aaa' },
    { text: '', delay: 5100 },
    { text: `kranthi@portfolio:~$ ./start.sh`, delay: 5300, color: '#fff' },
  ]
}

export default function BootLoader({ onComplete }) {
  const [lines, setLines] = useState([])
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('boot') // boot → loading → done
  const containerRef = useRef()
  const skipRef = useRef(false)

  useEffect(() => {
    if (sessionStorage.getItem('boot_seen')) {
      onComplete()
      return
    }

    const BOOT_SEQUENCE = buildBootSequence()

    const timers = BOOT_SEQUENCE.map((line, i) =>
      setTimeout(() => {
        if (skipRef.current) return
        setLines(prev => [...prev, line])
      }, line.delay)
    )

    // After text finishes, switch to loading phase and start progress from 0
    const loadTimer = setTimeout(() => {
      if (!skipRef.current) {
        setPhase('loading')
        setProgress(0)
      }
    }, 5600)

    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(loadTimer)
    }
  }, [onComplete])

  // Progress bar runs only during loading phase
  useEffect(() => {
    if (phase !== 'loading') return
    const progTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progTimer)
          sessionStorage.setItem('boot_seen', '1')
          setTimeout(() => onComplete(), 400)
          return 100
        }
        return prev + 4
      })
    }, 50)
    return () => clearInterval(progTimer)
  }, [phase, onComplete])

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
      }}
    >
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
