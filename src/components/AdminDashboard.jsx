import React, { useState, useEffect, useRef } from 'react'
import { onPresenceSync, getPresenceState } from './VisitorTracker'

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function timeSince(iso) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
}

const SECTION_LABELS = {
  home: '🏠 Home',
  experience: '💼 Experience',
  techstack: '🛠️ Skills',
  about: '👤 About',
  terminal: '💻 Terminal',
  projects: '🚀 Projects',
  travel: '🌍 Travel',
  connect: '📬 Connect',
  guestbook: '📝 Guestbook',
}

const DEVICE_ICONS = {
  Mobile: '📱',
  Tablet: '📱',
  Desktop: '🖥️',
}

const BROWSER_ICONS = {
  Chrome: '🟢',
  Safari: '🔵',
  Firefox: '🟠',
  Edge: '🔷',
  Opera: '🔴',
  Unknown: '⚪',
}

export default function AdminDashboard() {
  const [open, setOpen] = useState(false)
  const [visitors, setVisitors] = useState([])
  const [tick, setTick] = useState(0)
  const channelRef = useRef(null)

  // Secret shortcut: Ctrl+Shift+V or custom event
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        e.preventDefault()
        setOpen(o => !o)
      }
    }
    const handleCustom = () => setOpen(o => !o)
    window.addEventListener('keydown', handleKey)
    window.addEventListener('toggle-admin-dashboard', handleCustom)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('toggle-admin-dashboard', handleCustom)
    }
  }, [])

  // Subscribe to presence
  useEffect(() => {
    if (!open) return

    const syncVisitors = () => {
      const state = getPresenceState()
      const list = []
      Object.entries(state).forEach(([key, presences]) => {
        presences.forEach(p => list.push(p))
      })
      list.sort((a, b) => new Date(b.joined_at) - new Date(a.joined_at))
      setVisitors(list)
    }

    // Listen for presence sync events
    const unsub = onPresenceSync(syncVisitors)

    // Sync immediately with current state
    syncVisitors()

    // Tick every second to update times
    const interval = setInterval(() => {
      syncVisitors() // also refresh visitor data
      setTick(t => t + 1)
    }, 1000)

    return () => {
      clearInterval(interval)
      unsub()
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md" onClick={() => setOpen(false)} />

      {/* Dashboard panel */}
      <div className="fixed top-4 right-4 bottom-4 z-[201] w-[480px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        style={{
          background: 'rgba(15, 15, 20, 0.95)',
          backdropFilter: 'blur(40px)',
          animation: 'dashboard-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
          <div>
            <h2 className="text-white text-base font-semibold flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
              </span>
              Live Visitors
              <span className="ml-1 text-sm font-mono text-green-400">{visitors.length}</span>
            </h2>
            <p className="text-[11px] text-white/30 mt-0.5 font-mono">Ctrl+Shift+V to toggle</p>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Stats row */}
        <div className="px-5 py-3 border-b border-white/5 flex gap-4">
          <Stat label="Total" value={visitors.length} color="text-blue-400" />
          <Stat label="Mobile" value={visitors.filter(v => v.device === 'Mobile').length} color="text-blue-400" />
          <Stat label="Desktop" value={visitors.filter(v => v.device === 'Desktop').length} color="text-cyan-400" />
          <Stat label="Countries" value={new Set(visitors.map(v => v.country)).size} color="text-amber-400" />
        </div>

        {/* Visitor list */}
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
          {visitors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="text-4xl opacity-30">👀</span>
              <p className="text-white/30 text-sm">No visitors right now</p>
            </div>
          ) : (
            visitors.map((v, i) => (
              <div key={v.visitor_id || i} className="px-5 py-3.5 border-b border-white/5 hover:bg-white/3 transition-colors group">
                {/* Row 1: Flag + Location + Time */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{v.flag || '🌐'}</span>
                    <div>
                      <span className="text-white text-[13px] font-medium">
                        {v.city !== '—' ? `${v.city}, ` : ''}{v.country || 'Unknown'}
                      </span>
                      {v.region && v.region !== v.city && (
                        <span className="text-white/20 text-[11px] ml-1">{v.region}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-green-400/80">{timeSince(v.joined_at)} on site</span>
                  </div>
                </div>

                {/* Row 2: Device + Browser + Section */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Tag icon={DEVICE_ICONS[v.device] || '🖥️'} text={`${v.device} · ${v.os}`} />
                  <Tag icon={BROWSER_ICONS[v.browser] || '⚪'} text={v.browser} />
                  <Tag icon="" text={SECTION_LABELS[v.current_section] || v.current_section || '—'} highlight />
                  <Tag icon="🔗" text={v.referrer || 'Direct'} />
                </div>

                {/* Row 3: Meta */}
                <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-white/15">
                  <span>{v.screen}</span>
                  <span>{v.language}</span>
                  <span>joined {timeAgo(v.joined_at)}</span>
                  {v.timezone && <span>{v.timezone}</span>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-white/5 text-[10px] font-mono text-white/20 flex items-center justify-between">
          <span>Supabase Realtime Presence</span>
          <span>Updates in real-time</span>
        </div>
      </div>

      <style>{`
        @keyframes dashboard-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="flex-1 text-center">
      <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
      <p className="text-[10px] text-white/30 uppercase tracking-wider">{label}</p>
    </div>
  )
}

function Tag({ icon, text, highlight }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] ${
      highlight
        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
        : 'bg-white/5 text-white/40 border border-white/5'
    }`}>
      {icon && <span className="text-[10px]">{icon}</span>}
      {text}
    </span>
  )
}
