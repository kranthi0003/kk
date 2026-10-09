import{r as n,j as e}from"./index-Ce3u5nk6.js";import{s as p,L as h,l as c,b as f}from"./blog-CNW9O7_7.js";const o="var(--color-foreground)";function y({onBack:m}){const[a,d]=n.useState("all"),l=n.useMemo(()=>p("longgame"),[]),s=a==="all"?l:l.filter(r=>r.category===a),g=r=>r==="all"?l.length:l.filter(t=>t.category===r).length;return e.jsxs("div",{className:"lg-root",children:[e.jsx("style",{children:x}),e.jsxs("div",{className:"lg-wrap",children:[e.jsxs("button",{onClick:m,className:"lg-back",children:[e.jsx("span",{"aria-hidden":"true",children:"←"})," Back"]}),e.jsxs("header",{className:"lg-head",children:[e.jsx("p",{className:"lg-eyebrow",children:"Essays"}),e.jsx("h1",{className:"lg-title",children:"The Long Game"}),e.jsx("p",{className:"lg-standfirst",children:"Notes on psychology, self-worth, attachment and ambition — written from the mechanism up. Where the evidence is contested, the essay says so."})]}),e.jsx("nav",{className:"lg-filters","aria-label":"Filter essays by subject",children:[{id:"all",label:"Everything"},...h].map(r=>{const t=g(r.id),i=a===r.id;return e.jsxs("button",{onClick:()=>d(r.id),"aria-pressed":i,disabled:t===0,className:`lg-chip ${i?"is-on":""}`,children:[r.label,e.jsx("span",{className:"lg-chip-n",children:t})]},r.id)})}),s.length===0?e.jsxs("p",{className:"lg-empty",children:["Nothing filed under ",c(a)," yet."]}):e.jsx("div",{className:"lg-list",children:s.map(r=>e.jsx("article",{className:"lg-item",children:e.jsxs("a",{href:`#/longgame/${r.slug}`,className:"lg-link",children:[e.jsxs("p",{className:"lg-meta",children:[e.jsx("span",{className:"lg-cat",children:c(r.category)}),e.jsx("span",{className:"lg-dot","aria-hidden":"true",children:"·"}),e.jsx("span",{children:f(r.date)}),e.jsx("span",{className:"lg-dot","aria-hidden":"true",children:"·"}),e.jsxs("span",{children:[r.readingMins," min read"]})]}),e.jsx("h2",{className:"lg-h2",children:r.title}),r.subtitle&&e.jsx("p",{className:"lg-sub",children:r.subtitle}),e.jsx("p",{className:"lg-excerpt",children:r.excerpt}),e.jsxs("span",{className:"lg-more",children:["Read ",e.jsx("span",{"aria-hidden":"true",children:"→"})]})]})},r.slug))}),e.jsxs("p",{className:"lg-foot",children:["Looking for the engineering writing? That lives at"," ",e.jsx("a",{href:"#/blog",className:"lg-foot-a",children:"/blog"}),"."]})]})]})}const x=`
.lg-root {
  min-height: 100vh;
  background: var(--color-background);
  color: ${o};
  padding: 1.5rem 1rem 5rem;
}
.lg-wrap { max-width: 46rem; margin: 0 auto; }

.lg-back {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--color-muted-foreground);
  background: none; border: 0; cursor: pointer;
  padding: 0.6rem 0.2rem; min-height: 44px; margin-bottom: 1.5rem;
}
.lg-back:hover { color: ${o}; }

/* ---------- masthead ---------- */
.lg-head { padding-bottom: 2.25rem; border-bottom: 1px solid var(--color-border); }
.lg-eyebrow {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.24em; text-transform: uppercase;
  color: var(--color-muted-foreground); margin-bottom: 0.9rem;
}
.lg-title {
  font-family: 'Newsreader', Georgia, serif;
  font-weight: 400;
  font-size: clamp(2.4rem, 9vw, 4rem);
  line-height: 1.02; letter-spacing: -0.03em;
  margin-bottom: 1.1rem;
}
.lg-standfirst {
  font-family: 'Newsreader', Georgia, serif;
  font-size: clamp(1.05rem, 2.6vw, 1.3rem);
  line-height: 1.6; max-width: 34rem;
  color: var(--color-muted-foreground);
}

/* ---------- filters ---------- */
.lg-filters {
  display: flex; flex-wrap: wrap; gap: 0.5rem;
  margin: 1.75rem 0 2.5rem;
}
.lg-chip {
  display: inline-flex; align-items: center; gap: 0.5rem;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px; letter-spacing: 0.04em;
  padding: 0.6rem 0.85rem; min-height: 44px;
  border-radius: 999px; cursor: pointer;
  color: var(--color-muted-foreground);
  background: transparent;
  border: 1px solid var(--color-border);
  transition: all 0.18s ease;
}
.lg-chip:hover:not(:disabled) { color: ${o}; border-color: var(--color-muted-foreground); }
.lg-chip.is-on {
  color: var(--color-background);
  background: ${o};
  border-color: ${o};
}
.lg-chip:disabled { opacity: 0.35; cursor: default; }
.lg-chip-n { font-size: 10px; opacity: 0.6; }

/* ---------- the list ---------- */
.lg-list { display: flex; flex-direction: column; }
.lg-item { border-bottom: 1px solid var(--color-border); }
.lg-item:first-child { border-top: 1px solid var(--color-border); }
.lg-link {
  display: block; padding: 2.25rem 0;
  text-decoration: none; color: inherit;
}
.lg-link:hover .lg-h2 { text-decoration: underline; text-underline-offset: 4px; }
.lg-link:hover .lg-more { opacity: 1; transform: translateX(2px); }

.lg-meta {
  display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--color-muted-foreground); margin-bottom: 0.85rem;
}
.lg-cat { color: ${o}; }
.lg-dot { opacity: 0.4; }

.lg-h2 {
  font-family: 'Newsreader', Georgia, serif;
  font-weight: 500;
  font-size: clamp(1.5rem, 4.6vw, 2.15rem);
  line-height: 1.14; letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}
.lg-sub {
  font-family: 'Newsreader', Georgia, serif;
  font-style: italic;
  font-size: clamp(1rem, 2.4vw, 1.18rem);
  line-height: 1.45;
  color: var(--color-muted-foreground);
  margin-bottom: 0.9rem;
}
.lg-excerpt {
  font-size: 0.95rem; line-height: 1.7;
  color: var(--color-muted-foreground);
  max-width: 36rem; margin-bottom: 1.1rem;
}
.lg-more {
  display: inline-block;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase;
  color: ${o}; opacity: 0.55;
  transition: all 0.18s ease;
}

.lg-empty {
  padding: 3rem 0; text-align: center;
  font-size: 0.95rem; color: var(--color-muted-foreground);
}

.lg-foot {
  margin-top: 3.5rem; padding-top: 1.75rem;
  border-top: 1px solid var(--color-border);
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 11px; line-height: 1.7;
  color: var(--color-muted-foreground);
}
.lg-foot-a { color: ${o}; text-decoration: underline; text-underline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  .lg-chip, .lg-more { transition: none; }
}
`;export{y as default};
