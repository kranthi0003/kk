import React from 'react'
import satellite from '../../assets/satellite-collage.png'

export default function SatelliteBanner() {
  return (
    <div className="relative w-full overflow-hidden my-8 sm:my-12 group cursor-default">
      {/* Gradient fade edges */}
      <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-background to-transparent z-10" />

      {/* Top/bottom vignette */}
      <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-background to-transparent z-10" />
      <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-background to-transparent z-10" />

      {/* Satellite strip */}
      <div className="relative h-24 sm:h-36 md:h-44 overflow-hidden rounded-xl mx-4 sm:mx-8">
        <img
          src={satellite}
          alt="Satellite imagery of Earth"
          className="w-full h-full object-cover object-center transition-transform duration-[3s] ease-out group-hover:scale-110"
          loading="lazy"
        />
        {/* Subtle color overlay */}
        <div className="absolute inset-0 bg-accent/5 mix-blend-overlay" />
      </div>

      {/* Caption */}
      <p className="text-center text-[10px] sm:text-xs text-muted-foreground/50 mt-2 font-mono tracking-wider uppercase">
        🛰 Earth from above
      </p>
    </div>
  )
}
