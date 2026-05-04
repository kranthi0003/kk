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

        <div className="space-y-6">
          {experiences.map((exp, index) => (
            <div
              key={exp.company + exp.period}
              className={`card-3d bg-card rounded-2xl overflow-hidden border shadow-lg ${
                exp.current ? 'border-accent/30 ring-1 ring-accent/10' : 'border-border/30'
              }`}
            >
              <div className="p-6 sm:p-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
                  <a
                    href={exp.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center p-2.5 shadow-sm hover-lift transition-all flex-shrink-0"
                  >
                    <img src={exp.logo} alt={exp.company} className="w-full h-full object-contain" />
                  </a>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h3 className="font-heading font-semibold text-lg">{exp.title}</h3>
                        <a
                          href={exp.companyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-accent hover:underline text-sm font-medium"
                        >
                          {exp.company} <ExternalIcon />
                        </a>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <LocationIcon /> {exp.location}
                        </span>
                        <span className={`inline-flex items-center gap-1 font-mono text-xs px-3 py-1 rounded-full ${
                          exp.current
                            ? 'bg-accent/10 text-accent font-semibold'
                            : 'bg-muted'
                        }`}>
                          <CalendarIcon /> {exp.period}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bullet points */}
                <ul className="space-y-2 ml-1">
                  {exp.description.map((point, i) => (
                    <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                      <span className="text-accent mt-1.5 flex-shrink-0">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
