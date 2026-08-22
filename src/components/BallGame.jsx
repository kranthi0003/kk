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
 * Where it sits.
 *
 * The floor belongs to the balls. An early version put this bottom-left
 * beside the visitor count, which is exactly where they come to rest —
 * measured with elementFromPoint, the chip was on top of them and
 * swallowing the very grab the game depends on.
 *
 * So it sits centred, directly above them: close enough that it reads as
 * being about the balls, high enough that it never covers one. The height
 * is derived from --rail-size, the same variable the balls are sized
 * from, so it clears a two-high stack on any screen instead of relying on
 * a pixel figure that would be wrong the moment the rail changed.
 *
 * While a round is on, the panel stops taking pointer events except for
 * its own button. A thrown ball can come to rest anywhere, and one parked
 * underneath an unclickable panel would strand the round.
 * ------------------------------------------------------------------ */

// Above the floor inset, above two stacked balls, plus a little air.
const ABOVE_BALLS = 'calc(var(--rail-size) * 2 + 5.75rem)'

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
    // The balls take a few seconds to fall; offering a game before there
    // is anything to throw reads as broken.
    const t = setTimeout(() => setReady(true), 7000)
    return () => {
      window.removeEventListener('rail-game-state', onState)
      mq && mq.removeEventListener('change', onMotion)
      clearTimeout(t)
    }
  }, [])

  const start = () => { setResult(null); window.dispatchEvent(new CustomEvent('rail-game-start')) }
  const quit = () => window.dispatchEvent(new CustomEvent('rail-game-quit'))

  if (!ready || !motion) return null

  // inset-x-0 + flex rather than left-1/2 + -translate-x-1/2. The
  // translate approach put the panel half a width to the right and
  // squeezed it into the right half of a phone: a fixed element anchored
  // at left:50% only has half the window to lay out in, and the
  // fade-in-up animation overwrote the centring transform anyway.
  const shell = 'fixed inset-x-0 z-[60] flex justify-center px-4 pointer-events-none'

  // ---- during a round ----
  if (st.on) {
    return (
      <div
        className={shell}
        style={{ bottom: ABOVE_BALLS }}
      >
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-full backdrop-blur-md animate-fade-in-up"
          style={{
          background: 'color-mix(in oklab, var(--color-card) 90%, transparent)',
          boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 45%, var(--color-border)), 0 8px 30px rgba(0,0,0,0.35)',
        }}
      >
        <span className="flex gap-1" aria-hidden="true">
          {Array.from({ length: st.total }).map((_, i) => (
            <i
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-colors"
              style={{ background: i < st.potted ? 'var(--color-accent)' : 'color-mix(in oklab, var(--color-foreground) 20%, transparent)' }}
            />
          ))}
        </span>
        <span className="text-[13px] font-mono tabular-nums text-foreground">
          {st.potted}<span className="text-muted-foreground">/{st.total}</span>
        </span>
        <span className="text-[11.5px] font-mono text-muted-foreground tabular-nums hidden sm:inline">{st.throws} throws</span>
        <button
          onClick={quit}
          className="pointer-events-auto text-[11.5px] font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
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
      <div
        className={shell}
        style={{ bottom: ABOVE_BALLS }}
      >
        <div
          className="px-5 py-4 rounded-2xl backdrop-blur-md animate-fade-in-up text-center w-[min(20rem,calc(100vw-2rem))]"
          style={{
          background: 'color-mix(in oklab, var(--color-card) 94%, transparent)',
          boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 50%, var(--color-border)), 0 10px 40px rgba(0,0,0,0.4)',
        }}
      >
        <p className="text-[15px] font-semibold text-foreground">
          All eleven potted{isBest ? ' — best yet' : ''}
        </p>
        <p className="mt-1 text-[12.5px] font-mono text-muted-foreground tabular-nums">
          {result.throws} throws · {fmt(result.ms)}
          {best && !isBest ? <span> · best {best.throws}</span> : null}
        </p>
        <div className="mt-3 flex items-center justify-center gap-4 pointer-events-auto">
          <button
            onClick={start}
            className="px-3.5 py-1.5 rounded-full text-[12.5px] font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--color-accent)', color: 'var(--color-background)' }}
          >
            Play again
          </button>
          <button onClick={() => setResult(null)} className="text-[12.5px] font-mono text-muted-foreground hover:text-foreground transition-colors">
            close
          </button>
        </div>
        </div>
      </div>
    )
  }

  // ---- the launcher ----
  // Collapsed, it is a single quiet disc. Expanded, it says what the game
  // is and what you do — "play" alone doesn't tell you the balls are the
  // thing you play with.
  if (small) {
    return (
      <button
        onClick={() => { setSmall(false); try { localStorage.removeItem(SMALL_KEY) } catch {} }}
        aria-label="Eleven Shots — a game with the balls"
        title="Eleven Shots"
        className={shell}
        style={{ bottom: ABOVE_BALLS }}
      >
        <span
          className="pointer-events-auto grid place-items-center w-11 h-11 rounded-full backdrop-blur-sm transition-transform hover:scale-105"
          style={{
            background: 'color-mix(in oklab, var(--color-card) 88%, transparent)',
            boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 40%, var(--color-border))',
          }}
        >
          <RingMark size={19} />
        </span>
      </button>
    )
  }

  return (
    <div
      className={shell}
      style={{ bottom: ABOVE_BALLS }}
    >
      <div
        className="pointer-events-auto relative flex items-center gap-3 pl-4 pr-10 py-2.5 rounded-2xl backdrop-blur-md game-cta animate-fade-in-up"
        style={{
          background: 'color-mix(in oklab, var(--color-card) 92%, transparent)',
          boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 55%, var(--color-border)), 0 10px 34px rgba(0,0,0,0.38)',
        }}
      >
        <button onClick={start} className="flex items-center gap-3 text-left">
          <span className="grid place-items-center w-9 h-9 rounded-full shrink-0" style={{ background: 'color-mix(in oklab, var(--color-accent) 16%, transparent)' }}>
            <RingMark size={20} />
          </span>
          <span className="min-w-0">
            <span className="block text-[13.5px] font-semibold text-foreground leading-tight">
              Eleven Shots
              {best ? <span className="ml-1.5 text-[11px] font-mono font-normal text-muted-foreground">best {best.throws}</span> : null}
            </span>
            <span className="block text-[11.5px] text-muted-foreground leading-tight mt-0.5">
              Throw a ball through the ring
            </span>
          </span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setSmall(true); try { localStorage.setItem(SMALL_KEY, '1') } catch {} }}
          aria-label="Shrink"
          className="absolute top-1.5 right-1.5 w-6 h-6 grid place-items-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
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
