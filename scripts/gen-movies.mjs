// Build-time generator for the Sidecar "upcoming Indian films" card.
//
// Why build-time instead of fetching in the browser:
//   - It takes ~25 API calls to assemble a good list (categories, posters,
//     release dates). Doing that on every drawer open would be slow and rude
//     to Wikipedia. Here it runs once per deploy and ships as a static file.
//   - The result is same-origin, so the card needs no CORS and no API key,
//     and it renders even on networks where third-party movie APIs are
//     blocked or unreachable.
//
// Data sources (all keyless, all public):
//   - Wikipedia categories  -> which films are actually upcoming
//   - Wikipedia REST summary -> the poster and a one-line description
//   - Wikipedia imageinfo    -> a *scaled* poster (~20KB instead of ~175KB)
//   - Wikidata wbgetentities -> release date (P577) and IMDb id (P345)
//
// Safety contract: this script must never break a deploy. public/movies.json
// is a committed snapshot that Vite copies into dist/. We only overwrite that
// copy when we've assembled a result at least as good as the snapshot; on any
// error we log and exit 0, leaving the snapshot in place.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'dist', 'movies.json')
const SNAPSHOT = join(ROOT, 'public', 'movies.json')

// Wikipedia asks for a descriptive User-Agent that identifies the caller.
const UA = 'kranthikiran.com sidecar movie card (+https://kranthikiran.com)'
const WP = 'https://en.wikipedia.org/w/api.php'
const REST = 'https://en.wikipedia.org/api/rest_v1/page/summary'
const WD = 'https://www.wikidata.org/w/api.php'

// Category -> the language label we show on the card. Ordered so that the
// pan-Indian category seeds the list first.
const CATEGORIES = [
  ['Category:Upcoming Indian films', ''],
  ['Category:Upcoming Hindi-language films', 'Hindi'],
  ['Category:Upcoming Telugu-language films', 'Telugu'],
  ['Category:Upcoming Tamil-language films', 'Tamil'],
  ['Category:Upcoming Malayalam-language films', 'Malayalam'],
  ['Category:Upcoming Kannada-language films', 'Kannada'],
]

const MAX_FILMS = 14
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.json()
}

// One request per category: titles + short descriptions + Wikidata ids.
async function fetchCategory(category, lang) {
  const url =
    `${WP}?action=query&format=json&formatversion=2&generator=categorymembers` +
    `&gcmtitle=${encodeURIComponent(category)}&gcmnamespace=0&gcmlimit=50` +
    `&prop=pageprops|description&ppprop=wikibase_item`
  const data = await getJSON(url)
  return (data?.query?.pages || []).map((p) => ({
    title: p.title,
    qid: p.pageprops?.wikibase_item || null,
    desc: p.description || '',
    lang,
  }))
}

// The poster. prop=pageimages deliberately excludes non-free files, and film
// posters are non-free, so it returns nothing for exactly the pages we care
// about. The REST summary does surface them, so we go through that and then
// ask imageinfo for a scaled rendition.
async function fetchPosterFile(title) {
  const data = await getJSON(`${REST}/${encodeURIComponent(title.replace(/ /g, '_'))}`)
  const src = data?.originalimage?.source || data?.thumbnail?.source
  if (!src) return { file: null, extract: data?.extract || '' }
  // The REST response appends analytics params, so strip the query string
  // before taking the filename or we end up asking for "File:X.jpg?utm_...".
  const file = decodeURIComponent(
    src.split('?')[0].split('/').pop().replace(/^\d+px-/, '')
  )
  return { file, extract: data?.extract || '' }
}

// Batched: one call turns every poster filename into a ~20KB thumbnail URL.
async function fetchThumbs(files) {
  const out = new Map()
  // MediaWiki normalises underscores to spaces in the titles it echoes back,
  // so both sides of this map have to agree on one form.
  const key = (s) => s.replace(/_/g, ' ')
  for (let i = 0; i < files.length; i += 40) {
    const batch = files.slice(i, i + 40)
    const titles = batch.map((f) => `File:${f}`).join('|')
    // 120px is deliberately small: the card renders posters at ~44px, so this
    // is still retina-sharp. Asking for more matters because MediaWiki will
    // not upscale — request 200px and any poster whose original is narrower
    // comes back unscaled, which is how this list first weighed 692KB.
    const url =
      `${WP}?action=query&format=json&formatversion=2&prop=imageinfo` +
      `&iiprop=url&iiurlwidth=120&titles=${encodeURIComponent(titles)}`
    const data = await getJSON(url)
    for (const p of data?.query?.pages || []) {
      const thumb = p.imageinfo?.[0]?.thumburl
      // Drop Wikipedia's analytics query string; the bytes are identical.
      if (thumb) out.set(key(p.title.replace(/^File:/, '')), thumb.split('?')[0])
    }
  }
  return { get: (f) => (f ? out.get(key(f)) : undefined), size: out.size }
}

// Wikidata precision: 11 = day, 10 = month, 9 = year. Anything vaguer than a
// year is not worth showing.
function readTime(claim) {
  const v = claim?.mainsnak?.datavalue?.value
  if (!v?.time) return null
  const m = /^\+(\d{4})-(\d{2})-(\d{2})/.exec(v.time)
  if (!m) return null
  const [, y, mo, d] = m
  if (v.precision >= 11) return { date: `${y}-${mo}-${d}`, precision: 'day' }
  if (v.precision === 10) return { date: `${y}-${mo}-01`, precision: 'month' }
  if (v.precision === 9) return { date: `${y}-01-01`, precision: 'year' }
  return null
}

