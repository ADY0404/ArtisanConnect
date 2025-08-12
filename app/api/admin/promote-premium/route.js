import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ensureConnection } from '@/lib/mongodb'
import BusinessList from '@/models/BusinessList'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const { businessId, reason } = await request.json()

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: 'Business ID is required'
      }, { status: 400 })
    }

    await ensureConnection()

    // Get the business first to verify it exists
    const business = await BusinessList.findById(businessId)
    if (!business) {
      return NextResponse.json({
        success: false,
        error: 'Business not found'
      }, { status: 404 })
    }

    // Check if business is approved
    if (business.approvalStatus !== 'APPROVED') {
      return NextResponse.json({
        success: false,
        error: 'Business must be approved before premium promotion'
      }, { status: 400 })
    }

    // Check if already premium
    if (business.isPremiumProvider) {
      return NextResponse.json({
        success: false,
        error: 'Business is already a premium provider'
      }, { status: 400 })
    }

    // Create audit trail entry
    const auditEntry = {
      action: 'PROMOTE_TO_PREMIUM',
      performedBy: session.user.email,
      performedAt: new Date(),
      reason: reason || 'Admin promotion to premium tier',
      previousTier: business.providerTier,
      newTier: 'PREMIUM'
    }

    // Update business to premium
    const updateData = {
      providerTier: 'PREMIUM',
      isPremiumProvider: true,
      premiumPromotedAt: new Date(),
      premiumPromotedBy: session.user.email,
      tierAssignedAt: new Date(),
      // Add audit trail
      $push: {
        auditTrail: auditEntry
      }
    }

    const result = await BusinessList.findByIdAndUpdate(
      businessId,
      updateData,
      { new: true }
    )

    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Failed to promote to premium'
      }, { status: 500 })
    }

    console.log(`⭐ Admin ${session.user.email} promoted business ${businessId} to PREMIUM`)
    console.log(`📝 Reason: ${reason || 'No reason provided'}`)

    // TODO: Send notification email to provider
    try {
      const { NotificationService } = await import('@/app/_services/NotificationService')
      
      await NotificationService.sendPremiumPromotionNotification({
        email: business.providerEmail,
        name: business.contactPerson || 'Provider'
      }, {
        businessName: business.name,
        promotedAt: new Date(),
        promotedBy: session.user.email,
        newCommissionRate: '15%', // Premium rate
        benefits: [
          'Reduced commission rate (15% instead of 18%)',
          'Priority listing in search results',
          'Premium badge on business profile',
          'Enhanced customer support'
        ]
      })
      
      console.log(`📧 Premium promotion notification sent to ${business.providerEmail}`)
    } catch (emailError) {
      console.error('❌ Failed to send promotion notification:', emailError)
      // Don't fail the main operation if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Business promoted to premium successfully',
      business: {
        id: result._id,
        name: result.name,
        providerTier: result.providerTier,
        isPremiumProvider: result.isPremiumProvider,
        premiumPromotedAt: result.premiumPromotedAt,
        premiumPromotedBy: result.premiumPromotedBy
      },
      auditTrail: auditEntry
    })

  } catch (error) {
    console.error('❌ Error promoting to premium:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to promote to premium',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// POST endpoint for demoting from premium
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    const reason = searchParams.get('reason')

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: 'Business ID is required'
      }, { status: 400 })
    }

    await ensureConnection()

    // Get the business first to verify it exists
    const business = await BusinessList.findById(businessId)
    if (!business) {
      return NextResponse.json({
        success: false,
        error: 'Business not found'
      }, { status: 404 })
    }

    // Check if currently premium
    if (!business.isPremiumProvider) {
      return NextResponse.json({
        success: false,
        error: 'Business is not currently a premium provider'
      }, { status: 400 })
    }

    // Create audit trail entry
    const auditEntry = {
      action: 'DEMOTE_FROM_PREMIUM',
      performedBy: session.user.email,
      performedAt: new Date(),
      reason: reason || 'Admin demotion from premium tier',
      previousTier: business.providerTier,
      newTier: 'STANDARD'
    }

    // Update business to standard
    const updateData = {
      providerTier: 'STANDARD',
      isPremiumProvider: false,
      premiumPromotedAt: null,
      premiumPromotedBy: null,
      tierAssignedAt: new Date(),
      // Add audit trail
      $push: {
        auditTrail: auditEntry
      }
    }

    const result = await BusinessList.findByIdAndUpdate(
      businessId,
      updateData,
      { new: true }
    )

    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Failed to demote from premium'
      }, { status: 500 })
    }

    console.log(`📉 Admin ${session.user.email} demoted business ${businessId} from PREMIUM`)
    console.log(`📝 Reason: ${reason || 'No reason provided'}`)

    return NextResponse.json({
      success: true,
      message: 'Business demoted from premium successfully',
      business: {
        id: result._id,
        name: result.name,
        providerTier: result.providerTier,
        isPremiumProvider: result.isPremiumProvider
      },
      auditTrail: auditEntry
    })

  } catch (error) {
    console.error('❌ Error demoting from premium:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to demote from premium',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// GET endpoint to list premium providers
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Get premium providers
    const premiumProviders = await BusinessList.find({
      isPremiumProvider: true,
      approvalStatus: 'APPROVED'
    })
    .populate('categoryId')
    .sort({ premiumPromotedAt: -1 })
    .skip(skip)
    .limit(limit)

    const totalPremium = await BusinessList.countDocuments({
      isPremiumProvider: true,
      approvalStatus: 'APPROVED'
    })

    const formattedProviders = premiumProviders.map(business => ({
      id: business._id,
      name: business.name,
      providerEmail: business.providerEmail,
      category: business.categoryId?.name || 'Unknown',
      premiumPromotedAt: business.premiumPromotedAt,
      premiumPromotedBy: business.premiumPromotedBy,
      rating: business.rating,
      totalReviews: business.totalReviews,
      isActive: business.isActive
    }))

    return NextResponse.json({
      success: true,
      providers: formattedProviders,
      pagination: {
        page,
        limit,
        total: totalPremium,
        totalPages: Math.ceil(totalPremium / limit)
      }
    })

  } catch (error) {
    console.error('❌ Error fetching premium providers:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch premium providers'
    }, { status: 500 })
  }
}
