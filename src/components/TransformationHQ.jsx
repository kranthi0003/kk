import React, { useEffect, useMemo, useState } from 'react'
import {
  lsGet, lsSet, todayKey, localKey,
  PLAN, SCHEDULED_DAYS, workoutLabelForDay, ytUrl,
  thisWeekDates, dayCompletion, workoutDoneForDate, cumulativeStats,
  lockin, isClockedIn, clockIn, clockInAt, clockInStreak, longestClockInStreak,
  totalClockIns, daySummary, weekAdherence, lifetimeTotals,
} from '../lib/fitness'
import { WEEK, SALADS, NUTRITION, MEAL_TIMES, todayPlan, weeklyGrocery, PLAN_DAYS } from '../lib/diet'
import { AM, PM, WEEKLY, GLOW, RULES, BODY_PIGMENTATION, HAIR, skinFor, setSkin } from '../lib/skincare'
import { PLAYLIST, watchUrl, playAllUrl, STARTER } from '../lib/gymPlaylist'
import { FOUNDATION, PHASES, STREAKS, URGE_PLAN, streakDays, streakBest, streakStarted, streakStart, streakReset } from '../lib/protocol'
import LockInIntro from './LockInIntro'
import { useAmbient } from './AmbientContext'

// ============================================================
// TRANSFORMATION HQ — the 6-Month Lock-In
// Aug 1 2026 → Jan 31 2027 · home gym + calorie deficit + skincare.
// Goal: body fat down, skin glowing, strongest+sharpest version.
// Clock in every day. Track everything. Win.
// Storage: localStorage ("thq:*"). Shared helpers in ../lib/fitness.
// ============================================================

const TABS = [
  { id: 'today',    icon: '✅', label: 'Today' },
  { id: 'roadmap',  icon: '🗺️', label: 'Roadmap' },
  { id: 'monitor',  icon: '📊', label: 'Monitor' },
  { id: 'gym',      icon: '🏋️', label: 'Gym' },
  { id: 'diet',     icon: '🥗', label: 'Diet' },
  { id: 'skincare', icon: '✨', label: 'Skin & Hair' },
  { id: 'discipline', icon: '🧠', label: 'Discipline' },
  { id: 'playlist', icon: '🎧', label: 'Playlist' },
  { id: 'progress', icon: '📈', label: 'Progress' },
]

const ACCENT = 'var(--chart-1)'

// ------- daily habit toggles (steps/water/sleep/no-junk live in thq:day:<date>)
const HABITS = [
  { key: 'steps',  emoji: '🚶', label: '10,000 steps',        sub: 'split it: morning + post-lunch + evening' },
  { key: 'water',  emoji: '💧', label: '3 L water',           sub: 'clearer skin, less bloat, better fullness' },
  { key: 'sleep',  emoji: '😴', label: '7–8 hrs sleep',       sub: 'fat loss + skin repair happen here' },
  { key: 'nojunk', emoji: '🚫', label: 'No junk / liquid cals', sub: 'the single biggest belly + skin driver' },
]

const STEPS_SPLIT = [
  ['Morning walk', '~3,500'],
  ['After lunch (10 min)', '~2,000'],
  ['Evening walk', '~3,500'],
  ['Incidental (stairs, errands)', '~1,000'],
]

const NUTRITION_RULES = [
  'Protein FIRST at every meal',
  'Half the plate = vegetables',
  'Light oil (1–2 tsp) · grill/bake over fry',
  'Zero sugary drinks / juice (biggest belly driver)',
  'Water before meals · stop at 80% full',
  '1 relaxed meal/week so you never quit',
]

const MILESTONES = [
  ['Aug — Month 1', 'Lock the habits: clock in daily · 6 lifts/wk · 10k steps · SPF every morning'],
  ['Sep–Oct — Month 2–3', 'Deficit biting — belly visibly flatter, face de-bloats, skin clearer'],
  ['Nov–Dec — Month 4–5', 'Lean & defined — clothes fit different, energy + confidence up'],
  ['Jan 31 🏆', 'Six months, no misses. Lowest body fat, glowing skin. You won.'],
]

// ------- small UI atoms ---------------------------------------------------
function Card({ title, sub, children, className = '', right }) {
  return (
    <div className={`rounded-2xl border bg-card/60 backdrop-blur-sm p-4 sm:p-5 ${className}`}
      style={{ borderColor: 'color-mix(in oklab, var(--chart-1) 16%, var(--color-border))' }}>
      {(title || right) && (
        <div className="flex items-start justify-between gap-2 mb-1">
          {title && <h2 className="font-heading text-foreground text-sm sm:text-[15px] font-semibold">{title}</h2>}
          {right}
        </div>
      )}
      {sub && <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{sub}</p>}
      {children}
    </div>
  )
}

function Pill({ children }) {
  return (
    <span className="inline-block rounded-full px-3 py-1 text-[11px] text-muted-foreground"
      style={{ background: 'color-mix(in oklab, var(--chart-1) 8%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 20%, transparent)' }}>
      {children}
    </span>
  )
}

function Note({ children }) {
  return (
    <div className="mt-3 text-xs text-muted-foreground rounded-lg px-3 py-2 leading-relaxed"
      style={{ background: 'color-mix(in oklab, var(--chart-1) 7%, transparent)', borderLeft: '3px solid color-mix(in oklab, var(--chart-1) 55%, transparent)' }}>
      {children}
    </div>
  )
}

function Stat({ value, label, hot }) {
  return (
    <div className="flex-1 min-w-[80px] rounded-xl border p-3 text-center"
      style={{ borderColor: 'color-mix(in oklab, var(--chart-1) 16%, var(--color-border))', background: 'color-mix(in oklab, var(--chart-1) 5%, transparent)' }}>
      <div className="text-xl font-semibold tabular-nums" style={{ color: hot ? 'var(--color-foreground)' : ACCENT }}>{value}</div>
      <div className="text-[10.5px] text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}

function ProgressBar({ pct, height = 8 }) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: 'color-mix(in oklab, var(--chart-1) 12%, transparent)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: ACCENT }} />
    </div>
  )
}

// Circular progress ring (for the monitor).
function Ring({ pct, size = 66, stroke = 7, label, value, color = ACCENT }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const off = c - (Math.max(0, Math.min(100, pct)) / 100) * c
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="color-mix(in oklab, var(--chart-1) 14%, transparent)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={off} style={{ transition: 'stroke-dashoffset .6s ease' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[13px] font-semibold text-foreground tabular-nums">{value != null ? value : `${Math.round(pct)}%`}</span>
        </div>
      </div>
      {label && <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>}
    </div>
  )
}

