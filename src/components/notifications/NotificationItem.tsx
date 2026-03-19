'use client'

import { motion } from 'framer-motion'
import { Heart, UserPlus } from 'lucide-react'
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

  const getIcon = () => {
    switch (notification.type) {
      case 'follow': return <UserPlus className="w-4 h-4 text-white" />
      case 'like': return <Heart className="w-4 h-4 fill-white text-white" />
      default: return <UserPlus className="w-4 h-4 text-white" />
    }
  }

  const getBadgeColor = () => {
    switch (notification.type) {
      case 'follow': return 'bg-blue-500'
      case 'like': return 'bg-rose-500'
      default: return 'bg-slate-500'
    }
  }

  const getActionText = () => {
    switch (notification.type) {
      case 'follow': return 'started following you'
      case 'like': return 'liked your post'
      default: return 'interacted with you'
    }
  }

  const handleClick = async () => {
    if (marking) return
    
    setMarking(true)
    try {
      if (!notification.isRead) {
        await notificationService.markAsRead(notification.id)
        onMarkAsRead?.()
      }

      if (notification.type === 'follow') {
        router.push(`/profile/${notification.senderId}`)
      } else if (notification.type === 'like' && notification.postId) {
        router.push(`/post/${notification.postId}`)
      }
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
        relative flex items-start gap-3 p-4 cursor-pointer
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
          </div>

          {notification.photoUrl && (
            <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700">
              <img src={notification.photoUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
