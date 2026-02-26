/**
 * Sound Effects System for Demo
 * 
 * Provides audio feedback for demo interactions using the Web Audio API.
 * Generates synthetic sounds to avoid external dependencies.
 * 
 * Sound types:
 * - swipe: Whoosh sound for card swipes
 * - like: Positive chime for successful matches
 * - notification: Alert tone for new notifications
 * - message: Subtle pop for message sends
 * - navigation: Click sound for navigation
 * - complete: Success fanfare for demo completion
 */

/**
 * Sound effect types available in the demo
 */
export type SoundEffectType = 
  | 'swipe'
  | 'like'
  | 'notification'
  | 'message'
  | 'navigation'
  | 'complete';

/**
 * Audio context singleton
 */
let audioContext: AudioContext | null = null;

/**
 * Get or create the audio context
 */
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

/**
 * Play a swipe sound effect (smooth swoosh with filter sweep)
 */
function playSwipeSound(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Create noise for swoosh texture
  const bufferSize = ctx.sampleRate * 0.4;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Generate pink noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize * 3);
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  
  // Create filter for swoosh effect
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(2000, now);
  filter.frequency.exponentialRampToValueAtTime(400, now + 0.4);
  filter.Q.value = 2;
  
  const gainNode = ctx.createGain();
  
  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  // Envelope
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.25, now + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
  
  noise.start(now);
  noise.stop(now + 0.4);
}

/**
 * Play a like sound effect (bright sparkle with harmonics)
 */
function playLikeSound(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Create multiple oscillators for rich harmonic content
  const frequencies = [
    { freq: 880, gain: 0.3 },   // A5
    { freq: 1108.73, gain: 0.25 }, // C#6
    { freq: 1318.51, gain: 0.2 },  // E6
    { freq: 1760, gain: 0.15 }     // A6
  ];
  
  frequencies.forEach(({ freq, gain }, index) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + index * 0.04);
    
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    
    // Staggered bell envelope
    const startTime = now + index * 0.04;
    oscGain.gain.setValueAtTime(0, startTime);
    oscGain.gain.linearRampToValueAtTime(gain, startTime + 0.01);
    oscGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
    
    osc.start(startTime);
    osc.stop(startTime + 0.6);
  });
}

/**
 * Play a notification sound effect (gentle marimba-like tone)
 */
function playNotificationSound(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Create two-note melody
  const notes = [
    { freq: 987.77, time: 0 },     // B5
    { freq: 1318.51, time: 0.12 }  // E6
  ];
  
  notes.forEach(({ freq, time }) => {
    // Fundamental
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 3; // Third harmonic for marimba-like tone
    
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    
    gain1.gain.value = 0.7;
    gain2.gain.value = 0.3;
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(gainNode);
    gain2.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const startTime = now + time;
    gainNode.gain.setValueAtTime(0.25, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
    
    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + 0.4);
    osc2.stop(startTime + 0.4);
  });
}

/**
 * Play a message sound effect (soft bubble pop)
 */
function playMessageSound(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Create filtered noise for bubble texture
  const bufferSize = ctx.sampleRate * 0.15;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  
  // High-pass filter for bubble character
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 800;
  filter.Q.value = 5;
  
  // Add a sine wave for tonal component
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
  
  const noiseGain = ctx.createGain();
  const oscGain = ctx.createGain();
  const masterGain = ctx.createGain();
  
  noise.connect(filter);
  filter.connect(noiseGain);
  osc.connect(oscGain);
  
  noiseGain.connect(masterGain);
  oscGain.connect(masterGain);
  masterGain.connect(ctx.destination);
  
  // Quick pop envelope
  noiseGain.gain.setValueAtTime(0.15, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  
  oscGain.gain.setValueAtTime(0.1, now);
  oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  
  masterGain.gain.setValueAtTime(0.8, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  
  noise.start(now);
  osc.start(now);
  noise.stop(now + 0.15);
  osc.stop(now + 0.15);
}

/**
 * Play a navigation sound effect (soft mechanical click)
 */
function playNavigationSound(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Create two oscillators for a more mechanical sound
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  
  osc1.type = 'square';
  osc2.type = 'square';
  
  osc1.frequency.setValueAtTime(220, now);
  osc2.frequency.setValueAtTime(330, now);
  
  const gain1 = ctx.createGain();
  const gain2 = ctx.createGain();
  const masterGain = ctx.createGain();
  
  osc1.connect(gain1);
  osc2.connect(gain2);
  gain1.connect(masterGain);
  gain2.connect(masterGain);
  masterGain.connect(ctx.destination);
  
  // Very short click with two phases
  gain1.gain.setValueAtTime(0.08, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
  
  gain2.gain.setValueAtTime(0.05, now + 0.01);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  
  masterGain.gain.setValueAtTime(1, now);
  masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  
  osc1.start(now);
  osc2.start(now + 0.01);
  osc1.stop(now + 0.05);
  osc2.stop(now + 0.05);
}

/**
 * Play a completion sound effect (triumphant ascending arpeggio)
 */
function playCompleteSound(): void {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Ascending major arpeggio with rich harmonics
  const notes = [
    { freq: 523.25, time: 0 },      // C5
    { freq: 659.25, time: 0.1 },    // E5
    { freq: 783.99, time: 0.2 },    // G5
    { freq: 1046.50, time: 0.3 }    // C6
  ];
  
  notes.forEach((note, index) => {
    // Fundamental
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc3.type = 'sine';
    
    osc1.frequency.value = note.freq;
    osc2.frequency.value = note.freq * 2; // Octave
    osc3.frequency.value = note.freq * 3; // Fifth above octave
    
    const gain1 = ctx.createGain();
    const gain2 = ctx.createGain();
    const gain3 = ctx.createGain();
    const masterGain = ctx.createGain();
    
    gain1.gain.value = 0.5;
    gain2.gain.value = 0.25;
    gain3.gain.value = 0.15;
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);
    
    gain1.connect(masterGain);
    gain2.connect(masterGain);
    gain3.connect(masterGain);
    masterGain.connect(ctx.destination);
    
    const startTime = now + note.time;
    const duration = index === notes.length - 1 ? 0.8 : 0.5;
    
    masterGain.gain.setValueAtTime(0, startTime);
    masterGain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
    masterGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    
    osc1.start(startTime);
    osc2.start(startTime);
    osc3.start(startTime);
    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
    osc3.stop(startTime + duration);
  });
}

/**
 * Play a sound effect by type
 * 
 * @param type - The type of sound effect to play
 * @param enabled - Whether sound effects are enabled (default: true)
 * 
 * @example
 * playSoundEffect('swipe');
 * playSoundEffect('like', soundEnabled);
 */
export function playSoundEffect(type: SoundEffectType, enabled: boolean = true): void {
  if (!enabled) return;
  
  try {
    switch (type) {
      case 'swipe':
        playSwipeSound();
        break;
      case 'like':
        playLikeSound();
        break;
      case 'notification':
        playNotificationSound();
        break;
      case 'message':
        playMessageSound();
        break;
      case 'navigation':
        playNavigationSound();
        break;
      case 'complete':
        playCompleteSound();
        break;
      default:
        console.warn(`Unknown sound effect type: ${type}`);
    }
  } catch (error) {
    console.error('Error playing sound effect:', error);
  }
}

/**
 * Resume audio context (required for some browsers after user interaction)
 */
export function resumeAudioContext(): void {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}
