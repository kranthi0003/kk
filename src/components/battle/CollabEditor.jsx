import React, { useState, useEffect, useRef, lazy, Suspense } from 'react'
import supabase from '../../lib/supabase'

const MonacoEditor = lazy(() => import('@monaco-editor/react'))

function genRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const LANGUAGES = [
  { id: 'plaintext', name: 'Plain Text', ext: 'txt', icon: '📝', template: '' },
  { id: 'markdown', name: 'Markdown', ext: 'md', icon: '📖', template: '# Hello\n\nstart writing together...\n\n- bullet one\n- bullet two\n\n```js\nconsole.log("code blocks work")\n```\n' },
  { id: 'javascript', name: 'JavaScript', ext: 'js', icon: '🟨', template: '// collab away\nconsole.log("hello world")\n' },
  { id: 'typescript', name: 'TypeScript', ext: 'ts', icon: '🔷', template: 'const greet = (name: string): string => `hello ${name}`\nconsole.log(greet("world"))\n' },
  { id: 'python', name: 'Python', ext: 'py', icon: '🐍', template: 'print("hello world")\n' },
  { id: 'html', name: 'HTML', ext: 'html', icon: '🌐', template: '<!DOCTYPE html>\n<html>\n<body>\n  <h1>hi</h1>\n</body>\n</html>\n' },
  { id: 'css', name: 'CSS', ext: 'css', icon: '🎨', template: 'body {\n  font-family: system-ui;\n}\n' },
  { id: 'json', name: 'JSON', ext: 'json', icon: '📋', template: '{\n  "name": "collab"\n}\n' },
  { id: 'sql', name: 'SQL', ext: 'sql', icon: '🗄️', template: 'SELECT * FROM users WHERE active = true;\n' },
  { id: 'shell', name: 'Shell', ext: 'sh', icon: '💻', template: '#!/bin/bash\necho "hello"\n' },
]

const SNIPPETS = {
  javascript: [
    { name: 'fetch', code: "const res = await fetch('https://api.example.com/data')\nconst data = await res.json()\nconsole.log(data)" },
    { name: 'for-each', code: "[1, 2, 3].forEach(n => console.log(n))" },
    { name: 'debounce', code: "const debounce = (fn, ms) => {\n  let t\n  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }\n}" },
  ],
  python: [
    { name: 'list comp', code: "squares = [x*x for x in range(10)]\nprint(squares)" },
    { name: 'fibonacci', code: "def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a+b\n    return a" },
  ],
  markdown: [
    { name: 'table', code: "| col1 | col2 |\n|------|------|\n| a    | b    |\n| c    | d    |" },
    { name: 'task list', code: "- [ ] todo\n- [x] done" },
  ],
  sql: [
    { name: 'join', code: "SELECT u.name, o.total\nFROM users u\nJOIN orders o ON o.user_id = u.id\nWHERE o.created_at > NOW() - INTERVAL '7 days';" },
  ],
}

const COLORS = ['#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#fb923c', '#22d3ee', '#f87171']
const REACTIONS = ['🔥', '👍', '❤️', '😂', '🤯', '👀', '🚀', '✨']

function getColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function useIsDark() {
  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return true
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim()
    return isDarkColor(bg)
  })
  useEffect(() => {
    const check = () => {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--color-background').trim()
      setDark(isDarkColor(bg))
    }
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

function isDarkColor(rgb) {
  if (!rgb) return true
  const m = rgb.match(/\d+/g)
  if (!m || m.length < 3) return true
  const [r, g, b] = m.map(Number)
  return (r * 299 + g * 587 + b * 114) / 1000 < 128
}

function renderMarkdown(md) {
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```([\s\S]*?)```/g, (_, c) => `<pre class="bg-muted/40 p-3 rounded-lg overflow-x-auto my-2"><code>${c}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code class="bg-muted/40 px-1 rounded">$1</code>')
    .replace(/^### (.*)$/gm, '<h3 class="text-base font-bold mt-3 mb-1">$1</h3>')
    .replace(/^## (.*)$/gm, '<h2 class="text-lg font-bold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*)$/gm, '<h1 class="text-xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-accent underline" href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^- \[ \] (.*)$/gm, '<li class="list-none">☐ $1</li>')
    .replace(/^- \[x\] (.*)$/gm, '<li class="list-none">☑ $1</li>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul class="list-disc list-inside my-2">${m}</ul>`)
    .replace(/\n\n/g, '</p><p class="my-2">')
  return `<p class="my-2">${html}</p>`
}

export default function CollabEditor({ onBack }) {
  const [phase, setPhase] = useState('lobby')
  const [userName, setUserName] = useState(() => localStorage.getItem('collab:name') || '')
  const [roomCode, setRoomCode] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [language, setLanguage] = useState('markdown')
  const [code, setCode] = useState(LANGUAGES[1].template)
  const [users, setUsers] = useState([])
  const [typing, setTyping] = useState({})
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [consoleOutput, setConsoleOutput] = useState([])
  const [activeTab, setActiveTab] = useState('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(true)
  const [fontSize, setFontSize] = useState(15)
  const [wordWrap, setWordWrap] = useState(true)
  const [editorTheme, setEditorTheme] = useState('auto')
  const [reactions, setReactions] = useState([]) // floating emoji
  const [showSnippets, setShowSnippets] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [recentRooms, setRecentRooms] = useState(() => {
    try { return JSON.parse(localStorage.getItem('collab:recent') || '[]') } catch { return [] }
  })
  const [copyStatus, setCopyStatus] = useState('')

  const channelRef = useRef(null)
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const suppressSync = useRef(false)
  const chatEndRef = useRef(null)
  const reactionIdRef = useRef(0)

  const siteIsDark = useIsDark()
  const monacoTheme = editorTheme === 'auto' ? (siteIsDark ? 'vs-dark' : 'vs') : (editorTheme === 'dark' ? 'vs-dark' : 'vs')

  // auto-join via ?room= query
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
    const r = params.get('room')
    if (r) setRoomCode(r.toUpperCase())
  }, [])

  useEffect(() => () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }, [])

  useEffect(() => { localStorage.setItem('collab:name', userName) }, [userName])

  const rememberRoom = (code) => {
    const next = [{ code, time: Date.now() }, ...recentRooms.filter(r => r.code !== code)].slice(0, 5)
    setRecentRooms(next)
    localStorage.setItem('collab:recent', JSON.stringify(next))
  }

  const createRoom = () => {
    if (!userName.trim()) return
    const code = genRoomCode()
    setRoomCode(code)
    setIsHost(true)
    rememberRoom(code)
    joinChannel(code, userName.trim())
    setPhase('editor')
  }

  const joinRoom = (codeArg) => {
    const targetCode = (codeArg || roomCode).trim().toUpperCase()
    if (!userName.trim() || targetCode.length < 6) return
    setRoomCode(targetCode)
    rememberRoom(targetCode)
    joinChannel(targetCode, userName.trim())
    setPhase('editor')
  }

  const joinChannel = (room, name) => {
    const channel = supabase.channel(`collab-${room}`, {
      config: { presence: { key: crypto.randomUUID().slice(0, 8) } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setUsers(Object.values(state).flat())
      })
      .on('broadcast', { event: 'code-change' }, ({ payload }) => {
        if (payload.name !== name) {
          suppressSync.current = true
          setCode(payload.code)
          setTimeout(() => { suppressSync.current = false }, 50)
        }
      })
      .on('broadcast', { event: 'language-change' }, ({ payload }) => {
        if (payload.name !== name) {
          setLanguage(payload.language)
          if (payload.code !== undefined) {
            suppressSync.current = true
            setCode(payload.code)
            setTimeout(() => { suppressSync.current = false }, 50)
          }
        }
      })
      .on('broadcast', { event: 'chat-message' }, ({ payload }) => {
        setChatMessages(prev => [...prev.slice(-100), payload])
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.name === name) return
        setTyping(prev => ({ ...prev, [payload.name]: Date.now() }))
      })
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        spawnReaction(payload.emoji, payload.name, payload.color)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ name, color: getColor(name), joined_at: new Date().toISOString() })
        }
      })

    channelRef.current = channel
  }

  const spawnReaction = (emoji, name, color) => {
    const id = ++reactionIdRef.current
    const x = 20 + Math.random() * 60 // % across editor area
    setReactions(prev => [...prev, { id, emoji, name, color, x }])
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000)
  }

  const sendReaction = (emoji) => {
    const color = getColor(userName)
    spawnReaction(emoji, userName, color)
    channelRef.current?.send({ type: 'broadcast', event: 'reaction', payload: { emoji, name: userName, color } })
    setShowReactionPicker(false)
  }

  useEffect(() => {
    const i = setInterval(() => {
      setTyping(prev => {
        const now = Date.now()
        const next = {}
        Object.entries(prev).forEach(([k, t]) => { if (now - t < 2000) next[k] = t })
        return next
      })
    }, 1000)
    return () => clearInterval(i)
  }, [])

  const handleCodeChange = (newCode) => {
    setCode(newCode || '')
    if (!suppressSync.current && channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'code-change', payload: { name: userName, code: newCode } })
      channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { name: userName } })
    }
  }

  const handleLanguageChange = (langId) => {
    const tmpl = LANGUAGES.find(l => l.id === langId)
    const isDefault = LANGUAGES.some(l => l.template === code)
    const newCode = isDefault && tmpl ? tmpl.template : code
    setLanguage(langId)
    if (isDefault && tmpl) setCode(tmpl.template)
    channelRef.current?.send({ type: 'broadcast', event: 'language-change', payload: { name: userName, language: langId, code: newCode } })
  }

  const insertSnippet = (snippet) => {
    const editor = editorRef.current
    if (!editor) {
      const newCode = code + (code.endsWith('\n') ? '' : '\n') + snippet.code + '\n'
      handleCodeChange(newCode)
    } else {
      const sel = editor.getSelection()
      editor.executeEdits('snippet', [{ range: sel, text: snippet.code, forceMoveMarkers: true }])
      editor.focus()
    }
    setShowSnippets(false)
  }

  const runCode = () => {
    setActiveTab('console')
    setSidebarOpen(true)
    if (language !== 'javascript' && language !== 'typescript') {
      setConsoleOutput([{ type: 'warn', text: `Run not supported for ${currentLang.name}. Try JavaScript or TypeScript.` }])
      return
    }
    setConsoleOutput([])
    const logs = []
    const fakeConsole = {
      log: (...a) => logs.push({ type: 'log', text: a.map(formatArg).join(' ') }),
      error: (...a) => logs.push({ type: 'error', text: a.map(formatArg).join(' ') }),
      warn: (...a) => logs.push({ type: 'warn', text: a.map(formatArg).join(' ') }),
      info: (...a) => logs.push({ type: 'log', text: a.map(formatArg).join(' ') }),
    }
    try {
      const fn = new Function('console', code)
      const start = performance.now()
      fn(fakeConsole)
      const ms = (performance.now() - start).toFixed(1)
      if (logs.length === 0) logs.push({ type: 'log', text: `✓ ran cleanly (${ms}ms)` })
      else logs.push({ type: 'log', text: `✓ done in ${ms}ms` })
    } catch (e) {
      logs.push({ type: 'error', text: `${e.name}: ${e.message}` })
    }
    setConsoleOutput(logs)
  }

  const formatArg = (a) => {
    if (typeof a === 'object') { try { return JSON.stringify(a) } catch { return String(a) } }
    return String(a)
  }

  const sendChat = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    const msg = { name: userName, text: chatInput.trim(), time: Date.now(), color: getColor(userName) }
    channelRef.current?.send({ type: 'broadcast', event: 'chat-message', payload: msg })
    setChatMessages(prev => [...prev.slice(-100), msg])
    setChatInput('')
  }

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco
  }

  const formatCode = () => editorRef.current?.getAction('editor.action.formatDocument')?.run()

  const downloadFile = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `collab-${roomCode}.${currentLang.ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    flash('copied!')
  }

  const copyInvite = async () => {
    const url = `${window.location.origin}/#/collab?room=${roomCode}`
    await navigator.clipboard.writeText(url)
    flash('invite link copied!')
  }

  const flash = (msg) => {
    setCopyStatus(msg)
    setTimeout(() => setCopyStatus(''), 1500)
  }

  const clearEditor = () => {
    if (!confirm('Clear all content for everyone?')) return
    setCode('')
    channelRef.current?.send({ type: 'broadcast', event: 'code-change', payload: { name: userName, code: '' } })
  }

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runCode() }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); formatCode() }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); downloadFile() }
      if (e.key === 'Escape' && phase === 'lobby') onBack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [code, phase, language, roomCode])

  const currentLang = LANGUAGES.find(l => l.id === language) || LANGUAGES[0]
  const typingUsers = Object.keys(typing).filter(n => n !== userName)
  const showPreview = language === 'markdown' && previewOpen
  const showRun = language === 'javascript' || language === 'typescript'
  const availableSnippets = SNIPPETS[language] || []

  // ── LOBBY ──
  if (phase === 'lobby') return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/5 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-accent/5 blur-3xl animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <div className="flex items-center px-6 py-4 border-b border-border/20 relative z-10">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors">
          ← Back to site
        </button>
        <h1 className="ml-4 text-lg font-bold flex items-center gap-2">👥 Collab Editor</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            live
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="w-[540px] max-w-full space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 mb-4 relative">
              <span className="text-4xl">👥</span>
              {userName.trim() && (
                <div
                  className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ring-4 ring-background"
                  style={{ background: getColor(userName) }}>
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <h2 className="text-3xl font-bold tracking-tight">code together, write together</h2>
            <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
              real-time pads for code, markdown and plain text. share a link, start typing, see each other live.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl bg-card/60 backdrop-blur border border-border/40 p-5 shadow-xl">
            <div>
              <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">your name</label>
              <input
                value={userName}
                onChange={e => setUserName(e.target.value)}
                maxLength={15}
                placeholder="what should we call you?"
                autoFocus
                style={{ color: 'var(--color-foreground)', caretColor: 'var(--color-foreground)' }}
                className="w-full mt-1 px-4 py-3 rounded-xl bg-background border-2 border-border/40 placeholder:text-muted-foreground/50 outline-none focus:border-accent transition-colors text-base font-medium" />
            </div>

            <div className="grid grid-cols-5 gap-3">
              <button onClick={createRoom} disabled={!userName.trim()}
                className="col-span-2 py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 transition disabled:opacity-30 group">
                <span className="inline-block group-hover:scale-110 transition-transform mr-1">✨</span> new room
              </button>
              <input
                value={roomCode}
                onChange={e => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ROOM CODE"
                style={{ color: 'var(--color-foreground)', caretColor: 'var(--color-foreground)' }}
                className="col-span-3 px-4 rounded-xl bg-background border-2 border-border/40 text-center font-mono uppercase placeholder:text-muted-foreground/40 outline-none focus:border-accent text-base font-semibold tracking-widest" />
            </div>
            {roomCode.length === 6 && (
              <button onClick={() => joinRoom()} disabled={!userName.trim()}
                className="w-full py-3 rounded-xl bg-foreground text-background font-semibold hover:opacity-90 transition disabled:opacity-30">
                → join {roomCode}
              </button>
            )}
          </div>

          {recentRooms.length > 0 && (
            <div>
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">recent rooms</div>
              <div className="flex flex-wrap gap-2">
                {recentRooms.map(r => (
                  <button key={r.code} onClick={() => joinRoom(r.code)} disabled={!userName.trim()}
                    className="px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 text-sm font-mono transition disabled:opacity-30">
                    <span className="text-accent font-bold">{r.code}</span>
                    <span className="text-muted-foreground text-xs ml-2">{timeAgo(r.time)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {[
              { i: '📝', t: 'plain text' },
              { i: '📖', t: 'markdown live' },
              { i: '💻', t: '8 languages' },
              { i: '💬', t: 'live chat' },
              { i: '🔥', t: 'emoji reactions' },
              { i: '▶', t: 'run JS code' },
              { i: '⬇', t: 'download' },
              { i: '🧩', t: 'snippets' },
              { i: '🎨', t: 'themed' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted/20 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                <span>{f.i}</span><span>{f.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  // ── EDITOR ──
  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden relative">
      {/* Top bar */}
      <div className="flex items-center px-3 py-2 bg-card border-b border-border/30 flex-shrink-0 gap-2 flex-wrap">
        <button onClick={onBack} className="px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 text-sm transition-colors">
          ← back
        </button>

        <div className="w-px h-5 bg-border/30" />

        <button onClick={copyInvite}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/30 hover:bg-muted/50 text-sm font-mono transition-colors group"
          title="copy invite link">
          <span className="text-accent font-bold">{roomCode}</span>
          <span className="text-muted-foreground text-xs group-hover:scale-110 transition-transform">🔗</span>
        </button>

        <select value={language} onChange={e => handleLanguageChange(e.target.value)}
          style={{ color: 'var(--color-foreground)' }}
          className="px-2 py-1 rounded-md bg-muted/30 text-sm border border-border/30 outline-none focus:border-accent/50 cursor-pointer">
          {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.icon} {l.name}</option>)}
        </select>

        <div className="flex items-center gap-0.5">
          {availableSnippets.length > 0 && (
            <div className="relative">
              <button onClick={() => setShowSnippets(s => !s)} title="snippets" className={`px-2 py-1 rounded-md text-sm hover:bg-muted/30 ${showSnippets ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:text-foreground'}`}>
                🧩
              </button>
              {showSnippets && (
                <div className="absolute top-full mt-1 left-0 w-56 bg-card border border-border/40 rounded-lg shadow-2xl z-50 overflow-hidden">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider px-3 py-1.5 border-b border-border/20">snippets</div>
                  {availableSnippets.map((s, i) => (
                    <button key={i} onClick={() => insertSnippet(s)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/40 transition-colors">
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button onClick={formatCode} title="format (⌘⇧F)" className="px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30">{`{}`}</button>
          <button onClick={copyCode} title="copy all" className="px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30">📋</button>
          <button onClick={downloadFile} title="download (⌘S)" className="px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30">⬇</button>
          <button onClick={() => setWordWrap(w => !w)} title="word wrap" className={`px-2 py-1 rounded-md text-sm hover:bg-muted/30 ${wordWrap ? 'text-accent' : 'text-muted-foreground'}`}>↵</button>
          <button onClick={() => setFontSize(f => Math.max(10, f - 1))} title="smaller" className="px-1.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30">A−</button>
          <span className="text-xs text-muted-foreground w-6 text-center">{fontSize}</span>
          <button onClick={() => setFontSize(f => Math.min(28, f + 1))} title="bigger" className="px-1.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30">A+</button>
          <button onClick={clearEditor} title="clear all" className="px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-red-400 hover:bg-muted/30">🗑</button>
        </div>

        <select value={editorTheme} onChange={e => setEditorTheme(e.target.value)}
          style={{ color: 'var(--color-foreground)' }}
          className="px-2 py-1 rounded-md bg-muted/30 text-xs border border-border/30 outline-none cursor-pointer"
          title="editor theme">
          <option value="auto">auto</option>
          <option value="light">light</option>
          <option value="dark">dark</option>
        </select>

        {language === 'markdown' && (
          <button onClick={() => setPreviewOpen(p => !p)}
            className={`px-2 py-1 rounded-md text-xs font-medium ${previewOpen ? 'bg-accent/20 text-accent' : 'bg-muted/30 text-muted-foreground hover:text-foreground'}`}>
            👁 preview
          </button>
        )}

        {/* Reaction picker */}
        <div className="relative">
          <button onClick={() => setShowReactionPicker(s => !s)}
            className={`px-2 py-1 rounded-md text-sm hover:bg-muted/30 ${showReactionPicker ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:text-foreground'}`}
            title="send reaction">
            😀
          </button>
          {showReactionPicker && (
            <div className="absolute top-full mt-1 right-0 flex gap-1 p-1.5 bg-card border border-border/40 rounded-xl shadow-2xl z-50">
              {REACTIONS.map(e => (
                <button key={e} onClick={() => sendReaction(e)}
                  className="text-xl hover:scale-125 transition-transform p-1">
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center">
          {users.slice(0, 6).map((u, i) => (
            <div key={i}
              className={`relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-background ${typing[u.name] ? 'ring-accent' : ''}`}
              style={{ background: u.color, marginLeft: i > 0 ? -8 : 0 }}
              title={`${u.name}${typing[u.name] ? ' (typing...)' : ''}`}>
              {u.name.charAt(0).toUpperCase()}
              {typing[u.name] && (
                <span className="absolute -bottom-0.5 -right-0.5 flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                </span>
              )}
            </div>
          ))}
          {users.length > 6 && <span className="text-xs text-muted-foreground ml-2">+{users.length - 6}</span>}
        </div>

        {showRun && (
          <button onClick={runCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors">
            ▶ Run <kbd className="text-[9px] text-white/60">⌘↵</kbd>
          </button>
        )}

        <button onClick={() => setSidebarOpen(s => !s)}
          className={`px-2 py-1 rounded-md text-sm ${sidebarOpen ? 'bg-accent/20 text-accent' : 'bg-muted/30 text-muted-foreground'}`}
          title="toggle panel">
          {sidebarOpen ? '▶' : '◀'}
        </button>
      </div>

      {copyStatus && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium z-50 shadow-lg animate-fade-in">
          {copyStatus}
        </div>
      )}

      {/* Floating reactions */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {reactions.map(r => (
          <div key={r.id}
            className="absolute bottom-12 flex flex-col items-center"
            style={{ left: `${r.x}%`, animation: 'floatUp 3s ease-out forwards' }}>
            <div className="text-3xl">{r.emoji}</div>
            <div className="text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 text-white shadow-md"
              style={{ background: r.color }}>{r.name}</div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          15% { transform: translateY(-30px) scale(1.2); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-400px) scale(1); opacity: 0; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>

      {/* Main area */}
      <div className="flex flex-1 min-h-0 relative">
        <div className="flex-1 flex min-w-0">
          <div className={`min-h-0 ${showPreview ? 'flex-1 border-r border-border/30' : 'flex-1'}`}>
            <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-accent rounded-full animate-spin" /></div>}>
              <MonacoEditor
                height="100%"
                language={language}
                value={code}
                onChange={handleCodeChange}
                onMount={handleEditorMount}
                theme={monacoTheme}
                options={{
                  fontSize,
                  fontFamily: "'JetBrains Mono', 'Menlo', monospace",
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: wordWrap ? 'on' : 'off',
                  padding: { top: 14, bottom: 14 },
                  tabSize: 2,
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  renderWhitespace: 'selection',
                  bracketPairColorization: { enabled: true },
                  formatOnPaste: true,
                  lineHeight: 1.6,
                }}
              />
            </Suspense>
          </div>

          {showPreview && (
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-background" style={{ scrollbarWidth: 'thin' }}>
              <div className="text-xs text-muted-foreground/50 mb-3 uppercase tracking-wider font-semibold">live preview</div>
              <div className="text-foreground leading-relaxed text-sm"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(code) }} />
            </div>
          )}
        </div>

        {sidebarOpen && (
          <div className="w-[320px] flex-shrink-0 border-l border-border/30 bg-card flex flex-col">
            <div className="flex items-center border-b border-border/20 px-1 flex-shrink-0">
              {[
                { id: 'chat', label: '💬 chat', badge: chatMessages.length },
                { id: 'console', label: '› console', badge: consoleOutput.length },
                { id: 'users', label: `👥 ${users.length}` },
              ].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`px-3 py-2 text-xs font-medium transition-colors relative ${activeTab === t.id ? 'text-accent border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t.label}
                  {t.badge > 0 && activeTab !== t.id && (
                    <span className="absolute top-1.5 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
                  )}
                </button>
              ))}
            </div>

            {activeTab === 'console' && (
              <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-xs" style={{ scrollbarWidth: 'thin' }}>
                {consoleOutput.length === 0 ? (
                  <p className="text-muted-foreground/40 py-6 text-center">{showRun ? 'press ▶ Run or ⌘↵' : `run not supported for ${currentLang.name}`}</p>
                ) : consoleOutput.map((log, i) => (
                  <div key={i} className={`py-0.5 break-all ${log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : 'text-green-400'}`}>
                    {log.type === 'error' ? '✕ ' : log.type === 'warn' ? '⚠ ' : '› '}{log.text}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ scrollbarWidth: 'thin' }}>
                  {chatMessages.length === 0 && (
                    <div className="text-center py-6">
                      <div className="text-2xl mb-2">👋</div>
                      <p className="text-muted-foreground/50 text-xs">say hi to your collaborators</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className="text-xs">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold" style={{ color: msg.color }}>{msg.name}</span>
                        <span className="text-muted-foreground/40 text-[10px]">{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="text-foreground/90 break-words">{msg.text}</div>
                    </div>
                  ))}
                  {typingUsers.length > 0 && (
                    <div className="text-[11px] text-muted-foreground italic flex items-center gap-1">
                      <span className="flex gap-0.5">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      {typingUsers.join(', ')} typing
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={sendChat} className="flex gap-2 px-3 py-2 border-t border-border/20 flex-shrink-0">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} maxLength={300}
                    placeholder="type a message..."
                    style={{ color: 'var(--color-foreground)', caretColor: 'var(--color-foreground)' }}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-background border border-border/30 text-xs placeholder:text-muted-foreground/40 outline-none focus:border-accent/50" />
                  <button type="submit" disabled={!chatInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold disabled:opacity-30">
                    send
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ scrollbarWidth: 'thin' }}>
                {users.map((u, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-2 rounded-lg bg-muted/20">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white relative"
                      style={{ background: u.color }}>
                      {u.name.charAt(0).toUpperCase()}
                      {typing[u.name] && <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-accent ring-2 ring-card animate-pulse" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{u.name}{u.name === userName && <span className="text-muted-foreground text-xs ml-1">(you)</span>}</div>
                      <div className="text-[10px] text-muted-foreground">{typing[u.name] ? 'typing...' : 'idle'}</div>
                    </div>
                    {isHost && u.name === userName && <span className="text-[10px] text-accent">host</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center px-3 py-1 bg-accent text-accent-foreground text-[11px] gap-3 flex-shrink-0">
        <span>{currentLang.icon} {currentLang.name}</span>
        <span>· {code.split('\n').length} lines · {code.length} chars</span>
        <span>· 👥 {users.length}</span>
        <span className="ml-auto opacity-70">⌘↵ run · ⌘⇧F format · ⌘S download · ESC back</span>
      </div>
    </div>
  )
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
