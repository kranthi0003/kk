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

function spawnFood(snake, W, H) {
  let pos
  do {
    pos = { x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H) }
  } while (snake.some(p => p.x === pos.x && p.y === pos.y))
  return pos
}

function checkWin(board, player) {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
  return wins.some(([a,b,c]) => board[a] === player && board[b] === player && board[c] === player)
}

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
      colorize('  🎮 Games:', T.cyan),
      colorize('  play snake    ', T.green), colorize('  play ttt      ', T.green),
      colorize('  play wordle   ', T.green), colorize('  play memory   ', T.green),
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
      colorize('  │   🎮 Try "play snake" for games!      │', T.cyan),
      colorize('  ╰──────────────────────────────────────╯', T.accent),
      colorize('', ''),
    ]},
  ])
  const [input, setInput] = useState('')
  const [cmdHistory, setCmdHistory] = useState([])
  const [historyIdx, setHistoryIdx] = useState(-1)
  const [game, setGame] = useState(null) // { type, state }
  const inputRef = useRef()
  const scrollRef = useRef()
  const gameLoopRef = useRef(null)
  const keyRef = useRef('RIGHT')

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history, game])

  // Cleanup game loop
  useEffect(() => () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current) }, [])

  // ── SNAKE GAME ──
  const startSnake = () => {
    const W = 20, H = 12
    const snake = [{ x: 10, y: 6 }, { x: 9, y: 6 }, { x: 8, y: 6 }]
    const food = spawnFood(snake, W, H)
    keyRef.current = 'RIGHT'
    const state = { snake, food, dir: 'RIGHT', score: 0, W, H, over: false }
    setGame({ type: 'snake', state })
    setHistory(prev => [...prev, { type: 'output', lines: [
      colorize('', ''),
      colorize('  🐍 SNAKE — Use arrow keys to move!', T.green),
      colorize('  Press Q or Escape to quit', T.dim),
      colorize('', ''),
    ]}])
    if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    gameLoopRef.current = setInterval(() => tickSnake(), 180)
  }

  const tickSnake = () => {
    setGame(prev => {
      if (!prev || prev.type !== 'snake' || prev.state.over) {
        clearInterval(gameLoopRef.current)
        return prev
      }
      const s = { ...prev.state }
      const dir = keyRef.current
      const head = { ...s.snake[0] }
      if (dir === 'UP') head.y--
      else if (dir === 'DOWN') head.y++
      else if (dir === 'LEFT') head.x--
      else if (dir === 'RIGHT') head.x++

      if (head.x < 0 || head.x >= s.W || head.y < 0 || head.y >= s.H || s.snake.some(p => p.x === head.x && p.y === head.y)) {
        clearInterval(gameLoopRef.current)
        return { type: 'snake', state: { ...s, over: true } }
      }

      const newSnake = [head, ...s.snake]
      let newFood = s.food
      let newScore = s.score
      if (head.x === s.food.x && head.y === s.food.y) {
        newScore++
        newFood = spawnFood(newSnake, s.W, s.H)
      } else {
        newSnake.pop()
      }

      s.dir = dir
      return { type: 'snake', state: { ...s, snake: newSnake, food: newFood, score: newScore, dir } }
    })
  }

  const renderSnake = (s) => {
    const lines = []
    lines.push(colorize(`  Score: ${s.score}  ${s.over ? '💀 GAME OVER! Press Enter to exit' : ''}`, s.over ? T.red : T.green))
    const top = '  ┌' + '──'.repeat(s.W) + '┐'
    const bot = '  └' + '──'.repeat(s.W) + '┘'
    lines.push(colorize(top, T.dim))
    for (let y = 0; y < s.H; y++) {
      let row = '  │'
      for (let x = 0; x < s.W; x++) {
        const isHead = s.snake[0].x === x && s.snake[0].y === y
        const isBody = !isHead && s.snake.some(p => p.x === x && p.y === y)
        const isFood = s.food.x === x && s.food.y === y
        row += isHead ? '██' : isBody ? '▓▓' : isFood ? '◆◆' : '  '
      }
      row += '│'
      lines.push(colorize(row, T.fg))
    }
    lines.push(colorize(bot, T.dim))
    return lines
  }

  // ── TIC TAC TOE ──
  const startTTT = () => {
    setGame({ type: 'ttt', state: { board: Array(9).fill(null), turn: 'X', over: false, msg: '' } })
    setHistory(prev => [...prev, { type: 'output', lines: [
      colorize('', ''),
      colorize('  ❌⭕ TIC-TAC-TOE — You are X', T.cyan),
      colorize('  Type 1-9 to place, Q to quit', T.dim),
      colorize('', ''),
    ]}])
  }

  const playTTT = (pos) => {
    setGame(prev => {
      if (!prev || prev.type !== 'ttt' || prev.state.over) return prev
      const s = { ...prev.state, board: [...prev.state.board] }
      const i = pos - 1
      if (i < 0 || i > 8 || s.board[i] || s.turn !== 'X') return prev

      s.board[i] = 'X'
      if (checkWin(s.board, 'X')) return { type: 'ttt', state: { ...s, over: true, msg: '🎉 You win!' } }
      if (s.board.every(c => c)) return { type: 'ttt', state: { ...s, over: true, msg: "It's a draw!" } }

      // AI move
      const empty = s.board.map((c, i) => c ? -1 : i).filter(i => i >= 0)
      // Try to win, then block, then center, then random
      let aiMove = empty.find(i => { const b = [...s.board]; b[i] = 'O'; return checkWin(b, 'O') })
      if (aiMove === undefined) aiMove = empty.find(i => { const b = [...s.board]; b[i] = 'X'; return checkWin(b, 'X') })
      if (aiMove === undefined && !s.board[4]) aiMove = 4
      if (aiMove === undefined) aiMove = empty[Math.floor(Math.random() * empty.length)]
      s.board[aiMove] = 'O'

      if (checkWin(s.board, 'O')) return { type: 'ttt', state: { ...s, over: true, msg: '💀 AI wins!' } }
      if (s.board.every(c => c)) return { type: 'ttt', state: { ...s, over: true, msg: "It's a draw!" } }

      return { type: 'ttt', state: s }
    })
  }

  const renderTTT = (s) => {
    const sym = (c) => c === 'X' ? 'X' : c === 'O' ? 'O' : '·'
    const lines = []
    if (s.msg) lines.push(colorize(`  ${s.msg} Press Enter to exit`, s.msg.includes('win') ? T.green : T.red))
    lines.push(colorize('', ''))
    lines.push(colorize(`   ${sym(s.board[0])} │ ${sym(s.board[1])} │ ${sym(s.board[2])}     1 │ 2 │ 3`, T.fg))
    lines.push(colorize('  ───┼───┼───   ───┼───┼───', T.dim))
    lines.push(colorize(`   ${sym(s.board[3])} │ ${sym(s.board[4])} │ ${sym(s.board[5])}     4 │ 5 │ 6`, T.fg))
    lines.push(colorize('  ───┼───┼───   ───┼───┼───', T.dim))
    lines.push(colorize(`   ${sym(s.board[6])} │ ${sym(s.board[7])} │ ${sym(s.board[8])}     7 │ 8 │ 9`, T.fg))
    lines.push(colorize('', ''))
    return lines
  }

  // ── WORDLE ──
  const TECH_WORDS = ['react','linux','nginx','redis','flask','swift','mysql','mongo','azure','cloud','stack','debug','proxy','shell','query','graph','cache','parse','route','scala']

  const startWordle = () => {
    const answer = TECH_WORDS[Math.floor(Math.random() * TECH_WORDS.length)]
    setGame({ type: 'wordle', state: { answer, guesses: [], over: false, msg: '', attempt: '' } })
    setHistory(prev => [...prev, { type: 'output', lines: [
      colorize('', ''),
      colorize('  📝 WORDLE — Guess the 5-letter tech word!', T.yellow),
      colorize('  🟩 = correct  🟨 = wrong spot  ⬜ = not in word', T.dim),
      colorize('  6 tries. Type Q to quit', T.dim),
      colorize('', ''),
    ]}])
  }

  const guessWordle = (word) => {
    setGame(prev => {
      if (!prev || prev.type !== 'wordle' || prev.state.over) return prev
      const s = { ...prev.state }
      const g = word.toLowerCase()
      if (g.length !== 5) return { ...prev, state: { ...s, msg: 'Must be 5 letters!' } }

      const result = g.split('').map((c, i) => {
        if (c === s.answer[i]) return { c, status: '🟩' }
        if (s.answer.includes(c)) return { c, status: '🟨' }
        return { c, status: '⬜' }
      })
      const guesses = [...s.guesses, result]
      const won = g === s.answer
      const lost = guesses.length >= 6 && !won

      return { type: 'wordle', state: {
        ...s, guesses, over: won || lost,
        msg: won ? '🎉 Nice one!' : lost ? `💀 It was "${s.answer}"` : ''
      }}
    })
  }

  const renderWordle = (s) => {
    const lines = []
    if (s.msg) lines.push(colorize(`  ${s.msg}${s.over ? ' Press Enter to exit' : ''}`, s.msg.includes('Nice') ? T.green : s.over ? T.red : T.yellow))
    s.guesses.forEach(g => {
      lines.push(colorize('  ' + g.map(r => `${r.status}${r.c.toUpperCase()}`).join(' '), T.fg))
    })
    if (!s.over) {
      const remaining = 6 - s.guesses.length
      lines.push(colorize(`  ${remaining} ${remaining === 1 ? 'try' : 'tries'} left`, T.dim))
    }
    lines.push(colorize('', ''))
    return lines
  }

  // ── MEMORY ──
  const MEMORY_ICONS = ['⚛️','🐍','🦀','☕','🐳','🔶','💎','🟢']

  const startMemory = () => {
    const pairs = [...MEMORY_ICONS, ...MEMORY_ICONS]
    const shuffled = pairs.sort(() => Math.random() - 0.5)
    setGame({ type: 'memory', state: {
      cards: shuffled, revealed: Array(16).fill(false), matched: Array(16).fill(false),
      first: null, moves: 0, over: false, busy: false
    }})
    setHistory(prev => [...prev, { type: 'output', lines: [
      colorize('', ''),
      colorize('  🃏 MEMORY — Match the tech icon pairs!', T.purple),
      colorize('  Type card number (1-16) to flip, Q to quit', T.dim),
      colorize('', ''),
    ]}])
  }

  const flipMemory = (pos) => {
    setGame(prev => {
      if (!prev || prev.type !== 'memory' || prev.state.over || prev.state.busy) return prev
      const s = { ...prev.state, revealed: [...prev.state.revealed], matched: [...prev.state.matched] }
      const i = pos - 1
      if (i < 0 || i > 15 || s.revealed[i] || s.matched[i]) return prev

      s.revealed[i] = true

      if (s.first === null) {
        return { type: 'memory', state: { ...s, first: i } }
      }

      // Second card
      const fi = s.first
      s.moves++

      if (s.cards[fi] === s.cards[i]) {
        s.matched[fi] = true
        s.matched[i] = true
        s.first = null
        if (s.matched.every(m => m)) s.over = true
        return { type: 'memory', state: s }
      }

      // No match — show briefly then hide
      s.busy = true
      s.first = null
      setTimeout(() => {
        setGame(p => {
          if (!p || p.type !== 'memory') return p
          const ns = { ...p.state, revealed: [...p.state.revealed], busy: false }
          ns.revealed[fi] = false
          ns.revealed[i] = false
          return { type: 'memory', state: ns }
        })
      }, 800)

      return { type: 'memory', state: s }
    })
  }

  const renderMemory = (s) => {
    const lines = []
    lines.push(colorize(`  Moves: ${s.moves}  ${s.over ? '🎉 All matched! Press Enter to exit' : ''}`, s.over ? T.green : T.fg))
    lines.push(colorize('', ''))
    for (let row = 0; row < 4; row++) {
      let line = '  '
      for (let col = 0; col < 4; col++) {
        const i = row * 4 + col
        const num = String(i + 1).padStart(2, ' ')
        if (s.matched[i] || s.revealed[i]) {
          line += ` ${s.cards[i]} `
        } else {
          line += `[${num}]`
        }
        line += ' '
      }
      lines.push(colorize(line, T.fg))
    }
    lines.push(colorize('', ''))
    return lines
  }

  // ── Game rendering in terminal ──
  const renderGame = () => {
    if (!game) return null
    let lines = []
    if (game.type === 'snake') lines = renderSnake(game.state)
    else if (game.type === 'ttt') lines = renderTTT(game.state)
    else if (game.type === 'wordle') lines = renderWordle(game.state)
    else if (game.type === 'memory') lines = renderMemory(game.state)
    return lines.map((line, j) => (
      <div key={`game-${j}`} className="whitespace-pre" style={{ color: typeof line.color === 'string' ? line.color : 'var(--color-foreground)' }}>{line.text}</div>
    ))
  }

  const quitGame = () => {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    setGame(null)
    setHistory(prev => [...prev, { type: 'output', lines: [colorize('  Game ended.', T.dim)] }])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const cmd = input.trim().toLowerCase()
    if (!cmd) {
      if (game && game.state.over) { quitGame(); setInput(''); return }
      return
    }

    // Handle game input
    if (game) {
      if (cmd === 'q' || cmd === 'quit' || cmd === 'exit') { quitGame(); setInput(''); return }
      if (game.type === 'ttt' && !game.state.over) { const n = parseInt(cmd); if (n >= 1 && n <= 9) playTTT(n) }
      else if (game.type === 'wordle' && !game.state.over) guessWordle(cmd)
      else if (game.type === 'memory' && !game.state.over) { const n = parseInt(cmd); if (n >= 1 && n <= 16) flipMemory(n) }
      setInput('')
      return
    }

    const newHistory = [...history, { type: 'input', text: cmd }]
    setCmdHistory(prev => [cmd, ...prev])
    setHistoryIdx(-1)

    if (cmd === 'clear') { setHistory([]); setInput(''); return }

    // Game commands
    if (cmd === 'play snake') { setInput(''); startSnake(); return }
    if (cmd === 'play ttt') { setInput(''); startTTT(); return }
    if (cmd === 'play wordle') { setInput(''); startWordle(); return }
    if (cmd === 'play memory') { setInput(''); startMemory(); return }
    if (cmd === 'games' || cmd === 'play') {
      newHistory.push({ type: 'output', lines: [
        colorize('', ''),
        colorize('  🎮 Available games:', T.cyan),
        colorize('', ''),
        colorize('  play snake    ', T.green), colorize('    Classic snake — arrow keys to move', T.muted),
        colorize('  play ttt      ', T.green), colorize('    Tic-Tac-Toe vs AI', T.muted),
        colorize('  play wordle   ', T.green), colorize('    Guess the 5-letter tech word', T.muted),
        colorize('  play memory   ', T.green), colorize('    Match tech icon pairs', T.muted),
        colorize('', ''),
      ]})
      setHistory(newHistory); setInput(''); return
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
    // Snake arrow keys
    if (game?.type === 'snake' && !game.state.over) {
      const dirMap = { ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT' }
      if (dirMap[e.key]) {
        e.preventDefault()
        const opposite = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
        if (dirMap[e.key] !== opposite[keyRef.current]) keyRef.current = dirMap[e.key]
        return
      }
      if (e.key === 'q' || e.key === 'Escape') { e.preventDefault(); quitGame(); return }
    }

    // Game quit
    if (game && (e.key === 'Escape')) { e.preventDefault(); quitGame(); return }

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
        const allCmds = [...Object.keys(COMMANDS), 'play snake', 'play ttt', 'play wordle', 'play memory', 'games']
        const match = allCmds.find(c => c.startsWith(partial))
        if (match) setInput(match)
      }
    }
  }

  return (
    <section id="terminal" className="py-20 px-6">
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

            {/* Live game area */}
            {game && (
              <div className="my-2">
                {renderGame()}
              </div>
            )}

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
          {['help', 'whoami', 'skills', 'games', 'sudo hire me'].map(cmd => (
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
