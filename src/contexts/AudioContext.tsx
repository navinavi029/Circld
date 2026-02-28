/**
 * Audio Context
 * 
 * Provides audio service throughout the application.
 * Manages user preferences for sound effects.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { audioService, SoundEffect } from '../services/audioService';

interface AudioContextValue {
  isSupported: boolean;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  play: (sound: SoundEffect, volume?: number) => void;
}

const AudioContext = createContext<AudioContextValue | undefined>(undefined);

const AUDIO_PREFERENCE_KEY = 'swipe_audio_enabled';

interface AudioProviderProps {
  children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [isEnabled, setIsEnabledState] = useState<boolean>(() => {
    // Load preference from localStorage, default to false per requirement 16.4
    const saved = localStorage.getItem(AUDIO_PREFERENCE_KEY);
    if (saved === null || saved === 'undefined') {
      return false;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return false;
    }
  });

  const isSupported = audioService.isSupported();

  // Sync preference with service and preload sounds
  useEffect(() => {
    audioService.setEnabled(isEnabled);
    
    // Preload sounds when enabled
    if (isEnabled) {
      audioService.preloadSounds();
    }
  }, [isEnabled]);

  const setEnabled = (enabled: boolean) => {
    setIsEnabledState(enabled);
    localStorage.setItem(AUDIO_PREFERENCE_KEY, JSON.stringify(enabled));
  };

  const play = (sound: SoundEffect, volume: number = 1.0) => {
    audioService.play(sound, volume);
  };

  const value: AudioContextValue = {
    isSupported,
    isEnabled,
    setEnabled,
    play,
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
