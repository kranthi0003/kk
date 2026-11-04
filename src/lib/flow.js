/* ------------------------------------------------------------------ *
 * Scroll flow.
 *
 * Ties motion on the home page to the scroll position, the way Apple's
 * product pages do: things move as you scroll, and move back when you
 * scroll back, instead of animating once when they first appear.
 *
 * This file only computes numbers. Every tracked element gets a custom
 * property between 0 and 1, eased a little so the motion trails the
 * scroll smoothly, and the CSS in index.css decides what they look like:
 *
 *   .reveal, [data-flow="rise"]  --flow-in     0 → 1 rising in from below
 *   .section-animate             --flow-out    0 → 1 leaving past the top
 *   [data-flow="words"]          --flow-words  0 → 1 moving up to the middle
 *   [data-flow="hero"]           --flow-hero   0 → 1 as the hero scrolls away
 *
 * Elements carry the motion styles only while they are mid-move (the
 * flow-pending and flow-leaving classes), and are only promoted to their
 * own layers while near the screen (flow-near). At rest they are plain
 * again, so a settled card is not left as a compositing layer or as a
 * containing block for anything fixed inside it.
 *
 * Positions are layout positions, cached and refreshed whenever anything
 * changes size. A frame is arithmetic and style writes, never a layout
 * read, and the motion it applies can never feed back into what it reads.
 * Which elements are near the screen is worked out from the same cache in
 * the same frame, so even a jump (an anchor link, a restored scroll
 * position) lands with everything already in its right state.
 * ------------------------------------------------------------------ */

const SELECTOR = '.reveal, .section-animate, [data-flow]'
// How quickly the shown value catches the scroll, per second. Higher is
// snappier; this trails by about a tenth of a second.
const EASE = 9
// How far beyond the screen, in screen heights, an element counts as near.
const NEAR = 0.6

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)

function kindOf(el) {
  const f = el.dataset.flow
  if (f === 'hero' || f === 'words') return f
  if (el.classList.contains('section-animate')) return 'section'
  return 'rise'
}

const VARS = {
  rise: ['--flow-in'],
  words: ['--flow-words'],
  hero: ['--flow-hero'],
  section: ['--flow-in', '--flow-out'],
}

