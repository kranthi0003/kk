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

  // Locked — site-themed passphrase gate
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-6"
      style={{ background: 'radial-gradient(1200px 600px at 50% -10%, #1a1f2b, var(--color-background) 60%)' }}>
      {/* subtle starfield reuse */}
      <div className="pr-backdrop-noise" aria-hidden="true" style={{ opacity: 0.35 }} />

      <button
        onClick={onBack}
        className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back
      </button>

      <main
        className={`relative w-full max-w-[420px] rounded-2xl p-8 sm:p-9 text-center ${shake ? 'animate-shake' : ''}`}
        style={{
          background: 'linear-gradient(180deg, color-mix(in oklab, var(--color-card) 92%, #161a21), var(--color-card))',
          border: '1px solid var(--color-border)',
          boxShadow: '0 24px 70px rgba(0,0,0,.55)',
        }}
      >
        <div className="text-4xl mb-3" style={{ filter: 'drop-shadow(0 4px 12px rgba(199,154,58,.35))' }}>🎰</div>
        <h1 className="font-heading text-2xl mb-1.5" style={{ fontWeight: 500 }}>This page is private</h1>
        <p className="text-[13.5px] text-muted-foreground mb-6 leading-relaxed">Enter the passphrase to unlock the Vegas plan.</p>

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
              onFocus={(e) => { e.target.style.borderColor = '#c79a3a'; e.target.style.boxShadow = '0 0 0 3px rgba(199,154,58,.18)' }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
            />
            <button type="button" onClick={() => { setShow(s => !s); inputRef.current?.focus() }}
              aria-label="Show or hide passphrase"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors text-[15px] leading-none">
              {show ? '🙈' : '👁'}
            </button>
          </div>

          <button type="submit" disabled={busy}
            className="rounded-xl py-3 text-[15px] font-semibold transition-all disabled:opacity-60 disabled:cursor-wait"
            style={{ background: 'linear-gradient(180deg, #d8a72b, #b9881f)', color: '#1a1405', fontFamily: "'Sora', sans-serif" }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.06)' }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}
          >
            {busy ? 'Unlocking…' : 'Unlock'}
          </button>

          <div className="text-[13px] min-h-[18px]" style={{ color: 'var(--destructive, #ef5b6b)' }} role="alert">{error}</div>
        </form>

        <div className="text-[11.5px] text-muted-foreground/80 mt-4">🔐 End-to-end encrypted · decrypts only in your browser</div>
      </main>
    </div>
  )
}
