import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardGrid } from './CardGrid';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';

// Mock SwipeCard component to avoid context dependencies
vi.mock('./SwipeCard', () => ({
  SwipeCard: ({ item, onSwipeLeft, onSwipeRight }: any) => (
    <div data-testid={`card-${item.id}`}>
      <h3>{item.title}</h3>
      <button onClick={onSwipeLeft}>Swipe Left</button>
      <button onClick={onSwipeRight}>Swipe Right</button>
    </div>
  ),
}));

describe('CardGrid Responsive Layout', () => {
  const mockItems: Item[] = Array.from({ length: 5 }, (_, i) => ({
    id: `item-${i}`,
    title: `Item ${i}`,
    description: 'Test item',
    category: 'Electronics',
    condition: 'Good',
    images: ['https://example.com/image.jpg'],
    ownerId: 'owner1',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'available',
    location: { city: 'Test City', state: 'TS' },
  }));

  const mockOwnerProfiles = new Map<string, UserProfile>([
    [
      'owner1',
      {
        uid: 'owner1',
        email: 'owner@test.com',
        firstName: 'Test',
        lastName: 'Owner',
        location: { city: 'Test City', state: 'TS' },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  ]);

  const mockOnSwipe = vi.fn();
  const mockAnimatingCards = new Set<string>();

  it('applies correct CSS grid classes for responsive layout', () => {
    const { container } = render(
      <CardGrid
        items={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        animatingCards={mockAnimatingCards}
        loadingSlots={0}
      />
    );

    const grid = container.querySelector('.card-grid');
    expect(grid).toBeInTheDocument();
    
    // Check that the grid has the card-grid class which contains responsive styles
    expect(grid).toHaveClass('card-grid');
  });

  it('renders correct number of cards based on viewport', () => {
    render(
      <CardGrid
        items={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        animatingCards={mockAnimatingCards}
        loadingSlots={0}
      />
    );

    // All 5 items should be rendered (viewport determines visible count via CSS)
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(5);
  });

  it('includes responsive CSS media queries in styles', () => {
    const { container } = render(
      <CardGrid
        items={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        animatingCards={mockAnimatingCards}
        loadingSlots={0}
      />
    );

    // Check that style tag exists with responsive styles
    const styleTag = container.querySelector('style');
    expect(styleTag).toBeInTheDocument();
    
    const styles = styleTag?.textContent || '';
    
    // Verify all required breakpoints are present
    expect(styles).toContain('@media (min-width: 1280px)'); // Desktop
    expect(styles).toContain('@media (min-width: 768px) and (max-width: 1279px)'); // Tablet
    expect(styles).toContain('@media (min-width: 640px) and (max-width: 767px)'); // Mobile landscape
    expect(styles).toContain('@media (max-width: 639px)'); // Mobile portrait
    
    // Verify grid column configurations
    expect(styles).toContain('grid-template-columns: repeat(3, 1fr)'); // Desktop 3 columns
    expect(styles).toContain('grid-template-columns: repeat(2, 1fr)'); // Tablet/Mobile portrait 2 columns
    
    // Verify max-width constraints
    expect(styles).toContain('max-width: 1400px'); // Desktop
    expect(styles).toContain('max-width: 900px'); // Tablet
    expect(styles).toContain('max-width: 700px'); // Mobile landscape
    expect(styles).toContain('max-width: 500px'); // Mobile portrait
  });

  it('applies touch-action: none to prevent browser gestures', () => {
    const { container } = render(
      <CardGrid
        items={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        animatingCards={mockAnimatingCards}
        loadingSlots={0}
      />
    );

    const styleTag = container.querySelector('style');
    const styles = styleTag?.textContent || '';
    
    // Verify touch-action is set to prevent browser gestures during swipe
    expect(styles).toContain('touch-action: none');
  });

  it('includes gap spacing that varies by breakpoint', () => {
    const { container } = render(
      <CardGrid
        items={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        animatingCards={mockAnimatingCards}
        loadingSlots={0}
      />
    );

    const styleTag = container.querySelector('style');
    const styles = styleTag?.textContent || '';
    
    // Verify different gap sizes for different breakpoints
    expect(styles).toContain('gap: 1.5rem'); // Desktop
    expect(styles).toContain('gap: 1.25rem'); // Tablet
    expect(styles).toContain('gap: 0.75rem'); // Mobile
  });
});
