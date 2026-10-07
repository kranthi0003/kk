import { groqTools } from './groq'

/* ------------------------------------------------------------------ *
 * The site agent behind #/ask.
 *
 * A question goes to gpt-oss along with a set of tools. The tools run
 * here in the browser, over the same data the F1, cricket and jobs
 * pages use, so the model never has to remember a standing or a fixture
 * — it asks. Every step is reported through onEvent as it happens, and
 * that stream is what the page draws as the trace.
 *
 * The proxy caps each reply at 150 tokens, so the tools do the
 * narrowing: a handful of rows and a note on how fresh they are, never
 * a whole file.
 *
 * F1 reads the live Ergast-compatible API first, because the shipped
 * f1.json is only as fresh as the last build that could reach it, and
 * falls back to that snapshot. Cricket and jobs are build-time files
 * refreshed by the daily deploy, and say when they were taken.
 *
 * If no model can be reached, a keyword router picks the tool instead
 * and the answer comes from a template. Worse, but it still answers
 * from the data, and the trace says that is what happened.
 * ------------------------------------------------------------------ */

const BASE = (import.meta.env && import.meta.env.BASE_URL) || '/'
const F1_API = 'https://api.jolpi.ca/ergast/f1'
const DAY = 864e5
const MAX_STEPS = 4

/* ---------------- fetching ---------------- */

const cache = new Map()

// One request per URL at a time, kept for a few minutes. A failure is
// dropped from the cache so the next question can try again.
function getJson(url, { ttl = 5 * 60e3, timeout = 7000 } = {}) {
  const hit = cache.get(url)
  if (hit && Date.now() - hit.at < ttl) return hit.p
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeout)
  const p = fetch(url, { signal: ctl.signal })
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    })
    .catch((e) => {
      throw new Error(e?.name === 'AbortError' ? 'timed out' : e.message || 'failed')
    })
    .finally(() => clearTimeout(timer))
  p.catch(() => cache.delete(url))
  cache.set(url, { at: Date.now(), p })
  return p
}

const siteFile = (name) => getJson(`${BASE}${name}`)
const f1 = (path) => getJson(`${F1_API}/${path}`, { ttl: 10 * 60e3 })

/* ---------------- small helpers ---------------- */

const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

// "cockroach" finds CockroachDB, "open ai" finds OpenAI.
const like = (hay, needle) => {
  const h = norm(hay)
  const n = norm(needle)
  if (!n) return false
  return h.includes(n) || h.replace(/ /g, '').includes(n.replace(/ /g, ''))
}

const int = (v, d) => {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : d
}
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

const dayLabel = (d) => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const dateLabel = (iso) => (iso ? dayLabel(new Date(`${iso.slice(0, 10)}T12:00:00`)) : '')
const timeLabel = (d) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

// Calendar days, in the visitor's own time zone.
function relDay(when, now) {
  const a = new Date(now)
  const b = new Date(when)
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  const n = Math.round((b - a) / DAY)
  if (n === 0) return 'today'
  if (n === 1) return 'tomorrow'
  if (n === -1) return 'yesterday'
  return n > 1 ? `in ${n} days` : `${-n} days ago`
}

const snapshotNote = (iso) => `snapshot from ${dateLabel(iso)}`

// The API's race date is the UTC date. Labels and day counts come from
// the start instant instead, so a late race isn't a day off locally.
const startOf = (date, time) => new Date(`${date}T${time || '12:00:00Z'}`)
const raceStart = (r) => startOf(r.date, r.time)

const localDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/* ---------------- F1 ---------------- */

async function f1Standings({ table = 'drivers', top = 5, find } = {}) {
  const drivers = table !== 'constructors'
  const n = clamp(int(top, 5), 1, 22)
  let rows
  let round
  let season
  let source

  try {
    const j = await f1(`current/${drivers ? 'driverstandings' : 'constructorstandings'}/?format=json`)
    const list = j.MRData.StandingsTable.StandingsLists[0]
    if (!list) throw new Error('no standings yet')
    season = list.season
    round = Number(list.round)
    rows = drivers
      ? list.DriverStandings.map((s) => {
          const team = s.Constructors[s.Constructors.length - 1]
          return {
            pos: Number(s.position),
            name: `${s.Driver.givenName} ${s.Driver.familyName}`,
            code: s.Driver.code,
            team: team ? team.name : '',
            points: Number(s.points),
            wins: Number(s.wins),
          }
        })
      : list.ConstructorStandings.map((s) => ({
          pos: Number(s.position),
          name: s.Constructor.name,
          points: Number(s.points),
          wins: Number(s.wins),
        }))
    source = 'live'
  } catch {
    const s = await siteFile('f1.json')
    season = s.season
    round = s.round
    rows = drivers
      ? s.drivers.map((d) => ({ pos: d.pos, name: `${d.first} ${d.last}`, code: d.code, team: d.team, points: d.points, wins: d.wins }))
      : s.constructors.map((c) => ({ pos: c.pos, name: c.name, points: c.points, wins: c.wins }))
    source = snapshotNote(s.generated)
  }

  const out = { table: drivers ? 'drivers' : 'constructors', season, afterRound: round, source, top: rows.slice(0, n) }
  if (find) {
    const hits = rows.filter((r) => like(r.name, find) || norm(r.code) === norm(find) || (r.team && like(r.team, find)))
    out.found = hits.slice(0, 3).map((r) => ({ ...r, behindLeader: rows[0].points - r.points }))
    if (!hits.length) out.note = `Nobody called "${find}" in the ${out.table} standings.`
  }
  return out
}

