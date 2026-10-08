import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { useAmbient } from './AmbientContext'
import STORY from '../lib/itsAlwaysHer.md?raw'

/* ------------------------------------------------------------------ *
 * #/itsalwaysher — "It's always her", a long letter, eight years long.
 *
 * The story lives in src/lib/itsAlwaysHer.md, as plain text in the
 * format it was written in: # headings, **bold**, *italic*, --- between
 * chapters. To change a word, change it there. Anything above the
 * title is ignored, so a draft pasted straight out of a chat window
 * still renders from the title down.
 *
 * Its recurring image is a door: the years of different doors, until
 * she opened one herself. So the page is dark, and lit by doorways.
 * One stands ajar at the top and opens as you scroll into the story.
 * A small one waits between every chapter and opens when you reach it.
 * The last one opens all the way, and the last line is in its light.
 * The whole page warms a little as you go.
 *
 * Private and unlisted, shared directly by link. Not in nav. First name
 * only, like the other personal notes on this site.
 * ------------------------------------------------------------------ */

const YEARS = /^\d{4}(?:\s*[–-]\s*\d{4})?$/
const MONTH = /^(January|February|March|April|May|June|July|August|September|October|November|December)$/i
const BOOKEND = /^(Prologue|Epilogue)$/i

// Lines this short are set as a stanza, one under the other, rather
// than as paragraphs with space between every sentence. It's the
// difference between reading a poem and reading a list of slogans.
const SHORT = 36

