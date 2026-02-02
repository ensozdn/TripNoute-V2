import { Timestamp } from '../index';

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  storagePath: string;
  filename: string;
  size: number;
  mimeType: string;
  width: number;
  height: number;
  description?: string;
  uploadedAt: Timestamp;
  uploadedBy: string;
}

export interface PhotoUploadOptions {
  file: File;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface PhotoUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
