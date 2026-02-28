/**
 * Audio Service
 * 
 * Provides optional sound effects for swipe interactions using Web Audio API.
 * Gracefully degrades if Web Audio API is unavailable.
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
 */

export type SoundEffect = 'swipe' | 'like' | 'pass';

export class AudioService {
  private context: AudioContext | null = null;
  private buffers: Map<SoundEffect, AudioBuffer> = new Map();
  private enabled: boolean = false; // Default to off per requirement 16.4
  private loading: boolean = false;

  /**
   * Checks if Web Audio API is supported
   */
  isSupported(): boolean {
    return typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
  }

  /**
   * Checks if audio is enabled in user preferences
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Sets whether audio is enabled
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    // Initialize context if enabling for the first time
    if (enabled && !this.context && this.isSupported()) {
      this.initializeContext();
    }
  }

  /**
   * Initializes the Audio Context
   */
  private initializeContext(): void {
    if (!this.isSupported()) {
      return;
    }

    try {
      const AudioContextClass = AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass();
    } catch (err) {
      console.error('Failed to initialize AudioContext:', err);
    }
  }

  /**
   * Loads a sound effect from a URL
   * Note: In a real implementation, you would provide actual audio file URLs
   * For now, this creates silent buffers as placeholders
   */
  async loadSound(name: SoundEffect, url: string): Promise<void> {
    if (!this.context) {
      return;
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.buffers.set(name, audioBuffer);
    } catch (err) {
      console.error(`Failed to load sound ${name}:`, err);
      // Create a silent buffer as fallback
      this.createSilentBuffer(name);
    }
  }

  /**
   * Creates a silent audio buffer as a fallback
   */
  private createSilentBuffer(name: SoundEffect): void {
    if (!this.context) {
      return;
    }

    // Create a very short silent buffer
    const buffer = this.context.createBuffer(1, this.context.sampleRate * 0.1, this.context.sampleRate);
    this.buffers.set(name, buffer);
  }

  /**
   * Plays a sound effect
   * Only plays if:
   * - Web Audio API is supported
   * - Audio is enabled in user preferences
   * - System audio is not muted (checked via context state)
   * 
   * @param name - The sound effect to play
   * @param volume - Volume level (0-1), default 1.0
   */
  play(name: SoundEffect, volume: number = 1.0): void {
    // Check if enabled
    if (!this.enabled) {
      return;
    }

    // Check if supported
    if (!this.context) {
      return;
    }

    // Check if context is suspended (system mute or autoplay policy)
    if (this.context.state === 'suspended') {
      // Try to resume context (may fail due to autoplay policy)
      this.context.resume().catch(() => {
        // Silently fail - user hasn't interacted yet
      });
      return;
    }

    // Get buffer
    const buffer = this.buffers.get(name);
    if (!buffer) {
      return;
    }

    try {
      // Create source and gain nodes
      const source = this.context.createBufferSource();
      const gainNode = this.context.createGain();

      source.buffer = buffer;
      gainNode.gain.value = Math.max(0, Math.min(1, volume));

      // Connect nodes
      source.connect(gainNode);
      gainNode.connect(this.context.destination);

      // Play
      source.start(0);
    } catch (err) {
      console.error(`Failed to play sound ${name}:`, err);
    }
  }

  /**
   * Preloads all sound effects
   * Note: In a real implementation, you would provide actual audio file URLs
   */
  async preloadSounds(): Promise<void> {
    if (this.loading || !this.isSupported()) {
      return;
    }

    this.loading = true;

    try {
      // Initialize context if not already done
      if (!this.context) {
        this.initializeContext();
      }

      // In a real implementation, these would be actual audio file URLs
      // For now, create silent buffers as placeholders
      this.createSilentBuffer('swipe');
      this.createSilentBuffer('like');
      this.createSilentBuffer('pass');
    } catch (err) {
      console.error('Failed to preload sounds:', err);
    } finally {
      this.loading = false;
    }
  }
}

// Singleton instance
export const audioService = new AudioService();
