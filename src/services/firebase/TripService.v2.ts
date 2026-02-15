/**
 * TRIP SERVICE V2 - Refactored Firebase Service
 * 
 * Atomic updates, auto-sorting, gallery management
 * Uses trip.v2.ts type definitions
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp as FirestoreTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Trip, 
  JourneyStep, 
  CreateTripInput, 
  UpdateTripInput, 
  TripStatus,
  sortStepsByDate,
  calculateTripDistance,
  calculateTripDuration,
} from '@/types/trip.v2';

export class TripServiceV2 {
  private readonly COLLECTION = 'trips';
  
  /**
   * Create a new trip with auto-sorted steps
   */
  async createTrip(input: CreateTripInput, userId: string): Promise<Trip> {
    try {
      const tripRef = doc(collection(db, this.COLLECTION));
      const tripId = tripRef.id;
      
      // Generate step IDs and orders
      const steps: JourneyStep[] = input.steps.map((step, index) => ({
        ...step,
        id: `${tripId}-step-${index}-${Date.now()}`,
        order: index,
      }));
      
      // Sort by arrival date
      const sortedSteps = sortStepsByDate(steps);
      
      // Recalculate orders after sorting
      const orderedSteps = sortedSteps.map((step, index) => ({
        ...step,
        order: index,
      }));
      
      // Calculate distances and durations
      const enrichedSteps = this.calculateStepMetrics(orderedSteps);
      
      // Calculate trip totals
      const totalDistance = calculateTripDistance(enrichedSteps);
      const totalDuration = calculateTripDuration(enrichedSteps);
      
      // Prepare trip data
      const now = serverTimestamp();
      const startDate = input.startDate
        ? FirestoreTimestamp.fromDate(input.startDate)
        : FirestoreTimestamp.fromDate(enrichedSteps[0].arrivalDate);
      
      const lastStep = enrichedSteps[enrichedSteps.length - 1];
      const endDate = input.endDate
        ? FirestoreTimestamp.fromDate(input.endDate)
        : FirestoreTimestamp.fromDate(lastStep.departureDate || lastStep.arrivalDate);
      
      const tripData: Omit<Trip, 'createdAt' | 'updatedAt' | 'startDate' | 'endDate'> & {
        startDate: any;
        endDate: any;
        createdAt: any;
        updatedAt: any;
      } = {
        id: tripId,
        userId,
        name: input.name,
        description: input.description,
        color: input.color,
        status: input.status,
        steps: enrichedSteps,
        startDate,
        endDate,
        totalDistance,
        totalDuration,
        isPublic: input.isPublic,
        tags: input.tags || [],
        coverPhotoUrl: undefined,
        createdAt: now,
        updatedAt: now,
      };
      
      // Atomic write
      await setDoc(tripRef, tripData);
      
      console.log('✅ Trip created:', tripId);
      
      return tripData as Trip;
    } catch (error) {
      console.error('❌ Error creating trip:', error);
      throw this.handleError(error, 'Failed to create trip');
    }
  }
  
  /**
   * Get trip by ID with sorted steps
   */
  async getTripById(tripId: string): Promise<Trip | null> {
    try {
      const tripDoc = await getDoc(doc(db, this.COLLECTION, tripId));
      
      if (!tripDoc.exists()) {
        return null;
      }
      
      const trip = tripDoc.data() as Trip;
      
      // Ensure steps are sorted
      trip.steps = sortStepsByDate(trip.steps);
      
      return trip;
    } catch (error) {
      console.error('❌ Error getting trip:', error);
      throw this.handleError(error, 'Failed to get trip');
    }
  }
  
  /**
   * Get all trips for a user
   */
  async getUserTrips(userId: string): Promise<Trip[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      const trips: Trip[] = snapshot.docs.map((doc) => {
        const trip = doc.data() as Trip;
        // Ensure steps are sorted
        trip.steps = sortStepsByDate(trip.steps);
        return trip;
      });
      
      console.log(`✅ Loaded ${trips.length} trips for user ${userId}`);
      
      return trips;
    } catch (error) {
      console.error('❌ Error getting user trips:', error);
      throw this.handleError(error, 'Failed to get user trips');
    }
  }
  
  /**
   * Update trip with atomic operation
   */
  async updateTrip(input: UpdateTripInput): Promise<Trip> {
    try {
      const tripRef = doc(db, this.COLLECTION, input.id);
      const tripDoc = await getDoc(tripRef);
      
      if (!tripDoc.exists()) {
        throw new Error('Trip not found');
      }
      
      // Prepare update data
      const updateData: any = {
        updatedAt: serverTimestamp(),
      };
      
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.color !== undefined) updateData.color = input.color;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.coverPhotoUrl !== undefined) updateData.coverPhotoUrl = input.coverPhotoUrl;
      
      // Handle steps update
      if (input.steps !== undefined) {
        const sortedSteps = sortStepsByDate(input.steps);
        const orderedSteps = sortedSteps.map((step, index) => ({
          ...step,
          order: index,
        }));
        const enrichedSteps = this.calculateStepMetrics(orderedSteps);
        
        updateData.steps = enrichedSteps;
        updateData.totalDistance = calculateTripDistance(enrichedSteps);
        updateData.totalDuration = calculateTripDuration(enrichedSteps);
      }
      
      // Handle dates
      if (input.startDate !== undefined) {
        updateData.startDate = FirestoreTimestamp.fromDate(input.startDate);
      }
      if (input.endDate !== undefined) {
        updateData.endDate = FirestoreTimestamp.fromDate(input.endDate);
      }
      
      // Atomic update
      await updateDoc(tripRef, updateData);
      
      console.log('✅ Trip updated:', input.id);
      
      // Return updated trip
      return this.getTripById(input.id) as Promise<Trip>;
    } catch (error) {
      console.error('❌ Error updating trip:', error);
      throw this.handleError(error, 'Failed to update trip');
    }
  }
  
  /**
   * Add a new step to existing trip
   */
  async addStepToTrip(
    tripId: string, 
    step: Omit<JourneyStep, 'id' | 'order'>
  ): Promise<Trip> {
    try {
      const trip = await this.getTripById(tripId);
      
      if (!trip) {
        throw new Error('Trip not found');
      }
      
      // Create new step
      const newStep: JourneyStep = {
        ...step,
        id: `${tripId}-step-${trip.steps.length}-${Date.now()}`,
        order: trip.steps.length,
      };
      
      // Add and sort
      const updatedSteps = [...trip.steps, newStep];
      
      // Update trip
      return this.updateTrip({
        id: tripId,
        steps: updatedSteps,
      });
    } catch (error) {
      console.error('❌ Error adding step:', error);
      throw this.handleError(error, 'Failed to add step');
    }
  }
  
  /**
   * Remove a step from trip
   */
  async removeStepFromTrip(tripId: string, stepId: string): Promise<Trip> {
    try {
      const trip = await this.getTripById(tripId);
      
      if (!trip) {
        throw new Error('Trip not found');
      }
      
      const updatedSteps = trip.steps.filter((s) => s.id !== stepId);
      
      if (updatedSteps.length === 0) {
        throw new Error('Cannot remove last step. Delete trip instead.');
      }
      
      return this.updateTrip({
        id: tripId,
        steps: updatedSteps,
      });
    } catch (error) {
      console.error('❌ Error removing step:', error);
      throw this.handleError(error, 'Failed to remove step');
    }
  }
  
  /**
   * Update trip status
   */
  async updateTripStatus(tripId: string, status: TripStatus): Promise<void> {
    try {
      const tripRef = doc(db, this.COLLECTION, tripId);
      
      await updateDoc(tripRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      
      console.log(`✅ Trip status updated: ${tripId} → ${status}`);
    } catch (error) {
      console.error('❌ Error updating trip status:', error);
      throw this.handleError(error, 'Failed to update trip status');
    }
  }
  
  /**
   * Delete trip
   */
  async deleteTrip(tripId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION, tripId));
      console.log('✅ Trip deleted:', tripId);
    } catch (error) {
      console.error('❌ Error deleting trip:', error);
      throw this.handleError(error, 'Failed to delete trip');
    }
  }
  
  /**
   * Add photos to step gallery
   */
  async addPhotosToStep(
    tripId: string, 
    stepId: string, 
    photoUrls: string[]
  ): Promise<Trip> {
    try {
      const trip = await this.getTripById(tripId);
      
      if (!trip) {
        throw new Error('Trip not found');
      }
      
      const updatedSteps = trip.steps.map((step) => {
        if (step.id === stepId) {
          return {
            ...step,
            gallery: [...step.gallery, ...photoUrls],
          };
        }
        return step;
      });
      
      return this.updateTrip({
        id: tripId,
        steps: updatedSteps,
      });
    } catch (error) {
      console.error('❌ Error adding photos:', error);
      throw this.handleError(error, 'Failed to add photos');
    }
  }
  
  /**
   * Calculate step metrics (distance, duration)
   */
  private calculateStepMetrics(steps: JourneyStep[]): JourneyStep[] {
    return steps.map((step, index) => {
      if (index === steps.length - 1) {
        // Last step has no next
        return {
          ...step,
          distanceToNext: undefined,
          durationToNext: undefined,
        };
      }
      
      const nextStep = steps[index + 1];
      const distance = this.haversineDistance(step.location, nextStep.location);
      
      // Calculate duration based on arrival times
      const duration = nextStep.arrivalDate && step.departureDate
        ? (new Date(nextStep.arrivalDate).getTime() - new Date(step.departureDate).getTime()) / 60000
        : undefined;
      
      return {
        ...step,
        distanceToNext: Math.round(distance * 100) / 100,
        durationToNext: duration ? Math.round(duration) : undefined,
      };
    });
  }
  
  /**
   * Haversine distance calculation
   */
  private haversineDistance(from: [number, number], to: [number, number]): number {
    const R = 6371; // Earth radius in km
    const [lon1, lat1] = from;
    const [lon2, lat2] = to;
    
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }
  
  /**
   * Error handler
   */
  private handleError(error: unknown, defaultMessage: string): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(defaultMessage);
  }
}

// Export singleton instance
export const tripServiceV2 = new TripServiceV2();
