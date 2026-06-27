import React, { useEffect, useRef, useState } from 'react'

/* ------------------------------------------------------------------ *
 * The science of cheap dopamine — phone · porn · sugar.
 *
 * A calm, accurate, non-preachy explainer of the single reward circuit
 * all three hijack. Grounded in real work: Schultz (reward prediction
 * error), Berridge (wanting vs liking), Tinbergen (supernormal stimuli),
 * Skinner (variable reinforcement), Sapolsky, and Lembke (Dopamine
 * Nation — the pleasure/pain balance). Hand-rolled SVG visuals, no deps.
 * ------------------------------------------------------------------ */

const DOPA = '#e0a04a' // warm amber — dopamine / pleasure
const PAIN = '#6f8fd6' // cool blue — the comedown / pain side

// Reveal-on-scroll wrapper (self-contained IntersectionObserver).
function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setShown(true); io.disconnect() }
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(22px)',
        transition: `opacity .9s cubic-bezier(.22,.61,.36,1) ${delay}s, transform .9s cubic-bezier(.22,.61,.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

const Eyebrow = ({ children, color }) => (
  <div className="text-[11px] font-mono uppercase tracking-[0.28em] mb-4" style={{ color: color || 'var(--color-muted-foreground)' }}>{children}</div>
)
const H = ({ children }) => (
  <h2 className="font-heading text-[clamp(1.7rem,4.5vw,2.6rem)] leading-[1.1] mb-5" style={{ fontWeight: 500 }}>{children}</h2>
)
const P = ({ children, className = '' }) => (
  <p className={`text-[clamp(1rem,2.2vw,1.18rem)] leading-[1.75] text-muted-foreground ${className}`}>{children}</p>
)
const Em = ({ children }) => <em className="not-italic" style={{ color: 'var(--color-foreground)', fontStyle: 'normal', fontWeight: 500 }}>{children}</em>

function Section({ children, className = '' }) {
  return (
    <section className={`max-w-2xl mx-auto px-5 sm:px-6 py-14 sm:py-20 ${className}`}>
      <Reveal>{children}</Reveal>
    </section>
  )
}

/* ------------------------------------------------------------------ *
 * Visualizations
 * ------------------------------------------------------------------ */

// A) Reward prediction error — the spike moves from reward to cue.
function PredictionViz() {
  const w = 320, h = 130
  const base = 92
  const Row = ({ y, label, cueSpike, rewardSpike, dip }) => (
    <g>
      <line x1="14" y1={y} x2={w - 8} y2={y} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3 4" />
      {/* cue + reward markers */}
      <text x="78" y={y + 20} textAnchor="middle" className="font-mono" fontSize="8" fill="var(--color-muted-foreground)">cue</text>
      <text x="232" y={y + 20} textAnchor="middle" className="font-mono" fontSize="8" fill="var(--color-muted-foreground)">reward</text>
      <line x1="78" y1={y - 26} x2="78" y2={y + 8} stroke="var(--color-border)" strokeWidth="1" />
      <line x1="232" y1={y - 26} x2="232" y2={y + 8} stroke="var(--color-border)" strokeWidth="1" />
      {/* dopamine trace */}
      <path
        d={`M14 ${y} L70 ${y} ${cueSpike ? `L78 ${y - 24} L86 ${y}` : ''} L224 ${y} ${rewardSpike ? `L232 ${y - 24} L240 ${y}` : dip ? `L232 ${y + 14} L240 ${y}` : ''} L${w - 8} ${y}`}
        fill="none" stroke={DOPA} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
      />
      <text x="14" y={y - 30} fontSize="9" fill="var(--color-foreground)" className="font-medium">{label}</text>
    </g>
  )
  return (
    <svg viewBox={`0 0 ${w} ${h * 2 + 6}`} className="w-full" role="img" aria-label="Dopamine fires for the cue, not the reward, once it is predicted">
      <Row y={48} label="First time (reward is a surprise)" rewardSpike />
      <Row y={48 + h} label="Once learned (cue predicts reward)" cueSpike dip />
    </svg>
  )
}

// B) Pleasure–pain balance — tips to pleasure, overshoots to pain.
function Seesaw() {
  const [phase, setPhase] = useState('rest') // rest | pleasure | pain
  const trigger = () => {
    setPhase('pleasure')
    setTimeout(() => setPhase('pain'), 900)
    setTimeout(() => setPhase('rest'), 2200)
  }
  useEffect(() => { const t = setTimeout(trigger, 700); return () => clearTimeout(t) }, [])
  const angle = phase === 'pleasure' ? -16 : phase === 'pain' ? 9 : 0
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 150" className="w-full max-w-sm" role="img" aria-label="A balance that tips to pleasure then overshoots into pain">
        <g style={{ transformOrigin: '150px 110px', transform: `rotate(${angle}deg)`, transition: 'transform .9s cubic-bezier(.34,1.3,.64,1)' }}>
          <rect x="40" y="104" width="220" height="7" rx="3.5" fill="var(--color-muted-foreground)" opacity="0.5" />
          <circle cx="78" cy="86" r="20" fill={DOPA} opacity={phase === 'pleasure' ? 0.95 : 0.5} style={{ transition: 'opacity .5s' }} />
          <text x="78" y="90" textAnchor="middle" fontSize="9" fill="#1a1a1a" className="font-semibold">pleasure</text>
          <circle cx="222" cy="86" r="20" fill={PAIN} opacity={phase === 'pain' ? 0.95 : 0.5} style={{ transition: 'opacity .5s' }} />
          <text x="222" y="90" textAnchor="middle" fontSize="9" fill="#0e0e0e" className="font-semibold">pain</text>
        </g>
        <path d="M150 110 L132 140 L168 140 Z" fill="var(--color-muted-foreground)" opacity="0.6" />
      </svg>
      <button onClick={trigger} className="mt-3 text-[12px] font-mono px-3 py-1.5 rounded-lg transition-colors"
        style={{ color: DOPA, border: `1px solid color-mix(in oklab, ${DOPA} 35%, transparent)`, background: `color-mix(in oklab, ${DOPA} 8%, transparent)` }}>
        take a hit ↺
      </button>
      <div className="text-[11px] text-muted-foreground/70 mt-2 h-4">
        {phase === 'pleasure' ? 'the spike…' : phase === 'pain' ? '…and the comedown overshoots' : 'the balance wants level'}
      </div>
    </div>
  )
}

// C) Baseline erosion — repeated spikes drag the baseline below neutral, then recovery.
function BaselineViz() {
  const w = 340, h = 170, mid = 80
  // overuse phase: spikes that dip below an ever-lower baseline
  const pts = []
  let baseline = mid
  let x = 8
  for (let i = 0; i < 5; i++) {
    pts.push([x, baseline]); x += 6
    pts.push([x, baseline - 34]); x += 8          // spike
    baseline += 7                                  // baseline drifts DOWN (lower = worse; y grows)
    pts.push([x, baseline + 12]); x += 10          // crash below new baseline
    pts.push([x, baseline]); x += 24
  }
  const erodedX = x
  // recovery phase (stimulus stops): dip then slow climb back toward neutral
  pts.push([x, baseline + 16]); x += 18
  for (let i = 0; i < 4; i++) { baseline -= 7; pts.push([x, baseline]); x += 24 }
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(0)} ${p[1].toFixed(0)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Repeated hits drag the dopamine baseline below neutral; stopping lets it recover">
      <line x1="0" y1={mid} x2={w} y2={mid} stroke="var(--color-border)" strokeWidth="1.2" strokeDasharray="2 3" />
      <text x="2" y={mid - 5} fontSize="8.5" fill="var(--color-muted-foreground)" className="font-mono">neutral</text>
      <line x1={erodedX} y1="10" x2={erodedX} y2={h - 18} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="2 4" />
      <text x={erodedX - 4} y={h - 6} fontSize="8" fill="var(--color-muted-foreground)" textAnchor="end" className="font-mono">stop</text>
      <text x={erodedX + 6} y={h - 6} fontSize="8" fill={PAIN} className="font-mono">recovery →</text>
      <path d={path} fill="none" stroke={DOPA} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <text x={erodedX / 2} y="20" fontSize="8.5" fill="var(--color-muted-foreground)" textAnchor="middle" className="font-mono">baseline sinking →</text>
    </svg>
  )
}

// D) The feedback loop — the cascade, drawn natively.
const loopNodes = [
  { t: 'Trigger', s: 'bored · stressed · tired · alone' },
  { t: 'Phone in hand', s: 'the shared entry point' },
  { t: 'Scroll / porn', s: 'cheap hit, one tap away' },
  { t: 'Dopamine crash', s: 'restless, a little empty' },
  { t: 'Sugar / junk', s: 'reach for the next hit' },
  { t: 'Mood + energy dip', s: 'and back to the start' },
]
function LoopDiagram() {
  return (
    <div className="relative">
      <div className="space-y-2.5">
        {loopNodes.map((n, i) => (
          <div key={i}>
            <div className="rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ background: 'color-mix(in oklab, var(--color-card) 65%, transparent)', border: '1px solid var(--color-border)' }}>
              <span className="font-mono text-[11px] w-5 flex-shrink-0" style={{ color: i % 2 ? PAIN : DOPA }}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{n.t}</div>
                <div className="text-[12px] text-muted-foreground">{n.s}</div>
              </div>
            </div>
            {i < loopNodes.length - 1 && (
              <div className="flex justify-center py-0.5"><span className="text-muted-foreground/50 text-sm">↓</span></div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 justify-center mt-3 text-[12px]" style={{ color: PAIN }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
        loops straight back to the top
      </div>
    </div>
  )
}

// Supernormal-stimulus cards.
const SUPER = [
  { name: 'Phone', natural: 'staying connected to your tribe; chasing novelty', supernormal: 'infinite social novelty + an unpredictable feed you can refresh forever' },
  { name: 'Porn', natural: 'the drive to find a mate', supernormal: 'endless novelty of partners, more than an ancestor saw in a lifetime — in a minute' },
  { name: 'Sugar', natural: 'rare, precious calories', supernormal: 'hyper-concentrated sweetness that exists nowhere in nature, on every shelf' },
]

/* ------------------------------------------------------------------ *
 * Article (content only — page chrome is provided by BlogPost)
 * ------------------------------------------------------------------ */

export function DopamineArticle() {
  return (
      <div className="relative z-10">
        {/* Hero */}
        <header className="min-h-[78vh] flex flex-col items-center justify-center text-center px-5">
          <Reveal>
            <Eyebrow color={DOPA}>The science of cheap dopamine</Eyebrow>
            <h1 className="font-heading leading-[1.04] mb-6" style={{ fontWeight: 500, fontSize: 'clamp(2.6rem,9vw,5rem)' }}>
              Phone.<br />Porn.<br />Sugar.
            </h1>
            <p className="max-w-md mx-auto text-[clamp(1rem,2.4vw,1.2rem)] leading-relaxed text-muted-foreground">
              Three habits that feel unrelated. One reward circuit they all hijack. Here is exactly how it works — and how it lets go.
            </p>
            <div className="mt-12 text-muted-foreground/50 animate-bounce text-2xl">↓</div>
          </Reveal>
        </header>

        <Section>
          <P>We treat them as three separate problems — too much screen time, a porn habit, a sweet tooth. They are not three problems. They are three doors into the same room. Each one works by flooding a single, ancient circuit with the same molecule: <Em>dopamine</Em>. Understand that circuit, and all three stop being a mystery — or a moral failing.</P>
        </Section>

        {/* What dopamine is */}
        <Section>
          <Eyebrow>01 — What dopamine actually is</Eyebrow>
          <H>It isn't the pleasure chemical.</H>
          <P>It is the molecule of <Em>wanting</Em>, not liking — anticipation, pursuit, the lean-forward and the craving and the <Em>just one more</Em>. And it speaks in surprise: dopamine doesn't fire for the reward itself, but for reward you didn't predict, and for the <Em>cues</Em> that predict it. The buzz isn't the notification. It's the <Em>maybe</Em>.</P>
          <div className="mt-8 rounded-2xl p-5" style={{ background: 'color-mix(in oklab, var(--color-card) 55%, transparent)', border: '1px solid var(--color-border)' }}>
            <PredictionViz />
            <p className="text-[12px] text-muted-foreground mt-2 text-center">Once a cue reliably predicts a reward, the dopamine spike jumps to the <span style={{ color: DOPA }}>cue</span> — the wanting lives in the wait.</p>
          </div>
        </Section>

        {/* Supernormal */}
        <Section>
          <Eyebrow>02 — Supernormal stimuli</Eyebrow>
          <H>Plaster eggs.</H>
          <P>Evolution wired that circuit for things that kept us alive: calories, mates, status, novelty, connection — when they were rare and hard-won. A <Em>supernormal stimulus</Em> is a fake so exaggerated it beats the real thing. Tinbergen found birds that abandoned their own eggs to sit on bigger, brighter plaster ones. Phone, porn, and sugar are plaster eggs: concentrated, engineered, infinite versions of rewards that used to be scarce. Your brain can't tell the counterfeit from the real — it just sees a bigger signal.</P>
          <div className="mt-8 space-y-3">
            {SUPER.map(s => (
              <div key={s.name} className="rounded-2xl p-4 sm:p-5" style={{ background: 'color-mix(in oklab, var(--color-card) 60%, transparent)', border: '1px solid var(--color-border)' }}>
                <div className="font-heading text-lg mb-2" style={{ fontWeight: 500 }}>{s.name}</div>
                <div className="grid sm:grid-cols-2 gap-x-5 gap-y-1.5 text-[13.5px]">
                  <div><span className="text-muted-foreground/60 font-mono text-[10.5px] uppercase tracking-wide block mb-0.5">the real reward</span><span className="text-muted-foreground">{s.natural}</span></div>
                  <div><span className="font-mono text-[10.5px] uppercase tracking-wide block mb-0.5" style={{ color: DOPA }}>the plaster egg</span><span style={{ color: 'var(--color-foreground)' }}>{s.supernormal}</span></div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Variable reward */}
        <Section>
          <Eyebrow>03 — The slot machine</Eyebrow>
          <H>Uncertainty is the hook.</H>
          <P>The most addictive schedule ever discovered isn't constant reward — it's <Em>unpredictable</Em> reward. Skinner's animals pressed hardest when the payout was random. Uncertainty pins the dopamine system wide open, because the system runs on surprise. A feed you pull-to-refresh, a body you've never seen, a flavour engineered past anything in nature — each is a lever you pull not knowing what you'll get. That <Em>maybe</Em> is the hook, not the prize.</P>
        </Section>

        {/* Pleasure-pain balance */}
        <Section>
          <Eyebrow color={PAIN}>04 — The pleasure–pain balance</Eyebrow>
          <H>Why it gets worse, not better.</H>
          <P>Pleasure and pain are processed in the same place, and they sit on a balance. Tip it toward pleasure and the brain — which wants level — tips it back toward pain to compensate. That comedown after the hit, the restlessness when the video ends or the sugar fades, is the balance settling back. And it always overshoots a little.</P>
          <div className="mt-8 rounded-2xl p-5" style={{ background: 'color-mix(in oklab, var(--color-card) 55%, transparent)', border: '1px solid var(--color-border)' }}>
            <Seesaw />
          </div>
          <P className="mt-8">Do it once, the balance rights itself. Do it again and again, and it stops resetting to level — it re-sets the whole thing toward pain. Now your baseline sits <Em>below</Em> neutral, and you need the hit just to feel okay. The thing you reached for to feel good becomes the thing you need to not feel bad.</P>
          <div className="mt-8 rounded-2xl p-5" style={{ background: 'color-mix(in oklab, var(--color-card) 55%, transparent)', border: '1px solid var(--color-border)' }}>
            <BaselineViz />
            <p className="text-[12px] text-muted-foreground mt-2 text-center">Each hit drags the baseline lower. Stop, and — given time — it climbs back to neutral.</p>
          </div>
        </Section>

        {/* Tolerance */}
        <Section>
          <Eyebrow>05 — Tolerance</Eyebrow>
          <H>The brain pulls its own receptors offline.</H>
          <P>Flood any system long enough and it adapts. Hammered with dopamine, the brain protects itself by removing its own receptors — fewer places for the signal to land. The same hit does less, so you reach for more. It is the identical mechanism behind drug dependence. The circuit doesn't care whether the dopamine came from cocaine or a 2 a.m. scroll — only how much, how fast, how often.</P>
        </Section>

        {/* The loop */}
        <Section>
          <Eyebrow>06 — The loop</Eyebrow>
          <H>Why all three feed each other.</H>
          <P>They share a currency (dopamine), a trigger (bored, stressed, lonely, tired), and a delivery van (the phone). And each one's crash hands you straight to the next.</P>
          <div className="mt-8"><LoopDiagram /></div>
          <P className="mt-8">Phone empties you out, the comedown reaches for sugar, the sugar crash drops your mood, the low mood sends you back to the phone. It isn't weak character. It's a circuit doing exactly what it evolved to do — in a world it was never built for.</P>
        </Section>

        {/* The way out */}
        <Section>
          <Eyebrow color={DOPA}>07 — The way out</Eyebrow>
          <H>The balance heals.</H>
          <P>The same biology that traps you is the thing that frees you. Three moves, in order of leverage:</P>
          <div className="mt-7 space-y-4">
            {[
              { n: 'Reset', d: 'Step away from the supernormal stuff long enough and the receptors come back online; the baseline climbs back to neutral. Around four weeks is the rule of thumb — the first two are the hardest, because you\'re finally feeling the deficit you\'d been outrunning. It passes.' },
              { n: 'Add friction', d: 'Willpower loses to a circuit, but it beats distance. Phone out of the bedroom. Screen on grayscale. App deleted, not just closed. Sugar not in the house. You\'re not trying to be stronger than the urge — you\'re making the first domino harder to tip.' },
              { n: 'Earn it back', d: 'Exercise, cold, sunlight, hard focused work, real people, real food — these raise dopamine slowly and leave the baseline higher, not lower. Press deliberately on the hard side and pleasure rebounds to meet it. Cheap dopamine borrows from tomorrow; earned dopamine pays into it.' },
            ].map((m, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ background: 'color-mix(in oklab, var(--color-card) 60%, transparent)', border: '1px solid var(--color-border)', borderLeft: `3px solid ${DOPA}` }}>
                <div className="font-heading text-lg mb-1.5" style={{ fontWeight: 500 }}>{m.n}</div>
                <p className="text-[14.5px] leading-relaxed text-muted-foreground">{m.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 rounded-2xl p-5 text-[14px] leading-relaxed" style={{ background: `color-mix(in oklab, ${PAIN} 8%, transparent)`, border: `1px solid color-mix(in oklab, ${PAIN} 26%, transparent)`, color: 'var(--color-foreground)' }}>
            And if it feels bigger than a habit — if it carries real weight — talking to someone (a friend who won't flinch, or a professional) isn't the back-up plan. It's the strong move. You don't have to out-engineer this alone.
          </div>
        </Section>

        {/* Closing */}
        <section className="max-w-2xl mx-auto px-5 sm:px-6 pt-10 pb-24 text-center">
          <Reveal>
            <span aria-hidden="true" className="block w-px h-12 mx-auto mb-10" style={{ background: 'linear-gradient(to bottom, transparent, var(--color-border))' }} />
            <p className="font-serif italic text-[clamp(1.15rem,3vw,1.6rem)] leading-relaxed" style={{ color: 'var(--color-foreground)' }}>
              The goal was never a life without pleasure. It's a brain quiet enough to feel the small, real ones again — a conversation, a walk, a hard thing finished.
            </p>
            <p className="font-serif text-muted-foreground/60 mt-5 text-[15px]">The plaster eggs just got loud enough to drown them out.</p>
            <p className="text-[11.5px] text-muted-foreground/50 mt-12 leading-relaxed font-mono">
              Drawn from the work of Wolfram Schultz · Kent Berridge · Niko Tinbergen ·<br className="hidden sm:block" /> B.F. Skinner · Robert Sapolsky · Anna Lembke (<span className="italic">Dopamine Nation</span>).
            </p>
          </Reveal>
        </section>
      </div>
  )
}
