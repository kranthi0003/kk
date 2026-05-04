import React, { useState, useEffect } from 'react'

const calculateWorkingDays = () => {
  const startDate = new Date('2021-03-01')
  const now = new Date()
  let workingDays = 0
  const current = new Date(startDate)
  while (current <= now) {
    const dayOfWeek = current.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) workingDays++
    current.setDate(current.getDate() + 1)
  }
  return workingDays
}

export default function Stats() {
  const [workingDays, setWorkingDays] = useState(calculateWorkingDays)

  useEffect(() => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const timeout = setTimeout(() => {
      setWorkingDays(calculateWorkingDays())
    }, tomorrow - now)
    return () => clearTimeout(timeout)
  }, [])

  const stats = [
    { label: 'Days in Tech', value: workingDays.toLocaleString(), icon: '💼' },
    { label: 'Companies', value: '4', icon: '🏢' },
    { label: 'Enterprise Clients', value: '100+', icon: '🤝' },
    { label: 'Certifications', value: '4', icon: '🏆' },
  ]

  return (
    <section className="py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="card-3d bg-card rounded-2xl p-6 border border-border/30 shadow-lg text-center"
            >
              <span className="text-3xl mb-3 block">{stat.icon}</span>
              <p className="font-heading font-bold text-3xl sm:text-4xl bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground mt-2 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
