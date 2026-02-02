
export type Timestamp = {
  seconds: number;
  nanoseconds: number;
};

export const timestampToDate = (timestamp: Timestamp): Date => {
  return new Date(timestamp.seconds * 1000);
};

export interface Location {
  lat: number;
  lng: number;
}

export interface Address {
  formatted: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  postalCode?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserStats {
  totalPlaces: number;
  totalPhotos: number;
  countriesVisited: number;
  citiesVisited: number;
  firstTripDate: Timestamp | null;
  lastTripDate: Timestamp | null;
}

export interface User extends UserProfile {
  stats: UserStats;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultMapView: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  distanceUnit: 'km' | 'miles';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  isPublicProfile: boolean;
  allowNotifications: boolean;
}

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  storagePath: string;
  filename: string;
  size: number;
  mimeType: string;
  width: number;
  height: number;
  uploadedAt: Timestamp;
  uploadedBy: string;
}

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
  rating?: number;
  isPublic: boolean;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  transportType?: TransportType;
  order?: number;
}

export type TransportType = 'walking' | 'bus' | 'car' | 'flight' | 'ship' | 'train';

export type TransportMode =
  | 'flight'
  | 'car'
  | 'bus'
  | 'train'
  | 'ship'
  | 'walk'
  | 'walking'
  | 'bike';

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

export interface JourneyStep {
  id: string;
  name: string;
  coordinates: [number, number];
  transportToNext: TransportMode | null;
  timestamp: number;
  order: number;
  notes?: string;
  address?: {
    city?: string;
    country?: string;
    formatted?: string;
  };
}

export interface Trip {
  id: string;
  userId: string;
  name: string;
  title?: string;
  description?: string;
  color: string;
  steps: JourneyStep[];
  placeIds?: string[];
  startDate?: Timestamp;
  endDate?: Timestamp;
  isPublic: boolean;
  tags?: string[];
  coverPhotoUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

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
  transportType?: TransportType;
  order?: number;
}

export interface UpdatePlaceInput extends Partial<CreatePlaceInput> {
  id: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  limit: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
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

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapMarker {
  id: string;
  position: Location;
  title: string;
  icon?: string;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: Date;
}

export type AnalyticsEventName =
  | 'page_view'
  | 'place_created'
  | 'place_updated'
  | 'place_deleted'
  | 'photo_uploaded'
  | 'user_registered'
  | 'user_login'
  | 'map_interaction';
