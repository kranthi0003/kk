// Per-person file storage for the private Vegas page, backed by IndexedDB so
// uploaded documents (PDFs, images, anything) persist on the device across
// visits. There's no backend — files never leave the browser. We keep the
// bytes as an ArrayBuffer (the most portable thing to store) plus a little
// metadata, and rebuild a Blob when it's time to view.

const DB_NAME = 'vegas-files'
const STORE = 'files'
const VERSION = 1

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('person', 'person', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function readArrayBuffer(file) {
  if (file.arrayBuffer) return file.arrayBuffer()
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsArrayBuffer(file)
  })
}

function newId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }
}

export async function addFiles(person, fileList) {
  const files = Array.from(fileList || [])
  if (!files.length) return []
  const records = []
  for (const file of files) {
    const data = await readArrayBuffer(file)
    records.push({
      id: newId(),
      person,
      name: file.name || 'file',
      type: file.type || 'application/octet-stream',
      size: file.size,
      ts: Date.now(),
      data,
    })
  }
  const db = await openDB()
  try {
    await new Promise((resolve, reject) => {
      const t = db.transaction(STORE, 'readwrite')
      t.oncomplete = () => resolve()
      t.onerror = () => reject(t.error)
      t.onabort = () => reject(t.error || new Error('aborted'))
      const store = t.objectStore(STORE)
      records.forEach(r => store.put(r))
    })
  } finally {
    db.close()
  }
  return records
}

export async function listFiles(person) {
  const db = await openDB()
  try {
    const out = await new Promise((resolve, reject) => {
      const store = db.transaction(STORE, 'readonly').objectStore(STORE)
      const req = store.index('person').getAll(person)
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    })
    out.sort((a, b) => a.ts - b.ts)
    return out
  } finally {
    db.close()
  }
}

export async function deleteFile(id) {
  const db = await openDB()
  try {
    await new Promise((resolve, reject) => {
      const t = db.transaction(STORE, 'readwrite')
      t.oncomplete = () => resolve()
      t.onerror = () => reject(t.error)
      t.objectStore(STORE).delete(id)
    })
  } finally {
    db.close()
  }
}

export function blobUrl(rec) {
  return URL.createObjectURL(new Blob([rec.data], { type: rec.type }))
}

export function formatSize(bytes) {
  if (!Number.isFinite(bytes)) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
