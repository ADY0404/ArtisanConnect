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

    await ensureConnection()

    // Update all existing businesses to be approved and public
    // This is a one-time migration for Phase 1 implementation
    const result = await BusinessList.updateMany(
      {
        // Find businesses that don't have the new approval fields set
        $or: [
          { approvalStatus: { $exists: false } },
          { isPublic: { $exists: false } }
        ]
      },
      {
        $set: {
          approvalStatus: 'APPROVED',
          isPublic: true,
          isActive: true,
          adminNotes: 'Auto-approved during Phase 1 migration',
          reviewedBy: session.user.email,
          reviewedAt: new Date()
        }
      }
    )

    console.log(`✅ Migrated ${result.modifiedCount} existing businesses to approved status`)

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${result.modifiedCount} businesses to approved status`,
      modifiedCount: result.modifiedCount
    })
  } catch (error) {
    console.error('❌ Error migrating businesses:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to migrate businesses'
    }, { status: 500 })
  }
} 