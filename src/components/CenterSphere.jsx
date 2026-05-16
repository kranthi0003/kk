import React from 'react'

// ============================================================
// CenterSphere — steven.com-style stacked aperture lens
// Concentric recessed rings with curving text labels in each
// Center bubble shows profile photo with glass highlight
// ============================================================

const PROFILE_URL = new URL('../../assets/profile.png', import.meta.url).href

const RINGS = [
  { id: 'outer',  ro: 200, ri: 168, label: '  KRANTHI · KIRAN  ·  CLOUD ENGINEER  ·  BUILDING AT GITHUB  ·  KRANTHI · KIRAN  ·  CLOUD ENGINEER  ·  BUILDING AT GITHUB  ·' },
  { id: 'second', ro: 166, ri: 138, label: '  GITHUB  ·  COUCHBASE  ·  AMAZON  ·  GITHUB  ·  COUCHBASE  ·  AMAZON  ·  GITHUB  ·  COUCHBASE  ·  AMAZON  ·' },
  { id: 'third',  ro: 136, ri: 108, label: '  GO  ·  KUBERNETES  ·  TERRAFORM  ·  TYPESCRIPT  ·  AWS  ·  GO  ·  KUBERNETES  ·  TERRAFORM  ·  TYPESCRIPT  ·  AWS  ·' },
  { id: 'inner',  ro: 106, ri: 82,  label: '  DISTRIBUTED SYSTEMS  ·  PLATFORM  ·  TOOLING  ·  DISTRIBUTED SYSTEMS  ·  PLATFORM  ·  TOOLING  ·' },
]

export default function CenterSphere() {
  return (
    <svg viewBox="-220 -220 440 440" className="absolute inset-0 w-full h-full">
      <defs>
        <radialGradient id="rim-grad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#2a1f3a" />
          <stop offset="60%" stopColor="#100a1a" />
          <stop offset="100%" stopColor="#020108" />
        </radialGradient>
        <radialGradient id="recess-1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1c1530" />
          <stop offset="100%" stopColor="#0a0612" />
        </radialGradient>
        <radialGradient id="recess-2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#16102a" />
          <stop offset="100%" stopColor="#070310" />
        </radialGradient>
        <radialGradient id="recess-3" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#100c20" />
          <stop offset="100%" stopColor="#050208" />
        </radialGradient>
        <radialGradient id="bubble" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
          <stop offset="20%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="60%" stopColor="rgba(167,139,250,0.08)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
        </radialGradient>
        <linearGradient id="top-hl" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0.03)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
        <linearGradient id="bot-shadow" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="60%" stopColor="rgba(0,0,0,0.18)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
        </linearGradient>
        <clipPath id="profile-clip">
          <circle cx="0" cy="0" r="72" />
        </clipPath>
        {RINGS.map((r) => {
          const midR = (r.ro + r.ri) / 2
          return (
            <path
              key={r.id}
              id={`arc-${r.id}`}
              d={`M ${-midR} 0 a ${midR} ${midR} 0 1 1 ${midR * 2} 0 a ${midR} ${midR} 0 1 1 ${-midR * 2} 0`}
              fill="none"
            />
          )
        })}
      </defs>

      {/* Outer rim disc */}
      <circle cx="0" cy="0" r="208" fill="url(#rim-grad)" />
      <circle cx="0" cy="0" r="208" fill="url(#top-hl)" />
      <circle cx="0" cy="0" r="208" fill="url(#bot-shadow)" />
      <circle cx="0" cy="0" r="208" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />

      {/* Concentric ring layers */}
      {RINGS.map((r, i) => {
        const fill = i === 0 ? 'url(#recess-1)' : i === 1 ? 'url(#recess-2)' : 'url(#recess-3)'
        return (
          <g key={r.id}>
            <circle cx="0" cy="0" r={r.ro} fill={fill} />
            <circle cx="0" cy="0" r={r.ro} fill="url(#top-hl)" />
            <circle cx="0" cy="0" r={r.ro} fill="url(#bot-shadow)" />
            <circle cx="0" cy="0" r={r.ro} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.7" />
            <circle cx="0" cy="0" r={r.ri} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="2" />
            <circle cx="0" cy="0" r={r.ri - 1} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

            <text
              fontFamily="Bricolage Grotesque, sans-serif"
              fontSize={i === 0 ? 12 : i === 1 ? 11 : i === 2 ? 10 : 9}
              fontWeight="700"
              fill="rgba(255,255,255,0.78)"
              letterSpacing={i === 3 ? 1.5 : 2.5}
            >
              <textPath href={`#arc-${r.id}`} startOffset="0">
                {r.label}
              </textPath>
            </text>
          </g>
        )
      })}

      {/* Tiny direction arrows around outermost ring */}
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg - 90) * Math.PI / 180
        const x = Math.cos(rad) * 188
        const y = Math.sin(rad) * 188
        return (
          <g key={deg} transform={`translate(${x} ${y}) rotate(${deg})`}>
            <path d="M -4 0 L 4 0 L 0 -5 Z" fill="rgba(255,255,255,0.4)" />
          </g>
        )
      })}

      {/* Center bubble — profile photo with glass effect */}
      <g>
        {/* Recess shadow */}
        <circle cx="0" cy="0" r="78" fill="rgba(0,0,0,0.9)" />
        {/* Profile photo */}
        <g clipPath="url(#profile-clip)">
          <image
            href={PROFILE_URL}
            x="-80" y="-80" width="160" height="160"
            preserveAspectRatio="xMidYMid slice"
            style={{ filter: 'saturate(1.05) contrast(1.05)' }}
          />
        </g>
        {/* Inner dark vignette */}
        <circle cx="0" cy="0" r="72" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="5" />
        {/* Glass overlay */}
        <circle cx="0" cy="0" r="72" fill="url(#bubble)" />
        {/* Specular highlight */}
        <ellipse cx="-22" cy="-32" rx="20" ry="11" fill="white" opacity="0.32" transform="rotate(-30 -22 -32)" />
        <ellipse cx="-12" cy="-22" rx="6" ry="3" fill="white" opacity="0.7" />
        {/* Edge highlight ring */}
        <circle cx="0" cy="0" r="72" fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth="1.5" />
        <circle cx="0" cy="0" r="74" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="1" />
      </g>
    </svg>
  )
}
