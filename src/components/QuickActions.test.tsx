import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuickActions } from './QuickActions';
import fc from 'fast-check';

describe('QuickActions Component', () => {
  beforeEach(() => {
    // Mock clipboard API for ShareMenu
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });
  });

  /**
   * Feature: enhanced-listing-experience, Property 22: Quick action non-navigation
   * Validates: Requirements 8.5
   * 
   * For any listing card, clicking a quick action button (favorite or share) should 
   * perform the action without triggering navigation to the detail view.
   */
  it('should prevent navigation when quick action buttons are clicked', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          itemId: fc.string({ minLength: 1 }),
          itemTitle: fc.string({ minLength: 1 }),
          isFavorited: fc.boolean(),
        }),
        async ({ itemId, itemTitle, isFavorited }) => {
          const mockOnFavoriteToggle = vi.fn().mockResolvedValue(undefined);
          const mockCardClick = vi.fn();

          const { unmount } = render(
            <div onClick={mockCardClick} data-testid="card-wrapper">
              <QuickActions
                itemId={itemId}
                itemTitle={itemTitle}
                isFavorited={isFavorited}
                onFavoriteToggle={mockOnFavoriteToggle}
              />
            </div>
          );

          // Test favorite button click propagation
          const favoriteButton = screen.getByLabelText(
            isFavorited ? 'Remove from favorites' : 'Add to favorites'
          );
          fireEvent.click(favoriteButton);

          // Property: Clicking favorite button should not propagate to parent
          expect(mockCardClick).not.toHaveBeenCalled();
          
          // Property: Favorite toggle should be called
          await waitFor(() => {
            expect(mockOnFavoriteToggle).toHaveBeenCalledWith(itemId);
          });

          // Reset mocks
          mockCardClick.mockClear();
          mockOnFavoriteToggle.mockClear();

          // Test share button click propagation
          const shareButton = screen.getByLabelText('Share item');
          fireEvent.click(shareButton);

          // Property: Clicking share button should not propagate to parent
          expect(mockCardClick).not.toHaveBeenCalled();
          
          // Property: Share menu should open
          await waitFor(() => {
            expect(screen.getByText('Share Item')).toBeInTheDocument();
          });

          // Clean up
          unmount();
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  }, 30000);

  it('should toggle favorite status when favorite button is clicked', async () => {
    const mockOnFavoriteToggle = vi.fn().mockResolvedValue(undefined);

    render(
      <QuickActions
        itemId="test-item"
        itemTitle="Test Item"
        isFavorited={false}
        onFavoriteToggle={mockOnFavoriteToggle}
      />
    );

    const favoriteButton = screen.getByLabelText('Add to favorites');
    fireEvent.click(favoriteButton);

    await waitFor(() => {
      expect(mockOnFavoriteToggle).toHaveBeenCalledWith('test-item');
    });
  });

  it('should show loading state during favorite toggle', async () => {
    let resolveFavorite: () => void;
    const favoritePromise = new Promise<void>((resolve) => {
      resolveFavorite = resolve;
    });
    const mockOnFavoriteToggle = vi.fn().mockReturnValue(favoritePromise);

    render(
      <QuickActions
        itemId="test-item"
        itemTitle="Test Item"
        isFavorited={false}
        onFavoriteToggle={mockOnFavoriteToggle}
      />
    );

    const favoriteButton = screen.getByLabelText('Add to favorites');
    fireEvent.click(favoriteButton);

    // Should show loading spinner
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /favorites/i })).toBeDisabled();
    });

    // Resolve the promise
    resolveFavorite!();

    // Should return to normal state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /favorites/i })).not.toBeDisabled();
    });
  });

  it('should display filled heart icon when item is favorited', () => {
    const mockOnFavoriteToggle = vi.fn();

    render(
      <QuickActions
        itemId="test-item"
        itemTitle="Test Item"
        isFavorited={true}
        onFavoriteToggle={mockOnFavoriteToggle}
      />
    );

    const favoriteButton = screen.getByLabelText('Remove from favorites');
    expect(favoriteButton).toBeInTheDocument();
    
    // Check for red color class indicating favorited state
    const heartIcon = favoriteButton.querySelector('svg');
    expect(heartIcon?.classList.contains('text-red-500')).toBe(true);
  });

  it('should display outline heart icon when item is not favorited', () => {
    const mockOnFavoriteToggle = vi.fn();

    render(
      <QuickActions
        itemId="test-item"
        itemTitle="Test Item"
        isFavorited={false}
        onFavoriteToggle={mockOnFavoriteToggle}
      />
    );

    const favoriteButton = screen.getByLabelText('Add to favorites');
    expect(favoriteButton).toBeInTheDocument();
    
    // Check for gray color class indicating not favorited state
    const heartIcon = favoriteButton.querySelector('svg');
    expect(heartIcon?.classList.contains('text-gray-600')).toBe(true);
  });

  it('should open share menu when share button is clicked', async () => {
    const mockOnFavoriteToggle = vi.fn();

    render(
      <QuickActions
        itemId="test-item"
        itemTitle="Test Item"
        isFavorited={false}
        onFavoriteToggle={mockOnFavoriteToggle}
      />
    );

    const shareButton = screen.getByLabelText('Share item');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(screen.getByText('Share Item')).toBeInTheDocument();
    });
  });

  it('should close share menu when close button is clicked', async () => {
    const mockOnFavoriteToggle = vi.fn();

    render(
      <QuickActions
        itemId="test-item"
        itemTitle="Test Item"
        isFavorited={false}
        onFavoriteToggle={mockOnFavoriteToggle}
      />
    );

    // Open share menu
    const shareButton = screen.getByLabelText('Share item');
    fireEvent.click(shareButton);

    await waitFor(() => {
      expect(screen.getByText('Share Item')).toBeInTheDocument();
    });

    // Close share menu
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Share Item')).not.toBeInTheDocument();
    });
  });

  /**
   * Unit test for share menu display
   * Validates: Requirements 8.7
   * 
   * Test share menu opens with correct options (copy link, email, social media)
   */
  it('should display share menu with all sharing options', async () => {
    const mockOnFavoriteToggle = vi.fn();

    render(
      <QuickActions
        itemId="test-item"
        itemTitle="Test Item"
        isFavorited={false}
        onFavoriteToggle={mockOnFavoriteToggle}
      />
    );

    // Click share button
    const shareButton = screen.getByLabelText('Share item');
    fireEvent.click(shareButton);

    // Verify share menu is displayed
    await waitFor(() => {
      expect(screen.getByText('Share Item')).toBeInTheDocument();
    });

    // Verify all share options are present
    expect(screen.getByLabelText('Copy link')).toBeInTheDocument();
    expect(screen.getByText('Copy Link')).toBeInTheDocument();
    expect(screen.getByText('Copy URL to clipboard')).toBeInTheDocument();

    expect(screen.getByLabelText('Share via email')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Share via email')).toBeInTheDocument();

    expect(screen.getByLabelText('Share on Twitter')).toBeInTheDocument();
    expect(screen.getByText('Twitter')).toBeInTheDocument();
    expect(screen.getByText('Share on Twitter')).toBeInTheDocument();

    expect(screen.getByLabelText('Share on Facebook')).toBeInTheDocument();
    expect(screen.getByText('Facebook')).toBeInTheDocument();
    expect(screen.getByText('Share on Facebook')).toBeInTheDocument();
  });
});
