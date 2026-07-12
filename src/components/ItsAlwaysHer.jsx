import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react'

const STORE_KEY = 'iah-reader-v3'
const GAP = 64            // column gap in px (the "gutter" between pages)
const FLIP_MS = 620       // page-turn duration

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

function Block({ b, drop }) {
  if (b.type === 'verse') {
    return (
      <blockquote className="rd-verse">
        {b.lines.map((l, i) => <span key={i} className="rd-verse-line">{inline(l)}</span>)}
      </blockquote>
    )
  }
  if (b.type === 'em') return <p className="rd-em">{inline(b.text)}</p>
  if (b.type === 'break') return <div className="rd-break" aria-hidden="true">✦</div>
  return <p className={`rd-p${drop ? ' rd-drop' : ''}`}>{inline(b.text)}</p>
}

function ChapterContent({ ch }) {
  let firstP = true
  return (
    <>
      <div className="rd-ch-head">
        <p className="rd-ch-num">{ch.label}</p>
        {ch.title ? <h2 className="rd-ch-title">{ch.title}</h2> : null}
      </div>
      {ch.blocks.map((b, i) => {
        const drop = b.type === 'p' && firstP
        if (drop) firstP = false
        return <Block key={i} b={b} drop={drop} />
      })}
      <div className="rd-ch-end">❦</div>
    </>
  )
}

// A single "leaf" — a page-width, clipped, translated column-strip.
function Leaf({ chapter, page, colW, side }) {
  const tx = -(page * (colW + GAP))
  return (
    <div className={`rd-area rd-area-${side}`}>
      <div
        className="rd-cols"
        style={{ columnWidth: colW ? `${colW}px` : 'auto', columnGap: `${GAP}px`, transform: `translateX(${tx}px)` }}
      >
        <ChapterContent ch={chapter} />
      </div>
    </div>
  )
}

