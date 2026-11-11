import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// The meal plan page (#/meals): a seven-day Indian plan that opens on today.
// Rice, chicken, fish, dal and vegetables are cooked weights; oats, flour,
// nuts and seeds are dry. Colours come from the site theme, so the page
// follows the light/dark toggle like every other page.

const ACCENT = '#f59e0b'
const tint = (c, p = 55) => `color-mix(in oklab, ${c} ${p}%, var(--color-foreground))`
const wash = (c, p = 14) => `color-mix(in oklab, ${c} ${p}%, transparent)`
const CARD = { border: '1px solid var(--color-border)', background: 'color-mix(in oklab, var(--color-card) 55%, transparent)' }
const RULE = '1px solid color-mix(in oklab, var(--color-border) 70%, transparent)'
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '')

const GROUPS = {
  P: { label: 'Protein', color: '#ef4444' },
  D: { label: 'Dairy', color: '#38bdf8' },
  C: { label: 'Grains', color: '#eab308' },
  L: { label: 'Dal and legumes', color: '#f97316' },
  V: { label: 'Vegetables', color: '#22c55e' },
  F: { label: 'Fruit', color: '#ec4899' },
  N: { label: 'Nuts and seeds', color: '#a78bfa' },
}

const MEALS = [
  { id: 'b', label: 'Breakfast', icon: '🌅', color: '#f59e0b' },
  { id: 'l', label: 'Lunch', icon: '☀️', color: '#22c55e' },
  { id: 's', label: 'Snack', icon: '🍎', color: '#ec4899' },
  { id: 'd', label: 'Dinner', icon: '🌙', color: '#8b5cf6' },
]

const ROTIS = ['C', 'Rotis', '2 · 70 g flour']

