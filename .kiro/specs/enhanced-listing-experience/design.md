# Design Document: Enhanced Listing Experience

## Overview

This design enhances the marketplace listing experience through two main areas: improved listing cards in the grid view and a richer item detail page. The implementation extends existing React components and Firestore data structures to support new features including favorites, view tracking, related items, item history, and enhanced visual interactions.

The design maintains the existing React + TypeScript + Firebase architecture while adding new data models, utility functions, and UI components. All enhancements are built to be responsive, accessible, and performant.

## Architecture

### High-Level Component Structure

```
Listings Page (Enhanced)
├── ListingCard (Enhanced)
│   ├── CardImage (with hover effects)
│   ├── QuickActions (favorite, share)
│   ├── CardContent (enhanced info)
│   └── DistanceInfo
│
ItemDetail Page (Enhanced)
├── ImageGallery (new component)
│   ├── MainImageView
│   ├── ThumbnailStrip
│   └── LightboxModal
├── ItemInfo (enhanced)
│   ├── MetadataSection (views, favorites)
│   └── ActionButtons (favorite, share)
├── OwnerInfo (enhanced)
│   ├── OwnerStats
│   └── OwnerActions
├── ItemHistory (new component)
└── RelatedItems (new component)
```

### Data Flow

1. **Listing Cards**: Fetch items with metadata (views, favorites) → Calculate distances → Render enhanced cards
2. **Item Detail**: Fetch item + owner + metadata → Track view → Fetch related items → Render enhanced detail view
3. **User Interactions**: Favorite/Share actions → Update Firestore → Update local state → Reflect in UI

### Technology Stack

- **Frontend**: React 18, TypeScript, TailwindCSS
- **Backend**: Firebase Firestore
- **State Management**: React hooks (useState, useEffect, useContext)
- **Routing**: React Router v6
- **Image Handling**: Native img tags with lazy loading

## Components and Interfaces

### New Data Models

#### ItemMetadata

Extends the existing Item interface with new fields:

```typescript
export interface ItemMetadata {
  viewCount: number;
  favoriteCount: number;
  lastViewed: Timestamp | null;
  statusHistory: StatusChange[];
}

export interface StatusChange {
  status: 'available' | 'pending' | 'unavailable';
  timestamp: Timestamp;
}
```

#### UserFavorite

Tracks user favorites in a separate collection:

```typescript
export interface UserFavorite {
  id: string;
  userId: string;
  itemId: string;
  createdAt: Timestamp;
}
```

#### ItemView

Tracks unique views to prevent duplicate counting:

```typescript
export interface ItemView {
  id: string;
  itemId: string;
  userId: string | null; // null for anonymous users
  viewedAt: Timestamp;
}
```

### Enhanced Item Type

```typescript
export interface EnhancedItem extends Item {
  viewCount: number;
  favoriteCount: number;
  isFavorited: boolean; // for current user
  distance: number | null; // in kilometers
  ownerInfo?: {
    name: string;
    photoUrl: string | null;
    activeListingsCount: number;
    memberSince: Timestamp;
  };
}
```

### Component Interfaces

#### ImageGallery Component

```typescript
interface ImageGalleryProps {
  images: string[];
  title: string;
  onImageChange?: (index: number) => void;
}

interface ImageGalleryState {
  selectedIndex: number;
  isLightboxOpen: boolean;
}
```

#### QuickActions Component

```typescript
interface QuickActionsProps {
  itemId: string;
  isFavorited: boolean;
  onFavoriteToggle: (itemId: string) => Promise<void>;
  onShare: (itemId: string) => void;
}
```

#### RelatedItems Component

```typescript
interface RelatedItemsProps {
  currentItem: Item;
  maxItems?: number;
}

interface RelatedItemsState {
  items: EnhancedItem[];
  loading: boolean;
}
```

#### ItemHistory Component

```typescript
interface ItemHistoryProps {
  item: Item;
  statusHistory: StatusChange[];
}

interface HistoryEvent {
  type: 'created' | 'status_changed' | 'updated';
  timestamp: Timestamp;
  details: string;
}
```

### Utility Functions

#### Distance Calculation

```typescript
// Extends existing location.ts utilities
export function calculateDistanceForItem(
  userCoords: Coordinates | null,
  ownerCoords: Coordinates | null
): number | null;

export function formatDistanceDisplay(
  distance: number | null,
  location: string
): string;
```

