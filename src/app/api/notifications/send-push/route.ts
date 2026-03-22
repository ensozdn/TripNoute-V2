import { NextRequest, NextResponse } from 'next/server';
import { pushNotificationService } from '../../../../services/firebase/PushNotificationService';

export async function POST(request: NextRequest) {
  try {
    const { type, recipientId, senderName, senderPhotoUrl, senderId, postTitle, postPhotoUrl, postId, commentText } = await request.json();

    if (!type || !recipientId) {
      return NextResponse.json(
        { error: 'type and recipientId are required' },
        { status: 400 }
      );
    }

    console.log(`📤 Sending ${type} push notification to user: ${recipientId}`);

    let result;

    switch (type) {
      case 'follow':
        await pushNotificationService.sendFollowNotification(
          recipientId,
          senderName,
          senderPhotoUrl,
          senderId
        );
        result = { message: 'Follow notification sent' };
        break;

      case 'like':
        await pushNotificationService.sendLikeNotification(
          recipientId,
          senderName,
          postTitle,
          postPhotoUrl,
          postId
        );
        result = { message: 'Like notification sent' };
        break;

      case 'comment':
        await pushNotificationService.sendCommentNotification(
          recipientId,
          senderName,
          commentText,
          postId
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
