import { render } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { CardGrid } from './CardGrid';
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

describe('CardGrid Touch Support - Requirement 12.3', () => {
  const mockItems: Item[] = [
    {
      id: 'item1',
      title: 'Test Item 1',
      description: 'Description 1',
      category: 'electronics',
      condition: 'like-new',
      images: ['https://example.com/image1.jpg'],
      ownerId: 'owner1',
      location: 'Test Location',
      coordinates: { lat: 0, lng: 0 },
      createdAt: new Date(),
      status: 'available',
    },
    {
      id: 'item2',
      title: 'Test Item 2',
      description: 'Description 2',
      category: 'furniture',
      condition: 'good',
      images: ['https://example.com/image2.jpg'],
      ownerId: 'owner2',
      location: 'Test Location',
      coordinates: { lat: 0, lng: 0 },
      createdAt: new Date(),
      status: 'available',
    },
  ];

  const mockOwnerProfiles = new Map<string, UserProfile>([
    [
      'owner1',
      {
        uid: 'owner1',
        email: 'owner1@example.com',
        firstName: 'Owner',
        lastName: 'One',
        location: 'City 1',
        coordinates: { lat: 0, lng: 0 },
        photoUrl: null,
        createdAt: new Date(),
      },
    ],
    [
      'owner2',
      {
        uid: 'owner2',
        email: 'owner2@example.com',
        firstName: 'Owner',
        lastName: 'Two',
        location: 'City 2',
        coordinates: { lat: 0, lng: 0 },
        photoUrl: null,
        createdAt: new Date(),
      },
    ],
  ]);

  const mockOnSwipe = vi.fn();
  const mockAnimatingCards = new Set<string>();

  test('CardGrid has touch-action: none to prevent browser gestures', () => {
    const { container } = render(
      <CardGrid
        items={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        animatingCards={mockAnimatingCards}
        loadingSlots={0}
      />
    );

    // Find the card grid element
    const cardGrid = container.querySelector('.card-grid');
    expect(cardGrid).toBeInTheDocument();

    // Check that the style tag contains touch-action: none
    const styleTag = container.querySelector('style');
    expect(styleTag).toBeInTheDocument();
    expect(styleTag?.textContent).toContain('touch-action: none');
  });

  test('CardGrid renders multiple cards for touch interaction', () => {
    const { container } = render(
      <CardGrid
        items={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        animatingCards={mockAnimatingCards}
        loadingSlots={0}
      />
    );

    // Verify multiple cards are rendered
    const cardGridItems = container.querySelectorAll('.card-grid-item');
    expect(cardGridItems.length).toBe(2);
  });

  test('CardGrid maintains touch-action: none in responsive layouts', () => {
    const { container } = render(
      <CardGrid
        items={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        animatingCards={mockAnimatingCards}
        loadingSlots={0}
      />
    );

    // The touch-action: none should be applied to .card-grid regardless of viewport
    const styleTag = container.querySelector('style');
    const styleContent = styleTag?.textContent || '';
    
    // Verify touch-action is in the base .card-grid class, not in media queries
    const cardGridStyleMatch = styleContent.match(/\.card-grid\s*{[^}]*}/);
    expect(cardGridStyleMatch).toBeTruthy();
    expect(cardGridStyleMatch?.[0]).toContain('touch-action: none');
  });

  test('CardGrid allows individual card touch gestures', () => {
    const { container } = render(
      <CardGrid
        items={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        animatingCards={mockAnimatingCards}
        loadingSlots={0}
      />
    );

    // Verify each card is interactive (has role="button")
    const cards = container.querySelectorAll('[role="button"]');
    expect(cards.length).toBeGreaterThanOrEqual(2);
    
    // Each card should be focusable
    cards.forEach(card => {
      expect(card).toHaveAttribute('tabIndex', '0');
    });
  });
});
