import React, { useEffect, useState } from 'react'

// "Hey" said around the world — rolls through greetings in many languages
// while the rest of the line ("I'm Kiran") stays put. A few native scripts
// are mixed in (incl. Telugu, home turf) for flavour; all left-to-right.
const GREETINGS = [
  'Hey',        // English
  'Hola',       // Spanish
  'Bonjour',    // French
  'Hallo',      // German
  'Ciao',       // Italian
  'Olá',        // Portuguese
  'नमस्ते',      // Hindi
  'こんにちは',   // Japanese
  '你好',        // Chinese
  'Привет',     // Russian
  'Merhaba',    // Turkish
  'Hej',        // Swedish
  '안녕',        // Korean
  'నమస్కారం',   // Telugu
  'Shalom',     // Hebrew
  'Xin chào',   // Vietnamese
]

export default function RollingGreeting() {
  const [i, setI] = useState(0)

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const id = setInterval(() => setI(n => (n + 1) % GREETINGS.length), 2100)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="rg-wrap" style={{ display: 'inline-block', perspective: '640px' }}>
      <style>{`
        @keyframes rgRoll {
          0%   { transform: translateY(0.5em) rotateX(-55deg); opacity: 0; filter: blur(4px); }
          55%  { opacity: 1; }
          100% { transform: translateY(0) rotateX(0); opacity: 1; filter: blur(0); }
        }
        .rg-word { display: inline-block; transform-origin: 50% 0; animation: rgRoll .6s cubic-bezier(.2,.75,.3,1) both; }
        @media (prefers-reduced-motion: reduce) { .rg-word { animation: none; } }
      `}</style>
      <span
        key={i}
        className="rg-word"
        style={{
          backgroundImage: 'linear-gradient(120deg, var(--color-brand), var(--color-accent))',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {GREETINGS[i]}
      </span>
    </span>
  )
}
