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
    const timeout = setTimeout(() => setWorkingDays(calculateWorkingDays()), tomorrow - now)
    return () => clearTimeout(timeout)
  }, [])

  const stats = [
    { label: 'Days in tech', value: workingDays.toLocaleString() },
    { label: 'Companies', value: '4' },
    { label: 'Enterprise clients', value: '100+' },
    { label: 'Certifications', value: '6' },
  ]

  return (
    <section className="py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat, i) => {
            const tints = ['pr-tint-violet', 'pr-tint-magenta', 'pr-tint-coral', 'pr-tint-violet']
            const numColors = ['oklch(78% 0.22 285)', 'oklch(78% 0.27 320)', 'oklch(78% 0.20 25)', 'oklch(78% 0.22 285)']
            return (
              <div key={stat.label} className={`bg-card p-6 text-center ${tints[i % 4]}`}>
                <p className="font-heading text-3xl sm:text-4xl tracking-tight" style={{ fontWeight: 600, color: numColors[i % 4] }}>
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1.5">{stat.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
