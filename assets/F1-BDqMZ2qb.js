import{r as a,j as e}from"./index-zv8rNIbB.js";const he={mercedes:"#00D7B6",ferrari:"#E8002D",mclaren:"#FF8000",red_bull:"#3671C6",rb:"#6692FF",alpine:"#00A1E8",haas:"#B6BABD",audi:"#BB0A30",williams:"#64C4FF",aston_martin:"#229971",cadillac:"#C6A664"},w=n=>he[n]||"#8A8A96",re="https://api.jolpi.ca/ergast/f1",ue=6.5,xe=9e3,I=n=>String(n).padStart(2,"0"),R=n=>new Date(n).toLocaleDateString("en-GB",{day:"numeric",month:"short"}),ge=n=>new Date(n).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});function g({children:n,className:s="",delay:p=0}){const i=a.useRef(null),[d,o]=a.useState(!1);return a.useEffect(()=>{const j=i.current;if(!j)return;const b=new IntersectionObserver(([C])=>{C.isIntersecting&&(o(!0),b.disconnect())},{threshold:.1,rootMargin:"0px 0px -6% 0px"});return b.observe(j),()=>b.disconnect()},[]),e.jsx("div",{ref:i,className:s,style:{opacity:d?1:0,transform:d?"translateY(0)":"translateY(-26px)",transition:`opacity .8s cubic-bezier(.22,.61,.36,1) ${p}s, transform .8s cubic-bezier(.22,.61,.36,1) ${p}s`},children:n})}function be(n){const s=a.useMemo(()=>n?new Date(n).getTime():null,[n]),[p,i]=a.useState(()=>Date.now());if(a.useEffect(()=>{if(!s||s-Date.now()<=0)return;const o=setInterval(()=>i(Date.now()),1e3);return()=>clearInterval(o)},[s]),!s)return null;const d=s-p;return d<=0?{past:!0,d:0,h:0,m:0,s:0}:{past:!1,d:Math.floor(d/864e5),h:Math.floor(d/36e5%24),m:Math.floor(d/6e4%60),s:Math.floor(d/1e3%60)}}const T=()=>e.jsx("div",{className:"f1-kerb","aria-hidden":"true"}),M={fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"},A=()=>e.jsxs("svg",{viewBox:"0 0 200 330",...M,children:[e.jsx("path",{d:"M34 27h132M41 16h118M34 27V11M166 27V11M41 16v11M159 16v11"}),e.jsx("path",{d:"M92 27l-4 52M108 27l4 52"}),e.jsx("rect",{x:"16",y:"66",width:"30",height:"54",rx:"7"}),e.jsx("rect",{x:"154",y:"66",width:"30",height:"54",rx:"7"}),e.jsx("path",{d:"M46 80l42 9M46 108l42-9M154 80l-42 9M154 108l-42-9"}),e.jsx("path",{d:"M88 79l-4 71-10 46h52l-10-46-4-71z"}),e.jsx("path",{d:"M86 129a16 16 0 0 1 28 0M100 113v-9"}),e.jsx("ellipse",{cx:"100",cy:"141",rx:"13",ry:"18"}),e.jsx("path",{d:"M84 150l-22 15-2 45 14-14M116 150l22 15 2 45-14-14"}),e.jsx("path",{d:"M74 196l8 55h36l8-55M100 159v92"}),e.jsx("rect",{x:"14",y:"212",width:"32",height:"57",rx:"7"}),e.jsx("rect",{x:"154",y:"212",width:"32",height:"57",rx:"7"}),e.jsx("path",{d:"M46 227l36 6M46 255l36-6M154 227l-36 6M154 255l-36-6"}),e.jsx("path",{d:"M44 289h112M44 301h112M44 289v16M156 289v16M82 251l4 38M118 251l-4 38"})]}),P=()=>e.jsxs("svg",{viewBox:"0 0 210 96",...M,children:[e.jsx("path",{d:"M100 18V4M60 4h90"}),e.jsx("rect",{x:"8",y:"18",width:"194",height:"62",rx:"9"}),[38,79,120,161].map(n=>e.jsx("path",{d:`M${n} 18v62`},n)),[23,64,105,146,187].map(n=>e.jsxs("g",{children:[e.jsx("circle",{cx:n,cy:"38",r:"8.5"}),e.jsx("circle",{cx:n,cy:"61",r:"8.5"})]},n))]}),W=()=>e.jsxs("svg",{viewBox:"0 0 290 210",...M,children:[e.jsx("path",{d:"M46 186h168q38 0 38-34v-20q0-24-24-26l-32 4q-24 2-20-18t26-24l42-12q18-6 14-24t-24-16l-84 10q-22 2-28-10t-22-6l-34 10q-26 8-28 36l2 58q2 30-10 40t-4 20q6 10 20 8z"}),e.jsx("path",{d:"M112 177v18",strokeWidth:"3.6"}),e.jsx("path",{d:"M126 178v16",strokeWidth:"1.5",opacity:".65"})]}),q=()=>e.jsxs("svg",{viewBox:"0 0 164 164",...M,children:[e.jsx("circle",{cx:"82",cy:"82",r:"72"}),e.jsx("circle",{cx:"82",cy:"82",r:"61",strokeWidth:"3.5"}),e.jsx("circle",{cx:"82",cy:"82",r:"36"}),e.jsx("circle",{cx:"82",cy:"82",r:"11"}),[0,60,120,180,240,300].map(n=>{const s=n*Math.PI/180;return e.jsx("path",{d:`M${82+12*Math.cos(s)} ${82+12*Math.sin(s)}L${82+34*Math.cos(s)} ${82+34*Math.sin(s)}`},n)})]}),V=()=>e.jsxs("svg",{viewBox:"0 0 320 128",...M,children:[e.jsx("path",{d:"M8 116h304M8 116V12",strokeWidth:"1.6",opacity:".6"}),[40,104,168,232,288].map(n=>e.jsx("path",{d:`M${n} 116v6`,strokeWidth:"1.6",opacity:".6"},n)),e.jsx("path",{d:"M8 96c14-40 26-58 40-58s18 34 30 46 22-30 34-42 20 44 32 52 24-46 36-56 22 40 34 48 20-24 32-38 22 6 34 10",strokeWidth:"2.4"})]}),ne=()=>e.jsxs("svg",{viewBox:"0 0 200 116",...M,children:[e.jsx("path",{d:"M24 14l18-6v92l-18 6zM176 14l-18-6v92l18 6z"}),e.jsx("path",{d:"M42 26q58-10 116 0v18q-58-10-116 0z"}),e.jsx("path",{d:"M42 58q58-8 116 0v14q-58-8-116 0z"}),e.jsx("path",{d:"M88 72v26M112 72v26M74 98h52"})]}),ae=()=>e.jsxs("svg",{viewBox:"0 0 176 128",fill:"none",stroke:"currentColor",strokeWidth:"2",children:[e.jsx("path",{d:"M18 12v108",strokeLinecap:"round"}),e.jsx("g",{stroke:"none",fill:"currentColor",opacity:".6",children:Array.from({length:5},(n,s)=>Array.from({length:6},(p,i)=>(s+i)%2===0?e.jsx("rect",{x:24+i*25,y:16+s*17+i*2.4,width:"25",height:"17"},`${s}-${i}`):null))}),e.jsx("path",{d:"M24 16l150 12M24 101l150 12",opacity:".55",strokeLinecap:"round"})]}),ve=[{Art:A,top:"2.5%",side:"left",off:18,w:170,tone:"red",rot:-6},{Art:P,top:"7%",side:"right",off:22,w:185,tone:"white",rot:5},{Art:W,top:"12%",side:"left",off:14,w:200,tone:"teal",rot:7},{Art:V,top:"17%",side:"right",off:20,w:205,tone:"red",rot:0},{Art:q,top:"22%",side:"left",off:45,w:135,tone:"white",rot:0},{Art:ne,top:"27%",side:"right",off:26,w:180,tone:"teal",rot:-5},{Art:ae,top:"32%",side:"left",off:36,w:148,tone:"white",rot:8},{Art:A,top:"37%",side:"right",off:22,w:160,tone:"red",rot:173},{Art:V,top:"43%",side:"left",off:22,w:200,tone:"teal",rot:0},{Art:W,top:"48%",side:"right",off:16,w:195,tone:"white",rot:-9},{Art:P,top:"53%",side:"left",off:24,w:180,tone:"red",rot:-4},{Art:q,top:"58%",side:"right",off:50,w:125,tone:"teal",rot:0},{Art:ne,top:"63%",side:"left",off:28,w:175,tone:"white",rot:4},{Art:V,top:"68%",side:"right",off:24,w:200,tone:"red",rot:0},{Art:A,top:"73%",side:"left",off:20,w:165,tone:"teal",rot:5},{Art:ae,top:"78%",side:"right",off:34,w:145,tone:"white",rot:-7},{Art:W,top:"83%",side:"left",off:12,w:205,tone:"red",rot:8},{Art:P,top:"88%",side:"right",off:26,w:175,tone:"teal",rot:4},{Art:q,top:"92%",side:"left",off:46,w:130,tone:"white",rot:0},{Art:A,top:"96%",side:"right",off:26,w:155,tone:"red",rot:175}],je=()=>e.jsx("div",{className:"f1-stickers","aria-hidden":"true",children:ve.map(({Art:n,top:s,side:p,off:i,w:d,tone:o,rot:j},b)=>e.jsx("span",{className:`f1-sticker f1-sk-${o}`,style:{top:s,[p]:`${i}px`,width:`${d}px`,transform:`rotate(${j}deg)`},children:e.jsx(n,{})},b))}),h=({children:n,id:s})=>e.jsx("section",{id:s,className:"max-w-3xl mx-auto px-5 sm:px-6 py-7 sm:py-9",children:n}),N=({children:n,note:s})=>e.jsxs("div",{className:"flex items-baseline justify-between gap-4 mb-5",children:[e.jsxs("h2",{className:"f1-h2",children:[e.jsx("span",{className:"f1-tick","aria-hidden":"true"}),n]}),s&&e.jsx("span",{className:"f1-note shrink-0",children:s})]});function _({pos:n,color:s,name:p,sub:i,points:d,wins:o,pct:j,lead:b}){return e.jsxs("div",{className:`f1-row${b?" f1-row-lead":""}`,children:[e.jsx("span",{className:"f1-bar",style:{width:`${j}%`,background:s},"aria-hidden":"true"}),e.jsx("span",{className:"f1-pos",children:n}),e.jsx("span",{className:"f1-stripe",style:{background:s},"aria-hidden":"true"}),e.jsxs("span",{className:"min-w-0 flex-1 relative",children:[e.jsx("span",{className:"block text-[14.5px] font-medium leading-tight truncate",children:p}),i&&e.jsx("span",{className:"f1-sub block truncate",children:i})]}),o>0&&e.jsxs("span",{className:"f1-wins",children:[o,"W"]}),e.jsx("span",{className:"f1-pts",children:d})]})}function ke({onBack:n}){var X,K,J,Q,Z;const[s,p]=a.useState(void 0),[i,d]=a.useState(!1),[o,j]=a.useState("film"),[b,C]=a.useState(!1),[ie,oe]=a.useState(!1),[E,S]=a.useState(!1),[B,D]=a.useState(!1),[O,F]=a.useState(!1),[L,le]=a.useState(!1),k=a.useRef(null),x=a.useCallback(()=>{j("open"),C(!0)},[]);a.useEffect(()=>{const t=window.matchMedia("(prefers-reduced-motion: reduce)"),r=l=>{le(l),l&&x()};r(t.matches);const f=l=>r(l.matches);return t.addEventListener("change",f),()=>t.removeEventListener("change",f)},[x]),a.useEffect(()=>{let t=!0;return fetch("/f1.json").then(r=>r.ok?r.json():Promise.reject(new Error(String(r.status)))).then(r=>t&&p(r)).catch(()=>t&&p(null)),()=>{t=!1}},[]),a.useEffect(()=>{if(!(s!=null&&s.season))return;let t=!0;return Promise.all([fetch(`${re}/${s.season}/driverstandings/?format=json`).then(r=>r.json()),fetch(`${re}/${s.season}/constructorstandings/?format=json`).then(r=>r.json())]).then(([r,f])=>{var $;if(!t)return;const l=r.MRData.StandingsTable.StandingsLists[0],z=f.MRData.StandingsTable.StandingsLists[0];($=l==null?void 0:l.DriverStandings)!=null&&$.length&&(p(ee=>({...ee,round:Number(l.round)||ee.round,drivers:l.DriverStandings.map(c=>{var te,se;return{pos:Number(c.position),points:Number(c.points),wins:Number(c.wins),code:c.Driver.code||c.Driver.familyName.slice(0,3).toUpperCase(),first:c.Driver.givenName,last:c.Driver.familyName,team:((te=c.Constructors[c.Constructors.length-1])==null?void 0:te.name)||"",teamId:((se=c.Constructors[c.Constructors.length-1])==null?void 0:se.constructorId)||""}}),constructors:((z==null?void 0:z.ConstructorStandings)||[]).map(c=>({pos:Number(c.position),points:Number(c.points),wins:Number(c.wins),name:c.Constructor.name,teamId:c.Constructor.constructorId}))})),d(!0))}).catch(()=>{}),()=>{t=!1}},[s==null?void 0:s.season]),a.useEffect(()=>{const t=k.current;!t||L||(t.volume=1,t.muted=!1,t.play().then(()=>S(!1)).catch(()=>{t.muted=!0,S(!0),D(!0),t.play().catch(()=>x())}))},[L,x]),a.useEffect(()=>{if(!B)return;const t=()=>{const r=k.current;r&&(r.muted=!1,r.volume=1,r.play().catch(()=>{}),S(!1)),D(!1)};return window.addEventListener("pointerdown",t,{once:!0}),window.addEventListener("keydown",t,{once:!0}),()=>{window.removeEventListener("pointerdown",t),window.removeEventListener("keydown",t)}},[B]),a.useEffect(()=>{if(o!=="film")return;const t=document.body.style.overflow;return document.body.style.overflow="hidden",window.scrollTo(0,0),()=>{document.body.style.overflow=t}},[o]),a.useEffect(()=>{if(o!=="film")return;const t=setTimeout(()=>oe(!0),3500),r=setTimeout(()=>{const f=k.current;(!f||f.paused||f.currentTime===0)&&x()},xe);return()=>{clearTimeout(t),clearTimeout(r)}},[o,x]);const ce=a.useCallback(()=>{const t=k.current;!(t!=null&&t.duration)||Number.isNaN(t.duration)||t.currentTime>=t.duration-ue&&C(!0)},[]),de=a.useCallback(()=>{F(!1),x()},[x]),G=a.useCallback(()=>{const t=k.current;t&&(t.muted=!t.muted,t.muted||(t.volume=1),S(t.muted),D(!1),t.paused&&t.play().catch(()=>{}))},[]),fe=a.useCallback(()=>{const t=k.current;t&&(t.paused?(t.ended&&(t.currentTime=0),t.play().catch(()=>{})):t.pause())},[]),m=a.useMemo(()=>{if(!(s!=null&&s.races))return null;const t=Date.now();return s.races.find(r=>new Date(r.start).getTime()>t)||null},[s]),v=be(m==null?void 0:m.start),y=a.useMemo(()=>((s==null?void 0:s.races)||[]).filter(t=>new Date(t.start).getTime()<Date.now()),[s]),H=a.useMemo(()=>{if(!(s!=null&&s.drivers))return[];const t=new Map;for(const r of s.drivers)r.teamId&&(t.has(r.teamId)||t.set(r.teamId,[]),t.get(r.teamId).push(r));return[...t.entries()].map(([r,f])=>{const l=[...f].sort((z,$)=>$.points-z.points).slice(0,2);return l.length===2?{teamId:r,team:l[0].team,a:l[0],b:l[1],total:l[0].points+l[1].points}:null}).filter(Boolean).sort((r,f)=>f.total-r.total)},[s]),u=((X=s==null?void 0:s.drivers)==null?void 0:X.length)>=2?{p1:s.drivers[0],p2:s.drivers[1]}:null,Y=s!=null&&s.races?s.races.length-y.length:0,pe=((J=(K=s==null?void 0:s.drivers)==null?void 0:K[0])==null?void 0:J.points)||1,me=((Z=(Q=s==null?void 0:s.constructors)==null?void 0:Q[0])==null?void 0:Z.points)||1,U="/";return e.jsxs("div",{className:"f1-root",children:[e.jsx("div",{className:"f1-bg","aria-hidden":"true"}),e.jsx(je,{}),e.jsxs("button",{onClick:n,title:"Back",className:"f1-back",children:[e.jsx("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2.2,children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19l-7-7 7-7"})}),e.jsx("span",{className:"hidden sm:inline",children:"Back"})]}),e.jsxs("div",{className:"f1-hero",children:[e.jsx("video",{ref:k,className:"f1-video",src:`${U}f1/hero.mp4`,poster:`${U}f1/poster.jpg`,playsInline:!0,preload:"auto",autoPlay:!L,onTimeUpdate:ce,onEnded:de,onError:x,onPlay:()=>F(!0),onPause:()=>F(!1)}),e.jsx("div",{className:"f1-scrim","aria-hidden":"true"}),e.jsxs("div",{className:"f1-hero-inner",children:[e.jsx("div",{className:`f1-title${b?" f1-title-in":""}`,children:e.jsxs("h1",{className:"f1-h1",children:["Formula 1",e.jsx("span",{className:"f1-h1-kerb","aria-hidden":"true"})]})}),o==="open"&&e.jsxs("button",{onClick:()=>{var t;return(t=document.getElementById("f1-details"))==null?void 0:t.scrollIntoView({behavior:L?"auto":"smooth",block:"start"})},className:"f1-cue","aria-label":"Scroll to the championship",children:[e.jsx("span",{className:"f1-cue-text",children:"The standings"}),e.jsx("svg",{className:"w-5 h-5 f1-bob",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.8,children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M19 14l-7 7m0 0l-7-7m7 7V3"})})]})]}),B&&o==="film"&&e.jsxs("button",{onClick:G,className:"f1-sound-prompt",children:[e.jsxs("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.9,children:[e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M11 5L6 9H3v6h3l5 4V5z"}),e.jsx("path",{strokeLinecap:"round",d:"M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12"})]}),"Tap for sound"]}),o==="film"&&ie&&e.jsxs("button",{onClick:x,className:"f1-skip",children:["Skip the film",e.jsx("svg",{className:"w-3.5 h-3.5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M13 5l7 7-7 7M5 5l7 7-7 7"})})]}),e.jsxs("div",{className:"f1-controls",children:[e.jsx("button",{onClick:fe,className:"f1-ctl","aria-label":O?"Pause the film":"Play the film",children:O?e.jsxs("svg",{className:"w-4 h-4",viewBox:"0 0 24 24",fill:"currentColor",children:[e.jsx("rect",{x:"6",y:"5",width:"4",height:"14",rx:"1"}),e.jsx("rect",{x:"14",y:"5",width:"4",height:"14",rx:"1"})]}):e.jsx("svg",{className:"w-4 h-4",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M8 5.5v13l11-6.5z"})})}),e.jsx("button",{onClick:G,className:`f1-ctl${E?"":" f1-ctl-on"}`,"aria-label":E?"Unmute the film":"Mute the film",children:E?e.jsxs("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.9,children:[e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M11 5L6 9H3v6h3l5 4V5z"}),e.jsx("path",{strokeLinecap:"round",d:"M17 9l4 6m0-6l-4 6"})]}):e.jsxs("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.9,children:[e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M11 5L6 9H3v6h3l5 4V5z"}),e.jsx("path",{strokeLinecap:"round",d:"M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12"})]})})]})]}),o==="open"&&e.jsxs("div",{id:"f1-details",className:"f1-details",children:[e.jsx(T,{}),s===void 0&&e.jsx(h,{children:e.jsx("div",{className:"f1-state",children:"Warming the tyres…"})}),s===null&&e.jsx(h,{children:e.jsx("div",{className:"f1-state",children:"Couldn’t load the championship right now."})}),s&&e.jsxs(e.Fragment,{children:[e.jsx(h,{children:e.jsx(g,{children:e.jsxs("div",{className:"f1-pulse",children:[e.jsxs("div",{className:"f1-pulse-head",children:[e.jsxs("span",{className:"f1-pulse-round",children:["Round ",e.jsx("b",{children:y.length})," of ",s.races.length]}),e.jsxs("span",{className:"f1-note",children:[Y," to go"]})]}),e.jsx("div",{className:"f1-track",role:"img","aria-label":`${y.length} of ${s.races.length} rounds complete`,children:e.jsx("span",{className:"f1-track-fill",style:{width:`${y.length/s.races.length*100}%`}})}),e.jsxs("div",{className:"f1-pulse-grid",children:[e.jsxs("div",{children:[e.jsx("b",{children:s.drivers.reduce((t,r)=>t+r.wins,0)}),e.jsx("span",{children:"races won"})]}),e.jsxs("div",{children:[e.jsx("b",{children:new Set(y.map(t=>{var r;return(r=t.winner)==null?void 0:r.last}).filter(Boolean)).size}),e.jsx("span",{children:"winners"})]}),e.jsxs("div",{children:[e.jsx("b",{children:new Set(s.races.map(t=>t.country)).size}),e.jsx("span",{children:"countries"})]}),e.jsxs("div",{children:[e.jsx("b",{children:s.constructors.length}),e.jsx("span",{children:"teams"})]})]})]})})}),m&&e.jsx(h,{children:e.jsx(g,{children:e.jsxs("div",{className:"f1-next",children:[e.jsxs("div",{className:"f1-next-tag",children:["Next up · Round ",m.round]}),e.jsx("h2",{className:"f1-next-name",children:m.name}),e.jsxs("p",{className:"f1-next-where",children:[m.circuit," · ",m.locality,", ",m.country,e.jsx("span",{className:"f1-dot",children:"·"}),R(m.start),", ",ge(m.start)]}),v&&!v.past&&e.jsx("div",{className:"f1-clock",children:[["Days",v.d],["Hrs",I(v.h)],["Min",I(v.m)],["Sec",I(v.s)]].map(([t,r])=>e.jsxs("div",{className:"f1-clock-cell",children:[e.jsx("div",{className:"f1-clock-num",children:r}),e.jsx("div",{className:"f1-clock-lab",children:t})]},t))}),(v==null?void 0:v.past)&&e.jsx("p",{className:"f1-sub",children:"Lights out."})]})})}),u&&e.jsx(h,{children:e.jsxs(g,{children:[e.jsx(N,{note:`${Y} rounds left`,children:"The title race"}),e.jsxs("div",{className:"f1-duel",children:[e.jsxs("div",{className:"f1-duel-side",children:[e.jsx("span",{className:"f1-duel-pos",children:"P1"}),e.jsx("span",{className:"f1-duel-name",style:{color:w(u.p1.teamId)},children:u.p1.last}),e.jsx("span",{className:"f1-duel-pts",children:u.p1.points}),e.jsx("span",{className:"f1-sub",children:u.p1.team})]}),e.jsxs("div",{className:"f1-duel-gap",children:[e.jsx("b",{children:u.p1.points-u.p2.points}),e.jsx("span",{children:"points"})]}),e.jsxs("div",{className:"f1-duel-side",children:[e.jsx("span",{className:"f1-duel-pos",children:"P2"}),e.jsx("span",{className:"f1-duel-name",style:{color:w(u.p2.teamId)},children:u.p2.last}),e.jsx("span",{className:"f1-duel-pts",children:u.p2.points}),e.jsx("span",{className:"f1-sub",children:u.p2.team})]})]})]})}),e.jsx(T,{}),e.jsx(h,{children:e.jsxs(g,{children:[e.jsx(N,{note:i?"live":`after round ${s.round}`,children:"Drivers"}),e.jsx("div",{className:"space-y-1",children:s.drivers.map(t=>e.jsx(_,{pos:t.pos,color:w(t.teamId),name:`${t.first} ${t.last}`,sub:t.team,points:t.points,wins:t.wins,pct:t.points/pe*100,lead:t.pos===1},`${t.code}-${t.pos}`))})]})}),e.jsx(h,{children:e.jsxs(g,{children:[e.jsx(N,{note:`${s.constructors.length} teams`,children:"Constructors"}),e.jsx("div",{className:"space-y-1",children:s.constructors.map(t=>e.jsx(_,{pos:t.pos,color:w(t.teamId),name:t.name,points:t.points,wins:t.wins,pct:t.points/me*100,lead:t.pos===1},t.teamId))})]})}),H.length>0&&e.jsx(h,{children:e.jsxs(g,{children:[e.jsx(N,{note:"points split",children:"Teammates"}),e.jsx("div",{className:"space-y-2.5",children:H.map(t=>{const r=t.total>0?t.a.points/t.total*100:0;return e.jsxs("div",{className:"f1-mate",children:[e.jsxs("div",{className:"f1-mate-head",children:[e.jsx("span",{className:"f1-mate-team",style:{color:w(t.teamId)},children:t.team}),e.jsxs("span",{className:"f1-note",children:[t.total," pts"]})]}),e.jsx("div",{className:"f1-mate-bar",children:e.jsx("span",{className:"f1-mate-fill",style:{width:`${r}%`,background:w(t.teamId)}})}),e.jsxs("div",{className:"f1-mate-feet",children:[e.jsxs("span",{children:[t.a.last," ",e.jsx("b",{children:t.a.points})]}),e.jsxs("span",{children:[e.jsx("b",{children:t.b.points})," ",t.b.last]})]})]},t.teamId)})})]})}),e.jsx(T,{}),y.some(t=>t.winner)&&e.jsx(h,{children:e.jsxs(g,{children:[e.jsx(N,{note:"winner · pole",children:"The season so far"}),e.jsx("div",{className:"space-y-1",children:y.filter(t=>t.winner).map(t=>e.jsxs("div",{className:"f1-past",children:[e.jsx("span",{className:"f1-pos",children:t.round}),e.jsxs("span",{className:"min-w-0 flex-1",children:[e.jsx("span",{className:"block text-[14px] leading-tight truncate",children:t.name}),e.jsxs("span",{className:"f1-sub block truncate",children:[e.jsx("b",{style:{color:w(t.winner.teamId)},children:t.winner.last}),e.jsx("span",{className:"f1-dot",children:"·"}),t.winner.team]})]}),t.pole&&e.jsxs("span",{className:"f1-pole",title:`Pole: ${t.pole.last} ${t.pole.time}`,children:[e.jsx("span",{className:"f1-pole-tag",children:"P"}),t.pole.last]})]},t.round))})]})}),s.lastRace&&e.jsx(h,{children:e.jsxs(g,{children:[e.jsx(N,{note:R(s.lastRace.date),children:"Last time out"}),e.jsxs("p",{className:"f1-sub -mt-3 mb-4",children:[s.lastRace.name," · ",s.lastRace.circuit]}),e.jsx("div",{className:"space-y-1",children:s.lastRace.podium.map(t=>e.jsx(_,{pos:t.pos,color:w(t.teamId),name:`${t.first} ${t.last}`,sub:`${t.team} · ${t.time}`,points:t.points,wins:0,pct:t.points/(s.lastRace.podium[0].points||1)*100,lead:t.pos===1},t.code))}),s.lastRace.fastestLap&&e.jsxs("p",{className:"f1-note mt-3.5",children:["Fastest lap — ",s.lastRace.fastestLap.driver," ",s.lastRace.fastestLap.time]})]})}),e.jsx(h,{children:e.jsxs(g,{children:[e.jsx(N,{note:`${s.races.length} rounds`,children:"The calendar"}),e.jsx("div",{className:"space-y-1",children:s.races.map(t=>{const r=new Date(t.start).getTime()<Date.now(),f=m&&t.round===m.round;return e.jsxs("div",{className:`f1-cal${r?" f1-cal-past":""}${f?" f1-cal-next":""}`,children:[e.jsx("span",{className:"f1-pos",children:t.round}),e.jsxs("span",{className:"min-w-0 flex-1",children:[e.jsx("span",{className:"block text-[14.5px] leading-tight truncate",children:t.name}),e.jsxs("span",{className:"f1-sub block truncate",children:[t.locality,", ",t.country]})]}),e.jsx("span",{className:"f1-cal-date",children:R(t.start)})]},t.round)})})]})}),e.jsx(T,{}),e.jsx(h,{children:e.jsx(g,{children:e.jsxs("div",{className:"f1-credits",children:[e.jsxs("p",{children:["Film: ",e.jsx("b",{children:"AMD Radeon PRO × Blender"})," for the Mercedes-AMG Petronas F1 Team, marking eight consecutive constructors’ titles (2014–2021). Rendered with Blender on an AMD Radeon PRO W6800. All rights belong to their owners; it is used here as a fan tribute, trimmed and re-encoded for the web."]}),e.jsxs("p",{children:["Timing and standings from"," ",e.jsx("a",{href:"https://api.jolpi.ca/ergast/f1/",target:"_blank",rel:"noopener noreferrer",children:"Jolpica-F1"}),", the community successor to Ergast. Not affiliated with Formula 1, the FIA, or any team."]}),s.generated&&e.jsxs("p",{className:"f1-note",children:["Snapshot ",new Date(s.generated).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}),i?" · standings refreshed live":""]})]})})})]})]}),e.jsx("style",{children:`
        .f1-root {
          --f1-red: #E10600;
          --f1-bg: #0A0A0C;
          --f1-card: rgba(20,20,26,.80);
          --f1-line: #26262F;
          --f1-fg: #F3F3F6;
          --f1-dim: #9A9AA6;
          position: relative;
          min-height: 100vh;
          background: var(--f1-bg);
          color: var(--f1-fg);
        }

        /* Fixed backdrop so the page never falls back to flat black. */
        .f1-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }

        /* Team ambience over a graded base. The kerb motif is already carried by
           the section dividers, so this layer stays atmospheric rather than graphic. */
        .f1-bg::before {
          content: ''; position: absolute; inset: 0;
          background:
            radial-gradient(56% 40% at 12% 4%,   rgba(225,6,0,.17),   transparent 62%),
            radial-gradient(50% 40% at 88% 30%,  rgba(0,210,190,.09), transparent 64%),
            radial-gradient(60% 38% at 8% 72%,   rgba(0,210,190,.07), transparent 66%),
            radial-gradient(70% 45% at 78% 96%,  rgba(225,6,0,.13),   transparent 68%),
            linear-gradient(180deg, #08080B 0%, #0C0C11 48%, #09090D 100%);
        }

        /* Carbon-fibre twill, a hint of slipstream, and grain to kill banding. */
        .f1-bg::after {
          content: ''; position: absolute; inset: 0; opacity: .6;
          background-image:
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23n)' opacity='.32'/%3E%3C/svg%3E"),
            repeating-linear-gradient(101deg, transparent 0 118px, rgba(255,255,255,.014) 118px 122px, transparent 122px 250px),
            repeating-linear-gradient(45deg,  rgba(255,255,255,.021) 0 2px, transparent 2px 4px),
            repeating-linear-gradient(-45deg, rgba(255,255,255,.021) 0 2px, transparent 2px 4px);
          background-size: 180px 180px, auto, 4px 4px, 4px 4px;
        }

        /* Line-art stickers. They scroll with the page, starting below the film,
           and live in the gutter beside the content column. Below 1280px that
           gutter is too narrow to hold them without crowding the text, so they
           are simply not rendered. */
        .f1-stickers {
          position: absolute; left: 0; right: 0; top: 100svh; bottom: 0;
          z-index: 1; pointer-events: none; overflow: hidden; display: none;
        }
        @media (min-width: 1280px) { .f1-stickers { display: block } }
        .f1-sticker { position: absolute; display: block; }
        .f1-sticker svg { width: 100%; height: auto; display: block; }
        .f1-sk-red   { color: #E10600; opacity: .15; }
        .f1-sk-white { color: #FFFFFF; opacity: .085; }
        .f1-sk-teal  { color: #00D2BE; opacity: .12; }

        /* Hero */
        .f1-hero { position: relative; height: 100svh; min-height: 520px; overflow: hidden; }
        .f1-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .f1-scrim {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(120% 80% at 50% 60%, transparent 35%, rgba(0,0,0,.55) 100%),
            linear-gradient(180deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.1) 30%, rgba(0,0,0,.45) 72%, #08080B 100%);
        }
        .f1-hero-inner {
          position: relative; z-index: 2; height: 100%;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 0 1.25rem;
        }

        /* The title is absent until the film is nearly done. */
        .f1-title {
          opacity: 0; transform: translateY(-14px) scale(.985); filter: blur(6px);
          transition: opacity 1.9s cubic-bezier(.22,.61,.36,1), transform 1.9s cubic-bezier(.22,.61,.36,1), filter 1.9s ease;
          pointer-events: none;
        }
        .f1-title-in { opacity: 1; transform: none; filter: none; }

        .f1-h1 {
          position: relative; display: inline-block;
          font-weight: 500; font-size: clamp(3rem, 13vw, 7rem); line-height: .95; color: #fff;
          margin-bottom: 0; text-shadow: 0 2px 40px rgba(0,0,0,.5);
        }
        .f1-h1-kerb {
          display: block; height: 4px; margin-top: .55rem; border-radius: 2px;
          background: repeating-linear-gradient(135deg, var(--f1-red) 0 10px, #fff 10px 20px);
          transform: scaleX(0); transform-origin: left center;
          transition: transform 1.4s cubic-bezier(.22,.61,.36,1) .5s;
        }
        .f1-title-in .f1-h1-kerb { transform: scaleX(1); }

        .f1-cue {
          position: absolute; bottom: 2.25rem; display: inline-flex; flex-direction: column;
          align-items: center; gap: .5rem; color: rgba(255,255,255,.55);
          animation: f1Fade 1s ease-out both; transition: color .2s;
        }
        .f1-cue:hover { color: rgba(255,255,255,.92); }
        .f1-cue-text { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .28em; text-transform: uppercase; }
        @keyframes f1Fade { from { opacity: 0 } to { opacity: 1 } }
        .f1-bob { animation: f1Bob 2.4s ease-in-out infinite; }
        @keyframes f1Bob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(5px) } }

        .f1-back {
          position: fixed; top: 1rem; left: 1rem; z-index: 40;
          display: inline-flex; align-items: center; gap: .375rem;
          padding: .375rem .75rem; border-radius: .5rem; font-size: .875rem;
          color: rgba(255,255,255,.8); background: rgba(0,0,0,.5);
          border: 1px solid rgba(255,255,255,.16); backdrop-filter: blur(8px);
          transition: color .2s, border-color .2s;
        }
        .f1-back:hover { color: #fff; border-color: var(--f1-red); }

        .f1-controls { position: absolute; bottom: 1.25rem; right: 1.25rem; z-index: 3; display: flex; gap: .5rem; }
        .f1-ctl {
          width: 2.25rem; height: 2.25rem; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,.82); background: rgba(0,0,0,.5);
          border: 1px solid rgba(255,255,255,.16); backdrop-filter: blur(8px);
          transition: color .2s, border-color .2s;
        }
        .f1-ctl:hover { color: #fff; border-color: var(--f1-red); }
        .f1-ctl-on { border-color: var(--f1-red); color: #fff; }

        .f1-skip {
          position: absolute; bottom: 1.35rem; left: 50%; transform: translateX(-50%); z-index: 3;
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .45rem .85rem; border-radius: 999px;
          font-family: ui-monospace, monospace; font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase;
          color: rgba(255,255,255,.6); background: rgba(0,0,0,.45);
          border: 1px solid rgba(255,255,255,.14); backdrop-filter: blur(8px);
          animation: f1Fade .7s ease-out both; transition: color .2s, border-color .2s;
        }
        .f1-skip:hover { color: #fff; border-color: var(--f1-red); }

        .f1-sound-prompt {
          position: absolute; top: 1rem; right: 1.25rem; z-index: 3;
          display: inline-flex; align-items: center; gap: .45rem;
          padding: .5rem .9rem; border-radius: 999px; font-size: 12.5px;
          color: #fff; background: rgba(225,6,0,.9); border: 1px solid rgba(255,255,255,.25);
          animation: f1Pulse 2s ease-in-out infinite;
        }
        @keyframes f1Pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(225,6,0,.5) } 50% { box-shadow: 0 0 0 10px rgba(225,6,0,0) } }

        /* Details */
        .f1-details { position: relative; z-index: 2; }
        .f1-state { height: 8rem; display: flex; align-items: center; justify-content: center; color: var(--f1-dim); font-size: 13px; }
        .f1-kerb { height: 6px; background: repeating-linear-gradient(135deg, var(--f1-red) 0 14px, #fff 14px 28px); opacity: .85; }

        .f1-h2 { display: flex; align-items: center; gap: .6rem; font-weight: 500; font-size: clamp(1.35rem, 3.4vw, 1.9rem); }
        .f1-tick { width: 4px; height: 1.15em; border-radius: 2px; background: var(--f1-red); flex-shrink: 0; }
        .f1-note { font-family: ui-monospace, monospace; font-size: 11px; color: var(--f1-dim); opacity: .85; }
        .f1-sub { font-size: 11.5px; color: var(--f1-dim); }
        .f1-dot { margin: 0 .4rem; opacity: .45; }

        /* Rows */
        .f1-row {
          position: relative; display: flex; align-items: center; gap: .75rem;
          padding: .625rem .875rem; border-radius: .5rem;
          border: 1px solid transparent; overflow: hidden;
        }
        .f1-row-lead { background: var(--f1-card); border-color: var(--f1-line); }
        .f1-bar { position: absolute; left: 0; top: 0; bottom: 0; opacity: .11; transition: width .8s cubic-bezier(.22,.61,.36,1); }
        .f1-pos { position: relative; width: 1.5rem; flex-shrink: 0; font-family: ui-monospace, monospace; font-variant-numeric: tabular-nums; font-size: 13px; color: var(--f1-dim); }
        .f1-stripe { position: relative; width: 3px; height: 1.75rem; border-radius: 999px; flex-shrink: 0; }
        .f1-wins { position: relative; font-family: ui-monospace, monospace; font-size: 11px; color: var(--f1-dim); flex-shrink: 0; }
        .f1-pts { position: relative; width: 3rem; text-align: right; font-family: ui-monospace, monospace; font-variant-numeric: tabular-nums; font-size: 14px; flex-shrink: 0; }
        @media (max-width: 639px) { .f1-wins { display: none } }

        /* Season pulse */
        .f1-pulse { border: 1px solid var(--f1-line); border-radius: 1rem; padding: 1.25rem 1.35rem; background: var(--f1-card); }
        .f1-pulse-head { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; margin-bottom: .7rem; }
        .f1-pulse-round { font-size: 13.5px; color: var(--f1-dim); }
        .f1-pulse-round b { color: var(--f1-fg); font-size: 16px; }
        .f1-track { height: 6px; border-radius: 999px; background: rgba(255,255,255,.08); overflow: hidden; }
        .f1-track-fill { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--f1-red), #FF4B45); transition: width 1s cubic-bezier(.22,.61,.36,1); }
        .f1-pulse-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5rem; margin-top: 1.1rem; }
        .f1-pulse-grid div { text-align: center; }
        .f1-pulse-grid b { display: block; font-family: ui-monospace, monospace; font-size: clamp(1.05rem, 4vw, 1.4rem); }
        .f1-pulse-grid span { display: block; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--f1-dim); margin-top: .2rem; }

        /* Next race */
        .f1-next { border: 1px solid var(--f1-line); border-left: 3px solid var(--f1-red); border-radius: 1rem; padding: 1.5rem 1.5rem 1.6rem; background: var(--f1-card); }
        .f1-next-tag { font-family: ui-monospace, monospace; font-size: 10.5px; letter-spacing: .24em; text-transform: uppercase; color: var(--f1-red); margin-bottom: .7rem; }
        .f1-next-name { font-weight: 500; font-size: clamp(1.5rem, 4.4vw, 2.3rem); line-height: 1.15; margin-bottom: .35rem; }
        .f1-next-where { font-size: 13.5px; color: var(--f1-dim); margin-bottom: 1.35rem; }
        .f1-clock { display: flex; gap: .625rem; }
        .f1-clock-cell { flex: 1; text-align: center; border-radius: .75rem; padding: .7rem .25rem; background: rgba(255,255,255,.05); border: 1px solid var(--f1-line); }
        .f1-clock-num { font-family: ui-monospace, monospace; font-variant-numeric: tabular-nums; font-size: clamp(1.3rem, 5vw, 2rem); line-height: 1; }
        .f1-clock-lab { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: var(--f1-dim); margin-top: .4rem; }

        /* Title race */
        .f1-duel { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: .75rem; border: 1px solid var(--f1-line); border-radius: 1rem; padding: 1.25rem 1rem; background: var(--f1-card); }
        .f1-duel-side { display: flex; flex-direction: column; align-items: center; text-align: center; gap: .15rem; min-width: 0; }
        .f1-duel-pos { font-family: ui-monospace, monospace; font-size: 10px; letter-spacing: .2em; color: var(--f1-dim); }
        .f1-duel-name { font-size: clamp(1rem, 3.6vw, 1.3rem); font-weight: 600; max-width: 100%; overflow: hidden; text-overflow: ellipsis; }
        .f1-duel-pts { font-family: ui-monospace, monospace; font-size: clamp(1.4rem, 5vw, 2rem); line-height: 1.1; }
        .f1-duel-gap { text-align: center; padding: 0 .5rem; border-left: 1px solid var(--f1-line); border-right: 1px solid var(--f1-line); }
        .f1-duel-gap b { display: block; font-family: ui-monospace, monospace; font-size: clamp(1.2rem, 4.5vw, 1.7rem); color: var(--f1-red); }
        .f1-duel-gap span { font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--f1-dim); }

        /* Teammates */
        .f1-mate { border: 1px solid var(--f1-line); border-radius: .75rem; padding: .8rem .9rem; background: var(--f1-card); }
        .f1-mate-head { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; margin-bottom: .55rem; }
        .f1-mate-team { font-size: 13.5px; font-weight: 600; }
        .f1-mate-bar { height: 7px; border-radius: 999px; background: rgba(255,255,255,.09); overflow: hidden; }
        .f1-mate-fill { display: block; height: 100%; border-radius: 999px; transition: width .9s cubic-bezier(.22,.61,.36,1); }
        .f1-mate-feet { display: flex; justify-content: space-between; gap: .75rem; margin-top: .45rem; font-size: 12px; color: var(--f1-dim); }
        .f1-mate-feet b { color: var(--f1-fg); font-family: ui-monospace, monospace; }

        /* Season so far */
        .f1-past { display: flex; align-items: center; gap: .75rem; padding: .55rem .875rem; border-radius: .5rem; border: 1px solid transparent; }
        .f1-past:hover { border-color: var(--f1-line); background: var(--f1-card); }
        .f1-pole { display: inline-flex; align-items: center; gap: .35rem; flex-shrink: 0; font-size: 11.5px; color: var(--f1-dim); }
        .f1-pole-tag { display: inline-grid; place-items: center; width: 1.05rem; height: 1.05rem; border-radius: 3px; background: var(--f1-red); color: #fff; font-size: 9px; font-weight: 700; }
        @media (max-width: 479px) { .f1-pole { display: none } }

        /* Calendar */
        .f1-cal { display: flex; align-items: center; gap: .75rem; padding: .625rem .875rem; border-radius: .5rem; border: 1px solid transparent; }
        .f1-cal-past { opacity: .42; }
        .f1-cal-next { background: var(--f1-card); border-color: var(--f1-red); }
        .f1-cal-date { flex-shrink: 0; font-family: ui-monospace, monospace; font-size: 12px; color: var(--f1-dim); }

        /* Credits */
        .f1-credits { border-top: 1px solid var(--f1-line); padding-top: 1.5rem; display: flex; flex-direction: column; gap: .75rem; }
        .f1-credits p { font-size: 12px; line-height: 1.7; color: var(--f1-dim); }
        .f1-credits b { color: rgba(243,243,246,.85); font-weight: 600; }
        .f1-credits a { color: var(--f1-red); text-decoration: underline; text-underline-offset: 2px; }

        @media (prefers-reduced-motion: reduce) {
          .f1-title { transition: none; opacity: 1; transform: none; filter: none; }
          .f1-h1-kerb { transition: none; transform: scaleX(1); }
          .f1-bob, .f1-sound-prompt { animation: none; }
          .f1-bar, .f1-track-fill, .f1-mate-fill { transition: none; }
        }
      `})]})}export{ke as default};
