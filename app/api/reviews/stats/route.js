import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { connectDB } from '@/lib/mongodb'
import { Review } from '@/models/Review'
import { Database } from '@/lib/database'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const businessId = searchParams.get('businessId')
    
    // Connect to the database
    await connectDB()
    
    // Get review statistics
    let stats = {}
    
    try {
      // Get the reviews collection
      const collection = await Database.getCollection('reviews')
      
      if (businessId) {
        // Get business-specific review statistics (public access)
        const businessReviews = await collection.find({ businessId }).toArray()
        
        const totalReviews = businessReviews.length
        const averageRating = totalReviews > 0 
          ? businessReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
          : 0
        
        const ratingDistribution = {
          5: businessReviews.filter(r => r.rating === 5).length,
          4: businessReviews.filter(r => r.rating === 4).length,
          3: businessReviews.filter(r => r.rating === 3).length,
          2: businessReviews.filter(r => r.rating === 2).length,
          1: businessReviews.filter(r => r.rating === 1).length
        }
        
        stats = {
          totalReviews,
          averageRating: Math.round(averageRating * 10) / 10,
          ratingDistribution,
          businessId
        }
      } else {
        // Get platform-wide review statistics (admin only)
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'ADMIN') {
          return NextResponse.json({ error: 'Admin access required for platform stats' }, { status: 403 })
        }
        
        // Get count of reviews by status
        const flaggedCount = await collection.countDocuments({ status: 'flagged' })
        const pendingCount = await collection.countDocuments({ status: 'pending' })
        const approvedCount = await collection.countDocuments({ status: 'approved' })
        const rejectedCount = await collection.countDocuments({ status: 'rejected' })
        const totalCount = await collection.countDocuments({})
        
        stats = {
          flagged: flaggedCount,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          total: totalCount
        }
      }
    } catch (dbError) {
      console.error('Database error fetching review stats:', dbError)
      
      // Return mock data for development if database is not available
      if (process.env.NODE_ENV !== 'production') {
        if (businessId) {
          stats = {
            totalReviews: 15,
            averageRating: 4.2,
            ratingDistribution: {
              5: 8,
              4: 4,
              3: 2,
              2: 1,
              1: 0
            },
            businessId
          }
        } else {
          stats = {
            flagged: 2,
            pending: 1,
            approved: 1,
            rejected: 1,
            total: 5
          }
        }
      } else {
        throw dbError
      }
    }
    
    return NextResponse.json(stats)
    
  } catch (error) {
    console.error('Error in review stats API:', error)
    return NextResponse.json({ error: 'Failed to fetch review statistics' }, { status: 500 })
  }
} 