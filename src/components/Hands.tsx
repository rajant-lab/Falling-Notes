import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../store';
import { Trail } from '@react-three/drei';

const HandCursor = ({ side }: { side: 'left' | 'right' }) => {
  const groupRef = useRef<any>(null);
  const sphereRef = useRef<any>(null);
  const lightRef = useRef<any>(null);
  
  useFrame(() => {
    const handData = useStore.getState().handData[side];
    if (groupRef.current) {
      groupRef.current.visible = handData.present;
      if (handData.present) {
        groupRef.current.position.lerp(handData.position, 0.2);
        
        // Update visual state based on pinch
        if (sphereRef.current) {
             sphereRef.current.material.color.set(handData.pinch ? "#ffffff" : "#4cc9f0");
             sphereRef.current.scale.setScalar(handData.pinch ? 1.5 : 1);
        }
        
        // Update light
        if (lightRef.current) {
            lightRef.current.visible = handData.pinch;
        }
      }
    }
  });

  return (
    <group ref={groupRef}>
      <Trail width={0.5} length={4} color="#4cc9f0" attenuation={(t) => t * t}>
        <mesh ref={sphereRef}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#4cc9f0" />
        </mesh>
      </Trail>
      <pointLight ref={lightRef} distance={2} intensity={2} color="white" visible={false} />
    </group>
  );
};

export function Hands() {
  return (
    <>
      <HandCursor side="left" />
      <HandCursor side="right" />
    </>
  );
}
