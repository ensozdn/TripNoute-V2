/**
 * TripNoute v2 - Place Model Types
 * Detailed place-related type definitions
 */

import { Timestamp, Location, Address, Photo } from '../index';

export interface Place {
  id: string;
  userId: string;
  title: string;
  description: string;
  location: Location;
  address: Address;
  visitDate: Timestamp;
  photos: Photo[];
  category?: PlaceCategory;
  rating?: number; // 1-5
  isPublic: boolean;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PlaceCategory =
  | 'restaurant'
  | 'hotel'
  | 'attraction'
  | 'museum'
  | 'park'
  | 'beach'
  | 'mountain'
  | 'city'
  | 'landmark'
  | 'other';

export interface CreatePlaceInput {
  title: string;
  description: string;
  location: Location;
  address?: Address;
  visitDate: Date;
  photos?: File[];
  category?: PlaceCategory;
  rating?: number;
  isPublic: boolean;
  tags?: string[];
}

export interface UpdatePlaceInput extends Partial<CreatePlaceInput> {
  id: string;
}

export interface PlaceFilters {
  userId?: string;
  category?: PlaceCategory;
  startDate?: Date;
  endDate?: Date;
  country?: string;
  city?: string;
  isPublic?: boolean;
  tags?: string[];
}

export type PlaceSortField = 'visitDate' | 'createdAt' | 'title' | 'rating';
export type SortOrder = 'asc' | 'desc';

export interface PlaceSortOptions {
  field: PlaceSortField;
  order: SortOrder;
}
