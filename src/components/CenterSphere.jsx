import React, { useMemo, useRef, useState, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================
// CenterSphere — WebGL 3D aperture lens like steven.com
// Stacked extruded ring annuli (each ring = its own section).
// Camera tilted with perspective so you see the depth/layers.
// Profile photo mapped to center sphere.
// ============================================================

const PROFILE_URL = new URL('../../assets/profile.png', import.meta.url).href

// Each ring: outer/inner radius, extrude depth (height), color, label, route
const RINGS = [
  { id: 'work',       ro: 2.7, ri: 2.15, depth: 0.42, label: 'WORK',       href: '#/projects',   color: '#a78bfa' },
  { id: 'experience', ro: 2.1, ri: 1.62, depth: 0.36, label: 'EXPERIENCE', href: '#/experience', color: '#60a5fa' },
  { id: 'connect',    ro: 1.58, ri: 1.18, depth: 0.30, label: 'CONNECT',   href: '#/connect',    color: '#22d3ee' },
  { id: 'about',      ro: 1.14, ri: 0.82, depth: 0.24, label: 'ABOUT',     href: '#/about',      color: '#f0abfc' },
]

function navigate(href) {
  window.location.hash = href.slice(1)
  window.location.reload()
}

// ---------- Annulus (ring band) geometry via ExtrudeGeometry ----------
function useRingGeometry(ro, ri, depth) {
  return useMemo(() => {
    const shape = new THREE.Shape()
    shape.absarc(0, 0, ro, 0, Math.PI * 2, false)
    const hole = new THREE.Path()
    hole.absarc(0, 0, ri, 0, Math.PI * 2, true)
    shape.holes.push(hole)
    const geom = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 6,
      curveSegments: 96,
    })
    geom.translate(0, 0, -depth / 2) // center on Z axis
    return geom
  }, [ro, ri, depth])
}

function Ring({ ring, isHot, setHot }) {
  const geom = useRingGeometry(ring.ro, ring.ri, ring.depth)
  const mat = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0d0820'),
      metalness: 0.4,
      roughness: 0.55,
      clearcoat: 0.6,
      clearcoatRoughness: 0.35,
      emissive: new THREE.Color(ring.color),
      emissiveIntensity: 0.04,
    })
  }, [ring.color])

  // Pulse emissive on hover
  useFrame(() => {
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity,
      isHot ? 0.45 : 0.04,
      0.12
    )
  })

  // Text radius — centered on top face of ring band
  const labelR = (ring.ro + ring.ri) / 2
  const topZ = ring.depth / 2 + 0.001

  // Convert label into per-character meshes laid along an arc on top of ring
  const chars = ring.label.split('')
  const totalArc = (ring.label.length * 0.13) // angular span per char
  const startAngle = Math.PI / 2 + totalArc / 2 // top of ring, centered
  const fontSize = ring.id === 'work' ? 0.22 : ring.id === 'experience' ? 0.18 : ring.id === 'connect' ? 0.15 : 0.12

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHot(ring.id); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHot(null); document.body.style.cursor = '' }}
      onClick={() => navigate(ring.href)}
    >
      <mesh geometry={geom} material={mat} castShadow receiveShadow />
      {/* Inner rim highlight ring */}
      <mesh position={[0, 0, topZ + 0.001]}>
        <ringGeometry args={[ring.ri, ring.ri + 0.015, 96]} />
        <meshBasicMaterial color={ring.color} transparent opacity={isHot ? 0.9 : 0.35} />
      </mesh>
      {/* Per-character labels on top face */}
      {chars.map((ch, i) => {
        const a = startAngle - (i / Math.max(1, chars.length - 1)) * totalArc
        const x = Math.cos(a) * labelR
        const y = Math.sin(a) * labelR
        return (
          <Text
            key={i}
            position={[x, y, topZ + 0.01]}
            rotation={[0, 0, a - Math.PI / 2]}
            fontSize={fontSize}
            color={isHot ? '#ffffff' : '#e9e1ff'}
            anchorX="center"
            anchorY="middle"
            font="https://fonts.gstatic.com/s/bricolagegrotesque/v8/3y9U6as8bTXq_nANBjzKo3IeZx8z6up5BeSl9D4dj_x9PgNGfFa5C1zh.woff"
            outlineColor="#000"
            outlineWidth={0.01}
          >
            {ch}
          </Text>
        )
      })}
    </group>
  )
}

function CenterOrb() {
  const tex = useLoader(THREE.TextureLoader, PROFILE_URL)
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
  }, [tex])
  return (
    <group>
      {/* Sphere with photo */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.62, 64, 64]} />
        <meshStandardMaterial map={tex} roughness={0.4} metalness={0.0} />
      </mesh>
      {/* Glass overlay sphere — thin glossy shell */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.64, 64, 64]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.25}
          roughness={0.15}
          metalness={0.0}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          transmission={0.6}
          ior={1.4}
          thickness={0.3}
          color="#c4b8ff"
        />
      </mesh>
      {/* Edge accent ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.66, 0.012, 32, 96]} />
        <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

function Scene() {
  const group = useRef()
  const [hot, setHot] = useState(null)

  // Gentle idle rotation
  useFrame((state) => {
    if (group.current) {
      const t = state.clock.elapsedTime
      group.current.rotation.z = Math.sin(t * 0.15) * 0.04
    }
  })

  return (
    <>
      {/* Lights */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 6, 5]} intensity={1.4} color="#fff" castShadow />
      <directionalLight position={[-4, -2, 3]} intensity={0.45} color="#a78bfa" />
      <pointLight position={[0, 0, 3]} intensity={0.6} color="#fff" />

      <group ref={group} rotation={[-Math.PI / 2.6, 0, 0]}>
        {/* Floor rim — large faint disc behind rings */}
        <mesh position={[0, 0, -0.25]}>
          <ringGeometry args={[2.78, 2.95, 96]} />
          <meshBasicMaterial color="#1a1530" />
        </mesh>

        {/* Stacked rings */}
        {RINGS.map((r) => (
          <Ring key={r.id} ring={r} isHot={hot === r.id} setHot={setHot} />
        ))}

        {/* Center sphere with profile */}
        <CenterOrb />
      </group>
    </>
  )
}

export default function CenterSphere() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 32 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
