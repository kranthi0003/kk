import React, { useState, useEffect, lazy, Suspense } from 'react'

const MonacoEditor = lazy(() => import('@monaco-editor/react'))

// Fetch file tree + contents from GitHub API
const REPO = 'kranthi0003/kranthi-kiran-site'
const BRANCH = 'main'
const API = `https://api.github.com/repos/${REPO}`

const FILE_ICONS = {
  jsx: '⚛️', js: '📜', ts: '🔷', tsx: '⚛️', css: '🎨', html: '🌐',
  json: '📋', md: '📝', yml: '⚙️', yaml: '⚙️', svg: '🖼️', png: '🖼️',
  jpg: '🖼️', txt: '📄', sh: '🐚', gitignore: '🙈', env: '🔒',
}

const LANG_MAP = {
  jsx: 'javascript', js: 'javascript', ts: 'typescript', tsx: 'typescript',
  css: 'css', html: 'html', json: 'json', md: 'markdown',
  yml: 'yaml', yaml: 'yaml', sh: 'shell', py: 'python',
}

function getIcon(name) {
  const ext = name.split('.').pop()
  return FILE_ICONS[ext] || '📄'
}

function getLang(name) {
  const ext = name.split('.').pop()
  return LANG_MAP[ext] || 'plaintext'
}

