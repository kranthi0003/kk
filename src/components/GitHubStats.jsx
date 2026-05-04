import React, { useState, useEffect } from 'react'

const GITHUB_USERNAME = 'kranthi0003'

const icons = {
  repo: '📦',
  followers: '👥',
  stars: '⭐',
  language: '💻',
  age: '📅',
  forks: '🔱',
}

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
          accountAge: `${years}y`,
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
      <div className="grid grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse h-20 bg-muted/50 rounded-xl" />
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return <p className="text-sm text-muted-foreground text-center py-4">Unable to load GitHub stats</p>
  }

  const items = [
    { label: 'Repos', value: stats.publicRepos, icon: icons.repo },
    { label: 'Followers', value: stats.followers, icon: icons.followers },
    { label: 'Stars', value: stats.totalStars, icon: icons.stars },
    { label: 'Top Lang', value: stats.topLanguage, icon: icons.language },
    { label: 'Age', value: stats.accountAge, icon: icons.age },
    { label: 'Forks', value: stats.totalForks, icon: icons.forks },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="relative overflow-hidden text-center p-4 rounded-xl bg-gradient-to-br from-muted/80 to-muted/30 border border-border/30 hover-lift transition-all group"
        >
          <span className="text-xl mb-1 block">{item.icon}</span>
          <p className="font-heading font-bold text-2xl bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
            {item.value}
          </p>
          <p className="text-xs text-muted-foreground font-medium mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
