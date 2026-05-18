import React, { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'

/* ══════════════════════════════════════════════════════════════
   Decorative solar-system background for the main page hero.
   Lightweight — no controls, no audio, no labels, no interaction.
   Camera slowly drifts around the system for an ambient effect.
   ══════════════════════════════════════════════════════════════ */

const TEX = (name) => `${import.meta.env.BASE_URL || '/'}textures/planets/${name}`

const PLANETS = [
  { orbit: 14, size: 1.2, speed: 0.10, texture: 'mercury.jpg', tilt: 0.03, eccentricity: 0.21, inclination: 0.12 },
  { orbit: 20, size: 1.5, speed: 0.075, texture: 'venus.jpg', tilt: 0.04, eccentricity: 0.007, inclination: 0.06 },
  { orbit: 28, size: 1.6, speed: 0.06, texture: 'earth.jpg', tilt: 0.41, eccentricity: 0.017, inclination: 0.0 },
  { orbit: 36, size: 1.3, speed: 0.05, texture: 'mars.jpg', tilt: 0.44, eccentricity: 0.093, inclination: 0.032 },
  { orbit: 50, size: 3.5, speed: 0.028, texture: 'jupiter.jpg', tilt: 0.05, eccentricity: 0.048, inclination: 0.022 },
  { orbit: 65, size: 3.0, speed: 0.018, texture: 'saturn.jpg', tilt: 0.47, eccentricity: 0.056, inclination: 0.043, ring: { inner: 1.5, outer: 2.6 } },
  { orbit: 80, size: 2.0, speed: 0.012, texture: 'uranus.jpg', tilt: 1.71, eccentricity: 0.046, inclination: 0.013 },
  { orbit: 95, size: 1.9, speed: 0.007, texture: 'neptune.jpg', tilt: 0.49, eccentricity: 0.009, inclination: 0.030 },
]

PLANETS.forEach((p, i) => {
  p.orbitRotation = (i * 0.7 + i * i * 0.13) % (Math.PI * 2)
  p.startAngle = Math.random() * Math.PI * 2
})

function Sun() {
  const ref = useRef()
  const tex = useLoader(THREE.TextureLoader, TEX('sun.jpg'))
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.04 })
  return (
    <group>
      <mesh ref={ref}>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <mesh><sphereGeometry args={[5, 24, 24]} /><meshBasicMaterial color="#ffaa00" transparent opacity={0.18} side={THREE.BackSide} depthWrite={false} /></mesh>
      <mesh><sphereGeometry args={[7, 24, 24]} /><meshBasicMaterial color="#ff8800" transparent opacity={0.08} side={THREE.BackSide} depthWrite={false} /></mesh>
      <pointLight intensity={2.5} color="#fff8e7" distance={250} decay={0.3} />
    </group>
  )
}

function Planet({ planet }) {
  const groupRef = useRef()
  const meshRef = useRef()
  const angleRef = useRef(planet.startAngle)
  const tex = useLoader(THREE.TextureLoader, TEX(planet.texture))
  const ringTex = planet.ring ? useLoader(THREE.TextureLoader, TEX('saturn_ring.png')) : null

  const orbit = useMemo(() => {
    const a = planet.orbit
    const b = a * Math.sqrt(1 - planet.eccentricity * planet.eccentricity)
    const cosRot = Math.cos(planet.orbitRotation)
    const sinRot = Math.sin(planet.orbitRotation)
    const cosInc = Math.cos(planet.inclination)
    const sinInc = Math.sin(planet.inclination)
    return { a, b, cosRot, sinRot, cosInc, sinInc }
  }, [planet])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    angleRef.current += planet.speed * delta
    const lx = Math.cos(angleRef.current) * orbit.a
    const lz = Math.sin(angleRef.current) * orbit.b
    const rx = lx * orbit.cosRot - lz * orbit.sinRot
    const rz = lx * orbit.sinRot + lz * orbit.cosRot
    groupRef.current.position.set(rx, rz * orbit.sinInc, rz * orbit.cosInc)
    if (meshRef.current) meshRef.current.rotation.y += 0.006
  })

  return (
    <group ref={groupRef}>
      <group rotation-z={planet.tilt}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[planet.size, 32, 32]} />
          <meshStandardMaterial map={tex} roughness={0.85} metalness={0.05} />
        </mesh>
        {planet.ring && (
          <mesh rotation-x={Math.PI / 2}>
            <ringGeometry args={[planet.size * planet.ring.inner, planet.size * planet.ring.outer, 64]} />
            <meshBasicMaterial map={ringTex} transparent opacity={0.85} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        )}
      </group>
    </group>
  )
}

function OrbitLine({ planet }) {
  const points = useMemo(() => {
    const a = planet.orbit
    const b = a * Math.sqrt(1 - planet.eccentricity * planet.eccentricity)
    const pts = []
    for (let i = 0; i <= 128; i++) {
      const ang = (i / 128) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(ang) * a, 0, Math.sin(ang) * b))
    }
    return pts
  }, [planet])

  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])

  return (
    <line geometry={geometry} rotation={[planet.inclination, planet.orbitRotation, 0]}>
      <lineBasicMaterial color="#475569" transparent opacity={0.08} />
    </line>
  )
}

function Milkyway() {
  const tex = useLoader(THREE.TextureLoader, TEX('milkyway.jpg'))
  return (
    <mesh rotation-y={Math.PI * 0.3}>
      <sphereGeometry args={[18000, 32, 32]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} depthWrite={false} />
    </mesh>
  )
}

function AsteroidBelt() {
  const ref = useRef()
  const positions = useMemo(() => {
    const arr = new Float32Array(600 * 3)
    for (let i = 0; i < 600; i++) {
      const r = 41 + Math.random() * 6
      const theta = Math.random() * Math.PI * 2
      arr[i * 3] = Math.cos(theta) * r
      arr[i * 3 + 1] = (Math.random() - 0.5) * 1
      arr[i * 3 + 2] = Math.sin(theta) * r
    }
    return arr
  }, [])

  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.01 })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.18} color="#8b7355" transparent opacity={0.5} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function CinematicCamera() {
  useFrame(({ camera, clock }) => {
    const t = clock.elapsedTime * 0.03
    // Slow orbital drift — keep system positioned on the RIGHT of the screen
    // by offsetting camera target left of origin
    camera.position.x = Math.cos(t) * 75 - 25
    camera.position.z = Math.sin(t) * 75 + 25
    camera.position.y = 30 + Math.sin(t * 0.7) * 6
    // Look at point shifted right of origin → system renders on right
    camera.lookAt(20, 0, 0)
  })
  return null
}

export default function SpaceBackground() {
  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ background: '#000003' }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 35, 75], fov: 50, near: 0.1, far: 25000 }}
        dpr={[1, 1.25]}
        gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.08} />
          <Milkyway />
          <Sun />
          <AsteroidBelt />
          {PLANETS.map((p, i) => <OrbitLine key={`o-${i}`} planet={p} />)}
          {PLANETS.map((p, i) => <Planet key={i} planet={p} />)}
          <CinematicCamera />
        </Suspense>
      </Canvas>

      {/* Light vignette — only at edges, lets the universe breathe */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)',
        }}
      />
    </div>
  )
}
