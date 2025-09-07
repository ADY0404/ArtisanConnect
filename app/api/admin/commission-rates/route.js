import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
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

    const { db } = await connectToDatabase()

    // Get current commission rates from database
    const commissionConfig = await db.collection('commission_config').findOne({
      type: 'provider_tiers'
    })

    // Default rates if not found in database
    const defaultRates = {
      NEW: 20.0,
      VERIFIED: 18.0,
      PREMIUM: 15.0,
      ENTERPRISE: 12.0
    }

    const rates = commissionConfig?.rates || defaultRates

    return NextResponse.json({
      success: true,
      rates,
      lastUpdated: commissionConfig?.updatedAt || null,
      updatedBy: commissionConfig?.updatedBy || null
    })

  } catch (error) {
    console.error('❌ Error fetching commission rates:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch commission rates'
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const { rates, reason } = await request.json()

    // Validation
    if (!rates || typeof rates !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Invalid rates data'
      }, { status: 400 })
    }

    const validTiers = ['NEW', 'VERIFIED', 'STANDARD', 'PREMIUM', 'ENTERPRISE']
    const invalidTiers = Object.keys(rates).filter(tier => !validTiers.includes(tier))
    
    if (invalidTiers.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Invalid provider tiers: ${invalidTiers.join(', ')}`
      }, { status: 400 })
    }

    // Validate rate values
    const invalidRates = Object.entries(rates).filter(
      ([tier, rate]) => typeof rate !== 'number' || rate < 5 || rate > 50
    )

    if (invalidRates.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Commission rates must be between 5% and 50%'
      }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Get current rates for history tracking
    const currentConfig = await db.collection('commission_config').findOne({
      type: 'provider_tiers'
    })

    const currentRates = currentConfig?.rates || {
      NEW: 20.0,
      VERIFIED: 18.0,
      PREMIUM: 15.0,
      ENTERPRISE: 12.0
    }

    // Update commission rates
    const updateData = {
      type: 'provider_tiers',
      rates,
      updatedAt: new Date(),
      updatedBy: session.user.email,
      reason: reason || 'Admin rate adjustment'
    }

    await db.collection('commission_config').updateOne(
      { type: 'provider_tiers' },
      { $set: updateData },
      { upsert: true }
    )

    // Track rate changes in history
    const changes = []
    Object.keys(rates).forEach(tier => {
      if (currentRates[tier] !== rates[tier]) {
        changes.push({
          tier,
          oldRate: currentRates[tier],
          newRate: rates[tier],
          changedBy: session.user.email,
          changedAt: new Date(),
          reason: reason || 'Admin rate adjustment'
        })
      }
    })

    // Save history if there are changes
    if (changes.length > 0) {
      await db.collection('commission_rate_history').insertMany(changes)
    }

    console.log('✅ Commission rates updated:', {
      updatedBy: session.user.email,
      changes: changes.length,
      newRates: rates
    })

    return NextResponse.json({
      success: true,
      message: 'Commission rates updated successfully',
      rates,
      changesCount: changes.length
    })

  } catch (error) {
    console.error('❌ Error updating commission rates:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update commission rates'
    }, { status: 500 })
  }
}
