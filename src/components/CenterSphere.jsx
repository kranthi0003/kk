import React, { useState } from 'react'

// ============================================================
// CenterSphere — steven.com-style ring sections
// Each ring is a thick beveled band with ONE bold curved label.
// Clicking a ring navigates to that section.
// ============================================================

const PROFILE_URL = new URL('../../assets/profile.png', import.meta.url).href

// 4 ring sections, outermost → innermost. Each is its own clickable nav.
// Thick bands (~46px wide) like steven.com.
const RINGS = [
  { id: 'workspace',  ro: 208, ri: 162, label: 'WORKSPACE  ·  EXPLORE  ·  WORKSPACE  ·  EXPLORE',  href: '#/workspace',  hue: 270, size: 22 },
  { id: 'projects',   ro: 160, ri: 120, label: 'PROJECTS  ·  BUILDS  ·  PROJECTS  ·  BUILDS',       href: '#/projects',   hue: 220, size: 20 },
  { id: 'experience', ro: 118, ri: 86,  label: 'EXPERIENCE  ·  JOURNEY  ·  EXPERIENCE',             href: '#/experience', hue: 180, size: 16 },
  { id: 'connect',    ro: 84,  ri: 62,  label: 'CONNECT  ·  WRITE  ·  CONNECT  ·  WRITE',           href: '#/connect',    hue: 320, size: 12 },
]

