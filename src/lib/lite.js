/* ------------------------------------------------------------------ *
 * Lite mode.
 *
 * The desktop site mounts around fifty components, and measured on a
 * phone it pulled 5.3 MB over 50 requests — 4.4 MB of which was the 3D
 * workspace scene alone (a 1.3 MB model plus 2.8 MB of environment maps
 * from a third-party CDN), fetched eagerly whether or not anyone ever
 * scrolled to it. It also left 1,823 DOM nodes, 2,296 event listeners
 * and a 17,000px page to scroll.
 *
 * On a phone that is a lot to ask for what is, at heart, a CV. So a
 * narrow screen gets a smaller site: the sections that say who he is and
 * how to reach him, and nothing else.
 *
 * Two things worth knowing about how this is decided.
 *
 * It is decided once, when the module first loads, rather than reactively
 * on resize. Half these components own timers, sockets and canvases;
 * mounting and unmounting the lot mid-session because a phone rotated is
 * a good way to leak them. A reload picks up the new answer.
 *
 * And it is only ever a default. Anyone can ask for the full site and
 * that choice is remembered, so nothing here is a wall — the desktop
 * experience is one tap away, on any device.
 * ------------------------------------------------------------------ */

// Tailwind's md breakpoint. Below it the layout is already single-column.
const NARROW = '(max-width: 767px)'

export const FULL_KEY = 'site_full'

function decide() {
  if (typeof window === 'undefined') return false
  try {
    if (localStorage.getItem(FULL_KEY) === '1') return false
  } catch {
    // Private mode can throw on access. Fall through to the screen test.
  }
  if (!window.matchMedia) return false
  return window.matchMedia(NARROW).matches
}

export const IS_LITE = decide()

// Whether the visitor is on a narrow screen at all, regardless of which
// version they chose. Lets the "full site" switch show only where it
// means something.
export const IS_NARROW =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia(NARROW).matches
    : false

export function useFullSite() {
  try { localStorage.setItem(FULL_KEY, '1') } catch {}
  window.location.reload()
}

export function useLiteSite() {
  try { localStorage.removeItem(FULL_KEY) } catch {}
  window.location.reload()
}

// Lets CSS answer the same question without every component having to
// pass a prop down to its children.
if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('lite', IS_LITE)
}
