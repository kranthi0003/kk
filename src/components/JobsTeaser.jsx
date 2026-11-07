import React, { useEffect, useState } from 'react'

const DAY = 864e5

function age(date) {
  if (!date) return ''
  const days = Math.floor((Date.now() - Date.parse(date)) / DAY)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

export default function JobsTeaser() {
  const [jobs, setJobs] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let active = true
    fetch(`${import.meta.env.BASE_URL}jobs.json`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Jobs feed unavailable')
        return response.json()
      })
      .then((data) => {
        if (active && Array.isArray(data?.jobs)) {
          if (!Array.isArray(data.trackedJobs)) throw new Error('Opportunity shortlist unavailable')
          const local = data.trackedJobs
          const focus = local.filter((job) => ['support', 'tam', 'solutions'].includes(job.f))
          setJobs((focus.length ? focus : local).slice(0, 3))
          setStatus('ready')
        } else if (active) {
          throw new Error('Jobs feed has an invalid shape')
        }
      })
      .catch((error) => {
        if (active) {
          console.error('Failed to load the homepage jobs preview:', error)
          setStatus('error')
        }
      })
    return () => { active = false }
  }, [])

  return (
    <section className="py-20" aria-labelledby="jobs-teaser-title">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8">
          <div>
            <p className="font-mono text-xs text-accent uppercase tracking-[0.2em] mb-3">Updated daily · Singapore + GitHub Europe</p>
            <h2 id="jobs-teaser-title" className="font-heading text-3xl sm:text-4xl tracking-tight" style={{ fontWeight: 600 }}>
              Roles worth a look
            </h2>
            <p className="text-muted-foreground text-sm mt-3 max-w-xl">
              Support, technical account, solutions architecture and adjacent engineering roles.
            </p>
          </div>
          <a href="#/opportunities" className="btn-secondary self-start sm:self-auto">
            My opportunity radar <span aria-hidden="true">→</span>
          </a>
        </div>

        {jobs.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-3">
            {jobs.map((job, index) => (
              <a
                key={`${job.u}-${index}`}
                href={job.u}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-xl p-5 transition-transform hover:-translate-y-0.5"
                style={{
                  background: 'color-mix(in oklab, var(--color-card) 75%, transparent)',
                  boxShadow: 'inset 0 0 0 1px var(--color-border)',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-accent">{job.c}</span>
                  <span className="font-mono text-xs tabular-nums text-accent">{job.x}% match</span>
                </div>
                <h3 className="mt-3 text-sm font-medium leading-snug text-foreground group-hover:opacity-75 transition-opacity">
                  {job.t}
                </h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  {job.l || job.p}{job.d ? ` · ${age(job.d)}` : ''}
                </p>
              </a>
            ))}
          </div>
        ) : status === 'error' ? (
          <p className="text-sm text-muted-foreground">The jobs preview could not load. The full board may still be available.</p>
        ) : status === 'loading' ? (
          <p className="text-sm text-muted-foreground">Loading the daily jobs feed…</p>
        ) : (
          <p className="text-sm text-muted-foreground">No Singapore or GitHub Europe matches in this snapshot yet.</p>
        )}

        <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground/75">
          Match is a title/team, role-family and location heuristic—not a hiring probability. Check each description for the actual requirements.
        </p>
      </div>
    </section>
  )
}
