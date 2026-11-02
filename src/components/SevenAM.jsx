import React, { useEffect, useId, useRef, useState } from 'react'
import { useAmbient } from './AmbientContext'
import { SEVEN_AM_PAYLOAD as PAYLOAD } from '../lib/sevenAmPayload'

/* ------------------------------------------------------------------ *
 * #/7am/<key> — a small private note that opens only from its link.
 *
 * The words ship encrypted (PBKDF2-SHA256 → AES-GCM-256, the scheme the
 * other private pages use). The key is the last part of the link. It
 * sits in the URL fragment, so it never reaches a server, and it is not
 * in the repo. Without it the page stays a closed note. Every word lives
 * in the payload; this file only draws the scene and runs the steps.
 * Edit with scripts/private-payload.mjs (decrypt → edit → encrypt).
 * ------------------------------------------------------------------ */

const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

async function unlock(pass) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey'])
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64(PAYLOAD.salt), iterations: PAYLOAD.iter || 200000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['decrypt'],
  )
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(PAYLOAD.iv) }, key, b64(PAYLOAD.ct))
  return JSON.parse(new TextDecoder().decode(pt))
}

// In memory only, keyed by the link it came from.
let cached = null

const readKey = () => (/^#\/7am\/([A-Za-z0-9_-]{8,})\/?$/i.exec(window.location.hash || '') || [])[1] || ''

const FONTS_ID = 'am-fonts'
const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Gaegu:wght@700&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap'

const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* ------------------------------------------------------------------ *
 * Sound. Synthesised, soft, and only ever after a tap. Web Audio
 * follows the phone's silent switch on iOS.
 * ------------------------------------------------------------------ */
function createSfx() {
  const AC = window.AudioContext || window.webkitAudioContext
  let ctx = null
  let out = null
  let muted = false
  let noiseBuf = null

  const get = () => {
    if (!AC || muted) return null
    if (!ctx) {
      try {
        ctx = new AC()
        out = ctx.createGain()
        out.gain.value = 0.55
        out.connect(ctx.destination)
      } catch {
        ctx = null
        return null
      }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    return ctx
  }

  const tone = ({ type = 'sine', f0, f1 = f0, at = 0, dur = 0.25, vol = 0.05, attack = 0.01 }) => {
    const c = get()
    if (!c) return
    const t = c.currentTime + at
    const o = c.createOscillator()
    o.type = type
    o.frequency.setValueAtTime(f0, t)
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.8)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g)
    g.connect(out)
    o.start(t)
    o.stop(t + dur + 0.05)
  }

  // Filtered noise sweeping upwards: something being poured.
  const pour = ({ at = 0, dur = 0.7, vol = 0.05 }) => {
    const c = get()
    if (!c) return
    if (!noiseBuf || noiseBuf.sampleRate !== c.sampleRate) {
      noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 1.2), c.sampleRate)
      const d = noiseBuf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    }
    const t = c.currentTime + at
    const s = c.createBufferSource()
    s.buffer = noiseBuf
    const f = c.createBiquadFilter()
    f.type = 'bandpass'
    f.Q.value = 1.4
    f.frequency.setValueAtTime(500, t)
    f.frequency.exponentialRampToValueAtTime(1900, t + dur)
    const g = c.createGain()
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(vol, t + 0.08)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    s.connect(f)
    f.connect(g)
    g.connect(out)
    s.start(t)
    s.stop(t + dur + 0.05)
  }

  return {
    setMuted(m) { muted = m },
    mug() {
      pour({})
      tone({ f0: 2490, dur: 0.14, vol: 0.025, at: 0.62 })
    },
    plant() {
      ;[0, 0.16, 0.32].forEach((at) => tone({ f0: 1500, f1: 880, dur: 0.12, vol: 0.035, at }))
      ;[1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.5, vol: 0.03, at: 0.9 + i * 0.09 }))
    },
    teddy() {
      tone({ f0: 420, f1: 760, dur: 0.22, vol: 0.06 })
      tone({ f0: 1040, dur: 0.18, vol: 0.03, at: 0.2 })
    },
    sun() {
      ;[523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
        tone({ type: 'triangle', f0: f, dur: 2.2, vol: 0.035, attack: 0.08, at: i * 0.14 }))
    },
    tick() { tone({ f0: 1900, dur: 0.035, vol: 0.012 }) },
    found() {
      tone({ f0: 880, dur: 0.18, vol: 0.035 })
      tone({ f0: 1318.5, dur: 0.4, vol: 0.035, at: 0.12 })
    },
    close() { try { ctx?.close() } catch {} },
  }
}

/* ---------------------------- time --------------------------------- */

