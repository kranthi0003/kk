import { useEffect, useState, useCallback } from 'react'

const API_KEY = import.meta.env.VITE_WEATHER_UNION_API_KEY
const BASE_URL = 'https://www.weatherunion.com/gw/weather/external/v0/get_weather_data'
// Hyderabad as fallback
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

export default function WeatherWidget() {
  const [open, setOpen] = useState(false)
  const [weather, setWeather] = useState(null)
  const [city, setCity] = useState(DEFAULT_CITY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchWeather = useCallback(async (lat, lng) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${BASE_URL}?latitude=${lat}&longitude=${lng}`, {
        headers: { 'x-zomato-api-key': API_KEY },
      })
      const json = await res.json()
      if (json.status === '200' && json.locality_weather_data) {
        const d = json.locality_weather_data
        // Verify at least temperature is present
        if (d.temperature != null || d.humidity != null) {
          setWeather(d)
          setLastUpdated(new Date())
        } else {
          // station near but no data — try fallback
          throw new Error('No sensor data available')
        }
      } else {
        throw new Error(json.message || 'API error')
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
    <div className="fixed bottom-16 left-6 z-40">
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
                <p className="text-[10px] text-white/40">Weather Union</p>
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
