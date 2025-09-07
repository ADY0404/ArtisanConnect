require('dotenv').config({ path: './.env.local' });
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { MongoClient } = require('mongodb')
const mongoose = require('mongoose')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

// Initialize Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// In-memory storage for active connections (in production, use Redis)
const activeConnections = new Map()
const bookingRooms = new Map()

// MongoDB connection
let mongoClient
let database

async function connectToDatabase() {
  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      })
      await mongoClient.connect()
      // Use the same database name as the API routes
      database = mongoClient.db(process.env.MONGODB_DB_NAME || 'artisan_connect')
      console.log('✅ Connected to MongoDB database:', database.databaseName)
    }
    return database
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    // For development, continue without MongoDB
    if (dev) {
      console.log('⚠️ Continuing without MongoDB in development mode')
      return null
    }
    throw error
  }
}

// Enhanced Socket.IO event handlers with offline messaging support
function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`)
    
    // Store user info with role detection and online status
    socket.on('user:join', async (userData) => {
      socket.userId = userData.userId
      socket.userEmail = userData.email
      socket.userName = userData.name
      socket.userRole = userData.role || 'customer' // Ensure role is set
      
      activeConnections.set(socket.id, {
        userId: userData.userId,
        email: userData.email,
        name: userData.name,
        role: socket.userRole,
        connectedAt: new Date(),
        socketId: socket.id
      })
      
      console.log(`👤 User ${userData.name} (${userData.email}) joined as ${socket.userRole}`)
      
      // Join user to their personal notification room
      socket.join(`user_${userData.userId}`)
      
      // Mark user as online and deliver pending messages
      await markUserOnline(socket.userId, socket.userRole)
      await deliverPendingMessages(io, socket.userId, socket)
      
      // Emit updated connection count to all clients
      io.emit('server:connection_count', {
        total: activeConnections.size,
        timestamp: new Date()
      })

      // Confirm user authentication
      socket.emit('user:authenticated', {
        userId: socket.userId,
        role: socket.userRole,
        timestamp: new Date()
      })
    })

    // Enhanced booking join with better role handling
    socket.on('booking:join', async (data) => {
      const { bookingId, userRole } = data
      const roomName = `booking_${bookingId}`
      
      // Update user role if provided (for cases where role wasn't set in user:join)
      if (userRole && userRole !== socket.userRole) {
        socket.userRole = userRole
        console.log(`🔄 Updated user role to ${userRole} for ${socket.userName}`)
      }
      
      await socket.join(roomName)
      
      // Track room members with better data structure
      if (!bookingRooms.has(roomName)) {
        bookingRooms.set(roomName, new Map())
      }
      
      bookingRooms.get(roomName).set(socket.id, {
        socketId: socket.id,
        userId: socket.userId || socket.id,
        userName: socket.userName || 'Unknown User',
        userEmail: socket.userEmail,
        userRole: socket.userRole,
        joinedAt: new Date()
      })
      
      console.log(`📋 User ${socket.userName} (${socket.userRole}) joined booking room: ${roomName}`)
      
      // Notify other room members about the new join
      socket.to(roomName).emit('booking:user_joined', {
        userId: socket.userId,
        userName: socket.userName,
        userRole: socket.userRole,
        timestamp: new Date()
      })
      
      // Send room info and member list to the joining user
      const roomMembers = Array.from(bookingRooms.get(roomName).values())
      socket.emit('booking:room_joined', {
        bookingId,
        roomName,
        memberCount: roomMembers.length,
        members: roomMembers.map(member => ({
          userId: member.userId,
          userName: member.userName,
          userRole: member.userRole
        }))
      })

      // Send existing room members to the new user
      socket.emit('booking:room_members', {
        bookingId,
        members: roomMembers
      })

      // Check for and deliver any offline messages for this booking
      await deliverOfflineMessagesForBooking(io, bookingId, socket)
    })

    // Handle chat messages with enhanced offline support
    socket.on('chat:send_message', async (data) => {
      try {
        const { bookingId, message, messageType = 'text' } = data
        const roomName = `booking_${bookingId}`
        
        // Enhanced validation
        if (!socket.userId) {
          console.warn(`⚠️ User not authenticated: ${socket.id}`)
          socket.emit('error', { message: 'Please authenticate first' })
          return
        }

        if (!message || !message.trim()) {
          socket.emit('error', { message: 'Message cannot be empty' })
          return
        }

        // Create message object with enhanced data
        const chatMessage = {
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          bookingId,
          senderId: socket.userId,
          senderName: socket.userName,
          senderEmail: socket.userEmail,
          senderRole: socket.userRole || 'customer',
          message: message.trim(),
          messageType,
          fileUrl: null,
          fileName: null,
          fileSize: null,
          fileType: null,
          isRead: false,
          readBy: [{
            userId: socket.userId,
            readAt: new Date()
          }],
          isEdited: false,
          editedAt: null,
          isDeleted: false,
          deletedAt: null,
          replyToMessageId: null,
          timestamp: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          deliveryStatus: 'sent' // Track delivery status
        }

        // Save to database
        try {
          const db = await connectToDatabase()
          if (db) {
            const result = await db.collection('chatmessages').insertOne(chatMessage)
            console.log(`💾 Message saved to DB with ID: ${result.insertedId}`)
            chatMessage._id = result.insertedId // Add DB ID for client reference
          }
        } catch (dbError) {
          console.error('❌ MongoDB error:', dbError.message)
          // Continue to handle message even if DB save fails
        }

        // Get current room members for debugging
        const roomMembers = bookingRooms.get(roomName)
        const memberCount = roomMembers ? roomMembers.size : 0
        
        console.log(`💬 Processing message in ${roomName}:`)
        console.log(`   👤 From: ${socket.userName} (${socket.userRole})`)
        console.log(`   📝 Message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`)
        console.log(`   👥 Room members: ${memberCount}`)

        // Check if user is in room for real-time delivery
        const isInRoom = socket.rooms.has(roomName)
        
        if (isInRoom && roomMembers) {
          console.log(`   🎯 Real-time recipients:`)
          roomMembers.forEach(member => {
            console.log(`     - ${member.userName} (${member.userRole})`)
          })

          // Broadcast to ALL users in the room (including sender for confirmation)
          io.to(roomName).emit('chat:new_message', chatMessage)
          
          // Mark as delivered for online users
          chatMessage.deliveryStatus = 'delivered'
        } else {
          console.log(`   📤 Sender not in room, treating as offline message`)
        }

        // Handle offline message delivery
        await handleOfflineMessageDelivery(io, bookingId, chatMessage, socket)

        // Confirm message sent to sender
        socket.emit('chat:message_sent', {
          messageId: chatMessage.messageId,
          timestamp: chatMessage.timestamp,
          deliveryStatus: chatMessage.deliveryStatus
        })

      } catch (error) {
        console.error('❌ Error sending message:', error)
        socket.emit('error', { 
          message: 'Failed to send message',
          details: error.message 
        })
      }
    })

    // Enhanced typing indicators
    socket.on('chat:typing_start', (data) => {
      const { bookingId } = data
      const roomName = `booking_${bookingId}`
      
      if (socket.rooms.has(roomName)) {
        socket.to(roomName).emit('chat:user_typing', {
          userId: socket.userId,
          userName: socket.userName,
          userRole: socket.userRole,
          isTyping: true,
          timestamp: new Date()
        })
      }
    })

    socket.on('chat:typing_stop', (data) => {
      const { bookingId } = data
      const roomName = `booking_${bookingId}`
      
      if (socket.rooms.has(roomName)) {
        socket.to(roomName).emit('chat:user_typing', {
          userId: socket.userId,
          userName: socket.userName,
          userRole: socket.userRole,
          isTyping: false,
          timestamp: new Date()
        })
      }
    })

    // Enhanced message read receipts
    socket.on('chat:mark_read', async (data) => {
      try {
        const { messageId, bookingId } = data
        const db = await connectToDatabase()
        
        if (db) {
          await db.collection('chatmessages').updateOne(
            { messageId: messageId },
            { 
              $addToSet: { 
                readBy: {
                  userId: socket.userId,
                  readAt: new Date()
                }
              },
              $set: { isRead: true, updatedAt: new Date() }
            }
          )
        }
        
        // Notify room
        const roomName = `booking_${bookingId}`
        socket.to(roomName).emit('chat:message_read', {
          messageId,
          readBy: socket.userId,
          userName: socket.userName,
          userRole: socket.userRole,
          timestamp: new Date()
        })

      } catch (error) {
        console.error('❌ Error marking message as read:', error)
      }
    })

    // Enhanced notification subscription
    socket.on('notification:subscribe', (data) => {
      const { notificationTypes } = data
      socket.notificationTypes = notificationTypes
      console.log(`🔔 User ${socket.userName} (${socket.userRole}) subscribed to notifications:`, notificationTypes)
    })

    // Handle room status requests
    socket.on('room:status', (data) => {
      const { bookingId } = data
      const roomName = `booking_${bookingId}`
      const roomMembers = bookingRooms.get(roomName)
      
      socket.emit('room:status_response', {
        bookingId,
        roomName,
        isJoined: socket.rooms.has(roomName),
        memberCount: roomMembers ? roomMembers.size : 0,
        members: roomMembers ? Array.from(roomMembers.values()) : []
      })
    })

    // Handle disconnection with proper cleanup and offline status
    socket.on('disconnect', async (reason) => {
      console.log(`🔌 User ${socket.userName || socket.id} disconnected: ${reason}`)
      
      // Mark user as offline
      if (socket.userId) {
        await markUserOffline(socket.userId)
      }
      
      // Clean up from active connections
      activeConnections.delete(socket.id)
      
      // Clean up from booking rooms
      bookingRooms.forEach((members, roomName) => {
        if (members.has(socket.id)) {
          members.delete(socket.id)
          
          // Notify remaining room members
          socket.to(roomName).emit('booking:user_left', {
            userId: socket.userId,
            userName: socket.userName,
            userRole: socket.userRole,
            timestamp: new Date()
          })
          
          // Clean up empty rooms
          if (members.size === 0) {
            bookingRooms.delete(roomName)
            console.log(`🧹 Cleaned up empty room: ${roomName}`)
          }
        }
      })
      
      // Emit updated connection count
      io.emit('server:connection_count', {
        total: activeConnections.size,
        timestamp: new Date()
      })
    })

    // Add ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() })
    })
  })
}

// Helper function to mark user as online
async function markUserOnline(userId, userRole) {
  try {
    const db = await connectToDatabase()
    if (db) {
      await db.collection('userStatus').updateOne(
        { userId },
        {
          $set: {
            isOnline: true,
            lastSeen: new Date(),
            userRole,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      )
      console.log(`🟢 User ${userId} marked as online`)
    }
  } catch (error) {
    console.error('❌ Error marking user online:', error)
  }
}

// Helper function to mark user as offline
async function markUserOffline(userId) {
  try {
    const db = await connectToDatabase()
    if (db) {
      await db.collection('userStatus').updateOne(
        { userId },
        {
          $set: {
            isOnline: false,
            lastSeen: new Date(),
            updatedAt: new Date()
          }
        }
      )
      console.log(`🔴 User ${userId} marked as offline`)
    }
  } catch (error) {
    console.error('❌ Error marking user offline:', error)
  }
}

// Helper function to deliver pending messages when user comes online
async function deliverPendingMessages(io, userId, socket) {
  try {
    const db = await connectToDatabase()
    if (!db) return

    // Find all pending messages for this user
    const pendingMessages = await db.collection('pendingMessages')
      .find({ 
        recipientId: userId,
        delivered: false 
      })
      .sort({ createdAt: 1 })
      .toArray()

    if (pendingMessages.length > 0) {
      console.log(`📨 Delivering ${pendingMessages.length} pending messages to ${userId}`)

      for (const pendingMsg of pendingMessages) {
        // Send the original message
        socket.emit('chat:new_message', pendingMsg.message)
        
        // Also send to personal room as backup
        io.to(`user_${userId}`).emit('chat:offline_message_delivered', {
          message: pendingMsg.message,
          deliveredAt: new Date()
        })

        // Mark as delivered
        await db.collection('pendingMessages').updateOne(
          { _id: pendingMsg._id },
          { 
            $set: { 
              delivered: true, 
              deliveredAt: new Date() 
            } 
          }
        )
      }

      // Notify sender about delivery (if they're online)
      for (const pendingMsg of pendingMessages) {
        const senderConnection = Array.from(activeConnections.values())
          .find(conn => conn.userId === pendingMsg.message.senderId)
        
        if (senderConnection) {
          io.to(`user_${pendingMsg.message.senderId}`).emit('chat:message_delivered', {
            messageId: pendingMsg.message.messageId,
            deliveredTo: userId,
            deliveredAt: new Date()
          })
        }
      }
    }
  } catch (error) {
    console.error('❌ Error delivering pending messages:', error)
  }
}

// Helper function to handle offline message delivery
async function handleOfflineMessageDelivery(io, bookingId, message, senderSocket) {
  try {
    const db = await connectToDatabase()
    if (!db) return

    // Find all participants in this booking (from booking records or message history)
    const participants = await db.collection('chatmessages')
      .distinct('senderId', { bookingId })

    // Also check booking records for additional participants
    const booking = await db.collection('bookings').findOne({ 
      $or: [
        { _id: bookingId },
        { 'id': bookingId }
      ]
    })

    if (booking) {
      if (booking.userEmail && !participants.includes(booking.userEmail)) {
        participants.push(booking.userEmail)
      }
      if (booking.providerEmail && !participants.includes(booking.providerEmail)) {
        participants.push(booking.providerEmail)
      }
    }

    // Find offline participants
    const offlineParticipants = []
    
    for (const participantId of participants) {
      if (participantId === message.senderId) continue // Skip sender
      
      // Check if user is online
      const isOnline = Array.from(activeConnections.values())
        .some(conn => conn.userId === participantId)
      
      if (!isOnline) {
        offlineParticipants.push(participantId)
      }
    }

    console.log(`📤 Handling offline delivery for ${offlineParticipants.length} offline users:`, offlineParticipants)

    // Store pending messages for offline users
    for (const recipientId of offlineParticipants) {
      const pendingMessage = {
        messageId: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        bookingId,
        recipientId,
        message,
        delivered: false,
        createdAt: new Date()
      }

      await db.collection('pendingMessages').insertOne(pendingMessage)
      console.log(`📥 Stored pending message for offline user: ${recipientId}`)
    }

    // Send push notification to offline users (future enhancement)
    // await sendPushNotificationToOfflineUsers(offlineParticipants, message)

  } catch (error) {
    console.error('❌ Error handling offline message delivery:', error)
  }
}

// Helper function to deliver offline messages for a specific booking when user joins
async function deliverOfflineMessagesForBooking(io, bookingId, socket) {
  try {
    const db = await connectToDatabase()
    if (!db) return

    // Find pending messages for this user in this booking
    const pendingMessages = await db.collection('pendingMessages')
      .find({ 
        bookingId,
        recipientId: socket.userId,
        delivered: false 
      })
      .sort({ createdAt: 1 })
      .toArray()

    if (pendingMessages.length > 0) {
      console.log(`📨 Delivering ${pendingMessages.length} offline messages for booking ${bookingId} to ${socket.userId}`)

      for (const pendingMsg of pendingMessages) {
        // Send the message
        socket.emit('chat:new_message', pendingMsg.message)
        
        // Mark as delivered
        await db.collection('pendingMessages').updateOne(
          { _id: pendingMsg._id },
          { 
            $set: { 
              delivered: true, 
              deliveredAt: new Date() 
            } 
          }
        )
      }
    }
  } catch (error) {
    console.error('❌ Error delivering offline messages for booking:', error)
  }
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  // Initialize Socket.IO with CORS configuration
  const io = new Server(server, {
    cors: {
      origin: dev ? "http://localhost:3000" : process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true
    },
    pingInterval: 25000,
    pingTimeout: 60000,
    maxHttpBufferSize: 1e6,
    allowEIO3: true
  })

  // Set up socket event handlers
  setupSocketHandlers(io)

  // Make io available globally for API routes
  global.io = io

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`🚀 Server ready on http://${hostname}:${port}`)
    console.log(`📡 Socket.IO server initialized`)
    
    // Initialize database connection
    connectToDatabase().catch(console.error)
  })

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...')
    server.close(() => {
      console.log('✅ Server closed')
      if (mongoClient) {
        mongoClient.close()
      }
      process.exit(0)
    })
  })

  process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...')
    server.close(() => {
      console.log('✅ Server closed')
      if (mongoClient) {
        mongoClient.close()
      }
      process.exit(0)
    })
  })
}) 