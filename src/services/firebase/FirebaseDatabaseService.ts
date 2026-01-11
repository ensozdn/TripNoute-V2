/**
 * TripNoute v2 - Firebase Database Service Implementation
 * 
 * This service implements the IDatabaseService interface using Firestore.
 * Provider-specific logic is encapsulated here.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp as FirestoreTimestamp,
  DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { IDatabaseService } from '@/services/interfaces/IDatabaseService';
import {
  Place,
  CreatePlaceInput,
  UpdatePlaceInput,
  PlaceFilters,
  PlaceSortOptions,
  PaginatedResponse,
  PaginationParams,
} from '@/types';

export class FirebaseDatabaseService implements IDatabaseService {
  // ============================================
  // PLACE OPERATIONS
  // ============================================

  /**
   * Create a new place
   */
  async createPlace(input: CreatePlaceInput, userId: string): Promise<Place> {
    try {
      const placesRef = collection(db, 'places');
      const newPlaceRef = doc(placesRef);

      const placeData: any = {
        userId,
        title: input.title,
        description: input.description,
        location: input.location,
        address: input.address || {
          formatted: '',
        },
        visitDate: FirestoreTimestamp.fromDate(input.visitDate),
        photos: [],
        isPublic: input.isPublic,
        tags: input.tags || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Only add optional fields if they are defined
      if (input.category !== undefined) {
        placeData.category = input.category;
      }
      if (input.rating !== undefined) {
        placeData.rating = input.rating;
      }

      await setDoc(newPlaceRef, placeData);

      const createdPlace = await this.getPlaceById(newPlaceRef.id);
      if (!createdPlace) {
        throw new Error('Failed to create place');
      }

      // Update user stats
      await this.updateUserStats(userId);

      return createdPlace;
    } catch (error: any) {
      throw new Error(`Failed to create place: ${error.message}`);
    }
  }

  /**
   * Get a single place by ID
   */
  async getPlaceById(placeId: string): Promise<Place | null> {
    try {
      const placeRef = doc(db, 'places', placeId);
      const placeDoc = await getDoc(placeRef);

      if (!placeDoc.exists()) {
        return null;
      }

      return {
        id: placeDoc.id,
        ...placeDoc.data(),
      } as Place;
    } catch (error: any) {
      throw new Error(`Failed to get place: ${error.message}`);
    }
  }

  /**
   * Update a place
   */
  async updatePlace(input: UpdatePlaceInput): Promise<Place> {
    try {
      const placeRef = doc(db, 'places', input.id);

      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      // Only add defined fields
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.location !== undefined) updateData.location = input.location;
      if (input.address !== undefined) updateData.address = input.address;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.rating !== undefined) updateData.rating = input.rating;
      if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;
      if (input.tags !== undefined) updateData.tags = input.tags;

      // Convert visitDate if provided
      if (input.visitDate) {
        updateData.visitDate = FirestoreTimestamp.fromDate(input.visitDate);
      }

      await updateDoc(placeRef, updateData);

      const updatedPlace = await this.getPlaceById(input.id);
      if (!updatedPlace) {
        throw new Error('Place not found after update');
      }

      return updatedPlace;
    } catch (error: any) {
      throw new Error(`Failed to update place: ${error.message}`);
    }
  }

  /**
   * Delete a place
   */
  async deletePlace(placeId: string): Promise<void> {
    try {
      const placeRef = doc(db, 'places', placeId);
      const placeDoc = await getDoc(placeRef);

      if (!placeDoc.exists()) {
        throw new Error('Place not found');
      }

      const placeData = placeDoc.data() as Place;
      await deleteDoc(placeRef);

      // Update user stats
      await this.updateUserStats(placeData.userId);
    } catch (error: any) {
      throw new Error(`Failed to delete place: ${error.message}`);
    }
  }

  /**
   * Get places with filters, sorting, and pagination
   */
  async getPlaces(
    filters?: PlaceFilters,
    sort?: PlaceSortOptions,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Place>> {
    try {
      const placesRef = collection(db, 'places');
      let q = query(placesRef);

      // Apply filters
      if (filters) {
        if (filters.userId) {
          q = query(q, where('userId', '==', filters.userId));
        }
        if (filters.category) {
          q = query(q, where('category', '==', filters.category));
        }
        if (filters.isPublic !== undefined) {
          q = query(q, where('isPublic', '==', filters.isPublic));
        }
        if (filters.country) {
          q = query(q, where('address.country', '==', filters.country));
        }
        if (filters.city) {
          q = query(q, where('address.city', '==', filters.city));
        }
        if (filters.tags && filters.tags.length > 0) {
          q = query(q, where('tags', 'array-contains-any', filters.tags));
        }
      }

      // Apply sorting
      const sortField = sort?.field || 'createdAt';
      const sortOrder = sort?.order || 'desc';
      q = query(q, orderBy(sortField, sortOrder));

      // Apply pagination
      const pageLimit = pagination?.limit || 20;
      q = query(q, limit(pageLimit + 1)); // +1 to check if there are more

      if (pagination?.cursor) {
        const cursorDoc = await getDoc(doc(db, 'places', pagination.cursor));
        if (cursorDoc.exists()) {
          q = query(q, startAfter(cursorDoc));
        }
      }

      const snapshot = await getDocs(q);
      const places = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Place[];

      const hasMore = places.length > pageLimit;
      const items = hasMore ? places.slice(0, pageLimit) : places;
      const nextCursor = hasMore ? items[items.length - 1].id : undefined;

      return {
        items,
        nextCursor,
        hasMore,
      };
    } catch (error: any) {
      throw new Error(`Failed to get places: ${error.message}`);
    }
  }

  /**
   * Get all places for a specific user
   */
  async getUserPlaces(
    userId: string,
    sort?: PlaceSortOptions,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Place>> {
    return this.getPlaces({ userId }, sort, pagination);
  }

  /**
   * Get places within a geographic boundary
   */
  async getPlacesInBounds(
    north: number,
    south: number,
    east: number,
    west: number,
    filters?: PlaceFilters
  ): Promise<Place[]> {
    try {
      // Note: Firestore doesn't support complex geo queries natively
      // For MVP, we'll fetch all places and filter in memory
      // For production, consider using Firestore GeoFire or similar solution

      const allPlaces = await this.getPlaces(filters, undefined, { limit: 1000 });
      
      return allPlaces.items.filter((place) => {
        const { lat, lng } = place.location;
        return lat <= north && lat >= south && lng <= east && lng >= west;
      });
    } catch (error: any) {
      throw new Error(`Failed to get places in bounds: ${error.message}`);
    }
  }

  // ============================================
  // USER OPERATIONS
  // ============================================

  /**
   * Create a new user document
   */
  async createUser(
    userId: string,
    email: string,
    displayName: string | null
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        uid: userId,
        email,
        displayName,
        photoURL: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
      });
    } catch (error: any) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any> {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        return null;
      }

      return {
        uid: userDoc.id,
        ...userDoc.data(),
      };
    } catch (error: any) {
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        preferences,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      throw new Error(`Failed to update user preferences: ${error.message}`);
    }
  }

  /**
   * Update user stats (called after place creation/deletion)
   */
  async updateUserStats(userId: string): Promise<void> {
    try {
      // Get user places with a reasonable limit for stats calculation
      const userPlaces = await this.getUserPlaces(userId, undefined, { limit: 1000 });
      const places = userPlaces.items;

      // Calculate stats
      const countries = new Set(places.map((p) => p.address.country).filter(Boolean));
      const cities = new Set(places.map((p) => p.address.city).filter(Boolean));
      const totalPhotos = places.reduce((sum, p) => sum + p.photos.length, 0);

      const visitDates = places
        .map((p) => p.visitDate)
        .filter(Boolean)
        .sort((a, b) => {
          const dateA = a.seconds;
          const dateB = b.seconds;
          return dateA - dateB;
        });

      const firstTripDate = visitDates.length > 0 ? visitDates[0] : null;
      const lastTripDate = visitDates.length > 0 ? visitDates[visitDates.length - 1] : null;

      // Update user document
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'stats.totalPlaces': places.length,
        'stats.totalPhotos': totalPhotos,
        'stats.countriesVisited': countries.size,
        'stats.citiesVisited': cities.size,
        'stats.firstTripDate': firstTripDate,
        'stats.lastTripDate': lastTripDate,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error('Failed to update user stats:', error);
      // Don't throw - stats update shouldn't break the main operation
    }
  }

  // ============================================
  // BATCH OPERATIONS
  // ============================================

  /**
   * Delete multiple places at once
   */
  async deletePlaces(placeIds: string[]): Promise<void> {
    try {
      const deletePromises = placeIds.map((id) => this.deletePlace(id));
      await Promise.all(deletePromises);
    } catch (error: any) {
      throw new Error(`Failed to delete places: ${error.message}`);
    }
  }
}

// Export singleton instance
export const databaseService = new FirebaseDatabaseService();
