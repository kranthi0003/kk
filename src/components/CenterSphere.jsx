import React, { useMemo, useRef, useState, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Text, Environment } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================
// CenterSphere — WebGL 3D aperture lens
// Stacked dark ring annuli with section labels engraved on top.
// Center sphere displays profile photo (no refraction distortion).
// ============================================================

const PROFILE_URL = new URL('../../assets/profile.png', import.meta.url).href

// outer→inner; each ring is dark with a subtle hue tint (no glowing emissive)
const RINGS = [
  { id: 'work',       ro: 2.7, ri: 2.15, depth: 0.42, label: 'WORK',       href: '#/projects',   accent: '#a78bfa' },
  { id: 'experience', ro: 2.1, ri: 1.62, depth: 0.36, label: 'EXPERIENCE', href: '#/experience', accent: '#60a5fa' },
  { id: 'connect',    ro: 1.58, ri: 1.18, depth: 0.30, label: 'CONNECT',   href: '#/connect',    accent: '#22d3ee' },
  { id: 'about',      ro: 1.14, ri: 0.82, depth: 0.24, label: 'ABOUT',     href: '#/about',      accent: '#f0abfc' },
]

function navigate(href) {
  window.location.hash = href.slice(1)
  window.location.reload()
}

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
      bevelThickness: 0.04,
      bevelSize: 0.03,
      bevelSegments: 5,
      curveSegments: 96,
    })
    geom.translate(0, 0, -depth / 2)
    return geom
  }, [ro, ri, depth])
}

function Ring({ ring, isHot, setHot }) {
  const geom = useRingGeometry(ring.ro, ring.ri, ring.depth)
  const matRef = useRef()

  useFrame(() => {
    if (!matRef.current) return
    // Subtle accent tint that brightens on hover
    const target = isHot ? 0.18 : 0.0
    matRef.current.emissiveIntensity = THREE.MathUtils.lerp(matRef.current.emissiveIntensity || 0, target, 0.12)
  })

  const labelR = (ring.ro + ring.ri) / 2
  const topZ = ring.depth / 2 + 0.005
  const chars = ring.label.split('')
  const arcPerChar = 0.14
  const totalArc = (chars.length - 1) * arcPerChar
  const startAngle = Math.PI / 2 + totalArc / 2
  const fontSize = ring.id === 'work' ? 0.26 : ring.id === 'experience' ? 0.20 : ring.id === 'connect' ? 0.16 : 0.12

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); setHot(ring.id); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHot(null); document.body.style.cursor = '' }}
      onClick={(e) => { e.stopPropagation(); navigate(ring.href) }}
    >
      <mesh geometry={geom} castShadow receiveShadow>
        <meshPhysicalMaterial
          ref={matRef}
          color="#15101f"
          metalness={0.5}
          roughness={0.45}
          clearcoat={0.7}
          clearcoatRoughness={0.25}
          emissive={ring.accent}
          emissiveIntensity={0}
        />
      </mesh>

      {/* Inner rim highlight ring on top face */}
      <mesh position={[0, 0, topZ]}>
        <ringGeometry args={[ring.ri, ring.ri + 0.012, 96]} />
        <meshBasicMaterial color={ring.accent} transparent opacity={isHot ? 0.9 : 0.25} />
      </mesh>
      {/* Outer rim highlight on top face */}
      <mesh position={[0, 0, topZ]}>
        <ringGeometry args={[ring.ro - 0.012, ring.ro, 96]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.12} />
      </mesh>

      {chars.map((ch, i) => {
        const a = startAngle - i * arcPerChar
        const x = Math.cos(a) * labelR
        const y = Math.sin(a) * labelR
        return (
          <Text
            key={i}
            position={[x, y, topZ + 0.012]}
            rotation={[0, 0, a - Math.PI / 2]}
            fontSize={fontSize}
            color={isHot ? '#ffffff' : '#f5efff'}
            anchorX="center"
            anchorY="middle"
            outlineColor="#000"
            outlineWidth={0.012}
            outlineOpacity={0.8}
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
      {/* Photo sphere — plain material, no refraction distortion */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.62, 64, 64]} />
        <meshStandardMaterial map={tex} roughness={0.45} metalness={0.0} />
      </mesh>
      {/* Edge accent torus */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.64, 0.012, 32, 96]} />
        <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

function Scene() {
  const group = useRef()
  const [hot, setHot] = useState(null)

  useFrame((state) => {
    if (group.current) {
      const t = state.clock.elapsedTime
      group.current.rotation.y = Math.sin(t * 0.15) * 0.05
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 6, 5]} intensity={1.2} color="#fff" />
      <directionalLight position={[-4, -2, 3]} intensity={0.3} color="#a78bfa" />
      <pointLight position={[0, 0, 3]} intensity={0.5} color="#fff" />

      {/* Tilt the lens back ~22° so depth is visible */}
      <group ref={group} rotation={[-0.38, 0, 0]}>
        {RINGS.map((r) => (
          <Ring key={r.id} ring={r} isHot={hot === r.id} setHot={setHot} />
        ))}
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
