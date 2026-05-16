import React, { useEffect, useMemo, useState } from 'react'

// ============================================================
// TRANSFORMATION HQ — Personal fitness OS for Kranthi
// Goal: best shape of life by end of 2027
// Storage: localStorage (no backend) under "thq:*" keys
// ============================================================

const TABS = [
  { id: 'today',    icon: '🎯', label: 'Today' },
  { id: 'schedule', icon: '📅', label: 'Schedule' },
  { id: 'training', icon: '🏋️', label: 'Training' },
  { id: 'cardio',   icon: '🏃', label: 'Cardio' },
  { id: 'diet',     icon: '🍱', label: 'Diet' },
  { id: 'supps',    icon: '💊', label: 'Supps' },
  { id: 'recovery', icon: '🌙', label: 'Recovery' },
  { id: 'tracker',  icon: '📊', label: 'Tracker' },
  { id: 'photos',   icon: '📸', label: 'Photos' },
  { id: 'roadmap',  icon: '🗺️', label: 'Roadmap' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
]

// ------- storage helpers --------------------------------------------------
const lsGet = (k, fb) => {
  try { const v = localStorage.getItem(`thq:${k}`); return v ? JSON.parse(v) : fb } catch { return fb }
}
const lsSet = (k, v) => { try { localStorage.setItem(`thq:${k}`, JSON.stringify(v)) } catch {} }
const todayKey = () => new Date().toISOString().slice(0, 10)

// ------- weekly plan data -------------------------------------------------
const WEEKLY_PLAN = [
  { day: 'Mon', focus: 'Push (Chest/Shoulder/Tri)', morn: 'Walk 30 min Zone 2',         eve: 'Push DB workout · 45 min',   notes: 'Posture cues + core finisher' },
  { day: 'Tue', focus: 'Boxing + Core',             morn: 'Shadow boxing 20 min',       eve: 'Heavy bag 4×3min · core 15 min', notes: 'Footwork drills, no sprinting' },
  { day: 'Wed', focus: 'Pull (Back/Bicep)',         morn: 'Cycling 30 min Zone 2',       eve: 'Pull DB+pullup workout · 45 min', notes: 'Rows for posture' },
  { day: 'Thu', focus: 'Tennis + Mobility',         morn: 'Mobility 15 min + walk 20',   eve: 'Tennis doubles 60–90 min',   notes: 'Active recovery feel' },
  { day: 'Fri', focus: 'Legs + Core',               morn: 'Walk 30 min',                 eve: 'Legs DB workout · 40 min',   notes: 'Glutes for posture & athleticism' },
  { day: 'Sat', focus: 'Sport day',                 morn: 'Tennis 60–90 min',            eve: 'Boxing bag 20 min OR rest', notes: 'Fun day, real calorie burn' },
  { day: 'Sun', focus: 'Full recovery',             morn: 'Long walk 45–60 min',         eve: 'Stretch 20 min + meal prep', notes: 'Plan the week, weigh-in' },
]

// ------- training split (home gym: DBs 24kg, bench, pullup, bands) -------
const TRAINING_SPLIT = {
  push: {
    title: 'Push — Chest / Shoulders / Triceps',
    exercises: [
      { name: 'DB Bench Press',         sets: '4', reps: '8–10', rest: '90s', cue: 'Bench flat, squeeze chest at top' },
      { name: 'Incline DB Press',       sets: '3', reps: '10–12', rest: '75s', cue: 'Bench at 30° — upper chest' },
      { name: 'DB Shoulder Press',      sets: '4', reps: '8–10', rest: '90s', cue: 'Seated, neutral grip — broader delts' },
      { name: 'DB Lateral Raise',       sets: '3', reps: '12–15', rest: '60s', cue: 'Wide shoulders = V-taper' },
      { name: 'DB Skull Crushers',      sets: '3', reps: '10–12', rest: '60s', cue: 'Elbows in, lower behind head' },
      { name: 'Band Pushdown',          sets: '3', reps: '15',    rest: '45s', cue: 'Triceps pump finisher' },
      { name: 'Hanging Knee Raise',     sets: '3', reps: 'AMRAP', rest: '60s', cue: 'Belly fat killer — slow eccentrics' },
    ],
  },
  pull: {
    title: 'Pull — Back / Biceps / Rear Delts',
    exercises: [
      { name: 'Pull-ups (assisted if needed)', sets: '4', reps: '6–10', rest: '120s', cue: 'King move for V-taper' },
      { name: 'DB Bent-over Row',       sets: '4', reps: '8–10', rest: '90s', cue: 'Pull to hip, squeeze' },
      { name: 'Single-arm DB Row',      sets: '3', reps: '10–12 ea', rest: '75s', cue: 'Knee on bench, long stretch' },
      { name: 'Face Pulls (band)',      sets: '3', reps: '15',    rest: '45s', cue: 'POSTURE GOLD — do not skip' },
      { name: 'DB Bicep Curl',          sets: '3', reps: '10–12', rest: '60s', cue: 'Strict, no swing' },
      { name: 'DB Hammer Curl',         sets: '3', reps: '10–12', rest: '60s', cue: 'Forearms + brachialis' },
      { name: 'Plank',                  sets: '3', reps: '45–60s',rest: '45s', cue: 'Brace like punched in gut' },
    ],
  },
  legs: {
    title: 'Legs — Quads / Hamstrings / Glutes / Calves',
    exercises: [
      { name: 'Goblet Squat',           sets: '4', reps: '10–12', rest: '90s', cue: 'Hold one 24kg DB at chest' },
      { name: 'DB Romanian Deadlift',   sets: '4', reps: '10–12', rest: '90s', cue: 'Hinge — hamstrings + glutes' },
      { name: 'DB Bulgarian Split Sq',  sets: '3', reps: '10 ea', rest: '75s', cue: 'Posture, athleticism, glutes' },
      { name: 'DB Reverse Lunge',       sets: '3', reps: '10 ea', rest: '60s', cue: 'Walking or in place' },
      { name: 'DB Calf Raise',          sets: '4', reps: '15',    rest: '45s', cue: 'Pause at top' },
      { name: 'Dead Bug',               sets: '3', reps: '10 ea', rest: '45s', cue: 'Lower back glued to floor' },
      { name: 'Hollow Hold',            sets: '3', reps: '30s',   rest: '45s', cue: 'Core stability for boxing' },
    ],
  },
}

// ------- cardio zones -----------------------------------------------------
const CARDIO_GUIDE = [
  { zone: 'Zone 2 (60–70% HR)', when: '3–4×/week morning', what: 'Brisk walk, cycle, easy jog · 30–45 min', why: 'Burns fat, builds aerobic base, no muscle cost' },
  { zone: 'Sport (mixed)',       when: 'Tennis Tue/Thu/Sat', what: 'Doubles 60–90 min',                       why: 'Fun cardio + reflexes + community' },
  { zone: 'Boxing conditioning', when: '2×/week',            what: 'Bag rounds 4×3min, 60s rest',             why: 'HIIT + shoulders + stress dump' },
  { zone: 'NEAT (steps)',        when: 'Daily',              what: '8–10k steps · walk meetings, stairs',     why: 'Biggest fat-loss lever after diet' },
  { zone: 'AVOID',               when: '—',                  what: '90 min daily running',                    why: 'Kills recovery + appetite + strength' },
]

// ------- diet plan --------------------------------------------------------
const DIET_TARGETS = {
  weightKgPlaceholder: 75,
  caloriesCut: '2100–2300 (mild deficit for body recomp)',
  proteinG: '150–170 (≈2 g/kg)',
  carbsG: '200–240 (around training days)',
  fatG: '60–75',
  water: '3–3.5L · add electrolytes on tennis/boxing days',
}

const MEAL_PLAN = [
  { slot: '7:00 AM — Wake', veg: 'Warm water + lemon + 1 tsp chia · black coffee', nv: 'Same', tip: 'Pre-fasted cardio = belly fat target' },
  { slot: '8:30 AM — Post cardio',   veg: '2 boiled eggs (or paneer 80g) + 1 banana + handful almonds', nv: '3 boiled eggs (whites+yolks) + banana + almonds', tip: '~30g protein, sets the day' },
  { slot: '11:00 AM — Office snack', veg: 'Greek yogurt 150g + berries OR roasted chana 40g',         nv: 'Greek yogurt + 30g whey if low protein',         tip: 'Skip biscuits/samosa at desk' },
  { slot: '1:30 PM — Lunch',         veg: '2 rotis + dal + sabzi + 100g paneer/tofu + salad',         nv: '1 cup rice + 150g chicken curry + dal + salad',  tip: 'Half the plate = veggies' },
  { slot: '4:30 PM — Pre-evening',   veg: 'Black coffee + 1 apple + 10 almonds',                       nv: 'Same + 1 boiled egg if hungry',                  tip: 'Light — energy for gym, not heavy' },
  { slot: '7:30 PM — Post workout',  veg: '1 scoop whey + 1 banana + water',                          nv: 'Same',                                            tip: '20 min window — protein + carbs' },
  { slot: '8:30 PM — Dinner',        veg: '2 rotis + sabzi + paneer bhurji 100g OR dal khichdi',      nv: '150g grilled chicken/fish + 1 cup quinoa + sautéed veg', tip: 'Light carbs, high protein, no late frying' },
  { slot: '10:30 PM — Bed',          veg: 'Warm milk + cinnamon (optional)',                          nv: 'Same OR casein scoop if available',              tip: 'Slow protein overnight' },
]

const CHEAT_RULES = [
  '1 fully unrestricted meal per week (Saturday lunch or dinner)',
  'Order what you crave — DO NOT order extras "since cheating anyway"',
  'Return to plan at the very next meal (zero guilt, zero "ruined week")',
  'Alcohol: max 2 nights/month, prefer clear spirits + soda',
  'Birthdays/weddings: enjoy + add 30 min walk after',
]

// ------- supplements ------------------------------------------------------
const SUPPS = [
  { name: 'Whey isolate',     dose: '25–30g',         when: 'Post-workout OR low-protein day',     why: 'Easiest way to hit 150g+ protein',          brand: 'MyProtein / Optimum / Avvatar' },
  { name: 'Creatine mono',    dose: '5g daily',       when: 'Anytime, with any drink',             why: 'Most-studied supp ever · strength + fullness', brand: 'Any unflavoured mono · ON / MuscleBlaze' },
  { name: 'Electrolytes',     dose: '1 serving',      when: 'Tennis/boxing days, hot weather',     why: 'Cramp prevention + hydration',              brand: 'Fast&Up / LMNT / coconut water' },
  { name: 'Vitamin D3',       dose: '2000 IU',        when: 'Morning with fat',                    why: 'Indian indoor workers usually deficient',   brand: 'Test first — get 25-OH-D lab' },
  { name: 'Omega-3 (fish oil)',dose: '2g EPA+DHA',    when: 'With lunch',                          why: 'Joint health for tennis/boxing + skin',     brand: 'Wellbeing / Carbamide' },
  { name: 'Multivitamin',     dose: '1 tab',          when: 'Optional, with breakfast',            why: 'Insurance only — food first',               brand: 'Centrum / GNC Mega Men' },
]

// ------- recovery ---------------------------------------------------------
const RECOVERY = {
  sleep: [
    'Target 7–8h. Lights dim by 10pm, screens off 30 min before bed.',
    'Bedroom 20–22°C, blackout curtains, phone OUT of room.',
    'No caffeine after 2pm. No heavy food 2h before sleep.',
    'Wake-time consistent ±30 min including weekends.',
  ],
  mobility: [
    'Daily 5 min: cat-cow, world\'s greatest stretch, dead hang 30s.',
    'Post-tennis: hip flexor + thoracic rotation + forearm release.',
    'Post-boxing: shoulder dislocates + neck CARs + wrist rotations.',
    'Office: hourly stand + 10 squats + chin tuck (posture).',
  ],
  cold: [
    'Cold shower 1–2 min at end of normal shower — alertness boost.',
    'Skip ice bath right after strength training (blunts gains).',
    'OK after tennis/boxing for inflammation control.',
  ],
  injury: [
    'Tennis elbow: wrist extensor stretches daily, grip strength work.',
    'Boxing wrists: always wrap, gradual bag intensity.',
    'Shoulder health: face pulls + band pull-aparts 3×/week (non-negotiable).',
    'Lower back: hinge before squat, brace core every set.',
  ],
}

// ------- roadmap ----------------------------------------------------------
const ROADMAP = [
  { window: 'Month 1',  body: 'Energy +20%, sleep deeper, slight waist reduction (1–2 cm). Strength baseline established.', habit: 'Habit lock: 5/7 days workout consistency.', warn: 'No visible abs yet — that\'s normal. Trust the process.' },
  { window: 'Month 3',  body: 'Clothes fit better, face less puffy, ~3–4 kg fat loss + 1 kg muscle. Posture noticeably straighter.', habit: 'Diet becomes default, not effort.', warn: 'First plateau — add intensity, not duration.' },
  { window: 'Month 6',  body: 'Belly visibly flatter, shoulders broader, V-taper emerging. Tennis stamina dramatically up.', habit: 'You miss workouts when you skip them.', warn: 'Comparison trap — only compare to month-1 photos.' },
  { window: 'Month 12', body: 'Lean athletic look, abs faint visible, boxing combos sharp, doubles tennis comfortable for 2h+.', habit: 'Friends/family asking what you\'re doing.', warn: 'Easy to coast — keep progressively overloading.' },
  { window: 'End 2027', body: 'Best shape of life: 12–15% body fat, defined shoulders & arms, lean waist, athletic on court, sustainable lifestyle that doesn\'t need willpower anymore.', habit: 'Identity = athlete, not "trying to lose weight".', warn: 'The plan is the asset. Don\'t abandon what worked.' },
]

// ------- minimum viable day ----------------------------------------------
const MVP_DAY = [
  '10 min walk after lunch',
  '3 sets of pushups (any number)',
  '3 sets of bodyweight squats',
  'Hit protein target via 1 whey shake + eggs',
  '8 glasses of water',
  'Sleep on time',
  'Tomorrow: full plan resumed. No "make up" sessions.',
]

// ============================================================
// COMPONENT
// ============================================================
// ============================================================
// COMPONENT — Full-page version
// ============================================================
export default function TransformationHQ({ onBack }) {
  const [tab, setTab] = useState(() => {
    const fromHash = window.location.hash.split('?')[1]?.split('=')?.[1]
    return TABS.find(t => t.id === fromHash)?.id || 'today'
  })

  // Sync tab to hash so it's bookmarkable + persists on refresh
  useEffect(() => {
    const base = '#/transformation'
    const newHash = `${base}?tab=${tab}`
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash)
    }
  }, [tab])

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar — nav surface with violet glow */}
      <div className="sticky top-0 z-30 thq-nav-surface backdrop-blur-xl border-b"
        style={{ borderBottomColor: 'color-mix(in oklab, var(--chart-1) 22%, var(--color-border))' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            onClick={onBack || (() => { window.location.hash = ''; window.location.reload() })}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm group"
          >
            <span className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{
                background: 'color-mix(in oklab, var(--chart-1) 8%, transparent)',
                boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 22%, transparent)',
              }}>
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </span>
            <span className="hidden sm:inline">Back to site</span>
          </button>
          <div className="text-center flex-1 min-w-0">
            <h1 className="font-heading text-foreground text-base sm:text-lg font-semibold flex items-center justify-center gap-2 tracking-tight">
              <span className="text-lg">🔥</span>
              <span>Transformation <span className="text-gradient-violet">HQ</span></span>
            </h1>
            <p className="text-[10.5px] text-muted-foreground hidden sm:block tracking-wide">Personal fitness OS · best shape by end of 2027</p>
          </div>
          <div className="w-20 sm:w-28 flex-shrink-0" />
        </div>

        {/* Tabs — pill-style segmented */}
        <div className="max-w-6xl mx-auto px-3 pb-2 overflow-x-auto scrollbar-hide">
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
                  } : {
                    color: 'var(--color-muted-foreground)',
                  }}
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-16">
        {tab === 'today'    && <TodayTab />}
        {tab === 'schedule' && <ScheduleTab />}
        {tab === 'training' && <TrainingTab />}
        {tab === 'cardio'   && <CardioTab />}
        {tab === 'diet'     && <DietTab />}
        {tab === 'supps'    && <SuppsTab />}
        {tab === 'recovery' && <RecoveryTab />}
        {tab === 'tracker'  && <TrackerTab />}
        {tab === 'photos'   && <PhotosTab />}
        {tab === 'roadmap'  && <RoadmapTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>

      <div className="border-t border-border/30 py-4 text-center">
        <span className="text-[10px] text-muted-foreground/60 font-mono">All data stored locally · no cloud · no judgment</span>
      </div>
    </div>
  )
}

