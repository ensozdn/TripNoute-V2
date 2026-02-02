import { Timestamp } from 'firebase/firestore';

export type FirebaseTimestamp = Timestamp | Date;

export interface FirebaseError extends Error {
  code: string;
  message: string;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: boolean;
  mapStyle?: 'streets' | 'satellite' | 'dark';
  [key: string]: unknown;
}

export interface UserDocument {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  preferences?: UserPreferences;
}

export function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as FirebaseError).code === 'string'
  );
}

export function isFirebaseTimestamp(value: unknown): value is Timestamp {
  return value instanceof Timestamp || (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    'nanoseconds' in value
  );
}
