import{r as s,j as e,W as A}from"./index-DCxtkSFc.js";import z,{SUPABASE_URL as E,SUPABASE_KEY as v}from"./supabase-D5VaaB5d.js";const B="#C0392B",M="#2E2A26",T="#6A625B",C="#FBF7EE",I="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap",J="'Caveat', 'Segoe Script', 'Bradley Hand', cursive",l=[{n:1,marks:20,paper:"Paper I — Data Structures & Algorithms",q:"The candidate executed the following at 2 AM. Identify the fault.",code:`def revise(syllabus):
    if panic:
        return revise(syllabus)`,opts:["Infinite recursion — there is no base case","Stack overflow, roughly four minutes in","The base case exists. It is called sleep() and was never invoked.","All of the above. Kill the process. Go to bed."],note:"Correct. Base case restored."},{n:2,marks:20,paper:"Paper II — Database Systems",q:"The following query is executed against the mid-semester schema. State the output.",code:`SELECT subject
  FROM midsem
 WHERE difficulty > amrutha.capability;`,opts:["Empty set (0.00 sec)","0 rows returned","NULL","All of the above, which are the same thing, which is the point"],note:"Correct. No rows, as expected."},{n:3,marks:15,paper:"Paper III — AI Systems",q:"A model was asked to predict the candidate’s result. Classify the output below.",code:`>>> predict("will she clear all four?")
'hmm, that depends on a few factors…'`,opts:["A hallucination","A severe hallucination","Model collapse — roll back to the last good checkpoint","All of the above. Deprecate the model and retrain it on facts."],note:"Correct. Model deprecated."},{n:4,marks:15,paper:"Paper IV — Cloud Computing",q:"Attribute the spend below to the correct owner.",code:`$ aws ce get-cost --service caffeine
  Sep 14    240
  Sep 15    380
  Sep 16    520
  Sep 17   1290`,opts:["The candidate, revising","The syllabus, expanding","A third party who keeps her talking past midnight","That same third party, who knows exactly what he did. Tag it to his account."],note:"Correct. Charged to him."},{n:5,marks:15,paper:"Section E — General Studies",q:"The candidate’s phone, throughout exam week, has been:",opts:["On Do Not Disturb","Face down, screen dimmed","Face down — but checked anyway, for one particular name","All of the above. The examiner has no further questions."],note:"Correct. No follow-up."},{n:6,marks:15,paper:"Bonus — Post-Deployment",q:"On successful completion of the above, the candidate is to be released to production at:",opts:["Sri Lanka — Colombo, to land and eat immediately","Sri Lanka — Kandy, for the lake and the tooth temple","Sri Lanka — Ella, for the Nine Arch Bridge and the blue train","Sri Lanka — Galle as well. All four. Nine days. Book it before the results are out."],note:"Correct. Approved. Book it."}],d=l.reduce((x,o)=>x+o.marks,0);function R({onBack:x}){const[o,g]=s.useState({}),[p,b]=s.useState(!1),y=s.useRef(null);s.useEffect(()=>{if(document.querySelector("link[data-hand-font]"))return;const t=document.createElement("link");t.rel="stylesheet",t.href=I,t.setAttribute("data-hand-font",""),document.head.appendChild(t)},[]);const i=s.useMemo(()=>l.filter(t=>o[t.n]!=null).length,[o]),h=s.useMemo(()=>l.reduce((t,a)=>t+(o[a.n]!=null?a.marks:0),0),[o]),f=i===l.length,j=s.useRef(typeof crypto<"u"&&crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`),c=s.useRef(""),m=s.useMemo(()=>({session:j.current,answered:i,total:h,answers:l.map(t=>{const a=o[t.n];return{n:t.n,paper:t.paper,option:a==null?null:"abcd"[a],answer:a==null?null:t.opts[a]}})}),[o,i,h]);s.useEffect(()=>{if(i===0)return;const t=JSON.stringify(m.answers);if(t===c.current)return;const a=setTimeout(()=>{t!==c.current&&(c.current=t,z.from("exam_answers").insert(m).then(({error:r})=>{r&&console.warn("[exams] not recorded:",r.message)}))},1200);return()=>clearTimeout(a)},[i,m]);const w=s.useRef(m);w.current=m,s.useEffect(()=>{const t=()=>{const r=w.current;if(!r.answered)return;const n=JSON.stringify(r.answers);n!==c.current&&(c.current=n,fetch(`${E}/rest/v1/exam_answers`,{method:"POST",keepalive:!0,headers:{apikey:v,Authorization:`Bearer ${v}`,"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify(r)}).catch(()=>{}))},a=()=>{document.visibilityState==="hidden"&&t()};return window.addEventListener("pagehide",t),document.addEventListener("visibilitychange",a),()=>{window.removeEventListener("pagehide",t),document.removeEventListener("visibilitychange",a)}},[]),s.useEffect(()=>{if(!f||p)return;const t=setTimeout(()=>{b(!0);const a=y.current;a&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches&&requestAnimationFrame(()=>{a.scrollIntoView({behavior:"smooth",block:"center"})})},520);return()=>clearTimeout(t)},[f,p]);const N=s.useCallback((t,a)=>{g(r=>r[t]===a?r:{...r,[t]:a})},[]),S=()=>{g({}),b(!1),window.scrollTo({top:0,behavior:"smooth"})},k=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});return e.jsxs("div",{className:"ex-root",children:[e.jsx("style",{children:$}),e.jsxs("div",{className:"ex-wrap",children:[e.jsxs("button",{onClick:x,className:"ex-back",children:[e.jsx("span",{"aria-hidden":"true",children:"←"})," Back"]}),e.jsxs("div",{className:"ex-sheet",children:[e.jsx("div",{className:"ex-rule","aria-hidden":"true"}),e.jsxs("header",{className:"ex-head",children:[e.jsx("p",{className:"ex-uni",children:"Work Integrated Learning Programme"}),e.jsx("h1",{className:"ex-title",children:"Mid‑Semester Examination"}),e.jsx("p",{className:"ex-sub",children:"Computer Systems · four papers · seven days of revision."}),e.jsxs("div",{className:"ex-meta",children:[e.jsxs("span",{children:["Papers: ",e.jsx("b",{children:"4"})]}),e.jsx("span",{className:"ex-dot","aria-hidden":"true",children:"·"}),e.jsxs("span",{children:["Max Marks: ",e.jsx("b",{children:d})]}),e.jsx("span",{className:"ex-dot","aria-hidden":"true",children:"·"}),e.jsxs("span",{children:["Pass Marks: ",e.jsx("b",{children:"irrelevant"})]})]}),e.jsxs("div",{className:"ex-roll",children:[e.jsx("span",{className:"ex-roll-label",children:"Roll No."}),e.jsx("span",{className:"ex-roll-box",children:e.jsx("span",{className:"ex-hand ex-roll-name",children:"Amrutha"})})]})]}),e.jsxs("section",{className:"ex-instr","aria-label":"Instructions to candidates",children:[e.jsx("p",{className:"ex-instr-h",children:"Instructions to the Candidate"}),e.jsxs("ol",{children:[e.jsx("li",{children:"All questions are compulsory. All answers are correct. This is not a trick."}),e.jsx("li",{children:"Answers may be written in any language — English, Telugu, SQL, or eye contact."}),e.jsx("li",{children:"Water bottles are permitted. Snacks are permitted. Self-doubt is confiscated at the door."}),e.jsx("li",{children:"Do not ask the invigilator for clarification — they have not read the syllabus either."}),e.jsx("li",{children:"Any candidate caught underestimating herself will be asked to leave the hall."})]})]}),e.jsx("div",{className:"ex-qs",children:l.map(t=>{const a=o[t.n]!=null;return e.jsxs("section",{className:`ex-q ${a?"is-done":""}`,children:[t.paper&&e.jsx("p",{className:"ex-paper",children:t.paper}),e.jsxs("div",{className:"ex-q-head",children:[e.jsxs("span",{className:"ex-q-n",children:["Q",t.n,"."]}),e.jsx("p",{className:"ex-q-t",children:t.q.split(`
`).map((r,n)=>e.jsxs(A.Fragment,{children:[n>0&&e.jsx("br",{}),r]},n))}),e.jsxs("span",{className:"ex-q-m",children:["[",t.marks,"]"]})]}),t.code&&e.jsx("pre",{className:"ex-code",children:t.code}),e.jsx("ul",{className:"ex-opts",children:t.opts.map((r,n)=>{const u=o[t.n]===n;return e.jsx("li",{children:e.jsxs("button",{type:"button",onClick:()=>N(t.n,n),"aria-pressed":u,className:`ex-opt ${u?"is-on":""}`,children:[e.jsx("span",{className:"ex-bub","aria-hidden":"true",children:"abcd"[n]}),e.jsx("span",{className:"ex-opt-t",children:r}),u&&e.jsx("span",{className:"ex-hand ex-tick","aria-hidden":"true",children:"✓"})]})},n)})}),e.jsx("p",{className:`ex-hand ex-note ${a?"is-in":""}`,"aria-live":"polite",children:a?`${t.note}  ${t.marks}/${t.marks}`:""})]},t.n)})}),e.jsxs("div",{className:"ex-total","aria-live":"polite",children:[e.jsx("span",{className:"ex-total-l",children:"Total"}),e.jsxs("span",{className:"ex-hand ex-total-n",children:[h,e.jsxs("span",{className:"ex-total-d",children:["/",d]})]})]}),i>0&&e.jsx("p",{className:"ex-filed",children:"Answers are collected as you go. The examiner has your paper."}),e.jsx("div",{className:"ex-result",ref:y,children:f?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:`ex-stamp ${p?"is-in":""}`,role:"img","aria-label":`Stamped: All the best, Amrutha. Mid-semester, ${k}. Result: certain.`,children:[e.jsx("span",{className:"ex-stamp-top",children:"Office of Good Wishes"}),e.jsx("strong",{className:"ex-stamp-big",children:"All the Best"}),e.jsxs("span",{className:"ex-stamp-bot",children:["Amrutha · All Four Papers · ",k]}),e.jsx("span",{className:"ex-stamp-res",children:"Result: certain"})]}),e.jsxs("div",{className:`ex-remark ${p?"is-in":""}`,children:[e.jsx("p",{className:"ex-remark-l",children:"Examiner's remarks"}),e.jsxs("p",{className:"ex-hand ex-remark-t",children:[d,"/",d," across all four papers. Not marked generously — there was simply nothing to deduct, because you're too good."]}),e.jsx("p",{className:"ex-hand ex-remark-t",children:"That is the joke over. Here is the real note: you are about to put half a semester away in seven days and still walk in steadier than people who started in July. You always do."}),e.jsx("p",{className:"ex-hand ex-wish",children:"Go get them, A!"}),e.jsx("p",{className:"ex-hand ex-sign",children:"— K"})]}),e.jsxs("button",{onClick:S,className:"ex-reset",children:["Attempt again (you'll still get ",d,")"]})]}):e.jsxs("p",{className:"ex-await",children:[i," of ",l.length," attempted — the examiner is waiting with the stamp ready."]})})]}),e.jsx("p",{className:"ex-foot",children:"No actual examination board was consulted in the making of this page."})]})]})}const $=`
.ex-root {
  --red: ${B};
  --ink: ${M};
  --soft: ${T};
  min-height: 100vh;
  background:
    radial-gradient(1100px 600px at 50% -10%, #ffffff 0%, rgba(255,255,255,0) 60%),
    ${C};
  color: var(--ink);
  padding: 1.5rem 1rem 4rem;
  font-family: 'Newsreader', Georgia, serif;
}
.ex-wrap { max-width: 44rem; margin: 0 auto; }

/* Anything the examiner or the candidate "wrote" by hand. */
.ex-hand { font-family: ${J}; font-weight: 600; }

.ex-back {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--soft); padding: 0.6rem 0.2rem; margin-bottom: 1rem;
  background: none; border: 0; cursor: pointer; min-height: 44px;
}
.ex-back:hover { color: var(--ink); }

/* ---------- the sheet itself ---------- */
.ex-sheet {
  position: relative;
  background: #fffdf8;
  border: 1px solid rgba(46,42,38,0.13);
  border-radius: 2px;
  padding: 2rem 1.25rem 2.5rem 2.5rem;
  box-shadow:
    0 1px 2px rgba(46,42,38,0.05),
    0 12px 28px -12px rgba(46,42,38,0.18);
  /* faint ruled lines — texture, not lines you are meant to write on,
     so they stay well under the printed text rather than cutting it */
  background-image: repeating-linear-gradient(
    to bottom, transparent 0 31px, rgba(92,127,168,0.07) 31px 32px);
  background-position: 0 2rem;
}
@media (min-width: 640px) {
  .ex-sheet { padding: 2.75rem 2.25rem 3rem 3.5rem; }
}
/* the red margin rule down the left */
.ex-rule {
  position: absolute; top: 0; bottom: 0; left: 1.5rem;
  width: 1px; background: rgba(192,57,43,0.34);
}
@media (min-width: 640px) { .ex-rule { left: 2.25rem; } }

/* ---------- header ---------- */
.ex-head { text-align: center; padding-bottom: 1.25rem; border-bottom: 2px solid rgba(46,42,38,0.16); }
.ex-uni {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase;
  color: var(--soft); margin-bottom: 0.65rem;
}
.ex-title {
  font-family: 'Newsreader', Georgia, serif;
  font-weight: 500; font-size: clamp(1.5rem, 6vw, 2.4rem);
  line-height: 1.1; letter-spacing: -0.01em; margin-bottom: 0.4rem;
}
.ex-sub { font-style: italic; color: var(--soft); font-size: 0.95rem; margin-bottom: 1rem; }
.ex-meta {
  display: flex; flex-wrap: wrap; justify-content: center; align-items: center;
  gap: 0.4rem 0.55rem;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px; color: var(--soft);
}
.ex-meta b { color: var(--ink); font-weight: 600; }
.ex-dot { opacity: 0.45; }
/* Stacked on narrow screens — inline, the separator gets orphaned at
   the end of the wrapped line. */
@media (max-width: 479px) {
  .ex-meta { flex-direction: column; gap: 0.3rem; }
  .ex-dot { display: none; }
}

.ex-roll {
  display: flex; align-items: center; justify-content: center;
  gap: 0.6rem; margin-top: 1.25rem;
}
.ex-roll-label {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--soft);
}
.ex-roll-box {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 10.5rem; padding: 0.3rem 1rem;
  border: 1px solid rgba(46,42,38,0.28);
  border-radius: 2px; background: rgba(255,255,255,0.6);
}
.ex-roll-name { color: var(--red); font-size: 1.5rem; line-height: 1.1; }

/* ---------- instructions ---------- */
.ex-instr { margin: 1.5rem 0 0.5rem; }
.ex-instr-h {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--soft); margin-bottom: 0.6rem;
}
.ex-instr ol { list-style: decimal; padding-left: 1.2rem; }
.ex-instr li {
  font-size: 0.95rem; line-height: 1.85; color: var(--ink); opacity: 0.86;
  padding-left: 0.15rem;
}

