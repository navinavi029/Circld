import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShareMenu } from './ShareMenu';
import fc from 'fast-check';

describe('ShareMenu Component', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });
  });

  /**
   * Feature: enhanced-listing-experience, Property 10: Clipboard copy operation
   * Validates: Requirements 4.7
   * 
   * For any item, when a user clicks the copy link button, the system should 
   * call the clipboard API with the item's URL and display a confirmation message.
   */
  it('should copy item URL to clipboard and show confirmation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          itemId: fc.string({ minLength: 1 }),
          itemTitle: fc.string({ minLength: 1 }),
        }),
        async ({ itemId, itemTitle }) => {
          const mockOnClose = vi.fn();
          const mockWriteText = vi.fn().mockResolvedValue(undefined);
          
          Object.assign(navigator, {
            clipboard: {
              writeText: mockWriteText,
            },
          });

          const { unmount } = render(
            <ShareMenu
              itemId={itemId}
              itemTitle={itemTitle}
              onClose={mockOnClose}
            />
          );

          // Click copy link button
          const copyButtons = screen.getAllByLabelText('Copy link');
          const copyButton = copyButtons[copyButtons.length - 1];
          fireEvent.click(copyButton);

          // Wait for clipboard operation
          await waitFor(() => {
            expect(mockWriteText).toHaveBeenCalled();
          });

          // Property: Clipboard should be called with the correct URL
          const expectedUrl = `${window.location.origin}/items/${itemId}`;
          expect(mockWriteText).toHaveBeenCalledWith(expectedUrl);

          // Property: Confirmation message should be displayed
          await waitFor(() => {
            const confirmations = screen.queryAllByText('Link copied to clipboard!');
            expect(confirmations.length).toBeGreaterThan(0);
          });

          // Clean up
          unmount();
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display error message when clipboard operation fails', async () => {
    const mockOnClose = vi.fn();
    const mockWriteText = vi.fn().mockRejectedValue(new Error('Clipboard error'));
    
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    render(
      <ShareMenu
        itemId="test-item"
        itemTitle="Test Item"
        onClose={mockOnClose}
      />
    );

    const copyButton = screen.getByLabelText('Copy link');
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to copy link')).toBeInTheDocument();
    });
  });

  it('should close menu when backdrop is clicked', () => {
    const mockOnClose = vi.fn();

    render(
      <ShareMenu
        itemId="test-item"
        itemTitle="Test Item"
        onClose={mockOnClose}
      />
    );

    const backdrop = screen.getByLabelText('Close share menu');
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should open email client when email share is clicked', () => {
    const mockOnClose = vi.fn();

    render(
      <ShareMenu
        itemId="test-item"
        itemTitle="Test Item"
        onClose={mockOnClose}
      />
    );

    const emailButton = screen.getByLabelText('Share via email');
    fireEvent.click(emailButton);

    // Note: In a real browser, this would open the email client
    // In tests, we just verify the button works without errors
    expect(mockOnClose).not.toHaveBeenCalled(); // Menu stays open for email
  });
});
