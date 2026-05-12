import React, { useState, useEffect, useRef, lazy, Suspense } from 'react'
import supabase from '../../lib/supabase'

const MonacoEditor = lazy(() => import('@monaco-editor/react'))

function genRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: '🟨', template: '// Start coding together!\nconsole.log("Hello, world!");\n' },
  { id: 'typescript', name: 'TypeScript', icon: '🔷', template: '// Start coding together!\nconst greet = (name: string): string => `Hello, ${name}!`;\nconsole.log(greet("world"));\n' },
  { id: 'python', name: 'Python', icon: '🐍', template: '# Start coding together!\nprint("Hello, world!")\n' },
  { id: 'html', name: 'HTML', icon: '🌐', template: '<!DOCTYPE html>\n<html>\n<head><title>Collab</title></head>\n<body>\n  <h1>Hello, world!</h1>\n</body>\n</html>\n' },
  { id: 'css', name: 'CSS', icon: '🎨', template: '/* Start styling together! */\nbody {\n  font-family: system-ui;\n  background: #0f0f17;\n  color: white;\n}\n' },
  { id: 'json', name: 'JSON', icon: '📋', template: '{\n  "name": "collab-project",\n  "version": "1.0.0"\n}\n' },
]

export default function CollabEditor({ onBack }) {
  const [phase, setPhase] = useState('lobby') // lobby, editor
  const [userName, setUserName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(LANGUAGES[0].template)
  const [users, setUsers] = useState([])
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [consoleOutput, setConsoleOutput] = useState([])
  const [activeTab, setActiveTab] = useState('console') // console, chat
  const [cursorPositions, setCursorPositions] = useState({})
  const channelRef = useRef(null)
  const editorRef = useRef(null)
  const suppressSync = useRef(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [])

  // ── CREATE ROOM ──
  const createRoom = () => {
    if (!userName.trim()) return
    const code = genRoomCode()
    setRoomCode(code)
    setIsHost(true)
    joinChannel(code, userName.trim())
    setPhase('editor')
  }

  // ── JOIN ROOM ──
  const joinRoom = () => {
    if (!userName.trim() || roomCode.length < 6) return
    joinChannel(roomCode.trim().toUpperCase(), userName.trim())
    setPhase('editor')
  }

  // ── SUPABASE CHANNEL ──
  const joinChannel = (room, name) => {
    const channel = supabase.channel(`collab-${room}`, {
      config: { presence: { key: crypto.randomUUID().slice(0, 8) } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const players = Object.values(state).flat()
        setUsers(players)
      })
      .on('broadcast', { event: 'code-change' }, ({ payload }) => {
        if (payload.name !== name) {
          suppressSync.current = true
          setCode(payload.code)
          setTimeout(() => { suppressSync.current = false }, 50)
        }
      })
      .on('broadcast', { event: 'language-change' }, ({ payload }) => {
        setLanguage(payload.language)
        const tmpl = LANGUAGES.find(l => l.id === payload.language)
        if (tmpl) setCode(tmpl.template)
      })
      .on('broadcast', { event: 'chat-message' }, ({ payload }) => {
        setChatMessages(prev => [...prev.slice(-50), payload])
      })
      .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        if (payload.name !== name) {
          setCursorPositions(prev => ({ ...prev, [payload.name]: payload.position }))
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ name, color: getColor(name), joined_at: new Date().toISOString() })
        }
      })

    channelRef.current = channel
  }

  // ── SYNC CODE CHANGES ──
  const handleCodeChange = (newCode) => {
    setCode(newCode || '')
    if (!suppressSync.current && channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'code-change', payload: { name: userName, code: newCode } })
    }
  }

  // ── CHANGE LANGUAGE ──
  const handleLanguageChange = (langId) => {
    setLanguage(langId)
    const tmpl = LANGUAGES.find(l => l.id === langId)
    if (tmpl) setCode(tmpl.template)
    channelRef.current?.send({ type: 'broadcast', event: 'language-change', payload: { language: langId } })
  }

  // ── RUN CODE ──
  const runCode = () => {
    setConsoleOutput([])
    const logs = []
    const fakeConsole = { log: (...args) => logs.push({ type: 'log', text: args.map(String).join(' ') }), error: (...args) => logs.push({ type: 'error', text: args.map(String).join(' ') }), warn: (...args) => logs.push({ type: 'warn', text: args.map(String).join(' ') }) }
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('console', code)
      fn(fakeConsole)
      if (logs.length === 0) logs.push({ type: 'log', text: '✓ Code ran successfully (no output)' })
    } catch (e) {
      logs.push({ type: 'error', text: `Error: ${e.message}` })
    }
    setConsoleOutput(logs)
    setActiveTab('console')
  }

  // ── SEND CHAT ──
  const sendChat = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    const msg = { name: userName, text: chatInput.trim(), time: Date.now(), color: getColor(userName) }
    channelRef.current?.send({ type: 'broadcast', event: 'chat-message', payload: msg })
    setChatMessages(prev => [...prev.slice(-50), msg])
    setChatInput('')
  }

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMessages])

  // ── CURSOR TRACKING ──
  const handleEditorMount = (editor) => {
    editorRef.current = editor
    editor.onDidChangeCursorPosition((e) => {
      channelRef.current?.send({ type: 'broadcast', event: 'cursor-move', payload: { name: userName, position: e.position } })
    })
  }

  // ── KEYBOARD SHORTCUTS ──
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runCode() }
      if (e.key === 'Escape' && phase === 'lobby') onBack()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [code, phase])

  // ── LOBBY ──
  if (phase === 'lobby') return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex items-center px-6 py-4 border-b border-border/20">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors">
          ← Back to site
        </button>
        <h1 className="ml-4 text-lg font-bold flex items-center gap-2">👥 Collab Editor</h1>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-[480px] max-w-[90vw] space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 mb-4">
              <span className="text-4xl">👥</span>
            </div>
            <h2 className="text-2xl font-bold">Code Together</h2>
            <p className="text-muted-foreground text-sm mt-1">real-time collaborative editor — like Google Docs for code</p>
          </div>

          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Your Name</label>
            <input value={userName} onChange={e => setUserName(e.target.value)} maxLength={15}
              placeholder="enter your name..."
              className="w-full mt-1 px-4 py-3 rounded-xl bg-muted/30 border border-border/30 text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-accent/50 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={createRoom} disabled={!userName.trim()}
              className="py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 transition disabled:opacity-30">
              Create Room
            </button>
            <input value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} maxLength={6}
              placeholder="ROOM CODE"
              className="px-4 rounded-xl bg-muted/30 border border-border/30 text-foreground text-center font-mono uppercase placeholder:text-muted-foreground/30 outline-none focus:border-accent/50" />
          </div>
          {roomCode.length === 6 && (
            <button onClick={joinRoom} disabled={!userName.trim()}
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 transition disabled:opacity-30">
              Join Room: {roomCode}
            </button>
          )}

          <div className="text-center text-xs text-muted-foreground/30">
            supports JavaScript, TypeScript, Python, HTML, CSS, JSON
          </div>
        </div>
      </div>
    </div>
  )

  // ── EDITOR ──
  const currentLang = LANGUAGES.find(l => l.id === language) || LANGUAGES[0]

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center px-4 py-2 bg-card border-b border-border/20 flex-shrink-0 gap-3">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground text-sm transition-colors">
          ← Back
        </button>

        <div className="w-px h-5 bg-border/20" />

        {/* Room code */}
        <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/#/collab?room=${roomCode}`)}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted/30 hover:bg-muted/50 text-sm font-mono transition-colors"
          title="Click to copy invite link">
          <span className="text-accent font-bold">{roomCode}</span>
          <span className="text-muted-foreground text-xs">📋</span>
        </button>

        {/* Language picker */}
        <div className="flex items-center gap-1">
          {LANGUAGES.map(l => (
            <button key={l.id} onClick={() => handleLanguageChange(l.id)}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                language === l.id ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              }`}
              title={l.name}>
              {l.icon}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Online users */}
        <div className="flex items-center gap-1">
          {users.map((u, i) => (
            <div key={i} className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: u.color }} title={u.name}>
              {u.name.charAt(0).toUpperCase()}
            </div>
          ))}
          <span className="text-xs text-muted-foreground ml-1">{users.length} online</span>
        </div>

        {/* Run button */}
        <button onClick={runCode}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors">
          ▶ Run
          <kbd className="text-[9px] text-white/50 ml-1">⌘↵</kbd>
        </button>
      </div>

      {/* Main: Editor + Sidebar */}
      <div className="flex flex-1 min-h-0">
        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 min-h-0">
            <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-accent rounded-full animate-spin" /></div>}>
              <MonacoEditor
                height="100%"
                language={language}
                value={code}
                onChange={handleCodeChange}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 12 },
                  tabSize: 2,
                  smoothScrolling: true,
                  cursorBlinking: 'smooth',
                  formatOnPaste: true,
                }}
              />
            </Suspense>
          </div>

          {/* Console / Chat tabs */}
          <div className="flex-shrink-0 border-t border-border/20 bg-card h-[180px] flex flex-col">
            <div className="flex items-center border-b border-border/10 px-2 flex-shrink-0">
              <button onClick={() => setActiveTab('console')}
                className={`px-3 py-2 text-xs font-medium transition-colors ${activeTab === 'console' ? 'text-accent border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'}`}>
                Console
              </button>
              <button onClick={() => setActiveTab('chat')}
                className={`px-3 py-2 text-xs font-medium transition-colors relative ${activeTab === 'chat' ? 'text-accent border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'}`}>
                Chat
                {chatMessages.length > 0 && activeTab !== 'chat' && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent" />
                )}
              </button>
            </div>

            {activeTab === 'console' ? (
              <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs" style={{ scrollbarWidth: 'thin' }}>
                {consoleOutput.length === 0 ? (
                  <p className="text-muted-foreground/30 py-4 text-center">Press ▶ Run or ⌘↵ to execute code</p>
                ) : consoleOutput.map((log, i) => (
                  <div key={i} className={`py-0.5 ${log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-yellow-400' : 'text-green-400'}`}>
                    {log.type === 'error' ? '✕ ' : log.type === 'warn' ? '⚠ ' : '› '}{log.text}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1" style={{ scrollbarWidth: 'thin' }}>
                  {chatMessages.length === 0 && <p className="text-muted-foreground/30 text-xs text-center py-4">no messages yet</p>}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="font-bold flex-shrink-0" style={{ color: msg.color }}>{msg.name}:</span>
                      <span className="text-foreground/80">{msg.text}</span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={sendChat} className="flex gap-2 px-3 py-2 border-t border-border/10 flex-shrink-0">
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} maxLength={200}
                    placeholder="type a message..."
                    className="flex-1 px-3 py-1.5 rounded-lg bg-muted/20 border border-border/20 text-foreground text-xs placeholder:text-muted-foreground/30 outline-none" />
                  <button type="submit" disabled={!chatInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-semibold disabled:opacity-30">
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center px-4 py-1 bg-accent text-accent-foreground text-[11px] gap-4 flex-shrink-0">
        <span>{currentLang.icon} {currentLang.name}</span>
        <span>👥 {users.length} collaborator{users.length !== 1 ? 's' : ''}</span>
        <span>Room: {roomCode}</span>
        <span className="ml-auto">⌘↵ Run · Real-time sync</span>
      </div>
    </div>
  )
}

function getColor(name) {
  const colors = ['#60a5fa','#f472b6','#34d399','#fbbf24','#a78bfa','#fb923c','#22d3ee','#f87171']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}
