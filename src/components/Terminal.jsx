import React, { useState, useRef, useEffect } from 'react'

// Use CSS var tokens instead of hardcoded hex
const T = {
  accent: 'var(--color-accent)',
  fg: 'var(--color-foreground)',
  muted: 'var(--color-muted-foreground)',
  dim: 'color-mix(in srgb, var(--color-muted-foreground) 60%, transparent)',
  green: '#10b981',
  yellow: '#f59e0b',
  cyan: '#06b6d4',
  purple: '#8b5cf6',
  red: '#ef4444',
  pink: '#ec4899',
  blue: '#0077b5',
  spotify: '#1db954',
}

const colorize = (text, color) => ({ text, color })

const COMMANDS = {
  help: () => ({
    lines: [
      colorize('  Available commands:', T.accent),
      colorize('', ''),
      colorize('  whoami        ', T.green), colorize('  skills        ', T.green),
      colorize('  experience    ', T.green), colorize('  contact       ', T.green),
      colorize('  projects      ', T.green), colorize('  certs         ', T.green),
      colorize('  social        ', T.green), colorize('  education     ', T.green),
      colorize('  stack         ', T.green), colorize('  achievements  ', T.green),
      colorize('  resume        ', T.green), colorize('  theme         ', T.green),
      colorize('  date          ', T.green), colorize('  weather       ', T.green),
      colorize('  clear         ', T.green), colorize('  sudo hire me  ', T.yellow),
      colorize('', ''),
      colorize('  Navigation: open <section>  (e.g. open projects)', T.dim),
    ],
  }),
  whoami: () => ({
    lines: [
      colorize('', ''),
      colorize('  ╭─────────────────────────────────────╮', T.accent),
      colorize('  │  Kranthi Kiran Akkumahanthi         │', T.fg),
      colorize('  │  SE-III @ GitHub | Microsoft        │', T.accent),
      colorize('  │  📍 Visakhapatnam, India             │', T.muted),
      colorize('  │  ☁️  Cloud · Distributed Systems     │', T.muted),
      colorize('  │  🎓 B.Tech Computer Science          │', T.muted),
      colorize('  ╰─────────────────────────────────────╯', T.accent),
      colorize('', ''),
    ],
  }),
  skills: () => ({
    lines: [
      colorize('', ''),
      colorize('  ▸ Languages   ', T.yellow), colorize('    Python · Java · Ruby · Bash', T.fg),
      colorize('  ▸ Cloud       ', T.cyan), colorize('    AWS · Azure · Terraform', T.fg),
      colorize('  ▸ DevOps      ', T.purple), colorize('    Docker · K8s · GitHub Actions', T.fg),
      colorize('  ▸ Databases   ', T.red), colorize('    PostgreSQL · Couchbase · Redis', T.fg),
      colorize('  ▸ Monitoring  ', T.green), colorize('    Prometheus · Grafana', T.fg),
      colorize('  ▸ Tools       ', T.pink), colorize('    Git · Linux · VSCode · Copilot', T.fg),
      colorize('', ''),
    ],
  }),
  experience: () => ({
    lines: [
      colorize('', ''),
      colorize('  ┌─ 🟣 GitHub      SE-III          2026–Present', T.purple),
      colorize('  │    Distributed systems, Git internals, platform reliability', T.muted),
      colorize('  ├─ 🔴 Couchbase   SE-II           2025–2026', T.red),
      colorize('  │    Enterprise NoSQL for Netflix, Apple, Salesforce', T.muted),
      colorize('  ├─ 🟢 Groww       PSE-II          2024–2025', T.green),
      colorize('  │    Platform engineering for India\'s top fintech', T.muted),
      colorize('  └─ 🟡 Amazon      Cloud Engineer  2021–2024', T.yellow),
      colorize('       Distributed systems at scale, CI/CD, monitoring', T.muted),
      colorize('', ''),
    ],
  }),
  contact: () => ({
    lines: [
      colorize('', ''),
      colorize('  📧  kranthikiranakkumahanthi@gmail.com', T.accent),
      colorize('  📱  +91 93988 57319', T.fg),
      colorize('  🔗  linkedin.com/in/akkiran003', T.blue),
      colorize('  🐙  github.com/kranthi0003', T.fg),
      colorize('  𝕏   x.com/kranthikiran03', T.muted),
      colorize('  🌐  kranthikiran.com', T.green),
      colorize('', ''),
    ],
  }),
  projects: () => ({
    lines: [
      colorize('', ''),
      colorize('  01  SketchGate         AI image classifier         Python/TF', T.accent),
      colorize('  02  Health Risk        ML prediction model         Python/ML', T.green),
      colorize('  03  Portfolio          this site!                  React', T.purple),
      colorize('  04  IoT Smart Home     ESP32 automation            C++/IoT', T.yellow),
      colorize('  05  Solar Tracker      rotating solar panel        Arduino', T.red),
      colorize('', ''),
      colorize('  → type "open projects" to browse all', T.dim),
      colorize('', ''),
    ],
  }),
  certs: () => ({
    lines: [
      colorize('', ''),
      colorize('  ✅  AWS Solutions Architect – Associate', T.yellow),
      colorize('  ✅  Couchbase Professional Admin', T.red),
      colorize('  ✅  Couchbase Python Developer', T.red),
      colorize('  ✅  Couchbase Architect with Capella', T.red),
      colorize('  ✅  GitHub Foundations', T.purple),
      colorize('', ''),
    ],
  }),
  social: () => ({
    lines: [
      colorize('', ''),
      colorize('  LinkedIn   ', T.blue), colorize('  linkedin.com/in/akkiran003', T.fg),
      colorize('  GitHub     ', T.fg), colorize('  github.com/kranthi0003', T.muted),
      colorize('  X/Twitter  ', T.muted), colorize('  x.com/kranthikiran03', T.fg),
      colorize('  Spotify    ', T.spotify), colorize('  check the 🎵 in navbar!', T.muted),
      colorize('', ''),
    ],
  }),
  education: () => ({
    lines: [
      colorize('', ''),
      colorize('  🎓 B.Tech in Computer Science', T.accent),
      colorize('     GITAM University, Visakhapatnam', T.fg),
      colorize('     2017 – 2021', T.muted),
      colorize('', ''),
    ],
  }),
  stack: () => ({
    lines: [
      colorize('', ''),
      colorize('  This site is built with:', T.accent),
      colorize('', ''),
      colorize('  ⚡ Vite           fast build tool', T.yellow),
      colorize('  ⚛️  React          UI framework', '#61dafb'),
      colorize('  🎨 Tailwind CSS   utility-first CSS', T.cyan),
      colorize('  🌍 react-globe.gl 3D globe', T.green),
      colorize('  📊 qrcode.react   QR vCard generator', T.purple),
      colorize('  🚀 GitHub Pages   hosting', T.fg),
      colorize('', ''),
      colorize('  Source: github.com/kranthi0003/kranthi-kiran-site', T.dim),
      colorize('', ''),
    ],
  }),
  achievements: () => ({
    lines: [
      colorize('', ''),
      colorize('  🏆 2026  Joined GitHub as SE-III', T.purple),
      colorize('  📜 2025  5x Certifications (AWS, Couchbase, GitHub)', T.yellow),
      colorize('  🚀 2024  Joined Groww — platform engineering', T.green),
      colorize('  ☁️  2021  First job — Cloud Engineer at Amazon', T.red),
      colorize('  🎓 2021  Graduated B.Tech CS from GITAM', T.accent),
      colorize('', ''),
    ],
  }),
  date: () => ({
    lines: [
      colorize('', ''),
      colorize(`  ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, T.fg),
      colorize(`  ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST`, T.accent),
      colorize('', ''),
    ],
  }),
  weather: () => ({
    lines: [
      colorize('', ''),
      colorize('  📍 Visakhapatnam, India', T.fg),
      colorize('  🌡️ ~30°C  ☀️ Tropical, humid', T.yellow),
      colorize('  💨 Coastal breeze  🌊 Bay of Bengal', T.cyan),
      colorize('', ''),
      colorize('  (static data — I wish I had a weather API budget 😅)', T.dim),
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
        colorize(`  Switched to ${isDark ? '🌙 dark' : '☀️ light'} mode`, T.green),
        colorize('', ''),
      ],
    }
  },
  resume: () => {
    return {
      lines: [
        colorize('', ''),
        colorize('  Opening resume viewer...', T.green),
        colorize('', ''),
      ],
      action: 'resume',
    }
  },
  'sudo hire me': () => ({
    lines: [
      colorize('', ''),
      colorize('  ██╗  ██╗██╗██████╗ ███████╗██████╗ ██╗', T.green),
      colorize('  ██║  ██║██║██╔══██╗██╔════╝██╔══██╗██║', T.green),
      colorize('  ███████║██║██████╔╝█████╗  ██║  ██║██║', T.green),
      colorize('  ██╔══██║██║██╔══██╗██╔══╝  ██║  ██║╚═╝', T.green),
      colorize('  ██║  ██║██║██║  ██║███████╗██████╔╝██╗', T.green),
      colorize('  ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚══════╝╚═════╝ ╚═╝', T.green),
      colorize('', ''),
      colorize('  📧 kranthikiranakkumahanthi@gmail.com', T.accent),
      colorize('  Let\'s build something awesome together! 🚀', T.fg),
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
      colorize('  ╭──────────────────────────────────────╮', T.accent),
      colorize('  │   Welcome to kranthi.sh  v2.0.0      │', T.fg),
      colorize('  │   Type "help" to get started          │', T.muted),
      colorize('  ╰──────────────────────────────────────╯', T.accent),
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
      newHistory.push({ type: 'output', lines: [colorize(`  → scrolling to ${SCROLL_COMMANDS[cmd]}...`, T.green)] })
    } else if (COMMANDS[cmd]) {
      const result = COMMANDS[cmd]()
      newHistory.push({ type: 'output', lines: result.lines })
      if (result.action === 'resume') {
        const btn = document.querySelector('[data-resume-btn]')
        if (btn) setTimeout(() => btn.click(), 300)
      }
    } else {
      newHistory.push({ type: 'output', lines: [
        colorize(`  command not found: ${cmd}`, T.red),
        colorize('  type "help" for available commands', T.dim),
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

        <div className="rounded-2xl border border-border/30 shadow-2xl overflow-hidden bg-card">
          {/* Title bar */}
          <div className="flex items-center px-4 py-3 border-b border-border/20 bg-muted/50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-[11px] text-muted-foreground font-mono">kranthi@portfolio:~</span>
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
                    <span className="text-accent flex-shrink-0">❯</span>
                    <span className="text-foreground">{entry.text}</span>
                  </div>
                ) : (
                  entry.lines.map((line, j) => (
            <div key={j} className="whitespace-pre" style={{ color: line.color || 'var(--color-muted-foreground)' }}>{line.text}</div>
                  ))
                )}
              </div>
            ))}

            {/* Input line */}
            <form onSubmit={handleSubmit} className="flex gap-2 items-center mt-1">
              <span className="text-accent flex-shrink-0">❯</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-foreground outline-none caret-accent font-mono text-[13px]"
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
