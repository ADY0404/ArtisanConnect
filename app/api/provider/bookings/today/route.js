import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
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

    // Get today's date (without time)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get tomorrow's date (for comparison)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Get all bookings for this provider's businesses
    const todayBookings = []
    for (const businessId of businessIds) {
      try {
        // Use the Booking model's methods
        const businessBookings = await Booking.getByBusiness(businessId)
        // Filter for today's bookings
        const todayBusinessBookings = businessBookings.filter(booking => {
          const bookingDate = new Date(booking.date)
          return bookingDate >= today && bookingDate < tomorrow
        })
        
                  todayBookings.push(...todayBusinessBookings)
      } catch (error) {
        console.error(`Error fetching today's bookings for business ${businessId}:`, error)
      }
    }

    // Format bookings for frontend
    const formattedBookings = todayBookings.map(booking => ({
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

    console.log(`📋 Found ${formattedBookings.length} bookings for today for provider ${providerEmail}`)
    return NextResponse.json(formattedBookings)

  } catch (error) {
    console.error('Error fetching today\'s bookings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch today\'s bookings' },
      { status: 500 }
    )
  }
} 