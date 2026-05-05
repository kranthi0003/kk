import React, { useState, useEffect } from 'react'

const REPO = 'kranthi0003/kranthi-kiran-site'
const STAGES = ['checkout', 'install', 'build', 'deploy']

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function DeployPipeline() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRuns = async () => {
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/actions/runs?per_page=5&status=completed`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      })
      const data = await res.json()
      if (data.workflow_runs) {
        setRuns(data.workflow_runs.filter(r => r.name === 'Build and Deploy').slice(0, 4))
      }
    } catch { }
    setLoading(false)
  }

  useEffect(() => {
    fetchRuns()
    const i = setInterval(fetchRuns, 30000)
    return () => clearInterval(i)
  }, [])

  return (
    <section className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="font-mono text-sm text-accent mb-2">~/deployments</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">Live CI/CD Pipeline</h2>
          <p className="text-muted-foreground text-sm mt-2">Real deploys from GitHub Actions — updates every 30s</p>
        </div>

        <div className="space-y-3">
          {loading && (
            <div className="text-center py-8 text-muted-foreground text-sm font-mono animate-pulse">Fetching pipeline...</div>
          )}
          {runs.map((run) => {
            const success = run.conclusion === 'success'
            const failed = run.conclusion === 'failure'
            const duration = run.updated_at && run.run_started_at
              ? Math.round((new Date(run.updated_at) - new Date(run.run_started_at)) / 1000)
              : null
            const commitMsg = run.head_commit?.message?.split('\n')[0] || 'No message'
            const sha = run.head_sha?.slice(0, 7)

            return (
              <a
                key={run.id}
                href={run.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-border/20 bg-card hover:border-border/40 transition-all group"
              >
                {/* Pipeline header */}
                <div className="px-4 py-3 flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${success ? 'bg-green-500' : failed ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{commitMsg}</p>
                    <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                      {sha} · {timeAgo(run.created_at)}{duration ? ` · ${duration}s` : ''}
                    </p>
                  </div>
                  <span className={`text-[9px] font-mono font-bold ${success ? 'text-green-500' : failed ? 'text-red-500' : 'text-yellow-500'}`}>
                    {success ? 'DEPLOYED' : failed ? 'FAILED' : 'RUNNING'}
                  </span>
                </div>

                {/* Pipeline stages */}
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-1">
                    {STAGES.map((stage, i) => {
                      const stageSuccess = success || (!failed && i < 3)
                      const stageFailed = failed && i === STAGES.length - 1
                      return (
                        <React.Fragment key={stage}>
                          <div className={`flex-1 h-1.5 rounded-full transition-all ${
                            stageSuccess ? 'bg-green-500/70' :
                            stageFailed ? 'bg-red-500/70' :
                            'bg-muted/50'
                          }`} />
                          {i < STAGES.length - 1 && (
                            <svg className={`w-2.5 h-2.5 flex-shrink-0 ${stageSuccess ? 'text-green-500/50' : 'text-muted/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {STAGES.map(s => (
                      <span key={s} className="text-[8px] font-mono text-muted-foreground/40 uppercase">{s}</span>
                    ))}
                  </div>
                </div>
              </a>
            )
          })}
        </div>

        {runs.length > 0 && (
          <div className="text-center mt-6">
            <a
              href={`https://github.com/${REPO}/actions`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>View all runs</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  )
}
