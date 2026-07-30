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

// YouTube form-demo link for an exercise (verified public videos).
export const ytUrl = (id) => `https://www.youtube.com/watch?v=${id}`

// ------- Upper/Lower split — 4 lifting days (Mon/Tue/Thu/Fri; each muscle 2×/week)
// plus 2 walk + mobility days (Wed/Sat) and full rest Sunday. Chosen so it recovers
// well in a calorie deficit and leaves room for daily cardio while cutting. Indexed
// by getDay() 0=Sun..6=Sat. Home gym: adjustable dumbbells + a flat/incline bench,
// so a few gym staples (lat pulldown, leg press, cables) use the closest dumbbell
// movement. Every exercise carries a verified `yt` form-demo video id (oEmbed 200).
export const PLAN = [
  { day: 'Sun', name: 'Complete Rest', focus: 'Full recovery — muscle grows now', rest: true, equip: 'Nothing', cardio: 'Optional gentle walk or stretch',
    exercises: [
      { id: 'sun-walk',    name: 'Easy Walk (optional)', sr: '15–20 min', yt: 'vdsaHSr1H_E' },
      { id: 'sun-stretch', name: 'Full-Body Stretch',    sr: 'Optional',  yt: 'T_l0AyZywjU' },
    ] },
  { day: 'Mon', name: 'Upper A · Strength', focus: 'Chest · Back · Shoulders · Arms', equip: 'Dumbbells + bench', cardio: '20–30 min walk',
    exercises: [
      { id: 'mon-1', name: 'Flat Dumbbell Bench Press',    sr: '4 × 6–8',   yt: 'QsYre__-aro' },
      { id: 'mon-2', name: 'One-Arm Dumbbell Row',         sr: '4 × 6–8',   yt: 'gfUg6qWohTk' },
      { id: 'mon-3', name: 'Incline Dumbbell Press',       sr: '3 × 8–10',  yt: 'IP4oeKh1Sd4' },
      { id: 'mon-4', name: 'Chest-Supported Row',          sr: '3 × 8–10',  yt: 'nl2MnK1i504' },
      { id: 'mon-5', name: 'Lateral Raise',                sr: '3 × 12–15', yt: 'WJm9zA2NY8E' },
      { id: 'mon-6', name: 'Overhead Tricep Extension',    sr: '3 × 10–12', yt: '-Vyt2QdsR7E' },
      { id: 'mon-7', name: 'Dumbbell Curl',                sr: '3 × 10–12', yt: 'XE_pHwbst04' },
    ] },
  { day: 'Tue', name: 'Lower A', focus: 'Quads · Hamstrings · Calves · Core', equip: 'Dumbbells + bench', cardio: '20–30 min walk',
    exercises: [
      { id: 'tue-1', name: 'Goblet Squat',           sr: '4 × 8–10',     yt: 'gCESNsDsbqk' },
      { id: 'tue-2', name: 'Romanian Deadlift',      sr: '4 × 8–10',     yt: 'hQgFixeXdZo' },
      { id: 'tue-3', name: 'Bulgarian Split Squat',  sr: '3 × 10 / leg', yt: 'hiLF_pF3EJM' },
      { id: 'tue-4', name: 'Standing Calf Raise',    sr: '4 × 12–15',    yt: 'k8ipHzKeAkQ' },
      { id: 'tue-5', name: 'Dead Bug (core)',        sr: '3 × 12',       yt: 'o4GKiEoYClI' },
    ] },
  { day: 'Wed', name: 'Walk & Mobility', focus: 'Active recovery — no weights', equip: 'Bodyweight', cardio: '45–60 min brisk walk',
    exercises: [
      { id: 'wed-1', name: 'Brisk Walk',           sr: '45–60 min', yt: 'vdsaHSr1H_E' },
      { id: 'wed-2', name: 'Shoulder Mobility',     sr: '5 min',     yt: 'a9rqTzZaI7s' },
      { id: 'wed-3', name: 'Hip Flexor Stretch',    sr: '5 min',     yt: 'DXuStgWuJV8' },
      { id: 'wed-4', name: 'Hamstring Stretch',     sr: '5 min',     yt: 'T_l0AyZywjU' },
    ] },
  { day: 'Thu', name: 'Upper B · Hypertrophy', focus: 'Chest · Back · Delts · Arms', equip: 'Dumbbells + bench', cardio: '20–30 min walk',
    exercises: [
      { id: 'thu-1', name: 'Incline Dumbbell Press',      sr: '3 × 8–10',  yt: 'IP4oeKh1Sd4' },
      { id: 'thu-2', name: 'Chest-Supported Row',         sr: '3 × 8–10',  yt: 'nl2MnK1i504' },
      { id: 'thu-3', name: 'Flat Dumbbell Bench Press',   sr: '3 × 10–12', yt: 'QsYre__-aro' },
      { id: 'thu-4', name: 'One-Arm Dumbbell Row',        sr: '3 × 10–12', yt: 'gfUg6qWohTk' },
      { id: 'thu-5', name: 'Rear Delt Fly',               sr: '3 × 15',    yt: 'buuYPLVXsJg' },
      { id: 'thu-6', name: 'Overhead Tricep Extension',   sr: '3 × 12',    yt: '-Vyt2QdsR7E' },
      { id: 'thu-7', name: 'Hammer Curl',                 sr: '3 × 12',    yt: '8XLxfXROrTo' },
    ] },
  { day: 'Fri', name: 'Lower B', focus: 'Posterior chain · Quads · Calves · Core', equip: 'Dumbbells + bench', cardio: '20–30 min walk',
    exercises: [
      { id: 'fri-1', name: 'Romanian Deadlift',        sr: '3 × 6–8',      yt: 'hQgFixeXdZo' },
      { id: 'fri-2', name: 'Bulgarian Split Squat',    sr: '3 × 10 / leg', yt: 'hiLF_pF3EJM' },
      { id: 'fri-3', name: 'Goblet Squat',             sr: '3 × 12',       yt: 'gCESNsDsbqk' },
      { id: 'fri-4', name: 'Standing Calf Raise',      sr: '4 × 15',       yt: 'k8ipHzKeAkQ' },
      { id: 'fri-5', name: 'Weighted Russian Twist',   sr: '3 × 20',       yt: 'wkD8rjkodUI' },
    ] },
  { day: 'Sat', name: 'Walk + Optional Arms', focus: 'Cardio · optional shoulders & arms', equip: 'Dumbbells (optional)', cardio: '45–60 min walk',
    exercises: [
      { id: 'sat-1', name: 'Brisk Walk',                       sr: '45–60 min', yt: 'vdsaHSr1H_E' },
      { id: 'sat-2', name: 'Lateral Raise (optional)',         sr: '3 × 15',    yt: 'WJm9zA2NY8E' },
      { id: 'sat-3', name: 'Dumbbell Curl (optional)',         sr: '3 × 12',    yt: 'XE_pHwbst04' },
      { id: 'sat-4', name: 'Overhead Tricep Ext (optional)',   sr: '3 × 12',    yt: '-Vyt2QdsR7E' },
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
      if (k.startsWith('thq:clockin:')) return true
      if (k.startsWith('thq:workout:') || k.startsWith('thq:day:') || k.startsWith('thq:meals:') || k.startsWith('thq:skin:')) {
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
    return { ...d, rest: !!(plan && plan.rest), done: workoutDoneForDate(d.dateKey), clockedIn: isClockedIn(d.dateKey) }
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
    clockStreak: clockInStreak(),
    clockedInToday: isClockedIn(),
    lockin: lockin(),
  }
}

// ============================================================
// 6-MONTH LOCK-IN  (Aug 1 2026 → Jan 31 2027 · 184 days)
// The whole HQ is framed around this window. Before it starts we
// show a countdown ("post US trip"); after, a victory state.
// ============================================================
export const LOCKIN = {
  start: '2026-08-01',
  end: '2027-01-31',
  label: '6-Month Lock-In',
  headline: 'Fat down. Skin glowing. The strongest, sharpest version of me.',
}

const dateOnly = (s) => new Date(s + 'T00:00:00')

export function lockin() {
  const start = dateOnly(LOCKIN.start)
  const end = dateOnly(LOCKIN.end)
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const total = Math.round((end - start) / 86400000) + 1 // inclusive → 184
  let status = 'active'
  if (now < start) status = 'upcoming'
  else if (now > end) status = 'done'
  const rawDay = Math.floor((now - start) / 86400000) + 1
  const day = Math.min(Math.max(rawDay, 0), total)
  const remaining = Math.max(0, total - day)
  const daysUntilStart = Math.max(0, Math.ceil((start - now) / 86400000))
  const weeksTotal = Math.ceil(total / 7)
  const weekNo = status === 'upcoming' ? 0 : Math.min(Math.ceil(day / 7), weeksTotal)
  const pct = status === 'upcoming' ? 0 : Math.max(0, Math.min(100, Math.round((day / total) * 100)))
  return { status, day, total, remaining, pct, daysUntilStart, weekNo, weeksTotal, start: LOCKIN.start, end: LOCKIN.end }
}

// ------- daily "clock-in" (attendance). Storage: thq:clockin:<localdate> -----
export function isClockedIn(dateKey = todayKey()) {
  return !!lsGet(`clockin:${dateKey}`, null)
}
export function clockIn(dateKey = todayKey()) {
  if (!isClockedIn(dateKey)) lsSet(`clockin:${dateKey}`, { at: new Date().toISOString() })
  return true
}
export function clockInAt(dateKey = todayKey()) {
  const v = lsGet(`clockin:${dateKey}`, null)
  return v && v.at ? v.at : null
}
export function allClockInDates() {
  const out = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('thq:clockin:')) out.push(k.slice('thq:clockin:'.length))
    }
  } catch {}
  return out.sort()
}
export function totalClockIns() { return allClockInDates().length }