// Each meal is [title, items]; each item is [group, food, quantity].
// `prep` is what to do that evening for the next day.
const DAYS = [
  {
    name: 'Monday', short: 'Mon', theme: 'Chicken, eggs and leafy greens',
    kcal: '2,350', p: '125', c: '285', f: '75', fi: '35',
    b: ['Overnight oats and eggs', [['C', 'Oats', '60 g'], ['D', 'Greek yoghurt', '200 g'], ['F', 'Banana', '100 g'], ['N', 'Chia seeds', '10 g'], ['P', 'Eggs', '2']]],
    l: ['Chicken, rice, dal and spinach', [['P', 'Chicken', '150 g'], ['C', 'Rice', '200 g'], ['L', 'Dal', '150 g'], ['V', 'Spinach', '100 g']]],
    s: ['Milk, guava and almonds', [['D', 'Milk', '250 ml'], ['F', 'Guava', '150 g'], ['N', 'Almonds', '15 g']]],
    d: ['Rotis, paneer and vegetables', [ROTIS, ['P', 'Paneer', '100 g'], ['V', 'Mixed vegetables', '200 g'], ['D', 'Curd', '100 g']]],
    prep: { icon: '💧', t: 'Soak the rajma for {next}’s lunch.' },
  },
  {
    name: 'Tuesday', short: 'Tue', theme: 'Chicken, legumes and colourful vegetables',
    kcal: '2,350', p: '120', c: '290', f: '72', fi: '36',
    b: ['Masala omelette and toast', [['P', 'Eggs', '3'], ['C', 'Whole-wheat toast', '80 g'], ['D', 'Milk', '200 ml'], ['F', 'Orange', '150 g']]],
    l: ['Chicken, rajma and rice', [['P', 'Chicken', '150 g'], ['C', 'Rice', '180 g'], ['L', 'Rajma', '150 g'], ['V', 'Carrot and cucumber salad', 'a side']]],
    s: ['Yoghurt, apple and pumpkin seeds', [['D', 'Greek yoghurt', '200 g'], ['N', 'Pumpkin seeds', '15 g'], ['F', 'Apple', '150 g']]],
    d: ['Moong dal khichdi and paneer', [['L', 'Moong dal khichdi', 'rice 100 g + dal 150 g'], ['P', 'Paneer', '100 g'], ['V', 'Vegetables', '200 g'], ['D', 'Curd', '100 g']]],
    prep: null,
  },
  {
    name: 'Wednesday', short: 'Wed', theme: 'Chicken and millet',
    kcal: '2,300', p: '125', c: '275', f: '72', fi: '34',
    b: ['Ragi dosa, eggs and sambar', [['C', 'Ragi dosa', '70 g ragi flour'], ['P', 'Eggs', '2'], ['L', 'Sambar', '150 g'], ['D', 'Curd', '100 g']]],
    l: ['Chicken, chana dal and beans', [['P', 'Chicken', '150 g'], ['C', 'Rice', '180 g'], ['L', 'Chana dal', '150 g'], ['V', 'Beans', '100 g']]],
    s: ['Yoghurt, papaya and walnuts', [['D', 'Greek yoghurt', '200 g'], ['N', 'Walnuts', '15 g'], ['F', 'Papaya', '150 g']]],
    d: ['Rotis, chicken and palak', [ROTIS, ['P', 'Chicken', '100 g'], ['V', 'Palak curry', '150 g'], ['D', 'Curd', '100 g']]],
    prep: { icon: '🥣', t: 'Make {next}’s overnight oats: oats, milk and Greek yoghurt with the dates and flaxseed, chilled overnight.' },
  },
  {
    name: 'Thursday', short: 'Thu', theme: 'Chicken and calcium-rich foods',
    kcal: '2,350', p: '120', c: '280', f: '78', fi: '35',
    b: ['Overnight oats with dates and flaxseed', [['C', 'Oats', '60 g'], ['D', 'Milk', '250 ml'], ['D', 'Greek yoghurt', '150 g'], ['F', 'Dates', '20 g'], ['N', 'Flaxseed', '10 g']]],
    l: ['Chicken, masoor dal and amaranth', [['P', 'Chicken', '150 g'], ['C', 'Rice', '200 g'], ['L', 'Masoor dal', '150 g'], ['V', 'Amaranth leaves', '100 g']]],
    s: ['Eggs, banana and pumpkin seeds', [['P', 'Eggs', '2'], ['F', 'Banana', '100 g'], ['N', 'Pumpkin seeds', '15 g']]],
    d: ['Paneer, rotis and vegetables', [['P', 'Paneer', '150 g'], ROTIS, ['V', 'Mixed vegetables', '200 g'], ['D', 'Curd', '100 g']]],
    prep: { icon: '💧', t: 'Soak the chickpeas for {next}’s chole.' },
  },
  {
    name: 'Friday', short: 'Fri', theme: 'Chicken, eggs and legumes',
    kcal: '2,350', p: '125', c: '285', f: '75', fi: '36',
    b: ['Egg bhurji on toast', [['P', 'Egg bhurji', '3 eggs'], ['C', 'Whole-wheat toast', '80 g'], ['D', 'Milk', '200 ml'], ['F', 'Guava', '100 g']]],
    l: ['Chicken, chole and spinach', [['P', 'Chicken', '150 g'], ['C', 'Rice', '180 g'], ['L', 'Chole', '150 g'], ['V', 'Spinach', '100 g']]],
    s: ['Yoghurt, banana and almonds', [['D', 'Greek yoghurt', '200 g'], ['N', 'Almonds', '15 g'], ['F', 'Banana', '100 g']]],
    d: ['Chicken, rotis and vegetables', [['P', 'Chicken', '100 g'], ROTIS, ['V', 'Vegetables', '200 g'], ['D', 'Curd', '150 g']]],
    prep: { icon: '🛒', t: 'Buy 200–250 g of sardines or Indian mackerel for {next}’s lunch.' },
  },
  {
    name: 'Saturday', short: 'Sat', theme: 'Fish day',
    kcal: '2,350', p: '115–125', c: '275', f: '80', fi: '32',
    b: ['Oats, eggs and banana', [['C', 'Oats', '60 g'], ['D', 'Milk', '250 ml'], ['P', 'Eggs', '2'], ['F', 'Banana', '100 g']]],
    l: ['Oily fish with rice and dal', [['P', 'Sardines or Indian mackerel', '180 g'], ['C', 'Rice', '200 g'], ['L', 'Dal', '100 g'], ['V', 'Vegetables', '150 g']]],
    s: ['Yoghurt, orange and walnuts', [['D', 'Greek yoghurt', '200 g'], ['N', 'Walnuts', '15 g'], ['F', 'Orange', '150 g']]],
    d: ['Paneer, rotis and moong dal', [['P', 'Paneer', '120 g'], ROTIS, ['L', 'Moong dal', '100 g'], ['V', 'Vegetables', '200 g']]],
    prep: { icon: '💧', t: 'Soak the rajma for {next}’s lunch.' },
  },
  {
    name: 'Sunday', short: 'Sun', theme: 'Diverse, balanced meals',
    kcal: '2,350', p: '120', c: '285', f: '75', fi: '35',
    b: ['Oats omelette and papaya', [['P', 'Eggs', '3'], ['C', 'Oats', '50 g'], ['D', 'Milk', '200 ml'], ['F', 'Papaya', '150 g']]],
    l: ['Chicken, rajma and rice', [['P', 'Chicken', '150 g'], ['C', 'Rice', '200 g'], ['L', 'Rajma', '120 g'], ['V', 'Vegetables', '150 g']]],
    s: ['Yoghurt, apple and pumpkin seeds', [['D', 'Greek yoghurt', '200 g'], ['N', 'Pumpkin seeds', '15 g'], ['F', 'Apple', '150 g']]],
    d: ['Paneer, rotis, dal and vegetables', [['P', 'Paneer', '120 g'], ROTIS, ['L', 'Dal', '100 g'], ['V', 'Mixed vegetables', '200 g']]],
    prep: { icon: '🥣', t: 'Make {next}’s overnight oats: oats, Greek yoghurt and chia, chilled overnight. Add the banana in the morning.' },
  },
]

