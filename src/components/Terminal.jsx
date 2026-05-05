import React, { useState, useRef, useEffect } from 'react'

const colorize = (text, color) => ({ text, color })

const COMMANDS = {
  help: () => ({
    lines: [
      colorize('  Available commands:', '#60a5fa'),
      colorize('', ''),
      colorize('  whoami        ', '#10b981'), colorize('  skills        ', '#10b981'),
      colorize('  experience    ', '#10b981'), colorize('  contact       ', '#10b981'),
      colorize('  projects      ', '#10b981'), colorize('  certs         ', '#10b981'),
      colorize('  social        ', '#10b981'), colorize('  education     ', '#10b981'),
      colorize('  stack         ', '#10b981'), colorize('  achievements  ', '#10b981'),
      colorize('  resume        ', '#10b981'), colorize('  theme         ', '#10b981'),
      colorize('  date          ', '#10b981'), colorize('  weather       ', '#10b981'),
      colorize('  clear         ', '#10b981'), colorize('  sudo hire me  ', '#f59e0b'),
      colorize('', ''),
      colorize('  Navigation: open <section>  (e.g. open projects)', '#64748b'),
    ],
  }),
  whoami: () => ({
    lines: [
      colorize('', ''),
      colorize('  ╭─────────────────────────────────────╮', '#3b82f6'),
      colorize('  │  Kranthi Kiran Akkumahanthi         │', '#e2e8f0'),
      colorize('  │  SE-III @ GitHub | Microsoft        │', '#60a5fa'),
      colorize('  │  📍 Visakhapatnam, India             │', '#94a3b8'),
      colorize('  │  ☁️  Cloud · Distributed Systems     │', '#94a3b8'),
      colorize('  │  🎓 B.Tech Computer Science          │', '#94a3b8'),
      colorize('  ╰─────────────────────────────────────╯', '#3b82f6'),
      colorize('', ''),
    ],
  }),
  skills: () => ({
    lines: [
      colorize('', ''),
      colorize('  ▸ Languages   ', '#f59e0b'), colorize('    Python · Java · Ruby · Bash', '#e2e8f0'),
      colorize('  ▸ Cloud       ', '#06b6d4'), colorize('    AWS · Azure · Terraform', '#e2e8f0'),
      colorize('  ▸ DevOps      ', '#8b5cf6'), colorize('    Docker · K8s · GitHub Actions', '#e2e8f0'),
      colorize('  ▸ Databases   ', '#ef4444'), colorize('    PostgreSQL · Couchbase · Redis', '#e2e8f0'),
      colorize('  ▸ Monitoring  ', '#10b981'), colorize('    Prometheus · Grafana', '#e2e8f0'),
      colorize('  ▸ Tools       ', '#ec4899'), colorize('    Git · Linux · VSCode · Copilot', '#e2e8f0'),
      colorize('', ''),
    ],
  }),
  experience: () => ({
    lines: [
      colorize('', ''),
      colorize('  ┌─ 🟣 GitHub      SE-III          2026–Present', '#8b5cf6'),
      colorize('  │    Distributed systems, Git internals, platform reliability', '#94a3b8'),
      colorize('  ├─ 🔴 Couchbase   SE-II           2025–2026', '#ef4444'),
      colorize('  │    Enterprise NoSQL for Netflix, Apple, Salesforce', '#94a3b8'),
      colorize('  ├─ 🟢 Groww       PSE-II          2024–2025', '#22c55e'),
      colorize('  │    Platform engineering for India\'s top fintech', '#94a3b8'),
      colorize('  └─ 🟡 Amazon      Cloud Engineer  2021–2024', '#f59e0b'),
      colorize('       Distributed systems at scale, CI/CD, monitoring', '#94a3b8'),
      colorize('', ''),
    ],
  }),
  contact: () => ({
    lines: [
      colorize('', ''),
      colorize('  📧  kranthikiranakkumahanthi@gmail.com', '#60a5fa'),
      colorize('  📱  +91 93988 57319', '#e2e8f0'),
      colorize('  🔗  linkedin.com/in/akkiran003', '#0077b5'),
      colorize('  🐙  github.com/kranthi0003', '#e2e8f0'),
      colorize('  𝕏   x.com/kranthikiran03', '#94a3b8'),
      colorize('  🌐  kranthikiran.com', '#10b981'),
      colorize('', ''),
    ],
  }),
  projects: () => ({
    lines: [
      colorize('', ''),
      colorize('  01  SketchGate         AI image classifier         Python/TF', '#60a5fa'),
      colorize('  02  Health Risk        ML prediction model         Python/ML', '#10b981'),
      colorize('  03  Portfolio          this site!                  React', '#8b5cf6'),
      colorize('  04  IoT Smart Home     ESP32 automation            C++/IoT', '#f59e0b'),
      colorize('  05  Solar Tracker      rotating solar panel        Arduino', '#ef4444'),
      colorize('', ''),
      colorize('  → type "open projects" to browse all', '#64748b'),
      colorize('', ''),
    ],
  }),
  certs: () => ({
    lines: [
      colorize('', ''),
      colorize('  ✅  AWS Solutions Architect – Associate', '#f59e0b'),
      colorize('  ✅  Couchbase Professional Admin', '#ef4444'),
      colorize('  ✅  Couchbase Python Developer', '#ef4444'),
      colorize('  ✅  Couchbase Architect with Capella', '#ef4444'),
      colorize('  ✅  GitHub Foundations', '#8b5cf6'),
      colorize('', ''),
    ],
  }),
  social: () => ({
    lines: [
      colorize('', ''),
      colorize('  LinkedIn   ', '#0077b5'), colorize('  linkedin.com/in/akkiran003', '#e2e8f0'),
      colorize('  GitHub     ', '#e2e8f0'), colorize('  github.com/kranthi0003', '#94a3b8'),
      colorize('  X/Twitter  ', '#94a3b8'), colorize('  x.com/kranthikiran03', '#e2e8f0'),
      colorize('  Spotify    ', '#1db954'), colorize('  check the 🎵 in navbar!', '#94a3b8'),
      colorize('', ''),
    ],
  }),
  education: () => ({
    lines: [
      colorize('', ''),
      colorize('  🎓 B.Tech in Computer Science', '#60a5fa'),
      colorize('     GITAM University, Visakhapatnam', '#e2e8f0'),
      colorize('     2017 – 2021', '#94a3b8'),
      colorize('', ''),
    ],
  }),
  stack: () => ({
    lines: [
      colorize('', ''),
      colorize('  This site is built with:', '#60a5fa'),
      colorize('', ''),
      colorize('  ⚡ Vite           fast build tool', '#f59e0b'),
      colorize('  ⚛️  React          UI framework', '#61dafb'),
      colorize('  🎨 Tailwind CSS   utility-first CSS', '#06b6d4'),
      colorize('  🌍 react-globe.gl 3D globe', '#10b981'),
      colorize('  📊 qrcode.react   QR vCard generator', '#8b5cf6'),
      colorize('  🚀 GitHub Pages   hosting', '#e2e8f0'),
      colorize('', ''),
      colorize('  Source: github.com/kranthi0003/kranthi-kiran-site', '#64748b'),
      colorize('', ''),
    ],
  }),
  achievements: () => ({
    lines: [
      colorize('', ''),
      colorize('  🏆 2026  Joined GitHub as SE-III', '#8b5cf6'),
      colorize('  📜 2025  5x Certifications (AWS, Couchbase, GitHub)', '#f59e0b'),
      colorize('  🚀 2024  Joined Groww — platform engineering', '#22c55e'),
      colorize('  ☁️  2021  First job — Cloud Engineer at Amazon', '#ef4444'),
      colorize('  🎓 2021  Graduated B.Tech CS from GITAM', '#60a5fa'),
      colorize('', ''),
    ],
  }),
  date: () => ({
    lines: [
      colorize('', ''),
      colorize(`  ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, '#e2e8f0'),
      colorize(`  ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST`, '#60a5fa'),
      colorize('', ''),
    ],
  }),
  weather: () => ({
    lines: [
      colorize('', ''),
      colorize('  📍 Visakhapatnam, India', '#e2e8f0'),
      colorize('  🌡️ ~30°C  ☀️ Tropical, humid', '#f59e0b'),
      colorize('  💨 Coastal breeze  🌊 Bay of Bengal', '#06b6d4'),
      colorize('', ''),
      colorize('  (static data — I wish I had a weather API budget 😅)', '#64748b'),
      colorize('', ''),
    ],
  }),
  theme: () => {
    document.documentElement.classList.toggle('dark')
    const isDark = document.documentElement.classList.contains('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
    return {
      lines: [
        colorize('', ''),
        colorize(`  Switched to ${isDark ? '🌙 dark' : '☀️ light'} mode`, '#10b981'),
        colorize('', ''),
      ],
    }
  },
  resume: () => {
    return {
      lines: [
        colorize('', ''),
        colorize('  Opening resume viewer...', '#10b981'),
        colorize('', ''),
      ],
      action: 'resume',
    }
  },
  'sudo hire me': () => ({
    lines: [
      colorize('', ''),
      colorize('  ██╗  ██╗██╗██████╗ ███████╗██████╗ ██╗', '#10b981'),
      colorize('  ██║  ██║██║██╔══██╗██╔════╝██╔══██╗██║', '#10b981'),
      colorize('  ███████║██║██████╔╝█████╗  ██║  ██║██║', '#22c55e'),
      colorize('  ██╔══██║██║██╔══██╗██╔══╝  ██║  ██║╚═╝', '#22c55e'),
      colorize('  ██║  ██║██║██║  ██║███████╗██████╔╝██╗', '#4ade80'),
      colorize('  ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝', '#4ade80'),
      colorize('', ''),
      colorize('  📧 kranthikiranakkumahanthi@gmail.com', '#60a5fa'),
      colorize('  Let\'s build something awesome together! 🚀', '#e2e8f0'),
      colorize('', ''),
    ],
  }),
}

const SCROLL_COMMANDS = {
  'open projects': 'projects',
  'open experience': 'experience',
  'open about': 'about',
  'open connect': 'connect',
  'open home': 'home',
  'open travel': 'travel',
  'open certs': 'certifications',
}

export default function Terminal() {
  const [history, setHistory] = useState([
    { type: 'output', lines: [
      colorize('', ''),
      colorize('  ╭──────────────────────────────────────╮', '#3b82f6'),
      colorize('  │   Welcome to kranthi.sh  v2.0.0      │', '#e2e8f0'),
      colorize('  │   Type "help" to get started          │', '#94a3b8'),
      colorize('  ╰──────────────────────────────────────╯', '#3b82f6'),
      colorize('', ''),
    ]},
  ])
  const [input, setInput] = useState('')
  const [cmdHistory, setCmdHistory] = useState([])
  const [historyIdx, setHistoryIdx] = useState(-1)
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
    if (!cmd) return

    const newHistory = [...history, { type: 'input', text: cmd }]
    setCmdHistory(prev => [cmd, ...prev])
    setHistoryIdx(-1)

    if (cmd === 'clear') {
      setHistory([])
      setInput('')
      return
    }

    if (SCROLL_COMMANDS[cmd]) {
      const el = document.getElementById(SCROLL_COMMANDS[cmd])
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      newHistory.push({ type: 'output', lines: [colorize(`  → scrolling to ${SCROLL_COMMANDS[cmd]}...`, '#10b981')] })
    } else if (COMMANDS[cmd]) {
      const result = COMMANDS[cmd]()
      newHistory.push({ type: 'output', lines: result.lines })
      if (result.action === 'resume') {
        const btn = document.querySelector('[data-resume-btn]')
        if (btn) setTimeout(() => btn.click(), 300)
      }
    } else {
      newHistory.push({ type: 'output', lines: [
        colorize(`  command not found: ${cmd}`, '#ef4444'),
        colorize('  type "help" for available commands', '#64748b'),
      ]})
    }

    setHistory(newHistory)
    setInput('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (cmdHistory.length > 0) {
        const newIdx = Math.min(historyIdx + 1, cmdHistory.length - 1)
        setHistoryIdx(newIdx)
        setInput(cmdHistory[newIdx])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIdx > 0) {
        setHistoryIdx(historyIdx - 1)
        setInput(cmdHistory[historyIdx - 1])
      } else {
        setHistoryIdx(-1)
        setInput('')
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const partial = input.trim().toLowerCase()
      if (partial) {
        const match = Object.keys(COMMANDS).find(c => c.startsWith(partial))
        if (match) setInput(match)
      }
    }
  }

  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="font-mono text-sm text-accent mb-2">Interactive</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">Terminal</h2>
        </div>

        <div className="rounded-2xl border border-border/30 shadow-2xl overflow-hidden" style={{ background: '#0d1117' }}>
          {/* Title bar */}
          <div className="flex items-center px-4 py-3 border-b border-white/5" style={{ background: '#161b22' }}>
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-[11px] text-gray-500 font-mono">kranthi@portfolio:~</span>
            </div>
            <div className="w-12" />
          </div>

          {/* Terminal body */}
          <div
            ref={scrollRef}
            className="p-4 sm:p-5 h-[360px] overflow-y-auto font-mono text-[13px] leading-relaxed cursor-text"
            onClick={() => inputRef.current?.focus()}
          >
            {history.map((entry, i) => (
              <div key={i}>
                {entry.type === 'input' ? (
                  <div className="flex gap-2">
                    <span className="text-green-400 flex-shrink-0">❯</span>
                    <span className="text-gray-200">{entry.text}</span>
                  </div>
                ) : (
                  entry.lines.map((line, j) => (
                    <div key={j} className="whitespace-pre" style={{ color: line.color || '#94a3b8' }}>{line.text}</div>
                  ))
                )}
              </div>
            ))}

            {/* Input line */}
            <form onSubmit={handleSubmit} className="flex gap-2 items-center mt-1">
              <span className="text-green-400 flex-shrink-0">❯</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-gray-200 outline-none caret-green-400 font-mono text-[13px]"
                spellCheck={false}
                autoComplete="off"
                placeholder="type a command..."
              />
            </form>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {['help', 'whoami', 'skills', 'experience', 'sudo hire me'].map(cmd => (
            <button
              key={cmd}
              onClick={() => { setInput(cmd); inputRef.current?.focus() }}
              className="px-2.5 py-1 rounded-md bg-muted/50 border border-border/20 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-accent/30 transition-all"
            >
              {cmd}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
