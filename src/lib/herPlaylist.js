// The playlist for #/her — and, through createPlaylist, any page that wants
// its own song played the same careful way (#/itsalwaysher plays one).
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
const CONFIRM_MS = 4000 // how long a start gets to actually play before it counts as refused
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

// Any list of tracks, each with candidate video ids in order of preference.
// A single track simply loops.
export function createPlaylist(tracks, { onTrack, onFail, onMuted } = {}) {
  let player = null
  let host = null
  let fade = null
  let vol = 0        // what we believe the volume is; see setVol below
  let track = 0      // index into tracks
  let alt = 0        // index into that track's candidate ids
  let wanted = false // does the listener currently want sound
  let heard = false  // has a note actually reached the listener yet
  let muted = false  // playing, but silent, waiting for permission to be heard
  let byGesture = false // did a click start this, or did we start it ourselves
  let listen = true  // before anyone asks, should any tap on the page bring the sound up
  let ready = false  // the player's methods only exist once onReady has fired
  let wantFade = null // the fade a start() asked for before the player was ready
  let dead = false
  let building = false

  const announce = () => {
    try { onTrack && onTrack(wanted ? tracks[track] : null) } catch {}
    try { onMuted && onMuted(wanted && muted) } catch {}
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
    const t = tracks[track]
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
    track = (track + 1) % tracks.length
    cue(ms)
  }

  // Every browser refuses to start audible sound on its own — that's the whole
  // autoplay policy, and it exists for good reasons. But muted playback is
  // always allowed. So the song genuinely starts by itself, silently, and the
  // first time she taps the page we lift the mute and fade the sound up.
  //
  // Only a tap, a click or a key press gives a page that permission. Scrolling
  // never does, on any browser — and unmuting without permission doesn't simply
  // fail: the browser pauses the video. This used to listen for scroll, so the
  // first scroll paused the song for good while the button said it was playing.
  // Now nothing is tried until the page has permission, and every attempt is
  // checked against what the player is actually doing.
  const GESTURES = ['pointerup', 'touchend', 'mousedown', 'keydown', 'click']
  let armed = false
  let trying = false

  // navigator.userActivation is missing in older Safari; there, only the
  // events above ever reach tryUnmute, and all of them can carry permission.
  const permitted = () => {
    const ua = typeof navigator !== 'undefined' ? navigator.userActivation : null
    return !ua || ua.hasBeenActive
  }

  // Unmute and come up, then watch what the player really does. A refused
  // unmute doesn't fail outright: the browser pauses the video, and YouTube
  // goes on reporting it as buffering. So only actually playing counts, and
  // real buffering gets a few seconds. If it never plays, go back to playing
  // silently, say so, and wait for the next tap.
  const lift = (ms) => {
    if (!player || !ready || dead) return
    try { setVol(0); player.unMute(); player.playVideo() } catch { return }
    muted = false
    disarm()
    announce()
    fadeTo(TARGET_VOL, ms)
    trying = true
    const until = Date.now() + CONFIRM_MS
    const check = () => {
      if (!player || dead || !wanted || muted) { trying = false; return }
      let state = -1
      let silent = true
      try { state = player.getPlayerState(); silent = player.isMuted() } catch {}
      const PS = window.YT && window.YT.PlayerState
      if (PS && !silent && state === PS.PLAYING) { trying = false; heard = true; return }
      if (Date.now() < until) { setTimeout(check, 400); return }
      trying = false
      stopFade()
      setVol(0)
      try { player.mute(); player.playVideo() } catch {}
      muted = true
      announce()
      arm()
    }
    setTimeout(check, 400)
  }

  const tryUnmute = () => {
    if (!player || !ready || !wanted || !muted || dead || trying) return
    if (!permitted()) return
    lift(heard ? NEXT_FADE : FIRST_FADE)
  }

  const disarm = () => {
    if (!armed) return
    armed = false
    GESTURES.forEach((g) => { try { window.removeEventListener(g, tryUnmute, true) } catch {} })
  }

  const arm = () => {
    if (armed || dead) return
    armed = true
    GESTURES.forEach((g) => {
      try { window.addEventListener(g, tryUnmute, { capture: true, passive: true }) } catch {}
    })
  }

  // A candidate that won't play in an embed: try the next upload of the same
  // song, and only give up on the song once they're all gone.
  let consecutiveFailures = 0
  const onDeadVideo = () => {
    consecutiveFailures += 1
    // Every candidate of every track failed — YouTube is not going to work here.
    if (consecutiveFailures > tracks.reduce((n, t) => n + t.ids.length, 0)) {
      wanted = false
      announce()
      try { onFail && onFail() } catch {}
      return
    }
    alt += 1
    if (alt >= tracks[track].ids.length) skipTrack(NEXT_FADE)
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
      videoId: tracks[0].ids[0],
      playerVars: {
        // mute:1 is what makes unattended autoplay legal. If a click started
        // us we lift it immediately in onReady, so nobody notices.
        autoplay: 0, mute: 1, controls: 0, disablekb: 1, fs: 0,
        modestbranding: 1, playsinline: 1, rel: 0, iv_load_policy: 3,
      },
      events: {
        onReady: (e) => {
          ready = true
          // Hidden, so it mustn't take keyboard focus either.
          try { e.target.getIframe().setAttribute('tabindex', '-1') } catch {}
          setVol(0)
          if (!wanted) return
          try { e.target.mute(); e.target.playVideo() } catch {}
          if (byGesture) {
            // Someone already tapped for it, which is all the permission a
            // browser needs, even if the player took a while to arrive.
            lift(wantFade ?? FIRST_FADE)
          } else {
            muted = true
            announce()
            if (listen) arm()
          }
        },
        onStateChange: (e) => {
          const YT = window.YT
          if (e.data === YT.PlayerState.PLAYING) { consecutiveFailures = 0; if (!muted) heard = true }
          else if (e.data === YT.PlayerState.ENDED) { alt = 0; skipTrack(NEXT_FADE) }
        },
        onError: () => { if (wanted) onDeadVideo() },
      },
    })
    building = false
  }

  return {
    tracks: tracks,

    // Begin on our own, silently, and wait for permission to be heard. With
    // listen: false nothing on the page lifts the mute; the page will call
    // start() itself when the moment comes.
    autostart({ listen: on = true } = {}) {
      if (player || dead) return
      wanted = true
      byGesture = false
      listen = on
      build()
    },

    // Begin because someone asked for it. Call it from inside the tap that
    // asked: that tap is the permission. fromStart rewinds a song that has
    // been playing silently in the meantime; fade overrides the fade-in.
    start({ fromStart = false, fade } = {}) {
      wanted = true
      byGesture = true
      wantFade = fade ?? null
      if (!player) { build(); return true }
      if (!ready) return true // onReady sees byGesture and brings it up
      if (fromStart) { try { player.seekTo(0, true) } catch {} }
      let started = 0
      try { started = player.getCurrentTime() || 0 } catch {}
      lift(fade ?? (started > 0 && heard ? NEXT_FADE : FIRST_FADE))
      return true
    },

    // Lift the mute now, because they asked. If this is the first thing
    // they'll actually hear, give it the slow fade.
    unmute() {
      if (!player || !ready || !muted) return
      lift(heard ? NEXT_FADE : FIRST_FADE)
    },

    stop() {
      wanted = false
      muted = false
      disarm()
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
      if (!muted) fadeTo(TARGET_VOL, NEXT_FADE)
    },

    destroy() {
      dead = true
      wanted = false
      disarm()
      stopFade()
      try { player && player.destroy() } catch {}
      try { host && host.remove() } catch {}
      player = null
      host = null
    },
  }
}

export function createHerPlaylist(opts) {
  return createPlaylist(HER_TRACKS, opts)
}
