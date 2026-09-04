import React, { useEffect, useMemo, useState } from 'react'
import {
  WEEKS, DAYS, STRENGTH, KIND, PLAN, CYCLE_DAYS, CYCLE_KM,
  ROUTE, FACTS, IMAGES, PHOTO_CREDIT,
  DEFAULTS, iso, fromIso, daysBetween, addDays, mondayOnOrAfter,
} from '../lib/ebcPlan'

/* ------------------------------------------------------------------ *
 * #/ebc — Everest Base Camp, September/October 2027.
 *
 * Two jobs, in this order: log today's session in one tap, and be worth
 * opening on a morning when the training is the last thing you feel like
 * doing. The first is why the log card sits above everything else; the
 * second is why there are photographs of where this is going.
 *
 * The altitude profile is not decoration. The staircase shape of it is
 * the entire argument for the two acclimatisation days, and it makes the
 * point faster than a paragraph would.
 *
 * Progress lives in localStorage, so it is per-device. Deliberate: the
 * shared database behind the guestbook is readable by anyone who looks,
 * and a personal training log does not belong in it.
 * ------------------------------------------------------------------ */

const KEY = 'ebc_v1'
const IMG = (f) => `${import.meta.env.BASE_URL}ebc/${f}`

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

const pretty = (i) => fromIso(i).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const shortDate = (i) => fromIso(i).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

/* Only the eleven walking days are plotted. Day twelve is a flight back
 * to Kathmandu at 1,400 m, and including it would squash the part of the
 * chart that actually matters into the top third. */
function Profile() {
  const days = ROUTE.slice(0, 11)
  const W = 700, H = 190, PAD_L = 34, PAD_B = 26, PAD_T = 16
  const lo = 2400, hi = 5700
  const x = (i) => PAD_L + (i / (days.length - 1)) * (W - PAD_L - 14)
  const y = (a) => PAD_T + (1 - (a - lo) / (hi - lo)) * (H - PAD_T - PAD_B)

  const line = days.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(r.sleep).toFixed(1)}`).join('')
  const area = `${line}L${x(days.length - 1).toFixed(1)},${H - PAD_B}L${x(0).toFixed(1)},${H - PAD_B}Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img"
         aria-label="Altitude profile: sleeping height rises from 2,610 m on day one to 5,164 m on day eight, with flat acclimatisation days at Namche and Dingboche, then drops away.">
      <defs>
        <linearGradient id="ebcFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8734A" stopOpacity="0.34" />
          <stop offset="100%" stopColor="#E8734A" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {[3000, 4000, 5000].map((a) => (
        <g key={a}>
          <line x1={PAD_L} y1={y(a)} x2={W - 14} y2={y(a)} stroke="currentColor" strokeWidth="0.5" opacity="0.14" />
          <text x={PAD_L - 6} y={y(a) + 3} textAnchor="end" fontSize="8" fill="currentColor" opacity="0.45" fontFamily="ui-monospace, monospace">{a / 1000}k</text>
        </g>
      ))}

      <path d={area} fill="url(#ebcFill)" />
      <path d={line} fill="none" stroke="#E8734A" strokeWidth="1.8" strokeLinejoin="round" />

      {days.map((r, i) => (
        <g key={r.d}>
          {r.high && r.high > r.sleep && (
            <>
              <line x1={x(i)} y1={y(r.sleep)} x2={x(i)} y2={y(r.high)} stroke="#E8734A" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
              <circle cx={x(i)} cy={y(r.high)} r={r.peak ? 3 : 2} fill={r.peak ? '#E8734A' : 'none'} stroke="#E8734A" strokeWidth="1.2" />
            </>
          )}
          <circle cx={x(i)} cy={y(r.sleep)} r="2.2" fill="var(--color-background)" stroke="#E8734A" strokeWidth="1.4" />
          <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="8" fill="currentColor" opacity="0.45" fontFamily="ui-monospace, monospace">{r.d}</text>
        </g>
      ))}

      <text x={x(7)} y={y(5364) - 9} textAnchor="middle" fontSize="8.5" fill="#E8734A" fontFamily="ui-monospace, monospace">EBC</text>
      <text x={x(8)} y={y(5545) - 9} textAnchor="middle" fontSize="8.5" fill="#E8734A" fontFamily="ui-monospace, monospace">5,545</text>
    </svg>
  )
}

