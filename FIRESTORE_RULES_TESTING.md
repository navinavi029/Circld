# Testing Firestore Security Rules

This guide explains how to test the Firestore security rules for the trade messaging feature.

## Quick Start

### Option 1: Manual Testing with Firebase Console

1. Deploy the rules to your Firebase project:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. Test in the Firebase Console:
   - Go to Firebase Console → Firestore Database → Rules
   - Use the Rules Playground to simulate requests
   - Test different user scenarios

### Option 2: Local Testing with Firebase Emulator

1. Install Firebase CLI (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not done):
   ```bash
   firebase init
   ```
   - Select "Firestore" and "Emulators"
   - Choose your Firebase project
   - Accept default firestore.rules location
   - Select Firestore emulator
   - Accept default ports

4. Start the emulator:
   ```bash
   firebase emulators:start --only firestore
   ```

5. Access the Emulator UI at http://localhost:4000

## Security Rules Overview

The implemented rules ensure:

### Conversations Collection (`/conversations/{conversationId}`)

✅ **Read Access**: Only participants can read conversations
- Rule: `request.auth.uid in resource.data.participantIds`

✅ **Create Access**: Only participants can create conversations
- Rule: `request.auth.uid in request.resource.data.participantIds`

✅ **Update Access**: Only participants can update conversations
- Rule: `request.auth.uid in resource.data.participantIds`

### Messages Subcollection (`/conversations/{conversationId}/messages/{messageId}`)

✅ **Read Access**: Only conversation participants can read messages
- Rule: Checks if user is in parent conversation's participantIds

✅ **Create Access**: Only participants can create messages with their own senderId
- Rule: User must be participant AND senderId must match auth.uid

✅ **Update Access**: Only participants can update messages
- Rule: User must be in parent conversation's participantIds

## Test Scenarios

### Scenario 1: Participant Access ✅

**Given:**
- User A (uid: `user-a`) is authenticated
- Conversation exists with `participantIds: ['user-a', 'user-b']`

**When:** User A reads the conversation

**Then:** ✅ Access granted

---

### Scenario 2: Non-Participant Blocked ❌

**Given:**
- User C (uid: `user-c`) is authenticated
- Conversation exists with `participantIds: ['user-a', 'user-b']`

**When:** User C tries to read the conversation

**Then:** ❌ Permission denied

---

### Scenario 3: Message Creation with Valid SenderId ✅

**Given:**
- User A (uid: `user-a`) is authenticated
- Conversation exists with `participantIds: ['user-a', 'user-b']`

**When:** User A creates a message with `senderId: 'user-a'`

**Then:** ✅ Message created successfully

---

### Scenario 4: Message Creation with Invalid SenderId ❌

**Given:**
- User A (uid: `user-a`) is authenticated
- Conversation exists with `participantIds: ['user-a', 'user-b']`

**When:** User A tries to create a message with `senderId: 'user-b'`

**Then:** ❌ Permission denied (cannot impersonate other users)

---

### Scenario 5: Non-Participant Cannot Send Messages ❌

**Given:**
- User C (uid: `user-c`) is authenticated
- Conversation exists with `participantIds: ['user-a', 'user-b']`

**When:** User C tries to create a message

**Then:** ❌ Permission denied (not a participant)

---

## Manual Testing Steps

### Using Firebase Emulator UI

1. Start the emulator:
   ```bash
   firebase emulators:start --only firestore
   ```

2. Open http://localhost:4000

3. Navigate to Firestore tab

4. Create test data:
   ```javascript
   // Create a conversation
   conversations/test-conv-1
   {
     "participantIds": ["user-a", "user-b"],
     "tradeOfferId": "trade-1",
     "tradeAnchorId": "item-1",
     "targetItemId": "item-2",
     "createdAt": "2024-01-01T00:00:00Z",
     "lastMessageAt": "2024-01-01T00:00:00Z",
     "lastMessageText": "",
     "unreadCount": {}
   }
   ```

5. Test rules in the Rules tab:
   - Simulate authenticated requests
   - Try different user IDs
   - Verify access control

### Using Your Application

1. Configure your app to use the emulator:
   ```typescript
   // In src/firebase.ts
   import { connectFirestoreEmulator } from 'firebase/firestore';
   
   if (import.meta.env.DEV) {
     connectFirestoreEmulator(db, 'localhost', 8080);
   }
   ```

2. Run your app:
   ```bash
   npm run dev
   ```

3. Test the messaging features:
   - Create a conversation
   - Send messages
   - Try accessing conversations you're not part of
   - Verify error messages

## Validation Checklist

Use this checklist to verify all security requirements:

- [ ] Only participants can read conversations (Requirement 6.1)
- [ ] Only participants can create conversations (Requirement 6.1)
- [ ] Only participants can update conversations (Requirement 6.1)
- [ ] Only participants can read messages (Requirement 6.2)
- [ ] Only participants can create messages (Requirement 6.2)
- [ ] Only sender can create messages with their senderId (Requirement 6.2)
- [ ] Non-participants are denied all access
- [ ] Unauthenticated users are denied all access
- [ ] Users cannot impersonate others when sending messages

## Troubleshooting

### Rules not updating in emulator
- Stop and restart the emulator
- Clear emulator data: `firebase emulators:start --only firestore --import=./emulator-data --export-on-exit`

### Permission denied errors in development
- Check that user is authenticated
- Verify user ID matches participantIds
- Check that senderId matches authenticated user ID

### Rules work in emulator but not in production
- Deploy rules: `firebase deploy --only firestore:rules`
- Check Firebase Console for rule deployment status
- Verify indexes are created

## Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Testing Security Rules](https://firebase.google.com/docs/rules/unit-tests)

## Requirements Validation

These security rules satisfy the following requirements from the trade-messaging specification:

- **Requirement 6.1**: Conversation Access Control
  - ✅ Verify user is a participant before granting access
  - ✅ Deny access to non-participants
  - ✅ Return authorization error for unauthorized access

- **Requirement 6.2**: Message Access Control
  - ✅ Only participants can read messages
  - ✅ Only participants can create messages
  - ✅ Only sender can create messages with their senderId
  - ✅ Prevent message sending for non-participants
