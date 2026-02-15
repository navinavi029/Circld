# Design Document: Swipe Trading

## Overview

The Swipe Trading feature introduces a Tinder-style interface for discovering and initiating trades between users. The design follows a mobile-first approach with gesture-based interactions, while maintaining accessibility through alternative input methods.

The system consists of four main components:
1. **Trade Anchor Selection** - Interface for choosing which item to trade
2. **Swipe Interface** - Card-based UI for browsing potential trade matches
3. **Trade Offer Management** - Backend logic for creating and tracking trade offers
4. **Notification System** - Delivery mechanism for trade offer notifications

The architecture integrates with the existing Firebase Firestore database and follows the established patterns in the codebase for authentication, data fetching, and UI components.

## Architecture

### High-Level Component Structure

```
SwipeTradingPage
├── TradeAnchorSelector
│   └── UserItemGrid (reuses existing listing display)
├── SwipeInterface
│   ├── TradeAnchorDisplay (fixed position)
│   ├── SwipeCard
│   │   ├── ItemImage
│   │   ├── ItemDetails
│   │   └── OwnerInfo
│   ├── SwipeControls (buttons for accessibility)
│   └── EmptyState
└── NotificationBadge
```

### Data Flow

1. **Session Initialization**: User selects Trade Anchor → System creates Swipe Session → Loads Item Pool
2. **Swipe Action**: User swipes → System records swipe → Updates UI → (If right swipe) Creates Trade Offer → Sends Notification
3. **Notification Delivery**: Trade Offer created → Notification record created → User sees notification → User can view details or start conversation

### Integration Points

- **Firebase Firestore**: All data persistence (items, trade offers, swipe history, notifications)
- **Existing Auth Context**: User authentication and profile data
- **Existing Navigation**: Route integration for swipe trading page
- **Existing Item Components**: Reuse image gallery, item cards, and metadata display

## Components and Interfaces

### 1. SwipeTradingPage Component

Main page component that orchestrates the swipe trading experience.

**Props**: None (uses route parameters and auth context)

**State**:
```typescript
interface SwipeTradingState {
  tradeAnchor: Item | null;
  currentItem: Item | null;
  itemPool: Item[];
  swipeHistory: SwipeRecord[];
  loading: boolean;
  error: string | null;
  sessionId: string | null;
}
```

**Responsibilities**:
- Manage swipe session lifecycle
- Coordinate between child components
- Handle data fetching and state management

### 2. TradeAnchorSelector Component

Displays user's available listings for selection as trade anchor.

**Props**:
```typescript
interface TradeAnchorSelectorProps {
  userItems: Item[];
  onSelect: (item: Item) => void;
  selectedItemId: string | null;
}
```

**Behavior**:
- Filters items to show only status="available"
- Displays items in grid layout (reuses existing item card design)
- Highlights selected item
- Shows empty state if no available items

### 3. SwipeInterface Component

Core swipe interaction component with card-based UI.

**Props**:
```typescript
interface SwipeInterfaceProps {
  tradeAnchor: Item;
  currentItem: Item;
  onSwipe: (direction: 'left' | 'right') => void;
  onChangeAnchor: () => void;
  hasMoreItems: boolean;
}
```

**Gesture Handling**:
- Touch events: `touchstart`, `touchmove`, `touchend`
- Mouse events: `mousedown`, `mousemove`, `mouseup`
- Keyboard events: Arrow keys for accessibility

**Animation States**:
- Idle: Card centered
- Dragging: Card follows pointer/touch with rotation
- Swiping: Card animates off-screen
- Loading: Next card fades in

### 4. SwipeCard Component

Individual item card with swipe animations.

**Props**:
```typescript
interface SwipeCardProps {
  item: Item;
  ownerProfile: UserProfile;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}
```

**Visual Feedback**:
- Green overlay when dragging right (interested)
- Red overlay when dragging left (not interested)
- Rotation based on drag distance
- Opacity changes during swipe

### 5. TradeAnchorDisplay Component

Fixed display showing the user's selected trade anchor.

**Props**:
```typescript
interface TradeAnchorDisplayProps {
  item: Item;
  onChangeClick: () => void;
}
```

