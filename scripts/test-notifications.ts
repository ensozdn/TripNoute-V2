/**
 * Test script to create sample notifications
 * Usage: npx tsx scripts/test-notifications.ts <your-user-id>
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createTestNotifications(recipientId: string) {
  console.log('🔔 Creating test notifications for user:', recipientId);

  try {
    // 1. Follow notification
    const followNotif = await addDoc(collection(db, 'notifications'), {
      recipientId,
      senderId: 'test-user-1',
      senderName: 'Ali Yılmaz',
      senderPhotoUrl: 'https://i.pravatar.cc/150?img=1',
      type: 'follow',
      isRead: false,
      createdAt: serverTimestamp(),
    });
    console.log('✅ Follow notification created:', followNotif.id);

    // 2. Like notification (from 2 hours ago)
    const twoHoursAgo = new Date();
    twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);
    
    const likeNotif = await addDoc(collection(db, 'notifications'), {
      recipientId,
      senderId: 'test-user-2',
      senderName: 'Ayşe Demir',
      senderPhotoUrl: 'https://i.pravatar.cc/150?img=2',
      type: 'like',
      postId: 'test-post-1',
      text: 'Amazing view from Cappadocia!',
      photoUrl: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400',
      isRead: false,
      createdAt: twoHoursAgo,
    });
    console.log('✅ Like notification created:', likeNotif.id);

    // 3. Comment notification (from yesterday)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const commentNotif = await addDoc(collection(db, 'notifications'), {
      recipientId,
      senderId: 'test-user-3',
      senderName: 'Mehmet Can',
      senderPhotoUrl: 'https://i.pravatar.cc/150?img=3',
      type: 'comment',
      postId: 'test-post-2',
      commentId: 'test-comment-1',
      text: 'I was there last summer! Great spot 🌊',
      photoUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=400',
      isRead: false,
      createdAt: yesterday,
    });
    console.log('✅ Comment notification created:', commentNotif.id);

    // 4. Trip start notification (from 3 days ago)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    const tripNotif = await addDoc(collection(db, 'notifications'), {
      recipientId,
      senderId: 'test-user-4',
      senderName: 'Zeynep Aydın',
      senderPhotoUrl: 'https://i.pravatar.cc/150?img=4',
      type: 'trip_start',
      tripId: 'test-trip-1',
      text: 'Balkan Road Trip',
      photoUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400',
      isRead: true,
      createdAt: threeDaysAgo,
    });
    console.log('✅ Trip start notification created:', tripNotif.id);

    // 5. Milestone notification (from 1 week ago)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const milestoneNotif = await addDoc(collection(db, 'notifications'), {
      recipientId,
      senderId: 'test-user-5',
      senderName: 'Burak Özkan',
      senderPhotoUrl: 'https://i.pravatar.cc/150?img=5',
      type: 'milestone',
      tripId: 'test-trip-2',
      medallionId: 'test-medallion-1',
      text: 'Reached the summit of Mount Olympus!',
      photoUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      isRead: true,
      createdAt: weekAgo,
    });
    console.log('✅ Milestone notification created:', milestoneNotif.id);

    console.log('\n🎉 All test notifications created successfully!');
    console.log('📱 Refresh your app to see them in the Notifications tab\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating notifications:', error);
    process.exit(1);
  }
}

// Get user ID from command line
const recipientId = process.argv[2];

if (!recipientId) {
  console.error('❌ Usage: npx tsx scripts/test-notifications.ts <your-user-id>');
  console.log('\n💡 You can find your user ID in the browser console:');
  console.log('   Open DevTools → Console → Type: firebase.auth().currentUser.uid\n');
  process.exit(1);
}

createTestNotifications(recipientId);
