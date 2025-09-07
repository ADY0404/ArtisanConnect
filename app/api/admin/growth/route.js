import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { User } from '@/models/User'
import { Booking } from '@/models/Booking'
import BusinessList from '@/models/BusinessList'
import { ensureConnection } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('🔍 Growth API session check:', session?.user?.email, session?.user?.role)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      console.log('❌ Growth API unauthorized:', { 
        hasSession: !!session, 
        userRole: session?.user?.role 
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get('timeframe') || '30d'

    console.log('📈 Fetching real growth metrics for timeframe:', timeframe)

    const growthData = await getGrowthMetrics(timeframe)

    return NextResponse.json({
      success: true,
      timeframe,
      growth: growthData,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Growth metrics error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch growth metrics'
    }, { status: 500 })
  }
}

async function getGrowthMetrics(timeframe) {
  try {
    const { startDate, previousStartDate } = getTimeframeDates(timeframe)
    
    // Get current and previous period data
    const [
      currentUsers,
      previousUsers,
      currentBookings,
      previousBookings,
      currentBusinesses,
      previousBusinesses,
      userRetention,
      dailyGrowth
    ] = await Promise.all([
      getUserMetrics(startDate, new Date()),
      getUserMetrics(previousStartDate, startDate),
      getBookingMetrics(startDate, new Date()),
      getBookingMetrics(previousStartDate, startDate),
      getBusinessMetrics(startDate, new Date()),
      getBusinessMetrics(previousStartDate, startDate),
      getUserRetentionMetrics(timeframe),
      getDailyGrowthTrends(startDate, new Date())
    ])

    // Calculate growth rates
    const userGrowthRate = calculateGrowthRate(currentUsers.newUsers, previousUsers.newUsers)
    const bookingGrowthRate = calculateGrowthRate(currentBookings.totalBookings, previousBookings.totalBookings)
    const businessGrowthRate = calculateGrowthRate(currentBusinesses.newBusinesses, previousBusinesses.newBusinesses)
    const revenueGrowthRate = calculateGrowthRate(currentBookings.totalRevenue, previousBookings.totalRevenue)

    return {
      userAcquisition: {
        current: currentUsers.newUsers,
        previous: previousUsers.newUsers,
        growthRate: userGrowthRate,
        totalUsers: currentUsers.totalUsers,
        activeUsers: currentUsers.activeUsers,
        activationRate: currentUsers.totalUsers > 0 ? (currentUsers.activeUsers / currentUsers.totalUsers) * 100 : 0
      },
      bookingGrowth: {
        current: currentBookings.totalBookings,
        previous: previousBookings.totalBookings,
        growthRate: bookingGrowthRate,
        completionRate: currentBookings.totalBookings > 0 ? (currentBookings.completedBookings / currentBookings.totalBookings) * 100 : 0,
        avgBookingValue: currentBookings.totalBookings > 0 ? currentBookings.totalRevenue / currentBookings.totalBookings : 0
      },
      businessGrowth: {
        current: currentBusinesses.newBusinesses,
        previous: previousBusinesses.newBusinesses,
        growthRate: businessGrowthRate,
        totalBusinesses: currentBusinesses.totalBusinesses,
        activeBusinesses: currentBusinesses.activeBusinesses,
        utilizationRate: currentBusinesses.totalBusinesses > 0 ? (currentBusinesses.activeBusinesses / currentBusinesses.totalBusinesses) * 100 : 0
      },
      revenueGrowth: {
        current: currentBookings.totalRevenue,
        previous: previousBookings.totalRevenue,
        growthRate: revenueGrowthRate,
        avgDailyRevenue: currentBookings.totalRevenue / getDaysInPeriod(timeframe)
      },
      retention: userRetention,
      trends: {
        daily: dailyGrowth,
        keyMetrics: {
          customerAcquisitionCost: calculateCAC(currentUsers.newUsers, currentBookings.totalRevenue),
          lifetimeValue: calculateLTV(userRetention.averageLifespan, currentBookings.totalRevenue, currentUsers.totalUsers),
          churnRate: userRetention.churnRate
        }
      }
    }
  } catch (error) {
    console.error('Error in growth metrics:', error)
    throw error
  }
}

async function getUserMetrics(startDate, endDate) {
  try {
    const collection = await require('@/lib/database').Database.getCollection('users')
    
    const pipeline = [
      {
        $facet: {
          newUsers: [
            { $match: { createdAt: { $gte: startDate, $lte: endDate } }},
            { $count: "count" }
          ],
          totalUsers: [
            { $match: { createdAt: { $lte: endDate } }},
            { $count: "count" }
          ],
          activeUsers: [
            { 
              $match: { 
                createdAt: { $lte: endDate },
                isActive: true,
                $or: [
                  { lastLogin: { $gte: startDate }},
                  { lastLogin: null, createdAt: { $gte: startDate }}
                ]
              }
            },
            { $count: "count" }
          ]
        }
      }
    ]
    
    const result = await collection.aggregate(pipeline).toArray()
    const data = result[0]
    
    return {
      newUsers: data.newUsers[0]?.count || 0,
      totalUsers: data.totalUsers[0]?.count || 0,
      activeUsers: data.activeUsers[0]?.count || 0
    }
  } catch (error) {
    console.error('Error getting user metrics:', error)
    return { newUsers: 0, totalUsers: 0, activeUsers: 0 }
  }
}

