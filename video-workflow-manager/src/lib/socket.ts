'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'
    
    socket = io(SOCKET_URL, {
      autoConnect: false,
    })
    
    socket.on('connect', () => {
      console.log('Socket connected:', socket?.id)
    })
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })
  }
  
  return socket
}

export const connectSocket = (token: string) => {
  const socketInstance = getSocket()
  
  socketInstance.auth = { token }
  socketInstance.connect()
  
  return socketInstance
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}