function useNow(every) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), every)
    return () => clearInterval(t)
  }, [every])
  return now
}

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`
function until(ms) {
  const mins = Math.floor(ms / 60000)
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d >= 1) return `${plural(d, 'day')} ${plural(h, 'hr')}`
  if (h >= 1) return `${plural(h, 'hr')} ${m} min`
  return `${m} min ${Math.floor(ms / 1000) % 60} sec`
}

/* --------------------------- confetti ------------------------------ */

const BITS = ['#00ed64', '#3ccf7d', '#7fe3a6', '#ffd36b', '#ff8fab', '#ffb36b']
function burst(host, count = 70) {
  if (!host || reducedMotion()) return
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span')
    const kind = Math.random()
    if (kind < 0.55) {
      s.className = 'am-bit leaf'
      s.style.background = BITS[(Math.random() * 3) | 0]
    } else if (kind < 0.82) {
      s.className = 'am-bit heart'
      s.textContent = '♥'
      s.style.color = BITS[4 + ((Math.random() * 2) | 0)]
    } else {
      s.className = 'am-bit spark'
      s.textContent = '✦'
      s.style.color = BITS[3]
    }
    s.style.left = `${5 + Math.random() * 90}%`
    s.style.setProperty('--x', `${(Math.random() - 0.5) * 160}px`)
    s.style.setProperty('--r', `${(Math.random() - 0.5) * 720}deg`)
    s.style.setProperty('--d', `${2.6 + Math.random() * 2.2}s`)
    s.style.animationDelay = `${Math.random() * 0.6}s`
    s.addEventListener('animationend', () => s.remove())
    host.appendChild(s)
  }
}

/* ---------------------------- the scene ---------------------------- *
 * A windowsill just before sunrise. viewBox 360 × 228. Stage 0 is night;
 * each thing done warms the sky a little, and stage 4 brings the sun up.
 * ------------------------------------------------------------------- */

const INK = '#2a2440'
const STARS = [[74, 46, 1.1], [98, 64, 0.8], [132, 42, 1.3], [158, 58, 0.8], [204, 44, 1], [228, 70, 0.8], [252, 40, 0.9],
  [288, 52, 1.2], [112, 88, 0.7], [214, 92, 0.7], [276, 86, 0.8], [86, 100, 0.6], [150, 96, 0.7]]
const LIGHT = {
  pre: [0, 0.55, 1, 1, 1], dawn: [0, 0, 0, 1, 1], morn: [0, 0, 0, 0, 1],
  stars: [1, 0.75, 0.5, 0.2, 0], moon: [1, 0.85, 0.6, 0.3, 0], glow: [0, 0.15, 0.3, 0.6, 1],
  hills: [0, 0.12, 0.25, 0.45, 1], room: [0, 0.08, 0.16, 0.3, 0.65],
}
// Tap areas in viewBox units: [x, y, w, h].
const HOTSPOTS = {
  mug: [52, 104, 66, 90], plant: [150, 56, 64, 138], teddy: [244, 70, 80, 126], sun: [60, 36, 116, 104],
}

function Scene({ stage, did, label }) {
  const uid = useId().replace(/:/g, '')
  const id = (n) => `${uid}-${n}`
  const o = (k) => ({ opacity: LIGHT[k][stage] })
  const sky = (n) => <rect x="56" y="32" width="248" height="150" fill={`url(#${id(n)})`} />
  const risen = stage >= 4

  return (
    <svg className="am-svg" viewBox="0 0 360 228" role="img" aria-label={label}>
      <defs>
        <linearGradient id={id('night')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#08102b" /><stop offset=".6" stopColor="#142252" /><stop offset="1" stopColor="#1f2d63" />
        </linearGradient>
        <linearGradient id={id('pre')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b2560" /><stop offset=".55" stopColor="#5b4a8e" /><stop offset="1" stopColor="#e3917f" />
        </linearGradient>
        <linearGradient id={id('dawn')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3f5aa8" /><stop offset=".5" stopColor="#e79a8a" /><stop offset="1" stopColor="#ffd09a" />
        </linearGradient>
        <linearGradient id={id('morn')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fc8ff" /><stop offset=".6" stopColor="#cdeeff" /><stop offset="1" stopColor="#fff1cc" />
        </linearGradient>
        <radialGradient id={id('glow')} cx="116" cy="150" r="96" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffe3a0" stopOpacity=".95" /><stop offset="1" stopColor="#ffb36b" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('sunfill')} cx=".4" cy=".35" r=".7">
          <stop offset="0" stopColor="#fff6c2" /><stop offset="1" stopColor="#ffc247" />
        </radialGradient>
        <radialGradient id={id('room')} cx="180" cy="96" r="230" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffcf8f" stopOpacity=".55" /><stop offset="1" stopColor="#ffcf8f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('leaf')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3dff8f" /><stop offset="1" stopColor="#00a85a" />
        </linearGradient>
        <clipPath id={id('glass')}><rect x="56" y="32" width="248" height="150" rx="4" /></clipPath>
      </defs>

      <rect width="360" height="228" fill="#121933" />
      <rect width="360" height="228" fill={`url(#${id('room')})`} className="am-fade" style={o('room')} />

      <g clipPath={`url(#${id('glass')})`}>
        {sky('night')}
        <g className="am-fade" style={o('pre')}>{sky('pre')}</g>
        <g className="am-fade" style={o('dawn')}>{sky('dawn')}</g>
        <g className="am-fade" style={o('morn')}>{sky('morn')}</g>
        <g className="am-fade" style={o('stars')}>
          {STARS.map(([x, y, r], i) => (
            <circle key={i} cx={x} cy={y} r={r} fill="#fff" className={i % 3 === 0 ? 'am-tw' : undefined}
              style={i % 3 === 0 ? { animationDelay: `${i * 0.37}s` } : undefined} />
          ))}
        </g>
        <path className="am-fade" style={o('moon')} d="M276 44 a14 14 0 1 0 10 24 a11 11 0 1 1 -10 -24 z" fill="#fff4c7" />
        <circle cx="116" cy="150" r="96" fill={`url(#${id('glow')})`} className="am-fade" style={o('glow')} />

        <g className={risen ? 'am-sun on' : 'am-sun'}>
          <g className="am-rays" stroke="#ffd36b" strokeWidth="3" strokeLinecap="round">
            {Array.from({ length: 10 }, (_, i) => {
              const a = (i / 10) * Math.PI * 2
              const p = (r) => [116 + r * Math.cos(a), 76 + r * Math.sin(a)].map((v) => v.toFixed(1))
              const [x1, y1] = p(29); const [x2, y2] = p(37)
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />
            })}
          </g>
          <circle cx="116" cy="76" r="22" fill={`url(#${id('sunfill')})`} stroke="#f0a43a" strokeWidth="1.6" />
          <path d="M106 73 q3.5 -4 7 0 M119 73 q3.5 -4 7 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          <path d="M110 81 q6 5 12 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="103" cy="80" rx="3.6" ry="2.2" fill="#ff9aa8" opacity=".8" />
          <ellipse cx="129" cy="80" rx="3.6" ry="2.2" fill="#ff9aa8" opacity=".8" />
        </g>

        <path d="M56 146 C 92 122 132 124 170 140 C 206 154 248 126 304 134 V 182 H 56 Z" fill="#18234d" />
        <path d="M56 146 C 92 122 132 124 170 140 C 206 154 248 126 304 134 V 182 H 56 Z" fill="#79c995" className="am-fade" style={o('hills')} />
        <path d="M56 164 C 100 148 150 150 196 162 C 232 172 268 156 304 160 V 182 H 56 Z" fill="#101a3d" />
        <path d="M56 164 C 100 148 150 150 196 162 C 232 172 268 156 304 160 V 182 H 56 Z" fill="#4daf78" className="am-fade" style={o('hills')} />
      </g>

      {/* frame, bars, curtains */}
      <path d="M46 22 h268 v170 h-268 z M56 32 v150 h248 v-150 z" fill="#eadfcb" fillRule="evenodd" stroke={INK} strokeWidth="1.6" />
      <rect x="178" y="32" width="4" height="150" fill="#eadfcb" />
      <rect x="56" y="105" width="248" height="4" fill="#eadfcb" />
      <line x1="22" y1="14" x2="338" y2="14" stroke="#eadfcb" strokeWidth="4" strokeLinecap="round" />
      <path d="M24 14 H74 C 66 60 78 96 70 132 C 64 160 70 182 76 198 H24 Z" fill="#f5a9bd" stroke={INK} strokeWidth="1.6" />
      <path d="M40 18 C 38 80 44 140 40 196 M56 18 C 54 80 60 140 56 196" stroke="#e48aa3" strokeWidth="2" fill="none" />
      <path d="M336 14 H286 C 294 60 282 96 290 132 C 296 160 290 182 284 198 H336 Z" fill="#f5a9bd" stroke={INK} strokeWidth="1.6" />
      <path d="M320 18 C 322 80 316 140 320 196 M304 18 C 306 80 300 140 304 196" stroke="#e48aa3" strokeWidth="2" fill="none" />

      {/* sill */}
      <rect x="22" y="206" width="316" height="10" rx="5" fill="#060b1c" opacity=".45" />
      <rect x="14" y="192" width="332" height="14" rx="6" fill="#d2a679" stroke={INK} strokeWidth="1.6" />
      <rect x="18" y="194" width="324" height="3" rx="1.5" fill="#e6bf92" />

      {/* mug */}
      <g className={did.mug ? 'am-steam on' : 'am-steam'} fill="none" stroke="#f1ecff" strokeWidth="3" strokeLinecap="round">
        <path d="M72 142 c -6 -8 6 -14 0 -22 c -6 -8 6 -14 0 -22" />
        <path d="M84 138 c -6 -8 6 -14 0 -22 c -6 -8 6 -14 0 -22" />
        <path d="M96 142 c -6 -8 6 -14 0 -22 c -6 -8 6 -14 0 -22" />
      </g>
      <path d="M104 158 h5 a10 10 0 0 1 0 20 h-5" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" />
      <path d="M104 158 h5 a10 10 0 0 1 0 20 h-5" fill="none" stroke="#fbf3e4" strokeWidth="5" strokeLinecap="round" />
      <path d="M60 150 H104 V176 A16 16 0 0 1 88 192 H76 A16 16 0 0 1 60 176 Z" fill="#fbf3e4" stroke={INK} strokeWidth="2.4" />
      <ellipse cx="82" cy="150" rx="22" ry="4.5" fill="#fbf3e4" stroke={INK} strokeWidth="2.2" />
      <ellipse cx="82" cy="150.6" rx="18" ry="3" fill="#e2d5bd" />
      <ellipse cx="82" cy="150.6" rx="18" ry="3" fill="#b9733d" className="am-fade" style={{ opacity: did.mug ? 1 : 0 }} />
      <path d="M82 182 C 74 176 70 172 70 168 a5.5 5.5 0 0 1 12 -2 a5.5 5.5 0 0 1 12 2 C 94 172 90 176 82 182 Z" fill="#ff8fab" />

      {/* plant */}
      <g className={did.plant ? 'am-drops on' : 'am-drops'} fill="#8fd3ff" stroke="#2a6fb0" strokeWidth="1">
        <path d="M172 30 c 0 0 -5 7 -5 10 a5 5 0 0 0 10 0 c 0 -3 -5 -10 -5 -10 z" />
        <path d="M184 22 c 0 0 -5 7 -5 10 a5 5 0 0 0 10 0 c 0 -3 -5 -10 -5 -10 z" />
        <path d="M194 32 c 0 0 -5 7 -5 10 a5 5 0 0 0 10 0 c 0 -3 -5 -10 -5 -10 z" />
      </g>
      <g className={did.plant ? 'am-sprout on' : 'am-sprout'}>
        <path d="M182 153 C 182 140 180 128 182 112" fill="none" stroke="#2fa866" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M182 130 C 172 130 164 124 162 116 C 172 114 180 120 182 130 Z" fill="#39c472" stroke="#1f6b45" strokeWidth="1.6" />
        <path d="M182 124 C 192 124 200 118 202 110 C 192 108 184 114 182 124 Z" fill="#39c472" stroke="#1f6b45" strokeWidth="1.6" />
      </g>
      <g className={did.plant ? 'am-leaf on' : 'am-leaf'}>
        <path d="M182 113 C 168 101 166 80 182 62 C 198 80 196 101 182 113 Z" fill={`url(#${id('leaf')})`} stroke="#0b5d3b" strokeWidth="1.8" />
        <path d="M182 109 C 181 96 181 82 182 68" fill="none" stroke="#0b5d3b" strokeWidth="1.4" opacity=".55" />
      </g>
      <g className={did.plant ? 'am-spark on' : 'am-spark'} fill="#fff6c2">
        <path d="M206 72 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" />
        <path d="M158 84 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5 z" />
      </g>
      <rect x="158" y="152" width="48" height="11" rx="4" fill="#f29c7d" stroke={INK} strokeWidth="2.4" />
      <path d="M162 163 H202 L196 192 H168 Z" fill="#e8896a" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="174" cy="174" r="2.2" fill={INK} />
      <circle cx="190" cy="174" r="2.2" fill={INK} />
      <path d="M178 179 q4 4 8 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="169" cy="179" rx="3.5" ry="2" fill="#ff9db0" opacity=".85" />
      <ellipse cx="195" cy="179" rx="3.5" ry="2" fill="#ff9db0" opacity=".85" />

      {/* teddy */}
      <g className={did.teddy ? 'am-tedwrap on' : 'am-tedwrap'}>
        <g className="am-zz">
          <text x="238" y="98">z</text><text x="228" y="86">z</text>
        </g>
        <path className="am-heart" d="M284 88 C 276 82 272 78 272 74 a6 6 0 0 1 12 -2 a6 6 0 0 1 12 2 C 296 78 292 82 284 88 Z" fill="#ff6f91" stroke={INK} strokeWidth="1.6" />
        <g className="am-ted" fill="#c08a5b" stroke={INK} strokeWidth="2.2">
          <ellipse cx="266" cy="186" rx="11" ry="7" />
          <ellipse cx="302" cy="186" rx="11" ry="7" />
          <ellipse cx="284" cy="164" rx="30" ry="26" />
          <ellipse cx="257" cy="162" rx="9" ry="15" transform="rotate(20 257 162)" />
          <ellipse cx="311" cy="162" rx="9" ry="15" transform="rotate(-20 311 162)" />
          <ellipse cx="284" cy="168" rx="17" ry="15" fill="#f0cfa6" stroke="none" />
          <ellipse cx="266" cy="187" rx="6" ry="3.6" fill="#f0cfa6" stroke="none" />
          <ellipse cx="302" cy="187" rx="6" ry="3.6" fill="#f0cfa6" stroke="none" />
          <circle cx="262" cy="100" r="10" />
          <circle cx="306" cy="100" r="10" />
          <circle cx="262" cy="100" r="5.5" fill="#f0cfa6" stroke="none" />
          <circle cx="306" cy="100" r="5.5" fill="#f0cfa6" stroke="none" />
          <circle cx="284" cy="122" r="27" />
          <ellipse cx="284" cy="132" rx="13" ry="10" fill="#f0cfa6" stroke="none" />
          <ellipse cx="284" cy="127.5" rx="4.6" ry="3.4" fill={INK} stroke="none" />
          <path d="M279 134 q2.5 3 5 0 q2.5 3 5 0" fill="none" strokeWidth="1.8" strokeLinecap="round" />
          <path className="am-eyes-sleep" d="M270 118 h8 M290 118 h8" fill="none" strokeLinecap="round" />
          <path className="am-eyes-up" d="M270 120 q4 -6 8 0 M290 120 q4 -6 8 0" fill="none" strokeLinecap="round" />
          <ellipse className="am-blush" cx="268" cy="130" rx="5" ry="3" fill="#ff9aa8" stroke="none" />
          <ellipse className="am-blush" cx="300" cy="130" rx="5" ry="3" fill="#ff9aa8" stroke="none" />
        </g>
      </g>
    </svg>
  )
}

/* ---------------------------- the query ---------------------------- */

function valueClass(v) {
  if (/^".*"$/.test(v)) return 'am-q-str'
  if (v === 'true' || v === 'false') return 'am-q-bool'
  return 'am-q-num'
}

function Query({ shell, sfx }) {
  const doc = shell.doc || []
  const [shown, setShown] = useState(-1)
  const timer = useRef(null)
  useEffect(() => () => clearInterval(timer.current), [])

  const run = () => {
    if (shown >= 0) return
    const total = doc.length + 2
    if (reducedMotion()) { setShown(total); sfx()?.found(); return }
    let n = 0
    setShown(0)
    timer.current = setInterval(() => {
      n += 1
      setShown(n)
      if (n < total) sfx()?.tick()
      else { clearInterval(timer.current); sfx()?.found() }
    }, 170)
  }
  const at = (i) => shown >= i
  return (
    <section className="am-q">
      {shell.caption && <p className="am-q-cap">{shell.caption}</p>}
      <div className="am-q-card">
        <div className="am-q-bar" aria-hidden="true"><i /><i /><i />{shell.title && <span>{shell.title}</span>}</div>
        <div className="am-q-body">
          <p className="am-q-line"><span className="am-q-pr">&gt;</span> {shell.prompt}</p>
          {shown < 0 && (
            <button type="button" className="am-q-run" onClick={run}>{shell.run || '▶'} <span aria-hidden="true">▶</span></button>
          )}
          {shown >= 0 && (
            <div className="am-q-out" aria-live="polite">
              {at(0) && <p className="am-q-line">{'{'}</p>}
              {doc.map(([k, v], i) => at(i + 1) && (
                <p key={k} className="am-q-line am-q-in">
                  <span className="am-q-key">{k}</span><span className="am-q-p">: </span>
                  <span className={valueClass(v)}>{v}</span>{i < doc.length - 1 && <span className="am-q-p">,</span>}
                </p>
              ))}
              {at(doc.length + 1) && <p className="am-q-line">{'}'}</p>}
              {at(doc.length + 2) && shell.found && <p className="am-q-found">{shell.found}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/* ----------------------------- pages ------------------------------- */

const Moon = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true" className="am-closed-moon">
    <path d="M30 6 a19 19 0 1 0 12 30 a15 15 0 1 1 -12 -30 z" fill="#fff4c7" />
    <circle cx="12" cy="12" r="1.4" fill="#fff" /><circle cx="40" cy="10" r="1" fill="#fff" /><circle cx="8" cy="34" r="1" fill="#fff" />
  </svg>
)
const BackArrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
)

function Closed({ opening, onBack }) {
  return (
    <div className="am-root am-closed">
      <style>{CSS}</style>
      <div className="am-closed-card">
        <Moon />
        {opening
          ? <p className="am-closed-t" role="status">Opening…</p>
          : <p className="am-closed-t">This little page opens from the link it came in.</p>}
        <button type="button" className="am-ghost" onClick={onBack}><BackArrow /> Back to site</button>
      </div>
    </div>
  )
}

function Title({ text }) {
  const i = (text || '').lastIndexOf(', ')
  if (i < 0) return <h1 className="am-title">{text}</h1>
  return <h1 className="am-title">{text.slice(0, i + 1)} <span className="am-title-name">{text.slice(i + 2)}</span></h1>
}

function Morning({ data, onBack }) {
  const { meta = {}, steps = [], sun = {}, final = {}, shell = {}, end = {} } = data
  const [done, setDone] = useState([])
  const [risen, setRisen] = useState(false)
  const [showFinal, setShowFinal] = useState(false)
  const [muted, setMuted] = useState(false)
  const [round, setRound] = useState(0)
  const sfxRef = useRef(null)
  const sunBtn = useRef(null)
  const finalRef = useRef(null)
  const sceneRef = useRef(null)
  const confetti = useRef(null)
  const timer = useRef(null)
  const now = useNow(1000)

  const sfx = () => {
    if (!sfxRef.current) sfxRef.current = createSfx()
    sfxRef.current.setMuted(muted)
    return sfxRef.current
  }
  useEffect(() => { window.scrollTo(0, 0) }, [])
  useEffect(() => () => { clearTimeout(timer.current); sfxRef.current?.close() }, [])
  useEffect(() => { sfxRef.current?.setMuted(muted) }, [muted])

  const did = Object.fromEntries(done.map((k) => [k, true]))
  const stage = risen ? 4 : Math.min(done.length, 3)
  const allDone = steps.length > 0 && steps.every((st) => did[st.obj])

  const doStep = (obj) => {
    if (did[obj] || risen) return
    sfx()[obj]?.()
    const next = [...done, obj]
    setDone(next)
    if (steps.every((st) => next.includes(st.obj))) requestAnimationFrame(() => sunBtn.current?.focus({ preventScroll: true }))
  }
  const raise = () => {
    if (risen || !allDone) return
    sfx().sun()
    setRisen(true)
    timer.current = setTimeout(() => setShowFinal(true), reducedMotion() ? 0 : 1700)
  }
  useEffect(() => {
    if (!showFinal) return
    const el = finalRef.current
    el?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
    el?.focus({ preventScroll: true })
    burst(confetti.current)
  }, [showFinal])
  const again = () => {
    clearTimeout(timer.current)
    setDone([]); setRisen(false); setShowFinal(false); setRound((r) => r + 1)
    sceneRef.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
  }

  const target = Date.parse(meta.when || '')
  const diff = target - now
  const win = (meta.windowMin || 90) * 60000
  const when = Number.isNaN(target) ? '' : diff > 0 ? `${until(diff)} ${meta.toGo || ''}`.trim() : diff > -win ? meta.during : meta.after
  const times = meta.times || []
  const hints = meta.hints || []
  const [vx, vy] = [360, 228]
  const pct = ([x, y, w, h]) => ({ left: `${(x / vx) * 100}%`, top: `${(y / vy) * 100}%`, width: `${(w / vx) * 100}%`, height: `${(h / vy) * 100}%` })
  const notes = done.map((k) => steps.find((st) => st.obj === k)).filter(Boolean)

  return (
    <div className={risen ? 'am-root is-up' : 'am-root'} style={{ '--wash': stage / 4 }}>
      <style>{CSS}</style>
      <div className="am-wash" aria-hidden="true" />
      <div className="am-confetti" ref={confetti} aria-hidden="true" />

      <div className="am-top">
        <button type="button" className="am-back" onClick={onBack}><BackArrow /><span>Back to site</span></button>
        <button type="button" className="am-mute" aria-pressed={!muted} onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Sound off' : 'Sound on'} title={muted ? 'Sound off' : 'Sound on'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5L6 9H3v6h3l5 4V5z" />
            {muted ? <path d="M22 9l-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
          </svg>
        </button>
      </div>

      <main className="am-main">
        <header className="am-hero">
          <p className="am-chips">
            {meta.kicker && <span className="am-chip">{meta.kicker}</span>}
            {when && <span className="am-chip am-count"><i aria-hidden="true" />{when}</span>}
          </p>
          <Title text={meta.title} />
          {meta.sub && <p className="am-sub">{meta.sub}</p>}
        </header>

        <section className="am-stagewrap" ref={sceneRef} key={round}>
          <div className="am-clock">
            <p className="am-time"><b>{times[stage] || ''}</b>{times[stage] && <span>{meta.ampm}</span>}</p>
            <p className="am-hint" aria-live="polite">{hints[stage] || ''}</p>
          </div>
          <div className="am-stage">
            <Scene stage={stage} did={did} label={meta.sceneLabel} />
            {steps.map((st) => !did[st.obj] && !risen && HOTSPOTS[st.obj] && (
              <button key={st.obj} type="button" className="am-hot" style={pct(HOTSPOTS[st.obj])}
                tabIndex={-1} aria-hidden="true" onClick={() => doStep(st.obj)} />
            ))}
            {allDone && !risen && (
              <button type="button" className="am-hot am-hot-sun" style={pct(HOTSPOTS.sun)} tabIndex={-1} aria-hidden="true" onClick={raise} />
            )}
          </div>

          {!risen && (
            <div className="am-acts">
              {steps.map((st) => (
                <button key={st.obj} type="button" className={did[st.obj] ? 'am-act done' : 'am-act'} disabled={!!did[st.obj]} onClick={() => doStep(st.obj)}>
                  <span className="am-act-i" aria-hidden="true">{did[st.obj] ? '✓' : st.icon}</span>{st.label}
                </button>
              ))}
              {allDone && (
                <button ref={sunBtn} type="button" className="am-sunbtn" onClick={raise}>
                  <span aria-hidden="true">{sun.icon}</span>{sun.label}
                </button>
              )}
            </div>
          )}

          <ol className="am-notes" aria-live="polite">
            {notes.map((st) => (
              <li key={st.obj} className={`am-note is-${st.obj}`}>
                <h2>{st.title}</h2>
                <p>{st.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {showFinal && (
          <>
            <article className="am-final" ref={finalRef} tabIndex={-1}>
              <svg className="am-doodle" viewBox="0 0 120 40" aria-hidden="true">
                <circle cx="20" cy="20" r="9" fill="#ffd36b" stroke="#f0a43a" strokeWidth="1.5" />
                <path d="M60 32 C 50 24 50 12 60 4 C 70 12 70 24 60 32 Z" fill="#00c45a" stroke="#0b5d3b" strokeWidth="1.5" />
                <path d="M100 30 C 92 24 88 20 88 16 a6 6 0 0 1 12 -2 a6 6 0 0 1 12 2 C 112 20 108 24 100 30 Z" fill="#ff8fab" />
              </svg>
              {final.kicker && <p className="am-final-k">{final.kicker}</p>}
              {final.title && <h2 className="am-final-t">{final.title}</h2>}
              {(final.lines || []).map((l, i) => <p key={i} className="am-final-p">{l}</p>)}
              {final.closer && <p className="am-final-c">{final.closer}</p>}
              {Array.isArray(final.sign) && (
                <p className="am-final-s">{final.sign.map((s, i) => <span key={i}>{s}</span>)}</p>
              )}
            </article>
            {shell.prompt && <Query shell={shell} sfx={sfx} />}
          </>
        )}

        <footer className="am-end">
          {risen && end.again && <button type="button" className="am-ghost" onClick={again}>{end.again}</button>}
          {end.note && <p className="am-end-note">{end.note}</p>}
        </footer>
      </main>
    </div>
  )
}

export default function SevenAM({ onBack }) {
  const key = readKey()
  const [data, setData] = useState(() => (cached && cached.key === key ? cached.data : null))
  const [failed, setFailed] = useState(false)
  const setSuppressed = useAmbient()?.setSuppressed
  const back = onBack || (() => { window.location.hash = '' })

  useEffect(() => {
    setSuppressed?.(true)
    return () => setSuppressed?.(false)
  }, [setSuppressed])

  useEffect(() => {
    if (document.getElementById(FONTS_ID)) return
    const l = document.createElement('link')
    l.id = FONTS_ID
    l.rel = 'stylesheet'
    l.href = FONTS_HREF
    document.head.appendChild(l)
  }, [])

  useEffect(() => {
    if (!key || (data && cached?.key === key)) return
    let live = true
    setFailed(false)
    unlock(key)
      .then((d) => { if (!live) return; cached = { key, data: d }; setData(d) })
      .catch(() => { if (live) setFailed(true) })
    return () => { live = false }
  }, [key, data])

  if (data && cached?.key === key) return <Morning data={data} onBack={back} />
  return <Closed opening={!!key && !failed} onBack={back} />
}

/* ----------------------------- styles ------------------------------ */

const FONT_ROUND = `'Fredoka', 'Nunito', system-ui, sans-serif`
const CSS = `
body:has(.am-root) { background: #0b1022 !important; background-image: none !important; }
.am-root {
  --night: #0b1022; --cream: #fbf5ea; --text: #f3efe6; --soft: #c9cce0; --dim: #a3a9c2;
  --green: #00ed64; --sun: #ffd36b;
  position: relative; min-height: 100vh; min-height: 100dvh; overflow-x: clip; color-scheme: dark;
  background: radial-gradient(120% 60% at 50% -8%, #1d2858 0%, rgba(29,40,88,0) 60%), var(--night);
  color: var(--text); font-family: 'Nunito', system-ui, sans-serif; -webkit-font-smoothing: antialiased;
}
.am-root :focus-visible { outline: 3px solid var(--sun); outline-offset: 3px; border-radius: 12px; }
.am-wash { position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background: radial-gradient(90% 55% at 50% 0%, rgba(255,186,120,.3), rgba(255,186,120,0) 70%);
  opacity: calc(var(--wash, 0) * .9); transition: opacity 1.6s ease; }

.am-top { position: relative; z-index: 2; max-width: 40rem; margin: 0 auto; padding: .9rem 1.1rem 0; display: flex; align-items: center; justify-content: space-between; }
.am-back { display: inline-flex; align-items: center; gap: .4rem; min-height: 2.6rem; padding: .35rem .8rem .35rem .55rem; border: 0; border-radius: 99px;
  background: rgba(255,255,255,.05); color: var(--soft); font: 600 .92rem 'Nunito', system-ui, sans-serif; cursor: pointer; transition: background .2s, color .2s; }
.am-back:hover { color: var(--text); background: rgba(255,255,255,.1); }
.am-back svg, .am-ghost svg { width: 1rem; height: 1rem; }
.am-mute { width: 2.6rem; height: 2.6rem; display: grid; place-items: center; border: 0; border-radius: 50%; background: rgba(255,255,255,.05); color: var(--soft); cursor: pointer; }
.am-mute:hover { color: var(--text); background: rgba(255,255,255,.1); }
.am-mute svg { width: 1.15rem; height: 1.15rem; }

.am-main { position: relative; z-index: 1; max-width: 36rem; margin: 0 auto; padding: 1.4rem 1.1rem 4rem; }
.am-hero { text-align: center; }
.am-chips { margin: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: .45rem; }
.am-chip { display: inline-flex; align-items: center; gap: .45rem; padding: .42rem .85rem; border-radius: 99px;
  border: 1.5px solid rgba(255,211,107,.45); background: rgba(255,211,107,.08); color: #ffe3a3; font: 600 .84rem/1.25 ${FONT_ROUND}; }
.am-count { border-color: rgba(0,237,100,.45); background: rgba(0,237,100,.08); color: #b8f5cf; }
.am-count i { flex: none; width: .5rem; height: .5rem; border-radius: 50%; background: var(--green); animation: am-ping 2s infinite; }
.am-title { margin: 1rem 0 0; font: 700 clamp(2.4rem, 11vw, 3.7rem)/1.04 ${FONT_ROUND}; letter-spacing: -.01em; color: var(--cream); text-wrap: balance; }
.am-title-name { display: inline-block; padding-bottom: .06em; background: linear-gradient(100deg, #ffd36b, #ff9f7a 55%, #ff8fab);
  -webkit-background-clip: text; background-clip: text; color: transparent; }
.am-sub { margin: .9rem auto 0; max-width: 28rem; font-size: 1.06rem; line-height: 1.6; color: var(--soft); }

.am-stagewrap { margin-top: 1.9rem; scroll-margin-top: 1rem; }
.am-clock { display: grid; justify-items: center; gap: .3rem; padding: 0 .25rem .8rem; text-align: center; }
.am-time { margin: 0; display: flex; align-items: baseline; gap: .3rem; font-family: ${FONT_ROUND}; }
.am-time b { font-size: 2.3rem; font-weight: 700; line-height: 1; color: var(--sun); font-variant-numeric: tabular-nums; }
.am-time span { font-size: .95rem; font-weight: 600; color: #ffe3a3; }
.am-hint { margin: 0; font-size: .98rem; line-height: 1.4; color: var(--soft); }
.am-stage { position: relative; border-radius: 26px; overflow: hidden; background: #121933; border: 2px solid #2b3566;
  box-shadow: 0 24px 60px -24px rgba(0,0,0,.75), 0 0 0 6px rgba(255,255,255,.025); }
.am-svg { display: block; width: 100%; height: auto; }
.am-hot { position: absolute; padding: 0; border: 0; background: none; cursor: pointer; border-radius: 30%; -webkit-tap-highlight-color: transparent; }
.am-hot::after { content: ''; position: absolute; left: 50%; top: 50%; width: 3.6rem; height: 3.6rem; margin: -1.8rem 0 0 -1.8rem; border-radius: 50%;
  border: 2px dashed rgba(255,211,107,.85); animation: am-ring 2.2s ease-in-out infinite; pointer-events: none; }
.am-hot:hover::after { border-style: solid; }
.am-hot-sun::after { width: 5rem; height: 5rem; margin: -2.5rem 0 0 -2.5rem; border-color: rgba(255,232,170,.95); }

.am-acts { margin-top: 1.05rem; display: flex; flex-wrap: wrap; justify-content: center; gap: .55rem; }
.am-act { display: inline-flex; align-items: center; gap: .5rem; min-height: 2.9rem; padding: .5rem 1.05rem .5rem .85rem; border-radius: 99px;
  border: 1.5px solid rgba(255,255,255,.16); background: rgba(255,255,255,.06); color: var(--text); font: 600 1rem/1.1 ${FONT_ROUND};
  cursor: pointer; transition: transform .15s, background .2s, border-color .2s; }
.am-act:hover { background: rgba(255,255,255,.11); }
.am-act:active { transform: scale(.97); }
.am-act-i { font-size: 1.15rem; line-height: 1; }
.am-act.done { cursor: default; border-color: rgba(0,237,100,.45); background: rgba(0,237,100,.1); color: #b8f5cf; }
.am-act.done .am-act-i { color: var(--green); font-weight: 700; }
.am-sunbtn { display: inline-flex; align-items: center; gap: .55rem; min-height: 3.2rem; padding: .6rem 1.5rem; border: 0; border-radius: 99px; cursor: pointer;
  background: linear-gradient(100deg, #ffe08a, #ffb36b 60%, #ff9f7a); color: #2b1a0c; font: 700 1.12rem/1 ${FONT_ROUND};
  box-shadow: 0 10px 30px -8px rgba(255,170,90,.7); animation: am-glow 2s ease-in-out infinite; }
.am-sunbtn span { font-size: 1.3rem; }

.am-notes { list-style: none; margin: 1.25rem 0 0; padding: 0; display: grid; gap: .75rem; }
.am-note { position: relative; padding: 1rem 1.1rem 1.05rem 1.3rem; border-radius: 18px; background: #151c3d; border: 1.5px solid rgba(255,255,255,.08);
  animation: am-in .6s cubic-bezier(.2,.9,.3,1.2) both; }
.am-note::before { content: ''; position: absolute; left: 0; top: .95rem; bottom: .95rem; width: 4px; border-radius: 4px; background: var(--accent, var(--sun)); }
.am-note.is-mug { --accent: #ffb36b; } .am-note.is-plant { --accent: #00ed64; } .am-note.is-teddy { --accent: #ff8fab; }
.am-note h2 { margin: 0; font: 600 1.2rem/1.25 ${FONT_ROUND}; color: var(--cream); }
.am-note p { margin: .35rem 0 0; font-size: 1.02rem; line-height: 1.65; color: var(--soft); }

.am-final { position: relative; margin-top: 2.3rem; padding: 2rem 1.4rem 1.9rem; border-radius: 28px; background: #fff7ea; color: #3b3027; text-align: center;
  box-shadow: 0 30px 80px -30px rgba(255,170,90,.6); scroll-margin-top: 1rem; animation: am-rise .9s cubic-bezier(.2,.9,.3,1.1) both; }
.am-final:focus { outline: none; }
.am-final:focus-visible { outline: 3px solid var(--sun); outline-offset: 4px; }
.am-doodle { display: block; width: 7.5rem; height: 2.5rem; margin: 0 auto .5rem; }
.am-final-k { margin: 0; font: 700 .8rem/1 ${FONT_ROUND}; letter-spacing: .2em; text-transform: uppercase; color: #b4400e; }
.am-final-t { margin: .6rem 0 .8rem; font: 700 clamp(2rem, 9vw, 2.8rem)/1.06 ${FONT_ROUND}; color: #2b2118; text-wrap: balance; }
.am-final-p { margin: .75rem auto 0; max-width: 27rem; font-size: 1.08rem; line-height: 1.7; color: #3b3027; }
.am-final-c { margin: 1.35rem 0 0; font: 600 1.3rem/1.35 ${FONT_ROUND}; color: #00684a; }
.am-final-s { margin: 1.2rem 0 0; display: grid; gap: .15rem; font: 700 1.4rem/1.15 'Gaegu', 'Nunito', system-ui, sans-serif; color: #6b4e3d; }
.am-final-s span:last-child { font-size: 1.75rem; color: #b4400e; }

.am-q { margin-top: 1.9rem; }
.am-q-cap { margin: 0 0 .65rem; text-align: center; font: 600 1.02rem ${FONT_ROUND}; color: var(--soft); }
.am-q-card { border-radius: 18px; overflow: hidden; background: #001e2b; border: 1.5px solid #0e3a4c; box-shadow: 0 20px 50px -24px rgba(0,0,0,.8); }
.am-q-bar { display: flex; align-items: center; gap: .4rem; padding: .55rem .85rem; background: #04293a; border-bottom: 1px solid #0e3a4c; }
.am-q-bar i { width: .62rem; height: .62rem; border-radius: 50%; background: #ff6b6b; }
.am-q-bar i:nth-child(2) { background: #ffd36b; } .am-q-bar i:nth-child(3) { background: #00ed64; }
.am-q-bar span { margin-left: .45rem; font: 500 .76rem 'JetBrains Mono', ui-monospace, monospace; color: #94bccb; }
.am-q-body { padding: .95rem 1rem 1.05rem; font: 500 .84rem/1.65 'JetBrains Mono', ui-monospace, monospace; color: #e7f5ee; }
.am-q-line { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.am-q-in { padding-left: 1.2rem; animation: am-in .35s ease both; }
.am-q-pr { color: var(--green); font-weight: 700; }
.am-q-key { color: #7fe3c1; } .am-q-p { color: #94bccb; } .am-q-str { color: #ffd27a; } .am-q-bool { color: #ff9fb2; } .am-q-num { color: #c3b4ff; }
.am-q-run { margin-top: .85rem; display: inline-flex; align-items: center; gap: .45rem; min-height: 2.7rem; padding: .45rem 1.15rem; border: 0; border-radius: 99px;
  background: var(--green); color: #001e2b; font: 700 .98rem ${FONT_ROUND}; cursor: pointer; }
.am-q-run:hover { filter: brightness(1.06); }
.am-q-found { margin: .75rem 0 0; color: #a6ecc6; font-style: italic; animation: am-in .4s ease both; }

.am-end { margin-top: 2.6rem; display: grid; justify-items: center; gap: .85rem; text-align: center; }
.am-ghost { display: inline-flex; align-items: center; gap: .45rem; min-height: 2.7rem; padding: .45rem 1.15rem; border-radius: 99px;
  border: 1.5px solid rgba(255,255,255,.2); background: rgba(255,255,255,.04); color: var(--text); font: 600 .96rem ${FONT_ROUND}; cursor: pointer; }
.am-ghost:hover { background: rgba(255,255,255,.09); }
.am-end-note { margin: 0; font-size: .84rem; color: var(--dim); }

.am-closed { display: grid; place-items: center; padding: 1.5rem; }
.am-closed-card { max-width: 22rem; display: grid; justify-items: center; gap: 1rem; text-align: center; }
.am-closed-moon { width: 4rem; height: 4rem; animation: am-float 4s ease-in-out infinite; }
.am-closed-t { margin: 0; font: 600 1.15rem/1.45 ${FONT_ROUND}; color: var(--soft); }

.am-confetti { position: fixed; inset: 0; z-index: 50; overflow: hidden; pointer-events: none; }
.am-bit { position: absolute; top: -2rem; animation: am-fall var(--d, 3s) cubic-bezier(.25,.6,.4,1) both; will-change: transform; }
.am-bit.leaf { width: .7rem; height: .7rem; border-radius: 0 80% 0 80%; }
.am-bit.heart, .am-bit.spark { font-size: 1rem; line-height: 1; }

/* scene */
.am-fade { transition: opacity 1.4s ease; }
.am-tw { animation: am-tw 3.2s ease-in-out infinite; }
.am-sun { transform: translateY(96px); transition: transform 2.1s cubic-bezier(.22,.9,.3,1); }
.am-sun.on { transform: translateY(0); }
.am-rays { transform-origin: 116px 76px; animation: am-spin 24s linear infinite; }
.am-steam path { opacity: 0; }
.am-steam.on path { animation: am-steam 2.6s ease-in-out infinite; }
.am-steam.on path:nth-child(2) { animation-delay: .85s; }
.am-steam.on path:nth-child(3) { animation-delay: 1.7s; }
.am-drops path { opacity: 0; }
.am-drops.on path { animation: am-drop .95s cubic-bezier(.55,0,1,.45) 2 both; }
.am-drops.on path:nth-child(2) { animation-delay: .18s; }
.am-drops.on path:nth-child(3) { animation-delay: .36s; }
.am-sprout { transform-box: fill-box; transform-origin: 50% 100%; transform: scale(.62); transition: transform 1.2s cubic-bezier(.34,1.56,.64,1) .95s; }
.am-sprout.on { transform: scale(1); }
.am-leaf { transform-box: fill-box; transform-origin: 50% 100%; transform: scale(0); transition: transform 1.1s cubic-bezier(.34,1.56,.64,1) 1.7s; }
.am-leaf.on { transform: scale(1); }
.am-spark path { transform-box: fill-box; transform-origin: center; transform: scale(0); }
.am-spark.on path { animation: am-twinkle 1.8s ease-in-out 2.7s infinite; }
.am-spark.on path:nth-child(2) { animation-delay: 3.3s; }
.am-ted { transform-box: fill-box; transform-origin: 50% 100%; }
.am-tedwrap.on .am-ted { animation: am-squish .8s cubic-bezier(.3,1.6,.5,1); }
.am-eyes-sleep, .am-eyes-up { transition: opacity .25s; }
.am-eyes-up { opacity: 0; }
.am-tedwrap.on .am-eyes-up { opacity: 1; }
.am-tedwrap.on .am-eyes-sleep { opacity: 0; }
.am-blush { opacity: .45; transition: opacity .4s; }
.am-tedwrap.on .am-blush { opacity: .95; }
.am-heart { transform-box: fill-box; transform-origin: 50% 100%; transform: scale(0); opacity: 0;
  transition: transform .6s cubic-bezier(.34,1.56,.64,1) .25s, opacity .3s .25s; }
.am-tedwrap.on .am-heart { transform: scale(1); opacity: 1; animation: am-beat 1.6s ease-in-out 1.1s infinite; }
.am-zz text { font: 700 11px ${FONT_ROUND}; fill: #c9d2ff; }
.am-zz { animation: am-zz 3s ease-in-out infinite; transition: opacity .3s; }
.am-tedwrap.on .am-zz { opacity: 0; animation: none; }

@keyframes am-tw { 0%, 100% { opacity: 1 } 50% { opacity: .25 } }
@keyframes am-spin { to { transform: rotate(360deg) } }
@keyframes am-steam { 0% { opacity: 0; transform: translateY(8px) } 30% { opacity: .85 } 100% { opacity: 0; transform: translateY(-14px) } }
@keyframes am-drop { 0% { opacity: 0; transform: translateY(0) } 15% { opacity: 1 } 85% { opacity: 1 } 100% { opacity: 0; transform: translateY(80px) } }
@keyframes am-twinkle { 0%, 100% { transform: scale(0) } 50% { transform: scale(1) } }
@keyframes am-squish { 0% { transform: scale(1, 1) } 30% { transform: scale(1.08, .9) } 60% { transform: scale(.96, 1.05) } 100% { transform: scale(1, 1) } }
@keyframes am-beat { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.12) } }
@keyframes am-zz { 0%, 100% { transform: translateY(0); opacity: .9 } 50% { transform: translateY(-4px); opacity: .5 } }
@keyframes am-ring { 0%, 100% { transform: scale(.9); opacity: .55 } 50% { transform: scale(1.08); opacity: 1 } }
@keyframes am-ping { 0% { box-shadow: 0 0 0 0 rgba(0,237,100,.55) } 80%, 100% { box-shadow: 0 0 0 8px rgba(0,237,100,0) } }
@keyframes am-glow { 0%, 100% { box-shadow: 0 10px 30px -8px rgba(255,170,90,.6) } 50% { box-shadow: 0 10px 42px -4px rgba(255,190,110,.95) } }
@keyframes am-in { from { opacity: 0; transform: translateY(10px) scale(.98) } to { opacity: 1; transform: none } }
@keyframes am-rise { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: none } }
@keyframes am-float { 0%, 100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
@keyframes am-fall { from { transform: translate3d(0, 0, 0) rotate(0deg) } to { transform: translate3d(var(--x), 112vh, 0) rotate(var(--r)) } }

@media (prefers-reduced-motion: reduce) {
  .am-root *, .am-root *::before, .am-root *::after { animation: none !important; transition: none !important; }
  .am-confetti { display: none; }
}
`
