import React, { useEffect, useMemo, useState } from 'react'
import {
  WEEKS, DAYS, STRENGTH, KIND, PLAN, CYCLE_DAYS, CYCLE_KM,
  DEFAULTS, iso, fromIso, daysBetween, addDays, mondayOnOrAfter,
} from '../lib/ebcPlan'

/* ------------------------------------------------------------------ *
 * #/ebc — training for Everest Base Camp, September/October 2027.
 *
 * This is a tracker rather than a poster: the thing it has to do well is
 * answer "what am I doing today, and did I do it" in one tap, every day,
 * for about a year. So today's session is the first thing on the page
 * and the tick is the biggest control on it; the six-week grid is
 * reference material and sits below.
 *
 * Progress lives in localStorage. That is worth being plain about: it is
 * per-device, so a day ticked on the phone will not appear on the
 * laptop. Everything else on this site is either public or read-only, and
 * putting a personal training log into the shared database would make it
 * readable by anyone who looked. Export is there for backup.
 * ------------------------------------------------------------------ */

const KEY = 'ebc_v1'

function load() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (v && typeof v === 'object') {
      return { start: v.start || DEFAULTS.start, trek: v.trek || DEFAULTS.trek, done: v.done || {} }
    }
  } catch {}
  return { start: DEFAULTS.start, trek: DEFAULTS.trek, done: {} }
}

const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)) } catch {} }

const pretty = (isoStr) =>
  fromIso(isoStr).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

