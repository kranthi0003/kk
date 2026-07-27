import React, { useState, useRef, useCallback, useEffect } from 'react'

// A private, unlisted "All the best" card. Premium + interactive: the message
// stays sealed until you tap the gold wax seal to open it. Shared directly via
// #/allthebest. No identifying details anywhere — safe on the public site.

const GOLD = ['#e8c877', '#f3d98b', '#c9a24a', '#ffffff', '#0f766e']

export default function AllTheBest({ onBack }) {
  const [open, setOpen] = useState(false)
  const burstRef = useRef(null)

  const fire = useCallback((count, xvw = 50, yvh = 46) => {
    const host = burstRef.current
    if (!host) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span')
      const spark = Math.random() > 0.8
      if (spark) {
        s.textContent = '✦'
        s.style.color = '#f3d98b'
        s.style.fontSize = 10 + Math.random() * 14 + 'px'
      } else {
        s.className = 'atb-paper'
        s.style.background = GOLD[(Math.random() * GOLD.length) | 0]
        s.style.width = 6 + Math.random() * 6 + 'px'
        s.style.height = 9 + Math.random() * 7 + 'px'
      }
      s.classList.add('atb-piece')
      s.style.left = xvw + (Math.random() * 14 - 7) + 'vw'
      s.style.top = yvh + 'vh'
      s.style.setProperty('--dx', (Math.random() * 2 - 1) * 30 + 'vw')
      s.style.setProperty('--dy', -(30 + Math.random() * 40) + 'vh')
      s.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg')
      s.style.animationDelay = Math.random() * 0.12 + 's'
      s.style.animationDuration = 1.7 + Math.random() * 1.2 + 's'
      host.appendChild(s)
      s.addEventListener('animationend', () => s.remove(), { once: true })
    }
  }, [])

  const doOpen = useCallback(() => {
    if (open) return
    setOpen(true)
    fire(70, 50, 18)
    setTimeout(() => fire(40, 28, 12), 220)
    setTimeout(() => fire(40, 72, 12), 400)
  }, [open, fire])

  // Tapping the revealed card sends a little extra luck.
  const luck = useCallback((e) => {
    const y = e && e.clientY ? (e.clientY / window.innerHeight) * 100 : 40
    fire(26, 50, Math.max(10, y - 6))
  }, [fire])

  const onGateKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doOpen() } }

  return (
    <div className="atb-root fixed inset-0 z-[300] overflow-hidden">
      <style>{ATB_STYLE}</style>

      {/* Depth: soft central glow + vignette */}
      <div className="atb-glow absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="atb-vignette absolute inset-0 pointer-events-none" aria-hidden="true" />

      {/* Ambient drifting gold specks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {SPECKS.map((s, i) => (
          <span key={i} className="atb-speck" style={{ left: s.left, animationDelay: s.delay, animationDuration: s.dur, width: s.size, height: s.size }} />
        ))}
      </div>

      {/* Confetti layer */}
      <div ref={burstRef} className="fixed inset-0 pointer-events-none z-[500]" aria-hidden="true" />

      {/* Back */}
      <button onClick={onBack} title="Back"
        className="fixed top-4 left-4 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-transform hover:scale-105"
        style={{ color: 'rgba(243,217,139,0.9)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(243,217,139,0.22)', backdropFilter: 'blur(8px)' }}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.4}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        <span className="hidden sm:inline">Back</span>
      </button>

      <div className="relative z-10 h-full w-full flex items-center justify-center px-6">
        {!open ? (
          /* ---------- Sealed gate ---------- */
          <div
            role="button" tabIndex={0} onClick={doOpen} onKeyDown={onGateKey}
            aria-label="Tap to open your note"
            className="atb-gate group flex flex-col items-center text-center cursor-pointer select-none outline-none"
          >
            <p className="font-heading italic text-[15px] sm:text-base mb-8" style={{ color: 'rgba(244,236,216,0.6)' }}>A little something for you…</p>

            {/* Wax seal */}
            <div className="atb-seal relative flex items-center justify-center mb-8" aria-hidden="true">
              <span className="atb-seal-ring" />
              <span className="atb-seal-disc flex items-center justify-center">
                <span className="font-heading text-[2rem]" style={{ color: '#3a2a06' }}>✦</span>
              </span>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold uppercase tracking-[0.28em] transition-all group-hover:scale-105"
              style={{ color: '#f3d98b', border: '1px solid rgba(243,217,139,0.4)', background: 'rgba(243,217,139,0.06)' }}>
              Tap to open
            </span>
          </div>
        ) : (
          /* ---------- Revealed message ---------- */
          <div onClick={luck} className="atb-reveal w-full max-w-xl text-center cursor-pointer">
            <h1 className="atb-title font-heading font-semibold leading-[1.04] mb-6"
              style={{ fontSize: 'clamp(1.35rem, 6.2vw, 4.25rem)', whiteSpace: 'nowrap' }}>
              All the best, Amrutha.
            </h1>

            <div className="atb-r flex items-center justify-center gap-4 mb-6" style={{ animationDelay: '0.2s' }} aria-hidden="true">
              <span className="h-px w-14" style={{ background: 'linear-gradient(to right, transparent, rgba(243,217,139,0.7))' }} />
              <span style={{ color: '#f3d98b' }}>✦</span>
              <span className="h-px w-14" style={{ background: 'linear-gradient(to left, transparent, rgba(243,217,139,0.7))' }} />
            </div>

            <p className="atb-r text-[clamp(1.05rem,2.8vw,1.4rem)] leading-relaxed mb-3" style={{ color: 'rgba(244,236,216,0.92)', animationDelay: '0.3s' }}>
              You’ll do great.
            </p>
            <p className="atb-r font-heading italic text-[clamp(1.05rem,2.6vw,1.3rem)]" style={{ color: '#f3d98b', animationDelay: '0.42s' }}>
              Manchiga cheppesi ochey. 🍀
            </p>

            <div className="atb-r mt-10 text-[11px] uppercase tracking-[0.25em]" style={{ color: 'rgba(243,217,139,0.5)', animationDelay: '0.6s' }}>
              tap anywhere for a little luck ✦
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const SPECKS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 6.3 + (i % 3) * 2) % 100 + '%',
  delay: (i * 0.7) % 9 + 's',
  dur: 9 + (i % 5) * 1.6 + 's',
  size: 2 + (i % 3) + 'px',
}))

