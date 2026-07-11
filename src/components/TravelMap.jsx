import React, { useState, useMemo, useRef, Suspense } from 'react'
import indiaGeo from '../lib/india-states.json'
import { INDIA_PLACES, ABROAD_PLACES, HOME, CATEGORY_STYLE } from '../lib/travelPlaces'

const AbroadGlobe = React.lazy(() => import('./AbroadGlobe'))

// ── Mercator projection fitted to India's bounding box ───────────────────────
const VIEW_W = 460, VIEW_H = 520, PAD = 18
const B = { lngMin: 67.5, lngMax: 98.0, latMin: 6.5, latMax: 37.6 }
const mx = (lng) => (lng * Math.PI) / 180
const my = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI / 180) / 2))
const RX0 = mx(B.lngMin), RX1 = mx(B.lngMax), RY0 = my(B.latMin), RY1 = my(B.latMax)
const BW = RX1 - RX0, BH = RY1 - RY0
const SCALE = Math.min((VIEW_W - 2 * PAD) / BW, (VIEW_H - 2 * PAD) / BH)
const OFFX = (VIEW_W - SCALE * BW) / 2, OFFY = (VIEW_H - SCALE * BH) / 2
function project(lng, lat) {
  return [OFFX + (mx(lng) - RX0) * SCALE, OFFY + (RY1 - my(lat)) * SCALE]
}
function geomToPath(geom) {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates
  let d = ''
  for (const poly of polys) {
    for (const ring of poly) {
      ring.forEach((c, i) => {
        const [x, y] = project(c[0], c[1])
        d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)
      })
      d += 'Z'
    }
  }
  return d
}

const GROUPS = [
  { key: 'home',        icon: '⌂', label: 'Home' },
  { key: 'destination', icon: '◎', label: 'Destinations' },
  { key: 'temple',      icon: '☖', label: 'Temples & Pilgrimage' },
]

