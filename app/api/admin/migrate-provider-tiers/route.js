import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { connectToDatabase } from '@/lib/mongodb'
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

    console.log('🔄 Starting provider tier migration...')

    await connectToDatabase()

    // Find all providers without tier properties
    const providersWithoutTiers = await BusinessList.find({
      $or: [
        { providerTier: { $exists: false } },
        { performanceMetrics: { $exists: false } },
        { tierAssignedAt: { $exists: false } }
      ]
    })

    console.log(`📊 Found ${providersWithoutTiers.length} providers needing tier migration`)

    const migrationResults = {
      total: providersWithoutTiers.length,
      migrated: 0,
      errors: [],
      details: []
    }

    const { db } = await connectToDatabase()

    for (const business of providersWithoutTiers) {
      try {
        console.log(`🔧 Migrating provider: ${business.providerEmail}`)

        // Calculate real performance metrics for existing provider
        const completedBookings = await db.collection('bookings').countDocuments({
          providerEmail: business.providerEmail,
          status: 'COMPLETED'
        })

        // Calculate total revenue
        const revenueResult = await db.collection('payment_transactions').aggregate([
          { 
            $match: { 
              providerEmail: business.providerEmail,
              paymentStatus: 'COMPLETED'
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalAmount' }
            }
          }
        ]).toArray()

        const totalRevenue = revenueResult[0]?.totalRevenue || 0
        const averageRating = business.rating || 0
        const accountAgeMonths = Math.floor((new Date() - business.createdAt) / (1000 * 60 * 60 * 24 * 30))
        const isVerified = business.approvalStatus === 'APPROVED'

        // Determine appropriate tier based on existing performance
        let assignedTier = 'NEW'
        
        if (completedBookings >= 100 && 
            averageRating >= 4.8 && 
            totalRevenue >= 20000 &&
            isVerified) {
          assignedTier = 'ENTERPRISE'
        } else if (completedBookings >= 50 && 
                   averageRating >= 4.5 && 
                   totalRevenue >= 10000 &&
                   isVerified) {
          assignedTier = 'PREMIUM'
        } else if (completedBookings >= 10 && 
                   averageRating >= 4.0 && 
                   isVerified) {
          assignedTier = 'VERIFIED'
        }

        // Update the business with tier properties
        const updateData = {
          providerTier: assignedTier,
          tierAssignedAt: new Date(),
          performanceMetrics: {
            completedBookings,
            averageRating,
            totalRevenue,
            accountAgeMonths,
            isVerified,
            lastUpdated: new Date()
          }
        }

        await BusinessList.findByIdAndUpdate(business._id, updateData)

        migrationResults.migrated++
        migrationResults.details.push({
          providerEmail: business.providerEmail,
          assignedTier,
          metrics: {
            completedBookings,
            averageRating,
            totalRevenue,
            accountAgeMonths,
            isVerified
          }
        })

        console.log(`✅ Migrated ${business.providerEmail} to ${assignedTier} tier`)

      } catch (error) {
        console.error(`❌ Error migrating provider ${business.providerEmail}:`, error)
        migrationResults.errors.push({
          providerEmail: business.providerEmail,
          error: error.message
        })
      }
    }

    console.log(`🎉 Migration completed: ${migrationResults.migrated}/${migrationResults.total} providers migrated`)

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${migrationResults.migrated} providers`,
      results: migrationResults
    })

  } catch (error) {
    console.error('❌ Provider tier migration failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error.message
    }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 })
    }

    await connectToDatabase()

    // Check how many providers need migration
    const providersWithoutTiers = await BusinessList.countDocuments({
      $or: [
        { providerTier: { $exists: false } },
        { performanceMetrics: { $exists: false } },
        { tierAssignedAt: { $exists: false } }
      ]
    })

    const totalProviders = await BusinessList.countDocuments({})
    const migratedProviders = totalProviders - providersWithoutTiers

    // Get tier distribution
    const tierDistribution = await BusinessList.aggregate([
      {
        $match: {
          providerTier: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$providerTier',
          count: { $sum: 1 }
        }
      }
    ])

    return NextResponse.json({
      success: true,
      migration: {
        totalProviders,
        migratedProviders,
        needsMigration: providersWithoutTiers,
        migrationComplete: providersWithoutTiers === 0
      },
      tierDistribution: tierDistribution.reduce((acc, item) => {
        acc[item._id] = item.count
        return acc
      }, {})
    })

  } catch (error) {
    console.error('❌ Error checking migration status:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to check migration status'
    }, { status: 500 })
  }
}
