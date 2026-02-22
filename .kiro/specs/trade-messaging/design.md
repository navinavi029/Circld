# Design Document: Trade Messaging

## Overview

The trade messaging feature enables real-time text communication between users who have accepted trade offers. The system leverages Firebase Firestore for data persistence and real-time updates, integrating seamlessly with the existing trade offer and notification infrastructure.

The design follows a conversation-based model where each accepted trade offer can have one associated conversation. Messages are stored in a subcollection under each conversation document, enabling efficient querying and real-time synchronization.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   React UI      │
│  Components     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Messaging     │
│    Service      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│   Firestore     │◄────►│  Real-time       │
│   Database      │      │  Listeners       │
└─────────────────┘      └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Notification   │
│    Service      │
└─────────────────┘
```

### Data Flow

1. **Conversation Creation**: When a trade offer status changes to 'accepted', a conversation document is created
2. **Message Sending**: User sends message → Service validates → Message stored in Firestore → Real-time listener notifies recipient
3. **Message Retrieval**: User opens conversation → Service fetches messages → Real-time listener subscribes to new messages
4. **Notifications**: New message → Notification created → User sees unread badge → User opens conversation → Messages marked as read

## Components and Interfaces

### 1. Messaging Service (`messagingService.ts`)

The core service handling all messaging operations.

**Functions:**

```typescript
// Create a conversation for an accepted trade offer
createConversation(tradeOfferId: string): Promise<Conversation>

// Send a message in a conversation
sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<Message>

// Get all messages for a conversation
getMessages(
  conversationId: string,
  userId: string
): Promise<Message[]>

// Subscribe to real-time message updates
subscribeToMessages(
  conversationId: string,
  userId: string,
  callback: (messages: Message[]) => void
): () => void

// Get all conversations for a user
getUserConversations(userId: string): Promise<ConversationSummary[]>

// Mark all messages in a conversation as read
markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void>

