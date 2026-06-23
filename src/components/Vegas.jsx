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

// Site-matching theme injected into the decrypted document so the unlocked
// page feels native — dark background, the site's fonts, gold accent, and
// styled headings/tables/links. Essentials are forced (!important) so they win
// over the original document's lighter styling; layout is left flexible.
const THEME_CSS = `
:root { color-scheme: dark; }
html, body {
  background: radial-gradient(1200px 600px at 50% -10%, #1a1f2b, #0d0f13 60%) !important;
  background-attachment: fixed !important;
  color: #cdd1db !important;
  font-family: 'Sora', -apple-system, system-ui, sans-serif !important;
  line-height: 1.7;
}
body { max-width: 820px; margin: 0 auto; padding: 56px 24px 96px; }
h1, h2, h3, h4 { font-family: 'Newsreader', Georgia, serif !important; color: #eceef5 !important; font-weight: 500; letter-spacing: -0.01em; line-height: 1.25; }
h1 { font-size: clamp(1.7rem, 5vw, 2.3rem); margin: 0 0 .5em; }
h2 { font-size: clamp(1.3rem, 4vw, 1.6rem); margin: 1.8em 0 .6em; padding-bottom: .3em; border-bottom: 1px solid #252a33; }
h3 { font-size: 1.2rem; margin: 1.4em 0 .5em; }
p, li, td, th, dd, dt { color: #c2c7d2 !important; }
strong, b { color: #eceef5 !important; }
em, i { color: #d6dae3; }
a { color: #d8a72b !important; text-decoration: none; border-bottom: 1px solid rgba(216,167,43,.35); }
a:hover { border-bottom-color: #d8a72b; }
ul, ol { padding-left: 1.4em; }
li { margin: .3em 0; }
code, pre, kbd { font-family: 'JetBrains Mono', ui-monospace, monospace !important; }
code { background: rgba(255,255,255,.06); padding: .12em .42em; border-radius: 5px; font-size: .88em; color: #e3c98a; }
pre { background: #14171d !important; border: 1px solid #252a33; border-radius: 12px; padding: 16px 18px; overflow: auto; }
pre code { background: none; color: inherit; padding: 0; }
table { width: 100%; border-collapse: collapse; margin: 1.3em 0; font-size: .94em; }
th, td { border: 1px solid #252a33 !important; padding: 9px 13px; text-align: left; vertical-align: top; }
thead th { background: rgba(216,167,43,.12) !important; color: #eceef5 !important; font-weight: 600; }
tbody tr:nth-child(even) td { background: rgba(255,255,255,.022); }
blockquote { border-left: 3px solid #c79a3a; margin: 1.2em 0; padding: .5em 1.1em; color: #aab0bd; background: rgba(255,255,255,.03); border-radius: 0 10px 10px 0; }
hr { border: none; border-top: 1px solid #252a33; margin: 2.2em 0; }
img { max-width: 100%; height: auto; border-radius: 10px; }
::selection { background: rgba(216,167,43,.3); color: #fff; }
*::-webkit-scrollbar { width: 9px; height: 9px; }
*::-webkit-scrollbar-thumb { background: rgba(216,167,43,.35); border-radius: 5px; }
`

const FONT_LINKS =
  '<link rel="preconnect" href="https://fonts.googleapis.com">' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">'

// Inject the font links + theme after the document's own styles so ours win.
function applySiteTheme(rawHtml) {
  const inject = `${FONT_LINKS}<style id="kk-site-theme">${THEME_CSS}</style>`
  if (/<\/head>/i.test(rawHtml)) return rawHtml.replace(/<\/head>/i, `${inject}</head>`)
  if (/<body[^>]*>/i.test(rawHtml)) return rawHtml.replace(/(<body[^>]*>)/i, `$1${inject}`)
  return `${inject}${rawHtml}`
}

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
      const themed = applySiteTheme(out)
      cachedHtml = themed
      setHtml(themed)
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
