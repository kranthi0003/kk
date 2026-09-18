import{r as n,j as e,W as N}from"./index-cJric7Yg.js";const A="#C0392B",z="#2E2A26",S="#6A625B",M="#FBF7EE",C="https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&display=swap",B="'Caveat', 'Segoe Script', 'Bradley Hand', cursive",l=[{n:1,marks:20,paper:"Paper I — Data Structures & Algorithms",q:"The candidate executed the following at 2 AM. Identify the fault.",code:`def revise(syllabus):
    if panic:
        return revise(syllabus)`,opts:["Infinite recursion — there is no base case","Stack overflow, roughly four minutes in","The base case exists. It is called sleep() and was never invoked.","All of the above. Kill the process. Go to bed."],note:"Correct. Base case restored."},{n:2,marks:20,paper:"Paper II — Database Systems",q:"Comment on the following transaction and its output.",code:`DELETE FROM worries
WHERE paper IN ('DSA','DB','AI','Cloud');
-- Query OK, 4 rows affected`,opts:["Syntactically correct","Semantically correct","Correct, and should have been run several weeks ago","All of the above. COMMIT immediately. Do not ROLLBACK."],note:"Correct. Committed."},{n:3,marks:15,paper:"Paper III — AI Systems",q:"A model was asked to predict the candidate’s result. Classify the output below.",code:`>>> predict("will she clear all four?")
'hmm, that depends on a few factors…'`,opts:["A hallucination","A severe hallucination","Model collapse — roll back to the last good checkpoint","All of the above. Deprecate the model and retrain it on facts."],note:"Correct. Model deprecated."},{n:4,marks:15,paper:"Paper IV — Cloud Computing",q:"Four papers were scheduled onto a single node in one week. Review the capacity plan.",opts:["Under-provisioned — add a second node","Correctly provisioned — this node handles it every semester","Over-provisioned, frankly. She could carry a fifth paper.","All of the above are defensible. Approve the plan and stop paging her."],note:"Correct. Capacity approved."},{n:5,marks:15,paper:"Section E — Descriptive",kind:"text",q:`Write a short note covering the complete syllabus of all four papers.
(Word limit: none. Marking scheme: extremely generous.)`,placeholder:"literally anything…",note:"Correct. Not read, but correct."},{n:6,marks:15,paper:"Bonus — Post-Deployment",q:"On successful completion of the above, the candidate is to be released to production at:",opts:["Somewhere with mountains","Somewhere with trees","Somewhere with no signal, deliberately, for several days","All of the above. Roll out fully. Do not roll back."],note:"Correct. Deployment approved."}],m=l.reduce((p,o)=>p+o.marks,0);function D({onBack:p}){const[o,f]=n.useState({}),[i,u]=n.useState(""),[d,g]=n.useState(!1),b=n.useRef(null);n.useEffect(()=>{if(document.querySelector("link[data-hand-font]"))return;const t=document.createElement("link");t.rel="stylesheet",t.href=C,t.setAttribute("data-hand-font",""),document.head.appendChild(t)},[]);const y=n.useMemo(()=>l.filter(a=>a.kind!=="text"&&o[a.n]!=null).length+(i.trim()?1:0),[o,i]),w=n.useMemo(()=>l.reduce((t,a)=>{const r=a.kind==="text"?i.trim().length>0:o[a.n]!=null;return t+(r?a.marks:0)},0),[o,i]),x=y===l.length;n.useEffect(()=>{if(!x||d)return;const t=setTimeout(()=>{g(!0);const a=b.current;a&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches&&requestAnimationFrame(()=>{a.scrollIntoView({behavior:"smooth",block:"center"})})},520);return()=>clearTimeout(t)},[x,d]);const k=n.useCallback((t,a)=>{f(r=>r[t]===a?r:{...r,[t]:a})},[]),j=()=>{f({}),u(""),g(!1),window.scrollTo({top:0,behavior:"smooth"})},v=new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});return e.jsxs("div",{className:"ex-root",children:[e.jsx("style",{children:E}),e.jsxs("div",{className:"ex-wrap",children:[e.jsxs("button",{onClick:p,className:"ex-back",children:[e.jsx("span",{"aria-hidden":"true",children:"←"})," Back"]}),e.jsxs("div",{className:"ex-sheet",children:[e.jsx("div",{className:"ex-rule","aria-hidden":"true"}),e.jsxs("header",{className:"ex-head",children:[e.jsx("p",{className:"ex-uni",children:"Work Integrated Learning Programme"}),e.jsx("h1",{className:"ex-title",children:"Mid‑Semester Examination"}),e.jsx("p",{className:"ex-sub",children:"Computer Systems · four papers · one week · one full‑time job running underneath."}),e.jsxs("div",{className:"ex-meta",children:[e.jsxs("span",{children:["Papers: ",e.jsx("b",{children:"4"})]}),e.jsx("span",{className:"ex-dot","aria-hidden":"true",children:"·"}),e.jsxs("span",{children:["Max Marks: ",e.jsx("b",{children:m})]}),e.jsx("span",{className:"ex-dot","aria-hidden":"true",children:"·"}),e.jsxs("span",{children:["Pass Marks: ",e.jsx("b",{children:"irrelevant"})]})]}),e.jsxs("div",{className:"ex-roll",children:[e.jsx("span",{className:"ex-roll-label",children:"Roll No."}),e.jsx("span",{className:"ex-roll-box",children:e.jsx("span",{className:"ex-hand ex-roll-name",children:"Amrutha"})})]})]}),e.jsxs("section",{className:"ex-instr","aria-label":"Instructions to candidates",children:[e.jsx("p",{className:"ex-instr-h",children:"Instructions to the Candidate"}),e.jsxs("ol",{children:[e.jsx("li",{children:"All questions are compulsory. All answers are correct. This is not a trick."}),e.jsx("li",{children:"Answers may be written in any language, including SQL."}),e.jsx("li",{children:"Use of a calculator is permitted. Use of panic is not."}),e.jsx("li",{children:"Do not ask the invigilator for clarification — they have not read the syllabus either."}),e.jsx("li",{children:"Candidates may not leave in the first thirty minutes. You will be finished in twenty. Sit there and gloat."}),e.jsx("li",{children:"Any candidate caught underestimating herself will be asked to leave the hall."})]})]}),e.jsx("div",{className:"ex-qs",children:l.map(t=>{const a=t.kind==="text",r=a?i.trim().length>0:o[t.n]!=null;return e.jsxs("section",{className:`ex-q ${r?"is-done":""}`,children:[t.paper&&e.jsx("p",{className:"ex-paper",children:t.paper}),e.jsxs("div",{className:"ex-q-head",children:[e.jsxs("span",{className:"ex-q-n",children:["Q",t.n,"."]}),e.jsx("p",{className:"ex-q-t",children:t.q.split(`
`).map((c,s)=>e.jsxs(N.Fragment,{children:[s>0&&e.jsx("br",{}),c]},s))}),e.jsxs("span",{className:"ex-q-m",children:["[",t.marks,"]"]})]}),t.code&&e.jsx("pre",{className:"ex-code",children:t.code}),a?e.jsxs("div",{className:"ex-lines",children:[e.jsx("input",{type:"text",value:i,onChange:c=>u(c.target.value),placeholder:t.placeholder,className:"ex-hand ex-input","aria-label":t.q,maxLength:90}),e.jsx("span",{className:"ex-line","aria-hidden":"true"}),e.jsx("span",{className:"ex-line","aria-hidden":"true"})]}):e.jsx("ul",{className:"ex-opts",children:t.opts.map((c,s)=>{const h=o[t.n]===s;return e.jsx("li",{children:e.jsxs("button",{type:"button",onClick:()=>k(t.n,s),"aria-pressed":h,className:`ex-opt ${h?"is-on":""}`,children:[e.jsx("span",{className:"ex-bub","aria-hidden":"true",children:"abcd"[s]}),e.jsx("span",{className:"ex-opt-t",children:c}),h&&e.jsx("span",{className:"ex-hand ex-tick","aria-hidden":"true",children:"✓"})]})},s)})}),e.jsx("p",{className:`ex-hand ex-note ${r?"is-in":""}`,"aria-live":"polite",children:r?`${t.note}  ${t.marks}/${t.marks}`:""})]},t.n)})}),e.jsxs("div",{className:"ex-total","aria-live":"polite",children:[e.jsx("span",{className:"ex-total-l",children:"Total"}),e.jsxs("span",{className:"ex-hand ex-total-n",children:[w,e.jsxs("span",{className:"ex-total-d",children:["/",m]})]})]}),e.jsx("div",{className:"ex-result",ref:b,children:x?e.jsxs(e.Fragment,{children:[e.jsxs("div",{className:`ex-stamp ${d?"is-in":""}`,role:"img","aria-label":`Stamped: All the best, Amrutha. Mid-semester, ${v}. Result: certain.`,children:[e.jsx("span",{className:"ex-stamp-top",children:"Office of Good Wishes"}),e.jsx("strong",{className:"ex-stamp-big",children:"All the Best"}),e.jsxs("span",{className:"ex-stamp-bot",children:["Amrutha · All Four Papers · ",v]}),e.jsx("span",{className:"ex-stamp-res",children:"Result: certain"})]}),e.jsxs("div",{className:`ex-remark ${d?"is-in":""}`,children:[e.jsx("p",{className:"ex-remark-l",children:"Examiner's remarks"}),e.jsxs("p",{className:"ex-hand ex-remark-t",children:[m,"/",m," across all four papers, which was never really in doubt. Algorithms, databases, AI and the entire cloud — in one week, with a full-time job running the whole time. Go and get it over with. There's a mountain waiting on the other side."]}),e.jsx("p",{className:"ex-hand ex-sign",children:"— K"})]}),e.jsxs("button",{onClick:j,className:"ex-reset",children:["Attempt again (you'll still get ",m,")"]})]}):e.jsxs("p",{className:"ex-await",children:[y," of ",l.length," attempted — the examiner is waiting with the stamp ready."]})})]}),e.jsx("p",{className:"ex-foot",children:"No actual examination board was consulted in the making of this page."})]})]})}const E=`
.ex-root {
  --red: ${A};
  --ink: ${z};
  --soft: ${S};
  min-height: 100vh;
  background:
    radial-gradient(1100px 600px at 50% -10%, #ffffff 0%, rgba(255,255,255,0) 60%),
    ${M};
  color: var(--ink);
  padding: 1.5rem 1rem 4rem;
  font-family: 'Newsreader', Georgia, serif;
}
.ex-wrap { max-width: 44rem; margin: 0 auto; }

/* Anything the examiner or the candidate "wrote" by hand. */
.ex-hand { font-family: ${B}; font-weight: 600; }

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

.ex-opts { list-style: none; margin: 0.85rem 0 0; padding: 0 0 0 1.9rem; display: flex; flex-direction: column; gap: 0.3rem; }.ex-opt {
  display: flex; align-items: center; gap: 0.7rem; width: 100%;
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

/* the free-text answer */
.ex-lines { padding-left: 1.9rem; margin-top: 0.9rem; }
.ex-input {
  width: 100%; background: transparent; border: 0; outline: 0;
  color: var(--red); font-size: 1.45rem; line-height: 2;
  padding: 0; min-height: 44px;
}
.ex-input::placeholder { color: rgba(106,98,91,0.45); font-size: 1.15rem; }
.ex-line { display: block; height: 32px; border-bottom: 1px solid rgba(92,127,168,0.22); }

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

.ex-remark { margin-top: 2.25rem; text-align: left; opacity: 0; }
.ex-remark.is-in { animation: exFade 0.5s ease 0.25s both; }
@keyframes exFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.ex-remark-l {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
  color: var(--soft); margin-bottom: 0.5rem;
}
.ex-remark-t { color: var(--red); font-size: 1.45rem; line-height: 1.5; }
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
`;export{D as default};
