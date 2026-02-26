import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import { SwipeCard } from './SwipeCard';
import { renderWithProviders, mockProfile, mockOwnerProfile } from '../test/test-utils';
import { Item } from '../types/item';

// Mock item for testing
const mockItem: Item = {
  id: 'test-item-id',
  title: 'Test Item',
  description: 'This is a test item description',
  category: 'electronics',
  condition: 'like-new',
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  userId: 'owner-user-id',
  status: 'available',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('SwipeCard', () => {
  let mockOnSwipeLeft: ReturnType<typeof vi.fn>;
  let mockOnSwipeRight: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSwipeLeft = vi.fn();
    mockOnSwipeRight = vi.fn();
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render item title and description', () => {
      const { getByText } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      expect(getByText('Test Item')).toBeInTheDocument();
      expect(getByText('This is a test item description')).toBeInTheDocument();
    });

    it('should render owner profile information', () => {
      const { getByText } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      expect(getByText('Owner User')).toBeInTheDocument();
    });

    it('should render item condition badge', () => {
      const { getByText } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      expect(getByText('like new')).toBeInTheDocument();
    });

    it('should render item category badge', () => {
      const { getByText } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      expect(getByText('electronics')).toBeInTheDocument();
    });

    it('should render item images', () => {
      const { getByAltText } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const image = getByAltText('Test Item') as HTMLImageElement;
      expect(image).toBeInTheDocument();
      expect(image.src).toBe('https://example.com/image1.jpg');
    });
  });

  describe('Image Navigation', () => {
    it('should show image navigation buttons when multiple images exist', () => {
      const { getByLabelText } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      expect(getByLabelText('Previous image')).toBeInTheDocument();
      expect(getByLabelText('Next image')).toBeInTheDocument();
    });

    it('should navigate to next image when next button is clicked', () => {
      const { getByLabelText, getByAltText } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const nextButton = getByLabelText('Next image');
      fireEvent.click(nextButton);

      const image = getByAltText('Test Item') as HTMLImageElement;
      expect(image.src).toBe('https://example.com/image2.jpg');
    });

    it('should navigate to previous image when previous button is clicked', () => {
      const { getByLabelText, getByAltText } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      // First go to next image
      const nextButton = getByLabelText('Next image');
      fireEvent.click(nextButton);

      // Then go back to previous
      const prevButton = getByLabelText('Previous image');
      fireEvent.click(prevButton);

      const image = getByAltText('Test Item') as HTMLImageElement;
      expect(image.src).toBe('https://example.com/image1.jpg');
    });
  });

  describe('Keyboard Swipe Interactions', () => {
    it('should call onSwipeLeft when left arrow key is pressed', async () => {
      const { container } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
      
      if (card) {
        fireEvent.keyDown(card, { key: 'ArrowLeft' });
      }

      await waitFor(() => {
        expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });

    it('should call onSwipeRight when right arrow key is pressed', async () => {
      const { container } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
      
      if (card) {
        fireEvent.keyDown(card, { key: 'ArrowRight' });
      }

      await waitFor(() => {
        expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });
  });

  describe('Mouse Drag Interactions', () => {
    it('should call onSwipeRight when dragged right beyond threshold', async () => {
      const { container } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
      
      if (card) {
        fireEvent.mouseDown(card, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(window, { clientX: 250, clientY: 100 });
        fireEvent.mouseUp(window);
      }

      await waitFor(() => {
        expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });

    it('should call onSwipeLeft when dragged left beyond threshold', async () => {
      const { container } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
      
      if (card) {
        fireEvent.mouseDown(card, { clientX: 250, clientY: 100 });
        fireEvent.mouseMove(window, { clientX: 100, clientY: 100 });
        fireEvent.mouseUp(window);
      }

      await waitFor(() => {
        expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });

    it('should not trigger swipe when drag is below threshold', async () => {
      const { container } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
      
      if (card) {
        fireEvent.mouseDown(card, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(window, { clientX: 150, clientY: 100 });
        fireEvent.mouseUp(window);
      }

      // Wait a bit to ensure no callback is triggered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(mockOnSwipeLeft).not.toHaveBeenCalled();
      expect(mockOnSwipeRight).not.toHaveBeenCalled();
    });
  });

  describe('Touch Swipe Interactions', () => {
    it('should call onSwipeRight when swiped right beyond threshold', async () => {
      const { container } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
      
      if (card) {
        fireEvent.touchStart(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchMove(card, {
          touches: [{ clientX: 250, clientY: 100 }],
        });
        fireEvent.touchEnd(card);
      }

      await waitFor(() => {
        expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });

    it('should call onSwipeLeft when swiped left beyond threshold', async () => {
      const { container } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
      
      if (card) {
        fireEvent.touchStart(card, {
          touches: [{ clientX: 250, clientY: 100 }],
        });
        fireEvent.touchMove(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchEnd(card);
      }

      await waitFor(() => {
        expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });
  });

  describe('Compact Mode', () => {
    it('should render in compact mode when compact prop is true', () => {
      const { container } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
          compact={true}
        />
      );

      // Check for compact-specific classes
      const compactElements = container.querySelectorAll('.text-xl, .p-4, .text-sm');
      expect(compactElements.length).toBeGreaterThan(0);
    });
  });

  describe('Duplicate Swipe Prevention', () => {
    it('should prevent duplicate right swipes via keyboard', async () => {
      const { container } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
      
      if (card) {
        // First swipe
        fireEvent.keyDown(card, { key: 'ArrowRight' });
        // Attempt second swipe immediately
        fireEvent.keyDown(card, { key: 'ArrowRight' });
        // Attempt third swipe
        fireEvent.keyDown(card, { key: 'ArrowRight' });
      }

      await waitFor(() => {
        // Should only be called once despite multiple attempts
        expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });

    it('should prevent duplicate left swipes via keyboard', async () => {
      const { container } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
      
      if (card) {
        // First swipe
        fireEvent.keyDown(card, { key: 'ArrowLeft' });
        // Attempt second swipe immediately
        fireEvent.keyDown(card, { key: 'ArrowLeft' });
        // Attempt third swipe
        fireEvent.keyDown(card, { key: 'ArrowLeft' });
      }

      await waitFor(() => {
        // Should only be called once despite multiple attempts
        expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });

    it('should prevent duplicate swipes via mouse drag', async () => {
      const { container } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
      
      if (card) {
        // First swipe
        fireEvent.mouseDown(card, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(window, { clientX: 250, clientY: 100 });
        fireEvent.mouseUp(window);
        
        // Attempt second swipe immediately
        fireEvent.mouseDown(card, { clientX: 100, clientY: 100 });
        fireEvent.mouseMove(window, { clientX: 250, clientY: 100 });
        fireEvent.mouseUp(window);
      }

      await waitFor(() => {
        // Should only be called once despite multiple attempts
        expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });

    it('should prevent duplicate swipes via touch', async () => {
      const { container } = renderWithProviders(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = container.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
      
      if (card) {
        // First swipe
        fireEvent.touchStart(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchMove(card, {
          touches: [{ clientX: 250, clientY: 100 }],
        });
        fireEvent.touchEnd(card);
        
        // Attempt second swipe immediately
        fireEvent.touchStart(card, {
          touches: [{ clientX: 100, clientY: 100 }],
        });
        fireEvent.touchMove(card, {
          touches: [{ clientX: 250, clientY: 100 }],
        });
        fireEvent.touchEnd(card);
      }

      await waitFor(() => {
        // Should only be called once despite multiple attempts
        expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
      }, { timeout: 500 });
    });
  });
});
