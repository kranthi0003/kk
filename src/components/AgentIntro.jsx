import React, { useEffect, useRef } from 'react'

/* ------------------------------------------------------------------ *
 * Agent intro.
 *
 * The first time the home page loads in a tab, a swarm of cursors flies
 * in and builds the name out of small squares: one squad per letter,
 * each led by a named agent. When the word is done it bursts apart and
 * the page opens up from the middle, with the hero playing its entrance
 * as the curtain lifts.
 *
 * It is a curtain, not a gate. The page renders underneath from the
 * first frame, and any click, tap, key or scroll fast-forwards to the
 * reveal. It never plays under reduced motion, on any other route, or a
 * second time in the same tab.
 * ------------------------------------------------------------------ */

const SEEN_KEY = 'agent_intro_seen'
const WORD = 'Kranthi'
const SITE = 'kranthikiran.com'
// One lead per letter, in the order the work flows.
const LEADS = ['planner', 'architect', 'designer', 'coder', 'tester', 'reviewer', 'shipper']
const WORD_FONT = "Sora, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
const LABEL_FONT = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace"
// The pointer the ghost cursors use, with its tip at (1, 1).
const ARROW = 'M1 1l14.5 8.6-6.4 1.3-2.7 6.1L1 1z'

// Beats, in seconds. The build in between is paced by the swarm itself.
const CLICK = 0.035 //   a cursor holds its click this long before the square lands
const BUILD_CAP = 1.85 // anything still unbuilt by now lands at once
const HOLD = 0.42 //     the finished word, before it opens
const OPEN = 0.62 //     the curtain
const OPEN_FAST = 0.42 // the curtain, when skipped

export function wantsAgentIntro(route) {
  if (typeof window === 'undefined') return false
  // Home only. Every other page lives under "#/".
  if (route && route !== '#/' && route.startsWith('#/')) return false
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try {
    if (sessionStorage.getItem(SEEN_KEY)) return false
  } catch {
    // Storage can throw in private mode; play it rather than guess.
  }
  return true
}