#### Metadata Management

```typescript
export async function incrementViewCount(
  itemId: string,
  userId: string | null
): Promise<void>;

export async function toggleFavorite(
  itemId: string,
  userId: string
): Promise<boolean>; // returns new favorite status

export async function getFavoriteStatus(
  itemId: string,
  userId: string
): Promise<boolean>;

export async function getItemMetadata(
  itemId: string
): Promise<ItemMetadata>;
```

#### Related Items Algorithm

```typescript
export async function findRelatedItems(
  currentItem: Item,
  limit: number = 8
): Promise<EnhancedItem[]>;

// Scoring algorithm:
// - Same category: +10 points
// - Same condition: +5 points
// - Same owner: +3 points
// - Recent (< 7 days): +2 points
// Sort by score descending, then by createdAt descending
```

#### Time Formatting

```typescript
export function formatTimeAgo(timestamp: Timestamp): string;
// Examples: "2 minutes ago", "3 hours ago", "2 days ago", "Jan 15, 2024"

export function formatMemberSince(timestamp: Timestamp): string;
// Example: "Member since Jan 2024"
```

## Data Models

### Firestore Collections

#### items (existing, enhanced)

```
items/{itemId}
  - id: string
  - ownerId: string
  - title: string
  - description: string
  - category: string
  - condition: string
  - images: string[]
  - status: string
  - createdAt: Timestamp
  - viewCount: number (NEW)
  - favoriteCount: number (NEW)
  - statusHistory: StatusChange[] (NEW)
  - updatedAt: Timestamp (NEW)
```

#### favorites (new collection)

```
favorites/{favoriteId}
  - id: string (auto-generated)
  - userId: string (indexed)
  - itemId: string (indexed)
  - createdAt: Timestamp

Composite index: userId + itemId (for quick lookups)
```

#### item_views (new collection)

```
item_views/{viewId}
  - id: string (auto-generated)
  - itemId: string (indexed)
  - userId: string | null (indexed)
  - viewedAt: Timestamp

Composite index: itemId + userId + viewedAt (for deduplication)
```

### Data Access Patterns

1. **Fetch items with metadata**: Single query to items collection
2. **Check favorite status**: Query favorites where userId == currentUser && itemId == targetItem
3. **Fetch user favorites**: Query favorites where userId == currentUser, then fetch items
4. **Track view**: Check item_views for recent view, insert if not exists, increment item.viewCount
5. **Find related items**: Query items where category == currentCategory, limit 20, then score and filter client-side

### Firestore Security Rules

