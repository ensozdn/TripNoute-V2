import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log('🔔 Creating test notifications for:', userId);

    const notifications: Array<{ type: string; id: string }> = [];

    // 1. Follow notification
    const followData = {
      recipientId: userId,
      senderId: 'test-user-1',
      senderName: 'Ali Yılmaz',
      senderPhotoUrl: 'https://i.pravatar.cc/150?img=1',
      type: 'follow',
      isRead: false,
      createdAt: serverTimestamp(),
    };
    console.log('Creating follow notification with data:', followData);
    const follow = await addDoc(collection(db, 'notifications'), followData);
    notifications.push({ type: 'follow', id: follow.id });
    console.log('✅ Follow notification created:', follow.id);

    // 2. Like notification
    const like = await addDoc(collection(db, 'notifications'), {
      recipientId: userId,
      senderId: 'test-user-2',
      senderName: 'Ayşe Demir',
      senderPhotoUrl: 'https://i.pravatar.cc/150?img=2',
      type: 'like',
      postId: 'test-post-1',
      text: 'Amazing view from Cappadocia!',
      photoUrl: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400',
      isRead: false,
      createdAt: serverTimestamp(),
    });
    notifications.push({ type: 'like', id: like.id });

    // 3. Comment notification
    const comment = await addDoc(collection(db, 'notifications'), {
      recipientId: userId,
      senderId: 'test-user-3',
      senderName: 'Mehmet Can',
      senderPhotoUrl: 'https://i.pravatar.cc/150?img=3',
      type: 'comment',
      postId: 'test-post-2',
      commentId: 'test-comment-1',
      text: 'I was there last summer! Great spot 🌊',
      photoUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400',
      isRead: false,
      createdAt: serverTimestamp(),
    });
    notifications.push({ type: 'comment', id: comment.id });

    // 4. Trip start (read)
    const trip = await addDoc(collection(db, 'notifications'), {
      recipientId: userId,
      senderId: 'test-user-4',
      senderName: 'Zeynep Aydın',
      senderPhotoUrl: 'https://i.pravatar.cc/150?img=4',
      type: 'trip_start',
      tripId: 'test-trip-1',
      text: 'Balkan Road Trip',
      photoUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400',
      isRead: true,
      createdAt: serverTimestamp(),
    });
    notifications.push({ type: 'trip_start', id: trip.id });

    // 5. Milestone (read)
    const milestone = await addDoc(collection(db, 'notifications'), {
      recipientId: userId,
      senderId: 'test-user-5',
      senderName: 'Burak Özkan',
      senderPhotoUrl: 'https://i.pravatar.cc/150?img=5',
      type: 'milestone',
      tripId: 'test-trip-2',
      medallionId: 'test-medallion-1',
      text: 'Reached the summit of Mount Olympus!',
      photoUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      isRead: true,
      createdAt: serverTimestamp(),
    });
    notifications.push({ type: 'milestone', id: milestone.id });

    return NextResponse.json({
      success: true,
      count: notifications.length,
      notifications,
      message: '5 test notifications created successfully!',
    });

  } catch (error: any) {
    console.error('Error creating notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create notifications' },
      { status: 500 }
    );
  }
}
