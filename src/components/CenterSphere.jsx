import React, { useRef, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Environment, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

// ============================================================
// CenterSphere — steven.com-level glossy 3D lens/orb
// Beveled rings + glass center + profile texture inside
// ============================================================

const PROFILE_URL = new URL('../../assets/profile.png', import.meta.url).href

export default function CenterSphere() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4.2], fov: 35 }}
      gl={{
        antialias: true,
        alpha: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.25,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      dpr={[1, 2]}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <Scene />
        <Environment preset="studio" environmentIntensity={0.4} />
      </Suspense>
    </Canvas>
  )
}

function Scene() {
  return (
    <group>
      {/* Key + accent lights */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} color="#fff" />
      <pointLight position={[-3, 2, 2]} intensity={1.2} color="#a78bfa" distance={10} decay={2} />
      <pointLight position={[2, -2, 3]} intensity={0.9} color="#ec4899" distance={10} decay={2} />
      <pointLight position={[0, 0, -3]} intensity={0.6} color="#22d3ee" distance={6} decay={2} />

      <LensAssembly />
    </group>
  )
}

// The full lens — outer ring, mid ring, inner globe
function LensAssembly() {
  const groupRef = useRef()
  const ring1Ref = useRef()
  const ring2Ref = useRef()
  const tickRingRef = useRef()
  const bubbleRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.03
      groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.02
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 0.03
    if (ring2Ref.current) ring2Ref.current.rotation.z = -t * 0.05
    if (tickRingRef.current) tickRingRef.current.rotation.z = t * 0.12
  })

  return (
    <group ref={groupRef}>
      {/* Outer ring — beveled metal */}
      <group ref={ring1Ref}>
        <mesh>
          <torusGeometry args={[1.55, 0.15, 32, 96]} />
          <meshPhysicalMaterial
            color="#0f0a18"
            metalness={0.95}
            roughness={0.18}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>
        <mesh>
          <torusGeometry args={[1.42, 0.06, 24, 96]} />
          <meshPhysicalMaterial
            color="#1a1330"
            metalness={0.8}
            roughness={0.3}
            emissive="#3a1f5a"
            emissiveIntensity={0.15}
          />
        </mesh>
      </group>

      {/* Mid ring */}
      <group ref={ring2Ref}>
        <mesh>
          <torusGeometry args={[1.15, 0.09, 24, 80]} />
          <meshPhysicalMaterial
            color="#0a0612"
            metalness={0.95}
            roughness={0.2}
            clearcoat={1}
          />
        </mesh>
        <mesh>
          <torusGeometry args={[1.06, 0.025, 16, 64]} />
          <meshBasicMaterial color="#a78bfa" toneMapped={false} transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Tick marks ring */}
      <group ref={tickRingRef}>
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i / 60) * Math.PI * 2
          const len = i % 5 === 0 ? 0.08 : 0.04
          const r = 0.93
          return (
            <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r, 0]} rotation={[0, 0, a]}>
              <boxGeometry args={[len, 0.008, 0.005]} />
              <meshStandardMaterial
                color={i % 5 === 0 ? '#a78bfa' : '#ffffff'}
                emissive={i % 5 === 0 ? '#a78bfa' : '#ffffff'}
                emissiveIntensity={0.6}
                toneMapped={false}
              />
            </mesh>
          )
        })}
      </group>

      {/* Center: Profile photo on a flat disc (no glass distortion) */}
      <group ref={bubbleRef} position={[0, 0, 0.1]}>
        {/* Dark backing disc */}
        <mesh position={[0, 0, -0.05]}>
          <circleGeometry args={[0.82, 64]} />
          <meshStandardMaterial color="#0a0612" />
        </mesh>
        {/* Profile image */}
        <ProfileDisc />
        {/* Subtle convex highlight overlay (top-left) */}
        <mesh position={[-0.2, 0.25, 0.05]}>
          <circleGeometry args={[0.18, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.12} toneMapped={false} />
        </mesh>
        {/* Edge highlight ring */}
        <mesh position={[0, 0, 0.001]}>
          <ringGeometry args={[0.78, 0.81, 64]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={0.4} toneMapped={false} />
        </mesh>
      </group>

      {/* Soft purple bloom orb behind */}
      <mesh position={[0, 0, -0.5]}>
        <sphereGeometry args={[1.2, 32, 24]} />
        <meshBasicMaterial color="#7c3aed" transparent opacity={0.08} toneMapped={false} />
      </mesh>
    </group>
  )
}

function ProfileDisc() {
  const texture = useLoader(THREE.TextureLoader, PROFILE_URL)
  React.useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 16
  }, [texture])

  return (
    <mesh>
      <circleGeometry args={[0.78, 64]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}
