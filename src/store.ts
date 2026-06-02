import { create } from 'zustand';
import { Vector3 } from 'three';

export interface HandData {
  left: {
    present: boolean;
    pinch: boolean;
    position: Vector3; // World position
    raw: any; // Raw landmarks if needed
  };
  right: {
    present: boolean;
    pinch: boolean;
    position: Vector3;
    raw: any;
  };
}

interface AppState {
  handData: HandData;
  setHandData: (data: Partial<HandData>) => void;
  score: number;
  incrementScore: () => void;
  isAudioStarted: boolean;
  setAudioStarted: (started: boolean) => void;
  gameMode: 'free' | 'symphony';
  setGameMode: (mode: 'free' | 'symphony') => void;
  symphonyStatus: 'idle' | 'playing' | 'finished';
  setSymphonyStatus: (status: 'idle' | 'playing' | 'finished') => void;
  symphonyStats: { total: number; caught: number };
  resetSymphonyStats: () => void;
  incrementSymphonyCaught: () => void;
  setSymphonyTotal: (total: number) => void;
}

export const useStore = create<AppState>((set) => ({
  handData: {
    left: { present: false, pinch: false, position: new Vector3(-2, 0, 0), raw: null },
    right: { present: false, pinch: false, position: new Vector3(2, 0, 0), raw: null },
  },
  setHandData: (data) => set((state) => ({ handData: { ...state.handData, ...data } })),
  score: 0,
  incrementScore: () => set((state) => ({ score: state.score + 1 })),
  isAudioStarted: false,
  setAudioStarted: (started) => set({ isAudioStarted: started }),
  gameMode: 'free',
  setGameMode: (mode) => set({ gameMode: mode }),
  symphonyStatus: 'idle',
  setSymphonyStatus: (status) => set({ symphonyStatus: status }),
  symphonyStats: { total: 0, caught: 0 },
  resetSymphonyStats: () => set({ symphonyStats: { total: 0, caught: 0 } }),
  incrementSymphonyCaught: () => set((state) => ({ symphonyStats: { ...state.symphonyStats, caught: state.symphonyStats.caught + 1 } })),
  setSymphonyTotal: (total) => set((state) => ({ symphonyStats: { ...state.symphonyStats, total } })),
}));
