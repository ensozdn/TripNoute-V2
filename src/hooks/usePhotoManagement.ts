/**
 * TripNoute v2 - Photo Management Hook
 * 
 * Custom React hook for managing photo operations.
 * Single Responsibility: UI logic for photo management.
 * Separates business logic from UI components.
 */

import { useState, useCallback } from 'react';
import { storageService } from '@/services/firebase/FirebaseStorageService';
import { databaseService } from '@/lib/database';
import { Photo, PhotoUploadOptions, PhotoUploadProgress } from '@/types/models/Photo';

interface UsePhotoManagementOptions {
  placeId: string;
  userId: string;
  onSuccess?: (photo: Photo) => void;
  onError?: (error: Error) => void;
}

interface UsePhotoManagementReturn {
  // State
  uploading: boolean;
  uploadProgress: number;
  error: string | null;
  
  // Actions
  uploadPhoto: (file: File, options?: Partial<PhotoUploadOptions>) => Promise<Photo | null>;
  uploadPhotos: (files: File[], options?: Partial<PhotoUploadOptions>) => Promise<Photo[]>;
  deletePhoto: (photo: Photo) => Promise<void>;
  updatePhotoDescription: (photoId: string, description: string) => Promise<void>;
  clearError: () => void;
}

export function usePhotoManagement({
  placeId,
  userId,
  onSuccess,
  onError,
}: UsePhotoManagementOptions): UsePhotoManagementReturn {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  /**
   * Upload a single photo
   */
  const uploadPhoto = useCallback(
    async (file: File, options?: Partial<PhotoUploadOptions>): Promise<Photo | null> => {
      try {
        setUploading(true);
        setError(null);
        setUploadProgress(0);

        // Track upload progress
        const onProgress = (progress: PhotoUploadProgress) => {
          setUploadProgress(progress.percentage);
        };

        // Upload to Firebase Storage
        const photo = await storageService.uploadPhoto(
          file,
          userId,
          placeId,
          options,
          onProgress
        );

        // Save metadata to Firestore
        const savedPhoto = await databaseService.addPhotoToPlace(placeId, photo);

        setUploadProgress(100);
        onSuccess?.(savedPhoto);

        return savedPhoto;
      } catch (err: unknown) {
        const errorMessage = err.message || 'Failed to upload photo';
        setError(errorMessage);
        onError?.(new Error(errorMessage));
        return null;
      } finally {
        setUploading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    },
    [placeId, userId, onSuccess, onError]
  );

  /**
   * Upload multiple photos
   */
  const uploadPhotos = useCallback(
    async (files: File[], options?: Partial<PhotoUploadOptions>) => {
      try {
        setUploading(true);
        setError(null);
        setUploadProgress(0);

        const uploadedPhotos: Photo[] = [];
        const totalFiles = files.length;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          // Track overall progress
          const onProgress = (progress: PhotoUploadProgress) => {
            const fileProgress = progress.percentage / totalFiles;
            const overallProgress = (i / totalFiles) * 100 + fileProgress;
            setUploadProgress(overallProgress);
          };

          // Upload to Firebase Storage
          const photo = await storageService.uploadPhoto(
            file,
            userId,
            placeId,
            options,
            onProgress
          );

          // Save metadata to Firestore
          const savedPhoto = await databaseService.addPhotoToPlace(placeId, photo);
          uploadedPhotos.push(savedPhoto);
        }

        setUploadProgress(100);
        return uploadedPhotos;
      } catch (err: unknown) {
        const errorMessage = err.message || 'Failed to upload photos';
        setError(errorMessage);
        onError?.(new Error(errorMessage));
        return [];
      } finally {
        setUploading(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    },
    [placeId, userId, onError]
  );

  /**
   * Delete a photo
   * Atomically removes from both Storage and Firestore
   */
  const deletePhoto = useCallback(
    async (photo: Photo): Promise<void> => {
      try {
        setError(null);

        // Delete from Firebase Storage
        await storageService.deletePhoto(photo.id, photo.storagePath);

        // Delete metadata from Firestore
        await databaseService.deletePhotoFromPlace(placeId, photo.id);
      } catch (err: unknown) {
        const errorMessage = err.message || 'Failed to delete photo';
        setError(errorMessage);
        onError?.(new Error(errorMessage));
        throw err;
      }
    },
    [placeId, onError]
  );

  /**
   * Update photo description
   */
  const updatePhotoDescription = useCallback(
    async (photoId: string, description: string): Promise<void> => {
      try {
        setError(null);

        // Update in Firestore
        await databaseService.updatePhotoDescription(placeId, photoId, description);
      } catch (err: unknown) {
        const errorMessage = err.message || 'Failed to update photo description';
        setError(errorMessage);
        onError?.(new Error(errorMessage));
        throw err;
      }
    },
    [placeId, onError]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    uploading,
    uploadProgress,
    error,
    
    // Actions
    uploadPhoto,
    uploadPhotos,
    deletePhoto,
    updatePhotoDescription,
    clearError,
  };
}
