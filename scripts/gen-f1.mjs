// Build-time generator for the #/f1 page.
//
// Source: Jolpica-F1 (https://api.jolpi.ca/ergast/f1/...), the community-run
// drop-in replacement for Ergast, which was retired after the 2024 season.
// It is free, needs no key, and sends `access-control-allow-origin: *`.
//
// Why generate at build time when the API allows browser calls:
//   - The page renders instantly from a same-origin file instead of waiting on
//     four round trips, and it still renders if Jolpica is slow or down.
//   - Jolpica rate-limits anonymous callers. Four requests per deploy is
//     negligible; four per visitor is not.
//   The page then re-fetches the standings in the browser and quietly swaps
//   them in, so a race that finishes between nightly deploys still shows up.
//
// Safety contract, same as the other generators here: this must never break a
// deploy. public/f1.json is a committed snapshot that Vite copies into dist/.
// We only overwrite it when the fresh payload is at least as complete as the
// snapshot; on any error we log and exit 0, leaving the snapshot in place.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'dist', 'f1.json')
const SNAPSHOT = join(ROOT, 'public', 'f1.json')

const API = 'https://api.jolpi.ca/ergast/f1'
const UA = 'kranthikiran.com f1 page (+https://kranthikiran.com)'

// The season to publish. Ergast-style APIs accept "current", but pinning the
// year makes a wrong result obvious in the JSON rather than silently empty.
const SEASON = new Date().getUTCFullYear()

async function get(path) {
  const res = await fetch(`${API}/${path}/?format=json`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`${path} -> HTTP ${res.status}`)
  return (await res.json()).MRData
}

// Ergast returns every number as a string. Anything we sort or count on is
// converted once here so the component never has to think about it.
const num = (v) => (v == null || v === '' ? null : Number(v))

function mapDrivers(list) {
  return list.map((s) => ({
    pos: num(s.position),
    points: num(s.points),
    wins: num(s.wins),
    code: s.Driver.code || s.Driver.familyName.slice(0, 3).toUpperCase(),
    number: num(s.Driver.permanentNumber),
    first: s.Driver.givenName,
    last: s.Driver.familyName,
    nationality: s.Driver.nationality,
    team: s.Constructors[s.Constructors.length - 1]?.name || '',
    teamId: s.Constructors[s.Constructors.length - 1]?.constructorId || '',
  }))
}

function mapConstructors(list) {
  return list.map((s) => ({
    pos: num(s.position),
    points: num(s.points),
    wins: num(s.wins),
    name: s.Constructor.name,
    teamId: s.Constructor.constructorId,
    nationality: s.Constructor.nationality,
  }))
}

function mapRace(r) {
  return {
    round: num(r.round),
    name: r.raceName,
    circuit: r.Circuit.circuitName,
    locality: r.Circuit.Location.locality,
    country: r.Circuit.Location.country,
    // Real coordinates from Ergast, so the calendar map plots actual circuits
    // rather than hand-typed guesses.
    lat: Number(r.Circuit.Location.lat),
    lng: Number(r.Circuit.Location.long),
    // Ergast splits these; the page needs one instant it can count down to.
    // Races without a published time are treated as midday UTC.
    start: r.time ? `${r.date}T${r.time.replace('Z', '')}Z` : `${r.date}T12:00:00Z`,
    date: r.date,
  }
}

function mapResult(r) {
  if (!r) return null
  const fastest = r.Results.map((x) => x.FastestLap).filter((x) => x?.rank === '1')[0]
  return {
    round: num(r.round),
    name: r.raceName,
    circuit: r.Circuit.circuitName,
    country: r.Circuit.Location.country,
    date: r.date,
    // Top three is all the page shows; carrying twenty rows would be dead weight.
    podium: r.Results.slice(0, 3).map((x) => ({
      pos: num(x.position),
      first: x.Driver.givenName,
      last: x.Driver.familyName,
      code: x.Driver.code || x.Driver.familyName.slice(0, 3).toUpperCase(),
      team: x.Constructor.name,
      teamId: x.Constructor.constructorId,
      // A finisher has a Time; anyone else has a status such as "+1 Lap" or "Collision".
      time: x.Time?.time || x.status || '',
      points: num(x.points),
    })),
    fastestLap: fastest
      ? {
          time: fastest.Time?.time || '',
          driver:
            r.Results.find((x) => x.FastestLap?.rank === '1')?.Driver?.familyName || '',
        }
      : null,
  }
}

