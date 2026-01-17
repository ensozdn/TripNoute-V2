/**
 * TripNoute v2 - Database Service Interface
 * 
 * This interface defines the contract for database operations.
 * Provider-independent: Can be Firestore, PostgreSQL, MongoDB, etc.
 */

import {
  Place,
  CreatePlaceInput,
  UpdatePlaceInput,
  PlaceFilters,
  PlaceSortOptions,
  PaginatedResponse,
  PaginationParams,
} from '@/types';
import { Photo } from '@/types/models/Photo';

export interface IDatabaseService {
  // ============================================
  // PLACE OPERATIONS
  // ============================================

  /**
   * Create a new place
   */
  createPlace(input: CreatePlaceInput, userId: string): Promise<Place>;

  /**
   * Get a single place by ID
   */
  getPlaceById(placeId: string): Promise<Place | null>;

  /**
   * Update a place
   */
  updatePlace(input: UpdatePlaceInput): Promise<Place>;

  /**
   * Delete a place
   */
  deletePlace(placeId: string): Promise<void>;

  /**
   * Get places with filters, sorting, and pagination
   */
  getPlaces(
    filters?: PlaceFilters,
    sort?: PlaceSortOptions,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Place>>;

  /**
   * Get all places for a specific user
   */
  getUserPlaces(
    userId: string,
    sort?: PlaceSortOptions,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Place>>;

  /**
   * Get places within a geographic boundary
   */
  getPlacesInBounds(
    north: number,
    south: number,
    east: number,
    west: number,
    filters?: PlaceFilters
  ): Promise<Place[]>;

  // ============================================
  // USER OPERATIONS
  // ============================================

  /**
   * Create a new user document
   */
  createUser(userId: string, email: string, displayName: string | null): Promise<void>;

  /**
   * Get user by ID
   */
  getUserById(userId: string): Promise<import('@/types/firebase').UserDocument | null>;

  /**
   * Update user preferences
   */
  updateUserPreferences(userId: string, preferences: import('@/types/firebase').UserPreferences): Promise<void>;

  /**
   * Update user stats (called after place creation/deletion)
   */
  updateUserStats(userId: string): Promise<void>;

  // ============================================
  // PHOTO OPERATIONS
  // ============================================

  /**
   * Add a photo to a place
   */
  addPhotoToPlace(placeId: string, photo: Photo): Promise<Photo>;

  /**
   * Delete a photo from a place
   */
  deletePhotoFromPlace(placeId: string, photoId: string): Promise<void>;

  /**
   * Update photo description
   */
  updatePhotoDescription(placeId: string, photoId: string, description: string): Promise<void>;

  /**
   * Get all photos for a place
   */
  getPlacePhotos(placeId: string): Promise<Photo[]>;

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Delete multiple places at once
   */
  deletePlaces(placeIds: string[]): Promise<void>;
}
