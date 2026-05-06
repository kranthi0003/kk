import React, { useState, useEffect, useRef } from 'react'
import supabase from '../lib/supabase'

const CHANNEL_NAME = 'live-chat'
const COLORS = ['#60a5fa','#f472b6','#34d399','#fbbf24','#a78bfa','#fb923c','#22d3ee','#f87171','#4ade80','#e879f9']

function getVisitorId() {
  let id = sessionStorage.getItem('chat_visitor_id')
  if (!id) { id = crypto.randomUUID().slice(0, 8); sessionStorage.setItem('chat_visitor_id', id) }
  return id
}

function getVisitorName() {
  return sessionStorage.getItem('chat_name') || ''
}

function getColor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function timeStr(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default function LiveChat() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(getVisitorName)
  const [nameSet, setNameSet] = useState(!!getVisitorName())
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [typing, setTyping] = useState(new Set())
  const channelRef = useRef(null)
  const messagesEndRef = useRef(null)
  const visitorId = useRef(getVisitorId())
  const typingTimeout = useRef(null)

  useEffect(() => {
    const handler = () => setOpen(o => !o)
    window.addEventListener('toggle-live-chat', handler)
    return () => window.removeEventListener('toggle-live-chat', handler)
  }, [])

  // Subscribe to channel when open
  useEffect(() => {
    if (!open || !nameSet) return

    const channel = supabase.channel(CHANNEL_NAME, {
      config: { presence: { key: visitorId.current } }
    })

    channel
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        setMessages(prev => [...prev.slice(-100), payload])
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.id !== visitorId.current) {
          setTyping(prev => new Set([...prev, payload.name]))
          setTimeout(() => setTyping(prev => { const n = new Set(prev); n.delete(payload.name); return n }), 2000)
        }
      })
      .on('presence', { event: 'sync' }, () => {
        setOnlineCount(Object.keys(channel.presenceState()).length)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ name, id: visitorId.current, joined_at: new Date().toISOString() })
        }
      })

    channelRef.current = channel

    return () => { supabase.removeChannel(channel) }
  }, [open, nameSet])

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = (e) => {
    e.preventDefault()
    if (!message.trim() || !channelRef.current) return

    const payload = {
      id: visitorId.current,
      name,
      text: message.trim(),
      color: getColor(visitorId.current),
      ts: Date.now(),
    }

    channelRef.current.send({ type: 'broadcast', event: 'message', payload })
    setMessages(prev => [...prev.slice(-100), payload])
    setMessage('')
  }

  const sendTyping = () => {
    if (!channelRef.current) return
    channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { id: visitorId.current, name } })
  }

  const handleInput = (e) => {
    setMessage(e.target.value)
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(sendTyping, 300)
  }

  const setNameAndJoin = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const n = name.trim().slice(0, 20)
    setName(n)
    sessionStorage.setItem('chat_name', n)
    setNameSet(true)
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-md" onClick={() => setOpen(false)} />
      <div className="fixed bottom-20 right-6 z-[151] w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
        style={{ background: 'rgba(18,18,24,0.95)', animation: 'chat-in 0.3s cubic-bezier(0.16,1,0.3,1)' }}>

        {/* Header */}
        <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
            </span>
            <div>
              <h3 className="text-white text-sm font-semibold">Live Chat</h3>
              <p className="text-[10px] text-white/30">{onlineCount > 0 ? `${onlineCount} online` : 'Connecting...'}</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Name entry or chat */}
        {!nameSet ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <form onSubmit={setNameAndJoin} className="w-full space-y-3 text-center">
              <span className="text-3xl">💬</span>
              <p className="text-white/60 text-sm">Choose a display name to join</p>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={20}
                placeholder="Your name..."
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm text-center placeholder:text-white/20 outline-none focus:border-white/20"
              />
              <button type="submit" disabled={!name.trim()}
                className="w-full py-3 rounded-xl bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-40">
                Join Chat
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-2 opacity-30">
                  <span className="text-2xl">💬</span>
                  <p className="text-xs text-white/40">No messages yet. Say hi!</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isMe = msg.id === visitorId.current
                const prevMsg = messages[i - 1]
                const sameSender = prevMsg && prevMsg.id === msg.id
                const showName = !isMe && !sameSender

                return (
                  <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${sameSender ? 'mt-0.5' : 'mt-3'}`}>
                    {/* Name tag for others */}
                    {showName && (
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-white"
                          style={{ background: msg.color }}>
                          {msg.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-[11px] font-medium" style={{ color: msg.color }}>{msg.name}</span>
                      </div>
                    )}
                    {/* Bubble */}
                    <div className={`max-w-[75%] px-3.5 py-2 text-[13px] leading-relaxed ${
                      isMe
                        ? 'bg-blue-500 text-white rounded-2xl rounded-br-md'
                        : 'bg-white/[0.06] text-white/85 rounded-2xl rounded-bl-md'
                    }`}>
                      <span>{msg.text}</span>
                      <span className={`text-[9px] ml-2 inline-block align-bottom ${isMe ? 'text-white/40' : 'text-white/20'}`}>
                        {timeStr(msg.ts)}
                      </span>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Typing indicator */}
            {typing.size > 0 && (
              <div className="px-4 py-1 text-[10px] text-white/25 flex-shrink-0">
                {[...typing].join(', ')} {typing.size === 1 ? 'is' : 'are'} typing...
              </div>
            )}

            {/* Input */}
            <form onSubmit={sendMessage} className="px-3 py-3 border-t border-white/5 flex gap-2 flex-shrink-0">
              <input
                value={message}
                onChange={handleInput}
                placeholder="Type a message..."
                maxLength={280}
                className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 outline-none focus:border-white/20"
              />
              <button type="submit" disabled={!message.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors disabled:opacity-30">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </form>
          </>
        )}

        {/* Footer */}
        <div className="px-4 py-1.5 border-t border-white/5 text-center flex-shrink-0">
          <span className="text-[9px] text-white/15">Supabase Realtime · Messages are not stored</span>
        </div>
      </div>

      <style>{`
        @keyframes chat-in {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  )
}
