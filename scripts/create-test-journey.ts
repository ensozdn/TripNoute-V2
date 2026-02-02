/**
 * Create Test Journey Script
 * Run: npx tsx scripts/create-test-journey.ts YOUR_USER_ID
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase config (from your .env or firebase.ts)
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

async function createTestJourney(userId: string) {
  try {
    const journeyRef = doc(collection(db, 'journeys'));
    const journeyId = journeyRef.id;

    const testJourney = {
      id: journeyId,
      userId: userId,
      name: '🌍 European + US Adventure',
      description: 'Testing medallion transport icons (flight, train, car)',
      color: '#FF6B6B',
      isPublic: true,
      tags: ['test', 'medallions'],
      steps: [
        {
          id: `${journeyId}-step-0-${Date.now()}`,
          name: 'Istanbul, Turkey',
          coordinates: [28.9784, 41.0082],
          order: 0,
          transportToNext: 'flight',
          timestamp: Date.now(),
          notes: 'Starting point - Turkish Airlines flight',
        },
        {
          id: `${journeyId}-step-1-${Date.now()}`,
          name: 'Paris, France',
          coordinates: [2.3522, 48.8566],
          order: 1,
          transportToNext: 'train',
          timestamp: Date.now() + 1000,
          notes: 'Eurostar to London',
          distanceToNext: 344,
        },
        {
          id: `${journeyId}-step-2-${Date.now()}`,
          name: 'London, UK',
          coordinates: [-0.1276, 51.5074],
          order: 2,
          transportToNext: 'flight',
          timestamp: Date.now() + 2000,
          notes: 'British Airways flight to NYC',
          distanceToNext: 5570,
        },
        {
          id: `${journeyId}-step-3-${Date.now()}`,
          name: 'New York, USA',
          coordinates: [-74.0060, 40.7128],
          order: 3,
          transportToNext: null,
          timestamp: Date.now() + 3000,
          notes: 'Final destination',
        },
      ],
      totalDistance: 7800,
      totalDuration: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(journeyRef, testJourney);

    console.log('✅ Test journey created successfully!');
    console.log('Journey ID:', journeyId);
    console.log('📍 Route: Istanbul → Paris → London → NYC');
    console.log('🎨 Medallions: ✈️ flight, 🚆 train, ✈️ flight');
    console.log('\n🔄 Reload dashboard to see medallions!');

  } catch (error) {
    console.error('❌ Error creating journey:', error);
  }
}

const userId = process.argv[2];
if (!userId) {
  console.error('❌ Please provide user ID as argument');
  console.log('Usage: npx tsx scripts/create-test-journey.ts YOUR_USER_ID');
  process.exit(1);
}

createTestJourney(userId);
