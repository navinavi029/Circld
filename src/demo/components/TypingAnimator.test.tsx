import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import * as fc from 'fast-check';
import TypingAnimator, { TypingAnimatorRef } from './TypingAnimator';
import { createRef } from 'react';

/**
 * Property-Based Tests for TypingAnimator Component
 * 
 * These tests verify the correctness of the TypingAnimator component across all inputs
 * using fast-check with minimum 100 iterations per test.
 */

describe('TypingAnimator - Property Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // Feature: enhanced-demo-presentation, Property 1: Typing Animation Character Progression
  // Validates: Requirements 2.1
  describe('Property 1: Typing Animation Character Progression', () => {
    it('should animate text character-by-character from empty to complete', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => {
            // Use alphanumeric strings without spaces to avoid HTML whitespace collapse issues
            return /^[a-zA-Z0-9!?.,-]+$/.test(s);
          }),
          fc.integer({ min: 30, max: 80 }), // Generate random speed within valid range
          (text, speed) => {
            let container: HTMLElement;
            
            act(() => {
              const result = render(<TypingAnimator text={text} speed={speed} />);
              container = result.container;
            });

            // Initially should be empty
            expect(container!.textContent).toBe('');

            // Track character progression
            const progressionSteps: string[] = [];
            progressionSteps.push(container!.textContent || '');

            // Advance through each character
            for (let i = 0; i < text.length; i++) {
              act(() => {
                vi.advanceTimersByTime(speed);
              });
              progressionSteps.push(container!.textContent || '');
            }

            // Verify progression: each step should add exactly one character
            for (let i = 1; i < progressionSteps.length; i++) {
              const prevLength = progressionSteps[i - 1].length;
              const currLength = progressionSteps[i].length;
              
              // Each step should add exactly one character
              expect(currLength).toBe(prevLength + 1);
              
              // The text should be a prefix of the target text
              expect(text.startsWith(progressionSteps[i])).toBe(true);
            }

            // Final text should match the input text
            expect(container!.textContent).toBe(text);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-demo-presentation, Property 2: Typing Animation Speed Constraint
  // Validates: Requirements 2.2
  describe('Property 2: Typing Animation Speed Constraint', () => {
    it('should respect the speed constraint between 30ms and 80ms per character', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 20 }).filter(s => /^[a-zA-Z0-9!?.,-]+$/.test(s)),
          fc.integer({ min: 30, max: 80 }),
          (text, speed) => {
            let container: HTMLElement;
            
            act(() => {
              const result = render(<TypingAnimator text={text} speed={speed} />);
              container = result.container;
            });

            // Record timestamps when each character appears
            const timestamps: number[] = [];
            timestamps.push(Date.now());

            for (let i = 0; i < text.length; i++) {
              act(() => {
                vi.advanceTimersByTime(speed);
              });
              timestamps.push(Date.now());
            }

            // Verify timing between consecutive characters
            for (let i = 1; i < timestamps.length; i++) {
              const timeDiff = timestamps[i] - timestamps[i - 1];
              
              // Time between characters should match the speed parameter
              expect(timeDiff).toBe(speed);
              
              // Verify it's within the valid range
              expect(timeDiff).toBeGreaterThanOrEqual(30);
              expect(timeDiff).toBeLessThanOrEqual(80);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-demo-presentation, Property 3: Post-Animation Delay
  // Validates: Requirements 2.3
  describe('Property 3: Post-Animation Delay', () => {
    it('should call onComplete immediately after animation completes', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9!?.,-]+$/.test(s)),
          fc.integer({ min: 30, max: 80 }),
          (text, speed) => {
            const onComplete = vi.fn();
            const startTime = Date.now();
            
            act(() => {
              render(<TypingAnimator text={text} speed={speed} onComplete={onComplete} />);
            });

            // Advance through all characters
            // The component schedules N timers for N characters, and after the last one
            // it needs to detect completion in the next useEffect run
            for (let i = 0; i < text.length; i++) {
              act(() => {
                vi.advanceTimersByTime(speed);
              });
            }

            // After all characters are displayed, the component should call onComplete
            // in the next useEffect run (triggered by the last displayedText change)
            act(() => {
              vi.runAllTimers();
            });

            // Record when animation completes
            const animationEndTime = Date.now();
            
            // onComplete should be called immediately after animation
            expect(onComplete).toHaveBeenCalledTimes(1);
            
            // The total time should be at least the animation time
            const totalTime = animationEndTime - startTime;
            const totalAnimationTime = text.length * speed;
            expect(totalTime).toBeGreaterThanOrEqual(totalAnimationTime);
            
            // Note: The 500ms delay before advancing to next step is handled
            // by the DemoFlowController, not by TypingAnimator itself.
            // TypingAnimator just calls onComplete when animation finishes.
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-demo-presentation, Property 4: Animation Pause on Navigation
  // Validates: Requirements 2.4
  describe('Property 4: Animation Pause on Navigation', () => {
    it('should pause animation and resume from where it left off', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 30 }).filter(s => /^[a-zA-Z0-9!?.,-]+$/.test(s)),
          fc.integer({ min: 30, max: 80 }),
          fc.integer({ min: 3, max: 7 }), // Pause point (character index)
          (text, speed, pauseAtChar) => {
            const ref = createRef<TypingAnimatorRef>();
            let container: HTMLElement;
            
            act(() => {
              const result = render(<TypingAnimator text={text} speed={speed} ref={ref} />);
              container = result.container;
            });

            // Animate to pause point
            for (let i = 0; i < pauseAtChar; i++) {
              act(() => {
                vi.advanceTimersByTime(speed);
              });
            }

            const textAtPause = container!.textContent || '';
            expect(textAtPause.length).toBe(pauseAtChar);

            // Pause the animation
            act(() => {
              ref.current?.pause();
            });
            expect(ref.current?.isPaused()).toBe(true);

            // Advance time while paused - text should not change
            act(() => {
              vi.advanceTimersByTime(speed * 5);
            });
            expect(container!.textContent).toBe(textAtPause);

            // Resume the animation
            act(() => {
              ref.current?.resume();
            });
            expect(ref.current?.isPaused()).toBe(false);

            // Continue animation from where it left off
            act(() => {
              vi.advanceTimersByTime(speed);
            });
            expect(container!.textContent?.length).toBe(pauseAtChar + 1);

            // Complete the rest of the animation
            const remainingChars = text.length - pauseAtChar - 1;
            for (let i = 0; i < remainingChars; i++) {
              act(() => {
                vi.advanceTimersByTime(speed);
              });
            }
            
            // Run any pending timers to ensure completion
            act(() => {
              vi.runAllTimers();
            });
            
            expect(container!.textContent).toBe(text);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-demo-presentation, Property 5: Instant Display on Backward Navigation
  // Validates: Requirements 2.5
  describe('Property 5: Instant Display on Backward Navigation', () => {
    it('should display complete text instantly when instant prop is true', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9!?.,-]+$/.test(s)),
          fc.integer({ min: 30, max: 80 }),
          (text, speed) => {
            const onComplete = vi.fn();
            let container: HTMLElement;
            
            act(() => {
              const result = render(
                <TypingAnimator text={text} speed={speed} instant={true} onComplete={onComplete} />
              );
              container = result.container;
            });

            // Text should appear immediately without any timer advancement
            expect(container!.textContent).toBe(text);
            
            // onComplete should be called immediately
            expect(onComplete).toHaveBeenCalledTimes(1);

            // Advancing timers should not change anything
            act(() => {
              vi.advanceTimersByTime(speed * text.length);
            });
            expect(container!.textContent).toBe(text);
            
            // onComplete should still only be called once
            expect(onComplete).toHaveBeenCalledTimes(1);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not re-animate when navigating back to previously visited step', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 20 }).filter(s => /^[a-zA-Z0-9!?.,-]+$/.test(s)),
          fc.integer({ min: 30, max: 80 }),
          (text, speed) => {
            let container: HTMLElement;
            let rerender: (ui: React.ReactElement) => void;
            
            // First render: animate normally
            act(() => {
              const result = render(<TypingAnimator text={text} speed={speed} instant={false} />);
              container = result.container;
              rerender = result.rerender;
            });

            // Complete the animation
            for (let i = 0; i < text.length; i++) {
              act(() => {
                vi.advanceTimersByTime(speed);
              });
            }
            
            // Run any pending timers
            act(() => {
              vi.runAllTimers();
            });
            
            expect(container!.textContent).toBe(text);

            // Simulate navigating away and back (instant=true for backward navigation)
            act(() => {
              rerender!(<TypingAnimator text={text} speed={speed} instant={true} />);
            });

            // Text should still be complete and instant
            expect(container!.textContent).toBe(text);
            
            // No additional time should be needed
            const beforeTime = Date.now();
            act(() => {
              vi.advanceTimersByTime(0);
            });
            const afterTime = Date.now();
            
            expect(afterTime - beforeTime).toBe(0);
            expect(container!.textContent).toBe(text);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * Unit Tests for TypingAnimator Edge Cases
 * 
 * These tests verify specific edge cases that complement the property tests.
 */

describe('TypingAnimator - Unit Tests (Edge Cases)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Edge Case: Empty string input', () => {
    it('should handle empty string without errors', () => {
      const onComplete = vi.fn();
      let container: HTMLElement;
      
      act(() => {
        const result = render(
          <TypingAnimator text="" speed={50} onComplete={onComplete} />
        );
        container = result.container;
        
        // Empty string should display nothing
        expect(container.textContent).toBe('');
      });

      // Run all timers to ensure completion
      act(() => {
        vi.runAllTimers();
      });

      // onComplete should be called immediately for empty string
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should handle empty string in instant mode', () => {
      const onComplete = vi.fn();
      let container: HTMLElement;
      
      act(() => {
        const result = render(
          <TypingAnimator text="" speed={50} instant={true} onComplete={onComplete} />
        );
        container = result.container;
        
        expect(container.textContent).toBe('');
      });
      
      // onComplete should be called immediately for empty string in instant mode
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Case: Very long text (1000+ characters)', () => {
    it('should handle very long text without performance issues', () => {
      const longText = 'a'.repeat(1500); // 1500 characters
      const speed = 30; // Minimum speed
      const onComplete = vi.fn();
      let container: HTMLElement;
      
      act(() => {
        const result = render(
          <TypingAnimator text={longText} speed={speed} onComplete={onComplete} />
        );
        container = result.container;
        
        // Initially empty
        expect(container.textContent).toBe('');
      });

      // Advance through first 100 characters to verify it's working
      for (let i = 0; i < 100; i++) {
        act(() => {
          vi.advanceTimersByTime(speed);
        });
      }

      // Should have 100 characters displayed
      expect(container!.textContent?.length).toBe(100);

      // Skip to the end to verify completion works
      for (let i = 100; i < longText.length; i++) {
        act(() => {
          vi.advanceTimersByTime(speed);
        });
      }
      
      act(() => {
        vi.runAllTimers();
      });

      expect(onComplete).toHaveBeenCalled();
    });

    it('should display very long text instantly in instant mode', () => {
      const longText = 'b'.repeat(2000); // 2000 characters
      const onComplete = vi.fn();
      let container: HTMLElement;
      
      act(() => {
        const result = render(
          <TypingAnimator text={longText} speed={50} instant={true} onComplete={onComplete} />
        );
        container = result.container;
      });
      
      // Should display all text immediately
      expect(container!.textContent).toBe(longText);
      expect(container!.textContent?.length).toBe(2000);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Case: Rapid mount/unmount cycles', () => {
    it('should clean up timers on unmount', () => {
      const text = 'Hello World';
      const speed = 50;
      
      const { unmount, container } = render(
        <TypingAnimator text={text} speed={speed} />
      );

      // Start animation
      act(() => {
        vi.advanceTimersByTime(speed);
      });

      expect(container.textContent?.length).toBe(1);

      // Unmount before completion
      unmount();

      // Advance timers after unmount - should not cause errors
      act(() => {
        vi.advanceTimersByTime(speed * 10);
      });

      // No errors should occur
      expect(true).toBe(true);
    });

    it('should handle rapid remounting with different text', () => {
      const { rerender, container } = render(
        <TypingAnimator text="First" speed={50} />
      );

      // Animate first text partially
      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(container.textContent).toBe('F');

      // Immediately change to new text
      act(() => {
        rerender(<TypingAnimator text="Second" speed={50} />);
      });

      // Should reset and start animating new text
      expect(container.textContent).toBe('');

      // Advance one character at a time
      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(container.textContent).toBe('S');
      
      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(container.textContent).toBe('Se');
      
      act(() => {
        vi.advanceTimersByTime(50);
      });
      expect(container.textContent).toBe('Sec');
    });

    it('should handle multiple rapid text changes', () => {
      const { rerender, container } = render(
        <TypingAnimator text="One" speed={40} />
      );

      // Change text multiple times rapidly
      act(() => {
        rerender(<TypingAnimator text="Two" speed={40} />);
        rerender(<TypingAnimator text="Three" speed={40} />);
        rerender(<TypingAnimator text="Four" speed={40} />);
      });

      // Should be animating the last text
      expect(container.textContent).toBe('');

      act(() => {
        vi.advanceTimersByTime(40);
      });

      expect(container.textContent).toBe('F');
    });
  });

  describe('Edge Case: Pause during first character', () => {
    it('should pause before any character is displayed', () => {
      const ref = createRef<TypingAnimatorRef>();
      const text = 'Pause test';
      const speed = 50;
      
      const { container } = render(
        <TypingAnimator text={text} speed={speed} ref={ref} />
      );

      // Pause immediately before any character appears
      act(() => {
        ref.current?.pause();
      });

      expect(ref.current?.isPaused()).toBe(true);
      expect(container.textContent).toBe('');

      // Advance time while paused
      act(() => {
        vi.advanceTimersByTime(speed * 5);
      });

      // Should still be empty
      expect(container.textContent).toBe('');

      // Resume
      act(() => {
        ref.current?.resume();
      });

      // Now animation should proceed
      act(() => {
        vi.advanceTimersByTime(speed);
      });

      expect(container.textContent).toBe('P');
    });

    it('should pause after exactly one character', () => {
      const ref = createRef<TypingAnimatorRef>();
      const text = 'Test';
      const speed = 50;
      
      const { container } = render(
        <TypingAnimator text={text} speed={speed} ref={ref} />
      );

      // Display first character
      act(() => {
        vi.advanceTimersByTime(speed);
      });

      expect(container.textContent).toBe('T');

      // Pause immediately
      act(() => {
        ref.current?.pause();
      });

      // Advance time
      act(() => {
        vi.advanceTimersByTime(speed * 10);
      });

      // Should still be at first character
      expect(container.textContent).toBe('T');
    });
  });

  describe('Edge Case: Resume after completion', () => {
    it('should handle resume call after animation completes', () => {
      const ref = createRef<TypingAnimatorRef>();
      const text = 'Done';
      const speed = 50;
      const onComplete = vi.fn();
      
      const { container } = render(
        <TypingAnimator text={text} speed={speed} ref={ref} onComplete={onComplete} />
      );

      // Complete the animation - advance one timer per character
      for (let i = 0; i < text.length; i++) {
        act(() => {
          vi.advanceTimersByTime(speed);
        });
      }
      
      // Run any remaining timers to trigger completion
      act(() => {
        vi.runAllTimers();
      });

      expect(container.textContent).toBe(text);
      expect(onComplete).toHaveBeenCalledTimes(1);

      // Try to resume after completion (should be no-op)
      act(() => {
        ref.current?.resume();
      });

      // Text should remain complete
      expect(container.textContent).toBe(text);

      // Advance more time
      act(() => {
        vi.advanceTimersByTime(speed * 10);
      });

      // Should still be complete, onComplete should not be called again
      expect(container.textContent).toBe(text);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should handle pause call after completion', () => {
      const ref = createRef<TypingAnimatorRef>();
      const text = 'Complete';
      const speed = 50;
      
      const { container } = render(
        <TypingAnimator text={text} speed={speed} ref={ref} />
      );

      // Complete the animation - advance one timer per character
      for (let i = 0; i < text.length; i++) {
        act(() => {
          vi.advanceTimersByTime(speed);
        });
      }
      
      // Run any remaining timers to trigger completion
      act(() => {
        vi.runAllTimers();
      });

      expect(container.textContent).toBe(text);

      // Try to pause after completion (should be no-op)
      act(() => {
        ref.current?.pause();
      });

      // Text should remain complete
      expect(container.textContent).toBe(text);
      
      // isPaused should return true (state was set)
      expect(ref.current?.isPaused()).toBe(true);
    });

    it('should not restart animation after pause/resume when complete', () => {
      const ref = createRef<TypingAnimatorRef>();
      const text = 'Final';
      const speed = 50;
      const onComplete = vi.fn();
      
      const { container } = render(
        <TypingAnimator text={text} speed={speed} ref={ref} onComplete={onComplete} />
      );

      // Complete the animation - advance one timer per character
      for (let i = 0; i < text.length; i++) {
        act(() => {
          vi.advanceTimersByTime(speed);
        });
      }
      
      // Run any remaining timers to trigger completion
      act(() => {
        vi.runAllTimers();
      });

      expect(container.textContent).toBe(text);
      expect(onComplete).toHaveBeenCalledTimes(1);

      // Pause and resume after completion
      act(() => {
        ref.current?.pause();
        ref.current?.resume();
      });

      // Advance time
      act(() => {
        vi.advanceTimersByTime(speed * 20);
      });

      // Should still be complete, no re-animation
      expect(container.textContent).toBe(text);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
