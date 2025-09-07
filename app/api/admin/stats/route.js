import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { User } from '@/models/User'
import { Booking } from '@/models/Booking'
import BusinessList from '@/models/BusinessList'
import Category from '@/models/Category'
import { Database } from '@/lib/database'
import { ensureConnection } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('🔍 Admin stats session check:', session?.user?.email, session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('❌ Admin stats unauthorized:', { 
        hasSession: !!session, 
        userRole: session?.user?.role 
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'

    console.log(' Fetching admin statistics for timeframe:', timeframe)

    const [userStats, bookingStats, businessStats, categoryStats, healthData, growthData, commissionData] = await Promise.all([
      User.getStatistics(),
      Booking.getStatistics(), 
      getBusinessStatistics(),
      getCategoryStatistics(),
      getHealthData(),
      getGrowthData(timeframe),
      getCommissionData()
    ])

    return NextResponse.json({
      success: true,
      timeframe,
      overview: {
        totalUsers: userStats.totalUsers || 0,
        totalBookings: bookingStats.totalBookings || 0,
        totalRevenue: bookingStats.totalRevenue || 0,
        totalBusinesses: businessStats.totalBusinesses || 0,
        totalCommission: commissionData.totalCommission || 0,
        averageCommissionRate: commissionData.averageCommissionRate || 0
      },
      users: userStats,
      bookings: bookingStats,
      businesses: businessStats,
      categories: categoryStats,
      health: healthData,
      growth: growthData,
      commission: commissionData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(' Admin stats error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch admin statistics'
    }, { status: 500 })
  }
}

async function getBusinessStatistics() {
  try {
    const businesses = await BusinessList.getAll()
    return {
      totalBusinesses: businesses.length,
      activeBusinesses: businesses.filter(b => b.isActive).length,
      averageRating: businesses.reduce((sum, b) => sum + (b.rating || 0), 0) / businesses.length || 0
    }
  } catch (error) {
    return { totalBusinesses: 0, activeBusinesses: 0, averageRating: 0 }
  }
}

async function getCategoryStatistics() {
  try {
    const categories = await Category.getAll()
    return {
      totalCategories: categories.length,
      categories: categories.map(cat => ({
        id: cat._id.toString(),
        name: cat.name
      }))
    }
  } catch (error) {
    return { totalCategories: 0, categories: [] }
  }
}

async function getHealthData() {
  try {
    // Get basic health metrics
    const uptime = Math.floor(process.uptime())
    const memoryUsage = process.memoryUsage()
    
    // Check database connection
    let databaseStatus = 'connected'
    try {
      await Database.connect()
    } catch (error) {
      databaseStatus = 'disconnected'
    }

    const issues = []
    let status = 'healthy'

    // Check memory usage
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    if (memoryPercent > 85) {
      issues.push('High memory usage')
      status = 'warning'
    }

    // Check database
    if (databaseStatus !== 'connected') {
      issues.push('Database connection issues')
      status = 'unhealthy'
    }

    return {
      status,
      issues,
      uptime,
      memoryUsage: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: Math.round(memoryPercent)
      },
      databaseStatus
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      issues: ['Health check failed'],
      uptime: 0,
      memoryUsage: null,
      databaseStatus: 'unknown'
    }
  }
}

// Add user analytics aggregation
async function getUserAnalytics() {
  // Implement aggregation for overall user metrics like avg bookings per user, etc.
  const users = await db.collection('users').find().toArray();
  const avgBookings = users.reduce((acc, u) => acc + (u.totalBookings || 0), 0) / users.length || 0;
  return { avgBookingsPerUser: avgBookings };
}

// Get growth data for the specified timeframe
async function getGrowthData(timeframe) {
  try {
    const { connectToDatabase } = await import('@/lib/mongodb')
    const { db } = await connectToDatabase()
    
    // Calculate date ranges
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const previousStartDate = new Date()
    previousStartDate.setDate(previousStartDate.getDate() - (days * 2))
    const previousEndDate = new Date()
    previousEndDate.setDate(previousEndDate.getDate() - days)

    // Get current period data
    const currentTransactions = await db.collection('payment_transactions').find({
      createdAt: { $gte: startDate },
      paymentStatus: 'COMPLETED'
    }).toArray()

    // Get previous period data
    const previousTransactions = await db.collection('payment_transactions').find({
      createdAt: { 
        $gte: previousStartDate,
        $lt: previousEndDate
      },
      paymentStatus: 'COMPLETED'
    }).toArray()

    // Calculate current period metrics
    const currentRevenue = currentTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
    const currentBookings = currentTransactions.length

    // Calculate previous period metrics
    const previousRevenue = previousTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
    const previousBookings = previousTransactions.length

    // Calculate growth rates
    const revenueGrowthRate = previousRevenue > 0 ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 : 0
    const bookingGrowthRate = previousBookings > 0 ? ((currentBookings - previousBookings) / previousBookings) * 100 : 0

    return {
      revenueGrowthRate: Math.round(revenueGrowthRate * 100) / 100,
      bookingGrowthRate: Math.round(bookingGrowthRate * 100) / 100,
      userGrowthRate: 0, // Could be calculated from user registrations
      businessGrowthRate: 0 // Could be calculated from business registrations
    }
  } catch (error) {
    console.error('Error getting growth data:', error)
    return {
      revenueGrowthRate: 0,
      bookingGrowthRate: 0,
      userGrowthRate: 0,
      businessGrowthRate: 0
    }
  }
}

// Get commission data
async function getCommissionData() {
  try {
    const { connectToDatabase } = await import('@/lib/mongodb')
    const { db } = await connectToDatabase()
    
    // Get all completed transactions
    const transactions = await db.collection('payment_transactions').find({
      paymentStatus: 'COMPLETED'
    }).toArray()

    // Calculate commission metrics
    const totalCommission = transactions.reduce((sum, t) => sum + (t.platformCommission || 0), 0)
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
    const averageCommissionRate = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0

    return {
      totalCommission: Math.round(totalCommission * 100) / 100,
      averageCommissionRate: Math.round(averageCommissionRate * 100) / 100
    }
  } catch (error) {
    console.error('Error getting commission data:', error)
    return {
      totalCommission: 0,
      averageCommissionRate: 0
    }
  }
}
