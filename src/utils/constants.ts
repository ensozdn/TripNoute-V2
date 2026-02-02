
export const APP_NAME = 'TripNoute';
export const APP_VERSION = '2.0.0';
export const APP_DESCRIPTION = 'Your Personal Travel Journal & Smart Travel Assistant';

export const API_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  MAX_PHOTOS_PER_PLACE: 10,
  MAX_PLACES_PER_PAGE: 20,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_TAG_LENGTH: 30,
  MAX_TAGS_PER_PLACE: 10,
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const PLACE_CATEGORIES = [
  { value: 'restaurant', label: 'Restaurant', icon: '️' },
  { value: 'hotel', label: 'Hotel', icon: '' },
  { value: 'attraction', label: 'Attraction', icon: '' },
  { value: 'museum', label: 'Museum', icon: '️' },
  { value: 'park', label: 'Park', icon: '' },
  { value: 'beach', label: 'Beach', icon: '️' },
  { value: 'mountain', label: 'Mountain', icon: '️' },
  { value: 'city', label: 'City', icon: '️' },
  { value: 'landmark', label: 'Landmark', icon: '' },
  { value: 'other', label: 'Other', icon: '' },
] as const;

export const MAP_SETTINGS = {
  DEFAULT_ZOOM: 12,
  MIN_ZOOM: 2,
  MAX_ZOOM: 20,
  DEFAULT_CENTER: {
    lat: 41.0082,
    lng: 28.9784,
  },
  MAP_STYLES: {
    roadmap: 'Roadmap',
    satellite: 'Satellite',
    hybrid: 'Hybrid',
    terrain: 'Terrain',
  },
} as const;

export const DATE_FORMATS = {
  'DD/MM/YYYY': 'DD/MM/YYYY',
  'MM/DD/YYYY': 'MM/DD/YYYY',
  'YYYY-MM-DD': 'YYYY-MM-DD',
} as const;

export const DISTANCE_UNITS = {
  km: 'Kilometers',
  miles: 'Miles',
} as const;

export const THEMES = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
} as const;

export const AUTH_ERRORS = {
  EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  INVALID_EMAIL: 'auth/invalid-email',
  WEAK_PASSWORD: 'auth/weak-password',
  USER_NOT_FOUND: 'auth/user-not-found',
  WRONG_PASSWORD: 'auth/wrong-password',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  NETWORK_ERROR: 'auth/network-request-failed',
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  MAP: '/map',
  PLACES: '/places',
  PLACE_DETAIL: (id: string) => `/places/${id}`,
  ADD_PLACE: '/places/add',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

export const STORAGE_PATHS = {
  PHOTOS: (userId: string, placeId: string) => `users/${userId}/places/${placeId}/photos`,
  AVATARS: (userId: string) => `users/${userId}/avatar`,
} as const;

export const COLLECTIONS = {
  USERS: 'users',
  PLACES: 'places',
  TRIPS: 'trips',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'tripnoute_auth_token',
  USER_PREFERENCES: 'tripnoute_user_preferences',
  THEME: 'tripnoute_theme',
} as const;

export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  URL: /^https?:\/\/.+/,
} as const;

export const IMAGE_SETTINGS = {
  ACCEPTED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080,
  THUMBNAIL_SIZE: 200,
  QUALITY: 0.8,
} as const;

export const MESSAGES = {
  SUCCESS: {
    PLACE_CREATED: 'Place created successfully!',
    PLACE_UPDATED: 'Place updated successfully!',
    PLACE_DELETED: 'Place deleted successfully!',
    PROFILE_UPDATED: 'Profile updated successfully!',
    LOGIN_SUCCESS: 'Welcome back!',
    REGISTER_SUCCESS: 'Account created successfully!',
  },
  ERROR: {
    GENERIC: 'Something went wrong. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You need to be logged in to do this.',
    NOT_FOUND: 'The requested resource was not found.',
    FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
    INVALID_FILE_TYPE: 'Invalid file type. Please upload an image.',
  },
} as const;
