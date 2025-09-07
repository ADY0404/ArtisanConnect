import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PaymentTransaction } from '@/models/PaymentTransaction'
import { CommissionService } from '@/app/_services/CommissionService'
import { connectDB } from '@/lib/mongodb'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is a provider
    if (session.user.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'Provider access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '3months'
    const providerEmail = session.user.email

    console.log(`📊 Fetching earnings for provider: ${providerEmail}, period: ${period}`)

    // Ensure database connection
    await connectDB()

    // Use the same data source as commission tracker - PaymentTransaction model
    const allTransactions = await PaymentTransaction.getByProvider(providerEmail)

    console.log(`💰 Found ${allTransactions.length} total transactions for provider`)

    // Calculate period dates
    const now = new Date()
    let startDate = new Date()

    switch (period) {
      case '1month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case '6months':
        startDate.setMonth(now.getMonth() - 6)
        break
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default: // 3months
        startDate.setMonth(now.getMonth() - 3)
    }

    // Filter transactions for the period
    const periodTransactions = allTransactions.filter(t =>
      new Date(t.createdAt) >= startDate && t.paymentStatus === 'COMPLETED'
    )

    // Calculate earnings metrics using the same logic as commission tracker
    // Total earnings = sum of all provider payouts from completed transactions
    const totalEarnings = allTransactions
      .filter(t => t.paymentStatus === 'COMPLETED')
      .reduce((acc, t) => acc + (t.providerPayout || 0), 0)

    console.log(`💰 Total earnings calculated: GHS ${totalEarnings.toFixed(2)}`)

    // This month earnings
    const thisMonthStart = new Date()
    thisMonthStart.setDate(1)
    thisMonthStart.setHours(0, 0, 0, 0)

    const thisMonth = allTransactions
      .filter(t => {
        const transactionDate = new Date(t.createdAt)
        return transactionDate >= thisMonthStart && t.paymentStatus === 'COMPLETED'
      })
      .reduce((acc, t) => acc + (t.providerPayout || 0), 0)

    // Last month earnings
    const lastMonthStart = new Date()
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
    lastMonthStart.setDate(1)
    lastMonthStart.setHours(0, 0, 0, 0)

    const lastMonthEnd = new Date()
    lastMonthEnd.setDate(0)
    lastMonthEnd.setHours(23, 59, 59, 999)

    const lastMonth = allTransactions
      .filter(t => {
        const transactionDate = new Date(t.createdAt)
        return transactionDate >= lastMonthStart && transactionDate <= lastMonthEnd && t.paymentStatus === 'COMPLETED'
      })
      .reduce((acc, t) => acc + (t.providerPayout || 0), 0)

    // Pending payments (cash transactions where commission is owed)
    const pendingPayments = allTransactions
      .filter(t => t.paymentMethod === 'CASH' && t.commissionStatus === 'PENDING')
      .reduce((acc, t) => acc + (t.commissionOwed || 0), 0)

    // Completed jobs count
    const completedJobs = allTransactions.filter(t => t.paymentStatus === 'COMPLETED').length

    // Average job value
    const averageJobValue = completedJobs > 0 ? totalEarnings / completedJobs : 0

    // Generate monthly breakdown for chart
    const monthlyBreakdown = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    for (let i = 3; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      date.setDate(1)
      date.setHours(0, 0, 0, 0)

      const nextMonth = new Date(date)
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      const monthTransactions = allTransactions.filter(t => {
        const transactionDate = new Date(t.createdAt)
        return transactionDate >= date && transactionDate < nextMonth && t.paymentStatus === 'COMPLETED'
      })

      monthlyBreakdown.push({
        month: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
        earnings: monthTransactions.reduce((acc, t) => acc + (t.providerPayout || 0), 0),
        jobs: monthTransactions.length
      })
    }

    // Format period transactions for payment history
    const formattedPayments = periodTransactions.map(t => ({
      id: t._id,
      bookingId: t.bookingId,
      customerName: t.customerName || 'Customer',
      serviceName: t.serviceDescription || 'Service',
      amount: t.totalAmount,
      platformFee: t.platformCommission,
      netAmount: t.providerPayout,
      status: t.paymentStatus.toLowerCase(),
      paymentDate: t.createdAt,
      payoutDate: t.payoutDate || t.createdAt,
      paymentMethod: t.paymentMethod === 'PAYSTACK' ? 'App Payment' : 'Cash Payment'
    }))

    const summary = {
      totalEarnings,
      thisMonth,
      lastMonth,
      pendingPayments,
      completedJobs,
      averageJobValue,
      monthlyTrend: thisMonth > lastMonth ? 'up' : 'down',
      yearToDate: totalEarnings
    }

    console.log(`✅ Earnings summary generated for ${providerEmail}:`, {
      totalEarnings: totalEarnings.toFixed(2),
      thisMonth: thisMonth.toFixed(2),
      completedJobs
    })

    return NextResponse.json({
      summary,
      payments: formattedPayments,
      monthlyBreakdown
    })

  } catch (error) {
    console.error('Error fetching earnings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings data' },
      { status: 500 }
    )
  }
} 