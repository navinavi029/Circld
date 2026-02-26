# Design Document: Enhanced Demo Presentation with Real Components and Complete Trade Flow

## Overview

This design specifies the implementation of an enhanced demonstration page that showcases the Circl'd trading platform using real application components instead of static slides. The demo will present a complete trade flow from swiping through matching, messaging, and trade completion, with engaging typing animations and interactive navigation controls.

The enhanced demo transforms the current slide-based presentation into an immersive, realistic preview of the platform's core functionality. By integrating actual production components (SwipeCard, ConversationView, NotificationList) with realistic mock data, potential users will experience the application's interface and workflow authentically.

### Key Design Goals

1. **Authenticity**: Use real production components with identical styling and behavior
2. **Engagement**: Implement typing animations and simulated interactions to create dynamic presentation
3. **Clarity**: Present a complete trade flow that demonstrates the entire user journey
4. **Control**: Provide intuitive navigation allowing viewers to explore at their own pace
5. **Responsiveness**: Maintain full functionality across mobile, tablet, and desktop viewports

## Architecture

### Component Structure

```
Demo (Enhanced)
├── DemoFlowController
│   ├── State Management (current step, demo data, animation state)
│   ├── Navigation Logic (next/prev/goto step)
│   └── Auto-advance Timer
├── FlowSteps (Array of step configurations)
│   ├── IntroStep
│   ├── SwipeStep (with SwipeCard)
│   ├── MatchStep (with NotificationList)
│   ├── MessageStep (with ConversationView)
│   └── CompletionStep
├── TypingAnimator
│   ├── Character-by-character rendering
│   ├── Pause/resume capability
│   └── Instant display for backward navigation
├── NavigationControls
│   ├── Previous/Next buttons
│   ├── Progress indicators
│   └── Keyboard event handlers
└── DemoDataProvider
    ├── Mock items
    ├── Mock user profiles
    ├── Mock trade offers
    └── Mock messages
```

### Data Flow

1. **Initialization**: DemoFlowController loads demo data and initializes at step 0
2. **Step Rendering**: Current step configuration determines which component to render
3. **Animation**: TypingAnimator handles text animations for explanatory content
4. **Interaction Simulation**: Automated interactions trigger at appropriate times (swipe gestures, message sending)
5. **Navigation**: User or auto-advance triggers step transitions with smooth animations
6. **State Persistence**: Navigation history allows instant display of previously viewed content

### Technology Stack

- **React**: Component framework (already in use)
- **TypeScript**: Type safety for demo data and component props
- **Framer Motion**: Animation library (already in use for transitions)
- **Existing Components**: SwipeCard, ConversationView, NotificationList (no modifications needed)

## Components and Interfaces

### DemoFlowController

The main orchestrator component that manages the demo flow state and coordinates all sub-components.

```typescript
interface DemoFlowControllerProps {
  autoAdvance?: boolean;
  autoAdvanceDelay?: number; // milliseconds
}

interface DemoFlowState {
  currentStep: number;
  direction: 1 | -1; // for animation direction
  isAnimating: boolean;
  visitedSteps: Set<number>; // tracks which steps have been viewed
  isPaused: boolean;
}

interface FlowStep {
  id: string;
  type: 'intro' | 'swipe' | 'match' | 'message' | 'completion';
  title: string;
  description: string;
  component: React.ComponentType<any>;
  componentProps: Record<string, any>;
  simulatedInteraction?: SimulatedInteraction;
  minDisplayDuration: number; // milliseconds
}

interface SimulatedInteraction {
  type: 'swipe' | 'notification-appear' | 'message-send' | 'button-click';
  delay: number; // milliseconds after step loads
  duration: number; // milliseconds for animation
  data?: any; // interaction-specific data
}
```

### TypingAnimator

A reusable component that renders text with character-by-character animation.