// One race in a shape that reads well aloud: where, when in the
// visitor's own time, and how far away that is.
function describeRace(r, now) {
  const at = startOf
  const start = raceStart(r)
  const out = {
    round: Number(r.round),
    name: r.raceName,
    circuit: r.Circuit?.circuitName,
    place: [r.Circuit?.Location?.locality, r.Circuit?.Location?.country].filter(Boolean).join(', '),
    starts: r.time ? `${dayLabel(start)}, ${timeLabel(start)}` : dayLabel(start),
    when: relDay(start, now),
  }
  if (r.Qualifying?.date) {
    const q = at(r.Qualifying.date, r.Qualifying.time)
    out.qualifying = r.Qualifying.time ? `${dayLabel(q)}, ${timeLabel(q)}` : dayLabel(q)
  }
  if (r.Sprint?.date) {
    const s = at(r.Sprint.date, r.Sprint.time)
    out.sprint = r.Sprint.time ? `${dayLabel(s)}, ${timeLabel(s)}` : dayLabel(s)
  }
  return out
}

function describeResult(r, now) {
  const res = r.Results || []
  const fast = res.find((x) => x.FastestLap?.rank === '1')
  return {
    round: Number(r.round),
    name: r.raceName,
    place: [r.Circuit?.Location?.locality, r.Circuit?.Location?.country].filter(Boolean).join(', '),
    date: dayLabel(raceStart(r)),
    when: relDay(raceStart(r), now),
    podium: res.slice(0, 3).map((x) => ({
      pos: Number(x.position),
      driver: `${x.Driver.givenName} ${x.Driver.familyName}`,
      team: x.Constructor?.name,
      time: x.Time?.time || x.status,
    })),
    ...(fast ? { fastestLap: `${fast.Driver.familyName}, ${fast.FastestLap.Time?.time}` } : {}),
  }
}

async function f1Calendar() {
  try {
    const j = await f1('current/races/?format=json&limit=40')
    return { races: j.MRData.RaceTable.Races, source: 'live' }
  } catch {
    const s = await siteFile('f1.json')
    // The snapshot's own shape, mapped back to the API's so one
    // describer handles both.
    const races = s.races.map((r) => ({
      round: String(r.round),
      raceName: r.name,
      date: r.date,
      time: r.start ? r.start.slice(11) : undefined,
      Circuit: { circuitName: r.circuit, Location: { locality: r.locality, country: r.country } },
      winner: r.winner,
    }))
    return { races, source: snapshotNote(s.generated) }
  }
}

async function f1Race({ which = 'next', round, name } = {}, now) {
  const t = now.getTime()

  // A specific race, by round or by name: its result if it has run,
  // its schedule if it hasn't.
  if (round || name) {
    const { races, source } = await f1Calendar()
    const r = round
      ? races.find((x) => Number(x.round) === int(round, 0))
      : races.find((x) => like(`${x.raceName} ${x.Circuit?.circuitName} ${x.Circuit?.Location?.locality} ${x.Circuit?.Location?.country}`, name))
    if (!r) return { error: `No race matching ${round ? `round ${round}` : `"${name}"`} this season.` }
    const startsAt = raceStart(r).getTime()
    if (startsAt > t) return { ...describeRace(r, now), status: 'upcoming', source }
    try {
      const j = await f1(`current/${r.round}/results/?format=json`)
      const done = j.MRData.RaceTable.Races[0]
      if (done?.Results?.length) return { ...describeResult(done, now), status: 'finished', source: 'live' }
    } catch {}
    if (r.winner) return { round: Number(r.round), name: r.raceName, winner: `${r.winner.last} (${r.winner.team})`, status: 'finished', source }
    return { ...describeRace(r, now), status: 'finished, result not in yet', source }
  }

  if (which === 'last') {
    try {
      const j = await f1('current/last/results/?format=json')
      const r = j.MRData.RaceTable.Races[0]
      if (r?.Results?.length) return { ...describeResult(r, now), source: 'live' }
    } catch {}
    const s = await siteFile('f1.json')
    const l = s.lastRace
    return {
      round: l.round,
      name: l.name,
      date: dateLabel(l.date),
      podium: l.podium.map((p) => ({ pos: p.pos, driver: `${p.first} ${p.last}`, team: p.team, time: p.time })),
      fastestLap: l.fastestLap ? `${l.fastestLap.driver}, ${l.fastestLap.time}` : undefined,
      source: snapshotNote(s.generated),
    }
  }

  if (which === 'calendar') {
    const { races, source } = await f1Calendar()
    const left = races.filter((r) => raceStart(r).getTime() > t)
    const last = races[races.length - 1]
    return {
      total: races.length,
      done: races.length - left.length,
      remaining: left.length,
      upcoming: left.slice(0, 4).map((r) => ({ round: Number(r.round), name: r.raceName, date: dayLabel(raceStart(r)) })),
      finale: last ? `${last.raceName}, ${dayLabel(raceStart(last))}` : undefined,
      source,
    }
  }

  try {
    const j = await f1('current/next.json')
    const r = j.MRData.RaceTable.Races[0]
    if (!r) return { note: 'No races left this season.', source: 'live' }
    return { ...describeRace(r, now), source: 'live' }
  } catch {
    const { races, source } = await f1Calendar()
    const r = races.find((x) => raceStart(x).getTime() > t)
    return r ? { ...describeRace(r, now), source } : { note: 'No races left this season.', source }
  }
}

/* ---------------- cricket ---------------- */

const FORMATS = { test: 'Test', odi: 'ODI', t20i: 'T20I' }

const formatKey = (f) => {
  const k = norm(f).replace(/ /g, '')
  if (k.startsWith('test')) return 'test'
  if (k.startsWith('odi') || k.includes('oneday')) return 'odi'
  if (k.startsWith('t20')) return 't20i'
  return null
}

const isTeam = (name, code, team) => like(name, team) || norm(code) === norm(team)

