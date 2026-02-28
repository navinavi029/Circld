/**
 * Haptic Feedback Service
 * 
 * Provides tactile feedback on mobile devices using the Vibration API.
 * Gracefully degrades on unsupported devices.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

export type HapticPattern = 'light' | 'medium' | 'success';

interface HapticPatternDefinition {
  light: number[];
  medium: number[];
  success: number[];
}

const HAPTIC_PATTERNS: HapticPatternDefinition = {
  light: [10],           // Quick tap - threshold reached
  medium: [20],          // Stronger tap - swipe completed
  success: [10, 50, 10], // Pattern - trade offer created
};

export class HapticService {
  private enabled: boolean = true;

  /**
   * Checks if the Vibration API is supported by the device
   */
  isSupported(): boolean {
    return 'vibrate' in navigator;
  }

  /**
   * Checks if haptic feedback is enabled in user preferences
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Sets whether haptic feedback is enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Triggers a haptic vibration pattern
   * Only vibrates if:
   * - Device supports Vibration API
   * - User has haptics enabled in preferences
   * 
   * @param pattern - The haptic pattern to trigger
   */
  trigger(pattern: HapticPattern): void {
    // Check if supported
    if (!this.isSupported()) {
      return;
    }

    // Check if enabled in user preferences
    if (!this.enabled) {
      return;
    }

    // Trigger vibration
    const vibrationPattern = HAPTIC_PATTERNS[pattern];
    navigator.vibrate(vibrationPattern);
  }

  /**
   * Cancels any ongoing vibration
   */
  cancel(): void {
    if (this.isSupported()) {
      navigator.vibrate(0);
    }
  }
}

// Singleton instance
export const hapticService = new HapticService();
