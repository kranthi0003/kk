import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useAmbient } from './AmbientContext'
import { createPlaylist } from '../lib/herPlaylist'
import STORY from '../lib/itsAlwaysHer.md?raw'

/* ------------------------------------------------------------------ *
 * #/itsalwaysher — "It's always her", a long letter, eight years long.
 *
 * The story lives in src/lib/itsAlwaysHer.md, as plain text in the
 * format it was written in: # headings, **bold**, *italic*, --- between
 * chapters, and "Years ago — The First Time" for a small label over a
 * chapter title. Change a word there and the page follows. Anything
 * above the title is ignored, so a draft pasted out of a chat window
 * still renders from the title down.
 *
 * She loves cute things — teddies, cartoons, crayons, drawing — so the
 * page is a sketchbook: crayon drawings on dark paper. The dark is for
 * the letter, which is serious; the crayon is for her. A teddy waits
 * behind a door at the top, a doodle draws itself between every
 * chapter, and the last door opens on the teddy holding a heart.
 *
 * The song is About You by The 1975, played the way #/her plays its
 * music: it starts silently on arrival and fades up at her first touch.
 *
 * Private and unlisted, shared directly by link. Not in nav. Her name
 * appears once, in the last line, because that's the point.
 * ------------------------------------------------------------------ */

// The link he chose first, then the official video and other uploads
// that were checked to play in an embed on this domain.
const TRACKS = [
  { title: 'About You', artist: 'The 1975', ids: ['JCz1iyabp9g', 'tGv7CUutzqU', '5qq8ONq0hl8', 'iqGAW57EudQ', 'wXmsqoGrAic'] },
]

// Page-only fonts: bubbly display, crayon handwriting, a rounded body.
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Gaegu:wght@400;700&family=Nunito:ital,wght@0,400;0,600;0,800;1,400&display=swap'

const PAPER = '#15121d'
const CHALK = '#f4edf7'
const CHALK_SOFT = '#c7bbd4'
const INK = '#2a1d1a'
const PINK = '#ff8fc0'
const YELLOW = '#ffd668'
const MINT = '#7fe3c1'
const SKY = '#8fc9ff'
const LILAC = '#c8aaff'
const PEACH = '#ffb089'
const CRAYONS = [PINK, YELLOW, MINT, SKY, LILAC, PEACH]

/* ---------------- reading the story ---------------- */

// Lines this short are set as a stanza, one under the other, rather
// than as paragraphs with space between every sentence.
const SHORT = 36

