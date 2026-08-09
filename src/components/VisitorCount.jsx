import React, { useState, useEffect } from 'react'
import { onPresenceSync, getPresenceState } from './VisitorTracker'

export default function VisitorCount() {
  const [count, setCount] = useState(null)
  const [ghosts, setGhosts] = useState(() => localStorage.getItem('ghosts_off') !== '1')

  useEffect(() => {
    const syncCount = () => {
      const state = getPresenceState()
      setCount(Object.keys(state).length)
    }

    const unsub = onPresenceSync(syncCount)
    syncCount()

    return () => { unsub() }
  }, [])

  if (count === null || count < 2) return null

  const toggle = () => {
    window.dispatchEvent(new Event('toggle-ghosts'))
    setGhosts(g => !g)
  }

  return (
    <button
      onClick={toggle}
      title={ghosts ? 'Hide other visitors’ cursors' : 'Show other visitors’ cursors'}
      className="hidden md:inline-flex fixed bottom-6 left-6 z-40 items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-lg animate-fade-in-up transition-opacity hover:opacity-80"
      style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="text-[11px] font-mono text-muted-foreground">
        <span className="text-foreground font-semibold">{count}</span> viewing now
      </span>
      <span className="text-[10px] font-mono text-muted-foreground/70 border-l border-white/15 pl-2">
        {ghosts ? 'cursors on' : 'cursors off'}
      </span>
    </button>
  )
}
