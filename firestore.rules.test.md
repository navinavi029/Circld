# Firestore Security Rules Testing Guide

This document provides test scenarios for validating the Firestore security rules for conversations and messages.

## Prerequisites

To test these rules, you need to set up the Firebase Emulator Suite:

```bash
npm install -g firebase-tools
firebase init emulators
```

Select Firestore emulator and configure it to use port 8080.

## Test Scenarios

### Conversations Collection

#### Test 1: Participant can read their conversation
**Setup:**
- User A (uid: user-a) is authenticated
- Conversation exists with participantIds: ['user-a', 'user-b']

**Action:**
```javascript
db.collection('conversations').doc('conv-1').get()
```

**Expected Result:** ✅ Success - User A can read the conversation

---

#### Test 2: Non-participant cannot read conversation
**Setup:**
- User C (uid: user-c) is authenticated
- Conversation exists with participantIds: ['user-a', 'user-b']

**Action:**
```javascript
db.collection('conversations').doc('conv-1').get()
```

**Expected Result:** ❌ Permission Denied - User C is not a participant

---

#### Test 3: Participant can create conversation
**Setup:**
- User A (uid: user-a) is authenticated

**Action:**
```javascript
db.collection('conversations').add({
  tradeOfferId: 'trade-1',
  participantIds: ['user-a', 'user-b'],
  tradeAnchorId: 'item-1',
  targetItemId: 'item-2',
  createdAt: new Date(),
  lastMessageAt: new Date(),
  lastMessageText: '',
  unreadCount: {}
})
```

**Expected Result:** ✅ Success - User A is in participantIds

---

#### Test 4: User cannot create conversation without being a participant
**Setup:**
- User C (uid: user-c) is authenticated

**Action:**
```javascript
db.collection('conversations').add({
  tradeOfferId: 'trade-1',
  participantIds: ['user-a', 'user-b'],
  // user-c is not in participantIds
  ...
})
```

**Expected Result:** ❌ Permission Denied - User C is not in participantIds

---

#### Test 5: Participant can update conversation
**Setup:**
- User A (uid: user-a) is authenticated
- Conversation exists with participantIds: ['user-a', 'user-b']

**Action:**
```javascript
db.collection('conversations').doc('conv-1').update({
  lastMessageAt: new Date(),
  lastMessageText: 'Hello',
  'unreadCount.user-b': 1
})
```

**Expected Result:** ✅ Success - User A is a participant

---

### Messages Subcollection

#### Test 6: Participant can read messages
**Setup:**
- User A (uid: user-a) is authenticated
- Conversation exists with participantIds: ['user-a', 'user-b']
- Message exists in conversation

**Action:**
```javascript
db.collection('conversations').doc('conv-1')
  .collection('messages').doc('msg-1').get()
```

**Expected Result:** ✅ Success - User A is a participant

---

#### Test 7: Non-participant cannot read messages
**Setup:**
- User C (uid: user-c) is authenticated
- Conversation exists with participantIds: ['user-a', 'user-b']

**Action:**
```javascript
db.collection('conversations').doc('conv-1')
  .collection('messages').doc('msg-1').get()
```

**Expected Result:** ❌ Permission Denied - User C is not a participant

---

#### Test 8: Participant can create message with their own senderId
**Setup:**
- User A (uid: user-a) is authenticated
- Conversation exists with participantIds: ['user-a', 'user-b']

**Action:**
```javascript
db.collection('conversations').doc('conv-1')
  .collection('messages').add({
    senderId: 'user-a',
    text: 'Hello!',
    createdAt: new Date(),
    readBy: []
  })
```

**Expected Result:** ✅ Success - User A is participant and senderId matches

---

#### Test 9: Participant cannot create message with different senderId
**Setup:**
- User A (uid: user-a) is authenticated
- Conversation exists with participantIds: ['user-a', 'user-b']

**Action:**
```javascript
db.collection('conversations').doc('conv-1')
  .collection('messages').add({
    senderId: 'user-b', // Wrong senderId!
    text: 'Fake message',
    createdAt: new Date(),
    readBy: []
  })
```

**Expected Result:** ❌ Permission Denied - senderId doesn't match auth.uid

---

#### Test 10: Non-participant cannot create message
**Setup:**
- User C (uid: user-c) is authenticated
- Conversation exists with participantIds: ['user-a', 'user-b']

**Action:**
```javascript
db.collection('conversations').doc('conv-1')
  .collection('messages').add({
    senderId: 'user-c',
    text: 'Unauthorized message',
    createdAt: new Date(),
    readBy: []
  })
```

**Expected Result:** ❌ Permission Denied - User C is not a participant

---

#### Test 11: Participant can update message (mark as read)
**Setup:**
- User B (uid: user-b) is authenticated
- Conversation exists with participantIds: ['user-a', 'user-b']
- Message exists

**Action:**
```javascript
db.collection('conversations').doc('conv-1')
  .collection('messages').doc('msg-1').update({
    readBy: ['user-a', 'user-b']
  })
```

**Expected Result:** ✅ Success - User B is a participant

---

#### Test 12: Unauthenticated user cannot access anything
**Setup:**
- No user authenticated

**Action:**
```javascript
db.collection('conversations').doc('conv-1').get()
```

**Expected Result:** ❌ Permission Denied - No authentication

---

## Running Tests with Firebase Emulator

### Setup firebase.json

Create a `firebase.json` file in the project root:

```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "emulators": {
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

### Start the Emulator

```bash
firebase emulators:start --only firestore
```

### Run Tests

You can use the Firebase Emulator UI at http://localhost:4000 to manually test the rules, or create automated tests using `@firebase/rules-unit-testing`.

### Example Automated Test

```javascript
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-project',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('participant can read conversation', async () => {
    const context = testEnv.authenticatedContext('user-a');
    const conversationRef = context.firestore()
      .collection('conversations').doc('conv-1');
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore()
        .collection('conversations').doc('conv-1').set({
          participantIds: ['user-a', 'user-b'],
          tradeOfferId: 'trade-1',
        });
    });

    await assertSucceeds(conversationRef.get());
  });

  test('non-participant cannot read conversation', async () => {
    const context = testEnv.authenticatedContext('user-c');
    const conversationRef = context.firestore()
      .collection('conversations').doc('conv-1');

    await assertFails(conversationRef.get());
  });
});
```

## Validation Checklist

- ✅ Only participants can read conversations (Requirements 6.1)
- ✅ Only participants can write to conversations (Requirements 6.1)
- ✅ Only participants can read messages (Requirements 6.2)
- ✅ Only sender can create messages with their senderId (Requirements 6.2)
- ✅ Non-participants are denied access to conversations
- ✅ Non-participants are denied access to messages
- ✅ Users cannot impersonate others when sending messages
- ✅ Unauthenticated users are denied all access

## Security Properties Validated

The implemented rules validate the following security properties:

1. **Participant-only access**: Only users in `participantIds` can access conversations
2. **Message sender authentication**: Messages can only be created with the authenticated user's ID as senderId
3. **Read access control**: Message reading requires being a conversation participant
4. **Write access control**: Message creation requires both participation and sender ID match
5. **Update access control**: Only participants can update conversations and messages

These rules satisfy Requirements 6.1 and 6.2 from the trade-messaging specification.
