/**
 * Unit Tests for DemoErrorBoundary Component
 * 
 * Tests error catching, fallback UI display, skip functionality,
 * and error logging behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DemoErrorBoundary } from './DemoErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('DemoErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
  });

  describe('Error Catching', () => {
    it('should catch component errors', () => {
      render(
        <DemoErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DemoErrorBoundary>
      );

      // Should display error UI
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    it('should render children when no error occurs', () => {
      render(
        <DemoErrorBoundary>
          <ThrowError shouldThrow={false} />
        </DemoErrorBoundary>
      );

      // Should display normal content
      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Fallback UI', () => {
    it('should display error message', () => {
      render(
        <DemoErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DemoErrorBoundary>
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/There was an error displaying this step/i)).toBeInTheDocument();
    });

    it('should display step name in error message when provided', () => {
      render(
        <DemoErrorBoundary stepName="Swipe Step">
          <ThrowError shouldThrow={true} />
        </DemoErrorBoundary>
      );

      expect(screen.getByText(/There was an error displaying the "Swipe Step" step/i)).toBeInTheDocument();
    });

    it('should display error icon', () => {
      const { container } = render(
        <DemoErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DemoErrorBoundary>
      );

      // Check for error icon SVG
      const errorIcon = container.querySelector('svg');
      expect(errorIcon).toBeInTheDocument();
    });
  });

  describe('Skip Button', () => {
    it('should display skip button when onSkipStep is provided', () => {
      const onSkipStep = vi.fn();

      render(
        <DemoErrorBoundary onSkipStep={onSkipStep}>
          <ThrowError shouldThrow={true} />
        </DemoErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /Skip This Step/i })).toBeInTheDocument();
    });

    it('should not display skip button when onSkipStep is not provided', () => {
      render(
        <DemoErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DemoErrorBoundary>
      );

      expect(screen.queryByRole('button', { name: /Skip This Step/i })).not.toBeInTheDocument();
    });

    it('should call onSkipStep when skip button is clicked', async () => {
      const onSkipStep = vi.fn();

      render(
        <DemoErrorBoundary onSkipStep={onSkipStep}>
          <ThrowError shouldThrow={true} />
        </DemoErrorBoundary>
      );

      const skipButton = screen.getByRole('button', { name: /Skip This Step/i });
      await userEvent.click(skipButton);

      expect(onSkipStep).toHaveBeenCalledTimes(1);
    });

    it('should reset error state when skip button is clicked', async () => {
      const onSkipStep = vi.fn();

      const { rerender } = render(
        <DemoErrorBoundary onSkipStep={onSkipStep}>
          <ThrowError shouldThrow={true} />
        </DemoErrorBoundary>
      );

      // Error UI should be displayed
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

      // Click skip button
      const skipButton = screen.getByRole('button', { name: /Skip This Step/i });
      await userEvent.click(skipButton);

      // Rerender with non-throwing component
      rerender(
        <DemoErrorBoundary onSkipStep={onSkipStep}>
          <ThrowError shouldThrow={false} />
        </DemoErrorBoundary>
      );

      // Should display normal content
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Error Logging', () => {
    it('should log error in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <DemoErrorBoundary stepName="Test Step">
          <ThrowError shouldThrow={true} />
        </DemoErrorBoundary>
      );

      // Console.error should have been called
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should display error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <DemoErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DemoErrorBoundary>
      );

      // Should have details element
      expect(screen.getByText(/Error Details \(Development Only\)/i)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing error message', () => {
      // Component that throws error without message
      function ThrowEmptyError() {
        throw new Error();
      }

      render(
        <DemoErrorBoundary>
          <ThrowEmptyError />
        </DemoErrorBoundary>
      );

      // Should still display error UI
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    it('should handle multiple errors', () => {
      const { rerender } = render(
        <DemoErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DemoErrorBoundary>
      );

      // First error
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();

      // Rerender with another error
      rerender(
        <DemoErrorBoundary>
          <ThrowError shouldThrow={true} />
        </DemoErrorBoundary>
      );

      // Should still display error UI
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });
  });
});
