import { Timestamp } from 'firebase/firestore';
import { Item } from '../types/item';
import { UserProfile } from '../types/user';
import { TradeOffer, Conversation, Message, Notification, TradeOfferNotificationData } from '../types/swipe-trading';

/**
 * Demo Data Module
 * 
 * Provides realistic mock data for the enhanced demo presentation.
 * All data represents a complete trade flow scenario between two users.
 * Uses real images from Unsplash for a professional demo experience.
 */

// Mock User Profiles
export const DEMO_USERS: UserProfile[] = [
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
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
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
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    lastPhotoUpdate: Timestamp.now(),
    lastLocationUpdate: Timestamp.now()
  }
];

// Mock Items
export const DEMO_ITEMS: Item[] = [
  {
    id: 'demo-item-1',
    ownerId: 'demo-user-1',
    title: 'Vintage Polaroid Camera',
    description: 'Classic instant camera in excellent working condition. Includes original case and manual. Perfect for photography enthusiasts!',
    category: 'electronics',
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800&h=600&fit=crop'
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
      'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=800&h=600&fit=crop'
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
      'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1619983081563-430f63602796?w=800&h=600&fit=crop'
    ],
    status: 'available',
    createdAt: Timestamp.now(),
    viewCount: 34,
    favoriteCount: 9,
    swipeInterestCount: 6
  },
  {
    id: 'demo-item-4',
    ownerId: 'demo-user-2',
    title: 'Mountain Bike',
    description: 'High-quality mountain bike with 21-speed gears. Great for trails and city riding. Recently serviced.',
    category: 'sports',
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=800&h=600&fit=crop'
    ],
    status: 'available',
    createdAt: Timestamp.now(),
    viewCount: 52,
    favoriteCount: 18,
    swipeInterestCount: 11
  },
  {
    id: 'demo-item-5',
    ownerId: 'demo-user-1',
    title: 'Leather Messenger Bag',
    description: 'Genuine leather messenger bag with laptop compartment. Perfect for work or travel. Minimal signs of use.',
    category: 'fashion',
    condition: 'like-new',
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=600&fit=crop'
    ],
    status: 'available',
    createdAt: Timestamp.now(),
    viewCount: 41,
    favoriteCount: 14,
    swipeInterestCount: 9
  },
  {
    id: 'demo-item-6',
    ownerId: 'demo-user-2',
    title: 'Espresso Machine',
    description: 'Professional-grade espresso machine. Makes perfect coffee every time. Includes milk frother and cleaning kit.',
    category: 'home',
    condition: 'good',
    images: [
      'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'
    ],
    status: 'available',
    createdAt: Timestamp.now(),
    viewCount: 78,
    favoriteCount: 29,
    swipeInterestCount: 19
  }
];

// Mock Trade Offer
export const DEMO_TRADE_OFFERS: TradeOffer[] = [
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

// Mock Conversations
export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'demo-conversation-1',
    tradeOfferId: 'demo-offer-1',
    participantIds: ['demo-user-1', 'demo-user-2'],
    tradeAnchorId: 'demo-item-3',
    targetItemId: 'demo-item-2',
    createdAt: Timestamp.now(),
    lastMessageAt: Timestamp.now(),
    lastMessageText: 'Sounds great! See you then.',
    unreadCount: {
      'demo-user-1': 0,
      'demo-user-2': 0
    },
    status: 'active'
  }
];

// Mock Messages
export const DEMO_MESSAGES: Message[] = [
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
    text: 'Sounds great! See you then.',
    createdAt: Timestamp.now(),
    readBy: ['demo-user-1', 'demo-user-2']
  }
];

// Alternative messages for revisit
export const DEMO_MESSAGES_ALT: Message[] = [
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
    id: 'demo-msg-5',
    conversationId: 'demo-conversation-1',
    senderId: 'demo-user-1',
    text: 'Sure! I\'m free on Sunday morning. Would 10 AM work for you?',
    createdAt: Timestamp.now(),
    readBy: ['demo-user-1', 'demo-user-2']
  },
  {
    id: 'demo-msg-6',
    conversationId: 'demo-conversation-1',
    senderId: 'demo-user-2',
    text: 'Perfect timing! Let\'s meet at Central Park near the fountain.',
    createdAt: Timestamp.now(),
    readBy: ['demo-user-1', 'demo-user-2']
  }
];

// Mock Notifications
export const DEMO_NOTIFICATIONS: Notification[] = [
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
      tradeAnchorImage: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=800&h=600&fit=crop',
      targetItemId: 'demo-item-2',
      targetItemTitle: 'Acoustic Guitar',
      targetItemImage: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=600&fit=crop'
    } as TradeOfferNotificationData
  }
];

/**
 * Complete demo data export
 */
export const DEMO_DATA = {
  users: DEMO_USERS,
  items: DEMO_ITEMS,
  tradeOffers: DEMO_TRADE_OFFERS,
  conversations: DEMO_CONVERSATIONS,
  messages: DEMO_MESSAGES,
  messagesAlt: DEMO_MESSAGES_ALT,
  notifications: DEMO_NOTIFICATIONS
};
