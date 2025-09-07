import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { CommissionService } from '@/app/_services/CommissionService'
import { connectToDatabase } from '@/lib/mongodb'
import BusinessList from '@/models/BusinessList'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { providerEmail, forceUpdate } = await request.json()
    
    // Only allow providers to update their own tier, or admins to update any tier
    if (session.user.role !== 'ADMIN' && session.user.email !== providerEmail) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized to update this provider tier'
      }, { status: 403 })
    }

    const targetEmail = providerEmail || session.user.email

    console.log(`🔄 Updating provider tier for: ${targetEmail}`)

    // Get current tier
    const business = await BusinessList.findOne({
      providerEmail: targetEmail
    })

    if (!business) {
      return NextResponse.json({
        success: false,
        error: 'Provider business not found'
      }, { status: 404 })
    }

    // ✅ HANDLE EXISTING PROVIDERS WITHOUT TIER PROPERTIES
    const oldTier = business.providerTier || 'STANDARD'

    // If provider doesn't have tier properties, initialize them
    if (!business.providerTier || !business.performanceMetrics) {
      console.log(`🔧 Initializing tier properties for existing provider: ${targetEmail}`)

      await BusinessList.findByIdAndUpdate(business._id, {
        providerTier: 'STANDARD',
        tierAssignedAt: new Date(),
        performanceMetrics: {
          completedBookings: 0,
          averageRating: business.rating || 0,
          totalRevenue: 0,
          accountAgeMonths: Math.floor((new Date() - business.createdAt) / (1000 * 60 * 60 * 24 * 30)),
          isVerified: business.approvalStatus === 'APPROVED',
          lastUpdated: new Date()
        }
      })

      console.log(`✅ Initialized tier properties for ${targetEmail}`)
    }

    // Determine new tier (this will also update the database)
    const newTier = await CommissionService.determineProviderTier(targetEmail)

    // Get updated business data
    const updatedBusiness = await BusinessList.findOne({ 
      providerEmail: targetEmail 
    })

    const tierChanged = oldTier !== newTier

    console.log(`✅ Provider tier update completed:`, {
      providerEmail: targetEmail,
      oldTier,
      newTier,
      tierChanged,
      performanceMetrics: updatedBusiness.performanceMetrics
    })

    return NextResponse.json({
      success: true,
      tierChanged,
      oldTier,
      newTier,
      performanceMetrics: updatedBusiness.performanceMetrics,
      message: tierChanged 
        ? `Provider tier updated from ${oldTier} to ${newTier}` 
        : `Provider tier remains ${newTier}`
    })

  } catch (error) {
    console.error('❌ Error updating provider tier:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update provider tier'
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const providerEmail = searchParams.get('providerEmail')
    
    // Only allow providers to view their own tier, or admins to view any tier
    if (session.user.role !== 'ADMIN' && session.user.email !== providerEmail) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized to view this provider tier'
      }, { status: 403 })
    }

    const targetEmail = providerEmail || session.user.email

    const business = await BusinessList.findOne({ 
      providerEmail: targetEmail 
    })

    if (!business) {
      return NextResponse.json({
        success: false,
        error: 'Provider business not found'
      }, { status: 404 })
    }

    // Calculate tier eligibility without updating
    const { db } = await connectToDatabase()
    
    // Get performance data
    const completedBookings = await db.collection('bookings').countDocuments({
      providerEmail: targetEmail,
      status: 'COMPLETED'
    })
    
    const revenueResult = await db.collection('payment_transactions').aggregate([
      { 
        $match: { 
          providerEmail: targetEmail,
          paymentStatus: 'COMPLETED'
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' }
        }
      }
    ]).toArray()
    
    const totalRevenue = revenueResult[0]?.totalRevenue || 0
    const averageRating = business.rating || 0
    const accountAgeMonths = Math.floor((new Date() - business.createdAt) / (1000 * 60 * 60 * 24 * 30))
    const isVerified = business.approvalStatus === 'APPROVED'

    // Calculate tier requirements
    const tierRequirements = {
      VERIFIED: {
        completedBookings: 10,
        averageRating: 4.0,
        isVerified: true,
        eligible: completedBookings >= 10 && averageRating >= 4.0 && isVerified
      },
      PREMIUM: {
        completedBookings: 50,
        averageRating: 4.5,
        totalRevenue: 10000,
        isVerified: true,
        eligible: completedBookings >= 50 && averageRating >= 4.5 && totalRevenue >= 10000 && isVerified
      },
      ENTERPRISE: {
        completedBookings: 100,
        averageRating: 4.8,
        totalRevenue: 20000,
        isVerified: true,
        eligible: completedBookings >= 100 && averageRating >= 4.8 && totalRevenue >= 20000 && isVerified
      }
    }

    return NextResponse.json({
      success: true,
      currentTier: business.providerTier,
      tierAssignedAt: business.tierAssignedAt,
      performanceMetrics: {
        completedBookings,
        averageRating,
        totalRevenue,
        accountAgeMonths,
        isVerified
      },
      tierRequirements,
      commissionRate: await CommissionService.getCommissionRate(business.providerTier)
    })

  } catch (error) {
    console.error('❌ Error fetching provider tier info:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch provider tier information'
    }, { status: 500 })
  }
}
