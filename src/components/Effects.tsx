import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Color } from 'three';

interface Particle {
  position: Vector3;
  velocity: Vector3;
  scale: number;
  life: number;
}

export const Explosion = ({ position, color, onComplete }: { position: Vector3, color: Color, onComplete: () => void }) => {
  const groupRef = useRef<any>(null);
  
  // Create particles once
  const particles = useMemo(() => {
    const count = 12;
    const parts: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const velocity = new Vector3(
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 5
      );
      parts.push({
        position: new Vector3(0, 0, 0),
        velocity,
        scale: Math.random() * 0.3 + 0.1,
        life: 1.0 + Math.random() * 0.5
      });
    }
    return parts;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    let alive = false;
    
    // Update particles
    particles.forEach((p, i) => {
      if (p.life > 0) {
        alive = true;
        p.life -= delta * 2.0; // Fade speed
        p.position.addScaledVector(p.velocity, delta);
        p.velocity.y -= delta * 1; // Slight gravity
        p.velocity.multiplyScalar(0.95); // Drag
        
        const mesh = groupRef.current.children[i];
        if (mesh) {
          mesh.position.copy(p.position);
          mesh.scale.setScalar(p.scale * p.life);
        }
      }
    });

    if (!alive) {
      onComplete();
    }
  });

  return (
    <group position={position} ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};
