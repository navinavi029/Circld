# Requirements Document

## Introduction

The Swipe Trading feature enables users to discover and initiate trades through a Tinder-style swipe interface. Users select one of their own listings as the "trade anchor," then swipe through other users' available items to find potential trade matches. When a user swipes right (interested), the owner of that item receives a notification about the trade offer, enabling them to start a conversation about the potential trade.

This feature transforms the traditional marketplace browsing experience into an engaging, mobile-first interaction pattern that makes discovering trade opportunities intuitive and fun.

## Glossary

- **Swipe_Interface**: The UI component that displays items one at a time and responds to swipe gestures
- **Trade_Anchor**: The user's own listing that they have selected as the item they want to trade away
- **Trade_Offer**: A notification sent to another user indicating interest in trading items
- **Swipe_Session**: A continuous period where a user is swiping through potential trade matches
- **Trade_Match**: An item from another user that is shown as a potential trade partner
- **Swipe_Direction**: Either left (not interested) or right (interested)
- **Notification_System**: The system component responsible for delivering trade offer notifications
- **Item_Pool**: The collection of available items from other users that can be shown as potential matches

## Requirements

### Requirement 1: Trade Anchor Selection

**User Story:** As a user, I want to select one of my own available listings as a trade anchor, so that I can find items to trade it for.

#### Acceptance Criteria

1. WHEN a user initiates swipe trading, THE Swipe_Interface SHALL display only the user's own listings with status "available"
2. WHEN a user selects a listing, THE System SHALL set it as the Trade_Anchor for the current Swipe_Session
3. WHEN a Trade_Anchor is selected, THE System SHALL transition to the swipe discovery interface
4. IF a user has no available listings, THEN THE System SHALL display a message prompting them to create a listing first
5. THE System SHALL allow users to change their Trade_Anchor at any time during a Swipe_Session

### Requirement 2: Item Discovery Interface

**User Story:** As a user, I want to see other users' items one at a time in a swipe interface, so that I can focus on each potential trade match individually.

#### Acceptance Criteria

1. WHEN the swipe interface loads, THE Swipe_Interface SHALL display one item at a time from the Item_Pool
2. THE Swipe_Interface SHALL display the item's title, description, category, condition, images, and owner information
3. WHEN displaying an item, THE System SHALL exclude items owned by the current user
4. WHEN displaying an item, THE System SHALL exclude items with status other than "available"
5. THE Swipe_Interface SHALL show the current Trade_Anchor information in a fixed position for reference
6. WHEN the Item_Pool is exhausted, THE System SHALL display a message indicating no more items are available

### Requirement 3: Swipe Gesture Recognition

**User Story:** As a user, I want to swipe left or right on items, so that I can quickly indicate my interest or disinterest in potential trades.

#### Acceptance Criteria

1. WHEN a user swipes right on an item, THE System SHALL interpret this as "interested"
2. WHEN a user swipes left on an item, THE System SHALL interpret this as "not interested"
3. WHEN a swipe gesture is completed, THE Swipe_Interface SHALL animate the card off-screen in the Swipe_Direction
4. WHEN a swipe gesture is completed, THE Swipe_Interface SHALL display the next item from the Item_Pool
5. THE Swipe_Interface SHALL provide visual feedback during the swipe gesture showing the intended direction
6. THE System SHALL support both touch gestures on mobile and mouse drag on desktop
7. THE Swipe_Interface SHALL provide button alternatives for swipe gestures for accessibility

### Requirement 4: Trade Offer Creation

**User Story:** As a user, I want my right swipes to notify the other user, so that they know I'm interested in trading with them.

#### Acceptance Criteria

1. WHEN a user swipes right on an item, THE System SHALL create a Trade_Offer record
2. THE Trade_Offer SHALL include the Trade_Anchor item ID, the target item ID, the offering user ID, and a timestamp
3. WHEN a Trade_Offer is created, THE Notification_System SHALL send a notification to the target item's owner
4. THE notification SHALL include the Trade_Anchor item title, the offering user's name, and the target item title
5. THE System SHALL prevent duplicate Trade_Offers for the same Trade_Anchor and target item combination
6. WHEN a Trade_Offer already exists, THE System SHALL update the timestamp instead of creating a duplicate

