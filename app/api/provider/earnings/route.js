import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectToDatabase } from '@/lib/mongodb'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ensureConnection } from '@/lib/mongodb'
import { Booking } from '@/models/Booking'
import BusinessList from '@/models/BusinessList'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '3months'

    const { db } = await connectToDatabase()
    
    // Get payment history for the provider
    const payments = await db.collection('payments')
      .find({ providerId: session.user.id || session.user.email })
      .sort({ paymentDate: -1 })
      .toArray()

    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case '1month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case '3months':
        startDate.setMonth(now.getMonth() - 3)
        break
      case '6months':
        startDate.setMonth(now.getMonth() - 6)
        break
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setMonth(now.getMonth() - 3)
    }

    // Filter payments by period
    const periodPayments = payments.filter(payment => 
      new Date(payment.paymentDate) >= startDate
    )

    // Calculate summary statistics
    const totalEarnings = payments.reduce((acc, payment) => acc + (payment.netAmount || 0), 0)
    const thisMonth = payments
      .filter(p => new Date(p.paymentDate).getMonth() === now.getMonth())
      .reduce((acc, payment) => acc + (payment.netAmount || 0), 0)
    
    const lastMonth = payments
      .filter(p => {
        const paymentDate = new Date(p.paymentDate)
        const lastMonthDate = new Date()
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1)
        return paymentDate.getMonth() === lastMonthDate.getMonth()
      })
      .reduce((acc, payment) => acc + (payment.netAmount || 0), 0)

    const pendingPayments = payments
      .filter(p => p.status === 'pending' || p.status === 'processing')
      .reduce((acc, payment) => acc + (payment.netAmount || 0), 0)

    const completedJobs = payments.filter(p => p.status === 'completed').length
    const averageJobValue = completedJobs > 0 ? totalEarnings / completedJobs : 0

    // Generate monthly breakdown
    const monthlyBreakdown = []
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    for (let i = 3; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthPayments = payments.filter(p => {
        const paymentDate = new Date(p.paymentDate)
        return paymentDate.getMonth() === date.getMonth() && 
               paymentDate.getFullYear() === date.getFullYear()
      })
      
      monthlyBreakdown.push({
        month: `${monthNames[date.getMonth()]} ${date.getFullYear()}`,
        earnings: monthPayments.reduce((acc, p) => acc + (p.netAmount || 0), 0),
        jobs: monthPayments.filter(p => p.status === 'completed').length
      })
    }

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

    return NextResponse.json({
      summary,
      payments: periodPayments,
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