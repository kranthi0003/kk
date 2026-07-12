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

// ------- daily tracking ---------------------------------------------------
export function skinFor(dateKey = todayKey()) { return lsGet(`skin:${dateKey}`, { am: false, pm: false }) }
export function setSkin(dateKey, next) { lsSet(`skin:${dateKey}`, next) }
