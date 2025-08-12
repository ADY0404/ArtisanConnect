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
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    await ensureConnection()

    // Get businesses that need approval - excludes approved businesses
    console.log('🔍 Fetching businesses with query...')
    const businesses = await BusinessList.find({
      $or: [
        // New businesses that are pending
        { approvalStatus: 'PENDING' },
        { approvalStatus: 'UNDER_REVIEW' },
        { approvalStatus: 'NEEDS_DOCUMENTS' },
        { approvalStatus: 'NEEDS_REVIEW' }, // Added this for migrated businesses
        // Existing businesses that don't have approval status set (need migration)
        { approvalStatus: { $exists: false } },
        // Businesses that were rejected and might be resubmitted
        { approvalStatus: 'REJECTED' }
      ]
    })
    .populate('categoryId')
    .sort({ createdAt: -1 })
    
    console.log(`📋 Raw query results: ${businesses.length} businesses found`)
    businesses.forEach(b => {
      console.log(`  - ${b.name}: status=${b.approvalStatus || 'NO_STATUS'}, active=${b.isActive}, public=${b.isPublic}`)
    })

    return NextResponse.json({
      success: true,
      businesses: businesses.map(business => ({
        id: business._id.toString(),
        name: business.name,
        about: business.about,
        address: business.address,
        contactPerson: business.contactPerson,
        email: business.email,
        phone: business.phone,
        experience: business.experience,
        specializations: business.specializations || [],
        certifications: business.certifications || [],
        documentsUploaded: business.documentsUploaded || [],
        guarantorInfo: business.guarantorInfo || {},
        approvalStatus: business.approvalStatus || 'NEEDS_REVIEW', // For existing businesses
        adminNotes: business.adminNotes || '',
        reviewedBy: business.reviewedBy || '',
        reviewedAt: business.reviewedAt,
        rejectionReason: business.rejectionReason || '',
        isActive: business.isActive,
        isPublic: business.isPublic,
        providerEmail: business.providerEmail,
        createdAt: business.createdAt,
        category: business.categoryId ? {
          id: business.categoryId._id.toString(),
          name: business.categoryId.name,
          backgroundColor: business.categoryId.backgroundColor,
          icon: business.categoryId.icon
        } : null
      }))
    })
  } catch (error) {
    console.error('Error fetching pending businesses:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch pending businesses'
    }, { status: 500 })
  }
} 