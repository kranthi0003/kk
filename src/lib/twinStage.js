// The 3D stage behind #/me. It seats a TalkingHead avatar in a lounge chair,
// keeps it seated, frames the camera, and moves the mouth in time with the
// browser's voice. TalkingHead lives in src/vendor/talkinghead (MIT).
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const V = THREE.Vector3

// Legs and spine of the seated pose. The arms are solved per avatar in
// settle(), so the hands land on the thighs whatever the body's proportions.
// The small hip twist turns TalkingHead's periodic mirrored re-pose into a
// natural shift of weight in the chair.
const SEATED = {
  'Hips.position': { x: 0, y: 0.55, z: 0 },
  'Hips.rotation': { x: -0.08, y: 0.02, z: 0 },
  'Spine.rotation': { x: 0.04, y: 0, z: 0 },
  'LeftUpLeg.rotation': { x: -1.45, y: 0, z: 3.24 },
  'RightUpLeg.rotation': { x: -1.45, y: 0, z: 3.04 },
  'LeftLeg.rotation': { x: -1.35, y: 0, z: 0 },
  'RightLeg.rotation': { x: -1.35, y: 0, z: 0 },
  'LeftFoot.rotation': { x: 1.0, y: 0, z: 0 },
  'RightFoot.rotation': { x: 1.0, y: 0, z: 0 },
}

// Emoji the twin may lead with that TalkingHead has no animation for.
const EMOJI_ALIAS = { '😮': '😳', '😌': '😊', '🤷': '🤷‍♂️', '👋': '✋' }

const frame = () => new Promise(r => requestAnimationFrame(r))

// Waits until TalkingHead has run enough of its own frames for the hips to
// stop moving: it grounds the feet and centres the toes over several frames,
// and how long that takes depends on how fast the device renders.
async function steady(head, { frames = 6, timeout = 8000 } = {}) {
  const t0 = performance.now()
  let clock = head.animClock
  let seen = 0
  let still = 0
  let last = null
  while (performance.now() - t0 < timeout) {
    await frame()
    if (head.animClock === clock) continue
    clock = head.animClock
    seen++
    const p = head.objectHips.getWorldPosition(new V())
    still = last && p.distanceTo(last) < 0.002 ? still + 1 : 0
    last = p
    if (seen >= frames && still >= 3) return
  }
}

// Call before showAvatar(): makes "chair" the starting pose and the only pose
// the moods may switch to, so the avatar never stands up.
export function seatAvatar(head) {
  const props = JSON.parse(JSON.stringify(head.poseTemplates.straight.props))
  Object.assign(props, SEATED)
  const chair = { sitting: true, props }
  head.poseTemplates.chair = chair
  for (const mood of Object.values(head.animMoods)) {
    mood.anims = mood.anims.map(a => (a.name === 'pose' ? { name: 'pose', delay: [8000, 40000], vs: { pose: ['chair'] } } : a))
  }
  head.poseName = 'chair'
  head.poseCurrentTemplate = chair
  head.poseBase = head.poseFactory(chair)
  head.poseTarget = head.poseFactory(chair)
}

function world(head, name) {
  return head.armature.getObjectByName(name).getWorldPosition(new V())
}

function measure(head) {
  const hipL = world(head, 'LeftUpLeg'), hipR = world(head, 'RightUpLeg')
  const kneeL = world(head, 'LeftLeg'), kneeR = world(head, 'RightLeg')
  const toeL = world(head, 'LeftToeBase'), toeR = world(head, 'RightToeBase')
  return {
    hipY: (hipL.y + hipR.y) / 2,
    hipZ: (hipL.z + hipR.z) / 2,
    hipHalf: Math.abs(hipL.x - hipR.x) / 2,
    kneeZ: (kneeL.z + kneeR.z) / 2,
    toeZ: (toeL.z + toeR.z) / 2,
    headTop: world(head, 'Head').y + 0.22,
  }
}

// Rests each hand on its thigh, a little past halfway to the knee, and bakes
// the solved arm rotations into the chair pose.
function restHands(head) {
  const chair = head.poseTemplates.chair
  for (const side of ['Left', 'Right']) {
    const hip = world(head, side + 'UpLeg')
    const target = hip.lerp(world(head, side + 'Leg'), 0.56)
    target.y += 0.1
    const links = [{ link: side + 'ForeArm' }, { link: side + 'Arm' }]
    head.ikSolve({ iterations: 40, root: side + 'Shoulder', effector: side + 'Hand', links }, target, false, null)
    for (const { link } of links) {
      const q = head.ikMesh.getObjectByName(link).quaternion
      delete chair.props[link + '.rotation']
      chair.props[link + '.quaternion'] = { x: q.x, y: q.y, z: q.z, w: q.w }
    }
  }
  head.setPoseFromTemplate(chair, 0)
}

