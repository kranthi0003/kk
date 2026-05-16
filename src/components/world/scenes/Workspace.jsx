import React from 'react'
import Character from '../Character'

// ============================================================
// Workspace scene — a compact desk setup for the world stage.
// (The full interactive Workspace lives at #/workspace.)
// ============================================================

export default function Workspace() {
  return (
    <group>
      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#241a30" roughness={0.9} />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 1.6, -3.0]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#2a1f3a" roughness={0.95} />
      </mesh>
      <mesh position={[-3.0, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#241a32" roughness={0.95} />
      </mesh>

      {/* Rug */}
      <mesh position={[0, 0.005, 0.4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.6, 2.0]} />
        <meshStandardMaterial color="#a78bfa" roughness={0.95} />
      </mesh>

      {/* Desk */}
      <group position={[0, 0, -1.4]}>
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 0.06, 1.0]} />
          <meshStandardMaterial color="#3a2820" roughness={0.65} />
        </mesh>
        {[[-1.1, -0.4], [1.1, -0.4], [-1.1, 0.4], [1.1, 0.4]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.38, z]} castShadow>
            <boxGeometry args={[0.05, 0.75, 0.05]} />
            <meshStandardMaterial color="#1a1018" />
          </mesh>
        ))}
        {/* Monitor */}
        <group position={[0, 0.78, -0.3]}>
          <mesh position={[0, 0.35, 0]} castShadow>
            <boxGeometry args={[1.2, 0.7, 0.06]} />
            <meshStandardMaterial color="#0a0612" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* Screen */}
          <mesh position={[0, 0.35, 0.04]}>
            <planeGeometry args={[1.1, 0.62]} />
            <meshStandardMaterial
              color="#0a0a14"
              emissive="#a78bfa"
              emissiveIntensity={0.5}
              roughness={0.3}
            />
          </mesh>
          {/* Stand */}
          <mesh position={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[0.08, 0.2, 0.08]} />
            <meshStandardMaterial color="#1a1018" metalness={0.4} />
          </mesh>
          <mesh position={[0, -0.04, 0]} castShadow>
            <boxGeometry args={[0.35, 0.02, 0.18]} />
            <meshStandardMaterial color="#1a1018" metalness={0.4} />
          </mesh>
          <pointLight position={[0, 0.35, 0.4]} intensity={0.7} color="#a78bfa" distance={2.5} decay={2} />
        </group>
        {/* Keyboard */}
        <mesh position={[0, 0.79, 0.18]} castShadow>
          <boxGeometry args={[0.7, 0.025, 0.22]} />
          <meshStandardMaterial color="#1a1a22" />
        </mesh>
        {/* Mouse */}
        <mesh position={[0.5, 0.79, 0.18]} castShadow>
          <boxGeometry args={[0.07, 0.03, 0.12]} />
          <meshStandardMaterial color="#1a1a22" />
        </mesh>
        {/* Coffee mug */}
        <mesh position={[-0.7, 0.83, 0.15]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 0.1, 18]} />
          <meshStandardMaterial color="#a78bfa" />
        </mesh>
        {/* Plant */}
        <group position={[0.85, 0.78, -0.25]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.07, 0.06, 0.12, 12]} />
            <meshStandardMaterial color="#5e3a22" />
          </mesh>
          <mesh position={[0, 0.15, 0]} castShadow>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial color="#3a7a3a" roughness={0.9} />
          </mesh>
        </group>
        {/* Desk lamp */}
        <group position={[-0.95, 0.78, -0.25]}>
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.02, 18]} />
            <meshStandardMaterial color="#1a1018" metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.25, 0]} rotation={[0, 0, 0.3]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.4, 8]} />
            <meshStandardMaterial color="#1a1018" />
          </mesh>
          <mesh position={[0.1, 0.45, 0]} rotation={[0, 0, 0.7]} castShadow>
            <coneGeometry args={[0.07, 0.12, 14]} />
            <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.2} />
          </mesh>
          <pointLight position={[0.18, 0.4, 0.05]} intensity={0.9} color="#ffd99a" distance={2.4} decay={2} />
        </group>
      </group>

      {/* Chair */}
      <group position={[0, 0, -0.4]}>
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.55, 0.08, 0.55]} />
          <meshStandardMaterial color="#1a1018" />
        </mesh>
        <mesh position={[0, 0.85, -0.25]} castShadow>
          <boxGeometry args={[0.55, 0.7, 0.08]} />
          <meshStandardMaterial color="#1a1018" />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
          <meshStandardMaterial color="#0a0612" metalness={0.6} />
        </mesh>
      </group>

      {/* Character sitting and coding */}
      <Character pose="code" position={[0, 0.5, -0.4]} rotation={[0, 0, 0]} />
    </group>
  )
}
