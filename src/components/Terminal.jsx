import React, { useState, useRef, useEffect } from 'react'

const COMMANDS = {
  help: () => [
    '  Available commands:',
    '',
    '  whoami        — about me',
    '  skills        — tech stack',
    '  experience    — work history',
    '  contact       — reach me',
    '  projects      — what I built',
    '  certs         — certifications',
    '  social        — social links',
    '  clear         — clear terminal',
    '  sudo hire me  — 😏',
  ],
  whoami: () => [
    '  Kranthi Kiran Akkumahanthi',
    '  SE-III @ GitHub | Microsoft',
    '  📍 Visakhapatnam, India',
    '  ☁️ Cloud · Distributed Systems · DevOps',
    '  🎓 B.Tech Computer Science',
  ],
  skills: () => [
    '  Languages   → Python, Java, Ruby, Bash',
    '  Cloud       → AWS, Azure, Terraform',
    '  DevOps      → Docker, Kubernetes, GitHub Actions',
    '  Databases   → PostgreSQL, Couchbase, Redis',
    '  Monitoring  → Prometheus, Grafana',
    '  Tools       → Git, Linux, VSCode',
  ],
  experience: () => [
    '  ┌─ GitHub      │ SE-III         │ 2026–Present',
    '  ├─ Couchbase   │ SE-II          │ 2025–2026',
    '  ├─ Groww       │ PSE-II         │ 2024–2025',
    '  └─ Amazon      │ Cloud Engineer │ 2021–2024',
  ],
  contact: () => [
    '  📧 kranthikiranakkumahanthi@gmail.com',
    '  📱 +91 93988 57319',
    '  🔗 linkedin.com/in/akkiran003',
    '  🐙 github.com/kranthi0003',
    '  𝕏  x.com/kranthikiran03',
  ],
  projects: () => [
    '  1. SketchGate        — AI image classifier',
    '  2. Health Risk        — ML prediction model',
    '  3. Portfolio          — this site! (React + Tailwind)',
    '  4. IoT Smart Home     — ESP32 automation',
    '  5. Solar Panel        — rotating tracker',
    '  Type "open projects" to scroll there →',
  ],
  certs: () => [
    '  ✅ AWS Solutions Architect – Associate',
    '  ✅ Couchbase Professional Admin',
    '  ✅ Couchbase Python Developer',
    '  ✅ Couchbase Architect with Capella',
    '  ✅ GitHub Foundations',
  ],
  social: () => [
    '  LinkedIn  → linkedin.com/in/akkiran003',
    '  GitHub    → github.com/kranthi0003',
    '  X/Twitter → x.com/kranthikiran03',
    '  Spotify   → check the 🎵 in navbar!',
  ],
  'sudo hire me': () => [
    '',
    '  ██╗  ██╗██╗██████╗ ███████╗██████╗ ',
    '  ██║  ██║██║██╔══██╗██╔════╝██╔══██╗',
    '  ███████║██║██████╔╝█████╗  ██║  ██║',
    '  ██╔══██║██║██╔══██╗██╔══╝  ██║  ██║',
    '  ██║  ██║██║██║  ██║███████╗██████╔╝',
    '  ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝╚═════╝ ',
    '',
    '  📧 kranthikiranakkumahanthi@gmail.com',
    '  Let\'s build something awesome together!',
    '',
  ],
}

const SCROLL_COMMANDS = {
  'open projects': 'projects',
  'open experience': 'experience',
  'open about': 'about',
  'open connect': 'connect',
  'open home': 'home',
}

export default function Terminal() {
  const [history, setHistory] = useState([
    { type: 'output', lines: [
      '  Welcome to kranthi.sh v1.0.0',
      '  Type "help" to see available commands.',
      '',
    ]},
  ])
  const [input, setInput] = useState('')
  const inputRef = useRef()
  const scrollRef = useRef()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history])

  const handleSubmit = (e) => {
    e.preventDefault()
    const cmd = input.trim().toLowerCase()
    const newHistory = [...history, { type: 'input', text: cmd }]

    if (cmd === 'clear') {
      setHistory([])
      setInput('')
      return
    }

    if (SCROLL_COMMANDS[cmd]) {
      const el = document.getElementById(SCROLL_COMMANDS[cmd])
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      newHistory.push({ type: 'output', lines: [`  Scrolling to ${SCROLL_COMMANDS[cmd]}...`] })
    } else if (COMMANDS[cmd]) {
      newHistory.push({ type: 'output', lines: COMMANDS[cmd]() })
    } else if (cmd === '') {
      // do nothing
    } else {
      newHistory.push({ type: 'output', lines: [`  command not found: ${cmd}`, '  Type "help" for available commands.'] })
    }

    setHistory(newHistory)
    setInput('')
  }

  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="font-mono text-sm text-accent mb-2">Interactive</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">Terminal</h2>
        </div>

        <div className="rounded-2xl border border-border/30 shadow-2xl overflow-hidden bg-[#0d1117]">
          {/* Title bar */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="text-[11px] text-gray-500 font-mono ml-2">kranthi@portfolio ~ %</span>
          </div>

          {/* Terminal body */}
          <div
            ref={scrollRef}
            className="p-4 h-[320px] overflow-y-auto font-mono text-sm"
            onClick={() => inputRef.current?.focus()}
          >
            {history.map((entry, i) => (
              <div key={i} className="mb-1">
                {entry.type === 'input' ? (
                  <div className="flex gap-2">
                    <span className="text-green-400 flex-shrink-0">❯</span>
                    <span className="text-gray-300">{entry.text}</span>
                  </div>
                ) : (
                  entry.lines.map((line, j) => (
                    <div key={j} className="text-gray-400 leading-relaxed whitespace-pre">{line}</div>
                  ))
                )}
              </div>
            ))}

            {/* Input line */}
            <form onSubmit={handleSubmit} className="flex gap-2 items-center">
              <span className="text-green-400 flex-shrink-0">❯</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent text-gray-200 outline-none caret-green-400 font-mono text-sm"
                spellCheck={false}
                autoComplete="off"
                placeholder="type a command..."
              />
            </form>
          </div>
        </div>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-4 font-mono">
          try: help · whoami · skills · sudo hire me
        </p>
      </div>
    </section>
  )
}