async function cricketRankings({ format, team, top = 5 } = {}) {
  const c = await siteFile('cricket.json')
  const asOf = snapshotNote(c.generated)
  const key = format ? formatKey(format) : null

  if (team) {
    const keys = key ? [key] : Object.keys(FORMATS)
    const rows = keys.map((k) => {
      const r = (c.rankings[k] || []).find((x) => isTeam(x.team, x.code, team))
      return r ? { format: FORMATS[k], pos: r.pos, rating: r.rating, of: c.rankings[k].length } : { format: FORMATS[k], pos: null }
    })
    const name = Object.values(c.rankings).flat().find((x) => isTeam(x.team, x.code, team))?.team || team
    return { team: name, rankings: rows, source: `ICC men's rankings, ${asOf}` }
  }

  const keys = key ? [key] : Object.keys(FORMATS)
  const n = clamp(int(top, key ? 5 : 3), 1, 12)
  return {
    tables: keys.map((k) => ({ format: FORMATS[k], top: (c.rankings[k] || []).slice(0, n).map((r) => ({ pos: r.pos, team: r.team, rating: r.rating })) })),
    source: `ICC men's rankings, ${asOf}`,
  }
}

// Series scores in the season table read home–away, so "0–3" in
// "India in Zimbabwe" is Zimbabwe 0, India 3. The outcome is written
// out in words, so the model never has to know that.
function describeTour(t) {
  const done = t.status === 'done'
  const formats = Object.entries(FORMATS)
    .filter(([k]) => t.formats?.[k])
    .map(([k, label]) => {
      const f = t.formats[k]
      const m = (f.result || '').match(/(\d+)\D+(\d+)/)
      if (!m) return { format: label, matches: f.matches, outcome: 'not started' }
      const home = Number(m[1])
      const away = Number(m[2])
      const [hi, lo] = home >= away ? [home, away] : [away, home]
      const lead = home > away ? t.homeName : t.awayName
      const outcome = home === away ? `level ${home}–${away}` : `${lead} ${done ? 'won' : 'lead'} ${hi}–${lo}`
      return { format: label, matches: f.matches, decided: home + away, outcome }
    })
  return {
    name: t.name,
    dates: `${dateLabel(t.start)} – ${dateLabel(t.ends)}`,
    status: t.status,
    formats,
  }
}

async function cricketSeries({ team = 'India', status = 'any', limit = 3 } = {}, now) {
  const [c, live] = await Promise.all([siteFile('cricket.json'), siteFile('cricket-now.json').catch(() => null)])
  const today = localDay(new Date(now))
  let tours = c.tours.filter((t) => !team || isTeam(t.homeName, t.home, team) || isTeam(t.awayName, t.away, team))

  const upcoming = (t) => t.start > today
  if (status === 'live') tours = tours.filter((t) => t.status === 'live')
  else if (status === 'upcoming') tours = tours.filter(upcoming).sort((a, b) => a.start.localeCompare(b.start))
  else if (status === 'recent') tours = tours.filter((t) => t.status === 'done').sort((a, b) => b.ends.localeCompare(a.ends))
  else {
    // Live first, then whatever is next, then the most recent finished.
    const rank = (t) => (t.status === 'live' ? 0 : upcoming(t) ? 1 : 2)
    tours = [...tours].sort((a, b) => rank(a) - rank(b) || (rank(a) === 1 ? a.start.localeCompare(b.start) : b.ends.localeCompare(a.ends)))
  }

  const out = {
    team: team || 'all teams',
    series: tours.slice(0, clamp(int(limit, 3), 1, 6)).map(describeTour),
    source: `Wikipedia season table, ${snapshotNote(c.generated)}`,
  }
  if (live?.live && live.tour) out.onNow = `${live.tour.name}${live.india ? ' (India playing)' : ''}`
  if (!out.series.length) out.note = `No ${status === 'any' ? '' : `${status} `}series for ${team} in the site's season table.`
  return out
}

async function cricketResults({ team, gender = 'any', limit = 5, international = true } = {}) {
  const c = await siteFile('cricket.json')
  let r = c.recent
  if (international !== false) r = r.filter((m) => m.international)
  if (gender === 'men') r = r.filter((m) => m.gender === 'male')
  if (gender === 'women') r = r.filter((m) => m.gender === 'female')
  if (team) r = r.filter((m) => m.teams.some((t) => like(t, team)))
  r = [...r].sort((a, b) => b.date.localeCompare(a.date))
  const out = {
    results: r.slice(0, clamp(int(limit, 5), 1, 8)).map((m) => ({
      date: dateLabel(m.date),
      format: m.type,
      gender: m.gender === 'female' ? 'women' : 'men',
      event: m.event,
      teams: m.teams.join(' v '),
      winner: m.winner || null,
      margin: m.margin ? `${m.margin}${m.method ? ` (${m.method})` : ''}` : 'no result',
      venue: m.city || m.venue,
    })),
    matching: r.length,
    latestInData: dateLabel(c.recent[0]?.date),
    source: 'Cricsheet, which can trail live play by a week or two',
  }
  if (!r.length) out.note = `No ${team ? `${team} ` : ''}results among the ${c.recent.length} recent matches the site holds.`
  return out
}

/* ---------------- jobs ---------------- */

// The per-company limit in scripts/gen-jobs.mjs (PER_COMPANY).
const BOARD_CAP = 45

export const FAMILIES = {
  sre: 'SRE',
  infra: 'Infrastructure',
  security: 'Security',
  ml: 'AI / ML',
  data: 'Data',
  mobile: 'Mobile',
  frontend: 'Frontend',
  backend: 'Backend',
  eng: 'Software',
}

// Locations on job boards are free text, so the common ways of asking
// for a country are mapped to the ways boards write them.
const PLACES = {
  india: (l) => /india|bengaluru|bangalore|hyderabad|pune|mumbai|delhi|gurgaon|gurugram|noida|chennai/i.test(l),
  us: (l) =>
    /united states|\busa?\b|\bu\.s\.|san francisco|new york|seattle|austin|boston|chicago|denver|los angeles|bay area/i.test(l) ||
    /, (CA|NY|WA|TX|MA|IL|CO|OR|GA|NC|VA|DC|NJ|PA|UT|AZ|FL|MN)\b/.test(l),
  uk: (l) => /united kingdom|\buk\b|london|england|manchester|edinburgh/i.test(l),
  europe: (l) =>
    /europe|emea|london|dublin|amsterdam|berlin|paris|barcelona|madrid|lisbon|munich|zurich|stockholm|warsaw|prague|copenhagen|ireland|germany|france|spain|netherlands|poland|portugal|sweden|switzerland/i.test(l),
  canada: (l) => /canada|toronto|vancouver|montreal|waterloo/i.test(l),
}
const PLACE_ALIAS = { 'united states': 'us', usa: 'us', america: 'us', 'u s': 'us', 'united kingdom': 'uk', britain: 'uk', eu: 'europe' }

