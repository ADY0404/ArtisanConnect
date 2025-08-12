import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ensureConnection } from '@/lib/mongodb'
import BusinessList from '@/models/BusinessList'

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    const { businessId, action, adminNotes } = await request.json()

    if (!businessId || !action) {
      return NextResponse.json({
        success: false,
        error: 'Business ID and action are required'
      }, { status: 400 })
    }

    await ensureConnection()

    const updateData = {
      adminNotes: adminNotes || '',
      reviewedBy: session.user.email,
      reviewedAt: new Date()
    }

    switch (action) {
      case 'approve':
        updateData.approvalStatus = 'APPROVED'
        updateData.isActive = true
        updateData.isPublic = true
        updateData.rejectionReason = '' // Clear any previous rejection reason
        console.log(`✅ Admin ${session.user.email} approved business ${businessId}`)
        break
        
      case 'reject':
        updateData.approvalStatus = 'REJECTED'
        updateData.rejectionReason = adminNotes || 'Business registration rejected'
        updateData.isActive = false
        updateData.isPublic = false
        console.log(`❌ Admin ${session.user.email} rejected business ${businessId}`)
        break
        
      case 'request_documents':
        updateData.approvalStatus = 'NEEDS_DOCUMENTS'
        updateData.isActive = false
        updateData.isPublic = false
        console.log(`📄 Admin ${session.user.email} requested documents for business ${businessId}`)
        break
        
      case 'under_review':
        updateData.approvalStatus = 'UNDER_REVIEW'
        updateData.isActive = false
        updateData.isPublic = false
        console.log(`🔍 Admin ${session.user.email} marked business ${businessId} under review`)
        break
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: approve, reject, request_documents, or under_review'
        }, { status: 400 })
    }

    console.log(`🔄 Updating business ${businessId} with data:`, updateData)
    
    // First, let's check if the business exists
    const existingBusiness = await BusinessList.findById(businessId)
    if (!existingBusiness) {
      console.log(`❌ Business ${businessId} not found`)
      return NextResponse.json({
        success: false,
        error: 'Business not found'
      }, { status: 404 })
    }
    
    console.log(`📋 Found existing business:`, {
      name: existingBusiness.name,
      currentStatus: existingBusiness.approvalStatus,
      isActive: existingBusiness.isActive,
      isPublic: existingBusiness.isPublic
    })

    const business = await BusinessList.findByIdAndUpdate(
      businessId,
      updateData,
      { new: true }
    ).populate('categoryId')

    console.log(`✅ Updated business:`, {
      name: business.name,
      newStatus: business.approvalStatus,
      isActive: business.isActive,
      isPublic: business.isPublic,
      reviewedBy: business.reviewedBy
    })

    // TODO: Send notification email to provider about status change
    // Can be implemented with SendGrid/Nodemailer later

    return NextResponse.json({
      success: true,
      message: `Business ${action}d successfully`,
      business: {
        id: business._id.toString(),
        name: business.name,
        approvalStatus: business.approvalStatus,
        isActive: business.isActive,
        isPublic: business.isPublic,
        adminNotes: business.adminNotes,
        reviewedBy: business.reviewedBy,
        reviewedAt: business.reviewedAt,
        rejectionReason: business.rejectionReason
      }
    })
  } catch (error) {
    console.error('Error updating business approval:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update business approval'
    }, { status: 500 })
  }
} 