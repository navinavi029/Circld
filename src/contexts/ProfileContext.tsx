import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { UserProfile } from '../types/user';

interface ProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  hasProfile: boolean;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        setProfile(null);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    // Set up real-time listener for profile updates
    setLoading(true);
    const docRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          console.log('Profile data loaded:', profileData);
          console.log('firstName:', profileData.firstName, 'trimmed:', profileData.firstName?.trim());
          console.log('lastName:', profileData.lastName, 'trimmed:', profileData.lastName?.trim());
          console.log('location:', profileData.location, 'trimmed:', profileData.location?.trim());
          setProfile(profileData);
        } else {
          console.log('Profile document does not exist');
          setProfile(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Profile fetch error:', err);
        setError(err.message || 'Failed to fetch profile');
        setProfile(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Check if profile has all required fields with actual content
  const hasProfileValue = useMemo(() => {
    const result = Boolean(
      profile && 
      profile.firstName && 
      profile.firstName.trim().length > 0 && 
      profile.lastName && 
      profile.lastName.trim().length > 0 && 
      profile.location && 
      profile.location.trim().length > 0
    );

    console.log('hasProfile calculated:', result, {
      profileExists: !!profile,
      firstName: profile?.firstName,
      firstNameValid: profile?.firstName && profile.firstName.trim().length > 0,
      lastName: profile?.lastName,
      lastNameValid: profile?.lastName && profile.lastName.trim().length > 0,
      location: profile?.location,
      locationValid: profile?.location && profile.location.trim().length > 0
    });

    return result;
  }, [profile]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        hasProfile: hasProfileValue,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
}