// Get conversation by trade offer ID
getConversationByTradeOffer(tradeOfferId: string): Promise<Conversation | null>
```

### 2. UI Components

**MessagesPage Component**
- Displays list of all user's conversations
- Shows unread message counts
- Allows navigation to individual conversations

**ConversationView Component**
- Displays messages for a specific conversation
- Shows trade item details in header
- Provides message input interface
- Handles real-time message updates

**MessageList Component**
- Renders messages in chronological order
- Distinguishes between sent and received messages
- Displays timestamps and read status

**MessageInput Component**
- Text input with character count
- Send button with validation
- Handles enter key submission

### 3. Navigation Integration

Update existing Navigation component to include:
- Messages link with unread badge
- Real-time unread count updates

## Data Models

### Conversation Document

**Firestore Path:** `/conversations/{conversationId}`

```typescript
interface Conversation {
  id: string;
  tradeOfferId: string;
  participantIds: [string, string]; // [offeringUserId, targetItemOwnerId]
  tradeAnchorId: string;
  targetItemId: string;
  createdAt: Timestamp;
  lastMessageAt: Timestamp;
  lastMessageText: string;
  unreadCount: {
    [userId: string]: number;
  };
}
```

**Indexes Required:**
- `participantIds` (array-contains) + `lastMessageAt` (desc)

### Message Document

**Firestore Path:** `/conversations/{conversationId}/messages/{messageId}`

```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
  readBy: string[]; // Array of user IDs who have read the message
}
```

**Indexes Required:**
- `createdAt` (asc) for chronological ordering

### ConversationSummary

Used for displaying conversation lists:

```typescript
interface ConversationSummary {
  conversation: Conversation;
  tradeAnchorTitle: string;
  tradeAnchorImage: string;
  targetItemTitle: string;
  targetItemImage: string;
  partnerName: string;
  partnerId: string;
  unreadCount: number;
}
```

### Message Notification Data

Extends existing notification system:

```typescript
interface MessageNotificationData {
  conversationId: string;
  senderId: string;
  senderName: string;
  messagePreview: string; // First 50 chars of message
  tradeAnchorTitle: string;
  targetItemTitle: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Conversation creation for accepted trades
*For any* trade offer with status 'accepted', creating a conversation should result in a conversation document with both participants (offering user and target item owner) in the participantIds array.
**Validates: Requirements 1.1, 1.2**

### Property 2: Conversation creation idempotency
*For any* trade offer, calling createConversation multiple times should return the same conversation ID without creating duplicates.
**Validates: Requirements 1.3**

### Property 3: New conversation initialization
*For any* newly created conversation, it should have zero messages, an empty unreadCount object, and a valid createdAt timestamp.
**Validates: Requirements 1.4**

### Property 4: Message storage completeness
*For any* message sent by a participant, the stored message should contain senderId, text content, conversationId, and a valid timestamp.
**Validates: Requirements 2.1**

### Property 5: Participant-only message sending
*For any* conversation and any user who is a participant, that user should be able to send messages successfully.
**Validates: Requirements 2.2**

### Property 6: Non-participant message rejection
*For any* conversation and any user who is not a participant, attempting to send a message should result in an authorization error.
**Validates: Requirements 2.3**

### Property 7: Whitespace message rejection
*For any* string composed entirely of whitespace characters, attempting to send it as a message should be rejected.
**Validates: Requirements 2.4**

### Property 8: Message chronological ordering
*For any* conversation with messages, retrieving messages should return them ordered by timestamp in ascending order (oldest first).
**Validates: Requirements 3.1**

### Property 9: Participant-only message retrieval
*For any* conversation and any user who is a participant, that user should be able to retrieve all messages in the conversation.
**Validates: Requirements 3.2**

### Property 10: Non-participant retrieval rejection
*For any* conversation and any user who is not a participant, attempting to retrieve messages should result in an authorization error.
**Validates: Requirements 3.3**

### Property 11: Retrieved message completeness
*For any* message retrieved from a conversation, it should include senderId, text, timestamp, and readBy array.
**Validates: Requirements 3.4**

### Property 12: Message notification creation
*For any* message sent in a conversation, a notification should be created for the recipient (the participant who is not the sender).
**Validates: Requirements 5.1**

### Property 13: Unread count accuracy
*For any* user with conversations, the total unread count should equal the sum of unread messages across all their conversations.
**Validates: Requirements 5.2**

### Property 14: Read marking on conversation view
*For any* conversation, when a participant views it, all messages in that conversation should be marked as read by that participant.
**Validates: Requirements 5.3**

### Property 15: Notification data completeness
*For any* message notification created, it should include sender name, message preview (first 50 characters), and trade item details.
**Validates: Requirements 5.4**

### Property 16: Accepted trades only
*For any* trade offer with status other than 'accepted', attempting to create a conversation should be rejected.
**Validates: Requirements 6.3, 6.4**

### Property 17: User conversation filtering
*For any* user, requesting their conversations should return only conversations where that user is in the participantIds array.
**Validates: Requirements 7.1**

### Property 18: Conversation list ordering
*For any* set of conversations for a user, they should be ordered by lastMessageAt timestamp in descending order (newest first).
**Validates: Requirements 7.2**

### Property 19: Conversation summary completeness
*For any* conversation summary, it should include trade item details (titles and images), partner name, last message preview, and unread count.
**Validates: Requirements 7.3**

### Property 20: Message persistence round-trip
*For any* message sent successfully, retrieving messages from that conversation should include the sent message with identical content.
**Validates: Requirements 8.1, 8.4**

### Property 21: HTML sanitization
*For any* message containing HTML or script tags, the stored message should have those tags removed or escaped.
**Validates: Requirements 10.1**

### Property 22: URL preservation
*For any* message containing URLs, the stored message should preserve the URLs as plain text without modification.
**Validates: Requirements 10.2**

### Property 23: Line break preservation
*For any* message containing line break characters, the stored message should preserve those line breaks.
**Validates: Requirements 10.3**

## Error Handling

### Validation Errors

**Invalid Input Errors:**
- Empty or whitespace-only messages → Return error: "Message cannot be empty"
- Messages exceeding 2000 characters → Return error: "Message exceeds maximum length"
- Missing required fields → Return error: "Missing required field: {fieldName}"

**Authorization Errors:**
- Non-participant attempting to send message → Return error: "User is not authorized to send messages in this conversation"
- Non-participant attempting to retrieve messages → Return error: "User is not authorized to access this conversation"
- Attempting to create conversation for non-accepted trade → Return error: "Conversation can only be created for accepted trades"

### Database Errors

**Firestore Errors:**
- Document not found → Return error: "Conversation not found" or "Message not found"
- Permission denied → Return error: "Access denied"
- Network errors → Retry with exponential backoff using existing `retryWithBackoff` utility
- Timeout errors → Retry up to 3 times, then return error: "Operation timed out"

### Real-Time Listener Errors

**Subscription Errors:**
- Listener fails to establish → Log error and attempt reconnection
- Listener disconnects → Automatically reconnect when network available
- Permission changes → Unsubscribe and notify user of access loss

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests:**
- Specific examples demonstrating correct behavior
- Edge cases (empty conversations, single message, boundary conditions)
- Error conditions (invalid inputs, authorization failures)
- Integration points with Firebase and notification service

**Property-Based Tests:**
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: trade-messaging, Property {number}: {property_text}**

### Property-Based Testing Configuration

**Library:** Use `fast-check` for TypeScript property-based testing

**Test Configuration:**
- Minimum 100 iterations per property test
- Each property from the Correctness Properties section must have one corresponding property-based test
- Tag format: `// Feature: trade-messaging, Property 1: Conversation creation for accepted trades`

**Example Property Test Structure:**

```typescript
import fc from 'fast-check';

// Feature: trade-messaging, Property 1: Conversation creation for accepted trades
test('conversation creation includes both participants', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        tradeOfferId: fc.uuid(),
        offeringUserId: fc.uuid(),
        targetItemOwnerId: fc.uuid(),
      }),
      async ({ tradeOfferId, offeringUserId, targetItemOwnerId }) => {
        // Setup: Create accepted trade offer
        const tradeOffer = await createMockTradeOffer({
          id: tradeOfferId,
          offeringUserId,
          targetItemOwnerId,
          status: 'accepted',
        });
        
        // Act: Create conversation
        const conversation = await createConversation(tradeOfferId);
        
        // Assert: Both participants present
        expect(conversation.participantIds).toContain(offeringUserId);
        expect(conversation.participantIds).toContain(targetItemOwnerId);
        expect(conversation.participantIds).toHaveLength(2);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Coverage

**Service Layer Tests:**
- `messagingService.test.ts`: Test all service functions with specific examples
- Test conversation creation with accepted/declined/pending trades
- Test message sending with valid/invalid inputs
- Test access control with participants/non-participants
- Test message retrieval and ordering
- Test unread count calculations

**Component Tests:**
- `MessagesPage.test.tsx`: Test conversation list rendering and navigation
- `ConversationView.test.tsx`: Test message display and real-time updates
- `MessageInput.test.tsx`: Test input validation and submission

**Integration Tests:**
- Test end-to-end flow: accept trade → create conversation → send message → receive notification
- Test real-time listener behavior with multiple users
- Test conversation list updates when new messages arrive

### Test Data Generators

Create generators for property-based tests:

```typescript
// Generate random conversations
const conversationArbitrary = fc.record({
  id: fc.uuid(),
  tradeOfferId: fc.uuid(),
  participantIds: fc.tuple(fc.uuid(), fc.uuid()),
  tradeAnchorId: fc.uuid(),
  targetItemId: fc.uuid(),
  createdAt: fc.date(),
  lastMessageAt: fc.date(),
});

// Generate random messages
const messageArbitrary = fc.record({
  id: fc.uuid(),
  conversationId: fc.uuid(),
  senderId: fc.uuid(),
  text: fc.string({ minLength: 1, maxLength: 2000 }),
  createdAt: fc.date(),
  readBy: fc.array(fc.uuid()),
});

// Generate whitespace strings
const whitespaceArbitrary = fc.stringOf(
  fc.constantFrom(' ', '\t', '\n', '\r')
);
```

## Implementation Notes

### Firebase Security Rules

Add Firestore security rules for conversations and messages:

```javascript
// Conversations collection
match /conversations/{conversationId} {
  allow read: if request.auth.uid in resource.data.participantIds;
  allow create: if request.auth.uid in request.resource.data.participantIds;
  allow update: if request.auth.uid in resource.data.participantIds;
  
  // Messages subcollection
  match /messages/{messageId} {
    allow read: if request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds;
    allow create: if request.auth.uid in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds
                  && request.auth.uid == request.resource.data.senderId;
  }
}
```

### Performance Considerations

**Pagination:**
- Implement cursor-based pagination for message retrieval (load 50 messages at a time)
- Use `startAfter` and `limit` queries for efficient loading

**Caching:**
- Cache conversation list in local state
- Cache recent messages per conversation
- Invalidate cache on new message arrival

**Real-Time Optimization:**
- Only subscribe to active conversation
- Unsubscribe when user navigates away
- Batch notification updates to reduce re-renders

### Migration Strategy

**Phase 1: Service Layer**
- Implement messaging service with all core functions
- Add property-based tests for service layer
- Add unit tests for edge cases

**Phase 2: UI Components**
- Create MessagesPage and ConversationView components
- Integrate real-time listeners
- Add navigation integration

**Phase 3: Notifications**
- Extend notification service for message notifications
- Add unread badge to navigation
- Test notification flow end-to-end

**Phase 4: Polish**
- Add loading states and error handling
- Optimize performance with pagination
- Add accessibility features (keyboard navigation, screen reader support)
