import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongodb'

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

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    
    // Convert period to days
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    console.log(`📊 Generating admin reports for last ${days} days`)

    const { db } = await connectToDatabase()

    // Get all payment transactions for the period
    const transactions = await db.collection('payment_transactions').find({
      createdAt: { $gte: startDate },
      paymentStatus: 'COMPLETED'
    }).toArray()

    // Calculate summary statistics
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
    const totalCommission = transactions.reduce((sum, t) => sum + (t.platformCommission || 0), 0)
    const totalTransactions = transactions.length
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
    const commissionRate = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0

    // Calculate growth rate (compare with previous period)
    const previousStartDate = new Date()
    previousStartDate.setDate(previousStartDate.getDate() - (days * 2))
    const previousEndDate = new Date()
    previousEndDate.setDate(previousEndDate.getDate() - days)

    const previousTransactions = await db.collection('payment_transactions').find({
      createdAt: { 
        $gte: previousStartDate,
        $lt: previousEndDate
      },
      paymentStatus: 'COMPLETED'
    }).toArray()

    const previousRevenue = previousTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
    const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0

    // Generate monthly trends (last 6 months)
    const monthlyTrends = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i, 1)
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1, 0)

      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.createdAt)
        return transactionDate >= monthStart && transactionDate <= monthEnd
      })

      const monthRevenue = monthTransactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
      const monthCommission = monthTransactions.reduce((sum, t) => sum + (t.platformCommission || 0), 0)

      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue: Math.round(monthRevenue * 100) / 100,
        commission: Math.round(monthCommission * 100) / 100,
        transactions: monthTransactions.length
      })
    }

    // Payment method breakdown
    const paymentMethodStats = transactions.reduce((acc, t) => {
      const method = t.paymentMethod || 'CASH'
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0 }
      }
      acc[method].count++
      acc[method].amount += (t.totalAmount || 0)
      return acc
    }, {})

    const totalAmount = Object.values(paymentMethodStats).reduce((sum, stat) => sum + stat.amount, 0)
    const paymentMethodBreakdown = Object.entries(paymentMethodStats).map(([method, stat]) => ({
      name: method,
      value: totalAmount > 0 ? Math.round((stat.amount / totalAmount) * 100) : 0,
      amount: Math.round(stat.amount * 100) / 100,
      color: method === 'PAYSTACK' ? '#3B82F6' : '#10B981'
    }))

    // Service type breakdown (based on provider tier)
    const serviceTypeStats = transactions.reduce((acc, t) => {
      const tier = t.providerTier || 'STANDARD'
      let serviceType = 'Standard'
      if (tier === 'PREMIUM' || tier === 'ENTERPRISE') {
        serviceType = 'Premium'
      }
      
      if (!acc[serviceType]) {
        acc[serviceType] = { count: 0, amount: 0 }
      }
      acc[serviceType].count++
      acc[serviceType].amount += (t.totalAmount || 0)
      return acc
    }, {})

    const serviceTypeBreakdown = Object.entries(serviceTypeStats).map(([type, stat]) => ({
      name: type,
      value: totalAmount > 0 ? Math.round((stat.amount / totalAmount) * 100) : 0,
      amount: Math.round(stat.amount * 100) / 100,
      color: type === 'Premium' ? '#8B5CF6' : '#6B7280'
    }))

    // Top performing providers
    const providerStats = transactions.reduce((acc, t) => {
      const email = t.providerEmail
      if (!acc[email]) {
        acc[email] = { 
          revenue: 0, 
          commission: 0, 
          transactions: 0,
          providerName: t.providerName || 'Unknown'
        }
      }
      acc[email].revenue += (t.totalAmount || 0)
      acc[email].commission += (t.platformCommission || 0)
      acc[email].transactions++
      return acc
    }, {})

    const topProviders = Object.entries(providerStats)
      .map(([email, stats]) => ({
        email,
        name: stats.providerName,
        revenue: Math.round(stats.revenue * 100) / 100,
        commission: Math.round(stats.commission * 100) / 100,
        transactions: stats.transactions
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Top performing services (based on service categories)
    const serviceStats = transactions.reduce((acc, t) => {
      const service = t.serviceCategory || 'General'
      if (!acc[service]) {
        acc[service] = { revenue: 0, transactions: 0 }
      }
      acc[service].revenue += (t.totalAmount || 0)
      acc[service].transactions++
      return acc
    }, {})

    const topPerformingServices = Object.entries(serviceStats)
      .map(([service, stats]) => ({
        service,
        revenue: Math.round(stats.revenue * 100) / 100,
        transactions: stats.transactions,
        avgValue: stats.transactions > 0 ? Math.round((stats.revenue / stats.transactions) * 100) / 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Commission trends (monthly commission earned vs owed)
    const commissionTrends = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i, 1)
      const monthEnd = new Date(monthStart)
      monthEnd.setMonth(monthEnd.getMonth() + 1, 0)

      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.createdAt)
        return transactionDate >= monthStart && transactionDate <= monthEnd
      })

      const monthCommissionEarned = monthTransactions.reduce((sum, t) => sum + (t.platformCommission || 0), 0)
      const monthCommissionOwed = 0 // For now, assume all commission is immediately earned

      commissionTrends.push({
        date: monthStart.toISOString().split('T')[0],
        earned: Math.round(monthCommissionEarned * 100) / 100,
        owed: Math.round(monthCommissionOwed * 100) / 100
      })
    }

    const reports = {
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        totalTransactions,
        averageTransactionValue: Math.round(averageTransactionValue * 100) / 100,
        commissionRate: Math.round(commissionRate * 100) / 100,
        growthRate: Math.round(growthRate * 100) / 100
      },
      monthlyTrends,
      paymentMethodBreakdown,
      serviceTypeBreakdown,
      topPerformingServices,
      commissionTrends,
      topProviders
    }

    console.log(`✅ Generated admin reports: ${totalTransactions} transactions, GHS ${totalRevenue.toFixed(2)} revenue`)

    return NextResponse.json({
      success: true,
      reports,
      period,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error generating admin reports:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate admin reports'
    }, { status: 500 })
  }
}
