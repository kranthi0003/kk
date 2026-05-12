import React, { useState, useEffect, useRef } from 'react'

const THEMES = [
  { name: 'Dark', bg: '#0f0f17', text: '#ffffff', accent: '#2563eb', sub: '#64748b' },
  { name: 'Ocean', bg: '#0c1222', text: '#e2e8f0', accent: '#06b6d4', sub: '#94a3b8' },
  { name: 'Purple', bg: '#1a0a2e', text: '#f0e6ff', accent: '#a855f7', sub: '#9f8cb8' },
  { name: 'Minimal', bg: '#ffffff', text: '#1a1a2e', accent: '#2563eb', sub: '#64748b' },
]

export default function ShareCard() {
  const [open, setOpen] = useState(false)
  const [theme, setTheme] = useState(0)
  const canvasRef = useRef()

  useEffect(() => {
    const handler = () => setOpen(o => !o)
    window.addEventListener('toggle-share-card', handler)
    return () => window.removeEventListener('toggle-share-card', handler)
  }, [])

  useEffect(() => {
    if (open) drawCard()
  }, [open, theme])

  const drawCard = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const t = THEMES[theme]
    const W = 1200, H = 630
    canvas.width = W
    canvas.height = H

    // Background
    ctx.fillStyle = t.bg
    ctx.fillRect(0, 0, W, H)

    // Subtle grid pattern
    ctx.strokeStyle = t.name === 'Minimal' ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

    // Accent gradient circle (decorative)
    const grad = ctx.createRadialGradient(900, 315, 0, 900, 315, 300)
    grad.addColorStop(0, t.accent + '20')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Left content
    const LX = 80

    // "KK" badge
    ctx.fillStyle = t.accent
    ctx.beginPath()
    ctx.arc(LX + 24, 80, 24, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 18px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('KK', LX + 24, 87)
    ctx.textAlign = 'left'

    // Name
    ctx.fillStyle = t.text
    ctx.font = 'bold 52px system-ui, -apple-system, sans-serif'
    ctx.fillText('Kranthi Kiran', LX, 200)

    // Title
    ctx.fillStyle = t.accent
    ctx.font = '600 24px system-ui, sans-serif'
    ctx.fillText('Software Engineer III', LX, 245)

    // Company
    ctx.fillStyle = t.sub
    ctx.font = '20px system-ui, sans-serif'
    ctx.fillText('GitHub  ·  Microsoft', LX, 285)

    // Description
    ctx.fillStyle = t.sub
    ctx.font = '18px system-ui, sans-serif'
    const lines = [
      'Building reliable infrastructure, taming distributed',
      'systems, and crafting tools for engineering teams.'
    ]
    lines.forEach((line, i) => ctx.fillText(line, LX, 340 + i * 28))

    // Tech tags
    const tags = ['React', 'Java', 'Go', 'AWS', 'Kubernetes', 'TypeScript']
    let tagX = LX
    ctx.font = '14px system-ui, sans-serif'
    tags.forEach(tag => {
      const w = ctx.measureText(tag).width + 20
      ctx.fillStyle = t.accent + '20'
      // roundRect polyfill for older browsers
      if (ctx.roundRect) {
        ctx.beginPath()
        ctx.roundRect(tagX, 415, w, 30, 6)
        ctx.fill()
      } else {
        ctx.fillRect(tagX, 415, w, 30)
      }
      ctx.fillStyle = t.accent
      ctx.fillText(tag, tagX + 10, 435)
      tagX += w + 8
    })

    // URL + socials
    ctx.fillStyle = t.sub
    ctx.font = '16px system-ui, sans-serif'
    ctx.fillText('kranthikiran.com', LX, 510)
    ctx.fillStyle = t.accent + '80'
    ctx.fillText('github.com/kranthi0003  ·  linkedin.com/in/akkiran003', LX, 540)

    // Bottom accent line
    ctx.fillStyle = t.accent
    ctx.fillRect(0, H - 4, W, 4)
  }

  const download = () => {
    const link = document.createElement('a')
    link.download = `kranthi-kiran-card-${THEMES[theme].name.toLowerCase()}.png`
    link.href = canvasRef.current.toDataURL('image/png', 1.0)
    link.click()
  }

  const copyToClipboard = async () => {
    try {
      const blob = await new Promise(resolve => canvasRef.current.toBlob(resolve, 'image/png'))
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    } catch {}
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-md" onClick={() => setOpen(false)} />
      <div className="fixed top-[5%] left-1/2 -translate-x-1/2 z-[151] w-[680px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        style={{ background: 'rgba(18,18,24,0.95)', animation: 'share-in 0.25s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-white text-base font-semibold">Share Card</h2>
            <p className="text-[11px] text-white/30 mt-0.5">Generate a branded card for social sharing</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Theme selector */}
        <div className="px-6 py-3 border-b border-white/5 flex items-center gap-2">
          <span className="text-[11px] text-white/30 mr-2">Theme:</span>
          {THEMES.map((t, i) => (
            <button key={t.name} onClick={() => setTheme(i)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                i === theme ? 'bg-white/15 text-white' : 'text-white/30 hover:text-white/60'
              }`}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: t.accent }} />
              {t.name}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div className="px-6 py-4">
          <canvas ref={canvasRef} className="w-full rounded-lg shadow-lg" style={{ aspectRatio: '1200/630' }} />
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center gap-3">
          <button onClick={download}
            className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors">
            ⬇ Download PNG
          </button>
          <button onClick={copyToClipboard}
            className="flex-1 py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/15 transition-colors">
            📋 Copy to Clipboard
          </button>
        </div>

        {/* Footer hint */}
        <div className="px-6 py-2 border-t border-white/5 text-center">
          <span className="text-[10px] text-white/20">1200×630 — perfect for Twitter, LinkedIn, Open Graph</span>
        </div>
      </div>

      <style>{`
        @keyframes share-in {
          from { opacity: 0; transform: translateX(-50%) scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}
