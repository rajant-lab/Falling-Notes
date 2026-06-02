export interface SongNote {
  time: number; // Time in seconds when the note should be caught (hit line)
  note: string; // Pitch (e.g., 'C4')
  duration: string; // Duration (e.g., '4n')
}

// Happy Birthday Melody
// G4 G4 A4 G4 C5 B4
// G4 G4 A4 G4 D5 C5
// G4 G4 G5 E5 C5 B4 A4
// F5 F5 E5 C5 D5 C5

const START_DELAY = 2.0; // Seconds before first note reaches bottom
const SPEED = 2.0; // Units per second falling speed

export const HAPPY_BIRTHDAY: SongNote[] = [
  { time: 0, note: 'G4', duration: '4n' },
  { time: 0.5, note: 'G4', duration: '4n' },
  { time: 1.0, note: 'A4', duration: '2n' },
  { time: 2.0, note: 'G4', duration: '2n' },
  { time: 3.0, note: 'C5', duration: '2n' },
  { time: 4.0, note: 'B4', duration: '1n' },

  { time: 6.0, note: 'G4', duration: '4n' },
  { time: 6.5, note: 'G4', duration: '4n' },
  { time: 7.0, note: 'A4', duration: '2n' },
  { time: 8.0, note: 'G4', duration: '2n' },
  { time: 9.0, note: 'D5', duration: '2n' },
  { time: 10.0, note: 'C5', duration: '1n' },

  { time: 12.0, note: 'G4', duration: '4n' },
  { time: 12.5, note: 'G4', duration: '4n' },
  { time: 13.0, note: 'G5', duration: '2n' },
  { time: 14.0, note: 'E5', duration: '2n' },
  { time: 15.0, note: 'C5', duration: '2n' },
  { time: 16.0, note: 'B4', duration: '2n' },
  { time: 17.0, note: 'A4', duration: '2n' },

  { time: 19.0, note: 'F5', duration: '4n' },
  { time: 19.5, note: 'F5', duration: '4n' },
  { time: 20.0, note: 'E5', duration: '2n' },
  { time: 21.0, note: 'C5', duration: '2n' },
  { time: 22.0, note: 'D5', duration: '2n' },
  { time: 23.0, note: 'C5', duration: '1n' },
].map(n => ({
  ...n,
  time: n.time * 0.8 + START_DELAY // Adjust tempo and add start delay
}));