/* ---------- questions ---------- */
.ex-qs { margin-top: 2rem; display: flex; flex-direction: column; gap: 2.25rem; }

/* Which paper this question belongs to — the four subjects are the
   whole joke, so they get their own rule rather than a parenthetical. */
.ex-paper {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 9.5px; letter-spacing: 0.16em; text-transform: uppercase;
  color: var(--soft); margin-bottom: 0.6rem;
  padding-bottom: 0.4rem; border-bottom: 1px dashed rgba(46,42,38,0.18);
}
.ex-q-head { display: flex; align-items: baseline; gap: 0.5rem; }
.ex-q-n { font-weight: 600; white-space: nowrap; }
.ex-q-t { flex: 1; line-height: 1.6; font-size: 1.02rem; }
.ex-q-m {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px; color: var(--soft); white-space: nowrap;
}

/* the printed SQL in the database question */
.ex-code {
  display: inline-block; max-width: 100%;
  margin: 0.9rem 0 0 1.9rem;
  padding: 0.85rem 1.15rem;
  background: rgba(46,42,38,0.045);
  border-left: 2px solid rgba(46,42,38,0.22);
  border-radius: 2px;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px; line-height: 1.7; color: var(--ink);
  white-space: pre; overflow-x: auto;
}
@media (max-width: 479px) {
  .ex-code { margin-left: 0; font-size: 11px; padding: 0.7rem 0.8rem; }
}

