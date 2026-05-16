import React, { useMemo } from 'react'

// ============================================================
// Character — stylized procedural boy with pose presets.
// Used across all WorldStage scenes.
// ============================================================

const SKIN = '#e8b894'
const HAIR = '#1a1410'
const SHIRT = '#1f1a2e'
const JEANS = '#2c3950'
const SHOE = '#101018'
const ACCENT = '#a78bfa'

const POSES = {
  walk: {
    body:     { y: 0.55, rot: [0, 0, 0] },
    head:     { y: 1.18, rot: [0, 0, 0] },
    armL:     { pos: [-0.28, 0.92, 0],   rot: [0.2, 0, 0.1] },
    armR:     { pos: [0.28, 0.92, 0],    rot: [-0.2, 0, -0.1] },
    legL:     { pos: [-0.11, 0.38, 0],   rot: [0.1, 0, 0] },
    legR:     { pos: [0.11, 0.38, 0],    rot: [-0.1, 0, 0] },
  },
  sleep: {
    body:     { y: 0.32, rot: [Math.PI / 2, 0, 0] },
    head:     { y: 0.32, rot: [Math.PI / 2, 0, 0], offset: [0, 0, 0.55] },
    armL:     { pos: [-0.28, 0.32, -0.1], rot: [Math.PI / 2, 0, 0.1] },
    armR:     { pos: [0.28, 0.32, -0.1],  rot: [Math.PI / 2, 0, -0.1] },
    legL:     { pos: [-0.11, 0.32, -0.55], rot: [Math.PI / 2, 0, 0] },
    legR:     { pos: [0.11, 0.32, -0.55],  rot: [Math.PI / 2, 0, 0] },
  },
  sit: {
    body:     { y: 0.5, rot: [0, 0, 0] },
    head:     { y: 1.12, rot: [0, 0, 0] },
    armL:     { pos: [-0.28, 0.85, 0.1],  rot: [-0.4, 0, 0.15] },
    armR:     { pos: [0.28, 0.85, 0.1],   rot: [-0.4, 0, -0.15] },
    legL:     { pos: [-0.11, 0.38, 0.25], rot: [-1.2, 0, 0] },
    legR:     { pos: [0.11, 0.38, 0.25],  rot: [-1.2, 0, 0] },
  },
  chill: {
    body:     { y: 0.5, rot: [-0.18, 0, 0] },
    head:     { y: 1.1, rot: [-0.1, 0, 0] },
    armL:     { pos: [-0.32, 0.85, 0.05], rot: [-0.2, 0, 0.4] },
    armR:     { pos: [0.32, 0.85, 0.05],  rot: [-0.2, 0, -0.4] },
    legL:     { pos: [-0.11, 0.4, 0.3],   rot: [-0.9, 0, 0] },
    legR:     { pos: [0.18, 0.4, 0.35],   rot: [-1.1, 0, -0.2] },
  },
  lift: {
    body:     { y: 0.6, rot: [0, 0, 0] },
    head:     { y: 1.22, rot: [0.15, 0, 0] },
    armL:     { pos: [-0.34, 1.0, 0],     rot: [-2.6, 0, 0.5] },
    armR:     { pos: [0.34, 1.0, 0],      rot: [-2.6, 0, -0.5] },
    legL:     { pos: [-0.13, 0.42, 0],    rot: [0.0, 0, 0] },
    legR:     { pos: [0.13, 0.42, 0],     rot: [0.0, 0, 0] },
  },
  swing: {
    body:     { y: 0.55, rot: [0, 0.4, 0] },
    head:     { y: 1.18, rot: [0, 0.4, 0] },
    armL:     { pos: [-0.28, 0.92, 0],    rot: [0.3, 0, 0.3] },
    armR:     { pos: [0.32, 1.0, 0.1],    rot: [-1.4, 0, -1.0] },
    legL:     { pos: [-0.18, 0.38, -0.1], rot: [0.2, 0, 0.1] },
    legR:     { pos: [0.14, 0.38, 0.15],  rot: [-0.3, 0, -0.1] },
  },
  eat: {
    body:     { y: 0.55, rot: [0, 0, 0] },
    head:     { y: 1.18, rot: [-0.1, 0, 0] },
    armL:     { pos: [-0.28, 0.92, 0],    rot: [0.1, 0, 0.1] },
    armR:     { pos: [0.16, 1.05, 0.05],  rot: [-1.6, 0.3, -0.6] },
    legL:     { pos: [-0.11, 0.38, 0.2],  rot: [-1.0, 0, 0] },
    legR:     { pos: [0.11, 0.38, 0.2],   rot: [-1.0, 0, 0] },
  },
  cycle: {
    body:     { y: 0.5, rot: [-0.18, 0, 0] },
    head:     { y: 1.1, rot: [-0.1, 0, 0] },
    armL:     { pos: [-0.26, 0.8, 0.25],  rot: [-1.0, 0, 0.2] },
    armR:     { pos: [0.26, 0.8, 0.25],   rot: [-1.0, 0, -0.2] },
    legL:     { pos: [-0.11, 0.4, 0.1],   rot: [-0.7, 0, 0] },
    legR:     { pos: [0.11, 0.4, 0.1],    rot: [-0.3, 0, 0] },
  },
  cricket: {
    body:     { y: 0.55, rot: [0.15, 0.3, 0] },
    head:     { y: 1.18, rot: [0.05, 0.3, 0] },
    armL:     { pos: [-0.18, 1.0, 0.15],  rot: [-1.4, 0.2, 0.3] },
    armR:     { pos: [-0.05, 1.05, 0.2],  rot: [-1.5, 0.3, 0.2] },
    legL:     { pos: [-0.18, 0.38, -0.05], rot: [0.2, 0, 0.15] },
    legR:     { pos: [0.14, 0.38, 0.1],   rot: [-0.4, 0, -0.1] },
  },
  code: {
    body:     { y: 0.5, rot: [-0.05, 0, 0] },
    head:     { y: 1.1, rot: [-0.15, 0, 0] },
    armL:     { pos: [-0.22, 0.88, 0.2],  rot: [-1.3, 0, 0.2] },
    armR:     { pos: [0.22, 0.88, 0.2],   rot: [-1.3, 0, -0.2] },
    legL:     { pos: [-0.11, 0.38, 0.2],  rot: [-1.0, 0, 0] },
    legR:     { pos: [0.11, 0.38, 0.2],   rot: [-1.0, 0, 0] },
  },
}

