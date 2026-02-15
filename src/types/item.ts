import { Timestamp } from 'firebase/firestore';

export interface StatusChange {
  status: 'available' | 'pending' | 'unavailable';
  timestamp: Timestamp;
}

export interface ItemMetadata {
  viewCount: number;
  favoriteCount: number;
  lastViewed: Timestamp | null;
  statusHistory: StatusChange[];
}

export interface UserFavorite {
  id: string;
  userId: string;
  itemId: string;
  createdAt: Timestamp;
}

export interface ItemView {
  id: string;
  itemId: string;
  userId: string | null; // null for anonymous users
  viewedAt: Timestamp;
}

export interface Item {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  images: string[];
  status: 'available' | 'pending' | 'unavailable';
  createdAt: Timestamp;
  viewCount?: number;
  favoriteCount?: number;
  swipeInterestCount?: number;
  statusHistory?: StatusChange[];
  updatedAt?: Timestamp;
}

export interface EnhancedItem extends Item {
  viewCount: number;
  favoriteCount: number;
  swipeInterestCount: number;
  isFavorited: boolean; // for current user
  distance: number | null; // in kilometers
  ownerInfo?: {
    name: string;
    photoUrl: string | null;
    activeListingsCount: number;
    memberSince: Timestamp;
  };
}