function radial(stops) {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  for (const [at, color] of stops) r.addColorStop(at, color)
  g.fillStyle = r
  g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function floorDecal(w, d, z, y, stops) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: radial(stops), transparent: true, depthWrite: false, toneMapped: false }),
  )
  m.rotation.x = -Math.PI / 2
  m.position.set(0, y, z)
  return m
}

function box(parent, w, h, d, r, mat, x, y, z) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), mat)
  m.position.set(x, y, z)
  parent.add(m)
  return m
}

// A mid-century lounge chair in cognac leather and walnut, sized to the
// seated avatar: seat under the hips, front edge behind the knees.
function buildChair(m) {
  const g = new THREE.Group()
  g.name = 'twin-chair'
  const leather = new THREE.MeshStandardMaterial({ color: 0x5a2e19, roughness: 0.55, metalness: 0.02, envMapIntensity: 0.55 })
  const walnut = new THREE.MeshStandardMaterial({ color: 0x21140d, roughness: 0.72, metalness: 0.02, envMapIntensity: 0.3 })
  const brass = new THREE.MeshStandardMaterial({ color: 0x9c7a3f, roughness: 0.32, metalness: 0.85, envMapIntensity: 0.7 })

  const seatTop = m.hipY - 0.1
  const back = m.hipZ - 0.17
  const front = m.kneeZ - 0.08
  const depth = front - back
  const cz = (front + back) / 2
  const width = Math.max(0.78, m.hipHalf * 2 + 0.58)
  const cushion = 0.12
  const shellY = seatTop - cushion - 0.025

  box(g, width, 0.05, depth + 0.08, 0.02, walnut, 0, shellY, cz - 0.02)
  box(g, width - 0.14, cushion, depth, 0.05, leather, 0, seatTop - cushion / 2, cz)

  const backrest = new THREE.Group()
  backrest.position.set(0, shellY, back - 0.01)
  backrest.rotation.x = -0.24
  box(backrest, width, 0.68, 0.05, 0.02, walnut, 0, 0.34, -0.09)
  box(backrest, width - 0.14, 0.62, 0.12, 0.05, leather, 0, 0.36, -0.02)
  g.add(backrest)

  for (const s of [-1, 1]) {
    const x = s * (width / 2 - 0.04)
    box(g, 0.08, 0.2, depth - 0.02, 0.035, leather, x, seatTop + 0.03, cz - 0.02)
    box(g, 0.1, 0.03, depth + 0.06, 0.012, walnut, x, seatTop + 0.145, cz - 0.01)
  }

  const legH = shellY - 0.025
  const leg = new THREE.CylinderGeometry(0.02, 0.012, legH, 16)
  const foot = new THREE.CylinderGeometry(0.014, 0.014, 0.02, 16)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const l = new THREE.Mesh(leg, walnut)
      l.position.set(sx * (width / 2 - 0.07), legH / 2, cz + sz * (depth / 2 - 0.02))
      l.rotation.set(sz * 0.1, 0, -sx * 0.1)
      g.add(l)
      const f = new THREE.Mesh(foot, brass)
      f.position.set(l.position.x + sx * legH * 0.05, 0.01, l.position.z + sz * legH * 0.05)
      g.add(f)
    }
  }

  const mid = (m.toeZ + back) / 2
  g.add(floorDecal(3.2, 3.2, mid, 0.001, [[0, 'rgba(255,226,196,0.13)'], [0.5, 'rgba(255,226,196,0.05)'], [1, 'rgba(255,226,196,0)']]))
  g.add(floorDecal(width + 0.5, m.toeZ - back + 0.55, mid, 0.002, [[0, 'rgba(0,0,0,0.6)'], [0.55, 'rgba(0,0,0,0.28)'], [1, 'rgba(0,0,0,0)']]))
  g.userData.width = width
  return g
}

// After showAvatar(): lets the feet find the floor, rests the hands, centres
// the hips over the origin (TalkingHead centres the toes) and slides the
// chair underneath. Returns the measurements framing() needs.
export async function settle(head) {
  await steady(head)
  restHands(head)
  await steady(head, { frames: 3 })
  const hips = head.objectHips.getWorldPosition(new V())
  head.armature.position.x -= hips.x
  head.armature.position.z -= hips.z
  await steady(head, { frames: 2 })
  const m = measure(head)
  const chair = buildChair(m)
  head.scene.add(chair)
  m.chairW = chair.userData.width
  return m
}

// Points the camera at the seated avatar. Wide shows the whole chair, close
// shows lap to head. TalkingHead's "full" view looks level at its target
// from 12 m + cameraDistance through a 10° lens.
export function framing(head, m, close, aspect = head.camera.aspect || 1) {
  const t = Math.tan((head.camera.fov * Math.PI) / 360)
  const top = m.headTop + (close ? 0.13 : 0.14)
  let h = (top - (close ? m.hipY - 0.12 : -0.16)) / 2
  const fit = (close ? 0.5 : m.chairW + 0.35) / 2
  if (h * aspect < fit) h = fit / aspect
  head.setView('full', {
    cameraDistance: h / t - 12,
    cameraY: 1 - (top - h) / h,
    cameraX: 0,
    cameraRotateX: -0.03,
    cameraRotateY: close ? 0.12 : 0.24,
  })
}

