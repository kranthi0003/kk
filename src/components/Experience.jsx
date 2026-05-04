import React, { useState } from 'react'
import awsLogo from '../../assets/aws.png'
import growwLogo from '../../assets/groww.png'
import couchbaseLogo from '../../assets/couchbase.png'
import githubLogo from '../../assets/github.png'

const experiences = [
  {
    logo: githubLogo,
    title: 'SE – III',
    company: 'GitHub',
    location: 'Remote',
    period: 'Present',
    companyUrl: 'https://github.com',
    color: '#8b5cf6',
    description: 'Distributed systems, Git internals, platform reliability at scale. Building internal tooling for customer diagnostics.',
    current: true,
  },
  {
    logo: couchbaseLogo,
    title: 'SE – II',
    company: 'Couchbase',
    location: 'Remote',
    period: '2025–26',
    companyUrl: 'https://www.couchbase.com',
    color: '#ef4444',
    description: 'Enterprise NoSQL support for Netflix, Apple, Salesforce. Debugged replication, indexing & query performance.',
  },
  {
    logo: growwLogo,
    title: 'PSE – II',
    company: 'Groww',
    location: 'Bengaluru',
    period: '2025',
    companyUrl: 'https://groww.in',
    color: '#22c55e',
    description: 'Platform engineering for India\'s fastest growing fintech. Infrastructure automation & incident response.',
  },
  {
    logo: awsLogo,
    title: 'Cloud Engineer',
    company: 'Amazon',
    location: 'Hyderabad',
    period: '2021–24',
    companyUrl: 'https://aws.amazon.com',
    color: '#f59e0b',
    description: 'Distributed systems at scale serving millions. CI/CD pipelines, monitoring & automated remediation.',
  },
]

export default function Experience() {
  const [expanded, setExpanded] = useState(null)

  return (
    <section id="experience" className="py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="font-mono text-sm text-accent mb-2">Where I've Shipped</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">Experience</h2>
        </div>

        {/* Linked list nodes */}
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-0">
          {experiences.map((exp, i) => (
            <React.Fragment key={exp.company}>
              {/* Node */}
              <div className="relative group flex-1 max-w-[240px] w-full">
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className={`w-full rounded-2xl border p-5 transition-all duration-300 text-left ${
                    expanded === i
                      ? 'bg-card border-accent/40 shadow-lg shadow-accent/10 scale-[1.02]'
                      : 'bg-card/50 border-border/20 hover:border-border/40 hover:shadow-md'
                  }`}
                >
                  {/* Current badge */}
                  {exp.current && (
                    <div className="absolute -top-2.5 left-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                      </span>
                      <span className="text-[9px] font-mono text-green-500">NOW</span>
                    </div>
                  )}

                  {/* Logo + Company */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-border/20 flex-shrink-0">
                      <img src={exp.logo} alt={exp.company} className="w-6 h-6 object-contain" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-sm">{exp.company}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{exp.period}</p>
                    </div>
                  </div>

                  {/* Title */}
                  <p className="text-xs font-semibold text-foreground mb-1">{exp.title}</p>
                  <p className="text-[10px] text-muted-foreground">{exp.location}</p>

                  {/* Expanded detail */}
                  {expanded === i && (
                    <div className="mt-3 pt-3 border-t border-border/20 animate-fade-in-up">
                      <p className="text-xs text-muted-foreground leading-relaxed">{exp.description}</p>
                      <a
                        href={exp.companyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-[10px] text-accent hover:underline font-mono"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Visit {exp.company} →
                      </a>
                    </div>
                  )}
                </button>

                {/* Color accent line at bottom */}
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: exp.color,
                    width: expanded === i ? '80%' : '0%',
                    opacity: expanded === i ? 1 : 0,
                  }}
                />
              </div>

              {/* Arrow connector */}
              {i < experiences.length - 1 && (
                <>
                  {/* Desktop: horizontal arrow */}
                  <div className="hidden md:flex items-center px-1 flex-shrink-0 text-accent/30">
                    <div className="w-6 h-[2px] bg-accent/20 rounded-full" />
                    <svg className="w-3 h-3 -ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                    </svg>
                  </div>
                  {/* Mobile: vertical arrow */}
                  <div className="flex md:hidden flex-col items-center py-1 text-accent/30">
                    <div className="h-4 w-[2px] bg-accent/20 rounded-full" />
                    <svg className="w-3 h-3 -mt-0.5 rotate-90" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                    </svg>
                  </div>
                </>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Hint */}
        <p className="text-center text-[10px] text-muted-foreground/50 mt-6 font-mono">
          click a node to expand
        </p>
      </div>
    </section>
  )
}
