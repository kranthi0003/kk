import React, { useEffect, useRef, useState } from 'react'

/* ------------------------------------------------------------------ *
 * Eleven Shots — the little game the falling balls are for.
 *
 * A ring appears somewhere in the page. Throw a ball through it and that
 * ball is potted: it flies up to the column under the Sidecar and parks
 * there. Clear all eleven to win.
 *
 * The column is the scoreboard. You can see how many are left without a
 * counter having to tell you, which is why the balls go there rather
 * than simply vanishing.
 *
 * This file is only the chrome: the launcher, the score line and the
 * result. Everything that moves lives in railGravity.js, and the two
 * talk over window events so neither has to hold a reference to the
 * other.
 *
 * Where it sits, which took several goes and one wrong turn worth
 * recording.
 *
 * Bottom-left beside the visitor count put it exactly where the balls
 * come to rest: measured with elementFromPoint, the chip was on top of
 * them, swallowing the very grab the game depends on.
 *
 * Floating just above the balls failed less obviously. Its height was
 * measured up from the bottom of the window, while the hero's buttons are
 * placed by document flow, so the two closed on each other as the window
 * got shorter — at 1280x800 the card sat across Work Together.
 *
 * Moving it into the hero's flow fixed that and broke two other things:
 * on a short window the flow ran down into the balls, and on a phone the
 * hero is tall enough that anything after the buttons is below the fold,
 * so the invitation couldn't be seen at all.
 *
 * The band it lives in now is the one part of the window that is
 * reserved. The floor the balls land on is held FLOOR_INSET above the
 * bottom edge precisely so the furniture down there stays clear of them,
 * and only the visitor count and the chat button occupy it. Sitting in
 * that strip, centred, it cannot reach the balls above it or the hero
 * laid out behind it, at any window size.
 *
 * On a phone even that strip is taken. The hero stacks tall enough that
 * its own buttons reach the bottom of the first screen, so a centred pill
 * down there lands on Work Together — the very thing this was moved to
 * stop doing. There is no free space at all on a phone at scroll zero.
 *
 * A narrow window gets the disc instead, top-left under the navbar.
 * Probing five phone sizes for a 40px square touching neither a ball nor
 * anything clickable, that corner was the only one free on all of them:
 * bottom-left and bottom-right are both across the hero's buttons, which
 * on a phone run to the bottom of the first screen.
 * ------------------------------------------------------------------ */

const BEST_KEY = 'rail_game_best'
// Shrinking it is remembered, so someone who isn't interested isn't asked
// again on every visit.
const SMALL_KEY = 'rail_game_small'

const readBest = () => {
  try {
    const v = JSON.parse(localStorage.getItem(BEST_KEY) || 'null')
    return v && typeof v.throws === 'number' ? v : null
  } catch { return null }
}

const fmt = (ms) => {
  const s = Math.round(ms / 100) / 10
  return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
}

