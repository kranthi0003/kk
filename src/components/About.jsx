import React, { useState, useEffect } from 'react'
import profile from '../../assets/profile.png'

function BentoClockCard() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const ist = new Date(time.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const hours = ist.getHours().toString().padStart(2, '0')
  const mins = ist.getMinutes().toString().padStart(2, '0')
  const secs = ist.getSeconds().toString().padStart(2, '0')
  const isDay = ist.getHours() >= 6 && ist.getHours() < 19

  return (
    <div className="rounded-2xl border border-border/20 bg-card p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">Vizag, India</p>
        <span className="text-base">{isDay ? '☀️' : '🌙'}</span>
      </div>
      <div className="flex-1 flex items-center justify-center py-3">
        <p className="font-mono text-4xl font-bold tracking-tight">
          <span className="text-foreground">{hours}</span>
          <span className="text-accent/60 animate-pulse">:</span>
          <span className="text-foreground">{mins}</span>
          <span className="text-muted-foreground/40 text-lg ml-1">{secs}</span>
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <p className="text-[11px] text-green-500 font-medium">Available for work</p>
      </div>
    </div>
  )
}

export default function About() {
  return (
    <section id="about" className="py-24">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="font-mono text-sm text-accent mb-2">~/about</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">About Me</h2>
        </div>

        {/* Apple-style bento grid */}
        <div className="grid grid-cols-4 gap-3 auto-rows-[180px]">

          {/* Profile — 2 cols, 1 row */}
          <div className="col-span-2 rounded-2xl border border-border/20 bg-card overflow-hidden flex flex-col">
            <div className="h-20 relative overflow-hidden flex-shrink-0">
              <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=200&fit=crop" alt="" className="w-full h-full object-cover" />
              <div className="absolute -bottom-7 left-4">
                <img src={profile} alt="Kranthi Kiran" className="w-14 h-14 rounded-full object-cover border-2 border-card shadow-md" />
              </div>
            </div>
            <div className="pt-9 px-4 pb-4 flex flex-col flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h4 className="font-heading font-bold text-sm">Kranthi Kiran</h4>
                <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </div>
              <p className="text-[11px] text-muted-foreground mb-3">SE-III @GitHub · prev Amazon, Couchbase, Groww</p>
              <div className="flex gap-2 mt-auto">
                <a href="https://www.linkedin.com/in/akkiran003/" target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-1.5 rounded-lg bg-blue-600 text-white font-medium text-[11px] hover:opacity-90 transition-all">Connect</a>
                <a href="https://www.linkedin.com/in/akkiran003/" target="_blank" rel="noopener noreferrer" className="flex-1 text-center py-1.5 rounded-lg border border-border/40 text-foreground font-medium text-[11px] hover:bg-muted/50 transition-all">Profile</a>
              </div>
            </div>
          </div>

          {/* Clock */}
          <BentoClockCard />

          {/* Currently */}
          <div className="rounded-2xl border border-border/20 bg-card p-4 flex flex-col">
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Currently</p>
            <div className="space-y-2 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="text-sm">💼</span>
                <p className="text-[11px] text-foreground">Building at <span className="font-semibold text-accent">GitHub</span></p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">🎧</span>
                <p className="text-[11px] text-foreground">Bollywood Hits</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">📚</span>
                <p className="text-[11px] text-foreground">System Design</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">🎮</span>
                <p className="text-[11px] text-foreground">Valorant</p>
              </div>
            </div>
          </div>

          {/* Spotify — 2 cols, 1 row */}
          <div className="col-span-2 rounded-2xl overflow-hidden border border-border/20 bg-card">
            <iframe src="https://open.spotify.com/embed/playlist/37i9dQZF1DX0ieekvzt1Ic?utm_source=generator&theme=0" width="100%" height="100%" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="rounded-2xl" title="Spotify" />
          </div>

          {/* Instagram — 2 cols, 2 rows */}
          <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden border border-border/20 bg-card">
            <iframe src="https://www.instagram.com/p/DS5NAvokmU9/embed" width="100%" height="100%" frameBorder="0" scrolling="no" allowTransparency="true" loading="lazy" className="rounded-2xl" title="Instagram" />
          </div>

          {/* Quote tile */}
          <div className="rounded-2xl border border-border/20 bg-card p-4 flex flex-col justify-center">
            <p className="text-[11px] text-muted-foreground italic leading-relaxed">"First, solve the problem. Then, write the code."</p>
            <p className="text-[9px] text-accent mt-2 font-mono">— John Johnson</p>
          </div>

          {/* Quick stats */}
          <div className="rounded-2xl border border-border/20 bg-card p-4 flex flex-col justify-center">
            <p className="font-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Quick Stats</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Experience</span>
                <span className="text-[11px] font-semibold text-foreground">4+ years</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Companies</span>
                <span className="text-[11px] font-semibold text-foreground">4</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Certifications</span>
                <span className="text-[11px] font-semibold text-foreground">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Countries</span>
                <span className="text-[11px] font-semibold text-foreground">2</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
