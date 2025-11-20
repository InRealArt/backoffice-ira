'use client'

import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'

interface PresaleArtworkChartProps {
  count: number
}

function Bar({ position, height, color }: { position: [number, number, number], height: number, color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (meshRef.current) {
      // Animation subtile de rotation
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime + position[0]) * 0.1
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? [1.1, 1.1, 1.1] : [1, 1, 1]}
    >
      <boxGeometry args={[0.8, height, 0.8]} />
      <meshStandardMaterial
        color={hovered ? '#60a5fa' : color}
        metalness={0.5}
        roughness={0.3}
        emissive={hovered ? '#3b82f6' : '#000000'}
        emissiveIntensity={hovered ? 0.3 : 0}
      />
    </mesh>
  )
}

function ChartScene({ count }: { count: number }) {
  const maxHeight = 5
  const normalizedHeight = Math.max(0.5, Math.min(count / 10, 1)) * maxHeight
  const color = count > 0 ? '#3b82f6' : '#9ca3af'

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, 5, -5]} intensity={0.5} />

      {/* Barre principale */}
      <Bar position={[0, normalizedHeight / 2, 0]} height={normalizedHeight} color={color} />

      {/* Plan de base */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[4, 4]} />
        <meshStandardMaterial color="#e5e7eb" />
      </mesh>

      {/* Texte avec le nombre */}
      <Text
        position={[0, normalizedHeight + 1, 0]}
        fontSize={1}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#000000"
      >
        {count}
      </Text>

      {/* Label */}
      <Text
        position={[0, -2.5, 0]}
        fontSize={0.4}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
      >
        Œuvres en prévente
      </Text>

      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={8}
        maxDistance={15}
        autoRotate={true}
        autoRotateSpeed={0.5}
      />
    </>
  )
}

export default function PresaleArtworkChart({ count }: PresaleArtworkChartProps) {
  return (
    <div style={{ width: '100%', height: '400px', position: 'relative', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '8px', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [8, 5, 8], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ChartScene count={count} />
      </Canvas>
    </div>
  )
}

