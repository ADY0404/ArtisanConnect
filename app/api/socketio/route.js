import { Server as SocketIOServer } from 'socket.io'
import { createServer } from 'http'

let io
let httpServer

export async function GET(request) {
  if (!global.io) {
    console.log('🚀 Setting up Socket.IO server...')
    
    // For Next.js 14 App Router, we need to handle this differently
    // We'll use WebSocket upgrades
    
    global.io = true
    
    return new Response('Socket.IO server setup initiated', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }

  return new Response('Socket.IO server already running', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}

// Handle WebSocket upgrade for Socket.IO
export async function UPGRADE(request) {
  console.log('🔄 WebSocket upgrade requested')
  
  if (!global.socketIOServer) {
    console.log('🚀 Creating Socket.IO server...')
    
    // Create Socket.IO server
    global.socketIOServer = new SocketIOServer({
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_APP_URL 
          : "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true
    })

    setupSocketHandlers(global.socketIOServer)
  }

  return new Response('WebSocket upgrade', {
    status: 101,
    headers: {
      'Upgrade': 'websocket',
      'Connection': 'Upgrade',
    },
  })
}

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('🔗 User connected:', socket.id)

    // Handle user authentication and room joining
    socket.on('authenticate', (data) => {
      const { userId, userRole, userName } = data
      socket.userId = userId
      socket.userRole = userRole
      socket.userName = userName
      
      // Join user to their personal room for direct notifications
      socket.join(`user_${userId}`)
      console.log(`✅ User ${userName} (${userId}) authenticated and joined personal room`)
    })

    // Handle joining booking-specific chat rooms
    socket.on('join_booking_chat', (data) => {
      const { bookingId, userId } = data
      const roomName = `booking_${bookingId}`
      
      socket.join(roomName)
      console.log(`💬 User ${socket.userName} joined booking chat: ${roomName}`)
      
      // Notify other participants that user joined
      socket.to(roomName).emit('user_joined_chat', {
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date()
      })
    })

    // Handle leaving booking chat rooms
    socket.on('leave_booking_chat', (data) => {
      const { bookingId } = data
      const roomName = `booking_${bookingId}`
      
      socket.leave(roomName)
      console.log(`👋 User ${socket.userName} left booking chat: ${roomName}`)
      
      // Notify other participants that user left
      socket.to(roomName).emit('user_left_chat', {
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date()
      })
    })

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { 
          bookingId, 
          message, 
          messageType = 'text',
          fileUrl = null,
          fileName = null 
        } = data
        
        const roomName = `booking_${bookingId}`
        
        // Create message object
        const messageData = {
          id: generateMessageId(),
          bookingId,
          senderId: socket.userId,
          senderName: socket.userName,
          senderRole: socket.userRole,
          message,
          messageType,
          fileUrl,
          fileName,
          timestamp: new Date(),
          isRead: false
        }

        console.log(`📨 Message sent in ${roomName}:`, messageData.message)

        // Broadcast message to all participants in the booking room
        io.to(roomName).emit('receive_message', messageData)
        
      } catch (error) {
        console.error('❌ Error handling message:', error)
        socket.emit('message_error', { 
          error: 'Failed to send message',
          details: error.message 
        })
      }
    })

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      const { bookingId } = data
      const roomName = `booking_${bookingId}`
      
      socket.to(roomName).emit('user_typing', {
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date()
      })
    })

    socket.on('typing_stop', (data) => {
      const { bookingId } = data
      const roomName = `booking_${bookingId}`
      
      socket.to(roomName).emit('user_stopped_typing', {
        userId: socket.userId
      })
    })

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User ${socket.userName || socket.id} disconnected:`, reason)
    })

    // Handle connection errors
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error)
    })
  })

  console.log('✅ Socket.IO server handlers configured')
}

// Helper function to generate unique message IDs
function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}