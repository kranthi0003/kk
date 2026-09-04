import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { IS_LITE, IS_NARROW, FULL_KEY } from './lib/lite'
import Navbar from './components/Navbar'
import ScrollProgress from './components/ScrollProgress'
import Hero from './components/Hero'
import About from './components/About'
import TechStack from './components/TechStack'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Connect from './components/Contact'
import Footer from './components/Footer'
import ResumeViewer from './components/ResumeViewer'
import AIChatbot from './components/AIChatbot'
import TransformationHQ from './components/TransformationHQ'
import ThemeToggle from './components/ThemeToggle'
import ChangelogFeed from './components/ChangelogFeed'


const BattlePage = lazy(() => import('./components/battle/BattlePage'))
const CollabEditor = lazy(() => import('./components/battle/CollabEditor'))
const StrangerChat = lazy(() => import('./components/StrangerChat'))
const Workspace = lazy(() => import('./components/Workspace'))
const SpaceExplorer = lazy(() => import('./components/SpaceExplorer'))
const AstroDither = lazy(() => import('./components/AstroDither'))
const TruthOrDare = lazy(() => import('./components/TruthOrDare'))
const Vegas = lazy(() => import('./components/Vegas'))
const Europe = lazy(() => import('./components/Europe'))
const ReliabilityLab = lazy(() => import('./components/ReliabilityLab'))
const Blog = lazy(() => import('./components/Blog'))
const BlogPost = lazy(() => import('./components/BlogPost'))
const NowPage = lazy(() => import('./components/NowPage'))
const Timeline = lazy(() => import('./components/Timeline'))
const UsesPage = lazy(() => import('./components/UsesPage'))
const KnowledgeBase = lazy(() => import('./components/KnowledgeBase'))
const MusicPage = lazy(() => import('./components/MusicPage'))
const MoviesPage = lazy(() => import('./components/MoviesPage'))
const PhotographyPage = lazy(() => import('./components/PhotographyPage'))
const BrandsPage = lazy(() => import('./components/BrandsPage'))
const OmscsPage = lazy(() => import('./components/OmscsPage'))
const StocksPage = lazy(() => import('./components/StocksPage'))
const JobsPage = lazy(() => import('./components/JobsPage'))
const EbcPage = lazy(() => import('./components/EbcPage'))
const SaladsPage = lazy(() => import('./components/SaladsPage'))
const AllTheBest = lazy(() => import('./components/AllTheBest'))
const OneMonth = lazy(() => import('./components/OneMonth'))
const Her = lazy(() => import('./components/Her'))
const RoyalSquare = lazy(() => import('./components/RoyalSquare'))
const F1 = lazy(() => import('./components/F1'))
const Cricket = lazy(() => import('./components/Cricket'))
const Splat = lazy(() => import('./components/Splat'))

// One lazy chunk for the whole of the full-site experience. A narrow
// screen never requests it, so none of it is downloaded.
// Set before anything renders, so the fade-in CSS applies from the first
// paint and there is no flash of already-visible content. Its absence is
// what makes the page degrade to "everything visible" rather than blank
// if this script never runs at all.
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('js-reveal')
}

const SiteExtras = lazy(() => import('./components/SiteExtras'))
const ExtraAfterHero = lazy(() => import('./components/SiteExtras').then(m => ({ default: m.ExtraAfterHero })))
const ExtraAfterTech = lazy(() => import('./components/SiteExtras').then(m => ({ default: m.ExtraAfterTech })))
const ExtraAfterAbout = lazy(() => import('./components/SiteExtras').then(m => ({ default: m.ExtraAfterAbout })))
const ExtraGuestbook = lazy(() => import('./components/SiteExtras').then(m => ({ default: m.ExtraGuestbook })))
const ExtraBackdrop = lazy(() => import('./components/SiteExtras').then(m => ({ default: m.ExtraBackdrop })))

