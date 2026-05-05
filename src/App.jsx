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
import ChangelogFeed from './components/ChangelogFeed'
import VisitorCount from './components/VisitorCount'
import VisitorTracker from './components/VisitorTracker'
import AdminDashboard from './components/AdminDashboard'

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
      <ScrollProgress />
      <MatrixEasterEgg active={matrixActive} onComplete={handleMatrixComplete} />
      <Navbar onSecretTrigger={handleSecretTrigger} onResumeClick={() => setResumeOpen(true)} />
      <main>
        <Hero onResumeClick={() => setResumeOpen(true)} />
        <div className="section-animate"><ChangelogFeed /></div>
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
    </div>
    </>
  )
}
