import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import Navbar from './components/Navbar'
import ScrollProgress from './components/ScrollProgress'
import MatrixEasterEgg from './components/KonamiEasterEgg'
import Hero from './components/Hero'
import About from './components/About'
import TechStack from './components/TechStack'
import Experience from './components/Experience'
import Projects from './components/Projects'
import TravelMap from './components/TravelMap'
import Terminal from './components/Terminal'
import Connect from './components/Contact'
import Guestbook from './components/Guestbook'
import Footer from './components/Footer'
import ResumeViewer from './components/ResumeViewer'
import AIChatbot from './components/AIChatbot'
import CodeBrowser from './components/CodeBrowser'
import Changelog from './components/Changelog'
import QRvCard from './components/QRvCard'
import SpeedTest from './components/SpeedTest'
import ShareCard from './components/ShareCard'
import MemeGenerator from './components/MemeGenerator'
import DevCalc from './components/DevCalc'
import CarbonCalc from './components/CarbonCalc'
import SalaryCalc from './components/SalaryCalc'
import TransformationHQ from './components/TransformationHQ'
import LiveChat from './components/LiveChat'
import ThemeToggle from './components/ThemeToggle'
import ChangelogFeed from './components/ChangelogFeed'
import VisitorCount from './components/VisitorCount'
import VisitorTracker from './components/VisitorTracker'
import AdminDashboard from './components/AdminDashboard'
import CryptoDashboard from './components/CryptoDashboard'
import DevNet from './components/DevNet'
import ServiceStatus from './components/ServiceStatus'
import CronSchedule from './components/ActionsTools'
import WeatherWidget from './components/WeatherWidget'
import QuoteIntro from './components/QuoteIntro'
import Reflection from './components/Reflection'

import WorkspaceSection from './components/WorkspaceSection'
import AstroDitherSection from './components/AstroDitherSection'

const BattlePage = lazy(() => import('./components/battle/BattlePage'))
const CollabEditor = lazy(() => import('./components/battle/CollabEditor'))
const StrangerChat = lazy(() => import('./components/StrangerChat'))
const Workspace = lazy(() => import('./components/Workspace'))
const SpaceExplorer = lazy(() => import('./components/SpaceExplorer'))
const AstroDither = lazy(() => import('./components/AstroDither'))
const TruthOrDare = lazy(() => import('./components/TruthOrDare'))

function MobileBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('mobile_banner_off')) { setDismissed(true); return }
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!isMobile || dismissed) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[999] bg-accent text-accent-foreground text-center py-2 px-4 text-xs font-medium shadow-md">
      <span>💻 This site is best experienced on a desktop browser</span>
      <button onClick={() => { setDismissed(true); sessionStorage.setItem('mobile_banner_off', '1') }}
        className="ml-3 text-accent-foreground/60 hover:text-accent-foreground font-bold">✕</button>
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

  // Battle page route
  if (route === '#/battle') {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-accent rounded-full animate-spin" /></div>}>
        <BattlePage onBack={() => { window.location.hash = ''; window.location.reload() }} />
      </Suspense>
    )
  }

  // Collab editor route
  if (route.startsWith('#/collab')) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-muted-foreground/20 border-t-accent rounded-full animate-spin" /></div>}>
        <CollabEditor onBack={() => { window.location.hash = ''; window.location.reload() }} />
      </Suspense>
    )
  }

  // Transformation HQ page route
  if (route.startsWith('#/transformation')) {
    return (
      <>
        <div className="pr-backdrop-glow" aria-hidden="true" />
        <div className="pr-backdrop-noise" aria-hidden="true" />
        <TransformationHQ onBack={() => { window.location.hash = ''; window.location.reload() }} />
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
          <StrangerChat onBack={() => { window.location.hash = ''; window.location.reload() }} />
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
          <Workspace onBack={() => { window.location.hash = ''; window.location.reload() }} />
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
        <AstroDither onBack={() => { window.location.hash = ''; window.location.reload() }} />
      </Suspense>
    )
  }

  // Truth or Dare — accessible via #/tod route
  if (route === '#/tod') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background flex items-center justify-center"><div className="text-xs font-mono text-muted-foreground animate-pulse">loading game...</div></div>}>
        <TruthOrDare onBack={() => { window.location.hash = ''; window.location.reload() }} />
      </Suspense>
    )
  }

  const handleSecretTrigger = useCallback(() => {
    if (!matrixActive) setMatrixActive(true)
  }, [matrixActive])

  // Listen for matrix trigger from command palette
  useEffect(() => {
    const handler = () => { if (!matrixActive) setMatrixActive(true) }
    window.addEventListener('trigger-matrix', handler)
    return () => window.removeEventListener('trigger-matrix', handler)
  }, [matrixActive])

  const handleMatrixComplete = useCallback(() => {
    setMatrixActive(false)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.section-animate').forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  return (
    <>
      
      {/* Provisionr-style 3-layer fixed backdrop */}
      <div className="pr-backdrop-base" aria-hidden="true" />
      <div className="pr-backdrop-glow" aria-hidden="true" />
      <div className="pr-backdrop-noise" aria-hidden="true" />
      <div className="min-h-screen text-foreground [--header-height:68px]">
      <MobileBanner />
      <ScrollProgress />
      <MatrixEasterEgg active={matrixActive} onComplete={handleMatrixComplete} />
      <Navbar onSecretTrigger={handleSecretTrigger} onResumeClick={() => setResumeOpen(true)} />
      <main>
        <Hero onResumeClick={() => setResumeOpen(true)} />
        <div className="section-animate"><Reflection by="— René Girard">You don't want what you want because of who you are. You want what you want because the people you want to be have them.</Reflection></div>
        <div className="section-animate"><WorkspaceSection /></div>
        <div className="section-animate"><AstroDitherSection /></div>
        <div className="section-animate"><Experience /></div>
        <div className="section-animate"><TechStack /></div>
        <div className="section-animate"><About /></div>
        <div className="section-animate"><Terminal /></div>
        <div className="section-animate"><Projects /></div>
        <div className="section-animate"><TravelMap /></div>
        <div className="section-animate"><Reflection>The work that lasts is rarely the loudest. Build quietly; let it speak for itself.</Reflection></div>
        <div className="section-animate"><Connect /></div>
        <div className="section-animate"><Guestbook /></div>
      </main>
      <Footer />
      <ResumeViewer open={resumeOpen} onClose={() => setResumeOpen(false)} />
      <AIChatbot />
      <VisitorTracker />
      <VisitorCount />
      <AdminDashboard />
      <Changelog />
      <QRvCard />
      <SpeedTest />
      <ShareCard />
      <MemeGenerator />
      <DevCalc />
      <CarbonCalc />
      <SalaryCalc />
      <CodeBrowser />
      <LiveChat />
      <CryptoDashboard />
      <DevNet />
      <ServiceStatus />
      <CronSchedule />
      <WeatherWidget />
      <QuoteIntro />
    </div>
    </>
  )
}
