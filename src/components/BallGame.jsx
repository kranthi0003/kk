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
 * All of it sits top-left, mirroring the Sidecar handle opposite. The
 * obvious spot was bottom-left next to the visitor count, but that is
 * exactly where the balls come to rest — the chip sat on top of them and
 * swallowed the very grab the game depends on. The floor belongs to the
 * balls.
 * ------------------------------------------------------------------ */

const BEST_KEY = 'rail_game_best'

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

  // ---- during a round ----
  if (st.on) {
    return (
      <div
        className="fixed top-20 left-6 z-[60] flex items-center gap-3 px-3.5 py-2 rounded-full backdrop-blur-md animate-fade-in-up"
        style={{ background: 'color-mix(in oklab, var(--color-card) 88%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 34%, var(--color-border))' }}
      >
        <span className="flex gap-1" aria-hidden="true">
          {Array.from({ length: st.total }).map((_, i) => (
            <i
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: i < st.potted ? 'var(--color-accent)' : 'color-mix(in oklab, var(--color-foreground) 22%, transparent)' }}
            />
          ))}
        </span>
        <span className="text-[12px] font-mono tabular-nums text-foreground">
          {st.potted}<span className="text-muted-foreground">/{st.total}</span>
        </span>
        <span className="text-[11px] font-mono text-muted-foreground tabular-nums">{st.throws} throws</span>
        <button onClick={quit} className="text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors">stop</button>
      </div>
    )
  }

  // ---- just won ----
  if (result) {
    const isBest = best && result.throws === best.throws && result.ms === best.ms
    return (
      <div
        className="fixed top-20 left-6 z-[60] px-4 py-3 rounded-2xl backdrop-blur-md animate-fade-in-up max-w-[300px]"
        style={{ background: 'color-mix(in oklab, var(--color-card) 92%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 40%, var(--color-border))' }}
      >
        <p className="text-[13px] font-medium text-foreground">
          All eleven potted{isBest ? ' — best yet' : ''}
        </p>
        <p className="mt-1 text-[12px] font-mono text-muted-foreground tabular-nums">
          {result.throws} throws · {fmt(result.ms)}
          {best && !isBest ? <span> · best {best.throws}</span> : null}
        </p>
        <div className="mt-2.5 flex items-center gap-3">
          <button onClick={start} className="text-[12px] font-mono text-foreground hover:opacity-70 transition-opacity">play again</button>
          <button onClick={() => setResult(null)} className="text-[12px] font-mono text-muted-foreground hover:text-foreground transition-colors">close</button>
        </div>
      </div>
    )
  }

  // ---- the launcher ----
  return (
    <button
      onClick={start}
      className="fixed top-20 left-6 z-[60] inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-lg animate-fade-in-up transition-opacity hover:opacity-80"
      style={{ background: 'color-mix(in oklab, var(--color-card) 85%, transparent)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}
      title="Throw the balls through the ring"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="var(--color-accent)" strokeWidth="2.4" />
        <circle cx="12" cy="12" r="3.2" stroke="var(--color-accent)" strokeWidth="2" strokeDasharray="2 2.2" />
      </svg>
      <span className="text-[11.5px] font-mono text-muted-foreground">
        eleven shots{best ? <span className="opacity-70"> · best {best.throws}</span> : null}
      </span>
    </button>
  )
}
