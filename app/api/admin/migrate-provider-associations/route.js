import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongodb'

export async function POST(request) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    console.log('🔄 Starting provider-business association migration...')

    await connectToDatabase()
    const { db } = await import('@/lib/mongodb')
    const database = await db()

    // Get all businesses that don't have providerEmail field
    const businessesWithoutProvider = await database.collection('businesslists')
      .find({
        $or: [
          { providerEmail: { $exists: false } },
          { providerEmail: null },
          { providerEmail: '' }
        ]
      })
      .toArray()

    console.log(`📊 Found ${businessesWithoutProvider.length} businesses without proper provider association`)

    let migrated = 0
    let skipped = 0
    const results = []

    for (const business of businessesWithoutProvider) {
      let providerEmail = null

      // Try to determine provider email from existing fields
      if (business.email && business.email.includes('@')) {
        providerEmail = business.email
      } else if (business.contactPerson && business.contactPerson.includes('@')) {
        providerEmail = business.contactPerson
      } else if (business.owner?.email) {
        providerEmail = business.owner.email
      }

      if (providerEmail) {
        // Update the business with provider association
        const updateResult = await database.collection('businesslists').updateOne(
          { _id: business._id },
          {
            $set: {
              providerEmail: providerEmail,
              createdBy: providerEmail,
              isActive: business.isActive !== undefined ? business.isActive : true,
              updatedAt: new Date()
            }
          }
        )

        if (updateResult.modifiedCount > 0) {
          // Also update the user record to include this business
          await database.collection('users').updateOne(
            { email: providerEmail },
            {
              $addToSet: {
                businessIds: business._id,
                businesses: {
                  businessId: business._id.toString(),
                  businessName: business.name,
                  role: 'owner',
                  createdAt: new Date()
                }
              },
              $set: {
                isProvider: true,
                lastUpdated: new Date()
              }
            },
            { upsert: true }
          )

          migrated++
          results.push({
            businessId: business._id.toString(),
            businessName: business.name,
            providerEmail: providerEmail,
            status: 'migrated'
          })

          console.log(`✅ Migrated business: ${business.name} -> ${providerEmail}`)
        }
      } else {
        skipped++
        results.push({
          businessId: business._id.toString(),
          businessName: business.name,
          status: 'skipped - no provider email found'
        })

        console.log(`⚠️ Skipped business: ${business.name} - no provider email found`)
      }
    }

    console.log(`🏁 Migration complete: ${migrated} migrated, ${skipped} skipped`)

    return NextResponse.json({
      success: true,
      summary: {
        total: businessesWithoutProvider.length,
        migrated,
        skipped
      },
      results
    })

  } catch (error) {
    console.error('❌ Migration error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    await connectToDatabase()
    const { db } = await import('@/lib/mongodb')
    const database = await db()

    // Get migration status
    const totalBusinesses = await database.collection('businesslists').countDocuments()
    
    const businessesWithProvider = await database.collection('businesslists').countDocuments({
      providerEmail: { $exists: true, $ne: null, $ne: '' }
    })

    const businessesWithoutProvider = await database.collection('businesslists').countDocuments({
      $or: [
        { providerEmail: { $exists: false } },
        { providerEmail: null },
        { providerEmail: '' }
      ]
    })

    return NextResponse.json({
      success: true,
      status: {
        totalBusinesses,
        businessesWithProvider,
        businessesWithoutProvider,
        migrationNeeded: businessesWithoutProvider > 0
      }
    })

  } catch (error) {
    console.error('❌ Status check error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 