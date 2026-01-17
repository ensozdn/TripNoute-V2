/**
 * Firebase-specific type definitions
 * Ensures type safety for Firebase Timestamp and other Firebase types
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Firebase Timestamp or JavaScript Date
 * Used for fields that can be either type during conversion
 */
export type FirebaseTimestamp = Timestamp | Date;

/**
 * Firebase Error with code property
 */
export interface FirebaseError extends Error {
  code: string;
  message: string;
}

/**
 * User preferences stored in Firestore
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: boolean;
  mapStyle?: 'streets' | 'satellite' | 'dark';
  [key: string]: unknown;
}

/**
 * User document structure in Firestore
 */
export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  preferences?: UserPreferences;
}

/**
 * Type guard to check if error is FirebaseError
 */
export function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as FirebaseError).code === 'string'
  );
}

/**
 * Type guard to check if value is Firebase Timestamp
 */
export function isFirebaseTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp || (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    'nanoseconds' in value
  );
}
