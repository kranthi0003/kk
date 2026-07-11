// Real travel data for the India map + Abroad globe (src/components/TravelMap.jsx).
// Sourced from Kranthi's Google Maps "Visited" list (Jul 2026).
//
// Categories (India): 'home' | 'destination' | 'temple'
//   home        -> pulsing gold pin
//   destination -> gold pin  (cities, hill stations, nature, treks)
//   temple      -> amber pin  (temples, pilgrimage, spiritual sites)
// Abroad places render on a separate 3D globe.
//
// To add a place: copy a row, set lat/lng (decimal degrees) and category.

export const HOME = {
  id: 'vizag', name: 'Visakhapatnam', region: 'Andhra Pradesh',
  lat: 17.6868, lng: 83.2185, category: 'home',
}

export const INDIA_PLACES = [
  HOME,

  // ── Destinations: cities, hill stations, nature, treks ──────────────────────
  { id: 'bengaluru',  name: 'Bengaluru',        region: 'Karnataka',      lat: 12.9716, lng: 77.5946, category: 'destination' },
  { id: 'goa',        name: 'Goa',              region: 'Goa',            lat: 15.4909, lng: 73.8278, category: 'destination' },
  { id: 'mumbai',     name: 'Mumbai',           region: 'Maharashtra',    lat: 19.0760, lng: 72.8777, category: 'destination' },
  { id: 'delhi',      name: 'Delhi',            region: 'Delhi',          lat: 28.6139, lng: 77.2090, category: 'destination' },
  { id: 'kolkata',    name: 'Kolkata',          region: 'West Bengal',    lat: 22.5726, lng: 88.3639, category: 'destination' },
  { id: 'hyderabad',  name: 'Hyderabad',        region: 'Telangana',      lat: 17.3850, lng: 78.4867, category: 'destination' },
  { id: 'chennai',    name: 'Chennai',          region: 'Tamil Nadu',     lat: 13.0827, lng: 80.2707, category: 'destination' },
  { id: 'mysuru',     name: 'Mysuru',           region: 'Karnataka',      lat: 12.2958, lng: 76.6394, category: 'destination' },
  { id: 'mangaluru',  name: 'Mangaluru',        region: 'Karnataka',      lat: 12.9141, lng: 74.8560, category: 'destination' },
  { id: 'vijayawada', name: 'Vijayawada',       region: 'Andhra Pradesh', lat: 16.5062, lng: 80.6480, category: 'destination' },
  { id: 'wayanad',    name: 'Wayanad',          region: 'Kerala',         lat: 11.6854, lng: 76.1320, category: 'destination' },
  { id: 'kodaikanal', name: 'Kodaikanal',       region: 'Tamil Nadu',     lat: 10.2381, lng: 77.4892, category: 'destination' },
  { id: 'nashik',     name: 'Nashik',           region: 'Maharashtra',    lat: 19.9975, lng: 73.7898, category: 'destination' },
  { id: 'rameshwaram',name: 'Rameshwaram',      region: 'Tamil Nadu',     lat: 9.2876,  lng: 79.3129, category: 'destination' },
  { id: 'hogenakkal', name: 'Hogenakkal Falls', region: 'Tamil Nadu',     lat: 12.1170, lng: 77.7790, category: 'destination' },
  { id: 'kedarkantha',name: 'Kedarkantha',      region: 'Uttarakhand · trek', lat: 31.0250, lng: 78.1860, category: 'destination' },

  // ── Temples & pilgrimage ────────────────────────────────────────────────────
  { id: 'tirumala',   name: 'Sri Venkateswara Swamy, Tirumala', region: 'Andhra Pradesh', lat: 13.6833, lng: 79.3474, category: 'temple' },
  { id: 'tirupati',   name: 'Tirupati',         region: 'Andhra Pradesh', lat: 13.6288, lng: 79.4192, category: 'temple' },
  { id: 'shirdi',     name: 'Shirdi Sai Baba',  region: 'Maharashtra',    lat: 19.7645, lng: 74.4762, category: 'temple' },
  { id: 'dharmasthala',name:'Dharmasthala Manjunatha', region: 'Karnataka', lat: 12.9490, lng: 75.3810, category: 'temple' },
  { id: 'kukke',      name: 'Kukke Subrahmanya', region: 'Karnataka',     lat: 12.6600, lng: 75.6100, category: 'temple' },
  { id: 'adiyogi',    name: 'Adiyogi Shiva Statue', region: 'Chikkaballapur, Karnataka', lat: 13.3550, lng: 77.6890, category: 'temple' },
  { id: 'ramanatha',  name: 'Ramanathaswamy, Rameswaram', region: 'Tamil Nadu', lat: 9.2881, lng: 79.3174, category: 'temple' },
  { id: 'meenakshi',  name: 'Meenakshi Amman, Madurai', region: 'Tamil Nadu', lat: 9.9195, lng: 78.1194, category: 'temple' },
  { id: 'brihadeeswara',name:'Brihadeeswara, Thanjavur', region: 'Tamil Nadu', lat: 10.7828, lng: 79.1318, category: 'temple' },
  { id: 'ranganatha', name: 'Ranganathaswamy, Srirangam', region: 'Tamil Nadu', lat: 10.8624, lng: 78.6890, category: 'temple' },
  { id: 'arunachala', name: 'Arunachaleswarar, Tiruvannamalai', region: 'Tamil Nadu', lat: 12.2319, lng: 79.0674, category: 'temple' },
  { id: 'ekambaranathar',name:'Ekambaranathar, Kanchipuram', region: 'Tamil Nadu', lat: 12.8479, lng: 79.7000, category: 'temple' },
  { id: 'kamakshi',   name: 'Kamakshi Amman, Kanchipuram', region: 'Tamil Nadu', lat: 12.8410, lng: 79.7020, category: 'temple' },
  { id: 'goldentemple',name:'Sripuram Golden Temple, Vellore', region: 'Tamil Nadu', lat: 12.8830, lng: 79.1560, category: 'temple' },
  { id: 'trimbak',    name: 'Trimbakeshwar Jyotirlinga', region: 'Nashik, Maharashtra', lat: 19.9322, lng: 73.5300, category: 'temple' },
  { id: 'arasavalli', name: 'Suryanarayana Swamy, Arasavalli', region: 'Andhra Pradesh', lat: 18.2960, lng: 83.9200, category: 'temple' },
]

export const ABROAD_PLACES = [
  { id: 'losangeles', name: 'Los Angeles', region: 'California, USA',  country: 'USA',       lat: 34.0522,  lng: -118.2437 },
  { id: 'lasvegas',   name: 'Las Vegas',   region: 'Nevada, USA',      country: 'USA',       lat: 36.1699,  lng: -115.1398 },
  { id: 'chicago',    name: 'Chicago',     region: 'Illinois, USA',    country: 'USA',       lat: 41.8781,  lng: -87.6298 },
  { id: 'mauritius',  name: 'Mauritius',   region: 'Indian Ocean',     country: 'Mauritius', lat: -20.1609, lng: 57.5012 },
]

export const CATEGORY_STYLE = {
  home:        { fill: '#93c5fd', label: 'Home' },
  destination: { fill: '#3b82f6', label: 'Destinations' },
  temple:      { fill: '#38bdf8', label: 'Temples & Pilgrimage' },
}
