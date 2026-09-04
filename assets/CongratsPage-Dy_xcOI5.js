import{r as o,j as e}from"./index-DHiOMeUd.js";const s="#413634",i="#6b5b57",p="#B4761C",b="#5C7FA8",L="#8A5A12",B="#3F5F86",l=["#E8B84B","#D9A03C","#C9821F","#EBCE86","#F2DFAE"],v=["#8FAECD","#A9C4DC","#C3D5E6","#B9C8DE"],z=["You did the thing.","That is a pass.","Well done, genuinely."],D=["You showed up.","You entered the room.","You put your name down."],j=c=>c[Math.random()*c.length|0];function I({onBack:c}){const[a,g]=o.useState(null),[x,h]=o.useState(""),u=o.useRef(null),n=o.useCallback((d,r,E=50,T=30)=>{const f=u.current;if(f&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches)for(let y=0;y<d;y++){const t=document.createElement("span");t.className="cg-piece",t.setAttribute("aria-hidden","true");const w=Math.random();if(w>.86)t.textContent="✦",t.style.color=r[Math.random()*r.length|0],t.style.fontSize=9+Math.random()*11+"px";else if(w>.72){t.classList.add("cg-round"),t.style.background=r[Math.random()*r.length|0];const k=4+Math.random()*5;t.style.width=k+"px",t.style.height=k+"px"}else t.classList.add("cg-paper"),t.style.background=r[Math.random()*r.length|0],t.style.width=5+Math.random()*5+"px",t.style.height=8+Math.random()*7+"px";t.style.left=E+(Math.random()*18-9)+"vw",t.style.top=T+"vh",t.style.setProperty("--dx",(Math.random()*2-1)*34+"vw"),t.style.setProperty("--dy",-(24+Math.random()*44)+"vh"),t.style.setProperty("--rot",Math.random()*900-450+"deg"),t.style.animationDelay=Math.random()*.16+"s",t.style.animationDuration=1.8+Math.random()*1.4+"s",f.appendChild(t),t.addEventListener("animationend",()=>t.remove(),{once:!0})}},[]),N=o.useCallback(()=>{g("pass"),h(j(z)),n(80,l,50,28),setTimeout(()=>n(45,l,22,20),200),setTimeout(()=>n(45,l,78,20),380)},[n]),C=o.useCallback(()=>{g("tried"),h(j(D)),n(26,v,50,32)},[n]),m=()=>{g(null),h("")};o.useEffect(()=>{const d=r=>{r.key==="Escape"&&a&&m()};return window.addEventListener("keydown",d),()=>window.removeEventListener("keydown",d)},[a]);const M=a==="tried"?b:p;return e.jsxs("div",{className:"cg-root min-h-screen relative overflow-hidden","data-mood":a||"ask",children:[e.jsx("style",{children:A}),e.jsx("div",{ref:u,className:"fixed inset-0 z-30 pointer-events-none","aria-hidden":"true"}),e.jsxs("div",{className:"relative z-10 mx-auto max-w-2xl px-5 sm:px-6 py-7",children:[e.jsxs("button",{onClick:c,className:"cg-back inline-flex items-center gap-2 text-[13px]",children:[e.jsx("svg",{width:"15",height:"15",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M19 12H5M12 19l-7-7 7-7"})}),"Back"]}),e.jsxs("div",{className:"min-h-[76vh] flex flex-col justify-center",children:[e.jsxs("div",{className:"cg-card",children:[!a&&e.jsxs("div",{className:"cg-in text-center",children:[e.jsx("span",{className:"cg-eyebrow",children:"Before anything else"}),e.jsx("h1",{className:"cg-h1 mt-4",children:"How did it go?"}),e.jsx("p",{className:"cg-sub mt-4",children:"Either answer is fine. Pick one."}),e.jsxs("div",{className:"mt-9 flex flex-col sm:flex-row gap-3 justify-center",children:[e.jsx("button",{onClick:N,className:"cg-btn cg-btn-gold",children:"I passed"}),e.jsx("button",{onClick:C,className:"cg-btn cg-btn-ghost",children:"I didn’t"})]})]}),a==="pass"&&e.jsxs("div",{className:"cg-in text-center",children:[e.jsx("div",{className:"cg-medal",style:{"--c":p},children:e.jsx("svg",{width:"30",height:"30",viewBox:"0 0 24 24",fill:"none",stroke:p,strokeWidth:"2.6",strokeLinecap:"round",strokeLinejoin:"round",children:e.jsx("path",{d:"M20 6 9 17l-5-5"})})}),e.jsx("span",{className:"cg-eyebrow mt-6 block",style:{color:L},children:x}),e.jsx("h1",{className:"cg-h1 cg-h1-big mt-3",children:"Congratulations"}),e.jsx("p",{className:"cg-body mt-6",children:"Nobody sees the part that got you here — the evenings that went nowhere, the things you put off to make room for it. The result is one line. The work behind it was months."}),e.jsx("p",{className:"cg-body mt-3.5",children:"Take the day. It’s yours."}),e.jsxs("div",{className:"mt-9 flex flex-wrap gap-3 justify-center",children:[e.jsx("button",{onClick:()=>n(55,l,50,34),className:"cg-btn cg-btn-gold",children:"More of that"}),e.jsx("button",{onClick:m,className:"cg-btn cg-btn-quiet",children:"Back to the question"})]})]}),a==="tried"&&e.jsxs("div",{className:"cg-in text-center",children:[e.jsx("div",{className:"cg-medal",style:{"--c":b},children:e.jsxs("svg",{width:"30",height:"30",viewBox:"0 0 24 24",fill:"none",stroke:b,strokeWidth:"2.2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M12 20.5V9.5M12 9.5l-4.6 3.8M12 9.5l4.6 3.8"}),e.jsx("circle",{cx:"12",cy:"5",r:"2.2"})]})}),e.jsx("span",{className:"cg-eyebrow mt-6 block",style:{color:B},children:x}),e.jsx("h1",{className:"cg-h1 cg-h1-big mt-3",children:"Congratulations anyway"}),e.jsx("p",{className:"cg-body mt-6",children:"Most people never get this far. They talk about it, plan to start next month, and never put their name down. You did — and you found out exactly where you stand, which is more than anyone who stayed home knows about themselves."}),e.jsxs("p",{className:"cg-body mt-3.5",children:["This one goes in the column marked ",e.jsx("em",{className:"cg-em",children:"not yet"}),". You already know most of it, and you know precisely which parts caught you out. That’s a much shorter run at it the second time."]}),e.jsxs("div",{className:"mt-9 flex flex-wrap gap-3 justify-center",children:[e.jsx("button",{onClick:()=>n(24,v,50,34),className:"cg-btn cg-btn-blue",children:"Alright then"}),e.jsx("button",{onClick:m,className:"cg-btn cg-btn-quiet",children:"Back to the question"})]})]})]}),a&&e.jsx("p",{className:"cg-sig cg-in",style:{"--c":M},children:"— Kranthi"})]})]})]})}const A=`
  /* Warm paper rather than a screen. The colour is pushed to the edges so
     the middle, where every line of text sits, stays bright and readable.
     The washes shift with the answer — gold when it went well, a cooler
     blue when it didn't — which does more for the mood than any amount of
     copy would. */
  .cg-root {
    color: ${s};
    -webkit-font-smoothing: antialiased;
    transition: background 1.1s cubic-bezier(0.22, 0.61, 0.36, 1);
    background:
      radial-gradient(46% 30% at 50% -4%,  rgba(246,213,160,0.50) 0%, transparent 70%),
      radial-gradient(40% 30% at -8% 20%,  rgba(252,214,180,0.42) 0%, transparent 72%),
      radial-gradient(42% 32% at 108% 42%, rgba(238,200,178,0.34) 0%, transparent 72%),
      radial-gradient(46% 30% at -6% 88%,  rgba(240,222,190,0.34) 0%, transparent 72%),
      linear-gradient(176deg, #fffdfa 0%, #fdf8f1 54%, #fbf3ea 100%);
  }
  .cg-root[data-mood='pass'] {
    background:
      radial-gradient(52% 34% at 50% -6%,  rgba(245,199,106,0.60) 0%, transparent 70%),
      radial-gradient(40% 30% at -8% 20%,  rgba(250,206,150,0.48) 0%, transparent 72%),
      radial-gradient(42% 32% at 108% 40%, rgba(243,190,140,0.40) 0%, transparent 72%),
      radial-gradient(46% 30% at -6% 88%,  rgba(244,218,168,0.40) 0%, transparent 72%),
      linear-gradient(176deg, #fffdf7 0%, #fdf6e9 54%, #faf0e0 100%);
  }
  .cg-root[data-mood='tried'] {
    background:
      radial-gradient(50% 32% at 50% -5%,  rgba(178,203,228,0.52) 0%, transparent 70%),
      radial-gradient(40% 30% at -8% 20%,  rgba(198,214,234,0.42) 0%, transparent 72%),
      radial-gradient(42% 32% at 108% 42%, rgba(206,200,232,0.34) 0%, transparent 72%),
      radial-gradient(46% 30% at -6% 88%,  rgba(196,218,224,0.34) 0%, transparent 72%),
      linear-gradient(176deg, #fdfdff 0%, #f7f9fd 54%, #f2f6fb 100%);
  }

  .cg-back {
    color: ${i};
    transition: color .2s ease;
  }
  .cg-back:hover { color: ${s}; }

  /* The card is the object being sent, so it gets real depth — a long
     soft shadow rather than a border, which is what separates "a card"
     from "a div with a line round it". */
  .cg-card {
    background: rgba(255,255,255,0.72);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.9);
    border-radius: 1.5rem;
    padding: 3rem 1.75rem;
    box-shadow:
      0 1px 2px rgba(120,90,70,0.05),
      0 12px 28px -8px rgba(120,90,70,0.13),
      0 40px 80px -32px rgba(120,90,70,0.22);
  }
  @media (min-width: 640px) {
    .cg-card { padding: 3.75rem 3rem; }
  }

  .cg-eyebrow {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10.5px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: ${i};
  }

  .cg-h1 {
    font-family: var(--font-heading, Georgia, 'Times New Roman', serif);
    font-weight: 600;
    letter-spacing: -0.018em;
    line-height: 1.04;
    font-size: clamp(2.1rem, 7vw, 3rem);
    color: #241d1c;
  }
  .cg-h1-big { font-size: clamp(2.3rem, 8.4vw, 3.6rem); }

  .cg-sub { font-size: 15px; color: ${i}; }

  .cg-body {
    font-size: 15.5px;
    line-height: 1.72;
    color: ${s};
    max-width: 30rem;
    margin-left: auto;
    margin-right: auto;
  }
  .cg-em { font-style: italic; color: #241d1c; }

  .cg-medal {
    width: 4.25rem;
    height: 4.25rem;
    margin: 0 auto;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: color-mix(in oklab, var(--c) 12%, #fff);
    box-shadow:
      inset 0 0 0 1.5px color-mix(in oklab, var(--c) 34%, transparent),
      0 8px 22px -8px color-mix(in oklab, var(--c) 50%, transparent);
    animation: cgPop .62s cubic-bezier(0.2, 1.3, 0.4, 1) both;
  }
  @keyframes cgPop {
    from { transform: scale(0.6); opacity: 0; }
    to   { transform: scale(1); opacity: 1; }
  }

  .cg-btn {
    padding: 0.8rem 1.6rem;
    border-radius: 999px;
    font-size: 14.5px;
    font-weight: 600;
    transition: transform .18s cubic-bezier(0.2, 1, 0.3, 1), box-shadow .22s ease, background .22s ease;
  }
  .cg-btn:hover { transform: translateY(-1.5px); }
  .cg-btn:active { transform: translateY(0); }

  .cg-btn-gold {
    background: linear-gradient(168deg, #F0C154 0%, #DDA33A 100%);
    color: #3d2a08;
    box-shadow: 0 2px 4px rgba(160,120,40,0.18), 0 10px 22px -8px rgba(160,120,40,0.5);
  }
  .cg-btn-gold:hover { box-shadow: 0 3px 6px rgba(160,120,40,0.2), 0 16px 30px -10px rgba(160,120,40,0.58); }

  .cg-btn-blue {
    background: linear-gradient(168deg, #96B6D6 0%, #7C9CC0 100%);
    color: #142334;
    box-shadow: 0 2px 4px rgba(70,100,140,0.16), 0 10px 22px -8px rgba(70,100,140,0.44);
  }

  .cg-btn-ghost {
    background: rgba(255,255,255,0.7);
    color: ${s};
    box-shadow: inset 0 0 0 1px rgba(120,90,70,0.2), 0 4px 12px -6px rgba(120,90,70,0.2);
  }
  .cg-btn-ghost:hover { background: #fff; }

  .cg-btn-quiet {
    background: transparent;
    color: ${i};
    font-weight: 500;
    box-shadow: inset 0 0 0 1px rgba(120,90,70,0.16);
  }
  .cg-btn-quiet:hover { color: ${s}; background: rgba(255,255,255,0.55); }

  .cg-sig {
    margin: 1.75rem auto 0;
    text-align: center;
    font-family: var(--font-heading, Georgia, serif);
    font-style: italic;
    font-size: 14px;
    color: color-mix(in oklab, var(--c) 62%, ${i});
  }

  /* ---- confetti ---- */
  .cg-piece {
    position: absolute;
    will-change: transform, opacity;
    animation-name: cgFall;
    animation-timing-function: cubic-bezier(0.16, 0.9, 0.36, 1);
    animation-fill-mode: forwards;
    pointer-events: none;
  }
  .cg-paper { border-radius: 1px; }
  .cg-round { border-radius: 999px; }

  @keyframes cgFall {
    0%   { transform: translate3d(0,0,0) rotate(0deg); opacity: 1; }
    100% { transform: translate3d(var(--dx,0), var(--dy,-40vh), 0) rotate(var(--rot,360deg)); opacity: 0; }
  }

  .cg-in { animation: cgIn .55s cubic-bezier(0.16, 1, 0.3, 1) both; }
  @keyframes cgIn {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .cg-piece { display: none; }
    .cg-in, .cg-medal { animation: none; }
    .cg-root { transition: none; }
    .cg-btn:hover { transform: none; }
  }
`;export{I as default};