const shortDate = (isoStr) =>
  fromIso(isoStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

function Stat({ label, value, sub, tint }) {
  return (
    <div className="px-4 py-3 rounded-xl"
         style={{ background: 'color-mix(in oklab, var(--color-card) 55%, transparent)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}>
      <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[22px] font-semibold tabular-nums leading-none" style={{ color: tint || 'var(--color-foreground)' }}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

export default function EbcPage({ onBack }) {
  const [st, setSt] = useState(load)
  const [today, setToday] = useState(() => iso(new Date()))
  const [showStrength, setShowStrength] = useState(false)
  const [editing, setEditing] = useState(false)

  // A tab left open overnight should roll over rather than keep
  // insisting it is yesterday.
  useEffect(() => {
    const t = setInterval(() => setToday(iso(new Date())), 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { save(st) }, [st])

  const dayIndex = daysBetween(st.start, today)          // negative before the start
  const started = dayIndex >= 0
  const cycle = started ? Math.floor(dayIndex / CYCLE_DAYS) : -1
  const slot = started ? dayIndex % CYCLE_DAYS : -1
  const todayPlan = started ? PLAN[slot] : null

  const toTrek = daysBetween(today, st.trek)
  const totalCycles = Math.max(1, Math.ceil(daysBetween(st.start, st.trek) / CYCLE_DAYS))

  const toggle = (dateIso) => setSt((s) => {
    const done = { ...s.done }
    if (done[dateIso]) delete done[dateIso]
    else done[dateIso] = 1
    return { ...s, done }
  })

  const stats = useMemo(() => {
    const doneDates = Object.keys(st.done)
    let km = 0
    let sessions = 0
    for (const d of doneDates) {
      const i = daysBetween(st.start, d)
      if (i < 0) continue
      const p = PLAN[i % CYCLE_DAYS]
      km += p.km
      sessions++
    }
    // Streak counts backwards from today.
    //
    // Two things it deliberately does. A rest day the plan asked for
    // counts as kept, or the streak would break every Friday for
    // following instructions. And today not being ticked yet does not
    // break it either — a session isn't missed until the day is over.
    // Without that, the streak read zero all day and only appeared after
    // the evening's workout, which is exactly backwards.
    let streak = 0
    if (started) {
      let d = dayIndex
      const todayKind = PLAN[dayIndex % CYCLE_DAYS].kind
      if (!st.done[today] && todayKind !== 'rest') d -= 1
      for (; d >= 0; d--) {
        const date = addDays(st.start, d)
        const p = PLAN[d % CYCLE_DAYS]
        if (st.done[date] || p.kind === 'rest') streak++
        else break
      }
    }
    // Days that have passed and were neither done nor rest.
    let missed = 0
    for (let d = 0; d < dayIndex; d++) {
      const date = addDays(st.start, d)
      const p = PLAN[d % CYCLE_DAYS]
      if (!st.done[date] && p.kind !== 'rest') missed++
    }
    return { km, sessions, streak, missed }
  }, [st, dayIndex, started, today])

  const weekOf = (n) => WEEKS[n]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-5 sm:px-6 py-8 sm:py-12">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <header className="mt-8 sm:mt-12">
          <p className="text-[11px] font-mono uppercase tracking-[0.18em]" style={{ color: '#E8734A' }}>Training</p>
          <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Everest Base Camp</h1>
          <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground max-w-prose">
            5,364 m, the classic route out of Lukla. Six-week conditioning block, run as a repeating
            cycle until it is time to peak.
          </p>
        </header>

        {/* ---- the numbers ---- */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="To go" value={toTrek > 0 ? toTrek : '—'} sub={toTrek > 0 ? `days · ${shortDate(st.trek)} 2027` : 'set a date'} tint="#E8734A" />
          <Stat label="Streak" value={stats.streak} sub={stats.streak === 1 ? 'day' : 'days'} tint={stats.streak > 0 ? '#5FBF8F' : undefined} />
          <Stat label="Logged" value={`${stats.km}`} sub={`km · ${stats.sessions} ${stats.sessions === 1 ? 'session' : 'sessions'}`} />
          <Stat label="Cycle" value={started ? `${cycle + 1}/${totalCycles}` : '—'} sub={started ? `week ${todayPlan.week} of 6` : 'not started'} />
        </div>

        {/* ---- today ---- */}
        <section className="mt-8">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            {started ? `Today · ${pretty(today)}` : `Starts · ${pretty(st.start)}`}
          </h2>

          {!started ? (
            <div className="mt-3 px-4 py-4 rounded-xl"
                 style={{ background: 'color-mix(in oklab, var(--color-card) 55%, transparent)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}>
              <p className="text-[14px] text-foreground">
                Day one is {pretty(st.start)} — {Math.abs(dayIndex)} {Math.abs(dayIndex) === 1 ? 'day' : 'days'} away.
              </p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">First session: {PLAN[0].t}.</p>
            </div>
          ) : (
            <button
              onClick={() => toggle(today)}
              className="mt-3 w-full flex items-center gap-4 px-4 py-4 rounded-xl text-left transition-colors"
              style={{
                background: st.done[today]
                  ? 'color-mix(in oklab, #5FBF8F 14%, transparent)'
                  : 'color-mix(in oklab, var(--color-card) 65%, transparent)',
                boxShadow: `inset 0 0 0 1px ${st.done[today] ? 'color-mix(in oklab, #5FBF8F 55%, transparent)' : 'var(--color-border)'}`,
              }}
            >
              <span className="grid place-items-center w-10 h-10 rounded-full shrink-0 transition-colors"
                    style={{
                      background: st.done[today] ? '#5FBF8F' : 'transparent',
                      boxShadow: st.done[today] ? 'none' : 'inset 0 0 0 2px var(--color-border)',
                    }}>
                {st.done[today] && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-background)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{ background: `color-mix(in oklab, ${KIND[todayPlan.kind].c} 18%, transparent)`, color: KIND[todayPlan.kind].c }}>
                    {KIND[todayPlan.kind].label}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">Week {todayPlan.week} · {DAYS[todayPlan.dow]}</span>
                </span>
                <span className="mt-1.5 block text-[15px] font-medium leading-snug text-foreground">{todayPlan.t}</span>
                {todayPlan.note && <span className="mt-1 block text-[12px] text-muted-foreground">{todayPlan.note}</span>}
                {todayPlan.kind === 'strength' && (
                  <span className="mt-1 block text-[12px] text-muted-foreground">Eight exercises — the full list is below.</span>
                )}
              </span>
              <span className="shrink-0 text-[11.5px] font-mono text-muted-foreground">
                {st.done[today] ? 'done' : 'tap to log'}
              </span>
            </button>
          )}
        </section>

        {/* ---- this week ---- */}
        {started && (
          <section className="mt-8">
            <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">This week</h2>
            <div className="mt-3 space-y-1.5">
              {weekOf(todayPlan.week - 1).days.map((d, i) => {
                const date = addDays(st.start, dayIndex - todayPlan.dow + i)
                const isToday = date === today
                const past = date < today
                const done = !!st.done[date]
                return (
                  <button
                    key={i}
                    onClick={() => toggle(date)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                    style={{
                      background: isToday ? 'color-mix(in oklab, var(--color-card) 70%, transparent)' : 'transparent',
                      boxShadow: `inset 0 0 0 1px ${isToday ? 'color-mix(in oklab, var(--color-accent) 40%, var(--color-border))' : 'var(--color-border)'}`,
                      opacity: past && !done && d.kind !== 'rest' ? 0.55 : 1,
                    }}
                  >
                    <span className="w-9 text-[11px] font-mono text-muted-foreground shrink-0">{DAYS[i]}</span>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: KIND[d.kind].c }} />
                    <span className="min-w-0 flex-1 text-[12.5px] text-foreground truncate">{d.t}</span>
                    <span className="text-[10.5px] font-mono text-muted-foreground shrink-0">{shortDate(date)}</span>
                    <span className="w-5 h-5 grid place-items-center rounded shrink-0"
                          style={{ background: done ? '#5FBF8F' : 'transparent', boxShadow: done ? 'none' : 'inset 0 0 0 1.5px var(--color-border)' }}>
                      {done && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-background)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* ---- the whole block ---- */}
        <section className="mt-10">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">The six weeks</h2>
          <p className="mt-2 text-[12.5px] text-muted-foreground">
            {CYCLE_KM} km a cycle. Repeats until the last one, which should finish the week you fly.
          </p>
          <div className="mt-4 space-y-4">
            {WEEKS.map((w) => (
              <div key={w.n}>
                <div className="flex items-baseline gap-2">
                  <span className="text-[12px] font-semibold text-foreground">Week {w.n}</span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {w.days.reduce((a, d) => a + d.km, 0)} km
                  </span>
                  {started && todayPlan.week === w.n && (
                    <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ background: 'color-mix(in oklab, var(--color-accent) 18%, transparent)', color: 'var(--color-accent)' }}>
                      now
                    </span>
                  )}
                </div>
                <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                  {w.days.map((d, i) => (
                    <div key={i} className="px-2 py-2 rounded-lg"
                         style={{ background: 'color-mix(in oklab, var(--color-card) 45%, transparent)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}>
                      <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: KIND[d.kind].c }}>{DAYS[i]}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{d.t}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---- strength ---- */}
        <section className="mt-10">
          <button onClick={() => setShowStrength((v) => !v)} className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors">
            Strength session
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                 style={{ transform: showStrength ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {showStrength && (
            <div className="mt-3 space-y-1.5">
              {STRENGTH.map((e) => (
                <div key={e.name} className="flex items-baseline gap-3 px-3 py-2 rounded-lg"
                     style={{ background: 'color-mix(in oklab, var(--color-card) 45%, transparent)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}>
                  <span className="flex-1 text-[13px] text-foreground">{e.name}</span>
                  <span className="text-[12px] font-mono tabular-nums text-foreground">{e.sets}</span>
                  <span className="w-20 text-right text-[11.5px] font-mono tabular-nums text-muted-foreground">{e.total}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---- dates ---- */}
        <section className="mt-10">
          <button onClick={() => setEditing((v) => !v)} className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors">
            Dates {editing ? '−' : '+'}
          </button>
          {editing && (
            <div className="mt-3 flex flex-wrap gap-4">
              <label className="text-[12px] text-muted-foreground">
                <span className="block mb-1">Day one <span className="opacity-60">(snaps to Monday)</span></span>
                <input type="date" value={st.start}
                       onChange={(e) => e.target.value && setSt((s) => ({ ...s, start: mondayOnOrAfter(e.target.value) }))}
                       className="px-2.5 py-1.5 rounded-lg bg-transparent text-foreground text-[13px] outline-none"
                       style={{ boxShadow: 'inset 0 0 0 1px var(--color-border)', colorScheme: 'dark' }} />
              </label>
              <label className="text-[12px] text-muted-foreground">
                <span className="block mb-1">Fly out</span>
                <input type="date" value={st.trek}
                       onChange={(e) => e.target.value && setSt((s) => ({ ...s, trek: e.target.value }))}
                       className="px-2.5 py-1.5 rounded-lg bg-transparent text-foreground text-[13px] outline-none"
                       style={{ boxShadow: 'inset 0 0 0 1px var(--color-border)', colorScheme: 'dark' }} />
              </label>
            </div>
          )}
        </section>

        <p className="mt-10 text-[12px] leading-relaxed text-muted-foreground">
          Progress is stored in this browser, so it does not follow you between devices.
          {stats.missed > 0 && <> {stats.missed} planned {stats.missed === 1 ? 'session has' : 'sessions have'} gone unlogged so far — earlier days can still be ticked in the week view.</>}
        </p>
      </div>
    </div>
  )
}