### Requirement 5: Trade Offer Notifications

**User Story:** As a user, I want to receive notifications when someone is interested in trading with me, so that I can respond to trade opportunities.

#### Acceptance Criteria

1. WHEN a Trade_Offer is created for a user's item, THE Notification_System SHALL create a notification record
2. THE notification SHALL include the offering user's information, both item details, and a timestamp
3. WHEN a user views their notifications, THE System SHALL display all pending Trade_Offers
4. THE System SHALL mark notifications as read when the user views them
5. THE notification SHALL include a link or action to view the offering user's Trade_Anchor item details
6. THE notification SHALL include a link or action to start a conversation with the offering user

### Requirement 6: Swipe History Tracking

**User Story:** As a user, I want the system to remember which items I've already swiped on, so that I don't see the same items repeatedly in the same session.

#### Acceptance Criteria

1. WHEN a user swipes on an item, THE System SHALL record the swipe action with the item ID, Swipe_Direction, and timestamp
2. WHEN building the Item_Pool, THE System SHALL exclude items the user has already swiped on in the current Swipe_Session
3. THE System SHALL persist swipe history across page refreshes within the same Swipe_Session
4. WHEN a user changes their Trade_Anchor, THE System SHALL start a new Swipe_Session with fresh swipe history
5. THE System SHALL allow users to reset their swipe history to see items again

### Requirement 7: Item Pool Management

**User Story:** As a system, I want to efficiently manage which items are shown to users, so that the swipe experience is relevant and performant.

#### Acceptance Criteria

1. WHEN building the Item_Pool, THE System SHALL include only items with status "available"
2. WHEN building the Item_Pool, THE System SHALL exclude items owned by the current user
3. WHEN building the Item_Pool, THE System SHALL exclude items already swiped on in the current Swipe_Session
4. THE System SHALL order items in the Item_Pool by creation date with newest items first
5. THE System SHALL load items in batches to optimize performance
6. WHEN the user is near the end of the current batch, THE System SHALL preload the next batch

### Requirement 8: Conversation Initiation

**User Story:** As a user who receives a trade offer, I want to easily start a conversation with the offering user, so that we can discuss the trade details.

#### Acceptance Criteria

1. WHEN a user views a Trade_Offer notification, THE System SHALL provide an action to start a conversation
2. WHEN the conversation action is triggered, THE System SHALL create or navigate to a conversation thread between the two users
3. THE conversation SHALL include context about both items involved in the potential trade
4. THE System SHALL pre-populate the conversation with a message template referencing both items
5. WHEN a conversation is started from a Trade_Offer, THE System SHALL mark the notification as read

### Requirement 9: Trade Anchor Display

**User Story:** As a user swiping through items, I want to always see which of my items I'm trading, so that I can make informed decisions about potential trades.

#### Acceptance Criteria

1. WHILE swiping through items, THE Swipe_Interface SHALL display the Trade_Anchor in a fixed position
2. THE Trade_Anchor display SHALL show the item's primary image and title
3. THE Trade_Anchor display SHALL be visually distinct from the swipeable item cards
4. THE Swipe_Interface SHALL provide an action to change the Trade_Anchor without leaving the swipe interface
5. WHEN the Trade_Anchor is changed, THE System SHALL update the display immediately

### Requirement 10: Swipe Analytics

**User Story:** As a user, I want to see how many people have shown interest in my items through swipe trading, so that I can gauge demand.

#### Acceptance Criteria

1. WHEN a Trade_Offer is created for an item, THE System SHALL increment a swipe interest counter for that item
2. WHEN a user views their own listings, THE System SHALL display the swipe interest count
3. THE swipe interest count SHALL be separate from the general favorite count
4. THE System SHALL track the total number of right swipes received per item
5. THE System SHALL allow users to view which items have received trade offers
