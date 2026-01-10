/**
 * TripNoute v2 - Firebase Authentication Service Implementation
 * 
 * This service implements the IAuthService interface using Firebase Auth.
 * Provider-specific logic is encapsulated here.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  deleteUser,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { IAuthService } from '@/services/interfaces/IAuthService';
import { User, LoginInput, RegisterInput } from '@/types';
import type { Timestamp } from '@/types';

export class FirebaseAuthService implements IAuthService {
  private googleProvider: GoogleAuthProvider;

  constructor() {
    this.googleProvider = new GoogleAuthProvider();
  }

  /**
   * Register a new user with email and password
   */
  async register(input: RegisterInput): Promise<User> {
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        input.email,
        input.password
      );

      const firebaseUser = userCredential.user;

      // Update profile with display name
      await firebaseUpdateProfile(firebaseUser, {
        displayName: input.displayName,
      });

      // Create user document in Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const now = serverTimestamp();

      const userData: Omit<User, 'createdAt' | 'updatedAt'> & {
        createdAt: any;
        updatedAt: any;
      } = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: input.displayName,
        photoURL: null,
        createdAt: now,
        updatedAt: now,
        stats: {
          totalPlaces: 0,
          totalPhotos: 0,
          countriesVisited: 0,
          citiesVisited: 0,
          firstTripDate: null,
          lastTripDate: null,
        },
        preferences: {
          theme: 'system',
          defaultMapView: 'roadmap',
          distanceUnit: 'km',
          dateFormat: 'DD/MM/YYYY',
          isPublicProfile: false,
          allowNotifications: true,
        },
      };

      await setDoc(userDocRef, userData);

      return userData;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Login with email and password
   */
  async login(input: LoginInput): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        input.email,
        input.password
      );

      const user = await this.getUserData(userCredential.user.uid);
      if (!user) {
        throw new Error('User data not found');
      }

      return user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      const firebaseUser = result.user;

      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // First time Google login - create user document
        const now = serverTimestamp();

        const userData: Omit<User, 'createdAt' | 'updatedAt'> & {
          createdAt: any;
          updatedAt: any;
        } = {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: now,
          updatedAt: now,
          stats: {
            totalPlaces: 0,
            totalPhotos: 0,
            countriesVisited: 0,
            citiesVisited: 0,
            firstTripDate: null,
            lastTripDate: null,
          },
          preferences: {
            theme: 'system',
            defaultMapView: 'roadmap',
            distanceUnit: 'km',
            dateFormat: 'DD/MM/YYYY',
            isPublicProfile: false,
            allowNotifications: true,
          },
        };

        await setDoc(userDocRef, userData);
        return userData;
      }

      return userDoc.data() as User;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return null;
    }

    return this.getUserData(firebaseUser.uid);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Update user profile (display name, photo)
   */
  async updateProfile(data: {
    displayName?: string;
    photoURL?: string;
  }): Promise<void> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('No authenticated user');
      }

      // Update Firebase Auth profile
      await firebaseUpdateProfile(firebaseUser, data);

      // Update Firestore document
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(
        userDocRef,
        {
          ...data,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(): Promise<void> {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) {
        throw new Error('No authenticated user');
      }

      // Delete user document from Firestore
      // Note: Places and photos should be deleted separately (cascade delete)
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userDocRef, { deleted: true, deletedAt: serverTimestamp() });

      // Delete Firebase Auth user
      await deleteUser(firebaseUser);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.getUserData(firebaseUser.uid);
        callback(user);
      } else {
        callback(null);
      }
    });
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Get user data from Firestore
   */
  private async getUserData(uid: string): Promise<User | null> {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        return null;
      }

      return userDoc.data() as User;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  /**
   * Handle Firebase Auth errors and convert to user-friendly messages
   */
  private handleAuthError(error: any): Error {
    let message = 'An error occurred during authentication';

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/operation-not-allowed':
        message = 'Operation not allowed';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign-in popup was closed';
        break;
      default:
        message = error.message || message;
    }

    return new Error(message);
  }
}

// Export singleton instance
export const authService = new FirebaseAuthService();
