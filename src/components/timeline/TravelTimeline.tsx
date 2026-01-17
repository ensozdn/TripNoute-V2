/**
 * TravelTimeline Component
 * 
 * Interactive timeline slider for navigating through travel places chronologically.
 * Features:
 * - Horizontal scrollable timeline
 * - Date-based navigation
 * - Syncs with map focus
 * - Polarsteps-inspired design
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Place } from '@/types';
import { Calendar, ChevronLeft, ChevronRight, Camera } from 'lucide-react';

interface TravelTimelineProps {
  places: Place[];
  selectedPlaceId?: string | null;
  onPlaceSelect: (place: Place) => void;
  className?: string;
}

export default function TravelTimeline({
  places,
  selectedPlaceId,
  onPlaceSelect,
  className = '',
}: TravelTimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Sort places by visit date (oldest to newest)
  const sortedPlaces = [...places].sort((a, b) => {
    const dateA = a.visitDate?.seconds || 0;
    const dateB = b.visitDate?.seconds || 0;
    return dateA - dateB;
  });

  // Update scroll buttons visibility
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

  // Scroll to selected place
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

  if (sortedPlaces.length === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Header - Minimal */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Travel Timeline</h3>
          <p className="text-xs text-slate-500">
            {sortedPlaces.length} {sortedPlaces.length === 1 ? 'place' : 'places'}
          </p>
        </div>

        {/* Scroll Controls - Minimal */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-1.5 rounded-lg transition-all ${
              canScrollLeft
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-white/5 text-slate-600 cursor-not-allowed'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-1.5 rounded-lg transition-all ${
              canScrollRight
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-white/5 text-slate-600 cursor-not-allowed'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Timeline Line - Subtle */}
        <div className="absolute top-3 left-0 right-0 h-px bg-white/10 z-0" />

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
                {/* Timeline Dot - Minimal */}
                <div className="flex justify-center mb-2">
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-300 relative z-10 ${
                      isSelected
                        ? 'bg-blue-400 scale-150 shadow-lg shadow-blue-500/50'
                        : 'bg-slate-600 hover:bg-blue-500/50'
                    }`}
                  >
                    {/* Pulse animation for selected */}
                    {isSelected && (
                      <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
                    )}
                  </div>
                </div>

                {/* Place Card - Compact */}
                <button
                  onClick={() => onPlaceSelect(place)}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-300 ${
                    isSelected
                      ? 'bg-blue-500/10 border-blue-400/50 shadow-lg shadow-blue-500/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Badge for first/last - Minimal */}
                  {(isFirst || isLast) && (
                    <div className="mb-2">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-medium">
                        {isFirst && 'Start'}
                        {isLast && 'Latest'}
                      </span>
                    </div>
                  )}

                  {/* Place Info - Compact */}
                  <div className="mb-2">
                    <h4 className="text-sm font-semibold text-white mb-0.5 line-clamp-1">
                      {place.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {place.address.city}, {place.address.country}
                    </p>
                  </div>

                  {/* Date - Minimal */}
                  <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(place.visitDate)}</span>
                  </div>

                  {/* Photos indicator - Only if has photos */}
                  {place.photos.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <span className="text-slate-500 text-[10px] flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        {place.photos.length}
                      </span>
                    </div>
                  )}
                </button>
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
