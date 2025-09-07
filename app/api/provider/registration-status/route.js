import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ensureConnection } from '@/lib/mongodb'
import BusinessList from '@/models/BusinessList'
import Category from '@/models/Category' // Import Category model to register it

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

    // Ensure models are registered
    console.log('📋 Ensuring models are registered...')
    console.log('BusinessList model registered:', !!BusinessList)
    console.log('Category model registered:', !!Category)

    console.log(`🔍 Fetching registration status for provider: ${session.user.email}`)

    // Find business registration for this provider
    let business
    try {
      console.log('🔍 Attempting to find business with category populate...')
      business = await BusinessList.findOne({
        providerEmail: session.user.email
      }).populate('categoryId')
      console.log('✅ Business found with populate:', business ? 'Yes' : 'No')
      if (business && business.categoryId) {
        console.log('📂 Category populated:', business.categoryId.name || 'Category data available')
      }
    } catch (populateError) {
      console.warn('⚠️ Populate failed, fetching without category details:', populateError.message)
      console.warn('Stack trace:', populateError.stack)
      // Fallback: fetch without populate if Category model has issues
      try {
        business = await BusinessList.findOne({
          providerEmail: session.user.email
        })
        console.log('✅ Business found without populate:', business ? 'Yes' : 'No')
      } catch (fallbackError) {
        console.error('❌ Even fallback query failed:', fallbackError.message)
        throw fallbackError
      }
    }

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
        category: business.categoryId ? (
          typeof business.categoryId === 'object' && business.categoryId.name ? {
            id: business.categoryId._id.toString(),
            name: business.categoryId.name
          } : {
            id: business.categoryId.toString(),
            name: 'Category details not available'
          }
        ) : null,
        submittedAt: business.createdAt,
        lastUpdated: business.updatedAt
      }
    })
  } catch (error) {
    console.error('❌ Error fetching registration status:', error)
    console.error('Error stack:', error.stack)

    // Provide more specific error information
    let errorMessage = 'Failed to fetch registration status'
    if (error.message.includes('Schema hasn\'t been registered')) {
      errorMessage = 'Database model registration error. Please try again.'
    } else if (error.message.includes('Connection')) {
      errorMessage = 'Database connection error. Please try again.'
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
} 