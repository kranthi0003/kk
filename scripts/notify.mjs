#!/usr/bin/env node
/**
 * Daily WhatsApp digest for Kiran.
 *
 * Runs from GitHub Actions on a schedule and sends ONE WhatsApp message with:
 *   - birthdays today, each with a one-tap wa.me link that opens WhatsApp with
 *     a wish already typed
 *   - birthdays in the next few days, as a heads-up
 *   - guestbook notes left on the site since the last run
 *
 * This never messages anyone but Kiran. Wishes are sent by tapping the link,
 * from his own number: WhatsApp's policy requires opt-in from every recipient
 * of an API message, and an auto-sent template is a worse birthday wish anyway.
 *
 * Contact details live in the BIRTHDAYS_JSON Actions secret, never in the repo,
 * because both repos are public.
 *
 * Always exits 0. A missed digest must never show up as a failed workflow.
 */

const TZ = 'Asia/Kolkata'
const LEAD_DAYS = 3          // how far ahead to give a heads-up
const GUESTBOOK_WINDOW_H = 25 // 1h of overlap so a late run can't skip notes
const BODY_LIMIT = 900       // Meta caps a template body at 1024 incl. static text

const SUPABASE_URL = 'https://urfmdrhuagbgvghjolvf.supabase.co'
const SUPABASE_KEY = 'sb_publishable_GB-5ytPAF6UkOuLpOaCHPw_6p3GrwSz'
const GRAPH_VERSION = 'v26.0'

// ─── time ───────────────────────────────────────────────────────────────────
// Actions runners are UTC. Deciding "is it someone's birthday" in UTC fires a
// day early for every date between 18:30 UTC and midnight IST, so every date
// decision below is made explicitly in Kiran's timezone.

function todayIn(tz) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date())
  const get = t => +parts.find(p => p.type === t).value
  return { y: get('year'), m: get('month'), d: get('day') }
}

/**
 * Days until the next occurrence of month/day, and the year it falls in.
 * Returning the year is what makes the age correct across a New Year boundary
 * (a 2 January birthday seen from 30 December belongs to next year).
 */
function nextOccurrence(month, day, today) {
  const todayUTC = Date.UTC(today.y, today.m - 1, today.d)
  let year = today.y
  let when = Date.UTC(year, month - 1, day)
  if (when < todayUTC) {
    year += 1
    when = Date.UTC(year, month - 1, day)
  }
  return { days: Math.round((when - todayUTC) / 86400000), year }
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── birthdays ──────────────────────────────────────────────────────────────

/**
 * BIRTHDAYS_JSON is an array of:
 *   { "name": "Amma", "date": "1965-03-14" | "03-14", "phone": "+9198...", "note": "..." }
 * phone and note are optional; without a phone there is simply no wish link.
 */
function parseBirthdays(raw) {
  if (!raw || !raw.trim()) return []
  let list
  try {
    list = JSON.parse(raw)
  } catch (e) {
    console.error(`BIRTHDAYS_JSON is not valid JSON (${e.message}) — skipping birthdays.`)
    return []
  }
  if (!Array.isArray(list)) {
    console.error('BIRTHDAYS_JSON must be a JSON array — skipping birthdays.')
    return []
  }

  const out = []
  for (const p of list) {
    if (!p || typeof p.name !== 'string' || typeof p.date !== 'string') {
      console.error(`Skipping malformed entry: ${JSON.stringify(p)}`)
      continue
    }
    const m = p.date.trim().match(/^(?:(\d{4})-)?(\d{1,2})-(\d{1,2})$/)
    if (!m) {
      console.error(`Skipping "${p.name}": date must be MM-DD or YYYY-MM-DD, got "${p.date}"`)
      continue
    }
    const month = +m[2], day = +m[3]
    // Reject impossible dates, but allow 29 Feb — it just resolves rarely.
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      console.error(`Skipping "${p.name}": impossible date "${p.date}"`)
      continue
    }
    out.push({
      name: p.name.trim(),
      month,
      day,
      birthYear: m[1] ? +m[1] : null,
      phone: typeof p.phone === 'string' ? p.phone.trim() : '',
      note: typeof p.note === 'string' ? p.note.trim() : '',
    })
  }
  return out
}

/** https://wa.me/<digits>?text=<wish> — opens WhatsApp with the wish typed. */
function wishLink(person) {
  const digits = person.phone.replace(/\D/g, '')
  if (!digits) return ''
  const first = person.name.split(/\s+/)[0]
  return `https://wa.me/${digits}?text=${encodeURIComponent(`Happy birthday, ${first}!`)}`
}

function birthdaySections(people, today) {
  const todays = [], soon = []
  for (const p of people) {
    const { days, year } = nextOccurrence(p.month, p.day, today)
    const age = p.birthYear ? year - p.birthYear : null
    if (days === 0) todays.push({ ...p, age })
    else if (days <= LEAD_DAYS) soon.push({ ...p, age, days })
  }
  soon.sort((a, b) => a.days - b.days)

  const todayLines = []
  for (const p of todays) {
    todayLines.push(`${p.name}${p.age ? ` turns ${p.age}` : ''} today${p.note ? ` — ${p.note}` : ''}`)
    const link = wishLink(p)
    if (link) todayLines.push(link)
  }

  const soonLines = soon.map(p => {
    const when = p.days === 1 ? 'tomorrow' : `in ${p.days} days`
    return `${p.name} — ${when} (${MONTH_NAMES[p.month - 1]} ${p.day})`
  })

  return { todayLines, soonLines, todayCount: todays.length, soonCount: soon.length }
}

// ─── guestbook ──────────────────────────────────────────────────────────────

