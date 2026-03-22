'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { fcmTokenService } from '@/services/firebase/FCMTokenService'

interface NotificationPermissionProps {
  userId: string
  onClose?: () => void
}

export function NotificationPermission({ userId, onClose }: NotificationPermissionProps) {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if notifications are supported
    if (!fcmTokenService.isSupported()) {
      return undefined
    }

    // Check current permission status
    const permission = fcmTokenService.getPermissionStatus()
    
    // Show prompt if permission not decided yet
    if (permission === 'default') {
      // Show after 3 seconds
      const timer = setTimeout(() => {
        setShow(true)
      }, 3000)
      
      return () => clearTimeout(timer)
    }
    
    return undefined
  }, [])

  const handleAllow = async () => {
    setLoading(true)
    try {
      const token = await fcmTokenService.requestPermissionAndGetToken(userId)
      
      if (token) {
        console.log('✅ Push notifications enabled!')
        setShow(false)
        onClose?.()
      } else {
        console.error('Failed to enable push notifications')
      }
    } catch (error) {
      console.error('Error enabling notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = () => {
    setShow(false)
    onClose?.()
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>

            {/* Icon */}
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Bell className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  Enable Push Notifications
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Get notified when someone follows you or likes your post
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-2.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                Not Now
              </button>
              <button
                onClick={handleAllow}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enabling...' : 'Allow'}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
