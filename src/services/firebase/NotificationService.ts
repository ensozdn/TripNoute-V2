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
  limit as firestoreLimit,
  startAfter,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Notification, 
  NotificationQueryOptions,
  TimeGroupedNotifications 
} from '@/types/notification';

/**
 * NotificationService - Handles all notification operations
 */
export class NotificationService {
  private notificationsCollection = collection(db, 'notifications');

  // ─────────────────────────────────────────────────────────────────
  // Create Notifications
  // ─────────────────────────────────────────────────────────────────

  /**
   * Create a follow notification
   */
  async createFollowNotification(
    senderId: string,
    senderName: string,
    senderPhotoUrl: string | undefined,
    recipientId: string
  ): Promise<string> {
    // Don't notify yourself
    if (senderId === recipientId) return '';

    const notificationRef = doc(this.notificationsCollection);
    const notification: Omit<Notification, 'id'> = {
      recipientId,
      senderId,
      senderName,
      senderPhotoUrl,
      type: 'follow',
      isRead: false,
      createdAt: serverTimestamp() as Timestamp,
    };

    await setDoc(notificationRef, notification);
    return notificationRef.id;
  }

  /**
   * Create a like notification
   */
  async createLikeNotification(
    senderId: string,
    senderName: string,
    senderPhotoUrl: string | undefined,
    recipientId: string,
    postId: string,
    postTitle: string,
    postPhotoUrl?: string
  ): Promise<string> {
    // Don't notify yourself
    if (senderId === recipientId) return '';

    const notificationRef = doc(this.notificationsCollection);
    const notification: Omit<Notification, 'id'> = {
      recipientId,
      senderId,
      senderName,
      senderPhotoUrl,
      type: 'like',
      postId,
      text: postTitle,
      photoUrl: postPhotoUrl,
      isRead: false,
      createdAt: serverTimestamp() as Timestamp,
    };

    await setDoc(notificationRef, notification);
    return notificationRef.id;
  }

  /**
   * Create a comment notification
   */
  async createCommentNotification(
    senderId: string,
    senderName: string,
    senderPhotoUrl: string | undefined,
    recipientId: string,
    postId: string,
    commentId: string,
    commentText: string,
    postPhotoUrl?: string
  ): Promise<string> {
    // Don't notify yourself
    if (senderId === recipientId) return '';

    const notificationRef = doc(this.notificationsCollection);
    const notification: Omit<Notification, 'id'> = {
      recipientId,
      senderId,
      senderName,
      senderPhotoUrl,
      type: 'comment',
      postId,
      commentId,
      text: commentText,
      photoUrl: postPhotoUrl,
      isRead: false,
      createdAt: serverTimestamp() as Timestamp,
    };

    await setDoc(notificationRef, notification);
    return notificationRef.id;
  }

  /**
   * Create a mention notification
   */
  async createMentionNotification(
    senderId: string,
    senderName: string,
    senderPhotoUrl: string | undefined,
    recipientId: string,
    postId: string,
    captionExcerpt: string,
    postPhotoUrl?: string
  ): Promise<string> {
    // Don't notify yourself
    if (senderId === recipientId) return '';

    const notificationRef = doc(this.notificationsCollection);
    const notification: Omit<Notification, 'id'> = {
      recipientId,
      senderId,
      senderName,
      senderPhotoUrl,
      type: 'mention',
      postId,
      text: captionExcerpt,
      photoUrl: postPhotoUrl,
      isRead: false,
      createdAt: serverTimestamp() as Timestamp,
    };

    await setDoc(notificationRef, notification);
    return notificationRef.id;
  }

  /**
   * Create a trip start notification (for followers)
   */
  async createTripStartNotification(
    senderId: string,
    senderName: string,
    senderPhotoUrl: string | undefined,
    recipientId: string,
    tripId: string,
    tripTitle: string,
    tripPhotoUrl?: string
  ): Promise<string> {
    const notificationRef = doc(this.notificationsCollection);
    const notification: Omit<Notification, 'id'> = {
      recipientId,
      senderId,
      senderName,
      senderPhotoUrl,
      type: 'trip_start',
      tripId,
      text: tripTitle,
      photoUrl: tripPhotoUrl,
      isRead: false,
      createdAt: serverTimestamp() as Timestamp,
    };

    await setDoc(notificationRef, notification);
    return notificationRef.id;
  }

