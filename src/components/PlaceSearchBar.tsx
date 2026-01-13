/**
 * PlaceSearchBar Component
 * Google Places API ile yer arama
 * Autocomplete ile sonuçları gösterir
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { getGooglePlacesService } from '@/services/maps';
import type { GooglePlaceResult } from '@/types/maps';

interface PlaceSearchBarProps {
  onPlaceSelect: (place: GooglePlaceResult) => void;
  placeholder?: string;
  className?: string;
}

export default function PlaceSearchBar({
  onPlaceSelect,
  placeholder = 'Yer ara...',
  className = '',
}: PlaceSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GooglePlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const googlePlacesService = useRef(getGooglePlacesService());

  // Outside click handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search with debounce
  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const places = await googlePlacesService.current.autocomplete({
          input: query,
          types: ['establishment', 'geocode'],
        });
        setResults(places);
        setIsOpen(places.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (place: GooglePlaceResult) => {
    setQuery(place.name);
    setIsOpen(false);
    setSelectedIndex(-1);
    onPlaceSelect(place);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        
        {/* Search Icon / Loading Spinner */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50">
          {results.map((place, index) => (
            <button
              key={place.placeId}
              onClick={() => handleSelect(place)}
              className={`w-full px-4 py-3 text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-primary-500/20 border-l-4 border-primary-500'
                  : 'hover:bg-white/10'
              } ${index > 0 ? 'border-t border-white/10' : ''}`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="mt-1">
                  <svg
                    className="w-5 h-5 text-primary-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{place.name}</p>
                  <p className="text-sm text-slate-400 truncate">{place.formattedAddress}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && !isLoading && query.length >= 3 && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-xl p-4 z-50">
          <p className="text-slate-400 text-center">Sonuç bulunamadı</p>
        </div>
      )}
    </div>
  );
}