export default function CenterSphere() {
  const [hover, setHover] = useState(null)

  const nav = (href) => {
    window.location.hash = href.slice(1)
    window.location.reload()
  }

  return (
    <svg viewBox="-220 -220 440 440" className="absolute inset-0 w-full h-full select-none">
      <defs>
        {/* Outer rim base */}
        <radialGradient id="rim-base" cx="50%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#2a1f3a" />
          <stop offset="60%" stopColor="#0f0a1c" />
          <stop offset="100%" stopColor="#020108" />
        </radialGradient>

        {/* Per-ring fills — subtle hue tints, dark base */}
        {RINGS.map((r) => (
          <radialGradient key={`rg-${r.id}`} id={`ring-${r.id}`} cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor={`hsl(${r.hue} 30% 22%)`} />
            <stop offset="60%" stopColor={`hsl(${r.hue} 28% 11%)`} />
            <stop offset="100%" stopColor="#050208" />
          </radialGradient>
        ))}

        {/* Hover variants — brighter */}
        {RINGS.map((r) => (
          <radialGradient key={`rh-${r.id}`} id={`ring-${r.id}-hot`} cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor={`hsl(${r.hue} 70% 50%)`} />
            <stop offset="55%" stopColor={`hsl(${r.hue} 55% 22%)`} />
            <stop offset="100%" stopColor="#0a0612" />
          </radialGradient>
        ))}

        {/* Glassy top highlight + bottom shadow for bevel */}
        <linearGradient id="bevel-top" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="35%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>
        <linearGradient id="bevel-bot" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="55%" stopColor="rgba(0,0,0,0.25)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.7)" />
        </linearGradient>

        {/* Center bubble */}
        <radialGradient id="bubble" cx="35%" cy="30%" r="85%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
          <stop offset="22%" stopColor="rgba(255,255,255,0.1)" />
          <stop offset="60%" stopColor="rgba(167,139,250,0.06)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.4)" />
        </radialGradient>
        <clipPath id="profile-clip">
          <circle cx="0" cy="0" r="56" />
        </clipPath>

        {/* Ring band shapes (annulus via even-odd) and arc paths for text */}
        {RINGS.map((r) => {
          const midR = (r.ro + r.ri) / 2 - r.size * 0.35 // text radius (slightly inward)
          return (
            <g key={`def-${r.id}`}>
              <path
                id={`band-${r.id}`}
                fillRule="evenodd"
                d={annulusPath(r.ro, r.ri)}
              />
              {/* Top arc for label — start at left, sweep over top to right */}
              <path
                id={`arc-${r.id}`}
                d={`M ${-midR} 0 a ${midR} ${midR} 0 1 1 ${midR * 2} 0`}
                fill="none"
              />
            </g>
          )
        })}
      </defs>

      {/* Outer rim — full disc behind everything for depth */}
      <circle cx="0" cy="0" r="216" fill="url(#rim-base)" />
      <circle cx="0" cy="0" r="216" fill="url(#bevel-top)" />
      <circle cx="0" cy="0" r="216" fill="url(#bevel-bot)" />
      <circle cx="0" cy="0" r="216" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.8" />

      {/* Ring bands — each is its own clickable section */}
      {RINGS.map((r) => {
        const isHot = hover === r.id
        return (
          <g
            key={r.id}
            onMouseEnter={() => setHover(r.id)}
            onMouseLeave={() => setHover(null)}
            onClick={() => nav(r.href)}
            style={{ cursor: 'pointer' }}
          >
            {/* Band fill (annulus) */}
            <use href={`#band-${r.id}`} fill={isHot ? `url(#ring-${r.id}-hot)` : `url(#ring-${r.id})`} />
            {/* Bevel top highlight clipped to band */}
            <use href={`#band-${r.id}`} fill="url(#bevel-top)" />
            {/* Bevel bottom shadow clipped to band */}
            <use href={`#band-${r.id}`} fill="url(#bevel-bot)" />
            {/* Outer edge highlight */}
            <circle cx="0" cy="0" r={r.ro} fill="none"
              stroke={isHot ? `hsla(${r.hue}, 90%, 75%, 0.7)` : 'rgba(255,255,255,0.09)'}
              strokeWidth={isHot ? 1.2 : 0.8} />
            {/* Inner edge recess */}
            <circle cx="0" cy="0" r={r.ri} fill="none" stroke="rgba(0,0,0,0.7)" strokeWidth="1.5" />
            <circle cx="0" cy="0" r={r.ri - 1} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

            {/* Section label — curved over top of band */}
            <text
              fontFamily="Bricolage Grotesque, sans-serif"
              fontSize={r.size}
              fontWeight="800"
              letterSpacing={r.size > 16 ? 4 : 2.5}
              fill={isHot ? '#fff' : 'rgba(255,255,255,0.86)'}
              style={{
                pointerEvents: 'none',
                filter: isHot ? `drop-shadow(0 0 12px hsla(${r.hue}, 90%, 70%, 0.8))` : 'drop-shadow(0 1px 2px rgba(0,0,0,0.9))',
                transition: 'fill 200ms',
              }}
            >
              <textPath href={`#arc-${r.id}`} startOffset="50%" textAnchor="middle">
                {r.label}
              </textPath>
            </text>
          </g>
        )
      })}

      {/* Tiny index ticks on outer rim */}
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg - 90) * Math.PI / 180
        const x = Math.cos(rad) * 212
        const y = Math.sin(rad) * 212
        return (
          <g key={deg} transform={`translate(${x} ${y}) rotate(${deg})`} style={{ pointerEvents: 'none' }}>
            <path d="M -3.5 0 L 3.5 0 L 0 -4.5 Z" fill="rgba(255,255,255,0.45)" />
          </g>
        )
      })}

      {/* Center bubble — profile photo, clickable → About */}
      <g
        onMouseEnter={() => setHover('center')}
        onMouseLeave={() => setHover(null)}
        onClick={() => nav('#/about')}
        style={{ cursor: 'pointer' }}
      >
        <circle cx="0" cy="0" r="60" fill="rgba(0,0,0,0.95)" />
        <g clipPath="url(#profile-clip)">
          <image
            href={PROFILE_URL}
            x="-62" y="-62" width="124" height="124"
            preserveAspectRatio="xMidYMid slice"
            style={{ filter: hover === 'center' ? 'saturate(1.2) contrast(1.1) brightness(1.1)' : 'saturate(1.05) contrast(1.05)', transition: 'filter 250ms' }}
          />
        </g>
        <circle cx="0" cy="0" r="56" fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="4" />
        <circle cx="0" cy="0" r="56" fill="url(#bubble)" style={{ pointerEvents: 'none' }} />
        <ellipse cx="-18" cy="-26" rx="16" ry="8" fill="white" opacity="0.3" transform="rotate(-28 -18 -26)" style={{ pointerEvents: 'none' }} />
        <ellipse cx="-10" cy="-18" rx="5" ry="2.5" fill="white" opacity="0.7" style={{ pointerEvents: 'none' }} />
        <circle cx="0" cy="0" r="56" fill="none"
          stroke={hover === 'center' ? 'rgba(167,139,250,0.95)' : 'rgba(167,139,250,0.5)'}
          strokeWidth={hover === 'center' ? 2 : 1.5}
          style={{ transition: 'stroke 200ms' }} />
        <circle cx="0" cy="0" r="58" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="1" style={{ pointerEvents: 'none' }} />
      </g>
    </svg>
  )
}

// Annulus path for ring band (outer circle CW + inner circle CCW, even-odd fill)
function annulusPath(ro, ri) {
  return `M ${-ro} 0 a ${ro} ${ro} 0 1 1 ${ro * 2} 0 a ${ro} ${ro} 0 1 1 ${-ro * 2} 0 ` +
         `M ${-ri} 0 a ${ri} ${ri} 0 1 0 ${ri * 2} 0 a ${ri} ${ri} 0 1 0 ${-ri * 2} 0 Z`
}
