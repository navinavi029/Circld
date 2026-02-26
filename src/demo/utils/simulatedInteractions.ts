/**
 * Simulated Interaction System
 * 
 * Provides functions to execute simulated user interactions for the demo flow.
 * Each function accepts delay, duration, and callback parameters, and returns
 * a cleanup function to cancel ongoing animations.
 * 
 * All interactions use setTimeout for delay and CSS transitions/Framer Motion
 * for animations, ensuring they complete within 2000ms.
 * 
 * Includes sound effects for enhanced user feedback.
 * 
 * Requirements: 3.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { playSoundEffect } from './soundEffects';

/**
 * Options for simulated interactions
 */
export interface SimulatedInteractionOptions {
  /** Delay in milliseconds before starting the interaction */
  delay: number;
  /** Duration in milliseconds for the interaction animation */
  duration: number;
  /** Callback function to execute when the interaction completes */
  onComplete?: () => void;
}

/**
 * Cleanup function type returned by all simulated interactions
 */
export type CleanupFunction = () => void;

/**
 * Execute a swipe simulation (animate card swipe right)
 * 
 * Animates a card element to swipe right off the screen.
 * Uses CSS transforms for smooth animation.
 * 
 * @param element - The DOM element to animate (typically a card)
 * @param options - Interaction options (delay, duration, callback)
 * @returns Cleanup function to cancel the animation
 * 
 * @example
 * const cleanup = executeSwipeSimulation(cardElement, {
 *   delay: 2000,
 *   duration: 800,
 *   onComplete: () => console.log('Swipe complete')
 * });
 */
export function executeSwipeSimulation(
  element: HTMLElement | null,
  options: SimulatedInteractionOptions
): CleanupFunction {
  const { delay, duration, onComplete } = options;
  
  let delayTimeout: NodeJS.Timeout | null = null;
  let animationTimeout: NodeJS.Timeout | null = null;
  let isCancelled = false;

  if (!element) {
    console.warn('executeSwipeSimulation: No element provided');
    return () => {};
  }

  // Start the animation after the delay
  delayTimeout = setTimeout(() => {
    if (isCancelled) return;

    // Play swipe sound
    playSoundEffect('swipe');

    // Apply swipe animation styles
    element.style.transition = `transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1), opacity ${duration}ms ease-out`;
    element.style.transform = 'translateX(150%) rotate(20deg)';
    element.style.opacity = '0';

    // Play like sound after a brief delay
    setTimeout(() => {
      if (!isCancelled) {
        playSoundEffect('like');
      }
    }, duration * 0.3);

    // Call onComplete after animation finishes
    animationTimeout = setTimeout(() => {
      if (isCancelled) return;
      onComplete?.();
    }, duration);
  }, delay);

  // Return cleanup function
  return () => {
    isCancelled = true;
    if (delayTimeout) clearTimeout(delayTimeout);
    if (animationTimeout) clearTimeout(animationTimeout);
    
    // Reset element styles if it still exists
    if (element) {
      element.style.transition = '';
      element.style.transform = '';
      element.style.opacity = '';
    }
  };
}

/**
 * Execute a notification appear simulation (fade in animation)
 * 
 * Animates a notification element to fade in from the top.
 * Uses CSS opacity and transform for smooth animation.
 * 
 * @param element - The DOM element to animate (typically a notification)
 * @param options - Interaction options (delay, duration, callback)
 * @returns Cleanup function to cancel the animation
 * 
 * @example
 * const cleanup = executeNotificationAppearSimulation(notificationElement, {
 *   delay: 1500,
 *   duration: 600,
 *   onComplete: () => console.log('Notification appeared')
 * });
 */
export function executeNotificationAppearSimulation(
  element: HTMLElement | null,
  options: SimulatedInteractionOptions
): CleanupFunction {
  const { delay, duration, onComplete } = options;
  
  let delayTimeout: NodeJS.Timeout | null = null;
  let animationTimeout: NodeJS.Timeout | null = null;
  let isCancelled = false;

  if (!element) {
    console.warn('executeNotificationAppearSimulation: No element provided');
    return () => {};
  }

  // Set initial state (hidden)
  element.style.opacity = '0';
  element.style.transform = 'translateY(-20px)';

  // Start the animation after the delay
  delayTimeout = setTimeout(() => {
    if (isCancelled) return;

    // Play notification sound
    playSoundEffect('notification');

    // Apply fade-in animation styles
    element.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';

    // Call onComplete after animation finishes
    animationTimeout = setTimeout(() => {
      if (isCancelled) return;
      onComplete?.();
    }, duration);
  }, delay);

  // Return cleanup function
  return () => {
    isCancelled = true;
    if (delayTimeout) clearTimeout(delayTimeout);
    if (animationTimeout) clearTimeout(animationTimeout);
    
    // Reset element styles if it still exists
    if (element) {
      element.style.transition = '';
      element.style.transform = '';
      element.style.opacity = '';
    }
  };
}

/**
 * Execute a message send simulation (typing indicator + message appear)
 * 
 * Simulates a message being sent by:
 * 1. Showing a typing indicator
 * 2. Hiding the typing indicator
 * 3. Fading in the new message
 * 
 * @param typingIndicatorElement - The typing indicator element
 * @param messageElement - The message element to appear
 * @param options - Interaction options (delay, duration, callback)
 * @returns Cleanup function to cancel the animation
 * 
 * @example
 * const cleanup = executeMessageSendSimulation(typingElement, messageElement, {
 *   delay: 2500,
 *   duration: 1000,
 *   onComplete: () => console.log('Message sent')
 * });
 */