export default function BallGame() {
  const [st, setSt] = useState({ on: false, potted: 0, total: 0, throws: 0 })
  const [result, setResult] = useState(null)
  const [best, setBest] = useState(readBest)
  const [ready, setReady] = useState(false)
  const [small, setSmall] = useState(() => {
    try { return localStorage.getItem(SMALL_KEY) === '1' } catch { return false }
  })
  // Below this the strip is too crowded for the full pill and it falls
  // back to the disc.
  const [wide, setWide] = useState(
    () => typeof window === 'undefined' || !window.matchMedia ? true : window.matchMedia('(min-width: 1024px)').matches
  )
  // With reduced motion the balls are laid out on the floor and the
  // physics loop never starts, so there is nothing to throw. Offering the
  // game anyway left a button that did nothing at all when pressed.
  const [motion, setMotion] = useState(
    () => typeof window === 'undefined' || !window.matchMedia
      ? true
      : !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const wasOn = useRef(false)

  useEffect(() => {
    const onState = (e) => {
      const s = e.detail || {}
      setSt(s)
      // The engine reports the winning state and then immediately reports
      // the game as over, so the result is taken from the transition
      // rather than from a second event that would have to agree with it.
      if (wasOn.current && !s.on) {
        if (s.won) {
          const run = { throws: s.throws, ms: s.ms, at: Date.now() }
          setResult(run)
          const b = readBest()
          // Fewest throws wins; time breaks a tie.
          if (!b || run.throws < b.throws || (run.throws === b.throws && run.ms < b.ms)) {
            try { localStorage.setItem(BEST_KEY, JSON.stringify(run)) } catch {}
            setBest(run)
          }
        } else {
          setResult(null)
        }
      }
      wasOn.current = s.on
    }
    window.addEventListener('rail-game-state', onState)
    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
    const onMotion = () => setMotion(!mq.matches)
    mq && mq.addEventListener('change', onMotion)
    const wq = window.matchMedia ? window.matchMedia('(min-width: 1024px)') : null
    const onWide = () => setWide(wq.matches)
    wq && wq.addEventListener('change', onWide)
    // The balls take a few seconds to fall; offering a game before there
    // is anything to throw reads as broken.
    const t = setTimeout(() => setReady(true), 7000)
    return () => {
      window.removeEventListener('rail-game-state', onState)
      mq && mq.removeEventListener('change', onMotion)
      wq && wq.removeEventListener('change', onWide)
      clearTimeout(t)
    }
  }, [])

  const start = () => { setResult(null); window.dispatchEvent(new CustomEvent('rail-game-start')) }
  const quit = () => window.dispatchEvent(new CustomEvent('rail-game-quit'))

  if (!ready || !motion) return null

  // The strip under the ball floor, right of centre.
  //
  // Not centred: the hero's scroll-down arrow is centred and clickable,
  // and anything centred contains the centre, so no width of pill could
  // ever clear it — only moving off the axis does. Right of centre also
  // keeps it away from the visitor count on the left, and it stops 6rem
  // short of the edge to leave the chat button alone.
  const shell = wide
    ? 'fixed bottom-4 right-24 z-[60] flex justify-end pointer-events-none'
    : 'fixed left-4 top-20 z-[60] pointer-events-none'
  const skin = {
    background: 'color-mix(in oklab, var(--color-card) 92%, transparent)',
    boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 55%, var(--color-border)), 0 8px 28px rgba(0,0,0,0.34)',
  }

  // ---- during a round ----
  if (st.on) {
    return (
      <div className={shell}>
        <div className="pointer-events-none flex items-center gap-2.5 px-3.5 h-10 rounded-full backdrop-blur-md animate-fade-in-up" style={skin}>
          <span className="flex gap-1" aria-hidden="true">
            {Array.from({ length: st.total }).map((_, i) => (
              <i
                key={i}
                className="w-1.5 h-1.5 rounded-full transition-colors"
                style={{ background: i < st.potted ? 'var(--color-accent)' : 'color-mix(in oklab, var(--color-foreground) 20%, transparent)' }}
              />
            ))}
          </span>
          <span className="text-[12.5px] font-mono tabular-nums text-foreground">
            {st.potted}<span className="text-muted-foreground">/{st.total}</span>
          </span>
          <span className="hidden sm:inline text-[11px] font-mono text-muted-foreground tabular-nums">{st.throws} throws</span>
          <button onClick={quit} className="pointer-events-auto text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors">
            stop
          </button>
        </div>
      </div>
    )
  }

  // ---- just won ----
  if (result) {
    const isBest = best && result.throws === best.throws && result.ms === best.ms
    return (
      <div className={shell}>
        <div className="pointer-events-auto flex items-center gap-3 pl-4 pr-3 h-10 rounded-full backdrop-blur-md animate-fade-in-up" style={skin}>
          <span className="text-[12.5px] font-medium text-foreground whitespace-nowrap">
            All eleven{isBest ? ' — best yet' : ''}
          </span>
          <span className="hidden sm:inline text-[11px] font-mono text-muted-foreground tabular-nums whitespace-nowrap">
            {result.throws} throws · {fmt(result.ms)}
          </span>
          <button
            onClick={start}
            className="px-2.5 py-1 rounded-full text-[11.5px] font-medium whitespace-nowrap transition-opacity hover:opacity-80"
            style={{ background: 'var(--color-accent)', color: 'var(--color-background)' }}
          >
            Again
          </button>
          <button onClick={() => setResult(null)} aria-label="Close" className="text-muted-foreground hover:text-foreground transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      </div>
    )
  }

  // ---- collapsed, and the whole of the phone case ----
  if (small || !wide) {
    return (
      <div className={shell}>
        <button
          onClick={() => { setSmall(false); try { localStorage.removeItem(SMALL_KEY) } catch {} }}
          aria-label="Eleven Shots — a game with the balls"
          title="Eleven Shots"
          className="pointer-events-auto grid place-items-center w-10 h-10 rounded-full backdrop-blur-sm transition-transform hover:scale-105"
          style={{ background: 'color-mix(in oklab, var(--color-card) 88%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 40%, var(--color-border))' }}
        >
          <RingMark size={18} />
        </button>
      </div>
    )
  }

  // ---- the invitation ----
  return (
    <div className={shell}>
      <div className="pointer-events-auto flex items-center h-10 rounded-full backdrop-blur-md game-cta animate-fade-in-up" style={skin}>
        <button onClick={start} className="flex items-center gap-2.5 h-10 pl-2.5 pr-1">
          <span className="grid place-items-center w-7 h-7 rounded-full shrink-0" style={{ background: 'color-mix(in oklab, var(--color-accent) 18%, transparent)' }}>
            <RingMark size={17} />
          </span>
          <span className="text-[12.5px] font-semibold text-foreground whitespace-nowrap">Eleven Shots</span>
          <span className="hidden sm:inline text-[11.5px] text-muted-foreground whitespace-nowrap">
            — throw a ball through the ring
          </span>
          {best ? <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">best {best.throws}</span> : null}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setSmall(true); try { localStorage.setItem(SMALL_KEY, '1') } catch {} }}
          aria-label="Shrink"
          className="w-7 h-10 grid place-items-center pr-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// The same two rings as the target, so the button and the thing you are
// aiming at are visibly the same object.
function RingMark({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="game-ring">
      <circle cx="12" cy="12" r="9.2" stroke="var(--color-accent)" strokeWidth="2.4" />
      <circle cx="12" cy="12" r="3.4" stroke="var(--color-accent)" strokeWidth="1.8" strokeDasharray="2 2.3" />
    </svg>
  )
}
