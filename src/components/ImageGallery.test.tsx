import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageGallery } from './ImageGallery';

// Helper function to normalize URLs for comparison
// Browsers may add/remove trailing slashes and normalize paths
const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Remove trailing slashes and dots from pathname
    urlObj.pathname = urlObj.pathname.replace(/\/+$/, '').replace(/\/\.+$/, '');
    return urlObj.href.replace(/\/$/, '');
  } catch {
    // If URL parsing fails, just do basic normalization
    return url.replace(/\/+$/, '').replace(/\/\.+$/, '');
  }
};

describe('ImageGallery', () => {
  describe('Property-Based Tests', () => {
    describe('Property 1: Image gallery thumbnail synchronization', () => {
      it('should display the image at index N when thumbnail N is clicked', async () => {
        /**
         * Feature: enhanced-listing-experience, Property 1: Image gallery thumbnail synchronization
         * **Validates: Requirements 1.2, 1.3**
         * 
         * For any item with multiple images, when a user selects a thumbnail at index N,
         * the main image viewport should display the image at index N.
         */
        const fc = await import('fast-check');

        await fc.assert(
          fc.asyncProperty(
            fc.array(fc.webUrl(), { minLength: 2, maxLength: 10 }), // Generate array of image URLs
            fc.integer({ min: 0, max: 9 }), // Index to select (will be clamped to array length)
            async (images, selectedIndex) => {
              // Clamp the selected index to the actual array length
              const actualIndex = Math.min(selectedIndex, images.length - 1);

              const onImageChange = vi.fn();
              const { container, unmount } = render(
                <ImageGallery 
                  images={images} 
                  title="Test Item" 
                  onImageChange={onImageChange}
                />
              );

              try {
                // Find all thumbnail buttons
                const thumbnails = container.querySelectorAll('button[aria-label^="View image"]');
                expect(thumbnails.length).toBe(images.length);

                // Click the thumbnail at the selected index
                fireEvent.click(thumbnails[actualIndex]);

                // Property 1: The main image should display the selected image URL
                const mainImage = container.querySelector('img[alt*="Image"]') as HTMLImageElement;
                expect(mainImage).toBeTruthy();
                // Normalize URLs for comparison (browser may add trailing slash)
                expect(normalizeUrl(mainImage.src)).toBe(normalizeUrl(images[actualIndex]));

                // Property 2: The onImageChange callback should be called with the correct index
                expect(onImageChange).toHaveBeenCalledWith(actualIndex);

                // Property 3: The selected thumbnail should have the active styling
                const selectedThumbnail = thumbnails[actualIndex];
                expect(selectedThumbnail.getAttribute('aria-current')).toBe('true');

                // Property 4: The image counter should show the correct position
                const counters = container.querySelectorAll('[aria-live="polite"]');
                const mainCounter = counters[0]; // First counter is the main one
                expect(mainCounter.textContent?.trim()).toBe(`${actualIndex + 1} / ${images.length}`);
              } finally {
                // Clean up to avoid multiple components in DOM
                unmount();
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });

    describe('Property 2: Lightbox keyboard navigation', () => {
      it('should navigate images with arrow keys and close with escape in lightbox mode', async () => {
        /**
         * Feature: enhanced-listing-experience, Property 2: Lightbox keyboard navigation
         * **Validates: Requirements 1.4, 1.5**
         * 
         * For any image gallery in lightbox mode, pressing the right arrow key should advance
         * to the next image, pressing the left arrow key should go to the previous image,
         * and pressing escape should close the lightbox.
         */
        const fc = await import('fast-check');

        await fc.assert(
          fc.asyncProperty(
            fc.array(fc.webUrl(), { minLength: 2, maxLength: 10 }), // Generate array of image URLs
            fc.integer({ min: 0, max: 9 }), // Starting index
            async (images, startIndex) => {
              // Clamp the start index to the actual array length
              const actualStartIndex = Math.min(startIndex, images.length - 1);

              const { container, unmount } = render(
                <ImageGallery images={images} title="Test Item" />
              );

              try {
                // Select the starting image
                const thumbnails = container.querySelectorAll('button[aria-label^="View image"]');
                fireEvent.click(thumbnails[actualStartIndex]);

                // Open lightbox by clicking main image
                const mainImageButton = container.querySelector('button[aria-label="Open image in fullscreen"]');
                expect(mainImageButton).toBeTruthy();
                fireEvent.click(mainImageButton!);

                // Verify lightbox is open
                const lightbox = container.querySelector('[role="dialog"][aria-modal="true"]');
                expect(lightbox).toBeTruthy();

                // Property 1: Right arrow should advance to next image (with wrapping)
                fireEvent.keyDown(window, { key: 'ArrowRight' });
                const expectedNextIndex = (actualStartIndex + 1) % images.length;
                let lightboxImage = container.querySelector('[role="dialog"] img') as HTMLImageElement;
                expect(normalizeUrl(lightboxImage.src)).toBe(normalizeUrl(images[expectedNextIndex]));

                // Property 2: Left arrow should go to previous image (with wrapping)
                fireEvent.keyDown(window, { key: 'ArrowLeft' });
                // We're back to the start index
                lightboxImage = container.querySelector('[role="dialog"] img') as HTMLImageElement;
                expect(normalizeUrl(lightboxImage.src)).toBe(normalizeUrl(images[actualStartIndex]));

                // Property 3: Escape should close the lightbox
                fireEvent.keyDown(window, { key: 'Escape' });
                const closedLightbox = container.querySelector('[role="dialog"][aria-modal="true"]');
                expect(closedLightbox).toBeNull();
              } finally {
                unmount();
              }
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });

  describe('Unit Tests', () => {
    describe('Empty image array', () => {
      it('should display placeholder when images array is empty', () => {
        /**
         * **Validates: Requirements 1.7**
         * 
         * When no images exist for an Item, the Image_Gallery should display a placeholder graphic.
         */
        const { container } = render(
          <ImageGallery images={[]} title="Test Item" />
        );

        // Check for placeholder SVG
        const placeholderSvg = container.querySelector('svg[aria-hidden="true"]');
        expect(placeholderSvg).toBeTruthy();

        // Check for "No images available" text
        const placeholderText = screen.getByText('No images available');
        expect(placeholderText).toBeTruthy();

        // Ensure no thumbnails are rendered
        const thumbnails = container.querySelectorAll('button[aria-label^="View image"]');
        expect(thumbnails.length).toBe(0);
      });

      it('should display placeholder when images is undefined', () => {
        render(
          <ImageGallery images={undefined as any} title="Test Item" />
        );

        const placeholderText = screen.getByText('No images available');
        expect(placeholderText).toBeTruthy();
      });
    });

    describe('Single image', () => {
      it('should not display thumbnail strip for single image', () => {
        const images = ['https://example.com/image1.jpg'];
        const { container } = render(
          <ImageGallery images={images} title="Test Item" />
        );

        // Main image should be displayed
        const mainImage = container.querySelector('img[alt*="Image"]') as HTMLImageElement;
        expect(mainImage).toBeTruthy();
        expect(mainImage.src).toBe(images[0]);

        // Thumbnail strip should not be rendered
        const thumbnailContainer = container.querySelector('[role="list"][aria-label="Image thumbnails"]');
        expect(thumbnailContainer).toBeNull();
      });
    });

    describe('Multiple images', () => {
      it('should display thumbnail strip for multiple images', () => {
        const images = [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ];
        const { container } = render(
          <ImageGallery images={images} title="Test Item" />
        );

        // Thumbnail strip should be rendered
        const thumbnailContainer = container.querySelector('[role="list"][aria-label="Image thumbnails"]');
        expect(thumbnailContainer).toBeTruthy();

        // Should have correct number of thumbnails
        const thumbnails = container.querySelectorAll('button[aria-label^="View image"]');
        expect(thumbnails.length).toBe(3);
      });

      it('should update main image when thumbnail is clicked', () => {
        const images = [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ];
        const { container } = render(
          <ImageGallery images={images} title="Test Item" />
        );

        // Initially, first image should be displayed
        let mainImage = container.querySelector('img[alt*="Image"]') as HTMLImageElement;
        expect(mainImage.src).toBe(images[0]);

        // Click second thumbnail
        const thumbnails = container.querySelectorAll('button[aria-label^="View image"]');
        fireEvent.click(thumbnails[1]);

        // Main image should update to second image
        mainImage = container.querySelector('img[alt*="Image"]') as HTMLImageElement;
        expect(mainImage.src).toBe(images[1]);

        // Image counter should update
        const counter = screen.getByText('2 / 3');
        expect(counter).toBeTruthy();
      });

      it('should call onImageChange callback when thumbnail is clicked', () => {
        const images = [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
        ];
        const onImageChange = vi.fn();
        const { container } = render(
          <ImageGallery images={images} title="Test Item" onImageChange={onImageChange} />
        );

        // Click second thumbnail
        const thumbnails = container.querySelectorAll('button[aria-label^="View image"]');
        fireEvent.click(thumbnails[1]);

        expect(onImageChange).toHaveBeenCalledWith(1);
      });
    });

    describe('Image counter', () => {
      it('should display correct image counter', () => {
        const images = [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ];
        render(<ImageGallery images={images} title="Test Item" />);

        const counter = screen.getByText('1 / 3');
        expect(counter).toBeTruthy();
      });

      it('should update counter when image changes', () => {
        const images = [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
        ];
        const { container } = render(
          <ImageGallery images={images} title="Test Item" />
        );

        // Click second thumbnail
        const thumbnails = container.querySelectorAll('button[aria-label^="View image"]');
        fireEvent.click(thumbnails[1]);

        const counter = screen.getByText('2 / 2');
        expect(counter).toBeTruthy();
      });
    });

    describe('Accessibility', () => {
      it('should have proper ARIA labels for main image', () => {
        const images = ['https://example.com/image1.jpg'];
        const { container } = render(
          <ImageGallery images={images} title="Test Item" />
        );

        const mainImageButton = container.querySelector('button[aria-label="Open image in fullscreen"]');
        expect(mainImageButton).toBeTruthy();

        const mainImage = container.querySelector('img[alt="Test Item - Image 1 of 1"]');
        expect(mainImage).toBeTruthy();
      });

      it('should have proper ARIA labels for thumbnails', () => {
        const images = [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
        ];
        const { container } = render(
          <ImageGallery images={images} title="Test Item" />
        );

        const thumbnail1 = container.querySelector('button[aria-label="View image 1"]');
        const thumbnail2 = container.querySelector('button[aria-label="View image 2"]');
        
        expect(thumbnail1).toBeTruthy();
        expect(thumbnail2).toBeTruthy();
      });

      it('should mark selected thumbnail with aria-current', () => {
        const images = [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
        ];
        const { container } = render(
          <ImageGallery images={images} title="Test Item" />
        );

        const thumbnails = container.querySelectorAll('button[aria-label^="View image"]');
        
        // First thumbnail should be marked as current
        expect(thumbnails[0].getAttribute('aria-current')).toBe('true');
        expect(thumbnails[1].getAttribute('aria-current')).toBe('false');

        // Click second thumbnail
        fireEvent.click(thumbnails[1]);

        // Second thumbnail should now be marked as current
        expect(thumbnails[0].getAttribute('aria-current')).toBe('false');
        expect(thumbnails[1].getAttribute('aria-current')).toBe('true');
      });
    });
  });
});
