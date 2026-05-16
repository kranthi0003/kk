import React from 'react'
import Character from '../Character'

// ============================================================
// Gym — bench, rack, dumbbells, mirror, character lifting
// ============================================================

export default function Gym() {
  return (
    <group>
      {/* Rubber floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#1a1a1f" roughness={0.95} />
      </mesh>
      {/* Yellow floor stripes */}
      {[-2, 0, 2].map((x) => (
        <mesh key={x} position={[x, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.04, 8]} />
          <meshStandardMaterial color="#dbe85a" roughness={0.7} />
        </mesh>
      ))}

      {/* Walls */}
      <mesh position={[0, 1.6, -3.0]} receiveShadow>
        <planeGeometry args={[12, 4]} />
        <meshStandardMaterial color="#2a2a35" roughness={0.95} />
      </mesh>
      <mesh position={[-4.0, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#252530" roughness={0.95} />
      </mesh>

      {/* Mirror wall */}
      <mesh position={[4.0, 1.6, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 3.4]} />
        <meshStandardMaterial color="#a8b8d0" metalness={0.95} roughness={0.05} />
      </mesh>

      {/* Squat rack */}
      <group position={[-1.8, 0, -2.0]}>
        {[-0.6, 0.6].map((x) => (
          <mesh key={x} position={[x, 1.2, 0]} castShadow>
            <boxGeometry args={[0.12, 2.4, 0.12]} />
            <meshStandardMaterial color="#8a1a1f" metalness={0.5} roughness={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 1.9, 0]} castShadow>
          <boxGeometry args={[1.4, 0.12, 0.12]} />
          <meshStandardMaterial color="#8a1a1f" metalness={0.5} roughness={0.5} />
        </mesh>
        {/* Barbell rest hooks */}
        {[-0.6, 0.6].map((x) => (
          <mesh key={`hook-${x}`} position={[x, 1.4, 0.08]} castShadow>
            <boxGeometry args={[0.04, 0.04, 0.16]} />
            <meshStandardMaterial color="#101018" metalness={0.6} />
          </mesh>
        ))}
      </group>

      {/* Bench */}
      <group position={[0.5, 0, 0]}>
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 0.12, 0.4]} />
          <meshStandardMaterial color="#101018" roughness={0.6} />
        </mesh>
        {[-0.55, 0.55].map((x) => (
          <mesh key={x} position={[x, 0.2, 0]} castShadow>
            <boxGeometry args={[0.08, 0.4, 0.4]} />
            <meshStandardMaterial color="#2a2a35" metalness={0.4} />
          </mesh>
        ))}
      </group>

      {/* Dumbbell rack */}
      <group position={[2.5, 0, -2.0]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[1.8, 0.6, 0.5]} />
          <meshStandardMaterial color="#2a2a32" roughness={0.85} />
        </mesh>
        {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
          <group key={i} position={[x, 0.7, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.03, 0.03, 0.32, 8]} />
              <meshStandardMaterial color="#1a1a22" metalness={0.6} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.18, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
              <meshStandardMaterial color="#1a1a22" metalness={0.6} />
            </mesh>
            <mesh position={[0, -0.18, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
              <meshStandardMaterial color="#1a1a22" metalness={0.6} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Barbell with plates (being lifted overhead) */}
      <group position={[-0.5, 1.7, 0]} rotation={[0, 0, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.025, 0.025, 1.5, 8]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#c8c8d2" metalness={0.85} roughness={0.2} />
        </mesh>
        <mesh position={[-0.66, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.07, 24]} />
          <meshStandardMaterial color="#8a1a1f" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[0.66, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.07, 24]} />
          <meshStandardMaterial color="#8a1a1f" metalness={0.5} roughness={0.5} />
        </mesh>
      </group>

      {/* Character lifting */}
      <Character pose="lift" position={[-0.5, 0, 0]} rotation={[0, 0, 0]} />

      {/* Wall poster (motivation) */}
      <mesh position={[-1.0, 2.2, -2.95]}>
        <planeGeometry args={[1.2, 0.8]} />
        <meshStandardMaterial color="#8a1a1f" emissive="#8a1a1f" emissiveIntensity={0.15} />
      </mesh>
    </group>
  )
}
