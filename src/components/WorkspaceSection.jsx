import React, { Suspense, lazy } from 'react'

const Workspace = lazy(() => import('./Workspace'))

export default function WorkspaceSection() {
  return (
    <section id="workspace" className="relative py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section heading */}
        <div className="text-center mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] mb-3"
             style={{ color: 'color-mix(in oklab, var(--chart-1) 75%, var(--color-muted-foreground))' }}>
            Interactive
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl tracking-tight" style={{ fontWeight: 600 }}>
            Step into my <span className="text-gradient-violet">workspace</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-xl mx-auto">
            A 3D room with everything I'm working on. Click items to open sections, or hit <kbd className="px-1 py-px rounded bg-foreground/10 text-foreground text-[10.5px] font-mono">Play</kbd> for game mode (WASD + E).
          </p>
        </div>

        {/* Embedded canvas — fixed aspect, rounded, glow border */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            height: 'min(70vh, 640px)',
            boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 30%, var(--color-border)), 0 24px 60px -16px color-mix(in oklab, var(--chart-1) 35%, transparent)',
          }}
        >
          <Suspense fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-card">
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-3 border-2 border-muted-foreground/20 border-t-violet-500 rounded-full animate-spin" />
                <p className="text-xs text-muted-foreground font-mono">Loading 3D scene…</p>
              </div>
            </div>
          }>
            <Workspace embedded />
          </Suspense>
        </div>

        {/* Quick-access chips below canvas — for users who can't/won't 3D */}
        <div className="mt-5 flex flex-wrap gap-2 justify-center">
          <span className="text-[10.5px] text-muted-foreground mr-1 self-center">Or jump straight to:</span>
          {[
            { id: 'projects', label: 'Projects', icon: '💻' },
            { id: 'experience', label: 'Experience', icon: '💼' },
            { id: 'tech', label: 'Tech stack', icon: '⚙️' },
            { id: 'travel', label: 'Travel', icon: '🗺' },
            { id: 'connect', label: 'Contact', icon: '✉️' },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => document.getElementById(c.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              style={{
                background: 'color-mix(in oklab, var(--chart-1) 6%, transparent)',
                boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 18%, transparent)',
              }}
            >
              <span>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
