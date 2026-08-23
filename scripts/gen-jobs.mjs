// Build-time generator for the #/jobs board.
//
// Reads the public job boards of a set of product companies and writes a
// single normalised list. Three applicant tracking systems cover almost
// all of them, and all three answer anonymous cross-origin requests:
//
//   Greenhouse  boards-api.greenhouse.io/v1/boards/<slug>/jobs
//   Ashby       api.ashbyhq.com/posting-api/job-board/<slug>
//   Lever       api.lever.co/v0/postings/<slug>?mode=json
//
// This runs at build time rather than in the browser for a reason worth
// stating: the thirty-odd boards are about 15 MB of JSON between them,
// and Datadog alone is 0.6 MB. Fetching that from a phone to render one
// page would undo everything the lite build just fixed. Here it costs a
// CI minute and ships as one small file, refreshed by the daily deploy.
//
// Safety contract, same as the other generators: this must never break a
// deploy. public/jobs.json is a committed snapshot that Vite copies into
// dist/. Every board is fetched independently and a failure in one is
// skipped rather than fatal; a total failure exits 0 and leaves the
// snapshot untouched.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'dist', 'jobs.json')
const SNAPSHOT = join(ROOT, 'public', 'jobs.json')

const UA = 'kranthikiran.com jobs board (+https://kranthikiran.com)'

// Every slug here was checked against the live board before being added.
// The ones that look wrong are right: DoorDash publishes under
// "doordashusa", Temporal under "temporaltechnologies". Several obvious
// names — atlassian, confluent, sentry, plaid — either 404 or return an
// empty board and are left out rather than shipped as silent gaps.
const COMPANIES = [
  // Infrastructure and developer tools
  { name: 'Stripe', ats: 'greenhouse', slug: 'stripe', tag: 'fintech' },
  { name: 'Cloudflare', ats: 'greenhouse', slug: 'cloudflare', tag: 'infra' },
  { name: 'Databricks', ats: 'greenhouse', slug: 'databricks', tag: 'data' },
  { name: 'Datadog', ats: 'greenhouse', slug: 'datadog', tag: 'infra' },
  { name: 'MongoDB', ats: 'greenhouse', slug: 'mongodb', tag: 'data' },
  { name: 'Elastic', ats: 'greenhouse', slug: 'elastic', tag: 'data' },
  { name: 'GitLab', ats: 'greenhouse', slug: 'gitlab', tag: 'devtools' },
  { name: 'Grafana Labs', ats: 'greenhouse', slug: 'grafanalabs', tag: 'infra' },
  { name: 'CockroachDB', ats: 'greenhouse', slug: 'cockroachlabs', tag: 'data' },
  { name: 'Temporal', ats: 'greenhouse', slug: 'temporaltechnologies', tag: 'infra' },
  { name: 'Vercel', ats: 'greenhouse', slug: 'vercel', tag: 'devtools' },
  { name: 'Rubrik', ats: 'greenhouse', slug: 'rubrik', tag: 'infra' },

  // AI
  { name: 'Anthropic', ats: 'greenhouse', slug: 'anthropic', tag: 'ai' },
  { name: 'OpenAI', ats: 'ashby', slug: 'openai', tag: 'ai' },

  // Product
  { name: 'Figma', ats: 'greenhouse', slug: 'figma', tag: 'product' },
  { name: 'Notion', ats: 'ashby', slug: 'notion', tag: 'product' },
  { name: 'Linear', ats: 'ashby', slug: 'linear', tag: 'product' },
  { name: 'Airtable', ats: 'greenhouse', slug: 'airtable', tag: 'product' },
  { name: 'Webflow', ats: 'greenhouse', slug: 'webflow', tag: 'product' },
  { name: 'Calendly', ats: 'greenhouse', slug: 'calendly', tag: 'product' },
  { name: 'Asana', ats: 'greenhouse', slug: 'asana', tag: 'product' },
  { name: 'Dropbox', ats: 'greenhouse', slug: 'dropbox', tag: 'product' },
  { name: 'Duolingo', ats: 'greenhouse', slug: 'duolingo', tag: 'product' },

  // Consumer and marketplaces
  { name: 'Airbnb', ats: 'greenhouse', slug: 'airbnb', tag: 'consumer' },
  { name: 'Reddit', ats: 'greenhouse', slug: 'reddit', tag: 'consumer' },
  { name: 'Discord', ats: 'greenhouse', slug: 'discord', tag: 'consumer' },
  { name: 'Pinterest', ats: 'greenhouse', slug: 'pinterest', tag: 'consumer' },
  { name: 'DoorDash', ats: 'greenhouse', slug: 'doordashusa', tag: 'consumer' },
  { name: 'Instacart', ats: 'greenhouse', slug: 'instacart', tag: 'consumer' },
  { name: 'Lyft', ats: 'greenhouse', slug: 'lyft', tag: 'consumer' },

  // Fintech
  { name: 'Coinbase', ats: 'greenhouse', slug: 'coinbase', tag: 'fintech' },
  { name: 'Ramp', ats: 'ashby', slug: 'ramp', tag: 'fintech' },
  { name: 'Brex', ats: 'greenhouse', slug: 'brex', tag: 'fintech' },
  { name: 'Affirm', ats: 'greenhouse', slug: 'affirm', tag: 'fintech' },
  { name: 'Chime', ats: 'greenhouse', slug: 'chime', tag: 'fintech' },
  { name: 'Robinhood', ats: 'greenhouse', slug: 'robinhood', tag: 'fintech' },

  // Other
  { name: 'Palantir', ats: 'lever', slug: 'palantir', tag: 'infra' },
  { name: 'Twilio', ats: 'greenhouse', slug: 'twilio', tag: 'infra' },
  { name: 'Samsara', ats: 'greenhouse', slug: 'samsara', tag: 'iot' },
  { name: 'Flexport', ats: 'greenhouse', slug: 'flexport', tag: 'logistics' },
]