export default function CodeBrowser() {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState('idle') // idle, booting, ready, closing
  const [tree, setTree] = useState([])
  const [expandedDirs, setExpandedDirs] = useState(new Set(['src', 'src/components']))
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [treeLoading, setTreeLoading] = useState(true)
  const [bootLines, setBootLines] = useState([])

  const handleOpen = () => {
    setOpen(true)
    setPhase('booting')
    setBootLines([])
    const lines = [
      '> Connecting to github.com...',
      '> Fetching repository tree...',
      '> kranthi0003/kranthi-kiran-site',
      '> Loading Monaco editor...',
      '> Mounting file system...',
      '> Ready.',
    ]
    lines.forEach((line, i) => {
      setTimeout(() => setBootLines(prev => [...prev, line]), i * 400)
    })
    setTimeout(() => setPhase('ready'), lines.length * 400 + 500)
  }

  const handleClose = () => {
    setPhase('closing')
    setTimeout(() => { setOpen(false); setPhase('idle') }, 400)
  }

  useEffect(() => {
    const handler = () => { if (!open) handleOpen(); else handleClose() }
    const escHandler = (e) => { if (e.key === 'Escape' && open) handleClose() }
    window.addEventListener('toggle-code-browser', handler)
    window.addEventListener('keydown', escHandler)
    return () => {
      window.removeEventListener('toggle-code-browser', handler)
      window.removeEventListener('keydown', escHandler)
    }
  }, [open])

  // Fetch repo tree
  useEffect(() => {
    if (!open || tree.length) return
    setTreeLoading(true)
    const cached = sessionStorage.getItem('code_tree')
    if (cached) {
      setTree(JSON.parse(cached))
      setTreeLoading(false)
      return
    }
    fetch(`${API}/git/trees/${BRANCH}?recursive=1`)
      .then(r => r.json())
      .then(data => {
        const files = (data.tree || [])
          .filter(f => f.type === 'blob' && !f.path.includes('node_modules') && !f.path.includes('dist/') && !f.path.startsWith('.'))
          .map(f => ({ path: f.path, size: f.size }))
        setTree(files)
        sessionStorage.setItem('code_tree', JSON.stringify(files))
        setTreeLoading(false)
      })
      .catch(() => setTreeLoading(false))
  }, [open])

  // Load file content
  const openFile = async (path) => {
    setSelectedFile(path)
    setLoading(true)
    const cacheKey = `code_file_${path}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) { setFileContent(cached); setLoading(false); return }

    try {
      const res = await fetch(`${API}/contents/${path}?ref=${BRANCH}`)
      const data = await res.json()
      const content = atob(data.content)
      setFileContent(content)
      sessionStorage.setItem(cacheKey, content)
    } catch {
      setFileContent('// Failed to load file')
    }
    setLoading(false)
  }

  // Auto-open App.jsx
  useEffect(() => {
    if (open && tree.length && !selectedFile) openFile('src/App.jsx')
  }, [open, tree])

  // Build folder structure
  const buildTree = () => {
    const dirs = {}
    tree.forEach(f => {
      const parts = f.path.split('/')
      let current = dirs
      parts.slice(0, -1).forEach(p => {
        if (!current[p]) current[p] = { __files: [], __dirs: {} }
        current = current[p].__dirs
      })
    })

    const renderDir = (dirPath, depth = 0) => {
      const filesInDir = tree.filter(f => {
        const dir = f.path.substring(0, f.path.lastIndexOf('/'))
        return dir === dirPath
      })
      const subDirs = [...new Set(tree
        .filter(f => f.path.startsWith(dirPath ? dirPath + '/' : '') && f.path.split('/').length > (dirPath ? dirPath.split('/').length + 1 : 1))
        .map(f => {
          const parts = f.path.split('/')
          const idx = dirPath ? dirPath.split('/').length : 0
          return dirPath ? dirPath + '/' + parts[idx] : parts[0]
        })
      )]

      const isExpanded = expandedDirs.has(dirPath)
      const dirName = dirPath.split('/').pop() || dirPath

      return (
        <div key={dirPath}>
          {dirPath && (
            <button
              onClick={() => setExpandedDirs(prev => {
                const next = new Set(prev)
                next.has(dirPath) ? next.delete(dirPath) : next.add(dirPath)
                return next
              })}
              className="w-full flex items-center gap-1.5 px-2 py-1 hover:bg-white/5 rounded text-left"
              style={{ paddingLeft: depth * 12 + 8 }}
            >
              <span className="text-[10px] text-white/30">{isExpanded ? '▼' : '▶'}</span>
              <span className="text-xs text-yellow-400/70">📁</span>
              <span className="text-[12px] text-white/60">{dirName}</span>
            </button>
          )}
          {(isExpanded || !dirPath) && (
            <>
              {subDirs.map(sd => renderDir(sd, depth + 1))}
              {filesInDir.map(f => {
                const name = f.path.split('/').pop()
                const isActive = selectedFile === f.path
                return (
                  <button
                    key={f.path}
                    onClick={() => openFile(f.path)}
                    className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left transition-colors ${
                      isActive ? 'bg-blue-500/20 text-blue-300' : 'hover:bg-white/5 text-white/50'
                    }`}
                    style={{ paddingLeft: (depth + 1) * 12 + 8 }}
                  >
                    <span className="text-xs">{getIcon(name)}</span>
                    <span className="text-[12px] truncate">{name}</span>
                    <span className="text-[9px] text-white/15 ml-auto font-mono">{f.size > 1024 ? `${(f.size/1024).toFixed(1)}k` : `${f.size}b`}</span>
                  </button>
                )
              })}
            </>
          )}
        </div>
      )
    }

    // Get root dirs
    const rootDirs = [...new Set(tree.filter(f => f.path.includes('/')).map(f => f.path.split('/')[0]))]
    const rootFiles = tree.filter(f => !f.path.includes('/'))

    return (
      <>
        {rootDirs.map(d => renderDir(d, 0))}
        {rootFiles.map(f => {
          const isActive = selectedFile === f.path
          return (
            <button
              key={f.path}
              onClick={() => openFile(f.path)}
              className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-left transition-colors ${
                isActive ? 'bg-blue-500/20 text-blue-300' : 'hover:bg-white/5 text-white/50'
              }`}
              style={{ paddingLeft: 8 }}
            >
              <span className="text-xs">{getIcon(f.path)}</span>
              <span className="text-[12px] truncate">{f.path}</span>
            </button>
          )
        })}
      </>
    )
  }

  if (!open) return null

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col transition-opacity duration-300 ${phase === 'closing' ? 'opacity-0' : 'opacity-100'}`} style={{ background: '#1e1e2e' }}>

      {/* Boot animation */}
      {phase === 'booting' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-[400px] max-w-[90vw]">
            <div className="font-mono text-sm space-y-1.5">
              {bootLines.map((line, i) => (
                <p key={i} className={`${line.includes('Ready') ? 'text-green-400' : 'text-white/50'}`}
                  style={{ animation: 'fade-line 0.2s ease-out' }}>
                  {line}
                </p>
              ))}
              <span className="inline-block w-2 h-4 bg-white/60 animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* Main editor — only show when ready */}
      {phase === 'ready' && (
        <>

      {/* Title bar — VS Code style */}
      <div className="flex items-center px-4 py-2 bg-[#181825] border-b border-white/5 flex-shrink-0" style={{ animation: 'slide-down 0.3s ease-out' }}>
        {/* Back button */}
        <button onClick={handleClose} className="flex items-center gap-1.5 text-white/40 hover:text-white/70 transition-colors mr-4 px-2 py-1 rounded hover:bg-white/5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span className="text-[12px]">Back to site</span>
        </button>

        <div className="flex gap-1.5 mr-3">
          <div className="w-3 h-3 rounded-full bg-red-500/80" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <div className="w-3 h-3 rounded-full bg-green-500/80" />
        </div>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[12px] text-white/30 overflow-hidden">
          <span className="text-white/50">kranthi-kiran-site</span>
          {selectedFile && selectedFile.split('/').map((part, i, arr) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="text-white/15">/</span>
              <span className={i === arr.length - 1 ? 'text-white/70' : 'text-white/40'}>{part}</span>
            </span>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <a href={`https://github.com/${REPO}${selectedFile ? `/blob/${BRANCH}/${selectedFile}` : ''}`}
            target="_blank" rel="noopener noreferrer"
            className="text-[11px] text-white/30 hover:text-white/60 transition-colors px-2.5 py-1 rounded hover:bg-white/5 flex items-center gap-1">
            🐙 Open in GitHub
          </a>
          <button onClick={handleClose} className="text-white/30 hover:text-white/60 transition-colors p-1 rounded hover:bg-white/5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main body — sidebar + editor */}
      <div className="flex flex-1 min-h-0">
          {/* File tree sidebar */}
          <div className="w-[220px] flex-shrink-0 bg-[#181825] border-r border-white/5 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
            <div className="px-3 py-2 text-[10px] text-white/20 uppercase tracking-widest font-semibold">Explorer</div>
            {treeLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-4 h-4 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
              </div>
            ) : buildTree()}
          </div>

          {/* Editor */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center h-full gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" />
                <span className="text-white/30 text-sm">Loading...</span>
              </div>
            ) : selectedFile ? (
              <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-5 h-5 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin" /></div>}>
                <MonacoEditor
                  height="100%"
                  language={getLang(selectedFile)}
                  value={fileContent}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: true },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    padding: { top: 12 },
                    renderWhitespace: 'none',
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                  }}
                />
              </Suspense>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <span className="text-5xl opacity-20">📂</span>
                <p className="text-white/20 text-sm">Select a file to view</p>
              </div>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="flex items-center px-4 py-1 bg-[#007acc] text-white text-[11px] gap-4 flex-shrink-0">
          <span>🔀 {BRANCH}</span>
          <span>📄 {tree.length} files</span>
          {selectedFile && <span>{getLang(selectedFile)}</span>}
          <span className="ml-auto">Read Only · ESC to exit</span>
        </div>

        </>
      )}

      <style>{`
        @keyframes fade-line { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slide-down { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