```javascript
// favorites collection
match /favorites/{favoriteId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
}

// item_views collection
match /item_views/{viewId} {
  allow read: if request.auth != null;
  allow create: if true; // Allow anonymous views
}

// items collection (enhanced)
match /items/{itemId} {
  allow read: if true;
  allow update: if request.auth != null && (
    // Allow owner to update their items
    resource.data.ownerId == request.auth.uid ||
    // Allow anyone to increment view/favorite counts
    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['viewCount', 'favoriteCount'])
  );
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Properties 2.1, 2.2, 2.3 can be combined into a single property about displaying all item information
- Properties 3.1, 3.2, 3.3 can be combined into a single property about displaying all owner information
- Properties 4.3 and 4.4 can be combined into a single property about favorite count consistency
- Properties 7.1-7.6 can be combined into a single property about listing card rendering
- Properties 8.1, 8.2, 8.3 can be combined into a single property about hover effects
- Properties 11.2 and 11.3 can be combined into a single property about responsive orientation
- Property 12.1 is redundant with 1.5 (keyboard navigation)
- Property 13.2 is redundant with 11.5 (lazy loading)

### Core Properties

**Property 1: Image gallery thumbnail synchronization**
*For any* item with multiple images, when a user selects a thumbnail at index N, the main image viewport should display the image at index N.
**Validates: Requirements 1.2, 1.3**

**Property 2: Lightbox keyboard navigation**
*For any* image gallery in lightbox mode, pressing the right arrow key should advance to the next image, pressing the left arrow key should go to the previous image, and pressing escape should close the lightbox.
**Validates: Requirements 1.4, 1.5**

**Property 3: Complete item information display**
*For any* item, the detail view should render all item properties (title, description, category, condition, status, createdAt, viewCount, favoriteCount) in the output.
**Validates: Requirements 2.1, 2.2, 2.3, 2.5**

**Property 4: Conditional location display**
*For any* item, if the item owner has location data, the detail view should display the location information; otherwise, it should not display location information.
**Validates: Requirements 2.4**

**Property 5: Status update consistency**
*For any* item, after updating its status in Firestore, fetching the item should return the updated status value.
**Validates: Requirements 2.6**

**Property 6: Complete owner information display**
*For any* item with an owner, the detail view should render the owner's name, photo (or initials), location, active listings count, and member since date.
**Validates: Requirements 3.1, 3.2, 3.3**

**Property 7: Ownership indicator**
*For any* item, if the current user's ID matches the item's ownerId, the detail view should display a "Your Item" indicator; otherwise, it should not display this indicator.
**Validates: Requirements 3.6**

**Property 8: Favorite toggle behavior**
*For any* item, clicking the favorite button should toggle the favorite status from true to false or false to true.
**Validates: Requirements 4.2, 8.6**

**Property 9: Favorite count consistency**
*For any* item, favoriting should increment the favorite count by 1, and unfavoriting should decrement it by 1, maintaining count accuracy.
**Validates: Requirements 4.3, 4.4**

**Property 10: Clipboard copy operation**
*For any* item, when a user clicks the copy link button, the system should call the clipboard API with the item's URL and display a confirmation message.
**Validates: Requirements 4.7**

**Property 11: View count increment**
*For any* item, when a user loads the detail view, the system should increment the view count by 1.
**Validates: Requirements 4.8**

**Property 12: View deduplication**
*For any* item, if the same user views the item multiple times within 24 hours, the view count should only increment once.
**Validates: Requirements 4.9**

**Property 13: Related items category prioritization**
*For any* item, when calculating related items, items with matching category should have a higher score than items with different categories.
**Validates: Requirements 5.2**

**Property 14: Related items condition consideration**
*For any* item, when calculating related items, items with matching condition should have a higher score than items with different conditions.
**Validates: Requirements 5.3**

**Property 15: Related items same owner inclusion**
*For any* item, when calculating related items, other items from the same owner should be included in the results.
**Validates: Requirements 5.4**

**Property 16: Related items count limit**
*For any* item, the related items display should never show more than 8 items, regardless of how many related items exist.
**Validates: Requirements 5.5**

**Property 17: Related item navigation**
*For any* related item card, clicking it should navigate to that item's detail view with the correct item ID in the URL.
**Validates: Requirements 5.7**

**Property 18: Item history completeness**
*For any* item, the item history should include the creation event and all status changes with their timestamps.
**Validates: Requirements 6.2, 6.3, 6.4**

**Property 19: Item history chronological ordering**
*For any* item with multiple history events, the events should be displayed in reverse chronological order (newest first).
**Validates: Requirements 6.5**

**Property 20: Listing card complete rendering**
*For any* item, the listing card should render the image (4:3 aspect ratio), title, category badge, condition badge, status indicator, truncated description (2 lines max), and creation date.
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

**Property 21: Listing card hover effects**
*For any* listing card, when hovered, the card should apply an elevated shadow, scale the image, and display quick action buttons.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

**Property 22: Quick action non-navigation**
*For any* listing card, clicking a quick action button (favorite or share) should perform the action without triggering navigation to the detail view.
**Validates: Requirements 8.5**

**Property 23: Share menu display**
*For any* item, clicking the share quick action should display a share menu overlay with copy link, email, and social media options.
**Validates: Requirements 8.7**

**Property 24: Card click navigation**
*For any* listing card, clicking anywhere on the card except quick action buttons should navigate to the item's detail view.
**Validates: Requirements 8.8**

**Property 25: Distance calculation**
*For any* two coordinate pairs, the distance calculation should use the haversine formula and return the distance in kilometers.
**Validates: Requirements 9.7**

**Property 26: Distance display with location data**
*For any* item where both the user and owner have location coordinates, the listing card should display the calculated distance.
**Validates: Requirements 9.1, 9.2**

**Property 27: Location fallback display**
*For any* item where either the user or owner lacks location coordinates, the listing card should display only the owner's city/region text without distance.
**Validates: Requirements 9.5**

**Property 28: Listing card owner information**
*For any* item, the listing card should display the owner's name or initials.
**Validates: Requirements 10.1**

**Property 29: Conditional metadata display**
*For any* item, the listing card should display favorite count only if count > 0, view count only if count > 0, and image count indicator only if images.length > 1.
**Validates: Requirements 10.2, 10.3, 10.4**

**Property 30: Responsive image gallery sizing**
*For any* viewport width, the image gallery should apply responsive CSS classes that adapt the layout to the available space.
**Validates: Requirements 11.1**

**Property 31: Image lazy loading**
*For any* image below the viewport fold, the image element should have the loading="lazy" attribute applied.
**Validates: Requirements 11.5**

**Property 32: Image loading states**
*For any* image that is loading, the system should display a loading skeleton or spinner until the image loads successfully.
**Validates: Requirements 11.6**

**Property 33: Image error handling**
*For any* image that fails to load, the system should display an error placeholder with a retry button.
**Validates: Requirements 11.7**

**Property 34: Keyboard accessibility**
*For any* interactive element (buttons, links, inputs), the element should be keyboard accessible with Tab navigation and have visible focus indicators.
**Validates: Requirements 12.2**

**Property 35: ARIA labels presence**
*For any* interactive element, the element should have an appropriate aria-label or aria-labelledby attribute.
**Validates: Requirements 12.3**

**Property 36: Image alt text**
*For any* item image, the img element should have an alt attribute containing the item title.
**Validates: Requirements 12.4**

**Property 37: Screen reader announcements**
*For any* state change (favorited, shared, etc.), the system should update an ARIA live region to announce the change to screen readers.
**Validates: Requirements 12.5**

**Property 38: Logical tab order**
*For any* page, interactive elements should have tabindex values that create a logical navigation flow from top to bottom, left to right.
**Validates: Requirements 12.6**

**Property 39: Color contrast compliance**
*For any* text element, the color contrast ratio between text and background should be at least 4.5:1 for normal text and 3:1 for large text.
**Validates: Requirements 12.7**

**Property 40: Pagination functionality**
*For any* listing page with more than 20 items, the system should display pagination controls and only render the current page's items.
**Validates: Requirements 13.6**

**Property 41: Network error handling**
*For any* failed network request, the system should display an error message and provide a retry button.
**Validates: Requirements 13.7**

**Property 42: Favorite persistence**
*For any* item, after a user favorites it, querying the favorites collection should return a document with the user's ID and item ID.
**Validates: Requirements 14.1**

**Property 43: View count persistence**
*For any* item, after a user views it, querying the item document should return a viewCount that is 1 higher than before the view.
**Validates: Requirements 14.2**

**Property 44: Favorite document structure**
*For any* favorite created, the document should contain userId, itemId, and createdAt fields with correct types.
**Validates: Requirements 14.3**

**Property 45: Item metadata structure**
*For any* item document, it should contain viewCount and favoriteCount fields as numbers.
**Validates: Requirements 14.4**

**Property 46: Favorite status loading**
*For any* user viewing the marketplace, the system should fetch all favorites for that user and apply the favorited state to matching items in the listing grid.
**Validates: Requirements 14.5**

**Property 47: Concurrent update handling**
*For any* item, if two users simultaneously favorite it, both operations should succeed and the favorite count should increase by 2.
**Validates: Requirements 14.6**

**Property 48: Cascade deletion**
*For any* item, when it is deleted, all documents in the favorites collection with matching itemId should also be deleted.
**Validates: Requirements 14.7**

## Error Handling

### Client-Side Error Handling

1. **Network Failures**
   - Wrap all Firestore operations in try-catch blocks
   - Display user-friendly error messages
   - Provide retry buttons for failed operations
   - Log errors to console for debugging

2. **Image Loading Failures**
   - Use onError handlers on img elements
   - Display placeholder graphics when images fail
   - Provide retry mechanism for failed images
   - Gracefully handle missing image arrays

3. **Invalid Data**
   - Validate item data structure before rendering
   - Provide default values for missing fields
   - Handle null/undefined coordinates gracefully
   - Validate user input before submission

4. **Authentication Errors**
   - Check auth state before favorite/share operations
   - Redirect to login if user is not authenticated
   - Display appropriate messages for auth failures
   - Handle token expiration gracefully

### Firestore Error Handling

1. **Permission Denied**
   - Check user authentication before write operations
   - Display clear messages about permission requirements
   - Gracefully degrade features for unauthenticated users

2. **Document Not Found**
   - Handle missing items with 404-style error pages
   - Provide navigation back to listings
   - Log missing document IDs for investigation

3. **Query Failures**
   - Implement retry logic with exponential backoff
   - Cache previous results when queries fail
   - Display stale data with warning when appropriate

4. **Concurrent Modification**
   - Use Firestore transactions for count updates
   - Implement optimistic UI updates
   - Retry failed transactions automatically

### Edge Cases

1. **Empty States**
   - No images: Display placeholder graphic
   - No related items: Hide related items section
   - No status history: Show only creation event
   - No location data: Display city/region only

2. **Boundary Conditions**
   - Distance < 1 km: Display in meters
   - Distance > 100 km: Display "100+ km away"
   - View count = 0: Hide view count display
   - Favorite count = 0: Hide favorite count display

3. **Data Consistency**
   - Handle items with missing owners gracefully
   - Validate timestamp formats before display
   - Handle malformed image URLs
   - Sanitize user-generated content

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs
- Together: Comprehensive coverage (unit tests catch concrete bugs, property tests verify general correctness)

### Unit Testing

Unit tests should focus on:

1. **Specific Examples**
   - Image gallery displays correctly with 3 images
   - Detail view renders for a specific item
   - Owner section displays for a known user
   - Share menu opens with correct options

2. **Edge Cases**
   - Empty image array displays placeholder
   - No related items hides the section
   - No status history shows only creation
   - Distance < 1 km displays in meters
   - Distance > 100 km displays "100+ km away"

3. **Error Conditions**
   - Network failure displays error message
   - Image load failure shows placeholder
   - Missing item shows 404 page
   - Permission denied shows appropriate message

4. **Integration Points**
   - Favorite button updates Firestore
   - View tracking increments count
   - Navigation works between pages
   - Related items query returns results

### Property-Based Testing

Property tests should be implemented using **fast-check** (for TypeScript/JavaScript). Each test must:

- Run a minimum of 100 iterations
- Reference the design document property number
- Use the tag format: **Feature: enhanced-listing-experience, Property {number}: {property_text}**

Property tests should focus on:

1. **Data Transformations**
   - Distance calculation (Property 25)
   - Time formatting (Properties 3, 6)
   - Related items scoring (Properties 13, 14, 15)

2. **State Management**
   - Favorite toggle (Property 8)
   - Favorite count consistency (Property 9)
   - View count increment (Property 11)
   - View deduplication (Property 12)

3. **UI Rendering**
   - Complete information display (Properties 3, 6, 20)
   - Conditional rendering (Properties 4, 7, 27, 29)
   - Accessibility attributes (Properties 35, 36, 38, 39)

4. **Data Persistence**
   - Favorite persistence (Property 42)
   - View count persistence (Property 43)
   - Document structure (Properties 44, 45)
   - Cascade deletion (Property 48)

### Test Configuration

```typescript
// Example property test configuration
import fc from 'fast-check';

