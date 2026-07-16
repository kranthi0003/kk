// Matrix Mode — a reversible site-wide theme. The palette override lives in
// index.css (`html.matrix`); this module just owns the on/off state and keeps
// the <html> class, localStorage, and any listeners (toggle buttons, the rain
// canvas) in sync via a small custom event.
export const MATRIX_KEY = 'matrix'

export function isMatrixOn() {
  try { return localStorage.getItem(MATRIX_KEY) === '1' } catch { return false }
}

// Add/remove the class that flips every CSS variable to green-on-black.
export function applyMatrixClass(on) {
  try { document.documentElement.classList.toggle('matrix', !!on) } catch {}
}

export function setMatrix(on) {
  const val = !!on
  try { localStorage.setItem(MATRIX_KEY, val ? '1' : '0') } catch {}
  applyMatrixClass(val)
  try { window.dispatchEvent(new CustomEvent('matrixchange', { detail: { on: val } })) } catch {}
  return val
}

// Subscribe to changes (returns an unsubscribe fn). Fires with a boolean.
export function onMatrixChange(cb) {
  const handler = (e) => cb(!!(e && e.detail && e.detail.on))
  window.addEventListener('matrixchange', handler)
  return () => window.removeEventListener('matrixchange', handler)
}
