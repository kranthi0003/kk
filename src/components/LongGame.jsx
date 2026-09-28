import React, { useState, useMemo } from 'react'
import { sectionPosts, formatDate } from '../lib/blog'
import { LG_CATEGORIES, lgCategoryLabel } from '../lib/longGamePosts'

/* ------------------------------------------------------------------ *
 * #/longgame — the essays index.
 *
 * Deliberately a different room from #/blog. That index is a technical
 * log: dense, chip-filtered, built for scanning. This one is for pieces
 * that take eight minutes to read, so it is wider-set, quieter, and
 * shows the whole standfirst rather than a clipped excerpt.
 *
 * Posts still render through BlogPost, so there is one post engine and
 * one renderer. Only the way in is different.
 * ------------------------------------------------------------------ */

const INK = 'var(--color-foreground)'

export default function LongGame({ onBack }) {
  const [cat, setCat] = useState('all')
  const all = useMemo(() => sectionPosts('longgame'), [])
  const shown = cat === 'all' ? all : all.filter((p) => p.category === cat)

  const count = (id) =>
    id === 'all' ? all.length : all.filter((p) => p.category === id).length

  return (
    <div className="lg-root">
      <style>{LG_STYLE}</style>

      <div className="lg-wrap">
        <button onClick={onBack} className="lg-back">
          <span aria-hidden="true">←</span> Back
        </button>

        <header className="lg-head">
          <p className="lg-eyebrow">Essays</p>
          <h1 className="lg-title">The Long Game</h1>
          <p className="lg-standfirst">
            Notes on psychology, self-worth, attachment and ambition — written
            from the mechanism up. Where the evidence is contested, the essay
            says so.
          </p>
        </header>

        <nav className="lg-filters" aria-label="Filter essays by subject">
          {[{ id: 'all', label: 'Everything' }, ...LG_CATEGORIES].map((c) => {
            const n = count(c.id)
            const on = cat === c.id
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                aria-pressed={on}
                disabled={n === 0}
                className={`lg-chip ${on ? 'is-on' : ''}`}
              >
                {c.label}
                <span className="lg-chip-n">{n}</span>
              </button>
            )
          })}
        </nav>

        {shown.length === 0 ? (
          <p className="lg-empty">
            Nothing filed under {lgCategoryLabel(cat)} yet.
          </p>
        ) : (
          <div className="lg-list">
            {shown.map((p) => (
              <article key={p.slug} className="lg-item">
                <a href={`#/longgame/${p.slug}`} className="lg-link">
                  <p className="lg-meta">
                    <span className="lg-cat">{lgCategoryLabel(p.category)}</span>
                    <span className="lg-dot" aria-hidden="true">·</span>
                    <span>{formatDate(p.date)}</span>
                    <span className="lg-dot" aria-hidden="true">·</span>
                    <span>{p.readingMins} min read</span>
                  </p>
                  <h2 className="lg-h2">{p.title}</h2>
                  {p.subtitle && <p className="lg-sub">{p.subtitle}</p>}
                  <p className="lg-excerpt">{p.excerpt}</p>
                  <span className="lg-more">
                    Read <span aria-hidden="true">→</span>
                  </span>
                </a>
              </article>
            ))}
          </div>
        )}

        <p className="lg-foot">
          Looking for the engineering writing? That lives at{' '}
          <a href="#/blog" className="lg-foot-a">/blog</a>.
        </p>
      </div>
    </div>
  )
}

const LG_STYLE = `
.lg-root {
  min-height: 100vh;
  background: var(--color-background);
  color: ${INK};
  padding: 1.5rem 1rem 5rem;
}
.lg-wrap { max-width: 46rem; margin: 0 auto; }

.lg-back {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--color-muted-foreground);
  background: none; border: 0; cursor: pointer;
  padding: 0.6rem 0.2rem; min-height: 44px; margin-bottom: 1.5rem;
}
.lg-back:hover { color: ${INK}; }

/* ---------- masthead ---------- */
.lg-head { padding-bottom: 2.25rem; border-bottom: 1px solid var(--color-border); }
.lg-eyebrow {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase;
  color: var(--color-muted-foreground); margin-bottom: 0.9rem;
}
.lg-title {
  font-family: 'Newsreader', Georgia, serif;
  font-weight: 400;
  font-size: clamp(2.4rem, 9vw, 4rem);
  line-height: 1.02; letter-spacing: -0.03em;
  margin-bottom: 1.1rem;
}
.lg-standfirst {
  font-family: 'Newsreader', Georgia, serif;
  font-size: clamp(1.05rem, 2.6vw, 1.3rem);
  line-height: 1.6; max-width: 34rem;
  color: var(--color-muted-foreground);
}

/* ---------- filters ---------- */
.lg-filters {
  display: flex; flex-wrap: wrap; gap: 0.5rem;
  margin: 1.75rem 0 2.5rem;
}
.lg-chip {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px; letter-spacing: 0.04em;
  padding: 0.6rem 0.85rem; min-height: 44px;
  border-radius: 999px; cursor: pointer;
  color: var(--color-muted-foreground);
  background: transparent;
  border: 1px solid var(--color-border);
  transition: all 0.18s ease;
}
.lg-chip:hover:not(:disabled) { color: ${INK}; border-color: var(--color-muted-foreground); }
.lg-chip.is-on {
  color: var(--color-background);
  background: ${INK};
  border-color: ${INK};
}
.lg-chip:disabled { opacity: 0.35; cursor: default; }
.lg-chip-n { font-size: 10px; opacity: 0.6; }

/* ---------- the list ---------- */
.lg-list { display: flex; flex-direction: column; }
.lg-item { border-bottom: 1px solid var(--color-border); }
.lg-item:first-child { border-top: 1px solid var(--color-border); }
.lg-link {
  display: block; padding: 2.25rem 0;
  text-decoration: none; color: inherit;
}
.lg-link:hover .lg-h2 { text-decoration: underline; text-underline-offset: 4px; }
.lg-link:hover .lg-more { opacity: 1; transform: translateX(2px); }

.lg-meta {
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--color-muted-foreground); margin-bottom: 0.85rem;
}
.lg-cat { color: ${INK}; }
.lg-dot { opacity: 0.4; }

.lg-h2 {
  font-family: 'Newsreader', Georgia, serif;
  font-weight: 500;
  font-size: clamp(1.5rem, 4.6vw, 2.15rem);
  line-height: 1.14; letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}
.lg-sub {
  font-family: 'Newsreader', Georgia, serif;
  font-style: italic;
  font-size: clamp(1rem, 2.4vw, 1.18rem);
  line-height: 1.45;
  color: var(--color-muted-foreground);
  margin-bottom: 0.9rem;
}
.lg-excerpt {
  font-size: 0.95rem; line-height: 1.7;
  color: var(--color-muted-foreground);
  max-width: 36rem; margin-bottom: 1.1rem;
}
.lg-more {
  display: inline-block;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  color: ${INK}; opacity: 0.55;
  transition: all 0.18s ease;
}

.lg-empty {
  padding: 3rem 0; text-align: center;
  font-size: 0.95rem; color: var(--color-muted-foreground);
}

.lg-foot {
  margin-top: 3.5rem; padding-top: 1.75rem;
  border-top: 1px solid var(--color-border);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px; line-height: 1.7;
  color: var(--color-muted-foreground);
}
.lg-foot-a { color: ${INK}; text-decoration: underline; text-underline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  .lg-chip, .lg-more { transition: none; }
}
`
