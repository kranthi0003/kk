import React, { useEffect, useRef, useState, useCallback } from 'react'
import supabase from '../lib/supabase'

// ============================================================
// STRANGER CHAT — Anonymous P2P text chat
// - Supabase Realtime for signaling (presence + broadcast)
// - WebRTC DataChannel for actual messages (no relay)
// ============================================================

const LOBBY_CHANNEL = 'stranger-chat:lobby'
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
]

// Connection states
const PHASE = {
  WELCOME:   'welcome',    // initial screen w/ disclaimer
  SEARCHING: 'searching',  // looking for a partner
  CONNECTING:'connecting', // peer found, negotiating
  CHATTING:  'chatting',   // DataChannel open
  ENDED:     'ended',      // peer disconnected
}

export default function StrangerChat({ onBack }) {
  const [phase, setPhase]       = useState(PHASE.WELCOME)
  const [messages, setMessages] = useState([])
  const [draft, setDraft]       = useState('')
  const [peerTyping, setPeerTyping] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)

  const myIdRef         = useRef(crypto.randomUUID())
  const peerIdRef       = useRef(null)
  const channelRef      = useRef(null)
  const pcRef           = useRef(null)
  const dcRef           = useRef(null)
  const messagesEndRef  = useRef(null)
  const typingTimerRef  = useRef(null)
  const negotiatingRef  = useRef(false)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, peerTyping])

  // ─── Teardown helper ─────────────────────────────────────────────
  const teardown = useCallback(() => {
    try { dcRef.current?.close() } catch {}
    try { pcRef.current?.close() } catch {}
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    pcRef.current = null
    dcRef.current = null
    peerIdRef.current = null
    negotiatingRef.current = false
  }, [])

  useEffect(() => () => teardown(), [teardown])

  // ─── Send signaling message via Supabase broadcast ───────────────
  const sendSignal = useCallback((to, kind, data) => {
    channelRef.current?.send({
      type: 'broadcast',
      event: 'sig',
      payload: { from: myIdRef.current, to, kind, data },
    })
  }, [])

  // ─── Setup WebRTC peer connection ────────────────────────────────
  const setupPeer = useCallback((isInitiator, partnerId) => {
    peerIdRef.current = partnerId
    setPhase(PHASE.CONNECTING)

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pcRef.current = pc

    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal(partnerId, 'ice', e.candidate)
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
        handlePeerLeft()
      }
    }

    const wireDataChannel = (dc) => {
      dcRef.current = dc
      dc.onopen = () => {
        setPhase(PHASE.CHATTING)
        setMessages([{ id: crypto.randomUUID(), from: 'system', text: 'Connected to a stranger. Say hi 👋', t: Date.now() }])
      }
      dc.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data)
          if (parsed.type === 'msg') {
            setMessages(m => [...m, { id: crypto.randomUUID(), from: 'them', text: parsed.text, t: Date.now() }])
            setPeerTyping(false)
          } else if (parsed.type === 'typing') {
            setPeerTyping(true)
            clearTimeout(typingTimerRef.current)
            typingTimerRef.current = setTimeout(() => setPeerTyping(false), 2500)
          } else if (parsed.type === 'bye') {
            handlePeerLeft()
          }
        } catch {}
      }
      dc.onclose = () => handlePeerLeft()
    }

    if (isInitiator) {
      const dc = pc.createDataChannel('chat', { ordered: true })
      wireDataChannel(dc)
      negotiatingRef.current = true
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => sendSignal(partnerId, 'offer', pc.localDescription))
    } else {
      pc.ondatachannel = (e) => wireDataChannel(e.channel)
    }
  }, [sendSignal])

  const handlePeerLeft = useCallback(() => {
    setMessages(m => [...m, { id: crypto.randomUUID(), from: 'system', text: 'Stranger disconnected.', t: Date.now() }])
    setPhase(PHASE.ENDED)
    try { dcRef.current?.close() } catch {}
    try { pcRef.current?.close() } catch {}
    pcRef.current = null
    dcRef.current = null
    peerIdRef.current = null
    negotiatingRef.current = false
  }, [])

  // ─── Lobby: join + try to match ──────────────────────────────────
  const startSearching = useCallback(() => {
    teardown()
    setMessages([])
    setPeerTyping(false)
    setPhase(PHASE.SEARCHING)

    const ch = supabase.channel(LOBBY_CHANNEL, {
      config: { presence: { key: myIdRef.current }, broadcast: { self: false } },
    })
    channelRef.current = ch

    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState()
      // Only look at peers also in 'looking' state and not me, not already paired
      const looking = Object.entries(state)
        .filter(([id, list]) => id !== myIdRef.current && list.some(p => p.status === 'looking'))
        .map(([id]) => id)

      setOnlineCount(Object.keys(state).length)

      if (peerIdRef.current || negotiatingRef.current) return
      if (looking.length === 0) return

      // Deterministic pairing: lower UUID is initiator
      const partner = looking.sort()[0]
      const amInitiator = myIdRef.current < partner
      // Mark as paired in presence so others skip me
      ch.track({ status: 'paired', with: partner })
      if (amInitiator) setupPeer(true, partner)
      // Responder waits for the offer
    })

    ch.on('broadcast', { event: 'sig' }, ({ payload }) => {
      if (payload.to !== myIdRef.current) return
      const { from, kind, data } = payload

      // If we receive an offer without yet having a peer, treat sender as our partner
      if (kind === 'offer') {
        if (!peerIdRef.current) {
          ch.track({ status: 'paired', with: from })
          setupPeer(false, from)
        }
        if (peerIdRef.current === from && pcRef.current) {
          pcRef.current.setRemoteDescription(data)
            .then(() => pcRef.current.createAnswer())
            .then(ans => pcRef.current.setLocalDescription(ans))
            .then(() => sendSignal(from, 'answer', pcRef.current.localDescription))
        }
      } else if (kind === 'answer' && peerIdRef.current === from && pcRef.current) {
        pcRef.current.setRemoteDescription(data)
      } else if (kind === 'ice' && peerIdRef.current === from && pcRef.current) {
        pcRef.current.addIceCandidate(data).catch(() => {})
      } else if (kind === 'bye' && peerIdRef.current === from) {
        handlePeerLeft()
      }
    })

    ch.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await ch.track({ status: 'looking' })
      }
    })
  }, [setupPeer, sendSignal, teardown, handlePeerLeft])

  // ─── User actions ────────────────────────────────────────────────
  const sendMessage = () => {
    const text = draft.trim()
    if (!text || !dcRef.current || dcRef.current.readyState !== 'open') return
    dcRef.current.send(JSON.stringify({ type: 'msg', text }))
    setMessages(m => [...m, { id: crypto.randomUUID(), from: 'me', text, t: Date.now() }])
    setDraft('')
  }

  const handleInputChange = (e) => {
    setDraft(e.target.value)
    if (dcRef.current?.readyState === 'open') {
      try { dcRef.current.send(JSON.stringify({ type: 'typing' })) } catch {}
    }
  }

  const next = () => {
    // Tell current peer we're leaving
    if (dcRef.current?.readyState === 'open') {
      try { dcRef.current.send(JSON.stringify({ type: 'bye' })) } catch {}
    }
    if (peerIdRef.current) sendSignal(peerIdRef.current, 'bye', null)
    startSearching()
  }

  const stop = () => {
    if (dcRef.current?.readyState === 'open') {
      try { dcRef.current.send(JSON.stringify({ type: 'bye' })) } catch {}
    }
    if (peerIdRef.current) sendSignal(peerIdRef.current, 'bye', null)
    teardown()
    setPhase(PHASE.WELCOME)
    setMessages([])
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-30 thq-nav-surface backdrop-blur-xl border-b"
        style={{ borderBottomColor: 'color-mix(in oklab, var(--chart-1) 22%, var(--color-border))' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <button onClick={onBack || (() => { window.location.hash = ''; window.location.reload() })}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm group">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'color-mix(in oklab, var(--chart-1) 8%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 22%, transparent)' }}>
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </span>
            <span className="hidden sm:inline">Back to site</span>
          </button>
          <div className="text-center flex-1 min-w-0">
            <h1 className="font-heading text-foreground text-base sm:text-lg font-semibold flex items-center justify-center gap-2 tracking-tight">
              <span className="text-lg">💬</span>
              <span>Stranger <span className="text-gradient-violet">Chat</span></span>
            </h1>
            <p className="text-[10.5px] text-muted-foreground hidden sm:block tracking-wide">
              Anonymous · P2P encrypted · {onlineCount} online
            </p>
          </div>
          <div className="w-20 sm:w-28 flex-shrink-0 text-right">
            <StatusPill phase={phase} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-3 min-h-0">
        {phase === PHASE.WELCOME && (
          <WelcomeScreen onStart={startSearching} />
        )}

        {phase === PHASE.SEARCHING && (
          <SearchingScreen onCancel={stop} />
        )}

        {phase === PHASE.CONNECTING && (
          <ConnectingScreen onCancel={stop} />
        )}

        {(phase === PHASE.CHATTING || phase === PHASE.ENDED) && (
          <>
            <div className="flex-1 overflow-y-auto bg-card pr-tint-violet p-4 space-y-2">
              {messages.map(m => <MessageBubble key={m.id} msg={m} />)}
              {peerTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="bg-card pr-tint-magenta p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={handleInputChange}
                  onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
                  disabled={phase !== PHASE.CHATTING}
                  placeholder={phase === PHASE.CHATTING ? 'Type a message…' : 'Stranger disconnected — hit Next'}
                  className="flex-1 bg-background border border-border/40 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500/60 disabled:opacity-50"
                  maxLength={500}
                />
                {phase === PHASE.CHATTING ? (
                  <button onClick={sendMessage} disabled={!draft.trim()}
                    className="px-4 py-2 rounded-md text-sm font-semibold transition-all disabled:opacity-40"
                    style={{
                      background: 'color-mix(in oklab, var(--chart-1) 22%, transparent)',
                      color: 'var(--color-foreground)',
                      boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-1) 45%, transparent)',
                    }}>
                    Send
                  </button>
                ) : (
                  <button onClick={startSearching}
                    className="px-4 py-2 rounded-md text-sm font-semibold transition-all"
                    style={{
                      background: 'color-mix(in oklab, var(--chart-2) 22%, transparent)',
                      color: 'var(--color-foreground)',
                      boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--chart-2) 45%, transparent)',
                    }}>
                    Find new →
                  </button>
                )}
              </div>
              <div className="flex justify-between items-center mt-2 px-1">
                <p className="text-[10px] text-muted-foreground">
                  {phase === PHASE.CHATTING ? '🔒 Messages are direct peer-to-peer · not stored' : 'Press Find new to match with someone else'}
                </p>
                {phase === PHASE.CHATTING && (
                  <div className="flex gap-1.5">
                    <button onClick={next} className="text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5">Next →</button>
                    <button onClick={stop} className="text-[11px] text-red-400 hover:text-red-300 transition-colors px-2 py-0.5">End</button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="border-t border-border/30 py-3 text-center">
        <span className="text-[10px] text-muted-foreground/60 font-mono">No logs · be kind · 18+</span>
      </div>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────

function StatusPill({ phase }) {
  const map = {
    [PHASE.WELCOME]:    { color: 'var(--color-muted-foreground)', text: 'Idle' },
    [PHASE.SEARCHING]:  { color: 'oklch(75% 0.18 60)', text: 'Searching' },
    [PHASE.CONNECTING]: { color: 'oklch(70% 0.18 280)', text: 'Connecting' },
    [PHASE.CHATTING]:   { color: 'oklch(70% 0.20 145)', text: 'Connected' },
    [PHASE.ENDED]:      { color: 'oklch(65% 0.22 25)', text: 'Ended' },
  }
  const cur = map[phase]
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
      style={{ background: `color-mix(in oklab, ${cur.color} 14%, transparent)`, color: cur.color, boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${cur.color} 35%, transparent)` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cur.color, boxShadow: `0 0 6px ${cur.color}` }} />
      {cur.text}
    </span>
  )
}

function WelcomeScreen({ onStart }) {
  const [accepted, setAccepted] = useState(false)
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="bg-card pr-tint-violet p-8 max-w-lg w-full text-center">
        <div className="text-5xl mb-4">💬</div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight mb-2">
          Talk to a random <span className="text-gradient-violet">stranger</span>
        </h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          You'll be paired with someone else on this page. Messages are direct peer-to-peer (WebRTC), nothing is stored on a server.
        </p>

        <div className="bg-background/50 border border-border/40 rounded-lg p-4 text-left mb-6">
          <p className="text-[11px] font-semibold text-foreground mb-2 uppercase tracking-wider">Ground rules</p>
          <ul className="text-[12px] text-muted-foreground space-y-1.5">
            <li className="flex gap-2"><span className="text-violet-400">·</span> Be kind. No harassment, hate, or threats.</li>
            <li className="flex gap-2"><span className="text-violet-400">·</span> Don't share personal info you'd regret.</li>
            <li className="flex gap-2"><span className="text-violet-400">·</span> 18+. If you're uncomfortable, hit <b>Next</b> or <b>End</b>.</li>
            <li className="flex gap-2"><span className="text-violet-400">·</span> Conversations aren't logged anywhere.</li>
          </ul>
        </div>

        <label className="flex items-center gap-2 mb-5 cursor-pointer justify-center text-xs text-muted-foreground">
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="w-4 h-4 accent-violet-500" />
          I'm 18+ and agree to the ground rules.
        </label>

        <button
          onClick={onStart}
          disabled={!accepted}
          className="w-full py-3 rounded-md font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: accepted ? 'linear-gradient(135deg, oklch(60% 0.22 290), oklch(65% 0.25 330))' : 'rgba(255,255,255,0.08)',
            color: 'white',
            boxShadow: accepted ? '0 4px 24px -4px color-mix(in oklab, var(--chart-1) 50%, transparent)' : 'none',
          }}
        >
          Start chatting →
        </button>
      </div>
    </div>
  )
}

function SearchingScreen({ onCancel }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="bg-card pr-tint-magenta p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-5">
          <div className="relative w-16 h-16">
            <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'color-mix(in oklab, var(--chart-1) 30%, transparent)' }} />
            <span className="absolute inset-2 rounded-full animate-ping" style={{ background: 'color-mix(in oklab, var(--chart-2) 30%, transparent)', animationDelay: '0.3s' }} />
            <span className="absolute inset-0 flex items-center justify-center text-2xl">🔍</span>
          </div>
        </div>
        <h2 className="font-heading text-xl font-semibold tracking-tight mb-2">Looking for a stranger…</h2>
        <p className="text-sm text-muted-foreground mb-5">First person to join after you is your match. Usually takes a few seconds.</p>
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
      </div>
    </div>
  )
}

function ConnectingScreen({ onCancel }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="bg-card pr-tint-violet p-8 max-w-md w-full text-center">
        <div className="text-3xl mb-3">🤝</div>
        <h2 className="font-heading text-xl font-semibold tracking-tight mb-2">Establishing connection…</h2>
        <p className="text-sm text-muted-foreground mb-5">Negotiating a direct WebRTC channel. This is fast — usually under a second.</p>
        <div className="flex justify-center gap-1 mb-5">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--chart-1)', animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <button onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
      </div>
    </div>
  )
}

function MessageBubble({ msg }) {
  if (msg.from === 'system') {
    return (
      <div className="text-center">
        <span className="inline-block text-[11px] text-muted-foreground italic px-3 py-1 rounded-full"
          style={{ background: 'color-mix(in oklab, var(--chart-1) 8%, transparent)' }}>
          {msg.text}
        </span>
      </div>
    )
  }
  const isMe = msg.from === 'me'
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[75%] px-3 py-2 rounded-2xl text-sm break-words"
        style={isMe ? {
          background: 'linear-gradient(135deg, oklch(60% 0.22 290), oklch(60% 0.25 320))',
          color: 'white',
          borderBottomRightRadius: 4,
        } : {
          background: 'color-mix(in oklab, var(--color-foreground) 6%, var(--color-card))',
          color: 'var(--color-foreground)',
          boxShadow: 'inset 0 0 0 1px var(--color-border)',
          borderBottomLeftRadius: 4,
        }}
      >
        {msg.text}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="px-3 py-2 rounded-2xl flex items-center gap-1"
        style={{ background: 'color-mix(in oklab, var(--color-foreground) 6%, var(--color-card))', boxShadow: 'inset 0 0 0 1px var(--color-border)', borderBottomLeftRadius: 4 }}>
        {[0, 1, 2].map(i => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}
