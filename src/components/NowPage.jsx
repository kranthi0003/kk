import React from 'react'

// A calm "/now" page — what I'm focused on at the moment. Inspired by
// nownownow.com. Keep it honest and current; [bracket] spots are editable.
// Update the `updated` date whenever you revise it.

const UPDATED = 'July 2026'

// Only things that are true right now. Aspirational items are marked "planned".
const NOW = [
  {
    icon: '🏢',
    title: 'Work',
    lines: [
      'On **GitHub Actions** at **GitHub** — helping enterprises run large-scale CI/CD reliably.',
      '[Add a line about what you are focused on this quarter.]',
    ],
  },
  {
    icon: '📚',
    title: 'Learning',
    lines: [
      '[Add what you are actively studying — e.g. a certification or a topic.]',
      'Writing up what I learn as I go, here on the site.',
    ],
  },
  {
    icon: '🛠️',
    title: 'Building',
    lines: [
      '**kranthikiran.com** — this site, as a living personal documentation system.',
      '[Add any side project you are building right now.]',
    ],
  },
  {
    icon: '📝',
    title: 'Writing',
    lines: [
      'Certification stories & learning paths in the blog.',
      '[Add the next piece you want to write.]',
    ],
  },
  {
    icon: '🌱',
    title: 'Life',
    lines: [
      'A 100-day lean cut — tracked in the private Transformation HQ.',
      'Based in Visakhapatnam, India.',
    ],
  },
]

// Render **bold** spans and leave [brackets] visible as editable markers.
function renderLine(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold" style={{ color: 'var(--color-foreground)' }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

export default function NowPage({ onBack }) {
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
        <header className="mb-9">
          <div className="text-[11px] font-mono uppercase tracking-[0.28em] mb-3" style={{ color: 'var(--color-accent)' }}>What I'm doing now</div>
          <h1 className="font-heading text-[clamp(2.2rem,7vw,3.4rem)] leading-[1.05] mb-3" style={{ fontWeight: 500 }}>Now</h1>
          <p className="text-[clamp(1rem,2.4vw,1.18rem)] leading-relaxed text-muted-foreground max-w-xl">
            A snapshot of what has my attention at the moment — not a résumé, just the present tense.
          </p>
          <p className="text-[12px] text-muted-foreground/60 font-mono mt-3">Updated {UPDATED}</p>
        </header>

        <div className="space-y-4">
          {NOW.map((s) => (
            <section key={s.title} className="rounded-2xl p-5"
              style={{ background: 'color-mix(in oklab, var(--color-card) 62%, transparent)', border: '1px solid var(--color-border)' }}>
              <h2 className="font-heading text-[1.15rem] mb-2.5 flex items-center gap-2" style={{ fontWeight: 500 }}>
                <span aria-hidden="true">{s.icon}</span> {s.title}
              </h2>
              <ul className="space-y-1.5">
                {s.lines.map((line, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[14.5px] leading-relaxed text-muted-foreground">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--color-accent)' }} />
                    <span>{renderLine(line)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="text-[12px] text-muted-foreground/60 mt-8 text-center">
          Inspired by <a href="https://nownownow.com/about" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">the /now page movement</a>.
        </p>
      </div>
    </div>
  )
}
