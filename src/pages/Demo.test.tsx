/**
 * Integration Tests for Enhanced Demo Page
 * 
 * Tests the complete demo flow from intro to completion, including:
 * - Navigation through all steps
 * - Auto-advance functionality
 * - Keyboard navigation
 * - Restart functionality
 * - Typing animations
 * - Simulated interactions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Demo } from './Demo';
import { BrowserRouter } from 'react-router-dom';

// Mock the AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
    loading: false,
  }),
}));

// Mock the ProfileContext
vi.mock('../contexts/ProfileContext', () => ({
  useProfile: () => ({
    profile: {
      uid: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
    },
    loading: false,
  }),
  ProfileProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Demo Page - Integration Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const renderDemo = () => {
    return render(
      <BrowserRouter>
        <Demo />
      </BrowserRouter>
    );
  };

  describe('Complete Flow Navigation', () => {
    it('should render intro step initially', () => {
      renderDemo();
      
      // Check for intro content
      expect(screen.getByText(/Welcome to Circl'd/i)).toBeInTheDocument();
    });

    it('should navigate through all steps to completion', async () => {
      const { container } = renderDemo();
      
      // Start at intro (step 1/5)
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
      
      // Click next to go to swipe step
      const nextButton = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextButton);
      
      act(() => {
        vi.advanceTimersByTime(500); // Wait for animation
      });
      
      // Should be at step 2
      await waitFor(() => {
        expect(screen.getByText('2 / 5')).toBeInTheDocument();
      });
      
      // Continue to step 3
      await userEvent.click(screen.getByRole('button', { name: /next/i }));
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(screen.getByText('3 / 5')).toBeInTheDocument();
      });
      
      // Continue to step 4
      await userEvent.click(screen.getByRole('button', { name: /next/i }));
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(screen.getByText('4 / 5')).toBeInTheDocument();
      });
      
      // Continue to step 5 (completion)
      await userEvent.click(screen.getByRole('button', { name: /next/i }));
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(screen.getByText('5 / 5')).toBeInTheDocument();
      });
      
      // Should show restart button on last step
      expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
    });

    it('should navigate backward through steps', async () => {
      renderDemo();
      
      // Navigate to step 3
      await userEvent.click(screen.getByRole('button', { name: /next/i }));
      act(() => { vi.advanceTimersByTime(500); });
      
      await userEvent.click(screen.getByRole('button', { name: /next/i }));
      act(() => { vi.advanceTimersByTime(500); });
      
      await waitFor(() => {
        expect(screen.getByText('3 / 5')).toBeInTheDocument();
      });
      
      // Navigate backward
      await userEvent.click(screen.getByRole('button', { name: /previous/i }));
      act(() => { vi.advanceTimersByTime(500); });
      
      await waitFor(() => {
        expect(screen.getByText('2 / 5')).toBeInTheDocument();
      });
    });
  });

  describe('Auto-Advance Functionality', () => {
    it('should auto-advance after delay when enabled', async () => {
      renderDemo();
      
      // Should start at step 1
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
      
      // Wait for auto-advance delay (5000ms)
      act(() => {
        vi.advanceTimersByTime(5500); // 5000ms delay + 500ms animation
      });
      
      // Should have advanced to step 2
      await waitFor(() => {
        expect(screen.getByText('2 / 5')).toBeInTheDocument();
      });
    });

    it('should cancel auto-advance on manual navigation', async () => {
      renderDemo();
      
      // Wait partway through auto-advance delay
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      
      // Manually navigate
      await userEvent.click(screen.getByRole('button', { name: /next/i }));
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      // Should be at step 2
      await waitFor(() => {
        expect(screen.getByText('2 / 5')).toBeInTheDocument();
      });
      
      // Wait for what would have been the original auto-advance time
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      
      // Should have auto-advanced to step 3 (not step 4)
      await waitFor(() => {
        expect(screen.getByText('3 / 5')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should navigate forward with right arrow key', async () => {
      renderDemo();
      
      // Press right arrow
      await userEvent.keyboard('{ArrowRight}');
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(screen.getByText('2 / 5')).toBeInTheDocument();
      });
    });

    it('should navigate backward with left arrow key', async () => {
      renderDemo();
      
      // Navigate to step 2 first
      await userEvent.keyboard('{ArrowRight}');
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(screen.getByText('2 / 5')).toBeInTheDocument();
      });
      
      // Navigate back
      await userEvent.keyboard('{ArrowLeft}');
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        expect(screen.getByText('1 / 5')).toBeInTheDocument();
      });
    });

    it('should show keyboard hint', () => {
      renderDemo();
      
      expect(screen.getByText(/Use ← → arrow keys to navigate/i)).toBeInTheDocument();
    });
  });

  describe('Restart Functionality', () => {
    it('should restart demo from completion step', async () => {
      renderDemo();
      
      // Navigate to last step
      for (let i = 0; i < 4; i++) {
        await userEvent.click(screen.getByRole('button', { name: /next/i }));
        act(() => {
          vi.advanceTimersByTime(500);
        });
      }
      
      await waitFor(() => {
        expect(screen.getByText('5 / 5')).toBeInTheDocument();
      });
      
      // Click restart
      await userEvent.click(screen.getByRole('button', { name: /restart/i }));
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      // Should be back at step 1
      await waitFor(() => {
        expect(screen.getByText('1 / 5')).toBeInTheDocument();
      });
    });
  });

  describe('Typing Animations', () => {
    it('should display typing animations on first visit', async () => {
      renderDemo();
      
      // Intro slide should have typing animation
      // The description text should appear gradually
      const description = screen.getByText(/Experience the future of trading/i);
      expect(description).toBeInTheDocument();
    });

    it('should display text instantly on revisit', async () => {
      renderDemo();
      
      // Navigate forward then backward
      await userEvent.click(screen.getByRole('button', { name: /next/i }));
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await userEvent.click(screen.getByRole('button', { name: /previous/i }));
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      // Text should appear instantly (no animation delay)
      await waitFor(() => {
        expect(screen.getByText(/Experience the future of trading/i)).toBeInTheDocument();
      });
    });
  });

  describe('Progress Indicators', () => {
    it('should display progress dots for all steps', () => {
      const { container } = renderDemo();
      
      // Should have 5 progress dots (one for each step)
      const progressDots = container.querySelectorAll('[role="navigation"][aria-label="Demo progress"] button');
      expect(progressDots.length).toBe(5);
    });

    it('should highlight current step in progress indicator', () => {
      const { container } = renderDemo();
      
      // First dot should be highlighted (has bg-white and scale-125)
      const progressDots = container.querySelectorAll('[role="navigation"][aria-label="Demo progress"] button');
      expect(progressDots[0].className).toContain('bg-white');
      expect(progressDots[0].className).toContain('scale-125');
    });

    it('should navigate to step when progress dot is clicked', async () => {
      const { container } = renderDemo();
      
      // Click on third progress dot
      const progressDots = container.querySelectorAll('[role="navigation"][aria-label="Demo progress"] button');
      await userEvent.click(progressDots[2]);
      
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      // Should be at step 3
      await waitFor(() => {
        expect(screen.getByText('3 / 5')).toBeInTheDocument();
      });
    });
  });

  describe('Gradient Background', () => {
    it('should render gradient background', () => {
      const { container } = renderDemo();
      
      // Check for gradient classes
      const background = container.querySelector('.bg-gradient-to-br');
      expect(background).toBeInTheDocument();
      expect(background?.className).toContain('from-gray-900');
      expect(background?.className).toContain('via-gray-800');
      expect(background?.className).toContain('to-gray-900');
    });
  });

  describe('Button States', () => {
    it('should disable previous button on first step', () => {
      renderDemo();
      
      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    it('should enable previous button after navigating forward', async () => {
      renderDemo();
      
      await userEvent.click(screen.getByRole('button', { name: /next/i }));
      act(() => {
        vi.advanceTimersByTime(500);
      });
      
      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /previous/i });
        expect(prevButton).not.toBeDisabled();
      });
    });

    it('should show restart button instead of next on last step', async () => {
      renderDemo();
      
      // Navigate to last step
      for (let i = 0; i < 4; i++) {
        await userEvent.click(screen.getByRole('button', { name: /next/i }));
        act(() => {
          vi.advanceTimersByTime(500);
        });
      }
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render on mobile viewport', () => {
      // Set mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      renderDemo();
      
      // Should render without errors
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });

    it('should render on desktop viewport', () => {
      // Set desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      
      renderDemo();
      
      // Should render without errors
      expect(screen.getByText('1 / 5')).toBeInTheDocument();
    });
  });
});
