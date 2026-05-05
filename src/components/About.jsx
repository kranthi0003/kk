import React, { useState, useEffect } from 'react'
import GitHubStats from './GitHubStats'
import GitHubHeatmap from './GitHubHeatmap'
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
    <div className="rounded-2xl border border-border/30 shadow-lg bg-gradient-to-br from-violet-500/10 via-card to-card p-5 flex flex-col justify-between relative overflow-hidden">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] text-accent uppercase tracking-widest">Vizag, India</p>
        <span className="text-lg">{isDay ? '☀️' : '🌙'}</span>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <p className="font-mono text-3xl sm:text-4xl font-bold tracking-tight">
          <span className="text-foreground">{hours}</span>
          <span className="text-accent animate-pulse">:</span>
          <span className="text-foreground">{mins}</span>
          <span className="text-muted-foreground/50 text-xl ml-1">{secs}</span>
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
    <section id="about" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-float absolute top-20 left-10 w-32 h-32 bg-accent/10 rounded-full blur-xl" />
        <div className="animate-float absolute top-40 right-20 w-24 h-24 bg-accent/5 rounded-lg blur-lg" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12">
          <p className="font-mono text-sm text-accent mb-2">Get to Know Me</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">About Me</h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

          {/* Row 1: LinkedIn + Quote + Location */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-border/30 shadow-lg flex flex-col bg-card">
            <div className="h-20 relative overflow-hidden flex-shrink-0">
              <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=200&fit=crop" alt="" className="w-full h-full object-cover" />
              <div className="absolute -bottom-8 left-5">
                <img src={profile} alt="Kranthi Kiran" className="w-16 h-16 rounded-full object-cover border-3 border-card shadow-lg" />
              </div>
            </div>
            <div className="pt-10 px-5 pb-5 flex flex-col gap-0.5 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-heading font-bold text-base">Kranthi Kiran</h4>
                <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
              </div>
              <p className="text-xs text-muted-foreground">SE-III @GitHub | Microsoft | prev - Amazon</p>
              <p className="text-[11px] text-muted-foreground/70">Visakhapatnam, India</p>
              <div className="flex gap-2 mt-auto">
                <a href="https://www.linkedin.com/in/akkiran003/" target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-3 py-1.5 rounded-full bg-blue-600 text-white font-medium text-xs hover-lift transition-all">Connect</a>
                <a href="https://www.linkedin.com/in/akkiran003/" target="_blank" rel="noopener noreferrer" className="flex-1 text-center px-3 py-1.5 rounded-full border border-blue-600 text-blue-600 font-medium text-xs hover:bg-blue-600/10 transition-all">Profile</a>
              </div>
            </div>
          </div>

          {/* Live Clock Card */}
          <BentoClockCard />

          {/* Currently Card */}
          <div className="rounded-2xl border border-border/30 shadow-lg bg-gradient-to-br from-emerald-500/10 via-card to-card p-5 flex flex-col gap-3 relative overflow-hidden">
            <p className="font-mono text-[10px] text-accent uppercase tracking-widest">Currently</p>
            <div className="space-y-2.5 flex-1 flex flex-col justify-center">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center text-sm">💼</span>
                <p className="text-xs text-foreground">Building at <span className="font-semibold text-accent">GitHub</span></p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center text-sm">🎧</span>
                <p className="text-xs text-foreground">Listening to <span className="font-semibold">Bollywood Hits</span></p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-sm">📚</span>
                <p className="text-xs text-foreground">Reading <span className="font-semibold">System Design</span></p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-rose-500/15 flex items-center justify-center text-sm">🎮</span>
                <p className="text-xs text-foreground">Playing <span className="font-semibold">Valorant</span></p>
              </div>
            </div>
          </div>

          {/* Row 2: Spotify (taller) + GitHub Stats */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-border/30 shadow-lg bg-card">
            <iframe src="https://open.spotify.com/embed/playlist/37i9dQZF1DX0ieekvzt1Ic?utm_source=generator&theme=0" width="100%" height="300" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" className="rounded-2xl sm:h-[352px]" title="Spotify Playlist" />
          </div>

          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-border/30 shadow-lg bg-card flex flex-col">
            <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2 flex-shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              <span className="font-semibold text-sm">GitHub</span>
              <a href="https://github.com/kranthi0003" target="_blank" rel="noopener noreferrer" className="ml-auto text-[11px] text-accent hover:underline font-mono">@kranthi0003</a>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-center overflow-hidden">
              <GitHubStats />
            </div>
          </div>

          {/* Row 3: Instagram + Fun Facts */}
          <div className="lg:col-span-2 rounded-2xl overflow-hidden border border-border/30 shadow-lg bg-card h-[350px] sm:h-[420px]">
            <iframe src="https://www.instagram.com/p/DT8OLC5EkQRzmD0wvICVwpR6M6NCqBAiGZWiMU0/embed" width="100%" height="100%" frameBorder="0" scrolling="no" allowTransparency="true" loading="lazy" className="rounded-2xl" title="Instagram post" />
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-border/30 shadow-lg bg-gradient-to-br from-orange-500/5 via-card to-amber-500/5 p-5 sm:p-6 flex flex-col justify-between min-h-[350px] sm:h-[420px]">
            <div className="flex items-center gap-2">
              <span className="text-lg">₿</span>
              <p className="font-mono text-xs text-orange-500 uppercase tracking-widest">Bitcoin</p>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-inner">
                <QRCodeSVG
                  value="bc1quaunu4xa0jgeh446jlx2mchlv4gda9tj0dqz9e"
                  size={120}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#f97316"
                />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground mb-1">Buy me a coffee ☕</p>
                <p className="text-[10px] text-muted-foreground font-mono break-all max-w-[220px] leading-relaxed select-all">
                  bc1quaunu4xa0jgeh446jlx2mchlv4gda9tj0dqz9e
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('bc1quaunu4xa0jgeh446jlx2mchlv4gda9tj0dqz9e')
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[11px] font-mono hover:bg-orange-500/20 transition-all"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy address
              </button>
            </div>
          </div>

          {/* GitHub Activity — full width */}
          <div className="lg:col-span-4 rounded-2xl overflow-hidden border border-border/30 shadow-lg bg-card">
            <div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="font-semibold text-xs">Contribution Activity</span>
            </div>
            <div className="p-3">
              <GitHubHeatmap />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
