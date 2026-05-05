import React from 'react'

const skillGroups = [
  {
    title: 'Languages',
    items: ['Python', 'Java', 'Ruby', 'Bash', 'Go', 'JavaScript'],
  },
  {
    title: 'Cloud & Infra',
    items: ['AWS', 'Azure', 'Terraform', 'Docker', 'Kubernetes', 'Linux'],
  },
  {
    title: 'Data & Monitoring',
    items: ['PostgreSQL', 'Couchbase', 'Redis', 'Prometheus', 'Grafana'],
  },
  {
    title: 'DevOps & Tools',
    items: ['GitHub Actions', 'GitOps', 'CI/CD', 'Copilot', 'VSCode'],
  },
]

const certs = [
  { name: 'AWS Solutions Architect', tag: 'SAA', color: 'from-orange-500/20 to-amber-500/10 border-orange-500/20', accent: 'text-orange-500', url: 'https://www.credly.com/badges/4528a7ce-198b-4edd-94dd-54bea26bcafd' },
  { name: 'Couchbase Admin', tag: 'PRO', color: 'from-red-500/20 to-rose-500/10 border-red-500/20', accent: 'text-red-500', url: 'https://www.credly.com/badges/21986ffd-3145-4312-8ed8-8f870454b7d5/public_url' },
  { name: 'Couchbase Python', tag: 'DEV', color: 'from-red-500/15 to-orange-500/10 border-red-500/20', accent: 'text-red-400', url: 'https://www.credly.com/badges/6351ce61-4f3f-460e-935c-5b0e89e39c65' },
  { name: 'Couchbase Architect', tag: 'ARCH', color: 'from-rose-500/20 to-red-500/10 border-rose-500/20', accent: 'text-rose-500', url: 'https://www.credly.com/badges/e87a7035-55d0-4612-b5b4-8dc031560433' },
  { name: 'GitHub Foundations', tag: 'GH', color: 'from-purple-500/20 to-violet-500/10 border-purple-500/20', accent: 'text-purple-400', url: 'https://learn.microsoft.com/en-us/users/KranthiAkkumahanthi-6332/credentials/D4C54954A4FE7D48' },
]

export default function TechStack() {
  return (
    <section id="techstack" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="font-mono text-sm text-accent mb-2">~/skills</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">Stack & Credentials</h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {skillGroups.map(group => (
            <div key={group.title} className="rounded-xl border border-border/20 bg-card p-4 hover:border-border/40 transition-all">
              <p className="font-mono text-[10px] text-accent uppercase tracking-widest mb-3">{group.title}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map(s => (
                  <span key={s} className="px-2 py-1 rounded-md text-[11px] font-medium bg-muted/50 text-foreground/80 border border-border/10">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Certs — horizontal scroll on mobile, flex on desktop */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory lg:flex-wrap lg:justify-center">
          {certs.map(c => (
            <a
              key={c.name}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex-shrink-0 snap-start flex items-center gap-3 pl-1 pr-4 py-2 rounded-full bg-gradient-to-r ${c.color} border backdrop-blur-sm hover:scale-105 transition-all duration-200 group`}
            >
              <span className={`w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-[10px] font-bold ${c.accent}`}>
                {c.tag}
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-foreground leading-tight whitespace-nowrap">{c.name}</span>
                <span className="text-[9px] text-muted-foreground leading-tight">Verified ✓</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