export function clockInStreak() {
  let s = 0
  const cur = new Date()
  const tk = todayKey()
  for (let i = 0; i < 400; i++) {
    const key = localKey(cur)
    if (isClockedIn(key)) { s++; cur.setDate(cur.getDate() - 1) }
    else if (key === tk) { cur.setDate(cur.getDate() - 1) } // today not done yet — don't break
    else break
  }
  return s
}

export function longestClockInStreak() {
  const days = allClockInDates()
  if (!days.length) return 0
  let best = 1, run = 1
  for (let i = 1; i < days.length; i++) {
    const diff = Math.round((dateOnly(days[i]) - dateOnly(days[i - 1])) / 86400000)
    if (diff === 1) { run++; best = Math.max(best, run) }
    else if (diff !== 0) { run = 1 }
  }
  return best
}

// ------- one day's full adherence, used by the monitor dashboard -----------
export function daySummary(dateKey) {
  const dow = dateOnly(dateKey).getDay()
  const plan = PLAN[dow]
  const rest = !!(plan && plan.rest)
  const meals = lsGet(`meals:${dateKey}`, { m1: false, m2: false })
  const skin = lsGet(`skin:${dateKey}`, { am: false, pm: false })
  const day = lsGet(`day:${dateKey}`, {})
  return {
    clockedIn: isClockedIn(dateKey),
    rest,
    workout: rest ? true : workoutDoneForDate(dateKey),
    meals: (meals.m1 ? 1 : 0) + (meals.m2 ? 1 : 0),
    skin: (skin.am ? 1 : 0) + (skin.pm ? 1 : 0),
    steps: !!day.steps, water: !!day.water, sleep: !!day.sleep,
  }
}

