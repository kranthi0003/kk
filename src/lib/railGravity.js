/* Gravity for the rail.
 *
 * The nine rail buttons stop being a fixed column and become balls: they
 * fall out of the rail, bounce, knock into each other, roll, and settle
 * along the bottom of the window. You can pick one up and throw it.
 *
 * Two decisions worth writing down, because both are the difference
 * between a toy and something you can still use as navigation:
 *
 *   They stand up when they stop. A ball tumbles while it's moving, which
 *   is most of the fun, but a settled pile of icons lying on their sides
 *   is unreadable. So once a ball goes to sleep its rotation eases to the
 *   nearest whole turn and it ends upright.
 *
 *   The floor sits above the bottom corners. The chat button and the
 *   visitor counter live down there at bottom-6; balls resting on the
 *   true bottom edge would bury them.
 *
 * The loop stops when everything is asleep, so a settled page costs
 * nothing. Anything that disturbs the field wakes it again.
 */

const G = 2600            // px/s², gravity. Tuned by eye: heavier than real
                          // at this scale, because a 48px ball falling at
                          // true 9.8 m/s² looks like it's underwater.
const REST_FLOOR = 0.46   // bounce kept off the floor
const REST_WALL = 0.4
const REST_BALL = 0.42
const ROLL_FRICTION = 0.94
const AIR = 0.9986
const MAX_DT = 1 / 30     // a backgrounded tab returns one enormous frame;
                          // without this clamp every ball teleports through
                          // the floor on the way back
const SLEEP_SPEED = 26    // px/s
const SLEEP_FRAMES = 24
const FLOOR_INSET = 78    // clear of the visitor counter along the bottom
const SIDE_INSET = 10
// The chat button lives in the bottom-right corner and opens a greeting
// bubble above itself; a ball resting there sits under both, so the floor
// stops short of that column. On a phone the button and its inset are
// smaller, and the width is too precious to give away.
const rightInset = (w) => (w < 520 ? 62 : 88)
const STAGGER = 165      // ms between each ball being let go. Short enough
                          // that flights overlap, which is what puts them in
                          // each other's way — the whole point now. It was
                          // widened once to stop exactly that, back when the
                          // throws were aimed and needed to arrive unbothered.

// Throwing.
//
// A ball settling on the floor and a ball fired across the page want
// opposite physics. Settling wants energy taken out of it fast, or the
// nine of them never stop rattling; a throw wants energy kept in, or it
// dies against the first wall it meets and the whole gesture feels
// broken. The constants above are tuned for settling.
//
// So a throw gives the ball `zip`, which is spent over a couple of
// seconds. While it lasts the walls give almost everything back, the air
// barely bites and the floor doesn't grab — and as it runs out the ball
// slides into the settling numbers and comes to rest with the others,
// with no visible handover between the two.
const THROW_MIN = 620      // px/s below which a release is a drop, not a throw
const ZIP_AT = 2300        // px/s that earns a full tank
const ZIP_DECAY = 0.44     // per second
const ZIP_PASS = 0.55      // how much of it is handed on in a collision

// Docking.
//
// Balls resting along the bottom of the window are fine while you're
// reading the hero, and in the way of everything below it. So once the
// page is scrolled past the first screen they climb into a column under
// the Sidecar handle — which is where the rail was before any of this —
// and drop back out when you return to the top.
//
// They leave one at a time rather than together: nine things moving at
// once reads as a glitch, one after another reads as deliberate.
const DOCK_AT = 0.55       // fraction of a screen scrolled before they leave
const DOCK_RELEASE = 0.32  // and the point they come back — lower than
                           // DOCK_AT on purpose, so a scroll position that
                           // sits exactly on the line can't flap between
                           // the two states
const DOCK_STAGGER = 70    // ms between each one setting off
const DOCK_PULL = 9        // how hard it's drawn to its slot
const DOCK_FOOT = 8        // breathing room left under the last one
// Docked balls are parked, not on offer, so they're always drawn smaller
// than they are in the field — at full size eleven of them are a 648px
// wall down the right edge, which reads as the rail coming back rather
// than getting out of the way.
const DOCK_MAX_SCALE = 0.7
// How small a docked ball may become. Below about half size the marks
// inside stop being readable and it's just a coloured dot, so the
// spacing gives way instead.
const DOCK_MIN_SCALE = 0.5
// Wrap into another column rather than shrink past this. Set below the
// worst single-column case on a normal short laptop, so only genuinely
// cramped screens — landscape phones — ever wrap.
const DOCK_WRAP_AT = 0.55
const DOCK_MAX_COLS = 2
const SCALE_PULL = 11      // how quickly it grows and shrinks

