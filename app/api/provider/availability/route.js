import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request) {
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

    // Get provider availability settings
    const availability = await db.collection('provider_availability')
      .findOne({ providerEmail })

    if (!availability) {
      // Return default availability if none exists
      const defaultAvailability = {
        providerEmail,
        workingHours: {
          monday: { enabled: true, start: '09:00', end: '17:00' },
          tuesday: { enabled: true, start: '09:00', end: '17:00' },
          wednesday: { enabled: true, start: '09:00', end: '17:00' },
          thursday: { enabled: true, start: '09:00', end: '17:00' },
          friday: { enabled: true, start: '09:00', end: '17:00' },
          saturday: { enabled: false, start: '09:00', end: '17:00' },
          sunday: { enabled: false, start: '09:00', end: '17:00' }
        },
        blockedSlots: [],
        recurringPatterns: [],
        timezone: 'America/New_York',
        slotDuration: 60, // minutes
        bufferTime: 15, // minutes between bookings
        advanceBooking: 7, // days in advance
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // Save default availability
      await db.collection('provider_availability').insertOne(defaultAvailability)
      return NextResponse.json(defaultAvailability)
    }

    return NextResponse.json(availability)

  } catch (error) {
    console.error('Error fetching provider availability:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}

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
    const availabilityData = await request.json()

    // Validate required fields
    if (!availabilityData.workingHours) {
      return NextResponse.json(
        { error: 'Working hours are required' },
        { status: 400 }
      )
    }

    // Update or create availability
    const updateData = {
      ...availabilityData,
      providerEmail,
      updatedAt: new Date()
    }

    const result = await db.collection('provider_availability')
      .updateOne(
        { providerEmail },
        { 
          $set: updateData,
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      )

    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully',
      upserted: result.upsertedCount > 0
    })

  } catch (error) {
    console.error('Error updating provider availability:', error)
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
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
    const { action, data } = await request.json()

    switch (action) {
      case 'block_time':
        // Block specific time slots
        const { date, startTime, endTime, reason } = data
        
        const blockedSlot = {
          id: new ObjectId().toString(),
          date,
          startTime,
          endTime,
          reason: reason || 'Unavailable',
          createdAt: new Date()
        }

        await db.collection('provider_availability')
          .updateOne(
            { providerEmail },
            { 
              $push: { blockedSlots: blockedSlot },
              $set: { updatedAt: new Date() }
            }
          )

        return NextResponse.json({
          success: true,
          message: 'Time slot blocked successfully',
          blockedSlot
        })

      case 'unblock_time':
        // Remove blocked time slot
        const { slotId } = data
        
        await db.collection('provider_availability')
          .updateOne(
            { providerEmail },
            { 
              $pull: { blockedSlots: { id: slotId } },
              $set: { updatedAt: new Date() }
            }
          )

        return NextResponse.json({
          success: true,
          message: 'Time slot unblocked successfully'
        })

      case 'set_recurring':
        // Set recurring availability pattern
        const { pattern } = data
        
        await db.collection('provider_availability')
          .updateOne(
            { providerEmail },
            { 
              $push: { recurringPatterns: pattern },
              $set: { updatedAt: new Date() }
            }
          )

        return NextResponse.json({
          success: true,
          message: 'Recurring pattern set successfully'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error managing availability:', error)
    return NextResponse.json(
      { error: 'Failed to manage availability' },
      { status: 500 }
    )
  }
} 