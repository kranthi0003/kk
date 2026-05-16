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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-lg border border-border/60 overflow-hidden bg-border/40">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card/40 backdrop-blur p-6 text-center">
              <p className="font-heading text-3xl sm:text-4xl tracking-tight text-foreground" style={{ fontWeight: 600 }}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
