'use client';

import React, { useState } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { Photo } from '@/types/models/Photo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface PhotoCardProps {
  photo: Photo;
  onDelete?: (photo: Photo) => void;
  onUpdateDescription?: (photoId: string, description: string) => void;
  onClick?: (photo: Photo) => void;
  disabled?: boolean;
  className?: string;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onDelete,
  onUpdateDescription,
  onClick,
  disabled = false,
  className,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(photo.description || '');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveDescription = async () => {
    if (!onUpdateDescription) return;

    try {
      await onUpdateDescription(photo.id, description);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update description:', error);
    }
  };

  const handleCancelEdit = () => {
    setDescription(photo.description || '');
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm('Are you sure you want to delete this photo?')) return;

    setIsDeleting(true);
    try {
      await onDelete(photo);
    } catch (error) {
      console.error('Failed to delete photo:', error);
      setIsDeleting(false);
    }
  };

  const handleImageClick = () => {
    if (!isEditing && onClick) {
      onClick(photo);
    }
  };

  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-slate-900 rounded-lg overflow-hidden',
        'border border-slate-200 dark:border-slate-800',
        'transition-all hover:shadow-lg',
        isDeleting && 'opacity-50 pointer-events-none',
        className
      )}
    >
      {}
      <div
        className={cn(
          'aspect-square relative overflow-hidden bg-slate-100 dark:bg-slate-800',
          onClick && !isEditing && 'cursor-pointer'
        )}
        onClick={handleImageClick}
      >
        <img
          src={photo.thumbnailUrl || photo.url}
          alt={photo.description || 'Photo'}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />

        {}
        {onClick && !isEditing && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-medium">View Full Size</span>
          </div>
        )}
      </div>

      {}
      <div className="p-3 space-y-2">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              disabled={disabled}
              className="text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveDescription}
                disabled={disabled}
                className="flex-1"
              >
                <Check className="w-3 h-3 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={disabled}
                className="flex-1"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            {photo.description ? (
              <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                {photo.description}
              </p>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-600 italic">
                No description
              </p>
            )}
          </>
        )}

        {}
        {!isEditing && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onUpdateDescription && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                disabled={disabled || isDeleting}
                className="flex-1"
              >
                <Edit2 className="w-3 h-3 mr-1" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={disabled || isDeleting}
                className="flex-1"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        )}

        {}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
          <span>{(photo.size / 1024 / 1024).toFixed(2)} MB</span>
          <span>
            {photo.width} × {photo.height}
          </span>
        </div>
      </div>

      {}
      {isDeleting && (
        <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Deleting...</span>
          </div>
        </div>
      )}
    </div>
  );
};
