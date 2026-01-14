'use client';

import React, { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSizeInMB?: number;
  accept?: string;
  disabled?: boolean;
  uploading?: boolean;
  uploadProgress?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onFilesSelected,
  maxFiles = 10,
  maxSizeInMB = 10,
  accept = 'image/jpeg,image/png,image/webp',
  disabled = false,
  uploading = false,
  uploadProgress = 0,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;

  // Validate files
  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      // Check file type
      if (!accept.split(',').some((type) => file.type.match(type.replace('*', '.*')))) {
        errors.push(`${file.name}: Invalid file type. Only ${accept} allowed.`);
        return;
      }

      // Check file size
      if (file.size > maxSizeInBytes) {
        errors.push(`${file.name}: File too large. Max ${maxSizeInMB}MB allowed.`);
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  };

  // Create preview URLs
  const createPreviews = (files: File[]) => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => {
      // Revoke old URLs
      prev.forEach((url) => URL.revokeObjectURL(url));
      return urls;
    });
  };

  // Handle file selection
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      const totalFiles = selectedFiles.length + fileArray.length;

      if (totalFiles > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const { valid, errors } = validateFiles(fileArray);

      if (errors.length > 0) {
        alert(errors.join('\n'));
      }

      if (valid.length > 0) {
        const newFiles = [...selectedFiles, ...valid];
        setSelectedFiles(newFiles);
        createPreviews(newFiles);
        onFilesSelected(newFiles);
      }
    },
    [selectedFiles, maxFiles, onFilesSelected]
  );

  // Remove file
  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    createPreviews(newFiles);
    onFilesSelected(newFiles);

    // Revoke removed URL
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
  };

  // Drag & Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!disabled && !uploading) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // File input handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    e.target.value = ''; // Reset input
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 transition-colors',
          'flex flex-col items-center justify-center gap-4 cursor-pointer',
          isDragging && 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
          !isDragging && 'border-slate-300 dark:border-slate-700 hover:border-slate-400',
          (disabled || uploading) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInput}
          disabled={disabled || uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center gap-2 pointer-events-none">
          <Upload className="w-12 h-12 text-slate-400" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {isDragging ? 'Drop files here' : 'Drag & drop images or click to browse'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Max {maxFiles} files, up to {maxSizeInMB}MB each
          </p>
        </div>
      </div>

      {/* Upload Progress */}
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-400">Uploading...</span>
            <span className="font-medium text-slate-900 dark:text-slate-100">
              {Math.round(uploadProgress)}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Preview Grid */}
      {selectedFiles.length > 0 && !uploading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={previewUrls[index]}
                alt={file.name}
                className="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-800"
              />

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={disabled || uploading}
                className={cn(
                  'absolute top-2 right-2 p-1.5 rounded-full',
                  'bg-red-500 text-white opacity-0 group-hover:opacity-100',
                  'transition-opacity hover:bg-red-600',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <X className="w-4 h-4" />
              </button>

              {/* File Info */}
              <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/60 rounded-b-lg">
                <p className="text-xs text-white truncate">{file.name}</p>
                <p className="text-xs text-slate-300">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {selectedFiles.length === 0 && !uploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <ImageIcon className="w-4 h-4" />
          <span>No images selected</span>
        </div>
      )}
    </div>
  );
};
