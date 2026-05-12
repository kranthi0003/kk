import React, { useEffect, useRef, useState } from 'react'

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

async function fetchHN(limit = 8) {
  const ids = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json').then(r => r.json())
  const top = ids.slice(0, limit)
  const items = await Promise.all(
    top.map(id => fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json()).catch(() => null))
  )
  return items.filter(Boolean).map(i => ({
    title: i.title,
    url: i.url || `https://news.ycombinator.com/item?id=${i.id}`,
    score: i.score || 0,
    comments: i.descendants || 0,
    by: i.by,
    time: (i.time || 0) * 1000,
  }))
}

async function fetchDev(limit = 8) {
  const list = await fetch(`https://dev.to/api/articles?per_page=${limit}&top=1`).then(r => r.json())
  return list.map(a => ({
    title: a.title,
    url: a.url,
    score: a.positive_reactions_count || 0,
    comments: a.comments_count || 0,
    by: a.user?.username,
    tags: a.tag_list || [],
    time: new Date(a.published_at).getTime(),
  }))
}

function hostFromUrl(u) {
  try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' }
}

export default function TechNews({ side = 'right' }) {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState('hn')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [updated, setUpdated] = useState(null)
  const [loadedOnce, setLoadedOnce] = useState(false)
  const rootRef = useRef(null)

  const load = async (src = source) => {
    setLoading(true)
    setErr(null)
    try {
      const data = src === 'devto' ? await fetchDev(8) : await fetchHN(8)
      setItems(data)
      setUpdated(Date.now())
      setLoadedOnce(true)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Lazy load only when opened the first time, then refresh on source change while open
  useEffect(() => {
    if (!open) return
    load(source)
    const t = setInterval(() => load(source), 5 * 60 * 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, source])

  // Close on outside click / Esc
  useEffect(() => {
    if (!open) return
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const sources = [
    { id: 'hn', name: 'Hacker News', icon: '🟠', host: 'news.ycombinator.com' },
    { id: 'devto', name: 'DEV.to', icon: '🧑‍💻', host: 'dev.to' },
  ]
  const current = sources.find(s => s.id === source)

  const sideClasses = side === 'left' ? 'left-0' : 'right-0'

  return (
    <div ref={rootRef} className="relative hidden lg:inline-flex">
      {/* Trigger pill — sits inline in the navbar action bar */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        title="Tech News"
        className={`group flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-[11px] font-semibold transition-all select-none ${
          open
            ? 'bg-accent/10 border-accent/60 text-foreground'
            : 'bg-transparent border-border/60 text-muted-foreground hover:text-foreground hover:border-accent/40 hover:bg-muted/40'
        }`}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
        <span>Tech News</span>
        <svg
          className={`w-3 h-3 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown panel — anchored beneath the trigger */}
      {open && (
        <div
          className={`absolute top-full mt-2 ${sideClasses} w-[340px] xl:w-[380px] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden z-50 animate-fade-in-up`}
          style={{ animationDelay: '0s' }}
        >
          {/* Header with source tabs */}
          <div className="flex items-center gap-1 px-2 py-2 border-b border-border/50 bg-background">
            {sources.map(s => (
              <button
                key={s.id}
                onClick={() => setSource(s.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                  source === s.id
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
                title={s.name}
              >
                <span>{s.icon}</span>
                <span>{s.name}</span>
              </button>
            ))}
            <button
              onClick={() => load(source)}
              disabled={loading}
              title="refresh"
              className="ml-0.5 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 text-sm transition-transform disabled:opacity-40 hover:rotate-180 duration-500"
            >
              ↻
            </button>
          </div>

          {/* Scrollable list */}
          <div className="relative">
            <div className="overflow-y-auto custom-scroll divide-y divide-border/40" style={{ maxHeight: '380px', scrollbarWidth: 'thin' }}>
              {loading && items.length === 0 && (
                [1, 2, 3, 4].map(i => (
                  <div key={i} className="p-3.5 space-y-2 animate-pulse">
                    <div className="h-3 bg-muted/50 rounded w-full" />
                    <div className="h-3 bg-muted/40 rounded w-3/4" />
                    <div className="h-2 bg-muted/30 rounded w-1/3" />
                  </div>
                ))
              )}

              {err && !loading && (
                <div className="p-6 text-[12px] text-muted-foreground text-center">
                  couldn't load — <button onClick={() => load(source)} className="text-accent hover:underline font-semibold">retry</button>
                </div>
              )}

              {!loading && !err && items.length === 0 && loadedOnce && (
                <div className="p-6 text-[12px] text-muted-foreground text-center">No stories right now</div>
              )}

              {items.map((item, i) => {
                const host = hostFromUrl(item.url)
                return (
                  <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3.5 py-3 hover:bg-accent/5 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-[11px] text-muted-foreground font-mono font-semibold tabular-nums pt-0.5 flex-shrink-0 w-5">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-semibold leading-[1.4] text-foreground group-hover:text-accent transition-colors">
                          {item.title}
                        </div>
                        {host && (
                          <div className="text-[10.5px] text-muted-foreground/80 mt-1 truncate">
                            {host}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-[10.5px] text-muted-foreground">
                          <span className="flex items-center gap-0.5 font-semibold text-accent">▲ {item.score}</span>
                          <span className="opacity-40">·</span>
                          <span>💬 {item.comments}</span>
                          {item.by && <><span className="opacity-40">·</span><span className="truncate max-w-[90px]">{item.by}</span></>}
                          <span className="ml-auto whitespace-nowrap opacity-80">{timeAgo(item.time)}</span>
                        </div>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
            {/* Fade hint at bottom */}
            {items.length > 3 && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent" />
            )}
          </div>

          <div className="px-3.5 py-2 border-t border-border/50 bg-background flex items-center justify-between text-[10.5px] text-muted-foreground">
            <span>{loading ? 'updating…' : updated ? `${items.length} stories · ${timeAgo(updated)}` : '—'}</span>
            <a href={`https://${current.host}`} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors font-medium">
              {current.host} →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