const typeset = (s) =>
  s
    .replace(/(\w)'(\w)/g, '$1\u2019$2')
    .replace(/(\w)'(?=[\s.,!?;:]|$)/g, '$1\u2019')
    .replace(/\.\.\./g, '\u2026')

const bare = (s) => s.replace(/\*+/g, '').trim()

function classify(line) {
  if (line.includes('→')) {
    return { t: 'path', steps: bare(line).replace(/\.+$/, '').split(/\s*→\s*/).filter(Boolean) }
  }
  if (/^\*\*[^*]+\*\*$/.test(line)) return { t: 'beat', text: line.slice(2, -2) }
  if (/^\*[^*]+\*$/.test(line)) return { t: 'voice', lines: [line.slice(1, -1)] }
  return { t: 'p', text: line }
}

function arrange(blocks) {
  const out = []
  for (const b of blocks) {
    const prev = out[out.length - 1]
    if (b.t === 'voice' && prev?.t === 'voice') {
      prev.lines.push(...b.lines)
      continue
    }
    if (b.t === 'p' && bare(b.text).length <= SHORT) {
      if (prev?.t === 'stanza') prev.lines.push(b.text)
      else out.push({ t: 'stanza', lines: [b.text] })
      continue
    }
    out.push(b)
  }
  return out.map((b) => (b.t === 'stanza' && b.lines.length === 1 ? { t: 'p', text: b.lines[0] } : b))
}

export function parse(src) {
  const lines = String(src || '').replace(/\r\n?/g, '\n').split('\n')
  const start = Math.max(0, lines.findIndex((l) => /^#\s/.test(l.trim())))
  const story = { title: '', subtitle: '', chapters: [], close: '', span: '' }
  const years = []
  let ch = null

  for (const raw of lines.slice(start)) {
    const line = typeset(raw.trim())
    if (!line || /^(-{3,}|\*{3,}|_{3,})$/.test(line)) continue
    const h = line.match(/^(#{1,6})\s+(.+)$/)
    if (h) {
      const text = bare(h[2])
      if (!story.title) {
        story.title = text
        continue
      }
      if (!ch && !story.subtitle && h[1].length >= 3) {
        story.subtitle = text
        continue
      }
      // "Years ago — The First Time" puts a small label over the title.
      const m = text.match(/^(.+?)\s+[—–]\s+(.+)$/)
      const split = m && m[1].trim().split(/\s+/).length <= 5
      ch = { eyebrow: split ? m[1] : '', title: split ? m[2] : text, blocks: [] }
      story.chapters.push(ch)
      continue
    }
    for (const y of line.match(/\b(?:19|20)\d{2}\b/g) || []) years.push(Number(y))
    if (!ch) {
      ch = { eyebrow: '', title: '', blocks: [] }
      story.chapters.push(ch)
    }
    ch.blocks.push(classify(line))
  }

  story.chapters.forEach((c, i) => {
    c.id = `iah-${i}`
    c.color = /^epilogue$/i.test(c.eyebrow) ? PINK : CRAYONS[i % CRAYONS.length]
    c.blocks = arrange(c.blocks)
    // "It was never:" introduces the straight line the story didn't
    // take, which is set quieter than the one it did.
    c.blocks.forEach((b, k) => {
      if (b.t !== 'path') return
      const prev = c.blocks[k - 1]
      const said = prev ? prev.text || prev.lines?.[prev.lines.length - 1] || '' : ''
      b.muted = /\bnever:\s*$/i.test(bare(said))
    })
  })

  // The last line, if it stands alone, gets the last door to itself.
  const last = story.chapters[story.chapters.length - 1]
  const tail = last?.blocks[last.blocks.length - 1]
  if (tail?.t === 'beat') {
    story.close = tail.text
    last.blocks.pop()
  }
  if (years.length) story.span = `${Math.min(...years)} — ${Math.max(...years)}`
  return story
}

const DATA = parse(STORY)
const TAB_TITLE = DATA.title ? DATA.title.charAt(0) + DATA.title.slice(1).toLowerCase() : 'It’s always her'

// The title's last word, and the last line's, are set apart.
const splitLast = (s) => {
  const i = s.trimEnd().lastIndexOf(' ')
  return i < 0 ? ['', s] : [s.slice(0, i), s.slice(i + 1)]
}
const [TITLE_LEAD, TITLE_LAST] = splitLast(DATA.title)
const [CLOSE_LEAD, CLOSE_LAST] = splitLast(DATA.close)

// **bold** and *italic*, inside a line.
function rich(text) {
  const out = []
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let at = 0
  let m
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > at) out.push(text.slice(at, m.index))
    out.push(m[1] != null ? <strong key={k++}>{m[1]}</strong> : <em key={k++}>{m[2]}</em>)
    at = re.lastIndex
  }
  if (at < text.length) out.push(text.slice(at))
  return out.length === 1 && typeof out[0] === 'string' ? out[0] : out
}

/* ---------------- crayon ---------------- */

// One filter and two fills, shared by every drawing on the page. The
// filter is what makes a clean vector line look like wax on paper: a
// fine noise knocks tiny gaps out of the stroke, and a slow one makes
// it wobble like a hand did it.
function Defs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="iah-crayon" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 1.42" result="tooth" />
          <feComposite in="SourceGraphic" in2="tooth" operator="in" result="wax" />
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="11" result="warp" />
          <feDisplacementMap in="wax" in2="warp" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <pattern id="iah-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-38)">
          <rect width="7" height="7" fill="#ffd25e" />
          <rect width="2.6" height="7" fill="#fff1bd" opacity="0.8" />
        </pattern>
        <pattern id="iah-hatch-door" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(52)">
          <rect width="6" height="6" fill="#9d7de6" />
          <rect width="2" height="6" fill="#b79cf2" opacity="0.7" />
        </pattern>
      </defs>
    </svg>
  )
}

// A small four-pointed sparkle, centred on 0,0.
const SPARK = 'M0 -7 C1.2 -1.2 1.2 -1.2 7 0 C1.2 1.2 1.2 1.2 0 7 C-1.2 1.2 -1.2 1.2 -7 0 C-1.2 -1.2 -1.2 -1.2 0 -7 Z'

// A teddy, centred on its tummy. "wave" holds a paw up; "heart" hugs one.
function Teddy({ pose = 'wave' }) {
  const fur = '#c98b57'
  const light = '#efc79b'
  const sw = 2.4
  const limb = { fill: fur, stroke: INK, strokeWidth: sw }
  return (
    <g className={`iah-ted is-${pose}`}>
      <ellipse cx="-23" cy="30" rx="7.5" ry="12.5" transform="rotate(32 -23 30)" {...limb} />
      {pose === 'wave' ? (
        <g className="iah-ted-wave">
          <ellipse cx="27" cy="11" rx="7.5" ry="13" transform="rotate(28 27 11)" {...limb} />
        </g>
      ) : (
        <ellipse cx="23" cy="30" rx="7.5" ry="12.5" transform="rotate(-32 23 30)" {...limb} />
      )}
      <ellipse cx="0" cy="38" rx="24" ry="23" {...limb} />
      <ellipse cx="0" cy="42" rx="14" ry="13" fill={light} />
      <ellipse cx="-12" cy="59" rx="9.5" ry="6.5" fill={light} stroke={INK} strokeWidth={sw} />
      <ellipse cx="12" cy="59" rx="9.5" ry="6.5" fill={light} stroke={INK} strokeWidth={sw} />
      <circle cx="-20" cy="-27" r="10" {...limb} />
      <circle cx="20" cy="-27" r="10" {...limb} />
      <circle cx="-20" cy="-27" r="5" fill="#ff9ec0" />
      <circle cx="20" cy="-27" r="5" fill="#ff9ec0" />
      <circle cx="0" cy="-6" r="26" {...limb} />
      <ellipse cx="0" cy="4" rx="12.5" ry="9.5" fill={light} />
      <ellipse cx="0" cy="-0.5" rx="4.6" ry="3.4" fill={INK} />
      <path d="M0 3 v3 M0 6 q-3.6 3.4 -7 0.6 M0 6 q3.6 3.4 7 0.6" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="-9.5" cy="-10" r="3.3" fill={INK} />
      <circle cx="9.5" cy="-10" r="3.3" fill={INK} />
      <circle cx="-8.3" cy="-11.3" r="1.15" fill="#fff" />
      <circle cx="10.7" cy="-11.3" r="1.15" fill="#fff" />
      <ellipse cx="-16.5" cy="2" rx="5" ry="3" fill={PINK} opacity="0.6" />
      <ellipse cx="16.5" cy="2" rx="5" ry="3" fill={PINK} opacity="0.6" />
      {pose === 'heart' && (
        <g className="iah-ted-heart">
          <path d="M0 55 C-16 44 -20 32 -11.5 27 C-6 24 -1.5 27 0 31 C1.5 27 6 24 11.5 27 C20 32 16 44 0 55 Z" fill="#ff6aa0" stroke={INK} strokeWidth={sw} />
          <path d="M-7 33 C-9 35 -9.5 38 -8.5 40" fill="none" stroke="#ffd0e3" strokeWidth="2.2" strokeLinecap="round" />
          <ellipse cx="-14" cy="40" rx="6.5" ry="9" transform="rotate(-40 -14 40)" {...limb} />
          <ellipse cx="14" cy="40" rx="6.5" ry="9" transform="rotate(40 14 40)" {...limb} />
        </g>
      )}
    </g>
  )
}

// A cartoon doorway with yellow crayon light inside and a teddy in the
// light. The door is hinged on the left at x=64 and opens by --leaf,
// from 1 (shut) down to about 0.12 (wide open).
const ARCH = 'M64 258 V112 A56 56 0 0 1 176 112 V258 Z'
function DoorArt({ uid, pose }) {
  return (
    <svg className="iah-doorart" viewBox="0 0 240 300" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={`iah-open-${uid}`}>
          <path d={ARCH} />
        </clipPath>
      </defs>
      <g className="iah-sparks">
        {[
          [30, 92, YELLOW, 1],
          [212, 74, PINK, 0.85],
          [200, 168, SKY, 0.7],
          [24, 196, LILAC, 0.75],
          [118, 30, YELLOW, 0.65],
        ].map(([x, y, c, s], i) => (
          // Placed by the group, so the twinkle can own the path's transform.
          <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
            <path d={SPARK} fill={c} style={{ '--i': i }} />
          </g>
        ))}
      </g>
      <path className="iah-spill" d="M64 258 L176 258 L228 297 L12 297 Z" fill="url(#iah-hatch)" filter="url(#iah-crayon)" />
      <path d={ARCH} fill="url(#iah-hatch)" filter="url(#iah-crayon)" />
      <g clipPath={`url(#iah-open-${uid})`}>
        <g transform={pose === 'heart' ? 'translate(120 186) scale(1.08)' : 'translate(140 196) scale(0.96)'} filter="url(#iah-crayon)">
          <Teddy pose={pose} />
        </g>
      </g>
      <g className="iah-leaf">
        <path d={ARCH} fill="url(#iah-hatch-door)" stroke={INK} strokeWidth="3" vectorEffect="non-scaling-stroke" filter="url(#iah-crayon)" />
        <path d="M80 152 A40 40 0 0 1 160 152 V176 H80 Z" fill="none" stroke="#6f52c2" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <rect x="80" y="190" width="80" height="54" rx="6" fill="none" stroke="#6f52c2" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <path d="M160 214 C153 209 151 204 155 201.5 C157.5 200 159.5 201.5 160 203.5 C160.5 201.5 162.5 200 165 201.5 C169 204 167 209 160 214 Z" fill={PINK} stroke={INK} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
      </g>
      <path d="M57 259 V112 A63 63 0 0 1 183 112 V259" fill="none" stroke={CHALK} strokeWidth="6.5" strokeLinecap="round" filter="url(#iah-crayon)" />
      <path d="M61.5 259 V113 A58.5 58.5 0 0 1 178.5 113 V259" fill="none" stroke={PINK} strokeWidth="2.6" strokeLinecap="round" opacity="0.9" />
      <path d="M8 260 C62 257 176 262 232 258" fill="none" stroke={CHALK} strokeWidth="3.6" strokeLinecap="round" filter="url(#iah-crayon)" />
    </svg>
  )
}

/* ---------------- doodles between chapters ---------------- */

// Each is a few strokes on a 56×56 page, drawn with pathLength="1" so
// the same stroke-dashoffset animation draws any of them. A part can
// carry its own colour, or be a dot that fills in rather than draws.
const ring = (cx, cy, r) => `M${cx + r} ${cy} A${r} ${r} 0 1 1 ${cx - r} ${cy} A${r} ${r} 0 1 1 ${cx + r} ${cy}`
const PETALS = [0, 60, 120, 180, 240, 300].map((a) => {
  const t = (a * Math.PI) / 180
  return { d: ring(28 + 9.5 * Math.cos(t), 24 + 9.5 * Math.sin(t), 6) }
})
const RAYS = [0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
  const t = (a * Math.PI) / 180
  return { d: `M${(28 + 14 * Math.cos(t)).toFixed(1)} ${(28 + 14 * Math.sin(t)).toFixed(1)} L${(28 + 20 * Math.cos(t)).toFixed(1)} ${(28 + 20 * Math.sin(t)).toFixed(1)}` }
})
const small = (x, y, s) => SPARK.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, a, b) => `${(x + a * s).toFixed(2)} ${(y + b * s).toFixed(2)}`)