.ex-opts { list-style: none; margin: 0.85rem 0 0; padding: 0 0 0 1.9rem; display: flex; flex-direction: column; gap: 0.3rem; }.ex-opt {  display: flex; align-items: center; gap: 0.7rem; width: 100%;
  text-align: left; background: none; border: 0; cursor: pointer;
  padding: 0.55rem 0.6rem; min-height: 44px; border-radius: 4px;
  font-family: inherit; font-size: 0.98rem; color: var(--ink);
  transition: background 0.18s ease;
}
.ex-opt:hover { background: rgba(192,57,43,0.045); }
.ex-bub {
  flex: none; width: 1.55rem; height: 1.55rem; border-radius: 50%;
  border: 1px solid rgba(46,42,38,0.3);
  display: inline-flex; align-items: center; justify-content: center;
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 11px;
  color: var(--soft); transition: all 0.18s ease;
}
.ex-opt.is-on .ex-bub { border-color: var(--red); background: var(--red); color: #fff; }
.ex-opt.is-on .ex-opt-t { color: var(--ink); }
.ex-opt-t { flex: 1; }
.ex-tick { color: var(--red); font-size: 1.5rem; line-height: 1; }


/* margin note from the examiner */
.ex-note {
  color: var(--red); font-size: 1.3rem; line-height: 1.35;
  padding-left: 1.9rem; margin-top: 0.5rem; min-height: 1.35rem;
  opacity: 0; transform: translateY(4px) rotate(-1.4deg);
  transition: opacity 0.32s ease, transform 0.32s ease;
}
.ex-note.is-in { opacity: 1; transform: translateY(0) rotate(-1.4deg); }

/* ---------- total ---------- */
.ex-total {
  display: flex; align-items: baseline; justify-content: flex-end; gap: 0.75rem;
  margin-top: 2.5rem; padding-top: 1rem;
  border-top: 2px solid rgba(46,42,38,0.16);
}
.ex-total-l {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--soft);
}
.ex-total-n { color: var(--red); font-size: 2.4rem; line-height: 1; }
.ex-total-d { font-size: 1.4rem; opacity: 0.6; }