// Adherence for the current Mon–Sun week, as 0–100 rings for the dashboard.
export function weekAdherence() {
  const week = thisWeekDates()
  const past = week.filter(d => new Date(d.dateKey + 'T23:59:59') <= new Date() || d.isToday)
  const n = past.length || 1
  let workout = 0, workoutDays = 0, diet = 0, skin = 0, steps = 0, clocked = 0
  week.forEach(d => {
    const s = daySummary(d.dateKey)
    if (!s.rest) { workoutDays++; if (s.workout) workout++ }
    diet += s.meals / 2
    skin += s.skin / 2
    if (s.steps) steps++
    if (s.clockedIn) clocked++
  })
  const pct = (x, d) => Math.round((x / (d || 1)) * 100)
  return {
    workout: pct(workout, workoutDays || 1),
    diet: pct(diet, n),
    skin: pct(skin, n),
    steps: pct(steps, n),
    clocked: pct(clocked, n),
  }
}

// All-time totals for the monitor.
export function lifetimeTotals() {
  let meals = 0, skin = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      if (k.startsWith('thq:meals:')) {
        const v = JSON.parse(localStorage.getItem(k) || '{}')
        meals += (v.m1 ? 1 : 0) + (v.m2 ? 1 : 0)
      } else if (k.startsWith('thq:skin:')) {
        const v = JSON.parse(localStorage.getItem(k) || '{}')
        skin += (v.am ? 1 : 0) + (v.pm ? 1 : 0)
      }
    }
  } catch {}
  const cum = cumulativeStats()
  return {
    clockIns: totalClockIns(),
    workouts: cum.workouts,
    exercises: cum.exercises,
    meals,
    skin,
    longest: longestClockInStreak(),
  }
}
