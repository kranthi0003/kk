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

  return [
    // Quick system detect (fast, compact)
    { text: `kranthi@portfolio:~$ neofetch`, delay: 0, cmd: true },
    { text: '', delay: 200 },
    { text: `  OS      ${s.os}`, delay: 300, bright: true },
    { text: `  Browser ${s.browser} ${s.browserVersion}`, delay: 400 },
    { text: `  CPU     ${s.cores || '?'} cores`, delay: 500, bright: true },
    ...(s.mem ? [{ text: `  Memory  ${s.mem} GB`, delay: 600, bright: true }] : []),
    ...(s.webgl.renderer ? [{ text: `  GPU     ${s.webgl.renderer}`, delay: 700 }] : []),
    { text: `  Display ${s.screen.width}×${s.screen.height} @ ${window.devicePixelRatio || 1}x`, delay: 800 },
    { text: `  Network ${s.online}${s.effectiveType ? ' · ' + s.effectiveType.toUpperCase() : ''}${s.downlink ? ' · ' + s.downlink + ' Mbps' : ''}`, delay: 900 },
    { text: `  Locale  ${s.lang} · ${s.tz}`, delay: 1000 },
    { text: '', delay: 1100 },
    // Terminal command sequence (ddaniel style)
    { text: `kranthi@portfolio:~$ pwd`, delay: 1200, cmd: true },
    { text: `  /home/kranthi/portfolio`, delay: 1350 },
    { text: '', delay: 1450 },
    { text: `kranthi@portfolio:~$ ls`, delay: 1550, cmd: true },
    { text: `  src/  public/  dist/  package.json  vite.config.js  tailwind.config.js`, delay: 1700, ok: true },
    { text: '', delay: 1800 },
    { text: `kranthi@portfolio:~$ npm run build`, delay: 1900, cmd: true },
    { text: `  ✓ 20 modules transformed`, delay: 2100, ok: true },
    { text: `  ✓ built in 2.1s`, delay: 2250, ok: true },
    { text: '', delay: 2350 },
    { text: `kranthi@portfolio:~$ ./deploy.sh`, delay: 2450, cmd: true },
    { text: `  → deploying to kranthikiran.com...`, delay: 2600, accent: true },
    { text: `  ✓ live`, delay: 2800, ok: true },
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
    }, 3000)

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
              line.cmd ? 'text-foreground font-semibold' :
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
