import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { IStorageService } from '@/services/interfaces/IStorageService';
import { Photo, PhotoUploadOptions, PhotoUploadProgress } from '@/types/models/Photo';

const extractErrorInfo = (error: unknown): { message: string; code?: string; stack?: string } => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }
  if (typeof error === 'object' && error !== null) {
    return {
      message: 'message' in error ? String(error.message) : 'Unknown error',
      code: 'code' in error ? String(error.code) : undefined,
      stack: 'stack' in error ? String(error.stack) : undefined,
    };
  }
  return { message: 'Unknown error' };
};

export class FirebaseStorageService implements IStorageService {
  private readonly MAX_FILE_SIZE_MB = 10;
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  constructor() {

    console.log(' Firebase Storage initialized');
    console.log('Storage bucket:', storage.app.options.storageBucket);

    if (!storage) {
      throw new Error('Firebase Storage not initialized');
    }

    if (!storage.app.options.storageBucket) {
      throw new Error('Firebase Storage bucket not configured. Check NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in .env.local');
    }
  }
  async uploadPhoto(
    file: File,
    userId: string,
    placeId: string,
    options?: Partial<PhotoUploadOptions>,
    onProgress?: (progress: PhotoUploadProgress) => void
  ): Promise<Photo> {
    try {
      console.log(' Starting photo upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId,
        placeId,
      });

      this.validateFile(file);
      console.log(' File validation passed');

      const processedFile = await this.compressImageInternal(file, {
        maxWidth: options?.maxWidth || 1920,
        maxHeight: options?.maxHeight || 1080,
        quality: options?.quality || 0.8,
      });
      console.log(' Image compressed:', {
        originalSize: file.size,
        compressedSize: processedFile.size,
      });

      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const filename = `${timestamp}_${sanitizedName}`;

      const storagePath = `users/${userId}/places/${placeId}/${filename}`;

      console.log(' Storage configuration:', {
        bucket: storage.app.options.storageBucket,
        path: storagePath,
        fullUrl: `gs://${storage.app.options.storageBucket}/${storagePath}`,
      });

      const storageRef = ref(storage, storagePath);
      console.log(' Uploading to path:', storagePath);

      const uploadTask = uploadBytesResumable(storageRef, processedFile, {
        contentType: file.type,
        customMetadata: {
          userId,
          placeId,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

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

      console.log(' Waiting for upload to complete...');
      await uploadTask;
      console.log(' Upload complete');

      const url = await getDownloadURL(storageRef);
      console.log(' Got download URL:', url);

      const dimensions = await this.getImageDimensions(processedFile);

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

      const photo: Photo = {
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

      console.log(' Photo upload complete:', photo);
      return photo;
    } catch (error: unknown) {
      const errorInfo = extractErrorInfo(error);
      console.error(' Error uploading photo:', error);
      console.error('Error details:', errorInfo);
      throw new Error(`Failed to upload photo: ${errorInfo.message}`);
    }
  }
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
      const errorInfo = extractErrorInfo(error);
      console.error('Error uploading photos:', error);
      throw new Error(`Failed to upload photos: ${errorInfo.message}`);
    }
  }
  async deletePhoto(_photoId: string, storagePath: string): Promise<void> {
    const startTime = Date.now();

    try {
      console.log(' Starting photo deletion:', { storagePath });

      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);

      console.log(' Photo deleted successfully:', {
        storagePath,
        duration: `${Date.now() - startTime}ms`,
      });

      const thumbnailPath = storagePath.replace(/([^/]+)$/, 'thumb_$1');
      try {
        const thumbnailRef = ref(storage, thumbnailPath);
        await deleteObject(thumbnailRef);
        console.log(' Thumbnail deleted:', thumbnailPath);
      } catch (err) {

        const thumbnailError = extractErrorInfo(err);
        console.warn('️ Thumbnail deletion skipped (not found):', {
          path: thumbnailPath,
          reason: thumbnailError.message,
        });
      }
    } catch (error: unknown) {
      const errorInfo = extractErrorInfo(error);
      const duration = Date.now() - startTime;

      console.error(' Photo deletion failed:', {
        storagePath,
        errorMessage: errorInfo.message,
        errorCode: errorInfo.code,
        duration: `${duration}ms`,
      });

      let userMessage = `Failed to delete photo: ${errorInfo.message}`;

      if (errorInfo.code === 'storage/object-not-found') {
        userMessage = 'Photo not found in storage (may have been deleted already)';
      } else if (errorInfo.message.includes('CORS')) {
        userMessage = 'Storage configuration error (CORS). Contact support.';
      } else if (errorInfo.message.includes('permission')) {
        userMessage = 'Permission denied. You may not have access to delete this photo.';
      } else if (errorInfo.message.includes('network')) {
        userMessage = 'Network error. Please check your connection and try again.';
      }

      throw new Error(userMessage);
    }
  }
  async deletePhotos(photos: Array<{ id: string; storagePath: string }>): Promise<void> {
    try {
      const deletePromises = photos.map((photo) =>
        this.deletePhoto(photo.id, photo.storagePath)
      );

      await Promise.all(deletePromises);
    } catch (error: unknown) {
      const errorInfo = extractErrorInfo(error);
      console.error('Error deleting photos:', error);
      throw new Error(`Failed to delete photos: ${errorInfo.message}`);
    }
  }
  async getPhotoUrl(storagePath: string): Promise<string> {
    try {
      const storageRef = ref(storage, storagePath);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error: unknown) {
      const errorInfo = extractErrorInfo(error);
      console.error('Error getting photo URL:', error);
      throw new Error(`Failed to get photo URL: ${errorInfo.message}`);
    }
  }
  private async compressImageInternal(
    file: File,
    options: { maxWidth: number; maxHeight: number; quality: number }
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {

          let { width, height } = img;
          const { maxWidth, maxHeight } = options;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }

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
  private async generateThumbnailInternal(
    file: File,
    userId: string,
    placeId: string,
    filename: string,
    size: number
  ): Promise<string> {
    try {

      const thumbnail = await this.compressImageInternal(file, {
        maxWidth: size,
        maxHeight: size,
        quality: 0.7,
      });

      const thumbnailPath = `users/${userId}/places/${placeId}/${filename}`;
      const storageRef = ref(storage, thumbnailPath);

      await uploadBytesResumable(storageRef, thumbnail, {
        contentType: file.type,
      });

      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error('Error generating thumbnail:', error);

      return '';
    }
  }
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
  private validateFile(file: File): void {

    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > this.MAX_FILE_SIZE_MB) {
      throw new Error(`File size (${sizeMB.toFixed(2)}MB) exceeds maximum (${this.MAX_FILE_SIZE_MB}MB)`);
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed. Allowed types: ${this.ALLOWED_TYPES.join(', ')}`);
    }
  }
  async compressImage(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File> {
    return this.compressImageInternal(file, { maxWidth, maxHeight, quality });
  }
  async generateThumbnail(file: File, size: number): Promise<File> {
    return this.compressImageInternal(file, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
    });
  }
  async getUserStorageUsage(_userId: string): Promise<number> {

    return 0;
  }
}

export const storageService = new FirebaseStorageService();
