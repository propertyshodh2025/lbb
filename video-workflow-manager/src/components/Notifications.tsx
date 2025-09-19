'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { X, CheckCircle, Clock, Users } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

interface Notification {
  id: string
  type: 'task_assigned' | 'task_status_changed' | 'project_updated'
  title: string
  message: string
  timestamp: string
  read: boolean
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    // Listen for custom events from Socket context
    const handleTaskStatusChanged = (event: CustomEvent) => {
      const data = event.detail
      addNotification({
        type: 'task_status_changed',
        title: 'Task Status Updated',
        message: `Task status changed to ${data.newStatus} by ${data.updatedBy}`,
        timestamp: data.timestamp,
      })
    }

    const handleTaskAssigned = (event: CustomEvent) => {
      const data = event.detail
      addNotification({
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `${data.taskTitle} has been assigned to you by ${data.assignedBy}`,
        timestamp: data.timestamp,
      })
    }

    const handleProjectUpdated = (event: CustomEvent) => {
      const data = event.detail
      addNotification({
        type: 'project_updated',
        title: 'Project Update',
        message: `${data.taskTitle} status changed to ${data.newStatus}`,
        timestamp: data.timestamp,
      })
    }

    window.addEventListener('taskStatusChanged', handleTaskStatusChanged)
    window.addEventListener('taskAssigned', handleTaskAssigned)
    window.addEventListener('projectUpdated', handleProjectUpdated)

    return () => {
      window.removeEventListener('taskStatusChanged', handleTaskStatusChanged)
      window.removeEventListener('taskAssigned', handleTaskAssigned)
      window.removeEventListener('projectUpdated', handleProjectUpdated)
    }
  }, [])

  const addNotification = (notification: Omit<Notification, 'id' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
    }
    setNotifications(prev => [newNotification, ...prev].slice(0, 10)) // Keep only latest 10
    setShowNotifications(true)
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned':
        return <Users className="w-4 h-4 text-blue-600" />
      case 'task_status_changed':
        return <Clock className="w-4 h-4 text-orange-600" />
      case 'project_updated':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  if (!user) return null

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative"
      >
        <Clock className="w-4 h-4 mr-2" />
        Updates
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>

      {showNotifications && (
        <div className="absolute top-full right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border rounded-lg shadow-lg z-50">
          <div className="p-3 border-b bg-gray-50">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Real-time Updates</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNotifications(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No new updates
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-gray-50 ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                          className="h-6 px-2"
                        >
                          Mark read
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissNotification(notification.id)}
                        className="h-6 px-2"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}