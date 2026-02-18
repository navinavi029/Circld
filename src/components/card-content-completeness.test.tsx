import { render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import { CardGrid } from './CardGrid';
import { SwipeCard } from './SwipeCard';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { Timestamp } from 'firebase/firestore';
import userEvent from '@testing-library/user-event';

// Mock the contexts for SwipeCard
vi.mock('../contexts/ProfileContext', () => ({
  useProfile: () => ({
    profile: {
      uid: 'current-user',
      email: 'current@example.com',
      firstName: 'Current',
      lastName: 'User',
      location: 'Test City',
      coordinates: { latitude: 40.7128, longitude: -74.0060 },
      photoUrl: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    loading: false,
  }),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'current-user' },
    loading: false,
  }),
}));

describe('Card Content Completeness - Task 16', () => {
  const mockTimestamp = Timestamp.now();

  const createMockItem = (overrides: Partial<Item> = {}): Item => ({
    id: 'item1',
    ownerId: 'owner1',
    title: 'Vintage Camera',
    description: 'A beautiful vintage camera in excellent condition. Perfect for photography enthusiasts.',
    category: 'electronics',
    condition: 'like-new',
    images: ['https://example.com/camera1.jpg', 'https://example.com/camera2.jpg'],
    status: 'available',
    createdAt: mockTimestamp,
    ...overrides,
  });

  const createMockOwnerProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
    uid: 'owner1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    location: 'New York, NY',
    coordinates: { latitude: 40.7128, longitude: -74.006 },
    eligible_to_match: true,
    createdAt: mockTimestamp,
    photoUrl: 'https://example.com/john.jpg',
    lastPhotoUpdate: null,
    lastLocationUpdate: null,
    ...overrides,
  });

  describe('Requirement 5.1: Item Image Display', () => {
    it('displays item image on card', () => {
      const item = createMockItem();
      const ownerProfile = createMockOwnerProfile();

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      const image = screen.getByAltText('Vintage Camera');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/camera1.jpg');
    });

    it('displays placeholder when no images available', () => {
      const item = createMockItem({ images: [] });
      const ownerProfile = createMockOwnerProfile();

      const { container } = render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      // Check for placeholder SVG icon
      const placeholderIcon = container.querySelector('svg[aria-hidden="true"]');
      expect(placeholderIcon).toBeInTheDocument();
    });

    it('displays images for all cards in grid', () => {
      const items = [
        createMockItem({ id: 'item1', title: 'Item 1', images: ['img1.jpg'] }),
        createMockItem({ id: 'item2', title: 'Item 2', images: ['img2.jpg'] }),
        createMockItem({ id: 'item3', title: 'Item 3', images: ['img3.jpg'] }),
      ];
      const ownerProfiles = new Map([
        ['owner1', createMockOwnerProfile()],
      ]);

      render(
        <CardGrid
          items={items}
          ownerProfiles={ownerProfiles}
          onSwipe={vi.fn()}
          animatingCards={new Set()}
          loadingSlots={0}
        />
      );

      expect(screen.getByAltText('Item 1')).toBeInTheDocument();
      expect(screen.getByAltText('Item 2')).toBeInTheDocument();
      expect(screen.getByAltText('Item 3')).toBeInTheDocument();
    });
  });

  describe('Requirement 5.2: Item Title Display', () => {
    it('displays item title on card', () => {
      const item = createMockItem({ title: 'Vintage Camera' });
      const ownerProfile = createMockOwnerProfile();

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      expect(screen.getByText('Vintage Camera')).toBeInTheDocument();
    });

    it('displays titles for all cards in grid', () => {
      const items = [
        createMockItem({ id: 'item1', title: 'Camera', ownerId: 'owner1' }),
        createMockItem({ id: 'item2', title: 'Laptop', ownerId: 'owner1' }),
        createMockItem({ id: 'item3', title: 'Book', ownerId: 'owner1' }),
      ];
      const ownerProfiles = new Map([
        ['owner1', createMockOwnerProfile()],
      ]);

      render(
        <CardGrid
          items={items}
          ownerProfiles={ownerProfiles}
          onSwipe={vi.fn()}
          animatingCards={new Set()}
          loadingSlots={0}
        />
      );

      expect(screen.getByText('Camera')).toBeInTheDocument();
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      expect(screen.getByText('Book')).toBeInTheDocument();
    });
  });

  describe('Requirement 5.3: Item Description Display', () => {
    it('displays item description on card', () => {
      const item = createMockItem({
        description: 'A beautiful vintage camera in excellent condition.',
      });
      const ownerProfile = createMockOwnerProfile();

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      expect(screen.getByText(/A beautiful vintage camera/)).toBeInTheDocument();
    });

    it('displays descriptions for all cards in grid', () => {
      const items = [
        createMockItem({ id: 'item1', title: 'Item 1', description: 'Description one', ownerId: 'owner1' }),
        createMockItem({ id: 'item2', title: 'Item 2', description: 'Description two', ownerId: 'owner1' }),
        createMockItem({ id: 'item3', title: 'Item 3', description: 'Description three', ownerId: 'owner1' }),
      ];
      const ownerProfiles = new Map([
        ['owner1', createMockOwnerProfile()],
      ]);

      render(
        <CardGrid
          items={items}
          ownerProfiles={ownerProfiles}
          onSwipe={vi.fn()}
          animatingCards={new Set()}
          loadingSlots={0}
        />
      );

      expect(screen.getByText(/Description one/)).toBeInTheDocument();
      expect(screen.getByText(/Description two/)).toBeInTheDocument();
      expect(screen.getByText(/Description three/)).toBeInTheDocument();
    });
  });

  describe('Requirement 5.4: Item Condition Display', () => {
    it('displays condition badge on card', () => {
      const item = createMockItem({ condition: 'like-new' });
      const ownerProfile = createMockOwnerProfile();

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      expect(screen.getByText('like new')).toBeInTheDocument();
    });

    it('displays different condition values correctly', () => {
      const conditions: Array<Item['condition']> = ['new', 'like-new', 'good', 'fair', 'poor'];

      conditions.forEach((condition) => {
        const item = createMockItem({ condition });
        const ownerProfile = createMockOwnerProfile();

        const { unmount } = render(
          <SwipeCard
            item={item}
            ownerProfile={ownerProfile}
            onSwipeLeft={vi.fn()}
            onSwipeRight={vi.fn()}
          />
        );

        const expectedText = condition.replace('-', ' ');
        expect(screen.getByText(expectedText)).toBeInTheDocument();
        unmount();
      });
    });

    it('displays condition badges for all cards in grid', () => {
      const items = [
        createMockItem({ id: 'item1', title: 'Item 1', condition: 'new', ownerId: 'owner1' }),
        createMockItem({ id: 'item2', title: 'Item 2', condition: 'good', ownerId: 'owner1' }),
        createMockItem({ id: 'item3', title: 'Item 3', condition: 'fair', ownerId: 'owner1' }),
      ];
      const ownerProfiles = new Map([
        ['owner1', createMockOwnerProfile()],
      ]);

      render(
        <CardGrid
          items={items}
          ownerProfiles={ownerProfiles}
          onSwipe={vi.fn()}
          animatingCards={new Set()}
          loadingSlots={0}
        />
      );

      expect(screen.getByText('new')).toBeInTheDocument();
      expect(screen.getByText('good')).toBeInTheDocument();
      expect(screen.getByText('fair')).toBeInTheDocument();
    });
  });

  describe('Requirement 5.5: Item Category Display', () => {
    it('displays category badge on card', () => {
      const item = createMockItem({ category: 'electronics' });
      const ownerProfile = createMockOwnerProfile();

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      expect(screen.getByText('electronics')).toBeInTheDocument();
    });

    it('displays different category values correctly', () => {
      const categories = ['electronics', 'books', 'furniture', 'clothing', 'toys'];

      categories.forEach((category) => {
        const item = createMockItem({ category });
        const ownerProfile = createMockOwnerProfile();

        const { unmount } = render(
          <SwipeCard
            item={item}
            ownerProfile={ownerProfile}
            onSwipeLeft={vi.fn()}
            onSwipeRight={vi.fn()}
          />
        );

        expect(screen.getByText(category)).toBeInTheDocument();
        unmount();
      });
    });

    it('displays category badges for all cards in grid', () => {
      const items = [
        createMockItem({ id: 'item1', title: 'Item 1', category: 'electronics', ownerId: 'owner1' }),
        createMockItem({ id: 'item2', title: 'Item 2', category: 'books', ownerId: 'owner1' }),
        createMockItem({ id: 'item3', title: 'Item 3', category: 'furniture', ownerId: 'owner1' }),
      ];
      const ownerProfiles = new Map([
        ['owner1', createMockOwnerProfile()],
      ]);

      render(
        <CardGrid
          items={items}
          ownerProfiles={ownerProfiles}
          onSwipe={vi.fn()}
          animatingCards={new Set()}
          loadingSlots={0}
        />
      );

      expect(screen.getByText('electronics')).toBeInTheDocument();
      expect(screen.getByText('books')).toBeInTheDocument();
      expect(screen.getByText('furniture')).toBeInTheDocument();
    });
  });

  describe('Requirement 5.6: Owner Name and Location Display', () => {
    it('displays owner name on card', () => {
      const item = createMockItem();
      const ownerProfile = createMockOwnerProfile({
        firstName: 'John',
        lastName: 'Doe',
      });

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays owner location on card', () => {
      const item = createMockItem();
      const ownerProfile = createMockOwnerProfile({
        location: 'New York, NY',
      });

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      // Location is displayed with distance calculation (should show distance in km or location)
      // The component calculates distance and shows it, or falls back to location
      const locationElement = screen.getByText(/away|New York, NY/);
      expect(locationElement).toBeInTheDocument();
    });

    it('displays owner photo when available', () => {
      const item = createMockItem();
      const ownerProfile = createMockOwnerProfile({
        firstName: 'John',
        lastName: 'Doe',
        photoUrl: 'https://example.com/john.jpg',
      });

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      const ownerPhoto = screen.getByAltText('John Doe');
      expect(ownerPhoto).toBeInTheDocument();
      expect(ownerPhoto).toHaveAttribute('src', 'https://example.com/john.jpg');
    });

    it('displays owner initials when photo not available', () => {
      const item = createMockItem();
      const ownerProfile = createMockOwnerProfile({
        firstName: 'John',
        lastName: 'Doe',
        photoUrl: null,
      });

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('displays owner info for all cards in grid', () => {
      const items = [
        createMockItem({ id: 'item1', title: 'Item 1', ownerId: 'owner1' }),
        createMockItem({ id: 'item2', title: 'Item 2', ownerId: 'owner2' }),
        createMockItem({ id: 'item3', title: 'Item 3', ownerId: 'owner3' }),
      ];
      const ownerProfiles = new Map([
        ['owner1', createMockOwnerProfile({ uid: 'owner1', firstName: 'Alice', lastName: 'Smith' })],
        ['owner2', createMockOwnerProfile({ uid: 'owner2', firstName: 'Bob', lastName: 'Jones' })],
        ['owner3', createMockOwnerProfile({ uid: 'owner3', firstName: 'Carol', lastName: 'White' })],
      ]);

      render(
        <CardGrid
          items={items}
          ownerProfiles={ownerProfiles}
          onSwipe={vi.fn()}
          animatingCards={new Set()}
          loadingSlots={0}
        />
      );

      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
      expect(screen.getByText('Carol White')).toBeInTheDocument();
    });
  });

  describe('Requirement 5.7: Multi-Image Navigation', () => {
    it('displays navigation controls for items with multiple images', () => {
      const item = createMockItem({
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
      });
      const ownerProfile = createMockOwnerProfile();

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      expect(screen.getByLabelText('Previous image')).toBeInTheDocument();
      expect(screen.getByLabelText('Next image')).toBeInTheDocument();
    });

    it('displays dot indicators for multiple images', () => {
      const item = createMockItem({
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
      });
      const ownerProfile = createMockOwnerProfile();

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      expect(screen.getByLabelText('Go to image 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to image 2')).toBeInTheDocument();
      expect(screen.getByLabelText('Go to image 3')).toBeInTheDocument();
    });

    it('does not display navigation controls for single image', () => {
      const item = createMockItem({
        images: ['img1.jpg'],
      });
      const ownerProfile = createMockOwnerProfile();

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      expect(screen.queryByLabelText('Previous image')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next image')).not.toBeInTheDocument();
    });

    it('navigates to next image when next button clicked', async () => {
      const user = userEvent.setup();
      const item = createMockItem({
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
      });
      const ownerProfile = createMockOwnerProfile();

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      const image = screen.getByAltText(item.title) as HTMLImageElement;
      expect(image.src).toContain('img1.jpg');

      const nextButton = screen.getByLabelText('Next image');
      await user.click(nextButton);

      expect(image.src).toContain('img2.jpg');
    });

    it('navigates to previous image when previous button clicked', async () => {
      const user = userEvent.setup();
      const item = createMockItem({
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
      });
      const ownerProfile = createMockOwnerProfile();

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      const image = screen.getByAltText(item.title) as HTMLImageElement;
      
      // Click next to go to second image
      const nextButton = screen.getByLabelText('Next image');
      await user.click(nextButton);
      expect(image.src).toContain('img2.jpg');

      // Click previous to go back to first image
      const prevButton = screen.getByLabelText('Previous image');
      await user.click(prevButton);
      expect(image.src).toContain('img1.jpg');
    });

    it('wraps around to first image when clicking next on last image', async () => {
      const user = userEvent.setup();
      const item = createMockItem({
        images: ['img1.jpg', 'img2.jpg'],
      });
      const ownerProfile = createMockOwnerProfile();

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      const image = screen.getByAltText(item.title) as HTMLImageElement;
      const nextButton = screen.getByLabelText('Next image');

      // Click next to go to second image
      await user.click(nextButton);
      expect(image.src).toContain('img2.jpg');

      // Click next again to wrap to first image
      await user.click(nextButton);
      expect(image.src).toContain('img1.jpg');
    });

    it('wraps around to last image when clicking previous on first image', async () => {
      const user = userEvent.setup();
      const item = createMockItem({
        images: ['img1.jpg', 'img2.jpg'],
      });
      const ownerProfile = createMockOwnerProfile();

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      const image = screen.getByAltText(item.title) as HTMLImageElement;
      expect(image.src).toContain('img1.jpg');

      // Click previous to wrap to last image
      const prevButton = screen.getByLabelText('Previous image');
      await user.click(prevButton);
      expect(image.src).toContain('img2.jpg');
    });

    it('navigates to specific image when dot indicator clicked', async () => {
      const user = userEvent.setup();
      const item = createMockItem({
        images: ['img1.jpg', 'img2.jpg', 'img3.jpg'],
      });
      const ownerProfile = createMockOwnerProfile();

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      const image = screen.getByAltText(item.title) as HTMLImageElement;
      expect(image.src).toContain('img1.jpg');

      // Click on third dot indicator
      const thirdDot = screen.getByLabelText('Go to image 3');
      await user.click(thirdDot);
      expect(image.src).toContain('img3.jpg');
    });
  });

  describe('Complete Card Content - All Requirements Together', () => {
    it('displays all required content elements on a single card', () => {
      const item = createMockItem({
        title: 'Vintage Camera',
        description: 'A beautiful vintage camera',
        category: 'electronics',
        condition: 'like-new',
        images: ['img1.jpg', 'img2.jpg'],
      });
      const ownerProfile = createMockOwnerProfile({
        firstName: 'John',
        lastName: 'Doe',
        location: 'New York, NY',
      });

      render(
        <SwipeCard
          item={item}
          ownerProfile={ownerProfile}
          onSwipeLeft={vi.fn()}
          onSwipeRight={vi.fn()}
        />
      );

      // Verify all content is present
      expect(screen.getByAltText('Vintage Camera')).toBeInTheDocument(); // Image
      expect(screen.getByText('Vintage Camera')).toBeInTheDocument(); // Title
      expect(screen.getByText(/A beautiful vintage camera/)).toBeInTheDocument(); // Description
      expect(screen.getByText('like new')).toBeInTheDocument(); // Condition
      expect(screen.getByText('electronics')).toBeInTheDocument(); // Category
      expect(screen.getByText('John Doe')).toBeInTheDocument(); // Owner name
      expect(screen.getByText(/away|New York, NY/)).toBeInTheDocument(); // Owner location/distance
      expect(screen.getByLabelText('Previous image')).toBeInTheDocument(); // Multi-image nav
      expect(screen.getByLabelText('Next image')).toBeInTheDocument(); // Multi-image nav
    });

    it('displays all required content on all cards in multi-card grid', () => {
      const items = [
        createMockItem({
          id: 'item1',
          title: 'Camera',
          description: 'Camera description',
          category: 'electronics',
          condition: 'new',
          images: ['cam1.jpg', 'cam2.jpg'],
          ownerId: 'owner1',
        }),
        createMockItem({
          id: 'item2',
          title: 'Book',
          description: 'Book description',
          category: 'books',
          condition: 'good',
          images: ['book1.jpg'],
          ownerId: 'owner2',
        }),
        createMockItem({
          id: 'item3',
          title: 'Chair',
          description: 'Chair description',
          category: 'furniture',
          condition: 'fair',
          images: ['chair1.jpg', 'chair2.jpg', 'chair3.jpg'],
          ownerId: 'owner3',
        }),
      ];
      const ownerProfiles = new Map([
        ['owner1', createMockOwnerProfile({ uid: 'owner1', firstName: 'Alice', lastName: 'Smith', location: 'Boston, MA' })],
        ['owner2', createMockOwnerProfile({ uid: 'owner2', firstName: 'Bob', lastName: 'Jones', location: 'Chicago, IL' })],
        ['owner3', createMockOwnerProfile({ uid: 'owner3', firstName: 'Carol', lastName: 'White', location: 'Seattle, WA' })],
      ]);

      render(
        <CardGrid
          items={items}
          ownerProfiles={ownerProfiles}
          onSwipe={vi.fn()}
          animatingCards={new Set()}
          loadingSlots={0}
        />
      );

      // Verify all cards have complete content
      // Card 1
      expect(screen.getByAltText('Camera')).toBeInTheDocument();
      expect(screen.getByText('Camera')).toBeInTheDocument();
      expect(screen.getByText(/Camera description/)).toBeInTheDocument();
      expect(screen.getByText('new')).toBeInTheDocument();
      expect(screen.getByText('electronics')).toBeInTheDocument();
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();

      // Card 2
      expect(screen.getByAltText('Book')).toBeInTheDocument();
      expect(screen.getByText('Book')).toBeInTheDocument();
      expect(screen.getByText(/Book description/)).toBeInTheDocument();
      expect(screen.getByText('good')).toBeInTheDocument();
      expect(screen.getByText('books')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();

      // Card 3
      expect(screen.getByAltText('Chair')).toBeInTheDocument();
      expect(screen.getByText('Chair')).toBeInTheDocument();
      expect(screen.getByText(/Chair description/)).toBeInTheDocument();
      expect(screen.getByText('fair')).toBeInTheDocument();
      expect(screen.getByText('furniture')).toBeInTheDocument();
      expect(screen.getByText('Carol White')).toBeInTheDocument();

      // All cards should display location/distance information
      const locationElements = screen.getAllByText(/away|Boston, MA|Chicago, IL|Seattle, WA/);
      expect(locationElements.length).toBeGreaterThanOrEqual(3);
    });
  });
});
