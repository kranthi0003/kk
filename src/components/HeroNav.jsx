import React, { useEffect, useState } from 'react'
import { resolve, LOCATION_LABELS, LOCATION_EMOJI, fmtIST } from '../lib/schedule'

// ============================================================
// HeroNav — top overlay for the WorldStage root page.
// ============================================================

const SUB_LINKS = [
  { label: 'Work',       href: '#/projects' },
  { label: 'Experience', href: '#/experience' },
  { label: 'Connect',    href: '#/connect' },
  { label: 'About',      href: '#/about' },
]

const ROOMS = ['workspace', 'bedroom', 'kitchen', 'living', 'tennis', 'gym', 'cafe', 'outdoor']

function goSub(href, e) {
  if (e) e.preventDefault()
  window.location.hash = href.slice(1)
  window.location.reload()
}

function setWorldLocation(loc) {
  window.dispatchEvent(new CustomEvent('world:set-location', { detail: { location: loc } }))
}

export default function HeroNav() {
  const [time, setTime] = useState(() => fmtIST(new Date()))
  const [live, setLive] = useState(() => resolve(new Date()))
  const [override, setOverride] = useState(null)
  const [roomsOpen, setRoomsOpen] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setTime(fmtIST(new Date()))
      setLive(resolve(new Date()))
    }, 30 * 1000)
    return () => clearInterval(id)
  }, [])

  const activeLocation = override || live.location
  const isOverride = !!override
  const label = LOCATION_LABELS[live.location] || 'Somewhere'
  const emoji = LOCATION_EMOJI[live.location] || '📍'

  const pickRoom = (loc) => {
    if (loc === live.location) {
      setOverride(null)
      setWorldLocation(null)
    } else {
      setOverride(loc)
      setWorldLocation(loc)
    }
    setRoomsOpen(false)
  }

  return (
    <div className="fixed top-0 inset-x-0 z-[80] pointer-events-none">
      <div className="flex items-center justify-between px-6 sm:px-10 pt-5 gap-4">
        <div className="flex items-center gap-5">
          <a
            href="#/"
            onClick={(e) => goSub('#/', e)}
            className="pointer-events-auto font-mono text-[12px] tracking-widest text-white/90 hover:text-white transition-colors"
          >
            KRANTHI · COM
          </a>
          <div className="hidden sm:flex font-mono text-[11px] tracking-widest text-white/55">
            (&nbsp;HYD&nbsp;)&nbsp;&nbsp;{time}
          </div>
        </div>

        <div className="pointer-events-auto relative">
          <button
            onClick={() => setRoomsOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 hover:border-white/30 transition-colors"
          >
            <span className="relative flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400" />
            </span>
            <span className="font-mono text-[11px] tracking-widest text-white/85">
              {isOverride ? (
                <>
                  <span className="text-white/45">VIEWING</span>&nbsp;&nbsp;
                  {LOCATION_EMOJI[activeLocation]} {LOCATION_LABELS[activeLocation]?.toUpperCase()}
                </>
              ) : (
                <>KRANTHI IS AT&nbsp;&nbsp;{emoji} {label.toUpperCase()}</>
              )}
            </span>
            <svg className={`w-3 h-3 text-white/50 transition-transform ${roomsOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>

          {roomsOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/10 p-2 shadow-2xl">
              <p className="px-3 py-2 font-mono text-[9px] tracking-widest text-white/40 uppercase">
                Visit a place
              </p>
              {ROOMS.map((id) => (
                <button
                  key={id}
                  onClick={() => pickRoom(id)}
                  className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg font-mono text-[11px] tracking-widest transition-colors ${
                    activeLocation === id
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{LOCATION_EMOJI[id]}&nbsp;&nbsp;{LOCATION_LABELS[id].toUpperCase()}</span>
                  {id === live.location && (
                    <span className="text-[9px] text-emerald-400">● LIVE</span>
                  )}
                </button>
              ))}
              {isOverride && (
                <button
                  onClick={() => { setOverride(null); setWorldLocation(null); setRoomsOpen(false) }}
                  className="w-full mt-1 px-3 py-2 rounded-lg font-mono text-[10px] tracking-widest text-white/55 hover:text-white hover:bg-white/5 transition-colors"
                >
                  ← back to live
                </button>
              )}
            </div>
          )}
        </div>

        <nav className="pointer-events-auto flex items-center gap-1 px-2 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/10">
          {SUB_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => goSub(l.href, e)}
              className="font-mono text-[11px] tracking-widest uppercase px-3 py-1.5 rounded-full text-white/75 hover:text-white hover:bg-white/10 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}
