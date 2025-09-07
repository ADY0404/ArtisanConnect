import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { Database } from '@/lib/database'
import BusinessList from '@/models/BusinessList'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    const businessCollection = await Database.getCollection('businesslists')
    const txCollection = await Database.getCollection('payment_transactions')

    // Get all providers (by business) with tier and contact
    const businesses = await businessCollection.find({}).project({
      providerEmail: 1,
      contactPerson: 1,
      phone: 1,
      email: 1,
      providerTier: 1,
      createdAt: 1
    }).toArray()

    // Aggregate commission owed and earned per provider
    const owedAgg = await txCollection.aggregate([
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
          lastPayment: { $max: '$commissionPaidDate' },
          transactionCount: { $sum: 1 },
          overdue: { $sum: { $cond: [{ $eq: ['$commissionStatus', 'OVERDUE'] }, 1, 0] } }
        }
      }
    ]).toArray()

    const earnedAgg = await txCollection.aggregate([
      {
        $group: {
          _id: '$providerEmail',
          totalEarned: { $sum: '$providerPayout' }
        }
      }
    ]).toArray()

    const owedByEmail = Object.fromEntries(owedAgg.map(o => [o._id, o]))
    const earnedByEmail = Object.fromEntries(earnedAgg.map(e => [e._id, e]))

    // Compose provider list
    const providers = businesses.map(b => {
      const owed = owedByEmail[b.providerEmail] || {}
      const earned = earnedByEmail[b.providerEmail] || {}
      return {
        id: b._id?.toString(),
        name: b.contactPerson || b.providerEmail,
        email: b.email || b.providerEmail,
        phone: b.phone || '',
        tier: b.providerTier || 'STANDARD',
        totalOwed: owed.totalOwed || 0,
        totalEarned: earned.totalEarned || 0,
        transactionCount: owed.transactionCount || 0,
        status: (owed.overdue || 0) > 0 ? 'OVERDUE' : ((owed.totalOwed || 0) > 0 ? 'PENDING' : 'CURRENT'),
        lastPayment: owed.lastPayment || null,
        joinDate: b.createdAt
      }
    })

    return NextResponse.json({ success: true, providers })
  } catch (error) {
    console.error('❌ Error building providers with commission:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}


