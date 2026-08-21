import{r as c,j as e,R as T}from"./index-ByZnAZvz.js";const w=[{key:"test",label:"Test"},{key:"odi",label:"ODI"},{key:"t20i",label:"T20I"}],k="India",u=s=>new Date(`${s}T00:00:00Z`).toLocaleDateString("en-GB",{day:"numeric",month:"short",timeZone:"UTC"}),E=s=>Math.ceil((new Date(`${s}T00:00:00Z`).getTime()-Date.now())/864e5);function j({children:s,className:r="",delay:i=0}){const n=T.useRef(null),[l,m]=c.useState(!1);return c.useEffect(()=>{const h=n.current;if(!h)return;const x=new IntersectionObserver(([g])=>{g.isIntersecting&&(m(!0),x.disconnect())},{threshold:.1,rootMargin:"0px 0px -6% 0px"});return x.observe(h),()=>x.disconnect()},[]),e.jsx("div",{ref:n,className:`ck-reveal${l?" ck-in":""} ${r}`,style:{transitionDelay:`${i}ms`},children:s})}const I=()=>e.jsx("div",{className:"ck-seam","aria-hidden":"true"}),p=({children:s,id:r})=>e.jsx("section",{id:r,className:"max-w-3xl mx-auto px-5 sm:px-6 py-7 sm:py-9",children:s}),y=({children:s,note:r})=>e.jsxs("div",{className:"flex items-baseline justify-between gap-4 mb-5",children:[e.jsxs("h2",{className:"ck-h2",children:[e.jsx("span",{className:"ck-tick","aria-hidden":"true"}),s]}),r&&e.jsx("span",{className:"ck-note shrink-0",children:r})]});function D({formats:s,compact:r}){const i=w.filter(n=>s==null?void 0:s[n.key]);return i.length?e.jsx("div",{className:`ck-formats${r?" ck-formats-sm":""}`,children:i.map(n=>{const l=s[n.key];return e.jsxs("span",{className:"ck-fmt",children:[e.jsx("span",{className:"ck-fmt-k",children:n.label}),e.jsx("span",{className:"ck-fmt-v",children:l.result||`${l.matches} to play`})]},n.key)})}):null}function S({tour:s,featured:r}){const i=E(s.start),n=s.status==="live"?"On now":i<=0?"Under way":i===1?"Starts tomorrow":`Starts in ${i} days`;return e.jsxs("div",{className:`ck-tour${r?" ck-tour-big":""}`,children:[e.jsxs("div",{className:"ck-tour-top",children:[e.jsxs("span",{className:`ck-tag${s.status==="live"?" ck-tag-live":""}`,children:[s.status==="live"&&e.jsx("span",{className:"ck-pip","aria-hidden":"true"}),n]}),e.jsxs("span",{className:"ck-note",children:[u(s.start)," – ",u(s.ends)]})]}),e.jsxs("h3",{className:"ck-tour-name",children:[e.jsx("span",{className:s.away==="IND"?"ck-me":"",children:s.awayName}),e.jsx("span",{className:"ck-vs",children:"in"}),e.jsx("span",{className:s.home==="IND"?"ck-me":"",children:s.homeName})]}),e.jsx(D,{formats:s.formats,compact:!r})]})}function F({rows:s}){var i;const r=((i=s==null?void 0:s[0])==null?void 0:i.rating)||1;return e.jsx("div",{className:"ck-rank",children:(s||[]).map(n=>{const l=n.team===k;return e.jsxs("div",{className:`ck-row${l?" ck-row-me":""}`,children:[e.jsx("span",{className:"ck-bar",style:{width:`${Math.max(4,n.rating/r*100)}%`},"aria-hidden":"true"}),e.jsx("span",{className:"ck-pos",children:n.pos}),e.jsxs("span",{className:"min-w-0 flex-1 relative",children:[e.jsx("span",{className:"block text-[14.5px] font-medium leading-tight truncate",children:n.team}),e.jsxs("span",{className:"ck-sub block truncate",children:[n.matches," matches"]})]}),e.jsx("span",{className:"ck-rating",children:n.rating})]},n.code+n.pos)})})}function R({m:s}){const r=s.winner?`${s.winner} won by ${s.margin}`:s.margin||"No result";return e.jsxs("div",{className:"ck-res",children:[e.jsxs("div",{className:"ck-res-head",children:[e.jsxs("span",{className:"ck-res-teams",children:[e.jsx("span",{className:s.teams[0]===k?"ck-me":"",children:s.teams[0]}),e.jsx("span",{className:"ck-vs",children:"v"}),e.jsx("span",{className:s.teams[1]===k?"ck-me":"",children:s.teams[1]})]}),e.jsxs("span",{className:"ck-note shrink-0",children:[s.type,s.gender==="female"?" W":""," · ",u(s.date)]})]}),e.jsx("div",{className:"ck-res-line",children:r}),(s.event||s.city)&&e.jsx("div",{className:"ck-sub truncate",children:[s.event,s.city].filter(Boolean).join(" · ")})]})}function A({onBack:s}){var C;const[r,i]=c.useState(void 0),[n,l]=c.useState("odi"),[m,h]=c.useState(null),[x,g]=c.useState(!1);c.useEffect(()=>{let a=!0;return fetch("/cricket.json").then(t=>t.ok?t.json():Promise.reject(new Error(String(t.status)))).then(t=>a&&i(t)).catch(()=>a&&i(null)),()=>{a=!1}},[]),c.useEffect(()=>{if(!r||m)return;const a=(r.recent||[]).some(t=>t.teams.includes(k));h(a?"india":"intl")},[r,m]);const M=c.useMemo(()=>r?w.map(a=>{var t;return{...a,row:(((t=r.rankings)==null?void 0:t[a.key])||[]).find(d=>d.team===k)||null}}):[],[r]),o=c.useMemo(()=>((r==null?void 0:r.tours)||[]).filter(a=>a.status==="live"),[r]),b=c.useMemo(()=>((r==null?void 0:r.tours)||[]).filter(a=>a.status==="upcoming"),[r]),z=c.useMemo(()=>((r==null?void 0:r.tours)||[]).filter(a=>a.status==="done").reverse(),[r]),v=c.useMemo(()=>{const a=o.length?o:b;return a.find(t=>t.home==="IND"||t.away==="IND")||a[0]||null},[o,b]),$=c.useMemo(()=>(o.length?o:b).filter(a=>a!==v),[o,b,v]),f=c.useMemo(()=>{const a=(r==null?void 0:r.recent)||[];return m==="all"?a:m==="intl"?a.filter(t=>t.international):a.filter(t=>t.teams.includes(k))},[r,m]),N=x?f:f.slice(0,8);return e.jsxs("div",{className:"ck-root",children:[e.jsxs("button",{onClick:s,title:"Back",className:"ck-back",children:[e.jsx("svg",{className:"w-4 h-4",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",strokeWidth:2.2,children:e.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M15 19l-7-7 7-7"})}),e.jsx("span",{className:"hidden sm:inline",children:"Back"})]}),e.jsx("header",{className:"ck-hero",children:e.jsxs("div",{className:"max-w-3xl mx-auto px-5 sm:px-6",children:[e.jsx("h1",{className:"ck-h1",children:"Cricket"}),e.jsx("p",{className:"ck-lede",children:"Where India stand, what’s being played, and how the last few weeks finished."}),r&&e.jsx("div",{className:"ck-mine",children:M.map(({key:a,label:t,row:d})=>e.jsxs("div",{className:"ck-mine-cell",children:[e.jsx("span",{className:"ck-mine-fmt",children:t}),d?e.jsxs(e.Fragment,{children:[e.jsxs("span",{className:"ck-mine-pos",children:[e.jsx("b",{children:d.pos}),e.jsx("i",{children:d.pos===1?"st":d.pos===2?"nd":d.pos===3?"rd":"th"})]}),e.jsxs("span",{className:"ck-mine-rat",children:[d.rating," pts"]})]}):e.jsx("span",{className:"ck-mine-rat",children:"—"})]},a))})]})}),e.jsx(I,{}),r===void 0&&e.jsx(p,{children:e.jsx("div",{className:"ck-state",children:"Taking guard…"})}),r===null&&e.jsx(p,{children:e.jsx("div",{className:"ck-state",children:"Couldn’t load the cricket right now."})}),r&&e.jsxs(e.Fragment,{children:[v&&e.jsx(p,{children:e.jsxs(j,{children:[e.jsx(y,{note:o.length?`${o.length} on`:"next",children:o.length?"Out in the middle":"Next up"}),e.jsx(S,{tour:v,featured:!0}),$.length>0&&e.jsx("div",{className:"ck-tour-grid",children:$.slice(0,4).map(a=>e.jsx(S,{tour:a},a.name+a.start))})]})}),e.jsx(p,{children:e.jsxs(j,{children:[e.jsx(y,{note:"ICC ratings",children:"Rankings"}),e.jsx("div",{className:"ck-tabs",role:"tablist",children:w.map(a=>e.jsx("button",{role:"tab","aria-selected":n===a.key,onClick:()=>l(a.key),className:`ck-tab${n===a.key?" ck-tab-on":""}`,children:a.label},a.key))}),e.jsx(F,{rows:(C=r.rankings)==null?void 0:C[n]})]})}),e.jsx(p,{children:e.jsxs(j,{children:[e.jsx(y,{note:`${f.length} matches`,children:"Recently played"}),e.jsx("div",{className:"ck-switch",children:[{k:"india",label:"India"},{k:"intl",label:"Internationals"},{k:"all",label:"Everything"}].map(a=>e.jsx("button",{onClick:()=>{h(a.k),g(!1)},className:`ck-chip${m===a.k?" ck-chip-on":""}`,children:a.label},a.k))}),e.jsx("div",{className:"ck-res-list",children:N.map((a,t)=>e.jsx(R,{m:a},`${a.date}-${a.teams.join("-")}-${t}`))}),f.length>N.length&&e.jsxs("button",{onClick:()=>g(!0),className:"ck-more",children:["Show ",f.length-N.length," more"]})]})}),z.length>0&&e.jsx(p,{children:e.jsxs(j,{children:[e.jsx(y,{note:`${r.season} season`,children:"Tours already done"}),e.jsx("div",{className:"ck-past",children:z.map(a=>e.jsxs("div",{className:"ck-past-row",children:[e.jsx("span",{className:"ck-past-date",children:u(a.start)}),e.jsxs("span",{className:"min-w-0 flex-1",children:[e.jsxs("span",{className:"block text-[13.5px] truncate",children:[e.jsx("span",{className:a.away==="IND"?"ck-me":"",children:a.awayName})," ","in"," ",e.jsx("span",{className:a.home==="IND"?"ck-me":"",children:a.homeName})]}),e.jsx(D,{formats:a.formats,compact:!0})]})]},a.name+a.start))})]})}),e.jsx(I,{}),e.jsx(p,{children:e.jsxs("div",{className:"ck-foot",children:[e.jsx("p",{children:"Rankings and the tour calendar come from Wikipedia; results come from Cricsheet’s ball-by-ball archive. Built with the site, not fetched live — so the numbers are current as of the last deploy."}),e.jsx("p",{className:"ck-foot-links",children:(r.sources||[]).map(a=>e.jsx("a",{href:a.url,target:"_blank",rel:"noreferrer",children:a.name},a.url))}),r.generated&&e.jsxs("p",{className:"ck-note",children:["Updated ",u(r.generated.slice(0,10))]})]})})]}),e.jsx("style",{children:`
        .ck-root {
          --ck-bg: #07110C;
          --ck-card: #0E1A13;
          --ck-line: #1D3327;
          --ck-fg: #F0F5F1;
          --ck-dim: #8CA396;
          --ck-turf: #35B96C;
          --ck-ball: #A11E1E;
          --ck-india: #FF9A3C;
          position: relative;
          min-height: 100vh;
          background: var(--ck-bg);
          color: var(--ck-fg);
        }
        .ck-back {
          position: fixed; top: 1rem; left: 1rem; z-index: 40;
          display: inline-flex; align-items: center; gap: .4rem;
          padding: .5rem .7rem; border-radius: 9999px;
          font-size: 12px; letter-spacing: .02em;
          color: var(--ck-dim);
          background: rgba(7,17,12,.72);
          border: 1px solid var(--ck-line);
          backdrop-filter: blur(8px);
          transition: color .2s ease, border-color .2s ease;
        }
        .ck-back:hover { color: #fff; border-color: var(--ck-turf); }

        .ck-hero {
          padding: 5.5rem 0 2.25rem;
          background:
            radial-gradient(120% 80% at 50% 0%, rgba(53,185,108,.14) 0%, transparent 62%),
            var(--ck-bg);
        }
        .ck-h1 {
          font-size: clamp(2.6rem, 11vw, 4.6rem);
          font-weight: 600; letter-spacing: -.035em; line-height: .95;
        }
        .ck-lede {
          margin-top: .85rem; max-width: 34rem;
          font-size: 14px; line-height: 1.6; color: var(--ck-dim);
        }
        .ck-mine {
          margin-top: 1.6rem;
          display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: .5rem;
        }
        .ck-mine-cell {
          padding: .7rem .8rem; border-radius: .7rem;
          background: var(--ck-card); border: 1px solid var(--ck-line);
        }
        .ck-mine-fmt {
          display: block; font-family: ui-monospace, monospace;
          font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase;
          color: var(--ck-dim);
        }
        .ck-mine-pos { display: block; margin-top: .25rem; color: var(--ck-india); }
        .ck-mine-pos b { font-size: 1.55rem; font-weight: 600; letter-spacing: -.02em; }
        .ck-mine-pos i { font-style: normal; font-size: .8rem; margin-left: .1rem; }
        .ck-mine-rat {
          display: block; font-family: ui-monospace, monospace;
          font-size: 11px; color: var(--ck-dim);
        }

        /* The mown outfield with a painted crease along the top. The first
           version of this was a red band with white stitching — meant as a
           ball seam, but a thin red-and-white striped bar is a racing kerb
           no matter what you call it, and it dragged the F1 page onto this
           one. Green on green with a crease line can only be cricket. */
        .ck-seam {
          height: 14px;
          border-top: 1px solid rgba(240,245,241,.5);
          background:
            repeating-linear-gradient(90deg,
              rgba(255,255,255,.06) 0 16px,
              rgba(0,0,0,.11) 30px 46px,
              rgba(255,255,255,.06) 60px),
            linear-gradient(180deg, rgba(53,185,108,.22), rgba(53,185,108,0));
        }

        .ck-state {
          height: 8rem; display: flex; align-items: center; justify-content: center;
          color: var(--ck-dim); font-size: 13px;
        }
        .ck-h2 {
          display: flex; align-items: center; gap: .6rem;
          font-weight: 500; font-size: clamp(1.35rem, 3.4vw, 1.9rem);
        }
        .ck-tick {
          width: 4px; height: 1.15em; border-radius: 2px;
          background: var(--ck-turf); flex-shrink: 0;
        }
        .ck-note { font-family: ui-monospace, monospace; font-size: 11px; color: var(--ck-dim); opacity: .9; }
        .ck-sub { font-size: 11.5px; color: var(--ck-dim); }
        .ck-me { color: var(--ck-india); }
        .ck-vs { margin: 0 .4rem; color: var(--ck-dim); font-size: .82em; }

        .ck-tour {
          padding: .95rem 1rem; border-radius: .85rem;
          background: var(--ck-card); border: 1px solid var(--ck-line);
        }
        .ck-tour-big { padding: 1.15rem 1.2rem; }
        .ck-tour-top { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .ck-tour-name {
          margin-top: .5rem;
          font-size: clamp(1.05rem, 3.6vw, 1.4rem); font-weight: 500; letter-spacing: -.01em;
        }
        .ck-tour-grid {
          margin-top: .6rem;
          display: grid; grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr)); gap: .6rem;
        }
        .ck-tag {
          display: inline-flex; align-items: center; gap: .4rem;
          font-family: ui-monospace, monospace; font-size: 10.5px;
          letter-spacing: .07em; text-transform: uppercase; color: var(--ck-dim);
        }
        .ck-tag-live { color: var(--ck-turf); }
        .ck-pip {
          width: 6px; height: 6px; border-radius: 9999px;
          background: var(--ck-turf); animation: ck-pulse 1.8s ease-in-out infinite;
        }
        @keyframes ck-pulse { 0%,100% { opacity: 1 } 50% { opacity: .25 } }

        .ck-formats { margin-top: .7rem; display: flex; flex-wrap: wrap; gap: .4rem; }
        .ck-fmt {
          display: inline-flex; align-items: baseline; gap: .35rem;
          padding: .25rem .5rem; border-radius: .4rem;
          background: rgba(255,255,255,.04); border: 1px solid var(--ck-line);
        }
        .ck-fmt-k {
          font-family: ui-monospace, monospace; font-size: 9.5px;
          letter-spacing: .07em; text-transform: uppercase; color: var(--ck-dim);
        }
        .ck-fmt-v { font-size: 12.5px; }
        .ck-formats-sm .ck-fmt-v { font-size: 11.5px; }
        .ck-formats-sm { margin-top: .45rem; }

        .ck-tabs { display: flex; gap: .35rem; margin-bottom: .75rem; }
        .ck-tab {
          padding: .35rem .8rem; border-radius: 9999px;
          font-size: 12px; color: var(--ck-dim);
          border: 1px solid var(--ck-line); background: transparent;
          transition: color .18s ease, border-color .18s ease, background .18s ease;
        }
        .ck-tab:hover { color: var(--ck-fg); }
        .ck-tab-on { color: #061009; background: var(--ck-turf); border-color: var(--ck-turf); }

        .ck-rank { display: flex; flex-direction: column; gap: .3rem; }
        .ck-row {
          position: relative; overflow: hidden;
          display: flex; align-items: center; gap: .7rem;
          padding: .55rem .7rem; border-radius: .55rem;
          border: 1px solid transparent;
        }
        .ck-row-me { background: var(--ck-card); border-color: var(--ck-line); }
        .ck-bar {
          position: absolute; left: 0; top: 0; bottom: 0;
          background: var(--ck-turf); opacity: .12;
        }
        .ck-row-me .ck-bar { background: var(--ck-india); opacity: .16; }
        .ck-pos {
          position: relative; width: 1.4rem; flex-shrink: 0;
          font-family: ui-monospace, monospace; font-size: 12px; color: var(--ck-dim);
        }
        .ck-rating {
          position: relative; font-family: ui-monospace, monospace;
          font-size: 14px; font-weight: 600;
        }
        .ck-row-me .ck-rating { color: var(--ck-india); }

        .ck-switch { display: flex; gap: .35rem; margin-bottom: .75rem; }
        .ck-chip {
          padding: .3rem .7rem; border-radius: 9999px;
          font-size: 11.5px; color: var(--ck-dim);
          border: 1px solid var(--ck-line); background: transparent;
          transition: color .18s ease, border-color .18s ease;
        }
        .ck-chip:hover { color: var(--ck-fg); }
        .ck-chip-on { color: var(--ck-fg); border-color: var(--ck-turf); }

        .ck-res-list { display: flex; flex-direction: column; gap: .4rem; }
        .ck-res {
          padding: .6rem .75rem; border-radius: .6rem;
          background: var(--ck-card); border: 1px solid var(--ck-line);
        }
        .ck-res-head { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; }
        .ck-res-teams { font-size: 13.5px; font-weight: 500; min-width: 0; }
        .ck-res-line { margin-top: .15rem; font-size: 12.5px; color: var(--ck-turf); }
        .ck-more {
          margin-top: .7rem; width: 100%;
          padding: .5rem; border-radius: .55rem;
          font-size: 12px; color: var(--ck-dim);
          border: 1px dashed var(--ck-line); background: transparent;
          transition: color .18s ease, border-color .18s ease;
        }
        .ck-more:hover { color: var(--ck-fg); border-color: var(--ck-turf); }

        .ck-past { display: flex; flex-direction: column; }
        .ck-past-row {
          display: flex; align-items: flex-start; gap: .8rem;
          padding: .6rem 0; border-bottom: 1px solid var(--ck-line);
        }
        .ck-past-row:last-child { border-bottom: 0; }
        .ck-past-date {
          width: 3.6rem; flex-shrink: 0; padding-top: .1rem;
          font-family: ui-monospace, monospace; font-size: 11px; color: var(--ck-dim);
        }

        .ck-foot { font-size: 12px; color: var(--ck-dim); line-height: 1.65; }
        .ck-foot-links { margin-top: .5rem; display: flex; flex-wrap: wrap; gap: .9rem; }
        .ck-foot-links a { color: var(--ck-dim); text-decoration: underline; text-underline-offset: 3px; }
        .ck-foot-links a:hover { color: var(--ck-turf); }

        .ck-reveal {
          opacity: 0; transform: translateY(14px);
          transition: opacity .6s ease, transform .6s cubic-bezier(.22,.61,.36,1);
        }
        .ck-in { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) {
          .ck-reveal { opacity: 1; transform: none; transition: none; }
          .ck-pip { animation: none; }
        }
      `})]})}export{A as default};
