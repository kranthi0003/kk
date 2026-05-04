import React, { useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import About from './components/About'
import TechStack from './components/TechStack'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Stats from './components/Stats'
import Connect from './components/Contact'
import Footer from './components/Footer'

export default function App() {
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
      <Navbar />
      <main>
        <Hero />
        <div className="section-animate"><About /></div>
        <div className="section-animate"><TechStack /></div>
        <div className="section-animate"><Experience /></div>
        <div className="section-animate"><Projects /></div>
        <div className="section-animate"><Stats /></div>
        <div className="section-animate"><Connect /></div>
      </main>
      <Footer />
    </div>
  )
}
