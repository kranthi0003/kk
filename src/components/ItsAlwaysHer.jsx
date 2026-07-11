import React, { useEffect, useRef, useState, useCallback } from 'react'

const ACCENT = 'var(--color-brand)'
const STORE_KEY = 'iah-book-progress'

// ── Inline emphasis: _italic_ and **bold** ───────────────────────────────────
function inline(text) {
  const out = []
  const re = /(\*\*([^*]+)\*\*|_([^_]+)_)/g
  let last = 0, m, k = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[2] !== undefined) out.push(<strong key={k++}>{m[2]}</strong>)
    else out.push(<em key={k++}>{m[3]}</em>)
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function Reveal({ children, className, as: Tag = 'div' }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.1 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <Tag ref={ref} className={className} style={{ opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateY(16px)', transition: 'opacity .9s ease, transform .9s ease' }}>
      {children}
    </Tag>
  )
}

function Ornament() {
  return (
    <div className="iah-orn"><span className="iah-orn-rule" /><span className="iah-orn-mark">❦</span><span className="iah-orn-rule" /></div>
  )
}

function Block({ b, drop }) {
  if (b.type === 'verse') {
    return (
      <Reveal className="iah-verse" as="blockquote">
        {b.lines.map((l, i) => <span key={i} className="iah-verse-line">{inline(l)}</span>)}
      </Reveal>
    )
  }
  if (b.type === 'em') return <Reveal className="iah-em" as="p">{inline(b.text)}</Reveal>
  if (b.type === 'break') return <div className="iah-break" aria-hidden="true">✦</div>
  return <Reveal as="p" className={`iah-p${drop ? ' iah-drop' : ''}`}>{inline(b.text)}</Reveal>
}

// One chapter, rendered on its own "page".
function Chapter({ ch }) {
  let firstP = true
  return (
    <div className="iah-chapter">
      <div className="iah-ch-head">
        <p className="iah-ch-num">{ch.label}</p>
        {ch.kind !== 'prologue' || ch.title ? <h2 className="iah-ch-title">{ch.title}</h2> : null}
      </div>
      {ch.blocks.map((b, i) => {
        const drop = b.type === 'p' && firstP
        if (drop) firstP = false
        return <Block key={i} b={b} drop={drop} />
      })}
    </div>
  )
}

// Cover + table of contents.
function Contents({ meta, chapters, onOpen, savedIndex }) {
  return (
    <div className="iah-toc">
      <header className="iah-cover">
        <div className="iah-cover-glow" aria-hidden="true" />
        <div className="relative">
          <p className="iah-kicker">A Novel · In Eleven Chapters</p>
          <h1 className="iah-title">{meta.title}</h1>
          <p className="iah-sub">{meta.subtitle}</p>
          <p className="iah-cover-meta">{meta.author} · {meta.place}</p>
        </div>
      </header>

      <Ornament />

      <blockquote className="iah-dedication">
        {meta.dedication.map((l, i) => <span key={i}>{l}</span>)}
      </blockquote>

      <Ornament />

      <p className="iah-toc-label">Contents</p>
      <ul className="iah-toc-list">
        {chapters.map((ch, i) => (
          <li key={ch.id}>
            <button className="iah-toc-item" onClick={() => onOpen(i)}>
              <span className="iah-toc-num">{ch.label}</span>
              <span className="iah-toc-title">{ch.title}</span>
              <span className="iah-toc-dot" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <button className="iah-begin" onClick={() => onOpen(savedIndex > 0 ? savedIndex : 0)}>
        {savedIndex > 0 ? 'Resume reading' : 'Begin reading'}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
      {savedIndex > 0 && (
        <p className="iah-resume-note">You left off in {chapters[savedIndex]?.label}.</p>
      )}
    </div>
  )
}

const CSS = `
  .iah{ font-family:'Newsreader',Georgia,serif; }
  .iah-wrap{ max-width:40rem; margin:0 auto; padding:0 1.5rem; }
  .iah-cover{ text-align:center; padding:3.5rem 0 2rem; position:relative; }
  .iah-cover-glow{ position:absolute; left:50%; top:2rem; width:22rem; height:22rem; transform:translateX(-50%);
    border-radius:9999px; filter:blur(90px); pointer-events:none; background:color-mix(in oklab, ${ACCENT} 20%, transparent); opacity:.5; }
  .iah-kicker,.iah-toc-label{ font-family:ui-monospace,monospace; font-size:11px; letter-spacing:.32em; text-transform:uppercase; color:${ACCENT}; }
  .iah-title{ font-size:clamp(2.6rem,9vw,4.4rem); line-height:1.02; font-weight:500; margin:1.1rem 0 .2rem; letter-spacing:-0.01em; }
  .iah-sub{ font-style:italic; color:var(--color-muted-foreground); font-size:clamp(1.05rem,3vw,1.3rem); margin-top:.6rem; }
  .iah-cover-meta{ font-family:ui-monospace,monospace; font-size:11px; letter-spacing:.14em; color:color-mix(in oklab, var(--color-muted-foreground) 80%, transparent); margin-top:1.6rem; }
  .iah-dedication{ text-align:center; font-style:italic; color:var(--color-muted-foreground); font-size:1.02rem; line-height:1.9; max-width:30rem; margin:0 auto; border:0; }
  .iah-dedication span{ display:block; }
  .iah-toc-label{ text-align:center; margin-bottom:1.4rem; }
  .iah-toc-list{ list-style:none; padding:0; margin:0 0 2.5rem; }
  .iah-toc-item{ width:100%; display:flex; align-items:baseline; gap:.75rem; padding:.7rem .25rem; background:none; border:0; cursor:pointer; text-align:left; border-bottom:1px solid color-mix(in oklab, var(--color-border) 45%, transparent); transition:background .2s; }
  .iah-toc-item:hover{ background:color-mix(in oklab, ${ACCENT} 6%, transparent); }
  .iah-toc-num{ font-family:ui-monospace,monospace; font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; color:${ACCENT}; flex-shrink:0; width:5.5rem; }
  .iah-toc-title{ font-size:1.08rem; color:var(--color-foreground); }
  .iah-toc-dot{ flex:1; }
  .iah-begin{ display:flex; align-items:center; gap:.6rem; margin:0 auto; padding:.7rem 1.4rem; border-radius:9999px; font-family:ui-monospace,monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:${ACCENT}; background:color-mix(in oklab, ${ACCENT} 8%, transparent); border:1px solid color-mix(in oklab, ${ACCENT} 32%, transparent); cursor:pointer; transition:background .2s; }
  .iah-begin:hover{ background:color-mix(in oklab, ${ACCENT} 16%, transparent); }
  .iah-resume-note{ text-align:center; font-size:12px; color:var(--color-muted-foreground); margin-top:.8rem; font-style:italic; }
  .iah-ch-head{ text-align:center; margin:1rem 0 2.4rem; }
  .iah-ch-num{ font-family:ui-monospace,monospace; font-size:11px; letter-spacing:.34em; text-transform:uppercase; color:${ACCENT}; }
  .iah-ch-title{ font-size:clamp(1.7rem,5vw,2.5rem); line-height:1.12; font-weight:500; margin-top:.7rem; }
  .iah-p{ font-size:clamp(1.08rem,2.4vw,1.2rem); line-height:1.95; color:color-mix(in oklab, var(--color-foreground) 90%, transparent); margin:0 0 1.5rem; }
  .iah-drop::first-letter{ float:left; font-size:3.3em; line-height:.82; padding:.06em .09em 0 0; font-weight:600; color:${ACCENT}; font-family:'Newsreader',Georgia,serif; }
  .iah-em{ text-align:center; font-style:italic; font-size:clamp(1.2rem,3.2vw,1.55rem); line-height:1.6; color:var(--color-foreground); margin:2rem 0; }
  .iah-verse{ margin:2.4rem auto; padding:0; text-align:center; max-width:32rem; border:0; }
  .iah-verse-line{ display:block; font-style:italic; font-size:clamp(1.05rem,2.7vw,1.28rem); line-height:1.75; color:color-mix(in oklab, ${ACCENT} 78%, var(--color-foreground)); }
  .iah-break{ text-align:center; color:color-mix(in oklab, ${ACCENT} 55%, transparent); font-size:.9rem; letter-spacing:.5em; margin:2.2rem 0; user-select:none; }
  .iah-orn{ display:flex; align-items:center; justify-content:center; gap:1rem; margin:2.6rem 0; }
  .iah-orn-rule{ height:1px; width:3.5rem; background:color-mix(in oklab, ${ACCENT} 45%, transparent); }
  .iah-orn-mark{ color:${ACCENT}; font-size:1.1rem; opacity:.9; }
  .iah-nav{ display:flex; align-items:center; justify-content:space-between; gap:1rem; margin:3.5rem 0 1rem; padding-top:2rem; border-top:1px solid color-mix(in oklab, var(--color-border) 45%, transparent); }
  .iah-nav button{ display:inline-flex; align-items:center; gap:.5rem; padding:.6rem 1rem; border-radius:.7rem; background:color-mix(in oklab, var(--color-card) 60%, transparent); border:1px solid var(--color-border); color:var(--color-foreground); font-family:ui-monospace,monospace; font-size:11px; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; transition:border-color .2s; }
  .iah-nav button:hover{ border-color:color-mix(in oklab, ${ACCENT} 45%, transparent); }
  .iah-nav button:disabled{ opacity:.35; cursor:default; }
  .iah-nav-mid{ font-family:ui-monospace,monospace; font-size:11px; letter-spacing:.14em; color:var(--color-muted-foreground); }
  .iah-toc-btn{ display:block; margin:0 auto; margin-top:.5rem; background:none; border:0; color:var(--color-muted-foreground); font-family:ui-monospace,monospace; font-size:11px; letter-spacing:.1em; text-transform:uppercase; cursor:pointer; }
  .iah-toc-btn:hover{ color:${ACCENT}; }
  @media (prefers-reduced-motion: reduce){ .iah [style]{ opacity:1 !important; transform:none !important; } }
`

export function ItsAlwaysHerArticle() {
  const [book, setBook] = useState(null)
  const [index, setIndex] = useState(-1) // -1 = contents; 0..n = chapter
  const [saved, setSaved] = useState(0)
  const topRef = useRef(null)

  useEffect(() => {
    import('../lib/itsAlwaysHerBook').then((m) => setBook(m.BOOK || m.default))
    try {
      const s = parseInt(localStorage.getItem(STORE_KEY) || '0', 10)
      if (!Number.isNaN(s)) setSaved(s)
    } catch {}
  }, [])

  const scrollTop = useCallback(() => {
    requestAnimationFrame(() => {
      const sc = topRef.current && topRef.current.closest('.overflow-y-auto')
      if (sc) sc.scrollTo({ top: 0, behavior: 'auto' })
      else window.scrollTo({ top: 0 })
    })
  }, [])

  const openChapter = useCallback((i) => {
    setIndex(i)
    try { localStorage.setItem(STORE_KEY, String(i)) } catch {}
    scrollTop()
  }, [scrollTop])

  const toContents = useCallback(() => {
    setIndex(-1)
    scrollTop()
  }, [scrollTop])

  if (!book) {
    return (
      <div className="iah relative z-10" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p className="iah-cover-meta" style={{ animation: 'pulse 2s infinite' }}>opening the book…</p>
      </div>
    )
  }

  const { meta, chapters } = book
  const inChapter = index >= 0 && index < chapters.length

  return (
    <div className="iah relative z-10" ref={topRef}>
      <style>{CSS}</style>
      <div className="iah-wrap" style={{ paddingTop: '4.5rem', paddingBottom: '5rem' }}>
        {!inChapter ? (
          <Contents meta={meta} chapters={chapters} onOpen={openChapter} savedIndex={saved} />
        ) : (
          <>
            <Chapter ch={chapters[index]} />
            <div className="iah-nav">
              <button disabled={index === 0} onClick={() => index > 0 && openChapter(index - 1)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6" /></svg>
                Prev
              </button>
              <span className="iah-nav-mid">{index + 1} / {chapters.length}</span>
              <button disabled={index === chapters.length - 1} onClick={() => index < chapters.length - 1 && openChapter(index + 1)}>
                Next
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </div>
            <button className="iah-toc-btn" onClick={toContents}>☰ Contents</button>
          </>
        )}
      </div>
    </div>
  )
}

export default ItsAlwaysHerArticle