const ATB_STYLE = `
  .atb-root {
    background:
      radial-gradient(58% 52% at 16% 16%, rgba(16,185,129,0.55) 0%, transparent 60%),
      radial-gradient(52% 50% at 86% 14%, rgba(34,211,238,0.48) 0%, transparent 60%),
      radial-gradient(58% 56% at 84% 86%, rgba(139,92,246,0.5) 0%, transparent 62%),
      radial-gradient(62% 56% at 14% 90%, rgba(244,63,94,0.32) 0%, transparent 60%),
      linear-gradient(165deg, #070a17 0%, #0a1a2f 46%, #061f1c 100%);
    background-size: 170% 170%, 170% 170%, 170% 170%, 170% 170%, 200% 200%;
    animation: atbAurora 22s ease-in-out infinite;
  }
  @keyframes atbAurora {
    0%,100% { background-position: 0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50%; }
    50%     { background-position: 26% 16%, 74% 18%, 72% 82%, 26% 84%, 100% 50%; }
  }
  /* Warm focus glow behind the message + darkened edges for depth */
  .atb-glow { background: radial-gradient(46% 42% at 50% 44%, rgba(243,217,139,0.14) 0%, transparent 70%); }
  .atb-vignette { background: radial-gradient(120% 100% at 50% 45%, transparent 52%, rgba(3,6,12,0.55) 100%); }

  /* Sealed gate */
  .atb-gate { animation: atbFade .9s cubic-bezier(.22,.61,.36,1) both; }
  @keyframes atbFade { from{opacity:0; transform:translateY(14px);} to{opacity:1; transform:none;} }
  .atb-seal { width: 128px; height: 128px; }
  .atb-seal-disc {
    width: 104px; height: 104px; border-radius: 50%;
    background: radial-gradient(circle at 34% 30%, #f6e6a8, #e8c877 42%, #b8862b 100%);
    box-shadow: inset 0 3px 10px rgba(255,255,255,0.5), inset 0 -8px 16px rgba(80,54,6,0.55), 0 10px 34px rgba(232,200,119,0.35);
    animation: atbBreathe 3.2s ease-in-out infinite;
  }
  .atb-seal-ring {
    position:absolute; inset:0; border-radius:50%;
    border: 1.5px solid rgba(243,217,139,0.5);
    animation: atbHalo 3.2s ease-in-out infinite;
  }
  @keyframes atbBreathe { 0%,100%{ transform: scale(1);} 50%{ transform: scale(1.04);} }
  @keyframes atbHalo { 0%,100%{ transform: scale(1); opacity:.6;} 50%{ transform: scale(1.28); opacity:0;} }

  /* Revealed */
  .atb-reveal { animation: atbPop .6s cubic-bezier(.22,.61,.36,1) both; }
  @keyframes atbPop { 0%{opacity:0; transform: scale(.92); filter: blur(6px);} 100%{opacity:1; transform:none; filter:blur(0);} }
  .atb-r { opacity:0; animation: atbFade .8s cubic-bezier(.22,.61,.36,1) forwards; }
  .atb-title {
    background: linear-gradient(100deg, #ffffff 0%, #f3d98b 30%, #e8c877 45%, #ffffff 60%, #f3d98b 78%);
    background-size: 220% auto;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    animation: atbShine 4.5s linear infinite;
    text-shadow: 0 8px 40px rgba(232,200,119,0.18);
  }
  @keyframes atbShine { to { background-position: 220% center; } }

  /* Confetti */
  .atb-piece { position:absolute; will-change: transform, opacity; animation: atbFly 2s ease-out forwards; }
  .atb-paper { border-radius: 2px; }
  @keyframes atbFly {
    0%{ opacity:0; transform: translate(0,0) rotate(0) scale(.5);} 12%{opacity:1;}
    100%{ opacity:0; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(1.05);} }

  /* Ambient specks */
  .atb-speck { position:absolute; bottom:-4vh; border-radius:50%; background:#f3d98b; opacity:0; box-shadow:0 0 6px rgba(243,217,139,0.7);
    animation-name: atbRiseSpeck; animation-timing-function: linear; animation-iteration-count: infinite; }
  @keyframes atbRiseSpeck { 0%{ transform: translateY(0); opacity:0;} 12%{opacity:.8;} 88%{opacity:.7;} 100%{ transform: translateY(-108vh); opacity:0;} }

  @media (prefers-reduced-motion: reduce) {
    .atb-root { animation:none; }
    .atb-gate, .atb-reveal, .atb-r { animation:none; opacity:1; }
    .atb-seal-disc, .atb-seal-ring, .atb-title { animation:none; }
    .atb-speck { display:none; }
  }
`
