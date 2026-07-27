import React, { useRef, useCallback, useEffect } from 'react'

// A private, unlisted "All the best" page — a warm note + genuine B1/B2 visa
// interview tips, meant to be shared directly via its #/allthebest link. No
// identifying details: it never names anyone or references any backstory, so
// it's safe to live on the public site.

const TIPS = [
  { icon: '🎯', t: 'Know your one-line answer', d: 'Why are you travelling? Have it ready in a single clear sentence — tourism, visiting family, a conference. Certainty reads as honesty.' },
  { icon: '✂️', t: 'Keep answers short', d: 'A sentence or two. Answer exactly what was asked and stop. Over-explaining sounds like nerves, not dishonesty — but let it stay simple.' },
  { icon: '🏡', t: 'Show your roots', d: 'Your job, your people, your life here — the reasons you’re coming back. You’re not leaving anything; you’re just visiting.' },
  { icon: '📄', t: 'Carry it, calmly', d: 'Have your documents neat and ready — you may never be asked for them. The strongest document is a steady, consistent answer.' },
  { icon: '🤝', t: 'The officer isn’t the enemy', d: 'It’s a 60-second conversation, not a trial. They just want to understand your intent. Meet their eyes, and smile.' },
  { icon: '✅', t: 'Match your DS-160', d: 'Answer honestly and consistently with what you already filed. Truth is the easiest thing to remember.' },
]

// A gentle "for luck" burst — clovers and sparkles that float up and fade.
const LUCK = ['🍀', '✨', '⭐', '🌿', '💫', '🎉']

