import React, { useEffect, useRef, useState, useCallback, useLayoutEffect } from 'react'

const STORE_KEY = 'iah-reader-v2'
const GAP = 64 // column gap in px (space between "pages")

// ── Reading themes (independent of site light/dark) ──────────────────────────
const THEMES = {
  light: { name: 'Paper', paper: '#faf8f3', ink: '#26221c', soft: '#8a8378', rule: 'rgba(0,0,0,.10)', accent: '#0969da' },
  sepia: { name: 'Sepia', paper: '#f2e7d0', ink: '#4a3b28', soft: '#9a866a', rule: 'rgba(90,60,30,.16)', accent: '#9a6a2f' },
  night: { name: 'Night', paper: '#14171d', ink: '#cfd4dd', soft: '#7c828d', rule: 'rgba(255,255,255,.10)', accent: '#6aa6ff' },
}

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

export function ItsAlwaysHerArticle({ onBack }) {
  const [book, setBook] = useState(null)
  const [view, setView] = useState('cover') // 'cover' | 'reading'
  const [ci, setCi] = useState(0)           // chapter index
  const [page, setPage] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [colW, setColW] = useState(0)
  const [fontScale, setFontScale] = useState(1)
  const [theme, setTheme] = useState('sepia')
  const [showSettings, setShowSettings] = useState(false)
  const [showToc, setShowToc] = useState(false)

  const areaRef = useRef(null)
  const colRef = useRef(null)

  // Load book + saved prefs
  useEffect(() => {
    import('../lib/itsAlwaysHerBook').then((m) => setBook(m.BOOK || m.default))
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
      if (s.theme && THEMES[s.theme]) setTheme(s.theme)
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

  const t = THEMES[theme]

  // Measure pages: set the column width to the page width imperatively, then
  // read scrollWidth so the count reflects the correct one-column-per-page layout.
  useLayoutEffect(() => {
    if (view !== 'reading' || !book) return
    const doMeasure = () => {
      const area = areaRef.current
      const col = colRef.current
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
  }, [view, book, ci, fontScale, theme])

  const clampGo = useCallback((nextCi, nextPage) => {
    setCi(nextCi)
    setPage(nextPage)
    persist({ ci: nextCi, page: nextPage })
  }, [persist])

  const nextPage = useCallback(() => {
    if (!book) return
    if (page < pageCount - 1) { const np = page + 1; setPage(np); persist({ ci, page: np }) }
    else if (ci < book.chapters.length - 1) { clampGo(ci + 1, 0) }
  }, [book, page, pageCount, ci, persist, clampGo])

  const prevPage = useCallback(() => {
    if (!book) return
    if (page > 0) { const np = page - 1; setPage(np); persist({ ci, page: np }) }
    else if (ci > 0) { setCi(ci - 1); setPage(9999) } // measure clamps to last page
  }, [book, page, ci, persist])

  // Keyboard navigation
  useEffect(() => {
    if (view !== 'reading') return
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); nextPage() }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); prevPage() }
      else if (e.key === 'Escape') { setShowSettings(false); setShowToc(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view, nextPage, prevPage])

  const openChapter = (i) => { clampGo(i, 0); setView('reading'); setShowToc(false) }
  const setFont = (delta) => { const f = Math.min(1.4, Math.max(0.8, +(fontScale + delta).toFixed(2))); setFontScale(f); persist({ fontScale: f }) }
  const setThemeAndSave = (k) => { setTheme(k); persist({ theme: k }) }

  if (!book) {
    return (
      <div className="fixed inset-0 z-[400] flex items-center justify-center" style={{ background: THEMES[theme].paper, color: THEMES[theme].soft }}>
        <p style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, letterSpacing: '.3em', textTransform: 'uppercase' }}>opening the book…</p>
      </div>
    )
  }

  const { meta, chapters } = book
  const ch = chapters[ci]
  const translate = -(page * (colW + GAP))
  const overallProgress = chapters.length > 1 ? (ci + (pageCount > 1 ? page / (pageCount - 1) : 0)) / chapters.length : 0

  return (
    <div className="rd-root" style={{ '--paper': t.paper, '--ink': t.ink, '--soft': t.soft, '--rule': t.rule, '--accent': t.accent, fontSize: `${fontScale}em` }}>
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

              <button className="rd-begin" onClick={() => { setView('reading') }}>
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
            <button className="rd-icon" onClick={() => { setShowSettings(s => !s); setShowToc(false) }} title="Display settings" aria-label="Settings">
              <span style={{ fontFamily: 'Newsreader,serif', fontWeight: 600 }}>A<span style={{ fontSize: '1.3em' }}>A</span></span>
            </button>
          </div>

          {/* settings popover */}
          {showSettings && (
            <div className="rd-pop">
              <div className="rd-pop-row">
                <span className="rd-pop-label">Font</span>
                <div className="rd-seg">
                  <button onClick={() => setFont(-0.1)} aria-label="Smaller">A−</button>
                  <button onClick={() => setFont(0.1)} aria-label="Larger" style={{ fontSize: '1.15em' }}>A+</button>
                </div>
              </div>
              <div className="rd-pop-row">
                <span className="rd-pop-label">Theme</span>
                <div className="rd-seg">
                  {Object.entries(THEMES).map(([k, v]) => (
                    <button key={k} onClick={() => setThemeAndSave(k)} className={theme === k ? 'is-on' : ''}
                      style={{ background: v.paper, color: v.ink }}>{v.name}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* page area */}
          <div className="rd-stage">
            <div className="rd-tap rd-tap-l" onClick={prevPage} aria-label="Previous page" />
            <div className="rd-tap rd-tap-r" onClick={nextPage} aria-label="Next page" />
            <div className="rd-area" ref={areaRef}>
              <div
                className="rd-cols"
                ref={colRef}
                style={{ columnWidth: colW ? `${colW}px` : 'auto', columnGap: `${GAP}px`, transform: `translateX(${translate}px)` }}
              >
                <ChapterContent ch={ch} />
              </div>
            </div>
          </div>

          {/* bottom bar */}
          <div className="rd-bar rd-bar-bottom">
            <button className="rd-nav" onClick={prevPage} disabled={ci === 0 && page === 0} aria-label="Previous">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="rd-status">
              <span className="rd-status-ch">{ch.label}</span>
              <span className="rd-status-pg">Page {page + 1} of {pageCount}</span>
            </div>
            <button className="rd-nav" onClick={nextPage} disabled={ci === chapters.length - 1 && page >= pageCount - 1} aria-label="Next">
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
  .rd-root{ position:fixed; inset:0; z-index:400; background:var(--paper); color:var(--ink);
    font-family:'Newsreader',Georgia,serif; -webkit-font-smoothing:antialiased; }

  /* Cover */
  .rd-cover-scroll{ position:absolute; inset:0; overflow-y:auto; }
  .rd-cover{ min-height:100%; display:flex; align-items:center; justify-content:center; padding:4rem 1.5rem; }
  .rd-exit{ position:fixed; top:1rem; left:1rem; width:38px; height:38px; border-radius:10px; display:flex;
    align-items:center; justify-content:center; background:transparent; border:1px solid var(--rule); color:var(--soft); cursor:pointer; }
  .rd-exit:hover{ color:var(--ink); }
  .rd-cover-inner{ max-width:34rem; width:100%; text-align:center; }
  .rd-kicker,.rd-toc-label{ font-family:ui-monospace,monospace; font-size:11px; letter-spacing:.36em; text-transform:uppercase; color:var(--accent); }
  .rd-title{ font-size:clamp(2.8rem,10vw,4.6rem); line-height:1.02; font-weight:500; margin:1rem 0 .3rem; letter-spacing:-.01em; color:var(--ink); }
  .rd-sub{ font-style:italic; color:var(--soft); font-size:clamp(1.05rem,3vw,1.3rem); }
  .rd-cover-rule{ display:flex; align-items:center; justify-content:center; gap:1rem; margin:2.2rem 0; }
  .rd-cover-rule span{ height:1px; width:3rem; background:color-mix(in oklab, var(--accent) 50%, transparent); }
  .rd-cover-mark{ background:none !important; height:auto !important; width:auto !important; color:var(--accent); }
  .rd-dedication{ font-style:italic; color:var(--soft); line-height:1.9; font-size:1.02rem; border:0; margin:0 0 1.6rem; }
  .rd-dedication span{ display:block; }
  .rd-author{ font-family:ui-monospace,monospace; font-size:11px; letter-spacing:.14em; color:var(--soft); margin-bottom:2.4rem; }
  .rd-begin{ display:inline-flex; align-items:center; gap:.6rem; padding:.75rem 1.6rem; border-radius:9999px;
    font-family:ui-monospace,monospace; font-size:12px; letter-spacing:.08em; text-transform:uppercase;
    color:var(--paper); background:var(--accent); border:0; cursor:pointer; transition:opacity .2s; }
  .rd-begin:hover{ opacity:.88; }
  .rd-toc-label{ margin:3rem 0 1.2rem; }
  .rd-toc{ list-style:none; padding:0; margin:0; text-align:left; }
  .rd-toc-item{ width:100%; display:flex; align-items:baseline; gap:.85rem; padding:.72rem .3rem; background:none; border:0;
    border-bottom:1px solid var(--rule); cursor:pointer; text-align:left; transition:padding-left .15s; }
  .rd-toc-item:hover{ padding-left:.7rem; }
  .rd-toc-num{ font-family:ui-monospace,monospace; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:var(--accent); flex-shrink:0; width:5.2rem; }
  .rd-toc-title{ font-size:1.06rem; color:var(--ink); }

  /* Reader */
  .rd-reader{ position:absolute; inset:0; display:flex; flex-direction:column; }
  .rd-bar{ display:flex; align-items:center; justify-content:space-between; padding:.6rem 1rem; flex-shrink:0; }
  .rd-bar-top{ border-bottom:1px solid var(--rule); }
  .rd-bar-title{ font-size:13px; color:var(--soft); font-variant:small-caps; letter-spacing:.05em; }
  .rd-icon{ width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center;
    background:transparent; border:0; color:var(--soft); cursor:pointer; font-size:13px; }
  .rd-icon:hover{ color:var(--ink); }

  .rd-pop{ position:absolute; top:3.2rem; right:1rem; z-index:30; background:var(--paper); border:1px solid var(--rule);
    border-radius:14px; padding:.9rem 1rem; box-shadow:0 18px 50px -12px rgba(0,0,0,.35); min-width:16rem; }
  .rd-pop-row{ display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:.4rem 0; }
  .rd-pop-label{ font-size:12px; color:var(--soft); font-family:ui-monospace,monospace; letter-spacing:.1em; text-transform:uppercase; }
  .rd-seg{ display:flex; gap:.35rem; }
  .rd-seg button{ padding:.35rem .7rem; border-radius:8px; border:1px solid var(--rule); background:transparent; color:var(--ink);
    cursor:pointer; font-family:'Newsreader',serif; font-size:13px; line-height:1; }
  .rd-seg button.is-on{ border-color:var(--accent); box-shadow:0 0 0 1px var(--accent) inset; }

  .rd-stage{ position:relative; flex:1; min-height:0; }
  .rd-area{ position:absolute; inset:0; padding:1.6rem clamp(1.2rem,5vw,3rem) 1rem; overflow:hidden; }
  .rd-cols{ height:100%; column-fill:auto; transition:transform .38s cubic-bezier(.4,0,.2,1); will-change:transform;
    max-width:38rem; margin:0 auto; }
  .rd-tap{ position:absolute; top:0; bottom:0; width:28%; z-index:10; cursor:pointer; }
  .rd-tap-l{ left:0; } .rd-tap-r{ right:0; }

  .rd-ch-head{ text-align:center; margin:0 0 2rem; break-inside:avoid; }
  .rd-ch-num{ font-family:ui-monospace,monospace; font-size:10.5px; letter-spacing:.34em; text-transform:uppercase; color:var(--accent); }
  .rd-ch-title{ font-size:clamp(1.5rem,4vw,2rem); line-height:1.14; font-weight:500; margin-top:.6rem; color:var(--ink); }
  .rd-p{ font-size:1.06rem; line-height:1.72; margin:0 0 1.05rem; text-align:justify; hyphens:auto;
    -webkit-hyphens:auto; color:var(--ink); }
  .rd-drop::first-letter{ float:left; font-size:3.1em; line-height:.8; padding:.05em .08em 0 0; font-weight:600; color:var(--accent); }
  .rd-em{ text-align:center; font-style:italic; font-size:1.25rem; line-height:1.55; margin:1.5rem 0; color:var(--ink); break-inside:avoid; }
  .rd-verse{ text-align:center; margin:1.8rem 0; padding:0; border:0; break-inside:avoid; }
  .rd-verse-line{ display:block; font-style:italic; font-size:1.08rem; line-height:1.7; color:color-mix(in oklab, var(--accent) 70%, var(--ink)); }
  .rd-break{ text-align:center; color:color-mix(in oklab, var(--accent) 55%, transparent); letter-spacing:.5em; margin:1.4rem 0; break-inside:avoid; }
  .rd-ch-end{ text-align:center; color:color-mix(in oklab, var(--accent) 45%, transparent); margin-top:1.4rem; break-inside:avoid; }

  .rd-bar-bottom{ border-top:1px solid var(--rule); }
  .rd-nav{ width:38px; height:38px; border-radius:9px; display:flex; align-items:center; justify-content:center;
    background:transparent; border:1px solid var(--rule); color:var(--ink); cursor:pointer; }
  .rd-nav:hover:not(:disabled){ border-color:var(--accent); }
  .rd-nav:disabled{ opacity:.3; cursor:default; }
  .rd-status{ text-align:center; line-height:1.3; }
  .rd-status-ch{ display:block; font-size:12px; color:var(--ink); }
  .rd-status-pg{ display:block; font-family:ui-monospace,monospace; font-size:10.5px; letter-spacing:.06em; color:var(--soft); }
  .rd-progress{ height:2px; background:transparent; flex-shrink:0; }
  .rd-progress span{ display:block; height:100%; background:var(--accent); transition:width .35s ease; }

  @media (prefers-reduced-motion: reduce){ .rd-cols{ transition:none; } }
`

export default ItsAlwaysHerArticle
