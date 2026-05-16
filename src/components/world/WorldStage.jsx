import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, SoftShadows } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

import { resolve, LOCATIONS, LOCATION_LABELS, LOCATION_EMOJI } from '../../lib/schedule'
import Bedroom from './scenes/Bedroom'
import Kitchen from './scenes/Kitchen'
import LivingRoom from './scenes/LivingRoom'
import Tennis from './scenes/Tennis'
import Gym from './scenes/Gym'
import Cafe from './scenes/Cafe'
import Outdoor from './scenes/Outdoor'
import Workspace from './scenes/Workspace'

// ============================================================
// WorldStage — single Canvas, mounts the active scene, flies
// the camera between scene presets when the location changes.
// ============================================================

// Camera + look-at presets per location. Tweak per scene to flatter.
const VIEWS = {
  bedroom:   { pos: [3.2, 2.4, 2.8],   look: [0.3, 0.8, -1.0] },
  kitchen:   { pos: [3.0, 2.5, 3.4],   look: [0.0, 0.8, -0.5] },
  living:    { pos: [3.4, 2.4, 4.0],   look: [0.0, 0.9, 0.0] },
  workspace: { pos: [3.0, 2.0, 3.6],   look: [0.0, 0.9, -0.6] },
  tennis:    { pos: [4.5, 3.0, 6.0],   look: [0.0, 0.8, 0.0] },
  gym:       { pos: [3.6, 2.4, 4.0],   look: [0.0, 1.0, 0.0] },
  cafe:      { pos: [2.8, 2.0, 3.4],   look: [0.0, 0.9, 0.5] },
  outdoor:   { pos: [4.0, 2.6, 6.0],   look: [0.0, 0.8, 0.5] },
}

const SCENES = {
  bedroom:   Bedroom,
  kitchen:   Kitchen,
  living:    LivingRoom,
  workspace: Workspace,
  tennis:    Tennis,
  gym:       Gym,
  cafe:      Cafe,
  outdoor:   Outdoor,
}

// Camera-fly controller — eases position + lookAt to target over ~1.4s
function CameraRig({ targetLocation }) {
  const { camera } = useThree()
  const startRef = useRef({ pos: new THREE.Vector3(), look: new THREE.Vector3(), t: 0 })
  const endRef = useRef({ pos: new THREE.Vector3(), look: new THREE.Vector3() })
  const tRef = useRef(1) // 1 = at target, 0..1 = lerping
  const durationRef = useRef(1.4)
  const currentLook = useRef(new THREE.Vector3())

  useEffect(() => {
    const v = VIEWS[targetLocation] || VIEWS.workspace
    startRef.current.pos.copy(camera.position)
    startRef.current.look.copy(currentLook.current)
    endRef.current.pos.set(...v.pos)
    endRef.current.look.set(...v.look)
    tRef.current = 0
  }, [targetLocation, camera])

  // Initialise look target
  useEffect(() => {
    const v = VIEWS[targetLocation] || VIEWS.workspace
    currentLook.current.set(...v.look)
    camera.position.set(...v.pos)
    camera.lookAt(currentLook.current)
  }, [])

  useFrame((_, delta) => {
    if (tRef.current >= 1) return
    tRef.current = Math.min(1, tRef.current + delta / durationRef.current)
    // Ease in-out cubic
    const t = tRef.current
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    camera.position.lerpVectors(startRef.current.pos, endRef.current.pos, eased)
    currentLook.current.lerpVectors(startRef.current.look, endRef.current.look, eased)
    camera.lookAt(currentLook.current)
  })

  return null
}

function SceneSlot({ location, activity }) {
  const Scene = SCENES[location] || Workspace
  return <Scene activity={activity} />
}

export default function WorldStage({ onLocationChange }) {
  // Live schedule resolver — re-evaluates every minute
  const [live, setLive] = useState(() => resolve(new Date()))
  // Visitor override — if not null, overrides the live location
  const [override, setOverride] = useState(null)

  useEffect(() => {
    const id = setInterval(() => setLive(resolve(new Date())), 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const activeLocation = override || live.location
  const activeActivity = override ? null : live.activity

  // Bubble up state to parent (HeroNav)
  useEffect(() => {
    if (onLocationChange) {
      onLocationChange({
        location: activeLocation,
        liveLocation: live.location,
        liveActivity: live.activity,
        isOverride: !!override,
        setOverride,
      })
    }
  }, [activeLocation, live.location, live.activity, override])

  // Listen for cross-component override events (e.g. from HeroNav)
  useEffect(() => {
    const handler = (e) => {
      const loc = e.detail?.location
      if (loc === null || loc === undefined) setOverride(null)
      else if (SCENES[loc]) setOverride(loc)
    }
    window.addEventListener('world:set-location', handler)
    return () => window.removeEventListener('world:set-location', handler)
  }, [])

  // Choose Environment preset + background by location
  const envPreset = useMemo(() => {
    if (activeLocation === 'tennis' || activeLocation === 'outdoor') return 'sunset'
    if (activeLocation === 'bedroom') return 'night'
    if (activeLocation === 'cafe') return 'apartment'
    if (activeLocation === 'gym') return 'warehouse'
    return 'city'
  }, [activeLocation])

  const bgColor = useMemo(() => {
    switch (activeLocation) {
      case 'bedroom':   return '#0c0816'
      case 'kitchen':   return '#1a1408'
      case 'living':    return '#120a1a'
      case 'workspace': return '#0a0612'
      case 'tennis':    return '#16344a'
      case 'gym':       return '#0a0a10'
      case 'cafe':      return '#1a0e08'
      case 'outdoor':   return '#1a3050'
      default:          return '#0a0612'
    }
  }, [activeLocation])

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{ position: [3, 2.2, 4], fov: 45 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.25, outputColorSpace: THREE.SRGBColorSpace }}
        dpr={[1, 2]}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <color attach="background" args={[bgColor]} />
        <fog attach="fog" args={[bgColor, 8, 22]} />
        <SoftShadows size={18} samples={8} focus={0.7} />

        {/* Lighting */}
        <ambientLight intensity={0.45} />
        <directionalLight
          position={[5, 7, 3]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0002}
        >
          <orthographicCamera attach="shadow-camera" args={[-7, 7, 7, -7, 0.1, 25]} />
        </directionalLight>
        <directionalLight position={[-4, 3, -3]} intensity={0.35} color="#a78bfa" />

        <Suspense fallback={null}>
          <Environment preset={envPreset} background={false} />
          <ContactShadows
            position={[0, 0.003, 0]}
            opacity={0.55}
            scale={16}
            blur={2.4}
            far={5}
            resolution={1024}
            color="#000"
          />
          <SceneSlot location={activeLocation} activity={activeActivity} />
        </Suspense>

        <CameraRig targetLocation={activeLocation} />

        <OrbitControls
          target={[0, 0.9, 0]}
          enablePan={false}
          minDistance={3.0}
          maxDistance={9}
          minPolarAngle={Math.PI / 5}
          maxPolarAngle={Math.PI / 2.1}
          autoRotate
          autoRotateSpeed={0.25}
        />

        <EffectComposer multisampling={2} disableNormalPass>
          <Bloom intensity={0.7} luminanceThreshold={0.55} luminanceSmoothing={0.25} mipmapBlur radius={0.78} />
          <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.0006, 0.0009]} />
          <Vignette eskil={false} offset={0.15} darkness={0.55} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