const ytLink = (id) => (
  <a href={ytUrl(id)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
    className="flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-medium transition-colors"
    style={{ background: 'color-mix(in oklab, var(--chart-1) 10%, transparent)', color: ACCENT, boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 24%, transparent)' }}
    title="Watch the form demo on YouTube">
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
    Form
  </a>
)

// ============================================================
// LOCK-IN HEADER BANNER
// ============================================================
function LockInBanner({ lk }) {
  if (lk.status === 'upcoming') {
    return (
      <p className="text-[10.5px] text-muted-foreground hidden sm:block tracking-wide">
        Lock-in begins <b className="text-foreground">Aug 1</b> · in <b className="text-foreground">{lk.daysUntilStart}</b> days — finish the US trip, then we go to war
      </p>
    )
  }
  if (lk.status === 'done') {
    return <p className="text-[10.5px] hidden sm:block tracking-wide" style={{ color: ACCENT }}>6 months. No misses. You won. 🏆</p>
  }
  return (
    <p className="text-[10.5px] text-muted-foreground hidden sm:block tracking-wide">
      Day <b className="text-foreground">{lk.day}</b> of {lk.total} · <b className="text-foreground">{lk.remaining}</b> days left · fat down, skin glowing
    </p>
  )
}

// ============================================================
// MAIN
// ============================================================
export default function TransformationHQ({ onBack }) {
  const [tab, setTab] = useState(() => {
    const fromHash = window.location.hash.split('?')[1]?.split('=')?.[1]
    return TABS.find(t => t.id === fromHash)?.id || 'today'
  })

  useEffect(() => {
    const base = window.location.hash.startsWith('#/fitness') ? '#/fitness' : '#/transformation'
    const newHash = `${base}?tab=${tab}`
    if (window.location.hash !== newHash) window.history.replaceState(null, '', newHash)
  }, [tab])

  const lk = lockin()

  // Cinematic intro — plays once per browser session (skipped for reduced motion).
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const [intro, setIntro] = useState(() => {
    try { if (sessionStorage.getItem('thq:introSeen')) return false } catch {}
    return !prefersReduced
  })
  const [justRevealed, setJustRevealed] = useState(false)
  const dismissIntro = () => {
    try { sessionStorage.setItem('thq:introSeen', '1') } catch {}
    setIntro(false)
    setJustRevealed(true)
    setTimeout(() => setJustRevealed(false), 1600)
  }
  const replayIntro = () => {
    try { sessionStorage.removeItem('thq:introSeen') } catch {}
    setJustRevealed(false)
    setIntro(true)
  }

  // Silence the site's ambient radio while the Lock-In page is open — it should
  // never play over the intro reel or the gym playlist. Restore it on the way out
  // only if it was actually playing when we arrived.
  const ambient = useAmbient()
  useEffect(() => {
    if (!ambient) return
    const wasPlaying = ambient.playing
    ambient.setSuppressed(true)
    return () => {
      ambient.setSuppressed(false)
      if (wasPlaying) ambient.play()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      {intro && <LockInIntro onDone={dismissIntro} />}
      <div className={`min-h-screen bg-background${justRevealed ? ' thq-enter' : ''}`}>
      {/* Top bar */}
      <div className="sticky top-0 z-30 thq-nav-surface backdrop-blur-xl border-b"
        style={{ borderBottomColor: 'color-mix(in oklab, var(--chart-1) 22%, var(--color-border))' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button
            onClick={onBack || (() => { window.location.hash = '' })}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm group"
          >
            <span className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              style={{ background: 'color-mix(in oklab, var(--chart-1) 8%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 22%, transparent)' }}>
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </span>
            <span className="hidden sm:inline">Back to site</span>
          </button>
          <div className="text-center flex-1 min-w-0">
            <h1 className="font-heading text-foreground text-base sm:text-lg font-semibold flex items-center justify-center gap-2 tracking-tight">
              <span className="text-lg">🔒</span>
              <span>The <span className="text-gradient-violet">6-Month Lock-In</span></span>
            </h1>
            <LockInBanner lk={lk} />
          </div>
          <div className="w-20 sm:w-28 flex-shrink-0" />
        </div>

        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-3 pb-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-0.5 min-w-fit">
            {TABS.map(t => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all"
                  style={active ? {
                    background: 'color-mix(in oklab, var(--chart-1) 16%, transparent)',
                    color: 'var(--color-foreground)',
                    boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 38%, transparent), 0 2px 8px -2px color-mix(in oklab, var(--chart-1) 35%, transparent)',
                  } : { color: 'var(--color-muted-foreground)' }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-foreground)' }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-muted-foreground)' }}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="thq-body max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-16 space-y-4">
        {tab === 'today'    && <TodayTab lk={lk} go={setTab} />}
        {tab === 'roadmap'  && <RoadmapTab lk={lk} go={setTab} />}
        {tab === 'monitor'  && <MonitorTab lk={lk} />}
        {tab === 'gym'      && <GymTab />}
        {tab === 'diet'     && <DietTab />}
        {tab === 'skincare' && <SkincareTab />}
        {tab === 'discipline' && <DisciplineTab />}
        {tab === 'playlist' && <PlaylistTab />}
        {tab === 'progress' && <ProgressTab />}
      </div>

      <div className="border-t border-border/30 py-4 text-center flex items-center justify-center gap-3 flex-wrap">
        <span className="text-[10px] text-muted-foreground/60 font-mono">All data stored locally · no cloud · no judgment · just show up</span>
        <button onClick={replayIntro} className="text-[10px] text-muted-foreground/50 hover:text-foreground font-mono transition-colors">↻ replay intro</button>
      </div>
      </div>
    </>
  )
}

// ============================================================
// TODAY — the daily clock-in hub
// ============================================================
function TodayTab({ lk, go }) {
  const tk = todayKey()
  const [day, setDay] = useState(() => lsGet(`day:${tk}`, {}))
  const [clocked, setClocked] = useState(() => isClockedIn(tk))
  const [tick, setTick] = useState(0) // force re-read of pillar status

  const refresh = () => setTick(t => t + 1)
  const toggle = (k) => { const next = { ...day, [k]: !day[k] }; setDay(next); lsSet(`day:${tk}`, next) }
  const doClockIn = () => { clockIn(tk); setClocked(true) }

  const now = new Date()
  const lift = workoutLabelForDay(now.getDay())
  const s = useMemo(() => daySummary(tk), [tk, tick, clocked, day])
  const streak = useMemo(() => clockInStreak(), [clocked, tick])

  // pillars = the three big daily wins
  const pillars = [
    { key: 'workout',  emoji: '🏋️', label: s.rest ? 'Rest day' : (lift || 'Workout'), tab: 'gym',
      done: s.workout, detail: s.rest ? 'Recovery — walk only' : 'check off in Gym' },
    { key: 'diet',     emoji: '🥗', label: 'Two clean meals', tab: 'diet',
      done: s.meals === 2, detail: `${s.meals}/2 logged` },
    { key: 'skincare', emoji: '✨', label: 'Skincare AM + PM', tab: 'skincare',
      done: s.skin === 2, detail: `${s.skin}/2 done` },
  ]
  const habitsDone = HABITS.filter(h => day[h.key]).length
  const pillarsDone = pillars.filter(p => p.done).length
  const dayWon = clocked && pillarsDone === 3 && habitsDone === HABITS.length

  // this week strip (green = clocked-in day)
  const week = thisWeekDates()

  return (
    <>
      {/* Clock-in hero */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ borderColor: 'color-mix(in oklab, var(--chart-1) 26%, var(--color-border))', background: 'color-mix(in oklab, var(--chart-1) 7%, transparent)' }}>
        <div className="p-5 sm:p-6 text-center">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
            {lk.status === 'upcoming' ? 'Pre-season' : lk.status === 'done' ? 'Complete' : `Day ${lk.day} of ${lk.total}`}
          </div>
          <div className="font-heading text-lg sm:text-xl font-semibold text-foreground mb-3">{now.toDateString()}</div>

          {clocked ? (
            <div className="inline-flex flex-col items-center gap-1">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                style={{ background: ACCENT, color: 'var(--color-background)' }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                Clocked in today
              </div>
              <span className="text-[11px] text-muted-foreground">
                {clockInAt(tk) ? new Date(clockInAt(tk)).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''} · streak {streak} 🔥
              </span>
            </div>
          ) : (
            <button onClick={doClockIn}
              className="group inline-flex items-center gap-2 rounded-full px-6 py-3 text-[15px] font-bold transition-transform hover:scale-[1.03] active:scale-95"
              style={{ background: ACCENT, color: 'var(--color-background)', boxShadow: '0 8px 24px -6px color-mix(in oklab, var(--chart-1) 60%, transparent)' }}>
              <span className="text-lg">🔒</span> CLOCK IN
              {streak > 0 && <span className="opacity-80">· {streak}🔥</span>}
            </button>
          )}
          <p className="text-[11px] text-muted-foreground mt-3 max-w-sm mx-auto leading-relaxed">
            {dayWon
              ? '🏆 Day won. Everything checked. This is exactly how it’s done — see you tomorrow.'
              : 'Clock in the moment you start. Then knock out the three pillars below. Showing up is the whole game.'}
          </p>
        </div>
      </div>

      {/* Three pillars */}
      <Card title="Today's mission" sub="Three pillars + the daily habits. Tap a pillar to open it.">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {pillars.map(p => (
            <button key={p.key} onClick={() => go(p.tab)}
              className="rounded-xl border p-3 text-center transition-colors"
              style={{ borderColor: p.done ? 'color-mix(in oklab, var(--chart-1) 42%, transparent)' : 'var(--color-border)', background: p.done ? 'color-mix(in oklab, var(--chart-1) 10%, transparent)' : 'transparent' }}>
              <div className="text-xl mb-0.5">{p.emoji}</div>
              <div className="text-[12px] font-medium text-foreground leading-tight">{p.label}</div>
              <div className="text-[10px] mt-1" style={{ color: p.done ? ACCENT : 'var(--color-muted-foreground)' }}>
                {p.done ? '✓ done' : p.detail}
              </div>
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {HABITS.map(h => {
            const done = !!day[h.key]
            return (
              <button key={h.key} onClick={() => toggle(h.key)}
                className="w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors"
                style={{ borderColor: 'color-mix(in oklab, var(--chart-1) 14%, var(--color-border))', background: done ? 'color-mix(in oklab, var(--chart-1) 10%, transparent)' : 'transparent' }}>
                <span className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center"
                  style={{ background: done ? ACCENT : 'transparent', boxShadow: done ? 'none' : 'inset 0 0 0 2px var(--color-muted-foreground)' }}>
                  {done && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="var(--color-background)" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`text-[13px] ${done ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{h.emoji} {h.label}</span>
                  {h.sub && <span className="block text-[11px] text-muted-foreground">{h.sub}</span>}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* This week */}
      <Card title="📆 This week" sub="Green = a day you clocked in. Never miss twice in a row.">
        <div className="grid grid-cols-7 gap-1.5">
          {week.map((d) => {
            const ci = isClockedIn(d.dateKey)
            const labels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
            return (
              <div key={d.dateKey} className="aspect-square rounded-lg border flex flex-col items-center justify-center text-[10px]"
                style={ci
                  ? { background: ACCENT, color: 'var(--color-background)', borderColor: ACCENT, fontWeight: 700 }
                  : { borderColor: d.isToday ? 'color-mix(in oklab, var(--chart-1) 45%, transparent)' : 'var(--color-border)', color: 'var(--color-muted-foreground)' }}>
                <span>{labels[d.idx]}</span>
                <span className="text-[11px]">{d.date}</span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-2.5 mt-3">
          <Stat value={streak} label="clock-in streak" />
          <Stat value={`${pillarsDone}/3`} label="pillars today" />
          <Stat value={`${habitsDone}/${HABITS.length}`} label="habits today" />
        </div>
      </Card>

      {/* Daily rhythm reference */}
      <Card title="🕮 Your daily rhythm" sub="The order that makes it effortless.">
        <ol className="space-y-1.5 text-[13px] text-foreground">
          <li>🌅 <b>Wake</b> — water, cleanser + vitamin C + moisturiser + <b>SPF</b></li>
          <li>🚶 <b>Morning walk</b> (~3,500 steps) + clock in</li>
          <li>🍽️ <b>Meal 1</b> (~11 AM) — protein + salad</li>
          <li>🏋️ <b>Train</b> — today: {s.rest ? 'rest / easy walk' : (lift || 'workout')}</li>
          <li>🍽️ <b>Meal 2</b> (~6 PM) — protein + veg</li>
          <li>🌙 <b>Wind down</b> — PM skincare, no screens, 7–8 hrs sleep</li>
        </ol>
      </Card>
    </>
  )
}

// ============================================================
// MONITOR — the progress dashboard
// ============================================================
function MonitorTab({ lk }) {
  const totals = useMemo(() => lifetimeTotals(), [])
  const adh = useMemo(() => weekAdherence(), [])
  const streak = useMemo(() => clockInStreak(), [])
  const weights = lsGet('weights', [])

  const start = weights[0]
  const latest = weights[weights.length - 1]
  const delta = start && latest ? +(latest.kg - start.kg).toFixed(1) : null

  // verdict
  const winning = streak >= 3 && adh.clocked >= 70
  const building = streak >= 1
  const somedata = totals.clockIns > 0

  return (
    <>
      {/* 6-month progress */}
      <Card title={`🔒 ${lk.status === 'upcoming' ? 'Lock-in countdown' : lk.status === 'done' ? 'Lock-in complete' : 'The 6-month window'}`}
        sub={lk.status === 'upcoming'
          ? 'Post US trip, the clock starts. Everything below is warming up.'
          : `Aug 1, 2026 → Jan 31, 2027 · ${lk.total} days`}>
        {lk.status === 'upcoming' ? (
          <div className="flex items-center gap-4">
            <Ring pct={0} value={lk.daysUntilStart} label="days to go" size={78} />
            <div className="flex-1 text-[13px] text-muted-foreground leading-relaxed">
              <b className="text-foreground">{lk.daysUntilStart} days</b> until the lock-in begins. Use them to rest, enjoy the trip, and prep the home gym. Any reps you log now are a bonus head start.
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[15px] font-semibold text-foreground">Day {lk.day} <span className="text-muted-foreground font-normal">of {lk.total}</span></span>
              <span className="text-[12px] text-muted-foreground">Week {lk.weekNo}/{lk.weeksTotal} · {lk.remaining} left</span>
            </div>
            <ProgressBar pct={lk.pct} height={10} />
            <div className="text-[11px] text-muted-foreground mt-1.5 text-right">{lk.pct}% through</div>
          </>
        )}
      </Card>

      {/* Big counters */}
      <Card title="🎯 The monitor" sub="Everything you've banked so far.">
        <div className="grid grid-cols-3 gap-2">
          <Stat value={totals.clockIns} label="days clocked in" hot />
          <Stat value={`${streak}🔥`} label="current streak" hot />
          <Stat value={totals.longest} label="longest streak" hot />
          <Stat value={totals.workouts} label="workouts done" />
          <Stat value={totals.meals} label="clean meals" />
          <Stat value={totals.skin} label="skincare sessions" />
        </div>
      </Card>

      {/* Adherence rings */}
      <Card title="📊 This week's adherence" sub="How consistent you've been across each pillar.">
        <div className="grid grid-cols-5 gap-1.5">
          <Ring pct={adh.clocked} label="Clock-in" />
          <Ring pct={adh.workout} label="Workouts" />
          <Ring pct={adh.diet} label="Diet" />
          <Ring pct={adh.skin} label="Skincare" />
          <Ring pct={adh.steps} label="Steps" />
        </div>
      </Card>

      {/* Weight trend */}
      <Card title="⚖️ Weight trend" sub={weights.length ? 'Since you started logging.' : 'Log your first weigh-in on the Progress tab to see the trend.'}>
        {weights.length >= 2 ? (
          <>
            <Sparkline data={weights} />
            <div className="flex gap-2.5 mt-3">
              <Stat value={`${start.kg}`} label="start (kg)" />
              <Stat value={`${latest.kg}`} label="latest (kg)" />
              <Stat value={delta === null ? '—' : `${delta <= 0 ? '▼' : '▲'} ${Math.abs(delta)}`} label="change (kg)" />
            </div>
          </>
        ) : (
          <div className="text-[13px] text-muted-foreground">No trend yet — {weights.length === 1 ? 'one weigh-in logged.' : 'add weigh-ins weekly and watch the line fall.'}</div>
        )}
      </Card>

      {/* Verdict */}
      <div className="rounded-2xl border p-4 sm:p-5 text-center"
        style={{ borderColor: (winning || building) ? 'color-mix(in oklab, var(--chart-1) 40%, transparent)' : 'var(--color-border)', background: (winning || building) ? 'color-mix(in oklab, var(--chart-1) 10%, transparent)' : 'transparent' }}>
        <div className="text-2xl mb-1">{!somedata ? '🚀' : winning ? '🏆' : building ? '🔥' : '💪'}</div>
        <div className="font-heading text-foreground font-semibold">
          {!somedata ? 'Line up the first rep' : winning ? "You're winning this." : building ? "Momentum's building." : 'Lock back in.'}
        </div>
        <p className="text-[12px] text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
          {!somedata
            ? 'Clock in today and the counters start moving. Momentum is one button away.'
            : winning
              ? `${streak}-day streak, ${adh.clocked}% clock-in this week. This is what winning looks like — don't break it.`
              : building
                ? `You're on the board — ${streak}-day streak. Stack another, then another. Never miss twice in a row.`
                : 'The streak cooled off. One clock-in resets everything. Do today, and never miss twice.'}
        </p>
      </div>
    </>
  )
}

// tiny inline weight sparkline
function Sparkline({ data }) {
  const w = 100, h = 34
  const xs = data.map(d => d.kg)
  const min = Math.min(...xs), max = Math.max(...xs)
  const span = max - min || 1
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((d.kg - min) / span) * (h - 6) - 3
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 44 }} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={ACCENT} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// ============================================================
// GYM — home-gym plan, each exercise links a verified form demo
// ============================================================
function PostureCard() {
  const [play, setPlay] = useState(false)
  const id = 'PQnS87AnnR0'
  return (
    <Card title="🧍 Posture reset" sub="Desk work wrecks posture. This quick routine from Dr. Berg undoes forward-head, rounded shoulders and lower-back slump — do it along, daily.">
      <div className="relative w-full overflow-hidden rounded-xl border" style={{ aspectRatio: '16 / 9', borderColor: 'color-mix(in oklab, var(--chart-1) 20%, transparent)' }}>
        {play ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title="Correct Your Posture in Just Minutes!"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button onClick={() => setPlay(true)} className="group absolute inset-0 w-full h-full cursor-pointer" aria-label="Play the posture routine">
            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="Correct Your Posture in Just Minutes!" className="w-full h-full object-cover" loading="lazy" />
            <span className="absolute inset-0 flex items-center justify-center transition-colors" style={{ background: 'color-mix(in oklab, #000 32%, transparent)' }}>
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-full transition-transform group-hover:scale-110" style={{ background: 'rgba(0,0,0,.62)', boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}>
                <svg className="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
              </span>
            </span>
          </button>
        )}
      </div>
      <Note>Watch once, then follow along — <b className="text-foreground">every morning</b> and after long desk sessions.</Note>
    </Card>
  )
}

function GymTab() {
  const week = useMemo(thisWeekDates, [])
  const initial = Math.max(0, week.findIndex(d => d.isToday))
  const [sel, setSel] = useState(initial)
  const day = week[sel]
  const plan = PLAN[day.idx]
  const [log, setLog] = useState(() => lsGet(`workout:${day.dateKey}`, {}))

  useEffect(() => { setLog(lsGet(`workout:${day.dateKey}`, {})) }, [day.dateKey])

  const toggle = (exId) => { const next = { ...log, [exId]: !log[exId] }; setLog(next); lsSet(`workout:${day.dateKey}`, next) }
  const setAll = (val) => {
    const next = {}
    if (val) plan.exercises.forEach(e => { next[e.id] = true })
    setLog(next); lsSet(`workout:${day.dateKey}`, next)
  }

  const total = plan.exercises.length
  const done = plan.exercises.filter(e => log[e.id]).length
  const pct = total ? Math.round((done / total) * 100) : 0
  const labels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <>
      <Card title="🏠 Home gym" sub="Everything here needs only adjustable dumbbells + a bench. Train Mon–Sat, rest Sunday.">
        <div className="flex flex-wrap gap-2">
          <Pill>🏋️ Adjustable dumbbells</Pill>
          <Pill>🪑 Flat / incline bench</Pill>
          <Pill>🧘 A mat</Pill>
          <Pill>⏱️ 45–60 min</Pill>
        </div>
        <Note>Every exercise has a <b className="text-foreground">▶ Form</b> link — tap it to watch the technique before your first set. Good form = results without injury.</Note>
      </Card>

      <PostureCard />

      {/* Day selector */}
      <div className="grid grid-cols-7 gap-1.5">
        {week.map((d, i) => {
          const p = PLAN[d.idx]
          const comp = workoutDoneForDate(d.dateKey)
          const active = i === sel
          return (
            <button key={i} onClick={() => setSel(i)}
              className="rounded-xl border py-2 flex flex-col items-center gap-0.5 transition-all"
              style={active
                ? { background: 'color-mix(in oklab, var(--chart-1) 16%, transparent)', borderColor: 'color-mix(in oklab, var(--chart-1) 42%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 30%, transparent)' }
                : { borderColor: d.isToday ? 'color-mix(in oklab, var(--chart-1) 38%, transparent)' : 'var(--color-border)' }}>
              <span className="text-[10px] text-muted-foreground">{labels[d.idx]}</span>
              <span className="text-[11px] font-semibold text-foreground">{d.date}</span>
              <span className="text-[10px] leading-none">{p.rest ? '🛌' : comp ? '✅' : '•'}</span>
            </button>
          )
        })}
      </div>

      <Card title={`${plan.day} — ${plan.name}`} sub={plan.focus} right={<span className="text-[10.5px] text-muted-foreground whitespace-nowrap">{plan.equip}</span>}>
        {plan.rest ? (
          <>
            <div className="text-[13px] text-muted-foreground mb-3">Rest day — {plan.cardio}. No weights. Muscle grows on rest days, not in the gym.</div>
            <div className="space-y-2">
              {plan.exercises.map(ex => (
                <div key={ex.id} className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5"
                  style={{ borderColor: 'var(--color-border)' }}>
                  <span className="text-[13px] text-foreground">{ex.name} <span className="text-muted-foreground">· {ex.sr}</span></span>
                  {ex.yt && ytLink(ex.yt)}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-muted-foreground tabular-nums">{done}/{total} done · {pct}%</span>
              <button onClick={() => setAll(done !== total)} className="text-[11px] font-medium" style={{ color: ACCENT }}>
                {done === total ? 'Clear all' : 'Mark all'}
              </button>
            </div>
            <ProgressBar pct={pct} />
            <div className="space-y-2 mt-3">
              {plan.exercises.map(ex => {
                const checked = !!log[ex.id]
                return (
                  <div key={ex.id} className="w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors"
                    style={{ borderColor: 'color-mix(in oklab, var(--chart-1) 14%, var(--color-border))', background: checked ? 'color-mix(in oklab, var(--chart-1) 10%, transparent)' : 'transparent' }}>
                    <button onClick={() => toggle(ex.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <span className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center"
                        style={{ background: checked ? ACCENT : 'transparent', boxShadow: checked ? 'none' : 'inset 0 0 0 2px var(--color-muted-foreground)' }}>
                        {checked && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="var(--color-background)" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </span>
                      <span className="flex-1 min-w-0 flex items-baseline justify-between gap-2">
                        <span className={`text-[13px] ${checked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{ex.name}</span>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{ex.sr}</span>
                      </span>
                    </button>
                    {ex.yt && ytLink(ex.yt)}
                  </div>
                )
              })}
            </div>
          </>
        )}
        <Note>🏃 Cardio: {plan.cardio}</Note>
      </Card>

      <Note>Check off each exercise as you finish — your week &amp; all-time numbers update on the <b className="text-foreground">Monitor</b> tab.</Note>
    </>
  )
}

// ============================================================
// ROADMAP — the sequenced 6-month protocol (all 10 goals)
// ============================================================
function RoadmapTab({ lk, go }) {
  const curPhase = lk.status === 'active' && lk.total
    ? Math.min(PHASES.length - 1, Math.floor((lk.day - 1) / (lk.total / PHASES.length)))
    : -1
  const jump = (id, label) => (
    <button onClick={() => go(id)}
      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold transition-colors"
      style={{ background: 'color-mix(in oklab, var(--chart-1) 10%, transparent)', color: ACCENT, boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 24%, transparent)' }}>
      {label}
    </button>
  )
  return (
    <>
      <Card title="🗺️ The 6-month protocol" sub="Ten problems, one project. The foundation runs from Day 1; treatments layer in one system at a time, so nothing overwhelms you and your skin never gets over-treated.">
        <div className="flex flex-wrap gap-1.5">
          {['Posture', 'Lose fat', 'Muscle', 'Face', 'Dark spots', 'Hair', 'Discipline'].map(t => <Pill key={t}>{t}</Pill>)}
        </div>
      </Card>

      <Card title="⚡ Always-on foundation" sub="Every day, all six months. These alone fix half the list.">
        <div className="space-y-2.5">
          {FOUNDATION.map(f => (
            <div key={f.title} className="flex gap-3">
              <span className="text-lg flex-shrink-0">{f.emoji}</span>
              <span className="min-w-0">
                <span className="text-[13px] font-medium text-foreground">{f.title}</span>
                <span className="block text-[12px] text-muted-foreground leading-relaxed">{f.sub}</span>
                <span className="text-[10px] font-mono" style={{ color: ACCENT }}>{f.hits}</span>
              </span>
            </div>
          ))}
        </div>
      </Card>

      {PHASES.map((p, i) => {
        const now = i === curPhase
        return (
          <Card key={p.month} title={`${p.month} — ${p.tag}`} sub={p.focus}
            right={now ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: 'color-mix(in oklab, var(--chart-1) 20%, transparent)', color: ACCENT }}>◆ You are here</span> : null}>
            <div className="space-y-2">
              {p.tracks.map(t => (
                <div key={t.k} className="flex gap-2.5 text-[13px]">
                  <span className="text-[11px] font-semibold flex-shrink-0 mt-[1px]" style={{ color: ACCENT, minWidth: '5.5rem' }}>{t.k}</span>
                  <span className="text-muted-foreground leading-relaxed">{t.d}</span>
                </div>
              ))}
            </div>
          </Card>
        )
      })}

      <div className="flex flex-wrap gap-2">
        {jump('gym', '🏋️ Gym & posture →')}
        {jump('skincare', '✨ Skin & hair →')}
        {jump('discipline', '🧠 Discipline →')}
      </div>

      <Note>Not medical advice — patch-test actives, add one at a time, and see a doctor / dermatologist for persistent hair loss, a sudden velvety-dark neck, or before starting minoxidil.</Note>
    </>
  )
}

// ============================================================
// DISCIPLINE — quit-streaks (#10) + urge protocol. Focus, not shame.
// ============================================================
function StreakCard({ s }) {
  const [, bump] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const started = streakStarted(s.key)
  const days = streakDays(s.key)
  const best = streakBest(s.key)
  return (
    <Card title={`${s.emoji} ${s.title}`} sub={s.sub}>
      {started ? (
        <>
          <div className="flex items-end gap-3">
            <div className="text-[40px] leading-none font-bold tabular-nums" style={{ color: ACCENT }}>{days}</div>
            <div className="text-[12px] text-muted-foreground mb-1">days clean · best {best}</div>
          </div>
          {confirming ? (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-[12px] text-muted-foreground">Reset to zero?</span>
              <button onClick={() => { streakReset(s.key); setConfirming(false); bump(v => v + 1) }}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: ACCENT, color: 'var(--color-background)' }}>Yes, reset</button>
              <button onClick={() => setConfirming(false)} className="text-[11px] text-muted-foreground px-2 py-1">Keep it</button>
            </div>
          ) : (
            <button onClick={() => setConfirming(true)} className="mt-3 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">↺ I slipped — reset</button>
          )}
        </>
      ) : (
        <button onClick={() => { streakStart(s.key); bump(v => v + 1) }}
          className="w-full rounded-xl border py-2.5 text-[13px] font-semibold transition-colors"
          style={{ borderColor: 'color-mix(in oklab, var(--chart-1) 40%, transparent)', color: ACCENT, background: 'color-mix(in oklab, var(--chart-1) 8%, transparent)' }}>
          Start the streak
        </button>
      )}
      <Note>{s.why}</Note>
    </Card>
  )
}

function DisciplineTab() {
  return (
    <>
      <Card title="🧠 Discipline" sub="Three habits that free up the time, energy and focus the rest of the plan runs on. This is about reclaiming your drive — not shame.">
        <div className="flex flex-wrap gap-1.5">
          <Pill>No PMO</Pill><Pill>No added sugar</Pill><Pill>Phone curfew</Pill>
        </div>
      </Card>

      {STREAKS.map(s => <StreakCard key={s.key} s={s} />)}

      <Card title="🌊 When the urge hits" sub="Have the plan ready before you need it.">
        <ul className="space-y-1.5">
          {URGE_PLAN.map(u => (
            <li key={u} className="flex items-start gap-2 text-[13px]">
              <span style={{ color: ACCENT }}>→</span>
              <span className="text-muted-foreground leading-relaxed">{u}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Note>Streaks are stored only on this device. Miss a day? Reset and keep going — the goal is the next 100 days, not a perfect record.</Note>
    </>
  )
}

// ============================================================
// DIET — calorie-deficit lean cut (Meal 1 / Meal 2 + check-offs)
// ============================================================
function MealBlock({ slot, time, meal, checked, onToggle }) {
  return (
    <div className="rounded-xl border px-3 py-3 transition-colors"
      style={{ borderColor: checked ? 'color-mix(in oklab, var(--chart-1) 38%, transparent)' : 'var(--color-border)', background: checked ? 'color-mix(in oklab, var(--chart-1) 8%, transparent)' : 'transparent' }}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 text-left">
        <span className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center"
          style={{ background: checked ? ACCENT : 'transparent', boxShadow: checked ? 'none' : 'inset 0 0 0 2px var(--color-muted-foreground)' }}>
          {checked && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="var(--color-background)" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
        </span>
        <span className="flex-1 flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-semibold text-foreground">{slot}</span>
          <span className="text-[11px] text-muted-foreground">🕐 {time}</span>
        </span>
      </button>
      <ul className="mt-2 ml-8 space-y-1">
        {meal.items.map((it, i) => (
          <li key={i} className="text-[13px] flex items-center gap-2">
            <span>{it.e}</span>
            <span className={checked ? 'line-through text-muted-foreground' : 'text-foreground'}>{it.t}</span>
          </li>
        ))}
        {meal.salad && (
          <li className="text-[13px] flex items-start gap-2">
            <span>🥗</span>
            <span>
              <span className={checked ? 'line-through text-muted-foreground' : 'text-foreground'}>{meal.salad}</span>
              {SALADS[meal.salad] && <span className="block text-[11px] text-muted-foreground">{SALADS[meal.salad]}</span>}
            </span>
          </li>
        )}
      </ul>
    </div>
  )
}

function DietTab() {
  const tk = todayKey()
  const [meals, setMeals] = useState(() => lsGet(`meals:${tk}`, { m1: false, m2: false }))
  const [start, setStart] = useState(() => lsGet('diet:start', null))
  const today = todayPlan()
  const done = (meals.m1 ? 1 : 0) + (meals.m2 ? 1 : 0)
  const toggle = (m) => { const next = { ...meals, [m]: !meals[m] }; setMeals(next); lsSet(`meals:${tk}`, next) }
  const setBoth = () => { const v = done !== 2; const next = { m1: v, m2: v }; setMeals(next); lsSet(`meals:${tk}`, next) }
  const week = thisWeekDates()
  const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const dayNum = start ? Math.min(Math.max(Math.floor((new Date(tk) - new Date(start)) / 86400000) + 1, 1), PLAN_DAYS) : 0
  const weekNum = Math.ceil(dayNum / 7)
  const totalWeeks = Math.ceil(PLAN_DAYS / 7)
  const groceries = weeklyGrocery()
  const fmtQty = (s) => s.grams != null ? (s.grams >= 1000 ? `${(s.grams / 1000).toFixed(1)} kg` : `${s.grams} g`) : s.count != null ? `${s.count}` : `${s.scoops} scoops`

  return (
    <>
      <Card title="🔥 Calorie-deficit lean cut" sub="A high-protein deficit — muscle stays, fat goes. Week 1 repeats; just keep showing up.">
        {!start ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-[13px] text-muted-foreground">Mark today as Day 1 to start the count.</span>
            <button onClick={() => { setStart(tk); lsSet('diet:start', tk) }}
              className="rounded-lg px-3 py-1.5 text-[12px] font-semibold" style={{ background: ACCENT, color: 'var(--color-background)' }}>
              Start the diet
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[15px] font-semibold text-foreground">Day {dayNum} <span className="text-muted-foreground font-normal">of {PLAN_DAYS}</span></span>
              <span className="text-[12px] text-muted-foreground">Week {weekNum} of {totalWeeks} · {PLAN_DAYS - dayNum} to go</span>
            </div>
            <ProgressBar pct={Math.round((dayNum / PLAN_DAYS) * 100)} />
            <button onClick={() => { lsSet('diet:start', null); setStart(null) }} className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors mt-2">reset start date</button>
          </>
        )}
      </Card>

      <Card title="📊 Daily targets" sub="The deficit that peels fat off without wrecking energy or muscle.">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {NUTRITION.map(n => (
            <div key={n.label} className="rounded-xl border border-border/60 px-2.5 py-2 text-center">
              <div className="text-[13px] font-semibold text-foreground tabular-nums leading-tight">{n.value}</div>
              <div className="text-[9.5px] uppercase tracking-wide text-muted-foreground mt-0.5">{n.unit} · {n.label}</div>
            </div>
          ))}
        </div>
        <Note>~400–500 cal deficit = <b className="text-foreground">0.4–0.6 kg fat loss/week</b>. Slow on purpose → muscle stays, fat goes for good.</Note>
      </Card>

      <Card title={`🍽️ Today — ${today.day}`} sub={`Tap a meal to log it · Meal 1 ~${MEAL_TIMES.m1} · Meal 2 ~${MEAL_TIMES.m2}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] text-muted-foreground tabular-nums">{done}/2 meals done</span>
          <button onClick={setBoth} className="text-[11px] font-medium" style={{ color: ACCENT }}>{done === 2 ? 'Clear' : 'Mark both'}</button>
        </div>
        <ProgressBar pct={Math.round((done / 2) * 100)} />
        <div className="space-y-2.5 mt-3">
          <MealBlock slot="Meal 1" time={MEAL_TIMES.m1} meal={today.m1} checked={meals.m1} onToggle={() => toggle('m1')} />
          <MealBlock slot="Meal 2" time={MEAL_TIMES.m2} meal={today.m2} checked={meals.m2} onToggle={() => toggle('m2')} />
        </div>
      </Card>

      <Card title="📏 Rules that make it work">
        <ul className="space-y-1.5">
          {NUTRITION_RULES.map(r => (
            <li key={r} className="flex items-start gap-2 text-[13px] text-foreground">
              <span style={{ color: ACCENT }}>✓</span><span>{r}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="✅ This week" sub="Two dots = both meals logged that day.">
        <div className="grid grid-cols-7 gap-1.5">
          {week.map(d => {
            const m = lsGet(`meals:${d.dateKey}`, { m1: false, m2: false })
            const c = (m.m1 ? 1 : 0) + (m.m2 ? 1 : 0)
            return (
              <div key={d.dateKey} className="flex flex-col items-center gap-1 rounded-lg py-1.5"
                style={{ background: d.isToday ? 'color-mix(in oklab, var(--chart-1) 12%, transparent)' : 'transparent', border: d.isToday ? '1px solid color-mix(in oklab, var(--chart-1) 30%, transparent)' : '1px solid transparent' }}>
                <span className="text-[9.5px] text-muted-foreground">{DOW[d.idx]}</span>
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: c >= 1 ? ACCENT : 'var(--color-border)' }} />
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: c >= 2 ? ACCENT : 'var(--color-border)' }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="🗓️ The full week" sub="Print it, stick it on the fridge.">
        <div className="space-y-3">
          {WEEK.map(d => (
            <div key={d.dow} className="rounded-xl border border-border/50 overflow-hidden" style={today.dow === d.dow ? { borderColor: 'color-mix(in oklab, var(--chart-1) 38%, transparent)' } : undefined}>
              <div className="px-3 py-1.5 text-[12px] font-semibold text-foreground" style={{ background: 'color-mix(in oklab, var(--chart-1) 8%, transparent)' }}>{d.day}</div>
              <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/50">
                {['m1', 'm2'].map(mk => (
                  <div key={mk} className="px-3 py-2.5">
                    <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">{mk === 'm1' ? `Meal 1 · ${MEAL_TIMES.m1}` : `Meal 2 · ${MEAL_TIMES.m2}`}</div>
                    <ul className="space-y-0.5">
                      {d[mk].items.map((it, i) => (<li key={i} className="text-[12.5px] text-foreground flex items-center gap-1.5"><span>{it.e}</span><span>{it.t}</span></li>))}
                      {d[mk].salad && <li className="text-[12.5px] flex items-center gap-1.5"><span>🥗</span><span className="text-foreground">{d[mk].salad}</span></li>}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="🛒 Weekly grocery list" sub="One week's shop — auto-built from the plan. Double it for a fortnight.">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1.5">Protein · dairy · nuts</div>
        <ul className="space-y-1 mb-4">
          {groceries.staples.map(s => (
            <li key={s.name} className="flex items-center justify-between text-[13px] border-b border-border/30 pb-1">
              <span className="text-foreground capitalize">{s.name}</span>
              <span className="text-muted-foreground tabular-nums">{fmtQty(s)}</span>
            </li>
          ))}
        </ul>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Vegetables · salad · pantry <span className="normal-case text-muted-foreground/70">— buy fresh, to taste</span></div>
        <div className="flex flex-wrap gap-1.5">
          {groceries.produce.map(p => (
            <span key={p} className="text-[12px] px-2 py-0.5 rounded-full border border-border/60 text-foreground capitalize">{p}</span>
          ))}
        </div>
      </Card>

      <Note>Check off both meals each day — the dots fill in and it feeds your <b className="text-foreground">Monitor</b>. Stored locally · no judgment.</Note>
    </>
  )
}

// ============================================================
// SKINCARE — glow routine, trackable AM/PM
// ============================================================
function RoutineList({ steps }) {
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3">
          <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-semibold mt-0.5"
            style={{ background: 'color-mix(in oklab, var(--chart-1) 12%, transparent)', color: ACCENT }}>{i + 1}</span>
          <span>
            <span className="text-[13px] font-medium text-foreground">{s.step}</span>
            <span className="block text-[12px] text-muted-foreground">{s.what} — <span className="italic">{s.why}</span></span>
          </span>
        </li>
      ))}
    </ol>
  )
}

function SkincareTab() {
  const tk = todayKey()
  const [skin, setSkinState] = useState(() => skinFor(tk))
  const toggle = (k) => { const next = { ...skin, [k]: !skin[k] }; setSkinState(next); setSkin(tk, next) }
  const week = thisWeekDates()
  const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <>
      <Card title="✨ Today's skin" sub="Two check-ins a day. This is how the glow gets built — consistency, not expensive bottles.">
        <div className="grid grid-cols-2 gap-2">
          {[['am', '🌅 Morning', 'protect'], ['pm', '🌙 Night', 'repair']].map(([k, label, tagline]) => {
            const done = !!skin[k]
            return (
              <button key={k} onClick={() => toggle(k)}
                className="rounded-xl border p-3 text-center transition-colors"
                style={{ borderColor: done ? 'color-mix(in oklab, var(--chart-1) 42%, transparent)' : 'var(--color-border)', background: done ? 'color-mix(in oklab, var(--chart-1) 10%, transparent)' : 'transparent' }}>
                <div className="text-[13px] font-medium text-foreground">{label}</div>
                <div className="text-[10.5px] text-muted-foreground">{tagline}</div>
                <div className="text-[11px] mt-1 font-medium" style={{ color: done ? ACCENT : 'var(--color-muted-foreground)' }}>{done ? '✓ done' : 'tap when done'}</div>
              </button>
            )
          })}
        </div>
      </Card>

      <Card title="🌅 Morning routine" sub="Brighten, then protect. SPF is the single biggest glow lever.">
        <RoutineList steps={AM} />
      </Card>

      <Card title="🌙 Night routine" sub="Clean off the day and let the actives repair while you sleep.">
        <RoutineList steps={PM} />
      </Card>

      <Card title="🗓️ On the clock (weekly)">
        <div className="space-y-2.5">
          {WEEKLY.map(w => (
            <div key={w.title} className="flex gap-3">
              <span className="text-lg">{w.emoji}</span>
              <span>
                <span className="text-[13px] font-medium text-foreground">{w.title}</span>
                <span className="block text-[12px] text-muted-foreground">{w.body}</span>
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="🍎 Glow from within" sub="Most of it overlaps your diet + training — the transformation and the glow are the same project.">
        <ul className="space-y-2">
          {GLOW.map(([t, why]) => (
            <li key={t} className="flex items-start gap-2 text-[13px]">
              <span style={{ color: ACCENT }}>✓</span>
              <span><span className="text-foreground font-medium">{t}</span> <span className="text-muted-foreground">— {why}</span></span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="⚠️ Don't sabotage it">
        <ul className="space-y-1.5">
          {RULES.map(r => (
            <li key={r} className="flex items-start gap-2 text-[13px] text-foreground">
              <span style={{ color: ACCENT }}>•</span><span>{r}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="🌗 Body — dark spots" sub="Knees, elbows, neck, underarms, inner thighs. Same playbook everywhere: stop the cause, gently exfoliate, brighten, protect. Weeks, not days.">
        <div className="space-y-3">
          {BODY_PIGMENTATION.map(b => (
            <div key={b.area} className="rounded-xl border p-3" style={{ borderColor: 'color-mix(in oklab, var(--chart-1) 14%, var(--color-border))' }}>
              <div className="text-[13px] font-semibold text-foreground">{b.area}</div>
              <div className="text-[12px] text-muted-foreground mt-0.5 mb-2 leading-relaxed">{b.cause}</div>
              <ul className="space-y-1">
                {b.fix.map(f => (
                  <li key={f} className="flex items-start gap-2 text-[12.5px]"><span style={{ color: ACCENT }}>✓</span><span className="text-foreground/90">{f}</span></li>
                ))}
              </ul>
              <div className="mt-2 text-[11.5px] text-muted-foreground leading-relaxed"><span className="font-medium text-foreground">Avoid:</span> {b.avoid}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="💇 Hair — loss control" sub={HAIR.intro}>
        <div className="space-y-2.5">
          {HAIR.routine.map(h => (
            <div key={h.title} className="flex gap-3">
              <span className="text-lg flex-shrink-0">{h.emoji}</span>
              <span className="min-w-0">
                <span className="text-[13px] font-medium text-foreground">{h.title}</span>
                <span className="block text-[12px] text-muted-foreground leading-relaxed">{h.body}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">From within</div>
          <ul className="space-y-1.5">
            {HAIR.within.map(([t, why]) => (
              <li key={t} className="flex items-start gap-2 text-[12.5px]"><span style={{ color: ACCENT }}>✓</span><span><span className="text-foreground font-medium">{t}</span> <span className="text-muted-foreground">— {why}</span></span></li>
            ))}
          </ul>
        </div>
        <Note>{HAIR.caveat}</Note>
      </Card>

      <Card title="✅ This week" sub="Two dots = AM + PM both done.">
        <div className="grid grid-cols-7 gap-1.5">
          {week.map(d => {
            const sk = skinFor(d.dateKey)
            const c = (sk.am ? 1 : 0) + (sk.pm ? 1 : 0)
            return (
              <div key={d.dateKey} className="flex flex-col items-center gap-1 rounded-lg py-1.5"
                style={{ background: d.isToday ? 'color-mix(in oklab, var(--chart-1) 12%, transparent)' : 'transparent', border: d.isToday ? '1px solid color-mix(in oklab, var(--chart-1) 30%, transparent)' : '1px solid transparent' }}>
                <span className="text-[9.5px] text-muted-foreground">{DOW[d.idx]}</span>
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: c >= 1 ? ACCENT : 'var(--color-border)' }} />
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: c >= 2 ? ACCENT : 'var(--color-border)' }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}

// ============================================================
// PLAYLIST — gym songs (verified YouTube links)
// ============================================================
function PlaylistTab() {
  return (
    <>
      <Card title="🎧 The lock-in playlist" sub="Headphones in, world off. Every track opens on YouTube. Flashing Lights is the starter — that reel song that kicked all this off.">
        <a href={playAllUrl()} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-transform hover:scale-[1.02]"
          style={{ background: ACCENT, color: 'var(--color-background)' }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          Play all on YouTube
        </a>
        <span className="block text-[11px] text-muted-foreground mt-2">{PLAYLIST.length} tracks · opens as one playlist, starting with {STARTER.title}</span>
      </Card>

      <div className="space-y-2">
        {PLAYLIST.map((t, i) => (
          <a key={t.id} href={watchUrl(t.id)} target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors"
            style={{ borderColor: t.tag === '⭐' ? 'color-mix(in oklab, var(--chart-1) 40%, transparent)' : 'color-mix(in oklab, var(--chart-1) 14%, var(--color-border))', background: t.tag === '⭐' ? 'color-mix(in oklab, var(--chart-1) 9%, transparent)' : 'transparent' }}>
            <span className="w-6 text-center text-[12px] text-muted-foreground tabular-nums flex-shrink-0">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="text-[13.5px] font-medium text-foreground flex items-center gap-1.5">
                {t.title}{t.tag && <span className="text-[12px]">{t.tag}</span>}
              </span>
              <span className="block text-[11.5px] text-muted-foreground truncate">{t.by}{t.note ? ` · ${t.note}` : ''}</span>
            </span>
            <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10.5px] font-medium transition-colors group-hover:brightness-110"
              style={{ background: 'color-mix(in oklab, var(--chart-1) 10%, transparent)', color: ACCENT }}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>Play
            </span>
          </a>
        ))}
      </div>

      <Note>⭐ starter · 🔥 certified gym anthem. Keep the energy up — the deficit makes you tired, the music makes you move anyway.</Note>
    </>
  )
}

// ============================================================
// PROGRESS — weigh-in, milestones, data
// ============================================================
function ProgressTab() {
  const [weights, setWeights] = useState(() => lsGet('weights', []))
  const [input, setInput] = useState('')

  const saveWeight = () => {
    const v = parseFloat(input)
    if (!v) return
    const tk = todayKey()
    const next = weights.filter(w => w.date !== tk).concat({ date: tk, kg: v }).sort((a, b) => a.date < b.date ? -1 : 1)
    setWeights(next); lsSet('weights', next); setInput('')
  }

  const exportBackup = () => {
    const all = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith('thq:')) all[k] = localStorage.getItem(k)
    }
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `lockin-backup-${todayKey()}.json`
    a.click()
  }

  const resetAll = () => {
    if (!window.confirm('Erase all tracking data?')) return
    Object.keys(localStorage).filter(k => k.startsWith('thq:')).forEach(k => localStorage.removeItem(k))
    setWeights([])
  }

  const rows = weights.slice().reverse()

  return (
    <>
      <Card title="⚖️ Weekly weigh-in" sub="Same morning each week, before food. Judge the monthly trend, not daily noise.">
        <div className="flex gap-2 items-center">
          <input type="number" step="0.1" value={input} onChange={e => setInput(e.target.value)} placeholder="kg"
            className="w-24 rounded-lg border bg-transparent px-3 py-2 text-sm text-foreground outline-none"
            style={{ borderColor: 'color-mix(in oklab, var(--chart-1) 20%, var(--color-border))' }} />
          <button onClick={saveWeight}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ background: ACCENT, color: 'var(--color-background)' }}>Log weight</button>
        </div>
        {rows.length > 0 && (
          <table className="w-full text-[13px] mt-3">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-wide text-muted-foreground">
                <th className="text-left font-medium py-1.5">Date</th>
                <th className="text-left font-medium py-1.5">Weight</th>
                <th className="text-left font-medium py-1.5">Δ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w, i) => {
                const prev = rows[i + 1]
                const delta = prev ? +(w.kg - prev.kg).toFixed(1) : null
                const color = delta === null ? 'var(--color-muted-foreground)' : delta <= 0 ? ACCENT : 'var(--destructive)'
                return (
                  <tr key={w.date} className="border-t border-border/40">
                    <td className="py-2 text-muted-foreground">{w.date}</td>
                    <td className="py-2 text-foreground">{w.kg} kg</td>
                    <td className="py-2" style={{ color }}>{delta === null ? '—' : `${delta <= 0 ? '▼' : '▲'} ${Math.abs(delta)}`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="🎯 The 6-month arc" sub="Aug 2026 → Jan 2027. What each stretch should feel like.">
        <table className="w-full text-[13px]">
          <tbody>
            {MILESTONES.map(([w, g]) => (
              <tr key={w} className="border-t border-border/40 first:border-t-0">
                <td className="py-2 pr-3 text-foreground font-medium whitespace-nowrap align-top">{w}</td>
                <td className="py-2 text-muted-foreground">{g}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Note>📸 Take progress photos every 2 weeks (front/side). The mirror lies day-to-day; photos don't.</Note>
      </Card>

      <Card title="⚙️ Data" sub="Everything saves automatically in this browser. Add the site to your phone home screen.">
        <div className="flex gap-2">
          <button onClick={exportBackup}
            className="rounded-lg border px-3.5 py-2 text-[13px] font-medium text-foreground"
            style={{ borderColor: 'color-mix(in oklab, var(--chart-1) 20%, var(--color-border))' }}>Export backup</button>
          <button onClick={resetAll}
            className="rounded-lg border px-3.5 py-2 text-[13px] font-medium"
            style={{ borderColor: 'color-mix(in oklab, var(--destructive) 45%, var(--color-border))', color: 'var(--destructive)' }}>Reset all</button>
        </div>
      </Card>
    </>
  )
}