/* ---------- result ---------- */
.ex-result { margin-top: 2rem; text-align: center; }
.ex-await {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px; line-height: 1.7; color: var(--soft);
}

.ex-stamp {
  display: inline-flex; flex-direction: column; align-items: center; gap: 0.25rem;
  padding: 0.95rem 1.5rem 0.85rem;
  border: 2.5px solid var(--red); border-radius: 5px;
  color: var(--red);
  transform: rotate(-7deg) scale(1);
  opacity: 0.88;
  max-width: 100%;
}
.ex-stamp.is-in { animation: exStamp 0.42s cubic-bezier(0.2, 1.5, 0.4, 1) both; }
@keyframes exStamp {
  0%   { opacity: 0; transform: rotate(-16deg) scale(2.1); }
  60%  { opacity: 0.95; transform: rotate(-6deg) scale(0.94); }
  100% { opacity: 0.88; transform: rotate(-7deg) scale(1); }
}
.ex-stamp-top, .ex-stamp-bot, .ex-stamp-res {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  letter-spacing: 0.16em; text-transform: uppercase;
}
.ex-stamp-top { font-size: 8.5px; opacity: 0.85; }
.ex-stamp-big {
  font-family: 'Newsreader', Georgia, serif;
  font-size: clamp(1.4rem, 6.4vw, 2.1rem); font-weight: 600;
  letter-spacing: 0.01em; line-height: 1.15; text-transform: uppercase;
  margin: 0.1rem 0 0.2rem;
}
.ex-stamp-bot { font-size: 8.5px; opacity: 0.85; }
.ex-stamp-res {
  font-size: 8.5px; margin-top: 0.5rem;
  padding-top: 0.42rem; border-top: 1px solid rgba(192,57,43,0.4);
  width: 100%; text-align: center;
}

