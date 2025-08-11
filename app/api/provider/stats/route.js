import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongodb'

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

    // Get provider's business listings
    const businessLists = await db.collection('businesslists')
      .find({ providerEmail: providerEmail })
      .toArray()

    if (businessLists.length === 0) {
      return NextResponse.json({
        totalBookings: 0,
        thisMonthBookings: 0,
        completedBookings: 0,
        averageRating: 0,
        totalReviews: 0,
        responseTime: 0,
        conversionRate: 0,
        repeatCustomers: 0,
        totalRevenue: 0,
        thisMonthRevenue: 0,
        growth: {
          bookings: 0,
          revenue: 0
        }
      })
    }

    const businessIds = businessLists.map(b => b._id)

    // Get all bookings for this provider
    const bookings = await db.collection('bookings')
      .find({ businessId: { $in: businessIds } })
      .toArray()

    // Get all reviews for this provider
    const reviews = await db.collection('reviews')
      .find({ businessId: { $in: businessIds } })
      .toArray()

    // Calculate current month date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    // Filter bookings by time periods
    const thisMonthBookings = bookings.filter(b => 
      new Date(b.createdAt) >= startOfMonth
    )
    
    const lastMonthBookings = bookings.filter(b => 
      new Date(b.createdAt) >= startOfLastMonth && 
      new Date(b.createdAt) <= endOfLastMonth
    )

    const completedBookings = bookings.filter(b => b.status === 'COMPLETED')
    const confirmedBookings = bookings.filter(b => 
      ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(b.status)
    )

    // Calculate average rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0

    // Calculate response time (mock for now - would need message data)
    const responseTime = Math.floor(Math.random() * 60) + 15 // 15-75 minutes mock

    // Calculate conversion rate
    const totalInquiries = bookings.length + Math.floor(bookings.length * 0.3) // Mock inquiries
    const conversionRate = totalInquiries > 0 
      ? Math.round((confirmedBookings.length / totalInquiries) * 100) 
      : 0

    // Calculate repeat customers
    const customerEmails = bookings.map(b => b.userEmail)
    const uniqueCustomers = new Set(bookings.map(b => b.userEmail));
    const repeatCustomersCount = bookings.reduce((acc, b) => {
      acc[b.userEmail] = (acc[b.userEmail] || 0) + 1;
      return acc;
    }, {});
    const repeatRate = (Object.values(repeatCustomersCount).filter(c => c > 1).length / uniqueCustomers.size) * 100 || 0;

    // Top services (assuming businessLists have services)
    const serviceCounts = bookings.reduce((acc, b) => {
      const service = b.serviceDetails || 'General';
      acc[service] = (acc[service] || 0) + 1;
      return acc;
    }, {});
    const topServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // Calculate revenue (mock pricing)
    const completedThisMonth = thisMonthBookings.filter(b => b.status === 'COMPLETED')
    const completedLastMonth = lastMonthBookings.filter(b => b.status === 'COMPLETED')
    
    const avgServicePrice = 150 // Mock average service price
    const totalRevenue = completedBookings.length * avgServicePrice
    const thisMonthRevenue = completedThisMonth.length * avgServicePrice
    const lastMonthRevenue = completedLastMonth.length * avgServicePrice

    // Calculate growth percentages
    const bookingGrowth = lastMonthBookings.length > 0 
      ? Math.round(((thisMonthBookings.length - lastMonthBookings.length) / lastMonthBookings.length) * 100)
      : thisMonthBookings.length > 0 ? 100 : 0

    const revenueGrowth = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : thisMonthRevenue > 0 ? 100 : 0

    const stats = {
      totalBookings: bookings.length,
      thisMonthBookings: thisMonthBookings.length,
      completedBookings: completedBookings.length,
      averageRating: Number(averageRating.toFixed(1)),
      totalReviews: reviews.length,
      responseTime,
      conversionRate,
      repeatCustomers: repeatRate,
      totalRevenue,
      thisMonthRevenue,
      growth: {
        bookings: bookingGrowth,
        revenue: revenueGrowth
      },
      topServices: topServices
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Error fetching provider stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch provider statistics' },
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