// Site colour.
//
// Every colour token in index.css is written as oklch(L C H) where H is
// --site-hue and C is scaled by --site-chroma. Because lightness is baked
// into each token and never varies with the hue, changing the hue repaints
// the whole site without ever breaking contrast — body text stays exactly as
// readable on a hot pink theme as it is on the default blue.
//
// Matrix mode deliberately ignores this: html.matrix sets literal green
// values that beat these variables on specificity.

export const DEFAULT_HUE = 250
export const DEFAULT_CHROMA = 1

const HUE_KEY = 'siteHue'
const CHROMA_KEY = 'siteChroma'
const DISCO_KEY = 'siteDisco'

// A few starting points, so the picker isn't a cold start. Names are the hue
// as it actually renders on the site, not the raw colour-wheel name.
export const PRESETS = [
  { name: 'GitHub blue', hue: 250, chroma: 1 },
  { name: 'Teal', hue: 195, chroma: 1 },
  { name: 'Forest', hue: 150, chroma: 1 },
  { name: 'Amber', hue: 75, chroma: 1.05 },
  { name: 'Ember', hue: 40, chroma: 1.05 },
  { name: 'Crimson', hue: 15, chroma: 1 },
  { name: 'Magenta', hue: 340, chroma: 1 },
  { name: 'Violet', hue: 295, chroma: 1 },
]

const clampHue = (h) => ((Math.round(Number(h)) % 360) + 360) % 360
const clampChroma = (c) => Math.min(2, Math.max(0, Number(c)))

export function readTheme() {
  if (typeof window === 'undefined') return { hue: DEFAULT_HUE, chroma: DEFAULT_CHROMA }
  try {
    const h = localStorage.getItem(HUE_KEY)
    const c = localStorage.getItem(CHROMA_KEY)
    return {
      hue: h === null || h === '' ? DEFAULT_HUE : clampHue(h),
      chroma: c === null || c === '' ? DEFAULT_CHROMA : clampChroma(c),
    }
  } catch {
    return { hue: DEFAULT_HUE, chroma: DEFAULT_CHROMA }
  }
}

// Paint only — no persistence. Used while dragging around the wheel so the
// site previews live without writing to storage on every pointer move.
export function paintTheme(hue, chroma) {
  if (typeof document === 'undefined') return
  const el = document.documentElement
  el.style.setProperty('--site-hue', String(clampHue(hue)))
  el.style.setProperty('--site-chroma', String(clampChroma(chroma)))
}

export function saveTheme(hue, chroma) {
  paintTheme(hue, chroma)
  try {
    localStorage.setItem(HUE_KEY, String(clampHue(hue)))
    localStorage.setItem(CHROMA_KEY, String(clampChroma(chroma)))
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent('site-theme-change', { detail: { hue: clampHue(hue), chroma: clampChroma(chroma) } }))
  } catch {}
}

export function resetTheme() {
  saveTheme(DEFAULT_HUE, DEFAULT_CHROMA)
}

// Disco mode. The actual animation lives in CSS (html.disco) — all this does
// is flip the class, because a CSS animation of --site-hue is both smoother
// and cheaper than driving it from JS, and it outranks the inline hue in the
// cascade so the user's own colour is handed straight back when it stops.
export function isDiscoOn() {
  if (typeof window === 'undefined') return false
  try { return localStorage.getItem(DISCO_KEY) === '1' } catch { return false }
}

export function setDisco(on) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('disco', !!on)
  try { localStorage.setItem(DISCO_KEY, on ? '1' : '0') } catch {}
  try { window.dispatchEvent(new CustomEvent('site-disco-change', { detail: { on: !!on } })) } catch {}
}

// A swatch of a given hue for the picker UI, matched to the current mode so
// the dot previews what the site will actually look like.
export function swatch(hue, chroma = 1, dark = true) {
  return dark
    ? `oklch(70% ${0.15 * chroma} ${clampHue(hue)})`
    : `oklch(54% ${0.18 * chroma} ${clampHue(hue)})`
}
