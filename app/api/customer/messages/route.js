import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectToDatabase } from '@/lib/mongodb'
import { authOptions } from '../../auth/[...nextauth]/route'
import ChatMessage from '@/models/ChatMessage'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('❌ No session found for customer messages API')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`📨 Customer messages API called by: ${session.user.email}`)

    const { db } = await connectToDatabase()
    
    if (!db) {
      console.log('❌ No database connection for customer messages API')
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    // Get all bookings made by this customer with business details
    const bookingsWithBusiness = await db.collection('bookings').aggregate([
      {
        $match: {
          $or: [
            { userEmail: session.user.email },
            { userId: session.user.id },
            { customerEmail: session.user.email }
          ]
        }
      },
      {
        $lookup: {
          from: 'businesslists',
          localField: 'businessListId',
          foreignField: '_id',
          as: 'businessDetails'
        }
      },
      {
        $unwind: {
          path: '$businessDetails',
          preserveNullAndEmptyArrays: true // Keep bookings even if business is not found
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray()

    // Get all direct message bookingIds this customer is involved in
    const customerEmailEncoded = session.user.email.replace(/[^a-zA-Z0-9]/g, '_')
    const directMessageBookingIds = await db.collection('chatmessages').distinct('bookingId', {
      bookingId: { $regex: /^dm_/ },
      $or: [
        { senderEmail: session.user.email },
        { senderId: session.user.email },
        { bookingId: { $regex: `_${customerEmailEncoded}$` } }
      ]
    })

    console.log(`📋 Found ${bookingsWithBusiness.length} regular bookings and ${directMessageBookingIds.length} direct message conversations for customer ${session.user.email}`)

    const conversations = []
    
    // Process regular bookings
    for (const booking of bookingsWithBusiness) {
      const bookingId = booking._id.toString()
      
      const latestMessage = await db.collection('chatmessages')
        .findOne({ bookingId }, { sort: { timestamp: -1 } })

      const unreadCount = await db.collection('chatmessages')
        .countDocuments({
          bookingId: bookingId,
          senderId: { $ne: session.user.email },
          senderEmail: { $ne: session.user.email },
          isRead: { $ne: true }
        })

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const isActive = booking.status !== 'completed' || 
                      (latestMessage && new Date(latestMessage.timestamp) > sevenDaysAgo)

      const business = booking.businessDetails
      let providerName = 'Service Provider'
      let providerEmail = ''
      let businessInfo = {}

      if (business) {
        providerName = business.contactPerson || business.name || 'Service Provider'
        providerEmail = business.providerEmail || business.email || ''
        businessInfo = {
          name: business.name,
          contactPerson: business.contactPerson,
          phone: business.phone,
          address: business.address,
          images: business.images || []
        }
      }

      const conversation = {
        bookingId: bookingId,
        providerName,
        providerEmail,
        providerInitials: providerName.split(' ').map(n => n[0]).join('').toUpperCase() || 'SP',
        serviceName: business?.name || 'Service',
        bookingDate: booking.date || booking.createdAt,
        bookingTime: booking.time || 'TBD',
        bookingStatus: booking.status || 'pending',
        lastMessage: latestMessage ? latestMessage.message : 'No messages yet',
        lastMessageTime: latestMessage ? latestMessage.timestamp : booking.createdAt,
        unreadCount,
        isActive,
        businessInfo
      }
      
      conversations.push(conversation)
    }

    // Process direct messages
    for (const directBookingId of directMessageBookingIds) {
      const latestMessage = await db.collection('chatmessages')
        .findOne({ bookingId: directBookingId }, { sort: { timestamp: -1 } })

      if (!latestMessage) continue

      const unreadCount = await db.collection('chatmessages')
        .countDocuments({
          bookingId: directBookingId,
          senderId: { $ne: session.user.email },
          senderEmail: { $ne: session.user.email },
          isRead: { $ne: true }
        })

      const parts = directBookingId.split('_')
      let businessId = ''
      let providerName = 'Service Provider'
      let serviceName = 'Direct Message'
      let businessInfo = {}
      
      if (parts.length >= 2) {
        businessId = parts[1]
        if (ObjectId.isValid(businessId)) {
          const business = await db.collection('businesslists')
            .findOne({ _id: new ObjectId(businessId) })
          
          if (business) {
            providerName = business.contactPerson || business.name || 'Service Provider'
            serviceName = business.name || 'Direct Message'
            businessInfo = {
              name: business.name,
              contactPerson: business.contactPerson,
              phone: business.phone,
              address: business.address,
              images: business.images || []
            }
          }
        }
      }

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const isActive = latestMessage && new Date(latestMessage.timestamp) > sevenDaysAgo

      const conversation = {
        bookingId: directBookingId,
        providerName,
        providerEmail: '',
        providerInitials: providerName.split(' ').map(n => n[0]).join('').toUpperCase() || 'SP',
        serviceName,
        bookingDate: latestMessage.timestamp,
        bookingTime: 'Direct Message',
        bookingStatus: 'active',
        lastMessage: latestMessage.message,
        lastMessageTime: latestMessage.timestamp,
        unreadCount,
        isActive,
        businessInfo,
        isDirect: true
      }
      
      conversations.push(conversation)
    }

    conversations.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime))

    const stats = {
      totalConversations: conversations.length,
      unreadMessages: conversations.reduce((sum, conv) => sum + conv.unreadCount, 0),
      activeChats: conversations.filter(conv => conv.isActive).length,
      completedBookings: conversations.filter(conv => conv.bookingStatus === 'completed').length
    }

    console.log(`✅ Customer messages loaded: ${conversations.length} conversations, ${stats.unreadMessages} unread`)

    return NextResponse.json({
      success: true,
      conversations,
      stats
    })

  } catch (error) {
    console.error('❌ Error in customer messages API:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to load conversations',
      details: error.message
    }, { status: 500 })
  }
} 