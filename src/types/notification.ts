import { Timestamp } from 'firebase/firestore';

export type NotificationType = 
  | 'follow'
  | 'like'
  | 'comment'
  | 'mention'
  | 'trip_start'
  | 'milestone';

export interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderPhotoUrl?: string;
  type: NotificationType;
  postId?: string;
  commentId?: string;
  tripId?: string;
  medallionId?: string;
  text?: string;
  photoUrl?: string;
  isRead: boolean;
  createdAt: Timestamp;
}