**Layout**: Fixed position at top or bottom of screen, compact design showing thumbnail and title.

### 6. Trade Offer Service

Backend service for managing trade offers.

**Interface**:
```typescript
interface TradeOfferService {
  createTradeOffer(
    tradeAnchorId: string,
    targetItemId: string,
    offeringUserId: string
  ): Promise<TradeOffer>;
  
  getTradeOffersForUser(userId: string): Promise<TradeOffer[]>;
  
  markOfferAsRead(offerId: string): Promise<void>;
}
```

**Firestore Structure**:
```
tradeOffers/{offerId}
  - tradeAnchorId: string
  - tradeAnchorOwnerId: string
  - targetItemId: string
  - targetItemOwnerId: string
  - offeringUserId: string
  - createdAt: Timestamp
  - updatedAt: Timestamp
  - status: 'pending' | 'read' | 'accepted' | 'declined'
```

### 7. Swipe History Service

Tracks user swipe actions within sessions.

**Interface**:
```typescript
interface SwipeHistoryService {
  recordSwipe(
    sessionId: string,
    userId: string,
    itemId: string,
    direction: 'left' | 'right'
  ): Promise<void>;
  
  getSwipeHistory(sessionId: string, userId: string): Promise<SwipeRecord[]>;
  
  clearHistory(sessionId: string, userId: string): Promise<void>;
}
```

**Firestore Structure**:
```
swipeSessions/{sessionId}
  - userId: string
  - tradeAnchorId: string
  - createdAt: Timestamp
  - swipes: SwipeRecord[]
    - itemId: string
    - direction: 'left' | 'right'
    - timestamp: Timestamp
```

### 8. Notification Service

Handles creation and delivery of trade offer notifications.

**Interface**:
```typescript
interface NotificationService {
  createTradeOfferNotification(
    tradeOffer: TradeOffer,
    tradeAnchorItem: Item,
    targetItem: Item,
    offeringUser: UserProfile
  ): Promise<Notification>;
  
  getUserNotifications(userId: string): Promise<Notification[]>;
  
  markAsRead(notificationId: string): Promise<void>;
}
```

**Firestore Structure**:
```
notifications/{notificationId}
  - userId: string (recipient)
  - type: 'trade_offer'
  - tradeOfferId: string
  - read: boolean
  - createdAt: Timestamp
  - data: {
      offeringUserId: string
      offeringUserName: string
      tradeAnchorId: string
      tradeAnchorTitle: string
      targetItemId: string
      targetItemTitle: string
    }
```

## Data Models

### SwipeSession

```typescript
interface SwipeSession {
  id: string;
  userId: string;
  tradeAnchorId: string;
  createdAt: Timestamp;
  lastActivityAt: Timestamp;
  swipes: SwipeRecord[];
}

interface SwipeRecord {
  itemId: string;
  direction: 'left' | 'right';
  timestamp: Timestamp;
}
```

### TradeOffer

```typescript
interface TradeOffer {
  id: string;
  tradeAnchorId: string;
  tradeAnchorOwnerId: string;
  targetItemId: string;
  targetItemOwnerId: string;
  offeringUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'pending' | 'read' | 'accepted' | 'declined';
}
```

### Notification

```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'trade_offer' | 'message' | 'system';
  tradeOfferId?: string;
  read: boolean;
  createdAt: Timestamp;
  data: NotificationData;
}

interface TradeOfferNotificationData {
  offeringUserId: string;
  offeringUserName: string;
  tradeAnchorId: string;
  tradeAnchorTitle: string;
  tradeAnchorImage: string;
  targetItemId: string;
  targetItemTitle: string;
  targetItemImage: string;
}
```

### ItemPoolQuery