const TARGETS = [
  ['Calories', '2,300–2,400', 'kcal'],
  ['Protein', '110–125', 'g'],
  ['Fat', '70–85', 'g'],
  ['Fibre', '30–40', 'g'],
]

// Weekly amounts. Eggs, curd, bread, ragi flour and chicken follow the meals
// above: 17 eggs, about 650 g curd, 160 g toast, 70 g ragi flour and about
// 1.1 kg cooked chicken, which is roughly 1.4–1.5 kg raw.
const SHOP = [
  ['chicken', 'Chicken, boneless', '1.4–1.5 kg raw', 'about 1.1 kg cooked across the week'],
  ['fish', 'Sardines or Indian mackerel', '200–250 g raw'],
  ['eggs', 'Eggs', '17–18'],
  ['greek', 'Greek yoghurt', '1.3–1.5 kg'],
  ['curd', 'Curd', '650–700 g'],
  ['milk', 'Milk', '1.5–2 litres'],
  ['paneer', 'Paneer', '500–600 g'],
  ['dal', 'Dal and legumes, dry', '500–600 g', 'combined'],
  ['oats', 'Oats', '250–300 g'],
  ['rice', 'Rice, dry', '600–700 g'],
  ['atta', 'Whole-wheat flour', '500–600 g'],
  ['ragi', 'Ragi flour', '70 g'],
  ['bread', 'Whole-wheat bread', '160 g'],
  ['fruit', 'Fruit', '2 servings a day'],
  ['veg', 'Vegetables', '400–500 g a day'],
  ['nuts', 'Almonds, walnuts and seeds', '200–250 g', 'combined'],
]

