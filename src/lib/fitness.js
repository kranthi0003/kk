// ============================================================
// Shared fitness data + progress helpers for Transformation HQ
// Single source of truth used by both the HQ page and the
// subtle hero "pulse" widget. Storage: localStorage ("thq:*").
// ============================================================

// ------- storage helpers --------------------------------------------------
export const lsGet = (k, fb) => {
  try { const v = localStorage.getItem(`thq:${k}`); return v ? JSON.parse(v) : fb } catch { return fb }
}
export const lsSet = (k, v) => { try { localStorage.setItem(`thq:${k}`, JSON.stringify(v)) } catch {} }
export const todayKey = () => new Date().toISOString().slice(0, 10)

export function localKey(dt) {
  const y = dt.getFullYear(), m = String(dt.getMonth() + 1).padStart(2, '0'), d = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ------- 6-day plan (train Mon–Sat, rest Sun). Indexed by getDay() 0=Sun..6=Sat
export const PLAN = [
  { day: 'Sun', name: 'Recovery', focus: 'Rest day — no weights', rest: true, cardio: 'Easy walk 20–30 min',
    exercises: [
      { id: 'sun-walk',    name: 'Walking',    sr: '20–30 min' },
      { id: 'sun-stretch', name: 'Stretching', sr: 'Optional' },
      { id: 'sun-mob',     name: 'Mobility',   sr: 'Optional' },
    ] },
  { day: 'Mon', name: 'Push Day', focus: 'Chest · Shoulders · Triceps', cardio: '30 min walk',
    exercises: [
      { id: 'mon-1', name: 'Flat Dumbbell Bench Press',     sr: '3 × 10' },
      { id: 'mon-2', name: 'Incline Dumbbell Press',        sr: '3 × 10' },
      { id: 'mon-3', name: 'Seated Dumbbell Shoulder Press', sr: '3 × 10' },
      { id: 'mon-4', name: 'Lateral Raise',                 sr: '3 × 15' },
      { id: 'mon-5', name: 'Overhead Tricep Extension',     sr: '3 × 12' },
      { id: 'mon-6', name: 'Plank',                         sr: '3 × 30 sec' },
    ] },
  { day: 'Tue', name: 'Legs', focus: 'Quads · Hamstrings · Calves', cardio: 'Walk or Tennis',
    exercises: [
      { id: 'tue-1', name: 'Goblet Squat',          sr: '4 × 10' },
      { id: 'tue-2', name: 'Romanian Deadlift',      sr: '4 × 10' },
      { id: 'tue-3', name: 'Bulgarian Split Squat',  sr: '3 × 10 / leg' },
      { id: 'tue-4', name: 'Standing Calf Raise',    sr: '3 × 20' },
      { id: 'tue-5', name: 'Dead Bug',               sr: '3 × 12' },
    ] },
  { day: 'Wed', name: 'Recovery & Core', focus: 'Core · Mobility', cardio: 'Easy Walk',
    exercises: [
      { id: 'wed-1', name: 'Bird Dog',             sr: '3 × 10' },
      { id: 'wed-2', name: 'Side Plank',           sr: '3 × 20 sec' },
      { id: 'wed-3', name: 'Dead Bug',             sr: '3 × 12' },
      { id: 'wed-4', name: 'Hip Mobility Stretch', sr: '5 min' },
      { id: 'wed-5', name: 'Hamstring Stretch',    sr: '5 min' },
      { id: 'wed-6', name: 'Shoulder Mobility',    sr: '5 min' },
    ] },
  { day: 'Thu', name: 'Pull Day', focus: 'Back · Biceps', cardio: '30 min walk',
    exercises: [
      { id: 'thu-1', name: 'One Arm Dumbbell Row', sr: '4 × 10' },
      { id: 'thu-2', name: 'Chest Supported Row',  sr: '3 × 12' },
      { id: 'thu-3', name: 'Rear Delt Fly',        sr: '3 × 15' },
      { id: 'thu-4', name: 'Dumbbell Curl',        sr: '3 × 10' },
      { id: 'thu-5', name: 'Hammer Curl',          sr: '3 × 10' },
    ] },
  { day: 'Fri', name: 'Full Body', focus: 'Total body', cardio: 'Walk or Tennis',
    exercises: [
      { id: 'fri-1', name: 'Dumbbell Bench Press',    sr: '3 × 10' },
      { id: 'fri-2', name: 'Dumbbell Row',            sr: '3 × 10' },
      { id: 'fri-3', name: 'Goblet Squat',            sr: '3 × 10' },
      { id: 'fri-4', name: 'Dumbbell Shoulder Press', sr: '3 × 10' },
      { id: 'fri-5', name: 'Plank',                   sr: '3 × 30 sec' },
    ] },
  { day: 'Sat', name: 'Arms & Shoulders', focus: 'Shoulders · Arms · Core', cardio: '45 min walk, cycling, tennis, or boxing',
    exercises: [
      { id: 'sat-1', name: 'Dumbbell Shoulder Press', sr: '3 × 10' },
      { id: 'sat-2', name: 'Lateral Raise',           sr: '3 × 15' },
      { id: 'sat-3', name: 'Front Raise',             sr: '3 × 12' },
      { id: 'sat-4', name: 'Dumbbell Curl',           sr: '3 × 12' },
      { id: 'sat-5', name: 'Hammer Curl',             sr: '3 × 12' },
      { id: 'sat-6', name: 'Tricep Extension',        sr: '3 × 12' },
      { id: 'sat-7', name: 'Russian Twist',           sr: '3 × 20' },
    ] },
]

export const SCHEDULED_DAYS = PLAN.filter(p => !p.rest).length // 6
export const workoutLabelForDay = (dow) => { const p = PLAN[dow]; return p && !p.rest ? p.name : null }

// ------- workout completion helpers (local-date keys) ---------------------
export function thisWeekDates() {
  const today = new Date()
  const dowMon = (today.getDay() + 6) % 7 // 0=Mon
  const monday = new Date(today); monday.setDate(today.getDate() - dowMon)
  const tdy = localKey(today)
  const out = []
  for (let i = 0; i < 7; i++) {
    const dt = new Date(monday); dt.setDate(monday.getDate() + i)
    const key = localKey(dt)
    out.push({ idx: dt.getDay(), date: dt.getDate(), dateKey: key, isToday: key === tdy })
  }
  return out
}

export function dayCompletion(dateKey) {
  const dow = new Date(dateKey + 'T00:00:00').getDay()
  const plan = PLAN[dow]
  const log = lsGet(`workout:${dateKey}`, {})
  const total = plan ? plan.exercises.length : 0
  const done = plan ? plan.exercises.filter(e => log[e.id]).length : 0
  return { done, total, complete: total > 0 && done === total, rest: !!(plan && plan.rest) }
}

export function workoutDoneForDate(dateKey) {
  const dow = new Date(dateKey + 'T00:00:00').getDay()
  const plan = PLAN[dow]
  if (!plan || plan.rest) return false
  return dayCompletion(dateKey).complete
}

export function cumulativeStats() {
  let workouts = 0, exercises = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k || !k.startsWith('thq:workout:')) continue
      const dateKey = k.slice('thq:workout:'.length)
      const log = JSON.parse(localStorage.getItem(k) || '{}')
      exercises += Object.values(log).filter(Boolean).length
      if (workoutDoneForDate(dateKey)) workouts++
    }
  } catch {}
  return { workouts, exercises }
}

