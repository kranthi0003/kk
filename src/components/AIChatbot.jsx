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
- KEEP IT SHORT. 1-2 sentences max. No essays. Think tweet-length.
- Answer the question directly, then stop. Don't over-explain or add context nobody asked for.
- Skip intros like "Great question!" or "Sure thing!" — just answer.
- No emojis unless it genuinely adds something.
- Don't list everything — pick the most relevant 2-3 things.
- If someone asks "what does Kranthi do?", one line: role + company + one cool detail. Done.
- Sound like a friend giving a quick answer, not a Wikipedia article.
- Never make up facts about Kranthi.
- If you don't know, say "not sure about that" and move on.`

export default function AIChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hey! I know a thing or two about Kranthi. Ask me anything — work, skills, projects, whatever." }
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
  useEffect(() => () => { if (typingRef.current) clearTimeout(typingRef.current) }, [])

  const typeReply = (fullText) => {
    setTyping(true)
    setMessages(prev => [...prev, { role: 'assistant', text: '', typing: true }])
    let i = 0
    const baseSpeed = Math.max(20, Math.min(45, 2500 / fullText.length))
    
    const tick = () => {
      i++
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', text: fullText.slice(0, i), typing: true }
        return updated
      })
      if (i >= fullText.length) {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', text: fullText }
          return updated
        })
        setTyping(false)
        return
      }
      // Variable speed — pause longer at punctuation, faster on spaces
      const char = fullText[i - 1]
      let delay = baseSpeed + Math.random() * 15
      if (char === '.' || char === '!' || char === '?') delay += 120
      else if (char === ',') delay += 60
      else if (char === ' ') delay = baseSpeed * 0.5
      typingRef.current = setTimeout(tick, delay)
    }
    
    typingRef.current = setTimeout(tick, 300) // initial pause before typing starts
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
          max_tokens: 150,
          temperature: 0.6,
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
      {/* Minimal chat trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          open
            ? 'bg-foreground/10 text-foreground backdrop-blur-sm'
            : 'bg-foreground text-background hover:scale-105'
        }`}
      >
        {open ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
            <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
          </svg>
        )}
      </button>

      {/* Chat window — clean & minimal */}
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[350px] max-w-[calc(100vw-2rem)] rounded-xl border border-border/40 bg-card shadow-xl overflow-hidden flex flex-col animate-fade-in-up" style={{ height: '460px' }}>
          
          {/* Header — simple */}
          <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-foreground">Ask Kranthi</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMessages([{ role: 'assistant', text: "Fresh chat. What do you want to know about Kranthi?" }])}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title="New chat"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages — clean layout */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-foreground text-background rounded-2xl rounded-br-sm'
                    : 'text-foreground rounded-2xl rounded-bl-sm bg-muted/50'
                }`}>
                  {msg.text}{msg.typing && <span className="inline-block w-[2px] h-3.5 bg-foreground/60 ml-0.5 animate-pulse align-middle" />}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted/50 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick questions — minimal pills */}
          {messages.length <= 1 && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {['What does Kranthi do?', 'Skills & stack', 'Projects', 'Contact'].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); setTimeout(() => inputRef.current?.form?.requestSubmit(), 0) }}
                  className="px-3 py-1 rounded-full text-[11px] text-muted-foreground border border-border/30 hover:border-foreground/20 hover:text-foreground transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input — clean */}
          <form onSubmit={sendMessage} className="px-3 pb-3 pt-0 flex items-center gap-2 flex-shrink-0">
            <div className="flex-1 flex items-center bg-muted/30 border border-border/30 rounded-lg px-3 py-2 focus-within:border-foreground/20 transition-colors">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask something..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none"
                disabled={loading || typing}
              />
              <button
                type="submit"
                disabled={loading || typing || !input.trim()}
                className="ml-2 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
