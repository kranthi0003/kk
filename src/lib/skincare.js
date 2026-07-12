// ============================================================
// Skincare + "glow" system for Transformation HQ.
// A simple, evidence-based routine: protect in the AM, repair
// in the PM, plus weekly treatments and glow-from-within habits
// that overlap with the diet + training. Tracked daily in
// localStorage ("thq:skin:<date>" = { am, pm }).
// ============================================================
import { lsGet, lsSet, todayKey } from './fitness'

// Morning — brighten + protect. Sunscreen is the single biggest
// lever for glowing, even skin tone (blocks the damage that dulls it).
export const AM = [
  { step: 'Gentle cleanser', what: 'Splash of water or a mild gel cleanser', why: 'Wake the skin up without stripping it' },
  { step: 'Vitamin C serum', what: 'A few drops, whole face', why: 'Antioxidant — brightens, fades marks, evens tone' },
  { step: 'Moisturiser', what: 'Lightweight, non-greasy', why: 'Locks hydration → plump, dewy look' },
  { step: 'Sunscreen SPF 50', what: 'Two fingers, reapply if outdoors', why: '#1 for glow + anti-ageing. Non-negotiable, even indoors' },
]

// Evening — clean off the day and let actives do the repair while you sleep.
export const PM = [
  { step: 'Double cleanse', what: 'Oil/micellar first if you wore SPF or sweated, then face wash', why: 'Clears sweat, sunscreen, grime → fewer breakouts' },
  { step: 'Active (alternate)', what: 'Retinol 2–3 nights/wk · niacinamide or a hydrating serum on the others', why: 'Retinol = smoother texture + glow; niacinamide calms + controls oil' },
  { step: 'Moisturiser', what: 'Richer night cream', why: 'Repairs the skin barrier overnight' },
  { step: 'Lip balm + eye cream', what: 'Optional but nice', why: 'Small touches, big polish' },
]

// Do these on the clock — not every day.
export const WEEKLY = [
  { emoji: '✨', title: 'Exfoliate 1–2×', body: 'A BHA/AHA (or a scrub) to lift dead skin — instant smoothness and glow.' },
  { emoji: '🧖', title: 'Mask 1×', body: 'Clay if oily/congested, or a hydrating sheet mask for a dewy reset.' },
  { emoji: '🧴', title: 'Body care', body: 'Exfoliate + moisturise the body; SPF on any exposed skin. Glow is head-to-toe.' },
  { emoji: '💇', title: 'Grooming reset', body: 'Trim, tidy brows, clean nails. Sharp grooming reads as “glow” too.' },
]

// Glow is built from the inside — and most of it overlaps the diet + training.
export const GLOW = [
  ['💧 3 L water / day', 'Hydrated skin looks plump and clear; dehydration = dull + flaky'],
  ['😴 7–8 h sleep', 'Skin repairs and rebuilds collagen at night — this is “beauty sleep,” literally'],
  ['🥗 Omega-3 + colour', 'Walnuts, fish, flax + colourful veg (already in your diet) fight dullness & inflammation'],
  ['🚫 Less sugar & dairy', 'The two biggest dietary breakout drivers — the cut helps your skin too'],
  ['💦 Sweat daily, shower after', 'Training flushes skin with blood flow; rinsing sweat off fast prevents breakouts'],
  ['🍺 Limit alcohol', 'Dehydrates and puffs up the face — the cut de-bloats you'],
]

// One line for common mistakes → confidence the plan is right.
export const RULES = [
  'Introduce ONE new active at a time — patch test first',
  'Retinol only at night, and always wear SPF the next day',
  'Consistency beats expensive products — same routine, every day',
  'Don’t pick. Ever. Picking turns a spot into a month-long mark',
]

