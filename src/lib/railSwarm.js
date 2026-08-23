/* ------------------------------------------------------------------ *
 * Swarm mode — the balls wake up.
 *
 * Turn it on and the eleven pods stop being furniture. They cut their
 * own thrust, drift around the page picking things to bother, bump into
 * headings and buttons, and talk about it while they do.
 *
 * It runs on the bodies railGravity already owns rather than a second
 * simulation: same collisions, same walls, and you can still grab one
 * out of the air and throw it. The only physics that changes is gravity,
 * which drops to almost nothing so they hover instead of falling.
 *
 * What "poking" means, and what it deliberately doesn't.
 *
 * The point is mischief, not sabotage. A pod that actually clicked a
 * link would navigate away and end the joke immediately, and one that
 * submitted a form or fired an external link would be worse than
 * unfunny. So poking is visual by default: whatever it hits gets a
 * shove and a wobble, and the pod says something about it.
 *
 * A short list of controls are genuinely activated, chosen because every
 * one is reversible by the same action that caused it and none of them
 * leaves the page. Anything with an href, anything inside a form, and
 * anything that opens a new tab is never touched.
 * ------------------------------------------------------------------ */

const SPEAK_MS = 2600        // how long a line stays up
const SPEAK_GAP = [2600, 7000]   // idle chatter spacing per pod
const POKE_COOLDOWN = 1500   // per pod, so one doesn't jackhammer a button
const ELEMENT_COOLDOWN = 2600 // per element, so a crowd doesn't pile on one
const THRUST = 620           // px/s² of self-propulsion
const CRUISE = 260           // px/s they try not to exceed while wandering
const RETARGET = [900, 2600] // ms between picking somewhere new
const SWARM_GRAVITY = 0.06   // they hover; a little weight keeps it readable

const rand = (a, b) => a + Math.random() * (b - a)
const pick = (a) => a[(Math.random() * a.length) | 0]

// Idle chatter. Deliberately short — a bubble is about 30 characters wide
// before it starts covering the thing the pod is standing on.
const IDLE = [
  'scanning…', 'what is this', 'ooh', 'mine now', 'beep',
  'is this load-bearing?', 'I can fix this', 'do not touch', 'touching it',
  'this is fine', 'who wrote this', 'ship it', 'nice kerning',
  'I have opinions', 'humans, hm', 'running diagnostics', '404 vibes',
  'that looked expensive', 'load average: chaos', 'I read the docs',
]

const ON_POKE = [
  'poked it', 'it moved!', 'wasn\u2019t me', 'oops', 'again!',
  'did you see that', 'fixed', 'unfixed', 'noted', 'squishy',
  'that\u2019s a button', 'button acquired', 'sorry not sorry',
]

const ON_BUMP = ['ow', 'excuse me', 'mind the paint', 'watch it', 'rude', 'oof']

// Things worth bumping into. Anything matching is fair game for a shove
// and a wobble; only the allow-list below is ever actually activated.
const POKEABLE = 'button, h1, h2, h3, .btn-primary, .btn-secondary, .btn-outline, img, [data-chatbot-btn]'

// Safe to actually press: each one toggles something that the same press
// undoes, and none of them navigates.
const ACTIVATE = ['[data-chatbot-btn]', 'button[aria-label="Open the Sidecar"]']

function isSafeToActivate(el) {
  if (!el || el.tagName === 'A' || el.closest('a, form')) return false
  if (el.getAttribute && el.getAttribute('target') === '_blank') return false
  return ACTIVATE.some((sel) => el.matches && el.matches(sel))
}

