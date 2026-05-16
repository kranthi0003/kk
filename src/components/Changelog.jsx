import React, { useState, useEffect } from 'react'

const REPO = 'kranthi0003/kranthi-kiran-site'
const CACHE_KEY = 'changelog_data'
const CACHE_TTL = 5 * 60 * 1000 // 5 min

// Group commits by date
function groupByDate(commits) {
  const groups = {}
  commits.forEach(c => {
    const date = new Date(c.commit.author.date).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(c)
  })
  return groups
}

// Categorize commit by message prefix/content
function getCommitTag(msg) {
  const m = msg.toLowerCase()
  if (m.startsWith('fix') || m.includes('bug')) return { label: 'Fix', color: 'bg-red-500/15 text-red-400 border-red-500/20' }
  if (m.startsWith('add') || m.startsWith('feat') || m.startsWith('create')) return { label: 'New', color: 'bg-green-500/15 text-green-400 border-green-500/20' }
  if (m.startsWith('redesign') || m.startsWith('refactor') || m.startsWith('update') || m.startsWith('improve')) return { label: 'Update', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' }
  if (m.startsWith('remove') || m.startsWith('revert') || m.startsWith('delete')) return { label: 'Remove', color: 'bg-orange-500/15 text-orange-400 border-orange-500/20' }
  if (m.startsWith('style') || m.includes('ui') || m.includes('css')) return { label: 'Style', color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' }
  return { label: 'Change', color: 'bg-white/10 text-white/50 border-white/10' }
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return `${Math.floor(diff / 604800)}w ago`
}

export default function Changelog() {
  const [open, setOpen] = useState(false)
  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Listen for toggle event
  useEffect(() => {
    const handler = () => setOpen(o => !o)
    window.addEventListener('toggle-changelog', handler)
    return () => window.removeEventListener('toggle-changelog', handler)
  }, [])

  // Fetch commits when opened
  useEffect(() => {
    if (!open) return

    // Check cache
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY))
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setCommits(cached.data)
        setLoading(false)
        return
      }
    } catch {}

    setLoading(true)
    setError(null)

    fetch(`https://api.github.com/repos/${REPO}/commits?per_page=100&sha=main`)
      .then(r => {
        if (!r.ok) throw new Error(`GitHub API ${r.status}`)
        return r.json()
      })
      .then(data => {
        setCommits(data)
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [open])

  if (!open) return null

  const newCommits = commits.filter(c => getCommitTag(c.commit.message.split('\n')[0]).label === 'New')
  const grouped = groupByDate(newCommits)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-md" onClick={() => setOpen(false)} />

      {/* Modal */}
      <div className="fixed top-[8%] left-1/2 -translate-x-1/2 z-[151] w-[560px] max-w-[calc(100vw-2rem)] max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        style={{
          background: 'rgba(18, 18, 24, 0.95)',
          backdropFilter: 'blur(40px)',
          animation: 'changelog-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
          <div>
            <h2 className="text-white text-base font-semibold flex items-center gap-2">
              📋 What's New
            </h2>
            <p className="text-[11px] text-white/30 mt-0.5 font-mono">Latest changes from GitHub</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://github.com/${REPO}/commits/main`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-400/70 hover:text-blue-400 transition-colors font-mono"
            >
              View all →
            </a>
            <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 transition-colors ml-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              <p className="text-white/30 text-sm">Fetching commits...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="text-2xl">⚠️</span>
              <p className="text-white/40 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && Object.entries(grouped).map(([date, dayCommits]) => (
            <div key={date}>
              {/* Date header */}
              <div className="sticky top-0 px-6 py-2.5 bg-white/[0.02] backdrop-blur-sm border-b border-white/5">
                <span className="text-[11px] font-semibold text-white/30 uppercase tracking-widest">{date}</span>
              </div>

              {/* Commits for this date */}
              {dayCommits.map(c => {
                const msg = c.commit.message.split('\n')[0] // First line only
                const tag = getCommitTag(msg)
                const sha = c.sha.substring(0, 7)
                return (
                  <div key={c.sha} className="px-6 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                    <div className="flex items-start gap-3">
                      {/* Timeline dot */}
                      <div className="mt-1.5 flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-white/20 group-hover:bg-blue-400/60 transition-colors" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Commit message */}
                        <p className="text-[13px] text-white/80 leading-snug truncate">{msg}</p>

                        {/* Tags + meta */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${tag.color}`}>
                            {tag.label}
                          </span>
                          <a
                            href={c.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono text-blue-400/50 hover:text-blue-400 transition-colors"
                          >
                            {sha}
                          </a>
                          <span className="text-[10px] text-white/15">{timeAgo(c.commit.author.date)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 border-t border-white/5 text-[10px] font-mono text-white/20 flex items-center justify-between">
          <span>{commits.length} commits loaded</span>
          <span>github.com/{REPO}</span>
        </div>
      </div>

      <style>{`
        @keyframes changelog-in {
          from { opacity: 0; transform: translateX(-50%) scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
        }
      `}</style>
    </>
  )
}
