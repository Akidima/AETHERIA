/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Three.js fiber JSX types handled at runtime
import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere, Environment, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { VisualParams, VisualMode } from '../types';
import { ParticleField } from './visualizations/ParticleField';
import { Aurora } from './visualizations/Aurora';
import { Geometric } from './visualizations/Geometric';
import { Nebula } from './visualizations/Nebula';
import { Fluid } from './visualizations/Fluid';
import { useTheme } from '../contexts/ThemeContext';


interface SceneProps {
  params: VisualParams;
  visualMode?: VisualMode;
}

// A dynamic spotlight that orbits the scene to create moving shadows and highlights
const MovingLight: React.FC<{ color: string; speed: number }> = ({ color, speed }) => {
  const lightRef = useRef<THREE.SpotLight>(null);
  
  useFrame(({ clock }) => {
    if (lightRef.current) {
      const t = clock.getElapsedTime() * (0.2 + speed * 0.2); // Speed scales with params
      // Orbit logic
      lightRef.current.position.x = Math.sin(t) * 8;
      lightRef.current.position.z = Math.cos(t) * 8;
      lightRef.current.position.y = Math.sin(t * 0.5) * 4;
      lightRef.current.lookAt(0, 0, 0);
    }
  });

  return (
    <spotLight
      ref={lightRef}
      position={[5, 5, 5]}
      angle={0.5}
      penumbra={1}
      intensity={50} // Higher intensity for native light
      color={color}
      distance={20}
      castShadow
    />
  );
};

// New Component: Subtle Background Atmosphere
const AmbientBackground: React.FC<{ params: VisualParams }> = ({ params }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
        // Very slow rotation for a gentle, evolving pattern
        meshRef.current.rotation.z += 0.001;
        meshRef.current.rotation.x += 0.001;
    }
  });

  return (
    <group position={[0, 0, -12]}>
       {/* Ethereal animated texture using massive distorted mesh */}
       {/* This acts as a dynamic "wallpaper" behind the scene */}
       <mesh ref={meshRef} scale={[18, 18, 18]}>
         <sphereGeometry args={[1, 64, 64]} />
         <MeshDistortMaterial 
           color={params.color}
           speed={0.2} // Very slow, independent undulation
           distort={0.5} // Subtle warping
           radius={1}
           transparent
           opacity={0.05} // Barely visible, just a hint of texture
           side={THREE.DoubleSide}
           depthWrite={false} // Ensure it doesn't mess with depth buffer for stars
         />
       </mesh>
    </group>
  );
};

// New Component: Digital Moon
const Moon: React.FC = () => {
  const moonRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (moonRef.current) {
      // Very slow axial rotation
      moonRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group position={[5, 4, -20]}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[-0.5, 0.5]}>
        <mesh ref={moonRef}>
          <sphereGeometry args={[3.5, 64, 64]} />
          <meshStandardMaterial 
            color="#2a2a2a" // Darker base for better contrast with rim light
            roughness={0.7}
            metalness={0.5}
            emissive="#ffffff"
            emissiveIntensity={0.05} // Subtle self-glow
            envMapIntensity={0.5}
          />
        </mesh>
        {/* Dedicated rim light for the moon */}
        <pointLight intensity={20} distance={30} color="#ffffff" position={[-5, 2, 5]} />
      </Float>
    </group>
  );
};

const SentientParticles: React.FC<{ params: VisualParams }> = ({ params }) => {
  const count = 400;
  const meshRef = useRef<THREE.Points>(null);
  
  // Memoize initial random vectors to avoid recalculating every frame
  const { vectors, initialPositions, phases } = useMemo(() => {
    const vectors = new Float32Array(count * 3);
    const initialPositions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * 2 * Math.PI;
      
      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);
      
      vectors[i * 3] = x;
      vectors[i * 3 + 1] = y;
      vectors[i * 3 + 2] = z;
      
      // Start at random distances
      const r = 1.8 + Math.random() * 6;
      initialPositions[i * 3] = x * r;
      initialPositions[i * 3 + 1] = y * r;
      initialPositions[i * 3 + 2] = z * r;

      phases[i] = Math.random() * Math.PI * 2;
    }
    return { vectors, initialPositions, phases };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    const time = state.clock.getElapsedTime();
    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    
    // Determine speed factor
    const speedFactor = 0.2 + (params.speed * 0.5);

    for (let i = 0; i < count; i++) {
        // Base direction vector
        const vx = vectors[i * 3];
        const vy = vectors[i * 3 + 1];
        const vz = vectors[i * 3 + 2];
        
        // Calculate new distance based on time and phase
        // Cycle: (time * speed + phase)
        // Map to distance: 1.8 (surface) -> 8.0 (outer edge)
        let cycle = (time * speedFactor + phases[i]) % 1;
        
        // Non-linear expansion for effect
        let r = 1.8 + (cycle * 6);
        
        // Add "sentient" curl/noise
        // Wiggle based on time and position
        const noise = Math.sin(time * 2 + phases[i]) * 0.1;
        
        positions[i * 3] = vx * r + Math.cos(time + vy) * 0.1;
        positions[i * 3 + 1] = vy * r + Math.sin(time + vx) * 0.1;
        positions[i * 3 + 2] = vz * r + noise;
    }
    
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    
    // Slowly rotate the whole cloud
    meshRef.current.rotation.y = time * 0.05;
    meshRef.current.rotation.z = time * 0.02;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={initialPositions} 
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={params.color}
        size={0.12} 
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
};

