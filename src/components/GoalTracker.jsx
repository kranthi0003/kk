import React, { useEffect, useState } from 'react'

// ============================================================
// GoalTracker — home-page summary of Transformation HQ progress.
// Reads the same localStorage data the HQ writes ("thq:*") and
// surfaces today's completion, streak, weekly consistency and
// weight progress toward the 2027 goal.
// ============================================================

const GOAL_KG = 72
const START_KG = 78
const CHECK_KEYS = ['protein', 'calories', 'steps', 'workout', 'water', 'sleep', 'nojunk']

const lsGet = (k, fb) => {
  try { const v = localStorage.getItem(`thq:${k}`); return v ? JSON.parse(v) : fb } catch { return fb }
}
const dayKey = (d = new Date()) => d.toISOString().slice(0, 10)
const strongDay = (d) => !!(d && d.protein && d.steps)

function computeStats() {
  const tk = dayKey()
  const todayLog = lsGet(`day:${tk}`, {})
  const doneToday = CHECK_KEYS.filter(k => todayLog[k]).length

  // streak (strong = protein && steps); today not-yet-done doesn't break it
  let streak = 0
  const cur = new Date()
  for (let i = 0; i < 400; i++) {
    const key = dayKey(cur)
    const d = lsGet(`day:${key}`, {})
    if (strongDay(d)) { streak++; cur.setDate(cur.getDate() - 1) }
    else if (key === tk) { cur.setDate(cur.getDate() - 1) }
    else break
  }

  // current week (Mon–Sun)
  const today = new Date()
  const dow = (today.getDay() + 6) % 7
  const monday = new Date(today); monday.setDate(today.getDate() - dow)
  let weekHits = 0, lifts = 0
  for (let i = 0; i < 7; i++) {
    const dt = new Date(monday); dt.setDate(monday.getDate() + i)
    const d = lsGet(`day:${dayKey(dt)}`, {})
    if (strongDay(d)) weekHits++
    if (d && d.workout) lifts++
  }

  // weight
  const weights = lsGet('weights', [])
  const latest = weights.length ? weights[weights.length - 1].kg : null
  const startRef = weights.length ? Math.max(weights[0].kg, START_KG) : START_KG
  const current = latest ?? START_KG
  const lostPct = Math.max(0, Math.min(100, ((startRef - current) / (startRef - GOAL_KG)) * 100))

  return { doneToday, total: CHECK_KEYS.length, streak, weekHits, lifts, latest, current, lostPct, hasWeight: !!latest }
}

function Ring({ done, total }) {
  const r = 30, c = 2 * Math.PI * r
  const pct = total ? done / total : 0
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" className="flex-shrink-0">
      <circle cx="38" cy="38" r={r} fill="none" stroke="var(--color-border)" strokeWidth="7" opacity="0.5" />
      <circle cx="38" cy="38" r={r} fill="none" stroke="oklch(75% 0.22 285)" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 38 38)"
        style={{ transition: 'stroke-dashoffset .5s ease' }} />
      <text x="38" y="34" textAnchor="middle" className="fill-foreground" style={{ fontSize: 15, fontWeight: 700 }}>{done}/{total}</text>
      <text x="38" y="48" textAnchor="middle" className="fill-current text-muted-foreground" style={{ fontSize: 8 }}>today</text>
    </svg>
  )
}

function Chip({ value, label }) {
  return (
    <div className="rounded-lg bg-card border border-border/80 px-3 py-2 text-center">
      <div className="text-lg font-semibold" style={{ color: 'oklch(75% 0.22 285)' }}>{value}</div>
      <div className="text-[10px] text-muted-foreground tracking-wide">{label}</div>
    </div>
  )
}

export default function GoalTracker() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const refresh = () => setStats(computeStats())
    refresh()
    const onVis = () => { if (!document.hidden) refresh() }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVis)
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  const open = () => { window.location.hash = '#/transformation'; window.location.reload() }

  const s = stats || { doneToday: 0, total: 7, streak: 0, weekHits: 0, lifts: 0, current: START_KG, lostPct: 0, hasWeight: false }

  return (
    <section id="goals" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="font-mono text-xs uppercase tracking-[0.2em] mb-3" style={{ color: 'oklch(75% 0.22 285)' }}>Transformation</p>
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl tracking-tight" style={{ fontWeight: 600 }}>
            Goal tracker
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-xl mx-auto">
            Fittest shape by 2027 — {START_KG}kg → {GOAL_KG}kg. Tracked daily, no excuses.
          </p>
        </div>

        <div className="rounded-2xl bg-card p-5 sm:p-6 pr-tint-violet">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Today ring + streak */}
            <div className="flex items-center gap-4">
              <Ring done={s.doneToday} total={s.total} />
              <div>
                <div className="text-2xl font-bold text-foreground flex items-baseline gap-1.5">
                  {s.streak}<span className="text-xs font-medium text-muted-foreground">day streak 🔥</span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {s.doneToday === 0 ? 'No habits logged today yet' : `${s.doneToday}/${s.total} habits done today`}
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-2.5 sm:max-w-xs sm:ml-auto">
              <Chip value={`${s.weekHits}/7`} label="strong days" />
              <Chip value={`${s.lifts}/3`} label="lifts this wk" />
              <Chip value={s.hasWeight ? `${s.current}kg` : `${START_KG}kg`} label="current" />
            </div>
          </div>

          {/* Weight progress bar */}
          <div className="mt-6">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
              <span>{START_KG}kg start</span>
              <span>{s.hasWeight ? `${Math.round(s.lostPct)}% to goal` : 'log a weight to start'}</span>
              <span>{GOAL_KG}kg goal</span>
            </div>
            <div className="h-2.5 rounded-full bg-border/60 overflow-hidden">
              <div className="h-full rounded-full" style={{
                width: `${s.lostPct}%`,
                background: 'linear-gradient(90deg, oklch(72% 0.27 320), oklch(75% 0.22 285))',
                transition: 'width .6s ease',
              }} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={open}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white"
              style={{ background: 'oklch(60% 0.2 285)' }}>
              {s.doneToday === 0 ? 'Track today →' : 'Open Transformation HQ →'}
            </button>
            <span className="text-[11px] text-muted-foreground">Updates from your daily check-ins · stored on this device</span>
          </div>
        </div>
      </div>
    </section>
  )
}