.ex-filed {
  margin-top: 0.85rem;
  text-align: right;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--soft);
}

.ex-remark { margin-top: 2.25rem; text-align: left; opacity: 0; }.ex-remark.is-in { animation: exFade 0.5s ease 0.25s both; }
@keyframes exFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.ex-remark-l {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--soft); margin-bottom: 0.5rem;
}
.ex-remark-t { color: var(--red); font-size: 1.45rem; line-height: 1.5; }
.ex-remark-t + .ex-remark-t { margin-top: 0.85rem; }

/* The line the whole page exists for. It gets the size. */
.ex-wish {
  color: var(--red);
  font-size: clamp(1.9rem, 6vw, 2.5rem);
  line-height: 1.2;
  margin-top: 1.5rem;
}
.ex-sign { color: var(--red); font-size: 1.45rem; margin-top: 0.75rem; }


.ex-reset {
  margin-top: 2rem;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px; letter-spacing: 0.06em;
  color: var(--soft); background: none;
  border: 1px solid rgba(46,42,38,0.2); border-radius: 999px;
  padding: 0.7rem 1.2rem; min-height: 44px; cursor: pointer;
  transition: all 0.18s ease;
}
.ex-reset:hover { color: var(--ink); border-color: rgba(46,42,38,0.4); }

.ex-foot {
  margin-top: 1.5rem; text-align: center;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px; color: var(--soft); opacity: 0.75; line-height: 1.6;
}

@media (prefers-reduced-motion: reduce) {
  .ex-stamp.is-in, .ex-remark.is-in { animation: none; }
  .ex-remark { opacity: 1; }
  .ex-note { transition: none; }
}
`;export{R as default};
