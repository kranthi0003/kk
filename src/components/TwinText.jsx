import React from 'react'

// Shared by the floating chat and the face-to-face page.
export const REAL_EMAIL = 'kranthikiranakkumahanthi@gmail.com'
export const REAL_LINKEDIN = 'https://www.linkedin.com/in/akkiran003/'

// Links the twin writes: full URLs, bare links to this site or a few profiles,
// and email addresses. Links into this site stay in the same tab.
const LINK = /https?:\/\/[^\s<]+|(?:www\.)?kranthikiran\.com\/?#?[\w\-/#]*|(?:linkedin\.com|github\.com|x\.com)\/[\w\-/]+|[\w.+-]+@[\w-]+(?:\.[\w-]+)+/gi
const TRAIL = /[.,!?;:)'"’”]+$/

function target(raw) {
  if (raw.includes('@') && !raw.includes('/')) return { href: `mailto:${raw}`, external: false }
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const u = new URL(url)
    if (/(^|\.)kranthikiran\.com$/i.test(u.hostname)) return { href: u.hash || '#', external: false }
    return { href: u.href, external: true }
  } catch {
    return null
  }
}

export function TwinText({ text }) {
  const out = []
  let last = 0
  for (const m of String(text).matchAll(LINK)) {
    const raw = m[0].replace(TRAIL, '')
    const t = raw.length > 4 && target(raw)
    if (!t) continue
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(
      <a key={m.index} href={t.href} className="underline underline-offset-2 break-words"
        {...(t.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {raw.replace(/^https?:\/\/(www\.)?/i, '')}
      </a>,
    )
    last = m.index + raw.length
  }
  if (last < text.length) out.push(text.slice(last))
  return <>{out}</>
}

export function RealMe({ className = '' }) {
  const chip = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-colors'
  const style = { background: 'color-mix(in oklab, var(--color-accent) 12%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 35%, transparent)', color: 'var(--color-foreground)' }
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className="text-[11px] text-muted-foreground">Ask the real me:</span>
      <a className={chip} style={style} href={`mailto:${REAL_EMAIL}`}>Email</a>
      <a className={chip} style={style} href={REAL_LINKEDIN} target="_blank" rel="noopener noreferrer">LinkedIn</a>
    </div>
  )
}