function Stat({ label, value, sub, tint }) {
  return (
    <div className="px-3.5 py-3 rounded-xl"
         style={{ background: 'color-mix(in oklab, var(--color-card) 60%, transparent)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}>
      <p className="text-[10px] font-mono uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[21px] font-semibold tabular-nums leading-none" style={{ color: tint || 'var(--color-foreground)' }}>{value}</p>
      {sub && <p className="mt-1 text-[10.5px] text-muted-foreground">{sub}</p>}
    </div>
  )
}

const PAGE = { maxWidth: '46rem' }

export default function EbcPage({ onBack }) {
  const [st, setSt] = useState(load)
  const [today, setToday] = useState(() => iso(new Date()))
  const [showStrength, setShowStrength] = useState(false)
  const [showRoute, setShowRoute] = useState(true)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setToday(iso(new Date())), 60000)
    return () => clearInterval(t)
  }, [])
  useEffect(() => { save(st) }, [st])

  const dayIndex = daysBetween(st.start, today)
  const started = dayIndex >= 0
  const cycle = started ? Math.floor(dayIndex / CYCLE_DAYS) : -1
  const todayPlan = started ? PLAN[dayIndex % CYCLE_DAYS] : null
  const toTrek = daysBetween(today, st.trek)
  const totalCycles = Math.max(1, Math.ceil(daysBetween(st.start, st.trek) / CYCLE_DAYS))

  const toggle = (d) => setSt((s) => {
    const done = { ...s.done }
    if (done[d]) delete done[d]; else done[d] = 1
    return { ...s, done }
  })

  const stats = useMemo(() => {
    let km = 0, sessions = 0
    for (const d of Object.keys(st.done)) {
      const i = daysBetween(st.start, d)
      if (i < 0) continue
      km += PLAN[i % CYCLE_DAYS].km
      sessions++
    }
    // A rest day the plan asked for counts as kept, and today not being
    // ticked yet does not break the chain — a session isn't missed until
    // the day is over.
    let streak = 0
    if (started) {
      let d = dayIndex
      if (!st.done[today] && PLAN[dayIndex % CYCLE_DAYS].kind !== 'rest') d -= 1
      for (; d >= 0; d--) {
        const date = addDays(st.start, d)
        if (st.done[date] || PLAN[d % CYCLE_DAYS].kind === 'rest') streak++
        else break
      }
    }
    let missed = 0
    for (let d = 0; d < dayIndex; d++) {
      if (!st.done[addDays(st.start, d)] && PLAN[d % CYCLE_DAYS].kind !== 'rest') missed++
    }
    return { km, sessions, streak, missed }
  }, [st, dayIndex, started, today])

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ---- hero ---- */}
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden">
          <img src={IMG(IMAGES.hero.file)} alt={IMAGES.hero.alt} fetchPriority="high"
               className="w-full h-full object-cover" style={{ objectPosition: '50% 42%' }} />
          {/* Three stops rather than one: the top has to stay dark enough
              for the back link, the middle keeps the peaks readable, and
              the bottom must land exactly on the page background or the
              seam shows as a band. */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, color-mix(in oklab, var(--color-background) 76%, transparent) 0%, color-mix(in oklab, var(--color-background) 38%, transparent) 34%, color-mix(in oklab, var(--color-background) 82%, transparent) 74%, var(--color-background) 100%)',
          }} />
        </div>

        <div className="relative mx-auto px-5 sm:px-6 pt-8 pb-10" style={PAGE}>
          <button onClick={onBack} className="inline-flex items-center gap-2 text-[13px] text-foreground/70 hover:text-foreground transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="pt-28 sm:pt-44">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em]" style={{ color: '#F0906B' }}>Nepal · Khumbu</p>
            <h1 className="mt-2 text-4xl sm:text-5xl font-semibold tracking-tight">Everest Base Camp</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-foreground/70 max-w-prose">
              5,364 m at the foot of the Khumbu Icefall — twelve days on the classic route out of
              Lukla, going post-monsoon when the air is washed clean and the mountain is out.
            </p>
            <div className="mt-6 flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <span className="text-[42px] sm:text-[54px] font-semibold tabular-nums leading-none" style={{ color: '#E8734A' }}>
                {toTrek > 0 ? toTrek : '—'}
              </span>
              <span className="text-[13px] text-foreground/65">
                days out · target {shortDate(st.trek)} {fromIso(st.trek).getFullYear()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-5 sm:px-6 pb-16" style={PAGE}>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {FACTS.map((f) => (
            <div key={f.k} className="px-3 py-2.5 rounded-lg"
                 style={{ background: 'color-mix(in oklab, var(--color-card) 45%, transparent)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}>
              <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-muted-foreground">{f.k}</p>
              <p className="mt-0.5 text-[15px] font-medium text-foreground">{f.v}</p>
              {f.s && <p className="text-[10.5px] text-muted-foreground">{f.s}</p>}
            </div>
          ))}
        </div>

        {/* ---- training ---- */}
        <section className="mt-12">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-[19px] font-semibold tracking-tight">Getting fit for it</h2>
            <span className="text-[11px] font-mono text-muted-foreground">
              {started ? `cycle ${cycle + 1}/${totalCycles} · week ${todayPlan.week}` : 'not started'}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <Stat label="Streak" value={stats.streak} sub={stats.streak === 1 ? 'day' : 'days'} tint={stats.streak > 0 ? '#5FBF8F' : undefined} />
            <Stat label="Logged" value={stats.km} sub={`km · ${stats.sessions} ${stats.sessions === 1 ? 'session' : 'sessions'}`} />
            <Stat label="Per cycle" value={CYCLE_KM} sub="km over 6 weeks" />
            <Stat label="Missed" value={stats.missed} sub="sessions" tint={stats.missed > 0 ? '#E8925F' : undefined} />
          </div>

          <p className="mt-6 text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground">
            {started ? `Today · ${pretty(today)}` : `Starts · ${pretty(st.start)}`}
          </p>

          {!started ? (
            <div className="mt-2.5 px-4 py-4 rounded-xl"
                 style={{ background: 'color-mix(in oklab, var(--color-card) 55%, transparent)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}>
              <p className="text-[14px] text-foreground">
                Day one is {pretty(st.start)} — {Math.abs(dayIndex)} {Math.abs(dayIndex) === 1 ? 'day' : 'days'} away.
              </p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">Opens with {PLAN[0].t.toLowerCase()}.</p>
            </div>
          ) : (
            <button onClick={() => toggle(today)}
              className="mt-2.5 w-full flex items-center gap-4 px-4 py-4 rounded-xl text-left transition-colors"
              style={{
                background: st.done[today] ? 'color-mix(in oklab, #5FBF8F 13%, transparent)' : 'color-mix(in oklab, var(--color-card) 70%, transparent)',
                boxShadow: `inset 0 0 0 1px ${st.done[today] ? 'color-mix(in oklab, #5FBF8F 55%, transparent)' : 'var(--color-border)'}`,
              }}>
              <span className="grid place-items-center w-11 h-11 rounded-full shrink-0 transition-colors"
                    style={{ background: st.done[today] ? '#5FBF8F' : 'transparent', boxShadow: st.done[today] ? 'none' : 'inset 0 0 0 2px var(--color-border)' }}>
                {st.done[today] && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-background)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
                {todayPlan.kind === 'strength' && <span className="mt-1 block text-[12px] text-muted-foreground">Eight exercises — listed below.</span>}
              </span>
              <span className="shrink-0 text-[11.5px] font-mono text-muted-foreground">{st.done[today] ? 'done' : 'tap to log'}</span>
            </button>
          )}

          {started && (
            <div className="mt-4 space-y-1.5">
              {WEEKS[todayPlan.week - 1].days.map((d, i) => {
                const date = addDays(st.start, dayIndex - todayPlan.dow + i)
                const isToday = date === today
                const done = !!st.done[date]
                const past = date < today
                return (
                  <button key={i} onClick={() => toggle(date)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                    style={{
                      background: isToday ? 'color-mix(in oklab, var(--color-card) 70%, transparent)' : 'transparent',
                      boxShadow: `inset 0 0 0 1px ${isToday ? 'color-mix(in oklab, var(--color-accent) 40%, var(--color-border))' : 'var(--color-border)'}`,
                      opacity: past && !done && d.kind !== 'rest' ? 0.5 : 1,
                    }}>
                    <span className="w-8 text-[11px] font-mono text-muted-foreground shrink-0">{DAYS[i]}</span>
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
          )}
        </section>

        {/* ---- the route ---- */}
        <section className="mt-14">
          <h2 className="text-[19px] font-semibold tracking-tight">The route</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
            Lukla to Lukla. The staircase below is the whole plan — the two flat steps are
            acclimatisation days, and skipping them is how this trek usually goes wrong.
          </p>

          <div className="mt-5 px-3 py-3 rounded-xl text-muted-foreground"
               style={{ background: 'color-mix(in oklab, var(--color-card) 45%, transparent)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}>
            <Profile />
          </div>

          <button onClick={() => setShowRoute((v) => !v)}
                  className="mt-4 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors">
            Day by day
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                 style={{ transform: showRoute ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          {showRoute && (
            <div className="mt-3 space-y-1.5">
              {ROUTE.map((r) => (
                <div key={r.d} className="flex items-stretch gap-0 rounded-xl overflow-hidden"
                     style={{ background: 'color-mix(in oklab, var(--color-card) 45%, transparent)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}>
                  {r.img && (
                    <img src={IMG(IMAGES[r.img].file)} alt={IMAGES[r.img].alt} loading="lazy"
                         className="w-24 sm:w-32 object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0 px-3.5 py-3">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0">D{r.d}</span>
                      <span className="text-[13.5px] font-medium text-foreground">{r.title}</span>
                      {r.rest && (
                        <span className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                              style={{ background: 'color-mix(in oklab, #7FB3E8 18%, transparent)', color: '#7FB3E8' }}>acclimatise</span>
                      )}
                    </div>
                    <p className="mt-1 text-[12px] text-muted-foreground">{r.note}</p>
                    <p className="mt-1 text-[11px] font-mono tabular-nums" style={{ color: '#E8734A' }}>
                      sleep {r.sleep.toLocaleString()} m
                      {r.high && r.high > r.sleep && <span className="text-muted-foreground"> · high {r.high.toLocaleString()} m</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---- the six weeks ---- */}
        <section className="mt-14">
          <h2 className="text-[19px] font-semibold tracking-tight">The six-week block</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
            {CYCLE_KM} km a cycle, repeating. It peaks at a 14 km run, so the last cycle is the one
            that should finish the week you fly — the rest are for holding the base.
          </p>
          <div className="mt-5 space-y-4">
            {WEEKS.map((w) => (
              <div key={w.n}>
                <div className="flex items-baseline gap-2">
                  <span className="text-[12px] font-semibold text-foreground">Week {w.n}</span>
                  <span className="text-[11px] font-mono text-muted-foreground">{w.days.reduce((a, d) => a + d.km, 0)} km</span>
                  {started && todayPlan.week === w.n && (
                    <span className="text-[9.5px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ background: 'color-mix(in oklab, var(--color-accent) 18%, transparent)', color: 'var(--color-accent)' }}>now</span>
                  )}
                </div>
                <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
                  {w.days.map((d, i) => (
                    <div key={i} className="px-2 py-2 rounded-lg"
                         style={{ background: 'color-mix(in oklab, var(--color-card) 40%, transparent)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}>
                      <p className="text-[9.5px] font-mono uppercase tracking-wider" style={{ color: KIND[d.kind].c }}>{DAYS[i]}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{d.t}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---- strength ---- */}
        <section className="mt-12">
          <button onClick={() => setShowStrength((v) => !v)}
                  className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors">
            The strength session
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                 style={{ transform: showStrength ? 'rotate(180deg)' : 'none', transition: 'transform .2s ease' }}>
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {showStrength && (
            <div className="mt-3 space-y-1.5">
              {STRENGTH.map((e) => (
                <div key={e.name} className="flex items-baseline gap-3 px-3 py-2 rounded-lg"
                     style={{ background: 'color-mix(in oklab, var(--color-card) 40%, transparent)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}>
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
          <button onClick={() => setEditing((v) => !v)}
                  className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors">
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

        <div className="mt-10 pt-6 space-y-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            Route and grading follow the classic Lukla itinerary as run by{' '}
            <a href="https://indiahikes.com/everest-base-camp-trek-nepal" target="_blank" rel="noopener noreferrer"
               className="underline underline-offset-2 hover:text-foreground transition-colors">Indiahikes</a>{' '}
            and most operators. October is the clearest month of the post-monsoon window; from around
            mid-September the weather has usually settled and the trail is quieter.
          </p>
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            Photographs by{' '}
            <a href={PHOTO_CREDIT.authorUrl} target="_blank" rel="noopener noreferrer"
               className="underline underline-offset-2 hover:text-foreground transition-colors">{PHOTO_CREDIT.author}</a>,{' '}
            <a href={PHOTO_CREDIT.licenceUrl} target="_blank" rel="noopener noreferrer"
               className="underline underline-offset-2 hover:text-foreground transition-colors">{PHOTO_CREDIT.licence}</a>, via{' '}
            <a href={PHOTO_CREDIT.source} target="_blank" rel="noopener noreferrer"
               className="underline underline-offset-2 hover:text-foreground transition-colors">Wikimedia Commons</a>.
          </p>
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            Training progress is stored in this browser, so it does not follow you between devices.
          </p>
        </div>
      </div>
    </div>
  )
}
