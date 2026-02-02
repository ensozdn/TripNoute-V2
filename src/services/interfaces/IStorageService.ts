import { Photo, PhotoUploadOptions, PhotoUploadProgress } from '@/types/models/Photo';

export interface IStorageService {
  uploadPhoto(
    file: File,
    userId: string,
    placeId: string,
    options?: Partial<PhotoUploadOptions>,
    onProgress?: (progress: PhotoUploadProgress) => void
  ): Promise<Photo>;
  uploadPhotos(
    files: File[],
    userId: string,
    placeId: string,
    options?: Partial<PhotoUploadOptions>,
    onProgress?: (progress: PhotoUploadProgress) => void
  ): Promise<Photo[]>;
  deletePhoto(photoId: string, storagePath: string): Promise<void>;
  deletePhotos(photos: Array<{ id: string; storagePath: string }>): Promise<void>;
  getPhotoUrl(storagePath: string): Promise<string>;
  compressImage(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File>;
  generateThumbnail(file: File, size: number): Promise<File>;
  getUserStorageUsage(userId: string): Promise<number>;
}
