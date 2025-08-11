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

    // Get active work sessions
    const activeSessions = await db.collection('work_sessions')
      .find({ 
        providerEmail,
        status: 'active'
      })
      .sort({ startTime: -1 })
      .toArray()

    return NextResponse.json(activeSessions)

  } catch (error) {
    console.error('Error fetching work sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work sessions' },
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
    const { bookingId, action, notes, materials, photos } = await request.json()

    if (action === 'start') {
      // Check if there's already an active session for this booking
      const existingSession = await db.collection('work_sessions')
        .findOne({ 
          bookingId: new ObjectId(bookingId),
          status: 'active'
        })

      if (existingSession) {
        return NextResponse.json(
          { error: 'Work session already active for this booking' },
          { status: 400 }
        )
      }

      // Create new work session
      const workSession = {
        bookingId: new ObjectId(bookingId),
        providerEmail,
        startTime: new Date(),
        status: 'active',
        photos: { before: [], during: [], after: [] },
        materials: [],
        notes: '',
        createdAt: new Date()
      }

      const result = await db.collection('work_sessions')
        .insertOne(workSession)

      // Update booking status to IN_PROGRESS
      await db.collection('bookings')
        .updateOne(
          { _id: new ObjectId(bookingId) },
          { 
            $set: { 
              status: 'IN_PROGRESS',
              workStartedAt: new Date(),
              updatedAt: new Date()
            }
          }
        )

      return NextResponse.json({
        id: result.insertedId.toString(),
        ...workSession
      })

    } else if (action === 'end') {
      // End work session
      const endTime = new Date()
      
      const updateData = {
        endTime,
        status: 'completed',
        notes: notes || '',
        materials: materials || [],
        photos: photos || { before: [], during: [], after: [] },
        updatedAt: endTime
      }

      // Calculate duration
      const session = await db.collection('work_sessions')
        .findOne({ 
          bookingId: new ObjectId(bookingId),
          status: 'active'
        })

      if (session) {
        const duration = Math.floor((endTime - session.startTime) / 1000 / 60) // minutes
        updateData.duration = duration
      }

      await db.collection('work_sessions')
        .updateOne(
          { 
            bookingId: new ObjectId(bookingId),
            status: 'active'
          },
          { $set: updateData }
        )

      // Update booking status to COMPLETED
      await db.collection('bookings')
        .updateOne(
          { _id: new ObjectId(bookingId) },
          { 
            $set: { 
              status: 'COMPLETED',
              workCompletedAt: endTime,
              workDuration: updateData.duration,
              updatedAt: endTime
            }
          }
        )

      // Send completion notification to customer
      await db.collection('notifications')
        .insertOne({
          bookingId: new ObjectId(bookingId),
          type: 'work_completed',
          message: 'Your service has been completed! Please review the work and leave feedback.',
          createdAt: new Date(),
          isRead: false
        })

      return NextResponse.json({
        success: true,
        message: 'Work session completed successfully'
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "end"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Error managing work session:', error)
    return NextResponse.json(
      { error: 'Failed to manage work session' },
      { status: 500 }
    )
  }
} 