function inPlace(j, where) {
  const key = norm(where)
  if (key === 'remote') return !!j.r || /remote/i.test(j.l || '')
  const test = PLACES[key] || PLACES[PLACE_ALIAS[key]]
  return test ? test(j.l || '') : like(j.l, where)
}

// Words people say that a title wouldn't contain, or contains differently.
const STOP = new Set('a an the any some at in for of on to with and or me my show find get list open opening openings role roles job jobs position positions hiring vacancy vacancies there are is what which who please can you i want looking new latest'.split(' '))
const SYNONYMS = {
  sre: ['sre', 'site reliability', 'reliability'],
  ml: ['ml', 'machine learning'],
  ai: ['ai', 'machine learning', 'ml'],
  swe: ['software engineer', 'swe'],
  frontend: ['frontend', 'front end'],
  backend: ['backend', 'back end'],
  devops: ['devops', 'infrastructure', 'platform'],
  infra: ['infra', 'infrastructure'],
  pm: ['product manager'],
}

function titleMatch(j, word) {
  const hay = norm(`${j.t} ${j.m || ''}`)
  const options = SYNONYMS[word] || [word]
  return options.some((o) => hay.includes(norm(o))) || (FAMILIES[word] && j.f === word)
}

async function searchJobs({ query, company, location, family, senior, days, limit = 5 } = {}, now) {
  const d = await siteFile('jobs.json')
  const names = d.companies.map((c) => c.name)
  let J = d.jobs
  let co = company ? names.find((name) => like(name, company)) : null
  if (company && !co) return { matches: 0, note: `"${company}" isn't one of the ${names.length} companies on the board.`, companies: names.join(', ') }
  let where = location

  // A query like "sre at cloudflare in india" carries a company and a
  // place as well as title words. Those are lifted out into filters,
  // so they don't have to appear in the title. "us" only counts as a
  // country when it was written that way, not in "show us".
  const q = String(query || '').replace(/\bU\.S\.(?:A\.)?/gi, 'US')
  const saysUS = /\b(US|USA)\b/.test(q)
  const words = []
  for (const w of norm(q).split(' ')) {
    if (w === 'us') {
      if (saysUS && !where) where = 'us'
      continue
    }
    if (!w || STOP.has(w)) continue
    // Already a filter, or about to become one: never a title word.
    const isCo = w.length >= 3 && names.find((name) => norm(name).split(' ')[0] === w || norm(name).replace(/ /g, '') === w)
    if (isCo) {
      if (!co) co = isCo
      continue
    }
    if (w === 'remote' || PLACES[w] || PLACE_ALIAS[w]) {
      if (!where) where = w
      continue
    }
    words.push(w)
  }

  if (co) J = J.filter((j) => j.c === co)
  if (family && FAMILIES[family]) J = J.filter((j) => j.f === family)
  if (where) J = J.filter((j) => inPlace(j, where))
  if (senior) J = J.filter((j) => j.s)
  if (days) {
    const cutoff = now.getTime() - clamp(int(days, 30), 1, 365) * DAY
    J = J.filter((j) => j.d && Date.parse(j.d) >= cutoff)
  }
  if (words.length) J = J.filter((j) => words.every((w) => titleMatch(j, w)))
  J = [...J].sort((a, b) => (b.d || '').localeCompare(a.d || ''))

  const out = {
    matches: J.length,
    filters: { ...(co ? { company: co } : {}), ...(where ? { location: where } : {}), ...(words.length ? { title: words.join(' ') } : {}) },
    jobs: J.slice(0, clamp(int(limit, 5), 1, 6)).map((j) => ({
      title: j.t,
      company: j.c,
      location: j.l || (j.r ? 'Remote' : ''),
      posted: j.d ? relDay(new Date(`${j.d}T12:00:00`), now) : 'date unknown',
      url: j.u,
    })),
    source: `the site's jobs board, ${snapshotNote(d.generated)}`,
  }
  if (!co && J.length > out.jobs.length) {
    const by = {}
    J.forEach((j) => (by[j.c] = (by[j.c] || 0) + 1))
    out.byCompany = Object.entries(by)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))
  }
  return out
}

async function jobsSummary({ by = 'company', family, top = 5 } = {}, now) {
  const d = await siteFile('jobs.json')
  let J = d.jobs
  if (family && FAMILIES[family]) J = J.filter((j) => j.f === family)
  const key = by === 'family' ? (j) => FAMILIES[j.f] || j.f : by === 'sector' ? (j) => j.g || 'other' : (j) => j.c
  const counts = {}
  J.forEach((j) => (counts[key(j)] = (counts[key(j)] || 0) + 1))
  const cutoff = now.getTime() - 30 * DAY
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const out = {
    total: J.length,
    postedLast30Days: J.filter((j) => j.d && Date.parse(j.d) >= cutoff).length,
    remote: J.filter((j) => j.r).length,
    companies: d.companies.length,
    groupedBy: by,
    groups: sorted.slice(0, clamp(int(top, 5), 1, 10)).map(([name, count]) => ({ name, count })),
    source: `the site's jobs board, ${snapshotNote(d.generated)}`,
  }
  // The board keeps at most BOARD_CAP roles per company, so a tie at
  // that number means "at least this many", not "the most".
  const max = sorted[0]?.[1]
  const tied = sorted.filter(([, c]) => c === max).map(([name]) => name)
  if (tied.length > 1) {
    out.tiedAtTop = { count: max, names: tied }
    if (by === 'company' && max === BOARD_CAP) out.capNote = `The board lists at most ${BOARD_CAP} roles per company, so these may each have more.`
  }
  return out
}