export default function AllTheBest({ onBack }) {
  const burstRef = useRef(null)

  const sprinkle = useCallback((count = 22, originY = null) => {
    const host = burstRef.current
    if (!host) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span')
      s.textContent = LUCK[(Math.random() * LUCK.length) | 0]
      s.className = 'atb-luck'
      const startX = 40 + Math.random() * 20            // vw, cluster near centre
      const drift = (Math.random() * 2 - 1) * 26        // vw sideways drift
      s.style.left = startX + 'vw'
      s.style.top = (originY == null ? 62 : originY) + 'vh'
      s.style.fontSize = 14 + Math.random() * 20 + 'px'
      s.style.setProperty('--dx', drift + 'vw')
      s.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg')
      s.style.animationDelay = (Math.random() * 0.25) + 's'
      s.style.animationDuration = (1.6 + Math.random() * 1.1) + 's'
      host.appendChild(s)
      s.addEventListener('animationend', () => s.remove(), { once: true })
    }
  }, [])

  // A quiet welcome sprinkle on arrival.
  useEffect(() => {
    const id = setTimeout(() => sprinkle(16), 500)
    return () => clearTimeout(id)
  }, [sprinkle])

  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto" style={{ background: 'var(--color-background)' }}>
      <style>{ATB_STYLE}</style>
      <div className="pr-backdrop-base" aria-hidden="true" />
      <div className="pr-backdrop-glow" aria-hidden="true" />
      <div className="pr-backdrop-noise" aria-hidden="true" />

      {/* Confetti layer */}
      <div ref={burstRef} className="fixed inset-0 pointer-events-none z-[400]" aria-hidden="true" />

      <button onClick={onBack} title="Back to site"
        className="fixed top-4 left-4 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
        style={{ background: 'color-mix(in oklab, var(--color-card) 70%, transparent)', border: '1px solid var(--color-border)', backdropFilter: 'blur(8px)' }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="relative z-10 max-w-2xl mx-auto px-5 sm:px-6 pt-24 pb-24">
        {/* Hero */}
        <header className="text-center mb-12">
          <div className="text-[11px] font-mono uppercase tracking-[0.3em] mb-4 atb-fade" style={{ color: 'var(--color-accent)', animationDelay: '0.05s' }}>
            A little note before your interview
          </div>
          <h1 className="font-heading leading-[1.02] mb-5 atb-fade atb-glow" style={{ fontSize: 'clamp(2.8rem, 11vw, 5rem)', fontWeight: 500, animationDelay: '0.15s' }}>
            All the best
          </h1>
          <p className="text-[clamp(1.05rem,2.6vw,1.3rem)] leading-relaxed text-muted-foreground max-w-lg mx-auto atb-fade" style={{ animationDelay: '0.3s' }}>
            For your <span className="font-medium" style={{ color: 'var(--color-foreground)' }}>B1/B2 visa interview</span>. You’re ready for this — truly.
          </p>
        </header>

        {/* Warm opening note */}
        <section className="rounded-2xl p-6 sm:p-7 mb-10 atb-fade" style={{ animationDelay: '0.42s', background: 'color-mix(in oklab, var(--color-accent) 8%, transparent)', border: '1px solid color-mix(in oklab, var(--color-accent) 20%, var(--color-border))' }}>
          <p className="text-[15.5px] sm:text-base leading-[1.75] text-foreground/90">
            Big days can feel heavier than they actually are. But you’ve already done the hard part — the
            preparation, the effort, the quiet showing-up nobody sees. The interview itself is just a short
            conversation. Walk in calm, answer honestly, and let them meet the person who earned this moment.
          </p>
          <p className="text-[15.5px] sm:text-base leading-[1.75] text-foreground/90 mt-4">
            A few minutes on the other side of a counter can’t measure everything you are. So breathe. Be yourself.
            The rest tends to follow.
          </p>
        </section>

        {/* Real tips */}
        <div className="mb-3 flex items-center gap-3">
          <h2 className="font-heading text-[1.35rem]" style={{ fontWeight: 500 }}>A few things that helped me</h2>
          <span className="h-px flex-1" style={{ background: 'linear-gradient(to right, var(--color-border), transparent)' }} />
        </div>
        <p className="text-[13px] text-muted-foreground mb-6">From my own B1/B2, for whatever it’s worth.</p>

        <div className="grid sm:grid-cols-2 gap-3.5 mb-12">
          {TIPS.map((tip, i) => (
            <section key={tip.t} className="rounded-2xl p-5 atb-fade transition-transform hover:-translate-y-0.5"
              style={{ animationDelay: `${0.5 + i * 0.07}s`, background: 'color-mix(in oklab, var(--color-card) 62%, transparent)', border: '1px solid var(--color-border)' }}>
              <div className="text-2xl mb-2.5" aria-hidden="true">{tip.icon}</div>
              <h3 className="font-heading text-[1.05rem] mb-1.5" style={{ fontWeight: 500 }}>{tip.t}</h3>
              <p className="text-[13.5px] leading-relaxed text-muted-foreground">{tip.d}</p>
            </section>
          ))}
        </div>

        {/* Calm reminder */}
        <section className="text-center mb-11">
          <p className="font-serif italic text-muted-foreground/80 leading-relaxed mx-auto max-w-md" style={{ fontSize: 'clamp(1.1rem, 2.8vw, 1.4rem)' }}>
            “Whatever the outcome, it doesn’t define you. But I have a really good feeling about this one.”
          </p>
        </section>

        {/* For luck */}
        <div className="text-center">
          <button
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              sprinkle(30, (rect.top / window.innerHeight) * 100)
            }}
            className="inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-[15px] font-semibold transition-transform hover:scale-105 active:scale-95"
            style={{ background: 'var(--color-accent)', color: 'var(--color-accent-foreground)', boxShadow: '0 8px 24px -8px color-mix(in oklab, var(--color-accent) 60%, transparent)' }}
          >
            <span aria-hidden="true">🍀</span> Tap for luck
          </button>
          <p className="text-[13px] text-muted-foreground mt-6">
            Go get that visa. Rooting for you — always.
          </p>
          <p className="text-lg mt-3" aria-hidden="true">🇺🇸 ✈️ ✨</p>
        </div>
      </div>
    </div>
  )
}

const ATB_STYLE = `
  @keyframes atbFade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  .atb-fade { opacity: 0; animation: atbFade 0.9s cubic-bezier(0.22,0.61,0.36,1) forwards; }
  .atb-glow { text-shadow: 0 0 34px color-mix(in oklab, var(--color-accent) 30%, transparent); }
  @keyframes atbLuck {
    0%   { opacity: 0; transform: translate(0, 0) scale(0.5) rotate(0deg); }
    15%  { opacity: 1; }
    100% { opacity: 0; transform: translate(var(--dx), -78vh) scale(1.1) rotate(var(--rot)); }
  }
  .atb-luck { position: absolute; will-change: transform, opacity; animation: atbLuck 2s ease-out forwards; }
  @media (prefers-reduced-motion: reduce) {
    .atb-fade { opacity: 1; animation: none; }
  }
`