describe('Enhanced Listing Experience Properties', () => {
  // Feature: enhanced-listing-experience, Property 25: Distance calculation
  it('should calculate distance using haversine formula', () => {
    fc.assert(
      fc.property(
        fc.record({
          lat1: fc.double({ min: -90, max: 90 }),
          lon1: fc.double({ min: -180, max: 180 }),
          lat2: fc.double({ min: -90, max: 90 }),
          lon2: fc.double({ min: -180, max: 180 }),
        }),
        (coords) => {
          const distance = calculateDistance(
            { latitude: coords.lat1, longitude: coords.lon1 },
            { latitude: coords.lat2, longitude: coords.lon2 }
          );
          
          // Distance should be non-negative
          expect(distance).toBeGreaterThanOrEqual(0);
          
          // Distance should be symmetric
          const reverseDistance = calculateDistance(
            { latitude: coords.lat2, longitude: coords.lon2 },
            { latitude: coords.lat1, longitude: coords.lon1 }
          );
          expect(distance).toBeCloseTo(reverseDistance, 5);
          
          // Distance to self should be 0
          if (coords.lat1 === coords.lat2 && coords.lon1 === coords.lon2) {
            expect(distance).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Testing Tools

- **Unit Testing**: Jest + React Testing Library
- **Property Testing**: fast-check
- **E2E Testing**: Playwright (optional, for critical user flows)
- **Accessibility Testing**: jest-axe + manual testing with screen readers

### Coverage Goals

- Unit test coverage: 80% of component code
- Property test coverage: All core business logic functions
- Integration test coverage: All Firestore operations
- Accessibility test coverage: All interactive components
