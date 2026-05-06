import React, { useState, useEffect, useRef } from 'react'

const API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const TEMPLATES = [
  { id: 'drake', name: 'Drake', top: 0.02, bottom: 0.52, img: 'https://i.imgflip.com/30b1gx.jpg' },
  { id: 'distracted', name: 'Distracted BF', top: 0.75, bottom: 0.02, img: 'https://i.imgflip.com/1ur9b0.jpg' },
  { id: 'change-mind', name: 'Change My Mind', top: 0.65, bottom: null, img: 'https://i.imgflip.com/24y43o.jpg' },
  { id: 'two-buttons', name: 'Two Buttons', top: 0.02, bottom: 0.02, img: 'https://i.imgflip.com/1g8my4.jpg' },
  { id: 'disaster-girl', name: 'Disaster Girl', top: 0.02, bottom: 0.75, img: 'https://i.imgflip.com/23ls.jpg' },
  { id: 'expanding-brain', name: 'Expanding Brain', top: 0.02, bottom: 0.75, img: 'https://i.imgflip.com/1jwhww.jpg' },
]

const SUGGESTIONS = [
  'kubernetes', 'CSS centering', 'production bugs', 'code reviews',
  'microservices', 'Monday standups', 'legacy code', 'docker',
  'git merge conflicts', 'stack overflow', 'AI replacing devs',
  'sprint planning', 'technical debt', 'npm install'
]

export default function MemeGenerator() {
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [meme, setMeme] = useState(null)
  const [template, setTemplate] = useState(null)
  const canvasRef = useRef()

  useEffect(() => {
    const handler = () => setOpen(o => !o)
    window.addEventListener('toggle-meme-gen', handler)
    return () => window.removeEventListener('toggle-meme-gen', handler)
  }, [])

  const generate = async () => {
    if (!topic.trim() || !API_KEY) return
    setLoading(true)
    setMeme(null)

    const tmpl = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]
    setTemplate(tmpl)

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: 80,
          messages: [
            {
              role: 'system',
              content: `You are a dev meme caption writer. Given a tech topic and meme template, write funny captions. Be witty, sarcastic, relatable to developers. Keep each line under 8 words. Reply ONLY in this JSON format: {"top":"top text","bottom":"bottom text"}`
            },
            {
              role: 'user',
              content: `Topic: "${topic}". Template: "${tmpl.name}". Write a hilarious dev meme.`
            }
          ],
        }),
      })
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content || ''
      // Parse JSON from response
      const match = text.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        setMeme(parsed)
        // Draw on canvas after image loads
        setTimeout(() => drawMeme(tmpl, parsed), 300)
      }
    } catch (e) {
      console.error('Meme gen failed:', e)
    }
    setLoading(false)
  }

  const drawMeme = (tmpl, captions) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Meme text style
      const fontSize = Math.max(img.width / 14, 24)
      ctx.font = `bold ${fontSize}px Impact, sans-serif`
      ctx.textAlign = 'center'
      ctx.lineWidth = fontSize / 8
      ctx.strokeStyle = 'black'
      ctx.fillStyle = 'white'

      // Top text
      if (captions.top) {
        const y = tmpl.top !== null ? img.height * tmpl.top + fontSize : fontSize + 10
        ctx.strokeText(captions.top.toUpperCase(), img.width / 2, y)
        ctx.fillText(captions.top.toUpperCase(), img.width / 2, y)
      }

      // Bottom text
      if (captions.bottom && tmpl.bottom !== null) {
        const y = tmpl.bottom > 0.5 ? img.height * tmpl.bottom + fontSize : img.height - 20
        ctx.strokeText(captions.bottom.toUpperCase(), img.width / 2, y)
        ctx.fillText(captions.bottom.toUpperCase(), img.width / 2, y)
      }
    }
    img.src = tmpl.img
  }

  const download = () => {
    if (!canvasRef.current) return
    const link = document.createElement('a')
    link.download = `devmeme-${Date.now()}.png`
    link.href = canvasRef.current.toDataURL('image/png', 1.0)
    link.click()
  }

  const randomSuggestion = () => {
    setTopic(SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)])
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-md" onClick={() => setOpen(false)} />
      <div className="fixed top-[5%] left-1/2 -translate-x-1/2 z-[151] w-[480px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        style={{ background: 'rgba(18,18,24,0.95)', animation: 'meme-in 0.25s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-white text-base font-semibold flex items-center gap-2">😂 AI Meme Generator</h2>
            <p className="text-[11px] text-white/30 mt-0.5">Type a tech topic → get a dev meme</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-b border-white/5">
          <div className="flex gap-2">
            <input
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generate()}
              placeholder="Enter a tech topic..."
              className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 outline-none focus:border-white/20"
            />
            <button onClick={generate} disabled={loading || !topic.trim()}
              className="px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-40">
              {loading ? '...' : '🎲 Generate'}
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            <span className="text-[10px] text-white/20">Try:</span>
            {SUGGESTIONS.slice(0, 5).map(s => (
              <button key={s} onClick={() => { setTopic(s); }}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors">
                {s}
              </button>
            ))}
            <button onClick={randomSuggestion} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 hover:text-white/70 transition-colors">
              🎲 random
            </button>
          </div>
        </div>

        {/* Meme preview */}
        <div className="px-6 py-4">
          {!meme && !loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-4xl">🖼️</span>
              <p className="text-sm text-white/20">Your meme will appear here</p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              <p className="text-sm text-white/30">AI is cooking your meme...</p>
            </div>
          )}
          {meme && template && (
            <div>
              <canvas ref={canvasRef} className="w-full rounded-lg shadow-lg" />
              <div className="flex gap-2 mt-3">
                <button onClick={download}
                  className="flex-1 py-2 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/15 transition-colors">
                  ⬇ Download
                </button>
                <button onClick={generate}
                  className="flex-1 py-2 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/15 transition-colors">
                  🔄 Regenerate
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 border-t border-white/5 text-center">
          <span className="text-[10px] text-white/20">Powered by Groq AI + classic meme templates</span>
        </div>
      </div>

      <style>{`
        @keyframes meme-in {
          from { opacity: 0; transform: translateX(-50%) scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}
