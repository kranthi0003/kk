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
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef()
  const inputRef = useRef()
  const typingRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, typing])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  // Cleanup typing interval on unmount
  useEffect(() => () => { if (typingRef.current) clearInterval(typingRef.current) }, [])

  const typeReply = (fullText) => {
    setTyping(true)
    setMessages(prev => [...prev, { role: 'assistant', text: '', typing: true }])
    let i = 0
    const speed = Math.max(12, Math.min(30, 1500 / fullText.length))
    typingRef.current = setInterval(() => {
      i++
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', text: fullText.slice(0, i), typing: true }
        return updated
      })
      if (i >= fullText.length) {
        clearInterval(typingRef.current)
        typingRef.current = null
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', text: fullText }
          return updated
        })
        setTyping(false)
      }
    }, speed)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    const msg = input.trim()
    if (!msg || loading || typing) return

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
      setLoading(false)
      if (!res.ok) {
        const errMsg = data.error?.message || `API error (${res.status})`
        console.error('Groq API error:', errMsg)
        setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ ${errMsg}` }])
      } else {
        const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that. Try again!"
        typeReply(reply)
      }
    } catch {
      setLoading(false)
      setMessages(prev => [...prev, { role: 'assistant', text: "Oops, something went wrong. Try again in a moment!" }])
    }
  }

  return (
    <>
      {/* Chat button with pulse ring */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          open
            ? 'bg-card text-foreground border border-border/30 scale-90'
            : 'bg-gradient-to-br from-accent to-primary text-white hover:scale-110 hover:shadow-accent/40'
        }`}
      >
        {!open && (
          <span className="absolute inset-0 rounded-full bg-accent/30 animate-ping opacity-40" />
        )}
        {open ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        ) : (
          <svg className="w-6 h-6 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-border/30 bg-card shadow-2xl shadow-black/30 overflow-hidden flex flex-col animate-fade-in-up" style={{ height: '500px' }}>
          
          {/* Header — gradient accent bar */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-primary to-accent" />
            <div className="px-4 pt-4 pb-3 flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 border border-accent/30 flex items-center justify-center">
                  <span className="text-lg">🧠</span>
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-heading font-bold text-foreground">Ask Kranthi</p>
                <p className="text-[10px] text-muted-foreground font-mono">llama-3.3-70b · online</p>
              </div>
              <button
                onClick={() => {
                  setMessages([{ role: 'assistant', text: "Hey! I'm Kranthi's AI assistant. Ask me anything about his experience, skills, or projects! 🚀" }])
                }}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                title="Clear chat"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs">🧠</span>
                  </div>
                )}
                <div className={`max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-accent to-primary text-white rounded-2xl rounded-br-lg'
                      : 'bg-muted/60 text-foreground rounded-2xl rounded-bl-lg border border-border/10'
                  }`}>
                    {msg.text}{msg.typing && <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse align-middle" />}
                  </div>
                  <span className="text-[9px] text-muted-foreground/50 mt-1 px-1 font-mono">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs">🧠</span>
                </div>
                <div className="bg-muted/60 rounded-2xl rounded-bl-lg border border-border/10 px-4 py-3 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick questions — show when fresh */}
          {messages.length <= 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {[
                { emoji: '💼', text: 'What does Kranthi do?' },
                { emoji: '🛠️', text: 'Tech stack?' },
                { emoji: '🚀', text: 'Projects?' },
                { emoji: '📬', text: 'How to contact?' },
                { emoji: '🎯', text: 'Career goals?' },
              ].map(q => (
                <button
                  key={q.text}
                  onClick={() => { setInput(q.text); setTimeout(() => inputRef.current?.form?.requestSubmit(), 0) }}
                  className="px-3 py-1.5 rounded-full bg-muted/40 border border-border/20 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/70 hover:border-accent/30 transition-all duration-200"
                >
                  {q.emoji} {q.text}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          <form onSubmit={sendMessage} className="px-3 py-3 border-t border-border/20 flex items-center gap-2 flex-shrink-0 bg-card">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about Kranthi..."
              className="flex-1 bg-muted/30 border border-border/30 rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-accent/50 focus:bg-background transition-all duration-200"
              disabled={loading || typing}
            />
            <button
              type="submit"
              disabled={loading || typing || !input.trim()}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-30 disabled:from-muted disabled:to-muted disabled:text-muted-foreground flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