/* ---------------- pages ---------------- */

// Public pages only. The unlisted notes are shared by link and stay
// that way, so the agent can't be talked into opening them.
export const PAGES = {
  home: ['', 'the home page'],
  f1: ['#/f1', 'the F1 page'],
  cricket: ['#/cricket', 'the cricket page'],
  jobs: ['#/jobs', 'the jobs board'],
  blog: ['#/blog', 'the blog'],
  essays: ['#/longgame', 'The Long Game essays'],
  now: ['#/now', 'the Now page'],
  uses: ['#/uses', 'the Uses page'],
  timeline: ['#/timeline', 'the learning timeline'],
  notes: ['#/notes', 'the knowledge base'],
  music: ['#/music', 'the music library'],
  movies: ['#/movies', 'the movies page'],
  photos: ['#/photos', 'the photography page'],
  space: ['#/space', 'the solar system explorer'],
  workspace: ['#/workspace', 'the 3D workspace'],
  reliability: ['#/reliability', 'the Reliability Lab'],
  ebc: ['#/ebc', 'the Everest Base Camp plan'],
}

function openPage({ page } = {}) {
  const key = norm(page).replace(/ /g, '')
  const hit = PAGES[key]
  if (!hit) return { error: `There's no page called "${page}". Pages: ${Object.keys(PAGES).join(', ')}.` }
  return { page: key, title: hit[1], hash: hit[0] }
}

/* ---------------- the tools, as the model sees them ---------------- */

const fn = (name, description, properties, required = []) => ({
  type: 'function',
  function: { name, description, parameters: { type: 'object', properties, required } },
})

const TEAM = { type: 'string', description: 'Team name, e.g. India' }

export const TOOLS = [
  fn('f1_standings', 'Formula 1 championship standings this season, live.', {
    table: { type: 'string', enum: ['drivers', 'constructors'] },
    top: { type: 'integer', description: 'How many from the top. Default 5.' },
    find: { type: 'string', description: 'A driver or team to look up' },
  }, ['table']),
  fn('f1_race', 'Formula 1 races: the next one, the last result, the season calendar, or one race by round or name.', {
    which: { type: 'string', enum: ['next', 'last', 'calendar'] },
    round: { type: 'integer' },
    name: { type: 'string', description: 'Grand Prix, city or circuit, e.g. Monza' },
  }),
  fn('cricket_rankings', "ICC men's team rankings. A team with no format returns its place in all three formats in one call; a format returns that table.", {
    team: TEAM,
    format: { type: 'string', enum: ['test', 'odi', 't20i'], description: 'Leave out for all three' },
    top: { type: 'integer' },
  }),
  fn('cricket_series', 'International cricket series and how each stands, format by format.', {
    team: TEAM,
    status: { type: 'string', enum: ['live', 'upcoming', 'recent', 'any'] },
    limit: { type: 'integer' },
  }),
  fn('cricket_results', 'Recent international match results with the winner and margin.', {
    team: TEAM,
    gender: { type: 'string', enum: ['men', 'women', 'any'] },
    limit: { type: 'integer' },
  }),
  fn('search_jobs', "Search the site's board of engineering jobs at about 40 product companies.", {
    query: { type: 'string', description: 'Words in the job title, e.g. staff backend' },
    company: { type: 'string' },
    location: { type: 'string', description: 'City, country, or remote' },
    family: { type: 'string', enum: Object.keys(FAMILIES) },
    senior: { type: 'boolean', description: 'Senior, staff and above only' },
    days: { type: 'integer', description: 'Posted within this many days' },
    limit: { type: 'integer' },
  }),
  fn('jobs_summary', 'Counts on the jobs board, grouped by company, role family or sector.', {
    by: { type: 'string', enum: ['company', 'family', 'sector'] },
    family: { type: 'string', enum: Object.keys(FAMILIES) },
    top: { type: 'integer' },
  }),
  fn('open_page', "Take the visitor to a page of this site, only when they ask to open, show or go to one. Then say you're opening it.", {
    page: { type: 'string', enum: Object.keys(PAGES) },
  }, ['page']),
]

const IMPL = {
  f1_standings: f1Standings,
  f1_race: f1Race,
  cricket_rankings: cricketRankings,
  cricket_series: cricketSeries,
  cricket_results: cricketResults,
  search_jobs: searchJobs,
  jobs_summary: jobsSummary,
  open_page: openPage,
}

export const TOOL_LABELS = {
  f1_standings: 'F1 standings',
  f1_race: 'F1 races',
  cricket_rankings: 'Cricket rankings',
  cricket_series: 'Cricket series',
  cricket_results: 'Cricket results',
  search_jobs: 'Jobs search',
  jobs_summary: 'Jobs summary',
  open_page: 'Navigation',
}

/* ---------------- one-line descriptions ---------------- */

const live = (src) => (src === 'live' ? 'live' : src)

// The short line the trace shows under each tool call.
export function summarize(name, r) {
  if (!r) return ''
  if (r.error) return r.error
  if (r.note && (r.found?.length === 0 || !(r.top || r.series?.length || r.results?.length || r.jobs?.length))) return r.note
  switch (name) {
    case 'f1_standings':
      return r.found?.length
        ? `${r.found[0].name}: P${r.found[0].pos}, ${r.found[0].points} pts · ${live(r.source)} after round ${r.afterRound}`
        : `top ${r.top.length} ${r.table} · ${live(r.source)} after round ${r.afterRound}`
    case 'f1_race':
      if (r.podium?.length) return `Round ${r.round} · ${r.name} · won by ${r.podium[0].driver}`
      if (r.remaining != null) return `${r.remaining} of ${r.total} races left · ${live(r.source)}`
      if (r.winner) return `Round ${r.round} · ${r.name} · won by ${r.winner}`
      return `Round ${r.round} · ${r.name} · ${r.when}`
    case 'cricket_rankings':
      if (r.rankings) return `${r.team}: ${r.rankings.map((x) => `${x.format} ${x.pos ? `#${x.pos}` : '—'}`).join(' · ')}`
      return r.tables.map((t) => `${t.format}: ${t.top[0]?.team || '—'}`).join(' · ')
    case 'cricket_series':
      return `${r.series.length} series · latest: ${r.series[0]?.name}`
    case 'cricket_results':
      return `${r.results.length} of ${r.matching} results · latest ${r.results[0]?.date}`
    case 'search_jobs':
      return `${r.matches} matching role${r.matches === 1 ? '' : 's'}`
    case 'jobs_summary':
      return r.tiedAtTop
        ? `${r.total} roles · ${r.tiedAtTop.names.length} tied at ${r.tiedAtTop.count}`
        : r.groups?.length ? `${r.total} roles · most: ${r.groups[0].name} (${r.groups[0].count})` : `${r.total} roles`
    case 'open_page':
      return `→ ${r.title}`
    default:
      return ''
  }
}

