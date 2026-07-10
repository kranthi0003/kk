import React from 'react'

// A quiet homepage entry into the dopamine explainer — calm, in the site's
// voice, no hard sell. Routes to the full #/dopamine page.
export default function DopamineTeaser() {
  const go = () => { window.location.hash = '#/blog/cheap-dopamine' }
  return (
    <section className="py-20 sm:py-28 px-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={go}
          className="group block w-full text-left rounded-2xl p-7 sm:p-9 transition-all"
          style={{
            background: 'color-mix(in oklab, var(--color-card) 55%, transparent)',
            border: '1px solid var(--color-border)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'color-mix(in oklab, #e0a04a 38%, transparent)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)' }}
        >
          <div className="text-[11px] font-mono uppercase tracking-[0.28em] mb-4" style={{ color: '#e0a04a' }}>
            From the blog · the science of cheap dopamine
          </div>
          <h3 className="font-heading text-[clamp(1.5rem,4vw,2.1rem)] leading-tight mb-3" style={{ fontWeight: 500 }}>
            Phone. Porn. Sugar.
          </h3>
          <p className="text-[15px] sm:text-base leading-relaxed text-muted-foreground max-w-xl">
            Three habits that feel unrelated, run by one hijacked circuit. A calm, honest breakdown of how it works in the brain — and how it lets go.
          </p>
          <span className="inline-flex items-center gap-1.5 mt-5 text-sm font-medium" style={{ color: '#e0a04a' }}>
            Read the breakdown
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </button>
      </div>
    </section>
  )
}
