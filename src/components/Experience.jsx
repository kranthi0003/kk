import React from 'react'
import awsLogo from '../../assets/aws.png'
import couchbaseLogo from '../../assets/couchbase.png'
import githubLogo from '../../assets/github.png'

const experiences = [
  {
    logo: githubLogo,
    title: 'SE – III',
    company: 'GitHub',
    location: 'Remote',
    period: '2026 – Present',
    companyUrl: 'https://github.com',
    color: '#8b5cf6',
    description: 'Distributed systems, Git internals & platform reliability at scale.',
    current: true,
  },
  {
    logo: couchbaseLogo,
    title: 'SE – II',
    company: 'Couchbase',
    location: 'Remote',
    period: '2025 – 2026',
    companyUrl: 'https://www.couchbase.com',
    color: '#ef4444',
    description: 'Enterprise NoSQL support for Netflix, Apple & Salesforce.',
  },
  {
    logo: awsLogo,
    title: 'Cloud Engineer',
    company: 'Amazon',
    location: 'Hyderabad',
    period: '2021 – 2025',
    companyUrl: 'https://aws.amazon.com',
    color: '#f59e0b',
    description: 'Distributed systems at scale serving millions of customers.',
  },
]

export default function Experience() {
  return (
    <section id="experience" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="font-mono text-xs text-accent uppercase tracking-[0.2em] mb-3">Where I've shipped</p>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl tracking-tight" style={{ fontWeight: 600 }}>
            Experience
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-xl mx-auto">
            Five years of building infra at companies you've heard of.
          </p>
        </div>

        {/* Desktop: horizontal linked list */}
        <div className="hidden md:flex items-stretch justify-center gap-0">
          {experiences.map((exp, i) => (
            <React.Fragment key={exp.company}>
              {/* Node */}
              <a
                href={exp.companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex-1 max-w-[260px] rounded-lg border border-border/60 bg-card/40 hover:bg-card hover:border-border/40 hover:shadow-lg transition-all duration-300 p-6 flex flex-col group"
              >
                {/* Current badge */}
                {exp.current && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                    </span>
                    <span className="text-[9px] font-mono text-green-500 font-bold">CURRENT</span>
                  </div>
                )}

                {/* Logo */}
                <div className="w-12 h-12 rounded-md bg-background border border-border/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <img src={exp.logo} alt={exp.company} className="w-7 h-7 object-contain" />
                </div>

                {/* Company + Title */}
                <p className="font-heading font-bold text-base mb-0.5">{exp.company}</p>
                <p className="text-xs font-medium text-accent mb-2">{exp.title}</p>

                {/* Description */}
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-4 flex-1">{exp.description}</p>

                {/* Footer: period + location */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground/70 font-mono pt-3 border-t border-border/10">
                  <span>{exp.period}</span>
                  <span>📍 {exp.location}</span>
                </div>

                {/* Color accent */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-0 group-hover:w-3/4 rounded-full transition-all duration-500"
                  style={{ backgroundColor: exp.color }}
                />
              </a>

              {/* Arrow connector */}
              {i < experiences.length - 1 && (
                <div className="flex flex-col items-center justify-center px-2 flex-shrink-0 self-center">
                  <div className="flex items-center text-accent/40">
                    <div className="w-5 h-[2px] bg-accent/20 rounded-full" />
                    <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[7px] border-l-accent/30" />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Mobile: vertical linked list */}
        <div className="md:hidden flex flex-col items-center gap-0">
          {experiences.map((exp, i) => (
            <React.Fragment key={exp.company}>
              <a
                href={exp.companyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative w-full max-w-sm rounded-lg border border-border/60 bg-card/40 hover:bg-card p-5 flex items-start gap-4 transition-all"
              >
                {exp.current && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                    </span>
                    <span className="text-[9px] font-mono text-green-500 font-bold">CURRENT</span>
                  </div>
                )}
                <div className="w-11 h-11 rounded-md bg-background border border-border/50 flex items-center justify-center flex-shrink-0">
                  <img src={exp.logo} alt={exp.company} className="w-6 h-6 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm">{exp.company} <span className="font-normal text-xs text-accent">· {exp.title}</span></p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{exp.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground/60 font-mono">
                    <span>{exp.period}</span>
                    <span>📍 {exp.location}</span>
                  </div>
                </div>
              </a>

              {/* Vertical arrow */}
              {i < experiences.length - 1 && (
                <div className="flex flex-col items-center py-1">
                  <div className="h-4 w-[2px] bg-accent/20 rounded-full" />
                  <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-accent/30" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}
