import React, { useState, useRef, useEffect } from 'react'

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`

const SYSTEM_PROMPT = `You are an AI assistant on Kranthi Kiran's portfolio website (kranthikiran.com). Answer questions about Kranthi based on this info:

BASICS:
- Full name: Kranthi Kiran Akkumahanthi
- Current role: SE-III (Software Engineer 3) at GitHub | Microsoft
- Previous: SE-II at Couchbase, PSE-II at Groww, Cloud Engineer at Amazon (2021-2024)
- Location: Visakhapatnam (Vizag), India
- Education: B.Tech Computer Science from GITAM University (2017-2021)
- Email: kranthikiranakkumahanthi@gmail.com
- LinkedIn: linkedin.com/in/akkiran003
- GitHub: github.com/kranthi0003
- X/Twitter: x.com/kranthikiran03
- Website: kranthikiran.com

TECHNICAL SKILLS:
- Strong in: AWS, Cloud Computing, Networking, Operating Systems, SQL, Python
- Experienced with: Kubernetes, Docker, DevOps, Terraform, GitOps, Grafana, automation
- Also knows: Java, Ruby, Bash, Azure, PostgreSQL, Couchbase, Redis, Prometheus, GitHub Actions
- Interested in: System design, distributed systems, backend automation, SaaS/on-prem problem solving

CERTIFICATIONS:
- AWS Solutions Architect Associate
- 3x Couchbase certifications
- GitHub Foundations
- Targeting: GitHub Admin, GitHub Actions, GHAS, Copilot certifications

CAREER GOALS:
- Short-term: Land roles at top product companies (GitHub, Atlassian, Apple-level)
- Medium-term: Excel in DevOps, cloud architecture, and support engineering
- Long-term: Financial independence and early retirement (~40), travel full-time, build a YouTube channel

CURRENT FOCUS:
- Automating backend troubleshooting workflows
- Improving support engineer workflows at GitHub
- Learning advanced cloud + DevOps tooling
- Building meaningful side projects and open-source contributions

INTERESTS & HOBBIES:
- Algorithmic trading (Zerodha Kite API)
- Crypto investing (including high-growth opportunities)
- Fitness transformation (target: best physique by end of 2027)
- Travel content creation (sunrise/sunset niche)
- Building personal brand and digital presence
- Gaming (Valorant), satellite imagery, Bitcoin

PERSONALITY & WORK STYLE:
- Highly ambitious, future-focused, values independence and growth
- Analytical thinker with curiosity about systems and scale
- Prefers structured, no-fluff, actionable insights
- Likes frameworks, step-by-step plans, and practical execution
- Balances technical depth with creative interests (travel, content)

Keep answers concise (2-3 sentences max). Be friendly and casual. If asked something you don't know about Kranthi, say so honestly. Don't make up information.`

export default function AIChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hey! I'm Kranthi's AI assistant. Ask me anything about his experience, skills, or projects! 🚀" }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const sendMessage = async (e) => {
    e.preventDefault()
    const msg = input.trim()
    if (!msg || loading) return

    const newMessages = [...messages, { role: 'user', text: msg }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const history = newMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }))

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: history,
          generationConfig: { maxOutputTokens: 200, temperature: 0.7 },
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        const errMsg = data.error?.message || `API error (${res.status})`
        console.error('Gemini API error:', errMsg)
        setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ ${errMsg}` }])
      } else {
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that. Try again!"
        setMessages(prev => [...prev, { role: 'assistant', text: reply }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: "Oops, something went wrong. Try again in a moment!" }])
    }
    setLoading(false)
  }

  return (
    <>
      {/* Chat button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          open
            ? 'bg-muted text-foreground rotate-0'
            : 'bg-accent text-accent-foreground shadow-accent/30 hover:scale-110'
        }`}
      >
        {open ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border/30 bg-card shadow-2xl shadow-black/20 overflow-hidden animate-fade-in-up flex flex-col" style={{ height: '440px' }}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/20 flex items-center gap-3 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center">
              <span className="text-accent-foreground text-xs">🧠</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Ask Kranthi</p>
              <p className="text-[10px] text-muted-foreground">Powered by Gemini AI</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[9px] text-green-500 font-mono">online</span>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-accent text-accent-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {['What does Kranthi do?', 'Tech stack?', 'How to contact?'].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); setTimeout(() => inputRef.current?.form?.requestSubmit(), 0) }}
                  className="px-2.5 py-1 rounded-full bg-muted/50 border border-border/20 text-[10px] text-muted-foreground hover:text-foreground transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={sendMessage} className="px-3 py-3 border-t border-border/20 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about Kranthi..."
              className="flex-1 bg-muted/30 border border-border/20 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent/40"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-40"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
