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
import { MapPin, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Travel Timeline</h3>
          <p className="text-slate-400 text-sm">
            {sortedPlaces.length} {sortedPlaces.length === 1 ? 'place' : 'places'} • 
            {' '}{new Set(sortedPlaces.map(p => p.address.country)).size} {new Set(sortedPlaces.map(p => p.address.country)).size === 1 ? 'country' : 'countries'}
          </p>
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-2 rounded-lg transition-all ${
              canScrollLeft
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-white/5 text-slate-600 cursor-not-allowed'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-2 rounded-lg transition-all ${
              canScrollRight
                ? 'bg-white/10 hover:bg-white/20 text-white'
                : 'bg-white/5 text-slate-600 cursor-not-allowed'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent z-0" />

        {/* Scrollable Places Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
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
                className="flex-shrink-0 w-64 relative"
              >
                {/* Timeline Dot */}
                <div className="flex justify-center mb-3">
                  <div
                    className={`w-6 h-6 rounded-full border-4 transition-all duration-300 relative z-10 ${
                      isSelected
                        ? 'bg-blue-500 border-blue-400 scale-125 shadow-lg shadow-blue-500/50'
                        : 'bg-slate-800 border-slate-600 hover:border-blue-500/50'
                    }`}
                  >
                    {/* Pulse animation for selected */}
                    {isSelected && (
                      <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75" />
                    )}
                  </div>
                </div>

                {/* Place Card */}
                <button
                  onClick={() => onPlaceSelect(place)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-300 ${
                    isSelected
                      ? 'bg-blue-500/20 border-blue-400 shadow-xl shadow-blue-500/20'
                      : 'bg-white/10 border-white/20 hover:bg-white/[0.15] hover:border-white/30'
                  }`}
                >
                  {/* Badge for first/last */}
                  {(isFirst || isLast) && (
                    <div className="mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/20 text-blue-400 text-xs font-medium">
                        {isFirst && '🚀 Start'}
                        {isLast && '🎯 Latest'}
                      </span>
                    </div>
                  )}

                  {/* Place Info */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold mb-1 line-clamp-1">
                        {place.title}
                      </h4>
                      <p className="text-slate-400 text-xs line-clamp-1">
                        {place.address.city}, {place.address.country}
                      </p>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(place.visitDate)}</span>
                  </div>

                  {/* Photos indicator */}
                  {place.photos.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        📸 {place.photos.length} {place.photos.length === 1 ? 'photo' : 'photos'}
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
