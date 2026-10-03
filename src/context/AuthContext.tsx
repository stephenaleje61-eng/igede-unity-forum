import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { UserProfile } from '../types';
import { getInitialsAvatar } from '../utils/imageHelper';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, location?: string, photoURL?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateMyProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        
        // Listen to profile updates in real-time
        const unsubscribeProfile = onSnapshot(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            setUserProfile(snapshot.data() as UserProfile);
          } else {
            // First time login auto-provision profile if document missing
            const initialProfile: UserProfile = {
              id: user.uid,
              fullName: user.displayName || user.email?.split('@')[0] || 'Igede Member',
              email: user.email || '',
              photoURL: user.photoURL || getInitialsAvatar(user.displayName || 'Igede'),
              bio: 'Proud son/daughter of Igede land. United for cultural progress.',
              location: 'Oju, Benue State',
              spaceAffiliation: 'General Igede',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            try {
              await setDoc(userRef, initialProfile);
              setUserProfile(initialProfile);
            } catch (err) {
              console.warn('Could not auto-create profile doc:', err);
              // Fallback local representation so user is never blocked
              setUserProfile(initialProfile);
            }
          }
          setLoading(false);
        }, (error) => {
          console.error('Error fetching user profile snapshot:', error);
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, location = 'Oju, Benue', photoURL?: string) => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCred.user;
      const finalPhoto = photoURL || getInitialsAvatar(fullName);

      await updateProfile(user, {
        displayName: fullName.trim(),
        photoURL: finalPhoto
      });

      const profileData: UserProfile = {
        id: user.uid,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        photoURL: finalPhoto,
        bio: 'Proud son/daughter of Igede land. Promoting unity and communal strength.',
        location,
        spaceAffiliation: location.toLowerCase().includes('obi') ? 'Obi' : 'Oju',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const userPath = `users/${user.uid}`;
      try {
        await setDoc(doc(db, 'users', user.uid), profileData);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, userPath);
      }
      setUserProfile(profileData);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const userCred = await signInWithPopup(auth, provider);
      const user = userCred.user;

      // Ensure profile exists in users collection
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const profileData: UserProfile = {
          id: user.uid,
          fullName: user.displayName || user.email?.split('@')[0] || 'Igede Member',
          email: user.email || '',
          photoURL: user.photoURL || getInitialsAvatar(user.displayName || 'Igede'),
          bio: 'Proud son/daughter of Igede land. United for cultural progress.',
          location: 'Oju, Benue State',
          spaceAffiliation: 'General Igede',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await setDoc(userRef, profileData);
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  const updateMyProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) throw new Error('Must be logged in to update profile');
    const path = `users/${currentUser.uid}`;
    try {
      const updatedData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(doc(db, 'users', currentUser.uid), updatedData);
      
      // Update Firebase Auth user if name or photo changed
      if (updates.fullName || updates.photoURL) {
        await updateProfile(currentUser, {
          displayName: updates.fullName || currentUser.displayName,
          photoURL: updates.photoURL || currentUser.photoURL,
        });
      }

      setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        updateMyProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
