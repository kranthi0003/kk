import React from 'react'

export default function AstroDitherSection() {
  return (
    <section id="astro-experiment" className="relative py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] mb-3"
             style={{ color: 'color-mix(in oklab, var(--chart-2) 75%, var(--color-muted-foreground))' }}>
            Experiment · interactive
          </p>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl tracking-tight" style={{ fontWeight: 600 }}>
            Fun <span className="text-gradient-violet">things</span> I built
          </h2>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* AstroDither card */}
          <a href="#/astro"
             className="group relative rounded-xl overflow-hidden border border-white/[0.06] bg-card/50 backdrop-blur-sm p-6 hover:border-white/[0.12] transition-all duration-300 hover:shadow-[0_8px_32px_-8px_rgba(120,80,255,0.15)]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-indigo-300 transition-colors">
                Astro Dither
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Audio-reactive particle experiment with dithering shader, fluid dynamics, and mouse interaction.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-muted-foreground/60">
                <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">WebGL</span>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">GLSL</span>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">Audio</span>
              </div>
            </div>
          </a>

          {/* Space Explorer card */}
          <a href="#/space"
             className="group relative rounded-xl overflow-hidden border border-white/[0.06] bg-card/50 backdrop-blur-sm p-6 hover:border-white/[0.12] transition-all duration-300 hover:shadow-[0_8px_32px_-8px_rgba(255,150,50,0.15)]">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-amber-300 transition-colors">
                Space Explorer
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Interactive 3D solar system with real textures, elliptical orbits, dwarf planets, comets, and deep sky objects.
              </p>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-muted-foreground/60">
                <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">Three.js</span>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">R3F</span>
                <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">3D</span>
              </div>
            </div>
          </a>
        </div>
      </div>
    </section>
  )
}
