import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Color } from 'three';
import { useStore } from '../store';
import { audioSystem } from '../systems/AudioSystem';
import { v4 as uuidv4 } from 'uuid';
import { HAPPY_BIRTHDAY, SongNote } from '../data/songs';
import { Explosion } from './Effects';

// Map pitch to X position (-5 to 5)
const getXForNote = (note: string): number => {
  const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const octave = parseInt(note.slice(-1));
  const pitch = note.slice(0, -1);
  const noteIndex = notes.indexOf(pitch);
  
  // Base value: C4 = 0
  // C4 is index 0, octave 4.
  // G5 is index 4, octave 5.
  
  const absValue = (octave - 4) * 7 + noteIndex;
  // Range in song is roughly G3 (-3) to G5 (+11)
  // Let's center around C5 (index 7)
  
  return (absValue - 7) * 0.8; 
};

const Note = ({ id, position, color, onCatch }: { id: string, position: Vector3, color: Color, onCatch: (id: string, pos: Vector3) => void }) => {
  const meshRef = useRef<any>(null);
  const [caught, setCaught] = useState(false);
  const [scale, setScale] = useState(1);

  useFrame((state, delta) => {
    if (caught) {
      if (scale > 0) setScale(s => Math.max(0, s - delta * 5));
      return;
    }

    if (meshRef.current) {
      // Fall down
      meshRef.current.position.y -= 1.5 * delta; // Constant speed for rhythm

      // Check collision
      const handData = useStore.getState().handData;
      const checkHand = (hand: any) => {
        if (hand.present && hand.pinch) {
          const dist = meshRef.current.position.distanceTo(hand.position);
          
          if (dist < 4.0) {
             const direction = hand.position.clone().sub(meshRef.current.position).normalize();
             const pullStrength = (4.0 - dist) * 2.0 * delta; 
             meshRef.current.position.add(direction.multiplyScalar(pullStrength));
          }

          if (dist < 1.5) {
            setCaught(true);
            onCatch(id, meshRef.current.position.clone());
          }
        }
      };

      checkHand(handData.left);
      checkHand(handData.right);

      if (meshRef.current.position.y < -6) {
        onCatch(id, new Vector3(0, -100, 0)); // Missed
      }
    }
  });

  if (scale <= 0) return null;

  return (
    <group position={position} ref={meshRef} scale={scale}>
      <mesh>
        <icosahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <pointLight color={color} distance={4} intensity={3} />
    </group>
  );
};

export function SymphonyMode() {
  const [notes, setNotes] = useState<any[]>([]);
  const [explosions, setExplosions] = useState<{id: string, position: Vector3, color: Color}[]>([]);
  const songStartTime = useRef<number>(-1);
  const nextNoteIndex = useRef(0);
  
  const { 
    setSymphonyStatus, 
    resetSymphonyStats, 
    incrementSymphonyCaught, 
    setSymphonyTotal 
  } = useStore();

  useEffect(() => {
    resetSymphonyStats();
    setSymphonyTotal(HAPPY_BIRTHDAY.length);
    setSymphonyStatus('playing');
    songStartTime.current = -1;
    nextNoteIndex.current = 0;
  }, []);

  useFrame((state) => {
    if (songStartTime.current === -1) {
      songStartTime.current = state.clock.elapsedTime;
    }

    const time = state.clock.elapsedTime - songStartTime.current;

    // Spawn notes
    if (nextNoteIndex.current < HAPPY_BIRTHDAY.length) {
      const nextNote = HAPPY_BIRTHDAY[nextNoteIndex.current];
      // Spawn slightly earlier so it arrives at catch line (y=0) at 'time'
      // If speed is 1.5 and start Y is 7, it takes 7/1.5 = 4.66s to fall.
      // So we spawn at time = note.time - 4.66
      // Actually, let's just spawn it when time >= note.time and have it fall.
      // The user catches it "in rhythm" visually.
      
      if (time >= nextNote.time) {
        const x = getXForNote(nextNote.note);
        const newNote = {
          id: uuidv4(),
          position: new Vector3(x, 7, 0),
          data: nextNote,
          color: new Color(`hsl(${Math.random() * 360}, 100%, 70%)`)
        };
        setNotes(prev => [...prev, newNote]);
        nextNoteIndex.current++;
      }
    } else if (notes.length === 0) {
      // Song finished
      // Wait a bit then show results
      if (time > HAPPY_BIRTHDAY[HAPPY_BIRTHDAY.length - 1].time + 5) {
         useStore.getState().setSymphonyStatus('finished');
      }
    }
  });

  const handleCatch = (id: string, pos: Vector3) => {
    const noteObj = notes.find(n => n.id === id);
    if (noteObj) {
      if (pos.y > -50) { // Caught
        audioSystem.playSpecificNote(noteObj.data.note, noteObj.data.duration);
        incrementSymphonyCaught();
        setExplosions(prev => [...prev, { id: uuidv4(), position: pos, color: noteObj.color }]);
      }
    }
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const removeExplosion = (id: string) => {
    setExplosions(prev => prev.filter(e => e.id !== id));
  };

  return (
    <>
      {notes.map(note => (
        <Note 
          key={note.id} 
          id={note.id}
          position={note.position}
          color={note.color}
          onCatch={handleCatch} 
        />
      ))}
      {explosions.map(e => (
        <Explosion 
          key={e.id} 
          position={e.position} 
          color={e.color} 
          onComplete={() => removeExplosion(e.id)} 
        />
      ))}
    </>
  );
}
