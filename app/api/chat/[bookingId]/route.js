import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectToDatabase } from '@/lib/mongodb'

// GET chat history for a booking
export async function GET(request, { params }) {
  try {
    const { db } = await connectToDatabase()
    
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 50
    const skip = (page - 1) * limit

    console.log('📋 Fetching chat history for bookingId:', bookingId)

    // Debug: Check what's in the chatmessages collection
    const allMessages = await db.collection('chatmessages').find({}).limit(5).toArray()
    console.log('🔍 Sample messages in collection:', allMessages.map(m => ({ 
      bookingId: m.bookingId, 
      message: m.message?.substring(0, 50) + '...', 
      senderId: m.senderId 
    })))

    // Use direct MongoDB operations to avoid Mongoose schema issues
    const messages = await db.collection('chatmessages').find({
      bookingId: bookingId, // Direct string comparison
      isDeleted: { $ne: true }
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .toArray()

    console.log('✅ Found messages:', messages.length)
    console.log('🔍 Query used:', { bookingId: bookingId, isDeleted: { $ne: true } })
    
    // Handle case when no chat history exists
    if (messages.length === 0) {
      console.log('💬 No chat history found for booking:', bookingId)
      return NextResponse.json({
        success: true,
        data: {
          messages: [],
          unreadCount: 0,
          hasMore: false,
          currentPage: page,
          isEmpty: true,
          message: 'No chat history found. Start a conversation!'
        }
      })
    }
    
    // Get unread count for current user
    const userId = session.user.email || session.user.id
    const unreadCount = await db.collection('chatmessages').countDocuments({
      bookingId: bookingId,
      senderId: { $ne: userId },
      isRead: { $ne: true },
      isDeleted: { $ne: true }
    })

    // Reverse messages to show oldest first
    const sortedMessages = messages.reverse()

    return NextResponse.json({
      success: true,
      data: {
        messages: sortedMessages,
        unreadCount,
        hasMore: messages.length === limit,
        currentPage: page,
        isEmpty: false
      }
    })

  } catch (error) {
    console.error('Error fetching chat history:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch chat history',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// POST new message to chat
export async function POST(request, { params }) {
  try {
    const { db } = await connectToDatabase()
    
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId } = params
    const body = await request.json()
    
    const {
      message,
      messageType = 'text',
      fileUrl = null,
      fileName = null,
      fileSize = null,
      fileType = null
    } = body

    // Validate required fields
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    console.log('💬 Creating new message for bookingId:', bookingId)

    // Create message directly with MongoDB
    const newMessage = {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bookingId: bookingId, // Store as string
      senderId: session.user.email || session.user.id,
      senderName: session.user.name,
      senderRole: session.user.role || 'customer',
      message: message.trim(),
      messageType,
      fileUrl,
      fileName,
      fileSize,
      fileType,
      isRead: false,
      readBy: [],
      isEdited: false,
      editedAt: null,
      isDeleted: false,
      deletedAt: null,
      replyToMessageId: null,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('chatmessages').insertOne(newMessage)
    console.log('✅ Message created with ID:', result.insertedId)

    return NextResponse.json({
      success: true,
      data: { ...newMessage, _id: result.insertedId }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create message',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// PUT to mark messages as read
export async function PUT(request, { params }) {
  try {
    const { db } = await connectToDatabase()
    
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId } = params
    const body = await request.json()
    const { action, messageId } = body
    const userId = session.user.email || session.user.id

    console.log('📖 Marking messages as read for bookingId:', bookingId)

    if (action === 'mark_read') {
      if (messageId) {
        // Mark specific message as read
        const result = await db.collection('chatmessages').updateOne(
          { messageId, bookingId },
          {
            $addToSet: {
              readBy: {
                userId: userId,
                readAt: new Date()
              }
            },
            $set: { isRead: true, updatedAt: new Date() }
          }
        )
        
        return NextResponse.json({
          success: true,
          message: 'Message marked as read',
          modifiedCount: result.modifiedCount
        })
      } else {
        // Mark all messages as read
        const result = await db.collection('chatmessages').updateMany(
          {
            bookingId,
            senderId: { $ne: userId },
            isRead: { $ne: true },
            isDeleted: { $ne: true }
          },
          {
            $addToSet: {
              readBy: {
                userId: userId,
                readAt: new Date()
              }
            },
            $set: { isRead: true, updatedAt: new Date() }
          }
        )
        
        return NextResponse.json({
          success: true,
          message: 'All messages marked as read',
          modifiedCount: result.modifiedCount
        })
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error updating message read status:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update message read status',
        details: error.message 
      },
      { status: 500 }
    )
  }
} 