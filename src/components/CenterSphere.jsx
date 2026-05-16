import React, { useMemo, useRef, useState, Suspense, useEffect } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { useGLTF, Text } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================
// CenterSphere — loads the hand-crafted aperture.glb model
// Built by scripts/build-aperture.mjs and shipped as a static asset.
// Center sphere photo + section labels overlaid at runtime.
// ============================================================

const MODEL_URL = `${import.meta.env.BASE_URL || '/'}models/aperture.glb`
const PROFILE_URL = new URL('../../assets/profile.png', import.meta.url).href

// Section info matched to ring names in the GLB
const SECTIONS = {
  ring_work:       { label: 'WORK',       href: '#/projects',   accent: new THREE.Color('#a78bfa'), fontSize: 0.26 },
  ring_experience: { label: 'EXPERIENCE', href: '#/experience', accent: new THREE.Color('#60a5fa'), fontSize: 0.20 },
  ring_connect:    { label: 'CONNECT',    href: '#/connect',    accent: new THREE.Color('#22d3ee'), fontSize: 0.16 },
  ring_about:      { label: 'ABOUT',      href: '#/about',      accent: new THREE.Color('#f0abfc'), fontSize: 0.12 },
}

function navigate(href) {
  window.location.hash = href.slice(1)
  window.location.reload()
}

function Aperture() {
  const { scene } = useGLTF(MODEL_URL)
  const cloned = useMemo(() => scene.clone(true), [scene])
  const [hot, setHot] = useState(null)
  const photoTex = useLoader(THREE.TextureLoader, PROFILE_URL)

  useMemo(() => {
    photoTex.colorSpace = THREE.SRGBColorSpace
    photoTex.anisotropy = 8
  }, [photoTex])

  // Attach photo texture to the orb mesh + cache ring metrics for label placement
  const rings = useMemo(() => {
    const found = []
    cloned.traverse((obj) => {
      if (obj.name === 'orb' && obj.isMesh) {
        obj.material = new THREE.MeshStandardMaterial({
          map: photoTex,
          roughness: 0.45,
          metalness: 0.0,
        })
      }
      if (SECTIONS[obj.name] && obj.isMesh) {
        const ud = obj.userData || {}
        found.push({
          name: obj.name,
          mesh: obj,
          ro: ud.ro,
          ri: ud.ri,
          depth: ud.depth,
          ...SECTIONS[obj.name],
        })
      }
    })
    return found
  }, [cloned, photoTex])

  // Hover: brighten the ring's accent emissive
  useFrame(() => {
    rings.forEach((r) => {
      const isHot = hot === r.name
      const mat = r.mesh.material
      if (!mat) return
      if (!mat.emissive) mat.emissive = new THREE.Color('#000')
      mat.emissive.lerp(isHot ? r.accent : new THREE.Color('#000'), 0.15)
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity || 0, isHot ? 0.35 : 0.05, 0.15)
    })
  })

  return (
    <group>
      <primitive object={cloned} />

      {/* Click/hover proxies + labels on each ring */}
      {rings.map((r) => {
        const labelR = (r.ro + r.ri) / 2
        const topZ = r.depth / 2 + 0.02
        const chars = r.label.split('')
        const arcPerChar = 0.14
        const totalArc = (chars.length - 1) * arcPerChar
        const startAngle = Math.PI / 2 + totalArc / 2

        return (
          <group key={r.name}>
            {/* Invisible hit proxy — flat annulus on top face */}
            <mesh
              position={[0, 0, topZ - 0.01]}
              onPointerOver={(e) => { e.stopPropagation(); setHot(r.name); document.body.style.cursor = 'pointer' }}
              onPointerOut={() => { setHot(null); document.body.style.cursor = '' }}
              onClick={(e) => { e.stopPropagation(); navigate(r.href) }}
            >
              <ringGeometry args={[r.ri, r.ro, 96]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Section label characters */}
            {chars.map((ch, i) => {
              const a = startAngle - i * arcPerChar
              const x = Math.cos(a) * labelR
              const y = Math.sin(a) * labelR
              return (
                <Text
                  key={i}
                  position={[x, y, topZ + 0.01]}
                  rotation={[0, 0, a - Math.PI / 2]}
                  fontSize={r.fontSize}
                  color={hot === r.name ? '#ffffff' : '#f5efff'}
                  anchorX="center"
                  anchorY="middle"
                  outlineColor="#000"
                  outlineWidth={0.012}
                  outlineOpacity={0.85}
                >
                  {ch}
                </Text>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}

function Scene() {
  const group = useRef()
  useFrame((state) => {
    if (group.current) {
      const t = state.clock.elapsedTime
      group.current.rotation.y = Math.sin(t * 0.15) * 0.05
    }
  })
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 6, 5]} intensity={1.3} color="#fff" />
      <directionalLight position={[-4, -2, 3]} intensity={0.35} color="#a78bfa" />
      <pointLight position={[0, 0, 3]} intensity={0.5} color="#fff" />

      <group ref={group} rotation={[-0.38, 0, 0]}>
        <Suspense fallback={null}>
          <Aperture />
        </Suspense>
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

// Preload so the GLB starts fetching before this component mounts
useGLTF.preload(MODEL_URL)
