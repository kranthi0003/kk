import React from 'react'
import Character from '../Character'

// ============================================================
// Cafe — small bistro table, coffee + laptop, ambient warmth
// ============================================================

export default function Cafe() {
  return (
    <group>
      {/* Floor (warm wood) */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#5e3e22" roughness={0.85} />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 1.6, -3.5]} receiveShadow>
        <planeGeometry args={[10, 4]} />
        <meshStandardMaterial color="#3a2818" roughness={0.95} />
      </mesh>
      <mesh position={[-3.5, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[7, 4]} />
        <meshStandardMaterial color="#352010" roughness={0.95} />
      </mesh>

      {/* Bistro table — round top */}
      <group position={[0, 0, 0.5]}>
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.55, 0.55, 0.04, 32]} />
          <meshStandardMaterial color="#2a1f1a" roughness={0.6} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.38, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.75, 12]} />
          <meshStandardMaterial color="#1a1018" metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 0.04, 24]} />
          <meshStandardMaterial color="#1a1018" metalness={0.4} />
        </mesh>

        {/* Coffee cup */}
        <group position={[0.22, 0.79, 0.05]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.07, 0.06, 0.1, 24]} />
            <meshStandardMaterial color="#f5f1e8" roughness={0.6} />
          </mesh>
          {/* Coffee liquid */}
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.065, 0.065, 0.005, 24]} />
            <meshStandardMaterial color="#3a1f10" />
          </mesh>
          {/* Saucer */}
          <mesh position={[0, -0.05, 0]} receiveShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.012, 24]} />
            <meshStandardMaterial color="#f5f1e8" roughness={0.6} />
          </mesh>
        </group>

        {/* Laptop */}
        <group position={[-0.15, 0.79, -0.05]} rotation={[0, 0.3, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.36, 0.012, 0.26]} />
            <meshStandardMaterial color="#1a1a22" metalness={0.7} roughness={0.3} />
          </mesh>
          <group position={[0, 0.14, -0.12]} rotation={[-1.1, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.36, 0.25, 0.012]} />
              <meshStandardMaterial color="#1a1a22" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.008]}>
              <planeGeometry args={[0.32, 0.21]} />
              <meshStandardMaterial color="#0a0612" emissive="#a78bfa" emissiveIntensity={0.4} roughness={0.3} />
            </mesh>
          </group>
        </group>

        {/* Napkin */}
        <mesh position={[-0.2, 0.78, 0.2]} rotation={[-Math.PI / 2, 0, 0.4]}>
          <planeGeometry args={[0.18, 0.18]} />
          <meshStandardMaterial color="#e8d8b8" roughness={0.95} />
        </mesh>
      </group>

      {/* Chair (character sits here) */}
      <group position={[0, 0, 1.4]}>
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.04, 24]} />
          <meshStandardMaterial color="#2a1f1a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 12]} />
          <meshStandardMaterial color="#1a1018" metalness={0.5} />
        </mesh>
      </group>

      {/* Pendant light over table */}
      <group position={[0, 2.4, 0.5]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.6, 8]} />
          <meshStandardMaterial color="#1a1a20" />
        </mesh>
        <mesh>
          <coneGeometry args={[0.18, 0.16, 18]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
        <mesh position={[0, -0.08, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#ffd99a" emissive="#ffd99a" emissiveIntensity={1.2} />
        </mesh>
        <pointLight intensity={1.0} color="#ffd99a" distance={4.5} decay={2} />
      </group>

      {/* Background — other tables (sense of place) */}
      {[
        [-2.2, -0.5],
        [2.2, -0.5],
        [-2.4, 1.8],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.4, 0.4, 0.04, 24]} />
            <meshStandardMaterial color="#2a1f1a" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.36, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.7, 12]} />
            <meshStandardMaterial color="#1a1018" />
          </mesh>
        </group>
      ))}

      {/* Character sitting */}
      <Character pose="sit" position={[0, 0, 1.3]} rotation={[0, 0, 0]} scale={0.95} />
    </group>
  )
}
