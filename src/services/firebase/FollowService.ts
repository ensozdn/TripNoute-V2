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
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notificationService } from './NotificationService';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  stats?: {
    placesCount: number;
    tripsCount: number;
    countriesCount: number;
  };
  createdAt?: Timestamp;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Timestamp;
}

export interface FollowWithProfile extends Follow {
  profile: UserProfile;
}

export class FollowService {
  /**
   * Follow a user
   */
  async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    const followId = `${followerId}_${followingId}`;
    const followRef = doc(db, 'follows', followId);

    // Check if already following
    const existing = await getDoc(followRef);
    if (existing.exists()) {
      return; // Already following
    }

    // Create follow relationship
    await setDoc(followRef, {
      followerId,
      followingId,
      createdAt: serverTimestamp(),
    });

    // Get follower's profile info
    const followerProfile = await this.getUserProfile(followerId);

    // Create notification for the followed user
    await notificationService.createFollowNotification(
      followerId,
      followerProfile.displayName || 'Someone',
      followerProfile.photoURL || undefined,
      followingId
    );

    // Send push notification via API
    try {
      // FIXED: Use stable followId as deduplication key (without timestamp)
      const notificationId = `follow_${followId}`;
      
      console.log('🔔 [FollowService] Sending push notification...', { 
        recipientId: followingId, 
        senderId: followerId,
        notificationId 
      });
      
      await fetch('/api/notifications/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'follow',
          recipientId: followingId,
          senderName: followerProfile.displayName || 'Someone',
          senderPhotoUrl: followerProfile.photoURL || undefined,
          senderId: followerId,
          notificationId, // Stable ID for deduplication
        }),
      });
      
      console.log('✅ [FollowService] Push notification request completed');
    } catch (error) {
      console.error('❌ [FollowService] Failed to send push notification:', error);
      // Don't fail the whole operation if push fails
    }
  }

  /**
   * Unfollow a user
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const followId = `${followerId}_${followingId}`;
    const followRef = doc(db, 'follows', followId);
    await deleteDoc(followRef);
  }

  /**
   * Check if user A is following user B
   */
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const followId = `${followerId}_${followingId}`;
    const followRef = doc(db, 'follows', followId);
    const snap = await getDoc(followRef);
    return snap.exists();
  }

  /**
   * Get list of users that this user is following
   */
  async getFollowing(userId: string): Promise<FollowWithProfile[]> {
    const q = query(
      collection(db, 'follows'),
      where('followerId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const follows: Follow[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Follow, 'id'>),
    }));

    // Fetch user profiles for all followingIds
    const profiles = await Promise.all(
      follows.map((f) => this.getUserProfile(f.followingId))
    );

    return follows.map((f, i) => ({
      ...f,
      profile: profiles[i],
    }));
  }

  /**
   * Get list of users that follow this user
   */
  async getFollowers(userId: string): Promise<FollowWithProfile[]> {
    const q = query(
      collection(db, 'follows'),
      where('followingId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const follows: Follow[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Follow, 'id'>),
    }));

    // Fetch user profiles for all followerIds
    const profiles = await Promise.all(
      follows.map((f) => this.getUserProfile(f.followerId))
    );

    return follows.map((f, i) => ({
      ...f,
      profile: profiles[i],
    }));
  }

  /**
   * Get following/followers count
   */
  async getFollowCounts(userId: string): Promise<{ following: number; followers: number }> {
    const [followingSnap, followersSnap] = await Promise.all([
      getDocs(query(collection(db, 'follows'), where('followerId', '==', userId))),
      getDocs(query(collection(db, 'follows'), where('followingId', '==', userId))),
    ]);

    return {
      following: followingSnap.size,
      followers: followersSnap.size,
    };
  }

  /**
   * Search users by display name or email
   */
  async searchUsers(searchQuery: string, currentUserId: string, maxResults = 20): Promise<UserProfile[]> {
    const usersRef = collection(db, 'users');
    
    // Firestore doesn't support case-insensitive search natively,
    // so we do a prefix search on displayName (requires an index)
    const searchLower = searchQuery.toLowerCase();
    
    // Query by displayName prefix (case-sensitive, will need normalization)
    const q = query(
      usersRef,
      orderBy('displayName'),
      limit(maxResults)
    );

    const snapshot = await getDocs(q);
    const users: UserProfile[] = snapshot.docs
      .map((doc) => ({
        uid: doc.id,
        ...(doc.data() as Omit<UserProfile, 'uid'>),
      }))
      .filter((user) => {
        // Client-side case-insensitive filter
        const nameMatch = user.displayName?.toLowerCase().includes(searchLower);
        const emailMatch = user.email?.toLowerCase().includes(searchLower);
        const notSelf = user.uid !== currentUserId;
        return notSelf && (nameMatch || emailMatch);
      });

    return users;
  }

  /**
   * Get suggested users (users not following yet, sorted by place count or random)
   */
  async getSuggestedUsers(currentUserId: string, maxResults = 10): Promise<UserProfile[]> {
    // Get all users (excluding current user)
    const usersRef = collection(db, 'users');
    const q = query(usersRef, limit(50)); // Get more than needed for filtering
    const snapshot = await getDocs(q);

    const allUsers: UserProfile[] = snapshot.docs
      .filter((doc) => doc.id !== currentUserId)
      .map((doc) => ({
        uid: doc.id,
        ...(doc.data() as Omit<UserProfile, 'uid'>),
      }));

    // Get users already following
    const followingSnap = await getDocs(
      query(collection(db, 'follows'), where('followerId', '==', currentUserId))
    );
    const followingIds = new Set(followingSnap.docs.map((d) => d.data().followingId));

    // Filter out already following users
    const notFollowing = allUsers.filter((u) => !followingIds.has(u.uid));

    // Sort by places count (descending) and return top N
    return notFollowing
      .sort((a, b) => (b.stats?.placesCount ?? 0) - (a.stats?.placesCount ?? 0))
      .slice(0, maxResults);
  }

  /**
   * Get a single user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      throw new Error('User not found');
    }

    return {
      uid: snap.id,
      ...(snap.data() as Omit<UserProfile, 'uid'>),
    };
  }

  /**
   * Update user stats (places/trips/countries count)
   * Call this whenever a place or trip is added/deleted
   */
  async updateUserStats(
    userId: string,
    stats: { placesCount?: number; tripsCount?: number; countriesCount?: number }
  ): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Create user doc if it doesn't exist
      await setDoc(userRef, {
        stats: {
          placesCount: stats.placesCount ?? 0,
          tripsCount: stats.tripsCount ?? 0,
          countriesCount: stats.countriesCount ?? 0,
        },
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } else {
      // Update existing stats
      const currentStats = userSnap.data().stats || {};
      await setDoc(
        userRef,
        {
          stats: {
            placesCount: stats.placesCount ?? currentStats.placesCount ?? 0,
            tripsCount: stats.tripsCount ?? currentStats.tripsCount ?? 0,
            countriesCount: stats.countriesCount ?? currentStats.countriesCount ?? 0,
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  }
}

export const followService = new FollowService();
