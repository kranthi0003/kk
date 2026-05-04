import React from 'react'
import awsLogo from '../../assets/aws.png'
import growwLogo from '../../assets/groww.png'
import couchbaseLogo from '../../assets/couchbase.png'
import githubLogo from '../../assets/github.png'

const experiences = [
  {
    logo: githubLogo,
    title: 'Technical SE – III',
    company: 'GitHub',
    period: 'Present',
    description: 'Supporting GitHub Enterprise Server customers. Deep-diving into distributed systems, Git internals, and platform reliability.',
    current: true,
  },
  {
    logo: couchbaseLogo,
    title: 'Technical SE – II',
    company: 'Couchbase',
    period: '2025 – 2026',
    description: 'Technical support engineering for enterprise NoSQL database customers. Debugging complex distributed database issues.',
  },
  {
    logo: growwLogo,
    title: 'Platform SE – II',
    company: 'Groww',
    period: '2025',
    description: 'Platform engineering for one of India\'s fastest growing fintech companies. Infrastructure automation and reliability.',
  },
  {
    logo: awsLogo,
    title: 'Cloud Engineer',
    company: 'Amazon',
    period: '2021 – 2024',
    description: 'Built and maintained distributed systems at scale. Worked on cloud infrastructure, CI/CD pipelines, and operational excellence.',
  },
]

export default function Experience() {
  return (
    <section id="experience" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="font-mono text-sm text-accent mb-2">Where I've Shipped</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">Experience</h2>
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-border hidden md:block" />

          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <div
                key={exp.company}
                className="relative flex flex-col md:flex-row gap-6 md:gap-10"
              >
                {/* Timeline dot */}
                <div className="hidden md:flex items-start pt-6">
                  <div className={`w-4 h-4 rounded-full border-4 relative z-10 ${
                    exp.current
                      ? 'border-accent bg-accent shadow-lg shadow-accent/30'
                      : 'border-border bg-card'
                  }`} style={{ marginLeft: '24px' }} />
                </div>

                {/* Card */}
                <div className="flex-1 md:ml-4">
                  <div
                    className={`card-3d bg-card rounded-2xl p-6 border shadow-lg ${
                      exp.current ? 'border-accent/30 ring-1 ring-accent/10' : 'border-border/30'
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center p-2 shadow-sm">
                        <img src={exp.logo} alt={exp.company} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-lg">{exp.title}</h3>
                        <p className="text-muted-foreground text-sm">{exp.company}</p>
                      </div>
                      <div className="ml-auto">
                        <span className={`font-mono text-xs px-3 py-1 rounded-full ${
                          exp.current
                            ? 'bg-accent/10 text-accent font-semibold'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {exp.period}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {exp.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
