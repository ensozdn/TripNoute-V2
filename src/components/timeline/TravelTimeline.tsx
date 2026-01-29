'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Place } from '@/types';
import { Calendar, ChevronLeft, ChevronRight, Camera, MoreVertical, Edit2, Trash2 } from 'lucide-react';

interface TravelTimelineProps {
  places: Place[];
  selectedPlaceId?: string | null;
  onPlaceSelect: (place: Place) => void;
  onPlaceDelete?: (placeId: string) => Promise<void>;
  onPlaceEdit?: (place: Place) => void;
  className?: string;
}

export default function TravelTimeline({
  places,
  selectedPlaceId,
  onPlaceSelect,
  onPlaceDelete,
  onPlaceEdit,
  className = '',
}: TravelTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deletingPlaceId, setDeletingPlaceId] = useState<string | null>(null);

  const sortedPlaces = [...places].sort((a, b) => {
    const dateA = a.visitDate?.seconds || 0;
    const dateB = b.visitDate?.seconds || 0;
    return dateA - dateB;
  });

  const updateScrollButtons = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
    return undefined;
  }, [sortedPlaces]);

  useEffect(() => {
    if (selectedPlaceId && scrollContainerRef.current) {
      const selectedElement = document.getElementById(`timeline-place-${selectedPlaceId}`);
      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [selectedPlaceId]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 300;
    const newScrollLeft = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    
    container.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });
  };

  const formatDate = (timestamp: { seconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  // Handle delete with confirmation
  const handleDelete = async (place: Place, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);

    if (!onPlaceDelete) return;

    const confirmed = window.confirm(
      `Delete "${place.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingPlaceId(place.id);
    
    try {
      await onPlaceDelete(place.id);
      // Success feedback handled by parent (Dashboard)
    } catch (error) {
      console.error('Failed to delete place:', error);
      alert('Failed to delete place. Please try again.');
    } finally {
      setDeletingPlaceId(null);
    }
  };

  // Handle edit
  const handleEdit = (place: Place, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);

    if (onPlaceEdit) {
      onPlaceEdit(place);
    }
  };

  // Toggle menu
  const toggleMenu = (placeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === placeId ? null : placeId);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  if (sortedPlaces.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Header - Vibrant */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            ✈️ Your Journey
          </h3>
          <p className="text-xs text-white/60">
            {sortedPlaces.length} {sortedPlaces.length === 1 ? 'place' : 'places'} • {new Set(sortedPlaces.map(p => p.address.country)).size} {new Set(sortedPlaces.map(p => p.address.country)).size === 1 ? 'country' : 'countries'}
          </p>
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full transition-all ${
              canScrollLeft
                ? 'bg-white/10 hover:bg-white/20 text-white hover:scale-110'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-2 rounded-full transition-all ${
              canScrollRight
                ? 'bg-white/10 hover:bg-white/20 text-white hover:scale-110'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Timeline Line - Vibrant Gradient */}
        <div className="absolute top-6 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400/20 via-purple-400/30 to-blue-400/20 z-0" />

        {/* Scrollable Places Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {sortedPlaces.map((place, index) => {
            const isSelected = place.id === selectedPlaceId;
            const isFirst = index === 0;
            const isLast = index === sortedPlaces.length - 1;

            return (
              <div
                key={place.id}
                id={`timeline-place-${place.id}`}
                className="flex-shrink-0 w-48 relative"
              >
                {/* Timeline Connection - Visual Storytelling */}
                <div className="flex justify-center mb-3">
                  {/* Photo Thumbnail or Pulsing Dot */}
                  {place.photos && place.photos.length > 0 && place.photos[0]?.url ? (
                    <div
                      className={`relative w-12 h-12 rounded-full transition-all duration-300 z-10 ${
                        isSelected
                          ? 'ring-4 ring-blue-400/50 scale-110 shadow-xl shadow-blue-500/30'
                          : 'ring-2 ring-white/20 hover:ring-blue-400/30 hover:scale-105'
                      }`}
                    >
                      <Image
                        src={place.photos[0].url}
                        alt={place.title}
                        fill
                        className="rounded-full object-cover"
                        unoptimized
                      />
                      {/* Pulse animation for selected */}
                      {isSelected && (
                        <span className="absolute inset-0 rounded-full bg-blue-400/30 animate-ping" />
                      )}
                    </div>
                  ) : (
                    <div
                      className={`w-3 h-3 rounded-full transition-all duration-300 relative z-10 ${
                        isSelected
                          ? 'bg-blue-400 scale-150 shadow-lg shadow-blue-500/50'
                          : 'bg-gradient-to-br from-blue-400 to-purple-400 hover:scale-125'
                      }`}
                    >
                      {/* Pulse animation for selected */}
                      {isSelected && (
                        <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
                      )}
                    </div>
                  )}
                </div>

                {/* Place Card - Visual Story with Actions */}
                <div className="relative">
                  {/* Three Dots Menu Button - Outside of main button */}
                  {(onPlaceEdit || onPlaceDelete) && (
                    <button
                      onClick={(e) => toggleMenu(place.id, e)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-all z-20"
                      aria-label="More options"
                    >
                      <MoreVertical className="w-3 h-3 text-white" />
                    </button>
                  )}

                  {/* Dropdown Menu */}
                  {openMenuId === place.id && (
                    <div className="absolute top-10 right-2 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl overflow-hidden z-30 min-w-[140px]">
                      {onPlaceEdit && (
                        <button
                          onClick={(e) => handleEdit(place, e)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                          <span>Edit</span>
                        </button>
                      )}
                      {onPlaceDelete && (
                        <button
                          onClick={(e) => handleDelete(place, e)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Loading Indicator */}
                  {deletingPlaceId === place.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl z-10">
                      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Main Place Card Button */}
                  <button
                    onClick={() => onPlaceSelect(place)}
                    disabled={deletingPlaceId === place.id}
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-300 ${
                      deletingPlaceId === place.id
                        ? 'opacity-50 cursor-not-allowed bg-white/5 border-red-400/30'
                        : isSelected
                        ? 'bg-white/10 border-blue-400/50 shadow-xl shadow-blue-500/20 scale-105'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-lg'
                    }`}
                  >
                  {/* Badge for first/last */}
                  {(isFirst || isLast) && (
                    <div className="mb-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        isFirst ? 'bg-green-400/20 text-green-300' : 'bg-blue-400/20 text-blue-300'
                      }`}>
                        {isFirst && '🚀 Start'}
                        {isLast && '✨ Latest'}
                      </span>
                    </div>
                  )}

                  {/* Place Info */}
                  <div className="mb-2">
                    <h4 className="text-sm font-bold text-white mb-1 line-clamp-2 leading-tight">
                      {place.title}
                    </h4>
                    <p className="text-xs text-white/70 line-clamp-1 flex items-center gap-1">
                      📍 {place.address.city}
                    </p>
                  </div>

                  {/* Date & Photos Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-white/50 text-[10px]">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(place.visitDate)}</span>
                    </div>

                    {place.photos.length > 0 && (
                      <div className="flex items-center gap-1 text-white/50 text-[10px]">
                        <Camera className="w-3 h-3" />
                        <span>{place.photos.length}</span>
                      </div>
                    )}
                  </div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