export function createSwarm(ctx) {
  const { bodies, size, wake, spark } = ctx
  let active = false
  let layer = null
  const lastPoke = new WeakMap()   // element -> timestamp

  function ensureLayer() {
    if (layer) return layer
    layer = document.createElement('div')
    layer.setAttribute('aria-hidden', 'true')
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:60;overflow:hidden'
    document.body.appendChild(layer)
    return layer
  }

  function say(b, text, kind) {
    if (!active) return
    if (!b.bubble) {
      b.bubble = document.createElement('div')
      b.bubble.className = 'swarm-say'
      ensureLayer().appendChild(b.bubble)
    }
    b.bubble.textContent = text
    b.bubble.dataset.kind = kind || 'idle'
    b.bubble.classList.remove('swarm-say-in')
    void b.bubble.offsetWidth
    b.bubble.classList.add('swarm-say-in')
    b.sayUntil = performance.now() + SPEAK_MS
  }

  // Somewhere to head for. Kept inside the visible page and away from the
  // very edges, or they spend the whole time grinding along a wall.
  function retarget(b) {
    const { W, H } = size()
    b.tx = rand(60, Math.max(80, W - 90))
    b.ty = rand(90, Math.max(120, H - 120))
    b.nextTarget = performance.now() + rand(RETARGET[0], RETARGET[1])
  }

  function poke(b, now) {
    const x = Math.max(1, Math.min(window.innerWidth - 2, b.x))
    const y = Math.max(1, Math.min(window.innerHeight - 2, b.y))

    // elementsFromPoint, not elementFromPoint. The pod is sitting at the
    // point being tested and is itself hit-testable — the singular form
    // returns the pod every single time, so nothing was ever poked.
    // The plural gives the whole stack, and the first thing underneath
    // the pods and their own speech bubbles is what it actually hit.
    const stack = document.elementsFromPoint(x, y)
    let target = null
    for (const el of stack) {
      if (el.closest('.rail-btn') || el.closest('.swarm-say')) continue
      const hit = el.closest(POKEABLE)
      if (hit) { target = hit; break }
    }
    if (!target) return

    const last = lastPoke.get(target) || 0
    if (now - last < ELEMENT_COOLDOWN) return
    lastPoke.set(target, now)
    b.pokeAt = now + POKE_COOLDOWN

    // Shove it in the direction the pod was travelling, so the reaction
    // reads as a consequence of the hit rather than a random wiggle.
    const mag = Math.min(14, 4 + Math.hypot(b.vx, b.vy) / 60)
    const ang = Math.atan2(b.vy, b.vx)
    target.style.setProperty('--swarm-dx', `${(Math.cos(ang) * mag).toFixed(1)}px`)
    target.style.setProperty('--swarm-dy', `${(Math.sin(ang) * mag).toFixed(1)}px`)
    target.classList.remove('swarm-hit')
    void target.offsetWidth
    target.classList.add('swarm-hit')
    setTimeout(() => target.classList.remove('swarm-hit'), 700)

    spark(b.x, b.y, 900)
    say(b, pick(ON_POKE), 'poke')

    if (isSafeToActivate(target)) {
      try { target.click() } catch {}
    }
  }

  function start() {
    if (active) return
    active = true
    document.documentElement.classList.add('swarm-on')
    const now = performance.now()
    bodies.forEach((b, i) => {
      b.released = true
      b.asleep = false
      b.dock = false
      b.still = 0
      retarget(b)
      b.nextSay = now + rand(300, 2600) + i * 120
      b.pokeAt = now + rand(400, 1800)
      b.el.classList.add('swarm-pod')
    })
    wake()
  }

  function stop() {
    if (!active) return
    active = false
    document.documentElement.classList.remove('swarm-on')
    bodies.forEach((b) => {
      b.el.classList.remove('swarm-pod')
      if (b.bubble) { b.bubble.remove(); b.bubble = null }
      b.asleep = false
      b.still = 0
    })
    document.querySelectorAll('.swarm-hit').forEach((e) => e.classList.remove('swarm-hit'))
    wake()
  }

  // Called once per physics frame, before gravity is applied.
  function step(dt) {
    if (!active) return
    const now = performance.now()
    for (const b of bodies) {
      if (b.held || b.dock) continue

      if (now > b.nextTarget) retarget(b)

      // Thrust toward the waypoint, capped so they cruise rather than
      // accelerate forever into a wall.
      const dx = b.tx - b.x
      const dy = b.ty - b.y
      const d = Math.hypot(dx, dy) || 1
      if (d < 46) retarget(b)
      b.vx += (dx / d) * THRUST * dt
      b.vy += (dy / d) * THRUST * dt
      const sp = Math.hypot(b.vx, b.vy)
      if (sp > CRUISE && !b.zip) {
        const k = CRUISE / sp
        b.vx *= k; b.vy *= k
      }
      b.vrot = b.vx * 0.9

      if (now > b.pokeAt) poke(b, now)

      if (now > b.nextSay) {
        say(b, pick(IDLE), 'idle')
        b.nextSay = now + rand(SPEAK_GAP[0], SPEAK_GAP[1])
      }
      if (b.sayUntil && now > b.sayUntil && b.bubble) {
        b.bubble.classList.remove('swarm-say-in')
        b.sayUntil = 0
      }
    }
  }

  // Bubbles follow their pod. Separate from step() because railGravity
  // moves the bodies after step() runs, and a bubble placed before the
  // move trails a frame behind — visible as a wobble at cruise speed.
  function draw() {
    if (!active) return
    for (const b of bodies) {
      if (!b.bubble) continue
      b.bubble.style.transform = `translate3d(${(b.x).toFixed(1)}px, ${(b.y - b.r - 12).toFixed(1)}px, 0) translate(-50%, -100%)`
    }
  }

  function bumped(b) {
    if (!active) return
    if (Math.random() < 0.12) say(b, pick(ON_BUMP), 'bump')
  }

  return {
    start, stop, step, draw, bumped,
    get active() { return active },
    toggle() { active ? stop() : start() },
    destroy() { stop(); try { layer && layer.remove() } catch {} layer = null },
  }
}

export { SWARM_GRAVITY }
