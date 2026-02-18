import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { SwipeCard } from './SwipeCard';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';

// Mock the contexts
vi.mock('../contexts/ProfileContext', () => ({
  useProfile: () => ({
    profile: {
      uid: 'user1',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
      location: 'Test City',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      photoUrl: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    loading: false,
  }),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'user1' },
    loading: false,
  }),
}));

describe('SwipeCard Touch Gesture Support - Requirement 12.3', () => {
  const mockItem: Item = {
    id: 'test-item-1',
    title: 'Test Item',
    description: 'Test description',
    category: 'electronics',
    condition: 'like-new',
    images: ['https://example.com/image.jpg'],
    ownerId: 'owner-1',
    location: 'Test Location',
    coordinates: { lat: 0, lng: 0 },
    createdAt: new Date(),
    status: 'available',
  };

  const mockOwnerProfile: UserProfile = {
    uid: 'owner-1',
    email: 'owner@example.com',
    firstName: 'Owner',
    lastName: 'User',
    location: 'Owner City',
    coordinates: { lat: 0, lng: 0 },
    photoUrl: null,
    createdAt: new Date(),
  };

  const mockOnSwipeLeft = vi.fn();
  const mockOnSwipeRight = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('touch events are properly attached to card', () => {
    const { container } = render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    const card = container.querySelector('[role="button"]');
    expect(card).toBeInTheDocument();
    
    // Verify card has touch event handlers by checking it's interactive
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  test('touch drag right beyond threshold triggers swipe right', async () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    const card = screen.getByRole('button', { name: /Swipe card for Test Item/ });
    
    // Simulate touch start
    fireEvent.touchStart(card, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    // Simulate touch move beyond threshold (100px + 50px = 150px)
    fireEvent.touchMove(card, {
      touches: [{ clientX: 250, clientY: 100 }],
    });

    // Simulate touch end
    fireEvent.touchEnd(card);

    // Should trigger swipe right
    await waitFor(() => {
      expect(mockOnSwipeRight).toHaveBeenCalled();
    });
    expect(mockOnSwipeLeft).not.toHaveBeenCalled();
  });

  test('touch drag left beyond threshold triggers swipe left', async () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    const card = screen.getByRole('button', { name: /Swipe card for Test Item/ });
    
    // Simulate touch start
    fireEvent.touchStart(card, {
      touches: [{ clientX: 250, clientY: 100 }],
    });

    // Simulate touch move beyond threshold (250px - 150px = 100px left)
    fireEvent.touchMove(card, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    // Simulate touch end
    fireEvent.touchEnd(card);

    // Should trigger swipe left
    await waitFor(() => {
      expect(mockOnSwipeLeft).toHaveBeenCalled();
    });
    expect(mockOnSwipeRight).not.toHaveBeenCalled();
  });

  test('touch drag below threshold does not trigger swipe', async () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    const card = screen.getByRole('button', { name: /Swipe card for Test Item/ });
    
    // Simulate touch start
    fireEvent.touchStart(card, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    // Simulate touch move below threshold (only 50px)
    fireEvent.touchMove(card, {
      touches: [{ clientX: 150, clientY: 100 }],
    });

    // Simulate touch end
    fireEvent.touchEnd(card);

    // Should not trigger any swipe
    await waitFor(() => {
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
    }, { timeout: 500 });
  });

  test('touch cancel resets card position without triggering swipe', async () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    const card = screen.getByRole('button', { name: /Swipe card for Test Item/ });
    
    // Simulate touch start
    fireEvent.touchStart(card, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    // Simulate touch move
    fireEvent.touchMove(card, {
      touches: [{ clientX: 200, clientY: 100 }],
    });

    // Simulate touch cancel (interrupted gesture)
    fireEvent.touchCancel(card);

    // Should not trigger any swipe
    await waitFor(() => {
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
    }, { timeout: 500 });
  });

  test('prevents multiple simultaneous touch drags', async () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
      />
    );

    const card = screen.getByRole('button', { name: /Swipe card for Test Item/ });
    
    // Simulate first touch start
    fireEvent.touchStart(card, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    // Try to start second touch (should be ignored)
    fireEvent.touchStart(card, {
      touches: [{ clientX: 200, clientY: 100 }],
    });

    // Move first touch beyond threshold
    fireEvent.touchMove(card, {
      touches: [{ clientX: 250, clientY: 100 }],
    });

    // End first touch
    fireEvent.touchEnd(card);

    // Should only trigger one swipe
    await waitFor(() => {
      expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
    });
  });

  test('touch gestures work in compact mode', async () => {
    render(
      <SwipeCard
        item={mockItem}
        ownerProfile={mockOwnerProfile}
        onSwipeLeft={mockOnSwipeLeft}
        onSwipeRight={mockOnSwipeRight}
        compact={true}
      />
    );

    const card = screen.getByRole('button', { name: /Swipe card for Test Item/ });
    
    // Simulate touch start
    fireEvent.touchStart(card, {
      touches: [{ clientX: 100, clientY: 100 }],
    });

    // Simulate touch move beyond threshold
    fireEvent.touchMove(card, {
      touches: [{ clientX: 250, clientY: 100 }],
    });

    // Simulate touch end
    fireEvent.touchEnd(card);

    // Should trigger swipe right even in compact mode
    await waitFor(() => {
      expect(mockOnSwipeRight).toHaveBeenCalled();
    });
  });
});