const DOODLES = {
  heart: [{ d: 'M28 46 C15 37 7 29 10 20 C12.5 13 21.5 11.5 28 19 C34.5 11.5 43.5 13 46 20 C49 29 41 37 28 46 Z' }],
  star: [{ d: 'M28 7.5 L33.4 21.4 L48.2 22 L36.6 31.3 L40.6 45.6 L28 37.4 L15.4 45.6 L19.4 31.3 L7.8 22 L22.6 21.4 Z' }],
  flower: [...PETALS, { dot: [28, 24, 4.2], color: YELLOW }, { d: 'M28 34 C27 41 29 46 28 52', color: MINT }, { d: 'M28 45 C32 40 38 40 40 43 C36 47 31 47 28 45', color: MINT }],
  cloud: [{ d: 'M15 40 C7 40 6.5 29 14.5 28 C14 19.5 25 16 29.5 22.5 C32.5 15.5 45 17 44.5 26.5 C52 27 52 40 44 40 Z' }, { d: 'M20 47 L18 51', color: SKY }, { d: 'M30 47 L28 51', color: SKY }, { d: 'M40 47 L38 51', color: SKY }],
  sun: [{ d: ring(28, 28, 9) }, ...RAYS],
  swirl: [{ d: 'M28 28 C28 25.5 31.5 25.5 31.5 28.5 C31.5 32.5 24.5 33 24 28 C23.5 21.5 35 21 35.5 28.5 C36 37 21 37.5 20.5 28 C20 17.5 39 16.5 39.5 28.5 C40 40.5 17.5 41.5 17 28' }],
  moon: [{ d: 'M35 9.5 C23 11.5 16.5 25 21.5 36 C26 45.5 39 48.5 47 41.5 C36 42 27.5 33 29.5 22 C30.5 16.5 32.5 12.5 35 9.5 Z' }, { d: small(45, 15, 0.5), color: YELLOW }, { d: small(13, 13, 0.4), color: YELLOW }],
  balloon: [{ d: 'M28 8 C18 8 14 18 16 25 C18 32 24 36 28 37 C32 36 38 32 40 25 C42 18 38 8 28 8 Z' }, { d: 'M25.5 39 L28 37 L30.5 39 Z' }, { d: 'M28 39 C24 43.5 32 46.5 27.5 52', color: CHALK_SOFT }],
  rainbow: [{ d: 'M7 42 A21 21 0 0 1 49 42', color: PINK }, { d: 'M13 42 A15 15 0 0 1 43 42', color: YELLOW }, { d: 'M19 42 A9 9 0 0 1 37 42', color: SKY }],
  sparkle: [{ d: small(28, 28, 3) }, { d: small(45, 13, 0.85), color: YELLOW }],
  crayon: [{ d: 'M11 39 L33 17 L41 25 L19 47 Z' }, { d: 'M33 17 L45 13 L41 25' }, { d: 'M16 34 L24 42', color: CHALK }, { d: 'M7 52 C14 49 20 53 27 50', color: YELLOW }],
  teddy: [{ d: ring(17, 19, 5.5) }, { d: ring(39, 19, 5.5) }, { d: ring(28, 31, 14) }, { dot: [23, 28.5, 1.9], color: CHALK }, { dot: [33, 28.5, 1.9], color: CHALK }, { dot: [28, 34, 2.2], color: PINK }, { d: 'M24.5 37.5 C26.5 40 29.5 40 31.5 37.5', color: CHALK }],
  door: [{ d: 'M17 51 V22 A11 11 0 0 1 39 22 V51' }, { d: 'M17 22 L9 17 L9 53 L17 51', color: LILAC }, { dot: [12, 36, 1.8], color: PINK }, { d: 'M45 20 L51 16', color: YELLOW }, { d: 'M46 30 L53 30', color: YELLOW }, { d: 'M45 40 L51 44', color: YELLOW }],
}
const SEQUENCE = ['heart', 'star', 'flower', 'cloud', 'sun', 'swirl', 'moon', 'balloon', 'rainbow', 'sparkle', 'crayon', 'teddy']

