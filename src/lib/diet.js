// Kranthi's 100-Day Lean Diet — Week 1 (repeats). Two meals a day: Meal 1 at
// ~11 AM, Meal 2 at ~6 PM. Data only; the Diet tab in TransformationHQ renders
// it and tracks daily check-offs (localStorage "thq:meals:<date>").

export const MEAL_TIMES = { m1: '11 AM', m2: '6 PM' }

// Salad / bowl legend — what goes in each.
export const SALADS = {
  'Indian Chana Crunch': 'Black chana, bell peppers, carrot, onion, pumpkin seeds, coriander, mint, lemon',
  'Paneer Tikka': 'Paneer, bell peppers, onion, zucchini, hung curd, mint, coriander',
  'South Indian Power Bowl': 'Broccoli, green beans, zucchini, peanuts, curry leaves, mustard seeds',
  'Mexican Bowl': 'Bell peppers, lettuce, black chana, avocado, jalapeños, lime',
  'Mediterranean': 'Paneer, bell peppers, lettuce, olives, onion, oregano',
  'Thai Crunch Bowl': 'Zucchini, carrot, bell peppers, peanuts, mint, coriander',
  'Superfood Bowl': 'Broccoli, bell peppers, carrot, black chana, pumpkin seeds, sunflower seeds',
  "Chef's Choice": 'Your pick — any of the bowls above, or improvise within the macros',
}

// Each meal: items (emoji + text) + the salad/bowl that completes it.
// Ordered Monday → Sunday; `dow` is JS getDay() (Sun=0 … Sat=6).
export const WEEK = [
  {
    dow: 1, day: 'Monday',
    m1: { salad: 'Indian Chana Crunch', items: [
      { e: '🍗', t: '150g Grilled Chicken' }, { e: '🥚', t: '3 Whole Eggs' },
      { e: '🥣', t: '200g Greek Yogurt' }, { e: '💪', t: '1 Scoop Whey' }, { e: '🫒', t: '10g Olive Oil' } ] },
    m2: { salad: null, items: [
      { e: '🍗', t: '150g Grilled Chicken' }, { e: '🧀', t: '100g Low-fat Paneer' },
      { e: '🥦', t: 'Broccoli (100g)' }, { e: '🫛', t: 'Green Beans (100g)' },
      { e: '🌰', t: '15g Almonds' }, { e: '🫒', t: '10g Olive Oil' } ] },
  },
  {
    dow: 2, day: 'Tuesday',
    m1: { salad: 'Paneer Tikka', items: [
      { e: '🍗', t: '150g Lemon Herb Chicken' }, { e: '🥚', t: '3 Whole Eggs' },
      { e: '🥣', t: '200g Greek Yogurt' }, { e: '💪', t: '1 Scoop Whey' }, { e: '🫒', t: '10g Olive Oil' } ] },
    m2: { salad: 'Mediterranean', items: [
      { e: '🍗', t: '150g Grilled Chicken (or Fish)' }, { e: '🧀', t: '100g Low-fat Paneer' },
      { e: '🌰', t: '15g Pumpkin Seeds' }, { e: '🫒', t: '10g Olive Oil' } ] },
  },
  {
    dow: 3, day: 'Wednesday',
    m1: { salad: 'South Indian Power Bowl', items: [
      { e: '🍗', t: '150g Peri Peri Chicken' }, { e: '🥚', t: '3 Whole Eggs' },
      { e: '🥣', t: '200g Greek Yogurt' }, { e: '💪', t: '1 Scoop Whey' }, { e: '🫒', t: '10g Olive Oil' } ] },
    m2: { salad: null, items: [
      { e: '🍗', t: '150g Grilled Chicken' }, { e: '🧀', t: '100g Low-fat Paneer' },
      { e: '🥦', t: 'Broccoli + Green Beans' }, { e: '🌰', t: '15g Walnuts' }, { e: '🫒', t: '10g Olive Oil' } ] },
  },
  {
    dow: 4, day: 'Thursday',
    m1: { salad: 'Mexican Bowl', items: [
      { e: '🍗', t: '150g Tandoori Chicken' }, { e: '🥚', t: '3 Whole Eggs' },
      { e: '🥣', t: '200g Greek Yogurt' }, { e: '💪', t: '1 Scoop Whey' }, { e: '🫒', t: '10g Olive Oil' } ] },
    m2: { salad: 'Indian Chana Crunch', items: [
      { e: '🍗', t: '150g Grilled Chicken' }, { e: '🧀', t: '100g Low-fat Paneer' },
      { e: '🌰', t: '15g Almonds' }, { e: '🫒', t: '10g Olive Oil' } ] },
  },
  {
    dow: 5, day: 'Friday',
    m1: { salad: 'Mediterranean', items: [
      { e: '🍗', t: '150g Garlic Herb Chicken' }, { e: '🥚', t: '3 Whole Eggs' },
      { e: '🥣', t: '200g Greek Yogurt' }, { e: '💪', t: '1 Scoop Whey' }, { e: '🫒', t: '10g Olive Oil' } ] },
    m2: { salad: 'Paneer Tikka', items: [
      { e: '🍗', t: '150g Grilled Chicken (or Fish)' }, { e: '🧀', t: '100g Low-fat Paneer' },
      { e: '🌰', t: '15g Pumpkin Seeds' }, { e: '🫒', t: '10g Olive Oil' } ] },
  },
  {
    dow: 6, day: 'Saturday',
    m1: { salad: 'Thai Crunch Bowl', items: [
      { e: '🍗', t: '150g Cajun Chicken' }, { e: '🥚', t: '3 Whole Eggs' },
      { e: '🥣', t: '200g Greek Yogurt' }, { e: '💪', t: '1 Scoop Whey' }, { e: '🫒', t: '10g Olive Oil' } ] },
    m2: { salad: 'South Indian Power Bowl', items: [
      { e: '🍗', t: '150g Grilled Chicken' }, { e: '🧀', t: '100g Low-fat Paneer' },
      { e: '🌰', t: '15g Walnuts' }, { e: '🫒', t: '10g Olive Oil' } ] },
  },
  {
    dow: 0, day: 'Sunday',
    m1: { salad: 'Superfood Bowl', items: [
      { e: '🍗', t: '150g Grilled Chicken' }, { e: '🥚', t: '3 Whole Eggs' },
      { e: '🥣', t: '200g Greek Yogurt' }, { e: '💪', t: '1 Scoop Whey' }, { e: '🫒', t: '10g Olive Oil' } ] },
    m2: { salad: "Chef's Choice", items: [
      { e: '🍗', t: '150g Chicken (or Fish)' }, { e: '🧀', t: '100g Low-fat Paneer' },
      { e: '🌰', t: 'Mixed Nuts (15g)' }, { e: '🫒', t: '10g Olive Oil' } ] },
  },
]

// Approximate daily nutrition.
export const NUTRITION = [
  { label: 'calories', value: '1500–1600', unit: 'kcal' },
  { label: 'protein',  value: '145–155',   unit: 'g' },
  { label: 'carbs',    value: '40–50',     unit: 'g' },
  { label: 'fat',      value: '65–70',     unit: 'g' },
  { label: 'fiber',    value: '30–35',     unit: 'g' },
]

export const dayByDow = (dow) => WEEK.find(d => d.dow === dow) || WEEK[0]
export const todayPlan = () => dayByDow(new Date().getDay())
