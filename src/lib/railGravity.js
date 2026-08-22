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

const rand = (a, b) => a + Math.random() * (b - a)

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
      scale: 1,
      held: false,
      released: false,
      asleep: false,
      still: 0,
    }
  })

  bodies.forEach((b) => { b.el.classList.add('rail-loose') })

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


  function write(b) {
    b.el.style.transform =
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

    for (const b of bodies) {
      if (!b.released || b.held) continue
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
    }

    // ---- ball against ball ----
    // Everywhere, including in mid-air. Balls used to pass over anything
    // already on the floor, which kept the aimed throws on course — and
    // meant nothing ever knocked anything. The knocking is the point.
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i]
      if (!a.released) continue
      for (let j = i + 1; j < bodies.length; j++) {
        const c = bodies[j]
        if (!c.released) continue
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
      if (!b.released) continue
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
      // A throw shouldn't also open the page.
      if (moved > 7) {
        const swallow = (ev) => { ev.preventDefault(); ev.stopPropagation() }
        b.el.addEventListener('click', swallow, { capture: true, once: true })
        setTimeout(() => b.el.removeEventListener('click', swallow, true), 60)
      }
      wake()
    }

    const enter = () => { b.scale = 1.08; write(b); wake() }
    const leave = () => { b.scale = 1; write(b); wake() }

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

  return {
    destroy() {
      timers.forEach(clearTimeout)
      cancelAnimationFrame(raf)
      running = false
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
      cleanups.forEach((fn) => fn())
      try { layer && layer.remove() } catch {}
      bodies.forEach((b) => {
        b.el.classList.remove('rail-loose')
        b.el.style.transform = ''
      })
    },
  }
}
