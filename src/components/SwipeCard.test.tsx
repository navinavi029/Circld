import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
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

const mockOwnerProfile: UserProfile = {
  uid: 'owner1',
  email: 'owner@example.com',
  firstName: 'Item',
  lastName: 'Owner',
  location: 'Owner City',
  coordinates: { lat: 40.7580, lng: -73.9855 },
  photoUrl: 'https://example.com/photo.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockItem: Item = {
  id: 'item1',
  title: 'Test Item',
  description: 'This is a test item description that should be displayed on the card',
  category: 'electronics',
  condition: 'like-new',
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  ownerId: 'owner1',
  createdAt: new Date(),
  updatedAt: new Date(),
  status: 'available',
};

describe('SwipeCard', () => {
  const mockOnSwipeLeft = vi.fn();
  const mockOnSwipeRight = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders item information correctly', () => {
      render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      expect(screen.getByText('Test Item')).toBeInTheDocument();
      expect(screen.getByText(/This is a test item description/)).toBeInTheDocument();
      expect(screen.getByText('like new')).toBeInTheDocument();
      expect(screen.getByText('electronics')).toBeInTheDocument();
      expect(screen.getByText('Item Owner')).toBeInTheDocument();
    });

    it('renders in compact mode with smaller styling', () => {
      const { container } = render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
          compact={true}
        />
      );

      // Check for compact mode classes
      const cardContainer = container.querySelector('.rounded-2xl');
      expect(cardContainer).toBeInTheDocument();

      // Check title has compact size
      const title = screen.getByText('Test Item');
      expect(title).toHaveClass('text-xl');

      // Check description has compact size
      const description = screen.getByText(/This is a test item description/);
      expect(description).toHaveClass('text-sm', 'line-clamp-2');
    });

    it('renders in normal mode with larger styling', () => {
      const { container } = render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
          compact={false}
        />
      );

      // Check for normal mode classes
      const cardContainer = container.querySelector('.rounded-3xl');
      expect(cardContainer).toBeInTheDocument();

      // Check title has normal size
      const title = screen.getByText('Test Item');
      expect(title).toHaveClass('text-2xl');

      // Check description has normal size
      const description = screen.getByText(/This is a test item description/);
      expect(description).toHaveClass('text-base', 'line-clamp-3');
    });

    it('displays owner profile photo when available', () => {
      render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const ownerPhoto = screen.getByAltText('Item Owner');
      expect(ownerPhoto).toBeInTheDocument();
      expect(ownerPhoto).toHaveAttribute('src', 'https://example.com/photo.jpg');
    });

    it('displays owner initials when photo is not available', () => {
      const ownerWithoutPhoto = { ...mockOwnerProfile, photoUrl: '' };
      render(
        <SwipeCard
          item={mockItem}
          ownerProfile={ownerWithoutPhoto}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      expect(screen.getByText('IO')).toBeInTheDocument(); // Item Owner initials
    });

    it('displays image navigation controls when multiple images exist', () => {
      render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to image 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to image 2')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('triggers swipe left on left arrow key press', () => {
      render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = screen.getByRole('button', { name: /Swipe card for Test Item/ });
      fireEvent.keyDown(card, { key: 'ArrowLeft' });

      expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
    });

    it('triggers swipe right on right arrow key press', () => {
      render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = screen.getByRole('button', { name: /Swipe card for Test Item/ });
      fireEvent.keyDown(card, { key: 'ArrowRight' });

      expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
    });

    it('works in compact mode', () => {
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
      
      fireEvent.keyDown(card, { key: 'ArrowLeft' });
      expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(card, { key: 'ArrowRight' });
      expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mouse Swipe Gestures', () => {
    it('triggers swipe right when dragged right beyond threshold', async () => {
      render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = screen.getByRole('button', { name: /Swipe card for Test Item/ });

      // Simulate drag right beyond threshold (100px)
      fireEvent.mouseDown(card, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(window, { clientX: 150, clientY: 0 });
      fireEvent.mouseUp(window);

      await waitFor(() => {
        expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
      });
    });

    it('triggers swipe left when dragged left beyond threshold', async () => {
      render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = screen.getByRole('button', { name: /Swipe card for Test Item/ });

      // Simulate drag left beyond threshold (100px)
      fireEvent.mouseDown(card, { clientX: 200, clientY: 0 });
      fireEvent.mouseMove(window, { clientX: 50, clientY: 0 });
      fireEvent.mouseUp(window);

      await waitFor(() => {
        expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
      });
    });

    it('does not trigger swipe when dragged less than threshold', async () => {
      render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = screen.getByRole('button', { name: /Swipe card for Test Item/ });

      // Simulate drag less than threshold (50px)
      fireEvent.mouseDown(card, { clientX: 100, clientY: 0 });
      fireEvent.mouseMove(window, { clientX: 150, clientY: 0 });
      fireEvent.mouseUp(window);

      await waitFor(() => {
        expect(mockOnSwipeLeft).not.toHaveBeenCalled();
        expect(mockOnSwipeRight).not.toHaveBeenCalled();
      }, { timeout: 500 });
    });

    it('works correctly in compact mode', async () => {
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

      // Test swipe right in compact mode
      fireEvent.mouseDown(card, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(window, { clientX: 150, clientY: 0 });
      fireEvent.mouseUp(window);

      await waitFor(() => {
        expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Touch Swipe Gestures', () => {
    it('triggers swipe right when touch dragged right beyond threshold', async () => {
      render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = screen.getByRole('button', { name: /Swipe card for Test Item/ });

      // Simulate touch drag right beyond threshold
      fireEvent.touchStart(card, { touches: [{ clientX: 0, clientY: 0 }] });
      fireEvent.touchMove(card, { touches: [{ clientX: 150, clientY: 0 }] });
      fireEvent.touchEnd(card);

      await waitFor(() => {
        expect(mockOnSwipeRight).toHaveBeenCalledTimes(1);
      });
    });

    it('triggers swipe left when touch dragged left beyond threshold', async () => {
      render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = screen.getByRole('button', { name: /Swipe card for Test Item/ });

      // Simulate touch drag left beyond threshold
      fireEvent.touchStart(card, { touches: [{ clientX: 200, clientY: 0 }] });
      fireEvent.touchMove(card, { touches: [{ clientX: 50, clientY: 0 }] });
      fireEvent.touchEnd(card);

      await waitFor(() => {
        expect(mockOnSwipeLeft).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Visual Feedback', () => {
    it('shows green overlay when dragging right', () => {
      const { container } = render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = screen.getByRole('button', { name: /Swipe card for Test Item/ });

      // Start dragging right
      fireEvent.mouseDown(card, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(window, { clientX: 50, clientY: 0 });

      // Check for green overlay with LIKE text
      expect(screen.getByText('LIKE')).toBeInTheDocument();
      
      // Cleanup
      fireEvent.mouseUp(window);
    });

    it('shows red overlay when dragging left', () => {
      const { container } = render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = screen.getByRole('button', { name: /Swipe card for Test Item/ });

      // Start dragging left
      fireEvent.mouseDown(card, { clientX: 100, clientY: 0 });
      fireEvent.mouseMove(window, { clientX: 50, clientY: 0 });

      // Check for red overlay with PASS text
      expect(screen.getByText('PASS')).toBeInTheDocument();
      
      // Cleanup
      fireEvent.mouseUp(window);
    });

    it('visual feedback works in compact mode', () => {
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

      // Test green overlay in compact mode
      fireEvent.mouseDown(card, { clientX: 0, clientY: 0 });
      fireEvent.mouseMove(window, { clientX: 50, clientY: 0 });
      expect(screen.getByText('LIKE')).toBeInTheDocument();
      fireEvent.mouseUp(window);

      // Test red overlay in compact mode
      fireEvent.mouseDown(card, { clientX: 100, clientY: 0 });
      fireEvent.mouseMove(window, { clientX: 50, clientY: 0 });
      expect(screen.getByText('PASS')).toBeInTheDocument();
      fireEvent.mouseUp(window);
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      const card = screen.getByRole('button', { name: /Swipe card for Test Item/ });
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('provides screen reader instructions', () => {
      render(
        <SwipeCard
          item={mockItem}
          ownerProfile={mockOwnerProfile}
          onSwipeLeft={mockOnSwipeLeft}
          onSwipeRight={mockOnSwipeRight}
        />
      );

      expect(screen.getByText(/Use arrow keys to swipe/)).toBeInTheDocument();
    });
  });
});
