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
