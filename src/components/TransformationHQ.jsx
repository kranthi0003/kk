import React, { useEffect, useMemo, useState } from 'react'

// ============================================================
// TRANSFORMATION HQ — Personal fitness OS for Kranthi
// Goal: lean, muscular, flat belly by end of 2027
// 78kg / ~24% BF  ->  70-72kg / ~15% BF
// Equipment: dumbbells + bench. Storage: localStorage ("thq:*")
// ============================================================

const TABS = [
  { id: 'today',    icon: '✅', label: 'Today' },
  { id: 'workout',  icon: '🏋️', label: 'Workout' },
  { id: 'nutrition',icon: '🍽️', label: 'Nutrition' },
  { id: 'steps',    icon: '🚶', label: 'Steps & Recovery' },
  { id: 'progress', icon: '📈', label: 'Progress' },
]

// ------- storage helpers --------------------------------------------------
const lsGet = (k, fb) => {
  try { const v = localStorage.getItem(`thq:${k}`); return v ? JSON.parse(v) : fb } catch { return fb }
}
const lsSet = (k, v) => { try { localStorage.setItem(`thq:${k}`, JSON.stringify(v)) } catch {} }
const todayKey = () => new Date().toISOString().slice(0, 10)

// ------- data -------------------------------------------------------------
const DAILY_CHECKS = [
  { key: 'protein',  label: 'Hit protein target',          sub: '~150–165g across meals' },
  { key: 'calories', label: 'Stayed near calorie target',  sub: '~1,950 lift day / ~1,650 rest' },
  { key: 'steps',    label: '10,000 steps',                sub: 'morning + post-lunch + evening' },
  { key: 'workout',  label: 'Workout done',                sub: 'only Mon / Wed / Fri' },
  { key: 'water',    label: '2.5–3 L water',               sub: '' },
  { key: 'sleep',    label: 'Slept 7–8 hrs',               sub: 'fat loss happens here' },
  { key: 'nojunk',   label: 'No liquid calories / deep fry', sub: '' },
]

// Mon=A, Wed=B, Fri=C (getDay: 0=Sun..6=Sat)
const WORKOUT_BY_DAY = { 1: 'Day A — Push', 3: 'Day B — Pull', 5: 'Day C — Full mix' }

const SPLIT = [
  {
    id: 'A', title: 'Day A — Push emphasis', day: 'Mon', accent: '🟢',
    rows: [
      ['Goblet Squat', '3 × 10–12'],
      ['Flat DB Bench Press', '3 × 8–10'],
      ['One-Arm DB Row', '3 × 10 / side'],
      ['Seated DB Shoulder Press', '3 × 10'],
      ['DB Romanian Deadlift', '3 × 10–12'],
      ['Plank', '3 × 30–45s'],
    ],
  },
  {
    id: 'B', title: 'Day B — Pull emphasis', day: 'Wed', accent: '🔵',
    rows: [
      ['DB Reverse Lunge', '3 × 10 / side'],
      ['Incline DB Bench Press (30–45°)', '3 × 8–10'],
      ['Chest-Supported DB Row', '3 × 10'],
      ['DB Lateral Raise', '3 × 12–15'],
      ['DB Hip Thrust (back on bench)', '3 × 12'],
      ['DB Bicep Curl', '3 × 12'],
    ],
  },
  {
    id: 'C', title: 'Day C — Full mix', day: 'Fri', accent: '🟣',
    rows: [
      ['Bulgarian Split Squat (foot on bench)', '3 × 8 / side'],
      ['Flat DB Bench Press', '3 × 10'],
      ['DB Pullover', '3 × 12'],
      ['Arnold Press', '3 × 10'],
      ['DB Stiff-Leg Deadlift', '3 × 12'],
      ['DB Overhead Triceps Extension', '3 × 12'],
    ],
  },
]

const MEALS = [
  { slot: 'Breakfast · ~400 cal / 35g P', nv: '3 whole eggs + 2 whites scrambled w/ veg · 1 multigrain toast or ½ cup oats · black coffee/green tea', veg: '150g paneer bhurji or moong dal chilla' },
  { slot: 'Lunch · ~550 cal / 45g P', nv: '150g chicken/fish · 1 cup rice or 2 rotis · dal + big salad/sabzi', veg: '1.5 cups rajma/chana or paneer + dal' },
  { slot: 'Snack (post-workout) · ~300 cal / 35g P', nv: '1 scoop whey OR 200g Greek yogurt/hung curd · 15–20g almonds or a fruit', veg: 'Same — drop on rest days → ~1,650 cal' },
  { slot: 'Dinner · ~600 cal / 40g P', nv: '150–200g chicken/fish/egg · 1–2 rotis or small rice · loads of veggies', veg: '150g paneer/tofu instead — lighter carbs at night' },
]

