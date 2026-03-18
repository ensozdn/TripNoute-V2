'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { notificationService } from '@/services/firebase/NotificationService'

export function NotificationDebug() {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    if (!user) return

    const loadDebug = async () => {
      try {
        const notifications = await notificationService.getNotifications(user.uid, { limit: 5 })
        const unreadCount = await notificationService.getUnreadCount(user.uid)
        
        setDebugInfo({
          userId: user.uid,
          email: user.email,
          notificationCount: notifications.length,
          unreadCount,
          notifications: notifications.map(n => ({
            id: n.id,
            type: n.type,
            sender: n.senderName,
            isRead: n.isRead,
            createdAt: n.createdAt ? new Date((n.createdAt as any).seconds * 1000).toISOString() : 'N/A'
          }))
        })
      } catch (error: any) {
        setDebugInfo({
          error: error.message,
          code: error.code,
          userId: user.uid,
        })
      }
    }

    loadDebug()
  }, [user])

  if (!user) return <div className="p-4 text-red-500">Not logged in</div>

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-md p-4 bg-black/90 text-white text-xs rounded-lg font-mono overflow-auto max-h-96">
      <div className="font-bold text-green-400 mb-2">🐛 NOTIFICATION DEBUG</div>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  )
}
