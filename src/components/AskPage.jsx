import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAmbient } from './AmbientContext'
import { ask, TOOL_LABELS } from '../lib/siteAgent'

/* ------------------------------------------------------------------ *
 * #/ask — talk to the site.
 *
 * Ask out loud or type. gpt-oss picks a tool, the tool reads the site's
 * own F1, cricket and jobs data in the browser, and the answer is
 * spoken back. Every model call and tool call is drawn as it happens,
 * with its timing and token count, so the page shows its working
 * rather than just its answer. The agent itself is src/lib/siteAgent.js.
 *
 * Voice in is the browser's own speech recognition (Chrome, Edge and
 * Safari have it; Firefox doesn't), and voice out is its speech
 * synthesis. Typing always works, and is the only way in where
 * recognition isn't available or the microphone is blocked.
 *
 * The conversation lives in sessionStorage, so following the agent to
 * another page and pressing Back brings it straight back.
 * ------------------------------------------------------------------ */

const RUNS_KEY = 'ask_runs'
const HIST_KEY = 'ask_hist'
const MUTE_KEY = 'ask_muted'
const MAX_RUNS = 12

const SUGGESTIONS = [
  "Who's leading the F1 championship?",
  'When is the next Grand Prix?',
  'Who won the last race?',
  'Where does India rank in each format?',
  'How did India do in their last series?',
  'Any SRE roles at Cloudflare?',
  'Remote staff backend jobs?',
  'Take me to the cricket page',
]

const MIC_ERRORS = {
  'not-allowed': 'Microphone access is blocked. You can type instead.',
  'service-not-allowed': 'Voice input is turned off in this browser. You can type instead.',
  'no-speech': "I didn't hear anything. Tap the orb and try again.",
  'audio-capture': 'No microphone was found.',
  network: "The browser's speech service couldn't be reached. You can type instead.",
}

