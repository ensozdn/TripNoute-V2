/**
 * TripNoute v2 - User Model Types
 * Detailed user-related type definitions
 */

import { Timestamp } from '../index';

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  stats: UserStats;
  preferences: UserPreferences;
}

export interface UserStats {
  totalPlaces: number;
  totalPhotos: number;
  countriesVisited: number;
  citiesVisited: number;
  firstTripDate: Timestamp | null;
  lastTripDate: Timestamp | null;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultMapView: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  distanceUnit: 'km' | 'miles';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  isPublicProfile: boolean;
  allowNotifications: boolean;
}

export interface PublicUserProfile {
  uid: string;
  displayName: string | null;
  photoURL: string | null;
  stats: Omit<UserStats, 'firstTripDate' | 'lastTripDate'>;
}
