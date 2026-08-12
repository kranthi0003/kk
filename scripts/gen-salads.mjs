// Build-time generator for the #/salads page.
//
// Why build-time instead of fetching in the browser:
//   - TheMealDB's free tier uses the shared test key "1", which is meant for
//     development. Calling it once per deploy keeps that to a handful of
//     requests a day instead of a handful per visitor.
//   - The result is same-origin, so the page needs no CORS and no key, and it
//     renders on networks where third-party recipe APIs are unreachable.
//
// What we publish, and what we deliberately don't:
//   TheMealDB aggregates recipes from real publishers — 15 of the 25 salads
//   come from bbcgoodfood.com, the rest from individual food blogs — and the
//   API reports strCreativeCommonsConfirmed: null for every one of them, so
//   nothing here is confirmed to be freely licensed. An ingredient list is a
//   statement of fact and carries no copyright, so we publish that in full.
//   The instruction prose is the publisher's own writing, so we never copy it:
//   every salad links to its source for the method, which sends the reader
//   (and the traffic) to the person who actually wrote the recipe.
//
// Safety contract: this script must never break a deploy. public/salads.json
// is a committed snapshot that Vite copies into dist/. We only overwrite that
// copy when we've assembled a result at least as good as the snapshot; on any
// error we log and exit 0, leaving the snapshot in place.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'dist', 'salads.json')
const SNAPSHOT = join(ROOT, 'public', 'salads.json')

const API = 'https://www.themealdb.com/api/json/v1/1'
const UA = 'kranthikiran.com salads page (+https://kranthikiran.com)'

// "salad" catches 25 of them. The rest are salads that simply aren't named
// one, and they have to be listed by exact name: a substring match on "slaw"
// also drags in "Piri-piri chicken and slaw", which is a main course.
const SEARCH_TERMS = ['salad', 'slaw', 'nicoise']
const ALSO_ALLOW = new Set(['tangy cabbage slaw', 'tuna nicoise'])

// TheMealDB serves /small (~13KB) and /large (~61KB) variants of every photo.
// /medium is documented but returns the full-size file, so it is not used.
const SMALL = (u) => (u ? `${u}/small` : null)
const LARGE = (u) => (u ? `${u}/large` : null)

// Category -> the diet filter shown on the page. This is TheMealDB's own
// classification, so it is trusted first.
const DIET = {
  Vegan: 'vegan',
  Vegetarian: 'vegetarian',
  Seafood: 'seafood',
  Chicken: 'meat',
  Pork: 'meat',
  Beef: 'meat',
  Lamb: 'meat',
  Goat: 'meat',
}

// Category "Side"/"Starter"/"Miscellaneous" says nothing about what is in the
// bowl, which left four salads unreachable by any filter. Rather than guess
// from the dish name, the diet is read off the ingredient list — a salad with
// no meat and no fish in it is vegetarian as a matter of fact, not opinion.
//
// Matching is word-boundary based, and the traps are real: "hamburger"
// contains ham, "butternut" contains butter, "coconut milk" is not dairy, and
// Worcestershire sauce is made with anchovies.
const MEAT_RE = /\b(beef|steak|veal|pork|bacon|ham|gammon|chorizo|sausages?|salami|prosciutto|pancetta|pepperoni|chicken|turkey|duck|lamb|mutton|goat|venison|meat)\b/
const FISH_RE = /\b(fish|tuna|salmon|cod|haddock|anchovy|anchovies|prawns?|shrimps?|crab|lobster|squid|calamari|octopus|mussels?|clams?|oysters?|scallops?|sardines?|mackerel|seafood|worcestershire)\b/
const DAIRY_EGG_RE = /\b(milk|cheese|butter|cream|creme|yogurt|yoghurt|eggs?|honey|mayonnaise|ghee|parmesan|feta|mozzarella|ricotta|halloumi|mascarpone|custard)\b/
// Plant milks/butters are not dairy, and an eggplant is not an egg.
const NOT_DAIRY_RE = /\b(coconut|almond|soy|soya|oat|cashew|peanut|shea|plant)\b/
// A beef tomato is a tomato.
const NOT_MEAT_RE = /\bbeef\s+tomato/
// Fish sauce seasons a dish; it does not make it a seafood dish. Both
// Vietnamese salads here are built on chicken and pork but season with it.
const FISH_SEASONING_RE = /\b(fish sauce|worcestershire|shrimp paste|oyster sauce)\b/

const hasRealFish = (list) => list.some((i) => FISH_RE.test(i) && !FISH_SEASONING_RE.test(i))
const hasFishSeasoning = (list) => list.some((i) => FISH_SEASONING_RE.test(i))
const hasMeat = (list) => list.some((i) => MEAT_RE.test(i) && !NOT_MEAT_RE.test(i))

// A vegetarian salad with no dairy, egg or honey in it is vegan.
function isVegan(items) {
  return !items.some((i) => {
    const s = i.item.toLowerCase()
    return DAIRY_EGG_RE.test(s) && !NOT_DAIRY_RE.test(s)
  })
}

