'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, X } from 'lucide-react';
import { ImageUploader } from '@/components/place';

interface StepPhotosProps {
  selectedFiles: File[];
  onFilesSelected: (files: File[]) => void;
  onSave: () => void;
  isSaving: boolean;
  uploading: boolean;
  uploadProgress: number;
  error?: string;
}

export default function StepPhotos({
  selectedFiles,
  onFilesSelected,
  onSave,
  isSaving,
  uploading,
  uploadProgress,
  error,
}: StepPhotosProps) {
  const isLoading = isSaving || uploading;
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const prevFilesRef = useRef<File[]>([]);

  // Sync preview URLs with selectedFiles from parent
  useEffect(() => {
    if (prevFilesRef.current === selectedFiles) return;
    prevFilesRef.current = selectedFiles;

    // Revoke old URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    const urls = selectedFiles.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles]);

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    onFilesSelected(newFiles);
  };

  return (
    <motion.div
      key="step-photos"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="absolute inset-0 flex flex-col bg-white overflow-y-auto"
    >
      {/* Spacer for WizardProgress bar */}
      <div className="h-[88px] shrink-0" />

      <div className="flex-1 px-5 pb-36 pt-6 space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-purple-500" strokeWidth={1.8} />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Add Photos</h2>
          </div>
          <p className="text-sm text-slate-400 pl-10">
            Optional — you can always add photos later
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Upload progress bar */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-medium">Uploading photos…</span>
              <span className="font-bold text-slate-800">{Math.round(uploadProgress)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Thumbnail grid — shown when files selected */}
        {selectedFiles.length > 0 && !uploading && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} selected
            </p>
            <div className="grid grid-cols-3 gap-2">
              {selectedFiles.map((file, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 380, damping: 28 }}
                  className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group"
                >
                  {previewUrls[i] && (
                    <img
                      src={previewUrls[i]}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    disabled={isLoading}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  </button>
                  {/* Index badge */}
                  {i === 0 && (
                    <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                      Cover
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Image uploader (add more) */}
        <ImageUploader
          onFilesSelected={(newFiles) => {
            // Merge with existing (ImageUploader passes only its own selection)
            const merged = [...selectedFiles, ...newFiles.filter(
              (f) => !selectedFiles.some((e) => e.name === f.name && e.size === f.size)
            )];
            onFilesSelected(merged);
          }}
          maxFiles={10 - selectedFiles.length}
          maxSizeInMB={10}
          disabled={isLoading || selectedFiles.length >= 10}
          uploading={false}
          uploadProgress={0}
        />
      </div>

      {/* Sticky bottom CTAs */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-10 pt-6 bg-gradient-to-t from-white via-white/95 to-transparent space-y-3">
        <motion.button
          onClick={onSave}
          disabled={isLoading}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-semibold text-base transition-all
            disabled:bg-black/6 disabled:text-slate-300 disabled:cursor-not-allowed
            bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-xl shadow-blue-500/25"
        >
          {uploading
            ? `Uploading photos… ${Math.round(uploadProgress)}%`
            : isSaving
            ? 'Saving place…'
            : 'Save Place ✓'}
        </motion.button>

        {/* Skip photos option */}
        {!isLoading && selectedFiles.length === 0 && (
          <button
            onClick={onSave}
            className="w-full py-3 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Skip photos for now
          </button>
        )}
      </div>
    </motion.div>
  );
}