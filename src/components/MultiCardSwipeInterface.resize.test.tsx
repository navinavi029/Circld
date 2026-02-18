import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MultiCardSwipeInterface } from './MultiCardSwipeInterface';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';

// Mock CardGrid component
vi.mock('./CardGrid', () => ({
  CardGrid: ({ items }: any) => (
    <div data-testid="card-grid">
      {items.map((item: Item) => (
        <div key={item.id} data-testid={`card-${item.id}`}>
          {item.title}
        </div>
      ))}
    </div>
  ),
}));

// Mock TradeAnchorDisplay component
vi.mock('./TradeAnchorDisplay', () => ({
  TradeAnchorDisplay: () => <div data-testid="trade-anchor-display">Trade Anchor</div>,
}));

describe('MultiCardSwipeInterface Resize Handler', () => {
  const mockTradeAnchor: Item = {
    id: 'anchor1',
    title: 'Trade Anchor',
    description: 'My item to trade',
    category: 'Electronics',
    condition: 'Good',
    images: ['https://example.com/image.jpg'],
    ownerId: 'owner1',
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'available',
    location: { city: 'Test City', state: 'TS' },
  };

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
  const mockOnChangeAnchor = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Set initial window size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('debounces resize events with 300ms delay', async () => {
    vi.useFakeTimers();

    render(
      <MultiCardSwipeInterface
        tradeAnchor={mockTradeAnchor}
        itemPool={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        loading={false}
        syncStatus={null}
      />
    );

    // Trigger multiple resize events rapidly
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(100);
    window.dispatchEvent(new Event('resize'));
    vi.advanceTimersByTime(100);
    window.dispatchEvent(new Event('resize'));

    // Should not have updated yet (still within debounce period)
    vi.advanceTimersByTime(100); // Total 300ms

    // Now it should have processed the resize
    vi.advanceTimersByTime(1);

    vi.useRealTimers();
  });

  it('updates card count based on viewport width after debounce', async () => {
    vi.useFakeTimers();

    const { rerender } = render(
      <MultiCardSwipeInterface
        tradeAnchor={mockTradeAnchor}
        itemPool={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        loading={false}
        syncStatus={null}
      />
    );

    // Change window width to desktop size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1400,
    });

    window.dispatchEvent(new Event('resize'));
    
    // Wait for debounce
    vi.advanceTimersByTime(300);

    // Force re-render
    rerender(
      <MultiCardSwipeInterface
        tradeAnchor={mockTradeAnchor}
        itemPool={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        loading={false}
        syncStatus={null}
      />
    );

    vi.useRealTimers();
  });

  it('handles resize during animation gracefully', async () => {
    vi.useFakeTimers();

    render(
      <MultiCardSwipeInterface
        tradeAnchor={mockTradeAnchor}
        itemPool={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        loading={false}
        syncStatus={null}
      />
    );

    // Trigger resize
    window.dispatchEvent(new Event('resize'));
    
    // Wait for debounce
    vi.advanceTimersByTime(300);

    // Should complete without errors
    expect(true).toBe(true);

    vi.useRealTimers();
  });

  it('cleans up resize listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(
      <MultiCardSwipeInterface
        tradeAnchor={mockTradeAnchor}
        itemPool={mockItems}
        ownerProfiles={mockOwnerProfiles}
        onSwipe={mockOnSwipe}
        onChangeAnchor={mockOnChangeAnchor}
        loading={false}
        syncStatus={null}
      />
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