// Role families, derived from the title.
//
// Greenhouse only returns a department if you ask for the full job
// content, which takes one company from 0.6 MB to 5.4 MB — for thirty
// companies that is most of a gigabyte to label a dropdown. So the family
// is read off the title instead, which is legitimate: a posting called
// "Senior Site Reliability Engineer" is an SRE role no matter what the
// board's own taxonomy calls it. Where a board does give a real team name
// it is kept as a separate field and shown as-is.
//
// Order matters — the first match wins, so the more specific patterns are
// listed above the general ones.
const FAMILIES = [
  ['sre', /site reliability|\bsre\b|devops|observability|production engineer|platform reliability/i],
  ['infra', /infrastructure|platform engineer|\bcloud\b|kubernetes|distributed systems|systems engineer|compute|networking|storage engineer/i],
  ['security', /security engineer|appsec|application security|cryptograph|infosec|product security/i],
  ['ml', /machine learning|\bml\b|\bai\b|research scientist|research engineer|deep learning|\bnlp\b/i],
  ['data', /data engineer|data platform|analytics engineer|data scientist|database engineer/i],
  ['mobile', /\bios\b|\bandroid\b|mobile engineer/i],
  ['frontend', /front.?end|web engineer|ui engineer|design engineer/i],
  ['backend', /back.?end|server engineer|\bapi\b engineer|services engineer/i],
  ['eng', /engineer|developer|programmer|architect/i],
  ['design', /\bdesigner\b|design manager|\bux\b|user research/i],
  ['product', /product manager|technical program|\btpm\b|program manager/i],
]

const familyOf = (title) => {
  for (const [id, re] of FAMILIES) if (re.test(title)) return id
  return 'other'
}

// Everything that isn't an engineering-shaped role. This is a jobs board
// on an infrastructure engineer's site, and a list dominated by "Account
// Executive, Emerging Enterprise (Berlin)" would be noise.
const TECH = new Set(['sre', 'infra', 'security', 'ml', 'data', 'mobile', 'frontend', 'backend', 'eng'])

// Family alone was not enough. Matching on "AI" pulled in "Account
// Executive, AI Startups (Hunter)", "AI Solutions Lead, Marketing" and a
// technology partner director — 99 roles that are about engineering
// rather than engineering roles. So a posting has to name an engineering
// job, and then must not be one of the customer-facing titles that
// legitimately contain one.
//
// Solutions architects and customer/field engineers go too, 101 between
// them: real technical work, but pre-sales rather than building. Forward
// deployed engineers stay — at Palantir and its imitators that is an
// engineering role that happens to sit near the customer. Engineering
// managers stay as well; they are a normal next step from senior.
const BUILDS = /engineer|developer|programmer|architect|scientist|\bsre\b|technical lead|tech lead/i
const NOT_ENG = /account executive|sales|marketing|recruit|customer success|partner (manager|director|lead)|solutions? (lead|consultant|architect|engineer|architecture)|business development|\bbdr\b|\bsdr\b|support engineer|technical account|community|evangelist|advocate|program manager|product manager|content|curriculum|instructor|(customer|field|partner) engineer|pre-?sales/i

