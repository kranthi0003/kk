// The playlist for #/her.
//
// The page used to hum a generated raga. Safe, but it was nobody's song. These
// three are his, picked for her, so we play the real recordings — through
// YouTube, the same way the rest of the site already plays music, so nothing is
// hosted or licensed here.
//
// The complication: Indian labels block embedding almost everywhere. Every
// official upload of all three songs returns YouTube error 150 ("embedding
// disabled by owner"), including the music.youtube.com links these came from.
// So each track carries a list of candidate videos that were verified to
// actually play in an embed, most faithful first. If one dies — re-uploads do
// get taken down — the player quietly walks to the next one. If a whole track
// is gone it moves on, and if YouTube fails entirely the caller can fall back
// to the generated raga so the page is never just silent.
//
// The rules the page needs: start from nothing and come up slowly, sit far
// enough under the text that you can still read, move along on its own, and
// never be the reason someone's speakers startle them.

export const HER_TRACKS = [
  {
    title: 'The Metro Proposal',
    artist: 'Sai Abhyankkar',
    ids: ['WmtSLESSWvQ'],
  },
  {
    title: 'Puthu Mazha',
    artist: 'Shakthisree Gopalan',
    ids: ['N1ksAnmfuaE', 'N6nLPuLZRZA', 'gFLX3WBHozM', 'hxdZohfPCuw'],
  },
  {
    title: 'Vizhi Veekura',
    artist: 'Sai Abhyankkar',
    ids: ['tcBOgmhVEZ4', 'e4NPe5RaOe0', 'DktsNAWQp7A', 'Wb9S7saKoT8'],
  },
]

const TARGET_VOL = 32    // quiet enough to read over, present enough to mean something
const FIRST_FADE = 7000  // the first one takes its time
const NEXT_FADE = 2500   // later ones just need a soft edge
const OUT_FADE = 1600
const STEP = 100

// Loudness isn't linear in amplitude, so a straight ramp lands with a bump at
// the top. Bending the curve makes it emerge from silence instead of arriving.
const rise = (t) => Math.pow(t, 1.7)
const fall = (t) => 1 - Math.pow(1 - t, 1.7)

// Share the one script tag the rest of the site already uses, and don't touch
// window.onYouTubeIframeAPIReady — AmbientContext owns that. Just watch for the
// global to appear.
function loadAPI() {
  return new Promise((resolve, reject) => {
    if (window.YT && window.YT.Player) return resolve()
    if (!document.getElementById('yt-iframe-api')) {
      const s = document.createElement('script')
      s.id = 'yt-iframe-api'
      s.src = 'https://www.youtube.com/iframe_api'
      s.onerror = () => reject(new Error('yt api blocked'))
      document.head.appendChild(s)
    }
    let waited = 0
    const t = setInterval(() => {
      if (window.YT && window.YT.Player) { clearInterval(t); resolve() }
      else if ((waited += 200) > 12000) { clearInterval(t); reject(new Error('yt api timeout')) }
    }, 200)
  })
}

