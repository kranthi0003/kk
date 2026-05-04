import React, { useState, useEffect, useMemo } from 'react'

const GITHUB_USERNAME = 'kranthi0003'

export default function GitHubStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cached = sessionStorage.getItem('github-stats')
    if (cached) {
      const parsed = JSON.parse(cached)
      if (Date.now() - parsed.timestamp < 300000) {
        setStats(parsed.data)
        setLoading(false)
        return
      }
    }

    const fetchStats = async () => {
      try {
        const res = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}`, {
          headers: { Accept: 'application/vnd.github.v3+json' }
        })
        if (!res.ok) throw new Error('Failed to fetch')
        const user = await res.json()

        const reposRes = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100`, {
          headers: { Accept: 'application/vnd.github.v3+json' }
        })
        const repos = reposRes.ok ? await reposRes.json() : []

        const totalStars = repos.reduce((sum, r) => sum + r.stargazers_count, 0)
        const totalForks = repos.reduce((sum, r) => sum + r.forks_count, 0)
        const langCounts = repos.filter(r => r.language).reduce((acc, r) => {
          acc[r.language] = (acc[r.language] || 0) + 1
          return acc
        }, {})
        const topLanguage = Object.keys(langCounts).length > 0
          ? Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0][0]
          : 'N/A'

        const created = new Date(user.created_at)
        const years = Math.floor((Date.now() - created.getTime()) / (365.25 * 24 * 60 * 60 * 1000))

        const data = {
          publicRepos: user.public_repos,
          followers: user.followers,
          totalStars,
          totalForks,
          topLanguage,
          accountAge: `${years} year${years !== 1 ? 's' : ''}`,
        }

        sessionStorage.setItem('github-stats', JSON.stringify({ data, timestamp: Date.now() }))
        setStats(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    )
  }

  if (error || !stats) {
    return <p className="text-sm text-muted-foreground">Unable to load GitHub stats</p>
  }

  const items = [
    { label: 'Public Repos', value: stats.publicRepos },
    { label: 'Followers', value: stats.followers },
    { label: 'Total Stars', value: stats.totalStars },
    { label: 'Top Language', value: stats.topLanguage },
    { label: 'Account Age', value: stats.accountAge },
    { label: 'Total Forks', value: stats.totalForks },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.label} className="text-center p-3 rounded-xl bg-muted/50 border border-border/30">
          <p className="font-heading font-bold text-lg text-accent">{item.value}</p>
          <p className="text-xs text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
