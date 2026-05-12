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

export default function TechNews({ source = 'hn', side = 'left' }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [updated, setUpdated] = useState(Date.now())

  const load = async () => {
    setLoading(true)
    setErr(null)
    try {
      const data = source === 'devto' ? await fetchDev(6) : await fetchHN(6)
      setItems(data)
      setUpdated(Date.now())
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 5 * 60 * 1000) // refresh every 5 min
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source])

  const meta = source === 'devto'
    ? { name: 'DEV.to', icon: '🧑‍💻', accent: 'text-accent', host: 'dev.to' }
    : { name: 'Hacker News', icon: '🟠', accent: 'text-accent', host: 'news.ycombinator.com' }

  const sideClasses = side === 'right'
    ? 'right-4 xl:right-6 2xl:right-10'
    : 'left-4 xl:left-6 2xl:left-10'

  return (
    <aside
      className={`hidden lg:flex absolute top-32 ${sideClasses} z-20 w-[240px] xl:w-[280px] flex-col animate-fade-in-up`}
      style={{ animationDelay: '0.6s' }}
      aria-label={`${meta.name} top stories`}
    >
      <div className="rounded-2xl bg-card/70 backdrop-blur-md border border-border/40 shadow-xl overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/30 bg-background/40">
          <span className="text-base">{meta.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold leading-tight">{meta.name}</div>
            <div className="text-[9px] text-muted-foreground leading-tight">top stories</div>
          </div>
          <button
            onClick={load}
            disabled={loading}
            title="refresh"
            className="text-muted-foreground hover:text-foreground text-xs transition-transform disabled:opacity-40 hover:rotate-180 duration-500"
          >
            ↻
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          {loading && items.length === 0 && (
            <div className="p-3 space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-1 animate-pulse">
                  <div className="h-2 bg-muted/40 rounded w-full" />
                  <div className="h-2 bg-muted/30 rounded w-3/4" />
                </div>
              ))}
            </div>
          )}

          {err && !loading && (
            <div className="p-3 text-[11px] text-muted-foreground text-center">
              couldn't load — <button onClick={load} className="text-accent hover:underline">retry</button>
            </div>
          )}

          {items.map((item, i) => (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2.5 border-b border-border/20 last:border-b-0 hover:bg-accent/5 transition-colors group"
            >
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-muted-foreground/60 font-mono tabular-nums mt-0.5 flex-shrink-0 w-3">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium leading-snug line-clamp-3 group-hover:text-accent transition-colors">
                    {item.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">▲ {item.score}</span>
                    <span>·</span>
                    <span>💬 {item.comments}</span>
                    {item.by && <><span>·</span><span className="truncate max-w-[60px]">{item.by}</span></>}
                    <span className="ml-auto">{timeAgo(item.time)}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="px-3 py-1.5 border-t border-border/30 bg-background/30 flex items-center justify-between text-[9px] text-muted-foreground">
          <span>refreshed {timeAgo(updated)} ago</span>
          <a href={`https://${meta.host}`} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
            {meta.host} →
          </a>
        </div>
      </div>
    </aside>
  )
}
