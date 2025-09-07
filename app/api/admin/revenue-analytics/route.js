import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ensureConnection } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    await ensureConnection()
    const { db } = await ensureConnection()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    console.log(`📊 Generating revenue analytics for last ${period} days`)

    // Get all payment transactions
    const transactions = await db.collection('payment_transactions').find({
      createdAt: { $gte: startDate },
      paymentStatus: 'COMPLETED'
    }).toArray()

    // Calculate total revenue
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
    
    // Calculate total commission earned
    const totalCommission = transactions.reduce((sum, t) => sum + (t.commissionAmount || 0), 0)

    // Calculate commission by tier
    const commissionByTier = transactions.reduce((acc, t) => {
      const tier = t.providerTier || 'STANDARD'
      if (!acc[tier]) acc[tier] = { count: 0, amount: 0 }
      acc[tier].count++
      acc[tier].amount += (t.commissionAmount || 0)
      return acc
    }, {})

    // Calculate daily revenue for chart
    const dailyRevenue = {}
    const dailyCommission = {}
    
    for (let i = parseInt(period); i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      dailyRevenue[dateKey] = 0
      dailyCommission[dateKey] = 0
    }

    transactions.forEach(t => {
      const dateKey = new Date(t.createdAt).toISOString().split('T')[0]
      if (dailyRevenue[dateKey] !== undefined) {
        dailyRevenue[dateKey] += (t.totalAmount || 0)
        dailyCommission[dateKey] += (t.commissionAmount || 0)
      }
    })

    // Get provider statistics
    const providerStats = await db.collection('businesslists').aggregate([
      {
        $group: {
          _id: '$providerTier',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalRevenue' }
        }
      }
    ]).toArray()

    // Get top performing providers
    const topProviders = await db.collection('payment_transactions').aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          paymentStatus: 'COMPLETED'
        }
      },
      {
        $group: {
          _id: '$providerEmail',
          totalRevenue: { $sum: '$totalAmount' },
          totalCommission: { $sum: '$commissionAmount' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      },
      {
        $limit: 10
      }
    ]).toArray()

    // Get commission payment statistics
    const commissionPayments = await db.collection('commission_payments').find({
      createdAt: { $gte: startDate }
    }).toArray()

    const totalCommissionPaid = commissionPayments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const pendingCommissionPayments = commissionPayments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    // Calculate growth metrics
    const previousPeriodStart = new Date(startDate)
    previousPeriodStart.setDate(previousPeriodStart.getDate() - parseInt(period))
    
    const previousTransactions = await db.collection('payment_transactions').find({
      createdAt: { 
        $gte: previousPeriodStart,
        $lt: startDate
      },
      paymentStatus: 'COMPLETED'
    }).toArray()

    const previousRevenue = previousTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
    const previousCommission = previousTransactions.reduce((sum, t) => sum + (t.commissionAmount || 0), 0)

    const revenueGrowth = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0

    const commissionGrowth = previousCommission > 0 
      ? ((totalCommission - previousCommission) / previousCommission) * 100 
      : 0

    // Format response
    const analytics = {
      overview: {
        totalRevenue: totalRevenue,
        totalCommission: totalCommission,
        totalCommissionPaid: totalCommissionPaid,
        pendingCommissionPayments: pendingCommissionPayments,
        averageCommissionRate: totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0,
        transactionCount: transactions.length,
        revenueGrowth: revenueGrowth,
        commissionGrowth: commissionGrowth
      },
      
      charts: {
        dailyRevenue: Object.entries(dailyRevenue).map(([date, amount]) => ({
          date,
          revenue: amount,
          commission: dailyCommission[date]
        })),
        
        commissionByTier: Object.entries(commissionByTier).map(([tier, data]) => ({
          tier,
          count: data.count,
          amount: data.amount,
          percentage: totalCommission > 0 ? (data.amount / totalCommission) * 100 : 0
        }))
      },
      
      providers: {
        byTier: providerStats.map(stat => ({
          tier: stat._id || 'STANDARD',
          count: stat.count,
          totalRevenue: stat.totalRevenue || 0
        })),
        
        topPerformers: topProviders.map(provider => ({
          email: provider._id,
          totalRevenue: provider.totalRevenue,
          totalCommission: provider.totalCommission,
          transactionCount: provider.transactionCount,
          averageTransactionValue: provider.totalRevenue / provider.transactionCount
        }))
      },
      
      commissionPayments: {
        total: commissionPayments.length,
        completed: commissionPayments.filter(p => p.status === 'COMPLETED').length,
        pending: commissionPayments.filter(p => p.status === 'PENDING').length,
        failed: commissionPayments.filter(p => p.status === 'FAILED').length,
        totalPaid: totalCommissionPaid,
        totalPending: pendingCommissionPayments
      },
      
      period: {
        days: parseInt(period),
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    }

    console.log(`✅ Revenue analytics generated successfully`)
    console.log(`💰 Total Revenue: GHS ${totalRevenue.toFixed(2)}`)
    console.log(`💼 Total Commission: GHS ${totalCommission.toFixed(2)}`)
    console.log(`📈 Revenue Growth: ${revenueGrowth.toFixed(1)}%`)

    return NextResponse.json({
      success: true,
      analytics
    })

  } catch (error) {
    console.error('❌ Error generating revenue analytics:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate revenue analytics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// POST endpoint for custom analytics queries
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const { startDate, endDate, groupBy, filters } = await request.json()

    await ensureConnection()
    const { db } = await ensureConnection()

    const matchConditions = {
      paymentStatus: 'COMPLETED'
    }

    if (startDate && endDate) {
      matchConditions.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }

    if (filters?.providerTier) {
      matchConditions.providerTier = filters.providerTier
    }

    if (filters?.paymentMethod) {
      matchConditions.paymentMethod = filters.paymentMethod
    }

    let groupByField = '$providerEmail'
    if (groupBy === 'tier') groupByField = '$providerTier'
    if (groupBy === 'date') groupByField = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
    if (groupBy === 'month') groupByField = { $dateToString: { format: "%Y-%m", date: "$createdAt" } }

    const customAnalytics = await db.collection('payment_transactions').aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: groupByField,
          totalRevenue: { $sum: '$totalAmount' },
          totalCommission: { $sum: '$commissionAmount' },
          transactionCount: { $sum: 1 },
          averageTransactionValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 50 }
    ]).toArray()

    return NextResponse.json({
      success: true,
      analytics: customAnalytics,
      filters: { startDate, endDate, groupBy, filters }
    })

  } catch (error) {
    console.error('❌ Error generating custom analytics:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate custom analytics'
    }, { status: 500 })
  }
}
