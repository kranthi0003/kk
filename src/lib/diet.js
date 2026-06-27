// Kranthi's 100-Day Lean Diet (Week 1, repeats). Two meals a day:
//   Meal 1 ~11 AM (protein + a salad), Meal 2 ~6 PM (protein + a veg stir-fry).
// Data only; the Diet tab in TransformationHQ renders it and tracks daily
// check-offs in localStorage ("thq:meals:<date>" = {m1, m2}).

export const MEAL_TIMES = { m1: '11 AM', m2: '6 PM' }

// Salad legend for Meal 1 — what goes in each.
export const SALADS = {
  'Indian Chana Crunch Salad': 'Black chana, bell peppers, carrot, onion, pumpkin seeds, coriander, mint, lemon',
  'Paneer Tikka Salad': 'Paneer, bell peppers, onion, zucchini, hung curd, mint, coriander',
  'South Indian Power Bowl': 'Broccoli, green beans, zucchini, peanuts, curry leaves, mustard seeds',
  'Mexican Salad': 'Bell peppers, lettuce, black chana, avocado, jalapeños, lime',
  'Mediterranean Salad': 'Paneer, bell peppers, lettuce, olives, onion, oregano',
  'Thai Crunch Salad': 'Zucchini, carrot, bell peppers, peanuts, mint, coriander',
  'Superfood Salad': 'Broccoli, bell peppers, carrot, black chana, pumpkin seeds, sunflower seeds',
}

// Meal 1 is identical every day except the salad.
const M1 = (salad) => ({ salad, items: [
  { e: '🍗', t: '150g Grilled Chicken' }, { e: '🥚', t: '3 Whole Eggs' },
  { e: '🥣', t: '200g Greek Yogurt' }, { e: '💪', t: '1 Scoop Whey' },
] })

// Meal 2: protein + a day-specific veg stir-fry + nuts (no salad).
const M2 = (stir, nuts, chickenNote) => ({ salad: null, items: [
  { e: '🍗', t: '150g Grilled Chicken' + (chickenNote ? ' ' + chickenNote : '') },
  { e: '🧀', t: '100g Low-fat Paneer' },
  stir, nuts,
] })

// Ordered Monday -> Sunday; `dow` is JS getDay() (Sun=0 ... Sat=6).
export const WEEK = [
  { dow: 1, day: 'Monday',    m1: M1('Indian Chana Crunch Salad'), m2: M2({ e: '🥦', t: 'Broccoli + Green Beans stir-fry' },           { e: '🌰', t: '15g Almonds' }) },
  { dow: 2, day: 'Tuesday',   m1: M1('Paneer Tikka Salad'),        m2: M2({ e: '🫑', t: 'Bell Peppers + Zucchini stir-fry' },          { e: '🎃', t: '15g Pumpkin Seeds' }) },
  { dow: 3, day: 'Wednesday', m1: M1('South Indian Power Bowl'),   m2: M2({ e: '🥦', t: 'Broccoli + Carrot stir-fry (light on carrot)' }, { e: '🌰', t: '15g Walnuts' }) },
  { dow: 4, day: 'Thursday',  m1: M1('Mexican Salad'),             m2: M2({ e: '🫛', t: 'Green Beans + Bell Pepper stir-fry' },        { e: '🎃', t: '15g Pumpkin Seeds' }) },
  { dow: 5, day: 'Friday',    m1: M1('Mediterranean Salad'),       m2: M2({ e: '🥦', t: 'Broccoli + Zucchini stir-fry' },              { e: '🌰', t: '15g Almonds' }) },
  { dow: 6, day: 'Saturday',  m1: M1('Thai Crunch Salad'),         m2: M2({ e: '🥬', t: 'Mixed veg stir-fry (broccoli + beans + peppers)' }, { e: '🌰', t: '15g Walnuts' }) },
  { dow: 0, day: 'Sunday',    m1: M1('Superfood Salad'),           m2: M2({ e: '🥦', t: 'Mixed stir-fry vegetables' },                 { e: '🥜', t: '15g Mixed Nuts' }, '(or Fish occasionally)') },
]

// Approximate daily nutrition.
export const NUTRITION = [
  { label: 'calories', value: '1500–1600', unit: 'kcal' },
  { label: 'protein',  value: '145–155',   unit: 'g' },
  { label: 'carbs',    value: '40–50',     unit: 'g' },
  { label: 'fat',      value: '55–65',     unit: 'g' },
  { label: 'fiber',    value: '30–35',     unit: 'g' },
]

export const PLAN_DAYS = 100

// Build a one-week shopping list from the plan: measured staples are summed
// from the meal items; fresh produce / pantry is the de-duped set of salad
// ingredients (quantities to taste). Regenerates automatically if the plan changes.
export function weeklyGrocery() {
  const staples = {}
  const bump = (key, name, field, amt) => {
    staples[key] = staples[key] || { name, grams: null, count: null, scoops: null }
    staples[key][field] = (staples[key][field] || 0) + amt
  }
  WEEK.forEach(d => [d.m1, d.m2].forEach(meal => meal.items.forEach(({ t }) => {
    let m
    if ((m = t.match(/^(\d+)g\s+(.+)$/))) {
      const name = m[2].replace(/\s*\(.*?\)\s*/g, '').trim()
      bump(name.toLowerCase(), name, 'grams', +m[1])
    } else if ((m = t.match(/^(\d+)\s+Whole\s+Eggs?/i))) {
      bump('eggs', 'Whole Eggs', 'count', +m[1])
    } else if ((m = t.match(/^(\d+)\s+Scoop/i))) {
      bump('whey', 'Whey', 'scoops', +m[1])
    }
  })))
  const EXCLUDE = new Set(['paneer', 'hung curd', 'pumpkin seeds'])
  const produce = new Set()
  WEEK.forEach(d => {
    const s = SALADS[d.m1.salad]
    if (s) s.split(',').map(x => x.trim()).forEach(x => { if (x && !EXCLUDE.has(x.toLowerCase())) produce.add(x.toLowerCase()) })
  })
  return {
    staples: Object.values(staples),
    produce: [...produce].sort((a, b) => a.localeCompare(b)),
  }
}

export const dayByDow = (dow) => WEEK.find(d => d.dow === dow) || WEEK[0]
export const todayPlan = () => dayByDow(new Date().getDay())