const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

// A correct one-line reading of a tool result. It travels with the
// result as `headline`, so the model has an accurate sentence to build
// on instead of reading counts out of JSON, which is where small models
// slip. It is also what gets spoken when no model can be reached.
export function headline(name, r) {
  if (!r) return "I couldn't get an answer for that."
  if (r.error) return r.error
  if (r.note && (r.found?.length === 0 || !(r.top || r.series?.length || r.results?.length || r.jobs?.length))) return r.note
  switch (name) {
    case 'f1_standings': {
      if (!r.top?.length) return 'There are no standings yet this season.'
      const f = r.found || []
      if (f.length) return f.map((x) => `${x.name} is P${x.pos} on ${x.points} points, ${x.behindLeader} behind the leader`).join('; ') + `, after round ${r.afterRound}.`
      const [a, b, c] = r.top
      return `${a.name} leads the ${r.table} championship on ${a.points} points after round ${r.afterRound}${b ? `, ${a.points - b.points} ahead of ${b.name}` : ''}${c ? `, with ${c.name} third on ${c.points}` : ''}.`
    }
    case 'f1_race':
      if (r.podium?.length) return `${r.podium[0].driver} won the ${r.name}${r.podium.length > 1 ? `, ahead of ${list(r.podium.slice(1).map((p) => p.driver))}` : ''}.`
      if (r.remaining != null) return `${plural(r.remaining, 'race is', 'races are')} left of ${r.total}${r.upcoming[0] ? `, next the ${r.upcoming[0].name} on ${r.upcoming[0].date}` : ''}.`
      if (r.winner) return `${r.winner} won the ${r.name}.`
      return `The ${r.name} is ${r.when}, ${r.starts} your time${r.qualifying ? `, with qualifying ${r.qualifying}` : ''}.`
    case 'cricket_rankings': {
      if (r.rankings) {
        const ranked = r.rankings.filter((x) => x.pos)
        return ranked.length
          ? `${r.team} are ${list(ranked.map((x) => `number ${x.pos} in ${x.format}s`))}.`
          : `${r.team} aren't in the ICC men's ranking tables the site holds.`
      }
      const tops = r.tables.filter((t) => t.top.length)
      return tops.length ? list(tops.map((t) => `${t.top[0].team} top the ${t.format} rankings`)) + '.' : 'The ranking tables are empty.'
    }
    case 'cricket_series': {
      const s = r.series[0]
      const f = s.formats.map((x) => `${x.format}s: ${x.outcome}`)
      return `${s.name} (${s.dates}): ${f.length ? f.join('; ') : 'no results yet'}.`
    }
    case 'cricket_results': {
      const m = r.results[0]
      return m.winner ? `Latest: ${m.winner} won ${m.teams} by ${m.margin} on ${m.date}.` : `Latest: ${m.teams} on ${m.date} ended with no result.`
    }
    case 'search_jobs':
      return r.matches
        ? `${r.matches === 1 ? 'One role matches' : `${r.matches} roles match`}; the newest is ${r.jobs[0].title} at ${r.jobs[0].company}, posted ${r.jobs[0].posted}.`
        : 'Nothing on the board matches that right now.'
    case 'jobs_summary': {
      if (!r.groups?.length) return 'No roles on the board match that.'
      const t = r.tiedAtTop
      if (t) {
        const names = t.names.length > 4 ? `${t.names.slice(0, 4).join(', ')} and ${t.names.length - 4} more` : list(t.names)
        return `${t.names.length} are tied at the top with ${t.count} each: ${names}${r.capNote ? `. That's the most the board lists per company, so any of them may have more` : ''}.`
      }
      const [a, b, c] = r.groups
      return `${a.name} has the most with ${a.count}${b ? `, then ${b.name} with ${b.count}` : ''}${c ? ` and ${c.name} with ${c.count}` : ''}, out of ${r.total} roles on the board.`
    }
    case 'open_page':
      return `Opening ${r.title}.`
    default:
      return "Here's what I found."
  }
}

/* ---------------- the offline router ---------------- */

