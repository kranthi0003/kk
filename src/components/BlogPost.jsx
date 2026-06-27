import React, { useEffect, useRef, useState } from 'react'
import { getPost, categoryLabel, formatDate } from '../lib/blog'
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

function Prose({ post }) {
  return (
    <article className="relative z-10 max-w-2xl mx-auto px-5 sm:px-6 pt-28 pb-24">
      <Reveal>
        <div className="text-[11px] font-mono uppercase tracking-[0.28em] mb-4" style={{ color: ACCENT }}>{categoryLabel(post.category)}</div>
        <h1 className="font-heading text-[clamp(2rem,6vw,3.2rem)] leading-[1.08] mb-3" style={{ fontWeight: 500 }}>{post.title}</h1>
        {post.subtitle && <p className="text-[clamp(1.05rem,2.6vw,1.35rem)] text-muted-foreground leading-snug mb-5">{post.subtitle}</p>}
        <div className="text-[12.5px] text-muted-foreground/70 font-mono pb-8 mb-8" style={{ borderBottom: '1px solid var(--color-border)' }}>
          {formatDate(post.date)} · {post.readingMins} min read
        </div>
      </Reveal>
      <div className="space-y-5">
        {post.body.map((b, i) => (
          <Reveal key={i}>
            {b.type === 'h' ? (
              <h2 className="font-heading text-[1.5rem] mt-4" style={{ fontWeight: 500 }}>{b.text}</h2>
            ) : b.type === 'quote' ? (
              <blockquote className="font-serif italic text-[clamp(1.15rem,3vw,1.5rem)] leading-relaxed pl-5 py-1" style={{ borderLeft: `3px solid ${ACCENT}`, color: 'var(--color-foreground)' }}>{b.text}</blockquote>
            ) : (
              <p className="text-[clamp(1rem,2.2vw,1.15rem)] leading-[1.75] text-muted-foreground">{b.text}</p>
            )}
          </Reveal>
        ))}
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
