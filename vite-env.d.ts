/// <reference types="vite/client" />

import type { Object3DNode, MaterialNode, BufferGeometryNode } from '@react-three/fiber';
import type * as THREE from 'three';

// Augment React.JSX.IntrinsicElements for @react-three/fiber elements
// Required because @types/react@19 moved JSX to React.JSX namespace
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      group: Object3DNode<THREE.Group, typeof THREE.Group>;
      mesh: Object3DNode<THREE.Mesh, typeof THREE.Mesh>;
      points: Object3DNode<THREE.Points, typeof THREE.Points>;
      line: Object3DNode<THREE.Line, typeof THREE.Line>;
      ambientLight: Object3DNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
      pointLight: Object3DNode<THREE.PointLight, typeof THREE.PointLight>;
      spotLight: Object3DNode<THREE.SpotLight, typeof THREE.SpotLight>;
      color: any;
      fog: any;
      sphereGeometry: BufferGeometryNode<THREE.SphereGeometry, typeof THREE.SphereGeometry>;
      ringGeometry: BufferGeometryNode<THREE.RingGeometry, typeof THREE.RingGeometry>;
      planeGeometry: BufferGeometryNode<THREE.PlaneGeometry, typeof THREE.PlaneGeometry>;
      icosahedronGeometry: BufferGeometryNode<THREE.IcosahedronGeometry, typeof THREE.IcosahedronGeometry>;
      bufferGeometry: BufferGeometryNode<THREE.BufferGeometry, typeof THREE.BufferGeometry>;
      bufferAttribute: any;
      meshBasicMaterial: MaterialNode<THREE.MeshBasicMaterial, typeof THREE.MeshBasicMaterial>;
      meshStandardMaterial: MaterialNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>;
      pointsMaterial: MaterialNode<THREE.PointsMaterial, typeof THREE.PointsMaterial>;
      shaderMaterial: MaterialNode<THREE.ShaderMaterial, typeof THREE.ShaderMaterial>;
      lineBasicMaterial: MaterialNode<THREE.LineBasicMaterial, typeof THREE.LineBasicMaterial>;
    }
  }
}

// Fix framer-motion types for TypeScript
import { HTMLMotionProps } from 'framer-motion';

declare module 'framer-motion' {
  export interface MotionProps extends HTMLMotionProps<'div'> {}
}

export {};