```typescript
interface TypingAnimatorProps {
  text: string;
  speed: number; // milliseconds per character (30-80ms)
  onComplete?: () => void;
  instant?: boolean; // skip animation, show immediately
  className?: string;
}

interface TypingAnimatorState {
  displayedText: string;
  isComplete: boolean;
  isPaused: boolean;
}
```

### NavigationControls

Handles user navigation through the demo flow.

```typescript
interface NavigationControlsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToStep: (step: number) => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  isAnimating: boolean;
}
```

### DemoDataProvider

Provides realistic mock data for all demo components.

```typescript
interface DemoData {
  items: Item[];
  users: UserProfile[];
  tradeOffers: TradeOffer[];
  conversations: Conversation[];
  messages: Message[];
  notifications: Notification[];
}

interface DemoDataProviderProps {
  children: React.ReactNode;
}

// Context API
const DemoDataContext = React.createContext<DemoData | null>(null);
```

## Data Models

### Mock Data Structure

The demo requires realistic mock data that represents typical platform usage. All data will be defined as constants within the demo module.

#### Mock Items

```typescript
const DEMO_ITEMS: Item[] = [
  {
    id: 'demo-item-1',
    ownerId: 'demo-user-1',
    title: 'Vintage Polaroid Camera',
    description: 'Classic instant camera in excellent working condition. Includes original case and manual. Perfect for photography enthusiasts!',
    category: 'electronics',
    condition: 'good',
    images: [
      '/demo-images/polaroid-1.jpg',
      '/demo-images/polaroid-2.jpg'
    ],
    status: 'available',
    createdAt: Timestamp.now(),
    viewCount: 45,
    favoriteCount: 12,
    swipeInterestCount: 8
  },
  {
    id: 'demo-item-2',
    ownerId: 'demo-user-2',
    title: 'Acoustic Guitar',
    description: 'Beautiful acoustic guitar with rich, warm tone. Barely used, comes with soft case and extra strings.',
    category: 'music',
    condition: 'like-new',
    images: [
      '/demo-images/guitar-1.jpg',
      '/demo-images/guitar-2.jpg',
      '/demo-images/guitar-3.jpg'
    ],
    status: 'available',
    createdAt: Timestamp.now(),
    viewCount: 67,
    favoriteCount: 23,
    swipeInterestCount: 15
  },
  {
    id: 'demo-item-3',
    ownerId: 'demo-user-1',
    title: 'Vintage Vinyl Records Collection',
    description: 'Collection of 20 classic rock vinyl records from the 70s and 80s. All in great condition with minimal wear.',
    category: 'music',
    condition: 'good',
    images: [
      '/demo-images/vinyl-1.jpg'
    ],
    status: 'available',
    createdAt: Timestamp.now(),
    viewCount: 34,
    favoriteCount: 9,
    swipeInterestCount: 6
  }
];
```

#### Mock User Profiles

```typescript
const DEMO_USERS: UserProfile[] = [
  {
    uid: 'demo-user-1',
    firstName: 'Alex',
    lastName: 'Chen',
    email: 'alex.chen@demo.com',
    location: 'San Francisco, CA',
    coordinates: {
      latitude: 37.7749,
      longitude: -122.4194
    },
    eligible_to_match: true,
    createdAt: Timestamp.now(),
    photoUrl: '/demo-images/user-alex.jpg',
    lastPhotoUpdate: Timestamp.now(),
    lastLocationUpdate: Timestamp.now()
  },
  {
    uid: 'demo-user-2',
    firstName: 'Jordan',
    lastName: 'Martinez',
    email: 'jordan.martinez@demo.com',
    location: 'Oakland, CA',
    coordinates: {
      latitude: 37.8044,
      longitude: -122.2712
    },
    eligible_to_match: true,
    createdAt: Timestamp.now(),
    photoUrl: '/demo-images/user-jordan.jpg',
    lastPhotoUpdate: Timestamp.now(),
    lastLocationUpdate: Timestamp.now()
  }
];
```

#### Mock Trade Offers