// Only for when no model can be reached. Coarse on purpose: it finds
// the topic and the most likely tool, and leaves nuance to the model.
export function route(q) {
  const s = norm(q)
  const has = (re) => re.test(s)

  if (has(/\b(open|go to|take me|show me|navigate)\b/)) {
    // Whole words only, so "workspace" isn't "space" and "knowledge"
    // isn't "now"; then a few other names people use for the pages.
    const word = (w) => new RegExp(`\\b${w}\\b`).test(s)
    const alias = { formula: 'f1', knowledge: 'notes', essay: 'essays', 'long game': 'essays', photography: 'photos', 'solar system': 'space', everest: 'ebc', 'base camp': 'ebc', homepage: 'home' }
    const page = Object.keys(PAGES).find(word) || alias[Object.keys(alias).find(word)]
    if (page) return { name: 'open_page', args: { page } }
  }
  if (has(/\b(f1|formula|grand prix|gp|race|qualifying|podium|pole|verstappen|norris|leclerc|hamilton|russell|antonelli|piastri|constructors?)\b/)) {
    if (has(/\b(next|when|upcoming|qualifying)\b/)) return { name: 'f1_race', args: { which: 'next' } }
    if (has(/\b(last|won|win|winner|podium|result)\b/)) return { name: 'f1_race', args: { which: 'last' } }
    if (has(/\b(calendar|left|remaining|schedule)\b/)) return { name: 'f1_race', args: { which: 'calendar' } }
    return { name: 'f1_standings', args: { table: has(/\b(constructors?|teams?)\b/) ? 'constructors' : 'drivers', top: 3 } }
  }
  if (has(/\b(cricket|test|tests|odi|odis|t20|t20i|rank|ranks|ranking|rankings|ranked|series|tour|wicket|wickets|runs)\b/)) {
    if (has(/\b(rank|ranking|rankings|ranked|number)\b/)) return { name: 'cricket_rankings', args: { team: 'India' } }
    if (has(/\b(result|results|won|win|beat|lost)\b/)) return { name: 'cricket_results', args: { team: has(/\bindia\b/) ? 'India' : undefined } }
    return { name: 'cricket_series', args: { team: 'India' } }
  }
  if (has(/\b(job|jobs|role|roles|hiring|openings?|positions?|vacanc)/)) {
    if (has(/\b(how many|most|which compan|count)\b/)) return { name: 'jobs_summary', args: { by: 'company' } }
    return { name: 'search_jobs', args: { query: q, location: has(/\bindia\b/) ? 'india' : has(/\bremote\b/) ? 'remote' : undefined } }
  }
  return null
}

/* ---------------- the loop ---------------- */

// The free tier allows 8,000 tokens a minute per model, and tool
// definitions are most of every request. So a question only carries
// the tools for its topic, worked out from its words or, for a
// follow-up like "and the constructors?", from the question before.
// Nothing recognisable means every tool goes.
const TOPICS = [
  [/\b(f1|formula|grand prix|gp|races?|racing|qualifying|sprint|podium|pole|laps?|drivers?|constructors?|championship|verstappen|norris|leclerc|hamilton|russell|antonelli|piastri|alonso|sainz|ferrari|mclaren|mercedes|red bull|williams|aston|alpine|haas|sauber|audi|cadillac|monza|silverstone|monaco|suzuka|singapore|abu dhabi|vegas)\b/, ['f1_standings', 'f1_race']],
  [/\b(cricket|tests?|odis?|t20i?s?|rank\w*|series|tours?|wickets?|runs|innings|batting|bowling|india|australia|england|pakistan|sri lanka|bangladesh|zimbabwe|afghanistan|new zealand|south africa|west indies|ireland|nepal)\b/, ['cricket_rankings', 'cricket_series', 'cricket_results']],
  [/\b(jobs?|roles?|hiring|hire|openings?|positions?|vacanc\w*|careers?|engineers?|engineering|sre|backend|frontend|remote|compan\w*|staff|senior|principal|stripe|cloudflare|databricks|datadog|mongodb|gitlab|anthropic|openai|figma|notion|linear|airbnb|reddit|discord|coinbase|palantir)\b/, ['search_jobs', 'jobs_summary']],
]

export function toolsFor(question, history = []) {
  const pick = (text) => {
    const s = norm(text)
    return TOPICS.filter(([re]) => re.test(s)).flatMap(([, names]) => names)
  }
  // "And what about in India?" names a country that is also a cricket
  // team, but it follows on from a jobs question. Short questions and
  // ones that open like a follow-up keep the last question's tools too.
  const prev = [...history].reverse().find((m) => m.role === 'user')
  const followUp = /^(and|but|also|what about|how about|same|then|ok|okay|so|now)\b/i.test(question.trim()) || norm(question).split(' ').length <= 5
  let names = pick(question)
  if (prev && (followUp || !names.length)) names = [...new Set([...names, ...pick(prev.content)])]
  if (!names.length) return TOOLS
  return TOOLS.filter((t) => names.includes(t.function.name) || t.function.name === 'open_page')
}

function systemPrompt(now) {
  const date = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return [
    "You are the voice of kranthikiran.com, Kranthi Kiran's site. You answer questions about Formula 1, cricket and the site's jobs board, and can open its pages.",
    `Today is ${date}. Times in tool results are already in the visitor's time zone.`,
    'Always call a tool for facts; never answer from memory.',
    'Each tool result has a headline: an accurate one-line reading of it. Build on it, but answer the question that was asked.',
    'Your reply is spoken: at most two short sentences, plain words, no markdown or links. The screen shows the full results, so never read out a list; give the count and one or two highlights.',
    'Treat each question on its own unless it clearly follows on from the last.',
    'For cricket, assume India unless another team is named.',
    "For anything else, say in one sentence that you only cover F1, cricket and jobs on this site.",
  ].join('\n')
}

