'use client';

import { motion } from 'framer-motion';
import { ImageIcon } from 'lucide-react';
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

  return (
    <motion.div
      key="step-photos"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="absolute inset-0 flex flex-col bg-slate-900 overflow-y-auto"
    >
      {/* Spacer for WizardProgress bar (bar is ~72px) */}
      <div className="h-[72px] shrink-0" />

      <div className="flex-1 px-5 pb-36 pt-6 space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-purple-400" strokeWidth={1.8} />
            </div>
            <h2 className="text-lg font-semibold text-white">Add Photos</h2>
          </div>
          <p className="text-sm text-white/40 pl-10">
            Optional — you can always add photos later
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Image uploader */}
        <ImageUploader
          onFilesSelected={onFilesSelected}
          maxFiles={10}
          maxSizeInMB={10}
          disabled={isLoading}
          uploading={uploading}
          uploadProgress={uploadProgress}
        />

        {selectedFiles.length > 0 && (
          <p className="text-xs text-white/30 text-center">
            {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Sticky bottom CTAs */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-5 pb-10 pt-6 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent space-y-3">
        <motion.button
          onClick={onSave}
          disabled={isLoading}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl font-semibold text-base transition-all
            disabled:bg-white/8 disabled:text-white/25 disabled:cursor-not-allowed
            bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white shadow-xl shadow-blue-500/25"
        >
          {uploading
            ? `Uploading photos... ${Math.round(uploadProgress)}%`
            : isSaving
            ? 'Saving place...'
            : 'Save Place ✓'}
        </motion.button>

        {/* Skip photos option */}
        {!isLoading && selectedFiles.length === 0 && (
          <button
            onClick={onSave}
            className="w-full py-3 text-sm text-white/35 hover:text-white/60 transition-colors"
          >
            Skip photos for now
          </button>
        )}
      </div>
    </motion.div>
  );
}
