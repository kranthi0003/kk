import React from 'react'
import Character from '../Character'

// ============================================================
// Tennis court — net, court lines, character mid-swing
// ============================================================

export default function Tennis() {
  return (
    <group>
      {/* Court surface */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 9]} />
        <meshStandardMaterial color="#1a5e8e" roughness={0.85} />
      </mesh>
      {/* Inside service box (lighter) */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#2a76a8" roughness={0.85} />
      </mesh>

      {/* Court lines */}
      {[
        // baselines
        { p: [0, 0.005, -4], s: [10, 0.06] },
        { p: [0, 0.005, 4], s: [10, 0.06] },
        // sidelines
        { p: [-5, 0.005, 0], s: [0.06, 8], rot: [0, 0, 0] },
        { p: [5, 0.005, 0], s: [0.06, 8], rot: [0, 0, 0] },
        // center service line
        { p: [0, 0.005, 0], s: [0.06, 4], rot: [0, 0, 0] },
        // service lines
        { p: [0, 0.005, -2], s: [10, 0.06] },
        { p: [0, 0.005, 2], s: [10, 0.06] },
      ].map((l, i) => (
        <mesh key={i} position={l.p} rotation={[-Math.PI / 2, 0, l.rot?.[2] || 0]}>
          <planeGeometry args={[l.s[0], l.s[1]]} />
          <meshStandardMaterial color="#f5f1e8" roughness={0.7} />
        </mesh>
      ))}

      {/* Net */}
      <group position={[0, 0, 0]}>
        {/* Posts */}
        <mesh position={[-5.2, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.1, 8]} />
          <meshStandardMaterial color="#101018" />
        </mesh>
        <mesh position={[5.2, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 1.1, 8]} />
          <meshStandardMaterial color="#101018" />
        </mesh>
        {/* Net body */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[10.4, 0.9, 0.02]} />
          <meshStandardMaterial color="#1a1a22" transparent opacity={0.65} />
        </mesh>
        {/* Top band */}
        <mesh position={[0, 0.92, 0]}>
          <boxGeometry args={[10.4, 0.06, 0.04]} />
          <meshStandardMaterial color="#f5f1e8" />
        </mesh>
      </group>

      {/* Ball mid-air */}
      <mesh position={[1.8, 1.0, -0.3]} castShadow>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color="#dbe85a" emissive="#dbe85a" emissiveIntensity={0.2} />
      </mesh>

      {/* Racket on the ground (idle) — props */}
      <group position={[2.2, 0, 1.5]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <mesh castShadow>
          <torusGeometry args={[0.22, 0.025, 8, 28]} />
          <meshStandardMaterial color="#2a2a32" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.42, 0, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />
          <meshStandardMaterial color="#1a1a22" />
        </mesh>
      </group>

      {/* Character mid swing */}
      <Character pose="swing" position={[1.6, 0, 1.5]} rotation={[0, -0.4, 0]} />

      {/* Distant audience (small cylinders so the court feels alive) */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2
        const x = Math.cos(angle) * 8
        const z = Math.sin(angle) * 5.6
        // skip the ones in front so it doesn't block view
        if (z > 2 && Math.abs(x) < 4) return null
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh position={[0, 0.6, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.22, 1.2, 8]} />
              <meshStandardMaterial color="#3a2a4a" roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.35, 0]} castShadow>
              <sphereGeometry args={[0.18, 12, 12]} />
              <meshStandardMaterial color="#c89a6e" roughness={0.85} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}
