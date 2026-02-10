// Particle Field Visualization
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VisualParams } from '../../types';

interface ParticleFieldProps {
  params: VisualParams;
}

export const ParticleField: React.FC<ParticleFieldProps> = ({ params }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 2000;

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Sphere distribution
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2 + Math.random() * 2;
      
      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);
      
      vel[i3] = (Math.random() - 0.5) * 0.02;
      vel[i3 + 1] = (Math.random() - 0.5) * 0.02;
      vel[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    return [pos, vel];
  }, []);

  const color = useMemo(() => new THREE.Color(params.color), [params.color]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime * params.speed;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Orbital motion
      const x = positions[i3];
      const y = positions[i3 + 1];
      const z = positions[i3 + 2];
      
      const dist = Math.sqrt(x * x + y * y + z * z);
      const angle = time * (0.1 + params.distort * 0.2) / (dist * 0.5);
      
      // Rotate around Y axis with some wobble
      positions[i3] = x * Math.cos(angle) - z * Math.sin(angle);
      positions[i3 + 2] = x * Math.sin(angle) + z * Math.cos(angle);
      
      // Add some vertical oscillation
      positions[i3 + 1] += Math.sin(time + i * 0.01) * 0.002 * params.distort;
      
      // Keep particles within bounds
      if (dist > 5) {
        const scale = 4 / dist;
        positions[i3] *= scale;
        positions[i3 + 1] *= scale;
        positions[i3 + 2] *= scale;
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y = time * 0.05;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