// ============================================================
// TAB COMPONENTS
// ============================================================

function TodayTab() {
  const day = new Date().toLocaleDateString('en-US', { weekday: 'short' })
  const plan = WEEKLY_PLAN.find(p => p.day === day) || WEEKLY_PLAN[0]
  const [log, setLog] = useState(() => lsGet(`log:${todayKey()}`, {}))
  const update = (k, v) => { const next = { ...log, [k]: v }; setLog(next); lsSet(`log:${todayKey()}`, next) }

  const checks = [
    { key: 'morn',   icon: '🌅', label: `Morning · ${plan.morn}` },
    { key: 'eve',    icon: '🌙', label: `Evening · ${plan.eve}` },
    { key: 'water',  icon: '💧', label: 'Hit 3L+ water' },
    { key: 'prot',   icon: '🥩', label: 'Hit protein target (150g+)' },
    { key: 'steps',  icon: '👟', label: '8–10k steps' },
    { key: 'sleep',  icon: '😴', label: 'Sleep by 11pm' },
  ]
  const done = checks.filter(c => log[c.key]).length
  const pct = Math.round((done / checks.length) * 100)

  // Journey day counter
  const startDate = lsGet('settings:startDate', todayKey())
  const dayN = Math.max(1, Math.floor((new Date(todayKey()) - new Date(startDate)) / 86400000) + 1)

  // Streak (≥4 checks counts as active)
  const streak = useMemo(() => {
    let s = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const k = d.toISOString().slice(0,10)
      const ll = lsGet(`log:${k}`, {})
      const dn = ['morn','eve','water','prot','steps','sleep'].filter(x => ll[x]).length
      if (dn >= 4) s++; else if (i > 0) break
    }
    return s
  }, [log])

  // Mood/Energy/Sleep sliders
  const setSlider = (k, v) => update(k, v)

  return (
    <div className="space-y-4">
      {/* Hero header — journey day + ring + streak */}
      <div className="bg-card pr-tint-violet p-5 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-5">
          <div className="flex items-center gap-5">
            <ProgressRing value={pct} size={92} stroke={7} />
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] font-semibold" style={{ color: 'color-mix(in oklab, var(--chart-1) 70%, var(--color-muted-foreground))' }}>
                Day {dayN} of the journey
              </div>
              <div className="font-heading text-2xl md:text-3xl font-semibold text-foreground mt-1 tracking-tight">
                {day} · <span className="text-gradient-violet">{plan.focus}</span>
              </div>
              <div className="flex items-center gap-4 mt-2 text-[11px]">
                <span className="flex items-center gap-1.5 font-semibold" style={{ color: 'oklch(75% 0.18 60)' }}>
                  <span className="text-base">🔥</span> {streak} day streak
                </span>
                <span className="text-muted-foreground tabular-nums">{done}/{checks.length} done today · {pct}%</span>
              </div>
            </div>
          </div>
          <QuickActions log={log} plan={plan} />
        </div>
        <p className="text-[11.5px] text-muted-foreground/90 mt-4 italic pl-1 border-l-2 pl-3"
          style={{ borderColor: 'color-mix(in oklab, var(--chart-1) 40%, transparent)' }}>
          {plan.notes}
        </p>
      </div>

      {/* Today's checklist */}
      <div className="bg-card pr-tint-magenta p-4">
        <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">✅ Today's check-ins</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {checks.map(c => (
            <label key={c.key}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-all ${
                log[c.key] ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-background/40 border border-border/30 hover:border-violet-500/40'
              }`}>
              <input type="checkbox" checked={!!log[c.key]} onChange={e => update(c.key, e.target.checked)}
                className="w-4 h-4 rounded accent-violet-500" />
              <span className="text-base">{c.icon}</span>
              <span className={`text-xs flex-1 ${log[c.key] ? 'line-through text-muted-foreground/60' : 'text-foreground'}`}>{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Mood / Energy / Sleep sliders */}
      <div className="bg-card pr-tint-coral p-4">
        <h4 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">🧠 How are you feeling?</h4>
        <div className="space-y-3">
          {[
            { key: 'energy',  label: 'Energy',    emoji: '⚡', max: 10 },
            { key: 'mood',    label: 'Mood',      emoji: '😊', max: 10 },
            { key: 'sleepQ',  label: 'Sleep quality (last night)', emoji: '🌙', max: 10 },
          ].map(s => (
            <div key={s.key} className="flex items-center gap-3">
              <span className="text-lg w-6 text-center">{s.emoji}</span>
              <span className="text-[11px] font-medium text-foreground w-36 truncate">{s.label}</span>
              <input
                type="range" min="0" max={s.max}
                value={log[s.key] ?? 0}
                onChange={e => setSlider(s.key, parseInt(e.target.value, 10))}
                className="flex-1 accent-orange-400"
              />
              <span className="font-mono text-xs text-foreground tabular-nums w-10 text-right">{log[s.key] ?? 0}/{s.max}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row — MVP day + reminder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-card pr-tint-violet p-4">
          <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">⚡ Low energy? Minimum viable day</h4>
          <ul className="space-y-1 text-[11px] text-muted-foreground">
            {MVP_DAY.map((m,i) => <li key={i} className="flex gap-1.5"><span className="text-violet-400">·</span>{m}</li>)}
          </ul>
        </div>
        <div className="bg-card pr-tint-coral p-4">
          <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">💡 Reminder of the day</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed italic">"{REMINDERS[new Date().getDate() % REMINDERS.length]}"</p>
        </div>
      </div>
    </div>
  )
}

// ─── Progress ring (SVG donut) ──────────────────────────────────────
function ProgressRing({ value, size = 80, stroke = 6 }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c - (value / 100) * c
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke="url(#prog-grad)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <defs>
        <linearGradient id="prog-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" className="font-heading" style={{ fill: 'currentColor', fontSize: size * 0.26, fontWeight: 700 }}>{value}%</text>
    </svg>
  )
}

// ─── Quick actions row ──────────────────────────────────────────────
function QuickActions({ log, plan }) {
  const [toast, setToast] = useState('')
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 2500) }

  // WhatsApp self-message
  const whatsapp = () => {
    const phone = lsGet('settings:phone', '')
    if (!phone) { showToast('Add your phone in Settings first'); return }
    const text = encodeURIComponent(buildDailyMessage(plan))
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${text}`, '_blank')
  }

  // Browser notification — daily reminder demo
  const notify = async () => {
    if (!('Notification' in window)) { showToast('Notifications not supported'); return }
    let perm = Notification.permission
    if (perm === 'default') perm = await Notification.requestPermission()
    if (perm !== 'granted') { showToast('Notifications denied'); return }
    new Notification('Transformation HQ', {
      body: `Today is ${plan.focus}. Morning: ${plan.morn.split(' ').slice(0,4).join(' ')}…`,
      icon: '/favicon.svg',
    })
    showToast('Notification sent · I\'ll nudge you while this tab is open')
    // Schedule recurring reminders while tab is open
    scheduleReminders(plan)
  }

  // ntfy.sh push to phone
  const ntfyPush = async () => {
    const topic = lsGet('settings:ntfyTopic', '')
    if (!topic) { showToast('Add ntfy topic in Settings first'); return }
    try {
      await fetch('https://ntfy.sh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          title: `Today: ${plan.focus}`,
          message: buildDailyMessage(plan),
          priority: 4,
          tags: ['muscle', 'fire'],
        }),
      })
      showToast('Pushed to your phone via ntfy.sh ✓')
    } catch (e) {
      showToast('ntfy push failed: ' + e.message)
    }
  }

  // ICS calendar export
  const exportICS = () => {
    const ics = buildWeekICS(WEEKLY_PLAN)
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transformation-week.ics'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Calendar exported · open file to add events')
  }

  const Btn = ({ onClick, icon, label }) => (
    <button onClick={onClick}
      className="flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg bg-background/50 border border-border/40 hover:border-violet-500/50 hover:bg-violet-500/10 transition-all min-w-[64px]">
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-[9.5px] font-medium text-muted-foreground">{label}</span>
    </button>
  )

  return (
    <div className="relative">
      <div className="flex gap-2 flex-wrap">
        <Btn onClick={whatsapp}  icon="💬" label="WhatsApp" />
        <Btn onClick={ntfyPush}  icon="📲" label="Push" />
        <Btn onClick={notify}    icon="🔔" label="Notify" />
        <Btn onClick={exportICS} icon="📅" label="Calendar" />
      </div>
      {toast && (
        <div className="absolute top-full right-0 mt-2 px-3 py-1.5 rounded-md bg-foreground text-background text-[11px] font-medium whitespace-nowrap z-10">
          {toast}
        </div>
      )}
    </div>
  )
}