const isTechRole = (t) => BUILDS.test(t) && !NOT_ENG.test(t)

const SENIOR = /principal|staff|distinguished|architect|\bl[5-8]\b|senior|sr\.?\s/i
const INTERN = /intern\b|internship|apprentice|new grad|university|graduate program|co-?op\b/i

async function getJSON(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const clean = (s) =>
  String(s || '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—|]+|[\s\-–—|]+$/g, '')
    .trim()

// Locations arrive in wildly different shapes and lengths — "Remote -
// United States", "New York City, New York, United States", lists of
// twelve offices. Trimmed to something that fits a line.
// A few boards put "N/A" in the location field rather than leaving it
// empty. Shown verbatim it reads as a place, so it is treated as absent.
const PLACEHOLDER = /^(n\/?a|tbd|none|unknown|various|-{1,2})$/i

function tidyLocation(raw) {
  let s = clean(raw)
  if (!s || PLACEHOLDER.test(s)) return ''
  s = s.replace(/^remote\s*[-–—,]\s*/i, 'Remote · ')
  if (s.length > 46) {
    const parts = s.split(/;|\bor\b|\||,\s*(?=[A-Z])/).map(clean).filter(Boolean)
    s = parts.length > 1 ? `${parts[0]} +${parts.length - 1}` : s.slice(0, 44) + '…'
  }
  return s
}

const isRemote = (loc, flag) => !!flag || /\bremote\b|\banywhere\b|distributed/i.test(loc || '')

function fromGreenhouse(d, co) {
  return (d.jobs || []).map((j) => ({
    title: clean(j.title),
    loc: tidyLocation(j.location?.name),
    // first_published is when the role went up; updated_at moves every
    // time anyone touches the requisition, so it is not a posting date.
    at: j.first_published || j.updated_at || null,
    url: j.absolute_url,
    team: '',
    remote: isRemote(j.location?.name),
    co,
  }))
}

function fromAshby(d, co) {
  return (d.jobs || []).filter((j) => j.isListed !== false).map((j) => ({
    title: clean(j.title),
    loc: tidyLocation(j.location),
    at: j.publishedAt || null,
    url: j.jobUrl || j.applyUrl,
    team: clean(j.team || j.department),
    remote: isRemote(j.location, j.isRemote),
    co,
  }))
}

function fromLever(d, co) {
  return (Array.isArray(d) ? d : []).map((j) => ({
    title: clean(j.text),
    loc: tidyLocation(j.categories?.location),
    at: j.createdAt ? new Date(j.createdAt).toISOString() : null,
    url: j.hostedUrl || j.applyUrl,
    team: clean(j.categories?.team),
    remote: isRemote(j.categories?.location, j.workplaceType === 'remote'),
    co,
  }))
}

const ENDPOINT = {
  greenhouse: (s) => `https://boards-api.greenhouse.io/v1/boards/${s}/jobs`,
  ashby: (s) => `https://api.ashbyhq.com/posting-api/job-board/${s}`,
  lever: (s) => `https://api.lever.co/v0/postings/${s}?mode=json`,
}
const PARSE = { greenhouse: fromGreenhouse, ashby: fromAshby, lever: fromLever }

async function board(c) {
  const raw = await getJSON(ENDPOINT[c.ats](c.slug))
  return PARSE[c.ats](raw, c.name).filter((j) => j.title && j.url)
}

// The same role is often posted once per office. Collapsing them by
// title keeps the list readable and is what makes a count of "openings"
// mean something.
// Greenhouse boards routinely append the office to the title, so the same
// role appears as "Software Engineer - C++" and "Software Engineer - C++
// (London, United Kingdom)" and the two never collapse into one another.
// The suffix is stripped for the purposes of matching only; what gets
// shown is still the shortest real title of the group.
const dedupeKey = (t) =>
  t.toLowerCase()
    .replace(/\s*\((?:remote|hybrid|on-?site|[^)]*,[^)]*)\)\s*$/i, '')
    .replace(/\s*[-–—]\s*(?:remote|hybrid)\s*$/i, '')
    .trim()

