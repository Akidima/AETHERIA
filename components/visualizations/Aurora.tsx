// Aurora Borealis Visualization
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { VisualParams } from '../../types';

interface AuroraProps {
  params: VisualParams;
}

export const Aurora: React.FC<AuroraProps> = ({ params }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(params.color) },
    uSpeed: { value: params.speed },
    uDistort: { value: params.distort },
  }), []);

  // Update uniforms when params change
  React.useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uColor.value.set(params.color);
      materialRef.current.uniforms.uSpeed.value = params.speed;
      materialRef.current.uniforms.uDistort.value = params.distort;
    }
  }, [params]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const vertexShader = `
    varying vec2 vUv;
    varying float vElevation;
    uniform float uTime;
    uniform float uSpeed;
    uniform float uDistort;
    
    void main() {
      vUv = uv;
      
      vec3 pos = position;
      float wave1 = sin(pos.x * 2.0 + uTime * uSpeed) * 0.3 * uDistort;
      float wave2 = sin(pos.x * 3.0 - uTime * uSpeed * 0.7) * 0.2 * uDistort;
      float wave3 = cos(pos.x * 1.5 + uTime * uSpeed * 0.5) * 0.25 * uDistort;
      
      pos.y += wave1 + wave2 + wave3;
      vElevation = wave1 + wave2 + wave3;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    varying vec2 vUv;
    varying float vElevation;
    uniform vec3 uColor;
    uniform float uTime;
    
    void main() {
      // Create gradient from bottom to top
      float gradient = smoothstep(0.0, 1.0, vUv.y);
      
      // Add shimmer effect
      float shimmer = sin(vUv.x * 20.0 + uTime * 2.0) * 0.5 + 0.5;
      shimmer *= sin(vUv.y * 10.0 - uTime) * 0.5 + 0.5;
      
      // Color variation
      vec3 color1 = uColor;
      vec3 color2 = uColor * 0.5 + vec3(0.0, 0.3, 0.5);
      vec3 finalColor = mix(color2, color1, gradient + vElevation * 0.5);
      
      // Add glow
      finalColor += shimmer * 0.2 * uColor;
      
      // Fade edges
      float alpha = gradient * (1.0 - gradient) * 4.0;
      alpha *= smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
      alpha *= 0.7 + shimmer * 0.3;
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `;

  return (
    <group>
      {/* Multiple aurora layers */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={i === 0 ? meshRef : undefined}
          position={[0, 1 + i * 0.5, -2 - i * 0.5]}
          rotation={[-0.3, 0, 0]}
        >
          <planeGeometry args={[8, 3, 64, 32]} />
          <shaderMaterial
            ref={i === 0 ? materialRef : undefined}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            uniforms={{
              ...uniforms,
              uColor: { value: new THREE.Color(params.color).multiplyScalar(1 - i * 0.2) },
            }}
            transparent
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
};
