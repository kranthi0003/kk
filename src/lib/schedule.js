// ============================================================
// schedule.js — Pure IST schedule resolver
// Given a Date (any TZ), returns the current location + activity
// based on Kranthi's real weekly routine.
// ============================================================

// Location IDs are stable strings used by WorldStage to pick a scene.
export const LOCATIONS = {
  BEDROOM:   'bedroom',
  KITCHEN:   'kitchen',
  WORKSPACE: 'workspace',
  LIVING:    'living',
  TENNIS:    'tennis',
  GYM:       'gym',
  CAFE:      'cafe',
  OUTDOOR:   'outdoor',
}

export const LOCATION_LABELS = {
  bedroom:   'Bedroom',
  kitchen:   'Kitchen',
  workspace: 'Workspace',
  living:    'Living room',
  tennis:    'Tennis court',
  gym:       'Gym',
  cafe:      'Cafe',
  outdoor:   'Outdoor',
}

export const LOCATION_EMOJI = {
  bedroom:   '😴',
  kitchen:   '🍳',
  workspace: '💻',
  living:    '📺',
  tennis:    '🎾',
  gym:       '🏋️',
  cafe:      '☕',
  outdoor:   '🌴',
}

// All windows expressed in minutes since midnight IST.
// Each entry: [startMin, endMin, location, activity]
// endMin = 24*60 means "until midnight". A window crossing midnight
// is split into two entries.
const WEEKDAY = [
  [0,         6 * 60 + 30,  LOCATIONS.BEDROOM,   'Sleeping'],
  [6 * 60 + 30,  7 * 60 + 30,  LOCATIONS.TENNIS,    'Forehand drills'],
  [7 * 60 + 30,  9 * 60,       LOCATIONS.KITCHEN,   'Breakfast'],
  [9 * 60,       18 * 60,      LOCATIONS.WORKSPACE, 'At the desk · coding'],
  [18 * 60,      18 * 60 + 30, LOCATIONS.LIVING,    'Decompressing'],
  [18 * 60 + 30, 20 * 60 + 30, LOCATIONS.GYM,       'Lifting'],
  [20 * 60 + 30, 20 * 60 + 45, LOCATIONS.KITCHEN,   'Getting dinner ready'],
  [20 * 60 + 45, 21 * 60,      LOCATIONS.KITCHEN,   'Dinner'],
  [21 * 60,      22 * 60,      LOCATIONS.LIVING,    'TV · chill'],
  [22 * 60,      24 * 60,      LOCATIONS.BEDROOM,   'Winding down'],
]

const SATURDAY = [
  [0,            9 * 60,       LOCATIONS.BEDROOM,   'Sleeping in'],
  [9 * 60,       11 * 60,      LOCATIONS.TENNIS,    'Saturday match'],
  [11 * 60,      12 * 60,      LOCATIONS.KITCHEN,   'Lunch prep'],
  [12 * 60,      14 * 60,      LOCATIONS.CAFE,      'Brunch'],
  [14 * 60,      23 * 60,      LOCATIONS.OUTDOOR,   'Beach · bike · cricket'],
  [23 * 60,      24 * 60,      LOCATIONS.BEDROOM,   'Wrapping the day'],
]

const SUNDAY = [
  [0,            9 * 60,       LOCATIONS.BEDROOM,   'Sleeping in'],
  [9 * 60,       23 * 60,      LOCATIONS.OUTDOOR,   'Beach · bike · cricket'],
  [23 * 60,      24 * 60,      LOCATIONS.BEDROOM,   'Winding down'],
]

function getSchedule(dayOfWeek) {
  if (dayOfWeek === 0) return SUNDAY
  if (dayOfWeek === 6) return SATURDAY
  return WEEKDAY
}

// Convert any Date to IST date-parts (year/month/day/hour/minute/dow)
export function toIST(date = new Date()) {
  // Use Intl.DateTimeFormat for a robust IST breakdown
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
    weekday: 'short',
  })
  const parts = fmt.formatToParts(date).reduce((acc, p) => {
    acc[p.type] = p.value
    return acc
  }, {})
  const weekdayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    year:   Number(parts.year),
    month:  Number(parts.month),
    day:    Number(parts.day),
    hour:   Number(parts.hour) % 24,
    minute: Number(parts.minute),
    dow:    weekdayMap[parts.weekday],
  }
}

// ============================================================
// resolve(date) -> { location, activity, until }
// `until` is minutes-since-midnight when the current slot ends.
// ============================================================
export function resolve(date = new Date()) {
  const ist = toIST(date)
  const minutes = ist.hour * 60 + ist.minute
  const schedule = getSchedule(ist.dow)
  for (const [start, end, location, activity] of schedule) {
    if (minutes >= start && minutes < end) {
      return { location, activity, until: end, ist }
    }
  }
  // Fallback (shouldn't hit since schedules cover 0..1440)
  return { location: LOCATIONS.BEDROOM, activity: 'Resting', until: 24 * 60, ist }
}

// Format IST time as HH:MM
export function fmtIST(date = new Date()) {
  const ist = toIST(date)
  return `${String(ist.hour).padStart(2, '0')}:${String(ist.minute).padStart(2, '0')}`
}

// Outdoor sub-mode cycles deterministically — beach / bike / cricket
// keyed off the day-of-year so it changes each day.
export function outdoorActivity(date = new Date()) {
  const ist = toIST(date)
  const dayOfYear = Math.floor(
    (Date.UTC(ist.year, ist.month - 1, ist.day) - Date.UTC(ist.year, 0, 1)) / 86400000
  )
  const modes = ['beach', 'bike', 'cricket']
  return modes[dayOfYear % modes.length]
}