export function ItsAlwaysHerArticle({ onBack }) {
  const [book, setBook] = useState(null)
  const [view, setView] = useState('cover')      // 'cover' | 'reading'
  const [ci, setCi] = useState(0)                // current chapter index
  const [page, setPage] = useState(0)            // current page in chapter
  const [pageCount, setPageCount] = useState(1)
  const [colW, setColW] = useState(0)
  const [fontScale, setFontScale] = useState(1)
  const [showSettings, setShowSettings] = useState(false)
  const [flip, setFlip] = useState(null)         // { dir, from:{ci,page}, to:{ci,page} } | null

  const areaRef = useRef(null)     // measuring area
  const measureColRef = useRef(null)

  // Load book + prefs
  useEffect(() => {
    import('../lib/itsAlwaysHerBook').then((m) => setBook(m.BOOK || m.default))
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
      if (s.fontScale) setFontScale(s.fontScale)
      if (typeof s.ci === 'number') setCi(s.ci)
      if (typeof s.page === 'number') setPage(s.page)
    } catch {}
  }, [])

  const persist = useCallback((patch) => {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
      localStorage.setItem(STORE_KEY, JSON.stringify({ ...s, ...patch }))
    } catch {}
  }, [])

  // Measure page count for the CURRENT chapter (hidden measuring layer).
  useLayoutEffect(() => {
    if (view !== 'reading' || !book) return
    const doMeasure = () => {
      const area = areaRef.current
      const col = measureColRef.current
      if (!area || !col) return
      const w = area.clientWidth
      if (w <= 0) return
      col.style.columnWidth = `${w}px`
      const total = Math.max(1, Math.round((col.scrollWidth + GAP) / (w + GAP)))
      setColW(w)
      setPageCount(total)
      setPage((p) => (p === 9999 ? total - 1 : Math.min(p, total - 1)))
    }
    doMeasure()
    const raf = requestAnimationFrame(doMeasure)
    const ro = new ResizeObserver(doMeasure)
    if (areaRef.current) ro.observe(areaRef.current)
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(doMeasure)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [view, book, ci, fontScale])

  const settle = useCallback((to) => {
    setCi(to.ci)
    setPage(to.page)
    persist({ ci: to.ci, page: to.page })
    setFlip(null)
  }, [persist])

  const go = useCallback((dir) => {
    if (!book || flip) return
    const chCount = book.chapters.length
    if (dir === 'fwd') {
      let to
      if (page < pageCount - 1) to = { ci, page: page + 1 }
      else if (ci < chCount - 1) to = { ci: ci + 1, page: 0 }
      else return
      setFlip({ dir: 'fwd', from: { ci, page }, to })
    } else {
      if (page > 0) setFlip({ dir: 'bwd', from: { ci, page }, to: { ci, page: page - 1 } })
      else if (ci > 0) { setCi(ci - 1); setPage(9999) } // prev-chapter boundary: jump (measure clamps)
      else return
    }
  }, [book, flip, page, pageCount, ci])

  // End the flip after the animation duration.
  useEffect(() => {
    if (!flip) return
    const id = setTimeout(() => settle(flip.to), FLIP_MS + 20)
    return () => clearTimeout(id)
  }, [flip, settle])

  // Keyboard
  useEffect(() => {
    if (view !== 'reading') return
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go('fwd') }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); go('bwd') }
      else if (e.key === 'Escape') { setShowSettings(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view, go])

  const openChapter = (i) => { setCi(i); setPage(0); persist({ ci: i, page: 0 }); setView('reading') }
  const setFont = (delta) => { const f = Math.min(1.4, Math.max(0.8, +(fontScale + delta).toFixed(2))); setFontScale(f); persist({ fontScale: f }) }

  if (!book) {
    return (
      <div className="fixed inset-0 z-[400] flex items-center justify-center" style={{ background: 'var(--color-background)', color: 'var(--color-muted-foreground)' }}>
        <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, letterSpacing: '.3em', textTransform: 'uppercase' }}>opening the book…</p>
      </div>
    )
  }

  const { meta, chapters } = book
  const chapter = chapters[ci]
  const overallProgress = chapters.length > 1 ? (ci + (pageCount > 1 ? page / (pageCount - 1) : 0)) / chapters.length : 0

  // Leaf states for the two stacked pages during a flip.
  const belowState = flip ? (flip.dir === 'fwd' ? flip.to : flip.from) : { ci, page }
  const aboveState = flip ? (flip.dir === 'fwd' ? flip.from : flip.to) : { ci, page }
  const aboveAnim = flip ? (flip.dir === 'fwd' ? 'rd-anim-fwd' : 'rd-anim-bwd') : ''

  return (
    <div className="rd-root" style={{ fontSize: `${fontScale}em` }}>
      <style>{CSS}</style>

      {view === 'cover' ? (
        <div className="rd-cover-scroll">
          <div className="rd-cover">
            <button className="rd-exit" onClick={onBack} title="Back to the blog" aria-label="Back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="rd-cover-inner">
              <p className="rd-kicker">A Novel</p>
              <h1 className="rd-title">{meta.title}</h1>
              <p className="rd-sub">{meta.subtitle}</p>
              <div className="rd-cover-rule"><span /><span className="rd-cover-mark">❦</span><span /></div>
              <blockquote className="rd-dedication">
                {meta.dedication.map((l, i) => <span key={i}>{l}</span>)}
              </blockquote>
              <p className="rd-author">{meta.author} · {meta.place}</p>

              <button className="rd-begin" onClick={() => setView('reading')}>
                {(ci > 0 || page > 0) ? `Resume — ${chapters[ci].label}` : 'Begin reading'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>

              <p className="rd-toc-label">Contents</p>
              <ul className="rd-toc">
                {chapters.map((c, i) => (
                  <li key={c.id}>
                    <button className="rd-toc-item" onClick={() => openChapter(i)}>
                      <span className="rd-toc-num">{c.label}</span>
                      <span className="rd-toc-title">{c.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="rd-reader">
          {/* top bar */}
          <div className="rd-bar rd-bar-top">
            <button className="rd-icon" onClick={() => setView('cover')} title="Cover & contents" aria-label="Contents">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <span className="rd-bar-title">{meta.title}</span>
            <button className="rd-icon" onClick={() => setShowSettings(s => !s)} title="Text size" aria-label="Text size">
              <span style={{ fontFamily: 'Newsreader,serif', fontWeight: 600 }}>A<span style={{ fontSize: '1.3em' }}>A</span></span>
            </button>
          </div>

          {showSettings && (
            <div className="rd-pop">
              <div className="rd-pop-row">
                <span className="rd-pop-label">Text size</span>
                <div className="rd-seg">
                  <button onClick={() => setFont(-0.1)} aria-label="Smaller">A−</button>
                  <button onClick={() => setFont(0.1)} aria-label="Larger" style={{ fontSize: '1.15em' }}>A+</button>
                </div>
              </div>
            </div>
          )}

          {/* page stage — the "book" */}
          <div className="rd-stage">
            <div className="rd-tap rd-tap-l" onClick={() => go('bwd')} aria-label="Previous page" />
            <div className="rd-tap rd-tap-r" onClick={() => go('fwd')} aria-label="Next page" />

            {/* hidden measuring layer (current chapter) */}
            <div className="rd-area rd-measure" ref={areaRef} aria-hidden="true">
              <div className="rd-cols" ref={measureColRef}><ChapterContent ch={chapter} /></div>
            </div>

            {/* the book: two stacked leaves */}
            <div className="rd-book">
              <div className="rd-leaf rd-leaf-below">
                <Leaf chapter={chapters[belowState.ci]} page={belowState.page} colW={colW} side="below" />
              </div>
              <div className={`rd-leaf rd-leaf-above ${aboveAnim}`}>
                <Leaf chapter={chapters[aboveState.ci]} page={aboveState.page} colW={colW} side="above" />
                <div className="rd-leaf-shade" aria-hidden="true" />
                <div className="rd-leaf-spine" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* bottom bar */}
          <div className="rd-bar rd-bar-bottom">
            <button className="rd-nav" onClick={() => go('bwd')} disabled={!!flip || (ci === 0 && page === 0)} aria-label="Previous">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="rd-status">
              <span className="rd-status-ch">{chapter.label}</span>
              <span className="rd-status-pg">Page {page + 1} of {pageCount}</span>
            </div>
            <button className="rd-nav" onClick={() => go('fwd')} disabled={!!flip || (ci === chapters.length - 1 && page >= pageCount - 1)} aria-label="Next">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <div className="rd-progress"><span style={{ width: `${overallProgress * 100}%` }} /></div>
        </div>
      )}
    </div>
  )
}

const CSS = `
  /* Reader inherits the SITE theme via CSS vars (light/dark aware). */
  .rd-root{ position:fixed; inset:0; z-index:400; background:var(--color-background); color:var(--color-foreground);
    font-family:'Newsreader',Georgia,serif; -webkit-font-smoothing:antialiased; --ink:var(--color-foreground);
    --soft:var(--color-muted-foreground); --rule:color-mix(in oklab, var(--color-border) 70%, transparent);
    --brand:var(--color-brand, var(--color-accent)); --sheet:color-mix(in oklab, var(--color-card) 55%, var(--color-background)); }

  /* Cover */
  .rd-cover-scroll{ position:absolute; inset:0; overflow-y:auto; }
  .rd-cover{ min-height:100%; display:flex; align-items:center; justify-content:center; padding:4rem 1.5rem; }
  .rd-exit{ position:fixed; top:1rem; left:1rem; width:38px; height:38px; border-radius:10px; display:flex;
    align-items:center; justify-content:center; background:transparent; border:1px solid var(--rule); color:var(--soft); cursor:pointer; }
  .rd-exit:hover{ color:var(--ink); }
  .rd-cover-inner{ max-width:34rem; width:100%; text-align:center; }
  .rd-kicker,.rd-toc-label{ font-family:ui-monospace,monospace; font-size:11px; letter-spacing:.36em; text-transform:uppercase; color:var(--brand); }
  .rd-title{ font-size:clamp(2.8rem,10vw,4.6rem); line-height:1.02; font-weight:500; margin:1rem 0 .3rem; letter-spacing:-.01em; }
  .rd-sub{ font-style:italic; color:var(--soft); font-size:clamp(1.05rem,3vw,1.3rem); }
  .rd-cover-rule{ display:flex; align-items:center; justify-content:center; gap:1rem; margin:2.2rem 0; }
  .rd-cover-rule span{ height:1px; width:3rem; background:color-mix(in oklab, var(--brand) 50%, transparent); }
  .rd-cover-mark{ background:none !important; height:auto !important; width:auto !important; color:var(--brand); }
  .rd-dedication{ font-style:italic; color:var(--soft); line-height:1.9; font-size:1.02rem; border:0; margin:0 0 1.6rem; }
  .rd-dedication span{ display:block; }
  .rd-author{ font-family:ui-monospace,monospace; font-size:11px; letter-spacing:.14em; color:var(--soft); margin-bottom:2.4rem; }
  .rd-begin{ display:inline-flex; align-items:center; gap:.6rem; padding:.75rem 1.6rem; border-radius:9999px;
    font-family:ui-monospace,monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase;
    color:var(--color-background); background:var(--brand); border:0; cursor:pointer; transition:opacity .2s; }
  .rd-begin:hover{ opacity:.88; }
  .rd-toc-label{ margin:3rem 0 1.2rem; }
  .rd-toc{ list-style:none; padding:0; margin:0; text-align:left; }
  .rd-toc-item{ width:100%; display:flex; align-items:baseline; gap:.85rem; padding:.72rem .3rem; background:none; border:0;
    border-bottom:1px solid var(--rule); cursor:pointer; text-align:left; transition:padding-left .15s; }
  .rd-toc-item:hover{ padding-left:.7rem; }
  .rd-toc-num{ font-family:ui-monospace,monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--brand); flex-shrink:0; width:5.2rem; }
  .rd-toc-title{ font-size:1.06rem; color:var(--ink); }

  /* Reader shell */
  .rd-reader{ position:absolute; inset:0; display:flex; flex-direction:column; }
  .rd-bar{ display:flex; align-items:center; justify-content:space-between; padding:.6rem 1rem; flex-shrink:0; z-index:5; }
  .rd-bar-top{ border-bottom:1px solid var(--rule); }
  .rd-bar-title{ font-size:13px; color:var(--soft); font-variant:small-caps; letter-spacing:.05em; }
  .rd-icon{ width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center;
    background:transparent; border:0; color:var(--soft); cursor:pointer; font-size:13px; }
  .rd-icon:hover{ color:var(--ink); }
  .rd-pop{ position:absolute; top:3.2rem; right:1rem; z-index:30; background:var(--color-card); border:1px solid var(--rule);
    border-radius:14px; padding:.9rem 1rem; box-shadow:0 18px 50px -12px rgba(0,0,0,.45); min-width:15rem; }
  .rd-pop-row{ display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.2rem 0; }
  .rd-pop-label{ font-size:12px; color:var(--soft); font-family:ui-monospace,monospace; letter-spacing:.1em; text-transform:uppercase; }
  .rd-seg{ display:flex; gap:.35rem; }
  .rd-seg button{ padding:.35rem .7rem; border-radius:8px; border:1px solid var(--rule); background:transparent; color:var(--ink);
    cursor:pointer; font-family:'Newsreader',serif; font-size:13px; line-height:1; }

  /* Stage + the book */
  .rd-stage{ position:relative; flex:1; min-height:0; perspective:2200px; }
  .rd-tap{ position:absolute; top:0; bottom:0; width:26%; z-index:20; cursor:pointer; }
  .rd-tap-l{ left:0; } .rd-tap-r{ right:0; }
  .rd-book{ position:absolute; inset:0; transform-style:preserve-3d; }
  .rd-leaf{ position:absolute; inset:0; background:var(--sheet); }
  .rd-leaf-below{ z-index:1; }
  .rd-leaf-above{ z-index:2; transform-origin:left center; backface-visibility:hidden; }
  .rd-leaf-shade{ position:absolute; inset:0; pointer-events:none; opacity:0;
    background:linear-gradient(90deg, rgba(0,0,0,.28) 0%, rgba(0,0,0,.05) 22%, transparent 55%); }
  .rd-leaf-spine{ position:absolute; top:0; bottom:0; left:0; width:26px; pointer-events:none;
    background:linear-gradient(90deg, color-mix(in oklab, var(--color-foreground) 12%, transparent), transparent); }

  .rd-anim-fwd{ animation:leafFwd ${FLIP_MS}ms cubic-bezier(.42,.02,.28,1) forwards; }
  .rd-anim-bwd{ animation:leafBwd ${FLIP_MS}ms cubic-bezier(.42,.02,.28,1) forwards; }
  .rd-anim-fwd .rd-leaf-shade{ animation:shadeFlip ${FLIP_MS}ms ease-in-out forwards; }
  .rd-anim-bwd .rd-leaf-shade{ animation:shadeFlip ${FLIP_MS}ms ease-in-out forwards; }
  @keyframes leafFwd{ from{ transform:rotateY(0deg); box-shadow:0 0 0 rgba(0,0,0,0); } to{ transform:rotateY(-180deg); box-shadow:-30px 0 60px -20px rgba(0,0,0,.5); } }
  @keyframes leafBwd{ from{ transform:rotateY(-180deg); box-shadow:-30px 0 60px -20px rgba(0,0,0,.5); } to{ transform:rotateY(0deg); box-shadow:0 0 0 rgba(0,0,0,0); } }
  @keyframes shadeFlip{ 0%{opacity:0} 45%{opacity:1} 100%{opacity:0} }

  /* Page content */
  .rd-area{ position:absolute; inset:0; padding:1.7rem clamp(1.2rem,5vw,3rem) 1.2rem; overflow:hidden; }
  .rd-measure{ visibility:hidden; z-index:0; }
  .rd-cols{ height:100%; column-fill:auto; max-width:38rem; margin:0 auto; }
  .rd-ch-head{ text-align:center; margin:0 0 2rem; break-inside:avoid; }
  .rd-ch-num{ font-family:ui-monospace,monospace; font-size:10.5px; letter-spacing:.34em; text-transform:uppercase; color:var(--brand); }
  .rd-ch-title{ font-size:clamp(1.5rem,4vw,2rem); line-height:1.14; font-weight:500; margin-top:.6rem; color:var(--ink); }
  .rd-p{ font-size:1.06rem; line-height:1.72; margin:0 0 1.05rem; text-align:justify; hyphens:auto; -webkit-hyphens:auto; color:var(--ink); }
  .rd-drop::first-letter{ float:left; font-size:3.1em; line-height:.8; padding:.05em .08em 0 0; font-weight:600; color:var(--brand); }
  .rd-em{ text-align:center; font-style:italic; font-size:1.25rem; line-height:1.55; margin:1.5rem 0; color:var(--ink); break-inside:avoid; }
  .rd-verse{ text-align:center; margin:1.8rem 0; padding:0; border:0; break-inside:avoid; }
  .rd-verse-line{ display:block; font-style:italic; font-size:1.08rem; line-height:1.7; color:color-mix(in oklab, var(--brand) 70%, var(--ink)); }
  .rd-break{ text-align:center; color:color-mix(in oklab, var(--brand) 55%, transparent); letter-spacing:.5em; margin:1.4rem 0; break-inside:avoid; }
  .rd-ch-end{ text-align:center; color:color-mix(in oklab, var(--brand) 45%, transparent); margin-top:1.4rem; break-inside:avoid; }

  .rd-bar-bottom{ border-top:1px solid var(--rule); }
  .rd-nav{ width:38px; height:38px; border-radius:9px; display:flex; align-items:center; justify-content:center;
    background:transparent; border:1px solid var(--rule); color:var(--ink); cursor:pointer; }
  .rd-nav:hover:not(:disabled){ border-color:var(--brand); }
  .rd-nav:disabled{ opacity:.3; cursor:default; }
  .rd-status{ text-align:center; line-height:1.3; }
  .rd-status-ch{ display:block; font-size:12px; color:var(--ink); }
  .rd-status-pg{ display:block; font-family:ui-monospace,monospace; font-size:10.5px; letter-spacing:.06em; color:var(--soft); }
  .rd-progress{ height:2px; background:transparent; flex-shrink:0; }
  .rd-progress span{ display:block; height:100%; background:var(--brand); transition:width .35s ease; }

  @media (prefers-reduced-motion: reduce){ .rd-anim-fwd,.rd-anim-bwd{ animation-duration:1ms; } }
`

export default ItsAlwaysHerArticle
