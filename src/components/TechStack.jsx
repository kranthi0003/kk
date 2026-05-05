import React from 'react'

const skills = [
  { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
  { name: 'Java', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg' },
  { name: 'Ruby', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg' },
  { name: 'AWS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg' },
  { name: 'Azure', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg' },
  { name: 'Terraform', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/terraform/terraform-original.svg' },
  { name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
  { name: 'Kubernetes', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg' },
  { name: 'PostgreSQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
  { name: 'Redis', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg' },
  { name: 'Linux', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg' },
  { name: 'Grafana', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/grafana/grafana-original.svg' },
  { name: 'GitHub Actions', icon: 'https://cdn.simpleicons.org/githubactions/2088FF' },
  { name: 'Couchbase', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/couchbase/couchbase-original.svg' },
]

const certs = [
  { short: 'AWS SAA', issuer: 'Amazon', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg', url: 'https://www.credly.com/badges/4528a7ce-198b-4edd-94dd-54bea26bcafd' },
  { short: 'CB Admin', issuer: 'Couchbase', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/couchbase/couchbase-original.svg', url: 'https://www.credly.com/badges/21986ffd-3145-4312-8ed8-8f870454b7d5/public_url' },
  { short: 'CB Python', issuer: 'Couchbase', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/couchbase/couchbase-original.svg', url: 'https://www.credly.com/badges/6351ce61-4f3f-460e-935c-5b0e89e39c65' },
  { short: 'CB Architect', issuer: 'Couchbase', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/couchbase/couchbase-original.svg', url: 'https://www.credly.com/badges/e87a7035-55d0-4612-b5b4-8dc031560433' },
  { short: 'GH Foundations', issuer: 'GitHub', icon: 'https://cdn.simpleicons.org/github/white', iconLight: 'https://cdn.simpleicons.org/github/181717', url: 'https://learn.microsoft.com/en-us/users/KranthiAkkumahanthi-6332/credentials/D4C54954A4FE7D48' },
]

export default function TechStack() {
  return (
    <section id="techstack" className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-accent mb-2">~/skills</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">Stack & Credentials</h2>
        </div>

        {/* Tech grid */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-12">
          {skills.map(t => (
            <div key={t.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/20 hover:border-border/40 transition-all group">
              <img src={t.icon} alt={t.name} className="w-5 h-5 object-contain group-hover:scale-110 transition-transform" />
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{t.name}</span>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-border/30" />
          <span className="font-mono text-[10px] text-muted-foreground/50 uppercase tracking-widest">Certifications</span>
          <div className="flex-1 h-px bg-border/30" />
        </div>

        {/* Certs row */}
        <div className="flex flex-wrap justify-center gap-2.5">
          {certs.map(c => (
            <a
              key={c.short}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-card border border-border/20 hover:border-accent/30 hover:shadow-md transition-all group"
              title={`Verify ${c.short}`}
            >
              <img src={c.icon} alt={c.issuer} className={`w-5 h-5 object-contain ${c.iconLight ? 'hidden dark:block' : ''}`} />
              {c.iconLight && <img src={c.iconLight} alt={c.issuer} className="w-5 h-5 object-contain dark:hidden" />}
              <div className="flex flex-col">
                <span className="text-xs font-semibold leading-tight">{c.short}</span>
                <span className="text-[9px] text-muted-foreground leading-tight">{c.issuer}</span>
              </div>
              <svg className="w-3 h-3 text-green-500 opacity-60 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
