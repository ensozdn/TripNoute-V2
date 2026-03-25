import { getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export class FCMTokenService {
  private messaging: Messaging | null = null;

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      this.initializeMessaging();
    }
  }

  private async initializeMessaging() {
    try {
      const { getMessaging } = await import('firebase/messaging');
      const { app } = await import('@/lib/firebase');
      this.messaging = getMessaging(app);
      console.log('✅ FCM Messaging initialized');
    } catch (error) {
      console.error('❌ Failed to initialize FCM:', error);
    }
  }

  /**
   * Request notification permission and get FCM token
   */
  async requestPermissionAndGetToken(userId: string): Promise<string | null> {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.log('❌ This browser does not support notifications');
        return null;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        console.log('⚠️ Notification permission denied');
        return null;
      }

      console.log('✅ Notification permission granted');

      // Wait for messaging to be initialized
      if (!this.messaging) {
        await this.initializeMessaging();
      }

      if (!this.messaging) {
        throw new Error('Messaging not initialized');
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration);

      // Get FCM token
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        throw new Error('VAPID key not found in environment variables');
      }

      const token = await getToken(this.messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        console.log('✅ FCM Token received:', token.substring(0, 20) + '...');
        
        // Save token to Firestore
        await this.saveTokenToFirestore(userId, token);
        
        return token;
      } else {
        console.log('⚠️ No registration token available');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Save FCM token to Firestore
   */
  private async saveTokenToFirestore(userId: string, token: string): Promise<void> {
    try {
      const tokenRef = doc(collection(db, 'users', userId, 'fcmTokens'), token);
      
      await setDoc(tokenRef, {
        token,
        createdAt: serverTimestamp(),
        lastUsed: serverTimestamp(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
      });

      console.log('✅ FCM token saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving token to Firestore:', error);
    }
  }

  /**
   * Listen for foreground messages (when app is open)
   */
  setupForegroundMessageListener(callback: (payload: any) => void): void {
    if (!this.messaging) {
      console.log('⚠️ Messaging not initialized, skipping foreground listener');
      return;
    }

    onMessage(this.messaging, (payload) => {
      console.log('🔔 Foreground message received:', payload);
      
      // Show in-app notification or update UI
      callback(payload);

      // Note: We don't manually show notification in foreground
      // Service Worker will handle it automatically to avoid duplicates
    });
  }

  /**
   * Check if notifications are supported and permission status
   */
  async checkNotificationSupport(): Promise<{
    supported: boolean;
    permission: NotificationPermission | null;
  }> {
    if (!('Notification' in window)) {
      return { supported: false, permission: null };
    }

    return {
      supported: true,
      permission: Notification.permission,
    };
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'default';
    }
    return Notification.permission;
  }
}

export const fcmTokenService = new FCMTokenService();
