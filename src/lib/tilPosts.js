// Short "Today I Learned" notes — the compounding habit. These are living
// technical notes in my day-job domain (GitHub Actions). Every claim here is
// checked against the official docs linked at the bottom of each note. They're
// deliberately short: a problem, the fix, and why it behaves that way.
//
// A TIL is just a prose post with `til: true` and one or more `topics`. It shows
// up in the Knowledge Base (#/notes) and the Blog. Add your own by copying one
// of these objects.

export const TIL_POSTS = [
  {
    slug: 'til-actions-job-stuck-queued',
    title: 'Why an Actions job gets stuck in “queued”',
    subtitle: 'A queued job is a job still looking for a runner',
    category: 'engineering',
    topics: ['github'],
    til: true,
    date: '2026-07-05',
    readingMins: 3,
    render: 'prose',
    excerpt:
      'A job sits in "queued" when no runner is available to pick it up. Here are the usual causes and the exact order I check them in.',
    body: [
      { type: 'p', text: 'A workflow job that hangs in “queued” isn’t running yet — it’s waiting for a runner to accept it. The trick is knowing what “available runner” actually means for your setup.' },
      { type: 'h', text: 'The usual causes' },
      { type: 'list', items: [
        'GitHub-hosted: you’ve hit a concurrency limit for your plan, or spending/usage limits have paused new runs.',
        'Self-hosted: no online runner has labels that match every label in the job’s runs-on.',
        'Self-hosted: a matching runner exists but is busy — a runner executes one job at a time by default.',
        'The job is gated behind a required reviewer or a deployment environment that hasn’t been approved yet.',
      ] },
      { type: 'h', text: 'How I check it, in order' },
      { type: 'steps', items: [
        { title: 'Read the job page', text: 'It usually says “Waiting for a runner to pick up this job.” That confirms it’s a scheduling problem, not a failing step.' },
        { title: 'Compare labels exactly', text: 'The job needs a runner matching ALL labels in runs-on (e.g. [self-hosted, linux, x64]). One typo and nothing matches.' },
        { title: 'Confirm a runner is Online + Idle', text: 'In Settings → Actions → Runners. Offline or busy runners won’t take the job.' },
        { title: 'For hosted runners, check billing', text: 'A hit spending limit or exhausted included minutes silently stops new jobs from starting.' },
      ] },
      { type: 'note', text: 'A self-hosted job that never finds a matching runner doesn’t fail fast — it stays queued for up to 24 hours, then it’s automatically cancelled. So “stuck forever” is usually a label mismatch.' },
      { type: 'resources', items: [
        { label: 'Monitoring & troubleshooting self-hosted runners', sub: 'docs.github.com', url: 'https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/monitor-and-troubleshoot' },
      ] },
    ],
  },
  {
    slug: 'til-actions-concurrency-cancel',
    title: 'Stop wasting minutes: cancel superseded runs',
    subtitle: 'One concurrency block saves a surprising amount of CI time',
    category: 'engineering',
    topics: ['github'],
    til: true,
    date: '2026-07-04',
    readingMins: 2,
    render: 'prose',
    excerpt:
      'Push three times to a PR and you get three runs, two of them already pointless. A concurrency group cancels the stale ones automatically.',
    body: [
      { type: 'p', text: 'Every push to a branch kicks off a fresh workflow run. On an active PR that means older, now-irrelevant runs keep churning through minutes while you’ve already moved on. Concurrency fixes it in four lines.' },
      { type: 'code', text: 'concurrency:\n  group: ${{ github.workflow }}-${{ github.ref }}\n  cancel-in-progress: true' },
      { type: 'p', text: 'Runs sharing a group can’t run at once. Keying the group on the workflow + ref means each branch gets its own lane, and cancel-in-progress cancels the older run the moment a newer one starts.' },
      { type: 'note', text: 'For deploy workflows you often want the opposite: cancel-in-progress: false, so a release that’s halfway through applying isn’t interrupted by the next push.' },
      { type: 'resources', items: [
        { label: 'Using concurrency', sub: 'docs.github.com', url: 'https://docs.github.com/en/actions/using-jobs/using-concurrency' },
      ] },
    ],
  },
  {
    slug: 'til-actions-token-permissions',
    title: 'Give GITHUB_TOKEN only what it needs',
    subtitle: 'Least privilege is one key in your workflow file',
    category: 'engineering',
    topics: ['github'],
    til: true,
    date: '2026-07-03',
    readingMins: 3,
    render: 'prose',
    excerpt:
      'Every run gets an automatic GITHUB_TOKEN, and its default scope depends on a setting you might not control. Declaring permissions yourself removes the guesswork.',
    body: [
      { type: 'p', text: 'GitHub creates a short-lived GITHUB_TOKEN for every workflow run so steps can call the API. Its default permissions come from a repository/organization setting — which means the same workflow can behave differently across repos. Don’t rely on the default; state what you need.' },
      { type: 'h', text: 'The habit' },
      { type: 'code', text: 'permissions:\n  contents: read\n\njobs:\n  release:\n    permissions:\n      contents: write   # elevate only where you need it' },
      { type: 'list', items: [
        'Start least-privilege at the top: permissions: contents: read.',
        'Elevate per-job, only for the job that actually needs write.',
        'Remember tokens from forked-PR runs are read-only and can’t see your secrets — by design.',
      ] },
      { type: 'note', text: 'Setting permissions at the workflow level resets every job to that baseline; a job-level block then overrides it for just that job.' },
      { type: 'resources', items: [
        { label: 'Automatic token authentication', sub: 'docs.github.com', url: 'https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication' },
        { label: 'Workflow syntax — permissions', sub: 'docs.github.com', url: 'https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions' },
      ] },
    ],
  },
]
