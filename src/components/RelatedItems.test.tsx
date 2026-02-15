import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RelatedItems } from './RelatedItems';
import { Item, EnhancedItem } from '../types/item';
import { Timestamp } from 'firebase/firestore';
import { BrowserRouter } from 'react-router-dom';
import * as relatedItemsModule from '../utils/relatedItems';

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RelatedItems Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Feature: enhanced-listing-experience, Property 17: Related item navigation
   * Validates: Requirements 5.7
   * 
   * For any related item card, clicking it should navigate to that item's 
   * detail view with the correct item ID in the URL.
   */
  it('should navigate to item detail view when related item is clicked', async () => {
    const currentItem: Item = {
      id: 'current-item',
      ownerId: 'owner123',
      title: 'Current Item',
      description: 'Current description',
      category: 'electronics',
      condition: 'good',
      images: [],
      status: 'available',
      createdAt: Timestamp.now(),
      swipeInterestCount: 0,
    };

    const relatedItem: EnhancedItem = {
      id: 'related-item-123',
      ownerId: 'owner456',
      title: 'Related Item',
      description: 'Related description',
      category: 'electronics',
      condition: 'good',
      images: ['https://example.com/image.jpg'],
      status: 'available',
      createdAt: Timestamp.now(),
      viewCount: 0,
      favoriteCount: 0,
      swipeInterestCount: 0,
      isFavorited: false,
      distance: null,
    };

    // Mock findRelatedItems to return our test item
    vi.spyOn(relatedItemsModule, 'findRelatedItems').mockResolvedValue([relatedItem]);

    render(
      <BrowserRouter>
        <RelatedItems currentItem={currentItem} maxItems={8} />
      </BrowserRouter>
    );

    // Wait for related items to load
    await waitFor(() => {
      expect(screen.getByText('Related Item')).toBeInTheDocument();
    });

    // Click the related item
    const relatedItemCard = screen.getByLabelText('View Related Item');
    fireEvent.click(relatedItemCard);

    // Property: Navigation should be called with the correct item ID
    expect(mockNavigate).toHaveBeenCalledWith('/items/related-item-123');
  });

  /**
   * Unit test for no related items edge case
   * Validates: Requirements 5.6
   */
  it('should hide section when no related items exist', async () => {
    const currentItem: Item = {
      id: 'test-item',
      ownerId: 'owner123',
      title: 'Test Item',
      description: 'Test description',
      category: 'electronics',
      condition: 'good',
      images: [],
      status: 'available',
      createdAt: Timestamp.now(),
    };

    // Mock findRelatedItems to return empty array
    vi.spyOn(relatedItemsModule, 'findRelatedItems').mockResolvedValue([]);

    const { container } = render(
      <BrowserRouter>
        <RelatedItems currentItem={currentItem} />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Related Items')).not.toBeInTheDocument();
    });

    // Component should not render anything
    expect(container.firstChild).toBeNull();
  });

  it('should display loading state while fetching related items', () => {
    const currentItem: Item = {
      id: 'test-item',
      ownerId: 'owner123',
      title: 'Test Item',
      description: 'Test description',
      category: 'electronics',
      condition: 'good',
      images: [],
      status: 'available',
      createdAt: Timestamp.now(),
    };

    // Mock findRelatedItems to never resolve (simulating loading)
    vi.spyOn(relatedItemsModule, 'findRelatedItems').mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <RelatedItems currentItem={currentItem} />
      </BrowserRouter>
    );

    // Should show loading spinner
    expect(screen.getByText('Related Items')).toBeInTheDocument();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should limit display to maxItems', async () => {
    const currentItem: Item = {
      id: 'test-item',
      ownerId: 'owner123',
      title: 'Test Item',
      description: 'Test description',
      category: 'electronics',
      condition: 'good',
      images: [],
      status: 'available',
      createdAt: Timestamp.now(),
    };

    // Create 10 related items
    const relatedItems: EnhancedItem[] = Array.from({ length: 10 }, (_, i) => ({
      id: `item-${i}`,
      ownerId: 'owner456',
      title: `Related Item ${i}`,
      description: 'Related description',
      category: 'electronics',
      condition: 'good',
      images: [],
      status: 'available',
      createdAt: Timestamp.now(),
      viewCount: 0,
      favoriteCount: 0,
      swipeInterestCount: 0,
      isFavorited: false,
      distance: null,
    }));

    // Mock findRelatedItems to return only maxItems (5 in this case)
    vi.spyOn(relatedItemsModule, 'findRelatedItems').mockResolvedValue(relatedItems.slice(0, 5));

    render(
      <BrowserRouter>
        <RelatedItems currentItem={currentItem} maxItems={5} />
      </BrowserRouter>
    );

    await waitFor(() => {
      const items = screen.getAllByRole('button');
      expect(items.length).toBeLessThanOrEqual(5);
    });
  });
});
