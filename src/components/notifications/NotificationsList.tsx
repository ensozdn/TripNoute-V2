'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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

  useEffect(() => {
    loadNotifications()
  }, [userId])

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const data = await notificationService.getNotifications(userId, 50)
      setNotifications(data)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    } finally {
      setLoading(false)
    }
  }

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
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <NotificationItem
              notification={notification}
              onMarkAsRead={() => handleMarkAsRead(notification.id)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