export default function Character({ pose = 'walk', position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
  const p = useMemo(() => POSES[pose] || POSES.walk, [pose])

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Body / torso */}
      <group position={[0, p.body.y, 0]} rotation={p.body.rot}>
        <mesh castShadow>
          <boxGeometry args={[0.38, 0.5, 0.22]} />
          <meshStandardMaterial color={SHIRT} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0, 0.115]}>
          <boxGeometry args={[0.04, 0.5, 0.001]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.25} />
        </mesh>
      </group>

      {/* Head */}
      <group
        position={[
          (p.head.offset?.[0] || 0),
          p.head.y,
          (p.head.offset?.[2] || 0),
        ]}
        rotation={p.head.rot}
      >
        <mesh castShadow>
          <sphereGeometry args={[0.16, 24, 20]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.06, -0.01]} castShadow>
          <sphereGeometry args={[0.165, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
          <meshStandardMaterial color={HAIR} roughness={0.95} />
        </mesh>
        <mesh position={[-0.05, 0.0, 0.14]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshBasicMaterial color="#0a0808" />
        </mesh>
        <mesh position={[0.05, 0.0, 0.14]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshBasicMaterial color="#0a0808" />
        </mesh>
      </group>

      {/* Arms */}
      {[p.armL, p.armR].map((a, i) => (
        <group key={`arm-${i}`} position={a.pos} rotation={a.rot}>
          <mesh position={[0, -0.18, 0]} castShadow>
            <capsuleGeometry args={[0.05, 0.22, 4, 12]} />
            <meshStandardMaterial color={SHIRT} roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.42, 0]} castShadow>
            <capsuleGeometry args={[0.045, 0.18, 4, 12]} />
            <meshStandardMaterial color={SKIN} roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Legs */}
      {[p.legL, p.legR].map((l, i) => (
        <group key={`leg-${i}`} position={l.pos} rotation={l.rot}>
          <mesh position={[0, -0.2, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.3, 4, 12]} />
            <meshStandardMaterial color={JEANS} roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.45, 0.05]} castShadow>
            <boxGeometry args={[0.12, 0.08, 0.22]} />
            <meshStandardMaterial color={SHOE} roughness={0.6} metalness={0.1} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export { POSES }