export function createHerPlaylist({ onTrack, onFail } = {}) {
  let player = null
  let host = null
  let fade = null
  let vol = 0        // what we believe the volume is; see setVol below
  let track = 0      // index into HER_TRACKS
  let alt = 0        // index into that track's candidate ids
  let wanted = false // does the listener currently want sound
  let heard = false  // has a note actually reached the listener yet
  let dead = false
  let building = false

  const announce = () => {
    try { onTrack && onTrack(wanted ? HER_TRACKS[track] : null) } catch {}
  }

  const stopFade = () => { if (fade) { clearInterval(fade); fade = null } }

  // Track the volume ourselves. getVolume() reads back across the iframe's
  // postMessage bridge and lags a setVolume() by a beat, so a fade that starts
  // from getVolume() starts from YouTube's remembered level instead of from
  // where we just put it — which made the music arrive loud and duck down
  // rather than rise out of nothing.
  const setVol = (v) => {
    vol = Math.max(0, Math.min(100, Math.round(v)))
    try { player && player.setVolume(vol) } catch {}
  }

  const fadeTo = (to, ms, done) => {
    stopFade()
    if (!player) return
    const from = vol
    const up = to >= from
    const steps = Math.max(1, Math.round(ms / STEP))
    let i = 0
    fade = setInterval(() => {
      i += 1
      const t = i / steps
      setVol(from + (to - from) * (up ? rise(t) : fall(t)))
      if (i >= steps) { stopFade(); done && done() }
    }, STEP)
  }

  // Load whatever track/alt currently point at, from silence, and come up.
  // Until something has actually been heard we're still making a first
  // impression, so keep the long fade even if we're on the second or third
  // candidate — a dead link shouldn't cost the listener the slow opening.
  const cue = (ms) => {
    if (!player || dead) return
    const t = HER_TRACKS[track]
    if (!t) return
    const id = t.ids[alt]
    if (!id) { skipTrack(ms); return }
    setVol(0)
    try { player.loadVideoById(id) } catch { return }
    announce()
    fadeTo(TARGET_VOL, heard ? ms : FIRST_FADE)
  }

  const skipTrack = (ms) => {
    alt = 0
    track = (track + 1) % HER_TRACKS.length
    cue(ms)
  }

  // A candidate that won't play in an embed: try the next upload of the same
  // song, and only give up on the song once they're all gone.
  let consecutiveFailures = 0
  const onDeadVideo = () => {
    consecutiveFailures += 1
    // Every candidate of every track failed — YouTube is not going to work here.
    if (consecutiveFailures > HER_TRACKS.reduce((n, t) => n + t.ids.length, 0)) {
      wanted = false
      announce()
      try { onFail && onFail() } catch {}
      return
    }
    alt += 1
    if (alt >= HER_TRACKS[track].ids.length) skipTrack(NEXT_FADE)
    else cue(NEXT_FADE)
  }

  const build = async () => {
    if (building || player || dead) return
    building = true
    try { await loadAPI() } catch { building = false; try { onFail && onFail() } catch {}; return }
    if (dead) { building = false; return }

    host = document.createElement('div')
    host.setAttribute('aria-hidden', 'true')
    host.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none'
    document.body.appendChild(host)

    player = new window.YT.Player(host, {
      videoId: HER_TRACKS[0].ids[0],
      playerVars: {
        autoplay: 0, controls: 0, disablekb: 1, fs: 0,
        modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3,
      },
      events: {
        onReady: (e) => {
          setVol(0)
          if (wanted) { try { e.target.playVideo() } catch {}; announce(); fadeTo(TARGET_VOL, FIRST_FADE) }
        },
        onStateChange: (e) => {
          const YT = window.YT
          if (e.data === YT.PlayerState.PLAYING) { consecutiveFailures = 0; heard = true }
          else if (e.data === YT.PlayerState.ENDED) { alt = 0; skipTrack(NEXT_FADE) }
        },
        onError: () => { if (wanted) onDeadVideo() },
      },
    })
    building = false
  }

  return {
    tracks: HER_TRACKS,

    start() {
      wanted = true
      if (!player) { build(); return true }
      let started = 0
      try { started = player.getCurrentTime() || 0 } catch {}
      try { player.playVideo() } catch {}
      announce()
      fadeTo(TARGET_VOL, started > 0 ? NEXT_FADE : FIRST_FADE)
      return true
    },

    stop() {
      wanted = false
      announce()
      fadeTo(0, OUT_FADE, () => { try { player && player.pauseVideo() } catch {} })
    },

    // Tab hidden: drop out politely without losing our place.
    pause() {
      stopFade()
      try { player && player.pauseVideo() } catch {}
    },

    resume() {
      if (!wanted || !player) return
      try { player.playVideo() } catch {}
      fadeTo(TARGET_VOL, NEXT_FADE)
    },

    destroy() {
      dead = true
      wanted = false
      stopFade()
      try { player && player.destroy() } catch {}
      try { host && host.remove() } catch {}
      player = null
      host = null
    },
  }
}
