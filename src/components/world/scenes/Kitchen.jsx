import React from 'react'
import Character from '../Character'

// ============================================================
// Kitchen — counter, stove, fridge, small dining table
// ============================================================

export default function Kitchen({ activity }) {
  const isDinner = /dinner/i.test(activity || '')
  return (
    <group>
      {/* Floor (tiled) */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#d8d2c4" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 8, 8, 8]} />
        <meshBasicMaterial color="#000" wireframe transparent opacity={0.06} />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 1.6, -3.0]} receiveShadow>
        <planeGeometry args={[8, 4]} />
        <meshStandardMaterial color="#f0e8d8" roughness={0.95} />
      </mesh>
      <mesh position={[-3.0, 1.6, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#e8e0d0" roughness={0.95} />
      </mesh>

      {/* Counter base */}
      <mesh position={[-1.0, 0.45, -2.4]} castShadow receiveShadow>
        <boxGeometry args={[3.5, 0.9, 0.7]} />
        <meshStandardMaterial color="#2a2025" roughness={0.85} />
      </mesh>
      {/* Counter top */}
      <mesh position={[-1.0, 0.92, -2.4]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 0.06, 0.72]} />
        <meshStandardMaterial color="#1a1a22" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Stove */}
      <group position={[-2.0, 0.95, -2.4]}>
        <mesh castShadow>
          <boxGeometry args={[0.7, 0.04, 0.6]} />
          <meshStandardMaterial color="#0a0a10" roughness={0.5} metalness={0.6} />
        </mesh>
        {[[-0.18, 0.18], [0.18, 0.18], [-0.18, -0.18], [0.18, -0.18]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.025, z]}>
            <torusGeometry args={[0.08, 0.012, 8, 24]} />
            <meshStandardMaterial color="#3a3038" metalness={0.7} roughness={0.4} />
          </mesh>
        ))}
        {isDinner && (
          <mesh position={[-0.18, 0.04, 0.18]}>
            <cylinderGeometry args={[0.1, 0.09, 0.08, 24]} />
            <meshStandardMaterial color="#88332a" roughness={0.6} />
          </mesh>
        )}
      </group>

      {/* Fridge */}
      <group position={[0.8, 0, -2.5]}>
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[0.9, 2.0, 0.65]} />
          <meshStandardMaterial color="#e8e8ec" metalness={0.4} roughness={0.35} />
        </mesh>
        <mesh position={[0, 1.4, 0.33]}>
          <boxGeometry args={[0.6, 0.04, 0.02]} />
          <meshStandardMaterial color="#181820" />
        </mesh>
        <mesh position={[0, 0.45, 0.33]}>
          <boxGeometry args={[0.6, 0.04, 0.02]} />
          <meshStandardMaterial color="#181820" />
        </mesh>
      </group>

      {/* Microwave on counter */}
      <group position={[-0.2, 1.05, -2.4]}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.3, 0.4]} />
          <meshStandardMaterial color="#1a1a20" roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0.07, 0, 0.205]}>
          <planeGeometry args={[0.28, 0.18]} />
          <meshStandardMaterial color="#0a0612" emissive="#a78bfa" emissiveIntensity={0.15} />
        </mesh>
      </group>

      {/* Dining table */}
      <group position={[1.2, 0, 0.4]}>
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.06, 0.9]} />
          <meshStandardMaterial color="#6e4a2d" roughness={0.7} />
        </mesh>
        {[[-0.5, -0.35], [0.5, -0.35], [-0.5, 0.35], [0.5, 0.35]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.38, z]} castShadow>
            <cylinderGeometry args={[0.04, 0.04, 0.75, 8]} />
            <meshStandardMaterial color="#5a3a22" />
          </mesh>
        ))}
        {/* Plate */}
        {isDinner && (
          <>
            <mesh position={[0, 0.79, 0]}>
              <cylinderGeometry args={[0.18, 0.18, 0.02, 32]} />
              <meshStandardMaterial color="#f5f1e8" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.81, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.025, 32]} />
              <meshStandardMaterial color="#c9772a" roughness={0.7} />
            </mesh>
          </>
        )}
        {/* Chair */}
        <group position={[0, 0, 0.65]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <boxGeometry args={[0.45, 0.06, 0.45]} />
            <meshStandardMaterial color="#5a3a22" />
          </mesh>
          <mesh position={[0, 0.7, -0.2]} castShadow>
            <boxGeometry args={[0.45, 0.65, 0.04]} />
            <meshStandardMaterial color="#5a3a22" />
          </mesh>
        </group>
      </group>

      {/* Pendant light */}
      <group position={[1.2, 2.0, 0.4]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.6, 8]} />
          <meshStandardMaterial color="#1a1a20" />
        </mesh>
        <mesh>
          <coneGeometry args={[0.16, 0.22, 16]} />
          <meshStandardMaterial color="#1a1a20" />
        </mesh>
        <mesh position={[0, -0.08, 0]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#ffd99a" emissive="#ffd99a" emissiveIntensity={1.2} />
        </mesh>
        <pointLight intensity={1.0} color="#ffd99a" distance={4} decay={2} />
      </group>

      {/* Character — sitting at table for dinner, otherwise eating/cooking standing */}
      {isDinner ? (
        <Character pose="eat" position={[1.2, 0.4, 0.85]} rotation={[0, Math.PI, 0]} />
      ) : (
        <Character pose="walk" position={[-0.5, 0, -1.6]} rotation={[0, Math.PI, 0]} />
      )}
    </group>
  )
}