```typescript
const DEMO_TRADE_OFFERS: TradeOffer[] = [
  {
    id: 'demo-offer-1',
    tradeAnchorId: 'demo-item-3', // Alex's vinyl collection
    tradeAnchorOwnerId: 'demo-user-1',
    targetItemId: 'demo-item-2', // Jordan's guitar
    targetItemOwnerId: 'demo-user-2',
    offeringUserId: 'demo-user-1',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    status: 'accepted',
    completedBy: []
  }
];
```

#### Mock Conversations and Messages

```typescript
const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'demo-conversation-1',
    tradeOfferId: 'demo-offer-1',
    participantIds: ['demo-user-1', 'demo-user-2'],
    tradeAnchorId: 'demo-item-3',
    targetItemId: 'demo-item-2',
    createdAt: Timestamp.now(),
    lastMessageAt: Timestamp.now(),
    lastMessageText: 'Sounds great! When works for you?',
    unreadCount: {
      'demo-user-1': 0,
      'demo-user-2': 0
    },
    status: 'active'
  }
];

const DEMO_MESSAGES: Message[] = [
  {
    id: 'demo-msg-1',
    conversationId: 'demo-conversation-1',
    senderId: 'demo-user-1',
    text: 'Hi! I\'m interested in trading my vinyl collection for your guitar. The records are all in great condition!',
    createdAt: Timestamp.now(),
    readBy: ['demo-user-1', 'demo-user-2']
  },
  {
    id: 'demo-msg-2',
    conversationId: 'demo-conversation-1',
    senderId: 'demo-user-2',
    text: 'That sounds awesome! I love classic rock. Can we meet up this weekend?',
    createdAt: Timestamp.now(),
    readBy: ['demo-user-1', 'demo-user-2']
  },
  {
    id: 'demo-msg-3',
    conversationId: 'demo-conversation-1',
    senderId: 'demo-user-1',
    text: 'Perfect! How about Saturday afternoon at the coffee shop on Main Street?',
    createdAt: Timestamp.now(),
    readBy: ['demo-user-1', 'demo-user-2']
  },
  {
    id: 'demo-msg-4',
    conversationId: 'demo-conversation-1',
    senderId: 'demo-user-2',
    text: 'Sounds great! When works for you?',
    createdAt: Timestamp.now(),
    readBy: ['demo-user-1', 'demo-user-2']
  }
];
```

#### Mock Notifications

```typescript
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'demo-notif-1',
    userId: 'demo-user-2',
    type: 'trade_offer',
    tradeOfferId: 'demo-offer-1',
    read: false,
    createdAt: Timestamp.now(),
    data: {
      offeringUserId: 'demo-user-1',
      offeringUserName: 'Alex Chen',
      tradeAnchorId: 'demo-item-3',
      tradeAnchorTitle: 'Vintage Vinyl Records Collection',
      tradeAnchorImage: '/demo-images/vinyl-1.jpg',
      targetItemId: 'demo-item-2',
      targetItemTitle: 'Acoustic Guitar',
      targetItemImage: '/demo-images/guitar-1.jpg'
    } as TradeOfferNotificationData
  }
];
```

### Flow Step Configurations

