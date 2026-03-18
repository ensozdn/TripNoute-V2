'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, Compass } from 'lucide-react';
import TripCard from './TripCard';
import CategoryFilter, { TripCategory } from './CategoryFilter';
import LivePastToggle, { FeedMode } from './LivePastToggle';
import { PostWithEngagement } from '@/types/explore';
import { ExploreService } from '@/services/firebase/ExploreService';

interface TravelOSExploreProps {
  userId: string;
  userName: string;
  userPhotoUrl?: string;
}

const exploreService = new ExploreService();

export default function TravelOSExplore({ userId, userName, userPhotoUrl }: TravelOSExploreProps) {
  const [posts, setPosts] = useState<PostWithEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<TripCategory>('all');
  const [feedMode, setFeedMode] = useState<FeedMode>('past');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Load posts on mount and when filters change
  useEffect(() => {
    loadPosts();
  }, [activeCategory, feedMode]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = await exploreService.getExploreFeed(userId, {
        limit: 20,
        followingOnly: false
      });

      // TODO: Apply category and feedMode filters
      // For now, show all posts
      setPosts(fetchedPosts);
      
      // Initialize liked posts set
      const liked = new Set(
        fetchedPosts.filter(p => p.isLikedByCurrentUser).map(p => p.id)
      );
      setLikedPosts(liked);
    } catch (error) {
      console.error('❌ Failed to load explore feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = async (postId: string) => {
    const isCurrentlyLiked = likedPosts.has(postId);
    
    // Optimistic update
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });

    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            likesCount: isCurrentlyLiked ? post.likesCount - 1 : post.likesCount + 1,
            isLikedByCurrentUser: !isCurrentlyLiked
          }
        : post
    ));

    // Backend update
    try {
      if (isCurrentlyLiked) {
        await exploreService.unlikePost(postId, userId);
      } else {
        await exploreService.likePost(postId, userId, userName, userPhotoUrl);
      }
    } catch (error) {
      console.error('❌ Failed to toggle like:', error);
      // Revert on error
      setLikedPosts(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyLiked) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likesCount: isCurrentlyLiked ? post.likesCount + 1 : post.likesCount - 1,
              isLikedByCurrentUser: isCurrentlyLiked
            }
          : post
      ));
    }
  };

  const handleCategoryChange = (category: TripCategory) => {
    setActiveCategory(category);
  };

  const handleModeChange = (mode: FeedMode) => {
    setFeedMode(mode);
  };

  // Count live trips (TODO: implement based on actual trip status)
  const liveCount = 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      {/* Hero Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Travel OS</h1>
              <p className="text-slate-500 text-sm">Discover journeys through geospatial intelligence</p>
            </div>
          </motion.div>

          {/* Live/Past Toggle */}
          <div className="flex justify-center mb-6">
            <LivePastToggle 
              mode={feedMode} 
              onModeChange={handleModeChange}
              liveCount={liveCount}
            />
          </div>

          {/* Category Filter */}
          <CategoryFilter 
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      </div>

      {/* Feed Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" strokeWidth={2.5} />
            <p className="text-slate-600 font-medium">Loading journeys...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-4">
              <Compass className="w-10 h-10 text-blue-600" strokeWidth={2} />
            </div>
            <p className="text-slate-600 font-semibold text-lg mb-2">No journeys yet</p>
            <p className="text-slate-500 text-sm">
              {feedMode === 'live' 
                ? 'No travelers are currently on the road' 
                : 'Start sharing your adventures to see them here'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {posts.map((post, index) => (
                <TripCard
                  key={post.id}
                  post={post}
                  index={index}
                  isLiked={likedPosts.has(post.id)}
                  onLikeToggle={handleLikeToggle}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