function Doodle({ kind, color, className = '', drawn = false }) {
  const parts = DOODLES[kind] || DOODLES.heart
  return (
    <span className={`iah-doodle ${className}`} style={{ color }} aria-hidden="true">
      <svg viewBox="0 0 56 56" focusable="false">
        <g filter="url(#iah-crayon)" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          {parts.map((p, i) =>
            p.dot ? (
              <circle key={i} className="iah-dot" cx={p.dot[0]} cy={p.dot[1]} r={p.dot[2]} fill={p.color || 'currentColor'} stroke="none" style={{ '--i': i }} />
            ) : (
              <path key={i} d={p.d} pathLength={drawn ? undefined : 1} style={{ '--i': i, ...(p.color ? { stroke: p.color } : null) }} />
            )
          )}
        </g>
      </svg>
    </span>
  )
}

// Faint doodles in the margins, on screens wide enough to have margins.
const MARGIN = [
  ['star', YELLOW, '6%', '14%', 34, -12],
  ['heart', PINK, '11%', '38%', 30, 10],
  ['swirl', LILAC, '5%', '62%', 36, 0],
  ['cloud', SKY, '9%', '84%', 40, -6],
  ['sparkle', YELLOW, '88%', '12%', 30, 0],
  ['moon', LILAC, '92%', '34%', 34, 14],
  ['flower', PINK, '86%', '58%', 38, -8],
  ['teddy', PEACH, '91%', '80%', 36, 6],
]

/* ---------------- one block of the story ---------------- */

function Lines({ lines }) {
  return lines.map((l, i) => <span key={i}>{rich(l)}</span>)
}

function Block({ b }) {
  if (b.t === 'beat') return <p className="iah-rv iah-beat">{rich(b.text)}</p>
  if (b.t === 'voice')
    return (
      <p className="iah-rv iah-voice">
        <Lines lines={b.lines} />
      </p>
    )
  if (b.t === 'stanza')
    return (
      <p className="iah-rv iah-stanza">
        <Lines lines={b.lines} />
      </p>
    )
  if (b.t === 'path')
    return (
      <ol className={`iah-rv iah-path${b.muted ? ' is-muted' : ''}`}>
        {b.steps.map((s, i) => (
          <li key={i} style={{ '--k': CRAYONS[i % CRAYONS.length] }}>
            {i > 0 && (
              <span className="iah-arrow" aria-hidden="true">
                {'\u00a0→ '}
              </span>
            )}
            <span className="iah-step">{s}</span>
          </li>
        ))}
      </ol>
    )
  return <p className="iah-rv iah-p">{rich(b.text)}</p>
}

/* ---------------- the page ---------------- */

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const CONFETTI = ['♥', '★', '♥', '✦', '♥', '●']

