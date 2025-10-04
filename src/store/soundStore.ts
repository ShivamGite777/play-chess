import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type SoundType =
  | 'move'
  | 'capture'
  | 'castle'
  | 'check'
  | 'checkmate'
  | 'gameStart'
  | 'gameEnd'
  | 'timerTick'
  | 'click'
  | 'notification';

interface SoundState {
  isMuted: boolean;
  volume: number;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  playSound: (type: SoundType) => void;
}

const createSound = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  return () => {
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  };
};

const sounds: Record<SoundType, () => void> = {
  move: createSound(400, 0.1),
  capture: createSound(300, 0.15, 'square'),
  castle: createSound(500, 0.2),
  check: createSound(800, 0.3, 'triangle'),
  checkmate: () => {
    const play1 = createSound(600, 0.2);
    const play2 = createSound(800, 0.3);
    play1();
    setTimeout(play2, 100);
  },
  gameStart: () => {
    const play1 = createSound(523, 0.15);
    const play2 = createSound(659, 0.15);
    const play3 = createSound(784, 0.2);
    play1();
    setTimeout(play2, 150);
    setTimeout(play3, 300);
  },
  gameEnd: () => {
    const play1 = createSound(784, 0.2);
    const play2 = createSound(659, 0.2);
    const play3 = createSound(523, 0.3);
    play1();
    setTimeout(play2, 150);
    setTimeout(play3, 300);
  },
  timerTick: createSound(1000, 0.05, 'square', 0.2),
  click: createSound(600, 0.05, 'square', 0.1),
  notification: createSound(700, 0.2, 'sine', 0.25),
};

export const useSoundStore = create<SoundState>()(
  persist(
    (set, get) => ({
      isMuted: false,
      volume: 0.7,

      toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

      setVolume: (volume) => set({ volume }),

      playSound: (type) => {
        const { isMuted } = get();
        if (!isMuted && sounds[type]) {
          try {
            sounds[type]();
          } catch (error) {
            console.error('Error playing sound:', error);
          }
        }
      },
    }),
    {
      name: 'sound-storage',
    }
  )
);
