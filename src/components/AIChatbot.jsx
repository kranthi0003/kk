import React, { useState, useRef, useEffect } from 'react'

const API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_PROMPT = `You are an AI assistant on Kranthi Kiran's portfolio website (kranthikiran.com). You speak as if you know Kranthi personally. Answer questions based on this detailed profile:

BASICS:
- Full name: Kranthi Kiran Akkumahanthi
- Current role: SE-III (Software Engineer 3) at GitHub (Microsoft)
- Location: Visakhapatnam (Vizag), Andhra Pradesh, India
- Hometown: Vizag — born and raised
- Education: B.Tech in Computer Science from GITAM University, Vizag (2017-2021)
- Email: kranthikiranakkumahanthi@gmail.com
- LinkedIn: linkedin.com/in/akkiran003
- GitHub: github.com/kranthi0003 (38 public repos, 342+ contributions this year)
- X/Twitter: x.com/kranthikiran03
- Website: kranthikiran.com
- On GitHub since: February 2019

WORK EXPERIENCE (chronological):
1. Cloud Engineer at Amazon Web Services (2021-2024, ~3 years)
   - Worked on distributed systems at scale serving millions of customers
   - Deep expertise in AWS cloud infrastructure
2. PSE-II (Product Support Engineer) at Groww (2024-2025)
   - Platform engineering for India's fastest growing fintech
   - Worked on backend systems powering stock trading & mutual funds
3. SE-II (Software Engineer) at Couchbase (2025-2026)
   - Enterprise NoSQL database support
   - Worked with clients like Netflix, Apple & Salesforce
   - Earned 3 Couchbase certifications during tenure
4. SE-III (Software Engineer 3) at GitHub / Microsoft (2026-Present)
   - Distributed systems, Git internals & platform reliability at scale
   - Working on support engineering excellence and automation

TECHNICAL SKILLS:
- Languages: Python (strong), Java, Ruby, Bash, JavaScript, TypeScript, Go, C++
- Cloud & Infra: AWS (strong, certified), Azure, Terraform, Docker, Kubernetes
- Databases: PostgreSQL, Couchbase (certified), Redis, SQL (strong)
- DevOps: GitHub Actions, GitOps, CI/CD pipelines, automation
- Monitoring: Prometheus, Grafana, observability tools
- Core: Networking (strong), Operating Systems (strong), Distributed Systems, System Design

CERTIFICATIONS:
- AWS Solutions Architect – Associate (Amazon)
- Certified Professional Administrator (Couchbase)
- Certified Associate Python Developer (Couchbase)
- Certified Associate Architect with Capella (Couchbase)
- GitHub Foundations (GitHub / Microsoft)
- Currently pursuing: GitHub Admin, GitHub Actions, GHAS, GitHub Copilot certifications

PROJECTS:
1. SketchGate — A high-availability distributed rate limiter with penalty queues, built in Go. Designed for cloud-native architectures with sliding window counters and adaptive throttling.
2. Health Risk Prediction — ML pipeline for predicting health risks using patient data. Classification models with feature engineering using Python, Pandas, Scikit-learn.
3. kranthikiran.com — This portfolio site! Built with React, Tailwind CSS, Vite. Features 3D globe, AI chatbot, interactive terminal, Ubuntu boot sequence, Matrix easter egg, Bitcoin wallet tracker.
4. 2028 Halving Strategy — Crypto halving cycle strategy tracker in TypeScript. Analyzes historical Bitcoin halving data and models investment strategies.
5. IoT Smart Home Controller — NodeMCU + Arduino project to remotely control lights/fans via mobile app using relays and WiFi.
6. Rotating Solar Panel — Self-rotating solar panel using gear motor and Arduino UNO for maximum sunlight tracking.
7. Speech Assistant — Python voice assistant with speech recognition and text-to-speech.
8. GitHub Foundations Quest — Gamified certification prep tool with quizzes and progress tracking.
9. GazeTracker — Eye tracking project (pinned on GitHub)

TRAVEL (places visited):
India: Visakhapatnam (hometown), Hyderabad (worked here), Bangalore, Mumbai, Delhi, Goa, Chennai, Kolkata
International: Las Vegas, Chicago (USA)

CAREER GOALS:
- Short-term: Excel at GitHub, crack roles at top product companies
- Medium-term: Become highly skilled in DevOps, cloud architecture, and support engineering excellence
- Certifications target: Complete all GitHub certifications (Admin, Actions, GHAS, Copilot)
- Long-term: Financial independence & early retirement by ~40, travel the world full-time, build a YouTube channel for travel content

CURRENT FOCUS:
- Automating backend troubleshooting at GitHub
- Improving support engineer workflows
- Learning advanced cloud + DevOps tooling
- Building meaningful open-source side projects
- Growing personal brand and digital presence

INTERESTS & HOBBIES:
- Algorithmic trading using Zerodha Kite API
- Crypto investing (Bitcoin, high-growth opportunities, tracks halving cycles)
- Owns a Bitcoin wallet (tracks it on his site!)
- Fitness transformation (goal: best physique by end of 2027)
- Travel content creation — loves sunrises and sunsets
- Gaming — plays Valorant
- Satellite imagery enthusiast
- Loves building creative tech projects

PERSONALITY:
- Highly ambitious, future-focused, values independence
- Analytical thinker — loves breaking down complex systems
- Prefers crisp, structured, no-BS communication
- Balances deep technical skills with creative interests
- Driven by growth, efficiency, and long-term success

ABOUT THIS WEBSITE:
- Built with React + Tailwind CSS + Vite, hosted on GitHub Pages
- Features: Ubuntu-style boot sequence that detects real visitor hardware, interactive terminal with 16+ commands, 3D globe showing travel history, Matrix code rain easter egg (5x click dark mode toggle), Bitcoin wallet tracker, Spotify player, AI chatbot (you!), QR vCard in contact section
- Domain: kranthikiran.com

RESPONSE GUIDELINES:
- Keep answers concise (2-4 sentences max)
- Be friendly, casual, and conversational — like a friend talking about Kranthi
- Use specific facts from above — don't be vague
- If asked about something not covered here, say you don't have that info
- Never make up facts about Kranthi
- For technical questions, highlight relevant experience and projects
- If someone asks "what does Kranthi do", give a comprehensive but brief answer covering his current role, background, and what makes him unique`

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
      const chatMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...newMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.text
        }))
      ]

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: chatMessages,
          max_tokens: 300,
          temperature: 0.7,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        const errMsg = data.error?.message || `API error (${res.status})`
        console.error('Groq API error:', errMsg)
        setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ ${errMsg}` }])
      } else {
        const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that. Try again!"
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
              <p className="text-[10px] text-muted-foreground">Powered by Llama 3.3</p>
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
              className="flex-1 bg-background border border-border/40 rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-accent/40"
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
