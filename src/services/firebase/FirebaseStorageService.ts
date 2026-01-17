/**
 * TripNoute v2 - Firebase Storage Service Implementation
 * 
 * This service implements the IStorageService interface using Firebase Storage.
 * Single Responsibility: Only handles file storage operations.
 * Does NOT handle Firestore metadata - that's DatabaseService's job.
 */

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { IStorageService } from '@/services/interfaces/IStorageService';
import { Photo, PhotoUploadOptions, PhotoUploadProgress } from '@/types/models/Photo';

export class FirebaseStorageService implements IStorageService {
  private readonly MAX_FILE_SIZE_MB = 10;
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  constructor() {
    // Log storage bucket info for debugging
    console.log('🔧 Firebase Storage initialized');
    console.log('Storage bucket:', storage.app.options.storageBucket);
  }

  /**
   * Upload a single photo to Firebase Storage
   */
  async uploadPhoto(
    file: File,
    userId: string,
    placeId: string,
    options?: Partial<PhotoUploadOptions>,
    onProgress?: (progress: PhotoUploadProgress) => void
  ): Promise<Photo> {
    try {
      console.log('🔵 Starting photo upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId,
        placeId,
      });

      // Validate file
      this.validateFile(file);
      console.log('✅ File validation passed');

      // Compress if needed
      const processedFile = await this.compressImageInternal(file, {
        maxWidth: options?.maxWidth || 1920,
        maxHeight: options?.maxHeight || 1080,
        quality: options?.quality || 0.8,
      });
      console.log('✅ Image compressed:', {
        originalSize: file.size,
        compressedSize: processedFile.size,
      });

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filename = `${timestamp}_${sanitizedName}`;
      
      // Create storage path
      const storagePath = `users/${userId}/places/${placeId}/${filename}`;
      const storageRef = ref(storage, storagePath);
      console.log('🔵 Uploading to path:', storagePath);

      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, processedFile, {
        contentType: file.type,
        customMetadata: {
          userId,
          placeId,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      // Track upload progress
      if (onProgress) {
        uploadTask.on('state_changed', (snapshot) => {
          const progress: PhotoUploadProgress = {
            loaded: snapshot.bytesTransferred,
            total: snapshot.totalBytes,
            percentage: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          };
          onProgress(progress);
        });
      }

      // Wait for upload to complete
      console.log('⏳ Waiting for upload to complete...');
      await uploadTask;
      console.log('✅ Upload complete');

      // Get download URL
      const url = await getDownloadURL(storageRef);
      console.log('✅ Got download URL:', url);

      // Get image dimensions
      const dimensions = await this.getImageDimensions(processedFile);

      // Generate thumbnail if requested
      let thumbnailUrl = url;
      if (options?.generateThumbnail !== false) {
        thumbnailUrl = await this.generateThumbnailInternal(
          processedFile,
          userId,
          placeId,
          `thumb_${filename}`,
          options?.thumbnailSize || 300
        );
      }

      // Return Photo object (without Firestore ID - that will be added by DatabaseService)
      const photo: Photo = {
        id: '', // Will be set by DatabaseService when saving to Firestore
        url,
        thumbnailUrl,
        storagePath,
        filename,
        size: processedFile.size,
        mimeType: file.type,
        width: dimensions.width,
        height: dimensions.height,
        uploadedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
        uploadedBy: userId,
      };

      console.log('✅ Photo upload complete:', photo);
      return photo;
    } catch (error: unknown) {
      console.error('❌ Error uploading photo:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      throw new Error(`Failed to upload photo: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Upload multiple photos in parallel
   */
  async uploadPhotos(
    files: File[],
    userId: string,
    placeId: string,
    options?: Partial<PhotoUploadOptions>,
    onProgress?: (progress: PhotoUploadProgress) => void
  ): Promise<Photo[]> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadPhoto(file, userId, placeId, options, onProgress)
      );

      const photos = await Promise.all(uploadPromises);
      return photos;
    } catch (error: unknown) {
      console.error('Error uploading photos:', error);
      throw new Error(`Failed to upload photos: ${error.message}`);
    }
  }

  /**
   * Delete a photo from Firebase Storage
   */
  async deletePhoto(_photoId: string, storagePath: string): Promise<void> {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);

      // Also delete thumbnail if it exists
      const thumbnailPath = storagePath.replace(/([^/]+)$/, 'thumb_$1');
      try {
        const thumbnailRef = ref(storage, thumbnailPath);
        await deleteObject(thumbnailRef);
      } catch (err) {
        // Thumbnail might not exist, that's okay
        console.warn('Thumbnail not found or already deleted:', thumbnailPath);
      }
    } catch (error: unknown) {
      console.error('Error deleting photo:', error);
      throw new Error(`Failed to delete photo: ${error.message}`);
    }
  }

  /**
   * Delete multiple photos in batch
   */
  async deletePhotos(photos: Array<{ id: string; storagePath: string }>): Promise<void> {
    try {
      const deletePromises = photos.map((photo) =>
        this.deletePhoto(photo.id, photo.storagePath)
      );

      await Promise.all(deletePromises);
    } catch (error: unknown) {
      console.error('Error deleting photos:', error);
      throw new Error(`Failed to delete photos: ${error.message}`);
    }
  }

  /**
   * Get photo download URL
   */
  async getPhotoUrl(storagePath: string): Promise<string> {
    try {
      const storageRef = ref(storage, storagePath);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error: unknown) {
      console.error('Error getting photo URL:', error);
      throw new Error(`Failed to get photo URL: ${error.message}`);
    }
  }

  /**
   * Compress image before upload
   */
  private async compressImageInternal(
    file: File,
    options: { maxWidth: number; maxHeight: number; quality: number }
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img;
          const { maxWidth, maxHeight } = options;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

          // Create canvas and compress
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });

              resolve(compressedFile);
            },
            file.type,
            options.quality
          );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate thumbnail (private helper)
   */
  private async generateThumbnailInternal(
    file: File,
    userId: string,
    placeId: string,
    filename: string,
    size: number
  ): Promise<string> {
    try {
      // Compress to thumbnail size
      const thumbnail = await this.compressImageInternal(file, {
        maxWidth: size,
        maxHeight: size,
        quality: 0.7,
      });

      // Upload thumbnail
      const thumbnailPath = `users/${userId}/places/${placeId}/${filename}`;
      const storageRef = ref(storage, thumbnailPath);

      await uploadBytesResumable(storageRef, thumbnail, {
        contentType: file.type,
      });

      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      // Return original URL if thumbnail generation fails
      return '';
    }
  }

  /**
   * Get image dimensions
   */
  private getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => reject(new Error('Failed to load image for dimensions'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file for dimensions'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > this.MAX_FILE_SIZE_MB) {
      throw new Error(`File size (${sizeMB.toFixed(2)}MB) exceeds maximum (${this.MAX_FILE_SIZE_MB}MB)`);
    }

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`);
    }
  }

  /**
   * Compress image (Interface implementation)
   */
  async compressImage(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File> {
    return this.compressImageInternal(file, { maxWidth, maxHeight, quality });
  }

  /**
   * Generate thumbnail (Interface implementation)
   */
  async generateThumbnail(file: File, size: number): Promise<File> {
    return this.compressImageInternal(file, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
    });
  }

  /**
   * Get storage usage for a user
   */
  async getUserStorageUsage(_userId: string): Promise<number> {
    // Firebase Storage doesn't have a direct API for this
    // Would need to implement custom tracking in Firestore
    return 0;
  }
}

// Singleton instance
export const storageService = new FirebaseStorageService();
