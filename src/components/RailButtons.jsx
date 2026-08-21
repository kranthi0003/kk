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

// A clapperboard. The hinged top is a separate group so it can open.
export function MoviesRailButton() {
  return (
    <RailLink href="#/movies" index={5} tint="#D9A05B" title="Films — what's coming out">
      <svg className="rail-ico mvbtn-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="2.6" y="9.4" width="18.8" height="11.6" rx="2" fill="currentColor" />
        <g className="mvbtn-clap" fill="currentColor">
          <path d="M2.6 5.6 20.2 2.4l.9 3.6L3.5 9.2z" />
        </g>
        <g fill="var(--color-card)">
          <path d="M7.1 4.6 8.6 8.2l-1.9.3L5.2 5z" />
          <path d="M12.2 3.7l1.5 3.6-1.9.3-1.5-3.6z" />
          <path d="M17.3 2.8l1.5 3.6-1.9.3-1.5-3.6z" />
        </g>
      </svg>
      <style>{`
        .mvbtn-clap { transform-origin: 3px 7px; transition: transform .4s cubic-bezier(.22,.61,.36,1); }
        .rail-btn:hover .mvbtn-clap { transform: rotate(-15deg); }
        @media (prefers-reduced-motion: reduce) {
          .mvbtn-clap { transition: none; }
          .rail-btn:hover .mvbtn-clap { transform: none; }
        }
      `}</style>
    </RailLink>
  )
}

// A camera body with a lens. The lens ring is inset far enough that it
// doesn't read as a ring around the button itself.
export function PhotographyRailButton() {
  return (
    <RailLink href="#/photos" index={6} tint="#8FB8D8" title="Pictures" wip>
      <svg className="rail-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M3.4 7.4h3.4l1.5-2.2h7.4l1.5 2.2h3.4a1.8 1.8 0 0 1 1.8 1.8v8.6a1.8 1.8 0 0 1-1.8 1.8H3.4a1.8 1.8 0 0 1-1.8-1.8V9.2a1.8 1.8 0 0 1 1.8-1.8z" fill="currentColor" />
        <circle className="phbtn-lens" cx="12" cy="13.4" r="4" fill="var(--color-card)" />
        <circle cx="12" cy="13.4" r="2.1" fill="currentColor" />
      </svg>
      <style>{`
        .phbtn-lens { transition: r .35s cubic-bezier(.22,.61,.36,1); }
        .rail-btn:hover .phbtn-lens { r: 4.5; }
        @media (prefers-reduced-motion: reduce) { .phbtn-lens { transition: none; } }
      `}</style>
    </RailLink>
  )
}

// A hanging tag — the thing every one of these shelves has attached to
// it, and readable at 28px in a way that a coat hanger is not.
export function BrandsRailButton() {
  return (
    <RailLink href="#/brands" index={7} tint="#C99BA6" title="Brands — fashion, skin, lifestyle" wip>
      <svg className="rail-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M11.6 2.2h8.3a2 2 0 0 1 2 2v8.3a2 2 0 0 1-.6 1.4l-7.6 7.6a2 2 0 0 1-2.8 0l-7.7-7.7a2 2 0 0 1 0-2.8l7.6-7.6a2 2 0 0 1 1.4-.6z" fill="currentColor" />
        <circle cx="17.1" cy="7" r="1.9" fill="var(--color-card)" />
      </svg>
    </RailLink>
  )
}

// A mortarboard.
export function OmscsRailButton() {
  return (
    <RailLink href="#/omscs" index={8} tint="#C9A227" title="OMSCS — Georgia Tech" wip>
      <svg className="rail-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3.1 22.6 8 12 12.9 1.4 8z" fill="currentColor" />
        <path d="M5.8 11.1v4.4c0 1.9 2.8 3.3 6.2 3.3s6.2-1.4 6.2-3.3v-4.4L12 14z" fill="currentColor" opacity=".72" />
        <path className="omsbtn-tassel" d="M20.7 8.9v4.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <style>{`
        .omsbtn-tassel { transform-origin: 20.7px 8.9px; transition: transform .45s cubic-bezier(.22,.61,.36,1); }
        .rail-btn:hover .omsbtn-tassel { transform: rotate(14deg); }
        @media (prefers-reduced-motion: reduce) {
          .omsbtn-tassel { transition: none; }
          .rail-btn:hover .omsbtn-tassel { transform: none; }
        }
      `}</style>
    </RailLink>
  )
}
