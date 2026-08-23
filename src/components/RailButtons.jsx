import React from 'react'

/* ------------------------------------------------------------------ *
 * Rail buttons 5–8: movies, photography, brands, OMSCS.
 *
 * The first four rail buttons are each their own file because each does
 * something the others don't — F1 and cricket fetch a small "what's on"
 * file, music reads the ambient context. These four don't. They are a
 * route, an icon, a tint and, for the three still being built, a WIP
 * badge. Four near-identical files would have been four places for the
 * same thing to drift, so they share one.
 *
 * Every one carries a rim, because that's most of what makes the F1
 * button read as a badge rather than an icon in a circle: a bright ring
 * hard at the edge with something punched out of it. Each rim is what
 * the subject is actually made of — film perforations, an aperture,
 * stitching, a laurel.
 *
 * The WIP badge sits at the opposite corner from the live pip and is
 * amber rather than green, so "still being built" can't be read as
 * "something is on right now".
 * ------------------------------------------------------------------ */

function RailLink({ href, index, tint, title, wip, children }) {
  return (
    <a
      href={href}
      aria-label={wip ? `${title} (work in progress)` : title}
      title={wip ? `${title} — work in progress` : title}
      className={'group rail-btn rail-tint' + (wip ? ' rail-wip' : '')}
      style={{ '--rail-i': index, '--tint': tint }}
    >
      {children}
    </a>
  )
}

// Same ball, but it fires an event instead of navigating — for the one
// whose destination is a panel that's already mounted rather than a
// route. The physics engine selects on .rail-btn, so this behaves
// identically once it's in the air.
function RailAction({ onClick, index, tint, title, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      title={title}
      className="group rail-btn rail-tint"
      style={{ '--rail-i': index, '--tint': tint }}
    >
      {children}
    </button>
  )
}

// A clapperboard, inside a rim of film perforations.
export function MoviesRailButton() {
  return (
    <RailLink href="#/movies" index={4} tint="#E8AC5F" title="Films — what's coming out">
      <svg className="mvbtn-rim rail-rim" viewBox="0 0 54 54" fill="none" aria-hidden="true">
        <circle cx="27" cy="27" r="24.6" stroke="currentColor" strokeWidth="4" opacity=".92" />
        <circle cx="27" cy="27" r="24.6" stroke="var(--rail-disc)" strokeWidth="2.4" strokeDasharray="2.6 4.6" />
      </svg>
      <svg className="rail-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2.6" y="9.4" width="18.8" height="11.6" rx="2" fill="currentColor" />
        <g className="mvbtn-clap" fill="currentColor">
          <path d="M2.6 5.6 20.2 2.4l.9 3.6L3.5 9.2z" />
        </g>
        <g fill="var(--rail-disc)">
          <path d="M7.1 4.6 8.6 8.2l-1.9.3L5.2 5z" />
          <path d="M12.2 3.7l1.5 3.6-1.9.3-1.5-3.6z" />
          <path d="M17.3 2.8l1.5 3.6-1.9.3-1.5-3.6z" />
        </g>
      </svg>
      <style>{`
        .mvbtn-clap { transform-origin: 3px 7px; transition: transform .4s cubic-bezier(.22,.61,.36,1); }
        .mvbtn-rim { transition: transform .55s cubic-bezier(.22,.61,.36,1); }
        .rail-btn:hover .mvbtn-clap { transform: rotate(-15deg); }
        .rail-btn:hover .mvbtn-rim { transform: rotate(24deg); }
        @media (prefers-reduced-motion: reduce) {
          .mvbtn-clap, .mvbtn-rim { transition: none; }
          .rail-btn:hover .mvbtn-clap, .rail-btn:hover .mvbtn-rim { transform: none; }
        }
      `}</style>
    </RailLink>
  )
}

