/**
 * TripNoute v2 - Storage Service Interface
 * 
 * This interface defines the contract for file storage operations.
 * Provider-independent: Can be Firebase Storage, S3, Cloudflare R2, etc.
 */

import { Photo, PhotoUploadOptions, PhotoUploadProgress } from '@/types/models/Photo';

export interface IStorageService {
  /**
   * Upload a single photo
   */
  uploadPhoto(
    file: File,
    userId: string,
    placeId: string,
    options?: Partial<PhotoUploadOptions>,
    onProgress?: (progress: PhotoUploadProgress) => void
  ): Promise<Photo>;

  /**
   * Upload multiple photos
   */
  uploadPhotos(
    files: File[],
    userId: string,
    placeId: string,
    options?: Partial<PhotoUploadOptions>,
    onProgress?: (progress: PhotoUploadProgress) => void
  ): Promise<Photo[]>;

  /**
   * Delete a photo
   */
  deletePhoto(photoId: string, storagePath: string): Promise<void>;

  /**
   * Delete multiple photos
   */
  deletePhotos(photos: Array<{ id: string; storagePath: string }>): Promise<void>;

  /**
   * Get photo download URL
   */
  getPhotoUrl(storagePath: string): Promise<string>;

  /**
   * Compress image before upload
   */
  compressImage(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File>;

  /**
   * Generate thumbnail from image
   */
  generateThumbnail(file: File, size: number): Promise<File>;

  /**
   * Get storage usage for a user
   */
  getUserStorageUsage(userId: string): Promise<number>; // bytes
}
