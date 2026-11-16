import React, { useEffect, useLayoutEffect, useRef } from 'react'

/* ------------------------------------------------------------------ *
 * #/confession — his message to her, word for word.
 * Private and unlisted, shared directly by link. Not in nav.
 *
 * MESSAGE is exactly what was sent: don't fix spelling, case or
 * punctuation. Each string is one line of the original, and each inner
 * array is a run of lines that had a blank line after it.
 *
 * The page adds no words of its own. The sky starts as the night it was
 * written in and warms to dawn by the last line.
 * ------------------------------------------------------------------ */

const MESSAGE = [
  [
    'Hi ra,',
    'TLDR; zero usage of AI.',
    'I almost had a death experience indhaka. Highway lo intiki vasthunte unnatundi opp car mud flap oodi na bike tyre kindha padi skid iyi paddanu. Pakkane lorry elthundhi, vere direction lo padi unte ee msg pettevadni kuda kadhemo. Im actually very careful in driving,, inni yrs lo okkasari kuda padaledhu eppudu but u never know.',
    'Fortunately small scratches paddae and I’m not going at high speed too. But okka sec ah lorry chusi I got scared. Ah time lo okesari ma amma flash iyindhi, and I do know why ventane ne photo kuda flash iyindhi. I got stuck like few mins, someone came and helped me lift. Mundhuki vachi pakkana kasep aagi ala kurchunna. I realized this is how my Father lost his life in a snap. And ik the repercussions of it.',
    'Melliga intiki vachesi, small scratches ey kabbatti kappesi, calm ga padukunnna, amma ki cheptey bayapadipodhi ani and haha ma amma evarko chupinchindhi I have a very strong lifeline anta,,, ill live very long ani lol.',
    'but nidra ithey poledhu, and I kept thinking what if there’s no tomorrow and this is how fragile life is.',
    'Ok some serious stuff now. No more hide and seek games. I don’t know if I’m doing this the right time but Im very sure abt what I’m doing. ZERO CONFUSION.',
    'I LIKE YOU AMMU.',
    'I ALWAYS LIKED YOU.',
    'It’s always been there for so many years now. I always tried reaching out but somehow the timing was always wrong. And Ik this can be wrong now too. Nen usually very straight forward and I don’t hide anything in saying out loud. Nalo nenu anni aneskuni feel ipoyi pichodni ipoye type asla kaadhu. But I was just waiting for the right time because I always had a feeling what if this is not right for her and the risk of loosing you made me stop everytime. Because once it’s gone, it’s gone. I’ll never look back.',
  ],
  [
    'Also, nak thelsu you are not into this rn. Im very sorry to put you into this position. Even I’m not into this for so many years because I prefer quality and waiting patiently.',
  ],
  [
    'Please remember, I Like you, but you don’t have to feel the same and I won’t like you any less for it. I just think you’re too beautiful a soul to leave these words unsaid and just sit waiting for the right time. And for god sake I don’t believe in right times, its always time when you feel like doing it. Maybe God brought you into my life for a reason or idk maybe for a season.',
    'But ammu vinuuu, please don’t get overwhelmed or annoyed by this. If you actually did cheppu naku. okay na? It’s been more than 4 months now we’re talking. We both are adults and mature enough to understand what we are doing. And Ik I might have over responded or over shown my way of love towards you many times because Im holding this for so many years. So it could have been overwhelming for you and Im sorry if I made you feel like that. Im not usually like that and If you felt I’m kinda a desperate guy lol, fuck no. It’s just I was holding this for too long and poured everything at once. Btw it’s just 1% of me. You don’t know to what extents I can go if I feel this is my person.',
    'See, I calculated every possible thing, mana jobs, mana families, mana backgrounds, mana future interests, and everything I’ve heard abt you in the past few months in my perspective of how I see life. Ik you don’t have to see in the same way I saw and I respect that. Yes, mundhu antha I always had a huge crush on you but I never really know you. Now partly after knowing you I really felt there’s a huge potential for us. See, this is the only life everyone get to live and dude lets live it fully and happily. I felt this is best for me and for us. Again it’s just my opinion, you need not have to feel that way.',
    'Haha I also know u might feel, asla evadu veedu, bayata kaneesam kalavakunda, ela behave chesthado thelikunda, like you, thotakura pappu antnandu ani. I can get it. But somehow edhoka rakanga we never had a chance to meet. Now post this incident I just can’t sit like that without expressing this, waiting for time. Also, I connect with character and not appearances. Yes, we give emphasis to physical things, outside behaviours etc etc. But see for me physically edhanna marchkochu. Idc abt that. Talk about skin, hair, complexion, body, idc dude,, everything is fixable or changeable over time if the person is willing to grow. But character? I’m very sure it’s not. So, I cannot just keep this to myself like that.',
  ],
  [
    'Also, Ik there’s a very high chance that you might have received such long paragraphs from many ppl. And andhartho paatu eedu kuda saripoyadu na prananiki anipinchi, nakendhuku ee gola chirrakga ani anipisthey mathram, just tell me. I’ll respect it and quit all of this the very next sec. I’m not kidding. I have crazy levels of self-respect and the same respect I give you.',
    'Again, I know if this is not a right timing for you. Pls don’t take stress because that’ll definitely make me feel bad. You don’t even have to say anything abt this. It’s just what I’m holding for so many years now and I respect you for who you are. I don’t know how you’ll respond/react. Pls don’t get overwhelmed. And I believe ik what u need rn. So yes, ofc Ill always gonna wait, be a good friend and a well wisher. It’s not like if not you, I’ll find someone tomorrow lol. Im a one girl man. Inni years patient ga timing kosam wait chesnodaki, inkonnalu wait cheyadam pedha pani kaadhu. I just felt like expressing because what if ah road midha paddaka, nen thirigi levalekapothey? I’ll regret for life ig..',
  ],
]