export function executeMessageSendSimulation(
  typingIndicatorElement: HTMLElement | null,
  messageElement: HTMLElement | null,
  options: SimulatedInteractionOptions
): CleanupFunction {
  const { delay, duration, onComplete } = options;
  
  let delayTimeout: NodeJS.Timeout | null = null;
  let typingTimeout: NodeJS.Timeout | null = null;
  let messageTimeout: NodeJS.Timeout | null = null;
  let completeTimeout: NodeJS.Timeout | null = null;
  let isCancelled = false;

  if (!typingIndicatorElement && !messageElement) {
    console.warn('executeMessageSendSimulation: No elements provided');
    return () => {};
  }

  // Hide message initially
  if (messageElement) {
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateY(10px)';
  }

  // Start the animation after the delay
  delayTimeout = setTimeout(() => {
    if (isCancelled) return;

    // Phase 1: Show typing indicator (60% of duration)
    const typingDuration = Math.floor(duration * 0.6);
    const messageDuration = Math.floor(duration * 0.4);

    if (typingIndicatorElement) {
      typingIndicatorElement.style.display = 'block';
      typingIndicatorElement.style.opacity = '1';
    }

    // Phase 2: Hide typing indicator and show message
    typingTimeout = setTimeout(() => {
      if (isCancelled) return;

      // Hide typing indicator
      if (typingIndicatorElement) {
        typingIndicatorElement.style.opacity = '0';
        typingIndicatorElement.style.transition = 'opacity 200ms ease-out';
      }

      // Show message with fade-in
      messageTimeout = setTimeout(() => {
        if (isCancelled) return;

        if (typingIndicatorElement) {
          typingIndicatorElement.style.display = 'none';
        }

        // Play message sound
        playSoundEffect('message');

        if (messageElement) {
          messageElement.style.transition = `opacity ${messageDuration}ms ease-out, transform ${messageDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
          messageElement.style.opacity = '1';
          messageElement.style.transform = 'translateY(0)';
        }

        // Call onComplete after message appears
        completeTimeout = setTimeout(() => {
          if (isCancelled) return;
          onComplete?.();
        }, messageDuration);
      }, 200); // Brief delay for typing indicator to fade out
    }, typingDuration);
  }, delay);

  // Return cleanup function
  return () => {
    isCancelled = true;
    if (delayTimeout) clearTimeout(delayTimeout);
    if (typingTimeout) clearTimeout(typingTimeout);
    if (messageTimeout) clearTimeout(messageTimeout);
    if (completeTimeout) clearTimeout(completeTimeout);
    
    // Reset element styles if they still exist
    if (typingIndicatorElement) {
      typingIndicatorElement.style.transition = '';
      typingIndicatorElement.style.display = '';
      typingIndicatorElement.style.opacity = '';
    }
    if (messageElement) {
      messageElement.style.transition = '';
      messageElement.style.transform = '';
      messageElement.style.opacity = '';
    }
  };
}

/**
 * Execute a button click simulation (button press animation)
 * 
 * Simulates a button being clicked with a press-and-release animation.
 * Uses CSS transform scale for the press effect.
 * 
 * @param element - The DOM element to animate (typically a button)
 * @param options - Interaction options (delay, duration, callback)
 * @returns Cleanup function to cancel the animation
 * 
 * @example
 * const cleanup = executeButtonClickSimulation(buttonElement, {
 *   delay: 2000,
 *   duration: 500,
 *   onComplete: () => console.log('Button clicked')
 * });
 */
export function executeButtonClickSimulation(
  element: HTMLElement | null,
  options: SimulatedInteractionOptions
): CleanupFunction {
  const { delay, duration, onComplete } = options;
  
  let delayTimeout: NodeJS.Timeout | null = null;
  let pressTimeout: NodeJS.Timeout | null = null;
  let releaseTimeout: NodeJS.Timeout | null = null;
  let isCancelled = false;

  if (!element) {
    console.warn('executeButtonClickSimulation: No element provided');
    return () => {};
  }

  // Start the animation after the delay
  delayTimeout = setTimeout(() => {
    if (isCancelled) return;

    // Phase 1: Press down (40% of duration)
    const pressDuration = Math.floor(duration * 0.4);
    const releaseDuration = Math.floor(duration * 0.6);

    element.style.transition = `transform ${pressDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    element.style.transform = 'scale(0.95)';

    // Phase 2: Release (60% of duration)
    pressTimeout = setTimeout(() => {
      if (isCancelled) return;

      element.style.transition = `transform ${releaseDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      element.style.transform = 'scale(1)';

      // Call onComplete after release animation finishes
      releaseTimeout = setTimeout(() => {
        if (isCancelled) return;
        onComplete?.();
      }, releaseDuration);
    }, pressDuration);
  }, delay);

  // Return cleanup function
  return () => {
    isCancelled = true;
    if (delayTimeout) clearTimeout(delayTimeout);
    if (pressTimeout) clearTimeout(pressTimeout);
    if (releaseTimeout) clearTimeout(releaseTimeout);
    
    // Reset element styles if it still exists
    if (element) {
      element.style.transition = '';
      element.style.transform = '';
    }
  };
}

/**
 * Validate that interaction timing is within acceptable limits
 * 
 * Ensures that delay + duration does not exceed 2000ms as per requirements.
 * 
 * @param delay - Delay in milliseconds
 * @param duration - Duration in milliseconds
 * @returns True if timing is valid, false otherwise
 */
export function validateInteractionTiming(delay: number, duration: number): boolean {
  const totalTime = delay + duration;
  const maxTime = 2000;
  
  if (totalTime > maxTime) {
    console.warn(
      `Interaction timing exceeds maximum of ${maxTime}ms: delay=${delay}ms + duration=${duration}ms = ${totalTime}ms`
    );
    return false;
  }
  
  return true;
}
