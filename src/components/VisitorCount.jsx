import React, { useState, useEffect } from 'react'
import { onPresenceSync, getPresenceState } from './VisitorTracker'

export default function VisitorCount() {
  const [count, setCount] = useState(null)

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

  return (
    <div className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm shadow-lg animate-fade-in-up" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)' }}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="text-[11px] font-mono text-muted-foreground">
        <span className="text-foreground font-semibold">{count}</span> viewing now
      </span>
    </div>
  )
}
