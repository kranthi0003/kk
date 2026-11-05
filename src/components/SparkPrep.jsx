import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { DATABRICKS_PAYLOAD as PAYLOAD } from '../lib/databricksPayload'

const enc = new TextEncoder()
const dec = new TextDecoder()
const b64 = (value) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
const PROGRESS_KEY = 'databricks_prep_progress_v1'

async function unlock(passphrase) {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64(PAYLOAD.salt), iterations: PAYLOAD.iter || 200000, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(PAYLOAD.iv) }, key, b64(PAYLOAD.ct))
  return JSON.parse(dec.decode(plaintext))
}

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null')
    return saved && typeof saved === 'object' && saved.done && typeof saved.done === 'object' ? saved.done : {}
  } catch {
    return {}
  }
}

function diagramLines(text, limit) {
  const lines = ['']
  for (const word of text.split(' ')) {
    const last = lines.length - 1
    if (lines[last] && lines[last].length + word.length + 1 > limit) lines.push(word)
    else lines[last] += `${lines[last] ? ' ' : ''}${word}`
  }
  return lines
}

function Diagram({ diagram }) {
  const nodes = diagram?.nodes || []
  const uid = useId().replace(/:/g, '')
  const height = diagram?.height || Math.max(130, nodes.length * 96 + 18)
  const positions = nodes.map((node, index) => ({
    x: node.x ?? 22,
    y: node.y ?? 9 + index * 96,
    width: node.width ?? 316,
    height: node.height ?? 66,
  }))
  const edges = diagram?.edges || nodes.slice(0, -1).map((_, index) => [index, index + 1])
  return (
    <figure className="dbp-diagram">
      <figcaption>{diagram.title}</figcaption>
      <svg viewBox={`0 0 360 ${height}`} role="img" aria-label={diagram.title} className="dbp-svg">
        <title>{diagram.title}</title>
        <defs>
          <marker id={`${uid}-arrow`} markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M0 0L8 4L0 8" fill="none" stroke="var(--dbp-chapter-accent)" strokeWidth="1.5" />
          </marker>
          <linearGradient id={`${uid}-node`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#fffefd" />
            <stop offset="1" stopColor="var(--dbp-chapter-tint)" />
          </linearGradient>
        </defs>
        {edges.map(([from, to], index) => {
          const source = positions[from]
          const target = positions[to]
          const dx = target.x + target.width / 2 - (source.x + source.width / 2)
          const dy = target.y + target.height / 2 - (source.y + source.height / 2)
          const horizontal = Math.abs(dx) > Math.abs(dy)
          const x1 = horizontal ? source.x + source.width / 2 + Math.sign(dx) * source.width / 2 : source.x + source.width / 2
          const y1 = horizontal ? source.y + source.height / 2 : source.y + source.height
          const x2 = horizontal ? target.x + target.width / 2 - Math.sign(dx) * target.width / 2 : target.x + target.width / 2
          const y2 = horizontal ? target.y + target.height / 2 : target.y
          return <line key={`edge-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--dbp-chapter-accent)" strokeWidth="2" markerEnd={`url(#${uid}-arrow)`} />
        })}
        {nodes.map((node, index) => {
          const { x, y, width, height: nodeHeight } = positions[index]
          const narrow = width < 200
          const lines = diagramLines(node.detail, narrow ? 22 : 46)
          return (
            <g key={`${node.title}-${index}`}>
              <rect x={x} y={y} width={width} height={nodeHeight} rx="13" fill={`url(#${uid}-node)`} stroke="var(--dbp-diagram-line)" />
              <text x={x + 14} y={y + 24} fill="var(--dbp-text)" fontSize={narrow ? 13 : 15} fontWeight="700">{node.title}</text>
              <text fill="var(--dbp-muted)" fontSize="11.5">
                {lines.map((line, lineIndex) => <tspan key={lineIndex} x={x + 14} y={y + 42 + lineIndex * 13}>{line}</tspan>)}
              </text>
            </g>
          )
        })}
      </svg>
    </figure>
  )
}

function Chapter({ chapter }) {
  return (
    <article className="dbp-chapter" id={`dbp-${chapter.id}`}>
      <p className="dbp-eyebrow">{chapter.label}</p>
      <h2>{chapter.title}</h2>
      <p className="dbp-lead">{chapter.lead}</p>
      {chapter.diagram && <Diagram diagram={chapter.diagram} />}
      {(chapter.sections || []).map((section) => (
        <section className="dbp-section" key={section.title}>
          <h3>{section.title}</h3>
          <p>{section.body}</p>
          {section.bullets?.length > 0 && (
            <ul className="dbp-bullets">
              {section.bullets.map((item) => (
                <li key={item.term}><strong>{item.term}</strong><span>{item.text}</span></li>
              ))}
            </ul>
          )}
          {section.callout && <p className="dbp-callout">{section.callout}</p>}
        </section>
      ))}
    </article>
  )
}

function MemoryLab({ lab }) {
  const [demand, setDemand] = useState(34)
  const state = demand < 58 ? 0 : demand < 84 ? 1 : 2
  return (
    <section className="dbp-lab">
      <h3>{lab.title}</h3>
      <p>{lab.description}</p>
      <label className="dbp-range">
        <span>{lab.labels[0]}</span>
        <input aria-label={lab.description} type="range" min="0" max="100" value={demand} onChange={(event) => setDemand(Number(event.target.value))} />
        <span>{lab.labels[2]}</span>
      </label>
      <div className={`dbp-status dbp-status-${state}`} role="status">{lab.explanations[state]}</div>
    </section>
  )
}

function JoinLab({ lab }) {
  const [selected, setSelected] = useState(0)
  return (
    <section className="dbp-lab">
      <h3>{lab.title}</h3>
      <p>{lab.description}</p>
      <div className="dbp-choice-row" role="group" aria-label={lab.title}>
        {lab.options.map((option, index) => (
          <button type="button" className={selected === index ? 'dbp-choice is-active' : 'dbp-choice'} key={option.label} onClick={() => setSelected(index)} aria-pressed={selected === index}>
            {option.label}
          </button>
        ))}
      </div>
      <p className="dbp-lab-answer" aria-live="polite">{lab.options[selected].detail}</p>
    </section>
  )
}

function DeltaLab({ lab }) {
  const [index, setIndex] = useState(0)
  const version = lab.versions[index]
  return (
    <section className="dbp-lab">
      <h3>{lab.title}</h3>
      <p>{lab.description}</p>
      <div className="dbp-version">
        <span>{version.label}</span>
        <p aria-live="polite">{version.detail}</p>
      </div>
      <div className="dbp-controls">
        <button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>Previous</button>
        <span>{index + 1} / {lab.versions.length}</span>
        <button type="button" onClick={() => setIndex((value) => Math.min(lab.versions.length - 1, value + 1))} disabled={index === lab.versions.length - 1}>Next</button>
      </div>
    </section>
  )
}

function PipelineLab({ lab }) {
  const [selected, setSelected] = useState(1)
  const option = lab.options[selected]
  return (
    <section className="dbp-lab">
      <h3>{lab.title}</h3>
      <p>{lab.description}</p>
      <div className="dbp-choice-row" role="group" aria-label={lab.title}>
        {lab.options.map((item, index) => (
          <button type="button" className={selected === index ? 'dbp-choice is-active' : 'dbp-choice'} key={item.label} onClick={() => setSelected(index)} aria-pressed={selected === index}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="dbp-pipeline" aria-label={`${option.label} flow`}>
        {option.steps.map((step, index) => <React.Fragment key={step}><span>{step}</span>{index < option.steps.length - 1 && <b aria-hidden="true">→</b>}</React.Fragment>)}
      </div>
      <p className="dbp-lab-answer" aria-live="polite">{option.detail}</p>
    </section>
  )
}

function SkewLab({ lab }) {
  const [skewed, setSkewed] = useState(true)
  const values = skewed ? lab.skewed : lab.balanced
  return (
    <section className="dbp-lab">
      <h3>{lab.title}</h3>
      <p>{lab.description}</p>
      <button type="button" className="dbp-toggle" aria-pressed={skewed} onClick={() => setSkewed((value) => !value)}>
        {skewed ? 'Show balanced tasks' : 'Show skewed task'}
      </button>
      <div className="dbp-bars" aria-label={skewed ? 'Skewed partition sizes' : 'Balanced partition sizes'}>
        {values.map((value, index) => <div className="dbp-bar-wrap" key={`${value}-${index}`}><span style={{ height: `${Math.max(14, parseInt(value, 10) / 146 * 100)}%` }} /><small>{value}</small></div>)}
      </div>
      <p className="dbp-lab-answer" aria-live="polite">{skewed ? lab.skewedNote : lab.balancedNote}</p>
    </section>
  )
}

function Labs({ labs }) {
  return (
    <section className="dbp-extra" id="dbp-labs">
      <p className="dbp-eyebrow">INTERACTIVE WORKBENCH</p>
      <h2>Make the ideas visible</h2>
      <p className="dbp-lead">Try each model, then explain what it simplifies and what you would verify in a real Spark or Databricks run.</p>
      <div className="dbp-labs-grid">
        <MemoryLab lab={labs.memory} />
        <JoinLab lab={labs.joins} />
        <SkewLab lab={labs.skew} />
        <DeltaLab lab={labs.delta} />
        <PipelineLab lab={labs.pipeline} />
      </div>
    </section>
  )
}

function StudyPlan({ items, done, onToggle }) {
  const complete = items.filter((item) => done[item.id]).length
  return (
    <section className="dbp-extra" id="dbp-plan">
      <p className="dbp-eyebrow">SIX CONVERSATIONS</p>
      <h2>A focused study plan</h2>
      <p className="dbp-lead">{complete} of {items.length} sessions complete. Take one idea at a time; the checkmarks stay on this device.</p>
      <div className="dbp-plan">
        {items.map((item, index) => (
          <label className={done[item.id] ? 'dbp-plan-row is-done' : 'dbp-plan-row'} key={item.id}>
            <input type="checkbox" checked={!!done[item.id]} onChange={() => onToggle(item.id)} />
            <span className="dbp-plan-n">{String(index + 1).padStart(2, '0')}</span>
            <span><strong>{item.title}</strong><small>{item.detail}</small></span>
          </label>
        ))}
      </div>
    </section>
  )
}

function Questions({ questions }) {
  return (
    <section className="dbp-extra" id="dbp-questions">
      <p className="dbp-eyebrow">INTERVIEW PRACTICE</p>
      <h2>Questions worth rehearsing</h2>
      <p className="dbp-lead">Answer aloud first. Open a prompt to compare your reasoning, then handle the follow-up without memorising a script.</p>
      <div className="dbp-questions">
        {questions.map((item, index) => (
          <details key={item.q}>
            <summary><span>{String(index + 1).padStart(2, '0')}</span>{item.q}</summary>
            <div><p>{item.a}</p><p><strong>Follow-up:</strong> {item.follow}</p></div>
          </details>
        ))}
      </div>
    </section>
  )
}

function Resources({ items }) {
  return (
    <section className="dbp-extra dbp-resources" id="dbp-resources">
      <p className="dbp-eyebrow">PRIMARY SOURCES</p>
      <h2>Go to the docs</h2>
      <p className="dbp-lead">Defaults and managed-platform features change. Use these official references to check version-specific behavior.</p>
      <div>{items.map((item) => <a href={item.url} key={item.url} target="_blank" rel="noopener noreferrer">{item.title}<span aria-hidden="true">↗</span></a>)}</div>
    </section>
  )
}

function Gate({ onBack, onUnlock }) {
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const submit = async (event) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    let data
    try {
      data = await unlock(password)
    } catch (reason) {
      setError(reason?.name === 'OperationError'
        ? "That password didn't match. Try again."
        : "This page couldn't be opened. Please reload and try again in a current browser.")
      setBusy(false)
      inputRef.current?.focus()
      inputRef.current?.select()
      return
    }
    setPassword('')
    setBusy(false)
    onUnlock(data)
  }

  return (
    <main className="dbp-root dbp-locked">
      <style>{CSS}</style>
      <div className="dbp-lock-card">
        <div className="dbp-gate-mark" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="7" width="23" height="28" rx="4" />
            <path d="M15 7v28M21 15h6M21 21h6M5 11h7M5 19h7M5 27h7M32 2v5M29.5 4.5h5" />
          </svg>
        </div>
        <p className="dbp-eyebrow">A LITTLE FOCUS. A LITTLE CONFIDENCE.</p>
        <h1>Your study corner</h1>
        <p>Something good is waiting inside.<br />Enter your password to begin.</p>
        <form className="dbp-gate-form" onSubmit={submit}>
          <label htmlFor="dbp-password">Password</label>
          <div className="dbp-password-field">
            <input id="dbp-password" ref={inputRef} type={show ? 'text' : 'password'}
              autoComplete="current-password" autoCapitalize="off" autoCorrect="off" spellCheck={false}
              value={password} onChange={(event) => { setPassword(event.target.value); setError('') }}
              required readOnly={busy} aria-invalid={!!error} aria-describedby={error ? 'dbp-gate-error' : undefined} />
            <button type="button" disabled={busy} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}
              onClick={() => { setShow((value) => !value); inputRef.current?.focus() }}>{show ? 'Hide' : 'Show'}</button>
          </div>
          <button type="submit" className="dbp-primary" disabled={busy}>{busy ? 'Opening…' : 'Open study guide'}</button>
          <div className="dbp-gate-error" id="dbp-gate-error" role="alert">{error}</div>
        </form>
        <small className="dbp-gate-note">Encrypted content. Your password stays in this browser.</small>
        <button type="button" className="dbp-back" onClick={onBack}>Back to site</button>
      </div>
    </main>
  )
}

export default function SparkPrep({ onBack }) {
  const [content, setContent] = useState(null)
  const [done, setDone] = useState(loadProgress)
  const headingRef = useRef(null)
  const chapters = content?.chapters || []
  const nav = useMemo(() => [...chapters.map(({ id, label }) => ({ id: `dbp-${id}`, label })), { id: 'dbp-labs', label: 'Labs' }, { id: 'dbp-plan', label: 'Plan' }, { id: 'dbp-questions', label: 'Questions' }], [chapters])
  const completed = content?.studyPlan.filter((item) => done[item.id]).length || 0

  useEffect(() => {
    const normalize = () => {
      if (/^#\/databricks(\/|$)/i.test(window.location.hash) && window.location.hash !== '#/databricks') {
        window.history.replaceState(window.history.state, '', '#/databricks')
      }
    }
    normalize()
    window.addEventListener('hashchange', normalize)
    return () => window.removeEventListener('hashchange', normalize)
  }, [])

  useEffect(() => {
    if (content) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      headingRef.current?.focus({ preventScroll: true })
    }
  }, [content])

  useEffect(() => {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify({ done })) } catch {}
  }, [done])

  const toggle = (id) => setDone((current) => ({ ...current, [id]: !current[id] }))
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })

  if (!content) return <Gate onBack={onBack} onUnlock={setContent} />

  return (
    <main className="dbp-root">
      <style>{CSS}</style>
      <header className="dbp-top">
        <button type="button" className="dbp-back" onClick={onBack}><span aria-hidden="true">←</span> Back to site</button>
        <div className="dbp-top-actions">
          <span className="dbp-top-note">A study space</span>
          <button type="button" className="dbp-lock-action" onClick={() => setContent(null)}>Lock page</button>
        </div>
      </header>
      <div className="dbp-wrap">
        <header className="dbp-hero">
          <div className="dbp-hero-copy">
            <p className="dbp-eyebrow">{content.meta.kicker}</p>
            <h1 ref={headingRef} tabIndex={-1}>{content.meta.title}</h1>
            <p className="dbp-subtitle">{content.meta.subtitle}</p>
            <p className="dbp-hero-note">{content.meta.note}</p>
            <div className="dbp-hero-actions">
              <button type="button" className="dbp-primary" onClick={() => jump(`dbp-${chapters[0].id}`)}>{content.meta.startLabel}<span aria-hidden="true">↗</span></button>
              <button type="button" className="dbp-secondary" onClick={() => jump('dbp-labs')}>{content.meta.labLabel}</button>
            </div>
          </div>
          <aside className="dbp-progress-card">
            <p className="dbp-eyebrow">{content.meta.progressLabel}</p>
            <div className="dbp-progress-ring" style={{ '--dbp-progress': `${completed / content.studyPlan.length * 360}deg` }}
              role="progressbar" aria-label={content.meta.progressUnit} aria-valuemin={0} aria-valuemax={content.studyPlan.length} aria-valuenow={completed}>
              <span>{completed}<small>/ {content.studyPlan.length}</small></span>
            </div>
            <h2>{completed === content.studyPlan.length ? content.meta.progressComplete : content.meta.progressTitle}</h2>
            <p>{content.meta.progressNote}</p>
            <button type="button" className="dbp-secondary" onClick={() => jump('dbp-plan')}>{content.meta.planLabel}<span aria-hidden="true">→</span></button>
          </aside>
        </header>
        <nav className="dbp-nav" aria-label="Study sections">
          {nav.map((item) => <button type="button" key={item.id} onClick={() => jump(item.id)}>{item.label}</button>)}
        </nav>
        <div className="dbp-reading">
          {chapters.map((chapter) => <Chapter key={chapter.id} chapter={chapter} />)}
          <Labs labs={content.labs} />
          <StudyPlan items={content.studyPlan} done={done} onToggle={toggle} />
          <Questions questions={content.questions} />
          <Resources items={content.resources} />
        </div>
      </div>
      <footer className="dbp-footer">Learn the mechanism. Explain the trade-off. Verify with evidence.</footer>
    </main>
  )
}