// Daily reference values for an adult man, mainly ICMR–NIN 2020.
const NUTRIENTS = [
  ['Protein', '110–125 g target', 'Chicken, eggs, fish, paneer, dal'],
  ['Fibre', '30–40 g', 'Oats, fruit, vegetables, legumes'],
  ['Calcium', '1,000 mg', 'Milk, curd, yoghurt, paneer, ragi'],
  ['Magnesium', '440 mg', 'Pumpkin seeds, almonds, oats, legumes'],
  ['Iron', '19 mg', 'Dal, chana, spinach, eggs'],
  ['Zinc', '17 mg', 'Chicken, eggs, dairy, pumpkin seeds'],
  ['Iodine', '140–150 µg', 'Iodised salt, dairy, fish'],
  ['Vitamin A', '1,000 µg', 'Spinach, carrots, pumpkin, eggs'],
  ['Vitamin C', '80 mg', 'Guava, orange, papaya, vegetables'],
  ['Vitamin D', '600 IU', 'Eggs and fish contribute; food alone rarely covers it'],
  ['Vitamin E', 'Around 10–15 mg', 'Almonds, sunflower seeds, vegetable oils'],
  ['Vitamin K', 'Around 55 µg', 'Spinach, amaranth and other leafy greens'],
  ['B1 (thiamine)', '1.8 mg', 'Whole grains, legumes, seeds'],
  ['B2 (riboflavin)', '2.5 mg', 'Milk, yoghurt, eggs'],
  ['B3 (niacin)', '18 mg', 'Chicken, peanuts, whole grains'],
  ['B5 (pantothenic acid)', 'Around 5 mg (AI)', 'Chicken, eggs, mushrooms'],
  ['B6', '2.4 mg', 'Chicken, banana, chickpeas'],
  ['B7 (biotin)', '30 µg (AI)', 'Eggs, nuts, legumes'],
  ['B9 (folate)', '300 µg', 'Spinach, dal, chana'],
  ['B12', '2.2 µg', 'Eggs, chicken, fish, dairy'],
  ['Choline', '550 mg (AI)', 'Eggs, chicken, dairy'],
]

const WORTH = [
  ['🐟', 'Omega-3 (EPA and DHA)', 'One oily-fish meal a week adds useful omega-3. Chia, flaxseed and walnuts provide ALA, but the body converts little of it to EPA and DHA. If you want to keep fish to once a week, ask a doctor whether an algae-based omega-3 supplement makes sense.'],
  ['🧂', 'Iodine', 'Use ordinary iodised salt in moderate amounts, and store it sealed and away from moisture.'],
]

const MUSCLE = [
  'Strength train consistently, ideally 3–4 days a week.',
  'Spread protein across 3–4 meals instead of eating most of it at dinner.',
  'Aim for about 25–35 g of protein at each main meal.',
  'Keep your body weight steady at first.',
  'If your weekly average weight falls for two weeks in a row, add about 100–150 kcal a day.',
  'Track strength progression, waist measurement and recovery.',
]

