// Nebula Cosmic Cloud Visualization
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VisualParams } from '../../types';

interface NebulaProps {
  params: VisualParams;
}

export const Nebula: React.FC<NebulaProps> = ({ params }) => {
  const groupRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Points[]>([]);
  
  const cloudCount = 5;
  const particlesPerCloud = 500;

  const clouds = useMemo(() => {
    return Array.from({ length: cloudCount }, (_, cloudIndex) => {
      const positions = new Float32Array(particlesPerCloud * 3);
      const sizes = new Float32Array(particlesPerCloud);
      const opacities = new Float32Array(particlesPerCloud);
      
      // Each cloud has a different center offset
      const offsetX = (Math.random() - 0.5) * 3;
      const offsetY = (Math.random() - 0.5) * 2;
      const offsetZ = (Math.random() - 0.5) * 3;
      
      for (let i = 0; i < particlesPerCloud; i++) {
        const i3 = i * 3;
        
        // Gaussian distribution for cloud-like shape
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = Math.pow(Math.random(), 0.5) * 2;
        
        positions[i3] = r * Math.sin(phi) * Math.cos(theta) + offsetX;
        positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6 + offsetY;
        positions[i3 + 2] = r * Math.cos(phi) + offsetZ;
        
        sizes[i] = Math.random() * 0.15 + 0.05;
        opacities[i] = Math.random() * 0.5 + 0.2;
      }
      
      return { positions, sizes, opacities, offset: { x: offsetX, y: offsetY, z: offsetZ } };
    });
  }, []);

  const baseColor = useMemo(() => new THREE.Color(params.color), [params.color]);
  
  // Create color variations
  const colors = useMemo(() => {
    return clouds.map((_, i) => {
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);
      // Vary hue slightly for each cloud
      const newColor = new THREE.Color().setHSL(
        (hsl.h + (i - cloudCount / 2) * 0.05 + 1) % 1,
        hsl.s,
        hsl.l + (i - cloudCount / 2) * 0.1
      );
      return newColor;
    });
  }, [baseColor, clouds]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime * params.speed * 0.2;
    
    // Rotate entire nebula slowly
    groupRef.current.rotation.y = time * 0.1;
    groupRef.current.rotation.x = Math.sin(time * 0.05) * 0.1;
    
    // Animate each cloud
    cloudsRef.current.forEach((cloud, i) => {
      if (!cloud) return;
      
      const positions = cloud.geometry.attributes.position.array as Float32Array;
      const basePositions = clouds[i].positions;
      
      for (let j = 0; j < particlesPerCloud; j++) {
        const j3 = j * 3;
        
        // Add swirling motion
        const angle = time * 0.3 + j * 0.01;
        const radius = 0.1 * params.distort;
        
        positions[j3] = basePositions[j3] + Math.sin(angle + i) * radius;
        positions[j3 + 1] = basePositions[j3 + 1] + Math.cos(angle * 0.7 + i) * radius * 0.5;
        positions[j3 + 2] = basePositions[j3 + 2] + Math.sin(angle * 0.5 + i) * radius;
      }
      
      cloud.geometry.attributes.position.needsUpdate = true;
      
      // Pulse opacity
      const material = cloud.material as THREE.PointsMaterial;
      material.opacity = 0.4 + Math.sin(time + i * 0.5) * 0.1 * params.distort;
    });
  });

  return (
    <group ref={groupRef}>
      {clouds.map((cloud, i) => (
        <points
          key={i}
          ref={(el) => { if (el) cloudsRef.current[i] = el; }}
        >
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={particlesPerCloud}
              array={cloud.positions.slice()}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.1}
            color={colors[i]}
            transparent
            opacity={0.5}
            sizeAttenuation
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      ))}
      
      {/* Core glow */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial 
          color={baseColor} 
          transparent 
          opacity={0.3}
        />
      </mesh>
      
      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[3, 32, 32]} />
        <meshBasicMaterial 
          color={baseColor} 
          transparent 
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
};
