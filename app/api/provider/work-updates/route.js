import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is a provider
    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json(
        { error: 'Provider access required' },
        { status: 403 }
      )
    }

    const { db } = await connectToDatabase()
    const providerEmail = session.user.email
    const { bookingId, type, message, eta, photos } = await request.json()

    // Validate required fields
    if (!bookingId || !type || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, type, message' },
        { status: 400 }
      )
    }

    // Get booking details to find customer
    const booking = await db.collection('bookings')
      .findOne({ _id: new ObjectId(bookingId) })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Verify provider owns this booking
    if (booking.providerEmail !== providerEmail) {
      return NextResponse.json(
        { error: 'Unauthorized: Not your booking' },
        { status: 403 }
      )
    }

    // Create work update record
    const workUpdate = {
      bookingId: new ObjectId(bookingId),
      providerEmail,
      customerEmail: booking.userEmail,
      type, // 'eta_update', 'photo_update', 'status_update', 'arrival_notification'
      message,
      eta: eta || null,
      photos: photos || [],
      isRead: false,
      createdAt: new Date()
    }

    const result = await db.collection('work_updates')
      .insertOne(workUpdate)

    // Also create a notification for the customer
    await db.collection('notifications')
      .insertOne({
        bookingId: new ObjectId(bookingId),
        userEmail: booking.userEmail,
        type: 'work_update',
        title: getUpdateTitle(type),
        message,
        data: {
          eta,
          photos,
          providerName: session.user.name
        },
        isRead: false,
        createdAt: new Date()
      })

    // Send real-time notification via Socket.IO if available
    try {
      const io = global.io
      if (io) {
        io.to(`user_${booking.userEmail}`).emit('work_update', {
          bookingId,
          type,
          message,
          eta,
          photos,
          timestamp: new Date()
        })
      }
    } catch (socketError) {
      console.log('Socket.IO not available:', socketError.message)
    }

    // TODO: Send email/SMS notification based on customer preferences
    // This would integrate with SendGrid/Twilio

    return NextResponse.json({
      success: true,
      updateId: result.insertedId.toString(),
      message: 'Work update sent successfully'
    })

  } catch (error) {
    console.error('Error sending work update:', error)
    return NextResponse.json(
      { error: 'Failed to send work update' },
      { status: 500 }
    )
  }
}

// Get customer work updates for a booking
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()

    // Get all work updates for this booking
    const updates = await db.collection('work_updates')
      .find({ bookingId: new ObjectId(bookingId) })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(updates)

  } catch (error) {
    console.error('Error fetching work updates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work updates' },
      { status: 500 }
    )
  }
}

// Helper function to get update title based on type
function getUpdateTitle(type) {
  const titles = {
    'eta_update': 'Provider ETA Update',
    'photo_update': 'Work Progress Photos',
    'status_update': 'Work Status Update',
    'arrival_notification': 'Provider Arrival',
    'completion_update': 'Work Completed'
  }
  
  return titles[type] || 'Work Update'
} 