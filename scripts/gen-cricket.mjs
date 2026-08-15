// Build-time generator for the #/cricket page.
//
// Cricket has no free live-score API worth relying on: ESPNCricinfo and
// Sofascore both refuse anonymous callers, Cricbuzz renders on the client,
// and everything else wants a key. So this page is built from two open
// sources that need no key and no scraping of a rendered page:
//
//   1. Wikipedia — the three ICC men's team rankings tables, and the
//      "International cricket in <year>" season overview, which lists every
//      international tour of the year with its result so far. Both are read
//      as wikitext through the MediaWiki API, so we are parsing the source
//      the page is written in rather than guessing at HTML that may change.
//
//   2. Cricsheet — real match outcomes for everything played in the last 30
//      days, published as a zip of per-match JSON under a permissive licence.
//      This is where actual results come from: who won, and by how much.
//
// Safety contract, same as the other generators here: this must never break a
// deploy. public/cricket.json is a committed snapshot that Vite copies into
// dist/. Each source is fetched independently and a failure in one leaves that
// part of the previous snapshot in place; a total failure exits 0 and keeps
// the snapshot untouched.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import JSZip from 'jszip'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'dist', 'cricket.json')
const SNAPSHOT = join(ROOT, 'public', 'cricket.json')

const UA = 'kranthikiran.com cricket page (+https://kranthikiran.com)'
const WIKI = 'https://en.wikipedia.org/w/api.php'
const CRICSHEET = 'https://cricsheet.org/downloads/recently_played_30_json.zip'
const SEASON = new Date().getUTCFullYear()

// Wikipedia writes every team as {{cr|CODE}}. The codes are IOC-style but not
// identical to it, and a few have two spellings in circulation, so the map is
// explicit rather than derived.
const TEAMS = {
  AFG: 'Afghanistan', ARG: 'Argentina', AUS: 'Australia', AUT: 'Austria',
  BAH: 'Bahamas', BAN: 'Bangladesh', BEL: 'Belgium', BER: 'Bermuda',
  BHR: 'Bahrain', BHU: 'Bhutan', BLZ: 'Belize', BOT: 'Botswana',
  BRA: 'Brazil', BUL: 'Bulgaria', CAM: 'Cambodia', CAN: 'Canada',
  CAY: 'Cayman Islands', CHN: 'China', CIV: 'Ivory Coast', CMR: 'Cameroon',
  COK: 'Cook Islands', CRC: 'Costa Rica', CRO: 'Croatia', CYP: 'Cyprus',
  CZE: 'Czechia', DEN: 'Denmark', ENG: 'England', ESP: 'Spain',
  EST: 'Estonia', ESW: 'Eswatini', FIJ: 'Fiji', FIN: 'Finland',
  FRA: 'France', GER: 'Germany', GHA: 'Ghana', GIB: 'Gibraltar',
  GUE: 'Guernsey', HK: 'Hong Kong', HUN: 'Hungary', IDN: 'Indonesia',
  IND: 'India', IOM: 'Isle of Man', IRE: 'Ireland', ISR: 'Israel',
  ITA: 'Italy', JER: 'Jersey', JPN: 'Japan', KEN: 'Kenya',
  KOR: 'South Korea', KUW: 'Kuwait', LES: 'Lesotho', LUX: 'Luxembourg',
  MAS: 'Malaysia', MDV: 'Maldives', MEX: 'Mexico', MGL: 'Mongolia',
  MLI: 'Mali', MLT: 'Malta', MOZ: 'Mozambique', MWI: 'Malawi',
  MYA: 'Myanmar', NAM: 'Namibia', NED: 'Netherlands', NEP: 'Nepal',
  NGA: 'Nigeria', NOR: 'Norway', NZ: 'New Zealand', NZL: 'New Zealand',
  OMA: 'Oman', PAK: 'Pakistan', PAN: 'Panama', PHI: 'Philippines',
  PNG: 'Papua New Guinea', POR: 'Portugal', QAT: 'Qatar', ROM: 'Romania',
  RSA: 'South Africa', RWA: 'Rwanda', SA: 'South Africa', SAM: 'Samoa',
  SAU: 'Saudi Arabia', SCO: 'Scotland', SEY: 'Seychelles',
  SHL: 'Saint Helena', SIN: 'Singapore', SL: 'Sri Lanka',
  SLE: 'Sierra Leone', SLO: 'Slovenia', SRB: 'Serbia', SUI: 'Switzerland',
  SUR: 'Suriname', SWE: 'Sweden', TAN: 'Tanzania', THA: 'Thailand',
  TLS: 'Timor-Leste', TUR: 'Turkey', UAE: 'United Arab Emirates',
  UGA: 'Uganda', USA: 'United States', VAN: 'Vanuatu', WIN: 'West Indies',
  ZAM: 'Zambia', ZIM: 'Zimbabwe',
}

