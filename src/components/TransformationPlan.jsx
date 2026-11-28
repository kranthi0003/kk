import React, { useEffect, useState } from 'react'

// The Lock-In page (#/transformation, the navbar's Lock-In button): this
// month's home workout and diet, as one week that repeats. Today's rows are
// highlighted. To change the plan, edit the lists below; they're written the
// way the plans were drafted ("exercise – sets; …" and "item; item").

const MONTH = { year: 2026, month: 11, label: 'December 2026' } // month counts from 0

const ACCENT = '#f97316'
const KIND = { upper: '#f43f5e', lower: '#38bdf8', recovery: '#22c55e', rest: '#94a3b8' }
const tint = (c, p = 55) => `color-mix(in oklab, ${c} ${p}%, var(--color-foreground))`
const wash = (c, p = 14) => `color-mix(in oklab, ${c} ${p}%, transparent)`
const CARD = { border: '1px solid var(--color-border)', background: 'color-mix(in oklab, var(--color-card) 55%, transparent)' }
const RULE = '1px solid color-mix(in oklab, var(--color-border) 70%, transparent)'
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

const WORKOUT = [
  ['Mon', 'Upper A', 'upper', 'DB floor press – 2×10; One-arm DB row – 2×10 each; DB shoulder press – 2×10; Lateral raises – 2×12; DB curls – 2×12', '10–15 min incline walk'],
  ['Tue', 'Lower A', 'lower', 'Goblet squat – 2×10; DB Romanian deadlift – 2×10; Reverse lunges – 2×8 each; Glute bridges – 2×12; Calf raises – 2×15', '10–15 min easy walk'],
  ['Wed', 'Recovery', 'recovery', 'Gentle mobility and stretching', 'Optional 15–20 min easy walk'],
  ['Thu', 'Upper B', 'upper', 'DB floor press – 2×10; One-arm DB row – 2×10 each; DB rear-delt raises – 2×12; Lateral raises – 2×12; Hammer curls – 2×12; Overhead triceps extensions – 2×10', '10–15 min incline walk'],
  ['Fri', 'Rest', 'rest', 'Full rest', 'None'],
  ['Sat', 'Lower B', 'lower', 'Goblet squat – 2×10; DB Romanian deadlift – 2×10; Reverse lunges – 2×8 each; Glute bridges – 2×12; Plank – 2×20–30 sec', '10–15 min easy walk'],
  ['Sun', 'Recovery', 'recovery', 'Rest or light stretching', 'Optional 15–20 min easy walk'],
].map(([day, name, kind, work, cardio]) => {
  // Training days are "exercise – sets" pairs; recovery and rest days are a note.
  const moves = work.includes(' – ') ? work.split(/;\s*/).map((m) => m.split(/\s+–\s+/)) : null
  return { day, name, kind, cardio, moves, note: moves ? null : work }
})

const MEALS = ['Breakfast', 'Lunch', 'Evening snack', 'Dinner']
const DIET = [
  ['Monday', '3 whole eggs; oats 50g; chia 10g; almonds 10g; cinnamon', 'Chicken breast 150g; cooked rice 100g; dal 150g; spinach 75g; carrot 75g; cucumber 100g; lemon', 'Roasted chana 40g; guava 150g; pumpkin seeds 10g', 'Calcium-set tofu 200g; 2 rotis (60g atta); beans 100g; capsicum 50g'],
  ['Tuesday', '3-egg omelette with onion 30g, tomato 50g, spinach 50g; 2 whole-wheat bread slices', 'Chicken breast 150g; rice 100g; moong dal 150g; broccoli 100g; carrot 50g', '2 boiled eggs; orange 150g; walnuts 10g', 'Soya chunks 50g dry; 2 rotis (60g atta); tomato 75g; capsicum 75g; onion 30g'],
  ['Wednesday', 'Oats 50g; 3 eggs; flaxseed 10g; banana 100g', 'Chicken breast 150g; rice 100g; masoor dal 150g; spinach 75g; beans 75g', 'Roasted chana 40g; amla 50g; pumpkin seeds 15g', 'Tofu 200g; 2 rotis (60g atta); mixed vegetables 150g'],
  ['Thursday', '3 eggs; 2 rotis (60g atta); guava 150g; chia 10g', 'Chicken breast 150g; rice 100g; dal 150g; beetroot 75g; carrot 75g', '2 boiled eggs; almonds 15g; orange 100g', 'Soya chunks 50g dry; 2 rotis (60g atta); spinach 75g; tomato 75g'],
  ['Friday', 'Oats 50g; 3 eggs; chia 10g; walnuts 10g', 'Chicken breast 150g; rice 100g; dal 150g; capsicum 75g; beans 75g', 'Roasted chana 40g; guava 150g; pumpkin seeds 10g', 'Tofu 200g; 2 rotis (60g atta); broccoli 100g; carrot 50g'],
  ['Saturday', '3 eggs; 2 whole-wheat bread slices; banana 100g; flaxseed 10g', 'Sardines or mackerel 180g; rice 100g; dal 150g; spinach 75g; cucumber 100g', 'Roasted chana 40g; orange 150g; walnuts 10g', 'Chicken breast 150g; 2 rotis (60g atta); mixed vegetables 150g'],
  ['Sunday', 'Oats 50g; 3 eggs; chia 10g; almonds 10g', 'Chicken breast 150g; rice 100g; rajma 150g; spinach 75g; carrot 75g', '2 boiled eggs; guava 150g; pumpkin seeds 10g', 'Tofu 200g; 2 rotis (60g atta); beans 100g; capsicum 50g'],
].map(([day, ...meals]) => ({ day, meals: meals.map((m) => m.split(/;\s*/).map(cap)) }))

