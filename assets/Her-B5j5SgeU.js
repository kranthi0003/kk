import{r as l,u as M,j as t}from"./index-zumG7UTZ.js";const z=[146.83,164.81,185,220,246.94,293.66,329.63,369.99,440,493.88,587.33,659.25,739.99],R=[73.42,110,146.83],Y=.16,q=5,C=2.2;function B(){let n=null,r=null,p=0,m=!1;const g=[];function T(){const i=window.AudioContext||window.webkitAudioContext;if(!i)return!1;n=new i,r=n.createGain(),r.gain.value=1e-4;const u=n.createBiquadFilter();u.type="lowpass",u.frequency.value=1250,u.Q.value=.4;const h=n.createDelay(1.5);h.delayTime.value=.66;const s=n.createGain();s.gain.value=.33;const c=n.createGain();return c.gain.value=.26,r.connect(u),u.connect(n.destination),u.connect(h),h.connect(s),s.connect(h),h.connect(c),c.connect(n.destination),R.forEach((b,f)=>{const x=n.createOscillator();x.type="sine",x.frequency.value=b,x.detune.value=(f-1)*3;const e=n.createGain(),a=.075/(f+1.4);e.gain.value=a;const o=n.createOscillator();o.frequency.value=.045+f*.019;const d=n.createGain();d.gain.value=a*.45,o.connect(d),d.connect(e.gain),x.connect(e),e.connect(r),x.start(),o.start(),g.push(x,o)}),!0}function N(){if(!n||!m)return;const i=n.currentTime,u=z[Math.floor(Math.random()*z.length)],h=n.createOscillator();h.type="triangle",h.frequency.value=u;const s=n.createGain(),c=.05+Math.random()*.045;if(s.gain.setValueAtTime(1e-4,i),s.gain.exponentialRampToValueAtTime(c,i+1.7),s.gain.exponentialRampToValueAtTime(1e-4,i+7),h.connect(s),n.createStereoPanner){const b=n.createStereoPanner();b.pan.value=(Math.random()*2-1)*.55,s.connect(b),b.connect(r)}else s.connect(r);h.start(i),h.stop(i+7.5),h.onended=()=>{try{h.disconnect(),s.disconnect()}catch{}}}function A(){clearTimeout(p),m&&(N(),p=setTimeout(A,3200+Math.random()*4200))}return{supported(){return!!(window.AudioContext||window.webkitAudioContext)},start(){if(!n&&!T())return!1;m=!0,n.state==="suspended"&&n.resume();const i=n.currentTime;return r.gain.cancelScheduledValues(i),r.gain.setValueAtTime(Math.max(r.gain.value,1e-4),i),r.gain.exponentialRampToValueAtTime(Y,i+q),A(),!0},stop(){if(m=!1,clearTimeout(p),!n)return;const i=n.currentTime;r.gain.cancelScheduledValues(i),r.gain.setValueAtTime(Math.max(r.gain.value,1e-4),i),r.gain.exponentialRampToValueAtTime(1e-4,i+C)},destroy(){if(m=!1,clearTimeout(p),g.forEach(i=>{try{i.stop()}catch{}}),g.length=0,n)try{n.close()}catch{}n=null,r=null}}}const v="#c0868c",k="#a2666e",S=[{id:"c-2021",eyebrow:"2021",anchor:"2021",blocks:[{t:"beat",text:"I was twenty-one."},{t:"p",text:"Final year of college. That season when everyone is quietly frightened and pretending to be bored."},{t:"p",text:"I had come to your college that day for some small work. A form to submit, a signature to collect — I have honestly forgotten which. The kind of errand that leaves nothing behind. You stand in a corridor. A fan turns slowly overhead. Somewhere down the hall a pair of slippers slaps against the floor. Outside, the afternoon is white and far too bright, and the person you came for is on a tea break."},{t:"p",text:"That was the whole day. There was nothing in it worth keeping."},{t:"beat",text:"And then you walked past."},{t:"te",text:"Aa kshanam naaku teliyaledu… adi aidellu naa venta untundani."},{t:"p",text:"I should say plainly how small it was, because that is the part that matters."},{t:"em",text:"Nothing happened."},{t:"p",text:"Nobody spoke. There was no introduction, no hello, no name, no number, no reason to stop and no reason to look twice. You were in front of me for a few seconds, and then the corridor closed over the place where you had been, the way water closes over a stone."},{t:"p",text:"I have had five years to find a better sentence for those few seconds, and I still do not have one. The closest I can come is this — you looked like someone who had wandered in from a kinder world by mistake, and had not yet realised she was in the wrong one."},{t:"p",text:"Then you were gone. Back to being a stranger. And I went back to my form, and my corridor, and my slow fan."},{t:"p",text:"That should have been the end of it. In every reasonable sense, that _was_ the end of it. Cities are full of faces you see once."},{t:"rule"},{t:"p",text:"But here is the thing I have never been able to explain."},{t:"p",text:"A memory is supposed to earn its place. Something has to happen first — a conversation, a quarrel, a joke, a night that went on too long. The mind keeps whatever has a story attached to it, and quietly throws away the rest."},{t:"p",text:"That one had nothing attached to it. No name. No story. Nowhere to keep it."},{t:"te",text:"Peru teliyadu. Katha ledu. Ayina gurthundipoyindi."},{t:"em",text:"It stayed anyway."}]},{id:"c-after",eyebrow:"The years in between",blocks:[{t:"p",text:"I finished college. Everyone does."},{t:"p",text:"Life picked up speed the way it does at twenty-two. The first job. The first city that is not your parents’. The first month where the money finishes before the month does."},{t:"p",text:"And I did not think about you. I want to be honest about that, because the honest version of this is better than the beautiful one, and you deserve the honest one."},{t:"p",text:"You were not a longing. I was not waiting for anybody. I had no photograph, no name, no way of finding you, and no intention of looking."},{t:"p",text:"You were something much smaller than that. A face without a story. A song heard once from a passing auto — you can still hum it, you cannot name it, and you know you will never find it again."},{t:"p",text:"Months went by like that. Then a year. Then more."},{t:"beat",text:"Which is to say — normally."}]},{id:"c-2022",eyebrow:"2022",anchor:"2022",blocks:[{t:"p",text:"Then I joined Amazon."},{t:"p",text:"And one ordinary day, in the middle of ordinary work, I found out you were there too."},{t:"te",text:"Inta pedda prapanchamlo… malli nuvve."},{t:"p",text:"I remember exactly how absurd it felt. A company with more than a million people inside it, spread across the entire world. And somewhere in all of that was the one stranger I had never quite managed to put down."},{t:"p",text:"Not only there — doing, of all things, more or less the same work I was doing."},{t:"beat",text:"I was in Hyderabad. You were in Bangalore."},{t:"p",text:"Close enough to be real. Far enough to be nothing."},{t:"p",text:"I sat with that for a long time. It was not excitement exactly. It was something quieter — the feeling of walking past a wall you have passed for years, and noticing, for the first time, that it was a door."}]},{id:"c-2023",eyebrow:"2023",anchor:"2023",blocks:[{t:"p",text:"So I did what anybody does when life hands him a convenient excuse."},{t:"beat",text:"I used it."},{t:"p",text:"Work first. Work questions, work things, the small administrative traffic of two people inside the same enormous machine. And then, slowly, Instagram."},{t:"p",text:"They were light conversations. Genuinely light. Nothing intense, nothing romantic, nothing either of us ever had to name or define or be careful about. A message here. A reply there. Long silences in between, and neither of us minded them."},{t:"p",text:"I was not building towards anything. I do not think I had a plan at all. I only liked that after all those years there was suddenly a door where there had never been a door."},{t:"beat",text:"And then I found out you were with someone."},{t:"te",text:"Aa talupu naadi kaadu."}]},{id:"c-stopped",eyebrow:"What I did about it",blocks:[{t:"em",text:"I stopped."},{t:"p",text:"There was no scene and no speech, because there was nothing to make a scene about. You had a life, and it was full, and I had arrived years late holding a memory that belonged to nobody but me."},{t:"p",text:"So I stepped back out of it. Quietly. Without making it your problem, and without becoming the kind of man who makes himself an interesting complication in somebody else’s relationship."},{t:"p",text:"I have thought about that decision many times since, and I still believe it was the only decent one available."},{t:"p",text:"Some doors you do not knock on twice. You are told they belong to someone else, and you go home."},{t:"p",text:"That felt like the end."},{t:"beat",text:"And for years, it was."}]},{id:"c-middle",eyebrow:"The quiet years",blocks:[{t:"p",text:"Life went on being life."},{t:"p",text:"I worked. I moved. I was in a relationship of my own, and it was fine, and it ended, and even now I cannot say anything more interesting about it than that. It existed. It never quite landed."},{t:"p",text:"I am not going to pretend that had anything to do with you. It did not, and it would be unfair of me to hand you that weight. You were not in my head. You were not a standard anyone was being measured against."},{t:"p",text:"I only noticed, somewhere in those years, that I was not particularly curious about anybody. Not the way I had once been curious, for a few seconds at twenty-one, about a person whose name I did not even know."},{t:"p",text:"You never became an obsession. You became something quieter, and far more stubborn."},{t:"beat",text:"An unfinished sentence."},{t:"beat",text:"A door I had now walked past twice without ever finding out what was behind it."}]},{id:"c-2026",eyebrow:"2026",anchor:"2026",blocks:[{t:"p",text:"I had deactivated Instagram for a while — one of those small acts of self-preservation everyone performs eventually."},{t:"p",text:"Months later, I came back."},{t:"p",text:"And your profile surfaced. Unasked. The way these things do."},{t:"p",text:"I looked. Of course I looked — the way anyone looks at a name they have not seen in years."},{t:"p",text:"And somewhere in that looking, a thought arrived that I had not allowed myself in a very long time."},{t:"em",text:"What if the timing is different now?"},{t:"p",text:"I had no evidence. I had no business assuming anything, and I knew it. I was not reading fate into it. I was not building a case."},{t:"p",text:"What I had was about one percent."},{t:"p",text:"One percent is nothing. It is a rounding error. Anywhere else in life, those are odds you would laugh at."},{t:"te",text:"Oka shaatam chaalu."},{t:"beat",text:"It turned out to be enough."},{t:"p",text:"I sent a follow request."},{t:"p",text:"I remember how ordinary it felt to press that, and exactly how much it was not. Five years of never once having a reason to say hello, and in the end it came down to one small button."},{t:"beat",text:"You accepted immediately."}]},{id:"c-july",eyebrow:"13 July 2026",anchor:"13 Jul",blocks:[{t:"p",text:"So I messaged you."},{t:"p",text:"I would like to report that I was calm about it."},{t:"p",text:"Five years of a face I could not explain, and it came down to a few typed sentences and one held breath."},{t:"beat",text:"You replied."},{t:"beat",text:"It went well."},{t:"te",text:"Aidella taruvaata… modatisaari maatladaam."},{t:"p",text:"And that is the moment this stopped being a story about a coincidence. Because for the first time in five years, it stopped being something that was happening _to_ me."}]},{id:"c-now",eyebrow:"Where it leaves me",blocks:[{t:"p",text:"You have known me for about a month."},{t:"p",text:"I have known _of_ you for five years."},{t:"p",text:"I am aware of how uneven that is. I know it is not your fault, and not yours to carry. You have had four weeks. I have had half a decade of a face I could not place and a coincidence I could not explain — and none of that is a debt you ever agreed to."},{t:"p",text:"But three times now, life has put you in front of me."},{t:"list",items:["Once when I was twenty-one, and I had nothing to say.","Once inside a company of a million people, when the timing belonged to someone else.","And now — which is the first time I have actually had any say in it."]},{t:"p",text:"So I am going to use it. As gently as I know how."},{t:"te",text:"Okaru chepparu… nachithey cheppeyamani."},{t:"video",id:"IHs8J7blJlQ",caption:"Charles Leclerc, to a fan who asked him what to do"},{t:"em",text:"I like you. I would like to see where this goes."},{t:"p",text:"That is the whole sentence. There is nothing underneath it. Not _I waited, so you owe me something._ Not a declaration, not a demand, nothing you have to answer today or answer at all."},{t:"p",text:"And if the answer is no, then it is no — genuinely, with no hard feelings and nothing awkward left for you to manage. I would rather have asked than spend another five years being someone who almost did."},{t:"rule"},{t:"te",text:"Innellu nuvvu naaku oka kshanam. Ippudu oka avakaasam."},{t:"beat",text:"For five years you were a few seconds I could not explain."},{t:"close",text:"I would like to find out what else you are."}]}],L=S.filter(n=>n.anchor);function j(n){return n.includes("_")?n.split(/_([^_]+)_/g).map((r,p)=>p%2?t.jsx("em",{children:r},p):r):n}function O({id:n,caption:r}){const[p,m]=l.useState(!1);return t.jsxs("div",{className:"her-rv her-reel",children:[t.jsx("div",{className:"her-reel-frame",children:p?t.jsx("iframe",{src:`https://www.youtube-nocookie.com/embed/${n}?autoplay=1&rel=0&playsinline=1`,title:r||"Clip",loading:"lazy",allowFullScreen:!0,allow:"accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"}):t.jsxs("button",{type:"button",onClick:()=>m(!0),"aria-label":"Play the clip",children:[t.jsx("img",{src:`https://i.ytimg.com/vi/${n}/hqdefault.jpg`,alt:"",loading:"lazy"}),t.jsx("span",{className:"her-reel-play","aria-hidden":"true",children:t.jsx("svg",{viewBox:"0 0 24 24",fill:"currentColor",children:t.jsx("path",{d:"M8 5.5v13l11-6.5z"})})})]})}),r?t.jsx("p",{className:"her-reel-cap",children:r}):null]})}function $({onBack:n}){const r=l.useRef(null),[p,m]=l.useState(0),[g,T]=l.useState([]),[N,A]=l.useState(-1),[i,u]=l.useState(!1),h=l.useRef(!1),s=l.useRef(null),c=M();l.useEffect(()=>{var e;h.current=typeof window<"u"&&((e=window.matchMedia)==null?void 0:e.call(window,"(prefers-reduced-motion: reduce)").matches)},[]),l.useEffect(()=>{var e;return(e=c==null?void 0:c.setSuppressed)==null||e.call(c,!0),()=>{var a;return(a=c==null?void 0:c.setSuppressed)==null?void 0:a.call(c,!1)}},[c]),l.useEffect(()=>()=>{var e,a;(a=(e=s.current)==null?void 0:e.destroy)==null||a.call(e)},[]);const b=l.useCallback(()=>{s.current||(s.current=B()),i?(s.current.stop(),u(!1)):s.current.start()&&u(!0)},[i]);l.useEffect(()=>{if(!i)return;const e=()=>{var a,o;document.hidden?(a=s.current)==null||a.stop():(o=s.current)==null||o.start()};return document.addEventListener("visibilitychange",e),()=>document.removeEventListener("visibilitychange",e)},[i]);const f=l.useCallback(()=>{const e=r.current;if(!e)return;const a=e.scrollHeight-e.clientHeight;if(a<=0){T([]);return}T(L.map(o=>{const d=e.querySelector("#"+o.id),y=d?d.offsetTop-e.clientHeight*.42:0;return{label:o.anchor,pct:Math.min(100,Math.max(0,y/a*100))}}))},[]);l.useLayoutEffect(()=>{f();const e=setTimeout(f,400);return window.addEventListener("resize",f),()=>{clearTimeout(e),window.removeEventListener("resize",f)}},[f]),l.useEffect(()=>{const e=r.current;if(!e)return;let a=0;const o=()=>{a||(a=requestAnimationFrame(()=>{a=0;const d=e.scrollHeight-e.clientHeight;m(d>0?e.scrollTop/d*100:0)}))};return e.addEventListener("scroll",o,{passive:!0}),o(),()=>{e.removeEventListener("scroll",o),a&&cancelAnimationFrame(a)}},[]),l.useEffect(()=>{if(!g.length)return;let e=-1;g.forEach((a,o)=>{p>=a.pct-.5&&(e=o)}),A(e)},[p,g]),l.useEffect(()=>{const e=r.current;if(!e)return;const a=()=>e.querySelectorAll(".her-rv:not(.is-in)");if(h.current||!("IntersectionObserver"in window)){a().forEach(w=>w.classList.add("is-in"));return}const o=new IntersectionObserver(w=>{w.forEach(I=>{I.isIntersecting&&(I.target.classList.add("is-in"),o.unobserve(I.target))})},{root:e,rootMargin:"0px 0px -12% 0px",threshold:.08});e.querySelectorAll(".her-rv").forEach(w=>o.observe(w));let d=0;const y=()=>{d||(d=requestAnimationFrame(()=>{d=0;const w=a();if(!w.length)return;const I=e.clientHeight;w.forEach(E=>{E.getBoundingClientRect().top<I*.92&&(E.classList.add("is-in"),o.unobserve(E))})}))};return e.addEventListener("scroll",y,{passive:!0}),()=>{o.disconnect(),e.removeEventListener("scroll",y),d&&cancelAnimationFrame(d)}},[]);const x=()=>{var e;return(e=r.current)==null?void 0:e.scrollTo({top:0,behavior:h.current?"auto":"smooth"})};return t.jsxs("div",{ref:r,className:"her-root fixed inset-0 z-[300] overflow-y-auto overflow-x-hidden",children:[t.jsx("style",{children:_}),t.jsx("div",{className:"her-grain","aria-hidden":"true"}),t.jsxs("button",{onClick:n,title:"Back",className:"her-chip her-back",children:[t.jsx("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2.2,children:t.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19l-7-7 7-7"})}),t.jsx("span",{className:"hidden sm:inline",children:"Back"})]}),t.jsxs("button",{onClick:b,className:"her-chip her-music"+(i?" is-on":""),title:i?"Turn the music off":"Turn the music on","aria-pressed":i,children:[t.jsxs("span",{className:"her-bars","aria-hidden":"true",children:[t.jsx("i",{}),t.jsx("i",{}),t.jsx("i",{})]}),t.jsx("span",{className:"hidden sm:inline",children:i?"Music on":"Music"})]}),t.jsx("div",{className:"her-topbar","aria-hidden":"true",children:t.jsx("span",{style:{width:p+"%"}})}),t.jsxs("div",{className:"her-rail","aria-hidden":"true",children:[t.jsx("span",{className:"her-rail-track"}),t.jsx("span",{className:"her-rail-fill",style:{height:p+"%"}}),g.map((e,a)=>t.jsxs("span",{className:"her-tick"+(a<=N?" is-on":""),style:{top:e.pct+"%"},children:[t.jsx("i",{}),t.jsx("em",{children:e.label})]},e.label))]}),t.jsxs("header",{className:"her-open",children:[t.jsxs("span",{className:"her-ripple","aria-hidden":"true",children:[t.jsx("i",{}),t.jsx("i",{}),t.jsx("i",{})]}),t.jsx("p",{className:"her-open-eyebrow",children:"A true story, still going"}),t.jsx("h1",{className:"her-title",children:"Five Years"}),t.jsx("p",{className:"her-open-dates",children:"2021  —  13 July 2026"}),t.jsx("span",{className:"her-scroll","aria-hidden":"true",children:t.jsx("i",{})})]}),t.jsxs("main",{className:"her-body",children:[S.map(e=>t.jsxs("section",{id:e.id,className:"her-chapter",children:[t.jsx("p",{className:"her-rv her-eyebrow",children:e.eyebrow}),e.blocks.map((a,o)=>a.t==="rule"?t.jsx("span",{className:"her-rv her-rule","aria-hidden":"true"},o):a.t==="video"?t.jsx(O,{id:a.id,caption:a.caption},o):a.t==="te"?t.jsx("p",{className:"her-rv her-te",children:a.text},o):a.t==="em"?t.jsx("p",{className:"her-rv her-em",children:j(a.text)},o):a.t==="beat"?t.jsx("p",{className:"her-rv her-beat",children:j(a.text)},o):a.t==="close"?t.jsx("p",{className:"her-rv her-close",children:j(a.text)},o):a.t==="list"?t.jsx("ul",{className:"her-rv her-list",children:a.items.map((d,y)=>t.jsx("li",{children:j(d)},y))},o):t.jsx("p",{className:"her-rv her-p",children:j(a.text)},o))]},e.id)),t.jsxs("footer",{className:"her-foot",children:[t.jsx("button",{onClick:x,className:"her-again",children:"Read it again"}),t.jsx("p",{className:"her-foot-note",children:"kranthikiran.com · unlisted"})]})]})]})}const _=`
  /* Warm paper, not a screen. Blush at the top, a little sage low on the left
     and the faintest lilac on the right, over an ivory base. */
  .her-root {
    background:
      radial-gradient(62% 40% at 50% 0%, rgba(228,193,193,0.38) 0%, transparent 64%),
      radial-gradient(52% 36% at 4% 86%, rgba(198,212,197,0.30) 0%, transparent 68%),
      radial-gradient(46% 34% at 98% 42%, rgba(219,205,222,0.26) 0%, transparent 70%),
      linear-gradient(176deg, #fdfaf8 0%, #faf4f0 46%, #f7f0ec 100%);
    color: rgba(74,66,62,0.82);
    -webkit-font-smoothing: antialiased;
  }
  .her-root::-webkit-scrollbar { width: 0; height: 0; }
  .her-root { scrollbar-width: none; }

  /* The faintest tooth, so the background reads as paper rather than a flat fill. */
  .her-grain {
    position: fixed; inset: 0; pointer-events: none; z-index: 2; opacity: 0.55;
    background-image:
      radial-gradient(rgba(120,96,90,0.030) 1px, transparent 1px),
      radial-gradient(rgba(120,96,90,0.020) 1px, transparent 1px);
    background-size: 3px 3px, 7px 7px;
    background-position: 0 0, 2px 3px;
  }

  .her-chip {
    position: fixed; top: 1rem; z-index: 30;
    display: inline-flex; align-items: center; gap: 0.45rem;
    padding: 0.44rem 0.85rem; border-radius: 999px;
    font-family: 'Sora', system-ui, sans-serif;
    font-size: 0.8rem; font-weight: 500;
    color: ${k};
    background: rgba(255,255,255,0.72);
    border: 1px solid rgba(192,134,140,0.24);
    box-shadow: 0 2px 14px rgba(150,110,110,0.08);
    backdrop-filter: blur(10px);
    transition: transform 0.22s ease, background 0.22s ease, box-shadow 0.22s ease;
  }
  .her-chip:hover { transform: translateY(-1px); background: rgba(255,255,255,0.92); box-shadow: 0 5px 20px rgba(150,110,110,0.14); }
  .her-back { left: 1rem; }
  .her-music { right: 1rem; }
  .her-music.is-on { background: rgba(192,134,140,0.14); border-color: rgba(192,134,140,0.42); }

  /* Three little bars that only move while the music is actually playing. */
  .her-bars { display: inline-flex; align-items: flex-end; gap: 2px; height: 11px; }
  .her-bars > i { width: 2px; height: 4px; border-radius: 1px; background: currentColor; opacity: 0.65; }
  .her-music.is-on .her-bars > i { animation: herBar 1.25s ease-in-out infinite; opacity: 1; }
  .her-music.is-on .her-bars > i:nth-child(2) { animation-delay: 0.18s; }
  .her-music.is-on .her-bars > i:nth-child(3) { animation-delay: 0.36s; }
  @keyframes herBar {
    0%, 100% { height: 3px; }
    50%      { height: 11px; }
  }

  .her-topbar {
    position: fixed; top: 0; left: 0; right: 0; height: 2px; z-index: 25;
    background: rgba(120,96,90,0.07);
  }
  .her-topbar > span {
    display: block; height: 100%;
    background: linear-gradient(90deg, rgba(192,134,140,0.4), ${v});
  }
  @media (min-width: 1024px) { .her-topbar { display: none; } }

  .her-rail { display: none; }
  @media (min-width: 1024px) {
    .her-rail {
      display: block; position: fixed; z-index: 25;
      left: 3.25rem; top: 16vh; bottom: 16vh; width: 1px;
    }
    .her-rail-track { position: absolute; inset: 0; background: rgba(120,96,90,0.12); }
    .her-rail-fill {
      position: absolute; top: 0; left: 0; width: 1px;
      background: linear-gradient(180deg, rgba(192,134,140,0.35), ${v});
    }
    .her-tick { position: absolute; left: 0; transform: translateY(-50%); }
    .her-tick > i {
      position: absolute; left: -2.5px; top: -2.5px;
      width: 5px; height: 5px; border-radius: 50%;
      background: rgba(120,96,90,0.2);
      transition: background 0.45s ease, box-shadow 0.45s ease, transform 0.45s ease;
    }
    .her-tick > em {
      position: absolute; left: 0.9rem; top: -0.52rem;
      font-family: 'JetBrains Mono', monospace; font-style: normal;
      font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
      white-space: nowrap; color: rgba(74,66,62,0.3);
      transition: color 0.45s ease;
    }
    .her-tick.is-on > i {
      background: ${v}; transform: scale(1.5);
      box-shadow: 0 0 0 4px rgba(192,134,140,0.14);
    }
    .her-tick.is-on > em { color: ${k}; }
  }

  /* ---- opening ---- */
  .her-open {
    position: relative; z-index: 3;
    min-height: 100svh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center;
    padding: 5rem 1.5rem 4rem;
  }

  /* A stone dropped in water: three rings spread out and the surface settles. */
  .her-ripple { position: absolute; top: 50%; left: 50%; width: 0; height: 0; }
  .her-ripple > i {
    position: absolute; top: 0; left: 0;
    width: 22px; height: 22px; margin: -11px 0 0 -11px;
    border-radius: 50%; border: 1px solid rgba(192,134,140,0.5);
    opacity: 0; animation: herRipple 5s cubic-bezier(.16,.7,.3,1) both;
  }
  .her-ripple > i:nth-child(2) { animation-delay: 0.7s; }
  .her-ripple > i:nth-child(3) { animation-delay: 1.4s; }
  @keyframes herRipple {
    0%   { opacity: 0;    transform: scale(0.2); }
    18%  { opacity: 0.75; }
    100% { opacity: 0;    transform: scale(15); }
  }

  .her-open > :not(.her-ripple) { opacity: 0; animation: herRise 1.4s cubic-bezier(.22,.61,.36,1) forwards; }
  .her-open-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; letter-spacing: 0.34em; text-transform: uppercase;
    color: rgba(162,102,110,0.7); margin-bottom: 1.6rem;
    animation-delay: 3.4s;
  }
  .her-title {
    font-family: 'Newsreader', Georgia, serif; font-weight: 300;
    font-size: clamp(3rem, 15vw, 7.5rem); line-height: 0.95; letter-spacing: -0.02em;
    background: linear-gradient(100deg, #b0757f 0%, ${v} 42%, #caa08f 68%, #b0757f 100%);
    background-size: 200% auto;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    animation-delay: 3.8s;
  }
  .her-open-dates {
    margin-top: 1.9rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: clamp(10px, 2.6vw, 12px); letter-spacing: 0.3em;
    color: rgba(74,66,62,0.42);
    animation-delay: 4.4s;
  }
  .her-scroll { margin-top: 4.5rem; display: block; animation-delay: 5.1s; }
  .her-scroll > i {
    display: block; width: 1px; height: 46px;
    background: linear-gradient(180deg, rgba(192,134,140,0.6), transparent);
    animation: herDrop 2.8s ease-in-out infinite;
  }
  @keyframes herDrop {
    0%, 100% { opacity: 0.25; transform: translateY(-5px); }
    50%      { opacity: 0.9; transform: translateY(5px); }
  }
  @keyframes herRise {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: none; }
  }

  /* ---- body ---- */
  .her-body { position: relative; z-index: 3; padding: 0 1.5rem 0; }
  .her-chapter { max-width: 34rem; margin: 0 auto; padding: 4.5rem 0 1rem; }
  @media (min-width: 640px) { .her-chapter { padding: 6.5rem 0 1.5rem; } }

  .her-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
    color: rgba(162,102,110,0.78);
    margin-bottom: 2.4rem; padding-bottom: 0.9rem;
    border-bottom: 1px solid rgba(192,134,140,0.2);
  }

  .her-p, .her-beat, .her-em, .her-close, .her-list, .her-te {
    font-family: 'Newsreader', Georgia, serif; font-weight: 300;
  }
  .her-p {
    font-size: clamp(1.08rem, 2.9vw, 1.26rem); line-height: 1.88;
    margin: 0 0 1.55rem; color: rgba(74,66,62,0.82);
  }
  .her-beat {
    font-size: clamp(1.18rem, 3.4vw, 1.45rem); line-height: 1.62;
    margin: 0 0 1.55rem; color: rgba(56,48,45,0.96);
  }
  .her-list { list-style: none; margin: 0 0 1.8rem; padding: 0; }
  .her-list li {
    position: relative; padding-left: 1.5rem; margin-bottom: 1rem;
    font-size: clamp(1.05rem, 2.8vw, 1.2rem); line-height: 1.74;
    color: rgba(74,66,62,0.84);
  }
  .her-list li::before {
    content: ''; position: absolute; left: 0; top: 0.74em;
    width: 0.7rem; height: 1px; background: rgba(192,134,140,0.7);
  }

  .her-em {
    font-style: italic;
    font-size: clamp(1.5rem, 5.2vw, 2.15rem); line-height: 1.42;
    margin: 2.9rem 0 2.9rem; text-align: center;
    color: ${k};
  }

  /* Telugu, WhatsApp style — Roman letters, not the script. It sits at the
     peaks, gets more air than anything else, and takes a small mark above it
     so it reads as the line the paragraph was walking towards. */
  .her-te {
    font-style: italic;
    font-size: clamp(1.3rem, 4.6vw, 1.85rem); line-height: 1.62;
    margin: 3.4rem 0 3.4rem; text-align: center;
    color: ${k};
  }
  .her-te::before {
    content: ''; display: block; width: 4px; height: 4px; border-radius: 50%;
    margin: 0 auto 1.6rem; background: ${v};
    box-shadow: 0 0 0 5px rgba(192,134,140,0.13);
  }

  .her-close {
    font-style: italic;
    font-size: clamp(1.55rem, 5.6vw, 2.35rem); line-height: 1.38;
    margin: 2.4rem 0 0; text-align: center;
    background: linear-gradient(100deg, #b0757f 0%, ${v} 50%, #c99b8e 100%);
    background-size: 200% auto;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
  }

  .her-p em, .her-beat em, .her-list em { font-style: italic; color: rgba(56,48,45,0.94); }

  .her-rule {
    display: block; width: 2.6rem; height: 1px; margin: 2.6rem auto;
    background: rgba(192,134,140,0.4);
  }

  /* ---- the reel ---- */
  .her-reel { margin: 2.6rem auto 3rem; max-width: 15.5rem; }
  .her-reel-frame {
    position: relative; aspect-ratio: 9 / 16; overflow: hidden;
    border-radius: 1.1rem;
    background: rgba(120,96,90,0.06);
    border: 1px solid rgba(192,134,140,0.24);
    box-shadow: 0 10px 30px rgba(150,110,110,0.14);
  }
  .her-reel-frame > iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  .her-reel-frame > button {
    position: absolute; inset: 0; width: 100%; height: 100%;
    padding: 0; border: 0; background: none; cursor: pointer;
  }
  /* hqdefault is 4:3 with letterbox bars; scaling up crops them off a 9:16 frame. */
  .her-reel-frame img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; transform: scale(1.42);
    transition: transform 0.5s ease;
  }
  .her-reel-frame > button:hover img { transform: scale(1.5); }
  .her-reel-play {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    width: 3.1rem; height: 3.1rem; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.9); color: ${k};
    box-shadow: 0 4px 18px rgba(80,50,50,0.28);
    transition: transform 0.25s ease;
  }
  .her-reel-play > svg { width: 1.5rem; height: 1.5rem; margin-left: 2px; }
  .her-reel-frame > button:hover .her-reel-play { transform: translate(-50%,-50%) scale(1.08); }
  .her-reel-cap {
    margin-top: 0.85rem; text-align: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
    color: rgba(74,66,62,0.4); line-height: 1.7;
  }

  .her-rv { opacity: 0; transform: translateY(14px); transition: opacity 0.9s ease, transform 0.9s cubic-bezier(.22,.61,.36,1); }
  .her-rv.is-in { opacity: 1; transform: none; }

  /* ---- footer ---- */
  .her-foot { max-width: 34rem; margin: 0 auto; padding: 6rem 0 7rem; text-align: center; }
  .her-again {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; letter-spacing: 0.26em; text-transform: uppercase;
    color: ${k};
    padding: 0.7rem 1.4rem; border-radius: 999px;
    border: 1px solid rgba(192,134,140,0.32);
    background: rgba(255,255,255,0.5);
    transition: background 0.25s ease, transform 0.25s ease;
  }
  .her-again:hover { background: rgba(192,134,140,0.12); transform: translateY(-1px); }
  .her-foot-note {
    margin-top: 2.2rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase;
    color: rgba(74,66,62,0.24);
  }

  @media (prefers-reduced-motion: reduce) {
    .her-ripple > i { animation: none; opacity: 0; }
    .her-open > :not(.her-ripple) { animation: none; opacity: 1; transform: none; }
    .her-scroll > i { animation: none; opacity: 0.5; }
    .her-rv { opacity: 1; transform: none; transition: none; }
    .her-music.is-on .her-bars > i { animation: none; height: 7px; }
  }
`;export{$ as default};