const MONTHS = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
}

const teamName = (code) => TEAMS[code] || code
const num = (v) => {
  const n = Number(String(v ?? '').replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : null
}

async function wikitext(page) {
  const url = `${WIKI}?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&formatversion=2`
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`${page} -> HTTP ${res.status}`)
  const json = await res.json()
  if (json.error) throw new Error(`${page} -> ${json.error.code}`)
  const text = json.parse?.wikitext
  if (!text) throw new Error(`${page} -> no wikitext`)
  return typeof text === 'string' ? text : text['*']
}

// Rankings live in the first wikitable on the page that mentions a team, which
// is always "Current rankings". Rows are Team / Matches / Points / Rating.
function parseRankings(text) {
  const tables = text.match(/\{\|[\s\S]*?\n\|\}/g) || []
  const table = tables.find((t) => t.includes('{{cr'))
  if (!table) return []
  const out = []
  for (const row of table.split('|-')) {
    if (!row.includes('{{cr')) continue
    const code = row.match(/\{\{cr\|([A-Za-z0-9]+)/)?.[1]
    if (!code) continue
    // Cells are separated by || on one line or a leading | per line, and the
    // team cell is always first, so drop everything up to the closing brace.
    const after = row.slice(row.indexOf('}}') + 2)
    const nums = (after.match(/[\d,]+/g) || []).map(num).filter((n) => n != null)
    if (nums.length < 3) continue
    const [matches, points, rating] = nums
    out.push({ pos: out.length + 1, code, team: teamName(code), matches, points, rating })
  }
  return out
}

// "17 April 2026" -> "2026-04-17". Wikipedia is consistent about this format in
// the season overview, but a row we cannot date is dropped rather than guessed.
function parseDate(s) {
  const m = String(s).match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/)
  if (!m) return null
  const mon = MONTHS[m[2].toLowerCase()]
  if (!mon) return null
  return `${m[3]}-${String(mon).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`
}

// A results cell is one of:
//   {{n/a}}   the tour has no matches in this format
//   [3]       three scheduled, none played yet
//   2–1 [3]   played: the series stands 2–1 over three matches
function parseFormatCell(cell) {
  const c = cell.replace(/\{\{n\/a\}\}/gi, '').replace(/\[\[[^\]]*\]\]/g, '').trim()
  if (!c) return null
  const matches = num(c.match(/\[(\d+)\]/)?.[1])
  const score = c.match(/(\d+)\s*[–-]\s*(\d+)/)
  if (!matches && !score) return null
  return {
    matches,
    result: score ? `${score[1]}–${score[2]}` : null,
    played: score ? num(score[1]) + num(score[2]) : 0,
  }
}

