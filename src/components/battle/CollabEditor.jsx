import React, { useState, useEffect, useRef, lazy, Suspense, useMemo } from 'react'
import supabase from '../../lib/supabase'

const MonacoEditor = lazy(() => import('@monaco-editor/react'))

function genRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const LANGUAGES = [
  { id: 'plaintext', name: 'Plain Text', ext: 'txt', icon: '📝', template: '' },
  { id: 'markdown', name: 'Markdown', ext: 'md', icon: '📖', template: '# Hello\n\nstart writing markdown together...\n\n- bullet one\n- bullet two\n\n```js\nconsole.log("code blocks work too")\n```\n' },
  { id: 'javascript', name: 'JavaScript', ext: 'js', icon: '🟨', template: '// collab away\nconsole.log("hello world")\n' },
  { id: 'typescript', name: 'TypeScript', ext: 'ts', icon: '🔷', template: 'const greet = (name: string): string => `hello ${name}`\nconsole.log(greet("world"))\n' },
  { id: 'python', name: 'Python', ext: 'py', icon: '🐍', template: 'print("hello world")\n' },
  { id: 'html', name: 'HTML', ext: 'html', icon: '🌐', template: '<!DOCTYPE html>\n<html>\n<body>\n  <h1>hi</h1>\n</body>\n</html>\n' },
  { id: 'css', name: 'CSS', ext: 'css', icon: '🎨', template: 'body {\n  font-family: system-ui;\n}\n' },
  { id: 'json', name: 'JSON', ext: 'json', icon: '📋', template: '{\n  "name": "collab"\n}\n' },
  { id: 'sql', name: 'SQL', ext: 'sql', icon: '🗄️', template: 'SELECT * FROM users WHERE active = true;\n' },
  { id: 'shell', name: 'Shell', ext: 'sh', icon: '💻', template: '#!/bin/bash\necho "hello"\n' },
]

const COLORS = ['#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#fb923c', '#22d3ee', '#f87171']

function getColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

// detect site theme to mirror into monaco
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