const ReactiveSphere: React.FC<{ params: VisualParams }> = ({ params }) => {
  const materialRef = useRef<any>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // 1. Interpolate Material Props for smooth transitions
    if (materialRef.current) {
      materialRef.current.distort = THREE.MathUtils.lerp(materialRef.current.distort, params.distort, 0.05);
      materialRef.current.speed = THREE.MathUtils.lerp(materialRef.current.speed, params.speed * 3, 0.05);
      materialRef.current.color.lerp(new THREE.Color(params.color), 0.05);
    }

    // 2. Base Rotation
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.1;
      meshRef.current.rotation.x = Math.sin(t * 0.2) * 0.1;
    }

    // 3. Aura Animation (Counter-rotation + Pulsing)
    if (auraRef.current) {
      auraRef.current.rotation.y = -t * 0.2;
      auraRef.current.rotation.z = t * 0.1;
      
      // Pulse scale based on param speed
      const pulse = Math.sin(t * (1 + params.speed)) * 0.05;
      const baseScale = 2.4;
      auraRef.current.scale.setScalar(baseScale + pulse);
    }
  });

  return (
    <group>
      {/* Inner Core Sphere - Liquid Metal */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere ref={meshRef} args={[1, 128, 128]} scale={1.8}>
          <MeshDistortMaterial
            ref={materialRef}
            color={params.color}
            envMapIntensity={1}
            clearcoat={1}
            clearcoatRoughness={0.1}
            metalness={0.8}
            roughness={0.2}
            distort={0.4}
            speed={2}
          />
        </Sphere>
      </Float>

      {/* Outer Wireframe Aura - Digital Shield */}
      <Float speed={3} rotationIntensity={1.5} floatIntensity={1}>
        <mesh ref={auraRef}>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial
            color={params.color}
            wireframe
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </Float>
    </group>
  );
};

// Minimal mode visualization
const MinimalCircle: React.FC<{ params: VisualParams }> = ({ params }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * params.speed) * 0.1 * params.distort;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={meshRef}>
      <ringGeometry args={[1.5, 1.6, 64]} />
      <meshBasicMaterial color={params.color} transparent opacity={0.8} />
    </mesh>
  );
};

// Render the appropriate visualization based on mode
const VisualizationContent: React.FC<{ params: VisualParams; mode: VisualMode }> = ({ params, mode }) => {
  switch (mode) {
    case 'particles':
      return <ParticleField params={params} />;
    case 'aurora':
      return <Aurora params={params} />;
    case 'geometric':
      return <Geometric params={params} />;
    case 'nebula':
      return <Nebula params={params} />;
    case 'fluid':
      return <Fluid params={params} />;
    case 'minimal':
      return <MinimalCircle params={params} />;
    case 'sphere':
    default:
      return (
        <>
          <ReactiveSphere params={params} />
          <SentientParticles params={params} />
        </>
      );
  }
};

export const Scene: React.FC<SceneProps> = ({ params, visualMode = 'sphere' }) => {
  const { theme } = useTheme();
  // Determine if we should show background elements
  const showBackgroundElements = ['sphere', 'particles', 'geometric', 'nebula'].includes(visualMode);
  
  return (
    <div
      className="absolute inset-0 w-full h-full z-0 pointer-events-none transition-colors duration-1000"
      style={{ backgroundColor: theme.background }}
    >
      <Canvas 
        className="w-full h-full"
        camera={{ position: [0, 0, 9], fov: 40 }} 
        dpr={[1, 2]} 
        gl={{ 
          antialias: true, 
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
      >
        <color attach="background" args={[theme.background]} />

        {/* Lighting Setup */}
        <ambientLight intensity={0.6} />
        <MovingLight color={params.color} speed={params.speed} />
        
        {/* Background elements for certain modes */}
        {showBackgroundElements && (
          <>
            <AmbientBackground params={params} />
            <Moon />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          </>
        )}

        {/* Main Visualization */}
        <Suspense fallback={null}>
          <VisualizationContent params={params} mode={visualMode} />
        </Suspense>

        <Environment preset="city" />
      </Canvas>
      
      {/* Noise Overlay for Texture/Grain */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay" 
           style={{ backgroundImage: `url("https://grainy-gradients.vercel.app/noise.svg")` }}></div>
    </div>
  );
};