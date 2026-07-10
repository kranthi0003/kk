import React from 'react'

// Learning Timeline — the certification & learning journey. Earned items link
// to their story articles. "In progress" / "Planned" reflect intent, not
// achievements (so nothing is misrepresented). Add real dates in [brackets]
// when you want them.

const ACCENT = 'var(--color-accent)'
const goArticle = (slug) => { window.location.hash = `#/blog/${slug}` }

const GROUPS = [
  {
    status: 'Earned',
    color: '#67c98c',
    items: [
      { name: 'AWS Solutions Architect — Associate', slug: 'aws-saa', when: '[year]' },
      { name: 'Couchbase Certified — Administrator', slug: 'couchbase-admin', when: '[year]' },
      { name: 'Couchbase Certified — Python Developer', slug: 'couchbase-python', when: '[year]' },
      { name: 'Couchbase Certified — Architect', slug: 'couchbase-architect', when: '[year]' },
      { name: 'GitHub Foundations', slug: 'github-foundations', when: '2026' },
      { name: 'GitHub Administration', slug: 'github-administration', when: '2026' },
      { name: 'GitHub Actions', slug: 'github-actions', when: '2026' },
    ],
  },
  {
    status: 'In progress',
    color: '#e0a04a',
    items: [
      { name: '[Add what you are studying right now]', when: '' },
    ],
  },
  {
    status: 'On the horizon',
    color: '#7aa2f7',
    items: [
      { name: 'GitHub Advanced Security', when: 'planned' },
      { name: 'Terraform Associate', when: 'planned' },
      { name: 'CKAD — Certified Kubernetes App Developer', when: 'planned' },
      { name: 'OMSCS — Georgia Tech', when: '[2027]' },
    ],
  },
]

export default function Timeline({ onBack }) {
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

      <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-6 pt-24 pb-24">
        <header className="mb-10">
          <div className="text-[11px] font-mono uppercase tracking-[0.28em] mb-3" style={{ color: ACCENT }}>The journey so far</div>
          <h1 className="font-heading text-[clamp(2.2rem,7vw,3.4rem)] leading-[1.05] mb-3" style={{ fontWeight: 500 }}>Learning Timeline</h1>
          <p className="text-[clamp(1rem,2.4vw,1.18rem)] leading-relaxed text-muted-foreground max-w-xl">
            Certifications earned, what I'm learning now, and what's next. Tap an earned one to read the story behind it.
          </p>
        </header>

        <div className="space-y-9">
          {GROUPS.map((g) => (
            <section key={g.status}>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: g.color }} />
                <h2 className="font-heading text-[1.2rem]" style={{ fontWeight: 500 }}>{g.status}</h2>
                <span className="text-[11px] text-muted-foreground tabular-nums">{g.items.length}</span>
              </div>

              {/* vertical rail */}
              <div className="relative pl-6" style={{ borderLeft: `1px solid var(--color-border)` }}>
                {g.items.map((it, i) => {
                  const clickable = !!it.slug
                  return (
                    <div key={i} className="relative mb-3 last:mb-0">
                      <span className="absolute -left-[27px] top-2.5 w-2.5 h-2.5 rounded-full" style={{ background: g.color, boxShadow: '0 0 0 3px var(--color-background)' }} />
                      {clickable ? (
                        <button onClick={() => goArticle(it.slug)}
                          className="group w-full text-left rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 transition-all"
                          style={{ background: 'color-mix(in oklab, var(--color-card) 60%, transparent)', border: '1px solid var(--color-border)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = `color-mix(in oklab, ${g.color} 40%, transparent)` }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}>
                          <span className="min-w-0">
                            <span className="block text-[14px] font-medium truncate" style={{ color: 'var(--color-foreground)' }}>{it.name}</span>
                            <span className="block text-[11px] text-muted-foreground">Read the story →</span>
                          </span>
                          {it.when && <span className="text-[11px] text-muted-foreground font-mono flex-shrink-0">{it.when}</span>}
                        </button>
                      ) : (
                        <div className="rounded-xl px-4 py-2.5 flex items-center justify-between gap-3"
                          style={{ background: 'color-mix(in oklab, var(--color-card) 40%, transparent)', border: '1px dashed var(--color-border)' }}>
                          <span className="text-[14px] text-muted-foreground">{it.name}</span>
                          {it.when && <span className="text-[11px] text-muted-foreground/70 font-mono flex-shrink-0">{it.when}</span>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        <p className="text-[12px] text-muted-foreground/60 mt-10 text-center">
          Progress over perfection — the list just has to keep growing.
        </p>
      </div>
    </div>
  )
}
