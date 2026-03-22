import * as admin from 'firebase-admin';

// Singleton instance
let app: admin.app.App | null = null;

export function getFirebaseAdmin() {
  if (!app) {
    try {
      // Initialize Firebase Admin SDK
      const serviceAccount = require('../../serviceAccountKey.json');
      
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      
      console.log('✅ Firebase Admin SDK initialized');
    } catch (error: any) {
      // Already initialized
      if (error.code === 'app/duplicate-app') {
        app = admin.app();
      } else {
        console.error('❌ Firebase Admin initialization error:', error);
        throw error;
      }
    }
  }
  
  return app;
}

export function getAdminFirestore() {
  const app = getFirebaseAdmin();
  return app.firestore();
}
