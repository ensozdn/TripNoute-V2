'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Place } from '@/types';
import {
  Calendar, Camera, MoreVertical, Edit2, Trash2,
  Plane, Car, Bus, Train, Ship, Footprints, MapPin, Plus,
} from 'lucide-react';

interface TravelTimelineProps {
  places: Place[];
  selectedPlaceId?: string | null;
  onPlaceSelect: (place: Place) => void;
  onPlaceDelete?: (placeId: string) => Promise<void>;
  onPlaceEdit?: (place: Place) => void;
  onAddPlace?: () => void;
  className?: string;
}

const TRANSPORT_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  flight:  { icon: <Plane      className="w-3 h-3" />, label: 'Flight', color: '#a78bfa' },
  car:     { icon: <Car        className="w-3 h-3" />, label: 'Car',    color: '#34d399' },
  bus:     { icon: <Bus        className="w-3 h-3" />, label: 'Bus',    color: '#fbbf24' },
  train:   { icon: <Train      className="w-3 h-3" />, label: 'Train',  color: '#fbbf24' },
  ship:    { icon: <Ship       className="w-3 h-3" />, label: 'Ship',   color: '#38bdf8' },
  walking: { icon: <Footprints className="w-3 h-3" />, label: 'Walk',   color: '#fb923c' },
  walk:    { icon: <Footprints className="w-3 h-3" />, label: 'Walk',   color: '#fb923c' },
};

const CATEGORY_EMOJI: Record<string, string> = {
  restaurant: '🍽️', hotel: '🏨', attraction: '🎡', museum: '🏛️',
  park: '🌿', beach: '🏖️', mountain: '⛰️', city: '🏙️',
  landmark: '🗺️', other: '📍',
};

