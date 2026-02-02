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

  createPlace(input: CreatePlaceInput, userId: string): Promise<Place>;
  getPlaceById(placeId: string): Promise<Place | null>;
  updatePlace(input: UpdatePlaceInput): Promise<Place>;
  deletePlace(placeId: string): Promise<void>;
  getPlaces(
    filters?: PlaceFilters,
    sort?: PlaceSortOptions,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Place>>;
  getUserPlaces(
    userId: string,
    sort?: PlaceSortOptions,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Place>>;
  getPlacesInBounds(
    north: number,
    south: number,
    east: number,
    west: number,
    filters?: PlaceFilters
  ): Promise<Place[]>;

  createUser(userId: string, email: string, displayName: string | null): Promise<void>;
  getUserById(userId: string): Promise<import('@/types/firebase').UserDocument | null>;
  updateUserPreferences(userId: string, preferences: import('@/types/firebase').UserPreferences): Promise<void>;
  updateUserStats(userId: string): Promise<void>;

  addPhotoToPlace(placeId: string, photo: Photo): Promise<Photo>;
  deletePhotoFromPlace(placeId: string, photoId: string): Promise<void>;
  updatePhotoDescription(placeId: string, photoId: string, description: string): Promise<void>;
  getPlacePhotos(placeId: string): Promise<Photo[]>;

  deletePlaces(placeIds: string[]): Promise<void>;
}
