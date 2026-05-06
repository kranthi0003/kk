import React, { useState, useEffect } from 'react'

// Fight Club OST Spotify playlist - plays as ambient background
export default function AmbientMusic() {
  const [playing, setPlaying] = useState(false)
  const [visible, setVisible] = useState(true)

  // Show prompt after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <>
      {/* Minimal floating player — bottom left above visitor count */}
      {!playing ? (
        <button
          onClick={() => setPlaying(true)}
          className="fixed bottom-20 left-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-600/90 text-white text-xs font-medium shadow-lg hover:bg-red-600 transition-all animate-fade-in-up backdrop-blur-sm border border-red-500/30"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>Play Ambient Music</span>
          <button onClick={(e) => { e.stopPropagation(); setVisible(false) }} className="ml-1 text-white/50 hover:text-white">✕</button>
        </button>
      ) : (
        <div className="fixed bottom-20 left-6 z-40 rounded-2xl overflow-hidden shadow-2xl border border-white/10 animate-fade-in-up"
          style={{ width: 280 }}>
          <iframe
            src="https://open.spotify.com/embed/playlist/37i9dQZF1DX4SBhb3fqCJd?utm_source=generator&theme=0"
            width="280"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Ambient Music"
            className="rounded-2xl"
          />
          <button
            onClick={() => setPlaying(false)}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white/60 hover:text-white text-[10px] flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}
