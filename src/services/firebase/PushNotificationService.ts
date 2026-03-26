import { getAdminFirestore } from '@/lib/firebaseAdmin';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirebaseAdmin } from '@/lib/firebaseAdmin';

export interface PushNotificationPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  icon?: string;
}

export class PushNotificationService {
  /**
   * Send push notification to a specific user
   */
  async sendToUser(payload: PushNotificationPayload): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
  }> {
    try {
      const db = getAdminFirestore();
      const admin = getFirebaseAdmin();
      const messaging = getMessaging(admin);

      // Get user's FCM tokens
      const tokensSnapshot = await db
        .collection('users')
        .doc(payload.userId)
        .collection('fcmTokens')
        .get();

      if (tokensSnapshot.empty) {
        console.log(`⚠️ No FCM tokens found for user: ${payload.userId}`);
        return { success: false, sentCount: 0, failedCount: 0 };
      }

      const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);
      console.log(`📤 [PushService] Found ${tokens.length} token(s) for user ${payload.userId}:`, 
        tokens.map(t => t.substring(0, 20) + '...')
      );

      // CRITICAL: Check for duplicate tokens (should not happen, but just in case)
      const uniqueTokens = [...new Set(tokens)];
      if (uniqueTokens.length < tokens.length) {
        console.warn(`⚠️ [PushService] Found ${tokens.length - uniqueTokens.length} duplicate token(s), using unique set`);
      }

      // CRITICAL: FCM data payload must have ALL STRING VALUES
      // Convert all data values to strings
      const dataPayload: Record<string, string> = {};
      if (payload.data) {
        Object.keys(payload.data).forEach(key => {
          dataPayload[key] = String(payload.data![key]);
        });
      }
      // Add icon to data payload (Service Worker will use it)
      dataPayload.icon = payload.icon || '/tripnoute-logo.png';

      console.log(`📤 [PushService] Data payload:`, dataPayload);

      // Prepare the message
      const message = {
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: dataPayload, // All strings!
        webpush: {
          fcmOptions: {
            link: '/dashboard',
          },
        },
      };

      // Send to multiple tokens (use unique tokens only)
      const promises = uniqueTokens.map(async (token, index) => {
        try {
          console.log(`📤 [PushService] Sending to token ${index + 1}/${uniqueTokens.length}: ${token.substring(0, 20)}...`);
          
          await messaging.send({
            ...message,
            token,
          });
          
          console.log(`✅ [PushService] Successfully sent to token ${index + 1}`);
          return { success: true };
        } catch (error: any) {
          console.error(`❌ [PushService] Failed to send to token ${token.substring(0, 20)}:`, error.code, error.message);
          
          // Remove invalid tokens
          if (
            error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered'
          ) {
            await db
              .collection('users')
              .doc(payload.userId)
              .collection('fcmTokens')
              .doc(token)
              .delete();
            console.log(`🗑️ Removed invalid token: ${token.substring(0, 20)}`);
          }
          
          return { success: false };
        }
      });

      const results = await Promise.all(promises);
      const sentCount = results.filter((r) => r.success).length;
      const failedCount = results.length - sentCount;

      console.log(`✅ Push notifications sent: ${sentCount}/${results.length}`);

      return {
        success: sentCount > 0,
        sentCount,
        failedCount,
      };
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      return { success: false, sentCount: 0, failedCount: 0 };
    }
  }

  /**
   * Send follow notification
   */
  async sendFollowNotification(
    recipientId: string,
    senderName: string,
    senderPhotoUrl?: string,
    senderId?: string,
    notificationId?: string
  ): Promise<void> {
    // FIXED: Use provided notificationId for deduplication
    const stableId = notificationId || `follow_${senderId}_${recipientId}`;
    
    console.log(`📤 [PushService] Sending follow notification:`, {
      recipientId,
      senderName,
      notificationId: stableId
    });
    
    await this.sendToUser({
      userId: recipientId,
      title: 'New Follower',
      body: `${senderName} started following you`,
      icon: senderPhotoUrl,
      data: {
        type: 'follow',
        senderId: senderId || '',
        notificationId: stableId, // Stable ID for deduplication
      },
    });
  }

  /**
   * Send like notification
   */
  async sendLikeNotification(
    recipientId: string,
    senderName: string,
    postTitle: string,
    postPhotoUrl?: string,
    postId?: string,
    notificationId?: string
  ): Promise<void> {
    // FIXED: Use stable ID for deduplication
    const stableId = notificationId || `like_${postId}_${Date.now()}`;
    
    await this.sendToUser({
      userId: recipientId,
      title: 'New Like',
      body: `${senderName} liked your post: ${postTitle}`,
      icon: postPhotoUrl,
      data: {
        type: 'like',
        postId: postId || '',
        notificationId: stableId,
      },
    });
  }

  /**
   * Send comment notification
   */
  async sendCommentNotification(
    recipientId: string,
    senderName: string,
    commentText: string,
    postId?: string,
    notificationId?: string
  ): Promise<void> {
    // FIXED: Use stable ID for deduplication
    const stableId = notificationId || `comment_${postId}_${Date.now()}`;
    
    await this.sendToUser({
      userId: recipientId,
      title: 'New Comment',
      body: `${senderName}: ${commentText}`,
      data: {
        type: 'comment',
        postId: postId || '',
        notificationId: stableId,
      },
    });
  }
}

export const pushNotificationService = new PushNotificationService();
