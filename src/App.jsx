import React, { useEffect, useState, useCallback } from 'react'
import BootLoader from './components/BootLoader'
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
import CommandPalette from './components/CommandPalette'
import Changelog from './components/Changelog'
import QRvCard from './components/QRvCard'
import SpeedTest from './components/SpeedTest'
import ShareCard from './components/ShareCard'
import MemeGenerator from './components/MemeGenerator'
import DevCalc from './components/DevCalc'
import CarbonCalc from './components/CarbonCalc'
import SalaryCalc from './components/SalaryCalc'
import CodeBrowser from './components/CodeBrowser'
import LiveChat from './components/LiveChat'
import ThemeModePicker from './components/ThemeModePicker'
import ChangelogFeed from './components/ChangelogFeed'
import VisitorCount from './components/VisitorCount'
import VisitorTracker from './components/VisitorTracker'
import AdminDashboard from './components/AdminDashboard'

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
  const [booted, setBooted] = useState(() => !!sessionStorage.getItem('boot_seen'))

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
      {!booted && <BootLoader onComplete={() => setBooted(true)} />}
      <div className={`min-h-screen bg-background text-foreground transition-opacity duration-500 ${!booted ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <MobileBanner />
      <ScrollProgress />
      <MatrixEasterEgg active={matrixActive} onComplete={handleMatrixComplete} />
      <Navbar onSecretTrigger={handleSecretTrigger} onResumeClick={() => setResumeOpen(true)} />
      <main>
        <Hero onResumeClick={() => setResumeOpen(true)} />
        <div className="section-animate"><Experience /></div>
        <div className="section-animate"><TechStack /></div>
        <div className="section-animate"><About /></div>
        <div className="section-animate"><Terminal /></div>
        <div className="section-animate"><Projects /></div>
        <div className="section-animate"><TravelMap /></div>
        <div className="section-animate"><Connect /></div>
        <div className="section-animate"><Guestbook /></div>
      </main>
      <Footer />
      <ResumeViewer open={resumeOpen} onClose={() => setResumeOpen(false)} />
      <AIChatbot />
      <VisitorTracker />
      <VisitorCount />
      <AdminDashboard />
      <CommandPalette onResumeClick={() => setResumeOpen(true)} />
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
      <ThemeModePicker />
    </div>
    </>
  )
}
