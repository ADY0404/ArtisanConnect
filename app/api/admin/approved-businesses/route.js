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

    // Get all approved businesses
    const businesses = await BusinessList.find({
      approvalStatus: 'APPROVED'
    })
    .populate('categoryId')
    .sort({ reviewedAt: -1 })

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
        approvalStatus: business.approvalStatus,
        adminNotes: business.adminNotes || '',
        reviewedBy: business.reviewedBy || '',
        reviewedAt: business.reviewedAt,
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
    console.error('Error fetching approved businesses:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch approved businesses'
    }, { status: 500 })
  }
} 