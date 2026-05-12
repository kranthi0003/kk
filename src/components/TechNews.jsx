import React, { useEffect, useState } from 'react'

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

async function fetchHN(limit = 6) {
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

async function fetchDev(limit = 6) {
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

export default function TechNews({ side = 'right' }) {
  const [source, setSource] = useState('hn')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [updated, setUpdated] = useState(Date.now())

  const load = async (src = source) => {
    setLoading(true)
    setErr(null)
    try {
      const data = src === 'devto' ? await fetchDev(8) : await fetchHN(8)
      setItems(data)
      setUpdated(Date.now())
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(source)
    const t = setInterval(() => load(source), 5 * 60 * 1000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source])

  const sources = [
    { id: 'hn', name: 'Hacker News', icon: '🟠', host: 'news.ycombinator.com' },
    { id: 'devto', name: 'DEV.to', icon: '🧑‍💻', host: 'dev.to' },
  ]
  const current = sources.find(s => s.id === source)

  const sideClasses = side === 'left'
    ? 'left-4 xl:left-6 2xl:left-10'
    : 'right-4 xl:right-6 2xl:right-10'

  return (
    <aside
      className={`hidden lg:flex absolute top-32 ${sideClasses} z-20 w-[260px] xl:w-[300px] flex-col animate-fade-in-up`}
      style={{ animationDelay: '0.6s' }}
      aria-label="Tech news"
    >
      <div className="rounded-2xl bg-card border border-border/60 shadow-2xl overflow-hidden">
        {/* Header with source tabs */}
        <div className="flex items-center gap-1 px-2 py-2 border-b border-border/40 bg-background">
          {sources.map(s => (
            <button
              key={s.id}
              onClick={() => setSource(s.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
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
            className="ml-0.5 px-1.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 text-xs transition-transform disabled:opacity-40 hover:rotate-180 duration-500"
          >
            ↻
          </button>
        </div>

        {/* Scrollable list — fixed height shows ~3.5 cards */}
        <div className="relative">
          <div className="overflow-y-auto p-2 space-y-2 custom-scroll" style={{ maxHeight: '340px', scrollbarWidth: 'thin' }}>
            {loading && items.length === 0 && (
              [1, 2, 3].map(i => (
                <div key={i} className="p-2.5 rounded-lg bg-muted/20 border border-border/30 space-y-1.5 animate-pulse">
                  <div className="h-2.5 bg-muted/50 rounded w-full" />
                  <div className="h-2.5 bg-muted/40 rounded w-4/5" />
                  <div className="h-2 bg-muted/30 rounded w-1/3" />
                </div>
              ))
            )}

            {err && !loading && (
              <div className="p-4 text-[11px] text-muted-foreground text-center">
                couldn't load — <button onClick={() => load(source)} className="text-accent hover:underline font-semibold">retry</button>
              </div>
            )}

            {items.map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2.5 rounded-lg bg-muted/20 hover:bg-accent/10 border border-border/30 hover:border-accent/50 transition-all group hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-accent/70 font-mono font-bold tabular-nums mt-0.5 flex-shrink-0 w-4">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold leading-snug line-clamp-2 group-hover:text-accent transition-colors text-foreground">
                      {item.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[9px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-0.5 font-bold text-accent/80">▲ {item.score}</span>
                      <span className="opacity-40">·</span>
                      <span>💬 {item.comments}</span>
                      {item.by && <><span className="opacity-40">·</span><span className="truncate max-w-[80px]">{item.by}</span></>}
                      <span className="ml-auto whitespace-nowrap opacity-70">{timeAgo(item.time)}</span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
          {/* Fade hint at bottom */}
          {items.length > 3 && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent" />
          )}
        </div>

        <div className="px-3 py-1.5 border-t border-border/40 bg-background flex items-center justify-between text-[9px] text-muted-foreground">
          <span>{loading ? 'updating…' : `${items.length} stories · ${timeAgo(updated)} ago`}</span>
          <a href={`https://${current.host}`} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors font-medium">
            {current.host} →
          </a>
        </div>
      </div>
    </aside>
  )
}
