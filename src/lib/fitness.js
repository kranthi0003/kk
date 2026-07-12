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

// ------- 6-day plan (train Mon–Sat, rest Sun). Indexed by getDay() 0=Sun..6=Sat
// Home gym: adjustable dumbbells + a flat/incline bench. Every exercise carries a
// verified `yt` form-demo video id (see /lib link-verification, all oEmbed 200).
export const PLAN = [
  { day: 'Sun', name: 'Recovery', focus: 'Rest day — no weights', rest: true, equip: 'Just your legs', cardio: 'Easy walk 20–30 min',
    exercises: [
      { id: 'sun-walk',    name: 'Brisk Walk',   sr: '20–30 min', yt: 'vdsaHSr1H_E' },
      { id: 'sun-stretch', name: 'Full Stretch', sr: 'Optional',  yt: 'T_l0AyZywjU' },
      { id: 'sun-mob',     name: 'Mobility Flow', sr: 'Optional',  yt: 'a9rqTzZaI7s' },
    ] },
  { day: 'Mon', name: 'Push Day', focus: 'Chest · Shoulders · Triceps', equip: 'Dumbbells + bench', cardio: '30 min walk',
    exercises: [
      { id: 'mon-1', name: 'Flat Dumbbell Bench Press',      sr: '3 × 10',     yt: 'QsYre__-aro' },
      { id: 'mon-2', name: 'Incline Dumbbell Press',         sr: '3 × 10',     yt: 'IP4oeKh1Sd4' },
      { id: 'mon-3', name: 'Seated Dumbbell Shoulder Press', sr: '3 × 10',     yt: 'rO_iEImwHyo' },
      { id: 'mon-4', name: 'Lateral Raise',                  sr: '3 × 15',     yt: 'WJm9zA2NY8E' },
      { id: 'mon-5', name: 'Overhead Tricep Extension',      sr: '3 × 12',     yt: '-Vyt2QdsR7E' },
      { id: 'mon-6', name: 'Plank',                          sr: '3 × 30 sec', yt: '6LqqeBtFn9M' },
    ] },
  { day: 'Tue', name: 'Legs', focus: 'Quads · Hamstrings · Calves', equip: 'Dumbbells + bench', cardio: 'Walk or Tennis',
    exercises: [
      { id: 'tue-1', name: 'Goblet Squat',           sr: '4 × 10',      yt: 'gCESNsDsbqk' },
      { id: 'tue-2', name: 'Romanian Deadlift',      sr: '4 × 10',      yt: 'hQgFixeXdZo' },
      { id: 'tue-3', name: 'Bulgarian Split Squat',  sr: '3 × 10 / leg', yt: 'hiLF_pF3EJM' },
      { id: 'tue-4', name: 'Standing Calf Raise',    sr: '3 × 20',      yt: 'k8ipHzKeAkQ' },
      { id: 'tue-5', name: 'Dead Bug',               sr: '3 × 12',      yt: 'o4GKiEoYClI' },
    ] },
  { day: 'Wed', name: 'Recovery & Core', focus: 'Core · Mobility', equip: 'Bodyweight', cardio: 'Easy Walk',
    exercises: [
      { id: 'wed-1', name: 'Bird Dog',             sr: '3 × 10',     yt: 'QABW99qPiNM' },
      { id: 'wed-2', name: 'Side Plank',           sr: '3 × 20 sec', yt: 'NXr4Fw8q60o' },
      { id: 'wed-3', name: 'Dead Bug',             sr: '3 × 12',     yt: 'o4GKiEoYClI' },
      { id: 'wed-4', name: 'Hip Flexor Stretch',   sr: '5 min',      yt: 'DXuStgWuJV8' },
      { id: 'wed-5', name: 'Hamstring Stretch',    sr: '5 min',      yt: 'T_l0AyZywjU' },
      { id: 'wed-6', name: 'Shoulder Mobility',    sr: '5 min',      yt: 'a9rqTzZaI7s' },
    ] },
  { day: 'Thu', name: 'Pull Day', focus: 'Back · Biceps', equip: 'Dumbbells + bench', cardio: '30 min walk',
    exercises: [
      { id: 'thu-1', name: 'One-Arm Dumbbell Row',  sr: '4 × 10', yt: 'gfUg6qWohTk' },
      { id: 'thu-2', name: 'Chest Supported Row',   sr: '3 × 12', yt: 'nl2MnK1i504' },
      { id: 'thu-3', name: 'Rear Delt Fly',         sr: '3 × 15', yt: 'buuYPLVXsJg' },
      { id: 'thu-4', name: 'Dumbbell Curl',         sr: '3 × 10', yt: 'XE_pHwbst04' },
      { id: 'thu-5', name: 'Hammer Curl',           sr: '3 × 10', yt: '8XLxfXROrTo' },
    ] },
  { day: 'Fri', name: 'Full Body', focus: 'Total body', equip: 'Dumbbells + bench', cardio: 'Walk or Tennis',
    exercises: [
      { id: 'fri-1', name: 'Dumbbell Bench Press',    sr: '3 × 10',     yt: 'QsYre__-aro' },
      { id: 'fri-2', name: 'Dumbbell Row',            sr: '3 × 10',     yt: 'gfUg6qWohTk' },
      { id: 'fri-3', name: 'Goblet Squat',            sr: '3 × 10',     yt: 'gCESNsDsbqk' },
      { id: 'fri-4', name: 'Dumbbell Shoulder Press', sr: '3 × 10',     yt: 'rO_iEImwHyo' },
      { id: 'fri-5', name: 'Plank',                   sr: '3 × 30 sec', yt: '6LqqeBtFn9M' },
    ] },
  { day: 'Sat', name: 'Arms & Shoulders', focus: 'Shoulders · Arms · Core', equip: 'Dumbbells', cardio: '45 min walk, cycling, tennis, or boxing',
    exercises: [
      { id: 'sat-1', name: 'Dumbbell Shoulder Press', sr: '3 × 10', yt: 'rO_iEImwHyo' },
      { id: 'sat-2', name: 'Lateral Raise',           sr: '3 × 15', yt: 'WJm9zA2NY8E' },
      { id: 'sat-3', name: 'Front Raise',             sr: '3 × 12', yt: 'CH9JzDStL3U' },
      { id: 'sat-4', name: 'Dumbbell Curl',           sr: '3 × 12', yt: 'XE_pHwbst04' },
      { id: 'sat-5', name: 'Hammer Curl',             sr: '3 × 12', yt: '8XLxfXROrTo' },
      { id: 'sat-6', name: 'Tricep Extension',        sr: '3 × 12', yt: '-Vyt2QdsR7E' },
      { id: 'sat-7', name: 'Russian Twist',           sr: '3 × 20', yt: 'wkD8rjkodUI' },
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
