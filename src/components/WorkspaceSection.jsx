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
            Interactive · live
          </p>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl tracking-tight" style={{ fontWeight: 600 }}>
            A peek into my <span className="text-gradient-violet">space</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-xl mx-auto">
            Click <span className="text-foreground font-medium">me</span>, the <span className="text-foreground font-medium">cork board</span>, dumbbell, headphones — or the <span className="text-foreground font-medium">monitor</span> to <span className="text-gradient-violet font-semibold">dive inception-style</span> into a room within the room.
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
      </div>
    </section>
  )
}