export default function ItsAlwaysHer({ onBack }) {
  const rootRef = useRef(null)
  const heroDoorRef = useRef(null)
  const fxRef = useRef(null)
  const ajar = useRef(0)
  const opened = useRef(0)
  const celebrated = useRef(false)
  const reduced = useRef(typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

  const [music, setMusic] = useState(false)
  const [silent, setSilent] = useState(false)
  const [musicOk, setMusicOk] = useState(true)
  const player = useRef(null)

  // The site radio would talk over the song. Hold it while we're here.
  const setSuppressed = useAmbient()?.setSuppressed
  useEffect(() => {
    setSuppressed?.(true)
    return () => setSuppressed?.(false)
  }, [setSuppressed])

  useEffect(() => {
    const prev = document.title
    document.title = TAB_TITLE
    return () => {
      document.title = prev
    }
  }, [])

  // The three faces are only worth a request on this page, so they're
  // fetched here rather than from index.html.
  useEffect(() => {
    if (document.getElementById('iah-fonts')) return
    const l = document.createElement('link')
    l.id = 'iah-fonts'
    l.rel = 'stylesheet'
    l.href = FONTS_HREF
    document.head.appendChild(l)
  }, [])

  /* ---------------- the song ---------------- */

  const ensurePlayer = useCallback(() => {
    if (!player.current) {
      player.current = createPlaylist(TRACKS, {
        onMuted: setSilent,
        onFail: () => {
          setMusic(false)
          setSilent(false)
          setMusicOk(false)
        },
      })
    }
    return player.current
  }, [])

  // Starts on arrival, silently — browsers allow nothing else — and
  // fades up at her first touch. Turned off once, it stays off.
  useEffect(() => {
    let off = false
    try {
      off = sessionStorage.getItem('iah_music_off') === '1'
    } catch {}
    if (off) return
    ensurePlayer().autostart()
    setMusic(true)
  }, [ensurePlayer])

  useEffect(() => () => player.current?.destroy?.(), [])

  const toggleMusic = useCallback(() => {
    if (music && silent) {
      player.current?.unmute()
      return
    }
    if (music) {
      player.current?.stop()
      setMusic(false)
      setSilent(false)
      try {
        sessionStorage.setItem('iah_music_off', '1')
      } catch {}
      return
    }
    try {
      sessionStorage.removeItem('iah_music_off')
    } catch {}
    if (ensurePlayer().start()) setMusic(true)
  }, [music, silent, ensurePlayer])

  useEffect(() => {
    if (!music) return
    const onVis = () => {
      if (document.hidden) player.current?.pause()
      else player.current?.resume()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [music])

  /* ---------------- the door at the top ---------------- */

  // It eases ajar on arrival so the teddy can peek out, then opens the
  // rest of the way as you scroll into the story — and swings back if
  // you scroll up to it again.
  const paintHero = useCallback(() => {
    const el = heroDoorRef.current
    if (!el) return
    const a = ajar.current
    const s = opened.current
    el.style.setProperty('--leaf', (1 - 0.5 * a - 0.38 * s).toFixed(3))
    el.style.setProperty('--spill', (0.15 + 0.45 * a + 0.4 * s).toFixed(3))
  }, [])

  useEffect(() => {
    if (reduced.current) {
      ajar.current = 1
      paintHero()
      return
    }
    let raf = 0
    let t0 = 0
    const step = (t) => {
      if (!t0) t0 = t
      const x = clamp01((t - t0 - 500) / 1900)
      ajar.current = ease(x)
      paintHero()
      if (x < 1) raf = requestAnimationFrame(step)
    }
    paintHero()
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [paintHero])

  /* ---------------- the last door ---------------- */

  // Hearts and stars, once, when the last door opens.
  const celebrate = useCallback(() => {
    if (celebrated.current || reduced.current) return
    celebrated.current = true
    const host = fxRef.current
    const door = rootRef.current?.querySelector('.iah-end-door')
    if (!host || !door) return
    const r = door.getBoundingClientRect()
    const x0 = r.left + r.width / 2
    const y0 = r.top + r.height * 0.62
    setTimeout(() => {
      for (let i = 0; i < 46; i++) {
        const s = document.createElement('span')
        s.className = 'iah-bit'
        s.textContent = CONFETTI[i % CONFETTI.length]
        s.setAttribute('aria-hidden', 'true')
        s.style.left = `${x0}px`
        s.style.top = `${y0}px`
        s.style.color = CRAYONS[(Math.random() * CRAYONS.length) | 0]
        s.style.fontSize = `${12 + Math.random() * 14}px`
        s.style.setProperty('--dx', `${(Math.random() * 2 - 1) * 46}vw`)
        s.style.setProperty('--dy', `${-(18 + Math.random() * 42)}vh`)
        s.style.setProperty('--rot', `${Math.random() * 540 - 270}deg`)
        s.style.animationDelay = `${Math.random() * 0.25}s`
        s.style.animationDuration = `${2.2 + Math.random() * 1.4}s`
        host.appendChild(s)
        s.addEventListener('animationend', () => s.remove(), { once: true })
      }
    }, 1900)
  }, [])

  /* ---------------- scrolling ---------------- */

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let raf = 0
    const frame = () => {
      raf = 0
      const top = root.scrollTop
      const h = root.clientHeight
      const span = root.scrollHeight - h
      root.style.setProperty('--p', (span > 0 ? clamp01(top / span) : 0).toFixed(4))
      if (!reduced.current) {
        opened.current = clamp01(top / (h * 0.8))
        paintHero()
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(frame)
    }
    frame()
    root.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      root.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [paintHero])

  // Reveal blocks, draw doodles and open the last door as they come into
  // view. A hard flick can carry a block past the fold between two
  // observer callbacks, so a sweep on scroll catches anything missed.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reveal = (n) => {
      n.classList.add('is-in')
      if (n.classList.contains('iah-end')) celebrate()
    }
    const pending = () => root.querySelectorAll('.iah-rv:not(.is-in)')

    if (reduced.current || !('IntersectionObserver' in window)) {
      pending().forEach(reveal)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            reveal(e.target)
            io.unobserve(e.target)
          }
        })
      },
      { root, rootMargin: '0px 0px -10% 0px', threshold: 0.06 }
    )
    root.querySelectorAll('.iah-rv').forEach((n) => io.observe(n))

    let raf = 0
    const sweep = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const h = root.clientHeight
        pending().forEach((n) => {
          if (n.getBoundingClientRect().top < h * 0.92) {
            reveal(n)
            io.unobserve(n)
          }
        })
      })
    }
    root.addEventListener('scroll', sweep, { passive: true })
    return () => {
      io.disconnect()
      root.removeEventListener('scroll', sweep)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [celebrate])

  const behavior = reduced.current ? 'auto' : 'smooth'
  // Measured from the screen, not offsetTop: the chapters sit inside a
  // positioned wrapper, so their offsetTop is relative to that.
  const begin = () => {
    const root = rootRef.current
    const first = root?.querySelector('.iah-ch')
    if (!first) return
    const top = root.scrollTop + first.getBoundingClientRect().top - root.getBoundingClientRect().top
    root.scrollTo({ top: Math.max(0, top - 8), behavior })
  }
  const toTop = () => rootRef.current?.scrollTo({ top: 0, behavior })

  const musicLabel = !music ? 'Play the song' : silent ? 'Tap for sound' : 'Pause the song'

  return (
    <div ref={rootRef} className="iah-root fixed inset-0 z-[300] overflow-y-auto overflow-x-hidden">
      <style>{IAH_STYLE}</style>
      <Defs />
      <div className="iah-grain" aria-hidden="true" />
      <div className="iah-margins" aria-hidden="true">
        {MARGIN.map(([kind, color, left, top, size, rot]) => (
          <span key={kind + left} style={{ left, top, width: size, height: size, transform: `rotate(${rot}deg)` }}>
            <Doodle kind={kind} color={color} className="iah-doodle-m" drawn />
          </span>
        ))}
      </div>
      <div className="iah-fade" aria-hidden="true" />
      <div className="iah-bar" aria-hidden="true">
        <span className="iah-bar-line" />
        <span className="iah-bar-tip">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M3 21 L14 10 L18 14 L7 25 Z" transform="translate(0 -4)" fill={PINK} stroke={INK} strokeWidth="1.4" />
            <path d="M14 6 L20 4 L18 10 Z" fill={YELLOW} stroke={INK} strokeWidth="1.4" />
          </svg>
        </span>
      </div>

      <button type="button" onClick={onBack} title="Back" className="iah-chip iah-back">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.6} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="iah-chip-t">Back</span>
      </button>
      {musicOk && (
        <button
          type="button"
          onClick={toggleMusic}
          className={`iah-chip iah-music${music && !silent ? ' is-on' : ''}${silent ? ' is-silent' : ''}`}
          title={`${TRACKS[0].title} — ${TRACKS[0].artist}`}
          aria-label={musicLabel}
          aria-pressed={music && !silent}
        >
          <span className="iah-bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="iah-chip-t">{!music ? 'About You' : silent ? 'Tap for sound' : 'About You'}</span>
        </button>
      )}

      <article>
        <header className="iah-hero">
          <div ref={heroDoorRef} className="iah-hero-door" onClick={begin}>
            <DoorArt uid="hero" pose="wave" />
          </div>
          <h1 className="iah-hero-title">
            {TITLE_LEAD && <span className="iah-t1">{TITLE_LEAD}</span>} <span className="iah-t2">{TITLE_LAST}</span>
          </h1>
          {DATA.subtitle && <p className="iah-hero-sub">{DATA.subtitle}</p>}
          <button type="button" className="iah-cue" onClick={begin} aria-label="Start reading">
            <svg viewBox="0 0 40 56" aria-hidden="true" focusable="false">
              <path d="M20 6 C18 18 22 30 20 44 M10 34 L20 46 L30 34" fill="none" stroke={YELLOW} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" filter="url(#iah-crayon)" />
            </svg>
          </button>
        </header>

        <div className="iah-body">
          {DATA.chapters.map((c, i) => (
            <section key={c.id} id={c.id} className="iah-ch" style={{ '--c': c.color }} aria-labelledby={c.title ? `${c.id}-h` : undefined}>
              {i > 0 && (
                <Doodle
                  kind={/^epilogue$/i.test(c.eyebrow) ? 'door' : SEQUENCE[(i - 1) % SEQUENCE.length]}
                  color={c.color}
                  className="iah-rv iah-doodle-div"
                />
              )}
              {c.title && (
                <h2 id={`${c.id}-h`} className="iah-rv iah-h">
                  {c.eyebrow && <span className="iah-tag">{c.eyebrow}</span>}
                  <span className="iah-title">{c.title}</span>
                  <svg className="iah-squiggle" viewBox="0 0 160 14" aria-hidden="true" focusable="false">
                    <path d="M3 8 C18 2 30 13 45 7 S72 2 87 8 S114 13 129 7 S150 3 157 8" pathLength="1" />
                  </svg>
                </h2>
              )}
              {c.blocks.map((b, k) => (
                <Block key={k} b={b} />
              ))}
            </section>
          ))}
        </div>

        {DATA.close && (
          <section className="iah-rv iah-end" aria-label="The last line">
            <div className="iah-end-door">
              <DoorArt uid="end" pose="heart" />
            </div>
            <p className="iah-close">
              {CLOSE_LEAD && <>{rich(CLOSE_LEAD)} </>}
              <span className="iah-name">{rich(CLOSE_LAST)}</span>
            </p>
          </section>
        )}
      </article>

      <footer className="iah-foot">
        {DATA.span && <p className="iah-foot-years">{DATA.span}</p>}
        <button type="button" onClick={toTop} className="iah-again">
          Read it again
        </button>
        <p className="iah-foot-note">kranthikiran.com · unlisted</p>
      </footer>

      <div ref={fxRef} className="iah-fx" aria-hidden="true" />
    </div>
  )
}

