import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { EmailService } from '@/app/_services/EmailService'

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

    // Parse request body
    const { bookingId, newDate, newTime, reason } = await request.json()

    if (!bookingId || !newDate || !newTime) {
      return NextResponse.json(
        { error: 'Booking ID, new date, and new time are required' },
        { status: 400 }
      )
    }

    // Validate that the new date is not in the past
    const rescheduleDate = new Date(newDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day
    
    if (rescheduleDate < today) {
      return NextResponse.json(
        { error: 'Cannot reschedule to past dates. Please select a future date.' },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    const providerEmail = session.user.email

    // Get provider's business listings to verify ownership
    const businessLists = await db.collection('businesslists')
      .find({ providerEmail: providerEmail })
      .toArray()

    if (businessLists.length === 0) {
      return NextResponse.json(
        { error: 'No business listings found for provider' },
        { status: 404 }
      )
    }

    const businessIds = businessLists.map(b => b._id)

    // Find the booking and verify it belongs to this provider
    const booking = await db.collection('bookings')
      .findOne({
        _id: new ObjectId(bookingId),
        businessId: { $in: businessIds }
      })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      )
    }

    // Only allow rescheduling for confirmed bookings
    if (booking.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Only confirmed bookings can be rescheduled' },
        { status: 400 }
      )
    }

    // Store original date/time for history
    const originalDate = booking.date
    const originalTime = booking.time

    // Update booking with new date and time
    const updateResult = await db.collection('bookings')
      .updateOne(
        { _id: new ObjectId(bookingId) },
        { 
          $set: { 
            date: newDate,
            time: newTime,
            updatedAt: new Date(),
            rescheduledBy: providerEmail,
            rescheduledAt: new Date(),
            rescheduleReason: reason || 'Provider requested reschedule'
          },
          $push: {
            rescheduleHistory: {
              originalDate,
              originalTime,
              newDate,
              newTime,
              reason: reason || 'Provider requested reschedule',
              rescheduledBy: providerEmail,
              rescheduledAt: new Date()
            }
          }
        }
      )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Create notification for customer
    await db.collection('notifications').insertOne({
      userId: booking.userEmail,
      type: 'booking_rescheduled',
      title: 'Booking Rescheduled',
      message: `Your booking has been rescheduled to ${newDate} at ${newTime}. ${reason ? `Reason: ${reason}` : ''}`,
      bookingId: new ObjectId(bookingId),
      read: false,
      createdAt: new Date()
    })

    // Send email notification to customer
    try {
      const business = businessLists.find(b => b._id.equals(booking.businessId))
      if (business && booking.userEmail) {
        await EmailService.sendBookingRescheduleEmail({
          customerEmail: booking.userEmail,
          customerName: booking.userName,
          providerName: business.name,
          serviceName: business.category || business.name,
          originalDate: originalDate,
          originalTime: originalTime,
          newDate: newDate,
          newTime: newTime,
          reason: reason || 'Provider requested reschedule'
        })
        console.log('✅ Reschedule email sent to customer')
      }
    } catch (emailError) {
      // Don't fail the reschedule if email fails
      console.error('❌ Failed to send reschedule email:', emailError)
    }

    // Get updated booking
    const updatedBooking = await db.collection('bookings')
      .findOne({ _id: new ObjectId(bookingId) })

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Booking rescheduled successfully',
      booking: {
        id: updatedBooking._id.toString(),
        date: updatedBooking.date,
        time: updatedBooking.time,
        updatedAt: updatedBooking.updatedAt
      }
    })

  } catch (error) {
    console.error('Error rescheduling booking:', error)
    return NextResponse.json(
      { error: 'Failed to reschedule booking' },
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