// Build a clean daily message for WhatsApp/ntfy
function buildDailyMessage(plan) {
  return [
    `🔥 Day plan — ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}`,
    `Focus: ${plan.focus}`,
    `🌅 ${plan.morn}`,
    `🌙 ${plan.eve}`,
    `Notes: ${plan.notes}`,
    '',
    'Check-ins: 💧 3L water · 🥩 150g protein · 👟 8k steps · 😴 sleep by 11',
  ].join('\n')
}

// Build .ics calendar for the week's workouts
function buildWeekICS(weekPlan) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Transformation HQ//EN']
  const today = new Date()
  const dow = today.getDay() // 0=Sun..6=Sat
  const dayIdx = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  weekPlan.forEach((p, i) => {
    const target = new Date(today)
    target.setDate(today.getDate() + ((dayIdx[p.day] - dow + 7) % 7))
    const ymd = target.toISOString().slice(0, 10).replace(/-/g, '')
    // Morning event 07:00–07:45
    lines.push('BEGIN:VEVENT', `UID:thq-morn-${ymd}@kranthikiran.com`, `DTSTART:${ymd}T013000Z`, `DTEND:${ymd}T021500Z`, `SUMMARY:🌅 ${p.morn}`, `DESCRIPTION:${p.focus} · ${p.notes}`, 'END:VEVENT')
    // Evening event 19:15–20:00
    lines.push('BEGIN:VEVENT', `UID:thq-eve-${ymd}@kranthikiran.com`, `DTSTART:${ymd}T134500Z`, `DTEND:${ymd}T143000Z`, `SUMMARY:🌙 ${p.eve}`, `DESCRIPTION:${p.focus} · ${p.notes}`, 'END:VEVENT')
  })
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

