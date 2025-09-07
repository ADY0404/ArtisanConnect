import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const providerEmail = session.user.email
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'
    
    // Convert period to days
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    console.log(`📊 Generating provider reports for ${providerEmail} - last ${days} days`)

    const { db } = await connectToDatabase()

    // Get provider's payment transactions for the period
    const transactions = await db.collection('payment_transactions').find({
      providerEmail: providerEmail,
      createdAt: { $gte: startDate },
      paymentStatus: 'COMPLETED'
    }).toArray()

    // Calculate summary statistics
    const totalRevenue = transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
    const totalCommission = transactions.reduce((sum, t) => sum + (t.platformCommission || 0), 0)
    const totalPayout = transactions.reduce((sum, t) => sum + (t.providerPayout || 0), 0)
    const totalTransactions = transactions.length
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0
    const commissionRate = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0

    // Calculate growth rate (compare with previous period)
    const previousStartDate = new Date()
    previousStartDate.setDate(previousStartDate.getDate() - (days * 2))
    const previousEndDate = new Date()
    previousEndDate.setDate(previousEndDate.getDate() - days)

    const previousTransactions = await db.collection('payment_transactions').find({
      providerEmail: providerEmail,
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
      const monthPayout = monthTransactions.reduce((sum, t) => sum + (t.providerPayout || 0), 0)

      monthlyTrends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        revenue: Math.round(monthRevenue * 100) / 100,
        payout: Math.round(monthPayout * 100) / 100,
        transactions: monthTransactions.length
      })
    }

    // Payment method breakdown
    const paymentMethodStats = transactions.reduce((acc, t) => {
      const method = t.paymentMethod || 'CASH'
      if (!acc[method]) {
        acc[method] = { count: 0, amount: 0, payout: 0 }
      }
      acc[method].count++
      acc[method].amount += (t.totalAmount || 0)
      acc[method].payout += (t.providerPayout || 0)
      return acc
    }, {})

    const totalAmount = Object.values(paymentMethodStats).reduce((sum, stat) => sum + stat.amount, 0)
    const paymentMethodBreakdown = Object.entries(paymentMethodStats).map(([method, stat]) => ({
      name: method,
      value: totalAmount > 0 ? Math.round((stat.amount / totalAmount) * 100) : 0,
      amount: Math.round(stat.amount * 100) / 100,
      payout: Math.round(stat.payout * 100) / 100,
      color: method === 'PAYSTACK' ? '#3B82F6' : '#10B981'
    }))

    // Service breakdown (based on booking categories)
    const serviceStats = transactions.reduce((acc, t) => {
      const service = t.serviceCategory || 'General'
      if (!acc[service]) {
        acc[service] = { count: 0, amount: 0, payout: 0 }
      }
      acc[service].count++
      acc[service].amount += (t.totalAmount || 0)
      acc[service].payout += (t.providerPayout || 0)
      return acc
    }, {})

    const serviceBreakdown = Object.entries(serviceStats)
      .map(([service, stat]) => ({
        name: service,
        value: totalAmount > 0 ? Math.round((stat.amount / totalAmount) * 100) : 0,
        amount: Math.round(stat.amount * 100) / 100,
        payout: Math.round(stat.payout * 100) / 100,
        color: '#6B7280'
      }))
      .sort((a, b) => b.amount - a.amount)

    // Recent transactions
    const recentTransactions = transactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(t => ({
        id: t._id,
        date: t.createdAt,
        amount: t.totalAmount,
        payout: t.providerPayout,
        commission: t.platformCommission,
        paymentMethod: t.paymentMethod,
        customerName: t.customerName || 'Unknown'
      }))

    // Top performing services (based on service categories)
    const topPerformingServices = Object.entries(serviceStats)
      .map(([service, stat]) => ({
        service,
        revenue: Math.round(stat.amount * 100) / 100,
        transactions: stat.count,
        avgValue: stat.count > 0 ? Math.round((stat.amount / stat.count) * 100) / 100 : 0
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
        totalPayout: Math.round(totalPayout * 100) / 100,
        totalCommission: Math.round(totalCommission * 100) / 100,
        totalTransactions,
        averageTransactionValue: Math.round(averageTransactionValue * 100) / 100,
        commissionRate: Math.round(commissionRate * 100) / 100,
        growthRate: Math.round(growthRate * 100) / 100
      },
      monthlyTrends,
      paymentMethodBreakdown,
      serviceTypeBreakdown: serviceBreakdown, // Map serviceBreakdown to serviceTypeBreakdown for consistency
      topPerformingServices,
      commissionTrends,
      recentTransactions
    }

    console.log(`✅ Generated provider reports for ${providerEmail}: ${totalTransactions} transactions, GHS ${totalRevenue.toFixed(2)} revenue`)

    return NextResponse.json({
      success: true,
      reports,
      period,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Error generating provider reports:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate provider reports'
    }, { status: 500 })
  }
}
