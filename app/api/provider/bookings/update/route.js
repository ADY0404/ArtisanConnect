import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { EmailService } from '@/app/_services/EmailService'

export async function POST(request) {
  try {
    console.log('🔄 Booking update request received')
    
    // Check authentication
    const session = await getServerSession(authOptions)
    
    console.log('👤 Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      userRole: session?.user?.role
    })
    
    if (!session?.user) {
      console.log('❌ No session or user found')
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is a provider
    if (session.user.role !== 'PROVIDER') {
      console.log('❌ User is not a provider:', session.user.role)
      return NextResponse.json(
        { error: 'Provider access required' },
        { status: 403 }
      )
    }

    // Parse request body
    const requestBody = await request.json()
    console.log('📝 Request body:', requestBody)
    
    const { bookingId, status } = requestBody

    if (!bookingId || !status) {
      console.log('❌ Missing required fields:', { bookingId, status })
      return NextResponse.json(
        { error: 'Booking ID and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      console.log('❌ Invalid status:', status)
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    console.log('🔗 Connecting to database...')
    const { db } = await connectToDatabase()
    const providerEmail = session.user.email

    console.log('🏢 Looking for business listings for provider:', providerEmail)
    
    // Get provider's business listings to verify ownership
    const businessLists = await db.collection('businesslists')
      .find({ providerEmail: providerEmail })
      .toArray()

    console.log('📋 Business listings found:', businessLists.length)
    
    if (businessLists.length === 0) {
      console.log('❌ No business listings found for provider')
      return NextResponse.json(
        { error: 'No business listings found for provider' },
        { status: 404 }
      )
    }

    const businessIds = businessLists.map(b => b._id)
    console.log('🏢 Business IDs:', businessIds)

    // Validate ObjectId format
    let bookingObjectId
    try {
      bookingObjectId = new ObjectId(bookingId)
      console.log('✅ Valid ObjectId created:', bookingObjectId)
    } catch (error) {
      console.log('❌ Invalid ObjectId format:', bookingId, error.message)
      return NextResponse.json(
        { error: 'Invalid booking ID format' },
        { status: 400 }
      )
    }

    console.log('🔍 Searching for booking:', bookingObjectId)
    
    // Find the booking and verify it belongs to this provider
    const booking = await db.collection('bookings')
      .findOne({
        _id: bookingObjectId,
        businessId: { $in: businessIds }
      })

    console.log('📖 Booking found:', !!booking)
    
    if (!booking) {
      console.log('❌ Booking not found or access denied')
      
      // Additional debugging - check if booking exists at all
      const anyBooking = await db.collection('bookings')
        .findOne({ _id: bookingObjectId })
      
      if (anyBooking) {
        console.log('🔍 Booking exists but belongs to different provider:', anyBooking.businessId)
      } else {
        console.log('🔍 Booking does not exist in database')
      }
      
      return NextResponse.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      )
    }

    // Status transition validation
    const currentStatus = booking.status
    const allowedTransitions = {
      'PENDING': ['CONFIRMED', 'CANCELLED'],
      'CONFIRMED': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [], // No transitions from completed
      'CANCELLED': [] // No transitions from cancelled
    }

    console.log('🔄 Status transition check:', { currentStatus, newStatus: status })

    if (!allowedTransitions[currentStatus]?.includes(status)) {
      console.log('❌ Invalid status transition')
      return NextResponse.json(
        { error: `Cannot transition from ${currentStatus} to ${status}` },
        { status: 400 }
      )
    }

    console.log('💾 Updating booking status...')

    // Update booking status
    const updateResult = await db.collection('bookings')
      .updateOne(
        { _id: bookingObjectId },
        { 
          $set: { 
            status: status,
            updatedAt: new Date(),
            updatedBy: providerEmail
          } 
        }
      )

    console.log('📝 Update result:', updateResult)

    if (updateResult.matchedCount === 0) {
      console.log('❌ Update failed - no matching document')
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // --- Send Confirmation Email ---
    if (status === 'CONFIRMED' && currentStatus !== 'CONFIRMED') {
      const business = businessLists.find(b => b._id.equals(booking.businessId))
      if (booking.userEmail && business) {
        await EmailService.sendBookingConfirmationEmail({
          customerEmail: booking.userEmail,
          customerName: booking.userName,
          providerName: business.name,
          serviceName: business.category, // Assuming business name is the service
          date: booking.date,
          time: booking.time,
        })
      }
    }

    // Log status change for audit
    await db.collection('booking_status_log').insertOne({
      bookingId: bookingObjectId,
      previousStatus: currentStatus,
      newStatus: status,
      changedBy: providerEmail,
      changedAt: new Date(),
      userAgent: request.headers.get('user-agent')
    })

    // Get updated booking
    const updatedBooking = await db.collection('bookings')
      .findOne({ _id: bookingObjectId })

    // Handle cancellation email notification
    if (status === 'CANCELLED') {
      try {
        const business = businessLists.find(b => b._id.equals(booking.businessId))
        if (business && booking.userEmail) {
          await EmailService.sendBookingCancellationEmail({
            customerEmail: booking.userEmail,
            customerName: booking.userName,
            providerName: business.name,
            serviceName: business.category || business.name,
            date: booking.date,
            time: booking.time,
            reason: 'Cancelled by service provider'
          })
          console.log('✅ Cancellation email sent to customer')
        }
      } catch (emailError) {
        // Don't fail the cancellation if email fails
        console.error('❌ Failed to send cancellation email:', emailError)
      }
    }

    // Create notification for customer (if not cancelled by provider)
    if (status !== 'CANCELLED') {
      const notificationMessage = {
        'CONFIRMED': `Your booking has been confirmed! The service provider will contact you soon.`,
        'IN_PROGRESS': `Your service is now in progress. The provider is working on your request.`,
        'COMPLETED': `Your service has been completed! Please leave a review to help other customers.`
      }

      if (notificationMessage[status]) {
        await db.collection('notifications').insertOne({
          userId: booking.userEmail,
          type: 'booking_status_update',
          title: 'Booking Status Update',
          message: notificationMessage[status],
          bookingId: bookingObjectId,
          read: false,
          createdAt: new Date()
        })
      }
    }

    console.log('✅ Booking update completed successfully')

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Booking status updated successfully',
      booking: {
        id: updatedBooking._id.toString(),
        status: updatedBooking.status,
        updatedAt: updatedBooking.updatedAt
      }
    })

  } catch (error) {
    console.error('❌ Error updating booking status:', error)
    return NextResponse.json(
      { error: 'Failed to update booking status', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
} 