import{r as n,j as e}from"./index-BeslcUa2.js";const ie={mercedes:"#00D7B6",ferrari:"#E8002D",mclaren:"#FF8000",red_bull:"#3671C6",rb:"#6692FF",alpine:"#00A1E8",haas:"#B6BABD",audi:"#BB0A30",williams:"#64C4FF",aston_martin:"#229971",cadillac:"#C6A664"},v=a=>ie[a]||"#8A8A96",K="https://api.jolpi.ca/ergast/f1",oe=6.5,le=9e3,B=a=>String(a).padStart(2,"0"),R=a=>new Date(a).toLocaleDateString("en-GB",{day:"numeric",month:"short"}),ce=a=>new Date(a).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"});function g({children:a,className:r="",delay:u=0}){const h=n.useRef(null),[f,l]=n.useState(!1);return n.useEffect(()=>{const N=h.current;if(!N)return;const j=new IntersectionObserver(([C])=>{C.isIntersecting&&(l(!0),j.disconnect())},{threshold:.1,rootMargin:"0px 0px -6% 0px"});return j.observe(N),()=>j.disconnect()},[]),e.jsx("div",{ref:h,className:r,style:{opacity:f?1:0,transform:f?"translateY(0)":"translateY(-26px)",transition:`opacity .8s cubic-bezier(.22,.61,.36,1) ${u}s, transform .8s cubic-bezier(.22,.61,.36,1) ${u}s`},children:a})}function de(a){const r=n.useMemo(()=>a?new Date(a).getTime():null,[a]),[u,h]=n.useState(()=>Date.now());if(n.useEffect(()=>{if(!r||r-Date.now()<=0)return;const l=setInterval(()=>h(Date.now()),1e3);return()=>clearInterval(l)},[r]),!r)return null;const f=r-u;return f<=0?{past:!0,d:0,h:0,m:0,s:0}:{past:!1,d:Math.floor(f/864e5),h:Math.floor(f/36e5%24),m:Math.floor(f/6e4%60),s:Math.floor(f/1e3%60)}}const D=()=>e.jsx("div",{className:"f1-kerb","aria-hidden":"true"}),m=({children:a,id:r})=>e.jsx("section",{id:r,className:"max-w-3xl mx-auto px-5 sm:px-6 py-7 sm:py-9",children:a}),y=({children:a,note:r})=>e.jsxs("div",{className:"flex items-baseline justify-between gap-4 mb-5",children:[e.jsxs("h2",{className:"f1-h2",children:[e.jsx("span",{className:"f1-tick","aria-hidden":"true"}),a]}),r&&e.jsx("span",{className:"f1-note shrink-0",children:r})]});function F({pos:a,color:r,name:u,sub:h,points:f,wins:l,pct:N,lead:j}){return e.jsxs("div",{className:`f1-row${j?" f1-row-lead":""}`,children:[e.jsx("span",{className:"f1-bar",style:{width:`${N}%`,background:r},"aria-hidden":"true"}),e.jsx("span",{className:"f1-pos",children:a}),e.jsx("span",{className:"f1-stripe",style:{background:r},"aria-hidden":"true"}),e.jsxs("span",{className:"min-w-0 flex-1 relative",children:[e.jsx("span",{className:"block text-[14.5px] font-medium leading-tight truncate",children:u}),h&&e.jsx("span",{className:"f1-sub block truncate",children:h})]}),l>0&&e.jsxs("span",{className:"f1-wins",children:[l,"W"]}),e.jsx("span",{className:"f1-pts",children:f})]})}function me({onBack:a}){var G,H,V,Y,U;const[r,u]=n.useState(void 0),[h,f]=n.useState(!1),[l,N]=n.useState("film"),[j,C]=n.useState(!1),[Q,Z]=n.useState(!1),[T,L]=n.useState(!1),[$,I]=n.useState(!1),[A,E]=n.useState(!1),[S,ee]=n.useState(!1),w=n.useRef(null),x=n.useCallback(()=>{N("open"),C(!0)},[]);n.useEffect(()=>{const s=window.matchMedia("(prefers-reduced-motion: reduce)"),t=i=>{ee(i),i&&x()};t(s.matches);const c=i=>t(i.matches);return s.addEventListener("change",c),()=>s.removeEventListener("change",c)},[x]),n.useEffect(()=>{let s=!0;return fetch("/f1.json").then(t=>t.ok?t.json():Promise.reject(new Error(String(t.status)))).then(t=>s&&u(t)).catch(()=>s&&u(null)),()=>{s=!1}},[]),n.useEffect(()=>{if(!(r!=null&&r.season))return;let s=!0;return Promise.all([fetch(`${K}/${r.season}/driverstandings/?format=json`).then(t=>t.json()),fetch(`${K}/${r.season}/constructorstandings/?format=json`).then(t=>t.json())]).then(([t,c])=>{var M;if(!s)return;const i=t.MRData.StandingsTable.StandingsLists[0],z=c.MRData.StandingsTable.StandingsLists[0];(M=i==null?void 0:i.DriverStandings)!=null&&M.length&&(u(X=>({...X,round:Number(i.round)||X.round,drivers:i.DriverStandings.map(o=>{var q,J;return{pos:Number(o.position),points:Number(o.points),wins:Number(o.wins),code:o.Driver.code||o.Driver.familyName.slice(0,3).toUpperCase(),first:o.Driver.givenName,last:o.Driver.familyName,team:((q=o.Constructors[o.Constructors.length-1])==null?void 0:q.name)||"",teamId:((J=o.Constructors[o.Constructors.length-1])==null?void 0:J.constructorId)||""}}),constructors:((z==null?void 0:z.ConstructorStandings)||[]).map(o=>({pos:Number(o.position),points:Number(o.points),wins:Number(o.wins),name:o.Constructor.name,teamId:o.Constructor.constructorId}))})),f(!0))}).catch(()=>{}),()=>{s=!1}},[r==null?void 0:r.season]),n.useEffect(()=>{const s=w.current;!s||S||(s.volume=1,s.muted=!1,s.play().then(()=>L(!1)).catch(()=>{s.muted=!0,L(!0),I(!0),s.play().catch(()=>x())}))},[S,x]),n.useEffect(()=>{if(!$)return;const s=()=>{const t=w.current;t&&(t.muted=!1,t.volume=1,t.play().catch(()=>{}),L(!1)),I(!1)};return window.addEventListener("pointerdown",s,{once:!0}),window.addEventListener("keydown",s,{once:!0}),()=>{window.removeEventListener("pointerdown",s),window.removeEventListener("keydown",s)}},[$]),n.useEffect(()=>{if(l!=="film")return;const s=document.body.style.overflow;return document.body.style.overflow="hidden",window.scrollTo(0,0),()=>{document.body.style.overflow=s}},[l]),n.useEffect(()=>{if(l!=="film")return;const s=setTimeout(()=>Z(!0),3500),t=setTimeout(()=>{const c=w.current;(!c||c.paused||c.currentTime===0)&&x()},le);return()=>{clearTimeout(s),clearTimeout(t)}},[l,x]);const se=n.useCallback(()=>{const s=w.current;!(s!=null&&s.duration)||Number.isNaN(s.duration)||s.currentTime>=s.duration-oe&&C(!0)},[]),re=n.useCallback(()=>{E(!1),x()},[x]),P=n.useCallback(()=>{const s=w.current;s&&(s.muted=!s.muted,s.muted||(s.volume=1),L(s.muted),I(!1),s.paused&&s.play().catch(()=>{}))},[]),te=n.useCallback(()=>{const s=w.current;s&&(s.paused?(s.ended&&(s.currentTime=0),s.play().catch(()=>{})):s.pause())},[]),d=n.useMemo(()=>{if(!(r!=null&&r.races))return null;const s=Date.now();return r.races.find(t=>new Date(t.start).getTime()>s)||null},[r]),b=de(d==null?void 0:d.start),k=n.useMemo(()=>((r==null?void 0:r.races)||[]).filter(s=>new Date(s.start).getTime()<Date.now()),[r]),W=n.useMemo(()=>{if(!(r!=null&&r.drivers))return[];const s=new Map;for(const t of r.drivers)t.teamId&&(s.has(t.teamId)||s.set(t.teamId,[]),s.get(t.teamId).push(t));return[...s.entries()].map(([t,c])=>{const i=[...c].sort((z,M)=>M.points-z.points).slice(0,2);return i.length===2?{teamId:t,team:i[0].team,a:i[0],b:i[1],total:i[0].points+i[1].points}:null}).filter(Boolean).sort((t,c)=>c.total-t.total)},[r]),p=((G=r==null?void 0:r.drivers)==null?void 0:G.length)>=2?{p1:r.drivers[0],p2:r.drivers[1]}:null,O=r!=null&&r.races?r.races.length-k.length:0,ne=((V=(H=r==null?void 0:r.drivers)==null?void 0:H[0])==null?void 0:V.points)||1,ae=((U=(Y=r==null?void 0:r.constructors)==null?void 0:Y[0])==null?void 0:U.points)||1,_="/";return e.jsxs("div",{className:"f1-root",children:[e.jsxs("button",{onClick:a,title:"Back",className:"f1-back",children:[e.jsx("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2.2,children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19l-7-7 7-7"})}),e.jsx("span",{className:"hidden sm:inline",children:"Back"})]}),e.jsxs("div",{className:"f1-hero",children:[e.jsx("video",{ref:w,className:"f1-video",src:`${_}f1/hero.mp4`,poster:`${_}f1/poster.jpg`,playsInline:!0,preload:"auto",autoPlay:!S,onTimeUpdate:se,onEnded:re,onError:x,onPlay:()=>E(!0),onPause:()=>E(!1)}),e.jsx("div",{className:"f1-scrim","aria-hidden":"true"}),e.jsxs("div",{className:"f1-hero-inner",children:[e.jsx("div",{className:`f1-title${j?" f1-title-in":""}`,children:e.jsxs("h1",{className:"f1-h1",children:["Formula 1",e.jsx("span",{className:"f1-h1-kerb","aria-hidden":"true"})]})}),l==="open"&&e.jsxs("button",{onClick:()=>{var s;return(s=document.getElementById("f1-details"))==null?void 0:s.scrollIntoView({behavior:S?"auto":"smooth",block:"start"})},className:"f1-cue","aria-label":"Scroll to the championship",children:[e.jsx("span",{className:"f1-cue-text",children:"The standings"}),e.jsx("svg",{className:"w-5 h-5 f1-bob",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.8,children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M19 14l-7 7m0 0l-7-7m7 7V3"})})]})]}),$&&l==="film"&&e.jsxs("button",{onClick:P,className:"f1-sound-prompt",children:[e.jsxs("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.9,children:[e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M11 5L6 9H3v6h3l5 4V5z"}),e.jsx("path",{strokeLinecap:"round",d:"M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12"})]}),"Tap for sound"]}),l==="film"&&Q&&e.jsxs("button",{onClick:x,className:"f1-skip",children:["Skip the film",e.jsx("svg",{className:"w-3.5 h-3.5",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2,children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M13 5l7 7-7 7M5 5l7 7-7 7"})})]}),e.jsxs("div",{className:"f1-controls",children:[e.jsx("button",{onClick:te,className:"f1-ctl","aria-label":A?"Pause the film":"Play the film",children:A?e.jsxs("svg",{className:"w-4 h-4",viewBox:"0 0 24 24",fill:"currentColor",children:[e.jsx("rect",{x:"6",y:"5",width:"4",height:"14",rx:"1"}),e.jsx("rect",{x:"14",y:"5",width:"4",height:"14",rx:"1"})]}):e.jsx("svg",{className:"w-4 h-4",viewBox:"0 0 24 24",fill:"currentColor",children:e.jsx("path",{d:"M8 5.5v13l11-6.5z"})})}),e.jsx("button",{onClick:P,className:`f1-ctl${T?"":" f1-ctl-on"}`,"aria-label":T?"Unmute the film":"Mute the film",children:T?e.jsxs("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.9,children:[e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M11 5L6 9H3v6h3l5 4V5z"}),e.jsx("path",{strokeLinecap:"round",d:"M17 9l4 6m0-6l-4 6"})]}):e.jsxs("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:1.9,children:[e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M11 5L6 9H3v6h3l5 4V5z"}),e.jsx("path",{strokeLinecap:"round",d:"M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12"})]})})]})]}),l==="open"&&e.jsxs("div",{id:"f1-details",className:"f1-details",children:[e.jsx(D,{}),r===void 0&&e.jsx(m,{children:e.jsx("div",{className:"f1-state",children:"Warming the tyres…"})}),r===null&&e.jsx(m,{children:e.jsx("div",{className:"f1-state",children:"Couldn’t load the championship right now."})}),r&&e.jsxs(e.Fragment,{children:[e.jsx(m,{children:e.jsx(g,{children:e.jsxs("div",{className:"f1-pulse",children:[e.jsxs("div",{className:"f1-pulse-head",children:[e.jsxs("span",{className:"f1-pulse-round",children:["Round ",e.jsx("b",{children:k.length})," of ",r.races.length]}),e.jsxs("span",{className:"f1-note",children:[O," to go"]})]}),e.jsx("div",{className:"f1-track",role:"img","aria-label":`${k.length} of ${r.races.length} rounds complete`,children:e.jsx("span",{className:"f1-track-fill",style:{width:`${k.length/r.races.length*100}%`}})}),e.jsxs("div",{className:"f1-pulse-grid",children:[e.jsxs("div",{children:[e.jsx("b",{children:r.drivers.reduce((s,t)=>s+t.wins,0)}),e.jsx("span",{children:"races won"})]}),e.jsxs("div",{children:[e.jsx("b",{children:new Set(k.map(s=>{var t;return(t=s.winner)==null?void 0:t.last}).filter(Boolean)).size}),e.jsx("span",{children:"winners"})]}),e.jsxs("div",{children:[e.jsx("b",{children:new Set(r.races.map(s=>s.country)).size}),e.jsx("span",{children:"countries"})]}),e.jsxs("div",{children:[e.jsx("b",{children:r.constructors.length}),e.jsx("span",{children:"teams"})]})]})]})})}),d&&e.jsx(m,{children:e.jsx(g,{children:e.jsxs("div",{className:"f1-next",children:[e.jsxs("div",{className:"f1-next-tag",children:["Next up · Round ",d.round]}),e.jsx("h2",{className:"f1-next-name",children:d.name}),e.jsxs("p",{className:"f1-next-where",children:[d.circuit," · ",d.locality,", ",d.country,e.jsx("span",{className:"f1-dot",children:"·"}),R(d.start),", ",ce(d.start)]}),b&&!b.past&&e.jsx("div",{className:"f1-clock",children:[["Days",b.d],["Hrs",B(b.h)],["Min",B(b.m)],["Sec",B(b.s)]].map(([s,t])=>e.jsxs("div",{className:"f1-clock-cell",children:[e.jsx("div",{className:"f1-clock-num",children:t}),e.jsx("div",{className:"f1-clock-lab",children:s})]},s))}),(b==null?void 0:b.past)&&e.jsx("p",{className:"f1-sub",children:"Lights out."})]})})}),p&&e.jsx(m,{children:e.jsxs(g,{children:[e.jsx(y,{note:`${O} rounds left`,children:"The title race"}),e.jsxs("div",{className:"f1-duel",children:[e.jsxs("div",{className:"f1-duel-side",children:[e.jsx("span",{className:"f1-duel-pos",children:"P1"}),e.jsx("span",{className:"f1-duel-name",style:{color:v(p.p1.teamId)},children:p.p1.last}),e.jsx("span",{className:"f1-duel-pts",children:p.p1.points}),e.jsx("span",{className:"f1-sub",children:p.p1.team})]}),e.jsxs("div",{className:"f1-duel-gap",children:[e.jsx("b",{children:p.p1.points-p.p2.points}),e.jsx("span",{children:"points"})]}),e.jsxs("div",{className:"f1-duel-side",children:[e.jsx("span",{className:"f1-duel-pos",children:"P2"}),e.jsx("span",{className:"f1-duel-name",style:{color:v(p.p2.teamId)},children:p.p2.last}),e.jsx("span",{className:"f1-duel-pts",children:p.p2.points}),e.jsx("span",{className:"f1-sub",children:p.p2.team})]})]})]})}),e.jsx(D,{}),e.jsx(m,{children:e.jsxs(g,{children:[e.jsx(y,{note:h?"live":`after round ${r.round}`,children:"Drivers"}),e.jsx("div",{className:"space-y-1",children:r.drivers.map(s=>e.jsx(F,{pos:s.pos,color:v(s.teamId),name:`${s.first} ${s.last}`,sub:s.team,points:s.points,wins:s.wins,pct:s.points/ne*100,lead:s.pos===1},`${s.code}-${s.pos}`))})]})}),e.jsx(m,{children:e.jsxs(g,{children:[e.jsx(y,{note:`${r.constructors.length} teams`,children:"Constructors"}),e.jsx("div",{className:"space-y-1",children:r.constructors.map(s=>e.jsx(F,{pos:s.pos,color:v(s.teamId),name:s.name,points:s.points,wins:s.wins,pct:s.points/ae*100,lead:s.pos===1},s.teamId))})]})}),W.length>0&&e.jsx(m,{children:e.jsxs(g,{children:[e.jsx(y,{note:"points split",children:"Teammates"}),e.jsx("div",{className:"space-y-2.5",children:W.map(s=>{const t=s.total>0?s.a.points/s.total*100:0;return e.jsxs("div",{className:"f1-mate",children:[e.jsxs("div",{className:"f1-mate-head",children:[e.jsx("span",{className:"f1-mate-team",style:{color:v(s.teamId)},children:s.team}),e.jsxs("span",{className:"f1-note",children:[s.total," pts"]})]}),e.jsx("div",{className:"f1-mate-bar",children:e.jsx("span",{className:"f1-mate-fill",style:{width:`${t}%`,background:v(s.teamId)}})}),e.jsxs("div",{className:"f1-mate-feet",children:[e.jsxs("span",{children:[s.a.last," ",e.jsx("b",{children:s.a.points})]}),e.jsxs("span",{children:[e.jsx("b",{children:s.b.points})," ",s.b.last]})]})]},s.teamId)})})]})}),e.jsx(D,{}),k.some(s=>s.winner)&&e.jsx(m,{children:e.jsxs(g,{children:[e.jsx(y,{note:"winner · pole",children:"The season so far"}),e.jsx("div",{className:"space-y-1",children:k.filter(s=>s.winner).map(s=>e.jsxs("div",{className:"f1-past",children:[e.jsx("span",{className:"f1-pos",children:s.round}),e.jsxs("span",{className:"min-w-0 flex-1",children:[e.jsx("span",{className:"block text-[14px] leading-tight truncate",children:s.name}),e.jsxs("span",{className:"f1-sub block truncate",children:[e.jsx("b",{style:{color:v(s.winner.teamId)},children:s.winner.last}),e.jsx("span",{className:"f1-dot",children:"·"}),s.winner.team]})]}),s.pole&&e.jsxs("span",{className:"f1-pole",title:`Pole: ${s.pole.last} ${s.pole.time}`,children:[e.jsx("span",{className:"f1-pole-tag",children:"P"}),s.pole.last]})]},s.round))})]})}),r.lastRace&&e.jsx(m,{children:e.jsxs(g,{children:[e.jsx(y,{note:R(r.lastRace.date),children:"Last time out"}),e.jsxs("p",{className:"f1-sub -mt-3 mb-4",children:[r.lastRace.name," · ",r.lastRace.circuit]}),e.jsx("div",{className:"space-y-1",children:r.lastRace.podium.map(s=>e.jsx(F,{pos:s.pos,color:v(s.teamId),name:`${s.first} ${s.last}`,sub:`${s.team} · ${s.time}`,points:s.points,wins:0,pct:s.points/(r.lastRace.podium[0].points||1)*100,lead:s.pos===1},s.code))}),r.lastRace.fastestLap&&e.jsxs("p",{className:"f1-note mt-3.5",children:["Fastest lap — ",r.lastRace.fastestLap.driver," ",r.lastRace.fastestLap.time]})]})}),e.jsx(m,{children:e.jsxs(g,{children:[e.jsx(y,{note:`${r.races.length} rounds`,children:"The calendar"}),e.jsx("div",{className:"space-y-1",children:r.races.map(s=>{const t=new Date(s.start).getTime()<Date.now(),c=d&&s.round===d.round;return e.jsxs("div",{className:`f1-cal${t?" f1-cal-past":""}${c?" f1-cal-next":""}`,children:[e.jsx("span",{className:"f1-pos",children:s.round}),e.jsxs("span",{className:"min-w-0 flex-1",children:[e.jsx("span",{className:"block text-[14.5px] leading-tight truncate",children:s.name}),e.jsxs("span",{className:"f1-sub block truncate",children:[s.locality,", ",s.country]})]}),e.jsx("span",{className:"f1-cal-date",children:R(s.start)})]},s.round)})})]})}),e.jsx(D,{}),e.jsx(m,{children:e.jsx(g,{children:e.jsxs("div",{className:"f1-credits",children:[e.jsxs("p",{children:["Film: ",e.jsx("b",{children:"AMD Radeon PRO × Blender"})," for the Mercedes-AMG Petronas F1 Team, marking eight consecutive constructors’ titles (2014–2021). Rendered with Blender on an AMD Radeon PRO W6800. All rights belong to their owners; it is used here as a fan tribute, trimmed and re-encoded for the web."]}),e.jsxs("p",{children:["Timing and standings from"," ",e.jsx("a",{href:"https://api.jolpi.ca/ergast/f1/",target:"_blank",rel:"noopener noreferrer",children:"Jolpica-F1"}),", the community successor to Ergast. Not affiliated with Formula 1, the FIA, or any team."]}),r.generated&&e.jsxs("p",{className:"f1-note",children:["Snapshot ",new Date(r.generated).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}),h?" · standings refreshed live":""]})]})})})]})]}),e.jsx("style",{children:`
        .f1-root {
          --f1-red: #E10600;
          --f1-bg: #0A0A0C;
          --f1-card: #14141A;
          --f1-line: #26262F;
          --f1-fg: #F3F3F6;
          --f1-dim: #9A9AA6;
          position: relative;
          min-height: 100vh;
          background: var(--f1-bg);
          color: var(--f1-fg);
        }

        /* Hero */
        .f1-hero { position: relative; height: 100svh; min-height: 520px; overflow: hidden; }
        .f1-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .f1-scrim {
          position: absolute; inset: 0; pointer-events: none;
          background:
            radial-gradient(120% 80% at 50% 60%, transparent 35%, rgba(0,0,0,.55) 100%),
            linear-gradient(180deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.1) 30%, rgba(0,0,0,.45) 72%, var(--f1-bg) 100%);
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
        .f1-details { position: relative; z-index: 2; background: var(--f1-bg); }
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
      `})]})}export{me as default};
