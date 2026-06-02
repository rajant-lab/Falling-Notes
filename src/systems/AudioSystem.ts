import * as Tone from 'tone';

// Pentatonic scale for harmonious sounds
const SCALE_NOTES = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5'];
const BASS_NOTES = ['C2', 'G2', 'A2', 'F2'];

class AudioSystem {
  private synth: Tone.PolySynth;
  private bassSynth: Tone.Synth;
  private ambientPad: Tone.PolySynth;
  private reverb: Tone.Reverb;
  private delay: Tone.FeedbackDelay;
  private isInitialized: boolean = false;

  constructor() {
    // Harp/Piano-like synth
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "triangle"
      },
      envelope: {
        attack: 0.02,
        decay: 1.5,
        sustain: 0.2,
        release: 2
      },
      volume: -5
    });

    this.bassSynth = new Tone.Synth({
      oscillator: { type: "triangle" },
      envelope: { attack: 0.5, decay: 0.5, sustain: 0.5, release: 2 }
    });

    this.ambientPad = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 2, decay: 1, sustain: 0.8, release: 3 }
    });

    this.reverb = new Tone.Reverb({ decay: 8, wet: 0.5 });
    this.delay = new Tone.FeedbackDelay("8n.", 0.4);
    const chorus = new Tone.Chorus(4, 2.5, 0.5).start();

    // Chain effects
    this.synth.chain(chorus, this.delay, this.reverb, Tone.Destination);
    this.bassSynth.chain(this.reverb, Tone.Destination);
    this.ambientPad.connect(this.reverb); // Pad goes straight to reverb
  }

  async init() {
    if (this.isInitialized) return;
    await Tone.start();
    this.isInitialized = true;
    
    // Start ambient background loop
    this.startAmbientLoop();
  }

  startAmbientLoop() {
    const loop = new Tone.Loop((time) => {
      const note = BASS_NOTES[Math.floor(Math.random() * BASS_NOTES.length)];
      this.bassSynth.triggerAttackRelease(note, "1n", time, 0.4);
      
      // More frequent chords for a lush bed
      if (Math.random() > 0.4) {
        const chord = [
          SCALE_NOTES[Math.floor(Math.random() * 3)],
          SCALE_NOTES[Math.floor(Math.random() * 3) + 2],
          SCALE_NOTES[Math.floor(Math.random() * 3) + 4] || SCALE_NOTES[0]
        ];
        this.ambientPad.triggerAttackRelease(chord, "2n", time, 0.2);
      }
    }, "2n").start(0);
    
    Tone.Transport.start();
  }

  playNote(type: 'high' | 'low' | 'special') {
    if (!this.isInitialized) return;

    let note;
    if (type === 'high') {
      note = SCALE_NOTES[Math.floor(Math.random() * SCALE_NOTES.length)];
      this.synth.triggerAttackRelease(note, "8n", undefined, 0.5 + Math.random() * 0.5);
    } else if (type === 'low') {
      note = SCALE_NOTES[Math.floor(Math.random() * 4)]; // Lower part of scale
      this.synth.triggerAttackRelease(note, "4n", undefined, 0.6);
    } else {
      // Special - play a chord
      const rootIndex = Math.floor(Math.random() * (SCALE_NOTES.length - 2));
      const chord = [SCALE_NOTES[rootIndex], SCALE_NOTES[rootIndex + 2]];
      this.synth.triggerAttackRelease(chord, "2n", undefined, 0.8);
    }
  }

  playSpecificNote(note: string, duration: string = "8n") {
    if (!this.isInitialized) return;
    this.synth.triggerAttackRelease(note, duration);
  }
}

export const audioSystem = new AudioSystem();
