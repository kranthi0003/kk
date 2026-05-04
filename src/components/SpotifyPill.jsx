import React, { useState } from 'react'

export default function SpotifyPill() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-[calc(100vw-2rem)]">
      {/* Expanded player */}
      {open && (
        <div className="mb-3 animate-fade-in-up rounded-2xl overflow-hidden shadow-2xl shadow-black/20 border border-border/30">
          <iframe
            src="https://open.spotify.com/embed/playlist/37i9dQZF1DX0ieekvzt1Ic?utm_source=generator&theme=0"
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify"
            className="rounded-2xl max-w-[300px]"
          />
        </div>
      )}

      {/* Floating pill button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg border transition-all duration-300 hover-lift ${
          open
            ? 'bg-green-500 text-white border-green-400 shadow-green-500/25'
            : 'bg-card text-foreground border-border/30 hover:border-accent/30'
        }`}
      >
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24" style={open ? { color: 'white' } : {}}>
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
        <span className="text-xs font-medium">{open ? 'Now Playing' : 'Music'}</span>
        {!open && (
          <span className="flex items-end gap-[2px] h-3">
            <span className="w-[3px] bg-green-500 rounded-full animate-pulse" style={{ height: '8px', animationDelay: '0s' }} />
            <span className="w-[3px] bg-green-500 rounded-full animate-pulse" style={{ height: '12px', animationDelay: '0.15s' }} />
            <span className="w-[3px] bg-green-500 rounded-full animate-pulse" style={{ height: '6px', animationDelay: '0.3s' }} />
          </span>
        )}
      </button>
    </div>
  )
}