// ---- the game ------------------------------------------------------
// Hit the target with a ball and that ball is potted: it flies up to the
// column under the Sidecar and parks there. Clear all of them to win.
// The column doubles as the scoreboard — you can see how many are left
// without a counter having to tell you.
const TARGET_R = 42        // the ring's radius
const TARGET_MIN_SPEED = 240  // a ball has to arrive with some pace, or
                              // resting one on the target would score
const TARGET_CLEAR = 150   // how far the ring must move each time, so it
                           // never re-appears where you're already aiming
const SIDECAR_TOP = 80     // the handle is top-20, and 48px tall
const SIDECAR_SIZE = 48

const rand = (a, b) => a + Math.random() * (b - a)

// Belt and braces alongside draggable=false: some browsers will still
// begin a drag for a link, and this is the event that starts it.
const preventNativeDrag = (e) => { e.preventDefault() }

export function createRailField(selector = '.rail-btn') {
  if (typeof window === 'undefined') return { destroy() {} }

  const els = [...document.querySelectorAll(selector)]
  if (!els.length) return { destroy() {} }

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  let W = window.innerWidth
  let H = window.innerHeight
  const floorY = () => H - FLOOR_INSET

  // The rect is read only for the size. The position is thrown away: the
  // balls belong above the ceiling from the very first frame, not in the
  // rail. Leaving them at their CSS position meant you watched a stack of
  // them sitting on the right, then vanishing one at a time and
  // reappearing at the top — a teleport, not a fall.
  const bodies = els.map((el, i) => {
    const r = el.getBoundingClientRect()
    return {
      el, i,
      x: r.left + r.width / 2,
      y: r.top + r.height / 2,
      r: r.width / 2,
      vx: 0, vy: 0,
      rot: 0, vrot: 0,
      scale: 1,        // what's actually drawn: base * hover
      baseScale: 1,    // 1 when free, shrunk when docked
      hov: 1,          // the hover bump, kept separate so it composes
      potted: false,   // banked in the column during a game
      px: 0, py: 0,    // position at the start of the frame
      held: false,
      released: false,
      asleep: false,
      still: 0,
    }
  })

  // Every ball is an <a href>, and an anchor with an href is natively
  // draggable. A real press-and-move therefore starts the browser's own
  // link drag: it paints the little link ghost, fires pointercancel, and
  // the pointer stream we were following simply stops. Nothing could be
  // thrown.
  //
  // This did not show up in testing because CDP's synthetic mouse events
  // don't begin a native drag, so the drag worked perfectly in a headless
  // browser and not at all in a real one.
  //
  // Turned off here rather than on each of the five components that own a
  // ball: the field is what makes them draggable in the first place, so
  // it should be the thing that stops the browser competing for it.
  bodies.forEach((b) => {
    b.el.classList.add('rail-loose')
    b.el.draggable = false
    b.el.addEventListener('dragstart', preventNativeDrag)
  })

  // Where each ball sits when docked: a column under the Sidecar handle,
  // using the same gap the CSS rail uses so it lines up with the handle
  // rather than merely near it.
  //
  // Returns a scale as well as a position. Eleven balls at full size are
  // taller than a landscape phone, and the old fix — compressing the
  // spacing alone — bought the fit by overlapping them: measured at
  // 844x390, ten pairs touching at -3px, the column reading as one
  // smeared stripe. Shrinking them instead keeps real gaps between the
  // balls, and small is the right answer for something deliberately
  // parked out of the way.
  function dockSlot(i) {
    const cs = getComputedStyle(document.documentElement)
    const gap = parseFloat(cs.getPropertyValue('--rail-gap')) || 12
    const r = bodies[0].r
    const n = bodies.length

    // Line the column up with the handle by measuring it, rather than
    // recomputing top-20/right-6 here and having the two drift apart the
    // next time the handle moves.
    const handle = document.querySelector('button[aria-label="Open the Sidecar"]')
    let cx = W - 48
    let below = SIDECAR_TOP + SIDECAR_SIZE
    if (handle) {
      const hb = handle.getBoundingClientRect()
      if (hb.width) { cx = hb.left + hb.width / 2; below = hb.bottom }
    }

    // Height the column would take at full size, and the height it has.
    // The chat button sits in the bottom-right corner, in this very
    // column, so the stack has to stop above it — measured rather than
    // recomputed from bottom-6/right-6, for the same reason as the
    // handle. Without this the last two balls park underneath it.
    let bottomLimit = H - DOCK_FOOT
    const chat = document.querySelector('[data-chatbot-btn]')
    if (chat) {
      const cb = chat.getBoundingClientRect()
      if (cb.width && cb.right > cx - r && cb.left < cx + r) {
        bottomLimit = Math.min(bottomLimit, cb.top - DOCK_FOOT)
      }
    }

    const natural = r * 2 + gap
    const avail = bottomLimit - below - gap

    // How small a single column would have to go. Below this the marks
    // inside stop being legible — a landscape phone was forcing 12px,
    // which is a coloured dot, not a button — so the stack wraps into a
    // second column instead and keeps the balls a usable size.
    const fit = (perCol) => {
      const need = (perCol - 1) * natural + r * 2
      return Math.min(DOCK_MAX_SCALE, avail / Math.max(1, need))
    }
    let cols = 1
    while (cols < DOCK_MAX_COLS && fit(Math.ceil(n / cols)) < DOCK_WRAP_AT) cols++
    const perCol = Math.ceil(n / cols)
    const s = Math.max(DOCK_MIN_SCALE, fit(perCol))

    // Everything below scales with the balls, so the gaps stay in
    // proportion rather than becoming hairlines around shrunken discs.
    let step = natural * s
    const top = below + gap + r * s

    // Only if shrinking to the floor still isn't enough does the spacing
    // give — a slight overlap is worth less than a ball below the fold.
    const last = top + (perCol - 1) * step + r * s
    if (perCol > 1 && last > bottomLimit) step = Math.max(0, (bottomLimit - r * s - top) / (perCol - 1))

    // Extra columns stack inward, away from the edge they're pinned to.
    const col = Math.floor(i / perCol)
    const row = i % perCol
    return { x: cx - col * natural * s, y: top + row * step, s }
  }

  // ---- impact rings ------------------------------------------------
  // A ring drawn where two things met, scaled by how hard they met, gone
  // in half a second. Plain DOM nodes rather than a canvas: there are at
  // most a couple of dozen at once and adding a canvas would mean a
  // second thing to keep sized, layered and cleaned up.
  //
  // Capped, because a ball fired into a corner can bounce several times
  // within a few frames and there is no reason to leave that many nodes
  // in the document.
  const MAX_SPARKS = 18
  let live = 0
  let layer = null

  const ensureLayer = () => {
    if (layer) return layer
    layer = document.createElement('div')
    layer.setAttribute('aria-hidden', 'true')
    // Under the balls, over the page.
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:49;overflow:hidden'
    document.body.appendChild(layer)
    return layer
  }

  function spark(x, y, force) {
    if (reduced || live >= MAX_SPARKS) return
    const size = Math.max(26, Math.min(96, force * 0.055))
    const el = document.createElement('i')
    el.className = 'rail-spark'
    el.style.cssText =
      `left:${x}px;top:${y}px;width:${size}px;height:${size}px;` +
      `margin-left:${-size / 2}px;margin-top:${-size / 2}px`
    ensureLayer().appendChild(el)
    live++
    const done = () => { el.remove(); live-- }
    el.addEventListener('animationend', done, { once: true })
    // animationend doesn't fire in a backgrounded tab, and the node would
    // otherwise stay forever.
    setTimeout(() => { if (el.isConnected) done() }, 900)
  }


  // ---- the game ----------------------------------------------------
  // A ring appears; throw a ball through it and that ball is potted into
  // the column under the Sidecar. All eleven parked wins it.
  //
  // The whole thing rides on machinery that already exists — the throw,
  // the impact rings, and the docking — so it adds a goal rather than a
  // second physics engine.
  let game = null
  let targetEl = null

  const emit = (name, detail) => {
    try { window.dispatchEvent(new CustomEvent(name, { detail })) } catch {}
  }

  const gameState = () => ({
    on: !!game,
    potted: game ? game.potted : 0,
    total: bodies.length,
    throws: game ? game.throws : 0,
    won: game ? game.won : false,
    ms: game ? (game.endedAt || performance.now()) - game.startedAt : 0,
  })

  // Somewhere in the open middle of the page: below the navbar, above the
  // floor furniture, and clear of the column the balls get potted into.
  function moveTarget() {
    const pad = TARGET_R + 14
    const minX = SIDE_INSET + pad
    const maxX = W - rightInset(W) - pad - 30
    const minY = 108 + pad
    const maxY = floorY() - pad - 24
    if (maxX <= minX || maxY <= minY) return

    let x = 0, y = 0
    // Try a few times for somewhere far enough from the last spot; if the
    // window is too small for that to be possible, take what we can get
    // rather than looping forever.
    for (let i = 0; i < 24; i++) {
      x = rand(minX, maxX)
      y = rand(minY, maxY)
      if (!game.tx || Math.hypot(x - game.tx, y - game.ty) > TARGET_CLEAR) break
    }
    game.tx = x; game.ty = y
    if (targetEl) {
      targetEl.style.left = `${x}px`
      targetEl.style.top = `${y}px`
      // Restart the entry animation so each new position lands rather
      // than silently teleporting.
      targetEl.classList.remove('rail-target-in')
      void targetEl.offsetWidth
      targetEl.classList.add('rail-target-in')
    }
  }

  function startGame() {
    if (game) return
    // Anything still parked from a scroll comes back down first, or the
    // game would start already won.
    if (docked) setDocked(false)
    game = { potted: 0, throws: 0, startedAt: performance.now(), endedAt: 0, won: false, tx: 0, ty: 0 }
    bodies.forEach((b) => { b.dock = false; b.potted = false; b.released = true; b.asleep = false })

    targetEl = document.createElement('div')
    targetEl.className = 'rail-target'
    targetEl.setAttribute('aria-hidden', 'true')
    targetEl.style.setProperty('--tr', `${TARGET_R}px`)
    ensureLayer().appendChild(targetEl)
    moveTarget()

    document.documentElement.classList.add('rail-playing')
    emit('rail-game-state', gameState())
    wake()
  }

  function stopGame(won) {
    if (!game) return
    game.won = !!won
    game.endedAt = performance.now()
    const final = gameState()
    game = null
    try { targetEl && targetEl.remove() } catch {}
    targetEl = null
    document.documentElement.classList.remove('rail-playing')
    // Potted balls are sitting in the column. Send them back down the
    // same way scrolling up does, so the page is left as it was found.
    docked = true
    setDocked(false)
    bodies.forEach((b) => { b.potted = false })
    emit('rail-game-state', { ...final, on: false })
  }

  // Shortest distance from the ring's centre to the path a ball took this
  // frame, so a fast one can't step over it.
  function segmentHitsTarget(x1, y1, x2, y2, reach) {
    if (!game) return false
    const dx = x2 - x1
    const dy = y2 - y1
    const len2 = dx * dx + dy * dy
    let t = 0
    if (len2 > 0) {
      t = ((game.tx - x1) * dx + (game.ty - y1) * dy) / len2
      t = Math.max(0, Math.min(1, t))
    }
    return Math.hypot(game.tx - (x1 + dx * t), game.ty - (y1 + dy * t)) < reach
  }

  function pot(b) {
    b.potted = true
    b.dockIndex = game.potted
    b.dock = true
    b.held = false
    b.asleep = false
    b.still = 0
    game.potted++
    spark(game.tx, game.ty, 1600)
    if (game.potted >= bodies.length) {
      emit('rail-game-state', { ...gameState(), on: true })
      stopGame(true)
    } else {
      moveTarget()
      emit('rail-game-state', gameState())
    }
  }

  function write(b) {    b.el.style.transform =
      `translate3d(${(b.x - b.r).toFixed(2)}px, ${(b.y - b.r).toFixed(2)}px, 0) ` +
      `rotate(${b.rot.toFixed(2)}deg) scale(${b.scale.toFixed(3)})`
  }

  // ---- reduced motion: no falling, just lay them out on the floor ----
  if (reduced) {
    const gap = 6
    const total = bodies.reduce((n, b) => n + b.r * 2 + gap, -gap)
    let x = Math.max(SIDE_INSET, (W - rightInset(W) - total) / 2)
    bodies.forEach((b) => {
      b.x = x + b.r
      b.y = floorY() - b.r
      x += b.r * 2 + gap
      write(b)
    })
    return { destroy() { bodies.forEach((b) => { b.el.classList.remove('rail-loose'); b.el.style.transform = '' }) } }
  }

  // ---- the drop ----------------------------------------------------
  // Each ball enters from above the top edge, one at a time, and is
  // dropped so that it lands roughly where the previous ones are — so it
  // hits them, glances off, and knocks them along. The scattering is the
  // collisions, not the aim.
  //
  // An earlier version threw them out of the rail on ballistic arcs at
  // separate slots, with mid-air contact disabled so nothing could be
  // knocked off course. It landed them in a tidy row, which is exactly
  // what a set of falling balls should not look like.
  const timers = []
  const dropPoints = () => {
    const n = bodies.length
    const lo = SIDE_INSET + bodies[0].r * 2
    const hi = W - rightInset(W) - bodies[0].r * 2
    const mid = (lo + hi) / 2
    const reach = (hi - lo) / 2
    return bodies.map((b, i) => {
      // The first few come down almost on the same spot, so they land on
      // each other and burst apart; the entry point then widens as the
      // floor fills. Spreading the drops evenly from the start was the
      // mistake — balls given their own lane never meet, and the whole
      // point is what happens when they do.
      const swing = Math.pow(i / (n - 1), 1.7) * 0.92
      const side = i % 2 === 0 ? 1 : -1
      return Math.max(lo, Math.min(hi, mid + side * reach * swing * rand(0.6, 1) + rand(-14, 14)))
    })
  }

  // Park every ball above the ceiling straight away, before any of them
  // can be seen. They are then let go one at a time from up there. The
  // waiting has to happen off-screen: doing it in the rail is what made
  // them appear to vanish from the right and reappear at the top.
  const pts = dropPoints()
  bodies.forEach((b, i) => {
    b.x = pts[i]
    b.y = -b.r * 3
    write(b)
  })

  bodies.forEach((b, i) => {
    timers.push(setTimeout(() => {
      if (b.released) return
      // Already up there and out of sight; this only starts it moving.
      b.vx = rand(-40, 40)
      b.vy = rand(90, 210)
      b.vrot = rand(-260, 260)
      b.released = true
      wake()
    }, 420 + i * STAGGER))
  })

  // ---- restore a settled layout ------------------------------------
  // Coming back from #/movies remounts the rail. Dropping the balls again
  // every time would be a party trick that outstays its welcome, so a
  // settled arrangement is remembered for the session.
  let restored = false
  try {
    const s = JSON.parse(sessionStorage.getItem('rail_field') || 'null')
    if (s && s.w === W && s.h === H && Array.isArray(s.p) && s.p.length === bodies.length) {
      bodies.forEach((b, i) => {
        b.x = s.p[i][0]; b.y = s.p[i][1]
        b.released = true; b.asleep = true; b.rot = 0
        write(b)
      })
      restored = true
      timers.forEach(clearTimeout)
      timers.length = 0
    }
  } catch {}

  const save = () => {
    try {
      sessionStorage.setItem('rail_field', JSON.stringify({
        w: W, h: H, p: bodies.map((b) => [Math.round(b.x), Math.round(b.y)]),
      }))
    } catch {}
  }

  // ---- the loop ----------------------------------------------------
  let raf = 0
  let last = 0
  let running = false

  function wake() {
    bodies.forEach((b) => { if (b.released) { b.asleep = false; b.still = 0 } })
    if (!running) { running = true; last = 0; raf = requestAnimationFrame(step) }
  }

  function step(now) {
    const dt = last ? Math.min((now - last) / 1000, MAX_DT) : 1 / 60
    last = now

    let moving = false
    const fy = floorY()

    // dockSlot reads the DOM, so the scale — which is the same for every
    // ball — is worked out once a frame rather than once a ball.
    let dockScale = 1
    for (const b of bodies) { if (b.dock) { dockScale = dockSlot(0).s; break } }

    for (const b of bodies) {
      if (!b.released || b.held) continue

      // Size follows state: shrunk while docked, full size once free.
      // Eased rather than switched, so a ball grows on the way down and
      // shrinks on the way up instead of popping at either end.
      const wantScale = b.dock ? dockScale : 1
      if (Math.abs(b.baseScale - wantScale) > 0.002) {
        b.baseScale += (wantScale - b.baseScale) * (1 - Math.exp(-SCALE_PULL * dt))
        b.scale = b.baseScale * b.hov
        moving = true
        // A sleeping ball on its way back to full size never reaches the
        // branches below that paint, so it has to be written here.
        if (!b.dock) write(b)
      } else if (b.baseScale !== wantScale) {
        b.baseScale = wantScale
        b.scale = b.baseScale * b.hov
        if (!b.dock) write(b)
      }

      // Climbing to, or sitting in, its slot. Gravity is off for the
      // whole of this: a ball being drawn upward and pulled down at the
      // same time sags on the way and never quite arrives.
      if (b.dock) {
        const t = dockSlot(b.dockIndex)
        // Exponential ease rather than a fixed step, so it's frame-rate
        // independent — the same journey on a 60Hz and a 120Hz screen.
        const k = 1 - Math.exp(-DOCK_PULL * dt)
        b.x += (t.x - b.x) * k
        b.y += (t.y - b.y) * k
        b.vx = 0; b.vy = 0; b.zip = 0
        const target = Math.round(b.rot / 360) * 360
        b.rot += (target - b.rot) * k
        const arrived = Math.hypot(t.x - b.x, t.y - b.y) < 0.4
        if (arrived) { b.x = t.x; b.y = t.y; b.rot = target }
        else moving = true
        write(b)
        continue
      }

      if (b.asleep) {
        // Still ease rotation upright even once it's stopped moving.
        if (Math.abs(b.rot % 360) > 0.1) {
          const target = Math.round(b.rot / 360) * 360
          b.rot += (target - b.rot) * 0.16
          if (Math.abs(target - b.rot) < 0.1) b.rot = target
          write(b)
          moving = true
        }
        continue
      }

      // Everything below eases between the settling numbers and the
      // throwing ones as zip runs down.
      const z = b.zip || 0
      if (z > 0) b.zip = Math.max(0, z - ZIP_DECAY * dt)
      const restFloor = REST_FLOOR + z * 0.38
      const restWall = REST_WALL + z * 0.48
      const roll = ROLL_FRICTION + z * 0.055
      const air = AIR + (1 - AIR) * z

      b.px = b.x; b.py = b.y   // where this frame started, for the ring test
      b.vy += G * dt
      b.vx *= air
      b.vy *= air
      b.x += b.vx * dt
      b.y += b.vy * dt
      b.rot += b.vrot * dt

      // floor
      if (b.y + b.r > fy) {
        b.y = fy - b.r
        if (b.vy > 0) {
          if (b.vy > 520) spark(b.x, fy, b.vy)
          b.vy = -b.vy * restFloor
        }
        if (Math.abs(b.vy) < 70) b.vy = 0
        b.vx *= roll
        b.vrot = b.vx * 1.6   // rolling, not skidding
      }

      // walls
      if (b.x - b.r < SIDE_INSET) {
        b.x = SIDE_INSET + b.r
        if (Math.abs(b.vx) > 520) spark(SIDE_INSET, b.y, Math.abs(b.vx))
        b.vx = Math.abs(b.vx) * restWall
      } else if (b.x + b.r > W - rightInset(W)) {
        b.x = W - rightInset(W) - b.r
        if (Math.abs(b.vx) > 520) spark(W - rightInset(W), b.y, Math.abs(b.vx))
        b.vx = -Math.abs(b.vx) * restWall
      }
      // Ceiling. Only for something on its way up — a ball is dropped in
      // from above the top edge, and clamping on position alone teleported
      // it to just inside the frame on its first step, so nothing ever
      // actually fell into the page.
      if (b.y - b.r < 0 && b.vy < 0) {
        b.y = b.r
        if (Math.abs(b.vy) > 520) spark(b.x, 0, Math.abs(b.vy))
        b.vy = Math.abs(b.vy) * restWall
      }

      // Through the ring?
      //
      // Against the path travelled this frame, not the point it ended at.
      // A hard throw covers about 43px in a frame against a hit radius of
      // roughly 60, and a knock-on can be faster still — testing only the
      // endpoint let a ball pass clean through the ring and not count,
      // which reads as the game being broken rather than as a miss.
      //
      // It still has to arrive with some pace, or a ball rolling to a stop
      // on the ring would score by sitting there.
      if (game && !b.potted && Math.hypot(b.vx, b.vy) > TARGET_MIN_SPEED &&
          segmentHitsTarget(b.px, b.py, b.x, b.y, TARGET_R + b.r * 0.8)) {
        pot(b)
      }
    }

    // ---- ball against ball ----
    // Everywhere, including in mid-air. Balls used to pass over anything
    // already on the floor, which kept the aimed throws on course — and
    // meant nothing ever knocked anything. The knocking is the point.
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i]
      if (!a.released || a.dock) continue
      for (let j = i + 1; j < bodies.length; j++) {
        const c = bodies[j]
        if (!c.released || c.dock) continue
        let dx = c.x - a.x
        let dy = c.y - a.y
        let d = Math.hypot(dx, dy)
        const min = a.r + c.r
        if (d >= min || d === 0) continue

        let nx = dx / d
        let ny = dy / d
        const overlap = min - d

        // A ball landing dead-centre on another has a straight-up normal
        // and balances there forever, which real balls never do. Lean the
        // contact very slightly so it rolls off one side.
        if (Math.abs(nx) < 0.06) {
          nx = nx + (nx >= 0 ? 0.06 : -0.06)
          const len = Math.hypot(nx, ny)
          nx /= len; ny /= len
        }

        // Push apart. A held ball is immovable, so you can shove the
        // others around with it.
        if (overlap > 0.3) {
          if (a.held) { c.x += nx * overlap; c.y += ny * overlap }
          else if (c.held) { a.x -= nx * overlap; a.y -= ny * overlap }
          else {
            a.x -= nx * overlap * 0.5; a.y -= ny * overlap * 0.5
            c.x += nx * overlap * 0.5; c.y += ny * overlap * 0.5
          }
        }

        // Exchange the velocity along the normal.
        // The threshold matters: on a narrow screen the balls come to
        // rest touching, where the closing speed is zero. Treating that
        // as an impact woke both of them every single frame, so they
        // never slept — and since standing upright only happens once a
        // ball is asleep, they stayed lying on their sides.
        const rvx = c.vx - a.vx
        const rvy = c.vy - a.vy
        const sep = rvx * nx + rvy * ny
        if (sep > -2) continue
        // A ball still carrying a throw hits harder, and hands some of
        // it on — which is what makes one thrown ball scatter the row
        // instead of stopping dead in it.
        const zz = Math.max(a.zip || 0, c.zip || 0)
        const imp = -(1 + REST_BALL + zz * 0.45) * sep / 2
        if (!a.held) { a.vx -= imp * nx; a.vy -= imp * ny; a.asleep = false; a.still = 0 }
        if (!c.held) { c.vx += imp * nx; c.vy += imp * ny; c.asleep = false; c.still = 0 }
        if (zz > 0.04) {
          const pass = zz * ZIP_PASS
          if (!a.held) a.zip = Math.max(a.zip || 0, pass)
          if (!c.held) c.zip = Math.max(c.zip || 0, pass)
        }
        if (-sep > 260) spark((a.x + c.x) / 2, (a.y + c.y) / 2, -sep)
      }
    }


    for (const b of bodies) {
      if (!b.released || b.dock) continue
      if (!b.held && !b.asleep) {
        const slow = Math.abs(b.vx) < SLEEP_SPEED && Math.abs(b.vy) < SLEEP_SPEED && !(b.zip > 0.02)
        const grounded = b.y + b.r >= fy - 0.6
        b.still = slow && grounded ? b.still + 1 : 0
        if (b.still > SLEEP_FRAMES) {
          b.asleep = true
          b.vx = b.vy = b.vrot = 0
          save()
        } else moving = true
      }
      // A sleeping ball still has to stand up, and the easing that does
      // that runs at the top of the *next* frame. Without this the loop
      // stops on the very frame the last ball falls asleep and they all
      // stay lying on their sides — which is the one thing that made the
      // icons unreadable.
      if (b.asleep && Math.abs(b.rot - Math.round(b.rot / 360) * 360) > 0.1) moving = true
      if (b.held) moving = true
      // The walls are enforced during flight, but a sleeping ball skips
      // that, and a knock from a late arrival can still shift it — which
      // is how one ended up parked underneath the chat button. Hold the
      // bounds here instead, where every ball passes every frame.
      if (!b.held) {
        const lo = SIDE_INSET + b.r
        const hi = W - rightInset(W) - b.r
        if (b.x < lo) b.x = lo
        else if (b.x > hi) b.x = hi
      }
      write(b)
    }

    if (moving || bodies.some((b) => !b.released)) raf = requestAnimationFrame(step)
    else { running = false; save() }
  }

  if (!restored) wake()

  // ---- picking one up ----------------------------------------------
  const cleanups = []
  bodies.forEach((b) => {
    let grabX = 0, grabY = 0, moved = 0
    let lastX = 0, lastY = 0, lastT = 0

    const down = (e) => {
      if (e.button != null && e.button !== 0) return
      b.held = true
      b.released = true
      b.asleep = false
      // Picking one out of the column frees it — except during a game,
      // where a potted ball is banked and stays where it is.
      if (b.potted) return
      b.dock = false
      moved = 0
      grabX = e.clientX - b.x
      grabY = e.clientY - b.y
      lastX = e.clientX; lastY = e.clientY; lastT = performance.now()
      try { b.el.setPointerCapture(e.pointerId) } catch {}
      wake()
    }

    const move = (e) => {
      if (!b.held) return
      const nx = e.clientX - grabX
      const ny = e.clientY - grabY
      moved += Math.hypot(nx - b.x, ny - b.y)
      b.x = nx; b.y = ny
      const t = performance.now()
      const dt = Math.max(t - lastT, 8) / 1000
      // Cap it: a fast flick can otherwise produce a velocity that puts
      // the ball three screens away in one frame.
      b.vx = Math.max(-2600, Math.min(2600, (e.clientX - lastX) / dt))
      b.vy = Math.max(-2600, Math.min(2600, (e.clientY - lastY) / dt))
      lastX = e.clientX; lastY = e.clientY; lastT = t
    }

    const up = (e) => {
      if (!b.held) return
      b.held = false
      b.vrot = b.vx * 1.4
      const speed = Math.hypot(b.vx, b.vy)
      if (speed > THROW_MIN) b.zip = Math.min(1, speed / ZIP_AT)
      try { b.el.releasePointerCapture(e.pointerId) } catch {}
      if (game && speed > THROW_MIN) { game.throws++; emit('rail-game-state', gameState()) }
      // A throw shouldn't also open the page. While a game is on, nothing
      // does — a mistimed tap that navigated away would end the round.
      if (moved > 7 || game) {
        const swallow = (ev) => { ev.preventDefault(); ev.stopPropagation() }
        b.el.addEventListener('click', swallow, { capture: true, once: true })
        setTimeout(() => b.el.removeEventListener('click', swallow, true), 60)
      }
      wake()
    }

    // The hover bump is held apart from the docking shrink so the two
    // compose instead of overwriting each other — hovering a docked ball
    // used to snap it back to full size.
    const enter = () => { b.hov = 1.08; b.scale = b.baseScale * b.hov; write(b); wake() }
    const leave = () => { b.hov = 1; b.scale = b.baseScale * b.hov; write(b); wake() }

    b.el.addEventListener('pointerdown', down)
    b.el.addEventListener('pointermove', move)
    b.el.addEventListener('pointerup', up)
    b.el.addEventListener('pointercancel', up)
    b.el.addEventListener('pointerenter', enter)
    b.el.addEventListener('pointerleave', leave)
    cleanups.push(() => {
      b.el.removeEventListener('pointerdown', down)
      b.el.removeEventListener('pointermove', move)
      b.el.removeEventListener('pointerup', up)
      b.el.removeEventListener('pointercancel', up)
      b.el.removeEventListener('pointerenter', enter)
      b.el.removeEventListener('pointerleave', leave)
    })
  })

  // ---- leaving and coming back --------------------------------------
  let docked = false
  const dockTimers = []

  const clearDockTimers = () => { dockTimers.forEach(clearTimeout); dockTimers.length = 0 }

  const setDocked = (want) => {
    if (want === docked) return
    docked = want
    clearDockTimers()

    if (want) {
      // Fill the column in the order they're already lying in, nearest
      // the handle first. Using DOM order instead would send them across
      // each other on the way up, which looks like a shuffle rather than
      // a queue.
      const order = [...bodies].sort((a, c) => (c.x - a.x) || (a.y - c.y))
      order.forEach((b, slot) => { b.dockIndex = slot })
    }

    const queue = want
      ? [...bodies].sort((a, c) => a.dockIndex - c.dockIndex)
      : [...bodies].sort((a, c) => c.dockIndex - a.dockIndex) // last in, first out

    queue.forEach((b, i) => {
      dockTimers.push(setTimeout(() => {
        if (want) {
          b.dock = true
          b.asleep = false
          b.still = 0
        } else {
          b.dock = false
          b.asleep = false
          b.still = 0
          // Dropped straight down they'd land in a heap against the right
          // wall — they all leave from the same column, so nothing
          // separates them. A sideways shove alone isn't enough either:
          // rolling friction is deliberately savage, and eats the whole
          // of it inside a second.
          //
          // So they're given some zip as well, which is the same thing a
          // throw uses to stay alive. The lower a ball sat in the column
          // the less air time it has, so it gets more of both.
          const f = b.dockIndex / Math.max(1, bodies.length - 1)
          b.vx = -(220 + f * 620) * rand(0.85, 1.15)
          b.zip = 0.3 + f * 0.55
          b.vy = 0
          b.vrot = rand(-160, 160)
        }
        wake()
      }, i * DOCK_STAGGER))
    })
  }

  const onScroll = () => {
    // Mid-game the column is the scoreboard, so scrolling doesn't get to
    // fill it.
    if (game) return
    const y = window.scrollY || window.pageYOffset || 0
    const h = window.innerHeight || 1
    // Two thresholds, not one: a single line would flap between docked
    // and dropped for anyone parked exactly on it.
    if (!docked && y > h * DOCK_AT) setDocked(true)
    else if (docked && y < h * DOCK_RELEASE) setDocked(false)
  }
  window.addEventListener('scroll', onScroll, { passive: true })

  const onResize = () => {
    W = window.innerWidth
    H = window.innerHeight
    const fy = floorY()
    bodies.forEach((b) => {
      b.x = Math.max(SIDE_INSET + b.r, Math.min(W - rightInset(W) - b.r, b.x))
      b.y = Math.min(fy - b.r, b.y)
    })
    wake()
  }
  window.addEventListener('resize', onResize)

  // A backgrounded tab hands back one huge frame; drop it rather than
  // integrate it.
  const onVis = () => { if (!document.hidden) { last = 0; wake() } }
  document.addEventListener('visibilitychange', onVis)

  const onGameStart = () => startGame()
  const onGameQuit = () => stopGame(false)
  const onGameAsk = () => emit('rail-game-state', gameState())
  window.addEventListener('rail-game-start', onGameStart)
  window.addEventListener('rail-game-quit', onGameQuit)
  window.addEventListener('rail-game-ask', onGameAsk)

  return {
    startGame,
    stopGame,
    destroy() {
      try { game && stopGame(false) } catch {}
      window.removeEventListener('rail-game-start', onGameStart)
      window.removeEventListener('rail-game-quit', onGameQuit)
      window.removeEventListener('rail-game-ask', onGameAsk)
      timers.forEach(clearTimeout)
      cancelAnimationFrame(raf)
      running = false
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      clearDockTimers()
      document.removeEventListener('visibilitychange', onVis)
      cleanups.forEach((fn) => fn())
      try { layer && layer.remove() } catch {}
      bodies.forEach((b) => {
        b.el.classList.remove('rail-loose')
        b.el.style.transform = ''
        b.el.removeEventListener('dragstart', preventNativeDrag)
      })
    },
  }
}
