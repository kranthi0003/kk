// A tiny generative ambient engine for the story page, written with the Web
// Audio API. Nothing is sampled or streamed — every note is synthesised in the
// browser, so there is no file to load and no third-party audio involved.
//
// The notes come from Raga Bhupali (S R G P D, a major pentatonic), which is
// traditionally an evening raga and about as calm as a scale gets. Because it
// contains no half-steps, any two notes left ringing together stay consonant,
// so a random walk through it can never turn sour — which is what makes an
// unattended generative piece safe to leave playing under someone's reading.
//
// Underneath sits a slow drone on the tonic and fifth, the way a tanpura holds
// the ground while everything above it drifts.

// Bhupali on D, across three octaves.
const SCALE = [
  146.83, 164.81, 185.00, 220.00, 246.94, // D3 E3 F#3 A3 B3
  293.66, 329.63, 369.99, 440.00, 493.88, // D4 E4 F#4 A4 B4
  587.33, 659.25, 739.99,                 // D5 E5 F#5
]

// Tonic and fifth, low and quiet.
const DRONE = [73.42, 110.00, 146.83] // D2 A2 D3

const PEAK = 0.16     // master ceiling — deliberately just-audible
const FADE_IN = 5     // seconds; the music should arrive, not start
const FADE_OUT = 2.2

export function createRaga() {
  let ctx = null
  let master = null
  let timer = 0
  let running = false
  const parts = []

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return false
    ctx = new AC()

    master = ctx.createGain()
    master.gain.value = 0.0001

    // Nothing sharp, nothing bright.
    const tone = ctx.createBiquadFilter()
    tone.type = 'lowpass'
    tone.frequency.value = 1250
    tone.Q.value = 0.4

    // A long quiet echo, so a single note hangs in the room after it is gone.
    const delay = ctx.createDelay(1.5)
    delay.delayTime.value = 0.66
    const fb = ctx.createGain()
    fb.gain.value = 0.33
    const wet = ctx.createGain()
    wet.gain.value = 0.26

    master.connect(tone)
    tone.connect(ctx.destination)
    tone.connect(delay)
    delay.connect(fb)
    fb.connect(delay)
    delay.connect(wet)
    wet.connect(ctx.destination)

    DRONE.forEach((f, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = f
      // A few cents off exact pitch, so the drone beats slowly against itself
      // instead of sitting perfectly still.
      osc.detune.value = (i - 1) * 3

      const g = ctx.createGain()
      const level = 0.075 / (i + 1.4)
      g.gain.value = level

      // Very slow breathing, at a different rate per voice so they never
      // line up into an obvious pulse.
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.045 + i * 0.019
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = level * 0.45
      lfo.connect(lfoGain)
      lfoGain.connect(g.gain)

      osc.connect(g)
      g.connect(master)
      osc.start()
      lfo.start()
      parts.push(osc, lfo)
    })

    return true
  }

  // One note: a slow bloom in and a long tail out. No attack transient at all,
  // so it never pulls attention away from the words.
  function note() {
    if (!ctx || !running) return
    const now = ctx.currentTime
    const freq = SCALE[Math.floor(Math.random() * SCALE.length)]

    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq

    const g = ctx.createGain()
    const peak = 0.05 + Math.random() * 0.045
    g.gain.setValueAtTime(0.0001, now)
    g.gain.exponentialRampToValueAtTime(peak, now + 1.7)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 7)

    osc.connect(g)
    if (ctx.createStereoPanner) {
      const pan = ctx.createStereoPanner()
      pan.pan.value = (Math.random() * 2 - 1) * 0.55
      g.connect(pan)
      pan.connect(master)
    } else {
      g.connect(master)
    }

    osc.start(now)
    osc.stop(now + 7.5)
    osc.onended = () => { try { osc.disconnect(); g.disconnect() } catch (e) { /* already gone */ } }
  }

  function schedule() {
    clearTimeout(timer)
    if (!running) return
    note()
    timer = setTimeout(schedule, 3200 + Math.random() * 4200)
  }

  return {
    supported() {
      return !!(window.AudioContext || window.webkitAudioContext)
    },
    // Must be called from a user gesture — browsers will not start audio
    // otherwise, and an autoplaying page would be the wrong idea anyway.
    start() {
      if (!ctx && !build()) return false
      running = true
      if (ctx.state === 'suspended') ctx.resume()
      const now = ctx.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now)
      master.gain.exponentialRampToValueAtTime(PEAK, now + FADE_IN)
      schedule()
      return true
    },
    stop() {
      running = false
      clearTimeout(timer)
      if (!ctx) return
      const now = ctx.currentTime
      master.gain.cancelScheduledValues(now)
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now)
      master.gain.exponentialRampToValueAtTime(0.0001, now + FADE_OUT)
    },
    destroy() {
      running = false
      clearTimeout(timer)
      parts.forEach((n) => { try { n.stop() } catch (e) { /* never started */ } })
      parts.length = 0
      if (ctx) { try { ctx.close() } catch (e) { /* already closed */ } }
      ctx = null
      master = null
    },
  }
}
