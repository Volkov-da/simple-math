import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { soundManager } from '../utils/sounds';

interface SoundContextType {
  isMuted: boolean;
  volume: number;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  playSound: (soundType: 'correct' | 'incorrect' | 'streak' | 'victory' | 'click') => Promise<void>;
  testSound: () => Promise<void>;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

interface SoundProviderProps {
  children: ReactNode;
}

export function SoundProvider({ children }: SoundProviderProps) {
  const [isMuted, setIsMutedState] = useState(false);
  const [volume, setVolumeState] = useState(0.5);

  useEffect(() => {
    // Load settings from sound manager
    setIsMutedState(soundManager.getMuted());
    setVolumeState(soundManager.getVolume());
  }, []);

  const setMuted = (muted: boolean) => {
    setIsMutedState(muted);
    soundManager.setMuted(muted);
  };

  const setVolume = (vol: number) => {
    setVolumeState(vol);
    soundManager.setVolume(vol);
  };

  const playSound = async (soundType: 'correct' | 'incorrect' | 'streak' | 'victory' | 'click') => {
    await soundManager.play(soundType);
  };

  const testSound = async () => {
    await soundManager.testSound('click');
  };

  return (
    <SoundContext.Provider value={{
      isMuted,
      volume,
      setMuted,
      setVolume,
      playSound,
      testSound
    }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}
