import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import * as serviceAccount from '../serviceAccountKey.json';

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as any),
  });
}

const db = getFirestore();
const messaging = getMessaging();

async function testPushNotification() {
  const userId = 'cq04g4tLWBQg8Dvn9AcQJ33VIiz1';
  
  console.log('🔍 Checking FCM tokens for user:', userId);
  
  // Get all FCM tokens for this user
  const tokensSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('fcmTokens')
    .get();
  
  if (tokensSnapshot.empty) {
    console.log('❌ No FCM tokens found for this user!');
    console.log('📱 Make sure you clicked "Allow" for notifications in the browser.');
    return;
  }
  
  console.log(`✅ Found ${tokensSnapshot.size} FCM token(s)`);
  
  const tokens: string[] = [];
  tokensSnapshot.forEach(doc => {
    const data = doc.data();
    console.log('Token:', doc.id.substring(0, 20) + '...');
    console.log('Created:', data.createdAt?.toDate());
    console.log('Platform:', data.platform);
    tokens.push(doc.id);
  });
  
  if (tokens.length === 0) {
    console.log('❌ No valid tokens found');
    return;
  }
  
  console.log('\n📤 Sending test push notification...');
  
  try {
    const result = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: '🧪 Test Notification',
        body: 'This is a manual test push notification from TripNoute!',
      },
      webpush: {
        notification: {
          icon: '/tripnoute-logo.png',
          badge: '/icons/icon-96x96.png',
          requireInteraction: false,
          vibrate: [200, 100, 200],
        },
        fcmOptions: {
          link: '/dashboard',
        },
      },
    });
    
    console.log('✅ Push notification sent!');
    console.log('Success count:', result.successCount);
    console.log('Failure count:', result.failureCount);
    
    if (result.failureCount > 0) {
      result.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`❌ Failed for token ${idx}:`, resp.error);
        }
      });
    }
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
  }
}

testPushNotification().then(() => {
  console.log('\n✅ Test complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