async function fetchGuestbook(sinceISO) {
  const url = `${SUPABASE_URL}/rest/v1/guestbook`
    + `?select=name,message,created_at`
    + `&created_at=gte.${encodeURIComponent(sinceISO)}`
    + `&order=created_at.desc&limit=10`
  try {
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    })
    if (!res.ok) {
      console.error(`Guestbook fetch failed: HTTP ${res.status}`)
      return []
    }
    const rows = await res.json()
    return Array.isArray(rows) ? rows : []
  } catch (e) {
    console.error(`Guestbook fetch failed: ${e.message}`)
    return []
  }
}

// ─── digest ─────────────────────────────────────────────────────────────────

function buildDigest(bday, notes) {
  const blocks = []

  if (bday.todayCount) {
    blocks.push(`Birthdays today (${bday.todayCount}):\n${bday.todayLines.join('\n')}`)
  }
  if (bday.soonCount) {
    blocks.push(`Coming up:\n${bday.soonLines.join('\n')}`)
  }

  if (notes.length) {
    const shown = notes.slice(0, 3).map(n => {
      const who = (n.name || 'someone').slice(0, 24)
      const msg = (n.message || '').replace(/\s+/g, ' ').trim().slice(0, 90)
      return `${who}: ${msg}`
    })
    const more = notes.length > shown.length ? `\n+${notes.length - shown.length} more` : ''
    blocks.push(`Guestbook (${notes.length}):\n${shown.join('\n')}${more}`)
  }

  if (!blocks.length) return ''

  let text = blocks.join('\n\n')
  if (text.length > BODY_LIMIT) text = `${text.slice(0, BODY_LIMIT - 1)}…`
  return text
}

// ─── send ───────────────────────────────────────────────────────────────────

/**
 * Meta rejects a template whose body starts or ends with a variable, so the
 * approved template must wrap {{1}} (the date) and {{2}} (this digest) in
 * static text. The line breaks *between* sections live in the static template
 * body; only the digest itself is passed as a parameter.
 *
 * Whether a parameter value may itself contain "\n" is NOT documented by Meta
 * either way. If a send fails on parameter formatting, set WHATSAPP_FLATTEN=1
 * to collapse the digest onto one line and it will go through regardless.
 */
async function send(digest, dateLabel, cfg) {
  const body = cfg.flatten ? digest.replace(/\n+/g, ' · ') : digest

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${cfg.phoneId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.token}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cfg.to,
      type: 'template',
      template: {
        name: cfg.template,
        language: { code: cfg.lang },
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: dateLabel },
            { type: 'text', text: body },
          ],
        }],
      },
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (res.ok && data.messages?.[0]?.id) {
    console.log(`Sent. message id ${data.messages[0].id}`)
    return true
  }

  const err = data.error || {}
  console.error(`Send failed: HTTP ${res.status} — [${err.code ?? '?'}] ${err.message ?? 'unknown error'}`)
  if (err.error_data?.details) console.error(`  details: ${err.error_data.details}`)

  // The failures worth explaining, since they all look alike from the outside.
  if (err.code === 190) console.error('  → token expired or revoked. Generate a permanent System User token.')
  if (err.code === 132001) console.error(`  → template "${cfg.template}" (${cfg.lang}) not found or not approved yet.`)
  if (err.code === 132000) console.error('  → parameter count mismatch: the template must have exactly two variables.')
  if (err.code === 131021) console.error('  → sender and recipient are the same number. WHATSAPP_TO must be your personal number, not the sender.')
  if (err.code === 131026) console.error('  → recipient number is not on WhatsApp, or cannot receive messages.')
  if (err.code === 131047) console.error('  → needs a template message; a free-form message was attempted.')
  if (err.code === 130429) console.error('  → rate limited by Meta.')
  return false
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
  const today = todayIn(TZ)
  const dateLabel = `${today.d} ${MONTH_NAMES[today.m - 1]}`

  const people = parseBirthdays(process.env.BIRTHDAYS_JSON || '')
  const bday = birthdaySections(people, today)

  const since = new Date(Date.now() - GUESTBOOK_WINDOW_H * 3600_000).toISOString()
  const notes = await fetchGuestbook(since)

  console.log(`${people.length} contacts tracked · ${bday.todayCount} today · ${bday.soonCount} upcoming · ${notes.length} new notes`)

  const digest = buildDigest(bday, notes)
  const testSend = process.env.NOTIFY_TEST_SEND === '1'

  if (!digest && !testSend) {
    console.log('Nothing to report today — no message sent.')
    return
  }

  const text = digest || `Nothing to report today. This is a test send from the ${dateLabel} workflow run.`
  console.log(`\n--- digest (${text.length} chars) ---\n${text}\n---`)

  const cfg = {
    token: process.env.WHATSAPP_TOKEN || '',
    phoneId: process.env.WHATSAPP_PHONE_ID || '',
    to: process.env.WHATSAPP_TO || '',
    template: process.env.WHATSAPP_TEMPLATE || 'daily_digest',
    lang: process.env.WHATSAPP_LANG || 'en_US',
    flatten: process.env.WHATSAPP_FLATTEN === '1',
  }

  const missing = ['token', 'phoneId', 'to'].filter(k => !cfg[k])
  if (missing.length) {
    console.log(`\nDry run — WhatsApp not configured (missing ${missing.join(', ')}). Digest above was not sent.`)
    return
  }

  await send(text, dateLabel, cfg)
}

// Run the digest when invoked directly; stay quiet when imported by tests.
import { fileURLToPath } from 'node:url'
const invokedDirectly = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]

if (invokedDirectly) {
  main().catch(e => {
    // Never fail the workflow over a digest.
    console.error(`notify failed: ${e.message}`)
  })
}

export { todayIn, nextOccurrence, parseBirthdays, birthdaySections, buildDigest, wishLink }
