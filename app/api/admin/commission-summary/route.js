import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Database } from '@/lib/database'
import { PaymentTransaction } from '@/models/PaymentTransaction'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    // Optional date range
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // High-level commission summary from transactions
    const summaryCore = await PaymentTransaction.getCommissionSummary({ startDate, endDate })

    // Compute provider counts and overdue providers
    const collection = await Database.getCollection('payment_transactions')

    const overdueAgg = await collection.aggregate([
      {
        $match: {
          paymentMethod: 'CASH',
          commissionStatus: { $in: ['PENDING', 'OVERDUE'] }
        }
      },
      {
        $group: {
          _id: '$providerEmail',
          totalOwed: { $sum: '$commissionOwed' },
          lastTx: { $max: '$createdAt' }
        }
      }
    ]).toArray()

    const overdueProviders = overdueAgg.filter(p => p.totalOwed > 0).length

    // Count unique providers overall (by business owner)
    let totalProviders = 0
    try {
      const businessCollection = await Database.getCollection('businesslists')
      totalProviders = await businessCollection.distinct('providerEmail').then(list => list.length)
    } catch (e) {
      totalProviders = 0
    }

    // Recent commission-impacting transactions (latest 10) with provider names
    const recentTransactions = await collection
      .find({})
      .project({
        providerEmail: 1,
        totalAmount: 1,
        platformCommission: 1,
        paymentMethod: 1,
        commissionStatus: 1,
        createdAt: 1
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    // Get provider names for transactions
    const providerEmails = [...new Set(recentTransactions.map(t => t.providerEmail))]
    const businessCollection = await Database.getCollection('businesslists')
    const providers = await businessCollection.find({
      providerEmail: { $in: providerEmails }
    }).project({
      providerEmail: 1,
      contactPerson: 1,
      name: 1
    }).toArray()

    const providerMap = Object.fromEntries(
      providers.map(p => [p.providerEmail, { name: p.contactPerson || p.name, businessName: p.name }])
    )

    // Compose response
    const summary = {
      totalCommissionEarned: summaryCore.totalCommissionEarned || 0,
      totalCommissionOwed: summaryCore.totalCommissionOwed || 0,
      totalTransactions: summaryCore.totalTransactions || 0,
      totalVolume: summaryCore.totalVolume || 0,
      paystackTransactions: summaryCore.paystackTransactions || 0,
      cashTransactions: summaryCore.cashTransactions || 0,
      totalProviders,
      overdueProviders,
      recentTransactions: recentTransactions.map(t => {
        const provider = providerMap[t.providerEmail] || {}
        return {
          id: t._id?.toString(),
          providerEmail: t.providerEmail,
          providerName: provider.name || 'Unknown Provider',
          businessName: provider.businessName || '',
          amount: t.platformCommission,
          totalAmount: t.totalAmount,
          paymentMethod: t.paymentMethod,
          status: t.commissionStatus,
          createdAt: t.createdAt
        }
      })
    }

    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error('❌ Error building admin commission summary:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}


