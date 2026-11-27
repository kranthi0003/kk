import React, { useCallback, useEffect, useRef, useState } from 'react'
import profile from '../../assets/profile.png'
import { askTwin, faceAvailable, FACE_URL, loadBrain, suggestionsFrom } from '../lib/twin'
import { RealMe, TwinText } from './TwinText'

// #/me: talk to my AI twin out loud. When public/twin/me.glb exists, a 3D me
// sits in a chair and answers with the browser's voice, lip-synced, with
// expressions and gestures (src/lib/twinStage.js on TalkingHead). Until then
// it's a voice call with my photo. Same brain as the floating chat.
// #/me?preview lets me try an avatar file before committing it; the file
// never leaves the device.

const GREETING = [
  "hey! 👋 I'm Kranthi. well, my AI twin",
  "I only know what I've actually written and said, so ask me about work, what I'm learning, or what I'm building",
]
const START = ['What do you actually do at GitHub?', 'What do you do outside work?', 'How does this AI twin work?']
const GESTURE = /👋|🙏|👍|🤷/u
const EMOJI = /(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:\uFE0F|\u200D(?:\p{Extended_Pictographic}|\p{Emoji_Presentation}))*/gu
const LINKISH = /https?:\/\/\S+|(?:www\.)?kranthikiran\.com\/?#?[\w\-/#]*|[\w.+-]+@[\w-]+(?:\.[\w-]+)+/gi
const PALETTE = {
  '--color-background': '#101217',
  '--color-foreground': '#f2ede5',
  '--color-card': '#181b22',
  '--color-muted': '#22262e',
  '--color-muted-foreground': '#b8b2a8',
  '--color-accent': '#e3a462',
  '--color-accent-foreground': '#1b1208',
  '--color-border': '#343944',
  '--color-primary': '#f2ede5',
  '--color-primary-foreground': '#101217',
  background: 'radial-gradient(ellipse 80% 62% at 50% 36%, #2a2e37 0%, #16191f 58%, #0c0e12 100%)',
}

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null
const Recognition = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// TalkingHead suspends and resumes its audio context without waiting, so one
// shared context that's never closed avoids rejections when leaving the page.
let audioCtx = null
const sharedAudio = () => (audioCtx ||= new (window.AudioContext || window.webkitAudioContext)())
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }
let nextId = 1

// Browsers ship a handful of voices; prefer a male Indian English one, then a
// male British or American one. None of them is my voice, and the page says so.
const MALE = /\b(prabhat|rishi|ravi|hemant|daniel|alex|aaron|arthur|oliver|fred|tom|david|mark|george|guy|ryan|eric|thomas|reed|rocko|male)\b/i
const FEMALE = /\b(heera|neerja|veena|isha|lekha|kajal|samantha|victoria|karen|moira|tessa|fiona|zira|hazel|susan|serena|kate|catherine|allison|ava|nicky|aria|jenny|sonia|libby|emma|michelle|female)\b/i
const NOVELTY = /albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox/i
function voiceScore(v) {
  const lang = (v.lang || '').replace('_', '-').toLowerCase()
  if (!lang.startsWith('en') || NOVELTY.test(v.name)) return -1
  let s = lang === 'en-in' ? 40 : lang === 'en-gb' ? 18 : lang === 'en-us' ? 14 : 8
  if (MALE.test(v.name)) s += 30
  if (FEMALE.test(v.name)) s -= 30
  if (/natural|neural|enhanced|premium/i.test(v.name)) s += 12
  return s
}
function bestVoice(voices) {
  let best = null
  for (const v of voices) if (voiceScore(v) >= 0 && (!best || voiceScore(v) > voiceScore(best))) best = v
  return best
}

