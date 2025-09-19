'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'
import { connectSocket, disconnectSocket, getSocket } from '@/lib/socket'
import { useAuth } from './AuthContext'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token')
      if (token) {
        const socketInstance = connectSocket(token)
        setSocket(socketInstance)

        socketInstance.on('connect', () => {
          setIsConnected(true)
        })

        socketInstance.on('disconnect', () => {
          setIsConnected(false)
        })

        // Listen for real-time updates
        socketInstance.on('task_status_changed', (data) => {
          console.log('Task status changed:', data)
          // Emit custom event that components can listen to
          window.dispatchEvent(new CustomEvent('taskStatusChanged', { detail: data }))
        })

        socketInstance.on('task_assigned', (data) => {
          console.log('Task assigned:', data)
          window.dispatchEvent(new CustomEvent('taskAssigned', { detail: data }))
        })

        socketInstance.on('project_updated', (data) => {
          console.log('Project updated:', data)
          window.dispatchEvent(new CustomEvent('projectUpdated', { detail: data }))
        })
      }
    } else {
      // User logged out, disconnect socket
      disconnectSocket()
      setSocket(null)
      setIsConnected(false)
    }

    return () => {
      if (socket) {
        socket.off('connect')
        socket.off('disconnect')
        socket.off('task_status_changed')
        socket.off('task_assigned')
        socket.off('project_updated')
      }
    }
  }, [user])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

// Utility function to emit task updates
export const emitTaskUpdate = (data: {
  taskId: string
  taskTitle: string
  status: string
  assignedToId?: string
  clientId?: string
}) => {
  const socket = getSocket()
  if (socket && socket.connected) {
    socket.emit('task_updated', data)
  }
}