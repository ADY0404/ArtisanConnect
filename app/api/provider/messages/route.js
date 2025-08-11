import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectToDatabase } from '@/lib/mongodb'
import { authOptions } from '../../auth/[...nextauth]/route'
import { ensureConnection } from '@/lib/mongodb'
import ChatMessage from '@/models/ChatMessage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('❌ No session found for provider messages API')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log(`📨 Provider messages API called by: ${session.user.email}`)

    const { db } = await connectToDatabase()
    
    if (!db) {
      console.log('❌ No database connection for provider messages API')
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }
    
    // Get all bookings for this provider
    const bookings = await db.collection('bookings')
      .find({ 
        $or: [
          { providerId: session.user.id },
          { providerEmail: session.user.email },
          { businessListId: session.user.id } // In case provider is linked by business
        ]
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Also get direct messages where this provider is involved
    // For providers, we need to find all direct messages (dm_*) where they might be the recipient
    // Since direct messages don't have explicit recipient fields, we need to find conversations
    // where the provider has either sent or received messages
    
    // First, get all direct message bookingIds where this provider has sent messages
    const providerSentDMs = await db.collection('chatmessages')
      .distinct('bookingId', {
        bookingId: { $regex: /^dm_/ },
        $or: [
          { senderEmail: session.user.email },
          { senderId: session.user.email }
        ]
      })

    // Then, get all direct message bookingIds where someone sent TO this provider
    // This is trickier - we need to check if the provider is the intended recipient
    // For now, let's get all direct messages and filter them later
    const allDirectMessages = await db.collection('chatmessages')
      .find({ bookingId: { $regex: /^dm_/ } })
      .toArray()

    console.log(`📨 Found ${allDirectMessages.length} total direct messages in database`)

    // Filter to find conversations where this provider should be involved
    const directMessageBookingIds = new Set(providerSentDMs)
    
    // Get all businesses associated with this provider using the new providerEmail field
    const providerBusinesses = await db.collection('businesslists')
      .find({
        $or: [
          { providerEmail: session.user.email }, // ✅ New field for proper association
          { createdBy: session.user.email },     // ✅ Backup field
          { email: session.user.email },         // Legacy fallback
          { contactPerson: session.user.email }, // Legacy fallback
          { 'contactInfo.email': session.user.email } // Legacy fallback
        ]
      })
      .toArray()
    
    let providerBusinessIds = providerBusinesses.map(b => b._id.toString())
    console.log(`🏢 Provider ${session.user.email} owns businesses:`, providerBusinessIds)
    
    // Log if provider has no businesses - this should now be rare with proper association
    if (providerBusinessIds.length === 0) {
      console.log(`⚠️ Provider ${session.user.email} has no associated businesses. They may need to create/register their business first.`)
    }
    
    // Add conversations where provider is the intended recipient based on business ownership
    for (const msg of allDirectMessages) {
      // Parse booking ID to get business ID: dm_businessId_customerEmail
      const parts = msg.bookingId.split('_')
      if (parts.length >= 3) {
        const businessId = parts[1]
        
        // Check if this provider owns/manages this business
        if (providerBusinessIds.includes(businessId)) {
          directMessageBookingIds.add(msg.bookingId)
          console.log(`✅ Added conversation ${msg.bookingId} - provider owns business ${businessId}`)
        }
      }
      
      // Also include if provider has sent messages in this conversation
      if (msg.senderId === session.user.email || msg.senderEmail === session.user.email) {
        directMessageBookingIds.add(msg.bookingId)
        console.log(`✅ Added conversation ${msg.bookingId} - provider participated`)
      }
    }

    const directMessageBookingIdsArray = Array.from(directMessageBookingIds)

    console.log(`📋 Found ${bookings.length} regular bookings and ${directMessageBookingIdsArray.length} direct message conversations for provider ${session.user.email}`)
    console.log(`📋 Direct message booking IDs:`, directMessageBookingIdsArray)

    const conversations = []
    
    // Process regular bookings
    for (const booking of bookings) {
      const bookingId = booking._id.toString()
      
      // Get latest message for this booking
      const latestMessage = await db.collection('chatmessages')
        .findOne(
          { bookingId: bookingId },
          { sort: { timestamp: -1 } }
        )

      // Get unread count (messages not sent by provider and not read)
      const unreadCount = await db.collection('chatmessages')
        .countDocuments({
          bookingId: bookingId,
          senderId: { $ne: session.user.email },
          isRead: { $ne: true }
        })

      // Check if conversation is active (has messages in last 7 days or booking is not completed)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const isActive = booking.status !== 'completed' || 
                      (latestMessage && new Date(latestMessage.timestamp) > sevenDaysAgo)

      const conversation = {
        bookingId: bookingId,
        customerName: booking.userName || 'Unknown Customer',
        customerEmail: booking.userEmail || '',
        customerInitials: (booking.userName || 'UC').split(' ').map(n => n[0]).join('').toUpperCase(),
        serviceName: booking.businessName || 'Service',
        bookingDate: booking.date || booking.createdAt,
        bookingTime: booking.time || 'TBD',
        bookingStatus: booking.status || 'pending',
        lastMessage: latestMessage ? latestMessage.message : 'No messages yet',
        lastMessageTime: latestMessage ? latestMessage.timestamp : booking.createdAt,
        unreadCount,
        isActive,
        businessInfo: {
          name: booking.businessName || 'Your Service',
          contactPerson: session.user.name,
          phone: booking.businessPhone || '',
          address: booking.businessAddress || '',
          images: booking.businessImages || []
        }
      }
      
      conversations.push(conversation)
    }

    // Process direct messages
    for (const directBookingId of directMessageBookingIdsArray) {
      // Get latest message for this direct conversation
      const latestMessage = await db.collection('chatmessages')
        .findOne(
          { bookingId: directBookingId },
          { sort: { timestamp: -1 } }
        )

      if (!latestMessage) continue // Skip if no messages found

      // Get unread count (messages not sent by provider and not read)
      const unreadCount = await db.collection('chatmessages')
        .countDocuments({
          bookingId: directBookingId,
          senderId: { $ne: session.user.email },
          isRead: { $ne: true }
        })

      // Parse the direct message booking ID: dm_businessId_customerEmail
      const parts = directBookingId.split('_')
      let customerEmail = ''
      let businessId = ''
      
      if (parts.length >= 3) {
        businessId = parts[1]
        // Customer email is everything after the second underscore, converted back
        customerEmail = parts.slice(2).join('_').replace(/_/g, '@').replace(/@@/g, '.')
      }

      // Get customer info from the latest message or try to parse
      const customerName = latestMessage.senderEmail !== session.user.email 
        ? latestMessage.senderName 
        : 'Customer' // Default if we can't determine

      // Get business info - try to find it in the businesses collection
      let businessInfo = {
        name: 'Direct Message Service',
        contactPerson: session.user.name,
        phone: '',
        address: '',
        images: []
      }

      // Try to get business details if businessId exists
      if (businessId && businessId !== 'undefined') {
        try {
          const business = await db.collection('businesslists').findOne({ 
            _id: { $in: [businessId, new require('mongodb').ObjectId(businessId)] }
          })
          
          if (business) {
            businessInfo.name = business.name || 'Direct Message Service'
            businessInfo.address = business.address || ''
            businessInfo.phone = business.phone || ''
            businessInfo.images = business.images || []
          }
        } catch (err) {
          console.log(`⚠️ Could not find business for ID: ${businessId}`)
        }
      }

      // Check if conversation is active (has messages in last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const isActive = latestMessage && new Date(latestMessage.timestamp) > sevenDaysAgo

      const directConversation = {
        bookingId: directBookingId,
        customerName: customerName || 'Unknown Customer',
        customerEmail: customerEmail,
        customerInitials: (customerName || 'UC').split(' ').map(n => n[0]).join('').toUpperCase(),
        serviceName: businessInfo.name,
        bookingDate: latestMessage.timestamp,
        bookingTime: 'Direct Message',
        bookingStatus: 'inquiry',
        lastMessage: latestMessage.message,
        lastMessageTime: latestMessage.timestamp,
        unreadCount,
        isActive,
        businessInfo,
        isDirect: true // Flag to identify direct messages
      }
      
      conversations.push(directConversation)
    }

    // Calculate stats
    const totalConversations = conversations.length
    const unreadMessages = conversations.reduce((acc, conv) => acc + conv.unreadCount, 0)
    const activeChats = conversations.filter(conv => conv.isActive).length
    
    // Calculate response rate (include both regular bookings and direct messages)
    const allBookingIds = [
      ...bookings.map(b => b._id.toString()),
      ...directMessageBookingIdsArray
    ]
    
    const totalMessages = await db.collection('chatmessages')
      .countDocuments({
        bookingId: { $in: allBookingIds }
      })
    
    const providerMessages = await db.collection('chatmessages')
      .countDocuments({
        bookingId: { $in: allBookingIds },
        senderId: session.user.email
      })
    
    const responseRate = totalMessages > 0 ? Math.round((providerMessages / totalMessages) * 100) : 0

    const stats = {
      totalConversations,
      unreadMessages,
      activeChats,
      responseRate
    }

    return NextResponse.json({
      conversations,
      stats
    })

  } catch (error) {
    console.error('Error fetching provider messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
} 