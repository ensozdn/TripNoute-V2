'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Bell, Check, Loader2 } from 'lucide-react'
import { Notification } from '@/types/notification'
import { notificationService } from '@/services/firebase/NotificationService'
import { NotificationItem } from './NotificationItem'
import { 
  isToday, 
  isThisWeek 
} from 'date-fns'
import { QueryDocumentSnapshot } from 'firebase/firestore'

interface NotificationsListProps {
  userId: string
}

interface GroupedNotifications {
  today: Notification[]
  thisWeek: Notification[]
  earlier: Notification[]
}

export function NotificationsList({ userId }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null)
  const observerTarget = useRef(null)

  useEffect(() => {
    // Real-time listener için unsubscribe fonksiyonu
    const unsubscribe = notificationService.subscribeToNotifications(
      userId,
      (updatedNotifications) => {
        setNotifications(updatedNotifications)
        setLoading(false)
      },
      (error) => {
        console.error('Failed to load notifications:', error)
        setLoading(false)
      },
      20 // Initial load: 20 notifications
    )

    // Cleanup: Component unmount olduğunda listener'ı kaldır
    return () => unsubscribe()
  }, [userId])

  // Group notifications by time
  const groupedNotifications: GroupedNotifications = notifications.reduce(
    (groups, notification) => {
      const notificationDate = (notification.createdAt as any)?.toDate()
      
      if (!notificationDate) {
        groups.earlier.push(notification)
        return groups
      }

      if (isToday(notificationDate)) {
        groups.today.push(notification)
      } else if (isThisWeek(notificationDate, { weekStartsOn: 1 })) {
        groups.thisWeek.push(notification)
      } else {
        groups.earlier.push(notification)
      }

      return groups
    },
    { today: [], thisWeek: [], earlier: [] } as GroupedNotifications
  )

  const handleMarkAllRead = async () => {
    if (marking) return
    
    setMarking(true)
    try {
      await notificationService.markAllAsRead(userId)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setMarking(false)
    }
  }

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    )
  }

  const loadMoreNotifications = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const result = await notificationService.getNotificationsPaginated(
        userId,
        20,
        lastDoc || undefined
      )

      if (result.notifications.length > 0) {
        setNotifications(prev => [...prev, ...result.notifications])
        setLastDoc(result.lastDoc)
        setHasMore(result.hasMore)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load more notifications:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4"
        >
          <Bell className="w-12 h-12 text-slate-400" />
        </motion.div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          No notifications yet
        </h3>
        <p className="text-sm text-slate-500 text-center max-w-xs">
          When someone follows you or likes your post, you'll see it here.
        </p>
      </div>
    )
  }

  const hasUnread = notifications.some(n => !n.isRead)

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Notifications
          </h2>
          
          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              disabled={marking}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full text-blue-600 hover:bg-blue-50 transition-all"
            >
              <Check className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Today Section */}
        {groupedNotifications.today.length > 0 && (
          <div className="mb-6">
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-4 py-2 z-10">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Today
              </h3>
            </div>
            {groupedNotifications.today.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* This Week Section */}
        {groupedNotifications.thisWeek.length > 0 && (
          <div className="mb-6">
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-4 py-2 z-10">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                This Week
              </h3>
            </div>
            {groupedNotifications.thisWeek.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Earlier Section */}
        {groupedNotifications.earlier.length > 0 && (
          <div className="mb-6">
            <div className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm px-4 py-2 z-10">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Earlier
              </h3>
            </div>
            {groupedNotifications.earlier.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && notifications.length > 0 && (
          <div className="flex justify-center py-6">
            <button
              onClick={loadMoreNotifications}
              disabled={loadingMore}
              className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load More'
              )}
            </button>
          </div>
        )}

        {/* No More Notifications */}
        {!hasMore && notifications.length > 0 && (
          <div className="flex justify-center py-6">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No more notifications
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
