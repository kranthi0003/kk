import React from 'react'

const skillGroups = [
  { title: 'Languages', items: ['Python', 'Java', 'Ruby', 'Bash', 'Go', 'JavaScript'] },
  { title: 'Cloud & Infra', items: ['AWS', 'Azure', 'Terraform', 'Docker', 'Kubernetes', 'Linux'] },
  { title: 'Data & Monitoring', items: ['PostgreSQL', 'Couchbase', 'Redis', 'Prometheus', 'Grafana'] },
  { title: 'DevOps & Tools', items: ['GitHub Actions', 'GitOps', 'CI/CD', 'Copilot', 'VSCode'] },
]

const certs = [
  { name: 'AWS Solutions Architect', tag: 'SAA', url: 'https://www.credly.com/badges/4528a7ce-198b-4edd-94dd-54bea26bcafd' },
  { name: 'Couchbase Admin', tag: 'PRO', url: 'https://www.credly.com/badges/21986ffd-3145-4312-8ed8-8f870454b7d5/public_url' },
  { name: 'Couchbase Python', tag: 'DEV', url: 'https://www.credly.com/badges/6351ce61-4f3f-460e-935c-5b0e89e39c65' },
  { name: 'Couchbase Architect', tag: 'ARCH', url: 'https://www.credly.com/badges/e87a7035-55d0-4612-b5b4-8dc031560433' },
  { name: 'GitHub Foundations', tag: 'GH', url: 'https://learn.microsoft.com/en-us/users/KranthiAkkumahanthi-6332/credentials/D4C54954A4FE7D48' },
  { name: 'GitHub Administration', tag: 'GH', url: 'https://learn.microsoft.com/en-us/users/kranthiakkumahanthi-6332/credentials/34edb692ae79316e' },
]

export default function TechStack() {
  return (
    <section id="techstack" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section header — provisionr style: small eyebrow + large quiet heading */}
        <div className="text-center mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] mb-3" style={{ color: 'oklch(75% 0.22 285)' }}>Stack</p>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl tracking-tight" style={{ fontWeight: 600 }}>
            Tools I build with
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-xl mx-auto">
            The languages, platforms, and services I reach for daily.
          </p>
        </div>

        {/* Integration grid — provisionr-style cards with hover gradient line */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
          {skillGroups.map((group, i) => {
            const tints = ['pr-tint-violet', 'pr-tint-magenta', 'pr-tint-coral', 'pr-tint-violet']
            const eyebrowColors = ['oklch(75% 0.22 285)', 'oklch(72% 0.27 320)', 'oklch(75% 0.20 25)', 'oklch(75% 0.22 285)']
            return (
              <div
                key={group.title}
                className={`group relative rounded-lg bg-card p-5 hover:border-accent/40 transition-colors ${tints[i % 4]}`}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] mb-3" style={{ color: eyebrowColors[i % 4] }}>{group.title}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-[oklch(15%_0.015_285)] text-foreground/90 border border-border/80 hover:border-accent/50 hover:text-accent transition-colors">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Certs — clean rounded-md cards, no rainbow */}
        <div className="text-center mb-5">
          <p className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: 'oklch(75% 0.22 285)' }}>Certifications</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {certs.map((c, i) => {
            const tints = ['pr-tint-violet', 'pr-tint-magenta', 'pr-tint-coral']
            const tagColors = ['oklch(75% 0.22 285)', 'oklch(72% 0.27 320)', 'oklch(75% 0.20 25)']
            const tint = tints[i % 3]
            const tagColor = tagColors[i % 3]
            return (
              <a
                key={c.name}
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-md bg-card hover:border-accent/50 transition-colors ${tint}`}
              >
                <span className="w-9 h-9 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: `color-mix(in oklab, ${tagColor} 12%, transparent)`, border: `1px solid color-mix(in oklab, ${tagColor} 35%, transparent)`, color: tagColor }}>
                  {c.tag}
                </span>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-semibold text-foreground leading-tight truncate">{c.name}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">Verified ✓</span>
                </div>
                <span className="text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all text-xs">→</span>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
