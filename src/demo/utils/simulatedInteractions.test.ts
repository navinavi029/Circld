/**
 * Unit Tests for Simulated Interaction System
 * 
 * Tests the simulated interaction functions that provide animations
 * for the demo flow (swipe, notification appear, message send, button click).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  executeSwipeSimulation,
  executeNotificationAppearSimulation,
  executeMessageSendSimulation,
  executeButtonClickSimulation,
  validateInteractionTiming,
  type SimulatedInteractionOptions
} from './simulatedInteractions';

describe('Simulated Interaction System', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('executeSwipeSimulation', () => {
    it('should animate card swipe right with correct timing', () => {
      const element = document.createElement('div');
      const onComplete = vi.fn();
      const options: SimulatedInteractionOptions = {
        delay: 1000,
        duration: 800,
        onComplete
      };

      executeSwipeSimulation(element, options);

      // Initially, no styles should be applied
      expect(element.style.transform).toBe('');

      // After delay, animation should start
      vi.advanceTimersByTime(1000);
      expect(element.style.transform).toContain('translateX(150%)');
      expect(element.style.transform).toContain('rotate(20deg)');
      expect(element.style.opacity).toBe('0');

      // After duration, onComplete should be called
      vi.advanceTimersByTime(800);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should handle null element gracefully', () => {
      const onComplete = vi.fn();
      const options: SimulatedInteractionOptions = {
        delay: 1000,
        duration: 800,
        onComplete
      };

      const cleanup = executeSwipeSimulation(null, options);
      
      // Should return a cleanup function
      expect(typeof cleanup).toBe('function');
      
      // Should not throw when advancing timers
      expect(() => {
        vi.advanceTimersByTime(2000);
      }).not.toThrow();
    });

    it('should cleanup and reset styles when cleanup is called', () => {
      const element = document.createElement('div');
      const options: SimulatedInteractionOptions = {
        delay: 500,
        duration: 800,
        onComplete: vi.fn()
      };

      const cleanup = executeSwipeSimulation(element, options);

      // Start animation
      vi.advanceTimersByTime(500);
      expect(element.style.transform).not.toBe('');

      // Call cleanup
      cleanup();

      // Styles should be reset
      expect(element.style.transform).toBe('');
      expect(element.style.opacity).toBe('');
      expect(element.style.transition).toBe('');
    });

    it('should not call onComplete if cleanup is called before completion', () => {
      const element = document.createElement('div');
      const onComplete = vi.fn();
      const options: SimulatedInteractionOptions = {
        delay: 500,
        duration: 800,
        onComplete
      };

      const cleanup = executeSwipeSimulation(element, options);

      // Advance partway through animation
      vi.advanceTimersByTime(1000);

      // Call cleanup before completion
      cleanup();

      // Advance past completion time
      vi.advanceTimersByTime(1000);

      // onComplete should not be called
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('executeNotificationAppearSimulation', () => {
    it('should animate notification fade in with correct timing', () => {
      const element = document.createElement('div');
      const onComplete = vi.fn();
      const options: SimulatedInteractionOptions = {
        delay: 1500,
        duration: 600,
        onComplete
      };

      executeNotificationAppearSimulation(element, options);

      // Initially, element should be hidden
      expect(element.style.opacity).toBe('0');
      expect(element.style.transform).toContain('translateY(-20px)');

      // After delay, animation should start
      vi.advanceTimersByTime(1500);
      expect(element.style.opacity).toBe('1');
      expect(element.style.transform).toContain('translateY(0)');

      // After duration, onComplete should be called
      vi.advanceTimersByTime(600);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should handle null element gracefully', () => {
      const onComplete = vi.fn();
      const options: SimulatedInteractionOptions = {
        delay: 1500,
        duration: 600,
        onComplete
      };

      const cleanup = executeNotificationAppearSimulation(null, options);
      
      expect(typeof cleanup).toBe('function');
      expect(() => {
        vi.advanceTimersByTime(3000);
      }).not.toThrow();
    });

    it('should cleanup and reset styles when cleanup is called', () => {
      const element = document.createElement('div');
      const options: SimulatedInteractionOptions = {
        delay: 500,
        duration: 600,
        onComplete: vi.fn()
      };

      const cleanup = executeNotificationAppearSimulation(element, options);

      // Start animation
      vi.advanceTimersByTime(500);
      expect(element.style.opacity).toBe('1');

      // Call cleanup
      cleanup();

      // Styles should be reset
      expect(element.style.transform).toBe('');
      expect(element.style.opacity).toBe('');
      expect(element.style.transition).toBe('');
    });
  });

  describe('executeMessageSendSimulation', () => {
    it('should show typing indicator then message with correct timing', () => {
      const typingElement = document.createElement('div');
      const messageElement = document.createElement('div');
      const onComplete = vi.fn();
      const options: SimulatedInteractionOptions = {
        delay: 2500,
        duration: 1000,
        onComplete
      };

      executeMessageSendSimulation(typingElement, messageElement, options);

      // Initially, message should be hidden
      expect(messageElement.style.opacity).toBe('0');

      // After delay, typing indicator should be visible
      vi.advanceTimersByTime(2500);
      expect(typingElement.style.display).toBe('block');
      expect(typingElement.style.opacity).toBe('1');

      // After 60% of duration, typing indicator should start fading
      vi.advanceTimersByTime(600);
      expect(typingElement.style.opacity).toBe('0');

      // After brief delay, message should appear
      vi.advanceTimersByTime(200);
      expect(typingElement.style.display).toBe('none');
      expect(messageElement.style.opacity).toBe('1');

      // After remaining duration, onComplete should be called
      vi.advanceTimersByTime(400);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should handle null elements gracefully', () => {
      const onComplete = vi.fn();
      const options: SimulatedInteractionOptions = {
        delay: 2500,
        duration: 1000,
        onComplete
      };

      const cleanup = executeMessageSendSimulation(null, null, options);
      
      expect(typeof cleanup).toBe('function');
      expect(() => {
        vi.advanceTimersByTime(5000);
      }).not.toThrow();
    });

    it('should work with only typing indicator element', () => {
      const typingElement = document.createElement('div');
      const onComplete = vi.fn();
      const options: SimulatedInteractionOptions = {
        delay: 1000,
        duration: 1000,
        onComplete
      };

      executeMessageSendSimulation(typingElement, null, options);

      vi.advanceTimersByTime(1000);
      expect(typingElement.style.display).toBe('block');

      vi.advanceTimersByTime(1200);
      expect(onComplete).toHaveBeenCalled();
    });

    it('should work with only message element', () => {
      const messageElement = document.createElement('div');
      const onComplete = vi.fn();
      const options: SimulatedInteractionOptions = {
        delay: 1000,
        duration: 1000,
        onComplete
      };

      executeMessageSendSimulation(null, messageElement, options);

      expect(messageElement.style.opacity).toBe('0');

      vi.advanceTimersByTime(2200);
      expect(messageElement.style.opacity).toBe('1');
      expect(onComplete).toHaveBeenCalled();
    });

    it('should cleanup and reset styles when cleanup is called', () => {
      const typingElement = document.createElement('div');
      const messageElement = document.createElement('div');
      const options: SimulatedInteractionOptions = {
        delay: 500,
        duration: 1000,
        onComplete: vi.fn()
      };

      const cleanup = executeMessageSendSimulation(typingElement, messageElement, options);

      // Start animation
      vi.advanceTimersByTime(500);
      expect(typingElement.style.display).toBe('block');

      // Call cleanup
      cleanup();

      // Styles should be reset
      expect(typingElement.style.display).toBe('');
      expect(typingElement.style.opacity).toBe('');
      expect(messageElement.style.transform).toBe('');
      expect(messageElement.style.opacity).toBe('');
    });
  });

  describe('executeButtonClickSimulation', () => {
    it('should animate button press and release with correct timing', () => {
      const element = document.createElement('button');
      const onComplete = vi.fn();
      const options: SimulatedInteractionOptions = {
        delay: 2000,
        duration: 500,
        onComplete
      };

      executeButtonClickSimulation(element, options);

      // Initially, no transform
      expect(element.style.transform).toBe('');

      // After delay, button should be pressed (40% of duration = 200ms)
      vi.advanceTimersByTime(2000);
      expect(element.style.transform).toContain('scale(0.95)');

      // After press duration, button should be released
      vi.advanceTimersByTime(200);
      expect(element.style.transform).toContain('scale(1)');

      // After release duration (60% = 300ms), onComplete should be called
      vi.advanceTimersByTime(300);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should handle null element gracefully', () => {
      const onComplete = vi.fn();
      const options: SimulatedInteractionOptions = {
        delay: 2000,
        duration: 500,
        onComplete
      };

      const cleanup = executeButtonClickSimulation(null, options);
      
      expect(typeof cleanup).toBe('function');
      expect(() => {
        vi.advanceTimersByTime(3000);
      }).not.toThrow();
    });

    it('should cleanup and reset styles when cleanup is called', () => {
      const element = document.createElement('button');
      const options: SimulatedInteractionOptions = {
        delay: 500,
        duration: 500,
        onComplete: vi.fn()
      };

      const cleanup = executeButtonClickSimulation(element, options);

      // Start animation
      vi.advanceTimersByTime(500);
      expect(element.style.transform).not.toBe('');

      // Call cleanup
      cleanup();

      // Styles should be reset
      expect(element.style.transform).toBe('');
      expect(element.style.transition).toBe('');
    });
  });

  describe('validateInteractionTiming', () => {
    it('should return true for valid timing within 2000ms', () => {
      expect(validateInteractionTiming(1000, 800)).toBe(true);
      expect(validateInteractionTiming(1500, 500)).toBe(true);
      expect(validateInteractionTiming(0, 2000)).toBe(true);
      expect(validateInteractionTiming(2000, 0)).toBe(true);
    });

    it('should return false for timing exceeding 2000ms', () => {
      expect(validateInteractionTiming(1500, 600)).toBe(false);
      expect(validateInteractionTiming(2000, 100)).toBe(false);
      expect(validateInteractionTiming(1000, 1500)).toBe(false);
    });

    it('should return true for timing exactly at 2000ms', () => {
      expect(validateInteractionTiming(1000, 1000)).toBe(true);
      expect(validateInteractionTiming(500, 1500)).toBe(true);
    });

    it('should log warning for invalid timing', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      validateInteractionTiming(1500, 600);
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Interaction timing exceeds maximum')
      );
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero delay', () => {
      const element = document.createElement('div');
      const onComplete = vi.fn();
      
      executeSwipeSimulation(element, { delay: 0, duration: 800, onComplete });
      
      // Animation should start immediately
      vi.advanceTimersByTime(0);
      expect(element.style.transform).toContain('translateX');
      
      vi.advanceTimersByTime(800);
      expect(onComplete).toHaveBeenCalled();
    });

    it('should handle zero duration', () => {
      const element = document.createElement('div');
      const onComplete = vi.fn();
      
      executeSwipeSimulation(element, { delay: 1000, duration: 0, onComplete });
      
      vi.advanceTimersByTime(1000);
      expect(element.style.transform).toContain('translateX');
      
      // onComplete should be called immediately after delay (setTimeout with 0 still needs 1ms)
      vi.advanceTimersByTime(1);
      expect(onComplete).toHaveBeenCalled();
    });

    it('should handle missing onComplete callback', () => {
      const element = document.createElement('div');
      
      expect(() => {
        executeSwipeSimulation(element, { delay: 1000, duration: 800 });
        vi.advanceTimersByTime(2000);
      }).not.toThrow();
    });

    it('should handle rapid cleanup calls', () => {
      const element = document.createElement('div');
      const cleanup = executeSwipeSimulation(element, { delay: 1000, duration: 800 });
      
      // Call cleanup multiple times
      expect(() => {
        cleanup();
        cleanup();
        cleanup();
      }).not.toThrow();
    });

    it('should handle cleanup before delay completes', () => {
      const element = document.createElement('div');
      const onComplete = vi.fn();
      const cleanup = executeSwipeSimulation(element, { 
        delay: 1000, 
        duration: 800, 
        onComplete 
      });
      
      // Cleanup before delay
      vi.advanceTimersByTime(500);
      cleanup();
      
      // Advance past delay and duration
      vi.advanceTimersByTime(2000);
      
      // Animation should not have started
      expect(element.style.transform).toBe('');
      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle multiple simultaneous animations', () => {
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      const onComplete1 = vi.fn();
      const onComplete2 = vi.fn();
      
      executeSwipeSimulation(element1, { delay: 1000, duration: 800, onComplete: onComplete1 });
      executeNotificationAppearSimulation(element2, { delay: 500, duration: 600, onComplete: onComplete2 });
      
      // Advance to first animation completion
      vi.advanceTimersByTime(1100);
      expect(onComplete2).toHaveBeenCalled();
      expect(onComplete1).not.toHaveBeenCalled();
      
      // Advance to second animation completion
      vi.advanceTimersByTime(700);
      expect(onComplete1).toHaveBeenCalled();
    });

    it('should handle sequential animations on same element', () => {
      const element = document.createElement('div');
      const onComplete1 = vi.fn();
      const onComplete2 = vi.fn();
      
      const cleanup1 = executeSwipeSimulation(element, { 
        delay: 1000, 
        duration: 800, 
        onComplete: onComplete1 
      });
      
      // Complete first animation
      vi.advanceTimersByTime(1800);
      expect(onComplete1).toHaveBeenCalled();
      
      // Cleanup first animation
      cleanup1();
      
      // Start second animation
      executeNotificationAppearSimulation(element, { 
        delay: 500, 
        duration: 600, 
        onComplete: onComplete2 
      });
      
      vi.advanceTimersByTime(1100);
      expect(onComplete2).toHaveBeenCalled();
    });
  });
});