// The season overview's men's table lists bilateral tours and multi-team
// events in one chronological run. Only the bilateral rows carry two teams.
function parseTours(text) {
  const start = text.indexOf("===Men's events===")
  if (start < 0) return []
  const end = text.indexOf("===Women's events===")
  const section = text.slice(start, end > start ? end : undefined)
  const table = (section.match(/\{\|[\s\S]*?\n\|\}/) || [])[0]
  if (!table) return []

  const out = []
  for (const row of table.split('|-')) {
    if (!row.includes('{{cr|')) continue
    const date = parseDate(row.match(/\[\[#[^|\]]*\|([^\]]+)\]\]/)?.[1] || '')
    if (!date) continue
    const codes = [...row.matchAll(/\{\{cr\|([A-Za-z0-9]+)/g)].map((m) => m[1])
    if (codes.length < 2) continue
    const name = row.match(/\[\[#([^|\]]+)\|/)?.[1] || ''

    // Everything after the away team is the three result columns.
    const tail = row.slice(row.lastIndexOf(`{{cr|${codes[1]}`))
    const cells = tail.split(/\|\||\n\s*\|/).slice(1)
    const [test, odi, t20i] = [0, 1, 2].map((i) => parseFormatCell(cells[i] || ''))

    out.push({
      start: date,
      name: name.replace(/_/g, ' '),
      home: codes[0],
      homeName: teamName(codes[0]),
      away: codes[1],
      awayName: teamName(codes[1]),
      formats: { test, odi, t20i },
    })
  }
  return out.sort((a, b) => a.start.localeCompare(b.start))
}

// Cricsheet: one JSON per match, zipped. We only read the info block — the
// ball-by-ball payload is an order of magnitude larger and the page shows
// results, not scorecards.
function describeOutcome(o = {}) {
  if (o.result) return { winner: null, margin: String(o.result) } // tie, draw, no result
  if (!o.winner) return { winner: null, margin: '' }
  const by = o.by || {}
  let margin = ''
  if (by.innings) margin = `an innings and ${by.runs} run${by.runs === 1 ? '' : 's'}`
  else if (by.runs != null) margin = `${by.runs} run${by.runs === 1 ? '' : 's'}`
  else if (by.wickets != null) margin = `${by.wickets} wicket${by.wickets === 1 ? '' : 's'}`
  return { winner: o.winner, margin, method: o.method || null }
}

async function fetchRecent(internationalNames) {
  const res = await fetch(CRICSHEET, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`cricsheet -> HTTP ${res.status}`)
  const zip = await JSZip.loadAsync(await res.arrayBuffer())
  const files = Object.values(zip.files).filter((f) => !f.dir && f.name.endsWith('.json'))

  const matches = []
  for (const file of files) {
    let info
    try {
      info = JSON.parse(await file.async('string')).info
    } catch {
      continue
    }
    if (!info?.teams || info.teams.length !== 2) continue
    const date = (info.dates || []).slice(-1)[0]
    if (!date) continue
    const outcome = describeOutcome(info.outcome)
    matches.push({
      date,
      type: info.match_type || '',
      gender: info.gender || '',
      event: (info.event || {}).name || '',
      teams: info.teams,
      winner: outcome.winner,
      margin: outcome.margin,
      method: outcome.method || null,
      venue: info.venue || '',
      city: info.city || '',
      international: info.teams.every((t) => internationalNames.has(t)),
    })
  }
  return matches.sort((a, b) => b.date.localeCompare(a.date))
}

async function generate(previous) {
  const today = new Date().toISOString().slice(0, 10)

  // Every source is optional. Whatever fails falls back to the snapshot, so a
  // Wikipedia hiccup cannot take the whole page down.
  const [test, odi, t20i, tours] = await Promise.all([
    wikitext("ICC Men's Test Team Rankings").then(parseRankings).catch(() => null),
    wikitext("ICC Men's ODI Team Rankings").then(parseRankings).catch(() => null),
    wikitext("ICC Men's T20I Team Rankings").then(parseRankings).catch(() => null),
    wikitext(`International cricket in ${SEASON}`).then(parseTours).catch(() => null),
  ])

  const rankings = {
    test: test?.length ? test : previous?.rankings?.test || [],
    odi: odi?.length ? odi : previous?.rankings?.odi || [],
    t20i: t20i?.length ? t20i : previous?.rankings?.t20i || [],
  }

  // A team is "international" if it appears in a ranking table, which is a
  // stricter and more current test than matching against a hardcoded list.
  const internationalNames = new Set(
    [...rankings.test, ...rankings.odi, ...rankings.t20i].map((r) => r.team)
  )

  const recent = await fetchRecent(internationalNames).catch(() => null)
  const recentList = recent?.length ? recent : previous?.recent || []
  // Keep every international, but only a slice of the domestic/franchise
  // calendar — the recent window is dominated by county and city-league games
  // that would otherwise bury the internationals and bloat the payload.
  const internationals = recentList.filter((m) => m.international)
  const domestic = recentList.filter((m) => !m.international).slice(0, 30)
  const trimmedRecent = [...internationals, ...domestic]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 90)

  const tourList = tours?.length ? tours : previous?.tours || []
  // A series score only counts decided matches, so "played vs scheduled" says
  // nothing about whether a tour is over — a drawn Test or a washed-out T20
  // leaves the score short forever. Estimate an end date from the format
  // instead: roughly six days for a Test, three for an ODI, two for a T20I,
  // plus a few days of slack for travel and reserve days.
  const DAYS = { test: 6, odi: 3, t20i: 2 }
  const dated = tourList.map((t) => {
    const played = Object.values(t.formats || {}).reduce((n, f) => n + (f?.played || 0), 0)
    const scheduled = Object.values(t.formats || {}).reduce((n, f) => n + (f?.matches || 0), 0)
    const span = Object.entries(t.formats || {}).reduce(
      (n, [k, f]) => n + (f?.matches || 0) * (DAYS[k] || 3),
      0
    )
    const end = new Date(`${t.start}T00:00:00Z`)
    end.setUTCDate(end.getUTCDate() + span + 3)
    const ends = end.toISOString().slice(0, 10)

    let status = 'upcoming'
    if (t.start <= today) status = today <= ends ? 'live' : 'done'
    return { ...t, played, scheduled, ends, status }
  })

  return {
    generated: new Date().toISOString(),
    season: String(SEASON),
    sources: [
      { name: 'Wikipedia — ICC team rankings', url: 'https://en.wikipedia.org/wiki/ICC_Men%27s_Test_Team_Rankings' },
      { name: `Wikipedia — International cricket in ${SEASON}`, url: `https://en.wikipedia.org/wiki/International_cricket_in_${SEASON}` },
      { name: 'Cricsheet — match results', url: 'https://cricsheet.org/' },
    ],
    rankings: {
      // The full ICC lists run past a hundred sides; the page only ever shows
      // the top group, so the tail is dead weight in the payload.
      test: rankings.test.slice(0, 12),
      odi: rankings.odi.slice(0, 12),
      t20i: rankings.t20i.slice(0, 12),
    },
    tours: dated,
    recent: trimmedRecent,
  }
}

try {
  console.log('gen-cricket: pulling rankings, tours and recent results...')

  let previous = null
  if (existsSync(SNAPSHOT)) {
    try {
      previous = JSON.parse(readFileSync(SNAPSHOT, 'utf8'))
    } catch {
      previous = null
    }
  }

  const payload = await generate(previous)

  // Refuse to replace a good snapshot with a thin one.
  const rows = payload.rankings.test.length + payload.rankings.odi.length + payload.rankings.t20i.length
  if (rows < 20) throw new Error(`only ${rows} ranking rows`)
  if (!payload.tours.length) throw new Error('no tours parsed')

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(payload, null, 2))
  writeFileSync(SNAPSHOT, JSON.stringify(payload, null, 2))

  // A pocket version for the landing-page button, which only needs to know
  // whether anything is on and what to say in a tooltip. The full file is
  // ~50KB and has no business being fetched by the home page for one dot.
  const liveTours = payload.tours.filter((t) => t.status === 'live')
  const nextTour = payload.tours.find((t) => t.status === 'upcoming') || null
  const pick = liveTours.find((t) => t.home === 'IND' || t.away === 'IND') || liveTours[0] || nextTour
  const now = {
    generated: payload.generated,
    live: liveTours.length,
    india: liveTours.some((t) => t.home === 'IND' || t.away === 'IND'),
    tour: pick ? { name: pick.name, start: pick.start, status: pick.status } : null,
  }
  writeFileSync(OUT.replace(/cricket\.json$/, 'cricket-now.json'), JSON.stringify(now))
  writeFileSync(SNAPSHOT.replace(/cricket\.json$/, 'cricket-now.json'), JSON.stringify(now))

  const top = payload.rankings.odi[0]
  console.log(
    `gen-cricket: wrote ${payload.season} — ` +
      `${payload.rankings.test.length}/${payload.rankings.odi.length}/${payload.rankings.t20i.length} ranked ` +
      `(Test/ODI/T20I), ${payload.tours.length} tours, ${payload.recent.length} recent results` +
      (top ? ` (ODI no.1 ${top.team})` : '')
  )
} catch (err) {
  console.warn(`gen-cricket: skipped (${err.message}); keeping committed snapshot`)
}
