import React, { useState } from 'react'
import { CATEGORIES, categoryLabel, postsByCategory, featuredPost, formatDate, publishedPosts } from '../lib/blog'

const ACCENT = 'var(--color-brand)'

const goPost = (slug) => { window.location.hash = `#/blog/${slug}` }

function PostCard({ post }) {
  return (
    <button onClick={() => goPost(post.slug)} className="group text-left rounded-2xl p-5 transition-all w-full h-full flex flex-col"
      style={{ background: 'color-mix(in oklab, var(--color-card) 60%, transparent)', border: '1px solid var(--color-border)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `color-mix(in oklab, ${ACCENT} 38%, transparent)` }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}>
      <div className="text-[10.5px] font-mono uppercase tracking-[0.2em] mb-2.5" style={{ color: ACCENT }}>{categoryLabel(post.category)}</div>
      <h3 className="font-heading text-[1.3rem] leading-snug mb-1.5" style={{ fontWeight: 500 }}>{post.title}</h3>
      <p className="text-[13.5px] leading-relaxed text-muted-foreground flex-1">{post.excerpt}</p>
      <div className="flex items-center justify-between mt-4 text-[11.5px] text-muted-foreground/70 font-mono">
        <span>{formatDate(post.date)} · {post.readingMins} min</span>
        <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform" style={{ color: ACCENT }}>Read
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
    </button>
  )
}

function FeaturedCard({ post }) {
  return (
    <button onClick={() => goPost(post.slug)} className="group block w-full text-left rounded-2xl p-7 sm:p-9 transition-all"
      style={{ background: 'color-mix(in oklab, var(--color-card) 62%, transparent)', border: '1px solid var(--color-border)', borderLeft: `3px solid ${ACCENT}` }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `color-mix(in oklab, ${ACCENT} 40%, transparent)`; e.currentTarget.style.borderLeftColor = ACCENT }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.borderLeftColor = ACCENT }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-2 py-0.5 rounded-full" style={{ color: ACCENT, background: `color-mix(in oklab, ${ACCENT} 12%, transparent)`, border: `1px solid color-mix(in oklab, ${ACCENT} 30%, transparent)` }}>Featured</span>
        <span className="text-[10.5px] font-mono uppercase tracking-[0.2em] text-muted-foreground">{categoryLabel(post.category)}</span>
      </div>
      <h2 className="font-heading text-[clamp(1.8rem,5vw,2.6rem)] leading-[1.08] mb-2" style={{ fontWeight: 500 }}>{post.title}</h2>
      {post.subtitle && <p className="text-[clamp(1.05rem,2.6vw,1.3rem)] text-muted-foreground mb-3">{post.subtitle}</p>}
      <p className="text-[14.5px] leading-relaxed text-muted-foreground max-w-xl">{post.excerpt}</p>
      <div className="flex items-center justify-between mt-6 text-[12px] text-muted-foreground/70 font-mono">
        <span>{formatDate(post.date)} · {post.readingMins} min read</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium group-hover:translate-x-0.5 transition-transform" style={{ color: ACCENT }}>Read the breakdown
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" /></svg>
        </span>
      </div>
    </button>
  )
}

export default function Blog({ onBack }) {
  const [cat, setCat] = useState('all')
  const featured = featuredPost()
  const all = postsByCategory(cat)
  // On "all", show the featured separately and the rest in the grid.
  const gridPosts = cat === 'all' ? all.filter(p => p.slug !== featured.slug) : all
  const showFeatured = cat === 'all' || featured.category === cat

  const chips = [{ id: 'all', label: 'All' }, ...CATEGORIES]
  const counts = publishedPosts()

  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto" style={{ background: 'var(--color-background)' }}>
      <div className="pr-backdrop-base" aria-hidden="true" />
      <div className="pr-backdrop-glow" aria-hidden="true" />
      <div className="pr-backdrop-noise" aria-hidden="true" />

      <button onClick={onBack} title="Back to site"
        className="fixed top-4 left-4 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
        style={{ background: 'color-mix(in oklab, var(--color-card) 70%, transparent)', border: '1px solid var(--color-border)', backdropFilter: 'blur(8px)' }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-6 pt-24 pb-24">
        {/* Header */}
        <header className="mb-9">
          <div className="text-[11px] font-mono uppercase tracking-[0.28em] mb-3" style={{ color: ACCENT }}>Writing</div>
          <h1 className="font-heading text-[clamp(2.2rem,7vw,3.4rem)] leading-[1.05] mb-3" style={{ fontWeight: 500 }}>The Blog</h1>
          <p className="text-[clamp(1rem,2.4vw,1.18rem)] leading-relaxed text-muted-foreground max-w-xl">
            Notes on the mind, reliability, and building quiet things — written to be read slowly.
          </p>
        </header>

        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-9">
          {chips.map(c => {
            const active = cat === c.id
            const n = c.id === 'all' ? counts.length : counts.filter(p => p.category === c.id).length
            return (
              <button key={c.id} onClick={() => setCat(c.id)}
                className="px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition-all"
                style={active
                  ? { background: `color-mix(in oklab, ${ACCENT} 16%, transparent)`, color: 'var(--color-foreground)', border: `1px solid color-mix(in oklab, ${ACCENT} 40%, transparent)` }
                  : { background: 'color-mix(in oklab, var(--color-card) 40%, transparent)', color: 'var(--color-muted-foreground)', border: '1px solid var(--color-border)' }}>
                {c.label}{n > 0 && <span className="ml-1.5 opacity-60 tabular-nums">{n}</span>}
              </button>
            )
          })}
        </div>

        {/* Featured */}
        {showFeatured && <div className="mb-5"><FeaturedCard post={featured} /></div>}

        {/* Grid */}
        {gridPosts.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            {gridPosts.map(p => <PostCard key={p.slug} post={p} />)}
          </div>
        )}

        {/* Empty state */}
        {!showFeatured && gridPosts.length === 0 && (
          <div className="text-center py-16 rounded-2xl" style={{ border: '1px dashed var(--color-border)' }}>
            <p className="font-heading text-lg mb-1" style={{ fontWeight: 500 }}>Nothing here yet</p>
            <p className="text-sm text-muted-foreground">The first <span style={{ color: ACCENT }}>{categoryLabel(cat)}</span> post is on its way.</p>
          </div>
        )}
      </div>
    </div>
  )
}
