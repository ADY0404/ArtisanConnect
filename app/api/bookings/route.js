import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Booking } from '@/models/Booking'
import { EmailService } from '@/app/_services/EmailService'
import { connectDB } from '@/lib/mongodb'
import BusinessList from '@/models/BusinessList'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('userEmail')
    
    console.log(`📋 API: Fetching bookings for user: ${userEmail}`)
    
    if (!userEmail) {
      console.log('❌ API: No user email provided')
      return NextResponse.json({
        success: false,
        error: 'User email required'
      }, { status: 400 })
    }
    
    const bookings = await Booking.getByUserEmail(userEmail)
    console.log(`📋 API: Retrieved ${bookings.length} bookings from database`)
    
    const transformedBookings = bookings.map(booking => {
      console.log(`📋 API: Processing booking ${booking._id}`)
      return {
        id: booking._id.toString(),
        date: booking.date,
        time: booking.time,
        status: booking.status,
        serviceDetails: booking.serviceDetails,
        totalAmount: booking.totalAmount,
        paymentStatus: booking.paymentStatus,
        businessList: {
          id: booking.business._id.toString(),
          name: booking.business.name,
          about: booking.business.about,
          address: booking.business.address,
          contactPerson: booking.business.contactPerson,
          email: booking.business.email,
          phone: booking.business.phone,
          images: booking.business.images,
          category: {
            id: booking.business.category._id?.toString() || null,
            name: booking.business.category.name,
            backgroundColor: booking.business.category.backgroundColor,
            icon: booking.business.category.icon
          }
        }
      }
    })
    
    console.log(`📋 API: Returning ${transformedBookings.length} transformed bookings`)
    
    return NextResponse.json({
      success: true,
      bookings: transformedBookings
    })
  } catch (error) {
    console.error('❌ API Error fetching bookings:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch bookings',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // Check authentication and role
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      console.log('❌ API: Booking attempt without authentication')
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    // Only customers can create bookings
    if (session.user.role !== 'CUSTOMER') {
      console.log(`❌ API: Booking attempt by ${session.user.role} user: ${session.user.email}`)
      return NextResponse.json({
        success: false,
        error: 'Only customers can book appointments. Admins and providers cannot create bookings.'
      }, { status: 403 })
    }
    
    const body = await request.json()
    const { BusinessList, UserEmail, UserName, Date, Time, Note } = body
    
    // Verify the user email matches the session
    if (UserEmail !== session.user.email) {
      console.log(`❌ API: Email mismatch - session: ${session.user.email}, provided: ${UserEmail}`)
      return NextResponse.json({
        success: false,
        error: 'Email mismatch. You can only book for your own account.'
      }, { status: 403 })
    }
    
    console.log('📋 API: Creating new booking with data:', {
      BusinessList,
      UserEmail,
      UserName,
      Date,
      Time,
      Note,
      userRole: session.user.role
    })
    
    // Validate that the booking date is not in the past
    const bookingDate = new Date(Date)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day
    
    if (bookingDate < today) {
      console.log('❌ API: Attempt to book past date:', Date)
      return NextResponse.json({
        success: false,
        error: 'Cannot book appointments for past dates. Please select a future date.'
      }, { status: 400 })
    }
    
    // Create the booking
    const result = await Booking.create({
      businessId: BusinessList,
      userEmail: UserEmail,
      userName: UserName,
      date: Date,
      time: Time,
      serviceDetails: Note || '',
      totalAmount: 0
    })
    
    console.log('📋 API: Booking created successfully:', {
      bookingId: result.bookingId.toString(),
      userEmail: UserEmail
    })

    // Send email notifications
    try {
      // Connect to DB and get business/provider details
      await connectDB()
      const business = await BusinessList.findById(BusinessList)
      
      if (business && business.providerEmail) {
        // Send notification to provider
        const providerNotificationData = {
          providerEmail: business.providerEmail,
          providerName: business.contactPerson || business.name,
          customerName: UserName,
          customerEmail: UserEmail,
          customerPhone: '', // We don't have phone in current booking form
          serviceName: business.name,
          date: Date,
          time: Time,
          notes: Note,
          bookingId: result.bookingId.toString()
        }
        
        await EmailService.sendProviderBookingNotification(providerNotificationData)
        console.log('✅ Provider notification email sent')
        
        // Send confirmation to customer
        const customerConfirmationData = {
          customerEmail: UserEmail,
          customerName: UserName,
          providerName: business.contactPerson || business.name,
          serviceName: business.name,
          date: Date,
          time: Time
        }
        
        await EmailService.sendBookingConfirmationEmail(customerConfirmationData)
        console.log('✅ Customer confirmation email sent')
      } else {
        console.log('⚠️ No provider email found for business:', BusinessList)
      }
    } catch (emailError) {
      // Don't fail the booking if emails fail
      console.error('❌ Email notification error (booking still created):', emailError)
    }
    
    return NextResponse.json({
      success: true,
      createBooking: {
        id: result.bookingId.toString()
      }
    })
  } catch (error) {
    console.error('❌ API Error creating booking:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create booking',
      details: error.stack
    }, { status: 500 })
  }
} 