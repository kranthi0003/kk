import React, { useEffect, useRef, useState } from 'react'
import { onReaction, sendReaction, onPresenceSync, getPresenceState, getVisitorId } from './VisitorTracker'

// Kept short so the bar reads as a single glance, not a menu.
const EMOJI = ['👏', '❤️', '🔥', '😂', '🤯', '🎉']
// Minimum gap between two sends from the same person. Reactions are
// deliberate rather than continuous, so this only exists to blunt a
// mash-the-button burst.
const SEND_GAP_MS = 400
// Hard cap on simultaneously animating elements, so a burst can never
// pile up unbounded DOM nodes.
const MAX_FLOATS = 24
// How long one emoji lives.
const LIFE_MS = 2200
// Distance an off-screen reaction parks from the viewport edge.
const EDGE_PAD = 26

function labelFor(id) {
  const entry = getPresenceState()[id]?.[0]
  if (!entry) return null
  const city = entry.city && entry.city !== '—' ? entry.city : null
  const country = entry.country && entry.country !== '—' ? entry.country : null
  return city || country || null
}

export default function LiveReactions() {
  const layerRef = useRef(null)
  const floats = useRef(new Set())
  const docHeightRef = useRef(1)
  const othersRef = useRef(0)
  const lastSentRef = useRef(0)
  const [count, setCount] = useState(null)

  useEffect(() => {
    const measure = () => {
      docHeightRef.current = Math.max(document.documentElement.scrollHeight, 1)
    }
    measure()

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // x is a fraction of viewport width, y a fraction of the whole document —
    // same convention as the cursors, so a reaction fired from the projects
    // section shows up in the projects section for everyone else.
    const spawn = (emoji, x, y, label) => {
      const layer = layerRef.current
      if (!layer || floats.current.size >= MAX_FLOATS) return
      // Animations are frozen while the tab is in the background, so nothing
      // would ever reach onfinish and the layer would silently fill up with
      // emoji that all replay at once when you came back. Drop them instead.
      if (document.hidden) return

      const vw = window.innerWidth
      const vh = window.innerHeight
      const px = Math.max(EDGE_PAD, Math.min(x * vw, vw - EDGE_PAD))
      let py = y * docHeightRef.current - window.scrollY

      // The page is far taller than the viewport, so a reaction from someone
      // reading elsewhere would otherwise fire completely out of sight. Pin it
      // to the nearest edge instead, dimmed, the way off-screen cursors behave.
      let edgeDir = null
      if (py < EDGE_PAD) { edgeDir = 'up'; py = EDGE_PAD }
      else if (py > vh - EDGE_PAD) { edgeDir = 'down'; py = vh - EDGE_PAD }
      const offscreen = edgeDir !== null

      const el = document.createElement('div')
      el.style.cssText =
        'position:absolute;top:0;left:0;will-change:transform,opacity;' +
        'display:flex;flex-direction:column;align-items:center;gap:2px;' +
        `font-size:${offscreen ? 18 : 26}px;line-height:1;user-select:none`

      const glyph = document.createElement('div')
      glyph.textContent = emoji
      glyph.style.cssText = 'filter:drop-shadow(0 2px 4px rgba(0,0,0,.45))'
      el.appendChild(glyph)

      if (label) {
        const tag = document.createElement('div')
        tag.textContent = edgeDir ? (edgeDir === 'up' ? '↑ ' : '↓ ') + label : label
        tag.style.cssText =
          'font:500 9px/1.3 ui-monospace,monospace;color:rgba(255,255,255,.85);' +
          'background:rgba(0,0,0,.55);padding:1px 6px;border-radius:999px;white-space:nowrap'
        el.appendChild(tag)
      }

      layer.appendChild(el)
      floats.current.add(el)

      const drift = (Math.random() - 0.5) * 46
      const peak = offscreen ? 0.55 : 1

      const frames = reduced
        ? [
            { transform: `translate3d(${px}px, ${py}px, 0)`, opacity: 0 },
            { transform: `translate3d(${px}px, ${py}px, 0)`, opacity: peak, offset: 0.2 },
            { transform: `translate3d(${px}px, ${py}px, 0)`, opacity: 0 },
          ]
        : [
            { transform: `translate3d(${px}px, ${py}px, 0) scale(.5)`, opacity: 0 },
            { transform: `translate3d(${px + drift * 0.25}px, ${py - 16}px, 0) scale(1.15)`, opacity: peak, offset: 0.18 },
            { transform: `translate3d(${px + drift}px, ${py - 104}px, 0) scale(.95)`, opacity: 0 },
          ]

      const anim = el.animate(frames, {
        duration: reduced ? 1100 : LIFE_MS,
        easing: 'cubic-bezier(.2,.6,.3,1)',
        fill: 'forwards',
      })
      const cleanup = () => {
        el.remove()
        floats.current.delete(el)
      }
      anim.onfinish = cleanup
      anim.oncancel = cleanup
    }

    const offReaction = onReaction((p) => {
      if (typeof p.x !== 'number' || typeof p.y !== 'number') return
      if (typeof p.emoji !== 'string') return
      // Never render an arbitrary string from the wire — only the known set.
      if (!EMOJI.includes(p.emoji)) return
      spawn(p.emoji, p.x, p.y, labelFor(p.id))
    })

    const syncPresence = () => {
      const n = Object.keys(getPresenceState()).length
      setCount(n)
      othersRef.current = Math.max(0, n - 1)
      measure()
    }
    const offPresence = onPresenceSync(syncPresence)
    syncPresence()

    window.addEventListener('resize', measure)
    const measureTimer = setInterval(measure, 5000)

    const clearFloats = () => {
      floats.current.forEach(el => {
        el.getAnimations().forEach(a => a.cancel())
        el.remove()
      })
      floats.current.clear()
    }
    // Sweep anything left mid-flight on the way out, so returning to the tab
    // never dumps a backlog of frozen emoji on screen.
    const onVisibility = () => { if (document.hidden) clearFloats() }
    document.addEventListener('visibilitychange', onVisibility)

    const onReact = (e) => {
      const { emoji, x, y } = e.detail || {}
      if (!emoji) return
      const now = Date.now()
      if (now - lastSentRef.current < SEND_GAP_MS) return
      lastSentRef.current = now

      // Always draw your own reaction, so it feels immediate whether or not
      // anyone is around to see it. Only pay for the network when someone is.
      spawn(emoji, x, y, null)
      if (othersRef.current > 0) {
        sendReaction({ id: getVisitorId(), emoji, x: +x.toFixed(4), y: +y.toFixed(4) })
      }
    }
    window.addEventListener('emit-reaction', onReact)

    return () => {
      offReaction()
      offPresence()
      window.removeEventListener('emit-reaction', onReact)
      window.removeEventListener('resize', measure)
      document.removeEventListener('visibilitychange', onVisibility)
      clearInterval(measureTimer)
      floats.current.forEach(el => el.remove())
      floats.current.clear()
    }
  }, [])

  const fire = (emoji, e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = (r.left + r.width / 2) / window.innerWidth
    const y = (window.scrollY + r.top) / Math.max(document.documentElement.scrollHeight, 1)
    window.dispatchEvent(new CustomEvent('emit-reaction', { detail: { emoji, x, y } }))
  }

  return (
    <>
      <div ref={layerRef} className="fixed inset-0 pointer-events-none z-[60]" aria-hidden="true" />
      {count !== null && count >= 2 && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-0.5 px-1.5 py-1 rounded-full backdrop-blur-sm shadow-lg animate-fade-in-up"
          style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          {EMOJI.map(emoji => (
            <button
              key={emoji}
              onClick={(e) => fire(emoji, e)}
              aria-label={`React with ${emoji}`}
              title={`React with ${emoji}`}
              className="text-base leading-none px-1.5 py-1 rounded-full transition-transform hover:scale-125 active:scale-95"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
