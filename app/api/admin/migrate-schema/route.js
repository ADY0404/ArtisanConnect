import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ensureConnection, getDatabase } from '@/lib/mongodb'
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

    console.log('🔄 Starting TARGETED migration for collection name fix...')

    // Get direct database access
    const db = await getDatabase()
    
    // Check what collections exist
    const collections = await db.listCollections().toArray()
    console.log(`📋 Available collections: ${collections.map(c => c.name).join(', ')}`)
    
    // Target the correct collection (lowercase)
    const collection = db.collection('businesslists')
    
    // First, let's see what we have BEFORE migration
    const beforeMigration = await collection.find({}).toArray()
    console.log(`📋 BEFORE MIGRATION: Found ${beforeMigration.length} businesses in 'businesslists'`)
    beforeMigration.slice(0, 3).forEach(b => {
      console.log(`  - ${b.name}: approvalStatus=${b.approvalStatus || 'MISSING'}, isPublic=${b.isPublic}`)
    })

    // Check what Mongoose sees
    console.log(`🔍 Mongoose collection name: ${BusinessList.collection.collectionName}`)
    const mongooseBusinesses = await BusinessList.find({}).limit(3)
    console.log(`📋 Mongoose sees ${mongooseBusinesses.length} businesses`)
    mongooseBusinesses.forEach(b => {
      console.log(`  Mongoose - ${b.name}: approvalStatus=${b.approvalStatus || 'MISSING'}, isPublic=${b.isPublic}`)
    })

    // Force update ALL businesses using direct MongoDB operation
    console.log('🔄 Applying migration using direct MongoDB updateMany...')
    const updateResult = await collection.updateMany(
      {}, // Update ALL documents
      {
        $set: {
          approvalStatus: 'NEEDS_REVIEW',
          isPublic: false,
          adminNotes: '',
          reviewedBy: '',
          rejectionReason: '',
          documentsUploaded: [],
          'guarantorInfo.name': '',
          'guarantorInfo.phone': '',
          'guarantorInfo.relationship': '',
          'guarantorInfo.ghanaCardNumber': ''
        }
      }
    )

    console.log(`📋 Direct MongoDB Update Result:`, {
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount,
      acknowledged: updateResult.acknowledged
    })

    // Verify using raw MongoDB
    const afterMigrationRaw = await collection.find({}).toArray()
    console.log(`📋 AFTER MIGRATION (Raw): Found ${afterMigrationRaw.length} businesses`)
    afterMigrationRaw.slice(0, 3).forEach(b => {
      console.log(`  Raw - ${b.name}: approvalStatus=${b.approvalStatus}, isPublic=${b.isPublic}`)
    })

    // Verify using Mongoose (should now see the changes)
    const afterMigrationMongoose = await BusinessList.find({}).limit(3)
    console.log(`📋 AFTER MIGRATION (Mongoose): Found ${afterMigrationMongoose.length} businesses`)
    afterMigrationMongoose.forEach(b => {
      console.log(`  Mongoose - ${b.name}: approvalStatus=${b.approvalStatus}, isPublic=${b.isPublic}`)
    })

    return NextResponse.json({
      success: true,
      message: 'Targeted migration completed successfully',
      results: {
        collectionsFound: collections.map(c => c.name),
        mongooseCollectionName: BusinessList.collection.collectionName,
        targetCollection: 'businesslists',
        totalBusinesses: beforeMigration.length,
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount,
        beforeSample: beforeMigration.slice(0, 3).map(b => ({
          name: b.name,
          approvalStatus: b.approvalStatus || 'MISSING',
          isPublic: b.isPublic
        })),
        afterSampleRaw: afterMigrationRaw.slice(0, 3).map(b => ({
          name: b.name,
          approvalStatus: b.approvalStatus,
          isPublic: b.isPublic
        })),
        afterSampleMongoose: afterMigrationMongoose.map(b => ({
          name: b.name,
          approvalStatus: b.approvalStatus,
          isPublic: b.isPublic
        }))
      }
    })
  } catch (error) {
    console.error('❌ Targeted migration failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Targeted migration failed: ' + error.message
    }, { status: 500 })
  }
} 