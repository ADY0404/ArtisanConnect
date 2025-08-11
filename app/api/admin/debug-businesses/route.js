import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ensureConnection, getDatabase } from '@/lib/mongodb'
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

    // 🔍 DOUBLE CHECK: Compare Mongoose vs Raw MongoDB
    console.log('🔍 DEBUGGING: Comparing Mongoose vs Raw MongoDB data...')

    // Get businesses through Mongoose
    const mongooseBusinesses = await BusinessList.find({})
    .populate('categoryId')
    .sort({ createdAt: -1 })

    console.log(`📋 Mongoose found ${mongooseBusinesses.length} businesses`)
    mongooseBusinesses.slice(0, 3).forEach(b => {
      console.log(`  Mongoose - ${b.name}: approvalStatus=${b.approvalStatus || 'MISSING'}, isPublic=${b.isPublic}`)
    })

    // Get businesses through raw MongoDB
    const db = await getDatabase()
    const rawBusinesses = await db.collection('businesslists').find({}).toArray()
    
    console.log(`📋 Raw MongoDB found ${rawBusinesses.length} businesses`)
    rawBusinesses.slice(0, 3).forEach(b => {
      console.log(`  Raw - ${b.name}: approvalStatus=${b.approvalStatus || 'MISSING'}, isPublic=${b.isPublic}`)
    })

    // Compare collection names being used
    console.log(`🔍 Collection info:`)
    console.log(`  Mongoose collection name: ${BusinessList.collection.collectionName}`)
    console.log(`  Database name: ${db.databaseName}`)
    
    // List all collections in the database
    const collections = await db.listCollections().toArray()
    console.log(`  Available collections: ${collections.map(c => c.name).join(', ')}`)

    return NextResponse.json({
      success: true,
      mongooseCount: mongooseBusinesses.length,
      rawCount: rawBusinesses.length,
      mongooseCollectionName: BusinessList.collection.collectionName,
      databaseName: db.databaseName,
      availableCollections: collections.map(c => c.name),
      breakdown: {
        APPROVED: mongooseBusinesses.filter(b => b.approvalStatus === 'APPROVED').length,
        PENDING: mongooseBusinesses.filter(b => b.approvalStatus === 'PENDING').length,
        UNDER_REVIEW: mongooseBusinesses.filter(b => b.approvalStatus === 'UNDER_REVIEW').length,
        NEEDS_DOCUMENTS: mongooseBusinesses.filter(b => b.approvalStatus === 'NEEDS_DOCUMENTS').length,
        NEEDS_REVIEW: mongooseBusinesses.filter(b => b.approvalStatus === 'NEEDS_REVIEW').length,
        REJECTED: mongooseBusinesses.filter(b => b.approvalStatus === 'REJECTED').length,
        NO_STATUS: mongooseBusinesses.filter(b => !b.approvalStatus).length
      },
      sampleComparison: {
        mongoose: mongooseBusinesses.slice(0, 3).map(b => ({
          id: b._id.toString(),
          name: b.name,
          approvalStatus: b.approvalStatus || 'NO_STATUS',
          isPublic: b.isPublic,
          isActive: b.isActive
        })),
        raw: rawBusinesses.slice(0, 3).map(b => ({
          id: b._id.toString(),
          name: b.name,
          approvalStatus: b.approvalStatus || 'NO_STATUS',
          isPublic: b.isPublic,
          isActive: b.isActive
        }))
      }
    })
  } catch (error) {
    console.error('Error debugging businesses:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to debug businesses'
    }, { status: 500 })
  }
} 