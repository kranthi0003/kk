import React, { useEffect, useState, useCallback } from 'react'
import Navbar from './components/Navbar'
import ScrollProgress from './components/ScrollProgress'
import MatrixEasterEgg from './components/KonamiEasterEgg'
import Hero from './components/Hero'
import About from './components/About'
import TechStack from './components/TechStack'
import Experience from './components/Experience'
import Certifications from './components/Certifications'
import Projects from './components/Projects'
import TravelMap from './components/TravelMap'
import Stats from './components/Stats'
import Connect from './components/Contact'
import Footer from './components/Footer'
import SpotifyPill from './components/SpotifyPill'

export default function App() {
  const [matrixActive, setMatrixActive] = useState(false)

  const handleSecretTrigger = useCallback(() => {
    if (!matrixActive) setMatrixActive(true)
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
    <div className="min-h-screen bg-background text-foreground">
      <ScrollProgress />
      <MatrixEasterEgg active={matrixActive} onComplete={handleMatrixComplete} />
      <Navbar onSecretTrigger={handleSecretTrigger} />
      <main>
        <Hero />
        <div className="section-animate"><TechStack /></div>
        <div className="section-animate"><Experience /></div>
        <div className="section-animate"><Certifications /></div>
        <div className="section-animate"><About /></div>
        <div className="section-animate"><Projects /></div>
        <div className="section-animate"><TravelMap /></div>
        <div className="section-animate"><Stats /></div>
        <div className="section-animate"><Connect /></div>
      </main>
      <Footer />
      <SpotifyPill />
    </div>
  )
}
