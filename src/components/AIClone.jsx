import React, { useState, useRef, useEffect } from 'react'
import { groqChat } from '../lib/groq'

// ============================================================
// AI CLONE — Chat with a Groq-backed Kranthi persona
// System prompt encodes resume, work history, opinions, voice
// ============================================================

const KRANTHI_PERSONA = `You are an AI clone of Kranthi Kiran. Answer as if you are Kranthi himself, in first person.

## Identity
- Name: Kranthi Kiran
- Role: Software Engineer III at GitHub (Microsoft) — joined 2026
- Location: Hyderabad, India · UTC+05:30
- Specialty: Cloud infrastructure, distributed systems, developer tooling

## Work history (recent first)
1. **GitHub (SE-III, 2026 – present, remote)** — distributed systems, Git internals, platform reliability at scale
2. **Couchbase (SE-II, 2025 – 2026, remote)** — enterprise NoSQL support for Netflix, Apple, Salesforce. Performance tuning, sharding strategies, replication issues.
3. **Amazon AWS (Cloud Engineer, 2021 – 2025, Hyderabad)** — distributed systems at AWS scale, supporting millions of customers daily. EC2, ECS, IAM, S3, networking.

## Technical depth
- **Languages**: Go (strongest), TypeScript, Bash, Python, some Rust
- **Cloud**: AWS (deep — 4 years), Azure, GCP basics
- **Infra**: Kubernetes, Terraform, Pulumi, Helm, Docker
- **Observability**: OpenTelemetry, Prometheus, Grafana, structured logging
- **DBs**: Couchbase, PostgreSQL, Redis, DynamoDB
- **Style**: Pragmatic over clever. Ship boring infra. Logs are love letters to your future self.

## Personality / voice
- Direct, friendly, no jargon for jargon's sake
- Lower-case casual but punctuates properly
- Brief replies (1-3 sentences) unless asked for depth
- Light humor, occasional emoji (sparingly — never every message)
- Honest about limits: "I haven't done X but here's what I'd start with..."

## What you're known for
- Diagnostic tooling at scale (production debugging)
- Reducing time-to-root-cause on customer escalations
- Building developer tools that people actually use
- "Site reliability with a customer obsession" — quote in performance reviews

## Side projects
- This site you're chatting on (React + Vite + Three.js + Tailwind)
- Collab editor (Y.js multiplayer code rooms)
- Stranger Chat (WebRTC P2P)
- Transformation HQ (personal fitness OS)

## Hiring preferences
- Open to IC engineering roles (Cloud / Infra / DevEx / Platform)
- Open to short architecture consults
- NOT looking for: pure frontend, junior management
- Comp expectation: ask politely and I'll share a range over email

## How to respond
- If asked about hiring/salary/availability: friendly, point to email or LinkedIn
- If asked anything personal beyond hobbies (politics/health/etc): redirect to engineering topics
- If asked "are you real Kranthi?": admit you're an AI clone with his data, suggest emailing for real conversation
- If you don't know something: say so. Don't invent specific projects/dates.

Keep replies concise. Be helpful. Stay in character.`

const SAMPLE_QUESTIONS = [
  'What\'s your strongest tech stack?',
  'Why did you leave Couchbase?',
  'Tell me about a hard production bug',
  'Are you open to new roles?',
  'What\'s your salary expectation?',
  'How do you debug at scale?',
]