const IAH_STYLE = `
  .iah-root {
    background:
      radial-gradient(70% 40% at 50% -8%, rgba(200, 170, 255, 0.12) 0%, transparent 70%),
      radial-gradient(60% 40% at 50% 108%, rgba(255, 143, 192, 0.07) 0%, transparent 70%),
      linear-gradient(180deg, #17131f 0%, ${PAPER} 45%, #110e18 100%);
    color: ${CHALK};
    font-family: 'Nunito', 'Sora', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
  }
  .iah-root::-webkit-scrollbar { width: 0; height: 0; }
  .iah-root { scrollbar-width: none; }
  .iah-root > article { overflow-x: hidden; overflow-x: clip; }

  /* The tooth of dark drawing paper. */
  .iah-grain {
    position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: 0.6;
    background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.08 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  }

  .iah-margins { display: none; }
  @media (min-width: 960px) {
    .iah-margins { display: block; position: fixed; inset: 0; z-index: 1; pointer-events: none; opacity: 0.3; }
    .iah-margins > span { position: absolute; display: block; }
    .iah-margins .iah-doodle { width: 100%; height: 100%; }
  }

  /* ---------- top: a crayon drawing a line as you read ---------- */
  .iah-fade {
    position: fixed; top: 0; left: 0; right: 0; height: 80px; z-index: 20; pointer-events: none;
    background: linear-gradient(180deg, rgba(23, 19, 31, 0.97) 0%, rgba(23, 19, 31, 0.85) 45%, rgba(23, 19, 31, 0) 100%);
  }
  .iah-bar { position: fixed; top: 0; left: 0; right: 0; height: 6px; z-index: 31; pointer-events: none; }
  .iah-bar-line {
    position: absolute; left: 0; top: 1px; width: 100%; height: 4px;
    transform-origin: 0 50%; transform: scaleX(var(--p, 0)); border-radius: 0 3px 3px 0;
    background: linear-gradient(90deg, ${PINK}, ${YELLOW}, ${MINT}, ${SKY}, ${LILAC});
  }
  .iah-bar-tip {
    position: absolute; top: -4px; left: 0; width: 18px; height: 18px;
    transform: translateX(calc(var(--p, 0) * (100vw - 18px)));
  }
  .iah-bar-tip svg { display: block; width: 100%; height: 100%; overflow: visible; }

  /* ---------- corner buttons ---------- */
  .iah-chip {
    position: fixed; top: 0.85rem; z-index: 32;
    display: inline-flex; align-items: center; gap: 0.45rem; height: 40px; padding: 0 0.95rem;
    border-radius: 999px; border: 2px solid; cursor: pointer;
    font: 700 1.1rem/1 'Gaegu', 'Nunito', system-ui, sans-serif;
    background: #1f1a2b; box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.6);
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .iah-chip::after { content: ''; position: absolute; inset: -4px; }
  .iah-chip:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.6); }
  .iah-chip:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.6); }
  .iah-chip:focus-visible { outline: none; box-shadow: 0 0 0 3px ${YELLOW}; }
  .iah-back { left: 0.85rem; border-color: ${PINK}; color: ${PINK}; }
  .iah-music { right: 0.85rem; border-color: ${YELLOW}; color: ${YELLOW}; }
  .iah-music.is-silent { animation: iahNudge 2.4s ease-in-out infinite; }
  .iah-bars { display: inline-flex; align-items: flex-end; gap: 2.5px; height: 14px; }
  .iah-bars > i { display: block; width: 3px; height: 5px; border-radius: 2px; background: currentColor; }
  .iah-music.is-on .iah-bars > i { animation: iahBar 1.1s ease-in-out infinite; }
  .iah-music.is-on .iah-bars > i:nth-child(2) { animation-delay: 0.18s; }
  .iah-music.is-on .iah-bars > i:nth-child(3) { animation-delay: 0.36s; }
  @media (max-width: 639px) {
    .iah-chip-t { display: none; }
    .iah-chip { width: 40px; padding: 0; justify-content: center; }
    /* Waiting to be heard is the one moment the words matter. */
    .iah-music.is-silent { width: auto; padding: 0 0.85rem; }
    .iah-music.is-silent .iah-chip-t { display: inline; }
  }
  /* Wide screens: the margins are wide enough to say what's playing. */
  @media (min-width: 640px) { .iah-music { min-width: 9.5rem; justify-content: center; } }

  /* ---------- the doors ---------- */
  .iah-doorart { display: block; width: 100%; height: auto; overflow: visible; }
  .iah-leaf {
    transform-box: view-box; transform-origin: 64px 0;
    transform: scaleX(var(--leaf, 1));
    transition: transform 2.4s cubic-bezier(0.45, 0.05, 0.2, 1) 0.35s;
  }
  .iah-spill { opacity: var(--spill, 0.15); transition: opacity 2.2s ease 0.35s; }
  .iah-sparks path { transform-box: fill-box; transform-origin: center; animation: iahTwinkle 2.6s ease-in-out infinite; animation-delay: calc(var(--i) * -0.55s); }
  .iah-ted-wave { transform-box: fill-box; transform-origin: 16% 98%; animation: iahWave 1.5s ease-in-out 1s 3 both; }
  .iah-hero-door .iah-leaf, .iah-hero-door .iah-spill { transition: none; }

  /* ---------- opening ---------- */
  .iah-hero {
    position: relative; z-index: 3;
    min-height: 100vh; min-height: 100svh;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 4.4rem 1.25rem 2rem;
  }
  .iah-hero-door { width: clamp(210px, 60vw, 320px); cursor: pointer; }
  .iah-hero-title {
    margin: 0.4rem 0 0; display: flex; flex-direction: column; align-items: center;
    font-family: 'Fredoka', 'Nunito', system-ui, sans-serif; line-height: 0.95;
  }
  .iah-t1 {
    font-weight: 600; font-size: clamp(1.5rem, 6.6vw, 2.6rem); letter-spacing: 0.06em;
    color: ${YELLOW}; text-shadow: 3px 3px 0 #000;
    opacity: 0; animation: iahPop 0.7s cubic-bezier(0.3, 1.5, 0.5, 1) 1.1s forwards;
  }
  .iah-t2 {
    display: inline-block; margin-top: 0.06em;
    font-weight: 700; font-size: clamp(4rem, 22vw, 8.5rem); letter-spacing: 0.02em;
    color: ${PINK}; text-shadow: 5px 5px 0 #000;
    opacity: 0; animation: iahPopTilt 0.8s cubic-bezier(0.3, 1.6, 0.5, 1) 1.45s forwards;
  }
  .iah-hero-sub {
    margin: 1rem auto 0; max-width: 21rem;
    font-family: 'Gaegu', 'Nunito', system-ui, sans-serif; font-weight: 400;
    font-size: clamp(1.32rem, 4.6vw, 1.6rem); line-height: 1.22; color: ${CHALK_SOFT};
    text-wrap: balance;
    opacity: 0; animation: iahRise 0.9s ease 2s forwards;
  }
  .iah-cue {
    margin-top: 1rem; width: 44px; height: 60px; border: 0; padding: 0; background: none; cursor: pointer;
    opacity: 0; animation: iahRise 0.9s ease 2.7s forwards;
  }
  .iah-cue svg { display: block; width: 100%; height: 100%; animation: iahBob 2.2s ease-in-out 3.6s infinite; }
  .iah-cue:focus-visible { outline: none; box-shadow: 0 0 0 3px ${YELLOW}; border-radius: 12px; }

  /* ---------- the story ---------- */
  .iah-body { position: relative; z-index: 3; padding: 0 1.4rem; }
  .iah-ch { max-width: 35rem; margin: 0 auto; padding: 4rem 0 0.5rem; }
  .iah-ch:first-child { padding-top: 2.4rem; }
  @media (min-width: 640px) { .iah-ch { padding-top: 5.5rem; } }

  .iah-doodle { display: block; }
  .iah-doodle svg { display: block; width: 100%; height: 100%; overflow: visible; }
  .iah-doodle-div { width: 58px; height: 58px; margin: 0 auto 2.4rem; }
  /* Drawn, as if by hand, when it comes into view. */
  .iah-doodle-div path {
    stroke-dasharray: 1 1.05; stroke-dashoffset: 1.03;
    transition: stroke-dashoffset 1.2s cubic-bezier(0.5, 0, 0.25, 1);
    transition-delay: calc(0.25s + var(--i) * 0.16s);
  }
  .iah-doodle-div.is-in path { stroke-dashoffset: 0; }
  .iah-doodle-div .iah-dot { opacity: 0; transition: opacity 0.4s ease; transition-delay: calc(0.6s + var(--i) * 0.16s); }
  .iah-doodle-div.is-in .iah-dot { opacity: 1; }

  .iah-h { margin: 0 0 2rem; font-weight: normal; }
  .iah-tag {
    display: inline-block; margin-bottom: 0.8rem; padding: 0.2rem 0.72rem 0.28rem;
    border-radius: 12px 16px 13px 15px; transform: rotate(-2.5deg);
    font: 700 1.14rem/1.1 'Gaegu', 'Nunito', system-ui, sans-serif;
    color: #1a1422; background: var(--c); box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.6);
  }
  /* Gaegu is kept for short labels: its apostrophe sits apart from
     the letter after it, which shows in anything longer. */
  .iah-title {
    display: block;
    font-family: 'Fredoka', 'Nunito', system-ui, sans-serif; font-weight: 600;
    font-size: clamp(1.8rem, 6.6vw, 2.4rem); line-height: 1.08; letter-spacing: 0.005em; color: ${CHALK};
    text-wrap: balance;
  }
  .iah-squiggle { display: block; width: 150px; height: 14px; margin-top: 0.55rem; overflow: visible; }
  .iah-squiggle path {
    fill: none; stroke: var(--c); stroke-width: 4; stroke-linecap: round;
    stroke-dasharray: 1 1.05; stroke-dashoffset: 1.03;
    transition: stroke-dashoffset 1s ease 0.45s;
  }
  .iah-h.is-in .iah-squiggle path { stroke-dashoffset: 0; }

  .iah-p, .iah-stanza {
    margin: 0 0 1.25rem;
    font-size: clamp(1.06rem, 2.9vw, 1.17rem); line-height: 1.8; color: ${CHALK};
  }
  /* A stanza line that wraps hangs, so it still reads as one line. */
  .iah-stanza > span { display: block; padding-left: 1em; text-indent: -1em; }
  .iah-p strong, .iah-stanza strong { font-weight: 800; color: var(--c); }
  .iah-p em, .iah-stanza em { font-style: italic; }

  .iah-beat {
    margin: 1.8rem 0;
    font-family: 'Fredoka', 'Nunito', system-ui, sans-serif; font-weight: 600;
    font-size: clamp(1.45rem, 5.2vw, 1.9rem); line-height: 1.18; color: var(--c);
    text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.55); text-wrap: balance;
  }

  /* Thoughts go in a thought bubble. */
  .iah-voice {
    position: relative; width: fit-content; max-width: 100%;
    margin: 1.6rem 0 2.7rem; padding: 0.85rem 1.2rem 0.9rem;
    border: 2.5px solid ${LILAC}; border-radius: 22px 26px 24px 20px;
    background: #1e1929; box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.55);
    font-style: italic; font-size: clamp(1.08rem, 3vw, 1.2rem); line-height: 1.6; color: #ece2ff;
  }
  .iah-voice > span { display: block; }
  .iah-voice::before, .iah-voice::after {
    content: ''; position: absolute; border: 2.5px solid ${LILAC}; border-radius: 50%; background: #1e1929;
  }
  .iah-voice::before { width: 15px; height: 15px; left: 22px; bottom: -21px; }
  .iah-voice::after { width: 9px; height: 9px; left: 11px; bottom: -34px; }

  /* The two roads: crayon chips with arrows. */
  .iah-path { list-style: none; margin: 1.2rem 0 2rem; padding: 0; line-height: 2.75; font-weight: 600; font-size: clamp(0.98rem, 2.8vw, 1.06rem); }
  .iah-path > li { display: inline; }
  .iah-step {
    display: inline-block; white-space: nowrap; line-height: 1.3; padding: 0.24rem 0.74rem 0.28rem;
    border: 2px solid var(--k); border-radius: 999px; color: ${CHALK}; background: #1e1929;
    box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.55);
  }
  .iah-arrow { color: var(--k); font-weight: 800; }
  .iah-path > li:last-child .iah-step { background: ${PINK}; border-color: ${PINK}; color: #1a1422; font-weight: 800; }
  .iah-path.is-muted .iah-step, .iah-path.is-muted > li:last-child .iah-step {
    border-style: dashed; border-color: #6e6380; color: ${CHALK_SOFT}; background: transparent; box-shadow: none; font-weight: 400;
  }
  .iah-path.is-muted .iah-arrow { color: #8a7f99; }

  .iah-rv { opacity: 0; transform: translateY(14px); transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.22, 0.61, 0.36, 1); }
  .iah-rv.is-in { opacity: 1; transform: none; }

  /* ---------- the last door ---------- */
  .iah-end {
    position: relative; z-index: 3; max-width: 35rem; margin: 0 auto;
    padding: 5rem 1.4rem 1rem; text-align: center;
    display: flex; flex-direction: column; align-items: center;
  }
  .iah-end-door { width: clamp(220px, 64vw, 330px); --leaf: 1; --spill: 0.15; }
  .iah-end.is-in .iah-end-door { --leaf: 0.12; --spill: 1; }
  .iah-end .iah-ted-heart { transform-box: fill-box; transform-origin: center; }
  .iah-end.is-in .iah-ted-heart { animation: iahBeat 1.1s ease-in-out 2.7s 3; }
  .iah-close {
    margin: 1.4rem 0 0; text-wrap: balance;
    font-family: 'Fredoka', 'Nunito', system-ui, sans-serif; font-weight: 600;
    font-size: clamp(2rem, 8.4vw, 3.5rem); line-height: 1.12; color: ${CHALK};
    text-shadow: 3px 3px 0 #000;
    opacity: 0; transform: translateY(12px) scale(0.96);
    transition: opacity 1.2s ease 2.3s, transform 1.2s cubic-bezier(0.3, 1.4, 0.5, 1) 2.3s;
  }
  .iah-end.is-in .iah-close { opacity: 1; transform: none; }
  .iah-name { display: inline-block; color: ${PINK}; }

  .iah-foot { position: relative; z-index: 3; text-align: center; padding: 3.5rem 1.4rem 6rem; }
  .iah-foot-years { margin: 0 0 1.8rem; font: 700 1.3rem/1 'Gaegu', 'Nunito', system-ui, sans-serif; letter-spacing: 0.08em; color: ${YELLOW}; }
  .iah-again {
    min-height: 44px; padding: 0 1.4rem; border-radius: 999px; cursor: pointer;
    font: 700 1.18rem/1 'Gaegu', 'Nunito', system-ui, sans-serif;
    color: #1a1422; background: ${YELLOW}; border: 2px solid ${YELLOW};
    box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.6); transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .iah-again:hover { transform: translate(-1px, -1px); box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.6); }
  .iah-again:focus-visible { outline: none; box-shadow: 0 0 0 3px ${PINK}; }
  .iah-foot-note { margin: 2rem 0 0; font: 400 1.08rem/1.3 'Gaegu', 'Nunito', system-ui, sans-serif; color: ${CHALK_SOFT}; }

  /* Hearts and stars when the last door opens. */
  .iah-fx { position: fixed; inset: 0; z-index: 40; pointer-events: none; overflow: hidden; }
  .iah-bit {
    position: absolute; line-height: 1; will-change: transform, opacity;
    text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.6);
    animation: iahFly 2.6s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
  }

  /* ---------- motion ---------- */
  @keyframes iahPop { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: none; } }
  @keyframes iahPopTilt { from { opacity: 0; transform: scale(0.4) rotate(-12deg); } to { opacity: 1; transform: rotate(-3deg); } }
  @keyframes iahRise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  @keyframes iahBob { 0%, 100% { transform: translateY(-4px); } 50% { transform: translateY(5px); } }
  @keyframes iahTwinkle { 0%, 100% { transform: scale(0.55) rotate(0deg); opacity: 0.5; } 50% { transform: scale(1.1) rotate(25deg); opacity: 1; } }
  @keyframes iahWave { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-16deg); } 75% { transform: rotate(12deg); } }
  @keyframes iahBar { 0%, 100% { height: 4px; } 50% { height: 14px; } }
  @keyframes iahNudge { 0%, 100% { box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.6); } 50% { box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.6), 0 0 0 4px rgba(255, 214, 104, 0.35); } }
  @keyframes iahBeat { 0%, 100% { transform: scale(1); } 30% { transform: scale(1.14); } 60% { transform: scale(0.98); } }
  @keyframes iahFly {
    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
    12% { opacity: 1; }
    100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))) rotate(var(--rot)) scale(1); }
  }

  /* Reduced motion: every word, every drawing, nothing moving. */
  @media (prefers-reduced-motion: reduce) {
    .iah-rv { opacity: 1; transform: none; transition: none; }
    .iah-t1, .iah-hero-sub, .iah-cue { animation: none; opacity: 1; }
    .iah-t2 { animation: none; opacity: 1; transform: rotate(-3deg); }
    .iah-cue svg, .iah-sparks path, .iah-ted-wave, .iah-music.is-silent, .iah-music.is-on .iah-bars > i,
    .iah-end.is-in .iah-ted-heart { animation: none; }
    .iah-leaf, .iah-spill { transition: none; }
    .iah-doodle-div path, .iah-squiggle path { stroke-dashoffset: 0; transition: none; }
    .iah-doodle-div .iah-dot { opacity: 1; transition: none; }
    .iah-close { opacity: 1; transform: none; transition: none; }
  }
`
