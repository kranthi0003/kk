import React, { useEffect, useState } from 'react'
import { hasFitnessData, weekSummary } from '../lib/fitness'

// A quiet personal "pulse" — only appears on a browser that has real tracking
// data (so visitors never see an empty tracker). Reads the same localStorage
// the Transformation HQ writes. `compact` renders a small navbar pill.
export default function TransformationPulse({ compact = false }) {
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

  if (!data) return null

  const open = () => { window.location.hash = '#/transformation' }
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  // ---- Compact navbar pill: a tiny week-dot strip + count + streak ----
  if (compact) {
    return (
      <button
        onClick={open}
        title={`Transformation — ${data.wkWorkouts}/${data.scheduled} this week · ${data.allTimeWorkouts} all-time · open HQ`}
        aria-label="Open Transformation HQ"
        className="group inline-flex items-center gap-2 h-8 pl-2 pr-2.5 rounded-full border border-border/60 bg-card/40 backdrop-blur transition-colors hover:border-accent/40"
      >
        <span className="flex items-center gap-[3px]">
          {data.week.map((d, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={
                d.done
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
        <span className="text-[11px] font-medium text-foreground tabular-nums leading-none">{data.wkWorkouts}/{data.scheduled}</span>
        {data.streak > 0 && (
          <span className="text-[11px] text-muted-foreground leading-none tabular-nums">{data.streak}🔥</span>
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
          Transformation
        </span>
        <span className="text-[10px] text-muted-foreground/50 group-hover:text-accent transition-colors">open →</span>
      </div>

      {/* Week dots */}
      <div className="flex items-center justify-between gap-1 mb-2.5">
        {data.week.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span
              className="w-4 h-4 rounded-[5px] flex items-center justify-center"
              style={
                d.done
                  ? { background: 'var(--color-accent)' }
                  : {
                      background: 'transparent',
                      boxShadow: d.isToday
                        ? 'inset 0 0 0 1.5px color-mix(in oklab, var(--color-accent) 55%, transparent)'
                        : 'inset 0 0 0 1.5px color-mix(in oklab, var(--color-muted-foreground) 35%, transparent)',
                    }
              }
            >
              {d.done && (
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="var(--color-accent-foreground)" strokeWidth={3.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {!d.done && d.rest && (
                <span className="w-1 h-1 rounded-full" style={{ background: 'color-mix(in oklab, var(--color-muted-foreground) 40%, transparent)' }} />
              )}
            </span>
            <span className={`text-[8px] ${d.isToday ? 'text-accent' : 'text-muted-foreground/40'}`}>{dayLabels[i]}</span>
          </div>
        ))}
      </div>

      {/* Stats line */}
      <div className="flex items-center gap-3 text-[10.5px] text-muted-foreground">
        <span><b className="text-foreground tabular-nums">{data.wkWorkouts}/{data.scheduled}</b> this week</span>
        <span className="text-muted-foreground/30">·</span>
        {data.streak > 0 && (
          <>
            <span><b className="text-foreground tabular-nums">{data.streak}</b>🔥</span>
            <span className="text-muted-foreground/30">·</span>
          </>
        )}
        <span><b className="text-foreground tabular-nums">{data.allTimeWorkouts}</b> all-time</span>
      </div>
    </button>
  )
}
