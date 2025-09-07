import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
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

    // Parse request body
    const { bookingId, note } = await request.json()

    if (!bookingId || !note?.trim()) {
      return NextResponse.json(
        { error: 'Booking ID and note are required' },
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

    // Create note object
    const providerNote = {
      id: new ObjectId().toString(),
      note: note.trim(),
      addedBy: providerEmail,
      addedAt: new Date(),
      type: 'provider_note'
    }

    // Add note to booking
    const updateResult = await db.collection('bookings')
      .updateOne(
        { _id: new ObjectId(bookingId) },
        { 
          $push: { 
            providerNotes: providerNote
          },
          $set: {
            updatedAt: new Date()
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
      type: 'provider_note_added',
      title: 'Service Provider Added a Note',
      message: `Your service provider has added a note to your booking: "${note.substring(0, 100)}${note.length > 100 ? '...' : ''}"`,
      bookingId: new ObjectId(bookingId),
      read: false,
      createdAt: new Date()
    })

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Note added successfully',
      note: providerNote
    })

  } catch (error) {
    console.error('Error adding note to booking:', error)
    return NextResponse.json(
      { error: 'Failed to add note' },
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