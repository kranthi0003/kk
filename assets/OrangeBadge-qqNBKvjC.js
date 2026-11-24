import{r as d,j as e}from"./index-C_eicYNV.js";const h="Amrutha",M=[2021,10,15],T=["2021-11-29","2022-11-28","2023-11-27","2024-12-02","2025-12-01","2026-11-30"],E=["The escalation that lands at 11 pm and needs an answer by 11:05.","The Sev-2 that wasn’t yours, right up until it was.","The doc you rewrote four times, then watched a whole room read in silence.","Customers who need you now, in whatever time zone ‘now’ happens to be.","Sixteen Leadership Principles, and a reason to need every one of them before lunch."],k=["Nice try. In five years, you never once took this door.","Still no. You’ve walked straight past it {days} times.","It’s been locked from your side since 2021."],Y=[["Year one","Nov 2021 – Nov 2022","A blue badge, a new laptop and four hundred acronyms to learn by Friday."],["Year two","Nov 2022 – Nov 2023","A guy in Hyderabad started sending you ‘work questions’. (Mostly work questions.)"],["Year three","Nov 2023 – Nov 2024","You stopped asking ‘Can I?’ and started saying ‘I’ve got it.’"],["Year four","Nov 2024 – Nov 2025","People started asking for you by name."],["Year five","Nov 2025 – Nov 2026","A Tech Summit stage, a talk with your name on it, and an orange badge."]],y=[["Customer Obsession","Your customers get the version of you that never logs off. (Please log off sometimes.)"],["Ownership","‘That’s not my team’ has never once come out of your mouth."],["Dive Deep","You don’t stop at the dashboard. You read the logs."],["Have Backbone; Disagree and Commit","You’ll say the hard thing in the room, then make it work outside it."],["Learn and Be Curious","Five years in, and still the first to try the new thing."],["Deliver Results","Whatever the week threw at you, you delivered anyway."]],D=Array.from({length:36},(o,a)=>{const t=a/36*Math.PI*2+a%3*.21,r=120+a*47%100;return{dx:Math.round(Math.cos(t)*r),dy:Math.round(Math.sin(t)*r*.8-50+a*29%50),rot:a*83%360-180,w:6+a%3*3,h:9+a%4*3,c:["#ff9900","#ffb547","#ffd59a","#f08300","#ffffff","#2b8cf0"][a%6],delay:a%6*22}}),A=864e5,j=(o,a,t)=>Math.round(Date.UTC(o,a,t)/A),O=o=>{const[a,t,r]=o.split("-").map(Number);return j(a,t-1,r)},z=()=>{const o=new Date;return j(o.getFullYear(),o.getMonth(),o.getDate())},v=o=>o.toLocaleString("en-GB"),B=o=>new Date(o*A).toLocaleDateString("en-GB",{timeZone:"UTC",day:"numeric",month:"long"}),C=["zero","one","two","three","four","five","six","seven","eight","nine","ten"],N=()=>{var o;return typeof window<"u"&&!!((o=window.matchMedia)!=null&&o.call(window,"(prefers-reduced-motion: reduce)").matches)};function $(){const[o,a]=d.useState(z);return d.useEffect(()=>{const t=()=>a(z()),r=setInterval(t,6e4);return document.addEventListener("visibilitychange",t),()=>{clearInterval(r),document.removeEventListener("visibilitychange",t)}},[]),d.useMemo(()=>{const t=j(...M),r=Math.max(0,o-t),i=t+(8-(t+4)%7)%7,l=o<i?0:Math.floor((o-i)/7)+1,n=T.map(O),s=n.filter(c=>c>=t&&c<=o).length,p=n.find(c=>c>o);return{today:o,days:r,dayOf:r+1,mondays:l,reinvents:s,next:p}},[o])}function L(o){const a=window.AudioContext||window.webkitAudioContext;if(a)try{const t=new a,r=t.currentTime+o;for(const[i,l]of[[0,1320],[.12,1760]]){const n=t.createOscillator(),s=t.createGain();n.type="sine",n.frequency.value=l,s.gain.setValueAtTime(1e-4,r+i),s.gain.exponentialRampToValueAtTime(.05,r+i+.012),s.gain.exponentialRampToValueAtTime(1e-4,r+i+.09),n.connect(s),s.connect(t.destination),n.start(r+i),n.stop(r+i+.1)}setTimeout(()=>{try{t.close()}catch{}},(o+.6)*1e3)}catch{}}function G(o){const[a,t]=d.useState(!1);return d.useEffect(()=>{const r=o.current;if(!r||a)return;if(!("IntersectionObserver"in window)){t(!0);return}const i=new IntersectionObserver(l=>{l.some(n=>n.isIntersecting)&&(t(!0),i.disconnect())},{rootMargin:"0px 0px -12% 0px"});return i.observe(r),()=>i.disconnect()},[o,a]),a}function F(o,a){const[t,r]=d.useState(0);return d.useEffect(()=>{if(!a)return;if(N()){r(o);return}let i,l;const n=s=>{l===void 0&&(l=s);const p=Math.min(1,(s-l)/1200);r(Math.round(o*(1-(1-p)**3))),p<1&&(i=requestAnimationFrame(n))};return i=requestAnimationFrame(n),()=>cancelAnimationFrame(i)},[o,a]),t}function R({orange:o}){return e.jsx("div",{className:"ob-badge",role:"img","aria-label":o?`${h}’s orange five-year Amazon badge`:`${h}’s blue Amazon badge from Day 1, 15 November 2021`,children:e.jsxs("div",{className:"ob-card",children:[e.jsxs("div",{className:"ob-face is-blue","aria-hidden":"true",children:[e.jsx("span",{className:"ob-slot"}),e.jsxs("div",{className:"ob-inner",children:[e.jsx("span",{className:"ob-org",children:"AMAZONIAN"}),e.jsx("span",{className:"ob-photo",children:"A"}),e.jsx("span",{className:"ob-name",children:h}),e.jsx("span",{className:"ob-meta",children:"Day 1 · 15 Nov 2021"}),e.jsx("span",{className:"ob-code"}),e.jsx("span",{className:"ob-tag",children:"BLUE BADGE"})]})]}),e.jsxs("div",{className:"ob-face is-orange","aria-hidden":"true",children:[e.jsx("span",{className:"ob-slot"}),e.jsxs("div",{className:"ob-inner",children:[e.jsx("span",{className:"ob-org",children:"AMAZONIAN"}),e.jsx("span",{className:"ob-photo",children:"A"}),e.jsx("span",{className:"ob-name",children:h}),e.jsx("span",{className:"ob-ribbon",children:"5 YEARS"}),e.jsx("span",{className:"ob-meta",children:"Amaversary · 15 Nov 2026"}),e.jsx("span",{className:"ob-code"}),e.jsx("span",{className:"ob-tag",children:"ORANGE BADGE"})]})]})]})})}function J(){return e.jsx("div",{className:"ob-confetti","aria-hidden":"true",children:D.map((o,a)=>e.jsx("i",{style:{"--dx":`${o.dx}px`,"--dy":`${o.dy}px`,"--rot":`${o.rot}deg`,width:o.w,height:o.h,background:o.c,animationDelay:`${o.delay}ms`}},a))})}function w({id:o,eyebrow:a,title:t,lead:r}){return e.jsxs("div",{className:"ob-head","data-reveal":!0,children:[e.jsx("p",{className:"ob-eyebrow",children:a}),e.jsx("h2",{id:o,children:t}),r&&e.jsx("p",{className:"ob-sub",children:r})]})}function P(){return e.jsxs("section",{className:"ob-sec ob-struggle",id:"ob-struggle","aria-labelledby":"ob-struggle-title",children:[e.jsx("p",{className:"ob-eyebrow","data-reveal":!0,children:"Let’s be honest"}),e.jsx("h2",{id:"ob-struggle-title","data-reveal":!0,children:"We all know the struggle."}),e.jsx("ul",{className:"ob-montage",children:E.map((o,a)=>e.jsx("li",{"data-reveal":!0,style:{"--d":a%2},children:o},o))}),e.jsx("p",{className:"ob-big","data-reveal":!0,children:"It’s difficult. Nobody there pretends it isn’t."}),e.jsx("p",{className:"ob-hard","data-reveal":!0,children:"Yet you chose the hard."}),e.jsx("p",{className:"ob-small","data-reveal":!0,children:"Not once. Every day, for five years."})]})}function H({days:o}){const[a,t]=d.useState(!1),[r,i]=d.useState(-1),l=()=>i(n=>n+1);return e.jsxs("section",{className:"ob-sec","aria-labelledby":"ob-doors-title",children:[e.jsx(w,{id:"ob-doors-title",eyebrow:"Every morning",title:"Two doors.",lead:"One of them is easy. Open the one you always open."}),e.jsxs("div",{className:"ob-doors","data-reveal":!0,children:[e.jsx("button",{type:"button",className:`ob-door is-easy${r>=0?` is-nope-${r%2}`:""}`,onClick:l,"aria-describedby":"ob-door-note",children:e.jsxs("span",{className:"ob-leaf",children:[e.jsx("span",{className:"ob-dtitle",children:"The easy way"}),e.jsx("span",{className:"ob-dnote",children:"Coast a little. Nobody would blame you."}),e.jsx("span",{className:"ob-knob","aria-hidden":"true"})]})}),e.jsxs("button",{type:"button",className:`ob-door is-hard${a?" is-open":""}`,onClick:()=>t(!0),"aria-expanded":a,"aria-controls":"ob-choice",children:[e.jsx("span",{className:"ob-light","aria-hidden":"true",children:"Day 1"}),e.jsxs("span",{className:"ob-leaf",children:[e.jsx("span",{className:"ob-dtitle",children:"The hard way"}),e.jsx("span",{className:"ob-dnote",children:"Own it. Dive deep. Deliver."}),e.jsx("span",{className:"ob-knob","aria-hidden":"true"})]})]})]}),e.jsx("p",{id:"ob-door-note",className:"ob-nope","aria-live":"polite",children:r>=0?k[r%k.length].replace("{days}",v(o)):""}),e.jsx("div",{id:"ob-choice",className:"ob-choice","aria-live":"polite",children:a&&e.jsxs(e.Fragment,{children:[e.jsx("p",{className:"ob-choice-big",children:"You chose the hard."}),e.jsxs("p",{children:["Same door, every morning, for ",v(o)," days."]}),e.jsx("p",{className:"ob-choice-small",children:"Amazon would call it a two-way door: you could have walked back out any day. You never did."})]})})]})}function X({n:o,label:a,line:t,run:r,i}){const l=F(o,r);return e.jsxs("li",{className:"ob-stat","data-reveal":!0,style:{"--d":i},children:[e.jsx("b",{"aria-hidden":"true",children:v(l)}),e.jsx("span",{className:"ob-sr",children:v(o)}),e.jsx("span",{className:"ob-stat-label",children:a}),e.jsx("small",{children:t})]})}function q({counts:o}){const a=d.useRef(null),t=G(a),i=o.next!==void 0&&o.next-o.today<=45?` Number ${C[o.reinvents+1]||o.reinvents+1} starts ${B(o.next)}.`:"",l=[[o.days,"days","Every one of them Day 1."],[o.mondays,"Mondays","Day 1 was one of them. Of course it was."],[o.reinvents,o.reinvents===1?"re:Invent":"re:Invents",`The week AWS launches everything and every customer has a question.${i}`],[16,"Leadership Principles","Lived, not memorised."],[1,"summit stage","And you were on it."],[1,"orange badge","Earned. Not given."]];return e.jsxs("section",{className:"ob-sec","aria-labelledby":"ob-numbers-title",children:[e.jsx(w,{id:"ob-numbers-title",eyebrow:"Five years, counted",title:"By the numbers."}),e.jsx("ul",{className:"ob-stats",ref:a,children:l.map(([n,s,p],c)=>e.jsx(X,{n,label:s,line:p,run:t,i:c},s))})]})}function V(){return e.jsxs("section",{className:"ob-sec","aria-labelledby":"ob-years-title",children:[e.jsx(w,{id:"ob-years-title",eyebrow:"Five years, five lines",title:"How it went."}),e.jsx("ol",{className:"ob-years",children:Y.map(([o,a,t],r)=>e.jsxs("li",{className:"ob-year","data-reveal":!0,style:{"--dot":`color-mix(in oklab, #2b8cf0 ${100-r*25}%, #ff9900)`},children:[e.jsxs("p",{className:"ob-year-k",children:[o," ",e.jsx("span",{children:a})]}),e.jsx("p",{className:"ob-year-line",children:t})]},o))})]})}function W(){const[o,a]=d.useState(()=>new Set),[t,r]=d.useState(""),i=n=>{const s=new Set(o);s.has(n)?s.delete(n):(s.add(n),r(`${y[n][0]}: ${y[n][1]}`)),a(s)},l=o.size===y.length;return e.jsxs("section",{className:"ob-sec","aria-labelledby":"ob-lps-title",children:[e.jsx(w,{id:"ob-lps-title",eyebrow:"The principles",title:"The way you actually live them.",lead:"Tap a badge to flip it."}),e.jsx("ul",{className:"ob-lps",children:y.map(([n,s],p)=>{const c=o.has(p);return e.jsx("li",{"data-reveal":!0,style:{"--d":p%3},children:e.jsx("button",{type:"button",className:`ob-lp${c?" is-on":""}`,"aria-pressed":c,onClick:()=>i(p),children:e.jsxs("span",{className:"ob-lp-in",children:[e.jsxs("span",{className:"ob-lp-face ob-lp-front","aria-hidden":c,children:[e.jsx("span",{className:"ob-lp-tag",children:"Leadership Principle"}),e.jsx("span",{className:"ob-lp-name",children:n}),e.jsx("span",{className:"ob-lp-hint",children:"Tap to flip"})]}),e.jsxs("span",{className:"ob-lp-face ob-lp-back","aria-hidden":!c,children:[e.jsx("span",{className:"ob-lp-line",children:s}),e.jsx("span",{className:"ob-lp-small",children:n})]})]})})},n)})}),e.jsx("p",{className:`ob-lp-status${l?" is-done":""}`,"aria-live":"polite",children:l?"Six down, ten to go. You’ve got those covered too.":`${o.size} of ${y.length} flipped`}),e.jsx("p",{className:"ob-sr","aria-live":"polite",children:t})]})}function U({dayOf:o}){return e.jsxs("section",{className:"ob-sec","aria-labelledby":"ob-letter-title",children:[e.jsx(w,{id:"ob-letter-title",eyebrow:"One last thing",title:"From me."}),e.jsxs("article",{className:"ob-letter","data-reveal":!0,children:[e.jsxs("p",{className:"ob-to",children:[h,","]}),e.jsx("p",{children:"I wore the blue badge too, so I won’t pretend any of this was easy. I know the late escalations, the weeks when on-call and life are the same thing, and the docs that get rewritten long after everyone else has logged off."}),e.jsx("p",{children:"I got there eight months before you, and I left with my badge still blue. You stayed. You learnt the place, you owned your corner of it, and you got better every single year, without losing the kindness that makes people want to work with you."}),e.jsx("p",{children:"That’s what the orange badge really means. Not five years served. Five years chosen."}),e.jsx("p",{children:"Somewhere inside a company of more than a million people, I found you there. So I’ll always owe the place one."}),e.jsx("p",{children:"I’m so proud of you. Happy Amaversary."}),e.jsx("p",{className:"ob-sign",children:"Kiran"})]}),e.jsxs("p",{className:"ob-dayline","data-reveal":!0,children:["Today is ",e.jsxs("b",{children:["Day ",v(o)]}),". At Amazon, it’s still Day 1."]})]})}function _({onBack:o}){const a=$(),[t,r]=d.useState("blue"),[i,l]=d.useState(!1),[n,s]=d.useState(0),p=d.useRef([]),c=d.useRef(null);d.useEffect(()=>{const b=document.title;document.title=`Happy Amaversary, ${h}`;const m=p.current;return()=>{document.title=b,m.forEach(clearTimeout)}},[]),d.useEffect(()=>{if(!i)return;const b=[...c.current.querySelectorAll("[data-reveal]:not(.is-in)")];if(!("IntersectionObserver"in window)||N()){b.forEach(g=>g.classList.add("is-in"));return}const m=new IntersectionObserver(g=>{for(const x of g)x.isIntersecting&&(x.target.classList.add("is-in"),m.unobserve(x.target))},{rootMargin:"0px 0px -10% 0px"});return b.forEach(g=>m.observe(g)),()=>m.disconnect()},[i]);const S=d.useCallback(()=>{if(t==="tap")return;p.current.forEach(clearTimeout),p.current=[];const b=(x,u)=>{p.current.push(setTimeout(x,u))},m=N(),g=x=>{if(L((x+(m?0:380))/1e3),m){b(()=>{r("orange"),l(!0)},x);return}b(()=>r("tap"),x),b(()=>{var u;try{(u=navigator.vibrate)==null||u.call(navigator,30)}catch{}},x+380),b(()=>{r("orange"),s(u=>u+1)},x+640),b(()=>l(!0),x+1400)};t==="orange"?(r("blue"),g(m?500:800)):g(0)},[t]),I=()=>{var b;(b=document.getElementById("ob-struggle"))==null||b.scrollIntoView({behavior:N()?"instant":"smooth",block:"start"})},f=t==="orange";return e.jsxs("main",{ref:c,className:`ob-root is-${t}`,children:[e.jsx("style",{children:Z}),e.jsxs("button",{type:"button",className:"ob-back",onClick:o,children:[e.jsx("span",{"aria-hidden":"true",children:"←"})," Back"]}),e.jsxs("header",{className:"ob-hero",children:[e.jsxs("div",{className:"ob-stage",children:[e.jsx("div",{className:"ob-swing",children:e.jsxs("div",{className:"ob-dip",children:[e.jsx("div",{className:"ob-strap","aria-hidden":"true",children:e.jsx("span",{children:"DAY 1 · ".repeat(10)})}),e.jsx("div",{className:"ob-clip","aria-hidden":"true"}),e.jsx(R,{orange:f})]})}),n>0&&e.jsx(J,{},n),e.jsxs("button",{type:"button",className:"ob-reader",onClick:S,"aria-disabled":t==="tap","aria-describedby":"ob-hero-copy",children:[e.jsx("span",{className:"ob-pad","aria-hidden":"true",children:e.jsxs("svg",{viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",children:[e.jsx("path",{d:"M8.5 8.5a5 5 0 0 1 0 7"}),e.jsx("path",{d:"M12 6a8.5 8.5 0 0 1 0 12"}),e.jsx("path",{d:"M15.5 3.5a12 12 0 0 1 0 17"})]})}),e.jsxs("span",{className:"ob-rtext",children:[e.jsx("b",{children:f?"Access granted":t==="tap"?"Reading…":"Tap to badge in"}),e.jsx("small",{children:f?"Tap to badge in again":"Hold your badge to the reader"})]}),e.jsx("span",{className:"ob-led","aria-hidden":"true"})]})]}),e.jsxs("div",{className:"ob-copy",id:"ob-hero-copy","aria-live":"polite",children:[e.jsx("p",{className:"ob-eyebrow",children:f?"Happy Amaversary · 15 November 2026":"15 November 2021"}),e.jsx("h1",{className:"ob-title",children:f?e.jsxs(e.Fragment,{children:["Blue to ",e.jsx("em",{children:"orange."})]}):"Five years ago, they handed you a blue badge."}),e.jsx("p",{className:"ob-lead",children:f?`Five years at Amazon, ${h}. Not one of them easy. Every one of them yours.`:"Tap it on the reader. Something’s changed since then."}),i&&e.jsxs("button",{type:"button",className:"ob-cue",onClick:I,children:["Keep going ",e.jsx("span",{"aria-hidden":"true",children:"↓"})]})]})]}),i&&e.jsxs("div",{className:"ob-main",children:[e.jsx(P,{}),e.jsx(H,{days:a.days}),e.jsx(q,{counts:a}),e.jsx(V,{}),e.jsx(W,{}),e.jsx(U,{dayOf:a.dayOf}),e.jsx("footer",{className:"ob-foot",children:"kranthikiran.com · unlisted"})]})]})}const Z=`
.ob-root {
  --ob-ink: #eef2f6; --ob-muted: #a9b5c2; --ob-line: rgba(255,255,255,.1);
  --ob-orange: #ff9900; --ob-orange-hi: #ffb547; --ob-orange-ink: #ffc773;
  --bw: 236px; --strap: 120px;
  position: relative; min-height: 100vh; overflow-x: clip; color: var(--ob-ink);
  background:
    radial-gradient(900px 520px at 72% -6%, rgba(43,140,240,.18), transparent 62%),
    linear-gradient(180deg, #0d1319 0%, #111a23 48%, #0d1319 100%);
  font-family: 'Sora', system-ui, -apple-system, sans-serif; font-size: 16px; line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}
.ob-root::before {
  content: ''; position: absolute; inset: 0 0 auto; height: 1000px; pointer-events: none;
  background: radial-gradient(900px 560px at 72% -6%, rgba(255,153,0,.24), transparent 62%);
  opacity: 0; transition: opacity 1.4s ease;
}
.ob-root.is-orange::before { opacity: 1; }
.ob-root *, .ob-root *::before, .ob-root *::after { box-sizing: border-box; }
.ob-root :focus-visible { outline: 3px solid var(--ob-orange-ink); outline-offset: 3px; box-shadow: none; }
.ob-root h1, .ob-root h2 { font-family: 'Newsreader', Georgia, serif; font-weight: 500; letter-spacing: -0.02em; margin: 0; color: #fff; }
.ob-root p { margin: 0; }
.ob-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.ob-back {
  position: absolute; top: 18px; left: 18px; z-index: 5; display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 14px; border-radius: 999px; border: 1px solid var(--ob-line); background: rgba(13,19,25,.6);
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); color: var(--ob-muted); font: 500 13px/1 'Sora', sans-serif; cursor: pointer;
}
.ob-back:hover { color: #fff; border-color: rgba(255,255,255,.25); }

.ob-hero {
  position: relative; max-width: 1100px; margin: 0 auto; padding: 0 32px; min-height: 100vh; min-height: 100svh;
  display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, .95fr); gap: 32px; align-items: center;
}
.ob-copy { grid-column: 1; grid-row: 1; padding: 80px 0; max-width: 540px; }
.ob-stage { grid-column: 2; grid-row: 1; align-self: start; position: relative; display: flex; flex-direction: column; align-items: center; padding-bottom: 40px; }
.ob-eyebrow { margin: 0 0 14px !important; font: 600 12px/1.4 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .18em; text-transform: uppercase; color: var(--ob-orange-ink); }
.ob-title { font-size: clamp(36px, 5.4vw, 64px); line-height: 1.04; }
.ob-title em { font-style: italic; font-weight: 400; color: var(--ob-orange); }
.ob-lead { margin-top: 18px !important; font-size: clamp(16px, 1.6vw, 19px); color: #c9d3dd; max-width: 34ch; }
.ob-cue {
  margin-top: 28px; display: inline-flex; align-items: center; gap: 10px; padding: 12px 20px; border: 0; border-radius: 999px;
  background: var(--ob-orange); color: #1b1205; font: 600 14px/1 'Sora', sans-serif; cursor: pointer;
  box-shadow: 0 10px 30px -10px rgba(255,153,0,.6); animation: ob-rise .6s both;
}
.ob-cue:hover { background: var(--ob-orange-hi); }

.ob-swing { display: flex; flex-direction: column; align-items: center; transform-origin: 50% 0; animation: ob-sway 5s ease-in-out infinite alternate; }
.ob-dip { display: flex; flex-direction: column; align-items: center; transition: transform .32s cubic-bezier(.3,.6,.3,1); }
.ob-root.is-tap .ob-dip { transform: translateY(26px); }
.ob-strap {
  width: 28px; height: var(--strap); overflow: hidden; display: flex; justify-content: center;
  background: linear-gradient(90deg, rgba(255,255,255,.07), transparent 35%, transparent 65%, rgba(0,0,0,.3)), #1d2a38;
  border-inline: 1px solid rgba(255,255,255,.06); transition: background-color .8s;
}
.ob-root.is-orange .ob-strap { background-color: #2c2215; }
.ob-strap span { writing-mode: vertical-rl; font: 700 9px/28px 'JetBrains Mono', monospace; letter-spacing: .32em; color: rgba(255,199,115,.55); white-space: nowrap; }
.ob-clip { position: relative; z-index: 2; width: 30px; height: 20px; margin-top: -1px; border-radius: 4px 4px 8px 8px; background: linear-gradient(180deg, #d9dfe5, #8d98a3); box-shadow: inset 0 -2px 0 rgba(0,0,0,.25), 0 2px 4px rgba(0,0,0,.4); }
.ob-badge { position: relative; isolation: isolate; width: var(--bw); aspect-ratio: 236 / 350; margin-top: -8px; perspective: 1100px; }
.ob-badge::before {
  content: ''; position: absolute; inset: -60px; z-index: -1; border-radius: 50%;
  background: radial-gradient(closest-side, rgba(255,153,0,.5), transparent); opacity: 0; transition: opacity 1s .35s;
}
.ob-root.is-orange .ob-badge::before { opacity: 1; }
.ob-card { position: absolute; inset: 0; transform-style: preserve-3d; transition: transform 1s cubic-bezier(.2,.75,.25,1); }
.ob-root.is-orange .ob-card { transform: rotateY(180deg); }
.ob-face {
  position: absolute; inset: 0; border-radius: 22px; -webkit-backface-visibility: hidden; backface-visibility: hidden;
  box-shadow: 0 34px 60px -24px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.4), inset 0 -2px 0 rgba(0,0,0,.18);
}
.ob-face.is-blue { background: linear-gradient(155deg, #4aa3ff 0%, #1f74d6 55%, #175fb3 100%); }
.ob-face.is-orange { background: linear-gradient(155deg, #ffbf4d 0%, #ff9900 50%, #ec7f00 100%); transform: rotateY(180deg); }
.ob-slot { position: absolute; top: 11px; left: 50%; width: 48px; height: 9px; margin-left: -24px; border-radius: 6px; background: rgba(0,0,0,.32); box-shadow: inset 0 1px 2px rgba(0,0,0,.5); }
.ob-inner {
  position: absolute; inset: 30px 12px 12px; border-radius: 14px; background: #fbfcfd; color: #17212b; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; text-align: center; padding: 14px 14px 12px;
}
.ob-org { font: 700 10px/1 'JetBrains Mono', monospace; letter-spacing: .3em; color: #1b5fae; }
.ob-face.is-orange .ob-org { color: #9a4a00; }
.ob-photo {
  margin-top: 14px; width: 86px; height: 86px; border-radius: 50%; display: grid; place-items: center;
  font: 500 42px/1 'Newsreader', Georgia, serif; color: #fff; box-shadow: inset 0 -4px 10px rgba(0,0,0,.18);
  background: radial-gradient(circle at 35% 30%, #74b9ff, #1f6fd1 75%);
}
.ob-face.is-orange .ob-photo { background: radial-gradient(circle at 35% 30%, #ffcf7a, #e57c00 75%); }
.ob-name { margin-top: 12px; font: 700 23px/1.1 'Sora', sans-serif; letter-spacing: -0.015em; }
.ob-meta { margin-top: 6px; font-size: 11.5px; color: #4b5866; }
.ob-ribbon { margin-top: 10px; padding: 4px 12px; border-radius: 999px; background: #ff9900; color: #1b1205; font: 800 12.5px/1.2 'Sora', sans-serif; letter-spacing: .1em; }
.ob-code {
  margin-top: auto; width: 100%; height: 24px; opacity: .8;
  background: repeating-linear-gradient(90deg, #17212b 0 2px, transparent 2px 4px, #17212b 4px 5px, transparent 5px 8px, #17212b 8px 11px, transparent 11px 13px);
}
.ob-tag { margin-top: 7px; font: 700 9px/1 'JetBrains Mono', monospace; letter-spacing: .24em; color: #4b5866; }

.ob-reader {
  position: relative; margin-top: 30px; display: flex; align-items: center; gap: 14px; min-width: 260px;
  padding: 12px 18px 12px 12px; border-radius: 18px; border: 1px solid rgba(255,255,255,.12);
  background: linear-gradient(180deg, #1c2631, #121a22); color: var(--ob-ink); text-align: left; cursor: pointer;
  box-shadow: 0 16px 34px -16px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.06); transition: border-color .3s, transform .2s;
}
.ob-reader:hover { border-color: rgba(255,199,115,.5); }
.ob-reader:active { transform: scale(.98); }
.ob-reader[aria-disabled="true"] { cursor: progress; }
.ob-reader::after { content: ''; position: absolute; inset: -6px; border-radius: 22px; border: 2px solid rgba(255,153,0,.55); opacity: 0; pointer-events: none; }
.ob-root.is-blue .ob-reader::after { animation: ob-ping 2.2s ease-out infinite; }
.ob-pad { flex: none; width: 46px; height: 46px; border-radius: 12px; display: grid; place-items: center; background: #0b1117; color: #93a3b4; transition: color .6s; }
.ob-root.is-orange .ob-pad { color: var(--ob-orange-ink); }
.ob-pad svg { width: 24px; height: 24px; }
.ob-rtext { display: grid; gap: 3px; flex: 1; }
.ob-rtext b { font-weight: 600; font-size: 15px; }
.ob-rtext small { font-size: 12.5px; color: var(--ob-muted); }
.ob-led { flex: none; width: 10px; height: 10px; border-radius: 50%; background: #f5a524; box-shadow: 0 0 10px rgba(245,165,36,.8); animation: ob-blink 1.4s ease-in-out infinite; }
.ob-root.is-tap .ob-led { animation-duration: .22s; }
.ob-root.is-orange .ob-led { background: #3ddc84; box-shadow: 0 0 12px rgba(61,220,132,.9); animation: none; }

.ob-confetti { position: absolute; left: 50%; top: calc(var(--strap) + 12px + var(--bw) * .74); width: 0; height: 0; z-index: 3; pointer-events: none; }
.ob-confetti i { position: absolute; left: 0; top: 0; border-radius: 2px; opacity: 0; animation: ob-pop 1.7s cubic-bezier(.12,.7,.3,1) forwards; }

.ob-main { position: relative; max-width: 880px; margin: 0 auto; padding: 30px 24px 50px; }
.ob-sec { padding: 72px 0; }
.ob-head { margin-bottom: 30px; }
.ob-head h2 { font-size: clamp(34px, 5vw, 52px); line-height: 1.06; }
.ob-sub { margin-top: 12px !important; color: #c2ccd6; font-size: 17px; max-width: 46ch; }
.ob-root [data-reveal] { opacity: 0; transform: translateY(18px); transition: opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1); transition-delay: calc(var(--d, 0) * 80ms); }
.ob-root [data-reveal].is-in { opacity: 1; transform: none; }

.ob-struggle h2 { font-size: clamp(38px, 6vw, 64px); line-height: 1.04; }
.ob-montage { list-style: none; margin: 34px 0 0; padding: 0; display: grid; gap: 18px; }
.ob-montage li { position: relative; padding-left: 28px; font-family: 'Newsreader', Georgia, serif; font-size: clamp(21px, 2.7vw, 28px); line-height: 1.32; color: #d9e0e7; }
.ob-montage li::before { content: ''; position: absolute; left: 0; top: .66em; width: 14px; height: 2px; border-radius: 2px; background: var(--ob-orange); }
.ob-big { margin-top: 50px !important; font-family: 'Newsreader', Georgia, serif; font-size: clamp(30px, 4.4vw, 46px); line-height: 1.12; color: #fff; }
.ob-hard { margin-top: 22px !important; font-family: 'Newsreader', Georgia, serif; font-style: italic; font-weight: 400; font-size: clamp(46px, 9vw, 96px); line-height: 1; letter-spacing: -0.025em; color: var(--ob-orange); text-wrap: balance; }
.ob-small { margin-top: 18px !important; font-size: 17px; color: var(--ob-muted); }

.ob-doors { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; max-width: 580px; }
.ob-door {
  position: relative; display: block; width: 100%; height: 320px; padding: 0; border: 2px solid rgba(255,255,255,.14);
  border-radius: 18px 18px 8px 8px; background: #090d12; color: inherit; text-align: left; cursor: pointer; perspective: 1100px;
}
.ob-door.is-hard {
  border-color: rgba(255,153,0,.45);
  background: radial-gradient(120% 80% at 50% 60%, rgba(255,170,40,.95), rgba(255,140,0,.4) 45%, rgba(255,120,0,.08) 75%), #120c05;
}
.ob-light { position: absolute; inset: 0; display: grid; place-items: center; font: 700 13px/1 'JetBrains Mono', monospace; letter-spacing: .24em; text-transform: uppercase; color: #2a1600; }
.ob-leaf {
  position: absolute; inset: 7px; border-radius: 12px 12px 5px 5px; display: flex; flex-direction: column; justify-content: flex-end; gap: 6px;
  padding: 20px 18px; transform-origin: 0 50%; transition: transform 1s cubic-bezier(.3,.7,.2,1), box-shadow 1s, filter 1s;
  background: linear-gradient(180deg, #223040, #18222d); box-shadow: inset 0 0 0 1px rgba(255,255,255,.06); backface-visibility: hidden;
}
.ob-door.is-hard .ob-leaf { background: linear-gradient(180deg, #33261a, #20170d); box-shadow: inset 0 0 0 1px rgba(255,153,0,.3); }
.ob-door.is-hard:not(.is-open):hover .ob-leaf { transform: rotateY(9deg); }
.ob-door.is-open .ob-leaf { transform: rotateY(76deg); filter: brightness(.6); box-shadow: inset 0 0 0 1px rgba(255,153,0,.3), inset -30px 0 40px -16px rgba(0,0,0,.6); }
.ob-knob { position: absolute; right: 16px; top: 50%; width: 12px; height: 12px; border-radius: 50%; background: linear-gradient(#e4e9ee, #8f9aa5); }
.ob-dtitle { font-family: 'Newsreader', Georgia, serif; font-size: 25px; line-height: 1.1; color: #fff; }
.ob-dnote { font-size: 13.5px; line-height: 1.45; color: var(--ob-muted); }
.ob-door.is-hard .ob-dnote { color: #ecd1a6; }
.ob-door.is-nope-0 { animation: ob-shake-a .5s; }
.ob-door.is-nope-1 { animation: ob-shake-b .5s; }
.ob-nope { min-height: 1.6em; margin-top: 16px !important; font-size: 15px; color: #ecd1a6; }
.ob-choice { margin-top: 18px; }
.ob-choice > * { animation: ob-rise .7s both; }
.ob-choice > :nth-child(2) { animation-delay: .25s; }
.ob-choice > :nth-child(3) { animation-delay: .5s; }
.ob-choice-big { font-family: 'Newsreader', Georgia, serif; font-style: italic; font-weight: 400; font-size: clamp(36px, 5.4vw, 54px); line-height: 1.05; color: var(--ob-orange); }
.ob-choice p + p { margin-top: 12px; font-size: 17px; color: #d6dee6; max-width: 48ch; }
.ob-choice .ob-choice-small { font-size: 15px; color: var(--ob-muted); }

.ob-stats { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.ob-stat { padding: 20px; border: 1px solid var(--ob-line); border-radius: 18px; background: rgba(255,255,255,.025); }
.ob-stat b { display: block; font: 700 clamp(34px, 5vw, 48px)/1 'Sora', sans-serif; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: var(--ob-orange); }
.ob-stat-label { display: block; margin-top: 8px; font-weight: 600; }
.ob-stat small { display: block; margin-top: 6px; font-size: 13.5px; line-height: 1.45; color: var(--ob-muted); }

.ob-years { list-style: none; margin: 0; padding: 0 0 0 36px; position: relative; display: grid; gap: 30px; }
.ob-years::before { content: ''; position: absolute; left: 8px; top: 8px; bottom: 8px; width: 2px; border-radius: 2px; background: linear-gradient(180deg, #2b8cf0, #ff9900); }
.ob-year { position: relative; }
.ob-year::before { content: ''; position: absolute; left: -36px; top: 2px; width: 18px; height: 18px; border-radius: 50%; background: #0d1319; border: 3px solid var(--dot); }
.ob-year:last-child::before { background: var(--dot); box-shadow: 0 0 0 6px rgba(255,153,0,.18); }
.ob-year-k { display: flex; flex-wrap: wrap; gap: 4px 12px; align-items: baseline; font: 600 12px/1.5 'JetBrains Mono', monospace; letter-spacing: .14em; text-transform: uppercase; color: var(--ob-orange-ink); }
.ob-year-k span { letter-spacing: .06em; color: var(--ob-muted); }
.ob-year-line { margin-top: 8px !important; font-family: 'Newsreader', Georgia, serif; font-size: clamp(20px, 2.6vw, 26px); line-height: 1.32; color: #e3e9ef; }

.ob-lps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.ob-lp { display: block; width: 100%; padding: 0; border: 0; border-radius: 18px; background: none; color: inherit; text-align: left; cursor: pointer; perspective: 1000px; }
.ob-lp-in { display: grid; transform-style: preserve-3d; transition: transform .75s cubic-bezier(.2,.7,.2,1); }
.ob-lp.is-on .ob-lp-in { transform: rotateY(180deg); }
.ob-lp-face {
  grid-area: 1 / 1; min-height: 172px; border-radius: 18px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between; gap: 14px;
  -webkit-backface-visibility: hidden; backface-visibility: hidden;
}
.ob-lp-front { background: linear-gradient(160deg, #1d2834, #141c25); border: 1px solid rgba(255,255,255,.1); transition: border-color .3s; }
.ob-lp:hover .ob-lp-front { border-color: rgba(255,199,115,.45); }
.ob-lp-back { transform: rotateY(180deg); background: linear-gradient(155deg, #ffbf4d, #ff9900 55%, #f08800); color: #1b1205; }
.ob-lp-tag { font: 600 10.5px/1.3 'JetBrains Mono', monospace; letter-spacing: .16em; text-transform: uppercase; color: var(--ob-orange-ink); }
.ob-lp-name { font-family: 'Newsreader', Georgia, serif; font-size: 22px; line-height: 1.15; color: #fff; }
.ob-lp-hint { font-size: 12.5px; color: var(--ob-muted); }
.ob-lp-line { font-size: 15px; line-height: 1.45; font-weight: 500; }
.ob-lp-small { font: 600 10.5px/1.3 'JetBrains Mono', monospace; letter-spacing: .12em; text-transform: uppercase; color: #5a3200; }
.ob-lp-status { margin-top: 18px !important; font-size: 15px; color: var(--ob-muted); }
.ob-lp-status.is-done { color: var(--ob-orange-ink); font-weight: 600; }

.ob-letter {
  position: relative; overflow: hidden; padding: clamp(26px, 5vw, 52px); border-radius: 24px; background: #fbf5ec; color: #2b2219;
  font-family: 'Newsreader', Georgia, serif; font-size: clamp(18px, 2.1vw, 20.5px); line-height: 1.72; box-shadow: 0 40px 80px -40px rgba(0,0,0,.85);
}
.ob-letter::before { content: ''; position: absolute; inset: 0 0 auto; height: 6px; background: linear-gradient(90deg, #2b8cf0, #ff9900 45%); }
.ob-letter p + p { margin-top: 1em; }
.ob-to { font-style: italic; font-size: 1.15em; }
.ob-sign { margin-top: 1.4em !important; font-style: italic; font-size: 1.5em; color: #9a4a00; }
.ob-dayline { margin-top: 28px !important; text-align: center; font: 500 14px/1.6 'JetBrains Mono', monospace; color: var(--ob-muted); }
.ob-dayline b { font-weight: 600; color: var(--ob-orange-ink); }
.ob-foot { padding: 34px 0 10px; text-align: center; font: 500 12px/1 'JetBrains Mono', monospace; color: #8794a1; }

@keyframes ob-sway { from { transform: rotate(-1.4deg); } to { transform: rotate(1.4deg); } }
@keyframes ob-blink { 50% { opacity: .35; } }
@keyframes ob-ping { 0% { opacity: .9; transform: scale(.96); } 100% { opacity: 0; transform: scale(1.12); } }
@keyframes ob-pop {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(.3) rotate(0); }
  55% { opacity: 1; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); }
  100% { opacity: 0; transform: translate(var(--dx), calc(var(--dy) + 110px)) rotate(calc(var(--rot) * 2)); }
}
@keyframes ob-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes ob-shake-a { 20% { transform: translateX(-9px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(3px); } }
@keyframes ob-shake-b { 20% { transform: translateX(-9px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(3px); } }

@media (max-width: 760px) {
  .ob-root { --bw: 204px; --strap: 64px; }
  .ob-hero { grid-template-columns: minmax(0, 1fr); min-height: auto; padding: 0 20px; gap: 0; }
  .ob-stage { grid-column: 1; grid-row: 1; padding-bottom: 6px; }
  .ob-copy { grid-column: 1; grid-row: 2; padding: 26px 0 48px; margin: 0 auto; text-align: center; }
  .ob-lead { margin-inline: auto; }
  .ob-inner { inset: 28px 10px 10px; padding: 12px 12px 10px; }
  .ob-photo { width: 70px; height: 70px; margin-top: 10px; font-size: 34px; }
  .ob-name { margin-top: 10px; font-size: 20px; }
  .ob-reader { margin-top: 24px; min-width: 0; width: min(100%, 300px); }
  .ob-main { padding: 0 20px 40px; }
  .ob-sec { padding: 56px 0; }
  .ob-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .ob-stat { padding: 16px; }
  .ob-lps { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .ob-door { height: 250px; }
  .ob-leaf { padding: 16px 14px; }
  .ob-dtitle { font-size: 20px; }
}
@media (max-width: 420px) {
  .ob-lps { grid-template-columns: minmax(0, 1fr); }
  .ob-lp-face { min-height: 128px; }
  .ob-stat b { font-size: 30px; }
}
@media (prefers-reduced-motion: reduce) {
  .ob-swing, .ob-led, .ob-root.is-blue .ob-reader::after, .ob-cue, .ob-choice > *, .ob-door.is-nope-0, .ob-door.is-nope-1 { animation: none !important; }
  .ob-confetti { display: none; }
  .ob-card, .ob-dip, .ob-leaf, .ob-lp-in, .ob-root::before, .ob-badge::before { transition: none !important; }
  .ob-root [data-reveal] { opacity: 1; transform: none; transition: none; }
}
`;export{_ as default};
