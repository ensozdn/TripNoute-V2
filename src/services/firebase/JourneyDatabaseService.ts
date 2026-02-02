/**
 * TripNoute V2 - Journey/Trip Database Service
 * 
 * Handles Firebase CRUD operations for trips/journeys.
 * Implements trip isolation and linear chain validation.
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
  serverTimestamp,
  Timestamp as FirestoreTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trip, JourneyStep, CreateTripInput, UpdateTripInput } from '@/types/trip';
import { validateStepChain } from '@/utils/tripIsolation';

// Backward compatibility - Journey is now Trip
export type Journey = Trip;
export type CreateJourneyInput = CreateTripInput;
export type UpdateJourneyInput = UpdateTripInput;

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return defaultMessage;
};

const removeUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = removeUndefined(value);
      }
      return acc;
    }, {} as any);
  }
  return obj;
};

const calculateDistance = (from: [number, number], to: [number, number]): number => {
  const R = 6371;
  const dLat = (to[1] - from[1]) * Math.PI / 180;
  const dLon = (to[0] - from[0]) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(from[1] * Math.PI / 180) * Math.cos(to[1] * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export class JourneyDatabaseService {
  private readonly COLLECTION = 'journeys';

  async createJourney(input: CreateJourneyInput, userId: string): Promise<Journey> {
    try {
      const journeyRef = doc(collection(db, this.COLLECTION));
      const journeyId = journeyRef.id;

      const steps: JourneyStep[] = input.steps.map((step, index) => ({
        ...step,
        id: `${journeyId}-step-${index}-${Date.now()}`,
        timestamp: Date.now() + index,
        order: index,
      }));

      // Normalize and validate step chain
      const normalizedSteps = validateStepChain(steps);
      
      // Additional validation (will throw if errors found)
      // Note: validateStepChain already fixes most issues, but we can add extra checks here
      if (normalizedSteps.length === 0) {
        throw new Error('Journey must have at least one step');
      }

      let totalDistance = 0;
      let totalDuration = 0;

      for (let i = 0; i < normalizedSteps.length - 1; i++) {
        const current = normalizedSteps[i];
        const next = normalizedSteps[i + 1];
        
        const distance = calculateDistance(current.coordinates, next.coordinates);
        current.distanceToNext = Math.round(distance * 100) / 100;
        totalDistance += current.distanceToNext;

        if (current.durationToNext) {
          totalDuration += current.durationToNext;
        }
      }

      const startDate = input.startDate
        ? FirestoreTimestamp.fromDate(input.startDate)
        : FirestoreTimestamp.fromMillis(normalizedSteps[0].timestamp);
      
      const endDate = input.endDate
        ? FirestoreTimestamp.fromDate(input.endDate)
        : FirestoreTimestamp.fromMillis(normalizedSteps[normalizedSteps.length - 1].timestamp);

      const journeyData: Omit<Journey, 'id'> = {
        userId,
        name: input.name,
        description: input.description || '',
        color: input.color,
        steps: normalizedSteps,
        startDate: startDate as any,
        endDate: endDate as any,
        isPublic: input.isPublic,
        tags: input.tags || [],
        totalDistance: Math.round(totalDistance * 100) / 100,
        totalDuration,
        coverPhotoUrl: undefined,
        createdAt: serverTimestamp() as any,
        updatedAt: serverTimestamp() as any,
      };

      const cleanData = removeUndefined(journeyData);
      
      await setDoc(journeyRef, cleanData);
      
      const createdJourney = await this.getJourneyById(journeyId);
      if (!createdJourney) {
        throw new Error('Failed to retrieve created journey');
      }

      return createdJourney;
    } catch (error: unknown) {
      throw new Error(`Failed to create journey: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }

  async getJourneyById(journeyId: string): Promise<Journey | null> {
    try {
      const journeyRef = doc(db, this.COLLECTION, journeyId);
      const journeyDoc = await getDoc(journeyRef);

      if (!journeyDoc.exists()) {
        return null;
      }

      const data = journeyDoc.data();
      return {
        id: journeyDoc.id,
        ...data,
        steps: data.steps || [],
      } as Journey;
    } catch (error: unknown) {
      throw new Error(`Failed to get journey: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }

  async getUserJourneys(userId: string): Promise<Journey[]> {
    try {
      const journeysRef = collection(db, this.COLLECTION);
      const q = query(journeysRef, where('userId', '==', userId));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          steps: data.steps || [],
        } as Journey;
      });
    } catch (error: unknown) {
      throw new Error(`Failed to get user journeys: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }

  async updateJourney(input: UpdateJourneyInput): Promise<Journey> {
    try {
      const journeyRef = doc(db, this.COLLECTION, input.id);

      const updateData: any = {
        updatedAt: serverTimestamp(),
      };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.color !== undefined) updateData.color = input.color;
      if (input.isPublic !== undefined) updateData.isPublic = input.isPublic;
      if (input.tags !== undefined) updateData.tags = input.tags;

      if (input.startDate) {
        updateData.startDate = FirestoreTimestamp.fromDate(input.startDate);
      }
      if (input.endDate) {
        updateData.endDate = FirestoreTimestamp.fromDate(input.endDate);
      }

      if (input.steps) {
        // Normalize and validate step chain
        const normalizedSteps = validateStepChain(input.steps);
        
        if (normalizedSteps.length === 0) {
          throw new Error('Journey must have at least one step');
        }
        
        updateData.steps = normalizedSteps;

        let totalDistance = 0;
        let totalDuration = 0;

        for (let i = 0; i < normalizedSteps.length - 1; i++) {
          const current = normalizedSteps[i];
          const next = normalizedSteps[i + 1];
          
          const distance = calculateDistance(current.coordinates, next.coordinates);
          current.distanceToNext = Math.round(distance * 100) / 100;
          totalDistance += current.distanceToNext;

          if (current.durationToNext) {
            totalDuration += current.durationToNext;
          }
        }

        updateData.totalDistance = Math.round(totalDistance * 100) / 100;
        updateData.totalDuration = totalDuration;
      }

      await updateDoc(journeyRef, updateData);

      const updatedJourney = await this.getJourneyById(input.id);
      if (!updatedJourney) {
        throw new Error('Journey not found after update');
      }

      return updatedJourney;
    } catch (error: unknown) {
      throw new Error(`Failed to update journey: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }

  async deleteJourney(journeyId: string): Promise<void> {
    try {
      const journeyRef = doc(db, this.COLLECTION, journeyId);
      await deleteDoc(journeyRef);
    } catch (error: unknown) {
      throw new Error(`Failed to delete journey: ${getErrorMessage(error, 'Unknown error')}`);
    }
  }
}

export const journeyDatabaseService = new JourneyDatabaseService();
