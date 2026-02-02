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
  arrayUnion,
  arrayRemove,
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
import { Photo } from '@/types/models/Photo';

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return defaultMessage;
};

export class FirebaseDatabaseService implements IDatabaseService {

  async createPlace(input: CreatePlaceInput, userId: string): Promise<Place> {
    try {
      const placesRef = collection(db, 'places');
      const newPlaceRef = doc(placesRef);

      let visitDateTimestamp;
      if (input.visitDate instanceof Date) {
        console.log('Converting Date to Timestamp:', input.visitDate);
        visitDateTimestamp = FirestoreTimestamp.fromDate(input.visitDate);
        console.log('Converted Timestamp:', visitDateTimestamp);
      } else {
        console.log('Using existing timestamp:', input.visitDate);

        visitDateTimestamp = input.visitDate;
      }

      const placeData: any = {
        userId,
        title: input.title,
        description: input.description,
        location: input.location,
        address: input.address || {
          formatted: '',
        },
        visitDate: visitDateTimestamp,
        photos: [],
        isPublic: input.isPublic,
        tags: input.tags || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (input.category !== undefined) {
        placeData.category = input.category;
      }
      if (input.rating !== undefined) {
        placeData.rating = input.rating;
      }
      if (input.transportType !== undefined) {
        placeData.transportType = input.transportType;
      }
      if (input.order !== undefined) {
        placeData.order = input.order;
      }

      await setDoc(newPlaceRef, placeData);

      const createdPlace = await this.getPlaceById(newPlaceRef.id);
      if (!createdPlace) {
        throw new Error('Failed to create place');
      }

      await this.updateUserStats(userId);

      return createdPlace;
    } catch (error: unknown) {
      throw new Error(`Failed to create place: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }
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
    } catch (error: unknown) {
      throw new Error(`Failed to get place: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }
  async updatePlace(input: UpdatePlaceInput): Promise<Place> {
    try {
      const placeRef = doc(db, 'places', input.id);

      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.location !== undefined) updateData.location = input.location;
      if (input.address !== undefined) updateData.address = input.address;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.rating !== undefined) updateData.rating = input.rating;
      if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;
      if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.transportType !== undefined) updateData.transportType = input.transportType;
      if (input.order !== undefined) updateData.order = input.order;

      if (input.visitDate) {
        updateData.visitDate = FirestoreTimestamp.fromDate(input.visitDate);
      }

      await updateDoc(placeRef, updateData);

      const updatedPlace = await this.getPlaceById(input.id);
      if (!updatedPlace) {
        throw new Error('Place not found after update');
      }

      return updatedPlace;
    } catch (error: unknown) {
      throw new Error(`Failed to update place: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }
  async deletePlace(placeId: string): Promise<void> {
    try {
      const placeRef = doc(db, 'places', placeId);
      const placeDoc = await getDoc(placeRef);

      if (!placeDoc.exists()) {
        throw new Error('Place not found');
      }

      const placeData = placeDoc.data() as Place;

      if (placeData.photos && placeData.photos.length > 0) {
        try {

          const { storageService } = await import('@/services/firebase/FirebaseStorageService');

          const photoDeletePromises = placeData.photos.map((photo) =>
            storageService.deletePhoto(photo.id, photo.storagePath)
              .catch((error) => {
                console.error(`Failed to delete photo ${photo.id}:`, error);

              })
          );

          await Promise.allSettled(photoDeletePromises);
        } catch (storageError) {
          console.error('Error deleting photos from storage:', storageError);

        }
      }

      await deleteDoc(placeRef);

      await this.updateUserStats(placeData.userId);
    } catch (error: unknown) {
      throw new Error(`Failed to delete place: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }
  async getPlaces(
    filters?: PlaceFilters,
    sort?: PlaceSortOptions,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Place>> {
    try {
      const placesRef = collection(db, 'places');
      let q = query(placesRef);

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

      const sortField = sort?.field || 'createdAt';
      const sortOrder = sort?.order || 'desc';
      q = query(q, orderBy(sortField, sortOrder));

      const pageLimit = pagination?.limit || 20;
      q = query(q, limit(pageLimit + 1));

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
    } catch (error: unknown) {
      throw new Error(`Failed to get places: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }
  async getUserPlaces(
    userId: string,
    sort?: PlaceSortOptions,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Place>> {
    return this.getPlaces({ userId }, sort, pagination);
  }
  async getPlacesInBounds(
    north: number,
    south: number,
    east: number,
    west: number,
    filters?: PlaceFilters
  ): Promise<Place[]> {
    try {

      const allPlaces = await this.getPlaces(filters, undefined, { limit: 1000 });

      return allPlaces.items.filter((place) => {
        const { lat, lng } = place.location;
        return lat <= north && lat >= south && lng <= east && lng >= west;
      });
    } catch (error: unknown) {
      throw new Error(`Failed to get places in bounds: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }

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
    } catch (error: unknown) {
      throw new Error(`Failed to create user: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }
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
    } catch (error: unknown) {
      throw new Error(`Failed to get user: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }
  async updateUserPreferences(userId: string, preferences: any): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        preferences,
        updatedAt: serverTimestamp(),
      });
    } catch (error: unknown) {
      throw new Error(`Failed to update user preferences: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }
  async updateUserStats(userId: string): Promise<void> {
    try {

      const userPlaces = await this.getUserPlaces(userId, undefined, { limit: 1000 });
      const places = userPlaces.items;

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
    } catch (error: unknown) {
      console.error('Failed to update user stats:', error);

    }
  }

  async addPhotoToPlace(placeId: string, photo: Photo): Promise<Photo> {
    try {
      const placeRef = doc(db, 'places', placeId);
      const placeDoc = await getDoc(placeRef);

      if (!placeDoc.exists()) {
        throw new Error('Place not found');
      }

      const photoWithId: Photo = {
        ...photo,
        id: `${placeId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      await updateDoc(placeRef, {
        photos: arrayUnion(photoWithId),
        updatedAt: serverTimestamp(),
      });

      const place = placeDoc.data() as Place;
      if (place.userId) {
        await this.updateUserStats(place.userId);
      }

      return photoWithId;
    } catch (error: unknown) {
      throw new Error(`Failed to add photo: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }
  async deletePhotoFromPlace(placeId: string, photoId: string): Promise<void> {
    try {
      const placeRef = doc(db, 'places', placeId);
      const placeDoc = await getDoc(placeRef);

      if (!placeDoc.exists()) {
        throw new Error('Place not found');
      }

      const place = placeDoc.data() as Place;

      const photoToDelete = place.photos.find(p => p.id === photoId);
      if (!photoToDelete) {
        throw new Error('Photo not found');
      }

      await updateDoc(placeRef, {
        photos: arrayRemove(photoToDelete),
        updatedAt: serverTimestamp(),
      });

      if (place.userId) {
        await this.updateUserStats(place.userId);
      }
    } catch (error: unknown) {
      throw new Error(`Failed to delete photo: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }
  async updatePhotoDescription(
    placeId: string,
    photoId: string,
    description: string
  ): Promise<void> {
    try {
      const placeRef = doc(db, 'places', placeId);
      const placeDoc = await getDoc(placeRef);

      if (!placeDoc.exists()) {
        throw new Error('Place not found');
      }

      const place = placeDoc.data() as Place;

      const updatedPhotos = place.photos.map(photo => {
        if (photo.id === photoId) {
          return { ...photo, description };
        }
        return photo;
      });

      await updateDoc(placeRef, {
        photos: updatedPhotos,
        updatedAt: serverTimestamp(),
      });
    } catch (error: unknown) {
      throw new Error(`Failed to update photo description: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }
  async getPlacePhotos(placeId: string): Promise<Photo[]> {
    try {
      const placeRef = doc(db, 'places', placeId);
      const placeDoc = await getDoc(placeRef);

      if (!placeDoc.exists()) {
        throw new Error('Place not found');
      }

      const place = placeDoc.data() as Place;
      return place.photos || [];
    } catch (error: unknown) {
      throw new Error(`Failed to get place photos: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }

  async deletePlaces(placeIds: string[]): Promise<void> {
    try {
      const deletePromises = placeIds.map((id) => this.deletePlace(id));
      await Promise.all(deletePromises);
    } catch (error: unknown) {
      throw new Error(`Failed to delete places: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }
}

export const databaseService = new FirebaseDatabaseService();
