import React, { useState, memo } from 'react'
import { ComposableMap, Geographies, Geography, Marker, Line } from 'react-simple-maps'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const places = [
  { id: 'vizag', city: 'Visakhapatnam', label: 'Hometown 🏠', coords: [83.2185, 17.6868], color: '#10b981', home: true, photos: [] },
  { id: 'hyderabad', city: 'Hyderabad', label: 'Worked here 🏰', coords: [78.4867, 17.385], color: '#f59e0b', photos: [] },
  { id: 'bangalore', city: 'Bangalore', label: 'Garden City 🌳', coords: [77.5946, 12.9716], color: '#3b82f6', photos: [] },
  { id: 'mumbai', city: 'Mumbai', label: 'City of dreams 🌊', coords: [72.8777, 19.076], color: '#ef4444', photos: [] },
  { id: 'delhi', city: 'Delhi', label: 'Capital stories 🕌', coords: [77.209, 28.6139], color: '#8b5cf6', photos: [] },
  { id: 'goa', city: 'Goa', label: 'Beach days 🏖️', coords: [74.124, 15.2993], color: '#06b6d4', photos: [] },
  { id: 'chennai', city: 'Chennai', label: 'Temple & tech 🛕', coords: [80.2707, 13.0827], color: '#ec4899', photos: [] },
  { id: 'kolkata', city: 'Kolkata', label: 'City of Joy 🌉', coords: [88.3639, 22.5726], color: '#f97316', photos: [] },
  { id: 'lasvegas', city: 'Las Vegas', label: 'What happens in Vegas 🎰', coords: [-115.1398, 36.1699], color: '#eab308', photos: [] },
  { id: 'chicago', city: 'Chicago', label: 'The Windy City 🌬️', coords: [-87.6298, 41.8781], color: '#14b8a6', photos: [] },
]

const connections = [
  [0, 1], [1, 2], [1, 3], [1, 4], [0, 7], [2, 5], [2, 6], [3, 4], [4, 7], [0, 6],
  [4, 8], [4, 9], [8, 9],
]

const MapChart = memo(({ onSelect, selected, hovered, onHover }) => (
  <ComposableMap
    projection="geoEqualEarth"
    projectionConfig={{ center: [0, 25], scale: 180 }}
    width={900}
    height={450}
    style={{ width: '100%', height: 'auto' }}
  >
    <Geographies geography={GEO_URL}>
      {({ geographies }) =>
        geographies.map((geo) => (
          <Geography
            key={geo.rsmKey}
            geography={geo}
            fill="var(--color-muted)"
            stroke="var(--color-border)"
            strokeWidth={0.5}
            style={{
              default: { outline: 'none' },
              hover: { outline: 'none', fill: 'var(--color-muted)' },
              pressed: { outline: 'none' },
            }}
          />
        ))
      }
    </Geographies>

    {/* Connection lines */}
    {connections.map(([a, b], i) => (
      <Line
        key={i}
        from={places[a].coords}
        to={places[b].coords}
        stroke="var(--color-accent)"
        strokeWidth={1}
        strokeOpacity={0.2}
        strokeLinecap="round"
      />
    ))}

    {/* City markers */}
    {places.map((place) => {
      const isActive = selected?.id === place.id
      const isHover = hovered === place.id
      return (
        <Marker
          key={place.id}
          coordinates={place.coords}
          onClick={() => onSelect(isActive ? null : place)}
          onMouseEnter={() => onHover(place.id)}
          onMouseLeave={() => onHover(null)}
          style={{ cursor: 'pointer' }}
        >
          {/* Glow */}
          {(isActive || isHover) && (
            <circle r={12} fill={place.color} opacity={0.15} />
          )}
          {/* Pulse for home */}
          {place.home && (
            <>
              <circle r={8} fill="none" stroke={place.color} strokeWidth={1} opacity={0.3}>
                <animate attributeName="r" from="6" to="16" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
              </circle>
            </>
          )}
          {/* Dot */}
          <circle
            r={isActive ? 6 : isHover ? 5 : 4}
            fill={place.color}
            stroke="var(--color-background)"
            strokeWidth={2}
          />
          {/* Label */}
          {(isActive || isHover) && (
            <text
              textAnchor="middle"
              y={-12}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                fill: 'var(--color-foreground)',
                fontWeight: 600,
              }}
            >
              {place.city}
            </text>
          )}
        </Marker>
      )
    })}
  </ComposableMap>
))

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
          My journey across India — click a dot to explore
        </p>

        <div className="grid lg:grid-cols-[1fr_240px] gap-6 items-start">
          {/* Map */}
          <div className="rounded-2xl border border-border/30 shadow-xl bg-card overflow-hidden">
            <MapChart
              selected={selected}
              hovered={hovered}
              onSelect={setSelected}
              onHover={setHovered}
            />
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-2">
            {selected ? (
              <div className="rounded-2xl border border-border/30 bg-card p-5 shadow-lg animate-fade-in-up">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selected.color }} />
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
                <button onClick={() => setSelected(null)} className="mt-3 text-xs text-accent hover:underline font-mono">← back</button>
              </div>
            ) : (
              <>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest px-1">
                  {places.length} locations
                </p>
                {places.map(place => (
                  <button
                    key={place.id}
                    onClick={() => setSelected(place)}
                    onMouseEnter={() => setHovered(place.id)}
                    onMouseLeave={() => setHovered(null)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all bg-card hover:bg-muted border border-transparent hover:border-border/30"
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: place.color }} />
                    <div className="min-w-0">
                      <p className="font-medium text-xs text-foreground truncate">{place.city}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{place.label}</p>
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
