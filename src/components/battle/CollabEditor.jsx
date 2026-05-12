import React, { useState, useEffect, useRef, lazy, Suspense } from 'react'
import supabase from '../../lib/supabase'

const MonacoEditor = lazy(() => import('@monaco-editor/react'))

function genRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
function genFileId() {
  return Math.random().toString(36).substring(2, 10)
}

const LANGUAGES = [
  { id: 'plaintext', name: 'Plain Text', ext: 'txt', icon: '📝', template: '' },
  { id: 'markdown', name: 'Markdown', ext: 'md', icon: '📖', template: '# Hello\n\nstart writing...\n\n- one\n- two\n' },
  { id: 'javascript', name: 'JavaScript', ext: 'js', icon: '🟨', template: '// collab away\nconsole.log("hello")\n' },
  { id: 'typescript', name: 'TypeScript', ext: 'ts', icon: '🔷', template: 'const greet = (n: string): string => `hi ${n}`\nconsole.log(greet("world"))\n' },
  { id: 'python', name: 'Python', ext: 'py', icon: '🐍', template: 'print("hello")\n' },
  { id: 'html', name: 'HTML', ext: 'html', icon: '🌐', template: '<!DOCTYPE html>\n<html><body><h1>hi</h1></body></html>\n' },
  { id: 'css', name: 'CSS', ext: 'css', icon: '🎨', template: 'body {\n  font-family: system-ui;\n}\n' },
  { id: 'json', name: 'JSON', ext: 'json', icon: '📋', template: '{\n  "name": "collab"\n}\n' },
  { id: 'sql', name: 'SQL', ext: 'sql', icon: '🗄️', template: 'SELECT * FROM users WHERE active = true;\n' },
  { id: 'shell', name: 'Shell', ext: 'sh', icon: '💻', template: '#!/bin/bash\necho "hello"\n' },
]

const TEMPLATES = [
  { id: 'blank', name: 'Blank', emoji: '✨', desc: 'start from scratch', lang: 'markdown', code: '' },
  {
    id: 'meeting',
    name: 'Meeting Notes',
    emoji: '📝',
    desc: 'agenda, notes, action items',
    lang: 'markdown',
    code: `# Meeting — ${new Date().toLocaleDateString()}\n\n**attendees:** \n\n## agenda\n- \n\n## notes\n- \n\n## action items\n- [ ] \n- [ ] \n`,
  },
  {
    id: 'interview',
    name: 'Interview Prep',
    emoji: '💼',
    desc: 'pair on a coding problem',
    lang: 'javascript',
    code: `// Problem: two-sum\n// given an array of integers and a target, return indices of two numbers that add to target\n\nfunction twoSum(nums, target) {\n  // your solution here\n}\n\nconsole.log(twoSum([2, 7, 11, 15], 9)) // [0, 1]\n`,
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm',
    emoji: '💡',
    desc: 'ideas board',
    lang: 'markdown',
    code: `# Brainstorm\n\n## the question\n> \n\n## ideas\n- \n- \n- \n\n## top picks\n1. \n2. \n3. \n`,
  },
  {
    id: 'standup',
    name: 'Standup',
    emoji: '☀️',
    desc: 'daily check-in',
    lang: 'markdown',
    code: `# Standup — ${new Date().toLocaleDateString()}\n\n## yesterday\n- \n\n## today\n- \n\n## blockers\n- \n`,
  },
  {
    id: 'snippet',
    name: 'Code Snippet',
    emoji: '💻',
    desc: 'quick share & run',
    lang: 'javascript',
    code: `// quick experiment\nconst data = [1, 2, 3, 4, 5]\nconst sum = data.reduce((a, b) => a + b, 0)\nconsole.log({ data, sum })\n`,
  },
]

