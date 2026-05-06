import React, { useState, useEffect } from 'react'

const TOOLS = [
  { id: 'unix', name: 'Unix ↔ Date', icon: '🕐' },
  { id: 'base64', name: 'Base64', icon: '🔤' },
  { id: 'jwt', name: 'JWT Decode', icon: '🔑' },
  { id: 'url', name: 'URL Encode', icon: '🔗' },
  { id: 'color', name: 'Color Convert', icon: '🎨' },
  { id: 'hash', name: 'Hash Gen', icon: '#️⃣' },
  { id: 'json', name: 'JSON Format', icon: '📋' },
  { id: 'regex', name: 'Regex Test', icon: '🔍' },
]

function UnixTool() {
  const [input, setInput] = useState('')
  const [now, setNow] = useState(Math.floor(Date.now() / 1000))
  useEffect(() => { const i = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000); return () => clearInterval(i) }, [])

  const result = (() => {
    if (!input) return `Now: ${now}\n→ ${new Date().toISOString()}`
    const n = Number(input)
    if (!isNaN(n) && input.length >= 9) {
      const d = new Date(n * (input.length <= 10 ? 1000 : 1))
      return `→ ${d.toISOString()}\n→ ${d.toLocaleString()}\n→ ${Math.floor((Date.now() - d.getTime()) / 86400000)} days ago`
    }
    const d = new Date(input)
    if (!isNaN(d)) return `→ ${Math.floor(d.getTime() / 1000)}\n→ ${d.toISOString()}`
    return 'Enter a Unix timestamp or date string'
  })()

  return <ToolLayout input={input} setInput={setInput} result={result} placeholder="Unix timestamp or date string..." />
}

function Base64Tool() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState('encode')

  const result = (() => {
    if (!input) return ''
    try {
      return mode === 'encode' ? btoa(input) : atob(input)
    } catch { return '⚠ Invalid input' }
  })()

  return (
    <div>
      <div className="flex gap-1 mb-2">
        <button onClick={() => setMode('encode')} className={`px-2 py-0.5 rounded text-[10px] ${mode === 'encode' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40'}`}>Encode</button>
        <button onClick={() => setMode('decode')} className={`px-2 py-0.5 rounded text-[10px] ${mode === 'decode' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40'}`}>Decode</button>
      </div>
      <ToolLayout input={input} setInput={setInput} result={result} placeholder={mode === 'encode' ? 'Text to encode...' : 'Base64 to decode...'} />
    </div>
  )
}

function JWTTool() {
  const [input, setInput] = useState('')
  const result = (() => {
    if (!input) return 'Paste a JWT token...'
    try {
      const parts = input.split('.')
      if (parts.length !== 3) return '⚠ Not a valid JWT (need 3 parts)'
      const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')))
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      const exp = payload.exp ? new Date(payload.exp * 1000).toLocaleString() : '—'
      const iat = payload.iat ? new Date(payload.iat * 1000).toLocaleString() : '—'
      return `HEADER:\n${JSON.stringify(header, null, 2)}\n\nPAYLOAD:\n${JSON.stringify(payload, null, 2)}\n\nIssued: ${iat}\nExpires: ${exp}`
    } catch { return '⚠ Invalid JWT' }
  })()
  return <ToolLayout input={input} setInput={setInput} result={result} placeholder="Paste JWT token..." />
}

function URLTool() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState('encode')
  const result = (() => {
    if (!input) return ''
    try { return mode === 'encode' ? encodeURIComponent(input) : decodeURIComponent(input) }
    catch { return '⚠ Invalid input' }
  })()
  return (
    <div>
      <div className="flex gap-1 mb-2">
        <button onClick={() => setMode('encode')} className={`px-2 py-0.5 rounded text-[10px] ${mode === 'encode' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40'}`}>Encode</button>
        <button onClick={() => setMode('decode')} className={`px-2 py-0.5 rounded text-[10px] ${mode === 'decode' ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40'}`}>Decode</button>
      </div>
      <ToolLayout input={input} setInput={setInput} result={result} placeholder={mode === 'encode' ? 'Text to URL encode...' : 'URL encoded string...'} />
    </div>
  )
}

function ColorTool() {
  const [input, setInput] = useState('#2563eb')
  const result = (() => {
    if (!input) return ''
    // Hex to RGB
    const hex = input.replace('#', '')
    if (/^[0-9a-fA-F]{6}$/.test(hex)) {
      const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16)
      const hsl = rgbToHsl(r, g, b)
      return `HEX: #${hex}\nRGB: rgb(${r}, ${g}, ${b})\nHSL: hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)\nTailwind: closest → blue-600`
    }
    // RGB to Hex
    const rgb = input.match(/(\d+)/g)
    if (rgb && rgb.length >= 3) {
      const [r, g, b] = rgb.map(Number)
      const hexVal = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
      return `RGB: rgb(${r}, ${g}, ${b})\nHEX: ${hexVal}`
    }
    return 'Enter hex (#2563eb) or rgb(37,99,235)'
  })()
  return (
    <div>
      {input && /^#?[0-9a-fA-F]{6}$/.test(input.replace('#', '')) && (
        <div className="w-full h-8 rounded-lg mb-2" style={{ backgroundColor: input.startsWith('#') ? input : `#${input}` }} />
      )}
      <ToolLayout input={input} setInput={setInput} result={result} placeholder="#hex or rgb(r,g,b)..." />
    </div>
  )
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function HashTool() {
  const [input, setInput] = useState('')
  const [result, setResult] = useState('')
  useEffect(() => {
    if (!input) { setResult(''); return }
    (async () => {
      const enc = new TextEncoder().encode(input)
      const sha256 = await crypto.subtle.digest('SHA-256', enc)
      const sha1 = await crypto.subtle.digest('SHA-1', enc)
      const hex = buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
      setResult(`SHA-256:\n${hex(sha256)}\n\nSHA-1:\n${hex(sha1)}\n\nLength: ${input.length} chars`)
    })()
  }, [input])
  return <ToolLayout input={input} setInput={setInput} result={result} placeholder="Text to hash..." />
}

