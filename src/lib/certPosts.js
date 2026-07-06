// Certification articles — one per badge on the site. Each is an honest story
// scaffold (bracketed [ ] spots are for Kranthi to personalize), a real
// learning path, verified resources, and verified exam facts. All external
// links were checked (HTTP 200) before publishing. Rendered by BlogPost's
// prose renderer (blocks: p / h / list / steps / resources / facts / note / quote).

const editNote = {
  type: 'note',
  text: 'Draft — anything in [brackets] is a spot to drop in your own specifics (dates, scores, the moment it clicked). Delete this note when you have made it yours.',
}

export const CERT_POSTS = [
  // ------------------------------------------------------------------ AWS SAA
  {
    slug: 'aws-saa',
    title: 'AWS Solutions Architect Associate',
    subtitle: 'How I learned to think in trade-offs, not services',
    category: 'certs',
    date: '2026-07-02',
    readingMins: 6,
    excerpt: 'The cert that turned a pile of AWS services into a way of designing systems. My story, the exact path I took, and the resources that actually moved the needle.',
    body: [
      editNote,
      { type: 'p', text: 'By the time I sat the Solutions Architect Associate, I had already been living inside AWS day to day [add: at Amazon, supporting Lambda / DynamoDB / API Gateway]. But there is a difference between fixing one service and being able to look at a blank diagram and design the whole thing. The SAA is where that shift happened for me.' },
      { type: 'p', text: 'It is the most popular AWS certification for a reason: it is broad enough to force you across compute, storage, networking, security, and cost — and deep enough that you stop memorising service names and start reasoning about trade-offs.' },
      { type: 'facts', items: [
        { k: 'Exam code', v: 'SAA-C03' },
        { k: 'Questions', v: '65' },
        { k: 'Duration', v: '130 min' },
        { k: 'Cost', v: '$150 USD' },
        { k: 'Passing score', v: '720 / 1000' },
        { k: 'Valid for', v: '3 years' },
      ] },
      { type: 'h', text: 'Why I went for it' },
      { type: 'p', text: '[Add your own why here.] For me it was partly proof and partly pressure: I wanted the architecture fundamentals to be muscle memory, not something I looked up mid-incident. [Add: what finally made you book the date.]' },
      { type: 'h', text: 'The four domains it tests' },
      { type: 'list', items: [
        'Design secure architectures (~30%) — IAM, encryption, network isolation.',
        'Design resilient architectures (~26%) — multi-AZ, decoupling, recovery.',
        'Design high-performing architectures (~24%) — the right compute/storage/db for the job.',
        'Design cost-optimized architectures (~20%) — because the cheapest design that meets the bar wins.',
      ] },
      { type: 'h', text: 'The learning path I would repeat' },
      { type: 'steps', items: [
        { title: 'Watch one deep video course end to end', text: 'Pick a single instructor and finish it. Do the hands-on labs in your own account — reading is not the same as building.' },
        { title: 'Read the official exam guide', text: 'It lists exactly what is in scope. Treat it as your checklist, not an afterthought.' },
        { title: 'Build one small thing per domain', text: 'A multi-AZ web app, an S3 static site with CloudFront, a Lambda + DynamoDB API. Small, real, yours.' },
        { title: 'Grind practice exams until patterns emerge', text: 'The exam rewards recognising scenarios. When you can explain why the other three answers are wrong, you are ready.' },
        { title: 'Review only your weak domains', text: 'In the last week, stop re-watching what you know. Attack the two domains with your lowest practice scores.' },
      ] },
      { type: 'h', text: 'Resources that actually helped' },
      { type: 'resources', items: [
        { label: 'Official AWS SAA certification page', sub: 'exam overview, straight from AWS', url: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/' },
        { label: 'SAA-C03 official exam guide (PDF)', sub: 'the definitive scope checklist', url: 'https://d1.awsstatic.com/training-and-certification/docs-sa-assoc/AWS-Certified-Solutions-Architect-Associate_Exam-Guide.pdf' },
        { label: 'AWS Skill Builder', sub: 'official labs & practice question sets', url: 'https://skillbuilder.aws/' },
        { label: "Adrian Cantrill's SA Associate course", sub: 'deep, diagram-heavy, hands-on', url: 'https://learn.cantrill.io/' },
        { label: 'Tutorials Dojo practice exams', sub: 'the gold standard for exam-style questions', url: 'https://tutorialsdojo.com/' },
      ] },
      { type: 'h', text: "What I'd tell someone starting" },
      { type: 'list', items: [
        'Build in a real account. The free tier is enough for almost everything on the exam.',
        'When you get a practice question wrong, write one sentence on why. That notebook is your real study guide.',
        'Learn the trade-offs, not the trivia. The exam is scenario-based; the job is even more so.',
      ] },
      { type: 'quote', text: 'The SAA did not make me an architect. It gave me the vocabulary to become one.' },
      { type: 'resources', items: [
        { label: 'Verify my badge on Credly', sub: 'the real, issued credential', url: 'https://www.credly.com/badges/4528a7ce-198b-4edd-94dd-54bea26bcafd' },
      ] },
    ],
  },

  // ------------------------------------------------------- Couchbase Admin
  {
    slug: 'couchbase-admin',
    title: 'Couchbase Certified — Administrator',
    subtitle: 'Learning to keep a distributed database boringly reliable',
    category: 'certs',
    date: '2026-07-01',
    readingMins: 4,
    excerpt: 'Running Couchbase in support taught me the failure modes; the administrator cert made me formalise them. Buckets, XDCR, rebalances — and how I studied them.',
    body: [
      editNote,
      { type: 'p', text: 'I came to this one from the trenches [add: while at Couchbase, working distributed clusters day to day]. When you have already watched a rebalance stall or an XDCR stream lag in production, the administrator material stops being abstract — it is a checklist of things you have felt go wrong.' },
      { type: 'facts', items: [
        { k: 'Provider', v: 'Couchbase' },
        { k: 'Level', v: 'Associate' },
        { k: 'Format', v: 'Online, self-paced' },
        { k: 'Cost', v: 'Free' },
        { k: 'Focus', v: 'Cluster & data ops' },
      ] },
      { type: 'h', text: 'What it covers' },
      { type: 'list', items: [
        'Cluster setup, buckets, scopes and collections.',
        'Rebalancing, failover and node management.',
        'Cross Data Center Replication (XDCR) and disaster recovery.',
        'Monitoring, backups, and security basics.',
      ] },
      { type: 'h', text: 'The learning path' },
      { type: 'steps', items: [
        { title: 'Stand up a real cluster', text: 'A local multi-node cluster (or Capella free tier) teaches more in an hour than any slide deck.' },
        { title: 'Break it on purpose', text: 'Kill a node. Trigger a failover. Watch a rebalance. Understanding recovery is the whole job.' },
        { title: 'Work the official Couchbase learning tracks', text: 'They map closely to the exam and are free.' },
        { title: 'Practise the operational runbooks', text: 'Backups, restores, XDCR setup — until you can do them without notes.' },
      ] },
      { type: 'h', text: 'Resources' },
      { type: 'resources', items: [
        { label: 'Couchbase learning portal', sub: 'official courses, tracks & certification exams', url: 'https://learn.couchbase.com/' },
        { label: 'Verify my badge on Credly', sub: 'the issued credential', url: 'https://www.credly.com/badges/21986ffd-3145-4312-8ed8-8f870454b7d5/public_url' },
      ] },
      { type: 'p', text: '[Add a line here about the moment Couchbase internals actually clicked for you — mine was the first time I traced an XDCR lag back to its root cause.]' },
    ],
  },

  // ----------------------------------------------------- Couchbase Python
  {
    slug: 'couchbase-python',
    title: 'Couchbase Certified — Python Developer',
    subtitle: 'Talking to a document database the right way',
    category: 'certs',
    date: '2026-06-30',
    readingMins: 4,
    excerpt: 'The developer track: SDKs, N1QL/SQL++, and the mental model shift from rows and joins to documents and keys. How I picked it up.',
    body: [
      editNote,
      { type: 'p', text: 'Coming from a SQL background, the hardest part was not the Python SDK — it was unlearning the relational reflex. Couchbase rewards you for modelling around access patterns and keys, not normalised tables. This cert is where that clicked.' },
      { type: 'facts', items: [
        { k: 'Provider', v: 'Couchbase' },
        { k: 'Level', v: 'Associate' },
        { k: 'Track', v: 'Python SDK' },
        { k: 'Format', v: 'Online, self-paced' },
        { k: 'Cost', v: 'Free' },
      ] },
      { type: 'h', text: 'What it covers' },
      { type: 'list', items: [
        'Connecting and doing key-value CRUD with the Python SDK.',
        'Querying with N1QL / SQL++ (SQL for JSON documents).',
        'Document data modelling — embedding vs. referencing.',
        'Working with collections, and handling errors and durability.',
      ] },
      { type: 'h', text: 'The learning path' },
      { type: 'steps', items: [
        { title: 'Write a tiny CRUD app', text: 'Connect, insert, get, upsert, delete. Nothing fancy — just get the SDK under your fingers.' },
        { title: 'Learn SQL++ by rewriting SQL you know', text: 'Take queries you would write against Postgres and express them against JSON documents.' },
        { title: 'Model one domain two ways', text: 'Embed everything, then split into references. Feel the trade-offs in query complexity and update cost.' },
        { title: 'Do the official Python developer track', text: 'It maps to the exam and gives you the runnable examples.' },
      ] },
      { type: 'h', text: 'Resources' },
      { type: 'resources', items: [
        { label: 'Couchbase learning portal', sub: 'developer tracks & certification exams', url: 'https://learn.couchbase.com/' },
        { label: 'Verify my badge on Credly', sub: 'the issued credential', url: 'https://www.credly.com/badges/6351ce61-4f3f-460e-935c-5b0e89e39c65' },
      ] },
    ],
  },

  // --------------------------------------------------- Couchbase Architect
  {
    slug: 'couchbase-architect',
    title: 'Couchbase Certified — Architect',
    subtitle: 'From "it works" to "it works at scale, and survives a region loss"',
    category: 'certs',
    date: '2026-06-29',
    readingMins: 4,
    excerpt: 'The architect track pulls the admin and developer views together: sizing, services, replication topology, and designing for failure. My path through it.',
    body: [
      editNote,
      { type: 'p', text: 'If the administrator cert is about keeping one cluster healthy and the developer cert is about talking to it well, the architect cert is about the decisions you make before any of that: how to size it, where to place services, and what happens when a whole data centre disappears.' },
      { type: 'facts', items: [
        { k: 'Provider', v: 'Couchbase' },
        { k: 'Level', v: 'Associate' },
        { k: 'Focus', v: 'Solution architecture' },
        { k: 'Format', v: 'Online, self-paced' },
        { k: 'Cost', v: 'Free' },
      ] },
      { type: 'h', text: 'What it covers' },
      { type: 'list', items: [
        'Multi-Dimensional Scaling — placing Data, Index, Query, Search services deliberately.',
        'Cluster sizing and capacity planning for a workload.',
        'Replication and XDCR topologies for high availability and DR.',
        'Choosing the right access pattern: key-value vs. query vs. search vs. analytics.',
      ] },
      { type: 'h', text: 'The learning path' },
      { type: 'steps', items: [
        { title: 'Start from a workload, not a cluster', text: 'Read/write ratio, latency target, data size. Every architecture decision falls out of these.' },
        { title: 'Map services to nodes on paper', text: 'Practise separating Data / Index / Query so one hot service cannot starve another.' },
        { title: 'Design a two-region topology', text: 'Sketch active-active vs. active-passive XDCR and reason about failover and conflict handling.' },
        { title: 'Work the official architect track', text: 'It ties the admin and developer knowledge into design decisions.' },
      ] },
      { type: 'h', text: 'Resources' },
      { type: 'resources', items: [
        { label: 'Couchbase learning portal', sub: 'architect track & certification exams', url: 'https://learn.couchbase.com/' },
        { label: 'Verify my badge on Credly', sub: 'the issued credential', url: 'https://www.credly.com/badges/e87a7035-55d0-4612-b5b4-8dc031560433' },
      ] },
      { type: 'quote', text: 'Architecture is just naming your failure modes before they name themselves.' },
    ],
  },

  // ------------------------------------------------- GitHub Foundations
  {
    slug: 'github-foundations',
    title: 'GitHub Foundations',
    subtitle: 'Proving the fundamentals of the platform I work on every day',
    category: 'certs',
    date: '2026-07-05',
    readingMins: 4,
    excerpt: 'The entry point to the GitHub certification track — Git, repositories, collaboration, and the wider platform. Quick to prep if you use GitHub daily.',
    body: [
      editNote,
      { type: 'p', text: 'Working at GitHub [add: as a Support Engineer on Actions], most of this is daily reality. But Foundations is worth doing precisely because it forces you to be precise about the basics — the difference between Git and GitHub, exactly what a fork is, how protected branches and permissions actually behave.' },
      { type: 'facts', items: [
        { k: 'Exam code', v: 'GH-900' },
        { k: 'Questions', v: '~75' },
        { k: 'Duration', v: '~100 min' },
        { k: 'Cost', v: '$99 USD' },
        { k: 'Passing score', v: '700 / 1000' },
        { k: 'Valid for', v: '2 years' },
      ] },
      { type: 'h', text: 'What it covers' },
      { type: 'list', items: [
        'Git and GitHub fundamentals — commits, branches, merges, forks.',
        'Working with repositories and managing files.',
        'Collaboration — issues, pull requests, reviews, discussions.',
        'Projects, and modern practices like GitHub Actions and Codespaces.',
        'Privacy, security, permissions, and the GitHub community.',
      ] },
      { type: 'h', text: 'The learning path' },
      { type: 'steps', items: [
        { title: 'Read the official study guide once', text: 'It is short and lists every objective. This is your map.' },
        { title: 'Do the Microsoft Learn GitHub modules', text: 'Free, hands-on, and aligned to the exam objectives.' },
        { title: 'Use GitHub for a real thing', text: 'Open issues, make PRs, review one, protect a branch. Muscle memory beats memorisation.' },
        { title: 'Take a couple of practice runs', text: 'Mostly to get used to the phrasing — the content is not the hard part if you use GitHub.' },
      ] },
      { type: 'h', text: 'Resources' },
      { type: 'resources', items: [
        { label: 'GitHub Foundations — Microsoft Learn', sub: 'official exam page', url: 'https://learn.microsoft.com/en-us/credentials/certifications/github-foundations/' },
        { label: 'GH-900 study guide', sub: 'the official objective checklist', url: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-900' },
        { label: 'GitHub certifications hub', sub: 'the full cert track & prep', url: 'https://resources.github.com/learn/certifications/' },
        { label: 'Register the exam', sub: 'GitHub exam registration', url: 'https://examregistration.github.com/' },
      ] },
      { type: 'resources', items: [
        { label: 'Verify my credential', sub: 'issued via Microsoft', url: 'https://learn.microsoft.com/en-us/users/KranthiAkkumahanthi-6332/credentials/D4C54954A4FE7D48' },
      ] },
    ],
  },

  // ------------------------------------------------ GitHub Administration
  {
    slug: 'github-administration',
    title: 'GitHub Administration',
    subtitle: 'Running GitHub at organisation and enterprise scale',
    category: 'certs',
    date: '2026-07-06',
    readingMins: 4,
    excerpt: 'The step up from Foundations: managing orgs, members, policies, security and integrations for a whole company. What it covers and how I prepared.',
    body: [
      editNote,
      { type: 'p', text: 'Foundations proves you can use GitHub; Administration proves you can run it for everyone else. Coming from a support role [add: on GitHub Actions], I saw the admin side constantly — the org policy that blocked a workflow, the SSO config, the permission model behind a "why can\'t I merge?" ticket. This cert made that knowledge deliberate.' },
      { type: 'facts', items: [
        { k: 'Provider', v: 'GitHub (via Microsoft)' },
        { k: 'Level', v: 'Advanced' },
        { k: 'Delivery', v: 'Proctored, online' },
        { k: 'Focus', v: 'Org & enterprise admin' },
      ] },
      { type: 'h', text: 'What it covers' },
      { type: 'list', items: [
        'Organisation and enterprise account management.',
        'Members, teams, roles, and the permission model.',
        'Authentication and security — SSO/SAML, 2FA policies.',
        'Policies, compliance, and audit logs.',
        'Integrations, apps, and automation at scale.',
      ] },
      { type: 'h', text: 'The learning path' },
      { type: 'steps', items: [
        { title: 'Create a free organisation and explore every settings page', text: 'The admin surface is huge; clicking through it is the fastest way to internalise it.' },
        { title: 'Work the Microsoft Learn GitHub admin modules', text: 'They walk the org/enterprise controls objective by objective.' },
        { title: 'Map real scenarios to settings', text: 'Onboarding a team, enforcing 2FA, restricting an app — practise the "how would I do this" reflex.' },
        { title: 'Register and book once the objectives feel familiar', text: 'Use the official exam registration below.' },
      ] },
      { type: 'h', text: 'Resources' },
      { type: 'resources', items: [
        { label: 'GitHub training on Microsoft Learn', sub: 'official modules for the admin track', url: 'https://learn.microsoft.com/en-us/training/github/' },
        { label: 'GitHub certifications hub', sub: 'the full cert track & prep', url: 'https://resources.github.com/learn/certifications/' },
        { label: 'Register the exam', sub: 'GitHub exam registration', url: 'https://examregistration.github.com/' },
      ] },
      { type: 'resources', items: [
        { label: 'Verify my credential', sub: 'issued via Microsoft', url: 'https://learn.microsoft.com/en-us/users/kranthiakkumahanthi-6332/credentials/34edb692ae79316e' },
      ] },
    ],
  },

  // ------------------------------------------------ GitHub Actions (GH-200)
  {
    slug: 'github-actions',
    title: 'GitHub Actions',
    subtitle: 'Certifying the thing I do all day',
    category: 'certs',
    date: '2026-07-04',
    readingMins: 5,
    excerpt: 'CI/CD, workflows, runners, reusable workflows and secrets — the exam on the platform I support for a living. What it covers and how I would prepare.',
    body: [
      editNote,
      { type: 'p', text: 'This is the one closest to my day job — I support GitHub Actions [add: as a Support Engineer at GitHub], so the exam content is the same ground I walk with customers: workflow syntax that will not trigger, a reusable workflow passing the wrong secret, a self-hosted runner that will not come online. Sitting the cert was less about learning it cold and more about making the mental model airtight.' },
      { type: 'facts', items: [
        { k: 'Exam code', v: 'GH-200' },
        { k: 'Provider', v: 'GitHub (via Microsoft)' },
        { k: 'Delivery', v: 'Proctored, online' },
        { k: 'Focus', v: 'CI/CD with Actions' },
        { k: 'Level', v: 'Intermediate' },
      ] },
      { type: 'h', text: 'What it covers' },
      { type: 'list', items: [
        'Workflow authoring — triggers, jobs, steps, expressions and contexts.',
        'Actions — using marketplace actions and writing your own.',
        'Reusable workflows, composite actions, and matrix builds.',
        'Runners — GitHub-hosted vs. self-hosted, and runner groups.',
        'Secrets, variables, environments, and deployment protection rules.',
        'Security hardening — permissions, OIDC, and least privilege.',
      ] },
      { type: 'h', text: 'The learning path' },
      { type: 'steps', items: [
        { title: 'Automate something you actually have', text: 'Add CI to a real repo: lint, test, build on every push. The exam mirrors real usage.' },
        { title: 'Write a custom + a composite action', text: 'Once you have built one, inputs/outputs and composition stop being abstract.' },
        { title: 'Break into reusable workflows and matrices', text: 'Call one workflow from another; run a matrix across versions. Understand secret passing between them.' },
        { title: 'Stand up a self-hosted runner', text: 'Register one, run a job on it, then reason about runner groups and security.' },
        { title: 'Study environments, OIDC and permissions', text: 'The security domain is where most people lose points — deployment protection and least-privilege tokens.' },
      ] },
      { type: 'h', text: 'Resources' },
      { type: 'resources', items: [
        { label: 'GitHub Actions — Microsoft Learn', sub: 'official exam page', url: 'https://learn.microsoft.com/en-us/credentials/certifications/github-actions/' },
        { label: 'GH-200 study guide', sub: 'the official objective checklist', url: 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/gh-200' },
        { label: 'GitHub Actions documentation', sub: 'the source of truth — read it, do not skim it', url: 'https://docs.github.com/en/actions' },
        { label: 'Register the exam', sub: 'GitHub exam registration', url: 'https://examregistration.github.com/' },
      ] },
      { type: 'h', text: "What I'd tell someone starting" },
      { type: 'list', items: [
        'The docs are unusually good. Most exam answers are one careful read away.',
        'Know the difference between a reusable workflow and a composite action cold — it trips people up.',
        'Understand how secrets do (and do not) flow into called workflows and forks. It is both exam gold and real-world safety.',
      ] },
      { type: 'quote', text: 'Supporting Actions taught me every way a workflow can fail. The cert just made me say why, precisely.' },
      { type: 'resources', items: [
        { label: 'Verify my credential', sub: 'issued via Microsoft', url: 'https://learn.microsoft.com/en-us/users/KranthiAkkumahanthi-6332/credentials/AF357DA2107EC50B' },
      ] },
    ],
  },
]
