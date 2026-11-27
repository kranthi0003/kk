import React, { useCallback, useEffect, useRef, useState } from 'react'
import profile from '../../assets/profile.png'
import { askTwin, faceAvailable, loadBrain, suggestionsFrom } from '../lib/twin'
import { RealMe, TwinText } from './TwinText'

// The floating chat: my AI twin, answering in first person from src/brain
// (see src/lib/twin.js). Replies arrive as a few short texts with a typing
// pause between them, the way I'd actually reply.
const GREETING = [
  'hey! 👋 this is my AI twin',
  "it only knows what I've actually written and said, so it's close to talking to me. ask me anything: work, projects, life",
]
const START = ['What do you actually do at GitHub?', 'What certifications do you have?', 'What do you do outside work?', 'How does this AI twin work?']

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }
let nextId = 1
const greeting = () => GREETING.map((text) => ({ id: nextId++, role: 'assistant', text, turn: 0 }))

// Earlier turns for the twin, with each reply's texts joined back together.
function historyOf(messages) {
  const out = []
  for (const m of messages) {
    if (m.turn === 0 || m.note) continue
    const prev = out[out.length - 1]
    if (prev && prev.role === m.role && prev.turn === m.turn) prev.text += `\n\n${m.text}`
    else out.push({ role: m.role, text: m.text, turn: m.turn })
  }
  return out
}

function Face({ size = 24 }) {
  return (
    <span className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <img src={profile} alt="" className="w-full h-full rounded-full object-cover" style={{ boxShadow: '0 0 0 1.5px color-mix(in oklab, var(--color-accent) 55%, transparent)' }} />
    </span>
  )
}

