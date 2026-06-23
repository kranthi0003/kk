import React, { useState, useRef, useEffect } from 'react'
import { VEGAS_PAYLOAD as PAYLOAD } from '../lib/vegasPayload'

// Same crypto as the original public/vegas.html — PBKDF2 (SHA-256) → AES-GCM.
// The content stays encrypted at rest in the bundle and only decrypts in the
// browser with the correct passphrase.
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
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  return dec.decode(pt)
}

// In-memory cache so navigating away and back within the same page load keeps
// it unlocked. Never persisted — a full reload re-prompts.
let cachedHtml = null

export default function Vegas({ onBack }) {
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)
  const [html, setHtml] = useState(cachedHtml)
  const inputRef = useRef(null)

  useEffect(() => { if (!html) inputRef.current?.focus() }, [html])

  // Esc closes the gate back to the site
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !html) onBack?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [html, onBack])

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const out = await unlock(pw)
      cachedHtml = out
      setHtml(out)
    } catch {
      setBusy(false)
      setError('Wrong passphrase — try again.')
      setShake(true); setTimeout(() => setShake(false), 450)
      inputRef.current?.select()
    }
  }

  // Unlocked — render the decrypted document in a sandboxed iframe
  if (html) {
    return (
      <div className="fixed inset-0 z-[300] bg-background">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-10 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
          style={{ background: 'color-mix(in oklab, var(--color-card) 80%, transparent)', border: '1px solid var(--color-border)', backdropFilter: 'blur(8px)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to site
        </button>
        <iframe
          title="Vegas Plan"
          srcDoc={html}
          sandbox="allow-same-origin allow-scripts allow-popups"
          className="w-full h-full border-0"
        />
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