function JSONTool() {
  const [input, setInput] = useState('')
  const result = (() => {
    if (!input) return ''
    try {
      const parsed = JSON.parse(input)
      const keys = Object.keys(parsed)
      return `${JSON.stringify(parsed, null, 2)}\n\n— ${keys.length} keys, ${JSON.stringify(parsed).length} bytes`
    } catch (e) { return `⚠ ${e.message}` }
  })()
  return <ToolLayout input={input} setInput={setInput} result={result} placeholder='{"paste": "json"}...' multiline />
}

function RegexTool() {
  const [pattern, setPattern] = useState('')
  const [testStr, setTestStr] = useState('')
  const result = (() => {
    if (!pattern || !testStr) return 'Enter a regex pattern and test string'
    try {
      const re = new RegExp(pattern, 'g')
      const matches = [...testStr.matchAll(re)]
      if (!matches.length) return '❌ No matches'
      return `✅ ${matches.length} match${matches.length > 1 ? 'es' : ''}:\n${matches.map((m, i) => `  [${i}] "${m[0]}" at index ${m.index}`).join('\n')}`
    } catch (e) { return `⚠ ${e.message}` }
  })()
  return (
    <div className="space-y-2">
      <input value={pattern} onChange={e => setPattern(e.target.value)} placeholder="Regex pattern (no //)..."
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono placeholder:text-white/20 outline-none" />
      <input value={testStr} onChange={e => setTestStr(e.target.value)} placeholder="Test string..."
        className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono placeholder:text-white/20 outline-none" />
      <pre className="text-[11px] text-green-400 font-mono whitespace-pre-wrap bg-black/20 rounded-lg p-3 min-h-[60px] max-h-[120px] overflow-auto">{result}</pre>
    </div>
  )
}

function ToolLayout({ input, setInput, result, placeholder, multiline }) {
  const copy = () => result && navigator.clipboard.writeText(result)
  return (
    <div className="space-y-2">
      {multiline ? (
        <textarea value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono placeholder:text-white/20 outline-none resize-none" />
      ) : (
        <input value={input} onChange={e => setInput(e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono placeholder:text-white/20 outline-none" />
      )}
      <div className="relative">
        <pre className="text-[11px] text-green-400 font-mono whitespace-pre-wrap bg-black/20 rounded-lg p-3 min-h-[60px] max-h-[150px] overflow-auto">{result || '...'}</pre>
        {result && (
          <button onClick={copy} className="absolute top-2 right-2 text-[9px] text-white/30 hover:text-white/60 bg-white/5 px-1.5 py-0.5 rounded">copy</button>
        )}
      </div>
    </div>
  )
}

const TOOL_MAP = {
  unix: UnixTool,
  base64: Base64Tool,
  jwt: JWTTool,
  url: URLTool,
  color: ColorTool,
  hash: HashTool,
  json: JSONTool,
  regex: RegexTool,
}

export default function DevCalc() {
  const [open, setOpen] = useState(false)
  const [activeTool, setActiveTool] = useState('unix')

  useEffect(() => {
    const handler = () => setOpen(o => !o)
    window.addEventListener('toggle-dev-calc', handler)
    return () => window.removeEventListener('toggle-dev-calc', handler)
  }, [])

  if (!open) return null

  const ActiveComponent = TOOL_MAP[activeTool]

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-md" onClick={() => setOpen(false)} />
      <div className="fixed top-[5%] left-1/2 -translate-x-1/2 z-[151] w-[520px] max-w-[calc(100vw-2rem)] max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
        style={{ background: 'rgba(18,18,24,0.95)', animation: 'devcalc-in 0.25s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white text-base font-semibold">🧮 Dev Toolkit</h2>
            <p className="text-[11px] text-white/30 mt-0.5">Essential developer utilities</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tool tabs */}
        <div className="px-4 py-2 border-b border-white/5 flex-shrink-0 overflow-x-auto">
          <div className="flex gap-1">
            {TOOLS.map(t => (
              <button key={t.id} onClick={() => setActiveTool(t.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                  activeTool === t.id ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                }`}>
                <span className="text-xs">{t.icon}</span>
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* Active tool */}
        <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">
          <ActiveComponent />
        </div>

        {/* Footer */}
        <div className="px-6 py-2 border-t border-white/5 text-center flex-shrink-0">
          <span className="text-[10px] text-white/20">8 tools · all client-side · no data sent</span>
        </div>
      </div>

      <style>{`
        @keyframes devcalc-in {
          from { opacity: 0; transform: translateX(-50%) scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}
