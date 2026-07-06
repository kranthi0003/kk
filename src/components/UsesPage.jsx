import React from 'react'

// A "/uses" page — the tools, gear and software behind the work. Inspired by
// the uses.tech community. Keep it honest: items marked { real: true } are
// verified facts; the rest are gentle "add yours" prompts for you to fill in
// (styled muted + dashed so the page never looks empty). Edit freely and bump
// the UPDATED date when you revise it.

const UPDATED = 'July 2026'

// real:true  -> shown as a confirmed item (accent dot)
// real:false -> shown as a muted prompt for you to personalize
const USES = [
  {
    icon: '💻',
    title: 'Machine',
    items: [
      { text: 'macOS — my daily driver for everything from support work to shipping this site.', real: true },
      { text: 'Add your Mac model + chip (e.g. MacBook Pro 14″, M-series) and RAM.', real: false },
    ],
  },
  {
    icon: '⌨️',
    title: 'Editor & terminal',
    items: [
      { text: 'The **`gh` CLI** and **git** — most of my day runs through the terminal.', real: true },
      { text: '**GitHub Copilot CLI** — an AI pair right in the shell.', real: true },
      { text: 'Add your editor (VS Code? Neovim?) and the extensions you can’t live without.', real: false },
      { text: 'Add your terminal + shell (iTerm/Ghostty, zsh, prompt, plugins).', real: false },
    ],
  },
  {
    icon: '🛠️',
    title: 'Build & ship',
    items: [
      { text: '**React + Vite + Tailwind** — the stack this whole site is built on.', real: true },
      { text: 'Deployed to **GitHub Pages** via a **GitHub Actions** workflow.', real: true },
      { text: 'Add the languages & frameworks you reach for most (Go, Python, Terraform…).', real: false },
    ],
  },
  {
    icon: '🤖',
    title: 'AI in the loop',
    items: [
      { text: '**GitHub Copilot** — code completion and chat, woven into the workflow.', real: true },
      { text: 'Add other AI tools you rely on (models, agents, prompts worth keeping).', real: false },
    ],
  },
  {
    icon: '📱',
    title: 'Everyday',
    items: [
      { text: 'Add your phone, note-taking app, browser, and what you listen to while heads-down.', real: false },
    ],
  },
  {
    icon: '🪑',
    title: 'Desk & peripherals',
    items: [
      { text: 'Add your keyboard, mouse/trackpad, monitor, headphones, and chair.', real: false },
    ],
  },
]

// Render **bold** spans; everything else is plain text.
function renderLine(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold" style={{ color: 'var(--color-foreground)' }}>{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  )
}

export default function UsesPage({ onBack }) {
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
          <div className="text-[11px] font-mono uppercase tracking-[0.28em] mb-3" style={{ color: 'var(--color-accent)' }}>What I use</div>
          <h1 className="font-heading text-[clamp(2.2rem,7vw,3.4rem)] leading-[1.05] mb-3" style={{ fontWeight: 500 }}>Uses</h1>
          <p className="text-[clamp(1rem,2.4vw,1.18rem)] leading-relaxed text-muted-foreground max-w-xl">
            The hardware, software, and tools behind the work — a living list I keep up to date.
          </p>
          <p className="text-[12px] text-muted-foreground/60 font-mono mt-3">Updated {UPDATED}</p>
        </header>

        <div className="space-y-4">
          {USES.map((s) => (
            <section key={s.title} className="rounded-2xl p-5"
              style={{ background: 'color-mix(in oklab, var(--color-card) 62%, transparent)', border: '1px solid var(--color-border)' }}>
              <h2 className="font-heading text-[1.15rem] mb-2.5 flex items-center gap-2" style={{ fontWeight: 500 }}>
                <span aria-hidden="true">{s.icon}</span> {s.title}
              </h2>
              <ul className="space-y-1.5">
                {s.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[14.5px] leading-relaxed"
                    style={{ color: item.real ? 'var(--color-muted-foreground)' : 'color-mix(in oklab, var(--color-muted-foreground) 60%, transparent)' }}>
                    {item.real ? (
                      <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--color-accent)' }} />
                    ) : (
                      <span className="mt-1.5 flex-shrink-0 text-[13px] leading-none" style={{ color: 'color-mix(in oklab, var(--color-accent) 55%, transparent)' }} aria-hidden="true">+</span>
                    )}
                    <span className={item.real ? '' : 'italic'}>{renderLine(item.text)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="text-[12px] text-muted-foreground/60 mt-8 text-center">
          Inspired by <a href="https://uses.tech/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">the /uses movement</a>.
        </p>
      </div>
    </div>
  )
}