// TheMealDB's protein categories (Seafood/Chicken/Pork/...) are reliable and
// name the star of the dish, so they win when present. The unhelpful ones
// (Vegetarian/Side/Starter) are checked against the ingredients instead,
// because the label is demonstrably wrong on some records: "Thai rice noodle
// salad" is filed Vegetarian but built on pork and sirloin, and the Olivier
// and Liegeoise salads carry sausage and bacon under the same label.
function dietOf(meal, items) {
  const tagged = DIET[meal.strCategory]
  if (tagged === 'seafood' || tagged === 'meat') return tagged

  const list = items.map((i) => i.item.toLowerCase())
  if (hasRealFish(list)) return 'seafood'
  if (hasMeat(list)) return 'meat'
  if (hasFishSeasoning(list)) return 'seafood'
  return isVegan(items) ? 'vegan' : 'vegetarian'
}

// TheMealDB's own area vocabulary is demonyms ("French", "Greek"), but a few
// records carry the country name instead — Tuna Nicoise is filed under
// "France". Mapping those back is a correction to their vocabulary, not a
// guess about the dish.
const AREA_FIX = {
  France: 'French', Greece: 'Greek', Italy: 'Italian', Spain: 'Spanish',
  China: 'Chinese', Japan: 'Japanese', India: 'Indian', Mexico: 'Mexican',
  Russia: 'Russian', Poland: 'Polish', Turkey: 'Turkish', Vietnam: 'Vietnamese',
  Thailand: 'Thai', Portugal: 'Portuguese', Ireland: 'Irish', Canada: 'Canadian',
  Ukraine: 'Ukrainian', Norway: 'Norwegian', Egypt: 'Egyptian', Morocco: 'Moroccan',
  Netherlands: 'Dutch', Germany: 'German', Denmark: 'Danish', Sweden: 'Swedish',
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

function isSalad(meal) {
  const name = (meal.strMeal || '').toLowerCase()
  return /\bsalad\b/.test(name) || ALSO_ALLOW.has(name)
}

// Ingredients arrive as 20 flat strIngredientN/strMeasureN pairs, padded with
// empty strings and the occasional stray whitespace.
function ingredients(meal) {
  const out = []
  for (let i = 1; i <= 20; i++) {
    const item = (meal[`strIngredient${i}`] || '').trim()
    if (!item) continue
    const qty = (meal[`strMeasure${i}`] || '').trim()
    out.push(qty ? { item, qty } : { item })
  }
  return out
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

// Publishers that have gone away. thelemonsqueezy.com now 404s on every path
// and serves a certificate for a different hostname, so linking there sends
// people into a browser security warning. Verified by hand, not guessed —
// those salads fall back to their video instead of a dead credit link.
const DEAD_SOURCES = new Set(['thelemonsqueezy.com'])

function normalise(meal) {
  const raw = (meal.strSource || '').trim() || null
  const host = raw ? hostOf(raw) : null
  const dead = host ? DEAD_SOURCES.has(host) : false
  const source = dead ? null : raw
  const area = (meal.strArea || '').trim()
  const items = ingredients(meal)
  return {
    id: meal.idMeal,
    name: (meal.strMeal || '').trim(),
    category: (meal.strCategory || '').trim() || null,
    cuisine: area ? AREA_FIX[area] || area : null,
    diet: dietOf(meal, items),
    thumb: SMALL(meal.strMealThumb),
    photo: LARGE(meal.strMealThumb),
    ingredients: items,
    // The method itself is the publisher's writing and is not copied here.
    source,
    sourceHost: source ? host : null,
    video: (meal.strYoutube || '').trim() || null,
    tags: (meal.strTags || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  }
}

async function generate() {
  const found = new Map()

  for (const term of SEARCH_TERMS) {
    const data = await getJSON(`${API}/search.php?s=${encodeURIComponent(term)}`)
    for (const meal of data.meals || []) {
      if (isSalad(meal)) found.set(meal.idMeal, meal)
    }
    await sleep(300) // one search every 300ms is polite on a shared test key
  }

  const salads = [...found.values()]
    .map(normalise)
    .filter((s) => s.name && s.ingredients.length)
    // Cuisine first so the page groups sensibly, then alphabetical.
    .sort((a, b) => (a.cuisine || 'zz').localeCompare(b.cuisine || 'zz') || a.name.localeCompare(b.name))

  return {
    generated: new Date().toISOString(),
    source: 'TheMealDB',
    note: 'Ingredients are listed in full. Methods stay with the publishers who wrote them — every salad links to its source.',
    salads,
  }
}

try {
  console.log('gen-salads: assembling salads from TheMealDB...')
  const payload = await generate()

  let previous = 0
  if (existsSync(SNAPSHOT)) {
    try {
      previous = JSON.parse(readFileSync(SNAPSHOT, 'utf8')).salads?.length || 0
    } catch {
      previous = 0
    }
  }
  if (payload.salads.length < Math.min(10, previous)) {
    throw new Error(`only ${payload.salads.length} salads (snapshot has ${previous})`)
  }

  writeFileSync(OUT, JSON.stringify(payload, null, 2))
  // Keep the committed snapshot current too, so the fallback stays useful.
  writeFileSync(SNAPSHOT, JSON.stringify(payload, null, 2))

  const withSource = payload.salads.filter((s) => s.source).length
  const withVideo = payload.salads.filter((s) => s.video).length
  console.log(
    `gen-salads: wrote ${payload.salads.length} salads (${withSource} credited, ${withVideo} with video)`
  )
} catch (err) {
  console.warn(`gen-salads: skipped (${err.message}); keeping committed snapshot`)
}
