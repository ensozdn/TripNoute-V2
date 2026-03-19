import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Notification } from '@/types/notification';

export class NotificationService {
  private notificationsCollection = collection(db, 'notifications');

  async getNotifications(userId: string, limitCount = 50): Promise<Notification[]> {
    try {
      const q = query(
        this.notificationsCollection,
        where('recipientId', '==', userId),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        this.notificationsCollection,
        where('recipientId', '==', userId),
        where('isRead', '==', false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  async createFollowNotification(
    senderId: string,
    senderName: string,
    senderPhotoUrl: string | undefined,
    recipientId: string
  ): Promise<string> {
    if (senderId === recipientId) return '';

    const notificationRef = doc(this.notificationsCollection);
    await setDoc(notificationRef, {
      recipientId,
      senderId,
      senderName,
      senderPhotoUrl,
      type: 'follow',
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return notificationRef.id;
  }

  async createLikeNotification(
    senderId: string,
    senderName: string,
    senderPhotoUrl: string | undefined,
    recipientId: string,
    postId: string,
    postTitle?: string,
    postPhotoUrl?: string
  ): Promise<string> {
    if (senderId === recipientId) return '';

    const notificationRef = doc(this.notificationsCollection);
    await setDoc(notificationRef, {
      recipientId,
      senderId,
      senderName,
      senderPhotoUrl,
      type: 'like',
      postId,
      text: postTitle,
      photoUrl: postPhotoUrl,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return notificationRef.id;
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(this.notificationsCollection, notificationId);
    await updateDoc(notificationRef, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<void> {
    const notifications = await this.getNotifications(userId);
    const unreadNotifications = notifications.filter(n => !n.isRead);

    await Promise.all(
      unreadNotifications.map(n => this.markAsRead(n.id))
    );
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const notificationRef = doc(this.notificationsCollection, notificationId);
    await deleteDoc(notificationRef);
  }
}

export const notificationService = new NotificationService();
