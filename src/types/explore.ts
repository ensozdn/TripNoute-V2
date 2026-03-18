import { Timestamp } from './index';

/**
 * Post Types - Explore Feed Content
 */

export type PostType = 'place' | 'trip';

export interface PostLocation {
  city?: string;
  country?: string;
  countryCode?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  
  // Content reference
  type: PostType;
  contentId: string;       // placeId or tripId
  
  // Post content
  title: string;
  description?: string;
  caption?: string;        // User's custom caption when sharing
  photoUrls: string[];
  location?: PostLocation;
  
  // Engagement metrics
  likesCount: number;
  commentsCount: number;
  savesCount: number;
  
  // Metadata
  isPublic: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Like {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  text: string;
  createdAt: Timestamp;
}

export interface Save {
  id: string;
  postId: string;
  userId: string;
  createdAt: Timestamp;
}

/**
 * Feed Query Options
 */
export interface ExploreFeedOptions {
  limit?: number;
  cursor?: string;        // Last post ID for pagination
  followingOnly?: boolean; // Show only following users' posts
  userId?: string;         // Show specific user's posts
}

/**
 * Post Creation Input
 */
export interface CreatePostFromPlaceInput {
  placeId: string;
  caption?: string;
}

export interface CreatePostFromTripInput {
  tripId: string;
  caption?: string;
}

/**
 * Post with engagement state (for UI)
 */
export interface PostWithEngagement extends Post {
  isLikedByCurrentUser: boolean;
  isSavedByCurrentUser: boolean;
}