```typescript
interface ItemPoolQuery {
  excludeOwnerIds: string[];
  excludeItemIds: string[];
  status: 'available';
  limit: number;
  offset: number;
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: User's available listings filter

*For any* user with multiple listings of various statuses, the trade anchor selector should display only items owned by that user with status="available"

**Validates: Requirements 1.1**

### Property 2: Trade anchor state management

*For any* item selection action, the swipe session state should contain that item as the trade anchor

**Validates: Requirements 1.2**

### Property 3: Interface transition on anchor selection

*For any* trade anchor selection, the system should transition from the selector view to the swipe interface view

**Validates: Requirements 1.3**

### Property 4: Trade anchor mutability

*For any* swipe session state, the trade anchor should be changeable to a different item from the user's available listings

**Validates: Requirements 1.5**

### Property 5: Single item display

*For any* swipe interface render, exactly one item card should be displayed from the item pool

**Validates: Requirements 2.1**

### Property 6: Item display completeness

*For any* item displayed in the swipe interface, the rendered output should contain the item's title, description, category, condition, at least one image, and owner information

**Validates: Requirements 2.2**

### Property 7: Owner exclusion in item pool

*For any* item pool query with a current user ID, the returned items should not include any items where ownerId equals the current user ID

**Validates: Requirements 2.3**

### Property 8: Available status filtering

*For any* item pool query, all returned items should have status="available"

**Validates: Requirements 2.4**

### Property 9: Trade anchor persistent display

*For any* swipe interface state, the trade anchor should be displayed in a fixed position separate from the swipeable card

**Validates: Requirements 2.5**

### Property 10: Right swipe interpretation

*For any* right swipe gesture, the system should record the action with direction="right" and create a trade offer

**Validates: Requirements 3.1, 4.1**

### Property 11: Left swipe interpretation

*For any* left swipe gesture, the system should record the action with direction="left" and not create a trade offer

**Validates: Requirements 3.2**

### Property 12: Item progression after swipe

*For any* completed swipe action, the next displayed item should be the subsequent item in the item pool that hasn't been swiped yet

**Validates: Requirements 3.4**

### Property 13: Input method equivalence

*For any* swipe action, whether triggered by touch gesture, mouse drag, or button click, the resulting swipe record and side effects should be identical

**Validates: Requirements 3.6**

### Property 14: Trade offer data completeness

*For any* created trade offer, it should contain tradeAnchorId, targetItemId, offeringUserId, and a timestamp

**Validates: Requirements 4.2**

### Property 15: Notification creation on trade offer

*For any* trade offer creation, a notification should be created for the target item's owner

**Validates: Requirements 4.3**

### Property 16: Notification data completeness

*For any* trade offer notification, it should contain the offering user's name, trade anchor title and image, and target item title and image

**Validates: Requirements 4.4**

### Property 17: Trade offer idempotence

*For any* trade offer creation attempt with the same tradeAnchorId and targetItemId, only one trade offer record should exist, with the timestamp updated to the most recent attempt

**Validates: Requirements 4.5, 4.6**

### Property 18: Pending trade offers retrieval

*For any* user, querying their notifications should return all trade offers where they are the target item owner and status is "pending"

**Validates: Requirements 5.3**

### Property 19: Notification read status update

*For any* notification view action, the notification's read field should change from false to true

**Validates: Requirements 5.4**

### Property 20: Notification action data availability

*For any* trade offer notification, it should contain the tradeAnchorId and offeringUserId necessary to construct view and conversation actions

**Validates: Requirements 5.5, 5.6**

### Property 21: Swipe history recording

*For any* swipe action, a swipe record should be created containing itemId, direction, and timestamp

**Validates: Requirements 6.1**

### Property 22: Swipe history exclusion

*For any* item pool query within a swipe session, items whose IDs appear in the session's swipe history should not be included in the results

**Validates: Requirements 6.2**

### Property 23: Swipe history persistence

*For any* swipe session, after recording swipes and simulating a page refresh (re-fetching session data), the swipe history should contain all previously recorded swipes

**Validates: Requirements 6.3**

### Property 24: New session on anchor change

*For any* trade anchor change action, a new swipe session should be created with an empty swipe history

**Validates: Requirements 6.4**

### Property 25: Swipe history reset

*For any* swipe session, after resetting the history, the item pool should include items that were previously swiped on

**Validates: Requirements 6.5**

### Property 26: Item pool ordering

*For any* item pool query, the returned items should be ordered by createdAt timestamp in descending order (newest first)

**Validates: Requirements 7.4**

### Property 27: Batch loading

*For any* item pool query with a limit parameter, the number of returned items should not exceed the limit

**Validates: Requirements 7.5**

### Property 28: Conversation start marks notification read

*For any* conversation initiation from a trade offer notification, the notification's read status should be updated to true

**Validates: Requirements 8.5**

### Property 29: Trade anchor display content

*For any* trade anchor display, it should show the item's primary image (first image in the images array) and title

**Validates: Requirements 9.2**

### Property 30: Trade anchor display update

*For any* trade anchor change, the trade anchor display should immediately reflect the new item's image and title

**Validates: Requirements 9.5**

### Property 31: Swipe interest counter increment

*For any* trade offer creation, the target item's swipeInterestCount should increase by 1

**Validates: Requirements 10.1**

### Property 32: Swipe interest display

*For any* item in the user's listings view, if swipeInterestCount > 0, it should be displayed alongside other metadata

**Validates: Requirements 10.2**

### Property 33: Counter independence

*For any* item, the swipeInterestCount and favoriteCount should be independent fields that can change without affecting each other

**Validates: Requirements 10.3**

### Property 34: Trade offers query by item

*For any* user's item, querying trade offers where targetItemId equals the item's ID should return all trade offers for that item

**Validates: Requirements 10.5**

## Error Handling

### Client-Side Errors

1. **Network Failures**
   - Retry logic with exponential backoff for failed requests
   - Display user-friendly error messages
   - Cache swipe actions locally and sync when connection restored

2. **Invalid State**
   - Validate trade anchor exists and is available before starting session
   - Handle cases where item becomes unavailable during swipe session
   - Gracefully handle empty item pools

3. **Gesture Recognition Failures**
   - Provide button fallbacks for all swipe actions
   - Handle edge cases like rapid swipes or incomplete gestures
   - Validate swipe direction thresholds

### Server-Side Errors

1. **Firestore Errors**
   - Handle permission denied errors (user not authenticated)
   - Handle not found errors (item or user deleted)
   - Handle write conflicts with transaction retries

2. **Data Validation**
   - Validate all IDs exist before creating trade offers
   - Ensure items are still available before creating offers
   - Validate user owns trade anchor before creating offers

3. **Rate Limiting**
   - Implement client-side throttling for swipe actions
   - Prevent spam by limiting trade offers per user per time period

## Testing Strategy

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage.

### Unit Testing

Unit tests focus on specific examples, edge cases, and integration points:

- **Empty States**: No available listings, exhausted item pool, no notifications
- **Edge Cases**: Single item in pool, rapid swipes, duplicate trade offers
- **Integration**: Component interactions, Firebase queries, notification delivery
- **Error Conditions**: Network failures, invalid data, permission errors

### Property-Based Testing

Property-based tests verify universal properties across all inputs using randomized test data. Each test should run a minimum of 100 iterations.

**Testing Library**: Use `fast-check` for TypeScript/JavaScript property-based testing

**Test Configuration**:
```typescript
fc.assert(
  fc.property(/* generators */, (/* inputs */) => {
    // Property assertion
  }),
  { numRuns: 100 }
);
```

**Tagging Convention**: Each property test must include a comment tag:
```typescript
// Feature: swipe-trading, Property 7: Owner exclusion in item pool
```

**Property Test Examples**:

1. **Property 7: Owner exclusion** - Generate random users and items, query item pool, verify no items belong to current user
2. **Property 17: Trade offer idempotence** - Generate random trade offers, create same offer twice, verify only one record exists
3. **Property 22: Swipe history exclusion** - Generate random swipe history, query item pool, verify no swiped items appear
4. **Property 26: Item pool ordering** - Generate random items with various timestamps, query pool, verify descending order

**Generators Needed**:
- User generator (with random IDs and profiles)
- Item generator (with random fields and statuses)
- Swipe session generator (with random history)
- Trade offer generator (with random item pairs)

### Test Coverage Goals

- All 34 correctness properties implemented as property-based tests
- Edge cases covered by unit tests
- Integration tests for critical user flows (anchor selection → swipe → notification)
- Error handling paths tested with unit tests
