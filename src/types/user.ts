import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  eligible_to_match: boolean;
  createdAt: Timestamp;
  photoUrl: string | null;
  lastPhotoUpdate: Timestamp | null;
  lastLocationUpdate: Timestamp | null;
}

export interface CreateUserProfile {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  location: string;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  eligible_to_match: boolean;
  createdAt: ReturnType<typeof import('firebase/firestore').serverTimestamp>;
  photoUrl: string | null;
  lastPhotoUpdate: ReturnType<typeof import('firebase/firestore').serverTimestamp> | null;
  lastLocationUpdate: ReturnType<typeof import('firebase/firestore').serverTimestamp> | null;
}
