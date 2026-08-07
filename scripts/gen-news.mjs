// Build-time generator for the Tech News dropdown's Medium and Reddit tabs.
//
// Why these two are baked rather than fetched live like Hacker News and DEV.to:
// neither sends CORS headers, so a browser simply cannot read them. Reddit is
// stricter still — its JSON endpoints answer 403 to anything that isn't a
// signed-in browser, and only the RSS feeds are open. Fetching server-side at
// build time sidesteps both problems, and the tabs end up reading a same-origin
// static file with no key, no proxy and no third-party service in the path.
//
// The tradeoff is honesty about freshness: these two tabs are as current as the
// last deploy, which is why the workflow runs on a daily schedule and the UI
// labels them rather than pretending they are live.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const OUT = join(ROOT, 'dist', 'news.json')
const SNAPSHOT = join(ROOT, 'public', 'news.json')

const UA = 'kranthikiran.com tech-news reader (+https://kranthikiran.com)'

// Chosen to match what the site is actually about — infrastructure, platforms
// and the day job — rather than generic front-page noise.
const SUBREDDITS = ['programming', 'devops', 'kubernetes']
const MEDIUM_TAGS = ['programming', 'devops', 'software-engineering']

const PER_SOURCE = 10
// Reddit's "hot" listing floats stickied mod announcements that can be months
// old. Anything older than this is not news.
const MAX_AGE_DAYS = 21

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getText(url, tries = 3) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/xml, text/xml, */*' } })
    if (res.ok) return res.text()
    // Reddit answers 429 when several feeds are pulled back to back, and it
    // wants a real pause rather than an immediate retry.
    if ((res.status === 429 || res.status >= 500) && attempt < tries) {
      await sleep(6000 * attempt)
      continue
    }
    throw new Error(`HTTP ${res.status}`)
  }
  throw new Error('unreachable')
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" }

// RSS mixes CDATA, named entities and numeric escapes, sometimes double-encoded.
function decode(s = '') {
  return String(s)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+|#\d+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/<[^>]+>/g, '')
    .trim()
}

const pick = (block, tag) => {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`).exec(block)
  return m ? decode(m[1]) : ''
}

// Plenty of Medium writers stuff a whole job title into their display name,
// newlines and all. Keep the name, drop the résumé.
function cleanAuthor(name = '') {
  const first = name.split(/[\n\r|·—]/)[0].replace(/\s+/g, ' ').trim()
  return first.length > 32 ? `${first.slice(0, 31).trimEnd()}…` : first
}

// Reddit serves Atom: entries, <link href>, and an author of the form /u/name.
function parseReddit(xml, sub) {
  const out = []
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1]
    const href = /<link[^>]*href="([^"]+)"/.exec(e)?.[1]
    const title = pick(e, 'title')
    if (!href || !title) continue
    out.push({
      title,
      url: decode(href),
      by: cleanAuthor(pick(e, 'name').replace(/^\/u\//, '')),
      time: Date.parse(pick(e, 'published') || pick(e, 'updated')) || 0,
      sub: `r/${sub}`,
    })
  }
  return out
}

// Medium serves RSS 2.0: items, plain <link>, dc:creator, and one <category>
// element per tag.
function parseMedium(xml) {
  const out = []
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const i = m[1]
    const title = pick(i, 'title')
    const url = pick(i, 'link')
    if (!title || !url) continue
    const tags = [...i.matchAll(/<category>([\s\S]*?)<\/category>/g)]
      .map((c) => decode(c[1]))
      .filter(Boolean)
      .slice(0, 3)
    out.push({
      title,
      // Strip Medium's RSS attribution params; the bare URL is cleaner and
      // still resolves.
      url: url.split('?')[0],
      by: cleanAuthor(pick(i, 'dc:creator')),
      time: Date.parse(pick(i, 'pubDate')) || 0,
      tags,
    })
  }
  return out
}

// Same title can appear under several tags/subreddits.
function dedupe(items) {
  const seen = new Set()
  return items.filter((it) => {
    const k = it.title.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function tidy(items, limit = PER_SOURCE) {
  const cutoff = Date.now() - MAX_AGE_DAYS * 86400000
  return dedupe(items)
    .filter((i) => i.time && i.time >= cutoff)
    .sort((a, b) => b.time - a.time)
    .slice(0, limit)
}

// r/programming posts far more often than r/kubernetes, so a straight
// recency sort would crowd the quieter subreddits out entirely. Take a turn
// from each in rotation, then restore chronological order for display.
function balanceBySub(items, limit = PER_SOURCE) {
  const groups = new Map()
  for (const item of items) {
    const key = item.sub || '-'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }
  const out = []
  let progressed = true
  while (out.length < limit && progressed) {
    progressed = false
    for (const arr of groups.values()) {
      if (!arr.length || out.length >= limit) continue
      out.push(arr.shift())
      progressed = true
    }
  }
  return out.sort((a, b) => b.time - a.time)
}

async function generate(prev) {
  const reddit = []
  for (const sub of SUBREDDITS) {
    const label = `r/${sub}`
    try {
      const xml = await getText(`https://www.reddit.com/r/${sub}/hot.rss?limit=15`)
      const rows = parseReddit(xml, sub)
      reddit.push(...rows)
      console.log(`  ${label} -> ${rows.length}`)
    } catch (err) {
      // Reddit throttles unpredictably, and a throttled subreddit should not
      // quietly disappear from the feed. Its items from the last run are at
      // most a day old, and the age filter still drops them once they go
      // genuinely stale.
      const kept = (prev.reddit || []).filter((i) => i.sub === label)
      reddit.push(...kept)
      console.warn(`  ! ${label}: ${err.message}${kept.length ? ` — kept ${kept.length} from last run` : ''}`)
    }
    await sleep(10000)
  }

  const medium = []
  for (const tag of MEDIUM_TAGS) {
    try {
      const xml = await getText(`https://medium.com/feed/tag/${tag}`)
      const rows = parseMedium(xml)
      medium.push(...rows)
      console.log(`  medium/${tag} -> ${rows.length}`)
    } catch (err) {
      console.warn(`  ! medium/${tag}: ${err.message}`)
    }
    await sleep(800)
  }

  const payload = {
    generated: new Date().toISOString(),
    reddit: balanceBySub(tidy(reddit, 200)),
    medium: tidy(medium),
  }
  if (!payload.reddit.length && !payload.medium.length) {
    throw new Error('both feeds came back empty')
  }
  return payload
}

try {
  console.log('gen-news: pulling Medium + Reddit...')

  // The previous snapshot is both the per-subreddit fallback during the pull
  // and the whole-feed safety net afterwards, so it has to be read up front.
  let prev = { reddit: [], medium: [] }
  if (existsSync(SNAPSHOT)) {
    try {
      prev = JSON.parse(readFileSync(SNAPSHOT, 'utf8'))
    } catch {}
  }

  const payload = await generate(prev)

  // Never trade a healthy snapshot for a half-broken pull.
  for (const key of ['reddit', 'medium']) {
    if (!payload[key].length && prev[key]?.length) {
      payload[key] = prev[key]
      console.warn(`  ! ${key} empty — kept previous ${prev[key].length}`)
    }
  }

  writeFileSync(OUT, JSON.stringify(payload, null, 2))
  writeFileSync(SNAPSHOT, JSON.stringify(payload, null, 2))
  console.log(`gen-news: wrote ${payload.reddit.length} reddit + ${payload.medium.length} medium`)
} catch (err) {
  console.warn(`gen-news: skipped (${err.message}); keeping committed snapshot`)
}
