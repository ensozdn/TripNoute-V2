import { Timestamp } from './index';

/**
 * Notification Types
 */
export type NotificationType = 
  | 'follow'        // Someone followed you
  | 'like'          // Someone liked your post
  | 'comment'       // Someone commented on your post
  | 'mention'       // Someone mentioned you in a post
  | 'trip_start'    // Someone you follow started a journey
  | 'milestone';    // Someone you follow captured a medallion

/**
 * Notification Document
 */
export interface Notification {
  id: string;
  recipientId: string;        // User who receives this notification
  senderId: string;           // User who triggered this notification
  senderName: string;
  senderPhotoUrl?: string;
  
  type: NotificationType;
  
  // Content references (vary by type)
  postId?: string;            // For like, comment, mention
  commentId?: string;         // For comment
  tripId?: string;            // For trip_start, milestone
  medallionId?: string;       // For milestone
  
  // Display metadata
  text?: string;              // Comment text, caption excerpt, etc.
  photoUrl?: string;          // Preview image for post/trip
  
  // State
  isRead: boolean;
  createdAt: Timestamp;
}

/**
 * Grouped notification for display
 */
export interface GroupedNotification {
  type: NotificationType;
  senders: Array<{
    id: string;
    name: string;
    photoUrl?: string;
  }>;
  count: number;
  text?: string;
  photoUrl?: string;
  postId?: string;
  tripId?: string;
  isRead: boolean;
  latestTime: Timestamp;
}

/**
 * Notification query options
 */
export interface NotificationQueryOptions {
  limit?: number;
  cursor?: string;        // Last notification ID for pagination
  unreadOnly?: boolean;   // Only fetch unread notifications
}

/**
 * Time-grouped notifications
 */
export interface TimeGroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  thisWeek: Notification[];
  earlier: Notification[];
}
