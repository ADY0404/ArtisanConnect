import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { connectDB } from '@/lib/mongodb'
import { Review } from '@/models/Review'
import { Database } from '@/lib/database'
import { ObjectId } from 'mongodb'

// GET /api/reviews - Get reviews with optional filtering
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const countOnly = searchParams.get('count_only') === 'true'
    
    // Connect to the database
    await connectDB()
    
    // Build query based on status filter
    let query = {}
    if (status !== 'all') {
      query.status = status
    }
    
    // Fetch reviews
    let reviews = []
    
    try {
      // Get the reviews collection
      const collection = await Database.getCollection('reviews')
      
      // Fetch reviews from the collection
      reviews = await collection.find(query).sort({ createdAt: -1 }).limit(100).toArray()
      
      // If we need to populate business data
      reviews = await Promise.all(reviews.map(async (review) => {
        try {
          // Enhance review with business name if available
          if (review.businessId) {
            const businessCollection = await Database.getCollection('businesslists')
            const business = await businessCollection.findOne({ _id: new ObjectId(review.businessId) })
            if (business) {
              review.businessName = business.name
            }
          }
          return review
        } catch (err) {
          console.error('Error populating business data for review:', err)
          return review
        }
      }))
    } catch (dbError) {
      console.error('Database error fetching reviews:', dbError)
      
      // Return mock data for development if database is not available
      if (process.env.NODE_ENV !== 'production') {
        reviews = getMockReviews(status)
      } else {
        throw dbError
      }
    }
    
    return NextResponse.json({ reviews })
    
  } catch (error) {
    console.error('Error in reviews API:', error)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

// PUT /api/reviews - Update a review's status (approve/reject)
export async function PUT(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is an admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // Parse request body
    const data = await request.json()
    const { reviewId, action, moderationNote } = data
    
    if (!reviewId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Connect to the database
    await connectDB()
    
    try {
      // Get the reviews collection
      const collection = await Database.getCollection('reviews')
      
      // Find the review
      const review = await collection.findOne({ _id: new ObjectId(reviewId) })
      
      if (!review) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 })
      }
      
      // Update the review
      const updateData = {
        $set: {
          updatedAt: new Date()
        }
      }
      
      if (action === 'approve') {
        updateData.$set.status = 'approved'
        updateData.$set.approvedAt = new Date()
        updateData.$set.approvedBy = session.user.id
        if (moderationNote) {
          updateData.$set.moderationNote = moderationNote
        }
      } else if (action === 'reject') {
        updateData.$set.status = 'rejected'
        updateData.$set.rejectedAt = new Date()
        updateData.$set.rejectedBy = session.user.id
        updateData.$set.rejectionReason = moderationNote || 'Rejected by admin'
      }
      
      await collection.updateOne(
        { _id: new ObjectId(reviewId) },
        updateData
      )
      
    } catch (dbError) {
      console.error('Database error updating review:', dbError)
      
      // For development, simulate success if database is not available
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({ success: true, message: 'Review updated (mock)' })
      } else {
        throw dbError
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Review ${action}d successfully` 
    })
    
  } catch (error) {
    console.error('Error in reviews API:', error)
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 })
  }
}

// Helper function to generate mock reviews for development
function getMockReviews(status) {
  const allMockReviews = [
    {
      _id: '1',
      rating: 1,
      comment: "Terrible service, never showed up and was very rude on phone",
      userName: "John Doe",
      userEmail: "john@email.com",
      businessName: "Smith Plumbing",
      businessId: "business1",
      status: "flagged",
      flagReason: "inappropriate content",
      createdAt: "2024-01-15T10:30:00Z",
      flaggedAt: "2024-01-16T14:20:00Z",
      flaggedBy: "user123"
    },
    {
      _id: '2',
      rating: 5,
      comment: "Amazing work! Highly recommend this company for all your electrical needs.",
      userName: "Sarah Johnson",
      userEmail: "sarah@email.com",
      businessName: "Elite Electric",
      businessId: "business2",
      status: "pending",
      createdAt: "2024-01-14T16:45:00Z"
    },
    {
      _id: '3',
      rating: 2,
      comment: "Service was okay but overpriced for what was done. Would not use again.",
      userName: "Michael Brown",
      userEmail: "michael@email.com",
      businessName: "Premium Painters",
      businessId: "business3",
      status: "flagged",
      flagReason: "disputed by business",
      createdAt: "2024-01-10T09:15:00Z",
      flaggedAt: "2024-01-11T11:30:00Z",
      flaggedBy: "business3"
    },
    {
      _id: '4',
      rating: 3,
      comment: "Average service, nothing special but got the job done.",
      userName: "Emma Wilson",
      userEmail: "emma@email.com",
      businessName: "Quick Plumbers",
      businessId: "business4",
      status: "approved",
      createdAt: "2024-01-08T14:20:00Z"
    },
    {
      _id: '5',
      rating: 1,
      comment: "This review contains inappropriate language that violates our terms of service.",
      userName: "Anonymous User",
      userEmail: "anon@email.com",
      businessName: "City Movers",
      businessId: "business5",
      status: "rejected",
      createdAt: "2024-01-05T16:10:00Z",
      rejectedAt: "2024-01-06T09:45:00Z",
      rejectionReason: "violates terms of service"
    }
  ]
  
  // Filter by status if needed
  if (status === 'all') {
    return allMockReviews
  }
  
  return allMockReviews.filter(review => review.status === status)
} 