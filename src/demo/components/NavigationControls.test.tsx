import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { NavigationControls } from './NavigationControls';

/**
 * Property-Based Tests for NavigationControls Component
 * 
 * These tests verify the correctness of the NavigationControls component across all inputs
 * using fast-check with minimum 100 iterations per test.
 */

describe('NavigationControls - Property Tests', () => {
  // Feature: enhanced-demo-presentation, Property 10: Progress Indicator Accuracy
  // Validates: Requirements 4.6
  describe('Property 10: Progress Indicator Accuracy', () => {
    it('should display accurate progress indicators for any step position', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 20 }), // totalSteps
          fc.integer({ min: 0, max: 19 }), // currentStep (will be clamped)
          (totalSteps, currentStepRaw) => {
            const currentStep = Math.min(currentStepRaw, totalSteps - 1);
            const onPrevious = vi.fn();
            const onNext = vi.fn();
            const onGoToStep = vi.fn();

            const { container } = render(
              <NavigationControls
                currentStep={currentStep}
                totalSteps={totalSteps}
                onPrevious={onPrevious}
                onNext={onNext}
                onGoToStep={onGoToStep}
                canGoPrevious={currentStep > 0}
                canGoNext={currentStep < totalSteps - 1}
                isAnimating={false}
              />
            );

            // Count progress dots
            const progressDots = container.querySelectorAll('.w-3.h-3.rounded-full');
            expect(progressDots.length).toBe(totalSteps);

            // Verify current step is highlighted
            const highlightedDots = Array.from(progressDots).filter(dot => 
              dot.className.includes('bg-white') && dot.className.includes('scale-125')
            );
            expect(highlightedDots.length).toBe(1);

            // Verify the correct dot is highlighted (currentStep index)
            const highlightedDot = progressDots[currentStep];
            expect(highlightedDot.className).toContain('bg-white');
            expect(highlightedDot.className).toContain('scale-125');

            // Verify non-current dots have different styling
            Array.from(progressDots).forEach((dot, index) => {
              if (index !== currentStep) {
                expect(dot.className).toContain('bg-white/30');
                expect(dot.className).not.toContain('scale-125');
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display correct step counter for any position', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 50 }), // totalSteps
          fc.integer({ min: 0, max: 49 }), // currentStep (will be clamped)
          (totalSteps, currentStepRaw) => {
            const currentStep = Math.min(currentStepRaw, totalSteps - 1);
            const onPrevious = vi.fn();
            const onNext = vi.fn();
            const onGoToStep = vi.fn();

            const { container } = render(
              <NavigationControls
                currentStep={currentStep}
                totalSteps={totalSteps}
                onPrevious={onPrevious}
                onNext={onNext}
                onGoToStep={onGoToStep}
                canGoPrevious={currentStep > 0}
                canGoNext={currentStep < totalSteps - 1}
                isAnimating={false}
              />
            );

            // Find step counter (displays "X / Y")
            const stepCounter = container.querySelector('.absolute.top-8.right-8');
            expect(stepCounter).toBeDefined();
            expect(stepCounter?.textContent).toBe(`${currentStep + 1} / ${totalSteps}`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-demo-presentation, Property 11: Progress Indicator Navigation
  // Validates: Requirements 4.7
  describe('Property 11: Progress Indicator Navigation', () => {
    it('should call onGoToStep with correct index when any progress dot is clicked', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 15 }), // totalSteps
          fc.integer({ min: 0, max: 14 }), // currentStep (will be clamped)
          fc.integer({ min: 0, max: 14 }), // targetStep (will be clamped)
          (totalSteps, currentStepRaw, targetStepRaw) => {
            const currentStep = Math.min(currentStepRaw, totalSteps - 1);
            const targetStep = Math.min(targetStepRaw, totalSteps - 1);
            const onPrevious = vi.fn();
            const onNext = vi.fn();
            const onGoToStep = vi.fn();

            const { container } = render(
              <NavigationControls
                currentStep={currentStep}
                totalSteps={totalSteps}
                onPrevious={onPrevious}
                onNext={onNext}
                onGoToStep={onGoToStep}
                canGoPrevious={currentStep > 0}
                canGoNext={currentStep < totalSteps - 1}
                isAnimating={false}
              />
            );

            // Click target progress dot
            const progressDots = container.querySelectorAll('.w-3.h-3.rounded-full');
            fireEvent.click(progressDots[targetStep]);

            // Verify onGoToStep was called with correct index
            expect(onGoToStep).toHaveBeenCalledTimes(1);
            expect(onGoToStep).toHaveBeenCalledWith(targetStep);

            // Verify other callbacks were not called
            expect(onPrevious).not.toHaveBeenCalled();
            expect(onNext).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not navigate when progress dots are clicked during animation', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }), // totalSteps
          fc.integer({ min: 0, max: 9 }), // currentStep (will be clamped)
          fc.integer({ min: 0, max: 9 }), // targetStep (will be clamped)
          (totalSteps, currentStepRaw, targetStepRaw) => {
            const currentStep = Math.min(currentStepRaw, totalSteps - 1);
            const targetStep = Math.min(targetStepRaw, totalSteps - 1);
            const onPrevious = vi.fn();
            const onNext = vi.fn();
            const onGoToStep = vi.fn();

            const { container } = render(
              <NavigationControls
                currentStep={currentStep}
                totalSteps={totalSteps}
                onPrevious={onPrevious}
                onNext={onNext}
                onGoToStep={onGoToStep}
                canGoPrevious={currentStep > 0}
                canGoNext={currentStep < totalSteps - 1}
                isAnimating={true} // Animation in progress
              />
            );

            // Try to click progress dot during animation
            const progressDots = container.querySelectorAll('.w-3.h-3.rounded-full');
            fireEvent.click(progressDots[targetStep]);

            // onGoToStep should not be called (buttons are disabled)
            expect(onGoToStep).not.toHaveBeenCalled();
            expect(onPrevious).not.toHaveBeenCalled();
            expect(onNext).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-demo-presentation, Property 15: Navigation Controls Accessibility
  // Validates: Requirements 6.4
  describe('Property 15: Navigation Controls Accessibility', () => {
    it('should render all navigation controls for any valid configuration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 20 }), // totalSteps
          fc.integer({ min: 0, max: 19 }), // currentStep (will be clamped)
          fc.boolean(), // isAnimating
          (totalSteps, currentStepRaw, isAnimating) => {
            const currentStep = Math.min(currentStepRaw, totalSteps - 1);
            const onPrevious = vi.fn();
            const onNext = vi.fn();
            const onGoToStep = vi.fn();
            const onRestart = vi.fn();

            const { container } = render(
              <NavigationControls
                currentStep={currentStep}
                totalSteps={totalSteps}
                onPrevious={onPrevious}
                onNext={onNext}
                onGoToStep={onGoToStep}
                canGoPrevious={currentStep > 0}
                canGoNext={currentStep < totalSteps - 1}
                isAnimating={isAnimating}
                onRestart={onRestart}
              />
            );

            // Previous button should always exist
            const prevButton = Array.from(container.querySelectorAll('button')).find(
              btn => btn.textContent?.includes('Previous')
            );
            expect(prevButton).toBeDefined();

            // Next or Restart button should exist
            const isLastStep = currentStep >= totalSteps - 1;
            if (isLastStep) {
              const restartButton = Array.from(container.querySelectorAll('button')).find(
                btn => btn.textContent?.includes('Restart')
              );
              expect(restartButton).toBeDefined();
            } else {
              const nextButton = Array.from(container.querySelectorAll('button')).find(
                btn => btn.textContent?.includes('Next')
              );
              expect(nextButton).toBeDefined();
            }

            // Progress indicators should exist
            const progressDots = container.querySelectorAll('.w-3.h-3.rounded-full');
            expect(progressDots.length).toBe(totalSteps);

            // Step counter should exist
            const stepCounter = container.querySelector('.absolute.top-8.right-8');
            expect(stepCounter).toBeDefined();
            expect(stepCounter?.textContent).toBe(`${currentStep + 1} / ${totalSteps}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have proper ARIA attributes for accessibility', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 3, max: 10 }), // totalSteps
          fc.integer({ min: 0, max: 9 }), // currentStep (will be clamped)
          (totalSteps, currentStepRaw) => {
            const currentStep = Math.min(currentStepRaw, totalSteps - 1);
            const onPrevious = vi.fn();
            const onNext = vi.fn();
            const onGoToStep = vi.fn();

            const { container } = render(
              <NavigationControls
                currentStep={currentStep}
                totalSteps={totalSteps}
                onPrevious={onPrevious}
                onNext={onNext}
                onGoToStep={onGoToStep}
                canGoPrevious={currentStep > 0}
                canGoNext={currentStep < totalSteps - 1}
                isAnimating={false}
              />
            );

            // Previous button should have aria-label
            const prevButton = Array.from(container.querySelectorAll('button')).find(
              btn => btn.textContent?.includes('Previous')
            );
            expect(prevButton?.getAttribute('aria-label')).toBe('Previous step');

            // Next/Restart button should have aria-label
            const isLastStep = currentStep >= totalSteps - 1;
            if (isLastStep) {
              const restartButton = Array.from(container.querySelectorAll('button')).find(
                btn => btn.textContent?.includes('Restart')
              );
              expect(restartButton?.getAttribute('aria-label')).toBe('Restart demo');
            } else {
              const nextButton = Array.from(container.querySelectorAll('button')).find(
                btn => btn.textContent?.includes('Next')
              );
              expect(nextButton?.getAttribute('aria-label')).toBe('Next step');
            }

            // Progress indicators container should have navigation role
            const progressContainer = container.querySelector('[role="navigation"]');
            expect(progressContainer).toBeDefined();
            expect(progressContainer?.getAttribute('aria-label')).toBe('Demo progress');

            // Current progress dot should have aria-current
            const progressDots = container.querySelectorAll('.w-3.h-3.rounded-full');
            const currentDot = progressDots[currentStep];
            expect(currentDot.getAttribute('aria-current')).toBe('step');

            // Step counter should have aria-live for screen readers
            const stepCounter = container.querySelector('[aria-live="polite"]');
            expect(stepCounter).toBeDefined();
            expect(stepCounter?.getAttribute('aria-atomic')).toBe('true');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: enhanced-demo-presentation, Property 17: Step Counter Display
  // Validates: Requirements 7.4
  describe('Property 17: Step Counter Display', () => {
    it('should display step counter with correct format for any step', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100 }), // totalSteps
          fc.integer({ min: 0, max: 99 }), // currentStep (will be clamped)
          (totalSteps, currentStepRaw) => {
            const currentStep = Math.min(currentStepRaw, totalSteps - 1);
            const onPrevious = vi.fn();
            const onNext = vi.fn();
            const onGoToStep = vi.fn();

            const { container } = render(
              <NavigationControls
                currentStep={currentStep}
                totalSteps={totalSteps}
                onPrevious={onPrevious}
                onNext={onNext}
                onGoToStep={onGoToStep}
                canGoPrevious={currentStep > 0}
                canGoNext={currentStep < totalSteps - 1}
                isAnimating={false}
              />
            );

            // Step counter should be visible
            const stepCounter = container.querySelector('.absolute.top-8.right-8');
            expect(stepCounter).toBeDefined();

            // Should display in "X / Y" format (1-indexed for display)
            const expectedText = `${currentStep + 1} / ${totalSteps}`;
            expect(stepCounter?.textContent).toBe(expectedText);

            // Verify format with regex
            const counterText = stepCounter?.textContent || '';
            expect(counterText).toMatch(/^\d+ \/ \d+$/);

            // Verify numbers are correct
            const [displayedCurrent, displayedTotal] = counterText.split(' / ').map(Number);
            expect(displayedCurrent).toBe(currentStep + 1); // 1-indexed
            expect(displayedTotal).toBe(totalSteps);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update step counter when currentStep changes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 15 }), // totalSteps
          fc.integer({ min: 0, max: 14 }), // initialStep (will be clamped)
          fc.integer({ min: 0, max: 14 }), // newStep (will be clamped)
          (totalSteps, initialStepRaw, newStepRaw) => {
            const initialStep = Math.min(initialStepRaw, totalSteps - 1);
            const newStep = Math.min(newStepRaw, totalSteps - 1);
            
            // Skip if steps are the same
            if (initialStep === newStep) return;

            const onPrevious = vi.fn();
            const onNext = vi.fn();
            const onGoToStep = vi.fn();

            const { container, rerender } = render(
              <NavigationControls
                currentStep={initialStep}
                totalSteps={totalSteps}
                onPrevious={onPrevious}
                onNext={onNext}
                onGoToStep={onGoToStep}
                canGoPrevious={initialStep > 0}
                canGoNext={initialStep < totalSteps - 1}
                isAnimating={false}
              />
            );

            // Verify initial counter
            let stepCounter = container.querySelector('.absolute.top-8.right-8');
            expect(stepCounter?.textContent).toBe(`${initialStep + 1} / ${totalSteps}`);

            // Update to new step
            rerender(
              <NavigationControls
                currentStep={newStep}
                totalSteps={totalSteps}
                onPrevious={onPrevious}
                onNext={onNext}
                onGoToStep={onGoToStep}
                canGoPrevious={newStep > 0}
                canGoNext={newStep < totalSteps - 1}
                isAnimating={false}
              />
            );

            // Verify updated counter
            stepCounter = container.querySelector('.absolute.top-8.right-8');
            expect(stepCounter?.textContent).toBe(`${newStep + 1} / ${totalSteps}`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});


/**
 * Unit Tests for NavigationControls
 * 
 * These tests verify specific behaviors and edge cases that complement the property tests.
 */

describe('NavigationControls - Unit Tests', () => {
  describe('Previous button disabled on first step', () => {
    it('should disable previous button when on first step', () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      const onGoToStep = vi.fn();

      const { container } = render(
        <NavigationControls
          currentStep={0}
          totalSteps={5}
          onPrevious={onPrevious}
          onNext={onNext}
          onGoToStep={onGoToStep}
          canGoPrevious={false}
          canGoNext={true}
          isAnimating={false}
        />
      );

      const prevButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Previous')
      );

      expect(prevButton?.disabled).toBe(true);
      expect(prevButton?.className).toContain('disabled:opacity-50');
      expect(prevButton?.className).toContain('disabled:cursor-not-allowed');
    });

    it('should not call onPrevious when disabled button is clicked', () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      const onGoToStep = vi.fn();

      const { container } = render(
        <NavigationControls
          currentStep={0}
          totalSteps={5}
          onPrevious={onPrevious}
          onNext={onNext}
          onGoToStep={onGoToStep}
          canGoPrevious={false}
          canGoNext={true}
          isAnimating={false}
        />
      );

      const prevButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Previous')
      );

      fireEvent.click(prevButton!);

      expect(onPrevious).not.toHaveBeenCalled();
    });

    it('should enable previous button when not on first step', () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      const onGoToStep = vi.fn();

      const { container } = render(
        <NavigationControls
          currentStep={2}
          totalSteps={5}
          onPrevious={onPrevious}
          onNext={onNext}
          onGoToStep={onGoToStep}
          canGoPrevious={true}
          canGoNext={true}
          isAnimating={false}
        />
      );

      const prevButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Previous')
      );

      expect(prevButton?.disabled).toBe(false);

      fireEvent.click(prevButton!);
      expect(onPrevious).toHaveBeenCalledTimes(1);
    });
  });

  describe('Restart button appears on last step', () => {
    it('should show restart button instead of next button on last step', () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      const onGoToStep = vi.fn();
      const onRestart = vi.fn();

      const { container } = render(
        <NavigationControls
          currentStep={4}
          totalSteps={5}
          onPrevious={onPrevious}
          onNext={onNext}
          onGoToStep={onGoToStep}
          canGoPrevious={true}
          canGoNext={false}
          isAnimating={false}
          onRestart={onRestart}
        />
      );

      // Restart button should exist
      const restartButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Restart')
      );
      expect(restartButton).toBeDefined();
      expect(restartButton?.disabled).toBe(false);

      // Next button should not exist
      const nextButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Next') && !btn.textContent?.includes('Restart')
      );
      expect(nextButton).toBeUndefined();
    });

    it('should call onRestart when restart button is clicked', () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      const onGoToStep = vi.fn();
      const onRestart = vi.fn();

      const { container } = render(
        <NavigationControls
          currentStep={4}
          totalSteps={5}
          onPrevious={onPrevious}
          onNext={onNext}
          onGoToStep={onGoToStep}
          canGoPrevious={true}
          canGoNext={false}
          isAnimating={false}
          onRestart={onRestart}
        />
      );

      const restartButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Restart')
      );

      fireEvent.click(restartButton!);

      expect(onRestart).toHaveBeenCalledTimes(1);
      expect(onNext).not.toHaveBeenCalled();
    });

    it('should show next button on non-last steps', () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      const onGoToStep = vi.fn();

      const { container } = render(
        <NavigationControls
          currentStep={2}
          totalSteps={5}
          onPrevious={onPrevious}
          onNext={onNext}
          onGoToStep={onGoToStep}
          canGoPrevious={true}
          canGoNext={true}
          isAnimating={false}
        />
      );

      // Next button should exist
      const nextButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Next')
      );
      expect(nextButton).toBeDefined();
      expect(nextButton?.disabled).toBe(false);

      // Restart button should not exist
      const restartButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Restart')
      );
      expect(restartButton).toBeUndefined();
    });
  });

  describe('All controls disabled during animation', () => {
    it('should disable all buttons when isAnimating is true', () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      const onGoToStep = vi.fn();

      const { container } = render(
        <NavigationControls
          currentStep={2}
          totalSteps={5}
          onPrevious={onPrevious}
          onNext={onNext}
          onGoToStep={onGoToStep}
          canGoPrevious={true}
          canGoNext={true}
          isAnimating={true}
        />
      );

      // Previous button should be disabled
      const prevButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Previous')
      );
      expect(prevButton?.disabled).toBe(true);

      // Next button should be disabled
      const nextButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Next')
      );
      expect(nextButton?.disabled).toBe(true);

      // Progress dots should have cursor-not-allowed
      const progressDots = container.querySelectorAll('.w-3.h-3.rounded-full');
      progressDots.forEach(dot => {
        expect(dot.className).toContain('cursor-not-allowed');
      });
    });

    it('should not call callbacks when buttons are clicked during animation', () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      const onGoToStep = vi.fn();

      const { container } = render(
        <NavigationControls
          currentStep={2}
          totalSteps={5}
          onPrevious={onPrevious}
          onNext={onNext}
          onGoToStep={onGoToStep}
          canGoPrevious={true}
          canGoNext={true}
          isAnimating={true}
        />
      );

      // Try clicking previous button
      const prevButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Previous')
      );
      fireEvent.click(prevButton!);
      expect(onPrevious).not.toHaveBeenCalled();

      // Try clicking next button
      const nextButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Next')
      );
      fireEvent.click(nextButton!);
      expect(onNext).not.toHaveBeenCalled();

      // Try clicking progress dot
      const progressDots = container.querySelectorAll('.w-3.h-3.rounded-full');
      fireEvent.click(progressDots[3]);
      expect(onGoToStep).not.toHaveBeenCalled();
    });

    it('should disable restart button during animation on last step', () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      const onGoToStep = vi.fn();
      const onRestart = vi.fn();

      const { container } = render(
        <NavigationControls
          currentStep={4}
          totalSteps={5}
          onPrevious={onPrevious}
          onNext={onNext}
          onGoToStep={onGoToStep}
          canGoPrevious={true}
          canGoNext={false}
          isAnimating={true}
          onRestart={onRestart}
        />
      );

      const restartButton = Array.from(container.querySelectorAll('button')).find(
        btn => btn.textContent?.includes('Restart')
      );
      expect(restartButton?.disabled).toBe(true);

      fireEvent.click(restartButton!);
      expect(onRestart).not.toHaveBeenCalled();
    });
  });

  describe('Progress dot click triggers navigation', () => {
    it('should call onGoToStep with correct index when progress dot is clicked', () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      const onGoToStep = vi.fn();

      const { container } = render(
        <NavigationControls
          currentStep={1}
          totalSteps={5}
          onPrevious={onPrevious}
          onNext={onNext}
          onGoToStep={onGoToStep}
          canGoPrevious={true}
          canGoNext={true}
          isAnimating={false}
        />
      );

      const progressDots = container.querySelectorAll('.w-3.h-3.rounded-full');

      // Click third dot (index 2)
      fireEvent.click(progressDots[2]);

      expect(onGoToStep).toHaveBeenCalledTimes(1);
      expect(onGoToStep).toHaveBeenCalledWith(2);
    });

    it('should call onGoToStep for each different dot clicked', () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      const onGoToStep = vi.fn();

      const { container } = render(
        <NavigationControls
          currentStep={0}
          totalSteps={5}
          onPrevious={onPrevious}
          onNext={onNext}
          onGoToStep={onGoToStep}
          canGoPrevious={false}
          canGoNext={true}
          isAnimating={false}
        />
      );

      const progressDots = container.querySelectorAll('.w-3.h-3.rounded-full');

      // Click multiple dots
      fireEvent.click(progressDots[2]);
      expect(onGoToStep).toHaveBeenCalledWith(2);

      fireEvent.click(progressDots[4]);
      expect(onGoToStep).toHaveBeenCalledWith(4);

      fireEvent.click(progressDots[1]);
      expect(onGoToStep).toHaveBeenCalledWith(1);

      expect(onGoToStep).toHaveBeenCalledTimes(3);
    });

    it('should allow clicking current step dot (no-op navigation)', () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      const onGoToStep = vi.fn();

      const { container } = render(
        <NavigationControls
          currentStep={2}
          totalSteps={5}
          onPrevious={onPrevious}
          onNext={onNext}
          onGoToStep={onGoToStep}
          canGoPrevious={true}
          canGoNext={true}
          isAnimating={false}
        />
      );

      const progressDots = container.querySelectorAll('.w-3.h-3.rounded-full');

      // Click current step dot
      fireEvent.click(progressDots[2]);

      // Should still call onGoToStep (controller decides if it's a no-op)
      expect(onGoToStep).toHaveBeenCalledTimes(1);
      expect(onGoToStep).toHaveBeenCalledWith(2);
    });
  });

  describe('Step counter displays correct values', () => {
    it('should display step counter in correct format', () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      const onGoToStep = vi.fn();

      const { container } = render(
        <NavigationControls
          currentStep={2}
          totalSteps={5}
          onPrevious={onPrevious}
          onNext={onNext}
          onGoToStep={onGoToStep}
          canGoPrevious={true}
          canGoNext={true}
          isAnimating={false}
        />
      );

      const stepCounter = container.querySelector('.absolute.top-8.right-8');
      expect(stepCounter?.textContent).toBe('3 / 5'); // 1-indexed display
    });

    it('should display correct counter for first step', () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      const onGoToStep = vi.fn();

      const { container } = render(
        <NavigationControls
          currentStep={0}
          totalSteps={10}
          onPrevious={onPrevious}
          onNext={onNext}
          onGoToStep={onGoToStep}
          canGoPrevious={false}
          canGoNext={true}
          isAnimating={false}
        />
      );

      const stepCounter = container.querySelector('.absolute.top-8.right-8');
      expect(stepCounter?.textContent).toBe('1 / 10');
    });

    it('should display correct counter for last step', () => {
      const onPrevious = vi.fn();
      const onNext = vi.fn();
      const onGoToStep = vi.fn();

      const { container } = render(
        <NavigationControls
          currentStep={9}
          totalSteps={10}
          onPrevious={onPrevious}
          onNext={onNext}
          onGoToStep={onGoToStep}
          canGoPrevious={true}
          canGoNext={false}
          isAnimating={false}
        />
      );

      const stepCounter = container.querySelector('.absolute.top-8.right-8');
      expect(stepCounter?.textContent).toBe('10 / 10');
    });
  });
});
