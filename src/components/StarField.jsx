import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const STAR_COUNT = 8000
const SPREAD = 400
const DEPTH = 2000

// Custom shader for speed-based star stretching
const starVertexShader = `
  attribute float size;
  attribute float brightness;
  uniform float uSpeed;
  uniform float uTime;
  varying float vBrightness;
  varying float vStretch;

  void main() {
    vBrightness = brightness;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // Stretch factor based on speed
    float stretch = 1.0 + uSpeed * 0.15;
    vStretch = min(stretch, 8.0);
    
    // Size scales with speed for glow effect
    gl_PointSize = size * (200.0 / -mvPosition.z) * (1.0 + uSpeed * 0.03);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const starFragmentShader = `
  varying float vBrightness;
  varying float vStretch;
  uniform float uSpeed;
  uniform vec3 uColor;

  void main() {
    vec2 center = gl_PointCoord - 0.5;
    
    // Stretch vertically at high speed to simulate motion blur
    center.y /= max(vStretch, 1.0);
    
    float dist = length(center);
    if (dist > 0.5) discard;
    
    // Soft glow falloff
    float alpha = smoothstep(0.5, 0.0, dist) * vBrightness;
    
    // Color shifts bluer/whiter at high speed
    vec3 color = mix(uColor, vec3(0.7, 0.85, 1.0), min(uSpeed / 80.0, 0.6));
    
    gl_FragColor = vec4(color, alpha);
  }
`

export default function StarField({ speed = 0, shipZ = 0 }) {
  const meshRef = useRef()
  const materialRef = useRef()

  const { positions, sizes, brightnesses } = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3)
    const sz = new Float32Array(STAR_COUNT)
    const br = new Float32Array(STAR_COUNT)

    for (let i = 0; i < STAR_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * SPREAD
      pos[i * 3 + 1] = (Math.random() - 0.5) * SPREAD
      pos[i * 3 + 2] = -Math.random() * DEPTH
      sz[i] = Math.random() * 2.5 + 0.5
      br[i] = Math.random() * 0.7 + 0.3
    }

    return { positions: pos, sizes: sz, brightnesses: br }
  }, [])

  const uniforms = useMemo(() => ({
    uSpeed: { value: 0 },
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0.9, 0.92, 1.0) },
  }), [])

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return

    materialRef.current.uniforms.uSpeed.value = speed
    materialRef.current.uniforms.uTime.value = state.clock.elapsedTime

    // Recycle stars that pass behind the camera
    const geo = meshRef.current.geometry
    const posAttr = geo.attributes.position
    const arr = posAttr.array

    for (let i = 0; i < STAR_COUNT; i++) {
      const iz = i * 3 + 2
      const starZ = arr[iz]

      // Star is behind camera — respawn it far ahead
      if (starZ > shipZ + 20) {
        arr[iz] = shipZ - DEPTH * (0.5 + Math.random() * 0.5)
        arr[i * 3] = (Math.random() - 0.5) * SPREAD
        arr[i * 3 + 1] = (Math.random() - 0.5) * SPREAD
      }
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={meshRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={STAR_COUNT} itemSize={3} />
        <bufferAttribute attach="attributes-size" array={sizes} count={STAR_COUNT} itemSize={1} />
        <bufferAttribute attach="attributes-brightness" array={brightnesses} count={STAR_COUNT} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={starVertexShader}
        fragmentShader={starFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