// Schedule local notifications at fixed times while tab open
function scheduleReminders(plan) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  const times = lsGet('settings:reminderTimes', ['07:00', '13:00', '19:00', '21:30'])
  // Clear any previous timers we set
  const existing = window.__thqTimers || []
  existing.forEach(t => clearTimeout(t))
  window.__thqTimers = []
  times.forEach((t) => {
    const [h, m] = t.split(':').map(Number)
    const when = new Date()
    when.setHours(h, m, 0, 0)
    if (when < new Date()) when.setDate(when.getDate() + 1)
    const ms = when - new Date()
    const id = setTimeout(() => {
      new Notification('Transformation HQ — check in', { body: `${plan.focus} · ${t}`, icon: '/favicon.svg' })
    }, ms)
    window.__thqTimers.push(id)
  })
}

const REMINDERS = [
  'Consistency > intensity. A 30 min workout you actually do beats a 90 min one you skip.',
  'Belly fat goes last — track waist circumference, not just scale weight.',
  'Sleep is your secret weapon. 7+ hours or all training is half-effective.',
  'Protein at every meal. If unsure, eat more protein.',
  'Tennis is training. Boxing is training. You don\'t need to hate cardio.',
  'Face pulls — every pull day. Posture is half the aesthetic.',
  'The scale lies on bad days. Trust the 30-day average.',
  'You are 2027 Kranthi being built today. Act like him.',
  'Pre-fasted cardio targets belly fat. Coffee + 30 min walk before breakfast.',
  'Compare to month-1 photos. Never to influencers.',
]

