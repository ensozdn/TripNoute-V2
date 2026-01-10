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
  getUserById(userId: string): Promise<any>;

  /**
   * Update user preferences
   */
  updateUserPreferences(userId: string, preferences: any): Promise<void>;

  /**
   * Update user stats (called after place creation/deletion)
   */
  updateUserStats(userId: string): Promise<void>;

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Delete multiple places at once
   */
  deletePlaces(placeIds: string[]): Promise<void>;
}