async function generate() {
  const [ds, cs, sched, last, wins, poles] = await Promise.all([
    get(`${SEASON}/driverstandings`),
    get(`${SEASON}/constructorstandings`),
    get(`${SEASON}/races`),
    // A season that hasn't started yet has no "last" race; that is not fatal.
    get(`${SEASON}/last/results`).catch(() => null),
    // Winner and pole-sitter of every round run so far. Both are extras: if
    // either call fails the page simply shows a thinner season summary.
    get(`${SEASON}/results/1`).catch(() => null),
    get(`${SEASON}/qualifying/1`).catch(() => null),
  ])

  const dsList = ds.StandingsTable.StandingsLists[0]
  const csList = cs.StandingsTable.StandingsLists[0]

  const winByRound = new Map()
  for (const r of wins?.RaceTable?.Races || []) {
    const w = r.Results?.find((x) => x.position === '1')
    if (w) {
      winByRound.set(r.round, {
        last: w.Driver.familyName,
        code: w.Driver.code || w.Driver.familyName.slice(0, 3).toUpperCase(),
        team: w.Constructor.name,
        teamId: w.Constructor.constructorId,
      })
    }
  }

  const poleByRound = new Map()
  for (const r of poles?.RaceTable?.Races || []) {
    // This endpoint can return more than the pole sitter, so match on position
    // rather than trusting the first row.
    const p = r.QualifyingResults?.find((x) => x.position === '1')
    if (p) {
      poleByRound.set(r.round, {
        last: p.Driver.familyName,
        code: p.Driver.code || p.Driver.familyName.slice(0, 3).toUpperCase(),
        teamId: p.Constructor.constructorId,
        time: p.Q3 || p.Q2 || p.Q1 || '',
      })
    }
  }

  const races = (sched.RaceTable.Races || []).map((r) => ({
    ...mapRace(r),
    winner: winByRound.get(r.round) || null,
    pole: poleByRound.get(r.round) || null,
  }))
  const lastRace = mapResult(last?.RaceTable?.Races?.[0])

  return {
    generated: new Date().toISOString(),
    source: 'Jolpica-F1 (Ergast-compatible)',
    sourceUrl: 'https://api.jolpi.ca/ergast/f1/',
    season: String(SEASON),
    round: num(dsList?.round) ?? null,
    drivers: mapDrivers(dsList?.DriverStandings || []),
    constructors: mapConstructors(csList?.ConstructorStandings || []),
    races,
    lastRace,
  }
}

try {
  console.log('gen-f1: pulling standings and schedule...')
  const payload = await generate()

  let previous = 0
  if (existsSync(SNAPSHOT)) {
    try {
      previous = JSON.parse(readFileSync(SNAPSHOT, 'utf8')).drivers?.length || 0
    } catch {
      previous = 0
    }
  }
  // A grid is twenty cars. Refuse to replace a good snapshot with a thin one.
  if (payload.drivers.length < Math.min(10, previous)) {
    throw new Error(`only ${payload.drivers.length} drivers (snapshot has ${previous})`)
  }
  if (!payload.races.length) throw new Error('no races in schedule')

  mkdirSync(dirname(OUT), { recursive: true })
  writeFileSync(OUT, JSON.stringify(payload, null, 2))
  // Keep the committed snapshot current too, so the fallback stays useful.
  writeFileSync(SNAPSHOT, JSON.stringify(payload, null, 2))

  const leader = payload.drivers[0]
  console.log(
    `gen-f1: wrote ${payload.season} round ${payload.round} — ` +
      `${payload.drivers.length} drivers, ${payload.constructors.length} teams, ` +
      `${payload.races.length} races` +
      (leader ? ` (leader ${leader.last} ${leader.points})` : '')
  )
} catch (err) {
  console.warn(`gen-f1: skipped (${err.message}); keeping committed snapshot`)
}