// minimal markdown → html for preview
function renderMarkdown(md) {
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/```([\s\S]*?)```/g, (_, c) => `<pre><code>${c}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^- (.*)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/\n\n/g, '</p><p>')
  return `<p>${html}</p>`
}

export default function CollabEditor({ onBack }) {
  const [phase, setPhase] = useState('lobby')
  const [userName, setUserName] = useState('')
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
  const [editorTheme, setEditorTheme] = useState('auto') // auto, dark, light
  const [lastSync, setLastSync] = useState(null)
  const [copyStatus, setCopyStatus] = useState('')

  const channelRef = useRef(null)
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const suppressSync = useRef(false)
  const chatEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)

  const siteIsDark = useIsDark()
  const monacoTheme = editorTheme === 'auto' ? (siteIsDark ? 'vs-dark' : 'vs') : (editorTheme === 'dark' ? 'vs-dark' : 'vs')

  // auto-join via ?room= query
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
    const r = params.get('room')
    if (r) setRoomCode(r.toUpperCase())
  }, [])

  useEffect(() => () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }, [])

  const createRoom = () => {
    if (!userName.trim()) return
    const code = genRoomCode()
    setRoomCode(code)
    setIsHost(true)
    joinChannel(code, userName.trim())
    setPhase('editor')
  }

  const joinRoom = () => {
    if (!userName.trim() || roomCode.length < 6) return
    joinChannel(roomCode.trim().toUpperCase(), userName.trim())
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
          setLastSync(Date.now())
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
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ name, color: getColor(name), joined_at: new Date().toISOString() })
        }
      })

    channelRef.current = channel
  }

  // clear stale typing indicators
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
      setLastSync(Date.now())
    }
  }

  const handleLanguageChange = (langId) => {
    const tmpl = LANGUAGES.find(l => l.id === langId)
    setLanguage(langId)
    // keep current code if user has been writing; only swap to template if empty/default
    const isDefault = LANGUAGES.some(l => l.template === code)
    const newCode = isDefault && tmpl ? tmpl.template : code
    if (isDefault && tmpl) setCode(tmpl.template)
    channelRef.current?.send({ type: 'broadcast', event: 'language-change', payload: { name: userName, language: langId, code: newCode } })
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

  const formatCode = () => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run()
  }

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
    setCopyStatus('copied!')
    setTimeout(() => setCopyStatus(''), 1500)
  }

  const copyInvite = async () => {
    const url = `${window.location.origin}/#/collab?room=${roomCode}`
    await navigator.clipboard.writeText(url)
    setCopyStatus('invite copied!')
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

  // ── LOBBY ──
  if (phase === 'lobby') return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex items-center px-6 py-4 border-b border-border/20">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors">
          ← Back to site
        </button>
        <h1 className="ml-4 text-lg font-bold flex items-center gap-2">👥 Collab Editor</h1>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-[520px] max-w-full space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 mb-4">
              <span className="text-4xl">👥</span>
            </div>
            <h2 className="text-2xl font-bold">code together, write together</h2>
            <p className="text-muted-foreground text-sm mt-1">real-time collab — code, markdown, plain text. share a link, start typing.</p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">your name</label>
            <input value={userName} onChange={e => setUserName(e.target.value)} maxLength={15}
              placeholder="who's typing?"
              className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border/30 text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-accent/50 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={createRoom} disabled={!userName.trim()}
              className="py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 transition disabled:opacity-30">
              start new room
            </button>
            <input value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} maxLength={6}
              placeholder="ROOM CODE"
              className="px-4 rounded-xl bg-muted/30 border border-border/30 text-foreground text-center font-mono uppercase placeholder:text-muted-foreground/30 outline-none focus:border-accent/50" />
          </div>
          {roomCode.length === 6 && (
            <button onClick={joinRoom} disabled={!userName.trim()}
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 transition disabled:opacity-30">
              join room: {roomCode}
            </button>
          )}

          <div className="grid grid-cols-3 gap-2 pt-2">
            {[
              { i: '📝', t: 'plain text' },
              { i: '📖', t: 'markdown + preview' },
              { i: '💻', t: '8 languages' },
              { i: '💬', t: 'live chat' },
              { i: '▶', t: 'run JS in browser' },
              { i: '⬇', t: 'download as file' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-muted/20 text-xs text-muted-foreground">
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
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center px-3 py-2 bg-card border-b border-border/30 flex-shrink-0 gap-2 flex-wrap">
        <button onClick={onBack} className="px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/30 text-sm transition-colors">
          ← back
        </button>

        <div className="w-px h-5 bg-border/30" />

        <button onClick={copyInvite}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/30 hover:bg-muted/50 text-sm font-mono transition-colors"
          title="copy invite link">
          <span className="text-accent font-bold">{roomCode}</span>
          <span className="text-muted-foreground text-xs">🔗</span>
        </button>

        {/* Language */}
        <select value={language} onChange={e => handleLanguageChange(e.target.value)}
          className="px-2 py-1 rounded-md bg-muted/30 text-foreground text-sm border border-border/30 outline-none focus:border-accent/50 cursor-pointer">
          {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.icon} {l.name}</option>)}
        </select>

        {/* Tools */}
        <div className="flex items-center gap-0.5">
          <button onClick={formatCode} title="format (⌘⇧F)" className="px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30">{`{}`}</button>
          <button onClick={copyCode} title="copy all" className="px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30">📋</button>
          <button onClick={downloadFile} title="download (⌘S)" className="px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30">⬇</button>
          <button onClick={() => setWordWrap(w => !w)} title="word wrap" className={`px-2 py-1 rounded-md text-sm hover:bg-muted/30 ${wordWrap ? 'text-accent' : 'text-muted-foreground'}`}>↵</button>
          <button onClick={() => setFontSize(f => Math.max(10, f - 1))} title="smaller" className="px-1.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30">A−</button>
          <span className="text-xs text-muted-foreground w-6 text-center">{fontSize}</span>
          <button onClick={() => setFontSize(f => Math.min(28, f + 1))} title="bigger" className="px-1.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30">A+</button>
          <button onClick={clearEditor} title="clear all" className="px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-red-400 hover:bg-muted/30">🗑</button>
        </div>

        {/* Editor theme */}
        <select value={editorTheme} onChange={e => setEditorTheme(e.target.value)}
          className="px-2 py-1 rounded-md bg-muted/30 text-foreground text-xs border border-border/30 outline-none cursor-pointer"
          title="editor theme">
          <option value="auto">auto</option>
          <option value="light">light</option>
          <option value="dark">dark</option>
        </select>

        {language === 'markdown' && (
          <button onClick={() => setPreviewOpen(p => !p)}
            className={`px-2 py-1 rounded-md text-xs font-medium ${previewOpen ? 'bg-accent/20 text-accent' : 'bg-muted/30 text-muted-foreground hover:text-foreground'}`}>
            {previewOpen ? '👁 preview on' : '👁 preview off'}
          </button>
        )}

        <div className="flex-1" />

        {/* Users */}
        <div className="flex items-center gap-1">
          {users.slice(0, 6).map((u, i) => (
            <div key={i}
              className={`relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-background ${typing[u.name] ? 'ring-accent animate-pulse' : ''}`}
              style={{ background: u.color, marginLeft: i > 0 ? -8 : 0 }}
              title={`${u.name}${typing[u.name] ? ' (typing...)' : ''}`}>
              {u.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {users.length > 6 && <span className="text-xs text-muted-foreground ml-1">+{users.length - 6}</span>}
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
        <div className="absolute top-14 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium z-50 shadow-lg">
          {copyStatus}
        </div>
      )}

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Editor + optional markdown preview */}
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
                  formatOnType: false,
                  lineHeight: 1.6,
                }}
              />
            </Suspense>
          </div>

          {showPreview && (
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-background prose-collab" style={{ scrollbarWidth: 'thin' }}>
              <div className="text-xs text-muted-foreground/50 mb-3 uppercase tracking-wider">preview</div>
              <div className="text-foreground leading-relaxed text-sm"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(code) }} />
            </div>
          )}
        </div>

        {/* Sidebar */}
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
                    <span className="absolute -top-0 -right-0 w-1.5 h-1.5 rounded-full bg-accent" />
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
                  {chatMessages.length === 0 && <p className="text-muted-foreground/40 text-xs text-center py-6">say hi to your collaborators</p>}
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
                    <div className="text-[11px] text-muted-foreground italic">
                      {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={sendChat} className="flex gap-2 px-3 py-2 border-t border-border/20 flex-shrink-0">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} maxLength={300}
                    placeholder="type a message..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-muted/20 border border-border/20 text-foreground text-xs placeholder:text-muted-foreground/40 outline-none focus:border-accent/40" />
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
                  <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/20">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ background: u.color }}>{u.name.charAt(0).toUpperCase()}</div>
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

      {/* Status bar */}
      <div className="flex items-center px-3 py-1 bg-accent text-accent-foreground text-[11px] gap-3 flex-shrink-0">
        <span>{currentLang.icon} {currentLang.name}</span>
        <span>· {code.split('\n').length} lines · {code.length} chars</span>
        <span>· 👥 {users.length}</span>
        {lastSync && <span className="opacity-70">· synced</span>}
        <span className="ml-auto opacity-70">⌘↵ run · ⌘⇧F format · ⌘S download · ESC back</span>
      </div>
    </div>
  )
}
