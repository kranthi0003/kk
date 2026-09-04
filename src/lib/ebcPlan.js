/* ------------------------------------------------------------------ *
 * Everest Base Camp — the training plan, as data.
 *
 * Two tables, transcribed verbatim from the source plan: a six-week
 * conditioning block, and the strength session those "Strength Training"
 * days refer to.
 *
 * The distances are stored as numbers alongside the text rather than
 * parsed out of it. "7 km walk + 3 km run + 5 km walk" is one day and
 * fifteen kilometres, and a regex over that string would be one typo
 * away from silently reporting the wrong total for a year.
 *
 * On the six weeks versus the twelve months.
 *
 * This block is a peaking plan — it ends at a 14 km run, which is what
 * you want in your legs shortly before you fly, not eleven months out.
 * Run once from September 2026 it finishes in October and then nothing
 * happens until the trek. So the page treats the six weeks as a
 * repeatable cycle and counts them, which is the honest reading: about
 * nine of them fit between the start and the trek, and the one that
 * matters is the last.
 * ------------------------------------------------------------------ */

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// kind drives the colour and the icon; km is what gets totalled.
const S = { t: 'Strength Training', km: 0, kind: 'strength' }
const R = { t: 'Rest', km: 0, kind: 'rest' }
const X = { t: 'Cross Training', km: 0, kind: 'cross' }

export const WEEKS = [
  {
    n: 1,
    days: [
      { t: '6 km jog', km: 6, kind: 'run' },
      S,
      { t: '7 km walk + 3 km run + 5 km walk', km: 15, kind: 'mixed' },
      S,
      R,
      { t: '9 km jog/run', km: 9, kind: 'run' },
      X,
    ],
  },
  {
    n: 2,
    days: [
      { t: '5 km walk + 5 km run + 6 km walk', km: 16, kind: 'mixed' },
      R,
      { t: '6 km jog', km: 6, kind: 'run' },
      S,
      R,
      S,
      X,
    ],
  },
  {
    n: 3,
    days: [
      { t: '7 km walk + 5 km jog + 7 km walk + 1 km hard run', km: 20, kind: 'mixed' },
      S,
      {
        t: '1 km walk + 2 min hard run + 5 km walk + 2 min hard run + 5 km walk + 2 min hard run + 4 km walk + 3 km jog',
        km: 18,
        kind: 'intervals',
        note: 'Plus three 2-minute hard efforts — the intervals are the point, not the distance.',
      },
      S,
      R,
      { t: '8 km run', km: 8, kind: 'run' },
      X,
    ],
  },
  {
    n: 4,
    days: [
      { t: '7 km run', km: 7, kind: 'run' },
      S,
      { t: '8 km run', km: 8, kind: 'run' },
      S,
      R,
      { t: '10 km run', km: 10, kind: 'run' },
      X,
    ],
  },
  {
    n: 5,
    days: [
      { t: '10 km run', km: 10, kind: 'run' },
      S,
      { t: '11 km run', km: 11, kind: 'run' },
      S,
      R,
      { t: '13 km run', km: 13, kind: 'run' },
      X,
    ],
  },
  {
    n: 6,
    days: [
      { t: '13 km run', km: 13, kind: 'run' },
      S,
      { t: '13 km run', km: 13, kind: 'run' },
      S,
      R,
      { t: '14 km run', km: 14, kind: 'run' },
      X,
    ],
  },
]

export const STRENGTH = [
  { name: 'Full Squats', sets: '4 × 20', total: '80 reps' },
  { name: 'Walking Lunges', sets: '5 × 20', total: '100 reps' },
  { name: 'Hip Hinge', sets: '4 × 2 min', total: '8 min' },
  { name: 'Mountain Climber', sets: '2 × 3 min', total: '6 min' },
  { name: 'Standard Plank', sets: '4 × 1.5 min', total: '6 min' },
  { name: 'Elbow Plank', sets: '2 × 1.5 min', total: '3 min' },
  { name: 'Superman', sets: '4 × 1 min', total: '4 min' },
  { name: 'Standard Push Ups', sets: '3 × 20', total: '60 reps' },
]

export const KIND = {
  run:       { label: 'Run',      c: '#E8734A' },
  mixed:     { label: 'Walk/Run', c: '#E8AC5F' },
  intervals: { label: 'Intervals', c: '#E85F8F' },
  strength:  { label: 'Strength', c: '#7FB3E8' },
  cross:     { label: 'Cross',    c: '#8FD9C4' },
  rest:      { label: 'Rest',     c: '#6B7280' },
}

export const CYCLE_DAYS = WEEKS.length * 7          // 42
export const CYCLE_KM = WEEKS.reduce((s, w) => s + w.days.reduce((a, d) => a + d.km, 0), 0)

// Flat list, so day N of the programme is simply PLAN[N % 42].
export const PLAN = WEEKS.flatMap((w) => w.days.map((d, i) => ({ ...d, week: w.n, dow: i })))

// ---- dates ---------------------------------------------------------
// Everything is done in local calendar days rather than timestamps: a
// workout belongs to a date, not to an instant, and a UTC-based diff
// silently shifts the whole plan by one day for anyone east of London.

export const iso = (d) => {
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const fromIso = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const daysBetween = (aIso, bIso) =>
  Math.round((fromIso(bIso) - fromIso(aIso)) / 86400000)

export const addDays = (isoStr, n) => {
  const d = fromIso(isoStr)
  d.setDate(d.getDate() + n)
  return iso(d)
}

// The plan is written as Monday-to-Sunday weeks, so day zero has to be a
// Monday. Start it on a Saturday and every column is mislabelled for a
// year: the page would show "Mon — 6 km jog" on a Saturday and put the
// two rest days midweek.
export const mondayOnOrAfter = (isoStr) => {
  const d = fromIso(isoStr)
  const shift = (8 - (d.getDay() || 7)) % 7   // 0 if already Monday
  d.setDate(d.getDate() + shift)
  return iso(d)
}

export const DEFAULTS = {
  // The first Monday from when this was set up. 5 September 2026 — the
  // day after — is a Saturday, so the block opens on the 7th.
  start: '2026-09-07',
  // Post-monsoon is the season people actually walk this in; late
  // September is the front of that window. Editable on the page — the
  // moment the flights are booked this should be the real date.
  trek: '2027-09-20',
}
