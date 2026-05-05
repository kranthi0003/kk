import React, { useState, useEffect, useRef } from 'react'

function getSystemInfo() {
  const nav = navigator
  const ua = nav.userAgent
  const mem = nav.deviceMemory || null
  const cores = nav.hardwareConcurrency || null
  const lang = nav.language || 'en'
  const online = nav.onLine ? 'online' : 'offline'
  const connection = nav.connection || {}
  const downlink = connection.downlink || null
  const effectiveType = connection.effectiveType || null
  const screen = window.screen
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const touch = 'ontouchstart' in window
  const cookiesEnabled = nav.cookieEnabled
  const doNotTrack = nav.doNotTrack === '1'
  const pdfPlugin = nav.pdfViewerEnabled !== undefined ? nav.pdfViewerEnabled : null
  const webgl = (() => {
    try {
      const c = document.createElement('canvas')
      const gl = c.getContext('webgl2') || c.getContext('webgl')
      if (!gl) return { renderer: null, vendor: null, version: null }
      const ext = gl.getExtension('WEBGL_debug_renderer_info')
      return {
        renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null,
        vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : null,
        version: gl.getParameter(gl.VERSION),
      }
    } catch { return { renderer: null, vendor: null, version: null } }
  })()

  let browser = 'Unknown'
  let browserVersion = ''
  if (ua.includes('Firefox/')) { browser = 'Mozilla Firefox'; browserVersion = ua.split('Firefox/')[1]?.split(' ')[0] }
  else if (ua.includes('Edg/')) { browser = 'Microsoft Edge'; browserVersion = ua.split('Edg/')[1]?.split(' ')[0] }
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) { browser = 'Google Chrome'; browserVersion = ua.split('Chrome/')[1]?.split(' ')[0] }
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) { browser = 'Apple Safari'; browserVersion = ua.split('Version/')[1]?.split(' ')[0] || '' }

  let os = 'Unknown'
  if (ua.includes('Mac OS X')) os = 'macOS ' + (ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/)?.[1]?.replace(/_/g, '.') || '')
  else if (ua.includes('Windows NT')) os = 'Windows ' + ({ '10.0': '10/11', '6.3': '8.1', '6.2': '8' }[ua.match(/Windows NT (\d+\.\d+)/)?.[1]] || '')
  else if (ua.includes('Android')) os = 'Android ' + (ua.match(/Android (\d+\.?\d*)/)?.[1] || '')
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS ' + (ua.match(/OS (\d+_\d+)/)?.[1]?.replace('_', '.') || '')
  else if (ua.includes('Linux')) os = 'Linux'

  return { browser, browserVersion, os, cores, mem, webgl, screen, lang, tz, online, downlink, effectiveType, touch, cookiesEnabled, doNotTrack, pdfPlugin }
}

function buildBootSequence() {
  const s = getSystemInfo()
  const t = (n) => `[    ${n.toFixed(6).padStart(10)}]`

  return [
    { text: `${t(0)} kernel: Linux version 6.8.0 (gcc 13.2.0) #1 SMP PREEMPT_DYNAMIC`, delay: 0 },
    { text: `${t(0.003)} kernel: Command line: BOOT_IMAGE=/vmlinuz root=UUID=kranthikiran`, delay: 150 },
    { text: `${t(0.021)} kernel: DMI: ${s.os}`, delay: 300 },
    { text: `${t(0.021)} kernel: Hypervisor detected: ${s.browser}`, delay: 450 },
    { text: `${t(0.034)} kernel: CPU(s): ${s.cores || 'detecting...'} cores`, delay: 600, bright: true },
    { text: `${t(0.034)} kernel: Memory: ${s.mem ? s.mem + ' GB' : 'available'}`, delay: 750, bright: true },
    ...(s.webgl.vendor ? [{ text: `${t(0.041)} kernel: GPU: ${s.webgl.vendor}`, delay: 900, bright: true }] : []),
    ...(s.webgl.renderer ? [{ text: `${t(0.041)} kernel:      ${s.webgl.renderer}`, delay: 1050 }] : []),
    ...(s.webgl.version ? [{ text: `${t(0.042)} kernel:      ${s.webgl.version}`, delay: 1150 }] : []),
    { text: `${t(0.058)} kernel: Display: ${s.screen.width}×${s.screen.height} @ ${window.devicePixelRatio || 1}x (${s.screen.colorDepth}-bit color)`, delay: 1300, bright: true },
    { text: `${t(0.058)} kernel: Input: ${s.touch ? 'touchscreen' : 'pointer'} device`, delay: 1450 },
    { text: '', delay: 1600 },
    { text: `  * systemd[1]: Starting kranthikiran.com...`, delay: 1700, accent: true },
    { text: `  [ OK ] Detected operating system: ${s.os}`, delay: 1900, ok: true },
    { text: `  [ OK ] Detected browser: ${s.browser} ${s.browserVersion}`, delay: 2100, ok: true },
    { text: `  [ OK ] Locale: ${s.lang} • Timezone: ${s.tz}`, delay: 2300, ok: true },
    { text: `  [ OK ] Network: ${s.online}${s.effectiveType ? ' • ' + s.effectiveType.toUpperCase() : ''}${s.downlink ? ' • ' + s.downlink + ' Mbps' : ''}`, delay: 2500, ok: true },
    { text: `  [ OK ] Cookies: ${s.cookiesEnabled ? 'enabled' : 'disabled'} • DNT: ${s.doNotTrack ? 'on' : 'off'}`, delay: 2700, ok: true },
    { text: '', delay: 2900 },
    { text: `  * systemd[1]: Loading site assets...`, delay: 3000, accent: true },
    { text: `  [ OK ] Started react.service`, delay: 3200, ok: true },
    { text: `  [ OK ] Started tailwind.service`, delay: 3350, ok: true },
    { text: `  [ OK ] Started three-globe.service`, delay: 3500, ok: true },
    { text: `  [ OK ] Started service-worker.service`, delay: 3650, ok: true },
    { text: '', delay: 3800 },
    { text: `  * systemd[1]: Reached target: portfolio ready`, delay: 3900, accent: true },
    { text: '', delay: 4100 },
    { text: `kranthi@portfolio:~$ ./start.sh`, delay: 4200, bright: true },
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
    }, 4400)

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
      className="fixed inset-0 z-[200] flex flex-col bg-background"
      style={{
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
            className={`text-xs sm:text-sm leading-relaxed ${
              line.ok ? 'text-green-500 dark:text-green-400' :
              line.accent ? 'text-accent' :
              line.bright ? 'text-foreground' :
              'text-muted-foreground'
            }`}
          >
            {line.text || '\u00A0'}
          </div>
        ))}

        {phase === 'loading' && (
          <div className="mt-4">
            <div className="text-foreground text-xs sm:text-sm mb-2">
              Loading kranthikiran.com...
            </div>
            <div className="w-full max-w-md h-3 border border-accent/30 rounded-sm overflow-hidden bg-muted/20">
              <div
                className="h-full transition-all duration-100 rounded-sm"
                style={{
                  width: `${progress}%`,
                  background: 'var(--color-accent)',
                  boxShadow: '0 0 8px var(--color-accent)',
                }}
              />
            </div>
            <div className="text-accent text-[10px] mt-1 font-mono">{progress}%</div>
          </div>
        )}
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="absolute bottom-6 right-6 text-[11px] text-muted-foreground/40 hover:text-muted-foreground font-mono transition-colors z-20"
      >
        press to skip →
      </button>
    </div>
  )
}