const MICRO = [
  ['Amla or guava', '1 serving', 'Vitamin C'],
  ['Spinach / leafy greens', '100g', 'Folate, vitamin K, iron'],
  ['Pumpkin seeds', '15–20g', 'Magnesium, zinc'],
  ['Chia / flaxseed', '10g', 'Fibre, omega-3'],
  ['Calcium-set tofu', '150–200g', 'Calcium, protein'],
  ['Iodised salt', 'Moderate amount', 'Iodine'],
  ['Fatty fish', 'Once weekly or more', 'Omega-3, vitamin D, B12'],
]

// Monday is 0, like the plan.
const weekday = (d) => (d.getDay() + 6) % 7

// The current date, refreshed after midnight and when the tab comes back.
function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer = 0
    const arm = () => {
      clearTimeout(timer)
      const next = new Date()
      next.setHours(24, 0, 5, 0)
      timer = setTimeout(sync, next - Date.now())
    }
    const sync = () => { setNow(new Date()); arm() }
    const onShow = () => { if (document.visibilityState === 'visible') sync() }
    arm()
    document.addEventListener('visibilitychange', onShow)
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', onShow) }
  }, [])
  return now
}

function monthNote(now) {
  const start = new Date(MONTH.year, MONTH.month, 1)
  const days = new Date(MONTH.year, MONTH.month + 1, 0).getDate()
  if (now < start) return `Starts ${start.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`
  if (now.getFullYear() === MONTH.year && now.getMonth() === MONTH.month) return `Day ${now.getDate()} of ${days}`
  return null
}

// Today's row and card can be scrolled to and focused from the buttons up top.
const todayAttrs = (is, kind) => (is ? { 'data-today': kind, tabIndex: -1, 'aria-current': 'date' } : {})

// Muted text a touch brighter than the site default (which sits just under
// 4.5:1 on the dark background), and focus rings only for keyboard use.
const CSS = `.tp-root{--tp-muted:color-mix(in oklab,var(--color-muted-foreground) 75%,var(--color-foreground))}
.tp-root .text-muted-foreground{color:var(--tp-muted)}
.tp-root [data-today]{scroll-margin-top:16px}
.tp-root [data-today]:focus,.tp-root .tp-pill:focus{outline:none}
.tp-root [data-today]:focus-visible{outline:2px solid ${ACCENT};outline-offset:-2px}
.tp-root .tp-pill:focus-visible{outline:2px solid ${ACCENT};outline-offset:2px}`

function TodayTag({ block = false }) {
  return (
    <span className={`${block ? 'block mt-0.5' : 'ml-2'} text-[10px] font-mono font-semibold uppercase tracking-wider`} style={{ color: tint(ACCENT) }}>
      today
    </span>
  )
}

function Kind({ w }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: KIND[w.kind] }} />
      {w.name}
    </span>
  )
}

