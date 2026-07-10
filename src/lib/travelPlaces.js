// Places rendered on the Leaflet travel map (src/components/TravelMap.jsx).
//
// Each entry: { id, city, country, label, lat, lng, status, home? }
//   status: 'visited'  -> gold pin  (places you've been)
//           'wishlist'  -> sky pin  (places you want to go)
//   home: true          -> gets an animated pulse ring
//
// ── How to bulk-import your real Google Maps pins ────────────────────────────
// Google has NO API to read your personal "Saved" lists, so export them once:
//   1. Go to takeout.google.com  →  deselect all  →  select "Saved"  →  choose
//      the GeoJSON/CSV format  →  export. (Or, for a custom map, open My Maps →
//      the map's ⋮ menu → "Export to KML/KMZ".)
//   2. Each exported feature has a name + [lng, lat]. Map it to a row below,
//      tagging status: 'visited' or 'wishlist' (Google keeps "Want to go" as its
//      own list, so that split comes through for free).
// Paste the rows here and the map + sidebar update automatically.
// ─────────────────────────────────────────────────────────────────────────────

export const PLACES = [
  // ── Visited ────────────────────────────────────────────────────────────────
  { id: 'vizag',     city: 'Visakhapatnam', country: 'India', label: 'Hometown 🏠',            lat: 17.6868,  lng: 83.2185,   status: 'visited', home: true },
  { id: 'hyderabad', city: 'Hyderabad',     country: 'India', label: 'Worked here 🏰',          lat: 17.385,   lng: 78.4867,   status: 'visited' },
  { id: 'bangalore', city: 'Bangalore',     country: 'India', label: 'Garden City 🌳',          lat: 12.9716,  lng: 77.5946,   status: 'visited' },
  { id: 'mumbai',    city: 'Mumbai',        country: 'India', label: 'City of dreams 🌊',       lat: 19.076,   lng: 72.8777,   status: 'visited' },
  { id: 'delhi',     city: 'Delhi',         country: 'India', label: 'Capital stories 🕌',      lat: 28.6139,  lng: 77.209,    status: 'visited' },
  { id: 'goa',       city: 'Goa',           country: 'India', label: 'Beach days 🏖️',           lat: 15.2993,  lng: 74.124,    status: 'visited' },
  { id: 'chennai',   city: 'Chennai',       country: 'India', label: 'Temple & tech 🛕',        lat: 13.0827,  lng: 80.2707,   status: 'visited' },
  { id: 'kolkata',   city: 'Kolkata',       country: 'India', label: 'City of Joy 🌉',          lat: 22.5726,  lng: 88.3639,   status: 'visited' },
  { id: 'lasvegas',  city: 'Las Vegas',     country: 'USA',   label: 'What happens in Vegas 🎰', lat: 36.1699,  lng: -115.1398, status: 'visited' },
  { id: 'chicago',   city: 'Chicago',       country: 'USA',   label: 'The Windy City 🌬️',        lat: 41.8781,  lng: -87.6298,  status: 'visited' },

  // ── Want to go ──────────────────────────────────────────────────────────────
  // Add your Google Maps "Want to go" pins here, e.g.:
  //   { id: 'kyoto', city: 'Kyoto', country: 'Japan', label: 'Someday 🌸', lat: 35.0116, lng: 135.7681, status: 'wishlist' },
]

export const STATUS_STYLE = {
  visited:  { fill: '#e0a04a', ring: '#f5c877', label: 'Visited' },
  wishlist: { fill: '#38bdf8', ring: '#7dd3fc', label: 'Want to go' },
}
