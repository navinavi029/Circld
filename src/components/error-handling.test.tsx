import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { SwipeCard } from './SwipeCard';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';

// Mock ProfileContext
vi.mock('../contexts/ProfileContext', () => ({
  useProfile: () => ({
    profile: {
      uid: 'current-user',
      email: 'current@example.com',
      firstName: 'Current',
      lastName: 'User',
      location: 'Test City',
      coordinates: { latitude: 0, longitude: 0 },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }),
}));

describe('Error Handling for Multi-Card Scenarios', () => {
  const mockItem: Item = {
    id: 'item-1',
    title: 'Test Item',
    description: 'Test description',
    category: 'electronics',
    condition: 'like-new',
    images: ['image1.jpg'],
    ownerId: 'owner-1',
    status: 'available',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOwnerProfile: UserProfile = {
    uid: 'owner-1',
    email: 'owner@example.com',
    firstName: 'Owner',
    lastName: 'Name',
    location: 'Owner City',
    coordinates: { latitude: 0, longitude: 0 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockOnSwipeLeft = vi.fn();
  const mockOnSwipeRight = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Interrupted Gesture Handling', () => {
    it('should handle touchcancel event without crashing', () => {
      const { container } = render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]') as HTMLElement;

      // Start touch drag
      fireEvent.touchStart(card, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      // Move touch
      fireEvent.touchMove(card, {
        touches: [{ clientX: 200, clientY: 100 }],
      });

      // Cancel touch (interrupted gesture)
      fireEvent.touchCancel(card);

      // Verify callbacks were not called (gesture was cancelled)
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
    });

    it('should handle mouseleave event during drag', () => {
      const { container } = render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]') as HTMLElement;

      // Start mouse drag
      fireEvent.mouseDown(card, { clientX: 100, clientY: 100 });

      // Move mouse
      fireEvent.mouseMove(window, { clientX: 200, clientY: 100 });

      // Mouse leaves window (interrupted gesture)
      fireEvent.mouseLeave(window, { clientX: -10, clientY: 100 });

      // Verify callbacks were not called
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Simultaneous Drags Prevention', () => {
    it('should ignore new touch start when already dragging', () => {
      const { container } = render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]') as HTMLElement;

      // Start first touch drag
      fireEvent.touchStart(card, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      // Try to start second touch drag (should be ignored)
      fireEvent.touchStart(card, {
        touches: [{ clientX: 150, clientY: 100 }],
      });

      // Move first touch beyond threshold
      fireEvent.touchMove(card, {
        touches: [{ clientX: 250, clientY: 100 }],
      });

      // End first touch
      fireEvent.touchEnd(card);

      // Only one swipe should be registered
      expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
    });

    it('should ignore new mouse down when already dragging', () => {
      const { container } = render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]') as HTMLElement;

      // Start first mouse drag
      fireEvent.mouseDown(card, { clientX: 100, clientY: 100 });

      // Try to start second mouse drag (should be ignored)
      fireEvent.mouseDown(card, { clientX: 150, clientY: 100 });

      // Move mouse beyond threshold
      fireEvent.mouseMove(window, { clientX: 250, clientY: 100 });

      // End mouse drag
      fireEvent.mouseUp(window);

      // Only one swipe should be registered
      expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
    });
  });

  describe('Gesture Cancellation Edge Cases', () => {
    it('should handle touchcancel when not dragging without errors', () => {
      const { container } = render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]') as HTMLElement;

      // Cancel touch without starting drag - should not cause errors
      expect(() => {
        fireEvent.touchCancel(card);
      }).not.toThrow();

      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
    });

    it('should handle mouseleave when not dragging without errors', () => {
      render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      // Mouse leaves window without starting drag - should not cause errors
      expect(() => {
        fireEvent.mouseLeave(window, { clientX: -10, clientY: 100 });
      }).not.toThrow();

      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
    });
  });

  describe('Rapid Gesture Sequences', () => {
    it('should handle rapid touch start/cancel sequences without errors', () => {
      const { container } = render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]') as HTMLElement;

      // Rapid sequence of touch events - should not cause errors
      expect(() => {
        for (let i = 0; i < 5; i++) {
          fireEvent.touchStart(card, {
            touches: [{ clientX: 100, clientY: 100 }],
          });
          fireEvent.touchCancel(card);
        }
      }).not.toThrow();

      // Should not trigger any swipes
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
    });
  });
});