// ------- BODY — dark spots / hyperpigmentation ----------------------------
// Knees, elbows, neck, underarms and inner thighs darken from friction,
// dryness, sun and shaving — not "dirt". Same playbook everywhere: stop the
// cause, gently exfoliate, brighten, moisturise, and protect. Weeks, not days.
export const BODY_PIGMENTATION = [
  {
    area: '🦵 Knees & elbows',
    cause: 'Thick, dry skin plus friction (leaning, kneeling) piles up and darkens.',
    fix: [
      'Exfoliate with a lactic / glycolic-acid lotion 3×/week',
      'Urea or ceramide cream every night to soften the thick skin',
      'Stop leaning on elbows / kneeling on hard floors',
      'SPF when they see sun — elbows do',
    ],
    avoid: 'Hard dry scrubbing — it thickens and darkens the skin further.',
  },
  {
    area: '👕 Neck',
    cause: 'Sun + friction — but a velvety-dark neck can be acanthosis nigricans, a sign of insulin resistance.',
    fix: [
      'Daily SPF on the neck (almost everyone forgets it)',
      'Alpha-arbutin or kojic-acid + niacinamide serum, AM & PM',
      'Gentle exfoliation 2×/week',
      'Fix it at the root — the deficit + no-sugar foundation directly improves insulin-driven darkening',
    ],
    avoid: 'Ignoring a sudden velvety-dark neck — get your blood sugar / insulin checked by a doctor.',
  },
  {
    area: '🙆 Underarms & inner thighs',
    cause: 'Friction, shaving irritation and harsh deodorants — not hygiene.',
    fix: [
      'Switch the razor for a trimmer (or leave it) — shaving trauma darkens skin',
      'Alpha-arbutin / niacinamide roll-on or cream, daily',
      'Loose, breathable cotton — ditch tight synthetic fabric',
      'A gentle lactic-acid product 2–3×/week',
    ],
    avoid: 'Scrubbing raw, alum / harsh deodorants, and hydroquinone bleaching creams without a dermatologist.',
  },
]

// ------- HAIR — loss control ----------------------------------------------
// Hair moves in 3–6 month blocks; consistency wins. What you eat and how you
// sleep matter as much as anything you put on the scalp.
export const HAIR = {
  intro: 'Hair responds slowly — think in 3–6 month blocks. The foundation (protein, iron, vitamin D, sleep, stress) matters as much as anything topical.',
  routine: [
    { emoji: '🧴', title: 'Gentle wash', body: 'Sulfate-free shampoo, 2–3×/week. No scalding water, no daily washing.' },
    { emoji: '💆', title: 'Scalp massage 5 min', body: 'Daily — drives blood flow to the follicles. Do it dry or in the shower.' },
    { emoji: '🧪', title: 'Ketoconazole shampoo 2×/wk', body: 'Anti-fungal that also nudges scalp DHT down. Leave on 3–5 min.' },
    { emoji: '🩸', title: 'Derma-roller 0.5 mm weekly', body: 'Micro-needling can improve density + minoxidil uptake. Keep it clean, once a week only.' },
    { emoji: '💧', title: 'Minoxidil 5% (optional)', body: 'The best-evidenced OTC regrowth option. Expect an early shed, regrowth ~3–4 months. See a dermatologist first.' },
  ],
  within: [
    ['Protein at every meal', 'Hair is protein — a deficit shows up here first'],
    ['Iron / ferritin + vitamin D', 'Low levels are a common hidden cause of shedding — get bloods checked'],
    ['Manage stress + sleep', 'Stress shedding (telogen effluvium) is real, and reversible'],
    ['Don’t pull it tight', 'Tight caps, buns and constant touching cause traction loss'],
  ],
  caveat: 'Persistent or patchy loss, or a hairline you want to hold → see a dermatologist. Finasteride (prescription) is the other main evidence-based option and needs medical guidance.',
}

// ------- daily tracking ---------------------------------------------------
export function skinFor(dateKey = todayKey()) { return lsGet(`skin:${dateKey}`, { am: false, pm: false }) }
export function setSkin(dateKey, next) { lsSet(`skin:${dateKey}`, next) }
