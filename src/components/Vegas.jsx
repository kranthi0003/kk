import React, { useState, useRef, useEffect } from 'react'
import { VEGAS_PAYLOAD as PAYLOAD } from '../lib/vegasPayload'
import { LISTS, loadList, saveList, newId } from '../lib/vegasLists'

// Same crypto as the original public/vegas.html — PBKDF2 (SHA-256) → AES-GCM.
// The content stays encrypted at rest in the bundle and only decrypts in the
// browser with the correct passphrase. Plaintext is JSON: { html, days }.
const ITER = PAYLOAD.iter || 200000
const b64ToU8 = (b) => Uint8Array.from(atob(b), c => c.charCodeAt(0))
const enc = new TextEncoder()
const dec = new TextDecoder()

async function deriveKey(pass, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
  )
}

async function unlock(pass) {
  const salt = b64ToU8(PAYLOAD.salt), iv = b64ToU8(PAYLOAD.iv), ct = b64ToU8(PAYLOAD.ct)
  const key = await deriveKey(pass, salt)
  const pt = dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct))
  // Plaintext is JSON { html, days }. Fall back to legacy plain-HTML payloads.
  try {
    const obj = JSON.parse(pt)
    if (obj && typeof obj === 'object' && ('html' in obj || 'days' in obj)) {
      return { html: obj.html || '', days: Array.isArray(obj.days) ? obj.days : [] }
    }
  } catch { /* legacy payload — treat as raw HTML */ }
  return { html: pt, days: [] }
}

// In-memory cache so navigating away and back within the same page load keeps
// it unlocked. Never persisted — a full reload re-prompts.
let cachedData = null