// A camera, inside an aperture — six blades struck through the rim.
export function PhotographyRailButton() {
  return (
    <RailLink href="#/photos" index={5} tint="#93C2E6" title="Pictures" wip>
      <svg className="phbtn-rim rail-rim" viewBox="0 0 54 54" fill="none" aria-hidden="true">
        <circle cx="27" cy="27" r="24.6" stroke="currentColor" strokeWidth="3.6" opacity=".9" />
        <g stroke="var(--rail-disc)" strokeWidth="2.6">
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <line key={a} x1="27" y1="2.4" x2="27" y2="7.4" transform={`rotate(${a} 27 27)`} />
          ))}
        </g>
      </svg>
      <svg className="rail-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3.4 7.4h3.4l1.5-2.2h7.4l1.5 2.2h3.4a1.8 1.8 0 0 1 1.8 1.8v8.6a1.8 1.8 0 0 1-1.8 1.8H3.4a1.8 1.8 0 0 1-1.8-1.8V9.2a1.8 1.8 0 0 1 1.8-1.8z" fill="currentColor" />
        <circle cx="12" cy="13.4" r="4" fill="var(--rail-disc)" />
        <circle className="phbtn-eye" cx="12" cy="13.4" r="2.1" fill="currentColor" />
      </svg>
      <style>{`
        .phbtn-rim { transition: transform .55s cubic-bezier(.22,.61,.36,1); }
        .phbtn-eye { transition: r .35s cubic-bezier(.22,.61,.36,1); }
        .rail-btn:hover .phbtn-rim { transform: rotate(30deg); }
        .rail-btn:hover .phbtn-eye { r: 2.7; }
        @media (prefers-reduced-motion: reduce) {
          .phbtn-rim, .phbtn-eye { transition: none; }
          .rail-btn:hover .phbtn-rim { transform: none; }
        }
      `}</style>
    </RailLink>
  )
}

// A hanging tag, inside a rim of stitching — the thing every one of
// these shelves has attached to it, and readable at 28px in a way that a
// coat hanger is not.
export function BrandsRailButton() {
  return (
    <RailLink href="#/brands" index={6} tint="#D9A9B4" title="Brands — fashion, skin, lifestyle" wip>
      <svg className="brbtn-rim rail-rim" viewBox="0 0 54 54" fill="none" aria-hidden="true">
        <circle cx="27" cy="27" r="24.6" stroke="currentColor" strokeWidth="1.3" opacity=".45" />
        <circle cx="27" cy="27" r="24.6" stroke="currentColor" strokeWidth="3.2" strokeDasharray="3.4 5.4" opacity=".9" />
      </svg>
      <svg className="rail-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M11.6 2.2h8.3a2 2 0 0 1 2 2v8.3a2 2 0 0 1-.6 1.4l-7.6 7.6a2 2 0 0 1-2.8 0l-7.7-7.7a2 2 0 0 1 0-2.8l7.6-7.6a2 2 0 0 1 1.4-.6z" fill="currentColor" />
        <circle cx="17.1" cy="7" r="1.9" fill="var(--rail-disc)" />
      </svg>
      <style>{`
        .brbtn-rim { transition: transform .55s cubic-bezier(.22,.61,.36,1); }
        .rail-btn:hover .brbtn-rim { transform: rotate(-22deg); }
        @media (prefers-reduced-motion: reduce) {
          .brbtn-rim { transition: none; }
          .rail-btn:hover .brbtn-rim { transform: none; }
        }
      `}</style>
    </RailLink>
  )
}