export function startFlow(root) {
  if (!root || typeof window === 'undefined') return () => {}
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const items = new Map()
  let raf = 0
  let last = 0
  let dirty = true
  let docH = 0

  // Layout position relative to the document, ignoring transforms.
  const measure = (it) => {
    const el = it.el
    let y = 0
    let x = 0
    for (let n = el; n; n = n.offsetParent) {
      y += n.offsetTop
      x += n.offsetLeft
    }
    it.top = y
    it.left = x
    it.w = el.offsetWidth
    it.h = el.offsetHeight
    // display:none (a mobile-only list on desktop, say) has nothing to move.
    it.hidden = el.offsetParent === null
  }

  const remeasure = () => {
    for (const it of items.values()) {
      if (!it.el.isConnected) {
        drop(it)
        continue
      }
      measure(it)
    }
    docH = document.documentElement.scrollHeight
    dirty = false
  }

  // Map the scroll position to 0..1 between two scroll offsets. Near the
  // bottom of the page the end is pulled in to wherever scrolling stops,
  // so nothing is left half-arrived just because the page ran out.
  const span = (sy, start, end, max) => {
    const e = Math.min(end, max)
    if (e <= start) return sy >= e - 0.5 ? 1 : 0
    return clamp01((sy - start) / (e - start))
  }

  const targets = (it, sy, vh, vw, max) => {
    switch (it.kind) {
      case 'hero':
        it.tgt[0] = span(sy, it.top, it.top + it.h * 0.9, Infinity)
        break
      case 'words': {
        const mid = it.top + it.h / 2
        it.tgt[0] = span(sy, mid - vh * 0.92, mid - vh * 0.5, max)
        break
      }
      case 'section':
        // Rises in (only used when it holds no flow items of its own)...
        it.tgt[0] = span(sy, it.top - vh, it.top - vh * 0.7, max)
        // ...and recedes once its bottom passes the upper part of the screen.
        it.tgt[1] = span(sy, it.top + it.h - vh * 0.45, it.top + it.h, Infinity)
        break
      default: {
        // Things further right start a touch later, so a row rises as a
        // wave from left to right rather than as one slab.
        const lag = ((it.left + it.w / 2) / Math.max(1, vw)) * vh * 0.1
        const start = it.top - vh + lag
        it.tgt[0] = span(sy, start, start + vh * 0.3, max)
      }
    }
  }

  const paint = (it) => {
    const el = it.el
    const names = VARS[it.kind]
    for (let k = 0; k < names.length; k++) {
      const v = Math.round(it.cur[k] * 1000) / 1000
      if (v !== it.shown[k]) {
        it.shown[k] = v
        el.style.setProperty(names[k], String(v))
      }
    }
    if (it.kind === 'rise' || (it.kind === 'section' && !it.hasItems)) {
      const pending = it.cur[0] < 0.999
      if (pending !== it.pending) {
        it.pending = pending
        el.classList.toggle('flow-pending', pending)
      }
    }
    if (it.kind === 'section' || it.kind === 'hero') {
      const leaving = (it.kind === 'hero' ? it.cur[0] : it.cur[1]) > 0.001
      if (leaving !== it.leaving) {
        it.leaving = leaving
        el.classList.toggle('flow-leaving', leaving)
      }
    }
  }

  const setNear = (it, near) => {
    if (near === it.near) return
    it.near = near
    it.el.classList.toggle('flow-near', near)
  }

  const drop = (it) => {
    items.delete(it.el)
    ro.unobserve(it.el)
  }

  const frame = (now) => {
    raf = 0
    if (dirty) remeasure()
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
    last = now
    const sy = window.scrollY
    const vh = window.innerHeight
    const vw = window.innerWidth
    const max = Math.max(0, docH - vh)
    const lo = sy - vh * NEAR
    const hi = sy + vh * (1 + NEAR)
    const k = 1 - Math.exp(-dt * EASE)
    let moving = false
    for (const it of items.values()) {
      const near = !it.hidden && it.top < hi && it.top + it.h > lo
      if (!near) {
        // Out of range: park it in its true state, without a layer.
        if (it.near) {
          targets(it, sy, vh, vw, max)
          it.cur[0] = it.tgt[0]
          it.cur[1] = it.tgt[1]
          paint(it)
          setNear(it, false)
        }
        continue
      }
      targets(it, sy, vh, vw, max)
      if (!it.near) {
        // Arriving from out of range (or a jump): snap, don't animate in
        // from wherever it was left.
        it.cur[0] = it.tgt[0]
        it.cur[1] = it.tgt[1]
        setNear(it, true)
      } else {
        for (let j = 0; j < 2; j++) {
          const d = it.tgt[j] - it.cur[j]
          if (Math.abs(d) < 0.002) it.cur[j] = it.tgt[j]
          else {
            it.cur[j] += d * k
            moving = true
          }
        }
      }
      paint(it)
    }
    if (moving) raf = requestAnimationFrame(frame)
    else last = 0
  }

  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame)
  }

  // Anything that changes size can move everything below it.
  const ro = new ResizeObserver(() => {
    dirty = true
    kick()
  })
  ro.observe(document.body)

  const register = (el) => {
    if (items.has(el)) return
    const kind = kindOf(el)
    items.set(el, {
      el,
      kind,
      top: 0,
      left: 0,
      w: 0,
      h: 0,
      hidden: false,
      hasItems: kind === 'section' && !!el.querySelector('.reveal, [data-flow]'),
      tgt: [1, 0],
      cur: [1, 0],
      shown: [null, null],
      pending: false,
      leaving: false,
      near: false,
    })
    if (kind === 'section') ro.observe(el)
  }
  const scan = (node) => {
    if (node.nodeType !== 1) return 0
    let n = items.size
    if (node.matches(SELECTOR)) register(node)
    node.querySelectorAll(SELECTOR).forEach(register)
    return items.size - n
  }

  // Everything starts in its true state for wherever the page is, so the
  // first paint is already right. New elements are all measured first and
  // only then written to, so this is one layout, not one per element.
  const settleAll = () => {
    remeasure()
    const sy = window.scrollY
    const vh = window.innerHeight
    const vw = window.innerWidth
    const max = Math.max(0, docH - vh)
    for (const it of items.values()) {
      if (it.shown[0] !== null) continue
      targets(it, sy, vh, vw, max)
      it.cur[0] = it.tgt[0]
      it.cur[1] = it.tgt[1]
      paint(it)
    }
  }

  root.classList.add('flowing')
  scan(root)
  settleAll()

  // Sections that mount later (the desktop extras arrive after the intro)
  // join as they appear; a section that gains flow items stops moving as
  // one block so its items can move on their own.
  const mo = new MutationObserver((records) => {
    let added = 0
    for (const r of records) for (const n of r.addedNodes) added += scan(n)
    if (!added) return
    for (const it of items.values()) {
      if (it.kind === 'section' && !it.hasItems && it.el.querySelector('.reveal, [data-flow]')) {
        it.hasItems = true
        it.pending = false
        it.el.classList.remove('flow-pending')
      }
    }
    settleAll()
    kick()
  })
  mo.observe(root, { childList: true, subtree: true })

  const onScroll = () => kick()
  const onResize = () => {
    dirty = true
    kick()
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
  kick()

  return () => {
    if (raf) cancelAnimationFrame(raf)
    mo.disconnect()
    ro.disconnect()
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onResize)
    root.classList.remove('flowing')
    for (const it of items.values()) {
      it.el.classList.remove('flow-pending', 'flow-leaving', 'flow-near')
      for (const name of VARS[it.kind]) it.el.style.removeProperty(name)
    }
    items.clear()
  }
}