function collapse(jobs) {
  const byKey = new Map()
  for (const j of jobs) {
    const key = `${j.co}::${dedupeKey(j.title)}`
    const seen = byKey.get(key)
    if (!seen) {
      byKey.set(key, { ...j, locs: [j.loc].filter(Boolean), n: 1 })
      continue
    }
    seen.n++
    if (j.title.length < seen.title.length) seen.title = j.title
    if (j.loc && !seen.locs.includes(j.loc)) seen.locs.push(j.loc)
    seen.remote = seen.remote || j.remote
    // Keep the earliest posting date across the group: the role opened
    // when the first of them went up.
    if (j.at && (!seen.at || j.at < seen.at)) seen.at = j.at
  }
  return [...byKey.values()].map((j) => {
    const { locs, loc, ...rest } = j
    return { ...rest, loc: locs.length > 1 ? `${locs[0]} +${locs.length - 1}` : locs[0] || loc || '' }
  })
}

const PER_COMPANY = 45     // enough to represent a board, not enough to drown it
const TOTAL_CAP = 1400

async function main() {
  const results = await Promise.allSettled(COMPANIES.map(board))

  const all = []
  const failed = []
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') all.push(...r.value)
    else failed.push(`${COMPANIES[i].name} (${r.reason?.message || 'failed'})`)
  })

  if (!all.length) throw new Error('every board failed')

  // A board that returns nothing is as much of a gap as one that errors,
  // and worth saying out loud rather than silently shipping 39 companies
  // under a heading that promises 40.
  const present = new Set(all.map((j) => j.co))
  COMPANIES.forEach((c) => { if (!present.has(c.name)) failed.push(`${c.name} (empty)`) })

  const tagOf = Object.fromEntries(COMPANIES.map((c) => [c.name, c.tag]))
  const now = Date.now()

  let jobs = collapse(all)
    .map((j) => ({ ...j, fam: familyOf(j.title) }))
    .filter((j) => TECH.has(j.fam) && isTechRole(j.title))
    .filter((j) => !INTERN.test(j.title))
    .map((j) => ({
      t: j.title,
      c: j.co,
      g: tagOf[j.co] || '',
      l: j.loc,
      f: j.fam,
      u: j.url,
      d: j.at ? j.at.slice(0, 10) : '',
      ...(j.team ? { m: j.team } : {}),
      ...(j.remote ? { r: 1 } : {}),
      ...(SENIOR.test(j.title) ? { s: 1 } : {}),
      ...(j.n > 1 ? { n: j.n } : {}),
    }))
    .sort((a, b) => (b.d || '').localeCompare(a.d || ''))

  // Cap per company before the global cap, or the two or three boards
  // with hundreds of openings would crowd everyone else out entirely.
  const perCo = new Map()
  jobs = jobs.filter((j) => {
    const n = (perCo.get(j.c) || 0) + 1
    perCo.set(j.c, n)
    return n <= PER_COMPANY
  }).slice(0, TOTAL_CAP)

  const fresh = jobs.filter((j) => j.d && now - Date.parse(j.d) < 30 * 864e5).length

  const payload = {
    generated: new Date().toISOString(),
    companies: COMPANIES.map((c) => ({ name: c.name, tag: c.tag })).filter((c) => present.has(c.name)),
    total: jobs.length,
    fresh,
    jobs,
  }

  const json = JSON.stringify(payload)
  writeFileSync(SNAPSHOT, json)
  if (existsSync(join(ROOT, 'dist'))) writeFileSync(OUT, json)

  console.log(
    `gen-jobs: ${jobs.length} roles from ${payload.companies.length} companies ` +
      `(${fresh} posted in the last 30 days, ${(json.length / 1024).toFixed(0)} KB)` +
      (failed.length ? ` — skipped: ${failed.join(', ')}` : '')
  )
}

try {
  await main()
} catch (err) {
  console.warn(`gen-jobs: skipped (${err.message}); keeping committed snapshot`)
}
