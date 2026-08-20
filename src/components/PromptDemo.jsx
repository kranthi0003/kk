import React, { useEffect, useRef, useState } from 'react'

/* ---------------------------------------------------------------------------
 * A self-playing shell, in the spirit of the starship.rs demo. The point it is
 * making is that the prompt is not a fixed string: it grows a branch segment
 * inside a repo, a dirty marker when the tree changes, a runtime version when
 * one is detected, a duration after something slow, and a red caret when the
 * last command failed.
 *
 * Everything is drawn rather than recorded, so there is no video to download
 * and it stays sharp at any zoom. Icons are inline SVG on purpose: the real
 * starship prompt uses Nerd Font glyphs, which render as empty boxes for
 * anyone without that font installed.
 * ------------------------------------------------------------------------ */

const DIR = '~/dev/kranthikiran.com'
const NODE = '20.11.0'

const STEPS = [
  {
    ctx: { dir: '~' },
    cmd: 'cd dev/kranthikiran.com',
    out: [],
  },
  {
    ctx: { dir: DIR, branch: 'main', node: NODE },
    cmd: 'git switch -c f1-stickers',
    out: [{ t: "Switched to a new branch 'f1-stickers'" }],
  },
  {
    ctx: { dir: DIR, branch: 'f1-stickers', node: NODE },
    cmd: 'npm run build',
    out: [
      { t: 'vite v5.4.11 building for production...', c: 'dim' },
      { t: '2847 modules transformed.', c: 'dim' },
      { t: 'dist/assets/F1-B6XkXGJZ.js    38.38 kB', c: 'dim' },
      { t: '✓ built in 4.29s', c: 'ok' },
    ],
  },
  {
    // The build regenerates the data files, so the tree is dirty from here on.
    ctx: { dir: DIR, branch: 'f1-stickers', dirty: true, node: NODE, took: '4.3s' },
    cmd: 'gh pr create --fill',
    err: true,
    out: [
      { t: 'fatal: the current branch f1-stickers has no upstream branch', c: 'err' },
    ],
  },
  {
    ctx: { dir: DIR, branch: 'f1-stickers', dirty: true, node: NODE, err: true },
    cmd: 'git push -u origin f1-stickers',
    out: [
      { t: 'Enumerating objects: 12, done.', c: 'dim' },
      { t: "branch 'f1-stickers' set up to track 'origin/f1-stickers'.", c: 'dim' },
    ],
  },
  {
    ctx: { dir: DIR, branch: 'f1-stickers', dirty: true, node: NODE, took: '1.2s' },
    cmd: 'gh pr create --fill',
    out: [
      { t: 'https://github.com/kranthi0003/kk/pull/173', c: 'link' },
    ],
  },
]