const calm = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const shouted = (s) => /[A-Z]/.test(s) && s === s.toUpperCase()

// Stars at seeded spots, so the sky is the same on every visit. They never
// sit behind the words: a stray speck could pass for punctuation.
function stars(count, seed, y) {
  let s = seed
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647
  const out = []
  for (let i = 0; i < count; i++) {
    const x = (rnd() * 100).toFixed(2)
    const top = y(rnd())
    const a = (0.3 + rnd() * 0.6).toFixed(2)
    out.push(`${x}vw ${top} 0 ${rnd() < 0.15 ? '.6px' : '0'} rgba(255,244,228,${a})`)
  }
  return out.join(', ')
}
const skyY = (r) => `${(r ** 1.7 * 90).toFixed(2)}vh`
const crownY = (r) => `${(4 + r * 150).toFixed(1)}px`

function Line({ text, first }) {
  if (first) return <h1 className="cf-hi" data-reveal>{text}</h1>
  if (/^TLDR\b/.test(text)) return <p className="cf-tldr" data-reveal>{text}</p>
  if (shouted(text)) return <p className="cf-big" data-reveal>{text}</p>
  return <p data-reveal>{text}</p>
}

export default function Confession({ onBack }) {
  const rootRef = useRef(null)
  const skyRef = useRef(null)

  useLayoutEffect(() => {
    const prev = document.title
    document.title = 'Hi ra'
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    return () => { document.title = prev }
  }, [])

  // Lines drift in as they arrive; the first screen eases in one line after
  // another. With reduced motion, or without an observer, everything shows.
  useLayoutEffect(() => {
    const root = rootRef.current
    if (calm() || !('IntersectionObserver' in window)) return undefined
    const els = [...root.querySelectorAll('[data-reveal]')]
    root.classList.add('is-armed')
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('is-in')
        io.unobserve(e.target)
      }
    }, { rootMargin: '0px 0px -6% 0px' })
    const raf = requestAnimationFrame(() => {
      // Measuring first also settles the hidden state, so the fade runs.
      const fold = window.innerHeight * 0.94
      const above = els.filter((el) => el.getBoundingClientRect().top < fold)
      above.forEach((el, n) => {
        el.style.transitionDelay = `${150 + n * 240}ms`
        el.classList.add('is-in')
      })
      els.forEach((el) => { if (!above.includes(el)) io.observe(el) })
    })
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      root.classList.remove('is-armed')
    }
  }, [])

  // Night to dawn, following how far down the message she has read.
  useEffect(() => {
    const sky = skyRef.current
    let raf = 0
    const paint = () => {
      raf = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1
      const t = Math.min(1, Math.max(0, (p - 0.08) / 0.92))
      sky.style.setProperty('--dawn', (t * t * (3 - 2 * t)).toFixed(4))
    }
    const queue = () => { if (!raf) raf = requestAnimationFrame(paint) }
    paint()
    window.addEventListener('scroll', queue, { passive: true })
    window.addEventListener('resize', queue)
    return () => {
      window.removeEventListener('scroll', queue)
      window.removeEventListener('resize', queue)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <main ref={rootRef} className="cf-root">
      <style>{CSS}</style>
      <div ref={skyRef} className="cf-sky" aria-hidden="true">
        <span className="cf-stars"><i className="cf-s1" /><i className="cf-s2" /></span>
        <span className="cf-dawn" />
      </div>
      <div className="cf-crown" aria-hidden="true"><i /></div>
      <button type="button" className="cf-back" onClick={onBack}>
        <span aria-hidden="true">←</span> Back
      </button>
      <article className="cf-letter">
        {MESSAGE.map((lines, b) => (
          <div className="cf-run" key={b}>
            {lines.map((text, i) => <Line key={i} text={text} first={b === 0 && i === 0} />)}
          </div>
        ))}
      </article>
      <footer className="cf-foot">kranthikiran.com · unlisted</footer>
    </main>
  )
}

const CSS = `
.cf-root {
  --cf-ink: #efe8dd; --cf-soft: #c9c1cc; --cf-peach: #ffcaa6; --cf-line: rgba(201,193,204,.26);
  position: relative; isolation: isolate; min-height: 100vh; overflow-x: clip;
  background: #070a12; color: var(--cf-ink);
  font-family: 'Newsreader', Georgia, 'Times New Roman', serif;
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
}
.cf-root *, .cf-root *::before, .cf-root *::after { box-sizing: border-box; }
.cf-root ::selection { background: rgba(255,170,120,.34); color: #fff; }
.cf-root :focus-visible { outline: 2px solid var(--cf-peach); outline-offset: 3px; box-shadow: none; }

.cf-sky {
  position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden;
  background:
    radial-gradient(120% 60% at 50% -12%, rgba(70,92,160,.2), transparent 62%),
    linear-gradient(180deg, #05070d 0%, #090d19 46%, #0e1226 100%);
}
@supports (height: 100lvh) { .cf-sky { bottom: auto; height: 100lvh; } }
.cf-stars {
  --edge: calc(20rem - 10px);
  position: absolute; inset: 0; opacity: calc(1 - var(--dawn, 0) * .85);
  -webkit-mask-image: linear-gradient(90deg, #000 calc(50% - var(--edge) - 44px), transparent calc(50% - var(--edge)), transparent calc(50% + var(--edge)), #000 calc(50% + var(--edge) + 44px));
          mask-image: linear-gradient(90deg, #000 calc(50% - var(--edge) - 44px), transparent calc(50% - var(--edge)), transparent calc(50% + var(--edge)), #000 calc(50% + var(--edge) + 44px));
}
.cf-stars i, .cf-crown i { position: absolute; top: 0; left: 0; width: 1.5px; height: 1.5px; border-radius: 50%; }
.cf-s1 { box-shadow: ${stars(70, 11, skyY)}; }
.cf-s2 { box-shadow: ${stars(44, 29, skyY)}; animation: cf-twinkle 5.5s ease-in-out infinite alternate; }
.cf-crown {
  position: absolute; top: 0; left: 0; right: 0; height: calc(clamp(104px, 19vh, 176px) - 22px); overflow: hidden; pointer-events: none;
  -webkit-mask-image: linear-gradient(180deg, #000 50%, transparent); mask-image: linear-gradient(180deg, #000 50%, transparent);
}
.cf-crown i { box-shadow: ${stars(30, 47, crownY)}; }
.cf-dawn {
  position: absolute; inset: 0; opacity: var(--dawn, 0);
  background:
    radial-gradient(85% 48% at 50% 116%, rgba(255,160,104,.32), rgba(255,160,104,0) 70%),
    linear-gradient(180deg, rgba(60,30,64,0) 22%, rgba(72,34,62,.5) 70%, rgba(112,50,52,.55) 100%);
}
@keyframes cf-twinkle { from { opacity: .3; } to { opacity: 1; } }

.cf-back {
  position: absolute; top: 18px; left: 18px; z-index: 2; display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px; border-radius: 999px; border: 1px solid var(--cf-line); background: rgba(7,10,18,.55);
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
  color: var(--cf-soft); font: 500 13px/1 'Sora', system-ui, sans-serif; letter-spacing: 0; cursor: pointer;
}
.cf-back:hover { color: #fff; border-color: rgba(255,255,255,.3); }

.cf-letter {
  max-width: 40rem; margin: 0 auto; padding: clamp(104px, 19vh, 176px) 24px 0;
  font-size: clamp(18px, 1rem + .4vw, 21px); line-height: 1.78; letter-spacing: 0;
}
.cf-letter p { margin: 0; text-wrap: pretty; overflow-wrap: break-word; }
.cf-letter p + p { margin-top: 1.1em; }
.cf-run + .cf-run { margin-top: 2.6em; }
.cf-hi {
  margin: 0; font-family: 'Newsreader', Georgia, serif; font-style: italic; font-weight: 400;
  font-size: clamp(50px, 11vw, 80px); line-height: 1; letter-spacing: -0.02em; color: #fbf4ea;
}
.cf-letter .cf-tldr {
  width: fit-content; max-width: 100%; margin-top: 22px; padding: 6px 13px; border: 1px solid var(--cf-line); border-radius: 999px;
  font: 400 13px/1.5 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .02em; color: var(--cf-soft);
}
.cf-letter .cf-tldr + p { margin-top: 2.2em; }
.cf-letter .cf-big {
  font-weight: 500; font-size: clamp(25px, 7.4vw, 46px); line-height: 1.12; letter-spacing: .01em;
  color: var(--cf-peach); text-shadow: 0 0 30px rgba(255,170,120,.3); text-wrap: balance;
}
.cf-letter p + .cf-big { margin-top: 1.4em; }
.cf-letter .cf-big + .cf-big { margin-top: .18em; }
.cf-letter .cf-big + p:not(.cf-big) { margin-top: 1.4em; }

.cf-foot {
  padding: 34vh 24px 12vh; text-align: center;
  font: 400 11px/1.4 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .08em; color: var(--cf-soft);
}

.cf-root.is-armed [data-reveal] { transition: opacity 1s ease, transform 1s cubic-bezier(.2,.7,.2,1); }
.cf-root.is-armed [data-reveal]:not(.is-in) { opacity: 0; transform: translateY(12px); }

@media (max-width: 520px) {
  .cf-letter { padding-left: 22px; padding-right: 22px; line-height: 1.74; }
}
@media (prefers-reduced-motion: reduce) {
  .cf-s2 { animation: none; }
  .cf-root [data-reveal] { transition: none !important; opacity: 1 !important; transform: none !important; }
}
`