function ScheduleTab() {
  return (
    <div className="space-y-3">
      <div className="bg-card pr-tint-violet p-4">
        <h3 className="text-sm font-semibold text-foreground mb-2">Daily structure (work day)</h3>
        <ul className="text-[11px] text-muted-foreground space-y-1 font-mono">
          <li>6:30 AM — Wake · water · coffee</li>
          <li>6:45 AM — Morning cardio (30–45 min)</li>
          <li>7:45 AM — Shower · breakfast</li>
          <li>9:00 AM — Work begins · stand every hour</li>
          <li>1:30 PM — Lunch + 10 min walk</li>
          <li>4:30 PM — Pre-workout snack</li>
          <li>7:00 PM — Off work</li>
          <li>7:15 PM — Evening strength (45 min)</li>
          <li>8:30 PM — Dinner</li>
          <li>10:00 PM — Wind down · screens off</li>
          <li>10:30 PM — Sleep</li>
        </ul>
      </div>

      <div className="bg-card pr-tint-magenta p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Weekly split</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-muted-foreground border-b border-border/30">
                <th className="text-left py-1.5 pr-3">Day</th>
                <th className="text-left py-1.5 pr-3">Focus</th>
                <th className="text-left py-1.5 pr-3">Morning</th>
                <th className="text-left py-1.5">Evening</th>
              </tr>
            </thead>
            <tbody>
              {WEEKLY_PLAN.map(d => (
                <tr key={d.day} className="border-b border-border/10">
                  <td className="py-2 pr-3 font-mono font-semibold text-foreground">{d.day}</td>
                  <td className="py-2 pr-3 text-foreground/80">{d.focus}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{d.morn}</td>
                  <td className="py-2 text-muted-foreground">{d.eve}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card pr-tint-coral p-4">
        <h4 className="text-xs font-semibold text-foreground mb-1.5">Busy workday fallback</h4>
        <p className="text-[11px] text-muted-foreground">Combine cardio + strength into one 40-min evening block: 5 min skip rope warmup → DB superset (push+pull) 25 min → 10 min bag/walk. Done.</p>
      </div>
    </div>
  )
}

function TrainingTab() {
  const [day, setDay] = useState('push')
  const s = TRAINING_SPLIT[day]
  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        {Object.entries(TRAINING_SPLIT).map(([k, v]) => (
          <button key={k} onClick={() => setDay(k)}
            className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${day === k ? 'bg-foreground/15 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'}`}>
            {v.title.split(' — ')[0]}
          </button>
        ))}
      </div>

      <div className="bg-card pr-tint-violet p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">{s.title}</h3>
        <div className="space-y-2">
          {s.exercises.map((ex, i) => (
            <div key={i} className="flex items-start gap-3 py-2 border-b border-border/15 last:border-0">
              <span className="font-mono text-[10px] text-muted-foreground/60 mt-0.5 w-4">{i+1}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <span className="text-xs font-medium text-foreground">{ex.name}</span>
                  <span className="text-[10px] font-mono text-violet-400">{ex.sets}×{ex.reps}</span>
                  <span className="text-[10px] font-mono text-muted-foreground/60">rest {ex.rest}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{ex.cue}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card pr-tint-magenta p-4">
        <h4 className="text-xs font-semibold text-foreground mb-1.5">Progressive overload (the secret)</h4>
        <p className="text-[11px] text-muted-foreground leading-relaxed">Each week, either add 1 rep, slow the eccentric by 1s, or add half a kg. When you hit top of rep range × all sets, jump the weight. Your 24kg DBs go a LONG way with this approach.</p>
      </div>
    </div>
  )
}

function CardioTab() {
  return (
    <div className="space-y-3">
      <div className="bg-card pr-tint-coral p-4">
        <h3 className="text-sm font-semibold text-foreground mb-1">The cardio philosophy</h3>
        <p className="text-[11px] text-muted-foreground leading-relaxed">Most of your "cardio" should be sports (tennis, boxing) + walking. Long jogging is overrated for fat loss and CAN eat muscle. Aim for fun + frequent + low-stress.</p>
      </div>
      {CARDIO_GUIDE.map((c, i) => (
        <div key={i} className={`bg-card p-4 ${['pr-tint-violet','pr-tint-magenta','pr-tint-coral'][i % 3]}`}>
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <h4 className="text-xs font-semibold text-foreground">{c.zone}</h4>
            <span className="text-[10px] font-mono text-muted-foreground">{c.when}</span>
          </div>
          <p className="text-[11px] text-foreground/80 mb-1">{c.what}</p>
          <p className="text-[10px] text-muted-foreground">{c.why}</p>
        </div>
      ))}
    </div>
  )
}

function DietTab() {
  return (
    <div className="space-y-4">
      <div className="bg-card pr-tint-violet p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Daily targets</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-[11px]">
          <div><div className="text-muted-foreground">Calories</div><div className="text-foreground font-medium">{DIET_TARGETS.caloriesCut}</div></div>
          <div><div className="text-muted-foreground">Protein</div><div className="text-foreground font-medium">{DIET_TARGETS.proteinG}g</div></div>
          <div><div className="text-muted-foreground">Carbs</div><div className="text-foreground font-medium">{DIET_TARGETS.carbsG}g</div></div>
          <div><div className="text-muted-foreground">Fats</div><div className="text-foreground font-medium">{DIET_TARGETS.fatG}g</div></div>
          <div className="col-span-2"><div className="text-muted-foreground">Water</div><div className="text-foreground font-medium">{DIET_TARGETS.water}</div></div>
        </div>
      </div>

      <div className="bg-card pr-tint-magenta p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Daily meal plan</h3>
        <div className="space-y-2.5">
          {MEAL_PLAN.map((m, i) => (
            <div key={i} className="border-b border-border/15 last:border-0 pb-2.5 last:pb-0">
              <div className="text-[11px] font-mono font-semibold text-violet-400 mb-1">{m.slot}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div><span className="text-muted-foreground">🥬 Veg: </span><span className="text-foreground/90">{m.veg}</span></div>
                <div><span className="text-muted-foreground">🍗 NV: </span><span className="text-foreground/90">{m.nv}</span></div>
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-1 italic">{m.tip}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card pr-tint-coral p-4">
        <h4 className="text-xs font-semibold text-foreground mb-2">Cheat meal rules</h4>
        <ul className="text-[11px] text-muted-foreground space-y-1">
          {CHEAT_RULES.map((r, i) => <li key={i} className="flex gap-1.5"><span className="text-coral-400">·</span>{r}</li>)}
        </ul>
      </div>
    </div>
  )
}

function SuppsTab() {
  return (
    <div className="space-y-3">
      <div className="bg-card pr-tint-violet p-4">
        <p className="text-[11px] text-muted-foreground"><b className="text-foreground">Rule:</b> Supplements are 5% of results. Food + sleep + training are 95%. These are the only ones with strong evidence.</p>
      </div>
      {SUPPS.map((s, i) => (
        <div key={i} className={`bg-card p-4 ${['pr-tint-violet','pr-tint-magenta','pr-tint-coral'][i % 3]}`}>
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <h4 className="text-xs font-semibold text-foreground">{s.name}</h4>
            <span className="text-[10px] font-mono text-violet-400">{s.dose}</span>
          </div>
          <p className="text-[11px] text-foreground/80 mb-0.5"><span className="text-muted-foreground">When: </span>{s.when}</p>
          <p className="text-[11px] text-foreground/80 mb-0.5"><span className="text-muted-foreground">Why: </span>{s.why}</p>
          <p className="text-[10px] text-muted-foreground italic">Suggested: {s.brand}</p>
        </div>
      ))}
    </div>
  )
}

function RecoveryTab() {
  const sections = [
    { title: '😴 Sleep', tint: 'pr-tint-violet', items: RECOVERY.sleep },
    { title: '🧘 Daily mobility', tint: 'pr-tint-magenta', items: RECOVERY.mobility },
    { title: '🥶 Cold exposure', tint: 'pr-tint-coral', items: RECOVERY.cold },
    { title: '🩹 Injury prevention (tennis + boxing)', tint: 'pr-tint-violet', items: RECOVERY.injury },
  ]
  return (
    <div className="space-y-3">
      {sections.map((s, i) => (
        <div key={i} className={`bg-card p-4 ${s.tint}`}>
          <h4 className="text-xs font-semibold text-foreground mb-2">{s.title}</h4>
          <ul className="text-[11px] text-muted-foreground space-y-1">
            {s.items.map((it, j) => <li key={j} className="flex gap-1.5"><span className="text-violet-400">·</span>{it}</li>)}
          </ul>
        </div>
      ))}
    </div>
  )
}

function TrackerTab() {
  const [weight, setWeight] = useState(() => lsGet('weight', []))
  const [waist,  setWaist]  = useState(() => lsGet('waist', []))
  const [wIn, setWIn] = useState('')
  const [wsIn, setWsIn] = useState('')

  const addWeight = () => {
    const n = parseFloat(wIn); if (!n) return
    const next = [...weight.filter(e => e.date !== todayKey()), { date: todayKey(), v: n }].sort((a,b) => a.date.localeCompare(b.date))
    setWeight(next); lsSet('weight', next); setWIn('')
  }
  const addWaist = () => {
    const n = parseFloat(wsIn); if (!n) return
    const next = [...waist.filter(e => e.date !== todayKey()), { date: todayKey(), v: n }].sort((a,b) => a.date.localeCompare(b.date))
    setWaist(next); lsSet('waist', next); setWsIn('')
  }

  const streak = useMemo(() => {
    let s = 0
    for (let i = 0; i < 365; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const k = d.toISOString().slice(0,10)
      const log = lsGet(`log:${k}`, {})
      const done = ['morn','eve','water','prot','steps','sleep'].filter(x => log[x]).length
      if (done >= 4) s++; else break
    }
    return s
  }, [])

  const wTrend = trend(weight, 30)
  const wsTrend = trend(waist, 30)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Streak (4+ checks/day)" value={`${streak} d`} tint="pr-tint-violet" />
        <StatCard label="30-day weight Δ" value={fmt(wTrend, 'kg')} tint="pr-tint-magenta" />
        <StatCard label="30-day waist Δ" value={fmt(wsTrend, 'cm')} tint="pr-tint-coral" />
      </div>

      <div className="bg-card pr-tint-violet p-4">
        <h4 className="text-xs font-semibold text-foreground mb-2">Weight log (kg)</h4>
        <div className="flex gap-2 mb-3">
          <input type="number" step="0.1" value={wIn} onChange={e => setWIn(e.target.value)} placeholder="e.g. 74.5"
            className="flex-1 bg-background border border-border/40 rounded-md px-3 py-1.5 text-xs outline-none focus:border-violet-500/60" />
          <button onClick={addWeight} className="px-3 py-1.5 rounded-md bg-violet-500/20 border border-violet-500/40 text-xs text-foreground hover:bg-violet-500/30 transition-colors">Log today</button>
        </div>
        <Sparkline data={weight} unit="kg" />
      </div>

      <div className="bg-card pr-tint-magenta p-4">
        <h4 className="text-xs font-semibold text-foreground mb-2">Waist log (cm) · the real fat-loss metric</h4>
        <div className="flex gap-2 mb-3">
          <input type="number" step="0.1" value={wsIn} onChange={e => setWsIn(e.target.value)} placeholder="e.g. 88.0"
            className="flex-1 bg-background border border-border/40 rounded-md px-3 py-1.5 text-xs outline-none focus:border-pink-500/60" />
          <button onClick={addWaist} className="px-3 py-1.5 rounded-md bg-pink-500/20 border border-pink-500/40 text-xs text-foreground hover:bg-pink-500/30 transition-colors">Log today</button>
        </div>
        <Sparkline data={waist} unit="cm" />
      </div>

      <div className="bg-card pr-tint-coral p-4">
        <h4 className="text-xs font-semibold text-foreground mb-1.5">Pro tip</h4>
        <p className="text-[11px] text-muted-foreground">Weigh + measure waist every Sunday 7am, fasted, post-bathroom. Plot the 4-week moving average — that's the truth. Day-to-day noise is meaningless.</p>
      </div>

      <WorkoutLogger />
      <DailyHistory />
    </div>
  )
}

// ─── Workout PR logger ───────────────────────────────────────────────
function WorkoutLogger() {
  const [lifts, setLifts] = useState(() => lsGet('lifts', []))
  const [ex, setEx] = useState('DB Bench Press')
  const [w, setW] = useState('')
  const [r, setR] = useState('')

  const exerciseList = useMemo(() => {
    const all = []
    Object.values(TRAINING_SPLIT).forEach(s => s.exercises.forEach(e => all.push(e.name)))
    return Array.from(new Set(all))
  }, [])

  const log = () => {
    const weight = parseFloat(w), reps = parseInt(r, 10)
    if (!weight || !reps) return
    const next = [{ date: todayKey(), ex, w: weight, r: reps, t: Date.now() }, ...lifts].slice(0, 200)
    setLifts(next); lsSet('lifts', next); setW(''); setR('')
  }

  // Compute PRs per exercise (heaviest weight × reps, also estimated 1RM)
  const prs = useMemo(() => {
    const m = {}
    for (const l of lifts) {
      const est1rm = l.w * (1 + l.r / 30)
      if (!m[l.ex] || est1rm > m[l.ex].est1rm) m[l.ex] = { ...l, est1rm }
    }
    return Object.values(m).sort((a, b) => b.est1rm - a.est1rm)
  }, [lifts])

  return (
    <div className="bg-card pr-tint-violet p-4">
      <h4 className="text-xs font-semibold text-foreground mb-2">Workout log · personal records</h4>
      <div className="grid grid-cols-[1fr_70px_60px_auto] gap-2 mb-3">
        <select value={ex} onChange={e => setEx(e.target.value)}
          className="bg-background border border-border/40 rounded-md px-2 py-1.5 text-[11px] outline-none focus:border-violet-500/60">
          {exerciseList.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <input type="number" step="0.5" value={w} onChange={e => setW(e.target.value)} placeholder="kg"
          className="bg-background border border-border/40 rounded-md px-2 py-1.5 text-[11px] outline-none focus:border-violet-500/60" />
        <input type="number" value={r} onChange={e => setR(e.target.value)} placeholder="reps"
          className="bg-background border border-border/40 rounded-md px-2 py-1.5 text-[11px] outline-none focus:border-violet-500/60" />
        <button onClick={log} className="px-3 py-1.5 rounded-md bg-violet-500/20 border border-violet-500/40 text-[11px] text-foreground hover:bg-violet-500/30 transition-colors">Log</button>
      </div>

      {prs.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Top PRs (est. 1RM)</div>
          <div className="space-y-1">
            {prs.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between text-[11px] py-1 px-2 rounded-md bg-background/40">
                <span className="font-medium text-foreground truncate flex-1 mr-2">{p.ex}</span>
                <span className="font-mono text-muted-foreground tabular-nums">{p.w}kg × {p.r}</span>
                <span className="font-mono text-violet-400 tabular-nums ml-2 w-12 text-right">{p.est1rm.toFixed(0)}kg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {lifts.length > 0 && (
        <details>
          <summary className="text-[10px] uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground">Recent sessions ({lifts.length})</summary>
          <div className="mt-2 max-h-40 overflow-y-auto space-y-0.5">
            {lifts.slice(0, 30).map((l, i) => (
              <div key={i} className="flex items-center justify-between text-[10.5px] py-0.5 px-1 text-muted-foreground">
                <span className="font-mono">{l.date}</span>
                <span className="flex-1 truncate mx-2 text-foreground/80">{l.ex}</span>
                <span className="font-mono tabular-nums">{l.w}kg × {l.r}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// ─── Daily history (last 30 days at a glance) ─────────────────────────
function DailyHistory() {
  const days = useMemo(() => {
    const arr = []
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const k = d.toISOString().slice(0, 10)
      const log = lsGet(`log:${k}`, {})
      const done = ['morn', 'eve', 'water', 'prot', 'steps', 'sleep'].filter(x => log[x]).length
      arr.push({ date: k, done, total: 6, day: d.toLocaleDateString('en-US', { weekday: 'short' }) })
    }
    return arr.reverse()
  }, [])
  const totalCompletions = days.reduce((a, b) => a + b.done, 0)
  return (
    <div className="bg-card pr-tint-magenta p-4">
      <h4 className="text-xs font-semibold text-foreground mb-2">Last 30 days</h4>
      <div className="grid grid-cols-15 gap-1 mb-3" style={{ gridTemplateColumns: 'repeat(30, 1fr)' }}>
        {days.map((d, i) => (
          <div
            key={i}
            title={`${d.date} · ${d.done}/${d.total} checks`}
            className="aspect-square rounded-[3px]"
            style={{
              background: d.done === 0
                ? 'color-mix(in oklab, var(--color-border) 50%, transparent)'
                : `color-mix(in oklab, var(--chart-2) ${20 + (d.done / d.total) * 60}%, transparent)`,
              boxShadow: d.done > 0 ? 'inset 0 0 0 1px color-mix(in oklab, var(--chart-2) 40%, transparent)' : 'none',
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-[10.5px] text-muted-foreground">
        <span>30d ago</span>
        <span><span className="text-foreground font-semibold">{totalCompletions}</span> check-ins logged</span>
        <span>today</span>
      </div>
    </div>
  )
}

function StatCard({ label, value, tint }) {
  return (
    <div className={`bg-card p-3 ${tint}`}>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-lg font-heading font-semibold text-foreground mt-0.5">{value}</div>
    </div>
  )
}

function trend(arr, days) {
  if (arr.length < 2) return 0
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - days)
  const ck = cutoff.toISOString().slice(0,10)
  const recent = arr.filter(e => e.date >= ck)
  if (recent.length < 2) return 0
  return recent[recent.length - 1].v - recent[0].v
}
function fmt(n, unit) {
  if (!n) return `— ${unit}`
  const s = n > 0 ? '+' : ''
  return `${s}${n.toFixed(1)} ${unit}`
}

function Sparkline({ data, unit }) {
  if (data.length === 0) return <p className="text-[11px] text-muted-foreground/60">No data yet. Log your first entry above.</p>
  const w = 600, h = 60, pad = 4
  const vs = data.map(d => d.v)
  const min = Math.min(...vs), max = Math.max(...vs)
  const range = max - min || 1
  const pts = data.map((d, i) => {
    const x = pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2)
    const y = pad + (1 - (d.v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')
  const latest = data[data.length - 1]
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14">
        <polyline fill="none" stroke="currentColor" strokeWidth="1.5" points={pts} className="text-violet-400" />
        {data.map((d, i) => {
          const x = pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2)
          const y = pad + (1 - (d.v - min) / range) * (h - pad * 2)
          return <circle key={i} cx={x} cy={y} r="2" className="fill-violet-300" />
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-muted-foreground font-mono mt-1">
        <span>{data[0].date} · {data[0].v}{unit}</span>
        <span>{data.length} entries · latest {latest.v}{unit}</span>
      </div>
    </div>
  )
}

function RoadmapTab() {
  return (
    <div className="space-y-3">
      {ROADMAP.map((r, i) => (
        <div key={i} className={`bg-card p-4 ${['pr-tint-violet','pr-tint-magenta','pr-tint-coral'][i % 3]}`}>
          <div className="flex items-baseline justify-between gap-3 mb-2">
            <h4 className="text-sm font-semibold text-foreground">{r.window}</h4>
            <span className="text-[10px] font-mono text-violet-400">milestone</span>
          </div>
          <p className="text-[11px] text-foreground/85 mb-1.5"><b className="text-foreground">Body: </b>{r.body}</p>
          <p className="text-[11px] text-foreground/85 mb-1.5"><b className="text-foreground">Habit: </b>{r.habit}</p>
          <p className="text-[10px] text-muted-foreground italic"><b>Watch out: </b>{r.warn}</p>
        </div>
      ))}
      <div className="bg-card pr-tint-violet p-4 text-center">
        <p className="text-xs text-foreground font-medium">The plan is the asset. Consistency × time = transformation.</p>
        <p className="text-[10px] text-muted-foreground mt-1">2027-12-31 Kranthi is built every single day.</p>
      </div>
    </div>
  )
}

// ============================================================
// PHOTOS TAB — Weekly progress photos
// ============================================================
function PhotosTab() {
  const [photos, setPhotos] = useState(() => lsGet('photos', []))
  const fileRef = React.useRef(null)
  const [busy, setBusy] = useState(false)

  const upload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2_000_000) {
      alert('Image too large. Please use a photo under 2MB (resize on your phone first).')
      return
    }
    setBusy(true)
    try {
      // Compress to ~800px wide, JPEG quality 0.7
      const dataUrl = await compressImage(file, 800, 0.7)
      const entry = { date: todayKey(), data: dataUrl, t: Date.now() }
      const next = [entry, ...photos].slice(0, 60)
      setPhotos(next); lsSet('photos', next)
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const remove = (idx) => {
    if (!confirm('Delete this photo?')) return
    const next = photos.filter((_, i) => i !== idx)
    setPhotos(next); lsSet('photos', next)
  }

  return (
    <div className="space-y-4">
      <div className="bg-card pr-tint-violet p-4">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div>
            <h4 className="text-xs font-semibold text-foreground">📸 Progress photos</h4>
            <p className="text-[10.5px] text-muted-foreground mt-0.5">Take a weekly photo (Sunday morning, same spot, same light, same outfit). Stored locally only.</p>
          </div>
          <label className="px-3 py-1.5 rounded-md bg-violet-500/20 border border-violet-500/40 text-[11px] text-foreground hover:bg-violet-500/30 transition-colors cursor-pointer">
            {busy ? 'Compressing…' : '＋ Add photo'}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={upload} className="hidden" disabled={busy} />
          </label>
        </div>

        {photos.length === 0 ? (
          <p className="text-[11px] text-muted-foreground text-center py-8">
            No photos yet. Take your first one — this is your <b>before</b>. You\'ll thank yourself in 6 months.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3">
            {photos.map((p, i) => (
              <div key={p.t} className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-border/40">
                <img src={p.data} alt={p.date} className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-[10px] text-white font-mono">
                  {p.date}
                  {i === photos.length - 1 && <span className="ml-1 px-1 rounded bg-violet-500/60 text-[8px] uppercase">start</span>}
                </div>
                <button onClick={() => remove(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white/80 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {photos.length >= 2 && (
        <div className="bg-card pr-tint-magenta p-4">
          <h4 className="text-xs font-semibold text-foreground mb-2">Before / now comparison</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border/40">
              <img src={photos[photos.length - 1].data} alt="before" className="w-full h-full object-cover" />
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white font-mono">BEFORE · {photos[photos.length - 1].date}</div>
            </div>
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border/40">
              <img src={photos[0].data} alt="now" className="w-full h-full object-cover" />
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-500/70 text-[9px] text-white font-mono">NOW · {photos[0].date}</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card pr-tint-coral p-4">
        <h4 className="text-xs font-semibold text-foreground mb-1.5">Why photos &gt; scale</h4>
        <p className="text-[11px] text-muted-foreground">Body recomp invisible on the scale shows up clearly in photos. The mirror lies (you see yourself daily). The camera does not. <b>Same pose, same lighting, every Sunday.</b></p>
      </div>
    </div>
  )
}

async function compressImage(file, maxW = 800, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width)
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// ============================================================
// SETTINGS TAB — Phone, ntfy topic, reminders, journey start, export
// ============================================================
function SettingsTab() {
  const [phone, setPhone] = useState(() => lsGet('settings:phone', ''))
  const [ntfy, setNtfy]   = useState(() => lsGet('settings:ntfyTopic', ''))
  const [start, setStart] = useState(() => lsGet('settings:startDate', todayKey()))
  const [times, setTimes] = useState(() => lsGet('settings:reminderTimes', ['07:00', '13:00', '19:00', '21:30']))
  const [saved, setSaved] = useState('')

  const save = () => {
    lsSet('settings:phone', phone)
    lsSet('settings:ntfyTopic', ntfy)
    lsSet('settings:startDate', start)
    lsSet('settings:reminderTimes', times)
    setSaved('Saved ✓')
    setTimeout(() => setSaved(''), 1800)
  }

  const exportData = () => {
    const data = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('thq:')) data[k] = localStorage.getItem(k)
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `transformation-hq-backup-${todayKey()}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  const importData = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result)
        Object.entries(obj).forEach(([k, v]) => localStorage.setItem(k, v))
        alert('Imported. Reloading…')
        location.reload()
      } catch (err) { alert('Invalid file: ' + err.message) }
    }
    reader.readAsText(file)
  }

  const resetAll = () => {
    if (!confirm('Wipe ALL Transformation HQ data? This cannot be undone.')) return
    if (!confirm('Are you sure? Last warning.')) return
    Object.keys(localStorage).filter(k => k.startsWith('thq:')).forEach(k => localStorage.removeItem(k))
    location.reload()
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-card pr-tint-violet p-4">
        <h4 className="text-xs font-semibold text-foreground mb-3">📱 WhatsApp self-message</h4>
        <p className="text-[11px] text-muted-foreground mb-2">Your phone number with country code. Tapping the WhatsApp quick-action will draft a daily message to you.</p>
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9876543210"
          className="w-full bg-background border border-border/40 rounded-md px-3 py-1.5 text-xs outline-none focus:border-violet-500/60" />
      </div>

      <div className="bg-card pr-tint-magenta p-4">
        <h4 className="text-xs font-semibold text-foreground mb-3">📲 ntfy.sh push topic</h4>
        <p className="text-[11px] text-muted-foreground mb-2">
          Free push notifications to your phone. Pick a unique topic name (random characters work best),
          install the <a href="https://ntfy.sh" target="_blank" rel="noopener" className="text-violet-400 underline">ntfy app</a>, subscribe to your topic.
          The Push quick-action will deliver to that topic instantly.
        </p>
        <input type="text" value={ntfy} onChange={e => setNtfy(e.target.value)} placeholder="e.g. kranthi-thq-x7p2q"
          className="w-full bg-background border border-border/40 rounded-md px-3 py-1.5 text-xs font-mono outline-none focus:border-pink-500/60" />
      </div>

      <div className="bg-card pr-tint-coral p-4">
        <h4 className="text-xs font-semibold text-foreground mb-3">🔔 Local reminder times</h4>
        <p className="text-[11px] text-muted-foreground mb-2">When the Notify quick-action runs, it will also fire reminders at these times today (while the tab is open).</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {times.map((t, i) => (
            <input key={i} type="time" value={t}
              onChange={e => { const copy = [...times]; copy[i] = e.target.value; setTimes(copy) }}
              className="bg-background border border-border/40 rounded-md px-2 py-1.5 text-[11px] font-mono outline-none focus:border-orange-500/60" />
          ))}
        </div>
      </div>

      <div className="bg-card pr-tint-violet p-4">
        <h4 className="text-xs font-semibold text-foreground mb-3">🚩 Journey start date</h4>
        <p className="text-[11px] text-muted-foreground mb-2">The Day-N counter on Today counts from this date.</p>
        <input type="date" value={start} onChange={e => setStart(e.target.value)}
          className="bg-background border border-border/40 rounded-md px-3 py-1.5 text-xs outline-none focus:border-violet-500/60" />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={save} className="px-4 py-2 rounded-md bg-violet-500/30 border border-violet-500/50 text-[12px] font-semibold text-foreground hover:bg-violet-500/40 transition-colors">
          {saved || 'Save settings'}
        </button>
        <button onClick={exportData} className="px-4 py-2 rounded-md bg-background border border-border/50 text-[12px] text-foreground hover:bg-foreground/5 transition-colors">
          ⬇ Export backup
        </button>
        <label className="px-4 py-2 rounded-md bg-background border border-border/50 text-[12px] text-foreground hover:bg-foreground/5 transition-colors cursor-pointer">
          ⬆ Import backup
          <input type="file" accept="application/json" onChange={importData} className="hidden" />
        </label>
        <button onClick={resetAll} className="ml-auto px-4 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-[12px] text-red-400 hover:bg-red-500/20 transition-colors">
          🗑 Reset all data
        </button>
      </div>
    </div>
  )
}
