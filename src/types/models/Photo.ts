/**
 * TripNoute v2 - Photo Model Types
 * Detailed photo-related type definitions
 */

import { Timestamp } from '../index';

export interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string;
  storagePath: string;
  filename: string;
  size: number; // bytes
  mimeType: string;
  width: number;
  height: number;
  description?: string; // Optional photo caption/description
  uploadedAt: Timestamp;
  uploadedBy: string; // userId
}

export interface PhotoUploadOptions {
  file: File;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  generateThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface PhotoUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}
