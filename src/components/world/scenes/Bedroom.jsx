import React from 'react'
import Character from '../Character'

// ============================================================
// Bedroom — bed, lamp, window with night sky. Character sleeping.
// ============================================================

export default function Bedroom({ activity }) {
  return (
    <group>
      {/* Floor */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#2a1f2e" roughness={0.9} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 1.6, -3.0]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#3a2a45" roughness={0.95} />
      </mesh>
      {/* Side wall */}
      <mesh position={[-3.0, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#352440" roughness={0.95} />
      </mesh>

      {/* Window with night sky */}
      <group position={[0, 1.8, -2.96]}>
        <mesh>
          <planeGeometry args={[1.8, 1.2]} />
          <meshStandardMaterial
            color="#0a0820"
            emissive="#3a4f8f"
            emissiveIntensity={0.4}
            roughness={0.4}
          />
        </mesh>
        {/* Window frame */}
        <mesh position={[0, 0, 0.01]}>
          <ringGeometry args={[0.85, 0.92, 4]} />
          <meshStandardMaterial color="#1a1018" />
        </mesh>
        {/* Stars */}
        {Array.from({ length: 12 }).map((_, i) => {
          const x = ((i * 73) % 100) / 100 * 1.6 - 0.8
          const y = ((i * 41) % 100) / 100 * 1.0 - 0.5
          return (
            <mesh key={i} position={[x, y, 0.005]}>
              <sphereGeometry args={[0.012, 6, 6]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          )
        })}
        {/* Moon */}
        <mesh position={[-0.5, 0.3, 0.01]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial color="#fff4d6" />
        </mesh>
      </group>

      {/* Bed — base + mattress + headboard + pillow + blanket */}
      <group position={[0.5, 0, -1.2]}>
        {/* Base */}
        <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.8, 0.36, 2.4]} />
          <meshStandardMaterial color="#3a2a48" roughness={0.85} />
        </mesh>
        {/* Mattress */}
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.2, 2.3]} />
          <meshStandardMaterial color="#e8dcc8" roughness={0.85} />
        </mesh>
        {/* Headboard */}
        <mesh position={[0, 0.85, -1.18]} castShadow>
          <boxGeometry args={[1.8, 1.0, 0.1]} />
          <meshStandardMaterial color="#241a2c" roughness={0.85} />
        </mesh>
        {/* Pillow */}
        <mesh position={[0, 0.6, -0.85]} castShadow>
          <boxGeometry args={[1.4, 0.12, 0.5]} />
          <meshStandardMaterial color="#f5eee0" roughness={0.95} />
        </mesh>
        {/* Blanket */}
        <mesh position={[0, 0.58, 0.4]} castShadow>
          <boxGeometry args={[1.7, 0.08, 1.4]} />
          <meshStandardMaterial color="#5a3f7a" roughness={0.9} />
        </mesh>
      </group>

      {/* Bedside lamp */}
      <group position={[-1.2, 0, -2.4]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.6, 0.6, 0.4]} />
          <meshStandardMaterial color="#1f1428" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.85, 0]} castShadow>
          <coneGeometry args={[0.18, 0.3, 16]} />
          <meshStandardMaterial color="#f5d99c" emissive="#f5d99c" emissiveIntensity={0.4} />
        </mesh>
        <pointLight position={[0, 0.85, 0]} intensity={0.8} color="#f5d99c" distance={3} decay={2} />
      </group>

      {/* Rug */}
      <mesh position={[0, 0.005, 0.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.4, 1.6]} />
        <meshStandardMaterial color="#a78bfa" roughness={0.95} />
      </mesh>

      {/* Character sleeping on bed (placed atop the mattress) */}
      <Character
        pose="sleep"
        position={[0.5, 0.55, -1.0]}
        rotation={[0, 0, 0]}
        scale={1.0}
      />
    </group>
  )
}
