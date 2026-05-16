import React from 'react'

const projects = [
  {
    name: 'deploy-diff',
    title: 'Visual Diff for Infra Configs',
    desc: 'Paste two docker-compose or K8s files, see what changed — added services, removed ports, env diffs. Clean visual diff for infrastructure.',
    tech: ['react', 'yaml-parser', 'diff-engine'],
    status: 'wip',
    url: null,
    github: null,
  },
  {
    name: 'cron-explain',
    title: 'Cron Expression Translator',
    desc: 'Paste a cron expression, get human-readable explanation, next 10 run times, timezone converter. Works offline. Better than crontab.guru.',
    tech: ['typescript', 'cron-parser', 'offline-first'],
    status: 'wip',
    url: null,
    github: null,
  },
  {
    name: 'stranger-chat',
    title: 'Anonymous P2P Text Chat',
    desc: 'Real-time matchmaking with random visitors. WebRTC for direct peer messaging, Supabase for presence.',
    tech: ['webrtc', 'supabase', 'react', 'p2p'],
    status: 'wip',
    url: null,
    github: null,
  },
  {
    name: 'sketchgate',
    title: 'Distributed Rate Limiter',
    desc: 'High-availability rate limiter with penalty queues. Sliding window counters, adaptive throttling.',
    tech: ['go', 'distributed-systems', 'cloud-native'],
    status: 'active',
    url: null,
    github: 'https://github.com/kranthi0003/SketchGate',
  },
  {
    name: 'kranthikiran.com',
    title: 'This Portfolio Site',
    desc: 'React + Tailwind + Vite. Boot sequence, 3D globe, AI chatbot, terminal with games, matrix easter egg.',
    tech: ['react', 'tailwind', 'vite', 'groq-ai'],
    status: 'active',
    url: 'https://kranthikiran.com',
    github: 'https://github.com/kranthi0003/kranthi-kiran-site',
  },
]

const statusColors = {
  active: { label: '● ACTIVE', text: 'text-green-500' },
  wip: { label: '● WIP', text: 'text-orange-500' },
  archived: { label: 'ARCHIVED', text: 'text-muted-foreground' },
}

export default function Projects() {
  return (
    <section id="projects" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-mono text-xs text-accent uppercase tracking-[0.2em] mb-3">Projects</p>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl tracking-tight" style={{ fontWeight: 600 }}>
            What I've built
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-xl mx-auto">
            A handful of tools, experiments, and things I keep meaning to ship.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p, i) => {
            const s = statusColors[p.status]
            const tints = ['pr-tint-violet', 'pr-tint-magenta', 'pr-tint-coral']
            return (
              <div
                key={p.name}
                className={`group relative bg-card hover:border-accent/40 transition-colors overflow-hidden ${tints[i % 3]}`}
              >
                <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-accent/0 to-transparent group-hover:via-accent/70 transition-colors" />
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/20 bg-muted/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  <span className="flex-1 text-center text-[11px] font-mono text-muted-foreground truncate">{p.name}</span>
                  <span className={`text-[9px] font-mono font-bold ${s.text}`}>{s.label}</span>
                </div>

                {/* Body */}
                <div className="px-4 py-4">
                  <p className="font-mono text-sm font-medium text-foreground mb-1.5"><span className="text-accent">$</span> {p.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-3">{p.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {p.tech.slice(0, 3).map(t => (
                        <span key={t} className="px-2 py-0.5 rounded text-[10px] font-mono bg-muted/50 text-muted-foreground">{t}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {p.github && (
                        <a href={p.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        </a>
                      )}
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* View all */}
        <div className="text-center mt-10">
          <a
            href="https://github.com/kranthi0003"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>~/github</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
