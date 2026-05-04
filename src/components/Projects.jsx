import React, { useState, useCallback, useMemo } from 'react'

const projects = [
  {
    title: 'GitHub Enterprise Server Support Tools',
    description: 'Internal tooling and automation for diagnosing and resolving complex GHES customer issues. Deep-dives into Git internals, distributed systems debugging, and platform reliability.',
    technologies: ['Ruby', 'Bash', 'Docker', 'Git', 'Linux'],
    githubUrl: null,
    demoUrl: null,
  },
  {
    title: 'Cloud Infrastructure Automation',
    description: 'End-to-end infrastructure provisioning and management using Terraform and AWS. Automated deployment pipelines with GitHub Actions for multi-region cloud architectures.',
    technologies: ['Terraform', 'AWS', 'GitHub Actions', 'Python', 'Docker'],
    githubUrl: 'https://github.com/kranthi0003',
    demoUrl: null,
  },
  {
    title: 'Distributed Database Monitoring',
    description: 'Real-time monitoring and alerting system for Couchbase clusters. Built dashboards with Prometheus and Grafana to track cluster health, replication lag, and query performance.',
    technologies: ['Prometheus', 'Grafana', 'Python', 'Couchbase', 'Docker'],
    githubUrl: null,
    demoUrl: null,
  },
  {
    title: 'Portfolio Website',
    description: 'This very site — a modern single-page portfolio built with React, Tailwind CSS, and Vite. Features light/dark mode, 3D card effects, and smooth scroll animations.',
    technologies: ['React', 'Tailwind CSS', 'Vite', 'JavaScript'],
    githubUrl: 'https://github.com/kranthi0003/kranthi-kiran-site',
    demoUrl: 'https://kranthi0003.github.io/kranthi-kiran-site/',
  },
  {
    title: 'CI/CD Pipeline Optimization',
    description: 'Optimized build and deploy pipelines at Amazon, reducing deployment times by 40% through parallelization, caching strategies, and smart artifact management.',
    technologies: ['AWS CodePipeline', 'Docker', 'Python', 'Bash'],
    githubUrl: null,
    demoUrl: null,
  },
  {
    title: 'Kubernetes Cluster Management',
    description: 'Production Kubernetes cluster setup and management with auto-scaling, rolling deployments, and comprehensive monitoring for microservices architectures.',
    technologies: ['Kubernetes', 'Helm', 'ArgoCD', 'Terraform', 'AWS EKS'],
    githubUrl: null,
    demoUrl: null,
  },
]

const GithubIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
)

const ExternalIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
)

const ChevronDown = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const ChevronUp = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
  </svg>
)

export default function Projects() {
  const [showAll, setShowAll] = useState(false)
  const toggle = useCallback(() => setShowAll(v => !v), [])

  const { primary, additional } = useMemo(() => ({
    primary: projects.slice(0, 3),
    additional: projects.slice(3),
  }), [])

  const renderCard = (project, index, isAdditional = false) => (
    <div
      key={`${isAdditional ? 'add' : 'pri'}-${index}`}
      className={`card-3d bg-card rounded-2xl overflow-hidden border border-border/30 shadow-lg flex flex-col h-full transition-all duration-500 ${
        isAdditional && !showAll ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'
      }`}
      style={{ animationDelay: `${index * 0.2}s`, transitionDelay: isAdditional && showAll ? `${index * 200}ms` : '0ms' }}
    >
      {/* Gradient header bar */}
      <div className="h-2 bg-gradient-to-r from-accent to-primary" />

      <div className="p-8 flex flex-col flex-grow">
        <h3 className="font-heading text-xl font-semibold mb-3">{project.title}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-4">{project.description}</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {project.technologies.map((tech) => (
            <span
              key={tech}
              className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-md border border-accent/20"
            >
              {tech}
            </span>
          ))}
        </div>

        <div className="flex gap-4 mt-auto">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-primary text-primary text-sm font-medium hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all"
            >
              <GithubIcon /> Code
            </a>
          )}
          {project.demoUrl && (
            <a
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover-lift shadow-md"
            >
              <ExternalIcon /> Demo
            </a>
          )}
          {!project.githubUrl && !project.demoUrl && (
            <span className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-muted text-muted-foreground text-sm font-medium">
              Internal Project
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <section id="projects" className="py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="font-mono text-sm text-accent mb-2">What I've Built</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-4">Projects</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A showcase of my technical skills and problem-solving through real-world applications
          </p>
        </div>

        {/* Primary projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {primary.map((p, i) => renderCard(p, i))}
        </div>

        {/* Show more toggle */}
        {additional.length > 0 && (
          <div className="flex justify-center mt-12">
            <button
              onClick={toggle}
              className="group inline-flex items-center gap-3 px-8 py-4 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 hover:border-accent/30 rounded-full font-semibold transition-all duration-300 hover:scale-105"
            >
              <span>{showAll ? 'Show Less Projects' : 'Show More Projects'}</span>
              {showAll ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>
        )}

        {/* Additional projects */}
        {additional.length > 0 && (
          <div className={`transition-all duration-700 ease-in-out overflow-hidden ${showAll ? 'max-h-[6000px] opacity-100 mt-12' : 'max-h-0 opacity-0 mt-0'}`}>
            <div className="text-center mb-8">
              <h3 className="font-heading text-2xl font-semibold text-muted-foreground">Additional Projects</h3>
              <div className="w-24 h-0.5 bg-accent/30 mx-auto mt-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {additional.map((p, i) => renderCard(p, i, true))}
            </div>
          </div>
        )}

        {/* View all on GitHub */}
        <div className="text-center mt-16">
          <a
            href="https://github.com/kranthi0003"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl border-2 border-primary text-primary font-medium hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all hover-lift"
          >
            <GithubIcon /> View All Projects on GitHub
          </a>
        </div>
      </div>
    </section>
  )
}
