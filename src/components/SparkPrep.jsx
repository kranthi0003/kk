import React, { useEffect, useId, useMemo, useState } from 'react'
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

const readKey = () => (/^#\/databricks\/([a-f0-9]{24})\/?$/i.exec(window.location.hash || '') || [])[1]?.toLowerCase() || ''

function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || 'null')
    return saved && typeof saved === 'object' && saved.done && typeof saved.done === 'object' ? saved.done : {}
  } catch {
    return {}
  }
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
            <path d="M0 0L8 4L0 8" fill="none" stroke="#77d9bd" strokeWidth="1.5" />
          </marker>
          <linearGradient id={`${uid}-node`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#172d36" />
            <stop offset="1" stopColor="#101a27" />
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
          return <line key={`edge-${index}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#77d9bd" strokeOpacity=".8" strokeWidth="2" markerEnd={`url(#${uid}-arrow)`} />
        })}
        {nodes.map((node, index) => {
          const { x, y, width, height: nodeHeight } = positions[index]
          return (
            <g key={`${node.title}-${index}`}>
              <rect x={x} y={y} width={width} height={nodeHeight} rx="13" fill={`url(#${uid}-node)`} stroke="#31505b" />
              <text x={x + 14} y={y + 26} fill="#f3f6f7" fontSize="15" fontWeight="700">{node.title}</text>
              <text x={x + 14} y={y + 47} fill="#b9c9ce" fontSize="11.5">{node.detail}</text>
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

function Locked({ onBack }) {
  return (
    <main className="dbp-root dbp-locked">
      <style>{CSS}</style>
      <div className="dbp-lock-card">
        <span aria-hidden="true">◇</span>
        <p role="status">This page could not be opened from this link.</p>
        <button type="button" className="dbp-back" onClick={onBack}>Back to site</button>
      </div>
    </main>
  )
}

export default function SparkPrep({ onBack }) {
  const [content, setContent] = useState(null)
  const [failed, setFailed] = useState(false)
  const [done, setDone] = useState(loadProgress)
  const chapters = content?.chapters || []
  const nav = useMemo(() => [...chapters.map(({ id, label }) => ({ id: `dbp-${id}`, label })), { id: 'dbp-labs', label: 'Labs' }, { id: 'dbp-plan', label: 'Plan' }, { id: 'dbp-questions', label: 'Practice' }], [chapters])

  useEffect(() => {
    let active = true
    unlock(readKey()).then((value) => { if (active) setContent(value) }).catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify({ done })) } catch {}
  }, [done])

  const toggle = (id) => setDone((current) => ({ ...current, [id]: !current[id] }))
  const jump = (id) => document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })

  if (!content) return failed ? <Locked onBack={onBack} /> : (
    <main className="dbp-root dbp-locked"><style>{CSS}</style><div className="dbp-lock-card" role="status">Opening…</div></main>
  )

  return (
    <main className="dbp-root">
      <style>{CSS}</style>
      <header className="dbp-top">
        <button type="button" className="dbp-back" onClick={onBack}><span aria-hidden="true">←</span> Back to site</button>
        <span className="dbp-top-note">A study space</span>
      </header>
      <div className="dbp-wrap">
        <header className="dbp-hero">
          <p className="dbp-eyebrow">SYSTEMS · DATA · PRACTICE</p>
          <h1>{content.meta.title}</h1>
          <p className="dbp-subtitle">{content.meta.subtitle}</p>
          <p className="dbp-hero-note">{content.meta.note}</p>
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
body:has(.dbp-root) { background: #080d13 !important; background-image: none !important; }
.dbp-root {
  --dbp-bg: #080d13; --dbp-card: #101923; --dbp-card2: #121f29; --dbp-line: #283944;
  --dbp-text: #f0f4f3; --dbp-muted: #b7c5c8; --dbp-soft: #d3dddf; --dbp-accent: #77d9bd; --dbp-warm: #ffc879;
  min-height: 100vh; color: var(--dbp-text); background: var(--dbp-bg);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.dbp-root *, .dbp-root *::before, .dbp-root *::after { box-sizing: border-box; }
.dbp-root :focus-visible { outline: 2px solid var(--dbp-accent); outline-offset: 3px; border-radius: 5px; }
.dbp-root button, .dbp-root input { font: inherit; }
.dbp-top { height: 66px; padding: 0 clamp(18px, 5vw, 72px); display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(183,197,200,.12); }
.dbp-back { display:inline-flex; align-items:center; gap:9px; color:var(--dbp-soft); background:transparent; border:0; cursor:pointer; padding:9px 0; font-size:13px; }
.dbp-back:hover { color:#fff; }
.dbp-back span { color:var(--dbp-accent); font-size:18px; }
.dbp-top-note { color:var(--dbp-muted); font:11px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.12em; text-transform:uppercase; }
.dbp-wrap { width:min(100% - 36px, 940px); margin:0 auto; }
.dbp-hero { padding:clamp(54px, 10vw, 112px) 0 52px; max-width:790px; }
.dbp-eyebrow { color:var(--dbp-accent); font:600 11px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.15em; text-transform:uppercase; margin:0 0 17px; }
.dbp-hero h1 { margin:0; max-width:780px; font-size:clamp(42px, 8vw, 82px); line-height:.98; letter-spacing:-.065em; font-weight:650; }
.dbp-subtitle { max-width:650px; color:var(--dbp-soft); font-size:clamp(18px, 2.5vw, 24px); line-height:1.45; margin:24px 0 0; }
.dbp-hero-note { max-width:590px; margin:20px 0 0; color:var(--dbp-muted); font-size:15px; line-height:1.75; }
.dbp-nav { position:sticky; top:0; z-index:5; display:flex; gap:7px; overflow-x:auto; padding:12px 0; background:rgba(8,13,19,.94); border-top:1px solid rgba(183,197,200,.11); border-bottom:1px solid rgba(183,197,200,.13); scrollbar-width:thin; }
.dbp-nav button { flex:0 0 auto; background:#101923; color:var(--dbp-soft); border:1px solid #283944; border-radius:999px; padding:8px 12px; font-size:12px; cursor:pointer; white-space:nowrap; }
.dbp-nav button:hover { color:#fff; border-color:var(--dbp-accent); }
.dbp-reading { padding-bottom:40px; }
.dbp-chapter, .dbp-extra { scroll-margin-top:82px; padding:62px 0; border-bottom:1px solid rgba(183,197,200,.13); }
.dbp-chapter h2, .dbp-extra h2 { margin:0; font-size:clamp(30px, 5vw, 48px); line-height:1.08; letter-spacing:-.045em; font-weight:620; }
.dbp-lead { max-width:740px; color:var(--dbp-soft); font-size:17px; line-height:1.7; margin:17px 0 0; }
.dbp-diagram { margin:32px 0 43px; padding:22px clamp(14px, 3vw, 30px) 17px; background:linear-gradient(145deg,#101923,#0c131b); border:1px solid var(--dbp-line); border-radius:18px; }
.dbp-diagram figcaption { margin:0 0 16px; color:var(--dbp-muted); font-size:12px; letter-spacing:.08em; text-transform:uppercase; }
.dbp-svg { display:block; width:min(100%, 520px); height:auto; margin:0 auto; overflow:visible; }
.dbp-section { max-width:790px; margin:34px 0 0; }
.dbp-section h3, .dbp-lab h3 { margin:0 0 12px; font-size:21px; line-height:1.3; letter-spacing:-.025em; }
.dbp-section > p, .dbp-lab > p { color:var(--dbp-soft); font-size:15px; line-height:1.8; margin:0; }
.dbp-bullets { display:grid; gap:10px; list-style:none; margin:18px 0 0; padding:0; }
.dbp-bullets li { display:grid; grid-template-columns:minmax(135px, .75fr) 2fr; gap:18px; padding:14px 16px; background:rgba(16,25,35,.76); border:1px solid rgba(40,57,68,.8); border-radius:12px; }
.dbp-bullets strong { color:#f5f7f6; font-size:13px; line-height:1.6; }
.dbp-bullets span { color:var(--dbp-muted); font-size:13px; line-height:1.7; }
.dbp-callout { margin:19px 0 0 !important; padding:15px 17px; border-left:2px solid var(--dbp-accent); background:rgba(119,217,189,.07); border-radius:0 10px 10px 0; color:#e1eeea !important; }
.dbp-extra { padding-top:70px; }
.dbp-labs-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; margin-top:28px; }
.dbp-lab { min-width:0; padding:23px; border:1px solid var(--dbp-line); border-radius:16px; background:linear-gradient(145deg,#111c26,#0e151d); }
.dbp-lab > p { font-size:13px; margin-bottom:17px; }
.dbp-range { display:flex; align-items:center; gap:10px; color:var(--dbp-muted); font-size:10px; }
.dbp-range input { min-width:55px; flex:1; accent-color:var(--dbp-accent); }
.dbp-status { min-height:75px; margin-top:17px; padding:13px 14px; border:1px solid var(--dbp-line); border-radius:10px; color:var(--dbp-soft); font-size:13px; line-height:1.65; }
.dbp-status-0 { border-color:#397260; background:rgba(58,135,105,.12); }
.dbp-status-1 { border-color:#8b6935; background:rgba(183,129,48,.11); }
.dbp-status-2 { border-color:#985e5e; background:rgba(164,73,73,.12); }
.dbp-choice-row { display:flex; flex-wrap:wrap; gap:7px; margin:16px 0; }
.dbp-choice, .dbp-toggle { border:1px solid var(--dbp-line); border-radius:999px; color:var(--dbp-soft); background:#0b1219; padding:8px 11px; font-size:11px; cursor:pointer; }
.dbp-choice.is-active, .dbp-toggle[aria-pressed="true"] { border-color:var(--dbp-accent); color:#e5fff6; background:rgba(119,217,189,.1); }
.dbp-lab-answer { padding:13px 14px; border-radius:10px; background:rgba(255,255,255,.035); color:var(--dbp-soft); font-size:13px; line-height:1.7; }
.dbp-version { min-height:114px; padding:16px; border:1px solid #35515b; border-radius:12px; background:#0b151d; }
.dbp-version > span { color:var(--dbp-accent); font:12px ui-monospace, SFMono-Regular, Menlo, monospace; }
.dbp-version p { margin:9px 0 0; color:var(--dbp-soft); font-size:13px; line-height:1.65; }
.dbp-controls { display:flex; align-items:center; justify-content:space-between; margin:14px 0 0; color:var(--dbp-muted); font-size:11px; }
.dbp-controls button { border:1px solid var(--dbp-line); border-radius:8px; padding:7px 10px; color:var(--dbp-soft); background:#0b1219; cursor:pointer; }
.dbp-controls button:disabled { opacity:.45; cursor:not-allowed; }
.dbp-pipeline { display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:8px; margin:20px 0; }
.dbp-pipeline span { padding:10px 12px; color:#ecf5f1; background:#16252c; border:1px solid #34534f; border-radius:9px; font-size:12px; }
.dbp-pipeline b { color:var(--dbp-accent); font-weight:400; }
.dbp-bars { height:144px; display:flex; align-items:end; justify-content:space-around; gap:8px; padding:12px 12px 28px; margin:20px 0 10px; background:#0a1219; border:1px solid var(--dbp-line); border-radius:12px; }
.dbp-bar-wrap { height:100%; flex:1; display:flex; flex-direction:column; align-items:center; justify-content:end; gap:7px; }
.dbp-bar-wrap span { width:min(38px,65%); min-height:6px; background:linear-gradient(#77d9bd,#438c83); border-radius:6px 6px 2px 2px; }
.dbp-bar-wrap small { color:var(--dbp-muted); font:10px ui-monospace, SFMono-Regular, Menlo, monospace; white-space:nowrap; }
.dbp-plan { display:grid; gap:9px; margin-top:28px; }
.dbp-plan-row { display:grid; grid-template-columns:24px 36px 1fr; gap:13px; align-items:start; padding:17px; border:1px solid var(--dbp-line); border-radius:13px; background:var(--dbp-card); cursor:pointer; }
.dbp-plan-row input { width:18px; height:18px; margin:2px 0 0; accent-color:var(--dbp-accent); }
.dbp-plan-n { color:var(--dbp-accent); font:12px ui-monospace, SFMono-Regular, Menlo, monospace; padding-top:3px; }
.dbp-plan-row strong { display:block; font-size:15px; margin-bottom:5px; }
.dbp-plan-row small { display:block; color:var(--dbp-muted); font-size:13px; line-height:1.65; }
.dbp-plan-row.is-done { border-color:#397260; }
.dbp-plan-row.is-done strong { color:#b6dfcf; }
.dbp-questions { display:grid; gap:8px; margin-top:27px; }
.dbp-questions details { border:1px solid var(--dbp-line); border-radius:12px; background:var(--dbp-card); }
.dbp-questions summary { display:flex; align-items:baseline; gap:13px; padding:16px; color:var(--dbp-text); font-size:14px; line-height:1.55; cursor:pointer; list-style:none; }
.dbp-questions summary::-webkit-details-marker { display:none; }
.dbp-questions summary span { color:var(--dbp-accent); font:11px ui-monospace, SFMono-Regular, Menlo, monospace; }
.dbp-questions details > div { padding:0 16px 16px 43px; }
.dbp-questions details p { margin:9px 0 0; color:var(--dbp-muted); font-size:13px; line-height:1.75; }
.dbp-questions details p strong { color:#eef3f1; }
.dbp-resources > div { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; margin-top:26px; }
.dbp-resources a { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:14px; color:var(--dbp-soft); border:1px solid var(--dbp-line); border-radius:10px; background:var(--dbp-card); text-decoration:none; font-size:12px; line-height:1.5; }
.dbp-resources a span { color:var(--dbp-accent); }
.dbp-resources a:hover { border-color:var(--dbp-accent); color:#fff; }
.dbp-footer { padding:26px 18px 46px; text-align:center; color:var(--dbp-muted); font:11px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing:.05em; }
.dbp-locked { display:grid; place-items:center; padding:24px; }
.dbp-lock-card { width:min(100%,420px); padding:32px; border:1px solid var(--dbp-line); border-radius:18px; background:var(--dbp-card); text-align:center; color:var(--dbp-soft); line-height:1.7; }
.dbp-lock-card > span { color:var(--dbp-accent); font-size:28px; }
.dbp-lock-card p { margin:14px 0 22px; }
@media (max-width:640px) {
  .dbp-top { height:58px; }
  .dbp-wrap { width:min(100% - 30px, 940px); }
  .dbp-hero { padding:58px 0 38px; }
  .dbp-nav { margin:0 -15px; padding:10px 15px; }
  .dbp-chapter, .dbp-extra { padding:49px 0; }
  .dbp-lead { font-size:15px; }
  .dbp-diagram { padding:16px 10px 12px; margin:26px 0 34px; }
  .dbp-svg { width:100%; }
  .dbp-bullets li { grid-template-columns:1fr; gap:4px; padding:13px; }
  .dbp-labs-grid { grid-template-columns:1fr; }
  .dbp-resources > div { grid-template-columns:1fr; }
  .dbp-plan-row { grid-template-columns:22px 27px 1fr; gap:9px; padding:14px 12px; }
  .dbp-top-note { font-size:9px; }
}
@media (prefers-reduced-motion: reduce) {
  .dbp-root *, .dbp-root *::before, .dbp-root *::after { scroll-behavior:auto !important; animation:none !important; transition:none !important; }
}
`
