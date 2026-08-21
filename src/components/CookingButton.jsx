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
 *
 * The green is the same #4ade80 the salads page uses for its own accent,
 * so the button is a preview of where it goes rather than a generic food
 * icon. Filled, not stroked: a hairline bowl read as switched off next to
 * the F1 button.
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
      {/* the bowl, filled — the rim as a solid bar and the body beneath it */}
      <path d="M2.9 12.1h18.2a1.35 1.35 0 0 1 0 2.7H2.9a1.35 1.35 0 0 1 0-2.7z" fill="currentColor" stroke="none" />
      <path d="M4.5 15.4h15a7.5 7.5 0 0 1-15 0z" fill="currentColor" stroke="none" />
      {/* leaves piled above the rim — big enough to still read as leaves at
          28px, where the first attempt's small sprig looked like a shrub */}
      <g className="ckgbtn-sprig" fill="currentColor" stroke="none">
        <rect x="11.3" y="6.6" width="1.5" height="5.6" rx=".75" />
        <path d="M12 11.6c-3.2 0-5.4-1.8-5.4-4.4 3.2 0 5.4 1.8 5.4 4.4z" />
        <path d="M12 10.2c3 0 5-1.7 5-4.1-3 0-5 1.7-5 4.1z" />
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
      className="group ckgbtn rail-btn shadow-lg"
      style={{ '--rail-i': 4 }}
    >
      {/* Steam over the bowl, as three short strokes around the rim. */}
      <svg className="ckgbtn-rim rail-rim" viewBox="0 0 54 54" fill="none" aria-hidden="true">
        <circle cx="27" cy="27" r="24.6" stroke="#0F2A19" strokeWidth="2.6" opacity=".55" />
        <circle cx="27" cy="27" r="24.6" stroke="#BBF7D0" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="7 24" />
      </svg>

      <Bowl className="ckgbtn-icon rail-ico" />

      <style>{`
        .ckgbtn {
          background: radial-gradient(circle at 32% 26%, #5FE996 0%, #34C46B 48%, #17864A 100%);
          color: #06301B;
          box-shadow: 0 8px 24px -6px rgba(23,134,74,.55);
        }
        .ckgbtn:hover { box-shadow: 0 10px 26px -6px rgba(74,222,128,.55); }
        .ckgbtn-rim { transition: transform .55s cubic-bezier(.22,.61,.36,1); }
        .ckgbtn:hover .ckgbtn-rim { transform: rotate(30deg); }
        /* The sprig leans, like something dropped in and settling. */
        .ckgbtn-sprig {
          transform-origin: 12px 12.2px;
          transition: transform .45s cubic-bezier(.22,.61,.36,1);
        }
        .ckgbtn:hover .ckgbtn-sprig { transform: rotate(-9deg); }
        @media (prefers-reduced-motion: reduce) {
          .ckgbtn-sprig, .ckgbtn-rim { transition: none; }
          .ckgbtn:hover .ckgbtn-sprig, .ckgbtn:hover .ckgbtn-rim { transform: none; }
        }
      `}</style>
    </a>
  )
}
