import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { Vector3, Color } from 'three';
import { useStore } from '../store';
import { audioSystem } from '../systems/AudioSystem';
import { v4 as uuidv4 } from 'uuid';

// --- Song Data Configuration ---
const BEAT = 0.6; // Seconds per beat
const SPAWN_HEIGHT = 8;
const FALL_SPEED = 2.0;
const TRAVEL_TIME = SPAWN_HEIGHT / FALL_SPEED; // Time to reach y=0

const NOTE_COLORS: Record<string, string> = {
  'C4': '#ff0000', // Red
  'D4': '#ff7f00', // Orange
  'E4': '#ffff00', // Yellow
  'F4': '#00ff00', // Green
  'G4': '#0000ff', // Blue
  'A4': '#4b0082', // Indigo
  'B4': '#9400d3', // Violet
};

const NOTE_X_POS: Record<string, number> = {
  'C4': -5,
  'D4': -3,
  'E4': -1,
  'F4': 1,
  'G4': 3,
  'A4': 5,
};

const MELODY = [
  // Line 1
  { note: 'C4', dur: '4n' }, { note: 'C4', dur: '4n' }, { note: 'G4', dur: '4n' }, { note: 'G4', dur: '4n' }, { note: 'A4', dur: '4n' }, { note: 'A4', dur: '4n' }, { note: 'G4', dur: '2n' },
  // Line 2
  { note: 'F4', dur: '4n' }, { note: 'F4', dur: '4n' }, { note: 'E4', dur: '4n' }, { note: 'E4', dur: '4n' }, { note: 'D4', dur: '4n' }, { note: 'D4', dur: '4n' }, { note: 'C4', dur: '2n' },
  // Line 3
  { note: 'G4', dur: '4n' }, { note: 'G4', dur: '4n' }, { note: 'F4', dur: '4n' }, { note: 'F4', dur: '4n' }, { note: 'E4', dur: '4n' }, { note: 'E4', dur: '4n' }, { note: 'D4', dur: '2n' },
  // Line 4
  { note: 'G4', dur: '4n' }, { note: 'G4', dur: '4n' }, { note: 'F4', dur: '4n' }, { note: 'F4', dur: '4n' }, { note: 'E4', dur: '4n' }, { note: 'E4', dur: '4n' }, { note: 'D4', dur: '2n' },
  // Line 5 (Repeat 1)
  { note: 'C4', dur: '4n' }, { note: 'C4', dur: '4n' }, { note: 'G4', dur: '4n' }, { note: 'G4', dur: '4n' }, { note: 'A4', dur: '4n' }, { note: 'A4', dur: '4n' }, { note: 'G4', dur: '2n' },
  // Line 6 (Repeat 2)
  { note: 'F4', dur: '4n' }, { note: 'F4', dur: '4n' }, { note: 'E4', dur: '4n' }, { note: 'E4', dur: '4n' }, { note: 'D4', dur: '4n' }, { note: 'D4', dur: '4n' }, { note: 'C4', dur: '2n' },
];

// Pre-calculate spawn times
let accumulatedTime = 2.0; // Start delay
const SONG_EVENTS = MELODY.map(m => {
  const hitTime = accumulatedTime;
  accumulatedTime += (m.dur === '2n' ? 2 : 1) * BEAT;
  return {
    ...m,
    hitTime,
    spawnTime: hitTime - TRAVEL_TIME
  };
});

interface NoteProps {
  id: string;
  position: Vector3;
  noteValue: string;
  duration: string;
  color: Color;
  onCatch: (id: string, noteValue: string, duration: string) => void;
}

const Note = ({ id, position, noteValue, duration, color, onCatch }: NoteProps) => {
  const meshRef = useRef<any>(null);
  const [caught, setCaught] = useState(false);
  const [scale, setScale] = useState(1);

  useFrame((state, delta) => {
    if (caught) {
      if (scale > 0) {
        setScale(s => Math.max(0, s - delta * 5));
      }
      return;
    }

    if (meshRef.current) {
      // Fall down
      meshRef.current.position.y -= FALL_SPEED * delta;
      
      // Check collision with hands
      const handData = useStore.getState().handData;
      const checkHand = (hand: any) => {
        if (hand.present && hand.pinch) {
          const dist = meshRef.current.position.distanceTo(hand.position);
          
          // Magnet effect
          if (dist < 3.0) {
             const direction = hand.position.clone().sub(meshRef.current.position).normalize();
             const pullStrength = (3.0 - dist) * 4.0 * delta; 
             meshRef.current.position.add(direction.multiplyScalar(pullStrength));
          }

          if (dist < 1.2) {
            setCaught(true);
            onCatch(id, noteValue, duration);
          }
        }
      };

      checkHand(handData.left);
      checkHand(handData.right);

      // Remove if too low
      if (meshRef.current.position.y < -6) {
        // Missed note - silent remove
        // We could trigger a "miss" sound or effect here
        onCatch(id, '', ''); 
      }
    }
  });

  if (scale <= 0) return null;

  return (
    <group position={position} ref={meshRef} scale={scale}>
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <mesh>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={2} 
            toneMapped={false}
          />
        </mesh>
        <pointLight color={color} distance={4} intensity={3} />
      </Float>
    </group>
  );
};

export function NotesSystem() {
  const [notes, setNotes] = useState<any[]>([]);
  const songIndex = useRef(0);
  const incrementScore = useStore(s => s.incrementScore);
  const isAudioStarted = useStore(s => s.isAudioStarted);

  useFrame((state) => {
    if (!isAudioStarted) return;

    const time = state.clock.elapsedTime;

    // Check if we need to spawn the next note
    if (songIndex.current < SONG_EVENTS.length) {
      const event = SONG_EVENTS[songIndex.current];
      
      if (time >= event.spawnTime) {
        const x = NOTE_X_POS[event.note] || 0;
        const y = SPAWN_HEIGHT;
        const z = 0; // Keep on plane for melody

        const newNote = {
          id: uuidv4(),
          position: new Vector3(x, y, z),
          noteValue: event.note,
          duration: event.dur,
          color: new Color(NOTE_COLORS[event.note] || '#ffffff')
        };

        setNotes(prev => [...prev, newNote]);
        songIndex.current++;
      }
    }
  });

  const handleCatch = (id: string, noteValue: string, duration: string) => {
    if (noteValue) {
        audioSystem.playSpecificNote(noteValue, duration);
        incrementScore();
    }
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <>
      {notes.map(note => (
        <Note 
          key={note.id} 
          {...note} 
          onCatch={handleCatch} 
        />
      ))}
    </>
  );
}
