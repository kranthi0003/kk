import { useEffect, useRef } from 'react'
import supabase from '../lib/supabase'

// Detect device type + browser from user agent
function getDeviceInfo() {
  const ua = navigator.userAgent
  let browser = 'Unknown'
  if (ua.includes('Firefox/')) browser = 'Firefox'
  else if (ua.includes('Edg/')) browser = 'Edge'
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Chrome'
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Safari'
  else if (ua.includes('Opera') || ua.includes('OPR/')) browser = 'Opera'

  let os = 'Unknown'
  if (ua.includes('Win')) os = 'Windows'
  else if (ua.includes('Mac')) os = 'macOS'
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS'

  let device = 'Desktop'
  if (/Mobi|Android/i.test(ua)) device = 'Mobile'
  else if (/Tablet|iPad/i.test(ua)) device = 'Tablet'

  return { browser, os, device }
}

// Get referrer source
function getReferrer() {
  const ref = document.referrer
  if (!ref) return 'Direct'
  try {
    const host = new URL(ref).hostname
    if (host.includes('google')) return 'Google'
    if (host.includes('linkedin')) return 'LinkedIn'
    if (host.includes('github')) return 'GitHub'
    if (host.includes('twitter') || host.includes('t.co') || host.includes('x.com')) return 'X / Twitter'
    if (host.includes('instagram')) return 'Instagram'
    if (host.includes('facebook') || host.includes('fb.')) return 'Facebook'
    if (host.includes('reddit')) return 'Reddit'
    if (host.includes('youtube')) return 'YouTube'
    return host
  } catch { return 'Direct' }
}

// Unique visitor ID per session
const VISITOR_ID = crypto.randomUUID()

// Shared channel so AdminDashboard + VisitorCount can read the same presence state
let sharedChannel = null
let subscriberCount = 0
let presenceCallbacks = new Set()

export function getVisitorChannel() {
  if (!sharedChannel) {
    sharedChannel = supabase.channel('visitor-presence', {
      config: { presence: { key: VISITOR_ID } },
    })
    // Single sync listener that notifies all callbacks
    sharedChannel.on('presence', { event: 'sync' }, () => {
      presenceCallbacks.forEach(cb => cb())
    })
  }
  return sharedChannel
}

export function onPresenceSync(callback) {
  presenceCallbacks.add(callback)
  return () => presenceCallbacks.delete(callback)
}

export function getPresenceState() {
  if (!sharedChannel) return {}
  return sharedChannel.presenceState()
}

export function subscribeVisitorChannel() {
  subscriberCount++
  return getVisitorChannel()
}

export function unsubscribeVisitorChannel() {
  subscriberCount--
  if (subscriberCount <= 0 && sharedChannel) {
    supabase.removeChannel(sharedChannel)
    sharedChannel = null
    subscriberCount = 0
    presenceCallbacks.clear()
  }
}

export default function VisitorTracker() {
  const sectionRef = useRef('home')
  const channelRef = useRef(null)

  useEffect(() => {
    let geo = { country: '—', city: '—', flag: '🌐' }
    const deviceInfo = getDeviceInfo()
    const referrer = getReferrer()
    const joinedAt = new Date().toISOString()

    const channel = subscribeVisitorChannel()
    channelRef.current = channel

    // Fetch geolocation with fallback + cache
    const cachedGeo = sessionStorage.getItem('visitor_geo')
    if (cachedGeo) {
      try { geo = JSON.parse(cachedGeo) } catch {}
    }

    const fetchGeo = async () => {
      if (cachedGeo) return
      try {
        // Primary: ipapi.co
        const r = await fetch('https://ipapi.co/json/')
        if (!r.ok) throw new Error()
        const data = await r.json()
        if (data.error) throw new Error()
        geo = {
          country: data.country_name || '—',
          city: data.city || '—',
          region: data.region || '',
          flag: countryFlag(data.country_code),
          timezone: data.timezone || '',
        }
      } catch {
        try {
          // Fallback: ip-api.com (no HTTPS on free, use http)
          const r2 = await fetch('https://freeipapi.com/api/json')
          if (!r2.ok) throw new Error()
          const d2 = await r2.json()
          geo = {
            country: d2.countryName || '—',
            city: d2.cityName || '—',
            region: d2.regionName || '',
            flag: countryFlag(d2.countryCode),
            timezone: d2.timeZone || '',
          }
        } catch {}
      }
      sessionStorage.setItem('visitor_geo', JSON.stringify(geo))
    }

    fetchGeo()
      .finally(() => {
        const trackData = () => ({
          visitor_id: VISITOR_ID,
          ...geo,
          ...deviceInfo,
          referrer,
          joined_at: joinedAt,
          current_section: sectionRef.current,
          page_title: document.title,
          screen: `${screen.width}×${screen.height}`,
          language: navigator.language,
          online_at: new Date().toISOString(),
        })

        channel
          .on('presence', { event: 'sync' }, () => {})
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channel.track(trackData())
            }
          })

        // Update section every 5s
        const interval = setInterval(async () => {
          const sections = ['home', 'experience', 'techstack', 'about', 'terminal', 'projects', 'travel', 'connect', 'guestbook']
          for (const id of sections) {
            const el = document.getElementById(id)
            if (el) {
              const rect = el.getBoundingClientRect()
              if (rect.top <= 300 && rect.bottom > 300) {
                if (sectionRef.current !== id) {
                  sectionRef.current = id
                  try { await channel.track(trackData()) } catch {}
                }
                break
              }
            }
          }
        }, 5000)

        return () => clearInterval(interval)
      })

    return () => {
      unsubscribeVisitorChannel()
    }
  }, [])

  return null
}

// Country code → flag emoji
function countryFlag(code) {
  if (!code || code.length !== 2) return '🌐'
  const offset = 127397
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + offset))
}
