import React, { useEffect, useState } from 'react'
import { hasFitnessData, weekSummary } from '../lib/fitness'

// A quiet personal "pulse" — only appears on a browser that has real tracking
// data (so visitors never see an empty tracker). Reads the same localStorage
// the Transformation HQ writes. `compact` renders a small navbar pill.
export default function TransformationPulse({ compact = false, labeled = false }) {
  const [data, setData] = useState(() => (hasFitnessData() ? weekSummary() : null))

  useEffect(() => {
    const refresh = () => setData(hasFitnessData() ? weekSummary() : null)
    refresh()
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const open = () => { window.location.hash = '#/transformation' }

  // ---- Labeled navbar entry — the primary link to the Lock-In (always shown) ----
  if (labeled) {
    const flame = data?.clockStreak || 0
    return (
      <button
        onClick={open}
        title="Open Lock-In — your 6-month transformation"
        aria-label="Open Lock-In"
        className="group inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-border/60 bg-card/40 backdrop-blur transition-colors hover:border-accent/40 hover:text-foreground"
      >
        <span className="text-[13px] leading-none">🔒</span>
        <span className="text-[12px] font-medium text-foreground leading-none">Lock-In</span>
        {flame > 0 && <span className="text-[11px] text-muted-foreground leading-none tabular-nums">{flame}🔥</span>}
      </button>
    )
  }

  if (!data) return null

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const clockedThisWeek = data.week.filter(d => d.clockedIn).length
  const flame = data.clockStreak || 0

  // ---- Compact navbar pill: a tiny week-dot strip + streak ----
  if (compact) {
    return (
      <button
        onClick={open}
        title={`6-Month Lock-In — clocked in ${clockedThisWeek}/7 this week · ${flame}-day streak · open HQ`}
        aria-label="Open Transformation HQ"
        className="group inline-flex items-center gap-2 h-8 pl-2 pr-2.5 rounded-full border border-border/60 bg-card/40 backdrop-blur transition-colors hover:border-accent/40"
      >
        <span className="flex items-center gap-[3px]">
          {data.week.map((d, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={
                d.clockedIn
                  ? { background: 'var(--color-accent)' }
                  : {
                      background: d.isToday
                        ? 'color-mix(in oklab, var(--color-accent) 45%, transparent)'
                        : 'color-mix(in oklab, var(--color-muted-foreground) 30%, transparent)',
                    }
              }
            />
          ))}
        </span>
        <span className="text-[11px] font-medium text-foreground tabular-nums leading-none">🔒</span>
        {flame > 0 && (
          <span className="text-[11px] text-muted-foreground leading-none tabular-nums">{flame}🔥</span>
        )}
      </button>
    )
  }

  return (
    <button
      onClick={open}
      title="Open Transformation HQ"
      className="group w-[244px] rounded-xl border border-border/60 bg-card/40 backdrop-blur px-3.5 py-3 text-left shadow-lg transition-colors hover:border-accent/40"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground/70">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
          </span>
          6-Month Lock-In
        </span>
        <span className="text-[10px] text-muted-foreground/50 group-hover:text-accent transition-colors">open →</span>
      </div>

      {/* Week dots — green = clocked in */}
      <div className="flex items-center justify-between gap-1 mb-2.5">
        {data.week.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span
              className="w-4 h-4 rounded-[5px] flex items-center justify-center"
              style={
                d.clockedIn
                  ? { background: 'var(--color-accent)' }
                  : {
                      background: 'transparent',
                      boxShadow: d.isToday
                        ? 'inset 0 0 0 1.5px color-mix(in oklab, var(--color-accent) 55%, transparent)'
                        : 'inset 0 0 0 1.5px color-mix(in oklab, var(--color-muted-foreground) 35%, transparent)',
                    }
              }
            >
              {d.clockedIn && (
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="var(--color-accent-foreground)" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <span className={`text-[8px] ${d.isToday ? 'text-accent' : 'text-muted-foreground/40'}`}>{dayLabels[d.idx]}</span>
          </div>
        ))}
      </div>

      {/* Stats line */}
      <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
        <span><b className="text-foreground tabular-nums">{clockedThisWeek}/7</b> this week</span>
        <span className="text-muted-foreground/30">·</span>
        {flame > 0 && (
          <>
            <span><b className="text-foreground tabular-nums">{flame}</b>🔥</span>
            <span className="text-muted-foreground/30">·</span>
          </>
        )}
        <span className="tabular-nums">
          {data.lockin.status === 'upcoming'
            ? `${data.lockin.daysUntilStart}d to go`
            : data.lockin.status === 'done'
              ? 'done 🏆'
              : `Day ${data.lockin.day}`}
        </span>
      </div>
    </button>
  )
}
