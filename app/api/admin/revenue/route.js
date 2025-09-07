import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Booking } from '@/models/Booking'
import { ensureConnection } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('🔍 Revenue API session check:', session?.user?.email, session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('❌ Revenue API unauthorized:', { 
        hasSession: !!session, 
        userRole: session?.user?.role 
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'

    console.log('💰 Fetching real revenue analytics for timeframe:', timeframe)

    const revenueData = await getRevenueAnalytics(timeframe)

    return NextResponse.json({
      success: true,
      timeframe,
      revenue: revenueData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Revenue analytics error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch revenue analytics'
    }, { status: 500 })
  }
}

async function getRevenueAnalytics(timeframe) {
  try {
    const { startDate, previousStartDate } = getTimeframeDates(timeframe)
    
    // Current period revenue
    const currentRevenue = await getRevenueForPeriod(startDate, new Date())
    
    // Previous period revenue for comparison
    const previousRevenue = await getRevenueForPeriod(previousStartDate, startDate)
    
    // Daily revenue breakdown for current period
    const dailyRevenue = await getDailyRevenueBreakdown(startDate, new Date())
    
    // Revenue by service category
    const categoryRevenue = await getRevenueByCategory(startDate, new Date())
    
    // Calculate growth metrics
    const growthRate = previousRevenue.total > 0 
      ? ((currentRevenue.total - previousRevenue.total) / previousRevenue.total) * 100 
      : 0

    const avgDailyRevenue = currentRevenue.total / getDaysInPeriod(timeframe)
    const avgBookingValue = currentRevenue.bookingCount > 0 
      ? currentRevenue.total / currentRevenue.bookingCount 
      : 0

    return {
      current: {
        total: currentRevenue.total,
        bookingCount: currentRevenue.bookingCount,
        avgBookingValue: Math.round(avgBookingValue * 100) / 100,
        avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100
      },
      previous: {
        total: previousRevenue.total,
        bookingCount: previousRevenue.bookingCount
      },
      growth: {
        revenueGrowthRate: Math.round(growthRate * 100) / 100,
        bookingGrowthRate: previousRevenue.bookingCount > 0 
          ? Math.round(((currentRevenue.bookingCount - previousRevenue.bookingCount) / previousRevenue.bookingCount) * 100 * 100) / 100
          : 0
      },
      trends: {
        daily: dailyRevenue,
        categories: categoryRevenue
      }
    }
  } catch (error) {
    console.error('Error in revenue analytics:', error)
    throw error
  }
}

async function getRevenueForPeriod(startDate, endDate) {
  try {
    const collection = await require('@/lib/database').Database.getCollection('bookings')
    
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'PAID',
          status: { $in: ['CONFIRMED', 'COMPLETED'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
          bookingCount: { $sum: 1 }
        }
      }
    ]
    
    const result = await collection.aggregate(pipeline).toArray()
    return result[0] || { total: 0, bookingCount: 0 }
  } catch (error) {
    console.error('Error getting revenue for period:', error)
    return { total: 0, bookingCount: 0 }
  }
}

async function getDailyRevenueBreakdown(startDate, endDate) {
  try {
    const collection = await require('@/lib/database').Database.getCollection('bookings')
    
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'PAID',
          status: { $in: ['CONFIRMED', 'COMPLETED'] }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }},
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 }}
    ]
    
    const result = await collection.aggregate(pipeline).toArray()
    return result.map(item => ({
      date: item._id,
      revenue: item.revenue,
      bookings: item.bookings
    }))
  } catch (error) {
    console.error('Error getting daily revenue breakdown:', error)
    return []
  }
}

async function getRevenueByCategory(startDate, endDate) {
  try {
    const collection = await require('@/lib/database').Database.getCollection('bookings')
    
    const pipeline = [
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          paymentStatus: 'PAID',
          status: { $in: ['CONFIRMED', 'COMPLETED'] }
        }
      },
      {
        $lookup: {
          from: 'businesses',
          localField: 'businessId',
          foreignField: '_id',
          as: 'business'
        }
      },
      { $unwind: '$business' },
      {
        $lookup: {
          from: 'categories',
          localField: 'business.categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $group: {
          _id: '$category.name',
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 }}
    ]
    
    const result = await collection.aggregate(pipeline).toArray()
    return result.map(item => ({
      category: item._id,
      revenue: item.revenue,
      bookings: item.bookings
    }))
  } catch (error) {
    console.error('Error getting revenue by category:', error)
    return []
  }
}

function getTimeframeDates(timeframe) {
  const now = new Date()
  let startDate, previousStartDate
  
  switch (timeframe) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
      break
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
      break
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)
      break
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
  }
  
  return { startDate, previousStartDate }
}

function getDaysInPeriod(timeframe) {
  switch (timeframe) {
    case '7d': return 7
    case '30d': return 30
    case '90d': return 90
    case '1y': return 365
    default: return 30
  }
} 