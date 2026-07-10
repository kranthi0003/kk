import { useEffect, useState, useCallback } from 'react'

const API_KEY = import.meta.env.VITE_WEATHER_UNION_API_KEY
const WU_URL = 'https://www.weatherunion.com/gw/weather/external/v0/get_weather_data'
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast'
// Hyderabad as fallback location (used only if geolocation is unavailable)
const DEFAULT_LAT = 17.385
const DEFAULT_LNG = 78.4867
const DEFAULT_CITY = 'Hyderabad'

const REFRESH_MS = 10 * 60 * 1000 // 10 minutes

function weatherEmoji(data) {
  if (!data) return '🌡️'
  const { rain_intensity, rain_accumulation, temperature } = data
  if (rain_intensity > 5 || rain_accumulation > 10) return '🌧️'
  if (rain_intensity > 0 || rain_accumulation > 0) return '🌦️'
  if (temperature == null) return '🌡️'
  if (temperature >= 38) return '🥵'
  if (temperature >= 30) return '☀️'
  if (temperature >= 22) return '⛅'
  if (temperature >= 15) return '🌤️'
  return '❄️'
}

function fmt(val, unit, decimals = 1) {
  if (val == null) return '—'
  return `${Number(val).toFixed(decimals)}${unit}`
}

function windDir(deg) {
  if (deg == null) return '—'
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

// Hyperlocal source — Zomato Weather Union (great where it has a live station)
async function fetchFromWeatherUnion(lat, lng) {
  if (!API_KEY) return null
  const res = await fetch(`${WU_URL}?latitude=${lat}&longitude=${lng}`, {
    headers: { 'x-zomato-api-key': API_KEY },
  })
  const json = await res.json()
  const d = json?.locality_weather_data
  // Treat null temperature/humidity as "no live data" (station offline or rain-only)
  if (json?.status === '200' && d && (d.temperature != null || d.humidity != null)) {
    return { source: 'Weather Union', data: d }
  }
  return null
}

// Global fallback — Open-Meteo (free, no key, worldwide coverage)
async function fetchFromOpenMeteo(lat, lng) {
  const params = 'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,precipitation'
  const res = await fetch(`${OPEN_METEO_URL}?latitude=${lat}&longitude=${lng}&current=${params}&wind_speed_unit=ms`)
  const json = await res.json()
  const c = json?.current
  if (!c || c.temperature_2m == null) return null
  return {
    source: 'Open-Meteo',
    data: {
      temperature: c.temperature_2m,
      humidity: c.relative_humidity_2m,
      wind_speed: c.wind_speed_10m,
      wind_direction: c.wind_direction_10m,
      rain_intensity: c.precipitation,
      rain_accumulation: c.precipitation,
      aqi_pm_10: null,
      aqi_pm_2_point_5: null,
    },
  }
}

export default function WeatherWidget() {
  const [open, setOpen] = useState(false)
  const [weather, setWeather] = useState(null)
  const [source, setSource] = useState('Weather Union')
  const [city, setCity] = useState(DEFAULT_CITY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchWeather = useCallback(async (lat, lng) => {
    setLoading(true)
    setError(null)
    try {
      // Prefer hyperlocal Weather Union; fall back to Open-Meteo where it has no live station
      let result = null
      try { result = await fetchFromWeatherUnion(lat, lng) } catch {}
      if (!result) {
        try { result = await fetchFromOpenMeteo(lat, lng) } catch {}
      }
      if (result) {
        setWeather(result.data)
        setSource(result.source)
        setLastUpdated(new Date())
      } else {
        throw new Error('No weather data available')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const init = useCallback(() => {
    if (!navigator.geolocation) {
      fetchWeather(DEFAULT_LAT, DEFAULT_LNG)
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude)
        // Reverse geocode with a free API to get city name
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
          .then(r => r.json())
          .then(d => {
            const c = d.address?.city || d.address?.town || d.address?.village || d.address?.state_district
            if (c) setCity(c)
          })
          .catch(() => {})
      },
      () => {
        // Permission denied or unavailable — use default
        fetchWeather(DEFAULT_LAT, DEFAULT_LNG)
      },
      { timeout: 6000 }
    )
  }, [fetchWeather])

  useEffect(() => {
    init()
    const interval = setInterval(init, REFRESH_MS)
    return () => clearInterval(interval)
  }, [init])

  const w = weather
  const emoji = weatherEmoji(w)

  return (
    <div className="hidden md:block fixed bottom-16 left-6 z-40">
      {/* Collapsed pill */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Weather (powered by Weather Union)"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-lg transition-all duration-200 hover:scale-105 text-xs font-medium text-white/80"
          style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <span className="text-base leading-none">{loading ? '⏳' : emoji}</span>
          {loading ? (
            <span className="opacity-60">loading…</span>
          ) : error ? (
            <span className="opacity-60">weather</span>
          ) : (
            <span>{w?.temperature != null ? `${Number(w.temperature).toFixed(1)}°C` : '—'}</span>
          )}
        </button>
      )}

      {/* Expanded card */}
      {open && (
        <div
          className="w-64 rounded-xl shadow-2xl overflow-hidden animate-fade-in-up"
          style={{ background: 'rgba(10,10,18,0.88)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl leading-none">{loading ? '⏳' : emoji}</span>
              <div>
                <p className="text-[11px] font-semibold text-white/90 leading-tight truncate max-w-[130px]">{city}</p>
                <p className="text-[10px] text-white/40">{source}</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/40 hover:text-white/80 transition-colors text-xs leading-none p-1"
              aria-label="Close"
            >✕</button>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

          {/* Body */}
          <div className="px-4 py-3">
            {loading && (
              <p className="text-[11px] text-white/40 text-center py-2">Fetching weather…</p>
            )}
            {!loading && error && (
              <p className="text-[11px] text-red-400/80 text-center py-2">No data near you.<br />Try again later.</p>
            )}
            {!loading && !error && w && (
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Temperature" value={fmt(w.temperature, '°C')} />
                <Stat label="Humidity" value={fmt(w.humidity, '%')} />
                <Stat label="Wind" value={`${fmt(w.wind_speed, ' m/s')} ${windDir(w.wind_direction)}`} />
                <Stat label="Rain (1h)" value={fmt(w.rain_accumulation, ' mm')} />
                {w.aqi_pm_2_point_5 != null && (
                  <Stat label="PM2.5 AQI" value={fmt(w.aqi_pm_2_point_5, '', 0)} />
                )}
                {w.aqi_pm_10 != null && (
                  <Stat label="PM10 AQI" value={fmt(w.aqi_pm_10, '', 0)} />
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {lastUpdated && (
            <div className="px-4 pb-3 flex items-center justify-between">
              <span className="text-[9px] text-white/30">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button
                onClick={init}
                title="Refresh"
                className="text-[9px] text-white/30 hover:text-white/60 transition-colors"
              >↻ refresh</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg px-2.5 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
      <p className="text-[9px] text-white/40 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-[13px] font-semibold text-white/90">{value}</p>
    </div>
  )
}
