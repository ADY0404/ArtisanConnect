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

    const [userStats, bookingStats, businessStats, categoryStats, healthData] = await Promise.all([
      User.getStatistics(),
      Booking.getStatistics(), 
      getBusinessStatistics(),
      getCategoryStatistics(),
      getHealthData()
    ])

    return NextResponse.json({
      success: true,
      timeframe,
      overview: {
        totalUsers: userStats.totalUsers || 0,
        totalBookings: bookingStats.totalBookings || 0,
        totalRevenue: bookingStats.totalRevenue || 0,
        totalBusinesses: businessStats.totalBusinesses || 0
      },
      users: userStats,
      bookings: bookingStats,
      businesses: businessStats,
      categories: categoryStats,
      health: healthData,
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