const SNIPPETS = {
  javascript: [
    { name: 'fetch', code: "const res = await fetch('https://api.example.com')\nconst data = await res.json()\nconsole.log(data)" },
    { name: 'debounce', code: "const debounce = (fn, ms) => {\n  let t\n  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }\n}" },
    { name: 'try/catch', code: "try {\n  // ...\n} catch (e) {\n  console.error(e)\n}" },
  ],
  python: [
    { name: 'list comp', code: "squares = [x*x for x in range(10)]\nprint(squares)" },
    { name: 'fibonacci', code: "def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a+b\n    return a" },
  ],
  markdown: [
    { name: 'table', code: "| col1 | col2 |\n|------|------|\n| a    | b    |" },
    { name: 'task list', code: "- [ ] todo\n- [x] done" },
    { name: 'callout', code: "> 💡 **tip:** \n" },
  ],
  sql: [
    { name: 'join', code: "SELECT u.name, o.total\nFROM users u\nJOIN orders o ON o.user_id = u.id;" },
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
  // tables first (before other line-based parsing)
  let html = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // code blocks
  html = html.replace(/```([\s\S]*?)```/g, (_, c) =>
    `<pre class="bg-muted/40 p-3 rounded-lg overflow-x-auto my-3 text-xs"><code>${c}</code></pre>`)

  // tables: |a|b| \n |---|---| \n |c|d|
  html = html.replace(/((?:^\|[^\n]+\|\n?)+)/gm, (block) => {
    const lines = block.trim().split('\n').filter(l => l.trim())
    if (lines.length < 2 || !/^\|[\s:-]+\|/.test(lines[1])) return block
    const headers = lines[0].split('|').slice(1, -1).map(s => s.trim())
    const rows = lines.slice(2).map(l => l.split('|').slice(1, -1).map(s => s.trim()))
    const thead = `<thead><tr>${headers.map(h => `<th class="px-3 py-2 text-left font-semibold border-b border-border/40 bg-muted/30">${h}</th>`).join('')}</tr></thead>`
    const tbody = `<tbody>${rows.map((r, ri) => `<tr class="${ri % 2 ? 'bg-muted/10' : ''}">${r.map(c => `<td class="px-3 py-2 border-b border-border/20">${c}</td>`).join('')}</tr>`).join('')}</tbody>`
    return `<div class="overflow-x-auto my-3"><table class="w-full text-xs border border-border/40 rounded-lg overflow-hidden">${thead}${tbody}</table></div>`
  })

  html = html
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" class="max-w-full rounded-lg my-2 border border-border/30" loading="lazy" />')
    .replace(/`([^`]+)`/g, '<code class="bg-muted/40 px-1 rounded text-[0.9em]">$1</code>')
    .replace(/^### (.*)$/gm, '<h3 class="text-base font-bold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2">$1</h2>')
    .replace(/^# (.*)$/gm, '<h1 class="text-xl font-bold mt-5 mb-3">$1</h1>')
    .replace(/^> (.*)$/gm, '<blockquote class="border-l-2 border-accent pl-3 my-2 italic opacity-80">$1</blockquote>')
    .replace(/^---+$/gm, '<hr class="border-border/30 my-4" />')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-accent underline" href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^- \[ \] (.*)$/gm, '<div class="flex items-start gap-2 my-1"><input type="checkbox" disabled class="mt-1" /><span>$1</span></div>')
    .replace(/^- \[x\] (.*)$/gm, '<div class="flex items-start gap-2 my-1 opacity-60"><input type="checkbox" checked disabled class="mt-1" /><s>$1</s></div>')
    .replace(/^\d+\. (.*)$/gm, '<li class="ml-4">$1</li>')
    .replace(/^- (.*)$/gm, '<li class="ml-4">$1</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/g, m => `<ul class="list-disc my-2 space-y-1">${m}</ul>`)
    .replace(/\n\n/g, '</p><p class="my-2">')
  return `<p class="my-2">${html}</p>`
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function CollabEditor({ onBack }) {
  const [phase, setPhase] = useState('lobby')
  const [userName, setUserName] = useState(() => localStorage.getItem('collab:name') || '')
  const [roomCode, setRoomCode] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [files, setFiles] = useState([
    { id: genFileId(), name: 'main', lang: 'markdown', code: LANGUAGES[1].template }
  ])
  const [activeFileId, setActiveFileId] = useState(null)
  const [users, setUsers] = useState([])
  const [typing, setTyping] = useState({})
  const [remoteCursors, setRemoteCursors] = useState({}) // {name: {x,y,color,fileId,lastUpdate}}
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [consoleOutput, setConsoleOutput] = useState([])
  const [activeTab, setActiveTab] = useState('chat')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [previewOpen, setPreviewOpen] = useState(true)
  const [fontSize, setFontSize] = useState(15)
  const [wordWrap, setWordWrap] = useState(true)
  const [editorTheme, setEditorTheme] = useState('auto')
  const [reactions, setReactions] = useState([])
  const [activity, setActivity] = useState([])
  const [showSnippets, setShowSnippets] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [renamingFileId, setRenamingFileId] = useState(null)
  const [recentRooms, setRecentRooms] = useState(() => {
    try { return JSON.parse(localStorage.getItem('collab:recent') || '[]') } catch { return [] }
  })
  const [copyStatus, setCopyStatus] = useState('')
  // Pomodoro
  const [timerOpen, setTimerOpen] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(25 * 60)
  const [timerStartedAt, setTimerStartedAt] = useState(null)
  const [timerDuration, setTimerDuration] = useState(25 * 60)

  const channelRef = useRef(null)
  const editorRef = useRef(null)
  const monacoRef = useRef(null)
  const suppressSync = useRef(false)
  const chatEndRef = useRef(null)
  const reactionIdRef = useRef(0)
  const activityIdRef = useRef(0)
  const cursorThrottleRef = useRef(0)

  const siteIsDark = useIsDark()
  const monacoTheme = editorTheme === 'auto' ? (siteIsDark ? 'vs-dark' : 'vs') : (editorTheme === 'dark' ? 'vs-dark' : 'vs')

  const activeFile = files.find(f => f.id === activeFileId) || files[0]
  const currentLang = LANGUAGES.find(l => l.id === (activeFile?.lang || 'markdown')) || LANGUAGES[0]
  const code = activeFile?.code || ''
  const language = activeFile?.lang || 'markdown'
  const typingUsers = Object.keys(typing).filter(n => n !== userName)
  const showPreview = language === 'markdown' && previewOpen
  const showRun = language === 'javascript' || language === 'typescript'
  const availableSnippets = SNIPPETS[language] || []

  useEffect(() => {
    if (!activeFileId && files[0]) setActiveFileId(files[0].id)
  }, [files, activeFileId])

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
    const r = params.get('room')
    if (r) setRoomCode(r.toUpperCase())
  }, [])

  useEffect(() => () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }, [])
  useEffect(() => { localStorage.setItem('collab:name', userName) }, [userName])

  // Pomodoro tick
  useEffect(() => {
    if (!timerRunning) return
    const i = setInterval(() => {
      setTimerSeconds(s => {
        if (s <= 1) {
          setTimerRunning(false)
          pushActivity('⏰ pomodoro finished!', 'system')
          try { new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==').play() } catch {}
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(i)
  }, [timerRunning])

  const pushActivity = (text, type = 'info', color) => {
    const id = ++activityIdRef.current
    setActivity(prev => [{ id, text, type, color, time: Date.now() }, ...prev].slice(0, 50))
  }

  const rememberRoom = (code) => {
    const next = [{ code, time: Date.now() }, ...recentRooms.filter(r => r.code !== code)].slice(0, 5)
    setRecentRooms(next)
    localStorage.setItem('collab:recent', JSON.stringify(next))
  }

  const createRoom = (template) => {
    if (!userName.trim()) return
    const code = genRoomCode()
    setRoomCode(code)
    setIsHost(true)
    if (template) {
      setFiles([{ id: genFileId(), name: template.id === 'blank' ? 'main' : template.id, lang: template.lang, code: template.code }])
    }
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
        const list = Object.values(state).flat()
        setUsers(prev => {
          // detect joiners
          const prevNames = new Set(prev.map(u => u.name))
          list.forEach(u => { if (!prevNames.has(u.name) && u.name !== name) pushActivity(`${u.name} joined`, 'join', u.color) })
          const newNames = new Set(list.map(u => u.name))
          prev.forEach(u => { if (!newNames.has(u.name) && u.name !== name) pushActivity(`${u.name} left`, 'leave', u.color) })
          return list
        })
      })
      .on('broadcast', { event: 'code-change' }, ({ payload }) => {
        if (payload.name !== name) {
          suppressSync.current = true
          setFiles(prev => prev.map(f => f.id === payload.fileId ? { ...f, code: payload.code } : f))
          setTimeout(() => { suppressSync.current = false }, 50)
        }
      })
      .on('broadcast', { event: 'file-sync' }, ({ payload }) => {
        if (payload.name !== name) {
          setFiles(payload.files)
        }
      })
      .on('broadcast', { event: 'request-state' }, ({ payload }) => {
        if (payload.name === name) return
        // host responds with current state
        if (isHost || users[0]?.name === name) {
          channelRef.current?.send({ type: 'broadcast', event: 'file-sync', payload: { name, files } })
        }
      })
      .on('broadcast', { event: 'chat-message' }, ({ payload }) => {
        setChatMessages(prev => [...prev.slice(-100), payload])
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.name === name) return
        setTyping(prev => ({ ...prev, [payload.name]: Date.now() }))
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        if (payload.name === name) return
        setRemoteCursors(prev => ({ ...prev, [payload.name]: { ...payload, lastUpdate: Date.now() } }))
      })
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        spawnReaction(payload.emoji, payload.name, payload.color)
        pushActivity(`${payload.name} reacted ${payload.emoji}`, 'reaction', payload.color)
      })
      .on('broadcast', { event: 'timer' }, ({ payload }) => {
        if (payload.name === name) return
        setTimerDuration(payload.duration)
        setTimerSeconds(payload.seconds)
        setTimerRunning(payload.running)
        setTimerStartedAt(payload.startedAt)
        if (payload.action) pushActivity(`${payload.name} ${payload.action} timer`, 'system', payload.color)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ name, color: getColor(name), joined_at: new Date().toISOString() })
          // ask for current state
          setTimeout(() => {
            channel.send({ type: 'broadcast', event: 'request-state', payload: { name } })
          }, 300)
        }
      })

    channelRef.current = channel
  }

  // clean stale cursors
  useEffect(() => {
    const i = setInterval(() => {
      setRemoteCursors(prev => {
        const now = Date.now()
        const next = {}
        Object.entries(prev).forEach(([k, v]) => { if (now - v.lastUpdate < 5000) next[k] = v })
        return next
      })
      setTyping(prev => {
        const now = Date.now()
        const next = {}
        Object.entries(prev).forEach(([k, t]) => { if (now - t < 2000) next[k] = t })
        return next
      })
    }, 1000)
    return () => clearInterval(i)
  }, [])

  const spawnReaction = (emoji, name, color) => {
    const id = ++reactionIdRef.current
    const x = 20 + Math.random() * 60
    setReactions(prev => [...prev, { id, emoji, name, color, x }])
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 3000)
  }

  const sendReaction = (emoji) => {
    const color = getColor(userName)
    spawnReaction(emoji, userName, color)
    channelRef.current?.send({ type: 'broadcast', event: 'reaction', payload: { emoji, name: userName, color } })
    setShowReactionPicker(false)
  }

  const handleCodeChange = (newCode) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, code: newCode || '' } : f))
    if (!suppressSync.current && channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'code-change', payload: { name: userName, fileId: activeFileId, code: newCode } })
      channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { name: userName } })
    }
  }

  const handleLanguageChange = (langId) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, lang: langId } : f))
    const next = files.map(f => f.id === activeFileId ? { ...f, lang: langId } : f)
    channelRef.current?.send({ type: 'broadcast', event: 'file-sync', payload: { name: userName, files: next } })
  }

  const addFile = () => {
    const id = genFileId()
    const newFile = { id, name: `file-${files.length + 1}`, lang: 'plaintext', code: '' }
    const next = [...files, newFile]
    setFiles(next)
    setActiveFileId(id)
    channelRef.current?.send({ type: 'broadcast', event: 'file-sync', payload: { name: userName, files: next } })
    pushActivity(`${userName} added a file`, 'file', getColor(userName))
  }

  const removeFile = (id) => {
    if (files.length === 1) return
    const next = files.filter(f => f.id !== id)
    setFiles(next)
    if (activeFileId === id) setActiveFileId(next[0]?.id)
    channelRef.current?.send({ type: 'broadcast', event: 'file-sync', payload: { name: userName, files: next } })
  }

  const renameFile = (id, name) => {
    const safe = (name || 'file').trim() || 'file'
    const next = files.map(f => f.id === id ? { ...f, name: safe } : f)
    setFiles(next)
    channelRef.current?.send({ type: 'broadcast', event: 'file-sync', payload: { name: userName, files: next } })
  }

  const insertSnippet = (snippet) => {
    const editor = editorRef.current
    if (!editor) {
      handleCodeChange(code + (code.endsWith('\n') ? '' : '\n') + snippet.code + '\n')
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
      setConsoleOutput([{ type: 'warn', text: `Run not supported for ${currentLang.name}.` }])
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
    pushActivity(`${userName} ran the code`, 'run', getColor(userName))
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
    editor.onDidChangeCursorPosition(() => {
      const now = Date.now()
      if (now - cursorThrottleRef.current < 80) return
      cursorThrottleRef.current = now
      const pos = editor.getPosition()
      if (!pos) return
      const coords = editor.getScrolledVisiblePosition(pos)
      if (!coords) return
      const dom = editor.getDomNode()
      const rect = dom?.getBoundingClientRect()
      if (!rect) return
      channelRef.current?.send({
        type: 'broadcast',
        event: 'cursor',
        payload: {
          name: userName,
          color: getColor(userName),
          fileId: activeFileId,
          line: pos.lineNumber,
          column: pos.column,
          top: coords.top,
          left: coords.left,
        }
      })
    })
  }

  const formatCode = () => editorRef.current?.getAction('editor.action.formatDocument')?.run()

  const insertImage = () => {
    const url = prompt('Paste image URL (or drag-drop into editor)\n\nTip: use Giphy, Imgur, Unsplash, or any direct image link')
    if (!url || !url.trim()) return
    const alt = prompt('Alt text (optional):', 'image') || 'image'
    const md = `![${alt}](${url.trim()})`
    const editor = editorRef.current
    if (editor) {
      const sel = editor.getSelection()
      editor.executeEdits('img', [{ range: sel, text: md, forceMoveMarkers: true }])
      editor.focus()
    } else {
      handleCodeChange(code + '\n' + md + '\n')
    }
    if (language !== 'markdown') {
      flash('switch to markdown to see preview')
    }
  }

  const downloadFile = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeFile?.name || 'collab'}.${currentLang.ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadAll = async () => {
    if (files.length === 1) { downloadFile(); return }
    const { default: JSZip } = await import('jszip')
    const zip = new JSZip()
    files.forEach(f => {
      const lang = LANGUAGES.find(l => l.id === f.lang) || LANGUAGES[0]
      zip.file(`${f.name}.${lang.ext}`, f.code)
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `collab-${roomCode}.zip`
    a.click()
    URL.revokeObjectURL(url)
    flash(`zipped ${files.length} files!`)
  }

  const [showShareModal, setShowShareModal] = useState(false)

  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    flash('copied!')
  }

  const copyInvite = async () => {
    setShowShareModal(true)
  }

  const doCopyInvite = async () => {
    const url = `${window.location.origin}/#/collab?room=${roomCode}`
    await navigator.clipboard.writeText(url)
    flash('invite link copied!')
  }

  const flash = (msg) => {
    setCopyStatus(msg)
    setTimeout(() => setCopyStatus(''), 1500)
  }

  const clearEditor = () => {
    if (!confirm('Clear active file for everyone?')) return
    handleCodeChange('')
  }

  // Pomodoro controls
  const broadcastTimer = (action, overrides = {}) => {
    const payload = {
      name: userName,
      color: getColor(userName),
      action,
      duration: timerDuration,
      seconds: timerSeconds,
      running: timerRunning,
      startedAt: timerStartedAt,
      ...overrides,
    }
    channelRef.current?.send({ type: 'broadcast', event: 'timer', payload })
  }
  const startTimer = () => {
    setTimerRunning(true)
    setTimerStartedAt(Date.now())
    broadcastTimer('started', { running: true, startedAt: Date.now() })
    pushActivity(`${userName} started timer`, 'system', getColor(userName))
  }
  const pauseTimer = () => {
    setTimerRunning(false)
    broadcastTimer('paused', { running: false })
  }
  const resetTimer = (mins = 25) => {
    setTimerRunning(false)
    setTimerDuration(mins * 60)
    setTimerSeconds(mins * 60)
    broadcastTimer('reset', { running: false, duration: mins * 60, seconds: mins * 60 })
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
  }, [code, phase, language, roomCode, activeFileId])

  // ── LOBBY ──
  if (phase === 'lobby') return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-accent/5 blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="flex items-center px-6 py-4 border-b border-border/20 relative z-10">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors">
          ← Back to site
        </button>
        <h1 className="ml-4 text-lg font-bold flex items-center gap-2">👥 Collab Editor</h1>
        <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          live
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-8 relative z-10">
        <div className="w-[680px] max-w-full space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 mb-4 relative">
              <span className="text-4xl">👥</span>
              {userName.trim() && (
                <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white ring-4 ring-background"
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
              <button onClick={() => createRoom(TEMPLATES[0])} disabled={!userName.trim()}
                className="col-span-2 py-3 rounded-xl bg-accent text-accent-foreground font-semibold hover:opacity-90 transition disabled:opacity-30">
                ✨ new room
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

          {/* Template gallery */}
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">or start from a template</div>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button key={t.id} onClick={() => createRoom(t)} disabled={!userName.trim()}
                  className="group text-left p-3 rounded-xl bg-card/60 hover:bg-card border border-border/30 hover:border-accent/60 transition disabled:opacity-30 disabled:cursor-not-allowed">
                  <div className="text-2xl mb-1 group-hover:scale-110 transition-transform inline-block">{t.emoji}</div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">{t.desc}</div>
                </button>
              ))}
            </div>
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
        </div>
      </div>
    </div>
  )

  // ── EDITOR ──
  const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0')
  const secs = (timerSeconds % 60).toString().padStart(2, '0')
  const timerPct = ((timerDuration - timerSeconds) / timerDuration) * 100

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
          style={{ color: 'var(--color-foreground)', backgroundColor: 'var(--color-card)' }}
          className="px-2 py-1 rounded-md text-sm border border-border/40 outline-none focus:border-accent/50 cursor-pointer">
          {LANGUAGES.map(l => <option key={l.id} value={l.id} style={{ backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)' }}>{l.icon} {l.name}</option>)}
        </select>

        <div className="flex items-center gap-0.5">
          {availableSnippets.length > 0 && (
            <div className="relative">
              <button onClick={() => setShowSnippets(s => !s)} title="snippets"
                className={`px-2 py-1 rounded-md text-sm hover:bg-muted/30 ${showSnippets ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:text-foreground'}`}>
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
          <button onClick={insertImage} title="insert image" className="px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30">🖼</button>
          <button onClick={copyCode} title="copy all" className="px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30">📋</button>
          <button onClick={downloadFile} title="download active (⌘S)" className="px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30">⬇</button>
          <button onClick={downloadAll} title="download all files" className="px-1.5 py-1 rounded-md text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/30">⬇all</button>
          <button onClick={() => setWordWrap(w => !w)} title="word wrap" className={`px-2 py-1 rounded-md text-sm hover:bg-muted/30 ${wordWrap ? 'text-accent' : 'text-muted-foreground'}`}>↵</button>
          <button onClick={() => setFontSize(f => Math.max(10, f - 1))} title="smaller" className="px-1.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30">A−</button>
          <span className="text-xs text-muted-foreground w-6 text-center">{fontSize}</span>
          <button onClick={() => setFontSize(f => Math.min(28, f + 1))} title="bigger" className="px-1.5 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30">A+</button>
          <button onClick={clearEditor} title="clear all" className="px-2 py-1 rounded-md text-sm text-muted-foreground hover:text-red-400 hover:bg-muted/30">🗑</button>
        </div>

        <select value={editorTheme} onChange={e => setEditorTheme(e.target.value)}
          style={{ color: 'var(--color-foreground)', backgroundColor: 'var(--color-card)' }}
          className="px-2 py-1 rounded-md text-xs border border-border/40 outline-none cursor-pointer"
          title="editor theme">
          <option value="auto" style={{ backgroundColor: 'var(--color-card)' }}>auto</option>
          <option value="light" style={{ backgroundColor: 'var(--color-card)' }}>light</option>
          <option value="dark" style={{ backgroundColor: 'var(--color-card)' }}>dark</option>
        </select>

        {language === 'markdown' && (
          <button onClick={() => setPreviewOpen(p => !p)}
            className={`px-2 py-1 rounded-md text-xs font-medium ${previewOpen ? 'bg-accent/20 text-accent' : 'bg-muted/30 text-muted-foreground hover:text-foreground'}`}>
            👁 preview
          </button>
        )}

        {/* Pomodoro */}
        <div className="relative">
          <button onClick={() => setTimerOpen(t => !t)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono ${timerRunning ? 'bg-accent/20 text-accent' : 'bg-muted/30 text-muted-foreground hover:text-foreground'}`}
            title="pomodoro timer">
            ⏱ {mins}:{secs}
          </button>
          {timerOpen && (
            <div className="absolute top-full mt-1 right-0 w-64 bg-card border border-border/40 rounded-xl shadow-2xl z-50 p-3">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold tabular-nums my-2">{mins}:{secs}</div>
                <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-accent transition-all" style={{ width: `${timerPct}%` }} />
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                {timerRunning ? (
                  <button onClick={pauseTimer} className="flex-1 py-1.5 rounded-lg bg-muted/40 text-sm font-medium hover:bg-muted/60">pause</button>
                ) : (
                  <button onClick={startTimer} className="flex-1 py-1.5 rounded-lg bg-accent text-accent-foreground text-sm font-medium">start</button>
                )}
                <button onClick={() => resetTimer(25)} className="flex-1 py-1.5 rounded-lg bg-muted/40 text-sm font-medium hover:bg-muted/60">reset</button>
              </div>
              <div className="flex gap-1 mt-2 justify-center">
                {[5, 15, 25, 45].map(m => (
                  <button key={m} onClick={() => resetTimer(m)}
                    className="flex-1 py-1 rounded-md text-xs bg-muted/30 hover:bg-muted/50">{m}m</button>
                ))}
              </div>
              <div className="text-[10px] text-muted-foreground text-center mt-2">shared with everyone in room</div>
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={() => setShowReactionPicker(s => !s)}
            className={`px-2 py-1 rounded-md text-sm hover:bg-muted/30 ${showReactionPicker ? 'bg-accent/20 text-accent' : 'text-muted-foreground hover:text-foreground'}`}
            title="send reaction">
            😀
          </button>
          {showReactionPicker && (
            <div className="absolute top-full mt-1 right-0 flex gap-1 p-1.5 bg-card border border-border/40 rounded-xl shadow-2xl z-50">
              {REACTIONS.map(e => (
                <button key={e} onClick={() => sendReaction(e)} className="text-xl hover:scale-125 transition-transform p-1">{e}</button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center">
          {users.slice(0, 6).map((u, i) => (
            <div key={i}
              className={`group relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-background cursor-default ${typing[u.name] ? 'ring-accent' : ''}`}
              style={{ background: u.color, marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i }}>
              {u.name.charAt(0).toUpperCase()}
              {typing[u.name] && (
                <span className="absolute -bottom-0.5 -right-0.5 flex gap-0.5">
                  <span className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                </span>
              )}
              {/* custom tooltip */}
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-foreground text-background text-[11px] font-medium whitespace-nowrap shadow-lg transition-opacity z-50">
                <div className="font-bold" style={{ color: u.color }}>{u.name}{u.name === userName && ' (you)'}</div>
                <div className="text-[10px] opacity-70">{typing[u.name] ? 'typing...' : 'online'}</div>
              </div>
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

      {/* File tabs */}
      <div className="flex items-center gap-0.5 px-2 py-1 bg-card/40 border-b border-border/20 flex-shrink-0 overflow-x-auto">
        {files.map(f => {
          const lang = LANGUAGES.find(l => l.id === f.lang) || LANGUAGES[0]
          const isActive = f.id === activeFileId
          return (
            <div key={f.id}
              className={`group flex items-center gap-1 pl-2 pr-1 py-1 rounded-md text-xs cursor-pointer ${isActive ? 'bg-background text-foreground' : 'text-muted-foreground hover:bg-muted/20'}`}
              onClick={() => setActiveFileId(f.id)}>
              <span>{lang.icon}</span>
              {renamingFileId === f.id ? (
                <input autoFocus value={f.name}
                  onChange={e => renameFile(f.id, e.target.value)}
                  onBlur={() => setRenamingFileId(null)}
                  onKeyDown={e => { if (e.key === 'Enter') setRenamingFileId(null) }}
                  style={{ color: 'var(--color-foreground)' }}
                  className="bg-transparent outline-none w-20 text-xs" />
              ) : (
                <span onDoubleClick={() => setRenamingFileId(f.id)} className="select-none">{f.name}.{lang.ext}</span>
              )}
              {files.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); removeFile(f.id) }}
                  className="opacity-0 group-hover:opacity-100 ml-1 w-4 h-4 rounded hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center text-[10px]">
                  ✕
                </button>
              )}
            </div>
          )
        })}
        <button onClick={addFile}
          className="ml-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30">
          + new file
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

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowShareModal(false)}>
          <div className="bg-card border border-border/40 rounded-2xl p-6 max-w-md w-[90vw] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">🔗 Invite to this room</h3>
              <button onClick={() => setShowShareModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 font-semibold">room code</div>
                <div className="text-3xl font-mono font-bold text-accent tracking-widest text-center py-3 bg-muted/30 rounded-xl">
                  {roomCode}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1 font-semibold">invite link</div>
                <div className="flex gap-2">
                  <input readOnly value={`${window.location.origin}/#/collab?room=${roomCode}`}
                    style={{ color: 'var(--color-foreground)', backgroundColor: 'var(--color-background)' }}
                    className="flex-1 px-3 py-2 rounded-lg border border-border/40 text-xs font-mono outline-none" />
                  <button onClick={doCopyInvite}
                    className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90">
                    copy
                  </button>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <a href={`https://wa.me/?text=${encodeURIComponent(`join my collab room: ${window.location.origin}/#/collab?room=${roomCode}`)}`}
                  target="_blank" rel="noopener"
                  className="flex-1 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-xs font-medium text-center">
                  📱 WhatsApp
                </a>
                <a href={`mailto:?subject=Join my collab room&body=${encodeURIComponent(`${window.location.origin}/#/collab?room=${roomCode}`)}`}
                  className="flex-1 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-xs font-medium text-center">
                  ✉ Email
                </a>
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`collab with me: ${window.location.origin}/#/collab?room=${roomCode}`)}`}
                  target="_blank" rel="noopener"
                  className="flex-1 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-xs font-medium text-center">
                  🐦 Twitter
                </a>
              </div>
              <div className="text-[11px] text-muted-foreground text-center pt-1">
                anyone with this link can join and edit
              </div>
            </div>
          </div>
        </div>
      )}

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
        <div className="flex-1 flex min-w-0 relative">
          <div className={`min-h-0 relative ${showPreview ? 'flex-1 border-r border-border/30' : 'flex-1'}`}>
            <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-5 h-5 border-2 border-muted-foreground/20 border-t-accent rounded-full animate-spin" /></div>}>
              <MonacoEditor
                key={activeFileId}
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

            {/* remote cursors overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {Object.values(remoteCursors).filter(c => c.fileId === activeFileId).map((c, i) => (
                <div key={i} className="absolute" style={{ top: c.top, left: c.left, transform: 'translate(0, 0)' }}>
                  <div className="w-0.5 h-5" style={{ background: c.color }} />
                  <div className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white whitespace-nowrap shadow"
                    style={{ background: c.color, marginTop: -2 }}>
                    {c.name}
                  </div>
                </div>
              ))}
            </div>
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
            <div className="flex items-center border-b border-border/20 px-1 flex-shrink-0 overflow-x-auto">
              {[
                { id: 'chat', label: '💬 chat', badge: chatMessages.length },
                { id: 'activity', label: '⚡ activity', badge: activity.length },
                { id: 'console', label: '› console', badge: consoleOutput.length },
                { id: 'users', label: `👥 ${users.length}` },
              ].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`px-2.5 py-2 text-xs font-medium transition-colors relative whitespace-nowrap ${activeTab === t.id ? 'text-accent border-b-2 border-accent' : 'text-muted-foreground hover:text-foreground'}`}>
                  {t.label}
                  {t.badge > 0 && activeTab !== t.id && (
                    <span className="absolute top-1.5 right-0.5 w-1.5 h-1.5 rounded-full bg-accent" />
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

            {activeTab === 'activity' && (
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5" style={{ scrollbarWidth: 'thin' }}>
                {activity.length === 0 ? (
                  <p className="text-muted-foreground/40 text-xs text-center py-6">no activity yet</p>
                ) : activity.map(a => (
                  <div key={a.id} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: a.color || 'var(--color-muted-foreground)' }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground/90 break-words">{a.text}</div>
                      <div className="text-[10px] text-muted-foreground/50">{timeAgo(a.time)}</div>
                    </div>
                  </div>
                ))}
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
        <span>· {activeFile?.name}.{currentLang.ext}</span>
        <span>· {code.split('\n').length} lines · {code.length} chars</span>
        <span>· 👥 {users.length}</span>
        <span>· {files.length} file{files.length !== 1 ? 's' : ''}</span>
        <span className="ml-auto opacity-70">⌘↵ run · ⌘⇧F format · ⌘S download · ESC back</span>
      </div>
    </div>
  )
}
