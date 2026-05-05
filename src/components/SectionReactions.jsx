import React, { useState, useEffect } from 'react'
import supabase from '../lib/supabase'

const EMOJIS = ['👍', '🔥', '❤️', '🚀']

export default function SectionReactions({ section }) {
  const [counts, setCounts] = useState({})
  const [voted, setVoted] = useState({})

  useEffect(() => {
    // Load counts
    fetchCounts()
    // Load user's votes from localStorage
    const saved = JSON.parse(localStorage.getItem(`reactions_${section}`) || '{}')
    setVoted(saved)
  }, [section])

  const fetchCounts = async () => {
    const { data } = await supabase
      .from('reactions')
      .select('emoji')
      .eq('section', section)
    if (data) {
      const map = {}
      data.forEach(r => { map[r.emoji] = (map[r.emoji] || 0) + 1 })
      setCounts(map)
    }
  }

  const react = async (emoji) => {
    if (voted[emoji]) return // already voted this emoji

    // Optimistic update
    setCounts(prev => ({ ...prev, [emoji]: (prev[emoji] || 0) + 1 }))
    setVoted(prev => {
      const next = { ...prev, [emoji]: true }
      localStorage.setItem(`reactions_${section}`, JSON.stringify(next))
      return next
    })

    await supabase.from('reactions').insert({ section, emoji })
  }

  const total = Object.values(counts).reduce((s, n) => s + n, 0)
  if (total === 0 && !counts) return null

  return (
    <div className="flex items-center gap-1.5 justify-center mt-6">
      {EMOJIS.map(emoji => (
        <button
          key={emoji}
          onClick={() => react(emoji)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all duration-200 ${
            voted[emoji]
              ? 'bg-accent/15 border border-accent/30 scale-105'
              : 'bg-muted/30 border border-border/20 hover:border-border/40 hover:bg-muted/50'
          }`}
        >
          <span className="text-sm">{emoji}</span>
          {counts[emoji] > 0 && (
            <span className={`text-[10px] font-mono ${voted[emoji] ? 'text-accent font-semibold' : 'text-muted-foreground'}`}>
              {counts[emoji]}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
