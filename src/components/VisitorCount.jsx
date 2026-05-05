import React, { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

export default function VisitorCount() {
  const [count, setCount] = useState(null)

  useEffect(() => {
    const channel = supabase.channel('visitors', {
      config: { presence: { key: crypto.randomUUID() } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setCount(Object.keys(state).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (count === null || count < 2) return null

  return (
    <div className="fixed bottom-6 left-6 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 backdrop-blur-sm border border-border/30 shadow-lg animate-fade-in-up">
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