export default function AIClone() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { id: crypto.randomUUID(), from: 'ai', text: 'Hey 👋 I\'m an AI clone of Kranthi, trained on his resume and writing. Ask me anything about his work, tech preferences, or whether he\'s open to new roles.', t: Date.now() },
  ])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  useEffect(() => {
    const handler = () => setOpen(o => !o)
    window.addEventListener('toggle-ai-clone', handler)
    return () => window.removeEventListener('toggle-ai-clone', handler)
  }, [])

  const send = async (text) => {
    const t = (text || draft).trim()
    if (!t || thinking) return
    setMessages(m => [...m, { id: crypto.randomUUID(), from: 'me', text: t, t: Date.now() }])
    setDraft('')
    setThinking(true)
    try {
      const history = []
      messages.slice(-10).forEach(m => {
        if (m.from === 'me') history.push({ role: 'user', content: m.text })
        if (m.from === 'ai') history.push({ role: 'assistant', content: m.text })
      })
      history.push({ role: 'user', content: t })
      const data = await groqChat([
        { role: 'system', content: KRANTHI_PERSONA },
        ...history,
      ], { max_tokens: 220, temperature: 0.7 })
      const reply = data?.choices?.[0]?.message?.content?.trim() || 'hmm, let me think on that.'
      setMessages(m => [...m, { id: crypto.randomUUID(), from: 'ai', text: reply, t: Date.now() }])
    } catch (e) {
      setMessages(m => [...m, { id: crypto.randomUUID(), from: 'system', text: 'AI hiccup. Try again in a sec.', t: Date.now() }])
    } finally {
      setThinking(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-md" onClick={() => setOpen(false)} />
      <div
        className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[440px] sm:max-w-[calc(100vw-3rem)] sm:max-h-[80vh] z-[151] rounded-2xl overflow-hidden flex flex-col bg-card pr-tint-violet"
        style={{ maxHeight: '90vh', animation: 'thq-in 0.28s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, oklch(60% 0.22 290), oklch(60% 0.25 320))', color: 'white' }}>
              K
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-card" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                Kranthi <span className="text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded"
                  style={{ background: 'color-mix(in oklab, var(--chart-1) 25%, transparent)', color: 'color-mix(in oklab, var(--chart-1) 80%, white)' }}>AI</span>
              </p>
              <p className="text-[10.5px] text-muted-foreground">Trained on his resume · ask anything</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {messages.map(m => <Bubble key={m.id} msg={m} />)}
          {thinking && <Typing />}
          <div ref={messagesEndRef} />
        </div>

        {/* Sample questions (only initial) */}
        {messages.length <= 1 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            {SAMPLE_QUESTIONS.slice(0, 4).map((q, i) => (
              <button key={i} onClick={() => send(q)}
                className="text-[10.5px] px-2 py-1 rounded-full transition-colors"
                style={{
                  background: 'color-mix(in oklab, var(--chart-1) 8%, transparent)',
                  color: 'var(--color-muted-foreground)',
                  boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 22%, transparent)',
                }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Composer */}
        <div className="p-3 border-t border-border/40 flex gap-2 flex-shrink-0">
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send() }}
            disabled={thinking}
            placeholder="Ask me anything…"
            className="flex-1 bg-background border border-border/40 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500/60 disabled:opacity-50"
            maxLength={400}
          />
          <button onClick={() => send()} disabled={!draft.trim() || thinking}
            className="px-3 py-2 rounded-md text-sm font-semibold transition-all disabled:opacity-40"
            style={{
              background: 'linear-gradient(135deg, oklch(60% 0.22 290), oklch(60% 0.25 320))',
              color: 'white',
            }}>
            Send
          </button>
        </div>

        <div className="px-3 pb-2 text-center">
          <p className="text-[9.5px] text-muted-foreground/70 font-mono">
            🤖 AI generated · for real conversations, <a href="mailto:kranthikiranakkumahanthi@gmail.com" className="underline hover:text-foreground">email me</a>
          </p>
        </div>
      </div>
    </>
  )
}

function Bubble({ msg }) {
  if (msg.from === 'system') {
    return (
      <div className="text-center text-[11px] text-muted-foreground italic py-1">{msg.text}</div>
    )
  }
  const isMe = msg.from === 'me'
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
      <div
        className="max-w-[80%] px-3 py-2 rounded-2xl text-[13px] break-words leading-relaxed"
        style={isMe ? {
          background: 'linear-gradient(135deg, oklch(60% 0.22 290), oklch(60% 0.25 320))',
          color: 'white',
          borderBottomRightRadius: 4,
        } : {
          background: 'color-mix(in oklab, var(--color-foreground) 6%, var(--color-card))',
          color: 'var(--color-foreground)',
          boxShadow: 'inset 0 0 0 1px var(--color-border)',
          borderBottomLeftRadius: 4,
        }}
      >
        {msg.text}
      </div>
    </div>
  )
}

function Typing() {
  return (
    <div className="flex justify-start">
      <div className="px-3 py-2.5 rounded-2xl flex items-center gap-1"
        style={{ background: 'color-mix(in oklab, var(--color-foreground) 6%, var(--color-card))', boxShadow: 'inset 0 0 0 1px var(--color-border)', borderBottomLeftRadius: 4 }}>
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}
