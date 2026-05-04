import React, { useState, useEffect, useRef, useCallback } from 'react'

const Globe = React.lazy(() => import('react-globe.gl'))

const places = [
  { id: 'vizag', city: 'Visakhapatnam', label: 'Hometown 🏠', lat: 17.6868, lng: 83.2185, color: '#10b981', home: true, photos: [] },
  { id: 'hyderabad', city: 'Hyderabad', label: 'Worked here 🏰', lat: 17.385, lng: 78.4867, color: '#f59e0b', photos: [] },
  { id: 'bangalore', city: 'Bangalore', label: 'Garden City 🌳', lat: 12.9716, lng: 77.5946, color: '#3b82f6', photos: [] },
  { id: 'mumbai', city: 'Mumbai', label: 'City of dreams 🌊', lat: 19.076, lng: 72.8777, color: '#ef4444', photos: [] },
  { id: 'delhi', city: 'Delhi', label: 'Capital stories 🕌', lat: 28.6139, lng: 77.209, color: '#8b5cf6', photos: [] },
  { id: 'goa', city: 'Goa', label: 'Beach days 🏖️', lat: 15.2993, lng: 74.124, color: '#06b6d4', photos: [] },
  { id: 'chennai', city: 'Chennai', label: 'Temple & tech 🛕', lat: 13.0827, lng: 80.2707, color: '#ec4899', photos: [] },
  { id: 'kolkata', city: 'Kolkata', label: 'City of Joy 🌉', lat: 22.5726, lng: 88.3639, color: '#f97316', photos: [] },
  { id: 'lasvegas', city: 'Las Vegas', label: 'What happens in Vegas 🎰', lat: 36.1699, lng: -115.1398, color: '#eab308', photos: [] },
  { id: 'chicago', city: 'Chicago', label: 'The Windy City 🌬️', lat: 41.8781, lng: -87.6298, color: '#14b8a6', photos: [] },
]

const arcs = [
  { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 1, to: 4 },
  { from: 0, to: 7 }, { from: 2, to: 5 }, { from: 2, to: 6 }, { from: 3, to: 4 },
  { from: 4, to: 7 }, { from: 0, to: 6 }, { from: 4, to: 8 }, { from: 4, to: 9 }, { from: 8, to: 9 },
]

const arcData = arcs.map(a => ({
  startLat: places[a.from].lat, startLng: places[a.from].lng,
  endLat: places[a.to].lat, endLng: places[a.to].lng,
  color: [places[a.from].color, places[a.to].color],
}))

export default function TravelMap() {
  const globeRef = useRef()
  const containerRef = useRef()
  const [selected, setSelected] = useState(null)
  const [globeSize, setGlobeSize] = useState(500)
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'))

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.offsetWidth
        setGlobeSize(Math.min(w, 560))
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: 20, lng: 78, altitude: 2.2 }, 0)
      const controls = globeRef.current.controls()
      if (controls) {
        controls.autoRotate = true
        controls.autoRotateSpeed = 0.5
        controls.enableZoom = true
      }
    }
  }, [])

  const handlePointClick = useCallback((point) => {
    const place = places.find(p => p.lat === point.lat && p.lng === point.lng)
    setSelected(place || null)
    if (globeRef.current) {
      globeRef.current.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.8 }, 800)
    }
  }, [])

  return (
    <section id="travel" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-center mb-3">
          Places I've Been{' '}
          <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">✈️</span>
        </h2>
        <p className="text-center text-muted-foreground mb-10 max-w-lg mx-auto text-sm">
          Drag & spin the globe — click a dot to explore
        </p>

        <div className="grid lg:grid-cols-[1fr_240px] gap-6 items-start">
          {/* Globe */}
          <div ref={containerRef} className="flex justify-center rounded-2xl overflow-hidden">
            <React.Suspense fallback={
              <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                <p className="font-mono text-sm animate-pulse">Loading globe...</p>
              </div>
            }>
              <Globe
                ref={globeRef}
                width={globeSize}
                height={globeSize}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl={isDark
                  ? '//unpkg.com/three-globe/example/img/earth-night.jpg'
                  : '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
                }
                atmosphereColor={isDark ? '#60a5fa' : '#2563eb'}
                atmosphereAltitude={0.2}
                pointsData={places}
                pointLat="lat"
                pointLng="lng"
                pointColor="color"
                pointAltitude={0.04}
                pointRadius={0.5}
                pointLabel={d => `<div style="font-family:system-ui;background:rgba(0,0,0,0.8);color:white;padding:6px 12px;border-radius:8px;font-size:13px;text-align:center"><b>${d.city}</b><br/><span style="opacity:0.7;font-size:11px">${d.label}</span></div>`}
                onPointClick={handlePointClick}
                arcsData={arcData}
                arcColor="color"
                arcStroke={0.5}
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashAnimateTime={3000}
                arcAltitudeAutoScale={0.3}
                ringsData={places.filter(p => p.home)}
                ringLat="lat"
                ringLng="lng"
                ringColor={() => '#10b981'}
                ringMaxRadius={3}
                ringPropagationSpeed={2}
                ringRepeatPeriod={1500}
              />
            </React.Suspense>
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
                    onClick={() => {
                      setSelected(place)
                      if (globeRef.current) {
                        globeRef.current.pointOfView({ lat: place.lat, lng: place.lng, altitude: 1.8 }, 800)
                      }
                    }}
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
