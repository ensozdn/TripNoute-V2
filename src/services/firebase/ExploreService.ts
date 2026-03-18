import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  serverTimestamp,
  Timestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Place, Trip } from '@/types';
import {
  Post,
  Like,
  ExploreFeedOptions,
  CreatePostFromPlaceInput,
  CreatePostFromTripInput,
  PostWithEngagement,
} from '@/types/explore';

/**
 * ExploreService - Handles explore feed, posts, likes, and comments
 */
export class ExploreService {
  private postsCollection = collection(db, 'posts');
  private likesCollection = collection(db, 'likes');
  private placesCollection = collection(db, 'places');
  private tripsCollection = collection(db, 'trips');

  // ─────────────────────────────────────────────────────────────────
  // Post Creation
  // ─────────────────────────────────────────────────────────────────

  /**
   * Create a post from a place
   */
  async createPostFromPlace(
    input: CreatePostFromPlaceInput,
    currentUserId: string,
    currentUserName: string,
    currentUserPhotoUrl?: string
  ): Promise<string> {
    const { placeId, caption } = input;

    // Fetch place data
    const placeDoc = await getDoc(doc(this.placesCollection, placeId));
    if (!placeDoc.exists()) {
      throw new Error('Place not found');
    }

    const place = { id: placeDoc.id, ...placeDoc.data() } as Place;

    // Verify ownership or public status
    if (place.userId !== currentUserId && !place.isPublic) {
      throw new Error('Cannot create post from private place');
    }

    // Create post document
    const postRef = doc(this.postsCollection);
    const post: Omit<Post, 'id'> = {
      userId: currentUserId,
      userName: currentUserName,
      userPhotoUrl: currentUserPhotoUrl,
      type: 'place',
      contentId: placeId,
      title: place.title || 'Untitled Place',
      description: place.description || undefined,
      caption: caption || undefined,
      photoUrls: place.photos?.map(p => p.url) || [],
      location: place.location && place.address?.country ? {
        city: place.address.city || '',
        country: place.address.country,
        countryCode: place.address.countryCode || '',
        coordinates: place.location,
      } : undefined,
      likesCount: 0,
      commentsCount: 0,
      savesCount: 0,
      isPublic: true,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(postRef, post);
    return postRef.id;
  }

  /**
   * Create a post from a trip
   */
  async createPostFromTrip(
    input: CreatePostFromTripInput,
    currentUserId: string,
    currentUserName: string,
    currentUserPhotoUrl?: string
  ): Promise<string> {
    const { tripId, caption } = input;

    // Fetch trip data
    const tripDoc = await getDoc(doc(this.tripsCollection, tripId));
    if (!tripDoc.exists()) {
      throw new Error('Trip not found');
    }

    const trip = { id: tripDoc.id, ...tripDoc.data() } as Trip;

    // Verify ownership
    if (trip.userId !== currentUserId) {
      throw new Error('Cannot create post from another user\'s trip');
    }

    // Create post document
    const postRef = doc(this.postsCollection);
    const post: Omit<Post, 'id'> = {
      userId: currentUserId,
      userName: currentUserName,
      userPhotoUrl: currentUserPhotoUrl,
      type: 'trip',
      contentId: tripId,
      title: trip.name,
      description: trip.description,
      caption: caption || undefined,
      photoUrls: trip.coverPhotoUrl ? [trip.coverPhotoUrl] : [],
      likesCount: 0,
      commentsCount: 0,
      savesCount: 0,
      isPublic: true,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await setDoc(postRef, post);
    return postRef.id;
  }

  /**
   * Delete a post (only owner can delete)
   */
  async deletePost(postId: string, userId: string): Promise<void> {
    const postRef = doc(this.postsCollection, postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      throw new Error('Post not found');
    }

    const post = postDoc.data() as Post;
    if (post.userId !== userId) {
      throw new Error('Cannot delete another user\'s post');
    }

    await deleteDoc(postRef);
  }

  // ─────────────────────────────────────────────────────────────────
  // Feed Queries
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get explore feed (public posts, sorted by recent)
   */
  async getExploreFeed(
    currentUserId: string,
    options: ExploreFeedOptions = {}
  ): Promise<PostWithEngagement[]> {
    const {
      limit = 20,
      cursor,
      followingOnly = false,
    } = options;

    let q = query(
      this.postsCollection,
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    // Pagination
    if (cursor) {
      const cursorDoc = await getDoc(doc(this.postsCollection, cursor));
      if (cursorDoc.exists()) {
        q = query(q, startAfter(cursorDoc));
      }
    }

    const snapshot = await getDocs(q);
    const posts: Post[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];

    // Filter by following (if enabled)
    let filteredPosts = posts;
    if (followingOnly) {
      const followingIds = await this.getFollowingIds(currentUserId);
      filteredPosts = posts.filter(p => followingIds.has(p.userId));
    }

    // Add engagement state
    const postsWithEngagement = await Promise.all(
      filteredPosts.map(async (post) => {
        const [isLiked, isSaved] = await Promise.all([
          this.isLiked(post.id, currentUserId),
          this.isSaved(post.id, currentUserId),
        ]);

        return {
          ...post,
          isLikedByCurrentUser: isLiked,
          isSavedByCurrentUser: isSaved,
        };
      })
    );

    return postsWithEngagement;
  }

  /**
   * Get user's posts
   */
  async getUserPosts(userId: string, limit = 20): Promise<Post[]> {
    const q = query(
      this.postsCollection,
      where('userId', '==', userId),
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];
  }

  // ─────────────────────────────────────────────────────────────────
  // Likes
  // ─────────────────────────────────────────────────────────────────

  /**
   * Like a post
   */
  async likePost(postId: string, userId: string, userName: string, userPhotoUrl?: string): Promise<void> {
    const likeId = `${userId}_${postId}`;
    const likeRef = doc(this.likesCollection, likeId);

    // Check if already liked
    const existing = await getDoc(likeRef);
    if (existing.exists()) {
      return; // Already liked
    }

    // Create like document and increment post's likesCount
    const batch = writeBatch(db);

    batch.set(likeRef, {
      postId,
      userId,
      userName,
      userPhotoUrl,
      createdAt: serverTimestamp(),
    });

    const postRef = doc(this.postsCollection, postId);
    batch.update(postRef, {
      likesCount: increment(1),
    });

    await batch.commit();
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string, userId: string): Promise<void> {
    const likeId = `${userId}_${postId}`;
    const likeRef = doc(this.likesCollection, likeId);

    // Check if exists
    const existing = await getDoc(likeRef);
    if (!existing.exists()) {
      return; // Not liked
    }

    // Delete like and decrement post's likesCount
    const batch = writeBatch(db);

    batch.delete(likeRef);

    const postRef = doc(this.postsCollection, postId);
    batch.update(postRef, {
      likesCount: increment(-1),
    });

    await batch.commit();
  }

  /**
   * Check if user has liked a post
   */
  async isLiked(postId: string, userId: string): Promise<boolean> {
    const likeId = `${userId}_${postId}`;
    const likeRef = doc(this.likesCollection, likeId);
    const likeDoc = await getDoc(likeRef);
    return likeDoc.exists();
  }

  /**
   * Get users who liked a post
   */
  async getPostLikes(postId: string, limit = 50): Promise<Like[]> {
    const q = query(
      this.likesCollection,
      where('postId', '==', postId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Like[];
  }

  // ─────────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get following user IDs (for filtering feed)
   */
  private async getFollowingIds(userId: string): Promise<Set<string>> {
    const followsCollection = collection(db, 'follows');
    const q = query(
      followsCollection,
      where('followerId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const followingIds = snapshot.docs.map(doc => doc.data().followingId as string);
    return new Set(followingIds);
  }

  /**
   * Check if user has saved a post
   */
  private async isSaved(postId: string, userId: string): Promise<boolean> {
    const saveId = `${userId}_${postId}`;
    const savesCollection = collection(db, 'saves');
    const saveRef = doc(savesCollection, saveId);
    const saveDoc = await getDoc(saveRef);
    return saveDoc.exists();
  }

  /**
   * Get a single post by ID
   */
  async getPost(postId: string): Promise<Post | null> {
    const postRef = doc(this.postsCollection, postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      return null;
    }

    return {
      id: postDoc.id,
      ...postDoc.data(),
    } as Post;
  }
}

export const exploreService = new ExploreService();
