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

export default function MusicPage({ onBack }) {
  const amb = useAmbient() || {}
  const { playing, track: current, currentId, toggle, next, prev, loop, toggleLoop, playQueue } = amb

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

  return (
    <div className="min-h-screen text-foreground" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-32">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
            Back
          </button>
          <span className="text-[11px] font-mono text-muted-foreground/60">{session ? '\u2601 synced' : 'saved on this device'}</span>
        </div>

        <div className="flex items-end gap-4 mb-8">
          <div className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(140deg, ${ACCENT}, color-mix(in oklab, ${ACCENT} 55%, var(--color-primary)))` }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="var(--color-accent-foreground)"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" fill="none" stroke="var(--color-accent-foreground)" strokeWidth="2" /><circle cx="18" cy="16" r="3" fill="none" stroke="var(--color-accent-foreground)" strokeWidth="2" /></svg>
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Music</div>
            <h1 className="font-heading text-[2rem] leading-tight font-semibold">Your Library</h1>
            <p className="text-[13px] text-muted-foreground">Play the radio, or build your own playlists.</p>
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
            {playlists.map(pl => (
              <div key={pl.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)', background: 'color-mix(in oklab, var(--color-card) 55%, transparent)' }}>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <button onClick={() => pl.tracks.length && playQueue(pl.tracks, 0)} disabled={!pl.tracks.length}
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-transform hover:scale-105"
                    style={{ background: ACCENT, color: 'var(--color-accent-foreground)' }} title="Play playlist">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}><path d="M8 5v14l11-7z" /></svg>
                  </button>
                  <button onClick={() => setOpenId(openId === pl.id ? null : pl.id)} className="flex-1 min-w-0 text-left">
                    <div className="text-[14px] font-semibold text-foreground truncate">{pl.name}</div>
                    <div className="text-[11.5px] text-muted-foreground">{pl.tracks.length} {pl.tracks.length === 1 ? 'song' : 'songs'}</div>
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
            ))}
          </div>
        </Section>

        {/* Kranthi's Radio (library) */}
        <Section title="Kranthi's Radio" sub={`${TRACKS.length} songs`}>
          <div className="space-y-0.5">
            {TRACKS.map((t, i) => {
              const isCur = currentId === t.id
              return (
                <div key={t.id} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/40" style={{ background: isCur ? `color-mix(in oklab, ${ACCENT} 10%, transparent)` : 'transparent' }}>
                  <button onClick={() => (isCur ? toggle && toggle() : playQueue(TRACKS, i))} className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 text-muted-foreground group-hover:text-foreground" title={isCur && playing ? 'Pause' : 'Play'}>
                    {isCur && playing
                      ? <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></svg>
                      : <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 1 }}><path d="M8 5v14l11-7z" /></svg>}
                  </button>
                  <img src={thumb(t.id)} alt="" loading="lazy" className="w-9 h-9 rounded object-cover flex-shrink-0" style={{ border: '1px solid var(--color-border)' }} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] truncate" style={{ color: isCur ? ACCENT : 'var(--color-foreground)' }}>{t.title}</span>
                    <span className="block text-[11px] text-muted-foreground truncate">{t.by}</span>
                  </span>
                  <button onClick={() => setAddFor(t)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground px-2 transition-opacity flex-shrink-0" title="Add to playlist">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
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
        <div className="fixed bottom-0 left-0 right-0 z-[1100]" style={{ background: 'color-mix(in oklab, var(--color-card) 92%, transparent)', backdropFilter: 'blur(12px)', borderTop: '1px solid var(--color-border)' }}>
          <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center gap-3">
            <img src={thumb(current.id)} alt="" className="w-11 h-11 rounded object-cover flex-shrink-0" style={{ border: '1px solid var(--color-border)' }} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate text-foreground">{current.title}</div>
              <div className="text-[11px] text-muted-foreground truncate">{current.by || 'ambient radio'}</div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => prev && prev()} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground" title="Previous"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg></button>
              <button onClick={() => toggle && toggle()} className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105" style={{ background: ACCENT, color: 'var(--color-accent-foreground)' }} title={playing ? 'Pause' : 'Play'}>{NowIcon}</button>
              <button onClick={() => next && next()} className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground" title="Next"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zm-2.5 6L5 6v12z" /></svg></button>
              <button onClick={() => toggleLoop && toggleLoop()} className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ color: loop ? ACCENT : 'var(--color-muted-foreground)' }} title={loop ? 'Loop: on' : 'Loop: off'} aria-pressed={!!loop}>
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
