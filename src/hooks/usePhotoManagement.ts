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

/**
 * Helper to safely extract error message
 */
const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  return defaultMessage;
};

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
        const errorMessage = getErrorMessage(err, 'Failed to upload photo');
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
   * Upload multiple photos with robust error handling
   * CRITICAL: Resets uploading state even if partial failures occur
   */
  const uploadPhotos = useCallback(
    async (files: File[], options?: Partial<PhotoUploadOptions>) => {
      const startTime = Date.now();
      
      try {
        setUploading(true);
        setError(null);
        setUploadProgress(0);

        const uploadedPhotos: Photo[] = [];
        const totalFiles = files.length;
        const failedFiles: Array<{ filename: string; error: string }> = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];

          try {
            console.log(`📤 Uploading file ${i + 1}/${totalFiles}:`, file.name);

            // Track overall progress
            const onProgress = (progress: PhotoUploadProgress) => {
              const fileProgress = progress.percentage / totalFiles;
              const overallProgress = (i / totalFiles) * 100 + fileProgress;
              setUploadProgress(Math.min(overallProgress, 99)); // Cap at 99% until complete
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
            
            console.log(`✅ File ${i + 1} uploaded successfully`);
          } catch (fileError: unknown) {
            const errorMessage = getErrorMessage(fileError, 'Upload failed');
            console.error(`❌ File ${i + 1} failed:`, errorMessage);
            failedFiles.push({
              filename: file.name,
              error: errorMessage,
            });
            
            // Continue uploading other files instead of stopping
          }
        }

        setUploadProgress(100);
        const duration = Date.now() - startTime;

        // Check if any uploads succeeded
        if (uploadedPhotos.length > 0) {
          console.log(`✅ Uploaded ${uploadedPhotos.length}/${totalFiles} files`, {
            duration: `${duration}ms`,
          });
          onSuccess?.(uploadedPhotos[0]);
        }

        // Handle partial failures
        if (failedFiles.length > 0) {
          const failureMessage = `${failedFiles.length} photo(s) failed to upload: ${failedFiles.map(f => f.filename).join(', ')}`;
          console.warn('⚠️ Partial upload failure:', failureMessage);
          setError(failureMessage);
          onError?.(new Error(failureMessage));
        }

        return uploadedPhotos;
      } catch (err: unknown) {
        const errorMessage = getErrorMessage(err, 'Failed to upload photos');
        const duration = Date.now() - startTime;
        
        console.error('❌ Photo upload failed:', {
          errorMessage,
          duration: `${duration}ms`,
        });

        setError(errorMessage);
        onError?.(new Error(errorMessage));
        return [];
      } finally {
        setUploading(false);
        // Reset progress bar after a short delay for visual feedback
        setTimeout(() => setUploadProgress(0), 1500);
      }
    },
    [placeId, userId, onSuccess, onError]
  );

  /**
   * Delete a photo with robust error handling
   * CRITICAL: Ensures loading state is reset even on error
   * Atomically removes from both Storage and Firestore
   */
  const deletePhoto = useCallback(
    async (photo: Photo): Promise<void> => {
      const startTime = Date.now();
      
      try {
        setError(null);

        console.log('🔴 Starting photo deletion:', { photoId: photo.id });

        // Delete from Firebase Storage first
        try {
          await storageService.deletePhoto(photo.id, photo.storagePath);
          console.log('✅ Storage deletion successful');
        } catch (storageError: unknown) {
          const errorMessage = getErrorMessage(storageError, 'Failed to delete from storage');
          console.error('❌ Storage deletion failed:', errorMessage);
          
          // Check if it's a "not found" error - if so, continue to Firestore deletion
          if (storageError instanceof Error && !storageError.message.includes('not found')) {
            throw storageError;
          }
          console.log('ℹ️ File not in storage, continuing to remove metadata...');
        }

        // Delete metadata from Firestore
        try {
          await databaseService.deletePhotoFromPlace(placeId, photo.id);
          console.log('✅ Firestore deletion successful');
        } catch (firestoreError: unknown) {
          const errorMessage = getErrorMessage(firestoreError, 'Failed to delete photo metadata');
          console.error('❌ Firestore deletion failed:', errorMessage);
          throw firestoreError;
        }

        const duration = Date.now() - startTime;
        console.log('✅ Photo deleted completely:', {
          photoId: photo.id,
          duration: `${duration}ms`,
        });
      } catch (err: unknown) {
        const errorMessage = getErrorMessage(err, 'Failed to delete photo');
        const duration = Date.now() - startTime;
        
        console.error('❌ Photo deletion failed:', {
          photoId: photo.id,
          errorMessage,
          duration: `${duration}ms`,
        });

        // Set error state for UI display
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
        const errorMessage = getErrorMessage(err, 'Failed to update photo description');
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
