import React, { useState, useEffect, useRef } from 'react'

const API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const API_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Imgflip top 60 meme templates
const TEMPLATES = [
  { id: '181913649', name: 'Drake Hotline Bling' },
  { id: '87743020', name: 'Two Buttons' },
  { id: '112126428', name: 'Distracted Boyfriend' },
  { id: '131087935', name: 'Running Away Balloon' },
  { id: '124822590', name: 'Left Exit 12 Off Ramp' },
  { id: '217743513', name: 'UNO Draw 25 Cards' },
  { id: '93895088', name: 'Expanding Brain' },
  { id: '438680', name: 'Batman Slapping Robin' },
  { id: '4087833', name: 'Waiting Skeleton' },
  { id: '61579', name: 'One Does Not Simply' },
  { id: '101470', name: 'Ancient Aliens' },
  { id: '61520', name: 'Futurama Fry' },
  { id: '89370399', name: 'Roll Safe Think About It' },
  { id: '252600902', name: 'Always Has Been' },
  { id: '188390779', name: 'Woman Yelling At Cat' },
  { id: '135256802', name: 'Epic Handshake' },
  { id: '61532', name: 'The Rock Driving' },
  { id: '180190441', name: 'Bernie Sanders Once Again Asking' },
  { id: '161865971', name: 'Marked Safe From' },
  { id: '119139145', name: 'Blank Nut Button' },
  { id: '222403160', name: 'Gru Plan' },
  { id: '247375501', name: 'Buff Doge vs Cheems' },
  { id: '129242436', name: 'Change My Mind' },
  { id: '91538330', name: 'X X Everywhere' },
  { id: '61544', name: 'Success Kid' },
  { id: '61539', name: 'First World Problems' },
  { id: '61546', name: 'Brace Yourselves' },
  { id: '563423', name: 'That Would Be Great' },
  { id: '61533', name: 'Third World Skeptical Kid' },
  { id: '61527', name: 'Y U No' },
  { id: '61556', name: 'Grandma Finds The Internet' },
  { id: '259237855', name: 'Laughing Leo' },
  { id: '6235864', name: 'Finding Neverland' },
  { id: '27813981', name: 'Hide the Pain Harold' },
  { id: '100777631', name: 'Is This A Pigeon' },
  { id: '155067746', name: 'Surprised Pikachu' },
  { id: '226297822', name: 'Panik Kalm Panik' },
  { id: '195515965', name: 'Clown Applying Makeup' },
  { id: '196652226', name: 'Spongebob Ight Imma Head Out' },
  { id: '97984', name: 'Disaster Girl' },
  { id: '80707627', name: 'Sad Pablo Escobar' },
  { id: '177682295', name: 'Trade Offer' },
  { id: '370867422', name: 'Anakin Padme 4 Panel' },
  { id: '316466202', name: 'Megamind No Bitches' },
  { id: '309868304', name: 'Trade Offer 2' },
  { id: '284929871', name: 'They Are The Same Picture' },
  { id: '322841258', name: 'Anakin Padme Meme' },
  { id: '123999232', name: 'The Scroll Of Truth' },
  { id: '102156234', name: 'Mocking Spongebob' },
  { id: '148909805', name: 'Monkey Puppet' },
  { id: '61580', name: 'Too Damn High' },
  { id: '134797956', name: 'American Chopper Argument' },
  { id: '61585', name: 'Bad Luck Brian' },
  { id: '21735', name: 'The Most Interesting Man' },
  { id: '61516', name: 'Confession Bear' },
  { id: '101288', name: 'Third World Success Kid' },
  { id: '28251713', name: 'Oprah You Get A' },
  { id: '61534', name: 'Matrix Morpheus' },
  { id: '718432', name: 'The Prodigal Son Returns' },
  { id: '61522', name: 'Futurama Zoidberg' },
]

const SUGGESTIONS = [
  'kubernetes', 'CSS centering', 'production bugs on Friday',
  'code reviews', 'microservices vs monolith', 'Monday standups',
  'legacy code', 'docker', 'git merge conflicts', 'stack overflow',
  'AI replacing devs', 'sprint planning', 'technical debt',
  'npm install', 'JavaScript frameworks', 'cloud costs',
  'serverless', 'agile ceremonies', 'YAML files', 'regex'
]

