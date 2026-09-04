import{r as i,j as e}from"./index-DtxrMGd4.js";function p({onBack:r}){const[t,n]=i.useState(0),o=i.useCallback(()=>n(a=>a+1),[]),s=a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),o())};return e.jsxs("div",{className:"om-root fixed inset-0 z-[300] overflow-auto",children:[e.jsx("style",{children:d}),e.jsx("div",{className:"om-stars absolute inset-0 pointer-events-none","aria-hidden":"true",children:m.map((a,l)=>e.jsx("span",{className:"om-star",style:{left:a.left,top:a.top,width:a.size,height:a.size,animationDelay:a.delay,animationDuration:a.dur,"--peak":a.op}},l))}),e.jsxs("button",{onClick:r,title:"Back",className:"fixed top-4 left-4 z-20 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-transform hover:scale-105",style:{color:"rgba(214,226,255,0.85)",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(174,196,255,0.2)",backdropFilter:"blur(8px)"},children:[e.jsx("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2.4,children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19l-7-7 7-7"})}),e.jsx("span",{className:"hidden sm:inline",children:"Back"})]}),e.jsxs("div",{className:"relative z-10 min-h-full flex flex-col items-center justify-center text-center px-6 py-20",children:[e.jsxs("div",{className:"om-moonwrap",role:"button",tabIndex:0,onClick:o,onKeyDown:s,"aria-label":"Replay the month",children:[e.jsx("span",{className:"om-glow","aria-hidden":"true"}),e.jsxs("span",{className:"om-moon","aria-hidden":"true",children:[e.jsx("span",{className:"om-craters"}),e.jsx("span",{className:"om-shade"})]})]},t),e.jsx("h1",{className:"om-line om-title font-heading font-semibold leading-[1.1] mt-12 mb-7",style:{fontSize:"clamp(1.9rem, 7vw, 3.5rem)",animationDelay:"1.5s"},children:"One month, Amrutha."}),e.jsx("p",{className:"om-line text-[clamp(1.02rem,3vw,1.32rem)] leading-relaxed",style:{color:"rgba(222,232,255,0.86)",animationDelay:"2.3s"},children:"A month ago today, I messaged you."}),e.jsx("p",{className:"om-line text-[clamp(1.02rem,3vw,1.32rem)] leading-relaxed mt-2",style:{color:"rgba(222,232,255,0.86)",animationDelay:"3.1s"},children:"I’m really glad I did."}),e.jsx("p",{className:"om-line om-ask font-heading italic mt-11",style:{fontSize:"clamp(1.35rem, 4.6vw, 2rem)",animationDelay:"4.3s"},children:"To many more?"}),e.jsx("p",{className:"om-line mt-16 text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.28em]",style:{color:"rgba(174,196,255,0.4)",animationDelay:"5.2s"},children:"13 July → 13 August 2026 · one whole moon"})]})]})}const m=Array.from({length:38},(r,t)=>{const n=Math.abs(Math.sin(t*12.9898)*43758.5453)%1,o=Math.abs(Math.sin(t*78.233)*12345.6789)%1;return{left:(n*98+1).toFixed(2)+"%",top:(o*88+2).toFixed(2)+"%",size:(1+t%3*.7).toFixed(1)+"px",delay:(t*.83%7).toFixed(2)+"s",dur:(4.5+t%5*1.4).toFixed(1)+"s",op:(.22+t%4*.16).toFixed(2)}}),d=`
  .om-root {
    background:
      radial-gradient(70% 50% at 50% 8%, rgba(96,132,220,0.20) 0%, transparent 62%),
      radial-gradient(60% 46% at 12% 92%, rgba(88,74,168,0.20) 0%, transparent 64%),
      linear-gradient(170deg, #080c1c 0%, #0b1024 48%, #0a1430 100%);
  }

  .om-star {
    position: absolute; border-radius: 50%; background: #dce8ff; opacity: 0;
    animation-name: omTwinkle; animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
  }
  @keyframes omTwinkle {
    0%, 100% { opacity: calc(var(--peak) * 0.28); }
    50%      { opacity: var(--peak); }
  }

  /* The moon. A dark disc slides off to the left, so the lit part grows
     from a sliver to the full face — the terminator is the shade disc's
     own curved edge, which is what gives a real crescent its shape. */
  .om-moonwrap {
    position: relative; width: 122px; height: 122px;
    cursor: pointer; outline: none; flex: none;
  }
  @media (min-width: 640px) { .om-moonwrap { width: 150px; height: 150px; } }
  .om-moonwrap:focus-visible { box-shadow: 0 0 0 2px rgba(174,196,255,0.6); border-radius: 50%; }

  .om-glow {
    position: absolute; inset: -70%; border-radius: 50%; pointer-events: none;
    background: radial-gradient(circle,
      rgba(150,190,255,0.30) 0%, rgba(132,166,255,0.11) 38%, transparent 68%);
    animation: omGlow 5.4s ease-in-out both;
  }
  @keyframes omGlow {
    from { opacity: 0; transform: scale(0.55); }
    to   { opacity: 1; transform: scale(1); }
  }

  .om-moon {
    position: absolute; inset: 0; border-radius: 50%; overflow: hidden;
    background: radial-gradient(circle at 36% 30%, #fdf7e9 0%, #efe4cd 54%, #d6c8ae 100%);
    box-shadow: 0 0 46px rgba(158,192,255,0.34);
  }
  .om-craters {
    position: absolute; inset: 0; border-radius: 50%; opacity: 0.45;
    background:
      radial-gradient(circle at 63% 29%, rgba(146,131,102,0.55) 0 7%, transparent 8%),
      radial-gradient(circle at 41% 63%, rgba(146,131,102,0.45) 0 10%, transparent 11%),
      radial-gradient(circle at 73% 67%, rgba(146,131,102,0.4) 0 6%, transparent 7%),
      radial-gradient(circle at 29% 39%, rgba(146,131,102,0.32) 0 5%, transparent 6%);
  }
  .om-shade {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    border-radius: 50%; background: #0d1329;
    /* 5.4s is deliberate: the moon reaches full at the exact moment the
       last line has finished fading in. */
    animation: omWax 5.4s ease-in-out both;
  }
  @keyframes omWax {
    from { transform: translateX(3%); }
    to   { transform: translateX(-103%); }
  }

  .om-line { opacity: 0; animation: omRise 1.1s cubic-bezier(.22,.61,.36,1) forwards; }
  @keyframes omRise {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: none; }
  }

  .om-title {
    background: linear-gradient(102deg, #ffffff 0%, #dce8ff 34%, #ffffff 52%, #cfe0ff 74%, #ffffff 100%);
    background-size: 220% auto;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    text-shadow: 0 10px 44px rgba(140,178,255,0.16);
  }
  .om-ask { color: #bcd2ff; text-shadow: 0 0 26px rgba(150,190,255,0.35); }

  @media (prefers-reduced-motion: reduce) {
    .om-star { animation: none; opacity: var(--peak); }
    .om-glow { animation: none; opacity: 1; transform: none; }
    /* Skip the cycle and just show a full moon. */
    .om-shade { animation: none; transform: translateX(-103%); }
    .om-line { animation: none; opacity: 1; transform: none; }
  }
`;export{p as default};