const SHOP_KEY = 'meals-shop-v1'
const dayIndex = (d) => (d.getDay() + 6) % 7
const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` }
const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d) }
const fmt = (d, opts) => d.toLocaleDateString('en-GB', opts)
const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Today's date as a key, refreshed after midnight and when the tab returns.
function useTodayKey() {
  const [key, setKey] = useState(dayKey)
  useEffect(() => {
    const tick = () => setKey(dayKey())
    const id = setInterval(tick, 60000)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('focus', tick)
    }
  }, [])
  return key
}

function DayTabs({ sel, today, dates, onPick, barRef }) {
  const btns = useRef([])
  const onKey = (e) => {
    const next = { ArrowRight: (sel + 1) % 7, ArrowLeft: (sel + 6) % 7, Home: 0, End: 6 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    onPick(next)
    btns.current[next]?.focus()
  }
  return (
    <div
      ref={barRef}
      className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2.5 mb-5"
      style={{ background: 'color-mix(in oklab, var(--color-background) 88%, transparent)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderBottom: RULE }}
    >
      <div role="tablist" aria-label="Day of the week" className="grid grid-cols-7 gap-1.5" onKeyDown={onKey}>
        {DAYS.map((d, i) => {
          const on = i === sel
          return (
            <button
              key={d.short}
              ref={(el) => { btns.current[i] = el }}
              type="button"
              role="tab"
              id={`meal-tab-${i}`}
              aria-label={`${d.name} ${fmt(dates[i], { day: 'numeric', month: 'long' })}${i === today ? ', today' : ''}`}
              aria-controls="meal-day"
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              onClick={() => onPick(i)}
              className="relative min-w-0 flex flex-col items-center gap-1 rounded-xl pt-2 pb-3 transition-colors"
              style={on
                ? { background: ACCENT, color: '#1f1400' }
                : { background: 'color-mix(in oklab, var(--color-foreground) 5%, transparent)', color: 'var(--mp-muted)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide leading-none">{d.short}</span>
              <span className="text-[16px] font-bold tabular-nums leading-none" style={on ? undefined : { color: 'var(--color-foreground)' }}>
                {dates[i].getDate()}
              </span>
              {i === today && (
                <span aria-hidden="true" className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: on ? '#1f1400' : ACCENT }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MealCard({ meal, data }) {
  const [title, items] = data
  return (
    <article className="rounded-2xl p-4" style={CARD}>
      <div className="flex items-center gap-2.5 mb-2">
        <span aria-hidden="true" className="w-8 h-8 rounded-xl grid place-items-center text-[16px]" style={{ background: wash(meal.color, 16) }}>{meal.icon}</span>
        <span className="text-[11px] font-mono font-semibold uppercase tracking-wider" style={{ color: tint(meal.color) }}>{meal.label}</span>
      </div>
      <h3 className="text-[17px] font-semibold leading-snug mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map(([g, food, qty]) => (
          <li key={food} className="flex items-baseline gap-2.5 text-[14px] leading-snug">
            <span aria-hidden="true" className="w-2 h-2 rounded-full flex-shrink-0 relative -top-px" style={{ background: GROUPS[g].color }} />
            <span className="flex-1 min-w-0"><span className="sr-only">{GROUPS[g].label}: </span>{food}</span>
            <span className="text-[12.5px] font-mono tabular-nums text-muted-foreground text-right">{qty}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}

function GroupLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted-foreground" aria-label="Food groups">
      {Object.values(GROUPS).map((g) => (
        <li key={g.label} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="w-2 h-2 rounded-full" style={{ background: g.color }} />
          {g.label}
        </li>
      ))}
    </ul>
  )
}

function DayPanel({ sel, today, dates, panelRef, onToday }) {
  const day = DAYS[sel]
  const next = DAYS[(sel + 1) % 7]
  const when = sel === today ? 'Today' : sel === (today + 1) % 7 ? 'Tomorrow' : null
  const date = fmt(dates[sel], { day: 'numeric', month: 'long' })
  return (
    <section id="meal-day" role="tabpanel" aria-labelledby={`meal-tab-${sel}`} ref={panelRef}>
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3 mb-3">
        <div className="min-w-0">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-wider mb-1" style={{ color: tint(ACCENT) }}>
            {when ? `${when} · ${date}` : date}
          </p>
          <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-tight">{day.name}</h2>
          <p className="text-[14px] text-muted-foreground mt-0.5">{day.theme}</p>
        </div>
        {sel !== today && (
          <button
            type="button"
            onClick={onToday}
            className="text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors hover:bg-foreground/5"
            style={{ color: tint(ACCENT), boxShadow: `inset 0 0 0 1px ${wash(ACCENT, 45)}` }}
          >
            Back to today
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[14px] font-semibold tabular-nums mr-1">≈ {day.kcal} kcal</span>
        {[['Protein', day.p], ['Carbs', day.c], ['Fat', day.f], ['Fibre', day.fi]].map(([k, v]) => (
          <span key={k} className="text-[12px] px-2.5 py-1 rounded-full tabular-nums text-muted-foreground" style={{ background: 'color-mix(in oklab, var(--color-foreground) 6%, transparent)' }}>
            {k} <b className="font-semibold text-foreground">{v} g</b>
          </span>
        ))}
      </div>

      {day.prep && (
        <div className="mt-4 rounded-2xl px-4 py-3 flex gap-3 items-start" style={{ background: wash(ACCENT, 10), boxShadow: `inset 0 0 0 1px ${wash(ACCENT, 35)}` }}>
          <span aria-hidden="true" className="text-[18px] leading-none mt-0.5">{day.prep.icon}</span>
          <p className="text-[14px] leading-relaxed">
            <b className="font-semibold" style={{ color: tint(ACCENT) }}>{sel === today ? 'Tonight' : `${day.name} evening`}:</b>{' '}
            {fill(day.prep.t, { next: next.name })}
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        {MEALS.map((m) => <MealCard key={m.id} meal={m} data={day[m.id]} />)}
      </div>

      <div className="mt-4 space-y-2.5">
        <GroupLegend />
        <p className="text-[12.5px] text-muted-foreground leading-relaxed">
          ⚖️ Rice, chicken, fish, dal and vegetables are cooked weights unless stated; oats, flour, nuts and seeds are dry.
          Use about 3–4 teaspoons of cooking oil across the day.
        </p>
      </div>
    </section>
  )
}

function Section({ id, kicker, title, lead, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-14 scroll-mt-20">
      {kicker && <p className="text-[11px] font-mono font-semibold uppercase tracking-wider mb-1" style={{ color: tint(ACCENT) }}>{kicker}</p>}
      <h2 id={`${id}-title`} className="text-[24px] sm:text-[26px] font-bold tracking-tight leading-tight mb-2">{title}</h2>
      {lead && <p className="text-[14px] text-muted-foreground leading-relaxed mb-4">{lead}</p>}
      {children}
    </section>
  )
}

function WeekOverview({ sel, today, onPick }) {
  const mark = (i) => (i === sel ? { background: wash(ACCENT, 9) } : undefined)
  return (
    <>
      <div className="hidden sm:block rounded-2xl overflow-hidden" style={CARD}>
        <table className="w-full text-[13px] leading-snug">
          <thead>
            <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-3 py-2.5 font-semibold">Day</th>
              {MEALS.map((m) => <th key={m.id} scope="col" className="px-3 py-2.5 font-semibold">{m.label}</th>)}
              <th scope="col" className="px-3 py-2.5 font-semibold text-right">kcal · protein</th>
            </tr>
          </thead>
          <tbody>
            {DAYS.map((d, i) => (
              <tr key={d.short} style={{ borderTop: RULE, ...mark(i) }}>
                <th scope="row" className="px-3 py-2.5 text-left align-top font-semibold whitespace-nowrap">
                  <button type="button" onClick={() => onPick(i)} className="underline decoration-dotted underline-offset-4 hover:decoration-solid">
                    {d.short}
                  </button>
                  {i === today && <span className="ml-1.5 text-[10px] font-mono uppercase tracking-wider" style={{ color: tint(ACCENT) }}>today</span>}
                </th>
                {MEALS.map((m) => <td key={m.id} className="px-3 py-2.5 align-top text-muted-foreground">{d[m.id][0]}</td>)}
                <td className="px-3 py-2.5 align-top text-right tabular-nums whitespace-nowrap">{d.kcal} · {d.p} g</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="sm:hidden space-y-2">
        {DAYS.map((d, i) => (
          <li key={d.short}>
            <button
              type="button"
              onClick={() => onPick(i)}
              className="w-full text-left rounded-2xl p-3.5 transition-colors"
              style={{ ...CARD, ...(i === sel ? { background: wash(ACCENT, 9), borderColor: wash(ACCENT, 45) } : null) }}
            >
              <span className="flex items-baseline justify-between gap-3 mb-1.5">
                <span className="font-semibold text-[15px]">
                  {d.name}
                  {i === today && <span className="ml-2 text-[10px] font-mono uppercase tracking-wider" style={{ color: tint(ACCENT) }}>today</span>}
                </span>
                <span className="text-[12px] font-mono tabular-nums text-muted-foreground">{d.kcal} kcal · {d.p} g</span>
              </span>
              {MEALS.map((m) => (
                <span key={m.id} className="flex gap-2 text-[13px] leading-snug py-0.5">
                  <span aria-hidden="true">{m.icon}</span>
                  <span className="text-muted-foreground"><span className="sr-only">{m.label}: </span>{d[m.id][0]}</span>
                </span>
              ))}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

function ShoppingList() {
  const [got, setGot] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(SHOP_KEY) || '[]')) } catch { return new Set() }
  })
  useEffect(() => {
    try { localStorage.setItem(SHOP_KEY, JSON.stringify([...got])) } catch {}
  }, [got])
  const toggle = (id) => setGot((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })
  const count = SHOP.filter(([id]) => got.has(id)).length
  return (
    <div className="rounded-2xl overflow-hidden" style={CARD}>
      <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ borderBottom: RULE }}>
        <p className="text-[13px] text-muted-foreground" aria-live="polite">{count} of {SHOP.length} in the basket</p>
        <button
          type="button"
          onClick={() => setGot(new Set())}
          disabled={!count}
          className="text-[12px] font-semibold px-3 py-1 rounded-full transition-colors hover:bg-foreground/5 disabled:opacity-40 disabled:hover:bg-transparent"
          style={{ boxShadow: 'inset 0 0 0 1px var(--color-border)' }}
        >
          Clear ticks
        </button>
      </div>
      <ul>
        {SHOP.map(([id, name, qty, note], i) => {
          const on = got.has(id)
          return (
            <li key={id} style={i ? { borderTop: RULE } : undefined}>
              <label className="flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors hover:bg-foreground/5">
                <input type="checkbox" checked={on} onChange={() => toggle(id)} className="mt-[3px] w-4 h-4 flex-shrink-0" style={{ accentColor: ACCENT }} />
                <span className="flex-1 min-w-0 text-[14px]">
                  <span className={on ? 'line-through text-muted-foreground' : undefined}>{name}</span>
                  {note && <span className="block text-[12px] text-muted-foreground">{note}</span>}
                </span>
                <span className="text-[12.5px] font-mono tabular-nums text-muted-foreground text-right">{qty}</span>
              </label>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function NutrientTable() {
  return (
    <div className="rounded-2xl overflow-x-auto" style={CARD}>
      <table className="w-full text-[13px] leading-snug">
        <thead>
          <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            <th scope="col" className="px-3 py-2.5 font-semibold">Nutrient</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">Daily reference</th>
            <th scope="col" className="px-3 py-2.5 font-semibold">Where it comes from</th>
          </tr>
        </thead>
        <tbody>
          {NUTRIENTS.map(([n, ref, src]) => (
            <tr key={n} style={{ borderTop: RULE }}>
              <th scope="row" className="px-3 py-2 text-left align-top font-semibold">{n}</th>
              <td className="px-3 py-2 align-top tabular-nums">{ref}</td>
              <td className="px-3 py-2 align-top text-muted-foreground">{src}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function MealPlan({ onBack }) {
  const todayKey = useTodayKey()
  const now = useMemo(() => fromKey(todayKey), [todayKey])
  const today = dayIndex(now)
  const dates = useMemo(
    () => DAYS.map((_, i) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - today + i)),
    [now, today],
  )

  const [sel, setSel] = useState(today)
  const lastToday = useRef(today)
  useEffect(() => {
    // After midnight, follow the new day unless another day was picked.
    if (lastToday.current === today) return
    setSel((s) => (s === lastToday.current ? today : s))
    lastToday.current = today
  }, [today])

  useEffect(() => {
    const prev = document.title
    document.title = 'Meal plan · Kranthi Kiran'
    return () => { document.title = prev }
  }, [])

  const barRef = useRef(null)
  const panelRef = useRef(null)
  const toPanel = useCallback((always) => {
    const el = panelRef.current
    if (!el) return
    const offset = (barRef.current?.offsetHeight || 0) + 12
    const top = el.getBoundingClientRect().top
    if (!always && top >= offset) return
    window.scrollTo({ top: window.scrollY + top - offset, behavior: reducedMotion() ? 'instant' : 'smooth' })
  }, [])
  const pick = useCallback((i) => { setSel(i); toPanel(false) }, [toPanel])
  const pickFromWeek = useCallback((i) => { setSel(i); toPanel(true) }, [toPanel])
  // The button disappears once today is showing, so hand focus to today's tab.
  const goToday = useCallback(() => {
    pick(today)
    requestAnimationFrame(() => document.getElementById(`meal-tab-${today}`)?.focus({ preventScroll: true }))
  }, [pick, today])

  const short = (d) => fmt(d, { day: 'numeric', month: 'short' })
  const range = dates[0].getMonth() === dates[6].getMonth()
    ? `${dates[0].getDate()}–${short(dates[6])}`
    : `${short(dates[0])} – ${short(dates[6])}`

  return (
    <div className="mp-root min-h-screen text-foreground" style={{ background: 'var(--color-background)' }}>
      {/* The site's muted grey sits just under 4.5:1 on the dark background;
          nudge it towards the foreground here so small print stays readable. */}
      <style>{'.mp-root{--mp-muted:color-mix(in oklab,var(--color-muted-foreground) 75%,var(--color-foreground))}.mp-root .text-muted-foreground{color:var(--mp-muted)}'}</style>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        <div className="flex items-center justify-between gap-3 mb-6">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back
          </button>
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums">This week · {range}</span>
        </div>

        <header className="mb-6">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-wider mb-2" style={{ color: tint(ACCENT) }}>Seven-day Indian meal plan</p>
          <h1 className="text-[32px] sm:text-[40px] font-bold tracking-tight leading-[1.1] mb-3">What to eat, day by day</h1>
          <p className="text-[15px] text-muted-foreground leading-relaxed max-w-2xl">
            Four meals a day built around chicken, eggs, dal, dairy and plenty of vegetables, with one fish day.
            It opens on today, with tonight’s prep for tomorrow.
          </p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TARGETS.map(([label, value, unit]) => (
            <div key={label} className="rounded-2xl px-3.5 py-3" style={CARD}>
              <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-1 text-[19px] font-bold tabular-nums leading-tight">
                {value} <span className="text-[13px] font-medium text-muted-foreground">{unit}</span>
              </p>
            </div>
          ))}
        </div>
        <p className="mt-2 mb-8 text-[12.5px] text-muted-foreground leading-relaxed">
          Daily targets: starting estimates for maintenance and muscle development. The real requirement depends on training and daily movement.
        </p>

        <DayTabs sel={sel} today={today} dates={dates} onPick={pick} barRef={barRef} />
        <DayPanel sel={sel} today={today} dates={dates} panelRef={panelRef} onToday={goToday} />

        <Section id="meal-week" kicker="Overview" title="The week at a glance" lead="Tap a day to open it.">
          <WeekOverview sel={sel} today={today} onPick={pickFromWeek} />
        </Section>

        <Section id="meal-shop" kicker="Shopping" title="What to buy each week" lead="Roughly what one week of this plan needs. Ticks are saved on this device.">
          <ShoppingList />
          <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed">
            Batch-cook chicken, dal and rice for a couple of days at a time. Refrigerate promptly, and freeze portions you won’t eat within a safe refrigerated storage period.
          </p>
        </Section>

        <Section
          id="meal-nutrients"
          kicker="Coverage"
          title="What the plan is designed to supply"
          lead="Daily reference values for an adult man, mainly from ICMR–NIN 2020 (AI is an adequate intake). Protein is set above the basic RDA to support muscle building."
        >
          <NutrientTable />
          <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed">
            This is a food-coverage design, not a laboratory-verified guarantee that every day reaches 100% of every micronutrient.
            Real amounts depend on varieties, brands, cooking methods and portion sizes; iron, zinc, vitamin E, calcium and magnesium deserve the most attention across the week.
          </p>
        </Section>

        <Section id="meal-worth" kicker="Worth knowing" title="Two nutrients to keep an eye on">
          <div className="grid sm:grid-cols-2 gap-3">
            {WORTH.map(([icon, title, text]) => (
              <article key={title} className="rounded-2xl p-4" style={CARD}>
                <h3 className="text-[17px] font-semibold leading-snug mb-1.5"><span aria-hidden="true" className="mr-2">{icon}</span>{title}</h3>
                <p className="text-[14px] text-muted-foreground leading-relaxed">{text}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section id="meal-muscle" kicker="Training" title="Building muscle on this plan">
          <ul className="space-y-2.5">
            {MUSCLE.map((t) => (
              <li key={t} className="flex gap-3 text-[14px] leading-relaxed">
                <span aria-hidden="true" className="mt-[8px] w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: ACCENT }} />
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-2xl px-4 py-3.5 text-[14px] leading-relaxed" style={{ background: wash(ACCENT, 10), boxShadow: `inset 0 0 0 1px ${wash(ACCENT, 35)}` }}>
            <b className="font-semibold" style={{ color: tint(ACCENT) }}>Start with two weeks.</b>{' '}
            Don’t treat the calorie figures as exact: calibrate the 2,300–2,400 kcal estimate against your real training and weight trend.
          </div>
        </Section>

        <p className="mt-14 text-[11.5px] text-muted-foreground text-center leading-relaxed">
          General nutrition information, not medical advice · quantities are approximate
        </p>
      </div>
    </div>
  )
}