async function getBookingMetrics(startDate, endDate) {
  try {
    const collection = await require('@/lib/database').Database.getCollection('bookings')
    
    const pipeline = [
      {
        $match: { createdAt: { $gte: startDate, $lte: endDate } }
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
          },
          totalRevenue: {
            $sum: { 
              $cond: [
                { $eq: ['$paymentStatus', 'PAID'] }, 
                '$totalAmount', 
                0
              ] 
            }
          }
        }
      }
    ]
    
    const result = await collection.aggregate(pipeline).toArray()
    return result[0] || { totalBookings: 0, completedBookings: 0, totalRevenue: 0 }
  } catch (error) {
    console.error('Error getting booking metrics:', error)
    return { totalBookings: 0, completedBookings: 0, totalRevenue: 0 }
  }
}

async function getBusinessMetrics(startDate, endDate) {
  try {
    const businesses = await BusinessList.getAll()
    
    const newBusinesses = businesses.filter(b => 
      new Date(b.createdAt) >= startDate && new Date(b.createdAt) <= endDate
    ).length
    
    const totalBusinesses = businesses.filter(b => 
      new Date(b.createdAt) <= endDate
    ).length
    
    const activeBusinesses = businesses.filter(b => 
      new Date(b.createdAt) <= endDate && b.isActive
    ).length
    
    return {
      newBusinesses,
      totalBusinesses,
      activeBusinesses
    }
  } catch (error) {
    console.error('Error getting business metrics:', error)
    return { newBusinesses: 0, totalBusinesses: 0, activeBusinesses: 0 }
  }
}

async function getUserRetentionMetrics(timeframe) {
  try {
    const collection = await require('@/lib/database').Database.getCollection('users')
    
    // Calculate retention based on login activity
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    
    const totalUsers = await collection.countDocuments({ createdAt: { $lte: thirtyDaysAgo }})
    const activeUsers = await collection.countDocuments({
      createdAt: { $lte: thirtyDaysAgo },
      $or: [
        { lastLogin: { $gte: thirtyDaysAgo }},
        { lastLogin: null, createdAt: { $gte: thirtyDaysAgo }}
      ]
    })
    
    const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0
    const churnRate = 100 - retentionRate
    
    return {
      retentionRate: Math.round(retentionRate * 100) / 100,
      churnRate: Math.round(churnRate * 100) / 100,
      averageLifespan: retentionRate > 0 ? Math.round(30 / (churnRate / 100)) : 0
    }
  } catch (error) {
    console.error('Error getting retention metrics:', error)
    return { retentionRate: 0, churnRate: 0, averageLifespan: 0 }
  }
}

async function getDailyGrowthTrends(startDate, endDate) {
  try {
    const userCollection = await require('@/lib/database').Database.getCollection('users')
    const bookingCollection = await require('@/lib/database').Database.getCollection('bookings')
    
    const pipeline = [
      {
        $match: { createdAt: { $gte: startDate, $lte: endDate } }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }},
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 }}
    ]
    
    const [userTrends, bookingTrends] = await Promise.all([
      userCollection.aggregate(pipeline).toArray(),
      bookingCollection.aggregate(pipeline).toArray()
    ])
    
    // Merge trends by date
    const trendMap = new Map()
    
    userTrends.forEach(item => {
      trendMap.set(item._id, { date: item._id, users: item.count, bookings: 0 })
    })
    
    bookingTrends.forEach(item => {
      const existing = trendMap.get(item._id) || { date: item._id, users: 0, bookings: 0 }
      existing.bookings = item.count
      trendMap.set(item._id, existing)
    })
    
    return Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  } catch (error) {
    console.error('Error getting daily growth trends:', error)
    return []
  }
}

function calculateGrowthRate(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100 * 100) / 100
}

function calculateCAC(newUsers, revenue) {
  // Simplified CAC calculation (assuming 20% of revenue goes to marketing)
  const marketingSpend = revenue * 0.2
  return newUsers > 0 ? Math.round((marketingSpend / newUsers) * 100) / 100 : 0
}

function calculateLTV(averageLifespan, totalRevenue, totalUsers) {
  // Simplified LTV calculation
  const avgRevenuePerUser = totalUsers > 0 ? totalRevenue / totalUsers : 0
  return Math.round(avgRevenuePerUser * (averageLifespan / 30) * 100) / 100
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