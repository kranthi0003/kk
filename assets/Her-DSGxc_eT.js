import{r as u,u as U,j as t}from"./index-BCjkhFhT.js";const H=[146.83,164.81,185,220,246.94,293.66,329.63,369.99,440,493.88,587.33,659.25,739.99],Z=[73.42,110,146.83],X=.16,ee=5,te=2.2;function ae(){let a=null,s=null,y=0,n=!1;const g=[];function E(){const l=window.AudioContext||window.webkitAudioContext;if(!l)return!1;a=new l,s=a.createGain(),s.gain.value=1e-4;const h=a.createBiquadFilter();h.type="lowpass",h.frequency.value=1250,h.Q.value=.4;const d=a.createDelay(1.5);d.delayTime.value=.66;const c=a.createGain();c.gain.value=.33;const x=a.createGain();return x.gain.value=.26,s.connect(h),h.connect(a.destination),h.connect(d),d.connect(c),c.connect(d),d.connect(x),x.connect(a.destination),Z.forEach((w,I)=>{const p=a.createOscillator();p.type="sine",p.frequency.value=w,p.detune.value=(I-1)*3;const b=a.createGain(),v=.075/(I+1.4);b.gain.value=v;const m=a.createOscillator();m.frequency.value=.045+I*.019;const N=a.createGain();N.gain.value=v*.45,m.connect(N),N.connect(b.gain),p.connect(b),b.connect(s),p.start(),m.start(),g.push(p,m)}),!0}function Y(){if(!a||!n)return;const l=a.currentTime,h=H[Math.floor(Math.random()*H.length)],d=a.createOscillator();d.type="triangle",d.frequency.value=h;const c=a.createGain(),x=.05+Math.random()*.045;if(c.gain.setValueAtTime(1e-4,l),c.gain.exponentialRampToValueAtTime(x,l+1.7),c.gain.exponentialRampToValueAtTime(1e-4,l+7),d.connect(c),a.createStereoPanner){const w=a.createStereoPanner();w.pan.value=(Math.random()*2-1)*.55,c.connect(w),w.connect(s)}else c.connect(s);d.start(l),d.stop(l+7.5),d.onended=()=>{try{d.disconnect(),c.disconnect()}catch{}}}function A(){clearTimeout(y),n&&(Y(),y=setTimeout(A,3200+Math.random()*4200))}return{supported(){return!!(window.AudioContext||window.webkitAudioContext)},start(){if(!a&&!E())return!1;n=!0,a.state==="suspended"&&a.resume();const l=a.currentTime;return s.gain.cancelScheduledValues(l),s.gain.setValueAtTime(Math.max(s.gain.value,1e-4),l),s.gain.exponentialRampToValueAtTime(X,l+ee),A(),!0},stop(){if(n=!1,clearTimeout(y),!a)return;const l=a.currentTime;s.gain.cancelScheduledValues(l),s.gain.setValueAtTime(Math.max(s.gain.value,1e-4),l),s.gain.exponentialRampToValueAtTime(1e-4,l+te)},destroy(){if(n=!1,clearTimeout(y),g.forEach(l=>{try{l.stop()}catch{}}),g.length=0,a)try{a.close()}catch{}a=null,s=null}}}const _=[{title:"The Metro Proposal",artist:"Sai Abhyankkar",ids:["WmtSLESSWvQ"]},{title:"Puthu Mazha",artist:"Shakthisree Gopalan",ids:["N1ksAnmfuaE","N6nLPuLZRZA","gFLX3WBHozM","hxdZohfPCuw"]},{title:"Vizhi Veekura",artist:"Sai Abhyankkar",ids:["tcBOgmhVEZ4","e4NPe5RaOe0","DktsNAWQp7A","Wb9S7saKoT8"]}],C=32,P=7e3,L=2500,re=1600,D=100,ne=a=>Math.pow(a,1.7),oe=a=>1-Math.pow(1-a,1.7);function ie(){return new Promise((a,s)=>{if(window.YT&&window.YT.Player)return a();if(!document.getElementById("yt-iframe-api")){const g=document.createElement("script");g.id="yt-iframe-api",g.src="https://www.youtube.com/iframe_api",g.onerror=()=>s(new Error("yt api blocked")),document.head.appendChild(g)}let y=0;const n=setInterval(()=>{window.YT&&window.YT.Player?(clearInterval(n),a()):(y+=200)>12e3&&(clearInterval(n),s(new Error("yt api timeout")))},200)})}function se({onTrack:a,onFail:s,onMuted:y}={}){let n=null,g=null,E=null,Y=0,A=0,l=0,h=!1,d=!1,c=!1,x=!1,w=!1,I=!1;const p=()=>{try{a&&a(h?_[A]:null)}catch{}try{y&&y(h&&c)}catch{}},b=()=>{E&&(clearInterval(E),E=null)},v=o=>{Y=Math.max(0,Math.min(100,Math.round(o)));try{n&&n.setVolume(Y)}catch{}},m=(o,k,S)=>{if(b(),!n)return;const q=Y,Q=o>=q,W=Math.max(1,Math.round(k/D));let O=0;E=setInterval(()=>{O+=1;const G=O/W;v(q+(o-q)*(Q?ne(G):oe(G))),O>=W&&(b(),S&&S())},D)},N=o=>{if(!n||w)return;const k=_[A];if(!k)return;const S=k.ids[l];if(!S){M(o);return}v(0);try{n.loadVideoById(S)}catch{return}p(),m(C,d?o:P)},M=o=>{l=0,A=(A+1)%_.length,N(o)},$=["pointerdown","touchstart","keydown","click","wheel","scroll"];let j=!1;const B=()=>{if(!(!n||!h||!c||w)){try{v(0),n.unMute(),n.playVideo()}catch{return}setTimeout(()=>{if(!n||w||!c)return;let o=!0;try{o=n.isMuted()}catch{}o||(c=!1,d=!0,e(),p(),m(C,P))},220)}},e=()=>{j&&(j=!1,$.forEach(o=>{try{window.removeEventListener(o,B,!0)}catch{}}))},r=()=>{j||w||(j=!0,$.forEach(o=>{try{window.addEventListener(o,B,{capture:!0,passive:!0})}catch{}}))};let i=0;const f=()=>{if(i+=1,i>_.reduce((o,k)=>o+k.ids.length,0)){h=!1,p();try{s&&s()}catch{}return}l+=1,l>=_[A].ids.length?M(L):N(L)},T=async()=>{if(!(I||n||w)){I=!0;try{await ie()}catch{I=!1;try{s&&s()}catch{}return}if(w){I=!1;return}g=document.createElement("div"),g.setAttribute("aria-hidden","true"),g.style.cssText="position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none",document.body.appendChild(g),n=new window.YT.Player(g,{videoId:_[0].ids[0],playerVars:{autoplay:0,mute:1,controls:0,disablekb:1,fs:0,modestbranding:1,playsinline:1,rel:0,iv_load_policy:3},events:{onReady:o=>{if(v(0),!!h){try{o.target.mute(),o.target.playVideo()}catch{}if(x){c=!1;try{o.target.unMute()}catch{}p(),m(C,P)}else c=!0,p(),r()}},onStateChange:o=>{const k=window.YT;o.data===k.PlayerState.PLAYING?(i=0,c||(d=!0)):o.data===k.PlayerState.ENDED&&(l=0,M(L))},onError:()=>{h&&f()}}}),I=!1}};return{tracks:_,autostart(){n||w||(h=!0,x=!1,T())},start(){if(h=!0,x=!0,!n)return T(),!0;if(c){c=!1;try{n.unMute()}catch{}}let o=0;try{o=n.getCurrentTime()||0}catch{}try{n.playVideo()}catch{}return e(),p(),m(C,o>0&&d?L:P),!0},unmute(){if(!n||!c)return;const o=!d;c=!1,d=!0,e();try{v(0),n.unMute(),n.playVideo()}catch{}p(),m(C,o?P:L)},stop(){h=!1,c=!1,e(),p(),m(0,re,()=>{try{n&&n.pauseVideo()}catch{}})},pause(){b();try{n&&n.pauseVideo()}catch{}},resume(){if(!(!h||!n)){try{n.playVideo()}catch{}c||m(C,L)}},destroy(){w=!0,h=!1,e(),b();try{n&&n.destroy()}catch{}try{g&&g.remove()}catch{}n=null,g=null}}}const z="#c2566e",R="#a03a55",F="#413634",J="#241d1c",K=[{id:"c-2021",eyebrow:"2021",anchor:"2021",blocks:[{t:"beat",text:"I was twenty-one."},{t:"p",text:"Final year of college. That season when everyone is quietly frightened and pretending to be bored."},{t:"p",text:"I had come to your college that day for some small work. A form to submit, a signature to collect — I have honestly forgotten which. The kind of errand that leaves nothing behind. You stand in a corridor. A fan turns slowly overhead. Somewhere down the hall a pair of slippers slaps against the floor. Outside, the afternoon is white and far too bright, and the person you came for is on a tea break."},{t:"p",text:"That was the whole day. There was nothing in it worth keeping."},{t:"beat",text:"And then you walked past."},{t:"te",text:"Aa kshanam naaku teliyaledu… adi aidellu naa venta untundani."},{t:"p",text:"I should say plainly how small it was, because that is the part that matters."},{t:"em",text:"Nothing happened."},{t:"p",text:"Nobody spoke. There was no introduction, no hello, no name, no number, no reason to stop and no reason to look twice. You were in front of me for a few seconds, and then the corridor closed over the place where you had been, the way water closes over a stone."},{t:"p",text:"I have had five years to find a better sentence for those few seconds, and I still do not have one. The closest I can come is this — you looked like someone who had wandered in from a kinder world by mistake, and had not yet realised she was in the wrong one."},{t:"p",text:"Then you were gone. Back to being a stranger. And I went back to my form, and my corridor, and my slow fan."},{t:"p",text:"That should have been the end of it. In every reasonable sense, that _was_ the end of it. Cities are full of faces you see once."},{t:"rule"},{t:"p",text:"But here is the thing I have never been able to explain."},{t:"p",text:"A memory is supposed to earn its place. Something has to happen first — a conversation, a quarrel, a joke, a night that went on too long. The mind keeps whatever has a story attached to it, and quietly throws away the rest."},{t:"p",text:"That one had nothing attached to it. No name. No story. Nowhere to keep it."},{t:"te",text:"Peru teliyadu. Katha ledu. Ayina gurthundipoyindi."},{t:"em",text:"It stayed anyway."}]},{id:"c-after",eyebrow:"The years in between",blocks:[{t:"p",text:"I finished college. Everyone does."},{t:"p",text:"Life picked up speed the way it does at twenty-two. The first job. The first city that is not your parents’. The first month where the money finishes before the month does."},{t:"p",text:"And I did not think about you. I want to be honest about that, because the honest version of this is better than the beautiful one, and you deserve the honest one."},{t:"p",text:"You were not a longing. I was not waiting for anybody. I had no photograph, no name, no way of finding you, and no intention of looking."},{t:"p",text:"You were something much smaller than that. A face without a story. A song heard once from a passing auto — you can still hum it, you cannot name it, and you know you will never find it again."},{t:"p",text:"Months went by like that. Then a year. Then more."},{t:"beat",text:"Which is to say — normally."}]},{id:"c-2022",eyebrow:"2022",anchor:"2022",blocks:[{t:"p",text:"Then I joined Amazon."},{t:"p",text:"And one ordinary day, in the middle of ordinary work, I found out you were there too."},{t:"te",text:"Inta pedda prapanchamlo… malli nuvve."},{t:"p",text:"I remember exactly how absurd it felt. A company with more than a million people inside it, spread across the entire world. And somewhere in all of that was the one stranger I had never quite managed to put down."},{t:"p",text:"Not only there — doing, of all things, more or less the same work I was doing."},{t:"beat",text:"I was in Hyderabad. You were in Bangalore."},{t:"p",text:"Close enough to be real. Far enough to be nothing."},{t:"p",text:"I sat with that for a long time. It was not excitement exactly. It was something quieter — the feeling of walking past a wall you have passed for years, and noticing, for the first time, that it was a door."}]},{id:"c-2023",eyebrow:"2023",anchor:"2023",blocks:[{t:"p",text:"So I did what anybody does when life hands him a convenient excuse."},{t:"beat",text:"I used it."},{t:"p",text:"Work first. Work questions, work things, the small administrative traffic of two people inside the same enormous machine. And then, slowly, Instagram."},{t:"p",text:"They were light conversations. Genuinely light. Nothing intense, nothing romantic, nothing either of us ever had to name or define or be careful about. A message here. A reply there. Long silences in between, and neither of us minded them."},{t:"p",text:"I was not building towards anything. I do not think I had a plan at all. I only liked that after all those years there was suddenly a door where there had never been a door."},{t:"beat",text:"And then I found out you were with someone."},{t:"te",text:"Aa talupu naadi kaadu."}]},{id:"c-stopped",eyebrow:"What I did about it",blocks:[{t:"em",text:"I stopped."},{t:"p",text:"There was no scene and no speech, because there was nothing to make a scene about. You had a life, and it was full, and I had arrived years late holding a memory that belonged to nobody but me."},{t:"p",text:"So I stepped back out of it. Quietly. Without making it your problem, and without becoming the kind of man who makes himself an interesting complication in somebody else’s relationship."},{t:"p",text:"I have thought about that decision many times since, and I still believe it was the only decent one available."},{t:"p",text:"Some doors you do not knock on twice. You are told they belong to someone else, and you go home."},{t:"p",text:"That felt like the end."},{t:"beat",text:"And for years, it was."}]},{id:"c-middle",eyebrow:"The quiet years",blocks:[{t:"p",text:"Life went on being life."},{t:"p",text:"I worked. I moved. I was in a relationship of my own, and it was fine, and it ended, and even now I cannot say anything more interesting about it than that. It existed. It never quite landed."},{t:"p",text:"I am not going to pretend that had anything to do with you. It did not, and it would be unfair of me to hand you that weight. You were not in my head. You were not a standard anyone was being measured against."},{t:"p",text:"I only noticed, somewhere in those years, that I was not particularly curious about anybody. Not the way I had once been curious, for a few seconds at twenty-one, about a person whose name I did not even know."},{t:"p",text:"You never became an obsession. You became something quieter, and far more stubborn."},{t:"beat",text:"An unfinished sentence."},{t:"beat",text:"A door I had now walked past twice without ever finding out what was behind it."}]},{id:"c-2026",eyebrow:"2026",anchor:"2026",blocks:[{t:"p",text:"I had deactivated Instagram for a while — one of those small acts of self-preservation everyone performs eventually."},{t:"p",text:"Months later, I came back."},{t:"p",text:"And your profile surfaced. Unasked. The way these things do."},{t:"p",text:"I looked. Of course I looked — the way anyone looks at a name they have not seen in years."},{t:"p",text:"And somewhere in that looking, a thought arrived that I had not allowed myself in a very long time."},{t:"em",text:"What if the timing is different now?"},{t:"p",text:"I had no evidence. I had no business assuming anything, and I knew it. I was not reading fate into it. I was not building a case."},{t:"p",text:"What I had was about one percent."},{t:"p",text:"One percent is nothing. It is a rounding error. Anywhere else in life, those are odds you would laugh at."},{t:"te",text:"Oka shaatam chaalu."},{t:"beat",text:"It turned out to be enough."},{t:"p",text:"I sent a follow request."},{t:"p",text:"I remember how ordinary it felt to press that, and exactly how much it was not. Five years of never once having a reason to say hello, and in the end it came down to one small button."},{t:"beat",text:"You accepted immediately."}]},{id:"c-july",eyebrow:"13 July 2026",anchor:"13 Jul",blocks:[{t:"p",text:"So I messaged you."},{t:"p",text:"I would like to report that I was calm about it."},{t:"p",text:"Five years of a face I could not explain, and it came down to a few typed sentences and one held breath."},{t:"beat",text:"You replied."},{t:"beat",text:"It went well."},{t:"te",text:"Aidella taruvaata… modatisaari maatladaam."},{t:"p",text:"And that is the moment this stopped being a story about a coincidence. Because for the first time in five years, it stopped being something that was happening _to_ me."}]},{id:"c-now",eyebrow:"Where it leaves me",blocks:[{t:"p",text:"You have known me for about a month."},{t:"p",text:"I have known _of_ you for five years."},{t:"p",text:"I am aware of how uneven that is. I know it is not your fault, and not yours to carry. You have had four weeks. I have had half a decade of a face I could not place and a coincidence I could not explain — and none of that is a debt you ever agreed to."},{t:"p",text:"But three times now, life has put you in front of me."},{t:"list",items:["Once when I was twenty-one, and I had nothing to say.","Once inside a company of a million people, when the timing belonged to someone else.","And now — which is the first time I have actually had any say in it."]},{t:"p",text:"So I am going to use it. As gently as I know how."},{t:"te",text:"Okaru chepparu… nachithey cheppeyamani."},{t:"video",id:"IHs8J7blJlQ",caption:"Charles Leclerc, to a fan who asked him what to do"},{t:"em",text:"I like you. I would like to see where this goes."},{t:"p",text:"That is the whole sentence. There is nothing underneath it. Not _I waited, so you owe me something._ Not a declaration, not a demand, nothing you have to answer today or answer at all."},{t:"p",text:"And if the answer is no, then it is no — genuinely, with no hard feelings and nothing awkward left for you to manage. I would rather have asked than spend another five years being someone who almost did."},{t:"rule"},{t:"te",text:"Innellu nuvvu naaku oka kshanam. Ippudu oka avakaasam."},{t:"beat",text:"For five years you were a few seconds I could not explain."},{t:"close",text:"I would like to find out what else you are."}]}],le=K.filter(a=>a.anchor);function V(a){return a.includes("_")?a.split(/_([^_]+)_/g).map((s,y)=>y%2?t.jsx("em",{children:s},y):s):a}function ce({id:a,caption:s}){const[y,n]=u.useState(!1);return t.jsxs("div",{className:"her-rv her-reel",children:[t.jsx("div",{className:"her-reel-frame",children:y?t.jsx("iframe",{src:`https://www.youtube-nocookie.com/embed/${a}?autoplay=1&rel=0&playsinline=1`,title:s||"Clip",loading:"lazy",allowFullScreen:!0,allow:"accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"}):t.jsxs("button",{type:"button",onClick:()=>n(!0),"aria-label":"Play the clip",children:[t.jsx("img",{src:`https://i.ytimg.com/vi/${a}/hqdefault.jpg`,alt:"",loading:"lazy"}),t.jsx("span",{className:"her-reel-play","aria-hidden":"true",children:t.jsx("svg",{viewBox:"0 0 24 24",fill:"currentColor",children:t.jsx("path",{d:"M8 5.5v13l11-6.5z"})})})]})}),s?t.jsx("p",{className:"her-reel-cap",children:s}):null]})}function ue({onBack:a}){const s=u.useRef(null),[y,n]=u.useState(0),[g,E]=u.useState([]),[Y,A]=u.useState(-1),[l,h]=u.useState(!1),[d,c]=u.useState(null),[x,w]=u.useState(!1),I=u.useRef(!1),p=u.useRef(null),b=u.useRef(null),v=u.useRef(!1),m=U();u.useEffect(()=>{var e;I.current=typeof window<"u"&&((e=window.matchMedia)==null?void 0:e.call(window,"(prefers-reduced-motion: reduce)").matches)},[]),u.useEffect(()=>{var e;return(e=m==null?void 0:m.setSuppressed)==null||e.call(m,!0),()=>{var r;return(r=m==null?void 0:m.setSuppressed)==null?void 0:r.call(m,!1)}},[m]),u.useEffect(()=>()=>{var e,r,i,f;(r=(e=p.current)==null?void 0:e.destroy)==null||r.call(e),(f=(i=b.current)==null?void 0:i.destroy)==null||f.call(i)},[]);const N=u.useCallback(()=>{b.current||(b.current=ae()),b.current.start()?(v.current=!0,h(!0)):(v.current=!1,h(!1)),c(null)},[]),M=u.useCallback(()=>(p.current||(p.current=se({onTrack:c,onMuted:w,onFail:N})),p.current),[N]);u.useEffect(()=>{let e=!1;try{e=sessionStorage.getItem("her_music_off")==="1"}catch{}if(e)return;M().autostart(),h(!0)},[M]);const $=u.useCallback(()=>{var e,r,i,f;if(l&&x&&!v.current){(e=p.current)==null||e.unmute();return}if(l){v.current?(r=b.current)==null||r.stop():(i=p.current)==null||i.stop(),h(!1),c(null),w(!1);try{sessionStorage.setItem("her_music_off","1")}catch{}return}try{sessionStorage.removeItem("her_music_off")}catch{}if(v.current){(f=b.current)!=null&&f.start()&&h(!0);return}M().start()&&h(!0)},[l,x,M]);u.useEffect(()=>{if(!l)return;const e=()=>{var r,i,f,T;v.current?document.hidden?(r=b.current)==null||r.stop():(i=b.current)==null||i.start():document.hidden?(f=p.current)==null||f.pause():(T=p.current)==null||T.resume()};return document.addEventListener("visibilitychange",e),()=>document.removeEventListener("visibilitychange",e)},[l]);const j=u.useCallback(()=>{const e=s.current;if(!e)return;const r=e.scrollHeight-e.clientHeight;if(r<=0){E([]);return}E(le.map(i=>{const f=e.querySelector("#"+i.id),T=f?f.offsetTop-e.clientHeight*.42:0;return{label:i.anchor,pct:Math.min(100,Math.max(0,T/r*100))}}))},[]);u.useLayoutEffect(()=>{j();const e=setTimeout(j,400);return window.addEventListener("resize",j),()=>{clearTimeout(e),window.removeEventListener("resize",j)}},[j]),u.useEffect(()=>{const e=s.current;if(!e)return;let r=0;const i=()=>{r||(r=requestAnimationFrame(()=>{r=0;const f=e.scrollHeight-e.clientHeight;n(f>0?e.scrollTop/f*100:0)}))};return e.addEventListener("scroll",i,{passive:!0}),i(),()=>{e.removeEventListener("scroll",i),r&&cancelAnimationFrame(r)}},[]),u.useEffect(()=>{if(!g.length)return;let e=-1;g.forEach((r,i)=>{y>=r.pct-.5&&(e=i)}),A(e)},[y,g]),u.useEffect(()=>{const e=s.current;if(!e)return;const r=()=>e.querySelectorAll(".her-rv:not(.is-in)");if(I.current||!("IntersectionObserver"in window)){r().forEach(o=>o.classList.add("is-in"));return}const i=new IntersectionObserver(o=>{o.forEach(k=>{k.isIntersecting&&(k.target.classList.add("is-in"),i.unobserve(k.target))})},{root:e,rootMargin:"0px 0px -12% 0px",threshold:.08});e.querySelectorAll(".her-rv").forEach(o=>i.observe(o));let f=0;const T=()=>{f||(f=requestAnimationFrame(()=>{f=0;const o=r();if(!o.length)return;const k=e.clientHeight;o.forEach(S=>{S.getBoundingClientRect().top<k*.92&&(S.classList.add("is-in"),i.unobserve(S))})}))};return e.addEventListener("scroll",T,{passive:!0}),()=>{i.disconnect(),e.removeEventListener("scroll",T),f&&cancelAnimationFrame(f)}},[]);const B=()=>{var e;return(e=s.current)==null?void 0:e.scrollTo({top:0,behavior:I.current?"auto":"smooth"})};return t.jsxs("div",{ref:s,className:"her-root fixed inset-0 z-[300] overflow-y-auto overflow-x-hidden",children:[t.jsx("style",{children:he}),t.jsx("div",{className:"her-grain","aria-hidden":"true"}),t.jsxs("button",{onClick:a,title:"Back",className:"her-chip her-back",children:[t.jsx("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2.2,children:t.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19l-7-7 7-7"})}),t.jsx("span",{className:"hidden sm:inline",children:"Back"})]}),t.jsxs("button",{onClick:$,className:"her-chip her-music"+(l&&!x?" is-on":"")+(x?" is-silent":""),title:l?x?"Tap for sound":d?`${d.title} — ${d.artist}. Pause`:"Pause the music":"Turn the music on","aria-pressed":l&&!x,children:[t.jsxs("span",{className:"her-bars","aria-hidden":"true",children:[t.jsx("i",{}),t.jsx("i",{}),t.jsx("i",{})]}),t.jsx("span",{className:"hidden sm:inline her-np",children:l?x?"Tap for sound":d?d.title:"Music on":"Music"})]}),t.jsx("div",{className:"her-topbar","aria-hidden":"true",children:t.jsx("span",{style:{width:y+"%"}})}),t.jsxs("div",{className:"her-rail","aria-hidden":"true",children:[t.jsx("span",{className:"her-rail-track"}),t.jsx("span",{className:"her-rail-fill",style:{height:y+"%"}}),g.map((e,r)=>t.jsxs("span",{className:"her-tick"+(r<=Y?" is-on":""),style:{top:e.pct+"%"},children:[t.jsx("i",{}),t.jsx("em",{children:e.label})]},e.label))]}),t.jsxs("header",{className:"her-open",children:[t.jsxs("span",{className:"her-ripple","aria-hidden":"true",children:[t.jsx("i",{}),t.jsx("i",{}),t.jsx("i",{})]}),t.jsx("p",{className:"her-open-eyebrow",children:"A true story, still going"}),t.jsx("h1",{className:"her-title",children:"Five Years"}),t.jsx("p",{className:"her-open-dates",children:"2021  —  13 July 2026"}),t.jsx("span",{className:"her-scroll","aria-hidden":"true",children:t.jsx("i",{})})]}),t.jsxs("main",{className:"her-body",children:[K.map(e=>t.jsxs("section",{id:e.id,className:"her-chapter",children:[t.jsx("p",{className:"her-rv her-eyebrow",children:e.eyebrow}),e.blocks.map((r,i)=>r.t==="rule"?t.jsx("span",{className:"her-rv her-rule","aria-hidden":"true"},i):r.t==="video"?t.jsx(ce,{id:r.id,caption:r.caption},i):r.t==="te"?t.jsx("p",{className:"her-rv her-te",children:r.text},i):r.t==="em"?t.jsx("p",{className:"her-rv her-em",children:V(r.text)},i):r.t==="beat"?t.jsx("p",{className:"her-rv her-beat",children:V(r.text)},i):r.t==="close"?t.jsx("p",{className:"her-rv her-close",children:V(r.text)},i):r.t==="list"?t.jsx("ul",{className:"her-rv her-list",children:r.items.map((f,T)=>t.jsx("li",{children:V(f)},T))},i):t.jsx("p",{className:"her-rv her-p",children:V(r.text)},i))]},e.id)),t.jsxs("footer",{className:"her-foot",children:[t.jsx("button",{onClick:B,className:"her-again",children:"Read it again"}),t.jsx("p",{className:"her-foot-note",children:"kranthikiran.com · unlisted"})]})]})]})}const he=`
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
    color: ${F};
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
    color: ${R};
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
  /* Waiting for permission to be heard: breathe, so it reads as an invitation
     rather than as something already playing. */
  .her-music.is-silent { animation: herWaiting 2.6s ease-in-out infinite; }
  @keyframes herWaiting {
    0%, 100% { border-color: rgba(194,86,110,0.28); }
    50%      { border-color: rgba(194,86,110,0.7); }
  }
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
    background: linear-gradient(90deg, rgba(194,86,110,0.5), ${z});
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
      background: linear-gradient(180deg, rgba(194,86,110,0.45), ${z});
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
      background: ${z}; transform: scale(1.5);
      box-shadow: 0 0 0 4px rgba(194,86,110,0.18);
    }
    .her-tick.is-on > em { color: ${R}; }
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
    color: ${R}; margin-bottom: 1.6rem;
    animation-delay: 3.4s;
  }
  .her-title {
    font-family: 'Newsreader', Georgia, serif; font-weight: 300;
    font-size: clamp(3rem, 15vw, 7.5rem); line-height: 0.95; letter-spacing: -0.02em;
    background: linear-gradient(100deg, #8f2f4c 0%, ${z} 38%, #d9705f 64%, #a03a55 100%);
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
    background: linear-gradient(180deg, ${z}, transparent);
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
    color: ${R};
    margin-bottom: 2.4rem; padding-bottom: 0.9rem;
    border-bottom: 1px solid rgba(194,86,110,0.26);
  }

  .her-p, .her-beat, .her-em, .her-close, .her-list, .her-te {
    font-family: 'Newsreader', Georgia, serif; font-weight: 400;
  }
  .her-p {
    font-size: clamp(1.12rem, 3vw, 1.3rem); line-height: 1.86;
    margin: 0 0 1.55rem; color: ${F};
  }
  .her-beat {
    font-size: clamp(1.2rem, 3.4vw, 1.48rem); line-height: 1.62;
    margin: 0 0 1.55rem; color: ${J};
  }
  .her-list { list-style: none; margin: 0 0 1.8rem; padding: 0; }
  .her-list li {
    position: relative; padding-left: 1.5rem; margin-bottom: 1rem;
    font-size: clamp(1.08rem, 2.9vw, 1.24rem); line-height: 1.74;
    color: ${F};
  }
  .her-list li::before {
    content: ''; position: absolute; left: 0; top: 0.74em;
    width: 0.7rem; height: 1px; background: ${z};
  }

  .her-em {
    font-weight: 300; font-style: italic;
    font-size: clamp(1.5rem, 5.2vw, 2.15rem); line-height: 1.42;
    margin: 2.9rem 0 2.9rem; text-align: center;
    color: ${R};
  }

  /* Telugu, WhatsApp style — Roman letters, not the script. It sits at the
     peaks, gets more air than anything else, and takes a small mark above it
     so it reads as the line the paragraph was walking towards. */
  .her-te {
    font-weight: 300; font-style: italic;
    font-size: clamp(1.32rem, 4.6vw, 1.88rem); line-height: 1.62;
    margin: 3.4rem 0 3.4rem; text-align: center;
    color: ${R};
  }
  .her-te::before {
    content: ''; display: block; width: 4px; height: 4px; border-radius: 50%;
    margin: 0 auto 1.6rem; background: ${z};
    box-shadow: 0 0 0 5px rgba(194,86,110,0.16);
  }

  .her-close {
    font-weight: 300; font-style: italic;
    font-size: clamp(1.55rem, 5.6vw, 2.35rem); line-height: 1.38;
    margin: 2.4rem 0 0; text-align: center;
    background: linear-gradient(100deg, #8f2f4c 0%, ${z} 48%, #d9705f 100%);
    background-size: 200% auto;
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
  }

  .her-p em, .her-beat em, .her-list em { font-style: italic; color: ${J}; }

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
    background: rgba(255,255,255,0.94); color: ${R};
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
    color: ${R};
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
`;export{ue as default};
