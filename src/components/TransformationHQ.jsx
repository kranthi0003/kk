import React, { useEffect, useMemo, useState } from 'react'
import {
  lsGet, lsSet, todayKey,
  PLAN, SCHEDULED_DAYS, workoutLabelForDay,
  thisWeekDates, dayCompletion, workoutDoneForDate, cumulativeStats,
  strongDay,
} from '../lib/fitness'
import { WEEK, SALADS, NUTRITION, MEAL_TIMES, todayPlan, weeklyGrocery, PLAN_DAYS } from '../lib/diet'

// ============================================================
// TRANSFORMATION HQ — Personal fitness OS for Kranthi
// Goal: lean, muscular, flat belly by end of 2027
// 78kg / ~24% BF  ->  70-72kg / ~15% BF
// Equipment: dumbbells + bench. Storage: localStorage ("thq:*")
// Plan + progress helpers live in ../lib/fitness (shared with hero pulse)
// ============================================================

const TABS = [
  { id: 'today',    icon: '✅', label: 'Today' },
  { id: 'workout',  icon: '🏋️', label: 'Workout' },
  { id: 'nutrition',icon: '🍽️', label: 'Nutrition' },
  { id: 'diet',     icon: '🥗', label: 'Diet' },
  { id: 'steps',    icon: '🚶', label: 'Steps & Recovery' },
  { id: 'progress', icon: '📈', label: 'Progress' },
]

// ------- data -------------------------------------------------------------
const DAILY_CHECKS = [
  { key: 'protein',  label: 'Hit protein target',          sub: '~150–165g across meals' },
  { key: 'calories', label: 'Stayed near calorie target',  sub: '~1,950 lift day / ~1,650 rest' },
  { key: 'steps',    label: '10,000 steps',                sub: 'morning + post-lunch + evening' },
  { key: 'workout',  label: 'Workout done',                sub: 'check off exercises in Workout tab' },
  { key: 'water',    label: '2.5–3 L water',               sub: '' },
  { key: 'sleep',    label: 'Slept 7–8 hrs',               sub: 'fat loss happens here' },
  { key: 'nojunk',   label: 'No liquid calories / deep fry', sub: '' },
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
        {tab === 'diet'      && <DietTab />}
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
function TodayTab() {
  const tk = todayKey()
  const [log, setLog] = useState(() => lsGet(`day:${tk}`, {}))
  const toggle = (k) => {
    const next = { ...log, [k]: !log[k] }
    setLog(next); lsSet(`day:${tk}`, next)
  }

  const now = new Date()
  const lift = workoutLabelForDay(now.getDay())

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

  // Workout progress — this week (from per-exercise check-offs) + all-time
  const wkWorkouts = useMemo(() => thisWeekDates().filter(d => workoutDoneForDate(d.dateKey)).length, [log, tk])
  const cum = useMemo(() => cumulativeStats(), [log, tk])
  const wkPct = Math.round((wkWorkouts / SCHEDULED_DAYS) * 100)

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
          <Stat value={`${wkWorkouts}/${SCHEDULED_DAYS}`} label="workouts wk" />
        </div>
        <Note><b className="text-foreground">Never miss twice in a row.</b> One off day is human. Two is a pattern.</Note>
      </Card>

      <Card title="🏋️ Workout Progress" sub="Updates as you check off exercises in the Workout tab.">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] text-muted-foreground">This week</span>
          <span className="text-[12px] font-medium text-foreground">{wkWorkouts}/{SCHEDULED_DAYS} workouts · {wkPct}%</span>
        </div>
        <ProgressBar pct={wkPct} />
        <div className="flex gap-2.5 mt-3">
          <Stat value={cum.workouts} label="all-time workouts" />
          <Stat value={cum.exercises} label="exercises done" />
          <Stat value={`${wkPct}%`} label="week complete" />
        </div>
        <Note>Every checked exercise counts — <b className="text-foreground">{cum.exercises}</b> done so far. Consistency compounds.</Note>
      </Card>
    </>
  )
}

// ============================================================
// WORKOUT
// ============================================================
function ProgressBar({ pct, height = 8 }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'color-mix(in oklab, var(--chart-1) 12%, transparent)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: ACCENT }} />
    </div>
  )
}