export default function AIChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(greeting)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [typing, setTyping] = useState(false)
  const [face, setFace] = useState(false)
  const [nudge, setNudge] = useState(false)
  const [suggestions, setSuggestions] = useState(START.slice(0, 3))
  const pool = useRef({ list: START, pos: 3, asked: new Set() })
  const run = useRef(0)
  const ctl = useRef(null)
  const turn = useRef(0)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const nextSuggestions = useCallback(() => {
    const p = pool.current
    const fresh = p.list.filter((q) => !p.asked.has(q))
    if (fresh.length < 3) { p.asked.clear(); p.list = shuffle(p.list); p.pos = 0 }
    const out = []
    for (let n = 0; out.length < 3 && n < p.list.length * 2; n++) {
      const q = p.list[p.pos % p.list.length]
      p.pos++
      if (!p.asked.has(q) && !out.includes(q)) out.push(q)
    }
    setSuggestions(out)
  }, [])

  // The brain and the face check load the first time the chat opens.
  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    loadBrain().then((b) => {
      const list = suggestionsFrom(b)
      if (list.length >= 3 && pool.current.list === START) { pool.current = { list: shuffle(list), pos: 0, asked: pool.current.asked }; nextSuggestions() }
    }).catch(() => {})
    faceAvailable().then(setFace)
  }, [open, nextSuggestions])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, typing, open])

  useEffect(() => () => { run.current++; ctl.current?.abort() }, [])

  useEffect(() => {
    if (sessionStorage.getItem('chat_nudged')) return undefined
    const t = setTimeout(() => {
      setNudge(true)
      sessionStorage.setItem('chat_nudged', '1')
      setTimeout(() => setNudge(false), 6000)
    }, 5000)
    return () => clearTimeout(t)
  }, [])

  const say = (text, extra = {}) => setMessages((m) => [...m, { id: nextId++, role: 'assistant', text, turn: turn.current, ...extra }])

  const send = async (raw) => {
    const text = String(raw || '').trim()
    if (!text || busy) return
    const mine = run.current
    turn.current += 1
    pool.current.asked.add(text)
    const before = messages
    setMessages((m) => [...m, { id: nextId++, role: 'user', text, turn: turn.current }])
    setInput('')
    setBusy(true)
    setTyping(true)
    ctl.current?.abort()
    ctl.current = new AbortController()
    try {
      const brain = await loadBrain()
      const res = await askTwin({ brain, history: historyOf(before), message: text, signal: ctl.current.signal })
      if (run.current !== mine) return
      if (!res.ok) {
        setTyping(false)
        say(res.wait ? `whoa, lots of questions at once 😅 give me ${res.wait}s and try again` : 'my brain glitched for a sec 😅 try that again?', { note: true })
      } else {
        // The network wait already covered the first text; later ones get a
        // typing pause that scales with their length.
        for (const [i, b] of res.bubbles.entries()) {
          if (i) { setTyping(true); await sleep(Math.min(1500, 450 + b.length * 14)) } else await sleep(Math.min(600, 120 + b.length * 5))
          if (run.current !== mine) return
          setTyping(false)
          say(b, { real: res.real && i === res.bubbles.length - 1 })
          if (i < res.bubbles.length - 1) await sleep(220)
        }
      }
      nextSuggestions()
    } catch (e) {
      if (run.current === mine && e?.name !== 'AbortError') { setTyping(false); say('my brain glitched for a sec 😅 try that again?', { note: true }) }
    } finally {
      if (run.current === mine) { setBusy(false); setTyping(false) }
    }
  }

  const reset = () => {
    run.current++
    ctl.current?.abort()
    turn.current = 0
    setBusy(false)
    setTyping(false)
    setMessages(greeting())
    pool.current.asked.clear()
    nextSuggestions()
  }

  const toFace = () => { setOpen(false); window.location.hash = '#/me' }

  return (
    <>
      {nudge && !open && (
        <div className="fixed bottom-20 right-6 z-50 animate-fade-in-up">
          <div className="relative bg-foreground text-background px-4 py-2.5 rounded-xl shadow-lg max-w-[210px]">
            <p className="text-xs font-medium">hey, it's me 👋 well, my AI twin. ask me anything</p>
            <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-foreground rotate-45" />
            <button type="button" onClick={() => setNudge(false)} aria-label="Dismiss" className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-muted text-foreground flex items-center justify-center text-[10px] hover:bg-border transition-colors">✕</button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setNudge(false) }}
        data-chatbot-btn
        aria-label={open ? 'Close chat' : 'Chat with my AI twin'}
        aria-expanded={open}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${open ? 'bg-foreground/10 text-foreground backdrop-blur-sm' : 'bg-foreground text-background hover:scale-105'}`}
      >
        {!open && !nudge && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />}
        {open ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
            <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
          </svg>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Chat with my AI twin"
          className="fixed bottom-20 right-4 sm:right-6 z-50 w-[372px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden flex flex-col animate-fade-in-up"
          style={{
            height: '540px', maxHeight: 'calc(100vh - 7rem)',
            background: 'color-mix(in oklab, var(--color-card) 94%, transparent)',
            border: '1px solid color-mix(in oklab, var(--color-border) 70%, transparent)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 24px 70px -16px rgba(0,0,0,.6)',
          }}>
          <div className="px-4 py-3 flex items-center justify-between flex-shrink-0 border-b"
            style={{ borderColor: 'color-mix(in oklab, var(--color-border) 50%, transparent)', background: 'linear-gradient(180deg, color-mix(in oklab, var(--color-accent) 9%, transparent), transparent)' }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative">
                <Face size={34} />
                <span className="absolute -bottom-1 -right-1.5 px-1 rounded-md text-[8px] font-bold leading-[13px]" style={{ background: 'var(--color-accent)', color: 'var(--color-accent-foreground)', boxShadow: '0 0 0 2px var(--color-card)' }}>AI</span>
              </span>
              <div className="leading-tight min-w-0">
                <div className="text-[13.5px] font-semibold text-foreground">Kranthi</div>
                <div className="text-[10.5px] text-muted-foreground truncate">AI twin · built from my own words</div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={toFace} className="h-8 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" title={face ? 'Talk face to face' : 'Talk out loud'}>
                {face ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15.5 10.5l4.6-2.6a.6.6 0 01.9.5v7.2a.6.6 0 01-.9.5l-4.6-2.6M4.5 18h9a2 2 0 002-2V8a2 2 0 00-2-2h-9a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                )}
                {face ? 'Face to face' : 'Talk'}
              </button>
              <button type="button" onClick={reset} className="w-8 h-8 rounded-lg grid place-items-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors" title="New chat" aria-label="New chat">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </button>
            </div>
          </div>

          <div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversation" className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1.5 scrollbar-hide">
            {messages.map((msg, i) => {
              const mine = msg.role === 'user'
              const next = messages[i + 1]
              const lastOfGroup = !next || next.role !== msg.role || next.turn !== msg.turn
              return (
                <div key={msg.id} className={lastOfGroup ? 'pb-1.5' : ''}>
                  <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
                    {!mine && (lastOfGroup ? <Face /> : <span className="w-6 flex-shrink-0" />)}
                    <div className={`max-w-[80%] px-3.5 py-2 text-[13px] leading-relaxed rounded-2xl ${mine ? (lastOfGroup ? 'rounded-br-md' : '') : (lastOfGroup ? 'rounded-bl-md' : '')}`}
                      style={mine
                        ? { background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))', color: 'var(--color-accent-foreground)' }
                        : { background: 'color-mix(in oklab, var(--color-muted) 60%, transparent)', color: 'var(--color-foreground)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-border) 45%, transparent)' }}>
                      {mine ? msg.text : <TwinText text={msg.text} />}
                    </div>
                  </div>
                  {msg.real && <RealMe className="pl-8 pt-2" />}
                </div>
              )
            })}
            {typing && (
              <div className="flex items-end gap-2 justify-start">
                <Face />
                <div className="rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1" style={{ background: 'color-mix(in oklab, var(--color-muted) 60%, transparent)' }}>
                  <span className="sr-only">typing</span>
                  {[0, 150, 300].map((d) => <span key={d} aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            )}
          </div>

          {!busy && (
            <div className="px-3.5 pb-2 flex flex-wrap gap-1.5">
              {suggestions.map((q) => (
                <button key={q} type="button" onClick={() => send(q)}
                  className="px-3 py-1 rounded-full text-[11px] font-medium transition-colors text-muted-foreground hover:text-foreground"
                  style={{ background: 'color-mix(in oklab, var(--color-accent) 7%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 20%, transparent)' }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="px-3 pb-3 pt-1 flex-shrink-0">
            <style>{`
              .chat-typebox { background: color-mix(in oklab, var(--color-muted) 45%, transparent); box-shadow: inset 0 0 0 1px var(--color-border); }
              .chat-typebox:focus-within { box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--color-accent) 55%, transparent), 0 0 0 3px color-mix(in oklab, var(--color-accent) 16%, transparent); }
              .chat-send:not(:disabled):hover { transform: scale(1.08); }
              .chat-send:not(:disabled):active { transform: scale(0.94); }
            `}</style>
            <div className="chat-typebox flex items-center gap-1.5 rounded-full pl-4 pr-1.5 py-1.5 transition-shadow">
              <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Message me…" aria-label="Message"
                maxLength={500} className="flex-1 bg-transparent text-[13.5px] text-foreground placeholder:text-muted-foreground/60 outline-none" />
              <button type="submit" disabled={busy || !input.trim()} aria-label="Send"
                className="chat-send w-8 h-8 rounded-full grid place-items-center flex-shrink-0 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))', color: 'var(--color-accent-foreground)', boxShadow: '0 2px 8px -2px color-mix(in oklab, var(--color-accent) 55%, transparent)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" /></svg>
              </button>
            </div>
            <div className="text-center text-[10px] text-muted-foreground/70 mt-1.5">AI twin, not me typing live · it can get things wrong</div>
          </form>
        </div>
      )}
    </>
  )
}
