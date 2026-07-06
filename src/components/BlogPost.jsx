import React, { useEffect, useRef, useState } from 'react'
import { getPost, categoryLabel, formatDate, topicsForPost, topicLabel } from '../lib/blog'
import { DopamineArticle } from './Dopamine'

const ACCENT = '#e0a04a'

// Reveal-on-scroll for prose blocks.
function Reveal({ children }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.1 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(16px)', transition: 'opacity .8s ease, transform .8s ease' }}>
      {children}
    </div>
  )
}

// One content block. Prose posts are arrays of these; cert articles use the
// richer types (steps / resources / facts / note) on top of h / p / quote / list.
function Block({ b }) {
  switch (b.type) {
    case 'h':
      return <h2 className="font-heading text-[1.5rem] mt-4" style={{ fontWeight: 500 }}>{b.text}</h2>
    case 'quote':
      return <blockquote className="font-serif italic text-[clamp(1.15rem,3vw,1.5rem)] leading-relaxed pl-5 py-1" style={{ borderLeft: `3px solid ${ACCENT}`, color: 'var(--color-foreground)' }}>{b.text}</blockquote>
    case 'list':
      return (
        <ul className="space-y-2">
          {b.items.map((it, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[clamp(1rem,2.2vw,1.12rem)] leading-relaxed text-muted-foreground">
              <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
              <span>{it}</span>
            </li>
          ))}
        </ul>
      )
    case 'steps':
      return (
        <ol className="space-y-3">
          {b.items.map((it, i) => (
            <li key={i} className="flex gap-3.5">
              <span className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-semibold font-mono" style={{ background: `color-mix(in oklab, ${ACCENT} 14%, transparent)`, color: ACCENT, border: `1px solid color-mix(in oklab, ${ACCENT} 32%, transparent)` }}>{i + 1}</span>
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="text-[15px] font-medium" style={{ color: 'var(--color-foreground)' }}>{it.title}</div>
                {it.text && <div className="text-[13.5px] leading-relaxed text-muted-foreground mt-0.5">{it.text}</div>}
              </div>
            </li>
          ))}
        </ol>
      )
    case 'resources':
      return (
        <div className="space-y-2">
          {b.items.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
              style={{ background: 'color-mix(in oklab, var(--color-card) 60%, transparent)', border: '1px solid var(--color-border)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = `color-mix(in oklab, ${ACCENT} 40%, transparent)` }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}>
              <span className="flex-1 min-w-0">
                <span className="block text-[14.5px] font-medium" style={{ color: 'var(--color-foreground)' }}>{r.label}</span>
                {r.sub && <span className="block text-[12px] text-muted-foreground">{r.sub}</span>}
              </span>
              <svg className="w-4 h-4 flex-shrink-0 text-muted-foreground/50 group-hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
            </a>
          ))}
        </div>
      )
    case 'facts':
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 rounded-2xl p-4" style={{ background: 'color-mix(in oklab, var(--color-card) 55%, transparent)', border: '1px solid var(--color-border)' }}>
          {b.items.map((f, i) => (
            <div key={i}>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground/80">{f.k}</div>
              <div className="text-[14px] font-medium mt-0.5" style={{ color: 'var(--color-foreground)' }}>{f.v}</div>
            </div>
          ))}
        </div>
      )
    case 'note':
      return (
        <div className="rounded-xl px-4 py-3 flex gap-3 text-[13.5px] leading-relaxed" style={{ background: `color-mix(in oklab, ${ACCENT} 7%, transparent)`, border: `1px dashed color-mix(in oklab, ${ACCENT} 35%, transparent)`, color: 'var(--color-foreground)' }}>
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
          <span>{b.text}</span>
        </div>
      )
    case 'code':
      return (
        <pre className="rounded-xl p-4 overflow-x-auto text-[12.5px] leading-relaxed font-mono" style={{ background: 'color-mix(in oklab, var(--color-card) 72%, transparent)', border: '1px solid var(--color-border)', color: 'var(--color-foreground)' }}>
          <code>{b.text}</code>
        </pre>
      )
    default:
      return <p className="text-[clamp(1rem,2.2vw,1.15rem)] leading-[1.75] text-muted-foreground">{b.text}</p>
  }
}

