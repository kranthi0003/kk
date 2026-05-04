import React, { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Custom pin icon
const createPinIcon = (color = '#3b82f6') => L.divIcon({
  className: '',
  html: `<div style="
    width: 14px; height: 14px;
    background: ${color};
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 0 8px ${color}88, 0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
})

// Travel data — add your locations and photos here
const travelData = [
  {
    id: 'visakhapatnam',
    city: 'Visakhapatnam',
    country: 'India',
    emoji: '🏠',
    label: 'Hometown',
    coords: [17.6868, 83.2185],
    color: '#10b981',
    photos: [],
  },
  {
    id: 'hyderabad',
    city: 'Hyderabad',
    country: 'India',
    emoji: '🏰',
    label: 'Lived & worked here',
    coords: [17.385, 78.4867],
    color: '#f59e0b',
    photos: [],
  },
  {
    id: 'bangalore',
    city: 'Bangalore',
    country: 'India',
    emoji: '🌳',
    label: 'Garden City vibes',
    coords: [12.9716, 77.5946],
    color: '#3b82f6',
    photos: [],
  },
  {
    id: 'mumbai',
    city: 'Mumbai',
    country: 'India',
    emoji: '🌊',
    label: 'City of dreams',
    coords: [19.076, 72.8777],
    color: '#ef4444',
    photos: [],
  },
  {
    id: 'delhi',
    city: 'Delhi',
    country: 'India',
    emoji: '🕌',
    label: 'Capital stories',
    coords: [28.6139, 77.209],
    color: '#8b5cf6',
    photos: [],
  },
  {
    id: 'goa',
    city: 'Goa',
    country: 'India',
    emoji: '🏖️',
    label: 'Beach days',
    coords: [15.2993, 74.124],
    color: '#06b6d4',
    photos: [],
  },
  {
    id: 'chennai',
    city: 'Chennai',
    country: 'India',
    emoji: '🛕',
    label: 'Temple & tech',
    coords: [13.0827, 80.2707],
    color: '#ec4899',
    photos: [],
  },
  {
    id: 'kolkata',
    city: 'Kolkata',
    country: 'India',
    emoji: '🌉',
    label: 'City of Joy',
    coords: [22.5726, 88.3639],
    color: '#f97316',
    photos: [],
  },
]

function FlyToLocation({ coords }) {
  const map = useMap()
  if (coords) {
    map.flyTo(coords, 10, { duration: 1.2 })
  }
  return null
}

export default function TravelMap() {
  const [selected, setSelected] = useState(null)
  const [flyTo, setFlyTo] = useState(null)

  return (
    <section id="travel" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-center mb-3">
          Places I've Been{' '}
          <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">🌍</span>
        </h2>
        <p className="text-center text-muted-foreground mb-10 max-w-lg mx-auto">
          Click on a pin to explore. Photos coming soon!
        </p>

        <div className="grid lg:grid-cols-[1fr_280px] gap-6">
          {/* Map */}
          <div className="relative rounded-2xl overflow-hidden border border-border/50 shadow-xl h-[400px] sm:h-[500px]">
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              scrollWheelZoom={true}
              className="h-full w-full z-0"
              style={{ background: 'var(--color-card)' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              {flyTo && <FlyToLocation coords={flyTo} />}
              {travelData.map(place => (
                <Marker
                  key={place.id}
                  position={place.coords}
                  icon={createPinIcon(place.color)}
                  eventHandlers={{
                    click: () => {
                      setSelected(place)
                      setFlyTo(place.coords)
                    },
                  }}
                >
                  <Popup>
                    <div className="text-center min-w-[140px]">
                      <p className="text-lg mb-0.5">{place.emoji}</p>
                      <p className="font-bold text-sm">{place.city}</p>
                      <p className="text-xs text-gray-500">{place.label}</p>
                      {place.photos.length > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-1">
                          {place.photos.slice(0, 4).map((photo, i) => (
                            <img key={i} src={photo} alt="" className="w-full h-16 object-cover rounded" />
                          ))}
                        </div>
                      )}
                      {place.photos.length === 0 && (
                        <p className="text-[10px] text-gray-400 mt-1 italic">📸 Photos coming soon</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Location list sidebar */}
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-1 px-1">
              {travelData.length} locations
            </p>
            {travelData.map(place => (
              <button
                key={place.id}
                onClick={() => {
                  setSelected(place)
                  setFlyTo(place.coords)
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                  selected?.id === place.id
                    ? 'bg-accent/15 border border-accent/30 shadow-sm'
                    : 'bg-card hover:bg-muted border border-transparent'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: place.color }}
                />
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {place.emoji} {place.city}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{place.label}</p>
                </div>
                {place.photos.length > 0 && (
                  <span className="text-[10px] text-muted-foreground ml-auto flex-shrink-0">
                    📷 {place.photos.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