const CSS = `
body:has(.dbp-root) { background: #fff8f4 !important; background-image: none !important; }
.dbp-root {
  --dbp-bg: #fff8f4; --dbp-card: #fffefd; --dbp-line: #e4d8e6;
  --dbp-text: #30243d; --dbp-muted: #65596e; --dbp-soft: #53465e; --dbp-accent: #7050a6;
  --dbp-chapter-accent: #7050a6; --dbp-chapter-tint: #f1eafb; --dbp-diagram-line: #bba8cf;
  min-height: 100vh; color: var(--dbp-text); color-scheme: light;
  background: radial-gradient(ellipse 75% 650px at 5% 0%, #fde2d5 0%, transparent 75%), radial-gradient(ellipse 65% 620px at 100% 80px, #e9e1fa 0%, transparent 76%), var(--dbp-bg);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.dbp-root *, .dbp-root *::before, .dbp-root *::after { box-sizing: border-box; }
.dbp-root :focus-visible { outline: 3px solid var(--dbp-accent); outline-offset: 3px; border-radius: 6px; }
.dbp-root button, .dbp-root input { font: inherit; }
.dbp-top { min-height:70px; padding:8px clamp(18px, 5vw, 72px); display:flex; align-items:center; justify-content:space-between; gap:16px; border-bottom:1px solid rgba(112,80,166,.14); }
.dbp-back { display:inline-flex; align-items:center; min-height:44px; gap:9px; color:var(--dbp-soft); background:transparent; border:0; cursor:pointer; padding:9px 0; font-size:13px; }
.dbp-back:hover { color:var(--dbp-accent); }
.dbp-back span { color:var(--dbp-accent); font-size:18px; }
.dbp-top-actions { display:flex; align-items:center; gap:18px; }
.dbp-top-note { color:var(--dbp-muted); font:11px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.12em; text-transform:uppercase; }
.dbp-lock-action { min-height:44px; border:1px solid #cbbad9; background:rgba(255,255,255,.7); color:var(--dbp-accent); padding:7px 13px; border-radius:999px; cursor:pointer; font-size:12px; }
.dbp-wrap { width:min(100% - 48px, 1100px); margin:0 auto; }
.dbp-hero { padding:clamp(48px, 7vw, 90px) 0 46px; display:grid; grid-template-columns:minmax(0,1.8fr) minmax(240px,1fr); align-items:center; gap:clamp(24px, 5vw, 68px); }
.dbp-eyebrow { color:var(--dbp-chapter-accent); font:650 11px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.12em; text-transform:uppercase; margin:0 0 17px; }
.dbp-hero h1 { margin:0; font-size:clamp(44px, 6.4vw, 78px); line-height:1.02; letter-spacing:-.055em; font-weight:650; outline:none; }
.dbp-subtitle { max-width:650px; color:var(--dbp-soft); font-size:clamp(18px, 2.1vw, 22px); line-height:1.55; margin:23px 0 0; }
.dbp-hero-note { max-width:590px; margin:17px 0 0; color:var(--dbp-muted); font-size:15px; line-height:1.8; }
.dbp-hero-actions { display:flex; flex-wrap:wrap; gap:10px; margin-top:24px; }
.dbp-primary, .dbp-secondary { display:inline-flex; align-items:center; justify-content:center; gap:14px; min-height:46px; border-radius:12px; padding:11px 17px; cursor:pointer; font-size:13px; font-weight:650; transition:transform .16s, box-shadow .16s; }
.dbp-primary { background:var(--dbp-accent); border:1px solid var(--dbp-accent); color:#fff; box-shadow:0 5px 15px rgba(112,80,166,.14); }
.dbp-secondary { border:1px solid #cbbad9; background:rgba(255,255,255,.82); color:var(--dbp-accent); }
.dbp-primary:hover:not(:disabled), .dbp-secondary:hover { transform:translateY(-2px); box-shadow:0 7px 18px rgba(112,80,166,.14); }
.dbp-primary:disabled { cursor:wait; opacity:.65; }
.dbp-progress-card { position:relative; padding:28px 23px; text-align:center; border:1px solid #d6c6e7; border-radius:26px; background:linear-gradient(145deg,#fcf8ff,#ede4f9); box-shadow:0 14px 35px rgba(83,51,114,.07); }
.dbp-progress-card::before { content:""; position:absolute; width:24px; height:24px; top:-11px; right:22px; background:#ffd5b5; border:1px solid #e1b095; border-radius:8px; transform:rotate(15deg); }
.dbp-progress-ring { width:104px; height:104px; padding:8px; display:grid; place-items:center; border-radius:50%; margin:0 auto 20px; background:conic-gradient(var(--dbp-accent) var(--dbp-progress), #dfd1ef 0); }
.dbp-progress-ring > span { display:flex; align-items:baseline; justify-content:center; gap:5px; width:100%; height:100%; padding-top:19px; border-radius:50%; background:#fcf8ff; font-size:34px; font-weight:650; color:var(--dbp-text); }
.dbp-progress-ring small { color:var(--dbp-muted); font-size:13px; font-weight:500; }
.dbp-progress-card h2 { font-size:27px; line-height:1.2; letter-spacing:-.035em; margin:0; }
.dbp-progress-card > p:not(.dbp-eyebrow) { color:var(--dbp-muted); font-size:13px; line-height:1.65; margin:12px 0 17px; }
.dbp-progress-card .dbp-secondary { font-size:12px; width:100%; }
.dbp-nav { position:sticky; top:0; z-index:5; display:flex; gap:8px; overflow-x:auto; padding:12px 0; background:rgba(255,248,244,.96); backdrop-filter:blur(12px); border-bottom:1px solid var(--dbp-line); scrollbar-width:thin; scrollbar-color:#c3b0d7 transparent; }
.dbp-nav button { flex:0 0 auto; min-height:44px; background:#f0e7fb; color:#644691; border:1px solid #dacbeb; border-radius:999px; padding:9px 14px; font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap; }
.dbp-nav button:nth-child(4n+1) { background:#ffeadf; color:#84473c; border-color:#eed0bd; }
.dbp-nav button:nth-child(4n+3) { background:#e5f3ed; color:#29685c; border-color:#bcdacf; }
.dbp-nav button:nth-child(4n+4) { background:#f9e6ef; color:#8d4767; border-color:#e8c7d7; }
.dbp-nav button:hover { border-color:currentColor; }
.dbp-reading { padding-bottom:40px; }
.dbp-chapter, .dbp-extra { scroll-margin-top:86px; padding:clamp(24px, 4vw, 44px); margin:28px 0; border:1px solid var(--dbp-line); border-radius:25px; background:var(--dbp-card); box-shadow:0 7px 25px rgba(83,51,114,.035); }
.dbp-chapter:nth-of-type(4n+1) { --dbp-chapter-accent:#8a483b; --dbp-chapter-tint:#fff0e7; --dbp-diagram-line:#d9b29f; }
.dbp-chapter:nth-of-type(4n+3) { --dbp-chapter-accent:#28695d; --dbp-chapter-tint:#eaf6ef; --dbp-diagram-line:#a4c9ba; }
.dbp-chapter:nth-of-type(4n+4) { --dbp-chapter-accent:#8c4566; --dbp-chapter-tint:#fbeaf1; --dbp-diagram-line:#d4acc0; }
.dbp-chapter > .dbp-eyebrow, .dbp-extra > .dbp-eyebrow { display:inline-block; padding:8px 11px; border-radius:8px; background:var(--dbp-chapter-tint); }
.dbp-chapter h2, .dbp-extra h2 { margin:0; max-width:800px; font-size:clamp(29px, 4vw, 44px); line-height:1.15; letter-spacing:-.04em; font-weight:620; }
.dbp-lead { max-width:800px; color:var(--dbp-soft); font-size:17px; line-height:1.8; margin:18px 0 0; }
.dbp-diagram { margin:30px 0 37px; padding:22px clamp(12px, 3vw, 28px) 18px; background:linear-gradient(145deg,var(--dbp-chapter-tint),#fffcfa); border:1px solid var(--dbp-line); border-radius:18px; }
.dbp-diagram figcaption { margin:0 0 16px; color:var(--dbp-chapter-accent); font-size:11px; font-weight:650; letter-spacing:.06em; text-transform:uppercase; }
.dbp-svg { display:block; width:min(100%, 460px); height:auto; margin:0 auto; overflow:visible; }
.dbp-section { max-width:900px; margin:34px 0 0; }
.dbp-section h3, .dbp-lab h3 { margin:0 0 12px; font-size:21px; line-height:1.3; letter-spacing:-.025em; }
.dbp-section > p, .dbp-lab > p { color:var(--dbp-soft); font-size:16px; line-height:1.85; margin:0; }
.dbp-bullets { display:grid; gap:10px; list-style:none; margin:18px 0 0; padding:0; }
.dbp-bullets li { display:grid; grid-template-columns:minmax(135px, .75fr) 2fr; gap:18px; padding:16px 18px; background:#fdf9f7; border:1px solid #ece1e6; border-radius:13px; }
.dbp-bullets strong { color:var(--dbp-chapter-accent); font-size:14px; line-height:1.65; }
.dbp-bullets span { color:var(--dbp-soft); font-size:14px; line-height:1.8; }
.dbp-callout { margin:20px 0 0 !important; padding:17px 20px; border-left:3px solid var(--dbp-chapter-accent); background:var(--dbp-chapter-tint); border-radius:0 12px 12px 0; color:var(--dbp-text) !important; }
.dbp-labs-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin-top:28px; }
.dbp-lab { min-width:0; padding:23px; border:1px solid var(--dbp-line); border-radius:17px; background:linear-gradient(145deg,#f9f4ff,#fffaf7); }
.dbp-lab:nth-child(2n) { background:linear-gradient(145deg,#fff1e8,#fffaf7); }
.dbp-lab:nth-child(3n) { background:linear-gradient(145deg,#edf7ef,#fffdf8); }
.dbp-lab > p { font-size:14px; margin-bottom:17px; }
.dbp-range { display:flex; align-items:center; gap:10px; color:var(--dbp-muted); font-size:11px; }
.dbp-range input { min-width:55px; min-height:44px; flex:1; accent-color:var(--dbp-accent); }
.dbp-status { min-height:75px; margin-top:17px; padding:14px; border:1px solid var(--dbp-line); border-radius:11px; color:var(--dbp-soft); font-size:14px; line-height:1.7; }
.dbp-status-0 { border-color:#99c9b0; background:#edf8f1; }
.dbp-status-1 { border-color:#d5b375; background:#fff4dc; }
.dbp-status-2 { border-color:#d699a7; background:#fff0f3; }
.dbp-choice-row { display:flex; flex-wrap:wrap; gap:7px; margin:16px 0; }
.dbp-choice, .dbp-toggle { min-height:44px; border:1px solid #cbbad9; border-radius:999px; color:var(--dbp-soft); background:#fffefd; padding:9px 12px; font-size:12px; cursor:pointer; }
.dbp-choice.is-active, .dbp-toggle[aria-pressed="true"] { border-color:var(--dbp-accent); color:#fff; background:var(--dbp-accent); }
.dbp-lab-answer { padding:14px 15px; border-radius:11px; background:rgba(255,255,255,.72); color:var(--dbp-soft); font-size:14px; line-height:1.75; }
.dbp-version { min-height:114px; padding:17px; border:1px solid #d0bedf; border-radius:13px; background:#fffefd; }
.dbp-version > span { color:var(--dbp-accent); font:600 12px ui-monospace, SFMono-Regular, Menlo, monospace; }
.dbp-version p { margin:9px 0 0; color:var(--dbp-soft); font-size:14px; line-height:1.7; }
.dbp-controls { display:flex; align-items:center; justify-content:space-between; margin:14px 0 0; color:var(--dbp-muted); font-size:12px; }
.dbp-controls button { min-height:44px; border:1px solid #cbbad9; border-radius:10px; padding:9px 12px; color:var(--dbp-accent); background:#fffefd; cursor:pointer; }
.dbp-controls button:disabled { opacity:.45; cursor:not-allowed; }
.dbp-pipeline { display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:7px; margin:20px 0; }
.dbp-pipeline span { padding:10px; color:#245d50; background:#e6f4eb; border:1px solid #accdbf; border-radius:10px; font-size:12px; }
.dbp-pipeline b { color:var(--dbp-accent); font-weight:400; }
.dbp-bars { height:144px; display:flex; align-items:end; justify-content:space-around; gap:8px; padding:12px 12px 28px; margin:20px 0 10px; background:#fffefd; border:1px solid var(--dbp-line); border-radius:12px; }
.dbp-bar-wrap { height:100%; flex:1; display:flex; flex-direction:column; align-items:center; justify-content:end; gap:7px; }
.dbp-bar-wrap span { width:min(38px,65%); min-height:6px; background:linear-gradient(#78b5a0,#347762); border-radius:7px 7px 2px 2px; }
.dbp-bar-wrap:last-child span { background:linear-gradient(#cda5e5,#8a5eac); }
.dbp-bar-wrap small { color:var(--dbp-muted); font:11px ui-monospace, SFMono-Regular, Menlo, monospace; white-space:nowrap; }
.dbp-plan { display:grid; gap:9px; margin-top:28px; }
.dbp-plan-row { display:grid; grid-template-columns:24px 36px 1fr; gap:13px; align-items:start; padding:18px; border:1px solid var(--dbp-line); border-radius:14px; background:#fcf8ff; cursor:pointer; }
.dbp-plan-row input { width:20px; height:20px; margin:2px 0 0; accent-color:var(--dbp-accent); }
.dbp-plan-n { color:var(--dbp-accent); font:600 12px ui-monospace, SFMono-Regular, Menlo, monospace; padding-top:4px; }
.dbp-plan-row strong { display:block; font-size:15px; margin-bottom:5px; }
.dbp-plan-row small { display:block; color:var(--dbp-muted); font-size:14px; line-height:1.75; }
.dbp-plan-row.is-done { border-color:#9fc8b2; background:#eef8f1; }
.dbp-plan-row.is-done strong { color:#29634f; }
.dbp-questions { display:grid; gap:8px; margin-top:27px; }
.dbp-questions details { border:1px solid var(--dbp-line); border-radius:13px; background:#fdf9f7; }
.dbp-questions details[open] { background:#f5effc; border-color:#c7b1dd; }
.dbp-questions summary { display:flex; align-items:baseline; gap:13px; padding:17px; color:var(--dbp-text); font-size:15px; line-height:1.6; cursor:pointer; list-style:none; }
.dbp-questions summary::-webkit-details-marker { display:none; }
.dbp-questions summary::after { content:"+"; margin-left:auto; color:var(--dbp-accent); font-size:18px; }
.dbp-questions details[open] summary::after { content:"-"; }
.dbp-questions summary span { color:var(--dbp-accent); font:600 11px ui-monospace, SFMono-Regular, Menlo, monospace; }
.dbp-questions details > div { padding:0 17px 18px 44px; }
.dbp-questions details p { margin:9px 0 0; color:var(--dbp-soft); font-size:14px; line-height:1.8; }
.dbp-questions details p strong { color:var(--dbp-text); }
.dbp-resources > div { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; margin-top:26px; }
.dbp-resources a { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px; color:var(--dbp-accent); border:1px solid var(--dbp-line); border-radius:12px; background:#faf5ff; text-decoration:none; font-size:13px; line-height:1.6; }
.dbp-resources a span { color:var(--dbp-accent); }
.dbp-resources a:hover { border-color:var(--dbp-accent); background:#efe5fb; }
.dbp-footer { padding:10px 24px 48px; text-align:center; color:var(--dbp-muted); font:12px/1.7 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.03em; }
.dbp-locked { display:grid; place-items:center; padding:24px; }
.dbp-lock-card { width:min(100%,440px); padding:34px; border:1px solid #dfcfe4; border-radius:28px; background:rgba(255,254,253,.94); box-shadow:0 20px 65px rgba(98,58,118,.09); text-align:center; color:var(--dbp-soft); line-height:1.7; }
.dbp-gate-mark { display:grid; place-items:center; width:68px; height:68px; margin:0 auto 24px; border-radius:21px; background:#eee2fa; color:var(--dbp-accent); transform:rotate(-5deg); }
.dbp-gate-mark svg { width:41px; height:41px; }
.dbp-lock-card .dbp-eyebrow { font-size:9px; line-height:1.7; margin:0 0 12px; }
.dbp-lock-card h1 { margin:0; font-size:35px; letter-spacing:-.04em; line-height:1.2; color:var(--dbp-text); }
.dbp-lock-card > p:not(.dbp-eyebrow) { margin:15px 0 24px; font-size:14px; color:var(--dbp-muted); }
.dbp-gate-form { display:grid; gap:9px; text-align:left; }
.dbp-gate-form > label { font-size:12px; font-weight:650; color:var(--dbp-soft); }
.dbp-password-field { display:flex; min-width:0; border:1px solid #c5b0d5; border-radius:12px; background:#fff; overflow:hidden; }
.dbp-password-field:focus-within { border-color:var(--dbp-accent); box-shadow:0 0 0 3px #eee2fa; }
.dbp-password-field input { width:100%; min-width:0; min-height:48px; padding:12px; border:0; background:transparent; color:var(--dbp-text); font-size:16px; outline:none; }
.dbp-password-field button { min-width:54px; margin:3px; border:0; border-radius:8px; background:#f5eefb; color:var(--dbp-accent); font-size:11px; font-weight:650; cursor:pointer; }
.dbp-gate-form > .dbp-primary { margin-top:4px; }
.dbp-gate-error { color:#a3304b; font-size:12px; line-height:1.6; min-height:20px; }
.dbp-gate-note { display:block; color:var(--dbp-muted); font-size:11px; line-height:1.7; margin:12px 0 8px; }
.dbp-lock-card > .dbp-back { font-size:12px; }
@media (max-width:760px) {
  .dbp-hero { grid-template-columns:1fr; gap:27px; }
  .dbp-progress-card { display:grid; grid-template-columns:80px minmax(0,1fr); gap:8px 16px; text-align:left; padding:22px; }
  .dbp-progress-card > .dbp-eyebrow { grid-column:2; margin:0; font-size:10px; }
  .dbp-progress-ring { grid-column:1; grid-row:1 / 5; align-self:center; width:80px; height:80px; padding:6px; margin:0; }
  .dbp-progress-ring > span { font-size:28px; padding-top:13px; }
  .dbp-progress-card h2 { grid-column:2; font-size:23px; }
  .dbp-progress-card > p:not(.dbp-eyebrow) { grid-column:2; margin:0; font-size:12px; }
  .dbp-progress-card .dbp-secondary { grid-column:2; margin-top:3px; padding:8px 10px; }
}
@media (max-width:640px) {
  .dbp-top { min-height:62px; }
  .dbp-wrap { width:calc(100% - 30px); }
  .dbp-hero { padding:45px 0 28px; }
  .dbp-hero h1 { font-size:clamp(42px, 11vw, 60px); }
  .dbp-nav { margin:0 -15px; padding:10px 15px; }
  .dbp-chapter, .dbp-extra { padding:23px 18px; margin:20px 0; border-radius:20px; }
  .dbp-lead { font-size:16px; }
  .dbp-diagram { padding:16px 6px 12px; margin:25px -8px 30px; }
  .dbp-diagram figcaption { padding:0 6px; font-size:10px; }
  .dbp-svg { width:100%; }
  .dbp-bullets li { grid-template-columns:1fr; gap:5px; padding:14px; }
  .dbp-labs-grid { grid-template-columns:1fr; }
  .dbp-lab { padding:18px 14px; }
  .dbp-resources > div { grid-template-columns:1fr; }
  .dbp-plan-row { grid-template-columns:22px 24px 1fr; gap:8px; padding:14px 12px; }
  .dbp-top-note { display:none; }
  .dbp-questions summary { gap:9px; padding:15px 12px; font-size:14px; }
  .dbp-questions details > div { padding:0 14px 17px; }
  .dbp-lock-card { padding:30px 23px; }
}
@media (prefers-reduced-motion: reduce) {
  .dbp-root *, .dbp-root *::before, .dbp-root *::after { scroll-behavior:auto !important; animation:none !important; transition:none !important; }
}
`
