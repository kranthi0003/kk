import React from 'react'

/* ------------------------------------------------------------------ *
 * The cooking button — fifth in the rail, under music.
 *
 * #/salads was only reachable from a teaser two thirds of the way down
 * the landing page, which meant it was effectively hidden once you'd
 * scrolled past it. This puts it in the rail with everything else.
 *
 * It deliberately fetches nothing. salads.json is 35KB, which has no
 * business loading on the landing page for the sake of a tooltip, and a
 * hardcoded count would drift the moment the generator picked up a new
 * recipe. So the label says what the page is and nothing that can rot.
 * ------------------------------------------------------------------ */

// A shallow bowl with a sprig over it. The bowl is an arc rather than a
// closed shape so it doesn't read as a ring inside the round button, which
// is the trap the cricket button's stumps were chosen to avoid.
function Bowl({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* the bowl: a rim, and the curve of the bowl under it */}
      <path d="M3.2 12.6h17.6" />
      <path d="M4.6 12.6a7.4 7.4 0 0 0 14.8 0" />
      {/* leaves piled above the rim — big enough to still read as leaves at
          28px, where the first attempt's small sprig looked like a shrub */}
      <g className="ckgbtn-sprig" strokeWidth="1.7">
        <path d="M12 12.2V8.6" />
        <path d="M12 11.4c-2.5 0-4.2-1.4-4.2-3.4 2.5 0 4.2 1.4 4.2 3.4z" />
        <path d="M12 10.4c2.3 0 3.9-1.3 3.9-3.1-2.3 0-3.9 1.3-3.9 3.1z" />
      </g>
    </svg>
  )
}

export default function CookingButton() {
  const title = 'Cooking — salads, with the ingredients in full'

  return (
    <a
      href="#/salads"
      aria-label={title}
      title={title}
      className="group ckgbtn fixed top-[21rem] right-6 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105"
    >
      <Bowl className="ckgbtn-icon w-7 h-7" />

      <style>{`
        .ckgbtn {
          background: var(--color-card);
          border: 1px solid var(--color-border);
          color: var(--color-accent);
          box-shadow: 0 8px 24px -6px rgba(0,0,0,.45);
          transition: transform .2s ease, box-shadow .25s ease, border-color .25s ease;
        }
        .ckgbtn:hover {
          border-color: color-mix(in oklab, var(--color-accent) 55%, transparent);
          box-shadow: 0 10px 26px -6px color-mix(in oklab, var(--color-accent) 45%, transparent);
        }
        /* The sprig leans, like something dropped in and settling. */
        .ckgbtn-sprig {
          transform-origin: 12px 12.2px;
          transition: transform .45s cubic-bezier(.22,.61,.36,1);
        }
        .ckgbtn:hover .ckgbtn-sprig { transform: rotate(-9deg); }
        @media (prefers-reduced-motion: reduce) {
          .ckgbtn-sprig { transition: none; }
          .ckgbtn:hover .ckgbtn-sprig { transform: none; }
        }
      `}</style>
    </a>
  )
}
