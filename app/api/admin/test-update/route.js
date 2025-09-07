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

    const { businessId } = await request.json()

    if (!businessId) {
      return NextResponse.json({
        success: false,
        error: 'Business ID is required'
      }, { status: 400 })
    }

    await ensureConnection()

    console.log(`🧪 TEST: Looking for business ${businessId}`)
    
    // First find the business
    const business = await BusinessList.findById(businessId)
    if (!business) {
      return NextResponse.json({
        success: false,
        error: 'Business not found'
      }, { status: 404 })
    }

    console.log(`🧪 TEST: Found business:`, {
      id: business._id.toString(),
      name: business.name,
      approvalStatus: business.approvalStatus,
      isActive: business.isActive,
      isPublic: business.isPublic
    })

    // Try to update it
    const updateResult = await BusinessList.updateOne(
      { _id: businessId },
      { 
        $set: { 
          approvalStatus: 'APPROVED',
          isActive: true,
          isPublic: true,
          reviewedBy: session.user.email,
          reviewedAt: new Date()
        }
      }
    )

    console.log(`🧪 TEST: Update result:`, updateResult)

    // Check if it was updated
    const updatedBusiness = await BusinessList.findById(businessId)
    console.log(`🧪 TEST: After update:`, {
      id: updatedBusiness._id.toString(),
      name: updatedBusiness.name,
      approvalStatus: updatedBusiness.approvalStatus,
      isActive: updatedBusiness.isActive,
      isPublic: updatedBusiness.isPublic,
      reviewedBy: updatedBusiness.reviewedBy
    })

    return NextResponse.json({
      success: true,
      message: 'Test update completed',
      before: {
        approvalStatus: business.approvalStatus,
        isActive: business.isActive,
        isPublic: business.isPublic
      },
      after: {
        approvalStatus: updatedBusiness.approvalStatus,
        isActive: updatedBusiness.isActive,
        isPublic: updatedBusiness.isPublic,
        reviewedBy: updatedBusiness.reviewedBy
      },
      updateResult
    })
  } catch (error) {
    console.error('🧪 TEST ERROR:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed: ' + error.message
    }, { status: 500 })
  }
} 