// The site's palette is written in oklch, and canvas support for oklch
// is not universal yet, so convert to sRGB here.
function oklch(L, C, h, alpha = 1) {
  const r = (h * Math.PI) / 180
  const a = C * Math.cos(r)
  const b = C * Math.sin(r)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const enc = (x) => {
    const v = Math.min(1, Math.max(0, x))
    return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055))
  }
  const R = enc(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
  const G = enc(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
  const B = enc(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  return `rgba(${R},${G},${B},${alpha})`
}

// Seven hues fanned around the visitor's chosen accent: each squad can be
// told apart, and the word still reads as one gradient.
function palette() {
  const root = document.documentElement
  const css = getComputedStyle(root)
  const matrix = root.classList.contains('matrix')
  const dark = matrix || root.classList.contains('dark')
  const hue = matrix ? 148 : parseFloat(css.getPropertyValue('--site-hue'))
  const chroma = matrix ? 1 : parseFloat(css.getPropertyValue('--site-chroma'))
  const base = Number.isFinite(hue) ? hue : 250
  const k = Number.isFinite(chroma) ? Math.max(0, chroma) : 1
  const step = matrix ? 4 : 18
  return LEADS.map((_, i) => {
    const h = base + (i - 3) * step
    if (dark) {
      return {
        cell: oklch(matrix ? 0.84 : 0.76, (matrix ? 0.2 : 0.15) * k, h),
        worker: oklch(0.93, 0.05 * k, h),
        lead: oklch(0.8, 0.15 * k, h),
        edge: 'rgba(0,0,0,0.55)',
        pill: oklch(0.48, 0.13 * k, h, 0.94),
      }
    }
    return {
      cell: oklch(0.56, 0.17 * k, h),
      worker: oklch(0.32, 0.06 * k, h),
      lead: oklch(0.55, 0.17 * k, h),
      edge: 'rgba(255,255,255,0.9)',
      pill: oklch(0.45, 0.15 * k, h, 0.94),
    }
  })
}

// Sets the word in the middle of the screen and cuts it into a grid of
// squares, one letter at a time, so every square knows its squad.
function layoutWord(vw, vh) {
  const cv = document.createElement('canvas')
  const g = cv.getContext('2d', { willReadFrequently: true })
  const n = WORD.length
  const track = 0.03
  g.font = `800 100px ${WORD_FONT}`
  const at100 = g.measureText(WORD).width + track * 100 * (n - 1)
  const size = Math.max(40, Math.min((100 * Math.min(vw * 0.84, 760)) / at100, vh * 0.26, 200))
  const cs = Math.max(4, Math.min(8, Math.round(size / 25)))
  g.font = `800 ${size}px ${WORD_FONT}`
  const m = g.measureText(WORD)
  const asc = m.actualBoundingBoxAscent || size * 0.74
  const desc = m.actualBoundingBoxDescent || 0
  const width = m.width + track * size * (n - 1)
  const xs = []
  for (let i = 0; i <= n; i++) xs.push(g.measureText(WORD.slice(0, i)).width + track * size * i)

  const pad = cs * 2
  const W = Math.ceil(width + pad * 2)
  const H = Math.ceil(asc + desc + pad * 2)
  cv.width = W
  cv.height = H
  g.font = `800 ${size}px ${WORD_FONT}` // resizing a canvas resets its state
  g.fillStyle = '#000'
  const ox = Math.round(vw / 2 - W / 2)
  const oy = Math.round(vh * 0.45 - H / 2)
  const cols = Math.floor(W / cs)
  const rows = Math.floor(H / cs)
  const taken = new Uint8Array(cols * rows)
  const q = cs * 0.25
  const cells = []
  const letters = []

  for (let i = 0; i < n; i++) {
    g.clearRect(0, 0, W, H)
    g.fillText(WORD[i], pad + xs[i], pad + asc)
    const data = g.getImageData(0, 0, W, H).data
    const ink = (x, y) => data[((Math.round(y) * W + Math.round(x)) << 2) + 3]
    const c0 = Math.max(0, Math.floor((pad + xs[i] - size * 0.2) / cs))
    const c1 = Math.min(cols - 1, Math.ceil((pad + xs[i + 1] + size * 0.2) / cs))
    const L = { i, cells: [], minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    for (let r = 0; r < rows; r++) {
      for (let c = c0; c <= c1; c++) {
        const k = r * cols + c
        if (taken[k]) continue
        const px = c * cs + cs / 2
        const py = r * cs + cs / 2
        const cover =
          ink(px, py) + ink(px - q, py - q) + ink(px + q, py - q) + ink(px - q, py + q) + ink(px + q, py + q)
        if (cover < 638) continue // under half of five fully inked samples
        taken[k] = 1
        const cell = { cx: ox + px, cy: oy + py, letter: i, claimed: false, at: -1, dx: 0, dy: 0, vx: 0, vy: 0 }
        cells.push(cell)
        L.cells.push(cell)
        L.minX = Math.min(L.minX, cell.cx)
        L.maxX = Math.max(L.maxX, cell.cx)
        L.minY = Math.min(L.minY, cell.cy)
        L.maxY = Math.max(L.maxY, cell.cy)
      }
    }
    letters.push(L)
  }

  let top = Infinity
  let bottom = -Infinity
  let left = Infinity
  let right = -Infinity
  for (const L of letters) {
    if (!L.cells.length) {
      L.minX = L.maxX = ox + pad + (xs[L.i] + xs[L.i + 1]) / 2
      L.minY = L.maxY = oy + H / 2
    }
    L.cx = (L.minX + L.maxX) / 2
    L.cy = (L.minY + L.maxY) / 2
    L.w = L.maxX - L.minX + cs
    L.h = L.maxY - L.minY + cs
    L.top = L.minY - cs / 2
    L.bottom = L.maxY + cs / 2
    L.total = L.cells.length
    L.free = L.total
    L.done = 0
    top = Math.min(top, L.top)
    bottom = Math.max(bottom, L.bottom)
    left = Math.min(left, L.minX - cs / 2)
    right = Math.max(right, L.maxX + cs / 2)
  }
  return {
    cells,
    letters,
    sq: cs - Math.max(1, Math.round(cs * 0.16)),
    cx: (left + right) / 2,
    cy: (top + bottom) / 2,
    top,
    bottom,
    left,
    right,
  }
}

// Each squad flies in from its own side of the screen, roughly from the
// direction of its letter, so the streams converge without crossing.
function spawnSwarm(lay, vw, vh) {
  const n = lay.letters.length
  const total = Math.max(1, lay.cells.length)
  const crew = Math.max(36, Math.min(vw < 640 ? 100 : 140, Math.round(total / 5)))
  const edge = (o, d, lo, hi) => (Math.abs(d) < 1e-6 ? Infinity : d > 0 ? (hi - o) / d : (lo - o) / d)
  const squads = []
  for (let i = 0; i < n; i++) {
    // Left, then round the top to the right, with every other squad
    // mirrored underneath.
    let ang = Math.PI + (i / (n - 1)) * Math.PI
    if (i % 2) ang = -ang
    const dx = Math.cos(ang)
    const dy = Math.sin(ang)
    const t = Math.min(edge(lay.cx, dx, -30, vw + 30), edge(lay.cy, dy, -30, vh + 30))
    const ex = lay.cx + dx * t
    const ey = lay.cy + dy * t
    const make = (x, y, lead) => ({
      x,
      y,
      vx: -dx * 700,
      vy: -dy * 700,
      squad: i,
      lead,
      state: lead ? 'lead' : 'enter',
      cell: null,
      t: 0,
      seed: Math.random() * 1000,
      ox: Math.random() * 2 - 1,
      oy: Math.random() * 2 - 1,
      gone: false,
    })
    const workers = []
    const size = Math.max(3, Math.round((crew * lay.letters[i].total) / total))
    for (let k = 0; k < size; k++) {
      const back = 10 + Math.random() * 150
      const side = (Math.random() + Math.random() + Math.random() - 1.5) * 70
      workers.push(make(ex + dx * back - dy * side, ey + dy * back + dx * side, false))
    }
    squads.push({ lead: make(ex, ey, true), workers })
  }
  return squads
}

function pill(ctx, x, y, w, h) {
  const r = h / 2
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// A small overshoot, so each square lands with a pop.
const pop = (k) => 1 + 3.2 * (k - 1) ** 3 + 2.2 * (k - 1) ** 2

export default function AgentIntro({ onDone }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const capRef = useRef(null)
  const skipRef = useRef(() => {})
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const cap = capRef.current
    const ctx = canvas && canvas.getContext('2d')
    if (!root || !ctx || !cap) {
      if (doneRef.current) doneRef.current()
      return undefined
    }
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
      // Private mode: it will simply play again next time.
    }

    const html = document.documentElement
    let vw = window.innerWidth
    let vh = window.innerHeight
    // Keep the backing store a sensible size on very large screens.
    const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(9e6 / Math.max(1, vw * vh)))
    const fit = () => {
      vw = window.innerWidth
      vh = window.innerHeight
      canvas.width = Math.round(vw * dpr)
      canvas.height = Math.round(vh * dpr)
    }

    const small = vw < 640
    const WS = small ? 0.56 : 0.62 // worker cursor scale
    const LS = small ? 0.8 : 0.9 // lead cursor scale
    const PH = small ? 16 : 17 // name-tag height
    // Everything that could throw runs here, before any listener or frame
    // is registered, so a failure just means no intro rather than no site.
    let arrow
    let colors
    let lay
    let squads
    try {
      arrow = new Path2D(ARROW)
      colors = palette()
      lay = layoutWord(vw, vh)
      squads = spawnSwarm(lay, vw, vh)
      fit()
    } catch {
      if (doneRef.current) doneRef.current()
      return undefined
    }
    const agents = squads.flatMap((s) => [s.lead, ...s.workers])
    const crowd = agents.length
    const tagW = LEADS.map(() => 84)

    let T = 0
    let phase = 'build' // build → ship → open → done
    let ready = false
    let painted = 0
    let shipAt = 0
    let openAt = 0
    let openFor = OPEN
    let maxR = 0
    let alive = true
    let raf = 0
    let last = 0
    let px = -1e4
    let py = -1e4
    let said = ''

    const say = (s) => {
      if (s === said) return
      said = s
      cap.textContent = s
    }
    const placeCaption = () => {
      cap.style.top = `${Math.round(lay.bottom + (small ? 64 : 70))}px`
    }
    placeCaption()
    say(`spawning ${crowd} agents…`)

    // Give the display face a moment to arrive, then lay out for real.
    // The squads are still flying in, so nothing has been claimed yet.
    const fonts = document.fonts
    const spec = '800 100px Sora'
    const had = fonts && fonts.check ? fonts.check(spec) : true
    Promise.race([fonts && fonts.load ? fonts.load(spec) : Promise.resolve(), new Promise((r) => setTimeout(r, 260))])
      .catch(() => {})
      .then(() => {
        if (!alive) return
        try {
          if (!had && fonts.check(spec)) {
            const next = layoutWord(vw, vh)
            if (next.cells.length) {
              lay = next
              placeCaption()
            }
          }
        } catch {
          // Keep the first layout; it is a perfectly good word.
        } finally {
          ready = true
        }
      })

    // The nearest free square in this cursor's own letter, or, once that
    // letter is spoken for, the nearest free square anywhere.
    const claim = (a) => {
      let best = null
      let bd = Infinity
      const scan = (L) => {
        for (const c of L.cells) {
          if (c.claimed) continue
          const d = (c.cx - a.x) ** 2 + (c.cy - a.y) ** 2
          if (d < bd) {
            bd = d
            best = c
          }
        }
      }
      const own = lay.letters[a.squad]
      if (own.free > 0) scan(own)
      else for (const L of lay.letters) if (L.free > 0) scan(L)
      if (best) {
        best.claimed = true
        lay.letters[best.letter].free--
      }
      return best
    }

    const land = (c, when) => {
      c.at = when
      painted++
      lay.letters[c.letter].done++
    }

    const finish = () => {
      if (phase === 'done') return
      phase = 'done'
      html.classList.add('agent-intro-handoff')
      if (doneRef.current) doneRef.current()
    }

    const open = (fast) => {
      if (phase === 'open' || phase === 'done') return
      phase = 'open'
      openAt = T
      openFor = fast ? OPEN_FAST : OPEN
      html.classList.add('agent-intro-handoff')
      root.style.setProperty('--ai-x', `${lay.cx}px`)
      root.style.setProperty('--ai-y', `${lay.cy}px`)
      root.style.setProperty('--ai-r', '-140px')
      root.classList.add('is-open')
      maxR = Math.hypot(Math.max(lay.cx, vw - lay.cx), Math.max(lay.cy, vh - lay.cy))
      for (const a of agents) {
        let dx = a.x - lay.cx
        let dy = a.y - lay.cy
        let d = Math.hypot(dx, dy)
        if (d < 1) {
          const r = Math.random() * Math.PI * 2
          dx = Math.cos(r)
          dy = Math.sin(r)
          d = 1
        }
        const j = (Math.random() - 0.5) * 0.6
        const ux = dx / d
        const uy = dy / d
        a.dx = ux * Math.cos(j) - uy * Math.sin(j)
        a.dy = ux * Math.sin(j) + uy * Math.cos(j)
        a.acc = 2600 + Math.random() * 2200
        const kick = 160 + Math.random() * 260
        a.vx = a.vx * 0.25 + a.dx * kick
        a.vy = a.vy * 0.25 + a.dy * kick
        a.state = 'leave'
      }
      for (const c of lay.cells) {
        const dx = c.cx - lay.cx
        const dy = c.cy - lay.cy
        const d = Math.hypot(dx, dy) || 1
        const sp = 140 + Math.random() * 380
        c.vx = (dx / d) * sp + (Math.random() - 0.5) * 160
        c.vy = (dy / d) * sp + (Math.random() - 0.5) * 160 - 40
      }
    }

    const update = (dt) => {
      if (phase === 'done') return
      T += dt
      // However the build is going, it opens by now.
      if (T > 5 && (phase === 'build' || phase === 'ship')) open(true)

      if (phase === 'build' && ready) {
        if (painted >= lay.cells.length) {
          phase = 'ship'
          shipAt = T
        } else if (T > BUILD_CAP) {
          for (const c of lay.cells) {
            if (c.at >= 0) continue
            c.claimed = true
            land(c, T + Math.random() * 0.12)
          }
          for (const L of lay.letters) L.free = 0
          for (const a of agents) {
            if (a.lead) continue
            a.cell = null
            a.state = 'idle'
          }
          phase = 'ship'
          shipAt = T + 0.12
        }
      } else if (phase === 'ship' && T - shipAt > HOLD) {
        open(false)
      }

      if (phase === 'open') {
        const k = Math.min(1, (T - openAt) / openFor)
        const r = -140 + (maxR + 180) * (1 - (1 - k) ** 3)
        root.style.setProperty('--ai-r', `${r.toFixed(1)}px`)
        if (k >= 1 && (T - openAt > openFor + 0.12 || agents.every((a) => a.gone))) {
          finish()
          return
        }
        const drag = Math.max(0, 1 - 2.4 * dt)
        for (const c of lay.cells) {
          if (c.at < 0) continue
          c.dx += c.vx * dt
          c.dy += c.vy * dt
          c.vx *= drag
          c.vy *= drag
        }
      } else if (phase === 'ship') {
        say('✓ shipped')
      } else if (painted === 0) {
        say(`spawning ${crowd} agents…`)
      } else {
        const pct = Math.min(99, Math.floor((100 * painted) / Math.max(1, lay.cells.length)))
        say(`${crowd} agents building ${SITE} · ${pct}%`)
      }

      // Cursors still flying in keep a little room between them.
      const flock = []
      for (const a of agents) if (a.state === 'enter') flock.push(a)
      for (let i = 0; i < flock.length; i++) {
        const a = flock[i]
        for (let j = i + 1; j < flock.length; j++) {
          const b = flock[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 > 196 || d2 < 1e-6) continue
          const d = Math.sqrt(d2)
          const f = (((14 - d) / 14) * 2400 * dt) / d
          a.vx += dx * f
          a.vy += dy * f
          b.vx -= dx * f
          b.vy -= dy * f
        }
      }

      for (const a of agents) {
        if (a.gone) continue
        if (a.state === 'leave') {
          a.vx += a.dx * a.acc * dt
          a.vy += a.dy * a.acc * dt
          a.x += a.vx * dt
          a.y += a.vy * dt
          if (a.x < -80 || a.x > vw + 80 || a.y < -80 || a.y > vh + 80) a.gone = true
          continue
        }
        if (a.state === 'click') {
          a.t += dt
          if (a.t >= CLICK) {
            land(a.cell, T)
            a.cell = claim(a)
            a.state = a.cell ? 'go' : 'idle'
            a.t = 0
          }
          continue
        }

        const L = lay.letters[a.squad]
        let tx
        let ty
        let vmax
        let acc
        let arrive
        if (a.lead) {
          // Leads supervise: they patrol over or under their letter,
          // alternating sides so neighbouring name tags never touch.
          const above = a.squad % 2 === 0
          tx = L.cx - (small ? 16 : 22) + Math.sin(T * 1.5 + a.seed) * L.w * (small ? 0.14 : 0.26)
          tx = Math.max(8, Math.min(vw - 22 - tagW[a.squad], tx))
          ty = (above ? L.top - (small ? 42 : 46) : L.bottom + 10) + Math.sin(T * 2.6 + a.seed) * 3
          vmax = 1300
          acc = 6000
          arrive = 100
        } else {
          if (a.state === 'enter' && ready && Math.hypot(a.x - L.cx, a.y - L.cy) < Math.max(L.w, L.h) * 0.75 + 110) {
            a.cell = claim(a)
            a.state = a.cell ? 'go' : 'idle'
            a.t = 0
          }
          if (a.state === 'enter') {
            tx = L.cx + a.ox * L.w * 0.5
            ty = L.cy + a.oy * L.h * 0.5
            vmax = 1250
            acc = 5600
            arrive = 90
          } else if (a.state === 'go') {
            tx = a.cell.cx
            ty = a.cell.cy
            vmax = 1500
            acc = 15000
            arrive = 22
            a.t += dt
          } else {
            // Done: circle the finished word.
            const th = a.seed + T * (a.seed % 2 < 1 ? 0.9 : -0.9)
            tx = lay.cx + Math.cos(th) * ((lay.right - lay.left) / 2 + 26 + (a.seed % 36))
            ty = lay.cy + Math.sin(th) * ((lay.bottom - lay.top) / 2 + 34 + (a.seed % 28))
            vmax = 650
            acc = 3200
            arrive = 70
          }
        }

        const dx = tx - a.x
        const dy = ty - a.y
        const d = Math.hypot(dx, dy) || 1e-6
        const want = d < arrive ? vmax * (d / arrive) : vmax
        let fx = (dx / d) * want - a.vx
        let fy = (dy / d) * want - a.vy
        const f = Math.hypot(fx, fy)
        const lim = acc * dt
        if (f > lim) {
          fx *= lim / f
          fy *= lim / f
        }
        a.vx += fx
        a.vy += fy

        if (a.state === 'enter') {
          // A lazy weave, so the streams look alive rather than ruled.
          const sp = Math.hypot(a.vx, a.vy)
          if (sp > 40) {
            const w = Math.sin(T * 5.5 + a.seed) * 1700 * dt
            const nx = -a.vy / sp
            const ny = a.vx / sp
            a.vx += nx * w
            a.vy += ny * w
          }
        }

        // They give the visitor's own pointer a little room.
        const qx = a.x - px
        const qy = a.y - py
        const q2 = qx * qx + qy * qy
        if (q2 < 8100 && q2 > 1e-6) {
          const qd = Math.sqrt(q2)
          const push = ((1 - qd / 90) * 9000 * dt) / qd
          a.vx += qx * push
          a.vy += qy * push
        }

        const sp = Math.hypot(a.vx, a.vy)
        const cap2 = vmax * 1.25
        if (sp > cap2) {
          a.vx *= cap2 / sp
          a.vy *= cap2 / sp
        }
        a.x += a.vx * dt
        a.y += a.vy * dt

        if (a.state === 'go' && (Math.hypot(a.cell.cx - a.x, a.cell.cy - a.y) < 2.2 || a.t > 0.35)) {
          a.x = a.cell.cx
          a.y = a.cell.cy
          a.vx = 0
          a.vy = 0
          a.state = 'click'
          a.t = 0
        }
      }
    }

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, vw, vh)
      const opening = phase === 'open'
      const fade = opening ? Math.max(0, 1 - (T - openAt) / 0.45) : 1
      const sq = lay.sq

      if (fade > 0) {
        ctx.globalAlpha = fade
        for (const L of lay.letters) {
          ctx.fillStyle = colors[L.i].cell
          for (const c of L.cells) {
            if (c.at < 0 || c.at > T) continue
            let s = sq * pop(Math.min(1, (T - c.at) / 0.17))
            if (opening) s *= 0.5 + 0.5 * fade
            ctx.fillRect(c.cx + c.dx - s / 2, c.cy + c.dy - s / 2, s, s)
          }
        }
        ctx.globalAlpha = 1
      }

      // A light passes over the finished word.
      if (phase === 'ship') {
        const k = (T - shipAt) / 0.4
        if (k > 0 && k < 1) {
          const band = lay.left - 60 + (lay.right - lay.left + 120) * k
          for (const c of lay.cells) {
            const a = 1 - Math.abs(c.cx - band) / 46
            if (a <= 0 || c.at < 0 || c.at > T) continue
            ctx.fillStyle = `rgba(255,255,255,${(a * 0.55).toFixed(3)})`
            ctx.fillRect(c.cx - sq / 2, c.cy - sq / 2, sq, sq)
          }
        }
      }

      for (let i = 0; i < squads.length; i++) {
        ctx.fillStyle = colors[i].worker
        ctx.strokeStyle = colors[i].edge
        ctx.lineWidth = 1 / WS
        for (const a of squads[i].workers) {
          if (a.gone) continue
          const s = WS * (a.state === 'click' ? 0.82 : 1)
          ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * (a.x - s), dpr * (a.y - s))
          ctx.fill(arrow)
          ctx.stroke(arrow)
        }
      }

      for (let i = 0; i < squads.length; i++) {
        const a = squads[i].lead
        if (a.gone) continue
        ctx.setTransform(dpr * LS, 0, 0, dpr * LS, dpr * (a.x - LS), dpr * (a.y - LS))
        ctx.fillStyle = colors[i].lead
        ctx.strokeStyle = colors[i].edge
        ctx.lineWidth = 1 / LS
        ctx.fill(arrow)
        ctx.stroke(arrow)

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.font = `600 ${small ? 10 : 10.5}px ${LABEL_FONT}`
        ctx.textBaseline = 'middle'
        const L = lay.letters[i]
        const label = L.total && L.done >= L.total ? `${LEADS[i]} ✓` : LEADS[i]
        tagW[i] = ctx.measureText(`${LEADS[i]} ✓`).width + 12
        const w = ctx.measureText(label).width + 12
        const x = a.x + 9 * LS + 3
        const y = a.y + 16 * LS + 5
        pill(ctx, x, y, w, PH)
        ctx.fillStyle = colors[i].pill
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.fillText(label, x + 6, y + PH / 2 + 0.5)
      }
    }

    const frame = (now) => {
      raf = 0
      if (!alive) return
      try {
        const dt = last ? Math.min(0.034, Math.max(0, (now - last) / 1000)) : 1 / 60
        last = now
        update(dt)
        if (phase !== 'done') draw()
      } catch {
        // Never let a broken frame leave the curtain down.
        finish()
        return
      }
      if (phase !== 'done') raf = requestAnimationFrame(frame)
    }

    const skip = () => {
      if (phase === 'build' || phase === 'ship') open(true)
    }
    skipRef.current = skip
    const onKey = (e) => {
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Fn'].includes(e.key)) return
      skip()
    }
    const onMove = (e) => {
      px = e.clientX
      py = e.clientY
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', skip, { passive: true })
    window.addEventListener('touchmove', skip, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('resize', fit)
    // A last resort on the wall clock: whatever happens to the frames, the
    // curtain is gone within a few seconds of someone looking at it.
    let looked = 0
    const watchdog = setInterval(() => {
      if (document.hidden) return
      looked++
      if (looked >= 8) finish()
    }, 1000)
    raf = requestAnimationFrame(frame)

    return () => {
      alive = false
      if (raf) cancelAnimationFrame(raf)
      clearInterval(watchdog)
      skipRef.current = () => {}
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('wheel', skip)
      window.removeEventListener('touchmove', skip)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('resize', fit)
    }
  }, [])

  return (
    <div ref={rootRef} className="agent-intro" onClick={() => skipRef.current()}>
      <div className="agent-intro-bg" />
      <canvas ref={canvasRef} className="agent-intro-canvas" aria-hidden="true" />
      <p ref={capRef} className="agent-intro-cap" aria-hidden="true" />
      <button type="button" className="agent-intro-skip" onClick={() => skipRef.current()}>
        skip intro
      </button>
    </div>
  )
}
