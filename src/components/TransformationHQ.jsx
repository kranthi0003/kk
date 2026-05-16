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
  { id: 'roadmap',  icon: '🗺️', label: 'Roadmap' },
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
export default function TransformationHQ() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('today')

  useEffect(() => {
    const h = () => setOpen(o => !o)
    window.addEventListener('toggle-transformation-hq', h)
    return () => window.removeEventListener('toggle-transformation-hq', h)
  }, [])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md" onClick={() => setOpen(false)} />
      <div
        className="fixed top-[3%] left-1/2 -translate-x-1/2 z-[151] w-[820px] max-w-[calc(100vw-1.5rem)] h-[94vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-card pr-tint-violet"
        style={{ animation: 'thq-in 0.28s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-foreground text-base font-semibold flex items-center gap-2">
              <span>🔥</span> Transformation HQ
            </h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Personal fitness OS · best shape by end of 2027</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-3 py-2 border-b border-border/30 flex-shrink-0 overflow-x-auto">
          <div className="flex gap-1">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium whitespace-nowrap transition-all ${
                  tab === t.id ? 'bg-foreground/10 text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
                }`}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
          {tab === 'today'    && <TodayTab />}
          {tab === 'schedule' && <ScheduleTab />}
          {tab === 'training' && <TrainingTab />}
          {tab === 'cardio'   && <CardioTab />}
          {tab === 'diet'     && <DietTab />}
          {tab === 'supps'    && <SuppsTab />}
          {tab === 'recovery' && <RecoveryTab />}
          {tab === 'tracker'  && <TrackerTab />}
          {tab === 'roadmap'  && <RoadmapTab />}
        </div>

        <div className="px-6 py-2 border-t border-border/30 text-center flex-shrink-0">
          <span className="text-[10px] text-muted-foreground/60">All data stored locally · no cloud · no judgment</span>
        </div>
      </div>

      <style>{`
        @keyframes thq-in {
          from { opacity: 0; transform: translateX(-50%) scale(0.96) translateY(-8px); }
          to   { opacity: 1; transform: translateX(-50%) scale(1)    translateY(0); }
        }
      `}</style>
    </>
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
    { key: 'morn',   label: `Morning: ${plan.morn}` },
    { key: 'eve',    label: `Evening: ${plan.eve}` },
    { key: 'water',  label: 'Hit 3L+ water' },
    { key: 'prot',   label: 'Hit protein target (150g+)' },
    { key: 'steps',  label: '8–10k steps' },
    { key: 'sleep',  label: 'Sleep by 11pm' },
  ]
  const done = checks.filter(c => log[c.key]).length
  const pct = Math.round((done / checks.length) * 100)

  return (
    <div className="space-y-5">
      <div className="bg-card pr-tint-magenta p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">Today · {day} · {plan.focus}</h3>
          <span className="text-xs font-mono text-muted-foreground">{done}/{checks.length} · {pct}%</span>
        </div>
        <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden mb-4">
          <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">{plan.notes}</p>
        <div className="space-y-1.5">
          {checks.map(c => (
            <label key={c.key} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="checkbox" checked={!!log[c.key]} onChange={e => update(c.key, e.target.checked)}
                className="w-4 h-4 rounded accent-violet-500" />
              <span className={`text-xs ${log[c.key] ? 'line-through text-muted-foreground/50' : 'text-foreground'}`}>{c.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-card pr-tint-violet p-4">
          <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">⚡ Energy low? Minimum viable day</h4>
          <ul className="space-y-1 text-[11px] text-muted-foreground">
            {MVP_DAY.map((m,i) => <li key={i} className="flex gap-1.5"><span className="text-violet-400">·</span>{m}</li>)}
          </ul>
        </div>
        <div className="bg-card pr-tint-coral p-4">
          <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">💡 Reminder of the day</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{REMINDERS[new Date().getDate() % REMINDERS.length]}</p>
        </div>
      </div>
    </div>
  )
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
        <p className="text-[11px] text-muted-foreground">Weigh + measure waist every Sunday 7am, fasted, post-bathroom. Plot the 4-week moving average — that\'s the truth. Day-to-day noise is meaningless.</p>
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
