import React, { useState } from 'react'

const MailIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const socials = [
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/akkiran003/',
    handle: 'akkiran003',
    icon: (
      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    color: 'text-blue-600',
  },
  {
    name: 'GitHub',
    url: 'https://github.com/kranthi0003',
    handle: '@kranthi0003',
    icon: (
      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    color: 'text-foreground',
  },
  {
    name: 'Email',
    url: 'mailto:kranthikiranakkumahanthi@gmail.com',
    handle: 'kranthikiranakkumahanthi@gmail.com',
    icon: <MailIcon />,
    color: 'text-red-500',
  },
]

export default function Connect() {
  return (
    <section id="connect" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="space-y-8">
          {/* Connect card */}
          <div className="card-3d shadow-xl rounded-2xl animate-float" style={{ animationDelay: '0.2s' }}>
            <div className="p-8">
              <p className="font-mono text-sm text-accent mb-2">Let's Connect</p>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-6">Connect With Me</h2>
            </div>
            <div className="px-8 pb-8">
              <p className="text-muted-foreground mb-6">
                Always open to meeting new people — whether you want to talk tech, collaborate on something cool,
                or just wanna say hi. Hit me up on any of the platforms below.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {socials.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-6 rounded-2xl border border-border/50 bg-card hover:bg-muted/50 transition-all duration-300 hover-lift"
                  >
                    <span className={social.color}>{social.icon}</span>
                    <div>
                      <h4 className="font-medium">{social.name}</h4>
                      <p className="text-sm text-muted-foreground">{social.handle}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Open to Opportunities */}
          <div>
            {/* Open to Opportunities */}
            <div className="rounded-2xl border border-border/30 shadow-xl bg-gradient-to-br from-accent/5 via-card to-primary/5 p-8 flex flex-col justify-center text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>
                <span className="text-green-500 font-mono text-xs font-bold uppercase tracking-wider">Open to Opportunities</span>
              </div>
              <h3 className="font-heading text-xl font-bold mb-3">Let's build something together</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Interested in cloud infrastructure, distributed systems, and developer tooling.
                Always happy to chat about new challenges.
              </p>
              <a
                href="mailto:kranthikiranakkumahanthi@gmail.com"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover-lift shadow-lg transition-all mx-auto"
              >
                <MailIcon /> Say Hello
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
