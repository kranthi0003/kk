// Local, persistent storage for the per-person spaces on the private Vegas page
// (Chaitra / Kiran). Each person keeps a few simple lists — wishlist, things to
// buy, notes — that they can add to, check off, and delete. Everything is saved
// in localStorage on the device, so it survives reloads and is there whenever
// they come back. Nothing leaves the browser.

const PREFIX = 'vegas:v1'

export const LISTS = [
  { id: 'wishlist', title: 'Wishlist', placeholder: 'Add something you want…' },
  { id: 'tobuy',    title: 'To buy',   placeholder: 'Add something to buy…' },
  { id: 'notes',    title: 'Notes',    placeholder: 'Add a note to remember…' },
]

// Quick-fill labels for the "Travel docs & essentials" card — the stuff you
// want to grab fast on the move (tap a chip, type the value).
export const ESSENTIAL_PRESETS = [
  'Passport no', 'Passport expiry', 'Flight PNR', 'Flight no',
  'Seat', 'Booking ref', 'Hotel', 'Emergency contact',
]

const key = (person, listId) => `${PREFIX}:${person}:${listId}`

export function loadList(person, listId) {
  try {
    const raw = localStorage.getItem(key(person, listId))
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function saveList(person, listId, items) {
  try {
    localStorage.setItem(key(person, listId), JSON.stringify(items))
  } catch {
    /* storage full or unavailable — fail quietly */
  }
}

export function newId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }
}
