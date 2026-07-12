// ============================================================
// The 6-Month Full-Body Protocol — the master plan behind the HQ.
// Ten problems, one project: fitness, posture, body pigmentation,
// face, hair and discipline — sequenced so the foundation runs from
// Day 1 and treatments layer in one system at a time.
// Evidence-based and safe; medical caveats live next to the actives.
// Streaks tracked in localStorage ("thq:streak:<key>" = { start, best }).
// ============================================================
import { lsGet, lsSet, todayKey } from './fitness'

// Always-on from Day 1 → these alone solve half the list.
export const FOUNDATION = [
  { emoji: '🥩', title: 'Calorie deficit + protein', sub: '~1.6–2 g protein / kg bodyweight, in a modest deficit', hits: 'Fat · muscle · skin · dark neck' },
  { emoji: '🚫', title: 'No added sugar / liquid calories', sub: 'The single biggest lever for belly fat, skin and focus', hits: 'Fat · skin · neck · discipline' },
  { emoji: '😴', title: '7–8 h sleep', sub: 'Where fat loss, muscle repair, skin and hair actually happen', hits: 'Everything' },
  { emoji: '💧', title: '3 L water + 10k steps', sub: 'Plump skin, steadier mood, fewer urges', hits: 'Skin · fat · mind' },
  { emoji: '☀️', title: 'Sunscreen, daily', sub: 'Face + any exposed dark area — the #1 lever for even tone', hits: 'All pigmentation · face' },
  { emoji: '📸', title: 'Sunday check-in', sub: 'Photos + weigh-in + measurements — the only honest scoreboard', hits: 'Accountability' },
]

// Layered treatments — introduced one system at a time.
export const PHASES = [
  {
    month: 'Month 1', tag: 'Foundation & reset',
    focus: 'Build the base. No harsh actives yet — just lock the habits in.',
    tracks: [
      { k: 'Fitness', d: 'Lock the 6-day split + the deficit. Nail your form first (Gym tab).' },
      { k: 'Posture', d: 'The 5-minute routine + video, every morning (Gym tab).' },
      { k: 'Face', d: 'Simplest routine only — gentle cleanser, moisturiser, SPF. No actives yet.' },
      { k: 'Dark spots', d: 'Stop making them worse: no hard scrubbing, no razor on underarms / inner thigh, breathable clothing, moisturise daily.' },
      { k: 'Hair', d: 'Fix the base — protein / iron / vitamin D, a gentle sulfate-free shampoo, 5-min scalp massage.' },
      { k: 'Discipline', d: 'Set the rules: phone out of the bedroom, app timers, a plan for when the urge hits. Start the streaks.' },
    ],
  },
  {
    month: 'Month 2', tag: 'Add the actives',
    focus: 'Layer treatments in — one system at a time, so skin never gets overwhelmed.',
    tracks: [
      { k: 'Face', d: 'Add niacinamide (AM) + a gentle exfoliant 2×/week.' },
      { k: 'Dark spots', d: 'Body acid (lactic / glycolic) on knees & elbows 3×/wk · alpha-arbutin or kojic + niacinamide on neck / underarms / inner thigh · urea or ceramide cream at night.' },
      { k: 'Hair', d: 'Ketoconazole shampoo 2×/wk · derma-roller 0.5 mm weekly · consider minoxidil 5% (see a dermatologist first).' },
      { k: 'Keep', d: 'Everything from Month 1 stays on.' },
    ],
  },
  {
    month: 'Month 3', tag: 'Intensify',
    focus: 'Push the actives and take the first honest look.',
    tracks: [
      { k: 'Face', d: 'Introduce a retinoid 2–3 nights/wk — start low, buffer with moisturiser, SPF the next day.' },
      { k: 'Dark spots', d: 'Pigmentation should be visibly lighter now — keep going, never skip SPF.' },
      { k: 'Checkpoint', d: '12-week photos vs Day 1. Adjust the deficit if fat loss has stalled.' },
    ],
  },
  {
    month: 'Month 4', tag: 'Recomp shift',
    focus: 'Turn toward building once the fat is coming off.',
    tracks: [
      { k: 'Fitness', d: 'Near your fat target? Move the diet toward maintenance / a slight surplus to prioritise muscle.' },
      { k: 'Hair', d: '3–4 month mark: minoxidil regrowth shows — after a normal early shed, so don’t panic.' },
      { k: 'Skin', d: 'Maintenance + spot-treat the most stubborn areas.' },
    ],
  },
  {
    month: 'Month 5', tag: 'Polish',
    focus: 'Everything on autopilot — refine and protect.',
    tracks: [
      { k: 'Fitness', d: 'Push training intensity; dial in the nutrition.' },
      { k: 'Pigmentation', d: 'Maintenance; SPF stays non-negotiable.' },
      { k: 'Discipline', d: '100+ days in — protect the streak like it’s money.' },
    ],
  },
  {
    month: 'Month 6', tag: 'Assess & lock the baseline',
    focus: 'Prove it, then make it sustainable.',
    tracks: [
      { k: 'Everything', d: 'Full before / after vs your Day-1 photos + measurements.' },
      { k: 'Forever', d: 'Convert the protocol into a lighter, sustainable version — same foundation, fewer actives.' },
    ],
  },
]

// Discipline streaks (#10) — framed around focus + energy, never shame.
export const STREAKS = [
  { key: 'nopmo', emoji: '🧠', title: 'No PMO', sub: 'Reclaim the focus, drive and time', why: 'Frees up mental bandwidth and hours for the plan — less fog, more drive.' },
  { key: 'nosugar', emoji: '🍬', title: 'No added sugar', sub: 'The belly-fat, skin and energy lever', why: 'Kills cravings, steadies energy, clears skin, flattens the belly.' },
  { key: 'phone', emoji: '📵', title: 'Phone curfew', sub: 'Screens off by 10pm · no phone in bed', why: 'Better sleep, more time back, a calmer mind and fewer late-night triggers.' },
]

// What to do the moment an urge hits.
export const URGE_PLAN = [
  'Change your state fast — 20 push-ups, a cold splash, or step outside.',
  'Leave the trigger: get out of bed, out of the room, into the light.',
  'Delay 10 minutes. The wave almost always passes on its own.',
  'Swap in something better — text a friend, open the gym plan, go for a walk.',
  'A slip is data, not defeat. Reset the counter and keep the bigger streak in view.',
]

// ------- streak tracking --------------------------------------------------
const SKEY = (k) => `streak:${k}`
export function streakGet(k) { return lsGet(SKEY(k), { start: null, best: 0 }) }
export function streakDays(k) {
  const s = streakGet(k)
  if (!s.start) return 0
  const ms = Date.now() - new Date(`${s.start}T00:00:00`).getTime()
  return Math.max(0, Math.floor(ms / 86400000))
}
export function streakBest(k) { return Math.max(streakGet(k).best || 0, streakDays(k)) }
export function streakStarted(k) { return !!streakGet(k).start }
export function streakStart(k) {
  const s = streakGet(k)
  if (!s.start) lsSet(SKEY(k), { ...s, start: todayKey() })
}
export function streakReset(k) {
  const best = streakBest(k)
  lsSet(SKEY(k), { start: todayKey(), best })
}
