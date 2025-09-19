const { createServer } = require('http')
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')

const server = createServer()
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true
  }
})

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'

// Middleware to authenticate socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth.token
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'))
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    socket.userId = decoded.userId
    socket.userRole = decoded.role
    socket.userName = decoded.name
    next()
  } catch (err) {
    next(new Error('Authentication error: Invalid token'))
  }
})

// Store user socket mappings
const userSockets = new Map()

io.on('connection', (socket) => {
  console.log(`User ${socket.userName} (${socket.userRole}) connected: ${socket.id}`)
  
  // Store the user's socket connection
  userSockets.set(socket.userId, socket.id)
  
  // Join role-based rooms
  socket.join(socket.userRole.toLowerCase())
  
  // Admin and managers can see all updates
  if (socket.userRole === 'ADMIN' || socket.userRole === 'MANAGER') {
    socket.join('admin_updates')
  }
  
  // Handle task status updates
  socket.on('task_updated', (data) => {
    console.log(`Task ${data.taskId} updated by ${socket.userName}`)
    
    // Broadcast to all admin/managers
    socket.to('admin_updates').emit('task_status_changed', {
      taskId: data.taskId,
      newStatus: data.status,
      updatedBy: socket.userName,
      timestamp: new Date().toISOString()
    })
    
    // If task is assigned to an editor, notify that specific editor
    if (data.assignedToId) {
      const editorSocketId = userSockets.get(data.assignedToId)
      if (editorSocketId) {
        io.to(editorSocketId).emit('task_assigned', {
          taskId: data.taskId,
          taskTitle: data.taskTitle,
          assignedBy: socket.userName,
          timestamp: new Date().toISOString()
        })
      }
    }
    
    // Notify client if task affects their project
    if (data.clientId) {
      const clientSocketId = userSockets.get(data.clientId)
      if (clientSocketId) {
        io.to(clientSocketId).emit('project_updated', {
          taskId: data.taskId,
          taskTitle: data.taskTitle,
          newStatus: data.status,
          timestamp: new Date().toISOString()
        })
      }
    }
  })
  
  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log(`User ${socket.userName} disconnected: ${socket.id}`)
    userSockets.delete(socket.userId)
  })
  
  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error)
  })
})

const PORT = process.env.SOCKET_PORT || 3001

server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})