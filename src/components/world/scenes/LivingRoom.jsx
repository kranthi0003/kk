import React from 'react'
import Character from '../Character'

// ============================================================
// Living room — sofa, rug, TV, coffee table
// ============================================================

export default function LivingRoom() {
  return (
    <group>
      {/* Floor (wood) */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#5a4030" roughness={0.85} />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 1.6, -3.0]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#3a2a45" roughness={0.95} />
      </mesh>
      <mesh position={[-3.0, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#2e2438" roughness={0.95} />
      </mesh>

      {/* Rug */}
      <mesh position={[0, 0.005, 0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.4, 2.4]} />
        <meshStandardMaterial color="#6b4a8e" roughness={0.95} />
      </mesh>

      {/* TV stand */}
      <mesh position={[0, 0.25, -2.7]} castShadow receiveShadow>
        <boxGeometry args={[2.6, 0.5, 0.5]} />
        <meshStandardMaterial color="#1a1018" roughness={0.85} />
      </mesh>

      {/* TV */}
      <group position={[0, 1.2, -2.85]}>
        <mesh castShadow>
          <boxGeometry args={[2.4, 1.3, 0.08]} />
          <meshStandardMaterial color="#0a0612" roughness={0.5} metalness={0.5} />
        </mesh>
        {/* Screen */}
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[2.2, 1.15]} />
          <meshStandardMaterial color="#0a1840" emissive="#3a5fcc" emissiveIntensity={0.7} roughness={0.3} />
        </mesh>
        {/* Light from screen */}
        <pointLight position={[0, 0, 1]} intensity={0.8} color="#5a8fff" distance={4} decay={2} />
      </group>

      {/* Sofa */}
      <group position={[0, 0, 1.4]}>
        {/* Base */}
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.6, 0.5, 0.9]} />
          <meshStandardMaterial color="#3a5060" roughness={0.85} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 0.85, 0.4]} castShadow>
          <boxGeometry args={[2.6, 0.6, 0.18]} />
          <meshStandardMaterial color="#3a5060" roughness={0.85} />
        </mesh>
        {/* Armrests */}
        <mesh position={[-1.2, 0.7, 0]} castShadow>
          <boxGeometry args={[0.2, 0.4, 0.9]} />
          <meshStandardMaterial color="#3a5060" roughness={0.85} />
        </mesh>
        <mesh position={[1.2, 0.7, 0]} castShadow>
          <boxGeometry args={[0.2, 0.4, 0.9]} />
          <meshStandardMaterial color="#3a5060" roughness={0.85} />
        </mesh>
        {/* Cushions */}
        {[-0.7, 0, 0.7].map((x, i) => (
          <mesh key={i} position={[x, 0.62, 0]}>
            <boxGeometry args={[0.6, 0.16, 0.7]} />
            <meshStandardMaterial color="#465f72" roughness={0.85} />
          </mesh>
        ))}
        {/* Throw pillow */}
        <mesh position={[-0.85, 0.7, 0.05]}>
          <boxGeometry args={[0.32, 0.32, 0.16]} />
          <meshStandardMaterial color="#a78bfa" roughness={0.85} />
        </mesh>
      </group>

      {/* Coffee table */}
      <group position={[0, 0, 0.2]}>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.06, 0.7]} />
          <meshStandardMaterial color="#1a1018" roughness={0.5} metalness={0.2} />
        </mesh>
        {[[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.15, z]} castShadow>
            <boxGeometry args={[0.04, 0.3, 0.04]} />
            <meshStandardMaterial color="#0a0612" />
          </mesh>
        ))}
        {/* Mug */}
        <mesh position={[0.2, 0.36, 0.05]}>
          <cylinderGeometry args={[0.05, 0.05, 0.08, 16]} />
          <meshStandardMaterial color="#f5f1e8" />
        </mesh>
        {/* Remote */}
        <mesh position={[-0.3, 0.34, 0]}>
          <boxGeometry args={[0.06, 0.02, 0.18]} />
          <meshStandardMaterial color="#2a2a32" />
        </mesh>
      </group>

      {/* Character chilling on sofa */}
      <Character pose="chill" position={[-0.4, 0.55, 1.3]} rotation={[0, Math.PI, 0]} />
    </group>
  )
}