function Prose({ post }) {
  const topics = topicsForPost(post)
  return (
    <article className="relative z-10 max-w-2xl mx-auto px-5 sm:px-6 pt-28 pb-24">
      <Reveal>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[11px] font-mono uppercase tracking-[0.28em]" style={{ color: ACCENT }}>{categoryLabel(post.category)}</span>
          {post.til && (
            <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full" style={{ color: ACCENT, background: `color-mix(in oklab, ${ACCENT} 14%, transparent)`, border: `1px solid color-mix(in oklab, ${ACCENT} 34%, transparent)` }}>TIL</span>
          )}
        </div>
        <h1 className="font-heading text-[clamp(2rem,6vw,3.2rem)] leading-[1.08] mb-3" style={{ fontWeight: 500 }}>{post.title}</h1>
        {post.subtitle && <p className="text-[clamp(1.05rem,2.6vw,1.35rem)] text-muted-foreground leading-snug mb-5">{post.subtitle}</p>}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-2 text-[12.5px] text-muted-foreground/70 font-mono pb-8 mb-8" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <span>{formatDate(post.date)} · {post.readingMins} min read</span>
          {topics.length > 0 && (
            <span className="flex items-center gap-1.5">
              {topics.map(t => (
                <button key={t} onClick={() => { window.location.hash = '#/notes'; window.location.reload() }}
                  className="px-2 py-0.5 rounded-full text-[10.5px] not-italic transition-colors hover:text-foreground"
                  style={{ background: 'color-mix(in oklab, var(--color-card) 55%, transparent)', border: '1px solid var(--color-border)' }}>
                  {topicLabel(t)}
                </button>
              ))}
            </span>
          )}
        </div>
      </Reveal>
      <div className="space-y-5">
        {post.body.map((b, i) => <Reveal key={i}><Block b={b} /></Reveal>)}
      </div>
    </article>
  )
}

export default function BlogPost({ slug, onBack }) {
  const post = getPost(slug)
  const [progress, setProgress] = useState(0)
  const scrollRef = useRef(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight
      setProgress(max > 0 ? el.scrollTop / max : 0)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div ref={scrollRef} className="fixed inset-0 z-[300] overflow-y-auto" style={{ background: 'var(--color-background)' }}>
      <div className="pr-backdrop-base" aria-hidden="true" />
      <div className="pr-backdrop-glow" aria-hidden="true" />
      <div className="pr-backdrop-noise" aria-hidden="true" />

      {/* scroll progress */}
      <div className="fixed top-0 left-0 right-0 z-20 h-[2px]" style={{ background: 'transparent' }}>
        <div style={{ width: `${progress * 100}%`, height: '100%', background: ACCENT, transition: 'width .1s linear' }} />
      </div>

      {/* back to blog */}
      <button onClick={onBack} title="Back to the blog"
        className="fixed top-4 left-4 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
        style={{ background: 'color-mix(in oklab, var(--color-card) 70%, transparent)', border: '1px solid var(--color-border)', backdropFilter: 'blur(8px)' }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        <span className="hidden sm:inline">Blog</span>
      </button>

      {!post ? (
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6">
          <h1 className="font-heading text-2xl mb-2" style={{ fontWeight: 500 }}>Post not found</h1>
          <p className="text-sm text-muted-foreground mb-6">That one doesn't exist (or hasn't been written yet).</p>
          <button onClick={onBack} className="text-sm font-medium" style={{ color: ACCENT }}>← Back to the blog</button>
        </div>
      ) : post.render === 'dopamine' ? (
        <DopamineArticle />
      ) : (
        <Prose post={post} />
      )}
    </div>
  )
}