function Moves({ w, className = '' }) {
  if (!w.moves) return <p className="text-muted-foreground">{w.note}</p>
  return (
    <ul className={`space-y-1 ${className}`}>
      {w.moves.map(([name, sets]) => (
        <li key={name} className="flex items-baseline justify-between gap-4">
          <span>{name}</span>
          <span className="tabular-nums text-muted-foreground whitespace-nowrap">{sets}</span>
        </li>
      ))}
    </ul>
  )
}

function WorkoutWeek({ today }) {
  const lit = (i) => (i === today ? { background: wash(ACCENT, 9) } : null)
  return (
    <>
      <div className="hidden md:block rounded-2xl overflow-x-auto" style={CARD}>
        <table className="w-full text-[13.5px] leading-snug">
          <thead>
            <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-4 py-2.5 font-semibold w-[5.5rem]">Day</th>
              <th scope="col" className="px-4 py-2.5 font-semibold w-[8rem]">Workout</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">Exercises</th>
              <th scope="col" className="px-4 py-2.5 font-semibold w-[13rem]">Cardio</th>
            </tr>
          </thead>
          <tbody>
            {WORKOUT.map((w, i) => (
              <tr key={w.day} {...todayAttrs(i === today, 'workout')} style={{ borderTop: RULE, ...lit(i) }}>
                <th scope="row" className="px-4 py-3 text-left align-top font-semibold whitespace-nowrap">
                  {w.day}
                  {i === today && <TodayTag block />}
                </th>
                <td className="px-4 py-3 align-top font-medium whitespace-nowrap"><Kind w={w} /></td>
                <td className="px-4 py-3 align-top"><Moves w={w} className="max-w-[19rem]" /></td>
                <td className="px-4 py-3 align-top text-muted-foreground">{w.cardio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="md:hidden space-y-2">
        {WORKOUT.map((w, i) => (
          <li key={w.day} {...todayAttrs(i === today, 'workout')} className="rounded-2xl p-4"
            style={{ ...CARD, ...(i === today ? { background: wash(ACCENT, 9), borderColor: wash(ACCENT, 45) } : null) }}>
            <div className="flex items-baseline justify-between gap-3 mb-2.5">
              <h3 className="text-[15px] font-semibold">
                <span className="text-muted-foreground font-medium mr-2.5">{w.day}</span>
                <Kind w={w} />
              </h3>
              {i === today && <TodayTag />}
            </div>
            <div className="text-[13.5px] leading-snug"><Moves w={w} /></div>
            <p className="mt-2.5 pt-2.5 text-[12.5px] text-muted-foreground" style={{ borderTop: RULE }}>
              <span className="font-mono uppercase tracking-wider text-[10.5px] mr-2">Cardio</span>{w.cardio}
            </p>
          </li>
        ))}
      </ul>
    </>
  )
}

function DietWeek({ today }) {
  return (
    <>
      <div className="hidden md:block rounded-2xl overflow-x-auto" style={CARD}>
        <table className="w-full table-fixed text-[13px] leading-snug">
          <colgroup>
            <col className="w-[7rem]" />
            {MEALS.map((m) => <col key={m} />)}
          </colgroup>
          <thead>
            <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-3.5 py-2.5 font-semibold">Day</th>
              {MEALS.map((m) => <th key={m} scope="col" className="px-3.5 py-2.5 font-semibold">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {DIET.map((d, i) => (
              <tr key={d.day} {...todayAttrs(i === today, 'diet')}
                style={{ borderTop: RULE, ...(i === today ? { background: wash(ACCENT, 9) } : null) }}>
                <th scope="row" className="px-3.5 py-3 text-left align-top font-semibold">
                  {d.day}
                  {i === today && <TodayTag block />}
                </th>
                {d.meals.map((items, m) => (
                  <td key={MEALS[m]} className="px-3.5 py-3 align-top">
                    <ul className="space-y-0.5">
                      {items.map((it, k) => <li key={k}>{it}</li>)}
                    </ul>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="md:hidden space-y-2">
        {DIET.map((d, i) => (
          <li key={d.day} {...todayAttrs(i === today, 'diet')} className="rounded-2xl p-4"
            style={{ ...CARD, ...(i === today ? { background: wash(ACCENT, 9), borderColor: wash(ACCENT, 45) } : null) }}>
            <div className="flex items-baseline justify-between gap-3 mb-2.5">
              <h3 className="text-[15px] font-semibold">{d.day}</h3>
              {i === today && <TodayTag />}
            </div>
            <dl className="grid grid-cols-[5.25rem_1fr] gap-x-3 gap-y-2 text-[13.5px] leading-snug">
              {MEALS.map((label, m) => (
                <React.Fragment key={label}>
                  <dt className="pt-[3px] text-[10.5px] font-mono uppercase tracking-wider text-muted-foreground">{label}</dt>
                  <dd>{d.meals[m].join(' · ')}</dd>
                </React.Fragment>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}

function Micronutrients() {
  return (
    <>
      <div className="hidden sm:block rounded-2xl overflow-x-auto" style={CARD}>
        <table className="w-full text-[13.5px] leading-snug">
          <thead>
            <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-4 py-2.5 font-semibold">Food</th>
              <th scope="col" className="px-4 py-2.5 font-semibold text-right">Portion</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">Main nutritional benefit</th>
            </tr>
          </thead>
          <tbody>
            {MICRO.map(([food, portion, benefit]) => (
              <tr key={food} style={{ borderTop: RULE }}>
                <th scope="row" className="px-4 py-2.5 text-left font-medium">{food}</th>
                <td className="px-4 py-2.5 text-right tabular-nums whitespace-nowrap">{portion}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{benefit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="sm:hidden rounded-2xl overflow-hidden" style={CARD}>
        {MICRO.map(([food, portion, benefit], i) => (
          <li key={food} className="px-4 py-2.5" style={i ? { borderTop: RULE } : undefined}>
            <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
              <span className="font-medium">{food}</span>
              <span className="tabular-nums text-right">{portion}</span>
            </div>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">{benefit}</p>
          </li>
        ))}
      </ul>
    </>
  )
}

function Section({ id, title, lead, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-12">
      <h2 id={`${id}-title`} className="text-[23px] sm:text-[26px] font-bold tracking-tight leading-tight">{title}</h2>
      {lead && <p className="mt-1.5 text-[14px] text-muted-foreground">{lead}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function TransformationPlan({ onBack }) {
  const now = useNow()
  const today = weekday(now)
  const note = monthNote(now)

  useEffect(() => {
    const prev = document.title
    document.title = 'Workout and diet · Kranthi Kiran'
    return () => { document.title = prev }
  }, [])

  // Each day is drawn twice (a table row on wide screens, a card on phones),
  // so jump to whichever one is showing.
  const jump = (kind) => {
    const el = [...document.querySelectorAll(`[data-today="${kind}"]`)].find((n) => n.getClientRects().length > 0)
    if (!el) return
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: still ? 'instant' : 'smooth', block: 'start' })
    el.focus({ preventScroll: true })
  }

  const pill = 'tp-pill inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[13px] font-medium transition-colors'
  const pillStyle = { background: wash(ACCENT, 12), boxShadow: `inset 0 0 0 1px ${wash(ACCENT, 40)}` }

  return (
    <main className="tp-root min-h-screen text-foreground" style={{ background: 'var(--color-background)' }}>
      <style>{CSS}</style>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-20">
        <div className="flex items-center justify-between gap-3 mb-6">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back
          </button>
          {note && <span className="text-[11px] font-mono text-muted-foreground tabular-nums">{note}</span>}
        </div>

        <header>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-wider mb-2" style={{ color: tint(ACCENT) }}>Lock-In · {MONTH.label}</p>
          <h1 className="text-[32px] sm:text-[40px] font-bold tracking-tight leading-[1.1]">Home workout and diet</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => jump('workout')} className={pill} style={pillStyle}>
              <span aria-hidden="true">🏋️</span>Today: {WORKOUT[today].name}
            </button>
            <button type="button" onClick={() => jump('diet')} className={pill} style={pillStyle}>
              <span aria-hidden="true">🍽️</span>Today’s meals
            </button>
          </div>
        </header>

        <Section id="plan-workout" title="Home workout plan" lead="4 training days · 2 recovery days · 1 full rest day">
          <WorkoutWeek today={today} />
        </Section>

        <Section id="plan-diet" title="Diet">
          <DietWeek today={today} />
          <h3 className="mt-8 mb-3 text-[17px] font-semibold">Daily micronutrient additions</h3>
          <Micronutrients />
        </Section>

        <p className="mt-12 text-[11.5px] text-muted-foreground text-center">My own plan, shared as is · not medical or nutrition advice</p>
      </div>
    </main>
  )
}
