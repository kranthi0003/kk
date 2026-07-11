import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import Globe from 'react-globe.gl'
import { MeshPhongMaterial } from 'three'
import landGeo from '../lib/world-land.json'

// Abroad globe — dark amber-themed globe with solid continents, matching the
// site. Shows Home + the international trips; drag to spin, click a pin to read.
export default function AbroadGlobe({ places, home }) {
  const globeRef = useRef(null)
  const wrapRef = useRef(null)
  const [size, setSize] = useState({ w: 640, h: 360 })
  const [selected, setSelected] = useState(places[0] || null)

  const points = useMemo(() => ([
    { ...home, kind: 'home' },
    ...places.map((p) => ({ ...p, kind: 'abroad' })),
  ]), [places, home])

  const globeMaterial = useMemo(
    () => new MeshPhongMaterial({ color: '#0f1522', emissive: '#0a0f1a', emissiveIntensity: 0.35, shininess: 5 }),
    []
  )
  const landPolygons = useMemo(() => landGeo.features, [])

  useEffect(() => {
    const update = () => {
      if (!wrapRef.current) return
      const w = wrapRef.current.offsetWidth
      setSize({ w, h: Math.min(Math.max(w * 0.42, 300), 420) })
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    const g = globeRef.current
    if (!g) return
    const focus = selected || home
    g.pointOfView({ lat: focus.lat, lng: focus.lng, altitude: 2.2 }, 0)
    const c = g.controls()
    if (c) { c.autoRotate = true; c.autoRotateSpeed = 0.5; c.enableZoom = false }
  }, [])

  const handleClick = useCallback((pt) => {
    setSelected(pt)
    const g = globeRef.current
    if (g) g.pointOfView({ lat: pt.lat, lng: pt.lng, altitude: 2.0 }, 900)
  }, [])

  return (
    <div
      ref={wrapRef}
      className="relative rounded-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center"
      style={{
        border: '1px solid color-mix(in oklab, var(--color-brand) 22%, transparent)',
        background: 'radial-gradient(90% 90% at 30% 40%, color-mix(in oklab, var(--color-brand) 8%, transparent), transparent 55%), #0b1020',
      }}
    >
      {/* Globe */}
      <div className="relative flex justify-center items-center py-4">
        <Globe
          ref={globeRef}
          width={Math.min(size.w, 520)}
          height={size.h}
          backgroundColor="rgba(0,0,0,0)"
          globeMaterial={globeMaterial}
          showAtmosphere
          atmosphereColor="#58a6ff"
          atmosphereAltitude={0.17}
          showGraticules
          polygonsData={landPolygons}
          polygonCapColor={() => 'rgba(88,166,255,0.13)'}
          polygonSideColor={() => 'rgba(88,166,255,0.05)'}
          polygonStrokeColor={() => 'rgba(88,166,255,0.55)'}
          polygonAltitude={0.006}
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointColor={(d) => (d.kind === 'home' ? '#93c5fd' : '#3b82f6')}
          pointAltitude={0.03}
          pointRadius={0.5}
          pointLabel={(d) => `<div style="font-family:system-ui;background:rgba(12,10,9,0.9);color:#f5e9d6;padding:5px 10px;border-radius:8px;font-size:12px;border:1px solid rgba(88,166,255,0.35)"><b>${d.name}</b></div>`}
          onPointClick={handleClick}
          labelsData={points}
          labelLat="lat"
          labelLng="lng"
          labelText={(d) => (d.kind === 'home' ? 'Home' : d.name)}
          labelColor={() => 'rgba(245,233,214,0.9)'}
          labelSize={1.15}
          labelDotRadius={0}
          labelResolution={2}
        />
      </div>

      {/* Detail panel */}
      <div className="px-6 py-6 md:py-8">
        {selected ? (
          <div className="animate-fade-in-up">
            <h3 className="font-heading font-bold text-2xl sm:text-3xl mb-2">{selected.name}</h3>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] mb-4" style={{ color: 'var(--color-brand)' }}>
              {selected.country ? selected.country : 'Home base'}
            </p>
            <p className="text-muted-foreground text-sm leading-relaxed">{selected.region}</p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Click a pin to explore.</p>
        )}
        <p className="mt-6 font-mono text-[11px] text-muted-foreground/60">Drag to spin the globe</p>
      </div>
    </div>
  )
}