```typescript
const DEMO_FLOW_STEPS: FlowStep[] = [
  {
    id: 'intro',
    type: 'intro',
    title: 'Welcome to Circl\'d',
    description: 'Experience the future of trading. Swipe through items, match with traders, and complete trades seamlessly.',
    component: IntroSlide,
    componentProps: {
      icon: '🔄',
      gradient: 'from-emerald-500 to-teal-600'
    },
    minDisplayDuration: 3000
  },
  {
    id: 'swipe',
    type: 'swipe',
    title: 'Swipe to Discover',
    description: 'Browse items you\'re interested in. Swipe right to express interest, left to pass.',
    component: SwipeCard,
    componentProps: {
      item: DEMO_ITEMS[1], // Guitar
      ownerProfile: DEMO_USERS[1], // Jordan
      onSwipeLeft: () => {},
      onSwipeRight: () => {}
    },
    simulatedInteraction: {
      type: 'swipe',
      delay: 2000,
      duration: 800,
      data: { direction: 'right' }
    },
    minDisplayDuration: 5000
  },
  {
    id: 'match',
    type: 'match',
    title: 'Get Matched',
    description: 'When someone is interested in your item, you\'ll receive a notification with their trade offer.',
    component: NotificationList,
    componentProps: {
      // Will be wrapped to use demo data context
    },
    simulatedInteraction: {
      type: 'notification-appear',
      delay: 1500,
      duration: 600
    },
    minDisplayDuration: 4000
  },
  {
    id: 'message',
    type: 'message',
    title: 'Start Chatting',
    description: 'Accept the offer and chat with your trade partner to arrange the exchange.',
    component: ConversationView,
    componentProps: {
      // Will be wrapped to use demo data context
    },
    simulatedInteraction: {
      type: 'message-send',
      delay: 2500,
      duration: 1000,
      data: { messageText: 'Sounds great! When works for you?' }
    },
    minDisplayDuration: 6000
  },
  {
    id: 'completion',
    type: 'completion',
    title: 'Complete the Trade',
    description: 'After meeting up and exchanging items, both parties confirm completion. It\'s that simple!',
    component: CompletionSlide,
    componentProps: {
      icon: '✅',
      gradient: 'from-green-500 to-emerald-600'
    },
    simulatedInteraction: {
      type: 'button-click',
      delay: 2000,
      duration: 500
    },
    minDisplayDuration: 4000
  }
];
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

- **Redundancy 1**: Properties 4.3 and 4.4 (button state based on position) can be combined into a single comprehensive property about navigation button states
- **Redundancy 2**: Properties 4.5 and 7.3 are identical (keyboard navigation support) - will keep only one
- **Redundancy 3**: Properties 8.1, 8.2, 8.3, 8.4 all test that simulated interactions occur - can be combined into one property about all simulated interactions executing
- **Redundancy 4**: Properties 6.1 and 6.2 (responsive layout) can be combined into a single property about layout responding to viewport width

The following properties provide unique validation value and will be included:

### Property 1: Typing Animation Character Progression

*For any* explanatory text displayed in the demo, the text should animate character-by-character from empty to complete, with each character appearing sequentially.

**Validates: Requirements 2.1**

### Property 2: Typing Animation Speed Constraint

*For any* typing animation in progress, the time between consecutive character appearances should be between 30ms and 80ms.

**Validates: Requirements 2.2**

### Property 3: Post-Animation Delay

*For any* completed typing animation, at least 500ms should elapse before the demo advances to the next flow step.

**Validates: Requirements 2.3**

### Property 4: Animation Pause on Navigation

*For any* typing animation in progress, navigating away from the current step should pause the animation, and navigating back should resume it from where it left off.

**Validates: Requirements 2.4**

### Property 5: Instant Display on Backward Navigation

*For any* previously visited step with typing animation, navigating backward to that step should display the complete text instantly without re-animating.

**Validates: Requirements 2.5**

### Property 6: Minimum Step Display Duration

*For any* flow step with auto-advance enabled, at least 3000ms should elapse from when the step is displayed before auto-advancing to the next step.

**Validates: Requirements 3.6**

### Property 7: Simulated Interaction Execution

*For any* flow step that defines a simulated interaction, the interaction animation should execute after the specified delay and complete within the specified duration.

**Validates: Requirements 3.7, 8.1, 8.2, 8.3, 8.4**

### Property 8: Navigation Button State Management

*For any* demo state, the previous button should be disabled when on the first step, and the next button should be replaced with a restart button when on the last step.

**Validates: Requirements 4.3, 4.4**

### Property 9: Keyboard Navigation Support

*For any* demo state, pressing the right arrow key should advance to the next step (if not on last step), and pressing the left arrow key should return to the previous step (if not on first step).

**Validates: Requirements 4.5, 7.3**

### Property 10: Progress Indicator Accuracy

*For any* demo state, the progress indicator should display the current step position accurately, with the current step highlighted and the total number of steps visible.

**Validates: Requirements 4.6**

### Property 11: Progress Indicator Navigation

*For any* progress indicator dot clicked by the user, the demo should navigate to the corresponding flow step.

**Validates: Requirements 4.7**

### Property 12: Demo Data Image URLs

*For any* demo data object that includes images, all image URLs should be non-empty strings.

**Validates: Requirements 5.5**

### Property 13: Demo Data Timestamp Realism

*For any* demo data object that includes timestamps, the timestamps should be within a reasonable range of the current time (e.g., within the past 30 days).

**Validates: Requirements 5.6**

### Property 14: Responsive Layout Adaptation

*For any* viewport width, the demo should display components in mobile layout when width is less than 768px, and in desktop layout when width is 768px or greater.

**Validates: Requirements 6.1, 6.2**

### Property 15: Navigation Controls Accessibility

*For any* viewport size, navigation controls (previous, next, progress indicators) should remain visible and accessible.

**Validates: Requirements 6.4**

### Property 16: Touch Gesture Support on Mobile

*For any* SwipeCard component displayed on a mobile viewport (width < 768px), touch events should trigger the appropriate swipe simulation.

**Validates: Requirements 6.5**

### Property 17: Step Counter Display

*For any* demo state, a counter displaying "current step / total steps" should be visible and show the correct values.

**Validates: Requirements 7.4**

### Property 18: Animation Blocking During Transitions

*For any* demo state where isAnimating is true, navigation functions (next, previous, goToStep) should be blocked until the animation completes.

**Validates: Requirements 7.5**

### Property 19: Simulated Interaction Timing

*For any* simulated interaction, the interaction should complete within 2000ms from when it starts.

**Validates: Requirements 8.5**

### Property 20: Simulated Interaction State Changes

*For any* completed simulated interaction, the UI should reflect the expected state change (e.g., card removed after swipe, message added after send, notification visible after appear).

**Validates: Requirements 8.6**

## Error Handling

### Animation Errors

**Scenario**: Typing animation fails to complete due to component unmounting or state errors

**Handling**:
- Implement cleanup in useEffect hooks to cancel ongoing animations
- Store animation state in refs to prevent memory leaks
- Provide fallback to instant text display if animation fails

**User Experience**: Text appears instantly, demo continues normally

### Navigation Errors

**Scenario**: User attempts to navigate to invalid step index

**Handling**:
- Validate step index bounds before navigation
- Clamp index to valid range [0, totalSteps - 1]
- Log warning in development mode

**User Experience**: Navigation is ignored, user remains on current step

### Component Rendering Errors

**Scenario**: Real component fails to render with demo data

**Handling**:
- Wrap components in Error Boundaries
- Display fallback UI with error message
- Log error details for debugging
- Provide "Skip Step" button to continue demo

**User Experience**: Error message displayed, option to skip problematic step

### Data Loading Errors

**Scenario**: Demo data fails to initialize (malformed data, missing images)

**Handling**:
- Validate demo data structure on initialization
- Provide default fallback data for missing fields
- Use placeholder images if specified images fail to load
- Log validation errors in development mode

**User Experience**: Demo continues with fallback data, no user-facing errors

### Timing Errors

**Scenario**: Auto-advance timer conflicts with user navigation

**Handling**:
- Clear auto-advance timer when user manually navigates
- Reset timer when arriving at new step
- Disable auto-advance during animations
- Store timer reference for proper cleanup

**User Experience**: User navigation takes precedence, no unexpected auto-advances

### Responsive Layout Errors

**Scenario**: Components don't adapt properly to viewport changes

**Handling**:
- Use CSS media queries as primary responsive mechanism
- Implement window resize listener with debouncing
- Force re-render on significant viewport changes
- Test components at common breakpoints

**User Experience**: Layout adapts smoothly to viewport changes

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Together, these approaches provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Unit Testing

Unit tests will focus on:

1. **Component Integration Examples**
   - Test that SwipeCard renders with demo item data (Requirements 1.1)
   - Test that ConversationView renders with demo conversation data (Requirements 1.2)
   - Test that NotificationList renders with demo notification data (Requirements 1.3)
   - Test that gradient background styling is applied (Requirements 7.2)

2. **Flow Configuration Examples**
   - Test that flow includes swipe step with SwipeCard (Requirements 3.1)
   - Test that flow includes match step with NotificationList (Requirements 3.2)
   - Test that flow includes message step with ConversationView (Requirements 3.3)
   - Test that flow includes completion step (Requirements 3.4)
   - Test that restart option appears on final step (Requirements 3.5)

3. **Navigation Controls Examples**
   - Test that next button is present (Requirements 4.1)
   - Test that previous button is present (Requirements 4.2)

4. **Demo Data Structure Examples**
   - Test that at least 3 items exist with required fields (Requirements 5.1)
   - Test that at least 2 user profiles exist with required fields (Requirements 5.2)
   - Test that trade offer data exists and links items/users (Requirements 5.3)
   - Test that conversation data exists with at least 4 messages (Requirements 5.4)

5. **Edge Cases**
   - Test navigation at boundary conditions (first/last step)
   - Test rapid navigation attempts during animations
   - Test viewport resize during active animations
   - Test keyboard navigation with modifier keys
   - Test touch events on non-touch devices

6. **Error Conditions**
   - Test component rendering with invalid demo data
   - Test navigation with out-of-bounds step indices
   - Test animation cleanup on component unmount
   - Test missing image URLs in demo data

### Property-Based Testing

Property-based tests will use **fast-check** (JavaScript/TypeScript property testing library) with a minimum of 100 iterations per test.

Each property test must include a comment tag referencing the design document property:

```typescript
// Feature: enhanced-demo-presentation, Property 1: Typing Animation Character Progression
```

#### Property Test Implementations

1. **Typing Animation Properties** (Properties 1-5)
   - Generate random text strings
   - Verify character-by-character progression
   - Measure timing between characters
   - Test pause/resume behavior
   - Test instant display on backward navigation

2. **Timing Properties** (Properties 3, 6, 19)
   - Generate random step configurations
   - Verify minimum delays are respected
   - Verify maximum durations are not exceeded
   - Test auto-advance timing

3. **Navigation Properties** (Properties 8-11, 18)
   - Generate random step indices
   - Verify button states at all positions
   - Test keyboard event handling
   - Test progress indicator accuracy
   - Verify animation blocking

4. **Data Validation Properties** (Properties 12-13)
   - Generate random demo data structures
   - Verify all image URLs are non-empty
   - Verify timestamps are within valid range
   - Test data completeness

5. **Responsive Properties** (Properties 14-16)
   - Generate random viewport widths
   - Verify layout changes at breakpoints
   - Test navigation control visibility
   - Test touch gesture handling

6. **Interaction Properties** (Properties 7, 19-20)
   - Generate random interaction configurations
   - Verify interactions execute within time limits
   - Verify state changes occur after interactions
   - Test interaction animations

### Test Configuration

```typescript
// fast-check configuration for property tests
const propertyTestConfig = {
  numRuns: 100, // minimum iterations
  timeout: 5000, // 5 seconds per test
  verbose: true, // show detailed output on failure
};
```

### Testing Tools

- **Jest**: Unit test framework
- **React Testing Library**: Component testing utilities
- **fast-check**: Property-based testing library
- **@testing-library/user-event**: User interaction simulation
- **jest-dom**: Custom DOM matchers

### Coverage Goals

- **Line Coverage**: Minimum 85%
- **Branch Coverage**: Minimum 80%
- **Function Coverage**: Minimum 90%
- **Property Coverage**: 100% of defined correctness properties

### Continuous Integration

All tests must pass before merging:
- Unit tests run on every commit
- Property tests run on every pull request
- Visual regression tests run on UI changes
- Performance tests run on demo flow changes