// Plays the facial expression (and gesture, for 👋 🙏 👍 🤷) of an emoji.
export function express(head, emoji) {
  let em = head.animEmojis[EMOJI_ALIAS[emoji] || emoji]
  if (em?.link) em = head.animEmojis[em.link]
  if (!em) return
  head.lookAtCamera(500)
  head.animQueue.push(head.animFactory(em))
}

// Seated version of TalkingHead's talking hands (which only run standing):
// the hands lift off the thighs, gesture over the lap, and settle back.
export function talkHands(head, p = 0.5) {
  if (head.gesture || Math.random() > p) return
  const r = (a, b) => head.gaussianRandom(a, b)
  const arms = { Left: 1, Right: -1 }
  for (const [side, s] of Object.entries(arms)) {
    head.ikSolve({
      root: side + 'Shoulder', effector: side + 'HandMiddle1',
      links: [
        { link: side + 'Hand', minx: -0.5, maxx: 0.5, miny: -1, maxy: 1, minz: -0.5, maxz: 0.5 },
        { link: side + 'ForeArm', minx: -0.5, maxx: 1.5, miny: -1.5, maxy: 1.5, minz: s > 0 ? -0.5 : -3, maxz: s > 0 ? 3 : 0.5 },
        { link: side + 'Arm', minx: -1.5, maxx: 1.5, miny: -1.5, maxy: 1.5, minz: -1, maxz: 3 },
      ],
    }, new V(s * r(-0.08, 0.1), r(-0.46, -0.3), r(0.2, 0.38)), true)
  }
  const lift = {
    'LeftHand.quaternion': new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -1 - Math.random(), 0)),
    'RightHand.quaternion': new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 1 + Math.random(), 0)),
  }
  for (const b of ['LeftArm', 'LeftForeArm', 'RightArm', 'RightForeArm']) lift[b + '.quaternion'] = head.ikMesh.getObjectByName(b).quaternion.clone()
  const settleBack = {}
  for (const b of ['LeftArm', 'LeftForeArm', 'RightArm', 'RightForeArm', 'LeftHand', 'RightHand']) settleBack[b + '.quaternion'] = null
  head.animQueue.push(head.animFactory({
    name: 'talkinghands',
    dt: [100 + Math.round(Math.random() * 400), 1100 + Math.round(Math.random() * 600)],
    vs: { moveto: [{ duration: 900, props: lift }, { duration: 1800, props: settleBack }] },
  }))
}

// Lip-sync without audio: TalkingHead's own word-to-viseme timing, scheduled
// on its animation clock from "now". Called when the browser voice starts a
// sentence and again on each word boundary the voice reports, which keeps the
// mouth on the voice even when the length estimate is off.
export function mouthWords(head, words, msPerChar) {
  const now = head.animClock
  head.animQueue = head.animQueue.filter(a => !(a.twinViseme && a.ts[0] > now))
  const out = []
  let t = 0
  for (const word of words) {
    const d = (word.length + 1) * msPerChar
    const val = head.lipsyncWordsToVisemes(head.lipsyncPreProcessText(word, 'en'), 'en')
    const n = val?.visemes?.length || 0
    if (n) {
      const total = val.times[n - 1] + val.durations[n - 1]
      const over = Math.min(d, Math.max(0, d - n * 150))
      const level = 0.6 + head.convertRange(over, [0, d], [0, 0.4])
      const span = Math.min(d, n * 200)
      for (let j = 0; j < n && total > 0; j++) {
        const vt = t + (val.times[j] / total) * span
        const vd = (val.durations[j] / total) * span
        const v = val.visemes[j]
        out.push({
          template: { name: 'viseme' },
          twinViseme: true,
          ts: [vt - Math.min(60, (2 * vd) / 3), vt + Math.min(25, vd / 2), vt + vd + Math.min(60, vd / 2)],
          vs: { ['viseme_' + v]: [null, v === 'PP' || v === 'FF' ? 0.9 : level, 0] },
        })
      }
    }
    t += d
  }
  const lead = Math.abs(Math.min(0, ...out.map(a => a.ts[0])))
  for (const a of out) {
    a.ts = a.ts.map(x => now + x + lead)
    head.animQueue.push(a)
  }
  if (!head.isSpeaking) {
    head.stateName = 'speaking'
    head.isSpeaking = true
    head.lookAtCamera(500)
  }
}

export function quiet(head) {
  head.stopSpeaking()
}
