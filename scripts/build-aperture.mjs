// ============================================================
// build-aperture.mjs
// Generates a hand-crafted aperture lens GLB using Three.js + GLTFExporter
// Output: public/models/aperture.glb
// Run: node scripts/build-aperture.mjs
// ============================================================

import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Minimal FileReader polyfill so three's GLTFExporter can run in Node
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf
        if (typeof this.onloadend === 'function') this.onloadend({ target: this })
      }).catch((err) => {
        if (typeof this.onerror === 'function') this.onerror(err)
      })
    }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((buf) => {
        const b64 = Buffer.from(buf).toString('base64')
        this.result = `data:${blob.type || 'application/octet-stream'};base64,${b64}`
        if (typeof this.onloadend === 'function') this.onloadend({ target: this })
      }).catch((err) => {
        if (typeof this.onerror === 'function') this.onerror(err)
      })
    }
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '..', 'public', 'models', 'aperture.glb')

// Each ring: outer radius, inner radius, depth (extrusion), color, name
const RINGS = [
  { name: 'ring_work',       ro: 2.7, ri: 2.15, depth: 0.42, color: 0x1a1428, accent: 0xa78bfa },
  { name: 'ring_experience', ro: 2.10, ri: 1.62, depth: 0.36, color: 0x141a28, accent: 0x60a5fa },
  { name: 'ring_connect',    ro: 1.58, ri: 1.18, depth: 0.30, color: 0x142028, accent: 0x22d3ee },
  { name: 'ring_about',      ro: 1.14, ri: 0.82, depth: 0.24, color: 0x281828, accent: 0xf0abfc },
]

function makeRingGeometry(ro, ri, depth) {
  const shape = new THREE.Shape()
  shape.absarc(0, 0, ro, 0, Math.PI * 2, false)
  const hole = new THREE.Path()
  hole.absarc(0, 0, ri, 0, Math.PI * 2, true)
  shape.holes.push(hole)
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.035,
    bevelSegments: 3,
    curveSegments: 72,
  })
  geom.translate(0, 0, -depth / 2)
  geom.computeVertexNormals()
  return geom
}

function buildScene() {
  const scene = new THREE.Scene()
  scene.name = 'AperturLens'

  // Root group — empty so React can find it
  const root = new THREE.Group()
  root.name = 'root'

  RINGS.forEach((r) => {
    const geom = makeRingGeometry(r.ro, r.ri, r.depth)
    const mat = new THREE.MeshPhysicalMaterial({
      color: r.color,
      metalness: 0.55,
      roughness: 0.4,
      clearcoat: 0.7,
      clearcoatRoughness: 0.25,
    })
    const mesh = new THREE.Mesh(geom, mat)
    mesh.name = r.name
    mesh.userData = { accent: r.accent, ro: r.ro, ri: r.ri, depth: r.depth }
    root.add(mesh)

    // Thin accent rim torus inset just inside the inner edge — gives the
    // anodized colored bezel look like high-end camera glass.
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(r.ri + 0.025, 0.012, 12, 72),
      new THREE.MeshStandardMaterial({
        color: r.accent,
        emissive: r.accent,
        emissiveIntensity: 0.6,
        metalness: 0.7,
        roughness: 0.25,
      })
    )
    torus.name = `${r.name}_accent`
    torus.position.z = r.depth / 2 + 0.005
    root.add(torus)

    // Polished top edge highlight — thin metallic ring on outer rim
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(r.ro - 0.025, 0.008, 12, 72),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.9,
        roughness: 0.15,
      })
    )
    rim.name = `${r.name}_rim`
    rim.position.z = r.depth / 2 + 0.003
    root.add(rim)
  })

  // Center cavity — a slight recess
  const cavity = new THREE.Mesh(
    new THREE.RingGeometry(0.7, 0.82, 96),
    new THREE.MeshPhysicalMaterial({
      color: 0x06030a,
      roughness: 0.6,
      metalness: 0.3,
    })
  )
  cavity.name = 'cavity'
  cavity.position.z = 0.12
  cavity.rotation.x = 0
  root.add(cavity)

  // Center sphere socket — placeholder. The React code will swap in a
  // photo-textured sphere; we still export a sphere named "orb" so the
  // model has a clean transform reference.
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 48, 48),
    new THREE.MeshStandardMaterial({
      color: 0x12081a,
      roughness: 0.5,
      metalness: 0.2,
    })
  )
  orb.name = 'orb'
  root.add(orb)

  // Edge accent torus around orb
  const orbRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.64, 0.012, 16, 96),
    new THREE.MeshStandardMaterial({
      color: 0xa78bfa,
      emissive: 0xa78bfa,
      emissiveIntensity: 0.5,
      metalness: 0.6,
      roughness: 0.3,
    })
  )
  orbRing.name = 'orb_accent'
  orbRing.rotation.x = Math.PI / 2
  root.add(orbRing)

  scene.add(root)
  return scene
}

async function main() {
  mkdirSync(dirname(OUT), { recursive: true })
  const scene = buildScene()
  const exporter = new GLTFExporter()

  // Promisified parse
  const buffer = await new Promise((res, rej) => {
    exporter.parse(
      scene,
      (result) => res(result),
      (err) => rej(err),
      { binary: true, embedImages: true }
    )
  })

  // result is ArrayBuffer when binary:true
  writeFileSync(OUT, Buffer.from(buffer))
  const size = (Buffer.from(buffer).length / 1024).toFixed(1)
  console.log(`✓ wrote ${OUT} (${size} KB)`)
  console.log(`  rings: ${RINGS.map(r => r.name).join(', ')}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
