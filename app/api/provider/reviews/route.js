import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { ensureConnection } from '@/lib/mongodb'
import { Review } from '@/models/Review'
import BusinessList from '@/models/BusinessList'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Get reviews for the provider
    const reviews = await db.collection('reviews')
      .find({ providerId: session.user.id || session.user.email })
      .sort({ createdAt: -1 })
      .toArray()

    // Calculate review statistics
    const totalReviews = reviews.length
    const averageRating = totalReviews > 0 
      ? reviews.reduce((acc, review) => acc + review.rating, 0) / totalReviews 
      : 0

    const ratingDistribution = reviews.reduce((acc, review) => {
      acc[review.rating] = (acc[review.rating] || 0) + 1
      return acc
    }, { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 })

    const responseRate = totalReviews > 0 
      ? (reviews.filter(r => r.response).length / totalReviews) * 100 
      : 0

    const stats = {
      totalReviews,
      averageRating: averageRating.toFixed(1),
      ratingDistribution,
      responseRate: Math.round(responseRate),
      recentTrend: 'up' // This would be calculated based on recent vs older reviews
    }

    return NextResponse.json({ reviews, stats })

  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
} 