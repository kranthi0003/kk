import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { PLACES, STATUS_STYLE } from '../lib/travelPlaces'

const TILES = {
  dark: 'https://{s}.basemap.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemap.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

function pinHtml(place, active) {
  const s = STATUS_STYLE[place.status] || STATUS_STYLE.visited
  const size = place.home ? 17 : 13
  const cls = ['tm-pin']
  if (place.home) cls.push('tm-pin--home')
  if (place.status === 'wishlist') cls.push('tm-pin--wishlist')
  if (active) cls.push('tm-pin--active')
  return `<span class="${cls.join(' ')}" style="--fill:${s.fill};--ring:${s.ring};width:${size}px;height:${size}px"></span>`
}
function makeIcon(place, active) {
  const size = place.home ? 17 : 13
  return L.divIcon({
    className: 'tm-pin-wrap',
    html: pinHtml(place, active),
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export default function TravelMap() {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const tileRef = useRef(null)
  const markersRef = useRef({}) // id -> marker
  const layersRef = useRef({}) // status -> LayerGroup

  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')
  const [isDark, setIsDark] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  const counts = useMemo(() => {
    const visited = PLACES.filter(p => p.status === 'visited').length
    const wishlist = PLACES.filter(p => p.status === 'wishlist').length
    const countries = new Set(PLACES.map(p => p.country).filter(Boolean)).size
    return { visited, wishlist, countries, total: PLACES.length }
  }, [])

  const visiblePlaces = useMemo(
    () => (filter === 'all' ? PLACES : PLACES.filter(p => p.status === filter)),
    [filter]
  )

  // Track dark-mode toggling to swap tiles
  useEffect(() => {
    const el = document.documentElement
    const obs = new MutationObserver(() => setIsDark(el.classList.contains('dark')))
    obs.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const focus = useCallback((place) => {
    setSelected(place)
    if (mapRef.current) mapRef.current.flyTo([place.lat, place.lng], 6, { duration: 0.9 })
  }, [])

  // Init map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    const map = L.map(containerRef.current, {
      center: [22, 20],
      zoom: 2,
      minZoom: 2,
      worldCopyJump: true,
      scrollWheelZoom: false,
      attributionControl: true,
      zoomControl: true,
    })
    mapRef.current = map

    tileRef.current = L.tileLayer(isDark ? TILES.dark : TILES.light, {
      attribution: ATTRIBUTION,
      subdomains: 'abcd',
      maxZoom: 19,
      detectRetina: true,
    }).addTo(map)

    const groups = { visited: L.layerGroup(), wishlist: L.layerGroup() }
    PLACES.forEach((place) => {
      const marker = L.marker([place.lat, place.lng], {
        icon: makeIcon(place, false),
        riseOnHover: true,
        keyboard: false,
      })
      marker.bindTooltip(
        `<b>${place.city}</b><span>${place.label}</span>`,
        { className: 'tm-tip', direction: 'top', offset: [0, -8], opacity: 1 }
      )
      marker.on('click', () => focus(place))
      markersRef.current[place.id] = marker
      ;(groups[place.status] || groups.visited).addLayer(marker)
    })
    layersRef.current = groups
    groups.visited.addTo(map)
    groups.wishlist.addTo(map)

    const pts = PLACES.map(p => [p.lat, p.lng])
    if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 5 })
    setTimeout(() => map.invalidateSize(), 250)

    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current = {}
      layersRef.current = {}
    }
  }, [focus]) // isDark handled in its own effect

  // Swap tiles on theme change
  useEffect(() => {
    if (tileRef.current) tileRef.current.setUrl(isDark ? TILES.dark : TILES.light)
  }, [isDark])

  // Apply filter to layer visibility
  useEffect(() => {
    const map = mapRef.current
    const groups = layersRef.current
    if (!map || !groups.visited) return
    ;['visited', 'wishlist'].forEach((status) => {
      const show = filter === 'all' || filter === status
      const g = groups[status]
      if (show && !map.hasLayer(g)) g.addTo(map)
      if (!show && map.hasLayer(g)) map.removeLayer(g)
    })
  }, [filter])

  // Reflect selection as an enlarged/active pin
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const place = PLACES.find(p => p.id === id)
      if (place) marker.setIcon(makeIcon(place, selected?.id === id))
    })
  }, [selected])

  const FilterBtn = ({ id, children }) => (
    <button
      onClick={() => setFilter(id)}
      className={`px-3 py-1 rounded-full text-[11px] font-mono transition-all ${
        filter === id ? 'bg-accent/15 text-foreground' : 'text-muted-foreground hover:bg-muted/50'
      }`}
      style={filter === id ? { boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 40%, transparent)' } : undefined}
    >
      {children}
    </button>
  )

  return (
    <section id="travel" className="py-20 px-6">
      <style>{`
        .tm-pin{display:block;border-radius:9999px;background:var(--fill);
          box-shadow:0 0 0 2px color-mix(in srgb, var(--fill) 30%, transparent),0 1px 4px rgba(0,0,0,.45);
          transition:transform .15s ease}
        .tm-pin--wishlist{background:transparent;border:2px solid var(--fill);
          box-shadow:0 0 8px color-mix(in srgb, var(--fill) 55%, transparent)}
        .tm-pin--active{transform:scale(1.45);box-shadow:0 0 0 3px color-mix(in srgb, var(--ring) 55%, transparent),0 2px 8px rgba(0,0,0,.5)}
        .tm-pin-wrap:hover .tm-pin{transform:scale(1.3)}
        .tm-pin--home::after{content:'';position:absolute;left:50%;top:50%;width:100%;height:100%;
          border-radius:9999px;transform:translate(-50%,-50%);border:2px solid var(--fill);
          animation:tm-pulse 1.8s ease-out infinite}
        @keyframes tm-pulse{0%{width:100%;height:100%;opacity:.7}100%{width:420%;height:420%;opacity:0}}
        .tm-tip{background:rgba(15,17,22,.92)!important;color:#fff!important;border:1px solid rgba(255,255,255,.12)!important;
          border-radius:10px!important;padding:6px 11px!important;backdrop-filter:blur(8px);box-shadow:0 6px 20px rgba(0,0,0,.4)!important;
          font-family:system-ui!important;text-align:center;line-height:1.3}
        .tm-tip b{display:block;font-size:12.5px}
        .tm-tip span{display:block;font-size:10.5px;opacity:.65;margin-top:1px}
        .tm-tip::before{border-top-color:rgba(15,17,22,.92)!important}
        .leaflet-container{background:transparent;font-family:inherit}
        .leaflet-control-zoom a{background:rgba(20,22,28,.85)!important;color:#e6e6e6!important;border:none!important;
          backdrop-filter:blur(6px)}
        .leaflet-control-zoom a:hover{background:rgba(40,44,54,.95)!important}
        .leaflet-control-attribution{background:rgba(0,0,0,.35)!important;color:#9aa0a6!important;font-size:9px!important}
        .leaflet-control-attribution a{color:#c9ad72!important}
        html:not(.dark) .tm-tip{background:rgba(255,255,255,.95)!important;color:#1a1a1a!important;border-color:rgba(0,0,0,.08)!important}
        html:not(.dark) .tm-tip span{opacity:.55}
        html:not(.dark) .tm-tip::before{border-top-color:rgba(255,255,255,.95)!important}
        html:not(.dark) .leaflet-control-zoom a{background:rgba(255,255,255,.9)!important;color:#333!important}
      `}</style>

      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-center mb-3">
          Places I've Been{' '}
          <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">✈️</span>
        </h2>
        <p className="text-center text-muted-foreground mb-10 max-w-lg mx-auto text-sm">
          Drag & explore the map — click a pin to see the story
        </p>

        <div className="flex flex-col lg:flex-row gap-6 items-stretch">
          {/* Map */}
          <div className="flex-1 relative">
            <div
              ref={containerRef}
              className="w-full h-[380px] sm:h-[520px] rounded-2xl overflow-hidden border border-border/40 relative z-0"
              style={{ borderColor: 'color-mix(in oklab, var(--color-border) 45%, transparent)' }}
            />
            {/* Legend */}
            <div className="absolute bottom-3 left-3 z-[400] flex gap-3 px-3 py-2 rounded-xl text-[11px] font-mono pointer-events-none"
              style={{ background: 'color-mix(in srgb, var(--color-card) 82%, transparent)', backdropFilter: 'blur(8px)', border: '1px solid color-mix(in oklab, var(--color-border) 40%, transparent)' }}>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_STYLE.visited.fill }} />
                Visited
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full border-2" style={{ borderColor: STATUS_STYLE.wishlist.fill }} />
                Want to go
              </span>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-[260px] flex flex-col gap-2 flex-shrink-0">
            <div className="bg-card p-4 pr-tint-violet">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {counts.total} locations • {counts.countries} countries
              </p>

              <div className="flex gap-1 mb-3">
                <FilterBtn id="all">All</FilterBtn>
                <FilterBtn id="visited">Visited {counts.visited}</FilterBtn>
                <FilterBtn id="wishlist">Wishlist {counts.wishlist}</FilterBtn>
              </div>

              {selected ? (
                <div className="animate-fade-in-up">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: (STATUS_STYLE[selected.status] || STATUS_STYLE.visited).fill }} />
                    <h3 className="font-heading font-bold text-base">{selected.city}</h3>
                  </div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">
                    {(STATUS_STYLE[selected.status] || STATUS_STYLE.visited).label} · {selected.country}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">{selected.label}</p>
                  <div className="bg-muted/50 rounded-xl p-4 text-center border border-border/20">
                    <p className="text-2xl mb-1">📸</p>
                    <p className="text-xs text-muted-foreground">Photos coming soon!</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="mt-3 text-xs text-accent hover:underline font-mono">← all locations</button>
                </div>
              ) : (
                <div className="space-y-1 max-h-[220px] sm:max-h-[420px] overflow-y-auto">
                  {visiblePlaces.length === 0 && (
                    <p className="text-xs text-muted-foreground py-6 text-center">No places here yet.</p>
                  )}
                  {visiblePlaces.map(place => {
                    const s = STATUS_STYLE[place.status] || STATUS_STYLE.visited
                    return (
                      <button
                        key={place.id}
                        onClick={() => focus(place)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all hover:bg-muted/50 group"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0 group-hover:scale-125 transition-transform"
                          style={place.status === 'wishlist'
                            ? { border: `2px solid ${s.fill}` }
                            : { backgroundColor: s.fill }}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-xs text-foreground truncate">{place.city}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{place.label}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