// Batched: release dates and IMDb ids for every film in one or two calls.
async function fetchWikidata(qids) {
  const out = new Map()
  for (let i = 0; i < qids.length; i += 40) {
    const batch = qids.slice(i, i + 40)
    const url =
      `${WD}?action=wbgetentities&format=json&props=claims|sitelinks` +
      `&ids=${batch.join('|')}`
    const data = await getJSON(url)
    for (const [qid, ent] of Object.entries(data?.entities || {})) {
      const claims = ent.claims || {}
      // A film can carry several P577 values (one per regional release).
      // The earliest is the one people mean by "release date".
      const dates = (claims.P577 || []).map(readTime).filter(Boolean)
      dates.sort((a, b) => a.date.localeCompare(b.date))
      out.set(qid, {
        release: dates[0] || null,
        imdb: claims.P345?.[0]?.mainsnak?.datavalue?.value || null,
        // How many language Wikipedias cover this film. It is the only
        // popularity signal available without another API, and it is enough
        // to keep a Rajamouli tentpole above a title nobody has heard of.
        weight: Object.keys(ent.sitelinks || {}).length,
      })
    }
  }
  return out
}

async function generate() {
  // 1. Collect candidates. A film often sits in several categories; the first
  //    category that names a language wins, so we don't overwrite "Telugu"
  //    with a later blank.
  const byTitle = new Map()
  for (const [cat, lang] of CATEGORIES) {
    let rows = []
    try {
      rows = await fetchCategory(cat, lang)
    } catch (err) {
      console.warn(`  ! ${cat}: ${err.message}`)
      continue
    }
    for (const row of rows) {
      const existing = byTitle.get(row.title)
      if (!existing) byTitle.set(row.title, row)
      else if (!existing.lang && row.lang) existing.lang = row.lang
    }
    console.log(`  ${cat} -> ${rows.length}`)
    await sleep(120)
  }

  let films = [...byTitle.values()].filter((f) => f.qid)
  if (!films.length) throw new Error('no films found in any category')

  // 2. Release dates + IMDb ids, batched.
  const wd = await fetchWikidata(films.map((f) => f.qid))
  const today = new Date().toISOString().slice(0, 10)
  films = films
    .map((f) => ({ ...f, ...(wd.get(f.qid) || { release: null, imdb: null, weight: 0 }) }))
    // Categories go stale. If Wikidata says it already came out, it is not
    // upcoming, whatever the category still claims.
    .filter((f) => !f.release || f.release.date >= today)

  // Dated films first, soonest first — those are the ones you can plan around.
  // Undated films still belong on the list, ranked by how widely covered they
  // are, so an anticipated tentpole outranks an alphabetically lucky unknown.
  films.sort((a, b) => {
    if (a.release && b.release) return a.release.date.localeCompare(b.release.date)
    if (a.release) return -1
    if (b.release) return 1
    return b.weight - a.weight || a.title.localeCompare(b.title)
  })
  films = films.slice(0, MAX_FILMS)

  // 3. Posters, one summary call per film, then a single batched thumb call.
  const posters = []
  for (const f of films) {
    try {
      const { file, extract } = await fetchPosterFile(f.title)
      f.posterFile = file
      if (!f.desc && extract) f.desc = extract.split('. ')[0]
      if (file) posters.push(file)
    } catch (err) {
      console.warn(`  ! poster ${f.title}: ${err.message}`)
    }
    await sleep(80)
  }
  const thumbs = await fetchThumbs(posters)

  const payload = {
    generated: new Date().toISOString(),
    source: 'Wikipedia + Wikidata',
    films: films.map((f) => ({
      title: f.title.replace(/\s*\((?:\d{4}\s*)?film\)$/i, '').trim(),
      lang: f.lang || 'Indian',
      date: f.release?.date || null,
      precision: f.release?.precision || null,
      // Wikidata descriptions read "Upcoming Indian film by <director>", so the
      // director comes free — worth pulling out, since for most of these films
      // the director is the reason anyone is waiting for them.
      by: (/\bby\s+(.+?)\.?$/i.exec(f.desc || '') || [])[1] || null,
      desc: f.desc || '',
      poster: (f.posterFile && thumbs.get(f.posterFile)) || null,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(f.title.replace(/ /g, '_'))}`,
      imdb: f.imdb ? `https://www.imdb.com/title/${f.imdb}/` : null,
    })),
  }
  return payload
}

try {
  console.log('gen-movies: assembling upcoming Indian films...')
  const payload = await generate()
  const withPoster = payload.films.filter((f) => f.poster).length

  // Refuse to replace a good snapshot with a worse live result.
  let previous = 0
  if (existsSync(SNAPSHOT)) {
    try {
      previous = JSON.parse(readFileSync(SNAPSHOT, 'utf8')).films?.length || 0
    } catch {
      previous = 0
    }
  }
  if (payload.films.length < Math.min(3, previous)) {
    throw new Error(`only ${payload.films.length} films (snapshot has ${previous})`)
  }

  writeFileSync(OUT, JSON.stringify(payload, null, 2))
  // Keep the committed snapshot current too, so the fallback stays useful.
  writeFileSync(SNAPSHOT, JSON.stringify(payload, null, 2))
  console.log(
    `gen-movies: wrote ${payload.films.length} films (${withPoster} with posters)`
  )
} catch (err) {
  console.warn(`gen-movies: skipped (${err.message}); keeping committed snapshot`)
}
