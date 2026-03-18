'use client'

import { motion } from 'framer-motion'
import { Heart, MessageCircle, AtSign, MapPin, Award, UserPlus, Check } from 'lucide-react'
import { Notification } from '@/types/notification'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { notificationService } from '@/services/firebase/NotificationService'
import { followService } from '@/services/firebase/FollowService'
import { useState } from 'react'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Icon mapping by notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'follow':
        return <UserPlus className="w-4 h-4" />
      case 'like':
        return <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
      case 'comment':
        return <MessageCircle className="w-4 h-4" />
      case 'mention':
        return <AtSign className="w-4 h-4" />
      case 'trip_start':
        return <MapPin className="w-4 h-4" />
      case 'milestone':
        return <Award className="w-4 h-4" />
    }
  }

  // Badge color by notification type
  const getBadgeColor = () => {
    switch (notification.type) {
      case 'follow':
        return 'bg-blue-500'
      case 'like':
        return 'bg-rose-500'
      case 'comment':
        return 'bg-green-500'
      case 'mention':
        return 'bg-purple-500'
      case 'trip_start':
        return 'bg-amber-500'
      case 'milestone':
        return 'bg-yellow-500'
    }
  }

  // Action text by notification type
  const getActionText = () => {
    switch (notification.type) {
      case 'follow':
        return 'started following you'
      case 'like':
        return 'liked your post'
      case 'comment':
        return 'commented on your post'
      case 'mention':
        return 'mentioned you in a post'
      case 'trip_start':
        return 'started a new trip'
      case 'milestone':
        return 'reached a milestone'
    }
  }

  // Handle notification click - navigate and mark as read
  const handleClick = async () => {
    // Mark as read if unread
    if (!notification.isRead) {
      await notificationService.markAsRead(notification.id, notification.recipientId)
      onMarkAsRead?.(notification.id)
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'follow':
        router.push(`/profile/${notification.senderId}`)
        break
      case 'like':
      case 'comment':
      case 'mention':
        if (notification.postId) {
          router.push(`/post/${notification.postId}`)
        }
        break
      case 'trip_start':
      case 'milestone':
        if (notification.tripId) {
          router.push(`/trip/${notification.tripId}`)
        }
        break
    }
  }

  // Handle follow back
  const handleFollowBack = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent notification click
    
    if (isProcessing) return
    
    setIsProcessing(true)
    try {
      await followService.followUser(notification.recipientId, notification.senderId)
      setIsFollowing(true)
    } catch (error) {
      console.error('Failed to follow user:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Time ago display
  const timeAgo = notification.createdAt
    ? formatDistanceToNow((notification.createdAt as any).toDate(), { addSuffix: true })
    : 'Just now'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className={`
        relative flex items-start gap-3 p-4 cursor-pointer
        transition-colors duration-200
        hover:bg-slate-50 dark:hover:bg-slate-800/50
        ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
        border-b border-slate-200/50 dark:border-slate-700/50
      `}
    >
      {/* Unread indicator dot */}
      {!notification.isRead && (
        <div className="absolute left-1.5 top-6 w-2 h-2 bg-blue-500 rounded-full" />
      )}

      {/* Avatar with type badge */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
          {notification.senderPhotoUrl ? (
            <img
              src={notification.senderPhotoUrl}
              alt={notification.senderName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 font-semibold text-lg">
              {notification.senderName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        {/* Type badge overlay */}
        <div className={`
          absolute -bottom-1 -right-1 w-6 h-6 rounded-full
          flex items-center justify-center text-white
          ${getBadgeColor()}
          ring-2 ring-white dark:ring-slate-900
        `}>
          {getIcon()}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm text-slate-900 dark:text-slate-100">
              <span className="font-semibold">{notification.senderName}</span>
              {' '}
              <span className="text-slate-600 dark:text-slate-400">
                {getActionText()}
              </span>
            </p>
            
            {/* Additional text (comment text, caption excerpt) */}
            {notification.text && (
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                {notification.text}
              </p>
            )}
            
            {/* Time ago */}
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
              {timeAgo}
            </p>
          </div>

          {/* Preview image */}
          {notification.photoUrl && (
            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700">
              <img
                src={notification.photoUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Action button (Follow Back) */}
        {notification.type === 'follow' && !isFollowing && (
          <button
            onClick={handleFollowBack}
            disabled={isProcessing}
            className={`
              mt-3 px-4 py-1.5 text-sm font-medium rounded-full
              transition-all duration-200
              ${isProcessing
                ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
              }
            `}
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full"
                />
                Following...
              </span>
            ) : (
              'Follow Back'
            )}
          </button>
        )}

        {isFollowing && notification.type === 'follow' && (
          <div className="mt-3 px-4 py-1.5 text-sm font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 inline-flex items-center gap-1.5">
            <Check className="w-3 h-3" />
            Following
          </div>
        )}
      </div>
    </motion.div>
  )
}
