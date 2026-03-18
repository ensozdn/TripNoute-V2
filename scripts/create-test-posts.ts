/**
 * Test script to create sample posts from existing places
 * Run: npx tsx scripts/create-test-posts.ts
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBsIRIBq5Xw8PpPVfs5I1Qv1MdvPB5m_HI",
  authDomain: "trip-noute.firebaseapp.com",
  projectId: "trip-noute",
  storageBucket: "trip-noute.firebasestorage.app",
  messagingSenderId: "670419599620",
  appId: "1:670419599620:web:14bdcf5f609858d8c8d051",
};

console.log('🔧 Firebase initialized for project:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Simplified post creation (without importing ExploreService)
async function createPostFromPlace(
  placeId: string,
  placeTitle: string,
  placeDescription: string,
  placePhotos: any[],
  placeLocation: any,
  placeAddress: any,
  userId: string,
  userName: string,
  userPhotoUrl?: string,
  caption?: string
) {
  const postsCollection = collection(db, 'posts');
  const postRef = doc(postsCollection);
  
  const post = {
    userId,
    userName,
    userPhotoUrl: userPhotoUrl || null,
    type: 'place',
    contentId: placeId,
    title: placeTitle,
    description: placeDescription,
    caption: caption || undefined,
    photoUrls: placePhotos.map((p: any) => p.url),
    location: placeAddress.country ? {
      city: placeAddress.city,
      country: placeAddress.country,
      countryCode: placeAddress.countryCode,
      coordinates: placeLocation,
    } : undefined,
    likesCount: 0,
    commentsCount: 0,
    savesCount: 0,
    isPublic: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(postRef, post);
  return postRef.id;
}

async function createTestPosts() {
  console.log('🚀 Creating test posts from existing places...\n');

  // Known user data from your system
  const testUsers = [
    {
      uid: 'K8b7HXLjZdPSJ5Lk1o7lKzRo6YD3', // Adjust to actual UIDs
      displayName: 'enes özden',
      photoURL: null,
    },
    {
      uid: 'test_user_1',
      displayName: 'Melike Kurt',
      photoURL: null,
    },
    {
      uid: 'test_user_2', 
      displayName: 'Osman Ozden',
      photoURL: null,
    },
  ];

  try {
    for (const user of testUsers) {
      console.log(`📍 Processing user: ${user.displayName}`);
      
      // Create sample posts for each user
      const samplePosts = [
        {
          title: 'Amazing Istanbul Experience',
          description: 'Explored the beautiful Bosphorus and historic Sultanahmet district. The blend of European and Asian cultures is incredible!',
          photoUrls: ['https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&h=400&fit=crop'],
          location: { lat: 41.0082, lng: 28.9784 },
          address: { city: 'Istanbul', country: 'Turkey', countryCode: 'TR' },
        },
        {
          title: 'Paris Adventure',
          description: 'Visited the iconic Eiffel Tower and walked along the Seine. The city of lights truly lives up to its name!',
          photoUrls: ['https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=400&fit=crop'],
          location: { lat: 48.8566, lng: 2.3522 },
          address: { city: 'Paris', country: 'France', countryCode: 'FR' },
        },
        {
          title: 'Tokyo Discovery',
          description: 'Experience the bustling streets of Shibuya and peaceful temples. Modern and traditional Japan in perfect harmony.',
          photoUrls: ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=400&fit=crop'],
          location: { lat: 35.6762, lng: 139.6503 },
          address: { city: 'Tokyo', country: 'Japan', countryCode: 'JP' },
        },
      ];

      // Create posts
      for (const [index, postData] of samplePosts.entries()) {
        try {
          const postId = await createPostFromPlace(
            `place_${user.uid}_${index}`, // fake place ID
            postData.title,
            postData.description,
            postData.photoUrls.map(url => ({ url })),
            postData.location,
            postData.address,
            user.uid,
            user.displayName,
            user.photoURL || undefined,
            `${postData.description.slice(0, 50)}... 🌍✨`
          );
          
          console.log(`  ✅ Created post: ${postId} for ${postData.title}`);
        } catch (error: any) {
          console.log(`  ❌ Failed to create post for ${postData.title}: ${error.message}`);
        }
      }
      
      console.log('');
    }

    console.log('✅ Test posts created successfully!');
  } catch (error) {
    console.error('❌ Error creating test posts:', error);
  }
}

createTestPosts();
