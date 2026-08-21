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
const GAP_MIN = 4         // narrowest gap between resting balls
const GAP_MAX = 96        // widest — beyond this a wide window just looks
                          // like nine unrelated dots
// The chat button lives in the bottom-right corner and opens a greeting
// bubble above itself; a ball resting there sits under both, so the floor
// stops short of that column. On a phone the button and its inset are
// smaller, and the width is too precious to give away.
const rightInset = (w) => (w < 520 ? 62 : 88)
const STAGGER = 210      // ms between each ball being let go. Wide enough
                          // that one has landed before the next is let go:
                          // overlapping flights collide in mid-air and knock
                          // each other off aim, which is what made the pile.

const rand = (a, b) => a + Math.random() * (b - a)

export function createRailField(selector = '.rail-btn') {
  if (typeof window === 'undefined') return { destroy() {} }

  const els = [...document.querySelectorAll(selector)]
  if (!els.length) return { destroy() {} }

  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  let W = window.innerWidth
  let H = window.innerHeight
  const floorY = () => H - FLOOR_INSET

  // Seed each body where the CSS rail already put it, so nothing jumps
  // at the moment we take over positioning.
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

  bodies.forEach((b) => {
    b.el.classList.add('rail-loose')
    write(b)
  })

  // How much room the balls give each other once they're down. Derived
  // from the window rather than fixed: on a wide screen a fixed gap left
  // them huddled in one third of the floor, and on a phone it would have
  // pushed them into a pile against the walls. Each ball also carries a
  // little of its own, so the row reads as settled rather than set out.
  let spacing = GAP_MIN
  const measureSpacing = () => {
    const d = bodies[0].r * 2
    const usable = W - SIDE_INSET - rightInset(W)
    spacing = Math.max(GAP_MIN, Math.min(GAP_MAX, usable / bodies.length - d))
  }
  measureSpacing()
  bodies.forEach((b) => { b.spaceBias = rand(-0.16, 0.16) })

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
  // Left to pure chance this bunches badly: the top ball has the longest
  // fall so it travels furthest, the bottom one barely leaves the corner,
  // and six of the nine end up in a pile on the right. So each ball is
  // aimed at a slot across the floor and the launch speed is worked back
  // from how long it will be in the air. The bounces, the rolling and the
  // knocks off each other still do what they like, so it lands looking
  // scattered rather than arranged — it just doesn't land in a heap.
  const timers = []
  const fanOut = () => {
    const n = bodies.length
    // The band of targets stops well short of the left wall. Aiming at
    // the wall itself means any ball that rolls a little too far piles up
    // against it, and a pile is exactly what this is trying to avoid.
    const LEFT_PAD = 72
    const usable = W - LEFT_PAD - rightInset(W)
    const slot = usable / n
    bodies.forEach((b, i) => {
      // Right to left, so the balls at the bottom of the rail (which get
      // let go last and fall least) are the ones sent furthest.
      const target = LEFT_PAD + slot * (n - i - 0.5) + rand(-slot * 0.22, slot * 0.22)
      const drop = Math.max(40, floorY() - b.r - b.y)
      const fall = Math.sqrt((2 * drop) / G)
      // Roughly aimed only. Exactness isn't needed any more — the balls
      // sort out their own spacing once they are down. This just has to
      // get them out of the corner and pointing the right way.
      b.vx = ((target - b.x) / fall) * 0.72
      b.vy = rand(-90, -20)
      b.vrot = rand(-420, 420)
    })
  }

  bodies.forEach((b, i) => {
    timers.push(setTimeout(() => {
      if (!b.released) {
        b.released = true
        // Aim on the first release so every ball is aimed from the same
        // measurement of the window.
        if (i === 0) fanOut()
        wake()
      }
    }, 700 + i * STAGGER))
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

      b.vy += G * dt
      b.vx *= AIR
      b.vy *= AIR
      b.x += b.vx * dt
      b.y += b.vy * dt
      b.rot += b.vrot * dt

      // floor
      if (b.y + b.r > fy) {
        b.y = fy - b.r
        if (b.vy > 0) b.vy = -b.vy * REST_FLOOR
        if (Math.abs(b.vy) < 70) b.vy = 0
        b.vx *= ROLL_FRICTION
        b.vrot = b.vx * 1.6   // rolling, not skidding
      }

      // walls
      if (b.x - b.r < SIDE_INSET) {
        b.x = SIDE_INSET + b.r
        b.vx = Math.abs(b.vx) * REST_WALL
      } else if (b.x + b.r > W - rightInset(W)) {
        b.x = W - rightInset(W) - b.r
        b.vx = -Math.abs(b.vx) * REST_WALL
      }
      // ceiling, only reachable by throwing one
      if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy) * REST_WALL }
    }

    // ---- ball against ball ----
    // Only once they're down. A ball thrown across the screen has to get
    // past everything that landed before it, and if it collides in
    // mid-air it knocks the pile about and stops short — which is what
    // put six of them in a heap. Airborne balls pass over; everything
    // interacts properly on the floor, which is where it reads anyway.
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i]
      if (!a.released) continue
      if (!a.held && a.y + a.r < fy - 6) continue
      for (let j = i + 1; j < bodies.length; j++) {
        const c = bodies[j]
        if (!c.released) continue
        if (!c.held && c.y + c.r < fy - 6) continue
        let dx = c.x - a.x
        let dy = c.y - a.y
        let d = Math.hypot(dx, dy)
        const min = a.r + c.r
        if (d >= min || d === 0) continue

        const nx = dx / d
        const ny = dy / d
        const overlap = min - d

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
        const imp = -(1 + REST_BALL) * sep / 2
        if (!a.held) { a.vx -= imp * nx; a.vy -= imp * ny; a.asleep = false; a.still = 0 }
        if (!c.held) { c.vx += imp * nx; c.vy += imp * ny; c.asleep = false; c.still = 0 }
      }
    }

    // ---- shuffling apart -------------------------------------------
    // Aiming the throws was never going to be enough on its own: how far
    // a ball travels depends on how hard it lands, how many times it
    // bounces and what it hits, and small differences compound into a
    // clump at one end and a hole at the other. Every attempt to model
    // that traded one for the other.
    //
    // So the arrangement isn't decided in the air. Once two balls are
    // both on the floor and closer than is comfortable, they ease apart,
    // gently and only horizontally. It settles into an even row from any
    // landing at all, it costs nothing once the spacing is reached, and
    // because it happens while they're still rocking to a stop it reads
    // as them shuffling for room rather than repelling.
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i]
      if (!a.released || a.held || a.y + a.r < fy - 6) continue
      for (let j = i + 1; j < bodies.length; j++) {
        const c = bodies[j]
        if (!c.released || c.held || c.y + c.r < fy - 6) continue
        const dx = c.x - a.x
        const want = a.r + c.r + spacing * (1 + a.spaceBias + c.spaceBias)
        const d = Math.abs(dx)
        if (d >= want || d < 0.01) continue
        const push = (want - d) * 0.055
        // Deliberately does not wake anything. Waking resets the
        // stillness counter, and with a nudge running every frame the
        // balls could never accumulate enough of it to fall asleep —
        // they hovered, jittering, and never stood upright. A sleeping
        // ball can simply be slid along the floor instead.
        if (push < 0.4) continue
        const dir = dx < 0 ? -1 : 1
        a.x -= dir * push
        c.x += dir * push
        moving = true
      }
    }

    for (const b of bodies) {
      if (!b.released) continue
      if (!b.held && !b.asleep) {
        const slow = Math.abs(b.vx) < SLEEP_SPEED && Math.abs(b.vy) < SLEEP_SPEED
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
      // that and the spacing nudge can still slide it — which is how one
      // ended up parked underneath the chat button. Hold the bounds here
      // instead, where every ball passes every frame.
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
    measureSpacing()
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
      bodies.forEach((b) => {
        b.el.classList.remove('rail-loose')
        b.el.style.transform = ''
      })
    },
  }
}
