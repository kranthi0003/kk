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

// ============================================================
// THE 8-WEEK BLOCK  (Mon 24 Aug 2026 → Sun 18 Oct 2026)
// A beginner/restart program that sits inside the 6-month lock-in and
// runs up to the October appearance. Four lifting days (Mon/Tue/Thu/Fri),
// a Wednesday mobility day, Saturday as the real cardio day, Sunday off.
// Everything needs only adjustable dumbbells, a bench and the treadmill.
// Sets/reps/rest below are the *week 3+* prescription — weeks 1–2 drop to
// 2 sets on most lifts (see PROGRAM.phases). Every exercise carries a
// form-demo video id verified against the YouTube oEmbed endpoint (200).
// ============================================================
export const PROGRAM = {
  start: '2026-08-24',
  end: '2026-10-18',
  weeks: 8,
  label: '8-Week Block',
  goal: 'Lose fat while building muscle · wider shoulders, stronger legs, better posture, real cardio base.',
  target: 'October',
  // The block's actual outcome target — strength first, scale second.
  weightGoal: { from: 74.5, to: [70, 72], fromLabel: '74–75 kg', toLabel: '70–72 kg',
    note: 'Finish noticeably stronger and more muscular — not just lighter. Chasing the scale down fast costs you the muscle.' },
  // Rank order that actually decides the result. Cardio is last on purpose.
  priorities: [
    'Nutrition — the calorie deficit',
    'Strength training consistency',
    '8–10K daily movement',
    'Sleep & recovery',
    'Cardio fitness',
  ],
  phases: [
    { id: 'foundation', name: 'Foundation', weeks: [1, 2], aim: 'Learn the movements',
      sets: '2 sets on most lifts', rpe: 'RPE 6–7', steps: '6–8K steps', cardio: '2–3 treadmill sessions',
      note: 'Soreness is normal and expected. No ego lifting — this fortnight is about groove, not load.' },
    { id: 'build', name: 'Build', weeks: [3, 4], aim: 'Add volume',
      sets: '3 sets on the main lifts', rpe: 'RPE 7–8', steps: '8–10K steps', cardio: '3 treadmill sessions',
      note: 'Move to full volume and start climbing inside each rep range.' },
    { id: 'overload', name: 'Progressive overload', weeks: [5, 6], aim: 'Add load',
      sets: '3 sets', rpe: 'RPE 7–8', steps: '10K steps', cardio: '30–45 min Saturday',
      note: 'Now push: more reps, then slightly heavier dumbbells. Should feel clearly stronger than week 1.' },
    { id: 'consolidate', name: 'Consolidate', weeks: [7, 8], aim: 'Hold the standard',
      sets: '3 sets', rpe: 'RPE 7–8', steps: '10K steps', cardio: '2–3 sessions + 45–50 min Saturday',
      note: 'Maintain 4 lifts + 10K steps. Do not suddenly double the running volume — sharpen form instead.' },
  ],
  // Saturday treadmill session scales with the block.
  satCardio: [
    { weeks: [1, 2], mins: '30 min',    detail: '5 min easy · 20 min brisk walk / easy jog · 5 min cooldown' },
    { weeks: [3, 4], mins: '35–40 min', detail: 'Same shape, longer middle block.' },
    { weeks: [5, 6], mins: '40–45 min', detail: 'Intervals are fine: 5 min walk → 5 min jog → 2 min walk → repeat.' },
    { weeks: [7, 8], mins: '45–50 min', detail: 'You never have to run continuously. Finish strong, not wrecked.' },
  ],
  // Daily step target ramps rather than starting at 10K on day one.
  stepRamp: [
    { week: 1, target: '6–7K' },
    { week: 2, target: '7–8K' },
    { week: 3, target: '8–9K' },
    { week: 4, target: '9–10K', andAfter: true },
  ],
}

// Talk test beats chasing a number on the belt — your easy pace is yours.
export const INTENSITY = [
  { id: 'easy',     name: 'Easy / Zone 2', test: 'You can talk in complete sentences, but you are clearly working.', use: 'Most of your treadmill work' },
  { id: 'moderate', name: 'Moderate',      test: 'You can still talk, but you are breathing harder.',                use: 'The middle of Saturday' },
  { id: 'hard',     name: 'Hard',          test: 'You can only get a few words out.',                                use: 'Rarely — short bursts only' },
]