// A mortarboard, inside a broken laurel.
export function OmscsRailButton() {
  return (
    <RailLink href="#/omscs" index={7} tint="#DCB63A" title="OMSCS — Georgia Tech" wip>
      <svg className="omsbtn-rim rail-rim" viewBox="0 0 54 54" fill="none" aria-hidden="true">
        <circle cx="27" cy="27" r="24.6" stroke="currentColor" strokeWidth="3.6" opacity=".9" />
        <circle cx="27" cy="27" r="24.6" stroke="var(--rail-disc)" strokeWidth="2.2" strokeDasharray="1.6 5.2" transform="rotate(-90 27 27)" />
      </svg>
      <svg className="rail-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3.1 22.6 8 12 12.9 1.4 8z" fill="currentColor" />
        <path d="M5.8 11.1v4.4c0 1.9 2.8 3.3 6.2 3.3s6.2-1.4 6.2-3.3v-4.4L12 14z" fill="currentColor" opacity=".68" />
        <path className="omsbtn-tassel" d="M20.7 8.9v4.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <style>{`
        .omsbtn-tassel { transform-origin: 20.7px 8.9px; transition: transform .45s cubic-bezier(.22,.61,.36,1); }
        .omsbtn-rim { transition: transform .55s cubic-bezier(.22,.61,.36,1); }
        .rail-btn:hover .omsbtn-tassel { transform: rotate(14deg); }
        .rail-btn:hover .omsbtn-rim { transform: rotate(28deg); }
        @media (prefers-reduced-motion: reduce) {
          .omsbtn-tassel, .omsbtn-rim { transition: none; }
          .rail-btn:hover .omsbtn-tassel, .rail-btn:hover .omsbtn-rim { transform: none; }
        }
      `}</style>
    </RailLink>
  )
}

// A rising line, inside a rim scored like a price axis. The line is the
// only mark here that means something literal, so it's drawn thick and
// left unfilled — a chart, not a logo.
export function StocksRailButton() {
  return (
    <RailLink href="#/stocks" index={8} tint="#5FBF8F" title="Stocks — the tape">
      <svg className="stbtn-rim rail-rim" viewBox="0 0 54 54" fill="none" aria-hidden="true">
        <circle cx="27" cy="27" r="24.6" stroke="currentColor" strokeWidth="3.6" opacity=".9" />
        <g stroke="var(--rail-disc)" strokeWidth="2.4">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="27" y1="2.4" x2="27" y2="6.6" transform={`rotate(${a} 27 27)`} />
          ))}
        </g>
      </svg>
      <svg className="rail-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M2.6 21.4h18.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".55" />
        <path className="stbtn-line" d="M3.4 16.6 9 11.2l3.9 3.5 7.4-8.1" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15.6 5.4h5.4v5.2" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle className="stbtn-dot" cx="9" cy="11.2" r="2" fill="var(--rail-disc)" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <style>{`
        .stbtn-rim { transition: transform .55s cubic-bezier(.22,.61,.36,1); }
        .stbtn-line { stroke-dasharray: 30; stroke-dashoffset: 0; transition: stroke-dashoffset .5s cubic-bezier(.22,.61,.36,1); }
        .stbtn-dot { transition: transform .4s cubic-bezier(.22,.61,.36,1); transform-origin: 9px 11.2px; }
        .rail-btn:hover .stbtn-rim { transform: rotate(26deg); }
        .rail-btn:hover .stbtn-line { stroke-dashoffset: 30; animation: stbtn-draw .55s cubic-bezier(.22,.61,.36,1) forwards; }
        .rail-btn:hover .stbtn-dot { transform: scale(1.3); }
        @keyframes stbtn-draw { from { stroke-dashoffset: 30 } to { stroke-dashoffset: 0 } }
        @media (prefers-reduced-motion: reduce) {
          .stbtn-rim, .stbtn-line, .stbtn-dot { transition: none; }
          .rail-btn:hover .stbtn-rim, .rail-btn:hover .stbtn-dot { transform: none; }
          .rail-btn:hover .stbtn-line { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>
    </RailLink>
  )
}

// Bitcoin, inside a rim of block ticks. This one doesn't navigate — the
// crypto dashboard is already mounted and listens for an event, so the
// ball opens it in place rather than sending you to a second copy of it.
export function CryptoRailButton() {
  const open = () => window.dispatchEvent(new CustomEvent('toggle-crypto-dash'))
  return (
    <RailAction onClick={open} index={9} tint="#E8A33D" title="Crypto — markets, sentiment, chain">
      <svg className="cybtn-rim rail-rim" viewBox="0 0 54 54" fill="none" aria-hidden="true">
        <circle cx="27" cy="27" r="24.6" stroke="currentColor" strokeWidth="3.6" opacity=".9" />
        <circle cx="27" cy="27" r="24.6" stroke="var(--rail-disc)" strokeWidth="2.4" strokeDasharray="3.2 4" />
      </svg>
      <svg className="rail-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9.4" fill="currentColor" />
        <g fill="var(--rail-disc)">
          <path d="M9.1 6.3h1.7v11.4H9.1z" />
          <path d="M11.9 6.3h1.7v11.4h-1.7z" />
          <path d="M8.4 7.5h4.6c1.9 0 3.3 1 3.3 2.6s-1.4 2.5-3.3 2.5H8.4zM8.4 11.6h5c2 0 3.5 1 3.5 2.6s-1.5 2.6-3.5 2.6h-5z" />
        </g>
        <g fill="currentColor">
          <path d="M9.6 8.9h3.2c.9 0 1.5.4 1.5 1.1s-.6 1.1-1.5 1.1H9.6zM9.6 13h3.6c1 0 1.6.4 1.6 1.2s-.6 1.2-1.6 1.2H9.6z" />
        </g>
      </svg>
      <style>{`
        .cybtn-rim { transition: transform .6s cubic-bezier(.22,.61,.36,1); }
        .rail-btn:hover .cybtn-rim { transform: rotate(-30deg); }
        @media (prefers-reduced-motion: reduce) {
          .cybtn-rim { transition: none; }
          .rail-btn:hover .cybtn-rim { transform: none; }
        }
      `}</style>
    </RailAction>
  )
}

// A rocket, inside a rim of stars at uneven spacing — evenly spaced dots
// read as a dial, and this wanted to read as sky.
export function SpaceRailButton() {
  return (
    <RailLink href="#/space" index={10} tint="#8E9BE8" title="Space — live from orbit">
      <svg className="spbtn-rim rail-rim" viewBox="0 0 54 54" fill="none" aria-hidden="true">
        <circle cx="27" cy="27" r="24.6" stroke="currentColor" strokeWidth="3.4" opacity=".88" />
        <g fill="var(--rail-disc)">
          {[8, 52, 96, 128, 176, 214, 268, 302, 334].map((a, i) => (
            <circle key={a} cx="27" cy="2.4" r={i % 3 === 0 ? 1.9 : 1.2} transform={`rotate(${a} 27 27)`} />
          ))}
        </g>
      </svg>
      <svg className="rail-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <g className="spbtn-ship">
          <path d="M12 1.6c3 2.6 4.6 6.2 4.6 10.2l-1.9 4.4H9.3l-1.9-4.4C7.4 7.8 9 4.2 12 1.6z" fill="currentColor" />
          <circle cx="12" cy="9.2" r="2.2" fill="var(--rail-disc)" />
          <path d="M9.3 12.6 6.2 16v3l3.1-2.1zM14.7 12.6l3.1 3.4v3l-3.1-2.1z" fill="currentColor" opacity=".7" />
        </g>
        <path className="spbtn-flame" d="M12 17.4c1.1 1.4 1.7 2.8 1.7 4.2 0 .5-.8.8-1.7.8s-1.7-.3-1.7-.8c0-1.4.6-2.8 1.7-4.2z" fill="currentColor" opacity=".85" />
      </svg>
      <style>{`
        .spbtn-rim { transition: transform .7s cubic-bezier(.22,.61,.36,1); }
        .spbtn-ship { transition: transform .45s cubic-bezier(.22,.61,.36,1); }
        .spbtn-flame { transform-origin: 12px 17.4px; transition: transform .35s cubic-bezier(.22,.61,.36,1); }
        .rail-btn:hover .spbtn-rim { transform: rotate(20deg); }
        .rail-btn:hover .spbtn-ship { transform: translateY(-1.4px); }
        .rail-btn:hover .spbtn-flame { transform: scaleY(1.35); }
        @media (prefers-reduced-motion: reduce) {
          .spbtn-rim, .spbtn-ship, .spbtn-flame { transition: none; }
          .rail-btn:hover .spbtn-rim, .rail-btn:hover .spbtn-ship, .rail-btn:hover .spbtn-flame { transform: none; }
        }
      `}</style>
    </RailLink>
  )
}

// A briefcase, inside a rim of dashes like a job listing's rule. The
// twelfth ball, so --rail-count moves with it.
export function JobsRailButton() {
  return (
    <RailLink href="#/jobs" index={11} tint="#63C79A" title="Jobs — openings at product companies">
      <svg className="jbbtn-rim rail-rim" viewBox="0 0 54 54" fill="none" aria-hidden="true">
        <circle cx="27" cy="27" r="24.6" stroke="currentColor" strokeWidth="3.6" opacity=".9" />
        <circle cx="27" cy="27" r="24.6" stroke="var(--rail-disc)" strokeWidth="2.4" strokeDasharray="4.4 3.6" />
      </svg>
      <svg className="rail-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path className="jbbtn-lid" d="M8.6 7.2V5.9a2 2 0 0 1 2-2h2.8a2 2 0 0 1 2 2v1.3" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
        <rect x="2.4" y="7.2" width="19.2" height="13.4" rx="2.4" fill="currentColor" />
        <path d="M2.4 12.4h19.2" stroke="var(--rail-disc)" strokeWidth="1.7" />
        <rect x="10.1" y="10.7" width="3.8" height="3.4" rx="1" fill="var(--rail-disc)" />
      </svg>
      <style>{`
        .jbbtn-rim { transition: transform .55s cubic-bezier(.22,.61,.36,1); }
        .jbbtn-lid { transform-origin: 12px 7.2px; transition: transform .4s cubic-bezier(.22,.61,.36,1); }
        .rail-btn:hover .jbbtn-rim { transform: rotate(24deg); }
        .rail-btn:hover .jbbtn-lid { transform: translateY(-1.6px); }
        @media (prefers-reduced-motion: reduce) {
          .jbbtn-rim, .jbbtn-lid { transition: none; }
          .rail-btn:hover .jbbtn-rim, .rail-btn:hover .jbbtn-lid { transform: none; }
        }
      `}</style>
    </RailLink>
  )
}
