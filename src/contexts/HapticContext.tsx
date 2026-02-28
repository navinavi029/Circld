/**
 * Haptic Context
 * 
 * Provides haptic feedback service throughout the application.
 * Manages user preferences for haptic feedback.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { hapticService, HapticPattern } from '../services/hapticService';

interface HapticContextValue {
  isSupported: boolean;
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  trigger: (pattern: HapticPattern) => void;
}

const HapticContext = createContext<HapticContextValue | undefined>(undefined);

const HAPTIC_PREFERENCE_KEY = 'swipe_haptic_enabled';

interface HapticProviderProps {
  children: ReactNode;
}

export function HapticProvider({ children }: HapticProviderProps) {
  const [isEnabled, setIsEnabledState] = useState<boolean>(() => {
    // Load preference from localStorage, default to true
    const saved = localStorage.getItem(HAPTIC_PREFERENCE_KEY);
    if (saved === null || saved === 'undefined') {
      return true;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return true;
    }
  });

  const isSupported = hapticService.isSupported();

  // Sync preference with service
  useEffect(() => {
    hapticService.setEnabled(isEnabled);
  }, [isEnabled]);

  const setEnabled = (enabled: boolean) => {
    setIsEnabledState(enabled);
    localStorage.setItem(HAPTIC_PREFERENCE_KEY, JSON.stringify(enabled));
  };

  const trigger = (pattern: HapticPattern) => {
    hapticService.trigger(pattern);
  };

  const value: HapticContextValue = {
    isSupported,
    isEnabled,
    setEnabled,
    trigger,
  };

  return (
    <HapticContext.Provider value={value}>
      {children}
    </HapticContext.Provider>
  );
}

export function useHaptic(): HapticContextValue {
  const context = useContext(HapticContext);
  if (context === undefined) {
    throw new Error('useHaptic must be used within a HapticProvider');
  }
  return context;
}
