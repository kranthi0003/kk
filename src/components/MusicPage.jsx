import React, { useState, useEffect, useRef } from 'react'
import { useAmbient, TRACKS } from './AmbientContext'
import { getSession, onAuthChange, signInWithEmail, signOut, fetchCloudPlaylists, saveCloudPlaylists } from '../lib/musicCloud'

// ============================================================
// MUSIC — a Spotify-like page. "Kranthi's Radio" is the curated
// library; visitors can build their own playlists (saved in their
// browser via localStorage — per device, no account) and play them
// through the site's persistent ambient player.
// ============================================================

const LS_KEY = 'music:playlists'
const uid = () => 'pl_' + Math.random().toString(36).slice(2, 9)
const loadPlaylists = () => { try { return JSON.parse(localStorage.getItem(LS_KEY)) || [] } catch { return [] } }
const savePlaylists = (pls) => { try { localStorage.setItem(LS_KEY, JSON.stringify(pls)) } catch {} }

// A YouTube URL (any form) or a bare 11-char id → video id.
function parseYouTubeId(input) {
  if (!input) return null
  const s = String(input).trim()
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s
  const m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|\/v\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

// Best-effort title/artist for an id. noembed is CORS-friendly; if it fails,
// we still add the track with a placeholder the user can rename.
async function fetchMeta(id) {
  try {
    const r = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`)
    if (r.ok) {
      const j = await r.json()
      if (j && j.title && !j.error) {
        let by = j.author_name || ''
        by = by.replace(/\s*-\s*Topic$/, '').replace(/VEVO$/, '')
        return { title: j.title, by }
      }
    }
  } catch {}
  return { title: 'YouTube track', by: '' }
}

const thumb = (id) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
const ACCENT = 'var(--color-accent)'

// Deterministic, on-theme colourful cover per playlist (two-hue oklch
// gradient seeded from the id, tuned to sit nicely on the dark theme).
const COVER_HUES = [255, 285, 320, 20, 45, 145, 175, 210]
function coverGradient(seed = '') {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  const a = COVER_HUES[h % COVER_HUES.length]
  const b = COVER_HUES[(h >> 3) % COVER_HUES.length]
  return `linear-gradient(140deg, oklch(64% 0.14 ${a}), oklch(50% 0.13 ${b}))`
}

function shuffleArr(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]] }
  return a
}

const fmtTime = (s) => {
  if (!s || !isFinite(s)) return '0:00'
  const m = Math.floor(s / 60), sec = Math.floor(s % 60)
  return `${m}:${sec < 10 ? '0' : ''}${sec}`
}

// Animated equalizer bars — shows a track is playing.
function Eq({ color = 'currentColor', size = 12 }) {
  return (
    <span className="mp-eq" style={{ height: size }} aria-hidden="true">
      {[0, 1, 2, 3].map(n => <span key={n} style={{ background: color, animationDelay: `${n * 0.15}s` }} />)}
    </span>
  )
}

const MP_STYLE = `
  .mp-eq{ display:inline-flex; align-items:flex-end; gap:2px; }
  .mp-eq > span{ width:2.5px; height:40%; border-radius:2px; animation: mpEq .9s ease-in-out infinite; }
  .mp-eq > span:nth-child(2){ animation-duration:1.1s } .mp-eq > span:nth-child(3){ animation-duration:.75s } .mp-eq > span:nth-child(4){ animation-duration:1s }
  @keyframes mpEq{ 0%,100%{height:30%} 50%{height:100%} }
  @keyframes mpGlow{ 0%,100%{opacity:.5; transform:translateY(0)} 50%{opacity:.85; transform:translateY(-3px)} }
  .mp-cover-glow{ animation: mpGlow 6s ease-in-out infinite; }
  @media (prefers-reduced-motion: reduce){ .mp-eq > span, .mp-cover-glow{ animation:none } }
`

export default function MusicPage({ onBack }) {
  const amb = useAmbient() || {}
  const { playing, track: current, currentId, toggle, next, prev, loop, toggleLoop, playQueue, getProgress } = amb
  const [progress, setProgress] = useState({ elapsed: 0, duration: 0 })

  const [playlists, setPlaylists] = useState(loadPlaylists)
  const [openId, setOpenId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [addFor, setAddFor] = useState(null) // track pending "add to playlist"
  const [linkFor, setLinkFor] = useState(null) // playlist id awaiting a link
  const [linkVal, setLinkVal] = useState('')
  const [busy, setBusy] = useState(false)
  const firstSave = useRef(true)

  // --- cloud sync (optional; email magic-link) ---
  const [session, setSession] = useState(null)
  const [email, setEmail] = useState('')
  const [syncNote, setSyncNote] = useState('') // transient status message
  const playlistsRef = useRef(playlists)
  playlistsRef.current = playlists
  const cloudReady = useRef(false)
  const cloudTimer = useRef(null)

  // Watch auth state.
  useEffect(() => {
    let alive = true
    getSession().then(s => { if (alive) setSession(s) })
    const unsub = onAuthChange(s => { setSession(s); if (!s) cloudReady.current = false })
    return () => { alive = false; unsub() }
  }, [])

  // On sign-in, pull the cloud copy and merge local playlists into it so
  // nothing is lost, then treat the cloud as the source of truth.
  useEffect(() => {
    if (!session) return
    let alive = true
    ;(async () => {
      const { data: cloud, error } = await fetchCloudPlaylists()
      if (!alive) return
      const local = playlistsRef.current
      let merged
      if (Array.isArray(cloud)) {
        merged = [...cloud, ...local.filter(l => !cloud.some(c => c.id === l.id))]
      } else {
        merged = local // no cloud row yet → seed it from local
        if (error && error !== 'not-signed-in') { setSyncNote('Sync isn\u2019t set up yet — using this device only.'); return }
      }
      setPlaylists(merged)
      cloudReady.current = true
      const res = await saveCloudPlaylists(merged)
      if (res.error && res.error !== 'not-signed-in') setSyncNote('Sync isn\u2019t set up yet — using this device only.')
      else setSyncNote('')
    })()
    return () => { alive = false }
  }, [session])

  // Persist changes: localStorage always; cloud too when signed in (debounced).
  useEffect(() => {
    if (firstSave.current) { firstSave.current = false; return }
    savePlaylists(playlists)
    if (session && cloudReady.current) {
      clearTimeout(cloudTimer.current)
      cloudTimer.current = setTimeout(() => { saveCloudPlaylists(playlistsRef.current) }, 700)
    }
  }, [playlists, session])

  const sendMagicLink = async () => {
    const e = email.trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { setSyncNote('Enter a valid email.'); return }
    setBusy(true); setSyncNote('')
    try { await signInWithEmail(e); setSyncNote('sent') }
    catch (err) { setSyncNote(err?.message || 'Could not send the link.') }
    setBusy(false)
  }

  const openPl = playlists.find(p => p.id === openId) || null

  // ---- playlist mutations ----
  const createPlaylist = (name, firstTrack) => {
    const pl = { id: uid(), name: (name || 'New playlist').trim().slice(0, 60), tracks: firstTrack ? [firstTrack] : [] }
    setPlaylists(ps => [pl, ...ps])
    return pl.id
  }
  const deletePlaylist = (id) => { setPlaylists(ps => ps.filter(p => p.id !== id)); if (openId === id) setOpenId(null) }
  const renamePlaylist = (id, name) => setPlaylists(ps => ps.map(p => p.id === id ? { ...p, name: name.slice(0, 60) } : p))
  const addTrack = (id, t) => setPlaylists(ps => ps.map(p => p.id === id
    ? (p.tracks.some(x => x.id === t.id) ? p : { ...p, tracks: [...p.tracks, t] }) : p))
  const removeTrack = (id, i) => setPlaylists(ps => ps.map(p => p.id === id ? { ...p, tracks: p.tracks.filter((_, j) => j !== i) } : p))
  const moveTrack = (id, i, dir) => setPlaylists(ps => ps.map(p => {
    if (p.id !== id) return p
    const j = i + dir
    if (j < 0 || j >= p.tracks.length) return p
    const t = [...p.tracks]; const [x] = t.splice(i, 1); t.splice(j, 0, x)
    return { ...p, tracks: t }
  }))

  const addByLink = async (plId) => {
    const id = parseYouTubeId(linkVal)
    if (!id) { setLinkVal(''); return }
    setBusy(true)
    const meta = await fetchMeta(id)
    addTrack(plId, { id, title: meta.title, by: meta.by })
    setBusy(false); setLinkVal(''); setLinkFor(null)
  }

  const NowIcon = playing
    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
    : <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}><path d="M8 5v14l11-7z" /></svg>

  // Poll playback position for the now-playing progress bar (only while a
  // track exists; light 500ms tick).
  useEffect(() => {
    if (!current || !getProgress) return
    const tick = () => setProgress(getProgress())
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [current, getProgress, playing])

  const totalSongs = playlists.reduce((n, p) => n + p.tracks.length, 0)
  const seekPct = progress.duration ? Math.min(100, (progress.elapsed / progress.duration) * 100) : 0

  return (
    <div className="min-h-screen text-foreground" style={{ background: 'var(--color-background)' }}>
      <style>{MP_STYLE}</style>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back
          </button>
          <span className="text-[11px] font-mono text-muted-foreground/60">{session ? '\u2601 synced' : 'saved on this device'}</span>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl mb-7 p-5 sm:p-6" style={{ border: '1px solid color-mix(in oklab, var(--color-accent) 22%, var(--color-border))' }}>
          <div className="mp-cover-glow absolute inset-0 -z-10" style={{ background: 'radial-gradient(120% 120% at 15% 0%, oklch(60% 0.15 285 / 0.28), transparent 55%), radial-gradient(120% 120% at 90% 30%, oklch(62% 0.14 200 / 0.24), transparent 55%), radial-gradient(100% 120% at 60% 100%, oklch(64% 0.14 20 / 0.18), transparent 55%)' }} />
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: 'linear-gradient(140deg, oklch(66% 0.15 285), oklch(52% 0.14 210))', boxShadow: '0 10px 30px -8px oklch(60% 0.15 260 / 0.5)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="#fff"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" fill="none" stroke="#fff" strokeWidth="2" /><circle cx="18" cy="16" r="3" fill="none" stroke="#fff" strokeWidth="2" /></svg>
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-mono uppercase tracking-[0.22em] text-muted-foreground">Music</div>
              <h1 className="font-heading text-[2rem] sm:text-[2.4rem] leading-tight font-semibold">Your Library</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[12px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><b className="text-foreground">{TRACKS.length}</b> in the radio</span>
                <span className="opacity-40">·</span>
                <span className="inline-flex items-center gap-1"><b className="text-foreground">{playlists.length}</b> {playlists.length === 1 ? 'playlist' : 'playlists'}</span>
                <span className="opacity-40">·</span>
                <span className="inline-flex items-center gap-1"><b className="text-foreground">{totalSongs}</b> saved</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button onClick={() => playQueue(TRACKS, 0)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-transform hover:scale-105" style={{ background: ACCENT, color: 'var(--color-accent-foreground)', boxShadow: `0 6px 18px -6px color-mix(in oklab, ${ACCENT} 60%, transparent)` }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}><path d="M8 5v14l11-7z" /></svg>
              Play radio
            </button>
            <button onClick={() => playQueue(shuffleArr(TRACKS), 0)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors" style={{ background: 'color-mix(in oklab, var(--color-foreground) 8%, transparent)', color: 'var(--color-foreground)', boxShadow: 'inset 0 0 0 1px var(--color-border)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" /></svg>
              Shuffle
            </button>
          </div>
        </div>

        {/* Cloud sync (email magic link) */}
        <div className="mb-8 rounded-xl px-4 py-3" style={{ border: '1px solid var(--color-border)', background: 'color-mix(in oklab, var(--color-card) 45%, transparent)' }}>
          {session ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base">☁️</span>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-foreground">Synced across your devices</div>
                  <div className="text-[11px] text-muted-foreground truncate">{session.user?.email}</div>
                </div>
              </div>
              <button onClick={() => signOut()} className="text-[12px] font-medium text-muted-foreground hover:text-foreground flex-shrink-0">Sign out</button>
            </div>
          ) : syncNote === 'sent' ? (
            <div className="flex items-center gap-2">
              <span className="text-base">📬</span>
              <div className="text-[13px] text-foreground">Check your email — tap the link to sign in and sync. <button onClick={() => setSyncNote('')} className="text-[12px] underline ml-1" style={{ color: ACCENT }}>use a different email</button></div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">☁️</span>
                <div className="text-[13px] font-medium text-foreground">Sync across devices</div>
              </div>
              <p className="text-[11.5px] text-muted-foreground mb-2.5">Sign in with your email and your playlists follow you everywhere. No password.</p>
              <div className="flex items-center gap-2">
                <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') sendMagicLink() }}
                  type="email" placeholder="you@email.com" autoComplete="email"
                  className="flex-1 rounded-lg px-3 py-2 text-[13px] bg-transparent outline-none" style={{ border: '1px solid var(--color-border)' }} />
                <button onClick={sendMagicLink} disabled={busy} className="text-[12px] font-semibold px-3.5 py-2 rounded-lg disabled:opacity-50 flex-shrink-0" style={{ background: ACCENT, color: 'var(--color-accent-foreground)' }}>{busy ? 'Sending…' : 'Send link'}</button>
              </div>
              {syncNote && syncNote !== 'sent' && <p className="text-[11px] mt-2" style={{ color: '#f59e0b' }}>{syncNote}</p>}
            </div>
          )}
        </div>

        {/* Your Playlists */}
        <Section title="Your Playlists" action={
          <button onClick={() => { setCreating(v => !v); setNewName('') }} className="text-[12px] font-semibold px-3 py-1.5 rounded-full transition-colors"
            style={{ background: `color-mix(in oklab, ${ACCENT} 16%, transparent)`, color: ACCENT }}>+ New playlist</button>
        }>
          {creating && (
            <div className="flex items-center gap-2 mb-3">
              <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newName.trim()) { createPlaylist(newName); setCreating(false); setNewName('') } if (e.key === 'Escape') setCreating(false) }}
                placeholder="Playlist name…" maxLength={60}
                className="flex-1 rounded-lg px-3 py-2 text-[13px] bg-transparent outline-none" style={{ border: '1px solid var(--color-border)' }} />
              <button onClick={() => { if (newName.trim()) { createPlaylist(newName); setCreating(false); setNewName('') } }}
                className="text-[12px] font-semibold px-3 py-2 rounded-lg" style={{ background: ACCENT, color: 'var(--color-accent-foreground)' }}>Create</button>
            </div>
          )}
          {playlists.length === 0 && !creating && (
            <p className="text-[13px] text-muted-foreground py-2">No playlists yet. Hit <b className="text-foreground">+ New playlist</b>, then add songs from the radio below or by pasting a YouTube link.</p>
          )}
          <div className="space-y-2">
            {playlists.map(pl => {
              const isPlayingThis = pl.tracks.some(t => t.id === currentId)
              return (
              <div key={pl.id} className="rounded-xl overflow-hidden transition-shadow" style={{ border: `1px solid ${openId === pl.id ? 'color-mix(in oklab, var(--color-accent) 34%, var(--color-border))' : 'var(--color-border)'}`, background: 'color-mix(in oklab, var(--color-card) 55%, transparent)' }}>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <button onClick={() => pl.tracks.length && playQueue(pl.tracks, 0)} disabled={!pl.tracks.length}
                    className="relative w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-50 overflow-hidden transition-transform hover:scale-105 group/cover"
                    style={{ background: coverGradient(pl.id), boxShadow: '0 4px 12px -4px rgba(0,0,0,.4)' }} title="Play playlist">
                    <span className="absolute inset-0 flex items-center justify-center transition-colors" style={{ background: 'rgba(0,0,0,0.18)' }}>
                      {isPlayingThis && playing
                        ? <Eq color="#fff" size={14} />
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" className="drop-shadow" style={{ marginLeft: 1 }}><path d="M8 5v14l11-7z" /></svg>}
                    </span>
                  </button>
                  <button onClick={() => setOpenId(openId === pl.id ? null : pl.id)} className="flex-1 min-w-0 text-left">
                    <div className="text-[14px] font-semibold truncate" style={{ color: isPlayingThis ? ACCENT : 'var(--color-foreground)' }}>{pl.name}</div>
                    <div className="text-[11.5px] text-muted-foreground">{pl.tracks.length} {pl.tracks.length === 1 ? 'song' : 'songs'}{isPlayingThis && playing ? ' · now playing' : ''}</div>
                  </button>
                  <button onClick={() => setOpenId(openId === pl.id ? null : pl.id)} className="text-muted-foreground/70 hover:text-foreground p-1" title="Edit">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: openId === pl.id ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><path d="M6 9l6 6 6-6" /></svg>
                  </button>
                </div>

                {openId === pl.id && (
                  <div className="px-3 pb-3 pt-1" style={{ borderTop: '1px solid var(--color-border)' }}>
                    <div className="flex items-center gap-2 my-2">
                      <input value={pl.name} onChange={e => renamePlaylist(pl.id, e.target.value)} maxLength={60}
                        className="flex-1 rounded-lg px-2.5 py-1.5 text-[12.5px] bg-transparent outline-none" style={{ border: '1px solid var(--color-border)' }} />
                      <button onClick={() => deletePlaylist(pl.id)} className="text-[11.5px] font-medium px-2.5 py-1.5 rounded-lg text-red-400 hover:text-red-300" style={{ border: '1px solid color-mix(in oklab, #ef4444 30%, var(--color-border))' }}>Delete</button>
                    </div>

                    {pl.tracks.length === 0 && <p className="text-[12.5px] text-muted-foreground py-1.5">Empty. Add songs from the radio below (the ⋯ menu) or paste a link.</p>}
                    <div className="space-y-1">
                      {pl.tracks.map((t, i) => {
                        const isCur = currentId === t.id
                        return (
                          <div key={t.id + i} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5" style={{ background: isCur ? `color-mix(in oklab, ${ACCENT} 12%, transparent)` : 'transparent' }}>
                            <button onClick={() => playQueue(pl.tracks, i)} className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-foreground" title="Play">
                              {isCur && playing
                                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                                : <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}><path d="M8 5v14l11-7z" /></svg>}
                            </button>
                            <span className="flex-1 min-w-0">
                              <span className="block text-[12.5px] truncate" style={{ color: isCur ? ACCENT : 'var(--color-foreground)' }}>{t.title}</span>
                              {t.by && <span className="block text-[10.5px] text-muted-foreground truncate">{t.by}</span>}
                            </span>
                            <button onClick={() => moveTrack(pl.id, i, -1)} disabled={i === 0} className="text-muted-foreground/60 hover:text-foreground disabled:opacity-25 p-0.5" title="Up">▲</button>
                            <button onClick={() => moveTrack(pl.id, i, 1)} disabled={i === pl.tracks.length - 1} className="text-muted-foreground/60 hover:text-foreground disabled:opacity-25 p-0.5" title="Down">▼</button>
                            <button onClick={() => removeTrack(pl.id, i)} className="text-muted-foreground/60 hover:text-red-400 p-0.5" title="Remove">✕</button>
                          </div>
                        )
                      })}
                    </div>

                    {linkFor === pl.id ? (
                      <div className="flex items-center gap-2 mt-2.5">
                        <input autoFocus value={linkVal} onChange={e => setLinkVal(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') addByLink(pl.id); if (e.key === 'Escape') { setLinkFor(null); setLinkVal('') } }}
                          placeholder="Paste a YouTube link…"
                          className="flex-1 rounded-lg px-2.5 py-1.5 text-[12.5px] bg-transparent outline-none" style={{ border: '1px solid var(--color-border)' }} />
                        <button onClick={() => addByLink(pl.id)} disabled={busy} className="text-[11.5px] font-semibold px-2.5 py-1.5 rounded-lg disabled:opacity-50" style={{ background: ACCENT, color: 'var(--color-accent-foreground)' }}>{busy ? '…' : 'Add'}</button>
                      </div>
                    ) : (
                      <button onClick={() => { setLinkFor(pl.id); setLinkVal('') }} className="mt-2.5 text-[11.5px] font-medium" style={{ color: ACCENT }}>+ Add by YouTube link</button>
                    )}
                  </div>
                )}
              </div>
              )
            })}
          </div>
        </Section>

        {/* Kranthi's Radio (library) */}
        <Section title="Kranthi's Radio" sub={`${TRACKS.length} songs`}>
          <div className="space-y-0.5">
            {TRACKS.map((t, i) => {
              const isCur = currentId === t.id
              return (
                <div key={t.id} className="group flex items-center gap-3 rounded-lg pl-2 pr-2 py-1.5 transition-colors hover:bg-muted/40" style={{ background: isCur ? `color-mix(in oklab, ${ACCENT} 12%, transparent)` : 'transparent' }}>
                  <span className="w-5 text-center flex-shrink-0 relative">
                    <span className={`text-[11px] font-mono tabular-nums ${isCur ? 'opacity-0' : 'text-muted-foreground/50 group-hover:opacity-0'} transition-opacity`}>{i + 1}</span>
                    <button onClick={() => (isCur ? toggle && toggle() : playQueue(TRACKS, i))} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: isCur ? ACCENT : 'var(--color-foreground)', opacity: isCur ? 1 : undefined }} title={isCur && playing ? 'Pause' : 'Play'}>
                      {isCur && playing
                        ? <Eq color={ACCENT} size={13} />
                        : <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}><path d="M8 5v14l11-7z" /></svg>}
                    </button>
                  </span>
                  <img src={thumb(t.id)} alt="" loading="lazy" className="w-9 h-9 rounded object-cover flex-shrink-0" style={{ border: '1px solid var(--color-border)' }} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] truncate" style={{ color: isCur ? ACCENT : 'var(--color-foreground)' }}>{t.title}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">{t.by}</span>
                  </span>
                  <button onClick={() => setAddFor(t)} className="opacity-0 group-hover:opacity-100 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all flex-shrink-0 inline-flex items-center gap-1" style={{ color: ACCENT, background: `color-mix(in oklab, ${ACCENT} 12%, transparent)` }} title="Add to playlist">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    Add
                  </button>
                </div>
              )
            })}
          </div>
        </Section>
      </div>

      {/* "Add to playlist" chooser */}
      {addFor && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setAddFor(null)}>
          <div className="w-full max-w-xs rounded-2xl overflow-hidden" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div className="text-[13px] font-semibold text-foreground truncate">Add to playlist</div>
              <div className="text-[11px] text-muted-foreground truncate">{addFor.title}</div>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              <button onClick={() => { const id = createPlaylist('New playlist', addFor); setAddFor(null); setOpenId(id) }}
                className="w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium flex items-center gap-2" style={{ color: ACCENT }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                New playlist
              </button>
              {playlists.map(pl => (
                <button key={pl.id} onClick={() => { addTrack(pl.id, addFor); setAddFor(null) }}
                  className="w-full text-left px-3 py-2 rounded-lg text-[13px] hover:bg-muted/50 flex items-center justify-between gap-2">
                  <span className="truncate text-foreground">{pl.name}</span>
                  <span className="text-[11px] text-muted-foreground flex-shrink-0">{pl.tracks.some(x => x.id === addFor.id) ? '✓ added' : `${pl.tracks.length}`}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Now-playing bar */}
      {current && (
        <div className="fixed bottom-0 left-0 right-0 z-[1100]" style={{ background: 'color-mix(in oklab, var(--color-card) 92%, transparent)', backdropFilter: 'blur(12px)', borderTop: '1px solid color-mix(in oklab, var(--color-accent) 20%, var(--color-border))' }}>
          {/* progress */}
          <div className="h-[3px] w-full" style={{ background: 'color-mix(in oklab, var(--color-foreground) 8%, transparent)' }}>
            <div className="h-full transition-[width] duration-500 ease-linear" style={{ width: `${seekPct}%`, background: `linear-gradient(90deg, oklch(66% 0.15 285), ${ACCENT})` }} />
          </div>
          <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <img src={thumb(current.id)} alt="" className="w-11 h-11 rounded object-cover" style={{ border: '1px solid var(--color-border)' }} />
              {playing && <span className="absolute inset-0 flex items-center justify-center rounded" style={{ background: 'rgba(0,0,0,0.35)' }}><Eq color="#fff" size={14} /></span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate text-foreground">{current.title}</div>
              <div className="text-[11px] text-muted-foreground truncate flex items-center gap-1.5">
                <span className="font-mono tabular-nums">{fmtTime(progress.elapsed)}</span>
                <span className="opacity-40">/</span>
                <span className="font-mono tabular-nums opacity-70">{fmtTime(progress.duration)}</span>
                <span className="opacity-40 truncate">· {current.by || 'ambient radio'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => prev && prev()} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground" title="Previous"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg></button>
              <button onClick={() => toggle && toggle()} className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105" style={{ background: ACCENT, color: 'var(--color-accent-foreground)', boxShadow: `0 4px 14px -4px color-mix(in oklab, ${ACCENT} 60%, transparent)` }} title={playing ? 'Pause' : 'Play'}>{NowIcon}</button>
              <button onClick={() => next && next()} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground" title="Next"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zm-2.5 6L5 6v12z" /></svg></button>
              <button onClick={() => toggleLoop && toggleLoop()} className="w-8 h-8 rounded-full items-center justify-center transition-colors hidden sm:flex" style={{ color: loop ? ACCENT : 'var(--color-muted-foreground)' }} title={loop ? 'Loop: on' : 'Loop: off'} aria-pressed={!!loop}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2l4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, sub, action, children }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-heading text-[1.15rem] font-semibold text-foreground">{title}{sub && <span className="ml-2 text-[12px] font-normal text-muted-foreground">{sub}</span>}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
