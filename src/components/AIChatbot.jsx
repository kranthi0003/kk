import React, { useState, useRef, useEffect } from 'react'
import { groqChat } from '../lib/groq'

const SYSTEM_PROMPT = `You are an AI assistant on Kranthi Kiran's portfolio website (kranthikiran.com). You speak as if you know Kranthi personally. Answer questions based on this detailed profile:

BASICS:
- Full name: Kranthi Kiran Akkumahanthi
- Goes by: Kiran (what people close to him call him; the site greets visitors as "Kiran")
- Current role: SE-III (Software Engineer 3) at GitHub (Microsoft)
- Location: Visakhapatnam (Vizag), Andhra Pradesh, India
- Hometown: Vizag — born and raised
- Education: B.Tech in Computer Science from GITAM University, Vizag (2017-2021)
- Email: kranthikiranakkumahanthi@gmail.com
- LinkedIn: linkedin.com/in/akkiran003
- GitHub: github.com/kranthi0003 (very active — thousands of contributions a year)
- X/Twitter: x.com/kranthikiran03
- Website: kranthikiran.com
- On GitHub since: February 2019

WORK EXPERIENCE (chronological):
1. Cloud Engineer at Amazon Web Services (2021-2025, ~4 years)
   - Worked on distributed systems at scale serving millions of customers
   - Deep expertise in AWS cloud infrastructure
2. SE-II (Software Engineer) at Couchbase (2025-2026)
   - Enterprise NoSQL database support
   - Worked with clients like Netflix, Apple & Salesforce
   - Earned 3 Couchbase certifications during tenure
3. SE-III (Software Engineer 3) at GitHub / Microsoft (2026-Present)
   - Distributed systems, Git internals & platform reliability at scale
   - Working on engineering excellence and automation

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
- GitHub Administration (GitHub / Microsoft)
- GitHub Actions (GitHub / Microsoft)
- Currently pursuing: GHAS, GitHub Copilot certifications

PROJECTS:
1. SketchGate — A high-availability distributed rate limiter with penalty queues, built in Go. Designed for cloud-native architectures with sliding window counters and adaptive throttling.
2. Health Risk Prediction — ML pipeline for predicting health risks using patient data. Classification models with feature engineering using Python, Pandas, Scikit-learn.
3. kranthikiran.com — This portfolio site! Built with React, Tailwind CSS, Vite. Features an interactive travel map, AI chatbot, interactive terminal, Ubuntu boot sequence, Matrix easter egg, Bitcoin wallet tracker.
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
- Medium-term: Become highly skilled in DevOps, cloud architecture, and engineering excellence
- Certifications target: Complete all GitHub certifications (Admin, Actions, GHAS, Copilot)
- Long-term: Financial independence & early retirement by ~40, travel the world full-time, build a YouTube channel for travel content

CURRENT FOCUS:
- Automating backend troubleshooting at GitHub
- Improving engineering workflows
- Learning advanced cloud + DevOps tooling
- Building meaningful open-source side projects
- Growing personal brand and digital presence

INTERESTS & HOBBIES:
- Algorithmic trading using Zerodha Kite API
- Crypto investing (Bitcoin, high-growth opportunities, tracks halving cycles)
- Owns a Bitcoin wallet (tracks it on his site!)
- Fitness — on a focused 6-month body transformation he calls "The Lock-In" (home gym + calorie-deficit diet + skincare + daily discipline), tracked in a private Transformation HQ on the site. Goal: leanest, sharpest shape.
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
- Domain: kranthikiran.com
- Uses Groq API (Llama 3.1 8B) for AI chatbot and shell translator
- Uses Supabase for guestbook storage and live visitor presence tracking

SITE FEATURES (everything on the site):
1. Boot Sequence — neofetch-style terminal boot that detects real visitor hardware (CPU, GPU, RAM, browser, network). Shows on first visit, skipped after.
2. Two-line Navbar — Line 1: Logo, centered nav links, search bar, wallet, spotify, status monitor, theme toggle. Line 2: Action bar with 9 icon buttons (see below).
3. Command Palette (press / or Cmd+K) — macOS Spotlight-style search with 60+ searchable actions. Frosted glass UI, keyboard nav, covers every feature on the site.
4. Admin Mode — type "kk2026" in search bar + Enter to unlock admin features (visitor dashboard, guestbook moderation). Green badge shows when active.
5. AI Chatbot (you!) — bottom-right floating button. Knows everything about Kranthi. Typing effect, suggestion pills, sessionStorage cache.
6. Interactive Terminal — AI Shell Translator (English → shell commands), Architecture Diagram Generator ("design twitter"), 4 games (Snake, Tic-Tac-Toe, Wordle with tech words, Memory). Rotating prompt suggestions.
7. Travel Map — a hand-drawn dark map of India marking places Kranthi has visited (home base: Vizag), plus temples/pilgrimage spots and a few trips abroad (LA, Vegas, Chicago, Mauritius).
8. Bitcoin Wallet Tracker — navbar dropdown showing live BTC balance, USD value, transaction count. Uses blockchain.info API.
9. Ambient Radio — a YouTube-powered ambient/chill music player in the navbar that keeps playing across the whole site (it pauses itself on the Lock-In page).
10. Status Monitor — navbar dropdown with ECG heartbeat canvas, live metrics (FCP, TTFB, DOM load, resource count, JS heap memory). Pings every 750ms.
11. Guestbook — Supabase-backed visitor messages (280 char limit). Hidden admin mode for deleting messages.
12. Live Visitor Counter — Supabase Realtime Presence, shows "X viewing now" badge when 2+ visitors online.
13. Visitor Dashboard (admin only) — shows each visitor's country/city (IP geolocation), device, browser, OS, referrer, current section they're viewing, time on site. Ctrl+Shift+V or admin mode.
14. Changelog Feed — inline section showing last 4 commits from GitHub API, grouped with dot timeline. "View changelog" opens full 30-commit modal with date grouping and commit tags (New/Fix/Update/Remove).
15. About Section — Apple-style bento grid: profile card, Spotify embed, live clock, "Currently" status, Instagram embed, rotating quotes, site stats.
16. Stack & Credentials — 4-column bento cards for skills + gradient certification pills with tag badges.
17. Projects — 5 OS-styled terminal window cards: DeployDiff (WIP), CronExplain (WIP), StrangerChat, SketchGate, Portfolio site. Traffic light dots, status badges.
18. Connect Section — contact form with social links.
19. Matrix Easter Egg — 5x rapid click on theme toggle triggers Matrix code rain animation.
20. Scroll Progress Bar — thin accent bar at top showing scroll position.
21. Grid Background — faint engineering paper grid across entire site (different opacity for light/dark mode).

RECENT ADDITIONS (2026):
- Transformation HQ — "The 6-Month Lock-In": a personal fitness OS with a daily clock-in, home-gym workouts (each linking a form video), a calorie-deficit diet plan, a skincare routine, a gym playlist, and a progress/monitor dashboard. Reachable from the "Lock-In" item in the navbar.
- Crypto Dashboard — live markets, Bitcoin network stats, a fear/greed gauge, and a live BTC price ticker that updates every couple of seconds. There's also a Bitcoin wallet popup with a scannable QR.
- Blog + a /now page — short essays/reflections and a snapshot of what he's focused on right now.
- Reliability Lab — a live status & observability dashboard.
- The greeting on the homepage rolls "hello" through many languages.

ACTION BAR (Line 2 of navbar, desktop only — 9 icon buttons):
Left side:
- Changelog — opens full commit history modal
- AI Chat — opens chatbot
- Resume — opens CV/PDF viewer
- QR vCard — generates scannable QR code with contact info + downloadable .vcf file

Right side:
- Surprise Me — random action (starts a game, opens a feature, scrolls somewhere)
- Reading Mode — strips all animations, iframes, canvas. Narrows content to 720px for clean reading/printing. Bottom bar shows exit instructions.
- Speed Test — dark modal with performance grade (A+ to D), visual progress bars for FCP/TTFB/DOM/Load/Transfer, stats grid.
- Share Card — generates branded 1200×630 social media card with 4 themes (Dark, Ocean, Purple, Minimal). Shows name, title, tech tags, URLs. Download PNG or copy to clipboard.
- Hire Me — opens pre-filled recruiter email template with role/company/location fields.

KEYBOARD SHORTCUTS:
- / or Cmd+K — Open command palette search
- Ctrl+Shift+V — Open visitor dashboard (admin)
- Esc — Close any modal/palette
- Arrow keys + Enter — Navigate command palette results

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

  const ALL_SUGGESTIONS = [
    'What does Kranthi do?', 'Skills & stack', 'Projects', 'Contact info',
    'Career journey?', 'Certifications?', 'Where has he traveled?',
    'What is SketchGate?', 'Hobbies?', 'Current role?',
    'Education?', 'Favorite tech?', 'Career goals?',
    'Work at Amazon?', 'Why GitHub?', 'Bitcoin?',
    'The 6-month Lock-In?', 'DevOps tools?', 'Work style?',
    "What's on this site?", 'Time at Couchbase?', 'Fitness goals?',
  ]
  // Cycle through the questions (shuffled) three at a time, so the pills never
  // repeat until every one has been shown.
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]] } return a }
  const poolRef = useRef(null)
  const posRef = useRef(0)
  if (!poolRef.current) poolRef.current = shuffle(ALL_SUGGESTIONS)
  const takeThree = () => {
    if (posRef.current + 3 > poolRef.current.length) { poolRef.current = shuffle(ALL_SUGGESTIONS); posRef.current = 0 }
    const out = poolRef.current.slice(posRef.current, posRef.current + 3)
    posRef.current += 3
    return out
  }
  const [suggestions, setSuggestions] = useState(() => takeThree())

  const rotateSuggestions = () => setSuggestions(takeThree())

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

    // Check cache first
    const cacheKey = `chat_${msg.toLowerCase()}`
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      typeReply(cached)
      rotateSuggestions()
      return
    }

    setLoading(true)

    try {
      const chatMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...newMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.text
        }))
      ]

      const data = await groqChat(chatMessages, { max_tokens: 150, temperature: 0.6 })

      setLoading(false)
      if (data.error) {
        if (data.error.message?.includes('rate')) {
          const wait = data.error.message?.match(/(\d+\.?\d*)s/)?.[1]
          const secs = Math.ceil(parseFloat(wait) || 10)
          setMessages(prev => [...prev, { role: 'assistant', text: `Whoa, too many questions! Give me ${secs}s to catch my breath 😮‍💨` }])
        } else {
          setMessages(prev => [...prev, { role: 'assistant', text: "Something went wrong on my end. Try again in a sec." }])
        }
        console.error('Groq API error:', data.error?.message)
      } else {
        const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that. Try again!"
        sessionStorage.setItem(cacheKey, reply)
        typeReply(reply)
        rotateSuggestions()
      }
    } catch {
      setLoading(false)
      setMessages(prev => [...prev, { role: 'assistant', text: "Oops, something went wrong. Try again in a moment!" }])
    }
  }

  const [nudge, setNudge] = useState(false)

  // Show nudge tooltip after 8 seconds if chat hasn't been opened
  useEffect(() => {
    if (sessionStorage.getItem('chat_nudged')) return
    const timer = setTimeout(() => {
      if (!open) {
        setNudge(true)
        sessionStorage.setItem('chat_nudged', '1')
        setTimeout(() => setNudge(false), 6000)
      }
    }, 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {/* Nudge tooltip */}
      {nudge && !open && (
        <div className="fixed bottom-20 right-6 z-50 animate-fade-in-up">
          <div className="relative bg-foreground text-background px-4 py-2.5 rounded-xl shadow-lg max-w-[200px]">
            <p className="text-xs font-medium">Hey! Ask me anything about Kranthi 👋</p>
            <div className="absolute -bottom-1.5 right-5 w-3 h-3 bg-foreground rotate-45" />
            <button onClick={() => setNudge(false)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-muted text-foreground flex items-center justify-center text-[10px] hover:bg-border transition-colors">✕</button>
          </div>
        </div>
      )}

      {/* Chat trigger */}
      <button
        onClick={() => { setOpen(o => !o); setNudge(false) }}
        data-chatbot-btn
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          open
            ? 'bg-foreground/10 text-foreground backdrop-blur-sm'
            : 'bg-foreground text-background hover:scale-105'
        }`}
      >
        {!open && !nudge && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
        )}
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

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[372px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden flex flex-col animate-fade-in-up"
          style={{
            height: '520px', maxHeight: 'calc(100vh - 7rem)',
            background: 'color-mix(in oklab, var(--color-card) 94%, transparent)',
            border: '1px solid color-mix(in oklab, var(--color-border) 70%, transparent)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 24px 70px -16px rgba(0,0,0,.6)',
          }}>

          {/* Header */}
          <div className="px-4 py-3 flex items-center justify-between flex-shrink-0 border-b"
            style={{ borderColor: 'color-mix(in oklab, var(--color-border) 50%, transparent)', background: 'linear-gradient(180deg, color-mix(in oklab, var(--color-accent) 9%, transparent), transparent)' }}>
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(140deg, var(--color-accent), var(--color-primary))', boxShadow: '0 3px 10px -3px color-mix(in oklab, var(--color-accent) 60%, transparent)' }}>
                <svg className="w-4 h-4" style={{ color: 'var(--color-accent-foreground)' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.7 4.3L18 8l-4.3 1.7L12 14l-1.7-4.3L6 8l4.3-1.7L12 2z" /></svg>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400" style={{ border: '2px solid var(--color-card)' }} />
              </div>
              <div className="leading-tight">
                <div className="text-[13.5px] font-semibold text-foreground">Ask Kranthi</div>
                <div className="text-[10px] text-muted-foreground">AI · usually replies instantly</div>
              </div>
            </div>
            <button
              onClick={() => setMessages([{ role: 'assistant', text: "Fresh chat. What do you want to know about Kranthi?" }])}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title="New chat"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3 scroll-smooth scrollbar-hide">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role !== 'user' && (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
                    style={{ background: 'linear-gradient(140deg, var(--color-accent), var(--color-primary))' }}>
                    <svg className="w-3 h-3" style={{ color: 'var(--color-accent-foreground)' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.4 3.6L17 7l-3.6 1.4L12 12l-1.4-3.6L7 7l3.6-1.4L12 2z" /></svg>
                  </div>
                )}
                <div className={`max-w-[80%] px-3.5 py-2.5 text-[13px] leading-relaxed ${msg.role === 'user' ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'}`}
                  style={msg.role === 'user'
                    ? { background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))', color: 'var(--color-accent-foreground)' }
                    : { background: 'color-mix(in oklab, var(--color-muted) 60%, transparent)', color: 'var(--color-foreground)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-border) 45%, transparent)' }}>
                  {msg.text}{msg.typing && <span className="inline-block w-[2px] h-3.5 bg-foreground/60 ml-0.5 animate-pulse align-middle" />}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(140deg, var(--color-accent), var(--color-primary))' }}>
                  <svg className="w-3 h-3" style={{ color: 'var(--color-accent-foreground)' }} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.4 3.6L17 7l-3.6 1.4L12 12l-1.4-3.6L7 7l3.6-1.4L12 2z" /></svg>
                </div>
                <div className="rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1" style={{ background: 'color-mix(in oklab, var(--color-muted) 60%, transparent)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Suggestion pills */}
          {!loading && !typing && (
            <div className="px-3.5 pb-2 flex flex-wrap gap-1.5">
              {suggestions.map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); setTimeout(() => inputRef.current?.form?.requestSubmit(), 0) }}
                  className="px-3 py-1 rounded-full text-[11px] font-medium transition-all text-muted-foreground hover:text-foreground"
                  style={{ background: 'color-mix(in oklab, var(--color-accent) 7%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 20%, transparent)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'color-mix(in oklab, var(--color-accent) 15%, transparent)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'color-mix(in oklab, var(--color-accent) 7%, transparent)' }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={sendMessage} className="px-3 pb-3 pt-1 flex-shrink-0">
            <style>{`
              .chat-typebox { background: color-mix(in oklab, var(--color-muted) 45%, transparent); box-shadow: inset 0 0 0 1px var(--color-border); }
              .chat-typebox:focus-within { box-shadow: inset 0 0 0 1.5px color-mix(in oklab, var(--color-accent) 55%, transparent), 0 0 0 3px color-mix(in oklab, var(--color-accent) 16%, transparent); }
              .chat-send:not(:disabled):hover { transform: scale(1.08); }
              .chat-send:not(:disabled):active { transform: scale(0.94); }
            `}</style>
            <div className="chat-typebox flex items-center gap-1.5 rounded-full pl-4 pr-1.5 py-1.5 transition-shadow">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask anything…"
                className="flex-1 bg-transparent text-[13.5px] text-foreground placeholder:text-muted-foreground/45 outline-none"
                disabled={loading || typing}
              />
              <button
                type="submit"
                disabled={loading || typing || !input.trim()}
                className="chat-send w-8 h-8 rounded-full grid place-items-center flex-shrink-0 transition-transform disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))', color: 'var(--color-accent-foreground)', boxShadow: '0 2px 8px -2px color-mix(in oklab, var(--color-accent) 55%, transparent)' }}
                aria-label="Send"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                </svg>
              </button>
            </div>
            <div className="text-center text-[9px] text-muted-foreground/45 mt-1.5 font-mono">powered by Groq</div>
          </form>
        </div>
      )}
    </>
  )
}