// ------- habit "strong day" + streak --------------------------------------
export function strongDay(d) { return !!(d && d.protein && d.steps) }

export function computeStreak() {
  let s = 0
  const cur = new Date()
  const tk = todayKey()
  for (let i = 0; i < 400; i++) {
    const key = cur.toISOString().slice(0, 10)
    const d = lsGet(`day:${key}`, {})
    if (strongDay(d)) { s++; cur.setDate(cur.getDate() - 1) }
    else if (key === tk) { cur.setDate(cur.getDate() - 1) } // today not done yet — don't break
    else break
  }
  return s
}

// ------- "has the owner ever tracked anything?" ---------------------------
// Used so the hero pulse only appears on a browser that has real data.
export function hasFitnessData() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      if (k.startsWith('thq:workout:') || k.startsWith('thq:day:')) {
        const v = JSON.parse(localStorage.getItem(k) || '{}')
        if (v && Object.values(v).some(Boolean)) return true
      }
      if (k === 'thq:weights') {
        const v = JSON.parse(localStorage.getItem(k) || '[]')
        if (Array.isArray(v) && v.length) return true
      }
    }
  } catch {}
  return false
}

// ------- one-call summary for the hero pulse widget -----------------------
export function weekSummary() {
  const week = thisWeekDates().map(d => {
    const plan = PLAN[d.idx]
    return { ...d, rest: !!(plan && plan.rest), done: workoutDoneForDate(d.dateKey) }
  })
  const wkWorkouts = week.filter(d => d.done).length
  const wkPct = Math.round((wkWorkouts / SCHEDULED_DAYS) * 100)
  const cum = cumulativeStats()
  return {
    week,
    wkWorkouts,
    scheduled: SCHEDULED_DAYS,
    wkPct,
    streak: computeStreak(),
    allTimeWorkouts: cum.workouts,
    allTimeExercises: cum.exercises,
  }
}