const mapsUrl = (place) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`

// Split text on URLs so they can render as clickable links.
const URL_RE = /(https?:\/\/[^\s]+)/g
const isUrl = (s) => /^https?:\/\/\S+$/i.test(s.trim())
function linkify(text) {
  const parts = String(text).split(URL_RE)
  return parts.map((part, i) =>
    URL_RE.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline break-all" style={{ color: 'var(--color-accent)' }}>{part}</a>
      : <span key={i}>{part}</span>
  )
}

// A single editable list (wishlist / to buy / notes) for one person. Items are
// loaded from and saved to localStorage, so they persist across visits on this
// device. person + listId are fixed for the life of the instance, so the save
// effect is always writing to the right key.
function ListCard({ person, listId, title, placeholder }) {
  const [items, setItems] = useState(() => loadList(person, listId))
  const [draft, setDraft] = useState('')

  useEffect(() => { saveList(person, listId, items) }, [items, person, listId])

  const add = () => {
    const t = draft.trim()
    if (!t) return
    setItems(prev => [...prev, { id: newId(), text: t, done: false, ts: Date.now() }])
    setDraft('')
  }
  const toggle = (id) => setItems(prev => prev.map(i => (i.id === id ? { ...i, done: !i.done } : i)))
  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id))

  const doneCount = items.filter(i => i.done).length

  return (
    <section
      className="rounded-2xl p-4 sm:p-5 mb-4"
      style={{
        background: 'color-mix(in oklab, var(--color-card) 70%, transparent)',
        border: '1px solid var(--color-border)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-[1.05rem]" style={{ fontWeight: 500 }}>{title}</h3>
        {items.length > 0 && (
          <span className="text-[11px] text-muted-foreground tabular-nums">{doneCount}/{items.length}</span>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); add() }} className="flex gap-2 mb-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          aria-label={`Add to ${title}`}
          className="flex-1 min-w-0 rounded-xl px-3 py-2 text-sm outline-none transition-all"
          style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-foreground)' }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in oklab, var(--color-accent) 20%, transparent)' }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
        />
        <button
          type="submit"
          className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
          style={{ background: 'var(--color-accent)', color: 'var(--color-accent-foreground)' }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}
        >
          Add
        </button>
      </form>

      <ul className="space-y-1.5">
        {items.length === 0 && (
          <li className="text-[13px] text-muted-foreground/70 italic py-1.5">Nothing here yet.</li>
        )}
        {items.map(i => (
          <li
            key={i.id}
            className="group flex items-center gap-3 rounded-xl px-3 py-2"
            style={{ background: 'color-mix(in oklab, var(--color-background) 55%, transparent)' }}
          >
            <button
              onClick={() => toggle(i.id)}
              aria-label={i.done ? 'Mark as not done' : 'Mark as done'}
              className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all"
              style={i.done
                ? { background: 'var(--color-accent)', border: '1px solid var(--color-accent)' }
                : { background: 'transparent', border: '1px solid var(--color-border)' }}
            >
              {i.done && (
                <svg className="w-3 h-3" style={{ color: 'var(--color-accent-foreground)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              )}
            </button>
            <span
              className="flex-1 text-sm break-words"
              style={i.done
                ? { textDecoration: 'line-through', color: 'var(--color-muted-foreground)', opacity: 0.7 }
                : { color: 'var(--color-foreground)' }}
            >
              {linkify(i.text)}
            </span>
            <button
              onClick={() => remove(i.id)}
              aria-label="Delete"
              className="flex-shrink-0 p-1 rounded-md text-muted-foreground/60 hover:text-foreground transition-all sm:opacity-0 sm:group-hover:opacity-100"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" /></svg>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

// Per-day editable "Tickets & links" — the clickable stuff you want fast:
// confirmation numbers, booking URLs, reservation refs. Stored on the device
// (localStorage) per day, so real ticket details never go into the repo.
function DayLinks({ dayId }) {
  const store = `day:${dayId}`
  const [items, setItems] = useState(() => loadList(store, 'links'))
  const [label, setLabel] = useState('')
  const [value, setValue] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const valueRef = useRef(null)

  useEffect(() => { saveList(store, 'links', items) }, [items, store])

  const add = () => {
    const l = label.trim(), v = value.trim()
    if (!v) return
    setItems(prev => [...prev, { id: newId(), label: l, value: v, ts: Date.now() }])
    setLabel(''); setValue('')
    valueRef.current?.focus()
  }
  const remove = (id) => setItems(prev => prev.filter(i => i.id !== id))
  const copy = async (it) => {
    try { await navigator.clipboard?.writeText(it.value); setCopiedId(it.id); setTimeout(() => setCopiedId(c => (c === it.id ? null : c)), 1400) } catch { /* ignore */ }
  }

  const inputStyle = { background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-foreground)' }
  const onFocus = (e) => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in oklab, var(--color-accent) 20%, transparent)' }
  const onBlur = (e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }

  return (
    <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
      <h4 className="text-[13px] font-semibold mb-1" style={{ color: 'var(--color-foreground)' }}>Tickets &amp; links</h4>
      <p className="text-[11.5px] text-muted-foreground mb-3">Paste booking refs, confirmation numbers, or links — saved on this device. Tap a link to open, or a value to copy.</p>

      <form onSubmit={(e) => { e.preventDefault(); add() }} className="space-y-2 mb-3">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. Flight PNR, Bacchanal booking)"
          aria-label="Label" className="w-full rounded-xl px-3 py-2 text-sm outline-none transition-all" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
        <div className="flex gap-2">
          <input ref={valueRef} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value or https:// link"
            aria-label="Value" className="flex-1 min-w-0 rounded-xl px-3 py-2 text-sm font-mono outline-none transition-all" style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          <button type="submit" className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
            style={{ background: 'var(--color-accent)', color: 'var(--color-accent-foreground)' }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)' }} onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}>Add</button>
        </div>
      </form>

      <ul className="space-y-1.5">
        {items.map(it => (
          <li key={it.id} className="group flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'color-mix(in oklab, var(--color-background) 55%, transparent)' }}>
            <div className="flex-1 min-w-0">
              {it.label && <span className="block text-[10.5px] uppercase tracking-wide text-muted-foreground/80">{it.label}</span>}
              {isUrl(it.value) ? (
                <a href={it.value.trim()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-mono underline break-all" style={{ color: 'var(--color-accent)' }}>
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></svg>
                  Open
                </a>
              ) : (
                <button onClick={() => copy(it)} className="block text-sm font-mono break-words text-left" style={{ color: 'var(--color-foreground)' }} title="Tap to copy">
                  {it.value} <span className="text-[10.5px]" style={{ color: copiedId === it.id ? 'var(--color-accent)' : 'var(--color-muted-foreground)' }}>{copiedId === it.id ? '· copied' : '· copy'}</span>
                </button>
              )}
            </div>
            <button onClick={() => remove(it.id)} aria-label="Delete" className="flex-shrink-0 p-1 rounded-md text-muted-foreground/60 hover:text-foreground transition-all sm:opacity-0 sm:group-hover:opacity-100">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" /></svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// One day of the plan — a clean timeline with clickable map locations, plus the
// editable tickets/links for that day. Plan data comes from the decrypted
// payload, so it stays private; only personal links live on the device.
function DayView({ day }) {
  return (
    <div className="relative h-full overflow-y-auto" style={{ background: 'var(--color-background)' }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(70% 50% at 50% 0%, color-mix(in oklab, var(--color-accent) 9%, transparent), transparent 70%)' }} />
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="font-heading text-2xl" style={{ fontWeight: 500 }}>{day.dow} · {day.date}</h2>
            {day.tag && (
              <span className="text-[11px] px-2 py-0.5 rounded-full"
                style={day.free
                  ? { background: 'color-mix(in oklab, var(--color-accent) 14%, transparent)', color: 'var(--color-accent)', border: '1px solid color-mix(in oklab, var(--color-accent) 30%, transparent)' }
                  : { background: 'color-mix(in oklab, var(--color-muted-foreground) 12%, transparent)', color: 'var(--color-muted-foreground)', border: '1px solid var(--color-border)' }}>
                {day.tag}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{day.title}</p>
        </div>

        <section className="rounded-2xl p-4 sm:p-5"
          style={{ background: 'color-mix(in oklab, var(--color-card) 70%, transparent)', border: '1px solid var(--color-border)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
          <ul className="space-y-3">
            {day.items.map((it, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="flex-shrink-0 w-[68px] sm:w-20 text-[12px] font-mono leading-snug pt-0.5" style={{ color: 'var(--color-accent)' }}>{it.time}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed break-words" style={{ color: 'var(--color-foreground)' }}>{linkify(it.text)}</p>
                  {it.place && (
                    <a href={mapsUrl(it.place)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 px-2 py-1 rounded-lg text-[11.5px] transition-colors"
                      style={{ background: 'color-mix(in oklab, var(--color-accent) 10%, transparent)', color: 'var(--color-accent)', border: '1px solid color-mix(in oklab, var(--color-accent) 25%, transparent)' }}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                      Map
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <DayLinks dayId={day.id} />
        </section>
      </div>
    </div>
  )
}

// One person's space — a calm, scrollable column of their lists.
function VegasPersonal({ person, name }) {
  return (
    <div className="relative h-full overflow-y-auto" style={{ background: 'var(--color-background)' }}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(70% 50% at 50% 0%, color-mix(in oklab, var(--color-accent) 9%, transparent), transparent 70%)' }}
      />
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
        <div className="mb-6">
          <h2 className="font-heading text-2xl mb-1" style={{ fontWeight: 500 }}>{name}</h2>
          <p className="text-sm text-muted-foreground">To buy, notes, and links — saved on this device.</p>
        </div>
        {LISTS.map(l => (
          <ListCard key={l.id} person={person} listId={l.id} title={l.title} placeholder={l.placeholder} />
        ))}
      </div>
    </div>
  )
}

export default function Vegas({ onBack }) {
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [data, setData] = useState(cachedData)
  const [tab, setTab] = useState('elplan')
  const inputRef = useRef(null)

  useEffect(() => { if (!data) inputRef.current?.focus() }, [data])

  // Esc closes the gate back to the site
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !data) onBack?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [data, onBack])

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const out = await unlock(pw)
      cachedData = out
      setData(out)
    } catch {
      setBusy(false)
      setError('Wrong passphrase — try again.')
      setShake(true); setTimeout(() => setShake(false), 450)
      inputRef.current?.select()
    }
  }

  // Unlocked — tabbed layout: the overview plan, a tab per day, then a private
  // space for each person. Tab list is built from the decrypted day data.
  if (data) {
    const days = data.days || []
    const tabs = [
      { id: 'elplan', label: 'El-plan', group: 'plan' },
      ...days.map(d => ({ id: d.id, label: d.dow, group: 'day' })),
      { id: 'chaitra', label: 'Chaitra', group: 'people' },
      { id: 'kiran', label: 'Kiran', group: 'people' },
    ]
    const activeDay = days.find(d => d.id === tab)

    return (
      <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: 'var(--color-background)' }}>
        {/* Tab bar — replaces the old floating "Back to site" pill */}
        <header
          className="flex-shrink-0 relative z-10"
          style={{
            borderBottom: '1px solid var(--color-border)',
            background: 'color-mix(in oklab, var(--color-card) 78%, transparent)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <div className="max-w-5xl mx-auto flex items-center gap-1 px-2 sm:px-3 py-2">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
              {tabs.map((t, i) => {
                const active = tab === t.id
                const showDivider = i > 0 && tabs[i - 1].group !== t.group
                return (
                  <React.Fragment key={t.id}>
                    {showDivider && <span className="flex-shrink-0 w-px h-4 mx-1" style={{ background: 'var(--color-border)' }} aria-hidden="true" />}
                    <button
                      onClick={() => setTab(t.id)}
                      className="px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all"
                      style={active ? {
                        background: 'color-mix(in oklab, var(--color-accent) 16%, transparent)',
                        color: 'var(--color-foreground)',
                        boxShadow: 'inset 0 0 0 1px color-mix(in oklab, var(--color-accent) 38%, transparent)',
                      } : { color: 'var(--color-muted-foreground)' }}
                      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-foreground)' }}
                      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--color-muted-foreground)' }}
                    >
                      {t.label}
                    </button>
                  </React.Fragment>
                )
              })}
            </div>
            <button
              onClick={onBack}
              aria-label="Back to site"
              title="Back to site"
              className="ml-auto flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></svg>
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 min-h-0">
          {tab === 'elplan' ? (
            <iframe
              title="Vegas Plan"
              srcDoc={data.html}
              sandbox="allow-same-origin allow-scripts allow-popups"
              className="w-full h-full border-0"
            />
          ) : activeDay ? (
            <DayView key={activeDay.id} day={activeDay} />
          ) : (
            <VegasPersonal key={tab} person={tab} name={tab === 'chaitra' ? 'Chaitra' : 'Kiran'} />
          )}
        </div>
      </div>
    )
  }

  // Locked — calm, site-matching passphrase gate
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-6">
      {/* Site backdrop layers — full cohesion with the rest of the site */}
      <div className="pr-backdrop-base" aria-hidden="true" />
      <div className="pr-backdrop-glow" aria-hidden="true" />
      <div className="pr-backdrop-noise" aria-hidden="true" />

      <button
        onClick={onBack}
        className="absolute top-5 left-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back
      </button>

      <main
        className={`relative z-10 w-full max-w-[400px] rounded-2xl p-8 sm:p-10 text-center ${shake ? 'animate-shake' : ''}`}
        style={{
          background: 'color-mix(in oklab, var(--color-card) 78%, transparent)',
          border: '1px solid var(--color-border)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 24px 70px rgba(0,0,0,.5)',
        }}
      >
        {/* Lock mark */}
        <div className="mx-auto mb-5 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'color-mix(in oklab, var(--color-accent) 12%, transparent)', border: '1px solid color-mix(in oklab, var(--color-accent) 30%, transparent)' }}>
          <svg className="w-5 h-5" style={{ color: 'var(--color-accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </div>

        <h1 className="font-heading text-[1.6rem] mb-2" style={{ fontWeight: 500 }}>This page is private</h1>
        <p className="text-sm text-muted-foreground mb-7 leading-relaxed">A quiet corner of the site. Enter the passphrase to continue.</p>

        <form onSubmit={submit} autoComplete="off" className="flex flex-col gap-3">
          <div className="relative">
            <input
              ref={inputRef}
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Passphrase"
              autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck="false"
              aria-label="Passphrase"
              className="w-full rounded-xl py-3 pl-3.5 pr-11 text-[15px] font-mono outline-none transition-all"
              style={{ background: 'var(--color-background)', border: '1px solid var(--color-border)', color: 'var(--color-foreground)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.boxShadow = '0 0 0 3px color-mix(in oklab, var(--color-accent) 22%, transparent)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
            />
            <button type="button" onClick={() => { setShow(s => !s); inputRef.current?.focus() }}
              aria-label="Show or hide passphrase"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors">
              {show ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4 4M9.4 4.2A10.6 10.6 0 0 1 12 4c6 0 10 8 10 8a18.5 18.5 0 0 1-2.6 3.4M6.3 6.3A18.6 18.6 0 0 0 2 12s4 8 10 8a10.6 10.6 0 0 0 3-.4" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" /><circle cx="12" cy="12" r="3" /></svg>
              )}
            </button>
          </div>

          <button type="submit" disabled={busy}
            className="rounded-xl py-3 text-[15px] font-semibold transition-all disabled:opacity-60 disabled:cursor-wait"
            style={{ background: 'var(--color-accent)', color: 'var(--color-accent-foreground)' }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}
          >
            {busy ? 'Unlocking…' : 'Unlock'}
          </button>

          <div className="text-[13px] min-h-[18px]" style={{ color: '#ef6b6b' }} role="alert">{error}</div>
        </form>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/70 mt-5">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" /></svg>
          End-to-end encrypted · decrypts only in your browser
        </div>
      </main>
    </div>
  )
}
