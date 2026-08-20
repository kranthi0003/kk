import{r as h,u as F,j as t}from"./index-CAQy1awt.js";const B=[146.83,164.81,185,220,246.94,293.66,329.63,369.99,440,493.88,587.33,659.25,739.99],W=[73.42,110,146.83],H=.16,D=5,G=2.2;function J(){let n=null,i=null,s=0,d=!1;const f=[];function E(){const o=window.AudioContext||window.webkitAudioContext;if(!o)return!1;n=new o,i=n.createGain(),i.gain.value=1e-4;const g=n.createBiquadFilter();g.type="lowpass",g.frequency.value=1250,g.Q.value=.4;const l=n.createDelay(1.5);l.delayTime.value=.66;const u=n.createGain();u.gain.value=.33;const b=n.createGain();return b.gain.value=.26,i.connect(g),g.connect(n.destination),g.connect(l),l.connect(u),u.connect(l),l.connect(b),b.connect(n.destination),W.forEach((p,w)=>{const y=n.createOscillator();y.type="sine",y.frequency.value=p,y.detune.value=(w-1)*3;const m=n.createGain(),j=.075/(w+1.4);m.gain.value=j;const T=n.createOscillator();T.frequency.value=.045+w*.019;const x=n.createGain();x.gain.value=j*.45,T.connect(x),x.connect(m.gain),y.connect(m),m.connect(i),y.start(),T.start(),f.push(y,T)}),!0}function A(){if(!n||!d)return;const o=n.currentTime,g=B[Math.floor(Math.random()*B.length)],l=n.createOscillator();l.type="triangle",l.frequency.value=g;const u=n.createGain(),b=.05+Math.random()*.045;if(u.gain.setValueAtTime(1e-4,o),u.gain.exponentialRampToValueAtTime(b,o+1.7),u.gain.exponentialRampToValueAtTime(1e-4,o+7),l.connect(u),n.createStereoPanner){const p=n.createStereoPanner();p.pan.value=(Math.random()*2-1)*.55,u.connect(p),p.connect(i)}else u.connect(i);l.start(o),l.stop(o+7.5),l.onended=()=>{try{l.disconnect(),u.disconnect()}catch{}}}function I(){clearTimeout(s),d&&(A(),s=setTimeout(I,3200+Math.random()*4200))}return{supported(){return!!(window.AudioContext||window.webkitAudioContext)},start(){if(!n&&!E())return!1;d=!0,n.state==="suspended"&&n.resume();const o=n.currentTime;return i.gain.cancelScheduledValues(o),i.gain.setValueAtTime(Math.max(i.gain.value,1e-4),o),i.gain.exponentialRampToValueAtTime(H,o+D),I(),!0},stop(){if(d=!1,clearTimeout(s),!n)return;const o=n.currentTime;i.gain.cancelScheduledValues(o),i.gain.setValueAtTime(Math.max(i.gain.value,1e-4),o),i.gain.exponentialRampToValueAtTime(1e-4,o+G)},destroy(){if(d=!1,clearTimeout(s),f.forEach(o=>{try{o.stop()}catch{}}),f.length=0,n)try{n.close()}catch{}n=null,i=null}}}const M=[{title:"The Metro Proposal",artist:"Sai Abhyankkar",ids:["WmtSLESSWvQ"]},{title:"Puthu Mazha",artist:"Shakthisree Gopalan",ids:["N1ksAnmfuaE","N6nLPuLZRZA","gFLX3WBHozM","hxdZohfPCuw"]},{title:"Vizhi Veekura",artist:"Sai Abhyankkar",ids:["tcBOgmhVEZ4","e4NPe5RaOe0","DktsNAWQp7A","Wb9S7saKoT8"]}],L=32,_=7e3,Y=2500,K=1600,V=100,Q=n=>Math.pow(n,1.7),Z=n=>1-Math.pow(1-n,1.7);function U(){return new Promise((n,i)=>{if(window.YT&&window.YT.Player)return n();if(!document.getElementById("yt-iframe-api")){const f=document.createElement("script");f.id="yt-iframe-api",f.src="https://www.youtube.com/iframe_api",f.onerror=()=>i(new Error("yt api blocked")),document.head.appendChild(f)}let s=0;const d=setInterval(()=>{window.YT&&window.YT.Player?(clearInterval(d),n()):(s+=200)>12e3&&(clearInterval(d),i(new Error("yt api timeout")))},200)})}function X({onTrack:n,onFail:i}={}){let s=null,d=null,f=null,E=0,A=0,I=0,o=!1,g=!1,l=!1,u=!1;const b=()=>{try{n&&n(o?M[A]:null)}catch{}},p=()=>{f&&(clearInterval(f),f=null)},w=e=>{E=Math.max(0,Math.min(100,Math.round(e)));try{s&&s.setVolume(E)}catch{}},y=(e,a,r)=>{if(p(),!s)return;const c=E,k=e>=c,v=Math.max(1,Math.round(a/V));let N=0;f=setInterval(()=>{N+=1;const R=N/v;w(c+(e-c)*(k?Q(R):Z(R))),N>=v&&(p(),r&&r())},V)},m=e=>{if(!s||l)return;const a=M[A];if(!a)return;const r=a.ids[I];if(!r){j(e);return}w(0);try{s.loadVideoById(r)}catch{return}b(),y(L,g?e:_)},j=e=>{I=0,A=(A+1)%M.length,m(e)};let T=0;const x=()=>{if(T+=1,T>M.reduce((e,a)=>e+a.ids.length,0)){o=!1,b();try{i&&i()}catch{}return}I+=1,I>=M[A].ids.length?j(Y):m(Y)},P=async()=>{if(!(u||s||l)){u=!0;try{await U()}catch{u=!1;try{i&&i()}catch{}return}if(l){u=!1;return}d=document.createElement("div"),d.setAttribute("aria-hidden","true"),d.style.cssText="position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none",document.body.appendChild(d),s=new window.YT.Player(d,{videoId:M[0].ids[0],playerVars:{autoplay:0,controls:0,disablekb:1,fs:0,modestbranding:1,playsinline:1,rel:0,iv_load_policy:3},events:{onReady:e=>{if(w(0),o){try{e.target.playVideo()}catch{}b(),y(L,_)}},onStateChange:e=>{const a=window.YT;e.data===a.PlayerState.PLAYING?(T=0,g=!0):e.data===a.PlayerState.ENDED&&(I=0,j(Y))},onError:()=>{o&&x()}}}),u=!1}};return{tracks:M,start(){if(o=!0,!s)return P(),!0;let e=0;try{e=s.getCurrentTime()||0}catch{}try{s.playVideo()}catch{}return b(),y(L,e>0?Y:_),!0},stop(){o=!1,b(),y(0,K,()=>{try{s&&s.pauseVideo()}catch{}})},pause(){p();try{s&&s.pauseVideo()}catch{}},resume(){if(!(!o||!s)){try{s.playVideo()}catch{}y(L,Y)}},destroy(){l=!0,o=!1,p();try{s&&s.destroy()}catch{}try{d&&d.remove()}catch{}s=null,d=null}}}const S="#c2566e",z="#a03a55",$="#413634",q="#241d1c",O=[{id:"c-2021",eyebrow:"2021",anchor:"2021",blocks:[{t:"beat",text:"I was twenty-one."},{t:"p",text:"Final year of college. That season when everyone is quietly frightened and pretending to be bored."},{t:"p",text:"I had come to your college that day for some small work. A form to submit, a signature to collect — I have honestly forgotten which. The kind of errand that leaves nothing behind. You stand in a corridor. A fan turns slowly overhead. Somewhere down the hall a pair of slippers slaps against the floor. Outside, the afternoon is white and far too bright, and the person you came for is on a tea break."},{t:"p",text:"That was the whole day. There was nothing in it worth keeping."},{t:"beat",text:"And then you walked past."},{t:"te",text:"Aa kshanam naaku teliyaledu… adi aidellu naa venta untundani."},{t:"p",text:"I should say plainly how small it was, because that is the part that matters."},{t:"em",text:"Nothing happened."},{t:"p",text:"Nobody spoke. There was no introduction, no hello, no name, no number, no reason to stop and no reason to look twice. You were in front of me for a few seconds, and then the corridor closed over the place where you had been, the way water closes over a stone."},{t:"p",text:"I have had five years to find a better sentence for those few seconds, and I still do not have one. The closest I can come is this — you looked like someone who had wandered in from a kinder world by mistake, and had not yet realised she was in the wrong one."},{t:"p",text:"Then you were gone. Back to being a stranger. And I went back to my form, and my corridor, and my slow fan."},{t:"p",text:"That should have been the end of it. In every reasonable sense, that _was_ the end of it. Cities are full of faces you see once."},{t:"rule"},{t:"p",text:"But here is the thing I have never been able to explain."},{t:"p",text:"A memory is supposed to earn its place. Something has to happen first — a conversation, a quarrel, a joke, a night that went on too long. The mind keeps whatever has a story attached to it, and quietly throws away the rest."},{t:"p",text:"That one had nothing attached to it. No name. No story. Nowhere to keep it."},{t:"te",text:"Peru teliyadu. Katha ledu. Ayina gurthundipoyindi."},{t:"em",text:"It stayed anyway."}]},{id:"c-after",eyebrow:"The years in between",blocks:[{t:"p",text:"I finished college. Everyone does."},{t:"p",text:"Life picked up speed the way it does at twenty-two. The first job. The first city that is not your parents’. The first month where the money finishes before the month does."},{t:"p",text:"And I did not think about you. I want to be honest about that, because the honest version of this is better than the beautiful one, and you deserve the honest one."},{t:"p",text:"You were not a longing. I was not waiting for anybody. I had no photograph, no name, no way of finding you, and no intention of looking."},{t:"p",text:"You were something much smaller than that. A face without a story. A song heard once from a passing auto — you can still hum it, you cannot name it, and you know you will never find it again."},{t:"p",text:"Months went by like that. Then a year. Then more."},{t:"beat",text:"Which is to say — normally."}]},{id:"c-2022",eyebrow:"2022",anchor:"2022",blocks:[{t:"p",text:"Then I joined Amazon."},{t:"p",text:"And one ordinary day, in the middle of ordinary work, I found out you were there too."},{t:"te",text:"Inta pedda prapanchamlo… malli nuvve."},{t:"p",text:"I remember exactly how absurd it felt. A company with more than a million people inside it, spread across the entire world. And somewhere in all of that was the one stranger I had never quite managed to put down."},{t:"p",text:"Not only there — doing, of all things, more or less the same work I was doing."},{t:"beat",text:"I was in Hyderabad. You were in Bangalore."},{t:"p",text:"Close enough to be real. Far enough to be nothing."},{t:"p",text:"I sat with that for a long time. It was not excitement exactly. It was something quieter — the feeling of walking past a wall you have passed for years, and noticing, for the first time, that it was a door."}]},{id:"c-2023",eyebrow:"2023",anchor:"2023",blocks:[{t:"p",text:"So I did what anybody does when life hands him a convenient excuse."},{t:"beat",text:"I used it."},{t:"p",text:"Work first. Work questions, work things, the small administrative traffic of two people inside the same enormous machine. And then, slowly, Instagram."},{t:"p",text:"They were light conversations. Genuinely light. Nothing intense, nothing romantic, nothing either of us ever had to name or define or be careful about. A message here. A reply there. Long silences in between, and neither of us minded them."},{t:"p",text:"I was not building towards anything. I do not think I had a plan at all. I only liked that after all those years there was suddenly a door where there had never been a door."},{t:"beat",text:"And then I found out you were with someone."},{t:"te",text:"Aa talupu naadi kaadu."}]},{id:"c-stopped",eyebrow:"What I did about it",blocks:[{t:"em",text:"I stopped."},{t:"p",text:"There was no scene and no speech, because there was nothing to make a scene about. You had a life, and it was full, and I had arrived years late holding a memory that belonged to nobody but me."},{t:"p",text:"So I stepped back out of it. Quietly. Without making it your problem, and without becoming the kind of man who makes himself an interesting complication in somebody else’s relationship."},{t:"p",text:"I have thought about that decision many times since, and I still believe it was the only decent one available."},{t:"p",text:"Some doors you do not knock on twice. You are told they belong to someone else, and you go home."},{t:"p",text:"That felt like the end."},{t:"beat",text:"And for years, it was."}]},{id:"c-middle",eyebrow:"The quiet years",blocks:[{t:"p",text:"Life went on being life."},{t:"p",text:"I worked. I moved. I was in a relationship of my own, and it was fine, and it ended, and even now I cannot say anything more interesting about it than that. It existed. It never quite landed."},{t:"p",text:"I am not going to pretend that had anything to do with you. It did not, and it would be unfair of me to hand you that weight. You were not in my head. You were not a standard anyone was being measured against."},{t:"p",text:"I only noticed, somewhere in those years, that I was not particularly curious about anybody. Not the way I had once been curious, for a few seconds at twenty-one, about a person whose name I did not even know."},{t:"p",text:"You never became an obsession. You became something quieter, and far more stubborn."},{t:"beat",text:"An unfinished sentence."},{t:"beat",text:"A door I had now walked past twice without ever finding out what was behind it."}]},{id:"c-2026",eyebrow:"2026",anchor:"2026",blocks:[{t:"p",text:"I had deactivated Instagram for a while — one of those small acts of self-preservation everyone performs eventually."},{t:"p",text:"Months later, I came back."},{t:"p",text:"And your profile surfaced. Unasked. The way these things do."},{t:"p",text:"I looked. Of course I looked — the way anyone looks at a name they have not seen in years."},{t:"p",text:"And somewhere in that looking, a thought arrived that I had not allowed myself in a very long time."},{t:"em",text:"What if the timing is different now?"},{t:"p",text:"I had no evidence. I had no business assuming anything, and I knew it. I was not reading fate into it. I was not building a case."},{t:"p",text:"What I had was about one percent."},{t:"p",text:"One percent is nothing. It is a rounding error. Anywhere else in life, those are odds you would laugh at."},{t:"te",text:"Oka shaatam chaalu."},{t:"beat",text:"It turned out to be enough."},{t:"p",text:"I sent a follow request."},{t:"p",text:"I remember how ordinary it felt to press that, and exactly how much it was not. Five years of never once having a reason to say hello, and in the end it came down to one small button."},{t:"beat",text:"You accepted immediately."}]},{id:"c-july",eyebrow:"13 July 2026",anchor:"13 Jul",blocks:[{t:"p",text:"So I messaged you."},{t:"p",text:"I would like to report that I was calm about it."},{t:"p",text:"Five years of a face I could not explain, and it came down to a few typed sentences and one held breath."},{t:"beat",text:"You replied."},{t:"beat",text:"It went well."},{t:"te",text:"Aidella taruvaata… modatisaari maatladaam."},{t:"p",text:"And that is the moment this stopped being a story about a coincidence. Because for the first time in five years, it stopped being something that was happening _to_ me."}]},{id:"c-now",eyebrow:"Where it leaves me",blocks:[{t:"p",text:"You have known me for about a month."},{t:"p",text:"I have known _of_ you for five years."},{t:"p",text:"I am aware of how uneven that is. I know it is not your fault, and not yours to carry. You have had four weeks. I have had half a decade of a face I could not place and a coincidence I could not explain — and none of that is a debt you ever agreed to."},{t:"p",text:"But three times now, life has put you in front of me."},{t:"list",items:["Once when I was twenty-one, and I had nothing to say.","Once inside a company of a million people, when the timing belonged to someone else.","And now — which is the first time I have actually had any say in it."]},{t:"p",text:"So I am going to use it. As gently as I know how."},{t:"te",text:"Okaru chepparu… nachithey cheppeyamani."},{t:"video",id:"IHs8J7blJlQ",caption:"Charles Leclerc, to a fan who asked him what to do"},{t:"em",text:"I like you. I would like to see where this goes."},{t:"p",text:"That is the whole sentence. There is nothing underneath it. Not _I waited, so you owe me something._ Not a declaration, not a demand, nothing you have to answer today or answer at all."},{t:"p",text:"And if the answer is no, then it is no — genuinely, with no hard feelings and nothing awkward left for you to manage. I would rather have asked than spend another five years being someone who almost did."},{t:"rule"},{t:"te",text:"Innellu nuvvu naaku oka kshanam. Ippudu oka avakaasam."},{t:"beat",text:"For five years you were a few seconds I could not explain."},{t:"close",text:"I would like to find out what else you are."}]}],ee=O.filter(n=>n.anchor);function C(n){return n.includes("_")?n.split(/_([^_]+)_/g).map((i,s)=>s%2?t.jsx("em",{children:i},s):i):n}function te({id:n,caption:i}){const[s,d]=h.useState(!1);return t.jsxs("div",{className:"her-rv her-reel",children:[t.jsx("div",{className:"her-reel-frame",children:s?t.jsx("iframe",{src:`https://www.youtube-nocookie.com/embed/${n}?autoplay=1&rel=0&playsinline=1`,title:i||"Clip",loading:"lazy",allowFullScreen:!0,allow:"accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"}):t.jsxs("button",{type:"button",onClick:()=>d(!0),"aria-label":"Play the clip",children:[t.jsx("img",{src:`https://i.ytimg.com/vi/${n}/hqdefault.jpg`,alt:"",loading:"lazy"}),t.jsx("span",{className:"her-reel-play","aria-hidden":"true",children:t.jsx("svg",{viewBox:"0 0 24 24",fill:"currentColor",children:t.jsx("path",{d:"M8 5.5v13l11-6.5z"})})})]})}),i?t.jsx("p",{className:"her-reel-cap",children:i}):null]})}function re({onBack:n}){const i=h.useRef(null),[s,d]=h.useState(0),[f,E]=h.useState([]),[A,I]=h.useState(-1),[o,g]=h.useState(!1),[l,u]=h.useState(null),b=h.useRef(!1),p=h.useRef(null),w=h.useRef(null),y=h.useRef(!1),m=F();h.useEffect(()=>{var e;b.current=typeof window<"u"&&((e=window.matchMedia)==null?void 0:e.call(window,"(prefers-reduced-motion: reduce)").matches)},[]),h.useEffect(()=>{var e;return(e=m==null?void 0:m.setSuppressed)==null||e.call(m,!0),()=>{var a;return(a=m==null?void 0:m.setSuppressed)==null?void 0:a.call(m,!1)}},[m]),h.useEffect(()=>()=>{var e,a,r,c;(a=(e=p.current)==null?void 0:e.destroy)==null||a.call(e),(c=(r=w.current)==null?void 0:r.destroy)==null||c.call(r)},[]);const j=h.useCallback(()=>{w.current||(w.current=J()),w.current.start()?(y.current=!0,g(!0)):(y.current=!1,g(!1)),u(null)},[]),T=h.useCallback(()=>{var e,a,r;if(o){y.current?(e=w.current)==null||e.stop():(a=p.current)==null||a.stop(),g(!1),u(null);return}if(y.current){(r=w.current)!=null&&r.start()&&g(!0);return}p.current||(p.current=X({onTrack:u,onFail:j})),p.current.start()&&g(!0)},[o,j]);h.useEffect(()=>{if(!o)return;const e=()=>{var a,r,c,k;y.current?document.hidden?(a=w.current)==null||a.stop():(r=w.current)==null||r.start():document.hidden?(c=p.current)==null||c.pause():(k=p.current)==null||k.resume()};return document.addEventListener("visibilitychange",e),()=>document.removeEventListener("visibilitychange",e)},[o]);const x=h.useCallback(()=>{const e=i.current;if(!e)return;const a=e.scrollHeight-e.clientHeight;if(a<=0){E([]);return}E(ee.map(r=>{const c=e.querySelector("#"+r.id),k=c?c.offsetTop-e.clientHeight*.42:0;return{label:r.anchor,pct:Math.min(100,Math.max(0,k/a*100))}}))},[]);h.useLayoutEffect(()=>{x();const e=setTimeout(x,400);return window.addEventListener("resize",x),()=>{clearTimeout(e),window.removeEventListener("resize",x)}},[x]),h.useEffect(()=>{const e=i.current;if(!e)return;let a=0;const r=()=>{a||(a=requestAnimationFrame(()=>{a=0;const c=e.scrollHeight-e.clientHeight;d(c>0?e.scrollTop/c*100:0)}))};return e.addEventListener("scroll",r,{passive:!0}),r(),()=>{e.removeEventListener("scroll",r),a&&cancelAnimationFrame(a)}},[]),h.useEffect(()=>{if(!f.length)return;let e=-1;f.forEach((a,r)=>{s>=a.pct-.5&&(e=r)}),I(e)},[s,f]),h.useEffect(()=>{const e=i.current;if(!e)return;const a=()=>e.querySelectorAll(".her-rv:not(.is-in)");if(b.current||!("IntersectionObserver"in window)){a().forEach(v=>v.classList.add("is-in"));return}const r=new IntersectionObserver(v=>{v.forEach(N=>{N.isIntersecting&&(N.target.classList.add("is-in"),r.unobserve(N.target))})},{root:e,rootMargin:"0px 0px -12% 0px",threshold:.08});e.querySelectorAll(".her-rv").forEach(v=>r.observe(v));let c=0;const k=()=>{c||(c=requestAnimationFrame(()=>{c=0;const v=a();if(!v.length)return;const N=e.clientHeight;v.forEach(R=>{R.getBoundingClientRect().top<N*.92&&(R.classList.add("is-in"),r.unobserve(R))})}))};return e.addEventListener("scroll",k,{passive:!0}),()=>{r.disconnect(),e.removeEventListener("scroll",k),c&&cancelAnimationFrame(c)}},[]);const P=()=>{var e;return(e=i.current)==null?void 0:e.scrollTo({top:0,behavior:b.current?"auto":"smooth"})};return t.jsxs("div",{ref:i,className:"her-root fixed inset-0 z-[300] overflow-y-auto overflow-x-hidden",children:[t.jsx("style",{children:ae}),t.jsx("div",{className:"her-grain","aria-hidden":"true"}),t.jsxs("button",{onClick:n,title:"Back",className:"her-chip her-back",children:[t.jsx("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2.2,children:t.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19l-7-7 7-7"})}),t.jsx("span",{className:"hidden sm:inline",children:"Back"})]}),t.jsxs("button",{onClick:T,className:"her-chip her-music"+(o?" is-on":""),title:o?l?`${l.title} — ${l.artist}. Turn the music off`:"Turn the music off":"Turn the music on","aria-pressed":o,children:[t.jsxs("span",{className:"her-bars","aria-hidden":"true",children:[t.jsx("i",{}),t.jsx("i",{}),t.jsx("i",{})]}),t.jsx("span",{className:"hidden sm:inline her-np",children:o?l?l.title:"Music on":"Music"})]}),t.jsx("div",{className:"her-topbar","aria-hidden":"true",children:t.jsx("span",{style:{width:s+"%"}})}),t.jsxs("div",{className:"her-rail","aria-hidden":"true",children:[t.jsx("span",{className:"her-rail-track"}),t.jsx("span",{className:"her-rail-fill",style:{height:s+"%"}}),f.map((e,a)=>t.jsxs("span",{className:"her-tick"+(a<=A?" is-on":""),style:{top:e.pct+"%"},children:[t.jsx("i",{}),t.jsx("em",{children:e.label})]},e.label))]}),t.jsxs("header",{className:"her-open",children:[t.jsxs("span",{className:"her-ripple","aria-hidden":"true",children:[t.jsx("i",{}),t.jsx("i",{}),t.jsx("i",{})]}),t.jsx("p",{className:"her-open-eyebrow",children:"A true story, still going"}),t.jsx("h1",{className:"her-title",children:"Five Years"}),t.jsx("p",{className:"her-open-dates",children:"2021  —  13 July 2026"}),t.jsx("span",{className:"her-scroll","aria-hidden":"true",children:t.jsx("i",{})})]}),t.jsxs("main",{className:"her-body",children:[O.map(e=>t.jsxs("section",{id:e.id,className:"her-chapter",children:[t.jsx("p",{className:"her-rv her-eyebrow",children:e.eyebrow}),e.blocks.map((a,r)=>a.t==="rule"?t.jsx("span",{className:"her-rv her-rule","aria-hidden":"true"},r):a.t==="video"?t.jsx(te,{id:a.id,caption:a.caption},r):a.t==="te"?t.jsx("p",{className:"her-rv her-te",children:a.text},r):a.t==="em"?t.jsx("p",{className:"her-rv her-em",children:C(a.text)},r):a.t==="beat"?t.jsx("p",{className:"her-rv her-beat",children:C(a.text)},r):a.t==="close"?t.jsx("p",{className:"her-rv her-close",children:C(a.text)},r):a.t==="list"?t.jsx("ul",{className:"her-rv her-list",children:a.items.map((c,k)=>t.jsx("li",{children:C(c)},k))},r):t.jsx("p",{className:"her-rv her-p",children:C(a.text)},r))]},e.id)),t.jsxs("footer",{className:"her-foot",children:[t.jsx("button",{onClick:P,className:"her-again",children:"Read it again"}),t.jsx("p",{className:"her-foot-note",children:"kranthikiran.com · unlisted"})]})]})]})}const ae=`
  /* Warm paper, not a screen. The colour is pushed out to the edges and
     corners so the middle — where every line of text actually sits — stays
     bright and easy to read. */
  .her-root {
    background:
      radial-gradient(48% 30% at 50% -4%,  rgba(246,176,190,0.46) 0%, transparent 70%),
      radial-gradient(40% 30% at -8% 18%,  rgba(252,206,168,0.42) 0%, transparent 72%),
      radial-gradient(40% 32% at 108% 44%, rgba(204,184,240,0.36) 0%, transparent 72%),
      radial-gradient(46% 30% at -6% 86%,  rgba(164,214,190,0.38) 0%, transparent 72%),
      radial-gradient(40% 26% at 106% 94%, rgba(248,186,196,0.36) 0%, transparent 72%),
      linear-gradient(176deg, #fffdfc 0%, #fdf7f4 52%, #fbf2ee 100%);
    color: ${$};
    -webkit-font-smoothing: antialiased;
  }
  .her-root::-webkit-scrollbar { width: 0; height: 0; }
  .her-root { scrollbar-width: none; }

  /* The faintest tooth, so the background reads as paper rather than a flat fill. */
  .her-grain {
    position: fixed; inset: 0; pointer-events: none; z-index: 2; opacity: 0.5;
    background-image:
      radial-gradient(rgba(120,90,86,0.028) 1px, transparent 1px),
      radial-gradient(rgba(120,90,86,0.018) 1px, transparent 1px);
    background-size: 3px 3px, 7px 7px;
    background-position: 0 0, 2px 3px;
  }

  .her-chip {
    position: fixed; top: 1rem; z-index: 30;
    display: inline-flex; align-items: center; gap: 0.45rem;
    padding: 0.44rem 0.85rem; border-radius: 999px;
    font-family: 'Sora', system-ui, sans-serif;
    font-size: 0.8rem; font-weight: 500;
    color: ${z};
    background: rgba(255,255,255,0.8);
    border: 1px solid rgba(194,86,110,0.28);
    box-shadow: 0 2px 14px rgba(150,70,85,0.10);
    backdrop-filter: blur(10px);
    transition: transform 0.22s ease, background 0.22s ease, box-shadow 0.22s ease;
  }
  .her-chip:hover { transform: translateY(-1px); background: #fff; box-shadow: 0 5px 20px rgba(150,70,85,0.18); }
  .her-back { left: 1rem; }
  .her-music { right: 1rem; }
  .her-music.is-on { background: rgba(194,86,110,0.16); border-color: rgba(194,86,110,0.5); }
  /* Track titles vary in length; keep the chip from stretching across the page. */
  .her-np { max-width: 11rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  /* Three little bars that only move while the music is actually playing. */
  .her-bars { display: inline-flex; align-items: flex-end; gap: 2px; height: 11px; }
  .her-bars > i { width: 2px; height: 4px; border-radius: 1px; background: currentColor; opacity: 0.7; }
  .her-music.is-on .her-bars > i { animation: herBar 1.25s ease-in-out infinite; opacity: 1; }
  .her-music.is-on .her-bars > i:nth-child(2) { animation-delay: 0.18s; }
  .her-music.is-on .her-bars > i:nth-child(3) { animation-delay: 0.36s; }
  @keyframes herBar {
    0%, 100% { height: 3px; }
    50%      { height: 11px; }
  }

  .her-topbar {
    position: fixed; top: 0; left: 0; right: 0; height: 2px; z-index: 25;
    background: rgba(120,90,86,0.08);
  }
  .her-topbar > span {
    display: block; height: 100%;
    background: linear-gradient(90deg, rgba(194,86,110,0.5), ${S});
  }
  @media (min-width: 1024px) { .her-topbar { display: none; } }

  .her-rail { display: none; }
  @media (min-width: 1024px) {
    .her-rail {
      display: block; position: fixed; z-index: 25;
      left: 3.25rem; top: 16vh; bottom: 16vh; width: 1px;
    }
    .her-rail-track { position: absolute; inset: 0; background: rgba(120,90,86,0.16); }
    .her-rail-fill {
      position: absolute; top: 0; left: 0; width: 1px;
      background: linear-gradient(180deg, rgba(194,86,110,0.45), ${S});
    }
    .her-tick { position: absolute; left: 0; transform: translateY(-50%); }
    .her-tick > i {
      position: absolute; left: -2.5px; top: -2.5px;
      width: 5px; height: 5px; border-radius: 50%;
      background: rgba(120,90,86,0.26);
      transition: background 0.45s ease, box-shadow 0.45s ease, transform 0.45s ease;
    }
    .her-tick > em {
      position: absolute; left: 0.9rem; top: -0.52rem;
      font-family: 'JetBrains Mono', monospace; font-style: normal;
      font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
      white-space: nowrap; color: rgba(65,54,52,0.52);
      transition: color 0.45s ease;
    }
    .her-tick.is-on > i {
      background: ${S}; transform: scale(1.5);
      box-shadow: 0 0 0 4px rgba(194,86,110,0.18);
    }
    .her-tick.is-on > em { color: ${z}; }
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
    border-radius: 50%; border: 1px solid rgba(194,86,110,0.62);
    opacity: 0; animation: herRipple 5s cubic-bezier(.16,.7,.3,1) both;
  }
  .her-ripple > i:nth-child(2) { animation-delay: 0.7s; }
  .her-ripple > i:nth-child(3) { animation-delay: 1.4s; }
  @keyframes herRipple {
    0%   { opacity: 0;   transform: scale(0.2); }
    18%  { opacity: 0.8; }
    100% { opacity: 0;   transform: scale(15); }
  }

  .her-open > :not(.her-ripple) { opacity: 0; animation: herRise 1.4s cubic-bezier(.22,.61,.36,1) forwards; }
  .her-open-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; letter-spacing: 0.34em; text-transform: uppercase;
    color: ${z}; margin-bottom: 1.6rem;
    animation-delay: 3.4s;
  }
  .her-title {
    font-family: 'Newsreader', Georgia, serif; font-weight: 300;
    font-size: clamp(3rem, 15vw, 7.5rem); line-height: 0.95; letter-spacing: -0.02em;
    background: linear-gradient(100deg, #8f2f4c 0%, ${S} 38%, #d9705f 64%, #a03a55 100%);
    background-size: 200% auto;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
    animation-delay: 3.8s;
  }
  .her-open-dates {
    margin-top: 1.9rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: clamp(10px, 2.6vw, 12px); letter-spacing: 0.3em;
    color: rgba(65,54,52,0.76);
    animation-delay: 4.4s;
  }
  .her-scroll { margin-top: 4.5rem; display: block; animation-delay: 5.1s; }
  .her-scroll > i {
    display: block; width: 1px; height: 46px;
    background: linear-gradient(180deg, ${S}, transparent);
    animation: herDrop 2.8s ease-in-out infinite;
  }
  @keyframes herDrop {
    0%, 100% { opacity: 0.3; transform: translateY(-5px); }
    50%      { opacity: 1;   transform: translateY(5px); }
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
    color: ${z};
    margin-bottom: 2.4rem; padding-bottom: 0.9rem;
    border-bottom: 1px solid rgba(194,86,110,0.26);
  }

  .her-p, .her-beat, .her-em, .her-close, .her-list, .her-te {
    font-family: 'Newsreader', Georgia, serif; font-weight: 400;
  }
  .her-p {
    font-size: clamp(1.12rem, 3vw, 1.3rem); line-height: 1.86;
    margin: 0 0 1.55rem; color: ${$};
  }
  .her-beat {
    font-size: clamp(1.2rem, 3.4vw, 1.48rem); line-height: 1.62;
    margin: 0 0 1.55rem; color: ${q};
  }
  .her-list { list-style: none; margin: 0 0 1.8rem; padding: 0; }
  .her-list li {
    position: relative; padding-left: 1.5rem; margin-bottom: 1rem;
    font-size: clamp(1.08rem, 2.9vw, 1.24rem); line-height: 1.74;
    color: ${$};
  }
  .her-list li::before {
    content: ''; position: absolute; left: 0; top: 0.74em;
    width: 0.7rem; height: 1px; background: ${S};
  }

  .her-em {
    font-weight: 300; font-style: italic;
    font-size: clamp(1.5rem, 5.2vw, 2.15rem); line-height: 1.42;
    margin: 2.9rem 0 2.9rem; text-align: center;
    color: ${z};
  }

  /* Telugu, WhatsApp style — Roman letters, not the script. It sits at the
     peaks, gets more air than anything else, and takes a small mark above it
     so it reads as the line the paragraph was walking towards. */
  .her-te {
    font-weight: 300; font-style: italic;
    font-size: clamp(1.32rem, 4.6vw, 1.88rem); line-height: 1.62;
    margin: 3.4rem 0 3.4rem; text-align: center;
    color: ${z};
  }
  .her-te::before {
    content: ''; display: block; width: 4px; height: 4px; border-radius: 50%;
    margin: 0 auto 1.6rem; background: ${S};
    box-shadow: 0 0 0 5px rgba(194,86,110,0.16);
  }

  .her-close {
    font-weight: 300; font-style: italic;
    font-size: clamp(1.55rem, 5.6vw, 2.35rem); line-height: 1.38;
    margin: 2.4rem 0 0; text-align: center;
    background: linear-gradient(100deg, #8f2f4c 0%, ${S} 48%, #d9705f 100%);
    background-size: 200% auto;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
  }

  .her-p em, .her-beat em, .her-list em { font-style: italic; color: ${q}; }

  .her-rule {
    display: block; width: 2.6rem; height: 1px; margin: 2.6rem auto;
    background: rgba(194,86,110,0.5);
  }

  /* ---- the reel ---- */
  .her-reel { margin: 2.6rem auto 3rem; max-width: 15.5rem; }
  .her-reel-frame {
    position: relative; aspect-ratio: 9 / 16; overflow: hidden;
    border-radius: 1.1rem;
    background: rgba(120,90,86,0.07);
    border: 1px solid rgba(194,86,110,0.3);
    box-shadow: 0 10px 30px rgba(150,70,85,0.18);
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
    background: rgba(255,255,255,0.94); color: ${z};
    box-shadow: 0 4px 18px rgba(80,40,45,0.32);
    transition: transform 0.25s ease;
  }
  .her-reel-play > svg { width: 1.5rem; height: 1.5rem; margin-left: 2px; }
  .her-reel-frame > button:hover .her-reel-play { transform: translate(-50%,-50%) scale(1.08); }
  .her-reel-cap {
    margin-top: 0.85rem; text-align: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase;
    color: rgba(65,54,52,0.72); line-height: 1.7;
  }

  .her-rv { opacity: 0; transform: translateY(14px); transition: opacity 0.9s ease, transform 0.9s cubic-bezier(.22,.61,.36,1); }
  .her-rv.is-in { opacity: 1; transform: none; }

  /* ---- footer ---- */
  .her-foot { max-width: 34rem; margin: 0 auto; padding: 6rem 0 7rem; text-align: center; }
  .her-again {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; letter-spacing: 0.26em; text-transform: uppercase;
    color: ${z};
    padding: 0.7rem 1.4rem; border-radius: 999px;
    border: 1px solid rgba(194,86,110,0.38);
    background: rgba(255,255,255,0.6);
    transition: background 0.25s ease, transform 0.25s ease;
  }
  .her-again:hover { background: rgba(194,86,110,0.14); transform: translateY(-1px); }
  .her-foot-note {
    margin-top: 2.2rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase;
    color: rgba(65,54,52,0.5);
  }

  @media (prefers-reduced-motion: reduce) {
    .her-ripple > i { animation: none; opacity: 0; }
    .her-open > :not(.her-ripple) { animation: none; opacity: 1; transform: none; }
    .her-scroll > i { animation: none; opacity: 0.5; }
    .her-rv { opacity: 1; transform: none; transition: none; }
    .her-music.is-on .her-bars > i { animation: none; height: 7px; }
  }
`;export{re as default};
