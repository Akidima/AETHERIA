// Geometric Sacred Geometry Visualization
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VisualParams } from '../../types';

interface GeometricProps {
  params: VisualParams;
}

// Create icosahedron vertices for sacred geometry
const createSacredGeometry = () => {
  const phi = (1 + Math.sqrt(5)) / 2; // Golden ratio
  const vertices: THREE.Vector3[] = [];
  
  // Icosahedron vertices
  const coords = [
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ];
  
  coords.forEach(([x, y, z]) => {
    vertices.push(new THREE.Vector3(x, y, z).normalize().multiplyScalar(2));
  });
  
  return vertices;
};

export const Geometric: React.FC<GeometricProps> = ({ params }) => {
  const groupRef = useRef<THREE.Group>(null);
  const vertices = useMemo(() => createSacredGeometry(), []);
  const color = useMemo(() => new THREE.Color(params.color), [params.color]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    const time = state.clock.elapsedTime * params.speed * 0.3;
    
    // Rotate the whole structure
    groupRef.current.rotation.x = time * 0.2;
    groupRef.current.rotation.y = time * 0.3;
    
    // Animate children
    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        const scale = 1 + Math.sin(time * 2 + i * 0.5) * 0.1 * params.distort;
        child.scale.setScalar(scale);
      }
      if (child instanceof THREE.Line) {
        (child.material as THREE.LineBasicMaterial).opacity = 
          0.3 + Math.sin(time * 3 + i * 0.2) * 0.2;
      }
    });
  });

  // Create edges between vertices
  const edges = useMemo(() => {
    const lines: [THREE.Vector3, THREE.Vector3][] = [];
    const threshold = 2.5; // Distance threshold for connections
    
    for (let i = 0; i < vertices.length; i++) {
      for (let j = i + 1; j < vertices.length; j++) {
        if (vertices[i].distanceTo(vertices[j]) < threshold) {
          lines.push([vertices[i], vertices[j]]);
        }
      }
    }
    
    return lines;
  }, [vertices]);

  return (
    <group ref={groupRef}>
      {/* Vertex points */}
      {vertices.map((v, i) => (
        <mesh key={`vertex-${i}`} position={v}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} />
        </mesh>
      ))}
      
      {/* Edges */}
      {edges.map(([start, end], i) => (
        <line key={`edge-${i}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                start.x, start.y, start.z,
                end.x, end.y, end.z
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={color} transparent opacity={0.4} />
        </line>
      ))}
      
      {/* Inner icosahedron */}
      <mesh>
        <icosahedronGeometry args={[1.2, 0]} />
        <meshBasicMaterial 
          color={color} 
          wireframe 
          transparent 
          opacity={0.3}
        />
      </mesh>
      
      {/* Outer icosahedron */}
      <mesh>
        <icosahedronGeometry args={[2.5, 1]} />
        <meshBasicMaterial 
          color={color} 
          wireframe 
          transparent 
          opacity={0.15}
        />
      </mesh>
      
      {/* Center glow */}
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
    </group>
  );
};
