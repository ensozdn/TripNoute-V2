'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check } from 'lucide-react'
import { Notification } from '@/types/notification'
import { notificationService } from '@/services/firebase/NotificationService'
import { NotificationItem } from './NotificationItem'

interface NotificationsListProps {
  userId: string
}

export function NotificationsList({ userId }: NotificationsListProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [marking, setMarking] = useState(false)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)

  // Load notifications
  const loadNotifications = async (isInitial = true) => {
    try {
      if (isInitial) {
        setLoading(true)
      }

      const options = {
        limit: 20,
        cursor: isInitial ? undefined : lastDoc,
      }

      const newNotifications = await notificationService.getNotifications(userId, options)
      
      if (isInitial) {
        setNotifications(newNotifications)
      } else {
        setNotifications((prev) => [...prev, ...newNotifications])
      }

      // Update pagination state
      setHasMore(newNotifications.length === 20)
      if (newNotifications.length > 0) {
        setLastDoc(newNotifications[newNotifications.length - 1])
      }
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadNotifications(true)
  }, [userId])

  // Mark all as read
  const handleMarkAllRead = async () => {
    if (marking) return
    
    setMarking(true)
    try {
      await notificationService.markAllAsRead(userId)
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      )
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    } finally {
      setMarking(false)
    }
  }

  // Handle individual mark as read
  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
    )
  }

  // Group notifications by time
  const groupedNotifications = notificationService.groupByTime(notifications)

  // Render time group
  const renderTimeGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null

    return (
      <div key={title} className="mb-6">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 px-4 mb-2">
          {title}
        </h3>
        <div className="space-y-0">
          <AnimatePresence mode="popLayout">
            {items.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.05 }}
              >
                <NotificationItem
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Loading notifications...
        </p>
      </div>
    )
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4"
        >
          <Bell className="w-12 h-12 text-slate-400 dark:text-slate-600" />
        </motion.div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          No notifications yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-xs">
          When someone follows you, likes your post, or interacts with your content, you'll see it here.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Notifications
          </h2>
          
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              disabled={marking}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full
                transition-all duration-200
                ${marking
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:scale-95'
                }
              `}
            >
              <Check className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <div className="flex-1 overflow-y-auto">
        {renderTimeGroup('Today', groupedNotifications.today)}
        {renderTimeGroup('Yesterday', groupedNotifications.yesterday)}
        {renderTimeGroup('This Week', groupedNotifications.thisWeek)}
        {renderTimeGroup('Earlier', groupedNotifications.earlier)}

        {/* Load more button */}
        {hasMore && (
          <div className="px-4 py-6 flex justify-center">
            <button
              onClick={() => loadNotifications(false)}
              className="px-6 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 
                       hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full
                       transition-all duration-200 active:scale-95"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
