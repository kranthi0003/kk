import React, { useState, useEffect } from 'react'

const REPO = 'kranthi0003/kranthi-kiran-site'
const CACHE_KEY = 'changelog_feed'
const CACHE_TTL = 5 * 60 * 1000

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`
  return `${Math.floor(diff / 604800)} weeks ago`
}

export default function ChangelogFeed() {
  const [commits, setCommits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY))
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setCommits(cached.data)
        setLoading(false)
        return
      }
    } catch {}

    fetch(`https://api.github.com/repos/${REPO}/commits?per_page=4&sha=main`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        setCommits(data)
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <section className="max-w-3xl mx-auto px-6 py-10">
      <div className="rounded-xl border border-border/40 bg-card/50 p-5">
        {/* Header */}
        <h3 className="text-sm font-semibold text-foreground mb-4">Latest from our changelog</h3>

        {loading ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <div className="w-3 h-3 border-2 border-muted-foreground/20 border-t-muted-foreground/60 rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground/40">Loading...</span>
          </div>
        ) : (
          <div className="space-y-0">
            {commits.map((c, i) => {
              const msg = c.commit.message.split('\n')[0]
              return (
                <a
                  key={c.sha}
                  href={c.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex gap-3 py-3 group cursor-pointer border-t border-border/20 first:border-t-0 first:pt-0"
                >
                  {/* Dot */}
                  <div className="mt-1.5 flex-shrink-0">
                    <div className={`w-2 h-2 rounded-full ${
                      i === 0 ? 'bg-green-500' : 'bg-muted-foreground/30'
                    }`} />
                  </div>

                  {/* Content */}
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground/50 mb-0.5">{timeAgo(c.commit.author.date)}</p>
                    <p className="text-sm text-foreground/80 group-hover:text-foreground transition-colors leading-snug line-clamp-2">
                      {msg}
                    </p>
                  </div>
                </a>
              )
            })}
          </div>
        )}

        {/* View all link */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-changelog'))}
          className="mt-3 text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
        >
          View changelog →
        </button>
      </div>
    </section>
  )
}