const read = (key, fallback) => {
  try {
    const v = sessionStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

// The nicest voice the browser has. Natural and neural voices first,
// then the visitor's own English, then any English at all, and never
// one of the novelty voices macOS ships alongside the real ones.
function pickVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || []
  const lang = (navigator.language || 'en-US').toLowerCase()
  const novelty = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|eloquence|grandma|grandpa|rocko|shelley|flo|reed|sandy|eddy|ralph|fred|junior|kathy/i
  let best = null
  let score = -1
  for (const v of voices) {
    const l = (v.lang || '').toLowerCase()
    if (!l.startsWith('en') || novelty.test(v.name)) continue
    let s = 1
    if (/natural|neural|premium|enhanced/i.test(v.name)) s += 4
    if (/google/i.test(v.name)) s += 2
    if (l === lang) s += 2
    else if (l.slice(0, 2) === lang.slice(0, 2)) s += 1
    if (v.localService === false) s += 1
    if (s > score) {
      best = v
      score = s
    }
  }
  return best
}

const shortModel = (m) => (m || '').replace(/^openai\//, '')

// Why a model was passed over, in a few words.
const why = (reason = '') =>
  /rate.?limit/i.test(reason) ? 'rate-limited' : /tool_use_failed/i.test(reason) ? 'malformed tool call' : /empty/i.test(reason) ? 'empty reply' : /network|fetch|proxy/i.test(reason) ? 'unreachable' : 'unavailable'

const fmtArgs = (args) =>
  Object.entries(args || {})
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(', ')

/* ---------------- icons ---------------- */

const Svg = ({ children, size = 16, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" {...p}>
    {children}
  </svg>
)
const MicIcon = (p) => (
  <Svg {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
  </Svg>
)
const KeysIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M7 10h.01M11 10h.01M15 10h.01M7 14h10" />
  </Svg>
)
const SparkIcon = (p) => (
  <Svg {...p} strokeWidth="1.8">
    <path d="M12 3l1.9 5.2L19 10l-5.1 1.8L12 17l-1.9-5.2L5 10l5.1-1.8z" />
  </Svg>
)
const WrenchIcon = (p) => (
  <Svg {...p} strokeWidth="1.8">
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z" />
  </Svg>
)
const InfoIcon = (p) => (
  <Svg {...p} strokeWidth="1.8">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Svg>
)
const SendIcon = (p) => (
  <Svg {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
)
const SpeakerIcon = ({ off, ...p }) => (
  <Svg {...p}>
    <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" stroke="none" />
    {off ? <path d="M16 9.5l5 5m0-5l-5 5" /> : <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />}
  </Svg>
)
const PlayIcon = (p) => (
  <Svg {...p}>
    <path d="M7 5.5v13l11-6.5z" fill="currentColor" stroke="none" />
  </Svg>
)

/* ---------------- the orb ---------------- */

const ORB_LABEL = {
  idle: 'Ask by voice',
  listening: 'Stop listening',
  thinking: 'Stop',
  speaking: 'Stop speaking',
}

function Glyph({ mode }) {
  if (mode === 'listening')
    return (
      <span className="ask-bars" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    )
  if (mode === 'thinking')
    return (
      <span className="ask-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    )
  if (mode === 'speaking') return <SpeakerIcon className="ask-glyph" />
  return <MicIcon className="ask-glyph" />
}

function Orb({ mode, size, onClick, voice }) {
  return (
    <button
      type="button"
      className={`ask-orb ask-orb-${size}`}
      data-mode={mode}
      onClick={onClick}
      aria-label={mode === 'idle' && !voice ? 'Type your question below' : ORB_LABEL[mode]}
      aria-pressed={mode === 'listening'}
    >
      <span className="ask-halo" aria-hidden="true" />
      <span className="ask-ripple" aria-hidden="true" />
      <span className="ask-ripple ask-ripple-2" aria-hidden="true" />
      <span className="ask-spin" aria-hidden="true" />
      <span className="ask-core">
        <Glyph mode={mode} />
      </span>
    </button>
  )
}

/* ---------------- one step of the trace ---------------- */

function JobsResult({ jobs }) {
  return (
    <ul className="ask-jobs">
      {jobs.map((j) => (
        <li key={j.url}>
          <a href={j.url} target="_blank" rel="noopener noreferrer">
            <span className="ask-job-t">{j.title}</span>
            <span className="ask-job-m">
              {j.company}
              {j.location ? ` · ${j.location}` : ''} · {j.posted}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

function Step({ step, next }) {
  const status = step.status || 'done'
  let icon
  let title
  let meta = null
  let body = null

  if (step.type === 'think') {
    icon = <SparkIcon size={13} />
    if (status === 'run') title = 'Thinking'
    else if (status === 'stop') title = 'Stopped'
    else if (status === 'fail') title = 'Model unavailable'
    else if (step.tools?.length) title = `Chose ${step.tools.map((t) => TOOL_LABELS[t] || t).join(' + ')}`
    else title = 'Wrote the answer'
    if (status === 'done') {
      const u = step.usage
      meta = `${step.ms} ms`
      body = (
        <p className="ask-sub">
          {shortModel(step.model)}
          {u ? ` · ${u.prompt_tokens} in / ${u.completion_tokens} out tokens` : ''}
          {step.skipped?.length ? ` · ${step.skipped.map((s) => `${shortModel(s.model)} skipped (${why(s.reason)})`).join(', ')}` : ''}
        </p>
      )
    } else if (status === 'run') {
      body = step.offered ? <p className="ask-sub">{step.offered.length} tools offered</p> : null
    } else if (status === 'fail') {
      body = <p className="ask-sub">{step.skipped?.length ? step.skipped.map((s) => `${shortModel(s.model)}: ${why(s.reason)}`).join(' · ') : 'No response'}</p>
    }
  } else if (step.type === 'tool') {
    icon = <WrenchIcon size={13} />
    title = TOOL_LABELS[step.name] || step.name
    if (step.ms != null) meta = `${step.ms} ms`
    const r = step.result
    body = (
      <>
        <code className="ask-code">
          {step.name}({fmtArgs(step.args)})
        </code>
        {status !== 'run' && step.summary && <p className={`ask-sub${status === 'fail' ? ' ask-bad' : ''}`}>{step.summary}</p>}
        {status === 'done' && r?.jobs?.length > 0 && <JobsResult jobs={r.jobs} />}
        {status === 'done' && r && (
          <details className="ask-details">
            <summary>Raw result</summary>
            <pre className="ask-json">{JSON.stringify(r, null, 2)}</pre>
          </details>
        )}
      </>
    )
  } else {
    icon = <InfoIcon size={13} />
    title = step.text
  }

  return (
    <li className="ask-step" data-status={status} data-last={next ? undefined : ''}>
      <span className="ask-node" aria-hidden="true">
        {status === 'run' ? <span className="ask-spinner" /> : icon}
      </span>
      <div className="ask-step-head">
        <span className="ask-step-title">{title}</span>
        {meta && <span className="ask-step-meta">{meta}</span>}
        <span className="sr-only">{status === 'run' ? ', running' : status === 'fail' ? ', failed' : ''}</span>
      </div>
      {body}
    </li>
  )
}

/* ---------------- one question and its answer ---------------- */

function Run({ run, nav, onGo, onStay, onReplay }) {
  const thinks = run.steps.filter((s) => s.type === 'think' && s.status === 'done')
  const tools = run.steps.filter((s) => s.type === 'tool')
  const tokens = thinks.reduce((n, s) => n + (s.usage?.total_tokens || 0), 0)
  const navHere = nav && nav.runId === run.id

  return (
    <li className="ask-run">
      <p className="ask-q">
        <span className="ask-via" title={run.via === 'voice' ? 'Asked by voice' : 'Typed'}>
          {run.via === 'voice' ? <MicIcon size={13} /> : <KeysIcon size={13} />}
        </span>
        <span>{run.q}</span>
      </p>

      <ol className="ask-steps" aria-label="What the agent did">
        {run.steps.map((s, i) => (
          <Step
            key={`${s.type}-${s.id}`}
            step={s.status === 'run' && run.status !== 'run' ? { ...s, status: 'stop' } : s}
            next={i < run.steps.length - 1 || !!run.answer}
          />
        ))}
        {run.status === 'run' && !run.steps.length && <Step step={{ type: 'think', status: 'run' }} />}
      </ol>

      {run.answer && (
        <div className="ask-answer">
          <p>{run.answer}</p>
          <div className="ask-answer-meta">
            <span>
              {(run.ms / 1000).toFixed(1)} s · {thinks.length} model call{thinks.length === 1 ? '' : 's'} · {tools.length} tool call{tools.length === 1 ? '' : 's'}
              {tokens ? ` · ${tokens.toLocaleString()} tokens` : ''}
            </span>
            {run.offline && <span className="ask-chip-warn">answered without the model</span>}
            <button type="button" className="ask-mini" onClick={() => onReplay(run.answer)}>
              <PlayIcon size={11} /> Play
            </button>
          </div>
        </div>
      )}

      {run.page && (
        <div className="ask-nav">
          {navHere ? (
            <span>
              Opening {run.page.title} in {nav.left}…
            </span>
          ) : (
            <span>{run.page.title.replace(/^\w/, (c) => c.toUpperCase())}</span>
          )}
          <a className="ask-mini ask-mini-solid" href={run.page.hash || '#'} onClick={onGo}>
            Go now
          </a>
          {navHere && (
            <button type="button" className="ask-mini" onClick={onStay}>
              Stay here
            </button>
          )}
        </div>
      )}

      {run.status === 'fail' && <p className="ask-error">{run.error || 'Something went wrong.'}</p>}
      {run.status === 'stop' && <p className="ask-sub">Stopped.</p>}
    </li>
  )
}

/* ---------------- the page ---------------- */

export default function AskPage({ onBack }) {
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const endRef = useRef(null)
  const [runs, setRuns] = useState(() => read(RUNS_KEY, []).filter((r) => r && r.status !== 'run'))
  const [mode, setMode] = useState('idle')
  const [text, setText] = useState('')
  const [interim, setInterim] = useState('')
  const [notice, setNotice] = useState('')
  const [live, setLive] = useState('')
  const [nav, setNav] = useState(null)
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(MUTE_KEY) === '1'
    } catch {
      return false
    }
  })

  const history = useRef(read(HIST_KEY, []))
  const abortRef = useRef(null)
  const recogRef = useRef(null)
  const voiceRef = useRef(null)
  const primed = useRef(false)
  const alive = useRef(true)
  const mutedRef = useRef(muted)
  mutedRef.current = muted

  const SR = useMemo(() => (typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null), [])
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window
  const reduced = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, [])

  // The site radio would talk over the answers and into the microphone.
  const setSuppressed = useAmbient()?.setSuppressed
  useEffect(() => {
    setSuppressed?.(true)
    return () => setSuppressed?.(false)
  }, [setSuppressed])

  // Keep the conversation for this tab, so Back from a page the agent
  // opened returns to it.
  useEffect(() => {
    try {
      sessionStorage.setItem(RUNS_KEY, JSON.stringify(runs.filter((r) => r.status !== 'run').slice(-MAX_RUNS)))
      sessionStorage.setItem(HIST_KEY, JSON.stringify(history.current))
    } catch {}
  }, [runs])

  useEffect(() => {
    if (!canSpeak) return
    const load = () => (voiceRef.current = pickVoice())
    load()
    window.speechSynthesis.addEventListener?.('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', load)
  }, [canSpeak])

  // Stopping recognition still fires its end event, and the end handler
  // submits whatever was heard. So a recogniser that is being thrown
  // away loses its handlers first: half a sentence heard as the visitor
  // leaves, or picked up from the answer being read aloud, must never
  // turn into a question.
  const killRecog = useCallback(() => {
    const r = recogRef.current
    recogRef.current = null
    if (!r) return
    r.onresult = null
    r.onerror = null
    r.onend = null
    try {
      r.abort()
    } catch {}
  }, [])

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      abortRef.current?.abort()
      killRecog()
      if (canSpeak) window.speechSynthesis.cancel()
    }
  }, [canSpeak, killRecog])

  // A beat on the orb, for each word heard and each word spoken.
  const bump = useCallback(() => {
    if (reduced) return
    rootRef.current?.querySelectorAll('.ask-orb').forEach((el) => {
      el.classList.remove('bump')
      void el.offsetWidth
      el.classList.add('bump')
    })
  }, [reduced])

  // iOS only lets speech start inside a tap. The answer arrives long
  // after the tap, so an empty utterance is spoken during it instead,
  // which unlocks speech for the rest of the visit.
  const prime = useCallback(() => {
    if (primed.current || !canSpeak) return
    primed.current = true
    try {
      const u = new SpeechSynthesisUtterance(' ')
      u.volume = 0
      window.speechSynthesis.speak(u)
    } catch {}
  }, [canSpeak])

  const stopSpeaking = useCallback(() => {
    if (canSpeak) window.speechSynthesis.cancel()
  }, [canSpeak])

  const speak = useCallback(
    (words) =>
      new Promise((resolve) => {
        if (!canSpeak || mutedRef.current || !words) return resolve()
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(words)
        if (!voiceRef.current) voiceRef.current = pickVoice()
        if (voiceRef.current) u.voice = voiceRef.current
        u.rate = 1.02
        let done = false
        const finish = () => {
          if (done) return
          done = true
          clearTimeout(guard)
          resolve()
        }
        // Some browsers never fire end for a cancelled utterance.
        const guard = setTimeout(finish, words.length * 95 + 4000)
        u.onboundary = bump
        u.onend = finish
        u.onerror = finish
        window.speechSynthesis.speak(u)
      }),
    [canSpeak, bump]
  )

  const patch = useCallback((id, fn) => setRuns((rs) => rs.map((r) => (r.id === id ? fn(r) : r))), [])

  // Fold one agent event into its run: steps are upserted by id, so a
  // step that starts as "running" is updated in place when it finishes.
  const apply = useCallback(
    (id) => (e) =>
      patch(id, (run) => {
        if (e.type === 'answer') return { ...run, answer: e.text, page: e.page || null, ms: e.ms, offline: !!e.offline }
        const i = run.steps.findIndex((s) => s.type === e.type && s.id === e.id)
        const step = { ...(i >= 0 ? run.steps[i] : {}), ...e }
        return { ...run, steps: i >= 0 ? run.steps.map((s, k) => (k === i ? step : s)) : [...run.steps, step] }
      }),
    [patch]
  )

  const submit = useCallback(
    async (raw, via = 'typed') => {
      const q = String(raw || '').trim().slice(0, 300)
      if (!q || !alive.current) return
      killRecog()
      prime()
      stopSpeaking()
      abortRef.current?.abort()
      setNav(null)
      setNotice('')
      setInterim('')
      setText('')

      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
      setRuns((rs) => [...rs.map((r) => (r.status === 'run' ? { ...r, status: 'stop' } : r)), { id, q, via, status: 'run', steps: [] }].slice(-MAX_RUNS))
      setMode('thinking')
      setLive('Thinking')

      const ctl = new AbortController()
      abortRef.current = ctl
      try {
        const out = await ask(q, { history: history.current, signal: ctl.signal, onEvent: apply(id) })
        if (ctl.signal.aborted) return
        history.current = [...history.current, { role: 'user', content: q }, { role: 'assistant', content: out.text }].slice(-6)
        patch(id, (r) => ({ ...r, status: 'done' }))
        setLive(out.text)
        setMode('speaking')
        await speak(out.text)
        if (ctl.signal.aborted) return
        setMode('idle')
        if (out.page) setNav({ runId: id, hash: out.page.hash, left: 3 })
      } catch (e) {
        if (e?.name === 'AbortError') {
          patch(id, (r) => (r.status === 'run' ? { ...r, status: 'stop' } : r))
          return
        }
        patch(id, (r) => ({ ...r, status: 'fail', error: e?.message || 'Something went wrong.' }))
        setLive('Something went wrong.')
        setMode('idle')
      } finally {
        if (abortRef.current === ctl) abortRef.current = null
      }
    },
    [apply, killRecog, patch, prime, speak, stopSpeaking]
  )

  /* ---------------- listening ---------------- */

  const listen = useCallback(() => {
    if (!SR) {
      setNotice('Voice input needs Chrome, Edge or Safari. Typing works everywhere.')
      inputRef.current?.focus()
      return
    }
    prime()
    stopSpeaking()
    abortRef.current?.abort()
    killRecog()
    setNav(null)
    setNotice('')
    setInterim('')

    const r = new SR()
    const lang = navigator.language || 'en-US'
    r.lang = lang.toLowerCase().startsWith('en') ? lang : 'en-US'
    r.interimResults = true
    r.continuous = false
    r.maxAlternatives = 1

    let heard = ''
    let sent = false
    r.onresult = (ev) => {
      let fin = ''
      let mid = ''
      for (let i = 0; i < ev.results.length; i++) {
        const t = ev.results[i][0]?.transcript || ''
        if (ev.results[i].isFinal) fin += t
        else mid += t
      }
      heard = `${fin} ${mid}`.replace(/\s+/g, ' ').trim()
      setInterim(heard)
      bump()
    }
    r.onerror = (ev) => {
      if (ev.error !== 'aborted') setNotice(MIC_ERRORS[ev.error] || 'Voice input stopped.')
    }
    // Recognition ends by itself after a pause. Whatever was heard by
    // then is the question; Safari doesn't always mark it final.
    r.onend = () => {
      if (recogRef.current === r) recogRef.current = null
      if (heard && !sent) {
        sent = true
        submit(heard, 'voice')
      } else {
        setInterim('')
        setMode((m) => (m === 'listening' ? 'idle' : m))
      }
    }

    recogRef.current = r
    setMode('listening')
    setLive('Listening')
    try {
      r.start()
    } catch {
      recogRef.current = null
      setMode('idle')
      setNotice('Voice input could not start. You can type instead.')
    }
  }, [SR, bump, killRecog, prime, stopSpeaking, submit])

  const onOrb = useCallback(() => {
    if (mode === 'listening') {
      try {
        recogRef.current?.stop()
      } catch {}
      return
    }
    if (mode === 'thinking') {
      abortRef.current?.abort()
      setMode('idle')
      setLive('Stopped')
      return
    }
    if (mode === 'speaking') {
      stopSpeaking()
      setMode('idle')
      return
    }
    listen()
  }, [listen, mode, stopSpeaking])

  // Stop listening, without asking anything, if the tab is put away.
  useEffect(() => {
    const vis = () => {
      if (document.visibilityState !== 'hidden' || !recogRef.current) return
      killRecog()
      setInterim('')
      setMode((m) => (m === 'listening' ? 'idle' : m))
    }
    document.addEventListener('visibilitychange', vis)
    return () => document.removeEventListener('visibilitychange', vis)
  }, [killRecog])

  /* ---------------- following the agent to a page ---------------- */

  useEffect(() => {
    if (!nav) return
    if (nav.left <= 0) {
      window.location.hash = nav.hash || ''
      return
    }
    const t = setTimeout(() => setNav((n) => n && { ...n, left: n.left - 1 }), 1000)
    return () => clearTimeout(t)
  }, [nav])

  const toggleMute = () => {
    setMuted((m) => {
      const v = !m
      try {
        localStorage.setItem(MUTE_KEY, v ? '1' : '0')
      } catch {}
      if (v) stopSpeaking()
      return v
    })
  }

  const replay = useCallback(
    (words) => {
      prime()
      setMode('speaking')
      const was = mutedRef.current
      mutedRef.current = false
      speak(words).then(() => {
        mutedRef.current = was
        setMode((m) => (m === 'speaking' ? 'idle' : m))
      })
    },
    [prime, speak]
  )

  const clear = () => {
    abortRef.current?.abort()
    killRecog()
    setInterim('')
    stopSpeaking()
    setNav(null)
    setRuns([])
    history.current = []
    setMode('idle')
  }

  // Keep the newest step in view while a run is working.
  const active = runs.some((r) => r.status === 'run')
  const lastSig = runs.length ? `${runs[runs.length - 1].id}:${runs[runs.length - 1].steps.length}:${!!runs[runs.length - 1].answer}` : ''
  useEffect(() => {
    if (!lastSig) return
    endRef.current?.scrollIntoView({ block: 'end', behavior: reduced ? 'auto' : 'smooth' })
  }, [lastSig, interim, nav?.runId, mode, reduced])

  // Spoken questions arrive without punctuation, so compare words only.
  const key = (q) => q.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const asked = new Set(runs.map((r) => key(r.q)))
  const ideas = SUGGESTIONS.filter((s) => !asked.has(key(s)))
  const empty = runs.length === 0

  return (
    <div ref={rootRef} className="ask-root min-h-screen bg-background text-foreground">
      <style>{ASK_STYLE}</style>
      <div className="mx-auto max-w-3xl px-5 sm:px-6 pt-8 sm:pt-12 pb-52">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          {!empty && (
            <button type="button" onClick={clear} className="text-[12.5px] text-muted-foreground hover:text-foreground transition-colors">
              Clear
            </button>
          )}
        </div>

        <header className="mt-8 sm:mt-12">
          <p className="ask-eyebrow">Voice agent · F1 · cricket · jobs</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Ask the site</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground max-w-prose">
            Ask out loud or type. A language model picks a tool, the tool reads this site’s own F1, cricket and jobs
            data, and the answer is read back to you. Every step shows up here as it happens.
          </p>
        </header>

        {empty ? (
          <section className="ask-hero" aria-label="Ask a question">
            <Orb mode={mode} size="lg" onClick={onOrb} voice={!!SR} />
            <p className={`ask-hero-status${mode === 'listening' && interim ? ' is-heard' : ''}`}>
              {mode === 'listening' ? interim || 'Listening…' : mode === 'thinking' ? 'Thinking…' : SR ? 'Tap the orb and ask' : 'Type a question below'}
            </p>
            <div className="ask-chips">
              {SUGGESTIONS.slice(0, 6).map((s) => (
                <button key={s} type="button" className="ask-chip" onClick={() => submit(s)}>
                  {s}
                </button>
              ))}
            </div>
          </section>
        ) : (
          <ol className="ask-feed" aria-label="Conversation">
            {runs.map((r) => (
              <Run key={r.id} run={r} nav={nav} onGo={() => setNav(null)} onStay={() => setNav(null)} onReplay={replay} />
            ))}
            {mode === 'listening' && (
              <li className="ask-run ask-pending">
                <p className="ask-q">
                  <span className="ask-via">
                    <MicIcon size={13} />
                  </span>
                  <span>{interim || 'Listening…'}</span>
                </p>
              </li>
            )}
          </ol>
        )}

        {!empty && !active && mode === 'idle' && ideas.length > 0 && (
          <div className="ask-more">
            <span className="ask-more-label">Try</span>
            {ideas.slice(0, 3).map((s) => (
              <button key={s} type="button" className="ask-chip ask-chip-sm" onClick={() => submit(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div ref={endRef} className="ask-end" />
      </div>

      <div className="ask-dock">
        <div className="ask-dock-in">
          {notice && (
            <p className="ask-notice" role="status">
              {notice}
            </p>
          )}
          <form
            className="ask-form"
            onSubmit={(e) => {
              e.preventDefault()
              submit(text)
            }}
          >
            {!empty && <Orb mode={mode} size="sm" onClick={onOrb} voice={!!SR} />}
            <label htmlFor="ask-input" className="sr-only">
              Ask a question
            </label>
            <input
              id="ask-input"
              ref={inputRef}
              className="ask-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setNav(null)}
              placeholder="Ask about F1, cricket or jobs…"
              autoComplete="off"
              enterKeyHint="send"
              maxLength={300}
            />
            <button type="submit" className="ask-send" disabled={!text.trim()} aria-label="Send">
              <SendIcon size={18} />
            </button>
            {canSpeak && (
              <button
                type="button"
                className="ask-iconbtn"
                onClick={toggleMute}
                aria-pressed={!muted}
                aria-label="Read answers aloud"
                title={muted ? 'Answers are not read aloud' : 'Answers are read aloud'}
              >
                <SpeakerIcon off={muted} size={18} />
              </button>
            )}
          </form>
          <p className="ask-foot">
            {SR ? 'Your browser turns speech into text.' : 'Voice input needs Chrome, Edge or Safari.'} Answers come from gpt-oss on
            Groq, reading this site’s data.
          </p>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </div>
  )
}

const ASK_STYLE = `
  .ask-root { --ask-c: var(--color-brand); -webkit-tap-highlight-color: transparent; }
  .ask-eyebrow {
    font: 500 11px/1.4 'JetBrains Mono', ui-monospace, monospace;
    letter-spacing: .18em; text-transform: uppercase; color: var(--ask-c);
  }

  /* ---------- the orb ---------- */
  .ask-orb {
    position: relative; flex: none; width: var(--d); height: var(--d);
    border: 0; padding: 0; border-radius: 50%; background: transparent; cursor: pointer;
    color: var(--color-accent-foreground); touch-action: manipulation;
  }
  .ask-orb-lg { --d: 132px; }
  .ask-orb-sm { --d: 44px; }
  .ask-orb:focus-visible { outline: none; box-shadow: 0 0 0 3px var(--color-background), 0 0 0 5px var(--ask-c); }
  .ask-core {
    position: absolute; inset: 0; border-radius: 50%; display: grid; place-items: center;
    background: radial-gradient(circle at 34% 28%, color-mix(in oklab, #fff 55%, var(--ask-c)) 0%, var(--ask-c) 50%, color-mix(in oklab, var(--ask-c) 58%, #000) 100%);
    box-shadow:
      inset 0 -8px 20px color-mix(in oklab, #000 26%, transparent),
      inset 0 4px 10px color-mix(in oklab, #fff 32%, transparent),
      0 14px 44px color-mix(in oklab, var(--ask-c) 36%, transparent);
    transition: transform .3s cubic-bezier(.3,1.4,.5,1);
  }
  .ask-orb-sm .ask-core { box-shadow: inset 0 -4px 10px color-mix(in oklab, #000 24%, transparent), 0 6px 18px color-mix(in oklab, var(--ask-c) 32%, transparent); }
  .ask-orb:hover .ask-core { transform: scale(1.04); }
  .ask-orb:active .ask-core { transform: scale(.95); }
  .ask-orb.bump .ask-core { animation: askBump .3s ease-out; }
  .ask-glyph { width: 38%; height: 38%; }
  .ask-orb-sm .ask-glyph { width: 46%; height: 46%; }

  .ask-halo {
    position: absolute; inset: -22%; border-radius: 50%; pointer-events: none;
    background: radial-gradient(circle, color-mix(in oklab, var(--ask-c) 28%, transparent) 0%, transparent 68%);
  }
  .ask-orb[data-mode="idle"] .ask-core { animation: askBreathe 4.5s ease-in-out infinite; }
  .ask-orb[data-mode="speaking"] .ask-halo { animation: askGlow 1.1s ease-in-out infinite; }

  .ask-ripple {
    position: absolute; inset: 0; border-radius: 50%; pointer-events: none; opacity: 0;
    border: 2px solid color-mix(in oklab, var(--ask-c) 75%, transparent);
  }
  .ask-orb[data-mode="listening"] .ask-ripple { animation: askRipple 1.8s ease-out infinite; }
  .ask-orb[data-mode="listening"] .ask-ripple-2 { animation-delay: .9s; }

  .ask-spin {
    position: absolute; inset: -5px; border-radius: 50%; pointer-events: none; opacity: 0;
    background: conic-gradient(from 0deg, transparent 0 55%, var(--ask-c) 88%, transparent 100%);
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px));
    mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 2.5px));
  }
  .ask-orb[data-mode="thinking"] .ask-spin { opacity: 1; animation: askSpin .9s linear infinite; }

  .ask-bars { display: flex; align-items: center; gap: 9%; width: 42%; height: 38%; }
  .ask-bars i { flex: 1; height: 100%; border-radius: 99px; background: currentColor; transform-origin: center; animation: askBar 1s ease-in-out infinite; }
  .ask-bars i:nth-child(2) { animation-delay: -.25s; }
  .ask-bars i:nth-child(3) { animation-delay: -.5s; }
  .ask-bars i:nth-child(4) { animation-delay: -.75s; }
  .ask-dots { display: flex; gap: 12%; width: 40%; justify-content: center; }
  .ask-dots i { width: 22%; aspect-ratio: 1; border-radius: 50%; background: currentColor; animation: askDot 1s ease-in-out infinite; }
  .ask-dots i:nth-child(2) { animation-delay: .15s; }
  .ask-dots i:nth-child(3) { animation-delay: .3s; }

  /* ---------- the empty state ---------- */
  .ask-hero { margin-top: 48px; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .ask-hero-status {
    margin: 22px 0 0; min-height: 1.6em; max-width: 30rem;
    font-size: 15px; color: var(--color-muted-foreground);
  }
  .ask-hero-status.is-heard { color: var(--color-foreground); font-size: 17px; font-weight: 500; }
  .ask-chips { margin-top: 26px; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; max-width: 36rem; }
  .ask-chip {
    min-height: 36px; padding: 0 14px; border-radius: 999px; border: 0; cursor: pointer;
    font-size: 13px; color: var(--color-foreground);
    background: color-mix(in oklab, var(--color-card) 70%, transparent);
    box-shadow: inset 0 0 0 1px var(--color-border);
    transition: box-shadow .2s, background .2s;
  }
  .ask-chip:hover { box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ask-c) 60%, transparent); }
  .ask-chip:focus-visible { outline: none; box-shadow: inset 0 0 0 2px var(--ask-c); }
  .ask-chip-sm { min-height: 32px; font-size: 12.5px; }
  .ask-more { margin-top: 26px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
  .ask-more-label { font: 500 10.5px/1 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .16em; text-transform: uppercase; color: var(--color-muted-foreground); margin-right: 4px; }

  /* ---------- the conversation ---------- */
  .ask-feed { list-style: none; margin: 40px 0 0; padding: 0; }
  .ask-run { margin-top: 34px; animation: askIn .35s ease both; }
  .ask-run:first-child { margin-top: 0; }
  .ask-q { display: flex; align-items: flex-start; gap: 10px; margin: 0; font-size: 17px; font-weight: 600; line-height: 1.4; }
  .ask-via {
    flex: none; width: 24px; height: 24px; margin-top: 1px; border-radius: 50%;
    display: grid; place-items: center; color: var(--ask-c);
    background: color-mix(in oklab, var(--ask-c) 14%, transparent);
  }
  .ask-pending .ask-q { color: var(--color-muted-foreground); font-weight: 500; }

  .ask-steps { list-style: none; margin: 14px 0 0; padding: 0; }
  .ask-step { position: relative; padding: 0 0 14px 34px; animation: askIn .3s ease both; }
  .ask-step::before {
    content: ''; position: absolute; left: 11px; top: 26px; bottom: 2px; width: 1.5px;
    background: var(--color-border);
  }
  .ask-step[data-last]::before { display: none; }
  .ask-node {
    position: absolute; left: 0; top: 0; width: 23px; height: 23px; border-radius: 50%;
    display: grid; place-items: center; color: var(--color-muted-foreground);
    background: var(--color-background); box-shadow: inset 0 0 0 1.5px var(--color-border);
  }
  .ask-step[data-status="run"] .ask-node { box-shadow: inset 0 0 0 1.5px var(--ask-c); }
  .ask-step[data-status="done"] .ask-node { color: var(--ask-c); }
  .ask-step[data-status="fail"] .ask-node { color: #e5484d; box-shadow: inset 0 0 0 1.5px color-mix(in oklab, #e5484d 60%, transparent); }
  .ask-spinner {
    width: 11px; height: 11px; border-radius: 50%;
    border: 2px solid color-mix(in oklab, var(--ask-c) 30%, transparent); border-top-color: var(--ask-c);
    animation: askSpin .8s linear infinite;
  }
  .ask-step-head { display: flex; align-items: baseline; gap: 10px; min-height: 23px; padding-top: 2px; }
  .ask-step-title { font-size: 13.5px; font-weight: 600; }
  .ask-step-meta { margin-left: auto; font: 11px/1 'JetBrains Mono', ui-monospace, monospace; color: var(--color-muted-foreground); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .ask-sub { margin: 4px 0 0; font-size: 12.5px; line-height: 1.5; color: var(--color-muted-foreground); }
  .ask-bad { color: #e5484d; }
  .ask-code {
    display: block; margin-top: 6px; padding: 7px 10px; border-radius: 8px;
    font: 12px/1.5 'JetBrains Mono', ui-monospace, monospace; color: var(--color-foreground);
    background: color-mix(in oklab, var(--color-card) 75%, transparent);
    box-shadow: inset 0 0 0 1px var(--color-border);
    white-space: pre-wrap; word-break: break-word;
  }
  .ask-details { margin-top: 6px; }
  .ask-details summary { cursor: pointer; width: max-content; font-size: 12px; color: var(--color-muted-foreground); }
  .ask-details summary:hover { color: var(--color-foreground); }
  .ask-json {
    margin: 6px 0 0; max-height: 240px; overflow: auto; padding: 10px; border-radius: 8px;
    font: 11.5px/1.5 'JetBrains Mono', ui-monospace, monospace; color: var(--color-muted-foreground);
    background: color-mix(in oklab, var(--color-card) 75%, transparent);
    box-shadow: inset 0 0 0 1px var(--color-border);
  }
  .ask-jobs { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 6px; }
  .ask-jobs a {
    display: block; padding: 8px 11px; border-radius: 10px; text-decoration: none;
    background: color-mix(in oklab, var(--color-card) 60%, transparent);
    box-shadow: inset 0 0 0 1px var(--color-border);
    transition: box-shadow .2s;
  }
  .ask-jobs a:hover { box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ask-c) 60%, transparent); }
  .ask-job-t { display: block; font-size: 13px; font-weight: 500; color: var(--color-foreground); }
  .ask-job-m { display: block; margin-top: 2px; font-size: 11.5px; color: var(--color-muted-foreground); }

  .ask-answer {
    margin-top: 4px; padding: 14px 16px; border-radius: 14px;
    background: color-mix(in oklab, var(--ask-c) 9%, var(--color-card));
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ask-c) 30%, transparent);
    animation: askIn .35s ease both;
  }
  .ask-answer > p { margin: 0; font-size: 16px; line-height: 1.55; }
  .ask-answer-meta {
    margin-top: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px;
    font: 11px/1.4 'JetBrains Mono', ui-monospace, monospace; color: var(--color-muted-foreground);
  }
  .ask-chip-warn { padding: 2px 7px; border-radius: 6px; color: #b7791f; background: color-mix(in oklab, #f5a524 16%, transparent); }
  .ask-mini {
    display: inline-flex; align-items: center; gap: 5px; min-height: 30px; padding: 0 11px;
    border-radius: 999px; border: 0; cursor: pointer; text-decoration: none;
    font: 500 12px/1 'Sora', system-ui, sans-serif; color: var(--color-foreground);
    background: transparent; box-shadow: inset 0 0 0 1px var(--color-border);
  }
  .ask-answer-meta .ask-mini { margin-left: auto; }
  .ask-mini:hover { box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ask-c) 60%, transparent); }
  .ask-mini:focus-visible { outline: none; box-shadow: inset 0 0 0 2px var(--ask-c); }
  .ask-mini-solid { background: var(--color-accent); color: var(--color-accent-foreground); box-shadow: none; }
  .ask-nav { margin-top: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 13.5px; }
  .ask-error { margin: 8px 0 0; font-size: 13.5px; color: #e5484d; }

  /* ---------- the dock ---------- */
  .ask-dock {
    position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
    padding: 28px 14px calc(12px + env(safe-area-inset-bottom));
    background: linear-gradient(to top, var(--color-background) 62%, color-mix(in oklab, var(--color-background) 0%, transparent));
    pointer-events: none;
  }
  .ask-dock-in { max-width: 46rem; margin: 0 auto; pointer-events: auto; }
  .ask-notice {
    margin: 0 auto 8px; width: max-content; max-width: 100%; padding: 7px 12px; border-radius: 10px;
    font-size: 12.5px; text-align: center; color: var(--color-foreground);
    background: var(--color-card); box-shadow: inset 0 0 0 1px var(--color-border);
  }
  .ask-form {
    display: flex; align-items: center; gap: 6px; padding: 6px; border-radius: 999px;
    background: var(--color-card);
    box-shadow: inset 0 0 0 1px var(--color-border), 0 10px 30px color-mix(in oklab, #000 18%, transparent);
  }
  .ask-form:focus-within { box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--ask-c) 70%, transparent), 0 10px 30px color-mix(in oklab, #000 18%, transparent); }
  .ask-input {
    flex: 1; min-width: 0; height: 44px; padding: 0 6px 0 12px; border: 0; outline: none; background: transparent;
    font-size: 16px; color: var(--color-foreground);
  }
  .ask-input::placeholder { color: var(--color-muted-foreground); }
  .ask-input:focus-visible { outline: none; box-shadow: none; }
  /* Scrolled to as a run grows; the margin keeps it clear of the dock. */
  .ask-end { scroll-margin-bottom: 150px; }
  .ask-send, .ask-iconbtn {
    flex: none; width: 44px; height: 44px; border-radius: 50%; border: 0; cursor: pointer;
    display: grid; place-items: center; transition: opacity .2s, background .2s;
  }
  .ask-send { background: var(--color-accent); color: var(--color-accent-foreground); }
  .ask-send:disabled { opacity: .35; cursor: default; }
  .ask-iconbtn { background: transparent; color: var(--color-muted-foreground); }
  .ask-iconbtn:hover { color: var(--color-foreground); background: color-mix(in oklab, var(--color-foreground) 6%, transparent); }
  .ask-send:focus-visible, .ask-iconbtn:focus-visible { outline: none; box-shadow: 0 0 0 2px var(--ask-c); }
  .ask-foot {
    margin: 8px 0 0; text-align: center;
    font: 10.5px/1.5 'JetBrains Mono', ui-monospace, monospace; color: var(--color-muted-foreground);
  }

  /* ---------- motion ---------- */
  @keyframes askBreathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.035); } }
  @keyframes askBump { 0% { transform: scale(1); } 35% { transform: scale(1.07); } 100% { transform: scale(1); } }
  @keyframes askGlow { 0%, 100% { opacity: .6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
  @keyframes askRipple { 0% { opacity: .85; transform: scale(1); } 100% { opacity: 0; transform: scale(1.55); } }
  @keyframes askSpin { to { transform: rotate(360deg); } }
  @keyframes askBar { 0%, 100% { transform: scaleY(.3); } 50% { transform: scaleY(1); } }
  @keyframes askDot { 0%, 100% { transform: translateY(0); opacity: .55; } 50% { transform: translateY(-35%); opacity: 1; } }
  @keyframes askIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

  /* Reduced motion keeps every state readable: the orb still changes
     glyph and the thinking ring still shows, it just doesn't move. */
  @media (prefers-reduced-motion: reduce) {
    .ask-root *, .ask-root *::before, .ask-root *::after { animation: none !important; transition: none !important; }
    .ask-orb[data-mode="listening"] .ask-ripple { opacity: .7; transform: scale(1.15); }
    .ask-bars i { transform: scaleY(.7); }
  }
`
