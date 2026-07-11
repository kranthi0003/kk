import React, { useState } from 'react'
import { TOPICS, topicCount, postsByTopic, notePosts, tilPosts, categoryLabel, topicLabel, formatDate } from '../lib/blog'

// The Knowledge Base — a growing, searchable set of technical notes grouped by
// topic. Counts are always real (computed from actual posts), so empty topics
// honestly read "growing" rather than faking a number. Notes and TILs live in
// the same registry as the blog; this page is just the topic-first view of them.

const ACCENT = 'var(--color-brand)'
const goPost = (slug) => { window.location.hash = `#/blog/${slug}` }

function TopicCard({ topic, active, onClick }) {
  const n = topicCount(topic.id)
  return (
    <button onClick={onClick}
      className="group text-left rounded-2xl p-4 transition-all"
      style={active
        ? { background: `color-mix(in oklab, ${ACCENT} 12%, transparent)`, border: `1px solid color-mix(in oklab, ${ACCENT} 42%, transparent)` }
        : { background: 'color-mix(in oklab, var(--color-card) 58%, transparent)', border: '1px solid var(--color-border)' }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = `color-mix(in oklab, ${ACCENT} 34%, transparent)` }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = 'var(--color-border)' }}>
      <div className="text-[1.4rem] mb-1.5" aria-hidden="true">{topic.icon}</div>
      <div className="text-[13.5px] font-medium leading-snug" style={{ color: 'var(--color-foreground)' }}>{topic.label}</div>
      <div className="text-[11px] font-mono mt-1" style={{ color: n > 0 ? ACCENT : 'var(--color-muted-foreground)' }}>
        {n > 0 ? `${n} note${n === 1 ? '' : 's'}` : 'growing'}
      </div>
    </button>
  )
}

function NoteRow({ post }) {
  return (
    <button onClick={() => goPost(post.slug)} className="group w-full text-left rounded-xl px-4 py-3.5 transition-all flex items-start gap-3"
      style={{ background: 'color-mix(in oklab, var(--color-card) 58%, transparent)', border: '1px solid var(--color-border)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `color-mix(in oklab, ${ACCENT} 38%, transparent)` }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {post.til && (
            <span className="text-[9px] font-mono font-semibold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded" style={{ color: ACCENT, background: `color-mix(in oklab, ${ACCENT} 13%, transparent)`, border: `1px solid color-mix(in oklab, ${ACCENT} 32%, transparent)` }}>TIL</span>
          )}
          <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground/80">{categoryLabel(post.category)}</span>
        </div>
        <div className="text-[15px] font-medium leading-snug truncate" style={{ color: 'var(--color-foreground)' }}>{post.title}</div>
        {post.excerpt && <p className="text-[12.5px] leading-relaxed text-muted-foreground mt-0.5 line-clamp-2">{post.excerpt}</p>}
        <div className="text-[11px] text-muted-foreground/60 font-mono mt-1.5">{formatDate(post.date)} · {post.readingMins} min</div>
      </div>
      <svg className="w-4 h-4 flex-shrink-0 mt-1 text-muted-foreground/40 group-hover:translate-x-0.5 group-hover:text-foreground transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" /></svg>
    </button>
  )
}

export default function KnowledgeBase({ onBack }) {
  const [topic, setTopic] = useState('all')

  const notes = topic === 'all' ? notePosts() : postsByTopic(topic)
  const tilCount = tilPosts().length
  const totalNotes = notePosts().length

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
        <header className="mb-9">
          <div className="text-[11px] font-mono uppercase tracking-[0.28em] mb-3" style={{ color: ACCENT }}>Knowledge base</div>
          <h1 className="font-heading text-[clamp(2.2rem,7vw,3.4rem)] leading-[1.05] mb-3" style={{ fontWeight: 500 }}>Notes</h1>
          <p className="text-[clamp(1rem,2.4vw,1.18rem)] leading-relaxed text-muted-foreground max-w-xl">
            My working notes, cheatsheets, and “today I learned” snippets — the answers I’ll want to search for again in six months. It grows a little every week.
          </p>
          <p className="text-[12px] text-muted-foreground/60 font-mono mt-3">
            {totalNotes} note{totalNotes === 1 ? '' : 's'}{tilCount > 0 && <> · {tilCount} TIL</>}
          </p>
        </header>

        {/* Topic grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
          {TOPICS.map(t => (
            <TopicCard key={t.id} topic={t} active={topic === t.id} onClick={() => setTopic(topic === t.id ? 'all' : t.id)} />
          ))}
        </div>

        {/* Filter status */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-[1.15rem]" style={{ fontWeight: 500 }}>
            {topic === 'all' ? 'Latest notes' : topicLabel(topic)}
          </h2>
          {topic !== 'all' && (
            <button onClick={() => setTopic('all')} className="text-[12px] font-mono transition-colors hover:text-foreground" style={{ color: ACCENT }}>← all topics</button>
          )}
        </div>

        {/* Notes list */}
        {notes.length > 0 ? (
          <div className="space-y-2.5">
            {notes.map(p => <NoteRow key={p.slug} post={p} />)}
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl" style={{ border: '1px dashed var(--color-border)' }}>
            <p className="font-heading text-lg mb-1" style={{ fontWeight: 500 }}>Nothing here yet</p>
            <p className="text-sm text-muted-foreground">The first <span style={{ color: ACCENT }}>{topicLabel(topic)}</span> note is on its way.</p>
          </div>
        )}

        <p className="text-[12px] text-muted-foreground/60 mt-10 text-center">
          A personal documentation system in progress — the list just has to keep growing.
        </p>
      </div>
    </div>
  )
}