const I = { width: 12, height: 12, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

const FolderIcon = () => (
  <svg {...I}><path d="M1.8 12.6V3.4h4.1l1.5 1.9h6.8v7.3z" /></svg>
)
const BranchIcon = () => (
  <svg {...I}><circle cx="4.4" cy="3.4" r="1.7" /><circle cx="4.4" cy="12.6" r="1.7" /><circle cx="11.6" cy="5.6" r="1.7" /><path d="M4.4 5.1v5.8M11.6 7.3c0 2.4-2.3 2.6-3.6 3.1" /></svg>
)
const NodeIcon = () => (
  <svg {...I}><path d="M8 1.6l5.6 3.2v6.4L8 14.4 2.4 11.2V4.8z" /></svg>
)
const TimerIcon = () => (
  <svg {...I}><circle cx="8" cy="9" r="5.4" /><path d="M8 6.2V9l1.9 1.2M6.2 1.8h3.6" /></svg>
)

function Segment({ tone, children }) {
  return <span className={`pd-seg pd-${tone}`}>{children}</span>
}

/* The prompt line. Each segment appears only when that piece of context
   actually exists, which is the whole idea being demonstrated. */
function Prompt({ ctx }) {
  return (
    <div className="pd-prompt">
      <Segment tone="dir"><FolderIcon />{ctx.dir}</Segment>
      {ctx.branch && (
        <Segment tone="git">
          <BranchIcon />{ctx.branch}
          {ctx.dirty && <span className="pd-dirty" title="uncommitted changes">[!]</span>}
        </Segment>
      )}
      {ctx.node && <Segment tone="node"><NodeIcon />v{ctx.node}</Segment>}
      {ctx.took && <Segment tone="took"><TimerIcon />took {ctx.took}</Segment>}
    </div>
  )
}

function Line({ line }) {
  return <div className={`pd-out pd-o-${line.c || 'plain'}`}>{line.t}</div>
}

/* One finished exchange: prompt, the command, then its output. */
function Block({ step, typed, caret }) {
  const cmd = typed == null ? step.cmd : step.cmd.slice(0, typed)
  const shown = typed == null ? step.out : []
  return (
    <div className="pd-block">
      <Prompt ctx={step.ctx} />
      <div className="pd-cmdline">
        <span className={`pd-caret ${step.ctx.err ? 'pd-caret-err' : ''}`}>❯</span>
        <span className="pd-cmd">{cmd}</span>
        {caret && <span className="pd-cursor" />}
      </div>
      {shown.map((l, i) => <Line key={i} line={l} />)}
    </div>
  )
}

export default function PromptDemo() {
  const [i, setI] = useState(0)
  const [typed, setTyped] = useState(0)
  const [shown, setShown] = useState(0)
  const [phase, setPhase] = useState('type')
  const [playing, setPlaying] = useState(false)
  const [reduced, setReduced] = useState(false)
  const scrollRef = useRef(null)
  const hostRef = useRef(null)

  // Honour the OS "reduce motion" setting by showing the finished transcript.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // Only animate while the section is actually on screen.
  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => setPlaying(e.isIntersecting),
      { threshold: 0.25 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!playing || reduced) return
    const step = STEPS[i]
    if (!step) return
    let t

    if (phase === 'type') {
      if (typed < step.cmd.length) {
        // Uneven keystrokes read as typing; a metronome reads as a machine.
        t = setTimeout(() => setTyped((v) => v + 1), 26 + Math.random() * 58)
      } else {
        t = setTimeout(() => setPhase('run'), 300)
      }
    } else if (phase === 'run') {
      t = setTimeout(() => setPhase('out'), step.out.length ? 240 : 80)
    } else if (phase === 'out') {
      if (shown < step.out.length) {
        t = setTimeout(() => setShown((v) => v + 1), 80)
      } else {
        t = setTimeout(() => setPhase('hold'), step.out.length ? 620 : 240)
      }
    } else if (phase === 'hold') {
      const last = i + 1 >= STEPS.length
      t = setTimeout(() => {
        setI(last ? 0 : i + 1)
        setTyped(0)
        setShown(0)
        setPhase('type')
      }, last ? 2200 : 520)
    }

    return () => clearTimeout(t)
  }, [i, phase, typed, shown, playing, reduced])

  // Keep the newest line in view as the transcript grows.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [i, shown, typed, reduced])

  const replay = () => {
    setI(0); setTyped(0); setShown(0); setPhase('type')
  }

  const history = reduced ? STEPS : STEPS.slice(0, i)
  const current = reduced ? null : STEPS[i]

  return (
    <section id="prompt" className="py-20 px-6" ref={hostRef}>
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <p className="font-mono text-sm text-accent mb-2">~/prompt</p>
          <h2 className="font-heading text-3xl sm:text-4xl tracking-tight" style={{ fontWeight: 500 }}>
            A prompt that knows where it is
          </h2>
          <p className="text-muted-foreground text-sm mt-2">
            Watch the line rebuild itself — branch, dirty state, runtime, timing, exit status
          </p>
        </div>

        <div className="pd-window rounded-2xl border shadow-2xl overflow-hidden bg-card">
          <div className="flex items-center px-4 py-2.5 border-b border-border/20 bg-muted/30">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-[11px] text-muted-foreground font-mono">kranthi@mbp — zsh</span>
            </div>
            <button
              onClick={replay}
              className="text-[10px] font-mono text-muted-foreground hover:text-accent transition-colors px-2 py-0.5 rounded"
              aria-label="Replay the demo from the start"
            >
              replay
            </button>
          </div>

          <div ref={scrollRef} className="pd-screen" aria-hidden="true">
            <div className="pd-feed">
              <div className="pd-banner">Last login: Wed Aug 20 09:14:22 on ttys002</div>
              {history.map((s, n) => <Block key={n} step={s} />)}
              {current && <Block step={current} typed={typed} caret />}
            </div>
          </div>
        </div>

        {/* The animation is decorative; this is the same content for screen readers. */}
        <p className="sr-only">
          A demonstration shell session. Commands run in order:{' '}
          {STEPS.map((s) => s.cmd).join(', then ')}. The prompt gains a git branch
          segment inside the repository, a marker when the working tree is dirty, the
          detected Node version, how long the previous command took, and a red caret
          when a command fails.
        </p>
      </div>

      <style>{`
        .pd-window { border-color: color-mix(in oklab, var(--color-border) 50%, transparent); }
        .pd-screen {
          height: 300px; overflow: hidden; padding: 14px 18px 18px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-size: 12.5px; line-height: 1.65;
          background: color-mix(in oklab, var(--color-card) 92%, var(--color-background));
        }
        .pd-banner { color: var(--color-muted-foreground); opacity: .55; margin-bottom: 12px; }
        .pd-block + .pd-block { margin-top: 12px; }

        .pd-prompt { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 14px; }
        .pd-seg { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
        .pd-seg svg { flex: none; opacity: .85; }

        /* Directory follows the site accent; the rest are semantic and fixed so
           they stay distinguishable at any hue the colour picker lands on. */
        .pd-dir  { color: var(--color-accent); font-weight: 500; }
        .pd-git  { color: #c678dd; }
        .pd-node { color: #6cc24a; }
        .pd-took { color: #d1a34a; }
        .pd-dirty { color: #e5534b; margin-left: 1px; }

        .pd-cmdline { display: flex; align-items: baseline; gap: 8px; margin-top: 1px; }
        .pd-caret { color: #6cc24a; font-weight: 600; }
        .pd-caret-err { color: #e5534b; }
        .pd-cmd { color: var(--color-foreground); word-break: break-word; }

        .pd-cursor {
          display: inline-block; width: 7px; height: 14px; translate: 0 2px;
          background: var(--color-accent); animation: pd-blink 1.05s steps(1) infinite;
        }
        @keyframes pd-blink { 0%,50% { opacity: 1 } 50.01%,100% { opacity: 0 } }

        .pd-out { color: var(--color-muted-foreground); padding-left: 2px; }
        .pd-o-dim  { opacity: .72; }
        .pd-o-ok   { color: #6cc24a; }
        .pd-o-err  { color: #e5534b; }
        .pd-o-link { color: var(--color-accent); text-decoration: underline; text-underline-offset: 2px; }

        @media (max-width: 640px) {
          .pd-screen { height: 268px; font-size: 11.5px; padding: 12px 14px 14px; }
          .pd-prompt { gap: 2px 10px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pd-cursor { animation: none; }
          .pd-screen { height: auto; max-height: 420px; overflow-y: auto; }
        }
      `}</style>
    </section>
  )
}
