'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Heart, Bookmark, MessageCircle, Navigation, Calendar } from 'lucide-react';
import { PostWithEngagement } from '@/types/explore';

interface TripCardProps {
  post: PostWithEngagement;
  index: number;
  isLiked: boolean;
  onLikeToggle: (postId: string) => void;
}

/**
 * Generate Mapbox Static API URL for trip route visualization
 */
const generateMapboxStaticUrl = (coordinates: Array<{ lat: number; lng: number }>, width = 600, height = 400): string => {
  if (!coordinates || coordinates.length === 0) {
    return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/0,20,1.5/${width}x${height}@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;
  }

  // Create path overlay for the route
  const pathCoordinates = coordinates
    .map(coord => `${coord.lng},${coord.lat}`)
    .join(',');
  
  // Add start and end markers
  const startMarker = coordinates[0] 
    ? `pin-s-a+3b82f6(${coordinates[0].lng},${coordinates[0].lat})`
    : '';
  const endMarker = coordinates[coordinates.length - 1]
    ? `pin-s-b+ef4444(${coordinates[coordinates.length - 1].lng},${coordinates[coordinates.length - 1].lat})`
    : '';

  // Calculate center and zoom
  const centerLng = coordinates.reduce((sum, c) => sum + c.lng, 0) / coordinates.length;
  const centerLat = coordinates.reduce((sum, c) => sum + c.lat, 0) / coordinates.length;
  
  // Mapbox Static API with path overlay
  const pathOverlay = `path-5+3b82f6-0.8(${pathCoordinates})`;
  
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${pathOverlay},${startMarker},${endMarker}/${centerLng},${centerLat},5,0/${width}x${height}@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;
};

export default function TripCard({ post, index, isLiked, onLikeToggle }: TripCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [mapUrl, setMapUrl] = useState('');

  // Generate map URL when component mounts or coordinates change
  useEffect(() => {
    // For trip posts, use trip coordinates
    if (post.type === 'trip' && post.photoUrls.length > 0) {
      // TODO: Get actual trip coordinates from trip data
      // For now, use location if available
      const coords = post.location ? [post.location.coordinates] : [];
      setMapUrl(generateMapboxStaticUrl(coords));
    } else if (post.type === 'place' && post.location) {
      // For place posts, show single location
      setMapUrl(generateMapboxStaticUrl([post.location.coordinates]));
    }
  }, [post]);

  // Calculate trip metadata
  const distance = post.type === 'trip' ? 0 : 0; // TODO: Calculate from actual trip data
  const duration = post.type === 'trip' ? 0 : 0; // TODO: Calculate from trip timestamps
  const isLive = false; // TODO: Check if trip is currently active

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.08,
        ease: [0.23, 1, 0.32, 1] // Custom easing for smooth entrance
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative bg-gradient-to-br from-slate-50 to-white rounded-3xl overflow-hidden shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10 transition-all duration-500"
    >
      {/* Map Preview with Route */}
      <div className="relative w-full h-80 overflow-hidden">
        <motion.div
          animate={{ 
            scale: isHovered ? 1.08 : 1,
          }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full h-full"
        >
          {mapUrl || post.photoUrls[0] ? (
            <img
              src={mapUrl || post.photoUrls[0]}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
              <MapPin className="w-16 h-16 text-white/30" strokeWidth={1.5} />
            </div>
          )}
        </motion.div>

        {/* Glassmorphism Overlay - Top (User Info) */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 + 0.2 }}
          className="absolute top-4 left-4 right-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/30 backdrop-blur-xl border border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              {post.userPhotoUrl ? (
                <img src={post.userPhotoUrl} alt={post.userName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">
                  {post.userName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-white text-sm font-semibold drop-shadow-lg">{post.userName}</span>
          </div>

          {/* Live indicator (if active) */}
          {isLive && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="px-3 py-1.5 rounded-full bg-red-500/90 backdrop-blur-xl border border-white/20 flex items-center gap-1.5"
            >
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white text-xs font-bold uppercase tracking-wide">Live</span>
            </motion.div>
          )}
        </motion.div>

        {/* Glassmorphism Overlay - Bottom (Metadata) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 + 0.3 }}
          className="absolute bottom-4 left-4 right-4"
        >
          <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-2xl border border-white/20 shadow-2xl">
            <h3 className="text-white text-xl font-bold mb-2 drop-shadow-lg line-clamp-2">
              {post.title}
            </h3>
            
            {/* Metadata Grid */}
            <div className="flex items-center gap-3 flex-wrap">
              {post.type === 'trip' && distance > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md">
                  <Navigation className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  <span className="text-white text-xs font-bold">{distance} km</span>
                </div>
              )}
              
              {post.type === 'trip' && duration > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md">
                  <Calendar className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  <span className="text-white text-xs font-bold">{duration} days</span>
                </div>
              )}

              {post.location && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/20 backdrop-blur-md">
                  <MapPin className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  <span className="text-white text-xs font-bold truncate max-w-[120px]">
                    {post.location.city || post.location.country}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Action bar */}
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={() => onLikeToggle(post.id)}
            className="flex items-center gap-2 active:scale-90 transition-transform group/like"
          >
            <motion.div
              animate={isLiked ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              <Heart
                className={`w-6 h-6 transition-colors ${
                  isLiked 
                    ? 'fill-red-500 text-red-500' 
                    : 'text-slate-400 group-hover/like:text-red-500'
                }`}
                strokeWidth={2}
              />
            </motion.div>
            <span className="text-slate-700 text-sm font-semibold">
              {post.likesCount}
            </span>
          </button>

          <button className="flex items-center gap-2 active:scale-90 transition-transform group/comment">
            <MessageCircle className="w-6 h-6 text-slate-400 group-hover/comment:text-blue-500 transition-colors" strokeWidth={2} />
            <span className="text-slate-700 text-sm font-semibold">
              {post.commentsCount}
            </span>
          </button>

          <button className="flex items-center gap-2 active:scale-90 transition-transform ml-auto group/save">
            <Bookmark className="w-6 h-6 text-slate-400 group-hover/save:text-amber-500 transition-colors" strokeWidth={2} />
          </button>
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="text-slate-700 text-sm leading-relaxed mb-2">
            <span className="font-semibold text-slate-900">{post.userName}</span>{' '}
            {post.caption}
          </p>
        )}

        {/* Timestamp */}
        <p className="text-slate-400 text-xs">
          {new Date(post.createdAt.seconds * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </div>
    </motion.div>
  );
}
