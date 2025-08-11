import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { connectDB } from '@/lib/mongodb'
import BusinessListModel from '@/models/BusinessList'
import { Booking } from '@/models/Booking'
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

    // Ensure database connection
    await connectDB()
    
    const providerEmail = session.user.email

    // Get provider's business listings using the model
    const businessLists = await BusinessListModel.getByProvider(providerEmail)

    if (businessLists.length === 0) {
      return NextResponse.json([])
    }

    const businessIds = businessLists.map(b => b._id.toString())

    // Get all bookings for this provider's businesses
    const allBookings = []
    for (const businessId of businessIds) {
      try {
        const businessBookings = await Booking.getByBusiness(businessId)
        allBookings.push(...businessBookings)
      } catch (error) {
        console.error(`Error fetching bookings for business ${businessId}:`, error)
      }
    }

    // Sort by creation date (newest first)
    allBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    // Format bookings for frontend
    const formattedBookings = allBookings.map(booking => ({
      id: booking._id.toString(),
      businessId: booking.businessId?.toString(),
      userName: booking.userName,
      userEmail: booking.userEmail,
      userPhone: booking.userPhone || null,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      serviceDetails: booking.serviceDetails || booking.note || null,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }))

    console.log(`📋 Found ${formattedBookings.length} bookings for provider ${providerEmail}`)
    return NextResponse.json(formattedBookings)

  } catch (error) {
    console.error('Error fetching provider bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
} 