import React, { useState } from 'react'

// Approximate positions on a 500x600 canvas (India outline)
const places = [
  { id: 'vizag', city: 'Visakhapatnam', label: 'Hometown 🏠', x: 330, y: 345, color: '#10b981', home: true, photos: [] },
  { id: 'hyderabad', city: 'Hyderabad', label: 'Worked here 🏰', x: 280, y: 340, color: '#f59e0b', photos: [] },
  { id: 'bangalore', city: 'Bangalore', label: 'Garden City 🌳', x: 255, y: 430, color: '#3b82f6', photos: [] },
  { id: 'mumbai', city: 'Mumbai', label: 'City of dreams 🌊', x: 170, y: 310, color: '#ef4444', photos: [] },
  { id: 'delhi', city: 'Delhi', label: 'Capital stories 🕌', x: 250, y: 150, color: '#8b5cf6', photos: [] },
  { id: 'goa', city: 'Goa', label: 'Beach days 🏖️', x: 190, y: 385, color: '#06b6d4', photos: [] },
  { id: 'chennai', city: 'Chennai', label: 'Temple & tech 🛕', x: 290, y: 440, color: '#ec4899', photos: [] },
  { id: 'kolkata', city: 'Kolkata', label: 'City of Joy 🌉', x: 380, y: 245, color: '#f97316', photos: [] },
]

// Network connections (indexes into places array)
const connections = [
  [0, 1], // vizag-hyd
  [1, 2], // hyd-blr
  [1, 3], // hyd-mum
  [1, 4], // hyd-delhi
  [0, 7], // vizag-kolkata
  [2, 5], // blr-goa
  [2, 6], // blr-chennai
  [3, 4], // mum-delhi
  [4, 7], // delhi-kolkata
  [0, 6], // vizag-chennai
]

export default function TravelMap() {
  const [selected, setSelected] = useState(null)
  const [hovered, setHovered] = useState(null)

  return (
    <section id="travel" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-center mb-3">
          Places I've Been{' '}
          <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">✈️</span>
        </h2>
        <p className="text-center text-muted-foreground mb-10 max-w-lg mx-auto text-sm">
          My journey across India — click a pin to explore
        </p>

        <div className="grid lg:grid-cols-[1fr_260px] gap-6 items-start">
          {/* SVG Map */}
          <div className="relative rounded-2xl border border-border/30 shadow-xl bg-card overflow-hidden p-4">
            <svg viewBox="0 0 500 600" className="w-full h-auto" style={{ maxHeight: '520px' }}>
              {/* Animated connection lines */}
              {connections.map(([a, b], i) => (
                <g key={i}>
                  <line
                    x1={places[a].x} y1={places[a].y}
                    x2={places[b].x} y2={places[b].y}
                    stroke="var(--color-accent)"
                    strokeOpacity={0.15}
                    strokeWidth={1}
                  />
                  {/* Animated traveling dot */}
                  <circle r="2" fill="var(--color-accent)" opacity="0.6">
                    <animateMotion
                      dur={`${3 + i * 0.5}s`}
                      repeatCount="indefinite"
                      path={`M${places[a].x},${places[a].y} L${places[b].x},${places[b].y}`}
                    />
                  </circle>
                </g>
              ))}

              {/* City pins */}
              {places.map((place) => {
                const isActive = selected?.id === place.id
                const isHover = hovered === place.id

                return (
                  <g
                    key={place.id}
                    onClick={() => setSelected(isActive ? null : place)}
                    onMouseEnter={() => setHovered(place.id)}
                    onMouseLeave={() => setHovered(null)}
                    className="cursor-pointer"
                  >
                    {/* Glow ring */}
                    <circle
                      cx={place.x} cy={place.y} r={isActive ? 18 : isHover ? 14 : 0}
                      fill={place.color}
                      opacity={0.1}
                      className="transition-all duration-300"
                    />
                    {/* Pulse ring for home */}
                    {place.home && (
                      <circle cx={place.x} cy={place.y} r="12" fill="none" stroke={place.color} strokeWidth="1" opacity="0.3">
                        <animate attributeName="r" from="8" to="20" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {/* Main dot */}
                    <circle
                      cx={place.x} cy={place.y}
                      r={isActive ? 7 : isHover ? 6 : 5}
                      fill={place.color}
                      stroke="var(--color-background)"
                      strokeWidth="2"
                      className="transition-all duration-200"
                    />
                    {/* City label */}
                    <text
                      x={place.x}
                      y={place.y - 14}
                      textAnchor="middle"
                      className="fill-foreground text-[10px] font-medium"
                      style={{ fontFamily: 'var(--font-body)' }}
                      opacity={isActive || isHover ? 1 : 0.6}
                    >
                      {place.city}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Sidebar: Location list + selected detail */}
          <div className="flex flex-col gap-3">
            {selected ? (
              <div className="rounded-2xl border border-border/30 bg-card p-5 shadow-lg animate-fade-in-up">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: selected.color }} />
                  <h3 className="font-heading font-bold text-lg">{selected.city}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{selected.label}</p>
                {selected.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {selected.photos.map((photo, i) => (
                      <img key={i} src={photo} alt="" className="w-full h-24 object-cover rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <p className="text-2xl mb-1">📸</p>
                    <p className="text-xs text-muted-foreground">Photos coming soon!</p>
                  </div>
                )}
                <button onClick={() => setSelected(null)} className="mt-3 text-xs text-accent hover:underline font-mono">← back to list</button>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest px-1">
                  {places.length} locations
                </p>
                {places.map(place => (
                  <button
                    key={place.id}
                    onClick={() => setSelected(place)}
                    onMouseEnter={() => setHovered(place.id)}
                    onMouseLeave={() => setHovered(null)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all bg-card hover:bg-muted border border-transparent hover:border-border/30"
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: place.color }} />
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{place.city}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{place.label}</p>
                    </div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
