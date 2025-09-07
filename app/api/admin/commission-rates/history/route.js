import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongodb'

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
    const limit = parseInt(searchParams.get('limit')) || 50
    const tier = searchParams.get('tier') // Optional filter by tier

    const { db } = await connectToDatabase()

    // Build query
    const query = {}
    if (tier && ['NEW', 'VERIFIED', 'PREMIUM', 'ENTERPRISE'].includes(tier)) {
      query.tier = tier
    }

    // Get commission rate history
    const history = await db.collection('commission_rate_history')
      .find(query)
      .sort({ changedAt: -1 })
      .limit(limit)
      .toArray()

    // Format the response
    const formattedHistory = history.map(record => ({
      id: record._id.toString(),
      tier: record.tier,
      oldRate: record.oldRate,
      newRate: record.newRate,
      changedBy: record.changedBy,
      changedAt: record.changedAt.toISOString(),
      reason: record.reason || 'No reason provided'
    }))

    return NextResponse.json({
      success: true,
      history: formattedHistory,
      total: formattedHistory.length
    })

  } catch (error) {
    console.error('❌ Error fetching commission rate history:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch commission rate history'
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const { tier, oldRate, newRate, reason } = await request.json()

    // Validation
    if (!tier || !['NEW', 'VERIFIED', 'STANDARD', 'PREMIUM', 'ENTERPRISE'].includes(tier)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid provider tier'
      }, { status: 400 })
    }

    if (typeof oldRate !== 'number' || typeof newRate !== 'number') {
      return NextResponse.json({
        success: false,
        error: 'Invalid rate values'
      }, { status: 400 })
    }

    if (newRate < 5 || newRate > 50) {
      return NextResponse.json({
        success: false,
        error: 'New rate must be between 5% and 50%'
      }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Create history record
    const historyRecord = {
      tier,
      oldRate,
      newRate,
      changedBy: session.user.email,
      changedAt: new Date(),
      reason: reason || 'Manual rate adjustment'
    }

    const result = await db.collection('commission_rate_history').insertOne(historyRecord)

    console.log('✅ Commission rate history recorded:', {
      id: result.insertedId,
      tier,
      oldRate,
      newRate,
      changedBy: session.user.email
    })

    return NextResponse.json({
      success: true,
      message: 'Commission rate history recorded',
      historyId: result.insertedId
    })

  } catch (error) {
    console.error('❌ Error recording commission rate history:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to record commission rate history'
    }, { status: 500 })
  }
}
