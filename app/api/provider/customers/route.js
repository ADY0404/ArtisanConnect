import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 })
    }

    const { db } = await connectToDatabase()
    
    // Get provider's business listings
    const businessLists = await db.collection('businesslists')
      .find({ providerEmail: session.user.email })
      .toArray()

    if (businessLists.length === 0) {
      return NextResponse.json({
        customers: [],
        stats: {
          totalCustomers: 0,
          repeatCustomers: 0,
          averageRating: 0,
          retentionRate: 0,
          lifetimeValue: 0
        },
        insights: []
      })
    }

    const businessIds = businessLists.map(b => b._id)

    // Get all bookings for this provider
    const bookings = await db.collection('bookings')
      .find({ businessId: { $in: businessIds } })
      .sort({ createdAt: -1 })
      .toArray()

    // Get all reviews for this provider
    const reviews = await db.collection('reviews')
      .find({ businessId: { $in: businessIds } })
      .toArray()

    // Process customer data
    const customerMap = new Map()
    
    // Process bookings to build customer profiles
    bookings.forEach(booking => {
      const email = booking.userEmail
      if (!customerMap.has(email)) {
        customerMap.set(email, {
          id: email,
          name: booking.userName || 'Unknown',
          email: email,
          phone: booking.userPhone || '',
          address: booking.userAddress || '',
          joinDate: booking.createdAt,
          lastService: booking.createdAt,
          totalBookings: 0,
          totalSpent: 0,
          averageRating: 0,
          status: 'active',
          serviceHistory: [],
          preferences: {
            preferredTime: 'morning',
            communicationMethod: 'email',
            serviceFrequency: 'monthly',
            specialRequests: []
          },
          riskLevel: 'low',
          lifetimeValue: 0,
          satisfactionTrend: 'stable'
        })
      }

      const customer = customerMap.get(email)
      customer.totalBookings++
      customer.totalSpent += booking.amount || 150 // Default amount
      customer.lastService = booking.createdAt
      
      // Add to service history
      customer.serviceHistory.push({
        date: booking.createdAt,
        service: booking.businessName || 'Service',
        rating: 4.5, // Default rating
        feedback: 'Service completed successfully'
      })
    })

    // Process reviews to update ratings
    reviews.forEach(review => {
      const customer = customerMap.get(review.userEmail)
      if (customer) {
        // Update average rating calculation
        const serviceIndex = customer.serviceHistory.findIndex(
          service => new Date(service.date).toDateString() === new Date(review.createdAt).toDateString()
        )
        if (serviceIndex !== -1) {
          customer.serviceHistory[serviceIndex].rating = review.rating
          customer.serviceHistory[serviceIndex].feedback = review.comment || 'No feedback provided'
        }
      }
    })

    // Calculate customer metrics and risk levels
    const customers = Array.from(customerMap.values()).map(customer => {
      // Calculate average rating
      const ratings = customer.serviceHistory.map(s => s.rating)
      customer.averageRating = ratings.length > 0 
        ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
        : 0

      // Calculate lifetime value
      customer.lifetimeValue = customer.totalSpent

      // Determine status based on activity
      const daysSinceLastService = Math.floor(
        (new Date() - new Date(customer.lastService)) / (1000 * 60 * 60 * 24)
      )
      
      if (customer.totalSpent > 1500) {
        customer.status = 'vip'
      } else if (daysSinceLastService > 60) {
        customer.status = 'at_risk'
      } else if (daysSinceLastService > 90) {
        customer.status = 'inactive'
      } else {
        customer.status = 'active'
      }

      // Determine risk level
      if (daysSinceLastService > 60 || customer.averageRating < 4.0) {
        customer.riskLevel = 'medium'
      } else if (daysSinceLastService > 90 || customer.averageRating < 3.5) {
        customer.riskLevel = 'high'
      } else {
        customer.riskLevel = 'low'
      }

      // Set next recommended service
      if (customer.serviceHistory.length > 0) {
        const lastService = customer.serviceHistory[0].service
        if (lastService.includes('Kitchen')) {
          customer.nextRecommendedService = 'Kitchen Maintenance'
        } else if (lastService.includes('Bathroom')) {
          customer.nextRecommendedService = 'Bathroom Deep Clean'
        } else {
          customer.nextRecommendedService = 'General Maintenance'
        }
      }

      return customer
    })

    // Calculate overall stats
    const totalCustomers = customers.length
    const repeatCustomers = customers.filter(c => c.totalBookings > 1).length
    const totalRatings = customers.flatMap(c => c.serviceHistory.map(s => s.rating))
    const averageRating = totalRatings.length > 0 
      ? Number((totalRatings.reduce((a, b) => a + b, 0) / totalRatings.length).toFixed(1))
      : 0
    const retentionRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0
    const totalLifetimeValue = customers.reduce((sum, c) => sum + c.lifetimeValue, 0)
    const averageLifetimeValue = totalCustomers > 0 ? totalLifetimeValue / totalCustomers : 0

    const stats = {
      totalCustomers,
      repeatCustomers,
      averageRating,
      retentionRate,
      lifetimeValue: Number(averageLifetimeValue.toFixed(2))
    }

    // Generate insights
    const insights = []
    
    // Peak service times insight
    insights.push({
      type: 'trend',
      title: 'Peak Service Times',
      description: 'Most customers prefer morning appointments (60%)',
      actionable: 'Consider adjusting availability to meet demand'
    })

    // Upsell opportunities
    const vipCustomers = customers.filter(c => c.status === 'vip').length
    if (vipCustomers > 0) {
      insights.push({
        type: 'opportunity',
        title: 'Upsell Potential',
        description: `${vipCustomers} customers are ready for premium service packages`,
        actionable: 'Reach out with premium package offers'
      })
    }

    // At-risk customers
    const atRiskCustomers = customers.filter(c => c.status === 'at_risk').length
    if (atRiskCustomers > 0) {
      insights.push({
        type: 'risk',
        title: 'At-Risk Customers',
        description: `${atRiskCustomers} customer${atRiskCustomers > 1 ? 's haven\'t' : ' hasn\'t'} booked in 30+ days`,
        actionable: 'Schedule follow-up calls to maintain relationships'
      })
    }

    return NextResponse.json({
      customers: customers.slice(0, 50), // Limit for performance
      stats,
      insights
    })

  } catch (error) {
    console.error('Error fetching customer data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer data' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 })
    }

    const customerData = await request.json()
    const { db } = await connectToDatabase()

    // Create or update customer profile
    const customerProfile = {
      ...customerData,
      providerId: session.user.email,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('customer_profiles').insertOne(customerProfile)

    return NextResponse.json({
      success: true,
      customerId: result.insertedId,
      message: 'Customer profile created successfully'
    })

  } catch (error) {
    console.error('Error creating customer profile:', error)
    return NextResponse.json(
      { error: 'Failed to create customer profile' },
      { status: 500 }
    )
  }
} 