  /**
   * Create a milestone notification (medallion captured)
   */
  async createMilestoneNotification(
    senderId: string,
    senderName: string,
    senderPhotoUrl: string | undefined,
    recipientId: string,
    tripId: string,
    medallionId: string,
    locationName: string,
    medallionPhotoUrl?: string
  ): Promise<string> {
    const notificationRef = doc(this.notificationsCollection);
    const notification: Omit<Notification, 'id'> = {
      recipientId,
      senderId,
      senderName,
      senderPhotoUrl,
      type: 'milestone',
      tripId,
      medallionId,
      text: locationName,
      photoUrl: medallionPhotoUrl,
      isRead: false,
      createdAt: serverTimestamp() as Timestamp,
    };

    await setDoc(notificationRef, notification);
    return notificationRef.id;
  }

  // ─────────────────────────────────────────────────────────────────
  // Read Notifications
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get user's notifications
   */
  async getNotifications(
    userId: string,
    options: NotificationQueryOptions = {}
  ): Promise<Notification[]> {
    const { limit = 50, cursor, unreadOnly = false } = options;

    let q = query(
      this.notificationsCollection,
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );

    // Filter by read status
    if (unreadOnly) {
      q = query(
        this.notificationsCollection,
        where('recipientId', '==', userId),
        where('isRead', '==', false),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limit)
      );
    }

    // Pagination
    if (cursor) {
      const cursorDoc = await getDoc(doc(this.notificationsCollection, cursor));
      if (cursorDoc.exists()) {
        q = query(q, startAfter(cursorDoc));
      }
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const q = query(
      this.notificationsCollection,
      where('recipientId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  /**
   * Group notifications by time period
   */
  groupByTime(notifications: Notification[]): TimeGroupedNotifications {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const yesterdayStart = todayStart - 86400000; // 24 hours
    const weekStart = todayStart - 604800000; // 7 days

    return {
      today: notifications.filter(n => {
        const time = n.createdAt.seconds * 1000;
        return time >= todayStart;
      }),
      yesterday: notifications.filter(n => {
        const time = n.createdAt.seconds * 1000;
        return time >= yesterdayStart && time < todayStart;
      }),
      thisWeek: notifications.filter(n => {
        const time = n.createdAt.seconds * 1000;
        return time >= weekStart && time < yesterdayStart;
      }),
      earlier: notifications.filter(n => {
        const time = n.createdAt.seconds * 1000;
        return time < weekStart;
      }),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // Update Notifications
  // ─────────────────────────────────────────────────────────────────

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const notificationRef = doc(this.notificationsCollection, notificationId);
    
    // Verify ownership before updating
    const notificationDoc = await getDoc(notificationRef);
    if (!notificationDoc.exists()) {
      throw new Error('Notification not found');
    }
    
    const notification = notificationDoc.data() as Notification;
    if (notification.recipientId !== userId) {
      throw new Error('Unauthorized to update this notification');
    }

    await updateDoc(notificationRef, { isRead: true });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      this.notificationsCollection,
      where('recipientId', '==', userId),
      where('isRead', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { isRead: true });
    });

    await batch.commit();
  }

  // ─────────────────────────────────────────────────────────────────
  // Delete Notifications
  // ─────────────────────────────────────────────────────────────────

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notificationRef = doc(this.notificationsCollection, notificationId);
    
    // Verify ownership
    const notificationDoc = await getDoc(notificationRef);
    if (!notificationDoc.exists()) {
      throw new Error('Notification not found');
    }
    
    const notification = notificationDoc.data() as Notification;
    if (notification.recipientId !== userId) {
      throw new Error('Unauthorized to delete this notification');
    }

    await deleteDoc(notificationRef);
  }

  /**
   * Delete all read notifications
   */
  async deleteAllRead(userId: string): Promise<void> {
    const q = query(
      this.notificationsCollection,
      where('recipientId', '==', userId),
      where('isRead', '==', true)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
