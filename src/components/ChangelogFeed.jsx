import React, { useState, useEffect } from 'react'

const REPO = 'kranthi0003/kranthi-kiran-site'
const CACHE_KEY = 'changelog_feed'
const CACHE_TTL = 5 * 60 * 1000

function getTag(msg) {
  const m = msg.toLowerCase()
  if (m.startsWith('fix') || m.includes('bug')) return { label: 'Fix', bg: 'bg-red-500', ring: 'ring-red-500/20' }
  if (m.startsWith('add') || m.startsWith('feat') || m.startsWith('create')) return { label: 'New', bg: 'bg-green-500', ring: 'ring-green-500/20' }
  if (m.startsWith('redesign') || m.startsWith('refactor') || m.startsWith('update') || m.startsWith('improve')) return { label: 'Update', bg: 'bg-blue-500', ring: 'ring-blue-500/20' }
  if (m.startsWith('remove') || m.startsWith('revert')) return { label: 'Remove', bg: 'bg-orange-500', ring: 'ring-orange-500/20' }
  return { label: 'Change', bg: 'bg-muted-foreground', ring: 'ring-muted-foreground/20' }
}

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ChangelogFeed() {
  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check cache
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY))
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setCommits(cached.data)
        setLoading(false)
        return
      }
    } catch {}

    fetch(`https://api.github.com/repos/${REPO}/commits?per_page=5&sha=main`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setCommits(data)
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-foreground/5 border border-border/40 flex items-center justify-center">
            <svg className="w-4 h-4 text-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">What's New</h2>
            <p className="text-xs text-muted-foreground/50">Latest changes shipped to this site</p>
          </div>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-changelog'))}
          className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors font-mono"
        >
          View all →
        </button>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center gap-3 py-8 justify-center">
          <div className="w-4 h-4 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground/40">Loading...</span>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border/40" />

          {commits.map((c, i) => {
            const msg = c.commit.message.split('\n')[0]
            const body = c.commit.message.split('\n').slice(1).filter(l => l.trim() && !l.startsWith('Co-authored')).join(' ').trim()
            const tag = getTag(msg)
            const sha = c.sha.substring(0, 7)
            const isLatest = i === 0

            return (
              <div key={c.sha} className="relative pl-9 pb-6 last:pb-0 group">
                {/* Timeline dot */}
                <div className={`absolute left-0 top-1 w-[22px] h-[22px] rounded-full flex items-center justify-center ring-4 ring-background ${isLatest ? tag.bg : 'bg-muted-foreground/20'}`}>
                  {isLatest && (
                    <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: 'currentColor' }} />
                  )}
                </div>

                {/* Content */}
                <div className={`rounded-xl border p-4 transition-all ${
                  isLatest
                    ? 'border-border/50 bg-card/80 shadow-sm'
                    : 'border-border/20 bg-transparent hover:bg-card/40 hover:border-border/40'
                }`}>
                  {/* Title row */}
                  <div className="flex items-start gap-2">
                    <p className={`text-sm flex-1 leading-snug ${isLatest ? 'text-foreground font-medium' : 'text-foreground/70'}`}>
                      {msg}
                    </p>
                    <span className={`flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      isLatest
                        ? `${tag.bg} text-white`
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {tag.label}
                    </span>
                  </div>

                  {/* Body preview (if exists) */}
                  {body && (
                    <p className="text-xs text-muted-foreground/40 mt-1.5 line-clamp-2 leading-relaxed">{body}</p>
                  )}

                  {/* Meta */}
                  <div className="flex items-center gap-3 mt-2.5">
                    <a
                      href={c.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-blue-500/60 hover:text-blue-500 transition-colors"
                    >
                      {sha}
                    </a>
                    <span className="text-[11px] text-muted-foreground/30">{timeAgo(c.commit.author.date)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