function WorkoutTab() {
  const week = useMemo(thisWeekDates, [])
  const initial = Math.max(0, week.findIndex(d => d.isToday))
  const [sel, setSel] = useState(initial)
  const day = week[sel]
  const plan = PLAN[day.idx]
  const [log, setLog] = useState(() => lsGet(`workout:${day.dateKey}`, {}))

  useEffect(() => { setLog(lsGet(`workout:${day.dateKey}`, {})) }, [day.dateKey])

  const toggle = (exId) => {
    const next = { ...log, [exId]: !log[exId] }
    setLog(next); lsSet(`workout:${day.dateKey}`, next)
  }
  const setAll = (val) => {
    const next = {}
    if (val) plan.exercises.forEach(e => { next[e.id] = true })
    setLog(next); lsSet(`workout:${day.dateKey}`, next)
  }

  const total = plan.exercises.length
  const done = plan.exercises.filter(e => log[e.id]).length
  const pct = total ? Math.round((done / total) * 100) : 0
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  return (
    <>
      {/* Day selector */}
      <div className="grid grid-cols-7 gap-1.5">
        {week.map((d, i) => {
          const p = PLAN[d.idx]
          const comp = workoutDoneForDate(d.dateKey)
          const active = i === sel
          return (
            <button key={i} onClick={() => setSel(i)}
              className="rounded-xl border py-2 flex flex-col items-center gap-0.5 transition-all"
              style={active
                ? { background: 'color-mix(in oklab, var(--chart-1) 16%, transparent)', borderColor: 'color-mix(in oklab, var(--chart-1) 42%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 30%, transparent)' }
                : { borderColor: d.isToday ? 'color-mix(in oklab, var(--chart-1) 38%, transparent)' : 'var(--color-border)' }}>
              <span className="text-[10px] text-muted-foreground">{labels[i]}</span>
              <span className="text-[11px] font-semibold text-foreground">{d.date}</span>
              <span className="text-[10px] leading-none">{p.rest ? '🛌' : comp ? '✅' : '•'}</span>
            </button>
          )
        })}
      </div>

      <Card title={`${plan.day} — ${plan.name}`} sub={plan.focus}>
        {plan.rest ? (
          <div className="text-[13px] text-muted-foreground">Rest day — {plan.cardio}. No weights. Muscle grows on rest days, not in the gym.</div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-muted-foreground tabular-nums">{done}/{total} done · {pct}%</span>
              <button onClick={() => setAll(done !== total)} className="text-[11px] font-medium" style={{ color: ACCENT }}>
                {done === total ? 'Clear all' : 'Mark all'}
              </button>
            </div>
            <ProgressBar pct={pct} />
            <div className="space-y-2 mt-3">
              {plan.exercises.map(ex => {
                const checked = !!log[ex.id]
                return (
                  <button key={ex.id} onClick={() => toggle(ex.id)}
                    className="w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors"
                    style={{ borderColor: 'color-mix(in oklab, var(--chart-1) 14%, var(--color-border))', background: checked ? 'color-mix(in oklab, var(--chart-1) 10%, transparent)' : 'transparent' }}>
                    <span className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center"
                      style={{ background: checked ? ACCENT : 'transparent', boxShadow: checked ? 'none' : 'inset 0 0 0 2px var(--color-muted-foreground)' }}>
                      {checked && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="var(--color-background)" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </span>
                    <span className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                      <span className={`text-[13px] ${checked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{ex.name}</span>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">{ex.sr}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
        <Note>🏃 Cardio: {plan.cardio}</Note>
      </Card>

      <Note>Trains <b className="text-foreground">Mon–Sat</b> · Sunday is full rest. Check off each exercise as you finish — your week &amp; all-time progress update on the <b className="text-foreground">Today</b> tab.</Note>
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
// DIET — 100-Day Lean Diet (Meal 1 / Meal 2 + daily check-offs)
// ============================================================
function MealBlock({ slot, time, meal, checked, onToggle }) {
  return (
    <div className="rounded-xl border px-3 py-3 transition-colors"
      style={{ borderColor: checked ? 'color-mix(in oklab, var(--chart-1) 38%, transparent)' : 'var(--color-border)', background: checked ? 'color-mix(in oklab, var(--chart-1) 8%, transparent)' : 'transparent' }}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 text-left">
        <span className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center"
          style={{ background: checked ? ACCENT : 'transparent', boxShadow: checked ? 'none' : 'inset 0 0 0 2px var(--color-muted-foreground)' }}>
          {checked && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="var(--color-background)" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        </span>
        <span className="flex-1 flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-semibold text-foreground">{slot}</span>
          <span className="text-[11px] text-muted-foreground">🕐 {time}</span>
        </span>
      </button>
      <ul className="mt-2 ml-8 space-y-1">
        {meal.items.map((it, i) => (
          <li key={i} className="text-[13px] flex items-center gap-2">
            <span>{it.e}</span>
            <span className={checked ? 'line-through text-muted-foreground' : 'text-foreground'}>{it.t}</span>
          </li>
        ))}
        {meal.salad && (
          <li className="text-[13px] flex items-start gap-2">
            <span>🥗</span>
            <span>
              <span className={checked ? 'line-through text-muted-foreground' : 'text-foreground'}>{meal.salad}</span>
              {SALADS[meal.salad] && <span className="block text-[11px] text-muted-foreground">{SALADS[meal.salad]}</span>}
            </span>
          </li>
        )}
      </ul>
    </div>
  )
}

function DietTab() {
  const tk = todayKey()
  const [meals, setMeals] = useState(() => lsGet(`meals:${tk}`, { m1: false, m2: false }))
  const [start, setStart] = useState(() => lsGet('diet:start', null))
  const today = todayPlan()
  const done = (meals.m1 ? 1 : 0) + (meals.m2 ? 1 : 0)
  const toggle = (m) => { const next = { ...meals, [m]: !meals[m] }; setMeals(next); lsSet(`meals:${tk}`, next) }
  const setBoth = () => { const v = done !== 2; const next = { m1: v, m2: v }; setMeals(next); lsSet(`meals:${tk}`, next) }
  const week = thisWeekDates()
  const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const dayNum = start ? Math.min(Math.max(Math.floor((new Date(tk) - new Date(start)) / 86400000) + 1, 1), PLAN_DAYS) : 0
  const weekNum = Math.ceil(dayNum / 7)
  const totalWeeks = Math.ceil(PLAN_DAYS / 7)
  const groceries = weeklyGrocery()
  const fmtQty = (s) => s.grams != null ? (s.grams >= 1000 ? `${(s.grams / 1000).toFixed(1)} kg` : `${s.grams} g`) : s.count != null ? `${s.count}` : `${s.scoops} scoops`

  return (
    <>
      <Card title="🔥 100-Day Lean Cut" sub="Week 1 repeats — just keep showing up.">
        {!start ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[13px] text-muted-foreground">Mark today as Day 1 to start the count.</span>
            <button onClick={() => { setStart(tk); lsSet('diet:start', tk) }}
              className="rounded-lg px-3 py-1.5 text-[12px] font-semibold" style={{ background: ACCENT, color: 'var(--color-background)' }}>
              Start the 100 days
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[15px] font-semibold text-foreground">Day {dayNum} <span className="text-muted-foreground font-normal">of {PLAN_DAYS}</span></span>
              <span className="text-[12px] text-muted-foreground">Week {weekNum} of {totalWeeks} · {PLAN_DAYS - dayNum} to go</span>
            </div>
            <ProgressBar pct={Math.round((dayNum / PLAN_DAYS) * 100)} />
            <button onClick={() => { lsSet('diet:start', null); setStart(null) }} className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors mt-2">reset start date</button>
          </>
        )}
      </Card>

      <Card title="📊 Daily Nutrition" sub="Approximate — Week 1 repeats through the 100 days">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {NUTRITION.map(n => (
            <div key={n.label} className="rounded-xl border border-border/60 px-2.5 py-2 text-center">
              <div className="text-[13px] font-semibold text-foreground tabular-nums leading-tight">{n.value}</div>
              <div className="text-[9.5px] uppercase tracking-wide text-muted-foreground mt-0.5">{n.unit} · {n.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title={`🍽️ Today — ${today.day}`} sub={`Tap a meal to log it · Meal 1 ~${MEAL_TIMES.m1} · Meal 2 ~${MEAL_TIMES.m2}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] text-muted-foreground tabular-nums">{done}/2 meals done</span>
          <button onClick={setBoth} className="text-[11px] font-medium" style={{ color: ACCENT }}>{done === 2 ? 'Clear' : 'Mark both'}</button>
        </div>
        <ProgressBar pct={Math.round((done / 2) * 100)} />
        <div className="space-y-2.5 mt-3">
          <MealBlock slot="Meal 1" time={MEAL_TIMES.m1} meal={today.m1} checked={meals.m1} onToggle={() => toggle('m1')} />
          <MealBlock slot="Meal 2" time={MEAL_TIMES.m2} meal={today.m2} checked={meals.m2} onToggle={() => toggle('m2')} />
        </div>
      </Card>

      <Card title="✅ This week" sub="Two dots = both meals logged that day.">
        <div className="grid grid-cols-7 gap-1.5">
          {week.map(d => {
            const m = lsGet(`meals:${d.dateKey}`, { m1: false, m2: false })
            const c = (m.m1 ? 1 : 0) + (m.m2 ? 1 : 0)
            return (
              <div key={d.dateKey} className="flex flex-col items-center gap-1 rounded-lg py-1.5"
                style={{ background: d.isToday ? 'color-mix(in oklab, var(--chart-1) 12%, transparent)' : 'transparent', border: d.isToday ? '1px solid color-mix(in oklab, var(--chart-1) 30%, transparent)' : '1px solid transparent' }}>
                <span className="text-[9.5px] text-muted-foreground">{DOW[d.idx]}</span>
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: c >= 1 ? ACCENT : 'var(--color-border)' }} />
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: c >= 2 ? ACCENT : 'var(--color-border)' }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="🗓️ The full week" sub="Print it, stick it on the fridge.">
        <div className="space-y-3">
          {WEEK.map(d => (
            <div key={d.dow} className="rounded-xl border border-border/50 overflow-hidden" style={today.dow === d.dow ? { borderColor: 'color-mix(in oklab, var(--chart-1) 38%, transparent)' } : undefined}>
              <div className="px-3 py-1.5 text-[12px] font-semibold text-foreground" style={{ background: 'color-mix(in oklab, var(--chart-1) 8%, transparent)' }}>{d.day}</div>
              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/50">
                {['m1', 'm2'].map(mk => (
                  <div key={mk} className="px-3 py-2.5">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">{mk === 'm1' ? `Meal 1 · ${MEAL_TIMES.m1}` : `Meal 2 · ${MEAL_TIMES.m2}`}</div>
                    <ul className="space-y-0.5">
                      {d[mk].items.map((it, i) => (<li key={i} className="text-[12.5px] text-foreground flex items-center gap-1.5"><span>{it.e}</span><span>{it.t}</span></li>))}
                      {d[mk].salad && <li className="text-[12.5px] flex items-center gap-1.5"><span>🥗</span><span className="text-foreground">{d[mk].salad}</span></li>}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="🛒 Weekly grocery list" sub="One week's shop — auto-built from the plan. Double it for a fortnight.">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Protein · dairy · nuts</div>
        <ul className="space-y-1 mb-4">
          {groceries.staples.map(s => (
            <li key={s.name} className="flex items-center justify-between text-[13px] border-b border-border/30 pb-1">
              <span className="text-foreground capitalize">{s.name}</span>
              <span className="text-muted-foreground tabular-nums">{fmtQty(s)}</span>
            </li>
          ))}
        </ul>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Vegetables · salad · pantry <span className="normal-case text-muted-foreground/70">— buy fresh, to taste</span></div>
        <div className="flex flex-wrap gap-1.5">
          {groceries.produce.map(p => (
            <span key={p} className="text-[12px] px-2 py-0.5 rounded-full border border-border/60 text-foreground capitalize">{p}</span>
          ))}
        </div>
      </Card>

      <Card title="🥗 Salad & bowl legend">
        <div className="space-y-2">
          {Object.entries(SALADS).map(([name, ing]) => (
            <div key={name} className="text-[13px]">
              <span className="text-foreground font-medium">{name}</span>
              <span className="block text-[12px] text-muted-foreground">{ing}</span>
            </div>
          ))}
        </div>
      </Card>

      <Note>Check off both meals each day — the dots above fill in, and your streak builds. All stored locally · no cloud · no judgment.</Note>
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
