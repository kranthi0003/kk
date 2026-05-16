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
    // Slowly drift the whole assembly
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.15) * 0.05
      groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.03
    }
    // Outer ring rotates slowly
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 0.05
    if (ring2Ref.current) ring2Ref.current.rotation.z = -t * 0.08
    if (tickRingRef.current) tickRingRef.current.rotation.z = t * 0.2
    // Bubble float
    if (bubbleRef.current) bubbleRef.current.position.y = Math.sin(t * 0.6) * 0.02
  })

  return (
    <group ref={groupRef}>
      {/* Outer ring — beveled metal */}
      <group ref={ring1Ref}>
        <mesh castShadow>
          <torusGeometry args={[1.55, 0.15, 32, 96]} />
          <meshPhysicalMaterial
            color="#0f0a18"
            metalness={0.95}
            roughness={0.18}
            clearcoat={1}
            clearcoatRoughness={0.05}
          />
        </mesh>
        {/* Inner bevel — slightly inset second torus for depth */}
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

      {/* Mid ring — slightly smaller, opposite rotation */}
      <group ref={ring2Ref}>
        <mesh castShadow>
          <torusGeometry args={[1.15, 0.09, 24, 80]} />
          <meshPhysicalMaterial
            color="#0a0612"
            metalness={0.95}
            roughness={0.2}
            clearcoat={1}
          />
        </mesh>
        {/* Highlight ring */}
        <mesh>
          <torusGeometry args={[1.06, 0.025, 16, 64]} />
          <meshBasicMaterial color="#a78bfa" toneMapped={false} transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Tick marks ring — 60 small radial marks */}
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

      {/* Center glass bubble */}
      <group ref={bubbleRef}>
        {/* Glass sphere */}
        <mesh>
          <sphereGeometry args={[0.78, 64, 48]} />
          <meshPhysicalMaterial
            color="#ffffff"
            roughness={0.05}
            metalness={0}
            transmission={1}
            thickness={1.5}
            ior={1.4}
            clearcoat={1}
            clearcoatRoughness={0}
            attenuationColor="#a78bfa"
            attenuationDistance={2}
          />
        </mesh>

        {/* Profile photo on a sphere inside the bubble */}
        <ProfileOrb />

        {/* Inner glow */}
        <mesh>
          <sphereGeometry args={[0.75, 32, 24]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={0.05} toneMapped={false} />
        </mesh>

        {/* Front specular highlight cap (fake glass reflection) */}
        <mesh position={[-0.25, 0.3, 0.55]}>
          <circleGeometry args={[0.12, 24]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.4} toneMapped={false} />
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

function ProfileOrb() {
  const texture = useLoader(THREE.TextureLoader, PROFILE_URL)
  React.useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 16
  }, [texture])

  return (
    <mesh>
      <sphereGeometry args={[0.55, 64, 48]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.7}
        metalness={0}
      />
    </mesh>
  )
}
