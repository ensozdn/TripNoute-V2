'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { fcmTokenService } from '@/services/firebase/FCMTokenService'
import { useAuth } from '@/contexts/AuthContext'

export function NotificationPermissionPrompt() {
  const { user } = useAuth()
  const [showPrompt, setShowPrompt] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)

  useEffect(() => {
    checkPermissionStatus()
  }, [user])

  const checkPermissionStatus = async () => {
    if (!user) return

    const { supported, permission } = await fcmTokenService.checkNotificationSupport()

    // Show prompt if notifications are supported but not granted yet
    if (supported && permission === 'default') {
      // Wait 3 seconds before showing prompt (better UX)
      setTimeout(() => {
        setShowPrompt(true)
      }, 3000)
    }
  }

  const handleEnableNotifications = async () => {
    if (!user) return

    setIsRequesting(true)

    try {
      const token = await fcmTokenService.requestPermissionAndGetToken(user.uid)

      if (token) {
        console.log('✅ Push notifications enabled!')
        
        // Setup foreground message listener
        fcmTokenService.setupForegroundMessageListener((payload) => {
          console.log('🔔 Notification received in foreground:', payload)
          // You can show a toast notification here if you want
        })
        
        setShowPrompt(false)
      } else {
        console.log('⚠️ Failed to get FCM token')
      }
    } catch (error) {
      console.error('❌ Error enabling notifications:', error)
    } finally {
      setIsRequesting(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Store in localStorage to not show again for a while
    localStorage.setItem('notification-prompt-dismissed', Date.now().toString())
  }

  if (!showPrompt) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 border border-slate-200 dark:border-slate-700">
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>

          {/* Icon */}
          <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
            <Bell className="w-6 h-6 text-blue-500" />
          </div>

          {/* Content */}
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">
            Stay Updated! 🔔
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Enable notifications to get instant updates when someone follows you, likes your posts, or comments on your journey.
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleEnableNotifications}
              disabled={isRequesting}
              className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRequesting ? 'Enabling...' : 'Enable Notifications'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
