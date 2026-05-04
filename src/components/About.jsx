import React from 'react'
import profile from '../../assets/profile.png'
import GitHubStats from './GitHubStats'

export default function About() {
  const languages = ['Python', 'Go', 'Java', 'C++', 'Bash', 'Ruby']
  const tools = ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'GitHub Actions', 'PostgreSQL', 'Redis', 'Kafka', 'Prometheus', 'Grafana', 'Splunk']

  return (
    <section id="about" className="py-32 min-h-screen flex items-center relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-float absolute top-20 left-10 w-32 h-32 bg-accent/10 rounded-full blur-xl" />
        <div className="animate-float absolute top-40 right-20 w-24 h-24 bg-accent/5 rounded-lg blur-lg" style={{ animationDelay: '2s' }} />
        <div className="animate-float absolute bottom-32 left-1/4 w-16 h-16 bg-accent/10 rounded-full blur-md" style={{ animationDelay: '4s' }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-center">
          {/* Photo */}
          <div className="flex justify-center lg:justify-end lg:col-span-2">
            <div className="relative animate-float">
              <div className="bg-card rounded-2xl overflow-hidden shadow-2xl border border-border/30 p-1">
                <img
                  src={profile}
                  alt="Kranthi Kiran"
                  className="w-80 h-80 rounded-xl object-cover"
                />
              </div>
              <div className="absolute -top-8 -right-8 w-16 h-16 bg-accent/20 rounded-full animate-float blur-sm" style={{ animationDelay: '0.5s' }} />
              <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-accent/15 rounded-lg animate-float blur-sm" style={{ animationDelay: '1.5s' }} />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-8 lg:col-span-3">
            <div className="bg-card rounded-2xl p-8 border border-border/30 shadow-xl">
              <div className="mb-6">
                <p className="font-mono text-sm text-accent mb-2">About Me</p>
                <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6">
                  Hey, I'm Kranthi
                </h2>
              </div>

              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  I'm a Cloud Engineer who loves building infrastructure that just works — quietly, reliably, and at scale.
                  Currently at GitHub, previously at Amazon, Couchbase, and Groww, I've spent 4+ years debugging distributed
                  systems, optimizing cloud deployments, and making sure nothing pages me at 3am.
                </p>
                <p>
                  My sweet spot is where reliability meets performance — whether it's tuning Kubernetes clusters,
                  building CI/CD pipelines, or deep-diving into database internals. I'm big on observability,
                  automation, and writing infra code that future-me won't hate.
                </p>
                <p>
                  Outside of work, I'm into photography, gaming, and exploring new tech.
                  I believe in building things that matter and sharing what I learn along the way.
                </p>
              </div>

              {/* Skill tags */}
              <div className="pt-6 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-3">Programming Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang) => (
                      <span
                        key={lang}
                        className="px-4 py-2 bg-accent/10 text-accent rounded-full text-sm font-medium border border-accent/20 hover-lift cursor-default"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-3">Tools & Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {tools.map((tool) => (
                      <span
                        key={tool}
                        className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20 hover-lift cursor-default"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Embed Cards */}
        <div className="mt-20">
          <h3 className="font-heading text-3xl font-bold text-center mb-12">About Me</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LinkedIn Card */}
            <div className="card-3d rounded-2xl overflow-hidden border border-border/30 shadow-lg flex flex-col">
              <div className="p-4 border-b border-border/30 bg-card flex items-center gap-3">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span className="font-semibold">LinkedIn</span>
              </div>
              <div className="p-8 bg-card flex-1 flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-blue-600/10 flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </div>
                <p className="font-heading font-semibold text-lg">Kranthi Kiran</p>
                <p className="text-muted-foreground text-sm text-center">Cloud Engineer at GitHub · Ex-Amazon, Couchbase</p>
                <a
                  href="https://www.linkedin.com/in/akkiran003/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-2.5 rounded-full bg-blue-600 text-white font-medium text-sm hover-lift transition-all shadow-lg shadow-blue-600/20"
                >
                  Connect on LinkedIn
                </a>
              </div>
            </div>

            {/* Spotify Card */}
            <div className="card-3d rounded-2xl overflow-hidden border border-border/30 shadow-lg flex flex-col">
              <div className="p-4 border-b border-border/30 bg-card flex items-center gap-3">
                <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
                <span className="font-semibold">Spotify</span>
              </div>
              <div className="bg-card flex-1">
                <iframe
                  src="https://open.spotify.com/embed/playlist/37i9dQZF1DX0ieekvzt1Ic?utm_source=generator&theme=0"
                  width="100%"
                  height="352"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-b-2xl"
                  title="Spotify Playlist"
                />
              </div>
            </div>

            {/* Instagram Card */}
            <div className="card-3d rounded-2xl overflow-hidden border border-border/30 shadow-lg flex flex-col">
              <div className="p-4 border-b border-border/30 bg-card flex items-center gap-3">
                <svg className="w-6 h-6 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
                <span className="font-semibold">Instagram</span>
              </div>
              <div className="bg-card flex-1">
                <iframe
                  src="https://www.instagram.com/p/DT8OLC5EkQRzmD0wvICVwpR6M6NCqBAiGZWiMU0/embed"
                  width="100%"
                  height="400"
                  frameBorder="0"
                  scrolling="no"
                  allowTransparency="true"
                  loading="lazy"
                  className="rounded-b-2xl"
                  title="Instagram post"
                />
              </div>
            </div>

            {/* GitHub Stats Card */}
            <div className="card-3d rounded-2xl overflow-hidden border border-border/30 shadow-lg flex flex-col">
              <div className="p-4 border-b border-border/30 bg-card flex items-center gap-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                <span className="font-semibold">GitHub</span>
                <a
                  href="https://github.com/kranthi0003"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto text-xs text-accent hover:underline"
                >
                  @kranthi0003
                </a>
              </div>
              <div className="p-6 bg-card flex-1 flex flex-col justify-center">
                <GitHubStats />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
