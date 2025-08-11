import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectToDatabase } from '@/lib/mongodb'
import { authOptions } from '../../../../auth/[...nextauth]/route'

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewId } = params
    const { reply } = await request.json()

    if (!reply || !reply.trim()) {
      return NextResponse.json({ error: 'Reply text is required' }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Update the review with the provider's response
    const result = await db.collection('reviews').updateOne(
      { 
        id: reviewId,
        providerId: session.user.id || session.user.email
      },
      {
        $set: {
          response: {
            text: reply.trim(),
            date: new Date().toISOString().split('T')[0],
            providerName: session.user.name
          },
          updatedAt: new Date()
        }
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Review not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Reply posted successfully'
    })

  } catch (error) {
    console.error('Error posting review reply:', error)
    return NextResponse.json(
      { error: 'Failed to post reply' },
      { status: 500 }
    )
  }
} 