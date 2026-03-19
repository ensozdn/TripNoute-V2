'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { notificationService } from '@/services/firebase/NotificationService'

interface NotificationBadgeProps {
  userId: string
}

export function NotificationBadge({ userId }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const loadCount = async () => {
      const count = await notificationService.getUnreadCount(userId)
      setUnreadCount(count)
    }

    loadCount()
    const interval = setInterval(loadCount, 30000)
    return () => clearInterval(interval)
  }, [userId])

  if (unreadCount === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900"
      >
        {unreadCount > 9 ? '9+' : unreadCount}
      </motion.div>
    </AnimatePresence>
  )
}