export default function TravelTimeline({
  places,
  selectedPlaceId,
  onPlaceSelect,
  onPlaceDelete,
  onPlaceEdit,
  onAddPlace,
  className = '',
}: TravelTimelineProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [deletingPlaceId, setDeletingPlaceId] = useState<string | null>(null);

  const sortedPlaces = [...places].sort((a, b) => {
    const dateA = a.visitDate?.seconds || 0;
    const dateB = b.visitDate?.seconds || 0;
    return dateA - dateB;
  });

  useEffect(() => {
    if (selectedPlaceId) {
      const el = document.getElementById(`timeline-place-${selectedPlaceId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedPlaceId]);

  useEffect(() => {
    const handleClickOutside = () => { if (openMenuId) setOpenMenuId(null); };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const formatDate = (timestamp: { seconds: number }) => {
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDelete = async (place: Place, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    if (!onPlaceDelete) return;
    const confirmed = window.confirm(`Delete "${place.title}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;
    setDeletingPlaceId(place.id);
    try {
      await onPlaceDelete(place.id);
    } catch {
      alert('Failed to delete place. Please try again.');
    } finally {
      setDeletingPlaceId(null);
    }
  };

  const handleEdit = (place: Place, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    if (onPlaceEdit) onPlaceEdit(place);
  };

  const toggleMenu = (placeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (openMenuId === placeId) {
      setOpenMenuId(null);
      setMenuPosition(null);
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMenuPosition({ x: rect.right, y: rect.bottom + 8 });
      setOpenMenuId(placeId);
    }
  };

  if (sortedPlaces.length === 0) {
    return (
      <div className={`relative ${className}`}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center justify-center py-16 px-4 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-white/20" strokeWidth={1.5} />
          </div>
          <p className="text-white/60 text-base font-medium mb-1">No places yet</p>
          <p className="text-white/25 text-sm mb-6 leading-relaxed max-w-[220px]">
            Start adding the places you've visited to build your travel timeline
          </p>
          {onAddPlace && (
            <button
              onClick={onAddPlace}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              Add First Place
            </button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h3 className="text-sm font-bold text-white">Your Journey</h3>
          <p className="text-xs text-white/50 mt-0.5">
            {sortedPlaces.length} {sortedPlaces.length === 1 ? 'stop' : 'stops'} &middot;{' '}
            {new Set(sortedPlaces.map(p => p.address.country)).size}{' '}
            {new Set(sortedPlaces.map(p => p.address.country)).size === 1 ? 'country' : 'countries'}
          </p>
        </div>
        {onAddPlace && (
          <button
            onClick={onAddPlace}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/15 border border-blue-500/25 text-blue-400 text-xs font-semibold hover:bg-blue-500/25 hover:border-blue-500/40 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            Add Place
          </button>
        )}
      </div>

      {/* Vertical timeline */}
      <div className="relative">

        {/* Central vertical line */}
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-blue-500/80 via-purple-500/50 to-blue-500/10" style={{ zIndex: 0 }} />

        <div className="space-y-1 relative">
          {sortedPlaces.map((place, index) => {
            const isSelected = place.id === selectedPlaceId;
            const isLast = index === sortedPlaces.length - 1;
            const nextPlace = !isLast ? sortedPlaces[index + 1] : null;
            const transportCfg = place.transportType ? TRANSPORT_CONFIG[place.transportType] : null;
            const hasPhoto = place.photos && place.photos.length > 0 && place.photos[0]?.url;
            const categoryEmoji = place.category ? (CATEGORY_EMOJI[place.category] ?? '📍') : '📍';

            return (
              <div key={place.id} id={`timeline-place-${place.id}`}>

                {/* Place row */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.22 }}
                  className="flex items-start gap-4 relative z-10"
                >
                  {/* Node */}
                  <div className="relative shrink-0 mt-2 z-10">
                    {hasPhoto ? (
                      <div
                        className={`relative w-8 h-8 rounded-full transition-all duration-300 ${
                          isSelected
                            ? 'ring-2 ring-blue-400 shadow-md shadow-blue-500/40 scale-110'
                            : 'ring-1 ring-white/20 hover:ring-blue-400/50 hover:scale-105'
                        }`}
                      >
                        <Image
                          src={place.photos[0].url}
                          alt={place.title}
                          fill
                          className="rounded-full object-cover"
                          unoptimized
                        />
                        {isSelected && (
                          <span className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />
                        )}
                      </div>
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 ${
                          isSelected
                            ? 'bg-blue-500/25 ring-2 ring-blue-400 shadow-md shadow-blue-500/30 scale-110'
                            : 'bg-white/10 ring-1 ring-white/20 hover:ring-blue-400/40 hover:scale-105'
                        }`}
                      >
                        {categoryEmoji}
                        {isSelected && (
                          <span className="absolute inset-0 rounded-full bg-blue-400/10 animate-ping" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card */}
                  <div className="flex-1 min-w-0 relative z-10">
                    {(onPlaceEdit || onPlaceDelete) && (
                      <button
                        onClick={(e) => toggleMenu(place.id, e)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-white/8 hover:bg-white/15 transition-all z-20"
                      >
                        <MoreVertical className="w-3 h-3 text-white/60" />
                      </button>
                    )}

                    {deletingPlaceId === place.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl z-10">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      </div>
                    )}

                    <button
                      onClick={() => onPlaceSelect(place)}
                      disabled={deletingPlaceId === place.id}
                      className={`w-full text-left rounded-2xl transition-all duration-300 overflow-hidden ${
                        deletingPlaceId === place.id
                          ? 'opacity-40 cursor-not-allowed'
                          : isSelected
                            ? 'bg-blue-500/15 ring-1 ring-blue-400/50 shadow-lg shadow-blue-500/20'
                            : 'hover:bg-white/5'
                      }`}
                    >
                      {/* Photo strip */}
                      {hasPhoto && (
                        <div className="relative w-full h-24 overflow-hidden">
                          <Image
                            src={place.photos[0].url}
                            alt={place.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />
                          {place.photos.length > 1 && (
                            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2 py-0.5">
                              <Camera className="w-3 h-3 text-white/80" />
                              <span className="text-[10px] text-white/80 font-medium">{place.photos.length}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Text */}
                      <div className="p-3">
                        <h4 className="text-sm font-semibold text-white leading-tight pr-6 mb-1">
                          {place.title}
                        </h4>
                        <div className="flex items-center gap-1 text-white/50 text-xs mb-2">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {place.address.city && place.address.country
                              ? `${place.address.city}, ${place.address.country}`
                              : place.address.city || place.address.country || place.address.formatted || ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-white/35 text-[11px]">
                          <Calendar className="w-3 h-3 shrink-0" />
                          <span>{formatDate(place.visitDate)}</span>
                        </div>
                      </div>
                    </button>
                  </div>
                </motion.div>

                {/* Transport connector */}
                {nextPlace && (
                  <div className="flex items-center gap-3 my-1">
                    <div className="w-8 shrink-0 flex justify-center z-10">
                      {transportCfg ? (
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: `${transportCfg.color}22`,
                            color: transportCfg.color,
                            border: `1px solid ${transportCfg.color}44`,
                          }}
                        >
                          {transportCfg.icon}
                        </div>
                      ) : (
                        <div className="w-px h-4 bg-white/10" />
                      )}
                    </div>
                    {transportCfg && (
                      <div className="flex items-center gap-1.5 text-[11px]" style={{ color: transportCfg.color }}>
                        <span className="font-medium">{transportCfg.label}</span>
                        <span className="text-white/20">→</span>
                        <span className="text-white/40 truncate max-w-[120px]">
                          {nextPlace.address.city || nextPlace.title}
                        </span>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      </div>

      {/* Context menu */}
      {openMenuId && menuPosition && (
        <div
          className="fixed w-36 bg-[#1e293b] border border-white/10 rounded-xl shadow-[0_8px_16px_rgba(0,0,0,0.5)] overflow-hidden z-[100]"
          style={{ top: menuPosition.y, left: menuPosition.x - 144 }}
        >
          <div className="p-1">
            {onPlaceEdit && (() => {
              const place = places.find(p => p.id === openMenuId);
              if (!place) return null;
              return (
                <button
                  onClick={(e) => handleEdit(place, e)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-200 hover:bg-white/5 hover:text-white rounded-lg transition-all"
                >
                  <Edit2 className="w-4 h-4 text-blue-400" />
                  <span className="font-medium">Edit</span>
                </button>
              );
            })()}
            {onPlaceDelete && (() => {
              const place = places.find(p => p.id === openMenuId);
              if (!place) return null;
              return (
                <button
                  onClick={(e) => handleDelete(place, e)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-200 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all"
                >
                  <Trash2 className="w-4 h-4 text-red-500/70" />
                  <span className="font-medium">Delete</span>
                </button>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
