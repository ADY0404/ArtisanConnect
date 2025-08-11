import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ensureConnection } from '@/lib/mongodb'
import BusinessList from '@/models/BusinessList'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    await ensureConnection()

    console.log(`🔍 Fetching registration status for provider: ${session.user.email}`)

    // Find business registration for this provider
    const business = await BusinessList.findOne({
      providerEmail: session.user.email
    }).populate('categoryId')

    if (!business) {
      console.log(`📋 No business registration found for ${session.user.email}`)
      return NextResponse.json({
        success: true,
        status: {
          approvalStatus: 'NOT_REGISTERED',
          businessExists: false
        }
      })
    }

    console.log(`📋 Found business registration: ${business.name} - Status: ${business.approvalStatus}`)

    return NextResponse.json({
      success: true,
      status: {
        businessExists: true,
        businessId: business._id.toString(),
        businessName: business.name,
        approvalStatus: business.approvalStatus || 'PENDING',
        isActive: business.isActive,
        isPublic: business.isPublic,
        adminNotes: business.adminNotes || '',
        rejectionReason: business.rejectionReason || '',
        reviewedAt: business.reviewedAt,
        reviewedBy: business.reviewedBy || '',
        documentsUploaded: business.documentsUploaded?.length || 0,
        category: business.categoryId ? {
          id: business.categoryId._id.toString(),
          name: business.categoryId.name
        } : null,
        submittedAt: business.createdAt,
        lastUpdated: business.updatedAt
      }
    })
  } catch (error) {
    console.error('❌ Error fetching registration status:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch registration status'
    }, { status: 500 })
  }
} 