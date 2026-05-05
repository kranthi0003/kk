import React from 'react'

const categories = [
  {
    label: 'Languages',
    icon: '⟨/⟩',
    items: [
      { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
      { name: 'Java', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg' },
      { name: 'Ruby', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg' },
      { name: 'Bash', icon: 'https://cdn.simpleicons.org/gnubash/white', iconLight: 'https://cdn.simpleicons.org/gnubash/1a1a2e' },
    ],
  },
  {
    label: 'Cloud & Infra',
    icon: '☁️',
    items: [
      { name: 'AWS', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-plain-wordmark.svg' },
      { name: 'Azure', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg' },
      { name: 'Terraform', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/terraform/terraform-original.svg' },
      { name: 'Linux', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg' },
    ],
  },
  {
    label: 'DevOps',
    icon: '🔄',
    items: [
      { name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
      { name: 'Kubernetes', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg' },
      { name: 'GitHub Actions', icon: 'https://cdn.simpleicons.org/githubactions/2088FF' },
      { name: 'GitHub', icon: 'https://cdn.simpleicons.org/github/white', iconLight: 'https://cdn.simpleicons.org/github/181717' },
    ],
  },
  {
    label: 'Databases',
    icon: '🗄️',
    items: [
      { name: 'PostgreSQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
      { name: 'Couchbase', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/couchbase/couchbase-original.svg' },
      { name: 'Redis', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg' },
    ],
  },
  {
    label: 'Observability',
    icon: '📊',
    items: [
      { name: 'Prometheus', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prometheus/prometheus-original.svg' },
      { name: 'Grafana', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/grafana/grafana-original.svg' },
    ],
  },
  {
    label: 'Tools',
    icon: '🛠️',
    items: [
      { name: 'Copilot', icon: 'https://cdn.simpleicons.org/githubcopilot/white', iconLight: 'https://cdn.simpleicons.org/githubcopilot/181717' },
      { name: 'VSCode', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg' },
    ],
  },
]

export default function TechStack() {
  return (
    <section id="techstack" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-accent mb-2">What I Work With</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">Tech Stack</h2>
        </div>

        <div className="space-y-8">
          {categories.map((cat) => (
            <div key={cat.label}>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-base">{cat.icon}</span>
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{cat.label}</span>
                <div className="flex-1 h-px bg-border/30 ml-2" />
              </div>
              <div className="flex flex-wrap gap-4">
                {cat.items.map((tech) => (
                  <div key={tech.name} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-card/50 hover:bg-card border border-border/10 hover:border-border/30 transition-all duration-200 group">
                    <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                      <img src={tech.icon} alt={tech.name} className={`w-full h-full object-contain group-hover:scale-110 transition-transform ${tech.iconLight ? 'hidden dark:block' : ''}`} />
                      {tech.iconLight && <img src={tech.iconLight} alt={tech.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform dark:hidden" />}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{tech.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