export default function TravelMap() {
  const [active, setActive] = useState(null) // place id (hover)
  const [pinned, setPinned] = useState(null) // clicked place id
  const svgRef = useRef(null)

  const statePaths = useMemo(
    () => indiaGeo.features.map((f) => ({ name: f.properties.st_nm, d: geomToPath(f.geometry) })),
    []
  )
  const projected = useMemo(
    () => INDIA_PLACES.map((p) => ({ ...p, xy: project(p.lng, p.lat) })),
    []
  )
  const byGroup = useMemo(() => {
    const g = { home: [], destination: [], temple: [] }
    INDIA_PLACES.forEach((p) => { (g[p.category] || g.destination).push(p) })
    return g
  }, [])

  const current = active || pinned
  const currentPlace = projected.find((p) => p.id === current)

  const counts = {
    total: INDIA_PLACES.length,
    states: new Set(INDIA_PLACES.map((p) => p.region.split('·')[0].split(',').pop().trim())).size,
    abroad: ABROAD_PLACES.length,
  }

  const select = (id) => setPinned((prev) => (prev === id ? null : id))

  return (
    <section id="travel" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-center mb-3">
          Places I've Been{' '}
          <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">✈️</span>
        </h2>
        <p className="text-center text-muted-foreground mb-10 max-w-lg mx-auto text-sm">
          A map of where I've wandered — cities, temples, and a few trips that needed a passport.
        </p>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ── India map ── */}
          <div className="w-full lg:flex-1 relative">
            <div
              className="relative rounded-2xl overflow-hidden"
              style={{
                background: 'radial-gradient(120% 90% at 60% 40%, color-mix(in oklab, var(--color-brand) 8%, transparent), transparent 60%), color-mix(in oklab, var(--color-card) 70%, #0c0a09)',
                border: '1px solid color-mix(in oklab, var(--color-border) 45%, transparent)',
              }}
            >
              <svg
                ref={svgRef}
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                className="w-full h-auto block"
                style={{ maxHeight: 560 }}
                onMouseLeave={() => setActive(null)}
              >
                <defs>
                  <filter id="tm-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2.4" result="b" />
                    <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>

                {/* States */}
                <g>
                  {statePaths.map((s) => (
                    <path
                      key={s.name}
                      d={s.d}
                      fill="color-mix(in oklab, #1c1917 88%, var(--color-brand))"
                      stroke="color-mix(in oklab, var(--color-brand) 32%, transparent)"
                      strokeWidth="0.6"
                      strokeLinejoin="round"
                    />
                  ))}
                </g>

                {/* Pins */}
                <g>
                  {projected.map((p) => {
                    const st = CATEGORY_STYLE[p.category] || CATEGORY_STYLE.destination
                    const [x, y] = p.xy
                    const isCur = current === p.id
                    const r = p.category === 'home' ? 4.4 : 3.1
                    return (
                      <g
                        key={p.id}
                        transform={`translate(${x} ${y})`}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setActive(p.id)}
                        onClick={() => select(p.id)}
                      >
                        {p.category === 'home' && (
                          <circle r="4" fill="none" stroke={st.fill} strokeWidth="1.2" opacity="0.7">
                            <animate attributeName="r" from="4" to="12" dur="1.8s" repeatCount="indefinite" />
                            <animate attributeName="opacity" from="0.7" to="0" dur="1.8s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <circle
                          r={isCur ? r + 1.8 : r}
                          fill={st.fill}
                          stroke="#0c0a09"
                          strokeWidth="0.8"
                          filter={isCur ? 'url(#tm-glow)' : undefined}
                          style={{ transition: 'r .12s ease' }}
                        />
                      </g>
                    )
                  })}

                  {/* Active label */}
                  {currentPlace && (() => {
                    const [x, y] = currentPlace.xy
                    const w = Math.max(currentPlace.name.length * 5.4 + 14, 40)
                    const left = x + w + 8 > VIEW_W
                    const bx = left ? x - w - 8 : x + 8
                    return (
                      <g pointerEvents="none" transform={`translate(${bx} ${y - 9})`}>
                        <rect width={w} height="18" rx="5"
                          fill="rgba(12,10,9,0.92)" stroke="color-mix(in oklab, var(--color-brand) 40%, transparent)" strokeWidth="0.6" />
                        <text x={w / 2} y="12.5" textAnchor="middle" fontSize="9.5"
                          fill="#f5e9d6" style={{ fontFamily: 'system-ui' }}>{currentPlace.name}</text>
                      </g>
                    )
                  })()}
                </g>
              </svg>

              {/* Legend */}
              <div className="absolute bottom-3 left-3 flex flex-wrap gap-x-3 gap-y-1 px-3 py-2 rounded-xl text-[10px] font-mono pointer-events-none"
                style={{ background: 'color-mix(in srgb, #0c0a09 72%, transparent)', backdropFilter: 'blur(6px)', border: '1px solid color-mix(in oklab, var(--color-border) 35%, transparent)' }}>
                {GROUPS.map((g) => (
                  <span key={g.key} className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_STYLE[g.key].fill }} />
                    {g.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="w-full lg:w-[300px] flex-shrink-0">
            <div className="bg-card p-4 pr-tint-violet rounded-2xl">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {counts.total} places • {counts.states} states • {counts.abroad} abroad
              </p>

              <div className="max-h-[460px] overflow-y-auto pr-1 space-y-5">
                {GROUPS.map((g) => (
                  <div key={g.key}>
                    <p className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.18em] mb-2"
                      style={{ color: CATEGORY_STYLE[g.key].fill }}>
                      <span>{g.icon}</span> {g.label}
                      <span className="text-muted-foreground/50 normal-case tracking-normal">· {byGroup[g.key].length}</span>
                    </p>
                    <div className="space-y-0.5">
                      {byGroup[g.key].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => select(p.id)}
                          onMouseEnter={() => setActive(p.id)}
                          onMouseLeave={() => setActive(null)}
                          className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors ${
                            current === p.id ? 'bg-accent/10' : 'hover:bg-muted/40'
                          }`}
                        >
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_STYLE[g.key].fill }} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-xs text-foreground truncate leading-tight">{p.name}</span>
                            <span className="block text-[10px] text-muted-foreground truncate">{p.region}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Abroad globe ── */}
        <div className="mt-8">
          <p className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] mb-3" style={{ color: 'var(--color-brand)' }}>
            <span>🌐</span> Abroad
          </p>
          <Suspense fallback={
            <div className="h-[320px] rounded-2xl flex items-center justify-center text-muted-foreground text-sm font-mono animate-pulse"
              style={{ border: '1px solid color-mix(in oklab, var(--color-border) 40%, transparent)' }}>
              🌍 loading globe…
            </div>
          }>
            <AbroadGlobe places={ABROAD_PLACES} home={HOME} />
          </Suspense>
        </div>
      </div>
    </section>
  )
}
