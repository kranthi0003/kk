import React from 'react'
import profile from '../../assets/profile.png'

export default function About() {
  const languages = ['Python', 'Go', 'Java', 'C++', 'Bash', 'Ruby']
  const tools = ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'GitHub Actions', 'PostgreSQL', 'Redis', 'Kafka', 'Prometheus', 'Grafana', 'Splunk']

  return (
    <section id="about" className="py-32 min-h-screen flex items-center relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-float absolute top-20 left-10 w-32 h-32 bg-accent/10 rounded-full blur-xl" />
        <div className="animate-float absolute top-40 right-20 w-24 h-24 bg-accent/5 rounded-lg blur-lg" style={{ animationDelay: '2s' }} />
        <div className="animate-float absolute bottom-32 left-1/4 w-16 h-16 bg-accent/10 rounded-full blur-md" style={{ animationDelay: '4s' }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
          {/* Photo */}
          <div className="flex justify-center lg:justify-end lg:col-span-2">
            <div className="relative animate-float">
              <div className="bg-card rounded-2xl overflow-hidden shadow-2xl border border-border/30 p-1">
                <img
                  src={profile}
                  alt="Kranthi Kiran"
                  className="w-80 h-80 rounded-xl object-cover"
                />
              </div>
              <div className="absolute -top-8 -right-8 w-16 h-16 bg-accent/20 rounded-full animate-float blur-sm" style={{ animationDelay: '0.5s' }} />
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-accent/15 rounded-lg animate-float blur-sm" style={{ animationDelay: '1.5s' }} />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-8 lg:col-span-3">
            <div className="bg-card rounded-2xl p-8 border border-border/30 shadow-xl">
              <div className="mb-6">
                <p className="font-mono text-sm text-accent mb-2">About Me</p>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6">
                  Hey, I'm Kranthi
                </h2>
              </div>

              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  I'm a Cloud Engineer who loves building infrastructure that just works — quietly, reliably, and at scale.
                  Currently at GitHub, previously at Amazon, Couchbase, and Groww, I've spent 4+ years debugging distributed
                  systems, optimizing cloud deployments, and making sure nothing pages me at 3am.
                </p>
                <p>
                  My sweet spot is where reliability meets performance — whether it's tuning Kubernetes clusters,
                  building CI/CD pipelines, or deep-diving into database internals. I'm big on observability,
                  automation, and writing infra code that future-me won't hate.
                </p>
                <p>
                  Outside of work, I'm into photography, gaming, and exploring new tech.
                  I believe in building things that matter and sharing what I learn along the way.
                </p>
              </div>

              {/* Skill tags */}
              <div className="pt-6 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Programming Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang) => (
                      <span
                        key={lang}
                        className="px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium border border-accent/20 hover-lift cursor-default"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-3">Tools & Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {tools.map((tool) => (
                      <span
                        key={tool}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20 hover-lift cursor-default"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
