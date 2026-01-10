/**
 * TripNoute v2 - Database Service Instance
 * 
 * Singleton instance of FirebaseDatabaseService for use across the app.
 */

import { FirebaseDatabaseService } from '@/services/firebase/FirebaseDatabaseService';

// Create singleton instance
export const databaseService = new FirebaseDatabaseService();