export default function MemeGenerator() {
  const [open, setOpen] = useState(false)
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [memeUrl, setMemeUrl] = useState(null)
  const [caption, setCaption] = useState(null)
  const [templateName, setTemplateName] = useState('')
  const canvasRef = useRef()

  useEffect(() => {
    const handler = () => setOpen(o => !o)
    window.addEventListener('toggle-meme-gen', handler)
    return () => window.removeEventListener('toggle-meme-gen', handler)
  }, [])

  const generate = async () => {
    if (!topic.trim() || !API_KEY) return
    setLoading(true)
    setMemeUrl(null)

    // Pick a random template
    const tmpl = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]
    setTemplateName(tmpl.name)

    try {
      // Step 1: AI generates captions tailored to the template
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          max_tokens: 100,
          temperature: 1.1,
          messages: [
            {
              role: 'system',
              content: `You write hilarious developer meme captions. You're given a meme template name and a tech topic. Write TOP and BOTTOM text that's funny, sarcastic, and relatable to software engineers. Rules:
- Each line MUST be under 10 words
- Be specific to the topic, not generic
- Use developer slang and inside jokes
- Match the template's format (e.g. Drake = "bad thing" vs "good thing", Distracted BF = temptation vs current thing, etc.)
- Reply ONLY in JSON: {"top":"...","bottom":"..."}`
            },
            {
              role: 'user',
              content: `Template: "${tmpl.name}"\nTopic: "${topic}"\n\nWrite a killer dev meme caption.`
            }
          ],
        }),
      })
      const data = await res.json()
      const text = data.choices?.[0]?.message?.content || ''
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) { setLoading(false); return }

      const parsed = JSON.parse(match[0])
      setCaption(parsed)

      // Render meme: load template image + draw text with canvas
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        // Meme text style — Impact font with black stroke
        const fontSize = Math.max(Math.min(img.width / 12, 48), 20)
        ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`
        ctx.textAlign = 'center'
        ctx.lineWidth = fontSize / 6
        ctx.strokeStyle = 'black'
        ctx.fillStyle = 'white'
        ctx.lineJoin = 'round'

        // Word-wrap helper
        const wrapText = (text, maxWidth) => {
          const words = text.split(' ')
          const lines = []
          let line = ''
          words.forEach(w => {
            const test = line ? line + ' ' + w : w
            if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w }
            else line = test
          })
          if (line) lines.push(line)
          return lines
        }

        const maxW = img.width * 0.9

        // Top text
        if (parsed.top) {
          const lines = wrapText(parsed.top.toUpperCase(), maxW)
          lines.forEach((line, i) => {
            const y = fontSize + 10 + i * (fontSize + 4)
            ctx.strokeText(line, img.width / 2, y)
            ctx.fillText(line, img.width / 2, y)
          })
        }

        // Bottom text
        if (parsed.bottom) {
          const lines = wrapText(parsed.bottom.toUpperCase(), maxW)
          const startY = img.height - 15 - (lines.length - 1) * (fontSize + 4)
          lines.forEach((line, i) => {
            const y = startY + i * (fontSize + 4)
            ctx.strokeText(line, img.width / 2, y)
            ctx.fillText(line, img.width / 2, y)
          })
        }

        setMemeUrl(canvas.toDataURL('image/png'))
      }
      img.onerror = () => {
        // If CORS fails, show template without text
        setMemeUrl(`https://i.imgflip.com/${tmpl.id}.jpg`)
      }
      img.src = `https://i.imgflip.com/${tmpl.id}.jpg`
    } catch (e) {
      console.error('Meme gen failed:', e)
    }
    setLoading(false)
  }

  const download = () => {
    if (!memeUrl) return
    const link = document.createElement('a')
    link.download = `devmeme-${Date.now()}.png`
    link.href = memeUrl
    link.click()
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-md" onClick={() => setOpen(false)} />
      <div className="fixed top-[5%] left-1/2 -translate-x-1/2 z-[151] w-[480px] max-w-[calc(100vw-2rem)] max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
        style={{ background: 'rgba(18,18,24,0.95)', animation: 'meme-in 0.25s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white text-base font-semibold">😂 AI Meme Generator</h2>
            <p className="text-[11px] text-white/30 mt-0.5">Type a tech topic → get a dev meme</p>
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
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generate()}
              placeholder="Enter a tech topic..."
              className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 outline-none focus:border-white/20"
            />
            <button onClick={generate} disabled={loading || !topic.trim()}
              className="px-4 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-40">
              {loading ? '...' : '🎲 Go'}
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
            <span className="text-[10px] text-white/20">Try:</span>
            {SUGGESTIONS.sort(() => Math.random() - 0.5).slice(0, 5).map(s => (
              <button key={s} onClick={() => setTopic(s)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Meme preview */}
        <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">
          {!memeUrl && !loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="text-4xl">🖼️</span>
              <p className="text-sm text-white/20">Your meme will appear here</p>
              <p className="text-[10px] text-white/10">20 templates · AI-powered captions</p>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              <p className="text-sm text-white/30">AI is cooking your meme...</p>
            </div>
          )}
          {memeUrl && (
            <div>
              <img src={memeUrl} alt="Generated meme" className="w-full max-h-[40vh] object-contain rounded-lg shadow-lg mx-auto" />
              {templateName && (
                <p className="text-[10px] text-white/20 text-center mt-2 font-mono">Template: {templateName}</p>
              )}
              <div className="flex gap-2 mt-3">
                <button onClick={download}
                  className="flex-1 py-2 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/15 transition-colors">
                  ⬇ Download
                </button>
                <button onClick={generate}
                  className="flex-1 py-2 rounded-xl bg-white/10 text-white text-xs font-medium hover:bg-white/15 transition-colors">
                  🔄 New Meme
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 border-t border-white/5 text-center flex-shrink-0">
          <span className="text-[10px] text-white/20">Powered by Groq AI + imgflip templates</span>
        </div>
      </div>

      {/* Hidden canvas for rendering */}
      <canvas ref={canvasRef} className="hidden" />

      <style>{`
        @keyframes meme-in {
          from { opacity: 0; transform: translateX(-50%) scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}
