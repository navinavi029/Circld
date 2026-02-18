import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { CardGrid } from './CardGrid';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { Timestamp } from 'firebase/firestore';
import userEvent from '@testing-library/user-event';

// Mock SwipeCard component
vi.mock('./SwipeCard', () => ({
  SwipeCard: ({ item, onSwipeLeft, onSwipeRight }: any) => (
    <div data-testid={`card-${item.id}`}>
      <h3>{item.title}</h3>
      <button onClick={onSwipeLeft}>Swipe Left</button>
      <button onClick={onSwipeRight}>Swipe Right</button>
    </div>
  ),
}));

describe('CardGrid', () => {
  const mockTimestamp = Timestamp.now();
  
  const mockItems: Item[] = [
    {
      id: 'item1',
      ownerId: 'user1',
      title: 'Test Item 1',
      description: 'Description 1',
      category: 'electronics',
      condition: 'good',
      images: ['image1.jpg'],
      status: 'available',
      createdAt: mockTimestamp,
    },
    {
      id: 'item2',
      ownerId: 'user2',
      title: 'Test Item 2',
      description: 'Description 2',
      category: 'books',
      condition: 'like-new',
      images: ['image2.jpg'],
      status: 'available',
      createdAt: mockTimestamp,
    },
    {
      id: 'item3',
      ownerId: 'user1',
      title: 'Test Item 3',
      description: 'Description 3',
      category: 'furniture',
      condition: 'fair',
      images: ['image3.jpg'],
      status: 'available',
      createdAt: mockTimestamp,
    },
  ];

  const mockOwnerProfiles = new Map<string, UserProfile>([
    [
      'user1',
      {
        uid: 'user1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        location: 'New York, NY',
        coordinates: { latitude: 40.7128, longitude: -74.006 },
        eligible_to_match: true,
        createdAt: mockTimestamp,
        photoUrl: null,
        lastPhotoUpdate: null,
        lastLocationUpdate: null,
      },
    ],
    [
      'user2',
      {
        uid: 'user2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        location: 'Los Angeles, CA',
        coordinates: { latitude: 34.0522, longitude: -118.2437 },
        eligible_to_match: true,
        createdAt: mockTimestamp,
        photoUrl: null,
        lastPhotoUpdate: null,
        lastLocationUpdate: null,
      },
    ],
  ]);

  const mockOnSwipe = vi.fn();
  const mockAnimatingCards = new Set<string>();

  beforeEach(() => {
    mockOnSwipe.mockClear();
  });

  it('renders multiple cards in grid layout', () => {
    render(
      <CardGrid
        items={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        animatingCards={mockAnimatingCards}
        loadingSlots={0}
      />
    );

    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    expect(screen.getByText('Test Item 3')).toBeInTheDocument();
  });

  it('renders at least 3 cards when item pool has 3+ items', () => {
    render(
      <CardGrid
        items={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        animatingCards={mockAnimatingCards}
        loadingSlots={0}
      />
    );

    const cards = screen.getAllByTestId(/^card-/);
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });

  it('renders loading placeholders when loadingSlots > 0', () => {
    const { container } = render(
      <CardGrid
        items={[mockItems[0]]}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        animatingCards={mockAnimatingCards}
        loadingSlots={2}
      />
    );

    // Check for loading placeholders (they have animate-pulse class)
    const loadingElements = container.querySelectorAll('.animate-pulse');
    expect(loadingElements.length).toBe(2);
  });

  it('calls onSwipe with correct itemId and direction', () => {
    render(
      <CardGrid
        items={[mockItems[0]]}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        animatingCards={mockAnimatingCards}
        loadingSlots={0}
      />
    );

    const swipeLeftButton = screen.getByText('Swipe Left');
    const swipeRightButton = screen.getByText('Swipe Right');

    swipeLeftButton.click();
    expect(mockOnSwipe).toHaveBeenCalledWith('item1', 'left');

    swipeRightButton.click();
    expect(mockOnSwipe).toHaveBeenCalledWith('item1', 'right');
  });

  it('does not render cards without owner profiles', () => {
    const itemsWithMissingProfile: Item[] = [
      ...mockItems,
      {
        id: 'item4',
        ownerId: 'user3', // No profile for this user
        title: 'Test Item 4',
        description: 'Description 4',
        category: 'toys',
        condition: 'new',
        images: ['image4.jpg'],
        status: 'available',
        createdAt: mockTimestamp,
      },
    ];

    render(
      <CardGrid
        items={itemsWithMissingProfile}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        animatingCards={mockAnimatingCards}
        loadingSlots={0}
      />
    );

    expect(screen.queryByText('Test Item 4')).not.toBeInTheDocument();
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
  });

  it('applies animation classes to animating cards', () => {
    const animatingCards = new Set(['item1']);

    const { container } = render(
      <CardGrid
        items={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        animatingCards={animatingCards}
        loadingSlots={0}
      />
    );

    const animatingCard = container.querySelector('.animate-fade-out');
    expect(animatingCard).toBeInTheDocument();
  });

  it('renders empty grid when no items provided', () => {
    const { container } = render(
      <CardGrid
        items={[]}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        animatingCards={mockAnimatingCards}
        loadingSlots={0}
      />
    );

    const cards = container.querySelectorAll('[data-testid^="card-"]');
    expect(cards.length).toBe(0);
  });

  it('handles empty owner profiles map gracefully', () => {
    render(
      <CardGrid
        items={mockItems}
        ownerProfiles={new Map()}
        onSwipe={mockOnSwipe}
        animatingCards={mockAnimatingCards}
        loadingSlots={0}
      />
    );

    // Should not render any cards since no profiles are available
    const cards = screen.queryAllByTestId(/^card-/);
    expect(cards.length).toBe(0);
  });

  describe('Accessibility Features', () => {
    it('has proper ARIA labels on card grid', () => {
      render(
        <CardGrid
          items={mockItems}
          ownerProfiles={mockOwnerProfiles}
          onSwipe={mockOnSwipe}
          animatingCards={mockAnimatingCards}
          loadingSlots={0}
        />
      );

      const cardGrid = screen.getByRole('group', { name: /swipeable item cards/i });
      expect(cardGrid).toBeInTheDocument();
    });

    it('has proper ARIA labels on individual cards', () => {
      render(
        <CardGrid
          items={[mockItems[0]]}
          ownerProfiles={mockOwnerProfiles}
          onSwipe={mockOnSwipe}
          animatingCards={mockAnimatingCards}
          loadingSlots={0}
        />
      );

      const card = screen.getByRole('article', { 
        name: /card 1 of 1: test item 1 by john doe/i 
      });
      expect(card).toBeInTheDocument();
    });

    it('cards are keyboard focusable', () => {
      render(
        <CardGrid
          items={mockItems}
          ownerProfiles={mockOwnerProfiles}
          onSwipe={mockOnSwipe}
          animatingCards={mockAnimatingCards}
          loadingSlots={0}
        />
      );

      const cards = screen.getAllByRole('article');
      cards.forEach(card => {
        expect(card).toHaveAttribute('tabIndex', '0');
      });
    });

    it('announces swipe actions to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <CardGrid
          items={[mockItems[0]]}
          ownerProfiles={mockOwnerProfiles}
          onSwipe={mockOnSwipe}
          animatingCards={mockAnimatingCards}
          loadingSlots={0}
        />
      );

      const swipeRightButton = screen.getByText('Swipe Right');
      await user.click(swipeRightButton);

      // Check for screen reader announcement
      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(/test item 1 liked/i);
    });

    it('announces pass actions to screen readers', async () => {
      const user = userEvent.setup();
      
      render(
        <CardGrid
          items={[mockItems[0]]}
          ownerProfiles={mockOwnerProfiles}
          onSwipe={mockOnSwipe}
          animatingCards={mockAnimatingCards}
          loadingSlots={0}
        />
      );

      const swipeLeftButton = screen.getByText('Swipe Left');
      await user.click(swipeLeftButton);

      // Check for screen reader announcement
      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(/test item 1 passed/i);
    });

    it('includes remaining card count in announcements', async () => {
      const user = userEvent.setup();
      
      render(
        <CardGrid
          items={mockItems}
          ownerProfiles={mockOwnerProfiles}
          onSwipe={mockOnSwipe}
          animatingCards={mockAnimatingCards}
          loadingSlots={0}
        />
      );

      const swipeRightButton = screen.getAllByText('Swipe Right')[0];
      await user.click(swipeRightButton);

      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent(/2 cards remaining/i);
    });

    it('has live region for screen reader announcements', () => {
      render(
        <CardGrid
          items={mockItems}
          ownerProfiles={mockOwnerProfiles}
          onSwipe={mockOnSwipe}
          animatingCards={mockAnimatingCards}
          loadingSlots={0}
        />
      );

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });
});
