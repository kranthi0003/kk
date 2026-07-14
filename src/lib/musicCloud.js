import supabase from './supabase'

// ============================================================
// Cloud sync for user playlists — optional. Signed-out visitors keep
// using localStorage (see MusicPage); when a visitor signs in with an
// email magic link, their playlists are stored per-user in Supabase
// (row-level-security scoped) and follow them across devices.
//
// Reuses the site-wide Supabase client (src/lib/supabase.js) so there is
// a single shared auth session. Every call fails soft: if Supabase is
// unreachable or the table isn't set up yet, the page falls back to
// local-only.
// ============================================================

const TABLE = 'music_playlists'

export async function getSession() {
  try { const { data } = await supabase.auth.getSession(); return data.session || null } catch { return null }
}

export function onAuthChange(cb) {
  try {
    const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session))
    return () => { try { data.subscription.unsubscribe() } catch {} }
  } catch { return () => {} }
}

// Send a passwordless sign-in link to the given email.
export async function signInWithEmail(email) {
  const redirect = `${window.location.origin}${window.location.pathname}#/music`
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } })
  if (error) throw error
}

export async function signOut() {
  try { await supabase.auth.signOut() } catch {}
}

// Returns { data, error }. data === null means "no cloud row yet"; data is
// an array when a saved set exists. error is set only on real failures.
export async function fetchCloudPlaylists() {
  try {
    const { data: sess } = await supabase.auth.getSession()
    const uid = sess?.session?.user?.id
    if (!uid) return { data: null, error: 'not-signed-in' }
    const { data, error } = await supabase.from(TABLE).select('data').eq('user_id', uid).maybeSingle()
    if (error) return { data: null, error }
    return { data: Array.isArray(data?.data) ? data.data : null, error: null }
  } catch (e) { return { data: null, error: e } }
}

export async function saveCloudPlaylists(playlists) {
  try {
    const { data: sess } = await supabase.auth.getSession()
    const uid = sess?.session?.user?.id
    if (!uid) return { error: 'not-signed-in' }
    const { error } = await supabase.from(TABLE)
      .upsert({ user_id: uid, data: playlists, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    return { error }
  } catch (e) { return { error: e } }
}
