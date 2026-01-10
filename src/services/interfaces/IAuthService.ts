/**
 * TripNoute v2 - Authentication Service Interface
 * 
 * This interface defines the contract for authentication operations.
 * Implementations can be Firebase, Supabase, or any other auth provider.
 * This follows the Dependency Inversion Principle (SOLID).
 */

import { User as FirebaseUser } from 'firebase/auth';
import { User, LoginInput, RegisterInput } from '@/types';

export interface IAuthService {
  /**
   * Register a new user with email and password
   */
  register(input: RegisterInput): Promise<User>;

  /**
   * Login with email and password
   */
  login(input: LoginInput): Promise<User>;

  /**
   * Login with Google OAuth
   */
  loginWithGoogle(): Promise<User>;

  /**
   * Logout current user
   */
  logout(): Promise<void>;

  /**
   * Get current authenticated user
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * Send password reset email
   */
  sendPasswordResetEmail(email: string): Promise<void>;

  /**
   * Update user profile (display name, photo)
   */
  updateProfile(data: { displayName?: string; photoURL?: string }): Promise<void>;

  /**
   * Delete user account
   */
  deleteAccount(): Promise<void>;

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}

/**
 * Convert Firebase User to our User type
 */
export const mapFirebaseUserToUser = (firebaseUser: FirebaseUser): Partial<User> => {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
  };
};
