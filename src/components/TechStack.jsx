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
          <p className="font-mono text-xs text-accent uppercase tracking-[0.2em] mb-3">Stack</p>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl tracking-tight" style={{ fontWeight: 600 }}>
            Tools I build with
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-xl mx-auto">
            The languages, platforms, and services I reach for daily.
          </p>
        </div>

        {/* Integration grid — provisionr-style cards with hover gradient line */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-12">
          {skillGroups.map(group => (
            <div
              key={group.title}
              className="group relative rounded-lg border border-border/60 bg-card/40 backdrop-blur p-5 hover:border-accent/40 transition-colors"
            >
              {/* Hover gradient line at top — provisionr signature */}
              <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-accent/0 to-transparent group-hover:via-accent/70 transition-colors" />
              <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.18em] mb-3">{group.title}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map(s => (
                  <span key={s} className="px-2 py-1 rounded-md text-[11px] font-medium bg-muted/40 text-foreground/85 border border-border/40">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Certs — clean rounded-md cards, no rainbow */}
        <div className="text-center mb-5">
          <p className="font-mono text-xs text-accent uppercase tracking-[0.2em]">Certifications</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {certs.map(c => (
            <a
              key={c.name}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 px-3 py-2.5 rounded-md border border-border/60 bg-card/40 backdrop-blur hover:border-accent/40 hover:bg-card/60 transition-colors"
            >
              <span className="w-9 h-9 rounded-md bg-accent/10 border border-accent/30 flex items-center justify-center text-[10px] font-bold text-accent flex-shrink-0">
                {c.tag}
              </span>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-foreground leading-tight truncate">{c.name}</span>
                <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">Verified ✓</span>
              </div>
              <span className="text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all text-xs">→</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
