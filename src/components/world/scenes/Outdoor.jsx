import React from 'react'
import Character from '../Character'
import { outdoorActivity } from '../../../lib/schedule'

// ============================================================
// Outdoor — sub-mode cycles deterministically by day:
//   beach   — sand + palm + ocean horizon, character chilling
//   bike    — road + bike + character cycling
//   cricket — pitch + bat + ball + character batting
// ============================================================

export default function Outdoor() {
  const mode = outdoorActivity(new Date())

  return (
    <group>
      {mode === 'beach' && <Beach />}
      {mode === 'bike' && <Bike />}
      {mode === 'cricket' && <Cricket />}
    </group>
  )
}

function Beach() {
  return (
    <group>
      {/* Sand */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#e8d4a0" roughness={0.95} />
      </mesh>
      {/* Ocean (back half) */}
      <mesh position={[0, 0.01, -4]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 8]} />
        <meshStandardMaterial color="#1a6f9e" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Wave line */}
      <mesh position={[0, 0.02, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[16, 0.4]} />
        <meshStandardMaterial color="#a8d8e8" transparent opacity={0.7} />
      </mesh>
      {/* Sky horizon */}
      <mesh position={[0, 4, -7.5]}>
        <planeGeometry args={[20, 8]} />
        <meshBasicMaterial color="#f5b07a" />
      </mesh>
      {/* Sun */}
      <mesh position={[3, 3, -7.3]}>
        <circleGeometry args={[0.7, 32]} />
        <meshBasicMaterial color="#fff4cc" />
      </mesh>

      {/* Palm tree */}
      <group position={[3.5, 0, 1.5]}>
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.2, 2.4, 8]} />
          <meshStandardMaterial color="#5e3a1a" roughness={0.95} />
        </mesh>
        {Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2
          return (
            <mesh
              key={i}
              position={[Math.cos(a) * 0.6, 2.4, Math.sin(a) * 0.6]}
              rotation={[0.4, a, 0]}
              castShadow
            >
              <boxGeometry args={[1.4, 0.05, 0.3]} />
              <meshStandardMaterial color="#3a6a2a" roughness={0.9} />
            </mesh>
          )
        })}
      </group>

      {/* Beach towel */}
      <mesh position={[0, 0.02, 1.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.8, 1.0]} />
        <meshStandardMaterial color="#a78bfa" roughness={0.95} />
      </mesh>

      {/* Character chilling on towel */}
      <Character pose="chill" position={[0, 0, 1.5]} rotation={[0, Math.PI, 0]} />
    </group>
  )
}

function Bike() {
  return (
    <group>
      {/* Road */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#2a2a2e" roughness={0.95} />
      </mesh>
      {/* Lane markings */}
      {[-3, -1, 1, 3].map((z) => (
        <mesh key={z} position={[0, 0.005, z]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[1.2, 0.08]} />
          <meshStandardMaterial color="#f5f1e8" />
        </mesh>
      ))}
      {/* Sidewalk strips */}
      <mesh position={[0, 0.001, -5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 2]} />
        <meshStandardMaterial color="#7a6e62" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.001, 5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 2]} />
        <meshStandardMaterial color="#7a6e62" roughness={0.95} />
      </mesh>

      {/* Distant trees */}
      {Array.from({ length: 8 }).map((_, i) => {
        const x = (i - 3.5) * 2.4
        return (
          <group key={i} position={[x, 0, -5.8]}>
            <mesh position={[0, 0.5, 0]} castShadow>
              <cylinderGeometry args={[0.06, 0.08, 1, 6]} />
              <meshStandardMaterial color="#3a2818" />
            </mesh>
            <mesh position={[0, 1.2, 0]} castShadow>
              <coneGeometry args={[0.5, 1.0, 8]} />
              <meshStandardMaterial color="#2a5e2a" />
            </mesh>
          </group>
        )
      })}

      {/* Bike */}
      <group position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        {/* Frame */}
        <mesh position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
          <boxGeometry args={[0.04, 0.7, 0.04]} />
          <meshStandardMaterial color="#a78bfa" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0.25, 0.5, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
          <boxGeometry args={[0.04, 0.6, 0.04]} />
          <meshStandardMaterial color="#a78bfa" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Wheels */}
        <mesh position={[-0.5, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.3, 0.03, 8, 24]} />
          <meshStandardMaterial color="#101018" />
        </mesh>
        <mesh position={[0.5, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.3, 0.03, 8, 24]} />
          <meshStandardMaterial color="#101018" />
        </mesh>
        {/* Handlebars */}
        <mesh position={[-0.5, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
          <meshStandardMaterial color="#1a1a22" />
        </mesh>
        {/* Seat */}
        <mesh position={[0.4, 0.85, 0]} castShadow>
          <boxGeometry args={[0.18, 0.06, 0.12]} />
          <meshStandardMaterial color="#1a1018" />
        </mesh>
      </group>

      {/* Character cycling */}
      <Character pose="cycle" position={[0, 0.35, 0]} rotation={[0, Math.PI / 2, 0]} />
    </group>
  )
}

function Cricket() {
  return (
    <group>
      {/* Grass field */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#3a6e3a" roughness={0.95} />
      </mesh>
      {/* Pitch (light brown strip) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.5, 10]} />
        <meshStandardMaterial color="#b89a72" roughness={0.85} />
      </mesh>
      {/* Crease lines */}
      {[-4, 4].map((z) => (
        <mesh key={z} position={[0, 0.006, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.6, 0.05]} />
          <meshStandardMaterial color="#f5f1e8" />
        </mesh>
      ))}

      {/* Wickets (3 stumps + bails behind batsman) */}
      <group position={[0, 0, -4]}>
        {[-0.15, 0, 0.15].map((x) => (
          <mesh key={x} position={[x, 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.02, 0.7, 8]} />
            <meshStandardMaterial color="#f5f1e8" />
          </mesh>
        ))}
        <mesh position={[-0.08, 0.72, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
          <meshStandardMaterial color="#f5f1e8" />
        </mesh>
        <mesh position={[0.08, 0.72, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
          <meshStandardMaterial color="#f5f1e8" />
        </mesh>
      </group>

      {/* Bat (held by character) — visual hint only */}
      <group position={[0.05, 0.6, 0]} rotation={[Math.PI / 2.4, 0.3, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.16, 0.04, 0.6]} />
          <meshStandardMaterial color="#deb887" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0, -0.4]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.3, 8]} />
          <meshStandardMaterial color="#3a2818" roughness={0.9} />
        </mesh>
      </group>

      {/* Ball mid-air, coming in */}
      <mesh position={[0.6, 0.5, 1.8]} castShadow>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#8a1a1f" roughness={0.5} />
      </mesh>

      {/* Character batting */}
      <Character pose="cricket" position={[0, 0, -3.4]} rotation={[0, 0, 0]} />
    </group>
  )
}
