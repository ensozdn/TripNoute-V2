import { NextRequest, NextResponse } from 'next/server';
import { pushNotificationService } from '../../../../services/firebase/PushNotificationService';

export async function POST(request: NextRequest) {
  try {
    const { type, recipientId, senderName, senderPhotoUrl, senderId, postTitle, postPhotoUrl, postId, commentText, notificationId } = await request.json();

    if (!type || !recipientId) {
      return NextResponse.json(
        { error: 'type and recipientId are required' },
        { status: 400 }
      );
    }

    console.log(`📤 [API] Received ${type} push notification request:`, {
      recipientId,
      senderId,
      notificationId
    });

    let result;

    switch (type) {
      case 'follow':
        console.log('📤 [API] Calling pushNotificationService.sendFollowNotification...');
        await pushNotificationService.sendFollowNotification(
          recipientId,
          senderName,
          senderPhotoUrl,
          senderId,
          notificationId // Pass notificationId for deduplication
        );
        result = { message: 'Follow notification sent' };
        break;

      case 'like':
        console.log('📤 [API] Calling pushNotificationService.sendLikeNotification...');
        await pushNotificationService.sendLikeNotification(
          recipientId,
          senderName,
          postTitle,
          postPhotoUrl,
          postId,
          notificationId // Pass notificationId for deduplication
        );
        result = { message: 'Like notification sent' };
        break;

      case 'comment':
        console.log('📤 [API] Calling pushNotificationService.sendCommentNotification...');
        await pushNotificationService.sendCommentNotification(
          recipientId,
          senderName,
          commentText,
          postId,
          notificationId // Pass notificationId for deduplication
        );
        result = { message: 'Comment notification sent' };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown notification type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error: any) {
    console.error('❌ Error sending push notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send push notification' },
      { status: 500 }
    );
  }
}
