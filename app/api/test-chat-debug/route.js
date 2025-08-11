import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request) {
  try {
    const { db } = await connectToDatabase()
    
    // Get all chat messages
    const allMessages = await db.collection('chatmessages').find({}).toArray()
    
    // Get distinct booking IDs
    const bookingIds = await db.collection('chatmessages').distinct('bookingId')
    
    // Get sample messages for direct messages
    const directMessages = await db.collection('chatmessages').find({
      bookingId: { $regex: /^dm_/ }
    }).toArray()

    return NextResponse.json({
      success: true,
      totalMessages: allMessages.length,
      bookingIds: bookingIds,
      directMessagesCount: directMessages.length,
      sampleMessages: allMessages.slice(0, 3).map(msg => ({
        bookingId: msg.bookingId,
        message: msg.message,
        senderId: msg.senderId,
        senderName: msg.senderName,
        timestamp: msg.timestamp
      })),
      sampleDirectMessages: directMessages.slice(0, 2).map(msg => ({
        bookingId: msg.bookingId,
        message: msg.message,
        senderId: msg.senderId,
        senderName: msg.senderName,
        timestamp: msg.timestamp
      }))
    })

  } catch (error) {
    console.error('Test chat debug error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 