// Double progression: earn the top of the rep range, then add weight.
export const PROGRESSION = {
  method: 'Double progression',
  rule: 'Pick a weight you can hit the bottom of the range with, in good form. Add reps until you own the top of the range, then add weight.',
  example: [
    ['Week 1', '10 / 10 / 9', 'Right where you should start'],
    ['Later',  '10 / 10 / 10', 'Keep climbing'],
    ['Then',   '12 / 12 / 12', 'You own the range — go heavier'],
    ['10 → 12 kg', '9 / 8 / 8', 'Expected. Build back toward 12.'],
  ],
  rpe: 'Most sets at RPE 7–8 — you could do another 2–3 good reps. If the plan says 10 and you could do 13, stop at 10. Accumulate quality, then recover.',
}

// Sunday-morning check-in, plus a deeper one every 4 weeks.
export const CHECKIN = {
  weekly: ['Weight', 'Waist at navel', 'Average daily steps', 'Training sessions completed'],
  monthly: ['Front / side / back photo', 'Waist', 'Chest', 'Arms', 'Thighs', 'Body-fat estimate (consistent method only)'],
  note: 'Your waist trend, photos and strength tell you far more than a smart-scale body-fat percentage.',
}

// ------- The week. Indexed by getDay() 0=Sun..6=Sat.
export const PLAN = [
  { day: 'Sun', name: 'Rest', focus: 'Recovery is part of the program', rest: true, equip: 'Nothing', cardio: 'Easy walking — recovery pace',
    exercises: [
      { id: 'sun-walk',    name: 'Easy Walk (optional)', sr: 'As you feel', yt: 'vdsaHSr1H_E' },
      { id: 'sun-stretch', name: 'Full-Body Stretch',    sr: 'Optional',    yt: 'T_l0AyZywjU' },
    ] },
  { day: 'Mon', name: 'Upper A', focus: 'Chest · Back · Shoulders · Arms', equip: 'Dumbbells + bench', cardio: '15–20 min easy treadmill after lifting',
    exercises: [
      { id: 'mon-1', name: 'Dumbbell Bench Press',            sr: '3 × 8–12',         restTime: '90–120 sec', cue: 'Feet planted, lower under control, press without slamming the elbows straight.', yt: 'QsYre__-aro' },
      { id: 'mon-2', name: 'One-Arm Dumbbell Row',            sr: '3 × 10–12 / side', restTime: '60–90 sec',  cue: 'Hand and knee on the bench. Pull toward your hip, not your shoulder.',            yt: 'gfUg6qWohTk' },
      { id: 'mon-3', name: 'Seated Dumbbell Shoulder Press',  sr: '3 × 8–12',         restTime: '90 sec',     cue: 'Core tight. Do not arch the lower back to finish the rep.',                       yt: 'E9ShwbwZ1zw' },
      { id: 'mon-4', name: 'Dumbbell Lateral Raise',          sr: '3 × 12–15',        restTime: '45–60 sec',  cue: 'Light. No swinging. This is what builds shoulder width.',                         yt: 'WJm9zA2NY8E' },
      { id: 'mon-5', name: 'Dumbbell Biceps Curl',            sr: '2 × 10–15',        restTime: '60 sec',     cue: 'Elbows stay put.',                                                                yt: 'XE_pHwbst04' },
      { id: 'mon-6', name: 'Overhead Triceps Extension',      sr: '2 × 10–15',        restTime: '60 sec',     cue: 'One dumbbell in both hands is fine.',                                             yt: '-Vyt2QdsR7E' },
    ] },
  { day: 'Tue', name: 'Lower A', focus: 'Quads · Hamstrings · Glutes · Core', equip: 'Dumbbells + bench', cardio: 'Walking only — no extra cardio today',
    exercises: [
      { id: 'tue-1', name: 'Goblet Squat',              sr: '3 × 8–12',       restTime: '90 sec',     cue: 'Dumbbell vertical against the chest. Sit down and slightly back, knees tracking the toes.', yt: 'gCESNsDsbqk' },
      { id: 'tue-2', name: 'Romanian Deadlift',         sr: '3 × 8–12',       restTime: '90–120 sec', cue: 'Your most important lift. Hips back → stretch the hamstrings → drive the hips forward. Not a squat.', yt: 'hQgFixeXdZo' },
      { id: 'tue-3', name: 'Bulgarian Split Squat',     sr: '2 × 8–10 / leg', restTime: '90 sec',     cue: 'Rear foot on the bench. Start light — this one is brutal when you are new.',              yt: 'hiLF_pF3EJM' },
      { id: 'tue-4', name: 'Dumbbell Hip Thrust',       sr: '3 × 10–15',      restTime: '60–90 sec',  cue: 'Upper back on the bench, dumbbell across the hips, squeeze at the top.',                   yt: 'QqtLsnNthbA' },
      { id: 'tue-5', name: 'Standing Calf Raise',       sr: '3 × 12–20',      restTime: '45–60 sec',  cue: 'Pause at the top. Do not bounce.',                                                          yt: 'k8ipHzKeAkQ' },
      { id: 'tue-6', name: 'Plank',                     sr: '3 × 30–60 sec',  restTime: '30–60 sec',  cue: 'Quality over duration — 60 seconds can wait.',                                             yt: '6LqqeBtFn9M' },
    ] },
  { day: 'Wed', name: 'Recovery', focus: 'Movement, not punishment — no weights', equip: 'Bodyweight', cardio: 'Easy walking, plus the mobility work below',
    exercises: [
      { id: 'wed-1', name: 'Cat-Cow',              sr: '× 8',            yt: 'LIVJZZyZ2qM' },
      { id: 'wed-2', name: 'Thoracic Rotation',    sr: '× 8 / side',     yt: 'QWwiOHexU8I' },
      { id: 'wed-3', name: 'Hip Flexor Stretch',   sr: '30 sec / side',  yt: 'DXuStgWuJV8' },
      { id: 'wed-4', name: 'Hamstring Stretch',    sr: '30 sec / side',  yt: 'T_l0AyZywjU' },
      { id: 'wed-5', name: 'Calf Stretch',         sr: '30 sec / side',  yt: 'mafo7o7OnFo' },
      { id: 'wed-6', name: 'Chest Doorway Stretch', sr: '30 sec',        yt: 'O8rJw_TmC1Y' },
      { id: 'wed-7', name: 'Shoulder Circles',     sr: '× 10',           yt: 'HMxqtrsNz60' },
    ] },
  { day: 'Thu', name: 'Upper B', focus: 'Upper chest · Back · Delts · Arms', equip: 'Dumbbells + bench', cardio: '15–20 min easy treadmill after lifting',
    exercises: [
      { id: 'thu-1', name: 'Incline Dumbbell Bench Press', sr: '3 × 8–12',  restTime: '90–120 sec', cue: 'Bench at 20–30°. Do not make it steep — this is for the upper chest.', yt: 'IP4oeKh1Sd4' },
      { id: 'thu-2', name: 'Chest-Supported Row',          sr: '3 × 8–12',  restTime: '60–90 sec',  cue: 'Low incline, chest down. Stops you cheating and spares the lower back.', yt: 'nl2MnK1i504' },
      { id: 'thu-3', name: 'Arnold Press',                 sr: '3 × 8–12',  restTime: '90 sec',     cue: 'Controlled rotation. Do not chase weight here.',                        yt: 'AjB-UXErljM' },
      { id: 'thu-4', name: 'Rear-Delt Fly',                sr: '3 × 12–15', restTime: '45–60 sec',  cue: 'Light dumbbells. Rear delts and upper back — this is your posture work.', yt: 'buuYPLVXsJg' },
      { id: 'thu-5', name: 'Hammer Curl',                  sr: '2 × 10–15', restTime: '60 sec',     cue: 'Neutral grip.',                                                          yt: '8XLxfXROrTo' },
      { id: 'thu-6', name: 'Dumbbell Triceps Extension',   sr: '2 × 10–15', restTime: '60 sec',     cue: 'Controlled reps.',                                                       yt: '-Vyt2QdsR7E' },
    ] },
  { day: 'Fri', name: 'Lower B', focus: 'Quads · Posterior chain · Calves · Core', equip: 'Dumbbells + bench', cardio: 'Walking only — no extra cardio today',
    exercises: [
      { id: 'fri-1', name: 'Dumbbell Squat',      sr: '3 × 8–12',       restTime: '90–120 sec', cue: 'Two dumbbells at your sides once goblet squats feel easy.',            yt: 'OTyb4YUDYYY' },
      { id: 'fri-2', name: 'Romanian Deadlift',   sr: '3 × 8–12',       restTime: '90–120 sec', cue: 'Same as Tuesday. You do not need to change exercises constantly.',     yt: 'hQgFixeXdZo' },
      { id: 'fri-3', name: 'Reverse Lunge',       sr: '3 × 8–10 / leg', restTime: '90 sec',     cue: 'Stepping back is far easier to control than stepping forward.',       yt: 'J9MpoAQCjos' },
      { id: 'fri-4', name: 'Dumbbell Step-Up',    sr: '2 × 8–12 / leg', restTime: '60–90 sec',  cue: 'Stable bench. Bodyweight first if you are unsure of the platform.',   yt: 'PzDbmqL6qo8' },
      { id: 'fri-5', name: 'Calf Raise',          sr: '3 × 15–20',      restTime: '45–60 sec',  cue: 'Pause at the top.',                                                    yt: 'k8ipHzKeAkQ' },
      { id: 'fri-6', name: 'Dead Bug',            sr: '3 × 8–12 / side', restTime: '30–60 sec', cue: 'Slow. Do not let the lower back arch off the floor.',                  yt: 'o4GKiEoYClI' },
    ] },
  { day: 'Sat', name: 'Cardio + Core', focus: 'Your main cardiovascular day', equip: 'Treadmill + mat', cardio: '30–50 min treadmill — scales with the block',
    exercises: [
      { id: 'sat-1', name: 'Treadmill Session',      sr: 'See the block', restTime: '—',         cue: 'Easy → brisk/jog → cooldown. Intervals are completely fine.', yt: 'vdsaHSr1H_E' },
      { id: 'sat-2', name: 'Plank',                  sr: '3 × 30–60 sec', restTime: '30–60 sec', cue: 'Quality over duration.',                                      yt: '6LqqeBtFn9M' },
      { id: 'sat-3', name: 'Dead Bug',               sr: '3 × 8–12 / side', restTime: '30–60 sec', cue: 'Slow and controlled.',                                      yt: 'o4GKiEoYClI' },
      { id: 'sat-4', name: 'Weighted Russian Twist', sr: '3 × 20',        restTime: '30–60 sec', cue: 'Optional. Light weight, rotate from the ribs.',               yt: 'wkD8rjkodUI' },
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

// ------- where you are inside the 8-week block ---------------------------
// Weeks run Mon–Sun from PROGRAM.start, so week 1 day 0 is that Monday.
export function programWeek() {
  const start = dateOnly(PROGRAM.start)
  const now = new Date(); now.setHours(0, 0, 0, 0)
  const total = PROGRAM.weeks
  const days = Math.floor((now - start) / 86400000)
  if (days < 0) {
    return { status: 'upcoming', week: 0, total, pct: 0, phase: PROGRAM.phases[0],
      daysUntil: Math.ceil((start - now) / 86400000), start: PROGRAM.start }
  }
  const week = Math.floor(days / 7) + 1
  if (week > total) {
    return { status: 'done', week: total, total, pct: 100, phase: PROGRAM.phases[PROGRAM.phases.length - 1], start: PROGRAM.start }
  }
  const phase = PROGRAM.phases.find(p => week >= p.weeks[0] && week <= p.weeks[1]) || PROGRAM.phases[0]
  return {
    status: 'active', week, total, phase, start: PROGRAM.start,
    pct: Math.max(0, Math.min(100, Math.round(((days + 1) / (total * 7)) * 100))),
    weeksLeft: total - week,
  }
}

// Saturday treadmill duration for a given block week (falls back to the last tier).
export function satCardioFor(week) {
  return PROGRAM.satCardio.find(s => week >= s.weeks[0] && week <= s.weeks[1])
    || PROGRAM.satCardio[PROGRAM.satCardio.length - 1]
}

// Daily step target for a given block week — ramps, then holds at 9–10K.
export function stepTargetFor(week) {
  const exact = PROGRAM.stepRamp.find(s => s.week === week)
  if (exact) return exact.target
  const last = PROGRAM.stepRamp[PROGRAM.stepRamp.length - 1]
  return week > last.week ? last.target : PROGRAM.stepRamp[0].target
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