const NUTRITION_RULES = [
  'Protein FIRST at every meal',
  'Half the plate = vegetables',
  'Light oil (1–2 tsp) · grill/bake over fry',
  'Zero sugary drinks / juice (biggest belly driver)',
  'Water before meals · stop at 80% full',
  '1 relaxed meal/week so you never quit',
]

const STEPS_SPLIT = [
  ['Morning walk', '~3,500'],
  ['After lunch (10 min)', '~2,000'],
  ['Evening walk', '~3,500'],
  ['Incidental (stairs, errands)', '~1,000'],
]

const RECOVERY = [
  ['Sleep 7–8 hrs', 'low sleep = belly fat + cravings + puffy face'],
  ['Cut excess salt', 'reduces face/water bloat fast'],
  ['Limit alcohol', 'stalls fat loss + puffiness'],
  ['2.5–3 L water', 'less bloat, better fullness'],
]

const MILESTONES = [
  ['Month 1–2', 'Habits locked: protein + 10k steps + 3 lifts/wk'],
  ['Month 3–6', '~73–74kg · belly noticeably flatter'],
  ['Month 6–12', '~71–72kg · ~16–17% BF · visible muscle'],
  ['2027 🏆', '70–72kg · ~14–15% BF · lean face, defined core'],
]

// ------- small UI atoms ---------------------------------------------------
const ACCENT = 'var(--chart-1)'

function Card({ title, sub, children, className = '' }) {
  return (
    <div className={`rounded-2xl border bg-card/60 backdrop-blur-sm p-4 sm:p-5 ${className}`}
      style={{ borderColor: 'color-mix(in oklab, var(--chart-1) 16%, var(--color-border))' }}>
      {title && <h2 className="font-heading text-foreground text-sm sm:text-[15px] font-semibold mb-1">{title}</h2>}
      {sub && <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{sub}</p>}
      {children}
    </div>
  )
}

function Pill({ children }) {
  return (
    <span className="inline-block rounded-full px-3 py-1 text-[11px] text-muted-foreground"
      style={{ background: 'color-mix(in oklab, var(--chart-1) 8%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 20%, transparent)' }}>
      {children}
    </span>
  )
}

function Note({ children }) {
  return (
    <div className="mt-3 text-xs text-muted-foreground rounded-lg px-3 py-2 leading-relaxed"
      style={{ background: 'color-mix(in oklab, var(--chart-1) 7%, transparent)', borderLeft: '3px solid color-mix(in oklab, var(--chart-1) 55%, transparent)' }}>
      {children}
    </div>
  )
}

