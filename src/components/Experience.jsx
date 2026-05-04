import React, { useState, useCallback } from 'react'
import awsLogo from '../../assets/aws.png'
import growwLogo from '../../assets/groww.png'
import couchbaseLogo from '../../assets/couchbase.png'
import githubLogo from '../../assets/github.png'

const experiences = [
  {
    logo: githubLogo,
    title: 'Technical Support Engineer – III',
    company: 'GitHub',
    location: 'Remote',
    period: 'Present',
    companyUrl: 'https://github.com',
    description: [
      'Supporting GitHub Enterprise Server customers with complex infrastructure and platform issues',
      'Deep-diving into distributed systems, Git internals, and platform reliability at scale',
      'Building internal tooling and automation for diagnosing and resolving customer issues faster',
    ],
    current: true,
  },
  {
    logo: couchbaseLogo,
    title: 'Technical Support Engineer – II',
    company: 'Couchbase',
    location: 'Remote',
    period: '2025 – 2026',
    companyUrl: 'https://www.couchbase.com',
    description: [
      'Provided technical support for enterprise NoSQL database customers across multiple industries',
      'Debugged complex distributed database issues including replication, indexing, and query performance',
      'Worked with customers like Netflix, Apple, and Salesforce on mission-critical database deployments',
    ],
  },
  {
    logo: growwLogo,
    title: 'Platform Support Engineer – II',
    company: 'Groww',
    location: 'Bengaluru, India',
    period: '2025',
    companyUrl: 'https://groww.in',
    description: [
      'Platform engineering for one of India\'s fastest growing fintech companies',
      'Infrastructure automation and reliability engineering for high-traffic trading platform',
      'Worked on monitoring, alerting, and incident response for production systems',
    ],
  },
  {
    logo: awsLogo,
    title: 'Cloud Engineer',
    company: 'Amazon',
    location: 'Hyderabad, India',
    period: '2021 – 2024',
    companyUrl: 'https://aws.amazon.com',
    description: [
      'Built and maintained distributed systems at scale serving millions of customers',
      'Designed and implemented CI/CD pipelines, reducing deployment times by 40%',
      'Drove operational excellence through monitoring, alerting, and automated remediation',
    ],
  },
]

const LocationIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ExternalIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

export default function Experience() {
  return (
    <section id="experience" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="font-mono text-sm text-accent mb-2">Where I've Shipped</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">Experience</h2>
        </div>

        <div className="relative">
          {/* Vertical timeline line */}
          <div className="absolute left-[60px] top-0 bottom-0 w-px bg-border hidden md:block" />

          <div className="space-y-6">
            {experiences.map((exp) => (
              <div
                key={exp.company + exp.period}
                className={`card-3d bg-card rounded-2xl overflow-hidden border shadow-lg ${
                  exp.current ? 'border-accent/30 ring-1 ring-accent/10' : 'border-border/30'
                }`}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Left: Logo + Company */}
                  <div className="md:w-56 flex-shrink-0 p-6 sm:p-8 flex flex-col items-center md:items-start justify-start gap-3 md:border-r border-border/20">
                    <a
                      href={exp.companyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover-lift transition-all"
                    >
                      <img src={exp.logo} alt={exp.company} className="w-12 h-12 object-contain" />
                    </a>
                    <a
                      href={exp.companyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-heading font-semibold text-base hover:text-accent transition-colors"
                    >
                      {exp.company}
                    </a>
                  </div>

                  {/* Right: Title + Date + Bullets */}
                  <div className="flex-1 p-6 sm:p-8">
                    <h3 className="font-heading font-semibold text-xl mb-2">{exp.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-5">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarIcon /> {exp.period}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <LocationIcon /> {exp.location}
                      </span>
                    </div>

                    <ul className="space-y-3">
                      {exp.description.map((point, i) => (
                        <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                          <span className="text-accent mt-0.5 flex-shrink-0 text-lg">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
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
