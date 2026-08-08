import React, { Suspense, lazy, useState, useCallback } from 'react'

const Workspace = lazy(() => import('./Workspace'))

// The 3D scene can fail in ways Suspense won't catch — a lost WebGL context, a
// model that won't parse. Without a boundary those throw straight through and
// take the page with them, so catch here and offer the reload instead.
class SceneBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function RefreshIcon({ spinning }) {
  return (
    <svg
      className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <polyline points="21 3 21 9 15 9" />
    </svg>
  )
}

export default function WorkspaceSection() {
  const [reloadKey, setReloadKey] = useState(0)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    if (busy) return
    setBusy(true)
    // The chunk is already downloaded by the time anyone can click this, so the
    // dynamic import just hands back the loaded module and costs nothing.
    try {
      const mod = await import('./Workspace')
      mod.clearWorkspaceAssets?.()
    } catch {}
    setReloadKey(k => k + 1)
    setTimeout(() => setBusy(false), 700)
  }, [busy])

  const loader = (
    <div className="absolute inset-0 flex items-center justify-center bg-card">
      <div className="text-center">
        <div className="w-8 h-8 mx-auto mb-3 border-2 border-muted-foreground/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-mono">Loading 3D scene…</p>
      </div>
    </div>
  )

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
          
        </div>

        {/* Embedded canvas — fixed aspect, rounded, glow border */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            height: 'min(70vh, 640px)',
            boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 30%, var(--color-border)), 0 24px 60px -16px color-mix(in oklab, var(--chart-1) 35%, transparent)',
          }}
        >
          <SceneBoundary
            key={reloadKey}
            fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-card">
                <div className="text-center px-6">
                  <p className="text-sm text-muted-foreground mb-3">The scene didn't load.</p>
                  <button
                    onClick={reload}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border hover:bg-muted/40 transition-colors"
                  >
                    Try again
                  </button>
                </div>
              </div>
            }
          >
            <Suspense fallback={loader}>
              <Workspace embedded />
            </Suspense>
          </SceneBoundary>

          {/* Reload just this scene — cheaper than reloading the whole page when
              the canvas comes up empty. Sits above the scene and swallows the
              pointer so OrbitControls doesn't read the click as a drag. */}
          <button
            onClick={reload}
            onPointerDown={e => e.stopPropagation()}
            disabled={busy}
            aria-label="Reload the 3D scene"
            title="Reload the scene"
            className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-white/70 hover:text-white transition-colors disabled:opacity-50"
            style={{
              background: 'rgba(10,12,20,0.55)',
              border: '1px solid rgba(255,255,255,0.14)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          >
            <RefreshIcon spinning={busy} />
            <span className="hidden sm:inline">Reload</span>
          </button>
        </div>
      </div>
    </section>
  )
}
