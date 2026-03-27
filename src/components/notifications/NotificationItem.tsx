'use client'

import { motion } from 'framer-motion'
import { Heart, UserPlus, MessageCircle, X, AtSign } from 'lucide-react'
import { Notification } from '@/types/notification'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { notificationService } from '@/services/firebase/NotificationService'
import { useState } from 'react'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: () => void
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const router = useRouter()
  const [marking, setMarking] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const getIcon = () => {
    switch (notification.type) {
      case 'follow': return <UserPlus className="w-4 h-4 text-white" />
      case 'like': return <Heart className="w-4 h-4 fill-white text-white" />
      case 'comment': return <MessageCircle className="w-4 h-4 text-white" />
      case 'mention': return <AtSign className="w-4 h-4 text-white" />
      default: return <UserPlus className="w-4 h-4 text-white" />
    }
  }

  const getBadgeColor = () => {
    switch (notification.type) {
      case 'follow': return 'bg-blue-500'
      case 'like': return 'bg-rose-500'
      case 'comment': return 'bg-green-500'
      case 'mention': return 'bg-purple-500'
      default: return 'bg-slate-500'
    }
  }

  const getActionText = () => {
    switch (notification.type) {
      case 'follow': return 'started following you'
      case 'like': return 'liked your post'
      case 'comment': return 'commented on your post'
      case 'mention': return 'mentioned you'
      default: return 'interacted with you'
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation
    if (deleting) return
    
    setDeleting(true)
    try {
      await notificationService.deleteNotification(notification.id)
    } catch (error) {
      console.error('Error deleting notification:', error)
      setDeleting(false)
    }
  }

  /* TODO: Uncomment when Profile/Post pages are ready
  const handleActionClick = async (e: React.MouseEvent, action: string) => {
    e.stopPropagation() // Prevent main click handler
    
    // Mark as read first
    if (!notification.isRead) {
      await notificationService.markAsRead(notification.id)
      onMarkAsRead?.()
    }
    
    // TODO: Redirect to actual pages when they're ready
    // For now, redirect to dashboard
    if (action === 'viewProfile') {
      // router.push(`/profile/${notification.senderId}`)
      router.push('/dashboard')
    } else if (action === 'viewPost' && notification.postId) {
      // router.push(`/post/${notification.postId}`)
      router.push('/dashboard')
    }
  }
  */

  const handleClick = async () => {
    if (marking) return
    
    setMarking(true)
    try {
      if (!notification.isRead) {
        await notificationService.markAsRead(notification.id)
        onMarkAsRead?.()
      }

      // TODO: Navigate to actual pages when they're ready
      // For now, all notifications redirect to dashboard
      router.push('/dashboard')
      
      /* Future implementation when pages are ready:
      if (notification.type === 'follow') {
        router.push(`/profile/${notification.senderId}`)
      } else if (notification.type === 'like' && notification.postId) {
        router.push(`/post/${notification.postId}`)
      } else if (notification.type === 'comment' && notification.postId) {
        const commentHash = notification.commentId ? `#comment-${notification.commentId}` : ''
        router.push(`/post/${notification.postId}${commentHash}`)
      } else {
        router.push('/dashboard')
      }
      */
    } catch (error) {
      console.error('Error handling notification click:', error)
    } finally {
      setMarking(false)
    }
  }

  const timeAgo = notification.createdAt
    ? formatDistanceToNow((notification.createdAt as any).toDate(), { addSuffix: true })
    : 'Just now'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleClick}
      className={`
        group relative flex items-start gap-3 p-4 cursor-pointer
        transition-colors duration-200
        hover:bg-slate-50 dark:hover:bg-slate-800/50
        ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
        border-b border-slate-200/50 dark:border-slate-700/50
      `}
    >
      {!notification.isRead && (
        <div className="absolute left-1.5 top-6 w-2 h-2 bg-blue-500 rounded-full" />
      )}

      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
          {notification.senderPhotoUrl ? (
            <img src={notification.senderPhotoUrl} alt={notification.senderName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500 font-semibold text-lg">
              {notification.senderName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center ${getBadgeColor()} ring-2 ring-white dark:ring-slate-900`}>
          {getIcon()}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm text-slate-900 dark:text-slate-100">
              <span className="font-semibold">{notification.senderName}</span>
              {' '}
              <span className="text-slate-600 dark:text-slate-400">{getActionText()}</span>
            </p>
            
            {notification.text && (
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                {notification.text}
              </p>
            )}
            
            <p className="mt-1 text-xs text-slate-500">{timeAgo}</p>

            {/* TODO: Action Buttons - Uncomment when Profile/Post pages are ready
            <div className="mt-2 flex items-center gap-2">
              {notification.type === 'follow' && (
                <button
                  onClick={(e) => handleActionClick(e, 'viewProfile')}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  View Profile
                </button>
              )}
              
              {(notification.type === 'like' || notification.type === 'comment') && notification.postId && (
                <button
                  onClick={(e) => handleActionClick(e, 'viewPost')}
                  className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                >
                  View Post
                </button>
              )}
            </div>
            */}
          </div>

          {notification.photoUrl && (
            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700">
              <img src={notification.photoUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-100/80 dark:bg-slate-700/80 hover:bg-red-100 dark:hover:bg-red-900/20 flex items-center justify-center transition-all backdrop-blur-sm"
      >
        <X className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-red-500" />
      </button>
    </motion.div>
  )
}
