import React from 'react'
import { publishedPosts, featuredPost, categoryLabel, formatDate } from '../lib/blog'

// Homepage "From the blog" section. Features the flagship post, then lists a
// few more recent titles — all pulled live from the blog data so it stays in
// sync as posts are added (no hardcoded titles). Routes into #/blog/<slug>.
export default function DopamineTeaser() {
  const featured = featuredPost()
  const all = publishedPosts()
  const more = all.filter(p => p.slug !== featured.slug).slice(0, 5)
  const total = all.length

  const go = (slug) => { window.location.hash = `#/blog/${slug}` }
  const goBlog = () => { window.location.hash = '#/blog' }

  return (
    <section className="py-20 sm:py-28 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Section header */}
        <div className="flex items-baseline justify-between gap-4 mb-6">
          <p className="text-[11px] font-mono uppercase tracking-[0.28em]" style={{ color: 'var(--color-brand)' }}>
            From the blog
          </p>
          <button onClick={goBlog} className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
            All {total} posts →
          </button>
        </div>

        {/* Featured post — large card */}
        <button
          onClick={() => go(featured.slug)}
          className="hover-lift group block w-full text-left rounded-2xl p-7 sm:p-9 mb-4"
          style={{
            background: 'color-mix(in oklab, var(--color-card) 55%, transparent)',
            border: '1px solid var(--color-border)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'color-mix(in oklab, var(--color-brand) 38%, transparent)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
        >
          <div className="text-[11px] font-mono uppercase tracking-[0.28em] mb-4" style={{ color: 'var(--color-brand)' }}>
            Featured{featured.subtitle ? ` \u00b7 ${featured.subtitle}` : ''}
          </div>
          <h3 className="font-heading text-[clamp(1.5rem,4vw,2.1rem)] leading-tight mb-3" style={{ fontWeight: 500 }}>
            {featured.title}
          </h3>
          {featured.excerpt && (
            <p className="text-[15px] sm:text-base leading-relaxed text-muted-foreground max-w-xl">
              {featured.excerpt}
            </p>
          )}
          <span className="inline-flex items-center gap-1.5 mt-5 text-sm font-medium" style={{ color: 'var(--color-brand)' }}>
            Read the story
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </button>

        {/* More titles — a compact, live list */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)', background: 'color-mix(in oklab, var(--color-card) 40%, transparent)' }}>
          {more.map((p, i) => (
            <button
              key={p.slug}
              onClick={() => go(p.slug)}
              className="group w-full text-left flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
              style={{ borderTop: i ? '1px solid color-mix(in oklab, var(--color-border) 60%, transparent)' : 'none' }}
            >
              <div className="min-w-0 flex-1">
                <div className="text-[14.5px] font-medium text-foreground truncate group-hover:text-accent transition-colors">{p.title}</div>
                <div className="text-[11.5px] text-muted-foreground truncate mt-0.5">
                  {categoryLabel(p.category)} {'\u00b7'} {formatDate(p.date)} {'\u00b7'} {p.readingMins} min
                </div>
              </div>
              <svg className="w-4 h-4 flex-shrink-0 text-muted-foreground/50 group-hover:text-accent group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