function Stat({ value, label }) {
  return (
    <div className="flex-1 min-w-[88px] rounded-xl border p-3 text-center"
      style={{ borderColor: 'color-mix(in oklab, var(--chart-1) 16%, var(--color-border))', background: 'color-mix(in oklab, var(--chart-1) 5%, transparent)' }}>
      <div className="text-xl font-semibold" style={{ color: ACCENT }}>{value}</div>
      <div className="text-[10.5px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}

function ExTable({ rows }) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
          <th className="text-left font-medium py-1.5">Exercise</th>
          <th className="text-right font-medium py-1.5">Sets × Reps</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([ex, sr]) => (
          <tr key={ex} className="border-t border-border/40">
            <td className="py-2 pr-2 text-foreground font-medium">{ex}</td>
            <td className="py-2 text-right text-muted-foreground whitespace-nowrap">{sr}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ============================================================
// MAIN
// ============================================================
export default function TransformationHQ({ onBack }) {
  const [tab, setTab] = useState(() => {
    const fromHash = window.location.hash.split('?')[1]?.split('=')?.[1]
    return TABS.find(t => t.id === fromHash)?.id || 'today'
  })

  useEffect(() => {
    const base = window.location.hash.startsWith('#/fitness') ? '#/fitness' : '#/transformation'
    const newHash = `${base}?tab=${tab}`
    if (window.location.hash !== newHash) window.history.replaceState(null, '', newHash)
  }, [tab])

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-30 thq-nav-surface backdrop-blur-xl border-b"
        style={{ borderBottomColor: 'color-mix(in oklab, var(--chart-1) 22%, var(--color-border))' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            onClick={onBack || (() => { window.location.hash = ''; window.location.reload() })}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm group"
          >
            <span className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'color-mix(in oklab, var(--chart-1) 8%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 22%, transparent)' }}>
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </span>
            <span className="hidden sm:inline">Back to site</span>
          </button>
          <div className="text-center flex-1 min-w-0">
            <h1 className="font-heading text-foreground text-base sm:text-lg font-semibold flex items-center justify-center gap-2 tracking-tight">
              <span className="text-lg">🔥</span>
              <span>Transformation <span className="text-gradient-violet">HQ</span></span>
            </h1>
            <p className="text-[10.5px] text-muted-foreground hidden sm:block tracking-wide">78kg → 70–72kg · ~24% → ~15% BF · best shape by 2027</p>
          </div>
          <div className="w-20 sm:w-28 flex-shrink-0" />
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-3 pb-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-0.5 min-w-fit">
            {TABS.map(t => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all"
                  style={active ? {
                    background: 'color-mix(in oklab, var(--chart-1) 16%, transparent)',
                    color: 'var(--color-foreground)',
                    boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 38%, transparent), 0 2px 8px -2px color-mix(in oklab, var(--chart-1) 35%, transparent)',
                  } : { color: 'var(--color-muted-foreground)' }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-foreground)' }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-muted-foreground)' }}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-16 space-y-4">
        {tab === 'today'     && <TodayTab />}
        {tab === 'workout'   && <WorkoutTab />}
        {tab === 'nutrition' && <NutritionTab />}
        {tab === 'steps'     && <StepsTab />}
        {tab === 'progress'  && <ProgressTab />}
      </div>

      <div className="border-t border-border/30 py-4 text-center">
        <span className="text-[10px] text-muted-foreground/60 font-mono">All data stored locally · no cloud · no judgment</span>
      </div>
    </div>
  )
}

// ============================================================
// TODAY
// ============================================================
function strongDay(d) { return !!(d && d.protein && d.steps) }

function TodayTab() {
  const tk = todayKey()
  const [log, setLog] = useState(() => lsGet(`day:${tk}`, {}))
  const toggle = (k) => {
    const next = { ...log, [k]: !log[k] }
    setLog(next); lsSet(`day:${tk}`, next)
  }

  const now = new Date()
  const lift = WORKOUT_BY_DAY[now.getDay()]

  // week (Mon-Sun) + stats
  const { cells, hits, lifts } = useMemo(() => {
    const today = new Date()
    const dow = (today.getDay() + 6) % 7 // 0=Mon
    const monday = new Date(today); monday.setDate(today.getDate() - dow)
    let hits = 0, lifts = 0
    const cells = []
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    for (let i = 0; i < 7; i++) {
      const dt = new Date(monday); dt.setDate(monday.getDate() + i)
      const key = dt.toISOString().slice(0, 10)
      const d = key === tk ? log : lsGet(`day:${key}`, {})
      const strong = strongDay(d)
      if (strong) hits++
      if (d && d.workout) lifts++
      cells.push({ label: labels[i], date: dt.getDate(), strong, isToday: key === tk })
    }
    return { cells, hits, lifts }
  }, [log, tk])

  const streak = useMemo(() => {
    let s = 0
    const cur = new Date()
    for (let i = 0; i < 400; i++) {
      const key = cur.toISOString().slice(0, 10)
      const d = key === tk ? log : lsGet(`day:${key}`, {})
      if (strongDay(d)) { s++; cur.setDate(cur.getDate() - 1) }
      else if (key === tk) { cur.setDate(cur.getDate() - 1) } // today not done yet — don't break
      else break
    }
    return s
  }, [log, tk])

  return (
    <>
      <Card title="Daily Checklist" sub={now.toDateString()}>
        <div className="text-xs mb-3" style={{ color: lift ? ACCENT : 'var(--color-muted-foreground)' }}>
          {lift ? `💪 Today's lift: ${lift}` : '🛌 Rest day — easy walk only. No lift today.'}
        </div>
        <div className="space-y-2">
          {DAILY_CHECKS.map(c => {
            const done = !!log[c.key]
            return (
              <button key={c.key} onClick={() => toggle(c.key)}
                className="w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors"
                style={{ borderColor: 'color-mix(in oklab, var(--chart-1) 14%, var(--color-border))', background: done ? 'color-mix(in oklab, var(--chart-1) 10%, transparent)' : 'transparent' }}>
                <span className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center"
                  style={{ background: done ? ACCENT : 'transparent', boxShadow: done ? 'none' : 'inset 0 0 0 2px var(--color-muted-foreground)' }}>
                  {done && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="var(--color-background)" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </span>
                <span className="min-w-0">
                  <span className={`text-[13px] ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{c.label}</span>
                  {c.sub && <span className="block text-[11px] text-muted-foreground">{c.sub}</span>}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <Card title="📊 This Week" sub="Green = a day you hit your core habits (protein + steps).">
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((c, i) => (
            <div key={i} className="aspect-square rounded-lg border flex flex-col items-center justify-center text-[10px]"
              style={c.strong
                ? { background: ACCENT, color: 'var(--color-background)', borderColor: ACCENT, fontWeight: 700 }
                : { borderColor: c.isToday ? 'color-mix(in oklab, var(--chart-1) 45%, transparent)' : 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
              <span>{c.label}</span>
              <span className="text-[11px]">{c.date}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2.5 mt-3">
          <Stat value={streak} label="day streak" />
          <Stat value={`${hits}/7`} label="strong days" />
          <Stat value={`${lifts}/3`} label="lifts this wk" />
        </div>
        <Note><b className="text-foreground">Never miss twice in a row.</b> One off day is human. Two is a pattern.</Note>
      </Card>
    </>
  )
}

// ============================================================
// WORKOUT
// ============================================================
function WorkoutTab() {
  return (
    <>
      <Card title="🏋️ Dumbbells + Bench · 3-Day Full Body"
        sub="Mon = A · Wed = B · Fri = C. 3 sets each, rest 60–90s. Last 1–2 reps hard but clean. Add reps weekly → then add weight (progressive overload).">
        <div className="flex flex-wrap gap-2">
          <Pill>Warm-up <b className="text-foreground">5 min</b></Pill>
          <Pill>Session <b className="text-foreground">40–50 min</b></Pill>
          <Pill>Tempo <b className="text-foreground">controlled</b></Pill>
        </div>
      </Card>
      {SPLIT.map(s => (
        <Card key={s.id} title={`${s.accent} ${s.title}`} sub={`(${s.day})`}>
          <ExTable rows={s.rows} />
        </Card>
      ))}
      <Note>Tue / Thu / Sat / Sun = rest or an easy walk. Muscle grows on rest days, not in the gym.</Note>
    </>
  )
}

// ============================================================
// NUTRITION
// ============================================================
function NutritionTab() {
  return (
    <>
      <Card title="🎯 Daily Targets">
        <div className="flex gap-2.5">
          <Stat value="~1,950" label="cal (lift day)" />
          <Stat value="~1,650" label="cal (rest day)" />
          <Stat value="155g" label="protein" />
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <Pill>Fat <b className="text-foreground">~55–60g</b></Pill>
          <Pill>Carbs <b className="text-foreground">~180g</b></Pill>
          <Pill>Fiber-rich veg <b className="text-foreground">unlimited</b></Pill>
        </div>
        <Note>Deficit of ~400–500 cal = 0.4–0.6 kg fat loss/week. Slow on purpose → muscle stays, fat goes for good.</Note>
      </Card>

      <Card title="🍳 Sample Day" sub="~1,950 cal · 155g protein · swap freely between veg / non-veg">
        <div className="space-y-3">
          {MEALS.map(m => (
            <div key={m.slot}>
              <div className="text-[12px] font-medium uppercase tracking-wide mb-1" style={{ color: 'color-mix(in oklab, var(--chart-1) 75%, var(--color-foreground))' }}>{m.slot}</div>
              <div className="text-[13px] text-foreground">{m.nv}</div>
              <div className="text-[12px] text-muted-foreground">Veg: {m.veg}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="📏 Rules that make it work">
        <ul className="space-y-1.5">
          {NUTRITION_RULES.map(r => (
            <li key={r} className="flex items-start gap-2 text-[13px] text-foreground">
              <span style={{ color: ACCENT }}>✓</span><span>{r}</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}

// ============================================================
// STEPS & RECOVERY
// ============================================================
function StepsTab() {
  return (
    <>
      <Card title="🚶 10,000 Steps — split it" sub="Stacking small walks means a busy day never breaks the streak.">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
              <th className="text-left font-medium py-1.5">When</th>
              <th className="text-right font-medium py-1.5">Target</th>
            </tr>
          </thead>
          <tbody>
            {STEPS_SPLIT.map(([when, n]) => (
              <tr key={when} className="border-t border-border/40">
                <td className="py-2 text-foreground">{when}</td>
                <td className="py-2 text-right text-muted-foreground">{n}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Note>Steps burn fat without hurting lifting recovery — unlike hard cardio. This is your fat-loss workhorse.</Note>
      </Card>

      <Card title="😴 Recovery & de-bloat (face + belly)">
        <ul className="space-y-2">
          {RECOVERY.map(([t, why]) => (
            <li key={t} className="flex items-start gap-2 text-[13px]">
              <span style={{ color: ACCENT }}>✓</span>
              <span><span className="text-foreground">{t}</span> <span className="text-muted-foreground">— {why}</span></span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}

// ============================================================
// PROGRESS
// ============================================================
function ProgressTab() {
  const [weights, setWeights] = useState(() => lsGet('weights', []))
  const [input, setInput] = useState('')

  const saveWeight = () => {
    const v = parseFloat(input)
    if (!v) return
    const tk = todayKey()
    const next = weights.filter(w => w.date !== tk).concat({ date: tk, kg: v }).sort((a, b) => a.date < b.date ? -1 : 1)
    setWeights(next); lsSet('weights', next); setInput('')
  }

  const exportBackup = () => {
    const all = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('thq:')) all[k] = localStorage.getItem(k)
    }
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `transformation-backup-${todayKey()}.json`
    a.click()
  }

  const resetAll = () => {
    if (!window.confirm('Erase all tracking data?')) return
    Object.keys(localStorage).filter(k => k.startsWith('thq:')).forEach(k => localStorage.removeItem(k))
    setWeights([])
  }

  const rows = weights.slice().reverse()

  return (
    <>
      <Card title="⚖️ Weekly Weigh-in" sub="Same morning each week, before food. Judge the monthly trend, not daily noise.">
        <div className="flex gap-2 items-center">
          <input type="number" step="0.1" value={input} onChange={e => setInput(e.target.value)} placeholder="kg"
            className="w-24 rounded-lg border bg-transparent px-3 py-2 text-sm text-foreground outline-none"
            style={{ borderColor: 'color-mix(in oklab, var(--chart-1) 20%, var(--color-border))' }} />
          <button onClick={saveWeight}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: ACCENT, color: 'var(--color-background)' }}>Log weight</button>
        </div>
        {rows.length > 0 && (
          <table className="w-full text-[13px] mt-3">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
                <th className="text-left font-medium py-1.5">Date</th>
                <th className="text-left font-medium py-1.5">Weight</th>
                <th className="text-left font-medium py-1.5">Δ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w, i) => {
                const prev = rows[i + 1]
                const delta = prev ? +(w.kg - prev.kg).toFixed(1) : null
                const color = delta === null ? 'var(--color-muted-foreground)' : delta <= 0 ? ACCENT : 'var(--destructive)'
                return (
                  <tr key={w.date} className="border-t border-border/40">
                    <td className="py-2 text-muted-foreground">{w.date}</td>
                    <td className="py-2 text-foreground">{w.kg} kg</td>
                    <td className="py-2" style={{ color }}>{delta === null ? '—' : `${delta <= 0 ? '▼' : '▲'} ${Math.abs(delta)}`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="🎯 Milestones to 2027">
        <table className="w-full text-[13px]">
          <tbody>
            {MILESTONES.map(([w, g]) => (
              <tr key={w} className="border-t border-border/40 first:border-t-0">
                <td className="py-2 pr-3 text-foreground font-medium whitespace-nowrap align-top">{w}</td>
                <td className="py-2 text-muted-foreground">{g}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Note>📸 Take progress photos every 2 weeks (front/side). The mirror lies day-to-day; photos don't.</Note>
      </Card>

      <Card title="⚙️ Data" sub="Everything saves automatically in this browser. Add the site to your phone home screen.">
        <div className="flex gap-2">
          <button onClick={exportBackup}
            className="rounded-lg border px-3.5 py-2 text-[13px] font-medium text-foreground"
            style={{ borderColor: 'color-mix(in oklab, var(--chart-1) 20%, var(--color-border))' }}>Export backup</button>
          <button onClick={resetAll}
            className="rounded-lg border px-3.5 py-2 text-[13px] font-medium"
            style={{ borderColor: 'color-mix(in oklab, var(--destructive) 45%, var(--color-border))', color: 'var(--destructive)' }}>Reset all</button>
        </div>
      </Card>
    </>
  )
}
