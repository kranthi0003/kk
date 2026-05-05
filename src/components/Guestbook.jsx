import React, { useState, useEffect, useRef } from 'react'
import supabase from '../lib/supabase'

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const COLORS = ['bg-blue-500/20 text-blue-400', 'bg-purple-500/20 text-purple-400', 'bg-green-500/20 text-green-400', 'bg-amber-500/20 text-amber-400', 'bg-rose-500/20 text-rose-400', 'bg-cyan-500/20 text-cyan-400']

export default function Guestbook() {
  const [entries, setEntries] = useState([])
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef()

  useEffect(() => {
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    const { data } = await supabase
      .from('guestbook')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setEntries(data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const n = name.trim()
    const m = message.trim()
    if (!n || !m) return
    if (m.length > 280) { setError('Keep it under 280 chars'); return }

    setSending(true)
    setError('')

    const { error: err } = await supabase.from('guestbook').insert({ name: n, message: m })
    if (err) {
      setError('Failed to post. Try again.')
      setSending(false)
      return
    }

    setMessage('')
    setSending(false)
    fetchEntries()
  }

  return (
    <section id="guestbook" className="py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <p className="font-mono text-sm text-accent mb-2">~/guestbook</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl">Leave a Note</h2>
          <p className="text-muted-foreground text-sm mt-2">Say hi, drop feedback, or just leave your mark.</p>
        </div>

        {/* Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="rounded-xl border border-border/30 bg-card p-4 mb-6">
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
              className="flex-1 bg-background border border-border/30 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-foreground/20 transition-colors"
              required
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Leave a message..."
              maxLength={280}
              className="flex-1 bg-background border border-border/30 rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-foreground/20 transition-colors"
              required
            />
            <button
              type="submit"
              disabled={sending || !name.trim() || !message.trim()}
              className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-30 transition-all flex-shrink-0"
            >
              {sending ? '...' : 'Post'}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </form>

        {/* Entries */}
        <div className="space-y-3">
          {entries.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Be the first!</p>
          )}
          {entries.map((entry, i) => (
            <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-border/20 bg-card/50 px-4 py-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${COLORS[i % COLORS.length]}`}>
                {getInitials(entry.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{entry.name}</span>
                  <span className="text-[10px] text-muted-foreground/50 font-mono">{timeAgo(entry.created_at)}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5 break-words">{entry.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