// The switch between the two versions.
//
// This used to be a banner telling anyone on a phone that the site was
// "best experienced on a desktop browser", which is an odd thing to say
// to someone who is already here and cannot do anything about it. Now
// that a phone gets a version built for it, it says which one is being
// shown and offers the other.
//
// It sits at the bottom, out of the way of the content, and closing it
// is remembered for the session.
function MobileBanner() {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try { if (sessionStorage.getItem('mobile_banner_off')) setDismissed(true) } catch {}
  }, [])

  // Only worth showing on a screen small enough for the choice to matter.
  if (!IS_NARROW || dismissed) return null

  const swap = () => {
    try {
      if (IS_LITE) localStorage.setItem(FULL_KEY, '1')
      else localStorage.removeItem(FULL_KEY)
    } catch {}
    window.location.reload()
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[999] flex items-center justify-center gap-3 py-2 px-4 text-[11.5px] backdrop-blur-md"
      style={{
        background: 'color-mix(in oklab, var(--color-card) 92%, transparent)',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <span className="text-muted-foreground">
        {IS_LITE ? 'Lite version' : 'Full version'}
      </span>
      <button
        onClick={swap}
        className="font-medium underline underline-offset-2 text-foreground hover:opacity-70 transition-opacity"
      >
        {IS_LITE ? 'Show everything' : 'Switch to lite'}
      </button>
      <button
        onClick={() => { setDismissed(true); try { sessionStorage.setItem('mobile_banner_off', '1') } catch {} }}
        aria-label="Dismiss"
        className="ml-1 text-muted-foreground/60 hover:text-foreground transition-colors"
      >
        ✕
      </button>
    </div>
  )
}

export default function App() {
  const [matrixActive, setMatrixActive] = useState(false)
  const [resumeOpen, setResumeOpen] = useState(false)
  const [booted, setBooted] = useState(true)
  const [route, setRoute] = useState(() => window.location.hash || (window.location.pathname === '/battle' ? '#/battle' : ''))

  // One-time cleanup: remove any leftover alternate-theme classes from
  // prior versions of the site that supported Fight Club / F1 / etc.
  useEffect(() => {
    const stale = ['theme-fightclub', 'theme-f1', 'theme-cyberpunk', 'theme-vintage', 'theme-ocean', 'theme-dracula']
    stale.forEach(c => document.documentElement.classList.remove(c))
    try { localStorage.removeItem('site_theme_mode') } catch {}
  }, [])

  // Handle deferred scroll target (e.g. from 3D Workspace back-to-section nav)
  useEffect(() => {
    const target = sessionStorage.getItem('scrollTo')
    if (target && !route) {
      sessionStorage.removeItem('scrollTo')
      setTimeout(() => {
        document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })
      }, 300)
    }
  }, [route])

  // Hash-based routing
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // IMPORTANT: every hook must run before the route early-returns below.
  // Navigation is reload-free (SPA), so a route change re-renders this same
  // component — if a hook lived after an early return, the hook count would
  // change between renders and React would throw (error #300).
  const handleSecretTrigger = useCallback(() => {
    if (!matrixActive) setMatrixActive(true)
  }, [matrixActive])

  const handleMatrixComplete = useCallback(() => {
    setMatrixActive(false)
  }, [])

  // Listen for matrix trigger from command palette
  useEffect(() => {
    const handler = () => { if (!matrixActive) setMatrixActive(true) }
    window.addEventListener('trigger-matrix', handler)
    return () => window.removeEventListener('trigger-matrix', handler)
  }, [matrixActive])

  // Reveal-on-scroll for homepage sections. Re-runs on route change so the
  // sections are re-observed when returning to the homepage (no-op elsewhere).
  //
  // A .section-animate starts at opacity 0 and only becomes visible once
  // this observer adds .in-view. That makes the observer load-bearing:
  // anything it fails to pick up is not merely un-animated, it is
  // permanently invisible.
  //
  // Which is exactly what happened when the extra sections moved behind a
  // lazy import for the lite build. querySelectorAll ran on mount, before
  // that chunk had arrived, so nine of the fourteen sections were never
  // observed and 6,750px of the page stayed blank. A MutationObserver now
  // watches for sections that mount later and observes those too.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
            // Stagger the visible reveal items so they settle in one-by-one.
            const items = Array.from(entry.target.querySelectorAll('.reveal'))
              .filter((el) => el.offsetParent !== null)
            items.forEach((el, i) => {
              el.style.transitionDelay = `${Math.min(i * 70, 630)}ms`
            })
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1 }
    )

    const seen = new WeakSet()
    const observe = (el) => {
      if (seen.has(el)) return
      seen.add(el)
      io.observe(el)
    }
    const sweep = () => document.querySelectorAll('.section-animate').forEach(observe)

    sweep()

    // Lazy chunks land after this effect has already run, so watch for
    // them rather than assuming the page is complete on mount.
    const mo = new MutationObserver((records) => {
      for (const r of records) {
        for (const node of r.addedNodes) {
          if (node.nodeType !== 1) continue
          if (node.classList?.contains('section-animate')) observe(node)
          node.querySelectorAll?.('.section-animate').forEach(observe)
        }
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => { io.disconnect(); mo.disconnect() }
  }, [route])

  // Battle page route
  if (route === '#/battle') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-accent rounded-full animate-spin" /></div>}>
        <BattlePage onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Collab editor route
  if (route.startsWith('#/collab')) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-accent rounded-full animate-spin" /></div>}>
        <CollabEditor onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Transformation HQ page route
  if (route.startsWith('#/transformation')) {
    return (
      <>
        <div className="pr-backdrop-glow" aria-hidden="true" />
        <div className="pr-backdrop-noise" aria-hidden="true" />
        <TransformationHQ onBack={() => { window.location.hash = '' }} />
      </>
    )
  }

  // Stranger chat page route
  if (route.startsWith('#/stranger')) {
    return (
      <>
        <div className="pr-backdrop-glow" aria-hidden="true" />
        <div className="pr-backdrop-noise" aria-hidden="true" />
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-accent rounded-full animate-spin" /></div>}>
          <StrangerChat onBack={() => { window.location.hash = '' }} />
        </Suspense>
      </>
    )
  }

  // 3D Workspace page route
  if (route.startsWith('#/workspace')) {
    return (
      <>
        <div className="pr-backdrop-glow" aria-hidden="true" />
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-accent rounded-full animate-spin" /></div>}>
          <Workspace onBack={() => { window.location.hash = '' }} />
        </Suspense>
      </>
    )
  }

  // Space Explorer — accessible via #/space route
  if (route === '#/space') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-black flex items-center justify-center"><div className="text-[10px] font-mono tracking-[0.5em] text-white/30 animate-pulse">INITIALIZING WARP DRIVE</div></div>}>
        <SpaceExplorer />
      </Suspense>
    )
  }

  // AstroDither — accessible via #/astro route
  if (route === '#/astro') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-[#050508] flex items-center justify-center"><div className="text-[10px] font-mono tracking-[0.3em] text-white/20 animate-pulse">LOADING PARTICLES</div></div>}>
        <AstroDither onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Truth or Dare — accessible via #/tod route
  if (route === '#/tod') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading game...</div></div>}>
        <TruthOrDare onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Vegas — private, password-protected page via #/vegas route
  if (route === '#/vegas') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading…</div></div>}>
        <Vegas onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Europe — private, password-protected winter-trip plan via #/europe route
  if (route === '#/europe') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading…</div></div>}>
        <Europe onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Music — Spotify-like library + user playlists via #/music route
  if (route === '#/music') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading music…</div></div>}>
        <MusicPage onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Salads — ingredient-first recipe shelf via #/salads route
  if (route === '#/salads') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">tossing…</div></div>}>
        <SaladsPage onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Films — upcoming releases, from the same movies.json the Sidecar reads
  if (route === '#/movies') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading…</div></div>}>
        <MoviesPage onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Pictures — placeholder until there are photographs to put in it
  if (route === '#/photos') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading…</div></div>}>
        <PhotographyPage onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Brands — placeholder; this one gets written by hand, not generated
  if (route === '#/brands') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading…</div></div>}>
        <BrandsPage onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // OMSCS — the plan, honestly labelled as a plan
  if (route === '#/omscs') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading…</div></div>}>
        <OmscsPage onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // EBC — the training plan for Everest Base Camp, Sept/Oct 2027
  if (route === '#/ebc') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading…</div></div>}>
        <EbcPage onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Jobs — engineering openings read from public ATS boards at build time
  if (route === '#/jobs') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading…</div></div>}>
        <JobsPage onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Stocks — live quotes for the companies he works on or for
  if (route === '#/stocks') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading…</div></div>}>
        <StocksPage onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Royal Square — the apartment page (location, notices, bills, services, events)
  if (route === '#/royalsquare') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">opening the gate…</div></div>}>
        <RoyalSquare onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // F1 — a cinematic hero over the live championship (standings, calendar, countdown)
  if (route === '#/f1') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">forming up on the grid…</div></div>}>
        <F1 onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Cricket — India's standing, the tours on now and how the week finished
  if (route === '#/cricket') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">taking guard…</div></div>}>
        <Cricket onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // All the best — a private, unlisted note (shared directly by link). Not in nav.
  if (route === '#/allthebest') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading…</div></div>}>
        <AllTheBest onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // One month — a private, unlisted note (shared directly by link). Not in nav.
  if (route === '#/onemonth') {
    return (
      <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0b1024' }}><div className="text-xs font-mono animate-pulse" style={{ color: 'rgba(174,196,255,0.5)' }}>loading…</div></div>}>
        <OneMonth onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Her — a private, unlisted long-form note (shared directly by link). Not in nav.
  if (route === '#/her') {
    return (
      <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center" style={{ background: '#fbf7f4' }}><div className="text-xs font-mono animate-pulse" style={{ color: 'rgba(162,102,110,0.5)' }}>loading…</div></div>}>
        <Her onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // A private, unlisted little story + mini-game. Not in nav.
  if (route === '#/skota') {
    return (
      <Suspense fallback={<div className="fixed inset-0 flex items-center justify-center" style={{ background: '#121a2e' }}><div className="text-xs font-mono text-white/50 animate-pulse">loading…</div></div>}>
        <Splat onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Reliability Lab — live observability dashboard via #/reliability route
  if (route === '#/reliability') {    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">booting telemetry…</div></div>}>
        <ReliabilityLab onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Blog — index, individual posts, and a backward-compatible #/dopamine link
  if (route === '#/blog') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading…</div></div>}>
        <Blog onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }
  if (route.startsWith('#/blog/') || route === '#/dopamine') {
    const slug = route === '#/dopamine' ? 'cheap-dopamine' : route.slice('#/blog/'.length)
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading…</div></div>}>
        <BlogPost slug={slug} onBack={() => { window.location.hash = '#/blog' }} />
      </Suspense>
    )
  }

  // Now page — what I'm doing at the moment
  if (route === '#/now') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading…</div></div>}>
        <NowPage onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Learning Timeline — certifications & learning journey
  if (route === '#/timeline') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading…</div></div>}>
        <Timeline onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Knowledge Base — topic-first view of notes & TILs
  if (route === '#/notes') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading…</div></div>}>
        <KnowledgeBase onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  // Uses — the tools & gear behind the work
  if (route === '#/uses') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading…</div></div>}>
        <UsesPage onBack={() => { window.location.hash = '' }} />
      </Suspense>
    )
  }

  return (
    <>
      
      {/* Provisionr-style 3-layer fixed backdrop */}
      <div className="pr-backdrop-base" aria-hidden="true" />
      <div className="pr-backdrop-glow" aria-hidden="true" />
      <div className="pr-backdrop-noise" aria-hidden="true" />
      {!IS_LITE && <Suspense fallback={null}><ExtraBackdrop /></Suspense>}
      <div className="min-h-screen text-foreground [--header-height:68px]">
      <MobileBanner />
      <ScrollProgress />
      <Navbar onSecretTrigger={handleSecretTrigger} onResumeClick={() => setResumeOpen(true)} />
      <main>
        <Hero onResumeClick={() => setResumeOpen(true)} />
        {!IS_LITE && <Suspense fallback={null}><ExtraAfterHero /></Suspense>}
        <div className="section-animate"><Experience /></div>
        <div className="section-animate"><TechStack /></div>
        {!IS_LITE && <Suspense fallback={null}><ExtraAfterTech /></Suspense>}
        <div className="section-animate"><Projects /></div>
        <div className="section-animate"><About /></div>
        {!IS_LITE && <Suspense fallback={null}><ExtraAfterAbout /></Suspense>}
        <div className="section-animate"><Connect /></div>
        {!IS_LITE && <Suspense fallback={null}><ExtraGuestbook /></Suspense>}
      </main>
      <Footer />
      <ResumeViewer open={resumeOpen} onClose={() => setResumeOpen(false)} />
      <AIChatbot />
      {!IS_LITE && (
        <Suspense fallback={null}>
          <SiteExtras matrixActive={matrixActive} onMatrixComplete={handleMatrixComplete} />
        </Suspense>
      )}
    </div>
    </>
  )
}