// Typesetting only. The words stay exactly as written.
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
      // "2018 — The First Time" becomes a small 2018 over the title.
      // Only years, months and the prologue/epilogue split this way, so
      // "And Then — WhatsApp" stays whole.
      const m = text.match(/^(.+?)\s+[—–-]\s+(.+)$/)
      const split = m && (YEARS.test(m[1]) || MONTH.test(m[1]) || BOOKEND.test(m[1]))
      ch = { eyebrow: split ? m[1] : '', title: split ? m[2] : text, blocks: [] }
      story.chapters.push(ch)
      continue
    }
    if (!ch) {
      ch = { eyebrow: '', title: '', blocks: [] }
      story.chapters.push(ch)
    }
    ch.blocks.push(classify(line))
  }

  story.chapters.forEach((c) => {
    c.blocks = arrange(c.blocks)
    // "It was never:" introduces the straight line the story didn't
    // take. That one is set quieter than the one it did.
    c.blocks.forEach((b, i) => {
      if (b.t !== 'path') return
      const prev = c.blocks[i - 1]
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

  const years = story.chapters.flatMap((c) => (YEARS.test(c.eyebrow) ? c.eyebrow.match(/\d{4}/g).map(Number) : []))
  story.span = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : ''

  // The year shown in the corner while each chapter is read. Chapters
  // without one are still in the last year named; the prologue is
  // before all of it, and the epilogue is all of it.
  let current = ''
  story.chapters.forEach((c, i) => {
    if (YEARS.test(c.eyebrow)) current = c.eyebrow.replace(/\s*[–-]\s*/, '–')
    c.year = /^prologue$/i.test(c.eyebrow) ? '' : /^epilogue$/i.test(c.eyebrow) ? story.span : current
    c.id = `iah-${i}`
  })
  return story
}

const DATA = parse(STORY)
const TAB_TITLE = DATA.title ? DATA.title.charAt(0) + DATA.title.slice(1).toLowerCase() : 'It’s always her'

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

/* ---------------- the door ---------------- */

// A doorway with light on the other side. It's hinged on the left and
// swings away from you, into the light. How far is set by --leaf, and
// how much light gets out by --glow, --spill and --gap.
const Door = forwardRef(function Door({ className = '', style, onClick }, ref) {
  return (
    <span ref={ref} className={`iah-door ${className}`} style={style} onClick={onClick} aria-hidden="true">
      <span className="iah-door-glow" />
      <span className="iah-door-room" />
      <span className="iah-door-spill" />
      <span className="iah-door-leaf">
        <span className="iah-door-knob" />
      </span>
      <span className="iah-door-frame" />
      <span className="iah-door-gap" />
    </span>
  )
})

/* ---------------- one block of the story ---------------- */

function Block({ b }) {
  if (b.t === 'beat') return <p className="iah-rv iah-beat">{rich(b.text)}</p>
  if (b.t === 'voice')
    return (
      <p className="iah-rv iah-voice">
        {b.lines.map((l, i) => (
          <span key={i}>{rich(l)}</span>
        ))}
      </p>
    )
  if (b.t === 'stanza')
    return (
      <p className="iah-rv iah-stanza">
        {b.lines.map((l, i) => (
          <span key={i}>{rich(l)}</span>
        ))}
      </p>
    )
  if (b.t === 'path')
    return (
      <ol className={`iah-rv iah-path${b.muted ? ' is-muted' : ''}`}>
        {b.steps.map((s, i) => (
          <li key={i}>
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

export default function ItsAlwaysHer({ onBack }) {
  const rootRef = useRef(null)
  const heroDoorRef = useRef(null)
  const ajar = useRef(0)
  const opened = useRef(0)
  const yearRef = useRef('')
  const [year, setYear] = useState('')
  const reduced = useRef(typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

  // The site radio, if it's on, would be the wrong thing to read this to.
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

  // The door at the top: it eases ajar on arrival, then opens the rest
  // of the way as you scroll into the story — and closes again if you
  // scroll back up to it.
  const paintHero = useCallback(() => {
    const el = heroDoorRef.current
    if (!el) return
    const a = ajar.current
    const s = opened.current
    el.style.setProperty('--leaf', `${(34 * a + 46 * s).toFixed(2)}deg`)
    el.style.setProperty('--glow', (0.22 + 0.38 * a + 0.4 * s).toFixed(3))
    el.style.setProperty('--spill', (0.4 * a + 0.6 * s).toFixed(3))
    el.style.setProperty('--gap', (1 - 0.6 * a - 0.4 * s).toFixed(3))
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
      const x = clamp01((t - t0 - 600) / 2400)
      ajar.current = ease(x)
      paintHero()
      if (x < 1) raf = requestAnimationFrame(step)
    }
    paintHero()
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [paintHero])

  // Scrolling drives the progress hairline, the warmth of the page, the
  // top door and the year in the corner. All written straight to the
  // DOM; only the year goes through React, and only when it changes.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const chapters = Array.from(root.querySelectorAll('.iah-ch'))
    const end = root.querySelector('.iah-end')
    let raf = 0
    const frame = () => {
      raf = 0
      const top = root.scrollTop
      const h = root.clientHeight
      const span = root.scrollHeight - h
      const p = span > 0 ? clamp01(top / span) : 0
      root.style.setProperty('--p', p.toFixed(4))
      root.style.setProperty('--dawn', (0.08 + 0.8 * Math.pow(p, 2.2)).toFixed(3))

      if (!reduced.current) {
        opened.current = clamp01(top / (h * 0.8))
        paintHero()
      }

      let y = ''
      if (end && end.getBoundingClientRect().top < h * 0.7) y = DATA.span
      else {
        for (let i = 0; i < chapters.length; i++) {
          if (chapters[i].getBoundingClientRect().top < h * 0.45) y = DATA.chapters[i].year
          else break
        }
      }
      if (y !== yearRef.current) {
        yearRef.current = y
        setYear(y)
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

  // Reveal blocks, and open doors, as they come into view. A hard flick
  // can carry a block from below the fold to above it between two
  // observer callbacks, so a sweep on scroll catches anything missed —
  // otherwise a line could stay invisible. Reduced motion shows it all.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const pending = () => root.querySelectorAll('.iah-rv:not(.is-in)')

    if (reduced.current || !('IntersectionObserver' in window)) {
      pending().forEach((n) => n.classList.add('is-in'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
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
            n.classList.add('is-in')
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
  }, [])

  const behavior = reduced.current ? 'auto' : 'smooth'
  // Measured from the screen, not offsetTop: the chapters sit inside a
  // positioned wrapper, so their offsetTop is relative to that, not to
  // the page that scrolls.
  const begin = () => {
    const root = rootRef.current
    const first = root?.querySelector('.iah-ch')
    if (!first) return
    const top = root.scrollTop + first.getBoundingClientRect().top - root.getBoundingClientRect().top
    root.scrollTo({ top: Math.max(0, top - 8), behavior })
  }
  const toTop = () => rootRef.current?.scrollTo({ top: 0, behavior })

  return (
    <div ref={rootRef} className="iah-root fixed inset-0 z-[300] overflow-y-auto overflow-x-hidden">
      <style>{IAH_STYLE}</style>
      <div className="iah-dawn" aria-hidden="true" />
      <div className="iah-fade" aria-hidden="true" />
      <div className="iah-bar" aria-hidden="true">
        <span />
      </div>

      <button type="button" onClick={onBack} title="Back" className="iah-chip iah-back">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="iah-chip-t">Back</span>
      </button>
      <div className={`iah-chip iah-year${year ? ' is-on' : ''}`} aria-hidden="true">
        <span key={year}>{year}</span>
      </div>

      <article>
        <header className="iah-hero">
          <Door ref={heroDoorRef} className="iah-door-hero" onClick={begin} />
          <h1 className="iah-hero-title">{DATA.title}</h1>
          {DATA.subtitle && <p className="iah-hero-sub">{DATA.subtitle}</p>}
          <button type="button" className="iah-cue" onClick={begin} aria-label="Start reading">
            <span className="iah-cue-line" aria-hidden="true" />
          </button>
        </header>

        <div className="iah-body">
          {DATA.chapters.map((c, i) => (
            <section key={c.id} id={c.id} className="iah-ch" aria-labelledby={c.title ? `${c.id}-h` : undefined}>
              {i > 0 && <Door className={`iah-rv iah-door-div${/^epilogue$/i.test(c.eyebrow) ? ' is-wide' : ''}`} />}
              {c.title && (
                <h2 id={`${c.id}-h`} className="iah-rv iah-h">
                  {c.eyebrow && <span className="iah-eyebrow">{c.eyebrow}</span>}
                  <span className="iah-title">{c.title}</span>
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
            <Door className="iah-door-end" />
            <p className="iah-close">{rich(DATA.close)}</p>
          </section>
        )}
      </article>

      <footer className="iah-foot">
        {DATA.span && <p className="iah-foot-years">{DATA.span.replace('–', ' — ')}</p>}
        <button type="button" onClick={toTop} className="iah-again">
          Read it again
        </button>
        <p className="iah-foot-note">kranthikiran.com &middot; unlisted</p>
      </footer>
    </div>
  )
}

// Night, lit by doorways. Text colours are solid, not translucent, so
// their contrast is the number measured rather than whatever the
// background happens to be behind them.
const INK = '#e4d6c2' // body
const INK_STRONG = '#f7ecdb' // beats, titles
const INK_SOFT = '#b4a48f' // subtitle, quiet path
const GOLD = '#e9b866' // years, thoughts, accents

const IAH_STYLE = `
  .iah-root {
    background:
      radial-gradient(70% 42% at 50% -6%, rgba(116, 72, 100, 0.26) 0%, transparent 70%),
      radial-gradient(50% 30% at -10% 60%, rgba(90, 58, 40, 0.18) 0%, transparent 70%),
      linear-gradient(180deg, #120e0c 0%, #15100d 50%, #19120e 100%);
    color: ${INK};
    -webkit-font-smoothing: antialiased;
    -webkit-tap-highlight-color: transparent;
  }
  .iah-root > article { overflow-x: hidden; overflow-x: clip; }
  .iah-root::-webkit-scrollbar { width: 0; height: 0; }
  .iah-root { scrollbar-width: none; }

  /* The light from below grows as the story goes on. */
  .iah-dawn {
    position: fixed; inset: 0; z-index: 1; pointer-events: none;
    background: radial-gradient(95% 55% at 50% 112%, rgba(248, 178, 92, 0.34) 0%, rgba(248, 178, 92, 0.08) 48%, transparent 76%);
    opacity: var(--dawn, 0.08);
  }

  /* Text scrolling up fades out under the corner chips rather than
     running straight into them. */
  .iah-fade {
    position: fixed; top: 0; left: 0; right: 0; height: 78px; z-index: 20; pointer-events: none;
    background: linear-gradient(180deg, rgba(19, 14, 12, 0.96) 0%, rgba(19, 14, 12, 0.82) 45%, rgba(19, 14, 12, 0) 100%);
  }
  .iah-bar { position: fixed; top: 0; left: 0; right: 0; height: 2px; z-index: 31; background: rgba(233, 184, 102, 0.1); }
  .iah-bar > span {
    display: block; height: 100%; transform-origin: 0 50%; transform: scaleX(var(--p, 0));
    background: linear-gradient(90deg, rgba(233, 184, 102, 0.45), ${GOLD});
  }

  /* ---------- corner chips ---------- */
  .iah-chip {
    position: fixed; top: 0.9rem; z-index: 30;
    display: inline-flex; align-items: center; gap: 0.4rem; height: 40px; padding: 0 0.95rem;
    border-radius: 999px; border: 1px solid rgba(233, 184, 102, 0.24);
    font: 500 0.8rem/1 'Sora', system-ui, sans-serif; color: ${GOLD};
    background: rgba(18, 14, 12, 0.62);
    -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  }
  .iah-back { left: 0.9rem; cursor: pointer; transition: transform 0.2s ease, background 0.2s ease; }
  .iah-back::after { content: ''; position: absolute; inset: -4px; }
  .iah-back:hover { transform: translateY(-1px); background: rgba(40, 30, 24, 0.8); }
  .iah-back:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(233, 184, 102, 0.55); }
  .iah-year {
    right: 0.9rem; pointer-events: none; opacity: 0; transition: opacity 0.5s ease;
    font: 500 11px/1 'JetBrains Mono', ui-monospace, monospace; letter-spacing: 0.16em;
  }
  .iah-year.is-on { opacity: 1; }
  .iah-year > span { animation: iahTick 0.55s ease both; }
  @media (max-width: 639px) {
    .iah-chip-t { display: none; }
    .iah-back { width: 40px; padding: 0; justify-content: center; }
  }

  /* ---------- the door ---------- */
  .iah-door {
    --w: 18px;
    position: relative; display: block; flex: none;
    width: var(--w); height: calc(var(--w) * 1.8);
    margin: 0 auto;
    perspective: calc(var(--w) * 4.5);
  }
  .iah-door > span { position: absolute; display: block; pointer-events: none; }
  .iah-door-glow {
    left: 50%; top: 55%; width: calc(var(--w) * 4.2); height: calc(var(--w) * 4.2);
    transform: translate(-50%, -50%); border-radius: 50%;
    background: radial-gradient(closest-side, rgba(255, 196, 112, 0.5), rgba(255, 170, 80, 0.14) 55%, transparent);
    opacity: var(--glow, 0.22);
    transition: opacity 1.8s ease;
  }
  .iah-door-room, .iah-door-leaf { inset: 0; border-radius: calc(var(--w) * 0.5) calc(var(--w) * 0.5) 1px 1px; }
  .iah-door-room { background: radial-gradient(120% 78% at 50% 100%, #fffaf0 0%, #ffe6b0 30%, #f7bd62 62%, #d98a3a 100%); }
  .iah-door-spill {
    top: 100%; left: -30%; right: -30%; height: calc(var(--w) * 0.9);
    background: linear-gradient(180deg, rgba(255, 212, 142, 0.5), rgba(255, 190, 110, 0));
    clip-path: polygon(18.75% 0, 81.25% 0, 100% 100%, 0 100%);
    opacity: var(--spill, 0);
    transition: opacity 1.8s ease;
  }
  .iah-door-leaf {
    transform-origin: 0 50%;
    transform: rotateY(var(--leaf, 0deg));
    background: linear-gradient(90deg, #2a1e17 0%, #3b2b21 55%, #2f221a 100%);
    box-shadow: inset 0 0 0 1px rgba(255, 226, 180, 0.07);
    transition: transform 1.9s cubic-bezier(0.45, 0.05, 0.2, 1);
  }
  .iah-door-leaf::before, .iah-door-leaf::after {
    content: ''; position: absolute; left: 19%; right: 19%;
    border: 1px solid rgba(255, 226, 180, 0.13);
  }
  .iah-door-leaf::before { top: 15%; height: 30%; border-radius: calc(var(--w) * 0.31) calc(var(--w) * 0.31) 1px 1px; }
  .iah-door-leaf::after { top: 53%; height: 35%; border-radius: 1px; }
  .iah-door-knob {
    position: absolute; right: 12%; top: 50%;
    width: calc(var(--w) * 0.07 + 1.5px); height: calc(var(--w) * 0.07 + 1.5px);
    border-radius: 50%; background: #d9a85b; box-shadow: 0 0 4px rgba(255, 200, 120, 0.55);
  }
  .iah-door-frame {
    inset: calc(var(--w) * -0.07 - 1px) calc(var(--w) * -0.07 - 1px) 0;
    border: calc(var(--w) * 0.07 + 1px) solid #4b3729; border-bottom: 0;
    border-radius: calc(var(--w) * 0.57 + 1px) calc(var(--w) * 0.57 + 1px) 0 0;
  }
  .iah-door-gap {
    left: 8%; right: 8%; bottom: -1px; height: 2px; border-radius: 1px;
    background: #ffd894; box-shadow: 0 0 calc(var(--w) * 0.3) calc(var(--w) * 0.04) rgba(255, 196, 112, 0.8);
    opacity: var(--gap, 1);
    transition: opacity 1.4s ease;
  }

  /* Between chapters: shut until you reach it, then ajar. The one
     before the epilogue opens all the way. */
  .iah-door-div { margin-bottom: 2.6rem; }
  .iah-door-div .iah-door-leaf { transition-delay: 0.3s; }
  .iah-door-div.is-in { --leaf: 50deg; --glow: 0.55; --spill: 0.5; --gap: 0.35; }
  .iah-door-div.is-wide.is-in { --leaf: 80deg; --glow: 0.9; --spill: 0.9; --gap: 0; }

  /* The one at the top is driven from script, frame by frame. */
  .iah-door-hero { --w: clamp(104px, 29vw, 160px); cursor: pointer; pointer-events: auto; margin-bottom: clamp(2.6rem, 7vh, 3.8rem); }
  .iah-door-hero > span, .iah-door-hero .iah-door-leaf { transition: none; }

  /* ---------- opening ---------- */
  .iah-hero {
    position: relative; z-index: 3;
    min-height: 100vh; min-height: 100svh;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 5.5rem 1.5rem 3rem;
  }
  .iah-hero-title {
    margin: 0; white-space: nowrap;
    font-family: 'Newsreader', Georgia, serif; font-weight: 300;
    font-size: clamp(1.8rem, 8.2vw, 4.3rem); line-height: 1.05; letter-spacing: 0.08em;
    color: ${INK_STRONG}; text-shadow: 0 0 46px rgba(255, 190, 110, 0.22);
    opacity: 0; animation: iahRise 1.6s cubic-bezier(0.22, 0.61, 0.36, 1) 1.5s forwards;
  }
  .iah-hero-sub {
    margin: 1.3rem auto 0; max-width: 24rem;
    font-family: 'Newsreader', Georgia, serif; font-style: italic; font-weight: 300;
    font-size: clamp(1.04rem, 3.4vw, 1.26rem); line-height: 1.55; color: ${INK_SOFT};
    text-wrap: balance;
    opacity: 0; animation: iahRise 1.6s cubic-bezier(0.22, 0.61, 0.36, 1) 2.3s forwards;
  }
  .iah-cue {
    margin-top: clamp(2.4rem, 8vh, 4rem); width: 44px; height: 56px;
    display: grid; place-items: center; border: 0; padding: 0; background: none; cursor: pointer;
    opacity: 0; animation: iahRise 1.4s ease 3.2s forwards;
  }
  .iah-cue:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(233, 184, 102, 0.5); border-radius: 12px; }
  .iah-cue-line {
    display: block; width: 1px; height: 44px;
    background: linear-gradient(180deg, ${GOLD}, transparent);
    animation: iahDrop 2.8s ease-in-out infinite;
  }

  /* ---------- the story ---------- */
  .iah-body { position: relative; z-index: 3; padding: 0 1.5rem; }
  .iah-ch { max-width: 34rem; margin: 0 auto; padding: 4.6rem 0 0.4rem; }
  .iah-ch:first-child { padding-top: 3rem; }
  @media (min-width: 640px) { .iah-ch { padding-top: 6.4rem; } }

  .iah-h { margin: 0 0 2.3rem; font-weight: normal; }
  .iah-eyebrow {
    display: block; margin-bottom: 0.85rem;
    font: 500 10.5px/1.4 'JetBrains Mono', ui-monospace, monospace;
    letter-spacing: 0.3em; text-transform: uppercase; color: ${GOLD};
  }
  .iah-title {
    display: block;
    font-family: 'Newsreader', Georgia, serif; font-weight: 400;
    font-size: clamp(1.66rem, 6.2vw, 2.4rem); line-height: 1.14; letter-spacing: -0.01em;
    color: ${INK_STRONG}; text-wrap: balance;
  }

  .iah-p, .iah-stanza, .iah-beat, .iah-voice, .iah-path, .iah-close { font-family: 'Newsreader', Georgia, serif; }
  .iah-p, .iah-stanza {
    margin: 0 0 1.4rem;
    font-size: clamp(1.12rem, 3.1vw, 1.27rem); line-height: 1.78; color: ${INK};
  }
  /* A stanza line that wraps hangs, so it still reads as one line. */
  .iah-stanza > span { display: block; padding-left: 1em; text-indent: -1em; }
  .iah-p strong, .iah-stanza strong { font-weight: 600; color: ${INK_STRONG}; }
  .iah-p em, .iah-stanza em { font-style: italic; color: ${INK_STRONG}; }

  .iah-beat {
    margin: 2.2rem 0;
    font-weight: 500; font-size: clamp(1.36rem, 4.5vw, 1.74rem); line-height: 1.4;
    letter-spacing: -0.005em; color: ${INK_STRONG};
  }
  .iah-voice {
    margin: 1.7rem 0 1.9rem; padding-left: 1.1rem;
    border-left: 1px solid rgba(233, 184, 102, 0.45);
    font-style: italic; font-size: clamp(1.14rem, 3.3vw, 1.32rem); line-height: 1.72; color: ${GOLD};
  }
  .iah-voice > span { display: block; }

  .iah-path {
    list-style: none; margin: 1.3rem 0 2.1rem; padding: 0;
    font-style: italic; font-size: clamp(1.08rem, 3vw, 1.22rem); line-height: 2.05; color: ${INK};
  }
  .iah-path > li { display: inline; }
  /* Each step wraps as a whole, and a line only ever breaks after an
     arrow, never before one. */
  .iah-step { white-space: nowrap; }
  .iah-arrow { font-style: normal; font-weight: 400; color: ${GOLD}; }
  .iah-path > li:last-child { font-style: normal; font-weight: 500; color: ${INK_STRONG}; }
  .iah-path.is-muted { color: ${INK_SOFT}; }
  .iah-path.is-muted > li:last-child { font-style: italic; font-weight: 400; color: ${INK_SOFT}; }
  .iah-path.is-muted .iah-arrow { color: rgba(233, 184, 102, 0.6); }

  .iah-rv { opacity: 0; transform: translateY(14px); transition: opacity 0.9s ease, transform 0.9s cubic-bezier(0.22, 0.61, 0.36, 1); }
  .iah-rv.is-in { opacity: 1; transform: none; }

  /* ---------- the last door ---------- */
  .iah-end {
    position: relative; z-index: 3; max-width: 34rem; margin: 0 auto;
    padding: 7rem 1.5rem 1rem; text-align: center;
    display: flex; flex-direction: column; align-items: center;
  }
  .iah-door-end { --w: clamp(116px, 33vw, 176px); margin-bottom: 4rem; }
  /* A shorter pool of light, so the last line sits in its fading edge
     rather than its brightest part, and stays easy to read. */
  .iah-door-end .iah-door-spill { height: calc(var(--w) * 0.62); }
  .iah-door-end .iah-door-leaf { transition: transform 2.8s cubic-bezier(0.45, 0.05, 0.2, 1) 0.5s; }
  .iah-door-end .iah-door-glow { width: calc(var(--w) * 6); height: calc(var(--w) * 6); transition-duration: 3s; }
  .iah-end.is-in .iah-door-end { --leaf: 80deg; --glow: 1; --spill: 0.85; --gap: 0; }
  .iah-close {
    margin: 0; font-style: italic; font-weight: 400;
    font-size: clamp(2rem, 8vw, 3.4rem); line-height: 1.15; letter-spacing: -0.01em;
    color: ${INK_STRONG}; text-shadow: 0 0 44px rgba(255, 190, 110, 0.4);
    opacity: 0; transform: translateY(10px);
    transition: opacity 1.6s ease 2s, transform 1.6s ease 2s;
  }
  .iah-end.is-in .iah-close { opacity: 1; transform: none; }

  .iah-foot { position: relative; z-index: 3; text-align: center; padding: 4rem 1.5rem 6rem; }
  .iah-foot-years {
    margin: 0 0 2.2rem;
    font: 500 11px/1.4 'JetBrains Mono', ui-monospace, monospace; letter-spacing: 0.3em; color: ${GOLD};
  }
  .iah-again {
    min-height: 44px; padding: 0 1.5rem; border-radius: 999px; cursor: pointer;
    font: 500 10.5px/1 'JetBrains Mono', ui-monospace, monospace; letter-spacing: 0.26em; text-transform: uppercase;
    color: ${GOLD}; background: rgba(233, 184, 102, 0.06); border: 1px solid rgba(233, 184, 102, 0.35);
    transition: background 0.25s ease, transform 0.25s ease;
  }
  .iah-again:hover { background: rgba(233, 184, 102, 0.14); transform: translateY(-1px); }
  .iah-again:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(233, 184, 102, 0.5); }
  .iah-foot-note {
    margin: 2.2rem 0 0;
    font: 500 9.5px/1.4 'JetBrains Mono', ui-monospace, monospace; letter-spacing: 0.28em; text-transform: uppercase;
    color: ${INK_SOFT};
  }

  /* ---------- motion ---------- */
  @keyframes iahRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  @keyframes iahDrop { 0%, 100% { opacity: 0.3; transform: translateY(-6px); } 50% { opacity: 1; transform: translateY(6px); } }
  @keyframes iahTick { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: none; } }

  /* Reduced motion: every word, every door, nothing moving. */
  @media (prefers-reduced-motion: reduce) {
    .iah-rv { opacity: 1; transform: none; transition: none; }
    .iah-door > span, .iah-door .iah-door-leaf { transition: none !important; }
    .iah-hero-title, .iah-hero-sub, .iah-cue { animation: none; opacity: 1; }
    .iah-cue-line, .iah-year > span { animation: none; }
    .iah-close { transition: none; opacity: 1; transform: none; }
  }
`
