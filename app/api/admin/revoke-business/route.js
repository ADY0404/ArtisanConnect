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

    const { businessId, reason, notifyProvider } = await request.json()

    if (!businessId || !reason) {
      return NextResponse.json({
        success: false,
        error: 'Business ID and reason are required'
      }, { status: 400 })
    }

    await ensureConnection()

    // Get the business first to verify it exists and is approved
    const business = await BusinessList.findById(businessId)
    if (!business) {
      return NextResponse.json({
        success: false,
        error: 'Business not found'
      }, { status: 404 })
    }

    if (business.approvalStatus !== 'APPROVED') {
      return NextResponse.json({
        success: false,
        error: 'Business is not currently approved'
      }, { status: 400 })
    }

    // Create audit trail entry
    const auditEntry = {
      action: 'REVOKE_APPROVAL',
      performedBy: session.user.email,
      performedAt: new Date(),
      reason: reason,
      previousStatus: business.approvalStatus,
      businessData: {
        name: business.name,
        providerEmail: business.providerEmail,
        categoryId: business.categoryId
      }
    }

    // Update business status
    const updateData = {
      approvalStatus: 'REVOKED',
      isActive: false,
      isPublic: false,
      rejectionReason: reason,
      reviewedBy: session.user.email,
      reviewedAt: new Date(),
      revokedAt: new Date(),
      revokedBy: session.user.email,
      revokeReason: reason,
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
        error: 'Failed to revoke business approval'
      }, { status: 500 })
    }

    console.log(`🚫 Admin ${session.user.email} revoked approval for business ${businessId}`)
    console.log(`📝 Reason: ${reason}`)

    // TODO: Send notification email to provider if requested
    if (notifyProvider) {
      try {
        // Import notification service
        const { NotificationService } = await import('@/app/_services/NotificationService')
        
        await NotificationService.sendBusinessRevocationNotification({
          email: business.providerEmail,
          name: business.contactPerson || 'Provider'
        }, {
          businessName: business.name,
          reason: reason,
          revokedAt: new Date(),
          revokedBy: session.user.email
        })
        
        console.log(`📧 Revocation notification sent to ${business.providerEmail}`)
      } catch (emailError) {
        console.error('❌ Failed to send revocation notification:', emailError)
        // Don't fail the main operation if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Business approval revoked successfully',
      business: {
        id: result._id,
        name: result.name,
        approvalStatus: result.approvalStatus,
        revokedAt: result.revokedAt,
        revokeReason: result.revokeReason
      },
      auditTrail: auditEntry
    })

  } catch (error) {
    console.error('❌ Error revoking business approval:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to revoke business approval',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// GET endpoint to retrieve revocation history
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

    // Get revoked businesses with pagination
    const revokedBusinesses = await BusinessList.find({
      approvalStatus: 'REVOKED'
    })
    .populate('categoryId')
    .sort({ revokedAt: -1 })
    .skip(skip)
    .limit(limit)

    const totalRevoked = await BusinessList.countDocuments({
      approvalStatus: 'REVOKED'
    })

    const formattedBusinesses = revokedBusinesses.map(business => ({
      id: business._id,
      name: business.name,
      providerEmail: business.providerEmail,
      category: business.categoryId?.name || 'Unknown',
      revokedAt: business.revokedAt,
      revokedBy: business.revokedBy,
      revokeReason: business.revokeReason,
      originalApprovalDate: business.reviewedAt,
      auditTrail: business.auditTrail || []
    }))

    return NextResponse.json({
      success: true,
      businesses: formattedBusinesses,
      pagination: {
        page,
        limit,
        total: totalRevoked,
        totalPages: Math.ceil(totalRevoked / limit)
      }
    })

  } catch (error) {
    console.error('❌ Error fetching revoked businesses:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch revoked businesses'
    }, { status: 500 })
  }
}
