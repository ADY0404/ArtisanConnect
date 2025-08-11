import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function POST(request, { params }) {
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
    const quoteId = params.quoteId

    // Get the quote
    const quote = await db.collection('quotes')
      .findOne({ 
        _id: new ObjectId(quoteId),
        providerEmail 
      })

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found or unauthorized' },
        { status: 404 }
      )
    }

    // Check if quote is approved
    if (quote.status !== 'approved') {
      return NextResponse.json(
        { error: 'Quote must be approved before converting to booking' },
        { status: 400 }
      )
    }

    // Create booking from quote
    const booking = {
      // Customer Information
      userName: quote.customerName,
      userEmail: quote.customerEmail,
      userPhone: quote.customerPhone,
      
      // Provider Information
      providerEmail: quote.providerEmail,
      providerName: quote.providerName,
      
      // Service Details
      serviceDetails: quote.serviceTitle,
      description: quote.description,
      
      // Quote Details
      quoteId: new ObjectId(quoteId),
      quotedItems: quote.items,
      quotedTotal: quote.total,
      
      // Booking Status
      status: 'PENDING_SCHEDULE', // Customer needs to select date/time
      bookingType: 'quote_conversion',
      
      // Metadata
      createdAt: new Date(),
      updatedAt: new Date(),
      convertedAt: new Date()
    }

    const result = await db.collection('bookings')
      .insertOne(booking)

    // Update quote status
    await db.collection('quotes')
      .updateOne(
        { _id: new ObjectId(quoteId) },
        { 
          $set: { 
            status: 'converted',
            convertedAt: new Date(),
            bookingId: result.insertedId,
            updatedAt: new Date()
          }
        }
      )

    // Create notification for customer
    if (quote.customerEmail) {
      await db.collection('notifications')
        .insertOne({
          userEmail: quote.customerEmail,
          type: 'quote_converted',
          title: 'Quote Converted to Booking',
          message: `Your approved quote for "${quote.serviceTitle}" has been converted to a booking. Please schedule your service.`,
          data: {
            bookingId: result.insertedId.toString(),
            quoteId: quoteId,
            serviceTitle: quote.serviceTitle,
            total: quote.total
          },
          isRead: false,
          createdAt: new Date()
        })
    }

    // Send real-time notification via Socket.IO if available
    try {
      const io = global.io
      if (io && quote.customerEmail) {
        io.to(`user_${quote.customerEmail}`).emit('quote_converted', {
          bookingId: result.insertedId.toString(),
          quoteId,
          serviceTitle: quote.serviceTitle,
          total: quote.total,
          timestamp: new Date()
        })
      }
    } catch (socketError) {
      console.log('Socket.IO not available:', socketError.message)
    }

    return NextResponse.json({
      success: true,
      message: 'Quote converted to booking successfully',
      bookingId: result.insertedId.toString(),
      booking: {
        id: result.insertedId.toString(),
        ...booking
      }
    })

  } catch (error) {
    console.error('Error converting quote to booking:', error)
    return NextResponse.json(
      { error: 'Failed to convert quote to booking' },
      { status: 500 }
    )
  }
} 