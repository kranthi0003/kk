import{r as o,j as e}from"./index-CUYImLEv.js";const c=[{id:"brave",label:"A little extra courage",icon:"☀",text:"May you walk into every room knowing you belong there — because you do."},{id:"lucky",label:"An unreasonable amount of luck",icon:"🍀",text:"May the right things find you, the hard things get easier, and every plot twist be a good one."},{id:"smile",label:"Something lovely, for no reason",icon:"✦",text:"May today surprise you with something lovely. Ideally before you have to ask the universe twice."}],p=Array.from({length:11},(t,s)=>s);function v({onBack:t}){var h;const[s,n]=o.useState(""),[w,l]=o.useState(!1),[r,d]=o.useState([]),x=i=>{d(a=>a.includes(i)?a:[...a,i])},m=()=>{n(""),l(!1),d([])},g=r.length===p.length;return e.jsxs("main",{className:"wish-root",children:[e.jsx("style",{children:u}),e.jsx("div",{className:"wish-sky","aria-hidden":"true",children:b.map((i,a)=>e.jsx("span",{className:"wish-speck",style:i},a))}),e.jsx("div",{className:"wish-orbit wish-orbit-one","aria-hidden":"true"}),e.jsx("div",{className:"wish-orbit wish-orbit-two","aria-hidden":"true"}),e.jsxs("button",{className:"wish-back",type:"button",onClick:t,children:[e.jsx("span",{"aria-hidden":"true",children:"←"})," Back"]}),e.jsxs("div",{className:"wish-content",children:[e.jsxs("p",{className:"wish-eyebrow",children:[e.jsx("span",{children:"11:11"})," · a tiny wish machine"]}),e.jsxs("h1",{children:["Make a wish,",e.jsx("br",{}),e.jsx("em",{children:"you lovely human."})]}),e.jsx("p",{className:"wish-intro",children:"Pick the little bit of magic you want today. No overthinking — the universe is famously bad at reading long forms."}),w?e.jsxs("section",{className:"wish-reveal","aria-live":"polite",children:[e.jsx("div",{className:"wish-moon","aria-hidden":"true",children:"✦"}),e.jsx("p",{className:"wish-label",children:"Wish sent. Obviously."}),e.jsx("p",{className:"wish-message",children:(h=c.find(i=>i.id===s))==null?void 0:h.text}),g?e.jsxs("div",{className:"wish-bonus",children:[e.jsx("p",{className:"wish-label",children:"Your bonus wish ✨"}),e.jsxs("p",{children:["May you smile at this — and let me make you do it again soon. You’re my friend, I like you, and I’m very glad you’re in my orbit. ",e.jsx("span",{"aria-label":"winking face",children:"😉"})]})]}):e.jsxs(e.Fragment,{children:[e.jsxs("p",{className:"wish-star-prompt",children:["Now tap all 11 stars to charge the bonus wish.",e.jsx("br",{}),e.jsxs("span",{children:[r.length," of 11 collected"]})]}),e.jsx("div",{className:"wish-starboard","aria-label":`${r.length} of 11 stars collected`,children:p.map(i=>{const a=r.includes(i);return e.jsx("button",{type:"button",className:`wish-star${a?" collected":""}`,"aria-label":`Star ${i+1}${a?", collected":""}`,"aria-pressed":a,onClick:()=>x(i),children:"✦"},i)})})]}),e.jsx("button",{type:"button",className:"wish-reset",onClick:m,children:"Make another wish"})]}):e.jsxs(e.Fragment,{children:[e.jsx("div",{className:"wish-options",role:"group","aria-label":"Choose a wish",children:c.map(i=>e.jsxs("button",{type:"button",className:`wish-option${s===i.id?" selected":""}`,"aria-pressed":s===i.id,onClick:()=>n(i.id),children:[e.jsx("span",{className:"wish-icon","aria-hidden":"true",children:i.icon}),e.jsx("span",{children:i.label}),e.jsx("span",{className:"wish-check","aria-hidden":"true",children:s===i.id?"✓":""})]},i.id))}),e.jsxs("button",{type:"button",className:"wish-cta",disabled:!s,onClick:()=>l(!0),children:["Send my wish ",e.jsx("span",{"aria-hidden":"true",children:"↗"})]})]}),e.jsx("p",{className:"wish-foot",children:"Made with one wish, eleven stars, and a very obvious favourite person."})]})]})}const b=Array.from({length:42},(t,s)=>({left:`${(s*37+13)%100}%`,top:`${(s*61+9)%100}%`,"--delay":`${s%9*-.55}s`,"--size":`${2+s%3}px`})),u=`
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
`;export{v as default};
