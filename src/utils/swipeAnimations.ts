/**
 * Swipe Animation Utilities
 * 
 * Provides animation calculation functions for swipe gestures.
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.6
 */

import { animationConfig } from '../config/animationConfig';

/**
 * Calculates rotation based on drag distance
 * Rotation is proportional to horizontal drag distance
 * 
 * @param deltaX - Horizontal drag distance in pixels
 * @returns Rotation in degrees
 */
export function calculateRotation(deltaX: number): number {
  return deltaX * animationConfig.swipe.rotationFactor;
}

/**
 * Calculates opacity based on drag distance
 * Opacity fades gradually as card is dragged
 * 
 * @param deltaX - Horizontal drag distance in pixels
 * @returns Opacity value between 0.5 and 1
 */
export function calculateDragOpacity(deltaX: number): number {
  return Math.max(0.5, 1 - Math.abs(deltaX) / 300);
}

/**
 * Calculates overlay opacity based on drag distance
 * Overlay appears after threshold and increases proportionally
 * 
 * @param deltaX - Horizontal drag distance in pixels
 * @returns Opacity value between 0 and maxOpacity
 */
export function calculateOverlayOpacity(deltaX: number): number {
  const { threshold, maxOpacity } = animationConfig.overlay;
  
  if (Math.abs(deltaX) < threshold) {
    return 0;
  }
  
  const progress = (Math.abs(deltaX) - threshold) / 50;
  return Math.min(progress, maxOpacity);
}

/**
 * Determines if overlay should be visible
 * 
 * @param deltaX - Horizontal drag distance in pixels
 * @returns Object with overlay visibility and type
 */
export function getOverlayState(deltaX: number): {
  visible: boolean;
  type: 'like' | 'pass' | null;
  opacity: number;
} {
  const { threshold } = animationConfig.overlay;
  
  if (deltaX > threshold) {
    return {
      visible: true,
      type: 'like',
      opacity: calculateOverlayOpacity(deltaX),
    };
  }
  
  if (deltaX < -threshold) {
    return {
      visible: true,
      type: 'pass',
      opacity: calculateOverlayOpacity(deltaX),
    };
  }
  
  return {
    visible: false,
    type: null,
    opacity: 0,
  };
}

/**
 * Calculates velocity from drag state
 * 
 * @param deltaX - Horizontal drag distance in pixels
 * @param deltaTime - Time elapsed in milliseconds
 * @returns Velocity in pixels per millisecond
 */
export function calculateVelocity(deltaX: number, deltaTime: number): number {
  if (deltaTime === 0) return 0;
  return Math.abs(deltaX) / deltaTime;
}

/**
 * Determines if swipe should complete based on distance or velocity
 * 
 * @param deltaX - Horizontal drag distance in pixels
 * @param velocity - Swipe velocity in pixels per millisecond
 * @returns True if swipe should complete
 */
export function shouldCompleteSwipe(deltaX: number, velocity: number): boolean {
  const { threshold, velocityThreshold } = animationConfig.swipe;
  
  // Complete if distance threshold is met
  if (Math.abs(deltaX) >= threshold) {
    return true;
  }
  
  // Complete if velocity threshold is met (Requirement 8.1)
  if (velocity >= velocityThreshold) {
    return true;
  }
  
  return false;
}

/**
 * Gets spring animation config for card return
 * Used when swipe is cancelled
 */
export function getReturnSpringConfig() {
  return animationConfig.swipe.springConfig;
}

/**
 * Gets exit animation duration
 */
export function getExitDuration(): number {
  return animationConfig.swipe.exitDuration;
}

/**
 * Gets entrance animation config
 */
export function getEntranceConfig() {
  return animationConfig.entrance;
}