// What the voice reads: emoji are acted, not read, and links stay on screen.
function spoken(text) {
  return text.replace(LINKISH, 'the link on screen').replace(/#\/([\w-]+)/g, 'my $1 page').replace(EMOJI, '')
    .replace(/\s+([,.!?])/g, '$1').replace(/\s{2,}/g, ' ').trim()
}
function sentences(text) {
  const out = []
  for (const p of text.split(/(?<=[.!?])\s+/)) {
    if (out.length && out[out.length - 1].length < 28) out[out.length - 1] += ` ${p}`
    else out.push(p)
  }
  return out.filter((s) => /[\p{L}\p{N}]/u.test(s))
}

function Icon({ d, className = 'w-[18px] h-[18px]' }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>
}
const ICONS = {
  back: 'M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18',
  on: 'M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z',
  off: 'M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z',
  log: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z',
  zoom: 'M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15',
  mic: 'M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z',
  send: 'M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18',
  close: 'M6 18L18 6M6 6l12 12',
}

const iconBtn = 'h-9 min-w-9 px-2 rounded-xl inline-flex items-center justify-center gap-1.5 text-[12px] font-medium text-[#d9d3ca] hover:text-white hover:bg-white/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e3a462]'

function CallFace({ speaking, busy }) {
  return (
    <div className="absolute inset-0 grid place-items-center" aria-hidden="true">
      <div className="relative">
        {speaking && [0, 0.55, 1.1].map((d) => <span key={d} className="twin-ring absolute inset-0 rounded-full" style={{ animationDelay: `${d}s` }} />)}
        <img src={profile} alt="" className={`relative w-40 h-40 sm:w-52 sm:h-52 rounded-full object-cover ${busy ? 'twin-think' : ''}`}
          style={{ boxShadow: '0 0 0 3px #e3a46299, 0 30px 80px -20px #000' }} />
        <span className="absolute bottom-2 right-2 px-1.5 rounded-md text-[11px] font-bold leading-5" style={{ background: '#e3a462', color: '#1b1208', boxShadow: '0 0 0 3px #16191f' }}>AI</span>
      </div>
    </div>
  )
}

export default function TwinFace({ onBack }) {
  const preview = /[?&]preview\b/i.test(window.location.hash)
  const [kind, setKind] = useState(null)
  const [glb, setGlb] = useState(null)
  const [ready, setReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [note, setNote] = useState('')
  const [started, setStarted] = useState(false)
  const [log, setLog] = useState([])
  const [caption, setCaption] = useState(null)
  const [busy, setBusy] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const [muted, setMuted] = useState(() => { try { return localStorage.getItem('twin_muted') === '1' } catch { return false } })
  const [close, setClose] = useState(() => window.innerWidth < 640)
  const [showLog, setShowLog] = useState(false)
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState(START)

  const stageRef = useRef(null)
  const headRef = useRef(null)
  const api = useRef(null)
  const dims = useRef(null)
  const run = useRef(0)
  const history = useRef([])
  const voice = useRef(null)
  const pace = useRef(64)
  const cancelLine = useRef(null)
  const recog = useRef(null)
  const pool = useRef({ list: START, pos: 0, asked: new Set() })
  const sendRef = useRef(null)
  const inputRef = useRef(null)
  const utterance = useRef(null)
  const mutedRef = useRef(muted)
  mutedRef.current = muted
  const closeRef = useRef(close)
  closeRef.current = close

  const nextSuggestions = useCallback(() => {
    const p = pool.current
    const out = []
    for (let n = 0; out.length < 3 && n < p.list.length * 2; n++) {
      const q = p.list[p.pos++ % p.list.length]
      if (!p.asked.has(q) && !out.includes(q)) out.push(q)
    }
    if (out.length < 3) p.asked.clear()
    setSuggestions(out.length ? out : START)
  }, [])

  // Which face, the brain, and the voice.
  useEffect(() => {
    let dead = false
    const title = document.title
    document.title = 'Talk to Kranthi · AI twin'
    faceAvailable().then((ok) => { if (dead) return; if (ok) { setGlb(FACE_URL); setKind('3d') } else setKind('call') })
    loadBrain().then((b) => {
      const list = suggestionsFrom(b)
      if (!dead && list.length >= 3) { pool.current = { list: shuffle(list), pos: 0, asked: new Set() }; nextSuggestions() }
    }).catch(() => {})
    const pick = () => { if (synth) voice.current = bestVoice(synth.getVoices()) }
    pick()
    synth?.addEventListener?.('voiceschanged', pick)
    return () => {
      dead = true
      document.title = title
      synth?.removeEventListener?.('voiceschanged', pick)
      synth?.cancel()
      recog.current?.abort()
    }
  }, [nextSuggestions])

  // The 3D me: TalkingHead and the avatar load in the background while the
  // start screen is up. Any failure (no WebGL, bad file) falls back to the call.
  useEffect(() => {
    if (kind !== '3d' || !glb) return
    let dead = false
    let head = null
    setReady(false)
    setProgress(0)
    ;(async () => {
      try {
        const [{ TalkingHead }, { LipsyncEn }, stage] = await Promise.all([
          import('../vendor/talkinghead/talkinghead.mjs'),
          import('../vendor/talkinghead/lipsync-en.mjs'),
          import('../lib/twinStage'),
        ])
        if (dead || !stageRef.current) return
        head = new TalkingHead(stageRef.current, {
          lipsyncModules: [], lipsyncLang: 'en', cameraView: 'full', avatarMood: 'happy',
          cameraRotateEnable: false, modelFPS: 30,
          lightAmbientIntensity: 1.6, lightDirectColor: 0xffe6cc, lightDirectIntensity: 22,
          avatarIdleEyeContact: 0.35, avatarSpeakingEyeContact: 0.7, audioCtx: sharedAudio(),
        })
        head.lipsync.en = new LipsyncEn()
        stage.seatAvatar(head)
        await head.showAvatar(
          { url: glb, body: 'M', lipsyncLang: 'en', avatarMood: 'happy', baseline: { headRotateX: -0.05, eyeBlinkLeft: 0.15, eyeBlinkRight: 0.15 } },
          (e) => { if (!dead && e?.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)) },
        )
        if (dead) return
        const m = await stage.settle(head)
        if (dead) return
        headRef.current = head
        api.current = stage
        dims.current = m
        const el = stageRef.current
        stage.framing(head, m, closeRef.current, el.clientWidth / Math.max(1, el.clientHeight))
        setReady(true)
      } catch (e) {
        console.warn('3D twin unavailable, using the voice call', e)
        if (!dead) { setNote("my 3D self didn't load here, so it's a voice call"); setKind('call') }
      }
    })()
    return () => {
      dead = true
      headRef.current = null
      api.current = null
      try { head?.dispose() } catch { /* already gone */ }
    }
  }, [kind, glb])

  // Keep the framing right as the window or the close-up toggle changes.
  useEffect(() => {
    const el = stageRef.current
    if (!ready || !el) return
    const frame = () => { if (headRef.current && dims.current) api.current.framing(headRef.current, dims.current, close, el.clientWidth / Math.max(1, el.clientHeight)) }
    frame()
    let t = 0
    const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(frame, 120) })
    ro.observe(el)
    return () => { ro.disconnect(); clearTimeout(t) }
  }, [ready, close])

  // One sentence out loud. The mouth starts with the voice and re-syncs on
  // every word the voice reports; without sound it runs at the learned pace.
  const sayLine = useCallback((line) => new Promise((resolve) => {
    const words = [...line.matchAll(/\S+/g)].map((m) => ({ text: m[0], at: m.index }))
    const mouth = (from) => { if (headRef.current && api.current) api.current.mouthWords(headRef.current, words.slice(from).map((w) => w.text), pace.current) }
    let done = false
    let timer = 0
    const finish = () => { if (done) return; done = true; clearTimeout(timer); utterance.current = null; resolve() }
    cancelLine.current = finish
    if (!synth || mutedRef.current) {
      mouth(0)
      timer = setTimeout(finish, (line.length + 1) * pace.current + 150)
      return
    }
    // Held in a ref: Chrome drops the events of an utterance it garbage collects.
    const u = new SpeechSynthesisUtterance(line)
    utterance.current = u
    if (voice.current) { u.voice = voice.current; u.lang = voice.current.lang } else u.lang = 'en-IN'
    let t0 = 0
    u.onstart = () => { t0 = performance.now(); mouth(0) }
    u.onboundary = (e) => {
      if (e.name && e.name !== 'word') return
      let i = 0
      while (i + 1 < words.length && words[i + 1].at <= e.charIndex) i++
      if (i > 0) mouth(i)
    }
    u.onend = () => {
      const ms = performance.now() - t0
      if (t0 && ms > 400) pace.current = Math.min(110, Math.max(40, pace.current * 0.6 + (ms / (line.length + 1)) * 0.4))
      finish()
    }
    u.onerror = finish
    // Some engines never fire onend; don't let the conversation hang on it.
    timer = setTimeout(finish, 4000 + line.length * 150)
    synth.speak(u)
  }), [])

  const stopTalking = useCallback(() => {
    run.current++
    synth?.cancel()
    cancelLine.current?.()
    if (headRef.current) api.current?.quiet(headRef.current)
    setSpeaking(false)
  }, [])

  // A reply: the face reacts, then each text is shown and said in turn.
  const talk = useCallback(async (bubbles, { mood, real } = {}, token = run.current) => {
    const head = headRef.current
    if (head && mood) api.current.express(head, mood)
    setSpeaking(true)
    for (let i = 0; i < bubbles.length; i++) {
      if (token !== run.current) return
      setCaption({ id: nextId++, text: bubbles[i], real: !!real && i === bubbles.length - 1 })
      if (head && (i > 0 || !GESTURE.test(mood || ''))) api.current.talkHands(head, 0.55)
      for (const line of sentences(spoken(bubbles[i]))) {
        if (token !== run.current) return
        await sayLine(line)
      }
      if (i < bubbles.length - 1) await sleep(260)
    }
    if (token !== run.current) return
    if (headRef.current) api.current.quiet(headRef.current)
    setSpeaking(false)
  }, [sayLine])

  const send = useCallback(async (raw) => {
    const text = String(raw || '').trim()
    if (!text || busy) return
    stopTalking()
    const token = run.current
    pool.current.asked.add(text)
    setInput('')
    setCaption(null)
    setLog((l) => [...l, { id: nextId++, role: 'user', text }])
    setBusy(true)
    if (headRef.current) api.current.express(headRef.current, '🤔')
    try {
      const brain = await loadBrain()
      const res = await askTwin({ brain, history: history.current, message: text, face: true })
      if (token !== run.current) return
      setBusy(false)
      nextSuggestions()
      if (!res.ok) {
        const line = res.wait ? `whoa, lots of questions at once 😅 give me ${res.wait}s and ask again` : 'my brain glitched for a sec 😅 try that again?'
        setLog((l) => [...l, { id: nextId++, role: 'twin', text: line }])
        await talk([line], { mood: '😅' }, token)
        return
      }
      const reply = res.bubbles.join('\n\n')
      history.current = [...history.current, { role: 'user', text }, { role: 'assistant', text: reply }].slice(-16)
      setLog((l) => [...l, { id: nextId++, role: 'twin', text: reply, real: res.real }])
      // The model doesn't always lead with its expression; its first emoji will do.
      await talk(res.bubbles, { mood: res.mood || reply.match(EMOJI)?.[0] || '🙂', real: res.real }, token)
    } catch {
      if (token === run.current) setBusy(false)
    }
  }, [busy, stopTalking, talk, nextSuggestions])
  sendRef.current = send

  // Speaking inside the tap also unlocks the voice on iPhones for the visit.
  const start = () => {
    setStarted(true)
    setLog([{ id: nextId++, role: 'twin', text: GREETING.join('\n\n') }])
    talk(GREETING, { mood: '👋' }, ++run.current)
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50)
  }

  const listen = () => {
    if (!Recognition) return
    if (listening) { recog.current?.stop(); return }
    stopTalking()
    const r = new Recognition()
    r.lang = 'en-IN'
    r.interimResults = true
    r.continuous = false
    let heard = ''
    r.onresult = (e) => {
      let t = ''
      for (let i = 0; i < e.results.length; i++) { t += e.results[i][0].transcript; if (e.results[i].isFinal) heard = t }
      setInput(t)
    }
    r.onerror = (e) => { if (/not-allowed|service-not-allowed/.test(e.error)) setNote("the mic is blocked here, typing works too") }
    r.onend = () => { setListening(false); recog.current = null; if (heard.trim()) sendRef.current(heard) }
    recog.current = r
    try {
      r.start()
      setListening(true)
      headRef.current?.makeEyeContact(5000)
    } catch { setListening(false) }
  }

  const toggleMute = () => {
    stopTalking()
    setMuted((m) => { try { localStorage.setItem('twin_muted', m ? '0' : '1') } catch { /* private mode */ } return !m })
  }

  const pickFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setNote('')
    setGlb(URL.createObjectURL(f))
    setKind('3d')
  }

  useEffect(() => {
    if (!showLog) return
    const onKey = (e) => { if (e.key === 'Escape') setShowLog(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showLog])

  const loading3d = kind === '3d' && !ready
  const status = listening ? 'listening…' : busy ? 'thinking…' : ''

  return (
    <div className="fixed inset-0 z-[60] flex flex-col text-[#f2ede5] overflow-hidden" style={PALETTE}>
      <style>{`
        .twin-ring { box-shadow: 0 0 0 2px #e3a462; animation: twin-ring 1.65s ease-out infinite; }
        @keyframes twin-ring { from { transform: scale(1); opacity: .55 } to { transform: scale(1.45); opacity: 0 } }
        .twin-think { animation: twin-think 1.4s ease-in-out infinite; }
        @keyframes twin-think { 50% { filter: brightness(.82) } }
        .twin-dot { animation: twin-dot 1s ease-in-out infinite; }
        @keyframes twin-dot { 50% { opacity: .25 } }
        @media (prefers-reduced-motion: reduce) { .twin-ring, .twin-think, .twin-dot { animation: none } }
      `}</style>

      <header className="relative z-10 flex items-center gap-2 px-2.5 sm:px-5 h-14 flex-shrink-0">
        <button type="button" onClick={onBack} className={iconBtn} aria-label="Back to the site"><Icon d={ICONS.back} /></button>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="relative flex-shrink-0">
            <img src={profile} alt="" className="w-8 h-8 rounded-full object-cover" style={{ boxShadow: '0 0 0 1.5px #e3a46288' }} />
            <span className="absolute -bottom-1 -right-1.5 px-1 rounded-md text-[8px] font-bold leading-[13px]" style={{ background: '#e3a462', color: '#1b1208', boxShadow: '0 0 0 2px #16191f' }}>AI</span>
          </span>
          <div className="leading-tight min-w-0">
            <h1 className="text-[14px] font-semibold">Kranthi</h1>
            <p className="text-[11px] text-[#b8b2a8] truncate">AI twin · built from my own words</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          {kind === '3d' && ready && (
            <button type="button" onClick={() => setClose((c) => !c)} className={iconBtn} aria-pressed={close} aria-label="Close up" title={close ? 'Show the whole chair' : 'Close up'}>
              <Icon d={ICONS.zoom} /><span className="hidden sm:inline">{close ? 'Wide' : 'Close up'}</span>
            </button>
          )}
          <button type="button" onClick={toggleMute} className={iconBtn} aria-pressed={muted} aria-label={muted ? 'Turn the voice on' : 'Mute the voice'} title={muted ? 'Voice off' : 'Voice on'}>
            <Icon d={muted ? ICONS.off : ICONS.on} />
          </button>
          <button type="button" onClick={() => setShowLog((s) => !s)} className={iconBtn} aria-expanded={showLog} aria-controls="twin-log" aria-label="Transcript">
            <Icon d={ICONS.log} /><span className="hidden sm:inline">Transcript</span>
          </button>
        </div>
      </header>

      <main className="relative flex-1 min-h-0">
        {kind === '3d' && <div ref={stageRef} className={`absolute inset-0 transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />}
        {kind === 'call' && <CallFace speaking={speaking} busy={busy} />}

        {status && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[12px] text-[#e9e3da] bg-black/45 backdrop-blur-sm flex items-center gap-1.5">
            <span className="twin-dot w-1.5 h-1.5 rounded-full" style={{ background: listening ? '#ff7a6b' : '#e3a462' }} aria-hidden="true" />{status}
          </div>
        )}

        {showLog && (
          <section id="twin-log" aria-label="Transcript" className="absolute z-20 right-2.5 sm:right-5 top-1 bottom-2 w-[min(380px,calc(100%-20px))] rounded-2xl flex flex-col overflow-hidden"
            style={{ background: '#181b22f2', boxShadow: '0 24px 70px -16px #000, inset 0 0 0 1px #343944', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}>
            <div className="flex items-center justify-between px-4 h-11 flex-shrink-0 border-b border-[#343944]">
              <h2 className="text-[13px] font-semibold">Transcript</h2>
              <button type="button" onClick={() => setShowLog(false)} className={iconBtn} aria-label="Close transcript"><Icon d={ICONS.close} className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-[13px] leading-relaxed">
              {log.length === 0 && <p className="text-[#b8b2a8]">Nothing yet. Say hi.</p>}
              {log.map((m) => (
                <div key={m.id}>
                  <div className="text-[10.5px] uppercase tracking-wider text-[#b8b2a8] mb-0.5">{m.role === 'user' ? 'You' : 'Kranthi (AI)'}</div>
                  {m.text.split('\n\n').map((t, i) => <p key={i} className="mb-1">{m.role === 'user' ? t : <TwinText text={t} />}</p>)}
                  {m.real && <RealMe className="pt-1" />}
                </div>
              ))}
            </div>
          </section>
        )}

        {!started && (
          <div className="absolute inset-0 z-30 grid place-items-center px-5" style={{ background: 'linear-gradient(180deg, #0c0e12cc, #0c0e12ee)' }}>
            <div className="w-full max-w-[400px] text-center">
              <div className="text-[34px] leading-none mb-3" aria-hidden="true">👋</div>
              <h2 className="text-[22px] font-semibold tracking-tight">Hey, it's Kranthi</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-[#d9d3ca]">
                Well, my AI twin. Ask anything out loud or by typing, and it answers from what I've actually written and said.
              </p>
              <p className="mt-3 text-[12px] leading-relaxed text-[#b8b2a8]">It's AI, not me live, and the voice is your browser's, not mine.</p>
              {kind === 'call' && !preview && <p className="mt-1 text-[12px] text-[#b8b2a8]">My 3D self is on the way. For now it's a voice call.</p>}
              <button type="button" onClick={start} disabled={!kind || loading3d} autoFocus
                className="mt-6 h-11 px-6 rounded-full text-[14px] font-semibold inline-flex items-center gap-2 transition-transform enabled:hover:scale-[1.03] enabled:active:scale-[.97] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{ background: '#e3a462', color: '#1b1208' }}>
                {loading3d ? `Getting my 3D self ready… ${progress}%` : 'Start talking'}
              </button>
              {loading3d && (
                <div className="mt-3 mx-auto w-48 h-1 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-label="Loading my 3D self" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${progress}%`, background: '#e3a462' }} />
                </div>
              )}
              {preview && (
                <label className="mt-5 block text-[12px] text-[#b8b2a8]">
                  Preview an avatar file (.glb). It stays on this device.
                  <input type="file" accept=".glb,model/gltf-binary" onChange={pickFile} className="mt-2 block mx-auto text-[12px] file:mr-3 file:px-3 file:py-1.5 file:rounded-full file:border-0 file:bg-white/10 file:text-[#f2ede5]" />
                </label>
              )}
              {note && <p className="mt-3 text-[12px] text-[#e3a462]">{note}</p>}
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 flex-shrink-0 px-2.5 sm:px-5 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]" style={{ background: 'linear-gradient(180deg, transparent, #0c0e12f0 30%)' }}>
        <div className="mx-auto max-w-[680px]">
          <div aria-live="polite" className="min-h-[46px] mb-2 text-center">
            {caption && (
              <div key={caption.id}>
                <p className="inline-block px-3.5 py-2 rounded-2xl text-[15px] sm:text-[16px] leading-snug bg-black/50 backdrop-blur-sm"><TwinText text={caption.text} /></p>
                {caption.real && <RealMe className="justify-center pt-2" />}
              </div>
            )}
            {started && note && !caption && <p className="text-[12px] text-[#e3a462]">{note}</p>}
          </div>
          {started && !busy && !speaking && !listening && (
            <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-hide sm:flex-wrap sm:justify-center">
              {suggestions.map((q) => (
                <button key={q} type="button" onClick={() => send(q)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium text-[#e9e3da] hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e3a462]"
                  style={{ background: '#e3a4621f', boxShadow: 'inset 0 0 0 1px #e3a46255' }}>
                  {q}
                </button>
              ))}
            </div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex items-center gap-1.5 rounded-full pl-1.5 pr-1.5 py-1.5"
            style={{ background: '#22262ee6', boxShadow: 'inset 0 0 0 1px #343944' }}>
            {Recognition && (
              <button type="button" onClick={listen} disabled={!started || busy} aria-pressed={listening} aria-label={listening ? 'Stop listening' : 'Ask out loud'}
                className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0 transition-colors disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e3a462]"
                style={listening ? { background: '#ff7a6b', color: '#1b1208' } : { background: '#ffffff14', color: '#f2ede5' }}>
                <Icon d={ICONS.mic} />
              </button>
            )}
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} disabled={!started} maxLength={500}
              placeholder={listening ? 'Listening…' : 'Ask me anything…'} aria-label="Your question"
              className={`flex-1 min-w-0 bg-transparent text-[14.5px] placeholder:text-[#b8b2a8] outline-none ${Recognition ? '' : 'pl-3'}`} />
            <button type="submit" disabled={!started || busy || !input.trim()} aria-label="Send"
              className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0 transition-transform enabled:hover:scale-105 disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              style={{ background: '#e3a462', color: '#1b1208' }}>
              <Icon d={ICONS.send} className="w-4 h-4" />
            </button>
          </form>
          <p className="text-center text-[10.5px] text-[#b8b2a8] mt-1.5">AI twin, not me live · it can get things wrong</p>
        </div>
      </footer>
    </div>
  )
}
