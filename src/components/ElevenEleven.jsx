import React, { useState } from 'react'

const WISHES = [
  { id: 'brave', label: 'A little extra courage', icon: '☀', text: 'May you walk into every room knowing you belong there — because you do.' },
  { id: 'lucky', label: 'An unreasonable amount of luck', icon: '🍀', text: 'May the right things find you, the hard things get easier, and every plot twist be a good one.' },
  { id: 'smile', label: 'Something lovely, for no reason', icon: '✦', text: 'May today surprise you with something lovely. Ideally before you have to ask the universe twice.' },
]

const STARS = Array.from({ length: 11 }, (_, i) => i)

export default function ElevenEleven({ onBack }) {
  const [wish, setWish] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [stars, setStars] = useState([])

  const collectStar = (star) => {
    setStars((current) => current.includes(star) ? current : [...current, star])
  }

  const reset = () => {
    setWish('')
    setRevealed(false)
    setStars([])
  }

  const complete = stars.length === STARS.length

  return (
    <main className="wish-root">
      <style>{STYLE}</style>
      <div className="wish-sky" aria-hidden="true">
        {SKY.map((star, i) => <span key={i} className="wish-speck" style={star} />)}
      </div>
      <div className="wish-orbit wish-orbit-one" aria-hidden="true" />
      <div className="wish-orbit wish-orbit-two" aria-hidden="true" />

      <button className="wish-back" type="button" onClick={onBack}>
        <span aria-hidden="true">←</span> Back
      </button>

      <div className="wish-content">
        <p className="wish-eyebrow"><span>11:11</span> · a tiny wish machine</p>
        <h1>Make a wish,<br /><em>you lovely human.</em></h1>
        <p className="wish-intro">Pick the little bit of magic you want today. No overthinking — the universe is famously bad at reading long forms.</p>

        {!revealed ? (
          <>
            <div className="wish-options" role="group" aria-label="Choose a wish">
              {WISHES.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  className={`wish-option${wish === option.id ? ' selected' : ''}`}
                  aria-pressed={wish === option.id}
                  onClick={() => setWish(option.id)}
                >
                  <span className="wish-icon" aria-hidden="true">{option.icon}</span>
                  <span>{option.label}</span>
                  <span className="wish-check" aria-hidden="true">{wish === option.id ? '✓' : ''}</span>
                </button>
              ))}
            </div>
            <button type="button" className="wish-cta" disabled={!wish} onClick={() => setRevealed(true)}>
              Send my wish <span aria-hidden="true">↗</span>
            </button>
          </>
        ) : (
          <section className="wish-reveal" aria-live="polite">
            <div className="wish-moon" aria-hidden="true">✦</div>
            <p className="wish-label">Wish sent. Obviously.</p>
            <p className="wish-message">{WISHES.find((option) => option.id === wish)?.text}</p>

            {!complete ? (
              <>
                <p className="wish-star-prompt">Now tap all 11 stars to charge the bonus wish.<br /><span>{stars.length} of 11 collected</span></p>
                <div className="wish-starboard" aria-label={`${stars.length} of 11 stars collected`}>
                  {STARS.map((star) => {
                    const collected = stars.includes(star)
                    return (
                      <button
                        key={star}
                        type="button"
                        className={`wish-star${collected ? ' collected' : ''}`}
                        aria-label={`Star ${star + 1}${collected ? ', collected' : ''}`}
                        aria-pressed={collected}
                        onClick={() => collectStar(star)}
                      >
                        ✦
                      </button>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="wish-bonus">
                <p className="wish-label">Your bonus wish ✨</p>
                <p>May you smile at this — and let me make you do it again soon. You’re my friend, I like you, and I’m very glad you’re in my orbit. <span aria-label="winking face">😉</span></p>
              </div>
            )}

            <button type="button" className="wish-reset" onClick={reset}>Make another wish</button>
          </section>
        )}

        <p className="wish-foot">Made with one wish, eleven stars, and a very obvious favourite person.</p>
      </div>
    </main>
  )
}

const SKY = Array.from({ length: 42 }, (_, i) => ({
  left: `${(i * 37 + 13) % 100}%`,
  top: `${(i * 61 + 9) % 100}%`,
  '--delay': `${(i % 9) * -0.55}s`,
  '--size': `${2 + (i % 3)}px`,
}))

const STYLE = `
  .wish-root {
    --wish-ink: #fff8f1;
    --wish-muted: #c3b9d1;
    --wish-gold: #ffd78a;
    position: fixed; inset: 0; z-index: 300; overflow: auto;
    display: grid; place-items: center; padding: 72px 22px 38px;
    color: var(--wish-ink);
    background:
      radial-gradient(ellipse at 50% 12%, rgba(116, 77, 156, .34), transparent 44%),
      radial-gradient(ellipse at 10% 100%, rgba(232, 113, 147, .16), transparent 40%),
      linear-gradient(155deg, #121126 0%, #21182f 52%, #111429 100%);
    font-family: var(--font-body, ui-sans-serif, system-ui, sans-serif);
  }
  .wish-sky { position: fixed; inset: 0; overflow: hidden; pointer-events: none; }
  .wish-speck {
    position: absolute; width: var(--size); height: var(--size); border-radius: 50%;
    background: #fff5dc; opacity: .35;
    animation: wishTwinkle 3s ease-in-out var(--delay) infinite alternate;
  }
  @keyframes wishTwinkle { to { opacity: .9; transform: scale(1.7); } }
  .wish-orbit { position: fixed; width: min(78vw, 680px); aspect-ratio: 1; border: 1px solid rgba(255,215,138,.08); border-radius: 50%; pointer-events: none; }
  .wish-orbit-one { transform: translate(-45%, -20%); }
  .wish-orbit-two { width: min(106vw, 920px); transform: translate(44%, 45%); border-color: rgba(215,178,255,.07); }
  .wish-back {
    position: fixed; z-index: 2; top: 18px; left: 18px; border: 1px solid rgba(255,248,241,.18);
    border-radius: 999px; padding: 9px 14px; color: var(--wish-ink);
    background: rgba(255,255,255,.06); backdrop-filter: blur(10px); cursor: pointer;
  }
  .wish-back span { margin-right: 5px; color: var(--wish-gold); }
  .wish-content { position: relative; z-index: 1; width: min(100%, 620px); text-align: center; animation: wishEnter .8s cubic-bezier(.2,.7,.2,1) both; }
  @keyframes wishEnter { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  .wish-eyebrow { margin: 0 0 18px; color: var(--wish-muted); font-size: 11px; letter-spacing: .22em; text-transform: uppercase; }
  .wish-eyebrow span { color: var(--wish-gold); font-weight: 800; }
  .wish-content h1 { margin: 0; font-family: var(--font-heading, Georgia, serif); font-size: clamp(2.6rem, 8vw, 5rem); font-weight: 500; line-height: .99; letter-spacing: -.045em; }
  .wish-content h1 em { color: var(--wish-gold); font-weight: 400; }
  .wish-intro { max-width: 470px; margin: 20px auto 28px; color: var(--wish-muted); font-size: 15px; line-height: 1.7; }
  .wish-options { display: grid; gap: 10px; text-align: left; }
  .wish-option {
    display: flex; align-items: center; gap: 13px; width: 100%; padding: 13px 15px;
    border: 1px solid rgba(255,248,241,.14); border-radius: 16px; color: var(--wish-ink);
    background: rgba(255,255,255,.045); font: inherit; text-align: left; cursor: pointer;
    transition: transform .18s ease, border-color .18s ease, background .18s ease;
  }
  .wish-option:hover { transform: translateY(-2px); border-color: rgba(255,215,138,.5); }
  .wish-option.selected { border-color: var(--wish-gold); background: rgba(255,215,138,.1); }
  .wish-icon { display: grid; place-items: center; width: 36px; height: 36px; flex: 0 0 auto; border-radius: 12px; color: var(--wish-gold); background: rgba(255,215,138,.1); font-size: 20px; }
  .wish-check { margin-left: auto; color: var(--wish-gold); }
  .wish-cta {
    margin-top: 20px; padding: 13px 22px; border: 0; border-radius: 999px;
    color: #281c2e; background: linear-gradient(110deg, #ffe7ae, #ffc4cf);
    font: inherit; font-weight: 800; cursor: pointer; box-shadow: 0 8px 30px rgba(255,192,204,.16);
    transition: transform .18s ease, opacity .18s ease;
  }
  .wish-cta:hover:not(:disabled) { transform: translateY(-2px) scale(1.02); }
  .wish-cta:disabled { opacity: .38; cursor: not-allowed; }
  .wish-cta span { margin-left: 8px; }
  .wish-reveal { animation: wishEnter .65s cubic-bezier(.2,.7,.2,1) both; }
  .wish-moon { display: grid; place-items: center; width: 62px; height: 62px; margin: 0 auto 15px; border-radius: 50%; color: #392744; background: radial-gradient(circle at 34% 30%, #fff3cc, #ffd78a 68%, #ecaa77); box-shadow: 0 0 44px rgba(255,215,138,.24); font-size: 26px; }
  .wish-label { margin: 0 0 9px; color: var(--wish-gold); font-size: 11px; letter-spacing: .22em; text-transform: uppercase; }
  .wish-message { margin: 0 auto 26px; max-width: 520px; font-family: var(--font-heading, Georgia, serif); font-size: clamp(1.45rem, 4vw, 2rem); line-height: 1.35; }
  .wish-star-prompt { margin: 16px 0 10px; color: var(--wish-muted); font-size: 13px; line-height: 1.65; }
  .wish-star-prompt span { color: var(--wish-gold); font-size: 11px; letter-spacing: .13em; text-transform: uppercase; }
  .wish-starboard { display: flex; justify-content: center; flex-wrap: wrap; gap: 7px; max-width: 430px; margin: 0 auto 22px; }
  .wish-star { display: grid; place-items: center; width: 38px; height: 38px; border: 1px solid rgba(255,215,138,.25); border-radius: 50%; color: rgba(255,248,241,.42); background: rgba(255,255,255,.045); font-size: 19px; cursor: pointer; transition: .2s ease; }
  .wish-star:hover { transform: scale(1.14) rotate(12deg); color: var(--wish-gold); }
  .wish-star.collected { color: #36223b; background: var(--wish-gold); border-color: var(--wish-gold); box-shadow: 0 0 18px rgba(255,215,138,.35); animation: wishCollect .28s ease-out both; }
  @keyframes wishCollect { 50% { transform: scale(1.32); } }
  .wish-bonus { max-width: 520px; margin: 22px auto 8px; padding: 20px; border: 1px solid rgba(255,215,138,.28); border-radius: 20px; background: rgba(255,215,138,.07); animation: wishEnter .5s ease both; }
  .wish-bonus p:last-child { margin: 0; font-family: var(--font-heading, Georgia, serif); font-size: clamp(1.2rem, 3.3vw, 1.55rem); line-height: 1.5; }
  .wish-reset { margin-top: 16px; border: 0; color: var(--wish-muted); background: transparent; font: inherit; font-size: 12px; text-decoration: underline; text-underline-offset: 4px; cursor: pointer; }
  .wish-foot { margin: 30px 0 0; color: rgba(195,185,209,.58); font-size: 10px; letter-spacing: .1em; }
  .wish-root button:focus-visible { outline: 2px solid var(--wish-gold); outline-offset: 3px; }
  @media (max-width: 480px) { .wish-root { padding-inline: 18px; } .wish-intro { font-size: 14px; } .wish-star { width: 34px; height: 34px; } }
  @media (prefers-reduced-motion: reduce) { .wish-root *, .wish-root *::before, .wish-root *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; transition-duration: .01ms !important; } }
`