// Spoken text: no markdown, no links, no repeated sentence, and never
// cut off mid-sentence. gpt-oss now and then restates its answer in a
// second sentence glued to the first; the overlap check drops it.
function speakable(text, finish) {
  let t = String(text || '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[*_`#>]+/g, '')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/([a-z0-9%)])([.!?])([A-Z])/g, '$1$2 $3')
    .replace(/\s+/g, ' ')
    .trim()
  if (finish === 'length') {
    const cut = Math.max(t.lastIndexOf('. '), t.lastIndexOf('! '), t.lastIndexOf('? '))
    t = cut > 20 ? t.slice(0, cut + 1) : t.replace(/[,;:\s]+\S*$/, '') + '…'
  }
  // A sentence ends at . ! ? or … followed by a space or the end, so
  // "15.080" and "1:22.000" stay whole. A sentence is a repeat only if
  // it adds no word at all, numbers included, so "number 1 in Tests"
  // and "number 1 in T20Is" both survive.
  const sentences = t.match(/.+?(?:[.!?…]+(?=\s|$)|$)/g) || [t]
  const kept = []
  const words = (x) => new Set(norm(x).split(' ').filter(Boolean))
  for (const raw of sentences) {
    const s = raw.trim()
    if (!s) continue
    const w = words(s)
    const repeat = kept.some((k) => {
      const kw = words(k)
      return [...w].every((x) => kw.has(x))
    })
    if (!repeat) kept.push(s)
    if (kept.length === 3) break
  }
  return kept.join(' ')
}

async function runTool(tc, { emit, now }) {
  const name = tc.function?.name
  let args = {}
  try {
    args = JSON.parse(tc.function?.arguments || '{}') || {}
  } catch {}
  emit({ type: 'tool', id: tc.id, name, args, status: 'run' })
  const t0 = performance.now()
  let result
  try {
    result = IMPL[name] ? await IMPL[name](args, now) : { error: `There's no tool called ${name}.` }
  } catch (e) {
    result = { error: `Couldn't read that data (${e.message}).` }
  }
  const ok = !result?.error
  let summary = ''
  try {
    if (ok) result = { headline: headline(name, result), ...result }
    summary = summarize(name, result)
  } catch {
    // A sentence that can't be built shouldn't sink the whole answer.
  }
  emit({ type: 'tool', id: tc.id, name, args, status: ok ? 'done' : 'fail', ms: Math.round(performance.now() - t0), result, summary })
  return { name, result, page: name === 'open_page' && ok ? result : null }
}

async function offline(question, { emit, now, t0 }) {
  const pick = route(question)
  emit({ type: 'note', id: 'offline', text: pick ? 'No model reachable, so the built-in router picked the tool.' : 'No model reachable, and the router has no tool for this.' })
  if (!pick) {
    const text = "I can't reach my model right now. Try asking about F1, cricket or jobs, or ask me to open a page."
    emit({ type: 'answer', text, ms: Math.round(performance.now() - t0), offline: true })
    return { text, page: null, offline: true }
  }
  const out = await runTool({ id: 'offline-tool', function: { name: pick.name, arguments: JSON.stringify(pick.args) } }, { emit, now })
  const text = headline(out.name, out.result)
  emit({ type: 'answer', text, page: out.page, ms: Math.round(performance.now() - t0), offline: true })
  return { text, page: out.page, offline: true }
}

// When every model is only rate-limited, Groq says how long to wait.
// A short wait is worth it; a long one isn't, for a spoken answer.
function retryAfter(err) {
  const s = err?.skipped
  if (!s?.length || !s.every((x) => /rate.?limit/i.test(x.reason))) return 0
  const waits = s.map((x) => parseFloat((x.reason.match(/try again in ([\d.]+)s/i) || [])[1])).filter(Number.isFinite)
  const wait = waits.length ? Math.min(...waits) : 0
  return wait > 0 && wait <= 8 ? Math.ceil(wait * 10) / 10 : 0
}

const pause = (ms, signal) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })

/**
 * Ask the agent one question.
 *
 * history is earlier turns as plain { role, content } text, so a
 * follow-up like "and the constructors?" has something to refer to.
 * Tool traffic from earlier turns is left out to keep requests small.
 *
 * Events, in order, for the live trace:
 *   { type: 'think', id, status: 'run' | 'done' | 'fail', model, ms, usage, skipped, tools, offered }
 *   { type: 'tool',  id, name, args, status: 'run' | 'done' | 'fail', ms, result, summary }
 *   { type: 'note',  id, text }
 *   { type: 'answer', text, page, ms, offline }
 */
export async function ask(question, { history = [], signal, onEvent = () => {}, now = new Date() } = {}) {
  const emit = (e) => onEvent(e)
  const t0 = performance.now()
  const past = history.slice(-4)
  const tools = toolsFor(question, past)
  const messages = [{ role: 'system', content: systemPrompt(now) }, ...past, { role: 'user', content: question }]
  let page = null
  let last = null
  let retried = false
  let thinks = 0

  for (let step = 0; step < MAX_STEPS; step++) {
    const final = step === MAX_STEPS - 1
    const id = `think-${thinks++}`
    emit({ type: 'think', id, status: 'run', offered: tools.map((t) => t.function.name) })

    let res
    try {
      res = await groqTools(messages, { tools, tool_choice: final ? 'none' : 'auto', signal })
    } catch (e) {
      if (e?.name === 'AbortError') throw e
      const wait = retried ? 0 : retryAfter(e)
      if (wait) {
        retried = true
        emit({ type: 'think', id, status: 'fail', error: 'Both models are rate-limited.', skipped: e.skipped })
        emit({ type: 'note', id: `wait-${id}`, text: `Groq asked for ${wait}s, so waiting and trying again.` })
        await pause(wait * 1000, signal)
        step--
        continue
      }
      emit({ type: 'think', id, status: 'fail', error: e.message, skipped: e.skipped })
      if (last) {
        // The data is already in hand; only the wording failed.
        const text = headline(last.name, last.result)
        emit({ type: 'answer', text, page, ms: Math.round(performance.now() - t0), offline: true })
        return { text, page, offline: true }
      }
      return offline(question, { emit, now, t0 })
    }

    const { message, model, ms, data, skipped } = res
    const calls = final ? [] : (message.tool_calls || []).slice(0, 3)
    emit({ type: 'think', id, status: 'done', model, ms, usage: data.usage, skipped, tools: calls.map((c) => c.function?.name) })

    if (calls.length) {
      messages.push({ role: 'assistant', content: message.content || '', tool_calls: calls })
      const outs = await Promise.all(calls.map((tc) => runTool(tc, { emit, now })))
      outs.forEach((o, i) => {
        if (o.page) page = o.page
        last = o
        messages.push({ role: 'tool', tool_call_id: calls[i].id, content: JSON.stringify(o.result) })
      })
      continue
    }

    let text = speakable(message.content, data.choices?.[0]?.finish_reason)
    if (!text) text = last ? headline(last.name, last.result) : "Sorry, I didn't get an answer for that."
    emit({ type: 'answer', text, page, ms: Math.round(performance.now() - t0) })
    return { text, page }
  }
}
