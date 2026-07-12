import React, { useEffect, useRef, useState } from 'react'
import { lockin } from '../lib/fitness'

// ============================================================
// LOCK-IN INTRO — a cinematic, full-screen motivational reel that
// plays when the HQ opens, then hands off to the dashboard with a
// Ferrari-style reveal. Autoplays muted (browser policy); a prominent
// "Sound on" unmutes on tap. Skippable; shows once per browser session.
// ============================================================
export default function LockInIntro({ onDone }) {
  const vref = useRef(null)
  const [muted, setMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const lk = lockin()

  const dismiss = () => {
    if (leaving) return
    setLeaving(true)
    setTimeout(() => onDone && onDone(), 640)
  }

  useEffect(() => {
    const v = vref.current
    if (!v) return
    const tryPlay = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}) }
    tryPlay()
    const onTime = () => { if (v.duration) setProgress(v.currentTime / v.duration) }
    const onEnd = () => dismiss()
    v.addEventListener('timeupdate', onTime)
    v.addEventListener('ended', onEnd)
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Enter') dismiss() }
    window.addEventListener('keydown', onKey)
    const hintT = setTimeout(() => setShowHint(false), 4200)
    return () => {
      v.removeEventListener('timeupdate', onTime)
      v.removeEventListener('ended', onEnd)
      window.removeEventListener('keydown', onKey)
      clearTimeout(hintT)
    }
  }, [])

  const unmute = () => {
    const v = vref.current; if (!v) return
    v.muted = false; setMuted(false); setShowHint(false)
    const p = v.play(); if (p && p.catch) p.catch(() => {})
  }
  const toggleSound = () => { muted ? unmute() : (() => { const v = vref.current; if (v) { v.muted = true; setMuted(true) } })() }

  const kicker = lk.status === 'upcoming'
    ? `Lock-in begins in ${lk.daysUntilStart} days`
    : lk.status === 'done' ? 'Six months. Done.' : `Day ${lk.day} of ${lk.total}`

  return (
    <div
      className="fixed inset-0 z-[999] overflow-hidden bg-black select-none"
      style={{ opacity: leaving ? 0 : 1, transform: leaving ? 'scale(1.05)' : 'none', transition: 'opacity .62s ease, transform .62s ease' }}
    >
      {/* Blurred backdrop (fills the sides on wide screens) with a slow drift */}
      <div className="absolute inset-0 lockin-kenburns"
        style={{ backgroundImage: 'url(/lockin-intro-poster.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px) brightness(.32) saturate(1.1)', transform: 'scale(1.2)' }} />

      {/* The reel, centred and fully visible */}
      <div className="absolute inset-0 flex items-center justify-center">
        <video
          ref={vref}
          src="/lockin-intro.mp4"
          poster="/lockin-intro-poster.jpg"
          autoPlay muted={muted} playsInline preload="auto"
          onClick={() => (muted ? unmute() : dismiss())}
          className="h-full w-auto max-w-full object-contain cursor-pointer"
          style={{ maxHeight: '100vh', boxShadow: '0 30px 120px -20px rgba(0,0,0,.9)' }}
        />
      </div>

      {/* Cinematic overlays: vignette + letterbox + film grain */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(120% 90% at 50% 45%, transparent 40%, rgba(0,0,0,.55) 100%)' }} />
      <div className="absolute inset-x-0 top-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,.75), transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,.8), transparent)' }} />
      <div className="absolute inset-0 pointer-events-none thq-grain" />

      {/* Top row — brand lockup + controls */}
      <div className="absolute inset-x-0 top-0 p-4 sm:p-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-white/90">
          <span className="text-lg">🔒</span>
          <div className="leading-tight">
            <div className="text-[11px] sm:text-xs font-semibold tracking-[0.22em] uppercase">The 6-Month Lock-In</div>
            <div className="text-[10px] text-white/55 tracking-wide">{kicker}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleSound}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur border border-white/15 transition-colors">
            {muted ? '🔇 Sound on' : '🔊 Sound'}
          </button>
          <button onClick={dismiss}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white/90 bg-white/5 hover:bg-white/15 backdrop-blur border border-white/10 transition-colors">
            Skip →
          </button>
        </div>
      </div>

      {/* Tap-for-sound hint */}
      {muted && showHint && (
        <button onClick={unmute}
          className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold text-white bg-black/45 backdrop-blur border border-white/20 lockin-pulse">
          🔊 Tap for sound
        </button>
      )}

      {/* Enter CTA appears as the reel winds down */}
      {progress > 0.82 && !leaving && (
        <button onClick={dismiss}
          className="absolute left-1/2 -translate-x-1/2 bottom-10 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-black bg-white hover:scale-[1.03] transition-transform lockin-fade-in">
          Enter the HQ →
        </button>
      )}

      {/* Progress bar */}
      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15">
        <div className="h-full bg-white/90" style={{ width: `${progress * 100}%`, transition: 'width .2s linear' }} />
      </div>
    </div>
  )
}
