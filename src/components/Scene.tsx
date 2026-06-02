import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { NotesSystem } from './NotesSystem';
import { SymphonyMode } from './SymphonyMode';
import { Hands } from './Hands';
import { Suspense } from 'react';
import { useStore } from '../store';

export function Scene() {
  const gameMode = useStore((state) => state.gameMode);

  return (
    <div className="w-full h-full absolute top-0 left-0 bg-black -z-10">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <color attach="background" args={['#050510']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        
        <Suspense fallback={null}>
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          {gameMode === 'symphony' ? <SymphonyMode /> : <NotesSystem />}
          <Hands />
        </Suspense>
      </Canvas>
    </div>
  );
}
