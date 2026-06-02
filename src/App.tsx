import { useState } from 'react';
import { HandTracker } from './components/HandTracker';
import { Scene } from './components/Scene';
import { useStore } from './store';
import { audioSystem } from './systems/AudioSystem';
import { Play, Hand, Music, RotateCcw } from 'lucide-react';

export default function App() {
  const isAudioStarted = useStore((state) => state.isAudioStarted);
  const setAudioStarted = useStore((state) => state.setAudioStarted);
  const gameMode = useStore((state) => state.gameMode);
  const setGameMode = useStore((state) => state.setGameMode);
  const symphonyStatus = useStore((state) => state.symphonyStatus);
  const setSymphonyStatus = useStore((state) => state.setSymphonyStatus);
  const symphonyStats = useStore((state) => state.symphonyStats);
  
  const [showOverlay, setShowOverlay] = useState(true);

  const handleStart = async (mode: 'free' | 'symphony') => {
    await audioSystem.init();
    setAudioStarted(true);
    setGameMode(mode);
    setShowOverlay(false);
    if (mode === 'symphony') {
      setSymphonyStatus('playing');
    }
  };

  const handleRestart = () => {
    setSymphonyStatus('idle');
    setGameMode('free');
    setShowOverlay(true);
  };

  return (
    <div className="w-full h-screen relative overflow-hidden font-sans text-white">
      {/* 3D Scene */}
      <Scene />
      
      {/* Computer Vision (Hidden/Overlay) */}
      <HandTracker />

      {/* UI Overlay */}
      {showOverlay && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-1000">
          <h1 className="text-6xl font-thin tracking-widest mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 animate-pulse">
            FALLING NOTES
          </h1>
          <p className="text-xl text-gray-300 mb-12 font-light">
            Conduct a symphony of light with your hands
          </p>
          
          <div className="flex gap-6">
            <button 
              onClick={() => handleStart('free')}
              className="group relative px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(76,201,240,0.3)] flex items-center gap-3"
            >
              <Play className="w-5 h-5 fill-current" />
              <span className="tracking-wider">FREE PLAY</span>
            </button>

            <button 
              onClick={() => handleStart('symphony')}
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-white/30 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(247,37,133,0.3)] flex items-center gap-3"
            >
              <Music className="w-5 h-5" />
              <span className="tracking-wider">SYMPHONY MODE</span>
            </button>
          </div>

          <div className="mt-12 flex items-center gap-8 text-sm text-gray-400">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center">
                <Hand className="w-6 h-6" />
              </div>
              <span>Show Hands</span>
            </div>
            <div className="h-px w-12 bg-white/20"></div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center relative">
                 <div className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
              </div>
              <span>Pinch to Catch</span>
            </div>
          </div>
        </div>
      )}

      {/* Result Screen */}
      {gameMode === 'symphony' && symphonyStatus === 'finished' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-50 animate-in fade-in duration-1000">
           <h2 className="text-5xl font-light mb-8">Symphony Complete</h2>
           
           <button 
              onClick={handleRestart}
              className="px-8 py-3 bg-white text-black rounded-full hover:scale-105 transition-transform flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              Play Again
            </button>
        </div>
      )}

      {/* In-game minimal UI */}
      {!showOverlay && symphonyStatus !== 'finished' && (
        <div className="absolute bottom-8 left-0 w-full text-center pointer-events-none">
          <p className="text-white/30 text-sm tracking-widest uppercase">
            {gameMode === 'symphony' ? 'Catch the notes to play the song' : 'Pinch thumb & index to catch notes'}
          </p>
        </div>
      )}
    </div>
  );
}
